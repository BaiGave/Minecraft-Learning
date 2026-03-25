---
title: 第 16 章：方块状态详解（Block State）
readingTime: 30
---

# 第 16 章：方块状态详解（Block State）

## 章节目标

通过本章学习，你将掌握：
- BlockState（方块状态）的概念和作用
- StateManager 状态管理器的使用
- 常见属性类型（BooleanProperty、IntProperty、DirectionProperty等）
- 状态转换和查询方法
- BlockState 与 Block 的关系

## 前置知识

建议先阅读：
- [14-方块基础](./15-block-basics.md) - Block 类的基本概念

## 核心概念

### BlockState = 方块的"表情"

想象每个方块都有不同的**表情（状态）**：

```
┌─────────────────────────────────────────────────────────────┐
│              BlockState = 方块的"表情"                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  😐 石头的"表情"                                             │
│     └── 永远是平静的（无状态）                                 │
│                                                              │
│  😠 红石红石的"表情"                                          │
│     ├── 😐 关闭 (powered=false)                             │
│     └── 😡 开启 (powered=true)                              │
│                                                              │
│  🚪 木门的"表情"                                             │
│     ├── 关闭 + 东 (facing=east, open=false)                │
│     ├── 关闭 + 西 (facing=west, open=false)                │
│     ├── 开启 + 东 (facing=east, open=true)                 │
│     └── 开启 + 西 (facing=west, open=true)                 │
│                                                              │
│  ⚡ 活塞的"表情"                                             │
│     ├── 朝向 + 伸出 + 延伸                                  │
│     └── 4方向 × 2状态 × 延伸 = 32种表情                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键类比**：
- Block = 积木的类型（所有同类型方块共用）
- BlockState = 积木的具体摆放方向/状态
- 同一个 Block 可以有多个 BlockState
- 状态决定方块的外观和部分行为

---

## 1. BlockState 概述

### 1.1 BlockState 类

```java
15:28:BlockState.java
public class BlockState
extends AbstractBlock.AbstractBlockState
implements FabricBlockState {
    
    public static final Codec<BlockState> CODEC = BlockState.createCodec(
        Registries.BLOCK.getCodec(), 
        Block::getDefaultState
    ).stable();
}
```

### 1.2 BlockState vs Block

```
Block 与 BlockState 的关系：

┌─────────────────────────────────────────────────────────────┐
│                         Block                                  │
│  "class StoneBlock extends Block"                           │
│                                                              │
│  ├── 硬度和抗爆性                                            │
│  ├── 音效和材质                                             │
│  ├── 破坏逻辑                                               │
│  └── 放置/破坏回调                                          │
│                                                              │
│                         │                                    │
│                         │ 有多个 BlockState                   │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                      BlockState                        │  │
│  │  StoneBlock.getDefaultState()                         │  │
│  │                                                      │  │
│  │  ├── 石头的默认状态（无属性）                          │  │
│  │  └── BlockState 只存储:                              │  │
│  │      - 所属 Block                                    │  │
│  │      - 属性值映射 (Property → Value)                  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. StateManager 状态管理器

### 2.1 状态管理器结构

```java
// StateManager 定义方块的所有可能状态
public class StateManager<Block, BlockState> {
    
    // 所属方块
    private final Block owner;
    
    // 所有属性列表
    private final List<Property<?>> properties;
    
    // 属性到值的映射
    private final Map<List<Comparable<?>>, BlockState> states;
    
    // 默认状态
    private final BlockState defaultState;
}

// 注册属性到 Block
public class Block {
    protected final StateManager<Block, BlockState> stateManager;
    
    // 在子类中注册属性
    protected void appendProperties(StateManager.Builder<Block, BlockState> builder) {
        // 子类重写此方法
    }
}
```

### 2.2 属性注册示例

```java
// 木门方块的状态注册
public class DoorBlock extends BlockWithEntity {
    
    // 定义属性
    public static final BooleanProperty OPEN = BooleanProperty.of("open");
    public static final BooleanProperty HINGE = BooleanProperty.of("hinge");
    public static final DirectionProperty FACING = DirectionProperty.of("facing", 
        Direction.Type.HORIZONTAL);
    public static final IntProperty POWER = IntProperty.of("power", 0, 15);
    
    @Override
    protected void appendProperties(StateManager.Builder<Block, BlockState> builder) {
        builder.add(OPEN, HALF, HINGE, FACING, POWER);
    }
}

// 结果：
// OPEN: [false, true] = 2
// HALF: [lower, upper] = 2
// HINGE: [left, right] = 2
// FACING: [north, south, east, west] = 4
// POWER: [0-15] = 16
//
// 总状态数: 2 × 2 × 2 × 4 × 16 = 512 种可能状态
```

