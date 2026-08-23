import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
	output: "hybrid",
	adapter: vercel({
		// 保留默认：函数最大时长（Vercel Hobby: 10s, Pro: 60s）此处不覆盖
		// imageService 保持项目原有默认（不开启 @astrojs/vercel og）
	}),
	integrations: [tailwind()],
	vite: {
		ssr: {
			// 把 Admin 运行时依赖（如 jose）inline 到 serverless 函数 bundle，
			// 避免 @astrojs/vercel 在 Windows 非管理员权限下尝试创建 symlink
			// 时报 EPERM: operation not permitted, symlink。
			// 后续 Phase 新增的 Admin 运行时依赖（如 gray-matter、zod、octokit）
			// 也请追加到这个数组中。
			noExternal: ["jose"],
		},
	},
	i18n: {
		defaultLocale: "zh",
		locales: ["zh", "en"],
		routing: {
			prefixDefaultLocale: true,
		},
	},
	site: "https://liushengxiong.com",
});
