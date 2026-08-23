/**
 * 图片选择器 Modal（Phase 8 Task 8.1 UI 部分）
 *
 * 用法：
 *   import { openImagePicker } from "./image-picker";
 *   openImagePicker({ onPick: (url) => { console.log("selected:", url); } });
 *
 * 功能：
 *  - 两个 Tab：「上传新图片」「从已上传选择」
 *  - 上传：multipart/form-data → POST /api/admin/images/upload（自动带 CSRF）
 *  - 列表：GET /api/admin/images（递归列出 uploads/ 下所有图片）
 *  - 选择后调用 onPick(url)，并自动关闭 modal
 *
 * 设计：
 *  - 纯原生 TS，零依赖（不引入 React/Vue）
 *  - modal 是单个全局实例（避免重复创建 DOM）
 *  - 全部中文 UI
 *  - 不可外逃：onPick 只返回 /assets/images/uploads/... 路径（来自服务端）
 */
type AdminApi = {
	fetch: <T = unknown>(
		input: RequestInfo,
		init?: RequestInit & { expectCsrf?: boolean },
	) => Promise<T>;
	toast: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
};

type ImageItem = {
	path: string;
	name: string;
	sha: string;
	size: number;
	url: string;
	date: string;
};

type ListResponse = { ok: boolean; items: ImageItem[] };
type UploadResponse = {
	ok: boolean;
	url: string;
	path: string;
	sha: string;
	commitSha: string;
	mime: string;
	size: number;
};

type PickerOptions = {
	onPick: (url: string) => void;
	/** 标题，默认"选择图片" */
	title?: string;
	/** 提交按钮文案，默认"插入" */
	confirmText?: string;
};

let _modal: HTMLElement | null = null;
let _currentOptions: PickerOptions | null = null;
let _selectedUrl: string | null = null;
let _selectedThumb: HTMLElement | null = null;

function getApi(): AdminApi {
	return (window as unknown as { AdminApi: AdminApi }).AdminApi;
}

function ensureModal(): HTMLElement {
	if (_modal && document.body.contains(_modal)) return _modal;
	const root = document.createElement("div");
	root.className =
		"fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm";
	root.setAttribute("role", "dialog");
	root.setAttribute("aria-modal", "true");
	root.style.display = "none";
	root.innerHTML = `
		<div class="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
				<h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100" data-picker-title>选择图片</h3>
				<button type="button" data-picker-close class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
			</div>
			<!-- Tabs -->
			<div class="flex border-b border-slate-100 dark:border-slate-800">
				<button type="button" data-picker-tab="upload" class="px-5 py-3 text-xs font-medium text-slate-700 border-b-2 border-slate-900 dark:text-slate-200 dark:border-slate-100">上传新图片</button>
				<button type="button" data-picker-tab="list" class="px-5 py-3 text-xs font-medium text-slate-500 border-b-2 border-transparent dark:text-slate-400">从已上传选择</button>
			</div>
			<!-- Body -->
			<div class="p-6 max-h-[60vh] overflow-y-auto">
				<!-- Upload pane -->
				<div data-picker-pane="upload" class="space-y-4">
					<div class="rounded-lg border border-dashed border-slate-300 p-6 dark:border-slate-700">
						<p class="text-xs text-slate-500 dark:text-slate-400">支持 JPG / PNG / WebP / GIF，最大 5MB。服务端会重新生成文件名（不信任客户端）。</p>
						<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-picker-file
							class="mt-3 block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700 dark:text-slate-200 dark:file:bg-slate-100 dark:file:text-slate-900" />
						<div class="mt-3 flex items-center gap-3">
							<button type="button" data-picker-upload-btn class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">开始上传</button>
							<span data-picker-upload-status class="text-xs text-slate-500 dark:text-slate-400"></span>
						</div>
					</div>
					<div data-picker-preview-wrap class="hidden">
						<p class="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">预览：</p>
						<img data-picker-preview class="max-h-64 rounded-lg border border-slate-200 dark:border-slate-700" alt="预览" />
					</div>
				</div>
				<!-- List pane -->
				<div data-picker-pane="list" class="hidden">
					<div data-picker-list-status class="text-xs text-slate-400">加载中…</div>
					<div data-picker-grid class="grid grid-cols-3 md:grid-cols-4 gap-3"></div>
				</div>
			</div>
			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
				<span data-picker-selected-hint class="text-xs text-slate-400">未选择</span>
				<div class="flex items-center gap-2">
					<button type="button" data-picker-cancel class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">取消</button>
					<button type="button" data-picker-confirm disabled class="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white opacity-50 cursor-not-allowed dark:bg-white dark:text-slate-900">插入</button>
				</div>
			</div>
		</div>
	`;
	document.body.appendChild(root);
	_modal = root;

	// 绑定事件
	const close = () => hideModal();
	root.querySelector("[data-picker-close]")?.addEventListener("click", close);
	root.querySelector("[data-picker-cancel]")?.addEventListener("click", close);
	// 点击 backdrop 关闭
	root.addEventListener("click", (e) => {
		if (e.target === root) close();
	});
	// ESC 关闭
	root.addEventListener("keydown", (e) => {
		if (e.key === "Escape") close();
	});
	// Tab 切换
	root.querySelectorAll<HTMLButtonElement>("[data-picker-tab]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const tab = btn.getAttribute("data-picker-tab");
			switchTab(tab === "upload" ? "upload" : "list");
		});
	});
	// 上传
	root
		.querySelector<HTMLButtonElement>("[data-picker-upload-btn]")
		?.addEventListener("click", handleUpload);
	// 确认
	root
		.querySelector<HTMLButtonElement>("[data-picker-confirm]")
		?.addEventListener("click", handleConfirm);

	return root;
}

