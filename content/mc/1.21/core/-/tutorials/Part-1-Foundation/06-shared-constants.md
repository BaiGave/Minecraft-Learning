---
title: 第 06 章：全局常量与版本信息（SharedConstants）
readingTime: 15
---


# 第 06 章：全局常量与版本信息（SharedConstants）

## 章节目标

学完本章后，你将能够：
- 理解 Minecraft 1.21 的版本常量体系
- 识别关键常量的用途
- 了解版本号在网络同步中的作用

## 前置知识

- 了解 Minecraft 的基本概念

## 核心常量类

### SharedConstants - 全局常量定义

```java
// net/minecraft/SharedConstants.java
public class SharedConstants {
    
    // ========== 版本信息 ==========
    public static final int WORLD_VERSION = 3953;           // 世界格式版本
    public static final String CURRENT_SERIES = "main";     // 版本系列
    public static final String VERSION_NAME = "1.21";        // 版本名称
    public static final int RELEASE_TARGET_PROTOCOL_VERSION = 767;  // 网络协议版本
    
    // ========== 资源版本 ==========
    public static final int RESOURCE_PACK_VERSION = 34;      // 资源包版本
    public static final int DATA_PACK_VERSION = 48;         // 数据包版本
    
    // ========== 网络端口 ==========
    public static final int DEFAULT_PORT = 25565;           // 默认服务器端口
    
    // ========== 世界尺寸 ==========
    public static final int CHUNK_WIDTH = 16;                // 区块宽度（固定）
    public static final int DEFAULT_WORLD_HEIGHT = 256;      // 默认世界高度
    
    // ========== 命令系统 ==========
    public static final int COMMAND_MAX_LENGTH = 32500;      // 命令最大长度
    public static final int EXPANDED_MACRO_COMMAND_MAX_LENGTH = 2000000;  // 宏命令最大长度
    
    // ========== Tick 系统 ==========
    public static final int TICKS_PER_SECOND = 20;          // 每秒 Tick 数
    public static final int TICKS_PER_MINUTE = 1200;         // 每分钟 Tick 数
    public static final int TICKS_PER_IN_GAME_DAY = 24000;   // 游戏内一天 Tick 数
}
```

### MinecraftVersion - 版本信息类

```java
// net/minecraft/MinecraftVersion.java
public final class MinecraftVersion implements Comparable<MinecraftVersion> {
    
    private final String id;
    private final String name;
    private final boolean stable;
    private final SaveVersion saveVersion;
    private final int protocolVersion;
    private final int resourcePackVersion;
    private final int dataPackVersion;
    private final Date buildTime;
    
    private MinecraftVersion() {
        this.id = UUID.randomUUID().toString().replaceAll("-", "");
        this.name = "1.21";
        this.stable = true;
        this.saveVersion = new SaveVersion(3953, "main");
        this.protocolVersion = SharedConstants.getProtocolVersion();
        this.resourcePackVersion = 34;
        this.dataPackVersion = 48;
        this.buildTime = new Date();
    }
    
    // 获取全局实例
    public static MinecraftVersion get() { ... }
}
```

## 关键常量速查表

### 版本常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `VERSION_NAME` | `"1.21"` | 版本名称 |
| `RELEASE_TARGET_PROTOCOL_VERSION` | `767` | 网络协议版本 |
| `WORLD_VERSION` | `3953` | 世界数据格式版本 |
| `RESOURCE_PACK_VERSION` | `34` | 资源包版本 |
| `DATA_PACK_VERSION` | `48` | 数据包版本 |

### Tick 常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `TICKS_PER_SECOND` | `20` | 每秒 20 Tick |
| `TICKS_PER_MINUTE` | `1200` | 每分钟 1200 Tick |
| `TICKS_PER_IN_GAME_DAY` | `24000` | 游戏内一天 |
| Tick 间隔 | `50ms` | 每个 Tick 间隔 50ms |

### 世界尺寸常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `CHUNK_WIDTH` | `16` | 区块宽度 |
| `DEFAULT_WORLD_HEIGHT` | `256` | 世界高度（Y 轴） |
| 区块大小 | 16×256×16 | 固定方块数 |
| 世界高度范围 | -64 ~ 320 | 可建造高度 |

