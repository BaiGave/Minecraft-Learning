---
title: 第 19 章：ItemStack物品堆叠详解（ItemStack）
readingTime: 30
---

# 第 19 章：ItemStack物品堆叠详解（ItemStack）

## 章节目标

通过本章学习，你将掌握：
- ItemStack（物品堆叠）的核心概念
- ItemStack 与 Item 的关系
- 物品数量管理
- 物品操作方法（复制、合并、分割）
- ItemStack 的序列化
- 容器与 ItemStack 的交互

## 前置知识

建议先阅读：
- [17-物品基础](./18-item-basics.md) - Item 类的基本概念

## 核心概念

### ItemStack = 背包里的物品实例

想象 ItemStack 是背包里的**物品卡片**：

```
┌─────────────────────────────────────────────────────────────┐
│              ItemStack = 背包里的物品卡片                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🎒 背包                                                    │
│     │                                                        │
│     ├── 📋 格子0: ItemStack                               │
│     │     │                                                  │
│     │     ├── Item: DIAMOND_SWORD                         │
│     │     ├── count: 1                                    │
│     │     └── ComponentMap:                                │
│     │           ├── DAMAGE: 150                           │
│     │           ├── ENCHANTMENTS: Sharpness III            │
│     │           └── CUSTOM_NAME: "My Sword"               │
│     │                                                        │
│     ├── 📋 格子1: ItemStack                               │
│     │     │                                                  │
│     │     ├── Item: DIAMOND                               │
│     │     └── count: 47                                   │
│     │                                                        │
│     └── 📋 格子2: null (空格子)                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键类比**：
- Item = 物品的设计图（定义类型和功能）
- ItemStack = 背包里的物品卡片（带数量和组件数据）
- 同一个 Item 可以有多个 ItemStack
- ItemStack 是物品系统的主要操作对象

---

## 1. ItemStack 概述

### 1.1 ItemStack 类结构

```java
148:1373:ItemStack.java
public final class ItemStack
implements ComponentHolder,
           FabricItemStack {
    
    // 序列化编解码器
    public static final Codec<ItemStack> CODEC = ...;
    public static final Codec<ItemStack> UNCOUNTED_CODEC = ...;
    public static final Codec<ItemStack> VALIDATED_CODEC = ...;
    
    // 网络传输编解码器
    public static final PacketCodec<RegistryByteBuf, ItemStack> OPTIONAL_PACKET_CODEC = ...;
    public static final PacketCodec<RegistryByteBuf, ItemStack> PACKET_CODEC = ...;
    
    // 物品数量
    private int count;
    
    // 动画时间
    private int bobbingAnimationTime;
    
    // 物品引用（非空时）
    @Deprecated
    @Nullable
    private final Item item;
    
    // 组件映射 (1.21新特性)
    final ComponentMapImpl components;
}
```

### 1.2 ItemStack 与 Item

```
Item 与 ItemStack 的关系：

┌─────────────────────────────────────────────────────────────┐
│  Item (物品定义)                                             │
│  "class DiamondSword extends Item"                          │
│                                                              │
│  ├── 默认属性                                              │
│  ├── 使用方法                                              │
│  └── 物品类型                                              │
│                                                              │
│                         │                                    │
│                         │ 创建多个实例                         │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ItemStack (物品实例)                                   │  │
│  │                                                      │  │
│  │  ItemStack 1:                                         │  │
│  │  ├── item: DiamondSword                              │  │
│  │  ├── count: 1                                        │  │
│  │  └── damage: 150                                     │  │
│  │                                                      │  │
│  │  ItemStack 2:                                         │  │
│  │  ├── item: DiamondSword                              │  │
│  │  ├── count: 1                                        │  │
│  │  └── damage: 50                                      │  │
│  │                                                      │  │
│  │  ItemStack 3:                                         │  │
│  │  ├── item: DiamondSword                              │  │
│  │  ├── count: 1                                        │  │
│  │  ├── damage: 0                                       │  │
│  │  └── enchantments: Sharpness V                        │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 构造函数与创建

### 2.1 创建 ItemStack

