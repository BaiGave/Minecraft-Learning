/**
 * 通用文档转换脚本
 *
 * 将 Markdown 文件转换为带主题的 HTML 文档页面
 *
 * 目录结构（content）：
 * content/{模组}/{MC版本}/{加载器}/{模组版本}/{tutorials,analysis}/...
 *
 * 输出结构（docs）：
 * docs/{模组}/{MC版本}-{加载器}-{模组版本}/{tutorials,analysis}/...
 *
 * 示例：
 *   content/fabric/1.21/core/-/tutorials/Part-1/01-intro.md
 *   -> docs/fabric/1.21-core-/tutorials/Part-1/01-intro.html
 *
 * 使用方法：
 * 1. 在 content/ 目录下添加 .md 文件
 * 2. 运行 node converter.js
 *    - 自动扫描 content/ 发现所有模块
 *    - 自动转换所有 markdown 到 html
 * 3. 无需手动配置，模块会自动被发现
 */

const fs = require('fs');
const path = require('path');

/**
 * 从生成的 HTML 文件路径计算站点根目录（含 index.html 的目录）的相对前缀，如 ../../../../
 */
function relativePathToWebsiteRoot(websiteRoot, htmlOutputFile) {
    const dir = path.dirname(path.resolve(htmlOutputFile));
    const root = path.resolve(websiteRoot);
    const rel = path.relative(root, dir);
    if (!rel || rel === '.') return './';
    const depth = rel.split(path.sep).filter(Boolean).length;
    return '../'.repeat(depth);
}

/**
 * 从当前 HTML 文件到模块版本索引目录（docs/mc/1.21/ 或 docs/iris/）的相对路径，用于「返回概述」面包屑
 */
