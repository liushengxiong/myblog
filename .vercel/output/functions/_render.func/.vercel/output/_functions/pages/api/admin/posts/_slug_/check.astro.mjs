import { w as withApiGuard, j as json } from '../../../../../chunks/api-guard_Bct9MpxU.mjs';
import { s as slugExists } from '../../../../../chunks/posts_Drh2qyUh.mjs';
export { renderers } from '../../../../../renderers.mjs';

const prerender = false;
const POST = withApiGuard(
  { auth: true, csrf: false },
  // GET-style 检查，无需 CSRF
  async ({ ctx }) => {
    const slug = ctx.params.slug;
    if (!slug) {
      return json({ ok: true, slug: "", exists: false, status: null });
    }
    const r = await slugExists(slug);
    return json({
      ok: true,
      slug,
      exists: r.exists,
      status: r.status ?? null
    });
  }
);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
