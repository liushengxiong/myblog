/* empty css                                    */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_DnaBh5ta.mjs';
import { $ as $$Admin } from '../../chunks/admin_DLvfdlhV.mjs';
import { g as getSession } from '../../chunks/auth_T38O31Gl.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://liushengxiong.com");
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const session = await getSession(Astro2);
  if (!session) {
    const redir = encodeURIComponent(Astro2.url.pathname);
    return Astro2.redirect(`/admin/login?redirect=${redir}`);
  }
  const username = session.username;
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u535A\u5BA2\u7BA1\u7406", "username": username, "active": "posts" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap items-center gap-3"> <div class="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <input type="search" name="q" data-admin-posts-search placeholder="搜索文章标题 / 标签…（Phase 3 接入）" class="w-full bg-transparent px-4 py-3 text-sm outline-none"> </div> <a href="/admin/posts/new" class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
＋ 新建文章
</a> </div> <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <table class="min-w-full text-sm"> <thead class="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"> <tr> <th class="px-5 py-3 font-medium">标题 / Slug</th> <th class="px-5 py-3 font-medium">语言</th> <th class="px-5 py-3 font-medium">状态</th> <th class="px-5 py-3 font-medium">发布日期</th> <th class="px-5 py-3 text-right font-medium">操作</th> </tr> </thead> <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200"> <tr> <td colspan="5" class="px-5 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
Phase 1 占位：文章列表会在 Phase 3 通过 /api/admin/posts 读取并填充。
</td> </tr> </tbody> </table> </div> ` })}`;
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
