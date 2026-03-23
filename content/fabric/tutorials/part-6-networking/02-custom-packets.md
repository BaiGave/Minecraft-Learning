# 2. 自定义数据包

> 本教程教你如何在 Fabric 中创建和使用自定义数据包，实现客户端与服务端之间的双向通信。

---

## 目录

1. [数据包基础](#1-数据包基础)
2. [定义数据包](#2-定义数据包)
3. [服务端注册与发送](#3-服务端注册与发送)
4. [客户端接收处理](#4-客户端接收处理)
5. [完整示例：双向通信](#5-完整示例双向通信)
6. [进阶技巧](#6-进阶技巧)

---

## 1. 数据包基础

### 1.1 什么是数据包？

数据包（Packet）是网络中传输的基本数据单元。在 Minecraft 中：

```
数据包 = 通道标识(ID) + 序列化数据(Codec)
```

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据包结构                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   数据包 = 通道ID + 数据内容                                     │
│                                                                 │
│   ┌──────────┐  ┌────────────────────────────────────────────┐  │
│   │  Channel │  │              Payload                       │  │
│   │   ID     │  │  (通过 Codec 序列化和反序列化)              │  │
│   └──────────┘  └────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 通道标识

通道标识用于区分不同类型的数据包，使用 `Identifier`：

```java
Identifier myChannel = Identifier.of("mymod", "my_packet");
// 结果: "mymod:my_packet"
```

### 1.3 数据包类型方向

|| 缩写 | 含义 | 说明 |
||------|------|------|
|| C2S | Client to Server | 客户端发送给服务端 |
|| S2C | Server to Client | 服务端发送给客户端 |

---

## 2. 定义数据包

### 2.1 数据包结构

使用 Java record（记录类）来定义数据包，它是不可变的：

```java
// 简单数据包示例
public record ExamplePacket(String message) implements CustomPayload {
    // 通道ID - 必须唯一
    public static final CustomPayload.Id<ExamplePacket> ID =
        new Id<>(Identifier.of("mymod", "example"));

    // 编解码器 - 负责序列化和反序列化
    public static final PacketCodec<RegistryByteBuf, ExamplePacket> CODEC =
        CustomPayload.codecOf(ExamplePacket::write, ExamplePacket::new);
}
```

### 2.2 完整数据包定义

```java
package com.example.mymod.network;

import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.packet.CustomPayload;
import net.minecraft.util.Identifier;

// 使用 record 定义数据包（Java 16+）
public record MyPacket(String message, int number, boolean flag) implements CustomPayload {

    // ===== 第一部分：定义通道 ID =====
    // 必须是一个唯一的标识符，格式为 "modid:channel_name"
    public static final CustomPayload.Id<MyPacket> ID =
        new Id<>(Identifier.of("mymod", "my_packet"));

    // ===== 第二部分：定义编解码器 =====
    // 编解码器负责将数据写入网络缓冲区，或从缓冲区读取数据
    public static final PacketCodec<RegistryByteBuf, MyPacket> CODEC =
        // codecOf 方法接受两个参数：
        // - write: 将数据包写入 ByteBuf
        // - new: 从 ByteBuf 读取数据创建数据包
        CustomPayload.codecOf(MyPacket::write, MyPacket::new);

    // ===== 第三部分：构造方法（从缓冲区读取） =====
    // 从缓冲区读取数据时调用
    public MyPacket(RegistryByteBuf buf) {
        this(
            buf.readString(),     // 读取字符串
            buf.readInt(),        // 读取整数
            buf.readBoolean()    // 读取布尔值
        );
    }

    // ===== 第四部分：写入方法（序列化到缓冲区） =====
    // 将数据包数据写入缓冲区
    public void write(RegistryByteBuf buf) {
        buf.writeString(this.message);  // 写入字符串
        buf.writeInt(this.number);       // 写入整数
        buf.writeBoolean(this.flag);    // 写入布尔值
    }

    // ===== 第五部分：获取 ID =====
    // 实现 CustomPayload 接口必需
    @Override
    public Id<? extends CustomPayload> getId() {
        return ID;
    }
}
```

### 2.3 使用 Text 类型

如果需要传输带有样式的文本，使用 `Text`：

```java
package com.example.mymod.network;

import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.packet.CustomPayload;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

public record TextPacket(Text message) implements CustomPayload {

    public static final CustomPayload.Id<TextPacket> ID =
        new Id<>(Identifier.of("mymod", "text_packet"));

    // 使用 TextCodecs.REGISTRY_PACKED_CODEC 处理 Text 类型
    public static final PacketCodec<RegistryByteBuf, TextPacket> CODEC =
        CustomPayload.codecOf(TextPacket::write, TextPacket::new);

    public TextPacket(RegistryByteBuf buf) {
        this(TextCodecs.REGISTRY_PACKED_CODEC.decode(buf));
    }

    public void write(RegistryByteBuf buf) {
        TextCodecs.REGISTRY_PACKED_CODEC.encode(buf, this.message);
    }

    @Override
    public Id<? extends CustomPayload> getId() {
        return ID;
    }
}
```

---

## 3. 服务端注册与发送

### 3.1 注册数据包类型

在 Mod 初始化时注册数据包：

```java
package com.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import com.example.mymod.network.MyPacket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyMod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("MyMod 初始化");

        // 注册 S2C 数据包（服务端 -> 客户端）
        PayloadTypeRegistry.playS2C().register(
            MyPacket.ID,
            MyPacket.CODEC
        );

        // 注册 C2S 数据包（客户端 -> 服务端）
        // 只需要在客户端处理的可以不注册到服务端
        PayloadTypeRegistry.playC2S().register(
            MyPacket.ID,
            MyPacket.CODEC
        );

        LOGGER.info("数据包注册完成");
    }
}
```

### 3.2 注册接收器处理 C2S 数据包

处理客户端发送过来的数据包：

```java
// 继续在 MyMod.java 中
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.server.network.ServerPlayerEntity;

@Override
public void onInitialize() {
    // ... 前面注册代码 ...

    // 注册全局接收器 - 接收来自所有客户端的 C2S 数据包
    ServerPlayNetworking.registerGlobalReceiver(MyPacket.ID, (payload, context) -> {
        // payload - 收到的数据包
        // context - 包含服务器、玩家等信息

        // 获取发送数据的玩家
        ServerPlayerEntity player = context.player();

        LOGGER.info("收到来自 {} 的数据包: {}", 
            player.getName().getString(),
            payload.message()
        );

        // 处理逻辑...
        // 可以在这里发送响应包给客户端
    });
}
```

### 3.3 向客户端发送 S2C 数据包

```java
// 方式 1: 向单个玩家发送
ServerPlayNetworking.send(player, new MyPacket("Hello!", 42, true));

// 方式 2: 向所有玩家广播
for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
    ServerPlayNetworking.send(player, new MyPacket("Broadcast!", 0, false));
}

// 方式 3: 在玩家加入事件中发送
ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
    sender.sendPacket(new MyPacket("欢迎！", 1, true));
});

// 方式 4: 检查是否可以发送后再发送
if (ServerPlayNetworking.canSend(player, MyPacket.ID)) {
    ServerPlayNetworking.send(player, new MyPacket("Supported!", 0, false));
}
```

### 3.4 服务端完整示例

```java
package com.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.example.mymod.network.MyPacket;

public class MyMod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("=== MyMod 初始化开始 ===");

        // 步骤 1: 注册数据包类型（服务端需要知道如何编解码）
        PayloadTypeRegistry.playS2C().register(MyPacket.ID, MyPacket.CODEC);
        PayloadTypeRegistry.playC2S().register(MyPacket.ID, MyPacket.CODEC);
        LOGGER.info("数据包类型已注册");

        // 步骤 2: 注册接收器处理来自客户端的数据包
        ServerPlayNetworking.registerGlobalReceiver(MyPacket.ID, (payload, context) -> {
            // 获取玩家
            ServerPlayerEntity player = context.player();

            // 打印日志
            LOGGER.info("收到玩家 {} 的数据包 - 消息: {}, 数字: {}, 布尔: {}",
                player.getName().getString(),
                payload.message(),
                payload.number(),
                payload.flag()
            );

            // 创建响应消息
            String responseMsg = String.format(
                "服务器收到: %s (数字: %d)",
                payload.message(),
                payload.number()
            );

            // 向该玩家发送响应
            ServerPlayNetworking.send(player, new MyPacket(responseMsg, payload.number() * 2, !payload.flag()));
        });
        LOGGER.info("接收器已注册");

        // 步骤 3: 监听玩家加入事件，发送欢迎消息
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
            String playerName = handler.getPlayer().getName().getString();
            sender.sendPacket(new MyPacket("欢迎 " + playerName + "!", 0, true));

            server.getPlayerManager().broadcast(
                Text.literal(playerName + " 加入了游戏"),
                false
            );
        });
        LOGGER.info("玩家加入事件已注册");

        LOGGER.info("=== MyMod 初始化完成 ===");
    }
}
```

---

## 4. 客户端接收处理

### 4.1 客户端初始化

创建客户端入口类：

```java
package com.example.mymod.client;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import com.example.mymod.network.MyPacket;
import net.minecraft.client.MinecraftClient;

public class MyModClient implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        System.out.println("MyMod 客户端初始化");

        // 注册接收器 - 处理来自服务端的 S2C 数据包
        ClientPlayNetworking.registerGlobalReceiver(MyPacket.ID, (payload, context) -> {
            // 获取 Minecraft 客户端实例
            MinecraftClient client = context.client();

            // 在屏幕上显示消息（覆盖层）
            client.inGameHud.setOverlayMessage(
                Text.literal(payload.message()),
                false  // 不显示动画
            );

            System.out.println("收到服务端数据包: " + payload.message());
        });
    }
}
```

### 4.2 向服务端发送 C2S 数据包

```java
package com.example.mymod.client;

import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import com.example.mymod.network.MyPacket;
import net.minecraft.client.network.ClientPlayConnectionHandler;

public class ClientNetworkHelper {

    // 发送数据包到服务端
    public static void sendToServer(String message, int number, boolean flag) {
        // 检查是否可以在当前状态发送
        if (ClientPlayNetworking.canSend(MyPacket.ID)) {
            ClientPlayNetworking.send(new MyPacket(message, number, flag));
        }
    }

    // 简化版本
    public static void sendToServer(String message) {
        sendToServer(message, 0, false);
    }
}
```

### 4.3 在游戏事件中使用

常见的发送时机：

```java
// 在客户端初始化中注册各种事件
@Override
public void onInitializeClient() {
    // 方法 1: 注册按键绑定后发送
    // （需要先注册按键绑定，见后续教程）

    // 方法 2: 监听物品使用
    // 使用 ClientPlayConnectionEvents 或其他事件

    // 方法 3: 定时发送（示例：每秒发送一次）
    // 在客户端的 tick 事件中处理

    // 方法 4: 按钮点击（如按钮组件）
    // 在 Screen 类中调用
}
```

### 4.4 客户端完整示例

```java
package com.example.mymod.client;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;
import com.example.mymod.network.MyPacket;

public class MyModClient implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        System.out.println("=== MyMod 客户端初始化开始 ===");

        // 步骤 1: 注册接收器 - 接收服务端发来的数据包
        ClientPlayNetworking.registerGlobalReceiver(MyPacket.ID, (payload, context) -> {
            MinecraftClient client = context.client();

            // 在屏幕中央显示消息
            client.inGameHud.setOverlayMessage(
                Text.literal("§a[MyMod]§r " + payload.message()),
                false
            );

            // 在控制台打印
            System.out.println("收到服务端消息: " + payload.message());
            System.out.println("  数字: " + payload.number());
            System.out.println("  布尔: " + payload.flag());
        });
        System.out.println("接收器已注册");

        // 步骤 2: 监听连接事件
        ClientPlayConnectionEvents.INIT.register((handler, client) -> {
            System.out.println("网络处理器已初始化");
        });

        ClientPlayConnectionEvents.JOIN.register((handler, sender, client) -> {
            System.out.println("已连接到服务器");

            // 连接成功后可以发送测试数据包
            ClientPlayNetworking.send(new MyPacket("Hello Server!", 123, true));
        });

        ClientPlayConnectionEvents.DISCONNECT.register((handler, client) -> {
            System.out.println("已断开连接");
        });

        System.out.println("=== MyMod 客户端初始化完成 ===");
    }
}
```

---

## 5. 完整示例：双向通信

### 5.1 项目结构

```
src/
├── main/
│   ├── java/
│   │   └── com/example/mymod/
│   │       ├── MyMod.java                # 服务端入口
│   │       ├── network/
│   │       │   └── ExamplePacket.java    # 数据包定义
│   │       └── client/
│   │           └── MyModClient.java      # 客户端入口
│   └── resources/
│       └── fabric.mod.json
└── build.gradle
```

### 5.2 数据包定义 (ExamplePacket.java)

```java
package com.example.mymod.network;

import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.packet.CustomPayload;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

/**
 * 示例数据包 - 用于展示完整的双向通信
 * 
 * 包含：
 * - text: 文本消息
 * - value: 数值
 * - isImportant: 是否重要标记
 */
public record ExamplePacket(Text text, int value, boolean isImportant) implements CustomPayload {

    // ===== 1. 定义通道 ID =====
    public static final CustomPayload.Id<ExamplePacket> ID =
        new Id<>(Identifier.of("mymod", "example_packet"));

    // ===== 2. 定义编解码器 =====
    public static final PacketCodec<RegistryByteBuf, ExamplePacket> CODEC =
        CustomPayload.codecOf(ExamplePacket::write, ExamplePacket::new);

    // ===== 3. 构造函数（从缓冲区读取） =====
    public ExamplePacket(RegistryByteBuf buf) {
        this(
            TextCodecs.REGISTRY_PACKED_CODEC.decode(buf),  // 读取 Text
            buf.readVarInt(),                               // 读取变长整数
            buf.readBoolean()                              // 读取布尔值
        );
    }

    // ===== 4. 写入方法（序列化到缓冲区） =====
    public void write(RegistryByteBuf buf) {
        TextCodecs.REGISTRY_PACKED_CODEC.encode(buf, this.text);  // 写入 Text
        buf.writeVarInt(this.value);                               // 写入变长整数
        buf.writeBoolean(this.isImportant);                        // 写入布尔值
    }

    // ===== 5. 获取 ID =====
    @Override
    public Id<? extends CustomPayload> getId() {
        return ID;
    }

    // ===== 便捷方法 =====
    public static ExamplePacket create(String message, int value) {
        return new ExamplePacket(Text.literal(message), value, false);
    }

    public static ExamplePacket createImportant(String message, int value) {
        return new ExamplePacket(Text.literal(message), value, true);
    }
}
```

### 5.3 服务端入口 (MyMod.java)

```java
package com.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import com.example.mymod.network.ExamplePacket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyMod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("MyMod 服务端初始化");

        // 1. 注册数据包类型（S2C 和 C2S）
        PayloadTypeRegistry.playS2C().register(ExamplePacket.ID, ExamplePacket.CODEC);
        PayloadTypeRegistry.playC2S().register(ExamplePacket.ID, ExamplePacket.CODEC);
        LOGGER.info("数据包类型已注册: {}", ExamplePacket.ID);

        // 2. 处理来自客户端的数据包
        ServerPlayNetworking.registerGlobalReceiver(ExamplePacket.ID, (payload, context) -> {
            ServerPlayerEntity player = context.player();
            
            LOGGER.info("收到玩家 {} 的数据包", player.getName().getString());
            LOGGER.info("  消息: {}", payload.text().getString());
            LOGGER.info("  数值: {}", payload.value());
            LOGGER.info("  重要: {}", payload.isImportant());

            // 处理并发送响应
            if (payload.isImportant()) {
                // 如果标记为重要，广播给所有人
                context.server().getPlayerManager().broadcast(
                    Text.literal("重要: " + payload.text().getString()),
                    false
                );
            } else {
                // 否则只回复发送者
                String response = String.format("服务器收到: %s (数值: %d)",
                    payload.text().getString(), payload.value());
                
                ServerPlayNetworking.send(player, 
                    ExamplePacket.create(response, payload.value() + 100));
            }
        });

        // 3. 玩家加入时发送欢迎消息
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
            String name = handler.getPlayer().getName().getString();
            
            sender.sendPacket(ExamplePacket.createImportant(
                "欢迎 " + name + " 来到服务器！", 0));
            
            LOGGER.info("玩家 {} 已加入", name);
        });

        // 4. 玩家离开时处理
        ServerPlayConnectionEvents.DISCONNECT.register((handler, server) -> {
            String name = handler.getPlayer().getName().getString();
            LOGGER.info("玩家 {} 已离开", name);
        });

        LOGGER.info("MyMod 初始化完成");
    }
}
```

### 5.4 客户端入口 (MyModClient.java)

```java
package com.example.mymod.client;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;
import com.example.mymod.network.ExamplePacket;

public class MyModClient implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        System.out.println("=== MyMod 客户端初始化 ===");

        // 1. 注册接收器 - 处理来自服务端的数据包
        ClientPlayNetworking.registerGlobalReceiver(ExamplePacket.ID, (payload, context) -> {
            MinecraftClient client = context.client();

            // 在屏幕上显示消息
            String prefix = payload.isImportant() ? "§c[重要]§r " : "§a[MyMod]§r ";
            client.inGameHud.setOverlayMessage(
                Text.literal(prefix + payload.text().getString()),
                false
            );

            System.out.println("收到数据包:");
            System.out.println("  消息: " + payload.text().getString());
            System.out.println("  数值: " + payload.value());
            System.out.println("  重要: " + payload.isImportant());
        });

        // 2. 连接成功后发送测试数据包
        ClientPlayConnectionEvents.JOIN.register((handler, sender, client) -> {
            System.out.println("已连接到服务器，发送测试数据包...");
            
            // 发送普通消息
            ClientPlayNetworking.send(ExamplePacket.create("Hello Server!", 42));
        });

        // 3. 断开连接时提示
        ClientPlayConnectionEvents.DISCONNECT.register((handler, client) -> {
            System.out.println("已从服务器断开");
        });

        System.out.println("=== 客户端初始化完成 ===");
    }
}
```

---

## 6. 进阶技巧

### 6.1 使用 PacketType 和 PacketTypeRegistry（1.20.4+）

新版 API 使用 `PacketType` 替代 `CustomPayload.Id`：

```java
import net.minecraft.network.packet.PacketType;
import net.minecraft.network.packet.PacketTypeRegistry;

// 定义（新版）
public record NewPacket(String data) implements CustomPayload {
    public static final PacketType<NewPacket> TYPE = 
        PacketTypeRegistry.getC2S().create(
            Identifier.of("mymod", "new_packet"),
            NewPacket::new
        );
}
```

### 6.2 本地接收器

全局接收器在所有世界生效，本地接收器只在特定世界生效：

```java
// 服务端 - 本地接收器
ServerPlayNetworking.registerReceiver(
    MyPacket.ID,  // 通道 ID
    (payload, context) -> {
        // 处理逻辑
    }
);
```

### 6.3 检查通道可用性

发送前检查客户端是否支持该通道：

```java
// 服务端检查
if (ServerPlayNetworking.canSend(player, MyPacket.ID)) {
    ServerPlayNetworking.send(player, new MyPacket("Hello"));
}

// 客户端检查
if (ClientPlayNetworking.canSend(MyPacket.ID)) {
    ClientPlayNetworking.send(new MyPacket("Hello"));
}
```

### 6.4 异步处理

接收器在服务端线程执行，可以安全访问服务器对象：

```java
ServerPlayNetworking.registerGlobalReceiver(MyPacket.ID, (payload, context) -> {
    // 这里的代码在服务端主线程执行
    // 可以安全访问 world, server, player 等
    
    // 如果需要异步操作，使用 server.execute() 安排到主线程
    context.server().execute(() -> {
        // 异步执行后的操作
    });
});
```

---

## 总结

本章学习了：

- 数据包的概念和结构
- 使用 record 定义自定义数据包
- 服务端注册数据包类型和接收器
- 客户端注册接收器处理数据包
- 双向通信的完整实现

---

## 下一步

现在你已经学会了自定义数据包，接下来学习：

- [自定义命令](./03-commands.md) - 使用 Brigadier 创建游戏内命令

---

*参考：[Fabric 网络系统分析](../analysis/07-networking-system.md) - 深入了解网络系统的实现细节*