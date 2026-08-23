# 轻量级全站 CMS Admin 改造（Phase 1→9）SPEC · 修订版（v2）

> 修订基准：基于用户对 v1 规范提出的 **17 条架构级修正意见**逐项落实。
> 基础代码再次确认时间：2026-08-23。
> 本文件只修订 Spec，**不修改任何项目源码、不安装依赖、不执行 Git、不触发构建**。

---

## 0. 关键版本与兼容性先验（修订基准）

**（本节是修订理由，请在实现时严格遵守）**

### 0.1 Astro 类型确认（实际 d.ts 查验）
实际 `node_modules/astro/dist/@types/astro.d.ts:532`：
```ts
output?: 'static' | 'server' | 'hybrid'   // ← 三种都支持，hybrid 合法
adapter?: AstroIntegration                 // ← 配合 adapter 使用，正确
```
- **结论**：`output: 'hybrid'` + `adapter: vercel()` 是 Astro 4.8.2 原生支持的组合。✅
- 原 Spec 里关于 "dist/ 出现固定名 serverless 目录" 的验收标准是错误的（因 Vercel 最终目录命名是不透明的），删除该条，改成三项可操作验证（见 NFR-6 与 AC-1）。

### 0.2 Astro 4 Content Collections 'data' 语义（重要！）
实际 `node_modules/astro/dist/content/errors-data.d.ts:1358`：
> `Collection entries of type 'data' must return an object with valid JSON (for .json entries) or YAML (for .yaml entries).`

加上 `content/utils.d.ts:320` `type: "data"` 的 schema；**以及**用户特别指出的概念混用风险：
- **不允许**：一个大文件 `projects.json`（数组形式）同时声称 `getCollection('projects')` 返回若干 entry。
- **正确一致的语义**：`type: 'data'` collection **目录 = collection 名，每个文件 = 1 条 entry**（类似 content collection md 文件）。
- **例外（site-settings 单例）**：settings 是全局单对象，不进 Content Collection，直接 `import json` 或用 Astro 5 风格 `loader: file()`。但本项目是 Astro 4.8.2（没有 loaders 成为稳定 API），所以 site-settings 不定义为 collection，用 `import siteSettings from '../content/data/site-settings.json'` 的 ESM 导入（Vite/Astro 原生支持 import JSON）。
- 因此 `tools/projects/resources` 改为：**目录多文件**。
- `src/content/config.js` 中最终将有三个新 collection：
  ```
  src/content/tools/      *.json    (定义为 type: "data")
  src/content/projects/   *.json    (定义为 type: "data")
  src/content/resources/  *.json    (定义为 type: "data")
  src/content/data/site-settings.json (不进 collection，单独 import)
  ```
- 注：`src/content/data/` 前缀本身不强制，所有 collection 目录直接平铺在 `src/content/` 下更符合 Astro 约定。

### 0.3 Astro 4 的 Content Layer（loader/file/glob）状态
实际 `dist/@types/astro.d.ts:2100` 中有对 `loader: glob()` / `loader: file()` 的**文档级 JSDoc 示例**，但未在正式 Astro 4.x 版本类型里把它公开为稳定 API（没有被 export 为函数类型，它只是注释/前瞻预览）。因此：
- **本项目不使用 loader/file/glob API**（避免使用未正式定型的 5.x 前瞻 API）。
- 用 Astro 4 原生方式：`defineCollection({ type: 'data', schema })` + `src/content/<collection>/*.json`。
- site-settings 单独作为一个 singleton JSON 用 `import` 读取，不声明为 collection。

### 0.4 旧 slug 兼容性核查（非常关键！）
现有 6 篇文章文件名（即为 Astro 4 slug）：
1. `4-tian-gai-le-7-lun-zhong-yu-jiao-fu-le-2400-yuan-ai-shipin-shang-dan`
2. `delivered-2400-yuan-ai-video-commission-after-7-revisions`
3. `opened-7-hong-kong-bank-cards-one-day`
4. `why-i-built-this-website-en`
5. `why-i-built-this-website`
6. `yi-tian-kai-tong-7-zhang-gang-qia`

**验证正则 `^[a-z0-9]+(?:-[a-z0-9]+)*$`：**

