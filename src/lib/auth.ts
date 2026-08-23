import crypto from "node:crypto";
/**
 * Admin 认证库（单管理员）
 *
 * 职责边界：
 *  - 密码哈希/验证：Node 内置 crypto.scrypt（无需额外原生依赖，Vercel Serverless 可用）
 *  - JWT 签发/验证：jose（HS256）
 *  - CSRF Token（双提交 + HMAC 签名，防止 cookie 注入绕过）
 *  - 单实例内存 rateLimit（适合个人站低流量 Admin，注释说明非分布式）
 *  - Session Cookie 管理：Path=/，确保 /api/admin/* 与 /admin/* 都能携带
 *
 * 所有密码哈希/校验函数都不使用明文存储。
 */
import type { APIContext } from "astro";
import * as jose from "jose";

// ================= 常量 =================

const SESSION_COOKIE = "admin_session";
const CSRF_COOKIE = "admin_csrf";
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7d
const CSRF_MAX_AGE_S = 60 * 60 * 24; // 1d
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 32 } as const;
const SCRYPT_PREFIX = "scrypt$N=16384,r=8,p=1";
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // 对外复用（放在 lib 更合适，导出供 GitHub 层使用）
export const ADMIN_SLUG_REGEX = SLUG_REGEX;

// ================= 工具 =================

function isProd(
	ctx: { url: URL; request?: Request } | undefined | null,
): boolean {
	try {
		const host = ctx?.url?.hostname ?? "";
		if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local"))
			return false;
		return true;
	} catch {
		return process.env.NODE_ENV === "production";
	}
}

function ensureSecret(raw: string | undefined, name: string): Uint8Array {
	if (!raw || raw.length < 16) {
		throw new Error(
			`[auth] Missing or too short env var ${name}. Require >=16 chars; production >=32.`,
		);
	}
	return new TextEncoder().encode(raw);
}

function jwtSecret(): Uint8Array {
	return ensureSecret(process.env.ADMIN_JWT_SECRET, "ADMIN_JWT_SECRET");
}

function randomB64(bytes = 16): string {
	return crypto.randomBytes(bytes).toString("base64url");
}

// ================= 密码 =================
// 哈希格式: scrypt$N=16384,r=8,p=1$<b64salt>$<b64dk>

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.randomBytes(16);
	return await new Promise<string>((resolve, reject) => {
		crypto.scrypt(
			password,
			salt,
			SCRYPT_PARAMS.dkLen,
			SCRYPT_PARAMS,
			(err, derived) => {
				if (err) return reject(err);
				resolve(
					`${SCRYPT_PREFIX}$${salt.toString("base64url")}$${derived.toString(
						"base64url",
					)}`,
				);
			},
		);
	});
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	if (!password || !hash) return false;
	const parts = hash.split("$");
	if (
		parts.length !== 4 ||
		parts[0] !== "scrypt" ||
		parts[1] !== "N=16384,r=8,p=1"
	)
		return false;
	const salt = Buffer.from(parts[2], "base64url");
	const expected = Buffer.from(parts[3], "base64url");
	return await new Promise<boolean>((resolve, reject) => {
		crypto.scrypt(
			password,
			salt,
			SCRYPT_PARAMS.dkLen,
			SCRYPT_PARAMS,
			(err, actual) => {
				if (err) return reject(err);
				resolve(crypto.timingSafeEqual(expected, actual));
			},
		);
	});
}

// ================= JWT =================

export type Session = {
	sub: string;
	username: string;
	jti: string;
	iat?: number;
	exp?: number;
};

