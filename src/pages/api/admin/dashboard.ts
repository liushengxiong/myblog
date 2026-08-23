/**
 * Dashboard 端点（Task 7.3）
 *
 * - GET /api/admin/dashboard  需登录。返回 KPI 汇总 + 最近 commits。
 *   {
 *     posts: { published: number, draft: number, total: number },
 *     tools: number,
 *     projects: number,
 *     resources: number,
 *     recentCommits: [{ sha, message, date, author }]
 *   }
 *
 * 设计依据：Spec v2 Task 7.3 / Task 7.4。UI 在 Phase 7 填充。
 */
import { jsonError, jsonOk, withApiGuard } from "../../../lib/api-guard";
import { GitHubError, listRecentCommits } from "../../../lib/github";
import { listAllPostFiles } from "../../../lib/posts";
import { listDataItems } from "../../../lib/data-items";
import {
	PREFIX_PROJECTS,
	PREFIX_RESOURCES,
	PREFIX_TOOLS,
} from "../../../lib/github";
import {
	PROJECT_SCHEMA,
	RESOURCE_SCHEMA,
	TOOL_SCHEMA,
} from "../../../lib/schemas";

export const prerender = false;

export const GET = withApiGuard({ auth: true, csrf: false }, async () => {
	try {
		// 并行拉取所有 KPI 数据
		const [posts, tools, projects, resources, recentCommits] =
			await Promise.all([
				listAllPostFiles({ withMeta: false }),
				listDataItems(PREFIX_TOOLS, { schema: TOOL_SCHEMA }).catch(() => []),
				listDataItems(PREFIX_PROJECTS, { schema: PROJECT_SCHEMA }).catch(() => []),
				listDataItems(PREFIX_RESOURCES, { schema: RESOURCE_SCHEMA }).catch(() => []),
				listRecentCommits(10).catch(() => []),
			]);

		const published = posts.filter((p) => p.status === "published").length;
		const draft = posts.filter((p) => p.status === "draft").length;

		return jsonOk({
			ok: true,
			posts: {
				published,
				draft,
				total: posts.length,
			},
			tools: tools.length,
			projects: projects.length,
			resources: resources.length,
			recentCommits,
		});
	} catch (e) {
		if (e instanceof GitHubError) {
			return jsonError(e.message, e.kind, e.status);
		}
		const msg = e instanceof Error ? e.message : String(e);
		return jsonError(`服务器错误：${msg}`, "github_other", 500);
	}
});
