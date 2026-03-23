# 3. 自定义命令

> 本教程教你如何使用 Fabric 的 Brigadier 支持来创建游戏内命令。

---

## 目录

1. [命令系统概述](#1-命令系统概述)
2. [基础命令创建](#2-基础命令创建)
3. [命令参数](#3-命令参数)
4. [权限和条件](#4-权限和条件)
5. [完整示例](#5-完整示例)
6. [进阶技巧](#6-进阶技巧)

---

## 1. 命令系统概述

### 1.1 什么是 Brigadier？

Brigadier 是 Minecraft 使用的命令解析库，它提供了：
- 命令注册和管理
- 参数解析和验证
- 权限检查
- 命令提示和自动补全
- 命令重定向和别名

```
┌─────────────────────────────────────────────────────────────────┐
│                        命令系统架构                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  玩家输入 "/mycommand arg1 arg2"                                │
│         ↓                                                      │
│  Brigadier 解析命令                                             │
│         ↓                                                      │
│  验证参数 → 检查权限 → 执行回调                                  │
│         ↓                                                      │
│  返回结果给玩家                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Fabric 的命令 API

Fabric 通过 `fabric-command-api-v2` 提供 Brigadier 支持：

```groovy
// build.gradle
dependencies {
    modImplementation "net.fabricmc:fabric-command-api-v2:${project.fabric_version}"
}
```

### 1.3 核心类

```java
// 命令构建器
import net.minecraft.server.command.CommandManager;

// 命令源和上下文
import com.mojang.brigadier.Command;
import com.mojang.brigadier.context.CommandContext;
import net.minecraft.server.command.ServerCommandSource;

// 常用参数类型
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.command.argument.EntityArgumentType;
import net.minecraft.command.argument.NumberArgumentType;
import net.minecraft.command.argument.TextArgumentType;
```

---

## 2. 基础命令创建

### 2.1 最简单的命令

```java
package com.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.minecraft.server.command.CommandManager;
import net.minecraft.text.Text;

public class MyMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // 注册命令
        // CommandManager.literal() 创建一个字面量命令
        // .executes() 设置命令执行时的回调
        CommandManager.register(
            CommandManager.literal("helloworld")
                .executes(context -> {
                    // 获取命令执行者（玩家或控制台）
                    var source = context.getSource();

                    // 发送消息给执行者
                    source.sendFeedback(
                        () -> Text.literal("Hello, World!"),
                        false  // 是否广播给其他玩家
                    );

                    // 返回命令成功（1 = 成功）
                    return 1;
                })
        );
    }
}
```

### 2.2 命令结构详解

```java
CommandManager.register(
    CommandManager.literal("命令名")    // 1. 顶级命令（字面量）
        .then(                          // 2. 添加子命令
            CommandManager.literal("子命令")
                .then(                  // 3. 继续添加子命令
                    CommandManager.argument("参数名", 参数类型)
                )
        )
        .executes(context -> {          // 4. 执行逻辑
            return 1;
        })
);
```

### 2.3 注册到 Mod 初始化器

```java
// 方式 1: 直接在 onInitialize 中注册
@Override
public void onInitialize() {
    // 简单命令可以直接在这里注册
}

// 方式 2: 封装成方法（推荐）
@Override
public void onInitialize() {
    registerCommands();
}

private void registerCommands() {
    CommandManager.register(
        CommandManager.literal("mymod")
            .executes(context -> {
                // 执行逻辑
                return 1;
            })
    );
}

// 方式 3: 单独的 CommandRegistry 类（更好）
// 创建专门的命令类来管理所有命令
```

---

## 3. 命令参数

### 3.1 字符串参数

```java
// 使用 .then() 添加带参数的子命令
CommandManager.literal("greet")
    .then(
        CommandManager.argument("name", TextArgumentType.text())
            .executes(context -> {
                // 获取参数值
                String name = TextArgumentType.getText(context, "name");

                context.getSource().sendFeedback(
                    () -> Text.literal("你好, " + name + "!"),
                    false
                );

                return 1;
            })
    )
```

### 3.2 数字参数

```java
// 整数参数
CommandManager.argument("count", IntegerArgumentType.integer())
    .executes(context -> {
        int count = IntegerArgumentType.getInteger(context, "count");
        // 处理逻辑
        return count;
    });

// 浮点数参数
CommandManager.argument("speed", FloatArgumentType.floatArg())
    .executes(context -> {
        float speed = FloatArgumentType.getFloat(context, "speed");
        return 1;
    });
```

### 3.3 玩家/实体参数

```java
import net.minecraft.command.argument.EntityArgumentType;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;

// 单个玩家参数
CommandManager.argument("player", EntityArgumentType.player())
    .executes(context -> {
        ServerPlayerEntity player = EntityArgumentType.getPlayer(context, "player");

        context.getSource().sendFeedback(
            () -> Text.literal("选中的玩家: " + player.getName().getString()),
            false
        );

        return 1;
    });

// 多个玩家（可选）
CommandManager.argument("targets", EntityArgumentType.players())
    .executes(context -> {
        Collection<ServerPlayerEntity> players = 
            EntityArgumentType.getPlayers(context, "targets");

        for (ServerPlayerEntity p : players) {
            // 处理每个玩家
        }
        return players.size();
    });
```

### 3.4 枚举/选项参数

```java
// 使用 literal 作为选项
CommandManager.literal("mode")
    .then(
        CommandManager.literal("creative")
            .executes(context -> {
                // 设置为创造模式
                return 1;
            })
    )
    .then(
        CommandManager.literal("survival")
            .executes(context -> {
                // 设置为生存模式
                return 1;
            })
    )
    .then(
        CommandManager.literal("adventure")
            .executes(context -> {
                // 设置为冒险模式
                return 1;
            })
    )
```

### 3.5 布尔参数

```java
CommandManager.literal("toggle")
    .then(
        CommandManager.literal("true")
            .executes(context -> {
                // 开启
                return 1;
            })
    )
    .then(
        CommandManager.literal("false")
            .executes(context -> {
                // 关闭
                return 1;
            })
    )
```

---

## 4. 权限和条件

### 4.1 权限等级

```java
// requiresSource() - 检查命令源是否有权限
CommandManager.literal("adminonly")
    .requires(source -> source.hasPermissionLevel(4))  // 需要管理员级别
    .executes(context -> {
        // 只有 OP 才能执行
        return 1;
    });

// 权限等级说明：
// 0  - 所有玩家
// 1  - 管理员（允许作弊）
// 2  - 管理员
// 3  - 管理员
// 4  - 服务器控制台级别
```

### 4.2 玩家检查

```java
// 检查是否是玩家（而不是控制台）
CommandManager.literal("playeronly")
    .requires(source -> source.getEntity() instanceof ServerPlayerEntity)
    .executes(context -> {
        // 只有玩家可以执行
        return 1;
    });

// 检查是否有特定权限（通过权限节点）
CommandManager.literal("mycommand")
    .requires(source -> source.hasPermission("mymod.permission"))
    .executes(context -> {
        return 1;
    });
```

### 4.3 反馈消息

```java
// 成功消息
source.sendFeedback(() -> Text.literal("操作成功!"), false);

// 失败消息
source.sendError(Text.literal("操作失败: 原因"));

// 广播消息给所有人
source.sendFeedback(() -> Text.literal("全局公告"), true);
```

---

## 5. 完整示例

### 5.1 项目结构

```
src/main/java/com/example/mymod/
├── MyMod.java                # 服务端入口
└── command/
    └── ModCommands.java      # 命令注册
```

### 5.2 命令注册类

```java
package com.example.mymod.command;

import com.mojang.brigadier.Command;
import com.mojang.brigadier.context.CommandContext;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.command.argument.EntityArgumentType;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import com.example.mymod.network.MyPacket;
import com.example.mymod.MyMod;

import java.util.Collection;

/**
 * Mod 命令注册类
 * 
 * 命令列表:
 * - /mymod - 主命令，显示帮助
 * - /mymod info [玩家] - 显示玩家信息
 * - /mymod heal <玩家> - 治疗玩家
 * - /mymod healall - 治疗所有玩家
 * - /mymod tphere <玩家> - 传送玩家到自己这里
 * - /mymod sendpacket <消息> - 测试网络数据包
 */
public class ModCommands {

    // ===== 1. 主命令入口 =====
    public static void register() {
        MyMod.LOGGER.info("开始注册命令...");

        CommandManager.register(
            CommandManager.literal("mymod")
                // 显示帮助信息
                .executes(context -> {
                    sendHelp(context);
                    return 1;
                })

                // 子命令: info
                .then(
                    CommandManager.literal("info")
                        .requires(source -> source.hasPermissionLevel(0))  // 所有人可用
                        .executes(context -> {
                            // 显示服务器信息
                            context.getSource().sendFeedback(() -> Text.literal(
                                "§6=== MyMod 信息 ===\n" +
                                "§a版本: 1.0.0\n" +
                                "§b作者: ExampleDev\n" +
                                "§e命令数量: 4"
                            ), false);
                            return 1;
                        })
                        .then(
                            // /mymod info <玩家>
                            CommandManager.argument("player", EntityArgumentType.player())
                                .requires(source -> source.hasPermissionLevel(0))
                                .executes(context -> {
                                    ServerPlayerEntity target = 
                                        EntityArgumentType.getPlayer(context, "player");
                                    
                                    context.getSource().sendFeedback(() -> Text.literal(
                                        "§6玩家信息: §e" + target.getName().getString() + "\n" +
                                        "§a生命值: §e" + target.getHealth() + "/" + target.getMaxHealth() + "\n" +
                                        "§b饱食度: §e" + target.getHungerManager().getFoodLevel() + "\n" +
                                        "§c坐标: §e" + 
                                        (int)target.getX() + ", " + 
                                        (int)target.getY() + ", " + 
                                        (int)target.getZ()
                                    ), false);
                                    return 1;
                                })
                        )
                )

                // 子命令: heal
                .then(
                    CommandManager.literal("heal")
                        .requires(source -> source.hasPermissionLevel(2))  // 需要管理员
                        .then(
                            // /mymod heal <玩家>
                            CommandManager.argument("target", EntityArgumentType.player())
                                .executes(context -> {
                                    ServerPlayerEntity target = 
                                        EntityArgumentType.getPlayer(context, "target");
                                    
                                    // 恢复生命值
                                    target.setHealth(target.getMaxHealth());
                                    // 恢复饱食度
                                    target.getHungerManager().setFoodLevel(20);

                                    context.getSource().sendFeedback(() -> Text.literal(
                                        "§a已治疗玩家 §e" + target.getName().getString()
                                    ), true);

                                    return 1;
                                })
                        )
                        .then(
                            // /mymod healall
                            CommandManager.literal("all")
                                .executes(context -> {
                                    Collection<ServerPlayerEntity> players = 
                                        context.getSource().getWorld().getPlayers();

                                    int count = 0;
                                    for (ServerPlayerEntity player : players) {
                                        player.setHealth(player.getMaxHealth());
                                        player.getHungerManager().setFoodLevel(20);
                                        count++;
                                    }

                                    context.getSource().sendFeedback(() -> Text.literal(
                                        "§a已治疗 §e" + count + " §a名玩家"
                                    ), true);

                                    return count;
                                })
                        )
                )

                // 子命令: tphere
                .then(
                    CommandManager.literal("tphere")
                        .requires(source -> source.hasPermissionLevel(2))
                        .then(
                            CommandManager.argument("target", EntityArgumentType.player())
                                .executes(context -> {
                                    ServerCommandSource source = context.getSource();
                                    ServerPlayerEntity executor = source.getPlayer();
                                    ServerPlayerEntity target = 
                                        EntityArgumentType.getPlayer(context, "target");

                                    if (executor == null) {
                                        source.sendError(Text.literal("§c只有玩家才能使用此命令"));
                                        return 0;
                                    }

                                    // 传送目标到执行者位置
                                    target.teleport(
                                        executor.getWorld(),
                                        executor.getX(), executor.getY(), executor.getZ(),
                                        executor.getYaw(), executor.getPitch()
                                    );

                                    source.sendFeedback(() -> Text.literal(
                                        "§a已将 §e" + target.getName().getString() + 
                                        " §a传送到你身边"
                                    ), true);

                                    target.sendMessage(Text.literal(
                                        "§b你被传送到 §e" + executor.getName().getString() + " §b身边"
                                    ));

                                    return 1;
                                })
                        )
                )

                // 子命令: sendpacket（测试网络功能）
                .then(
                    CommandManager.literal("sendpacket")
                        .requires(source -> source.hasPermissionLevel(2))
                        .then(
                            CommandManager.argument("message", 
                                net.minecraft.command.argument.TextArgumentType.text())
                                .executes(context -> {
                                    ServerCommandSource source = context.getSource();
                                    String message = 
                                        net.minecraft.command.argument.TextArgumentType
                                            .getTextArgument(context, "message");

                                    // 向所有玩家发送测试数据包
                                    Collection<ServerPlayerEntity> players = 
                                        source.getServer().getPlayerManager().getPlayerList();

                                    for (ServerPlayerEntity player : players) {
                                        if (ServerPlayNetworking.canSend(player, MyPacket.ID)) {
                                            ServerPlayNetworking.send(player, 
                                                new MyPacket("来自命令: " + message, 0, false));
                                        }
                                    }

                                    source.sendFeedback(() -> Text.literal(
                                        "§a已向 §e" + players.size() + " §a名玩家发送数据包"
                                    ), true);

                                    return players.size();
                                })
                        )
                )
        );

        MyMod.LOGGER.info("命令注册完成!");
    }

    // ===== 辅助方法：显示帮助 =====
    private static void sendHelp(CommandContext<ServerCommandSource> context) {
        context.getSource().sendFeedback(() -> Text.literal(
            "§6=== MyMod 命令帮助 ===\n" +
            "§e/mymod §7- 显示帮助信息\n" +
            "§e/mymod info §7- 查看服务器信息\n" +
            "§e/mymod info <玩家> §7- 查看玩家信息\n" +
            "§e/mymod heal <玩家> §7- 治疗指定玩家\n" +
            "§e/mymod heal all §7- 治疗所有玩家\n" +
            "§e/mymod tphere <玩家> §7- 传送玩家到你身边\n" +
            "§e/mymod sendpacket <消息> §7- 发送测试数据包"
        ), false);
    }
}
```

### 5.3 Mod 入口类

```java
package com.example.mymod;

import net.fabricmc.api.ModInitializer;
import com.example.mymod.command.ModCommands;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyMod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("MyMod 初始化开始");

        // 注册命令
        ModCommands.register();

        // 其他初始化...
        // 注册数据包（见上一章）

        LOGGER.info("MyMod 初始化完成");
    }
}
```

---

## 6. 进阶技巧

### 6.1 命令重定向

允许使用别名或简化命令：

```java
// /god 作为 /mymod god 的别名
CommandManager.register(
    CommandManager.literal("god")
        .redirect(
            CommandManager.literal("mymod")
                .literal("god")
        )
);
```

### 6.2 自动补全建议

为参数提供补全列表：

```java
import net.minecraft.command.argument.SuggestionProvider;

// 在注册参数时添加 suggest
.then(
    CommandManager.argument("mode", TextArgumentType.text())
        .suggests((context, builder) -> {
            // 提供建议列表
            return new SuggestionsBuilder(builder, "creative").build();
        })
        .suggests((context, builder) -> {
            // 动态建议
            if (builder.getRemaining().isEmpty()) {
                return SuggestionProviders.suggest(
                    List.of("creative", "survival", "adventure"),
                    builder
                );
            }
            return builder.build();
        })
        .executes(context -> { /* ... */ })
)
```

### 6.3 自定义 SuggestionProvider

```java
import net.minecraft.util.registry.Registry;

// 提供在线玩家的建议
CommandManager.argument("player", EntityArgumentType.player())
    .suggests(SuggestionProviders.suggestPlayers())
    .executes(context -> { /* ... */ });
```

### 6.4 命令返回值的含义

```java
// 返回值说明
// 0      - 命令失败
// 1      - 命令成功
// > 1    - 表示影响的数量（如广播给多少人）

// 可以返回浮点数表示成功程度
// Brigadier 会将返回值累加，用于统计
return Command.SINGLE_SUCCESS;  // 等同于返回 1
```

### 6.5 创建子命令组

使用 `ArgumentBuilder` 构建复杂命令：

```java
// 创建可重用的命令构建器
private static LiteralArgumentBuilder<ServerCommandSource> createBaseCommand(String name) {
    return CommandManager.literal(name)
        .requires(source -> source.hasPermissionLevel(2));
}

// 使用
register(
    createBaseCommand("heal")
        .then(createBaseCommand("player")
            .then(CommandManager.argument("target", EntityArgumentType.player())
                .executes(...)))
);
```

### 6.6 调试命令

```java
// 打印调试信息
CommandManager.literal("debug")
    .executes(context -> {
        ServerCommandSource source = context.getSource();
        
        // 输出命令源信息
        MyMod.LOGGER.info("命令源类型: {}", source.getSource());
        MyMod.LOGGER.info("执行者: {}", source.getEntity());
        MyMod.LOGGER.info("权限等级: {}", source.getPermissionLevel());
        
        source.sendFeedback(() -> Text.literal("调试信息已输出到日志"), false);
        return 1;
    });
```

### 6.7 使用 Fabric Command API 工具类

```java
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;

// 使用回调注册（更推荐的方式）
CommandRegistrationCallback.EVENT.register((dispatcher, registry, environment) -> {
    dispatcher.register(
        CommandManager.literal("mymod")
            .executes(context -> { /* ... */ })
    );
});
```

---

## 总结

本章学习了：

- Brigadier 命令系统的基础概念
- 如何创建简单的命令
- 各种参数类型的用法
- 权限和条件的设置
- 完整的命令示例实现
- 自动补全和调试技巧

---

## 下一步

你现在已经掌握了：
- ✅ 网络基础和数据包概念
- ✅ 自定义数据包的创建和使用
- ✅ 使用 Brigadier 创建命令

继续学习更多 Fabric 开发知识，或者尝试创建自己的 Mod 项目！

---

*参考：*
- *[Fabric 网络系统分析](../analysis/07-networking-system.md)*
- *[Minecraft Wiki: Commands](https://minecraft.wiki/w/Commands)*
- *[Brigadier 文档](https://github.com/Mojang/brigadier)*