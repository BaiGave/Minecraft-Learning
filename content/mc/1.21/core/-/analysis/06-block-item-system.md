# Minecraft 1.21 方块物品系统分析

## 目录
1. [概述](#概述)
2. [方块系统架构](#方块系统架构)
3. [物品系统架构](#物品系统架构)
4. [方块实体机制](#方块实体机制)
5. [组件系统](#组件系统)
6. [状态管理系统](#状态管理系统)
7. [关键代码引用](#关键代码引用)

---

## 概述

Minecraft 1.21 的方块物品系统是游戏的核心子系统之一，负责管理世界中的静态元素（方块）和可交互物品。本分析文档基于反编译源代码，深入探讨其设计架构和实现机制。

**核心设计原则：**
- 每种方块/物品类型只有一个实例（单例模式）
- 方块状态（BlockState）表示方块的运行时变体
- 物品堆叠（ItemStack）存储具体物品数量和组件数据
- 方块实体（BlockEntity）用于存储需要持久化的额外数据

---

## 方块系统架构

### 1.1 Block 类层次结构

```
Block (net.minecraft.block.Block)
├── AbstractBlock
│   └── Block
│       ├── AirBlock
│       ├── LeavesBlock
│       ├── WoodBlock
│       └── [其他具体方块...]
└── BlockWithEntity (带有方块实体的方块)
    └── [具体方块如Chest, Furnace...]
```

**核心文件：** `..../source/net/minecraft/block/Block.java`

### 1.2 Block 类的核心职责

```java
98:780:..../source/net/minecraft/block/Block.java
public class Block
extends AbstractBlock
implements ItemConvertible,
FabricBlock {
    
    // 注册表条目 - 每个方块类型对应一个注册表引用
    private final RegistryEntry.Reference<Block> registryEntry = Registries.BLOCK.createEntry(this);
    
    // 方块状态管理器
    protected final StateManager<Block, BlockState> stateManager;
    private BlockState defaultState;
    
    // 用于方块状态ID映射
    public static final IdList<BlockState> STATE_IDS = new IdList();
    
    // 通知标志位
    public static final int NOTIFY_NEIGHBORS = 1;
    public static final int NOTIFY_LISTENERS = 2;
    public static final int NO_REDRAW = 4;
    public static final int REDRAW_ON_MAIN_THREAD = 8;
    // ...
}
```

### 1.3 方块状态（BlockState）机制

方块状态是方块在游戏世界中的具体表现形式，同一种方块可以有多个不同的状态。

**核心文件：** `..../source/net/minecraft/block/BlockState.java`

```java
15:28:..../source/net/minecraft/block/BlockState.java
public class BlockState
extends AbstractBlock.AbstractBlockState
implements FabricBlockState {
    
    public static final Codec<BlockState> CODEC = BlockState.createCodec(
        Registries.BLOCK.getCodec(), 
        Block::getDefaultState
    ).stable();
}
```

**BlockState 的特点：**
- 使用 `Reference2ObjectArrayMap` 存储属性值对
- 每个状态通过属性组合唯一标识
- 支持稳定的序列化/反序列化（CODEC）
- 缓存机制提高性能

### 1.4 AbstractBlock 类

AbstractBlock 提供了方块行为的核心抽象，是所有具体方块类的基类。

**核心文件：** `..../source/net/minecraft/block/AbstractBlock.java`

**关键方法执行顺序：**

**放置相关（Placement）：**
| 顺序 | 方法 | 用途 | 玩家 | 发射器 | setBlockState |
|------|------|------|------|--------|---------------|
| 1 | canReplace | 检查当前方块是否可替换 | ✓ | ✓ | ✗ |
| 2 | getPlacementState | 获取放置状态 | ✓ | ✓ | ✗ |
| 3 | canPlaceAt | 检查放置限制 | ✓ | ✓ | ✗ |
| 4 | onStateReplaced | 移除旧状态逻辑 | ✓ | ✓ | ✓ |
| 5 | onBlockAdded | 添加新状态逻辑 | ✓ | ✓ | ✓ |
| 6 | neighborUpdate | 邻居方块更新 | ✓ | ✓ | ✓ |

**破坏相关（Breaking）：**
| 顺序 | 方法 | 用途 | 玩家挖掘 | 爆炸 |
|------|------|------|----------|------|
| 1 | onBlockBreakStart | 开始破坏回调 | ✓ | ✗ |
| 2 | calcBlockBreakingDelta | 计算破坏速度 | ✓ | ✗ |
| 3 | onBreak | 破坏前处理 | ✓ | ✗ |
| 4 | onStateReplaced | 状态替换 | ✓ | ✓ |
| 5 | neighborUpdate | 邻居更新 | ✓ | ✓ |
| 6 | getDroppedStacks | 获取掉落物 | ✓ | ✓ |
| 7 | onStacksDropped | 掉落物处理 | ✓ | ✓ |

---

## 物品系统架构

### 2.1 Item 类结构

```java
96:808:..../source/net/minecraft/item/Item.java
public class Item
implements ToggleableFeature,
ItemConvertible,
FabricItem {
    
    // 物品到方块的映射
    public static final Map<Block, Item> BLOCK_ITEMS = Maps.newHashMap();
    
    // 注册表条目
    private final RegistryEntry.Reference<Item> registryEntry = Registries.ITEM.createEntry(this);
    
    // 组件数据
    private final ComponentMap components;
    
    // 配方剩余物品
    @Nullable
    private final Item recipeRemainder;
}
```

### 2.2 ItemStack - 物品堆叠

ItemStack 是物品系统的核心数据容器，存储具体的物品数量和组件数据。

**核心文件：** `..../source/net/minecraft/item/ItemStack.java`

```java
148:1373:..../source/net/minecraft/item/ItemStack.java
public final class ItemStack
implements ComponentHolder,
FabricItemStack {
    
    // 序列化编解码器
    public static final Codec<ItemStack> CODEC = ...
    public static final Codec<ItemStack> UNCOUNTED_CODEC = ...
    public static final Codec<ItemStack> VALIDATED_CODEC = ...
    
    // 网络传输编解码器
    public static final PacketCodec<RegistryByteBuf, ItemStack> OPTIONAL_PACKET_CODEC = ...
    public static final PacketCodec<RegistryByteBuf, ItemStack> PACKET_CODEC = ...
    
    // 物品数量
    private int count;
    
    // 动画时间
    private int bobbingAnimationTime;
    
    // 物品引用（非空时）
    @Deprecated
    @Nullable
    private final Item item;
    
    // 组件映射
    final ComponentMapImpl components;
}
```

### 2.3 ItemStack 组件系统

Minecraft 1.21 引入的组件系统是物品数据的核心存储机制。

```java
// 组件操作示例
ItemStack stack = new ItemStack(Items.DIAMOND_SWORD);

// 设置组件
stack.set(DataComponentTypes.CUSTOM_NAME, Text.literal("My Sword"));

// 获取组件
int damage = stack.getDamage();

// 移除组件
stack.remove(DataComponentTypes.ENCHANTMENTS);
```

**核心组件类型：**
- `DataComponentTypes.ENCHANTMENTS` - 附魔
- `DataComponentTypes.CUSTOM_NAME` - 自定义名称
- `DataComponentTypes.DAMAGE` - 耐久度损伤
- `DataComponentTypes.MAX_DAMAGE` - 最大耐久度
- `DataComponentTypes.FOOD` - 食物属性
- `DataComponentTypes.DYED_COLOR` - 染色颜色
- `DataComponentTypes.LORE` - 物品描述

### 2.4 Item 的生命周期方法

| 方法 | 描述 | 典型用途 |
|------|------|----------|
| `use()` | 玩家开始使用物品时调用 | 食物消耗、弓拉弦 |
| `finishUsing()` | 物品使用完成后调用 | 食物恢复饥饿值 |
| `usageTick()` | 使用过程中的每tick调用 | 弩充能 |
| `onStoppedUsing()` | 提前停止使用时调用 | 弓的取消 |
| `useOnBlock()` | 在方块上使用物品 | 放置方块 |
| `useOnEntity()` | 在实体上使用物品 | 给生物装备鞍 |
| `postMine()` | 成功挖掘方块后调用 | 工具耐久度消耗 |
| `postHit()` | 攻击实体后调用 | 武器耐久度消耗 |
| `inventoryTick()` | 物品在背包中每tick调用 | 物品特殊效果 |
| `onCraft()` | 物品被合成时调用 | 添加成就进度 |

---

## 方块实体机制

### 3.1 BlockEntity 概述

BlockEntity 用于存储方块的额外数据，适用于那些无法用 BlockState 表示的数据，如容器物品、计分板值等。

**核心文件：** `..../source/net/minecraft/block/entity/BlockEntity.java`

```java
73:518:..../source/net/minecraft/block/entity/BlockEntity.java
public abstract class BlockEntity
implements RenderDataBlockEntity,
AttachmentTarget {
    
    // 方块实体类型
    private final BlockEntityType<?> type;
    
    // 所属世界（可能为null）
    @Nullable
    protected World world;
    
    // 方块位置
    protected final BlockPos pos;
    
    // 缓存的方块状态
    private BlockState cachedState;
    
    // 组件数据
    private ComponentMap components = ComponentMap.EMPTY;
}
```

### 3.2 BlockEntityType - 方块实体类型注册

**核心文件：** `..../source/net/minecraft/block/entity/BlockEntityType.java`

```java
87:226:..../source/net/minecraft/block/entity/BlockEntityType.java
public class BlockEntityType<T extends BlockEntity>
implements FabricBlockEntityType {
    
    // 预定义的方块实体类型
    public static final BlockEntityType<FurnaceBlockEntity> FURNACE = 
        BlockEntityType.create("furnace", 
            Builder.create(FurnaceBlockEntity::new, Blocks.FURNACE));
    
    public static final BlockEntityType<ChestBlockEntity> CHEST = 
        BlockEntityType.create("chest", 
            Builder.create(ChestBlockEntity::new, Blocks.CHEST));
    
    // ... 更多预定义类型
    
    // 工厂方法
    private final BlockEntityFactory<? extends T> factory;
    
    // 关联的方块集合
    private final Set<Block> blocks;
    
    // 数据修复器类型
    private final Type<?> type;
}
```

### 3.3 预定义方块实体类型

| 类型 | ID | 关联方块 |
|------|-----|----------|
| FURNACE | furnace | 熔炉 |
| CHEST | chest | 箱子 |
| TRAPPED_CHEST | trapped_chest | 陷阱箱 |
| ENDER_CHEST | ender_chest | 末影箱 |
| JUKEBOX | jukebox | 唱片机 |
| DISPENSER | dispenser | 发射器 |
| DROPPER | dropper | 投掷器 |
| SIGN | sign | 所有木质告示牌 |
| HANGING_SIGN | hanging_sign | 所有悬挂告示牌 |
| MOB_SPAWNER | mob_spawner | 刷怪笼 |
| PISTON | piston | 活塞 |
| BREWING_STAND | brewing_stand | 酿造台 |
| ENCHANTING_TABLE | enchanting_table | 附魔台 |
| BEACON | beacon | 信标 |
| SKULL | skull | 头颅 |
| HOPPER | hopper | 漏斗 |
| COMPARATOR | comparator | 比较器 |
| SHULKER_BOX | shulker_box | 潜影盒 |
| CAMPFIRE | campfire | 营火 |
| BEEHIVE | beehive | 蜂巢 |
| SCULK_SENSOR | sculk_sensor | 幽匿感测体 |
| TRIAL_SPAWNER | trial_spawner | 试用刷怪笼 |
| VAULT | vault | 保险箱 |

### 3.4 NBT 数据持久化

BlockEntity 使用 NBT 格式进行数据持久化：

```java
// 写入NBT
public final NbtCompound createNbt(RegistryWrapper.WrapperLookup registryLookup) {
    NbtCompound nbtCompound = new NbtCompound();
    this.writeNbt(nbtCompound, registryLookup);
    Components.CODEC.encodeStart(registryLookup.getOps(NbtOps.INSTANCE), this.components)
        .resultOrPartial(...)
        .ifPresent(nbt -> nbtCompound.copyFrom((NbtCompound)nbt));
    return nbtCompound;
}

// 从NBT读取
public static BlockEntity createFromNbt(BlockPos pos, BlockState state, 
    NbtCompound nbt, RegistryWrapper.WrapperLookup registryLookup) {
    String string = nbt.getString("id");
    Identifier identifier = Identifier.tryParse(string);
    // ...
}
```

### 3.5 客户端同步机制

BlockEntity 的数据不会自动同步到客户端，需要显式声明：

```java
// 返回同步数据包
@Nullable
public Packet<ClientPlayPacketListener> toUpdatePacket() {
    return BlockEntityUpdateS2CPacket.create(this);
}

// 返回初始数据
public NbtCompound toInitialChunkDataNbt(RegistryWrapper.WrapperLookup registryLookup) {
    return this.createNbt(registryLookup);
}
```

---

## 组件系统

### 4.1 ComponentMap 架构

Minecraft 1.21 的组件系统是对原有 NBT 数据的抽象封装。

```java
// 组件类型定义
public interface ComponentType<T> {
    Codec<T> getCodec();
    PacketCodec<RegistryByteBuf, T> getPacketCodec();
}

// 组件映射接口
public interface ComponentHolder {
    ComponentMap getComponents();
    <T> T get(ComponentType<T> type);
    <T> T getOrDefault(ComponentType<T> type, T fallback);
    <T> T set(ComponentType<T> type, @Nullable T value);
    <T> T remove(ComponentType<? extends T> type);
}
```

### 4.2 物品组件 vs 堆叠组件

**物品级别组件（Item Components）：**
- 在 Item 构造时定义
- 所有使用该物品的堆叠都共享
- 示例：`MAX_STACK_SIZE`, `FOOD`, `RARITY`

**堆叠级别组件（Stack Components）：**
- 存储在 ItemStack 中
- 每个堆叠实例独立
- 示例：`CUSTOM_NAME`, `ENCHANTMENTS`, `DAMAGE`

---

## 状态管理系统

### 5.1 StateManager 架构

StateManager 负责管理方块的所有可能状态。

```java
// 状态管理器构建
StateManager.Builder<Block, BlockState> builder = 
    new StateManager.Builder<Block, BlockState>(this);
this.appendProperties(builder);
this.stateManager = builder.build(Block::getDefaultState, BlockState::new);
```

### 5.2 常用属性类型

```java
// 布尔属性
BooleanProperty FACING = BooleanProperty.of("facing");

// 整数属性
IntProperty POWER = IntProperty.of("power", 0, 15);

// 枚举属性
EnumProperty<Direction> FACING = EnumProperty.of("facing", Direction.class);

// 方向属性
DirectionProperty HORIZONTAL_FACING = DirectionProperty.create("facing", 
    Direction.Type.HORIZONTAL);
```

### 5.3 状态转换

```java
// 获取属性值
BlockState state = world.getBlockState(pos);
Direction facing = state.get(FacingBlock.FACING);

// 设置属性值
BlockState newState = state.with(FacingBlock.FACING, Direction.NORTH);

// 检查属性
boolean isPowered = state.get(PowerableBlock.POWERED);

// 状态相等性
boolean equals = state1.equals(state2);
```

---

## 关键代码引用

### 方块注册

```java
// 注册方块
Registry.register(Registries.BLOCK, 
    Identifier.ofVanilla("diamond_block"), 
    DIAMOND_BLOCK);

// 获取注册表中的方块
Block block = Registries.BLOCK.get(Identifier.ofVanilla("diamond_block"));

// 获取方块的注册键
RegistryKey<Block> key = RegistryKey.of(Registries.BLOCK_KEY, 
    Identifier.ofVanilla("diamond_block"));
```

### 物品注册

```java
// 注册物品
Registry.register(Registries.ITEM, 
    Identifier.ofVanilla("diamond"), 
    DIAMOND);

// 创建物品堆叠
ItemStack stack = new ItemStack(Items.DIAMOND, 64);

// 检查物品类型
if (stack.isOf(Items.DIAMOND)) {
    // 是钻石
}
```

### 方块实体操作

```java
// 获取方块实体
BlockEntity be = world.getBlockEntity(pos);

// 检查类型
if (be instanceof ChestBlockEntity chest) {
    ChestBlock chestBlock = (ChestBlock) chest;
    // 操作箱子
}

// 标记为脏（需要保存）
be.markDirty();

// 触发客户端同步
serverWorld.getChunkManager().markForUpdate(pos);
```

---

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Minecraft 世界                          │
├─────────────────────────────────────────────────────────────┤
│  ChunkSection                                               │
│  ├── BlockState[] (方块状态数组, 索引到方块状态映射)          │
│  └── BlockEntity[] (仅需要额外数据的方块)                   │
├─────────────────────────────────────────────────────────────┤
│  BlockState                                                │
│  ├── Block (方块类型引用)                                   │
│  └── Map<Property<?>, Comparable<?>> (属性值映射)           │
├─────────────────────────────────────────────────────────────┤
│  Block (单例)                                              │
│  ├── StateManager<Block, BlockState>                      │
│  ├── AbstractBlock.Settings                                │
│  └── Block 业务逻辑方法                                     │
├─────────────────────────────────────────────────────────────┤
│  BlockEntity                                               │
│  ├── BlockEntityType<?>                                    │
│  ├── BlockPos                                              │
│  ├── ComponentMap                                          │
│  └── NBT 数据                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    玩家背包/物品系统                         │
├─────────────────────────────────────────────────────────────┤
│  Inventory                                                 │
│  └── ItemStack[] (物品堆叠数组)                             │
├─────────────────────────────────────────────────────────────┤
│  ItemStack                                                 │
│  ├── Item (物品类型引用)                                    │
│  ├── int count (数量)                                      │
│  └── ComponentMap (组件数据)                                │
├─────────────────────────────────────────────────────────────┤
│  Item (单例)                                               │
│  ├── ComponentMap (物品级别组件)                           │
│  └── Item 业务逻辑方法                                      │
├─────────────────────────────────────────────────────────────┤
│  ComponentMap                                              │
│  ├── Map<ComponentType<?>, Object>                        │
│  └── 组件变更追踪                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      注册表系统                              │
├─────────────────────────────────────────────────────────────┤
│  Registries.ROOT                                          │
│  └── Map<Identifier, Registry<?>>                         │
│      ├── Registries.BLOCK → Registry<Block>               │
│      ├── Registries.ITEM → Registry<Item>                 │
│      ├── Registries.BLOCK_ENTITY_TYPE → Registry<BlockEntityType> │
│      └── [其他注册表...]                                    │
├─────────────────────────────────────────────────────────────┤
│  Registry<T>                                              │
│  ├── Map<Identifier, T> (ID到值)                          │
│  ├── Map<RegistryKey<T>, T> (键到值)                      │
│  ├── Map<T, RegistryEntry.Reference<T>> (值到引用)       │
│  └── List<RegistryEntry.Reference<T>> (ID到引用)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结

Minecraft 1.21 的方块物品系统展现了高度模块化的设计：

1. **分离关注点**：Block/Item 定义类型，BlockState/ItemStack 定义实例
2. **组件化设计**：使用 ComponentMap 替代直接 NBT 操作
3. **注册表驱动**：所有游戏对象通过注册表统一管理
4. **双向映射**：支持 ID、RegistryKey、RegistryEntry 三种访问方式
5. **持久化支持**：NBT 和组件系统提供灵活的数据持久化机制

这套系统为 Mod 开发提供了清晰的扩展点，同时也保持了游戏的核心性能。
