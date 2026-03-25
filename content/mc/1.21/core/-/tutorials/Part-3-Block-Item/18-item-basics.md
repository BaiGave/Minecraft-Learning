---
title: 第 18 章：物品基础详解（Item Basics）
readingTime: 30
---

# 第 18 章：物品基础详解（Item Basics）

## 章节目标

通过本章学习，你将掌握：
- Item（物品）类的核心架构
- Item 与 Block 的关系
- Item 的生命周期方法
- 物品的注册机制
- 创建自定义物品

## 前置知识

建议先阅读：
- [Part-1 基础/05-注册表系统](./Part-1-Foundation/05-registry-system.md) - 注册表机制
- [14-方块基础](./15-block-basics.md) - Block 类的基本概念

## 核心概念

### Item = 玩家可以拿在手里的东西

想象 Minecraft 的物品系统是一个**背包**：

```
┌─────────────────────────────────────────────────────────────┐
│              Minecraft 物品系统 = 背包收纳                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🎒 背包 = Inventory                                        │
│     │                                                        │
│     ├── 📦 格子 = ItemStack[27]                            │
│     │     │                                                  │
│     │     └── [ItemStack, ItemStack, null, ...]             │
│     │                                                        │
│     └── 🖐️ 手中 = Player.getMainHandStack()               │
│           │                                                  │
│           └── ItemStack                                     │
│                 ├── Item (物品类型)                          │
│                 ├── int count (数量)                        │
│                 └── ComponentMap (组件数据)                   │
│                                                              │
│  Item = 物品定义                                             │
│  ItemStack = 物品实例                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键类比**：
- Item = 物品的设计图（定义类型和功能）
- ItemStack = 背包里的具体物品（带数量和状态）
- 同一个 Item 可以有多个 ItemStack
- ItemStack 是物品系统的主要操作对象

---

## 1. Item 类结构

### 1.1 Item 类定义

```java
96:808:Item.java
public class Item
implements ToggleableFeature,
           ItemConvertible,
           FabricItem {
    
    // 物品到方块的映射
    public static final Map<Block, Item> BLOCK_ITEMS = Maps.newHashMap();
    
    // 注册表条目
    private final RegistryEntry.Reference<Item> registryEntry = 
        Registries.ITEM.createEntry(this);
    
    // 组件数据
    private final ComponentMap components;
    
    // 配方剩余物品
    @Nullable
    private final Item recipeRemainder;
}
```

### 1.2 Item 的继承层次

```
Item (抽象基类)
├── ItemBlock (方块对应的物品)
├── ItemStack (注意：这是物品实例，不是Item的子类)
├── FoodItem (食物)
│   └── HoneyBottleItem
│   └── GoldenAppleItem
├── ToolItem (工具)
│   ├── SwordItem
│   ├── PickaxeItem
│   ├── AxeItem
│   └── ShovelItem
├── WeaponItem (武器)
│   └── BowItem
│   └── CrossbowItem
│   └── TridentItem
├── ArmorItem (盔甲)
│   └── HelmetItem
│   └── ChestplateItem
│   └── LeggingsItem
│   └── BootsItem
├── FishingRodItem (钓鱼竿)
├── CompassItem (指南针)
├── BucketItem (桶)
└── [其他专用物品...]
```

### 1.3 Item 与 Block 的关系

```java
// Item 实现了 ItemConvertible 接口
public class Item implements ItemConvertible {
    @Override
    public Item asItem() {
        return this;
    }
}

// Block 也实现了 ItemConvertible
public class Block implements ItemConvertible {
    @Override
    public Item asItem() {
        // 返回对应的 BlockItem
        return Item.BLOCK_ITEMS.get(this);
    }
}

// BlockItem 关联 Block 和 Item
public class BlockItem extends Item {
    private final Block block;
    
    public BlockItem(Block block, Settings settings) {
        this.block = block;
    }
    
