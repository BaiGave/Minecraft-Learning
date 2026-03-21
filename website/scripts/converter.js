/**
 * 通用文档转换脚本
 * 将 Markdown 文件转换为带主题的 HTML 文档页面
 *
 * 使用方法：
 * 1. 修改 config.js 中的模组配置
 * 2. 运行 node converter.js [模组名] [版本]
 *    - node converter.js iris tutorials     # 转换 Iris 教程
 *    - node converter.js iris analysis     # 转换 Iris 分析
 *    - node converter.js mc 1.21 tutorials # 转换 MC 1.21 教程
 *    - node converter.js mc 1.21 analysis # 转换 MC 1.21 分析
 *    - node converter.js all              # 转换所有
 */

const fs = require('fs');
const path = require('path');
const { modules, navigation, tutorialsNavigation, analysisNavigation, moduleCards, config, partLearningAdvice } = require('./config');

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

    // 图片
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="doc-image">');

    // 链接
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

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

// ============================================
// HTML 生成器
// ============================================

function generateDocHTML(doc, module, navItems, version = null, docType = 'analysis') {
    // 根据类型调整相对路径
    let relativePath;
    let baseDir;
    if (version) {
        relativePath = docType === 'tutorials' ? '../../../..' : '../../..';
        baseDir = docType === 'tutorials' ? `../../..` : `../..`;
    } else {
        relativePath = docType === 'tutorials' ? '../../..' : '../..';
        baseDir = `../..`;
    }

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
    <title>${doc.title} - ${module.name}</title>
    <link rel="stylesheet" href="${relativePath}/styles.css">
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
        .breadcrumb a { color: ${module.color}; }
        .breadcrumb i { color: #ccc; }
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
            background: linear-gradient(135deg, #E07A5F, #F2CC8F);
            color: white;
        }
    </style>
</head>
<body>
    <div class="progress-bar" id="progressBar"></div>

    <nav class="navbar docs-nav">
        <div class="nav-container">
            <a href="${relativePath}/index.html" class="nav-logo">
                <i class="fas fa-cube"></i>
                <span>MC 开发文档</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="${relativePath}/index.html">首页</a></li>
                <li class="dropdown">
                    <a href="#">文档中心 <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        ${generateModuleDropdown(relativePath)}
                    </div>
                </li>
                <li><a href="${relativePath}/catalog.html">文档目录</a></li>
                <li><a href="${relativePath}/about.html">关于</a></li>
            </ul>
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
                    <a href="${relativePath}/index.html">首页</a>
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

    <script src="${relativePath}/script.js"></script>
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
            ? `${relativePath}/docs/${module.slug}/${module.defaultVersion}/index.html`
            : `${relativePath}/docs/${module.slug}/index.html`;
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
    const relativePath = version ? '../../../..' : '../../..';
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
                    <div class="curriculum-card" onclick="window.location.href='tutorials/${item.file}.html'">
                        <div class="curriculum-card-num">${num}</div>
                        <h4 class="curriculum-card-title">${num}: ${item.title}</h4>
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
                <div class="doc-card" onclick="window.location.href='tutorials/${item.file}.html'" style="animation-delay: ${(partIndex * 10 + itemIndex) * 0.05}s">
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

    let versionSelector = '';
    if (module.versions && module.versions.length > 0) {
        versionSelector = `
            <div class="version-selector">
                <select id="versionSelect" class="version-dropdown" onchange="switchVersion(this.value)">
                    ${module.versions.map(v =>
                        `<option value="${v}" ${v === version ? 'selected' : ''}>Minecraft ${v}</option>`
                    ).join('')}
                </select>
            </div>
            <script>
                function switchVersion(v) {
                    window.location.href = '../' + v + '/index.html';
                }
            </script>`;
    }

    const dropdownLinks = generateModuleDropdown(relativePath);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${module.name}${versionInfo} - MC 开发文档中心</title>
    <link rel="stylesheet" href="${relativePath}/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        .page-hero { background: ${module.colorGradient}; }
        .page-hero .hero-badge { background: rgba(255,255,255,0.2); }
        .page-hero .stat-number { color: rgba(255,255,255,0.9); }
        .doc-icon.tutorial-icon { background: ${module.colorGradient} !important; }
        .doc-icon.analysis-icon { background: linear-gradient(135deg, #E07A5F, #F2CC8F) !important; }
        .section-header { text-align: center; margin-bottom: 40px; }
        .version-selector { text-align: center; margin-bottom: 30px; }
        .version-dropdown {
            padding: 12px 24px;
            font-size: 1rem;
            border: 2px solid ${module.color};
            border-radius: var(--radius-md);
            background: white;
            color: var(--text-primary);
            cursor: pointer;
        }
        .section-divider {
            display: flex;
            align-items: center;
            gap: 20px;
            margin: 40px 0;
        }
        .section-divider::before,
        .section-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gray-light), transparent);
        }
        .section-divider span {
            font-size: 0.9rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        .doc-type-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .doc-type-badge.tutorial {
            background: linear-gradient(135deg, ${module.color}, ${module.color}99);
            color: white;
        }
        .doc-type-badge.analysis {
            background: linear-gradient(135deg, #E07A5F, #F2CC8F);
            color: white;
        }
        /* 固定侧边栏导航 */
        .sidebar-nav {
            position: fixed;
            left: 0;
            top: 70px;
            width: 280px;
            height: calc(100vh - 70px);
            background: white;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            overflow-y: auto;
            z-index: 100;
            padding: 20px 0;
            transition: transform 0.3s ease;
        }
        .sidebar-nav::-webkit-scrollbar {
            width: 6px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
            background: #ddd;
            border-radius: 3px;
        }
        .sidebar-nav-item {
            padding: 12px 24px;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 0.95rem;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }
        .sidebar-nav-item:hover {
            background: ${module.color}0D;
            color: var(--text-primary);
        }
        .sidebar-nav-item.active {
            background: ${module.color}1A;
            color: ${module.color};
            border-left-color: ${module.color};
            font-weight: 600;
        }
        .sidebar-toggle {
            position: fixed;
            left: 20px;
            top: 80px;
            width: 40px;
            height: 40px;
            background: ${module.color};
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            z-index: 101;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.3s;
        }
        .sidebar-toggle:hover {
            background: ${module.color}dd;
            transform: scale(1.05);
        }
        .sidebar-nav.hidden {
            transform: translateX(-100%);
        }
        .main-content {
            margin-left: 280px;
            transition: margin-left 0.3s ease;
        }
        .main-content.expanded {
            margin-left: 0;
        }
        /* 查看「分析」时收起教程侧栏与 Part 快捷条，主区域全宽 */
        .main-content.doc-mode-analysis {
            margin-left: 0 !important;
        }
        @media (max-width: 1024px) {
            .sidebar-nav {
                transform: translateX(-100%);
            }
            .sidebar-nav.show {
                transform: translateX(0);
            }
            .main-content {
                margin-left: 0;
            }
        }
        
        /* 顶部快速导航 */
        .quick-nav {
            position: sticky;
            top: 70px;
            background: white;
            border-bottom: 2px solid #e9ecef;
            padding: 15px 0;
            z-index: 99;
            margin-bottom: 30px;
        }
        .quick-nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            overflow-x: auto;
            display: flex;
            gap: 10px;
        }
        .quick-nav::-webkit-scrollbar {
            height: 4px;
        }
        .quick-nav::-webkit-scrollbar-thumb {
            background: #ddd;
            border-radius: 2px;
        }
        .quick-nav-item {
            padding: 8px 16px;
            background: #f8f9fa;
            border-radius: 20px;
            white-space: nowrap;
            cursor: pointer;
            font-size: 0.9rem;
            color: var(--text-secondary);
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        .quick-nav-item:hover {
            background: ${module.color}1A;
            color: ${module.color};
        }
        .quick-nav-item.active {
            background: ${module.color};
            color: white;
            border-color: ${module.color};
        }
        
        /* 折叠式Part布局 */
        .part-section {
            margin-bottom: 20px;
            background: white;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .part-section.expanded {
            box-shadow: var(--shadow-md);
        }
        .part-header {
            border-left: 4px solid ${module.color};
            padding: 20px 24px;
            margin: 0;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s;
        }
        .part-header:hover {
            background: ${module.color}0D;
        }
        .part-header h3 {
            font-size: 1.3rem;
            color: var(--text-primary);
            margin: 0;
            flex: 1;
        }
        .part-toggle {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${module.color}1A;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${module.color};
            transition: transform 0.3s ease;
        }
        .part-section.expanded .part-toggle {
            transform: rotate(180deg);
        }
        .part-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease, padding 0.4s ease;
            padding: 0 24px;
        }
        .part-section.expanded .part-content {
            max-height: 5000px;
            padding: 24px;
        }
        /* 教程课程卡片式布局 */
        .curriculum-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-bottom: 28px;
        }
        @media (max-width: 900px) {
            .curriculum-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
            .curriculum-grid { grid-template-columns: 1fr; }
        }
        .curriculum-card {
            background: white;
            border-radius: var(--radius-md);
            padding: 24px;
            box-shadow: var(--shadow-md);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .curriculum-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        .curriculum-card-num {
            width: 48px;
            height: 48px;
            background: #2c3e50;
            color: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 14px;
        }
        .curriculum-card-title {
            font-size: 1.05rem;
            color: var(--text-primary);
            margin: 0 0 12px 0;
            line-height: 1.4;
        }
        .curriculum-card-topics {
            margin: 0;
            padding-left: 18px;
            color: var(--text-secondary);
            font-size: 0.9rem;
            line-height: 1.6;
        }
        .curriculum-card-topics li { list-style: disc; }
        .learning-advice {
            background: rgba(0,0,0,0.04);
            border-left: 4px solid ${module.color};
            padding: 16px 20px;
            border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
            margin-bottom: 24px;
        }
        .learning-advice strong { color: var(--text-primary); }
        .learning-advice p { margin: 8px 0 0 0; color: var(--text-secondary); font-size: 0.95rem; }
        .part-prev-next {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }
        .part-prev-next a {
            color: ${module.color};
            font-weight: 600;
        }
        .part-prev-next a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="progress-bar" id="progressBar"></div>

    <nav class="navbar" style="background: ${module.color};">
        <div class="nav-container">
            <a href="${relativePath}/index.html" class="nav-logo" style="color: white;">
                <i class="fas fa-cube"></i>
                <span>MC 开发文档</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()" style="color: white;">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="${relativePath}/index.html" style="color: rgba(255,255,255,0.9);">首页</a></li>
                <li class="dropdown">
                    <a href="#" class="active" style="color: white;">文档中心 <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        ${dropdownLinks}
                    </div>
                </li>
                <li><a href="${relativePath}/catalog.html" style="color: rgba(255,255,255,0.9);">文档目录</a></li>
                <li><a href="${relativePath}/about.html" style="color: rgba(255,255,255,0.9);">关于</a></li>
            </ul>
        </div>
    </nav>

    <header class="page-hero">
        <div class="hero-content">
            <div class="hero-badge">
                <i class="fas fa-${module.icon}"></i>
                ${module.name}
            </div>
            <h1>${module.description}</h1>
            <p class="hero-subtitle">深入理解 ${module.name} 的核心架构与实现细节</p>
            <div class="hero-stats">
                <div class="stat">
                    <span class="stat-number">${tutorialsNavItems.length + analysisNavItems.length}</span>
                    <span class="stat-label">核心文档</span>
                </div>
                ${version ? `<div class="stat">
                    <span class="stat-number">${version}</span>
                    <span class="stat-label">Minecraft 版本</span>
                </div>` : ''}
            </div>
        </div>
    </header>

    <!-- 固定侧边栏导航 -->
    <button class="sidebar-toggle" onclick="toggleSidebar()" id="sidebarToggle">
        <i class="fas fa-bars"></i>
    </button>
    <nav class="sidebar-nav" id="sidebarNav">
        ${sortedParts.map(partName => {
            const partLabel = partNames[partName] || partName;
            return `<div class="sidebar-nav-item ${partName === sortedParts[0] ? 'active' : ''}" onclick="scrollToPart('part-${partName}')">${partLabel}</div>`;
        }).join('')}
    </nav>

    <section class="section main-content" id="mainContent">
        <div class="container">
            
            <!-- 顶部快速导航（仅教程模式显示） -->
            <div class="quick-nav" id="tutorialQuickNav">
                <div class="quick-nav-container">
                    ${sortedParts.map((partName, idx) => {
                        const shortLabel = partName.replace(/^[0-9]+-/, '').replace(/-/g, ' ').substring(0, 10);
                        return `<div class="quick-nav-item ${idx === 0 ? 'active' : ''}" onclick="scrollToPart('part-${partName}')">${partName}</div>`;
                    }).join('')}
                </div>
            </div>
            
            ${versionSelector}

            <!-- 教程/分析切换标签 -->
            ${analysisNavItems.length > 0 ? `
            <div class="doc-type-tabs" style="display: flex; justify-content: center; gap: 10px; margin-bottom: 30px;">
                <button class="tab-btn active" onclick="switchDocType('tutorials')" style="padding: 10px 20px; border: 2px solid ${module.color}; background: ${module.color}; color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-graduation-cap"></i> 教程
                </button>
                <button class="tab-btn" onclick="switchDocType('analysis')" style="padding: 10px 20px; border: 2px solid ${module.color}; background: white; color: ${module.color}; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-microscope"></i> 分析
                </button>
            </div>
            ` : ''}

            <!-- 教程部分 -->
            <div id="tutorialsSection" class="doc-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="fas fa-graduation-cap"></i>
                        教程 ${version || ''}
                    </h2>
                </div>
                <div class="tutorials-by-part">
                    ${tutorialsByPartHtml || '<div class="empty-state"><i class="fas fa-folder-open"></i><p>暂无教程文档</p></div>'}
                </div>
            </div>

            <!-- 分析部分 -->
            ${analysisNavItems.length > 0 ? `
            <div id="analysisSection" class="doc-section" style="display: none;">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="fas fa-microscope"></i>
                        源码分析 ${version || ''}
                    </h2>
                </div>
                <div class="docs-grid">
                    ${analysisCards}
                </div>
            </div>
            ` : ''}
        </div>
    </section>

    <script>
        // 折叠/展开Part
        function togglePart(partId) {
            const part = document.getElementById(partId);
            if (part) {
                part.classList.toggle('expanded');
                updateActiveNav(partId);
            }
        }
        
        // 滚动到指定Part并展开
        function scrollToPart(partId) {
            const part = document.getElementById(partId);
            if (part) {
                // 展开Part
                if (!part.classList.contains('expanded')) {
                    part.classList.add('expanded');
                }
                // 滚动到Part
                setTimeout(() => {
                    const offset = 140; // 导航栏 + 快速导航的高度
                    const elementPosition = part.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
                // 更新导航状态
                updateActiveNav(partId);
            }
        }
        
        // 更新导航高亮
        function updateActiveNav(partId) {
            // 更新侧边栏导航
            document.querySelectorAll('.sidebar-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const sidebarItem = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(item => {
                return item.getAttribute('onclick') && item.getAttribute('onclick').includes(partId);
            });
            if (sidebarItem) {
                sidebarItem.classList.add('active');
            }
            
            // 更新顶部快速导航
            document.querySelectorAll('.quick-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const quickNavItem = Array.from(document.querySelectorAll('.quick-nav-item')).find(item => {
                return item.getAttribute('onclick') && item.getAttribute('onclick').includes(partId);
            });
            if (quickNavItem) {
                quickNavItem.classList.add('active');
            }
        }
        
        // 切换侧边栏
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebarNav');
            const mainContent = document.getElementById('mainContent');
            if (sidebar && mainContent) {
                sidebar.classList.toggle('hidden');
                if (window.innerWidth > 1024) {
                    mainContent.classList.toggle('expanded');
                } else {
                    sidebar.classList.toggle('show');
                }
            }
        }
        
        // 监听滚动，自动更新导航高亮
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const parts = document.querySelectorAll('.part-section');
                const offset = 200;
                let currentPart = null;
                
                parts.forEach(part => {
                    const rect = part.getBoundingClientRect();
                    if (rect.top <= offset && rect.bottom >= offset) {
                        currentPart = part.id;
                    }
                });
                
                if (currentPart) {
                    updateActiveNav(currentPart);
                }
            }, 100);
        });
        
        // 默认展开第一个Part
        document.addEventListener('DOMContentLoaded', () => {
            const firstPart = document.querySelector('.part-section');
            if (firstPart && !firstPart.classList.contains('expanded')) {
                firstPart.classList.add('expanded');
            }
        });
        
        function switchDocType(type) {
            const tutorialsSection = document.getElementById('tutorialsSection');
            const analysisSection = document.getElementById('analysisSection');
            const tabs = document.querySelectorAll('.tab-btn');
            const tutorialQuickNav = document.getElementById('tutorialQuickNav');
            const sidebar = document.getElementById('sidebarNav');
            const sidebarBtn = document.getElementById('sidebarToggle');
            const mainContent = document.getElementById('mainContent');
            const showTutorials = type === 'tutorials';
            
            tabs.forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.includes(showTutorials ? '教程' : '分析')) {
                    btn.classList.add('active');
                    if (showTutorials) {
                        btn.style.background = '${module.color}';
                        btn.style.color = 'white';
                    } else {
                        btn.style.background = 'white';
                        btn.style.color = '${module.color}';
                    }
                } else {
                    if (showTutorials) {
                        btn.style.background = 'white';
                        btn.style.color = '${module.color}';
                    } else {
                        btn.style.background = '${module.color}';
                        btn.style.color = 'white';
                    }
                }
            });
            
            if (tutorialsSection) tutorialsSection.style.display = showTutorials ? 'block' : 'none';
            if (analysisSection) analysisSection.style.display = showTutorials ? 'none' : 'block';
            if (tutorialQuickNav) tutorialQuickNav.style.display = showTutorials ? '' : 'none';
            if (sidebar) sidebar.style.display = showTutorials ? '' : 'none';
            if (sidebarBtn) sidebarBtn.style.display = showTutorials ? '' : 'none';
            if (mainContent) {
                if (showTutorials) mainContent.classList.remove('doc-mode-analysis');
                else mainContent.classList.add('doc-mode-analysis');
            }
        }
    </script>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <h3><i class="fas fa-cube"></i> MC 开发文档</h3>
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
                        <li><a href="${relativePath}/catalog.html">文档目录</a></li>
                        <li><a href="${relativePath}/about.html">关于</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 MC 开发文档中心 | 基于开放源码研究</p>
            </div>
        </div>
    </footer>

    <script src="${relativePath}/script.js"></script>
    <style>
        .docs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
        }
        .tutorials-by-part {
            display: flex;
            flex-direction: column;
            gap: 40px;
        }
        .doc-card {
            background: white;
            border-radius: var(--radius-lg);
            padding: 25px;
            display: flex;
            align-items: flex-start;
            gap: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-sm);
            animation: fadeInUp 0.5s ease forwards;
            opacity: 0;
        }
        /* 分析区默认隐藏，子元素动画不会在首屏完成，否则会一直保持 opacity:0 */
        #analysisSection .doc-card {
            opacity: 1;
            animation: none;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .doc-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
        }
        .doc-icon {
            width: 50px;
            height: 50px;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.3rem;
            flex-shrink: 0;
        }
        .doc-content { flex: 1; }
        .doc-content h3 { font-size: 1.15rem; color: var(--text-primary); margin-bottom: 8px; }
        .doc-content p { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px; }
        .doc-meta { font-size: 0.8rem; color: var(--text-secondary); }
        .doc-arrow { color: var(--text-secondary); font-size: 1.2rem; transition: transform 0.3s ease; }
        .doc-card:hover .doc-arrow { transform: translateX(5px); color: ${module.color}; }
    </style>
</body>
</html>`;
}

function generateModuleFooterLinks(relativePath) {
    return Object.entries(modules).map(([key, module]) => {
        const href = module.versions
            ? `${relativePath}/docs/${module.slug}/index.html`
            : `${relativePath}/docs/${module.slug}/index.html`;
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
        sourceDir = path.resolve(websiteRoot, '..', 'content', module.slug, version, docType);
    } else {
        sourceDir = path.resolve(websiteRoot, '..', 'content', module.slug, docType);
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
            const tutorialsSourceDir = path.resolve(websiteRoot, '..', 'content', module.slug, version, 'tutorials');
            const analysisSourceDir = path.resolve(websiteRoot, '..', 'content', module.slug, version, 'analysis');

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
        const tutorialsSourceDir = path.resolve(websiteRoot, '..', 'content', module.slug, 'tutorials');
        const analysisSourceDir = path.resolve(websiteRoot, '..', 'content', module.slug, 'analysis');

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

        return {
            file: slug,  // 仅用文件名，输出为扁平 tutorials/xx.html
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
