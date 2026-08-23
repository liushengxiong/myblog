/**
 * 极简 Markdown → HTML 渲染器（Admin 预览专用）。
 *
 * 设计依据：Spec v2 NFR-14 / AC-8（Preview 安全）。
 *
 * 安全策略（核心）：
 *  1. 先对所有原始文本做 HTML 转义（< > & " '），
 *     因此用户输入的 <script> / <img onerror=...> 会变成纯文本显示，
 *     不可能被执行。这是 XSS 防御的第一道屏障。
 *  2. 再在已转义文本上做 Markdown 语法替换，生成的标签全部由本文件控制，
 *     不接受任何用户提供的 HTML 标签。
 *  3. 最终在 Admin 端 iframe sandbox="allow-same-origin"（无 allow-scripts）
 *     中通过 srcdoc 渲染。即使本渲染器有遗漏，sandbox 也会阻止脚本执行。
 *
 * 支持语法子集（足够预览）：
 *  - 标题 # ~ ######
 *  - 段落 / 硬换行（单 \n）
 *  - 代码块 ```lang\ncode\n```
 *  - 行内代码 `code`
 *  - 粗体 **text** / __text__
 *  - 斜体 *text* / _text_
 *  - 链接 [text](url)（url 仅允许 http/https/mailto，否则丢弃 href）
 *  - 无序列表 - / *
 *  - 有序列表 1. 2.
 *  - 引用 >
 *  - 水平线 ---
 *
 * 不支持：表格、嵌套列表、HTML 内联、脚注、定义列表等。
 * 公开站渲染仍以 Astro 的 @astrojs/markdown-remark 为准；本文件仅用于 Admin 预览。
 */

const RAW_HTML_ESCAPE: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, (c) => RAW_HTML_ESCAPE[c] ?? c);
}

function escapeAttr(s: string): string {
	return escapeHtml(s);
}

/**
 * 校验 URL 是否安全（仅允许 http/https/mailto）。返回安全 URL 或空字符串。
 */
