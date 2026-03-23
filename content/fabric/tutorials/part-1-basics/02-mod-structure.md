# 第二章：Mod 项目结构

> 这一章介绍如何组织 Mod 代码，让你的项目结构清晰易懂。

---

## 目录

1. [为什么需要良好的项目结构？](#1-为什么需要良好的项目结构)
2. [推荐的目录结构](#2-推荐的目录结构)
3. [Mod 主类](#3-mod-主类)
4. [按功能分模块](#4-按功能分模块)
5. [实践示例](#5-实践示例)
6. [命名规范](#6-命名规范)

---

## 1. 为什么需要良好的项目结构？

### 1.1 问题场景

想象一个混乱的衣橱：

```
混乱的衣橱：                   整洁的衣橱：
┌─────────────────┐           ┌─────────────────┐
│ 衣服堆在一起    │           │ 上衣区 │ 裤子区│
│ 袜子在内裤堆里  │           │ 袜子区 │ 内衣区│
│ 找一件衣服要10分钟│           │ 找衣服只用1分钟 │
└─────────────────┘           └─────────────────┘
```

### 1.2 良好结构的好处

```
✅ 容易找到代码     → 提高开发效率
✅ 代码清晰易读     → 便于维护
✅ 便于团队协作     → 多人同时开发
✅ 减少 bug         → 结构清晰，逻辑分明
```

---

## 2. 推荐的目录结构

### 2.1 基础结构

```
src/main/java/net/example/mymod/
├── Mymod.java                    ← Mod 主类（入口）
│
├── client/                       ← 客户端专用代码
│   └── MymodClient.java
│
├── init/                         ← 初始化相关
│   ├── Items.java               ← 物品注册
│   ├── Blocks.java              ← 方块注册
│   └── Entities.java            ← 实体注册
│
├── item/                         ← 物品相关
│   ├── MyItem.java             ← 自定义物品
│   └── use/                     ← 物品使用逻辑
│
├── block/                        ← 方块相关
│   ├── MyBlock.java            ← 自定义方块
│   └── entity/                  ← 方块实体
│
├── entity/                       ← 实体相关
│   ├── MyEntity.java           ← 自定义实体
│   └── ai/                      ← AI 行为
│
├── event/                        ← 事件处理
│   ├── ServerEvents.java       ← 服务端事件
│   └── ClientEvents.java        ← 客户端事件
│
├── command/                       ← 命令相关
│   └── MyCommand.java
│
├── network/                       ← 网络相关
│   └── MyPacket.java
│
└── util/                         ← 工具类
    └── MyUtil.java
```

### 2.2 每层目录的作用

| 目录 | 作用 | 示例 |
|------|------|------|
| `init/` | 存放注册代码 | 注册方块、物品、实体 |
| `item/` | 物品逻辑 | 自定义物品的行为 |
| `block/` | 方块逻辑 | 自定义方块的行为 |
| `entity/` | 实体逻辑 | 生物的行为 |
| `event/` | 事件处理 | 监听游戏事件 |
| `command/` | 命令 | `/mycommand` |
| `network/` | 网络通信 | 客户端服务端通信 |
| `util/` | 工具类 | 通用功能 |

---

## 3. Mod 主类

### 3.1 主类的职责

```
Mod 主类的职责：

├── 注册所有内容         → 方块、物品、实体、命令等
├── 不写具体逻辑         → 具体逻辑放在各个类中
└── 提供公共常量         → 供其他类使用
```

### 3.2 推荐的 Mod 主类

```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.init.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    // 公共常量：Mod ID
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始初始化 {}", MOD_ID);

        // 注册所有内容
        Items.register();          // 注册物品
        Blocks.register();         // 注册方块
        Entities.register();        // 注册实体
        Commands.register();        // 注册命令

        LOGGER.info("{} 初始化完成", MOD_ID);
    }
}
```

### 3.3 分层的好处

```
Mymod.java (主类)
│
├── 只负责组织
│
├── Items.register()  ───→  Items.java
│   │                      └── 具体注册物品
│
├── Blocks.register() ───→  Blocks.java
│   │                      └── 具体注册方块
│
├── Entities.register()──→  Entities.java
│                          └── 具体注册实体
```

---

## 4. 按功能分模块

### 4.1 模块化示例

**Items.java - 物品注册**

```java
package net.example.mymod.init;

import net.example.mymod.item.*;
import net.example.mymod.Mymod;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class Items {
    public static final MyItem MY_FIRST_ITEM = new MyItem();
    public static final MyFoodItem MY_FOOD = new MyFoodItem();

    public static void register() {
        registerItem("my_first_item", MY_FIRST_ITEM);
        registerItem("my_food", MY_FOOD);
        Mymod.LOGGER.info("物品注册完成");
    }

    private static void registerItem(String name, net.minecraft.item.Item item) {
        Registry.register(Registries.ITEM, Identifier.of(Mymod.MOD_ID, name), item);
    }
}
```

**MyItem.java - 具体物品类**

```java
package net.example.mymod.item;

import net.minecraft.item.Item;
import net.fabricmc.fabric.api.item.v1.FabricItemSettings;

public class MyItem extends Item {
    public MyItem() {
        super(new FabricItemSettings());
    }

    // 可以在这里添加自定义逻辑
    @Override
    public boolean hasGlint(net.minecraft.item.ItemStack stack) {
        return true;  // 物品有附魔光效
    }
}
```

### 4.2 客户端和服务端分离

```
├── Mymod.java                   ← 两边都运行
├── init/
│   └── ...
│
├── client/                      ← 只有客户端运行
│   └── MymodClient.java
│       └── 客户端初始化
│
└── server/                     ← 只有服务端运行
    └── MymodServer.java
        └── 服务端初始化
```

**客户端入口 (client/MymodClient.java)**

```java
package net.example.mymod.client;

import net.fabricmc.api.ClientModInitializer;
import net.example.mymod.Mymod;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;

public class MymodClient implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        Mymod.LOGGER.info("客户端初始化");

        // 注册客户端专用内容
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            // 每帧执行
        });
    }
}
```

**服务端入口 (server/MymodServer.java)**

```java
package net.example.mymod.server;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.Mymod;

public class MymodServer implements ModInitializer {
    @Override
    public void onInitializeServer() {
        Mymod.LOGGER.info("服务端初始化");

        // 注册服务端专用内容
    }
}
```

---

## 5. 实践示例

### 5.1 完整项目结构

```
src/main/java/net/example/mymod/
├── Mymod.java                   ← Mod 主类
├── init/
│   ├── Items.java
│   ├── Blocks.java
│   ├── Entities.java
│   └── Commands.java
├── item/
│   ├── MyMagicCrystal.java
│   └── MyFood.java
├── block/
│   ├── MyMagicBlock.java
│   └── entity/
│       └── MyBlockEntity.java
├── entity/
│   ├── MySlime.java
│   └── ai/
│       └── MySlimeAttackGoal.java
├── event/
│   ├── ServerEvents.java
│   └── PlayerEvents.java
├── command/
│   └── MyCommand.java
├── network/
│   ├── MyPacket.java
│   └── PacketHandler.java
└── util/
    └── MathUtil.java
```

### 5.2 注册方块

**Blocks.java**

```java
package net.example.mymod.init;

import net.example.mymod.block.*;
import net.example.mymod.Mymod;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class Blocks {
    public static final MyMagicBlock MAGIC_BLOCK = new MyMagicBlock();

    public static void register() {
        registerBlock("magic_block", MAGIC_BLOCK);
        Mymod.LOGGER.info("方块注册完成");
    }

    private static void registerBlock(String name, net.minecraft.block.Block block) {
        Registry.register(Registries.BLOCK, Identifier.of(Mymod.MOD_ID, name), block);

        // 同时注册对应的物品
        Registry.register(Registries.ITEM, Identifier.of(Mymod.MOD_ID, name),
            new BlockItem(block, new net.fabricmc.fabric.api.item.v1.FabricItemSettings()));
    }
}
```

### 5.3 注册实体

**Entities.java**

```java
package net.example.mymod.init;

import net.example.mymod.entity.*;
import net.example.mymod.Mymod;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class Entities {
    public static void register() {
        // 注册实体类型
        Registry.register(
            Registries.ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "magic_slime"),
            net.minecraft.entity.EntityType.Builder
                .create(MySlime::new, net.minecraft.entity.SpawnGroup.CREATURE)
                .dimensions(new net.minecraft.util.math.Box(0.8, 0.8, 0.8))
                .maxTrackDistance(10)
                .trackRangeBlocks(10)
                .build()
        );

        Mymod.LOGGER.info("实体注册完成");
    }
}
```

---

## 6. 命名规范

### 6.1 文件命名

| 内容 | 命名规则 | 示例 |
|------|----------|------|
| Java 文件 | PascalCase | `MyFirstMod.java` |
| 包名 | 全小写，用点分隔 | `net.example.mymod` |
| 注册类 | PascalCase | `Blocks.java`, `Items.java` |
| 具体类 | PascalCase | `MagicCrystalItem.java` |

### 6.2 代码命名

| 内容 | 命名规则 | 示例 |
|------|----------|------|
| 常量 | 全大写，下划线分隔 | `MAX_STACK_SIZE` |
| 静态字段 | PascalCase | `MAGIC_CRYSTAL` |
| 普通变量 | camelCase | `playerHealth` |
| 方法 | camelCase | `onPlayerJoin()` |
| 包目录 | 全小写 | `init/`, `item/` |

### 6.3 注释规范

```java
/**
 * 这是一个示例类
 *
 * @author 你的名字
 * @version 1.0.0
 */
public class Example {
    /** 单行注释可以用这种格式 */
    public static final int MAX_SIZE = 64;

    /**
     * 初始化这个类
     * @param value 初始值
     */
    public void init(int value) {
        // TODO: 待完成的功能
        // FIXME: 需要修复的问题
    }
}
```

---

## 下一步

现在你了解了如何组织代码结构！接下来：
- [事件系统入门](./03-event-system.md) - 学习如何使用事件
- [注册系统](./04-registry-system.md) - 了解如何注册游戏对象

---

*参考：[Fabric API 分析文档](../analysis/)* - 查看 API 的详细说明
