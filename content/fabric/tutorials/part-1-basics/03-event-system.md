# 第三章：事件系统入门

> 事件系统是 Fabric 开发的核心概念之一。学会使用事件，你就能响应游戏中的各种情况。

---

## 目录

1. [什么是事件？](#1-什么是事件)
2. [如何使用事件？](#2-如何使用事件)
3. [常用事件一览](#3-常用事件一览)
4. [事件处理示例](#4-事件处理示例)
5. [事件优先级](#5-事件优先级)
6. [自定义事件](#6-自定义事件)

---

## 1. 什么是事件？

### 1.1 现实中的事件

想象你在餐厅点餐：

```
场景：你在餐厅

事件                    你的反应
─────────────────────────────────
服务员端上菜     →    开始吃饭
手机响了          →    接电话
餐厅着火          →    逃跑

在 Minecraft 中：
事件                    你的代码响应
─────────────────────────────────
玩家加入游戏     →    显示欢迎消息
方块被放置      →    触发特殊效果
实体死亡        →    掉落物品
```

### 1.2 事件的工作原理

```
┌─────────────────────────────────────────────┐
│              Minecraft 游戏                   │
│                                              │
│    ┌─────────────────────────────────┐     │
│    │     事件系统 (Event System)       │     │
│    │                                   │     │
│    │   Event A ──→ [ 监听器1 ]       │     │
│    │   Event B ──→ [ 监听器1 ]       │     │
│    │               [ 监听器2 ]       │     │
│    │               [ 监听器3 ]       │     │
│    └─────────────────────────────────┘     │
└─────────────────────────────────────────────┘
                        ↑
                        │
              ┌─────────┴─────────┐
              │      你的代码       │
              │  Event.register()  │
              └───────────────────┘
```

### 1.3 事件的三个部分

```
事件 = 事件源 + 事件类型 + 监听器

┌─────────────────────────────────────┐
│           事件 "玩家加入"            │
├─────────────────────────────────────┤
│  事件源   →  玩家对象 (who joined) │
│  事件类型 →  PLAYER_JOIN            │
│  监听器   →  你的代码 (显示欢迎)    │
└─────────────────────────────────────┘
```

---

## 2. 如何使用事件？

### 2.1 基本模式

使用事件只需要三步：

```
第一步：找到对应事件类
第二步：获取事件
第三步：注册监听器
```

### 2.2 完整示例

```java
import net.fabricmc.fabric.api.entity.event.v1.ServerPlayerEvents;

public class MyMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // 监听玩家死亡事件
        ServerPlayerEvents.AFTER_DEATH.register((player, source) -> {
            // 当玩家死亡时执行这里
            player.getWorld().sendMessage(
                Text.literal(player.getName().getString() + " 死了！")
            );
        });
    }
}
```

### 2.3 Lambda 表达式

上例中的 `(player, source) -> { ... }` 就是 Lambda 表达式，是事件监听器的简洁写法：

```java
// 完整写法
ServerPlayerEvents.AFTER_DEATH.register(new ServerPlayerEvents.AfterDeath() {
    @Override
    public void afterDeath(ServerPlayerEntity player, DamageSource source) {
        // 代码
    }
});

// Lambda 简化写法
ServerPlayerEvents.AFTER_DEATH.register((player, source) -> {
    // 代码
});
```

### 2.4 注册的时机

**重要**：事件必须在 Mod 初始化时注册！

```java
public class MyMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // ✅ 正确：在这里注册
        ServerPlayerEvents.JOIN.register(...);

        // ❌ 错误：不要在其他地方注册
        // 比如在某个方法里动态注册可能会出问题
    }
}
```

---

## 3. 常用事件一览

### 3.1 实体相关事件 (fabric-entity-events-v1)

```java
import net.fabricmc.fabric.api.entity.event.v1.*;

// 玩家事件
ServerPlayerEvents.JOIN           // 玩家加入
ServerPlayerEvents.LEAVE          // 玩家离开
ServerPlayerEvents.COPY_FROM       // 玩家数据复制（重生时）
ServerPlayerEvents.AFTER_RESPAWN   // 玩家重生后

// 实体死亡
ServerLivingEntityEvents.ALLOW_DEATH   // 允许死亡？（可取消）
ServerLivingEntityEvents.AFTER_DEATH    // 死亡后
ServerLivingEntityEvents.ALLOW_DAMAGE   // 允许伤害？（可取消）
ServerLivingEntityEvents.AFTER_DAMAGE    // 伤害后
```

### 3.2 生命周期事件 (fabric-lifecycle-events-v1)

```java
import net.fabricmc.fabric.api.event.lifecycle.v1.*;

// 服务端生命周期
ServerLifecycleEvents.SERVER_STARTING  // 服务端启动中
ServerLifecycleEvents.SERVER_STARTED   // 服务端已启动
ServerLifecycleEvents.SERVER_STOPPING  // 服务端关闭中
ServerLifecycleEvents.SERVER_STOPPED   // 服务端已关闭

// 刻事件
ServerTickEvents.END_SERVER_TICK    // 服务端刻结束
ServerTickEvents.START_SERVER_TICK  // 服务端刻开始
ServerTickEvents.END_WORLD_TICK     // 世界刻结束

// 区块事件
ServerChunkEvents.CHUNK_LOAD       // 区块加载
ServerChunkEvents.CHUNK_UNLOAD      // 区块卸载
```

### 3.3 交互事件 (fabric-events-interaction-v0)

```java
import net.fabricmc.fabric.api.event.player.*;

// 方块交互
UseBlockCallback.EVENT        // 使用方块（右击）
UseItemCallback.EVENT         // 使用物品
AttackBlockCallback.EVENT     // 攻击方块
PlayerBlockBreakEvents.BEFORE // 方块破坏前
PlayerBlockBreakEvents.AFTER  // 方块破坏后
```

---

## 4. 事件处理示例

### 4.1 监听玩家加入

```java
import net.fabricmc.fabric.api.entity.event.v1.ServerPlayerEvents;

ServerPlayerEvents.JOIN.register(player -> {
    // 发送欢迎消息
    player.sendMessage(Text.literal("欢迎来到服务器！"), false);
});
```

### 4.2 监听玩家死亡

```java
import net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents;

ServerLivingEntityEvents.AFTER_DEATH.register((entity, source) -> {
    // 检查是否是玩家
    if (entity instanceof ServerPlayerEntity player) {
        // 广播死亡消息
        player.getServerWorld().getServer().getPlayerManager().broadcast(
            Text.literal(player.getName().getString() + " 被 " +
                (source.getAttacker() != null ?
                    source.getAttacker().getName().getString() : "未知") + " 杀死了"),
            false
        );
    }
});
```

### 4.3 监听服务端启动

```java
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;

ServerLifecycleEvents.SERVER_STARTED.register(server -> {
    // 服务器启动完成后执行
    LOGGER.info("服务器已启动！当前玩家数：" + server.getCurrentPlayerCount());
});

ServerLifecycleEvents.SERVER_STOPPING.register(server -> {
    // 服务器即将关闭时执行
    LOGGER.info("服务器正在关闭...");
});
```

### 4.4 监听方块放置

```java
import net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents;

PlayerBlockBreakEvents.BEFORE.register((world, player, pos, state, entity) -> {
    // 检查是否是管理员
    if (player.hasPermissionLevel(2)) {
        // 管理员破坏方块不掉落
        return true;  // 返回 true 表示允许（不禁用默认行为）
    }
    return true;
});

PlayerBlockBreakEvents.AFTER.register((world, player, pos, state, entity) -> {
    // 方块被破坏后执行
    // 比如给玩家奖励
    player.giveItemStack(new ItemStack(Items.DIAMOND));
});
```

### 4.5 每刻执行逻辑

```java
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;

ServerTickEvents.END_SERVER_TICK.register(server -> {
    // 每个服务端刻（20次/秒）执行一次
    // 注意：这个方法会被频繁调用，不要在这里做耗时操作！
});

// 世界刻
ServerTickEvents.END_WORLD_TICK.register(world -> {
    if (world.getDimensionKey() == RegistryKey.of(Registry.WORLD_KEY, new Identifier("my_dim"))) {
        // 只在特定维度执行
    }
});
```

---

## 5. 事件优先级

### 5.1 什么是优先级？

当多个监听器监听同一个事件时，优先级决定执行顺序：

```
优先级数字越小，越先执行：

优先级 100 (先) ──→ 监听器 A
优先级 200     ──→ 监听器 B
优先级 300 (后) ──→ 监听器 C
```

### 5.2 在 Fabric 中使用优先级

```java
// 大多数事件没有显式优先级参数
// 但可以注册多个监听器，它们会按注册顺序执行

// 先注册
ServerPlayerEvents.JOIN.register(player -> {
    LOGGER.info("第一个监听器");
});

// 后注册
ServerPlayerEvents.JOIN.register(player -> {
    LOGGER.info("第二个监听器");
});

// 输出顺序：
// 第一个监听器
// 第二个监听器
```

---

## 6. 自定义事件

### 6.1 为什么需要自定义事件？

当你想让其他 Mod 能响应你的 Mod 中的事情时：

```
场景：
├── 你的 Mod 创建了一个新物品
├── 其他 Mod 想在这个物品被使用时做点什么
│
└── 解决方案：定义一个自定义事件
```

### 6.2 定义自定义事件

```java
import net.fabricmc.fabric.api.event.Event;
import net.fabricmc.fabric.api.event.EventFactory;

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

### 6.3 触发自定义事件

```java
// 在物品使用时触发事件
public class MyItem implements Item {
    @Override
    public boolean use(World world, PlayerEntity player, Hand hand) {
        if (!world.isClient && player instanceof ServerPlayerEntity serverPlayer) {
            // 触发自定义事件
            MyEvents.MY_ITEM_USED.invoker().onItemUsed(serverPlayer, player.getStackInHand(hand));
        }
        return super.use(world, player, hand);
    }
}
```

### 6.4 其他 Mod 监听自定义事件

```java
// 其他 Mod 可以这样监听你的事件
public class OtherMod implements ModInitializer {
    @Override
    public void onInitialize() {
        // 监听你的自定义事件
        MyEvents.MY_ITEM_USED.register((player, itemStack) -> {
            LOGGER.info("检测到玩家使用了物品！");
        });
    }
}
```

---

## 总结

```
事件使用三步曲：

1️⃣ 找到事件
    ServerPlayerEvents.JOIN

2️⃣ 获取事件对象
    .register(...)

3️⃣ 写监听器
    (player) -> { ... }

常见坑：
❌ 不要在监听器里做耗时操作
❌ 事件注册要放在 Mod 初始化时
❌ 注意服务端/客户端事件别用错
```

---

## 下一步

现在你学会了事件系统！接下来：
- [注册系统](./04-registry-system.md) - 学习如何注册游戏对象
- [创建自定义物品](../part-2-blocks-items/03-creating-items.md) - 用事件响应物品使用

---

*参考：[实体事件分析](../analysis/05-entity-event-system.md)* - 查看更详细的事件 API 说明
