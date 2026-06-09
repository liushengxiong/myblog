# 刘盛雄个人网站 - 国际化架构文档

## 项目概述

这是一个支持中英文双语的个人品牌内容网站，基于 Astro 构建，采用静态生成方式，可部署到 Vercel。

## 国际化架构

### URL 结构

```
/zh/          # 中文站（默认）
/zh/posts/    # 中文文章列表
/zh/post/:slug # 中文文章详情
/zh/projects/ # 中文项目列表
/zh/about/    # 中文关于页面

/en/          # 英文站
/en/posts/    # 英文文章列表
/en/post/:slug # 英文文章详情
/en/projects/ # 英文项目列表
/en/about/    # 英文关于页面

/             # 根目录自动重定向到 /zh/
```

### 内容管理策略

#### 1. UI 文本国际化

**文件位置**: `src/i18n/ui.js`

包含所有界面文本的双语翻译，使用 key-value 结构：

```javascript
export const ui = {
  zh: {
    'site.title': '刘盛雄',
    'nav.home': '首页',
    // ...
  },
  en: {
    'site.title': 'Leo Liu',
    'nav.home': 'Home',
    // ...
  }
};
```

**使用方式**:
```javascript
import { useTranslations, getLangFromUrl } from '../i18n/ui.js';
const t = useTranslations(currentLang);
const title = t('site.title');
```

#### 2. 导航配置

**文件位置**: `src/i18n/navigation.js`

```javascript
export const navigation = {
  zh: [
    { name: '首页', url: '/zh/' },
    // ...
  ],
  en: [
    { name: 'Home', url: '/en/' },
    // ...
  ]
};
```

#### 3. 页面内容国际化

**文件位置**: `src/i18n/content.js`

包含 About 页面、Projects 等结构化内容的完整双语版本：

```javascript
export const aboutContent = {
  zh: { /* 中文内容 */ },
  en: { /* 英文内容 */ }
};
```

#### 4. 文章（Posts）国际化

**中文文章**: `src/content/post/*.md` (locale: zh 或不指定)
**英文文章**: `src/content/post/*-en.md` (locale: en)

文章 frontmatter 示例：
```yaml
---
title: "文章标题"
description: "文章描述"
dateFormatted: "June 9 2026"
locale: zh  # 或 en
tags: ["标签1", "标签2"]
featured: true
---
```

### 页面结构

```
src/pages/
├── index.astro           # 根目录重定向到 /zh/
├── zh/
│   ├── index.astro       # 中文首页
│   ├── posts.astro       # 中文文章列表
│   ├── projects.astro    # 中文项目列表
│   ├── about.astro       # 中文关于页面
│   └── post/
│       └── [slug].astro  # 中文文章详情
└── en/
    ├── index.astro       # 英文首页
    ├── posts.astro       # 英文文章列表
    ├── projects.astro    # 英文项目列表
    ├── about.astro       # 英文关于页面
    └── post/
        └── [slug].astro  # 英文文章详情
```

### 组件国际化

#### Header 组件
- 根据当前 URL 自动识别语言
- 显示对应语言的导航菜单
- 提供语言切换链接

#### Footer 组件
- 显示对应语言的版权信息
- 根据语言显示不同的社交媒体链接

#### PostsLoop 组件
- 接受 `lang` 参数过滤文章
- 只显示对应语言的文章

### SEO 配置

主布局 `src/layouts/main.astro` 自动处理：

1. **语言标签**: `<html lang={currentLang}>`
2. **Canonical URL**: `<link rel="canonical" href={canonicalUrl} />`
3. **Hreflang 标记**:
   ```html
   <link rel="alternate" hreflang="zh" href="..." />
   <link rel="alternate" hreflang="en" href="..." />
   <link rel="alternate" hreflang="x-default" href="..." />
   ```
4. **Open Graph**:
   - `og:locale`: zh_CN 或 en_US
   - `og:title`, `og:description`, `og:image`
5. **Twitter Card**: 完整的卡片元数据
6. **关键词**: 根据语言自动切换

## 内容工作流程

### 中文内容创建流程

1. 在 `src/content/post/` 创建新的 `.md` 文件
2. 设置 `locale: zh` (或省略，默认为中文)
3. 编写中文内容
4. 提交并部署

