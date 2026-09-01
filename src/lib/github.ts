/**
 * GitHub API 服务端封装（Admin 写入仓库的唯一入口）
 *
 * 设计依据：Spec v2 FR-3 / AC-3 / NFR-1。
 *
 * 安全要点：
 *  - 7 个固定路径前缀常量（PREFIX_*），禁止任何代码绕过。
 *  - validateRepoPath：URL decode → normalize → 检测 `..` / `\` / 非 ASCII / 控制字符 → 前缀白名单匹配。
 *  - validateSlug：正则 ^[a-z0-9]+(?:-[a-z0-9]+)*$，长度 2–120。
 *  - commit message 固定前缀模板（不允许用户输入拼前缀）。
 *  - 更新/删除必须带 existingSha；过期 SHA → 409 github_conflict。
 *  - 仅在本文件构造 Octokit 实例（全局 grep 不应出现 `new Octokit` 于其他文件）。
 *  - 错误 kind 固定为 14 种（见 GitHubErrorKind）。
 *
 * 核心能力：
 *  - commitMultipleFiles：Git Database API（createBlob → createTree → createCommit → updateRef）原子提交。
 *
 * Mock 模式：
 *  - 当 process.env.ADMIN_GITHUB_MOCK === "1" 时，所有写操作落到进程内 in-memory store，
 *    读操作从 in-memory store 或本地文件系统（仅 mock 初始化）取数据；不触发任何真实 GitHub 请求。
 *  - 适合 Phase 9 烟雾测试，不写真实仓库。
 */
import { Octokit } from "@octokit/rest";
import type {
	RestEndpointMethodTypes,
} from "@octokit/rest";
import { existsSync, readFileSync } from "node:fs";
import { resolve as pathResolve, relative as pathRelative, sep as pathSep } from "node:path";
import { ADMIN_SLUG_REGEX } from "./auth";

// ================= 路径前缀白名单（集中常量，禁止复制到其他文件） =================

export const PREFIX_POST = "src/content/post/";
export const PREFIX_DRAFT = "src/content/post/drafts/";
export const PREFIX_TOOLS = "src/content/tools/";
export const PREFIX_PROJECTS = "src/content/projects/";
export const PREFIX_RESOURCES = "src/content/resources/";
export const PREFIX_SETTINGS = "src/content/data/"; // 仅 site-settings.json
export const PREFIX_IMAGE = "public/assets/images/uploads/";

export const ALL_PREFIXES = [
	PREFIX_POST,
	PREFIX_DRAFT,
	PREFIX_TOOLS,
	PREFIX_PROJECTS,
	PREFIX_RESOURCES,
	PREFIX_SETTINGS,
	PREFIX_IMAGE,
] as const;

export type AllowedPrefix = (typeof ALL_PREFIXES)[number];

// ================= 错误分类（固定 14 种 kind） =================

export const GITHUB_ERROR_KINDS = [
	"github_auth",
	"github_rate_limit",
	"github_not_found",
	"github_conflict",
	"github_other",
	"invalid_path",
	"invalid_slug",
	"invalid_mime",
	"file_too_large",
	"schema_error",
	"unauthorized",
	"csrf_mismatch",
	"missing_csrf",
	"csrf_expired",
	"too_many_attempts",
] as const;
export type GitHubErrorKind = (typeof GITHUB_ERROR_KINDS)[number];

export class GitHubError extends Error {
	readonly kind: GitHubErrorKind;
	readonly status: number;
	readonly extra?: Record<string, unknown>;
	constructor(
		kind: GitHubErrorKind,
		message: string,
		status = 400,
		extra?: Record<string, unknown>,
	) {
		super(message);
		this.name = "GitHubError";
		this.kind = kind;
		this.status = status;
		this.extra = extra;
	}
}

// ================= 路径 / Slug 校验 =================

/**
 * 校验仓库相对路径。返回规范化后的路径（正斜杠）。
 * 规则：
 *  1. 非字符串 / 空 → invalid_path
 *  2. URL decode 一次（防御 %2e%2e 等编码绕过）
 *  3. normalize 后检测 `..` / `..\` / 反斜杠 / 非 ASCII / 控制字符 → invalid_path
 *  4. 必须以 allowedPrefixes 中任一前缀开头
 *  5. 不允许连续三个斜杠、不允许空段
 */
