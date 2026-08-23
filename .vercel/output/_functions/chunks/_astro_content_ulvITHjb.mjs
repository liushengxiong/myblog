import { Traverse } from 'neotraverse/modern';
import pLimit from 'p-limit';
import { r as removeBase, i as isCoreRemotePath, V as VALID_INPUT_FORMATS, A as AstroError, U as UnknownContentCollectionError, p as prependForwardSlash } from './astro/assets-service_DGOMzPV2.mjs';
import { a as createComponent, h as renderUniqueStylesheet, i as renderScriptElement, j as createHeadAndContent, f as renderComponent, r as renderTemplate, u as unescapeHTML } from './astro/server_sBzOckZg.mjs';
import 'kleur/colors';
import * as devalue from 'devalue';

const CONTENT_IMAGE_FLAG = "astroContentImageFlag";
const IMAGE_IMPORT_PREFIX = "__ASTRO_IMAGE_";

function imageSrcToImportId(imageSrc, filePath) {
  imageSrc = removeBase(imageSrc, IMAGE_IMPORT_PREFIX);
  if (isCoreRemotePath(imageSrc)) {
    return;
  }
  const ext = imageSrc.split(".").at(-1);
  if (!ext || !VALID_INPUT_FORMATS.includes(ext)) {
    return;
  }
  const params = new URLSearchParams(CONTENT_IMAGE_FLAG);
  if (filePath) {
    params.set("importer", filePath);
  }
  return `${imageSrc}?${params.toString()}`;
}

