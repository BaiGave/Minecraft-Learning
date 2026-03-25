---
title: 第 15 章：方块基础详解（Block Basics）
readingTime: 30
---

# 第 15 章：方块基础详解（Block Basics）

## 章节目标

通过本章学习，你将掌握：
- Block（方块）类的核心架构
- 方块的注册和初始化机制
- 方块的属性（Hardness、Solid、RedstonePower等）
- AbstractBlock 的行为定义
- 方块的生命周期方法

## 前置知识

建议先阅读：
- [Part-1 基础/05-注册表系统](./Part-1-Foundation/05-registry-system.md) - 注册表机制
- [08-World核心类](./Part-2-World/09-world-core.md) - 世界的基本概念

## 核心概念

### Block = 世界的基本积木

想象 Minecraft 世界是一堆积木，每块积木就是**Block**：

```
┌─────────────────────────────────────────────────────────────┐
│              Minecraft 世界 = 乐高积木城堡                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🧱 Block = 积木块                                            │
│     │                                                        │
│     ├── 📝 类型标识符 = 注册表ID                              │
│     │     │                                                  │
│     │     └── "minecraft:stone" → StoneBlock               │
│     │                                                        │
│     ├── 🎨 外观 = 纹理 + 模型                               │
│     │     │                                                  │
│     │     └── 根据 BlockState 切换模型                       │
│     │                                                        │
│     └── ⚙️ 行为 = 交互、破坏、放置                          │
│           │                                                  │
│           └── canPlaceAt() / onBreak() / use()              │
│                                                              │
│  每个 Block 实例是单例!                                      │
│  所有同类型方块共享一个 Block 对象                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键类比**：
- Block = 积木的设计图（定义类型）
- BlockState = 积木的具体摆放状态
- World = 积木城堡（所有积木的集合）
- BlockEntity = 带特殊功能的积木（如带机关的积木）

---

## 1. Block 类结构

### 1.1 类层次

```
Block (抽象基类)
├── AbstractBlock
│   └── Block
│       ├── AirBlock
│       ├── LeavesBlock
│       ├── WoodBlock
│       └── [其他具体方块...]
└── BlockWithEntity (带有方块实体的方块)
    └── [Chest, Furnace, Beacon...]
