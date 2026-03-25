/**
 * 自动生成的模块配置
 * 由 auto-scanner.js 自动生成
 * 不要手动修改此文件！
 */

const path = require('path');

const autoModules = {
    "fabric": {
        "name": "Fabric 模组",
        "slug": "fabric",
        "icon": "layer-group",
        "color": "#4A90D9",
        "colorGradient": "linear-gradient(135deg, #4A90D9 0%, #5BA0E9 100%)",
        "description": "Fabric 模组开发框架详解",
        "versions": [
            "1.21-core--"
        ],
        "defaultVersion": "1.21-core--",
        "docsDir": "docs/fabric",
        "tutorials": [
            {
                "file": "part-0-prerequisites/01-java-basics",
                "htmlPath": "part-0-prerequisites/01-java-basics.html",
                "title": "第一章：Java 编程基础",
                "part": "0",
                "partSuffix": "prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-0-prerequisites\\01-java-basics.md"
            },
            {
                "file": "part-0-prerequisites/02-environment-setup",
                "htmlPath": "part-0-prerequisites/02-environment-setup.html",
                "title": "第二章：开发环境搭建",
                "part": "0",
                "partSuffix": "prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-0-prerequisites\\02-environment-setup.md"
            },
            {
                "file": "part-0-prerequisites/03-minecraft-mod-concepts",
                "htmlPath": "part-0-prerequisites/03-minecraft-mod-concepts.html",
                "title": "第三章：Minecraft Mod 开发概念",
                "part": "0",
                "partSuffix": "prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-0-prerequisites\\03-minecraft-mod-concepts.md"
            },
            {
                "file": "part-0-prerequisites/04-first-mod",
                "htmlPath": "part-0-prerequisites/04-first-mod.html",
                "title": "第四章：创建你的第一个 Mod",
                "part": "0",
                "partSuffix": "prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-0-prerequisites\\04-first-mod.md"
            },
            {
                "file": "part-1-basics/01-fabric-intro",
                "htmlPath": "part-1-basics/01-fabric-intro.html",
                "title": "🎮 Fabric 是什么？—— 让你的 MC 听你的话！",
                "part": "1",
                "partSuffix": "basics",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-1-basics\\01-fabric-intro.md"
            },
            {
                "file": "part-1-basics/02-mod-structure",
                "htmlPath": "part-1-basics/02-mod-structure.html",
                "title": "第二章：Mod 项目结构",
                "part": "1",
                "partSuffix": "basics",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-1-basics\\02-mod-structure.md"
            },
            {
                "file": "part-1-basics/03-event-system",
                "htmlPath": "part-1-basics/03-event-system.html",
                "title": "⚡ 事件系统 —— 让游戏\"活\"起来！",
                "part": "1",
                "partSuffix": "basics",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-1-basics\\03-event-system.md"
            },
            {
                "file": "part-1-basics/04-registry-system",
                "htmlPath": "part-1-basics/04-registry-system.html",
                "title": "🔖 注册系统 —— 给你的 Mod 对象发\"身份证\"！",
                "part": "1",
                "partSuffix": "basics",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-1-basics\\04-registry-system.md"
            },
            {
                "file": "part-2-blocks-items/01-creating-blocks",
                "htmlPath": "part-2-blocks-items/01-creating-blocks.html",
                "title": "🧱 创建你的第一个方块！",
                "part": "2",
                "partSuffix": "blocks-items",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-2-blocks-items\\01-creating-blocks.md"
            },
            {
                "file": "part-2-blocks-items/03-creating-items",
                "htmlPath": "part-2-blocks-items/03-creating-items.html",
                "title": "第二章：创建自定义物品",
                "part": "2",
                "partSuffix": "blocks-items",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-2-blocks-items\\03-creating-items.md"
            },
            {
                "file": "part-3-entities/01-entity-basics",
                "htmlPath": "part-3-entities/01-entity-basics.html",
                "title": "👾 创建你的第一个生物！",
                "part": "3",
                "partSuffix": "entities",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-3-entities\\01-entity-basics.md"
            },
            {
                "file": "part-4-world-gen/01-biome-intro",
                "htmlPath": "part-4-world-gen/01-biome-intro.html",
                "title": "第一章：生物群系简介",
                "part": "4",
                "partSuffix": "world-gen",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-4-world-gen\\01-biome-intro.md"
            },
            {
                "file": "part-4-world-gen/02-custom-biome",
                "htmlPath": "part-4-world-gen/02-custom-biome.html",
                "title": "第二章：创建自定义生物群系",
                "part": "4",
                "partSuffix": "world-gen",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-4-world-gen\\02-custom-biome.md"
            },
            {
                "file": "part-4-world-gen/03-features",
                "htmlPath": "part-4-world-gen/03-features.html",
                "title": "第三章：世界特征",
                "part": "4",
                "partSuffix": "world-gen",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-4-world-gen\\03-features.md"
            },
            {
                "file": "part-5-rendering/01-rendering-basics",
                "htmlPath": "part-5-rendering/01-rendering-basics.html",
                "title": "渲染基础",
                "part": "5",
                "partSuffix": "rendering",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-5-rendering\\01-rendering-basics.md"
            },
            {
                "file": "part-5-rendering/02-custom-models",
                "htmlPath": "part-5-rendering/02-custom-models.html",
                "title": "自定义模型",
                "part": "5",
                "partSuffix": "rendering",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-5-rendering\\02-custom-models.md"
            },
            {
                "file": "part-5-rendering/03-particles",
                "htmlPath": "part-5-rendering/03-particles.html",
                "title": "粒子效果",
                "part": "5",
                "partSuffix": "rendering",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-5-rendering\\03-particles.md"
            },
            {
                "file": "part-6-networking/01-networking-basics",
                "htmlPath": "part-6-networking/01-networking-basics.html",
                "title": "1. 网络基础",
                "part": "6",
                "partSuffix": "networking",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-6-networking\\01-networking-basics.md"
            },
            {
                "file": "part-6-networking/02-custom-packets",
                "htmlPath": "part-6-networking/02-custom-packets.html",
                "title": "2. 自定义数据包",
                "part": "6",
                "partSuffix": "networking",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-6-networking\\02-custom-packets.md"
            },
            {
                "file": "part-6-networking/03-commands",
                "htmlPath": "part-6-networking/03-commands.html",
                "title": "3. 自定义命令",
                "part": "6",
                "partSuffix": "networking",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-6-networking\\03-commands.md"
            },
            {
                "file": "part-7-advanced/01-transfer-api",
                "htmlPath": "part-7-advanced/01-transfer-api.html",
                "title": "第一章：传输 API 教程",
                "part": "7",
                "partSuffix": "advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-7-advanced\\01-transfer-api.md"
            },
            {
                "file": "part-7-advanced/02-data-attachment",
                "htmlPath": "part-7-advanced/02-data-attachment.html",
                "title": "第二章：数据附件教程",
                "part": "7",
                "partSuffix": "advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-7-advanced\\02-data-attachment.md"
            },
            {
                "file": "part-7-advanced/03-recipes",
                "htmlPath": "part-7-advanced/03-recipes.html",
                "title": "第三章：配方系统教程",
                "part": "7",
                "partSuffix": "advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-7-advanced\\03-recipes.md"
            },
            {
                "file": "part-7-advanced/04-loot-tables",
                "htmlPath": "part-7-advanced/04-loot-tables.html",
                "title": "第四章：战利品表教程",
                "part": "7",
                "partSuffix": "advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-7-advanced\\04-loot-tables.md"
            },
            {
                "file": "part-8-projects/01-project-overview",
                "htmlPath": "part-8-projects/01-project-overview.html",
                "title": "🎮 实战项目：从零打造你的魔法世界！",
                "part": "8",
                "partSuffix": "projects",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-8-projects\\01-project-overview.md"
            },
            {
                "file": "part-8-projects/02-magic-crystal",
                "htmlPath": "part-8-projects/02-magic-crystal.html",
                "title": "第二章：魔法水晶 - 完整实战",
                "part": "8",
                "partSuffix": "projects",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-8-projects\\02-magic-crystal.md"
            },
            {
                "file": "part-8-projects/03-magic-wand",
                "htmlPath": "part-8-projects/03-magic-wand.html",
                "title": "第三章：魔法棒 - 特殊物品与网络通信",
                "part": "8",
                "partSuffix": "projects",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-8-projects\\03-magic-wand.md"
            },
            {
                "file": "part-8-projects/04-magic-creature",
                "htmlPath": "part-8-projects/04-magic-creature.html",
                "title": "第四章：魔法生物 - 自定义实体与 AI",
                "part": "8",
                "partSuffix": "projects",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\part-8-projects\\04-magic-creature.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Fabric Mod 开发完全指南",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\tutorials\\README.md"
            }
        ],
        "analysis": [
            {
                "file": "01-fabric-api-base",
                "htmlPath": "01-fabric-api-base.html",
                "title": "Fabric API Base 模块深度分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\01-fabric-api-base.md"
            },
            {
                "file": "02-block-system",
                "htmlPath": "02-block-system.html",
                "title": "Fabric API 方块系统模块分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\02-block-system.md"
            },
            {
                "file": "03-item-recipe-system",
                "htmlPath": "03-item-recipe-system.html",
                "title": "Fabric API 物品与配方系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\03-item-recipe-system.md"
            },
            {
                "file": "04-biome-dimension-system",
                "htmlPath": "04-biome-dimension-system.html",
                "title": "Fabric API 生物群系与维度系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\04-biome-dimension-system.md"
            },
            {
                "file": "05-entity-event-system",
                "htmlPath": "05-entity-event-system.html",
                "title": "Fabric API 实体与事件系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\05-entity-event-system.md"
            },
            {
                "file": "06-rendering-system",
                "htmlPath": "06-rendering-system.html",
                "title": "Fabric API 渲染系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\06-rendering-system.md"
            },
            {
                "file": "07-networking-system",
                "htmlPath": "07-networking-system.html",
                "title": "Fabric API 网络系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\07-networking-system.md"
            },
            {
                "file": "08-resource-system",
                "htmlPath": "08-resource-system.html",
                "title": "Fabric API 资源加载系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\08-resource-system.md"
            },
            {
                "file": "09-transfer-system",
                "htmlPath": "09-transfer-system.html",
                "title": "Fabric API 传输/存储系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\09-transfer-system.md"
            },
            {
                "file": "10-command-screen-system",
                "htmlPath": "10-command-screen-system.html",
                "title": "Fabric API 命令与屏幕系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\10-command-screen-system.md"
            },
            {
                "file": "11-other-subsystems",
                "htmlPath": "11-other-subsystems.html",
                "title": "Fabric API 其他子系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\11-other-subsystems.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Fabric API 深度分析总览",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\fabric\\1.21\\core\\-\\analysis\\README.md"
            }
        ],
        "docCount": 41,
        "theme": "fabric",
        "sourceUrl": null,
        "modVersion": null,
        "minecraftVersion": null,
        "loader": null
    },
    "forge": {
        "name": "Forge 模组",
        "slug": "forge",
        "icon": "hammer",
        "color": "#4A90D9",
        "colorGradient": "linear-gradient(135deg, #4A90D9 0%, #5BA0E9 100%)",
        "description": "Forge 模组开发框架详解",
        "versions": [
            "1.21-core--"
        ],
        "defaultVersion": "1.21-core--",
        "docsDir": "docs/forge",
        "tutorials": [
            {
                "file": "01-intro",
                "htmlPath": "01-intro.html",
                "title": "Forge 模组开发入门",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\forge\\1.21\\core\\-\\tutorials\\01-intro.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Forge 模组开发",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\forge\\1.21\\core\\-\\tutorials\\README.md"
            }
        ],
        "analysis": [],
        "docCount": 2,
        "theme": "forge",
        "sourceUrl": null,
        "modVersion": null,
        "minecraftVersion": null,
        "loader": null
    },
    "ImmersivePortalsMod": {
        "name": "ImmersivePortalsMod 文档",
        "slug": "ImmersivePortalsMod",
        "icon": "door-open",
        "color": "#3498DB",
        "colorGradient": "linear-gradient(135deg, #3498DB 0%, #5DADE2 100%)",
        "description": "ImmersivePortalsMod 相关文档",
        "versions": [
            "1.21.1-fabric-6.0.6"
        ],
        "defaultVersion": "1.21.1-fabric-6.0.6",
        "docsDir": "docs/ImmersivePortalsMod",
        "tutorials": [
            {
                "file": "Part-0-Prerequisites/01-portal-intro",
                "htmlPath": "Part-0-Prerequisites/01-portal-intro.html",
                "title": "传送门基础概念入门",
                "part": "0",
                "partSuffix": "Prerequisites",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-0-Prerequisites\\01-portal-intro.md"
            },
            {
                "file": "Part-1-Foundation/02-portal-entity",
                "htmlPath": "Part-1-Foundation/02-portal-entity.html",
                "title": "传送门实体初探",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-1-Foundation\\02-portal-entity.md"
            },
            {
                "file": "Part-1-Foundation/03-teleportation-basics",
                "htmlPath": "Part-1-Foundation/03-teleportation-basics.html",
                "title": "传送机制基础",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-1-Foundation\\03-teleportation-basics.md"
            },
            {
                "file": "Part-2-Rendering/04-portal-rendering",
                "htmlPath": "Part-2-Rendering/04-portal-rendering.html",
                "title": "第四章：渲染原理",
                "part": "2",
                "partSuffix": "Rendering",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-2-Rendering\\04-portal-rendering.md"
            },
            {
                "file": "Part-3-Advanced/05-nested-portals",
                "htmlPath": "Part-3-Advanced/05-nested-portals.html",
                "title": "嵌套传送门",
                "part": "3",
                "partSuffix": "Advanced",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-3-Advanced\\05-nested-portals.md"
            },
            {
                "file": "Part-3-Advanced/06-mirror-system",
                "htmlPath": "Part-3-Advanced/06-mirror-system.html",
                "title": "镜像系统",
                "part": "3",
                "partSuffix": "Advanced",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-3-Advanced\\06-mirror-system.md"
            },
            {
                "file": "Part-3-Advanced/07-scaling-portals",
                "htmlPath": "Part-3-Advanced/07-scaling-portals.html",
                "title": "第七章：缩放传送",
                "part": "3",
                "partSuffix": "Advanced",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-3-Advanced\\07-scaling-portals.md"
            },
            {
                "file": "Part-4-Development/08-portal-api-basics",
                "htmlPath": "Part-4-Development/08-portal-api-basics.html",
                "title": "API 基础使用",
                "part": "4",
                "partSuffix": "Development",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-4-Development\\08-portal-api-basics.md"
            },
            {
                "file": "Part-4-Development/09-portal-api-advanced",
                "htmlPath": "Part-4-Development/09-portal-api-advanced.html",
                "title": "API 高级应用",
                "part": "4",
                "partSuffix": "Development",
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\Part-4-Development\\09-portal-api-advanced.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "ImmersivePortalsMod 教程系列",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\README.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "ImmersivePortalsMod 教程总结",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\tutorials\\SUMMARY.md"
            }
        ],
        "analysis": [
            {
                "file": "01-core-architecture",
                "htmlPath": "01-core-architecture.html",
                "title": "ImmersivePortalsMod Core Architecture Analysis",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\01-core-architecture.md"
            },
            {
                "file": "02-portal-entity",
                "htmlPath": "02-portal-entity.html",
                "title": "Portal Entity System",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\02-portal-entity.md"
            },
            {
                "file": "03-teleportation-system",
                "htmlPath": "03-teleportation-system.html",
                "title": "Teleportation System",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\03-teleportation-system.md"
            },
            {
                "file": "04-rendering-system",
                "htmlPath": "04-rendering-system.html",
                "title": "Rendering System",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\04-rendering-system.md"
            },
            {
                "file": "05-network-sync",
                "htmlPath": "05-network-sync.html",
                "title": "Network Synchronization System",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\05-network-sync.md"
            },
            {
                "file": "06-compatibility",
                "htmlPath": "06-compatibility.html",
                "title": "ImmersivePortalsMod 兼容性系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\06-compatibility.md"
            },
            {
                "file": "07-mixin-system",
                "htmlPath": "07-mixin-system.html",
                "title": "Mixin Injection System",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\07-mixin-system.md"
            },
            {
                "file": "08-public-api",
                "htmlPath": "08-public-api.html",
                "title": "Public API",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\08-public-api.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "Architecture Summary",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.1-fabric-6.0.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\ImmersivePortalsMod\\1.21.1\\fabric\\6.0.6\\analysis\\SUMMARY.md"
            }
        ],
        "docCount": 20,
        "theme": "ImmersivePortalsMod",
        "sourceUrl": "https://github.com/qouteall/ImmersivePortals",
        "modVersion": "6.0.6",
        "minecraftVersion": "1.21.1",
        "loader": "Fabric"
    },
    "iris": {
        "name": "Iris 光影",
        "slug": "iris",
        "icon": "sun",
        "color": "#1ABC9C",
        "colorGradient": "linear-gradient(135deg, #1ABC9C 0%, #48C9B0 100%)",
        "description": "Iris 光影加载器与渲染管线深度解析",
        "versions": [
            "1.21-fabric-1.7.3"
        ],
        "defaultVersion": "1.21-fabric-1.7.3",
        "docsDir": "docs/iris",
        "tutorials": [
            {
                "file": "00-introduction",
                "htmlPath": "00-introduction.html",
                "title": "🎮 从零开始的 Shader 冒险！",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\00-introduction.md"
            },
            {
                "file": "01-shader-basics",
                "htmlPath": "01-shader-basics.html",
                "title": "🚀 第一章：Shader 是什么？",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\01-shader-basics.md"
            },
            {
                "file": "02-iris-setup",
                "htmlPath": "02-iris-setup.html",
                "title": "⚙️ 第二章：开发环境搭建",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\02-iris-setup.md"
            },
            {
                "file": "03-first-color",
                "htmlPath": "03-first-color.html",
                "title": "🎨 第三章：第一个颜色魔法",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\03-first-color.md"
            },
            {
                "file": "04-shaderpack-structure",
                "htmlPath": "04-shaderpack-structure.html",
                "title": "🏗️ 第四章：ShaderPack 结构 - 理解完整文件组织",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\04-shaderpack-structure.md"
            },
            {
                "file": "05-uniform-animation",
                "htmlPath": "05-uniform-animation.html",
                "title": "✨ 第五章：Uniform 变量 - 让世界动起来！",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\05-uniform-animation.md"
            },
            {
                "file": "06-postprocessing",
                "htmlPath": "06-postprocessing.html",
                "title": "🔮 第六章：后处理魔法 - 全屏特效！",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\06-postprocessing.md"
            },
            {
                "file": "07-create-shaderpack",
                "htmlPath": "07-create-shaderpack.html",
                "title": "🏆 最终章：创造你的第一个光影包！",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\07-create-shaderpack.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "🎮 Iris 光影开发教程",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\tutorials\\README.md"
            }
        ],
        "analysis": [
            {
                "file": "01-architecture-overview",
                "htmlPath": "01-architecture-overview.html",
                "title": "Iris 光影 Mod 整体架构分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\01-architecture-overview.md"
            },
            {
                "file": "02-rendering-pipeline",
                "htmlPath": "02-rendering-pipeline.html",
                "title": "Iris 渲染管线",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\02-rendering-pipeline.md"
            },
            {
                "file": "03-shaderpack-system",
                "htmlPath": "03-shaderpack-system.html",
                "title": "Iris 着色器包系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\03-shaderpack-system.md"
            },
            {
                "file": "04-shadow-system",
                "htmlPath": "04-shadow-system.html",
                "title": "Iris 阴影系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\04-shadow-system.md"
            },
            {
                "file": "05-framebuffer-texture",
                "htmlPath": "05-framebuffer-texture.html",
                "title": "Iris 帧缓冲与纹理系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\05-framebuffer-texture.md"
            },
            {
                "file": "06-uniforms",
                "htmlPath": "06-uniforms.html",
                "title": "Iris Uniform 系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\06-uniforms.md"
            },
            {
                "file": "07-sodium-integration",
                "htmlPath": "07-sodium-integration.html",
                "title": "Iris Sodium 集成系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\07-sodium-integration.md"
            },
            {
                "file": "08-mixin-mechanism",
                "htmlPath": "08-mixin-mechanism.html",
                "title": "Iris Mixin 注入机制分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\08-mixin-mechanism.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Iris 源代码分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\README.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "Iris 分析总结",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-1.7.3",
                "fullPath": "D:\\Minecraft-Learning\\content\\iris\\1.21\\fabric\\1.7.3\\analysis\\SUMMARY.md"
            }
        ],
        "docCount": 19,
        "theme": "iris",
        "sourceUrl": null,
        "modVersion": null,
        "minecraftVersion": null,
        "loader": null
    },
    "mc": {
        "name": "Minecraft 原版",
        "slug": "mc",
        "icon": "cube",
        "color": "#3498DB",
        "colorGradient": "linear-gradient(135deg, #3498DB 0%, #5DADE2 100%)",
        "description": "Minecraft 原版核心架构与源码深度解析",
        "versions": [
            "1.21-core--"
        ],
        "defaultVersion": "1.21-core--",
        "docsDir": "docs/mc",
        "tutorials": [
            {
                "file": "00-TUTORIAL-PLAN",
                "htmlPath": "00-TUTORIAL-PLAN.html",
                "title": "Minecraft 源码萌新教程计划",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\00-TUTORIAL-PLAN.md"
            },
            {
                "file": "01-LEARNING-ROADMAP",
                "htmlPath": "01-LEARNING-ROADMAP.html",
                "title": "Minecraft 源码学习路线图",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\01-LEARNING-ROADMAP.md"
            },
            {
                "file": "Part-0-Prerequisites/00-course-overview",
                "htmlPath": "Part-0-Prerequisites/00-course-overview.html",
                "title": "🎮 Minecraft 源码入门教程 - 课程总览",
                "part": "0",
                "partSuffix": "Prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-0-Prerequisites\\00-course-overview.md"
            },
            {
                "file": "Part-0-Prerequisites/01-java-basics",
                "htmlPath": "Part-0-Prerequisites/01-java-basics.html",
                "title": "☕ Java 基础速查",
                "part": "0",
                "partSuffix": "Prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-0-Prerequisites\\01-java-basics.md"
            },
            {
                "file": "Part-0-Prerequisites/02-development-env",
                "htmlPath": "Part-0-Prerequisites/02-development-env.html",
                "title": "💻 开发环境搭建",
                "part": "0",
                "partSuffix": "Prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-0-Prerequisites\\02-development-env.md"
            },
            {
                "file": "Part-0-Prerequisites/03-project-intro",
                "htmlPath": "Part-0-Prerequisites/03-project-intro.html",
                "title": "📁 项目结构介绍",
                "part": "0",
                "partSuffix": "Prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-0-Prerequisites\\03-project-intro.md"
            },
            {
                "file": "Part-0-Prerequisites/04-sourcecode-guide",
                "htmlPath": "Part-0-Prerequisites/04-sourcecode-guide.html",
                "title": "附录：源码查找指南",
                "part": "0",
                "partSuffix": "Prerequisites",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-0-Prerequisites\\04-sourcecode-guide.md"
            },
            {
                "file": "Part-1-Foundation/04-registry-system",
                "htmlPath": "Part-1-Foundation/04-registry-system.html",
                "title": "第四章：注册表系统（Registry System）",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-1-Foundation\\04-registry-system.md"
            },
            {
                "file": "Part-1-Foundation/05-client-server-arch",
                "htmlPath": "Part-1-Foundation/05-client-server-arch.html",
                "title": "第五章：客户端-服务端架构（Client-Server Architecture）",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-1-Foundation\\05-client-server-arch.md"
            },
            {
                "file": "Part-1-Foundation/06-shared-constants",
                "htmlPath": "Part-1-Foundation/06-shared-constants.html",
                "title": "第六章：共享常量（Shared Constants）",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-1-Foundation\\06-shared-constants.md"
            },
            {
                "file": "Part-1-Foundation/07-bootstrap-flow",
                "htmlPath": "Part-1-Foundation/07-bootstrap-flow.html",
                "title": "第七章：启动流程（Bootstrap Flow）",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-1-Foundation\\07-bootstrap-flow.md"
            },
            {
                "file": "Part-10-Server/49-server-intro",
                "htmlPath": "Part-10-Server/49-server-intro.html",
                "title": "第四十九章：Minecraft 服务器核心 - MinecraftServer",
                "part": "10",
                "partSuffix": "Server",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-10-Server\\49-server-intro.md"
            },
            {
                "file": "Part-10-Server/50-player-manager",
                "htmlPath": "Part-10-Server/50-player-manager.html",
                "title": "第五十章：玩家大管家 - PlayerManager",
                "part": "10",
                "partSuffix": "Server",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-10-Server\\50-player-manager.md"
            },
            {
                "file": "Part-10-Server/51-save-system",
                "htmlPath": "Part-10-Server/51-save-system.html",
                "title": "第五十一章：世界守护者 - 存档系统",
                "part": "10",
                "partSuffix": "Server",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-10-Server\\51-save-system.md"
            },
            {
                "file": "Part-10-Server/52-dedicated-vs-integrated",
                "htmlPath": "Part-10-Server/52-dedicated-vs-integrated.html",
                "title": "第五十二章：双生子 - 独立服务器与整合服务器",
                "part": "10",
                "partSuffix": "Server",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-10-Server\\52-dedicated-vs-integrated.md"
            },
            {
                "file": "Part-11-Advanced/53-datafixer",
                "htmlPath": "Part-11-Advanced/53-datafixer.html",
                "title": "第53章 数据修复系统 (DataFixer)",
                "part": "11",
                "partSuffix": "Advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-11-Advanced\\53-datafixer.md"
            },
            {
                "file": "Part-11-Advanced/54-fluids",
                "htmlPath": "Part-11-Advanced/54-fluids.html",
                "title": "第54章 流体系统 (Fluids)",
                "part": "11",
                "partSuffix": "Advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-11-Advanced\\54-fluids.md"
            },
            {
                "file": "Part-11-Advanced/55-village-system",
                "htmlPath": "Part-11-Advanced/55-village-system.html",
                "title": "第55章 村民系统 (Village System)",
                "part": "11",
                "partSuffix": "Advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-11-Advanced\\55-village-system.md"
            },
            {
                "file": "Part-11-Advanced/56-raid-system",
                "htmlPath": "Part-11-Advanced/56-raid-system.html",
                "title": "第56章 袭击系统 (Raid System)",
                "part": "11",
                "partSuffix": "Advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-11-Advanced\\56-raid-system.md"
            },
            {
                "file": "Part-11-Advanced/57-structure-system",
                "htmlPath": "Part-11-Advanced/57-structure-system.html",
                "title": "第57章 结构系统 (Structure System)",
                "part": "11",
                "partSuffix": "Advanced",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-11-Advanced\\57-structure-system.md"
            },
            {
                "file": "Part-12-Practice/100-project3-entity",
                "htmlPath": "Part-12-Practice/100-project3-entity.html",
                "title": "项目3：添加新生物",
                "part": "12",
                "partSuffix": "Practice",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-12-Practice\\100-project3-entity.md"
            },
            {
                "file": "Part-12-Practice/101-project4-datapack",
                "htmlPath": "Part-12-Practice/101-project4-datapack.html",
                "title": "项目4：创建数据包",
                "part": "12",
                "partSuffix": "Practice",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-12-Practice\\101-project4-datapack.md"
            },
            {
                "file": "Part-12-Practice/98-project1-block",
                "htmlPath": "Part-12-Practice/98-project1-block.html",
                "title": "项目1：添加新方块",
                "part": "12",
                "partSuffix": "Practice",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-12-Practice\\98-project1-block.md"
            },
            {
                "file": "Part-12-Practice/99-project2-item",
                "htmlPath": "Part-12-Practice/99-project2-item.html",
                "title": "项目2：添加新物品",
                "part": "12",
                "partSuffix": "Practice",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-12-Practice\\99-project2-item.md"
            },
            {
                "file": "Part-13-Additional/enchantment-system",
                "htmlPath": "Part-13-Additional/enchantment-system.html",
                "title": "附魔系统 (Enchantment System)",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\enchantment-system.md"
            },
            {
                "file": "Part-13-Additional/inventory-system",
                "htmlPath": "Part-13-Additional/inventory-system.html",
                "title": "物品栏容器系统",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\inventory-system.md"
            },
            {
                "file": "Part-13-Additional/nbt-data-system",
                "htmlPath": "Part-13-Additional/nbt-data-system.html",
                "title": "NBT 数据系统",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\nbt-data-system.md"
            },
            {
                "file": "Part-13-Additional/particle-system",
                "htmlPath": "Part-13-Additional/particle-system.html",
                "title": "Minecraft 粒子系统详解",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\particle-system.md"
            },
            {
                "file": "Part-13-Additional/potion-effect-system",
                "htmlPath": "Part-13-Additional/potion-effect-system.html",
                "title": "Minecraft 药水效果系统详解",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\potion-effect-system.md"
            },
            {
                "file": "Part-13-Additional/scoreboard-system",
                "htmlPath": "Part-13-Additional/scoreboard-system.html",
                "title": "记分板系统 (Scoreboard System)",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\scoreboard-system.md"
            },
            {
                "file": "Part-13-Additional/sound-system",
                "htmlPath": "Part-13-Additional/sound-system.html",
                "title": "Minecraft 声音系统详解",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\sound-system.md"
            },
            {
                "file": "Part-13-Additional/stats-system",
                "htmlPath": "Part-13-Additional/stats-system.html",
                "title": "统计系统 (Stats System)",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\stats-system.md"
            },
            {
                "file": "Part-13-Additional/text-system",
                "htmlPath": "Part-13-Additional/text-system.html",
                "title": "文本系统 (Text System)",
                "part": "13",
                "partSuffix": "Additional",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-13-Additional\\text-system.md"
            },
            {
                "file": "Part-2-World/08-world-core",
                "htmlPath": "Part-2-World/08-world-core.html",
                "title": "08 - 世界核心：World 类",
                "part": "2",
                "partSuffix": "World",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-2-World\\08-world-core.md"
            },
            {
                "file": "Part-2-World/09-chunk-system",
                "htmlPath": "Part-2-World/09-chunk-system.html",
                "title": "09 - 区块系统：Chunk 的奥秘",
                "part": "2",
                "partSuffix": "World",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-2-World\\09-chunk-system.md"
            },
            {
                "file": "Part-2-World/10-biome-system",
                "htmlPath": "Part-2-World/10-biome-system.html",
                "title": "10 - 生物群系系统：Biome 的多彩世界",
                "part": "2",
                "partSuffix": "World",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-2-World\\10-biome-system.md"
            },
            {
                "file": "Part-2-World/11-terrain-gen",
                "htmlPath": "Part-2-World/11-terrain-gen.html",
                "title": "11 - 地形生成：从噪声到山川河流",
                "part": "2",
                "partSuffix": "World",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-2-World\\11-terrain-gen.md"
            },
            {
                "file": "Part-2-World/12-lighting-system",
                "htmlPath": "Part-2-World/12-lighting-system.html",
                "title": "12 - 光照系统：明暗的艺术",
                "part": "2",
                "partSuffix": "World",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-2-World\\12-lighting-system.md"
            },
            {
                "file": "Part-2-World/13-heightmap",
                "htmlPath": "Part-2-World/13-heightmap.html",
                "title": "13 - 高度图：快速查找地形高度",
                "part": "2",
                "partSuffix": "World",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-2-World\\13-heightmap.md"
            },
            {
                "file": "Part-3-Block-Item/14-block-basics",
                "htmlPath": "Part-3-Block-Item/14-block-basics.html",
                "title": "14 - Block 类：方块的基础",
                "part": "3",
                "partSuffix": "Block-Item",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-3-Block-Item\\14-block-basics.md"
            },
            {
                "file": "Part-3-Block-Item/15-block-state",
                "htmlPath": "Part-3-Block-Item/15-block-state.html",
                "title": "15 - BlockState：方块的不同状态",
                "part": "3",
                "partSuffix": "Block-Item",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-3-Block-Item\\15-block-state.md"
            },
            {
                "file": "Part-3-Block-Item/16-block-entity",
                "htmlPath": "Part-3-Block-Item/16-block-entity.html",
                "title": "16 - BlockEntity：需要存储数据的方块",
                "part": "3",
                "partSuffix": "Block-Item",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-3-Block-Item\\16-block-entity.md"
            },
            {
                "file": "Part-3-Block-Item/17-item-basics",
                "htmlPath": "Part-3-Block-Item/17-item-basics.html",
                "title": "17 - Item 类：物品的基础",
                "part": "3",
                "partSuffix": "Block-Item",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-3-Block-Item\\17-item-basics.md"
            },
            {
                "file": "Part-3-Block-Item/18-item-stack",
                "htmlPath": "Part-3-Block-Item/18-item-stack.html",
                "title": "18 - ItemStack：物品堆叠",
                "part": "3",
                "partSuffix": "Block-Item",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-3-Block-Item\\18-item-stack.md"
            },
            {
                "file": "Part-3-Block-Item/19-item-component",
                "htmlPath": "Part-3-Block-Item/19-item-component.html",
                "title": "19 - ComponentMap：1.21新版物品数据系统",
                "part": "3",
                "partSuffix": "Block-Item",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-3-Block-Item\\19-item-component.md"
            },
            {
                "file": "Part-4-Entity/20-entity-intro",
                "htmlPath": "Part-4-Entity/20-entity-intro.html",
                "title": "第20章 Entity（实体）——游戏世界里的\"活物\"",
                "part": "4",
                "partSuffix": "Entity",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-4-Entity\\20-entity-intro.md"
            },
            {
                "file": "Part-4-Entity/21-entity-lifecycle",
                "htmlPath": "Part-4-Entity/21-entity-lifecycle.html",
                "title": "第21章 Entity 生命周期——实体的生老病死",
                "part": "4",
                "partSuffix": "Entity",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-4-Entity\\21-entity-lifecycle.md"
            },
            {
                "file": "Part-4-Entity/22-living-entity",
                "htmlPath": "Part-4-Entity/22-living-entity.html",
                "title": "第22章 LivingEntity——有血有肉的活物",
                "part": "4",
                "partSuffix": "Entity",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-4-Entity\\22-living-entity.md"
            },
            {
                "file": "Part-4-Entity/23-mob-entity",
                "htmlPath": "Part-4-Entity/23-mob-entity.html",
                "title": "第23章 MobEntity——会思考的生物",
                "part": "4",
                "partSuffix": "Entity",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-4-Entity\\23-mob-entity.md"
            },
            {
                "file": "Part-4-Entity/24-entity-attributes",
                "htmlPath": "Part-4-Entity/24-entity-attributes.html",
                "title": "第24章 实体属性系统——角色的能力数值",
                "part": "4",
                "partSuffix": "Entity",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-4-Entity\\24-entity-attributes.md"
            },
            {
                "file": "Part-4-Entity/25-damage-system",
                "htmlPath": "Part-4-Entity/25-damage-system.html",
                "title": "第25章 伤害系统——攻击与防御的机制",
                "part": "4",
                "partSuffix": "Entity",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-4-Entity\\25-damage-system.md"
            },
            {
                "file": "Part-4-Entity/26-spawn-system",
                "htmlPath": "Part-4-Entity/26-spawn-system.html",
                "title": "第26章 生成系统——生物是如何出现在世界上的",
                "part": "4",
                "partSuffix": "Entity",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-4-Entity\\26-spawn-system.md"
            },
            {
                "file": "Part-5-AI/27-ai-brain-intro",
                "htmlPath": "Part-5-AI/27-ai-brain-intro.html",
                "title": "第27章：AI大脑 - 生物的\"思考中心\"",
                "part": "5",
                "partSuffix": "AI",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-5-AI\\27-ai-brain-intro.md"
            },
            {
                "file": "Part-5-AI/28-memory-system",
                "htmlPath": "Part-5-AI/28-memory-system.html",
                "title": "第28章：记忆系统 - 生物的\"记忆库\"",
                "part": "5",
                "partSuffix": "AI",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-5-AI\\28-memory-system.md"
            },
            {
                "file": "Part-5-AI/29-sensor-system",
                "htmlPath": "Part-5-AI/29-sensor-system.html",
                "title": "第二十九章：传感器系统 - 生物的\"感官\"",
                "part": "5",
                "partSuffix": "AI",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-5-AI\\29-sensor-system.md"
            },
            {
                "file": "Part-5-AI/30-task-system",
                "htmlPath": "Part-5-AI/30-task-system.html",
                "title": "第30章：任务系统 - 生物的\"行为动作\"",
                "part": "5",
                "partSuffix": "AI",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-5-AI\\30-task-system.md"
            },
            {
                "file": "Part-5-AI/31-activity-schedule",
                "htmlPath": "Part-5-AI/31-activity-schedule.html",
                "title": "第31章：活动与日程 - 生物的\"作息表\"",
                "part": "5",
                "partSuffix": "AI",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-5-AI\\31-activity-schedule.md"
            },
            {
                "file": "Part-5-AI/32-pathfinding",
                "htmlPath": "Part-5-AI/32-pathfinding.html",
                "title": "第32章：路径导航 - 生物的\"GPS导航\"",
                "part": "5",
                "partSuffix": "AI",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-5-AI\\32-pathfinding.md"
            },
            {
                "file": "Part-6-Network/33-network-intro",
                "htmlPath": "Part-6-Network/33-network-intro.html",
                "title": "第33章 网络基础入门",
                "part": "6",
                "partSuffix": "Network",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-6-Network\\33-network-intro.md"
            },
            {
                "file": "Part-6-Network/34-packet-system",
                "htmlPath": "Part-6-Network/34-packet-system.html",
                "title": "第34章 数据包系统详解",
                "part": "6",
                "partSuffix": "Network",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-6-Network\\34-packet-system.md"
            },
            {
                "file": "Part-6-Network/35-protocol-states",
                "htmlPath": "Part-6-Network/35-protocol-states.html",
                "title": "第35章 协议状态机详解",
                "part": "6",
                "partSuffix": "Network",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-6-Network\\35-protocol-states.md"
            },
            {
                "file": "Part-6-Network/36-sync-mechanism",
                "htmlPath": "Part-6-Network/36-sync-mechanism.html",
                "title": "第36章 同步机制详解",
                "part": "6",
                "partSuffix": "Network",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-6-Network\\36-sync-mechanism.md"
            },
            {
                "file": "Part-7-Command/37-command-intro",
                "htmlPath": "Part-7-Command/37-command-intro.html",
                "title": "第37章 命令系统入门 —— 理解 Minecraft 的指令世界",
                "part": "7",
                "partSuffix": "Command",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-7-Command\\37-command-intro.md"
            },
            {
                "file": "Part-7-Command/38-brigadier-basics",
                "htmlPath": "Part-7-Command/38-brigadier-basics.html",
                "title": "第38章 Brigadier 基础 —— Minecraft 命令解析的秘密武器",
                "part": "7",
                "partSuffix": "Command",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-7-Command\\38-brigadier-basics.md"
            },
            {
                "file": "Part-7-Command/39-custom-command",
                "htmlPath": "Part-7-Command/39-custom-command.html",
                "title": "第39章 自定义命令 —— 创建你的第一个命令",
                "part": "7",
                "partSuffix": "Command",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-7-Command\\39-custom-command.md"
            },
            {
                "file": "Part-7-Command/40-command-advanced",
                "htmlPath": "Part-7-Command/40-command-advanced.html",
                "title": "第40章 命令进阶 —— 条件执行、子命令与重定向",
                "part": "7",
                "partSuffix": "Command",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-7-Command\\40-command-advanced.md"
            },
            {
                "file": "Part-8-Resource/40-resource-pack",
                "htmlPath": "Part-8-Resource/40-resource-pack.html",
                "title": "40 - 资源包：游戏的外观与音效",
                "part": "8",
                "partSuffix": "Resource",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-8-Resource\\40-resource-pack.md"
            },
            {
                "file": "Part-8-Resource/41-datapack-intro",
                "htmlPath": "Part-8-Resource/41-datapack-intro.html",
                "title": "41 - 数据包：游戏数据定义",
                "part": "8",
                "partSuffix": "Resource",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-8-Resource\\41-datapack-intro.md"
            },
            {
                "file": "Part-8-Resource/42-loot-table",
                "htmlPath": "Part-8-Resource/42-loot-table.html",
                "title": "42 - 战利品表：掉落物定义",
                "part": "8",
                "partSuffix": "Resource",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-8-Resource\\42-loot-table.md"
            },
            {
                "file": "Part-8-Resource/43-advancement",
                "htmlPath": "Part-8-Resource/43-advancement.html",
                "title": "43 - 进度系统：成就与任务",
                "part": "8",
                "partSuffix": "Resource",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-8-Resource\\43-advancement.md"
            },
            {
                "file": "Part-8-Resource/44-recipe-system",
                "htmlPath": "Part-8-Resource/44-recipe-system.html",
                "title": "44 - 配方系统：物品合成",
                "part": "8",
                "partSuffix": "Resource",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-8-Resource\\44-recipe-system.md"
            },
            {
                "file": "Part-9-Client/45-minecraft-client",
                "htmlPath": "Part-9-Client/45-minecraft-client.html",
                "title": "第45章 Minecraft 客户端核心",
                "part": "9",
                "partSuffix": "Client",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-9-Client\\45-minecraft-client.md"
            },
            {
                "file": "Part-9-Client/46-render-system",
                "htmlPath": "Part-9-Client/46-render-system.html",
                "title": "第46章 渲染系统",
                "part": "9",
                "partSuffix": "Client",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-9-Client\\46-render-system.md"
            },
            {
                "file": "Part-9-Client/47-gui-system",
                "htmlPath": "Part-9-Client/47-gui-system.html",
                "title": "第47章 GUI系统",
                "part": "9",
                "partSuffix": "Client",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-9-Client\\47-gui-system.md"
            },
            {
                "file": "Part-9-Client/48-input-handling",
                "htmlPath": "Part-9-Client/48-input-handling.html",
                "title": "第48章 输入处理",
                "part": "9",
                "partSuffix": "Client",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\Part-9-Client\\48-input-handling.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Minecraft 1.21 源码萌新教程",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\tutorials\\README.md"
            }
        ],
        "analysis": [
            {
                "file": "01-architecture-overview",
                "htmlPath": "01-architecture-overview.html",
                "title": "Minecraft 1.21 架构总览",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\01-architecture-overview.md"
            },
            {
                "file": "02-client-module",
                "htmlPath": "02-client-module.html",
                "title": "Minecraft 1.21 客户端模块深度分析报告",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\02-client-module.md"
            },
            {
                "file": "03-server-module",
                "htmlPath": "03-server-module.html",
                "title": "Minecraft 1.21 服务端模块分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\03-server-module.md"
            },
            {
                "file": "04-world-system",
                "htmlPath": "04-world-system.html",
                "title": "Minecraft 1.21 世界系统深度分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\04-world-system.md"
            },
            {
                "file": "05-entity-system",
                "htmlPath": "05-entity-system.html",
                "title": "Minecraft 1.21 实体系统深度分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\05-entity-system.md"
            },
            {
                "file": "06-block-item-system",
                "htmlPath": "06-block-item-system.html",
                "title": "Minecraft 1.21 方块物品系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\06-block-item-system.md"
            },
            {
                "file": "07-network-protocol",
                "htmlPath": "07-network-protocol.html",
                "title": "Minecraft 1.21 网络协议分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\07-network-protocol.md"
            },
            {
                "file": "08-datafixer-system",
                "htmlPath": "08-datafixer-system.html",
                "title": "Minecraft 1.21 数据修复（DataFixer）系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\08-datafixer-system.md"
            },
            {
                "file": "09-registry-system",
                "htmlPath": "09-registry-system.html",
                "title": "Minecraft 1.21 注册表（Registry）系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\09-registry-system.md"
            },
            {
                "file": "10-package-structure",
                "htmlPath": "10-package-structure.html",
                "title": "Minecraft 1.21 包结构详解",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\10-package-structure.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Minecraft 1.21 源代码分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\README.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "Minecraft 1.21 源代码分析总结",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\mc\\1.21\\core\\-\\analysis\\SUMMARY.md"
            }
        ],
        "docCount": 88,
        "theme": "mc",
        "sourceUrl": null,
        "modVersion": null,
        "minecraftVersion": null,
        "loader": null
    },
    "neoforge": {
        "name": "NeoForge 模组",
        "slug": "neoforge",
        "icon": "hammer",
        "color": "#9B59B6",
        "colorGradient": "linear-gradient(135deg, #9B59B6 0%, #B370CF 100%)",
        "description": "NeoForge 模组开发框架详解",
        "versions": [
            "1.21-core--"
        ],
        "defaultVersion": "1.21-core--",
        "docsDir": "docs/neoforge",
        "tutorials": [
            {
                "file": "01-getting-started",
                "htmlPath": "01-getting-started.html",
                "title": "NeoForge 入门指南",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\01-getting-started.md"
            },
            {
                "file": "02-event-system",
                "htmlPath": "02-event-system.html",
                "title": "NeoForge 事件系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\02-event-system.md"
            },
            {
                "file": "part-1-getting-started/01-environment-setup",
                "htmlPath": "part-1-getting-started/01-environment-setup.html",
                "title": "NeoForge 1.21.x 环境搭建与第一个 Mod",
                "part": "1",
                "partSuffix": "getting-started",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-1-getting-started\\01-environment-setup.md"
            },
            {
                "file": "part-1-getting-started/02-registry-system",
                "htmlPath": "part-1-getting-started/02-registry-system.html",
                "title": "第二章：注册系统 - DeferredRegister 完全指南",
                "part": "1",
                "partSuffix": "getting-started",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-1-getting-started\\02-registry-system.md"
            },
            {
                "file": "part-1-getting-started/03-event-system",
                "htmlPath": "part-1-getting-started/03-event-system.html",
                "title": "NeoForge 事件系统完全指南",
                "part": "1",
                "partSuffix": "getting-started",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-1-getting-started\\03-event-system.md"
            },
            {
                "file": "part-2-blocks-items/01-blocks-and-items",
                "htmlPath": "part-2-blocks-items/01-blocks-and-items.html",
                "title": "方块与物品开发完全指南",
                "part": "2",
                "partSuffix": "blocks-items",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-2-blocks-items\\01-blocks-and-items.md"
            },
            {
                "file": "part-3-entities/01-entity-system",
                "htmlPath": "part-3-entities/01-entity-system.html",
                "title": "NeoForge 实体系统完全指南",
                "part": "3",
                "partSuffix": "entities",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-3-entities\\01-entity-system.md"
            },
            {
                "file": "part-4-networking/01-network-system",
                "htmlPath": "part-4-networking/01-network-system.html",
                "title": "NeoForge 网络通信完全指南",
                "part": "4",
                "partSuffix": "networking",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-4-networking\\01-network-system.md"
            },
            {
                "file": "part-5-world-gen/01-world-system",
                "htmlPath": "part-5-world-gen/01-world-system.html",
                "title": "NeoForge 世界生成与区块系统",
                "part": "5",
                "partSuffix": "world-gen",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-5-world-gen\\01-world-system.md"
            },
            {
                "file": "part-6-recipes/01-recipe-system",
                "htmlPath": "part-6-recipes/01-recipe-system.html",
                "title": "NeoForge 配方与酿造系统",
                "part": "6",
                "partSuffix": "recipes",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-6-recipes\\01-recipe-system.md"
            },
            {
                "file": "part-7-config/01-config-system",
                "htmlPath": "part-7-config/01-config-system.html",
                "title": "NeoForge 配置系统完全指南",
                "part": "7",
                "partSuffix": "config",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-7-config\\01-config-system.md"
            },
            {
                "file": "part-8-projects/01-magic-crystal",
                "htmlPath": "part-8-projects/01-magic-crystal.html",
                "title": "魔法水晶方块 - NeoForge 实战项目",
                "part": "8",
                "partSuffix": "projects",
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\part-8-projects\\01-magic-crystal.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "NeoForge 1.21.x 模组开发教程",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\tutorials\\README.md"
            }
        ],
        "analysis": [
            {
                "file": "01-architecture",
                "htmlPath": "01-architecture.html",
                "title": "NeoForge 架构解析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\01-architecture.md"
            },
            {
                "file": "01-registry-event-system",
                "htmlPath": "01-registry-event-system.html",
                "title": "注册与事件系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\01-registry-event-system.md"
            },
            {
                "file": "02-capability-transfer-system",
                "htmlPath": "02-capability-transfer-system.html",
                "title": "能力与传输系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\02-capability-transfer-system.md"
            },
            {
                "file": "03-attachment-system",
                "htmlPath": "03-attachment-system.html",
                "title": "附件系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\03-attachment-system.md"
            },
            {
                "file": "04-network-system",
                "htmlPath": "04-network-system.html",
                "title": "网络系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\04-network-system.md"
            },
            {
                "file": "05-resource-data-system",
                "htmlPath": "05-resource-data-system.html",
                "title": "资源与数据系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\05-resource-data-system.md"
            },
            {
                "file": "06-world-chunk-system",
                "htmlPath": "06-world-chunk-system.html",
                "title": "世界与区块系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\06-world-chunk-system.md"
            },
            {
                "file": "07-entity-living-system",
                "htmlPath": "07-entity-living-system.html",
                "title": "实体与生物系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\07-entity-living-system.md"
            },
            {
                "file": "08-fluid-item-system",
                "htmlPath": "08-fluid-item-system.html",
                "title": "流体与物品系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\08-fluid-item-system.md"
            },
            {
                "file": "09-energy-system",
                "htmlPath": "09-energy-system.html",
                "title": "能量系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\09-energy-system.md"
            },
            {
                "file": "10-client-system",
                "htmlPath": "10-client-system.html",
                "title": "客户端系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\10-client-system.md"
            },
            {
                "file": "11-common-extensions-utils",
                "htmlPath": "11-common-extensions-utils.html",
                "title": "通用扩展与工具",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\11-common-extensions-utils.md"
            },
            {
                "file": "12-config-server-system",
                "htmlPath": "12-config-server-system.html",
                "title": "配置与服务器系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\12-config-server-system.md"
            },
            {
                "file": "13-recipe-brewing-system",
                "htmlPath": "13-recipe-brewing-system.html",
                "title": "配方与酿造系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\13-recipe-brewing-system.md"
            },
            {
                "file": "14-datamap-holdersets",
                "htmlPath": "14-datamap-holdersets.html",
                "title": "数据映射与 Holder 集合",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\14-datamap-holdersets.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "NeoForge 1.21.x 架构分析总结",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-core--",
                "fullPath": "D:\\Minecraft-Learning\\content\\neoforge\\1.21\\core\\-\\analysis\\SUMMARY.md"
            }
        ],
        "docCount": 29,
        "theme": "neoforge",
        "sourceUrl": null,
        "modVersion": null,
        "minecraftVersion": null,
        "loader": null
    },
    "sodium": {
        "name": "Sodium 优化",
        "slug": "sodium",
        "icon": "bolt",
        "color": "#1ABC9C",
        "colorGradient": "linear-gradient(135deg, #1ABC9C 0%, #48C9B0 100%)",
        "description": "Sodium 现代渲染优化与架构设计",
        "versions": [
            "1.21-neoforge-0.8.6",
            "1.21-fabric-0.8.6"
        ],
        "defaultVersion": "1.21-neoforge-0.8.6",
        "docsDir": "docs/sodium",
        "tutorials": [
            {
                "file": "01-mod-dev-intro",
                "htmlPath": "01-mod-dev-intro.html",
                "title": "第一章：Mod 开发入门",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\01-mod-dev-intro.md"
            },
            {
                "file": "03-multithreading-basics",
                "htmlPath": "03-multithreading-basics.html",
                "title": "第二章：多线程编程",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\03-multithreading-basics.md"
            },
            {
                "file": "Part-0/01-rendering-prerequisites",
                "htmlPath": "Part-0/01-rendering-prerequisites.html",
                "title": "渲染优化入门",
                "part": "0",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\Part-0\\01-rendering-prerequisites.md"
            },
            {
                "file": "Part-1/01-sodium-intro",
                "htmlPath": "Part-1/01-sodium-intro.html",
                "title": "第一章：Sodium 简介与架构概述",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\Part-1\\01-sodium-intro.md"
            },
            {
                "file": "Part-1/02-chunk-render",
                "htmlPath": "Part-1/02-chunk-render.html",
                "title": "第二章：区块渲染系统（Chunk Render System）",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\Part-1\\02-chunk-render.md"
            },
            {
                "file": "Part-1/03-occlusion-culling",
                "htmlPath": "Part-1/03-occlusion-culling.html",
                "title": "遮挡剔除算法",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\Part-1\\03-occlusion-culling.md"
            },
            {
                "file": "Part-1/04-render-pipeline",
                "htmlPath": "Part-1/04-render-pipeline.html",
                "title": "第四章：渲染管线与批处理",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\Part-1\\04-render-pipeline.md"
            },
            {
                "file": "Part-2/01-mixin-basics",
                "htmlPath": "Part-2/01-mixin-basics.html",
                "title": "Mixin 注入基础",
                "part": "2",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\Part-2\\01-mixin-basics.md"
            },
            {
                "file": "Part-2/02-performance-practice",
                "htmlPath": "Part-2/02-performance-practice.html",
                "title": "第二章：性能优化实战",
                "part": "2",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\Part-2\\02-performance-practice.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Sodium 教程索引",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\tutorials\\README.md"
            },
            {
                "file": "01-mod-dev-intro",
                "htmlPath": "01-mod-dev-intro.html",
                "title": "第一章：Mod 开发入门",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\01-mod-dev-intro.md"
            },
            {
                "file": "03-multithreading-basics",
                "htmlPath": "03-multithreading-basics.html",
                "title": "第二章：多线程编程",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\03-multithreading-basics.md"
            },
            {
                "file": "Part-0/01-rendering-prerequisites",
                "htmlPath": "Part-0/01-rendering-prerequisites.html",
                "title": "渲染优化入门",
                "part": "0",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\Part-0\\01-rendering-prerequisites.md"
            },
            {
                "file": "Part-1/01-sodium-intro",
                "htmlPath": "Part-1/01-sodium-intro.html",
                "title": "第一章：Sodium 简介与架构概述",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\Part-1\\01-sodium-intro.md"
            },
            {
                "file": "Part-1/02-chunk-render",
                "htmlPath": "Part-1/02-chunk-render.html",
                "title": "第二章：区块渲染系统（Chunk Render System）",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\Part-1\\02-chunk-render.md"
            },
            {
                "file": "Part-1/03-occlusion-culling",
                "htmlPath": "Part-1/03-occlusion-culling.html",
                "title": "遮挡剔除算法",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\Part-1\\03-occlusion-culling.md"
            },
            {
                "file": "Part-1/04-render-pipeline",
                "htmlPath": "Part-1/04-render-pipeline.html",
                "title": "第四章：渲染管线与批处理",
                "part": "1",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\Part-1\\04-render-pipeline.md"
            },
            {
                "file": "Part-2/01-mixin-basics",
                "htmlPath": "Part-2/01-mixin-basics.html",
                "title": "Mixin 注入基础",
                "part": "2",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\Part-2\\01-mixin-basics.md"
            },
            {
                "file": "Part-2/02-performance-practice",
                "htmlPath": "Part-2/02-performance-practice.html",
                "title": "第二章：性能优化实战",
                "part": "2",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\Part-2\\02-performance-practice.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Sodium 教程索引",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\tutorials\\README.md"
            }
        ],
        "analysis": [
            {
                "file": "01-architecture-overview",
                "htmlPath": "01-architecture-overview.html",
                "title": "Sodium 架构概述",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\01-architecture-overview.md"
            },
            {
                "file": "02-chunk-render-system",
                "htmlPath": "02-chunk-render-system.html",
                "title": "Sodium 区块渲染系统 (Chunk Render System)",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\02-chunk-render-system.md"
            },
            {
                "file": "03-occlusion-culling",
                "htmlPath": "03-occlusion-culling.html",
                "title": "Sodium 遮挡剔除系统 (Occlusion Culling)",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\03-occlusion-culling.md"
            },
            {
                "file": "04-render-pipeline",
                "htmlPath": "04-render-pipeline.html",
                "title": "Sodium 渲染管线",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\04-render-pipeline.md"
            },
            {
                "file": "05-shader-system",
                "htmlPath": "05-shader-system.html",
                "title": "Sodium 着色器系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\05-shader-system.md"
            },
            {
                "file": "06-platform-integration",
                "htmlPath": "06-platform-integration.html",
                "title": "Sodium 平台集成 (Platform Integration)",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\06-platform-integration.md"
            },
            {
                "file": "07-mixin-injection",
                "htmlPath": "07-mixin-injection.html",
                "title": "Sodium Mixin 注入机制分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\07-mixin-injection.md"
            },
            {
                "file": "08-configuration-system",
                "htmlPath": "08-configuration-system.html",
                "title": "Sodium 配置系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\08-configuration-system.md"
            },
            {
                "file": "09-performance-optimization",
                "htmlPath": "09-performance-optimization.html",
                "title": "性能优化技术",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\09-performance-optimization.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Sodium 源代码分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\README.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "Sodium 分析总结",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-neoforge-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\neoforge\\0.8.6\\analysis\\SUMMARY.md"
            },
            {
                "file": "01-architecture-overview",
                "htmlPath": "01-architecture-overview.html",
                "title": "Sodium 架构概述",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\01-architecture-overview.md"
            },
            {
                "file": "02-chunk-render-system",
                "htmlPath": "02-chunk-render-system.html",
                "title": "Sodium 区块渲染系统 (Chunk Render System)",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\02-chunk-render-system.md"
            },
            {
                "file": "03-occlusion-culling",
                "htmlPath": "03-occlusion-culling.html",
                "title": "Sodium 遮挡剔除系统 (Occlusion Culling)",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\03-occlusion-culling.md"
            },
            {
                "file": "04-render-pipeline",
                "htmlPath": "04-render-pipeline.html",
                "title": "Sodium 渲染管线",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\04-render-pipeline.md"
            },
            {
                "file": "05-shader-system",
                "htmlPath": "05-shader-system.html",
                "title": "Sodium 着色器系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\05-shader-system.md"
            },
            {
                "file": "06-platform-integration",
                "htmlPath": "06-platform-integration.html",
                "title": "Sodium 平台集成 (Platform Integration)",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\06-platform-integration.md"
            },
            {
                "file": "07-mixin-injection",
                "htmlPath": "07-mixin-injection.html",
                "title": "Sodium Mixin 注入机制分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\07-mixin-injection.md"
            },
            {
                "file": "08-configuration-system",
                "htmlPath": "08-configuration-system.html",
                "title": "Sodium 配置系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\08-configuration-system.md"
            },
            {
                "file": "09-performance-optimization",
                "htmlPath": "09-performance-optimization.html",
                "title": "性能优化技术",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\09-performance-optimization.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Sodium 源代码分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\README.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "Sodium 分析总结",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21-fabric-0.8.6",
                "fullPath": "D:\\Minecraft-Learning\\content\\sodium\\1.21\\fabric\\0.8.6\\analysis\\SUMMARY.md"
            }
        ],
        "docCount": 42,
        "theme": "sodium",
        "sourceUrl": null,
        "modVersion": null,
        "minecraftVersion": null,
        "loader": null
    },
    "voxy": {
        "name": "Voxy",
        "slug": "voxy",
        "icon": "voxel",
        "color": "#5B8C5A",
        "colorGradient": "linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)",
        "description": "Voxy 远距离 LOD 与体素化渲染模组架构解析",
        "versions": [
            "1.21.11-fabric-0.2.13-alpha"
        ],
        "defaultVersion": "1.21.11-fabric-0.2.13-alpha",
        "docsDir": "docs/voxy",
        "tutorials": [
            {
                "file": "Part-0-Prerequisites/01-voxy-intro",
                "htmlPath": "Part-0-Prerequisites/01-voxy-intro.html",
                "title": "\"走近 Voxy：LOD 远距离渲染\"",
                "part": "0",
                "partSuffix": "Prerequisites",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-0-Prerequisites\\01-voxy-intro.md"
            },
            {
                "file": "Part-1-Foundation/01-world-engine-basics",
                "htmlPath": "Part-1-Foundation/01-world-engine-basics.html",
                "title": "\"WorldEngine：世界引擎基础\"",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-1-Foundation\\01-world-engine-basics.md"
            },
            {
                "file": "Part-1-Foundation/02-voxelized-section",
                "htmlPath": "Part-1-Foundation/02-voxelized-section.html",
                "title": "\"VoxelizedSection：体素化区块数据结构\"",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-1-Foundation\\02-voxelized-section.md"
            },
            {
                "file": "Part-1-Foundation/03-lod-system",
                "htmlPath": "Part-1-Foundation/03-lod-system.html",
                "title": "\"LOD 系统详解：从区块到多远距离\"",
                "part": "1",
                "partSuffix": "Foundation",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-1-Foundation\\03-lod-system.md"
            },
            {
                "file": "Part-2-Core-Mechanisms/01-thread-model",
                "htmlPath": "Part-2-Core-Mechanisms/01-thread-model.html",
                "title": "\"线程模型与异步任务调度\"",
                "part": "2",
                "partSuffix": "Core-Mechanisms",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-2-Core-Mechanisms\\01-thread-model.md"
            },
            {
                "file": "Part-2-Core-Mechanisms/02-rendering-pipeline",
                "htmlPath": "Part-2-Core-Mechanisms/02-rendering-pipeline.html",
                "title": "\"渲染管线：从 GPU 检测到批量绘制\"",
                "part": "2",
                "partSuffix": "Core-Mechanisms",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-2-Core-Mechanisms\\02-rendering-pipeline.md"
            },
            {
                "file": "Part-3-Advanced/01-mixin-integration",
                "htmlPath": "Part-3-Advanced/01-mixin-integration.html",
                "title": "\"Mixin 集成与模组兼容性\"",
                "part": "3",
                "partSuffix": "Advanced",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-3-Advanced\\01-mixin-integration.md"
            },
            {
                "file": "Part-3-Advanced/02-storage-system",
                "htmlPath": "Part-3-Advanced/02-storage-system.html",
                "title": "\"存储系统：RocksDB 与数据持久化\"",
                "part": "3",
                "partSuffix": "Advanced",
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\Part-3-Advanced\\02-storage-system.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "\"Voxy 教程\"",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\README.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "\"Voxy 教程总结\"",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\tutorials\\SUMMARY.md"
            }
        ],
        "analysis": [
            {
                "file": "01-architecture-overview",
                "htmlPath": "01-architecture-overview.html",
                "title": "Voxy Architecture Overview",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\01-architecture-overview.md"
            },
            {
                "file": "02-world-engine",
                "htmlPath": "02-world-engine.html",
                "title": "Voxy 世界引擎子系统",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\02-world-engine.md"
            },
            {
                "file": "03-voxelization-system",
                "htmlPath": "03-voxelization-system.html",
                "title": "Voxy 体素化子系统深度解析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\03-voxelization-system.md"
            },
            {
                "file": "04-storage-persistence",
                "htmlPath": "04-storage-persistence.html",
                "title": "Voxy 持久化存储子系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\04-storage-persistence.md"
            },
            {
                "file": "05-thread-service",
                "htmlPath": "05-thread-service.html",
                "title": "Voxy 线程与服务子系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\05-thread-service.md"
            },
            {
                "file": "06-rendering-core",
                "htmlPath": "06-rendering-core.html",
                "title": "Voxy 渲染核心子系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\06-rendering-core.md"
            },
            {
                "file": "07-world-importers",
                "htmlPath": "07-world-importers.html",
                "title": "Voxy 世界数据导入子系统分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\07-world-importers.md"
            },
            {
                "file": "08-config-system",
                "htmlPath": "08-config-system.html",
                "title": "Voxy 配置系统架构分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\08-config-system.md"
            },
            {
                "file": "README",
                "htmlPath": "README.html",
                "title": "Voxy 架构分析",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\README.md"
            },
            {
                "file": "SUMMARY",
                "htmlPath": "SUMMARY.html",
                "title": "Voxy 架构分析总结",
                "part": "Other",
                "partSuffix": null,
                "version": "1.21.11-fabric-0.2.13-alpha",
                "fullPath": "D:\\Minecraft-Learning\\content\\voxy\\1.21.11-fabric-0.2.13-alpha\\analysis\\SUMMARY.md"
            }
        ],
        "docCount": 20,
        "theme": "voxy",
        "sourceUrl": "https://github.com/MCRcortex/voxy",
        "modVersion": "0.2.13-alpha",
        "minecraftVersion": "1.21.11",
        "loader": "fabric"
    }
};

module.exports = { autoModules };
