/**
 * 博客文章转换脚本
 * 将 Markdown 文件转换为 HTML
 * 
 * 使用方法：
 * 1. 将 Markdown 文件放到 posts/ 目录
 * 2. 运行 node convert.js
 * 3. 文章会自动添加到 index.html
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_HTML = path.join(__dirname, 'index.html');

// 文章元数据提取
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        return { metadata: {}, content: content };
    }
    
    const frontmatter = match[1];
    const metadata = {};
    
    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // 处理数组
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
            }
            
            metadata[key] = value;
        }
    });
    
    return {
        metadata,
        content: content.substring(match[0].length)
    };
}

// 简单的 Markdown 解析
function parseMarkdown(text) {
    let html = text
        // 代码块
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>\n')
        // 引用块
        .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
        // 标题
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>\n')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>\n')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>\n')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>\n')
        // 粗体和斜体
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // 删除线
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        // 行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 图片
        .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
        // 链接
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        // 水平线
        .replace(/^---$/gm, '<hr>')
        // 无序列表
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // 有序列表
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // 换行
        .replace(/\n/g, '<br>\n');
    
    // 包装列表
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
    
    return html;
}

// 生成文章卡片 HTML
function generateArticleCard(article, index) {
    const iconMap = {
        'frontend': 'fa-brands fa-react',
        'backend': 'fa-brands fa-node-js',
        'devops': 'fa-brands fa-docker',
        'tool': 'fa-solid fa-screwdriver-wrench',
        'thoughts': 'fa-solid fa-lightbulb'
    };
    
    const tags = Array.isArray(article.tags) ? article.tags.join(',') : '';
    
    return `
                <article class="article-card" data-category="${article.category}" style="animation-delay: ${(index + 1) * 0.1}s">
                    <div class="article-card-image">
                        <i class="${iconMap[article.category] || 'fa-solid fa-file-lines'}"></i>
                    </div>
                    <div class="article-card-content">
                        <div class="article-card-meta">
                            <span><i class="far fa-clock"></i> ${article.readingTime} 分钟</span>
                        </div>
                        <span class="article-card-category">
                            <i class="fas fa-folder"></i>
                            ${article.categoryName}
                        </span>
                        <h2><a href="article.html?id=${article.id}">${article.title}</a></h2>
                        <p class="article-card-excerpt">${article.excerpt}</p>
                        <div class="article-card-footer">
                            <span class="article-card-date">
                                <i class="far fa-calendar"></i>
                                ${article.date}
                            </span>
                            <a href="article.html?id=${article.id}" class="article-card-readmore">
                                阅读全文 <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </article>`;
}

// 读取所有文章
function loadArticles() {
    // 如果 posts 目录不存在，创建它
    if (!fs.existsSync(POSTS_DIR)) {
        fs.mkdirSync(POSTS_DIR, { recursive: true });
        console.log('已创建 posts 目录');
        
        // 创建示例文章
        const samplePost = `---
title: 第一篇博客文章
date: 2026-03-19
category: frontend
categoryName: 前端
tags: [JavaScript, React]
readingTime: 5
excerpt: 这是我的第一篇博客文章，欢迎阅读！
---

## 欢迎阅读

这是一篇示例博客文章。你可以在 posts/ 目录下创建更多 Markdown 文件。

### 代码示例

\`\`\`javascript
function hello() {
    console.log('Hello, World!');
}
\`\`\`

### 功能特点

- 简洁的界面设计
- Markdown 支持
- 响应式布局
- 快速加载

> 持续学习，共同进步！
`;
        
        fs.writeFileSync(path.join(POSTS_DIR, 'first-post.md'), samplePost);
        console.log('已创建示例文章 first-post.md');
    }
    
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    const articles = [];
    
    files.forEach((file, index) => {
        const filePath = path.join(POSTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { metadata, content: markdownContent } = parseFrontmatter(content);
        
        const id = index + 1;
        const slug = file.replace('.md', '');
        
        articles.push({
            id,
            title: metadata.title || '无标题',
            date: metadata.date || new Date().toISOString().split('T')[0],
            category: metadata.category || 'thoughts',
            categoryName: metadata.categoryName || '随想',
            tags: metadata.tags || [],
            readingTime: parseInt(metadata.readingTime) || 5,
            excerpt: metadata.excerpt || markdownContent.substring(0, 100) + '...',
            icon: metadata.icon || 'fa-solid fa-file-lines',
            content: parseMarkdown(markdownContent)
        });
    });
    
    // 按日期排序
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 重新分配 ID
    articles.forEach((article, index) => {
        article.id = index + 1;
    });
    
    return articles;
}

// 生成 index.html
function generateIndex(articles) {
    const articlesGrid = articles.map((article, index) => generateArticleCard(article, index)).join('\n');
    
    // 统计
    const totalTags = new Set();
    articles.forEach(a => {
        if (Array.isArray(a.tags)) {
            a.tags.forEach(t => totalTags.add(t));
        }
    });
    
    const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的技术博客</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="index.html" class="nav-logo">
                <div class="nav-logo-icon">
                    <i class="fas fa-pen-nib"></i>
                </div>
                <span>技术随笔</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="index.html" class="active">首页</a></li>
                <li class="dropdown">
                    <a href="#">MC 教程 <i class="fas fa-chevron-down" style="font-size: 0.75em; margin-left: 4px;"></i></a>
                    <div class="dropdown-content">
                        <a href="website/index.html">教程首页</a>
                        <a href="website/catalog.html">全部目录</a>
                        <a href="website/tutorials/Part-0-Prerequisites/00-course-overview.html">Part-0 前置知识</a>
                        <a href="website/tutorials/Part-1-Foundation/04-registry-system.html">Part-1 核心基础</a>
                        <a href="website/tutorials/Part-2-World/09-chunk-system.html">Part-2 世界系统</a>
                        <a href="website/tutorials/Part-5-AI/27-ai-brain-intro.html">Part-5 AI系统</a>
                    </div>
                </li>
                <li><a href="#articles">文章</a></li>
                <li><a href="#about">关于</a></li>
                <li><a href="#contact">联系</a></li>
            </ul>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-bg">
            <div class="hero-grid"></div>
            <div class="hero-gradient hero-gradient-1"></div>
            <div class="hero-gradient hero-gradient-2"></div>
        </div>
        <div class="hero-content">
            <div class="hero-badge">
                <i class="fas fa-code"></i>
                技术分享与个人成长
            </div>
            <h1>探索技术的边界</h1>
            <p class="hero-subtitle">
                记录学习历程，分享技术心得。<br>
                从源码解析到工程实践，这里有我对技术的思考。
            </p>
            <div class="hero-meta">
                <span class="hero-stat">
                    <i class="fas fa-newspaper"></i>
                    <span id="article-count">${articles.length}</span> 篇文章
                </span>
                <span class="hero-stat">
                    <i class="fas fa-tag"></i>
                    <span id="tag-count">${totalTags.size}</span> 个标签
                </span>
            </div>
        </div>
    </header>

    <section class="articles-section" id="articles">
        <div class="container">
            <div class="search-box">
                <i class="fas fa-search search-icon"></i>
                <input type="text" class="search-input" placeholder="搜索文章..." oninput="searchArticles(this.value)">
            </div>
            
            <div class="category-filter">
                <button class="category-btn active" onclick="filterArticles('all')">全部</button>
                <button class="category-btn" onclick="filterArticles('frontend')">前端</button>
                <button class="category-btn" onclick="filterArticles('backend')">后端</button>
                <button class="category-btn" onclick="filterArticles('devops')">DevOps</button>
                <button class="category-btn" onclick="filterArticles('tool')">工具</button>
                <button class="category-btn" onclick="filterArticles('thoughts')">随想</button>
            </div>

            <div class="articles-grid" id="articles-grid">
${articlesGrid}
            </div>
            ${articles.length === 0 ? `
            <div class="empty-state">
                <i class="fas fa-feather"></i>
                <h3>还没有文章</h3>
                <p>快去 posts/ 目录下创建你的第一篇文章吧！</p>
            </div>
            ` : ''}
        </div>
    </section>

    <footer class="footer" id="contact">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <h3>
                        <i class="fas fa-pen-nib"></i>
                        技术随笔
                    </h3>
                    <p>记录技术成长的每一步，分享解决问题的思考方式。欢迎交流探讨！</p>
                </div>
                <div class="footer-links">
                    <h4>导航</h4>
                    <ul>
                        <li><a href="index.html">首页</a></li>
                        <li><a href="#articles">文章</a></li>
                        <li><a href="#about">关于</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>MC 源码教程</h4>
                    <ul>
                        <li><a href="website/index.html">教程首页</a></li>
                        <li><a href="website/catalog.html">全部目录</a></li>
                        <li><a href="website/tutorials/Part-1-Foundation/04-registry-system.html">注册表系统</a></li>
                        <li><a href="website/tutorials/Part-5-AI/27-ai-brain-intro.html">AI大脑</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>社交</h4>
                    <ul>
                        <li><a href="#" target="_blank"><i class="fab fa-github"></i> GitHub</a></li>
                        <li><a href="#" target="_blank"><i class="fab fa-twitter"></i> Twitter</a></li>
                        <li><a href="#" target="_blank"><i class="fab fa-weibo"></i> 微博</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 技术随笔 | 用心写好每一篇文章</p>
            </div>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
    
    fs.writeFileSync(OUTPUT_HTML, indexHtml);
}

// 生成 article.html
function generateArticlePage(articles) {
    const articlesJson = JSON.stringify(articles);
    
    const articleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章 - 技术博客</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;800&display=swap" rel="stylesheet">
    <style>
        .article-page { padding-top: 64px; }
        .article-header-simple {
            padding: 40px 0;
            text-align: center;
            background: white;
            border-bottom: 1px solid var(--gray-light);
        }
        .article-header-simple .container-narrow { max-width: 800px; }
        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 20px;
            transition: var(--transition);
        }
        .back-link:hover { color: var(--primary-color); }
        .article-header-simple h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: 16px;
            line-height: 1.3;
        }
        .article-header-simple .article-meta { justify-content: center; margin-bottom: 16px; }
        .article-header-simple .tags { justify-content: center; }
        .loading { text-align: center; padding: 80px 24px; color: var(--text-secondary); }
        .loading i { font-size: 2rem; margin-bottom: 16px; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .not-found { text-align: center; padding: 120px 24px; }
        .not-found i { font-size: 4rem; color: var(--text-muted); margin-bottom: 24px; }
        .not-found h2 { font-size: 1.5rem; margin-bottom: 12px; }
        .not-found p { color: var(--text-secondary); margin-bottom: 24px; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="index.html" class="nav-logo">
                <div class="nav-logo-icon"><i class="fas fa-pen-nib"></i></div>
                <span>技术随笔</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="index.html">首页</a></li>
                <li class="dropdown">
                    <a href="#">MC 教程 <i class="fas fa-chevron-down" style="font-size: 0.75em; margin-left: 4px;"></i></a>
                    <div class="dropdown-content">
                        <a href="website/index.html">教程首页</a>
                        <a href="website/catalog.html">全部目录</a>
                        <a href="website/tutorials/Part-0-Prerequisites/00-course-overview.html">Part-0 前置知识</a>
                        <a href="website/tutorials/Part-1-Foundation/04-registry-system.html">Part-1 核心基础</a>
                        <a href="website/tutorials/Part-2-World/09-chunk-system.html">Part-2 世界系统</a>
                        <a href="website/tutorials/Part-5-AI/27-ai-brain-intro.html">Part-5 AI系统</a>
                    </div>
                </li>
                <li><a href="index.html#articles">文章</a></li>
                <li><a href="index.html#about">关于</a></li>
                <li><a href="index.html#contact">联系</a></li>
            </ul>
        </div>
    </nav>

    <main class="article-page">
        <div id="article-container">
            <div class="loading">
                <i class="fas fa-spinner"></i>
                <p>正在加载文章...</p>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2026 技术随笔 | 用心写好每一篇文章</p>
            </div>
        </div>
    </footer>

    <script src="script.js"></script>
    <script>
        const articles = ${articlesJson};

        function getArticleId() {
            const params = new URLSearchParams(window.location.search);
            return parseInt(params.get('id')) || null;
        }

        function renderArticle(article) {
            const container = document.getElementById('article-container');
            document.title = article.title + ' - 技术博客';

            const tagsHtml = Array.isArray(article.tags) 
                ? article.tags.map(tag => '<span class="tag">' + tag + '</span>').join('')
                : '';

            container.innerHTML = '<div class="article-header-simple"><div class="container-narrow">' +
                '<a href="index.html" class="back-link"><i class="fas fa-arrow-left"></i> 返回文章列表</a>' +
                '<h1>' + article.title + '</h1>' +
                '<div class="article-meta">' +
                '<span><i class="far fa-calendar"></i> ' + article.date + '</span>' +
                '<span><i class="far fa-clock"></i> ' + article.readingTime + ' 分钟阅读</span>' +
                '<span><i class="far fa-folder"></i> ' + article.categoryName + '</span>' +
                '</div>' +
                '<div class="tags" style="margin-top: 16px;">' + tagsHtml + '</div>' +
                '</div></div>' +
                '<div class="article-cover"><div class="article-cover-image" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));">' +
                '<i class="' + (article.icon || 'fa-solid fa-file-lines') + '"></i></div></div>' +
                '<article class="article-content">' + article.content + '</article>' +
                '<div class="container-narrow"><div class="article-footer">' +
                '<div class="article-tags"><div class="article-tags-title"><i class="fas fa-tags"></i> 标签</div>' +
                '<div class="tags">' + tagsHtml + '</div></div></div></div>';
        }

        document.addEventListener('DOMContentLoaded', function() {
            const articleId = getArticleId();
            const article = articles.find(a => a.id === articleId);
            const container = document.getElementById('article-container');

            if (article) {
                renderArticle(article);
            } else {
                container.innerHTML = '<div class="not-found">' +
                    '<i class="fas fa-file-circle-xmark"></i>' +
                    '<h2>文章未找到</h2>' +
                    '<p>您访问的文章不存在或已被删除</p>' +
                    '<a href="index.html" class="btn btn-primary"><i class="fas fa-home"></i> 返回首页</a>' +
                    '</div>';
            }
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(__dirname, 'article.html'), articleHtml);
}

// 主函数
function main() {
    console.log('开始转换博客文章...\n');
    
    const articles = loadArticles();
    
    if (articles.length === 0) {
        console.log('没有找到文章文件。');
        console.log('请在 posts/ 目录下创建 Markdown 文件。\n');
    } else {
        console.log('找到 ' + articles.length + ' 篇文章:');
        articles.forEach(function(article) {
            console.log('  - [' + article.categoryName + '] ' + article.title);
        });
        console.log();
    }
    
    generateIndex(articles);
    console.log('已生成 index.html');
    
    generateArticlePage(articles);
    console.log('已生成 article.html');
    
    console.log('\n转换完成！');
}

main();
