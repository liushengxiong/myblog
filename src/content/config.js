import { defineCollection, z } from "astro:content";

// 博客文章（content collection，markdown + frontmatter）
const postCollection = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		dateFormatted: z.string(),
		locale: z.enum(["zh", "en"]).default("zh"),
		tags: z.array(z.string()).optional(),
		featured: z.boolean().default(false),
	}),
});

// 工具卡片（data collection，每个文件一条 JSON entry，双语字符串）
const toolsCollection = defineCollection({
	type: "data",
	schema: z.object({
		id: z.string().min(2).max(120),
		name: z.object({ zh: z.string(), en: z.string() }),
		description: z.object({ zh: z.string(), en: z.string() }),
		url: z.string().or(z.literal("")),
		image: z.string().default(""),
		tags: z.object({
			zh: z.array(z.string()),
			en: z.array(z.string()),
		}).default({ zh: [], en: [] }),
		featured: z.boolean().default(false),
		visible: z.boolean().default(true),
		order: z.number().int().min(0).default(0),
	}),
});

// 项目卡片（data collection，每个文件一条 JSON entry，双语字符串 + status）
const projectsCollection = defineCollection({
	type: "data",
	schema: z.object({
		id: z.string().min(2).max(120),
		name: z.object({ zh: z.string(), en: z.string() }),
		description: z.object({ zh: z.string(), en: z.string() }),
		status: z.object({ zh: z.string(), en: z.string() }),
		image: z.string().default(""),
		tags: z.object({
			zh: z.array(z.string()),
			en: z.array(z.string()),
		}).default({ zh: [], en: [] }),
		visible: z.boolean().default(true),
		order: z.number().int().min(0).default(0),
	}),
});

// 资源卡片（data collection，每个文件一条 JSON entry）
const resourcesCollection = defineCollection({
	type: "data",
	schema: z.object({
		id: z.string().min(2).max(120),
		title: z.object({ zh: z.string(), en: z.string() }),
		description: z.object({ zh: z.string(), en: z.string() }),
		link: z.string().default("#"),
		visible: z.boolean().default(true),
		order: z.number().int().min(0).default(0),
	}),
});

// 注：site-settings.json 不声明为 collection，作为 singleton JSON 通过
// import siteSettings from '../content/data/site-settings.json' 读取。

export const collections = {
	post: postCollection,
	tools: toolsCollection,
	projects: projectsCollection,
	resources: resourcesCollection,
};
