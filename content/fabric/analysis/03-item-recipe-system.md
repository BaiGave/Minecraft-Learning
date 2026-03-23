# Fabric API 物品与配方系统分析

## 概述

物品与配方系统模块包含三个核心子模块：
- `fabric-item-api-v1` - 物品 API 扩展
- `fabric-recipe-api-v1` - 配方 API 扩展
- `fabric-item-group-api-v1` - 物品栏分组系统

---

## 1. fabric-item-api-v1 模块

### 1.1 FabricItem 接口

```java
public interface FabricItem {
    // 组件更新动画控制
    default boolean allowComponentsUpdateAnimation(PlayerEntity player, Hand hand,
                                                  ItemStack oldStack, ItemStack newStack);

    // 持续挖掘进度控制
    default boolean allowContinuingBlockBreaking(PlayerEntity player,
                                                ItemStack oldStack, ItemStack newStack);

    // 配方剩余物处理
    default ItemStack getRecipeRemainder(ItemStack stack);

    // 附魔检查
    default boolean canBeEnchantedWith(ItemStack stack, RegistryEntry<Enchantment> enchantment,
                                       EnchantingContext context);

    // 获取创建者命名空间
    default String getCreatorNamespace(ItemStack stack);
}
```

### 1.2 CustomDamageHandler 接口

```java
@FunctionalInterface
public interface CustomDamageHandler {
    int damage(ItemStack stack, int amount, LivingEntity entity,
                EquipmentSlot slot, Runnable breakCallback);
}
```

### 1.3 EquipmentSlotProvider 接口

```java
@FunctionalInterface
public interface EquipmentSlotProvider {
    EquipmentSlot getPreferredEquipmentSlot(LivingEntity entity, ItemStack stack);
}
```

### 1.4 使用示例 - 自定义伤害处理

```java
public static final CustomDamageHandler WEIRD_DAMAGE_HANDLER =
    (stack, amount, entity, slot, breakCallback) -> {
        if (entity.isSneaking()) {
            return amount;
        } else {
            stack.set(WEIRD, Math.max(0, stack.getOrDefault(WEIRD, 0) + 1));
            return 0;
        }
    };

public static class WeirdPick extends PickaxeItem {
    protected WeirdPick() {
        super(ToolMaterials.GOLD,
              new Item.Settings().customDamage(WEIRD_DAMAGE_HANDLER));
    }
}
```

---

## 2. fabric-recipe-api-v1 模块

### 2.1 CustomIngredient 接口

```java
public interface CustomIngredient {
    // 测试物品堆栈是否匹配
    boolean test(ItemStack stack);

    // 获取匹配的物品堆栈列表（用于显示）
    List<ItemStack> getMatchingStacks();

    // 是否需要直接测试（NBT 检查）
    boolean requiresTesting();

    // 获取序列化器
    CustomIngredientSerializer<?> getSerializer();

    // 转换为原生 Ingredient
    default Ingredient toVanilla() {
        return new CustomIngredientImpl(this);
    }
}
```

### 2.2 内置自定义成分

| 成分类型 | 标识符 | 用途 |
|---------|--------|------|
| `AllIngredient` | `fabric:all` | 所有子成分都必须匹配 |
| `AnyIngredient` | `fabric:any` | 任一子成分匹配即可 |
| `DifferenceIngredient` | `fabric:difference` | 基础减去排除部分 |
| `CustomDataIngredient` | `fabric:custom_data` | 带有自定义 NBT 的物品 |
| `ComponentsIngredient` | `fabric:components` | 带有特定组件的物品 |

### 2.3 JSON 数据包格式

```json
{
    "fabric:type": "fabric:all",
    "ingredients": [
        {"item": "minecraft:diamond"},
        {"tag": "minecraft:wool"}
    ]
}
```

---

## 3. fabric-item-group-api-v1 模块

### 3.1 创建自定义物品栏

```java
Registry.register(Registries.ITEM_GROUP, ITEM_GROUP,
    FabricItemGroup.builder()
        .displayName(Text.literal("Test Item Group"))
        .icon(() -> new ItemStack(Items.DIAMOND))
        .entries((context, entries) -> {
            entries.addAll(Registries.ITEM.stream()
                    .map(ItemStack::new)
                    .filter(input -> !input.isEmpty())
                    .toList());
        })
        .build());
```

