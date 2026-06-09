export const ui = {
  zh: {
    'site.title': '刘盛雄',
    'site.description': 'AI时代个人成长与商业探索',
    'site.author': '刘盛雄',
    'nav.home': '首页',
    'nav.posts': '文章',
    'nav.projects': '项目',
    'nav.about': '关于',
    'home.title': '刘盛雄',
    'home.subtitle': 'AI时代个人成长与商业探索',
    'home.intro': '拥有10年以上市场与运营经验，上海交通大学 MBA & MEM。这里记录我对 AI、个人成长、商业模式和内容创业的思考与实践。',
    'home.latestPosts': '最新文章',
    'home.featuredPosts': '精选文章',
    'home.resources': '推荐资源',
    'home.viewAllPosts': '查看全部文章',
    'home.viewAllProjects': '查看全部项目',
    'posts.title': '文章',
    'posts.description': '记录我在 AI、个人成长、商业模式和内容创业领域的思考与实践。',
    'projects.title': '项目',
    'projects.description': '我正在探索和构建的项目，聚焦 AI 工具、内容创作与个人商业系统。',
    'about.title': '关于我',
    'about.description': '了解我的背景、经历以及为什么创建这个网站。',
    'about.shortBio': '个人简介',
    'about.education': '教育背景',
    'about.experience': '工作经历',
    'about.whyAI': '为什么研究 AI',
    'about.whyWebsite': '为什么做这个网站',
    'about.futurePlans': '未来计划',
    'about.connect': '联系我',
    'footer.copyright': '© {year} 刘盛雄. 保留所有权利。',
    'post.publishedOn': '发布于',
    'post.readMore': '阅读更多',
    'lang.switch': 'English',
  },
  en: {
    'site.title': 'Leo Liu',
    'site.description': 'Personal Growth & Business Exploration in the Age of AI',
    'site.author': 'Leo Liu',
    'nav.home': 'Home',
    'nav.posts': 'Posts',
    'nav.projects': 'Projects',
    'nav.about': 'About',
    'home.title': 'Leo Liu',
    'home.subtitle': 'Personal Growth & Business Exploration in the Age of AI',
    'home.intro': '10+ years of experience in marketing and operations, MBA & MEM from Shanghai Jiao Tong University. This site documents my exploration of AI, personal growth, business models, and content creation.',
    'home.latestPosts': 'Latest Posts',
    'home.featuredPosts': 'Featured Posts',
    'home.resources': 'Resources',
    'home.viewAllPosts': 'View All Posts',
    'home.viewAllProjects': 'View All Projects',
    'posts.title': 'Posts',
    'posts.description': 'My thoughts and practices on AI, personal growth, business models, and content creation.',
    'projects.title': 'Projects',
    'projects.description': 'Projects I am exploring and building, focusing on AI tools, content creation, and personal business systems.',
    'about.title': 'About Me',
    'about.description': 'Learn about my background, experience, and why I created this website.',
    'about.shortBio': 'Short Bio',
    'about.education': 'Education',
    'about.experience': 'Experience',
    'about.whyAI': 'Why AI',
    'about.whyWebsite': 'Why This Website',
    'about.futurePlans': 'Future Plans',
    'about.connect': 'Connect',
    'footer.copyright': '© {year} Leo Liu. All rights reserved.',
    'post.publishedOn': 'Published on',
    'post.readMore': 'Read more',
    'lang.switch': '中文',
  },
};

export function useTranslations(lang) {
  return function t(key, replacements = {}) {
    let text = ui[lang]?.[key] || ui['zh'][key] || key;
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  };
}

export function getLangFromUrl(url) {
  const [, lang] = url.pathname.split('/');
  if (lang === 'en') return 'en';
  return 'zh';
}

export function getRouteFromUrl(url) {
  const parts = url.pathname.split('/');
  if (parts[1] === 'zh' || parts[1] === 'en') {
    return '/' + parts.slice(2).join('/');
  }
  return url.pathname;
}