---

## 3. 属性类型

### 3.1 BooleanProperty

```java
// 布尔属性 - 两个值
public class BooleanProperty extends Property<Boolean> {
    
    public static BooleanProperty of(String name) {
        return new BooleanProperty(name);
    }
    
    // 示例: powered
    public static final BooleanProperty POWERED = BooleanProperty.of("powered");
}

// 创建和使用
BooleanProperty WATERLOGGED = BooleanProperty.of("waterlogged");

// 状态查询
BlockState state = world.getBlockState(pos);
boolean isPowered = state.get(POWERED);

// 状态修改
BlockState newState = state.with(POWERED, true);

// 检查值
if (state.get(POWERED)) {
    // 方块已通电
}
```

### 3.2 IntProperty

```java
// 整数属性 - 指定范围内的整数
public class IntProperty extends Property<Integer> {
    
    public static IntProperty of(String name, int min, int max) {
        return new IntProperty(name, min, max);
    }
    
    public static IntProperty of(String name, int min, int max, IntUnaryOperator mapper) {
        return new IntProperty(name, min, max, mapper);
    }
}

// 示例: 红石比较器功率
public static final IntProperty POWER = IntProperty.of("power", 0, 15);

// 示例: 蛋糕切片
public static final IntProperty BITES = IntProperty.of("bites", 0, 6);

// 使用
BlockState state = world.getBlockState(pos);
int power = state.get(POWER);
BlockState newState = state.with(POWER, 15);
```

### 3.3 DirectionProperty

```java
// 方向属性 - 六个方向或水平/垂直方向
public class DirectionProperty extends Property<Direction> {
    
    public static DirectionProperty of(String name, Direction.Type type) {
        return new DirectionProperty(name, type);
    }
    
    public static DirectionProperty of(String name, Direction... directions) {
        return new DirectionProperty(name, Arrays.asList(directions));
    }
}

// 示例: 水平方向（4个方向）
public static final DirectionProperty HORIZONTAL_FACING = 
    DirectionProperty.create("facing", Direction.Type.HORIZONTAL);

// 示例: 全部6个方向
public static final DirectionProperty FACING = DirectionProperty.create("facing");

// 使用
BlockState state = world.getBlockState(pos);
Direction facing = state.get(FACING);

// 旋转90度
BlockState rotated = state.with(FACING, facing.rotateYClockwise());
```

### 3.4 EnumProperty

```java
// 枚举属性 - 任意枚举类型的值
public class EnumProperty<T extends Enum<T>> extends Property<T> {
    
    public static <T extends Enum<T>> EnumProperty of(String name, Class<T> enumClass) {
        return new EnumProperty(name, enumClass);
    }
}

// 示例: 楼梯形状
public static final EnumProperty<Shape> SHAPE = 
    EnumProperty.of("shape", Shape.class);

// Shape 枚举
public enum Shape {
    STRAIGHT,
    INNER_LEFT,
    INNER_RIGHT,
    OUTER_LEFT,
    OUTER_RIGHT
}

// 使用
BlockState state = world.getBlockState(pos);
Shape shape = state.get(SHAPE);
```

### 3.5 属性类型对比

```
┌─────────────────────────────────────────────────────────────┐
│                    属性类型对比                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  属性类型         │ 值数量        │ 示例                      │
│  ────────────────┼───────────────┼───────────────────────  │
│  BooleanProperty  │ 2             │ OPEN, POWERED          │
│  IntProperty      │ 可配置        │ POWER(0-15)             │
│  DirectionProperty│ 6或4或2       │ FACING, HORIZONTAL_FACING│
│  EnumProperty     │ 枚举值数量    │ SHAPE, Hinge           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 状态操作方法

### 4.1 获取属性值

```java
// 获取布尔属性
boolean value = state.get(BooleanProperty);

// 获取整数属性
int value = state.get(IntProperty);

// 获取方向属性
Direction value = state.get(DirectionProperty);

// 获取枚举属性
MyEnum value = state.get(EnumProperty);
```

### 4.2 设置属性值

```java
// with() 方法创建新的状态
BlockState newState = state.with(property, value);

// 示例
BlockState door = world.getBlockState(doorPos);

// 切换门的开闭状态
BlockState toggled = door.with(DoorBlock.OPEN, !door.get(DoorBlock.OPEN));

