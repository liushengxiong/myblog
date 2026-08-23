/**
 * POST /api/admin/auth/logout  需登录 + CSRF
 */
import type { APIContext } from "astro";
import { withApiGuard } from "../../../../lib/api-guard";
import { clearSessionCookie } from "../../../../lib/auth";

export const prerender = false;

export const POST = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		clearSessionCookie(ctx);
		return new Response(null, { status: 204 });
	},
);
