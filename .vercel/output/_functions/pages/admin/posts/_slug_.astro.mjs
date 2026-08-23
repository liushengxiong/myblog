/* empty css                                       */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, u as unescapeHTML, d as addAttribute, m as maybeRenderHead } from '../../../chunks/astro/server_sBzOckZg.mjs';
import 'kleur/colors';
import { $ as $$Admin } from '../../../chunks/admin_Cq6SzB5F.mjs';
import { g as getSession } from '../../../chunks/auth_C2fyY4vQ.mjs';
import { f as findPost } from '../../../chunks/posts_Drh2qyUh.mjs';
import { parseFrontmatter } from '../../../chunks/markdown_Dq9cX7aD.mjs';
import { G as GitHubError } from '../../../chunks/github_P3asMU5M.mjs';
export { renderers } from '../../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://liushengxiong.com");
const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const session = await getSession(Astro2);
  if (!session) {
    const redir = encodeURIComponent(Astro2.url.pathname + Astro2.url.search);
    return Astro2.redirect(`/admin/login?redirect=${redir}`);
  }
  const username = session.username;
  const slug = Astro2.params.slug ?? "";
  let notFound = false;
  let serverError = "";
  let title = "";
  let description = "";
  let dateFormatted = "";
  let locale = "zh";
  let tags = [];
  let featured = false;
  let body = "";
  let status = "published";
  let sha = "";
  let path = "";
  if (slug) {
    try {
      const found = await findPost(slug);
      if (!found) {
        notFound = true;
      } else {
        status = found.status;
        sha = found.info.sha;
        path = found.info.path;
        const r = parseFrontmatter(found.info.content);
        title = r.frontmatter.title;
        description = r.frontmatter.description;
        dateFormatted = r.frontmatter.dateFormatted;
        locale = r.frontmatter.locale;
        tags = r.frontmatter.tags ?? [];
        featured = r.frontmatter.featured;
        body = r.body;
      }
    } catch (e) {
      if (e instanceof GitHubError) {
        serverError = e.message;
      } else {
        serverError = e instanceof Error ? e.message : String(e);
      }
    }
  } else {
    notFound = true;
  }
  const initial = {
    slug,
    title,
    description,
    dateFormatted,
    locale,
    tags,
    featured,
    body,
    status,
    sha,
    path
  };
  const initialJson = JSON.stringify(initial);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": `\u7F16\u8F91\uFF1A${slug || "\u6587\u7AE0"}`, "username": username, "active": "posts" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<nav class="text-xs text-slate-500 dark:text-slate-400"> <a href="/admin/posts/" class="hover:text-slate-700 dark:hover:text-slate-200">\u535A\u5BA2\u7BA1\u7406</a> <span class="mx-1">/</span> <span class="text-slate-700 dark:text-slate-200">', "</span> </nav> ", "", "", '<script type="application/json" data-admin-post-initial>', "<\/script> "])), maybeRenderHead(), slug, notFound && renderTemplate`<div class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"> <div class="font-medium">文章未找到</div> <p class="mt-1 text-xs">slug "${slug}" 在 post/ 与 drafts/ 下都不存在。可能已被删除，或 slug 不正确。</p> <a href="/admin/posts/" class="mt-3 inline-flex rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">返回列表</a> </div>`, serverError && !notFound && renderTemplate`<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"> <div class="font-medium">读取文章时出错</div> <p class="mt-1 text-xs font-mono break-all">${serverError}</p> </div>`, !notFound && !serverError && renderTemplate`<form data-admin-post-form class="space-y-5" autocomplete="off"> <!-- slug 锁定警告条（仅已发布文章显示） --> ${status === "published" && renderTemplate`<div data-admin-post-slug-warning class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"> <span class="text-base leading-none">⚠</span> <div class="flex-1"> <div class="font-medium">已发布文章的 slug 默认锁定</div> <p class="mt-0.5">修改 slug 会改变文章 URL，可能影响 SEO 和已有链接。</p> </div> <button type="button" data-admin-post-slug-unlock class="shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900/40">
