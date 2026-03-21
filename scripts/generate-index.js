/**
 * Dynamic Index Generator
 * 构建时扫描 docs/ 目录，生成索引文件
 * 
 * 使用方法: node scripts/generate-index.js
 */

const fs = require('fs');
const path = require('path');

// 模块配置
const moduleConfig = {
    mc: {
        name: 'Minecraft 原版',
        icon: 'cube',
        color: '#5B8C5A',
        colorGradient: 'linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)',
        description: 'Minecraft 核心架构与源码深度解析',
        hasVersions: true,
        docTypes: ['analysis', 'tutorials']
    },
    iris: {
        name: 'Iris 光影',
        icon: 'sun',
        color: '#E07A5F',
        colorGradient: 'linear-gradient(135deg, #E07A5F 0%, #F2CC8F 100%)',
        description: 'Shader 加载器与渲染管线深度解析',
        hasVersions: false,
        docTypes: ['analysis', 'tutorials']
    },
    sodium: {
        name: 'Sodium 优化',
        icon: 'bolt',
        color: '#F2CC8F',
        colorGradient: 'linear-gradient(135deg, #F2CC8F 0%, #FFE066 100%)',
        description: '现代渲染优化与 Sodium 架构设计',
        hasVersions: false,
        docTypes: ['analysis', 'tutorials']
    },
    fabric: {
        name: 'Fabric 模组',
        icon: 'layer-group',
        color: '#7B68EE',
        colorGradient: 'linear-gradient(135deg, #7B68EE 0%, #9370DB 100%)',
        description: 'Fabric 模组开发框架详解',
        hasVersions: false,
        docTypes: ['analysis', 'tutorials']
    },
    lithium: {
        name: 'Lithium 优化',
        icon: 'atom',
        color: '#20B2AA',
        colorGradient: 'linear-gradient(135deg, #20B2AA 0%, #48D1CC 100%)',
        description: '游戏性能优化插件分析',
        hasVersions: false,
        docTypes: ['analysis', 'tutorials']
    }
};

// 描述推断映射
const descMap = {
    'architecture': '架构与设计模式',
    'client': '客户端模块',
    'server': '服务端模块',
    'world': '世界系统',
    'entity': '实体系统',
    'block': '方块系统',
    'item': '物品系统',
    'network': '网络协议',
    'render': '渲染系统',
    'chunk': '区块系统',
    'biome': '生物群系',
    'terrain': '地形生成',
    'ai': 'AI 系统',
    'command': '命令系统',
    'resource': '资源系统',
    'datafixer': '数据修复',
    'registry': '注册表',
    'package': '包结构',
    'shader': '着色器',
    'shadow': '阴影系统',
    'optimization': '性能优化',
    'multithreading': '多线程',
    'thread': '线程'
};

/**
 * 根据文件名推断标题
 */
function inferTitle(id) {
    const cleaned = id.replace(/^\d+-/, '').replace(/^\d+/, '');
    return cleaned
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/Mc/g, 'MC')
        .replace(/Cpu/g, 'CPU')
        .replace(/Gpu/g, 'GPU')
        .replace(/Ai/g, 'AI')
        .replace(/Io/g, 'IO')
        .trim();
}

/**
 * 根据文件名推断描述
 */
function inferDesc(id) {
    const lower = id.toLowerCase();
    for (const [key, desc] of Object.entries(descMap)) {
        if (lower.includes(key)) return desc;
    }
    return '相关内容';
}

/**
 * 获取目录下的 HTML 文件
 */
function getHtmlFiles(dirPath) {
    try {
        return fs.readdirSync(dirPath)
            .filter(f => f.endsWith('.html'))
            .filter(f => !f.startsWith('index'))
            .filter(f => !f.startsWith('README'))
            .filter(f => !f.startsWith('SUMMARY'))
            .sort();
    } catch (e) {
        return [];
    }
}

/**
 * 获取子目录
 */
function getSubdirectories(dirPath) {
    try {
        return fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
    } catch (e) {
        return [];
    }
}

/**
 * 解析文档文件获取标题
 */
function parseDocFile(filePath) {
    const filename = path.basename(filePath, '.html');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 尝试从 <title> 标签获取
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    let title = inferTitle(filename);
    
    if (titleMatch) {
        // 清理标题，移除网站名后缀
        title = titleMatch[1].split(' - ')[0].trim();
    }
    
    // 尝试从 h1 获取
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
        title = h1Match[1].trim();
    }
    
    return {
        id: filename,
        title: title,
        desc: inferDesc(filename),
        time: '待定',
        filename: `${filename}.html`
    };
}

/**
 * 扫描模块
 */
function scanModule(slug, basePath) {
    const config = moduleConfig[slug];
    if (!config) return null;
    
    const modulePath = path.join(basePath, slug);
    const result = {
        slug: slug,
        name: config.name,
        icon: config.icon,
        color: config.color,
        colorGradient: config.colorGradient,
        description: config.description,
        docsDir: `docs/${slug}`
    };
    
    if (config.hasVersions) {
        // 多版本模块（如 mc）
        const versions = {};
        const versionDirs = getSubdirectories(modulePath);
        
        versionDirs.forEach(version => {
            versions[version] = {
                name: version,
                docs: {}
            };
            
            config.docTypes.forEach(type => {
                const typePath = path.join(modulePath, version, type);
                const files = getHtmlFiles(typePath);
                
                if (files.length > 0) {
                    versions[version].docs[type] = files.map(f => 
                        parseDocFile(path.join(typePath, f))
                    );
                }
            });
        });
        
        // 按版本号排序（降序）
        result.versions = Object.entries(versions)
            .sort((a, b) => compareVersions(b[0], a[0]))
            .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});
    } else {
        // 单版本模块（如 iris, sodium）
        result.docs = {};
        
        config.docTypes.forEach(type => {
            const typePath = path.join(modulePath, type);
            const files = getHtmlFiles(typePath);
            
            if (files.length > 0) {
                result.docs[type] = files.map(f => 
                    parseDocFile(path.join(typePath, f))
                );
            }
        });
    }
    
    return result;
}

/**
 * 比较版本号
 */
function compareVersions(a, b) {
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
 * 主函数
 */
function main() {
    const basePath = path.join(__dirname, '..', 'website', 'docs');
    const outputPath = path.join(__dirname, '..', 'website', 'docs-index.json');
    
    const modules = {};
    const moduleDirs = getSubdirectories(basePath);
    
    moduleDirs.forEach(slug => {
        const module = scanModule(slug, basePath);
        if (module) {
            modules[slug] = module;
        }
    });
    
    const output = {
        version: '1.0',
        generated: new Date().toISOString(),
        modules: modules
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    
    console.log('✓ docs-index.json 生成完成');
    console.log(`  模块数量: ${Object.keys(modules).length}`);
    
    Object.entries(modules).forEach(([slug, mod]) => {
        if (mod.versions) {
            const versions = Object.keys(mod.versions);
            const totalDocs = versions.reduce((sum, v) => {
                return sum + Object.values(mod.versions[v].docs)
                    .reduce((s, arr) => s + arr.length, 0);
            }, 0);
            console.log(`  - ${mod.name}: ${versions.length} 个版本, ${totalDocs} 篇文档`);
        } else {
            const totalDocs = Object.values(mod.docs)
                .reduce((sum, arr) => sum + arr.length, 0);
            console.log(`  - ${mod.name}: ${totalDocs} 篇文档`);
        }
    });
}

main();
