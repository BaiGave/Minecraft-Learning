/**
 * 通用文档转换脚本
 * 将 Markdown 文件转换为带主题的 HTML 文档页面
 *
 * 使用方法：
 * 1. 在 content/ 目录下添加 .md 文件
 * 2. 运行 node converter.js
 *    - 自动扫描 content/ 发现所有模块
 *    - 自动转换所有 markdown 到 html
 * 3. 无需手动配置，模块会自动被发现
 *
 * 自动扫描说明：
 * - content/{slug}/ 下每个子目录 = 一个模块
 * - 模块下的 tutorials/ = 教程目录
 * - 模块下的 analysis/ = 分析目录
 * - 数字格式的子目录 (如 1.21) = 版本目录
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 自动扫描模块配置
// ============================================================================

// 优先使用 auto-scanner.js 动态发现的模块
let autoModules = {};
let autoTutorialsNav = {};
let autoAnalysisNav = {};

const autoScannerPath = path.join(__dirname, 'auto-scanner.js');
if (fs.existsSync(autoScannerPath)) {
    try {
        const { AutoModuleScanner } = require(autoScannerPath);
        const scanner = new AutoModuleScanner();
        const result = scanner.scanModules();

        // 转换为 converter.js 需要的格式
        autoModules = {};
        autoTutorialsNav = {};
        autoAnalysisNav = {};

        for (const [slug, module] of Object.entries(result)) {
            // 转换模块格式
            autoModules[slug] = {
                name: module.name,
                slug: module.slug,
                icon: module.icon,
                color: module.color,
                colorGradient: module.colorGradient,
                description: module.description,
                versions: module.versions,
                defaultVersion: module.defaultVersion,
                docsDir: module.docsDir,
                theme: module.theme
            };

            // 转换导航格式
            autoTutorialsNav[slug] = module.tutorials.map(doc => ({
                id: doc.file,
                title: doc.title,
                icon: 'book',
                file: doc.file,
                part: doc.part,
                topics: []
            }));

            autoAnalysisNav[slug] = module.analysis.map(doc => ({
                id: doc.file,
                title: doc.title,
                icon: 'microscope',
                file: doc.file
            }));
        }

        console.log(`\n🔍 自动发现 ${Object.keys(autoModules).length} 个模块\n`);
    } catch (e) {
        console.warn('⚠ 自动扫描失败，使用备用配置:', e.message);
    }
}

// 尝试加载 config.js 的备用配置
let { modules, navigation, tutorialsNavigation, analysisNavigation, moduleCards, config, partLearningAdvice } = {};
try {
    const configModule = require('./config');
    modules = configModule.modules || {};
    tutorialsNavigation = configModule.tutorialsNavigation || {};
    analysisNavigation = configModule.analysisNavigation || {};
    moduleCards = configModule.moduleCards || {};
    config = configModule.config || {};
    partLearningAdvice = configModule.partLearningAdvice || {};
} catch (e) {
    // config.js 不存在，使用默认配置
    config = {
        defaults: { readingTime: 30 },
        features: { syntaxHighlight: true, mermaid: true },
        markdown: { extensions: ['.md'], ignorePrefixes: ['README', 'SUMMARY', 'index'] }
    };
}

// 如果有自动扫描结果，合并到 modules 中
// 自动发现的模块优先级更高
if (Object.keys(autoModules).length > 0) {
    for (const [slug, autoModule] of Object.entries(autoModules)) {
        if (!modules[slug]) {
            modules[slug] = autoModule;
        }
    }
    // 使用自动发现的导航（更准确）
    tutorialsNavigation = Object.assign(tutorialsNavigation, autoTutorialsNav);
    analysisNavigation = Object.assign(analysisNavigation, autoAnalysisNav);
}

// 如果没有任何模块，扫描 content/ 目录
if (Object.keys(modules).length === 0) {
    const contentDir = path.join(__dirname, '..', 'content');
    if (fs.existsSync(contentDir)) {
        const entries = fs.readdirSync(contentDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                modules[entry.name] = {
                    name: entry.name,
                    slug: entry.name,
                    icon: 'book',
                    color: '#5B8C5A',
                    colorGradient: 'linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)',
                    description: `${entry.name} 相关文档`,
                    versions: null,
                    defaultVersion: null,
                    docsDir: `docs/${entry.name}`,
                    theme: entry.name
                };
            }
        }
    }
}
const { markdownLinkToHtml, markdownImageToHtml } = require('./safe-markdown-link');

// ============================================
// Markdown 解析器
// ============================================

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

function parseMarkdown(text) {
    let html = text;

    // 预处理：保留代码块（包括 mermaid）
    const codeBlocks = [];
    html = html.replace(/```([^\n]*)\n?([\s\S]*?)```/g, (match, langTag, code) => {
        const index = codeBlocks.length;

        // 解析语言标签
        let lang = 'text';
        let codeContent = code.replace(/\r\n/g, '\n').trimEnd();

        if (langTag.trim()) {
            const parts = langTag.trim().split(':');
            const first = parts[0].toLowerCase();

            // startLine / line 等特殊标记
            const pathMarkers = ['startline', 'line', 'linenumbers', 'filepath', 'source', 'srclines'];
            if (pathMarkers.includes(first)) {
                const nlIdx = codeContent.indexOf('\n');
                if (nlIdx !== -1) codeContent = codeContent.slice(nlIdx + 1);
                const extMap = {
                    'java': 'java', 'py': 'python', 'js': 'javascript', 'ts': 'typescript',
                    'glsl': 'glsl', 'frag': 'glsl', 'vert': 'glsl', 'fs': 'glsl', 'vs': 'glsl',
                    'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
                    'toml': 'toml', 'md': 'markdown', 'sh': 'bash', 'bat': 'batch',
                    'kt': 'kotlin', 'cs': 'csharp', 'cpp': 'cpp', 'c': 'c',
                    'h': 'c', 'hpp': 'cpp', 'rs': 'rust', 'go': 'go', 'sql': 'sql',
                    'properties': 'properties', 'txt': 'text'
                };
                for (const p of parts.slice(1)) {
                    const m = p.match(/\.([a-z]{2,8})$/i);
                    if (m && extMap[m[1].toLowerCase()]) {
                        lang = extMap[m[1].toLowerCase()];
                        break;
                    }
                }
            } else {
                lang = parts[0] || 'text';
                const line0 = codeContent.split('\n')[0];
                if (
                    (line0.length > 1 && line0.charAt(1) === ':' && /[A-Za-z]/.test(line0.charAt(0))) ||
                    (line0.startsWith('/') && line0.includes('/'))
                ) {
                    const nlIdx = codeContent.indexOf('\n');
                    if (nlIdx !== -1) codeContent = codeContent.slice(nlIdx + 1);
                }
            }
        }

        if (lang.toLowerCase() === 'mermaid') {
            codeBlocks.push({ type: 'mermaid', lang: 'mermaid', code: codeContent });
        } else {
            codeBlocks.push({ type: 'code', lang: lang, code: codeContent });
        }

        return `\n<!--CODEBLOCK_${index}-->\n`;
    });

    // 行内代码
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // 表格
    html = html.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
        const headers = header.split('|').filter(h => h.trim()).map(h => h.trim());
        const rows = body.trim().split('\n').map(row =>
            row.split('|').filter(c => c.trim()).map(c => c.trim())
        );

        let table = '<table class="data-table"><thead><tr>';
        headers.forEach(h => table += `<th>${h}</th>`);
        table += '</tr></thead><tbody>';
        rows.forEach(row => {
            table += '<tr>';
            row.forEach(cell => table += `<td>${cell}</td>`);
            table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
    });

    // 引用块
    html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

    // 标题
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>\n');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>\n');
    html = html.replace(/^## (.+)$/gm, '<h2 id="$1">$1</h2>\n');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>\n');

    // 粗体和斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // 删除线
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 图片（src 消毒 + lazy）
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, (_, alt, src) => markdownImageToHtml(alt, src));

    // 链接（危险协议过滤、外链 noopener）
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, (_, t, u) => markdownLinkToHtml(t, u));

    // 水平线
    html = html.replace(/^---$/gm, '<hr>');

    // 无序列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // 段落处理
    html = html.replace(/\n\n+/g, '</p>\n<p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<h[1-6])/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<!--CODEBLOCK_\d+-->)<\/p>/g, '$1');
    html = html.replace(/<p>(.*?)(<!--CODEBLOCK_\d+-->)(.*?)<\/p>/g, '<p>$1</p>$2<p>$3</p>');

    // 包装列表
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // 恢复代码块
    codeBlocks.forEach((block, index) => {
        const placeholder = `<!--CODEBLOCK_${index}-->`;

        if (block.type === 'mermaid') {
            html = html.replace(placeholder, `<div class="mermaid">${block.code}</div>`);
        } else {
            const escapedCode = block.code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            html = html.replace(placeholder,
                `<pre class="code-block"><code class="language-${block.lang}">${escapedCode}</code></pre>`);
        }
    });

    // 清理多余的br
    html = html.replace(/<br>\n(?=<(ul|ol|table|pre|blockquote|div))/g, '');
    html = html.replace(/(<(ul|ol|table|pre|blockquote|div).*?)<br>/gs, '$1');

    return html;
}

// 与 scripts/theme.js 中 STORAGE_KEY 一致，避免首屏闪烁
const THEME_STORAGE_INLINE = `<script>(function(){try{var k='mc-learning-theme';var t=localStorage.getItem(k);if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>`;

function themeNavbarActionsHtml() {
    return `
            <div class="navbar-actions">
                <div class="theme-toggle" role="group" aria-label="主题切换">
                    <button type="button" class="theme-btn" data-theme="light" aria-label="浅色模式"><i class="fas fa-sun"></i></button>
                    <button type="button" class="theme-btn" data-theme="dark" aria-label="深色模式"><i class="fas fa-moon"></i></button>
                </div>
            </div>`;
}

// ============================================
// HTML 生成器
// ============================================

function generateDocHTML(doc, module, navItems, version = null, docType = 'analysis') {
    // 输出路径：docs/{docsDir...}/[{version}/]{tutorials|analysis}/xxx.html → 回到 website 根目录
    const docsDirDepth = module.docsDir.split(/[/\\]/).filter(Boolean).length;
    const pathDepthToWebsite = docsDirDepth + (version ? 1 : 0) + 1; // + tutorials|analysis
    const relativePath = '../'.repeat(pathDepthToWebsite);
    const baseDir = '..'; // 上一级：版本目录或模组 docs 根（与 tutorials|analysis 同级的 index.html）

    const sidebarLinks = navItems.map(item => {
        const isActive = doc.slug === item.file;
        return `<a href="${item.file}.html" class="${isActive ? 'active' : ''}">
            <i class="fas fa-${item.icon}"></i>
            ${item.title}
        </a>`;
    }).join('\n');

    const prevNext = generatePrevNext(navItems, doc.slug);

    // 文档类型标识
    const docTypeLabel = docType === 'tutorials' ? '教程' : '源码分析';
    const docTypeIcon = docType === 'tutorials' ? 'graduation-cap' : 'microscope';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${THEME_STORAGE_INLINE}
    <title>${doc.title} - ${module.name}</title>
    <link rel="stylesheet" href="${relativePath}styles/main.css">
    <link rel="stylesheet" href="${relativePath}styles.css">
    <link rel="stylesheet" href="${relativePath}styles/site-shell.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    ${config.features.syntaxHighlight ? `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">` : ''}
    <style>
        /* 主题样式 */
        .docs-nav { background: ${module.color}; }
        .docs-nav .nav-logo { color: white; }
        .docs-nav .nav-links a { color: rgba(255,255,255,0.9); }
        .docs-nav .nav-links a:hover,
        .docs-nav .nav-links a.active { color: white; }
        .docs-sidebar { background: ${module.colorGradient.replace('0%', '0').replace('100%', '15%')}; }
        .sidebar-header h3 { color: white; }
        .doc-badge { background: rgba(255,255,255,0.2); color: white; }
        .sidebar-nav a { color: rgba(255,255,255,0.85); }
        .sidebar-nav a:hover,
        .sidebar-nav a.active { background: rgba(255,255,255,0.15); color: white; border-left-color: ${module.color}; }
        .sidebar-nav a i { color: rgba(255,255,255,0.7); }
        .breadcrumb {
            gap: 0.65rem 1rem !important;
            flex-wrap: wrap;
        }
        .breadcrumb a { color: ${module.color}; }
        .breadcrumb i.fa-chevron-right {
            color: #ccc;
            font-size: 0.65rem;
            opacity: 0.65;
            padding: 0 0.25em;
            flex-shrink: 0;
        }
        .info-box { border-left: 4px solid ${module.color}; background: ${module.color}15; }
        .info-box i { color: ${module.color}; }
        .info-table td:first-child { font-weight: 600; color: #666; }
        /* 代码块样式 */
        pre.code-block {
            border: 1px solid rgba(255,255,255,0.06) !important;
            box-shadow: 0 4px 24px rgba(0,0,0,0.45) !important;
            border-radius: 8px !important;
            background: #16161a !important;
        }
        pre.code-block::before {
            content: '> ' !important;
            color: #ffffff !important;
            display: block !important;
            position: absolute !important;
            left: 18px !important;
            top: 16px !important;
            pointer-events: none !important;
            z-index: 1 !important;
        }
        pre.code-block::after {
            display: none !important;
        }
        .code-reference {
            border: none !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.35) !important;
            border-radius: 0 !important;
            background: #1a1a1a !important;
        }
        .code-reference::before,
        .code-reference::after {
            display: none !important;
        }
        .docs-body h2 { border-bottom: 2px solid ${module.color}; }
        .docs-body h2 i { color: ${module.color}; }
        .data-table th { background: ${module.colorGradient}; }
        .prev-next .next { background: ${module.colorGradient}; }
        .prev-next .next:hover { box-shadow: 0 4px 15px ${module.color}66; }
        .doc-content pre { border: none !important; box-shadow: 0 2px 12px rgba(0,0,0,0.35) !important; }
        .doc-content pre code:not(.hljs) { color: #d4d4d4; }
        pre.code-block code.hljs { background: transparent !important; padding: 0 !important; }
        .docs-nav .dropdown-content {
            z-index: 1001;
            background: white;
            border: 1px solid rgba(0,0,0,0.1);
        }
        .docs-nav .dropdown-content a {
            color: var(--text-primary);
        }
        .docs-nav .dropdown-content a:hover {
            background: var(--gray-light);
            color: ${module.color};
        }
        /* 文档类型标签 */
        .doc-type-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-right: 10px;
        }
        .doc-type-tag.tutorial {
            background: linear-gradient(135deg, ${module.color}, ${module.color}99);
            color: white;
        }
        .doc-type-tag.analysis {
            background: linear-gradient(135deg, #525252, #a3a3a3);
            color: white;
        }
    </style>
</head>
<body>
    <div class="progress-bar" id="progressBar"></div>

    <nav class="navbar">
        <div class="nav-container">
            <a href="${relativePath}index.html" class="nav-logo">
                <i class="fas fa-cube"></i>
                <span>Minecraft Learning</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="${relativePath}index.html">首页</a></li>
                <li class="dropdown">
                    <a href="#">文档中心 <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        ${generateModuleDropdown(relativePath)}
                    </div>
                </li>
                <li><a href="${relativePath}about.html">关于</a></li>
            </ul>
            ${themeNavbarActionsHtml()}
        </div>
    </nav>

    <div class="docs-layout">
        <aside class="docs-sidebar">
            <div class="sidebar-header">
                <h3>${module.name}</h3>
                <span class="doc-badge">${docType === 'tutorials' ? '教程' : '分析'}</span>
            </div>
            <nav class="sidebar-nav">
                ${sidebarLinks}
            </nav>
            <div class="sidebar-footer">
                <a href="${baseDir}/index.html">
                    <i class="fas fa-arrow-left"></i>
                    返回概述
                </a>
            </div>
        </aside>

        <main class="docs-content">
            <div class="docs-header">
                <nav class="breadcrumb">
                    <a href="${relativePath}index.html">文档中心</a>
                    <i class="fas fa-chevron-right"></i>
                    <a href="${baseDir}/index.html">${module.name}</a>
                    <i class="fas fa-chevron-right"></i>
                    <span>${doc.title}</span>
                </nav>
                <h1>
                    <span class="doc-type-tag ${docType}">
                        <i class="fas fa-${docTypeIcon}"></i>
                        ${docTypeLabel}
                    </span>
                    ${doc.title}
                </h1>
                <div class="docs-meta">
                    ${version ? `<span><i class="fas fa-code-branch"></i> ${version}</span>` : ''}
                    <span><i class="fas fa-clock"></i> ${doc.readingTime || config.defaults.readingTime} 分钟</span>
                </div>
            </div>

            <div class="docs-body doc-content">
                ${doc.content}
            </div>

            <div class="docs-footer">
                ${prevNext}
            </div>
        </main>
    </div>

    <script src="${relativePath}script.js"></script>
    <script src="${relativePath}scripts/theme.js"></script>
    ${config.features.syntaxHighlight ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof hljs === 'undefined') return;
        document.querySelectorAll('.doc-content pre code').forEach(function(el) {
          if (el.closest('.mermaid')) return;
          var cls = el.className || '';
          if (cls.indexOf('language-') === -1) {
            el.classList.add('language-plaintext');
            return;
          }
          var m = cls.match(/language-(\\S+)/);
          if (m && typeof hljs.getLanguage === 'function' && !hljs.getLanguage(m[1])) {
            el.className = cls.replace(/language-\\S+/, 'language-plaintext');
          }
        });
        hljs.highlightAll();
      });
    </script>` : ''}
    ${config.features.mermaid ? `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({ startOnLoad: true, theme: 'default' });</script>` : ''}
</body>
</html>`;
}

