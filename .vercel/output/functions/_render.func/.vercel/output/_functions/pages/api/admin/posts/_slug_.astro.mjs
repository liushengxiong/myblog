import { w as withApiGuard, a as jsonError, j as json } from '../../../../chunks/api-guard_Bct9MpxU.mjs';
import { i as createOrUpdateFile, C as COMMIT_MESSAGES, j as commitMultipleFiles, k as deleteFile, G as GitHubError } from '../../../../chunks/github_P3asMU5M.mjs';
import { f as findPost, s as slugExists, p as postPath } from '../../../../chunks/posts_Drh2qyUh.mjs';
import { a as POST_INPUT_SCHEMA, b as POST_FRONTMATTER_SCHEMA } from '../../../../chunks/schemas_8vzO8d71.mjs';
import { serializePost } from '../../../../chunks/markdown_Dq9cX7aD.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
function githubErrorResponse(e) {
  if (e instanceof GitHubError) {
    return jsonError(e.message, e.kind, e.status);
  }
  const msg = e instanceof Error ? e.message : String(e);
  return jsonError(`服务器错误：${msg}`, "github_other", 500);
}
async function readOne({ slug }) {
  const found = await findPost(slug);
  if (!found) {
    return jsonError("文章不存在。", "github_not_found", 404);
  }
  let parsed = null;
  try {
    const { parseFrontmatter } = await import('../../../../chunks/markdown_Dq9cX7aD.mjs');
    const r = parseFrontmatter(found.info.content);
    parsed = { frontmatter: r.frontmatter, body: r.body };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(
      `frontmatter 解析失败：${msg}`,
      "schema_error",
      422
    );
  }
  return json({
    ok: true,
    slug,
    status: found.status,
    path: found.info.path,
    sha: found.info.sha,
    frontmatter: parsed.frontmatter,
    body: parsed.body
  });
}
async function update({
  oldSlug,
  body
}) {
  const parsed = POST_INPUT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      `数据校验失败：${parsed.error.issues.map((i) => i.message).join("; ")}`,
      "schema_error",
      422
    );
  }
  const input = parsed.data;
  const newSlug = input.slug;
  const newStatus = input.status ?? "published";
  const found = await findPost(oldSlug);
  if (!found) {
    return jsonError(
      "原文章不存在，无法更新。",
      "github_not_found",
      404
    );
  }
  const oldStatus = found.status;
  const oldSha = found.info.sha;
  const providedSha = input.existingSha;
  if (!providedSha) {
    return jsonError(
      "更新必须提供 existingSha。",
      "github_conflict",
      400
    );
  }
  if (providedSha !== oldSha) {
    return jsonError(
      "existingSha 已过期，请刷新后重试。",
      "github_conflict",
      409
    );
  }
  const slugChanged = newSlug !== oldSlug;
  const statusChanged = newStatus !== oldStatus;
  if (slugChanged) {
    const occ = await slugExists(newSlug);
    if (occ.exists) {
      return jsonError(
        `新 slug "${newSlug}" 已被占用（状态：${occ.status}）。`,
        "github_conflict",
        409
      );
    }
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
  const oldPath = postPath(oldSlug, oldStatus);
  const newPath = postPath(newSlug, newStatus);
  try {
    if (!slugChanged && !statusChanged) {
      const res2 = await createOrUpdateFile({
        path: newPath,
        content,
        message: COMMIT_MESSAGES.updatePost(newSlug),
        existingSha: providedSha
      });
      return json({
        ok: true,
        slug: newSlug,
        status: newStatus,
        path: res2.path,
        sha: res2.sha,
        commitSha: res2.commitSha,
        moved: false
      });
    }
    const message = slugChanged ? statusChanged ? COMMIT_MESSAGES.updatePost(`${oldSlug} → ${newStatus}/${newSlug}`) : COMMIT_MESSAGES.updatePost(`${oldSlug} → ${newSlug}`) : statusChanged ? newStatus === "published" ? COMMIT_MESSAGES.publishDraft(newSlug) : COMMIT_MESSAGES.unpublishToDraft(newSlug) : COMMIT_MESSAGES.updatePost(newSlug);
    const res = await commitMultipleFiles(
      [{ path: newPath, content }],
      message,
      { deletePaths: [oldPath] }
    );
    return json({
      ok: true,
      slug: newSlug,
      status: newStatus,
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
  slug,
  existingSha
}) {
  const found = await findPost(slug);
  if (!found) {
    return jsonError("文章不存在。", "github_not_found", 404);
  }
  if (!existingSha) {
    return jsonError("删除必须提供 existingSha。", "github_conflict", 400);
  }
  if (existingSha !== found.info.sha) {
    return jsonError(
      "existingSha 已过期，请刷新后重试。",
      "github_conflict",
      409
    );
  }
  try {
    const res = await deleteFile(
      found.info.path,
      COMMIT_MESSAGES.deletePost(slug),
      existingSha
    );
    return json({
      ok: true,
      slug,
      commitSha: res.commitSha
    });
  } catch (e) {
    return githubErrorResponse(e);
  }
}
const GET = withApiGuard({ auth: true, csrf: false }, async ({ ctx }) => {
  const slug = ctx.params.slug;
  if (!slug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);
  return await readOne({ slug });
});
const PUT = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    const oldSlug = ctx.params.slug;
    if (!oldSlug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);
    let body = null;
    try {
      body = await ctx.request.json();
    } catch {
      return jsonError("请求体格式错误。", "BAD_JSON", 400);
    }
    return await update({ oldSlug, body });
  }
);
const DELETE = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    const slug = ctx.params.slug;
    if (!slug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);
    const existingSha = ctx.url.searchParams.get("sha") || void 0;
    return await remove({ slug, existingSha });
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
