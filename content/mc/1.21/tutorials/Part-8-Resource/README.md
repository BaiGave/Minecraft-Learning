# Part-8 资源系统

欢迎来到 Minecraft 源码教程 Part-8！本部分将带你深入了�?Minecraft �?*资源系统（Resource System�?*，包括资源包、数据包以及它们定义的各种游戏数据�?
## 章节列表

### 资源基础

| 章节 | 标题 | 内容简�?|
|------|------|----------|
| [40](./40-resource-pack.md) | 资源包：游戏的外观与音效 | ResourcePack、ResourceManager、Identifier |
| [41](./41-datapack-intro.md) | 数据包：游戏数据定义 | Datapack 结构、namespace、path |

### 核心数据系统

| 章节 | 标题 | 内容简�?|
|------|------|----------|
| [42](./42-loot-table.md) | 战利品表：掉落物定义 | Pool、Entry、Condition、Function |
| [43](./43-advancement.md) | 进度系统：成就与任务 | Criterion、Trigger、Reward |
| [44](./44-recipe-system.md) | 配方系统：物品合�?| ShapedRecipe、CookingRecipe、Smithing |

## 学习路径

```
Part-7: 命令系统
    �?Part-8: 资源系统 �?你在这里
    �?Part-9: 客户端渲�?```

## 核心概念概览

```
┌─────────────────────────────────────────────────────────────�?�?                                                            �?�?                       资源系统                              �?�?                          �?                               �?�?        ┌─────────────────┴─────────────────�?             �?�?        �?                                  �?             �?�?  ┌─────────────�?                  ┌─────────────�?       �?�?  �? 资源�?    �?                  �? 数据�?    �?       �?�?  �?ResourcePack�?                 �? Datapack  �?       �?�?  └─────────────�?                  └─────────────�?       �?�?        �?                                  �?             �?�?        ├── 材质贴图                       ├── 配方        �?�?        ├── 音效                          ├── 战利品表    �?�?        ├── 模型                          ├── 进度        �?�?        ├── 语言文件                      ├── 函数        �?�?        └── 字体                          └── 标签        �?�?                                                            �?└─────────────────────────────────────────────────────────────�?```

### 资源�?vs 数据�?
| 特�?| 资源�?(Resource Pack) | 数据�?(Datapack) |
|------|----------------------|-------------------|
| **位置** | `.minecraft/resourcepacks/` | 世界文件夹的 `datapacks/` |
| **内容** | 材质、音效、模�?| 配方、战利品、进�?|
| **生效范围** | 客户�?| 服务端（影响所有玩家） |
| **修改对象** | 视觉表现 | 游戏逻辑 |
| **可动态切�?* | �?| 需�?/reload |

### 关键类对照表

| Minecraft 1.21 | 说明 | 用�?|
|-----------------|------|------|
| `Identifier` | 资源定位�?| 唯一标识资源：`minecraft:stone` |
| `ResourcePack` | 资源包接�?| 提供资源文件的读�?|
| `ResourceManager` | 资源管理�?| 协调所有资源包，提供统一访问 |
| `LootTable` | 战利品表 | 定义掉落物规�?|
| `LootPool` | 战利品池 | 一次掉落抽�?|
| `Advancement` | 进度 | 定义成就和任�?|
| `Recipe` | 配方接口 | 定义合成规则 |
| `RecipeManager` | 配方管理�?| 管理所有配�?|

## 系统关系�?
```mermaid
flowchart TD
    subgraph 资源系统
        subgraph 资源�?            RP[ResourcePack]
            RM[ResourceManager]
            ID[Identifier]
        end
        
        subgraph 数据�?            DT[Datapack]
            LT[LootTable]
            AD[Advancement]
            RC[Recipe]
        end
    end
    
    subgraph 数据类型
        subgraph 战利�?            LP[LootPool]
            LE[LootEntry]
            LC[LootCondition]
            LF[LootFunction]
        end
        
        subgraph 进度
            CR[Criterion]
            TR[Trigger]
            RW[Reward]
        end
        
        subgraph 配方
            SR[ShapedRecipe]
            SH[ShapelessRecipe]
            CK[CookingRecipe]
            SM[SmithingRecipe]
        end
    end
    
    RP --> RM
    RM --> ID
    
    DT --> LT
    DT --> AD
    DT --> RC
    
    LT --> LP
    LT --> LF
    LP --> LE
    LP --> LC
    
    AD --> CR
    CR --> TR
    AD --> RW
    
    RC --> SR
    RC --> SH
    RC --> CK
    RC --> SM
```

## 实战项目建议

完成本部分学习后，你可以尝试以下项目�?
### 初级项目

1. **自定义材质包**
   - 创建简单的材质替换
   - 添加自定义音�?
2. **自定义数据包**
   - 添加一个新配方
   - 创建自定义战利品�?   - 设计一个成就树

### 中级项目

3. **模组数据�?*
   - 为模组添加完整数据包支持
   - 自定义进度奖励系�?   - 创建复杂的掉落规�?
4. **资源/数据联动**
   - 自定义物品的纹理 + 配方
   - 进度解锁新配�?   - 进度奖励触发自定义函�?
## 相关资源

- [Minecraft Wiki - Resource Pack](https://minecraft.fandom.com/wiki/Resource_Pack)
- [Minecraft Wiki - Datapack](https://minecraft.fandom.com/wiki/Datapack)
- [Minecraft Wiki - Loot table](https://minecraft.fandom.com/wiki/Loot_table)
- [Minecraft Wiki - Advancement](https://minecraft.fandom.com/wiki/Advancement)
- [Minecraft Wiki - Recipe](https://minecraft.fandom.com/wiki/Recipe)
- [Fabric Wiki - Resources](https://fabricmc.net/wiki/documentation:fabric_resources)

## 下一�?
学完本部分后，你可以继续学习�?
- [Part-9 - 客户端渲染](/mc/1.21/tutorials/Part-9-Client-Rendering/) - 了解 Minecraft 如何绘制游戏画面
- **进阶话题**：深入研究资源系统的高级特�?- **模组开�?*：将资源系统应用到模组开发中
- **自定义内�?*：创建完整的自定义资源包和数据包

> **注意**：本文中的部分源码示例基�?CFR 反编译结果，实际源码可能略有差异�?
---

**关键�?*：资源系统、资源包、数据包、战利品表、进度、配�?
---

*本教程基�?Minecraft 1.21 源码编写*
