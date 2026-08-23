/**
 * 图片列表 API（Phase 8 Task 8.1）
 *
 * - GET /api/admin/images  需登录。返回 uploads/ 下所有图片（递归）。
 *
 * 设计依据：Spec v2 FR-11 / AC-10。
 *
 * 返回结构：
 *   { ok: true, items: [{ path, name, sha, size, url, date }] }
 * 其中 url 为公开站可访问的 /assets/images/uploads/... 路径。
 */
import { jsonError, jsonOk, withApiGuard } from "../../../../lib/api-guard";
import { GitHubError, PREFIX_IMAGE, listFilesInFolder } from "../../../../lib/github";

export const prerender = false;

async function list(): Promise<Response> {
	try {
		const files = await listFilesInFolder(PREFIX_IMAGE, { recursive: true });
		const items = files.map((f) => {
			// 从路径中提取 YYYY-MM-DD（如果有）
			// 路径示例：public/assets/images/uploads/2026-08-23/abc.jpg
			const relPath = f.path.slice(PREFIX_IMAGE.length); // 2026-08-23/abc.jpg
			const slashIdx = relPath.indexOf("/");
			const date = slashIdx > 0 ? relPath.slice(0, slashIdx) : "";
			const publicUrl = `/${f.path.replace(/^public\//, "")}`;
			return {
				path: f.path,
				name: f.name,
				sha: f.sha,
				size: f.size,
				url: publicUrl,
				date,
			};
		});
		// 按日期+文件名倒序（最新的在前）
		items.sort((a, b) => {
			if (a.date !== b.date) return (b.date ?? "").localeCompare(a.date ?? "");
			return (b.name ?? "").localeCompare(a.name ?? "");
		});
		return jsonOk({ ok: true, items });
	} catch (e) {
		if (e instanceof GitHubError) {
			return jsonError(e.message, e.kind, e.status);
		}
		const msg = e instanceof Error ? e.message : String(e);
		return jsonError(`服务器错误：${msg}`, "github_other", 500);
	}
}

export const GET = withApiGuard({ auth: true, csrf: false }, async () => {
	return await list();
});
