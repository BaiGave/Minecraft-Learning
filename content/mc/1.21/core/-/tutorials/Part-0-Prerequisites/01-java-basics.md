---
title: 第 01 章：Java 基础速查（Java Basics）
readingTime: 30
---


# 第 01 章：Java 基础速查（Java Basics）

## 章节目标

学完本章后，你将能够：
- 理解 Minecraft 源码中常见的 Java 语法和模式
- 读懂泛型、接口默认方法、lambda 表达式
- 识别常见的集合类型和 Stream API 用法

## 前置知识

假设你已有 Java 基础，本章聚焦于阅读 Minecraft 源码时可能遇到的关键语法。

## 核心概念

### 1. 泛型通配符

Minecraft 源码中大量使用泛型通配符：

```java
// 无上界通配符 - 只能读取，不能写入
void printItems(List<?> list) {
    for (Object item : list) {  // 只能当 Object 读
        System.out.println(item);
    }
}

// 上界通配符 - 只能读取 T 的方法
void printBlocks(List<? extends Block> blocks) {
    for (Block block : blocks) {  // 可以当 Block 读
        block.getDefaultState();  // ✅ 合法
        // blocks.add(new Block());  ❌ 非法
    }
}

// 下界通配符 - 只能写入 T 的子类型
void addIntegers(List<? super Integer> list) {
    list.add(1);      // ✅ 合法
    list.add(2.0);    // ❌ 非法
    Object obj = list.get(0);  // 只能当 Object 读
}
```

### 2. 接口默认方法

Java 8+ 支持接口的默认实现：

```java
public interface Registry<T> {
    
    // 抽象方法 - 必须实现
    T get(RegistryKey<T> key);
    
    // 默认方法 - 可选覆盖
    default T getOrThrow(RegistryKey<T> key) {
        T value = get(key);
        if (value == null) {
            throw new IllegalStateException("Missing: " + key);
        }
        return value;
    }
    
    // 静态方法 - 接口自带的工具方法
    static <T> RegistryKey<T> of(String namespace, String path) {
        return RegistryKey.of(RegistryKeys.ROOT, 
            Identifier.of(namespace, path));
    }
}
```

### 3. Lambda 表达式与方法引用

```java
// Lambda 基本形式
(x, y) -> x + y                    // 计算两数之和
() -> new Block()                   // 无参数构造
block -> block.getDefaultState()    // 单参数调用方法

// 方法引用
Block::getDefaultState              // 静态方法引用
Block::new                          // 构造方法引用
player::getName                     // 实例方法引用
System.out::println                 // 特定对象的实例方法
```

### 4. 嵌套类和枚举

```java
public class World {
    
    // 静态内部类
    public static class ChunkPos {
        public final int x;
        public final int z;
    }
    
    // 非静态内部类（隐式持有外部类引用）
    public class NeighborUpdater {
        public void update() {
            World.this.setBlock(...);  // 显式引用外部类
        }
    }
    
    // 匿名内部类 - 常用于回调
    Runnable task = new Runnable() {
        @Override
        public void run() {
            // 异步任务
        }
    };
    
    // 枚举
    public enum Difficulty {
        PEACEFUL(0),
        EASY(1),
        NORMAL(2),
        HARD(3);
        
        private final int value;
        Difficulty(int value) {
            this.value = value;
        }
    }
}
```

## Minecraft 常用集合

### ImmutableList vs List

```java
import com.google.common.collect.ImmutableList;

// Minecraft 倾向于使用不可变集合
ImmutableList<Block> AIR_BLOCKS = ImmutableList.of(
    Blocks.AIR, 
    Blocks.CAVE_AIR, 
    Blocks.VOID_AIR
);

// 使用 Builder 构建复杂不可变列表
ImmutableList<String> names = ImmutableList.<String>builder()
    .add("Alice")
    .addAll(otherNames)
    .build();
```

### ObjectArrayList

```java
// Minecraft 自定义的高性能数组列表
ObjectArrayList<Entity> entities = new ObjectArrayList<>();
entities.add(entity);
Entity first = entities.get(0);

// 用于减少 GC 压力的频繁添加/移除
```

### Maps 工具类

```java
import com.google.common.collect.Maps;

// 创建并发安全的 Map
Map<String, Registry<?>> map = Maps.newConcurrentMap();

// 创建有序 Map
Map<String, Block> sortedBlocks = Maps.newTreeMap();

// 转换 Map
Map<Block, Item> blockToItem = Maps.asMap(
    blockRegistry, 
    block -> block.asItem()
);
```

