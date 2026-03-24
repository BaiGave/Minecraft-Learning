# Fabric Mod 开发完全指南

> 从零开始学习 Fabric Mod 开发 | 适合完全零基础的新手

---

## 这是什么教程？

这是一份面向完全新手的 Fabric Mod 开发教程。无论你之前是否接触过编程，是否了解 Minecraft 模组开发，这套教程都会带你从零开始，一步步掌握 Fabric Mod 的开发技能。

**你将学到什么？**
- 如何搭建开发环境
- Fabric API 的核心概念和使用方法
- 如何创建方块、物品、生物群系
- 如何处理玩家交互和事件
- 如何实现网络通信和自定义命令
- 如何创建自定义渲染和粒子效果

---

## 教程结构

### 第一部分：准备工作（新手必读）

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-java-basics.md](part-0-prerequisites/01-java-basics.md) | Java 编程基础 | ⭐ |
| [02-environment-setup.md](part-0-prerequisites/02-environment-setup.md) | 开发环境搭建 | ⭐ |
| [03-minecraft-mod-concepts.md](part-0-prerequisites/03-minecraft-mod-concepts.md) | Minecraft Mod 开发概念 | ⭐ |
| [04-first-mod.md](part-0-prerequisites/04-first-mod.md) | 创建你的第一个 Mod | ⭐ |

### 第二部分：Fabric 基础

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-fabric-intro.md](part-1-basics/01-fabric-intro.md) | Fabric 简介 | ⭐ |
| [02-mod-structure.md](part-1-basics/02-mod-structure.md) | Mod 项目结构 | ⭐⭐ |
| [03-event-system.md](part-1-basics/03-event-system.md) | 事件系统入门 | ⭐⭐ |
| [04-registry-system.md](part-1-basics/04-registry-system.md) | 注册系统 | ⭐⭐ |

### 第三部分：方块与物品

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-creating-blocks.md](part-2-blocks-items/01-creating-blocks.md) | 创建自定义方块 | ⭐⭐ |
| [02-block-entity.md](part-2-blocks-items/02-block-entity.md) | 方块实体 | ⭐⭐⭐ |
| [03-creating-items.md](part-2-blocks-items/03-creating-items.md) | 创建自定义物品 | ⭐⭐ |
| [04-item-groups.md](part-2-blocks-items/04-item-groups.md) | 物品栏分组 | ⭐⭐ |

### 第四部分：实体与AI

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-entity-basics.md](part-3-entities/01-entity-basics.md) | 实体基础 | ⭐⭐⭐ |
| [02-entity-attributes.md](part-3-entities/02-entity-attributes.md) | 实体属性 | ⭐⭐⭐ |
| [03-spawning.md](part-3-entities/03-spawning.md) | 实体生成控制 | ⭐⭐⭐ |
| [04-mob-ai.md](part-3-entities/04-mob-ai.md) | 生物 AI | ⭐⭐⭐⭐ |

### 第五部分：世界生成

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-biome-intro.md](part-4-world-gen/01-biome-intro.md) | 生物群系简介 | ⭐⭐⭐ |
| [02-custom-biome.md](part-4-world-gen/02-custom-biome.md) | 创建自定义生物群系 | ⭐⭐⭐⭐ |
| [03-features.md](part-4-world-gen/03-features.md) | 世界特征 | ⭐⭐⭐⭐ |

### 第六部分：渲染与粒子

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-rendering-basics.md](part-5-rendering/01-rendering-basics.md) | 渲染基础 | ⭐⭐⭐ |
| [02-custom-models.md](part-5-rendering/02-custom-models.md) | 自定义模型 | ⭐⭐⭐⭐ |
| [03-particles.md](part-5-rendering/03-particles.md) | 粒子效果 | ⭐⭐⭐⭐ |

### 第七部分：网络与命令

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-networking-basics.md](part-6-networking/01-networking-basics.md) | 网络基础 | ⭐⭐⭐ |
| [02-custom-packets.md](part-6-networking/02-custom-packets.md) | 自定义数据包 | ⭐⭐⭐⭐ |
| [03-commands.md](part-6-networking/03-commands.md) | 自定义命令 | ⭐⭐⭐ |

### 第八部分：高级专题

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-transfer-api.md](part-7-advanced/01-transfer-api.md) | 传输 API | ⭐⭐⭐⭐ |
| [02-data-attachment.md](part-7-advanced/02-data-attachment.md) | 数据附件 | ⭐⭐⭐⭐ |
| [03-recipes.md](part-7-advanced/03-recipes.md) | 配方系统 | ⭐⭐⭐ |
| [04-loot-tables.md](part-7-advanced/04-loot-tables.md) | 战利品表 | ⭐⭐⭐ |

### 第九部分：实战项目

| 章节 | 内容 | 难度 |
|------|------|------|
| [01-project-overview.md](part-8-projects/01-project-overview.md) | 项目概览 | ⭐⭐⭐ |
| [02-magic-crystal.md](part-8-projects/02-magic-crystal.md) | 实战：魔法水晶 | ⭐⭐⭐⭐ |
| [03-magic-wand.md](part-8-projects/03-magic-wand.md) | 实战：魔法棒 | ⭐⭐⭐⭐ |
| [04-magic-creature.md](part-8-projects/04-magic-creature.md) | 实战：魔法生物 | ⭐⭐⭐⭐⭐ |

---

## 如何学习

### 学习顺序建议

```
新手入门顺序：

1. 先读"准备工作"部分
   ↓
2. 创建你的第一个 Mod！
   ↓
3. 学习"Fabric 基础"
   ↓
4. 根据兴趣选择：
   - 想做方块/物品 → 看"方块与物品"
   - 想做生物 → 看"实体与AI"
   - 想做世界 → 看"世界生成"
   ↓
5. 学习"网络与命令"
   ↓
6. 挑战"实战项目"
```

### 每章的结构

每章教程都遵循统一的结构：

```
1. 概念解释 - 用通俗易懂的语言解释这是什么
2. 源码分析 - 展示相关 API 的源代码
3. 实战代码 - 可运行的完整代码示例
4. 练习题 - 巩固所学知识的练习
5. 延伸阅读 - 相关分析和源码文档链接
```

---

## 配套资源

### 源码文档

与本教程配套的还有详细的源码分析文档：
- [Fabric API 分析文档](../analysis/) - 深入理解每个 API 的实现原理

### 示例代码

教程中的所有代码都有完整的示例项目，可以在 GitHub 上找到。

---

## 常见问题

### Q: 我需要先学会 Java 吗？

**A**: 是的，需要基本的 Java 知识。不过教程的 [Java 基础章节](part-0-prerequisites/01-java-basics.md) 涵盖了开发 Mod 所需的全部 Java 知识。

### Q: 教程里的代码可以直接用吗？

**A**: 可以！教程中的代码都是完整可运行的，复制粘贴后稍作修改即可使用。

### Q: 遇到问题怎么办？

**A**:
1. 检查代码是否完全按照教程复制
2. 查看 [Fabric Wiki](https://fabricmc.net/wiki/) 英文文档
3. 在 [Fabric Discord](https://discord.gg/fabricmc) 寻求帮助
4. 查看 [Minecraft Forge 论坛](https://www.curseforge.com/minecraft/mc-mods/fabric-api)

---

## 贡献指南

如果你发现教程中有任何错误，或者想要添加新的内容，欢迎提交 Pull Request！

---

*教程版本: 1.0.0*
*适用于: Minecraft 1.21+ | Fabric API 0.116.9+*
*最后更新: 2026-03-23*
