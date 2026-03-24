# 第三章：世界特征

> 世界特征是 Minecraft 世界的精髓，从地下埋藏的矿石到地面上的树木，都是由特征系统生成的。这一章将教你如何创建和添加各种世界特征。

---

## 目录

1. [特征系统概述](#1-特征系统概述)
2. [配置特征 (ConfiguredFeature)](#2-配置特征-configuredfeature)
3. [放置特征 (PlacedFeature)](#3-放置特征-placedfeature)
4. [创建自定义矿石](#4-创建自定义矿石)
5. [创建自定义树木](#5-创建自定义树木)
6. [创建自定义草丛](#6-创建自定义草丛)
7. [添加到生物群系](#7-添加到生物群系)
8. [完整示例](#8-完整示例)

---

## 1. 特征系统概述

### 1.1 什么是特征

特征（Feature）是世界中生成的各种物体的统称：

```
┌─────────────────────────────────────────────────────┐
│              世界特征类型                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  矿石类                                             │
│  ├── 煤矿、铁矿、金矿                                │
│  ├── 铜矿、稀土矿、绿宝石矿                          │
│  └── 需要: OreFeature, ScatterableFeature           │
│                                                     │
│  植被类                                             │
│  ├── 橡树、白桦树、巨型蘑菇                          │
│  ├── 草地、花丛、甘蔗                               │
│  └── 需要: TreeFeature, FlowerFeature                │
│                                                     │
│  地形类                                             │
│  ├── 巨石、珊瑚、沙漠水井                           │
│  ├── 铁矿石、废弃矿井                              │
│  └── 需要: HugeFungusFeature, GeodeFeature          │
│                                                     │
│  结构类                                             │
│  ├── 村庄、沙漠水井、要塞                          │
│  └── 需要: StructureFeature                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 特征的工作流程

```
┌─────────────────────────────────────────────────────┐
│              特征生成流程                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  配置特征 (ConfiguredFeature)                       │
│  ─────────────────────────────────────────────      │
│  • 定义"生成什么东西"                                 │
│  • 定义"生成的具体参数"                               │
│  • 例如：铜矿石，每次生成 8-12 块                    │
│                                                     │
│           ↓ 注册到 ConfiguredFeature 注册表          │
│                                                     │
���  放置特征 (PlacedFeature)                          │
│  ─────────────────────────────────────────────      │
│  • 定义"在哪里生成"                                   │
│  • 定义"生成的高度范围"                               │
│  • 定义"生成的尝试次数"                              │
│  • 例如：在 Y=0 到 16 之间，尝试 9 次               │
│                                                     │
│           ↓ 注册到 PlacedFeature 注册表             │
│                                                     │
│  生物群系 (Biome)                                   │
│  ─────────────────────────────────────────────      │
│  • 定义"在哪些生物群系生成"                           │
│  • 定义"在哪个阶段生成"                              │
│  • 例如：在平原的地下矿石层生成                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.3 生成阶段

特征在不同的生成阶段被放置：

```java
import net.fabricmc.fabric.api.biome.v1.GenerationStep;

// 生成阶段（按执行顺序）
GenerationStep.Feature.values():
│
├── SURFACE_STRUCTURES    // 地表结构（村庄、沙漠水井）
├── UNDERGROUND_STRUCTURES // 地下结构（矿井、地牢）
├── UNDERGROUND_ORES      // 地下矿石
├── UNDERGROUND_DECORATION // 地下装饰（洞穴内）
├── VEGETAL_DECORATION    // 植被装饰（树木、花草）
├── TOP_LAYER_SURFACE     // 表层（雪、菌丝）
└── FLUID_SURFACE         // 地表液体（熔岩、水）
```

---

## 2. 配置特征 (ConfiguredFeature)

### 2.1 什么是配置特征

配置特征定义了要生成什么以及如何生成：

```java
// 简单的配置特征示例
ConfiguredFeature<OreFeature, Void> myOre = new ConfiguredFeature<>(
    Feature.ORE,  // 特征类型：矿石
    new OreFeature.Config(
        new BlockStateRuleTestProvider(Blocks.STONE.getDefaultState()), // 在石头中生成
        Blocks.DIAMOND_ORE.getDefaultState(),  // 生成钻石矿石
        8  // 每区块尝试生成 8 次
    )
);
```

### 2.2 常用配置特征类型

```java
import net.minecraft.world.gen.feature.*;

// 矿石配置
OreFeature.Config(
    RuleTestProvider state,  // 什么方块中可以生成
    BlockStateProvider block, // 生成什么方块
    int count               // 每次生成多少块
)

// 散布特征配置（用于花、草等）
ScatterableFeatureConfig(
    BlockStateProvider block, // 要散布的方块
    int count,               // 散布数量
    int reach,               // 散布范围
    int sparse              // 稀疏度（跳过数量）
)

// 树木配置
TreeFeatureConfig(
    BlockStateProvider trunk,     // 树干方块
    BlockStateProvider leaves,   // 树叶方块
    int baseHeight,              // 树干基础高度
    int heightOffset,            // 高度偏移
    List<TreeDecorator> decorators // 装饰器（果实、蜂窝等）
)
```

### 2.3 完整的配置特征示例

```java
package net.example.mymod.feature;

import net.minecraft.block.Blocks;
import net.minecraft.block.RuleTestProvider;
import net.minecraft.state.rule.BlockStateRuleTestProvider;
import net.minecraft.world.gen.feature.OreFeature;
import net.minecraft.world.gen.feature.OreFeatureConfig;
import net.minecraft.world.gen.feature.TreeFeature;
import net.minecraft.world.gen.feature.TreeFeatureConfig;
import net.minecraft.world.gen.feature.ConfiguredFeature;
import net.minecraft.state provider.BlockProviders;
import net.minecraft.util.math.intprovider.UniformIntProvider;

public class ModConfiguredFeatures {
    
    // ========================================
    // 矿石类
    // ========================================
    
    // 自定义蓝宝石矿石
    public static final ConfiguredFeature<OreFeature, OreFeatureConfig> SAPPHIRE_ORE = 
        new ConfiguredFeature<>(
            Feature.ORE,
            new OreFeatureConfig(
                new BlockStateRuleTestProvider(Blocks.STONE.getDefaultState()),  // 在石头中
                Blocks.DIAMOND_ORE.getDefaultState(),  // 使用钻石矿石纹理（你也可以用自定义方块）
                6  // 每次生成 6 块
            )
        );
    
    // ========================================
    // 树木类
    // ========================================
    
    // 水晶树
    public static final ConfiguredFeature<TreeFeature, TreeFeatureConfig> CRYSTAL_TREE = 
        new ConfiguredFeature<>(
            Feature.TREE,
            new TreeFeatureConfig.Builder(
                BlockProviders.staticProvider(Blocks.CRYSTAL_LOG),        // 树干
                BlockProviders.staticProvider(Blocks.CRYSTAL_LEAVES),     // 树叶
                UniformIntProvider.create(4, 6),   // 高度 4-6
                UniformIntProvider.create(0, 2),  // 变化 0-2
                new LightTreeDecorator(           // 光源装饰器（使树叶发光）
                    BlockProviders.staticProvider(Blocks.GLOWSTONE)
                )
            ).build()
        );
}
```

---

## 3. 放置特征 (PlacedFeature)

### 3.1 什么是放置特征

放置特征定义了特征在哪里生成：

```java
// 放置特征示例
PlacedFeature myOrePlacement = new PlacedFeature(
    RegistryKey.of(RegistryKeys.CONFIGURED_FEATURE, id),  // 引用配置特征
    List.of(
        // 放置修饰器（PlacementModifier）
        HeightRangePlacementModifier.uniform(
            UniformIntProvider.create(0, 16),  // Y 轴范围
        ),
        CountPlacementModifier.create(8),       // 尝试 8 次
        RoundedRangePlacementModifier.create(   // 水平散布范围
            UniformIntProvider.create(0, 6)
        )
    )
);
```

### 3.2 放置修饰器类型

```java
import net.minecraft.world.gen.placementmodifier.*;

// 数量修饰器
CountPlacementModifier.create(10)           // 生成 10 次
CountPlacementModifier.of(10, 20)           // 生成 10-20 次
SquarePlacementModifier.create()             // 方形分布

// 高度修饰器
HeightRangePlacementModifier.uniform(
    UniformIntProvider.create(0, 64)         // Y: 0-64
)
HeightRangePlacementModifier.trapezoid(
    UniformIntProvider.create(8, 32)         // 梯形分布
)
HeightRangePlacementModifier.of(
    IntProvider.Constant.of(10)              // 固定高度 Y=10
)

// 生物群系修饰器
BiomePlacementModifier.create()             // 只在选择的生物群系生成

// 随机散布修饰器
RandomOffsetPlacementModifier.create(      // 随机偏移
    IntProvider.Constant.of(0),
    IntProvider.Constant.of(0)
)

// 层级修饰器（用于多层生成）
DepthAveragePlacementModifier.create(      // 深度平均
    IntProvider.Constant.of(10),            // 基础深度
    IntProvider.Constant.of(4)               // 散布范围
)
```

### 3.3 放置特征示例

```java
package net.example.mymod.feature;

import net.minecraft.world.gen.placementmodifier.*;
import net.minecraft.world.gen.feature.PlacedFeature;
import net.minecraft.util.math.intprovider.UniformIntProvider;

public class ModPlacedFeatures {
    
    // 蓝宝石矿石放置配置
    public static PlacedFeature SAPPHIRE_ORE = new PlacedFeature(
        ModConfiguredFeatures.SAPPHIRE_ORE.getRegistryKey(),  // 引用配置特征
        List.of(
            // 方形分布
            SquarePlacementModifier.create(),
            // 高度范围：Y=0 到 16
            HeightRangePlacementModifier.uniform(
                UniformIntProvider.create(0, 16)
            ),
            // 每区块尝试生成 8 次
            CountPlacementModifier.create(8)
        )
    );
    
    // 水晶树放置配置
    public static PlacedFeature CRYSTAL_TREE = new PlacedFeature(
        ModConfiguredFeatures.CRYSTAL_TREE.getRegistryKey(),
        List.of(
            SquarePlacementModifier.create(),
            // 高度范围：Y=32 到 128
            HeightRangePlacementModifier.uniform(
                UniformIntProvider.create(32, 128)
            ),
            // 每区块尝试 5 次
            CountPlacementModifier.of(5, 7),
            // 在表面生成（不是地下）
            SurfacePlacementModifier.create()
        )
    );
}
```

---

## 4. 创建自定义矿石

### 4.1 矿石的结构

```
┌─────────────────────────────────────────────────────┐
│              矿石生成过程                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. 配置特征 (ConfiguredFeature)                    │
│     • 在石头/深层石头/下界岩中生成                   │
│     • 生成钻石矿石方块                              │
│     • 每次生成 4-8 块                               ��
│                                                     │
│  2. 放置特征 (PlacedFeature)                        │
│     • 高度范围：Y=0 到 16                           │
│     • 每区块尝试生成 7 次                           │
│     • 方形分布                                      │
│                                                     │
│  3. 注册                                            │
│     • 注册到 ConfiguredFeature 注册表               │
│     • 注册到 PlacedFeature 注册表                  │
│     • 添加到生物群系                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 代码实现

```java
package net.example.mymod.feature;

import net.example.mymod.Mymod;
import net.minecraft.block.Blocks;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.util.Identifier;
import net.minecraft.world.gen.feature.Feature;
import net.minecraft.world.gen.feature.OreFeature;
import net.minecraft.world.gen.feature.OreFeatureConfig;
import net.minecraft.world.gen.feature.PlacedFeature;
import net.minecraft.world.gen.placementmodifier.HeightRangePlacementModifier;
import net.minecraft.world.gen.placementmodifier.CountPlacementModifier;
import net.minecraft.world.gen.placementmodifier.SquarePlacementModifier;
import net.minecraft.state.rule.BlockStateRuleTestProvider;
import net.minecraft.state.provider.BlockProviders;
import net.minecraft.util.math.intprovider.UniformIntProvider;

import java.util.List;

public class ModOres {
    
    // 注册键
    public static final RegistryKey<PlacedFeature> SAPPHIRE_ORE = 
        RegistryKey.of(
            Registries.PLACED_FEATURE,
            Identifier.of(Mymod.MOD_ID, "sapphire_ore")
        );
    
    public static ConfiguredFeature<?, ?> SAPPHIRE_ORE_CONFIGURED = 
        new ConfiguredFeature<>(
            Feature.ORE,
            new OreFeatureConfig(
                // 在石头中生成（也可以用 DeepslateRuleTestProvider 替代）
                new BlockStateRuleTestProvider(Blocks.STONE.getDefaultState()),
                // 生成钻石矿石（你需要创建自定义方块）
                BlockProviders.staticProvider(Blocks.DIAMOND_ORE),
                // 每次生成 6 块
                6
            )
        );
    
    public static PlacedFeature SAPPHIRE_ORE_PLACED = new PlacedFeature(
        RegistryKey.of(
            Registries.CONFIGURED_FEATURE,
            Identifier.of(Mymod.MOD_ID, "sapphire_ore")
        ),
        List.of(
            SquarePlacementModifier.create(),
            HeightRangePlacementModifier.uniform(
                UniformIntProvider.create(0, 16)  // Y=0 到 16
            ),
            CountPlacementModifier.create(7)      // 尝试 7 次
        )
    );
}
```

### 4.3 注册特征

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.feature.ModOres;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.SimpleRegistry;

public class ModFeatureRegistry {
    
    public static void register() {
        // 注册配置特征
        var configuredRegistry = new SimpleRegistry<>(
            RegistryKeys.CONFIGURED_FEATURE,
            net.minecraft.util.Util.createEmpty()
        );
        
        // 注意：在 Fabric 1.20+ 中，这会自动处理
        // 你只需要在 onInitialize 中确保特征被引用
        
        Mymod.LOGGER.info("特征注册完成");
    }
}
```

---

## 5. 创建自定义树木

### 5.1 树木的组成

```
┌─────────────────────────────────────────────────────┐
│              树木生成过程                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  树干 (Trunk)                                       │
│  └── 从地面向上生成 4-6 格                          │
│                                                     │
│  树叶 (Leaves)                                      │
│  └── 包裹树干顶部，形成树冠                          │
│                                                     │
│  装饰器 (Decorators)                                │
│  ├── 果实装饰器：在树叶上附加苹果                   │
│  ├── 蜂窝装饰器：在树叶上附加蜂窝                   │
│  └── 位置装饰器：调整生成位置                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 简单树木配置

```java
import net.minecraft.world.gen.feature.TreeFeatureConfig;
import net.minecraft.state.provider.BlockProviders;
import net.minecraft.util.math.intprovider.UniformIntProvider;
import net.minecraft.world.gen.feature.LightTreeDecorator;
import net.minecraft.world.gen.feature.SimpleBlockFeatureConfig;

// 创建简单的橡树配置
TreeFeatureConfig simpleTree = new TreeFeatureConfig.Builder(
    // 树干：使用原木
    BlockProviders.staticProvider(Blocks.OAK_LOG),
    // 树叶：使用树叶
    BlockProviders.staticProvider(Blocks.OAK_LEAVES),
    // 高度：4 到 6 格
    UniformIntProvider.create(4, 6),
    // 高度偏移：0 到 2
    UniformIntProvider.create(0, 2),
    // 底部树叶装饰器
    new LightTreeDecorator(
        BlockProviders.staticProvider(Blocks.GLOWSTONE)
    )
).build();
```

### 5.3 自定义树木示例

```java
package net.example.mymod.feature;

import net.minecraft.block.Blocks;
import net.minecraft.world.biome.BiomeKeys;
import net.minecraft.world.gen.feature.*;
import net.minecraft.world.gen.feature.TreeFeatureConfig;
import net.minecraft.state.provider.BlockProviders;
import net.minecraft.util.math.intprovider.UniformIntProvider;
import net.minecraft.util.Identifier;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;

public class ModTrees {
    
    // 水晶树 - 带发光效果的魔法树
    public static final ConfiguredFeature<TreeFeature, TreeFeatureConfig> CRYSTAL_TREE = 
        new ConfiguredFeature<>(
            Feature.TREE,
            new TreeFeatureConfig.Builder(
                // 树干：使用紫色原木（你需要创建自定义方块）
                BlockProviders.staticProvider(Blocks.PURPLE_WOOD),
                // 树叶：使用发光树叶
                BlockProviders.staticProvider(Blocks.OAK_LEAVES),  // 或者自定义发光树叶
                // 高度 5-7 格
                UniformIntProvider.create(5, 7),
                // 高度偏移 0-2
                UniformIntProvider.create(0, 2),
                // 没有特殊装饰器
                new LightTreeDecorator(
                    BlockProviders.staticProvider(Blocks.GLOWSTONE)
                )
            )
            .ignoreVines()  // 忽略藤蔓
            .build()
        );
    
    // 注册键
    public static final RegistryKey<PlacedFeature> CRYSTAL_TREE_KEY = 
        RegistryKey.of(
            Registries.PLACED_FEATURE,
            Identifier.of("mymod", "crystal_tree")
        );
    
    // 放置配置
    public static final PlacedFeature CRYSTAL_TREE_PLACED = new PlacedFeature(
        RegistryKey.of(
            Registries.CONFIGURED_FEATURE,
            Identifier.of("mymod", "crystal_tree")
        ),
        List.of(
            SquarePlacementModifier.create(),
            HeightRangePlacementModifier.uniform(
                UniformIntProvider.create(32, 96)  // Y: 32-96
            ),
            CountPlacementModifier.of(5, 7),       // 尝试 5-7 次
            SurfacePlacementModifier.create()      // 在表面生成
        )
    );
}
```

---

## 6. 创建自定义草丛

### 6.1 散布特征

草丛、花朵等使用散布特征（Scatterable Feature）：

```java
import net.minecraft.world.gen.feature.ScatterableFeatureConfig;

// 创建草丛配置
ScatterableFeatureConfig grassConfig = new ScatterableFeatureConfig(
    // 要散布的方块
    BlockProviders.staticProvider(Blocks.GRASS),  // 或者自定义方块
    // 散布数量
    32,
    // 散布范围
    7,
    // 稀疏度（越大越稀疏）
    3
);
```

### 6.2 花朵配置

```java
// 创建花丛配置
ConfiguredFeature<ScatterableFeatureConfig, ScatterableFeature> FLOWERS = 
    new ConfiguredFeature<>(
        Feature.FLOWER,
        new ScatterableFeatureConfig(
            BlockProviders.staticProvider(Blocks.DANDELION),
            64,  // 数量
            6,   // 范围
            3    // 稀疏
        )
    );

// 放置配置
PlacedFeature FLOWER_PLACED = new PlacedFeature(
    ConfiguredFeatureKey,
    List.of(
        SquarePlacementModifier.create(),
        HeightRangePlacementModifier.of(
            IntProvider.Constant.of(0)  // 从 Y=0 开始
        ),
        CountPlacementModifier.create(32),
        SurfacePlacementModifier.create()  // 在表面
    )
);
```

---

## 7. 添加到生物群系

### 7.1 使用 Fabric API 添加特征

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
    
    public static void addFeaturesToBiomes() {
        // ========================================
        // 添加矿石
        // ========================================
        
        // 在所有主世界生物群系添加蓝宝石矿石
        BiomeModifications.addFeature(
            BiomeSelectors.foundInOverworld(),  // 主世界
            GenerationStep.Feature.UNDERGROUND_ORES,  // 矿石阶段
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "sapphire_ore")
            )
        );
        
        // ========================================
        // 添加树木
        // ========================================
        
        // 只在森林添加水晶树
        BiomeModifications.addFeature(
            BiomeSelectors.includeByKey(BiomeKeys.FOREST),
            GenerationStep.Feature.VEGETAL_DECORATION,  // 植被阶段
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "crystal_tree")
            )
        );
        
        // ========================================
        // 添加草丛
        // ========================================
        
        // 在平原添加自定义草丛
        BiomeModifications.addFeature(
            BiomeSelectors.includeByKey(BiomeKeys.PLAINS),
            GenerationStep.Feature.VEGETAL_DECORATION,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "custom_grass")
            )
        );
    }
}
```

### 7.2 完整示例

```java
// 同时添加多个特征到多个生物群系
private static void addMultipleFeatures() {
    // 在所有生物群系添加基础矿石
    for (var biomeKey : new RegistryKey[]{
        BiomeKeys.PLAINS,
        BiomeKeys.FOREST,
        BiomeKeys.DESERT,
        BiomeKeys.MOUNTAINS,
        BiomeKeys.SWAMP
    }) {
        BiomeModifications.addFeature(
            BiomeSelectors.includeByKey(biomeKey),
            GenerationStep.Feature.UNDERGROUND_ORES,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "sapphire_ore")
            )
        );
    }
}
```

---

## 8. 完整示例

### 8.1 项目结构

```
src/main/java/net/example/mymod/
├── Mymod.java
├── feature/
│   ├── ModOres.java              # 矿石特征
│   ├── ModTrees.java             # 树木特征
│   └── ModFlowers.java           # 花草特征
└── world/
    └── ModWorldGeneration.java   # 世界生成配置
```

### 8.2 完整代码

**Mymod.java**:
```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.world.ModWorldGeneration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始初始化 {}", MOD_ID);
        
        // 配置世界生成
        ModWorldGeneration.addFeaturesToBiomes();
        
        LOGGER.info("{} 初始化完成", MOD_ID);
    }
}
```

**ModOres.java** (简化版):
```java
package net.example.mymod.feature;

import net.minecraft.world.gen.feature.Feature;
import net.minecraft.world.gen.feature.OreFeature;
import net.minecraft.world.gen.feature.OreFeatureConfig;
import net.minecraft.world.gen.feature.PlacedFeature;
import net.minecraft.world.gen.feature.ConfiguredFeature;
import net.minecraft.world.gen.placementmodifier.*;
import net.minecraft.state.rule.BlockStateRuleTestProvider;
import net.minecraft.state.provider.BlockProviders;
import net.minecraft.util.math.intprovider.UniformIntProvider;
import net.minecraft.util.Identifier;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.block.Blocks;

import java.util.List;

public class ModOres {
    
    // 配置特征 - 蓝宝石矿石
    public static final ConfiguredFeature<OreFeature, OreFeatureConfig> SAPPHIRE_ORE = 
        new ConfiguredFeature<>(
            Feature.ORE,
            new OreFeatureConfig(
                new BlockStateRuleTestProvider(Blocks.STONE.getDefaultState()),
                BlockProviders.staticProvider(Blocks.DIAMOND_ORE),  // 用钻石矿石作为示例
                6
            )
        );
    
    // 放置特征 - 蓝宝石矿石
    public static final PlacedFeature SAPPHIRE_ORE_PLACED = new PlacedFeature(
        RegistryKey.of(
            Registries.CONFIGURED_FEATURE,
            Identifier.of("mymod", "sapphire_ore")
        ),
        List.of(
            SquarePlacementModifier.create(),
            HeightRangePlacementModifier.uniform(
                UniformIntProvider.create(0, 16)
            ),
            CountPlacementModifier.create(7)
        )
    );
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
    
    public static void addFeaturesToBiomes() {
        // 在主世界添加蓝宝石矿石
        BiomeModifications.addFeature(
            BiomeSelectors.foundInOverworld(),
            GenerationStep.Feature.UNDERGROUND_ORES,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "sapphire_ore")
            )
        );
        
        // 在平原添加额外树木
        BiomeModifications.addFeature(
            BiomeSelectors.includeByKey(BiomeKeys.PLAINS),
            GenerationStep.Feature.VEGETAL_DECORATION,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "extra_trees")
            )
        );
        
        // 在山地添加铁矿石
        BiomeModifications.addFeature(
            BiomeSelectors.includeByKey(BiomeKeys.MOUNTAINS),
            GenerationStep.Feature.UNDERGROUND_ORES,
            RegistryKey.of(
                Registries.PLACED_FEATURE,
                Identifier.of("mymod", "iron_ore_high")
            )
        );
    }
}
```

---

## 小结

在这一章中，你学会了：

1. **特征系统概述** - 理解特征的工作流程
2. **配置特征** - 定义生成什么
3. **放置特征** - 定义在哪里生成
4. **创建自定义矿石** - 完整的矿石实现
5. **创建自定义树木** - 树木生成
6. **创建自定义草丛** - 花草生成
7. **添加到生物群系** - 使用 Fabric API

---

## 下一步

现在你已经学会了世界特征的所有基础知识！接下来可以学习：

- [第二章：创建自定义生物群系](./02-custom-biome.md) - 创建完整的生物群系
- [第一章：生物群系简介](./01-biome-intro.md) - 回顾基础知识

---

> **常见问题**
>
> **Q: 特征没有生成？**
> - 检查特征是否正确注册
> - 确认放置修饰器配置正确
> - 验证是否添加到正确的生物群系和生成阶段
> - 使用 `/reload` 重载并检查
>
> **Q: 矿石生成太多/太少？**
> - 调整 `CountPlacementModifier` 的参数
> - 调整高度范围
>
> **Q: 树木生成位置不对？**
> - 使用 `SurfacePlacementModifier` 确保在表面生成
> - 检查高度范围是否正确
>
> **Q: 如何创建自定义方块作为特征？**
> - 先创建自定义方块
> - 在 `BlockProviders.staticProvider(yourBlock)` 中使用它
