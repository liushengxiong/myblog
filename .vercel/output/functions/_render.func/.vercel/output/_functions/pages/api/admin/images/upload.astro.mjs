import { w as withApiGuard, a as jsonError, j as json } from '../../../../chunks/api-guard_Bct9MpxU.mjs';
import { h as PREFIX_IMAGE, u as uploadBinaryImage, G as GitHubError } from '../../../../chunks/github_P3asMU5M.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};
const ALLOWED_MIMES = Object.keys(ALLOWED_MIME_TO_EXT);
function detectMime(bytes) {
  if (bytes.length < 4) return null;
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) {
    return "image/png";
  }
  if (bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 56 && (bytes[4] === 55 || bytes[4] === 57)) {
    return "image/gif";
  }
  if (bytes.length >= 12 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) {
    return "image/webp";
  }
  return null;
}
function randomHex(len) {
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function generateFileName(mime) {
  const ext = ALLOWED_MIME_TO_EXT[mime] ?? "bin";
  const ts = Date.now().toString(36);
  const rand = randomHex(6);
  return `${ts}-${rand}.${ext}`;
}
function todayISODate() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function upload({ ctx }) {
  const req = ctx.request;
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const cl = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(cl) && cl > MAX_BYTES) {
      return jsonError(
        `文件过大，最大允许 ${Math.floor(MAX_BYTES / 1024 / 1024)}MB。`,
        "file_too_large",
        413
      );
    }
  }
  let form;
  try {
    form = await req.formData();
  } catch {
    return jsonError(
      "请求体不是合法的 multipart/form-data。",
      "BAD_FORMDATA",
      400
    );
  }
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError('缺少 "file" 字段或不是文件。', "schema_error", 422);
  }
  if (file.size > MAX_BYTES) {
    return jsonError(
      `文件过大（${file.size} 字节），最大允许 ${Math.floor(MAX_BYTES / 1024 / 1024)}MB。`,
      "file_too_large",
      413
    );
  }
  if (file.size === 0) {
    return jsonError("文件为空。", "schema_error", 422);
  }
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const detectedMime = detectMime(bytes);
  if (!detectedMime || !ALLOWED_MIMES.includes(detectedMime)) {
    return jsonError(
      `不允许的文件类型（仅接受 ${ALLOWED_MIMES.join(" / ")}）。`,
      "invalid_mime",
      400
    );
  }
  const fileName = generateFileName(detectedMime);
  const today = todayISODate();
  const targetPath = `${PREFIX_IMAGE}${today}/${fileName}`;
  if (!targetPath.startsWith(PREFIX_IMAGE)) {
    return jsonError("目标路径非法。", "invalid_path", 400);
  }
  try {
    const res = await uploadBinaryImage(targetPath, bytes);
    const publicUrl = `/${targetPath.replace(/^public\//, "")}`;
    return json({
      ok: true,
      url: publicUrl,
      path: res.path,
      sha: res.sha,
      commitSha: res.commitSha,
      mime: detectedMime,
      size: file.size
    });
  } catch (e) {
    if (e instanceof GitHubError) {
      return jsonError(e.message, e.kind, e.status);
    }
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(`上传失败：${msg}`, "github_other", 500);
  }
}
const POST = withApiGuard(
  { auth: true, csrf: true },
  async ({ ctx }) => await upload({ ctx })
);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
