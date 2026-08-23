import './_astro_content_6TQPKPZG.mjs';
import * as z from 'zod';

const bilingualString = z.object({
  zh: z.string(),
  en: z.string()
});
const bilingualStringArray = z.object({
  zh: z.array(z.string()),
  en: z.array(z.string())
});
const POST_FRONTMATTER_SCHEMA = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().min(1, "描述不能为空"),
  dateFormatted: z.string().min(1, "日期不能为空"),
  locale: z.enum(["zh", "en"]).default("zh"),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().default(false)
});
const POST_INPUT_SCHEMA = POST_FRONTMATTER_SCHEMA.extend({
  slug: z.string().min(2).max(120).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "slug 只能包含小写字母、数字和连字符"
  ),
  /** 创建时可省略（默认 published）；更新时用于判断是否跨目录移动 */
  status: z.enum(["draft", "published"]).optional(),
  /** markdown body（不含 frontmatter） */
  body: z.string(),
  /** 更新时必填，创建时忽略 */
  existingSha: z.string().optional()
});
const TOOL_SCHEMA = z.object({
  id: z.string().min(2).max(120),
  name: bilingualString,
  description: bilingualString,
  url: z.string().url("url 必须是合法 URL").or(z.literal("")),
  image: z.string().default(""),
  tags: bilingualStringArray.default({ zh: [], en: [] }),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).default(0)
});
const PROJECT_SCHEMA = z.object({
  id: z.string().min(2).max(120),
  name: bilingualString,
  description: bilingualString,
  status: bilingualString,
  image: z.string().default(""),
  tags: bilingualStringArray.default({ zh: [], en: [] }),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).default(0)
});
const RESOURCE_SCHEMA = z.object({
  id: z.string().min(2).max(120),
  title: bilingualString,
  description: bilingualString,
  link: z.string().default("#"),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).default(0)
});
const SITE_SETTINGS_SCHEMA = z.object({
  brand: z.object({
    siteTitle: bilingualString,
    siteDescription: bilingualString,
    siteAuthor: bilingualString,
    logoText: bilingualString.optional(),
    favicon: z.string().default("/assets/images/favicon.png")
  }),
  hero: z.object({
    title: bilingualString,
    subtitle: bilingualString,
    intro: bilingualString,
    /** 头像图片路径，默认 /assets/images/photo.png */
    portraitImage: z.string().default("/assets/images/photo.png"),
    primaryCta: bilingualString.optional(),
    secondaryCta: bilingualString.optional()
  }),
  social: z.object({
    github: z.string().default(""),
    email: z.string().default(""),
    wechat: z.string().default(""),
    twitter: z.string().default(""),
    linkedin: z.string().default("")
  }),
  seo: z.object({
    defaultTitle: bilingualString,
    defaultDescription: bilingualString,
    keywords: bilingualStringArray.default({ zh: [], en: [] }),
    ogImage: z.string().default("/assets/images/cover.png")
  }),
  footer: z.object({
    copyright: bilingualString,
    /** 建站说明等附加文案 */
    note: bilingualString.optional()
  })
});

export { PROJECT_SCHEMA as P, RESOURCE_SCHEMA as R, SITE_SETTINGS_SCHEMA as S, TOOL_SCHEMA as T, POST_INPUT_SCHEMA as a, POST_FRONTMATTER_SCHEMA as b };
