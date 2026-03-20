# Minecraft 1.21 源代码分析

> 基于 CFR 0.2.2 反编译源代码的完整分析报告

## 项目信息

| 属性 | 值 |
|------|-----|
| 游戏版本 | Minecraft 1.21 |
| 协议版本 | Protocol 767 |
| 世界版本 | World Version 3953 |
| 资源包版本 | Resource Pack 34 |
| 数据包版本 | Data Pack 48 |
| 反编译器 | CFR 0.2.2 (FabricMC) |
| Java 文件数 | 5364 个 |
| 源码路径 | `..../source/` |

## 文档目录

### 架构分析

| 文档 | 说明 |
|------|------|
| [01-architecture-overview.md](01-architecture-overview.md) | 整体架构设计模式、模块划分、核心设计原则 |
| [10-package-structure.md](10-package-structure.md) | 完整包结构详细文档 |

### 模块分析

| 文档 | 说明 |
|------|------|
| [02-client-module.md](02-client-module.md) | 客户端模块 - 渲染、GUI、输入、网络 |
| [03-server-module.md](03-server-module.md) | 服务端模块 - 服务器生命周期、玩家管理、世界管理 |

### 系统分析

| 文档 | 说明 |
|------|------|
| [04-world-system.md](04-world-system.md) | 世界系统 - 区块、生物群系、光照、生成 |
| [05-entity-system.md](05-entity-system.md) | 实体系统 - 实体基类、AI大脑、属性 |
| [06-block-item-system.md](06-block-item-system.md) | 方块物品系统 - 方块、物品、方块实体 |
| [07-network-protocol.md](07-network-protocol.md) | 网络协议 - 数据包、协议状态机 |
| [08-datafixer-system.md](08-datafixer-system.md) | 数据修复系统 - 版本迁移、NBT转换 |
| [09-registry-system.md](09-registry-system.md) | 注册表系统 - 资源定位符、标签 |

### 总结

| 文档 | 说明 |
|------|------|
| [SUMMARY.md](SUMMARY.md) | 整体总结 - 核心要点、架构图、技术栈 |

## 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Minecraft 1.21                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │        Client            │  │          Server              │ │
│  │   net.minecraft.client    │  │    net.minecraft.server      │ │
│  ├──────────────────────────┤  ├──────────────────────────────┤ │
│  │  - MinecraftClient        │  │  - MinecraftServer           │ │
│  │  - GameRenderer           │  │  - PlayerManager             │ │
│  │  - ClientPlayHandler      │  │  - ServerWorld              │ │
│  │  - ClientPlayerEntity     │  │  - IntegratedServer          │ │
│  └────────────┬─────────────┘  └──────────────┬───────────────┘ │
│               │                                │                 │
│               │        Protocol 767            │                 │
│               └───────────────┬────────────────┘                 │
│                               │                                  │
├───────────────────────────────┼──────────────────────────────────┤
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Core Systems                            │  │
│  ├──────────────┬──────────────┬───────────────┬──────────────┤  │
│  │   World      │   Entity     │   Registry    │   Network    │  │
│  │   System    │   System     │   System      │   Protocol   │  │
│  ├──────────────┼──────────────┼───────────────┼──────────────┤  │
│  │   Block     │   Item       │   Command     │   DataFixer  │  │
│  │   System    │   System     │   System      │   System     │  │
│  └──────────────┴──────────────┴───────────────┴──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## 核心设计模式

1. **客户端-服务端分离** - 服务端权威，客户端渲染
2. **注册表模式** - 统一管理所有游戏内容
3. **观察者模式** - 事件系统解耦
4. **组件模式** - Item/Entity 使用 ComponentMap
5. **策略模式** - 方块状态和渲染行为

## 关键版本常量

| 常量 | 值 | 说明 |
|------|-----|------|
| WORLD_VERSION | 3953 | 世界数据版本 |
| PROTOCOL_VERSION | 767 | 网络协议版本 |
| TICKS_PER_SECOND | 20 | 游戏刻每秒 |
| CHUNK_WIDTH | 16 | 区块宽度 |
| DEFAULT_WORLD_HEIGHT | 256 | 默认世界高度 |
| TICKS_PER_IN_GAME_DAY | 24000 | 游戏日内刻数 |

## 源码统计

```
..../source/
├── net.minecraft/          # 主要命名空间
│   ├── client/             # 客户端专用 (~500 文件)
│   ├── server/             # 服务端专用 (~200 文件)
│   ├── world/              # 世界系统 (~150 文件)
│   ├── entity/             # 实体系统 (~200 文件)
│   ├── block/              # 方块系统 (~300 文件)
│   ├── item/               # 物品系统 (~150 文件)
│   ├── network/            # 网络协议 (~100 文件)
│   └── [其他模块]          # (~2764 文件)
├── com/                    # 第三方库 (Gson, JOML, brigadier)
└── META-INF/               # 元数据
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 语言 | Java 21 |
| 网络 | Netty |
| 命令解析 | Brigadier |
| 日志 | SLF4J + Log4j2 |
| JSON | Gson |
| 数学库 | JOML |
| 构建 | Yarn (反混淆映射) |

## 使用说明

这些文档旨在帮助理解 Minecraft 1.21 的内部工作原理。代码引用使用 CFR 反编译器保留的命名风格。

---
*生成时间: 2026-03-19*
*由 Cursor Agent Team 自动分析生成*
