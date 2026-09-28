# Project Memory — 刘盛雄个人博客 (Astro)

## 双语文章发布流程 (Bilingual post workflow)
- 文章源文件：`src/content/post/*.md`，每篇一个文件（中文 + 英文各一个，互不链接，靠 `locale: zh|en` 区分）。
- Frontmatter schema（`src/content/config.js`）：
  - `title: string`、`description: string`、`dateFormatted: "Month D YYYY"`（如 "September 26 2026"，`posts-loop.astro` 用 `new Date("September 26, 2026")` 解析排序）、`locale: "zh"|"en"`、`tags: string[]`、`featured: boolean`。
  - 顺序：title → description → dateFormatted → locale → tags → featured。
- Slug 规则（`src/lib/github.ts` `validateSlug`）：`^[a-z0-9]+(?:-[a-z0-9]+)*$`，长度 2–120，只含小写字母/数字/连字符。中文文章也用英文名 slug 即可（站点首个 zh 文章 `why-i-built-this-website` 即用英文 slug）。
- 约定：英文文件在基础 slug 后加 `-en`（如 `foo.md` + `foo-en.md`）。
- 列表/首页按 `dateFormatted` 倒序；`featured` 字段当前未被列表使用。
- 文章正文支持 Markdown（## 标题、列表、行内链接等）；模板无封面图字段，无需配图。

## 构建/验证 (Build)
- 站点为 Astro + `@astrojs/vercel/serverless` hybrid 输出，产物目录是 `.vercel/output/static/`（不是 `dist/`）。
- Bash 环境 PATH 缺 coreutils（`ls/cat/tail/del` 不可用）；改用 `/c/Users/sheng/.workbuddy/binaries/node/versions/22.22.2-3/node.exe` 直接跑 `node_modules/astro/astro.js build`，并用 `> build.log 2>&1` 重定向后用 node 读日志。
- 构建末尾的 safe-delete 守卫会拦截 Vercel adapter 的临时文件清理导致 `EXIT=1`，但静态预渲染（含所有文章 HTML）已成功完成，属环境限制，与内容无关。
- 验证：检查 `.vercel/output/static/{zh,en}/post/<slug>/index.html` 的 `<title>` 与正文，以及 `{zh,en}/posts/index.html` 是否含新 slug。

## AI 工具推荐页 (AI Tools page)
- 首页"AI 工具推荐"资源卡片（id=`ai-tools`，`src/content/resources/ai-tools.json`）现在指向公开工具页，而非 `#`。
- 工具数据：每个工具一个 JSON 写在 `src/content/tools/*.json`，schema 见 `src/content/config.js` 的 `toolsCollection`（字段：id/name{desc}/description{desc}/url/image/tags{desc 数组}/featured/visible/order）。`url` 可为 `""`。
- 品类（category）由 `tags[lang][0]` 决定，工具页按品类分组、组内按 `order` 排序；卡片展示剩余 tags（去掉品类标签）。
- 公开页面：`src/pages/zh/tools/index.astro` 与 `src/pages/en/tools/index.astro`，读取 `getCollection("tools")`，过滤 `visible!==false`。
- 导航栏：`src/i18n/navigation.js` 已加 "AI 工具"/"AI Tools" 入口（位于 项目/Projects 之后）。
- 首页资源卡片链接在 `src/pages/{zh,en}/index.astro` 的 resources 循环里对 `ai-tools` 做了 lang 感知覆盖（`/${lang}/tools/`）。
- 注意：`tools` 内容集合的 config schema 不含 `id` 字段（id 取自文件名）；但后台 `src/lib/schemas.ts` 的 `TOOL_SCHEMA` 要求 `id`，手写 JSON 时一并带上以保持后台兼容。

## 部署
- 通过 Vercel（`vercel.json` 存在）从 Git 自动构建；新增文件后需 commit & push 触发部署（不要擅自 push）。
