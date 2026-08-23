/* empty css                                    */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../chunks/astro/server_sBzOckZg.mjs';
import 'kleur/colors';
import { $ as $$Admin } from '../../chunks/admin_Cq6SzB5F.mjs';
import { g as getSession } from '../../chunks/auth_C2fyY4vQ.mjs';
import { l as listDataItems } from '../../chunks/data-items_B9_6rzI-.mjs';
import { b as PREFIX_PROJECTS } from '../../chunks/github_P3asMU5M.mjs';
import { P as PROJECT_SCHEMA } from '../../chunks/schemas_8vzO8d71.mjs';
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
  let items = [];
  let loadError = "";
  try {
    const list = await listDataItems(PREFIX_PROJECTS, { schema: PROJECT_SCHEMA });
    list.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
    items = list.map((i) => ({ id: i.id, path: i.path, sha: i.sha, data: i.data }));
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u9879\u76EE\u7BA1\u7406", "username": username, "active": "projects" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap items-center justify-between gap-3"> <p class="text-sm text-slate-600 dark:text-slate-300">
项目列表用于控制首页“项目”展示。数据存储于 <code>src/content/projects/*.json</code> </p> <a href="/admin/projects/new" class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
＋ 新增项目
</a> </div> ${loadError && renderTemplate`<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
加载失败：${loadError} </div>`}<div class="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <table class="min-w-full text-sm"> <thead class="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"> <tr> <th class="px-5 py-3 font-medium">排序</th> <th class="px-5 py-3 font-medium">ID</th> <th class="px-5 py-3 font-medium">名称</th> <th class="px-5 py-3 font-medium">状态</th> <th class="px-5 py-3 font-medium">可见</th> <th class="px-5 py-3 text-right font-medium">操作</th> </tr> </thead> <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200" data-admin-projects-tbody> ${items.length === 0 ? renderTemplate`<tr> <td colspan="6" class="px-5 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
暂无项目。点击右上角“＋ 新增项目”开始。
</td> </tr>` : items.map((p, idx) => renderTemplate`<tr data-admin-projects-row${addAttribute(p.id, "data-id")}${addAttribute(p.sha, "data-sha")}${addAttribute(p.data.order ?? 0, "data-order")}> <td class="px-5 py-3"> <div class="inline-flex flex-col gap-0.5"> <button type="button" data-admin-projects-up${addAttribute(idx === 0, "disabled")} class="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" title="上移" aria-label="上移">↑</button> <button type="button" data-admin-projects-down${addAttribute(idx === items.length - 1, "disabled")} class="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" title="下移" aria-label="下移">↓</button> </div> <span class="ml-2 text-xs text-slate-400">#${p.data.order ?? 0}</span> </td> <td class="px-5 py-3 font-mono text-xs break-all">${p.id}</td> <td class="px-5 py-3"> <div class="font-medium">${p.data.name?.zh || "(\u672A\u547D\u540D)"}</div> <div class="text-xs text-slate-500 dark:text-slate-400">${p.data.name?.en}</div> </td> <td class="px-5 py-3 text-xs"> <div>${p.data.status?.zh || "\u2014"}</div> <div class="text-slate-500 dark:text-slate-400">${p.data.status?.en}</div> </td> <td class="px-5 py-3"> ${p.data.visible ? renderTemplate`<span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">显示</span>` : renderTemplate`<span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">隐藏</span>`} </td> <td class="px-5 py-3 text-right text-xs"> <a${addAttribute(`/admin/projects/${encodeURIComponent(p.id)}`, "href")} class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
编辑
</a> <button type="button" data-admin-projects-delete${addAttribute(p.id, "data-id")}${addAttribute(p.sha, "data-sha")} class="ml-1 inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40">
删除
</button> </td> </tr>`)} </tbody> </table> </div> ` })} `;
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