export function validateRepoPath(
	rawPath: string,
	allowedPrefixes: readonly string[] = ALL_PREFIXES,
): string {
	if (typeof rawPath !== "string" || rawPath.length === 0) {
		throw new GitHubError("invalid_path", "路径不能为空。", 400);
	}
	// URL decode 一次（避免 %2e%2e%2f 绕过）
	let decoded: string;
	try {
		decoded = decodeURIComponent(rawPath);
	} catch {
		// 已经是普通字符串，继续
		decoded = rawPath;
	}

	// 反斜杠一律拒绝（GitHub 仓库内路径只接受正斜杠）
	if (decoded.includes("\\")) {
		throw new GitHubError(
			"invalid_path",
			"路径不允许包含反斜杠。",
			400,
		);
	}

	// 控制字符
	if (/[\x00-\x1f\x7f]/.test(decoded)) {
		throw new GitHubError("invalid_path", "路径包含非法控制字符。", 400);
	}

	// 非 ASCII（路径只允许 ASCII；中文文件名另用英文 slug）
	// eslint-disable-next-line no-control-regex
	if (/[^\x00-\x7f]/.test(decoded)) {
		throw new GitHubError(
			"invalid_path",
			"路径包含非 ASCII 字符，请使用英文 slug。",
			400,
		);
	}

	// 检测 `..` 段（路径穿越）。先按 / 切分
	const segments = decoded.split("/");
	if (segments.some((s) => s === "..")) {
		throw new GitHubError(
			"invalid_path",
			"路径不允许包含 `..` 段。",
			400,
		);
	}

	// 去除多余的连续斜杠与首尾斜杠
	const cleaned = segments.filter((s) => s.length > 0).join("/");

	// 前缀白名单匹配（精确前缀字符串）
	// 注意：cleaned 已去掉首尾斜杠，需同时允许「目录前缀本身」
	// （如 cleaned="src/content/post" 应能匹配前缀 "src/content/post/"）。
	const matched = allowedPrefixes.find(
		(p) => cleaned.startsWith(p) || `${cleaned}/`.startsWith(p),
	);
	if (!matched) {
		throw new GitHubError(
			"invalid_path",
			`路径不在允许的前缀白名单内：${allowedPrefixes.join(", ")}`,
			400,
		);
	}

	// 再次防御：规范化后的路径再过一次 `..` 检测
	if (cleaned.includes("..")) {
		throw new GitHubError("invalid_path", "路径非法。", 400);
	}

	return cleaned;
}

/**
 * Slug 校验：^[a-z0-9]+(?:-[a-z0-9]+)*$，长度 2–120。
 * 现有 6 篇文章 slug 全部符合此正则（见 Spec 0.4）。
 */
export function validateSlug(slug: string): string {
	if (typeof slug !== "string" || slug.length < 2 || slug.length > 120) {
		throw new GitHubError(
			"invalid_slug",
			"slug 长度必须在 2–120 之间。",
			400,
		);
	}
	if (!ADMIN_SLUG_REGEX.test(slug)) {
		throw new GitHubError(
			"invalid_slug",
			"slug 只能包含小写字母、数字，并以连字符分隔段（不允许大写/中文/`.`/`/`/`\\`）。",
			400,
		);
	}
	return slug;
}

// ================= Commit Message 固定模板 =================

export const COMMIT_MESSAGES = {
	createPost: (slug: string) => `cms: create post: ${slug}`,
	updatePost: (slug: string) => `cms: update post: ${slug}`,
	deletePost: (slug: string) => `cms: delete post: ${slug}`,
	publishDraft: (slug: string) => `cms: publish draft: ${slug}`,
	unpublishToDraft: (slug: string) => `cms: unpublish to draft: ${slug}`,
	updateTools: "cms: update tools list",
	updateProjects: "cms: update projects list",
	updateResources: "cms: update resources list",
	updateSettings: "cms: update site settings",
	uploadImage: (dateAndName: string) =>
		`cms: upload image: ${dateAndName}`,
	batchSave: (n: number) => `cms: batch save (${n} files)`,
} as const;

