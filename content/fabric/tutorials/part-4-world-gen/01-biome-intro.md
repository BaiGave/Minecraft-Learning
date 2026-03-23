# 第一章：生物群系简介

> 生物群系是 Minecraft 世界的基本地形单位，理解生物群系是制作优秀 mod 的基础。

---

## 目录

1. [什么是生物群系](#1-什么是生物群系)
2. [生物群系的组成](#2-生物群系的组成)
3. [如何使用 Fabric API 修改生物群系](#3-如何使用-fabric-api-修改生物群系)
4. [生物群系选择器](#4-生物群系选择器)
5. [修改阶段](#5-修改阶段)
6. [实战：修改现有生物群系](#6-实战修改现有生物群系)

---

## 1. 什么是生物群系

### 1.1 简单理解

想象一下，Minecraft 的世界是由许多不同的"气候区"组成的。每个气候区有自己独特的：
- 地形高度和形状
- 地面上的方块（草地、泥土、沙子等）
- 植被（树木、花草）
- 天气特征（温度、湿度、降雨）
- 生长的动物和怪物

这些气候区就叫做**生物群系（Biome）**。

### 1.2 常见的生物群系

在主世界（Overworld）中，你可以找到：

| 生物群系 | 描述 | 典型特征 |
|----------|------|----------|
| 平原（Plains） | 平坦的绿色草地 | 牛、猪、羊 |
| 森林（Forest） | 茂密的树林 | 狼、狐狸、蘑菇 |
| 沙漠（Desert） | 干旱的沙丘 | 仙人掌、骷髅 |
| 山脉（Mountains） | 高耸的山峰 |  goats、山羊 |
| 雪原（Snowy Plains） | 冰雪覆盖 | 雪兔、流浪者 |
| 丛林（Jungle） | 密集的热带雨林 | 豹猫、鹦鹉 |
| 沼泽（Swamp） | 阴暗的湿地 | 史莱姆、女巫 |

### 1.3 生物群系在哪里生效

Minecraft 有三个维度，每个维度都有不同的生物群系：

```
┌─────────────────────────────────────────────┐
│              Minecraft 世界                   │
├─────────────────────────────────────────────┤
│  主世界（Overworld）  - 草原、森林、沙漠...   │
│         ↓ 生成在这里 ↓                       │
│                                             │
│  下界（Nether）      - 地狱、灵魂沙 valley... │
│         ↓ 生成在这里 ↓                       │
│                                             │
│  末地（The End）    - 末地岛、空虚维度...    │
└────────────────────��────────────────────────┘
```

---

## 2. 生物群系的组成

每个生物群系都由多个部分组成：

```
┌─────────────────────────────────────────────┐
│             生物群系 (Biome)                  │
├─────────────────────────────────────────────┤
│  气候属性                                    │
│  ├── 温度 (Temperature)                      │
│  ├── 湿度 (Humidity/Downfall)                │
│  └── 降雪 (DoesNotSnow)                     │
├─────────────────────────────────────────────┤
│  地形特征                                    │
│  ├── 地面方块 (Surface/Top Block)            │
│  ├── 地下方块 (Underground)                  │
│  └── 地形形状 (Terrain/Noise)                │
├─────────────────────────────────────────────┤
│  生成内容                                    │
│  ├── 矿石 (Ores)                            │
│  ├── 树木 (Trees)                           │
│  ├── 草丛/花朵 (Vegetation)                 │
│  ├─�� 结构 (Structures)                      │
│  └── 实体 (Entities - 动物/怪物)            │
├─────────────────────────────────────────────┤
│  视觉效果                                    │
│  ├── 天空颜色 (Sky Color)                    │
│  ├── 雾效 (Fog)                             │
│  ├── 音乐 (Ambient Sound)                   │
│  └── 粒子 (Particles)                       │
└─────────────────────────────────────────────┘
```

---

## 3. 如何使用 Fabric API 修改生物群系

Fabric 提供了一个强大的 `fabric-biome-api-v1` 模块，让你可以轻松修改和添加生物群系。

### 3.1 引入依赖

在你的 `build.gradle` 中添加：

```groovy
dependencies {
    // 添加生物群系 API
    modImplementation "net.fabricmc.fabric-api:fabric-biome-api-v1"
}
```

### 3.2 核心 API 概览

```java
// 引入必要的类
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.biome.v1.ModificationPhase;

// 添加特征（矿石、树木等）
BiomeModifications.addFeature(
    生物群系选择器,      // 在哪些生物群系中添加
    生成步骤,           // 何时生成
    特征ID              // 添加什么
);

// 添加实体生成
BiomeModifications.addSpawn(
    生物群系选择器,      // 在哪些生物群系中添加
    生成组,             // 怪物/动物/经验等
    实体类型,           // 添加什么生物
    权重,               // 出现的几率
    最小数量,           // 最少生成多少
    最多数量            // 最多生成多少
);
```

---

## 4. 生物群系选择器

选择器决定你的修改在哪些生物群系中生效。

### 4.1 基础选择器

```java
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;

// 选择所有生物群系
BiomeSelectors.all()

// 选择原版生物群系（不包括模组添加的）
BiomeSelectors.vanilla()

// 选择主世界的生物群系
BiomeSelectors.foundInOverworld()

// 选择下界的生物群系
BiomeSelectors.foundInTheNether()

// 选择末地的生物群系
BiomeSelectors.foundInTheEnd()
```

### 4.2 高级选择器

```java
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.world.biome.BiomeKeys;

// 选择特定的生物群系
BiomeSelectors.includeByKey(
    Set.of(
        BiomeKeys.PLAINS,        // 平原
        BiomeKeys.FOREST         // 森林
    )
);

// 排除特定的生物群系
BiomeSelectors.excludeByKey(
    Set.of(
        BiomeKeys.DESERT         // 不修改沙漠
    )
);

// 根据标签选择（需要了解生物群系的标签系统）
BiomeSelectors.tag(TagKey.of(RegistryKeys.BIOME, Identifier.of("minecraft", "is_forest")))
```

### 4.3 组合选择器

你可以通过 Java 的 `Predicate` 来组合更复杂的选择条件：

```java
// 使用 and 组合
Predicate<BiomeSelectionContext> customSelector = 
    BiomeSelectors.foundInOverworld().and(
        context -> context.getTemperature() > 0.5  // 温度大于 0.5
    );

// 使用 or 组合
Predicate<BiomeSelectionContext> warmBiomes = 
    BiomeSelectors.includeByKey(Set.of(BiomeKeys.DESERT, BiomeKeys.SAVANNA))
    .or(BiomeSelectors.includeByKey(Set.of(BiomeKeys.PLAINS)));
```

---

## 5. 修改阶段

生物群系的修改按照阶段顺序执行：

```
┌─────────────────────────────────────────────────────┐
│              修改阶段顺序                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  阶段 1: ADDITIONS (添加)                           │
│  ─────────────────────────────────────────────      │
│  • 添加矿石                                        │
│  • 添加树木                                        │
│  • 添加植被                                        │
│  • 添加新结构                                      │
│                                                     │
│  阶段 2: REMOVALS (移除)                           │
│  ─────────────────────────────────────────────      │
│  • 移除不需要的生成物                               │
│  • 移除特定实体                                     │
│                                                     │
│  阶段 3: REPLACEMENTS (替换)                       │
│  ─────────────────────────────────────────────      │
│  • 替换现有特征                                     │
│  • 修改生成规则                                     │
│                                                     │
│  阶段 4: POST_PROCESSING (后处理)                   │
│  ─────────────────────────────────────────────      │
│  • 全局修改                                         │
│  • 应用最终效果                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.1 使用阶段

```java
// 创建自定义修改器
BiomeModification myModification = BiomeModifications.create(
    Identifier.of("mymod", "my_biome_change")
);

// 在添加阶段添加矿石
myModification.add(
    ModificationPhase.ADDITIONS,
    BiomeSelectors.foundInOverworld(),
    context -> {
        // 这里可以进一步筛选
        // 但通常在 addFeature 中指定更方便
    }
);

// 在后处理阶段修改天空颜色
myModification.add(
    ModificationPhase.POST_PROCESSING,
    BiomeSelectors.foundInOverworld(),
    context -> {
        context.getEffects().setSkyColor(0x87CEEB);  // 蓝色天空
    }
);
```

---

## 6. 实战：修改现有生物群系

让我们创建一个简单的例子：修改所有主世界生物群系，使其天空变成粉红色！

### 6.1 创建 Mod 入口类

```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.biome.v1.ModificationPhase;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始初始化 {}", MOD_ID);

        // 修改生物群系
        modifyBiomes();

        LOGGER.info("{} 初始化完成", MOD_ID);
    }

    private void modifyBiomes() {
        // 创建一个自定义修改器
        BiomeModifications.create(Identifier.of(MOD_ID, "pink_sky"))
            .add(
                ModificationPhase.POST_PROCESSING,
                // 只修改主世界的生物群系
                BiomeSelectors.foundInOverworld(),
                context -> {
                    // 获取当前生物群系的效果
                    var effects = context.getEffects();
                    
                    // 设置天空颜色为粉红色 (0xFF69B4 = RGB(255, 105, 180))
                    effects.setSkyColor(0xFF69B4);
                }
            );
    }
}
```

### 6.2 运行效果

当你进入任何主世界生物群系时，天空都会变成粉红色！

### 6.3 更多修改示例

```java
private void modifyBiomes() {
    // 示例 1：修改草原的温度，使其变成寒冷的草原
    BiomeModifications.create(Identifier.of(MOD_ID, "cold_plains"))
        .add(
            ModificationPhase.ADDITIONS,
            BiomeSelectors.includeByKey(Set.of(BiomeKeys.PLAINS)),
            context -> {
                var weather = context.getWeather();
                weather.setTemperature(0.2f);   // 设置为低温
                weather.setDownfall(0.3f);       // 较少降雨
            }
        );

    // 示例 2：移除森林中的狼
    BiomeModifications.create(Identifier.of(MOD_ID, "no_wolves"))
        .add(
            ModificationPhase.REMOVALS,
            BiomeSelectors.includeByKey(Set.of(BiomeKeys.FOREST)),
            context -> {
                // 这里需要使用更底层的 API 来移除实体
                // 详细见下一章
            }
        );
}
```

---

## 小结

在这一章中，你学会了：

1. **什么是生物群系** - Minecraft 世界的基本地形单位
2. **生物群系的组成** - 气候、地形、生成内容、视觉效果
3. **Fabric API 基础** - 如何使用 BiomeModifications
4. **选择器** - 如何选择要修改的生物群系
5. **修改阶段** - 修改的执行顺序
6. **实战** - 修改生物群系的示例

---

## 下一步

现在你已经了解了生物群系的基础知识，接下来可以学习：

- [第二章：创建自定义生物群系](./02-custom-biome.md) - 创建你自己的全新生物群系
- [第三章：世界特征](./03-features.md) - 添加矿石、树木等世界特征

---

> **提示**：如果你在运行时遇到问题，检查控制台是否有错误信息。常见问题包括：
> - 忘记在 `build.gradle` 中添加 `fabric-biome-api-v1` 依赖
> - 使用了错误的生物群系 ID
> - 选择器条件过于严格导致没有匹配到任何生物群系
