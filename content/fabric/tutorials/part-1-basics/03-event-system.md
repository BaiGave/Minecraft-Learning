# ⚡ 事件系统 —— 让游戏"活"起来！

> **TL;DR** 事件系统让你响应游戏中的任何变化，就像在游戏中埋下"监听器"！

---

## 📖 目录

1. [🎯 什么是事件？](#1-什么是事件)
2. [🛠️ 如何使用事件？](#2-如何使用事件)
3. [📚 常用事件一览](#3-常用事件一览)
4. [💡 实战示例](#4-实战示例)
5. [🎯 事件优先级](#5-事件优先级)
6. [🚀 自定义事件](#6-自定义事件)

---

## 1. 什么是事件？

### 1.1 一句话解释

```
🎮 游戏 = 一个不断发生"事情"的世界
📡 事件 = 这些"事情"的通知
🧏 你 = 订阅这些通知的人
```

当你"订阅"了某个事件，游戏就会在那个事情发生时通知你！

### 1.2 现实类比

```mermaid
graph LR
    subgraph "🏪 餐厅场景"
        A1["🍽️ 服务员上菜"] --> B1["👤 你开始吃"]
        A2["📱 手机响了"] --> B2["👤 你接电话"]
        A3["🔥 餐厅着火"] --> B3["👤 你逃跑"]
    end

    subgraph "🎮 Minecraft 对应"
        A4["👤 玩家加入"] --> B4["💬 显示欢迎语"]
        A5["🧱 方块被放置"] --> B5["✨ 触发特效"]
        A6["💀 实体死亡"] --> B6["📦 掉落物品"]
    end
```

### 1.3 事件工作原理

```mermaid
flowchart TB
    subgraph "🎮 Minecraft 游戏核心"
        CORE["⚙️ 游戏引擎"]
    end

    subgraph "📡 事件总线 EventBus"
        BUS["🚌 事件总线"]
        BUS --> E1["PlayerJoin 事件"]
        BUS --> E2["BlockBreak 事件"]
        BUS --> E3["EntityDeath 事件"]
    end

    subgraph "📨 你的监听器"
        L1["👤 监听器 A<br/>显示欢迎语"]
        L2["👤 监听器 B<br/>播放音效"]
        L3["👤 监听器 C<br/>记录日志"]
    end

    CORE -->|"触发事件"| BUS
    E1 --> L1
    E2 --> L2
    E3 --> L3

    style BUS fill:#f6ad55,color:#000
    style CORE fill:#4a5568,color:#fff
```

### 1.4 事件三要素

```mermaid
flowchart LR
    subgraph "📬 事件 ="
        E1["🎯 事件源<br/>谁触发的？"]
        E2["📋 事件类型<br/>发生了什么？"]
        E3["🎧 监听器<br/>你怎么办？"]
    end

    E1 -->|"组合"| EVENT["📬 完整事件"]
    E2 --> EVENT
    E3 --> EVENT
```

### 1.5 事件执行流程

```mermaid
sequenceDiagram
    participant M as 🎮 Minecraft
    participant B as 🚌 事件总线
    participant L1 as 👤 监听器A
    participant L2 as 👤 监听器B

    M->>B: 玩家点击了方块！
    B->>L1: 触发 BlockInteract 事件
    L1-->>B: 我处理完了 ✓
    B->>L2: 触发 BlockInteract 事件
    L2-->>B: 我也处理完了 ✓
    B-->>M: 所有监听器处理完毕
```

---

## 2. 如何使用事件？

### 2.1 三步走策略

```mermaid
flowchart LR
    A["🔍 第一步<br/>找到事件"] --> B["📝 第二步<br/>注册监听"]
    B --> C["💻 第三步<br/>写处理逻辑"]

    style A fill:#4ecdc4
    style B fill:#ffe66d
    style C fill:#ff6b6b
```

### 2.2 代码模板

```mermaid
graph LR
    subgraph "📋 事件注册模板"
        T1["1️⃣ 导入事件类"]
        T2["2️⃣ 获取事件"]
        T3["3️⃣ 注册监听器"]
    end

    T1 --> T2 --> T3
```

**实际代码**：

```java
// 1️⃣ 导入事件类
import net.fabricmc.fabric.api.entity.event.v1.ServerPlayerEvents;

// 2️⃣ 获取事件
ServerPlayerEvents.JOIN

// 3️⃣ 注册监听器（用 Lambda 简洁写法）
ServerPlayerEvents.JOIN.register(player -> {
    // 你的代码写在这里！
    player.sendMessage(Text.literal("欢迎回来！"));
});
```

### 2.3 对比：传统写法 vs Lambda

```mermaid
graph LR
    subgraph "❌ 传统写法（繁琐）"
        C1["new Listener()"]
        C2["重写方法"]
        C3["写 10 行"]
    end

    subgraph "✅ Lambda 写法（简洁）"
        L1["register()"]
        L2["箭头函数"]
        L3["写 3 行"]
    end

    C1 & L1
```

```java
// ❌ 传统写法 - 啰嗦
ServerPlayerEvents.JOIN.register(new ServerPlayerEvents.Join() {
    @Override
    public void onJoin(ServerPlayerEntity player) {
        player.sendMessage(Text.literal("欢迎！"));
    }
});

// ✅ Lambda 写法 - 简洁
ServerPlayerEvents.JOIN.register(player -> {
    player.sendMessage(Text.literal("欢迎！"));
});
```

### 2.4 注册时机

```mermaid
flowchart TB
    subgraph "❌ 错误做法"
        E1["在 onInitialize() 之外注册"]
        E2["动态注册"]
    end

    subgraph "✅ 正确做法"
        O1["必须在 ModInitializer"]
        O2["onInitialize() 方法内"]
        O3["游戏启动时注册"]
    end

    style E1 fill:#fc8181
    style E2 fill:#fc8181
    style O1 fill:#68d391
    style O2 fill:#68d391
    style O3 fill:#68d391
```

```java
public class MyMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // ✅ 正确：在这里注册
        ServerPlayerEvents.JOIN.register(player -> {
            // ...
        });
    }

    // ❌ 错误：不要这样！
    // public void someMethod() {
    //     ServerPlayerEvents.JOIN.register(...); // 太晚了！
    // }
}
```

---

## 3. 常用事件一览

### 3.1 事件分类图

```mermaid
mindmap
  root((⚡ Fabric 事件))
    👤 玩家事件
      JOIN 加入
      LEAVE 离开
      DEATH 死亡
      RESPAWN 重生
    🌍 世界事件
      SERVER_START 服务器启停
      CHUNK_LOAD 区块加载
      CHUNK_UNLOAD 区块卸载
      TICK 刻事件
    🧱 方块事件
      BLOCK_PLACE 放置
      BLOCK_BREAK 破坏
      BLOCK_INTERACT 交互
    👾 实体事件
      ENTITY_SPAWN 生成
      ENTITY_DEATH 死亡
      ENTITY_DAMAGE 受伤
    📦 物品事件
      ITEM_USE 使用
      ITEM_CRAFTED 合成
      ITEM_DROPPED 丢弃
```

### 3.2 事件速查表

| 你想监听... | 使用这个事件 | 模块 |
|------------|------------|------|
| 玩家加入 | `ServerPlayerEvents.JOIN` | entity-events |
| 玩家离开 | `ServerPlayerEvents.LEAVE` | entity-events |
| 玩家死亡 | `ServerLivingEntityEvents.AFTER_DEATH` | entity-events |
| 服务器启动 | `ServerLifecycleEvents.SERVER_STARTED` | lifecycle |
| 方块放置 | `UseBlockCallback.EVENT` | interaction |
| 方块破坏 | `PlayerBlockBreakEvents.AFTER` | interaction |
| 实体生成 | `EntitySpawnCallback.EVENT` | entity |
| 每刻执行 | `ServerTickEvents.END_SERVER_TICK` | lifecycle |

### 3.3 事件来源模块

```mermaid
flowchart TB
    subgraph "fabric-entity-events-v1"
        EE1["ServerPlayerEvents"]
        EE2["ServerLivingEntityEvents"]
    end

    subgraph "fabric-lifecycle-events-v1"
        LE1["ServerLifecycleEvents"]
        LE2["ServerTickEvents"]
        LE3["ServerChunkEvents"]
    end

    subgraph "fabric-events-interaction-v0"
        IE1["UseBlockCallback"]
        IE2["AttackBlockCallback"]
        IE3["PlayerBlockBreakEvents"]
    end
```

---

## 4. 实战示例

### 4.1 示例 1：欢迎玩家 🎉

```mermaid
sequenceDiagram
    participant P as 👤 玩家
    participant S as 🏠 服务器
    participant M as 📝 你的代码

    P->>S: 加入服务器
    S->>M: 触发 JOIN 事件
    M-->>P: 发送欢迎消息
    P-->>S: 看到 "欢迎回来！"
```

```java
ServerPlayerEvents.JOIN.register(player -> {
    player.sendMessage(
        Text.literal("欢迎回来，")
            .append(player.getName())
            .append("！")
    );
});
```

### 4.2 示例 2：死亡播报 💀

```mermaid
flowchart TD
    A[💀 实体死亡] --> B{是玩家？}
    B -->|是| C[广播死亡消息]
    B -->|否| D[不做处理]
    C --> E["\"Steve 被 Creeper 炸死了\""]
```

```java
ServerLivingEntityEvents.AFTER_DEATH.register((entity, source) -> {
    if (entity instanceof ServerPlayerEntity player) {
        String killer = source.getAttacker() != null
            ? source.getAttacker().getName().getString()
            : "意外";

        player.getServer().getPlayerManager().broadcast(
            Text.literal(player.getName().getString() + " 被 " + killer + " 杀死了！"),
            false
        );
    }
});
```

### 4.3 示例 3：每刻检查 ⏰

```mermaid
flowchart
    A["⏰ 每刻（20次/秒）"] --> B["检查条件"]
    B --> C{"满足条件？"}
    C -->|是| D[执行操作]
    C -->|否| E[跳过]
    D --> F["🔄 继续"]
    E --> F
```

```java
ServerTickEvents.END_SERVER_TICK.register(server -> {
    // ⚠️ 注意：这个会频繁执行，不要写耗时操作！
    // 适合做：状态检查、定时任务
});
```

### 4.4 示例 4：自定义方块交互 🖱️

```mermaid
graph TD
    A["👤 玩家右键点击"] --> B["触发 UseBlockCallback"]
    B --> C{"是我们的方块？"}
    C -->|是| D["执行自定义逻辑"]
    C -->|否| E["交给游戏处理"]
    D --> F["✅ 消耗物品/播放音效"]
```

```java
UseBlockCallback.EVENT.register((player, world, hand, hitResult) -> {
    if (world.isClient) return ActionResult.PASS;

    BlockPos pos = hitResult.getBlockPos();
    BlockState state = world.getBlockState(pos);

    // 检查是否是我们的方块
    if (state.isOf(ModBlocks.MY_MAGIC_BLOCK)) {
        player.sendMessage(Text.literal("你点击了魔法方块！✨"));
        return ActionResult.SUCCESS; // 阻止默认行为
    }

    return ActionResult.PASS; // 交给游戏处理
});
```

---

## 5. 事件优先级

### 5.1 优先级概念

```mermaid
flowchart LR
    subgraph "📊 执行顺序"
        P1["🔴 优先级 100<br/>（先执行）"] --> P2["🟡 优先级 200"]
        P2 --> P3["🟢 优先级 300<br/>（后执行）"]
    end
```

### 5.2 注册顺序

```java
// 先注册 → 先执行
ServerPlayerEvents.JOIN.register(player -> {
    LOGGER.info("第一个监听器"); // 先输出
});

ServerPlayerEvents.JOIN.register(player -> {
    LOGGER.info("第二个监听器"); // 后输出
});
```

### 5.3 实际应用场景

```mermaid
graph TD
    A["🎮 游戏事件"] --> B["🔴 Mod A 优先级100"]
    A --> C["🟡 Mod B 优先级200"]
    A --> D["🟢 Mod C 优先级300"]

    B -->|"可以阻止"| E["执行结果"]
    C --> E
    D --> E
```

---

## 6. 自定义事件

### 6.1 为什么需要？

```mermaid
graph TD
    subgraph "🎯 场景"
        A["你的 Mod"] -->|"物品被使用"| B["触发自定义事件"]
    end

    subgraph "🤝 其他 Mod"
        C["监听你的事件"]
        D["响应物品使用"]
    end

    B --> C
    C --> D
```

### 6.2 定义事件

```mermaid
flowchart TB
    A["📝 定义接口"] --> B["🔧 创建事件"]
    B --> C["⚡ 注册事件"]
    C --> D["🎮 触发事件"]
    D --> E["📡 其他 Mod 响应"]
```

```java
public class MyEvents {
    // 定义事件
    public static final Event<MyItemUsed> MY_ITEM_USED = EventFactory.createArrayBacked(
        MyItemUsed.class,
        (listeners) -> (player, itemStack) -> {
            for (MyItemUsed listener : listeners) {
                listener.onItemUsed(player, itemStack);
            }
        }
    );

    // 定义监听器接口
    @FunctionalInterface
    public interface MyItemUsed {
        void onItemUsed(ServerPlayerEntity player, ItemStack itemStack);
    }
}
```

### 6.3 触发事件

```java
public class MagicItem implements Item {
    @Override
    public boolean use(World world, PlayerEntity player, Hand hand) {
        if (!world.isClient && player instanceof ServerPlayerEntity serverPlayer) {
            // ✨ 触发自定义事件！
            MyEvents.MY_ITEM_USED.invoker().onItemUsed(
                serverPlayer,
                player.getStackInHand(hand)
            );
        }
        return super.use(world, player, hand);
    }
}
```

---

## 🎯 总结

```mermaid
flowchart TD
    START["🎯 事件系统核心"] --> A["1️⃣ 找到事件"]
    A --> B["2️⃣ 注册监听"]
    B --> C["3️⃣ Lambda 写法"]
    C --> D["4️⃣ 在 onInitialize 里注册"]
    D --> E["5️⃣ 注意服务端/客户端区别"]

    START2["⚠️ 常见坑"] --> P1["❌ 耗时操作"]
    START2 --> P2["❌ 注册时机错误"]
    START2 --> P3["❌ 服务端/客户端混用"]
```

### 记住这三点：

1. **事件 = 游戏的通知**
2. **注册 = 订阅通知**
3. **Lambda = 简洁的订阅方式**

---

## 下一步

- [📦 注册系统](./04-registry-system.md) - 注册你的第一个游戏对象
- [🧱 创建方块](../part-2-blocks-items/01-creating-blocks.md) - 用事件响应方块交互

---

*💡 提示：事件是 Fabric 开发的核心，多练习就能掌握！*