### 英文内容创建流程

**方案 A: 手动翻译**
1. 复制中文文章
2. 修改文件名为 `*-en.md`
3. 设置 `locale: en`
4. 翻译内容为英文

**方案 B: AI Agent 自动翻译 (推荐)**

创建一个自动化 workflow：

```javascript
// 伪代码示例
async function translatePost(zhPostPath) {
  // 1. 读取中文文章
  const zhContent = await readFile(zhPostPath);
  
  // 2. 使用 AI 翻译
  const enContent = await aiTranslate(zhContent, {
    source: 'zh',
    target: 'en',
    style: 'natural',  // 意译而非直译
    preserveFormatting: true
  });
  
  // 3. 生成英文文章
  const enPostPath = zhPostPath.replace('.md', '-en.md');
  await writeFile(enPostPath, enContent);
  
  // 4. 更新 frontmatter
  await updateFrontmatter(enPostPath, { locale: 'en' });
}
```

### 推荐的 AI 翻译 Prompt

```
请将以下中文博客文章翻译成英文。

要求：
1. 意译优先，不要逐字翻译
2. 保持专业但自然的英文表达风格
3. 保留所有 Markdown 格式（标题、列表、粗体等）
4. 适当调整表达方式以适应英文读者习惯
5. 保留人名、品牌名等专有名词的原文

原文：
[中文内容]
```

## Decap CMS 集成方案

### 配置步骤

1. **安装 Decap CMS**:
   ```bash
   npm install netlify-cms-app
   ```

2. **创建 CMS 配置文件** `public/admin/config.yml`:

```yaml
backend:
  name: git-gateway
  branch: main

media_folder: "public/assets/images"
public_folder: "/assets/images"

i18n:
  structure: multiple_files
  locales: [zh, en]
  default_locale: zh

collections:
  - name: "posts"
    label: "文章"
    folder: "src/content/post"
    create: true
    i18n: true
    fields:
      - { label: "标题", name: "title", widget: "string", i18n: true }
      - { label: "描述", name: "description", widget: "text", i18n: true }
      - { label: "日期", name: "dateFormatted", widget: "datetime", format: "MMMM D YYYY" }
      - { label: "语言", name: "locale", widget: "select", options: ["zh", "en"] }
      - { label: "标签", name: "tags", widget: "list", i18n: true }
      - { label: "精选", name: "featured", widget: "boolean", default: false }
      - { label: "内容", name: "body", widget: "markdown", i18n: true }
```

3. **创建 CMS 入口页面** `public/admin/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>内容管理</title>
</head>
<body>
  <script src="https://unpkg.com/netlify-cms-app@^2.0.0/dist/netlify-cms-app.js"></script>
  <script>
    CMS.init();
  </script>
</body>
</html>
```

### 使用流程

1. 访问 `https://yourdomain.com/admin/`
2. 登录并进入文章管理
3. 创建中文文章
4. 点击 "Translate" 按钮创建英文版本
5. 编辑英文内容（或使用 AI 辅助翻译）
6. 保存并发布

## 自动翻译 Agent Workflow

### 方案设计

```
┌─────────────────┐
│  中文文章发布    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  触发翻译任务    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  AI 翻译内容    │────▶│  人工审核       │
└─────────────────┘     └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                             ▼
            ┌──────────────┐            ┌──────────────┐
            │   通过       │            │   修改       │
            └──────┬───────┘            └──────┬───────┘
                   │                            │
                   ▼                            ▼
            ┌──────────────┐            ┌──────────────┐
            │  生成英文文章  │            │  重新翻译    │
            └──────┬───────┘            └──────────────┘
                   │
                   ▼
            ┌──────────────┐
            │  自动部署     │
            └──────────────┘
```

### GitHub Actions 实现示例

```yaml
# .github/workflows/translate.yml
name: Auto Translate Posts

on:
  push:
    paths:
      - 'src/content/post/*.md'
    branches: [main]

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm install
        
      - name: Run translation script
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: node scripts/translate-posts.js
        
      - name: Commit translations
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add src/content/post/
          git diff --staged --quiet || git commit -m "Auto-translate new posts"
          git push
```