function switchTab(tab: "upload" | "list"): void {
	if (!_modal) return;
	const tabs = _modal.querySelectorAll<HTMLButtonElement>("[data-picker-tab]");
	tabs.forEach((btn) => {
		const isActive = btn.getAttribute("data-picker-tab") === tab;
		btn.className =
			"px-5 py-3 text-xs font-medium border-b-2 " +
			(isActive
				? "border-slate-900 text-slate-700 dark:border-slate-100 dark:text-slate-200"
				: "border-transparent text-slate-500 dark:text-slate-400");
	});
	const panes = _modal.querySelectorAll<HTMLElement>("[data-picker-pane]");
	panes.forEach((p) => {
		p.classList.toggle("hidden", p.getAttribute("data-picker-pane") !== tab);
	});
	if (tab === "list") {
		void loadList();
	}
}

async function handleUpload(): Promise<void> {
	if (!_modal) return;
	const api = getApi();
	const fileInput =
		_modal.querySelector<HTMLInputElement>("[data-picker-file]");
	const statusEl =
		_modal.querySelector<HTMLElement>("[data-picker-upload-status]");
	const previewWrap = _modal.querySelector<HTMLElement>("[data-picker-preview-wrap]");
	const previewImg = _modal.querySelector<HTMLImageElement>("[data-picker-preview]");
	const uploadBtn = _modal.querySelector<HTMLButtonElement>("[data-picker-upload-btn]");
	if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
		api.toast("请先选择文件。", "warn");
		return;
	}
	const file = fileInput.files[0];
	const fd = new FormData();
	fd.append("file", file);

	uploadBtn?.setAttribute("disabled", "true");
	if (statusEl) statusEl.textContent = "上传中…";
	try {
		// 注意：fetch 包装器会自动设 Content-Type=application/json，需要 override
		const res = await api.fetch<UploadResponse>("/api/admin/images/upload", {
			method: "POST",
			body: fd,
			// FormData 不能手动设 content-type（浏览器会自动设 multipart boundary）
			headers: {},
		});
		if (res.ok && res.url) {
			if (statusEl) statusEl.textContent = "✓ 上传成功";
			// 显示预览
			if (previewImg) previewImg.src = res.url;
			previewWrap?.classList.remove("hidden");
			// 自动选中刚上传的
			setSelected(res.url);
			api.toast("图片已上传并选中，点击「插入」确认。", "success");
		}
	} catch {
		if (statusEl) statusEl.textContent = "上传失败";
	} finally {
		uploadBtn?.removeAttribute("disabled");
	}
}