// 设置门的朝向
BlockState rotated = door.with(DoorBlock.FACING, Direction.NORTH);

// 组合多个属性
BlockState newState = state
    .with(POWERED, true)
    .with(FACING, Direction.EAST)
    .with(POWER, 15);
```

### 4.3 状态循环

```java
// cycle() 循环到下一个值
BlockState nextState = state.cycle(Property);

// 示例: 旋转活塞
BlockState rotated = state.cycle(PistonBlock.FACING);

// 对于布尔属性，cycle() 就是切换
BlockState toggled = state.cycle(DoorBlock.OPEN);
```

### 4.4 状态匹配

```java
// matches() 检查属性值
boolean matches = state.matches(Property, value);

// 示例: 检查门是否打开
if (state.matches(DoorBlock.OPEN, true)) {
    // 门是开着的
}

// 检查多个条件
boolean matches = state.matches(POWERED, true) 
              && state.matches(FACING, Direction.NORTH);
```

---

## 5. 状态与方块行为

### 5.1 状态影响渲染

```java
// BlockState 影响模型选择
public class PistonBlock extends Block {
    
    @Override
    public BlockState getPlacementState(BlockPlacementContext context) {
        return this.getDefaultState()
            .with(FACING, context.getPlayerLookDirection().getOpposite())
            .with(EXTENDED, false);
    }
    
    @Override
    public VoxelShape getOutlineShape(BlockState state, BlockView view, 
                                     BlockPos pos, ShapeContext context) {
        Direction facing = state.get(FACING);
        boolean extended = state.get(EXTENDED);
        
        // 根据状态返回不同形状
        if (extended) {
            return EXTENDED_SHAPES[facing.ordinal()];
        } else {
            return RETRACTED_SHAPES[facing.ordinal()];
        }
    }
}
```

### 5.2 状态影响交互

```java
// 根据状态决定交互行为
public class LeverBlock extends Block {
    
    @Override
    public ActionResult onUse(BlockState state, World world, BlockPos pos,
                            PlayerEntity player, Hand hand, BlockHitResult hit) {
        
        if (world.isClient) {
            return ActionResult.SUCCESS;
        }
        
        // 切换状态
        BlockState newState = state.with(POWERED, !state.get(POWERED));
        world.setBlockState(pos, newState, 3);
        
        // 播放音效
        world.playSound(null, pos, 
            state.get(POWERED) ? SoundEvents.BLOCK_LEVER_OFF 
                               : SoundEvents.BLOCK_LEVER_ON,
            SoundCategory.BLOCKS);
        
        // 发出红石信号
        world.updateNeighborsAlways(pos, this);
        
        return ActionResult.CONSUME;
    }
}
```

---

## 6. BlockState 缓存

### 6.1 状态缓存机制

```java
// StateManager 中缓存所有状态
public class StateManager<Block, BlockState> {
    
    private final Map<List<Comparable<?>>, BlockState> states;
    
    // 获取或创建状态
    public BlockState getStateForPropertyMap(List<Comparable<?>> values) {
        return states.computeIfAbsent(values, this::createState);
    }
}

// Block 限制状态数量
public class Block {
    // 如果状态数超过4096，发出警告
    // Minecraft 建议每个 Block 的状态数不超过 64
}
```

### 6.2 状态数量警告

```
状态数量计算示例：

一个楼梯方块:
- FACING: 4 (东、南、西、北)
- HALF: 2 (底部、顶部)
- SHAPE: 5 (直线、内左、内右、外左、外右)
- WATERLOGGED: 2 (是、否)

总状态数: 4 × 2 × 5 × 2 = 80 种状态

⚠️ 状态过多会导致:
- 内存占用增加
- 模型注册变慢
- 调试困难
```

---

## 7. 实战演示

### 7.1 遍历所有可能状态

```java
// 遍历方块的所有状态
public void iterateAllStates(Block block) {
    StateManager<?, BlockState> manager = block.getStateManager();
    
    // 获取所有属性
    List<Property<?>> properties = manager.getProperties();
    
    // 使用递归生成所有组合
    List<Map<Property<?>, Comparable<?>>> combinations = 
        generateCombinations(properties, 0, new HashMap<>());
    
    System.out.println("状态总数: " + combinations.size());
    
    for (Map<Property<?>, Comparable<?>> combo : combinations) {
        BlockState state = block.getDefaultState();
        for (Map.Entry<Property<?>, Comparable<?>> entry : combo.entrySet()) {
            state = state.with(entry.getKey(), entry.getValue());
        }
        System.out.println("状态: " + state);
    }
}