class DataStore {
  _collections = /* @__PURE__ */ new Map();
  constructor() {
    this._collections = /* @__PURE__ */ new Map();
  }
  get(collectionName, key) {
    return this._collections.get(collectionName)?.get(String(key));
  }
  entries(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.entries()];
  }
  values(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.values()];
  }
  keys(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.keys()];
  }
  has(collectionName, key) {
    const collection = this._collections.get(collectionName);
    if (collection) {
      return collection.has(String(key));
    }
    return false;
  }
  hasCollection(collectionName) {
    return this._collections.has(collectionName);
  }
  collections() {
    return this._collections;
  }
  /**
   * Attempts to load a DataStore from the virtual module.
   * This only works in Vite.
   */
  static async fromModule() {
    try {
      const data = await import('./_astro_data-layer-content_BcEe_9wP.mjs');
      if (data.default instanceof Map) {
        return DataStore.fromMap(data.default);
      }
      const map = devalue.unflatten(data.default);
      return DataStore.fromMap(map);
    } catch {
    }
    return new DataStore();
  }
  static async fromMap(data) {
    const store = new DataStore();
    store._collections = data;
    return store;
  }
}
function dataStoreSingleton() {
  let instance = void 0;
  return {
    get: async () => {
      if (!instance) {
        instance = DataStore.fromModule();
      }
      return instance;
    },
    set: (store) => {
      instance = store;
    }
  };
}
const globalDataStore = dataStoreSingleton();

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "https://liushengxiong.com", "SSR": true};
function createCollectionToGlobResultMap({
  globResult,
  contentDir
}) {
  const collectionToGlobResultMap = {};
  for (const key in globResult) {
    const keyRelativeToContentDir = key.replace(new RegExp(`^${contentDir}`), "");
    const segments = keyRelativeToContentDir.split("/");
    if (segments.length <= 1) continue;
    const collection = segments[0];
    collectionToGlobResultMap[collection] ??= {};
    collectionToGlobResultMap[collection][key] = globResult[key];
  }
  return collectionToGlobResultMap;
}
function createGetCollection({
  contentCollectionToEntryMap,
  dataCollectionToEntryMap,
  getRenderEntryImport,
  cacheEntriesByCollection
}) {
  return async function getCollection(collection, filter) {
    const hasFilter = typeof filter === "function";
    const store = await globalDataStore.get();
    let type;
    if (collection in contentCollectionToEntryMap) {
      type = "content";
    } else if (collection in dataCollectionToEntryMap) {
      type = "data";
    } else if (store.hasCollection(collection)) {
      const { default: imageAssetMap } = await import('./_astro_asset-imports_D9aVaOQr.mjs');
      const result = [];
      for (const rawEntry of store.values(collection)) {
        const data = updateImageReferencesInData(rawEntry.data, rawEntry.filePath, imageAssetMap);
        const entry = {
          ...rawEntry,
          data,
          collection
        };
        if (hasFilter && !filter(entry)) {
          continue;
        }
        result.push(entry);
      }
      return result;
    } else {
      console.warn(
        `The collection ${JSON.stringify(
          collection
        )} does not exist or is empty. Ensure a collection directory with this name exists.`
      );
      return [];
    }
    const lazyImports = Object.values(
      type === "content" ? contentCollectionToEntryMap[collection] : dataCollectionToEntryMap[collection]
    );
    let entries = [];
    if (!Object.assign(__vite_import_meta_env__, { Path: process.env.Path })?.DEV && cacheEntriesByCollection.has(collection)) {
      entries = cacheEntriesByCollection.get(collection);
    } else {
      const limit = pLimit(10);
      entries = await Promise.all(
        lazyImports.map(
          (lazyImport) => limit(async () => {
            const entry = await lazyImport();
            return type === "content" ? {
              id: entry.id,
              slug: entry.slug,
              body: entry.body,
              collection: entry.collection,
              data: entry.data,
              async render() {
                return render({
                  collection: entry.collection,
                  id: entry.id,
                  renderEntryImport: await getRenderEntryImport(collection, entry.slug)
                });
              }
            } : {
              id: entry.id,
              collection: entry.collection,
              data: entry.data
            };
          })
        )
      );
      cacheEntriesByCollection.set(collection, entries);
    }
    if (hasFilter) {
      return entries.filter(filter);
    } else {
      return entries.slice();
    }
  };
}
function updateImageReferencesInData(data, fileName, imageAssetMap) {
  return new Traverse(data).map(function(ctx, val) {
    if (typeof val === "string" && val.startsWith(IMAGE_IMPORT_PREFIX)) {
      const src = val.replace(IMAGE_IMPORT_PREFIX, "");
      const id = imageSrcToImportId(src, fileName);
      if (!id) {
        ctx.update(src);
        return;
      }
      const imported = imageAssetMap?.get(id);
      if (imported) {
        ctx.update(imported);
      } else {
        ctx.update(src);
      }
    }
  });
}
async function render({
  collection,
  id,
  renderEntryImport
}) {
  const UnexpectedRenderError = new AstroError({
    ...UnknownContentCollectionError,
    message: `Unexpected error while rendering ${String(collection)} → ${String(id)}.`
  });
  if (typeof renderEntryImport !== "function") throw UnexpectedRenderError;
  const baseMod = await renderEntryImport();
  if (baseMod == null || typeof baseMod !== "object") throw UnexpectedRenderError;
  const { default: defaultMod } = baseMod;
  if (isPropagatedAssetsModule(defaultMod)) {
    const { collectedStyles, collectedLinks, collectedScripts, getMod } = defaultMod;
    if (typeof getMod !== "function") throw UnexpectedRenderError;
    const propagationMod = await getMod();
    if (propagationMod == null || typeof propagationMod !== "object") throw UnexpectedRenderError;
    const Content = createComponent({
      factory(result, baseProps, slots) {
        let styles = "", links = "", scripts = "";
        if (Array.isArray(collectedStyles)) {
          styles = collectedStyles.map((style) => {
            return renderUniqueStylesheet(result, {
              type: "inline",
              content: style
            });
          }).join("");
        }
        if (Array.isArray(collectedLinks)) {
          links = collectedLinks.map((link) => {
            return renderUniqueStylesheet(result, {
              type: "external",
              src: prependForwardSlash(link)
            });
          }).join("");
        }
        if (Array.isArray(collectedScripts)) {
          scripts = collectedScripts.map((script) => renderScriptElement(script)).join("");
        }
        let props = baseProps;
        if (id.endsWith("mdx")) {
          props = {
            components: propagationMod.components ?? {},
            ...baseProps
          };
        }
        return createHeadAndContent(
          unescapeHTML(styles + links + scripts),
          renderTemplate`${renderComponent(
            result,
            "Content",
            propagationMod.Content,
            props,
            slots
          )}`
        );
      },
      propagation: "self"
    });
    return {
      Content,
      headings: propagationMod.getHeadings?.() ?? [],
      remarkPluginFrontmatter: propagationMod.frontmatter ?? {}
    };
  } else if (baseMod.Content && typeof baseMod.Content === "function") {
    return {
      Content: baseMod.Content,
      headings: baseMod.getHeadings?.() ?? [],
      remarkPluginFrontmatter: baseMod.frontmatter ?? {}
    };
  } else {
    throw UnexpectedRenderError;
  }
}
function isPropagatedAssetsModule(module) {
  return typeof module === "object" && module != null && "__astroPropagation" in module;
}

// astro-head-inject

const contentDir = '/src/content/';

const contentEntryGlob = /* #__PURE__ */ Object.assign({"/src/content/post/4-tian-gai-le-7-lun-zhong-yu-jiao-fu-le-2400-yuan-ai-shipin-shang-dan.md": () => import('./4-tian-gai-le-7-lun-zhong-yu-jiao-fu-le-2400-yuan-ai-shipin-shang-dan_C8bzpytA.mjs'),"/src/content/post/delivered-2400-yuan-ai-video-commission-after-7-revisions.md": () => import('./delivered-2400-yuan-ai-video-commission-after-7-revisions_CUY3aNB3.mjs'),"/src/content/post/opened-7-hong-kong-bank-cards-one-day.md": () => import('./opened-7-hong-kong-bank-cards-one-day_9WhIh1UN.mjs'),"/src/content/post/why-i-built-this-website-en.md": () => import('./why-i-built-this-website-en_CmI4rWYS.mjs'),"/src/content/post/why-i-built-this-website.md": () => import('./why-i-built-this-website_DIsUZGGX.mjs'),"/src/content/post/yi-tian-kai-tong-7-zhang-gang-qia.md": () => import('./yi-tian-kai-tong-7-zhang-gang-qia_CUXw6EuW.mjs')});
const contentCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: contentEntryGlob,
	contentDir,
});

