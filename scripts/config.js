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
// - docsDir: 输出目录
// - sourceDir: Markdown 源文件目录
// - theme: 主题标识

const modules = {

    // ========== Minecraft 原版 ==========
    mc: {
        name: 'Minecraft 原版',
        slug: 'mc',
        icon: 'cube',
        color: '#404040',
        colorGradient: 'linear-gradient(135deg, #2a2a2a 0%, #525252 55%, #737373 100%)',
        description: 'Minecraft 核心架构与源码深度解析',
        versions: ['1.21'],
        defaultVersion: '1.21',
        docsDir: 'docs/mc',
        theme: 'mc'
    },

    // ========== Iris 光影 ==========
    iris: {
        name: 'Iris 光影',
        slug: 'iris',
        icon: 'sun',
        color: '#404040',
        colorGradient: 'linear-gradient(135deg, #2a2a2a 0%, #525252 55%, #737373 100%)',
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
        color: '#404040',
        colorGradient: 'linear-gradient(135deg, #2a2a2a 0%, #525252 55%, #737373 100%)',
        description: '现代渲染优化与 Sodium 架构设计',
        versions: null,
        defaultVersion: null,
        docsDir: 'docs/sodium',
        sourceDir: 'D:/Projects/sodium/analysis',
        theme: 'sodium'
    }
};

// ============================================
// 教程 Part 学习建议（用于课程卡片式布局）
// ============================================
const partLearningAdvice = {
    '2-World': '世界系统是 Minecraft 的核心组件之一。理解区块如何存储/加载以及地形如何生成，对掌握游戏底层架构至关重要。',
    '3-Block': '方块与物品是游戏内容的基础。建议先掌握 BlockState 与 BlockEntity，再学习物品与 Component。',
    '3-Block-Item': '方块与物品是游戏内容的基础。建议先掌握 BlockState 与 BlockEntity，再学习物品与 Component。',
    '0-Prerequisites': '前置知识帮助你搭建开发环境并理解项目结构，为后续章节打好基础。',
    '1-Foundation': '核心基础涵盖注册表、客户端-服务端架构与启动流程，是阅读源码的必备知识。',
    '4-Entity': '实体系统从 Entity 生命周期到 AI 行为，建议按顺序学习。',
    '5-AI': 'AI 系统涉及大脑、记忆、传感器与任务调度，是生物行为的核心。',
    '6-Network': '网络系统理解数据包与同步机制，对多人游戏与 Mod 开发很重要。',
    '7-Command': '命令系统基于 Brigadier，可扩展原版命令或添加自定义命令。',
    '8-Resource': '资源包、数据包、战利品表与进度等，是内容驱动开发的基础。',
    '9-Client': '客户端涵盖渲染、GUI 与输入，适合做视觉或交互类 Mod。',
    '10-Server': '服务端涵盖玩家管理、存档与专用/集成服务器区别。',
    '11-Advanced': '进阶主题包括数据修复、流体、村庄与结构等。',
    '12-Practice': '通过实战项目巩固所学，建议按顺序完成。',
    '13-Additional': '附加系统包含附魔、物品栏、NBT、粒子、音效等常用系统。'
};

