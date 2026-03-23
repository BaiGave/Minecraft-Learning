# Fabric API 生物群系与维度系统分析

## 概述

生物群系与维度系统包含两个核心模块：
- `fabric-biome-api-v1` - 添加、修改生物群系
- `fabric-dimensions-v1` - 维度数据处理

---

## 1. fabric-biome-api-v1 模块

### 1.1 核心 API

#### BiomeModifications - 生物群系修改入口

```java
public final class BiomeModifications {
    // 添加特征到指定生物群系
    public static void addFeature(Predicate<BiomeSelectionContext> biomeSelector,
                                 GenerationStep.Feature step,
                                 RegistryKey<PlacedFeature> placedFeatureRegistryKey)

    // 添加雕刻器到指定生物群系
    public static void addCarver(Predicate<BiomeSelectionContext> biomeSelector,
                                GenerationStep.Carver step,
                                RegistryKey<ConfiguredCarver<?>> configuredCarverKey)

    // 添加实体生成到指定生物群系
    public static void addSpawn(Predicate<BiomeSelectionContext> biomeSelector,
                              SpawnGroup spawnGroup, EntityType<?> entityType,
                              int weight, int minGroupSize, int maxGroupSize)

    // 创建新的生物群系修改器
    public static BiomeModification create(Identifier id)
}
```

#### ModificationPhase - 修改阶段

```java
public enum ModificationPhase {
    ADDITIONS,      // 添加阶段 - 添加矿石、植被、结构等
    REMOVALS,       // 移除阶段 - 移除生成物
    REPLACEMENTS,   // 替换阶段 - 替换现有特征
    POST_PROCESSING  // 后处理阶段 - 全局后处理
}
```

### 1.2 生物群系选择器

```java
public final class BiomeSelectors {
    public static Predicate<BiomeSelectionContext> all()
    public static Predicate<BiomeSelectionContext> vanilla()
    public static Predicate<BiomeSelectionContext> foundInTheNether()
    public static Predicate<BiomeSelectionContext> foundInTheEnd()
    public static Predicate<BiomeSelectionContext> foundInOverworld()
    public static Predicate<BiomeSelectionContext> tag(TagKey<Biome> tag)
    public static Predicate<BiomeSelectionContext> excludeByKey(Collection<RegistryKey<Biome>> keys)
    public static Predicate<BiomeSelectionContext> includeByKey(Collection<RegistryKey<Biome>> keys)
}
```

### 1.3 下界生物群系 API

```java
public final class NetherBiomes {
    public static void addNetherBiome(RegistryKey<Biome> biome,
                                       MultiNoiseUtil.NoiseValuePoint mixedNoisePoint)
    public static void addNetherBiome(RegistryKey<Biome> biome,
                                       MultiNoiseUtil.NoiseHypercube mixedNoisePoint)
    public static boolean canGenerateInNether(RegistryKey<Biome> biome)
}
```

### 1.4 末地生物群系 API

```java
public final class TheEndBiomes {
    public static void addMainIslandBiome(RegistryKey<Biome> biome, double weight)
    public static void addHighlandsBiome(RegistryKey<Biome> biome, double weight)
    public static void addSmallIslandsBiome(RegistryKey<Biome> biome, double weight)
    public static void addMidlandsBiome(RegistryKey<Biome> highlands,
                                         RegistryKey<Biome> midlands, double weight)
    public static void addBarrensBiome(RegistryKey<Biome> highlands,
                                        RegistryKey<Biome> barrens, double weight)
}
```

---

## 2. fabric-dimensions-v1 模块

### 2.1 主要功能

维度 API 主要处理维度相关的数据兼容性问题，特别是升级包含模组自定义生成器的存档时。

### 2.2 FailSoftMapCodec - 容错地图编解码器

```java
public record FailSoftMapCodec<K, V>(Codec<K> keyCodec, Codec<V> elementCodec)
        implements BaseMapCodec<K, V>, Codec<Map<K, V>> {
    @Override
    public <T> DataResult<Map<K, V>> decode(DynamicOps<T> ops, MapLike<T> input) {
        // 解码时如果某个条目失败，记录错误但继续处理其他条目
        // 解决卸载模组后无法加载存档的问题
    }
}
```