解锁修改
</button> </div>`} <!-- slug + 状态 --> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"> <div class="md:col-span-2"> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
Slug <span class="text-red-600">*</span> <span class="ml-1 text-slate-400 font-normal">（即文件名与公开 URL）</span> </label> <input type="text" name="slug" data-admin-post-slug required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" minlength="2" maxlength="120"${addAttribute(slug, "value")}${addAttribute(status === "published", "disabled")} class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"> <p data-admin-post-slug-hint class="mt-1 text-xs text-slate-500 dark:text-slate-400"> ${status === "published" ? "\u5DF2\u53D1\u5E03\uFF1Aslug \u9501\u5B9A\uFF0C\u70B9\u51FB\u4E0A\u65B9\u300C\u89E3\u9501\u4FEE\u6539\u300D\u53EF\u6539\uFF08\u4E0D\u63A8\u8350\uFF09\u3002" : "\u8349\u7A3F\uFF1A\u53EF\u81EA\u7531\u4FEE\u6539 slug\uFF08\u4ECD\u9700\u552F\u4E00\uFF09\u3002"} </p> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">状态</label> <select name="status" data-admin-post-status class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> <option value="published"${addAttribute(status === "published", "selected")}>已发布（src/content/post/）</option> <option value="draft"${addAttribute(status === "draft", "selected")}>草稿（src/content/post/drafts/）</option> </select> </div> </div> <input type="hidden" data-admin-post-existing-sha${addAttribute(sha, "value")}> <input type="hidden" data-admin-post-original-slug${addAttribute(slug, "value")}> <input type="hidden" data-admin-post-original-status${addAttribute(status, "value")}> <!-- 标题 --> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标题 <span class="text-red-600">*</span> </label> <input type="text" name="title" data-admin-post-title required maxlength="200"${addAttribute(title, "value")} class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <!-- 描述 --> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
描述 <span class="text-red-600">*</span> </label> <textarea name="description" data-admin-post-description required rows="2" maxlength="500" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900">${description}</textarea> </div> <!-- 日期 + 语言 + 标签 --> <div class="grid grid-cols-1 md:grid-cols-4 gap-4"> <div class="md:col-span-2"> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
发布日期 <span class="text-red-600">*</span> </label> <input type="text" name="dateFormatted" data-admin-post-date required${addAttribute(dateFormatted, "value")} placeholder="May 8, 2024" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">语言</label> <select name="locale" data-admin-post-locale class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> <option value="zh"${addAttribute(locale === "zh", "selected")}>中文</option> <option value="en"${addAttribute(locale === "en", "selected")}>English</option> </select> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标签 <span class="text-slate-400 font-normal">（英文逗号分隔）</span> </label> <input type="text" name="tags" data-admin-post-tags${addAttribute(tags.join(", "), "value")} placeholder="AI, 个人品牌" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"> <input type="checkbox" name="featured" data-admin-post-featured${addAttribute(featured, "checked")} class="rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"> <span>精选文章（首页置顶）</span> </label> <!-- 正文 + 预览 --> <div class="grid grid-cols-1 lg:grid-cols-2 gap-5"> <div> <div class="flex items-center justify-between mb-1.5"> <label class="text-xs font-medium text-slate-700 dark:text-slate-200">
正文（Markdown） <span class="text-red-600">*</span> </label> <div class="flex items-center gap-2"> <button type="button" data-admin-post-insert-image class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
插入图片
</button> <span class="text-xs text-slate-400">实时预览在右侧</span> </div> </div> <textarea name="body" data-admin-post-body required rows="22" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900">${body}</textarea> </div> <div> <div class="flex items-center justify-between mb-1.5"> <label class="text-xs font-medium text-slate-700 dark:text-slate-200">预览</label> <span class="text-xs text-slate-400">iframe sandbox 隔离</span> </div> <iframe data-admin-post-preview sandbox="allow-same-origin" srcdoc="" title="Markdown 预览" class="w-full h-[560px] rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"></iframe> </div> </div> <!-- 元数据 --> <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"> <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"> <div><span class="text-slate-500 dark:text-slate-400">仓库路径：</span><code class="font-mono break-all">${path}</code></div> <div><span class="text-slate-500 dark:text-slate-400">当前 SHA：</span><code class="font-mono break-all">${sha.slice(0, 12)}…</code></div> </div> </div> <!-- 操作 --> <div class="flex flex-wrap items-center gap-3 pt-2"> <button type="submit" data-admin-post-submit class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
保存修改
</button> ${status === "draft" && renderTemplate`<button type="button" data-admin-post-publish class="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40">
发布到公开站
</button>`} ${status === "published" && renderTemplate`<button type="button" data-admin-post-unpublish class="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-950/40">
移回草稿
</button>`} <button type="button" data-admin-post-delete class="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40">
删除文章
</button> <a href="/admin/posts/" class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
返回列表
</a> <span data-admin-post-status-text class="text-xs text-slate-500 dark:text-slate-400"></span> </div> </form>`, unescapeHTML(initialJson)) })} `;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/posts/[slug].astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/posts/[slug].astro";
const $$url = "/admin/posts/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
