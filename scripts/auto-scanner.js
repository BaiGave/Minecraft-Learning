/**
 * Auto Module Scanner - 全自动模块发现系统
 *
 * 功能：
 * 1. 自动扫描 content/ 目录发现所有模块
 * 2. 自动检测模块是否有版本分支
 * 3. 自动生成模块配置（名称、颜色、图标等）
 * 4. 不需要手动注册新模块
 *
 * 目录结构：
 * content/{模组}/{MC版本}/{加载器}/{模组版本}/{tutorials,analysis}/...
 *
 * 示例：
 *   content/mc/1.21/core/-/tutorials/...
 *   content/fabric/1.21/core/-/tutorials/...
 *   content/sodium/1.21/fabric/0.8.6/tutorials/...
 *   content/iris/1.21/fabric/1.7.3/tutorials/...
 *
 * 使用方法：
 *   node auto-scanner.js          # 扫描并打印配置
 *   node auto-scanner.js --watch  # 监听变化
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
    contentDir: path.join(__dirname, '..', 'content'),
    outputConfig: path.join(__dirname, 'auto-config.js')
};

// ============================================================================
// 颜色生成器
// ============================================================================

function generateColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }

    const colors = [
        { color: '#5B8C5A', gradient: 'linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)' },
        { color: '#4A90D9', gradient: 'linear-gradient(135deg, #4A90D9 0%, #5BA0E9 100%)' },
        { color: '#E07A5F', gradient: 'linear-gradient(135deg, #E07A5F 0%, #F2CC8F 100%)' },
        { color: '#F2CC8F', gradient: 'linear-gradient(135deg, #F2CC8F 0%, #FFE066 100%)' },
        { color: '#7B68EE', gradient: 'linear-gradient(135deg, #7B68EE 0%, #9370DB 100%)' },
        { color: '#20B2AA', gradient: 'linear-gradient(135deg, #20B2AA 0%, #48D1CC 100%)' },
        { color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' },
        { color: '#9B59B6', gradient: 'linear-gradient(135deg, #9B59B6 0%, #B370CF 100%)' },
        { color: '#3498DB', gradient: 'linear-gradient(135deg, #3498DB 0%, #5DADE2 100%)' },
        { color: '#1ABC9C', gradient: 'linear-gradient(135deg, #1ABC9C 0%, #48C9B0 100%)' }
    ];

    return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// 图标映射
// ============================================================================

const iconMap = {
    'mc': 'cube',
    'minecraft': 'cube',
    'forge': 'hammer',
    'fabric': 'layer-group',
    'neoforge': 'fire',
    'iris': 'sun',
    'sodium': 'bolt',
    'lithium': 'atom',
    'optifine': 'search',
    'optifabric': 'magic',
    'rei': 'compass',
    'emi': 'wand-magic',
    'jei': 'book',
    'waila': 'eye',
    'hxr': 'box',
    'research': 'microscope',
    'tutorial': 'graduation-cap',
    'analysis': 'microscope',
    'mod': 'puzzle-piece'
};

// ============================================================================
// 模块描述映射
// ============================================================================

const descriptionMap = {
    'mc': 'Minecraft 原版核心架构与源码深度解析',
    'minecraft': 'Minecraft 原版核心架构与源码深度解析',
    'forge': 'Forge 模组开发框架详解',
    'fabric': 'Fabric 模组开发框架详解',
    'neoforge': 'NeoForge 模组开发框架详解',
    'iris': 'Iris 光影加载器与渲染管线深度解析',
    'sodium': 'Sodium 现代渲染优化与架构设计',
    'lithium': 'Lithium 游戏性能优化插件分析',
    'optifine': 'OptiFine 光影优化深度解析',
    'immersionportalsmod': 'Immersive Portals 传送门模组深度解析'
};

// ============================================================================
// 主扫描器类
// ============================================================================

class AutoModuleScanner {

    /**
     * 扫描所有模块
     */
    scanModules() {
        const modules = {};
        const contentPath = CONFIG.contentDir;

        if (!fs.existsSync(contentPath)) {
            console.warn(`⚠ content 目录不存在: ${contentPath}`);
            return modules;
        }

        // 扫描 content/ 下的每个子目录（每个子目录 = 一个模块）
        const entries = fs.readdirSync(contentPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) {
                continue;
            }

            const moduleSlug = entry.name;
            const modulePath = path.join(contentPath, moduleSlug);

            // 扫描该模块的信息
            const moduleInfo = this.scanModule(moduleSlug, modulePath);

            if (moduleInfo.docCount > 0) {
                modules[moduleSlug] = moduleInfo;
            }
        }

        return modules;
    }

    /**
     * 扫描单个模块
     */
    scanModule(slug, modulePath) {
        const colorScheme = generateColor(slug);

        // 检查是否有版本子目录
        const versions = this.detectVersions(modulePath);

        // 扫描教程和分析文档
        const tutorials = this.scanDocType(modulePath, 'tutorials', versions);
        const analysis = this.scanDocType(modulePath, 'analysis', versions);

        // 从 README frontmatter 读取模块元信息（自动发现，无需硬编码）
        const readmeMeta = this.readModuleReadme(modulePath);

        // 描述：README priority > 硬编码表 > 通用回退
        const description = readmeMeta.description
            || descriptionMap[slug.toLowerCase()]
            || `${slug} 相关文档`;

        return {
            name: readmeMeta.name || this.formatModuleName(slug),
            slug: slug,
            icon: readmeMeta.icon || this.detectIcon(slug, tutorials, analysis),
            color: colorScheme.color,
            colorGradient: colorScheme.gradient,
            description: description,
            versions: versions.length > 0 ? versions : null,
            defaultVersion: versions.length > 0 ? versions[0] : null,
            docsDir: `docs/${slug}`,
            tutorials: tutorials,
            analysis: analysis,
            docCount: tutorials.length + analysis.length,
            theme: slug,
            sourceUrl: readmeMeta.sourceUrl || null,
            modVersion: readmeMeta.modVersion || null,
            minecraftVersion: readmeMeta.minecraftVersion || null,
            loader: readmeMeta.loader || null
        };
    }

    /**
     * 读取模组根 README.md 的 frontmatter，提取元信息。
     * 查找顺序：content/{模组}/README.md → content/{模组}/{版本}/README.md
     */
    readModuleReadme(modulePath) {
        const candidates = [path.join(modulePath, 'README.md')];
        if (fs.existsSync(modulePath)) {
            fs.readdirSync(modulePath, { withFileTypes: true })
                .filter(e => e.isDirectory() && !e.name.startsWith('.'))
                .forEach(e => candidates.push(path.join(modulePath, e.name, 'README.md')));
        }

        for (const readmePath of candidates) {
            if (!fs.existsSync(readmePath)) continue;
            try {
                const raw = fs.readFileSync(readmePath, 'utf-8');
                const fm = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
                if (!fm) continue;

                const meta = {};
                fm[1].split('\n').forEach(line => {
                    const m = line.match(/^(\w+):\s*(.+)$/);
                    if (m) meta[m[1].trim()] = m[2].trim();
                });

                return {
                    name: meta.title || null,
                    description: meta.description || null,
                    icon: meta.icon ? meta.icon.replace(/^fa-/, '') : null,
                    sourceUrl: meta.sourceUrl || null,
                    modVersion: meta.modVersion || meta.version || null,
                    minecraftVersion: meta.minecraftVersion || meta.mcVersion || null,
                    loader: meta.loader || null
                };
            } catch (_) { /* ignore */ }
        }
        return {};
    }

    /**
     * 检测是否有版本目录
     * 新结构：content/{模组}/{MC版本}/{加载器}/{模组版本}/
     * 示例：iris/1.21/fabric/1.7.3/tutorials, mc/1.21/core/-/tutorials
     */
    detectVersions(modulePath) {
        const versions = [];
        const versionSet = new Set();

        // 递归扫描找到所有包含 tutorials 或 analysis 的路径
        const scanForContent = (dirPath, parts = [], depth = 0) => {
            if (!fs.existsSync(dirPath)) return;

            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

                const subPath = path.join(dirPath, entry.name);

                // 检查是否是 tutorials 或 analysis
                if (entry.name === 'tutorials' || entry.name === 'analysis') {
                    // 找到了内容目录，从 parts 中提取版本信息
                    // 嵌套结构：parts = {MC版本, 加载器, 模组版本}（至少 2 段）
                    // 扁平结构：单层目录名即完整版本键，如 1.21.11-fabric-0.2.13-alpha/tutorials
                    if (parts.length >= 2) {
                        // 补齐到 3 层
                        while (parts.length < 3) {
                            parts.push('-');
                        }
                        const versionStr = parts.join('-');
                        if (!versionSet.has(versionStr)) {
                            versionSet.add(versionStr);
                            versions.push(versionStr);
                        }
                    } else if (parts.length === 1) {
                        const versionStr = parts[0];
                        if (!versionSet.has(versionStr)) {
                            versionSet.add(versionStr);
                            versions.push(versionStr);
                        }
                    }
                    continue;
                }

                // 继续递归
                scanForContent(subPath, [...parts, entry.name], depth + 1);
            }
        };

        scanForContent(modulePath);

        // 排序版本（降序，最新版本在前）
        versions.sort((a, b) => this.compareVersions(b, a));

        return versions;
    }

    /**
     * 判断是否是版本目录
     * 支持：1.21、1.21.4
     */
    isVersionDir(name) {
        return /^\d+\.\d+(\.\d+)?$/.test(name);
    }

    /**
     * 从版本目录名解析 MC 版本与可选加载器后缀，用于排序
     */
    parseVersionDir(name) {
        const m = name.match(/^(\d+\.\d+(?:\.\d+)?)(?:-([a-z0-9_-]+))?$/i);
        if (!m) return { nums: [0, 0, 0], loader: name };
        const nums = m[1].split('.').map(n => parseInt(n, 10) || 0);
        while (nums.length < 3) nums.push(0);
        return { nums, loader: (m[2] || '').toLowerCase() };
    }

    /**
     * 从相对路径取 Part 序号与文件夹后缀（Part-2-Rendering/foo.md → 2, Rendering）
     */
    extractPartFolderMeta(relativePath) {
        const norm = String(relativePath).replace(/\\/g, '/');
        const firstSeg = norm.split('/')[0] || '';
        const m =
            firstSeg.match(/^Part-(\d+)(?:-(.+))?$/i) ||
            firstSeg.match(/^part-(\d+)(?:-(.+))?$/i);
        if (!m) return { part: 'Other', partSuffix: null };
        return { part: m[1], partSuffix: m[2] || null };
    }

    /**
     * 扫描特定文档类型
     */
    scanDocType(modulePath, docType, versions) {
        const docs = [];

        if (versions.length > 0) {
            // 有版本：扫描每个版本的文档
            for (const version of versions) {
                // 优先扁平目录：content/{模组}/{MC-加载器-模组版本}/{tutorials|analysis}/
                const flatPath = path.join(modulePath, version, docType);
                if (fs.existsSync(flatPath)) {
                    const files = this.scanMarkdownFiles(flatPath, version);
                    docs.push(...files);
                    continue;
                }
                // 嵌套：1.21-core-- -> 1.21/core/-/
                const versionParts = version.split('-');
                const mcVersion = versionParts[0];
                const loader = versionParts[1] || 'core';
                const modVersion = versionParts.slice(2).join('-') || '-';

                const typePath = path.join(modulePath, mcVersion, loader, modVersion, docType);
                if (fs.existsSync(typePath)) {
                    const files = this.scanMarkdownFiles(typePath, version);
                    docs.push(...files);
                }
            }
        } else {
            // 无版本：直接在模块目录下扫描
            const typePath = path.join(modulePath, docType);
            if (fs.existsSync(typePath)) {
                const files = this.scanMarkdownFiles(typePath);
                docs.push(...files);
            }
        }

        return docs;
    }

    /**
     * 扫描 Markdown 文件
     */
    scanMarkdownFiles(dir, version = null) {
        const files = [];

        const scanRecursive = (currentDir, subPath = '') => {
            if (!fs.existsSync(currentDir)) return;

            const entries = fs.readdirSync(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const relativePath = subPath ? `${subPath}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    // 递归扫描子目录（如 Part-X-XXX 文件夹）
                    scanRecursive(fullPath, relativePath);
                } else if (entry.name.endsWith('.md')) {
                    const atTypeRoot = !subPath || subPath === '.' || subPath === '';
                    const isTopLevelIndex =
                        atTypeRoot &&
                        (entry.name === 'README.md' || entry.name === 'SUMMARY.md');
                    if (
                        (entry.name === 'README.md' || entry.name === 'SUMMARY.md') &&
                        !isTopLevelIndex
                    ) {
                        continue;
                    }

                    // 读取文件获取标题
                    const title = this.extractTitle(fullPath, entry.name);

                    // Part 与文件夹后缀
                    const { part, partSuffix } = this.extractPartFolderMeta(relativePath);

                    // 相对路径（不含 .md）
                    const fileKey = relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');
                    const htmlPath = `${fileKey}.html`;

                    files.push({
                        file: fileKey,
                        htmlPath: htmlPath,
                        title: title,
                        part: part,
                        partSuffix: partSuffix,
                        version: version,
                        fullPath: fullPath
                    });
                }
            }
        };

        scanRecursive(dir);
        return files;
    }

    /**
     * 从 Markdown 文件提取标题
     */
    extractTitle(filePath, fallbackName) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // 尝试从 frontmatter 提取
            const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
            if (frontmatterMatch) {
                const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m);
                if (titleMatch) {
                    return titleMatch[1].trim();
                }
            }

            // 尝试从第一个 # 标题提取
            const headingMatch = content.match(/^#\s+(.+)$/m);
            if (headingMatch) {
                return headingMatch[1].trim();
            }
        } catch (e) {
            // 忽略错误
        }

        // 使用文件名作为回退
        return fallbackName.replace(/\.md$/, '').replace(/\d+-/g, '').replace(/-/g, ' ');
    }

    /**
     * 检测模块图标
     */
    detectIcon(slug, tutorials, analysis) {
        if (iconMap[slug.toLowerCase()]) {
            return iconMap[slug.toLowerCase()];
        }

        // 基于文档内容推测
        if (tutorials.some(t => t.title.toLowerCase().includes('shader'))) {
            return 'palette';
        }
        if (analysis.some(a => a.title.toLowerCase().includes('render'))) {
            return 'paint-brush';
        }

        return 'book';
    }

    /**
     * 格式化模块名称
     */
    formatModuleName(slug) {
        const nameMap = {
            'mc': 'Minecraft 原版',
            'minecraft': 'Minecraft 原版',
            'iris': 'Iris 光影',
            'sodium': 'Sodium 优化',
            'lithium': 'Lithium 优化',
            'forge': 'Forge 模组',
            'fabric': 'Fabric 模组',
            'neoforge': 'NeoForge 模组',
            'immersionportalsmod': 'Immersive Portals'
        };

        const key = slug.toLowerCase();
        if (nameMap[key]) {
            return nameMap[key];
        }

        // 将 slug 转换为可读名称
        return slug
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * 比较版本号
     */
    compareVersions(a, b) {
        const pa = this.parseVersionDir(a);
        const pb = this.parseVersionDir(b);
        for (let i = 0; i < 3; i++) {
            const na = pa.nums[i] || 0;
            const nb = pb.nums[i] || 0;
            if (na !== nb) return na - nb;
        }
        if (pa.loader !== pb.loader) {
            return pa.loader.localeCompare(pb.loader);
        }
        return 0;
    }

    /**
     * 生成配置代码
     */
    generateConfig(modules) {
        let code = `/**
 * 自动生成的模块配置
 * 由 auto-scanner.js 自动生成
 * 不要手动修改此文件！
 */

const path = require('path');

const autoModules = ${JSON.stringify(modules, null, 4)};

module.exports = { autoModules };
`;
        return code;
    }

    /**
     * 生成导航配置
     */
    generateNavigation(modules) {
        const tutorialsNav = {};
        const analysisNav = {};

        for (const [slug, module] of Object.entries(modules)) {
            // 教程导航
            if (module.tutorials.length > 0) {
                tutorialsNav[slug] = module.tutorials.map(doc => ({
                    id: doc.file,
                    title: doc.title,
                    icon: 'book',
                    file: doc.file,
                    part: doc.part
                }));
            }

            // 分析导航
            if (module.analysis.length > 0) {
                analysisNav[slug] = module.analysis.map(doc => ({
                    id: doc.file,
                    title: doc.title,
                    icon: 'microscope',
                    file: doc.file
                }));
            }
        }

        return { tutorialsNav, analysisNav };
    }
}

// ============================================================================
// 主程序
// ============================================================================

function main() {
    const scanner = new AutoModuleScanner();

    console.log('\n🔍 扫描 content/ 目录...\n');

    const modules = scanner.scanModules();

    console.log(`📦 发现 ${Object.keys(modules).length} 个模块:\n`);

    for (const [slug, module] of Object.entries(modules)) {
        console.log(`  📚 ${module.name}`);
        console.log(`     路径: docs/${slug}`);
        if (module.versions) {
            console.log(`     版本: ${module.versions.join(', ')}`);
        }
        console.log(`     教程: ${module.tutorials.length} 篇`);
        console.log(`     分析: ${module.analysis.length} 篇`);
        console.log();
    }

    // 生成配置文件
    const configCode = scanner.generateConfig(modules);
    fs.writeFileSync(CONFIG.outputConfig, configCode, 'utf-8');
    console.log(`✅ 已生成配置文件: ${CONFIG.outputConfig}\n`);

    // 生成导航配置
    const { tutorialsNav, analysisNav } = scanner.generateNavigation(modules);
    console.log('📋 导航配置已生成');
    console.log(`   教程: ${Object.keys(tutorialsNav).length} 个模块`);
    console.log(`   分析: ${Object.keys(analysisNav).length} 个模块\n`);

    return { modules, tutorialsNav, analysisNav };
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { AutoModuleScanner };
