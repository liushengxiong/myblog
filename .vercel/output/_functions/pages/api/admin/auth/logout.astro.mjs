import { w as withApiGuard } from '../../../../chunks/api-guard_Bct9MpxU.mjs';
import { j as clearSessionCookie } from '../../../../chunks/auth_C2fyY4vQ.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const POST = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    clearSessionCookie(ctx);
    return new Response(null, { status: 204 });
  }
);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