// ================= Octokit 单例（仅本文件构造） =================

let _octokit: Octokit | null = null;
function octokit(): Octokit {
	if (_octokit) return _octokit;
	const token = process.env.GITHUB_TOKEN;
	// 即使无 token 也构造（mock 模式或只读公开仓库），写操作会在调用时报 github_auth
	_octokit = new Octokit({ auth: token ?? undefined });
	return _octokit;
}

function repoConfig() {
	const owner = process.env.GITHUB_OWNER;
	const repo = process.env.GITHUB_REPO;
	const branch = process.env.GITHUB_BRANCH || "main";
	if (!owner || !repo) {
		throw new GitHubError(
			"github_other",
			"GitHub owner/repo 环境变量未配置。",
			500,
		);
	}
	return { owner, repo, branch };
}

function isMock(): boolean {
	return process.env.ADMIN_GITHUB_MOCK === "1";
}

// ================= Mock in-memory store =================

type MockFile = { path: string; content: string; sha: string; encoding: "utf-8" | "base64" };
type MockCommit = { sha: string; message: string; date: string; files: MockFile[] };

const mockStore: {
	files: Map<string, MockFile>; // path → file
	commits: MockCommit[]; // 最近在前
	initialized: boolean;
} = { files: new Map(), commits: [], initialized: false };

function mockSha(input: string): string {
	// 简易 40 字符 hex（不真实但长度对，方便测试）
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = ((h << 5) - h + input.charCodeAt(i)) | 0;
	}
	const base = Math.abs(h).toString(16).padStart(8, "0");
	return (base + base + base + base + base).slice(0, 40);
}

/** Mock 初始化：把本地仓库已有文件载入内存（便于 Phase 9 烟雾测试） */
function ensureMockInitialized(): void {
	if (mockStore.initialized) return;
	mockStore.initialized = true;
	const projectRoot = process.cwd();
	// 载入文章 / projects / resources / settings（这些是测试会读取的）
	const candidates = [
		...globLocal(pathResolve(projectRoot, "src/content/post")),
		...globLocal(pathResolve(projectRoot, "src/content/projects")),
		...globLocal(pathResolve(projectRoot, "src/content/resources")),
		...globLocal(pathResolve(projectRoot, "src/content/tools")),
		pathResolve(projectRoot, "src/content/data/site-settings.json"),
	];
	for (const abs of candidates) {
		const rel = pathRelative(projectRoot, abs).split(pathSep).join("/");
		if (!rel) continue;
		try {
			const buf = readFileSync(abs);
			const isText = !isProbablyBinary(buf);
			const content = isText ? buf.toString("utf-8") : buf.toString("base64");
			mockStore.files.set(rel, {
				path: rel,
				content,
				sha: mockSha(rel + content),
				encoding: isText ? "utf-8" : "base64",
			});
		} catch {
			// 跳过读取失败的文件
		}
	}
	// 初始 commit
	mockStore.commits.unshift({
		sha: mockSha("init"),
		message: "cms: mock init",
		date: new Date().toISOString(),
		files: [],
	});
}

function globLocal(dir: string): string[] {
	// 简易递归收集（避免引入额外 glob 依赖）
	if (!existsSync(dir)) return [];
	const out: string[] = [];
	const stack: string[] = [dir];
	const { readdirSync, statSync } = require("node:fs");
	while (stack.length) {
		const cur = stack.pop() as string;
		let entries: string[];
		try {
			entries = readdirSync(cur);
		} catch {
			continue;
		}
		for (const e of entries) {
			const full = pathResolve(cur, e);
			let st;
			try {
				st = statSync(full);
			} catch {
				continue;
			}
			if (st.isDirectory()) {
				stack.push(full);
			} else if (st.isFile()) {
				out.push(full);
			}
		}
	}
	return out;
}

