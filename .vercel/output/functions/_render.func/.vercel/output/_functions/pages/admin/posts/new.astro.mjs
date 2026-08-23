/* empty css                                       */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../../chunks/astro/server_sBzOckZg.mjs';
import 'kleur/colors';
import { $ as $$Admin } from '../../../chunks/admin_Cq6SzB5F.mjs';
import { g as getSession } from '../../../chunks/auth_C2fyY4vQ.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro("https://liushengxiong.com");
const prerender = false;
const $$New = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$New;
  const session = await getSession(Astro2);
  if (!session) {
    const redir = encodeURIComponent(Astro2.url.pathname + Astro2.url.search);
    return Astro2.redirect(`/admin/login?redirect=${redir}`);
  }
  const username = session.username;
  const today = /* @__PURE__ */ new Date();
  const defaultDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u65B0\u5EFA\u6587\u7AE0", "username": username, "active": "posts" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<nav class="text-xs text-slate-500 dark:text-slate-400"> <a href="/admin/posts/" class="hover:text-slate-700 dark:hover:text-slate-200">博客管理</a> <span class="mx-1">/</span> <span class="text-slate-700 dark:text-slate-200">新建</span> </nav> <form data-admin-post-form class="space-y-5" autocomplete="off"> <!-- slug + 状态 --> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"> <div class="md:col-span-2"> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
Slug <span class="text-red-600">*</span> <span class="ml-1 text-slate-400 font-normal">（即文件名与公开 URL）</span> </label> <input type="text" name="slug" data-admin-post-slug required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" minlength="2" maxlength="120" placeholder="hello-draft" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> <p data-admin-post-slug-hint class="mt-1 text-xs text-slate-500 dark:text-slate-400">
只能包含小写字母、数字，以连字符分隔段。例如：why-i-built-this-website
</p> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">状态</label> <select name="status" data-admin-post-status class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> <option value="published">已发布（写入 src/content/post/）</option> <option value="draft" selected>草稿（写入 src/content/post/drafts/）</option> </select> </div> </div> <!-- 标题 --> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标题 <span class="text-red-600">*</span> </label> <input type="text" name="title" data-admin-post-title required maxlength="200" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <!-- 描述 --> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
描述 <span class="text-red-600">*</span> </label> <textarea name="description" data-admin-post-description required rows="2" maxlength="500" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"></textarea> </div> <!-- 日期 + 语言 + 标签 + featured --> <div class="grid grid-cols-1 md:grid-cols-4 gap-4"> <div class="md:col-span-2"> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
发布日期 <span class="text-red-600">*</span> <span class="ml-1 text-slate-400 font-normal">（与现有文章一致：May 8, 2024）</span> </label> <input type="text" name="dateFormatted" data-admin-post-date required${addAttribute(defaultDate, "value")} placeholder="May 8, 2024" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">语言</label> <select name="locale" data-admin-post-locale class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> <option value="zh" selected>中文</option> <option value="en">English</option> </select> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标签 <span class="text-slate-400 font-normal">（英文逗号分隔）</span> </label> <input type="text" name="tags" data-admin-post-tags placeholder="AI, 个人品牌" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"> <input type="checkbox" name="featured" data-admin-post-featured class="rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"> <span>精选文章（首页置顶）</span> </label> <!-- 正文 + 预览 --> <div class="grid grid-cols-1 lg:grid-cols-2 gap-5"> <div> <div class="flex items-center justify-between mb-1.5"> <label class="text-xs font-medium text-slate-700 dark:text-slate-200">
正文（Markdown） <span class="text-red-600">*</span> </label> <div class="flex items-center gap-2"> <button type="button" data-admin-post-insert-image class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
插入图片
</button> <span class="text-xs text-slate-400">实时预览在右侧</span> </div> </div> <textarea name="body" data-admin-post-body required rows="22" placeholder="# 标题

正文段落…

- 列表项

\`\`\`js
console.log('hi');
\`\`\`" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"></textarea> </div> <div> <div class="flex items-center justify-between mb-1.5"> <label class="text-xs font-medium text-slate-700 dark:text-slate-200">预览</label> <span class="text-xs text-slate-400">iframe sandbox 隔离</span> </div> <iframe data-admin-post-preview sandbox="allow-same-origin" srcdoc="" title="Markdown 预览" class="w-full h-[560px] rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"></iframe> </div> </div> <!-- 操作 --> <div class="flex flex-wrap items-center gap-3 pt-2"> <button type="submit" data-admin-post-submit class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
创建文章
</button> <a href="/admin/posts/" class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
取消
</a> <span data-admin-post-status-text class="text-xs text-slate-500 dark:text-slate-400"></span> </div> </form> ` })} `;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/posts/new.astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/posts/new.astro";
const $$url = "/admin/posts/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
