import { v as validateSlug, g as getFileInfo, P as PREFIX_DRAFT, a as PREFIX_POST, l as listFilesInFolder } from './github_P3asMU5M.mjs';

function postPath(slug, status) {
  const s = validateSlug(slug);
  return status === "draft" ? `${PREFIX_DRAFT}${s}.md` : `${PREFIX_POST}${s}.md`;
}
async function findPost(slug) {
  const s = validateSlug(slug);
  const draftPath = postPath(s, "draft");
  const publishedPath = postPath(s, "published");
  const draft = await getFileInfo(draftPath);
  if (draft) return { status: "draft", info: draft };
  const published = await getFileInfo(publishedPath);
  if (published) return { status: "published", info: published };
  return null;
}
async function listAllPostFiles(opts = {}) {
  const files = await listFilesInFolder(PREFIX_POST, { recursive: true });
  const out = [];
  for (const f of files) {
    if (!f.path.endsWith(".md")) continue;
    const rel = f.path.slice(PREFIX_POST.length);
    const isDraft = rel.startsWith("drafts/");
    const slug = isDraft ? rel.slice("drafts/".length).replace(/\.md$/, "") : rel.replace(/\.md$/, "");
    try {
      validateSlug(slug);
    } catch {
      continue;
    }
    const item = {
      slug,
      status: isDraft ? "draft" : "published",
      path: f.path,
      sha: f.sha
    };
    if (opts.withMeta) {
      const info = await getFileInfo(f.path);
      if (info) {
        try {
          const { parseFrontmatter } = await import('./markdown_E9sIpwGC.mjs');
          const r = parseFrontmatter(info.content);
          item.title = r.frontmatter.title;
          item.description = r.frontmatter.description;
          item.dateFormatted = r.frontmatter.dateFormatted;
          item.locale = r.frontmatter.locale;
          item.tags = r.frontmatter.tags;
          item.featured = r.frontmatter.featured;
        } catch {
        }
      }
    }
    out.push(item);
  }
  return out;
}
async function slugExists(slug) {
  const found = await findPost(slug);
  return found ? { exists: true, status: found.status } : { exists: false };
}

export { findPost as f, listAllPostFiles as l, postPath as p, slugExists as s };