### 翻译脚本示例

```javascript
// scripts/translate-posts.js
import { readdir, readFile, writeFile } from 'fs/promises';
import { parse } from 'yaml-front-matter';

async function translatePost(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const parsed = parse(content);
  
  // 检查是否已有英文版本
  const enPath = filePath.replace('.md', '-en.md');
  const files = await readdir('src/content/post');
  
  if (files.some(f => f.includes(enPath))) {
    console.log('English version already exists');
    return;
  }
  
  // 调用 AI API 翻译
  const translated = await callAITranslation(parsed);
  
  // 生成英文文章
  const enContent = `---
title: "${translated.title}"
description: "${translated.description}"
dateFormatted: "${parsed.dateFormatted}"
locale: en
tags: [${parsed.tags.map(t => `"${t}"`).join(', ')}]
featured: ${parsed.featured}
---

${translated.body}`;
  
  await writeFile(enPath, enContent);
  console.log(`Created: ${enPath}`);
}

// 主函数
async function main() {
  const files = await readdir('src/content/post');
  const zhPosts = files.filter(f => f.endsWith('.md') && !f.endsWith('-en.md'));
  
  for (const file of zhPosts) {
    await translatePost(`src/content/post/${file}`);
  }
}

main();
```

## 文件修改清单

### 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `astro.config.mjs` | 添加 i18n 配置 |
| `src/content/config.js` | 添加 locale、tags、featured 字段 |
| `src/layouts/main.astro` | 添加 SEO 元数据、语言切换 |
| `src/components/header.astro` | 支持双语导航、语言切换 |
| `src/components/footer.astro` | 支持双语版权信息 |
| `src/components/logo.astro` | 支持双语站点名称 |
| `src/components/posts-loop.astro` | 支持按语言过滤 |

### 新增的文件

| 文件 | 用途 |
|------|------|
| `src/i18n/ui.js` | UI 文本翻译 |
| `src/i18n/navigation.js` | 导航配置 |
| `src/i18n/content.js` | 页面内容翻译 |
| `src/pages/zh/index.astro` | 中文首页 |
| `src/pages/zh/posts.astro` | 中文文章列表 |
| `src/pages/zh/projects.astro` | 中文项目列表 |
| `src/pages/zh/about.astro` | 中文关于页面 |
| `src/pages/zh/post/[slug].astro` | 中文文章详情 |
| `src/pages/en/index.astro` | 英文首页 |
| `src/pages/en/posts.astro` | 英文文章列表 |
| `src/pages/en/projects.astro` | 英文项目列表 |
| `src/pages/en/about.astro` | 英文关于页面 |
| `src/pages/en/post/[slug].astro` | 英文文章详情 |
| `src/content/post/why-i-built-this-website.md` | 首篇中文文章 |
| `src/content/post/why-i-built-this-website-en.md` | 首篇英文文章 |

### 删除的文件

| 文件 | 原因 |
|------|------|
| `src/pages/index.astro` | 替换为重定向页面 |
| `src/pages/about.astro` | 迁移到双语结构 |
| `src/pages/posts.astro` | 迁移到双语结构 |
| `src/pages/projects.astro` | 迁移到双语结构 |
| `src/pages/post/[slug].astro` | 迁移到双语结构 |
| `src/content/post/*.md` (22个demo文件) | 清理 demo 内容 |

## 部署说明

### Vercel 部署

1. 连接 GitHub 仓库
2. 设置构建命令: `npm run build`
3. 设置输出目录: `dist`
4. 添加环境变量（如需要）:
   - `SITE_URL`: https://liushengxiong.com

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 后续优化建议

1. **搜索功能**: 添加 Algolia DocSearch 或 Pagefind
2. **RSS 订阅**: 为每种语言生成独立的 RSS feed
3. **评论系统**: 集成 Giscus (GitHub Discussions)
4. **分析**: 添加 Google Analytics 或 Plausible
5. **图片优化**: 使用 Astro 图片组件优化加载
6. **PWA**: 添加 Service Worker 支持离线阅读

## 技术栈

- **框架**: Astro 4.x
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **部署**: Vercel
- **CMS**: Decap CMS (可选)
- **翻译**: OpenAI API / Claude API (可选)