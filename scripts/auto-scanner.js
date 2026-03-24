/**
 * Auto Module Scanner - 全自动模块发现系统
 *
 * 功能：
 * 1. 自动扫描 content/ 目录发现所有模块
 * 2. 自动检测模块是否有版本分支
 * 3. 自动生成模块配置（名称、颜色、图标等）
 * 4. 不需要手动注册新模块
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
    // 基于模块名生成固定颜色
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
    'neoforge': 'hammer',
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
    'mod': '模组开发教程与指南'
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

        // 检查是否有版本子目录（Minecraft 等有多版本的模块）
        const versions = this.detectVersions(modulePath);

        // 扫描教程和分析文档
        const tutorials = this.scanDocType(modulePath, 'tutorials', versions);
        const analysis = this.scanDocType(modulePath, 'analysis', versions);

        // 获取描述
        const description = descriptionMap[slug] || `${slug} 相关文档`;

        return {
            name: this.formatModuleName(slug),
            slug: slug,
            icon: this.detectIcon(slug, tutorials, analysis),
            color: colorScheme.color,
            colorGradient: colorScheme.gradient,
            description: description,
            versions: versions.length > 0 ? versions : null,
            defaultVersion: versions.length > 0 ? versions[0] : null,
            docsDir: `docs/${slug}`,
            tutorials: tutorials,
            analysis: analysis,
            docCount: tutorials.length + analysis.length,
            theme: slug
        };
    }

    /**
     * 检测是否有版本目录
     */
    detectVersions(modulePath) {
        const entries = fs.readdirSync(modulePath, { withFileTypes: true });
        const versions = [];

        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                // 检查是否是版本目录（通常是数字格式如 1.18, 1.21, 1.21.4）
                if (this.isVersionDir(entry.name)) {
                    versions.push(entry.name);
                }
            }
        }

        // 排序版本（降序，最新版本在前）
        versions.sort((a, b) => this.compareVersions(b, a));

        return versions;
    }

    /**
     * 判断是否是版本目录
     */
    isVersionDir(name) {
        // 版本格式: 1.18, 1.18.2, 1.19.4, 1.20.4, 1.21, 1.21.4
        return /^\d+\.\d+(\.\d+)?$/.test(name);
    }

    /**
     * 扫描特定文档类型
     */
    scanDocType(modulePath, docType, versions) {
        const docs = [];

        if (versions.length > 0) {
            // 有版本：扫描每个版本的文档
            for (const version of versions) {
                const typePath = path.join(modulePath, version, docType);
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
                    // 跳过 README 和 SUMMARY
                    if (entry.name === 'README.md' || entry.name === 'SUMMARY.md') {
                        continue;
                    }

                    // 读取文件获取标题
                    const title = this.extractTitle(fullPath, entry.name);

                    // 提取 Part 信息（与 converter.js getActualDocFiles 一致：用数字字符串 '0'..'n'，便于分组与排序）
                    const partMatch = relativePath.match(/[Pp]art[-_]?(\d+)/);
                    const part = partMatch ? partMatch[1] : 'Other';

                    // 相对 tutorials|analysis 的路径（不含 .md），与生成 HTML 路径一致，含 Part-* / part-* 子目录
                    const fileKey = relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');
                    const htmlPath = `${fileKey}.html`;

                    files.push({
                        file: fileKey,
                        htmlPath: htmlPath,
                        title: title,
                        part: part,
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
        if (iconMap[slug]) {
            return iconMap[slug];
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
            'neoforge': 'NeoForge 模组'
        };

        if (nameMap[slug]) {
            return nameMap[slug];
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
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);

        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA !== numB) return numA - numB;
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
