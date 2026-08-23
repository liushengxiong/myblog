import { w as withApiGuard, a as jsonError, j as json } from '../../../chunks/api-guard_Bct9MpxU.mjs';
import { C as COMMIT_MESSAGES, i as createOrUpdateFile, G as GitHubError } from '../../../chunks/github_P3asMU5M.mjs';
import { l as listAllPostFiles, s as slugExists, p as postPath } from '../../../chunks/posts_Drh2qyUh.mjs';
import { a as POST_INPUT_SCHEMA, b as POST_FRONTMATTER_SCHEMA } from '../../../chunks/schemas_8vzO8d71.mjs';
import { serializePost } from '../../../chunks/markdown_Dq9cX7aD.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
async function list(ctx) {
  const files = await listAllPostFiles();
  const items = files.map((f) => ({
    slug: f.slug,
    status: f.status,
    sha: f.sha,
    path: f.path
    // list 接口不解析 frontmatter（前端按需 read 单条详情）
  }));
  return json({ ok: true, items });
}
async function create({ body }) {
  const parsed = POST_INPUT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      `数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
      "schema_error",
      422
    );
  }
  const input = parsed.data;
  const status = input.status ?? "published";
  const occupied = await slugExists(input.slug);
  if (occupied.exists) {
    return jsonError(
      `slug 已被占用（状态：${occupied.status}）。请换一个 slug。`,
      "github_conflict",
      409
    );
  }
  const fmResult = POST_FRONTMATTER_SCHEMA.safeParse({
    title: input.title,
    description: input.description,
    dateFormatted: input.dateFormatted,
    locale: input.locale,
    tags: input.tags,
    featured: input.featured
  });
  if (!fmResult.success) {
    return jsonError(
      `frontmatter 校验失败：${fmResult.error.issues.map((i) => i.message).join("; ")}`,
      "schema_error",
      422
    );
  }
  const frontmatter = fmResult.data;
  const content = serializePost({ frontmatter, body: input.body });
  const targetPath = postPath(input.slug, status);
  const message = status === "draft" ? COMMIT_MESSAGES.createPost(`draft/${input.slug}`) : COMMIT_MESSAGES.createPost(input.slug);
  try {
    const res = await createOrUpdateFile({
      path: targetPath,
      content,
      message
    });
    return json({
      ok: true,
      slug: input.slug,
      status,
      path: res.path,
      sha: res.sha,
      commitSha: res.commitSha
    });
  } catch (e) {
    return handleGitHubError(e);
  }
}
function handleGitHubError(e) {
  if (e instanceof GitHubError) {
    return jsonError(e.message, e.kind, e.status);
  }
  const msg = e instanceof Error ? e.message : String(e);
  return jsonError(`服务器错误：${msg}`, "github_other", 500);
}
const GET = withApiGuard({ auth: true, csrf: false }, async ({ ctx }) => {
  return await list(ctx);
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