### 命令常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `COMMAND_MAX_LENGTH` | 32,500 | 普通命令最大字符数 |
| `EXPANDED_MACRO_COMMAND_MAX_LENGTH` | 2,000,000 | 宏命令最大字符数 |

## 版本号的作用

### 协议版本 (Protocol Version)

```
客户端 767 <---------> 服务端 767 ✅ 连接成功
客户端 766 <---------> 服务端 767 ❌ 版本不匹配
```

**作用**：确保客户端和服务端使用相同的网络协议，防止通信错误。

```java
// 握手时检查协议版本
public void onHandshake(HandshakeC2SPacket packet) {
    int protocol = packet.protocolVersion();
    if (protocol != SharedConstants.getGameVersion().getProtocolVersion()) {
        // 断开连接
        disconnect("Outdated server!");
    }
}
```

### 世界版本 (World Version)

**作用**：确保世界数据与当前版本兼容。

```java
// 加载存档时检查
public void loadWorld(LevelSummary summary) {
    int worldVersion = summary.getVersion();
    if (worldVersion != SharedConstants.WORLD_VERSION) {
        // 触发数据修复流程
        DataFixer upper = getDataFixer().getUpper();
        // 执行迁移
    }
}
```

### 资源包版本 (Resource Pack Version)

**作用**：验证资源包是否兼容当前版本。

```java
// 资源包兼容性检查
public boolean isCompatible(int packVersion) {
    return packVersion == SharedConstants.RESOURCE_PACK_VERSION;
}
```

## 实战使用

### 在模组中访问版本信息

```java
// 获取游戏版本
MinecraftVersion version = MinecraftVersion.get();
String versionName = version.getName();  // "1.21"

// 获取协议版本
int protocol = SharedConstants.getProtocolVersion();

// 获取 Tick 计数
int currentTick = world.getTime();  // 当前世界的 Tick 数
int dayNumber = currentTick / 24000;  // 游戏天数
```

### 计算游戏时间

```java
// 转换 Tick 为现实时间
public static Duration ticksToRealTime(long ticks) {
    return Duration.ofMillis(ticks * 50);  // 每 Tick = 50ms
}

// 转换 Tick 为游戏内时间
public static String ticksToGameTime(long ticks) {
    long totalMinutes = (ticks % 24000) / 20;  // 每天 1200 分钟
    long hours = totalMinutes / 60;
    long minutes = totalMinutes % 60;
    return String.format("%02d:%02d", hours, minutes);
}
```

## 常见模式识别

### 硬编码常量

```java
// Minecraft 源码中常见这种模式
public class World {
    public static final int INVALID_BLOCK_POS = -1;
    public static final int MAX_ENTITY_HEIGHT = 512;
    public static final int MIN_HEIGHT = -64;
    public static final int MAX_HEIGHT = 320;
}
```

### 常量类组织

```java
// 按功能分类的常量类
public class GameEvents {
    public static final int BLOCK_BREAK = 2001;
    public static final int BLOCK_PLACE = 2003;
    public static final int ENTITY_DEATH = 2002;
}

public class DimensionTypes {
    public static final int NETHER_ID = -1;
    public static final int OVERWORLD_ID = 0;
    public static final int END_ID = 1;
}
```

## 课后自查

1. Minecraft 1.21 的网络协议版本号是多少？
2. 每秒执行多少个 Tick？每个 Tick 间隔多少毫秒？
3. 游戏内一天有多少 Tick？
4. 资源包版本和世界版本分别用于什么？
5. 为什么客户端和服务端的协议版本必须匹配？

## 参考文件

| 文件 | 描述 |
|------|------|
| `net/minecraft/SharedConstants.java` | 全局常量定义 |
| `net/minecraft/MinecraftVersion.java` | 版本信息类 |

## 下一步

现在你已经掌握全局常量知识。让我们学习 [启动引导流程](./09-bootstrap-flow.md)。