---

## 3. 世界生成集成

### 3.1 修改执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                    MinecraftServer 启动                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MinecraftServerMixin.finalizeWorldGen()         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BiomeModificationImpl.finalizeWorldGen()        │
│                                                              │
│  1. 按 RegistryKey 排序所有生物群系                           │
│  2. 对每个生物群系:                                          │
│     a) 创建 BiomeSelectionContext                             │
│     b) 测试选择器条件                                        │
│     c) 按阶段顺序应用修改器                                   │
│  3. 冻结修改后的数据                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Mixin 注入点

| Mixin 类 | 目标类 | 用途 |
|----------|--------|------|
| `MinecraftServerMixin` | `MinecraftServer` | 触发 finalizeWorldGen |
| `BiomeSourceMixin` | `BiomeSource` | 修改生物群系获取 |
| `TheEndBiomeSourceMixin` | `TheEndBiomeSource` | 末地生物群系加权选择 |
| `DynamicRegistryManagerImmutableImplMixin` | 注册表管理器 | 标记已修改 |
| `ChunkNoiseSamplerMixin` | `ChunkNoiseSampler` | 噪声采样器扩展 |
| `TaggedChoiceTypeMixin` | `TaggedChoiceType` | 维度生成器容错 |

---

## 5. 使用示例

### 5.1 添加矿石到所有主世界生物群系

```java
BiomeModifications.addFeature(
    BiomeSelectors.foundInOverworld(),
    GenerationStep.Feature.UNDERGROUND_ORES,
    RegistryKey.of(RegistryKeys.PLACED_FEATURE,
        Identifier.of("mymod", "diamond_ore_deposit"))
);
```

### 5.2 修改生物群系属性

```java
BiomeModifications.create(Identifier.of("mymod", "cold_plains"))
    .add(ModificationPhase.ADDITIONS,
        BiomeSelectors.includeByKey(BiomeKeys.PLAINS),
        context -> {
            // 将草原的温度降低
            context.getWeather().setTemperature(0.3f);
            context.getWeather().setDownfall(0.2f);
        })
    .add(ModificationPhase.POST_PROCESSING,
        BiomeSelectors.foundInOverworld(),
        context -> {
            // 将所有主世界生物群系的天空颜色改为红色
            context.getEffects().setSkyColor(0xFF0000);
        });
```

### 5.3 添加下界生物群系

```java
NetherBiomes.addNetherBiome(
    RegistryKey.of(RegistryKeys.BIOME, Identifier.of("mymod", "crystal_caves")),
    MultiNoiseUtil.createNoiseHypercube(
        0.0F, 0.5F,  // temperature, humidity
        0.0F, 0.0F,  // continentalness, erosion
        0.0F, 0.0F,  // depth, weirdness
        0.1F          // offset
    )
);
```

### 5.4 添加末地生物群系

```java
// 添加自定义高地生物群系
TheEndBiomes.addHighlandsBiome(
    RegistryKey.of(RegistryKeys.BIOME, Identifier.of("mymod", "crystal_plains")),
    5.0  // weight
);

// 为该高地添加附属的中地
TheEndBiomes.addMidlandsBiome(
    RegistryKey.of(RegistryKeys.BIOME, Identifier.of("mymod", "crystal_plains")),
    RegistryKey.of(RegistryKeys.BIOME, Identifier.of("mymod", "crystal_midlands")),
    10.0
);
```

---

## 架构总结

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mod Developer API                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ BiomeModifications│  │   NetherBiomes   │  │ TheEndBiomes │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           └─────────────────────┴────────────────────┘          │
│                                 │                               │
│                    ┌────────────┴────────────┐                 │
│                    │   BiomeModification      │                 │
│                    └────────────┬────────────┘                 │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────┐
│                     Implementation Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              BiomeModificationImpl                         │  │
│  │  - addModifier()                                          │  │
│  │  - finalizeWorldGen()                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

*源码位置: `fabric-biome-api-v1/`, `fabric-dimensions-v1/`*
