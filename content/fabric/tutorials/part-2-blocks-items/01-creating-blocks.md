# 第一章：创建自定义方块

> 这一章学习如何使用 Fabric 创建完整的自定义方块，包括纹理、模型和方块行为。

---

## 目录

1. [方块基础](#1-方块基础)
2. [创建简单方块](#2-创建简单方块)
3. [添加纹理和模型](#3-添加纹理和模型)
4. [方块状态属性](#4-方块状态属性)
5. [方块交互](#5-方块交互)
6. [完整示例](#6-完整示例)

---

## 1. 方块基础

### 1.1 什么是方块？

方块是 Minecraft 世界的基本组成部分。Minecraft 中的方块不仅仅是"一块方形的物体"，它可以是：
- 固体（可以碰撞）
- 透明（光可以通过）
- 液体（可以流动）
- 植物（可以跨格子）
- 实体方块（有特殊行为）

### 1.2 方块的组成

```
┌─────────────────────────────────────┐
│             方块 (Block)               │
├─────────────────────────────────────┤
│  基础属性                             │
│  ├── 硬度（破坏时间）                  │
│  ├── 抗爆性                          │
│  ├── 音效                            │
│  └── 发光等级                         │
├─────────────────────────────────────┤
│  渲染属性                             │
│  ├── 纹理                            │
│  ├── 模型                            │
│  └── 透明度                          │
├─────────────────────────────────────┤
│  行为属性                             │
│  ├── 是否固体                         │
│  ├── 是否阻挡光照                      │
│  ├── 碰撞箱                          │
│  └── 交互行为                         │
└─────────────────────────────────────┘
```

---

## 2. 创建简单方块

### 2.1 定义方块

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;

public class ModBlocks {
    // 创建一个简单方块
    public static final Block MAGIC_STONE = new Block(
        Block.Settings.create()
            .strength(3.0f)  // 硬度：3.0（石头是 1.5）
            .resistance(6.0f)  // 抗爆性：6.0
    );

    public static void register() {
        registerBlock("magic_stone", MAGIC_STONE);
    }

    private static void registerBlock(String name, Block block) {
        Registry.register(
            Registries.BLOCK,
            Identifier.of(Mymod.MOD_ID, name),
            block
        );

        // 同时注册对应的物品（这样玩家才能获得）
        Registry.register(
            Registries.ITEM,
            Identifier.of(Mymod.MOD_ID, name),
            new BlockItem(block, new net.fabricmc.fabric.api.item.v1.FabricItemSettings())
        );
    }
}
```

### 2.2 在 Mod 入口注册

```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.init.ModBlocks;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始初始化 {}", MOD_ID);

        // 注册方块
        ModBlocks.register();

        LOGGER.info("{} 初始化完成", MOD_ID);
    }
}
```

---

## 3. 添加纹理和模型

### 3.1 创建纹理文件

在 `src/main/resources/assets/mymod/textures/block/` 下创建图片：
```
resources/
└── assets/
    └── mymod/
        └── textures/
            └── block/
                └── magic_stone.png    ← 创建 16x16 或 32x32 的图片
```

> **提示**：如果你不会画图，可以先用一个简单的纯色图片代替。

### 3.2 创建方块模型

创建 `resources/assets/mymod/models/block/magic_stone.json`：

```json
{
    "parent": "minecraft:block/cube_all",
    "textures": {
        "all": "mymod:block/magic_stone"
    }
}
```

**模型类型说明**：

| 模型类型 | JSON parent | 适用场景 |
|----------|-------------|----------|
| `cube_all` | 6面相同纹理 | 大多数方块 |
| `cube_column` | 侧+顶底不同 | 原木、陶瓦 |
| `cube_north` | 6面完全不同 | 复杂方块 |
| `grass_block` | 特殊草地 | 草方块 |

### 3.3 创建物品模型

创建 `resources/assets/mymod/models/item/magic_stone.json`：

```json
{
    "parent": "minecraft:block/magic_stone"
}
```

### 3.4 添加语言文件

创建 `resources/assets/mymod/lang/en_us.json`：

```json
{
    "block.mymod.magic_stone": "Magic Stone"
}
```

可选：创建 `resources/assets/mymod/lang/zh_cn.json`：

```json
{
    "block.mymod.magic_stone": "魔法石头"
}
```

---

## 4. 方块状态属性

### 4.1 常见属性设置

```java
public static final Block EXAMPLE_BLOCK = new Block(
    Block.Settings.create()
        // 基础属性
        .strength(3.0f)                    // 硬度
        .strength(3.0f, 6.0f)             // 硬度和抗爆性

        // 工具要求
        .requiresTool()                     // 需要工具
        .requiresTool(ToolType.PICKAXE)    // 需要镐子
        .breakByTool(ToolType.HAND, -1)    // 手不能破坏

        // 音效
        .sounds(BlockSoundGroup.STONE)     // 石质音效
        .sounds(BlockSoundGroup.WOOD)      // 木质音效
        .sounds(BlockSoundGroup.METAL)     // 金属音效

        // 发光和颜色
        .luminance(state -> 15)            // 发光等级（0-15）
        .emissive(face, state)             // 自定义发光

        // 物理属性
        .slipperiness(0.98f)              // 平滑度（冰=0.98）
        .velocityMultiplier(0.8f)           // 速度乘数
        .jumpVelocityMultiplier(1.2f)        // 跳跃乘数

        // 固体和碰撞
        .solidBlock((state, world, pos) -> true)   // 固体判定
        .allowsSpawning((state, world, pos, entity) -> false)  // 允许实体生成
        .solid()                           // 是固体（默认）
        .air()                             // 是空气（透明）

        // 其他
        .isSolid(Blocks::isSolid)          // 引用其他方块的固体判定
        .mapColor(MapColor.WHITE)          // 地图颜色
);
```

### 4.2 完整示例

```java
// 发光方块
public static final Block GLOWING_BLOCK = new Block(
    Block.Settings.create()
        .strength(2.0f)
        .luminance(state -> 15)  // 最大亮度
        .sounds(BlockSoundGroup.GLASS)
);

// 透明方块
public static final Block GLASS_BLOCK = new Block(
    Block.Settings.create()
        .strength(1.5f)
        .sounds(BlockSoundGroup.GLASS)
        .nonOpaque()  // 非不透明
);

// 泥土类方块
public static final Block MAGIC_DIRT = new Block(
    Block.Settings.create()
        .strength(0.5f)
        .sounds(BlockSoundGroup.GRAVEL)
);
```

---

## 5. 方块交互

### 5.1 创建可交互方块

要处理方块交互，需要创建一个扩展 `Block` 的类：

```java
package net.example.mymod.block;

import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.world.World;

public class MagicStoneBlock extends Block {
    public MagicStoneBlock(Settings settings) {
        super(settings);
    }

    // 当玩家右键点击方块时调用
    @Override
    public ActionResult onUse(
            BlockState state,           // 方块当前状态
            World world,               // 所在世界
            BlockPos pos,              // 方块位置
            PlayerEntity player,        // 点击的玩家
            BlockHitResult hit         // 点击信息
    ) {
        if (world.isClient) {
            // 客户端：只做视觉效果（如播放音效、显示粒子）
            return ActionResult.SUCCESS;
        }

        // 服务端：处理实际逻辑
        player.sendMessage(Text.literal("你点击了魔法石头！"), false);

        // 改变方块为钻石块
        world.setBlockState(pos, Blocks.DIAMOND_BLOCK.getDefaultState());

        return ActionResult.SUCCESS;
    }
}
```

### 5.2 注册自定义方块类

```java
public static final Block MAGIC_STONE = new MagicStoneBlock(
    Block.Settings.create().strength(3.0f)
);
```

### 5.3 常用方块方法

```java
public class CustomBlock extends Block {

    @Override
    public ActionResult onUse(BlockState state, World world, BlockPos pos,
                             PlayerEntity player, Hand hand,
                             BlockHitResult hit) {
        // 右键点击
        return ActionResult.SUCCESS;  // 或 PASS（让其他代码处理）
    }

    @Override
    public void onBreak(World world, BlockPos pos, BlockState state,
                        PlayerEntity player) {
        // 方块被破坏时
        // 可以在这里添加额外掉落
    }

    @Override
    public void onPlaced(World world, BlockPos pos, BlockState state,
                        LivingEntity placer, ItemStack itemStack) {
        // 方块被放置时
    }

    @Override
    public boolean hasSidedTransparency(BlockState state) {
        // 是否有面朝向透明
        return true;
    }

    @Override
    public float getHardness() {
        // 自定义硬度
        return 3.0f;
    }

    @Override
    public float getBlastResistance() {
        // 自定义抗爆性
        return 6.0f;
    }

    @Override
    public int getLuminance(BlockState state) {
        // 自定义发光等级
        return 15;
    }
}
```

---

## 6. 完整示例

### 6.1 方块类

```java
package net.example.mymod.block;

import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.world.World;

public class ClickableBlock extends Block {

    public ClickableBlock(Settings settings) {
        super(settings);
    }

    @Override
    public ActionResult onUse(
            BlockState state,
            World world,
            BlockPos pos,
            PlayerEntity player,
            Hand hand,
            BlockHitResult hit) {

        if (world.isClient) {
            return ActionResult.SUCCESS;
        }

        // 获取点击次数（存储在方块实体中会更好，这里简化处理）
        int clicks = 0;
        String message;

        if (player.isSneaking()) {
            // 潜行+右键：减少计数
            clicks = Math.max(0, clicks - 1);
            message = "计数减少！当前: " + clicks;
        } else {
            // 普通右键：增加计数
            clicks++;
            message = "计数增加！当前: " + clicks;
        }

        player.sendMessage(Text.literal(message), false);

        return ActionResult.SUCCESS;
    }
}
```

### 6.2 注册

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.block.ClickableBlock;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.block.Block;
import net.minecraft.item.BlockItem;
import net.fabricmc.fabric.api.item.v1.FabricItemSettings;

public class ModBlocks {

    public static final Block CLICKABLE_BLOCK = new ClickableBlock(
        Block.Settings.create()
            .strength(3.0f)
            .sounds(BlockSoundGroup.STONE)
    );

    public static void register() {
        registerBlock("clickable_block", CLICKABLE_BLOCK);
    }

    private static void registerBlock(String name, Block block) {
        Identifier id = Identifier.of(Mymod.MOD_ID, name);

        // 注册方块
        Registry.register(Registries.BLOCK, id, block);

        // 注册方块物品
        Registry.register(
            Registries.ITEM,
            id,
            new BlockItem(block, new FabricItemSettings())
        );
    }
}
```

### 6.3 资源文件结构

```
src/main/resources/
└── assets/
    └── mymod/
        ├── lang/
        │   ├── en_us.json
        │   └── zh_cn.json
        ├── models/
        │   ├── block/
        │   │   └── clickable_block.json
        │   └── item/
        │       └── clickable_block.json
        └── textures/
            └── block/
                └── clickable_block.png
```

### 6.4 模型文件

**方块模型** `models/block/clickable_block.json`：

```json
{
    "parent": "minecraft:block/cube_all",
    "textures": {
        "all": "mymod:block/clickable_block"
    }
}
```

**物品模型** `models/item/clickable_block.json`：

```json
{
    "parent": "minecraft:block/clickable_block"
}
```

---

## 下一步

现在你已经学会了创建自定义方块！接下来可以学习：
- [方块实体](./02-block-entity.md) - 学习存储数据的高级方块
- [创建自定义物品](./03-creating-items.md) - 创建更多物品类型

---

*参考：[方块系统分析](../../analysis/02-block-system.md)* - 查看更多方块 API 详情
