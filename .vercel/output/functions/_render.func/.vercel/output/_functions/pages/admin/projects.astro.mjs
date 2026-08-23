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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u9879\u76EE\u7BA1\u7406", "username": username, "active": "projects" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap items-center justify-between gap-3"> <p class="text-sm text-slate-600 dark:text-slate-300">
项目列表用于控制首页“项目”展示。数据存储于 <code>src/content/projects/*.json</code>，Phase 5 接入。
</p> <button type="button" disabled class="inline-flex items-center gap-1 rounded-lg bg-slate-300 px-4 py-3 text-sm font-medium text-slate-700 shadow cursor-not-allowed opacity-80 dark:bg-slate-700 dark:text-slate-200">
＋ 新增项目（Phase 5）
</button> </div> <div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
占位页面。Phase 5 实现 CRUD 与双语字段维护。
</div> ` })}`;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/projects/index.astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/projects/index.astro";
const $$url = "/admin/projects";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
