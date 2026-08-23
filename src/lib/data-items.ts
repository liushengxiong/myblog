/**
 * Data Collection 通用 helpers（tools / projects / resources 共用）
 *
 * 设计依据：Spec v2 FR-5 / FR-6 / FR-8。
 *
 * 关键点：
 *  - 每个 data collection（tools / projects / resources）目录 = collection 名，
 *    每个文件 = 1 条 entry，文件名（去掉 .json）= id。
 *  - id 用与 slug 相同的正则校验（^[a-z0-9]+(?:-[a-z0-9]+)*$，2–120），
 *    确保文件名合法、ASCII、无路径穿越风险。
 *  - 与 src/content/config.js 中各 collection schema 严格对齐；
 *    schemas.ts 中的 Zod schema 用于 API 入参/出参校验。
 *  - 列表 / 查找通过 GitHub API（listFilesInFolder + getFileInfo），
 *    JSON.parse 失败时跳过该条并继续（不阻塞整个列表）。
 */
import {
	type AllowedPrefix,
	GitHubError,
	PREFIX_PROJECTS,
	PREFIX_RESOURCES,
	PREFIX_TOOLS,
	validateSlug,
	getFileInfo,
	listFilesInFolder,
} from "./github";

export type DataPrefix =
	| (typeof PREFIX_TOOLS)
	| (typeof PREFIX_PROJECTS)
	| (typeof PREFIX_RESOURCES);

export type DataItem<TData> = {
	id: string;
	path: string;
	sha: string;
	data: TData;
};

/**
 * 列出某个 data collection 目录下所有 entry。
 * 每条 entry：解析 JSON 并尝试 zod 校验（如提供 schema）。
 * JSON 解析失败 / zod 校验失败的 entry 被跳过（不抛错）。
 */
export async function listDataItems<TData>(
	prefix: DataPrefix,
	opts: { schema?: { safeParse: (x: unknown) => { success: boolean; data?: TData } } } = {},
): Promise<DataItem<TData>[]> {
	const files = await listFilesInFolder(prefix, { recursive: false });
	const out: DataItem<TData>[] = [];
	for (const f of files) {
		if (!f.path.endsWith(".json")) continue;
		const id = f.name.replace(/\.json$/, "");
		try {
			validateSlug(id);
		} catch {
			continue;
		}
		const info = await getFileInfo(f.path);
		if (!info) continue;
		let data: unknown;
		try {
			data = JSON.parse(info.content);
		} catch {
			continue;
		}
		if (opts.schema) {
			const r = opts.schema.safeParse(data);
			if (!r.success) continue;
			data = r.data;
		}
		out.push({ id, path: f.path, sha: f.sha, data: data as TData });
	}
	return out;
}

/**
 * 通过 id 查找某个 data collection 下单条 entry。
 * 返回 { id, path, sha, data } 或 null。
 */
export async function findDataItem<TData>(
	prefix: DataPrefix,
	id: string,
	opts: { schema?: { safeParse: (x: unknown) => { success: boolean; data?: TData } } } = {},
): Promise<DataItem<TData> | null> {
	const safeId = validateSlug(id);
	const path = `${prefix}${safeId}.json`;
	const info = await getFileInfo(path);
	if (!info) return null;
	let data: unknown;
	try {
		data = JSON.parse(info.content);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new GitHubError(
			"schema_error",
			`JSON 解析失败（${path}）：${msg}`,
			422,
		);
	}
	if (opts.schema) {
		const r = opts.schema.safeParse(data);
		if (!r.success) {
			throw new GitHubError(
				"schema_error",
				`数据校验失败（${path}）`,
				422,
			);
		}
		data = r.data;
	}
	return { id: safeId, path, sha: info.sha, data: data as TData };
}

/**
 * 检查 data collection 下某 id 是否已存在。
 */
export async function dataItemIdExists(
	prefix: DataPrefix,
	id: string,
): Promise<boolean> {
	try {
		const found = await findDataItem(prefix, id);
		return found !== null;
	} catch {
		// validateSlug 抛错也视为不存在
		return false;
	}
}

/**
 * 列出 data collection 目录下所有 entry 的 id + sha（轻量版，不读文件内容）。
 * 用于 reorder 时按 id 查找 sha。
 */
export async function listDataItemIds(
	prefix: DataPrefix,
): Promise<{ id: string; path: string; sha: string }[]> {
	const files = await listFilesInFolder(prefix, { recursive: false });
	const out: { id: string; path: string; sha: string }[] = [];
	for (const f of files) {
		if (!f.path.endsWith(".json")) continue;
		const id = f.name.replace(/\.json$/, "");
		try {
			validateSlug(id);
		} catch {
			continue;
		}
		out.push({ id, path: f.path, sha: f.sha });
	}
	return out;
}

// 防止未使用 import 警告
void (null as unknown as AllowedPrefix);
