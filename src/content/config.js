import { defineCollection, z } from "astro:content";

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

export const collections = {
	post: postCollection,
};