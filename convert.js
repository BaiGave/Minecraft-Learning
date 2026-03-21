/**
 * 博客文章转换脚本
 * 将 Markdown 文件转换为 HTML
 *
 * Features:
 * - 详细的日志输出
 * - 错误处理
 * - 进度条显示
 * - 统计摘要
 *
 * 使用方法：
 * 1. 将 Markdown 文件放到 posts/ 目录
 * 2. 运行 node convert.js
 * 3. 文章会自动添加到 index.html
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    postsDir: path.join(__dirname, 'posts'),
    outputDir: __dirname,
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    dryRun: process.argv.includes('--dry-run')
};

// ============================================================================
// Logger - Styled console output
// ============================================================================

const Logger = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    log(msg, color = 'white') {
        console.log(`${this[color]}${msg}${this.reset}`);
    },

    info(msg) { this.log(`ℹ  ${msg}`, 'blue'); },
    success(msg) { this.log(`✓  ${msg}`, 'green'); },
    warning(msg) { this.log(`⚠  ${msg}`, 'yellow'); },
    error(msg) { this.log(`✗  ${msg}`, 'red'); },

    header(msg) {
        console.log(`\n${this.cyan}${'='.repeat(60)}${this.reset}`);
        console.log(`${this.bright}${this.cyan}  ${msg}${this.reset}`);
        console.log(`${this.cyan}${'='.repeat(60)}${this.reset}\n`);
    },

    subheader(msg) {
        console.log(`\n${this.magenta}▶ ${msg}${this.reset}`);
    },

    stats(data) {
        const { articles, errors, duration } = data;
        console.log(`\n${this.cyan}${'─'.repeat(40)}${this.reset}`);
        console.log(`${this.bright}转换统计:${this.reset}`);
        console.log(`  ${this.green}成功: ${articles}${this.reset}`);
        if (errors > 0) console.log(`  ${this.red}错误: ${errors}${this.reset}`);
        console.log(`  ${this.dim}耗时: ${(duration / 1000).toFixed(2)}s${this.reset}`);
        console.log(`${this.cyan}${'─'.repeat(40)}${this.reset}\n`);
    }
};

// ============================================================================
// Progress Bar
// ============================================================================

class ProgressBar {
    constructor(total, label = 'Progress') {
        this.total = total;
        this.current = 0;
        this.label = label;
        this.startTime = Date.now();
    }

    increment(message = '') {
        this.current++;
        this.render(message);
    }

    render(message = '') {
        const width = 40;
        const filled = Math.round((this.current / this.total) * width);
        const empty = width - filled;
        const percentage = Math.round((this.current / this.total) * 100);

        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

        process.stdout.write(`\r${this.label}: [${bar}] ${percentage}% (${this.current}/${this.total}) ${elapsed}s ${message ? '- ' + message : ''}`);
        process.stdout.write(' '.repeat(Math.max(0, 50 - message.length)));

        if (this.current >= this.total) {
            process.stdout.write('\n');
        }
    }

    complete() {
        this.current = this.total;
        this.render('Done!');
    }
}

// ============================================================================
// Statistics
// ============================================================================

const stats = {
    articles: 0,
    errors: 0,
    startTime: Date.now(),

    get duration() {
        return Date.now() - this.startTime;
    }
};

// ============================================================================
// File System Helpers
// ============================================================================

/**
 * Read file with error handling
 */
function readFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.replace(/^\uFEFF/, '');
    } catch (e) {
        Logger.error(`Failed to read: ${filePath}`);
        if (CONFIG.verbose) {
            Logger.error(e.message);
        }
        return null;
    }
}

/**
 * Write file with error handling
 */
function writeFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    } catch (e) {
        Logger.error(`Failed to write: ${filePath}`);
        if (CONFIG.verbose) {
            Logger.error(e.message);
        }
        return false;
    }
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        return true;
    }
    return false;
}

// ============================================================================
// Markdown Parser
// ============================================================================