    @Override
    public Block asItem() {
        return this.block;
    }
}
```

---

## 2. Item 的生命周期

### 2.1 使用方法

| 方法 | 描述 | 典型用途 |
|------|------|---------|
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

### 2.2 使用流程时序图

```
玩家右键使用物品 ─────────────────────────────────────────────►
    │
    ▼
use(world, player, hand) ─── 返回null → 使用失败
    │
    ▼ 返回 ActionResult
onBlockFirstClicked() ─── 方块交互前 ──► 返回null → 跳过
    │
    ▼
useOnBlock() ─── 在方块上使用 ──► 返回null → 继续传递
    │
    ▼
onUse() ─── 物品使用 ───► 返回 CONSUME → 物品被消耗
    │
    ▼
finishUsing() ─── 使用完成 ───► 返回消耗后的物品
```

### 2.3 核心使用方法

```java
// 使用物品（右键点击）
public TypedActionResult<ItemStack> use(World world, PlayerEntity player,
                                       Hand hand) {
    ItemStack stack = player.getStackInHand(hand);
    
    // 检查是否可以使用的条件
    if (canUse(stack)) {
        // 消耗物品
        stack.decrementAmount(1);
        return TypedActionResult.success(stack);
    }
    
    return TypedActionResult.fail(stack);
}

// 在方块上使用（放置方块）
public ActionResult useOnBlock(ItemUsageContext context) {
    // BlockItem 的默认实现
    // 放置对应的方块
}

// 完成使用（吃完食物等）
public ItemStack finishUsing(ItemStack stack, World world, LivingEntity user) {
    // 恢复饥饿值
    if (user instanceof PlayerEntity player) {
        player.getHungerManager().add(2, 0.5f);  // +2 饥饿, +0.5 饱和度
    }
    
    return stack;  // 返回空物品堆叠
}
```

---

## 3. Item 属性

### 3.1 物品设置

```java
// Item.Settings 配置物品属性
public static class Settings {
    private int maxCount = 64;          // 最大堆叠数
    private int maxDamage = 0;          // 最大耐久度（0=不可损坏）
    private RecipeRemainder recipeRemainder;  // 配方剩余物品
    private ComponentMap components;     // 组件
    
    // 叠加上限
    public Settings maxCount(int maxCount) {
        this.maxCount = maxCount;
        return this;
    }
    
    // 耐久度
    public Settings maxDamage(int maxDamage) {
        this.maxDamage = maxDamage;
        return this;
    }
    
    // 配方剩余
    public Settings recipeRemainder(Item item) {
        this.recipeRemainder = new RecipeRemainder(item);
        return this;
    }
}
```

### 3.2 常见物品配置

```java
// 常规物品 - 堆叠64
new Item(new Settings());

// 不可堆叠
new Item(new Settings().maxCount(1));

// 可损坏物品（工具、武器）
new SwordItem(ToolMaterials.DIAMOND, 3, -2.4f, 
    new Settings().maxDamage(1561));

// 食物
new Item(new Settings().food(FoodComponents.APPLE));

// 桶（装液体）
new BucketItem(FluidTypes.WATER, 
    new Settings().maxCount(1));

// 种子
new AliasedBlockItem(Blocks.WHEAT, 
    new Settings().food(FoodComponents.WHEAT_SEEDS));
```

### 3.3 食物组件

```java
// 食物属性配置
public class FoodComponent {
    private final int hunger;              // 恢复的饥饿值
    private final float saturation;         // 饱和度恢复
    private final boolean meat;             // 是否肉类
    private final boolean alwaysEdible;     // 是否空腹时才能吃
    private final float eatingSpeedSeconds; // 食用速度
    private final Effect[] effects;         // 状态效果
    private final float[] effectChances;    // 效果触发概率
    
    // 预定义食物
    public static final FoodComponent APPLE = new Builder()
        .hunger(4)
        .saturationModifier(0.3f)
        .build();
    
