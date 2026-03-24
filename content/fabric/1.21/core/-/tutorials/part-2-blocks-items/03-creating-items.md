# 第二章：创建自定义物品

> 这一章学习如何创建和使用自定义物品，包括普通物品、工具、盔甲和食物等。

---

## 目录

1. [物品基础](#1-物品基础)
2. [创建普通物品](#2-创建普通物品)
3. [创建工具物品](#3-创建工具物品)
4. [创建盔甲物品](#4-创建盔甲物品)
5. [创建食物物品](#5-创建食物物品)
6. [物品使用事件](#6-物品使用事件)

---

## 1. 物品基础

### 1.1 物品的类型

```
┌─────────────────────────────────────┐
│           Minecraft 物品类型             │
├─────────────────────────────────────┤
│  基础物品 (Item)                      │
│  ├── 普通物品                         │
│  ├── 食物                            │
│  ├── 工具                            │
│  └── 盔甲                            │
├─────────────────────────────────────┤
│  方块物品 (BlockItem)                  │
│  └── 可放置的方块                     │
├─────────────────────────────────────┤
│  特殊物品                            │
│  ├── 耐久物品                        │
│  ├── 可附魔物品                       │
│  └── 弹药物品                        │
└─────────────────────────────────────┘
```

### 1.2 物品属性

```java
new FabricItemSettings()
    .maxCount(64)          // 最大堆叠数
    .maxCount(1)          // 不可堆叠
    .maxDamage(100)        // 最大耐久度
    .recipeRemainder(Items.STICK)  // 配方剩余物
    .group(ItemGroup.MISC) // 所属物品栏
    .fireproof()           // 防火
    .enchantable(10)      // 可附魔等级
```

---

## 2. 创建普通物品

### 2.1 基本物品

```java
// 普通可堆叠物品
public static final Item MAGIC_CRYSTAL = new Item(
    new FabricItemSettings().maxCount(64)
);

// 不可堆叠物品
public static final Item MAGIC_GEM = new Item(
    new FabricItemSettings().maxCount(1)
);
```

### 2.2 可附魔物品

```java
// 默认可附魔
public static final Item SWORD = new SwordItem(
    ToolMaterials.DIAMOND,
    3,          // 攻击力加成
    -2.4f,      // 攻击速度
    new FabricItemSettings().maxCount(1)
);

// 自定义可附魔等级
public static final Item SPECIAL_ITEM = new Item(
    new FabricItemSettings()
        .maxCount(1)
        .enchantable(15)  // 可附魔等级
);
```

---

## 3. 创建工具物品

### 3.1 工具属性

```java
// 预设工具材料
ToolMaterials.WOOD      // 木头
ToolMaterials.STONE     // 石头
ToolMaterials.IRON     // 铁
ToolMaterials.DIAMOND   // 钻石
ToolMaterials.GOLD      // 金子
ToolMaterials.NETHERITE // 下界合金
```

### 3.2 创建剑

```java
// 剑
public static final Item MAGIC_SWORD = new SwordItem(
    ToolMaterials.DIAMOND,
    5,              // 攻击力加成
    -2.4f,          // 攻击速度
    new FabricItemSettings()
        .maxCount(1)
        .group(ItemGroup.COMBAT)  // 战斗物品栏
);
```

### 3.3 创建工具

```java
// 镐子
public static final Item MAGIC_PICKAXE = new PickaxeItem(
    ToolMaterials.DIAMOND,
    1.5f,    // 攻击力
    -2.8f,   // 挖掘速度
    new FabricItemSettings().maxCount(1)
);

// 斧头
public static final Item MAGIC_AXE = new AxeItem(
    ToolMaterials.DIAMOND,
    6.0f,    // 攻击力
    -3.1f,   // 挖掘速度
    new FabricItemSettings().maxCount(1)
);

// 铲子
public static final Item MAGIC_SHOVEL = new ShovelItem(
    ToolMaterials.DIAMOND,
    1.5f,    // 攻击力
    -3.0f,   // 挖掘速度
    new FabricItemSettings().maxCount(1)
);

// 锄头
public static final Item MAGIC_HOE = new HoeItem(
    ToolMaterials.DIAMOND,
    -1,      // 攻击力
    0f,      // 使用速度
    new FabricItemSettings().maxCount(1)
);
```

### 3.4 创建自定义工具

```java
// 自定义工具（扩展 MiningToolItem）
public static final Item HAMMER = new MiningToolItem(
    3.0f,                    // 攻击力
    -3.2f,                   // 挖掘速度
    ToolMaterials.DIAMOND,     // 工具材料
    Set.of(Blocks.COBBLESTONE, Blocks.STONE_BRICKS),  // 有效方块
    new FabricItemSettings().maxCount(1)
);
```

---

## 4. 创建盔甲物品

### 4.1 盔甲材料

```java
// 预设盔甲材料
ArmorMaterials.LEATHER      // 皮革
ArmorMaterials.IRON        // 铁
ArmorMaterials.DIAMOND      // 钻石
ArmorMaterials.GOLD        // 金子
ArmorMaterials.NETHERITE   // 下界合金
ArmorMaterials.TURTLE     // 乌龟壳
```

### 4.2 创建盔甲

```java
// 创建护甲材料
public static final ArmorMaterial MAGIC_ARMOR_MATERIAL = new ArmorMaterial() {
    @Override
    public int getDurability(EquipmentSlot slot) {
        return switch (slot) {
            case BOOTS -> 100;
            case LEGGINGS -> 115;
            case CHESTPLATE -> 130;
            case HELMET -> 85;
            default -> 0;
        };
    }

    @Override
    public int getProtectionAmount(EquipmentSlot slot) {
        return switch (slot) {
            case BOOTS -> 3;
            case LEGGINGS -> 6;
            case CHESTPLATE -> 8;
            case HELMET -> 4;
            default -> 0;
        };
    }

    @Override
    public int getEnchantability() {
        return 15;
    }

    @Override
    public SoundEvent getEquipSound() {
        return SoundEvents.ITEM_ARMOR_EQUIP_DIAMOND;
    }

    @Override
    public float getToughness() {
        return 2.0f;
    }

    @Override
    public float getKnockbackResistance() {
        return 0.1f;
    }

    @Override
    public String getName() {
        return "magic_armor";
    }
};
```

### 4.3 注册盔甲

```java
// 头盔
public static final Item MAGIC_HELMET = new ArmorItem(
    MAGIC_ARMOR_MATERIAL,
    EquipmentSlot.HEAD,
    new FabricItemSettings().maxCount(1).group(ItemGroup.COMBAT)
);

// 胸甲
public static final Item MAGIC_CHESTPLATE = new ArmorItem(
    MAGIC_ARMOR_MATERIAL,
    EquipmentSlot.CHEST,
    new FabricItemSettings().maxCount(1).group(ItemGroup.COMBAT)
);

// 护腿
public static final Item MAGIC_LEGGINGS = new ArmorItem(
    MAGIC_ARMOR_MATERIAL,
    EquipmentSlot.LEGS,
    new FabricItemSettings().maxCount(1).group(ItemGroup.COMBAT)
);

// 靴子
public static final Item MAGIC_BOOTS = new ArmorItem(
    MAGIC_ARMOR_MATERIAL,
    EquipmentSlot.FEET,
    new FabricItemSettings().maxCount(1).group(ItemGroup.COMBAT)
);
```

---

## 5. 创建食物物品

### 5.1 基础食物

```java
// 简单食物（无效果）
public static final Item MAGIC_APPLE = new Item(
    new FabricItemSettings()
        .maxCount(16)
        .food(new FoodComponent.Builder()
            .hunger(8)                 // 恢复 8 点饥饿值
            .saturationModifier(10.0f)  // 饱和度
            .build()
        )
);
```

### 5.2 带效果的食物

```java
// 附魔金苹果效果
public static final Item ENCHANTED_MAGIC_APPLE = new Item(
    new FabricItemSettings()
        .maxCount(1)
        .food(new FoodComponent.Builder()
            .hunger(4)
            .saturationModifier(9.6f)
            .statusEffect(
                new StatusEffectInstance(StatusEffects.REGENERATION, 100, 1),  // 再生 5秒
                1.0f   // 概率 100%
            )
            .statusEffect(
                new StatusEffectInstance(StatusEffects.RESISTANCE, 100, 0),   // 抗性 5秒
                1.0f
            )
            .statusEffect(
                new StatusEffectInstance(StatusEffects.FIRE_RESISTANCE, 100, 0),  // 火抗 5秒
                1.0f
            )
            .alwaysEdible()  // 总是可以吃
            .build()
        )
);
```

### 5.3 食物属性详解

```java
new FoodComponent.Builder()
    .hunger(4)                    // 恢复的饥饿值
    .saturationModifier(6.0f)     // 饱和度（通常是 hunger * 2）
    .meat()                       // 是肉类（狼可以吃）
    .snack()                      // 是零食（不会打断饱食度恢复）
    .fast()                       // 快速食物（吃更快）
    .alwaysEdible()               // 总是可以吃
    .usingConvertsTo(Items.GLASS_BOTTLE)  // 使用后变成空瓶
    .statusEffect(StatusEffectInstance, float probability)  // 给予状态效果
```

---

## 6. 物品使用事件

### 6.1 监听物品使用

```java
import net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents;

PlayerBlockBreakEvents.AFTER.register((world, player, pos, state, blockEntity) -> {
    // 方块被破坏后
    if (state.isOf(Blocks.DIAMOND_ORE)) {
        // 给玩家奖励
        player.giveItemStack(new ItemStack(Items.DIAMOND, 2));
    }
});
```

### 6.2 自定义物品行为

```java
public class MagicWandItem extends Item {
    public MagicWandItem() {
        super(new FabricItemSettings()
            .maxCount(1)
            .maxDamage(100)
        );
    }

    @Override
    public boolean use(World world, PlayerEntity player, Hand hand) {
        if (!world.isClient) {
            // 服务端逻辑
            ItemStack stack = player.getStackInHand(hand);

            // 治疗玩家
            player.heal(5.0f);

            // 消耗耐久
            stack.damage(1, player, EquipmentSlot.MAINHAND);

            // 播放音效
            world.playSound(
                null,
                player.getX(), player.getY(), player.getZ(),
                SoundEvents.ENTITY_GENERIC_DRINK,
                SoundCategory.PLAYERS,
                1.0f, 1.0f
            );
        }

        return super.use(world, player, hand);
    }
}
```

---

## 下一步

现在你已经学会了创建各种物品！接下来可以学习：
- [物品栏分组](./04-item-groups.md) - 学习如何组织物品
- [创建自定义方块](./01-creating-blocks.md) - 继续创建方块

---

*参考：[物品系统分析](../../analysis/03-item-recipe-system.md)*
