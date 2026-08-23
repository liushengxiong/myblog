import crypto from 'node:crypto';
import { a as jsonError, j as json } from '../../../../chunks/api-guard_Bct9MpxU.mjs';
import { e as extractClientIp, r as rateLimit, f as verifyPassword, h as signJwt, d as createCsrfToken, i as setSessionCookie, s as setCsrfCookie } from '../../../../chunks/auth_C2fyY4vQ.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
async function POST(ctx) {
  try {
    const ip = extractClientIp(ctx);
    const rl = rateLimit(`login:${ip}`, 5, 15 * 60 * 1e3);
    if (rl.blocked) {
      return jsonError(
        `登录尝试过于频繁，请 ${Math.ceil(rl.retryAfterMs / 1e3)} 秒后再试。`,
        "RATE_LIMITED",
        429
      );
    }
    let body = null;
    try {
      body = await ctx.request.json();
    } catch {
      return jsonError("请求体格式错误。", "BAD_JSON", 400);
    }
    const { username, password } = body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      return jsonError("用户名或密码不能为空。", "BAD_REQUEST", 400);
    }
    if (username.length > 128 || password.length > 512) {
      return jsonError("输入过长。", "BAD_REQUEST", 400);
    }
    const expectedUsername = process.env.ADMIN_USERNAME?.trim();
    const expectedHash = process.env.ADMIN_PASSWORD_HASH?.trim();
    if (!expectedUsername || !expectedHash) {
      return jsonError(
        "管理员账户尚未配置，请先在部署环境设置 ADMIN_USERNAME / ADMIN_PASSWORD_HASH。",
        "ADMIN_NOT_CONFIGURED",
        500
      );
    }
    const userMatch = username === expectedUsername;
    const dummyHash = process.env._LOGIN_DUMMY_HASH || // 默认一个假 scrypt 哈希（固定 salt 固定值，只是为了消耗时间）
    "scrypt$N=16384,r=8,p=1$QUJDREVGR0hJSktMTU5PUA$5gVfVvVgVvVgVvVgVvVgVvVgVvVgVvVgVvVgVvVgVvU";
    const pwCheck = userMatch ? await verifyPassword(password, expectedHash) : await (async () => {
      await verifyPassword(password, dummyHash);
      return false;
    })();
    if (!userMatch || !pwCheck) {
      return jsonError("用户名或密码错误。", "INVALID_CREDENTIALS", 401);
    }
    const session = {
      sub: expectedUsername,
      username: expectedUsername,
      jti: crypto.randomBytes(16).toString("base64url")
    };
    const token = await signJwt(session);
    const csrf = createCsrfToken(session);
    setSessionCookie(ctx, token);
    setCsrfCookie(ctx, csrf);
    return json({
      ok: true,
      username: session.username
      // 注意：不返回 JWT，只通过 HttpOnly cookie。前端不需要也不能读取 admin_session。
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "登录时发生未知错误。";
    return jsonError(`服务器错误：${msg}`, "INTERNAL", 500);
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
