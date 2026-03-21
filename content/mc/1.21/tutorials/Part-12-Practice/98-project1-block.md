# 项目1：添加新方块

> 带你创建一个会发光�?魔法水晶方块"�?
---

## 项目目标

学完这个项目后，你将掌握�?- 如何注册一个自定义方块
- 如何创建方块类并设置属�?- 如何给方块添加特殊效�?- 如何添加材质贴图
- 如何测试方块

---

## 项目概览

```mermaid
flowchart TD
    A[开始项目] --> B[注册方块]
    B --> C[创建方块类]
    C --> D[设置方块属性]
    D --> E[添加材质]
    E --> F[创建资源包]
    F --> G[测试游戏]
    
    style A fill:#90EE90
    style G fill:#87CEEB
```

---

## 所需知识

- 注册表基础（Part-1 �?章）
- 方块基础（Part-3 �?4章）
- 资源包结构（Part-8 �?0章）

---

## 步骤详解

### 步骤 1：什么是项目驱动学习�?
想象你要学做饭：

```
传统学习�?                       项目驱动学习�?┌──────────────�?                ┌──────────────�?�? 1. 切菜理论  �?                �? 1. 目标：做   �?�? 2. 火候理�? �?                �?   一道菜     �?�? 3. 调味理论  �?                �?             �?�? 4. ...      �?                �? 2. 边做边学  �?�? �?          �?                �?   切菜       �?�? 终于做饭�?  �?                �?   火�?      �?└──────────────�?                �?   调味       �?                                 └──────────────�?```

**项目驱动学习的好�?*�?1. 学完马上能用
2. 目标明确不迷�?3. 成就感强

---

### 步骤 2：注册方�?
#### 核心概念

注册方块就像给方�?上户�?�?
```
┌─────────────────────────────────────────�?�?          Minecraft 注册�?              �?�?                                        �?�? namespace:path = 唯一�?身份证号"       �?�?                                        �?�? "minecraft:stone"     �?石头             �?�? "minecraft:diamond"  �?钻石             �?�? "mymod:magic_crystal" �?你的魔法水晶    �?�?                                        �?└─────────────────────────────────────────�?```

#### 代码实现

�?Mod 主类中添加：

```java
public class MyMod implements ModInitializer {
    
    // 定义一个魔法水晶方�?    public static final Block MAGIC_CRYSTAL = Registry.register(
        Registries.BLOCK,                          // 1. 注册到方块注册表
        Identifier.of("mymod", "magic_crystal"),  // 2. ID = "mymod:magic_crystal"
        new Block(AbstractBlock.Settings.create()  // 3. 创建方块实例
            .strength(3.0f, 6.0f)                 // 硬度3.0, 爆炸抗�?.0
            .luminance(state -> 15)               // 发光亮度15（最亮）
            .sounds(BlockSoundGroup.AMETHYST)     // 紫水晶音�?        )
    );
    
    @Override
    public void onInitialize() {
        // 方块注册完成�?    }
}
```

**三要素口诀**�?```
Registry.register(注册�? Identifier, new 方块)
         �?          �?         �?       放哪柜子     起什么名    什么样�?```

---

### 步骤 3：创建方块类（添加特殊行为）

#### 为什么需要自定义方块类？

普通方块只能设置属性，但如果你想：
- 右键点击时有反应
- 定时改变状�?- 和其他方块交�?
就需要创建自定义方块类�?
#### 代码实现

```java
// src/main/java/com/mymod/block/MagicCrystalBlock.java

public class MagicCrystalBlock extends Block {
    
    public MagicCrystalBlock(Settings settings) {
        super(settings);
    }
    
    // 当玩家右键点击方块时触发
    @Override
    public ActionResult onUse(BlockState state, World world, 
                              BlockPos pos, PlayerEntity player, 
                              BlockHitResult hit) {
        if (!world.isClient) {
            // 在服务端执行
            // 给玩家发送消�?            player.sendMessage(Text.literal("你点击了魔法水晶�?));
            
            // 产生粒子效果
            world.createAndSpawnFilledParticles(
                pos.toCenterPos(), 
                0.5, 0.5, 0.5,  // RGB颜色
                10              // 粒子数量
            );
            
            return ActionResult.SUCCESS;
        }
        
        return ActionResult.CONSUME;
    }
    
    // 随机刻更新（类似草方块变泥土�?    @Override
    protected void randomTick(BlockState state, ServerWorld world, 
                              BlockPos pos, Random random) {
        // �?tick �?5% 概率改变状�?        if (random.nextFloat() < 0.05f) {
            // 闪烁效果：切换亮�?            int currentLuminance = state.get(LuminousBlock.LUMINANCE);
            int newLuminance = currentLuminance == 15 ? 5 : 15;
            world.setBlockState(pos, state.with(LUMINANCE, newLuminance));
        }
    }
    
    // 方块属性设�?    @Override
    protected void appendProperties(StateManager.Builder<Block, BlockState> builder) {
        // 添加自定义属�?        builder.add(LUMINANCE);  // 亮度属�?    }
}
```

