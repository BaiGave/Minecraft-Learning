# 🧱 创建你的第一个方块！

> **TL;DR** 方块是 Minecraft 的灵魂！这一章教你从零创建一个会发光的方块！

---

## 📖 目录

1. [🎯 方块是什么？](#1-方块是什么)
2. [🛠️ 创建简单方块](#2-创建简单方块)
3. [🎨 添加纹理和模型](#3-添加纹理和模型)
4. [⚙️ 方块属性设置](#4-方块属性设置)
5. [🖱️ 方块交互](#5-方块交互)
6. [📦 完整示例](#6-完整示例)

---

## 1. 方块是什么？

### 1.1 Minecraft 的积木

```mermaid
flowchart TB
    subgraph "🎮 Minecraft 世界"
        direction TB
        W["🌍 世界"]
        W --> B1["🧱 方块"]
        W --> E1["👾 实体"]
        W --> P1["📦 物品"]
    end

    subgraph "🧱 方块类型"
        B1 --> SOLID["🏔️ 固体方块"]
        B1 --> LIQUID["💧 液体方块"]
        B1 --> PLANT["🌿 植物方块"]
        B1 --> TRANSPARENT["🪟 透明方块"]
        B1 --> ENTITY["📦 方块实体"]
    end
```

### 1.2 方块的组成

```mermaid
flowchart LR
    subgraph "🧱 方块 = 属性 + 行为"
        A["⚙️ 属性<br/>硬度和抗爆性<br/>音效和发光<br/>碰撞箱"] 
        B["🎮 行为<br/>右键交互<br/>放置/破坏<br/>定时逻辑"]
    end

    A --> COMBINE["✨ 完整方块"]
    B --> COMBINE
```

### 1.3 方块 vs 物品

```mermaid
flowchart LR
    subgraph "🧱 Block"
        B["方块本身<br/>在世界中放置"]
    end

    subgraph "📦 Item"
        I["物品形式<br/>玩家背包中"]
    end

    subgraph "🔗 关系"
        B -.->|"自动生成"| I
        I -.->|"放置生成"| B
    end
```

---

## 2. 创建简单方块

### 2.1 三步创建法

```mermaid
flowchart LR
    A["📝 第一步<br/>创建 Block 对象"] --> B["🔖 第二步<br/>注册到注册表"]
    B --> C["🎨 第三步<br/>添加资源文件"]

    style A fill:#4ecdc4
    style B fill:#ffe66d
    style C fill:#ff6b6b
```

### 2.2 代码模板

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.block.Block;

public class ModBlocks {

    // ========== 1️⃣ 创建方块对象 ==========
    public static final Block MAGIC_STONE = new Block(
        Block.Settings.create()
            .strength(3.0f)   // 硬度
            .resistance(6.0f) // 抗爆性
    );

    // ========== 2️⃣ 注册方块 ==========
    public static void register() {
        registerBlock("magic_stone", MAGIC_STONE);
    }

    private static void registerBlock(String name, Block block) {
        // 注册方块本身
        Registry.register(
            Registries.BLOCK,
            Identifier.of(Mymod.MOD_ID, name),
            block
        );

        // 同时注册物品形式（这样玩家才能获得）
        Registry.register(
            Registries.ITEM,
            Identifier.of(Mymod.MOD_ID, name),
            new BlockItem(block, new FabricItemSettings())
        );
    }
}
```

### 2.3 在 Mod 入口注册

```mermaid
sequenceDiagram
    participant G as 🎮 游戏启动
    participant M as 🧙 Mymod
    participant B as 🧱 ModBlocks

    G->>M: onInitialize()
    M->>B: register()
    B-->>M: ✅ 注册完成
    M-->>G: ✅ Mod 加载完成
```

```java
public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";

    @Override
    public void onInitialize() {
        LOGGER.info("🚀 开始加载 {}", MOD_ID);

        // 注册方块！
        ModBlocks.register();

        LOGGER.info("✅ {} 加载完成！", MOD_ID);
    }
}
```

---

## 3. 添加纹理和模型

### 3.1 资源文件结构

```mermaid
filesystem
    .
    └── src/main/resources/
        └── assets/
            └── mymod/
                ├── textures/
                │   └── block/
                │       └── magic_stone.png  ← 你的纹理
                ├── models/
                │   ├── block/
                │   │   └── magic_stone.json  ← 方块模型
                │   └── item/
                │       └── magic_stone.json  ← 物品模型
                └── lang/
                    ├── en_us.json
                    └── zh_cn.json
```

### 3.2 模型类型选择

```mermaid
flowchart TD
    A{"方块纹理特征？"} --> B{6面相同？}
    B -->|是| C["✅ cube_all<br/>大多数方块"]
    B -->|否| D{侧+顶底不同？}
    D -->|是| E["✅ cube_column<br/>原木、陶瓦"]
    D -->|否| F{有特殊形状？}
    F -->|是| G["✅ 自定义模型<br/>楼梯、门等"]
    F -->|否| H["✅ cube_all<br/>默认使用"]
```

### 3.3 模型文件示例

```json
// 方块模型 - 6面相同纹理
{
    "parent": "minecraft:block/cube_all",
    "textures": {
        "all": "mymod:block/magic_stone"
    }
}
```

### 3.4 纹理文件

> 💡 **提示**：可以用在线工具生成简单纹理
> - [Craft Texturer](https://crafttexturer.com/)
> - [NovaSkin](https://minecraft.novaskin.me/editor)

---

## 4. 方块属性设置

### 4.1 属性速查表

```mermaid
graph LR
    subgraph "常用属性"
        H1["💪 strength() 硬度"]
        H2["🔊 sounds() 音效"]
        H3["💡 luminance() 发光"]
        H4["🔧 requiresTool() 需要工具"]
    end

    style H1 fill:#ff6b6b
    style H2 fill:#4ecdc4
    style H3 fill:#ffe66d
    style H4 fill:#9b59b6
```

### 4.2 完整属性示例

```java
// 发光方块
public static final Block GLOWING_BLOCK = new Block(
    Block.Settings.create()
        .strength(2.0f)                    // 硬度
        .luminance(state -> 15)             // 💡 发光等级（0-15）
        .sounds(BlockSoundGroup.GLASS)      // 音效
);

// 透明方块
public static final Block GLASS_BLOCK = new Block(
    Block.Settings.create()
        .strength(1.5f)
        .sounds(BlockSoundGroup.GLASS)
        .nonOpaque()                        // 非不透明
);

// 金属方块
public static final Block METAL_BLOCK = new Block(
    Block.Settings.create()
        .strength(5.0f, 30.0f)             // 硬度和抗爆性
        .requiresTool()                    // 🔧 需要工具
        .sounds(BlockSoundGroup.METAL)
);
```

### 4.3 发光等级对比

```mermaid
flowchart LR
    L0["💡 0 - 不发光"] 
    L4["💡 4 - 微弱"] 
    L8["💡 8 - 中等"] 
    L15["💡 15 - 最亮"]

    L0 --> L4 --> L8 --> L15

    style L0 fill:#666
    style L4 fill:#ffe66d
    style L8 fill:#ff9f43
    style L15 fill:#ff6b6b,color:#fff
```

---

## 5. 方块交互

### 5.1 创建可交互方块

```mermaid
flowchart TB
    A["👤 玩家右键点击"] --> B["触发 onUse()"]
    B --> C{world.isClient?}
    C -->|是| D["播放音效/粒子"]
    C -->|否| E["处理逻辑"]
    D --> F["返回 SUCCESS"]
    E --> G["发送消息/改变状态"]
    G --> F

    style B fill:#ffe66d
    style E fill:#4ecdc4
```

### 5.2 完整交互代码

```java
public class MagicStoneBlock extends Block {

    public MagicStoneBlock(Settings settings) {
        super(settings);
    }

    // 🖱️ 右键点击时调用
    @Override
    public ActionResult onUse(
            BlockState state,           // 当前状态
            World world,                // 所在世界
            BlockPos pos,               // 方块位置
            PlayerEntity player,        // 点击的玩家
            BlockHitResult hit         // 点击信息
    ) {
        // 客户端：只做视觉效果
        if (world.isClient) {
            return ActionResult.SUCCESS;
        }

        // 服务端：处理实际逻辑
        player.sendMessage(
            Text.literal("✨ 你点击了魔法石头！"),
            false
        );

        // 改变方块为钻石块（演示用）
        world.setBlockState(pos, Blocks.DIAMOND_BLOCK.getDefaultState());

        return ActionResult.SUCCESS;
    }
}
```

### 5.3 常用方法一览

```mermaid
mindmap
  root((🧱 Block 方法))
    🖱️ 交互
      onUse 右键
      onBreak 破坏
      onPlaced 放置
    💥 行为
      hasSidedTransparency 透明
      getHardness 硬度
      getBlastResistance 抗爆
    💡 光照
      getLuminance 发光等级
      emissive 自定义发光
    👥 实体
      allowsSpawning 实体生成
      solidBlock 固体判定
```

---

## 6. 完整示例

### 6.1 项目结构图

```mermaid
flowchart TB
    subgraph "📁 你的 Mod"
        M["🧙 Mymod.java"]
        MB["🧱 ModBlocks.java"]
        B["💎 MagicStoneBlock.java"]
    end

    subgraph "📦 资源"
        T["🎨 纹理文件"]
        MOD["📄 JSON 模型"]
        LANG["🌐 语言文件"]
    end

    M -->|"调用"| MB
    MB -->|"创建"| B

    B --> T & MOD & LANG

    style M fill:#9b59b6,color:#fff
    style B fill:#3498db
```

### 6.2 完整代码

```java
// ========== 方块类 ==========
package net.example.mymod.block;

public class MagicStoneBlock extends Block {

    public MagicStoneBlock(Settings settings) {
        super(settings);
    }

    @Override
    public ActionResult onUse(BlockState state, World world, BlockPos pos,
                              PlayerEntity player, Hand hand, BlockHitResult hit) {
        if (world.isClient) return ActionResult.SUCCESS;

        // 发送消息
        player.sendMessage(Text.literal("💎 魔法石头被点击了！"), false);
        return ActionResult.SUCCESS;
    }
}

// ========== 注册类 ==========
package net.example.mymod.init;

public class ModBlocks {

    public static final Block MAGIC_STONE = new MagicStoneBlock(
        Block.Settings.create()
            .strength(3.0f)
            .luminance(state -> 10)
            .sounds(BlockSoundGroup.STONE)
    );

    public static void register() {
        registerBlock("magic_stone", MAGIC_STONE);
    }

    private static void registerBlock(String name, Block block) {
        Identifier id = Identifier.of(Mymod.MOD_ID, name);

        // 注册方块
        Registry.register(Registries.BLOCK, id, block);

        // 注册物品
        Registry.register(
            Registries.ITEM, id,
            new BlockItem(block, new FabricItemSettings())
        );
    }
}
```

### 6.3 最终效果预览

```mermaid
flowchart LR
    A["🎮 游戏内"] --> B["🔍 寻找方块"]
    B --> C["💎 magic_stone"]
    C --> D["🖱️ 右键点击"]
    D --> E["💬 显示消息"]

    style A fill:#9b59b6,color:#fff
    style C fill:#3498db,color:#fff
    style E fill:#2ecc71
```

---

## 🎯 总结

```mermaid
flowchart TD
    START["🧱 创建方块三步曲"] --> A["1️⃣ new Block()"]
    A --> B["2️⃣ Block.Settings"]
    B --> C["3️⃣ Registry.register()"]
    C --> D["4️⃣ 添加资源文件"]

    START2["💡 记住这些"] --> T1["方块 + BlockItem = 可放置"]
    START2 --> T2["luminance() = 发光"]
    START2 --> T3["onUse() = 右键交互"]

    style START fill:#9b59b6,color:#fff
    style D fill:#2ecc71
```

### 你学到了：

- ✅ 创建基础的方块对象
- ✅ 设置方块属性（硬度、音效、发光）
- ✅ 注册方块和物品
- ✅ 创建 JSON 模型文件
- ✅ 处理右键交互

---

## 下一步

- [📦 方块实体](./02-block-entity.md) - 存储数据的进阶方块
- [🪄 创建物品](./03-creating-items.md) - 创造更多物品类型

---

*💡 **挑战**：尝试创建一个会变换颜色的方块？提示：使用 `onScheduledTick()` 方法！*
