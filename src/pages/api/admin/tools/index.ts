/**
 * 工具列表 / 创建 / 重排 API
 *
 * - GET    /api/admin/tools        需登录。返回 [{ id, path, sha, data }]。
 * - POST   /api/admin/tools        需登录 + CSRF。创建工具。
 * - PUT    /api/admin/tools        需登录 + CSRF。批量重排（原子 commit）。
 *
 * 设计依据：Spec v2 FR-5 / AC-5。
 */
import { jsonError, jsonOk, withApiGuard } from "../../../../lib/api-guard";
import {
	COMMIT_MESSAGES,
	GitHubError,
	PREFIX_TOOLS,
	commitMultipleFiles,
	createOrUpdateFile,
} from "../../../../lib/github";
import {
	dataItemIdExists,
	findDataItem,
	listDataItems,
} from "../../../../lib/data-items";
import { TOOL_SCHEMA, type Tool } from "../../../../lib/schemas";

export const prerender = false;

function githubErrorResponse(e: unknown): Response {
	if (e instanceof GitHubError) {
		return jsonError(e.message, e.kind, e.status);
	}
	const msg = e instanceof Error ? e.message : String(e);
	return jsonError(`服务器错误：${msg}`, "github_other", 500);
}

// ============== GET list ==============
async function list(): Promise<Response> {
	const items = await listDataItems<Tool>(PREFIX_TOOLS, {
		schema: TOOL_SCHEMA,
	});
	// 按 order 升序排序
	items.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
	return jsonOk({
		ok: true,
		items: items.map((i) => ({
			id: i.id,
			path: i.path,
			sha: i.sha,
			data: i.data,
		})),
	});
}

// ============== POST create ==============
async function create({ body }: { body: unknown }): Promise<Response> {
	// body 即 tool 数据；id 必须存在
	const parsed = TOOL_SCHEMA.safeParse(body);
	if (!parsed.success) {
		return jsonError(
			`数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
			"schema_error",
			422,
		);
	}
	const tool = parsed.data;
	if (!tool.id) {
		return jsonError("缺少 id 字段。", "schema_error", 422);
	}
	const exists = await dataItemIdExists(PREFIX_TOOLS, tool.id);
	if (exists) {
		return jsonError(
			`id "${tool.id}" 已被占用。请换一个。`,
			"github_conflict",
			409,
		);
	}
	const path = `${PREFIX_TOOLS}${tool.id}.json`;
	const content = `${JSON.stringify(tool, null, 2)}\n`;
	try {
		const res = await createOrUpdateFile({
			path,
			content,
			message: COMMIT_MESSAGES.updateTools,
		});
		return jsonOk({
			ok: true,
			id: tool.id,
			path: res.path,
			sha: res.sha,
			commitSha: res.commitSha,
		});
	} catch (e) {
		return githubErrorResponse(e);
	}
}

// ============== PUT reorder ==============
type ReorderInput = {
	items: { id: string; order: number }[];
};

async function reorder({ body }: { body: ReorderInput }): Promise<Response> {
	if (!body || !Array.isArray(body.items) || body.items.length === 0) {
		return jsonError("items 必须是非空数组。", "schema_error", 422);
	}
	// 校验每个 id + 收集当前 sha + content
	const entries: { path: string; content: string }[] = [];
	for (const it of body.items) {
		if (!it || typeof it.id !== "string" || typeof it.order !== "number") {
			return jsonError(
				`items 项格式错误（需要 { id, order }）：${JSON.stringify(it)}`,
				"schema_error",
				422,
			);
		}
		const found = await findDataItem<Tool>(PREFIX_TOOLS, it.id, {
			schema: TOOL_SCHEMA,
		});
		if (!found) {
			return jsonError(
				`id "${it.id}" 不存在，无法重排。`,
				"github_not_found",
				404,
			);
		}
		// 仅修改 order 字段，其余字段保持原样
		const updated: Tool = { ...found.data, order: Math.max(0, Math.floor(it.order)) };
		const content = `${JSON.stringify(updated, null, 2)}\n`;
		entries.push({ path: found.path, content });
	}
	try {
		const res = await commitMultipleFiles(
			entries.map((e) => ({ path: e.path, content: e.content })),
			COMMIT_MESSAGES.updateTools,
		);
		return jsonOk({
			ok: true,
			commitSha: res.commitSha,
			updated: entries.length,
		});
	} catch (e) {
		return githubErrorResponse(e);
	}
}

// ============== 路由 ==============
export const GET = withApiGuard({ auth: true, csrf: false }, async () => {
	return await list();
});

export const POST = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		let body: unknown = null;
		try {
			body = await ctx.request.json();
		} catch {
			return jsonError("请求体格式错误。", "BAD_JSON", 400);
		}
		return await create({ body });
	},
);

export const PUT = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		let body: unknown = null;
		try {
			body = await ctx.request.json();
		} catch {
			return jsonError("请求体格式错误。", "BAD_JSON", 400);
		}
		return await reorder({ body: body as ReorderInput });
	},
);