---

### 步骤 4：设置方块属�?
#### 常见属性一�?
```java
new Block(AbstractBlock.Settings.create()
    // 基础属�?    .strength(1.5f, 6.0f)              // 硬度, 爆炸抗�?    .breakByTool(ParadigmValidators.NORMAL)  // 需要特定工�?    .sounds(BlockSoundGroup.STONE)     // 音效
    
    // 特殊属�?    .luminance(state -> 15)            // 发光�?-15�?    .ticksRandomly()                  // 需要随机刻
    .solidBlock((state, world, pos) -> false)  // 是否固体
    .suffocates((state, world, pos) -> false)  // 是否窒息
    
    // 碰撞属�?    .noCollision()                    // 无碰撞箱（可穿过�?    .nonOpaque()                      // 透明
    .air()                            // 空气属�?    
    // 可燃属�?    .burnable()                       // 可燃
    .offset(Blocks::getDefaultState)   // 随机偏移放置
)
```

#### 属性对应关�?
| 属�?| 钻石 | 石头 | 泥土 | 玻璃 |
|------|------|------|------|------|
| 硬度 | 5.0 | 1.5 | 0.5 | 0.3 |
| 抗�?| 6.0 | 6.0 | 0.5 | 0.3 |
| 音效 | METAL | STONE | GRASS | GLASS |
| 碰撞 | �?| �?| �?| �?|

---

### 步骤 5：添加材质贴�?
#### 材质文件结构

```
resources/
└── assets/
    └── mymod/
        ├── textures/
        �?  └── block/
        �?      └── magic_crystal.png    # 方块材质�?6x16�?        └── models/
            └── block/
                └── magic_crystal.json   # 方块模型
```

#### 方块模型 JSON

```json
{
    "parent": "minecraft:block/cube_all",
    "textures": {
        "all": "mymod:block/magic_crystal"
    }
}
```

#### 方块状�?JSON（如果需要）

```json
{
    "variants": {
        "": { "model": "mymod:block/magic_crystal" }
    }
}
```

#### 物品模型 JSON

```json
{
    "parent": "mymod:block/magic_crystal"
}
```

---

### 步骤 6：测�?
#### 测试步骤

1. **启动游戏**
   ```
   运行你的 Mod 开发环�?   ```

2. **进入世界**
   ```
   创建一个新世界或进入已有世�?   ```

3. **获取方块**
   ```
   /give @s mymod:magic_crystal
   ```

4. **测试功能**
   - 放置方块，观察是否发�?   - 右键点击，观察粒子效�?   - 等待一会儿，观察亮度变�?
#### 常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| 方块不显�?| 材质路径错误 | 检�?textures 目录 |
| 亮度不变�?| 没开随机�?| 添加 `.ticksRandomly()` |
| 右键无反�?| 客户�?服务端分�?| 确保逻辑�?`!world.isClient` �?|

---

## 完整代码

### Mod 主类

```java
package com.mymod;

import net.minecraft.block.Block;
import net.minecraft.block.AbstractBlock;
import net.minecraft.block.BlockSoundGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.fabricmc.api.ModInitializer;

public class MyMod implements ModInitializer {
    
    // 注册魔法水晶方块
    public static final Block MAGIC_CRYSTAL = Registry.register(
        Registries.BLOCK,
        Identifier.of("mymod", "magic_crystal"),
        new MagicCrystalBlock(AbstractBlock.Settings.create()
            .strength(3.0f, 6.0f)
            .luminance(state -> 15)
            .sounds(BlockSoundGroup.AMETHYST)
            .ticksRandomly()
        )
    );
    
    @Override
    public void onInitialize() {
        System.out.println("魔法水晶 Mod 已加载！");
    }
}
```

### 自定义方块类

