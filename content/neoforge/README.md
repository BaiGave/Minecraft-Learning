# NeoForge 模组开发

模块 ID: `neoforge`

## 目录结构

```
neoforge/
├── tutorials/                         # 入门教程与实战指南
│   └── part-1-getting-started/        # 第一部分：入门
│       └── 01-environment-setup.md   # 环境搭建与第一个 Mod
└── analysis/                          # 源码架构解析
    ├── 01-registry-event-system.md        # 注册与事件系统
    ├── 02-capability-transfer-system.md   # 能力与传输系统
    ├── 03-attachment-system.md            # 附件系统
    ├── 04-network-system.md                # 网络系统
    ├── 05-resource-data-system.md         # 资源与数据系统
    ├── 06-world-chunk-system.md           # 世界与区块系统
    ├── 07-entity-living-system.md         # 实体与生物系统
    ├── 08-fluid-item-system.md            # 流体与物品系统
    ├── 09-energy-system.md                # 能量系统
    ├── 10-client-system.md                # 客户端系统
    ├── 11-common-extensions-utils.md       # 通用扩展与工具
    ├── 12-config-server-system.md         # 配置与服务器系统
    ├── 13-recipe-brewing-system.md        # 配方与酿造系统
    ├── 14-datamap-holdersets.md           # 数据映射与 Holder 集合
    ├── 01-architecture.md                 # 架构概览（原有）
    └── SUMMARY.md                         # 分析总结索引
```

## 分析文档说明

本目录包含对 **NeoForge 1.21.x** 源码的完整架构分析，基于 `assets/NeoForge-1.21.x/src` 中的 862 个 Java 源文件。

### 快速导航

| 分类 | 文档 | 说明 |
|------|------|------|
| 核心系统 | [注册与事件系统](./analysis/01-registry-event-system.md) | DeferredRegister、EventBus、事件订阅 |
| 核心系统 | [能力与传输系统](./analysis/02-capability-transfer-system.md) | Capability、Transfer API |
| 核心系统 | [附件系统](./analysis/03-attachment-system.md) | AttachmentType、网络同步 |
| 网络通信 | [网络系统](./analysis/04-network-system.md) | PayloadRegistrar、网络通道 |
| 数据生成 | [资源与数据系统](./analysis/05-resource-data-system.md) | DataGenerator、DataPack |
| 世界管理 | [世界与区块系统](./analysis/06-world-chunk-system.md) | ChunkEvent、BiomeModifier |
| 实体系统 | [实体与生物系统](./analysis/07-entity-living-system.md) | EntityEvent、LivingEvent |
| 游戏内容 | [流体与物品系统](./analysis/08-fluid-item-system.md) | FluidType、ItemStackHandler |
| 游戏内容 | [能量系统](./analysis/09-energy-system.md) | EnergyStorage、Transaction |
| 客户端 | [客户端系统](./analysis/10-client-system.md) | 渲染、粒子、输入 |
| 工具系统 | [通用扩展与工具](./analysis/11-common-extensions-utils.md) | 扩展接口、工具类 |
| 工具系统 | [配置与服务器系统](./analysis/12-config-server-system.md) | ModConfig、PermissionAPI |
| 游戏机制 | [配方与酿造系统](./analysis/13-recipe-brewing-system.md) | 自定义成分、酿造配方 |
| 数据结构 | [数据映射与 Holder 集合](./analysis/14-datamap-holdersets.md) | DataMap、HolderSet |

### 完整索引

查看 [分析总结](./analysis/SUMMARY.md) 获取子系统依赖关系、核心设计模式和学习路径建议。

## 教程文档

### 第一部分：入门

| 章节 | 文档 | 说明 |
|------|------|------|
| 01 | [环境搭建与第一个 Mod](./tutorials/part-1-getting-started/01-environment-setup.md) | JDK + IDEA + Gradle + @Mod |

### 快速导航

- [tutorials/](./tutorials/) - 完整的入门教程列表

## 适用版本

**NeoForge 1.21.x** | Minecraft 1.21+

## 参考资源

- [NeoForge 官方文档](https://docs.neoforged.net/)
- [NeoForge GitHub](https://github.com/neoforged/NeoForge)
- [源码路径](../assets/NeoForge-1.21.x/src)