    public static final FoodComponent GOLDEN_APPLE = new Builder()
        .hunger(4)
        .saturationModifier(9.6f)
        .statusEffect(new StatusEffectInstance(StatusEffects.REGENERATION, 100, 1), 1.0f)
        .statusEffect(new StatusEffectInstance(StatusEffects.RESISTANCE, 6000, 0), 1.0f)
        .statusEffect(new StatusEffectInstance(StatusEffects.FIRE_RESISTANCE, 6000, 0), 1.0f)
        .statusEffect(new StatusEffectInstance(StatusEffects.ABSORPTION, 2400, 3), 1.0f)
        .alwaysEdible()
        .build();
}
```

---

## 4. 物品注册

### 4.1 静态注册

```java
// Items.java 中的静态注册
public class Items {
    
    // 物品声明
    public static final Item DIAMOND = new Item(new Settings().food(FoodComponents.DIAMOND));
    public static final Item IRON_SWORD = new SwordItem(Materials.IRON, 
        new Settings().attributeModifiers(...));
    public static final Item DIAMOND_PICKAXE = new PickaxeItem(Materials.DIAMOND, 
        new Settings().attributeModifiers(...));
    
    // 注册方法
    private static Item register(String path, Item item) {
        return Registry.register(Registries.ITEM, Identifier.ofVanilla(path), item);
    }
    
    // 静态初始化块
    static {
        register("diamond", DIAMOND);
        register("iron_sword", IRON_SWORD);
        register("diamond_pickaxe", DIAMOND_PICKAXE);
        // ...
    }
}
```

### 4.2 Mod 中注册

```java
// Mod 中注册自定义物品
public class MyMod implements ModInitializer {
    
    // 定义物品
    public static final Item MY_ITEM = new Item(new Settings()
        .maxCount(16)
        .rarity(Rarity.RARE)
    );
    
    public static final Item MY_FOOD = new Item(new Settings()
        .food(FoodComponents.GOLDEN_APPLE)
        .maxCount(1)
    );
    
    @Override
    public void onInitialize() {
        // 注册物品
        Registry.register(
            Registries.ITEM,
            Identifier.of("mymod", "my_item"),
            MY_ITEM
        );
        
        Registry.register(
            Registries.ITEM,
            Identifier.of("mymod", "my_food"),
            MY_FOOD
        );
    }
}
```

### 4.3 注册装饰性物品

```java
// 创建有自定义名称的物品
public static final Item CUSTOM_NAME_ITEM = new Item(new Settings()) {
    @Override
    public void appendTooltip(ItemStack stack, World world, 
                            List<Text> tooltip, TooltipContext context) {
        tooltip.add(Text.literal("这是一个自定义物品！"));
        tooltip.add(Text.literal("右键点击了解更多"));
    }
    
    @Override
    public TypedActionResult<ItemStack> use(World world, PlayerEntity player,
                                           Hand hand) {
        player.sendMessage(Text.literal("你使用了这个物品！"));
        return TypedActionResult.success(player.getStackInHand(hand));
    }
};
```

---

## 5. Item 特殊功能

### 5.1 工具属性

```java
// 工具材料
public class ToolMaterials {
    public static final ToolMaterial WOOD = new ToolMaterial(
        Ingredient.ofItems(Items.OAK_PLANKS),
        59,    // 耐久度
        2.0f,  // 挖掘速度
        0.0f,  // 攻击伤害加成
        15,    // 附魔值
        () -> Items.OAK_PLANKS
    );
    
    public static final ToolMaterial STONE = new ToolMaterial(
        Ingredient.ofItems(Items.COBBLESTONE),
        131,   // 耐久度
        4.0f,  // 挖掘速度
        1.0f,  // 攻击伤害加成
        5,     // 附魔值
        () -> Items.COBBLESTONE
    );
    
    public static final ToolMaterial IRON = new ToolMaterial(
        Ingredient.ofItems(Items.IRON_INGOT),
        250,   // 耐久度
        6.0f,  // 挖掘速度
        2.0f,  // 攻击伤害加成
        14,    // 附魔值
        () -> Items.IRON_INGOT
    );
    
