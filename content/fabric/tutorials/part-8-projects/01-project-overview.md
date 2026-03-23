# 第一章：项目概览 - 魔法水晶 mod

> 在这一章中，我们将了解整个实战项目的目标和规划。

---

## 目录

1. [项目背景](#1-项目背景)
2. [我们要做什么](#2-我们要做什么)
3. [项目架构](#3-项目架构)
4. [技术要点](#4-技术要点)
5. [准备工作](#5-准备工作)

---

## 1. 项目背景

### 1.1 为什么做实战项目？

在之前的教程中，我们学习了 Fabric 的各种基础知识：
- 如何创建方块和物品
- 如何处理玩家交互
- 如何创建自定义实体
- 如何实现网络通信

但是，这些知识是分散的。在这一部分，我们将把所有知识结合起来，从零开始创建一个**完整的、功能丰富的 mod**。

### 1.2 项目的目标

完成这个系列后，你将拥有一个包含以下内容的完整 mod：

```
┌─────────────────────────────────────────────────────┐
│              魔法水晶 mod (Magic Crystals)              │
├─────────────────────────────────────────────────────┤
│  模块一：魔法水晶                                     │
│  ├── 自定义发光方块                                   │
│  ├── 可收集的魔法水晶物品                             │
│  └── 方块交互功能                                    │
├─────────────────────────────────────────────────────┤
│  模块二：魔法棒                                       │
│  ├── 自定义特殊物品                                   │
│  ├── 右键发射魔法弹                                   │
│  ├── 客户端-服务端网络通信                           │
│  └── 粒子效果                                        │
├─────────────────────────────────────────────────────┤
│  模块三：魔法生物                                     │
│  ├── 自定义实体                                      │
│  ├── 自定义 AI 行为                                  │
│  ├── 实体属性                                        │
│  └── 与物品交互                                      │
└─────────────────────────────────────────────────────┘
```

---

## 2. 我们要做什么

### 2.1 项目一：魔法水晶（第二章）

我们将创建一个发光的魔法水晶方块和相关物品：

- **魔法水晶方块**：一个发着紫光的方块，可以在世界中放置
- **魔法水晶物品**：可以右键点击方块收集水晶
- **功能**：
  - 方块会发出不同颜色的光
  - 右键点击会播放粒子效果
  - 收集水晶后会减少方块耐久（使用方块实体存储）

### 2.2 项目二：魔法棒（第三章）

我们将创建一个可以发射魔法弹的魔法棒：

- **魔法棒物品**：手持时右键发射魔法弹
- **功能**：
  - 右键蓄力，松开发射
  - 发射紫罗兰色的魔法弹
  - 击中实体造成伤害
  - 击中方块产生爆炸效果
  - 有耐久度限制

### 2.3 项目三：魔法生物（第四章）

我们将创建一个可以驯服的魔法生物：

- **魔法水晶精灵**：一个可爱的魔法生物
- **功能**：
  - 自然生成在世界中
  - 可以被魔法水晶驯服
  - 驯服后跟随玩家
  - 攻击时发射魔法弹
  - 坐下命令

---

## 3. 项目架构

### 3.1 目录结构

```
src/main/java/net/example/mymod/
├── Mymod.java                      # Mod 入口
├── init/
│   ├── ModBlocks.java             # 方块注册
│   ├── ModItems.java              # 物品注册
│   └── ModEntities.java           # 实体注册
├── block/
│   └── MagicCrystalBlock.java     # 魔法水晶方块
├── item/
│   ├── MagicCrystalItem.java      # 魔法水晶物品
│   └── MagicWandItem.java         # 魔法棒物品
├── entity/
│   └── MagicCreatureEntity.java   # 魔法生物实体
├── entity/ai/
│   └── MagicCreatureGoals.java    # 魔法生物 AI
├── projectile/
│   └── MagicProjectileEntity.java # 魔法弹实体
└── network/
    └── ModNetworking.java         # 网络通信

src/main/resources/
└── assets/mymod/
    ├── textures/
    │   ├── block/
    │   │   └── magic_crystal_block.png
    │   ├── item/
    │   │   ├── magic_crystal.png
    │   │   └── magic_wand.png
    │   └── entity/
    │       └── magic_creature.png
    ├── models/
    │   ├── block/
    │   │   └── magic_crystal_block.json
    │   └── item/
    │       ├── magic_crystal.json
    │       └── magic_wand.json
    └── lang/
        ├── en_us.json
        └── zh_cn.json
```

### 3.2 依赖关系

```
                    ┌──────────────┐
                    │   Mymod.java  │
                    │   (Mod入口)    │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  ModBlocks    │  │   ModItems   │  │  ModEntities │
│  (方块注册)   │  │  (物品注册)   │  │  (实体注册)  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│MagicCrystal  │  │MagicWandItem  │  │MagicCreature │
│   Block      │  │  (魔法棒)     │  │   Entity     │
└──────────────┘  └───────┬──────┘  └───────┬──────┘
                          │                  │
                          ▼                  ▼
                   ┌──────────────┐  ┌──────────────┐
                   │MagicProjectile│  │MagicCreature │
                   │   Entity      │  │    Goals     │
                   └───────────────┘  └──────────────┘
```

---

## 4. 技术要点

### 4.1 第一章：魔法水晶

| 技术点 | 说明 |
|--------|------|
| 方块实体 | 使用 `BlockEntity` 存储水晶数量 |
| 发光效果 | `luminance()` 方法 |
| 物品模型 | 自定义物品渲染 |
| 交互逻辑 | `onUse()` 方法 |

### 4.2 第二章：魔法棒

| 技术点 | 说明 |
|--------|------|
| 自定义物品 | 继承 `Item` 类 |
| 物品使用 | `use()` 方法 |
| 投掷物实体 | 继承 `ProjectileEntity` |
| 网络通信 | C2S 数据包 |
| 粒子效果 | `World.addParticle()` |

### 4.3 第三章：魔法生物

| 技术点 | 说明 |
|--------|------|
| 自定义实体 | 继承 `PathAwareEntity` |
| 实体属性 | `DefaultAttributeContainer` |
| AI 目标 | `goalSelector`, `targetSelector` |
| 驯服系统 | 使用 `Tameable` 接口 |
| 实体生成 | `BiomeModifications.addSpawn()` |

---

## 5. 准备工作

### 5.1 环境要求

在开始之前，请确保你已经：
1. 完成了 [环境搭建教程](../part-0-prerequisites/02-environment-setup.md)
2. 创建了你的 [第一个 Mod](../part-0-prerequisites/04-first-mod.md)
3. 了解了 [方块](../part-2-blocks-items/01-creating-blocks.md) 和 [物品](../part-2-blocks-items/03-creating-items.md) 的基础知识
4. 了解了 [实体](../part-3-entities/01-entity-basics.md) 的基础知识

### 5.2 创建项目

如果你还没有创建项目，使用以下命令创建一个新项目：

```bash
# 使用 Fabric Loom 创建新项目
# 在你的工作目录下执行
```

或者在 IntelliJ IDEA 中：
1. File → New → Project
2. 选择 Minecraft Mod
3. 选择 Fabric
4. 填写项目名称（如 `magiccrystals`）
5. 完成创建

### 5.3 推荐依赖

在 `build.gradle` 中添加以下依赖（如果还没有）：

```gradle
dependencies {
    // Fabric API
    minecraft "com.mojang:minecraft:${project.minecraft_version}"
    mappings "net.fabricmc:yarn:${project.yarn_mappings}:v2"
    modImplementation "net.fabricmc:fabric-loader:${project.loader_version}"

    // Fabric API modules
    modImplementation "net.fabricmc.fabric-api:fabric-api:${project.fabric_version}"
}
```

---

## 下一步

准备好开始了吗？让我们从第一个项目开始：

- [第二章：魔法水晶](./02-magic-crystal.md) - 创建发光的魔法水晶方块和可收集的物品

---

*准备好接受挑战了吗？让我们开始创造魔法！*
