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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$Admin, { "title": "\u65B0\u589E\u9879\u76EE", "username": username, "active": "projects" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<nav class="text-xs text-slate-500 dark:text-slate-400"> <a href="/admin/projects/" class="hover:text-slate-700 dark:hover:text-slate-200">项目管理</a> <span class="mx-1">/</span> <span class="text-slate-700 dark:text-slate-200">新增</span> </nav> <form data-admin-project-form class="mt-4 space-y-5" autocomplete="off"> <!-- ID --> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
ID <span class="text-red-600">*</span> <span class="ml-1 text-slate-400 font-normal">（即文件名，创建后修改会改变文件路径）</span> </label> <input type="text" name="id" data-admin-project-id required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" minlength="2" maxlength="120" placeholder="ai-workflow-lab" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> <p data-admin-project-id-hint class="mt-1 text-xs text-slate-500 dark:text-slate-400">
只能包含小写字母、数字，以连字符分隔段。例如：ai-workflow-lab
</p> </div> <!-- 名称 中/英 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
名称（中文） <span class="text-red-600">*</span> </label> <input type="text" name="name_zh" data-admin-project-name-zh required maxlength="200" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
名称（English） <span class="text-red-600">*</span> </label> <input type="text" name="name_en" data-admin-project-name-en required maxlength="200" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <!-- 描述 中/英 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
描述（中文） <span class="text-red-600">*</span> </label> <textarea name="desc_zh" data-admin-project-desc-zh required rows="3" maxlength="500" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"></textarea> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
描述（English） <span class="text-red-600">*</span> </label> <textarea name="desc_en" data-admin-project-desc-en required rows="3" maxlength="500" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"></textarea> </div> </div> <!-- 状态 中/英 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
状态（中文） <span class="text-red-600">*</span> <span class="ml-1 text-slate-400 font-normal">（如：进行中 / 已完成 / 暂停）</span> </label> <input type="text" name="status_zh" data-admin-project-status-zh required maxlength="100" placeholder="进行中" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
状态（English） <span class="text-red-600">*</span> <span class="ml-1 text-slate-400 font-normal">（如：In Progress / Completed）</span> </label> <input type="text" name="status_en" data-admin-project-status-en required maxlength="100" placeholder="In Progress" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <!-- 图片 --> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
图片路径 <span class="text-slate-400 font-normal">（可留空）</span> </label> <input type="text" name="image" data-admin-project-image placeholder="/assets/images/projects/xxx.png" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <!-- 标签 中/英 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标签（中文） <span class="text-slate-400 font-normal">（英文逗号分隔）</span> </label> <input type="text" name="tags_zh" data-admin-project-tags-zh placeholder="AI, 自动化" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
标签（English） <span class="text-slate-400 font-normal">（逗号分隔）</span> </label> <input type="text" name="tags_en" data-admin-project-tags-en placeholder="AI, Automation" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> </div> <!-- 排序 + 可见 --> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"> <div> <label class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
排序 <span class="text-slate-400 font-normal">（数字越小越靠前）</span> </label> <input type="number" name="order" data-admin-project-order value="0" min="0" step="1" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"> </div> <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 self-end pb-2"> <input type="checkbox" name="visible" data-admin-project-visible checked class="rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"> <span>显示（前台可见）</span> </label> </div> <!-- 操作 --> <div class="flex flex-wrap items-center gap-3 pt-2"> <button type="submit" data-admin-project-submit class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
创建项目
</button> <a href="/admin/projects/" class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
取消
</a> <span data-admin-project-status-text class="text-xs text-slate-500 dark:text-slate-400"></span> </div> </form> ` })} `;
}, "D:/00 \u5218\u76DB\u96C4\u77E5\u8BC6\u5E93/00 myblog/src/pages/admin/projects/new.astro", void 0);

const $$file = "D:/00 刘盛雄知识库/00 myblog/src/pages/admin/projects/new.astro";
const $$url = "/admin/projects/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
