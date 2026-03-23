# 第二章：魔法水晶 - 完整实战

> 在这一章中，我们将从零开始创建一个完整的魔法水晶系统，包括发光方块、可收集的物品、方块实体存储和粒子效果。

---

## 目录

1. [项目初始化](#1-项目初始化)
2. [创建魔法水晶方块](#2-创建魔法水晶方块)
3. [创建魔法水晶物品](#3-创建魔法水晶物品)
4. [添加方块实体](#4-添加方块实体)
5. [实现交互逻辑](#5-实现交互逻辑)
6. [添加粒子效果](#6-添加粒子效果)
7. [注册和资源文件](#7-注册和资源文件)
8. [测试运行](#8-测试运行)

---

## 1. 项目初始化

### 1.1 创建项目结构

首先，在你的 IDE 中创建以下目录结构：

```
src/main/java/net/example/mymod/
├── Mymod.java
├── init/
│   ├── ModBlocks.java
│   └── ModItems.java
├── block/
│   └── MagicCrystalBlock.java
├── block/entity/
│   └── MagicCrystalBlockEntity.java
└── item/
    └── MagicCrystalItem.java

src/main/resources/
└── assets/mymod/
    ├── textures/
    │   └── block/
    │       └── magic_crystal.png
    ├── models/
    │   └── block/
    │       └── magic_crystal.json
    └── lang/
        └── zh_cn.json
```

### 1.2 创建基本 Mod 入口

首先确保你的 `Mymod.java` 已经创建好注册方法：

```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.init.ModBlocks;
import net.example.mymod.init.ModItems;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始加载魔法水晶 Mod...");
        
        // 注册方块和物品
        ModBlocks.register();
        ModItems.register();
        
        LOGGER.info("魔法水晶 Mod 加载完成！");
    }
}
```

---

## 2. 创建魔法水晶方块

### 2.1 定义方块类

创建 `src/main/java/net/example/mymod/block/MagicCrystalBlock.java`：

```java
package net.example.mymod.block;

import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.BlockWithEntity;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;
import net.example.mymod.block.entity.MagicCrystalBlockEntity;

/**
 * 魔法水晶方块
 * 特性：
 * - 发光效果
 * - 存储水晶数量
 * - 可被收集
 */
public class MagicCrystalBlock extends BlockWithEntity {
    
    public MagicCrystalBlock(Settings settings) {
        super(settings);
    }
    
    // 返回方块实体类型
    @Override
    public BlockEntity createBlockEntity(BlockPos pos, BlockState state) {
        return new MagicCrystalBlockEntity(pos, state);
    }
    
    // 不需要手动设置渲染类型，Minecraft 1.20+ 默认使用 BlockEntityRender
    // 如果需要特殊渲染，可以重写 getRenderType()
}
```

### 2.2 方块属性设置

在 `ModBlocks.java` 中注册方块：

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.block.MagicCrystalBlock;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModBlocks {
    
    // 魔法水晶方块
    public static final Block MAGIC_CRYSTAL = new MagicCrystalBlock(
        Block.Settings.create()
            .strength(0.5f)        // 硬度较低，容易挖掘
            .resistance(1.0f)     // 抗爆性
            .luminance(state -> 8) // 发光等级 8（类似萤石）
            .nonOpaque()           // 半透明
    );
    
    public static void register() {
        registerBlock("magic_crystal", MAGIC_CRYSTAL);
    }
    
    private static void registerBlock(String name, Block block) {
        Registry.register(
            Registries.BLOCK,
            Identifier.of(Mymod.MOD_ID, name),
            block
        );
        
        // 注册对应的物品形式（让玩家可以在物品栏中看到）
        Registry.register(
            Registries.ITEM,
            Identifier.of(Mymod.MOD_ID, name),
            new net.minecraft.item.BlockItem(block, 
                new net.minecraft.item.Item.Settings())
        );
    }
}
```

---

## 3. 创建魔法水晶物品

### 3.1 创建物品类

创建 `src/main/java/net/example/mymod/item/MagicCrystalItem.java`：

```java
package net.example.mymod.item;

import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.text.Text;

import java.util.List;

/**
 * 魔法水晶物品
 * 用于收集和合成
 */
public class MagicCrystalItem extends Item {
    
    public MagicCrystalItem() {
        super(new Item.Settings()
            .maxCount(64)           // 堆叠上限 64
        );
    }
    
    // 可选：添加自定义工具提示
    @Override
    public void appendTooltip(ItemStack stack, TooltipContext context, 
                              List<Text> tooltip, TooltipType type) {
        super.appendTooltip(stack, context, tooltip, type);
        tooltip.add(Text.literal("§d蕴含魔法的水晶"));
        tooltip.add(Text.literal("§7可用于合成或驯服魔法生物"));
    }
}
```

### 3.2 注册物品

在 `ModItems.java` 中注册：

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.item.MagicCrystalItem;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModItems {
    
    // 魔法水晶物品
    public static final Item MAGIC_CRYSTAL = new MagicCrystalItem();
    
    public static void register() {
        registerItem("magic_crystal", MAGIC_CRYSTAL);
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

---

## 4. 添加方块实体

### 4.1 什么是方块实体？

方块实体（Block Entity）是一种特殊的存储机制，允许方块存储额外的数据。在我们的魔法水晶中，我们需要存储：
- 当前水晶数量
- 最大水晶容量

### 4.2 创建方块实体类

创建 `src/main/java/net/example/mymod/block/entity/MagicCrystalBlockEntity.java`：

```java
package net.example.mymod.block.entity;

import net.minecraft.block.BlockState;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.block.entity.BlockEntityType;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

/**
 * 魔法水晶方块实体
 * 用于存储水晶数量
 */
public class MagicCrystalBlockEntity extends BlockEntity {
    
    // 水晶数量
    private int crystalCount = 9;
    // 最大水晶数量
    private static final int MAX_CRYSTALS = 9;
    
    public MagicCrystalBlockEntity(BlockPos pos, BlockState state) {
        super(BlockEntityType.BEACON, pos, state);  // 使用基类构造
    }
    
    // 从 NBT 读取数据
    @Override
    public void readNbt(NbtCompound nbt) {
        super.readNbt(nbt);
        this.crystalCount = nbt.getInt("crystalCount");
    }
    
    // 写入 NBT 数据
    @Override
    protected void writeNbt(NbtCompound nbt) {
        super.writeNbt(nbt);
        nbt.putInt("crystalCount", this.crystalCount);
    }
    
    // 获取水晶数量
    public int getCrystalCount() {
        return crystalCount;
    }
    
    // 设置水晶数量
    public void setCrystalCount(int count) {
        this.crystalCount = Math.max(0, Math.min(count, MAX_CRYSTALS));
        
        // 同步到客户端
        markDirty();
        if (world != null) {
            world.updateListeners(pos, getCachedState(), getCachedState(), 3);
        }
    }
    
    // 收集一个水晶
    public boolean collectCrystal() {
        if (crystalCount > 0) {
            setCrystalCount(crystalCount - 1);
            return true;
        }
        return false;
    }
    
    // 检查方块是否为空
    public boolean isEmpty() {
        return crystalCount <= 0;
    }
    
    // 静态方法：注册方块实体类型
    public static BlockEntityType<MagicCrystalBlockEntity> TYPE;
}
```

### 4.2.1 注册方块实体

创建一个新的注册类来注册方块实体：

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.block.entity.MagicCrystalBlockEntity;
import net.minecraft.block.entity.BlockEntityType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public class ModBlockEntities {
    
    public static BlockEntityType<MagicCrystalBlockEntity> MAGIC_CRYSTAL;
    
    public static void register() {
        // 在注册方块实体之前，先注册方块实体类型
        MAGIC_CRYSTAL = Registry.register(
            Registries.BLOCK_ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "magic_crystal"),
            BlockEntityType.Builder.create(
                MagicCrystalBlockEntity::new,
                net.example.mymod.init.ModBlocks.MAGIC_CRYSTAL
            ).build()
        );
    }
}
```

更新 `MagicCrystalBlock.java` 中的方块实体类型引用：

```java
// 更新 createBlockEntity 方法
@Override
public BlockEntity createBlockEntity(BlockPos pos, BlockState state) {
    return new MagicCrystalBlockEntity(pos, state);
}

// 还需要更新 BlockEntityType 引用
// 在构造时传入，或者让方块实体自己处理
```

---

## 5. 实现交互逻辑

### 5.1 更新方块类添加交互

更新 `MagicCrystalBlock.java` 添加玩家交互逻辑：

```java
package net.example.mymod.block;

import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.BlockWithEntity;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.hit.BlockHitResult;
import world.minecraft.util.math.BlockPos;
import net.minecraft.world.World;
import net.example.mymod.block.entity.MagicCrystalBlockEntity;
import net.example.mymod.init.ModItems;

/**
 * 魔法水晶方块
 * 特性：
 * - 发光效果
 * - 存储水晶数量
 * - 右键收集水晶
 */
public class MagicCrystalBlock extends BlockWithEntity {
    
    public MagicCrystalBlock(Settings settings) {
        super(settings);
    }
    
    // 返回方块实体类型
    @Override
    public BlockEntity createBlockEntity(BlockPos pos, BlockState state) {
        return new MagicCrystalBlockEntity(pos, state);
    }
    
    // 处理右键交互
    @Override
    public ActionResult onUse(BlockState state, World world, 
                               BlockPos pos, PlayerEntity player, 
                               Hand hand, BlockHitResult hit) {
        // 只在服务端处理
        if (world.isClient()) {
            return ActionResult.SUCCESS;
        }
        
        // 获取方块实体
        BlockEntity blockEntity = world.getBlockEntity(pos);
        if (!(blockEntity instanceof MagicCrystalBlockEntity crystalBlock)) {
            return ActionResult.SUCCESS;
        }
        
        // 检查方块是否还有水晶
        if (crystalBlock.isEmpty()) {
            // 播放空音效
            world.playSound(null, pos, SoundEvents.BLOCK_GLASS_BREAK, 
                          SoundCategory.BLOCKS, 1.0f, 0.5f);
            
            // 破坏方块（可选：自动消失）
            world.breakBlock(pos, false);
            return ActionResult.SUCCESS;
        }
        
        // 收集水晶
        if (crystalBlock.collectCrystal()) {
            // 给予玩家魔法水晶物品
            ItemStack crystalStack = new ItemStack(ModItems.MAGIC_CRYSTAL);
            player.getInventory().offerOrDrop(crystalStack);
            
            // 播放收集音效
            world.playSound(null, pos, SoundEvents.ENTITY_EXPERIENCE_ORB_PICKUP, 
                          SoundCategory.BLOCKS, 0.8f, 1.2f);
            
            // 再次检查，如果已空则破坏方块
            if (crystalBlock.isEmpty()) {
                world.breakBlock(pos, false);
            }
            
            return ActionResult.SUCCESS;
        }
        
        return ActionResult.SUCCESS;
    }
    
    // 可选：方块被破坏时的处理
    @Override
    public void onStateReplaced(BlockState state, World world, 
                                 BlockPos pos, BlockState newState, boolean moved) {
        if (world.isClient()) {
            super.onStateReplaced(state, world, pos, newState, moved);
            return;
        }
        
        // 如果方块被破坏且不是被替换
        if (!state.isOf(newState.getBlock())) {
            BlockEntity blockEntity = world.getBlockEntity(pos);
            if (blockEntity instanceof MagicCrystalBlockEntity crystalBlock) {
                // 掉落剩余水晶
                int remaining = crystalBlock.getCrystalCount();
                if (remaining > 0) {
                    // 使用 Block.dropStack 掉落物品
                    ItemStack crystalStack = new ItemStack(ModItems.MAGIC_CRYSTAL, remaining);
                    Block.dropStack(world, pos, crystalStack);
                }
            }
        }
        
        super.onStateReplaced(state, world, pos, newState, moved);
    }
}
```

---

## 6. 添加粒子效果

### 6.1 在方块实体中添加粒子

更新 `MagicCrystalBlockEntity.java` 添加粒子效果：

```java
package net.example.mymod.block.entity;

import net.minecraft.block.BlockState;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.World;

/**
 * 魔法水晶方块实体
 * 用于存储水晶数量和产生粒子效果
 */
public class MagicCrystalBlockEntity extends BlockEntity {
    
    private int crystalCount = 9;
    private static final int MAX_CRYSTALS = 9;
    
    // 粒子计时器
    private int particleTick = 0;
    
    public MagicCrystalBlockEntity(BlockPos pos, BlockState state) {
        super(ModBlockEntities.MAGIC_CRYSTAL, pos, state);
    }
    
    @Override
    public void readNbt(NbtCompound nbt) {
        super.readNbt(nbt);
        this.crystalCount = nbt.getInt("crystalCount");
    }
    
    @Override
    protected void writeNbt(NbtCompound nbt) {
        super.writeNbt(nbt);
        nbt.putInt("crystalCount", this.crystalCount);
    }
    
    // 每 tick 更新
    public void tick() {
        if (world == null || world.isClient()) return;
        
        // 生成粒子效果
        particleTick++;
        if (particleTick >= 10) {  // 每 10 tick 生成一次
            spawnParticles();
            particleTick = 0;
        }
    }
    
    // 生成粒子
    private void spawnParticles() {
        if (crystalCount <= 0 || !(world instanceof ServerWorld serverWorld)) {
            return;
        }
        
        Random random = world.getRandom();
        
        // 生成紫罗兰色魔法粒子
        for (int i = 0; i < crystalCount; i++) {
            double x = pos.getX() + 0.3 + random.nextDouble() * 0.4;
            double y = pos.getY() + 0.5 + random.nextDouble() * 0.5;
            double z = pos.getZ() + 0.3 + random.nextDouble() * 0.4;
            
            serverWorld.spawnParticles(
                ParticleTypes.ENCHANT,
                x, y, z,
                1,                    // 粒子数量
                0.02, 0.02, 0.02,    // 速度偏移
                0.0                   // 速度
            );
        }
    }
    
    public int getCrystalCount() {
        return crystalCount;
    }
    
    public void setCrystalCount(int count) {
        this.crystalCount = Math.max(0, Math.min(count, MAX_CRYSTALS));
        markDirty();
        if (world != null) {
            world.updateListeners(pos, getCachedState(), getCachedState(), 3);
        }
    }
    
    public boolean collectCrystal() {
        if (crystalCount > 0) {
            setCrystalCount(crystalCount - 1);
            return true;
        }
        return false;
    }
    
    public boolean isEmpty() {
        return crystalCount <= 0;
    }
}
```

### 6.2 注册方块实体的 tick

需要让方块实体能够接收 tick 事件。在 Fabric 中，我们需要将方块实体标记为可以 tick：

更新 `ModBlockEntities.java`：

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.block.entity.MagicCrystalBlockEntity;
import net.minecraft.block.entity.BlockEntityType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModBlockEntities {
    
    public static BlockEntityType<MagicCrystalBlockEntity> MAGIC_CRYSTAL;
    
    public static void register() {
        MAGIC_CRYSTAL = Registry.register(
            Registries.BLOCK_ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "magic_crystal"),
            BlockEntityType.Builder.create(
                MagicCrystalBlockEntity::new,
                ModBlocks.MAGIC_CRYSTAL
            )
            // 不需要特殊标志，BlockEntity 默认支持 tick
            .build(null)
        );
    }
}
```

---

## 7. 注册和资源文件

### 7.1 更新 Mod 入口

更新 `Mymod.java` 确保所有注册都被调用：

```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.init.ModBlocks;
import net.example.mymod.init.ModItems;
import net.example.mymod.init.ModBlockEntities;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始加载魔法水晶 Mod...");
        
        // 注册顺序很重要：先注册方块实体，再注册方块
        ModBlockEntities.register();
        ModBlocks.register();
        ModItems.register();
        
        LOGGER.info("魔法水晶 Mod 加载完成！");
    }
}
```

### 7.2 创建纹理文件

由于我们不能直接创建图片文件，需要使用占位符或者让 Minecraft 使用默认纹理。你有两个选择：

**选项 1：使用 Minecraft 自带纹理**
创建一个简单的 JSON 模型文件，引用现有纹理。

### 7.3 创建模型文件

创建 `src/main/resources/assets/mymod/models/block/magic_crystal.json`：

```json
{
  "parent": "minecraft:block/cube_all",
  "textures": {
    "all": "mymod:block/magic_crystal"
  }
}
```

### 7.4 创建语言文件

创建 `src/main/resources/assets/mymod/lang/zh_cn.json`：

```json
{
  "block.mymod.magic_crystal": "魔法水晶",
  "item.mymod.magic_crystal": "魔法水晶"
}
```

创建 `src/main/resources/assets/mymod/lang/en_us.json`：

```json
{
  "block.mymod.magic_crystal": "Magic Crystal",
  "item.mymod.magic_crystal": "Magic Crystal"
}
```

---

## 8. 测试运行

### 8.1 编译并运行

在终端中运行：

```bash
./gradlew build
./gradlew runClient
```

### 8.2 游戏内测试

1. 进入游戏
2. 使用命令获取魔法水晶方块：
   ```
   /give @p mymod:magic_crystal
   ```
3. 放置方块，观察发光效果
4. 右键点击方块，收集水晶
5. 观察粒子效果

### 8.3 预期效果

| 功能 | 预期结果 |
|------|----------|
| 方块放置 | 发出紫罗兰色光芒 |
| 右键交互 | 收集一个水晶，获得物品 |
| 粒子效果 | 每秒产生紫色魔法粒子 |
| 全部收集 | 方块消失 |
| 破坏方块 | 掉落剩余水晶 |

---

## 完整代码汇总

### 项目结构

```
src/main/java/net/example/mymod/
├── Mymod.java
├── init/
│   ├── ModBlocks.java
│   ├── ModItems.java
│   └── ModBlockEntities.java
├── block/
│   └── MagicCrystalBlock.java
├── block/entity/
│   └── MagicCrystalBlockEntity.java
└── item/
    └── MagicCrystalItem.java

src/main/resources/assets/mymod/
├── models/
│   └── block/
│       └── magic_crystal.json
└── lang/
    ├── zh_cn.json
    └── en_us.json
```

---

## 常见问题

### Q1: 方块不发光？
检查 `luminance()` 方法设置，确保返回正确的亮度值（0-15）。

### Q2: 右键没有反应？
确保在服务端处理交互逻辑，客户端只返回 `ActionResult.SUCCESS`。

### Q3: 粒子不显示？
确保在服务端（`ServerWorld`）生成粒子，而不是普通 `World`。

### Q4: 方块实体数据不保存？
确保正确实现 `readNbt` 和 `writeNbt` 方法。

---

## 下一步

现在你已经完成了魔法水晶的开发，接下来让我们学习：

- [第三章：魔法棒](./03-magic-wand.md) - 创建可以发射魔法弹的特殊物品

---

*魔法水晶是最基础的魔法材料，接下来我们将用它来制作更强大的魔法工具！*
