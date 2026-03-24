# Part 7 - 命令系统（Command System）

欢迎来到 Minecraft 源码分析教程的第七部分！在这一部分，我们将深入学习 Minecraft 的命令系统。

## 📚 章节概览

| 章节 | 标题 | 主要内容 |
|------|------|----------|
| [第37章](./37-command-intro.md) | 命令系统入门 | 命令、命令源、命令上下文、解析流程 |
| [第38章](./38-brigadier-basics.md) | Brigadier 基础 | Brigadier 解析库、ArgumentBuilder、内置参数类型 |
| [第39章](./39-custom-command.md) | 自定义命令 | 创建命令、参数定义、权限检查、/hello 实战 |
| [第40章](./40-command-advanced.md) | 命令进阶 | 条件执行、子命令、重定向、转发 |

## 🎯 学习目标

完成本部分学习后，你将能够：

- ✅ 理解 Minecraft 命令系统的工作原理
- ✅ 掌握 Brigadier 命令解析库的核心概念
- ✅ 创建自己的自定义命令
- ✅ 实现带参数、权限检查的命令
- ✅ 理解条件执行和子命令系统

## 📖 章节介绍

### 第37章 命令系统入门

介绍命令系统的基本概念，包括：
- 命令是什么（玩家输入的指令）
- 命令源（CommandSource）—— 谁下的命令
- 命令上下文（CommandContext）—— 命令的所有信息
- 命令从输入到执行的完整流程

### 第38章 Brigadier 基础

深入了解 Brigadier 命令解析库：
- Brigadier 是什么（Mojang 的命令解析库）
- ArgumentBuilder 家族（字面量、参数）
- 内置参数类型（实体、坐标、数值等）
- 命令注册的基本方法

### 第39章 自定义命令

动手创建第一个自定义命令：
- 命令的基本结构
- 参数定义方法
- 权限检查机制
- 实战：创建完整的 /hello 命令

### 第40章 命令进阶

提升命令开发技能：
- 条件执行（if/unless）
- 子命令的创建方法
- 重定向（redirect）和转发（fork）
- execute 命令原理解析

## 🔧 核心概念图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Minecraft 命令系统架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   玩家输入                                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌─────────────────┐                                          │
│   │ CommandDispatcher │ ← 命令调度器（Brigadier）                  │
│   └────────┬────────┘                                          │
│            │                                                   │
│            ▼                                                   │
│   ┌─────────────────┐                                          │
│   │  Command Tree    │ ← 命令树                                 │
│   │                  │                                          │
│   │      give        │                                          │
│   │     /    \       │                                          │
│   │  targets   item   │                                          │
│   │     │       │     │                                          │
│   │    @p    diamond  │                                          │
│   └────────┬────────┘                                          │
│            │                                                   │
│            ▼                                                   │
│   ┌─────────────────┐                                          │
│   │ CommandContext  │ ← 命令上下文                              │
│   │                  │                                          │
│   │ - source        │                                          │
│   │ - arguments     │                                          │
│   │ - input         │                                          │
│   └────────┬────────┘                                          │
│            │                                                   │
│            ▼                                                   │
│   ┌─────────────────┐                                          │
│   │   Execute       │ ← 命令执行                                │
│   │                  │                                          │
│   │   返回结果       │                                          │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 相关源码

| 文件 | 路径 | 说明 |
|------|------|------|
| CommandSource.java | `net/minecraft/command/` | 命令源接口 |
| CommandDispatcher.java | `net/minecraft/command/` | 命令调度器 |
| CommandManager.java | `net/minecraft/server/command/` | 命令管理器 |
| ServerCommandSource.java | `net/minecraft/server/command/` | 服务端命令源 |
| GiveCommand.java | `net/minecraft/server/command/` | give 命令示例 |
| MeCommand.java | `net/minecraft/server/command/` | me 命令示例 |
| ExecuteCommand.java | `net/minecraft/server/command/` | execute 命令 |

## 🔗 扩展阅读

- [Brigadier GitHub 仓库](https://github.com/Mojang/brigadier) - 官方命令解析库
- [Minecraft Wiki - Commands](https://minecraft.fandom.com/wiki/Commands) - 官方命令文档
- [Minecraft 命令参考](https://minecraft.gamepedia.com/Commands) - 详细命令列表

## 📝 练习答案

### 第37章

**练习 1：追踪命令源信息**

```java
public class DebugCommand {
    public static int execute(CommandContext<ServerCommandSource> context) {
        ServerCommandSource source = context.getSource();
        
        System.out.println("执行者：" + source.getName());
        System.out.println("坐标：" + source.getPosition());
        System.out.println("世界：" + source.getWorld().getRegistryKey().getValue());
        System.out.println("权限等级：" + source.getLevel());
        
        return 1;
    }
}
```

**练习 2：检查权限等级**

```java
public class PermissionCheckCommand {
    public static int execute(CommandContext<ServerCommandSource> context) {
        ServerCommandSource source = context.getSource();
        
        if (source.hasPermissionLevel(2)) {
            source.sendFeedback(() -> Text.literal("你有权使用此命令"), false);
        } else {
            source.sendError(Text.literal("你没有权限"));
        }
        
        return 1;
    }
}
```

### 第38章

**练习 1：问候命令**

```java
public class GreetCommand {
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(
            CommandManager.literal("greet")
                .requires(source -> source.hasPermissionLevel(1))
                .then(
                    CommandManager.argument("target", EntityArgumentType.player())
                        .executes(context -> {
                            ServerPlayerEntity target = EntityArgumentType.getPlayer(context, "target");
                            target.sendMessage(Text.literal("Hello!"));
                            return 1;
                        })
                )
        );
    }
}
```

**练习 2：治疗命令**

```java
public class HealCommand {
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(
            CommandManager.literal("heal")
                .requires(source -> source.hasPermissionLevel(2))
                .then(
                    CommandManager.argument("target", EntityArgumentType.player())
                        .executes(context -> executeHeal(context, 4))
                        .then(
                            CommandManager.argument("amount", IntegerArgumentType.integer(1, 100))
                                .executes(context -> executeHeal(context, 
                                    IntegerArgumentType.getInteger(context, "amount")))
                        )
                )
        );
    }
    
    private static int executeHeal(CommandContext<ServerCommandSource> context, int amount) {
        ServerPlayerEntity player = EntityArgumentType.getPlayer(context, "target");
        player.heal(amount);
        return 1;
    }
}
```

## ▶️ 下一步

完成本部分学习后，你可以继续学习：

- [Part 8 - 资源系统](../Part-8-Resource/) - 了解资源包和数据中心

> **注意**：本文中的部分源码示例基于 CFR 反编译结果，实际源码可能略有差异。

---

*祝你学习愉快！*