function isProbablyBinary(buf: Buffer): boolean {
	for (let i = 0; i < Math.min(buf.length, 512); i++) {
		const c = buf[i];
		if (c === 0) return true; // NUL 字节
	}
	return false;
}

// ================= 公共类型 =================

export type FileContentResult = {
	path: string;
	content: string; // utf-8 文本
	sha: string;
	encoding: "utf-8";
};

export type FileListEntry = {
	path: string;
	name: string;
	type: "file" | "dir";
	sha: string;
	size: number;
};

export type RecentCommit = {
	sha: string;
	message: string;
	date: string;
	author: string;
};

// ================= 写操作：单文件 =================

type CreateOrUpdateInput = {
	path: string;
	content: string; // utf-8 文本
	message: string;
	existingSha?: string; // 更新时必填，缺失 → 400；过期 → 409
};

type CreateOrUpdateBinaryInput = {
	path: string;
	b64Content: string; // base64
	message: string;
	existingSha?: string;
};

/**
 * 创建或更新单个 UTF-8 文本文件。
 * - 若 existingSha 提供 → 调用 update（PUT /repos/.../contents/{path}）
 * - 否则 → create（POST 同一 endpoint，靠 GitHub 自己处理 422 重复路径）
 */
export async function createOrUpdateFile(
	input: CreateOrUpdateInput,
): Promise<{ sha: string; path: string; commitSha: string }> {
	const safePath = validateRepoPath(input.path);
	const contentB64 = Buffer.from(input.content, "utf-8").toString("base64");
	return await createOrUpdateBinary({
		path: safePath,
		b64Content: contentB64,
		message: input.message,
		existingSha: input.existingSha,
	});
}

export async function createOrUpdateBinary(
	input: CreateOrUpdateBinaryInput,
): Promise<{ sha: string; path: string; commitSha: string }> {
	const safePath = validateRepoPath(input.path);

	if (isMock()) {
		ensureMockInitialized();
		const prev = mockStore.files.get(safePath);
		if (input.existingSha && (!prev || prev.sha !== input.existingSha)) {
			throw new GitHubError(
				"github_conflict",
				"文件 SHA 已过期或文件不存在。",
				409,
			);
		}
		const newSha = mockSha(safePath + input.b64Content + Date.now());
		const file: MockFile = {
			path: safePath,
			content: input.b64Content,
			sha: newSha,
			encoding: "base64",
		};
		mockStore.files.set(safePath, file);
		const commitSha = mockSha(safePath + newSha + Date.now());
		mockStore.commits.unshift({
			sha: commitSha,
			message: input.message,
			date: new Date().toISOString(),
			files: [file],
		});
		return { sha: newSha, path: safePath, commitSha };
	}

	const { owner, repo, branch } = repoConfig();
	try {
		const res = await octokit().rest.repos.createOrUpdateFileContents({
			owner,
			repo,
			path: safePath,
			message: input.message,
			content: input.b64Content,
			branch,
			sha: input.existingSha,
		});
		return {
			sha: res.data.content?.sha ?? "",
			path: safePath,
			commitSha: res.data.commit?.sha ?? "",
		};
	} catch (e) {
		throw classifyOctokitError(e);
	}
}

/**
 * 删除文件。必须提供 existingSha。
 */
export async function deleteFile(
	path: string,
	message: string,
	existingSha: string,
): Promise<{ commitSha: string; path: string }> {
	const safePath = validateRepoPath(path);
	if (!existingSha) {
		throw new GitHubError("invalid_path", "删除文件必须提供 existingSha。", 400);
	}

	if (isMock()) {
		ensureMockInitialized();
		const prev = mockStore.files.get(safePath);
		if (!prev || prev.sha !== existingSha) {
			throw new GitHubError("github_conflict", "SHA 不匹配。", 409);
		}
		mockStore.files.delete(safePath);
		const commitSha = mockSha(safePath + Date.now());
		mockStore.commits.unshift({
			sha: commitSha,
			message,
			date: new Date().toISOString(),
			files: [],
		});
		return { commitSha, path: safePath };
	}

	const { owner, repo, branch } = repoConfig();
	try {
		const res = await octokit().rest.repos.deleteFile({
			owner,
			repo,
			path: safePath,
			message,
			sha: existingSha,
			branch,
		});
		return {
			commitSha: res.data.commit?.sha ?? "",
			path: safePath,
		};
	} catch (e) {
		throw classifyOctokitError(e);
	}
}

