import { w as withApiGuard, a as jsonError, j as json } from '../../../../chunks/api-guard_Bct9MpxU.mjs';
import { b as PREFIX_PROJECTS, i as createOrUpdateFile, C as COMMIT_MESSAGES, j as commitMultipleFiles, k as deleteFile, G as GitHubError } from '../../../../chunks/github_P3asMU5M.mjs';
import { f as findDataItem, d as dataItemIdExists } from '../../../../chunks/data-items_B9_6rzI-.mjs';
import { P as PROJECT_SCHEMA } from '../../../../chunks/schemas_8vzO8d71.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
function githubErrorResponse(e) {
  if (e instanceof GitHubError) {
    return jsonError(e.message, e.kind, e.status);
  }
  const msg = e instanceof Error ? e.message : String(e);
  return jsonError(`服务器错误：${msg}`, "github_other", 500);
}
async function readOne({ id }) {
  const found = await findDataItem(PREFIX_PROJECTS, id, {
    schema: PROJECT_SCHEMA
  });
  if (!found) {
    return jsonError("项目不存在。", "github_not_found", 404);
  }
  return json({
    ok: true,
    id: found.id,
    path: found.path,
    sha: found.sha,
    data: found.data
  });
}
async function update({
  oldId,
  body
}) {
  if (!body || !body.data) {
    return jsonError("缺少 data 字段。", "schema_error", 422);
  }
  const parsed = PROJECT_SCHEMA.safeParse(body.data);
  if (!parsed.success) {
    return jsonError(
      `数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
      "schema_error",
      422
    );
  }
  const project = parsed.data;
  const existingSha = body.existingSha;
  if (!existingSha) {
    return jsonError(
      "更新必须提供 existingSha。",
      "github_conflict",
      400
    );
  }
  const found = await findDataItem(PREFIX_PROJECTS, oldId);
  if (!found) {
    return jsonError(
      "原项目不存在，无法更新。",
      "github_not_found",
      404
    );
  }
  if (existingSha !== found.sha) {
    return jsonError(
      "existingSha 已过期，请刷新后重试。",
      "github_conflict",
      409
    );
  }
  const newId = project.id;
  const idChanged = newId !== oldId;
  if (idChanged) {
    const occ = await dataItemIdExists(PREFIX_PROJECTS, newId);
    if (occ) {
      return jsonError(
        `新 id "${newId}" 已被占用。`,
        "github_conflict",
        409
      );
    }
  }
  const oldPath = found.path;
  const newPath = `${PREFIX_PROJECTS}${newId}.json`;
  const content = `${JSON.stringify(project, null, 2)}
`;
  try {
    if (!idChanged) {
      const res2 = await createOrUpdateFile({
        path: newPath,
        content,
        message: COMMIT_MESSAGES.updateProjects,
        existingSha
      });
      return json({
        ok: true,
        id: newId,
        path: res2.path,
        sha: res2.sha,
        commitSha: res2.commitSha,
        moved: false
      });
    }
    const res = await commitMultipleFiles(
      [{ path: newPath, content }],
      COMMIT_MESSAGES.updateProjects,
      { deletePaths: [oldPath] }
    );
    return json({
      ok: true,
      id: newId,
      path: newPath,
      sha: res.files[0]?.sha ?? "",
      commitSha: res.commitSha,
      moved: true
    });
  } catch (e) {
    return githubErrorResponse(e);
  }
}
async function remove({
  id,
  existingSha
}) {
  const found = await findDataItem(PREFIX_PROJECTS, id);
  if (!found) {
    return jsonError("项目不存在。", "github_not_found", 404);
  }
  if (!existingSha) {
    return jsonError("删除必须提供 existingSha。", "github_conflict", 400);
  }
  if (existingSha !== found.sha) {
    return jsonError(
      "existingSha 已过期，请刷新后重试。",
      "github_conflict",
      409
    );
  }
  try {
    const res = await deleteFile(
      found.path,
      COMMIT_MESSAGES.updateProjects,
      existingSha
    );
    return json({
      ok: true,
      id,
      commitSha: res.commitSha
    });
  } catch (e) {
    return githubErrorResponse(e);
  }
}
const GET = withApiGuard({ auth: true, csrf: false }, async ({ ctx }) => {
  const id = ctx.params.id;
  if (!id) return jsonError("缺少 id。", "BAD_REQUEST", 400);
  return await readOne({ id });
});
const PUT = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    const oldId = ctx.params.id;
    if (!oldId) return jsonError("缺少 id。", "BAD_REQUEST", 400);
    let body = null;
    try {
      body = await ctx.request.json();
    } catch {
      return jsonError("请求体格式错误。", "BAD_JSON", 400);
    }
    return await update({
      oldId,
      body
    });
  }
);
const DELETE = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    const id = ctx.params.id;
    if (!id) return jsonError("缺少 id。", "BAD_REQUEST", 400);
    const existingSha = ctx.url.searchParams.get("sha") || void 0;
    return await remove({ id, existingSha });
  }
);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	DELETE,
	GET,
	PUT,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
