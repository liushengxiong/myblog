import { Octokit as Octokit$1 } from '@octokit/core';
import { requestLog } from '@octokit/plugin-request-log';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { legacyRestEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { A as ADMIN_SLUG_REGEX } from './auth_C2fyY4vQ.mjs';

const VERSION = "22.0.1";

const Octokit = Octokit$1.plugin(requestLog, legacyRestEndpointMethods, paginateRest).defaults(
  {
    userAgent: `octokit-rest.js/${VERSION}`
  }
);

const PREFIX_POST = "src/content/post/";
const PREFIX_DRAFT = "src/content/post/drafts/";
const PREFIX_TOOLS = "src/content/tools/";
const PREFIX_PROJECTS = "src/content/projects/";
const PREFIX_RESOURCES = "src/content/resources/";
const PREFIX_SETTINGS = "src/content/data/";
const PREFIX_IMAGE = "public/assets/images/uploads/";
const ALL_PREFIXES = [
  PREFIX_POST,
  PREFIX_DRAFT,
  PREFIX_TOOLS,
  PREFIX_PROJECTS,
  PREFIX_RESOURCES,
  PREFIX_SETTINGS,
  PREFIX_IMAGE
];
class GitHubError extends Error {
  kind;
  status;
  extra;
  constructor(kind, message, status = 400, extra) {
    super(message);
    this.name = "GitHubError";
    this.kind = kind;
    this.status = status;
    this.extra = extra;
  }
}
function validateRepoPath(rawPath, allowedPrefixes = ALL_PREFIXES) {
  if (typeof rawPath !== "string" || rawPath.length === 0) {
    throw new GitHubError("invalid_path", "路径不能为空。", 400);
  }
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    decoded = rawPath;
  }
  if (decoded.includes("\\")) {
    throw new GitHubError(
      "invalid_path",
      "路径不允许包含反斜杠。",
      400
    );
  }
  if (/[\x00-\x1f\x7f]/.test(decoded)) {
    throw new GitHubError("invalid_path", "路径包含非法控制字符。", 400);
  }
  if (/[^\x00-\x7f]/.test(decoded)) {
    throw new GitHubError(
      "invalid_path",
      "路径包含非 ASCII 字符，请使用英文 slug。",
      400
    );
  }
  const segments = decoded.split("/");
  if (segments.some((s) => s === "..")) {
    throw new GitHubError(
      "invalid_path",
      "路径不允许包含 `..` 段。",
      400
    );
  }
  const cleaned = segments.filter((s) => s.length > 0).join("/");
  const matched = allowedPrefixes.find((p) => cleaned.startsWith(p));
  if (!matched) {
    throw new GitHubError(
      "invalid_path",
      `路径不在允许的前缀白名单内：${allowedPrefixes.join(", ")}`,
      400
    );
  }
  if (cleaned.includes("..")) {
    throw new GitHubError("invalid_path", "路径非法。", 400);
  }
  return cleaned;
}
function validateSlug(slug) {
  if (typeof slug !== "string" || slug.length < 2 || slug.length > 120) {
    throw new GitHubError(
      "invalid_slug",
      "slug 长度必须在 2–120 之间。",
      400
    );
  }
  if (!ADMIN_SLUG_REGEX.test(slug)) {
    throw new GitHubError(
      "invalid_slug",
      "slug 只能包含小写字母、数字，并以连字符分隔段（不允许大写/中文/`.`/`/`/`\\`）。",
      400
    );
  }
  return slug;
}
const COMMIT_MESSAGES = {
  createPost: (slug) => `cms: create post: ${slug}`,
  updatePost: (slug) => `cms: update post: ${slug}`,
  deletePost: (slug) => `cms: delete post: ${slug}`,
  publishDraft: (slug) => `cms: publish draft: ${slug}`,
  unpublishToDraft: (slug) => `cms: unpublish to draft: ${slug}`,
  updateTools: "cms: update tools list",
  updateProjects: "cms: update projects list",
  updateResources: "cms: update resources list",
  updateSettings: "cms: update site settings",
  uploadImage: (dateAndName) => `cms: upload image: ${dateAndName}`,
  batchSave: (n) => `cms: batch save (${n} files)`
};
let _octokit = null;
function octokit() {
  if (_octokit) return _octokit;
  const token = process.env.GITHUB_TOKEN;
  _octokit = new Octokit({ auth: token ?? void 0 });
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
      500
    );
  }
  return { owner, repo, branch };
}
function isMock() {
  return process.env.ADMIN_GITHUB_MOCK === "1";
}
const mockStore = { files: /* @__PURE__ */ new Map(), commits: [], initialized: false };
function mockSha(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i) | 0;
  }
  const base = Math.abs(h).toString(16).padStart(8, "0");
  return (base + base + base + base + base).slice(0, 40);
}
function ensureMockInitialized() {
  if (mockStore.initialized) return;
  mockStore.initialized = true;
  const projectRoot = process.cwd();
  const candidates = [
    ...globLocal(resolve(projectRoot, "src/content/post")),
    ...globLocal(resolve(projectRoot, "src/content/projects")),
    ...globLocal(resolve(projectRoot, "src/content/resources")),
    ...globLocal(resolve(projectRoot, "src/content/tools")),
    resolve(projectRoot, "src/content/data/site-settings.json")
  ];
  for (const abs of candidates) {
    const rel = relative(projectRoot, abs).split(sep).join("/");
    if (!rel) continue;
    try {
      const buf = readFileSync(abs);
      const isText = !isProbablyBinary(buf);
      const content = isText ? buf.toString("utf-8") : buf.toString("base64");
      mockStore.files.set(rel, {
        path: rel,
        content,
        sha: mockSha(rel + content),
        encoding: isText ? "utf-8" : "base64"
      });
    } catch {
    }
  }
  mockStore.commits.unshift({
    sha: mockSha("init"),
    message: "cms: mock init",
    date: (/* @__PURE__ */ new Date()).toISOString(),
    files: []
  });
}
function globLocal(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  const { readdirSync, statSync } = require("node:fs");
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur);
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = resolve(cur, e);
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
function isProbablyBinary(buf) {
  for (let i = 0; i < Math.min(buf.length, 512); i++) {
    const c = buf[i];
    if (c === 0) return true;
  }
  return false;
}
async function createOrUpdateFile(input) {
  const safePath = validateRepoPath(input.path);
  const contentB64 = Buffer.from(input.content, "utf-8").toString("base64");
  return await createOrUpdateBinary({
    path: safePath,
    b64Content: contentB64,
    message: input.message,
    existingSha: input.existingSha
  });
}
async function createOrUpdateBinary(input) {
  const safePath = validateRepoPath(input.path);
  if (isMock()) {
    ensureMockInitialized();
    const prev = mockStore.files.get(safePath);
    if (input.existingSha && (!prev || prev.sha !== input.existingSha)) {
      throw new GitHubError(
        "github_conflict",
        "文件 SHA 已过期或文件不存在。",
        409
      );
    }
    const newSha = mockSha(safePath + input.b64Content + Date.now());
    const file = {
      path: safePath,
      content: input.b64Content,
      sha: newSha,
      encoding: "base64"
    };
    mockStore.files.set(safePath, file);
    const commitSha = mockSha(safePath + newSha + Date.now());
    mockStore.commits.unshift({
      sha: commitSha,
      message: input.message,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      files: [file]
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
      sha: input.existingSha
    });
    return {
      sha: res.data.content?.sha ?? "",
      path: safePath,
      commitSha: res.data.commit?.sha ?? ""
    };
  } catch (e) {
    throw classifyOctokitError(e);
  }
}
async function deleteFile(path, message, existingSha) {
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
      date: (/* @__PURE__ */ new Date()).toISOString(),
      files: []
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
      branch
    });
    return {
      commitSha: res.data.commit?.sha ?? "",
      path: safePath
    };
  } catch (e) {
    throw classifyOctokitError(e);
  }
}
async function commitMultipleFiles(entries, message, opts = {}) {
  if (!entries || entries.length === 0) {
    throw new GitHubError("invalid_path", "至少需要一个文件项。", 400);
  }
  const safeEntries = entries.map((e) => ({
    ...e,
    path: validateRepoPath(e.path)
  }));
  const safeDeletePaths = (opts.deletePaths ?? []).map(
    (p) => validateRepoPath(p)
  );
  if (isMock()) {
    ensureMockInitialized();
    const newFiles = [];
    for (const e of safeEntries) {
      const content = e.b64Content ?? Buffer.from(e.content ?? "", "utf-8").toString("base64");
      const newSha = mockSha(e.path + content + Date.now() + Math.random());
      const file = {
        path: e.path,
        content,
        sha: newSha,
        encoding: "base64"
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
      date: (/* @__PURE__ */ new Date()).toISOString(),
      files: newFiles
    });
    return {
      commitSha,
      treeSha,
      files: newFiles.map((f) => ({ path: f.path, sha: f.sha }))
    };
  }
  const { owner, repo, branch } = repoConfig();
  const ref = `heads/${branch}`;
  try {
    const refRes = await octokit().rest.git.getRef({ owner, repo, ref });
    const latestCommitSha = refRes.data.object.sha;
    const latestCommit = await octokit().rest.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha
    });
    const baseTreeSha = latestCommit.data.tree.sha;
    const treeEntries = [];
    for (const e of safeEntries) {
      const content = e.b64Content ?? Buffer.from(e.content ?? "", "utf-8").toString("base64");
      const blob = await octokit().rest.git.createBlob({
        owner,
        repo,
        content,
        encoding: "base64"
      });
      treeEntries.push({
        path: e.path,
        mode: "100644",
        type: "blob",
        sha: blob.data.sha
      });
    }
    for (const p of safeDeletePaths) {
      const entry = {
        path: p,
        mode: "100644",
        type: "blob",
        sha: null
      };
      treeEntries.push(entry);
    }
    const tree = await octokit().rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeEntries
    });
    const commit = await octokit().rest.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.data.sha,
      parents: [latestCommitSha]
    });
    await octokit().rest.git.updateRef({
      owner,
      repo,
      ref,
      sha: commit.data.sha
    });
    return {
      commitSha: commit.data.sha,
      treeSha: tree.data.sha,
      files: safeEntries.map((e) => {
        const blob = treeEntries.find(
          (t) => t && typeof t === "object" && "path" in t && t.path === e.path
        );
        return { path: e.path, sha: blob?.sha ?? "" };
      })
    };
  } catch (e) {
    throw classifyOctokitError(e);
  }
}
async function getFileInfo(path) {
  const safePath = validateRepoPath(path);
  if (isMock()) {
    ensureMockInitialized();
    const f = mockStore.files.get(safePath);
    if (!f) return null;
    const content = f.encoding === "base64" ? Buffer.from(f.content, "base64").toString("utf-8") : f.content;
    return { path: safePath, content, sha: f.sha, encoding: "utf-8" };
  }
  const { owner, repo, branch } = repoConfig();
  try {
    const res = await octokit().rest.repos.getContent({
      owner,
      repo,
      path: safePath,
      ref: branch
    });
    const data = res.data;
    if (!("content" in data) || data.type !== "file") return null;
    const content = Buffer.from(data.content ?? "", "base64").toString("utf-8");
    return {
      path: safePath,
      content,
      sha: data.sha,
      encoding: "utf-8"
    };
  } catch (e) {
    const kind = classifyOctokitKind(e);
    if (kind === "github_not_found") return null;
    throw classifyOctokitError(e);
  }
}
async function listFilesInFolder(folder, opts = {}) {
  const safeFolder = validateRepoPath(folder);
  if (isMock()) {
    ensureMockInitialized();
    const out = [];
    for (const f of mockStore.files.values()) {
      if (f.path.startsWith(safeFolder)) {
        out.push({
          path: f.path,
          name: f.path.slice(f.path.lastIndexOf("/") + 1),
          type: "file",
          sha: f.sha,
          size: f.content.length
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
      ref: branch
    });
    const data = Array.isArray(res.data) ? res.data : [res.data];
    const out = [];
    for (const item of data) {
      if (item.type === "file" || item.type === "dir") {
        out.push({
          path: item.path,
          name: item.name,
          type: item.type,
          sha: item.sha,
          size: item.size ?? 0
        });
      } else if (item.type === "symlink") {
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
async function listRecentCommits(limit = 10) {
  if (isMock()) {
    ensureMockInitialized();
    return mockStore.commits.slice(0, limit).map((c) => ({
      sha: c.sha,
      message: c.message,
      date: c.date,
      author: "mock"
    }));
  }
  const { owner, repo, branch } = repoConfig();
  try {
    const res = await octokit().rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: Math.min(Math.max(limit, 1), 100)
    });
    return res.data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      date: c.commit.author?.date ?? c.commit.committer?.date ?? "",
      author: c.commit.author?.name ?? c.commit.committer?.name ?? ""
    }));
  } catch (e) {
    throw classifyOctokitError(e);
  }
}
async function uploadBinaryImage(targetPath, bytes) {
  const safePath = validateRepoPath(targetPath);
  if (!safePath.startsWith(PREFIX_IMAGE)) {
    throw new GitHubError(
      "invalid_path",
      "图片必须上传到 public/assets/images/uploads/ 下。",
      400
    );
  }
  const b64 = Buffer.from(bytes).toString("base64");
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const message = COMMIT_MESSAGES.uploadImage(
    `${today}/${safePath.slice(safePath.lastIndexOf("/") + 1)}`
  );
  return await createOrUpdateBinary({
    path: safePath,
    b64Content: b64,
    message
  });
}
function classifyOctokitKind(e) {
  if (e && typeof e === "object" && "status" in e) {
    const status = e.status;
    if (status === 401 || status === 403) return "github_auth";
    if (status === 404) return "github_not_found";
    if (status === 409) return "github_conflict";
    if (status === 429) return "github_rate_limit";
    if (status && status >= 400) return "github_other";
  }
  return null;
}
function classifyOctokitError(e) {
  const kind = classifyOctokitKind(e);
  if (!kind) {
    const msg2 = e instanceof Error ? e.message : String(e);
    return new GitHubError("github_other", `GitHub 请求失败：${msg2}`, 500);
  }
  const msg = e instanceof Error ? e.message : String(e);
  const status = e?.status ?? (kind === "github_auth" ? 401 : kind === "github_not_found" ? 404 : 500);
  const friendly = {
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
    too_many_attempts: "请求过于频繁。"
  };
  return new GitHubError(kind, friendly[kind], status);
}

export { COMMIT_MESSAGES as C, GitHubError as G, PREFIX_DRAFT as P, PREFIX_POST as a, PREFIX_PROJECTS as b, PREFIX_SETTINGS as c, PREFIX_TOOLS as d, PREFIX_RESOURCES as e, listRecentCommits as f, getFileInfo as g, PREFIX_IMAGE as h, createOrUpdateFile as i, commitMultipleFiles as j, deleteFile as k, listFilesInFolder as l, uploadBinaryImage as u, validateSlug as v };
