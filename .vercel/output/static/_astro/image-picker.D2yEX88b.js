let r=null,n=null,c=null,d=null;function b(){return window.AdminApi}function v(){if(r&&document.body.contains(r))return r;const e=document.createElement("div");e.className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.style.display="none",e.innerHTML=`
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
	`,document.body.appendChild(e),r=e;const t=()=>k();return e.querySelector("[data-picker-close]")?.addEventListener("click",t),e.querySelector("[data-picker-cancel]")?.addEventListener("click",t),e.addEventListener("click",a=>{a.target===e&&t()}),e.addEventListener("keydown",a=>{a.key==="Escape"&&t()}),e.querySelectorAll("[data-picker-tab]").forEach(a=>{a.addEventListener("click",()=>{const l=a.getAttribute("data-picker-tab");f(l==="upload"?"upload":"list")})}),e.querySelector("[data-picker-upload-btn]")?.addEventListener("click",g),e.querySelector("[data-picker-confirm]")?.addEventListener("click",h),e}function f(e){if(!r)return;r.querySelectorAll("[data-picker-tab]").forEach(l=>{const i=l.getAttribute("data-picker-tab")===e;l.className="px-5 py-3 text-xs font-medium border-b-2 "+(i?"border-slate-900 text-slate-700 dark:border-slate-100 dark:text-slate-200":"border-transparent text-slate-500 dark:text-slate-400")}),r.querySelectorAll("[data-picker-pane]").forEach(l=>{l.classList.toggle("hidden",l.getAttribute("data-picker-pane")!==e)}),e==="list"&&y()}async function g(){if(!r)return;const e=b(),t=r.querySelector("[data-picker-file]"),a=r.querySelector("[data-picker-upload-status]"),l=r.querySelector("[data-picker-preview-wrap]"),i=r.querySelector("[data-picker-preview]"),s=r.querySelector("[data-picker-upload-btn]");if(!t||!t.files||t.files.length===0){e.toast("请先选择文件。","warn");return}const m=t.files[0],u=new FormData;u.append("file",m),s?.setAttribute("disabled","true"),a&&(a.textContent="上传中…");try{const o=await e.fetch("/api/admin/images/upload",{method:"POST",body:u,headers:{}});o.ok&&o.url&&(a&&(a.textContent="✓ 上传成功"),i&&(i.src=o.url),l?.classList.remove("hidden"),x(o.url),e.toast("图片已上传并选中，点击「插入」确认。","success"))}catch{a&&(a.textContent="上传失败")}finally{s?.removeAttribute("disabled")}}async function y(){if(!r)return;const e=b(),t=r.querySelector("[data-picker-list-status]"),a=r.querySelector("[data-picker-grid]");if(a){a.innerHTML="",t&&(t.textContent="加载中…",t.classList.remove("hidden"));try{const l=await e.fetch("/api/admin/images");if(!l.ok||!l.items||l.items.length===0){t&&(t.textContent="暂无已上传图片。");return}t&&t.classList.add("hidden");for(const i of l.items){const s=document.createElement("button");s.type="button",s.className="group relative block aspect-square overflow-hidden rounded-lg border border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500",s.setAttribute("data-picker-item",i.url),s.innerHTML=`
				<img src="${i.url}" alt="${p(i.name)}" loading="lazy" class="h-full w-full object-cover" />
				<div class="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100">
					<div class="truncate">${p(i.name)}</div>
					<div class="text-slate-300">${p(i.date||"")} · ${S(i.size)}</div>
				</div>
			`,s.addEventListener("click",()=>x(i.url,s)),a.appendChild(s)}}catch{t&&(t.textContent="加载失败")}}}function x(e,t){if(c=e,r){const a=r.querySelector("[data-picker-selected-hint]"),l=r.querySelector("[data-picker-confirm]");a&&(a.textContent=`已选：${e}`,a.className="text-xs text-emerald-600 dark:text-emerald-400 break-all"),l?.removeAttribute("disabled"),l?.classList.remove("opacity-50","cursor-not-allowed")}d&&d.classList.remove("ring-2","ring-slate-900","dark:ring-slate-100"),t?(t.classList.add("ring-2","ring-slate-900","dark:ring-slate-100"),d=t):d=null}function h(){!c||!n||(n.onPick(c),k())}function k(){if(!r)return;r.style.display="none",c=null,d=null,n=null;const e=r.querySelector("[data-picker-file]");e&&(e.value=""),r.querySelector("[data-picker-preview-wrap]")?.classList.add("hidden");const a=r.querySelector("[data-picker-upload-status]");a&&(a.textContent="");const l=r.querySelector("[data-picker-confirm]");l?.setAttribute("disabled","true"),l?.classList.add("opacity-50","cursor-not-allowed");const i=r.querySelector("[data-picker-selected-hint]");i&&(i.textContent="未选择",i.className="text-xs text-slate-400")}function w(e){const t=v();n=e;const a=t.querySelector("[data-picker-title]");a&&e.title&&(a.textContent=e.title);const l=t.querySelector("[data-picker-confirm]");l&&e.confirmText&&(l.textContent=e.confirmText),f("upload"),t.style.display="flex"}function q(e){w(e)}function p(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function S(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/1024/1024).toFixed(1)} MB`}export{q as openImagePicker};
