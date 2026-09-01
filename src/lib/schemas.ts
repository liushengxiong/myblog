/**
 * Zod schemas（与 Astro 4 Content Collection schema 严格一致）
 *
 * 设计依据：Spec v2 FR-4/5/6/7/8、AC-4/5、Task 2.2。
 *
 * 关键点：
 *  - 复用 astro:content 导出的 z 实例（与 src/content/config.js 同源，避免版本错位）。
 *  - POST_FRONTMATTER_SCHEMA：与 src/content/config.js 中 post schema 完全一致，
 *    不引入 slug / status 字段（slug 来自文件名；status 来自目录 drafts/）。
 *  - TOOL_SCHEMA / PROJECT_SCHEMA / RESOURCE_SCHEMA：与 src/content/config.js 中
 *    对应 data collection schema 一致（含双语字符串、order、visible）。
 *  - SITE_SETTINGS_SCHEMA：单例 singleton，不进 Content Collection。
 *  - 用于 Admin API 的入参 / 出参校验：拒绝缺失字段、规范化字段顺序。
 */
import { z } from "astro:content";

// ================= 双语字符串 / 双语数组 工具类型 =================

const bilingualString = z.object({
	zh: z.string(),
	en: z.string(),
});
const bilingualStringArray = z.object({
	zh: z.array(z.string()),
	en: z.array(z.string()),
});

// ================= Post Frontmatter Schema =================
/**
 * 严格对齐 src/content/config.js 的 post collection schema。
 * 不新增 slug / status 字段（status 由目录区分）。
 */
export const POST_FRONTMATTER_SCHEMA = z.object({
	title: z.string().min(1, "标题不能为空"),
	description: z.string().min(1, "描述不能为空"),
	dateFormatted: z.string().min(1, "日期不能为空"),
	locale: z.enum(["zh", "en"]).default("zh"),
	tags: z.array(z.string()).optional(),
	featured: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof POST_FRONTMATTER_SCHEMA>;

/** Admin 端创建/更新文章时的入参 */
export const POST_INPUT_SCHEMA = POST_FRONTMATTER_SCHEMA.extend({
	slug: z
		.string()
		.min(2)
		.max(120)
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"slug 只能包含小写字母、数字和连字符",
		),
	/** 创建时可省略（默认 published）；更新时用于判断是否跨目录移动 */
	status: z.enum(["draft", "published"]).optional(),
	/** markdown body（不含 frontmatter） */
	body: z.string(),
	/** 更新时必填，创建时忽略 */
	existingSha: z.string().optional(),
});
export type PostInput = z.infer<typeof POST_INPUT_SCHEMA>;

// ================= Tool Schema =================
/**
 * 严格对齐 src/content/config.js 的 tools collection schema。
 * 双语字符串 + 双语 tags + featured/visible/order 元数据。
 */
export const TOOL_SCHEMA = z.object({
	id: z.string().min(2).max(120),
	name: bilingualString,
	description: bilingualString,
	url: z.string().url("url 必须是合法 URL").or(z.literal("")),
	image: z.string().default(""),
	tags: bilingualStringArray.default({ zh: [], en: [] }),
	featured: z.boolean().default(false),
	visible: z.boolean().default(true),
	order: z.number().int().min(0).default(0),
});
export type Tool = z.infer<typeof TOOL_SCHEMA>;

// ================= Project Schema =================
/**
 * 严格对齐 src/content/config.js 的 projects collection schema。
 * status 为双语字符串（"进行中"/"In Progress"）。
 */
export const PROJECT_SCHEMA = z.object({
	id: z.string().min(2).max(120),
	name: bilingualString,
	description: bilingualString,
	status: bilingualString,
	image: z.string().default(""),
	tags: bilingualStringArray.default({ zh: [], en: [] }),
	visible: z.boolean().default(true),
	order: z.number().int().min(0).default(0),
});
export type Project = z.infer<typeof PROJECT_SCHEMA>;

// ================= Resource Schema =================
export const RESOURCE_SCHEMA = z.object({
	id: z.string().min(2).max(120),
	title: bilingualString,
	description: bilingualString,
	link: z.string().default("#"),
	visible: z.boolean().default(true),
	order: z.number().int().min(0).default(0),
});
export type Resource = z.infer<typeof RESOURCE_SCHEMA>;

// ================= Site Settings Schema（singleton） =================
/**
 * 网站设置单例 JSON，路径 src/content/data/site-settings.json，不进 Content Collection。
 * 字段结构与 i18n/ui.js + i18n/content.js 中现有内容对齐（fallback 时使用旧 t() 值）。
 */
export const SITE_SETTINGS_SCHEMA = z.object({
	brand: z.object({
		siteTitle: bilingualString,
		siteDescription: bilingualString,
		siteAuthor: bilingualString,
		logoText: bilingualString.optional(),
		/** Logo 图片路径（可选，设置后优先于文本 Logo 显示） */
		logoImage: z.string().optional(),
		favicon: z.string().default("/assets/images/favicon.png"),
	}),
	hero: z.object({
		title: bilingualString,
		subtitle: bilingualString,
		intro: bilingualString,
		/** 头像图片路径，默认 /assets/images/photo.png */
		portraitImage: z.string().default("/assets/images/photo.png"),
		primaryCta: bilingualString.optional(),
		secondaryCta: bilingualString.optional(),
	}),
	social: z.object({
		github: z.string().default(""),
		email: z.string().default(""),
		wechat: z.string().default(""),
		twitter: z.string().default(""),
		linkedin: z.string().default(""),
	}),
	seo: z.object({
		defaultTitle: bilingualString,
		defaultDescription: bilingualString,
		keywords: bilingualStringArray.default({ zh: [], en: [] }),
		ogImage: z.string().default("/assets/images/cover.png"),
	}),
	footer: z.object({
		copyright: bilingualString,
		/** 建站说明等附加文案 */
		note: bilingualString.optional(),
	}),
});
export type SiteSettings = z.infer<typeof SITE_SETTINGS_SCHEMA>;
