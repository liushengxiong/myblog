import { w as withApiGuard, a as jsonError, j as json } from '../../../chunks/api-guard_Bct9MpxU.mjs';
import { b as PREFIX_PROJECTS, i as createOrUpdateFile, C as COMMIT_MESSAGES, j as commitMultipleFiles, G as GitHubError } from '../../../chunks/github_P3asMU5M.mjs';
import { l as listDataItems, d as dataItemIdExists, f as findDataItem } from '../../../chunks/data-items_B9_6rzI-.mjs';
import { P as PROJECT_SCHEMA } from '../../../chunks/schemas_8vzO8d71.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
function githubErrorResponse(e) {
  if (e instanceof GitHubError) {
    return jsonError(e.message, e.kind, e.status);
  }
  const msg = e instanceof Error ? e.message : String(e);
  return jsonError(`服务器错误：${msg}`, "github_other", 500);
}
async function list() {
  const items = await listDataItems(PREFIX_PROJECTS, {
    schema: PROJECT_SCHEMA
  });
  items.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
  return json({
    ok: true,
    items: items.map((i) => ({
      id: i.id,
      path: i.path,
      sha: i.sha,
      data: i.data
    }))
  });
}
async function create({ body }) {
  const parsed = PROJECT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      `数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
      "schema_error",
      422
    );
  }
  const project = parsed.data;
  if (!project.id) {
    return jsonError("缺少 id 字段。", "schema_error", 422);
  }
  const exists = await dataItemIdExists(PREFIX_PROJECTS, project.id);
  if (exists) {
    return jsonError(
      `id "${project.id}" 已被占用。请换一个。`,
      "github_conflict",
      409
    );
  }
  const path = `${PREFIX_PROJECTS}${project.id}.json`;
  const content = `${JSON.stringify(project, null, 2)}
`;
  try {
    const res = await createOrUpdateFile({
      path,
      content,
      message: COMMIT_MESSAGES.updateProjects
    });
    return json({
      ok: true,
      id: project.id,
      path: res.path,
      sha: res.sha,
      commitSha: res.commitSha
    });
  } catch (e) {
    return githubErrorResponse(e);
  }
}
async function reorder({ body }) {
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return jsonError("items 必须是非空数组。", "schema_error", 422);
  }
  const entries = [];
  for (const it of body.items) {
    if (!it || typeof it.id !== "string" || typeof it.order !== "number") {
      return jsonError(
        `items 项格式错误（需要 { id, order }）：${JSON.stringify(it)}`,
        "schema_error",
        422
      );
    }
    const found = await findDataItem(PREFIX_PROJECTS, it.id, {
      schema: PROJECT_SCHEMA
    });
    if (!found) {
      return jsonError(
        `id "${it.id}" 不存在，无法重排。`,
        "github_not_found",
        404
      );
    }
    const updated = {
      ...found.data,
      order: Math.max(0, Math.floor(it.order))
    };
    const content = `${JSON.stringify(updated, null, 2)}
`;
    entries.push({ path: found.path, content });
  }
  try {
    const res = await commitMultipleFiles(
      entries.map((e) => ({ path: e.path, content: e.content })),
      COMMIT_MESSAGES.updateProjects
    );
    return json({
      ok: true,
      commitSha: res.commitSha,
      updated: entries.length
    });
  } catch (e) {
    return githubErrorResponse(e);
  }
}
const GET = withApiGuard({ auth: true, csrf: false }, async () => {
  return await list();
});
const POST = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    let body = null;
    try {
      body = await ctx.request.json();
    } catch {
      return jsonError("请求体格式错误。", "BAD_JSON", 400);
    }
    return await create({ body });
  }
);
const PUT = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    let body = null;
    try {
      body = await ctx.request.json();
    } catch {
      return jsonError("请求体格式错误。", "BAD_JSON", 400);
    }
    return await reorder({ body });
  }
);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	POST,
	PUT,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
