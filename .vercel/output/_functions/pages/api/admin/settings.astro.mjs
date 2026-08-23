import { w as withApiGuard, a as jsonError, j as json } from '../../../chunks/api-guard_Bct9MpxU.mjs';
import { g as getFileInfo, c as PREFIX_SETTINGS, i as createOrUpdateFile, C as COMMIT_MESSAGES, G as GitHubError } from '../../../chunks/github_P3asMU5M.mjs';
import { S as SITE_SETTINGS_SCHEMA } from '../../../chunks/schemas_8vzO8d71.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const SETTINGS_PATH = `${PREFIX_SETTINGS}site-settings.json`;
function githubErrorResponse(e) {
  if (e instanceof GitHubError) {
    return jsonError(e.message, e.kind, e.status);
  }
  const msg = e instanceof Error ? e.message : String(e);
  return jsonError(`服务器错误：${msg}`, "github_other", 500);
}
async function read() {
  const info = await getFileInfo(SETTINGS_PATH);
  if (!info) {
    return jsonError(
      "site-settings.json 不存在。请先在 GitHub 创建该文件。",
      "github_not_found",
      404
    );
  }
  let data;
  try {
    data = JSON.parse(info.content);
  } catch {
    return jsonError(
      "site-settings.json 解析失败：JSON 格式错误。",
      "schema_error",
      422
    );
  }
  const parsed = SITE_SETTINGS_SCHEMA.safeParse(data);
  if (!parsed.success) {
    return json({
      ok: true,
      path: info.path,
      sha: info.sha,
      data,
      schemaWarning: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    });
  }
  return json({
    ok: true,
    path: info.path,
    sha: info.sha,
    data: parsed.data
  });
}
async function update({
  body
}) {
  if (!body || !body.data) {
    return jsonError("缺少 data 字段。", "schema_error", 422);
  }
  const parsed = SITE_SETTINGS_SCHEMA.safeParse(body.data);
  if (!parsed.success) {
    return jsonError(
      `数据校验失败：${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      "schema_error",
      422
    );
  }
  const settings = parsed.data;
  const existingSha = body.existingSha;
  if (!existingSha) {
    return jsonError(
      "更新必须提供 existingSha。",
      "github_conflict",
      400
    );
  }
  const current = await getFileInfo(SETTINGS_PATH);
  if (!current) {
    return jsonError(
      "site-settings.json 不存在，无法更新。",
      "github_not_found",
      404
    );
  }
  if (existingSha !== current.sha) {
    return jsonError(
      "existingSha 已过期，请刷新后重试。",
      "github_conflict",
      409
    );
  }
  const content = `${JSON.stringify(settings, null, 2)}
`;
  try {
    const res = await createOrUpdateFile({
      path: SETTINGS_PATH,
      content,
      message: COMMIT_MESSAGES.updateSettings,
      existingSha
    });
    return json({
      ok: true,
      path: res.path,
      sha: res.sha,
      commitSha: res.commitSha
    });
  } catch (e) {
    return githubErrorResponse(e);
  }
}
const GET = withApiGuard({ auth: true, csrf: false }, async () => {
  return await read();
});
const PUT = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    let body = null;
    try {
      body = await ctx.request.json();
    } catch {
      return jsonError("请求体格式错误。", "BAD_JSON", 400);
    }
    return await update({ body });
  }
);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	PUT,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