| 文件名 | 是否匹配 | 备注 |
|---|---|---|
| 4-tian-... | ✅ 匹配 | 开头数字 OK |
| delivered-2400-... | ✅ 匹配 | |
| opened-7-... | ✅ 匹配 | |
| why-i-built-this-website-en | ✅ 匹配 | 末尾 -en OK |
| why-i-built-this-website | ✅ 匹配 | |
| yi-tian-kai-tong-7-zhang-gang-qia | ✅ 匹配 | |

**全部 6 条均匹配。** 安全正则与现有 slug 无冲突。✅

### 0.5 图片路径规范
当前项目图片结构：
- `/public/assets/images/photo.png`（首页头像）
- `/public/assets/images/cover.png`（OG 封面）
- `/public/assets/images/favicon.png`
- `/public/assets/images/posts/...`（文章图片）
- `/public/assets/images/projects/...`（项目图片）

因此新 upload 图片必须写 GitHub commit 到：
```
public/assets/images/uploads/YYYY-MM-DD/<safe-name>.<ext>
```
不能用 `src/assets/images/`（当前此目录不存在，且 `src/` 下图片不是 Vercel public 语义，会被打包管线影响）。✅

### 0.6 Astro API route Context 类型（requireAuth 签名）
Astro 4 Endpoints 签名：
```ts
export const POST: APIRoute = async (ctx: APIContext) => { ... }
// APIContext = { request, url, params, props, redirect, cookies, locals, site }
```
所以 helper 必须是 `requireAuth(ctx: APIContext): Session`（或接收 `Astro` / `cookies` 实际对象）。**不能**用 Next.js 的 `NextRequest / NextResponse`。✅

---

## 1. 问题 / 用户 / 目标（同 v1，不修订）

略（不涉及架构冲突）。同 v1 spec 问题/用户/目标章节。

## 2. 非目标（同 v1，但新增 2 条：不含 middleware、不含 Content Layer loaders）

新增非目标：
- 不使用 Astro 5.x Content Layer `loader/file/glob` 前瞻 API。
- 不创建 Next.js 风格的 `_middleware.ts` / Astro middleware（即使 Astro 4 支持 middleware，Phase 1→9 也一律使用显式 `requireAuth()` 调用，降低复杂度）。

## 3. 功能需求（Functional Requirements）修订清单

### FR-1 Admin 基础框架与路由（修订）
- 不变。**新增**：所有 `/admin/*`（除 `/admin/login`）页面在服务端或组件顶部直接调用 guard，未登录 → 302 到 `/admin/login?next=...`。

### FR-2 单管理员认证（**大修订**）
- Cookie 配置：
  ```
  admin_session（JWT）
  - HttpOnly
  - SameSite=Lax
  - Secure = (Astro.env.production || !localhost)   // 统一，不再按 Path 区分
  - Path=/                                           // ✅ 修复 Path
  - Max-Age = 7d
  ```
  ```
  admin_csrf（双提交 token）
  - HttpOnly = false          // 前端 JS 必须能读到才能塞请求头
  - SameSite=Lax
  - Secure = 同上
  - Path=/
  - Max-Age = 1d
  ```
- 认证模型职责明确（写死在 spec 中）：
  - JWT/session = 身份认证
  - CSRF token = 防止跨站伪造写操作
  - HttpOnly Cookie = 防止 JavaScript 读取 session
  - SameSite=Lax = 浏览器层面额外 CSRF 防护
- `src/lib/auth.ts` 必须拆分 export：
  ```ts
  hashPassword(pw): Promise<string>          // argon2id or scrypt fallback
  verifyPassword(pw, hash): Promise<boolean>
  signJwt(payload, secret, expiresIn): Promise<string>    // jose SignJWT
  verifyJwt(token, secret): Promise<JWTPayload>           // jose jwtVerify
  createCsrfToken(secret): { token, signedTokenCookieValue }
  verifyCsrfToken(headerVal, cookieVal, secret): boolean
  rateLimit(ip, limitMs, maxAttempts): { blocked, resetAt, attempts }   // 仅单实例内存 map
  getSession(ctx: APIContext): Promise<Session>          // 只验证，不抛错
  requireAuth(ctx: APIContext): Promise<Session>         // 未登录直接返回 401 Response 或抛 HttpError
  requireCsrf(ctx: APIContext): Promise<void>            // 不匹配返回 403
  setSessionCookie(ctx, token): void                     // Set-Cookie header append
  clearSessionCookie(ctx): void
  ```
