import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_CnPlb-KM.mjs';
import { manifest } from './manifest_CiR4prE2.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin/login.astro.mjs');
const _page2 = () => import('./pages/admin/posts/new.astro.mjs');
const _page3 = () => import('./pages/admin/posts/_slug_.astro.mjs');
const _page4 = () => import('./pages/admin/posts.astro.mjs');
const _page5 = () => import('./pages/admin/projects/new.astro.mjs');
const _page6 = () => import('./pages/admin/projects/_id_.astro.mjs');
const _page7 = () => import('./pages/admin/projects.astro.mjs');
const _page8 = () => import('./pages/admin/settings.astro.mjs');
const _page9 = () => import('./pages/admin/tools/new.astro.mjs');
const _page10 = () => import('./pages/admin/tools/_id_.astro.mjs');
const _page11 = () => import('./pages/admin/tools.astro.mjs');
const _page12 = () => import('./pages/admin.astro.mjs');
const _page13 = () => import('./pages/api/admin/auth/csrf.astro.mjs');
const _page14 = () => import('./pages/api/admin/auth/login.astro.mjs');
const _page15 = () => import('./pages/api/admin/auth/logout.astro.mjs');
const _page16 = () => import('./pages/api/admin/auth/me.astro.mjs');
const _page17 = () => import('./pages/api/admin/dashboard.astro.mjs');
const _page18 = () => import('./pages/api/admin/images/upload.astro.mjs');
const _page19 = () => import('./pages/api/admin/images.astro.mjs');
const _page20 = () => import('./pages/api/admin/posts/_slug_/check.astro.mjs');
const _page21 = () => import('./pages/api/admin/posts/_slug_/publish.astro.mjs');
const _page22 = () => import('./pages/api/admin/posts/_slug_/unpublish.astro.mjs');
const _page23 = () => import('./pages/api/admin/posts/_slug_.astro.mjs');
const _page24 = () => import('./pages/api/admin/posts.astro.mjs');
const _page25 = () => import('./pages/api/admin/projects/_id_.astro.mjs');
const _page26 = () => import('./pages/api/admin/projects.astro.mjs');
const _page27 = () => import('./pages/api/admin/settings.astro.mjs');
const _page28 = () => import('./pages/api/admin/tools/_id_.astro.mjs');
const _page29 = () => import('./pages/api/admin/tools.astro.mjs');
const _page30 = () => import('./pages/en/about.astro.mjs');
const _page31 = () => import('./pages/en/post/_slug_.astro.mjs');
const _page32 = () => import('./pages/en/posts.astro.mjs');
const _page33 = () => import('./pages/en/projects.astro.mjs');
const _page34 = () => import('./pages/en.astro.mjs');
const _page35 = () => import('./pages/zh/about.astro.mjs');
const _page36 = () => import('./pages/zh/post/_slug_.astro.mjs');
const _page37 = () => import('./pages/zh/posts.astro.mjs');
const _page38 = () => import('./pages/zh/projects.astro.mjs');
const _page39 = () => import('./pages/zh.astro.mjs');
const _page40 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin/login.astro", _page1],
    ["src/pages/admin/posts/new.astro", _page2],
    ["src/pages/admin/posts/[slug].astro", _page3],
    ["src/pages/admin/posts/index.astro", _page4],
    ["src/pages/admin/projects/new.astro", _page5],
    ["src/pages/admin/projects/[id].astro", _page6],
    ["src/pages/admin/projects/index.astro", _page7],
    ["src/pages/admin/settings/index.astro", _page8],
    ["src/pages/admin/tools/new.astro", _page9],
    ["src/pages/admin/tools/[id].astro", _page10],
    ["src/pages/admin/tools/index.astro", _page11],
    ["src/pages/admin/index.astro", _page12],
    ["src/pages/api/admin/auth/csrf.ts", _page13],
    ["src/pages/api/admin/auth/login.ts", _page14],
    ["src/pages/api/admin/auth/logout.ts", _page15],
    ["src/pages/api/admin/auth/me.ts", _page16],
    ["src/pages/api/admin/dashboard.ts", _page17],
    ["src/pages/api/admin/images/upload.ts", _page18],
    ["src/pages/api/admin/images/index.ts", _page19],
    ["src/pages/api/admin/posts/[slug]/check.ts", _page20],
    ["src/pages/api/admin/posts/[slug]/publish.ts", _page21],
    ["src/pages/api/admin/posts/[slug]/unpublish.ts", _page22],
    ["src/pages/api/admin/posts/[slug]/index.ts", _page23],
    ["src/pages/api/admin/posts/index.ts", _page24],
    ["src/pages/api/admin/projects/[id].ts", _page25],
    ["src/pages/api/admin/projects/index.ts", _page26],
    ["src/pages/api/admin/settings/index.ts", _page27],
    ["src/pages/api/admin/tools/[id].ts", _page28],
    ["src/pages/api/admin/tools/index.ts", _page29],
    ["src/pages/en/about.astro", _page30],
    ["src/pages/en/post/[slug].astro", _page31],
    ["src/pages/en/posts.astro", _page32],
    ["src/pages/en/projects.astro", _page33],
    ["src/pages/en/index.astro", _page34],
    ["src/pages/zh/about.astro", _page35],
    ["src/pages/zh/post/[slug].astro", _page36],
    ["src/pages/zh/posts.astro", _page37],
    ["src/pages/zh/projects.astro", _page38],
    ["src/pages/zh/index.astro", _page39],
    ["src/pages/index.astro", _page40]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "00c788fe-3880-4bbb-85eb-a2e9b40e819e",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
