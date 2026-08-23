/**
 * GET /api/admin/auth/csrf  公开端点（按 Spec 白名单）
 *
 * - 若未登录：返回 { ok:true, token:null, requiresLogin:true }
 *   （因为 CSRF Token 必须绑定 session.jti，未登录无法签发有效签名 token）
 * - 若已登录且当前 cookie 中 CSRF token 仍然可用：直接返回已存在 token（避免刷新浪费）
 * - 若已登录但缺 CSRF cookie：签发新的并 Set-Cookie 返回
 */
import type { APIContext } from "astro";
import { jsonOk } from "../../../../lib/api-guard";
import {
	createCsrfToken,
	getCsrfCookie,
	getSession,
	setCsrfCookie,
	verifyCsrfToken,
} from "../../../../lib/auth";

export const prerender = false;

export async function GET(ctx: APIContext): Promise<Response> {
	const session = await getSession(ctx);
	if (!session) {
		return jsonOk({
			ok: true,
			token: null,
			requiresLogin: true,
		});
	}
	const existing = getCsrfCookie(ctx);
	if (existing && verifyCsrfToken(existing, session)) {
		return jsonOk({ ok: true, token: existing, requiresLogin: false });
	}
	const token = createCsrfToken(session);
	setCsrfCookie(ctx, token);
	return jsonOk({ ok: true, token, requiresLogin: false });
}
