/**
 * 网站设置 API（singleton）
 *
 * - GET /api/admin/settings   需登录。返回 { data, sha, path }。
 * - PUT /api/admin/settings   需登录 + CSRF。整体替换 site-settings.json（带 existingSha 冲突检测）。
 *
 * 设计依据：Spec v2 FR-7 / AC-5。site-settings.json 不进 Content Collection，
 * 路径 src/content/data/site-settings.json（PREFIX_SETTINGS 前缀）。
 */
import { jsonError, jsonOk, withApiGuard } from "../../../../lib/api-guard";
import {
	COMMIT_MESSAGES,
	GitHubError,
	PREFIX_SETTINGS,
	createOrUpdateFile,
	getFileInfo,
} from "../../../../lib/github";
import { SITE_SETTINGS_SCHEMA, type SiteSettings } from "../../../../lib/schemas";

export const prerender = false;

const SETTINGS_PATH = `${PREFIX_SETTINGS}site-settings.json`;

function githubErrorResponse(e: unknown): Response {
	if (e instanceof GitHubError) {
		return jsonError(e.message, e.kind, e.status);
	}
	const msg = e instanceof Error ? e.message : String(e);
	return jsonError(`服务器错误：${msg}`, "github_other", 500);
}

// ============== GET ==============
async function read(): Promise<Response> {
	const info = await getFileInfo(SETTINGS_PATH);
	if (!info) {
		return jsonError(
			"site-settings.json 不存在。请先在 GitHub 创建该文件。",
			"github_not_found",
			404,
		);
	}
	let data: unknown;
	try {
		data = JSON.parse(info.content);
	} catch {
		return jsonError(
			"site-settings.json 解析失败：JSON 格式错误。",
			"schema_error",
			422,
		);
	}
	const parsed = SITE_SETTINGS_SCHEMA.safeParse(data);
	if (!parsed.success) {
		// 不阻断读取：返回原始 data 但附带 schema 警告，便于管理员修复
		return jsonOk({
			ok: true,
			path: info.path,
			sha: info.sha,
			data,
			schemaWarning: parsed.error.issues
				.map((i) => `${i.path.join(".")}: ${i.message}`)
				.join("; "),
		});
	}
	return jsonOk({
		ok: true,
		path: info.path,
		sha: info.sha,
		data: parsed.data as SiteSettings,
	});
}

// ============== PUT ==============
async function update({
	body,
}: {
	body: { data: SiteSettings; existingSha?: string };
}): Promise<Response> {
	if (!body || !body.data) {
		return jsonError("缺少 data 字段。", "schema_error", 422);
	}
	const parsed = SITE_SETTINGS_SCHEMA.safeParse(body.data);
	if (!parsed.success) {
		return jsonError(
			`数据校验失败：${parsed.error.issues
				.map((i) => `${i.path.join(".")}: ${i.message}`)
				.join("; ")}`,
			"schema_error",
			422,
		);
	}
	const settings = parsed.data;
	const existingSha = body.existingSha;
	if (!existingSha) {
		return jsonError(
			"更新必须提供 existingSha。",
			"github_conflict",
			400,
		);
	}

	// 读取当前 SHA 做冲突检测
	const current = await getFileInfo(SETTINGS_PATH);
	if (!current) {
		return jsonError(
			"site-settings.json 不存在，无法更新。",
			"github_not_found",
			404,
		);
	}
	if (existingSha !== current.sha) {
		return jsonError(
			"existingSha 已过期，请刷新后重试。",
			"github_conflict",
			409,
		);
	}

	// 规范化写入：2-space 缩进 + 末尾换行
	const content = `${JSON.stringify(settings, null, 2)}\n`;
	try {
		const res = await createOrUpdateFile({
			path: SETTINGS_PATH,
			content,
			message: COMMIT_MESSAGES.updateSettings,
			existingSha,
		});
		return jsonOk({
			ok: true,
			path: res.path,
			sha: res.sha,
			commitSha: res.commitSha,
		});
	} catch (e) {
		return githubErrorResponse(e);
	}
}

// ============== 路由 ==============
export const GET = withApiGuard({ auth: true, csrf: false }, async () => {
	return await read();
});

export const PUT = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		let body: unknown = null;
		try {
			body = await ctx.request.json();
		} catch {
			return jsonError("请求体格式错误。", "BAD_JSON", 400);
		}
		return await update({ body: body as { data: SiteSettings; existingSha?: string } });
	},
);