async function loadList(): Promise<void> {
	if (!_modal) return;
	const api = getApi();
	const statusEl = _modal.querySelector<HTMLElement>("[data-picker-list-status]");
	const grid = _modal.querySelector<HTMLElement>("[data-picker-grid]");
	if (!grid) return;
	grid.innerHTML = "";
	if (statusEl) {
		statusEl.textContent = "加载中…";
		statusEl.classList.remove("hidden");
	}
	try {
		const res = await api.fetch<ListResponse>("/api/admin/images");
		if (!res.ok || !res.items || res.items.length === 0) {
			if (statusEl) statusEl.textContent = "暂无已上传图片。";
			return;
		}
		if (statusEl) statusEl.classList.add("hidden");
		for (const item of res.items) {
			const cell = document.createElement("button");
			cell.type = "button";
			cell.className =
				"group relative block aspect-square overflow-hidden rounded-lg border border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500";
			cell.setAttribute("data-picker-item", item.url);
			cell.innerHTML = `
				<img src="${item.url}" alt="${escapeHtml(item.name)}" loading="lazy" class="h-full w-full object-cover" />
				<div class="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100">
					<div class="truncate">${escapeHtml(item.name)}</div>
					<div class="text-slate-300">${escapeHtml(item.date || "")} · ${formatSize(item.size)}</div>
				</div>
			`;
			cell.addEventListener("click", () => setSelected(item.url, cell));
			grid.appendChild(cell);
		}
	} catch {
		if (statusEl) statusEl.textContent = "加载失败";
	}
}

function setSelected(url: string, thumbEl?: HTMLElement): void {
	_selectedUrl = url;
	if (_modal) {
		const hint = _modal.querySelector<HTMLElement>("[data-picker-selected-hint]");
		const confirmBtn =
			_modal.querySelector<HTMLButtonElement>("[data-picker-confirm]");
		if (hint) {
			hint.textContent = `已选：${url}`;
			hint.className = "text-xs text-emerald-600 dark:text-emerald-400 break-all";
		}
		confirmBtn?.removeAttribute("disabled");
		confirmBtn?.classList.remove("opacity-50", "cursor-not-allowed");
	}
	// 清除上一选中
	if (_selectedThumb) {
		_selectedThumb.classList.remove(
			"ring-2",
			"ring-slate-900",
			"dark:ring-slate-100",
		);
	}
	if (thumbEl) {
		thumbEl.classList.add("ring-2", "ring-slate-900", "dark:ring-slate-100");
		_selectedThumb = thumbEl;
	} else {
		_selectedThumb = null;
	}
}

function handleConfirm(): void {
	if (!_selectedUrl || !_currentOptions) return;
	_currentOptions.onPick(_selectedUrl);
	hideModal();
}

function hideModal(): void {
	if (!_modal) return;
	_modal.style.display = "none";
	// 清理状态
	_selectedUrl = null;
	_selectedThumb = null;
	_currentOptions = null;
	// 重置上传 tab
	const fileInput = _modal.querySelector<HTMLInputElement>("[data-picker-file]");
	if (fileInput) fileInput.value = "";
	const previewWrap = _modal.querySelector<HTMLElement>("[data-picker-preview-wrap]");
	previewWrap?.classList.add("hidden");
	const statusEl = _modal.querySelector<HTMLElement>("[data-picker-upload-status]");
	if (statusEl) statusEl.textContent = "";
	const confirmBtn = _modal.querySelector<HTMLButtonElement>("[data-picker-confirm]");
	confirmBtn?.setAttribute("disabled", "true");
	confirmBtn?.classList.add("opacity-50", "cursor-not-allowed");
	const hint = _modal.querySelector<HTMLElement>("[data-picker-selected-hint]");
	if (hint) {
		hint.textContent = "未选择";
		hint.className = "text-xs text-slate-400";
	}
}

function showModal(opts: PickerOptions): void {
	const modal = ensureModal();
	_currentOptions = opts;
	const titleEl = modal.querySelector<HTMLElement>("[data-picker-title]");
	if (titleEl && opts.title) titleEl.textContent = opts.title;
	const confirmBtn = modal.querySelector<HTMLButtonElement>("[data-picker-confirm]");
	if (confirmBtn && opts.confirmText) confirmBtn.textContent = opts.confirmText;
	// 重置到 upload tab
	switchTab("upload");
	modal.style.display = "flex";
}

export function openImagePicker(opts: PickerOptions): void {
	showModal(opts);
}

// ====== helpers ======

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function formatSize(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export type { PickerOptions };
