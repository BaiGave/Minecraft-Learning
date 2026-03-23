# Fabric API 实体与事件系统分析

## 概述

实体与事件系统包含三个核心模块：
- `fabric-entity-events-v1` - 实体相关事件
- `fabric-events-interaction-v0` - 玩家交互事件
- `fabric-lifecycle-events-v1` - 服务端生命周期事件

---

## 1. fabric-entity-events-v1 模块

### 1.1 ServerLivingEntityEvents (生存实体事件)

```java
public final class ServerLivingEntityEvents {
    // 伤害前检查，可取消
    public static final Event<AllowDamage> ALLOW_DAMAGE = ...;

    // 伤害后通知
    public static final Event<AfterDamage> AFTER_DAMAGE = ...;

    // 死亡前检查，可取消
    public static final Event<AllowDeath> ALLOW_DEATH = ...;

    // 死亡后通知
    public static final Event<AfterDeath> AFTER_DEATH = ...;

    // 生物转换后
    public static final Event<MobConversion> MOB_CONVERSION = ...;
}
```

### 1.2 ServerPlayerEvents (玩家特定事件)

```java
public final class ServerPlayerEvents {
    // 玩家数据复制（重生时）
    public static final Event<ServerPlayerEvents.CopyFrom> COPY_FROM = ...;

    // 重生完成后
    public static final Event<ServerPlayerEvents.AfterRespawn> AFTER_RESPAWN = ...;

    // 玩家加入游戏
    public static final Event<Join> JOIN = ...;

    // 玩家离开游戏
    public static final Event<Leave> LEAVE = ...;
}
```

---

## 2. fabric-events-interaction-v0 模块

### 2.1 事件设计模式

Fabric 采用统一的 `EventFactory.createArrayBacked` 模式：

```java
public interface UseBlockCallback {
    Event<UseBlockCallback> EVENT = EventFactory.createArrayBacked(
        UseBlockCallback.class,
        (listeners) -> (player, world, hand, hitResult) -> {
            for (UseBlockCallback event : listeners) {
                ActionResult result = event.interact(player, world, hand, hitResult);
                if (result != ActionResult.PASS) {
                    return result;
                }
            }
            return ActionResult.PASS;
        }
    );

    ActionResult interact(PlayerEntity player, World world, Hand hand, BlockHitResult hitResult);
}
```

### 2.2 返回值语义 (ActionResult)

| 返回值 | 客户端行为 | 服务端行为 |
|--------|-----------|-----------|
| `SUCCESS` | 取消后续处理，发送数据包 | 取消后续处理 |
| `PASS` | 继续处理 | 继续处理 |
| `FAIL` | 取消处理，不发包 | 取消处理 |
| `CONSUME` | 取消处理，发包，无手臂摆动 | - |

### 2.3 PlayerBlockBreakEvents (方块破坏事件)

```java
public final class PlayerBlockBreakEvents {
    // 破坏前，可取消
    public static final Event<Before> BEFORE = ...;

    // 成功破坏后
    public static final Event<After> AFTER = ...;

    // 被取消时
    public static final Event<Canceled> CANCELED = ...;
}
```

---

## 3. fabric-lifecycle-events-v1 模块

### 3.1 ServerLifecycleEvents (服务端生命周期)

```java
public final class ServerLifecycleEvents {
    // 服务端启动前（玩家管理器和世界未加载）
    public static final Event<ServerStarting> SERVER_STARTING = ...;

    // 服务端启动完成（所有世界已加载）
    public static final Event<ServerStarted> SERVER_STARTED = ...;

    // 服务端开始关闭
    public static final Event<ServerStopping> SERVER_STOPPING = ...;

    // 服务端已关闭
    public static final Event<ServerStopped> SERVER_STOPPED = ...;
}
```

### 3.2 服务端生命周期时序

```
┌─────────────────────────────────────────────────────────┐
│  SERVER_STARTING                                       │
│    - PlayerManager 未初始化                             │
│    - 世界未加载                                         │
├─────────────────────────────────────────────────────────┤
│  SERVER_STARTED                                        │
│    - 所有世界已加载                                     │
│    - 即将开始第一次 tick                                │
├─────────────────────────────────────────────────────────┤
│  [正常运行 - 循环调用 TICK 事件]                         │
├─────────────────────────────────────────────────────────┤
│  SERVER_STOPPING                                       │
│    - 网络通道即将关闭                                   │
│    - 玩家即将断开连接                                   │
├─────────────────────────────────────────────────────────┤
│  SERVER_STOPPED                                        │
│    - 所有世界已关闭                                     │
│    - 所有实体已卸载                                     │
└─────────────────────────────────────────────────────────┘
```

### 3.3 ServerTickEvents (刻事件)

```java
public final class ServerTickEvents {
    // 服务端刻开始
    public static final Event<StartTick> START_SERVER_TICK = ...;

    // 服务端刻结束
    public static final Event<EndTick> END_SERVER_TICK = ...;

    // 世界刻开始
    public static final Event<StartWorldTick> START_WORLD_TICK = ...;

    // 世界刻结束
    public static final Event<EndWorldTick> END_WORLD_TICK = ...;
}
```

### 3.4 ServerChunkEvents (区块事件)