/**
 * Parse frontmatter from markdown content
 */
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

            // Handle arrays
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

/**
 * Simple markdown to HTML parser
 */
function parseMarkdown(text) {
    let html = text
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>\n')
        // Blockquotes
        .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
        // Headers
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>\n')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>\n')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>\n')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>\n')
        // Bold and italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Strikethrough
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Images
        .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
        // Links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        // Horizontal rules
        .replace(/^---$/gm, '<hr>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n/g, '<br>\n');

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

    return html;
}

// ============================================================================
// HTML Generators
// ============================================================================

/**
 * Generate article card HTML
 */
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

/**
 * Load and parse all articles
 */
function loadArticles() {
    // Create posts directory if it doesn't exist
    if (!fs.existsSync(CONFIG.postsDir)) {
        fs.mkdirSync(CONFIG.postsDir, { recursive: true });
        Logger.info(`Created posts directory: ${CONFIG.postsDir}`);

        // Create sample post
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

        writeFile(path.join(CONFIG.postsDir, 'first-post.md'), samplePost);
        Logger.success('Created sample post: first-post.md');
    }

    const files = fs.readdirSync(CONFIG.postsDir).filter(f => f.endsWith('.md'));
    const articles = [];

    files.forEach((file, index) => {
        const filePath = path.join(CONFIG.postsDir, file);
        const content = readFile(filePath);

        if (!content) {
            stats.errors++;
            return;
        }

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

    // Sort by date
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Reassign IDs
    articles.forEach((article, index) => {
        article.id = index + 1;
    });

    return articles;
}

/**
 * Generate index.html
 */
function generateIndex(articles) {
    const articlesGrid = articles.map((article, index) => generateArticleCard(article, index)).join('\n');

    // Statistics
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

    return writeFile(path.join(CONFIG.outputDir, 'index.html'), indexHtml);
}

/**
 * Generate article.html
 */
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

    return writeFile(path.join(CONFIG.outputDir, 'article.html'), articleHtml);
}

// ============================================================================
// Main Function
// ============================================================================

function main() {
    Logger.header('博客文章转换器');

    if (CONFIG.dryRun) {
        Logger.warning('Running in dry-run mode - no files will be written');
    }

    Logger.info(`Posts directory: ${CONFIG.postsDir}`);
    Logger.info(`Output directory: ${CONFIG.outputDir}`);

    // Load articles
    Logger.subheader('加载文章...');
    const articles = loadArticles();

    if (articles.length === 0) {
        Logger.warning('No articles found');
    } else {
        Logger.info(`Found ${articles.length} articles`);

        // List all articles
        articles.forEach(article => {
            Logger.success(`  [${article.categoryName}] ${article.title}`);
        });
    }

    console.log('');

    if (CONFIG.dryRun) {
        Logger.warning('Dry-run mode: skipping file generation');
        Logger.stats(stats);
        return;
    }

    // Generate index.html
    Logger.subheader('生成 index.html...');
    if (generateIndex(articles)) {
        stats.articles++;
        Logger.success('Generated index.html');
    } else {
        stats.errors++;
    }

    // Generate article.html
    Logger.subheader('生成 article.html...');
    if (generateArticlePage(articles)) {
        Logger.success('Generated article.html');
    } else {
        stats.errors++;
    }

    // Print statistics
    Logger.stats(stats);

    if (stats.errors === 0) {
        Logger.success('Conversion completed successfully!');
    } else {
        Logger.error(`Conversion completed with ${stats.errors} error(s)`);
    }
}

// ============================================================================
// Error Handlers
// ============================================================================

process.on('uncaughtException', (err) => {
    Logger.error('Uncaught exception: ' + err.message);
    if (CONFIG.verbose) {
        console.error(err.stack);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection');
    if (CONFIG.verbose) {
        console.error('Reason:', reason);
    }
});

// ============================================================================
// Run
// ============================================================================

main();
