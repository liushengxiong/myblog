/**
 * 单篇文章 API
 *
 * - GET    /api/admin/posts/[slug]  需登录。返回 { slug, status, sha, frontmatter, body }。
 * - PUT    /api/admin/posts/[slug]  需登录 + CSRF。更新文章（含跨目录 move / 状态切换）。
 * - DELETE /api/admin/posts/[slug]  需登录 + CSRF。删除文章。
 *
 * PUT 支持的变更：
 *  1. 仅内容变更（slug + status 不变）：createOrUpdateFile(existingSha)
 *  2. slug 变更（draft 间或 published 间）：commitMultipleFiles deletePaths=[oldPath] + entries=[newPath]
 *  3. 状态切换（draft → published 或反向）：commitMultipleFiles 跨目录 move
 * 全部为单次原子 commit。
 *
 * 设计依据：Spec v2 FR-4 / AC-4。
 */
import type { APIContext } from "astro";
import { jsonError, jsonOk, withApiGuard } from "../../../../../lib/api-guard";
import {
	COMMIT_MESSAGES,
	GitHubError,
	commitMultipleFiles,
	createOrUpdateFile,
	deleteFile,
} from "../../../../../lib/github";
import { findPost, postPath, slugExists } from "../../../../../lib/posts";
import {
	POST_FRONTMATTER_SCHEMA,
	POST_INPUT_SCHEMA,
	type PostInput,
} from "../../../../../lib/schemas";
import { serializePost } from "../../../../../lib/markdown";

export const prerender = false;

function githubErrorResponse(e: unknown): Response {
	if (e instanceof GitHubError) {
		return jsonError(e.message, e.kind, e.status);
	}
	const msg = e instanceof Error ? e.message : String(e);
	return jsonError(`服务器错误：${msg}`, "github_other", 500);
}

// ============== GET ==============
async function readOne({ slug }: { slug: string }): Promise<Response> {
	const found = await findPost(slug);
	if (!found) {
		return jsonError("文章不存在。", "github_not_found", 404);
	}
	// 解析 frontmatter + body
	let parsed: { frontmatter: unknown; body: string } | null = null;
	try {
		const { parseFrontmatter } = await import("../../../../../lib/markdown");
		const r = parseFrontmatter(found.info.content);
		parsed = { frontmatter: r.frontmatter, body: r.body };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return jsonError(
			`frontmatter 解析失败：${msg}`,
			"schema_error",
			422,
		);
	}
	return jsonOk({
		ok: true,
		slug,
		status: found.status,
		path: found.info.path,
		sha: found.info.sha,
		frontmatter: parsed.frontmatter,
		body: parsed.body,
	});
}

// ============== PUT ==============
async function update({
	oldSlug,
	body,
}: {
	oldSlug: string;
	body: PostInput;
}): Promise<Response> {
	const parsed = POST_INPUT_SCHEMA.safeParse(body);
	if (!parsed.success) {
		return jsonError(
			`数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
			"schema_error",
			422,
		);
	}
	const input = parsed.data;
	const newSlug = input.slug;
	const newStatus = input.status ?? "published";

	// 校验 URL 中的 oldSlug 必须存在
	const found = await findPost(oldSlug);
	if (!found) {
		return jsonError(
			"原文章不存在，无法更新。",
			"github_not_found",
			404,
		);
	}
	const oldStatus = found.status;
	const oldSha = found.info.sha;
	const providedSha = input.existingSha;

	// SHA 必须提供，且必须等于当前文件 SHA
	if (!providedSha) {
		return jsonError(
			"更新必须提供 existingSha。",
			"github_conflict",
			400,
		);
	}
	if (providedSha !== oldSha) {
		return jsonError(
			"existingSha 已过期，请刷新后重试。",
			"github_conflict",
			409,
		);
	}

	// 如果 newSlug 与 oldSlug 不同，需要检查 newSlug 是否已被占用
	const slugChanged = newSlug !== oldSlug;
	const statusChanged = newStatus !== oldStatus;
	if (slugChanged) {
		const occ = await slugExists(newSlug);
		if (occ.exists) {
			return jsonError(
				`新 slug "${newSlug}" 已被占用（状态：${occ.status}）。`,
				"github_conflict",
				409,
			);
		}
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

	const oldPath = postPath(oldSlug, oldStatus);
	const newPath = postPath(newSlug, newStatus);

	try {
		// 场景 1：路径不变 → 直接 update
		if (!slugChanged && !statusChanged) {
			const res = await createOrUpdateFile({
				path: newPath,
				content,
				message: COMMIT_MESSAGES.updatePost(newSlug),
				existingSha: providedSha,
			});
			return jsonOk({
				ok: true,
				slug: newSlug,
				status: newStatus,
				path: res.path,
				sha: res.sha,
				commitSha: res.commitSha,
				moved: false,
			});
		}

		// 场景 2：路径或状态变化 → 跨目录 move（delete + create 单 commit）
		const message = slugChanged
			? statusChanged
				? COMMIT_MESSAGES.updatePost(`${oldSlug} → ${newStatus}/${newSlug}`)
				: COMMIT_MESSAGES.updatePost(`${oldSlug} → ${newSlug}`)
			: statusChanged
				? newStatus === "published"
					? COMMIT_MESSAGES.publishDraft(newSlug)
					: COMMIT_MESSAGES.unpublishToDraft(newSlug)
				: COMMIT_MESSAGES.updatePost(newSlug);
		const res = await commitMultipleFiles(
			[{ path: newPath, content }],
			message,
			{ deletePaths: [oldPath] },
		);
		return jsonOk({
			ok: true,
			slug: newSlug,
			status: newStatus,
			path: newPath,
			sha: res.files[0]?.sha ?? "",
			commitSha: res.commitSha,
			moved: true,
		});
	} catch (e) {
		return githubErrorResponse(e);
	}
}

// ============== DELETE ==============
async function remove({
	slug,
	existingSha,
}: {
	slug: string;
	existingSha?: string;
}): Promise<Response> {
	const found = await findPost(slug);
	if (!found) {
		return jsonError("文章不存在。", "github_not_found", 404);
	}
	if (!existingSha) {
		return jsonError("删除必须提供 existingSha。", "github_conflict", 400);
	}
	if (existingSha !== found.info.sha) {
		return jsonError(
			"existingSha 已过期，请刷新后重试。",
			"github_conflict",
			409,
		);
	}
	try {
		const res = await deleteFile(
			found.info.path,
			COMMIT_MESSAGES.deletePost(slug),
			existingSha,
		);
		return jsonOk({
			ok: true,
			slug,
			commitSha: res.commitSha,
		});
	} catch (e) {
		return githubErrorResponse(e);
	}
}

// ============== 路由 ==============
export const GET = withApiGuard({ auth: true, csrf: false }, async ({ ctx }) => {
	const slug = ctx.params.slug;
	if (!slug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);
	return await readOne({ slug });
});

export const PUT = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		const oldSlug = ctx.params.slug;
		if (!oldSlug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);
		let body: unknown = null;
		try {
			body = await ctx.request.json();
		} catch {
			return jsonError("请求体格式错误。", "BAD_JSON", 400);
		}
		return await update({ oldSlug, body: body as PostInput });
	},
);

export const DELETE = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		const slug = ctx.params.slug;
		if (!slug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);
		const existingSha = ctx.url.searchParams.get("sha") || undefined;
		return await remove({ slug, existingSha });
	},
);