```java
// 各种创建方式
// 1. 从物品创建
ItemStack stack1 = new ItemStack(Items.DIAMOND);
// 结果: Diamond x1

// 2. 指定数量
ItemStack stack2 = new ItemStack(Items.DIAMOND, 64);
// 结果: Diamond x64

// 3. 从另一个 ItemStack 复制
ItemStack stack3 = new ItemStack(stack2);
// 结果: Diamond x64 (完全独立副本)

// 4. 浅复制（共享组件引用）
ItemStack stack4 = stack2.copy();
// 结果: Diamond x64 (独立副本)

// 5. 从 NBT 创建
ItemStack stack5 = ItemStack.fromNbt(nbtCompound);

// 6. 从注册表ID创建
ItemStack stack6 = Registries.ITEM.get(identifier).getDefaultStack();
```

### 2.2 静态工厂方法

```java
// Item 类的工厂方法
public class Item {
    
    // 获取默认堆叠
    public ItemStack getDefaultStack() {
        return new ItemStack(this);
    }
    
    // 获取指定数量的堆叠
    public ItemStack getDefaultStack(int count) {
        return new ItemStack(this, count);
    }
}

// 使用示例
ItemStack defaultStack = Items.DIAMOND.getDefaultStack();
ItemStack stack = Items.DIAMOND.getDefaultStack(16);
```

---

## 3. 数量管理

### 3.1 数量操作

```java
// 获取数量
int count = stack.getCount();  // 返回 1-64

// 设置数量
stack.setCount(10);

// 增加数量
stack.incrementCount(1);  // +1
stack.incrementCount(5);   // +5

// 减少数量（会检查是否为空）
boolean removed = stack.decrementCount(1);  // -1

// 最大堆叠检查
boolean isAtMax = stack.isAtMaxStackCount();  // count >= maxStackCount

// 清空
stack.clear();
```

### 3.2 数量限制

```java
// 最大堆叠数取决于物品
public int getMaxCount() {
    if (this.item == null) {
        return 0;
    }
    return this.item.getMaxCount();
}

// 常见物品的最大堆叠数：
// - 常规物品: 64
// - 不可堆叠物品: 1 (工具、武器等)
// - 雪球、鸡蛋: 16
// - 干草块: 64

// 尝试设置最大可能数量
public void setCount(int count) {
    int max = this.getMaxCount();
    this.count = MathHelper.clamp(count, 0, max);
}
```

### 3.3 数量操作示例

```java
// 安全的数量操作
public void addItems(PlayerEntity player, Item item, int amount) {
    ItemStack existing = player.getInventory().getStack(
        player.getInventory().first(StackPredicateItem.of(item))
    );
    
    if (existing.isEmpty()) {
        // 没有该物品，创建新的
        player.getInventory().offerOrDrop(
            new ItemStack(item, Math.min(amount, item.getMaxCount()))
        );
    } else {
        // 追加到现有物品
        int space = existing.getMaxCount() - existing.getCount();
        int toAdd = Math.min(amount, space);
        existing.incrementCount(toAdd);
    }
}

// 分割物品
public ItemStack splitStack(PlayerEntity player, int slot, int amount) {
    ItemStack source = player.getInventory().getStack(slot);
    if (source.isEmpty()) {
        return ItemStack.EMPTY;
    }
    
    if (amount >= source.getCount()) {
        // 返回全部
        player.getInventory().setStack(slot, ItemStack.EMPTY);
        return source;
    }
    
    // 返回一部分
    ItemStack result = source.split(amount);
    return result;
}
```

---

## 4. 物品检查方法

### 4.1 类型检查

```java
// 检查是否为特定物品
if (stack.isOf(Items.DIAMOND)) {
    // 是钻石
}

// 检查是否为特定方块
if (stack.isOf(Blocks.DIRT)) {
    // 是泥土方块
}

// 检查是否为空气（空）
if (stack.isEmpty()) {
    // 是空的
}

// 检查物品类型
if (stack.getItem() instanceof SwordItem) {
    // 是剑
}
```

### 4.2 状态检查

```java
// 检查是否可堆叠
if (!stack.isStackable()) {
    // 不可堆叠（耐久度已满的物品等）
}

// 检查是否有耐久度
if (stack.isDamaged()) {
    int damage = stack.getDamage();
    int maxDamage = stack.getMaxDamage();
}

// 检查是否已损坏（耐久度用尽）
if (stack.isBroken()) {
    // 耐久度已用尽，应该被移除
}

// 检查是否有附魔
if (stack.hasEnchantments()) {
    EnchantmentHelper.getEnchantments(stack);
}
```

