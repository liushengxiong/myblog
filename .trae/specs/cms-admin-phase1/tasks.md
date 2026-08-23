# 任务清单（Tasks）· 修订版 v2

> 对应 Spec v2（含 17 条架构级修正落实）。Phase 顺序严格 1→9。不跳阶段。
> 每条 Task 额外标注 **Diff**：`NEW` / `MODIFIED` / `SAME`（基于 v1 tasks.md）。

---

## Phase 1：Admin 基础框架 + 单管理员认证

### Task 1.1 配置 Astro 进入 Hybrid 模式 + Vercel adapter（**MODIFIED**）
- **Diff 原因**：删除对 dist 固定名 serverless 目录的验证；明确 adapter 写法使用 `@astrojs/vercel/serverless`（不是通用 vercel() 注释不清）。
- **AC 覆盖**：NFR-6, FR-1
- **优先级**：high
- **描述**：在 `astro.config.mjs` 中引入 `vercel from '@astrojs/vercel/serverless'` 并设置 `output: 'hybrid'`。前台页面保持静态，/api/* /admin/* 页面和 endpoints 走 serverless。同时在 package.json 安装 `@astrojs/vercel`（仅本地执行，不 commit）。若 adapter 与 i18n prefixDefaultLocale 有组合告警 → 使用当前文档最新推荐组合解决。
- **修改文件**：
  - 修改：[astro.config.mjs](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/astro.config.mjs)
  - 修改：package.json 新增依赖 `@astrojs/vercel`
- **TR（rule）**：`pnpm astro check` exit 0；`pnpm build` exit 0；astro 构建日志不出现 "Adapter not found" / "Invalid output" 错误。
- **TR（rule）**：`astro.config.mjs` 未使用任何 Astro 5.x 专属 API（例如 `@astrojs/node`、`experimental` 字段）。
- **Status**：pending
- **Completion Evidence**：

### Task 1.2 新建认证库 src/lib/auth.ts（**NEW 接口拆分**）
- **Diff 原因**：原 Task 1.2 描述过粗；现在按 Spec 修订版拆分固定 export；Cookie `Path=/`。
- **AC 覆盖**：AC-2, NFR-1, NFR-2
- **优先级**：high
- **描述**：
  - 导出 12 个函数/类型（见 Spec FR-2）：hashPassword（优先 @node-rs/argon2，失败则 fallback 到 Node 内置 crypto.scrypt）、verifyPassword、signJwt（jose）、verifyJwt（jose）、createCsrfToken（hmac sha256 双提交模式）、verifyCsrfToken、rateLimit（单实例内存 Map，注释声明"非分布式低流量适用"）、getSession(ctx: APIContext)、requireAuth(ctx)、requireCsrf(ctx)、setSessionCookie(ctx, token)、clearSessionCookie(ctx)。
  - session cookie: `admin_session` HttpOnly Path=/ SameSite=Lax Secure=isProd MaxAge=7d
  - csrf cookie: `admin_csrf` Non-HttpOnly Path=/ SameSite=Lax Secure=isProd MaxAge=1d
- **新增文件**：
  - [src/lib/auth.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/lib/auth.ts)
- **TR（rule）**：hash/verify roundtrip 通过；JWT sign/verify roundtrip 通过；错误 JWT（过期/改签名）verify 失败。
- **TR（rule）**：rateLimit 连续 5 次通过，第 6 次 blocked=true，等待 900 秒后恢复（测试用短 timeout mock）。
- **Status**：pending
- **Completion Evidence**：

### Task 1.3 新建认证 API 端点（**MODIFIED**：cookie Path、公开白名单、logout 需 CSRF）
- **Diff 原因**：
  - 登录 logout：logout 同时 requireAuth + requireCsrf。
  - 公开白名单仅两个端点：login & csrf。
  - 删除原计划的 `_middleware.ts`，不创建任何 middleware 文件；改为每个 endpoint 文件顶部手工调用 `const session = requireAuth(ctx);`。
- **AC 覆盖**：FR-2, AC-2
- **优先级**：high
- **描述**：
  - 新增 endpoints（Astro pages/api/ routes）：
    - login.ts：POST 公开。校验 user/pw hash → 签发 JWT → setSessionCookie → 下发 CSRF cookie → 返回 200 `{ ok:true, username }`。
    - logout.ts：POST requireAuth + requireCsrf → 清除双 cookie → 204。
    - me.ts：GET requireAuth → 返回 session info。
    - csrf.ts：GET 公开 → 若当前缺 csrf cookie 则签发新 cookie，返回 `{ token, ok:true }`（前端从 cookie 读取也可以）。
  - 新增 guard helper 文件：[src/lib/api-guard.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/lib/api-guard.ts)（集中导出 `withApiGuard({auth, csrf}, handler)` 的小工具，减少重复代码，但不写成 Next middleware）
- **新增文件**：
  - [src/pages/api/admin/auth/login.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/api/admin/auth/login.ts)
  - [src/pages/api/admin/auth/logout.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/api/admin/auth/logout.ts)
  - [src/pages/api/admin/auth/me.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/api/admin/auth/me.ts)
  - [src/pages/api/admin/auth/csrf.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/api/admin/auth/csrf.ts)
  - [src/lib/api-guard.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/lib/api-guard.ts)
- **TR（rule）**：Set-Cookie 响应头含 Path=/ 而非 /admin。
- **TR（rule）**：未认证访问 me -> 401；logout 不带 csrf -> 403。
- **Status**：pending
- **Completion Evidence**：

### Task 1.4 新建 Admin 登录页与基础 UI shell（**MODIFIED：Admin UI 全中文；guard 加页面级**）
- **Diff**：Admin 全中文；增加所有 `/admin/*`（login 除外）页面级 guard（在 Astro frontmatter 顶部 server 侧取 cookie，未登录 `return Astro.redirect('/admin/login?...')`）；不改视觉。
- **AC 覆盖**：FR-1, AC-2
- **优先级**：high
- **新增文件**：[同 v1 tasks 列表，不重复]
  - Admin layout、6 个目录占位页、admin.ts 前端脚本（fetch 封装 + 自动附加 X-CSRF-Token 头 + toast 错误提示 + 中文文案）。
  - [src/pages/admin/login.astro](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/admin/login.astro)
  - [src/layouts/admin.astro](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/layouts/admin.astro)
  - [src/pages/admin/index.astro](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/admin/index.astro)
  - [src/pages/admin/posts/index.astro](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/admin/posts/index.astro)
  - [src/pages/admin/tools/index.astro](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/admin/tools/index.astro)
  - [src/pages/admin/projects/index.astro](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/admin/projects/index.astro)
  - [src/pages/admin/settings/index.astro](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/pages/admin/settings/index.astro)
  - [src/assets/js/admin.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/assets/js/admin.ts)
- **TR（rule）**：/admin 未登录 302 → /admin/login。
- **Status**：pending
- **Completion Evidence**：

### Task 1.5 新增 .env.example 与密码哈希脚本（**MODIFIED：环境变量列表按 Spec v2 固定**）
- **Diff**：env vars 白名单固定为 9 条（含 GITHUB_OWNER/REPO/BRANCH）。
- **AC 覆盖**：NFR-1
- **优先级**：medium
- **新增文件**：
  - [.env.example](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/.env.example)
  - [scripts/hash-password.mjs](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/scripts/hash-password.mjs)
- **TR（rule）**：脚本输出哈希与 verifyPassword 兼容。
- **Status**：pending
- **Completion Evidence**：

---

## Phase 2：GitHub 抽象层 / Schemas / Markdown 序列化

### Task 2.1 src/lib/github.ts 封装 + 安全路径检查（**MODIFIED：路径白名单常量集中、强制 commitMultipleFiles**）
- **Diff**：增加 7 个固定前缀常量；增加 URL decode/normalize 检查；删除 `public/assets/` 作为前缀（仅保留 uploads 子前缀）；commit message 固定模板。
- **AC 覆盖**：AC-3, FR-3
- **优先级**：high
- **描述**：
  - 7 个前缀常量 + validateRepoPath + validateSlug（实现细节 Spec FR-3）。
  - GitHub 错误 kind 16 种（见 Spec FR-3）。
  - `createOrUpdateFile`（单文件）、`deleteFile`。
  - **核心能力** `commitMultipleFiles([{path, content?, b64Content?, encoding?, existingSha?}], message, deletePaths?)`：使用 Git Database API（createBlob → createTree → createCommit → updateRef）一次生成 commit，保证原子性。
  - `getFileInfo(path)` / `listFilesInFolder(folder, recursive?)` / `listRecentCommits(limit)`。
  - `uploadBinaryImage(targetPath, Uint8Array)` → 走 createFile base64。
  - **仅在本文件构造 Octokit**：`const gh = new Octokit({ auth: process.env.GITHUB_TOKEN })`。不得出现在其它文件。
  - 支持 `ADMIN_GITHUB_MOCK=1`：写入一个进程内 in-memory store，用于 Phase 9 烟雾测试而不改真实仓库。
- **新增文件**：[src/lib/github.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/lib/github.ts)
- **TR（rule）**：validateRepoPath("public/assets/images/uploads/../../evil.php") → invalid_path；validateRepoPath("public/assets/images/projects/a.png") → invalid_path（不是 uploads 前缀）。
- **TR（rule）**：commitMultipleFiles 造 2 个文件，listRecentCommits 增量 = 1。
- **Status**：pending
- **Completion Evidence**：

### Task 2.2 Zod schemas、frontmatter 序列化、JSON 文件读写 helpers（**MODIFIED：schema 与实际 Astro Content Collection 对齐；目录多文件 JSON 读写 helpers；site-settings 单例读写 helper**）
- **Diff 原因**：v1 的 schema 未显式对 collection 每个目录映射；这里显式写 3 个 data collection schema 与 Astro 4 config schema 同文件复用；以及 site-settings schema（独立）。增加"规范化 JSON 写入"（2-space 换行、键顺序稳定、末尾空行）。
- **AC 覆盖**：FR-4/5/6/7/8, AC-4/5
- **优先级**：high
- **新增文件**：
  - [src/lib/schemas.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/lib/schemas.ts)：导出 POST_FRONTMATTER_SCHEMA, TOOL_SCHEMA, PROJECT_SCHEMA, RESOURCE_SCHEMA, SITE_SETTINGS_SCHEMA。
  - [src/lib/markdown.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/lib/markdown.ts)：gray-matter parse + serialize（字段顺序稳定）。
  - [src/lib/json-file.ts](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/lib/json-file.ts)（NEW：readArray / writeArray / readObject / writeObject，与 GitHub createFile/updateFile 封装结合；读取优先用 GitHub 实际文件而不是本地文件）。
- **TR（rule）**：真实 6 篇任意 1 篇 parse + re-serialize → 再次 parse 后 frontmatter 字段值相等。
- **Status**：pending
- **Completion Evidence**：

### Task 4.0（**NEW：从 Phase 4 抽出，Data 目录初始化 & Content Config 扩展**）
- **Diff 原因**：原 v1 Task 4.1 混合"目录创建"和"Admin 读/写"。把纯数据初始化（Phase 2 就应该建好文件结构 + Content Collection schema）提前，让 Phase 3 博客管理不必依赖 Phase 4。
- **AC 覆盖**：FR-5/6/8
- **优先级**：high
- **描述**：
  1. 新建 `src/content/tools/.gitkeep`（空）
  2. 从 `projectsContent` 复制生成 3 个 projects JSON；
  3. 从 `resourcesContent` 复制生成 3 个 resources JSON；
  4. 从 `i18n/ui.js` 抽取生成 site-settings.json；
  5. 修改 `src/content/config.js`，新增三个 defineCollection（type: 'data'）。
- **修改/新增文件**：
  - 修改 [src/content/config.js](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/content/config.js)
  - 新增 [src/content/projects/ai-workflow-lab.json](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/content/projects/ai-workflow-lab.json) 等 3 个
  - 新增 [src/content/resources/ai-tools.json](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/content/resources/ai-tools.json) 等 3 个
  - 新增 [src/content/data/site-settings.json](file:///d:/00%20%E5%88%98%E7%9B%9B%E9%9B%84%E7%9F%A5%E8%AF%86%E5%BA%93/00%20myblog/src/content/data/site-settings.json)
- **TR（rule）**：astro check 通过；getCollection('projects').length === 3；getCollection('resources').length === 3。
- **Status**：pending
- **Completion Evidence**：

---

## Phase 3：博客文章管理

### Task 3.1 博客 CRUD API（**MODIFIED：draft 按 drafts/ 目录；slug 重复检测走 file list**）
- **Diff**：新增 publish/unpublish 端点（或在 update 中接受 status 字段），这会是跨目录 move（实际在 GitHub 中实现为 delete old + create new 的同一 commit）。check 端点 409 检测：检查 `post/` + `drafts/` 两路径是否都不存在同名（即使 locale 不同也要阻止，因为 Astro 构建都在同目录按文件名）。
- **AC 覆盖**：FR-4, AC-4
- **新增文件**（路径同 v1，逻辑内修订）：
  - posts/index.ts（list, create）
  - posts/\[slug\]/index.ts（read update delete）
  - posts/\[slug\]/check.ts（exists check + draft location）
  - [NEW] posts/\[slug\]/publish.ts（POST：drafts/xxx → post/xxx，原子操作）
  - [NEW] posts/\[slug\]/unpublish.ts（POST：post → drafts）
- **TR（rule）**：重复创建（同 slug 已存在 post/ 或 drafts/ 任一路径）返回 409。
- **Status**：pending
- **Completion Evidence**：

### Task 3.2 列表页 / 新建 / 编辑 UI（**MODIFIED：slug 输入框默认 disabled + 中文警告**）
- **Diff**：在编辑页新增 slug 锁定和警告；Markdown editor preview iframe `<iframe sandbox="allow-same-origin" srcdoc=...>`；删除二次确认弹窗（中文）。
- **AC 覆盖**：FR-1, FR-4, AC-4, NFR-14
- **新增文件**：
  - posts/new.astro
  - posts/\[slug\].astro
  - 列表页填充内容（表格+搜索+语言筛选）
  - [NEW] `/admin/posts/\[slug\]/preview` 不用单独页面；直接在编辑页 iframe 预览。
- **TR（rule）**：slug 输入框 disabled 属性默认为 true；页面可见文本包含字符串"可能影响 SEO 和已有链接"。
- **TR（rule）**：iframe 有 sandbox 属性。
- **Status**：pending
- **Completion Evidence**：

### Task 3.3 草稿在公开站过滤（**MODIFIED：三重过滤**）
- **Diff**：新增"posts.astro 列表入口"第三处过滤；明确过滤表达式为 `entry.slug.startsWith('drafts/')`。
- **修改文件**：posts-loop.astro、zh/posts.astro、en/posts.astro、zh/post/\[slug\].astro、en/post/\[slug\].astro
- **TR（rule）**：Phase 9 回归中 dist 不存在 drafts/ 子目录生成的 html。
- **Status**：pending
- **Completion Evidence**：

---

## Phase 4：工具管理

### Task 4.1（**MODIFIED：已上移为 Phase 2 Task 4.0** → 本 Task 4.1 改为 Admin API。本 Task 4.1 **改名为 Task 4A.1**，避免 Phase 编号与 Task 编号冲突。）
> **说明**：v1 tasks 中 4.1/4.2 和 Phase 4 编号数字刚好重叠，容易误读；本修订版统一在 Phase 4 内 Task 名加前缀"4A.1 / 4A.2"。
- **任务**：Task 4A.1 Tools API + Admin 列表/新增/编辑/reorder
- **AC 覆盖**：FR-5, AC-5
- **文件**：
  - api/admin/tools/index.ts（GET list + POST create）
  - api/admin/tools/\[id\]/index.ts（GET one + PUT update + DELETE remove）
  - api/admin/tools/reorder.ts（POST，按给定 id[] 数组批量写 order 字段）
  - Admin tools/new.astro、tools/\[id\].astro
  - Admin 列表页填充
- **Diff**：删除了"数据内容迁移初始化"（在 Phase 2 Task 4.0 已做），本 Phase 只做 Admin API 和 UI。
- **Status**：pending

---

## Phase 5：项目管理

### Task 5A.1 Projects API + Admin UI（**MODIFIED：与 Tools 同构，目录多文件**）
- **Diff**：和 v1 tasks 5.1 同内容，但 schema 双语字符串 status 字段明确；初始 JSON 在 Phase 2 已生成。
- **AC 覆盖**：FR-6, AC-5, AC-6
- **文件**：
  - api/admin/projects/index.ts
  - api/admin/projects/\[id\]/index.ts
  - api/admin/projects/reorder.ts
  - Admin 页面 projects/new.astro、projects/\[id\].astro
- **Status**：pending

---

## Phase 6：网站设置

### Task 6A.1 Settings API + Admin UI
- **Diff（MODIFIED）**：强调站点设置 JSON 路径是 `src/content/data/site-settings.json`（不进 collection）；API 读写通过 github lib 读 sha、用 zod 完整校验、整体替换。
- **AC 覆盖**：FR-7, AC-5
- **文件**：
  - api/admin/settings/index.ts（GET + PUT）
  - Admin settings 表单 4 个 tab：品牌 / Hero / 社交 / SEO
- **TR（rule）**：缺字段 PUT 返回 422。
- **Status**：pending

### Task 7.3（**NEW：提前在 Phase 6 末尾创建 dashboard 端点**，为 Phase 7 准备数据）
- Dashboard 端点：GET /api/admin/dashboard（需要 GitHub 读，不在这里写 UI，UI 在 Phase 7 填充）。
- **Status**：pending

---

## Phase 7：首页 / About / Footer / SEO 数据改造接入

### Task 7.1 首页 zh/en index.astro 接入数据（**MODIFIED：Projects section 文案 bug 修复显式列出**）
- **Diff**：Resources 改为目录多文件 getCollection('resources')；Projects 同；Hero 从 site-settings 取。
- 显式修复：zh/en index.astro 中 `t('home.featuredPosts')` 替换为 `t('nav.projects')`。
- **迁移安全**：切换前对比数量（projects 3 、resources 3），不一致抛出开发期错误（不 commit）。
- **修改文件**：zh/index.astro、en/index.astro、zh/projects.astro、en/projects.astro
- **TR（rule）**：/zh/ 页面 Projects 区 h2 文本 === "项目"。
- **Status**：pending

### Task 7.2 main.astro SEO + Logo + Footer 社交 + About 页社交接入（**MODIFIED：settings 缺失 fallback**）
- **Diff**：About 页 aboutContent 的复杂段落不 CMS，社交链接从 settings.social 读取。
- **修改文件**：main.astro、logo.astro、footer.astro、zh/about.astro、en/about.astro
- **TR（rule）**：删除 site-settings.json（模拟）后构建成功，标题回退到旧 t() 值。
- **Status**：pending

### Task 7.4 Dashboard UI 填充（**NEW**）
- Admin index.astro 展示 KPI：文章数（已发布 / 草稿）、语言数、工具数、项目数、最近 commits 表。
- **Status**：pending

---

## Phase 8：图片上传 + 安全审计

### Task 8.1 图片上传 endpoints + Admin 侧选择器（**MODIFIED：GitHub 存储 + 5MB**）
- **Diff**：完全按 Spec FR-11 重写，禁止本地磁盘写永久文件。
- **新增 API**：
  - images/upload.ts（POST multipart/form-data，MIME 检测 + 5MB → 413，服务端重新命名 ASCII → GitHub commit 到 uploads/YYYY-MM-DD/...）
  - images/index.ts（GET list）
- **Admin UI 集成**：在 post editor 和 settings 里加入"上传图片" / "从已上传选择"Modal。
- **TR（rule）**：本地 grep 搜索不到 `.writeFile(` / `fs.write` 出现在 images 上传代码路径中（除了 Vercel 函数内部临时 /tmp 不持久）。
- **Status**：pending

### Task 8.2 安全清单复核（**MODIFIED：新增 session cookie Path 检查、XSS 双 payload 检查**）
- **检查项列表（脚本化执行 + 截图保存证据）**：
  1. env 字面量 grep
  2. Octokit 位置检查
  3. requireAuth 覆盖率：排除公开白名单两个文件后其余所有 api/admin 文件字符串含 requireAuth。
  4. Cookie Path 测试：本地 curl -v 登录后，Set-Cookie 含 Path=/
  5. CSRF：写请求缺 token → 403
  6. Markdown XSS 测试：`<script>top.alert(1)</script>` 和 `<img src=x onerror=top.alert(1)>` 都不弹窗
  7. slug 危险字符：`HELLO`、`a/b`、`a..b`、`你好` → 400 invalid_slug
  8. 路径越权：`/../evil` → 400 invalid_path
- **Status**：pending

---

## Phase 9：测试 + 构建验证 + 回归

### Task 9.1 typecheck / lint / build 修复残留（SAME）
- **TR**：`pnpm build` exit 0；`pnpm biome check` exit 0。

### Task 9.2 烟雾测试脚本（**MODIFIED：全部走 ADMIN_GITHUB_MOCK=1，不触发真实 GitHub 写**）
- **文件**：tests/smoke.mjs。
- **覆盖**：登录/鉴权/csrf、博客 CRUD、slug 冲突、路径穿越、projects/tools/settings CRUD、图片上传 MIME/大小拒绝。
- **TR（rule）**：脚本 exit 0。

### Task 9.3 Legacy Site Regression（**NEW：用户要求新增**）
- **检查项（全部执行并记录成功/失败表）**：
  1. 6 篇旧文章 dist 存在（每个 URL 子目录）
  2. 8 个静态页面 dist 存在
  3. SEO 标签全量：title、description、canonical、og:title、og:description、twitter:card、keywords、favicon（至少每页 1 条抽取检查）
  4. robots.txt 存在（dist/robots.txt）
  5. sitemap / RSS：当前不存在 → 标记 N/A，不报错
  6. drafts/test.md 不生成公开页（临时构造后 build 检查）
- **TR（rule）**：全部 1-4 项存在，第 6 项 dist 无对应页面。
- **Status**：pending

---

## 附录：Task 增/改/删 对照表

| 原 Task（v1） | 动作 | 新 Task（v2） | 原因 |
|---|---|---|---|
| 全部 | - | 开头加 Phase 编号，严格 1→9 | 结构修正 |
| Task 1.1 | MODIFIED | Task 1.1 | hybrid 配置写法、AC 删除 dist 目录检查 |
| Task 1.2 | MODIFIED | Task 1.2 | 拆分 12 个 export；rate limit 加定性声明；cookie Path=/ |
| Task 1.3 | MODIFIED | Task 1.3 | 公开白名单、logout CSRF、删除 _middleware.ts |
| Task 1.3 旧 _middleware.ts | **删除** | - | 用户禁止 Next 风格 middleware |
| Task 1.4 | MODIFIED | Task 1.4 | Admin 全中文；页面级 guard |
| Task 1.5 | MODIFIED | Task 1.5 | 环境变量白名单固定 9 项 |
| Task 2.1 | MODIFIED | Task 2.1 | 7 前缀常量；commitMultipleFiles 核心；mock 模式；MIME 错误 kind；严格 slug 正则 |
| Task 2.2 | MODIFIED | Task 2.2 + json-file.ts（NEW） | 规范化 JSON 读写；对齐 Astro Content Collections type:data 多文件 |
| - | **新增** | Task 4.0（Phase 2） | 初始化 JSON 目录 + Content Collection schema 扩展，提前于 Phase 4 |
| Task 3.1 | MODIFIED | Task 3.1 | publish/unpublish 端点；跨目录 move 原子；两路径 slug 冲突 |
| Task 3.2 | MODIFIED | Task 3.2 | slug 默认 disabled + 警告；iframe sandbox |
| Task 3.3 | MODIFIED | Task 3.3 | 三重过滤（posts-loop、列表页入口、详情页 getStaticPaths） |
| Task 4.1 | 重命名拆分 | Task 4.0（Phase 2）+ Task 4A.1（Phase 4 API+UI） | 避免与 Phase 4 编号冲突 |
| Task 4.2 | MODIFIED | Task 4A.1 合并 | 同 4A.1 |
| Task 5.1 | MODIFIED | Task 5A.1 | status 双语字符串 |
| Task 6.1 | MODIFIED | Task 6A.1 | settings 是 singleton JSON（不进 collection） |
| - | **新增** | Task 7.3（Phase 6 尾） | Dashboard 端点 |
| Task 7.1 | MODIFIED | Task 7.1 | Projects 文案 bug 修复显式列出；先验证数量再切换 |
| Task 7.2 | MODIFIED | Task 7.2 | About 仅社交 CMS 化；settings 缺失 fallback |
| - | **新增** | Task 7.4 | Dashboard UI 填充 |
| Task 8.1 | MODIFIED | Task 8.1 | GitHub 存储 + 5MB + MIME double check + server 重命名 |
| Task 8.2 | MODIFIED | Task 8.2 | 新增 Cookie Path、XSS 双 payload 测试 |
| Task 9.1 | SAME | Task 9.1 | 无变更 |
| Task 9.2 | MODIFIED | Task 9.2 | 全部 MOCK（默认不写真实仓库） |
| - | **新增** | Task 9.3 | 旧站回归（6 篇 + 8 页 + SEO + drafts 不泄露） |
| v1 中 dashboard.ts （原 Task 7.3） | MODIFIED | Task 7.3 + Task 7.4 分拆 | 避免与 Phase 编号混乱 |

---

## 环境变量最终清单

```env
# ===== Admin 认证 =====
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=            # 用 scripts/hash-password.mjs 生成
ADMIN_JWT_SECRET=              # 至少 32 位随机十六进制

# ===== GitHub 接入（Fine-grained PAT：Contents R/W，仅限 myblog）=====
GITHUB_TOKEN=
GITHUB_OWNER=liushengxiong
GITHUB_REPO=myblog
GITHUB_BRANCH=main

# ===== 测试（可选，默认 0）=====
ADMIN_GITHUB_MOCK=0            # 1 时 Admin API 不写真实 GitHub
```
