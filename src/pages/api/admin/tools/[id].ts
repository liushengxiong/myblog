/**
 * 单个工具 API
 *
 * - GET    /api/admin/tools/[id]  需登录。返回 { id, path, sha, data }。
 * - PUT    /api/admin/tools/[id]  需登录 + CSRF。更新（含 id 变更 → 跨文件 move）。
 * - DELETE /api/admin/tools/[id]  需登录 + CSRF。删除。
 *
 * PUT 支持的变更：
 *  1. 仅内容变更（id 不变）：createOrUpdateFile(existingSha)
 *  2. id 变更：commitMultipleFiles deletePaths=[oldPath] + entries=[newPath]
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
	deleteFile,
} from "../../../../lib/github";
import { findDataItem, dataItemIdExists } from "../../../../lib/data-items";
import { TOOL_SCHEMA, type Tool } from "../../../../lib/schemas";

export const prerender = false;

function githubErrorResponse(e: unknown): Response {
	if (e instanceof GitHubError) {
		return jsonError(e.message, e.kind, e.status);
	}
	const msg = e instanceof Error ? e.message : String(e);
	return jsonError(`服务器错误：${msg}`, "github_other", 500);
}

// ============== GET ==============
async function readOne({ id }: { id: string }): Promise<Response> {
	const found = await findDataItem<Tool>(PREFIX_TOOLS, id, {
		schema: TOOL_SCHEMA,
	});
	if (!found) {
		return jsonError("工具不存在。", "github_not_found", 404);
	}
	return jsonOk({
		ok: true,
		id: found.id,
		path: found.path,
		sha: found.sha,
		data: found.data,
	});
}

// ============== PUT ==============
async function update({
	oldId,
	body,
}: {
	oldId: string;
	body: { data: Tool; existingSha?: string };
}): Promise<Response> {
	if (!body || !body.data) {
		return jsonError("缺少 data 字段。", "schema_error", 422);
	}
	const parsed = TOOL_SCHEMA.safeParse(body.data);
	if (!parsed.success) {
		return jsonError(
			`数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
			"schema_error",
			422,
		);
	}
	const tool = parsed.data;
	const existingSha = body.existingSha;
	if (!existingSha) {
		return jsonError(
			"更新必须提供 existingSha。",
			"github_conflict",
			400,
		);
	}

	const found = await findDataItem<Tool>(PREFIX_TOOLS, oldId);
	if (!found) {
		return jsonError(
			"原工具不存在，无法更新。",
			"github_not_found",
			404,
		);
	}
	if (existingSha !== found.sha) {
		return jsonError(
			"existingSha 已过期，请刷新后重试。",
			"github_conflict",
			409,
		);
	}

	const newId = tool.id;
	const idChanged = newId !== oldId;
	if (idChanged) {
		const occ = await dataItemIdExists(PREFIX_TOOLS, newId);
		if (occ) {
			return jsonError(
				`新 id "${newId}" 已被占用。`,
				"github_conflict",
				409,
			);
		}
	}

	const oldPath = found.path;
	const newPath = `${PREFIX_TOOLS}${newId}.json`;
	const content = `${JSON.stringify(tool, null, 2)}\n`;

	try {
		if (!idChanged) {
			const res = await createOrUpdateFile({
				path: newPath,
				content,
				message: COMMIT_MESSAGES.updateTools,
				existingSha,
			});
			return jsonOk({
				ok: true,
				id: newId,
				path: res.path,
				sha: res.sha,
				commitSha: res.commitSha,
				moved: false,
			});
		}
		// id 变更 → 原子 move（delete + create 单 commit）
		const res = await commitMultipleFiles(
			[{ path: newPath, content }],
			COMMIT_MESSAGES.updateTools,
			{ deletePaths: [oldPath] },
		);
		return jsonOk({
			ok: true,
			id: newId,
			path: newPath,
			sha: res.files[0]?.sha ?? "",
			commitSha: res.commitSha,
			moved: true,
		});
	} catch (e) {
		return githubErrorResponse(e);
	}
}

// ============== DELETE ==============
async function remove({
	id,
	existingSha,
}: {
	id: string;
	existingSha?: string;
}): Promise<Response> {
	const found = await findDataItem<Tool>(PREFIX_TOOLS, id);
	if (!found) {
		return jsonError("工具不存在。", "github_not_found", 404);
	}
	if (!existingSha) {
		return jsonError("删除必须提供 existingSha。", "github_conflict", 400);
	}
	if (existingSha !== found.sha) {
		return jsonError(
			"existingSha 已过期，请刷新后重试。",
			"github_conflict",
			409,
		);
	}
	try {
		const res = await deleteFile(
			found.path,
			COMMIT_MESSAGES.updateTools,
			existingSha,
		);
		return jsonOk({
			ok: true,
			id,
			commitSha: res.commitSha,
		});
	} catch (e) {
		return githubErrorResponse(e);
	}
}

// ============== 路由 ==============
export const GET = withApiGuard({ auth: true, csrf: false }, async ({ ctx }) => {
	const id = ctx.params.id;
	if (!id) return jsonError("缺少 id。", "BAD_REQUEST", 400);
	return await readOne({ id });
});

export const PUT = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		const oldId = ctx.params.id;
		if (!oldId) return jsonError("缺少 id。", "BAD_REQUEST", 400);
		let body: unknown = null;
		try {
			body = await ctx.request.json();
		} catch {
			return jsonError("请求体格式错误。", "BAD_JSON", 400);
		}
		return await update({
			oldId,
			body: body as { data: Tool; existingSha?: string },
		});
	},
);

export const DELETE = withApiGuard(
	{ auth: true, csrf: true },
	async ({ ctx }) => {
		const id = ctx.params.id;
		if (!id) return jsonError("缺少 id。", "BAD_REQUEST", 400);
		const existingSha = ctx.url.searchParams.get("sha") || undefined;
		return await remove({ id, existingSha });
	},
);