### 4.3 比较方法

```java
// 严格相等（数量和组件都相等）
if (stack1.equals(stack2)) {
    // 完全相同
}

// 物品类型相等（忽略数量）
if (stack1.isOf(stack2.getItem())) {
    // 同一类型的物品
}

// 可堆叠检查（类型相同且可合并）
if (ItemStack.canCombine(stack1, stack2)) {
    // 可以合并
}
```

---

## 5. 合并与分割

### 5.1 合并操作

```java
// 尝试合并两个 ItemStack
public static boolean canCombine(@Nullable ItemStack first, @Nullable ItemStack second) {
    if (first == null || second == null) {
        return false;
    }
    if (!first.isOf(second.getItem())) {
        return false;
    }
    if (first.getCount() + second.getCount() > first.getMaxCount()) {
        return false;
    }
    return Objects.equals(first.getComponents(), second.getComponents());
}

// 合并示例
public boolean mergeItemStack(List<ItemStack> inventory, ItemStack stack) {
    for (int i = 0; i < inventory.size(); i++) {
        ItemStack existing = inventory.get(i);
        
        if (ItemStack.canCombine(existing, stack)) {
            // 可以合并
            int space = existing.getMaxCount() - existing.getCount();
            int toAdd = Math.min(space, stack.getCount());
            
            existing.incrementCount(toAdd);
            stack.decrementCount(toAdd);
            
            if (stack.isEmpty()) {
                return true;  // 全部合并完成
            }
        }
    }
    
    return false;
}
```

### 5.2 分割操作

```java
// 分割 ItemStack
public ItemStack split(int amount) {
    return this.split(amount, false);
}

public ItemStack split(int amount, boolean Simon) {
    if (this.isEmpty()) {
        return ItemStack.EMPTY;
    }
    
    int i = Math.min(amount, this.count);
    ItemStack itemStack = this.copy();
    itemStack.setCount(i);
    this.decrementCount(i);
    
    return itemStack;
}

// 分割一个
public ItemStack splitOne() {
    return this.split(1);
}

// 分割给玩家
public boolean splitInto(PlayerEntity player, int slot) {
    if (player.isCreative()) {
        return false;
    }
    
    ItemStack original = this.copy();
    ItemStack split = original.split(1);
    
    if (original.isEmpty() || split.isEmpty()) {
        return false;
    }
    
    this.setCount(original.getCount());
    
    // 尝试放入玩家背包
    return player.getInventory().insertStack(split);
}
```

---

## 6. 容器交互

### 6.1 放入容器

```java
// 放入物品到容器
public int insertStack(int slot, ItemStack stack) {
    if (stack.isEmpty()) {
        return 0;
    }
    
    if (!this.isValid(slot, stack)) {
        return stack.getCount();
    }
    
    ItemStack existing = this.getStack(slot);
    
    if (existing.isEmpty()) {
        // 格子为空，直接放入
        this.setStack(slot, stack.copy());
        return 0;
    }
    
    if (ItemStack.canCombine(existing, stack)) {
        // 可以合并
        int space = existing.getMaxCount() - existing.getCount();
        int toAdd = Math.min(space, stack.getCount());
        
        existing.incrementCount(toAdd);
        stack.decrementCount(toAdd);
        
        this.markDirty();
        return stack.getCount();
    }
    
    // 无法合并
    return stack.getCount();
}
```

### 6.2 从容器取出

```java
// 取出物品
public ItemStack removeStack(int slot) {
    return this.removeStack(slot, Integer.MAX_VALUE);
}

public ItemStack removeStack(int slot, int amount) {
    ItemStack stack = this.getStack(slot);
    if (stack.isEmpty()) {
        return ItemStack.EMPTY;
    }
    
    if (amount >= stack.getCount()) {
        // 取出全部
        this.setStack(slot, ItemStack.EMPTY);
        return stack;
    }
    
    // 取出部分
    ItemStack result = stack.split(amount);
    this.markDirty();
    return result;
}
```

### 6.3 容器操作示例