// ================= 核心能力：commitMultipleFiles（Git Database API 原子提交） =================

export type MultiFileEntry = {
	path: string;
	/** utf-8 文本内容（与 b64Content 二选一） */
	content?: string;
	/** base64 内容（用于二进制如图片） */
	b64Content?: string;
	encoding?: "utf-8" | "base64";
};

export type CommitMultipleFilesResult = {
	commitSha: string;
	treeSha: string;
	files: { path: string; sha: string }[];
};

/**
 * 原子提交多个文件 / 删除多个文件到同一次 commit。
 *
 * 实现流程（Git Database API）：
 *  1. 对每个写入项 createBlob（拿到 blob sha）
 *  2. 取当前 ref 最新 commit 的 tree sha 作为 base tree
 *  3. createTree(baseTree, treeEntries) — 写入项以 blob 形式加入；删除项以 "delete" tree entry
 *  4. createCommit(parent=latestCommitSha, tree=newTreeSha, message)
 *  5. updateRef(ref=refs/heads/<branch>, sha=newCommitSha)
 *
 * 失败任一步即抛错（不会产生半完成 commit，因为 GitHub 在 updateRef 前都不改 ref）。
 *
 * 注：Astro 4 / Octokit rest 类型已包含 git database 相关方法。
 */
export async function commitMultipleFiles(
	entries: MultiFileEntry[],
	message: string,
	opts: { deletePaths?: string[] } = {},
): Promise<CommitMultipleFilesResult> {
	if (!entries || entries.length === 0) {
		throw new GitHubError("invalid_path", "至少需要一个文件项。", 400);
	}

	// 统一校验路径
	const safeEntries = entries.map((e) => ({
		...e,
		path: validateRepoPath(e.path),
	}));
	const safeDeletePaths = (opts.deletePaths ?? []).map((p) =>
		validateRepoPath(p),
	);

	if (isMock()) {
		ensureMockInitialized();
		const newFiles: MockFile[] = [];
		for (const e of safeEntries) {
			const content = e.b64Content ?? Buffer.from(e.content ?? "", "utf-8").toString("base64");
			const newSha = mockSha(e.path + content + Date.now() + Math.random());
			const file: MockFile = {
				path: e.path,
				content,
				sha: newSha,
				encoding: "base64",
			};
			mockStore.files.set(e.path, file);
			newFiles.push(file);
		}
		for (const p of safeDeletePaths) {
			mockStore.files.delete(p);
		}
		const commitSha = mockSha(safeEntries.map((e) => e.path).join(",") + Date.now());
		const treeSha = mockSha("tree:" + commitSha);
		mockStore.commits.unshift({
			sha: commitSha,
			message,
			date: new Date().toISOString(),
			files: newFiles,
		});
		return {
			commitSha,
			treeSha,
			files: newFiles.map((f) => ({ path: f.path, sha: f.sha })),
		};
	}

	const { owner, repo, branch } = repoConfig();
	const ref = `heads/${branch}`;
	try {
		// 1) 当前 ref 的 commit sha + tree sha
		const refRes = await octokit().rest.git.getRef({ owner, repo, ref });
		const latestCommitSha = refRes.data.object.sha;
		const latestCommit = await octokit().rest.git.getCommit({
			owner,
			repo,
			commit_sha: latestCommitSha,
		});
		const baseTreeSha = latestCommit.data.tree.sha;

		// 2) 创建 blobs
		type TreeEntryObject = NonNullable<
			NonNullable<
				RestEndpointMethodTypes["git"]["createTree"]["parameters"]["tree"]
			>[number]
		>;
		const treeEntries: TreeEntryObject[] = [];

		for (const e of safeEntries) {
			const content = e.b64Content ?? Buffer.from(e.content ?? "", "utf-8").toString("base64");
			const blob = await octokit().rest.git.createBlob({
				owner,
				repo,
				content,
				encoding: "base64",
			});
			treeEntries.push({
				path: e.path,
				mode: "100644",
				type: "blob",
				sha: blob.data.sha,
			});
		}

		// 3) 删除项：原 mode + sha=null 表示从新 tree 中移除该 blob（Git 协议）
		for (const p of safeDeletePaths) {
			// Octokit 类型 tree.sha 接受 string | null；此处的字面量推断会过窄，统一 as 断言
			const entry: TreeEntryObject = {
				path: p,
				mode: "100644",
				type: "blob",
				sha: null,
			} as unknown as TreeEntryObject;
			treeEntries.push(entry);
		}

		// 4) createTree
		const tree = await octokit().rest.git.createTree({
			owner,
			repo,
			base_tree: baseTreeSha,
			tree: treeEntries,
		});

		// 5) createCommit
		const commit = await octokit().rest.git.createCommit({
			owner,
			repo,
			message,
			tree: tree.data.sha,
			parents: [latestCommitSha],
		});

		// 6) updateRef
		await octokit().rest.git.updateRef({
			owner,
			repo,
			ref,
			sha: commit.data.sha,
		});

		return {
			commitSha: commit.data.sha,
			treeSha: tree.data.sha,
			files: safeEntries.map((e) => {
				const blob = treeEntries.find(
					(t) => t && typeof t === "object" && "path" in t && (t as { path?: string }).path === e.path,
				) as { sha?: string } | undefined;
				return { path: e.path, sha: blob?.sha ?? "" };
			}),
		};
	} catch (e) {
		throw classifyOctokitError(e);
	}
}

