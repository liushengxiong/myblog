import { w as withApiGuard, j as json, a as jsonError } from '../../../chunks/api-guard_Bct9MpxU.mjs';
import { l as listFilesInFolder, h as PREFIX_IMAGE, G as GitHubError } from '../../../chunks/github_P3asMU5M.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
async function list() {
  try {
    const files = await listFilesInFolder(PREFIX_IMAGE, { recursive: true });
    const items = files.map((f) => {
      const relPath = f.path.slice(PREFIX_IMAGE.length);
      const slashIdx = relPath.indexOf("/");
      const date = slashIdx > 0 ? relPath.slice(0, slashIdx) : "";
      const publicUrl = `/${f.path.replace(/^public\//, "")}`;
      return {
        path: f.path,
        name: f.name,
        sha: f.sha,
        size: f.size,
        url: publicUrl,
        date
      };
    });
    items.sort((a, b) => {
      if (a.date !== b.date) return (b.date ?? "").localeCompare(a.date ?? "");
      return (b.name ?? "").localeCompare(a.name ?? "");
    });
    return json({ ok: true, items });
  } catch (e) {
    if (e instanceof GitHubError) {
      return jsonError(e.message, e.kind, e.status);
    }
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(`服务器错误：${msg}`, "github_other", 500);
  }
}
const GET = withApiGuard({ auth: true, csrf: false }, async () => {
  return await list();
});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