```java
public final class ServerChunkEvents {
    // 区块加载
    public static final Event<Load> CHUNK_LOAD = ...;

    // 新生成区块加载
    public static final Event<Generate> CHUNK_GENERATE = ...;

    // 区块卸载
    public static final Event<Unload> CHUNK_UNLOAD = ...;

    // 区块活跃等级变化
    public static final Event<LevelTypeChange> CHUNK_LEVEL_TYPE_CHANGE = ...;
}
```

---

## 4. Mixin 注入点汇总

### fabric-entity-events-v1

| 目标类 | 方法 | 事件 |
|--------|------|------|
| `LivingEntity` | `damage` | `ALLOW_DAMAGE`, `AFTER_DAMAGE` |
| `LivingEntity` | `damage` | `ALLOW_DEATH` |
| `LivingEntity` | `onDeath` | `AFTER_DEATH` |
| `LivingEntity` | `sleep` | `START_SLEEPING` |
| `LivingEntity` | `wakeUp` | `STOP_SLEEPING` |
| `ServerPlayerEntity` | `worldChanged` | `AFTER_PLAYER_CHANGE_WORLD` |
| `ServerPlayerEntity` | `copyFrom` | `COPY_FROM` |
| `PlayerManager` | `onPlayerConnect` | `JOIN` |
| `PlayerManager` | `remove` | `LEAVE` |
| `PlayerManager` | `respawnPlayer` | `AFTER_RESPAWN` |

### fabric-events-interaction-v0

| 目标类 | 方法 | 事件 |
|--------|------|------|
| `ServerPlayerInteractionManager` | `processBlockBreakingAction` | `AttackBlockCallback` |
| `ServerPlayerInteractionManager` | `interactBlock` | `UseBlockCallback` |
| `ServerPlayerInteractionManager` | `interactItem` | `UseItemCallback` |
| `ServerPlayerInteractionManager` | `tryBreakBlock` | `PlayerBlockBreakEvents.BEFORE/AFTER` |

---

## 5. 使用示例

### 5.1 监听实体死亡事件

```java
// 玩家在特定条件下可免死
ServerLivingEntityEvents.ALLOW_DEATH.register((entity, damageSource, damageAmount) -> {
    if (entity instanceof ServerPlayerEntity player) {
        if (player.getInventory().contains(ItemStackPredicate.BLESSED_AMULET)) {
            player.getInventory().remove(ItemStackPredicate.BLESSED_AMULET);
            player.setHealth(1.0f);
            return false; // 取消死亡
        }
    }
    return true;
});

ServerLivingEntityEvents.AFTER_DEATH.register((entity, damageSource) -> {
    if (entity instanceof CreeperEntity creeper) {
        entity.getWorld().spawnEntity(new ItemEntity(
            entity.getWorld(), entity.getX(), entity.getY(), entity.getZ(),
            new ItemStack(Items.GUNPOWDER, 3)
        ));
    }
});
```

### 5.2 拦截方块交互

```java
UseBlockCallback.EVENT.register((player, world, hand, hitResult) -> {
    if (world.getBlockState(hitResult.getBlockPos()).isOf(Blocks.ENDER_CHEST)) {
        if (!player.hasPermissionLevel(2)) {
            player.sendMessage(Text.literal("You need admin permission!"));
            return ActionResult.FAIL;
        }
    }
    return ActionResult.PASS;
});
```

### 5.3 服务端刻事件

```java
ServerTickEvents.END_SERVER_TICK.register(server -> {
    // 每刻检查逻辑
    if (shouldSpawnMob) {
        spawnCustomMob(server);
    }
});

ServerTickEvents.END_WORLD_TICK.register(world -> {
    // 世界特定逻辑
    if (world.getDimensionKey() == RegistryKey.of(Registry.WORLD_KEY, new Identifier("my_nether"))) {
        // 地狱特定处理
    }
});
```

---

## 架构总结

```
┌─────────────────────────────────────────────────────────────┐
│                    事件层 (Event System)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────┐ │
│  │ ServerLiving    │  │ ServerPlayer     │  │ Server  │ │
│  │ EntityEvents    │  │ Events           │  │ Lifecycle│ │
│  ├──────────────────┤  ├──────────────────┤  ├─────────┤ │
│  │ ALLOW_DAMAGE    │  │ COPY_FROM        │  │ SERVER  │ │
│  │ AFTER_DAMAGE    │  │ AFTER_RESPAWN   │  │ STARTING │ │
│  │ ALLOW_DEATH    │  │ JOIN            │  │ SERVER  │ │
│  │ AFTER_DEATH    │  │ LEAVE           │  │ STARTED │ │
│  │ MOB_CONVERSION │  │                 │  │ SERVER  │ │
│  └──────────────────┘  └──────────────────┘  │ STOPPING │ │
│                                              │ SERVER   │ │
│  ┌──────────────────┐  ┌──────────────────┐  │ STOPPED  │ │
│  │ Interaction      │  │ Lifecycle        │  └─────────┘ │
│  │ Events           │  │ Events           │              │
│  ├──────────────────┤  ├──────────────────┤              │
│  │ UseBlockCallback │  │ ServerTickEvents │              │
│  │ UseItemCallback  │  │ ServerChunkEvents│              │
│  │ AttackBlockCb    │  │ ServerWorldEvents│              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

*源码位置: `fabric-entity-events-v1/`, `fabric-events-interaction-v0/`, `fabric-lifecycle-events-v1/`*
