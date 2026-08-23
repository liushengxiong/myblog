/**
 * 博客文章路径与查询 helpers
 *
 * 设计依据：Spec v2 FR-4 / FR-9 / AC-4。
 *
 * 关键点：
 *  - slug 不写进 frontmatter；状态用目录区分（post/ = published；post/drafts/ = draft）。
 *  - 跨目录 move = delete old + create new，原子 commit（commitMultipleFiles）。
 *  - slug 重复检测：post/ 与 drafts/ 两路径同时检查。
 */
import {
	PREFIX_POST,
	PREFIX_DRAFT,
	listFilesInFolder,
	getFileInfo,
	validateSlug,
} from "./github";

export type PostStatus = "draft" | "published";

export type PostListItem = {
	slug: string;
	status: PostStatus;
	path: string;
	sha: string;
	/** frontmatter 字段（在 list 接口中通过解析 .md 提取） */
	title?: string;
	description?: string;
	dateFormatted?: string;
	locale?: "zh" | "en";
	tags?: string[];
	featured?: boolean;
};

/** 拼接文章仓库路径 */
export function postPath(slug: string, status: PostStatus): string {
	const s = validateSlug(slug);
	return status === "draft" ? `${PREFIX_DRAFT}${s}.md` : `${PREFIX_POST}${s}.md`;
}

/**
 * 通过 slug 查找文章（同时检查 post/ 与 drafts/）。
 * 返回 { status, info } 或 null（不存在）。
 */
export async function findPost(
	slug: string,
): Promise<{ status: PostStatus; info: NonNullable<Awaited<ReturnType<typeof getFileInfo>>> } | null> {
	const s = validateSlug(slug);
	const draftPath = postPath(s, "draft");
	const publishedPath = postPath(s, "published");

	const draft = await getFileInfo(draftPath);
	if (draft) return { status: "draft", info: draft };

	const published = await getFileInfo(publishedPath);
	if (published) return { status: "published", info: published };

	return null;
}

/**
 * 列出所有文章（含已发布 + 草稿），通过递归列出 post/ 目录获取。
 * 每条返回 { slug, status, sha, path }；frontmatter 由调用方按需 parse。
 *
 * 当 opts.withMeta = true 时，会额外读取每个文件内容并解析 frontmatter
 * 填充 title/description/dateFormatted/locale/tags/featured 字段。
 * 适合 Admin 列表展示（文章数量有限，N+1 读可接受）。
 */
export async function listAllPostFiles(
	opts: { withMeta?: boolean } = {},
): Promise<PostListItem[]> {
	const files = await listFilesInFolder(PREFIX_POST, { recursive: true });
	const out: PostListItem[] = [];
	for (const f of files) {
		// 仅接受 .md 文件
		if (!f.path.endsWith(".md")) continue;
		const rel = f.path.slice(PREFIX_POST.length);
		const isDraft = rel.startsWith("drafts/");
		const slug = isDraft
			? rel.slice("drafts/".length).replace(/\.md$/, "")
			: rel.replace(/\.md$/, "");
		// 跳过非 slug 文件（防止 drafts/.gitkeep 等）
		try {
			validateSlug(slug);
		} catch {
			continue;
		}
		const item: PostListItem = {
			slug,
			status: isDraft ? "draft" : "published",
			path: f.path,
			sha: f.sha,
		};
		if (opts.withMeta) {
			const info = await getFileInfo(f.path);
			if (info) {
				try {
					// 动态导入避免循环依赖
					const { parseFrontmatter } = await import("./markdown");
					const r = parseFrontmatter(info.content);
					item.title = r.frontmatter.title;
					item.description = r.frontmatter.description;
					item.dateFormatted = r.frontmatter.dateFormatted;
					item.locale = r.frontmatter.locale;
					item.tags = r.frontmatter.tags;
					item.featured = r.frontmatter.featured;
				} catch {
					// frontmatter 解析失败时仅留空，列表仍可显示 slug
				}
			}
		}
		out.push(item);
	}
	return out;
}

/**
 * 检查 slug 是否已被占用（同时检查 post/ 与 drafts/）。
 */
export async function slugExists(slug: string): Promise<{
	exists: boolean;
	status?: PostStatus;
}> {
	const found = await findPost(slug);
	return found
		? { exists: true, status: found.status }
		: { exists: false };
}
