# Fabric API 网络系统分析

## 概述

网络系统包含两个核心模块：
- `fabric-networking-api-v1` - 通用网络 API
- `fabric-message-api-v1` - 消息 API

---

## 1. fabric-networking-api-v1 模块

### 1.1 网络阶段

```
┌─────────────────────────────────────────────────────────────────┐
│                     网络阶段 (Network Phase)                      │
├─────────────────┬─────────────────┬─────────────────┬──────────┤
│      LOGIN      │  CONFIGURATION  │      PLAY       │   ...    │
├─────────────────┼─────────────────┼─────────────────┼──────────┤
│  ServerLogin    │ ServerConfig    │  ServerPlay     │          │
│  Networking     │ Networking      │  Networking     │          │
├─────────────────┼─────────────────┼─────────────────┼──────────┤
│  ClientLogin    │ ClientConfig    │  ClientPlay     │          │
│  Networking     │ Networking      │  Networking     │          │
└─────────────────┴─────────────────┴─────────────────┴──────────┘
```

### 1.2 核心接收器注册表

```java
public final class ServerNetworkingImpl {
    public static final GlobalReceiverRegistry<ServerLoginNetworking.LoginQueryResponseHandler> LOGIN = ...;
    public static final GlobalReceiverRegistry<ServerConfigurationNetworking.ConfigurationPacketHandler<?>> CONFIGURATION = ...;
    public static final GlobalReceiverRegistry<ServerPlayNetworking.PlayPayloadHandler<?>> PLAY = ...;
}
```

### 1.3 全局接收器注册表

```java
public final class GlobalReceiverRegistry<H> {
    // 线程安全的读写锁
    private final ReadWriteLock lock = new ReentrantReadWriteLock();

    // 通道处理器映射
    private final Map<Identifier, H> handlers = new HashMap<>();

    // 已追踪的连接集合
    private final Set<AbstractNetworkAddon<H>> trackedAddons = new HashSet<>();
}
```

---

## 2. 数据包处理

### 2.1 自定义数据包定义

```java
public record OverlayPacket(Text message) implements CustomPayload {
    public static final CustomPayload.Id<OverlayPacket> ID =
        new Id<>(NetworkingTestmods.id("test_channel"));
    public static final PacketCodec<RegistryByteBuf, OverlayPacket> CODEC =
        CustomPayload.codecOf(OverlayPacket::write, OverlayPacket::new);

    public OverlayPacket(RegistryByteBuf buf) {
        this(TextCodecs.REGISTRY_PACKET_CODEC.decode(buf));
    }

    public void write(RegistryByteBuf buf) {
        TextCodecs.REGISTRY_PACKET_CODEC.encode(buf, this.message);
    }

    @Override
    public Id<? extends CustomPayload> getId() {
        return ID;
    }
}
```

### 2.2 数据包处理流程

```
接收流程:
┌─────────────────────────────────────────────────────────────────┐
│ 1. Mixin 拦截数据包                                              │
│    ServerPlayNetworkHandlerMixin.handleCustomPayloadReceivedAsync │
│                                                                 │
│ 2. 查找处理器                                                    │
│    addon.handle(packet) → GlobalReceiverRegistry.getHandler()    │
│                                                                 │
│ 3. 调用处理                                                     │
│    handler.receive(payload, context)                            │
│    └─> 在服务端线程执行 (server.execute())                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 事件系统

### 3.1 服务端 Play 阶段事件

```java
public final class ServerPlayConnectionEvents {
    // 连接进入 PLAY 状态
    public static final Event<Init> INIT = ...;

    // 服务端准备发送数据包到客户端
    public static final Event<Join> JOIN = ...;

    // 连接断开
    public static final Event<Disconnect> DISCONNECT = ...;
}
```

### 3.2 通道注册/注销事件

```java
public final class S2CPlayChannelEvents {
    // 客户端注册通道时
    public static final Event<Register> REGISTER = ...;

    // 客户端注销通道时
    public static final Event<Unregister> UNREGISTER = ...;
}
```

---

## 4. Mixin 注入点

| Mixin 类 | 目标类 | 功能 |
|----------|--------|------|
| `ServerPlayNetworkHandlerMixin` | `ServerPlayNetworkHandler` | 创建 Addon，拦截 C2S 数据包 |
| `ServerCommonNetworkHandlerMixin` | `ServerCommonNetworkHandler` | 拦截配置阶段数据包 |
| `ClientPlayNetworkHandlerMixin` | `ClientPlayNetworkHandler` | 创建 Addon，处理游戏加入 |
| `ServerLoginNetworkHandlerMixin` | `ServerLoginNetworkHandler` | 处理登录阶段查询 |
| `ServerConfigurationNetworkHandlerMixin` | `ServerConfigurationNetworkHandler` | 配置阶段网络处理 |

---

## 5. 使用示例

### 5.1 服务端数据包注册

```java
public class MyModServer implements ModInitializer {
    @Override
    public void onInitialize() {
        // 1. 注册数据包类型 (S2C)
        PayloadTypeRegistry.playS2C().register(MyModPacket.ID, MyModPacket.CODEC);

        // 2. 注册全局接收器
        ServerPlayNetworking.registerGlobalReceiver(MyModPacket.ID, (payload, context) -> {
            context.server().getPlayerManager().broadcast(
                Text.literal("收到: " + payload.message()), false
            );
        });

        // 3. 监听连接事件
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
            sender.sendPacket(new MyModPacket("欢迎来到服务器!"));
        });
    }
}
```

### 5.2 客户端数据包注册

```java
public class MyModClient implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        // 1. 注册数据包类型 (C2S)
        PayloadTypeRegistry.playC2S().register(MyModPacket.ID, MyModPacket.CODEC);

        // 2. 注册接收器
        ClientPlayNetworking.registerGlobalReceiver(MyModPacket.ID, (payload, context) -> {
            context.client().inGameHud.setOverlayMessage(
                Text.literal(payload.message()), true
            );
        });
    }
}
```

### 5.3 发送数据包

```java
// 服务端向玩家发送数据包
ServerPlayNetworking.send(player, new MyModPacket("Hello from server!"));

// 客户端向服务端发送数据包
ClientPlayNetworking.send(new MyModPacket("Hello from client!"));

// 检查通道可用性
if (ServerPlayNetworking.canSend(player, MyModPacket.ID)) {
    ServerPlayNetworking.send(player, new MyModPacket("Supported!"));
}
```

---

*源码位置: `fabric-networking-api-v1/`, `fabric-message-api-v1/`*