// ============================================
// 教程导航结构
// ============================================
const tutorialsNavigation = {

    mc: [
        // Part-0: 前置知识
        { id: 'course-overview', title: '课程概述', icon: 'book', file: '00-course-overview' },
        { id: 'java-basics', title: 'Java基础', icon: 'code', file: '01-java-basics' },
        { id: 'development-env', title: '开发环境', icon: 'cog', file: '02-development-env' },
        { id: 'project-intro', title: '项目结构', icon: 'folder-open', file: '03-project-intro' },
        { id: 'sourcecode-guide', title: '源码查找指南', icon: 'search', file: '04-sourcecode-guide' },
        // Part-1: 核心基础
        { id: 'registry-system', title: '注册表系统 ⭐', icon: 'archive', file: '04-registry-system' },
        { id: 'client-server-arch', title: '客户端-服务端', icon: 'network-wired', file: '05-client-server-arch' },
        { id: 'shared-constants', title: '全局常量', icon: 'tag', file: '06-shared-constants' },
        { id: 'bootstrap-flow', title: '启动引导', icon: 'play', file: '07-bootstrap-flow' },
        // Part-2: 世界系统（带课程要点，用于教程卡片式展示）
        { id: 'world-core', title: 'World核心', icon: 'globe', file: '08-world-core', topics: ['World 类结构', 'WorldServer 与 ClientWorld 区别'] },
        { id: 'chunk-system', title: 'Chunk系统', icon: 'th', file: '09-chunk-system', topics: ['区块加载/卸载', 'ChunkSection', 'NBT 持久化'] },
        { id: 'biome-system', title: '生物群系', icon: 'tree', file: '10-biome-system', topics: ['生物群系注册', 'BiomeAttributes', '天气对生物群系的影响'] },
        { id: 'terrain-gen', title: '地形生成', icon: 'mountain', file: '11-terrain-gen', topics: ['ChunkGenerator', 'NoiseGenerator', '洞穴与峡谷生成'] },
        { id: 'lighting-system', title: '光照系统', icon: 'lightbulb', file: '12-lighting-system', topics: ['BlockLight', 'SkyLight', '光照传播与更新算法'] },
        { id: 'heightmap', title: '高度图', icon: 'chart-area', file: '13-heightmap', topics: ['高度图类型', 'MotionBlockingHeightMap', 'WorldSurface'] },
        // Part-3: 方块物品
        { id: 'block-basics', title: 'Block基础', icon: 'cube', file: '14-block-basics' },
        { id: 'block-state', title: 'BlockState', icon: 'toggle-on', file: '15-block-state' },
        { id: 'block-entity', title: 'BlockEntity', icon: 'box', file: '16-block-entity' },
        { id: 'item-basics', title: 'Item基础', icon: 'gift', file: '17-item-basics' },
        { id: 'item-stack', title: 'ItemStack', icon: 'layer-group', file: '18-item-stack' },
        { id: 'item-component', title: 'Component', icon: 'puzzle-piece', file: '19-item-component' },
        // Part-4: 实体系统
        { id: 'entity-intro', title: 'Entity入门', icon: 'paw', file: '20-entity-intro' },
        { id: 'entity-lifecycle', title: '生命周期', icon: 'circle', file: '21-entity-lifecycle' },
        { id: 'living-entity', title: 'LivingEntity', icon: 'heart', file: '22-living-entity' },
        { id: 'mob-entity', title: 'MobEntity', icon: 'ghost', file: '23-mob-entity' },
        { id: 'entity-attributes', title: '属性系统', icon: 'sliders-h', file: '24-entity-attributes' },
        { id: 'damage-system', title: '伤害系统', icon: 'sword', file: '25-damage-system' },
        { id: 'spawn-system', title: '生成系统', icon: 'magic', file: '26-spawn-system' },
        // Part-5: AI系统
        { id: 'ai-brain-intro', title: 'AI大脑 ⭐', icon: 'brain', file: '27-ai-brain-intro' },
        { id: 'memory-system', title: '记忆系统', icon: 'memory', file: '28-memory-system' },
        { id: 'sensor-system', title: '传感器', icon: 'eye', file: '29-sensor-system' },
        { id: 'task-system', title: '任务系统', icon: 'tasks', file: '30-task-system' },
        { id: 'activity-schedule', title: '活动日程', icon: 'calendar', file: '31-activity-schedule' },
        { id: 'pathfinding', title: '路径导航', icon: 'route', file: '32-pathfinding' },
        // Part-6: 网络系统
        { id: 'network-intro', title: '网络入门', icon: 'network-wired', file: '33-network-intro' },
        { id: 'packet-system', title: '数据包', icon: 'envelope', file: '34-packet-system' },
        { id: 'protocol-states', title: '协议状态', icon: 'exchange-alt', file: '35-protocol-states' },
        { id: 'sync-mechanism', title: '同步机制', icon: 'sync', file: '36-sync-mechanism' },
        // Part-7: 命令系统
        { id: 'command-intro', title: '命令入门', icon: 'terminal', file: '37-command-intro' },
        { id: 'brigadier-basics', title: 'Brigadier', icon: 'code-branch', file: '38-brigadier-basics' },
        { id: 'custom-command', title: '自定义命令', icon: 'plus-circle', file: '39-custom-command' },
        // Part-8: 资源系统
        { id: 'resource-pack', title: '资源包', icon: 'image', file: '40-resource-pack' },
        { id: 'datapack-intro', title: '数据包', icon: 'database', file: '41-datapack-intro' },
        { id: 'loot-table', title: '战利品表', icon: 'coins', file: '42-loot-table' },
        { id: 'advancement', title: '进度系统', icon: 'trophy', file: '43-advancement' },
        { id: 'recipe-system', title: '配方系统', icon: 'flask', file: '44-recipe-system' },
        // Part-9: 客户端
        { id: 'minecraft-client', title: 'MinecraftClient', icon: 'desktop', file: '45-minecraft-client' },
        { id: 'render-system', title: '渲染系统', icon: 'paint-brush', file: '46-render-system' },
        { id: 'gui-system', title: 'GUI系统', icon: 'window-maximize', file: '47-gui-system' },
        { id: 'input-handling', title: '输入处理', icon: 'keyboard', file: '48-input-handling' },
        // Part-10: 服务端
        { id: 'server-intro', title: '服务端入门', icon: 'server', file: '49-server-intro' },
        { id: 'player-manager', title: '玩家管理', icon: 'users', file: '50-player-manager' },
        { id: 'save-system', title: '存档系统', icon: 'save', file: '51-save-system' },
        { id: 'dedicated-vs-integrated', title: '服务器对比', icon: 'balance-scale', file: '52-dedicated-vs-integrated' },
        // Part-11: 进阶主题
        { id: 'datafixer', title: '数据修复', icon: 'wrench', file: '53-datafixer' },
        { id: 'fluids', title: '流体系统', icon: 'tint', file: '54-fluids' },
        { id: 'village-system', title: '村民系统', icon: 'home', file: '55-village-system' },
        { id: 'raid-system', title: '袭击系统', icon: 'shield-alt', file: '56-raid-system' },
        { id: 'structure-system', title: '结构系统', icon: 'building', file: '57-structure-system' },
        // Part-12: 实战项目
        { id: 'project1-block', title: '新方块', icon: 'cube', file: '98-project1-block' },
        { id: 'project2-item', title: '新物品', icon: 'gift', file: '99-project2-item' },
        { id: 'project3-entity', title: '新生物', icon: 'dragon', file: '100-project3-entity' },
        { id: 'project4-datapack', title: '数据包', icon: 'database', file: '101-project4-datapack' },
        // Part-13: 补充系统
        { id: 'enchantment-system', title: '附魔系统', icon: 'magic', file: 'enchantment-system' },
        { id: 'inventory-system', title: '物品栏容器', icon: 'box-open', file: 'inventory-system' },
        { id: 'nbt-data-system', title: 'NBT数据', icon: 'file-code', file: 'nbt-data-system' },
        { id: 'particle-system', title: '粒子系统', icon: 'sparkles', file: 'particle-system' },
        { id: 'potion-effect-system', title: '药水效果', icon: 'flask', file: 'potion-effect-system' },
        { id: 'scoreboard-system', title: '记分板', icon: 'clipboard-list', file: 'scoreboard-system' },
        { id: 'sound-system', title: '声音系统', icon: 'volume-up', file: 'sound-system' },
        { id: 'stats-system', title: '统计系统', icon: 'chart-bar', file: 'stats-system' },
        { id: 'text-system', title: '文本系统', icon: 'font', file: 'text-system' }
    ],

    iris: [
        { id: 'shader-basics', title: 'Shader 基础入门', icon: 'code', file: '01-shader-basics' },
        { id: 'iris-setup', title: '开发环境搭建', icon: 'cog', file: '02-iris-setup' },
        { id: 'create-shader', title: '创建第一个 Shader', icon: 'magic', file: '03-create-simple-shader' },
        { id: 'shaderpack-structure', title: 'ShaderPack 结构', icon: 'folder', file: '04-shaderpack-structure' },
        { id: 'uniforms-practice', title: 'Uniform 实践', icon: 'sliders-h', file: '05-uniforms-practice' },
        { id: 'post-processing', title: '后处理效果', icon: 'image', file: '06-post-processing' }
    ],

    sodium: [
        { id: 'mod-dev-intro', title: 'Mod 开发入门', icon: 'puzzle-piece', file: '01-mod-dev-intro' },
        { id: 'render-optimization', title: '渲染优化基础', icon: 'chart-line', file: '02-rendering-optimization' },
        { id: 'multithreading', title: '多线程编程', icon: 'layer-group', file: '03-multithreading-basics' },
        { id: 'chunk-system', title: '深入区块系统', icon: 'th', file: '04-chunk-system-deep' },
        { id: 'gl-basics', title: 'OpenGL 基础', icon: 'cube', file: '05-gl-basics' },
        { id: 'performance-profiling', title: '性能分析与调优', icon: 'tachometer-alt', file: '06-performance-profiling' }
    ]
};

// ============================================
// 分析导航结构
// ============================================
const analysisNavigation = {

    mc: [
        { id: 'architecture', title: '架构总览', icon: 'sitemap', file: '01-architecture-overview' },
        { id: 'client', title: '客户端模块', icon: 'desktop', file: '02-client-module' },
        { id: 'server', title: '服务端模块', icon: 'server', file: '03-server-module' },
        { id: 'world', title: '世界系统', icon: 'globe', file: '04-world-system' },
        { id: 'entity', title: '实体系统', icon: 'paw', file: '05-entity-system' }
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
};

// ============================================
// 首页模块卡片配置
// ============================================
const moduleCards = {
    mc: {
        versions: ['1.21'],
        tutorialCount: 80,
        analysisCount: 5
    },
    iris: {
        versions: null,
        tutorialCount: 6,
        analysisCount: 6
    },
    sodium: {
        versions: null,
        tutorialCount: 6,
        analysisCount: 6
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
        readingTime: 30,
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
        ignorePrefixes: ['README', 'SUMMARY', 'index'],
        extensions: ['.md']
    }
};

module.exports = { modules, tutorialsNavigation, analysisNavigation, moduleCards, config, partLearningAdvice };
