/**
 * 网站文档转换脚本
 *
 * 将 content/ 目录下的 Markdown 文件转换为 website/docs/ 目录下的 HTML
 *
 * Features:
 * - 多模块支持 (mc, sodium, iris 等)
 * - 版本目录支持 (mc/1.21, mc/1.22 等)
 * - 增量构建
 * - 导航生成
 *
 * 使用方法：
 *   node convert.js              # 转换所有内容
 *   node convert.js --module mc  # 只转换特定模块
 *   node convert.js --verbose    # 详细输出
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    rootDir: __dirname,
    contentDir: path.join(__dirname, '..', 'content'),
    websiteDir: __dirname,
    outputDir: path.join(__dirname, 'docs'),
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    dryRun: process.argv.includes('--dry-run'),
    specificModule: null,

    // 模块配置
    modules: {
        mc: {
            type: 'versioned',
            versions: ['1.18.2', '1.19.4', '1.20.4', '1.21', '1.21.4']
        },
        sodium: {
            type: 'flat'
        },
        iris: {
            type: 'flat'
        },
        lithium: {
            type: 'flat'
        },
        fabric: {
            type: 'flat'
        }
    },

    subdirs: ['tutorials', 'analysis']
};

// ============================================================================
// Logger
// ============================================================================

const Logger = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',

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

    section(msg) {
        console.log(`\n${this.magenta}▶ ${msg}${this.reset}`);
    },

    stats(data) {
        const { files, errors, duration } = data;
        console.log(`\n${this.cyan}${'─'.repeat(40)}${this.reset}`);
        console.log(`${this.bright}转换统计:${this.reset}`);
        console.log(`  ${this.green}成功: ${files}${this.reset}`);
        if (errors > 0) console.log(`  ${this.red}错误: ${errors}${this.reset}`);
        console.log(`  ${this.dim}耗时: ${(duration / 1000).toFixed(2)}s${this.reset}`);
        console.log(`${this.cyan}${'─'.repeat(40)}${this.reset}\n`);
    }
};

// ============================================================================
// Statistics
// ============================================================================

const stats = {
    files: 0,
    errors: 0,
    skipped: 0,
    startTime: Date.now(),

    get duration() {
        return Date.now() - this.startTime;
    }
};

// ============================================================================
// File Helpers
// ============================================================================

function readFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.replace(/^\uFEFF/, '');
    } catch (e) {
        if (CONFIG.verbose) {
            Logger.error(`读取失败: ${filePath}`);
        }
        return null;
    }
}

function writeFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    } catch (e) {
        Logger.error(`写入失败: ${filePath}`);
        if (CONFIG.verbose) {
            Logger.error(e.message);
        }
        return false;
    }
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// ============================================================================
// Markdown Parser
// ============================================================================

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
    let html = text
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>\n')
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

    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

    return html;
}

// ============================================================================
// Navigation Generator
// ============================================================================

function generateNavigation(moduleName, currentPath = '') {
    const moduleDir = path.join(CONFIG.contentDir, moduleName);
    const navItems = [];

    // 获取模块下的所有子目录
    function getSubdirs(dir) {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    }

    // MC 模块特殊处理（版本目录）
    if (CONFIG.modules[moduleName]?.type === 'versioned') {
        const versions = getSubdirs(moduleDir);
        versions.forEach(version => {
            const versionDir = path.join(moduleDir, version);
            const subdirs = getSubdirs(versionDir);

            subdirs.forEach(subdir => {
                const fullPath = `${moduleName}/${version}/${subdir}`;
                navItems.push({
                    label: `${version} ${subdir === 'tutorials' ? '教程' : '分析'}`,
                    href: `/${moduleName}/${version}/${subdir}/`,
                    isActive: currentPath.includes(`${moduleName}/${version}/${subdir}`)
                });
            });
        });
    } else {
        // 普通模块
        const subdirs = getSubdirs(moduleDir);
        subdirs.forEach(subdir => {
            const fullPath = `${moduleName}/${subdir}`;
            navItems.push({
                label: subdir === 'tutorials' ? '教程' : '分析',
                href: `/${moduleName}/${subdir}/`,
                isActive: currentPath.includes(`${moduleName}/${subdir}`)
            });
        });
    }

    return navItems;
}

function generateSidebar(moduleName, category, currentFile = '') {
    const contentCategoryDir = path.join(CONFIG.contentDir, moduleName, category);

    if (!fs.existsSync(contentCategoryDir)) {
        return '';
    }

    // 获取所有 .md 文件
    const files = [];
    function scanDir(dir, basePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(entry => {
            if (entry.isDirectory()) {
                scanDir(path.join(dir, entry.name), path.join(basePath, entry.name));
            } else if (entry.name.endsWith('.md') && entry.name !== 'README.md' && entry.name !== 'SUMMARY.md') {
                const relativePath = path.join(basePath, entry.name);
                files.push({
                    name: entry.name,
                    path: relativePath,
                    fullPath: path.join(dir, entry.name)
                });
            }
        });
    }

    scanDir(contentCategoryDir);

    // 生成侧边栏 HTML
    let html = '<div class="sidebar-nav">\n';
    html += '<h3>' + (category === 'tutorials' ? '教程' : '分析') + '</h3>\n';
    html += '<ul>\n';

    files.forEach(file => {
        const href = file.path.replace('.md', '.html');
        const isActive = currentFile === file.name ? ' class="active"' : '';
        const title = file.name.replace(/\d+-/g, '').replace(/-/g, ' ').replace('.md', '');

        html += `    <li${isActive}><a href="${href}">${title}</a></li>\n`;
    });

    html += '</ul>\n';
    html += '</div>\n';

    return html;
}

// ============================================================================
// HTML Generator
// ============================================================================

function generateArticleHtml(article, moduleName, category, relativePath) {
    const moduleTitle = {
        mc: 'Minecraft 原版',
        sodium: 'Sodium',
        iris: 'Iris',
        lithium: 'Lithium',
        fabric: 'Fabric'
    };

    const categoryTitle = category === 'tutorials' ? '教程' : '分析';
    const navItems = generateNavigation(moduleName, relativePath);

    const navHtml = navItems.map(item =>
        `<a href="${item.href}"${item.isActive ? ' class="active"' : ''}>${item.label}</a>`
    ).join('\n');

    const sidebarHtml = generateSidebar(moduleName, category, path.basename(relativePath, '.html'));

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} - ${moduleTitle[moduleName] || moduleName}</title>
    <link rel="stylesheet" href="../../styles.css">
    <link rel="stylesheet" href="../../tutorial.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-logo">
                <div class="nav-logo-icon"><i class="fas fa-code"></i></div>
                <span>MC 源码教程</span>
            </a>
            <div class="nav-links">
                <a href="/">首页</a>
                <a href="/mc/1.21/tutorials/">MC 教程</a>
                <a href="/mc/1.21/analysis/">原版分析</a>
                <a href="/sodium/tutorials/">Sodium</a>
                <a href="/iris/tutorials/">Iris</a>
            </div>
        </div>
    </nav>

    <div class="docs-layout">
        <aside class="docs-sidebar">
            <div class="sidebar-section">
                <h3>导航</h3>
                <div class="nav-list">
${navHtml}
                </div>
            </div>
            ${sidebarHtml}
        </aside>

        <main class="docs-content">
            <article class="tutorial-article">
                <header class="article-header">
                    <div class="breadcrumb">
                        <a href="/">首页</a> &gt;
                        <a href="/${moduleName}/">${moduleTitle[moduleName] || moduleName}</a> &gt;
                        <span>${categoryTitle}</span>
                    </div>
                    <h1>${article.title}</h1>
                    ${article.date ? `<div class="article-meta"><i class="far fa-calendar"></i> ${article.date}</div>` : ''}
                </header>

                <div class="article-body">
                    ${article.content}
                </div>

                <footer class="article-footer">
                    <div class="article-tags">
                        <i class="fas fa-tags"></i>
                        ${(article.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </footer>
            </article>
        </main>
    </div>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2026 MC 源码教程 | 基于开源精神</p>
            </div>
        </div>
    </footer>

    <script src="../../script.js"></script>
</body>
</html>`;
}

// ============================================================================
// Convert Functions
// ============================================================================

function getAllMarkdownFiles(dir) {
    const files = [];

    function scan(currentDir) {
        if (!fs.existsSync(currentDir)) return;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                scan(fullPath);
            } else if (entry.name.endsWith('.md')) {
                const relativePath = path.relative(CONFIG.contentDir, fullPath);
                files.push({
                    fullPath,
                    relativePath: relativePath.replace(/\\/g, '/'),
                    module: relativePath.split('/')[0],
                    version: relativePath.split('/')[1],
                    category: relativePath.split('/')[2] || '',
                    filename: entry.name
                });
            }
        }
    }

    scan(dir);
    return files;
}

function convertMarkdownToHtml(fileInfo) {
    const content = readFile(fileInfo.fullPath);
    if (!content) {
        stats.errors++;
        return false;
    }

    // 跳过 README 和 SUMMARY
    if (fileInfo.filename === 'README.md' || fileInfo.filename === 'SUMMARY.md') {
        stats.skipped++;
        return false;
    }

    const { metadata, content: markdownContent } = parseFrontmatter(content);

    const article = {
        title: metadata.title || fileInfo.filename.replace('.md', '').replace(/\d+-/g, '').replace(/-/g, ' '),
        date: metadata.date || '',
        tags: metadata.tags || [],
        content: parseMarkdown(markdownContent)
    };

    // 确定输出路径
    let outputPath;
    if (fileInfo.version) {
        // MC 版本目录结构
        outputPath = path.join(
            CONFIG.outputDir,
            fileInfo.module,
            fileInfo.version,
            fileInfo.category,
            fileInfo.filename.replace('.md', '.html')
        );
    } else {
        // 普通模块结构
        outputPath = path.join(
            CONFIG.outputDir,
            fileInfo.module,
            fileInfo.category,
            fileInfo.filename.replace('.md', '.html')
        );
    }

    // 生成 HTML
    const html = generateArticleHtml(article, fileInfo.module, fileInfo.category, fileInfo.relativePath);

    // 写入文件
    if (writeFile(outputPath, html)) {
        stats.files++;
        if (CONFIG.verbose) {
            Logger.success(`${fileInfo.relativePath} -> ${path.relative(CONFIG.outputDir, outputPath)}`);
        }
        return true;
    } else {
        stats.errors++;
        return false;
    }
}

function generateModuleIndex(moduleName, moduleInfo) {
    const moduleTitle = {
        mc: 'Minecraft 原版',
        sodium: 'Sodium 优化模组',
        iris: 'Iris 光影支持',
        lithium: 'Lithium 游戏优化',
        fabric: 'Fabric 模组加载器'
    };

    const moduleDir = path.join(CONFIG.contentDir, moduleName);
    let content = `# ${moduleTitle[moduleName] || moduleName}\n\n`;

    if (moduleInfo.type === 'versioned') {
        const versions = fs.readdirSync(moduleDir, { withFileTypes: true })
            .filter(e => e.isDirectory())
            .map(e => e.name)
            .sort();

        content += '## 版本目录\n\n';
        versions.forEach(version => {
            const versionPath = path.join(moduleDir, version);
            const subdirs = fs.readdirSync(versionPath, { withFileTypes: true })
                .filter(e => e.isDirectory())
                .map(e => e.name);

            content += `### ${version}\n\n`;
            subdirs.forEach(subdir => {
                const title = subdir === 'tutorials' ? '教程' : '分析';
                content += `- [${title}](./${version}/${subdir}/)\n`;
            });
            content += '\n';
        });
    } else {
        content += '## 内容目录\n\n';
        CONFIG.subdirs.forEach(subdir => {
            if (fs.existsSync(path.join(moduleDir, subdir))) {
                const title = subdir === 'tutorials' ? '教程' : '分析';
                content += `- [${title}](./${subdir}/)\n`;
            }
        });
    }

    return content;
}

function convertAll() {
    Logger.header('文档转换器');

    if (CONFIG.dryRun) {
        Logger.warning('运行于模拟模式 - 不会写入任何文件');
    }

    Logger.info(`内容目录: ${CONFIG.contentDir}`);
    Logger.info(`输出目录: ${CONFIG.outputDir}`);

    // 确保输出目录存在
    ensureDir(CONFIG.outputDir);

    // 获取所有 Markdown 文件
    Logger.section('扫描文件...');
    const files = getAllMarkdownFiles(CONFIG.contentDir);
    Logger.info(`找到 ${files.length} 个 Markdown 文件`);

    // 过滤特定模块
    let filesToConvert = files;
    if (CONFIG.specificModule) {
        filesToConvert = files.filter(f => f.module === CONFIG.specificModule);
        Logger.info(`过滤后: ${filesToConvert.length} 个文件 (模块: ${CONFIG.specificModule})`);
    }

    // 转换文件
    Logger.section('转换中...');
    filesToConvert.forEach(file => {
        convertMarkdownToHtml(file);
    });

    // 打印统计
    Logger.stats(stats);

    if (stats.errors === 0) {
        Logger.success('转换完成!');
    } else {
        Logger.error(`转换完成，但有 ${stats.errors} 个错误`);
    }

    return stats.errors === 0;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

function main() {
    const args = process.argv.slice(2);

    // 解析参数
    if (args.includes('--module') || args.includes('-m')) {
        const moduleIndex = args.indexOf('--module');
        const moduleIndex2 = args.indexOf('-m');
        const index = moduleIndex > -1 ? moduleIndex : moduleIndex2;
        CONFIG.specificModule = args[index + 1];
    }

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
文档转换脚本

使用方法：
  node convert.js [选项]

选项：
  --module, -m <name>   只转换指定模块 (mc, sodium, iris 等)
  --verbose, -v        详细输出
  --dry-run            模拟运行，不写入文件
  --help, -h           显示帮助

示例：
  node convert.js              # 转换所有内容
  node convert.js -m mc        # 只转换 MC 相关
  node convert.js --verbose    # 显示详细日志
`);
        return;
    }

    convertAll();
}

main();
