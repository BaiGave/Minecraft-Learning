# 第三章：配方系统教程

> 这一章学习如何在 Fabric 中创建自定义合成配方，包括普通合成、烧制、交易等。

---

## 目录

1. [配方系统概述](#1-配方系统概述)
2. [基础配方类型](#2-基础配方类型)
3. [自定义配方成分](#3-自定义配方成分)
4. [数据生成器配方](#4-数据生成器配方)
5. [完整示例：工具合成](#5-完整示例工具合成)
6. [完整示例：流体烧制](#6-完整示例流体烧制)
7. [完整示例：交易配方](#7-完整示例交易配方)

---

## 1. 配方系统概述

### 1.1 Fabric 配方 API

Fabric 提供了配方 API 扩展（`fabric-recipe-api-v1`），允许模组开发者：

- 创建自定义配方类型
- 使用自定义成分（Custom Ingredient）
- 通过数据生成器自动生成配方

### 1.2 依赖

```groovy
dependencies {
    // Fabric API（已包含配方 API）
    modImplementation "net.fabricmc:fabric-api:${fabric_version}"
}
```

---

## 2. 基础配方类型

### 2.1 有序合成配方（Shaped Recipe）

有序合成需要按特定图案放置材料。

```java
// 注册有序合成配方
ShapedRecipe recipe = new ShapedRecipe(
    Identifier.of("mymod", "diamond_sword"),  // 配方 ID
    "mymod",                                  // 组名（可选）
    3,                                        // 宽度（3格）
    3,                                        // 高度（3格）
    new Ingredient[]{                         // 材料（按行展开）
        Ingredient.ofItems(Items.DIAMOND),    // 第一行
        Ingredient.ofItems(Items.DIAMOND),    // |
        Ingredient.ofItems(Items.STICK)       // |
    },
    new ItemStack(Items.DIAMOND_SWORD)        // 输出
);

Registry.register(Registries.RECIPE, Identifier.of("mymod", "diamond_sword"), recipe);
```

### 2.2 无序合成配方（Shapeless Recipe）

无序合成只需将材料放入工作台，顺序无关。

```java
// 注册无序合成配方
ShapelessRecipe recipe = new ShapelessRecipe(
    Identifier.of("mymod", "saddle"),         // 配方 ID
    "mymod",                                  // 组名
    new ItemStack(Items.SADDLE),              // 输出
    List.of(                                  // 材料列表
        Ingredient.ofItems(Items.LEATHER),
        Ingredient.ofItems(Items.LEATHER),
        Ingredient.ofItems(Items.IRON_INGOT)
    )
);

Registry.register(Registries.RECIPE, Identifier.of("mymod", "saddle"), recipe);
```

### 2.3 烧制配方（Smelting Recipe）

```java
// 注册烧制配方
SmeltingRecipe recipe = new SmeltingRecipe(
    Identifier.of("mymod", "gold_ingot"),     // 经验值（0-1）
    new RecipeMatch[]{                        // 输入匹配
        new RecipeEntry(Items.RAW_GOLD, 1)    // 物品和数量
    },
    new ItemStack(Items.GOLD_INGOT),          // 输出
    200                                        // 烧制时间（刻）
);

Registry.register(Registries.RECIPE, Identifier.of("mymod", "gold_ingot"), recipe);
```

### 2.4 强化木砧配方（Smithing Recipe）

```java
// 注册强化配方
SmithingRecipe recipe = new SmithingRecipe(
    Identifier.of("mymod", "diamond_sword_smithing"),
    new RecipeMatch[]{                        // 模板
        new RecipeEntry(Items.DIAMOND_SWORD, 1)
    },
    new RecipeMatch[]{                        // 输入
        new RecipeEntry(Items.GOLD_INGOT, 1)
    },
    new ItemStack(Items.GOLD_SWORD),          // 输出
    RecipePattern.create(
        "ABA",                                 // 模式
        new Symbol('A', Items.DIAMOND_SWORD),  // 符号映射
        new Symbol('B', Items.GOLD_INGOT)
    )
);

Registry.register(Registries.RECIPE, Identifier.of("mymod", "diamond_sword_smithing"), recipe);
```

---

## 3. 自定义配方成分

### 3.1 什么是自定义成分？

自定义成分（Custom Ingredient）允许你创建更复杂的材料匹配逻辑。

```java
public interface CustomIngredient {
    // 测试物品堆是否匹配
    boolean test(ItemStack stack);
    
    // 获取匹配的物品堆列表（用于显示）
    List<ItemStack> getMatchingStacks();
    
    // 是否需要直接测试（NBT 检查）
    boolean requiresTesting();
    
    // 获取序列化器
    CustomIngredientSerializer<?> getSerializer();
}
```

### 3.2 内置自定义成分类型

| 类型 | 标识符 | 说明 |
|-----|--------|------|
| All | `fabric:all` | 所有子成分都必须匹配 |
| Any | `fabric:any` | 任一子成分匹配即可 |
| Difference | `fabric:difference` | 基础减去排除部分 |
| CustomData | `fabric:custom_data` | 带有自定义 NBT 的物品 |
| Components | `fabric:components` | 带有特定组件的物品 |

### 3.3 在 JSON 中使用自定义成分

```json
// fabric:all - 所有条件都满足
{
    "type": "minecraft:crafting_shaped",
    "pattern": [
        "AAA",
        "ABA",
        "AAA"
    ],
    "key": {
        "A": {
            "fabric:type": "fabric:any",
            "ingredients": [
                {"item": "minecraft:iron_ingot"},
                {"item": "minecraft:gold_ingot"}
            ]
        },
        "B": {"item": "minecraft:diamond"}
    },
    "result": {"item": "mymod:reinforced_helmet"}
}
```

```json
// fabric:difference - 排除特定物品
{
    "type": "minecraft:crafting_shapeless",
    "ingredients": [
        {
            "fabric:type": "fabric:difference",
            "base": {"tag": "minecraft:wool"},
            "exclude": [
                {"item": "minecraft:white_wool"}
            ]
        }
    ],
    "result": {"item": "mymod:colored_wool"}
}
```

```json
// fabric:components - 特定组件匹配
{
    "type": "minecraft:crafting_shapeless",
    "ingredients": [
        {
            "fabric:type": "fabric:components",
            "components": {
                "minecraft:food": {"nutrition": 4}
            }
        }
    ],
    "result": {"item": "mymod:suspicious_stew"}
}
```

---

## 4. 数据生成器配方

### 4.1 数据生成器概述

数据生成器（Data Generator）是 Fabric 提供的自动化资源生成工具，可以在构建时自动生成配方文件。

### 4.2 创建配方生成器

```java
package net.example.mymod.datagen;

import net.example.mymod.init.ModItems;
import net.fabricmc.fabric.api.datagen.v1.FabricDataGenerator;
import net.fabricmc.fabric.api.datagen.v1.FabricDataOutput;
import net.fabricmc.fabric.api.datagen.v1.provider.FabricRecipeProvider;
import net.minecraft.data.server.recipe.RecipeExporter;
import net.minecraft.data.server.recipe.ShapedRecipeJsonBuilder;
import net.minecraft.data.server.recipe.ShapelessRecipeJsonBuilder;
import net.minecraft.item.Item;
import net.minecraft.item.Items;
import net.minecraft.recipe.RecipeCategory;

public class ModRecipeProvider extends FabricRecipeProvider {
    
    public ModRecipeProvider(FabricDataOutput output) {
        super(output);
    }
    
    @Override
    public void generate(RecipeExporter exporter) {
        // 在这里生成配方
        generateShapedRecipes(exporter);
        generateShapelessRecipes(exporter);
    }
    
    private void generateShapedRecipes(RecipeExporter exporter) {
        // 有序合成配方
        ShapedRecipeJsonBuilder.create(RecipeCategory.COMBAT, ModItems.MY_SWORD)
            .pattern("X")
            .pattern("X")
            .pattern("S")
            .input('X', Items.DIAMOND)
            .input('S', Items.STICK)
            .criterion("has_diamond", conditionsFromItem(Items.DIAMOND))
            .offerTo(exporter);
        
        // 多个有序配方
        ShapedRecipeJsonBuilder.create(RecipeCategory.TOOLS, ModItems.MY_PICKAXE)
            .pattern("XXX")
            .pattern(" S ")
            .pattern(" S ")
            .input('X', Items.DIAMOND)
            .input('S', Items.STICK)
            .criterion("has_diamond", conditionsFromItem(Items.DIAMOND))
            .offerTo(exporter, Identifier.of("mymod", "diamond_pickaxe"));
    }
    
    private void generateShapelessRecipes(RecipeExporter exporter) {
        // 无序合成配方
        ShapelessRecipeJsonBuilder.create(RecipeCategory.MISC, ModItems.MY_ITEM)
            .input(Items.DIAMOND)
            .input(Items.GLOWSTONE_DUST)
            .criterion("has_glowstone", conditionsFromItem(Items.GLOWSTONE_DUST))
            .offerTo(exporter);
    }
}
```

### 4.2 注册数据生成器入口

```java
package net.example.mymod.datagen;

import net.fabricmc.fabric.api.datagen.v1.DataGeneratorEntrypoint;
import net.fabricmc.fabric.api.datagen.v1.FabricDataGenerator;

public class MyModDataGenerator implements DataGeneratorEntrypoint {
    
    @Override
    public void onInitializeDataGenerator(FabricDataGenerator generator) {
        FabricDataGenerator.Pack pack = generator.createPack();
        
        // 添加配方生成器
        pack.addProvider(ModRecipeProvider::new);
        
        // 可以添加其他生成器
        // pack.addProvider(ModTagProvider::new);
        // pack.addProvider(ModLootTableProvider::new);
    }
}
```

### 4.3 在 fabric.mod.json 中声明

```json
{
    "entrypoints": {
        "main": [
            "net.example.mymod.Mymod",
            "net.example.mymod.datagen.MyModDataGenerator"
        ],
        "client": [
            "net.example.mymod.client.MyModClient"
        ]
    }
}
```

---

## 5. 完整示例：工具合成

### 5.1 定义物品

```java
package net.example.mymod.item;

import net.minecraft.item.Item;
import net.minecraft.item.ToolMaterials;
import net.minecraft.recipe.RecipeType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public class ModItems {
    
    // 自定义剑
    public static final Item CRYSTAL_SWORD = new SwordItem(
        ToolMaterials.DIAMOND,
        3,                                          // 伤害
        -2.4f,                                      // 攻击速度
        new Item.Settings()
    );
    
    // 自定义镐子
    public static final Item CRYSTAL_PICKAXE = new PickaxeItem(
        ToolMaterials.DIAMOND,
        1,
        -2.8f,
        new Item.Settings()
    );
    
    // 自定义斧头
    public static final Item CRYSTAL_AXE = new AxeItem(
        ToolMaterials.DIAMOND,
        5,
        -3.0f,
        new Item.Settings()
    );
    
    // 合成材料：水晶碎片
    public static final Item CRYSTAL_SHARD = new Item(
        new Item.Settings()
    );
    
    public static void register() {
        Registry.register(Registries.ITEM, Identifier.of("mymod", "crystal_sword"), CRYSTAL_SWORD);
        Registry.register(Registries.ITEM, Identifier.of("mymod", "crystal_pickaxe"), CRYSTAL_PICKAXE);
        Registry.register(Registries.ITEM, Identifier.of("mymod", "crystal_axe"), CRYSTAL_AXE);
        Registry.register(Registries.ITEM, Identifier.of("mymod", "crystal_shard"), CRYSTAL_SHARD);
    }
}
```

### 5.2 数据生成器配方

```java
package net.example.mymod.datagen;

import net.example.mymod.init.ModItems;
import net.fabricmc.fabric.api.datagen.v1.FabricDataOutput;
import net.fabricmc.fabric.api.datagen.v1.provider.FabricRecipeProvider;
import net.minecraft.data.server.recipe.RecipeExporter;
import net.minecraft.data.server.recipe.ShapedRecipeJsonBuilder;
import net.minecraft.data.server.recipe.ShapelessRecipeJsonBuilder;
import net.minecraft.item.Item;
import net.minecraft.item.Items;
import net.minecraft.recipe.RecipeCategory;

public class ToolRecipeProvider extends FabricRecipeProvider {
    
    public ToolRecipeProvider(FabricDataOutput output) {
        super(output);
    }
    
    @Override
    public void generate(RecipeExporter exporter) {
        // 水晶剑
        ShapedRecipeJsonBuilder.create(RecipeCategory.COMBAT, ModItems.CRYSTAL_SWORD)
            .pattern("C")
            .pattern("C")
            .pattern("S")
            .input('C', ModItems.CRYSTAL_SHARD)
            .input('S', Items.STICK)
            .criterion("has_crystal_shard", conditionsFromItem(ModItems.CRYSTAL_SHARD))
            .offerTo(exporter);
        
        // 水晶镐
        ShapedRecipeJsonBuilder.create(RecipeCategory.TOOLS, ModItems.CRYSTAL_PICKAXE)
            .pattern("CCC")
            .pattern(" S ")
            .pattern(" S ")
            .input('C', ModItems.CRYSTAL_SHARD)
            .input('S', Items.STICK)
            .criterion("has_crystal_shard", conditionsFromItem(ModItems.CRYSTAL_SHARD))
            .offerTo(exporter);
        
        // 水晶斧
        ShapedRecipeJsonBuilder.create(RecipeCategory.TOOLS, ModItems.CRYSTAL_AXE)
            .pattern("CC")
            .pattern("CS")
            .pattern(" S")
            .input('C', ModItems.CRYSTAL_SHARD)
            .input('S', Items.STICK)
            .criterion("has_crystal_shard", conditionsFromItem(ModItems.CRYSTAL_SHARD))
            .offerTo(exporter);
        
        // 合成水晶碎片（无序）
        ShapelessRecipeJsonBuilder.create(RecipeCategory.MISC, ModItems.CRYSTAL_SHARD, 4)
            .input(Items.DIAMOND)
            .input(Items.GLOWSTONE_DUST)
            .criterion("has_glowstone", conditionsFromItem(Items.GLOWSTONE_DUST))
            .offerTo(exporter);
    }
}
```

---

## 6. 完整示例：流体烧制

### 6.1 流体烧制配方

流体烧制允许使用流体作为燃料进行烧制。

```java
package net.example.mymod.recipe;

import net.minecraft.fluid.Fluids;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.recipe.RecipeType;
import net.minecraft.util.Identifier;
import net.minecraft.util.collection.DefaultedList;

public class FluidSmeltingRecipe implements Recipe<AbstractCookingRecipe> {
    
    private final Identifier id;
    private final String group;
    private final Ingredient ingredient;
    private final ItemStack result;
    private final float experience;
    private final int cookTime;
    
    public FluidSmeltingRecipe(Identifier id, String group, Ingredient ingredient, 
                               ItemStack result, float experience, int cookTime) {
        this.id = id;
        this.group = group;
        this.ingredient = ingredient;
        this.result = result;
        this.experience = experience;
        this.cookTime = cookTime;
    }
    
    @Override
    public Identifier getId() {
        return id;
    }
    
    @Override
    public RecipeType<?> getType() {
        return RecipeType.BLASTING;  // 使用现有的配方类型
    }
    
    @Override
    public String getGroup() {
        return group;
    }
    
    @Override
    public Ingredient getIngredients() {
        return ingredient;
    }
    
    @Override
    public ItemStack getOutput() {
        return result;
    }
    
    public float getExperience() {
        return experience;
    }
    
    public int getCookTime() {
        return cookTime;
    }
}
```

### 6.2 注册烧制配方

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.recipe.FluidSmeltingRecipe;
import net.minecraft.recipe.RecipeSerializer;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModRecipes {
    
    // 自定义序列化器
    public static final RecipeSerializer<FluidSmeltingRecipe> FLUID_SMELTING =
        new RecipeSerializer<>() {
            @Override
            public FluidSmeltingRecipe read(Identifier id, PacketByteBuf buf) {
                String group = buf.readString();
                Ingredient ingredient = Ingredient.fromPacket(buf);
                ItemStack result = buf.readItemStack();
                float experience = buf.readFloat();
                int cookTime = buf.readInt();
                
                return new FluidSmeltingRecipe(id, group, ingredient, result, experience, cookTime);
            }
            
            @Override
            public void write(PacketByteBuf buf, FluidSmeltingRecipe recipe) {
                buf.writeString(recipe.getGroup());
                recipe.getIngredients().write(buf);
                buf.writeItemStack(recipe.getOutput());
                buf.writeFloat(recipe.getExperience());
                buf.writeInt(recipe.getCookTime());
            }
            
            @Override
            public RecipeCodec getCodec() {
                return null;
            }
        };
    
    public static void register() {
        Registry.register(
            Registry.RECIPE_SERIALIZER,
            Identifier.of(Mymod.MOD_ID, "fluid_smelting"),
            FLUID_SMELTING
        );
    }
}
```

### 6.3 数据生成器生成烧制配方

```java
@Override
public void generate(RecipeExporter exporter) {
    // 烧制配方
    offerSmelting(exporter, List.of(Items.RAW_IRON), RecipeCategory.MISC, 
        Items.IRON_INGOT, 0.7f, 200, "iron_ingot");
    
    offerBlasting(exporter, List.of(Items.RAW_IRON), RecipeCategory.MISC, 
        Items.IRON_INGOT, 0.7f, 100, "iron_ingot");
}
```

---

## 7. 完整示例：交易配方

### 7.1 村民交易

Fabric 提供了交易扩展 API。

```java
package net.example.mymod.trade;

import net.fabricmc.fabric.api.object.builder.v1.trade.TradeOfferHelper;
import net.minecraft.village.TradeOffers;
import net.minecraft.village.VillagerProfession;

public class ModTrades {
    
    public static void registerTrades() {
        // 农民交易
        TradeOfferHelper.registerVillagerOffers(
            VillagerProfession.FARMER, 
            1,  // 等级
            factories -> {
                factories.add(new SellItemsFactory(
                    Items.EMERALD,           // 卖出
                    1,                       // 数量
                    16,                      // 最大数量
                    5,                       // 价格乘数
                    2                        // 经验值
                ));
            }
        );
        
        // 武器匠交易
        TradeOfferHelper.registerVillagerOffers(
            VillagerProfession.WEAPONSMITH,
            2,
            factories -> {
                factories.add(new EnchantItemFactory(
                    Items.DIAMOND_SWORD,     // 物品
                    5,                       // 经验等级
                    10,                      // 价格乘数
                    12,                      // 最大价格
                    2                        // 交易次数
                ));
            }
        );
    }
}
```

### 7.2 自定义交易工厂

```java
import net.minecraft.entity.Entity;
import net.minecraft.item.ItemStack;
import net.minecraft.village.TradeOffer;
import net.minecraft.village.TradeOffers;
import net.minecraft.world.World;

public class CustomTradeFactory implements TradeOffers.Factory {
    
    private final ItemStack sellItem;
    private final int sellCount;
    private final int maxUses;
    private final int experience;
    private final float priceMultiplier;
    
    public CustomTradeFactory(ItemStack sellItem, int sellCount, int maxUses, 
                              int experience, float priceMultiplier) {
        this.sellItem = sellItem;
        this.sellCount = sellCount;
        this.maxUses = maxUses;
        this.experience = experience;
        this.priceMultiplier = priceMultiplier;
    }
    
    @Override
    public TradeOffer create(Entity entity, World world) {
        // 创建第一个交易：用绿宝石购买物品
        ItemStack buying = new ItemStack(Items.EMERALD, 1);
        ItemStack selling = sellItem.copy();
        selling.setCount(sellCount);
        
        return new TradeOffer(
            buying,               // 输入
            ItemStack.EMPTY,     // 额外输入
            selling,             // 输出
            maxUses,             // 最大使用次数
            experience,          // 经验值
            priceMultiplier      // 价格乘数
        );
    }
}

// 使用示例
TradeOfferHelper.registerVillagerOffers(
    VillagerProfession.LIBRARIAN,
    1,
    factories -> {
        factories.add(new CustomTradeFactory(
            new ItemStack(Items.BOOK),
            2,      // 卖2本书
            12,     // 最多交易12次
            2,      // 给2点经验
            0.05f   // 价格乘数
        ));
    }
);
```

### 7.3 数据生成器交易

```java
// 批量生成交易
private void generateTrades(TradeOfferDataGenerator exporter) {
    // 生成农民交易
    exporter.register(
        VillagerProfession.FARMER,
        1,
        new SimpleTradeOfferData(
            new ItemStack(Items.WHEAT, 12),
            new ItemStack(Items.EMERALD),
            2, 16, 2, 0.05
        )
    );
    
    // 生成 librarian 交易 - 卖书
    exporter.register(
        VillagerProfession.LIBRARIAN,
        1,
        new SimpleTradeOfferData(
            new ItemStack(Items.EMERALD, 2),
            new ItemStack(Items.BOOK),
            1, 12, 1, 0.05
        )
    );
}
```

---

## 下一步

现在你学会了配方系统！接下来可以学习：

- [战利品表](./04-loot-tables.md) - 修改战利品掉落

---

*参考：[物品与配方系统分析](../../analysis/03-item-recipe-system.md)*