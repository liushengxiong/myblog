/* empty css                                    */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../chunks/astro/server_sBzOckZg.mjs';
import 'kleur/colors';
import { $ as $$Admin } from '../../chunks/admin_Cq6SzB5F.mjs';
import { g as getSession } from '../../chunks/auth_C2fyY4vQ.mjs';
import { l as listAllPostFiles } from '../../chunks/posts_Drh2qyUh.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://liushengxiong.com");
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const session = await getSession(Astro2);
  if (!session) {
    const redir = encodeURIComponent(Astro2.url.pathname + Astro2.url.search);
    return Astro2.redirect(`/admin/login?redirect=${redir}`);
  }
  const username = session.username;
  const files = await listAllPostFiles({ withMeta: true });
  const items = files.map((f) => ({
    slug: f.slug,
    status: f.status,
    path: f.path,
    sha: f.sha,
    title: f.title || "",
    description: f.description || "",
    dateFormatted: f.dateFormatted || "",
    locale: f.locale || "zh",
    tags: f.tags || [],
    featured: !!f.featured
  }));
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u535A\u5BA2\u7BA1\u7406", "username": username, "active": "posts" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap items-center gap-3"> <div class="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <input type="search" name="q" data-admin-posts-search placeholder="搜索标题或 slug…" class="w-full bg-transparent px-4 py-3 text-sm outline-none"> </div> <label class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
语言
<select name="lang" data-admin-posts-lang class="bg-transparent text-xs"> <option value="">全部</option> <option value="zh">中文</option> <option value="en">English</option> </select> </label> <a href="/admin/posts/new" class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
＋ 新建文章
</a> </div> <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <table class="min-w-full text-sm"> <thead class="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"> <tr> <th class="px-5 py-3 font-medium">标题 / Slug</th> <th class="px-5 py-3 font-medium">语言</th> <th class="px-5 py-3 font-medium">状态</th> <th class="px-5 py-3 font-medium">发布日期</th> <th class="px-5 py-3 text-right font-medium">操作</th> </tr> </thead> <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200" data-admin-posts-tbody> ${items.length === 0 ? renderTemplate`<tr> <td colspan="5" class="px-5 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
暂无文章。点击右上角"＋ 新建文章"开始。
</td> </tr>` : items.map((p) => renderTemplate`<tr data-admin-posts-row${addAttribute(p.slug, "data-slug")}${addAttribute(p.status, "data-status")}${addAttribute(p.locale, "data-locale")}${addAttribute(p.title, "data-title")}> <td class="px-5 py-3"> <div class="font-medium">${p.title || "(\u672A\u547D\u540D)"}</div> <div class="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">${p.slug}</div> </td> <td class="px-5 py-3 text-xs">${p.locale || "zh"}</td> <td class="px-5 py-3 text-xs"> ${p.status === "draft" ? renderTemplate`<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">草稿</span>` : renderTemplate`<span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">已发布</span>`} </td> <td class="px-5 py-3 text-xs">${p.dateFormatted || "\u2014"}</td> <td class="px-5 py-3 text-right text-xs"> <a${addAttribute(`/admin/posts/${encodeURIComponent(p.slug)}`, "href")} class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
编辑
</a> <button type="button" data-admin-posts-delete${addAttribute(p.slug, "data-slug")}${addAttribute(p.sha, "data-sha")} class="ml-1 inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40">
删除
</button> </td> </tr>`)} </tbody> </table> </div> ` })} `;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/posts/index.astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/posts/index.astro";
const $$url = "/admin/posts";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