    public static final ToolMaterial DIAMOND = new ToolMaterial(
        Ingredient.ofItems(Items.DIAMOND),
        1561,  // 耐久度
        8.0f,  // 挖掘速度
        3.0f,  // 攻击伤害加成
        10,    // 附魔值
        () -> Items.DIAMOND
    );
    
    public static final ToolMaterial NETHERITE = new ToolMaterial(
        Ingredient.ofItems(Items.NETHERITE_INGOT),
        2031,  // 耐久度
        9.0f,  // 挖掘速度
        4.0f,  // 攻击伤害加成
        15,    // 附魔值
        () -> Items.NETHERITE_INGOT
    );
}
```

### 5.2 盔甲属性

```java
// 盔甲材料
public class ArmorMaterials {
    public static final ArmorMaterial LEATHER = new ArmorMaterial(
        "leather",     // 名称
        5,            // 耐久（护甲值）
        new int[]{1, 2, 1, 1},  // 各部位护甲值
        15,           // 附魔值
        SoundEvents.ITEM_ARMOR_EQUIP_LEATHER,
        0.0f,         // 韧性
        () -> Ingredient.ofItems(Items.LEATHER)
    );
    
    public static final ArmorMaterial DIAMOND = new ArmorMaterial(
        "diamond",
        33,
        new int[]{3, 6, 8, 3},
        10,
        SoundEvents.ITEM_ARMOR_EQUIP_DIAMOND,
        2.0f,         // 韧性
        () -> Ingredient.ofItems(Items.DIAMOND)
    );
}
```

### 5.3 属性修饰符

```java
// 物品属性（攻击伤害、挖掘速度等）
public static AttributeModifier createAttributeModifier(
        EquipmentSlot slot, 
        UUID uuid, 
        String id, 
        double value, 
        AttributeModifier.Operation operation) {
    return new AttributeModifier(
        new UUID(uuid.getMostSignificantBits() + slot.getEntitySlotId(), 
                 uuid.getLeastSignificantBits()),
        "Attribute modifier",
        value,
        operation
    );
}

// 攻击伤害修饰符
AttributeModifier ATTACK_DAMAGE_MODIFIER = createAttributeModifier(
    EquipmentSlot.MAINHAND,
    ATTACK_DAMAGE_ID,
    2.0,  // +2 攻击伤害
    AttributeModifier.Operation.ADD_VALUE
);

// 挖掘速度修饰符
AttributeModifier ATTACK_SPEED_MODIFIER = createAttributeModifier(
    EquipmentSlot.MAINHAND,
    ATTACK_SPEED_ID,
    -0.1,  // -0.1 攻击速度（变得更慢）
    AttributeModifier.Operation.ADD_MULTIPLIER
);
```

---

## 6. 物品工具提示

### 6.1 自定义提示

```java
// 物品的 tooltip
public class MyItem extends Item {
    
    @Override
    public void appendTooltip(ItemStack stack, World world,
                             List<Text> tooltip, TooltipContext context) {
        // 添加基础提示
        tooltip.add(Text.literal("这是一个强大的物品！"));
        
        // 添加格式化提示
        tooltip.add(Text.literal("效果: ").append(
            Text.literal("+10 攻击力").formatted(Formatting.GREEN)
        ));
        
        // 添加条件提示
        if (context.isAdvanced()) {
            tooltip.add(Text.literal("物品ID: " + Registries.ITEM.getId(this)));
        }
    }
}
```

### 6.2 提示格式化

```java
// 格式化工具提示
public static void formatTooltip(ItemStack stack, List<Text> tooltip) {
    // 稀有度颜色
    Rarity rarity = stack.getRarity();
    tooltip.add(0, Text.literal("★ " + rarity.name)
        .formatted(rarity.color));
    
    // 耐久度
    if (stack.isDamaged()) {
        int damage = stack.getDamage();
        int maxDamage = stack.getMaxDamage();
        tooltip.add(Text.literal("耐久度: " + (maxDamage - damage) + "/" + maxDamage)
            .formatted(Formatting.GRAY));
    }
    
    // 附魔
    if (stack.hasEnchantments()) {
        tooltip.add(Text.literal("附魔:").formatted(Formatting.GRAY));
        for (var enchantment : stack.getEnchantments()) {
            tooltip.add(Text.literal("  " + enchantment.getTranslationKey()));
        }
    }
}
```

---

## 7. 实战演示

### 7.1 创建自定义食物

```java
// 自定义食物
public class MagicAppleItem extends Item {
    