function safeUrl(raw: string): string {
	const u = raw.trim();
	if (!u) return "";
	if (/^mailto:/i.test(u)) return u;
	if (/^https?:\/\//i.test(u)) return u;
	// 相对路径（站点内）：允许 /
	if (u.startsWith("/") && !u.startsWith("//")) return u;
	return "";
}

/**
 * 行内转换：粗体 / 斜体 / 行内代码 / 链接。
 * 顺序很重要：先处理行内代码（避免其内部被其他规则二次处理）。
 */
function renderInline(text: string): string {
	// 用占位符提取行内代码，最后再还原
	const codes: string[] = [];
	let out = text.replace(/`([^`\n]+)`/g, (_m, code: string) => {
		const i = codes.length;
		codes.push(`<code>${escapeHtml(code)}</code>`);
		return `\u0000CODE${i}\u0000`;
	});

	// 粗体 **text** 或 __text__
	out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
	out = out.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
	// 斜体 *text* 或 _text_（单字符）
	out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
	out = out.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
	// 链接 [text](url)
	out = out.replace(
		/\[([^\]\n]+)\]\(([^)\n\s]+)\)/g,
		(_m, linkText: string, url: string) => {
			const safe = safeUrl(url);
			if (!safe) return escapeHtml(linkText);
			return `<a href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
				linkText,
			)}</a>`;
		},
	);

	// 还原行内代码占位符
	out = out.replace(/\u0000CODE(\d+)\u0000/g, (_m, i: string) => codes[Number(i)] ?? "");
	return out;
}

/**
 * 主渲染函数：输入 markdown 原始字符串，返回 HTML 字符串（不含 <html>/<body>）。
 */
export function renderMarkdown(md: string): string {
	if (!md) return "";
	// 统一换行符
	const src = md.replace(/\r\n?/g, "\n");

	// 1) 提取代码块（```），避免内部被其他规则处理
	const blocks: string[] = [];
	let text = src.replace(
		/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g,
		(_m, lang: string, code: string) => {
			const i = blocks.length;
			const langClass = lang ? ` class="language-${escapeAttr(lang)}"` : "";
			blocks.push(
				`<pre><code${langClass}>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`,
			);
			return `\u0000BLOCK${i}\u0000`;
		},
	);

	// 2) 转义剩余文本中的 HTML（代码块已在上面单独转义）
	// 但占位符 \u0000BLOCKn\u0000 不能被转义；先按占位符切分
	const parts = text.split(/(\u0000BLOCK\d+\u0000)/g);
	text = parts
		.map((p) => {
			if (/^\u0000BLOCK\d+\u0000$/.test(p)) return p;
			return escapeHtml(p);
		})
		.join("");

	// 3) 按行处理：标题 / 列表 / 引用 / 水平线 / 段落
	const lines = text.split("\n");
	const out: string[] = [];
	let para: string[] = [];
	let listType: "ul" | "ol" | null = null;
	let listItems: string[] = [];
	let quoteBuf: string[] = [];

	const flushPara = () => {
		if (para.length) {
			out.push(`<p>${renderInline(para.join("<br/>"))}</p>`);
			para = [];
		}
	};
	const flushList = () => {
		if (listType && listItems.length) {
			const tag = listType === "ul" ? "ul" : "ol";
			out.push(
				`<${tag}>${listItems
					.map((it) => `<li>${renderInline(it)}</li>`)
					.join("")}</${tag}>`,
			);
		}
		listType = null;
		listItems = [];
	};
	const flushQuote = () => {
		if (quoteBuf.length) {
			out.push(`<blockquote>${renderInline(quoteBuf.join(" "))}</blockquote>`);
			quoteBuf = [];
		}
	};
	const flushAll = () => {
		flushPara();
		flushList();
		flushQuote();
	};

	for (const rawLine of lines) {
		const line = rawLine;
		// 代码块占位符：原样输出
		if (/^\u0000BLOCK\d+\u0000$/.test(line)) {
			flushAll();
			const m = line.match(/BLOCK(\d+)/);
			if (m) out.push(blocks[Number(m[1])] ?? "");
			continue;
		}
		// 水平线
		if (/^\s*---+\s*$/.test(line) || /^\s*\*\*\*+\s*$/.test(line)) {
			flushAll();
			out.push("<hr/>");
			continue;
		}
		// 标题 # ~ ######
		const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
		if (h) {
			flushAll();
			const level = h[1].length;
			out.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
			continue;
		}
		// 引用 >
		const q = line.match(/^>\s?(.*)$/);
		if (q) {
			flushPara();
			flushList();
			quoteBuf.push(q[1]);
			continue;
		}
		// 无序列表 - / *
		const ul = line.match(/^[-*]\s+(.+)$/);
		if (ul) {
			flushPara();
			flushQuote();
			if (listType && listType !== "ul") flushList();
			listType = "ul";
			listItems.push(ul[1]);
			continue;
		}
		// 有序列表 1. 2.
		const ol = line.match(/^\d+\.\s+(.+)$/);
		if (ol) {
			flushPara();
			flushQuote();
			if (listType && listType !== "ol") flushList();
			listType = "ol";
			listItems.push(ol[1]);
			continue;
		}
		// 空行 → 段落分隔
		if (/^\s*$/.test(line)) {
			flushAll();
			continue;
		}
		// 普通行：累积到当前段落
		flushList();
		flushQuote();
		para.push(line);
	}
	flushAll();

	return out.join("\n");
}

/**
 * 用 iframe srcdoc 用的完整 HTML 文档包裹渲染结果。
 * 包含 prose 样式（简化版），深色模式自适应。
 */
export function wrapPreviewHtml(bodyHtml: string): string {
	return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    line-height: 1.7;
    padding: 1.5rem;
    color: #0f172a;
    background: #fff;
    margin: 0;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e2e8f0; background: #0f172a; }
    a { color: #93c5fd; }
    code, pre { background: #1e293b; }
  }
  h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.2em 0 0.6em; font-weight: 700; }
  h1 { font-size: 1.875rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  p, ul, ol, blockquote, pre { margin: 0.6em 0; }
  ul, ol { padding-left: 1.4em; }
  code { padding: 0.1em 0.3em; border-radius: 4px; background: #f1f5f9; font-size: 0.9em; }
  pre { padding: 0.8em 1em; border-radius: 8px; overflow-x: auto; }
  pre code { padding: 0; background: transparent; }
  blockquote { padding: 0.4em 1em; border-left: 3px solid #cbd5e1; color: #475569; }
  @media (prefers-color-scheme: dark) { blockquote { color: #94a3b8; border-color: #475569; } }
  a { color: #1d4ed8; text-decoration: underline; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 1.2em 0; }
  img { max-width: 100%; height: auto; border-radius: 12px; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
