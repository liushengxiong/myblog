/* empty css                                       */
import { c as createAstro, a as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../../chunks/astro/server_sBzOckZg.mjs';
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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u65B0\u589E\u5DE5\u5177", "username": username, "active": "tools" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<nav class="text-xs text-slate-500 dark:text-slate-400"> <a href="/admin/tools/" class="hover:text-slate-700 dark:hover:text-slate-200">工具管理</a> <span class="mx-1">/</span> <span class="text-slate-700 dark:text-slate-200">新增</span> </nav> <form data-admin-tool-form class="mt-4 space-y-5" autocomplete="off"> <!-- ID --> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
ID <span class="text-red-600">*</span> <span class="ml-1 text-slate-400 font-normal">（即文件名，创建后修改会改变文件路径）</span> </label> <input type="text" name="id" data-admin-tool-id required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" minlength="2" maxlength="120" placeholder="ai-product-image" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> <p data-admin-tool-id-hint class="mt-1 text-xs text-slate-500 dark:text-slate-400">
只能包含小写字母、数字，以连字符分隔段。例如：ai-product-image
</p> </div> <!-- 名称 中/英 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
名称（中文） <span class="text-red-600">*</span> </label> <input type="text" name="name_zh" data-admin-tool-name-zh required maxlength="200" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
名称（English） <span class="text-red-600">*</span> </label> <input type="text" name="name_en" data-admin-tool-name-en required maxlength="200" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <!-- 描述 中/英 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
描述（中文） <span class="text-red-600">*</span> </label> <textarea name="desc_zh" data-admin-tool-desc-zh required rows="3" maxlength="500" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"></textarea> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
描述（English） <span class="text-red-600">*</span> </label> <textarea name="desc_en" data-admin-tool-desc-en required rows="3" maxlength="500" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"></textarea> </div> </div> <!-- URL + 图片 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
URL <span class="text-slate-400 font-normal">（留空则不跳转）</span> </label> <input type="url" name="url" data-admin-tool-url placeholder="https://example.com" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
图片路径 <span class="text-slate-400 font-normal">（可留空）</span> </label> <input type="text" name="image" data-admin-tool-image placeholder="/assets/images/projects/xxx.png" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <!-- 标签 中/英 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标签（中文） <span class="text-slate-400 font-normal">（英文逗号分隔）</span> </label> <input type="text" name="tags_zh" data-admin-tool-tags-zh placeholder="AI, 图片" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标签（English） <span class="text-slate-400 font-normal">（逗号分隔）</span> </label> <input type="text" name="tags_en" data-admin-tool-tags-en placeholder="AI, Image" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <!-- 排序 + 可见 + featured --> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
排序 <span class="text-slate-400 font-normal">（数字越小越靠前）</span> </label> <input type="number" name="order" data-admin-tool-order value="0" min="0" step="1" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 self-end pb-2"> <input type="checkbox" name="visible" data-admin-tool-visible checked class="rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"> <span>显示（前台可见）</span> </label> <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 self-end pb-2"> <input type="checkbox" name="featured" data-admin-tool-featured class="rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"> <span>推荐（置顶标记）</span> </label> </div> <!-- 操作 --> <div class="flex flex-wrap items-center gap-3 pt-2"> <button type="submit" data-admin-tool-submit class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
创建工具
</button> <a href="/admin/tools/" class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
取消
</a> <span data-admin-tool-status-text class="text-xs text-slate-500 dark:text-slate-400"></span> </div> </form> ` })} `;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/tools/new.astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/tools/new.astro";
const $$url = "/admin/tools/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
