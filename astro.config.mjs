import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

export default defineConfig({
	adapter: vercel({
		// 保留默认：函数最大时长（Vercel Hobby: 10s, Pro: 60s）此处不覆盖
		// imageService 保持项目原有默认（不开启 @astrojs/vercel og）
	}),
	integrations: [tailwind()],
	vite: {
		ssr: {
			// 把 Admin 运行时依赖 inline 到 serverless 函数 bundle，
			// 避免 @astrojs/vercel 在 Windows 非管理员权限下尝试创建 symlink
			// 时报 EPERM: operation not permitted, symlink。
			// Phase 2 新增：@octokit/rest、gray-matter。
			noExternal: ["jose", "@octokit/rest", "gray-matter"],
		},
	},
	// 双语通过手动目录结构实现( src/pages/zh/、src/pages/en/ + frontmatter 的 locale 字段 )。
	// 不启用 Astro 内置 i18n 自动前缀，否则其中间件会对 /admin/* 等无语言前缀的页面返回 404。
	site: "https://liushengxiong.com",
});