export async function signJwt(
	session: Omit<Session, "iat" | "exp">,
): Promise<string> {
	const secret = jwtSecret();
	return await new jose.SignJWT(session)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${SESSION_MAX_AGE_S}s`)
		.sign(secret);
}

export async function verifyJwt(
	token: string | undefined | null,
): Promise<Session | null> {
	if (!token) return null;
	try {
		const secret = jwtSecret();
		const { payload } = await jose.jwtVerify(token, secret, {
			algorithms: ["HS256"],
			requiredClaims: ["sub", "username", "jti"],
			maxTokenAge: `${SESSION_MAX_AGE_S}s`,
		});
		return payload as unknown as Session;
	} catch {
		return null;
	}
}

// ================= CSRF（双提交 + HMAC 签名） =================
// Token 格式：<b64rand>.<b64hmac>，hmac(key=ADMIN_JWT_SECRET, msg=`csrf:<jti>:<rand>`)

const CSRF_HMAC_MSG_PREFIX = "csrf:";

function csrfKeyData(): Buffer {
	const raw = process.env.ADMIN_JWT_SECRET;
	if (!raw || raw.length < 16) {
		throw new Error("[auth] ADMIN_JWT_SECRET missing; cannot create CSRF.");
	}
	// hmac-sha256 key 可以接受任意长度；我们直接用 secret 原始字节
	return Buffer.from(raw, "utf-8");
}

export function createCsrfToken(session: { jti: string }): string {
	const rand = randomB64(18);
	const msg = `${CSRF_HMAC_MSG_PREFIX}${session.jti}:${rand}`;
	const mac = crypto
		.createHmac("sha256", csrfKeyData())
		.update(msg)
		.digest("base64url");
	return `${rand}.${mac}`;
}

export function verifyCsrfToken(
	token: string | undefined | null,
	session: Session | null,
): boolean {
	if (!token || !session) return false;
	const [rand, mac] = token.split(".");
	if (!rand || !mac) return false;
	const expectedMsg = `${CSRF_HMAC_MSG_PREFIX}${session.jti}:${rand}`;
	const expected = crypto
		.createHmac("sha256", csrfKeyData())
		.update(expectedMsg)
		.digest("base64url");
	try {
		return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
	} catch {
		return false;
	}
}

// ================= Rate Limit（单实例内存。注释声明：非分布式生产级） =================
// 说明：仅适合低流量个人 Admin。如果未来需要水平扩展或持久化，再迁 Upstash/Redis。
const rateStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
	key: string,
	limit = 5,
	windowMs = 15 * 60 * 1000,
): { blocked: boolean; retryAfterMs: number; remaining: number } {
	const now = Date.now();
	const cur = rateStore.get(key);
	if (!cur || cur.resetAt < now) {
		rateStore.set(key, { count: 1, resetAt: now + windowMs });
		return {
			blocked: false,
			retryAfterMs: 0,
			remaining: Math.max(0, limit - 1),
		};
	}
	cur.count += 1;
	if (cur.count > limit) {
		return {
			blocked: true,
			retryAfterMs: Math.max(0, cur.resetAt - now),
			remaining: 0,
		};
	}
	return {
		blocked: false,
		retryAfterMs: 0,
		remaining: Math.max(0, limit - cur.count),
	};
}

export function extractClientIp(
	ctx: APIContext | { request: Request },
): string {
	try {
		const req =
			(ctx as APIContext).request ?? (ctx as { request: Request }).request;
		const header =
			req.headers.get("x-forwarded-for") ||
			req.headers.get("x-real-ip") ||
			"127.0.0.1";
		// x-forwarded-for 可能多值，取第一个（最接近真实客户端）
		const first = header.split(",")[0]?.trim() || "127.0.0.1";
		return first;
	} catch {
		return "127.0.0.1";
	}
}

// ================= Session / Cookies =================

export function setSessionCookie(ctx: APIContext, token: string): void {
	ctx.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: isProd(ctx),
		path: "/",
		maxAge: SESSION_MAX_AGE_S,
	});
}

export function setCsrfCookie(ctx: APIContext, token: string): void {
	ctx.cookies.set(CSRF_COOKIE, token, {
		httpOnly: false, // 前端 JS 读取后放 header，双提交模式
		sameSite: "lax",
		secure: isProd(ctx),
		path: "/",
		maxAge: CSRF_MAX_AGE_S,
	});
}

export function clearSessionCookie(ctx: APIContext): void {
	ctx.cookies.set(SESSION_COOKIE, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: isProd(ctx),
		path: "/",
		maxAge: 0,
	});
	// 一并清 CSRF
	ctx.cookies.set(CSRF_COOKIE, "", {
		httpOnly: false,
		sameSite: "lax",
		secure: isProd(ctx),
		path: "/",
		maxAge: 0,
	});
}

export function getSessionCookie(ctx: { cookies: APIContext["cookies"] }):
	| string
	| undefined {
	return ctx.cookies.get(SESSION_COOKIE)?.value;
}

export function getCsrfCookie(ctx: { cookies: APIContext["cookies"] }):
	| string
	| undefined {
	return ctx.cookies.get(CSRF_COOKIE)?.value;
}

export function getCsrfHeader(request: Request): string | null {
	return request.headers.get("X-CSRF-Token");
}

export async function getSession(ctx: APIContext): Promise<Session | null> {
	const tok = getSessionCookie(ctx);
	if (!tok) return null;
	return await verifyJwt(tok);
}

/** 未登录抛错，让 API 层用 try/catch 或统一 helper 返回 401 */
export function requireAuthSync(
	session: Session | null,
): asserts session is Session {
	if (!session) {
		const err = new Error("UNAUTHORIZED");
		(err as unknown as { code: string }).code = "UNAUTHORIZED";
		throw err;
	}
}

export async function requireAuth(ctx: APIContext): Promise<Session> {
	const s = await getSession(ctx);
	requireAuthSync(s);
	return s;
}

export async function requireCsrf(
	ctx: APIContext,
	session: Session,
): Promise<void> {
	const header = getCsrfHeader(ctx.request);
	const cookie = getCsrfCookie(ctx);
	// 双提交：header 存在且签名通过；cookie 存在且签名通过；两者字符串全等（避免某些绕过）
	if (!header || !cookie || header !== cookie) {
		const err = new Error("INVALID_CSRF");
		(err as unknown as { code: string }).code = "INVALID_CSRF";
		throw err;
	}
	if (!verifyCsrfToken(header, session) || !verifyCsrfToken(cookie, session)) {
		const err = new Error("INVALID_CSRF");
		(err as unknown as { code: string }).code = "INVALID_CSRF";
		throw err;
	}
}
