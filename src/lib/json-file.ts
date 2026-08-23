/**
 * JSON 文件读写 helpers（与 GitHub createFile/updateFile 封装结合）
 *
 * 设计依据：Spec v2 Task 2.2、AC-5。
 *
 * 关键点：
 *  - 规范化 JSON 写入：2-space 缩进 + 末尾换行 + 键顺序稳定（不强制 sort，保留 schema 自然顺序）。
 *  - 读取优先用 GitHub 实际文件（getFileInfo），而不是本地文件系统；仅在 mock 模式下从内存读。
 *  - 用于 tools / projects / resources / site-settings 的 Admin 端读写。
 */
import {
	GitHubError,
	type FileContentResult,
	getFileInfo,
	createOrUpdateFile,
	PREFIX_TOOLS,
	PREFIX_PROJECTS,
	PREFIX_RESOURCES,
	PREFIX_SETTINGS,
} from "./github";

const JSON_INDENT = "  "; // 2-space

/** 规范化 JSON 字符串（2-space + 末尾换行） */
export function serializeJson(value: unknown): string {
	return JSON.stringify(value, null, JSON_INDENT) + "\n";
}

/** 安全 parse JSON，失败抛 GitHubError schema_error */
export function parseJsonStrict<T>(text: string, schemaParse: (raw: unknown) => T): T {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch (e) {
		throw new GitHubError(
			"schema_error",
			`JSON 解析失败：${e instanceof Error ? e.message : String(e)}`,
			422,
		);
	}
	try {
		return schemaParse(raw);
	} catch (e) {
		throw new GitHubError(
			"schema_error",
			`数据结构校验失败：${e instanceof Error ? e.message : String(e)}`,
			422,
		);
	}
}

/**
 * 从 GitHub 读取单个 JSON 文件并 parse。
 * - 文件不存在 → 返回 null（不抛错）
 * - 文件存在但 parse / schema 失败 → 抛 GitHubError schema_error
 */
export async function readJsonFile<T>(
	repoPath: string,
	schemaParse: (raw: unknown) => T,
): Promise<{ data: T; sha: string } | null> {
	const info: FileContentResult | null = await getFileInfo(repoPath);
	if (!info) return null;
	const data = parseJsonStrict(info.content, schemaParse);
	return { data, sha: info.sha };
}

/**
 * 写入单个 JSON 文件（创建或更新）。
 * - existingSha 提供 → 更新；缺失 → 创建（重复创建时 GitHub 返回 422 → github_conflict）
 * - 内容规范化：2-space + 末尾换行
 */
export async function writeJsonFile<T>(args: {
	repoPath: string;
	data: T;
	existingSha?: string;
	message: string;
}): Promise<{ sha: string; path: string; commitSha: string }> {
	const content = serializeJson(args.data);
	return await createOrUpdateFile({
		path: args.repoPath,
		content,
		message: args.message,
		existingSha: args.existingSha,
	});
}

// ================= 集合目录多文件 helpers =================

/**
 * 列出某集合目录下的所有 JSON 文件。
 * 返回 { id, path, name } 列表（不含内容，内容需另读 readJsonFile）。
 */
export async function listCollectionIds(
	collectionPrefix: string,
): Promise<{ id: string; path: string; name: string; sha: string }[]> {
	// 不直接调 validateRepoPath（listFilesInFolder 内部会校验）
	const { listFilesInFolder } = await import("./github");
	const files = await listFilesInFolder(collectionPrefix);
	return files.map((f) => {
		const name = f.name.replace(/\.json$/i, "");
		return { id: name, path: f.path, name, sha: f.sha };
	});
}

/**
 * 读取集合目录下所有 JSON 文件并 parse 为数组。
 */
export async function readCollectionArray<T>(
	collectionPrefix: string,
	schemaParse: (raw: unknown) => T,
): Promise<{ data: T; id: string; sha: string; path: string }[]> {
	const items = await listCollectionIds(collectionPrefix);
	const out: { data: T; id: string; sha: string; path: string }[] = [];
	for (const item of items) {
		const read = await readJsonFile(item.path, schemaParse);
		if (!read) continue;
		out.push({ data: read.data, id: item.id, sha: read.sha, path: item.path });
	}
	return out;
}

/**
 * 工具集合 prefix。
 */
export const COLLECTION_PREFIXES = {
	tools: PREFIX_TOOLS,
	projects: PREFIX_PROJECTS,
	resources: PREFIX_RESOURCES,
	settings: PREFIX_SETTINGS,
} as const;

/**
 * 单条 JSON 文件路径构造：prefix + id + ".json"
 * 调用方需保证 id 已经过 validateSlug。
 */
export function collectionFilePath(prefix: string, id: string): string {
	return `${prefix}${id}.json`;
}
