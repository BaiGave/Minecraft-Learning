# 第二章：创建自定义生物群系

> 在这一章中，我们将学习如何创建全新的生物群系，包括主世界、下界和末地的生物群系。

---

## 目录

1. [准备工作](#1-准备工作)
2. [创建主世界生物群系](#2-创建主世界生物群系)
3. [注册生物群系](#3-注册生物群系)
4. [添加世界特征](#4-添加世界特征)
5. [创建下界生物群系](#5-创建下界生物群系)
6. [创建末地生物群系](#6-创建末地生物群系)
7. [完整示例](#7-完整示例)

---

## 1. 准备工作

### 1.1 添加依赖

在 `build.gradle` 中添加生物群系 API：

```groovy
dependencies {
    modImplementation "net.fabricmc.fabric-api:fabric-biome-api-v1"
}
```

### 1.2 需要了解的概念

在创建生物群系之前，我们需要了解几个核心概念：

```
┌─────────────────────────────────────────────────────┐
│              创建生物群系需要的组件                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. 生物群系定义 (Biome)                            │
│     └── 定义气候、效果、生成内容                      │
│                                                     │
│  2. 放置特征 (PlacedFeature)                        │
│     └── 定义矿石、树木、花草在哪里生成                 │
│                                                     │
│  3. 配置特征 (ConfiguredFeature)                    │
│     └── 定义特征的具体参数                            │
│                                                     │
│  4. 雕刻器 (Carver)                                 │
│     └── 定义洞穴、峡谷等地形空洞                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. 创建主世界生物群系

### 2.1 生物群系构建器

Fabric 提供了 `Biome.Builder` 类来创建生物群系：

```java
import net.minecraft.world.biome.Biome;
import net.minecraft.world.biome.BiomeEffects;
import net.minecraft.world.biome.BiomeWeather;
import net.minecraft.world.biome.GenerationSettings;
import net.minecraft.world.biome.SpawnSettings;

// 创建生物群系
Biome myBiome = new Biome.Builder()
    // 气候设置
    .weather(
        new BiomeWeather(
            0.5f,          // 温度 (0-1)
            0.5f,          // 湿度/降雨量 (0-1)
            false,         // 是否永春（不积雪）
            false          // 是否无雨
        )
    )
    // 视觉效果
    .effects(
        new BiomeEffects.Builder()
            .skyColor(0x87CEEB)      // 天空颜色
            .fogColor(0xC0E8FF)      // 雾颜色
            .waterColor(0x00AADD)    // 水颜色
            .waterFogColor(0x050533) // 水下雾颜色
            .grassColor(0x55FF55)    // 草地颜色
            .foliageColor(0x55AA55)  // 树叶颜色
            .build()
    )
    // 生成设置（矿石、树木等）
    .generationSettings(GenerationSettings::new)
    // 实体生成设置（动物、怪物等）
    .spawnSettings(SpawnSettings::new)
    .build();
```

### 2.2 完整生物群系示例

让我们创建一个"魔法森林"生物群系：

```java
package net.example.mymod.biome;

import net.minecraft.world.biome.Biome;
import net.minecraft.world.biome.BiomeEffects;
import net.minecraft.world.biome.BiomeWeather;
import net.minecraft.world.biome.GenerationSettings;
import net.minecraft.world.biome.SpawnSettings;
import net.minecraft.world.gen.feature.DefaultBiomeFeatures;

public class ModBiomes {
    
    public static Biome createMagicForestBiome() {
        return new Biome.Builder()
            // 气候设置：温和湿润
            .weather(
                new BiomeWeather(
                    0.7f,      // 温度：温暖
                    0.8f,      // 湿度：高
                    false,     // 不永春
                    false      // 有降雨
                )
            )
            // 视觉效果：紫色调的魔法森林
            .effects(
                new BiomeEffects.Builder()
                    .skyColor(0x6A5ACD)        // 紫蓝色天空
                    .fogColor(0x9370DB)        // 紫色雾
                    .waterColor(0x4B0082)      // 深紫色水
                    .waterFogColor(0x2F1B4C)   // 紫色水下雾
                    .grassColor(0x4B0082)      // 紫色草地
                    .foliageColor(0x6A0DAD)    // 紫色树叶
                    .build()
            )
            // 生成设置
            .generationSettings(createMagicForestGenerationSettings())
            // 实体生成设置
            .spawnSettings(createMagicForestSpawnSettings())
            .build();
    }
    
    private static GenerationSettings createMagicForestGenerationSettings() {
        GenerationSettings.Builder builder = new GenerationSettings.Builder();
        
        // 添加默认特征（草地、花朵等）
        DefaultBiomeFeatures.addGrass(builder);
        DefaultBiomeFeatures.addForestFlowers(builder);
        DefaultBiomeFeatures.addDefaultFlowers(builder);
        
        // 添加树木 - 我们会在后面创建自定义树木
        // DefaultBiomeFeatures.addTaigaTrees(builder);
        
        // 添加矿石
        DefaultBiomeFeatures.addMineables(builder);
        DefaultBiomeFeatures.addOres(builder);
        
        // 添加动物
        DefaultBiomeFeatures.addForestAnimals(builder);
        
        return builder.build();
    }
    
    private static SpawnSettings createMagicForestSpawnSettings() {
        SpawnSettings.Builder builder = new SpawnSettings.Builder();
        
        // 狐狸（森林动物）
        builder.spawn(
            SpawnGroup.CREATURE,
            new SpawnSettings.SpawnEntry(
                net.minecraft.entity.EntityType.FOX,
                5,    // 权重
                2,    // 最小数量
                4     // 最大数量
            )
        );
        
        return builder.build();
    }
}
```

---

## 3. 注册生物群系

### 3.1 注册到游戏

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.biome.ModBiomes;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.Biome;

public class ModBiomeRegistry {
    // 定义生物群系的注册键
    public static final RegistryKey<Biome> MAGIC_FOREST = RegistryKey.of(
        Registries.BIOME,
        Identifier.of(Mymod.MOD_ID, "magic_forest")
    );
    
    public static void register() {
        // 注册生物群系
        Registry.register(
            Registries.BIOME,           // 注册表类型
            MAGIC_FOREST.getValue(),   // ID
            ModBiomes.createMagicForestBiome()  // 生物群系实例
        );
        
        Mymod.LOGGER.info("注册生物群系: {}", MAGIC_FOREST.getValue());
    }
}
```

### 3.2 在 Mod 入口中调用

```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.init.ModBiomeRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始初始化 {}", MOD_ID);
        
        // 注册生物群系
        ModBiomeRegistry.register();
        
        LOGGER.info("{} 初始化完成", MOD_ID);
    }
}
```

---

## 4. 添加世界特征

创建完生物群系后，我们需要让它在世界中生成内容。

### 4.1 什么是特征（Feature）

特征是世界中生成的各种东西：

```
┌─────────────────────────────────────────────────────┐
│              世界特征类型                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  矿石类                                             │
│  ├── 煤炭矿、红宝石矿、金矿等                         │
│  └── OreFeature, ScatterableFeature                 │
│                                                     │
│  地形类                                             │
│  ├── 巨石、珊瑚、沙漠水井                            │
│  └── LargeDripstoneFeature, CoralFeature             │
│                                                     │
│  植被类                                             │
│  ├── 树木、花、草                                   │
│  └── TreeFeature, FlowerFeature, GrassFeature        │
│                                                     │
│  结构类                                             │
│  ├── 村庄、地牢、矿井                                │
│  └── StructureFeature                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 使用 Fabric API 添加特征

```java
package net.example.mymod;

import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.biome.v1.GenerationStep;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.BiomeKeys;

public class ModWorldGeneration {
    
    public static void addBiomeFeatures() {
        // 添加到主世界的平原生物群系
        // 第一个参数：选择哪些生物群系
        // 第二个参数：生成阶段
        // 第三个参数：放置特征的 ID
        
        // 在地下矿石层添加
        BiomeModifications.addFeature(
            BiomeSelectors.includeByKey(BiomeKeys.PLAINS),
            GenerationStep.Feature.UNDERGROUND_ORES,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "my_custom_ore")
            )
        );
        
        // 在植被层添加树木
        BiomeModifications.addFeature(
            BiomeSelectors.includeByKey(BiomeKeys.PLAINS),
            GenerationStep.Feature.VEGETAL_DECORATION,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "my_custom_tree")
            )
        );
    }
}
```

---

## 5. 创建下界生物群系

### 5.1 下界生物群系的特点

下界生物群系需要特殊处理，因为它们使用"噪声参数"来决定生成位置：

```java
import net.fabricmc.fabric.api.biome.v1.NetherBiomes;
import net.minecraft.util.math.noise.MultiNoiseUtil;
```

### 5.2 添加下界生物群系

```java
public class ModNetherBiomes {
    
    public static void addNetherBiome() {
        // 添加到下界
        // 参数：生物群系键，噪声参数
        
        NetherBiomes.addNetherBiome(
            RegistryKey.of(
                Registries.BIOME,
                Identifier.of("mymod", "crystal_caves")
            ),
            // 创建噪声参数
            MultiNoiseUtil.createNoiseHypercube(
                0.0f,      // 温度 (temperature)
                0.5f,      // 湿度 (humidity)
                0.0f,      // 大陆性 (continentalness)
                0.0f,      // 侵蚀 (erosion)
                0.0f,      // 深度 (depth)
                0.0f,      // 怪异度 (weirdness)
                0.1f       // 偏移 (offset)
            )
        );
    }
}
```

### 5.3 噪声参数解释

```
┌─────────────────────────────────────────────────────┐
│              噪声参数说明                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  MultiNoiseUtil.createNoiseHypercube(               │
│      temperature,     // 温度：-2 到 2             │
│      humidity,        // 湿度：-2 到 2             │
│      continentalness, // 大陆性：离海洋多远         │
│      erosion,         // 侵蚀：地形侵蚀程度           │
│      depth,          // 深度：表面还是地下           │
│      weirdness,      // 怪异度：独特地形             │
│      offset          // 偏移：调整生成位置           │
│  )                                                │
│                                                     │
│  常见下界生物群系参数：                              │
│  • 灵魂沙 valley: -0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0  │
│  • 珊瑚墓地: 0.0, 0.5, -0.5, 0.0, 0.0, 0.0, 0      │
│  • 绯红森林: 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 6. 创建末地生物群系

### 6.1 末地生物群系类型

末地有不同的区域类型：

```
┌─────────────────────────────────────────────────────┐
│              末地区域类型                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  主岛 (Main Island)                                 │
│  └── 末地的主要大型岛屿                              │
│                                                     │
│  高地 (Highlands)                                   │
│  └── 较高的陆地，有天空岛                            │
│                                                     │
│  中地 (Midlands)                                    │
│  └── 高地和低地之间的区域                            │
│                                                     │
│  低地 (Lowlands)                                    │
│  └── 较低的陆地                                      │
│                                                     │
│  荒地 (Barrens)                                     │
│  └── 贫瘠的区域                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6.2 添加末地生物群系

```java
import net.fabricmc.fabric.api.biome.v1.TheEndBiomes;

public class ModEndBiomes {
    
    public static void addEndBiomes() {
        // 获取生物群系键
        RegistryKey<Biome> crystalPlains = RegistryKey.of(
            Registries.BIOME,
            Identifier.of("mymod", "crystal_plains")
        );
        
        RegistryKey<Biome> crystalMidlands = RegistryKey.of(
            Registries.BIOME,
            Identifier.of("mymod", "crystal_midlands")
        );
        
        // 添加为高地生物群系（权重越高越容易生成）
        TheEndBiomes.addHighlandsBiome(crystalPlains, 5.0);
        
        // 为该高地添加中地
        TheEndBiomes.addMidlandsBiome(crystalPlains, crystalMidlands, 10.0);
        
        // 或者添加到主岛
        TheEndBiomes.addMainIslandBiome(
            RegistryKey.of(
                Registries.BIOME,
                Identifier.of("mymod", "my_end_biome")
            ),
            1.0  // 权重
        );
    }
}
```

---

## 7. 完整示例

让我们创建一个完整的 mod 示例，包含：
1. 自定义主世界生物群系
2. 添加到世界生成

### 7.1 项目结构

```
src/main/java/net/example/mymod/
├── Mymod.java                    # 主入口
├── init/
│   ├── ModBiomes.java            # 生物群系定义
│   └── ModBiomeRegistry.java     # 生物群系注册
└── world/
    └── ModWorldGeneration.java   # 世界生成

src/main/resources/
└── assets/mymod/
    └── lang/
        └── zh_cn.json            # 中文翻译
```

### 7.2 完整代码

**Mymod.java**:
```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.init.ModBiomeRegistry;
import net.example.mymod.world.ModWorldGeneration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始初始化 {}", MOD_ID);
        
        // 1. 注册生物群系
        ModBiomeRegistry.register();
        
        // 2. 配置世界生成
        ModWorldGeneration.configureBiomes();
        
        LOGGER.info("{} 初始化完成", MOD_ID);
    }
}
```

**ModBiomes.java**:
```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.Biome;
import net.minecraft.world.biome.BiomeEffects;
import net.minecraft.world.biome.BiomeWeather;
import net.minecraft.world.biome.GenerationSettings;
import net.minecraft.world.biome.SpawnSettings;
import net.minecraft.world.gen.feature.DefaultBiomeFeatures;

public class ModBiomes {
    
    // 主世界生物群系
    public static final RegistryKey<Biome> CRYSTAL_FOREST = RegistryKey.of(
        Registries.BIOME,
        Identifier.of(Mymod.MOD_ID, "crystal_forest")
    );
    
    public static Biome createCrystalForestBiome() {
        return new Biome.Builder()
            .weather(
                new BiomeWeather(
                    0.8f,      // 温暖
                    0.6f,      // 中等湿度
                    false,     // 不永春
                    false      // 有降雨
                )
            )
            .effects(
                new BiomeEffects.Builder()
                    .skyColor(0x7B68EE)        // 中紫色天空
                    .fogColor(0x9370DB)        // 紫色雾
                    .waterColor(0x0077BE)      // 水蓝色水
                    .waterFogColor(0x505050)   // 灰色水下雾
                    .grassColor(0x7CFC00)      // 草绿色草地
                    .foliageColor(0x228B22)    // 森林绿树叶
                    .build()
            )
            .generationSettings(createGenerationSettings())
            .spawnSettings(createSpawnSettings())
            .build();
    }
    
    private static GenerationSettings createGenerationSettings() {
        GenerationSettings.Builder builder = new GenerationSettings.Builder();
        
        // 添加原版特征
        DefaultBiomeFeatures.addGrass(builder);
        DefaultBiomeFeatures.addDefaultFlowers(builder);
        DefaultBiomeFeatures.addForestFlowers(builder);
        DefaultBiomeFeatures.addForestTrees(builder);
        DefaultBiomeFeatures.addMineables(builder);
        DefaultBiomeFeatures.addOres(builder);
        DefaultBiomeFeatures.addForestAnimals(builder);
        
        return builder.build();
    }
    
    private static SpawnSettings createSpawnSettings() {
        SpawnSettings.Builder builder = new SpawnSettings.Builder();
        
        // 添加狼（森林动物）
        builder.spawn(
            SpawnGroup.CREATURE,
            new SpawnSettings.SpawnEntry(
                net.minecraft.entity.EntityType.WOLF,
                5, 2, 4
            )
        );
        
        // 添加兔子
        builder.spawn(
            SpawnGroup.CREATURE,
            new SpawnSettings.SpawnEntry(
                net.minecraft.entity.EntityType.RABBIT,
                4, 2, 3
            )
        );
        
        return builder.build();
    }
    
    public static void register() {
        Registry.register(
            Registries.BIOME,
            CRYSTAL_FOREST.getValue(),
            createCrystalForestBiome()
        );
        Mymod.LOGGER.info("注册生物群系: {}", CRYSTAL_FOREST.getValue());
    }
}
```

**ModWorldGeneration.java**:
```java
package net.example.mymod.world;

import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.biome.v1.GenerationStep;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.BiomeKeys;

public class ModWorldGeneration {
    
    public static void configureBiomes() {
        // 让我们的水晶森林可以在主世界生成
        
        // 注意：这里需要使用专门的生物群系修改器
        // Fabric 1.20+ 可以使用下面的方法
        
        // 使用 BiomeKeys 获取已有的特征
        // 或者创建你自己的放置特征
        
        // 示例：添加更多矿石到所有主世界生物群系
        BiomeModifications.addFeature(
            BiomeSelectors.foundInOverworld(),
            GenerationStep.Feature.UNDERGROUND_ORES,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "extra_coal_ore")
            )
        );
    }
}
```

### 7.3 语言文件

**zh_cn.json**:
```json
{
    "biome.mymod.crystal_forest": "水晶森林"
}
```

---

## 小结

在这一章中，你学会了：

1. **创建主世界生物群系** - 使用 `Biome.Builder`
2. **注册生物群系** - 放入游戏的注册表
3. **世界特征基础** - 矿石、树木的生成
4. **创建下界生物群系** - 使用噪声参数
5. **创建末地生物群系** - 添加到不同区域

---

## 下一步

现在你已经学会了创建生物群系，接下来可以学习：

- [第三章：世界特征](./03-features.md) - 深入了解矿石、树木、地形特征
- [第一章：生物群系简介](./01-biome-intro.md) - 回顾生物群系基础知识

---

> **常见问题**
>
> **Q: 生物群系没有生成？**
> - 检查是否正确注册了生物群系
> - 确认选择器条件正确
> - 使用 `/locatebiome` 命令查找
>
> **Q: 游戏崩溃？**
> - 检查生物群系的天空颜色是否在有效范围内 (0x000000 - 0xFFFFFF)
> - 确认温度值在 0-1 之间
>
> **Q: 如何让多个生物群系连续生成？**
> - 需要修改生物群系源（BiomeSource），这需要更高级的技术
