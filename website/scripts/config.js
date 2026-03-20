/**
 * 文档转换配置文件
 * 定义模组配置、颜色主题、导航结构等
 *
 * 使用方法：
 * 1. 添加新模组：在 modules 中添加配置
 * 2. 设置 sourceDir：指向模组的 analysis 目录
 * 3. 设置 versions：null 表示无版本，有数组表示支持多版本
 * 4. 配置 navigation：定义文档导航顺序
 * 5. 运行 node converter.js [模组名]
 */

const path = require('path');

// ============================================
// 模组配置
// ============================================
// 格式说明：
// - name: 显示名称
// - slug: URL 路径标识 (docs/{slug}/)
// - icon: FontAwesome 图标
// - color: 主色调 (用于样式)
// - colorGradient: 渐变背景
// - description: 描述
// - versions: null (无版本) 或 ['1.21', '1.20'] (多版本)
// - defaultVersion: 默认版本 (如 '1.21')
// - docsDir: 输出目录 (相对于 website/)
// - sourceDir: Markdown 源文件目录
// - theme: 主题标识

const modules = {

    // ========== Minecraft 原版 ==========
    mc: {
        name: 'Minecraft 原版',
        slug: 'mc',
        icon: 'cube',
        color: '#5B8C5A',
        colorGradient: 'linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)',
        description: 'Minecraft 核心架构与源码深度解析',
        versions: ['1.21', '1.20', '1.19', '1.18'],
        defaultVersion: '1.21',
        docsDir: 'docs/mc',
        theme: 'mc'
    },

    // ========== Iris 光影 ==========
    iris: {
        name: 'Iris 光影',
        slug: 'iris',
        icon: 'sun',
        color: '#E07A5F',
        colorGradient: 'linear-gradient(135deg, #E07A5F 0%, #F2CC8F 100%)',
        description: 'Shader 加载器与渲染管线深度解析',
        versions: null,
        defaultVersion: null,
        docsDir: 'docs/iris',
        sourceDir: 'D:/Projects/Iris-1.7.3-1.21/analysis',
        theme: 'iris'
    },

    // ========== Sodium 优化 ==========
    sodium: {
        name: 'Sodium 优化',
        slug: 'sodium',
        icon: 'bolt',
        color: '#F2CC8F',
        colorGradient: 'linear-gradient(135deg, #F2CC8F 0%, #FFE066 100%)',
        description: '现代渲染优化与 Sodium 架构设计',
        versions: null,
        defaultVersion: null,
        docsDir: 'docs/sodium',
        sourceDir: 'D:/Projects/sodium/analysis',
        theme: 'sodium'
    },

    // ========== 示例: 如何添加新模组 ==========
    // new_mod: {
    //     name: '新模组名称',
    //     slug: 'new-mod',
    //     icon: 'puzzle-piece',
    //     color: '#FF6B6B',
    //     colorGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
    //     description: '模组描述',
    //     versions: null,  // 或 ['1.21', '1.20'] 用于多版本
    //     defaultVersion: null,
    //     docsDir: 'docs/new-mod',
    //     sourceDir: 'D:/Projects/new-mod/analysis',
    //     theme: 'generic'
    // },
};

// ============================================
// 导航结构
// ============================================
// 每个模组的文档导航顺序
// - id: 唯一标识
// - title: 显示标题
// - icon: FontAwesome 图标
// - file: 文件名 (不含 .html)

const navigation = {

    mc: [
        { id: 'architecture', title: '架构总览', icon: 'sitemap', file: '01-architecture-overview' },
        { id: 'client', title: '客户端模块', icon: 'desktop', file: '02-client-module' },
        { id: 'server', title: '服务端模块', icon: 'server', file: '03-server-module' },
        { id: 'world', title: '世界系统', icon: 'globe', file: '04-world-system' },
        { id: 'entity', title: '实体系统', icon: 'paw', file: '05-entity-system' },
        { id: 'block-item', title: '方块物品', icon: 'box', file: '06-block-item-system' },
        { id: 'network', title: '网络协议', icon: 'network-wired', file: '07-network-protocol' },
        { id: 'datafixer', title: '数据修复', icon: 'database', file: '08-datafixer-system' },
        { id: 'registry', title: '注册表系统', icon: 'archive', file: '09-registry-system' },
        { id: 'package', title: '包结构', icon: 'folder', file: '10-package-structure' }
    ],

    iris: [
        { id: 'architecture', title: '架构总览', icon: 'sitemap', file: '01-architecture-overview' },
        { id: 'pipeline', title: '渲染管线', icon: 'project-diagram', file: '02-rendering-pipeline' },
        { id: 'shaderpack', title: 'ShaderPack 系统', icon: 'palette', file: '03-shaderpack-system' },
        { id: 'shadow', title: '阴影系统', icon: 'cube', file: '04-shadow-system' },
        { id: 'framebuffer', title: '帧缓冲与纹理', icon: 'layer-group', file: '05-framebuffer-texture' },
        { id: 'uniforms', title: 'Uniform 管理', icon: 'sliders-h', file: '06-uniforms' }
    ],

    sodium: [
        { id: 'architecture', title: '架构总览', icon: 'sitemap', file: '01-architecture-overview' },
        { id: 'chunk-render', title: 'Chunk 渲染系统', icon: 'th', file: '02-chunk-render-system' },
        { id: 'occlusion', title: '遮挡剔除', icon: 'eye-slash', file: '03-occlusion-culling' },
        { id: 'render-pipeline', title: '渲染管线', icon: 'project-diagram', file: '04-render-pipeline' },
        { id: 'shader', title: '着色器系统', icon: 'palette', file: '05-shader-system' },
        { id: 'platform', title: '平台集成', icon: 'plug', file: '06-platform-integration' }
    ]

    // 添加新模组的导航:
    // new_mod: [
    //     { id: 'intro', title: '介绍', icon: 'info-circle', file: '01-intro' },
    //     { id: 'architecture', title: '架构', icon: 'sitemap', file: '02-architecture' },
    // ],

// 未来可添加的模组示例:
// - fabric: Fabric API
// - quilt: Quilt 项目
// - neoforge: NeoForge
// - forge: Minecraft Forge
// - architectury: Architectury API
// - lithium: Lithium 优化
// - indium: Indium (Sodium 渲染器)
// - iris: 已完成
// - sodium: 已完成
};

// ============================================
// 首页模块卡片配置
// ============================================
// 用于 index.html 首页显示

const moduleCards = {
    mc: {
        versions: ['1.21', '1.20', '1.19', '1.18'],
        docCount: 10
    },
    iris: {
        versions: null,
        docCount: 6
    },
    sodium: {
        versions: null,
        docCount: 6
    }
};

// ============================================
// 全局配置
// ============================================

const config = {
    websiteTitle: 'MC 开发文档中心',
    websiteRoot: path.join(__dirname, '..'),
    outputDir: path.join(__dirname, '../docs'),
    templateDir: path.join(__dirname, '../templates'),
    baseUrl: '/docs',

    // 文档元数据默认值
    defaults: {
        readingTime: 30, // 分钟
        language: 'zh-CN'
    },

    // 支持的渲染选项
    features: {
        mermaid: true,
        copyCode: true,
        progressBar: true,
        darkMode: true,
        syntaxHighlight: true
    },

    // Markdown 解析选项
    markdown: {
        // 忽略的文件前缀
        ignorePrefixes: ['README', 'SUMMARY', 'index'],
        // 支持的文件扩展名
        extensions: ['.md']
    }
};

module.exports = { modules, navigation, moduleCards, config };
