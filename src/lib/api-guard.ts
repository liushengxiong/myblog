/**
 * Admin API 端点的显式 guard helper（不使用 Next.js 风格 _middleware）。
 *
 * 用法：
 *   export const prerender = false;
 *   export const POST = withApiGuard({ auth: true, csrf: true }, async ({ ctx, session }) => {
 *     return new Response(JSON.stringify({ ok: true, user: session.username }));
 *   });
 */
import type { APIContext } from "astro";
import {
	type Session,
	extractClientIp,
	rateLimit,
	requireAuth,
	requireCsrf,
} from "./auth";

export type GuardOptions = {
	/** 必须登录，默认 true */
	auth?: boolean;
	/** 写操作（POST/PUT/DELETE/PATCH）应当开启 */
	csrf?: boolean;
	/** 针对该 endpoint 做登录 rate limit（例如 login） */
	loginRateLimit?: { limit: number; windowMs: number };
};

export type GuardedHandler = (args: {
	ctx: APIContext;
	session: Session | null;
}) => Promise<Response> | Response;

function json(
	body: unknown,
	status = 200,
	headers?: Record<string, string>,
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			...(headers ?? {}),
		},
	});
}

export function jsonError(
	message: string,
	code: string,
	status = 400,
): Response {
	return json({ error: { message, code } }, status);
}

export { json as jsonOk };

export function withApiGuard(opts: GuardOptions, handler: GuardedHandler) {
	return async (ctx: APIContext): Promise<Response> => {
		try {
			// 1) 登录 rate limit（只针对特定端点，如 login）
			if (opts.loginRateLimit) {
				const ip = extractClientIp(ctx);
				const rl = rateLimit(
					`login:${ip}`,
					opts.loginRateLimit.limit,
					opts.loginRateLimit.windowMs,
				);
				if (rl.blocked) {
					return jsonError(
						`登录尝试过于频繁，请 ${Math.ceil(
							rl.retryAfterMs / 1000,
						)} 秒后再试。`,
						"RATE_LIMITED",
						429,
					);
				}
			}

			// 2) 认证
			let session: Session | null = null;
			if (opts.auth !== false) {
				try {
					session = await requireAuth(ctx);
				} catch (e) {
					const code = (e as { code?: string }).code;
					if (code === "UNAUTHORIZED") {
						return jsonError(
							"未登录或登录已过期，请重新登录。",
							"UNAUTHORIZED",
							401,
						);
					}
					return jsonError("服务异常。", "AUTH_ERROR", 500);
				}
			}

			// 3) CSRF（仅在登录后且开启 csrf 时验证）
			if (opts.csrf && session) {
				try {
					await requireCsrf(ctx, session);
				} catch (e) {
					const code = (e as { code?: string }).code;
					if (code === "INVALID_CSRF") {
						return jsonError(
							"会话已过期或非法请求，请刷新页面重试。",
							"INVALID_CSRF",
							403,
						);
					}
					return jsonError("服务异常。", "CSRF_ERROR", 500);
				}
			}

			return await handler({ ctx, session });
		} catch (e) {
			// 兜底：不抛出堆栈到客户端
			const msg = e instanceof Error ? e.message : "未知错误";
			return jsonError(`服务器错误：${msg}`, "INTERNAL", 500);
		}
	};
}
