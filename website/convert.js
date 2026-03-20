/**
 * Markdown to HTML Converter for Minecraft Tutorial Website
 * Converts tutorial markdown files to styled HTML pages
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    tutorialsDir: path.join(__dirname, '..', 'tutorials'),
    outputDir: path.join(__dirname, 'tutorials'),
    websiteDir: __dirname
};

// Part configuration
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

// Ensure output directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Read file with BOM handling
function readFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.replace(/^\uFEFF/, '');
    } catch (e) {
        console.error(`Error reading file: ${filePath}`, e);
        return null;
    }
}

// Escape HTML entities
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Parse markdown to extract title, content and headings for TOC
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
                    html += `<pre><code>${escapeHtml(codeContent.join('\n'))}</code></pre>\n`;
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
                    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => {
                        // 站内 .md 链接改为 .html，点击才不会打开不存在的 .md 文件
                        const isMd = /\.md(#.*)?$/i.test(url);
                        const href = isMd ? url.replace(/\.md(#.*)?$/i, (_, h) => '.html' + (h || '')) : url;
                        const displayText = text.replace(/\.md$/i, '');
                        return `<a href="${href}">${displayText}</a>`;
                    });

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

// Generate HTML page
function generateHTML(partKey, filename, markdownContent) {
    const part = PARTS[partKey];
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

    // Get previous part info
    let prevPartInfo = null;
    if (part.prev) {
        for (const [k, v] of Object.entries(PARTS)) {
            if (v.next === part.prev) {
                prevPartInfo = v;
                break;
            }
        }
    }

    // Get next part info
    let nextPartInfo = null;
    if (part.next) {
        for (const [k, v] of Object.entries(PARTS)) {
            if (v.prev === part.next) {
                nextPartInfo = v;
                break;
            }
        }
    }

    // Navigation buttons
    let prevNav = '';
    let nextNav = '';

    if (prevPartInfo) {
        prevNav = `<a href="../../${part.prev}" class="tutorial-nav-btn prev">
            <span>上一部分</span>
            <strong><i class="fas fa-arrow-left"></i> ${prevPartInfo.title}</strong>
        </a>`;
    }

    if (nextPartInfo) {
        nextNav = `<a href="../../${part.next}" class="tutorial-nav-btn next">
            <span>下一部分</span>
            <strong>${nextPartInfo.title} <i class="fas fa-arrow-right"></i></strong>
        </a>`;
    }

    // Find adjacent chapters within the same part
    const partDir = path.join(CONFIG.tutorialsDir, partKey);
    let chapterList = [];
    if (fs.existsSync(partDir)) {
        chapterList = fs.readdirSync(partDir)
            .filter(f => f.endsWith('.md'))
            .sort();
    }

    const currentIndex = chapterList.findIndex(f => f === filename);
    let chapterNav = '';

    if (currentIndex > 0) {
        const prevChapter = chapterList[currentIndex - 1];
        const prevTitle = parseMarkdown(readFile(path.join(partDir, prevChapter))).title;
        chapterNav += `<a href="${prevChapter.replace('.md', '.html')}" class="tutorial-nav-btn prev">
            <span>上一章</span>
            <strong><i class="fas fa-arrow-left"></i> ${prevTitle}</strong>
        </a>`;
    }

    if (currentIndex < chapterList.length - 1 && currentIndex >= 0) {
        const nextChapter = chapterList[currentIndex + 1];
        const nextTitle = parseMarkdown(readFile(path.join(partDir, nextChapter))).title;
        chapterNav += `<a href="${nextChapter.replace('.md', '.html')}" class="tutorial-nav-btn next">
            <span>下一章</span>
            <strong>${nextTitle} <i class="fas fa-arrow-right"></i></strong>
        </a>`;
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Minecraft 源码教程</title>
    <link rel="stylesheet" href="../../styles.css">
    <link rel="stylesheet" href="../../tutorial.css">
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
            <a href="../../index.html" class="nav-logo">
                <i class="fas fa-cube"></i>
                <span>MC 源码教程</span>
            </a>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <ul class="nav-links">
                <li><a href="../../index.html">首页</a></li>
                <li><a href="../../catalog.html">目录</a></li>
                <li><a href="../../roadmap.html">路线图</a></li>
                <li><a href="../../about.html">关于</a></li>
            </ul>
        </div>
    </nav>

    <div class="tutorial-page">
        <header class="tutorial-header" style="background: linear-gradient(135deg, ${part.color} 0%, ${part.color}88 100%);">
            <div class="container">
                <div class="tutorial-nav">
                    <div class="tutorial-breadcrumb">
                        <a href="../../index.html">首页</a>
                        <span>/</span>
                        <a href="../../catalog.html">目录</a>
                        <span>/</span>
                        <a href="../../part-${part.num}.html">Part-${part.num}</a>
                        <span>/</span>
                        <span>${title}</span>
                    </div>
                </div>
                <h1 class="tutorial-title">${title}</h1>
                ${subtitle ? `<p class="tutorial-subtitle">${subtitle}</p>` : ''}
                <div class="tutorial-meta">
                    <span><i class="fas fa-book"></i> Part-${part.num}: ${part.title}</span>
                    <span><i class="fas fa-file"></i> ${filename.replace('.md', '')}</span>
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
                    <h3 class="sidebar-title"><i class="fas fa-map"></i> 章节导航</h3>
                    <div class="part-nav">
                        ${chapterNav || (prevNav + nextNav)}
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

    <script src="../../script.js"></script>
    <script src="../../tutorial.js"></script>
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

// Main conversion function
function convertAll() {
    console.log('Starting Markdown to HTML conversion...\n');

    // Ensure output directory
    ensureDir(CONFIG.outputDir);

    let totalConverted = 0;

    // Process each part
    for (const [partKey, part] of Object.entries(PARTS)) {
        const partDir = path.join(CONFIG.tutorialsDir, partKey);
        const outputPartDir = path.join(CONFIG.outputDir, partKey);

        if (!fs.existsSync(partDir)) {
            console.log(`Part directory not found: ${partDir}`);
            continue;
        }

        ensureDir(outputPartDir);

        // Find all markdown files
        const files = fs.readdirSync(partDir).filter(f => f.endsWith('.md'));

        console.log(`Processing ${partKey} (${files.length} files)...`);

        for (const file of files) {
            const inputPath = path.join(partDir, file);
            const outputPath = path.join(outputPartDir, file.replace('.md', '.html'));

            const content = readFile(inputPath);
            if (!content) continue;

            const html = generateHTML(partKey, file, content);
            fs.writeFileSync(outputPath, html, 'utf8');
            totalConverted++;

            console.log(`  ✓ ${file} → ${file.replace('.md', '.html')}`);
        }

        console.log('');
    }

    console.log(`\nConversion complete! ${totalConverted} files converted.`);
    console.log(`Output directory: ${CONFIG.outputDir}`);
}

// Run conversion
convertAll();