```java
// 完整容器操作类
public class InventoryHelper {
    
    // 添加物品到容器
    public static int addToInventory(DefaultedList<ItemStack> inventory, 
                                    ItemStack stack) {
        int remaining = stack.getCount();
        
        // 1. 先尝试合并
        for (int i = 0; i < inventory.size() && remaining > 0; i++) {
            ItemStack existing = inventory.get(i);
            if (ItemStack.canCombine(existing, stack)) {
                int space = existing.getMaxCount() - existing.getCount();
                int toAdd = Math.min(space, remaining);
                
                existing.incrementCount(toAdd);
                remaining -= toAdd;
            }
        }
        
        // 2. 尝试放入空格子
        for (int i = 0; i < inventory.size() && remaining > 0; i++) {
            if (inventory.get(i).isEmpty()) {
                inventory.set(i, stack.copy());
                inventory.get(i).setCount(remaining);
                return 0;
            }
        }
        
        return remaining;  // 返回剩余未放入的数量
    }
    
    // 移除特定物品
    public static int removeFromInventory(DefaultedList<ItemStack> inventory,
                                       Item item, int amount) {
        int remaining = amount;
        
        for (int i = 0; i < inventory.size() && remaining > 0; i++) {
            ItemStack stack = inventory.get(i);
            
            if (stack.isOf(item)) {
                int toRemove = Math.min(stack.getCount(), remaining);
                stack.decrementCount(toRemove);
                remaining -= toRemove;
                
                if (stack.isEmpty()) {
                    inventory.set(i, ItemStack.EMPTY);
                }
            }
        }
        
        return remaining;  // 返回剩余未移除的数量
    }
}
```

---

## 7. NBT 序列化

### 7.1 保存到 NBT

```java
// ItemStack 序列化为 NBT
public NbtCompound toNbt(RegistryWrapper.WrapperLookup lookup) {
    NbtCompound nbt = new NbtCompound();
    
    if (!this.isEmpty()) {
        // 保存物品ID
        nbt.putString("id", Registries.ITEM.getId(this.getItem()).toString());
        
        // 保存数量
        nbt.putInt("Count", this.getCount());
        
        // 保存组件/数据
        if (this.components != null) {
            Components.CODEC.encodeStart(lookup.getOps(NbtOps.INSTANCE), this.components)
                .resultOrPartial(...)
                .ifPresent(nbt::put);
        }
    }
    
    return nbt;
}

// NBT 结构示例
// {
//   "id": "minecraft:diamond_sword",
//   "Count": 1,
//   "components": {
//     "minecraft:damage": 150,
//     "minecraft:enchantments": {...},
//     "minecraft:custom_name": "..."
//   }
// }
```

### 7.2 从 NBT 加载

```java
// 从 NBT 反序列化
public static ItemStack fromNbt(NbtCompound nbt) {
    if (!nbt.contains("id")) {
        return ItemStack.EMPTY;
    }
    
    Identifier id = new Identifier(nbt.getString("id"));
    Item item = Registries.ITEM.get(id);
    
    if (item == null) {
        return ItemStack.EMPTY;
    }
    
    ItemStack stack = new ItemStack(item);
    
    if (nbt.contains("Count")) {
        stack.setCount(nbt.getInt("Count"));
    }
    
    // 1.21 组件系统
    if (nbt.contains("components")) {
        Components.CODEC.decodeStart(lookup.getOps(NbtOps.INSTANCE), 
            nbt.getCompound("components"))
            .resultOrPartial(...)
            .ifPresent(stack::setComponents);
    }
    
    // 旧版本兼容
    if (nbt.contains("tag")) {
        // 旧版本的 tag 字段兼容处理
        NbtCompound tag = nbt.getCompound("tag");
        // ... 转换为组件
    }
    
    return stack;
}
```

---

## 8. 物品复制策略

### 8.1 复制方法对比

```java
// 浅复制 - 共享组件引用
public ItemStack copy() {
    if (this.isEmpty()) {
        return ItemStack.EMPTY;
    }
    return new ItemStack(this.item, this.count, this.components);
}

// 深复制 - 完全独立副本
public ItemStack copy() {
    ItemStack copy = new ItemStack(this.item, this.count);
    copy.components = this.components.copy();  // 复制组件
    return copy;
}
```

### 8.2 复制策略选择

