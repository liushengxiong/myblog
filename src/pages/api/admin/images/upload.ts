/**
 * 图片上传 API（Phase 8 Task 8.1）
 *
 * - POST /api/admin/images/upload  需登录 + CSRF。multipart/form-data。
 *
 * 设计依据：Spec v2 FR-11 / AC-10。
 *
 * 流程：
 *  1. Content-Length ≤ 5MB → 超限 413 file_too_large。
 *  2. 读取文件头 Magic bytes 判定 MIME，不信任 filename 扩展名。
 *     允许 MIME：image/jpeg, image/png, image/webp, image/gif。
 *  3. 服务端生成文件名：${Date.now().toString(36)}-${randomHex(6)}.${extFromMime}（ASCII only）。
 *  4. 固定路径 public/assets/images/uploads/YYYY-MM-DD/<name>.<ext>，不允许用户控制。
 *  5. validateRepoPath 白名单检查。
 *  6. 转 Base64 → github.uploadBinaryImage → 成功返回 { ok:true, url, sha, path }。
 *
 * 安全：
 *  - 不在本地磁盘写持久化文件。
 *  - 文件名由服务端生成，不信任客户端。
 *  - MIME 走 magic bytes 二次校验，扩展名仅用于命名后缀。
 */
import { jsonError, jsonOk, withApiGuard } from "../../../../lib/api-guard";
import {
	GitHubError,
	PREFIX_IMAGE,
	uploadBinaryImage,
} from "../../../../lib/github";

export const prerender = false;

// ============== 常量 ==============

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
};

const ALLOWED_MIMES = Object.keys(ALLOWED_MIME_TO_EXT);

// ============== Magic bytes 判定 ==============

/**
 * 读取文件头前 16 字节判定 MIME 类型。不信任 Content-Type 头，也不信任文件扩展名。
 * 参考：https://en.wikipedia.org/wiki/List_of_file_signatures
 */
function detectMime(bytes: Uint8Array): string | null {
	if (bytes.length < 4) return null;
	// JPEG: FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return "image/jpeg";
	}
	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return "image/png";
	}
	// GIF: 47 49 46 38 (GIF8)
	if (
		bytes[0] === 0x47 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x38 &&
		(bytes[4] === 0x37 || bytes[4] === 0x39) // 7 or 9 → GIF87a / GIF89a
	) {
		return "image/gif";
	}
	// WebP: RIFF....WEBP
	// 12 字节：52 49 46 46 ?? ?? ?? ?? 57 45 42 50
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return "image/webp";
	}
	return null;
}

// ============== 服务端生成文件名 ==============

function randomHex(len: number): string {
	const bytes = new Uint8Array(len);
	// 使用 Web Crypto（Vercel Node 18+ 全局可用）
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		crypto.getRandomValues(bytes);
	} else {
		// 兜底（仅当 Web Crypto 不可用时）
		for (let i = 0; i < len; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}
	}
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function generateFileName(mime: string): string {
	const ext = ALLOWED_MIME_TO_EXT[mime] ?? "bin";
	const ts = Date.now().toString(36);
	const rand = randomHex(6); // 12 位十六进制
	return `${ts}-${rand}.${ext}`;
}

function todayISODate(): string {
	return new Date().toISOString().slice(0, 10); // YYYY-MM-DD（UTC）
}

// ============== POST upload ==============

async function upload({ ctx }: { ctx: import("astro").APIContext }): Promise<Response> {
	const req = ctx.request;

	// 1) Content-Length 校验（提前阻断超限，避免读完 body）
	const contentLengthHeader = req.headers.get("content-length");
	if (contentLengthHeader) {
		const cl = Number.parseInt(contentLengthHeader, 10);
		if (Number.isFinite(cl) && cl > MAX_BYTES) {
			return jsonError(
				`文件过大，最大允许 ${Math.floor(MAX_BYTES / 1024 / 1024)}MB。`,
				"file_too_large",
				413,
			);
		}
	}

	// 2) multipart/form-data 解析（Node 18+ Request.formData 原生）
	let form: FormData;
	try {
		form = await req.formData();
	} catch {
		return jsonError(
			"请求体不是合法的 multipart/form-data。",
			"BAD_FORMDATA",
			400,
		);
	}

	const file = form.get("file");
	if (!file || !(file instanceof File)) {
		return jsonError('缺少 "file" 字段或不是文件。', "schema_error", 422);
	}

	// 3) 文件大小校验（以实际 bytes 为准）
	if (file.size > MAX_BYTES) {
		return jsonError(
			`文件过大（${file.size} 字节），最大允许 ${Math.floor(MAX_BYTES / 1024 / 1024)}MB。`,
			"file_too_large",
			413,
		);
	}
	if (file.size === 0) {
		return jsonError("文件为空。", "schema_error", 422);
	}

	// 4) 读取字节并判定 magic bytes
	const arrayBuffer = await file.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);
	const detectedMime = detectMime(bytes);
	if (!detectedMime || !ALLOWED_MIMES.includes(detectedMime)) {
		return jsonError(
			`不允许的文件类型（仅接受 ${ALLOWED_MIMES.join(" / ")}）。`,
			"invalid_mime",
			400,
		);
	}

	// 5) 服务端生成文件名（不信任客户端 filename）
	const fileName = generateFileName(detectedMime);
	const today = todayISODate();
	const targetPath = `${PREFIX_IMAGE}${today}/${fileName}`;

	// 6) validateRepoPath 已在 uploadBinaryImage 内部强制执行；额外做一次幂等校验
	if (!targetPath.startsWith(PREFIX_IMAGE)) {
		// 理论上不可能触发，防御性
		return jsonError("目标路径非法。", "invalid_path", 400);
	}

	// 7) 写入 GitHub
	try {
		const res = await uploadBinaryImage(targetPath, bytes);
		// 公开 URL（Vercel 静态资源路径，从 /assets/... 开始）
		const publicUrl = `/${targetPath.replace(/^public\//, "")}`;
		return jsonOk({
			ok: true,
			url: publicUrl,
			path: res.path,
			sha: res.sha,
			commitSha: res.commitSha,
			mime: detectedMime,
			size: file.size,
		});
	} catch (e) {
		if (e instanceof GitHubError) {
			return jsonError(e.message, e.kind, e.status);
		}
		const msg = e instanceof Error ? e.message : String(e);
		return jsonError(`上传失败：${msg}`, "github_other", 500);
	}
}

// ============== 路由 ==============

export const POST = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => await upload({ ctx }),
);
