/**
 * GET /api/admin/auth/me  需登录
 */
import type { APIContext } from "astro";
import { jsonOk, withApiGuard } from "../../../../lib/api-guard";

export const prerender = false;

export const GET = withApiGuard({ auth: true }, async ({ session }) => {
	return jsonOk({
		ok: true,
		username: session?.username,
		iat: session?.iat,
		exp: session?.exp,
	});
});