private List<Map<Property<?>, Comparable<?>>> generateCombinations(
        List<Property<?>> properties, int index, 
        Map<Property<?>, Comparable<?>> current) {
    
    if (index == properties.size()) {
        return List.of(new HashMap<>(current));
    }
    
    Property<?> prop = properties.get(index);
    List<Map<Property<?>, Comparable<?>>> result = new ArrayList<>();
    
    for (Comparable<?> value : prop.getValues()) {
        current.put(prop, value);
        result.addAll(generateCombinations(properties, index + 1, current));
        current.remove(prop);
    }
    
    return result;
}
```

### 7.2 状态查询工具

```java
// 查询方块的当前状态
public void printBlockState(World world, BlockPos pos) {
    BlockState state = world.getBlockState(pos);
    Block block = state.getBlock();
    
    System.out.println("方块: " + block);
    System.out.println("状态:");
    
    for (Property<?> prop : state.getBlock().getStateManager().getProperties()) {
        Object value = state.get(prop);
        System.out.println("  " + prop.getName() + " = " + value);
    }
}
```

### 7.3 状态转换助手

```java
// 根据当前状态获取相邻位置的状态
public BlockState getNeighborState(World world, BlockPos pos, 
                                  Direction direction) {
    BlockState current = world.getBlockState(pos);
    
    if (current.contains(POWERED)) {
        // 如果有 POWERED 属性，切换它
        return current.cycle(POWERED);
    }
    
    if (current.contains(FACING)) {
        // 如果有 FACING 属性，旋转
        Direction currentFacing = current.get(FACING);
        Direction newFacing = direction.getAxis().isVertical() 
            ? currentFacing 
            : currentFacing.rotateYClockwise();
        return current.with(FACING, newFacing);
    }
    
    return current;
}
```

---

## 8. 状态与 NBT

### 8.1 状态序列化

```java
// BlockState 可以被序列化为字符串
public class BlockState {
    
    // 序列化为字符串
    public String serialize() {
        StringBuilder builder = new StringBuilder();
        builder.append(Registries.BLOCK.getId(this.getBlock()));
        
        if (!this.properties.isEmpty()) {
            builder.append('[');
            
            boolean first = true;
            for (Property<?> prop : this.properties) {
                if (!first) {
                    builder.append(',');
                }
                builder.append(prop.getName())
                       .append('=')
                       .append(this.get(prop));
                first = false;
            }
            
            builder.append(']');
        }
        
        return builder.toString();
    }
    
    // 示例输出
    // minecraft:oak_door[facing=north,half=lower,hinge=left,open=true,waterlogged=false]
}
```

### 8.2 从字符串解析

```java
// 从字符串解析 BlockState
public static BlockState parse(String str) {
    // 解析 minecraft:oak_door[facing=north,half=lower]
    
    int bracket = str.indexOf('[');
    String blockId = bracket > 0 ? str.substring(0, bracket) : str;
    
    Block block = Registries.BLOCK.get(new Identifier(blockId));
    BlockState state = block.getDefaultState();
    
    if (bracket > 0) {
        String propsStr = str.substring(bracket + 1, str.length() - 1);
        String[] pairs = propsStr.split(",");
        
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            String key = kv[0];
            String value = kv[1];
            
            Property<?> prop = block.getStateManager().getProperty(key);
            state = state.with(prop, prop.getValue(value));
        }
    }
    
    return state;
}
```

---

## 9. 关键源码文件

| 文件 | 路径 | 说明 |
|-----|------|-----|
| `BlockState.java` | `net.minecraft.block.BlockState` | 方块状态类 |
| `StateManager.java` | `net.minecraft.block.StateManager` | 状态管理器 |
| `Property.java` | `net.minecraft.block.property.Property` | 属性基类 |
| `BooleanProperty.java` | `net.minecraft.block.property.BooleanProperty` | 布尔属性 |
| `IntProperty.java` | `net.minecraft.block.property.IntProperty` | 整数属性 |
| `DirectionProperty.java` | `net.minecraft.block.property.DirectionProperty` | 方向属性 |

---

## 课后自查

完成本章学习后，请检查你是否理解：

- [ ] BlockState 与 Block 的关系
- [ ] StateManager 的作用
- [ ] 四种主要属性类型的用法
- [ ] with() 方法创建新状态
- [ ] 状态数量过多的问题
- [ ] 如何遍历所有状态

---

## 延伸阅读

- [14-方块基础](./15-block-basics.md) - Block 类的属性配置
- [16-方块实体](./17-block-entity.md) - BlockEntity 存储额外数据
