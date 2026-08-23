/**
 * 撤销发布（已发布 → 草稿，原子 commit）
 *
 * - POST /api/admin/posts/[slug]/unpublish  需登录 + CSRF。
 *   Body: { existingSha?: string }（可选）
 *   行为：读取 post/<slug>.md 内容 → commitMultipleFiles delete post/ + create drafts/
 *   返回：{ ok, slug, status: 'draft', sha, commitSha, moved: true }
 *
 * 设计依据：Spec v2 AC-4 / FR-4。
 */
import { jsonError, jsonOk, withApiGuard } from "../../../../../lib/api-guard";
import {
	COMMIT_MESSAGES,
	GitHubError,
	commitMultipleFiles,
} from "../../../../../lib/github";
import { findPost, postPath } from "../../../../../lib/posts";

export const prerender = false;

function githubErrorResponse(e: unknown): Response {
	if (e instanceof GitHubError) {
		return jsonError(e.message, e.kind, e.status);
	}
	const msg = e instanceof Error ? e.message : String(e);
	return jsonError(`服务器错误：${msg}`, "github_other", 500);
}

export const POST = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		const slug = ctx.params.slug;
		if (!slug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);

		const found = await findPost(slug);
		if (!found) {
			return jsonError("文章不存在。", "github_not_found", 404);
		}
		if (found.status !== "published") {
			return jsonError(
				"该文章已是草稿状态，无需撤销发布。",
				"github_conflict",
				409,
			);
		}

		let providedSha: string | undefined = undefined;
		try {
			const body = (await ctx.request.json()) as { existingSha?: string };
			providedSha = body?.existingSha;
		} catch {
			// 允许空 body
		}
		if (providedSha && providedSha !== found.info.sha) {
			return jsonError(
				"existingSha 已过期，请刷新后重试。",
				"github_conflict",
				409,
			);
		}

		const oldPath = postPath(slug, "published");
		const newPath = postPath(slug, "draft");
		const content = found.info.content;

		try {
			const res = await commitMultipleFiles(
				[{ path: newPath, content }],
				COMMIT_MESSAGES.unpublishToDraft(slug),
				{ deletePaths: [oldPath] },
			);
			return jsonOk({
				ok: true,
				slug,
				status: "draft" as const,
				path: newPath,
				sha: res.files[0]?.sha ?? "",
				commitSha: res.commitSha,
				moved: true,
			});
		} catch (e) {
			return githubErrorResponse(e);
		}
	},
);
