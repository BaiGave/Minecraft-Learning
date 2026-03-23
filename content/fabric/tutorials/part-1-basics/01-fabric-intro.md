# 第一章：Fabric 简介

> 这一章介绍 Fabric API 的基本概念，帮助你理解如何使用 Fabric 进行开发。

---

## 目录

1. [Fabric API 是什么？](#1-fabric-api-是什么)
2. [Fabric API 能做什么？](#2-fabric-api-能做什么)
3. [API 版本和兼容性](#3-api-版本和兼容性)
4. [Fabric 模块一览](#4-fabric-模块一览)
5. [常用 API 快速参考](#5-常用-api-快速参考)

---

## 1. Fabric API 是什么？

### 1.1 定义

Fabric API 是 Fabric 官方提供的开发工具库，为 Mod 开发者提供了大量现成的功能和接口。

```
没有 Fabric API 时：
┌─────────────────┐
│ 你想创建一个物品？│
│ 需要自己写代码    │
│ 直接操作注册表     │  ← 很复杂，容易出错
│ 写 100 行代码    │
└─────────────────┘

有了 Fabric API 后：
┌─────────────────┐
│ 你想创建一个物品？│
│ 调用 Fabric 提供的 API
│ Registry.register() │  ← 简单，5 行代码
│ 完成！             │
└─────────────────┘
```

### 1.2 Fabric API vs 纯 Mixin

| 方式 | 优点 | 缺点 |
|------|------|------|
| **纯 Mixin** | 功能强大，灵活 | 需要深入了解游戏代码，容易出错 |
| **Fabric API** | 简单易用，稳定可靠 | 可能没有覆盖所有功能 |

**建议**：优先使用 Fabric API，只有当 API 不满足需求时才考虑使用 Mixin。

---

## 2. Fabric API 能做什么？

### 2.1 主要功能分类

```
Fabric API 提供的能力：

┌──────────────────────────────────────────────────────────────┐
│                         世界生成                               │
│  • 创建新方块、物品、生物群系                                   │
│  • 添加矿石、地形、植被                                        │
│  • 控制生物生成规则                                            │
├────────────────────────────────────────────────────────────┤
│                         实体系统                               │
│  • 创建新实体、生物                                            │
│  • 监听实体事件（生成、死亡、攻击）                            │
│  • 实体属性（生命值、攻击力等）                                │
├────────────────────────────────────────────────────────────┤
│                         交互系统                               │
│  • 方块交互事件                                               │
│  • 物品使用事件                                               │
│  • 自定义命令                                                 │
├────────────────────────────────────────────────────────────┤
│                         渲染系统                               │
│  • 自定义粒子效果                                             │
│  • 自定义方块渲染                                             │
│  • 流体渲染扩展                                               │
├────────────────────────────────────────────────────────────┤
│                         网络系统                               │
│  • 客户端-服务端通信                                          │
│  • 自定义数据包                                               │
│  • 玩家数据同步                                               │
├────────────────────────────────────────────────────────────┤
│                         数据系统                               │
│  • 自动生成配方、战利品表、标签                               │
│  • 数据包条件                                                 │
│  • 注册表同步                                                 │
└────────────────────────────────────────────────────────────┘
```

### 2.2 常用场景示例

| 场景 | 使用哪个 API |
|------|-------------|
| 创建新方块 | `fabric-block-api-v1` |
| 创建新物品 | `fabric-item-api-v1` |
| 添加新矿石 | `fabric-biome-api-v1` |
| 创建新生物 | `fabric-object-builder-api-v1` |
| 监听玩家加入 | `fabric-entity-events-v1` |
| 创建自定义粒子 | `fabric-particles-v1` |
| 服务端-客户端通信 | `fabric-networking-api-v1` |
| 创建自定义命令 | `fabric-command-api-v2` |
| 修改 GUI 界面 | `fabric-screen-api-v1` |
| 创建流体存储 | `fabric-transfer-api-v1` |

---

## 3. API 版本和兼容性

### 3.1 版本号格式

Fabric API 的版本号遵循以下格式：

```
fabric-<模块名>-<版本>

示例：
fabric-api-base-1.0.0
fabric-item-api-v1-1.0.0

版本号含义：
├── 1.0.0        正式版
├── 0.116.9-1.21.1  测试版（API版本-兼容的游戏版本）
└── 0.1.0+1.21    实验版
```

### 3.2 版本稳定性标记

| 标记 | 含义 | 稳定性 |
|------|------|--------|
| `stable` | 稳定版 | ✅ 可在生产环境使用 |
| `experimental` | 实验版 | ⚠️ 可能有变化 |
| `deprecated` | 废弃版 | ❌ 不推荐使用 |

### 3.3 Minecraft 版本兼容性

```
Minecraft 1.21+  →  Fabric API 0.116.x
Minecraft 1.20.x →  Fabric API 0.100.x
Minecraft 1.19.x →  Fabric API 0.83.x
```

**注意**：不同版本的 API 不能混用！

---

## 4. Fabric 模块一览

### 4.1 核心模块

| 模块 | 说明 | 必需？ |
|------|------|--------|
| `fabric-api-base` | 事件系统、工具类、拓扑排序 | ✅ 是 |
| `fabric-convention-tags-v2` | 约定标签系统 | 推荐 |

### 4.2 世界生成模块

| 模块 | 说明 |
|------|------|
| `fabric-biome-api-v1` | 生物群系添加和修改 |
| `fabric-dimensions-v1` | 维度数据处理 |

### 4.3 实体/物品模块

| 模块 | 说明 |
|------|------|
| `fabric-entity-events-v1` | 实体事件监听 |
| `fabric-item-api-v1` | 物品扩展 |
| `fabric-item-group-api-v1` | 创意物品栏 |
| `fabric-recipe-api-v1` | 配方系统 |
| `fabric-object-builder-api-v1` | 对象构建器 |

### 4.4 渲染模块

| 模块 | 说明 |
|------|------|
| `fabric-renderer-api-v1` | 渲染器 API |
| `fabric-renderer-indigo` | 默认渲染器实现 |
| `fabric-rendering-v1` | 渲染事件 |
| `fabric-rendering-fluids-v1` | 流体渲染 |
| `fabric-particles-v1` | 粒子系统 |
| `fabric-client-tags-api-v1` | 客户端标签 |

### 4.5 交互模块

| 模块 | 说明 |
|------|------|
| `fabric-events-interaction-v0` | 交互事件 |
| `fabric-command-api-v2` | 命令 API |
| `fabric-screen-api-v1` | 屏幕 API |
| `fabric-screen-handler-api-v1` | 屏幕处理器 |
| `fabric-key-binding-api-v1` | 按键绑定 |

### 4.6 网络模块

| 模块 | 说明 |
|------|------|
| `fabric-networking-api-v1` | 网络通信 |
| `fabric-message-api-v1` | 消息 API |

### 4.7 数据模块

| 模块 | 说明 |
|------|------|
| `fabric-transfer-api-v1` | 流体/物品传输 |
| `fabric-data-attachment-api-v1` | 数据附件 |
| `fabric-loot-api-v3` | 战利品表 |
| `fabric-registry-sync-v0` | 注册表同步 |

### 4.8 资源模块

| 模块 | 说明 |
|------|------|
| `fabric-resource-loader-v0` | 资源加载 |
| `fabric-resource-conditions-api-v1` | 资源条件 |

### 4.9 其他模块

| 模块 | 说明 |
|------|------|
| `fabric-gametest-api-v1` | 游戏测试 |
| `fabric-sound-api-v1` | 声音 API |
| `fabric-api-lookup-api-v1` | API 查找 |

---

## 5. 常用 API 快速参考

### 5.1 依赖添加

在 `build.gradle` 中添加依赖：

```groovy
dependencies {
    modImplementation "net.fabricmc:fabric-api:${project.fabric_version}"
}
```

### 5.2 常用导入

```java
// 注册
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

// 事件
import net.fabricmc.fabric.api.event.Event;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;

// 物品
import net.fabricmc.fabric.api.item.v1.FabricItemSettings;

// 方块
import net.fabricmc.fabric.api.block.v1.FabricBlock;

// 命令
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;

// 网络
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
```

### 5.3 常用方法速查

| 操作 | 代码 |
|------|------|
| 注册方块 | `Registry.register(Registries.BLOCK, id, block)` |
| 注册物品 | `Registry.register(Registries.ITEM, id, item)` |
| 监听事件 | `Event.register(callback)` |
| 发送网络包 | `ServerPlayNetworking.send(player, packet)` |
| 注册命令 | `CommandRegistrationCallback.EVENT.register(...)` |

---

## 下一步

现在你了解了 Fabric API 的基本概念！接下来：
- [Mod 项目结构](./02-mod-structure.md) - 了解代码组织方式
- [事件系统入门](./03-event-system.md) - 学习如何使用事件

---

*参考：[Fabric API 源码分析](../analysis/)* - 深入了解每个 API 的实现细节
