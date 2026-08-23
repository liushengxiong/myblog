/**
 * 博客文章列表 / 创建 API
 *
 * - GET  /api/admin/posts        需登录。返回 [{slug, status, sha, frontmatter}]。
 * - POST /api/admin/posts        需登录 + CSRF。创建文章（含 status: 'draft'|'published'）。
 *
 * 设计依据：Spec v2 FR-4 / AC-4。
 */
import type { APIContext } from "astro";
import { jsonError, jsonOk, withApiGuard } from "../../../../lib/api-guard";
import {
	COMMIT_MESSAGES,
	GitHubError,
	createOrUpdateFile,
} from "../../../../lib/github";
import { listAllPostFiles, postPath, slugExists } from "../../../../lib/posts";
import {
	POST_INPUT_SCHEMA,
	POST_FRONTMATTER_SCHEMA,
	type PostInput,
} from "../../../../lib/schemas";
import { parseFrontmatter, serializePost } from "../../../../lib/markdown";

export const prerender = false;

// ============== GET list ==============
async function list(ctx: APIContext): Promise<Response> {
	void ctx;
	const files = await listAllPostFiles();
	const items = files.map((f) => ({
		slug: f.slug,
		status: f.status,
		sha: f.sha,
		path: f.path,
		// list 接口不解析 frontmatter（前端按需 read 单条详情）
	}));
	return jsonOk({ ok: true, items });
}

// ============== POST create ==============
async function create({ body }: { body: PostInput }): Promise<Response> {
	const parsed = POST_INPUT_SCHEMA.safeParse(body);
	if (!parsed.success) {
		return jsonError(
			`数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
			"schema_error",
			422,
		);
	}
	const input = parsed.data;
	const status = input.status ?? "published";

	// slug 冲突检测：post/ + drafts/ 同时检查
	const occupied = await slugExists(input.slug);
	if (occupied.exists) {
		return jsonError(
			`slug 已被占用（状态：${occupied.status}）。请换一个 slug。`,
			"github_conflict",
			409,
		);
	}

	// 校验 frontmatter
	const fmResult = POST_FRONTMATTER_SCHEMA.safeParse({
		title: input.title,
		description: input.description,
		dateFormatted: input.dateFormatted,
		locale: input.locale,
		tags: input.tags,
		featured: input.featured,
	});
	if (!fmResult.success) {
		return jsonError(
			`frontmatter 校验失败：${fmResult.error.issues.map((i) => i.message).join("; ")}`,
			"schema_error",
			422,
		);
	}
	const frontmatter = fmResult.data;
	const content = serializePost({ frontmatter, body: input.body });
	const targetPath = postPath(input.slug, status);
	const message =
		status === "draft"
			? COMMIT_MESSAGES.createPost(`draft/${input.slug}`)
			: COMMIT_MESSAGES.createPost(input.slug);

	try {
		const res = await createOrUpdateFile({
			path: targetPath,
			content,
			message,
		});
		return jsonOk({
			ok: true,
			slug: input.slug,
			status,
			path: res.path,
			sha: res.sha,
			commitSha: res.commitSha,
		});
	} catch (e) {
		return handleGitHubError(e);
	}
}

function handleGitHubError(e: unknown): Response {
	if (e instanceof GitHubError) {
		return jsonError(e.message, e.kind, e.status);
	}
	const msg = e instanceof Error ? e.message : String(e);
	return jsonError(`服务器错误：${msg}`, "github_other", 500);
}

// ============== 路由 ==============
export const GET = withApiGuard({ auth: true, csrf: false }, async ({ ctx }) => {
	return await list(ctx);
});

export const POST = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		let body: unknown = null;
		try {
			body = await ctx.request.json();
		} catch {
			return jsonError("请求体格式错误。", "BAD_JSON", 400);
		}
		return await create({ body: body as PostInput });
	},
);

// parseFrontmatter 用于 list 接口可扩展（暂保留以备 Admin 端扩展字段）
void parseFrontmatter;
