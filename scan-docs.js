/**
 * 文档扫描与构建脚本
 * 
 * 自动扫描 docs/ 目录，发现所有模组和文档
 * 生成 site-stats.js 和 site-stats.json
 * 生成模块索引页
 * 
 * 使用方法：
 *   node scan-docs.js          # 扫描并构建
 *   node scan-docs.js --stats  # 仅生成统计
 *   node scan-docs.js --watch  # 监听模式
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DOCS_DIR = path.join(ROOT, 'docs');
const SITE_CONFIG_PATH = path.join(ROOT, 'scripts', 'site-config.js');

// ── 颜色输出 ────────────────────────────────────────────────
const C_RESET = '\x1b[0m';
const C_GREEN = '\x1b[32m';
const C_YELLOW = '\x1b[33m';
const C_CYAN = '\x1b[36m';
const C_BOLD = '\x1b[1m';

function log(msg, color = C_CYAN) {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`  ${color}[${now}]${C_RESET} ${msg}`);
}

function success(msg) { log(msg, C_GREEN); }
function warn(msg) { log(msg, C_YELLOW); }

// ── 加载 site-config.js ─────────────────────────────────────
function loadSiteConfig() {
    if (!fs.existsSync(SITE_CONFIG_PATH)) {
        return null;
    }
    try {
        const content = fs.readFileSync(SITE_CONFIG_PATH, 'utf-8');
        const fn = new Function('module', 'exports', 'require', 'window', content + '\nreturn typeof SITE_CONFIG !== "undefined" ? SITE_CONFIG : null;');
        return fn({}, {}, require, {});
    } catch (e) {
        warn(`加载 site-config.js 失败: ${e.message}`);
        return null;
    }
}

// ── 递归扫描 HTML 文件 ──────────────────────────────────────
function scanAllHtmlFiles(dir, relativePath = '', depth = 0) {
    const results = [];
    
    if (!fs.existsSync(dir)) return results;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        if (entry.isDirectory()) {
            // 跳过隐藏目录
            if (entry.name.startsWith('.')) continue;
            
            // 跳过 root 目录（但如果 root 下还有子目录要扫描）
            if (entry.name === 'root' && depth === 0) continue;
            
            const subPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            results.push(...scanAllHtmlFiles(path.join(dir, entry.name), subPath, depth + 1));
        } else if (entry.name.endsWith('.html') && entry.name !== 'index.html') {
            results.push({
                relativePath: relativePath,
                filename: entry.name,
                fullPath: path.join(dir, entry.name)
            });
        }
    }
    
    return results;
}

// ── 判断文档类型 ───────────────────────────────────────────
function classifyDoc(relativePath) {
    if (relativePath.includes('tutorials') || relativePath.includes('Tutorial')) {
        return 'tutorial';
    }
    if (relativePath.includes('analysis') || relativePath.includes('Analysis')) {
        return 'analysis';
    }
    // 默认按路径判断
    return 'other';
}

// ── 扫描 docs 目录 ─────────────────────────────────────────
function scanDocsDir() {
    const modules = {};
    
    if (!fs.existsSync(DOCS_DIR)) {
        warn('docs/ 目录不存在');
        return modules;
    }
    
    const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        
        const moduleId = entry.name;
        const moduleDir = path.join(DOCS_DIR, moduleId);
        
        // 加载 site-config 中的模块元数据
        const siteConfig = loadSiteConfig();
        const configModule = siteConfig?.modules?.[moduleId];
        
        // 检查是否有 index.html
        const indexPath = path.join(moduleDir, 'index.html');
        const hasIndex = fs.existsSync(indexPath);
        
        // 扫描版本目录（只包含数字格式的，如 1.21）
        const versionDirs = fs.readdirSync(moduleDir, { withFileTypes: true })
            .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'root' && /^\d+\.\d+/.test(e.name));
        
        let isVersioned = versionDirs.length > 0;
        let defaultVersion = null;
        let mcVersions = [];
        
        // 统计文档数量
        let tutorials = 0;
        let analysis = 0;
        const allDocs = [];
        
        if (isVersioned) {
            // 有版本目录（如 mc/1.21/）
            for (const vDir of versionDirs) {
                const vPath = path.join(moduleDir, vDir.name);
                
                // 收集版本号
                if (/^\d+\.\d+/.test(vDir.name)) {
                    mcVersions.push(vDir.name);
                }
                
                // 递归扫描所有 HTML 文件
                const docs = scanAllHtmlFiles(vPath);
                docs.forEach(doc => {
                    allDocs.push({
                        ...doc,
                        version: vDir.name,
                        type: classifyDoc(doc.relativePath)
                    });
                });
            }
            
            // 默认版本
            defaultVersion = mcVersions.includes('1.21') ? '1.21' : mcVersions[0];
        } else {
            // 无版本目录 - 递归扫描所有内容
            const docs = scanAllHtmlFiles(moduleDir);
            docs.forEach(doc => {
                allDocs.push({
                    ...doc,
                    version: null,
                    type: classifyDoc(doc.relativePath)
                });
            });
        }
        
        // 统计类型
        allDocs.forEach(doc => {
            if (doc.type === 'tutorial') {
                tutorials++;
            } else if (doc.type === 'analysis') {
                analysis++;
            }
        });
        
        modules[moduleId] = {
            name: configModule?.name || formatModuleName(moduleId),
            icon: configModule?.icon || 'fa-book',
            color: configModule?.color || '#5B8C5A',
            colorGradient: configModule?.colorGradient || 'linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)',
            description: configModule?.description || `${moduleId} 相关文档`,
            isVersioned,
            versions: isVersioned ? mcVersions : null,
            defaultVersion,
            tutorials,
            analysis,
            totalDocs: tutorials + analysis,
            allDocs,
            hasIndex,
            docsDir: `docs/${moduleId}`
        };
    }
    
    return modules;
}

function countHtmlFiles(dir) {
    try {
        return fs.readdirSync(dir).filter(f => f.endsWith('.html')).length;
    } catch {
        return 0;
    }
}

function countFilesInDir(dir, extensions) {
    try {
        if (!fs.existsSync(dir)) return 0;
        return fs.readdirSync(dir, { withFileTypes: true }).reduce((count, entry) => {
            if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                return count + 1;
            }
            return count;
        }, 0);
    } catch {
        return 0;
    }
}

function formatModuleName(id) {
    const names = {
        mc: 'Minecraft 原版',
        forge: 'Forge 模组',
        fabric: 'Fabric 生态',
        iris: 'Iris 光影',
        sodium: 'Sodium 优化',
        neoforge: 'NeoForge'
    };
    return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
}

// ── 首页 SITE_CONFIG.modules：自动合并 docs/ 中存在但未手写配置的模组 ──
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const AUTO_MODULES_START = '// scan-docs:auto-modules:start';
const AUTO_MODULES_END = '// scan-docs:auto-modules:end';
const SITE_CONFIG_INSERT_ANCHOR = '\n\n// ============================================\n// 辅助函数\n// ============================================\n\n/**\n * 获取模组的默认版本 URL';

/** 从 site-config.js 源码中解析手写 modules 的 key（不含自动合并块） */
function getManualModuleKeysFromSiteConfigSource(source) {
    const re = /    modules:\s*\{([\s\S]*?)\n    \},\s*\n\n    \/\/ ============================================\n    \/\/ 导航配置\n    \/\/ ============================================/;
    const m = source.match(re);
    if (!m) {
        warn('无法在 site-config.js 中解析 modules 块，跳过自动模组注入');
        return new Set();
    }
    const inner = m[1];
    const keys = new Set();
    const keyRe = /\n        ([a-zA-Z0-9_-]+):\s*\{/g;
    let mm;
    while ((mm = keyRe.exec(inner)) !== null) {
        keys.add(mm[1]);
    }
    return keys;
}

function inferIconForModule(id) {
    const map = {
        fabric: 'fa-puzzle-piece',
        forge: 'fa-hammer',
        neoforge: 'fa-fire',
        iris: 'fa-sun',
        sodium: 'fa-bolt',
        mc: 'fa-cube',
        lithium: 'fa-battery-full'
    };
    return map[id] || 'fa-folder-open';
}

function inferCategoryForModule(id) {
    if (id === 'fabric' || id === 'sodium') return 'fabric';
    if (id === 'forge' || id === 'neoforge') return 'forge';
    if (id === 'iris') return 'shader';
    return 'mc';
}

/** 为扫描到但未在 site-config modules 手写区出现的模组生成配置 */
function buildAutoSiteModuleEntry(id, sm, order) {
    const entry = {
        id,
        name: sm.name,
        shortName: formatModuleName(id).replace(/模组$/, '').replace(/生态$/, '').slice(0, 16),
        slug: id,
        icon: inferIconForModule(id),
        color: sm.color || '#404040',
        colorGradient: sm.colorGradient || 'linear-gradient(135deg, #2a2a2a 0%, #525252 55%, #737373 100%)',
        accentColor: '#171717',
        description:
            sm.description && sm.description !== `${id} 相关文档`
                ? sm.description
                : `${formatModuleName(id)}的教程与源码分析文档`,
        category: inferCategoryForModule(id),
        order,
        docsDir: sm.docsDir || `docs/${id}`,
        hasTutorials: sm.tutorials > 0,
        hasAnalysis: sm.analysis > 0,
        featured: []
    };
    if (sm.isVersioned && sm.defaultVersion && sm.versions && sm.versions.length) {
        entry.versions = {};
        for (const v of sm.versions) {
            entry.versions[v] = {
                name: v,
                codename: '',
                isDefault: v === sm.defaultVersion,
                status: 'stable',
                tutorialCount: 0,
                analysisCount: 0,
                releaseDate: ''
            };
        }
        entry.defaultVersion = sm.defaultVersion;
    } else {
        entry.versions = null;
        entry.defaultVersion = null;
    }
    return entry;
}

/**
 * 写入 / 更新 site-config.js 内的自动合并 IIFE，使 index.html 能展示新模组卡片
 */
function patchSiteConfigAutoModules(scannedModules) {
    if (!fs.existsSync(SITE_CONFIG_PATH)) {
        warn('未找到 scripts/site-config.js，跳过自动模组注入');
        return;
    }
    let source = fs.readFileSync(SITE_CONFIG_PATH, 'utf-8');
    const manualKeys = getManualModuleKeysFromSiteConfigSource(source);
    const autoIds = Object.keys(scannedModules)
        .filter((id) => !manualKeys.has(id))
        .sort();
    if (autoIds.length === 0) {
        if (source.includes(AUTO_MODULES_START)) {
            const emptyBlock = `${AUTO_MODULES_START}
(function applyAutoDiscoveredModulesFromDocs() {
    var AUTO_SITE_MODULES = {};
    if (typeof SITE_CONFIG === 'undefined' || !SITE_CONFIG.modules) return;
    Object.keys(AUTO_SITE_MODULES).forEach(function (id) {
        if (!SITE_CONFIG.modules[id]) SITE_CONFIG.modules[id] = AUTO_SITE_MODULES[id];
    });
})();
${AUTO_MODULES_END}`;
            source = source.replace(
                new RegExp(`${escapeRegExp(AUTO_MODULES_START)}[\\s\\S]*?${escapeRegExp(AUTO_MODULES_END)}`),
                emptyBlock
            );
            fs.writeFileSync(SITE_CONFIG_PATH, source, 'utf-8');
        }
        return;
    }
    const autoObj = {};
    let order = 50;
    for (const id of autoIds) {
        autoObj[id] = buildAutoSiteModuleEntry(id, scannedModules[id], order++);
    }
    const json = JSON.stringify(autoObj, null, 4);
    const block = `${AUTO_MODULES_START}
(function applyAutoDiscoveredModulesFromDocs() {
    var AUTO_SITE_MODULES = ${json};
    if (typeof SITE_CONFIG === 'undefined' || !SITE_CONFIG.modules) return;
    Object.keys(AUTO_SITE_MODULES).forEach(function (id) {
        if (!SITE_CONFIG.modules[id]) SITE_CONFIG.modules[id] = AUTO_SITE_MODULES[id];
    });
})();
${AUTO_MODULES_END}`;
    if (source.includes(AUTO_MODULES_START)) {
        source = source.replace(
            new RegExp(`${escapeRegExp(AUTO_MODULES_START)}[\\s\\S]*?${escapeRegExp(AUTO_MODULES_END)}`),
            block
        );
    } else if (source.includes(SITE_CONFIG_INSERT_ANCHOR)) {
        source = source.replace(SITE_CONFIG_INSERT_ANCHOR, `\n\n${block}${SITE_CONFIG_INSERT_ANCHOR}`);
    } else {
        warn('site-config.js 中未找到插入锚点，无法注入自动模组');
        return;
    }
    fs.writeFileSync(SITE_CONFIG_PATH, source, 'utf-8');
    success(`已同步首页模组配置（自动: ${autoIds.join(', ')}）`);
}

// ── 生成统计文件 ───────────────────────────────────────────
function generateStats(modules) {
    const totalModules = Object.keys(modules).length;
    let totalDocs = 0;
    let totalTutorials = 0;
    let totalAnalysis = 0;
    const mcVersions = [];
    
    for (const mod of Object.values(modules)) {
        totalDocs += mod.tutorials + mod.analysis;
        totalTutorials += mod.tutorials;
        totalAnalysis += mod.analysis;
        
        if (mod.isVersioned && mod.versions) {
            mcVersions.push(...mod.versions);
        }
    }
    
    // 去重并排序版本
    const uniqueVersions = [...new Set(mcVersions)].sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        return numB - numA; // 降序
    });
    
    const stats = {
        generated: new Date().toISOString(),
        totalDocs,
        totalModules,
        totalTutorials,
        totalAnalysis,
        mcVersions: uniqueVersions,
        modules: {}
    };
    
    // 转换模块格式
    for (const [id, mod] of Object.entries(modules)) {
        if (mod.isVersioned) {
            stats.modules[id] = {
                isVersioned: true,
                defaultVersion: mod.defaultVersion,
                versions: {}
            };
            
            // 按版本统计
            const versionCounts = {};
            mod.allDocs?.forEach(doc => {
                if (doc.version) {
                    if (!versionCounts[doc.version]) {
                        versionCounts[doc.version] = { tutorials: 0, analysis: 0 };
                    }
                    if (doc.type === 'tutorial') {
                        versionCounts[doc.version].tutorials++;
                    } else if (doc.type === 'analysis') {
                        versionCounts[doc.version].analysis++;
                    }
                }
            });
            
            for (const [v, counts] of Object.entries(versionCounts)) {
                stats.modules[id].versions[v] = counts;
            }
            
            // 如果没有按版本统计，使用总数
            if (Object.keys(stats.modules[id].versions).length === 0) {
                stats.modules[id].versions[mod.defaultVersion] = {
                    tutorials: mod.tutorials,
                    analysis: mod.analysis
                };
            }
        } else {
            stats.modules[id] = {
                isVersioned: false,
                tutorials: mod.tutorials,
                analysis: mod.analysis
            };
        }
    }
    
    return stats;
}