// ================= 读操作 =================

export async function getFileInfo(path: string): Promise<FileContentResult | null> {
	const safePath = validateRepoPath(path);

	if (isMock()) {
		ensureMockInitialized();
		const f = mockStore.files.get(safePath);
		if (!f) return null;
		const content =
			f.encoding === "base64"
				? Buffer.from(f.content, "base64").toString("utf-8")
				: f.content;
		return { path: safePath, content, sha: f.sha, encoding: "utf-8" };
	}

	const { owner, repo, branch } = repoConfig();
	try {
		const res = await octokit().rest.repos.getContent({
			owner,
			repo,
			path: safePath,
			ref: branch,
		});
		const data = res.data;
		if (!("content" in data) || data.type !== "file") return null;
		const content = Buffer.from(data.content ?? "", "base64").toString("utf-8");
		return {
			path: safePath,
			content,
			sha: data.sha,
			encoding: "utf-8",
		};
	} catch (e) {
		const kind = classifyOctokitKind(e);
		if (kind === "github_not_found") return null;
		throw classifyOctokitError(e);
	}
}

export async function listFilesInFolder(
	folder: string,
	opts: { recursive?: boolean } = {},
): Promise<FileListEntry[]> {
	// folder 也要做前缀校验，但允许前缀本身（如 src/content/post/）
	const safeFolder = validateRepoPath(folder);

	if (isMock()) {
		ensureMockInitialized();
		const out: FileListEntry[] = [];
		for (const f of mockStore.files.values()) {
			if (f.path.startsWith(safeFolder)) {
				out.push({
					path: f.path,
					name: f.path.slice(f.path.lastIndexOf("/") + 1),
					type: "file",
					sha: f.sha,
					size: f.content.length,
				});
			}
		}
		return out;
	}

	const { owner, repo, branch } = repoConfig();
	try {
		const res = await octokit().rest.repos.getContent({
			owner,
			repo,
			path: safeFolder,
			ref: branch,
		});
		const data = Array.isArray(res.data) ? res.data : [res.data];
		const out: FileListEntry[] = [];
		for (const item of data) {
			if (item.type === "file" || item.type === "dir") {
				out.push({
					path: item.path,
					name: item.name,
					type: item.type,
					sha: item.sha,
					size: item.size ?? 0,
				});
			} else if (item.type === "symlink") {
				// 跳过 symlink，避免误用
			}
		}
		if (opts.recursive) {
			const subDirs = out.filter((e) => e.type === "dir");
			for (const d of subDirs) {
				const sub = await listFilesInFolder(d.path, { recursive: true });
				out.push(...sub);
			}
		}
		return out.filter((e) => e.type === "file");
	} catch (e) {
		const kind = classifyOctokitKind(e);
		if (kind === "github_not_found") return [];
		throw classifyOctokitError(e);
	}
}

