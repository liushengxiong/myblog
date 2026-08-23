import { w as withApiGuard, a as jsonError, j as json } from '../../../../../chunks/api-guard_Bct9MpxU.mjs';
import { j as commitMultipleFiles, C as COMMIT_MESSAGES, G as GitHubError } from '../../../../../chunks/github_P3asMU5M.mjs';
import { f as findPost, p as postPath } from '../../../../../chunks/posts_Drh2qyUh.mjs';
export { renderers } from '../../../../../renderers.mjs';

const prerender = false;
function githubErrorResponse(e) {
  if (e instanceof GitHubError) {
    return jsonError(e.message, e.kind, e.status);
  }
  const msg = e instanceof Error ? e.message : String(e);
  return jsonError(`服务器错误：${msg}`, "github_other", 500);
}
const POST = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => {
    const slug = ctx.params.slug;
    if (!slug) return jsonError("缺少 slug。", "BAD_REQUEST", 400);
    const found = await findPost(slug);
    if (!found) {
      return jsonError("草稿不存在。", "github_not_found", 404);
    }
    if (found.status !== "draft") {
      return jsonError(
        "该文章已是已发布状态，无需再发布。",
        "github_conflict",
        409
      );
    }
    let providedSha = void 0;
    try {
      const body = await ctx.request.json();
      providedSha = body?.existingSha;
    } catch {
    }
    if (providedSha && providedSha !== found.info.sha) {
      return jsonError(
        "existingSha 已过期，请刷新后重试。",
        "github_conflict",
        409
      );
    }
    const oldPath = postPath(slug, "draft");
    const newPath = postPath(slug, "published");
    const content = found.info.content;
    try {
      const res = await commitMultipleFiles(
        [{ path: newPath, content }],
        COMMIT_MESSAGES.publishDraft(slug),
        { deletePaths: [oldPath] }
      );
      return json({
        ok: true,
        slug,
        status: "published",
        path: newPath,
        sha: res.files[0]?.sha ?? "",
        commitSha: res.commitSha,
        moved: true
      });
    } catch (e) {
      return githubErrorResponse(e);
    }
  }
);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
