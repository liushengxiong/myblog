import { w as withApiGuard, j as json } from '../../../../chunks/api-guard_Bct9MpxU.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const GET = withApiGuard({ auth: true }, async ({ session }) => {
  return json({
    ok: true,
    username: session?.username,
    iat: session?.iat,
    exp: session?.exp
  });
});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
