import { w as withApiGuard, j as json, a as jsonError } from '../../../chunks/api-guard_Bct9MpxU.mjs';
import { d as PREFIX_TOOLS, b as PREFIX_PROJECTS, e as PREFIX_RESOURCES, f as listRecentCommits, G as GitHubError } from '../../../chunks/github_P3asMU5M.mjs';
import { l as listAllPostFiles } from '../../../chunks/posts_Drh2qyUh.mjs';
import { l as listDataItems } from '../../../chunks/data-items_B9_6rzI-.mjs';
import { T as TOOL_SCHEMA, P as PROJECT_SCHEMA, R as RESOURCE_SCHEMA } from '../../../chunks/schemas_8vzO8d71.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = withApiGuard({ auth: true, csrf: false }, async () => {
  try {
    const [posts, tools, projects, resources, recentCommits] = await Promise.all([
      listAllPostFiles({ withMeta: false }),
      listDataItems(PREFIX_TOOLS, { schema: TOOL_SCHEMA }).catch(() => []),
      listDataItems(PREFIX_PROJECTS, { schema: PROJECT_SCHEMA }).catch(() => []),
      listDataItems(PREFIX_RESOURCES, { schema: RESOURCE_SCHEMA }).catch(() => []),
      listRecentCommits(10).catch(() => [])
    ]);
    const published = posts.filter((p) => p.status === "published").length;
    const draft = posts.filter((p) => p.status === "draft").length;
    return json({
      ok: true,
      posts: {
        published,
        draft,
        total: posts.length
      },
      tools: tools.length,
      projects: projects.length,
      resources: resources.length,
      recentCommits
    });
  } catch (e) {
    if (e instanceof GitHubError) {
      return jsonError(e.message, e.kind, e.status);
    }
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(`服务器错误：${msg}`, "github_other", 500);
  }
});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