```
复制策略选择：

┌─────────────────────────────────────────────────────────────┐
│  浅复制 (copy())                                            │
│  ├─ 用途: 临时操作，不修改原始数据                          │
│  ├─ 性能: 更快（共享组件）                                  │
│  └─ 风险: 意外修改可能影响原始数据                          │
├─────────────────────────────────────────────────────────────┤
│  深复制 (deepCopy())                                         │
│  ├─ 用途: 需要独立修改                                       │
│  ├─ 性能: 较慢（复制所有数据）                              │
│  └─ 风险: 安全，完全独立                                   │
├─────────────────────────────────────────────────────────────┤
│  数量复制 (split())                                         │
│  ├─ 用途: 分割物品                                          │
│  ├─ 行为: 原物品减少数量，返回新物品                        │
│  └─ 风险: 原始物品被修改                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 实战演示

### 9.1 物品操作工具类

```java
// 物品操作工具
public class ItemStackUtils {
    
    // 检查物品是否可以修复
    public static boolean isRepairable(ItemStack tool, ItemStack material) {
        if (!tool.isDamageable() || !material.isOf(tool.getItem())) {
            return false;
        }
        
        // 检查是否是修复材料
        return tool.getItem().canRepair(tool, material);
    }
    
    // 修复物品
    public static boolean repair(ItemStack tool, ItemStack material) {
        if (!isRepairable(tool, material)) {
            return false;
        }
        
        int repairAmount = Math.min(
            tool.getMaxDamage() - tool.getDamage(),
            material.getCount() * 10  // 每个材料修复10点耐久
        );
        
        int materialsNeeded = (repairAmount + 9) / 10;
        
        if (materialsNeeded > material.getCount()) {
            return false;
        }
        
        tool.setDamage(tool.getDamage() - repairAmount);
        material.decrementCount(materialsNeeded);
        
        return true;
    }
    
    // 升级物品
    public static ItemStack upgrade(ItemStack base, ItemStack upgrade) {
        if (!base.isOf(Items.DIAMOND_SWORD) || !upgrade.isOf(Items.NETHERITE_INGOT)) {
            return base;
        }
        
        ItemStack result = base.copy();
        result = Items.NETHERITE_SWORD.getDefaultStack();
        // 保留附魔等组件
        // ...
        
        return result;
    }
}
```

### 9.2 物品过滤

```java
// 物品过滤
public class ItemFilter {
    
    // 创建物品过滤器
    public static Predicate<ItemStack> of(Item item) {
        return stack -> stack.isOf(item);
    }
    
    public static Predicate<ItemStack> of(Block block) {
        return stack -> stack.isOf(block.asItem());
    }
    
    public static Predicate<ItemStack> withTag(String tag) {
        return stack -> stack.getComponents().contains(DataComponentTypes.customName);
    }
    
    // 组合过滤器
    public static Predicate<ItemStack> and(Predicate<ItemStack>... predicates) {
        return stack -> {
            for (Predicate<ItemStack> p : predicates) {
                if (!p.test(stack)) {
                    return false;
                }
            }
            return true;
        };
    }
    
    public static Predicate<ItemStack> or(Predicate<ItemStack>... predicates) {
        return stack -> {
            for (Predicate<ItemStack> p : predicates) {
                if (p.test(stack)) {
                    return true;
                }
            }
            return false;
        };
    }
}
```

---

## 10. 关键源码文件

| 文件 | 路径 | 说明 |
|-----|------|-----|
| `ItemStack.java` | `net.minecraft.item.ItemStack` | 物品堆叠核心类 |
| `Inventory.java` | `net.minecraft.entity.player.Inventory` | 玩家背包 |
| `DefaultedList.java` | `net.minecraft.util.collection.DefaultedList` | 默认列表实现 |

---

## 课后自查

完成本章学习后，请检查你是否理解：

- [ ] ItemStack 与 Item 的关系
- [ ] ItemStack 的创建方式
- [ ] 数量管理方法
- [ ] 合并与分割操作
- [ ] NBT 序列化
- [ ] 复制策略的选择

---

## 延伸阅读

- [17-物品基础](./18-item-basics.md) - Item 类的详细说明
- [19-组件系统](./20-item-component.md) - 1.21 新组件系统