    public MagicAppleItem(Settings settings) {
        super(settings.food(new FoodComponent.Builder()
            .hunger(4)
            .saturationModifier(9.6f)
            .statusEffect(
                new StatusEffectInstance(StatusEffects.REGENERATION, 400, 1), 
                1.0f
            )
            .statusEffect(
                new StatusEffectInstance(StatusEffects.ABSORPTION, 2400, 3), 
                1.0f
            )
            .statusEffect(
                new StatusEffectInstance(StatusEffects.RESISTANCE, 6000, 0), 
                1.0f
            )
            .statusEffect(
                new StatusEffectInstance(StatusEffects.FIRE_RESISTANCE, 6000, 0), 
                1.0f
            )
            .alwaysEdible()  // 随时可以吃
            .snack()         // 快速食用
            .build()
        ));
    }
    
    @Override
    public TypedActionResult<ItemStack> use(World world, PlayerEntity player, 
                                           Hand hand) {
        // 检查是否满饱
        if (player.getHungerManager().getFoodLevel() >= 20) {
            if (!player.canConsume(false)) {
                return TypedActionResult.fail(player.getStackInHand(hand));
            }
        }
        
        return super.use(world, player, hand);
    }
}
```

### 7.2 创建自定义工具

```java
// 自定义工具
public class MagicPickaxeItem extends PickaxeItem {
    
    public MagicPickaxeItem(ToolMaterial material, int attackDamage, 
                           float attackSpeed, Settings settings) {
        super(material, attackDamage, attackSpeed, settings);
    }
    
    @Override
    public boolean postMine(ItemStack stack, World world, BlockState state,
                           BlockPos pos, LivingEntity miner) {
        // 挖掘成功
        if (!world.isClient && state.getHardness(world, pos) != 0.0f) {
            // 额外掉落效果
            if (world.getRandom().nextFloat() < 0.1f) {
                // 10%几率额外掉落钻石
                ItemStack diamond = new ItemStack(Items.DIAMOND);
                dropStack(world, pos, diamond);
            }
            
            // 耐久度消耗
            stack.damage(1, world, miner, item -> {
                // 装备槽被破坏时回调
            });
        }
        
        return true;
    }
    
    @Override
    public boolean isSuitableFor(BlockState state) {
        // 适用的方块
        return state.isOf(Blocks.COBWEB) 
            || state.isOf(Blocks.REDSTONE_ORE)
            || super.isSuitableFor(state);
    }
}
```

---

## 8. 关键源码文件

| 文件 | 路径 | 说明 |
|-----|------|-----|
| `Item.java` | `net.minecraft.item.Item` | 物品核心类 |
| `ItemStack.java` | `net.minecraft.item.ItemStack` | 物品堆叠 |
| `Items.java` | `net.minecraft.item.Items` | 物品注册 |
| `FoodComponent.java` | `net.minecraft.item.FoodComponent` | 食物组件 |
| `ToolMaterials.java` | `net.minecraft.item.ToolMaterials` | 工具材料 |
| `BlockItem.java` | `net.minecraft.item.BlockItem` | 方块物品 |

---

## 课后自查

完成本章学习后，请检查你是否理解：

- [ ] Item 与 ItemStack 的区别
- [ ] Item 的生命周期方法
- [ ] Item.Settings 的配置选项
- [ ] 工具和盔甲的材料系统
- [ ] 物品注册流程
- [ ] 如何创建自定义物品

---

## 延伸阅读

- [18-ItemStack物品堆叠](./19-item-stack.md) - 深入了解 ItemStack
- [19-组件系统](./20-item-component.md) - 1.21 新组件系统