function generateModuleDropdown(relativePath) {
    return Object.entries(modules).map(([key, module]) => {
        const href = module.versions
            ? `${relativePath}docs/${module.slug}/${module.defaultVersion}/index.html`
            : `${relativePath}docs/${module.slug}/index.html`;
        return `<a href="${href}">${module.name}</a>`;
    }).join('\n                        ');
}

function generatePrevNext(navItems, currentSlug) {
    const currentIndex = navItems.findIndex(item => item.file === currentSlug);

    let prev = '';
    let next = '';

    if (currentIndex > 0) {
        const prevItem = navItems[currentIndex - 1];
        prev = `<a href="${prevItem.file}.html" class="prev">
            <i class="fas fa-arrow-left"></i>
            ${prevItem.title}
        </a>`;
    } else {
        prev = `<span class="prev"><i class="fas fa-arrow-left"></i></span>`;
    }

    if (currentIndex < navItems.length - 1) {
        const nextItem = navItems[currentIndex + 1];
        next = `<a href="${nextItem.file}.html" class="next">
            ${nextItem.title}
            <i class="fas fa-arrow-right"></i>
        </a>`;
    } else {
        next = `<span class="next"></span>`;
    }

    return `<div class="prev-next">${prev}${next}</div>`;
}

// 按 Part 分组教程
function groupByPart(tutorials) {
    const groups = {};
    tutorials.forEach(item => {
        if (!groups[item.part]) {
            groups[item.part] = [];
        }
        groups[item.part].push(item);
    });
    return groups;
}

