# 第四章：注册系统

> 这一章介绍 Minecraft 的注册系统，学习如何正确注册方块、物品、实体等。

---

## 目录

1. [什么是注册？](#1-什么是注册)
2. [注册表 (Registry)](#2-注册表-registry)
3. [注册方块](#3-注册方块)
4. [注册物品](#4-注册物品)
5. [注册实体](#5-注册实体)
6. [同时注册方块和物品](#6-同时注册方块和物品)
7. [常见问题](#7-常见问题)

---

## 1. 什么是注册？

### 1.1 为什么需要注册？

Minecraft 的世界由大量的游戏对象组成：
- 100+ 种方块
- 1000+ 种物品
- 100+ 种生物
- 还有很多...

这些都需要一个"身份证"来标识，注册就是给这些对象发"身份证"的过程。

### 1.2 不注册会怎样？

```
❌ 不注册 = 游戏不认识你的对象

示例：
registry.register("my_block", new Block())  // 注册了，游戏认识
registry.register("my_block", new Block())  // 重复注册，报错！

未注册方块：
- 玩家无法获得（/give 命令无效）
- 无法保存到存档
- 网络无法同步
```

---

## 2. 注册表 (Registry)

### 2.1 什么是注册表？

注册表就像一个巨大的字典，记录了所有游戏对象：

```
┌─────────────────────────────────────┐
│           注册表 (Registry)           │
├─────────────────────────────────────┤
│  物品注册表 (Registries.ITEM)        │
│  ├── minecraft:diamond        → 钻石 │
│  ├── minecraft:stick          → 木棍 │
│  ├── mymod:magic_crystal     → 魔法水晶│
│  └── ...                             │
├─────────────────────────────────────┤
│  方块注册表 (Registries.BLOCK)        │
│  ├── minecraft:stone         → 石头 │
│  ├── minecraft:diamond_block → 钻石块 │
│  └── ...                             │
└─────────────────────────────────────┘
```

### 2.2 常用注册表

```java
import net.minecraft.registry.Registries;

// 物品注册表
Registries.ITEM

// 方块注册表
Registries.BLOCK

// 实体注册表
Registries.ENTITY_TYPE

// 音效注册表
Registries.SOUND_EVENT

// 粒子类型注册表
Registries.PARTICLE_TYPE

// 方块实体类型注册表
Registries.BLOCK_ENTITY_TYPE
```

### 2.3 理解 Identifier（标识符）

Identifier 就像是游戏对象的"门牌号"：

```
Identifier = 命名空间 + 路径

Identifier.of("mymod", "magic_crystal")
    │        │
    │        └── 路径（物品名称）
    │
    └── 命名空间（通常是 Mod ID）
    
最终格式：mymod:magic_crystal
```

**命名空间规则**：
- 使用小写字母、数字、下划线
- 通常是你的 Mod ID
- 不能与其他 Mod 冲突

---

## 3. 注册方块

### 3.1 基本语法

```java
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.block.Block;

// 定义方块
Block myBlock = new Block(Block.Settings.create().strength(3.0f));

// 注册到方块注册表
Registry.register(
    Registries.BLOCK,           // 注册表
    Identifier.of("mymod", "my_block"),  // ID
    myBlock                     // 方块对象
);
```

### 3.2 完整示例

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.block.Block;

public class Blocks {
    // 定义方块
    public static final Block MAGIC_BLOCK = new Block(
        Block.Settings.create()
            .strength(3.0f)           // 硬度（挖掘时间）
            .requiresTool()            // 需要工具才能挖掘
    );

    public static final Block GLOWING_BLOCK = new Block(
        Block.Settings.create()
            .strength(2.0f)
            .luminance(state -> 15)    // 发光等级（0-15）
    );

    public static void register() {
        // 注册每个方块
        registerBlock("magic_block", MAGIC_BLOCK);
        registerBlock("glowing_block", GLOWING_BLOCK);
    }

    private static void registerBlock(String name, Block block) {
        Registry.register(
            Registries.BLOCK,
            Identifier.of(Mymod.MOD_ID, name),
            block
        );
    }
}
```

### 3.3 方块属性

```java
Block.Settings.create()
    .strength(3.0f)                    // 硬度和抗爆属性（可以用 .breakByTool() 设置）
    .strength(3.0f, 6.0f)             // 第一个是硬度，第二个是爆炸抗性
    .requiresTool()                     // 需要工具才能挖掘
    .requiresTool(ToolType.PICKAXE)     // 需要特定工具
    .breakByTool(ToolType.HAND, 0)     // 手可以破坏
    .luminance(state -> 15)           // 发光等级
    .resistance(6.0f)                  // 爆炸抗性
    .slipperiness(0.98f)               // 平滑度（冰是 0.98）
    .velocityMultiplier(1.0f)           // 速度乘数
    .jumpVelocityMultiplier(1.0f)      // 跳跃高度乘数
    .air()                             // 是空气（透明）
    .solid()                           // 是固体
    .solidBlock((state, world, pos) -> true)  // 自定义固体判断
    .sounds(BlockSoundGroup.GRASS)    // 音效
```

---

## 4. 注册物品

### 4.1 基本语法

```java
import net.minecraft.item.Item;

// 定义物品
Item myItem = new Item(new Item.Settings().maxCount(64));

// 注册到物品注册表
Registry.register(
    Registries.ITEM,
    Identifier.of("mymod", "my_item"),
    myItem
);
```

### 4.2 完整示例

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.fabricmc.fabric.api.item.v1.FabricItemSettings;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.item.Item;

public class Items {
    // 普通物品
    public static final Item MAGIC_CRYSTAL = new Item(
        new FabricItemSettings().maxCount(64)
    );

    // 不可堆叠物品
    public static final Item TOOL = new Item(
        new FabricItemSettings().maxCount(1)
    );

    // 食物
    public static final Item MAGIC_FOOD = new Item(
        new FabricItemSettings()
            .maxCount(16)
            .food(new FoodComponent.Builder()
                .hunger(8)                    // 恢复 8 点饥饿值
                .saturationModifier(10.0f)    // 饱和度
                .meat()                       // 是肉类
                .snack()                      // 是零食
                .alwaysEdible()               // 总是可以吃（空腹时）
                .statusEffect(
                    new StatusEffectInstance(
                        StatusEffects.SPEED,   // 给予速度效果
                        600,                   // 持续 30 秒（600 ticks）
                        0                      // 等级 0（第一级）
                    ),
                    1.0f                     // 概率 100%
                )
                .build()
            )
    );

    public static void register() {
        registerItem("magic_crystal", MAGIC_CRYSTAL);
        registerItem("magic_tool", TOOL);
        registerItem("magic_food", MAGIC_FOOD);
    }

    private static void registerItem(String name, Item item) {
        Registry.register(
            Registries.ITEM,
            Identifier.of(Mymod.MOD_ID, name),
            item
        );
    }
}
```

### 4.3 物品设置

```java
new FabricItemSettings()
    .maxCount(64)                     // 最大堆叠数
    .maxCount(1)                     // 不可堆叠
    .maxDamage(100)                  // 耐久度
    .recipeRemainder(Items.STICK)    // 配方剩余物
    .group(ItemGroup.MISC)           // 所属物品栏
    .fireproof()                    // 防火
    .enchantable(10)                 // 可附魔等级
```

---

## 5. 注册实体

### 5.1 基本语法

```java
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.world.World;

// 定义实体
EntityType<MyEntity> myEntity = EntityType.Builder.create(
    MyEntity::new,                  // 实体工厂方法
    SpawnGroup.CREATURE             // 生成组
)
.dimensions(0.8f, 0.8f)            // 大小（宽, 高）
.maximumNoDespawnDistance(64)      // 最大不消失距离
.spawnMethod(SpawnGroup.Creature.SpawnCondition::canSpawn)  // 生成条件
.build("my_entity");

// 注册到实体注册表
Registry.register(
    Registries.ENTITY_TYPE,
    Identifier.of("mymod", "my_entity"),
    myEntity
);
```

### 5.2 完整示例

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.entity.MagicSlime;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.world.Heightmap;

public class Entities {
    public static final EntityType<MagicSlime> MAGIC_SLIME = EntityType.Builder
        .create(MagicSlime::new, SpawnGroup.CREATURE)
        .dimensions(1.0f, 1.0f)                   // 碰撞箱大小
        .maxTrackDistance(10.0f)                   // 最大追踪距离
        .trackRangeBlocks(8)                       // 追踪范围
        .spawnMethod(SpawnGroup.CREATURE.SpawnCondition::canSpawn)
        .build("magic_slime");

    public static void register() {
        registerEntity("magic_slime", MAGIC_SLIME);
    }

    private static <T extends net.minecraft.entity.Entity> void registerEntity(String name, EntityType<T> entity) {
        Registry.register(
            Registries.ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, name),
            entity
        );
    }
}
```

### 5.3 生成组

```java
SpawnGroup.CREATURE       // 生物 - 动物、怪物
SpawnGroup.MONSTER       // 怪物 - 僵尸、骷髅
SpawnGroup.AMBIENT       // 环境生物 - 蝙蝠
SpawnGroup.AQUATIC       // 水生生物 - 鱼、鱿鱼
SpawnGroup.WATER_AMBIENT // 水环境 - 水母
SpawnGroup.MISC         // 其他 - 掉落物、经验球
```

---

## 6. 同时注册方块和物品

### 6.1 为什么要同时注册？

当创建一个"可以放置的方块"时，你需要：
1. 注册方块本身（用于放置）
2. 注册对应的物品形式（用于玩家拿取）

### 6.2 推荐模式

```java
public static void register() {
    // 先注册方块
    Registry.register(
        Registries.BLOCK,
        Identifier.of(MOD_ID, "magic_block"),
        MAGIC_BLOCK
    );

    // 再注册对应的物品
    Registry.register(
        Registries.ITEM,
        Identifier.of(MOD_ID, "magic_block"),
        new BlockItem(MAGIC_BLOCK, new FabricItemSettings())
    );
}
```

### 6.3 简化写法

```java
public class Blocks {
    public static final Block MAGIC_BLOCK = new Block(...);

    // 方法一：手动注册两个
    public static final Item MAGIC_BLOCK_ITEM = new BlockItem(MAGIC_BLOCK, settings);

    // 方法二：用辅助方法
    public static void registerAll() {
        registerBlock("magic_block", MAGIC_BLOCK);
    }

    private static void registerBlock(String name, Block block) {
        // 注册方块
        Registry.register(Registries.BLOCK, id(name), block);
        // 注册方块物品
        Registry.register(Registries.ITEM, id(name), new BlockItem(block, new FabricItemSettings()));
    }

    private static Identifier id(String path) {
        return Identifier.of(MOD_ID, path);
    }
}
```

---

## 7. 常见问题

### Q1: 报错 "Registry already contains"？

**原因**：尝试重复注册相同 ID 的内容。

```bash
# 错误示例：重复注册
Registry.register(Registries.ITEM, id("my_item"), item1);
Registry.register(Registries.ITEM, id("my_item"), item2);  // ❌ 会报错！
```

**解决**：确保每个 ID 只注册一次。

### Q2: 游戏里找不到物品？

**检查清单**：
1. ✅ 是否调用了注册方法？
2. ✅ 物品 ID 是否正确？
3. ✅ 是否有对应的语言文件？
4. ✅ 是否在 Mod 入口类中调用了注册？

### Q3: 物品无法放置成方块？

**原因**：只注册了物品，没有注册对应的方块。

**解决**：同时注册方块和 BlockItem。

### Q4: 注册顺序重要吗？

**回答**：大多数情况下不重要，但建议遵循：
1. 先注册方块
2. 再注册物品
3. 最后注册实体

---

## 总结

```
注册三要素：
┌─────────────────────────────────────┐
│ 1. 标识符 (Identifier)               │
│    Identifier.of("modid", "name")  │
├─────────────────────────────────────┤
│ 2. 注册表 (Registry)                 │
│    Registries.ITEM                  │
│    Registries.BLOCK                 │
│    Registries.ENTITY_TYPE           │
├─────────────────────────────────────┤
│ 3. 注册方法                          │
│    Registry.register(...)           │
└─────────────────────────────────────┘
```

---

## 下一步

现在你学会了注册系统！接下来：
- [创建自定义方块](../part-2-blocks-items/01-creating-blocks.md) - 学习创建完整的方块
- [创建自定义物品](../part-2-blocks-items/03-creating-items.md) - 学习创建完整的物品

---

*参考：[注册系统分析](../analysis/)* - 深入了解注册机制
