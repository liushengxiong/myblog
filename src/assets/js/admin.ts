/**
 * Admin 前端脚本（纯原生 TS，不引入 React/Vue）。
 *
 * 职责：
 *  - fetch 封装：自动带 Accept/Content-Type；错误时中文 toast
 *  - CSRF：从 document.cookie 读 admin_csrf，写请求头 X-CSRF-Token
 *  - 登录页表单提交
 *  - 所有 Admin 页面退出登录按钮
 *  - 提供全局 `window.AdminApi` 供后续 Phase 页面直接调用
 */
type AdminApi = {
	fetch: <T = unknown>(
		input: RequestInfo,
		init?: RequestInit & { expectCsrf?: boolean },
	) => Promise<T>;
	logout: () => Promise<void>;
	toast: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
	readCsrfCookie: () => string | null;
};

type ApiError = { error?: { code?: string; message?: string } };

function readCookie(name: string): string | null {
	const prefix = `${name}=`;
	const parts = document.cookie
		.split(";")
		.map((s) => s.trim())
		.filter(Boolean);
	for (const p of parts) {
		if (p.startsWith(prefix)) {
			return decodeURIComponent(p.slice(prefix.length));
		}
	}
	return null;
}

function readCsrfCookie(): string | null {
	return readCookie("admin_csrf");
}

function ensureCsrf(): Promise<string | null> {
	const tok = readCsrfCookie();
	if (tok) return Promise.resolve(tok);
	// 从 /api/admin/auth/csrf 拿（未登录会返回 token=null）
	return fetch("/api/admin/auth/csrf", { credentials: "same-origin" })
		.then((r) => r.json() as Promise<{ token?: string | null }>)
		.then((j) => j.token ?? null)
		.catch(() => null);
}

function toast(
	msg: string,
	level: "info" | "success" | "error" | "warn" = "info",
): void {
	const root = document.body;
	if (!root) return;
	const el = document.createElement("div");
	const palette: Record<string, string> = {
		info: "bg-slate-800 text-white",
		success: "bg-emerald-700 text-white",
		error: "bg-red-700 text-white",
		warn: "bg-amber-600 text-white",
	};
	el.className = `fixed bottom-6 right-6 z-[1000] max-w-sm rounded-lg px-4 py-3 shadow-2xl ${palette[level]}`;
	el.setAttribute("role", "status");
	el.textContent = msg;
	root.appendChild(el);
	window.setTimeout(() => {
		el.style.transition = "opacity 300ms ease";
		el.style.opacity = "0";
		window.setTimeout(() => el.remove(), 350);
	}, 3200);
}

function classifyMethod(method?: string): string {
	const m = (method || "GET").toUpperCase();
	return ["POST", "PUT", "DELETE", "PATCH"].includes(m) ? m : "SAFE";
}

async function apiFetch<T = unknown>(
	input: RequestInfo,
	init: RequestInit & { expectCsrf?: boolean } = {},
): Promise<T> {
	const method = classifyMethod(init.method);
	const needsCsrf = init.expectCsrf !== false && method !== "SAFE";
	const headers = new Headers(init.headers || {});
	if (!(init.body instanceof FormData) && !headers.has("content-type")) {
		headers.set("content-type", "application/json");
	}
	headers.set("accept", "application/json");
	if (needsCsrf) {
		const tok = await ensureCsrf();
		if (tok) headers.set("X-CSRF-Token", tok);
	}
	const resp = await fetch(input, {
		...init,
		headers,
		credentials: "same-origin",
	});
	let body: unknown = null;
	const txt = await resp.text();
	try {
		body = txt ? (JSON.parse(txt) as unknown) : null;
	} catch {
		body = { _raw: txt };
	}
	if (!resp.ok) {
		const err = (body as ApiError | null)?.error;
		const msg = err?.message || `请求失败（HTTP ${resp.status}）`;
		toast(msg, "error");
		const e = new Error(msg) as Error & {
			status?: number;
			code?: string;
			body?: unknown;
		};
		e.status = resp.status;
		e.code = err?.code;
		e.body = body;
		throw e;
	}
	return body as T;
}

async function logout(): Promise<void> {
	try {
		await apiFetch("/api/admin/auth/logout", { method: "POST" });
		window.location.assign("/admin/login");
	} catch {
		// 失败也强制跳转，避免会话卡住
		window.location.assign("/admin/login");
	}
}

// ===== 登录页初始化 =====
function initLoginPage(): void {
	const form = document.querySelector<HTMLFormElement>(
		"form[data-admin-login]",
	);
	if (!form) return;
	const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const fd = new FormData(form);
		const username = String(fd.get("username") || "").trim();
		const password = String(fd.get("password") || "");
		if (!username || !password) {
			toast("请输入用户名和密码。", "warn");
			return;
		}
		btn?.setAttribute("disabled", "true");
		try {
			const res = await apiFetch<{ ok: boolean; username: string }>(
				"/api/admin/auth/login",
				{
					method: "POST",
					body: JSON.stringify({ username, password }),
					expectCsrf: false, // 登录不需要 CSRF
				},
			);
			if (res.ok) {
				toast("登录成功，正在进入后台…", "success");
				const params = new URLSearchParams(window.location.search);
				const redirect = params.get("redirect") || "/admin/";
				// 基本 redirect 校验：仅允许站内相对路径（避免开放重定向）
				const safeRedirect =
					redirect?.startsWith("/") && !redirect.startsWith("//")
						? redirect
						: "/admin/";
				window.setTimeout(() => window.location.assign(safeRedirect), 350);
			}
		} catch {
			// toast 已在 apiFetch 中弹出
		} finally {
			btn?.removeAttribute("disabled");
		}
	});
}

function initLogoutButtons(): void {
	const nodes = document.querySelectorAll<
		HTMLButtonElement | HTMLAnchorElement
	>("[data-admin-logout]");
	for (const el of nodes) {
		el.addEventListener("click", async (ev) => {
			ev.preventDefault();
			await logout();
		});
	}
}

// ===== 挂载全局 =====
const AdminApi: AdminApi = {
	fetch: apiFetch,
	logout,
	toast,
	readCsrfCookie,
};
declare global {
	interface Window {
		AdminApi: AdminApi;
	}
}
if (typeof window !== "undefined") {
	window.AdminApi = AdminApi;
}

if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			initLoginPage();
			initLogoutButtons();
		});
	} else {
		initLoginPage();
		initLogoutButtons();
	}
}

export type { AdminApi as default };
