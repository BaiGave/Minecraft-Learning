# 1. 网络基础

> 本章介绍 Fabric 网络 API 的基本概念，帮助你理解客户端和服务端之间的通信机制。

---

## 目录

1. [什么是网络通信？](#1-什么是网络通信)
2. [网络阶段详解](#2-网络阶段详解)
3. [Fabric 网络 API 概述](#3-fabric-网络-api-概述)
4. [第一个网络示例](#4-第一个网络示例)
5. [事件系统](#5-事件系统)

---

## 1. 什么是网络通信？

### 1.1 客户端-服务端架构

Minecraft 是一款典型的**客户端-服务端**游戏：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Minecraft 网络架构                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐              网络通信              ┌─────────────┐
│   │   客户端     │  ←─────────────────────────────→  │   服务端     │
│   │  (Client)   │                                    │  (Server)   │
│   ├─────────────┤                                    ├─────────────┤
│   │ 渲染画面     │                                    │ 游戏逻辑     │
│   │ 处理输入     │                                    │ 世界管理     │
│   │ 播放声音     │                                    │ 实体生成     │
│   │ 本地存储     │                                    │ 玩家数据     │
│   └─────────────┘                                    └─────────────┘
│                                                                 │
│   当你按下按钮时：                                              │
│   1. 客户端捕获输入                                             │
│   2. 发送数据包到服务端                                         │
│   3. 服务端处理逻辑                                             │
│   4. 服务端广播结果给所有客户端                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 为什么需要自定义网络？

Minecraft 原版的网络系统只传输它需要的数据。但当你创建 Mod 时：

| 需求 | 为什么需要自定义网络 |
|------|---------------------|
| 同步自定义数据 | Mod 创建的新方块/物品需要同步状态 |
| 实现自定义功能 | 比如传送命令、特殊交互 |
| 客户端辅助逻辑 | 客户端需要知道服务端的一些信息 |
| 模组间通信 | 不同 Mod 之间传递数据 |

### 1.3 同步的方向

```
网络通信方向：

┌─────────────────────────────────────────────────────────────────┐
│                         C2S (Client to Server)                  │
│                         客户端 → 服务端                           │
│                                                                 │
│   用途：                                                         │
│   • 玩家操作（如：使用物品、点击按钮）                            │
│   • 客户端请求数据                                                │
│   • 客户端发送输入信息                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                         S2C (Server to Client)                  │
│                         服务端 → 客户端                           │
│                                                                 │
│   用途：                                                         │
│   • 服务端推送信息（如：玩家列表更新）                            │
│   • 同步世界数据                                                  │
│   • 显示提示信息                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 网络阶段详解

### 2.1 Minecraft 连接流程

当玩家连接到服务器时，会经历以下网络阶段：

```
┌─────────────────────────────────────────────────────────────────┐
│                     Minecraft 连接流程                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. [握手]  →  版本验证、Mod 列表交换                             │
│       ↓                                                          │
│  2. [登录]  →  登录验证、玩家数据初始化 (LOGIN)                    │
│       ↓                                                          │
│  3. [配置]  →  资源配置、注册表同步 (CONFIGURATION)                │
│       ↓                                                          │
│  4. [游戏]  →  正常游戏游玩 (PLAY)                                │
│       ↓                                                          │
│  5. [断开]  →  连接结束                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 网络阶段表格

| 阶段 | 英文 | 说明 | 使用的 API |
|------|------|------|-----------|
| 登录 | `LOGIN` | 玩家登录验证 | `ServerLoginNetworking` |
| 配置 | `CONFIGURATION` | 资源配置 | `ServerConfigurationNetworking` |
| 游戏 | `PLAY` | 正常游戏 | `ServerPlayNetworking` |

### 2.3 常用网络阶段

对于大多数 Mod 来说，只需要关注 **PLAY** 阶段：

```java
// PLAY 阶段的两个方向
ServerPlayNetworking  // 服务端处理来自客户端的数据
ClientPlayNetworking   // 客户端处理来自服务端的数据
```

---

## 3. Fabric 网络 API 概述

### 3.1 依赖模块

在 `build.gradle` 中添加依赖：

```groovy
dependencies {
    // Fabric API 网络模块
    modImplementation "net.fabricmc:fabric-networking-api-v1:${project.fabric_version}"
}
```

### 3.2 核心类和方法

```java
// 服务端网络 API
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;

// 客户端网络 API
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;

// 数据包注册
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
```

### 3.3 常用方法速查

| 操作 | 服务端代码 | 客户端代码 |
|------|-----------|-----------|
| 发送数据包 | `ServerPlayNetworking.send(player, packet)` | `ClientPlayNetworking.send(packet)` |
| 注册接收器 | `ServerPlayNetworking.registerGlobalReceiver(id, handler)` | `ClientPlayNetworking.registerGlobalReceiver(id, handler)` |
| 检查通道 | `ServerPlayNetworking.canSend(player, id)` | `ClientPlayNetworking.canSend(id)` |

---

## 4. 第一个网络示例

### 4.1 项目结构

```
src/
├── main/
│   ├── java/
│   │   └── com/example/mymod/
│   │       ├── MyMod.java           # 服务端入口
│   │       └── client/
│   │           └── MyModClient.java  # 客户端入口
│   └── resources/
│       └── fabric.mod.json
└── build.gradle
```

### 4.2 服务端初始化

```java
// MyMod.java
package com.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.minecraft.text.Text;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyMod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("MyMod 服务端初始化");

        // 监听玩家加入事件
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
            // 当玩家加入游戏时，向其发送欢迎消息
            sender.sendPacket(new ExampleS2CPacket("欢迎来到服务器！"));
        });
    }
}
```

### 4.3 客户端初始化

```java
// client/MyModClient.java
package com.example.mymod.client;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.minecraft.text.Text;

public class MyModClient implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        System.out.println("MyMod 客户端初始化");

        // 注册接收器 - 处理来自服务端的数据包
        ClientPlayNetworking.registerGlobalReceiver(
            ExampleS2CPacket.ID,
            (payload, context) -> {
                // 在屏幕上显示消息
                context.client().inGameHud.setOverlayMessage(
                    Text.literal(payload.message()),
                    false  // 不使用动画
                );
            }
        );
    }
}
```

---

## 5. 事件系统

### 5.1 服务端连接事件

`ServerPlayConnectionEvents` 提供了玩家连接的各个阶段的事件：

```java
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;

// 事件类型
ServerPlayConnectionEvents.INIT      // 玩家初始化网络处理器
ServerPlayConnectionEvents.JOIN      // 玩家加入游戏
ServerPlayConnectionEvents.DISCONNECT // 玩家断开连接
```

### 5.2 JOIN 事件示例

```java
ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
    // handler - 玩家的网络处理器
    // sender - 用于向客户端发送数据
    // server - 服务器实例

    String playerName = handler.getPlayer().getName().getString();
    server.getPlayerManager().broadcast(
        Text.literal(playerName + " 加入了游戏！"),
        false
    );
});
```

### 5.3 DISCONNECT 事件示例

```java
ServerPlayConnectionEvents.DISCONNECT.register((handler, server) -> {
    String playerName = handler.getPlayer().getName().getString();
    server.getPlayerManager().broadcast(
        Text.literal(playerName + " 离开了游戏！"),
        false
    );

    // 可以在这里清理玩家相关数据
});
```

### 5.4 客户端通道事件

`S2CPlayChannelEvents` 用于监听服务端注册的通道：

```java
import net.fabricmc.fabric.api.client.networking.v1.S2CPlayChannelEvents;

// 服务端注册通道时触发
S2CPlayChannelEvents.REGISTER.register((channels, client, handler) -> {
    // channels - 新注册的通道列表
});

// 服务端注销通道时触发
S2CPlayChannelEvents.UNREGISTER.register((channels, client, handler) -> {
    // channels - 被注销的通道列表
});
```

---

## 总结

本章学习了：

- Minecraft 的客户端-服务端网络架构
- 网络阶段的概念（LOGIN、CONFIGURATION、PLAY）
- Fabric 网络 API 的基本用法
- 服务端和客户端的初始化方式
- 连接事件的监听方法

---

## 下一步

现在你已经了解了网络基础，接下来学习：

- [自定义数据包](./02-custom-packets.md) - 创建自己的数据包类型
- [自定义命令](./03-commands.md) - 使用 Brigadier 创建命令

---

*参考：[Fabric 网络系统分析](../analysis/07-networking-system.md) - 深入了解网络系统的实现细节
