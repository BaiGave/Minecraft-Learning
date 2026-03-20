/**
 * 通用文档转换脚本
 * 将 Markdown 文件转换为带主题的 HTML 文档页面
 *
 * 使用方法：
 * 1. 修改 config.js 中的模组配置
 * 2. 运行 node converter.js [模组名] [版本]
 *    - node converter.js mc        # 转换 MC 所有版本
 *    - node converter.js mc 1.21 # 只转换 MC 1.21
 *    - node converter.js iris    # 转换 Iris
 *    - node converter.js sodium   # 转换 Sodium
 *    - node converter.js all      # 转换所有
 *    - node converter.js list     # 列出所有可用模组
 */

const fs = require('fs');
const path = require('path');
const { modules, navigation, moduleCards, config } = require('./config');

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

    // 预处理：保留代码块
    const codeBlocks = [];
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        const index = codeBlocks.length;
        codeBlocks.push({ lang: lang || 'text', code: code.trim() });
        return `§§§CODE_BLOCK_${index}§§§`;
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

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

    // 换行处理（保留段落）
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

    // 包装列表
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Mermaid 图表
    html = html.replace(/```mermaid\n?([\s\S]*?)```/g, '<div class="mermaid">$1</div>');

    // 恢复代码块
    codeBlocks.forEach((block, index) => {
        const escapedCode = block.code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        html = html.replace(`§§§CODE_BLOCK_${index}§§§`,
            `<pre class="code-block"><code class="language-${block.lang}">${escapedCode}</code></pre>`);
    });

    // 清理多余的br
    html = html.replace(/<br>\n(?=<(ul|ol|table|pre|blockquote))/g, '');
    html = html.replace(/(<(ul|ol|table|pre|blockquote).*?)<br>/gs, '$1');

    return html;
}

// ============================================
// HTML 生成器
// ============================================

