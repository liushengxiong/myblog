/**
 * Slug 冲突检测 API
 *
 * - POST /api/admin/posts/[slug]/check  需登录。
 *   Body: { excludeCurrent?: boolean }（默认 false，即检查时把当前 slug 也算占用）
 *   返回：{ exists, status, slug }
 *
 * 设计依据：Spec v2 AC-4 / FR-4（slug 重复检测走 file list）。
 */
import { jsonOk, withApiGuard } from "../../../../../lib/api-guard";
import { slugExists } from "../../../../../lib/posts";

export const prerender = false;

export const POST = withApiGuard(
	{ auth: true, csrf: false }, // GET-style 检查，无需 CSRF
	async ({ ctx }) => {
		const slug = ctx.params.slug;
		if (!slug) {
			return jsonOk({ ok: true, slug: "", exists: false, status: null });
		}
		const r = await slugExists(slug);
		return jsonOk({
			ok: true,
			slug,
			exists: r.exists,
			status: r.status ?? null,
		});
	},
);