- 登录端点 POST `/api/admin/auth/login`：公开（不要求 auth/csrf）。
- 登出端点 POST `/api/admin/auth/logout`：**同时** requireAuth + requireCsrf。
- 所有写方法 `POST/PUT/DELETE` / `/api/admin/*`（除 auth/login）：requireAuth && requireCsrf。
- 所有 GET 方法 `/api/admin/*`：requireAuth（不需要 CSRF）。
- 特殊公开 API 白名单：**只有**两个：
  - `/api/admin/auth/login`
  - `/api/admin/auth/csrf`
- Rate limit：**明确声明**：当前为**单实例内存 rate limit**（`new Map()`），适合个人站低流量 Admin；未来如果 Admin 被部署为多实例 Vercel Function 且出现误杀，再迁移 Upstash/Redis。**不声称其为分布式/生产级。**

### FR-3 GitHub API 服务端封装（**大修订**）
- **保留** `commitMultipleFiles()` 为核心能力（Blob→Tree→Commit→UpdateRef），这是架构正确性保障；任何可原子化的一次保存（如"发布文章+同时添加图片"）都应该走单次 commit。
- **强制集中路径白名单常量**：
  ```ts
  // src/lib/github.ts 顶部（const 只放这里）
  PREFIX_POST    = 'src/content/post/'           // 不含 drafts 子路径
  PREFIX_DRAFT   = 'src/content/post/drafts/'
  PREFIX_TOOLS   = 'src/content/tools/'
  PREFIX_PROJECTS= 'src/content/projects/'
  PREFIX_RESOURCES='src/content/resources/'
  PREFIX_SETTINGS = 'src/content/data/'          // 仅 site-settings.json
  PREFIX_IMAGE   = 'public/assets/images/uploads/'
  ALL_PREFIXES   = [PREFIX_POST, PREFIX_DRAFT, PREFIX_TOOLS, PREFIX_PROJECTS, PREFIX_RESOURCES, PREFIX_SETTINGS, PREFIX_IMAGE] as const
  ```
