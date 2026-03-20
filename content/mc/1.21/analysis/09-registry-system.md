# Minecraft 1.21 注册表（Registry）系统分析

## 目录
1. [概述](#概述)
2. [核心接口](#核心接口)
3. [注册表实现](#注册表实现)
4. [RegistryKey 资源定位符](#registrykey-资源定位符)
5. [RegistryEntry 注册表条目](#registryentry-注册表条目)
6. [标签系统](#标签系统)
7. [内置注册表](#内置注册表)
8. [动态注册表](#动态注册表)
9. [序列化机制](#序列化机制)
10. [客户端服务端同步](#客户端服务端同步)
11. [关键代码引用](#关键代码引用)

---

## 概述

Minecraft 的注册表系统是游戏的核心数据管理框架，用于注册和组织游戏中的各种元素（方块、物品、实体、附魔等）。该系统采用层次化设计，支持静态注册（内置）和动态注册（数据包）。

**核心设计原则：**
- **单例模式**：每种游戏元素类型只有一个全局注册表
- **三层标识**：Identifier → RegistryKey → RegistryEntry
- **冻结机制**：静态注册表在初始化后冻结，防止运行时修改
- **生命周期追踪**：记录注册表内容的生命周期状态

---

## 核心接口

### 2.1 Registry 接口

**核心文件：** `..../source/net/minecraft/registry/Registry.java`

```java
167:478:..../source/net/minecraft/registry/Registry.java
public interface Registry<T>
extends Keyable,
IndexedIterable<T> {
    
    // 获取注册表键
    RegistryKey<? extends Registry<T>> getKey();
    
    // 获取编解码器
    Codec<T> getCodec();
    
    // 根据ID获取值
    @Nullable T get(@Nullable Identifier id);
    
    // 根据键获取值
    @Nullable T get(@Nullable RegistryKey<T> key);
    
    // 根据原始ID获取值
    int getRawId(@Nullable T value);
    
    // 获取值对应的键
    Optional<RegistryKey<T>> getKey(T value);
    
    // 获取ID
    @Nullable Identifier getId(T value);
    
    // 检查是否包含
    boolean contains(RegistryKey<T> key);
    boolean containsId(Identifier id);
    
    // 冻结注册表
    Registry<T> freeze();
    
    // 创建引用条目
    RegistryEntry.Reference<T> createEntry(T value);
}
```

### 2.2 MutableRegistry 接口

```java
public interface MutableRegistry<T> extends Registry<T> {
    
    // 添加元素
    RegistryEntry.Reference<T> add(
        RegistryKey<T> key, 
        T value, 
        RegistryEntryInfo info
    );
}
```

### 2.3 RegistryEntry 接口

```java
// RegistryEntry - 条目接口
public interface RegistryEntry<T> {
    
    // 获取类型
    RegistryEntryOwner<T> getOwner();
    
    // 获取键
    RegistryKey<T> registryKey();
    
    // 检查匹配
    boolean matches(RegistryKey<T> key);
    boolean isIn(TagKey<T> tag);
    
    // 转换为引用
    Reference<T> toReference();
}
```

### 2.4 RegistryEntry.Reference 引用条目

```java
// Reference - 引用条目实现
public static class Reference<T>
implements RegistryEntry<T> {
    
    private final RegistryEntryOwner<T> owner;
    private RegistryKey<T> registryKey;
    private final T value;
    
    @Override
    public RegistryKey<T> registryKey() {
        return registryKey;
    }
    
    @Override
    public T value() {
        return value;
    }
    
    // 引用解引用
    public T getReferenceValue() {
        return value;
    }
}
```

---

## 注册表实现

### 3.1 SimpleRegistry

**核心文件：** `..../source/net/minecraft/registry/SimpleRegistry.java`

```java
50:360:..../source/net/minecraft/registry/SimpleRegistry.java
public class SimpleRegistry<T>
implements MutableRegistry<T> {
    
    // 注册表键
    final RegistryKey<? extends Registry<T>> key;
    
    // 原始ID到条目的映射
    private final ObjectList<RegistryEntry.Reference<T>> rawIdToEntry;
    
    // 值到原始ID的映射
    private final Reference2IntMap<T> entryToRawId;
    
    // ID到条目的映射
    private final Map<Identifier, RegistryEntry.Reference<T>> idToEntry;
    
    // 键到条目的映射
    private final Map<RegistryKey<T>, RegistryEntry.Reference<T>> keyToEntry;
    
    // 值到条目的映射
    private final Map<T, RegistryEntry.Reference<T>> valueToEntry;
    
    // 生命周期
    private Lifecycle lifecycle;
    
    // 冻结状态
    private boolean frozen;
    
    // 标签映射
    private volatile Map<TagKey<T>, RegistryEntryList.Named<T>> tagToEntryList;
}
```

### 3.2 DefaultedRegistry

提供默认值支持的注册表：

```java
// DefaultedRegistry - 带默认值的注册表
public class DefaultedRegistry<T>
extends SimpleRegistry<T> {
    
    private final Identifier defaultId;
    private final RegistryEntry.Reference<T> defaultEntry;
    
    // 获取值，未找到时返回默认值
    @Override
    public T get(@Nullable Identifier id) {
        T value = super.get(id);
        return value != null ? value : this.getDefaultValue();
    }
    
    // 获取默认值
    private T getDefaultValue() {
        return this.defaultEntry.value();
    }
}
```

### 3.3 注册流程

```java
// 注册元素
public static <V, T extends V> T register(
    Registry<V> registry, 
    RegistryKey<V> key, 
    T entry
) {
    // 调用可变注册表的add方法
    ((MutableRegistry)registry).add(key, entry, RegistryEntryInfo.DEFAULT);
    return entry;
}

// add 方法实现
public RegistryEntry.Reference<T> add(
    RegistryKey<T> key, 
    T value, 
    RegistryEntryInfo info
) {
    // 检查是否冻结
    assertNotFrozen(key);
    
    // 检查重复键
    if (idToEntry.containsKey(key.getValue())) {
        throw new IllegalStateException("Adding duplicate key");
    }
    
    // 检查重复值
    if (valueToEntry.containsKey(value)) {
        throw new IllegalStateException("Adding duplicate value");
    }
    
    // 创建条目引用
    RegistryEntry.Reference reference = new RegistryEntry.Reference(...);
    
    // 更新所有映射
    keyToEntry.put(key, reference);
    idToEntry.put(key.getValue(), reference);
    valueToEntry.put(value, reference);
    rawIdToEntry.add(reference);
    entryToRawId.put(value, rawId);
    
    // 更新生命周期
    lifecycle = lifecycle.add(info.lifecycle());
    
    return reference;
}
```

---

## RegistryKey 资源定位符

### 4.1 RegistryKey 类

**核心文件：** `..../source/net/minecraft/registry/RegistryKey.java`

```java
23:124:..../source/net/minecraft/registry/RegistryKey.java
public class RegistryKey<T> {
    
    // 注册表键的全局缓存
    private static final ConcurrentMap<RegistryIdPair, RegistryKey<?>> INSTANCES = 
        new MapMaker().weakValues().makeMap();
    
    // 注册表标识符
    private final Identifier registry;
    
    // 值标识符
    private final Identifier value;
    
    // 创建键
    public static <T> RegistryKey<T> of(
        RegistryKey<? extends Registry<T>> registry, 
        Identifier value
    ) {
        return RegistryKey.of(registry.value, value);
    }
    
    // 创建注册表本身的键
    public static <T> RegistryKey<Registry<T>> ofRegistry(Identifier registry) {
        return RegistryKey.of(RegistryKeys.ROOT, registry);
    }
    
    // 获取值标识符
    public Identifier getValue() {
        return value;
    }
    
    // 获取注册表标识符
    public Identifier getRegistry() {
        return registry;
    }
    
    // 类型检查
    public <E> Optional<RegistryKey<E>> tryCast(RegistryKey<? extends Registry<E>> registryRef) {
        return this.isOf(registryRef) ? Optional.of(this) : Optional.empty();
    }
}
```

### 4.2 RegistryKey 使用示例

```java
// 定义一个 RegistryKey
RegistryKey<Block> DIAMOND_BLOCK_KEY = RegistryKey.of(
    Registries.BLOCK_KEY,           // 注册表键
    Identifier.ofVanilla("diamond_block")  // 值标识符
);

// 完整路径: minecraft:diamond_block

// 使用键获取值
Block diamondBlock = Registries.BLOCK.get(DIAMOND_BLOCK_KEY);

// 使用字符串快捷方式
RegistryKey<Block> STONE_KEY = RegistryKey.of(
    RegistryKeys.BLOCK, 
    Identifier.ofVanilla("stone")
);
```

### 4.3 序列化支持

```java
// Codec 序列化
public static <T> Codec<RegistryKey<T>> createCodec(
    RegistryKey<? extends Registry<T>> registry
) {
    return Identifier.CODEC.xmap(
        id -> RegistryKey.of(registry, id),
        RegistryKey::getValue
    );
}

// PacketCodec 网络序列化
public static <T> PacketCodec<ByteBuf, RegistryKey<T>> createPacketCodec(
    RegistryKey<? extends Registry<T>> registry
) {
    return Identifier.PACKET_CODEC.xmap(
        id -> RegistryKey.of(registry, id),
        RegistryKey::getValue
    );
}
```

---

## RegistryEntry 注册表条目

### 5.1 RegistryEntry.Reference 引用条目

引用条目是指向已注册值的条目：

```java
// 获取引用
RegistryEntry.Reference<Block> reference = block.getRegistryEntry();

// 获取值
Block block = reference.value();

// 获取键
RegistryKey<Block> key = reference.registryKey();

// 检查是否引用同一元素
boolean same = reference1 == reference2;
```

### 5.2 直接条目（Direct Entry）

直接条目用于尚未注册的值：

```java
// 创建直接条目
RegistryEntry<Block> directEntry = RegistryEntry.direct(block);

// 检查是否为引用类型
if (entry instanceof RegistryEntry.Reference) {
    // 已注册条目
}
```

### 5.3 生命周期追踪

```java
// RegistryEntryInfo 包含生命周期信息
public class RegistryEntryInfo {
    public static final RegistryEntryInfo DEFAULT = new RegistryEntryInfo(Lifecycle.stable());
    
    private final Lifecycle lifecycle;
    
    public Lifecycle lifecycle() {
        return lifecycle;
    }
}

// 生命周期状态
public enum Lifecycle {
    // 稳定版本
    stable(),
    // 实验版本
    experimental(),
    // 废弃版本
    deprecated(),
    // 包含实验内容
    experimental_worldgen()
}
```

---

## 标签系统

### 6.1 TagKey 标签键

标签提供动态分组功能：

```java
// 定义标签键
TagKey<Block> MINEABLE_PICKAXE = TagKey.of(
    RegistryKeys.BLOCK,
    Identifier.ofVanilla("mineable/pickaxe")
);

// 使用标签
boolean isMineable = block.getRegistryEntry().isIn(MINEABLE_PICKAXE);

// 检查标签
boolean hasTag = Registries.BLOCK.getEntry(block)
    .isIn(TagKey.of(RegistryKeys.BLOCK, id));
```

### 6.2 标签定义

```java
// 在代码中定义标签
public class BlockTags {
    
    // 预定义标签
    public static final TagKey<Block> MINEABLE_PICKAXE = 
        TagKey.of(RegistryKeys.BLOCK, Identifier.ofVanilla("mineable/pickaxe"));
    
    public static final TagKey<Block> NEEDS_DIAMOND_TOOL = 
        TagKey.of(RegistryKeys.BLOCK, Identifier.ofVanilla("needs_diamond_tool"));
    
    public static final TagKey<Block> IMPENETRABLE = 
        TagKey.of(RegistryKeys.BLOCK, Identifier.ofVanilla("enderman_holdable"));
    
    // 更多标签...
}
```

### 6.3 标签在数据包中的定义

```
# minecraft:block/tags/blocks/mineable/pickaxe.json
{
    "replace": false,
    "values": [
        "minecraft:cobblestone",
        "minecraft:stone",
        "minecraft:coal_ore",
        "minecraft:iron_ore",
        "#minecraft:needs_iron_tool",
        "#minecraft:needs_diamond_tool"
    ]
}
```

### 6.4 标签查询

```java
// 获取标签中的所有条目
Optional<RegistryEntryList.Named<Block>> tag = 
    Registries.BLOCK.getEntryList(MINEABLE_PICKAXE);

if (tag.isPresent()) {
    for (RegistryEntry<Block> entry : tag.get()) {
        Block block = entry.value();
        // 处理
    }
}

// 检查条目是否在标签中
boolean inTag = entry.isIn(someTag);

// 获取标签随机条目
Optional<RegistryEntry<Block>> random = 
    Registries.BLOCK.getRandomEntry(tagKey);
```

---

## 内置注册表

### 7.1 Registries 类

**核心文件：** `..../source/net/minecraft/registry/Registries.java`

```java
134:280:..../source/net/minecraft/registry/Registries.java
public class Registries {
    
    // 根注册表（注册表的注册表）
    private static final MutableRegistry<MutableRegistry<?>> ROOT = 
        new SimpleRegistry(
            RegistryKey.ofRegistry(RegistryKeys.ROOT), 
            Lifecycle.stable()
        );
    
    // 游戏事件
    public static final DefaultedRegistry<GameEvent> GAME_EVENT = ...
    
    // 声音事件
    public static final Registry<SoundEvent> SOUND_EVENT = ...
    
    // 流体
    public static final DefaultedRegistry<Fluid> FLUID = ...
    
    // 状态效果
    public static final Registry<StatusEffect> STATUS_EFFECT = ...
    
    // 方块
    public static final DefaultedRegistry<Block> BLOCK = ...
    
    // 物品
    public static final DefaultedRegistry<Item> ITEM = ...
    
    // 实体类型
    public static final DefaultedRegistry<EntityType<?>> ENTITY_TYPE = ...
    
    // 药水
    public static final Registry<Potion> POTION = ...
    
    // 粒子类型
    public static final Registry<ParticleType<?>> PARTICLE_TYPE = ...
    
    // 方块实体类型
    public static final Registry<BlockEntityType<?>> BLOCK_ENTITY_TYPE = ...
    
    // 配方类型
    public static final Registry<RecipeType<?>> RECIPE_TYPE = ...
    
    // 配方序列化器
    public static final Registry<RecipeSerializer<?>> RECIPE_SERIALIZER = ...
    
    // 附魔
    public static final Registry<Enchantment> ENCHANTMENT = ...
    
    // 附魔效果类型
    public static final Registry<EnchantmentEffectComponentType<?>> ENCHANTMENT_EFFECT_TYPE = ...
    
    // 属性
    public static final Registry<EntityAttribute> ATTRIBUTE = ...
}
```

### 7.2 常用注册表

| 注册表 | 键 | 默认值 |
|--------|-----|--------|
| BLOCK | minecraft:block | air |
| ITEM | minecraft:item | air |
| FLUID | minecraft:fluid | empty |
| ENTITY_TYPE | minecraft:entity_type | pig |
| BLOCK_ENTITY_TYPE | minecraft:block_entity_type | furnace |
| ENCHANTMENT | minecraft:enchantment | - |
| POTION | minecraft:potion | - |
| BIOME | minecraft:worldgen/biome | - |
| SOUND_EVENT | minecraft:sound_event | - |

### 7.3 物品注册

```java
// 注册物品
public static final Item DIAMOND = register(
    Registries.ITEM,
    Identifier.ofVanilla("diamond"),
    new Item(new Item.Settings())
);

// 获取物品
Item diamond = Registries.ITEM.get(Identifier.ofVanilla("diamond"));
Item diamond = Registries.ITEM.get(RegistryKeys.ITEM);
```

---

## 动态注册表

### 8.1 动态注册 vs 静态注册

**静态注册表：**
- 值在游戏代码中硬编码
- 初始化后冻结
- 示例：`Registries.BLOCK`, `Registries.ITEM`

**动态注册表：**
- 值可通过数据包添加/替换
- 绑定到特定服务器
- 示例：生物群系、战利品表、进度

### 8.2 DynamicRegistryManager

```java
// 动态注册表管理器
public interface DynamicRegistryManager {
    
    // 获取动态注册表
    <T> Registry<T> get(RegistryKey<Registry<T>> key);
    
    // 获取只读包装器
    RegistryWrapper.Impl<T> getWrapperLookup(RegistryKey<Registry<T>> key);
}

// 使用示例
DynamicRegistryManager manager = world.getDynamicRegistryManager();
Registry<Biome> biomes = manager.get(RegistryKeys.BIOME);
```

### 8.3 服务器/客户端同步

```
┌─────────────────────────────────────────────────────────────────────┐
│                      动态注册表同步流程                                 │
└─────────────────────────────────────────────────────────────────────┘

Server Side                          Client Side
───────────────────────────────────────────────────────────────────────

DynamicRegistryManager                RegistryBundle.S2C
        │                                      │
        │  1. 加载数据包                       │
        │  2. 构建动态注册表                   │
        │                                      │
        ├─────────────────────────────────────> RegistryDataS2CPacket
        │                                      │
        │                              解码并重建动态注册表
        │
        ├─────────────────────────────────────> KnownPacksS2CPacket
        │                                      │
        │                              确认资源包
```

### 8.4 SerializableRegistries

可序列化的动态注册表：

```java
// 可序列化的注册表类型
public class SerializableRegistries {
    
    public static final MapCodec<DynamicRegistryManager> CODEC = ...
    
    // 注册表列表
    public static final List<SerializableRegistries.RegistryEntry> ENTRIES = 
        List.of(
            new RegistryEntry(RegistryKeys.BIOME, ...),
            new RegistryEntry(RegistryKeys.CONFIGURED_CARVER, ...),
            new RegistryEntry(RegistryKeys.CONFIGURED_FEATURE, ...),
            new RegistryEntry(RegistryKeys.CONFIGURED_STRUCTURE_FEATURE, ...),
            new RegistryEntry(RegistryKeys.CONFIGURED_STRUCTURE_POOL, ...),
            new RegistryEntry(RegistryKeys.LOOT_CONDITION_TYPE, ...),
            new RegistryEntry(RegistryKeys.LOOT_FUNCTION_TYPE, ...),
            new RegistryEntry(RegistryKeys.LOOT_NBT_PROVIDER_TYPE, ...),
            new RegistryEntry(RegistryKeys.LOOT_NUMBER_PROVIDER_TYPE, ...),
            new RegistryEntry(RegistryKeys.LOOT_SCORE_PROVIDER_TYPE, ...),
            new RegistryEntry(RegistryKeys.POI_TYPE, ...),
            new RegistryEntry(RegistryKeys.STRUCTURE_PROCESSOR, ...),
            new RegistryEntry(RegistryKeys.STRUCTURE_POOL_ELEMENT, ...),
            new RegistryEntry(RegistryKeys.STRUCTURE_TEMPLATE_POOL, ...),
            new RegistryEntry(RegistryKeys.WORLDGEN_NOISE, ...),
            new RegistryEntry(RegistryKeys.DIMENSION_TYPE, ...),
            new RegistryEntry(RegistryKeys.BIOME_SOURCE, ...),
            new RegistryEntry(RegistryKeys.CHUNK_GENERATOR, ...),
            new RegistryEntry(RegistryKeys.DENSITY_FUNCTION_TYPE, ...),
            new RegistryEntry(RegistryKeys.MATERIAL_CONDITION, ...),
            new RegistryEntry(RegistryKeys.MATERIAL_RULE, ...)
        );
}
```

---

## 序列化机制

### 9.1 Registry 序列化

```java
// 获取注册表的 Codec
Codec<Registry<Block>> blockRegistryCodec = Registries.BLOCK.getCodec();

// 序列化为 NBT
NbtCompound nbt = new NbtCompound();
Codec.Nbt.encodeInto(
    Registries.BLOCK.getCodec(),
    NbtOps.INSTANCE,
    Registries.BLOCK,
    nbt
);

// 序列化注册表条目
Codec<RegistryEntry<Block>> entryCodec = Registries.BLOCK.getEntryCodec();

// 使用 RegistryEntry.Reference 进行序列化
RegistryEntry.Reference<Block> ref = block.getRegistryEntry();
RegistryEntry.Reference.serialize(entryCodec, NbtOps.INSTANCE, ref);
```

### 9.2 RegistryOps

RegistryOps 提供带注册表感知的序列化/反序列化：

```java
// 创建 RegistryOps
RegistryOps<NbtElement> ops = registryManager.getOps(NbtOps.INSTANCE);

// 序列化带引用的数据
NbtElement nbt = entryCodec.encodeStart(ops, reference).getOrThrow();

// 反序列化
RegistryEntry<Block> entry = entryCodec.parse(ops, nbt).getOrThrow();
```

### 9.3 标签序列化

```java
// 序列化标签
TagKey<Block> tag = TagKey.of(RegistryKeys.BLOCK, id);

// 获取标签对应的条目列表
Optional<RegistryEntryList.Named<Block>> tagList = 
    Registries.BLOCK.getEntryList(tag);

// 序列化标签
Codec<RegistryEntryList.Named<Block>> tagCodec = 
    Registries.BLOCK.getEntryListCodec(tag);
```

---

## 客户端服务端同步

### 10.1 RegistryWrapper

RegistryWrapper 提供只读的注册表视图：

```java
// 获取只读包装器
RegistryWrapper<Block> wrapper = blockRegistry.getReadOnlyWrapper();

// 查询
Optional<RegistryEntry.Reference<Block>> entry = 
    wrapper.getOptional(key);

// 流式访问
wrapper.streamEntries().forEach(entry -> {
    Block block = entry.value();
    // 处理
});

// 标签查询
Optional<RegistryEntryList.Named<Block>> tag = 
    wrapper.getOptional(tagKey);
```

### 10.2 RegistryEntryLookup

```java
// 注册表条目查询接口
public interface RegistryEntryLookup<T> {
    
    // 获取条目
    Optional<RegistryEntry.Reference<T>> getOptional(RegistryKey<T> key);
    
    // 获取标签
    Optional<RegistryEntryList.Named<T>> getOptional(TagKey<T> tag);
}

// 使用示例
RegistryEntryLookup<Block> lookup = world.getRegistryManager()
    .getWrapperLookup(RegistryKeys.BLOCK);

// 查询方块
Optional<RegistryEntry.Reference<Block>> diamond = 
    lookup.getOptional(RegistryKey.of(RegistryKeys.BLOCK, 
        Identifier.ofVanilla("diamond_block")));

// 检查标签
Optional<RegistryEntryList.Named<Block>> mineable = 
    lookup.getOptional(TagKey.of(RegistryKeys.BLOCK,
        Identifier.ofVanilla("mineable/pickaxe")));
```

### 10.3 网络同步

```java
// 同步数据包
public class RegistryDataS2CPacket implements Packet<ClientConfigurationPacketListener> {
    
    private final DynamicRegistryManager.Data data;
    
    @Override
    public void apply(ClientConfigurationPacketListener listener) {
        listener.onRegistryData(this);
    }
    
    // 解码
    public static DynamicRegistryManager.Data decode(RegistryByteBuf buf) {
        return DynamicRegistryManager.CODEC.decode(
            buf.getRegistryManager().getOps(NbtOps.INSTANCE),
            buf.readNbt()
        ).getOrThrow();
    }
}
```

---

## 关键代码引用

### 11.1 注册新物品

```java
// 完整注册流程
public static final Item MY_ITEM = register(
    Registries.ITEM,
    Identifier.ofVanilla("my_item"),
    new Item(new Item.Settings()
        .maxCount(64)
        .rarity(Rarity.UNCOMMON)
        .food(FoodComponents.APPLE)
    )
);
```

### 11.2 创建 RegistryKey

```java
// 方块键
RegistryKey<Block> key = RegistryKey.of(
    RegistryKeys.BLOCK,
    Identifier.ofVanilla("diamond_block")
);

// 实体类型键
RegistryKey<EntityType<?>> entityKey = RegistryKey.of(
    RegistryKeys.ENTITY_TYPE,
    Identifier.ofVanilla("pig")
);

// 维度键
RegistryKey<World> dimensionKey = RegistryKey.of(
    RegistryKeys.WORLD,
    Identifier.ofVanilla("the_end")
);
```

### 11.3 使用 RegistryEntry

```java
// 获取物品的注册表条目
RegistryEntry<Item> entry = Items.DIAMOND.getRegistryEntry();

// 检查是否为特定物品
if (entry.matches(RegistryKey.of(RegistryKeys.ITEM, 
    Identifier.ofVanilla("diamond")))) {
    // 是钻石
}

// 检查是否在标签中
if (entry.isIn(ItemTags.LOG)) {
    // 是木板相关物品
}

// 获取值
Item item = entry.value();
```

### 11.4 遍历注册表

```java
// 遍历所有方块
for (Block block : Registries.BLOCK) {
    // 处理每个方块
}

// 遍历条目
Registries.BLOCK.streamEntries().forEach(entry -> {
    RegistryKey<Block> key = entry.registryKey();
    Block block = entry.value();
    // 处理
});

// 按ID遍历
for (Identifier id : Registries.BLOCK.getIds()) {
    Block block = Registries.BLOCK.get(id);
    // 处理
}
```

### 11.5 创建自定义注册表

```java
// 在 RegistryKeys 中定义注册表键
public static final RegistryKey<Registry<MyData>> MY_DATA_KEY = 
    RegistryKey.ofRegistry(
        Identifier.of("mymod", "my_data")
    );

// 在 Registries 中创建注册表
public static final Registry<MyData> MY_DATA = 
    create(MY_DATA_KEY, registry -> ...);

// 注册数据
Registry.register(
    MyRegistries.MY_DATA,
    Identifier.of("mymod", "example"),
    new MyData()
);
```

---

## 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         标识符层次结构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Identifier (命名空间:路径)                                          │
│  ├── "minecraft:diamond_block"                                      │
│  ├── "minecraft:item/diamond"                                      │
│  └── "mymod:custom_item"                                           │
│                                                                      │
│  RegistryKey<T> (注册表 + 值)                                       │
│  ├── RegistryKey.of(BLOCK_KEY, "diamond_block")                      │
│  └── RegistryKey.of(ITEM_KEY, "diamond")                             │
│                                                                      │
│  RegistryEntry<T> (值 + 所有者 + 生命周期)                            │
│  ├── Reference: 引用已注册的值                                       │
│  └── Direct: 直接条目（未注册）                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         注册表核心结构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Registries.ROOT                                                    │
│  └── Map<Identifier, Registry<?>>                                    │
│      ├── "block" -> Registry<Block>                                  │
│      ├── "item" -> Registry<Item>                                    │
│      ├── "fluid" -> Registry<Fluid>                                  │
│      └── ...                                                        │
│                                                                      │
│  SimpleRegistry<T>                                                   │
│  ├── rawIdToEntry: ObjectList<Reference<T>> (原始ID索引)          │
│  ├── idToEntry: Map<Identifier, Reference<T>> (字符串ID索引)          │
│  ├── keyToEntry: Map<RegistryKey<T>, Reference<T>> (键索引)          │
│  ├── valueToEntry: Map<T, Reference<T>> (值索引)                     │
│  └── tagToEntryList: Map<TagKey<T>, Named<T>> (标签索引)            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         静态 vs 动态注册                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  静态注册表 (SimpleRegistry)          动态注册表 (DynamicRegistry)      │
│  ├── Registries.BLOCK                  ├── 维度类型                   │
│  ├── Registries.ITEM                   ├── 生物群系                   │
│  ├── Registries.ENTITY_TYPE             ├── 结构特征                   │
│  ├── Registries.BLOCK_ENTITY_TYPE      ├── 战利品表                   │
│  └── ...                               ├── 配方                        │
│                                          ├── 进度                     │
│  特性:                                    └── ...                     │
│  - 游戏代码中硬编码                       特性:                        │
│  - 初始化后冻结                           - 数据包驱动                  │
│  - 所有客户端相同                          - 服务器特定                  │
│                                           - 可同步到客户端             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 总结

Minecraft 1.21 的注册表系统展现了高度模块化和可扩展的设计：

1. **三层标识系统**：Identifier → RegistryKey → RegistryEntry 提供灵活的访问方式
2. **生命周期追踪**：支持实验性和稳定内容的区分管理
3. **冻结机制**：静态注册表在初始化后冻结，保证一致性
4. **标签分组**：TagKey 提供跨注册表的灵活分组能力
5. **动态注册支持**：数据包可以添加/替换动态注册表的内容
6. **序列化优化**：Codec 和 RegistryOps 提供高效的序列化和反序列化
7. **网络同步**：支持动态注册表在服务器和客户端之间的同步

这套系统是 Minecraft Mod API 的核心基础设施，为数据包系统和 Mod 加载器提供了统一的数据管理框架。