export async function listRecentCommits(limit = 10): Promise<RecentCommit[]> {
	if (isMock()) {
		ensureMockInitialized();
		return mockStore.commits.slice(0, limit).map((c) => ({
			sha: c.sha,
			message: c.message,
			date: c.date,
			author: "mock",
		}));
	}

	const { owner, repo, branch } = repoConfig();
	try {
		const res = await octokit().rest.repos.listCommits({
			owner,
			repo,
			sha: branch,
			per_page: Math.min(Math.max(limit, 1), 100),
		});
		return res.data.map((c) => ({
			sha: c.sha,
			message: c.commit.message,
			date: c.commit.author?.date ?? c.commit.committer?.date ?? "",
			author: c.commit.author?.name ?? c.commit.committer?.name ?? "",
		}));
	} catch (e) {
		throw classifyOctokitError(e);
	}
}

// ================= 图片上传 =================

export async function uploadBinaryImage(
	targetPath: string,
	bytes: Uint8Array,
): Promise<{ sha: string; path: string; commitSha: string }> {
	const safePath = validateRepoPath(targetPath);
	// 必须在 uploads 下
	if (!safePath.startsWith(PREFIX_IMAGE)) {
		throw new GitHubError(
			"invalid_path",
			"图片必须上传到 public/assets/images/uploads/ 下。",
			400,
		);
	}
	const b64 = Buffer.from(bytes).toString("base64");
	// 文件名由上传端点生成，此处不再二次生成
	const today = new Date().toISOString().slice(0, 10);
	const message = COMMIT_MESSAGES.uploadImage(
		`${today}/${safePath.slice(safePath.lastIndexOf("/") + 1)}`,
	);
	return await createOrUpdateBinary({
		path: safePath,
		b64Content: b64,
		message,
	});
}

// ================= 错误分类 =================

function classifyOctokitKind(e: unknown): GitHubErrorKind | null {
	if (e && typeof e === "object" && "status" in e) {
		const status = (e as { status?: number }).status;
		if (status === 401 || status === 403) return "github_auth";
		if (status === 404) return "github_not_found";
		if (status === 409) return "github_conflict";
		if (status === 429) return "github_rate_limit";
		if (status && status >= 400) return "github_other";
	}
	return null;
}

function classifyOctokitError(e: unknown): GitHubError {
	const kind = classifyOctokitKind(e);
	if (!kind) {
		const msg = e instanceof Error ? e.message : String(e);
		return new GitHubError("github_other", `GitHub 请求失败：${msg}`, 500);
	}
	const msg = e instanceof Error ? e.message : String(e);
	const status =
		(e as { status?: number })?.status ??
		(kind === "github_auth" ? 401 : kind === "github_not_found" ? 404 : 500);
	const friendly: Record<GitHubErrorKind, string> = {
		github_auth: "GitHub 鉴权失败，请检查 Token 权限。",
		github_rate_limit: "GitHub API 限流，请稍后再试。",
		github_not_found: "GitHub 资源未找到。",
		github_conflict: "GitHub 冲突：文件 SHA 已过期或路径冲突。",
		github_other: `GitHub 错误：${msg}`,
		invalid_path: "路径非法。",
		invalid_slug: "slug 非法。",
		invalid_mime: "MIME 类型不允许。",
		file_too_large: "文件过大。",
		schema_error: "数据结构校验失败。",
		unauthorized: "未登录。",
		csrf_mismatch: "CSRF 校验失败。",
		missing_csrf: "缺少 CSRF Token。",
		csrf_expired: "CSRF Token 已过期。",
		too_many_attempts: "请求过于频繁。",
	};
	return new GitHubError(kind, friendly[kind], status);
}
