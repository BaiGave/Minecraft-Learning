/**
 * Markdown to HTML Converter for Minecraft Tutorial Website
 * Converts tutorial markdown files to styled HTML pages
 *
 * Features:
 * - Detailed logging with timestamps
 * - Error handling with file-level granularity
 * - Progress bar for long operations
 * - Statistics summary
 */

const fs = require('fs');
const path = require('path');
const { markdownLinkToHtml } = require('./scripts/safe-markdown-link');
const { PUBLISH_SITE_URL } = require('./scripts/publish-config');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    tutorialsDir: path.join(__dirname, '..', 'content'),
    outputDir: path.join(__dirname, 'docs'),
    websiteDir: __dirname,
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
        const { converted, errors, warnings, duration } = data;
        console.log(`\n${this.cyan}${'─'.repeat(40)}${this.reset}`);
        console.log(`${this.bright}转换统计:${this.reset}`);
        console.log(`  ${this.green}成功: ${converted}${this.reset}`);
        if (errors > 0) console.log(`  ${this.red}错误: ${errors}${this.reset}`);
        if (warnings > 0) console.log(`  ${this.yellow}警告: ${warnings}${this.reset}`);
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
// Part Configuration
// ============================================================================

const MODULES = {
    mc: {
        name: 'Minecraft 原版',
        color: '#5B8C5A',
        versions: ['1.21', '1.20', '1.19', '1.18']
    },
    iris: {
        name: 'Iris 光影',
        color: '#E07A5F',
        versions: null
    },
    sodium: {
        name: 'Sodium 优化',
        color: '#F2CC8F',
        versions: null
    }
};

const PARTS = {
    'Part-0-Prerequisites': { num: 0, title: '前置知识', color: '#34495e', prev: null, next: 'part-1.html' },
    'Part-1-Foundation': { num: 1, title: '核心基础', color: '#c0392b', prev: 'part-0.html', next: 'part-2.html' },
    'Part-2-World': { num: 2, title: '世界系统', color: '#27ae60', prev: 'part-1.html', next: 'part-3.html' },
    'Part-3-Block-Item': { num: 3, title: '方块物品', color: '#2980b9', prev: 'part-2.html', next: 'part-4.html' },
    'Part-4-Entity': { num: 4, title: '实体系统', color: '#8e44ad', prev: 'part-3.html', next: 'part-5.html' },
    'Part-5-AI': { num: 5, title: 'AI系统', color: '#e67e22', prev: 'part-4.html', next: 'part-6.html' },
    'Part-6-Network': { num: 6, title: '网络系统', color: '#1abc9c', prev: 'part-5.html', next: 'part-7.html' },
    'Part-7-Command': { num: 7, title: '命令系统', color: '#e74c3c', prev: 'part-6.html', next: 'part-8.html' },
    'Part-8-Resource': { num: 8, title: '资源系统', color: '#f39c12', prev: 'part-7.html', next: 'part-9.html' },
    'Part-9-Client': { num: 9, title: '客户端', color: '#3498db', prev: 'part-8.html', next: 'part-10.html' },
    'Part-10-Server': { num: 10, title: '服务端', color: '#9b59b6', prev: 'part-9.html', next: 'part-11.html' },
    'Part-11-Advanced': { num: 11, title: '进阶主题', color: '#16a085', prev: 'part-10.html', next: 'part-12.html' },
    'Part-12-Practice': { num: 12, title: '实战项目', color: '#d35400', prev: 'part-11.html', next: 'part-13.html' },
    'Part-13-Additional': { num: 13, title: '附加系统', color: '#7f8c8d', prev: 'part-12.html', next: null }
};

// ============================================================================
// File System Helpers
// ============================================================================

/**
 * Ensure directory exists
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        Logger.info(`Created directory: ${dir}`);
    }
}

/**
 * Read file with BOM handling
 * @param {string} filePath - File path
 * @returns {string|null} - File content or null on error
 */
function readFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.replace(/^\uFEFF/, '');
    } catch (e) {
        Logger.error(`Failed to read file: ${filePath}`);
        if (CONFIG.verbose) {
            Logger.error(e.message);
        }
        return null;
    }
}

/**
 * Write file with error handling
 * @param {string} filePath - File path
 * @param {string} content - Content to write
 * @returns {boolean} - Success status
 */
function writeFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    } catch (e) {
        Logger.error(`Failed to write file: ${filePath}`);
        if (CONFIG.verbose) {
            Logger.error(e.message);
        }
        return false;
    }
}

/**
 * Copy file with error handling
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 * @returns {boolean} - Success status
 */
function copyFile(src, dest) {
    try {
        fs.copyFileSync(src, dest);
        return true;
    } catch (e) {
        Logger.error(`Failed to copy: ${src} -> ${dest}`);
        return false;
    }
}

// ============================================================================
// Markdown Parser
// ============================================================================

/**
 * Escape HTML entities
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Parse markdown to extract title, content and headings for TOC
 * @param {string} content - Markdown content
 * @returns {Object} - Parsed result
 */
function parseMarkdown(content) {
    const lines = content.split('\n');
    let html = '';
    let headings = [];
    let codeBlockType = null; // null | 'code' | 'mermaid' | 'ref'
    let codeContent = [];
    let codeRefFile = '';
    let inTable = false;
    let tableBuffer = [];
    let inBlockquote = false;
    let blockquoteContent = [];

    // Extract title from first h1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Minecraft 源码教程';

    // Extract subtitle from first blockquote
    const subtitleMatch = content.match(/^>\s*\*\*([^*]+)\*\*\s*(.+)$/m);
    const subtitle = subtitleMatch ? subtitleMatch[2].trim() : '';

    // Find the first title line index
    let firstTitleIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('# ')) {
            firstTitleIndex = i;
            break;
        }
    }

    // Process lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip the first title line (main h1)
        if (i === firstTitleIndex && line.trim().startsWith('# ')) {
            continue;
        }

        // Code block start/end
        if (line.startsWith('```')) {
            if (codeBlockType === null) {
                // Start of code block
                const lang = line.slice(3).trim();

                // Check for code reference format: ```startLine:endLine:filepath
                const refMatch = lang.match(/^(\d+):(\d+):(.+)/);
                if (refMatch) {
                    codeBlockType = 'ref';
                    codeRefFile = refMatch[3];
                    codeContent = [];
                } else if (lang === 'mermaid') {
                    codeBlockType = 'mermaid';
                    codeContent = [];
                } else {
                    codeBlockType = 'code';
                    codeContent = [];
                }
            } else {
                // End of code block
                if (codeBlockType === 'mermaid') {
                    html += `<div class="mermaid">\n${codeContent.join('\n')}\n</div>\n`;
                } else if (codeBlockType === 'ref') {
                    html += `<div class="code-reference">
                        <div class="code-reference-header">
                            <span class="code-reference-filename">${codeRefFile}</span>
                            <button class="code-reference-copy" onclick="copyCode(this)"><i class="fas fa-copy"></i> 复制</button>
                        </div>
                        <pre><code>${escapeHtml(codeContent.join('\n'))}</code></pre>
                    </div>\n`;
                } else {
                    html += `<pre class="code-block"><code>${escapeHtml(codeContent.join('\n'))}</code></pre>\n`;
                }
                codeBlockType = null;
                codeContent = [];
            }
            continue;
        }

        // Inside code block
        if (codeBlockType !== null) {
            codeContent.push(line);
            continue;
        }

        // Blockquote handling
        if (line.startsWith('>')) {
            if (!inBlockquote) {
                inBlockquote = true;
                blockquoteContent = [];
            }
            blockquoteContent.push(line.substring(1).trim());
            continue;
        } else if (inBlockquote) {
            const bqHtml = blockquoteContent.join(' ').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html += `<blockquote>${bqHtml}</blockquote>\n`;
            inBlockquote = false;
            blockquoteContent = [];
        }

        // Headers
        if (line.startsWith('#### ')) {
            const text = line.substring(5);
            const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
            headings.push({ level: 4, text, id });
            html += `<h4 id="${id}">${text}</h4>\n`;
        } else if (line.startsWith('### ')) {
            const text = line.substring(4);
            const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
            headings.push({ level: 3, text, id });
            html += `<h3 id="${id}">${text}</h3>\n`;
        } else if (line.startsWith('## ')) {
            const text = line.substring(3);
            const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
            headings.push({ level: 2, text, id });
            html += `<h2 id="${id}">${text}</h2>\n`;
        } else if (line.startsWith('# ')) {
            // Skip main title
        }
        // Horizontal rule
        else if (line.match(/^---+$/)) {
            html += '<hr>\n';
        }
        // Table handling
        else if (line.startsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableBuffer = [];
            }
            // Skip separator line
            if (line.match(/^\|[\s-:]+\|$/)) {
                continue;
            }
            tableBuffer.push(line);
        } else {
            if (inTable) {
                // Process table
                html += '<table><thead><tr>';
                const headers = tableBuffer[0].split('|').filter(c => c.trim()).map(c => c.trim());
                headers.forEach(h => {
                    html += `<th>${h}</th>`;
                });
                html += '</tr></thead><tbody>';
                for (let j = 1; j < tableBuffer.length; j++) {
                    html += '<tr>';
                    const cells = tableBuffer[j].split('|').filter(c => c.trim()).map(c => c.trim());
                    cells.forEach(c => {
                        html += `<td>${c}</td>`;
                    });
                    html += '</tr>';
                }
                html += '</tbody></table>\n';
                inTable = false;
                tableBuffer = [];
            }

            // Paragraph
            if (line.trim()) {
                // Inline formatting
                let formatted = line
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/`(.+?)`/g, '<code>$1</code>')
                    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => markdownLinkToHtml(text, url));

                html += `<p>${formatted}</p>\n`;
            } else {
                html += '\n';
            }
        }
    }

    // Close any open blocks
    if (inBlockquote) {
        const bqHtml = blockquoteContent.join(' ').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html += `<blockquote>${bqHtml}</blockquote>\n`;
    }

    return { title, subtitle, content: html, headings };
}

