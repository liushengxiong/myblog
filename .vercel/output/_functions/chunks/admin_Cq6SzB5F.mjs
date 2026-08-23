import { c as createAstro, a as createComponent, r as renderTemplate, b as renderSlot, d as addAttribute, e as renderHead } from './astro/server_sBzOckZg.mjs';
import 'kleur/colors';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://liushengxiong.com");
const $$Admin = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Admin;
  const { title, username, active } = Astro2.props;
  const navItems = [
    { key: "dashboard", label: "\u4EEA\u8868\u76D8", href: "/admin/", icon: "\u25A3" },
    { key: "posts", label: "\u535A\u5BA2\u7BA1\u7406", href: "/admin/posts/", icon: "\u270E" },
    { key: "tools", label: "\u5DE5\u5177\u7BA1\u7406", href: "/admin/tools/", icon: "\u2692" },
    { key: "projects", label: "\u9879\u76EE\u7BA1\u7406", href: "/admin/projects/", icon: "\u25C8" },
    { key: "settings", label: "\u7F51\u7AD9\u8BBE\u7F6E", href: "/admin/settings/", icon: "\u2699" }
  ];
  return renderTemplate(_a || (_a = __template(['<html lang="zh-CN"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>', ' \xB7 \u540E\u53F0\u7BA1\u7406 \xB7 liushengxiong.com</title><meta name="robots" content="noindex,nofollow,noarchive"><meta name="color-scheme" content="light dark">', '</head> <body class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased"> <div class="flex min-h-screen"> <!-- \u4FA7\u8FB9\u680F --> <aside class="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"> <a href="/admin/" class="flex items-center gap-2 px-5 py-5 border-b border-slate-200 dark:border-slate-800"> <span class="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black">L</span> <div class="leading-tight"> <div class="text-sm font-semibold">\u5218\u76DB\u96C4</div> <div class="text-xs text-slate-500 dark:text-slate-400">\u5185\u5BB9\u7BA1\u7406\u540E\u53F0</div> </div> </a> <nav class="flex-1 px-3 py-4 space-y-1"> ', ' </nav> <div class="px-3 py-3 border-t border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"> <div class="flex items-center justify-between"> <span>\u767B\u5F55\u8EAB\u4EFD</span> <span class="font-medium text-slate-700 dark:text-slate-200">', '</span> </div> <div class="mt-1">Astro \xB7 GitHub \u5185\u5BB9\u4ED3\u5E93\u76F4\u8FDE</div> </div> </aside> <!-- \u79FB\u52A8\u7AEF\u7B80\u6613\u9876\u90E8\u680F tab\uFF08\u4E0D\u5F15\u5165 JS\uFF09 --> <div class="md:hidden w-full sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"> <div class="flex items-center gap-2 px-4 py-3"> <span class="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black">L</span> <div class="text-sm font-semibold">\u540E\u53F0\u7BA1\u7406</div> <div class="ml-auto text-xs text-slate-500 dark:text-slate-400">', '</div> </div> <nav class="flex overflow-x-auto gap-1 px-2 pb-2"> ', ' </nav> </div> <!-- \u4E3B\u533A --> <main class="flex-1 min-w-0"> <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"> <div class="flex items-center gap-3 px-5 md:px-8 py-4"> <div class="min-w-0"> <h1 class="text-lg md:text-xl font-semibold truncate">', '</h1> <p class="text-xs text-slate-500 dark:text-slate-400 truncate">\n\u4FEE\u6539\u4F1A\u901A\u8FC7 GitHub API \u63D0\u4EA4\uFF0C\u7136\u540E Vercel \u81EA\u52A8\u90E8\u7F72\u3002\n</p> </div> <div class="ml-auto flex items-center gap-2"> <a href="/zh/" target="_blank" rel="noreferrer" class="hidden md:inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">\n\u67E5\u770B\u5B98\u7F51 \u2197\n</a> <button type="button" data-admin-logout class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">\n\u9000\u51FA\u767B\u5F55\n</button> </div> </div> </header> <section class="p-5 md:p-8 space-y-6"> ', ' </section> </main> </div> <script type="module" src="/src/assets/js/admin.ts"><\/script> </body> </html>'])), title, renderHead(), navItems.map((n) => {
    const on = n.key === active;
    return renderTemplate`<a${addAttribute(n.href, "href")}${addAttribute(on ? "true" : "false", "data-active")}${addAttribute([
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
      on ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium shadow" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    ], "class:list")}> <span class="w-4 text-center opacity-80" aria-hidden="true">${n.icon}</span> <span>${n.label}</span> </a>`;
  }), username, username, navItems.map((n) => {
    const on = n.key === active;
    return renderTemplate`<a${addAttribute(n.href, "href")}${addAttribute([
      "whitespace-nowrap rounded-md px-3 py-1.5 text-xs",
      on ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    ], "class:list")}> ${n.label} </a>`;
  }), title, renderSlot($$result, $$slots["default"]));
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/layouts/admin.astro", void 0);

export { $$Admin as $ };