function relativePathToModuleIndexDir(htmlOutputFile, moduleIndexDir) {
    const fromDir = path.dirname(path.resolve(htmlOutputFile));
    const toDir = path.resolve(moduleIndexDir);
    let r = path.relative(fromDir, toDir);
    if (!r || r === '.') return '.';
    return r.replace(/\\/g, '/');
}

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
                partSuffix: doc.partSuffix,
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
// 自动扫描发现的版本信息优先；当 config 中 versions 为 null 但扫描到了版本化内容时，
// 补充 versions / defaultVersion / docsDir（保留 config 的 name/icon/color 等元信息）。
if (Object.keys(autoModules).length > 0) {
    for (const [slug, autoModule] of Object.entries(autoModules)) {
        if (!modules[slug]) {
            modules[slug] = autoModule;
        } else {
            // config 已存在：保留 name/icon/color，仅补充扫描到的版本信息
            const existing = modules[slug];
            if (autoModule.versions && autoModule.versions.length > 0) {
                existing.versions = autoModule.versions;
                existing.defaultVersion = autoModule.defaultVersion;
                // docsDir 通常已是 docs/{slug}，保持不变
            }
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
const { markdownLinkToHtml, markdownImageToHtml, escapeAttr } = require('./safe-markdown-link');

function escapeHtmlText(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
}

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

/** 文档标题：frontmatter > 正文首个 # 标题 > slug 文件名（避免无 frontmatter 时变成英文 slug） */
function resolveDocTitle(metadata, markdownBody, slug) {
    if (metadata && metadata.title) {
        return String(metadata.title).trim();
    }
    const hm = String(markdownBody || '').match(/^#\s+(.+)$/m);
    if (hm) return hm[1].trim();
    return path.basename(String(slug || '')).replace(/-/g, ' ');
}

/**
 * 教程 Part 分组标题：MC/Fabric 优先用 curated 映射；其他模组用文件夹后缀（Part-2-Rendering → Part-2: Rendering）
 */
function humanizePartSuffix(suffix) {
    if (!suffix) return '';
    if (/[\u4e00-\u9fff]/.test(suffix)) {
        return String(suffix).replace(/[-_]+/g, ' ').trim();
    }
    return String(suffix)
        .split(/[-_]+/)
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/** 与 auto-scanner extractPartFolderMeta 一致：用路径首段解析 Part 文件夹名 */
function extractPartFolderMetaFromRelative(relativePathNorm) {
    const norm = String(relativePathNorm).replace(/\\/g, '/');
    const firstSeg = norm.split('/')[0] || '';
    const m =
        firstSeg.match(/^Part-(\d+)(?:-(.+))?$/i) ||
        firstSeg.match(/^part-(\d+)(?:-(.+))?$/i);
    if (!m) return { part: 'Other', partSuffix: null };
    return { part: m[1], partSuffix: m[2] || null };
}

function formatTutorialPartLabel(partKey, partItems, moduleSlug) {
    if (partKey === 'Other') return '其他';
    const suffix = partItems && partItems[0] && partItems[0].partSuffix;
    const useCurated = moduleSlug === 'mc' || moduleSlug === 'fabric';
    if (useCurated && suffix) {
        const compound = `${partKey}-${suffix}`;
        if (partDisplayNames[compound]) return partDisplayNames[compound];
    }
    if (useCurated && partDisplayNames[partKey]) {
        return partDisplayNames[partKey];
    }
    if (suffix) {
        return `Part-${partKey}: ${humanizePartSuffix(suffix)}`;
    }
    if (partDisplayNames[partKey]) return partDisplayNames[partKey];
    return `Part-${partKey}`;
}

/** 读取模组根 README 的致谢与版本元信息（可选 YAML 顶栏） */
function parseModuleReadmeCredits(contentRoot, moduleSlug) {
    const readmePath = path.join(contentRoot, 'content', moduleSlug, 'README.md');
    if (!fs.existsSync(readmePath)) return {};
    try {
        const raw = fs.readFileSync(readmePath, 'utf-8');
        const { metadata } = parseFrontmatter(raw);
        return {
            originalAuthor: metadata.originalAuthor || metadata.author || '',
            sourceUrl: metadata.sourceUrl || '',
            modVersion: metadata.modVersion || '',
            minecraftVersion: metadata.minecraftVersion || '',
            loader: metadata.loader || ''
        };
    } catch (e) {
        return {};
    }
}

/**
 * 从一串版本键构建树形结构 { mcVersion -> loader -> modVersions[] }
 * 用于三下拉选择器。
 */
function buildVersionTree(versions) {
    const tree = {};
    if (!versions || !versions.length) return tree;
    for (const key of versions) {
        const { mcVersion, loader, modVersion } = versionToPath(key);
        if (!mcVersion) continue;
        if (!tree[mcVersion]) tree[mcVersion] = {};
        if (!tree[mcVersion][loader]) tree[mcVersion][loader] = [];
        tree[mcVersion][loader].push({ key, modVersion });
    }
    return tree;
}

const LOADER_NAMES = {
    core: '原版核心',
    fabric: 'Fabric',
    forge: 'Forge',
    neoforge: 'NeoForge',
};

function formatLoaderName(loader) {
    return LOADER_NAMES[loader.toLowerCase()] ||
        (loader.charAt(0).toUpperCase() + loader.slice(1).toLowerCase());
}

function formatVersionDirLabel(versionToken) {
    if (!versionToken) return '';
    const m = String(versionToken).match(/^(\d+\.\d+(?:\.\d+)?)-([a-z0-9_-]+)$/i);
    if (m) {
        const loader = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
        return `Minecraft ${m[1]} · ${loader}`;
    }
    return `Minecraft ${versionToken}`;
}

/** 三下拉徽章：返回 { mc, loader, modVersion } 标签数组或 null */
function buildVersionBadge(versionToken) {
    if (!versionToken) return null;
    const { mcVersion, loader, modVersion } = versionToPath(versionToken);
    if (!mcVersion) return null;
    return {
        mc: mcVersion,
        loader: formatLoaderName(loader),
        mod: modVersion && modVersion !== '-' ? modVersion : null,
    };
}

/**
 * 重写文档内相对链接，避免 ./Part-X/foo 从子目录解析成 当前目录/Part-X/foo（404）
 * @param {string} rawUrl 原始 URL（可能含 .md、#锚点）
 * @param {string} currentSlug 当前文档 slug，相对 tutorials 或 analysis 根
 * @param {string} docType 'tutorials' | 'analysis'
 * @returns {string} 重写后的 href（.html，相对路径）
 */
function rewriteDocLinkHref(rawUrl, currentSlug, docType) {
    const s = String(rawUrl || '').trim();
    if (!s || /^https?:\/\//i.test(s) || /^#/.test(s) || /^mailto:/i.test(s)) {
        return s.replace(/\.md(#.*)?$/i, (_, a) => '.html' + (a || ''));
    }
    const anchor = (s.match(/#.+$/) || [])[0] || '';
    let pathPart = s.replace(/#.+$/, '').replace(/\.md$/i, '').trim();
    pathPart = pathPart.replace(/^\.\//, '');
    const fromDir = path.posix.dirname(String(currentSlug || '').replace(/\\/g, '/'));
    const baseDir = fromDir && fromDir !== '.' ? fromDir : '.';

    const looksLikeOtherPart = /^Part-\d+-[^/]+/i.test(pathPart) || /^part-\d+-[^/]+/i.test(pathPart);
    const isBareReadme = /^(README|SUMMARY)$/i.test(pathPart);

    let targetSlug = pathPart;
    if (looksLikeOtherPart) {
        targetSlug = pathPart;
    } else if (isBareReadme && baseDir !== '.') {
        targetSlug = pathPart;
    }

    let rel;
    if (looksLikeOtherPart || (isBareReadme && baseDir !== '.')) {
        rel = path.posix.relative(baseDir, targetSlug);
    } else {
        const joined = baseDir === '.' ? targetSlug : path.posix.join(baseDir, targetSlug);
        const resolved = path.posix.normalize(joined);
        rel = path.posix.relative(baseDir, resolved);
    }
    if (!rel || rel === '') rel = path.posix.basename(targetSlug);
    rel = rel.split(path.sep).join('/');
    return rel + (rel.endsWith('.html') ? '' : '.html') + anchor;
}

/**
 * 从 ## 标题文案生成锚点 id，与教程内「目录」中的 (#xxx) 链接对齐。
 * （旧逻辑用整段标题作 id，与手写目录链不一致，导致页内跳转无效。）
 */
function headingAnchorId(rawTitle) {
    let s = String(rawTitle).trim();
    s = s.replace(/[：:]/g, '');
    s = s.replace(/（([^）]*)）/g, '$1');
    s = s.replace(/\s*\(([A-Za-z0-9]+)\)/g, (_, w) => '-' + w.toLowerCase());
    s = s.replace(/[？。．，、！!？]/g, '');
    s = s.replace(/^(\d+)\.\s+/, '$1-');
    s = s.replace(/\s+/g, '-');
    s = s.replace(/[A-Z]/g, c => c.toLowerCase());
    s = s.replace(/[^0-9a-z\u4e00-\u9fff\-]/gi, '');
    s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return s || 'section';
}

function parseMarkdown(text, options = {}) {
    let html = text;
    const currentSlug = options.currentSlug;
    const docType = options.docType || 'tutorials';

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
    html = html.replace(/^## (.+)$/gm, (_, title) => {
        const id = headingAnchorId(title);
        return `<h2 id="${id}">${title}</h2>\n`;
    });
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>\n');

    // 粗体和斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // 删除线
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 图片（src 消毒 + lazy）
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, (_, alt, src) => markdownImageToHtml(alt, src));

    // 链接（危险协议过滤、外链 noopener；站内相对路径重写，避免 ./Part-X 解析成 当前目录/Part-X）
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, (_, t, u) => {
        const href = currentSlug
            ? rewriteDocLinkHref(u, currentSlug, docType)
            : (u.replace(/\.md(#.*)?$/i, (_, a) => '.html' + (a || '')));
        return markdownLinkToHtml(t, href);
    });

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
            html = html.replace(placeholder, `<div class="mermaid-wrapper mermaid-container">\n<div class="mermaid">${block.code}</div>\n</div>`);
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
// 教程导航：Part 归一化、排序、侧边栏分组（Fabric / MC 分目录教程）
// ============================================

/** 将 nav 中的 part 转为分组键：'0'..'n' 或 'Other'（兼容旧数据 Part-0） */
function normalizeTutorialPartKey(part) {
    if (part == null || part === '' || part === 'Other') return 'Other';
    const s = String(part);
    const m = s.match(/^Part-(\d+)$/i) || s.match(/^(\d+)$/);
    return m ? m[1] : 'Other';
}

/** 教程导航排序：先按 Part 序号，再按文件名 */
function sortTutorialNavItems(items) {
    if (!items || !items.length) return items || [];
    const partNum = (p) => {
        const k = normalizeTutorialPartKey(p);
        if (k === 'Other') return 999;
        const n = parseInt(k, 10);
        return Number.isFinite(n) ? n : 999;
    };
    return [...items].sort((a, b) => {
        const na = partNum(a.part);
        const nb = partNum(b.part);
        if (na !== nb) return na - nb;
        const fa = String(a.file || a.id || '');
        const fb = String(b.file || b.id || '');
        return fa.localeCompare(fb, 'zh-CN', { numeric: true });
    });
}

/** 导航项 file 是否与当前文档 slug 指同一篇（支持完整路径或仅 basename，兼容手写 config + 自动扫描） */
function tutorialNavItemMatchesSlug(item, slug) {
    if (!item || item.file == null || slug == null) return false;
    const f = String(item.file).replace(/\\/g, '/');
    const s = String(slug).replace(/\\/g, '/');
    if (f === s) return true;
    if (s.endsWith('/' + f)) return true;
    if (path.posix.basename(s) === f) return true;
    return false;
}

/**
 * 教程页内链：从当前文档 slug（相对 tutorials 根，无扩展名）到目标条目的相对 URL（含 .html）。
 * 自动扫描后 item.file 常为「Part-0-Prerequisites/03-project-intro」；若在子目录内写死该绝对式路径，
 * 浏览器会解析成 当前目录/Part-0/...，出现重复文件夹（ERR_FILE_NOT_FOUND）。
 */
function tutorialRelativeHref(fromSlug, toFileOrSlug) {
    const fromNorm = String(fromSlug || '').replace(/\\/g, '/');
    const toRaw = String(toFileOrSlug || '').replace(/\\/g, '/');
    if (!toRaw) return '#';
    const fromDir = path.posix.dirname(fromNorm);
    const baseDir = fromDir && fromDir !== '.' ? fromDir : '.';
    let toSlug;
    if (toRaw.includes('/')) {
        toSlug = toRaw;
    } else if (/^(README|SUMMARY)$/i.test(toRaw.trim())) {
        toSlug = toRaw.trim();
    } else {
        toSlug = baseDir === '.' ? toRaw : path.posix.join(baseDir, toRaw);
    }
    let rel = path.posix.relative(baseDir, toSlug);
    if (!rel || rel === '') {
        rel = path.posix.basename(toSlug);
    }
    return rel.split(path.sep).join('/') + '.html';
}

/** 教程页左侧栏：按 Part 分组（多 Part 时）；否则扁平列表 */
function buildTutorialSidebarHtml(navItems, activeSlug, module) {
    const sorted = sortTutorialNavItems(navItems);
    const keys = [...new Set(sorted.map(i => normalizeTutorialPartKey(i.part)))];
    // 任一文档落在 part-0 / Part-1 等子目录时启用分组（单 Part 也显示 Part 标题，避免与文内「第x章」混淆）
    const useGrouped = keys.some(k => k !== 'Other');

    if (!useGrouped) {
        return sorted.map(item => {
            const isActive = tutorialNavItemMatchesSlug(item, activeSlug);
            const icon = item.icon || 'book';
            const href = tutorialRelativeHref(activeSlug, item.file);
            return `<a href="${href}" class="${isActive ? 'active' : ''}">
            <i class="fas fa-${icon}"></i>
            ${item.title}
        </a>`;
        }).join('\n');
    }

    const groups = groupByPart(
        sorted.map(it => ({ ...it, part: normalizeTutorialPartKey(it.part) }))
    );
    const partKeys = Object.keys(groups);
    const numbered = sortParts(partKeys.filter(pk => pk !== 'Other'));
    const orderedParts = groups.Other ? [...numbered, 'Other'] : numbered;
    return orderedParts.map(partKey => {
        const items = groups[partKey];
        const label = formatTutorialPartLabel(partKey, items, module.slug);
        const links = items.map(item => {
            const isActive = tutorialNavItemMatchesSlug(item, activeSlug);
            const icon = item.icon || 'book';
            const href = tutorialRelativeHref(activeSlug, item.file);
            return `<a href="${href}" class="sidebar-nav-link ${isActive ? 'active' : ''}">
            <i class="fas fa-${icon}"></i>
            <span>${item.title}</span>
        </a>`;
        }).join('\n');
        return `<div class="sidebar-part">
            <div class="sidebar-part-label">${label}</div>
            ${links}
        </div>`;
    }).join('\n');
}

// ============================================
// HTML 生成器
// ============================================

function generateDocHTML(doc, module, navItems, version = null, docType = 'analysis', layoutOptions = {}) {
    // 输出路径：docs/{docsDir...}/[{version}/]{tutorials|analysis}/[子目录/]xxx.html
    // 嵌套子目录时必须传入 layoutOptions.relativePathToWebsite / baseDirToModuleIndex，否则资源与「返回概述」链接会错
    const docsDirDepth = module.docsDir.split(/[/\\]/).filter(Boolean).length;
    const pathDepthToWebsite = docsDirDepth + (version ? 1 : 0) + 1; // + tutorials|analysis（仅一层子目录时的默认深度）
    const relativePath = layoutOptions.relativePathToWebsite != null
        ? layoutOptions.relativePathToWebsite
        : '../'.repeat(pathDepthToWebsite);
    const baseDir = layoutOptions.baseDirToModuleIndex != null ? layoutOptions.baseDirToModuleIndex : '..';

    const navForPage = docType === 'tutorials' ? sortTutorialNavItems(navItems) : navItems;
    const sidebarLinks = docType === 'tutorials'
        ? buildTutorialSidebarHtml(navItems, doc.slug, module)
        : navForPage.map(item => {
            const isActive = tutorialNavItemMatchesSlug(item, doc.slug);
            const icon = item.icon || 'book';
            const href = tutorialRelativeHref(doc.slug, item.file);
            return `<a href="${href}" class="${isActive ? 'active' : ''}">
            <i class="fas fa-${icon}"></i>
            ${item.title}
        </a>`;
        }).join('\n');

    const prevNext = generatePrevNext(navForPage, doc.slug);

    // 文档类型标识
    const docTypeLabel = docType === 'tutorials' ? '教程' : '源码分析';
    const docTypeIcon = docType === 'tutorials' ? 'graduation-cap' : 'microscope';

    return `<!DOCTYPE html>
<html lang="zh-CN" class="docs-root" style="--module-accent:${module.color};">
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
        /* 顶栏/侧栏/导航链接一律用 styles.css + CSS 变量（data-theme），勿在此写死白字，否则浅色模式侧栏不可读 */
        .breadcrumb {
            gap: 0.65rem 1rem !important;
            flex-wrap: wrap;
        }
        .breadcrumb a { color: var(--module-accent); }
        .breadcrumb i.fa-chevron-right {
            color: var(--text-tertiary);
            font-size: 0.65rem;
            opacity: 0.85;
            padding: 0 0.25em;
            flex-shrink: 0;
        }
        .info-box { border-left: 4px solid var(--module-accent); background: color-mix(in srgb, var(--module-accent) 12%, transparent); }
        .info-box i { color: var(--module-accent); }
        .info-table td:first-child { font-weight: 600; color: var(--text-secondary); }
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
        /* h2 / 表格表头 / 下一篇按钮：见 styles.css .docs-page（与主题色协调） */
        .doc-content pre { border: none !important; box-shadow: 0 2px 12px rgba(0,0,0,0.35) !important; }
        .doc-content pre code:not(.hljs) { color: #d4d4d4; }
        pre.code-block code.hljs { background: transparent !important; padding: 0 !important; }
        .navbar .dropdown-content {
            z-index: 1001;
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            box-shadow: var(--shadow-md);
        }
        .navbar .dropdown-content a {
            color: var(--text-primary);
        }
        .navbar .dropdown-content a:hover {
            background: var(--bg-tertiary);
            color: var(--module-accent);
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
            background: linear-gradient(135deg, color-mix(in srgb, var(--module-accent) 85%, #1e293b), var(--module-accent));
            color: white;
        }
        .doc-type-tag.analysis {
            background: linear-gradient(135deg, #525252, #a3a3a3);
            color: white;
        }
    </style>
</head>
<body class="docs-page">
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

    <div class="docs-layout" id="docsLayout">
        <aside class="docs-sidebar">
            <div class="sidebar-header">
                <div class="sidebar-header-text">
                    <h3>${module.name}</h3>
                    <span class="doc-badge">${docType === 'tutorials' ? '教程' : '分析'}</span>
                </div>
                <button type="button" class="docs-sidebar-pin-btn" data-docs-sidebar-toggle aria-label="收起侧栏" title="收起侧栏">
                    <i class="fas fa-chevron-left" aria-hidden="true"></i>
                </button>
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

        <button type="button" class="docs-sidebar-floating-open" data-docs-sidebar-toggle aria-label="展开目录" title="展开目录">
            <i class="fas fa-book-open" aria-hidden="true"></i>
            <span>目录</span>
        </button>

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
    <script src="${relativePath}scripts/docs-sidebar.js"></script>
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
    <script>mermaid.initialize({ startOnLoad: true, theme: 'default' });</script>
    <script src="${relativePath}scripts/mermaid-controls.js"></script>` : ''}
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
    const currentIndex = navItems.findIndex(item => tutorialNavItemMatchesSlug(item, currentSlug));

    let prev = '';
    let next = '';

    if (currentIndex > 0) {
        const prevItem = navItems[currentIndex - 1];
        const prevHref = tutorialRelativeHref(currentSlug, prevItem.file);
        prev = `<a href="${prevHref}" class="prev">
            <i class="fas fa-arrow-left"></i>
            ${prevItem.title}
        </a>`;
    } else {
        prev = `<span class="prev"><i class="fas fa-arrow-left"></i></span>`;
    }

    if (currentIndex >= 0 && currentIndex < navItems.length - 1) {
        const nextItem = navItems[currentIndex + 1];
        const nextHref = tutorialRelativeHref(currentSlug, nextItem.file);
        next = `<a href="${nextHref}" class="next">
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

// Part 排序顺序（数字小的排前面）
const partOrder = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

function sortParts(partNamesList) {
    return partNamesList.sort((a, b) => {
        // 优先使用 partOrder 排序
        const indexA = partOrder.indexOf(a);
        const indexB = partOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // 其他情况按数字或字母排序
        return a.localeCompare(b);
    });
}

// Part 显示名称映射（优先用数字作为键）
const partDisplayNames = {
    // 数字键 - 用于 content/fabric (part-0, part-1...)
    '0': 'Part-0: 前置知识',
    '1': 'Part-1: 基础知识',
    '2': 'Part-2: 方块与物品',
    '3': 'Part-3: 实体系统',
    '4': 'Part-4: 世界生成',
    '5': 'Part-5: 渲染系统',
    '6': 'Part-6: 网络通信',
    '7': 'Part-7: 进阶主题',
    '8': 'Part-8: 实战项目',
    // MC 特有（带连字符后缀的旧格式也兼容）
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
    const websiteRoot = path.resolve(__dirname, '..');
    const credits = parseModuleReadmeCredits(websiteRoot, module.slug);
    const creditsBlock = (() => {
        const bits = [];
        if (credits.originalAuthor) {
            bits.push(`<span class="module-credits-author">致谢：${escapeHtmlText(credits.originalAuthor)}</span>`);
        }
        if (credits.sourceUrl) {
            bits.push(
                `<a class="module-credits-link" href="${escapeAttr(credits.sourceUrl)}" target="_blank" rel="noopener noreferrer">源项目</a>`
            );
        }
        if (!bits.length) return '';
        return `<p class="module-index-credits">${bits.join(' · ')}</p>`;
    })();
    const versionMetaChips = (() => {
        const chips = [];
        if (credits.modVersion) {
            chips.push(
                `<div class="stat-chip accent"><span>模组</span><strong>${escapeHtmlText(credits.modVersion)}</strong></div>`
            );
        }
        if (credits.minecraftVersion) {
            chips.push(
                `<div class="stat-chip accent"><span>MC</span><strong>${escapeHtmlText(credits.minecraftVersion)}</strong></div>`
            );
        }
        if (credits.loader) {
            chips.push(
                `<div class="stat-chip accent"><span>加载器</span><strong>${escapeHtmlText(credits.loader)}</strong></div>`
            );
        }
        return chips.join('');
    })();

    // 按 Part 分组教程
    const partGroups = groupByPart(tutorialsNavItems);
    const sortedParts = sortParts(Object.keys(partGroups));

    // 是否使用教程课程卡片式布局（MC 且有 part 学习建议时）
    const useCurriculumLayout = module.slug === 'mc' && partLearningAdvice && typeof partLearningAdvice === 'object';

    // 生成按 Part 分组的教程 HTML
    const tutorialsByPartHtml = sortedParts.map((partName, partIndex) => {
        const partItems = partGroups[partName];
        const partLabel = formatTutorialPartLabel(partName, partItems, module.slug);
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
            const prevLink = prevPart ? `<a href="#" onclick="scrollToPart('part-${prevPart}'); return false;" class="part-prev-next-prev">上一部分 ${escapeHtmlText(formatTutorialPartLabel(prevPart, partGroups[prevPart], module.slug))}</a>` : '';
            const nextLink = nextPart ? `<a href="#" onclick="scrollToPart('part-${nextPart}'); return false;" class="part-prev-next-next">下一部分 ${escapeHtmlText(formatTutorialPartLabel(nextPart, partGroups[nextPart], module.slug))}</a>` : '';
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

    const versionTree = module.versions && module.versions.length > 0
        ? buildVersionTree(module.versions)
        : {};
    const versionTreeJson = JSON.stringify(versionTree)
        .replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    // ── 三下拉 HTML ───────────────────────────────────────────────────────────
    let versionToolbarSelect = '';
    if (module.versions && module.versions.length > 0) {
        versionToolbarSelect = `
                <div class="module-toolbar-version" id="versionToolbarSelect">
                    <div class="version-selects">
                        <div class="version-select-wrap">
                            <label class="sr-only" for="mcVersionSelect">Minecraft 版本</label>
                            <select id="mcVersionSelect" class="toolbar-field" onchange="onMcVersionChange(this.value)">
                            </select>
                        </div>
                        <div class="version-select-wrap">
                            <label class="sr-only" for="loaderSelect">模组加载器</label>
                            <select id="loaderSelect" class="toolbar-field" onchange="onLoaderChange(this.value)">
                            </select>
                        </div>
                        <div class="version-select-wrap" id="modVersionWrap">
                            <label class="sr-only" for="modVersionSelect">模组版本</label>
                            <select id="modVersionSelect" class="toolbar-field" onchange="onModVersionChange(this.value)">
                            </select>
                        </div>
                    </div>
                </div>`;
    }

    const partJumpOptions = sortedParts.map(partName => {
        const pl = formatTutorialPartLabel(partName, partGroups[partName], module.slug);
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
        .module-index-credits {
            margin: 0.65rem 0 0 0;
            font-size: 0.82rem;
            color: rgba(255,255,255,0.92);
            line-height: 1.5;
        }
        .module-index-credits a.module-credits-link {
            color: #fff;
            font-weight: 600;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .module-index-credits a.module-credits-link:hover { opacity: 0.92; }
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
                ${creditsBlock}
            </div>
            <div class="module-index-stats">
                <div class="stat-chip"><strong>${tutorialsNavItems.length + analysisNavItems.length}</strong><span>篇文档</span></div>
                ${version ? (() => {
                    const badge = buildVersionBadge(version);
                    if (badge) {
                        const parts = [`<strong>${badge.mc}</strong>`];
                        parts.push(`<span>${badge.loader}</span>`);
                        if (badge.mod) parts.push(`<span>${badge.mod}</span>`);
                        return `<div class="stat-chip accent">${parts.join('')}</div>`;
                    }
                    return `<div class="stat-chip accent"><span>文档分支</span><strong>${escapeHtmlText(formatVersionDirLabel(version))}</strong></div>`;
                })() : ''}
                ${versionMetaChips}
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
        const __VERSION_TREE__ = ${versionTreeJson};
        const __CURRENT_VERSION_KEY__ = ${JSON.stringify(version || '')};
        const __LOADER_NAMES__ = ${JSON.stringify(LOADER_NAMES)};

        function formatLoaderName(l) {
            return (__LOADER_NAMES__[l] || (l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()));
        }

        function initVersionSelects() {
            const mcSel = document.getElementById('mcVersionSelect');
            const ldSel = document.getElementById('loaderSelect');
            const mvSel = document.getElementById('modVersionSelect');
            if (!mcSel || !ldSel || !mvSel) return;

            const mcVersions = Object.keys(__VERSION_TREE__).sort().reverse();
            mcSel.innerHTML = mcVersions.map(m => '<option value="' + m + '">' + m + '</option>').join('');

            function loadLoaders(mc) {
                const loaders = Object.keys(__VERSION_TREE__[mc] || {}).sort();
                ldSel.innerHTML = loaders.map(l =>
                    '<option value="' + l + '">' + formatLoaderName(l) + '</option>'
                ).join('');
                const curLoader = ldSel.value;
                if (!loaders.includes(curLoader) && loaders.length > 0) {
                    ldSel.value = loaders[0];
                }
                loadModVersions(mc, ldSel.value);
            }

            function loadModVersions(mc, loader) {
                const mods = (__VERSION_TREE__[mc] || {})[loader] || [];
                const mvWrap = document.getElementById('modVersionWrap');
                if (mods.length === 0) {
                    if (mvWrap) mvWrap.style.display = 'none';
                    mvSel.innerHTML = '';
                    return;
                }
                if (mvWrap) mvWrap.style.display = '';
                mvSel.innerHTML = mods.map(m => {
                    const label = (m.modVersion && m.modVersion !== '-') ? m.modVersion : m.key;
                    return '<option value="' + m.key + '">' + label + '</option>';
                }).join('');
            }

            function findCurrent() {
                for (const mc of mcVersions) {
                    const loaders = Object.keys(__VERSION_TREE__[mc] || {});
                    for (const loader of loaders) {
                        const mods = (__VERSION_TREE__[mc] || {})[loader] || [];
                        for (const m of mods) {
                            if (m.key === __CURRENT_VERSION_KEY__) {
                                return { mc, loader, mod: m };
                            }
                        }
                    }
                }
                return null;
            }

            mcSel.addEventListener('change', function() {
                loadLoaders(this.value);
            });
            ldSel.addEventListener('change', function() {
                loadModVersions(mcSel.value, this.value);
            });
            mvSel.addEventListener('change', function() {
                const key = this.value;
                if (key && key !== __CURRENT_VERSION_KEY__) {
                    window.location.href = '../' + key + '/index.html';
                }
            });

            const cur = findCurrent();
            if (cur) {
                mcSel.value = cur.mc;
                loadLoaders(cur.mc);
                ldSel.value = cur.loader;
                loadModVersions(cur.mc, cur.loader);
                if (mvSel.options.length > 0) {
                    mvSel.value = cur.mod.key;
                }
            } else {
                if (mcVersions.length > 0) {
                    mcSel.value = mcVersions[0];
                    loadLoaders(mcVersions[0]);
                }
            }
        }

        function onMcVersionChange(mc) {
            const ldSel = document.getElementById('loaderSelect');
            const mvSel = document.getElementById('modVersionSelect');
            if (!ldSel || !mvSel) return;
            const loaders = Object.keys(__VERSION_TREE__[mc] || {}).sort();
            ldSel.innerHTML = loaders.map(l =>
                '<option value="' + l + '">' + formatLoaderName(l) + '</option>'
            ).join('');
            const curLoader = ldSel.value;
            if (!loaders.includes(curLoader) && loaders.length > 0) {
                ldSel.value = loaders[0];
            }
            const mods = (__VERSION_TREE__[mc] || {})[ldSel.value] || [];
            const mvWrap = document.getElementById('modVersionWrap');
            if (mvWrap) mvWrap.style.display = mods.length ? '' : 'none';
            if (mods.length > 0) {
                mvSel.innerHTML = mods.map(m => {
                    const label = (m.modVersion && m.modVersion !== '-') ? m.modVersion : m.key;
                    return '<option value="' + m.key + '">' + label + '</option>';
                }).join('');
                const targetKey = mvSel.value;
                if (targetKey && targetKey !== __CURRENT_VERSION_KEY__) {
                    window.location.href = '../' + targetKey + '/index.html';
                }
            }
        }

        function onLoaderChange(loader) {
            const mcSel = document.getElementById('mcVersionSelect');
            const mvSel = document.getElementById('modVersionSelect');
            if (!mcSel || !mvSel) return;
            const mc = mcSel.value;
            const mods = (__VERSION_TREE__[mc] || {})[loader] || [];
            const mvWrap = document.getElementById('modVersionWrap');
            if (mvWrap) mvWrap.style.display = mods.length ? '' : 'none';
            if (mods.length > 0) {
                mvSel.innerHTML = mods.map(m => {
                    const label = (m.modVersion && m.modVersion !== '-') ? m.modVersion : m.key;
                    return '<option value="' + m.key + '">' + label + '</option>';
                }).join('');
                const targetKey = mvSel.value;
                if (targetKey && targetKey !== __CURRENT_VERSION_KEY__) {
                    window.location.href = '../' + targetKey + '/index.html';
                }
            }
        }

        function onModVersionChange(key) {
            if (key && key !== __CURRENT_VERSION_KEY__) {
                window.location.href = '../' + key + '/index.html';
            }
        }

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
            initVersionSelects();
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

        /* ── 三列版本选择器 ── */
        .module-index-page .module-toolbar-version { width: 100%; }
        .module-index-page .version-selects {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
        }
        .module-index-page .version-select-wrap { display: inline-flex; align-items: center; gap: 0.3rem; }
        .module-index-page .version-select-wrap label {
            font-size: 0.78rem;
            color: var(--text-secondary);
            white-space: nowrap;
        }
        .module-index-page #mcVersionSelect { min-width: 7rem; }
        .module-index-page #loaderSelect { min-width: 8rem; }
        .module-index-page #modVersionSelect { min-width: 7rem; }
        @media (max-width: 600px) {
            .module-index-page .version-selects { gap: 0.4rem; }
            .module-index-page #mcVersionSelect,
            .module-index-page #loaderSelect,
            .module-index-page #modVersionSelect { min-width: 6rem; }
        }
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
                const atDocRoot = !basePath || basePath === '.' || basePath === '';
                const isTopLevelReadmeOrSummary =
                    atDocRoot &&
                    (entry.name === 'README.md' || entry.name === 'SUMMARY.md');
                const ignoredByPrefix = config.markdown.ignorePrefixes.some(prefix =>
                    entry.name.startsWith(prefix));
                const isNotIgnored = isMarkdown && (!ignoredByPrefix || isTopLevelReadmeOrSummary);

                if (isNotIgnored) {
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

// 版本字符串转换为路径部分
// 1.21-core-- -> mcVersion=1.21, loader=core, modVersion=-
// 1.21-neoforge-0.8.6 -> mcVersion=1.21, loader=neoforge, modVersion=0.8.6
function versionToPath(version) {
    if (!version) return { mcVersion: '', loader: '', modVersion: '' };
    const parts = version.split('-');
    return {
        mcVersion: parts[0] || '',
        loader: parts[1] || 'core',
        modVersion: parts.slice(2).join('-') || '-'
    };
}

// 版本路径转换为版本字符串
// mcVersion=1.21, loader=core, modVersion=- -> 1.21-core-
function pathToVersion(mcVersion, loader, modVersion) {
    if (!mcVersion) return '';
    if (loader === 'core' && modVersion === '-') {
        return mcVersion;
    }
    if (modVersion === '-' || !modVersion) {
        return `${mcVersion}-${loader}`;
    }
    return `${mcVersion}-${loader}-${modVersion}`;
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
        const { mcVersion, loader, modVersion } = versionToPath(version);
        sourceDir = path.resolve(websiteRoot, 'content', module.slug, mcVersion, loader, modVersion, docType);
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
            // 输出路径: docs/{模组}/{MC版本}-{加载器}-{模组版本}/
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
            const { mcVersion, loader, modVersion } = versionToPath(version);
            const versionSourceDir = path.resolve(websiteRoot, 'content', module.slug, mcVersion, loader, modVersion, docType);

            // 转换该版本的所有文档（保留 tutorials|analysis 下的子目录结构，与 MC Part-* 等一致）
            if (fs.existsSync(versionSourceDir)) {
                const files = getMarkdownFiles(versionSourceDir);
                const moduleIndexDir = path.join(outputDir, version);

                files.forEach(fileInfo => {
                    const sourcePath = fileInfo.path;
                    const content = fs.readFileSync(sourcePath, 'utf-8');
                    const { metadata, content: markdownContent } = parseFrontmatter(content);

                    const slug = path.relative(versionSourceDir, fileInfo.path)
                        .replace(/\\/g, '/')
                        .replace(/\.(md|markdown)$/, '');
                    const title = resolveDocTitle(metadata, markdownContent, slug);
                    const readingTime = metadata.readingTime || config.defaults.readingTime;

                    const doc = {
                        slug,
                        title,
                        readingTime,
                        content: parseMarkdown(markdownContent, { currentSlug: slug, docType })
                    };

                    const outPath = path.join(typeDir, `${slug}.html`);
                    fs.mkdirSync(path.dirname(outPath), { recursive: true });

                    const layoutOptions = {
                        relativePathToWebsite: relativePathToWebsiteRoot(websiteRoot, outPath),
                        baseDirToModuleIndex: relativePathToModuleIndexDir(outPath, moduleIndexDir)
                    };

                    const html = generateDocHTML(doc, module, versionNavItems, version, docType, layoutOptions);
                    fs.writeFileSync(outPath, html);
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

            const slug = path.relative(sourceDir, fileInfo.path)
                .replace(/\\/g, '/')
                .replace(/\.(md|markdown)$/, '');
            const title = resolveDocTitle(metadata, markdownContent, slug);
            const readingTime = metadata.readingTime || config.defaults.readingTime;

            const doc = {
                slug,
                title,
                readingTime,
                content: parseMarkdown(markdownContent, { currentSlug: slug, docType })
            };

            const outPath = path.join(typeDir, `${slug}.html`);
            fs.mkdirSync(path.dirname(outPath), { recursive: true });

            const layoutOptions = {
                relativePathToWebsite: relativePathToWebsiteRoot(websiteRoot, outPath),
                baseDirToModuleIndex: relativePathToModuleIndexDir(outPath, outputDir)
            };

            const html = generateDocHTML(doc, module, navItems, null, docType, layoutOptions);
            fs.writeFileSync(outPath, html);
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

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    if (module.versions && module.versions.length > 0) {
        // 有版本分支 - 为每个版本生成索引页
        module.versions.forEach(version => {
            // 将版本字符串转回路径：1.21-core-- -> mcVersion=1.21, loader=core, modVersion=-
            const { mcVersion, loader, modVersion } = versionToPath(version);

            // 输出目录: docs/{模组}/{版本}/
            const versionDir = path.join(outputDir, version);
            if (!fs.existsSync(versionDir)) {
                fs.mkdirSync(versionDir, { recursive: true });
            }

            // 扫描该版本的教程和分析文件
            const tutorialsSourceDir = path.resolve(websiteRoot, 'content', module.slug, mcVersion, loader, modVersion, 'tutorials');
            const analysisSourceDir = path.resolve(websiteRoot, 'content', module.slug, mcVersion, loader, modVersion, 'analysis');

            const actualTutorials = getActualDocFiles(tutorialsSourceDir);
            const actualAnalysis = getActualDocFiles(analysisSourceDir);

            // MC 教程：与 config 合并，补充 title/icon/topics 用于课程卡片展示
            const navConfig = tutorialsNavigation.mc || [];
            const tutorialsWithConfig = actualTutorials.map(t => {
                const fromConfig = navConfig.find(n => n.file === t.file)
                    || navConfig.find(n => t.file.endsWith('/' + n.file) || t.file.endsWith('\\' + n.file))
                    || navConfig.find(n => t.file === n.id);
                if (!fromConfig) return t;
                return { ...t, title: fromConfig.title, icon: fromConfig.icon || t.icon, topics: fromConfig.topics };
            });

            // 生成索引页
            const indexContent = generateModuleIndex(module, tutorialsWithConfig, actualAnalysis, version);
            fs.writeFileSync(path.join(versionDir, 'index.html'), indexContent);
            console.log(`生成 ${module.name} ${version} 索引页`);
        });

        // 有版本分支时，在根 docs/iris/ 下生成一个跳转页，兼容旧链接
        if (module.defaultVersion) {
            const redirectHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=${module.defaultVersion}/index.html">
    <title>Redirecting...</title>
    <script>location.href = '${module.defaultVersion}/index.html';</script>
</head>
<body>
    <p>正在跳转到 <a href="${module.defaultVersion}/index.html">${module.name}</a>...</p>
</body>
</html>`;
            fs.writeFileSync(path.join(outputDir, 'index.html'), redirectHtml);
            console.log(`生成 ${module.name} 根级跳转页 (→ ${module.defaultVersion})`);
        }
    } else {
        // 无版本分支 - 扫描实际存在的文件
        const tutorialsSourceDir = path.resolve(websiteRoot, 'content', module.slug, 'tutorials');
        const analysisSourceDir = path.resolve(websiteRoot, 'content', module.slug, 'analysis');

        const actualTutorials = getActualDocFiles(tutorialsSourceDir);
        const actualAnalysis = getActualDocFiles(analysisSourceDir);

        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const indexContent = generateModuleIndex(module, actualTutorials, actualAnalysis);
        fs.writeFileSync(path.join(outputDir, 'index.html'), indexContent);
        console.log(`生成 ${module.name} 索引页`);
    }
}

// 获取实际存在的文档文件，转换为导航项格式
function getActualDocFiles(sourceDir, recursive = true) {
    const files = getMarkdownFiles(sourceDir, recursive);
    return files.map(f => {
        const rel = f.relativePath.replace(/\\/g, '/');
        const slug = rel.replace(/\.(md|markdown)$/, '');
        const icon = 'file-alt';
        const { part, partSuffix } = extractPartFolderMetaFromRelative(rel);

        let title = path.basename(slug).replace(/-/g, ' ');
        try {
            const content = fs.readFileSync(f.path, 'utf-8');
            const { metadata, content: body } = parseFrontmatter(content);
            title = resolveDocTitle(metadata, body, slug);
        } catch (e) {
            // 忽略读取错误
        }

        return {
            file: slug,
            htmlPath: slug,
            title,
            icon,
            part,
            partSuffix
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
