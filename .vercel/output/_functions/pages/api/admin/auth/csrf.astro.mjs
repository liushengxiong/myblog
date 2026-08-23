import { j as json } from '../../../../chunks/api-guard_Bct9MpxU.mjs';
import { g as getSession, c as getCsrfCookie, v as verifyCsrfToken, d as createCsrfToken, s as setCsrfCookie } from '../../../../chunks/auth_C2fyY4vQ.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
async function GET(ctx) {
  const session = await getSession(ctx);
  if (!session) {
    return json({
      ok: true,
      token: null,
      requiresLogin: true
    });
  }
  const existing = getCsrfCookie(ctx);
  if (existing && verifyCsrfToken(existing, session)) {
    return json({ ok: true, token: existing, requiresLogin: false });
  }
  const token = createCsrfToken(session);
  setCsrfCookie(ctx, token);
  return json({ ok: true, token, requiresLogin: false });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