// ============================================================================
// HTML Generator
// ============================================================================

/**
 * 从当前教程页所在目录回到 website/ 根目录的相对路径前缀
 * 实际路径：docs/{module}/[{version}/]{type}/[Part/]xxx.html
 */
function getRelPathToWebsiteRoot(module, version, type, part) {
    const segments = ['docs', module];
    if (version) segments.push(version);
    segments.push(type);
    if (part) segments.push(part);
    return '../'.repeat(segments.length);
}

/** 指向该版本/模组文档首页 index.html（与 tutorials|analysis 同级目录） */
function getModuleHubIndexHref(part) {
    return (part ? '../../' : '../') + 'index.html';
}

/**
 * Generate HTML page from markdown (new version for multi-module support)
 * @param {string} module - Module name (mc, iris, sodium)
 * @param {string|null} version - Version (for MC)
 * @param {string} type - Type (tutorials, analysis)
 * @param {string|null} part - Part folder name
 * @param {string} filename - Markdown filename
 * @param {string} markdownContent - Markdown content
 * @returns {string} - Generated HTML
 */
function generateTutorialHTML(module, version, type, part, filename, markdownContent) {
    const moduleConfig = MODULES[module];
    const moduleColor = moduleConfig ? moduleConfig.color : '#5B8C5A';

    const { title, subtitle, content, headings } = parseMarkdown(markdownContent);

    // Generate TOC
    let tocHtml = '';
    headings.forEach(h => {
        if (h.level <= 2) {
            tocHtml += `<li><a href="#${h.id}">${h.text}</a></li>`;
        } else {
            tocHtml += `<li class="h3"><a href="#${h.id}">${h.text}</a></li>`;
        }
    });

    const relPath = getRelPathToWebsiteRoot(module, version, type, part);
    const moduleHubHref = getModuleHubIndexHref(part);

    // Build breadcrumb（不再链到错误的 docs/.../docs/...；去掉无意义的「目录」）
    let breadcrumbHtml = `
        <a href="${relPath}index.html">文档中心</a>
        <span>/</span>
    `;

    if (version) {
        breadcrumbHtml += `
            <a href="${moduleHubHref}">${moduleConfig.name} ${version}</a>
        `;
    } else {
        breadcrumbHtml += `
            <a href="${moduleHubHref}">${moduleConfig.name}</a>
        `;
    }

    if (type) {
        breadcrumbHtml += `
            <span>/</span>
            <span>${type === 'tutorials' ? '教程' : '源码分析'}</span>
        `;
    }

    if (part) {
        breadcrumbHtml += `
            <span>/</span>
            <span>${part}</span>
        `;
    }

    breadcrumbHtml += `
        <span>/</span>
        <span>${escapeHtml(title)}</span>
    `;

    // Module badge class
    const moduleBadgeClass = module;

    // SEO: Determine page URL
    let pageUrl = '/website/';
    if (version) {
        pageUrl = `/website/docs/${module}/${version}/${type}/${part ? part + '/' : ''}${filename.replace('.md', '.html')}`;
    } else {
        pageUrl = `/website/docs/${module}/${type}/${part ? part + '/' : ''}${filename.replace('.md', '.html')}`;
    }

    // SEO meta tags
    const seoMetaTags = `
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(title)} - ${moduleConfig.name} 教程</title>
    <meta name="title" content="${escapeHtml(title)} - ${moduleConfig.name} 教程">
    <meta name="description" content="${escapeHtml(subtitle || '深入学习 ' + moduleConfig.name + ' 源码，理解其内部工作原理')}">
    <meta name="keywords" content="${moduleConfig.name}, Minecraft, 源码教程, ${type === 'tutorials' ? '教程' : '源码分析'}, Java">
    <link rel="canonical" href="${PUBLISH_SITE_URL}${pageUrl}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${PUBLISH_SITE_URL}${pageUrl}">
    <meta property="og:title" content="${escapeHtml(title)} - ${moduleConfig.name} 教程">
    <meta property="og:description" content="${escapeHtml(subtitle || '深入学习 ' + moduleConfig.name + ' 源码')}">
    <meta property="og:site_name" content="Minecraft Learning">
    <meta property="og:locale" content="zh_CN">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)} - ${moduleConfig.name}">
    <meta name="twitter:description" content="${escapeHtml(subtitle || '深入学习 ' + moduleConfig.name + ' 源码')}">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${escapeHtml(title)}",
        "description": "${escapeHtml(subtitle || '')}",
        "author": {
            "@type": "Person",
            "name": "baigave"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Minecraft Learning"
        },
        "datePublished": "${new Date().toISOString()}",
        "dateModified": "${new Date().toISOString()}"
    }
    </script>`.trim();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${seoMetaTags}
    <link rel="stylesheet" href="${relPath}styles.css">
    <link rel="stylesheet" href="${relPath}styles/site-shell.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
    <div class="reading-progress" id="readingProgress"></div>

    <nav class="navbar">
        <div class="nav-container">
            <a href="${relPath}index.html" class="nav-logo">
                <i class="fas fa-cube"></i>
                <span>Minecraft Learning</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="${relPath}index.html">首页</a></li>
                <li class="dropdown">
                    <a href="#">文档中心 <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        <a href="${relPath}docs/mc/index.html">Minecraft 原版</a>
                        <a href="${relPath}docs/iris/index.html">Iris 光影</a>
                        <a href="${relPath}docs/sodium/index.html">Sodium 优化</a>
                    </div>
                </li>
                <li><a href="${relPath}about.html">关于</a></li>
            </ul>
        </div>
    </nav>

    <div class="tutorial-page">
        <header class="tutorial-header" style="background: linear-gradient(135deg, ${moduleColor} 0%, ${moduleColor}88 100%);">
            <div class="container">
                <div class="tutorial-nav">
                    <div class="tutorial-breadcrumb">
                        ${breadcrumbHtml}
                    </div>
                </div>
                <h1 class="tutorial-title">${escapeHtml(title)}</h1>
                ${subtitle ? `<p class="tutorial-subtitle">${escapeHtml(subtitle)}</p>` : ''}
                <div class="tutorial-meta">
                    <span class="module-badge ${moduleBadgeClass}">${moduleConfig.name}</span>
                    ${version ? `<span><i class="fas fa-code-branch"></i> ${version}</span>` : ''}
                    <span><i class="fas fa-file"></i> ${type === 'tutorials' ? '教程' : '源码分析'}</span>
                    <span><i class="fas fa-file"></i> ${escapeHtml(filename.replace('.md', ''))}</span>
                </div>
            </div>
        </header>

        <div class="tutorial-container">
            <aside class="tutorial-sidebar">
                <div class="sidebar-section">
                    <h3 class="sidebar-title"><i class="fas fa-list"></i> 本章目录</h3>
                    <ul class="sidebar-toc">
                        ${tocHtml || '<li><span style="color: var(--text-secondary);">暂无目录</span></li>'}
                    </ul>
                </div>
                <div class="sidebar-section">
                    <h3 class="sidebar-title"><i class="fas fa-book"></i> 教程信息</h3>
                    <div class="part-nav">
                        <div style="padding: 12px; background: var(--gray-light); border-radius: var(--radius-md); font-size: 0.9rem;">
                            <p style="margin-bottom: 8px;"><strong>模组：</strong>${moduleConfig.name}</p>
                            ${version ? `<p style="margin-bottom: 8px;"><strong>版本：</strong>${version}</p>` : ''}
                            <p><strong>类型：</strong>${type === 'tutorials' ? '教程' : '源码分析'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <article class="tutorial-content">
                ${content}
            </article>
        </div>
    </div>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2026 Minecraft 源码萌新教程 | 基于 Minecraft 1.21</p>
            </div>
        </div>
    </footer>

    <script src="${relPath}script.js"></script>
    <script src="${relPath}tutorial.js"></script>
    <script>
        // Initialize Mermaid
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: { htmlLabels: true }
        });

        // Copy code function
        function copyCode(btn) {
            const codeBlock = btn.closest('.code-reference').querySelector('code');
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-copy"></i> 复制';
                }, 2000);
            });
        }
    </script>