function writeSiteStatsJs(stats) {
    const content = `/** Generated by scan-docs.js — do not edit manually */
window.__SITE_STATS__ = ${JSON.stringify(stats)};
`;
    fs.writeFileSync(path.join(ROOT, 'site-stats.js'), content);
    success(`生成 site-stats.js (${Object.keys(stats.modules).length} 个模组)`);
}

function writeSiteStatsJson(stats) {
    fs.writeFileSync(path.join(ROOT, 'site-stats.json'), JSON.stringify(stats, null, 2));
    success(`生成 site-stats.json`);
}

// ── 生成模块索引页 ─────────────────────────────────────────
function generateModuleIndex(moduleId, moduleData) {
    if (!moduleData.hasIndex) {
        // 生成基础索引页
        const html = generateBasicIndex(moduleId, moduleData);
        const indexPath = path.join(DOCS_DIR, moduleId, 'index.html');
        fs.writeFileSync(indexPath, html);
        success(`生成 ${moduleId}/index.html`);
    }
}

function generateBasicIndex(moduleId, moduleData) {
    const relativePath = '../';
    const { name, icon, color, colorGradient, description, tutorials, analysis } = moduleData;
    const totalDocs = tutorials + analysis;
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
    (function () {
        try {
            var k = 'mc-learning-theme';
            var t = localStorage.getItem(k);
            if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
        } catch (e) {}
    })();
    </script>
    <title>${name} - Minecraft Learning</title>
    <link rel="stylesheet" href="${relativePath}styles.css">
    <link rel="stylesheet" href="${relativePath}styles/site-shell.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { --mi-accent: ${color}; --mi-grad: ${colorGradient}; }
        .module-hero {
            background: var(--mi-grad);
            padding: calc(70px + 2rem) 2rem 3rem;
            text-align: center;
        }
        .module-hero h1 { color: white; font-size: 2rem; margin-bottom: 0.5rem; }
        .module-hero p { color: rgba(255,255,255,0.9); font-size: 1rem; }
        .module-stats {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1.5rem;
        }
        .module-stat { color: white; }
        .module-stat strong { font-size: 1.5rem; }
        .module-body { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; }
        .section-title { font-size: 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .section-title i { color: var(--mi-accent); }
        .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .doc-card {
            background: var(--bg-primary);
            border: 1px solid var(--border-default);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            text-decoration: none;
            color: inherit;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .doc-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .doc-card-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            background: var(--mi-grad);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            flex-shrink: 0;
        }
        .doc-card h3 { font-size: 1rem; margin-bottom: 0.25rem; }
        .doc-card p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="${relativePath}index.html" class="nav-logo">
                <i class="fas fa-cube"></i>
                <span>Minecraft Learning</span>
            </a>
            <ul class="nav-links">
                <li><a href="${relativePath}index.html">首页</a></li>
                <li class="dropdown">
                    <a href="#">文档中心 <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content" id="moduleDropdown"></div>
                </li>
                <li><a href="${relativePath}about.html">关于</a></li>
            </ul>
            <div class="navbar-actions">
                <div class="theme-toggle" role="group" aria-label="主题切换">
                    <button type="button" class="theme-btn" data-theme="light" aria-label="浅色模式"><i class="fas fa-sun"></i></button>
                    <button type="button" class="theme-btn" data-theme="dark" aria-label="深色模式"><i class="fas fa-moon"></i></button>
                </div>
            </div>
        </div>
    </nav>

    <header class="module-hero">
        <h1><i class="fas ${icon}"></i> ${name}</h1>
        <p>${description}</p>
        <div class="module-stats">
            <div class="module-stat"><strong>${totalDocs}</strong><br><span>篇文档</span></div>
            <div class="module-stat"><strong>${tutorials}</strong><br><span>教程</span></div>
            <div class="module-stat"><strong>${analysis}</strong><br><span>分析</span></div>
        </div>
    </header>

    <main class="module-body">
        ${tutorials > 0 ? `
        <section>
            <h2 class="section-title"><i class="fas fa-graduation-cap"></i> 教程</h2>
            <div class="docs-grid" id="tutorialsGrid">
                <div class="empty-state">正在加载教程...</div>
            </div>
        </section>
        ` : ''}
        
        ${analysis > 0 ? `
        <section style="margin-top: 2rem;">
            <h2 class="section-title"><i class="fas fa-microscope"></i> 源码分析</h2>
            <div class="docs-grid" id="analysisGrid">
                <div class="empty-state">正在加载分析文档...</div>
            </div>
        </section>
        ` : ''}
        
        ${totalDocs === 0 ? `
        <div class="empty-state">
            <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>暂无文档内容</p>
        </div>
        ` : ''}
    </main>

    <script src="${relativePath}scripts/theme.js"></script>
    <script>
        // 加载站点统计并渲染文档列表
        async function init() {
            // 渲染导航下拉
            if (typeof window.__SITE_STATS__ !== 'undefined') {
                const stats = window.__SITE_STATS__;
                const dropdown = document.getElementById('moduleDropdown');
                if (dropdown && stats.modules) {
                    dropdown.innerHTML = Object.keys(stats.modules).map(key => {
                        const m = stats.modules[key];
                        const href = m.isVersioned
                            ? '${relativePath}docs/' + key + '/' + m.defaultVersion + '/index.html'
                            : '${relativePath}docs/' + key + '/index.html';
                        return '<a href="' + href + '">' + key + '</a>';
                    }).join('');
                }
            }
            
            // 这里可以添加动态加载文档列表的逻辑
        }
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>`;
}

// ── 主函数 ─────────────────────────────────────────────────
function main() {
    const args = process.argv.slice(2);
    const mode = args[0];
    
    console.log(`\n${C_BOLD}╔═══════════════════════════════════════════════╗`);
    console.log(`║   📚 MC Learning - 文档构建工具              ║`);
    console.log(`╚═══════════════════════════════════════════════╝${C_RESET}\n`);
    
    // 扫描 docs 目录
    log('扫描 docs/ 目录...');
    const modules = scanDocsDir();
    
    if (Object.keys(modules).length === 0) {
        warn('未发现任何模组');
        return;
    }
    
    console.log(`\n发现 ${Object.keys(modules).length} 个模组:`);
    for (const [id, mod] of Object.entries(modules)) {
        console.log(`  • ${id}: ${mod.name} (${mod.tutorials + mod.analysis} 篇文档)`);
    }
    
    // 生成统计
    log('\n生成站点统计...');
    const stats = generateStats(modules);
    writeSiteStatsJs(stats);
    writeSiteStatsJson(stats);

    log('同步 scripts/site-config.js（首页卡片 / 导航）...');
    patchSiteConfigAutoModules(modules);
    
    console.log(`\n${C_GREEN}✓ 构建完成${C_RESET}`);
    console.log(`  总文档: ${stats.totalDocs}`);
    console.log(`  总模组: ${stats.totalModules}`);
    console.log(`  MC 版本: ${stats.mcVersions.length > 0 ? stats.mcVersions.join(', ') : '无'}\n`);
}

// 导出供 watch.js 使用
module.exports = {
    scanDocsDir,
    generateStats,
    writeSiteStatsJs,
    writeSiteStatsJson,
    patchSiteConfigAutoModules
};

// 直接运行
if (require.main === module) {
    main();
}
