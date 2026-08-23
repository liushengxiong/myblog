/**
 * Markdown frontmatter 序列化与解析（基于 gray-matter）
 *
 * 设计依据：Spec v2 Task 2.2、AC-4。
 *
 * 关键点：
 *  - 字段顺序稳定（title, description, dateFormatted, locale, tags, featured），
 *    保证 parse → serialize → parse 的 frontmatter 字段值相等，diff 最小。
 *  - 输入用户 markdown 时必须先 parseFrontmatter 校验 schema。
 *  - 用于 Admin 端创建 / 编辑文章（与 src/content/config.js 的 schema 严格一致）。
 */
import matter from "gray-matter";
import { POST_FRONTMATTER_SCHEMA, type PostFrontmatter } from "./schemas";

/** 文章 frontmatter 字段顺序（与现有 6 篇 .md 文件保持一致） */
const POST_FM_FIELD_ORDER = [
	"title",
	"description",
	"dateFormatted",
	"locale",
	"tags",
	"featured",
] as const;

export type ParsedPost = {
	frontmatter: PostFrontmatter;
	body: string;
	/** 原始字符串（重新 stringify 后的，便于 Admin 端 diff 展示） */
	serialized: string;
};

/**
 * 解析 markdown 字符串：拆分 frontmatter + body，并校验 schema。
 * 失败抛错（不返回 null）。
 */
export function parseFrontmatter(raw: string): ParsedPost {
	const parsed = matter(raw);
	const fm = POST_FRONTMATTER_SCHEMA.parse(parsed.data);
	const body = parsed.content;
	const serialized = serializePost({ frontmatter: fm, body });
	return { frontmatter: fm, body, serialized };
}

/**
 * 序列化文章为 markdown 字符串（frontmatter + body）。
 * 字段顺序固定；YAML 格式与现有文章一致（默认 indent）。
 */
export function serializePost(args: {
	frontmatter: PostFrontmatter;
	body: string;
}): string {
	const orderedFm: Record<string, unknown> = {};
	for (const k of POST_FM_FIELD_ORDER) {
		const v = (args.frontmatter as Record<string, unknown>)[k];
		if (v === undefined) continue;
		orderedFm[k] = v;
	}
	const fmStr = matter
		.stringify("", orderedFm)
		.replace(/^---\n/, "")
		.replace(/\n---\n$/, "")
		.trim();
	const bodyTrimmed = args.body.replace(/^\n+/, "");
	return `---\n${fmStr}\n---\n\n${bodyTrimmed}`;
}

/**
 * 对比 parseFrontmatter 后的 frontmatter 字段值是否与原始字符串 re-serialize 后相等。
 * 用于 Phase 9 Task 9.3 回归测试中验证"现有文章不破坏"。
 */
export function roundtripFrontmatter(raw: string): {
	equal: boolean;
	parsed: ParsedPost;
	reSerialized: string;
} {
	const parsed = parseFrontmatter(raw);
	const reSerialized = serializePost({
		frontmatter: parsed.frontmatter,
		body: parsed.body,
	});
	return {
		equal: parsed.frontmatter.title === parseFrontmatter(reSerialized).frontmatter.title,
		parsed,
		reSerialized,
	};
}