```java
package com.mymod.block;

import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.util.ActionResult;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.state.property.IntProperty;
import net.minecraft.state.StateManager;
import net.minecraft.particle.ParticleTypes;
import java.util.Random;

public class MagicCrystalBlock extends Block {
    
    // 自定义属性：亮度等级
    public static final IntProperty LUMINANCE = IntProperty.of("luminance", 1, 15);
    
    public MagicCrystalBlock(Settings settings) {
        super(settings);
        this.setDefaultState(this.getDefaultState().with(LUMINANCE, 15));
    }
    
    @Override
    protected void appendProperties(StateManager.Builder<Block, BlockState> builder) {
        builder.add(LUMINANCE);
    }
    
    @Override
    public ActionResult onUse(BlockState state, World world, BlockPos pos, 
                               PlayerEntity player, BlockHitResult hit) {
        if (!world.isClient) {
            player.sendMessage(Text.literal("你点击了魔法水晶�?));
            
            // 生成粒子效果
            ((ServerWorld) world).spawnParticles(
                ParticleTypes.END_ROD,
                pos.getX() + 0.5, pos.getY() + 0.5, pos.getZ() + 0.5,
                10, 0.2, 0.2, 0.2, 0.01
            );
            
            // 切换亮度
            int newLuminance = state.get(LUMINANCE) == 15 ? 5 : 15;
            world.setBlockState(pos, state.with(LUMINANCE, newLuminance));
            
            return ActionResult.SUCCESS;
        }
        return ActionResult.CONSUME;
    }
    
    @Override
    protected void randomTick(BlockState state, ServerWorld world, 
                             BlockPos pos, Random random) {
        // 5% 概率改变亮度
        if (random.nextFloat() < 0.05f) {
            int newLuminance = state.get(LUMINANCE) == 15 ? 5 : 15;
            world.setBlockState(pos, state.with(LUMINANCE, newLuminance));
        }
    }
}
```

---

## 遇到问题怎么办？

### 调试技�?
1. **查看日志**
   ```
   游戏崩溃时查看终端输�?   ```

2. **逐步测试**
   ```
   先创建最简单的方块
   �?添加一个功�?   �?再添加一个功�?   ```

3. **使用命令测试**
   ```
   /give @s mymod:magic_crystal 1 0 {"BlockEntityTag":{"luminance":15}}
   ```

### 常见错误

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `Registry is frozen` | 注册时机错误 | 确保�?`onInitialize` 中注�?|
| `Missing texture` | 材质文件不存�?| 检查路径是否正�?|
| `NullPointerException` | 空引�?| 检�?world 是否�?null |

---

## 扩展挑战

完成了基础项目？试试这些挑战：

### 挑战 1：创建不同颜色的水晶

```java
// 添加颜色属�?public static final EnumProperty<CrystalColor> COLOR = 
    EnumProperty.of("color", CrystalColor.class);

// 创建多种颜色的水�?public enum CrystalColor {
    RED, BLUE, GREEN, PURPLE
}
```

### 挑战 2：创建可交互的电路方�?
```java
// 当被充能时发出红石信�?@Override
public int getWeakRedstonePower(BlockState state) {
    return state.get(POWERED) ? 15 : 0;
}
```

### 挑战 3：创建记忆方�?
```java
// 记住最后点击它的玩�?@Override
public ActionResult onUse(BlockState state, World world, BlockPos pos, 
                           PlayerEntity player, BlockHitResult hit) {
    BlockEntity be = world.getBlockEntity(pos);
    if (be instanceof MemoryCrystalBlockEntity memory) {
        memory.setLastClicker(player.getName().getString());
    }
    return super.onUse(state, world, pos, player, hit);
}
```

---

## 参考资�?
### 相关章节

- [注册表基础](/mc/1.21/tutorials/Part-1-Foundation/04-registry-system/)
- [Block 基础](/mc/1.21/tutorials/Part-3-Block-Item/14-block-basics/)
- [BlockState](/mc/1.21/tutorials/Part-3-Block-Item/15-block-state/)
- [BlockEntity](/mc/1.21/tutorials/Part-3-Block-Item/16-block-entity/)
- [资源包](/mc/1.21/tutorials/Part-8-Resource/40-resource-pack/)

### 源码参�?
```
source/net/minecraft/block/Blocks.java      - 方块定义示例
source/net/minecraft/block/Block.java       - 方块基类
source/net/minecraft/block/AmethystBlock.java - 紫水晶方块参�?```

---

## 下一�?
学会了创建方块？接下来我们学习创建物品！

> [项目2：添加新物品](./99-project2-item.md)

---

*本教程基�?Minecraft 1.21 源码编写*
