import { v as validateSlug, g as getFileInfo, G as GitHubError, l as listFilesInFolder } from './github_P3asMU5M.mjs';

async function listDataItems(prefix, opts = {}) {
  const files = await listFilesInFolder(prefix, { recursive: false });
  const out = [];
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
    let data;
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
    out.push({ id, path: f.path, sha: f.sha, data });
  }
  return out;
}
async function findDataItem(prefix, id, opts = {}) {
  const safeId = validateSlug(id);
  const path = `${prefix}${safeId}.json`;
  const info = await getFileInfo(path);
  if (!info) return null;
  let data;
  try {
    data = JSON.parse(info.content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new GitHubError(
      "schema_error",
      `JSON 解析失败（${path}）：${msg}`,
      422
    );
  }
  if (opts.schema) {
    const r = opts.schema.safeParse(data);
    if (!r.success) {
      throw new GitHubError(
        "schema_error",
        `数据校验失败（${path}）`,
        422
      );
    }
    data = r.data;
  }
  return { id: safeId, path, sha: info.sha, data };
}
async function dataItemIdExists(prefix, id) {
  try {
    const found = await findDataItem(prefix, id);
    return found !== null;
  } catch {
    return false;
  }
}

export { dataItemIdExists as d, findDataItem as f, listDataItems as l };