## Stream API 实战

```java
// 过滤并收集
List<Block> stoneBlocks = Registries.BLOCK.stream()
    .filter(block -> block.getId().getPath().contains("stone"))
    .collect(Collectors.toList());

// 查找第一个匹配的
Optional<Block> diamondOre = Registries.BLOCK.stream()
    .filter(block -> block.getId().equals(Identifier.ofVanilla("diamond_ore")))
    .findFirst();

// 映射转换
Set<Identifier> allBlockIds = Registries.BLOCK.stream()
    .map(Registries.BLOCK::getId)
    .collect(Collectors.toSet());

// 分组
Map<Rarity, List<Item>> itemsByRarity = Registries.ITEM.stream()
    .collect(Collectors.groupingBy(Item::getRarity));

// 计数
long totalBlocks = Registries.BLOCK.stream().count();

// 任意匹配
boolean hasDiamond = Registries.BLOCK.stream()
    .anyMatch(block -> block.getId().getPath().equals("diamond_block"));
```

## 常用注解

```java
// Minecraft 特有注解
@Environment(EnvType.CLIENT)      // 仅客户端可用
@Environment(EnvType.SERVER)      // 仅服务端可用

// Fabric 注解
@ImplementedInterface(factory = ...)  // 实现接口工厂
@Mixin(targets = Entity.class)         // Mixin 注入目标

// 标准注解
@Override                           // 方法重写
@Nullable                           // 可能为 null
@NotNull                            // 不可能为 null
@Deprecated                         // 已废弃
```

## Optional 最佳实践

```java
// 创建 Optional
Optional<Block> block = Optional.of(Blocks.DIAMOND);
Optional<Block> empty = Optional.empty();

// 使用 map 转换
Optional<Item> item = block.map(Block::asItem);

// 使用 orElse 提供默认值
Block result = block.orElse(Blocks.AIR);

// 使用 orElseThrow
Block result = block.orElseThrow(
    () -> new IllegalStateException("Block not found")
);

// 使用 ifPresent
block.ifPresent(b -> System.out.println(b.getName()));

// 链式操作
String name = block
    .map(Block::asItem)
    .map(Item::getName)
    .map(Text::getString)
    .orElse("Unknown");
```

## 函数式接口速查

```java
// Minecraft 常用函数式接口
Supplier<T>           // () -> T
Consumer<T>           // (T) -> void
Function<T, R>        // (T) -> R
Predicate<T>           // (T) -> boolean
BiFunction<T, U, R>   // (T, U) -> R
BiConsumer<T, U>       // (T, U) -> void
Runnable              // () -> void
Callable<V>           // () throws Exception
BooleanSupplier       // () -> boolean
IntSupplier           // () -> int
```

## 实战：阅读 Minecraft 源码片段

### 示例 1：泛型嵌套

```java
// MinecraftServer.java:89
private final Map<RegistryKey<World>, ServerWorld> worlds;
```

解读：
- `Map` 的 key 是 `RegistryKey<World>`
- `Map` 的 value 是 `ServerWorld`
- 这是一个从世界键到服务端世界的映射

### 示例 2：方法引用链

```java
// Bootstrap.java:480-485
Bootstrap.collectMissingTranslations(
    Registries.ATTRIBUTE, 
    EntityAttribute::getTranslationKey, 
    set
);
```

解读：
- `EntityAttribute::getTranslationKey` 是方法引用
- 等价于 `attr -> attr.getTranslationKey()`

### 示例 3：Stream + Lambda

```java
// 实际 Minecraft 代码风格
List<Item> valuableItems = Registries.ITEM.stream()
    .filter(item -> item.getMaxCount() > 1)
    .filter(item -> !item.isFood())
    .collect(Collectors.toList());
```

## 课后自查

1. 能否解释 `List<? extends Block>` 和 `List<? super Block>` 的区别？
2. `Block::getDefaultState` 属于哪种方法引用？
3. Minecraft 为什么倾向于使用 ImmutableList？
4. 如何使用 Stream API 统计所有物品的数量？
5. Optional 的 `map` 和 `flatMap` 有什么区别？

## 参考资源

- [Java 官方文档 - 泛型](https://docs.oracle.com/javase/tutorial/java/generics/)
- [Guava ImmutableList](https://github.com/google/guava/wiki/ImmutableCollectionsExplained)
