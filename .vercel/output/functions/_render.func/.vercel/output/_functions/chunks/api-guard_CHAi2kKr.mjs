import { e as extractClientIp, r as rateLimit, a as requireAuth, b as requireCsrf } from './auth_T38O31Gl.mjs';

function json(body, status = 200, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...{}
    }
  });
}
function jsonError(message, code, status = 400) {
  return json({ error: { message, code } }, status);
}
function withApiGuard(opts, handler) {
  return async (ctx) => {
    try {
      if (opts.loginRateLimit) {
        const ip = extractClientIp(ctx);
        const rl = rateLimit(
          `login:${ip}`,
          opts.loginRateLimit.limit,
          opts.loginRateLimit.windowMs
        );
        if (rl.blocked) {
          return jsonError(
            `登录尝试过于频繁，请 ${Math.ceil(
              rl.retryAfterMs / 1e3
            )} 秒后再试。`,
            "RATE_LIMITED",
            429
          );
        }
      }
      let session = null;
      if (opts.auth !== false) {
        try {
          session = await requireAuth(ctx);
        } catch (e) {
          const code = e.code;
          if (code === "UNAUTHORIZED") {
            return jsonError(
              "未登录或登录已过期，请重新登录。",
              "UNAUTHORIZED",
              401
            );
          }
          return jsonError("服务异常。", "AUTH_ERROR", 500);
        }
      }
      if (opts.csrf && session) {
        try {
          await requireCsrf(ctx, session);
        } catch (e) {
          const code = e.code;
          if (code === "INVALID_CSRF") {
            return jsonError(
              "会话已过期或非法请求，请刷新页面重试。",
              "INVALID_CSRF",
              403
            );
          }
          return jsonError("服务异常。", "CSRF_ERROR", 500);
        }
      }
      return await handler({ ctx, session });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      return jsonError(`服务器错误：${msg}`, "INTERNAL", 500);
    }
  };
}

export { jsonError as a, json as j, withApiGuard as w };
