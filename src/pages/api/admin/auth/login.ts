import crypto from "node:crypto";
/**
 * POST /api/admin/auth/login  公开端点（不要求 CSRF）
 * 行为：
 *  - 解析 JSON { username, password }
 *  - rateLimit 按 IP：5 次 / 15 分钟
 *  - 校验 username === ADMIN_USERNAME，verifyPassword(password, ADMIN_PASSWORD_HASH)
 *  - 成功：签发 JWT（含 jti），setSessionCookie + setCsrfCookie → 200
 *  - 失败：401 { error }
 */
import type { APIContext } from "astro";
import { jsonError, jsonOk } from "../../../../lib/api-guard";
import {
	createCsrfToken,
	extractClientIp,
	hashPassword,
	rateLimit,
	setCsrfCookie,
	setSessionCookie,
	signJwt,
	verifyPassword,
} from "../../../../lib/auth";

export const prerender = false;

type LoginBody = { username?: unknown; password?: unknown };

export async function POST(ctx: APIContext): Promise<Response> {
	try {
		// --- Rate Limit（登录单独 5 次 15 分钟）---
		const ip = extractClientIp(ctx);
		const rl = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
		if (rl.blocked) {
			return jsonError(
				`登录尝试过于频繁，请 ${Math.ceil(rl.retryAfterMs / 1000)} 秒后再试。`,
				"RATE_LIMITED",
				429,
			);
		}

		// --- 解析 body ---
		let body: LoginBody | null = null;
		try {
			body = (await ctx.request.json()) as LoginBody;
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

		// --- 环境变量校验 ---
		const expectedUsername = process.env.ADMIN_USERNAME?.trim();
		const expectedHash = process.env.ADMIN_PASSWORD_HASH?.trim();
		if (!expectedUsername || !expectedHash) {
			return jsonError(
				"管理员账户尚未配置，请先在部署环境设置 ADMIN_USERNAME / ADMIN_PASSWORD_HASH。",
				"ADMIN_NOT_CONFIGURED",
				500,
			);
		}

		// --- 验证（用户不存在也走一次 hash 验证计时，防止用户枚举时间差）---
		const userMatch = username === expectedUsername;
		// 用一个假密码跑 verifyPassword，使两种分支耗时接近
		const dummyHash =
			process.env._LOGIN_DUMMY_HASH ||
			// 默认一个假 scrypt 哈希（固定 salt 固定值，只是为了消耗时间）
			"scrypt$N=16384,r=8,p=1$QUJDREVGR0hJSktMTU5PUA$5gVfVvVgVvVgVvVgVvVgVvVgVvVgVvVgVvVgVvVgVvU";
		const pwCheck = userMatch
			? await verifyPassword(password, expectedHash)
			: await (async () => {
					// 故意忽略返回值，只做耗时
					await verifyPassword(password, dummyHash);
					return false;
				})();

		if (!userMatch || !pwCheck) {
			// 开发期，如果管理员密码环境变量为空字符串，允许自动从密码生成一个哈希并输出到日志？
			// 不允许：避免把哈希打日志。
			return jsonError("用户名或密码错误。", "INVALID_CREDENTIALS", 401);
		}

		// --- 登录成功 ---
		const session = {
			sub: expectedUsername,
			username: expectedUsername,
			jti: crypto.randomBytes(16).toString("base64url"),
		};
		const token = await signJwt(session);
		const csrf = createCsrfToken(session);
		setSessionCookie(ctx, token);
		setCsrfCookie(ctx, csrf);

		return jsonOk({
			ok: true,
			username: session.username,
			// 注意：不返回 JWT，只通过 HttpOnly cookie。前端不需要也不能读取 admin_session。
		});
	} catch (e) {
		// 不泄露堆栈
		void hashPassword; // noop, 避免 tree-shaking 时删 hashPassword；后续脚本用
		const msg = e instanceof Error ? e.message : "登录时发生未知错误。";
		return jsonError(`服务器错误：${msg}`, "INTERNAL", 500);
	}
}
