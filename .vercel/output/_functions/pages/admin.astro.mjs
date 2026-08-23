/* empty css                                 */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_sBzOckZg.mjs';
import 'kleur/colors';
import { $ as $$Admin } from '../chunks/admin_Cq6SzB5F.mjs';
import { g as getSession } from '../chunks/auth_C2fyY4vQ.mjs';
export { renderers } from '../renderers.mjs';

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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u4EEA\u8868\u76D8", "username": username, "active": "dashboard" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-admin-kpi-grid> ${[
    { label: "\u535A\u5BA2\u6587\u7AE0", key: "posts", desc: "\u5DF2\u53D1\u5E03 + \u8349\u7A3F", accent: "from-indigo-600 to-indigo-500", href: "/admin/posts/" },
    { label: "\u5DE5\u5177", key: "tools", desc: "\u9996\u9875\u5DE5\u5177\u5361\u7247", accent: "from-emerald-600 to-emerald-500", href: "/admin/tools/" },
    { label: "\u9879\u76EE", key: "projects", desc: "\u9996\u9875\u9879\u76EE\u5361\u7247", accent: "from-amber-600 to-amber-500", href: "/admin/projects/" },
    { label: "\u8D44\u6E90", key: "resources", desc: "\u9996\u9875\u8D44\u6E90\u5361\u7247", accent: "from-sky-600 to-sky-500", href: "/admin/resources/" },
    { label: "\u7F51\u7AD9\u8BBE\u7F6E", key: "settings", desc: "\u54C1\u724C / \u793E\u4EA4 / SEO", accent: "from-rose-600 to-rose-500", href: "/admin/settings/" },
    { label: "\u8349\u7A3F\u6570", key: "drafts", desc: "\u672A\u53D1\u5E03\u8349\u7A3F", accent: "from-violet-600 to-violet-500", href: "/admin/posts/?status=draft" }
  ].map((kpi) => renderTemplate`<a${addAttribute(kpi.href, "href")} class="block rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-colors"${addAttribute(kpi.key, "data-admin-kpi-card")}> <div class="flex items-center justify-between"> <div> <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">${kpi.label}</div> <div class="mt-2 text-2xl font-semibold"${addAttribute(kpi.key, "data-admin-kpi-value")}>–</div> </div> <span${addAttribute(["h-10 w-10 rounded-xl bg-gradient-to-br opacity-90 shadow-sm", kpi.accent], "class:list")}></span> </div> <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">${kpi.desc}</p> </a>`)} </div>  <div class="mt-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800"> <h2 class="text-sm font-semibold">最近提交</h2> <span class="text-xs text-slate-400">最多 10 条</span> </div> <div class="overflow-x-auto"> <table class="min-w-full text-sm"> <thead class="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"> <tr> <th class="px-5 py-3 font-medium">SHA</th> <th class="px-5 py-3 font-medium">Message</th> <th class="px-5 py-3 font-medium">作者</th> <th class="px-5 py-3 font-medium">时间</th> </tr> </thead> <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200" data-admin-commits-tbody> <tr><td colspan="4" class="px-5 py-6 text-center text-xs text-slate-400">加载中…</td></tr> </tbody> </table> </div> </div> <div class="mt-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <div class="border-b border-slate-100 px-6 py-4 dark:border-slate-800"> <h2 class="text-sm font-semibold">使用说明</h2> </div> <ol class="px-6 py-4 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside"> <li>后台修改内容会通过 GitHub API 直接写入仓库的 Markdown / JSON 文件。</li> <li>每次保存或发布都会形成一条清晰的 Git commit。</li> <li>GitHub push 成功后，Vercel 会自动检测并构建部署新站点（通常 30–90 秒）。</li> <li>草稿文章会保存到 <code class="text-[12px]">src/content/post/drafts/</code>，并且公开网站三重过滤，不会显示。</li> <li>如遇“GitHub 提交失败”，不要重复点击“发布”，请先检查 Token 权限与网络。</li> </ol> </div> ` })} `;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/index.astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
