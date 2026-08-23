/* empty css                                    */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../chunks/astro/server_DnaBh5ta.mjs';
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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u7F51\u7AD9\u8BBE\u7F6E", "username": username, "active": "settings" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="grid gap-6 lg:grid-cols-2"> ${[
    { t: "\u54C1\u724C\u4FE1\u606F", d: "\u7F51\u7AD9\u540D\u79F0 / \u526F\u6807\u9898 / Logo / Favicon", status: "Phase 6 \u63A5\u5165" },
    { t: "\u9996\u9875 Hero", d: "\u6807\u9898 / \u526F\u6807\u9898 / CTA \u6309\u94AE\uFF08\u4E2D\u82F1\u6587\uFF09", status: "Phase 6 \u63A5\u5165" },
    { t: "\u793E\u4EA4\u94FE\u63A5", d: "GitHub / Email / \u5FAE\u4FE1 \u7B49", status: "Phase 6 \u63A5\u5165" },
    { t: "SEO", d: "Default Title / Description / Keywords / OG \u515C\u5E95", status: "Phase 6 \u63A5\u5165" },
    { t: "Footer \u6587\u6848", d: "\u7248\u6743\u58F0\u660E / \u5EFA\u7AD9\u8BF4\u660E\u7B49", status: "Phase 6 \u63A5\u5165" },
    { t: "\u7F13\u5B58 & \u90E8\u7F72", d: "\u6B64\u5904\u4E0D\u505A\uFF1A\u901A\u8FC7 Vercel \u4E0E GitHub \u81EA\u52A8\u90E8\u7F72\u5904\u7406", status: "\u4E0D\u63A5\u5165" }
  ].map((s) => renderTemplate`<div class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"> <div class="flex items-start justify-between gap-3"> <div> <h3 class="text-sm font-semibold">${s.t}</h3> <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">${s.d}</p> </div> <span${addAttribute([
    "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
    s.status === "\u4E0D\u63A5\u5165" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
  ], "class:list")}> ${s.status} </span> </div> </div>`)} </div> ` })}`;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/settings/index.astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/settings/index.astro";
const $$url = "/admin/settings";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
