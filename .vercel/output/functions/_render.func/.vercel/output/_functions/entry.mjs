import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_CtpmYnXG.mjs';
import { manifest } from './manifest_DPvxOm8s.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin/login.astro.mjs');
const _page2 = () => import('./pages/admin/posts.astro.mjs');
const _page3 = () => import('./pages/admin/projects.astro.mjs');
const _page4 = () => import('./pages/admin/settings.astro.mjs');
const _page5 = () => import('./pages/admin/tools.astro.mjs');
const _page6 = () => import('./pages/admin.astro.mjs');
const _page7 = () => import('./pages/api/admin/auth/csrf.astro.mjs');
const _page8 = () => import('./pages/api/admin/auth/login.astro.mjs');
const _page9 = () => import('./pages/api/admin/auth/logout.astro.mjs');
const _page10 = () => import('./pages/api/admin/auth/me.astro.mjs');
const _page11 = () => import('./pages/en/about.astro.mjs');
const _page12 = () => import('./pages/en/post/_slug_.astro.mjs');
const _page13 = () => import('./pages/en/posts.astro.mjs');
const _page14 = () => import('./pages/en/projects.astro.mjs');
const _page15 = () => import('./pages/en.astro.mjs');
const _page16 = () => import('./pages/zh/about.astro.mjs');
const _page17 = () => import('./pages/zh/post/_slug_.astro.mjs');
const _page18 = () => import('./pages/zh/posts.astro.mjs');
const _page19 = () => import('./pages/zh/projects.astro.mjs');
const _page20 = () => import('./pages/zh.astro.mjs');
const _page21 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/.pnpm/astro@4.16.19_@types+node@26.2.0_rollup@4.62.5_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin/login.astro", _page1],
    ["src/pages/admin/posts/index.astro", _page2],
    ["src/pages/admin/projects/index.astro", _page3],
    ["src/pages/admin/settings/index.astro", _page4],
    ["src/pages/admin/tools/index.astro", _page5],
    ["src/pages/admin/index.astro", _page6],
    ["src/pages/api/admin/auth/csrf.ts", _page7],
    ["src/pages/api/admin/auth/login.ts", _page8],
    ["src/pages/api/admin/auth/logout.ts", _page9],
    ["src/pages/api/admin/auth/me.ts", _page10],
    ["src/pages/en/about.astro", _page11],
    ["src/pages/en/post/[slug].astro", _page12],
    ["src/pages/en/posts.astro", _page13],
    ["src/pages/en/projects.astro", _page14],
    ["src/pages/en/index.astro", _page15],
    ["src/pages/zh/about.astro", _page16],
    ["src/pages/zh/post/[slug].astro", _page17],
    ["src/pages/zh/posts.astro", _page18],
    ["src/pages/zh/projects.astro", _page19],
    ["src/pages/zh/index.astro", _page20],
    ["src/pages/index.astro", _page21]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "fbef4c72-6e40-47cd-842a-23ab1656b2bb",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
