# Forge 模组开发入门

> 探索 Forge 模组开发框架的核心概念

---

## 目标

学完本章后，你将理解：
1. **什么是 Forge/NeoForge**
2. **Forge 与 Fabric 的区别**
3. **Forge 开发环境搭建**
4. **第一个 Forge 模组的基本结构**

---

## 什么是 Forge？

Forge（Forge Mod Loader）是 Minecraft 历史最悠久的模组加载框架，由 LexManos 创建并维护。

### Forge vs NeoForge

```
Forge 生态演进：

Forge 1.20.1
    ↓
    ├─ Legacy Forge（继续维护旧版本）
    ↓
NeoForge 1.20.1+（现代化重构，由原团队主导）
    ↓
NeoForge 1.21+（最新版本）
```

> **注意**：2023 年底，Forge 团队宣布将项目拆分为两个分支：
> - **Legacy Forge**：继续支持 1.20.1 及以下版本
> - **NeoForge**：全新架构，支持 1.20.1 及以上版本（新项目）

---

## Forge 的核心概念

### 1. 注册系统（Registry）

Forge 使用注册表系统来管理所有游戏内容：

```java
// 注册一个方块
@Mod.EventBusSubscriber(bus = Mod.EventBusSubscriber.Bus.MOD)
public class BlockRegistry {
    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, MOD_ID);

    public static final RegistryObject<Block> EXAMPLE_BLOCK = BLOCKS.register("example_block",
            () -> new Block(BlockBehaviour.Properties.copy(Blocks.STONE)));

    public static void register(IEventBus eventBus) {
        BLOCKS.register(eventBus);
    }
}
```

### 2. 事件系统（Event Bus）

Forge 使用事件驱动架构：

```java
@Mod.EventBusSubscriber(modid = MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD)
public class ModEvents {

    @SubscribeEvent
    public static void onBlockBreak(Block.BreakEvent event) {
        Player player = event.getPlayer();
        player.sendMessage(Component.literal("你挖掘了方块！"), player.getUUID());
    }
}
```

### 3. 配置系统（Configuration）

内置的配置管理：

```java
@Mod(MOD_ID)
public class ExampleMod {
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Mod.EventBusSubscriber(modid = MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD)
    public static class Config {
        @SubscribeEvent
        public static void load(RegistryEvent.Register<?> event) {
            LOGGER.info("模组正在加载...");
        }
    }
}
```

---

## Forge 项目结构

一个典型的 Forge 项目结构：

```
src/
├── main/
│   ├── java/
│   │   └── com/example/mod/
│   │       ├── ExampleMod.java          # 主类
│   │       ├── init/
│   │       │   ├── BlockInit.java       # 方块注册
│   │       │   ├── ItemInit.java        # 物品注册
│   │       │   └── EntityInit.java      # 实体注册
│   │       ├── util/
│   │       │   └── RegistryHelper.java  # 注册帮助类
│   │       └── client/
│   │           └── ClientSetup.java     # 客户端初始化
│   └── resources/
│       ├── META-INF/
│       │   └── mods.toml                # 模组清单
│       └── assets/
│           └── modid/
│               ├── lang/
│               │   └── zh_cn.json       # 中文翻译
│               ├── models/
│               │   ├── block/
│               │   └── item/
│               └── textures/
│                   ├── block/
│                   └── item/
└── test/                                 # 测试资源（可选）
```

---

## 模组清单（mods.toml）

Forge 使用 TOML 格式的清单文件：

```toml
modLoader="javafml"
loaderVersion="[49,)"
license="MIT"
issueTrackerURL=""

[[mods]]
modId="examplemod"
version="1.0.0"
displayName="示例模组"
authors="Your Name"
description='''
这是一个 Forge 模组示例
'''

[[dependencies.examplemod]]
modId="forge"
mandatory=true
versionRange="[50,)"
ordering="NONE"
side="BOTH"

[[dependencies.examplemod]]
modId="minecraft"
mandatory=true
versionRange="[1.21,)"
ordering="NONE"
side="BOTH"
```

---

## 小结

```
┌─────────────────────────────────────────────────────────────┐
│                    Forge 开发要点                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Forge/NeoForge 是 Minecraft 模组开发的主要框架           │
│                                                             │
│  2. NeoForge 是 Forge 的现代化分支，支持最新版本             │
│                                                             │
│  3. 核心系统：                                              │
│     ├── 注册表（Registry） - 管理所有游戏内容                 │
│     ├── 事件总线（Event Bus） - 响应游戏事件                 │
│     └── 配置系统 - 管理模组设置                              │
│                                                             │
│  4. 清单文件 mods.toml 定义模组元数据                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 关键要点

1. **Forge 是历史最久的模组框架** - 生态丰富，文档完善
2. **NeoForge 是未来方向** - 新项目建议使用 NeoForge
3. **事件驱动架构** - 理解事件系统是掌握 Forge 的关键
4. **注册系统** - DeferredRegister 是现代 Forge 的标准做法

---

## 下一步

- 下一章：[Forge 开发环境搭建](02-setup.html) - 配置 Gradle 和 IDE
- 学习 [注册表系统](../mc/1.21/tutorials/Part-1-Foundation/04-registry-system.html) - 深入理解 Forge 的注册机制

---

> 💡 **提示**：Forge 的事件系统非常强大，几乎所有游戏行为都可以通过事件拦截和修改。多阅读 Forge 源码中的事件类，了解有哪些事件可用。

---

*文档版本：NeoForge 1.21.x / Minecraft 1.21*
*最后更新：2026-03-23*