</body>
</html>`;
}

// ============================================================================
// Statistics
// ============================================================================

const stats = {
    converted: 0,
    errors: 0,
    warnings: 0,
    startTime: Date.now(),

    get duration() {
        return Date.now() - this.startTime;
    }
};

// ============================================================================
// Main Conversion Function
// ============================================================================

/**
 * Scan for all markdown files in the content directory
 * Supports: content/mc/1.21/tutorials/, content/iris/tutorials/, etc.
 * @returns {Array} Array of { module, version, part, file } objects
 */
function scanMarkdownFiles() {
    const files = [];
    const baseDir = CONFIG.tutorialsDir;

    // Scan each module (mc, iris, sodium)
    for (const [module, config] of Object.entries(MODULES)) {
        const moduleDir = path.join(baseDir, module);

        if (!fs.existsSync(moduleDir)) {
            Logger.warning(`Module directory not found: ${moduleDir}`);
            continue;
        }

        // For MC, scan each version
        if (module === 'mc' && config.versions) {
            for (const version of config.versions) {
                const versionDir = path.join(moduleDir, version);

                // Scan tutorials
                const tutorialsDir = path.join(versionDir, 'tutorials');
                if (fs.existsSync(tutorialsDir)) {
                    scanDirectory(tutorialsDir, files, { module, version, type: 'tutorials' });
                }

                // Scan analysis
                const analysisDir = path.join(versionDir, 'analysis');
                if (fs.existsSync(analysisDir)) {
                    scanDirectory(analysisDir, files, { module, version, type: 'analysis' });
                }
            }
        } else {
            // For Iris/Sodium, scan tutorials and analysis directly
            const tutorialsDir = path.join(moduleDir, 'tutorials');
            if (fs.existsSync(tutorialsDir)) {
                scanDirectory(tutorialsDir, files, { module, version: null, type: 'tutorials' });
            }

            const analysisDir = path.join(moduleDir, 'analysis');
            if (fs.existsSync(analysisDir)) {
                scanDirectory(analysisDir, files, { module, version: null, type: 'analysis' });
            }
        }
    }

    return files;
}

/**
 * Scan a directory for markdown files
 * @param {string} dir - Directory path
 * @param {Array} files - Array to push found files to
 * @param {Object} context - Context object with module, version, type
 */
function scanDirectory(dir, files, context) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            // Scan subdirectory (e.g., Part-0-Prerequisites)
            const subDir = path.join(dir, entry.name);
            scanDirectory(subDir, files, { ...context, part: entry.name });
        } else if (entry.name.endsWith('.md')) {
            files.push({
                ...context,
                file: entry.name,
                fullPath: path.join(dir, entry.name)
            });
        }
    }
}

/**
 * Main conversion function
 */
function convertAll() {
    const startTime = Date.now();

    Logger.header('Markdown to HTML Converter');

    if (CONFIG.dryRun) {
        Logger.warning('Running in dry-run mode - no files will be written');
    }

    Logger.info(`Source directory: ${CONFIG.tutorialsDir}`);
    Logger.info(`Output directory: ${CONFIG.outputDir}`);

    // Ensure output directory
    ensureDir(CONFIG.outputDir);

    // Scan for all markdown files
    const markdownFiles = scanMarkdownFiles();

    if (markdownFiles.length === 0) {
        Logger.error('No markdown files found to convert');
        Logger.info(`Please ensure your content is in:`);
        Logger.info(`  - content/mc/{version}/tutorials/`);
        Logger.info(`  - content/mc/{version}/analysis/`);
        Logger.info(`  - content/iris/tutorials/`);
        Logger.info(`  - content/iris/analysis/`);
        Logger.info(`  - content/sodium/tutorials/`);
        Logger.info(`  - content/sodium/analysis/`);
        return;
    }

    Logger.info(`Found ${markdownFiles.length} markdown files\n`);

    // Group by module
    const byModule = {};
    markdownFiles.forEach(f => {
        if (!byModule[f.module]) byModule[f.module] = [];
        byModule[f.module].push(f);
    });

    // Log file distribution
    for (const [module, files] of Object.entries(byModule)) {
        Logger.subheader(`${MODULES[module].name} - ${files.length} files`);
    }

    console.log('');

    // Create progress bar
    const progress = new ProgressBar(markdownFiles.length, 'Converting');

    // Process each file
    for (const fileInfo of markdownFiles) {
        const { module, version, type, part, file, fullPath } = fileInfo;

        const content = readFile(fullPath);
        if (!content) {
            stats.errors++;
            progress.increment(`Error: ${file}`);
            continue;
        }

        if (CONFIG.dryRun) {
            stats.converted++;
            progress.increment(`[DRY] ${module}/${file}`);
            continue;
        }

        // Generate output path
        const outputDir = path.join(CONFIG.outputDir, module);
        ensureDir(outputDir);

        if (version) {
            const versionDir = path.join(outputDir, version);
            ensureDir(versionDir);

            const typeDir = path.join(versionDir, type);
            ensureDir(typeDir);

            if (part) {
                const partDir = path.join(typeDir, part);
                ensureDir(partDir);
                const outputPath = path.join(partDir, file.replace('.md', '.html'));
                const html = generateTutorialHTML(module, version, type, part, file, content);
                if (writeFile(outputPath, html)) {
                    stats.converted++;
                } else {
                    stats.errors++;
                }
            } else {
                const outputPath = path.join(typeDir, file.replace('.md', '.html'));
                const html = generateTutorialHTML(module, version, type, null, file, content);
                if (writeFile(outputPath, html)) {
                    stats.converted++;
                } else {
                    stats.errors++;
                }
            }
        } else {
            const typeDir = path.join(outputDir, type);
            ensureDir(typeDir);

            if (part) {
                const partDir = path.join(typeDir, part);
                ensureDir(partDir);
                const outputPath = path.join(partDir, file.replace('.md', '.html'));
                const html = generateTutorialHTML(module, null, type, part, file, content);
                if (writeFile(outputPath, html)) {
                    stats.converted++;
                } else {
                    stats.errors++;
                }
            } else {
                const outputPath = path.join(typeDir, file.replace('.md', '.html'));
                const html = generateTutorialHTML(module, null, type, null, file, content);
                if (writeFile(outputPath, html)) {
                    stats.converted++;
                } else {
                    stats.errors++;
                }
            }
        }

        progress.increment(`${module}/${file}`);
    }

    progress.complete();

    // Print statistics
    Logger.stats(stats);

    // Generate sitemap
    if (!CONFIG.dryRun && stats.errors === 0) {
        try {
            const { generateSitemapFromContent, generateRobotsTxt } = require('./scripts/seo.js');
            const sitemap = generateSitemapFromContent({
                baseDir: CONFIG.tutorialsDir,
                outputPath: path.join(__dirname, '..', 'sitemap.xml'),
                verbose: CONFIG.verbose
            });
            Logger.success('Generated sitemap.xml');

            // Generate robots.txt
            const robotsTxt = generateRobotsTxt();
            fs.writeFileSync(path.join(__dirname, '..', 'robots.txt'), robotsTxt, 'utf8');
            Logger.success('Generated robots.txt');
        } catch (e) {
            Logger.warning('Failed to generate SEO files: ' + e.message);
        }
    }

    // Print completion message
    if (stats.errors === 0) {
        Logger.success('Conversion completed successfully!');
    } else {
        Logger.error(`Conversion completed with ${stats.errors} error(s)`);
    }

    Logger.info(`Output directory: ${CONFIG.outputDir}`);
}

// ============================================================================
// Error Handlers
// ============================================================================

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    Logger.error('Uncaught exception: ' + err.message);
    if (CONFIG.verbose) {
        console.error(err.stack);
    }
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection');
    if (CONFIG.verbose) {
        console.error('Reason:', reason);
    }
});

// ============================================================================
// Run
// ============================================================================

convertAll();