const dataEntryGlob = /* #__PURE__ */ Object.assign({"/src/content/data/site-settings.json": () => import('./site-settings_BNtvDZCH.mjs'),"/src/content/projects/ai-workflow-lab.json": () => import('./ai-workflow-lab_DLXJi4HJ.mjs'),"/src/content/projects/content-creation-toolkit.json": () => import('./content-creation-toolkit_Cj0lWH5o.mjs'),"/src/content/projects/personal-knowledge-management-system.json": () => import('./personal-knowledge-management-system_Bd8LrdAW.mjs'),"/src/content/resources/ai-tools.json": () => import('./ai-tools_DzAv91zi.mjs'),"/src/content/resources/content-creation-resources.json": () => import('./content-creation-resources_DuP4XfNX.mjs'),"/src/content/resources/personal-growth-reading-list.json": () => import('./personal-growth-reading-list_CxwBtPtf.mjs')});
const dataCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: dataEntryGlob,
	contentDir,
});
createCollectionToGlobResultMap({
	globResult: { ...contentEntryGlob, ...dataEntryGlob },
	contentDir,
});

let lookupMap = {};
lookupMap = {"projects":{"type":"data","entries":{"ai-workflow-lab":"/src/content/projects/ai-workflow-lab.json","content-creation-toolkit":"/src/content/projects/content-creation-toolkit.json","personal-knowledge-management-system":"/src/content/projects/personal-knowledge-management-system.json"}},"data":{"type":"data","entries":{"site-settings":"/src/content/data/site-settings.json"}},"resources":{"type":"data","entries":{"ai-tools":"/src/content/resources/ai-tools.json","content-creation-resources":"/src/content/resources/content-creation-resources.json","personal-growth-reading-list":"/src/content/resources/personal-growth-reading-list.json"}},"post":{"type":"content","entries":{"why-i-built-this-website-en":"/src/content/post/why-i-built-this-website-en.md","delivered-2400-yuan-ai-video-commission-after-7-revisions":"/src/content/post/delivered-2400-yuan-ai-video-commission-after-7-revisions.md","4-tian-gai-le-7-lun-zhong-yu-jiao-fu-le-2400-yuan-ai-shipin-shang-dan":"/src/content/post/4-tian-gai-le-7-lun-zhong-yu-jiao-fu-le-2400-yuan-ai-shipin-shang-dan.md","why-i-built-this-website":"/src/content/post/why-i-built-this-website.md","yi-tian-kai-tong-7-zhang-gang-qia":"/src/content/post/yi-tian-kai-tong-7-zhang-gang-qia.md","opened-7-hong-kong-bank-cards-one-day":"/src/content/post/opened-7-hong-kong-bank-cards-one-day.md"}}};

new Set(Object.keys(lookupMap));

function createGlobLookup(glob) {
	return async (collection, lookupId) => {
		const filePath = lookupMap[collection]?.entries[lookupId];

		if (!filePath) return undefined;
		return glob[collection][filePath];
	};
}

const renderEntryGlob = /* #__PURE__ */ Object.assign({"/src/content/post/4-tian-gai-le-7-lun-zhong-yu-jiao-fu-le-2400-yuan-ai-shipin-shang-dan.md": () => import('./4-tian-gai-le-7-lun-zhong-yu-jiao-fu-le-2400-yuan-ai-shipin-shang-dan_Bc9lHLXi.mjs'),"/src/content/post/delivered-2400-yuan-ai-video-commission-after-7-revisions.md": () => import('./delivered-2400-yuan-ai-video-commission-after-7-revisions_YSrj1kH_.mjs'),"/src/content/post/opened-7-hong-kong-bank-cards-one-day.md": () => import('./opened-7-hong-kong-bank-cards-one-day_3fubVl2L.mjs'),"/src/content/post/why-i-built-this-website-en.md": () => import('./why-i-built-this-website-en_DCSBr6UQ.mjs'),"/src/content/post/why-i-built-this-website.md": () => import('./why-i-built-this-website_CFNK5NU0.mjs'),"/src/content/post/yi-tian-kai-tong-7-zhang-gang-qia.md": () => import('./yi-tian-kai-tong-7-zhang-gang-qia_B1Hr6ROX.mjs')});
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

const cacheEntriesByCollection = new Map();
const getCollection = createGetCollection({
	contentCollectionToEntryMap,
	dataCollectionToEntryMap,
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
	cacheEntriesByCollection,
});

export { getCollection as g };