function generateDocHTML(doc, module, navItems, version = null) {
    const relativePath = version
        ? `../../..`
        : `../..`;

    const sidebarLinks = navItems.map(item => {
        const isActive = doc.slug === item.file;
        return `<a href="${item.file}.html" class="${isActive ? 'active' : ''}">
            <i class="fas fa-${item.icon}"></i>
            ${item.title}
        </a>`;
    }).join('\n');

    const prevNext = generatePrevNext(navItems, doc.slug);

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
        .code-block { border-left: 4px solid ${module.color}; }
        .docs-body h2 { border-bottom: 2px solid ${module.color}; }
        .docs-body h2 i { color: ${module.color}; }
        .data-table th { background: ${module.colorGradient}; }
        .prev-next .next { background: ${module.colorGradient}; }
        .prev-next .next:hover { box-shadow: 0 4px 15px ${module.color}66; }
        .doc-content pre { border-left: 4px solid ${module.color}; }
        .doc-content pre code { color: #d4d4d4; }
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
                <span class="doc-badge">${version || module.versions?.[0] || 'v1.0'}</span>
            </div>
            <nav class="sidebar-nav">
                ${sidebarLinks}
            </nav>
            <div class="sidebar-footer">
                <a href="${relativePath}/docs/${module.slug}/index.html">
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
                    <a href="${relativePath}/docs/${module.slug}/index.html">${module.name}</a>
                    <i class="fas fa-chevron-right"></i>
                    <span>${doc.title}</span>
                </nav>
                <h1>${doc.title}</h1>
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

function generateModuleIndex(module, navItems, version = null) {
    const relativePath = version ? '../../..' : '../..';
    const versionInfo = version ? ` - ${version}` : '';

    const docCards = navItems.map((item, index) => `
        <div class="doc-card" onclick="window.location.href='${item.file}.html'" style="animation-delay: ${index * 0.1}s">
            <div class="doc-icon">
                <i class="fas fa-${item.icon}"></i>
            </div>
            <div class="doc-content">
                <h3>${item.title}</h3>
                <p>文档页面</p>
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
        .doc-icon { background: ${module.colorGradient} !important; }
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
                    <span class="stat-number">${navItems.length}</span>
                    <span class="stat-label">核心文档</span>
                </div>
                ${version ? `<div class="stat">
                    <span class="stat-number">${version}</span>
                    <span class="stat-label">Minecraft 版本</span>
                </div>` : ''}
            </div>
        </div>
    </header>

    <section class="section">
        <div class="container">
            ${versionSelector}
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-file-alt"></i>
                    文档列表
                </h2>
            </div>
            <div class="docs-grid">
                ${docCards}
            </div>
        </div>
    </section>

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

function getMarkdownFiles(sourceDir) {
    if (!fs.existsSync(sourceDir)) {
        return [];
    }
    return fs.readdirSync(sourceDir)
        .filter(f => {
            const isMarkdown = config.markdown.extensions.some(ext => f.endsWith(ext));
            const isNotIgnored = !config.markdown.ignorePrefixes.some(prefix => f.startsWith(prefix));
            return isMarkdown && isNotIgnored;
        });
}

function convertModule(moduleKey, specificVersion = null) {
    const module = modules[moduleKey];
    if (!module) {
        console.error(`错误: 未知的模组 "${moduleKey}"`);
        return;
    }

    if (!module.sourceDir || !fs.existsSync(module.sourceDir)) {
        console.log(`跳过 ${module.name}: 源目录不存在 (${module.sourceDir})`);
        return;
    }

    const navItems = navigation[moduleKey] || [];
    console.log(`\n转换 ${module.name}...`);

    // 转换为绝对路径
    const websiteRoot = path.resolve(__dirname, '..');
    const outputDir = path.resolve(websiteRoot, module.docsDir);

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
            const versionDir = path.join(outputDir, version);
            if (!fs.existsSync(versionDir)) {
                fs.mkdirSync(versionDir, { recursive: true });
            }

            // 生成版本索引页
            const indexContent = generateModuleIndex(module, navItems, version);
            fs.writeFileSync(path.join(versionDir, 'index.html'), indexContent);

            // 转换该版本的所有文档
            const files = getMarkdownFiles(module.sourceDir);

            files.forEach(file => {
                const sourcePath = path.join(module.sourceDir, file);
                const content = fs.readFileSync(sourcePath, 'utf-8');
                const { metadata, content: markdownContent } = parseFrontmatter(content);

                const slug = file.replace(/\.(md|markdown)$/, '');
                const title = metadata.title || slug.replace(/-/g, ' ');
                const readingTime = metadata.readingTime || config.defaults.readingTime;

                const doc = {
                    slug,
                    title,
                    readingTime,
                    content: parseMarkdown(markdownContent)
                };

                const html = generateDocHTML(doc, module, navItems, version);
                fs.writeFileSync(path.join(versionDir, `${slug}.html`), html);
                console.log(`  - ${slug}.html`);
            });
        });
    } else {
        // 无版本分支的模组
        const indexContent = generateModuleIndex(module, navItems);
        fs.writeFileSync(path.join(outputDir, 'index.html'), indexContent);

        const files = getMarkdownFiles(module.sourceDir);

        files.forEach(file => {
            const sourcePath = path.join(module.sourceDir, file);
            const content = fs.readFileSync(sourcePath, 'utf-8');
            const { metadata, content: markdownContent } = parseFrontmatter(content);

            const slug = file.replace(/\.(md|markdown)$/, '');
            const title = metadata.title || slug.replace(/-/g, ' ');
            const readingTime = metadata.readingTime || config.defaults.readingTime;

            const doc = {
                slug,
                title,
                readingTime,
                content: parseMarkdown(markdownContent)
            };

            const html = generateDocHTML(doc, module, navItems);
            fs.writeFileSync(path.join(outputDir, `${slug}.html`), html);
            console.log(`  - ${slug}.html`);
        });
    }

    console.log(`完成 ${module.name}`);
}

// ============================================
// 主函数
// ============================================

function main() {
    const args = process.argv.slice(2);
    const target = args[0] || 'all';
    const specificVersion = args[1] || null;

    console.log('========================================');
    console.log('  MC 开发文档转换器');
    console.log('========================================\n');

    if (target === 'all') {
        Object.keys(modules).forEach(moduleKey => {
            convertModule(moduleKey);
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
            console.log(`    源目录: ${module.sourceDir}`);
        });
    } else if (target === 'refresh-home') {
        // 重新生成首页
        console.log('更新首页...');
        // 需要更新 index.html 和 catalog.html
        // 这将在后续步骤中完成
    } else {
        convertModule(target, specificVersion);
    }

    console.log('\n========================================');
    console.log('  转换完成!');
    console.log('========================================');
}

main();