```

### 1.2 核心字段

```java
98:780:Block.java
public class Block
extends AbstractBlock
implements ItemConvertible,
           FabricBlock {
    
    // 注册表条目 - 每个方块类型对应一个注册表引用
    private final RegistryEntry.Reference<Block> registryEntry = 
        Registries.BLOCK.createEntry(this);
    
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

### 1.3 Block 与 ItemBlock

```java
// Block 实现 ItemConvertible 接口
public class Block implements ItemConvertible {
    @Override
    public Item asItem() {
        // 默认返回对应的 ItemBlock
        return Item.BLOCK_ITEMS.get(this);
    }
}

// 材质表 (Block → Item 映射)
public class Item {
    public static final Map<Block, Item> BLOCK_ITEMS = Maps.newHashMap();
}

// 注册时自动建立映射
Registry.register(Registries.BLOCK, id, block);
Item.BLOCK_ITEMS.put(block, new BlockItem(block));
```

---

## 2. 方块属性

### 2.1 AbstractBlock.Settings

```java
// 方块的属性配置
public static class Settings {
    private Strength strength;              // 硬度
    private Material material;              // 材质
    private Map<SoundType, Float> speeds = new EnumMap<>(SoundType.class);
    private Float jumpVelocityMultiplier;  // 跳跃速度倍率
    private boolean isAir = false;         // 是否空气
    private int luminance;                  // 亮度
    private MaterialColor color;            // 物品栏颜色
    private Map<Direction, Integer>Comparator comparatorReceives = 
        new EnumMap<>(Direction.class);
    private int fireSpeed[];               // 火焰传播速度
    private boolean solid;                  // 是否固体
    private boolean burnable;               // 可燃烧
    private RegistryEntry<SoundEvent> breakSound;  // 破坏音效
    private RegistryEntry<SoundEvent> stepSound;  // 脚步音效
    // ...
}
```

### 2.2 常见方块属性

```java
// 石头属性
public class StoneBlock extends Block {
    public StoneBlock(AbstractBlock.Settings settings) {
        super(settings.strength(1.5f, 6.0f));  // 硬度1.5, 抗爆6.0
    }
}

// 泥土属性
public class DirtBlock extends Block {
    public DirtBlock(AbstractBlock.Settings settings) {
        super(settings
            .strength(0.5f)           // 软
            .ticksRandomly()          // 随机刻
            .sounds(SoundType.GRASS)  // 草地音效
        );
    }
}

// 玻璃属性
public class GlassBlock extends Block {
    public GlassBlock(AbstractBlock.Settings settings) {
        super(settings
            .strength(0.3f)
            .sounds(SoundType.GLASS)
            .nonOpaque()              // 非不透明
            .allowsSpawning(Blocks::never)  // 不允许生物生成
        );
    }
}
```

### 2.3 材质 (Material)

```java
// 材质定义了方块的物理属性
public enum Material {
    // 石头材质 - 可替换、不透明
    STONE(MapColor.STONE, false, true, true, false),
    
    // 草地材质 - 可替换
    GRASS(MapColor.GRASS, false, true, true, false),
    
    // 泥土材质 - 可替换
    DIRT(MapColor.DIRT, false, true, true, false),
    
    // 木头材质 - 固体、可燃烧
    WOOD(MapColor.WOOD, true, false, true, true),
    
    // 石头固体材质 - 不可替换
    STONE_SOLID(MapColor.STONE, true, false, true, false),
    
    // 植物材质 - 可替换、非固体
    PLANT(MapColor.PLANT, false, true, false, false),
    
    // 水材质 - 可替换、不可固体阻挡
    WATER(MapColor.WATER, false, true, false, false),
    
    // 熔岩材质
    LAVA(MapColor.LAVA, false, true, false, false),
    
    // 沙子材质 - 可替换
    SAND(MapColor.SAND, false, true, true, false),
    
    // 装饰材质 - 非固体、不阻挡移动
    DECORATION(MapColor.AIR, false, true, false, false),
    
    // 感知材质 - 非固体、可以放置感知器
    SENSING(MapColor.AIR, false, true, false, false),
    
    // .portal材质 - 特殊传送门
    PORTAL(MapColor.CLEAR, false, true, false, false);
}
```

---

## 3. 方块生命周期方法

### 3.1 放置相关方法

```
放置流程时序图：

玩家点击放置 ─────────────────────────────────────────────►
    │
    ▼
canReplace() ─── 检查当前方块是否可替换 ──► 否 → 取消放置
    │                                                   
    ▼ 是                                                
getPlacementState() ─── 获取放置后的状态 ──► 返回null → 取消
    │                                                 
    ▼                                                
canPlaceAt() ─── 检查是否可放置 ──► 否 → 取消放置
    │                                                
    ▼ 是                                              
放置方块到世界                                        
    │                                                
    ▼                                                
onStateReplaced() ─── 旧状态被替换回调                  
    │                                                
    ▼                                                
onBlockAdded() ─── 新状态添加回调                      
    │                                                
    ▼                                                
neighborUpdate() ─── 邻居方块更新通知                   
```

### 3.2 破坏相关方法

```
破坏流程时序图：

玩家开始破坏 ─────────────────────────────────────────────►
    │
    ▼
onBlockBreakStart() ─── 开始破坏回调 ──► 返回true → 取消
    │                                                   
    ▼                                                
calcBlockBreakingDelta() ─── 计算破坏速度                
    │                                                
    ▼                                                
玩家持续破坏...                                        
    │                                                
    ▼                                                
onBreak() ─── 破坏前处理 ──► 返回false → 取消破坏        
    │                                                 
    ▼                                                
从世界移除方块                                        
    │                                                
    ▼                                                
onStateReplaced() ─── 状态替换回调                      
    │                                                
    ▼                                                
neighborUpdate() ─── 邻居更新                          
    │                                                
    ▼                                                
getDroppedStacks() ─── 获取掉落物品                    
    │                                                
    ▼                                                
onStacksDropped() ─── 掉落物后处理                     
```

### 3.3 核心方法详解

```java
// AbstractBlock.java 中的方法实现

// 检查方块是否可以被放置
public BlockState getPlacementState(BlockPlacementContext context) {
    // 默认返回默认状态
    return this.getDefaultState();
}

// 检查在指定位置是否可以放置
public boolean canPlaceAt(BlockState state, WorldView world, BlockPos pos) {
    // 默认始终返回true
    return true;
}

// 邻居方块更新时调用
public void neighborUpdate(BlockState state, World world, BlockPos pos, 
                          Block sourceBlock, BlockPos sourcePos, boolean notify) {
    // 默认实现为空
}

// 方块被破坏时的处理
public void onBreak(World world, BlockPos pos, BlockState state, PlayerEntity player) {
    // 默认实现为空
}
```

---

## 4. 方块注册

### 4.1 静态注册

```java
// 方块的静态字段声明
public class Blocks {
    // 主世界方块
    public static final Block AIR = new AirBlock(AbstractBlock.Settings.create()
        .isAir()
        .noCollision()
        .dropsNothing()
    );
    
    public static final Block STONE = new Block(AbstractBlock.Settings.create()
        .strength(1.5f, 6.0f)
        .sounds(SoundType.STONE)
    );
    
    public static final Block DIRT = new DirtBlock(AbstractBlock.Settings.create()
        .strength(0.5f)
        .sounds(SoundType.GRASS)
    );
    
    public static final Block GRASS_BLOCK = new GrassBlock(AbstractBlock.Settings.create()
        .strength(0.6f)
        .sounds(SoundType.GRASS)
        .ticksRandomly()
    );
    
    // 注册所有方块
    static {
        register("air", AIR);
        register("stone", STONE);
        register("dirt", DIRT);
        register("grass_block", GRASS_BLOCK);
        // ...
    }
}

// 注册辅助方法
private static void register(String id, Block block) {
    Registry.register(Registries.BLOCK, Identifier.ofVanilla(id), block);
}
```

### 4.2 运行时注册 (Mod开发)

```java
// Mod中注册自定义方块
public class MyMod implements ModInitializer {
    
    public static final Block MY_CUSTOM_BLOCK = new MyCustomBlock(
        AbstractBlock.Settings.create()
            .strength(3.0f)
            .requiresTool()  // 需要工具挖掘
    );
    
    @Override
    public void onInitialize() {
        // 注册到方块注册表
        Registry.register(
            Registries.BLOCK,
            Identifier.of("mymod", "custom_block"),
            MY_CUSTOM_BLOCK
        );
        
        // 注册对应的物品
        Registry.register(
            Registries.ITEM,
            Identifier.of("mymod", "custom_block"),
            new BlockItem(MY_CUSTOM_BLOCK, 
                new Item.Settings())
        );
    }
}
```

---

## 5. 方块状态与交互

### 5.1 使用方块

```java
// 方块被玩家右键点击时调用
public ActionResult onUse(BlockState state, World world, BlockPos pos, 
                         PlayerEntity player, Hand hand,
                         BlockHitResult hit) {
    
    // 获取玩家手中的物品
    ItemStack stack = player.getStackInHand(hand);
    
    // 检查是否是对应物品
    if (stack.isOf(Items.FLINT_AND_STEEL)) {
        // 点火
        world.setBlockState(pos, Blocks.FIRE.getDefaultState());
        stack.damage(1, player, PlayerEntity.getSlotForHand(hand));
        return ActionResult.success(world.isClient);
    }
    
    return ActionResult.PASS;  // 不处理，继续传递
}
```

### 5.2 红石信号

```java
// 方块提供红石信号
public int getWeakRedstonePower(BlockState state, BlockView world, 
                                BlockPos pos, Direction direction) {
    // 检查是否是红石块
    if (state.isOf(Blocks.REDSTONE_BLOCK)) {
        return 15;  // 满信号
    }
    return 0;
}

// 方块提供红石信号（通过比较器）
public int getStrongRedstonePower(BlockState state, BlockView world,
                                  BlockPos pos, Direction direction) {
    return state.getWeakRedstonePower(world, pos, direction);
}
```

### 5.3 实体碰撞

```java
// 定义方块是否允许实体通过
public VoxelShape getCollisionShape(BlockState state, BlockView world, 
                                    BlockPos pos, ShapeContext context) {
    // 获取方块的碰撞箱
    return this.getOutlineShape(state, world, pos, context);
}

// 定义方块形状（用于渲染和碰撞）
public VoxelShape getOutlineShape(BlockState state, BlockView world,
                                   BlockPos pos, ShapeContext context) {
    // 默认返回完整方块
    return this.shape;
}
```

---

## 6. 特殊方块类型

### 6.1 BlockWithEntity

```java
// 需要方块实体的方块基类
public abstract class BlockWithEntity extends Block {
    @Override
    public abstract BlockEntity createBlockEntity(BlockPos pos, BlockState state);
    
    @Override
    public BlockState getPlacementState(BlockPlacementContext ctx) {
        // 确保创建对应的方块实体
        return this.getDefaultState();
    }
}

// 示例：箱子
public class ChestBlock extends BlockWithEntity {
    @Override
    public BlockEntity createBlockEntity(BlockPos pos, BlockState state) {
        return new ChestBlockEntity(pos, state);
    }
}
```

### 6.2 随机Tick方块

```java
// 需要随机Tick的方块（如草方块蔓延）
public class GrassBlock extends Block {
    public GrassBlock(Settings settings) {
        super(settings.ticksRandomly());  // 标记需要随机Tick
    }
    
    // 随机Tick时调用
    @Override
    public void scheduledTick(BlockState state, ServerWorld world, 
                            BlockPos pos, Random random) {
        // 草方块蔓延逻辑
        if (!hasWater(world, pos)) {
            // 没有水源，变为泥土
            world.setBlockState(pos, Blocks.DIRT.getDefaultState(), 3);
        } else {
            // 尝试蔓延
            spreadGrass(world, pos, random);
        }
    }
}
```

### 6.3 需要工具的方块

```java
// 需要正确工具才能有效挖掘的方块
public class DiamondOreBlock extends Block {
    public DiamondOreBlock(Settings settings) {
        super(settings
            .strength(3.0f, 3.0f)
            .requiresTool()  // 需要工具
        );
    }
    
    @Override
    public float getHardness() {
        return 3.0f;
    }
    
    // 获取挖掘等级要求
    public ToolTier getHarvestTool() {
        return ToolTier.IRON;  // 需要铁镐或更好
    }
    
    // 获取挖掘等级
    public int getHarvestLevel(BlockState state) {
        return 2;  // 铁镐
    }
}
```

---

## 7. 实战演示

### 7.1 创建自定义方块

```java
// 自定义发光方块
public class GlowstoneLampBlock extends Block {
    
    // 方块属性
    public static final BooleanProperty LIT = BooleanProperty.of("lit");
    
    public GlowstoneLampBlock(Settings settings) {
        super(settings
            .strength(0.5f)
            .luminance(state -> state.get(LIT) ? 15 : 0)  // 亮度取决于状态
        );
        
        // 设置默认状态
        setDefaultState(getDefaultState().with(LIT, false));
    }
    
    @Override
    protected void appendProperties(StateManager.Builder<Block, BlockState> builder) {
        builder.add(LIT);
    }
    
    @Override
    public ActionResult onUse(BlockState state, World world, BlockPos pos,
                             PlayerEntity player, Hand hand,
                             BlockHitResult hit) {
        // 右键切换开关状态
        if (!world.isClient) {
            world.setBlockState(pos, state.with(LIT, !state.get(LIT)));
        }
        return ActionResult.success(world.isClient);
    }
}
```

### 7.2 方块放置验证

```java
// 自定义放置规则
public class LadderBlock extends Block {
    
    public LadderBlock(Settings settings) {
        super(settings.nonOpaque().strength(0.4f));
    }
    
    @Override
    public BlockState getPlacementState(BlockPlacementContext context) {
        World world = context.getWorld();
        BlockPos pos = context.getBlockPos();
        BlockPos neighborPos = pos.offset(context.getSide());
        BlockState neighborState = world.getBlockState(neighborPos);
        
        // 检查是否连接在固体方块上
        if (neighborState.isSolid()) {
            return this.getDefaultState()
                .with(FACING, context.getSide().getOpposite());
        }
        
        return null;  // 无法放置
    }
    
    @Override
    public boolean canPlaceAt(BlockState state, WorldView world, 
                              BlockPos pos) {
        Direction facing = state.get(FACING);
        return world.getBlockState(pos.offset(facing)).isSolid();
    }
}
```

---

## 8. 关键源码文件

| 文件 | 路径 | 说明 |
|-----|------|-----|
| `Block.java` | `net.minecraft.block.Block` | 方块核心类 |
| `AbstractBlock.java` | `net.minecraft.block.AbstractBlock` | 方块抽象基类 |
| `BlockWithEntity.java` | `net.minecraft.block.BlockWithEntity` | 带实体的方块 |
| `Material.java` | `net.minecraft.block.Material` | 方块材质枚举 |
| `BlockState.java` | `net.minecraft.block.BlockState` | 方块状态 |

---

## 课后自查

完成本章学习后，请检查你是否理解：

- [ ] Block 类是单例模式
- [ ] AbstractBlock.Settings 配置方块属性
- [ ] 方块的放置和破坏生命周期
- [ ] BlockWithEntity 用于需要额外数据的方块
- [ ] 方块如何注册到注册表
- [ ] 如何创建自定义方块

---

## 延伸阅读

- [15-方块状态](./16-block-state.md) - 深入了解 BlockState
- [16-方块实体](./17-block-entity.md) - 了解 BlockEntity