- **路径安全**：
  - `validateRepoPath(relativePath: string, allowedPrefixes = ALL_PREFIXES): string`
    - 空抛错；绝对路径抛错。
    - URL decode 一次后 normalize + 检查含 `..` / `..\` / 反斜杠 / 非 ASCII / 控制字符 → 全部抛错 `{ ok:false, kind:"invalid_path" }`。
    - 最终规范化路径必须以其中一个允许前缀开始；否则 400。
- **slug 安全**：`validateSlug(slug): string` 正则 `^[a-z0-9]+(?:-[a-z0-9]+)*$`，长度 2-120。
- **commit message 安全**：不得把任意用户输入拼接为 commit message 前缀；固定前缀：
  ```
  `cms: create post: <slug>`            // slug 经过 validateSlug 保证安全
  `cms: update post: <slug>`
  `cms: delete post: <slug>`
  `cms: publish draft: <slug>`
  `cms: unpublish to draft: <slug>`
  `cms: update tools list`
  `cms: update projects list`
  `cms: update resources list`
  `cms: update site settings`
  `cms: upload image: <YYYY-MM-DD/filename>`
  `cms: batch save (<n> files)`
  ```
- SHA 校验：更新/删除必须带 `existingSha`，缺失 400；过期 SHA → 409 `github_conflict`。
- 前端永远不泄漏错误详情；错误分类固定为：`github_auth | github_rate_limit | github_not_found | github_conflict | github_other | invalid_path | invalid_slug | invalid_mime | file_too_large | schema_error | unauthorized | csrf_mismatch | missing_csrf | csrf_expired | too_many_attempts`。

### FR-4 博客文章管理（修订 schema 兼容 + 草稿路径）
- 现有 Content Collection schema：
  ```ts
  { title: string, description: string, dateFormatted: string, locale: "zh"|"en" = "zh", tags?: string[], featured?: boolean }
  ```
  **严格不改**。
- **补充字段**：Admin 端还需要 `slug` / `status: 'draft'|'published'` 两个字段，但：
  - `slug` 不写进 frontmatter（以文件名作为 slug 权威来源，与现有站点 URL 逻辑保持一致）；
  - `draft` 状态**不新增 frontmatter 字段**，直接以所在目录区分（`src/content/post/drafts/xxx.md` = draft；`src/content/post/xxx.md` = published），避免破坏 zod schema，无需 schema 扩展。✅ 完全兼容。
- **slug 规则**：新建文章时用户填 slug → 直接作文件名；编辑**已发布**文章 slug 默认 disabled，带警告条："修改 slug 会改变文章 URL，可能影响 SEO 和已有链接。"点击"解锁修改"后弹窗二次确认。
- **草稿公开站隔离**：
  - `getStaticPaths` + `posts-loop` + 列表页 filter：`entry => !entry.slug.startsWith('drafts/')`。
  - Astro 4 旧版 Content Collections 对 `drafts/foo` 的 slug 是 `'drafts/foo'`（带斜杠），所以这个过滤条件是可靠的。

### FR-5 工具管理（**大修订**：结构改为目录 + 多文件）
- 目录结构：
  ```
  src/content/
  └── tools/
      ├── ai-product-image.json
      ├── ai-video.json
      └── ai-english-tutor.json
  ```
- 单条 schema：
  ```json
  {
    "id": "ai-product-image",
    "name":        { "zh": "AI 商品图生成器", "en": "AI Product Image Generator" },
    "description": { "zh": "一键生成白底图/场景图...", "en": "One-click white/scene..." },
    "url": "https://...",
    "image": "/assets/images/projects/xxx.png",
    "tags":        { "zh": ["AI", "图片"], "en": ["AI", "Image"] },
    "featured": false,
    "visible": true,
    "order": 1
  }
  ```
- 初始：**空目录**（首页当前没有工具 section，用户后续通过 Admin 填）。
- Content Collection：`tools = defineCollection({ type: 'data', schema: z.object(...) })`。
- `getCollection('tools')` 之后在页面 `.map()` 前做 `filter(t => t.data.visible)` + `sortBy('order')`。

### FR-6 项目管理（**同 FR-5 大修订：目录 + 多文件**）
- 目录结构：
  ```
  src/content/projects/
  ├── ai-workflow-lab.json
  ├── personal-knowledge-management-system.json
  └── content-creation-toolkit.json
  ```
- 单条 schema：
  ```json
  {
    "id": "ai-workflow-lab",
    "name":        { "zh": "AI 工作流实验室", "en": "AI Workflow Lab" },
    "description": { "zh": "...", "en": "..." },
    "status":      { "zh": "进行中", "en": "In Progress" },
    "image": "",
    "tags":        { "zh": ["AI","自动化"], "en": ["AI","Automation"] },
    "visible": true,
    "order": 1
  }
  ```
- **数据迁移安全要求**（新增 FR）：
  - 先把现有 `projectsContent[zh/en]` 的 3 个条目**复制生成** 3 个 JSON 到 `src/content/projects/`（保留原字段，逐个对照验证数量/语言/标签数量一致），在前台**先**验证通过页面渲染、构建成功、UI 像素级一致后，**再**移除 `projectsContent` 导入逻辑（第 7 阶段切换）。
- 项目页 `/zh/projects.astro` 与首页 Projects 块都读 `getCollection('projects')`。

### FR-7 网站设置（修订：settings 不进 Content Collection，单例 singleton JSON）
- 路径：`src/content/data/site-settings.json`（**不**声明为 collection）
- 前端读取：`import siteSettings from '../content/data/site-settings.json'` 带 fallback。
- 结构同 v1 spec FR-7，不新增/删除字段。
- 迁移流程同 FR-6（**先复制→验证→再切换→最后删除旧来源中的对应段**；对于 `ui.js` 里残留的 `site.*` 键**保留**以作为 fallback，不删除）。

### FR-8 首页 / Resources 数据改造（**修订：Resources 也改为目录+多文件**）
- 新增 `src/content/resources/` 目录，每个资源一个 JSON。
- schema：
  ```json
  { "id": "...",
    "title": {"zh":"AI 工具推荐","en":"AI Tools I Recommend"},
    "description": {"zh":"...","en":"..."},
    "link": "#",
    "visible": true,
    "order": 1 }
  ```
- 初始 3 条（来自 resourcesContent zh/en）必须先复制生成，逐个对比数量/字段。
- Projects section 文案 bug 修复仍保留：Projects 标题 "精选文章"→"项目" / "Featured Posts" → "Projects"。
- Hero 头像路径字符串从 settings.hero.portraitImage 读取（默认值仍是 `/assets/images/photo.png`）。

### FR-9 草稿隔离（修订）
- 草稿**只写 `src/content/post/drafts/`**；其他非 drafts 目录一律作为已发布。
- 公开过滤处：
  - `[slug].astro` `getStaticPaths()` 中 filter
  - `posts-loop.astro` filter
  - `posts.astro` 列表入口也加一次
  - `astro check` 类型无误
- Phase 9 Task 9.3 回归测试：模拟构造 `src/content/post/drafts/test.md` 必须保证 `dist/` 无此 URL。

### FR-10 错误处理（修订：commit 成功的定义）
- 只有 `octokit` 返回 200/201 且 response.data.commit 存在时，前端 toast："已提交 GitHub，等待 Vercel 部署。"
- 其他任何情况都显示详细错误：`kind + message + 排查建议`。

### FR-11 图片处理（**大修订：必须走 GitHub 存储，禁止本地写 Vercel tmp 以外**）
- 路径：`public/assets/images/uploads/YYYY-MM-DD/<server-generated-name>.<ext>`
- 上传端点：`POST /api/admin/images/upload`（multipart/form-data，`requireAuth + requireCsrf`）
- **流程**：
  1. 校验 `Content-Length` ≤ 5MB：超限直接 413 `file_too_large`。
  2. 读取文件头 Magic bytes 判断 MIME，不信任 `filename` 扩展名。
     - 允许 MIME：`image/jpeg`, `image/png`, `image/webp`, `image/gif`。
     - 扩展名仅作为文件名后缀使用，**不做类型判断依据**。
  3. 服务端重新生成文件名：`${Date.now().toString(36)}-${randomHex(6)}.${extFromMime}`。**ASCII only**。
  4. 不允许用户控制目标路径（固定 `uploads/YYYY-MM-DD/`）。
  5. `validateRepoPath(targetPath)` 白名单检查。
  6. 转 Base64，调用 `github.createFile(targetPath, base64, cms message)` → 成功才返回 `{ ok:true, url: "/assets/images/..." , sha, path }`。
  7. 写入失败不返回成功。
- 图片列表 `GET /api/admin/images/list`：列出 `public/assets/images/uploads/**` 所有 GitHub 文件（通过 listContents 递归）。
- 限制：
  - ≤ 5 MB → 413，
  - 非法 MIME/扩展 → 400，
  - 路径越权 → 400。

### FR-12 SEO 保持（修订）
- 不新增 sitemap/RSS；不修复当前不存在的 sitemap/RSS。
- SEO fallback：site-settings JSON 任何缺失（未 commit / 字段空）→ main.astro 仍返回旧 `t('site.title')` 等，不白屏。
- URL 结构：
  - slug 仍由文件名决定 → 旧 URL 不改变。✅

---

## 4. 非功能需求（Non-Functional Requirements）修订

### NFR-1 安全（修订 Cookie / CSRF 规则 / 环境变量）
同 v1，**补充新增/修订条目**：
- Cookie: `Path=/`，session cookie 永远 HttpOnly；CSRF cookie 非 HttpOnly；SameSite=Lax（Vercel prod：Secure=true；本地 127.0.0.1/localhost：Secure=false）。
- 环境变量白名单（.env.example）**最终确定**：
  ```
  # 认证
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD_HASH=
  ADMIN_JWT_SECRET=

  # GitHub 写入
  GITHUB_TOKEN=
  GITHUB_OWNER=liushengxiong
  GITHUB_REPO=myblog
  GITHUB_BRANCH=main

  # 测试 / Mock（可选，默认 0）
  ADMIN_GITHUB_MOCK=0
  ```
- 代码 grep 硬约束：
  - 全局搜不到 `GITHUB_TOKEN|ADMIN_PASSWORD_HASH|ADMIN_JWT_SECRET` 字符串字面量。
  - Octokit 构造只出现在 `src/lib/github.ts`。
  - 所有 `/api/admin/*` 非白名单端点（即不是 login/csrf）都调用 `requireAuth(ctx)`。

### NFR-2 依赖最小化（修订：argon2 → 优先 @node-rs/argon2，避免 native 构建失败）
- **jose**：必须。ESM / WebCrypto 友好。
- **@node-rs/argon2**（或 `argon2-browser` / 不行再 `scrypt` 兜底）：必须。
- **@octokit/rest**：必须。
- **gray-matter**：必须。
- **zod**：已可用（Astro 间接依赖）。
- **multipart** 解析：优先使用 Node 18+ 原生 `Request.formData()` + `Blob.arrayBuffer()`，不引入 `formidable`/`busboy`，减少依赖。
- **不引入 React、Next、Vue、数据库。** ✅

### NFR-6 部署与 hybrid 配置（**核心修订**）
- **删除 v1 spec 中 "dist 出现固定名 serverless 目录" 的验收规则。**
- 改成验证三条：
  1. `pnpm build`（`astro check && astro build`）exit 0；
  2. 静态页面仍正常生成到 `dist/`（含所有已存在旧 URL）；
  3. 通过引入 `@astrojs/vercel/serverless` adapter，hybrid 模式使得 `/api/admin/*` 与 `output: 'hybrid'` 声明兼容，不会出现 Astro 报错 "adapter 缺失"。
- **配置写法最终确定（astro.config.mjs）**：
  ```ts
  import { defineConfig } from 'astro/config';
  import tailwind from '@astrojs/tailwind';
  import vercel from '@astrojs/vercel/serverless';

  export default defineConfig({
    output: 'hybrid',
    adapter: vercel(),
    integrations: [tailwind()],
    i18n: { ... 原配置保持不变 ... },
    site: 'https://liushengxiong.com',
  });
  ```
  - `hybrid`：默认页面静态（和当前 static 行为一致），**只有显式 `export const prerender = false` 的 Astro Page 或 API route 才**走 serverless；本项目 `/api/admin/*` endpoints 都是 serverless endpoints（在 Astro Pages API 中默认就是 server 端）。
  - 这保证前台所有页面继续预生成（静态、性能不下降，SEO 与旧站一致），而 Admin API 是动态执行。✅

### NFR-13 Middleware 非目标
- **不创建** `src/pages/api/admin/_middleware.ts` / `src/middleware.ts`（Next/Astro middleware 风格模式）。
- 认证 guard 采用显式 helper（`src/lib/auth.ts` 的 requireAuth/requireCsrf），在每个 endpoint 顶部手工调用。✅

### NFR-14 Preview 安全（新增）
- Admin 的 Markdown 预览 iframe：`<iframe sandbox="allow-same-origin">`（不 allow-scripts / allow-top-navigation）。
- 如果预览用的是独立页面 `/admin/preview`（GET + body 经 `new Blob` + `srcdoc` 或 `srcdoc` 属性），仍需 sandbox：
  ```html
  <iframe
    sandbox="allow-same-origin"
    srcdoc="<html>...</html>"
    title="Preview"></iframe>
  ```
- 基本 Markdown XSS 测试（写入 TR）：
  - `<script>alert(1)</script>` → 预览/公开站 均不弹窗。
  - `<img src=x onerror=alert(1)>` → onerror 属性被 Astro 默认 Markdown 管道剔除 或 在 preview 的 sanitize 中剔除；若 Astro 默认未剔除，必须在 `post.astro` 使用 `@astrojs/markdown-remark` 的 `rehypePlugins: [rehype-sanitize]`。第一版**先在 Admin preview 强制 sanitize**，同时保留公开站默认行为（不破坏现有排版），并在 Phase 8 安全审计记录结果。

---

## 5. 约束 / 依赖 / 假设 / 开放问题

### 约束
- Astro 版本锁定 4.8.2；
- 不引入数据库 / Sanity / Wisp / Notion / React；
- 不在本地环境触发 git commit/push/deploy；
- 不修改生产环境变量。

### 依赖
- Vercel Project（已存在）；
- GitHub Fine-grained PAT（Contents:R/W，仅 myblog）；
- 管理员密码哈希（用户用 `node scripts/hash-password.mjs` 生成）。

### 假设
- 用户接受 "Astro → hybrid + @astrojs/vercel adapter" 的必要配置变更；
- 用户接受 About 页面关于个人经历/教育的复杂段落本次不 CMS 化；
- Admin UI 全中文；
- 项目/tools/status 字段按双语字符串存储；
- 首页 Projects 文案 bug 一并修复；
- 草稿采用 drafts 子目录 + 双重过滤；
- Content Collections 数据结构为 "目录 + 多文件"。

### 开放问题（本版全部**关闭，改为明确决策**，不再留 Open 状态）

| 编号 | 原开放问题 | 最终决策 |
|---|---|---|
| 1 | Astro output 模式？ | **`output: "hybrid"` + `@astrojs/vercel/serverless` adapter**。前台保持静态，Admin API 动态。 ✅ |
| 2 | Admin UI 语言？ | **全中文**。✅ |
| 3 | 首页 Projects section 文案 bug？ | **修复**（"精选文章"→"项目"，Featured→Projects）。✅ |
| 4 | About aboutContent CMS 化？ | **本次不纳入**，社交链接 CMS 化，其他保留在 i18n/content.js。✅ |
| 5 | Hero 图片改法？ | settings.hero.portraitImage（字符串路径），图片文件走 Admin 图片上传 commit 到 public/ 下；✅ |
| 6 | 草稿隔离？ | **src/content/post/drafts/ 子目录 + entry.slug.startsWith('drafts/') 三重过滤**。✅ |
| 7 | projects status 字段？ | **双语字符串**。✅ |
| 8 | Content Layer loaders？ | **不使用**（Astro 4 前瞻/未定型），传统 Content Collections `type: "data"` 目录多文件。✅ |
| 9 | Astro middleware 风格？ | **不用**，显式 requireAuth/requireCsrf 手动调用。✅ |
| 10 | Content Collections projects vs 单文件数组 JSON？ | **目录 + 每个项目 1 个 JSON**，`getCollection('projects')` 语义正确。✅ |
| 11 | 图片上传存储？ | **GitHub commit 到 `public/assets/images/uploads/YYYY-MM-DD/`**，不写 Vercel 临时文件当持久化。✅ |
| 12 | Cookie Path？ | **统一 `Path=/`**。✅ |

---

## 6. 验收标准（Acceptance Criteria）修订版

> 只列出**新增/修改项**（其余沿用 v1 已有的 AC-1/2/3/4/5/6/7/8/9/10 的精神，仅做必要修订）。

### 已删除的旧 AC
- 删除："dist 里有 serverless 函数目录" 那条（v1 AC-1 / NFR-6 中一条，本版全部移除）。

### AC-1 旧网站兼容性（修订验证项）
- **rule**：`pnpm build` 成功，exit 0。
- **rule**：构建后在 dist 中检查：
  - `dist/zh/post/why-i-built-this-website/index.html` 存在，
  - `dist/en/post/delivered-2400-yuan-ai-video-commission-after-7-revisions/index.html` 存在，
  - `dist/zh/index.html` / `dist/en/index.html` / `dist/zh/posts/index.html` / `dist/en/posts/index.html` / `dist/zh/projects/index.html` / `dist/en/projects/index.html` / `dist/zh/about/index.html` / `dist/en/about/index.html` 全部存在。
- **rule**：6 篇旧 Markdown 一个字节都不修改；若 Phase 7 中因为引入 i18n JSON fallback 导致某页面字节变化（例如 footer 社交链接现在从 settings 读），必须显式记录"改动原因"，且不影响视觉/SEO。
- **rule**：`pnpm preview` 启动后，`/` → 308 / redirect 到 `/zh/`（本地 preview 中可按 Astro 默认重定向检查）。

### AC-2 鉴权（**修订：Cookie Path / CSRF Cookie / 守卫调用方式**）
- **rule**：登录成功 Response Header `Set-Cookie: admin_session=...; HttpOnly; Path=/; SameSite=Lax`（Secure 仅 HTTPS）。
- **rule**：同时有 `admin_csrf=<value>; Path=/; SameSite=Lax`（非 HttpOnly）。
- **rule**：未登录 `GET /api/admin/dashboard` → 401。
- **rule**：未登录 `POST /api/admin/posts`（无 CSRF）→ 401（先触发未授权）；登录后故意不带 `X-CSRF-Token` → 403 `csrf_mismatch`。
- **rule**：登录 5 次错误密码 → 第 6 次 429 `too_many_attempts`。

### AC-3 GitHub 封装（修订：路径白名单 + commitMultipleFiles 核心 + slug 正则）
- **rule**：调用 `createFile("src/content/post/../evil.md")` → 400 `invalid_path`。
- **rule**：调用 `createFile("src/content/post/Drafts/weirdCase.md")` → 400（含大写，且前缀必须是 drafts 小写）。
- **rule**：`validateSlug('HELLO')` → 抛错；`validateSlug('hello-cms-123')` 通过；`validateSlug('why-i-built-this-website-en')` 通过。
- **rule**：`commitMultipleFiles([{path: post, content}, {path: image, b64content}], "batch save 2 files")` → 产出 1 个 commit（通过 listRecentCommits 新 commit message 出现该消息，且前后 commits 数差 1 个）。
- **rubric**（0-2；阈值≥1）：错误 kind 数 ≥ 8。

### AC-4 博客管理端到端（修订：草稿路径、slug 不改 frontmatter）
- **rule**：新建草稿文章（slug="hello-draft"）→ GitHub 写入 `src/content/post/drafts/hello-draft.md`；Astro 构建后 dist 中无 `zh/post/drafts/hello-draft`，列表页不出现在 `/zh/posts/`。
- **rule**：发布草稿 → 删除 drafts 文件，创建 `src/content/post/hello-draft.md`；公开站出现。
- **rule**：已发布文章编辑页 → slug 输入框 disabled 默认，且旁边有字符串提示："⚠ 修改 slug 会改变文章 URL，可能影响 SEO 和已有链接。"

### AC-5 JSON 改造（修订：projects/tools/resources 目录多文件；迁移前后数量验证）
- **rule**：`src/content/projects/` 目录初始 JSON 文件数 = 3（迁移 projectsContent）；`src/content/resources/` 初始 JSON 文件数 = 3。
- **rule**：Admin 新增项目后 → 目录文件数 + 1；构建后 `getCollection('projects').length` 增加 1。
- **rule**：**迁移前 vs 后对比测试（Phase 7 必做）**：
  - Projects：`zh/projectsContent.map(p => p.name)` 集合与 `projects/*.json 读取的 data.name.zh` 集合相等；
  - Resources：同理；
  - Site Settings：brand.siteTitle.zh 初始值必须等于 `ui.zh['site.title']`。
- **rubric**（AC-5 UI 一致）：≥ 1。

### AC-6 首页 Projects 文案 bug（修订）
- **rule**：`/zh/` Projects section `<h2>` 文本不含"精选文章"；
- **rule**：`/en/` Projects section `<h2>` 文本不含"Featured Posts"；
- **rule**：值分别是"项目" / "Projects"（从 `nav.projects` 键翻译）。

### AC-7 构建/SEO（修订）
- 保留；加一条 rule：`dist/zh/index.html` 含 6 篇老文章的页面不丢；SEO 标签完整。

### AC-8 安全（**大修订：cookie 路径/csrf双 cookie/ Octokit 位置 / Preview XSS**）
- **rule**：全局 grep 代码无 "GITHUB_TOKEN" / "ADMIN_JWT_SECRET" / "ADMIN_PASSWORD_HASH" 字面量。
- **rule**：Octokit（`new Octokit` 或 `new App`）仅出现在 `src/lib/github.ts`。
- **rule**：Session cookie `Path=/`，不是 `/admin`。
- **rule**：登录获取 admin_session cookie 后，对 `/api/admin/posts` 的 GET（携带 cookie）成功；同一浏览器模拟访问第三方网站发起跨站伪造表单提交 `<form action=/api/admin/posts method=post>`（POST 不带 CSRF）→ 返回 403。
- **rule**：Admin 预览 Markdown 输入 `<script>top.alert(1)</script>` → preview iframe 不弹窗。
- **rule**：预览 Markdown 输入 `<img src=x onerror=top.alert(1)>` → iframe 不弹窗（若默认不清洗也必须通过 `rehype-sanitize` 清洗）。
- **rule**：drafts/ 目录文章不出现在公开列表。
- **rule**：slug 不允许大写/中文/`..`/`/`/`\`/`.`；`validateSlug('a/b')`、`validateSlug('..')` → 400。

### AC-9 类型 / lint
- 保留。

### AC-10 图片上传（**大修订**：必须 GitHub 存储 + 5MB）
- **rule**：上传 ≥ 5.1 MB 的图片 → 413 `file_too_large`。
- **rule**：上传 `.php` / `.html`（或 Content-Type 不是 4 个允许 MIME 之一）→ 400 `invalid_mime`。
- **rule**：上传成功后只有在 GitHub 返回 201 创建成功后才返回 200；服务端不产生本地文件。
- **rule**：成功文件路径严格前缀是 `public/assets/images/uploads/YYYY-MM-DD/`，不含 `..`，文件名 ASCII。
- **rule**：`src/pages/api/admin/images/*` 必须 requireAuth（list 也需要） + upload 需要 requireCsrf。

---

## 7. 待用户手工配置（同 v1，不修订）

见末尾 tasks.md 末尾环境变量章节。
