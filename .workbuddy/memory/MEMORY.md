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

## 部署
- 通过 Vercel（`vercel.json` 存在）从 Git 自动构建；新增 .md 后需 commit & push 触发部署（不要擅自 push）。