### 3.2 FabricItemGroupEntries API

```java
void add(ItemStack stack, ItemGroup.StackVisibility visibility);
void add(ItemConvertible item);
void prepend(ItemStack stack, ItemGroup.StackVisibility visibility);
void addAfter(ItemConvertible afterLast, Collection<ItemStack> newStacks);
void addBefore(ItemConvertible beforeFirst, Collection<ItemStack> newStacks);
```

### 3.3 ItemGroupEvents 事件系统

```java
// 通用事件：修改所有物品栏
public static final Event<ModifyEntriesAll> MODIFY_ENTRIES_ALL;

// 获取特定物品栏的事件
public static Event<ModifyEntries> modifyEntriesEvent(RegistryKey<ItemGroup> registryKey);
```

### 3.4 使用示例

```java
// 修改现有物品栏
ItemGroupEvents.modifyEntriesEvent(ItemGroups.BUILDING_BLOCKS)
    .register((content) -> {
        content.add(TEST_ITEM);
        content.addBefore(Blocks.OAK_FENCE, Items.DIAMOND);
    });

// 全局修改所有物品栏
ItemGroupEvents.MODIFY_ENTRIES_ALL.register((group, content) -> {
    if (group.getIcon() == ItemStack.EMPTY) return;
    content.prepend(new ItemStack(Items.DIAMOND_PICKAXE));
});
```

---

## 4. Mixin 注入点

| Mixin 类 | 注入目标 | 目的 |
|----------|----------|------|
| `ItemMixin` | `Item` | 实现 `FabricItem` 接口 |
| `ItemStackMixin` | `ItemStack` | 拦截 damage 方法 |
| `ItemSettingsMixin` | `Item.Settings` | 实现 `FabricItem.Settings` 接口 |
| `EnchantmentHelperMixin` | `EnchantmentHelper` | 重定向附魔检查方法 |
| `ComponentMapBuilderMixin` | `ComponentMap.Builder` | 实现 `FabricComponentMapBuilder` 接口 |
| `ItemGroupMixin` | `ItemGroup` | 在 `updateEntries` 末尾触发事件 |
| `ItemGroupsMixin` | `ItemGroups` | 实现分页和冲突检测 |
| `IngredientMixin` | `Ingredient` | 注入自定义编解码器 |

---

## 5. 完整使用示例

### 5.1 创建带自定义伤害处理的物品

```java
public class BatterySword extends SwordItem {
    private static final ComponentType<Integer> ENERGY = ...;
    private static final CustomDamageHandler HANDLER =
        (stack, amount, entity, slot, breakCallback) -> {
            int currentEnergy = stack.getOrDefault(ENERGY, 0);
            int damageFromEnergy = Math.min(currentEnergy, amount);
            int remainingDamage = amount - damageFromEnergy;

            stack.set(ENERGY, currentEnergy - damageFromEnergy);

            if (remainingDamage > 0 && stack.getDamage() + remainingDamage >= stack.getMaxDamage()) {
                breakCallback.run();
                return 0;
            }

            return remainingDamage;
        };

    public BatterySword() {
        super(ToolMaterials.GOLD,
              new Item.Settings().customDamage(HANDLER)
                                 .equipmentSlot((entity, stack) -> EquipmentSlot.MAINHAND));
    }
}
```

### 5.2 创建自定义物品栏并添加物品

```java
private static final RegistryKey<ItemGroup> MY_GROUP = RegistryKey.of(
    RegistryKeys.ITEM_GROUP, Identifier.of(MOD_ID, "my_group"));

@Override
public void onInitialize() {
    Registry.register(Registries.ITEM_GROUP, MY_GROUP,
        FabricItemGroup.builder()
            .displayName(Text.translatable("itemgroup.my_mod.my_group"))
            .icon(() -> new ItemStack(MyMod.MY_ITEM))
            .entries((context, entries) -> {
                entries.add(MyMod.MY_ITEM);
                entries.add(MyMod.MY_BLOCK);
            })
            .build());
}
```

---

*源码位置: `fabric-item-api-v1/`, `fabric-recipe-api-v1/`, `fabric-item-group-api-v1/`*
