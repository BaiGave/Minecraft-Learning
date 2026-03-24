# Fabric API 其他子系统分析

## 概述

本文档分析 Fabric API 中的其他重要子系统模块。

---

## 1. fabric-data-attachment-api-v1 (数据附件)

### 核心功能

允许向游戏对象（实体、方块实体、世界和区块）附加任意数据。

### 核心API

```java
// 定义持久化附件类型
public static final AttachmentType<CompoundTag> PLAYER_DATA =
    AttachmentRegistry.createPersistent(
        Identifier.of("mymod", "player_data"),
        CompoundTag.CODEC
    );

// 定义带初始值的附件
public static final AttachmentType<Integer> ENTITY_KILLS =
    AttachmentRegistry.createDefaulted(
        Identifier.of("mymod", "entity_kills"),
        () -> 0
    );
```

### 使用

```java
// 获取附件
int kills = player.getAttachedOrCreate(ENTITY_KILLS);

// 修改附件
player.setAttached(ENTITY_KILLS, kills + 1);

// 原子修改
player.modifyAttached(ENTITY_KILLS, old -> old + 1);
```

---

## 2. fabric-data-generation-api-v1 (数据生成)

### 核心功能

在构建时自动生成游戏资源文件（标签、配方、战利品表、模型等）。

### 数据生成入口

```java
public class MyDataGenerator implements DataGeneratorEntrypoint {
    @Override
    public void onInitializeDataGenerator(FabricDataGenerator generator) {
        FabricDataGenerator.Pack pack = generator.createPack();

        pack.addProvider(new MyTagProvider());
        pack.addProvider(new MyRecipeProvider());
        pack.addProvider(new MyLootTableProvider());
    }
}
```

### 标签生成器

```java
public class MyTagProvider extends FabricTagProvider<Block> {
    @Override
    protected void configure(RegistryWrapper.WrapperLookup registries) {
        getOrCreateTagBuilder(BlockTags.DIAMOND_ORES)
            .add(MY_MOD_DIAMOND_ORE)
            .forceAddTag(BlockTags.IRON_ORE);
    }
}
```

### 配方生成器

```java
public class MyRecipeProvider extends FabricRecipeProvider {
    @Override
    public void generate(RecipeExporter exporter) {
        ShapedRecipeJsonBuilder.create(RecipeCategory.MISC, MY_ITEM)
            .pattern("ABA")
            .input('A', Items.DIAMOND)
            .input('B', Items.STICK)
            .criterion("has_diamond", Conditions.fromItem(Items.DIAMOND))
            .offerTo(exporter);
    }
}
```

---

## 3. fabric-registry-sync-v0 (注册表同步)

### 核心功能

在服务端和客户端之间同步模组添加的注册表条目。

### 使用

```java
public class MyMod implements ModInitializer {
    @Override
    public void onInitialize() {
        // 获取注册表属性持有者
        RegistryAttributeHolder holder =
            RegistryAttributeHolder.get(RegistryKeys.BLOCK);

        // 标记为需要同步
        holder.addAttribute(RegistryAttribute.SYNCED);
        holder.addAttribute(RegistryAttribute.MODDED);
    }
}
```

---

## 4. fabric-gametest-api-v1 (游戏测试)

### 核心功能

封装 Minecraft 的 GameTest 框架，用于自动化测试。

### 使用

```java
@GameTest(title = "my_mod.test.title", templateId = FabricGameTest.EMPTY_STRUCTURE)
public class MyModTest implements FabricGameTest {
    @Test
    public void testMyFeature(TestContext context) {
        context.placeBlock(Blocks.DIAMOND_BLOCK, new BlockPos(0, 1, 0));
        context.complete();
    }
}
```

---

## 5. fabric-loot-api-v3 (战利品表)

### 核心功能

在运行时修改游戏战利品表。

### 使用

```java
LootTableEvents.MODIFY.register((key, tableBuilder, source, registries) -> {
    if (Blocks.COBBLESTONE.getLootTableKey() == key && source.isBuiltin()) {
        LootPool.Builder pool = LootPool.builder()
            .with(ItemEntry.builder(Items.DIAMOND))
            .conditionally(SurvivesExplosionLootCondition.builder());

        tableBuilder.pool(pool);
    }
});
```

