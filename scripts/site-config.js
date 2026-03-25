/**
 * Minecraft Learning - 前端配置中心
 * 
 * 此文件是整个网站的单一配置数据源
 * 新增模组/版本只需修改此文件，无需改 JS
 * 
 * 使用方式：
 * 1. 在 CATEGORIES 中定义分类
 * 2. 在 MODULES 中添加模组
 * 3. 在 NAVIGATION 中配置导航结构
 * 4. 运行 build 脚本自动生成 HTML
 */

const SITE_CONFIG = {
    // ============================================
    // 站点元信息
    // ============================================
    site: {
        name: 'Minecraft Learning',
        nameZh: 'Minecraft Learning',
        shortTitle: 'MC Learning',
        description: '探索 Minecraft 源码与模组开发的深度学习资源',
        language: 'zh-CN',
        author: 'Minecraft Learning Team',
        license: 'MIT',
        repository: 'https://github.com/BaiGave/MincraftLearning',
        baseUrl: '/docs',
        favicon: '/favicon.ico'
    },

    // ============================================
    // 内容分类（顶级分类）
    // ============================================
    // 分类用于组织模组，如：原版、Fabric 生态、Forge 生态、光影开发
    categories: [
        {
            id: 'mc',
            name: '原版 Minecraft',
            icon: 'fa-cube',
            description: 'Minecraft 核心架构与源码深度解析',
            order: 1
        },
        {
            id: 'fabric',
            name: 'Fabric 生态',
            icon: 'fa-puzzle-piece',
            description: 'Fabric 模组开发教程与源码分析',
            order: 2
        },
        {
            id: 'forge',
            name: 'Forge 生态',
            icon: 'fa-hammer',
            description: 'Forge/NeoForge 模组开发教程',
            order: 3
        },
        {
            id: 'shader',
            name: '光影开发',
            icon: 'fa-palette',
            description: 'Shader 编写与渲染管线学习',
            order: 4
        }
    ],

    // ============================================
    // 模组配置
    // ============================================
    // 每个模组的元数据，新增模组只需在此添加
    modules: {

        // ========== Minecraft 原版 ==========
        mc: {
            id: 'mc',
            name: 'Minecraft 原版',
            shortName: 'MC',
            slug: 'mc',
            icon: 'fa-cube',
            color: '#404040',
            colorGradient: 'linear-gradient(135deg, #2a2a2a 0%, #525252 55%, #737373 100%)',
            accentColor: '#171717',
            description: '深入理解 Minecraft 的分层架构与核心设计模式',
            category: 'mc',
            order: 1,
            
            // 版本化配置（null 表示无版本，有数组表示支持多版本）
            versions: {
                '1.21': {
                    name: '1.21',
                    codename: 'Wild',
                    isDefault: true,
                    status: 'stable',  // stable, beta, legacy
                    tutorialCount: 63,
                    analysisCount: 10,
                    releaseDate: '2024-06-14'
                },
                '1.20': {
                    name: '1.20.4',
                    codename: 'Trails & Tales',
                    isDefault: false,
                    status: 'stable',
                    tutorialCount: 0,
                    analysisCount: 0,
                    releaseDate: '2023-09-19'
                },
                '1.19': {
                    name: '1.19.4',
                    codename: 'The Wild Update',
                    isDefault: false,
                    status: 'legacy',
                    tutorialCount: 0,
                    analysisCount: 0,
                    releaseDate: '2022-06-30'
                },
                '1.18': {
                    name: '1.18.2',
                    codename: 'Caves & Cliffs Part 2',
                    isDefault: false,
                    status: 'legacy',
                    tutorialCount: 0,
                    analysisCount: 0,
                    releaseDate: '2022-02-28'
                }
            },
            
            // 默认版本
            defaultVersion: '1.21',
            
            // 文档目录
            docsDir: 'docs/mc',
            
            // 文档类型
            hasTutorials: true,
            hasAnalysis: true,
            
            // 精选文档
            featured: [
                {
                    id: '01-architecture-overview',
                    title: '架构总览',
                    desc: 'Minecraft 整体架构与设计模式',
                    time: '45分钟',
                    type: 'analysis'
                },
                {
                    id: '02-client-module',
                    title: '客户端模块',
                    desc: '客户端渲染、输入与窗口管理',
                    time: '50分钟',
                    type: 'analysis'
                }
            ]
        },

        // ========== Iris 光影 ==========
        iris: {
            id: 'iris',
            name: 'Iris 光影',
            shortName: 'Iris',
            slug: 'iris',
            icon: 'fa-sun',
            color: '#404040',
            colorGradient: 'linear-gradient(135deg, #2a2a2a 0%, #525252 55%, #737373 100%)',
            accentColor: '#171717',
            description: '全面解析 Iris 的 shader 加载与渲染管线设计',
            category: 'shader',
            order: 2,
            
            // 版本化配置
            versions: {
                '1.21-fabric-1.7.3': {
                    name: '1.21-fabric-1.7.3',
                    codename: '',
                    isDefault: true,
                    status: 'stable',
                    tutorialCount: 0,
                    analysisCount: 0,
                    releaseDate: ''
                }
            },
            defaultVersion: '1.21-fabric-1.7.3',
            
            docsDir: 'docs/iris',
            hasTutorials: true,
            hasAnalysis: true,
            
            featured: [
                {
                    id: '01-shader-basics',
                    title: 'Shader 基础入门',
                    desc: '学习 GLSL 语法与 Shader 基本概念',
                    time: '60分钟',
                    type: 'tutorial'
                },
                {
                    id: '03-create-simple-shader',
                    title: '创建第一个 Shader',
                    desc: '编写简单的 GLSL 着色器代码',
                    time: '90分钟',
                    type: 'tutorial'
                }
            ]
        },

        // ========== Sodium 优化 ==========
        sodium: {
            id: 'sodium',
            name: 'Sodium 优化',
            shortName: 'Sodium',
            slug: 'sodium',
            icon: 'fa-bolt',
            color: '#404040',
            colorGradient: 'linear-gradient(135deg, #2a2a2a 0%, #525252 55%, #737373 100%)',
            accentColor: '#171717',
            description: '探索现代渲染优化与 Sodium 的架构设计',
            category: 'fabric',
            order: 3,
            
            versions: null,
            defaultVersion: null,
            
            docsDir: 'docs/sodium',
            hasTutorials: true,
            hasAnalysis: true,
            
            featured: [
                {
                    id: '01-mod-dev-intro',
                    title: 'Mod 开发入门',
                    desc: '了解 Fabric Mod 开发基础知识',
                    time: '60分钟',
                    type: 'tutorial'
                },
                {
                    id: '03-multithreading-basics',
                    title: '多线程编程',
                    desc: '理解多线程与异步处理概念',
                    time: '75分钟',
                    type: 'tutorial'
                }
            ]
        },

        // ========== Forge 模组 ==========
        forge: {
            id: 'forge',
            name: 'Forge 模组',
            shortName: 'Forge',
            slug: 'forge',
            icon: 'fa-hammer',
            color: '#B87333',
            colorGradient: 'linear-gradient(135deg, #B87333 0%, #D4956A 55%, #E8B896 100%)',
            accentColor: '#8B5A2B',
            description: 'Forge/NeoForge 模组开发框架深度学习',
            category: 'forge',
            order: 4,
            
            versions: null,
            defaultVersion: null,
            
            docsDir: 'docs/forge',
            hasTutorials: true,
            hasAnalysis: false,
            
            featured: [
                {
                    id: '01-intro',
                    title: 'Forge 入门',
                    desc: '了解 Forge 基本概念与项目结构',
                    time: '45分钟',
                    type: 'tutorial'
                }
            ]
        }
    },

    // ============================================
    // 导航配置
    // ============================================
    // 用于动态生成侧边栏和导航菜单
    navigation: {

        // MC 教程导航（按 Part 分类）
        mcTutorials: [
            { part: 'Part-0', name: '前置知识', icon: 'fa-book', items: [
                { id: 'course-overview', title: '课程概述', file: '00-course-overview' },
                { id: 'java-basics', title: 'Java 基础', file: '01-java-basics' },
                { id: 'development-env', title: '开发环境', file: '02-development-env' },
                { id: 'project-intro', title: '项目结构', file: '03-project-intro' },
                { id: 'sourcecode-guide', title: '源码查找指南', file: '04-sourcecode-guide' }
            ]},
            { part: 'Part-1', name: '核心基础', icon: 'fa-cogs', items: [
                { id: 'registry-system', title: '注册表系统', file: '04-registry-system', starred: true },
                { id: 'client-server-arch', title: '客户端-服务端', file: '05-client-server-arch' },
                { id: 'shared-constants', title: '全局常量', file: '06-shared-constants' },
                { id: 'bootstrap-flow', title: '启动引导', file: '07-bootstrap-flow' }
            ]},
            { part: 'Part-2', name: '世界系统', icon: 'fa-globe', items: [
                { id: 'world-core', title: 'World 核心', file: '08-world-core' },
                { id: 'chunk-system', title: 'Chunk 系统', file: '09-chunk-system' },
                { id: 'biome-system', title: '生物群系', file: '10-biome-system' },
                { id: 'terrain-gen', title: '地形生成', file: '11-terrain-gen' },
                { id: 'lighting-system', title: '光照系统', file: '12-lighting-system' },
                { id: 'heightmap', title: '高度图', file: '13-heightmap' }
            ]},
            { part: 'Part-3', name: '方块物品', icon: 'fa-box', items: [
                { id: 'block-basics', title: 'Block 基础', file: '14-block-basics' },
                { id: 'block-state', title: 'BlockState', file: '15-block-state' },
                { id: 'block-entity', title: 'BlockEntity', file: '16-block-entity' },
                { id: 'item-basics', title: 'Item 基础', file: '17-item-basics' },
                { id: 'item-stack', title: 'ItemStack', file: '18-item-stack' },
                { id: 'item-component', title: 'Component', file: '19-item-component' }
            ]},
            { part: 'Part-4', name: '实体系统', icon: 'fa-paw', items: [
                { id: 'entity-intro', title: 'Entity 入门', file: '20-entity-intro' },
                { id: 'entity-lifecycle', title: '生命周期', file: '21-entity-lifecycle' },
                { id: 'living-entity', title: 'LivingEntity', file: '22-living-entity' },
                { id: 'mob-entity', title: 'MobEntity', file: '23-mob-entity' },
                { id: 'entity-attributes', title: '属性系统', file: '24-entity-attributes' },
                { id: 'damage-system', title: '伤害系统', file: '25-damage-system' },
                { id: 'spawn-system', title: '生成系统', file: '26-spawn-system' }
            ]},
            { part: 'Part-5', name: 'AI 系统', icon: 'fa-brain', items: [
                { id: 'ai-brain-intro', title: 'AI 大脑', file: '27-ai-brain-intro', starred: true },
                { id: 'memory-system', title: '记忆系统', file: '28-memory-system' },
                { id: 'sensor-system', title: '传感器', file: '29-sensor-system' },
                { id: 'task-system', title: '任务系统', file: '30-task-system' },
                { id: 'activity-schedule', title: '活动日程', file: '31-activity-schedule' },
                { id: 'pathfinding', title: '路径导航', file: '32-pathfinding' }
            ]},
            { part: 'Part-6', name: '网络系统', icon: 'fa-network-wired', items: [
                { id: 'network-intro', title: '网络入门', file: '33-network-intro' },
                { id: 'packet-system', title: '数据包', file: '34-packet-system' },
                { id: 'protocol-states', title: '协议状态', file: '35-protocol-states' },
                { id: 'sync-mechanism', title: '同步机制', file: '36-sync-mechanism' }
            ]},
            { part: 'Part-7', name: '命令系统', icon: 'fa-terminal', items: [
                { id: 'command-intro', title: '命令入门', file: '37-command-intro' },
                { id: 'brigadier-basics', title: 'Brigadier', file: '38-brigadier-basics' },
                { id: 'custom-command', title: '自定义命令', file: '39-custom-command' }
            ]},
            { part: 'Part-8', name: '资源系统', icon: 'fa-database', items: [
                { id: 'resource-pack', title: '资源包', file: '40-resource-pack' },
                { id: 'datapack-intro', title: '数据包', file: '41-datapack-intro' },
                { id: 'loot-table', title: '战利品表', file: '42-loot-table' },
                { id: 'advancement', title: '进度系统', file: '43-advancement' },
                { id: 'recipe-system', title: '配方系统', file: '44-recipe-system' }
            ]},
            { part: 'Part-9', name: '客户端', icon: 'fa-desktop', items: [
                { id: 'minecraft-client', title: 'MinecraftClient', file: '45-minecraft-client' },
                { id: 'render-system', title: '渲染系统', file: '46-render-system' },
                { id: 'gui-system', title: 'GUI 系统', file: '47-gui-system' },
                { id: 'input-handling', title: '输入处理', file: '48-input-handling' }
            ]},
            { part: 'Part-10', name: '服务端', icon: 'fa-server', items: [
                { id: 'server-intro', title: '服务端入门', file: '49-server-intro' },
                { id: 'player-manager', title: '玩家管理', file: '50-player-manager' },
                { id: 'save-system', title: '存档系统', file: '51-save-system' },
                { id: 'dedicated-vs-integrated', title: '服务器对比', file: '52-dedicated-vs-integrated' }
            ]},
            { part: 'Part-11', name: '进阶主题', icon: 'fa-rocket', items: [
                { id: 'datafixer', title: '数据修复', file: '53-datafixer' },
                { id: 'fluids', title: '流体系统', file: '54-fluids' },
                { id: 'village-system', title: '村民系统', file: '55-village-system' },
                { id: 'raid-system', title: '袭击系统', file: '56-raid-system' },
                { id: 'structure-system', title: '结构系统', file: '57-structure-system' }
            ]},
            { part: 'Part-12', name: '实战项目', icon: 'fa-tools', items: [
                { id: 'project1-block', title: '新方块', file: '98-project1-block' },
                { id: 'project2-item', title: '新物品', file: '99-project2-item' },
                { id: 'project3-entity', title: '新生物', file: '100-project3-entity' },
                { id: 'project4-datapack', title: '数据包', file: '101-project4-datapack' }
            ]},
            { part: 'Part-13', name: '补充系统', icon: 'fa-plus-circle', items: [
                { id: 'enchantment-system', title: '附魔系统', file: 'enchantment-system' },
                { id: 'inventory-system', title: '物品栏容器', file: 'inventory-system' },
                { id: 'nbt-data-system', title: 'NBT 数据', file: 'nbt-data-system' },
                { id: 'particle-system', title: '粒子系统', file: 'particle-system' },
                { id: 'potion-effect-system', title: '药水效果', file: 'potion-effect-system' },
                { id: 'scoreboard-system', title: '记分板', file: 'scoreboard-system' },
                { id: 'sound-system', title: '声音系统', file: 'sound-system' },
                { id: 'stats-system', title: '统计系统', file: 'stats-system' },
                { id: 'text-system', title: '文本系统', file: 'text-system' }
            ]}
        ],

        // MC 分析导航
        mcAnalysis: [
            { id: '01-architecture-overview', title: '架构总览', icon: 'fa-sitemap', file: '01-architecture-overview' },
            { id: '02-client-module', title: '客户端模块', icon: 'fa-desktop', file: '02-client-module' },
            { id: '03-server-module', title: '服务端模块', icon: 'fa-server', file: '03-server-module' },
            { id: '04-world-system', title: '世界系统', icon: 'fa-globe', file: '04-world-system' },
            { id: '05-entity-system', title: '实体系统', icon: 'fa-paw', file: '05-entity-system' },
            { id: '06-block-item-system', title: '方块物品系统', icon: 'fa-box', file: '06-block-item-system' },
            { id: '07-network-protocol', title: '网络协议', icon: 'fa-network-wired', file: '07-network-protocol' },
            { id: '08-datafixer-system', title: '数据修复系统', icon: 'fa-wrench', file: '08-datafixer-system' },
            { id: '09-registry-system', title: '注册表系统', icon: 'fa-archive', file: '09-registry-system' },
            { id: '10-package-structure', title: '包结构', icon: 'fa-folder', file: '10-package-structure' }
        ],

        // Iris 导航
        iris: {
            tutorials: [
                { id: '01-shader-basics', title: 'Shader 基础入门', icon: 'fa-code', file: '01-shader-basics' },
                { id: '02-iris-setup', title: '开发环境搭建', icon: 'fa-cog', file: '02-iris-setup' },
                { id: '03-create-simple-shader', title: '创建第一个 Shader', icon: 'fa-magic', file: '03-create-simple-shader' },
                { id: '04-shaderpack-structure', title: 'ShaderPack 结构', icon: 'fa-folder', file: '04-shaderpack-structure' },
                { id: '05-uniforms-practice', title: 'Uniform 实践', icon: 'fa-sliders-h', file: '05-uniforms-practice' },
                { id: '06-post-processing', title: '后处理效果', icon: 'fa-image', file: '06-post-processing' }
            ],
            analysis: [
                { id: '01-architecture-overview', title: '架构总览', icon: 'fa-sitemap', file: '01-architecture-overview' },
                { id: '02-rendering-pipeline', title: '渲染管线', icon: 'fa-project-diagram', file: '02-rendering-pipeline' },
                { id: '03-shaderpack-system', title: 'ShaderPack 系统', icon: 'fa-palette', file: '03-shaderpack-system' },
                { id: '04-shadow-system', title: '阴影系统', icon: 'fa-cube', file: '04-shadow-system' },
                { id: '05-framebuffer-texture', title: '帧缓冲与纹理', icon: 'fa-layer-group', file: '05-framebuffer-texture' },
                { id: '06-uniforms', title: 'Uniform 管理', icon: 'fa-sliders-h', file: '06-uniforms' }
            ]
        },

        // Sodium 导航
        sodium: {
            tutorials: [
                { id: '01-mod-dev-intro', title: 'Mod 开发入门', icon: 'fa-puzzle-piece', file: '01-mod-dev-intro' },
                { id: '03-multithreading-basics', title: '多线程编程', icon: 'fa-layer-group', file: '03-multithreading-basics' }
            ],
            analysis: [
                { id: '01-architecture-overview', title: '架构总览', icon: 'fa-sitemap', file: '01-architecture-overview' },
                { id: '02-chunk-render-system', title: 'Chunk 渲染系统', icon: 'fa-th', file: '02-chunk-render-system' },
                { id: '03-occlusion-culling', title: '遮挡剔除', icon: 'fa-eye-slash', file: '03-occlusion-culling' },
                { id: '04-render-pipeline', title: '渲染管线', icon: 'fa-project-diagram', file: '04-render-pipeline' },
                { id: '05-shader-system', title: '着色器系统', icon: 'fa-palette', file: '05-shader-system' },
                { id: '06-platform-integration', title: '平台集成', icon: 'fa-plug', file: '06-platform-integration' }
            ]
        }
    },

    // ============================================
    // 学习建议（用于卡片展示）
    // ============================================
    learningAdvice: {
        'Part-0': '前置知识帮助你搭建开发环境并理解项目结构，为后续章节打好基础。',
        'Part-1': '核心基础涵盖注册表、客户端-服务端架构与启动流程，是阅读源码的必备知识。',
        'Part-2': '世界系统是 Minecraft 的核心组件之一。理解区块如何存储/加载以及地形如何生成，对掌握游戏底层架构至关重要。',
        'Part-3': '方块与物品是游戏内容的基础。建议先掌握 BlockState 与 BlockEntity，再学习物品与 Component。',
        'Part-4': '实体系统从 Entity 生命周期到 AI 行为，建议按顺序学习。',
        'Part-5': 'AI 系统涉及大脑、记忆、传感器与任务调度，是生物行为的核心。',
        'Part-6': '网络系统理解数据包与同步机制，对多人游戏与 Mod 开发很重要。',
        'Part-7': '命令系统基于 Brigadier，可扩展原版命令或添加自定义命令。',
        'Part-8': '资源包、数据包、战利品表与进度等，是内容驱动开发的基础。',
        'Part-9': '客户端涵盖渲染、GUI 与输入，适合做视觉或交互类 Mod。',
        'Part-10': '服务端涵盖玩家管理、存档与专用/集成服务器区别。',
        'Part-11': '进阶主题包括数据修复、流体、村庄与结构等。',
        'Part-12': '通过实战项目巩固所学，建议按顺序完成。',
        'Part-13': '附加系统包含附魔、物品栏、NBT、粒子、音效等常用系统。'
    },

    // ============================================
    // 功能开关
    // ============================================
    features: {
        search: {
            enabled: true,
            type: 'flexsearch',  // flexsearch, fuse, or 'basic'
            placeholder: '搜索文档...',
            hotkey: '/',
            maxResults: 10
        },
        darkMode: {
            enabled: true,
            default: 'auto',  // light, dark, or auto
            toggle: true,
            respectSystem: true
        },
        readingProgress: {
            enabled: true,
            showPercentage: true,
            position: 'top'  // top, bottom, or sidebar
        },
        sidebar: {
            collapsible: true,
            defaultOpen: true,
            showIcons: true
        },
        codeBlock: {
            copyButton: true,
            lineNumbers: true,
            highlightOnHover: true
        },
        tableOfContents: {
            enabled: true,
            position: 'right',  // right, left, or inline
            depth: 3
        },
        breadcrumbs: {
            enabled: true,
            separator: '/'
        },
        keyboardNav: {
            enabled: true,
            shortcuts: {
                search: '/',
                nextDoc: 'j',
                prevDoc: 'k',
                darkMode: 'd',
                sidebar: '['
            }
        }
    },

    // ============================================
    // UI 配置
    // ============================================
    ui: {
        theme: 'default',
        layout: 'sidebar',  // sidebar, topnav, or hybrid
        sidebarWidth: 280,
        headerHeight: 60,
        maxContentWidth: 900,
        animations: {
            enabled: true,
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    }
};

// scan-docs:auto-modules:start
(function applyAutoDiscoveredModulesFromDocs() {
    var AUTO_SITE_MODULES = {
    "ImmersivePortalsMod": {
        "id": "ImmersivePortalsMod",
        "name": "ImmersivePortalsMod",
        "shortName": "ImmersivePortals",
        "slug": "ImmersivePortalsMod",
        "icon": "fa-folder-open",
        "color": "#5B8C5A",
        "colorGradient": "linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)",
        "accentColor": "#171717",
        "description": "ImmersivePortalsMod的教程与源码分析文档",
        "category": "mc",
        "order": 50,
        "docsDir": "docs/ImmersivePortalsMod",
        "hasTutorials": true,
        "hasAnalysis": true,
        "featured": [],
        "versions": {
            "1.21.1": {
                "name": "1.21.1",
                "codename": "",
                "isDefault": false,
                "status": "stable",
                "tutorialCount": 0,
                "analysisCount": 0,
                "releaseDate": ""
            },
            "1.21.1-fabric-6.0.6": {
                "name": "1.21.1-fabric-6.0.6",
                "codename": "",
                "isDefault": true,
                "status": "stable",
                "tutorialCount": 0,
                "analysisCount": 0,
                "releaseDate": ""
            }
        },
        "defaultVersion": "1.21.1-fabric-6.0.6"
    },
    "fabric": {
        "id": "fabric",
        "name": "Fabric 生态",
        "shortName": "Fabric ",
        "slug": "fabric",
        "icon": "fa-puzzle-piece",
        "color": "#5B8C5A",
        "colorGradient": "linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)",
        "accentColor": "#171717",
        "description": "Fabric 生态 的教程与源码分析文档",
        "category": "fabric",
        "order": 51,
        "docsDir": "docs/fabric",
        "hasTutorials": true,
        "hasAnalysis": true,
        "featured": [],
        "versions": {
            "1.21": {
                "name": "1.21",
                "codename": "",
                "isDefault": false,
                "status": "stable",
                "tutorialCount": 0,
                "analysisCount": 0,
                "releaseDate": ""
            },
            "1.21-core--": {
                "name": "1.21-core--",
                "codename": "",
                "isDefault": true,
                "status": "stable",
                "tutorialCount": 0,
                "analysisCount": 0,
                "releaseDate": ""
            }
        },
        "defaultVersion": "1.21-core--"
    },
    "neoforge": {
        "id": "neoforge",
        "name": "NeoForge",
        "shortName": "NeoForge",
        "slug": "neoforge",
        "icon": "fa-fire",
        "color": "#5B8C5A",
        "colorGradient": "linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)",
        "accentColor": "#171717",
        "description": "NeoForge的教程与源码分析文档",
        "category": "forge",
        "order": 52,
        "docsDir": "docs/neoforge",
        "hasTutorials": true,
        "hasAnalysis": true,
        "featured": [],
        "versions": {
            "1.21": {
                "name": "1.21",
                "codename": "",
                "isDefault": false,
                "status": "stable",
                "tutorialCount": 0,
                "analysisCount": 0,
                "releaseDate": ""
            },
            "1.21-core--": {
                "name": "1.21-core--",
                "codename": "",
                "isDefault": true,
                "status": "stable",
                "tutorialCount": 0,
                "analysisCount": 0,
                "releaseDate": ""
            }
        },
        "defaultVersion": "1.21-core--"
    },
    "voxy": {
        "id": "voxy",
        "name": "Voxy",
        "shortName": "Voxy",
        "slug": "voxy",
        "icon": "fa-folder-open",
        "color": "#5B8C5A",
        "colorGradient": "linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)",
        "accentColor": "#171717",
        "description": "Voxy的教程与源码分析文档",
        "category": "mc",
        "order": 53,
        "docsDir": "docs/voxy",
        "hasTutorials": true,
        "hasAnalysis": true,
        "featured": [],
        "versions": {
            "1.21.11-fabric-0.2.13-alpha": {
                "name": "1.21.11-fabric-0.2.13-alpha",
                "codename": "",
                "isDefault": true,
                "status": "stable",
                "tutorialCount": 0,
                "analysisCount": 0,
                "releaseDate": ""
            }
        },
        "defaultVersion": "1.21.11-fabric-0.2.13-alpha"
    }
};
    if (typeof SITE_CONFIG === 'undefined' || !SITE_CONFIG.modules) return;
    Object.keys(AUTO_SITE_MODULES).forEach(function (id) {
        if (!SITE_CONFIG.modules[id]) SITE_CONFIG.modules[id] = AUTO_SITE_MODULES[id];
    });
})();
// scan-docs:auto-modules:end

// ============================================
// 辅助函数
// ============================================

/**
 * 获取模组的默认版本 URL
 */
function getDefaultVersionUrl(moduleId) {
    const mod = SITE_CONFIG.modules[moduleId];
    if (!mod) return '#';
    
    if (mod.versions && mod.defaultVersion) {
        return `${mod.docsDir}/${mod.defaultVersion}/index.html`;
    }
    return `${mod.docsDir}/index.html`;
}

/**
 * 获取模组统计信息
 */
function getModuleStats(moduleId) {
    const mod = SITE_CONFIG.modules[moduleId];
    if (!mod) return null;
    
    if (mod.versions) {
        const versions = Object.values(mod.versions);
        return {
            isVersioned: true,
            totalDocs: versions.reduce((sum, v) => sum + (v.tutorialCount || 0) + (v.analysisCount || 0), 0),
            totalTutorials: versions.reduce((sum, v) => sum + (v.tutorialCount || 0), 0),
            totalAnalysis: versions.reduce((sum, v) => sum + (v.analysisCount || 0), 0),
            versions: Object.keys(mod.versions),
            defaultVersion: mod.defaultVersion
        };
    }
    
    return {
        isVersioned: false,
        totalDocs: (mod.hasTutorials ? 3 : 0) + (mod.hasAnalysis ? 6 : 0),
        totalTutorials: mod.hasTutorials ? 3 : 0,
        totalAnalysis: mod.hasAnalysis ? 6 : 0
    };
}

/**
 * 获取站点统计
 */
function getSiteStats() {
    let totalDocs = 0;
    let totalModules = Object.keys(SITE_CONFIG.modules).length;
    let mcVersions = [];
    
    Object.values(SITE_CONFIG.modules).forEach(mod => {
        const stats = getModuleStats(mod.id);
        totalDocs += stats.totalDocs;
        if (stats.isVersioned) {
            mcVersions = [...mcVersions, ...stats.versions];
        }
    });
    
    return {
        totalDocs,
        totalModules,
        mcVersions: [...new Set(mcVersions)]
    };
}

/**
 * 按分类获取模组
 */
function getModulesByCategory(categoryId) {
    return Object.values(SITE_CONFIG.modules)
        .filter(mod => mod.category === categoryId)
        .sort((a, b) => a.order - b.order);
}

/**
 * 生成搜索索引数据
 */
function buildSearchIndex() {
    const index = [];
    
    Object.values(SITE_CONFIG.modules).forEach(mod => {
        if (mod.featured) {
            mod.featured.forEach(doc => {
                index.push({
                    module: mod.id,
                    moduleName: mod.name,
                    moduleColor: mod.color,
                    docsDir: mod.docsDir,
                    ...doc
                });
            });
        }
    });
    
    return index;
}

// ============================================
// 导出配置（Node.js 环境）
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SITE_CONFIG,
        getDefaultVersionUrl,
        getModuleStats,
        getSiteStats,
        getModulesByCategory,
        buildSearchIndex
    };
}

// 浏览器端：供首页等静态页使用（与 Node 导出逻辑一致）
if (typeof window !== 'undefined') {
    window.SITE_CONFIG = SITE_CONFIG;
    window.getDefaultVersionUrl = getDefaultVersionUrl;
}