// Part 排序顺序（与源码目录 Part-X-XXX 对应，3-Block-Item 保证数字序 3 在 13 前）
const partOrder = ['0-Prerequisites', '1-Foundation', '2-World', '3-Block', '3-Block-Item', '4-Entity', '5-AI', '6-Network', '7-Command', '8-Resource', '9-Client', '10-Server', '11-Advanced', '12-Practice', '13-Additional'];

function sortParts(partNames) {
    return partNames.sort((a, b) => {
        const indexA = partOrder.indexOf(a);
        const indexB = partOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}

// Part 名称映射
const partNames = {
    '0-Prerequisites': 'Part-0: 前置知识',
    '1-Foundation': 'Part-1: 核心基础 ⭐',
    '2-World': 'Part-2: 世界系统',
    '3-Block': 'Part-3: 方块物品',
    '3-Block-Item': 'Part-3: 方块物品',
    '4-Entity': 'Part-4: 实体系统',
    '5-AI': 'Part-5: AI系统',
    '6-Network': 'Part-6: 网络系统',
    '7-Command': 'Part-7: 命令系统',
    '8-Resource': 'Part-8: 资源系统',
    '9-Client': 'Part-9: 客户端',
    '10-Server': 'Part-10: 服务端',
    '11-Advanced': 'Part-11: 进阶主题',
    '12-Practice': 'Part-12: 实战项目',
    '13-Additional': 'Part-13: 附加系统'
};

function generateModuleIndex(module, tutorialsNavItems, analysisNavItems, version = null) {
    // 索引页路径：docs/{slug}/[version/]index.html → 回到根目录：2 或 3 层
    const relativePath = '../'.repeat(version ? 3 : 2);
    const versionInfo = version ? ` - ${version}` : '';

    // 按 Part 分组教程
    const partGroups = groupByPart(tutorialsNavItems);
    const sortedParts = sortParts(Object.keys(partGroups));

    // 是否使用教程课程卡片式布局（MC 且有 part 学习建议时）
    const useCurriculumLayout = module.slug === 'mc' && partLearningAdvice && typeof partLearningAdvice === 'object';

    // 生成按 Part 分组的教程 HTML
    const tutorialsByPartHtml = sortedParts.map((partName, partIndex) => {
        const partItems = partGroups[partName];
        const partLabel = partNames[partName] || partName;
        const learningAdvice = useCurriculumLayout && partLearningAdvice[partName];
        const prevPart = useCurriculumLayout && partIndex > 0 ? sortedParts[partIndex - 1] : null;
        const nextPart = useCurriculumLayout && partIndex < sortedParts.length - 1 ? sortedParts[partIndex + 1] : null;

        let partContent;
        if (useCurriculumLayout && learningAdvice) {
            // 课程卡片式布局：编号块 + 标题 + 要点列表
            const curriculumCards = partItems.map((item, itemIndex) => {
                const num = String(itemIndex + 1).padStart(2, '0');
                const topicsHtml = (item.topics && item.topics.length) ? `
                    <ul class="curriculum-card-topics">
                        ${item.topics.map(t => `<li>${t}</li>`).join('')}
                    </ul>` : '';
                return `
                    <div class="curriculum-card" onclick="window.location.href='tutorials/${item.htmlPath || item.file}.html'">
                        <div class="curriculum-card-head">
                            <span class="curriculum-card-num">${num}</span>
                            <h4 class="curriculum-card-title">${item.title}</h4>
                        </div>
                        ${topicsHtml}
                    </div>`;
            }).join('');
            const prevLink = prevPart ? `<a href="#" onclick="scrollToPart('part-${prevPart}'); return false;" class="part-prev-next-prev">上一部分 ${partNames[prevPart] || prevPart}</a>` : '';
            const nextLink = nextPart ? `<a href="#" onclick="scrollToPart('part-${nextPart}'); return false;" class="part-prev-next-next">下一部分 ${partNames[nextPart] || nextPart}</a>` : '';
            partContent = `
                <div class="curriculum-grid">
                    ${curriculumCards}
                </div>
                <div class="learning-advice">
                    <strong>学习建议</strong>
                    <p>${learningAdvice}</p>
                </div>
                <div class="part-prev-next">
                    ${prevLink}
                    ${nextLink}
                </div>`;
        } else {
            const partCards = partItems.map((item, itemIndex) => `
                <div class="doc-card" onclick="window.location.href='tutorials/${item.htmlPath || item.file}.html'" style="animation-delay: ${(partIndex * 10 + itemIndex) * 0.05}s">
                    <div class="doc-icon tutorial-icon">
                        <i class="fas fa-${item.icon}"></i>
                    </div>
                    <div class="doc-content">
                        <span class="doc-type-badge tutorial"><i class="fas fa-graduation-cap"></i> 教程</span>
                        <h3>${item.title}</h3>
                        <p>学习指南</p>
                        <div class="doc-meta">
                            <span><i class="fas fa-clock"></i> ${config.defaults.readingTime} 分钟</span>
                        </div>
                    </div>
                    <div class="doc-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            `).join('');
            partContent = `<div class="docs-grid">${partCards}</div>`;
        }

        const isFirstPart = partIndex === 0;
        return `
            <div class="part-section ${isFirstPart ? 'expanded' : ''}" id="part-${partName}">
                <div class="part-header" onclick="togglePart('part-${partName}')">
                    <h3>${partLabel}</h3>
                    <div class="part-toggle">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="part-content">
                ${partContent}
                </div>
            </div>
        `;
    }).join('');

    // 分析卡片
    const analysisCards = analysisNavItems.map((item, index) => `
        <div class="doc-card" onclick="window.location.href='analysis/${item.file}.html'" style="animation-delay: ${(tutorialsNavItems.length + index) * 0.1}s">
            <div class="doc-icon analysis-icon">
                <i class="fas fa-${item.icon}"></i>
            </div>
            <div class="doc-content">
                <span class="doc-type-badge analysis"><i class="fas fa-microscope"></i> 源码分析</span>
                <h3>${item.title}</h3>
                <p>深度解析</p>
                <div class="doc-meta">
                    <span><i class="fas fa-clock"></i> ${config.defaults.readingTime} 分钟</span>
                </div>
            </div>
            <div class="doc-arrow">
                <i class="fas fa-arrow-right"></i>
            </div>
        </div>
    `).join('');

    let versionToolbarSelect = '';
    if (module.versions && module.versions.length > 0) {
        versionToolbarSelect = `
                <div class="module-toolbar-version">
                    <label class="sr-only" for="versionSelect">Minecraft 版本</label>
                    <select id="versionSelect" class="toolbar-field toolbar-select" onchange="switchVersion(this.value)">
                        ${module.versions.map(v =>
                            `<option value="${v}" ${v === version ? 'selected' : ''}>Minecraft ${v}</option>`
                        ).join('')}
                    </select>
                </div>`;
    }

    const partJumpOptions = sortedParts.map(partName => {
        const pl = partNames[partName] || partName;
        return `<option value="part-${partName}">${pl.replace(/</g, '')}</option>`;
    }).join('');

    const partJumpHtml = sortedParts.length > 1 ? `
                <div class="module-toolbar-partjump">
                    <label class="part-jump-wrap"><span class="part-jump-icon"><i class="fas fa-list-ul"></i></span>
                    <select id="partJumpSelect" class="toolbar-field part-jump-select" aria-label="跳转到 Part">
                        <option value="">跳转到 Part…</option>
                        ${partJumpOptions}
                    </select></label>
                </div>` : '';

    const analysisTabsHtml = analysisNavItems.length > 0 ? `
                <div class="seg-tabs" role="tablist">
                    <button type="button" class="seg-tab active" role="tab" aria-selected="true" onclick="switchDocType('tutorials')">
                        <i class="fas fa-graduation-cap"></i> 教程
                    </button>
                    <button type="button" class="seg-tab" role="tab" aria-selected="false" onclick="switchDocType('analysis')">
                        <i class="fas fa-microscope"></i> 分析
                    </button>
                </div>` : '';

    const hasModuleToolbar = !!(versionToolbarSelect || analysisTabsHtml || partJumpHtml);

    const dropdownLinks = generateModuleDropdown(relativePath);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${THEME_STORAGE_INLINE}
    <title>${module.name}${versionInfo} - Minecraft Learning</title>
    <link rel="stylesheet" href="${relativePath}styles/main.css">
    <link rel="stylesheet" href="${relativePath}styles.css">
    <link rel="stylesheet" href="${relativePath}styles/site-shell.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        .module-index-page { --mi-accent: ${module.color}; --mi-grad: ${module.colorGradient}; }
        .doc-icon.tutorial-icon { background: ${module.colorGradient} !important; }
        .doc-icon.analysis-icon { background: linear-gradient(135deg, #525252, #a3a3a3) !important; }
        .sr-only {
            position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
            overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
        /* Hero：适度留白，避免顶栏遮挡 */
        .module-index-page .page-hero.module-index-hero {
            min-height: 0 !important;
            /* 顶栏 fixed 70px，避免标题被导航挡住 */
            padding: calc(70px + 1.35rem) 1.5rem 1.85rem !important;
            display: block !important;
            text-align: left !important;
            background: var(--mi-grad) !important;
        }
        .module-index-hero-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            justify-content: space-between;
            gap: 1.25rem 2rem;
        }
        .module-index-hero-text { flex: 1 1 280px; min-width: 0; }
        .module-index-page .module-index-hero .hero-badge,
        .module-index-page .module-index-hero .module-index-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(255,255,255,0.22) !important;
            backdrop-filter: blur(6px);
            color: #fff !important;
            padding: 0.35rem 0.85rem;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            animation: none;
        }
        .module-index-title {
            margin: 0 0 0.5rem 0;
            font-size: clamp(1.25rem, 2.8vw, 1.65rem);
            font-weight: 700;
            color: #fff;
            line-height: 1.35;
            letter-spacing: -0.02em;
        }
        .module-index-sub {
            margin: 0;
            font-size: 0.9rem;
            color: rgba(255,255,255,0.88);
            line-height: 1.55;
            max-width: 36rem;
        }
        .module-index-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
        }
        .stat-chip {
            display: inline-flex;
            align-items: baseline;
            gap: 0.35rem;
            padding: 0.45rem 0.75rem;
            border-radius: 10px;
            background: rgba(255,255,255,0.18);
            color: #fff;
            font-size: 0.8rem;
        }
        .stat-chip strong { font-size: 1rem; font-weight: 700; }
        .stat-chip span { opacity: 0.9; font-weight: 500; }
        .stat-chip.accent {
            background: rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.25);
        }
        /* 主内容区：浅底、全宽 */
        .module-index-page .main-content.module-index-main {
            margin-left: 0 !important;
            padding: 0 0 4rem;
            background: var(--bg-secondary);
        }
        .module-index-body { max-width: 1100px; padding-top: 0.5rem; }
        /* 顶栏：版本 + 分段切换 + Part 跳转 */
        .module-toolbar {
            position: sticky;
            top: 70px;
            z-index: 40;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 0.85rem 1.15rem;
            margin: 0 0 1.75rem;
            padding: 0.85rem 1.15rem;
            background: var(--bg-elevated);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-default);
            border-radius: 14px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .toolbar-field {
            font-size: 0.875rem;
            padding: 0.45rem 0.75rem;
            border-radius: 10px;
            border: 1px solid var(--border-default);
            background: var(--bg-primary);
            color: var(--text-primary);
            cursor: pointer;
            min-height: 38px;
        }
        .toolbar-select { min-width: 9.5rem; }
        .part-jump-wrap {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            margin: 0;
        }
        .part-jump-icon { color: var(--mi-accent); font-size: 0.9rem; }
        .part-jump-select { min-width: 11rem; max-width: 100%; }
        .seg-tabs {
            display: inline-flex;
            padding: 6px;
            border-radius: 12px;
            background: var(--bg-tertiary);
            gap: 8px;
        }
        .seg-tab {
            border: none;
            cursor: pointer;
            padding: 0.5rem 1.2rem;
            border-radius: 9px;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-secondary);
            background: transparent;
            transition: background 0.2s, color 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }
        .seg-tab:hover { color: var(--text-primary); background: var(--bg-secondary); }
        .seg-tab.active {
            background: var(--bg-primary);
            color: var(--mi-accent);
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .doc-section-head {
            margin: 0 0 1.4rem 0;
        }
        .doc-section-head h2 {
            margin: 0 0 0.4rem 0;
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .doc-section-head h2 i { color: var(--mi-accent); }
        .doc-section-hint {
            margin: 0;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        .doc-type-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .doc-type-badge.tutorial {
            background: linear-gradient(135deg, ${module.color}, ${module.color}99);
            color: white;
        }
        .doc-type-badge.analysis {
            background: linear-gradient(135deg, #525252, #a3a3a3);
            color: white;
        }
        /* Part 折叠块 */
        .part-section {
            margin-bottom: 22px;
            background: var(--bg-primary);
            border-radius: 14px;
            border: 1px solid var(--border-default);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
            transition: box-shadow 0.25s ease, border-color 0.25s;
        }
        .part-section.expanded {
            box-shadow: var(--shadow-md);
            border-color: var(--border-strong);
        }
        .part-header {
            border-left: none;
            padding: 1rem 1.25rem;
            margin: 0;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            background: linear-gradient(90deg, color-mix(in srgb, var(--text-primary) 4%, transparent), transparent);
            transition: background 0.2s;
        }
        .part-header:hover { background: color-mix(in srgb, var(--text-primary) 6%, transparent); }
        .part-header h3 {
            font-size: 1.05rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
            flex: 1;
        }
        .part-toggle {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            background: var(--bg-tertiary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--mi-accent);
            transition: transform 0.3s ease, background 0.2s;
            flex-shrink: 0;
        }
        .part-header:hover .part-toggle { background: color-mix(in srgb, var(--mi-accent) 14%, transparent); }
        .part-section.expanded .part-toggle { transform: rotate(180deg); }
        .part-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.45s ease, padding 0.45s ease;
            padding: 0 1.25rem;
            border-top: 1px solid transparent;
        }
        .part-section.expanded .part-content {
            max-height: 5000px;
            padding: 1.1rem 1.25rem 1.4rem;
            border-top-color: var(--border-muted);
        }
        /* 课程卡片网格 */
        .curriculum-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 1.25rem;
        }
        @media (max-width: 1100px) {
            .curriculum-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 800px) {
            .curriculum-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
            .curriculum-grid { grid-template-columns: 1fr; }
        }
        .curriculum-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 0.9rem 1rem;
            border: 1px solid var(--border-default);
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .curriculum-card:hover {
            border-color: ${module.color}55;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            transform: translateY(-1px);
        }
        .curriculum-card:focus-visible {
            outline: 2px solid ${module.color};
            outline-offset: 2px;
        }
        .curriculum-card-head {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
        }
        .curriculum-card-num {
            flex-shrink: 0;
            min-width: 2rem;
            height: 2rem;
            padding: 0 0.35rem;
            background: linear-gradient(135deg, #2d3e50, #1a252f);
            color: #fff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.75rem;
        }
        .curriculum-card-title {
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .curriculum-card-topics {
            margin: 0.4rem 0 0 0;
            padding-left: 1rem;
            color: var(--text-secondary);
            font-size: 0.78rem;
            line-height: 1.45;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .curriculum-card-topics li { list-style: disc; }
        .learning-advice {
            background: linear-gradient(90deg, ${module.color}12, transparent);
            border: 1px solid ${module.color}33;
            border-radius: 12px;
            padding: 0.75rem 1rem;
            margin-bottom: 0.85rem;
        }
        .learning-advice strong { color: var(--text-primary); font-size: 0.9rem; }
        .learning-advice p { margin: 0.35rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; }
        .part-prev-next {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            padding-top: 0.25rem;
        }
        .part-prev-next a {
            color: var(--mi-accent);
            font-weight: 600;
            font-size: 0.88rem;
        }
        .part-prev-next a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
            .module-toolbar { top: 70px; }
        }
    </style>
</head>
<body class="module-index-page">
    <div class="progress-bar" id="progressBar"></div>

    <nav class="navbar">
        <div class="nav-container">
            <a href="${relativePath}index.html" class="nav-logo">
                <i class="fas fa-cube"></i>
                <span>Minecraft Learning</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="${relativePath}index.html">首页</a></li>
                <li class="dropdown">
                    <a href="#">文档中心 <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        ${dropdownLinks}
                    </div>
                </li>
                <li><a href="${relativePath}about.html">关于</a></li>
            </ul>
            ${themeNavbarActionsHtml()}
        </div>
    </nav>

    <header class="page-hero module-index-hero" id="pageHero">
        <div class="module-index-hero-inner">
            <div class="module-index-hero-text">
                <div class="hero-badge module-index-badge">
                    <i class="fas fa-${module.icon}"></i>
                    ${module.name}
                </div>
                <h1 class="module-index-title">${module.description}</h1>
                <p class="module-index-sub">深入理解 ${module.name} 的核心架构与实现细节</p>
            </div>
            <div class="module-index-stats">
                <div class="stat-chip"><strong>${tutorialsNavItems.length + analysisNavItems.length}</strong><span>篇文档</span></div>
                ${version ? `<div class="stat-chip accent"><span>版本</span><strong>${version}</strong></div>` : ''}
            </div>
        </div>
    </header>

    <section class="section main-content module-index-main" id="mainContent">
        <div class="container module-index-body">
            ${hasModuleToolbar ? `
            <div class="module-toolbar" style="--module-accent: ${module.color};">
                <div class="module-toolbar-start" style="display:flex;flex-wrap:wrap;align-items:center;gap:1rem;">
                    ${versionToolbarSelect}
                    ${analysisTabsHtml}
                </div>
                ${partJumpHtml}
            </div>` : ''}

            <!-- 教程部分 -->
            <div id="tutorialsSection" class="doc-section">
                <div class="doc-section-head">
                    <h2><i class="fas fa-graduation-cap"></i> 教程目录 ${version || ''}</h2>
                    <p class="doc-section-hint">按 Part 展开章节，点击卡片进入阅读</p>
                </div>
                <div class="tutorials-by-part">
                    ${tutorialsByPartHtml || '<div class="empty-state"><i class="fas fa-folder-open"></i><p>暂无教程文档</p></div>'}
                </div>
            </div>

            <!-- 分析部分 -->
            ${analysisNavItems.length > 0 ? `
            <div id="analysisSection" class="doc-section" style="display: none;">
                <div class="doc-section-head">
                    <h2><i class="fas fa-microscope"></i> 源码分析 ${version || ''}</h2>
                    <p class="doc-section-hint">系统级解读，适合配合源码阅读</p>
                </div>
                <div class="docs-grid">
                    ${analysisCards}
                </div>
            </div>
            ` : ''}
        </div>
    </section>

    <script>
        ${module.versions && module.versions.length ? `
        function switchVersion(v) {
            window.location.href = '../' + v + '/index.html';
        }` : ''}

        function togglePart(partId) {
            const part = document.getElementById(partId);
            if (part) part.classList.toggle('expanded');
        }

        function scrollToPart(partId) {
            const part = document.getElementById(partId);
            if (!part) return;
            if (!part.classList.contains('expanded')) part.classList.add('expanded');
            setTimeout(() => {
                const toolbar = document.querySelector('.module-toolbar');
                const extra = toolbar ? toolbar.getBoundingClientRect().height + 24 : 120;
                const y = part.getBoundingClientRect().top + window.pageYOffset - extra;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }, 80);
        }

        function switchDocType(type) {
            const tutorialsSection = document.getElementById('tutorialsSection');
            const analysisSection = document.getElementById('analysisSection');
            const tabs = document.querySelectorAll('.seg-tab');
            const showTutorials = type === 'tutorials';
            tabs.forEach((btn, i) => {
                const isTutorialTab = i === 0;
                const on = showTutorials ? isTutorialTab : !isTutorialTab;
                btn.classList.toggle('active', on);
                btn.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            if (tutorialsSection) tutorialsSection.style.display = showTutorials ? 'block' : 'none';
            if (analysisSection) analysisSection.style.display = showTutorials ? 'none' : 'block';
        }

        document.addEventListener('DOMContentLoaded', () => {
            const firstPart = document.querySelector('.part-section');
            if (firstPart && !firstPart.classList.contains('expanded')) {
                firstPart.classList.add('expanded');
            }
            const pj = document.getElementById('partJumpSelect');
            if (pj) {
                pj.addEventListener('change', function() {
                    if (this.value) {
                        scrollToPart(this.value);
                        this.value = '';
                    }
                });
            }
        });
    </script>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <h3><i class="fas fa-cube"></i> Minecraft Learning</h3>
                    <p>开放、共享、探索 Minecraft 开发的无限可能</p>
                </div>
                <div class="footer-links">
                    <h4>文档</h4>
                    <ul>
                        ${generateModuleFooterLinks(relativePath)}
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>资源</h4>
                    <ul>
                        <li><a href="${relativePath}about.html">关于</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Minecraft Learning | 基于开放源码研究</p>
            </div>
        </div>
    </footer>

    <script src="${relativePath}script.js"></script>
    <script src="${relativePath}scripts/theme.js"></script>
    <style>
        .module-index-page .docs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 24px;
        }
        .module-index-page .tutorials-by-part {
            display: flex;
            flex-direction: column;
            gap: 26px;
        }
        .module-index-page .doc-card {
            background: var(--bg-primary);
            border-radius: 14px;
            padding: 1.25rem 1.35rem;
            display: flex;
            align-items: flex-start;
            gap: 18px;
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
            border: 1px solid var(--border-default);
            box-shadow: var(--shadow-sm);
            opacity: 1;
        }
        .module-index-page .doc-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: color-mix(in srgb, var(--mi-accent) 35%, transparent);
        }
        .module-index-page .doc-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.15rem;
            flex-shrink: 0;
        }
        .module-index-page .doc-content { flex: 1; min-width: 0; }
        .module-index-page .doc-content h3 { font-size: 1.05rem; color: var(--text-primary); margin-bottom: 0.35rem; line-height: 1.4; }
        .module-index-page .doc-content p { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.55rem; line-height: 1.45; }
        .module-index-page .doc-meta { font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.15rem; }
        .module-index-page .doc-arrow { color: var(--text-secondary); font-size: 1rem; transition: transform 0.2s ease; align-self: center; }
        .module-index-page .doc-card:hover .doc-arrow { transform: translateX(4px); color: var(--mi-accent); }
    </style>
</body>
</html>`;
}

function generateModuleFooterLinks(relativePath) {
    return Object.entries(modules).map(([key, module]) => {
        const href = module.versions && module.defaultVersion
            ? `${relativePath}docs/${module.slug}/${module.defaultVersion}/index.html`
            : `${relativePath}docs/${module.slug}/index.html`;
        return `<li><a href="${href}">${module.name}</a></li>`;
    }).join('\n                        ');
}

// ============================================
// 转换逻辑
// ============================================

function getMarkdownFiles(sourceDir, recursive = true) {
    if (!fs.existsSync(sourceDir)) {
        return [];
    }

    const files = [];
    
    function scanDir(dir, basePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;
            
            if (entry.isDirectory()) {
                // 递归扫描子目录（但跳过 node_modules 等）
                if (recursive && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    scanDir(fullPath, relativePath);
                }
            } else if (entry.isFile()) {
                // 检查是否是 Markdown 文件
                const isMarkdown = config.markdown.extensions.some(ext => entry.name.endsWith(ext));
                const isNotIgnored = !config.markdown.ignorePrefixes.some(prefix => entry.name.startsWith(prefix));
                
                if (isMarkdown && isNotIgnored) {
                    files.push({
                        name: entry.name,
                        path: fullPath,
                        relativePath: relativePath
                    });
                }
            }
        }
    }
    
    scanDir(sourceDir);
    return files;
}

function convertModule(moduleKey, specificVersion = null, docType = 'tutorials') {
    const module = modules[moduleKey];
    if (!module) {
        console.error(`错误: 未知的模组 "${moduleKey}"`);
        return;
    }

    const websiteRoot = path.resolve(__dirname, '..');

    // 根据类型选择导航
    const navConfig = docType === 'tutorials' ? tutorialsNavigation : analysisNavigation;
    const navItems = navConfig[moduleKey] || [];

    // 源文件路径
    let sourceDir;
    if (module.versions && module.versions.length > 0) {
        const version = specificVersion || module.defaultVersion || module.versions[0];
        sourceDir = path.resolve(websiteRoot, 'content', module.slug, version, docType);
    } else {
        sourceDir = path.resolve(websiteRoot, 'content', module.slug, docType);
    }

    if (!fs.existsSync(sourceDir)) {
        console.log(`跳过 ${module.name} ${docType}: 源目录不存在 (${sourceDir})`);
        return;
    }

    console.log(`\n转换 ${module.name} (${docType})...`);

    // 输出目录
    let outputDir = path.resolve(websiteRoot, module.docsDir);

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 如果有版本分支
    if (module.versions && module.versions.length > 0) {
        const versionsToProcess = specificVersion
            ? [specificVersion]
            : module.versions;

        versionsToProcess.forEach(version => {
            // 创建版本目录
            const versionDir = path.join(outputDir, version);
            if (!fs.existsSync(versionDir)) {
                fs.mkdirSync(versionDir, { recursive: true });
            }

            // 创建类型目录 (tutorials/analysis)
            const typeDir = path.join(versionDir, docType);
            if (!fs.existsSync(typeDir)) {
                fs.mkdirSync(typeDir, { recursive: true });
            }

            // 获取该版本的导航
            const versionNavItems = navConfig[moduleKey] || [];

            // 获取该版本的源目录
            const versionSourceDir = path.resolve(websiteRoot, '..', 'content', module.slug, version, docType);

            // 转换该版本的所有文档
            if (fs.existsSync(versionSourceDir)) {
                const files = getMarkdownFiles(versionSourceDir);

                files.forEach(fileInfo => {
                    const sourcePath = fileInfo.path;
                    const content = fs.readFileSync(sourcePath, 'utf-8');
                    const { metadata, content: markdownContent } = parseFrontmatter(content);

                    // 使用文件名（不含路径）作为 slug
                    const slug = fileInfo.name.replace(/\.(md|markdown)$/, '');
                    const title = metadata.title || slug.replace(/-/g, ' ');
                    const readingTime = metadata.readingTime || config.defaults.readingTime;

                    const doc = {
                        slug,
                        title,
                        readingTime,
                        content: parseMarkdown(markdownContent)
                    };

                    const html = generateDocHTML(doc, module, versionNavItems, version, docType);
                    fs.writeFileSync(path.join(typeDir, `${slug}.html`), html);
                    console.log(`  - ${docType}/${slug}.html`);
                });
            }
        });
    } else {
        // 无版本分支的模组

        // 创建类型目录
        const typeDir = path.join(outputDir, docType);
        if (!fs.existsSync(typeDir)) {
            fs.mkdirSync(typeDir, { recursive: true });
        }

        // 转换所有文档
        const files = getMarkdownFiles(sourceDir);

        files.forEach(fileInfo => {
            const sourcePath = fileInfo.path;
            const content = fs.readFileSync(sourcePath, 'utf-8');
            const { metadata, content: markdownContent } = parseFrontmatter(content);

            // 使用文件名（不含路径）作为 slug
            const slug = fileInfo.name.replace(/\.(md|markdown)$/, '');
            const title = metadata.title || slug.replace(/-/g, ' ');
            const readingTime = metadata.readingTime || config.defaults.readingTime;

            const doc = {
                slug,
                title,
                readingTime,
                content: parseMarkdown(markdownContent)
            };

            const html = generateDocHTML(doc, module, navItems, null, docType);
            fs.writeFileSync(path.join(typeDir, `${slug}.html`), html);
            console.log(`  - ${docType}/${slug}.html`);
        });
    }

    console.log(`完成 ${module.name} (${docType})`);
}

function generateModuleIndexPage(moduleKey) {
    const module = modules[moduleKey];
    if (!module) return;

    const websiteRoot = path.resolve(__dirname, '..');
    const outputDir = path.resolve(websiteRoot, module.docsDir);

    if (module.versions && module.versions.length > 0) {
        // 有版本分支 - 为每个版本生成索引页
        module.versions.forEach(version => {
            const versionDir = path.join(outputDir, version);

            // 扫描该版本的教程和分析文件
            const tutorialsSourceDir = path.resolve(websiteRoot, 'content', module.slug, version, 'tutorials');
            const analysisSourceDir = path.resolve(websiteRoot, 'content', module.slug, version, 'analysis');

            const actualTutorials = getActualDocFiles(tutorialsSourceDir);
            const actualAnalysis = getActualDocFiles(analysisSourceDir);

            // MC 教程：与 config 合并，补充 title/icon/topics 用于课程卡片展示
            const navConfig = tutorialsNavigation.mc || [];
            const tutorialsWithConfig = actualTutorials.map(t => {
                const fromConfig = navConfig.find(n => n.file === t.file);
                if (!fromConfig) return t;
                return { ...t, title: fromConfig.title, icon: fromConfig.icon || t.icon, topics: fromConfig.topics };
            });

            // 生成索引页
            const indexContent = generateModuleIndex(module, tutorialsWithConfig, actualAnalysis, version);
            fs.writeFileSync(path.join(versionDir, 'index.html'), indexContent);
            console.log(`生成 ${module.name} ${version} 索引页`);
        });
    } else {
        // 无版本分支 - 扫描实际存在的文件
        const tutorialsSourceDir = path.resolve(websiteRoot, 'content', module.slug, 'tutorials');
        const analysisSourceDir = path.resolve(websiteRoot, 'content', module.slug, 'analysis');

        const actualTutorials = getActualDocFiles(tutorialsSourceDir);
        const actualAnalysis = getActualDocFiles(analysisSourceDir);

        const indexContent = generateModuleIndex(module, actualTutorials, actualAnalysis);
        fs.writeFileSync(path.join(outputDir, 'index.html'), indexContent);
        console.log(`生成 ${module.name} 索引页`);
    }
}

// 获取实际存在的文档文件，转换为导航项格式
function getActualDocFiles(sourceDir, recursive = true) {
    const files = getMarkdownFiles(sourceDir, recursive);
    return files.map(f => {
        const slug = f.name.replace(/\.(md|markdown)$/, '');
        let title = slug.replace(/-/g, ' ');
        let icon = 'file-alt';
        let part = 'Other';

        // 解析 Part 信息
        const partMatch = f.path.match(/[\\/]Part-([^\\/]+)[\\/]/);
        if (partMatch) {
            part = partMatch[1];
        }

        // 计算相对路径（保留 Part 目录）
        const relativePath = f.path.replace(/\\/g, '/');
        const parts = relativePath.split('/');
        const tutorialsIndex = parts.indexOf('tutorials');
        let subPath = '';
        if (tutorialsIndex !== -1) {
            subPath = parts.slice(tutorialsIndex + 1).join('/').replace(/\.(md|markdown)$/, '').replace(/\\/g, '/');
        }

        try {
            const content = fs.readFileSync(f.path, 'utf-8');
            const { metadata } = parseFrontmatter(content);
            if (metadata.title) {
                title = metadata.title;
            }
        } catch (e) {
            // 忽略读取错误
        }

        // htmlPath：相对 tutorials/ 的路径（含 Part 子目录），与 convert.js 输出目录一致
        const htmlPath = subPath || slug;

        return {
            file: slug,
            htmlPath,
            title: title,
            icon: icon,
            part: part
        };
    });
}

// ============================================
// 主函数
// ============================================

function main() {
    const args = process.argv.slice(2);
    const target = args[0] || 'all';

    // 解析参数：converter.js [模组] [版本] [类型]
    // 版本可以是具体值或 'null'
    // 类型可以是 'tutorials' 或 'analysis'
    const specificVersion = args[1];
    const docType = args[2] || 'tutorials';

    console.log('========================================');
    console.log('  MC 开发文档转换器');
    console.log('========================================\n');

    if (target === 'all') {
        // 转换所有模组的所有文档
        Object.keys(modules).forEach(moduleKey => {
            // 先生成索引页
            generateModuleIndexPage(moduleKey);

            // 转换教程
            convertModule(moduleKey, null, 'tutorials');
            // 转换分析
            convertModule(moduleKey, null, 'analysis');
        });
    } else if (target === 'list') {
        console.log('可用模组:');
        Object.entries(modules).forEach(([key, module]) => {
            console.log(`  - ${key}: ${module.name}`);
            if (module.versions) {
                console.log(`    版本: ${module.versions.join(', ')}`);
            } else {
                console.log(`    版本: 无版本分支`);
            }
        });
    } else if (target === 'index') {
        // 只生成索引页
        if (specificVersion && modules[specificVersion]) {
            generateModuleIndexPage(specificVersion);
        } else {
            Object.keys(modules).forEach(moduleKey => {
                generateModuleIndexPage(moduleKey);
            });
        }
    } else {
        // 转换特定模组
        // 参数格式: converter.js [模组] [版本] [类型]
        // 例如: converter.js iris null tutorials
        //       converter.js mc 1.21 tutorials
        //       converter.js iris null analysis

        const moduleKey = target;
        const version = specificVersion === 'null' || specificVersion === undefined ? null : specificVersion;
        const type = docType === 'tutorials' || docType === 'analysis' ? docType : 'tutorials';

        console.log(`参数: 模块=${moduleKey}, 版本=${version}, 类型=${type}`);

        generateModuleIndexPage(moduleKey);
        convertModule(moduleKey, version, type);
    }

    console.log('\n========================================');
    console.log('  转换完成!');
    console.log('========================================');
}

main();