---

## 6. fabric-sound-api-v1 (声音API)

### 核心功能

允许模组提供自定义音频流。

### 使用

```java
public class CustomSound extends AbstractSoundInstance implements FabricSoundInstance {
    @Override
    public CompletableFuture<AudioStream> getAudioStream(
            SoundLoader loader, Identifier id, boolean repeatInstantly) {
        return CompletableFuture.completedFuture(new CustomAudioStream());
    }
}

// 播放
client.player.playSound(new CustomSound());
```

---

## 7. fabric-object-builder-api-v1 (对象构建器)

### 核心功能

提供便捷的构建器模式，用于创建实体类型、村民职业、交易报价等。

### 实体类型构建

```java
public static final EntityType<MyEntity> MY_ENTITY =
    EntityType.Builder.createLiving(
        MyEntity::new, SpawnGroup.CREATURE,
        living -> living.defaultAttributes(LivingEntity::createLivingAttributes)
    )
    .dimensions(0.6f, 1.8f)
    .spawnRestriction(SpawnLocation.ON_GROUND, Heightmap.Type.MOTION_BLOCKING,
        (entityType, world, spawnReason, pos, random) -> {
            return world.getBlockState(pos.below()).isIn(BlockTags.DIRT);
        })
    .build(null, "my_entity");
```

### 村民交易注册

```java
TradeOfferHelper.registerVillagerOffers(VillagerProfession.FARMER, 2, factories -> {
    factories.add(new MyTradeFactory());
});
```

---

## 8. fabric-api-lookup-api-v1 (查找API)

### 核心功能

跨模组通信机制，允许通过统一的查找系统查询其他模组提供的 API。

### 定义API

```java
public interface FluidContainer {
    boolean containsFluids();
    int getFluidAmount();
}

public final class MyApi {
    public static final BlockApiLookup<FluidContainer, Direction> FLUID_CONTAINER =
        BlockApiLookup.get(Identifier.of("mymod", "fluid_container"),
                          FluidContainer.class, Direction.class);
}
```

### 注册和使用

```java
// 注册提供者
MyApi.FLUID_CONTAINER.registerSelf(TANK_BLOCK_ENTITY_TYPE);

// 查询
FluidContainer container = MyApi.FLUID_CONTAINER.find(world, pos, Direction.UP);
if (container != null && container.containsFluids()) {
    // 处理
}
```

---

## 9. fabric-transitive-access-wideners-v1 (访问扩展器)

### 核心功能

通过 Access Widener 文件声明对原版类私有成员的访问权限。

### 使用方式

在 `fabric.mod.json` 中声明：

```json
{
  "accessWidener": "assets/my-mod/my-mod.accessWidener"
}
```

### Access Widener 语法

```
accessible class net/minecraft/block/Block net/fabricmc/example Block Lnet/minecraft/block/BlockState;
extended class net/minecraft/village/VillagerProfession net/fabricmc/example VillagerProfession (...)
immutable class net/minecraft/block/Block net/fabricmc/example FabricBlock
```

---

## 模块总结

| 模块 | 主要功能 |
|------|----------|
| `data-attachment` | 数据附加到游戏对象 |
| `data-generation` | 自动化资源生成 |
| `registry-sync` | 注册表同步 |
| `gametest` | 自动化测试 |
| `loot` | 战利品表修改 |
| `sound` | 自定义音频流 |
| `object-builder` | 实体/交易构建器 |
| `api-lookup` | 跨模组API查找 |
| `transitive-access-wideners` | 私有成员访问 |

---

*源码位置: `fabric-data-attachment-api-v1/`, `fabric-data-generation-api-v1/`, `fabric-registry-sync-v0/`, `fabric-gametest-api-v1/`, `fabric-loot-api-v3/`, `fabric-sound-api-v1/`, `fabric-object-builder-api-v1/`, `fabric-api-lookup-api-v1/`, `fabric-transitive-access-wideners-v1/`*
