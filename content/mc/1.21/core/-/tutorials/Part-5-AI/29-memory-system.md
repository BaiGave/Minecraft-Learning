---
title: 第 29 章：Memory 记忆系统（Memory System）
readingTime: 40
---

# 第 29 章：Memory 记忆系统（Memory System）

> 深入了解实体的"短期记忆"和"长期记忆"

---

## 章节目标

- 理解 Memory 模块的设计理念
- 掌握 MemoryModuleType 的各种类型
- 了解 Memory 的生命周期管理
- 理解 Memory 如何被 Sensor 更新
- 掌握如何在 Task 中使用 Memory

## 前置知识

- 熟悉 Brain 系统的基本概念
- 了解 Java 泛型和 Optional

## 核心概念

### Memory = 实体的"记忆"

想象你是一个村民：
- 🏠 **长期记忆**：我的家在哪里、工作站是什么
- 👤 **短期记忆**：刚才看到有个僵尸在攻击我！
- ⏰ **时间记忆**：我上次睡觉是什么时候

**Memory 系统就是 Minecraft 生物的"记忆"机制！**

## 1. Memory 设计理念

### 为什么需要 Memory？

旧系统的痛点：
- ❌ 生物只能感知"当前"状态
- ❌ 无法记住"刚才"发生了什么
- ❌ 生物之间没有"共享信息"的能力

Memory 系统的优势：
- ✅ 可以存储"历史"信息
- ✅ 可以设置"过期时间"
- ✅ 可以被多个系统共享

### Memory vs 实体字段对比

| 特性 | 直接存储字段 | Memory 系统 |
|------|-------------|-------------|
| 过期机制 | ❌ 无 | ✅ 有 |
| 查询接口 | 直接访问 | 通过 Brain 查询 |
| 序列化 | 复杂 | ✅ 统一 |
| 共享访问 | 困难 | ✅ 容易 |

## 2. MemoryModuleType 详解

### MemoryModuleType 结构

```java
// MemoryModuleType.java
public class MemoryModuleType<V> {
    private final String id;
    private final int expiryTicks;  // 过期时间
    private final Codec<V> codec;  // 序列化编解码器
    
    // 创建新的 MemoryModuleType
    public static <V> MemoryModuleType<V> createCodec(
        String id,
        int expiryTicks,
        Codec<V> codec
    ) {
        return new MemoryModuleType<>(id, expiryTicks, codec);
    }
}
```

### 位置相关 Memory

```java
// 位置类型的记忆
public static final MemoryModuleType<GlobalPos> HOME = 
    MemoryModuleType.createCodec("home", 1, GlobalPos.CODEC);

public static final MemoryModuleType<GlobalPos> JOB_SITE = 
    MemoryModuleType.createCodec("job_site", 1, GlobalPos.CODEC);

public static final MemoryModuleType<GlobalPos> MEETING_POINT = 
    MemoryModuleType.createCodec("meeting_point", 1, GlobalPos.CODEC);

public static final MemoryModuleType<GlobalPos> SECONDARY_JOB_SITE = 
    MemoryModuleType.createCodec("secondary_job_site", 1, GlobalPos.CODEC);

public static final MemoryModuleType<GlobalPos> INVALID = 
    MemoryModuleType.createCodec("invalid", 1, GlobalPos.CODEC);
```

### 实体相关 Memory

```java
// 实体类型的记忆
public static final MemoryModuleType<LivingEntity> NEAREST_VISIBLE_PLAYER = 
    MemoryModuleType.createCodec("nearest_visible_player", 1, LivingEntity.CODEC);

public static final MemoryModuleType<LivingEntity> NEAREST_VISIBLE_HOSTILE = 
    MemoryModuleType.createCodec("nearest_visible_hostile", 1, LivingEntity.CODEC);

public static final MemoryModuleType<LivingEntity> NEAREST_ATTACKABLE = 
    MemoryModuleType.createCodec("nearest_attackable", 1, LivingEntity.CODEC);

public static final MemoryModuleType<LivingEntity> HURT_BY_ENTITY = 
    MemoryModuleType.createCodec("hurt_by_entity", 1, LivingEntity.CODEC);

public static final MemoryModuleType<LivingEntity> INTERACTION_TARGET = 
    MemoryModuleType.createCodec("interaction_target", 1, LivingEntity.CODEC);

public static final MemoryModuleType<VillagerEntity> VILLAGER_HOSTILE_TARGET = 
    MemoryModuleType.createCodec("villager_hostile_target", 1, VillagerEntity.CODEC);
```

### 列表类型 Memory

```java
// 列表类型的记忆
public static final MemoryModuleType<List<LivingEntity>> NEAREST_VISIBLE_HOSTILE = 
    MemoryModuleType.createCodec("nearest_visible_hostile", 1, LivingEntity.LIST_CODEC);

public static final MemoryModuleType<List<LivingEntity>> VISIBLE_MOBS = 
    MemoryModuleType.createCodec("visible_mobs", 1, LivingEntity.LIST_CODEC);

public static final MemoryModuleType<List<LivingEntity>> NEAREST_MOBS = 
    MemoryModuleType.createCodec("nearest_mobs", 1, LivingEntity.LIST_CODEC);

public static final MemoryModuleType<List<GlobalPos>> INTERESTS = 
    MemoryModuleType.createCodec("interests", 1, GlobalPos.LIST_CODEC);

public static final MemoryModuleType<List<GlobalPos>> SECONDARY_INTERESTS = 
    MemoryModuleType.createCodec("secondary_interests", 1, GlobalPos.LIST_CODEC);
```

### 布尔类型 Memory

```java
// 布尔类型的记忆
public static final MemoryModuleType<Boolean> IS_SITTING = 
    MemoryModuleType.createCodec("is_sitting", 1, Codec.BOOL);

public static final MemoryModuleType<Boolean> IS_STUNNED = 
    MemoryModuleType.createCodec("is_stunned", 1, Codec.BOOL);

public static final MemoryModuleType<Boolean> IS_PANICKING = 
    MemoryModuleType.createCodec("is_panicking", 1, Codec.BOOL);

public static final MemoryModuleType<Boolean> CAN_GO_HOME = 
    MemoryModuleType.createCodec("can_go_home", 1, Codec.BOOL);
```

### 时间类型 Memory

```java
// 时间/计数类型的记忆
public static final MemoryModuleType<Long> LAST_SLEPT = 
    MemoryModuleType.createCodec("last_slept", 1, LongCodecs.NON_NEGATIVE_LONG);

public static final MemoryModuleType<Long> LAST_WOKEN = 
    MemoryModuleType.createCodec("last_woken", 1, LongCodecs.NON_NEGATIVE_LONG);

public static final MemoryModuleType<Long> LAST_WORKED_AT_POI = 
    MemoryModuleType.createCodec("last_worked_at_poi", 1, LongCodecs.NON_NEGATIVE_LONG);

public static final MemoryModuleType<Integer> MEETING_TIME = 
    MemoryModuleType.createCodec("meeting_time", 1, IntCodecs.POSITIVE_INT);
```

## 3. Memory 生命周期

### MemoryExpiry 过期管理

```java
// MemoryExpiry.java
public class MemoryExpiry {
    
    // 为 Memory 设置过期时间
    public static <T> void forgetMemoryWhen(
        Brain<?> brain,
        MemoryModuleType<T> memoryType,
        Predicate<T> shouldForget
    ) {
        brain.getMemory(memoryType).ifPresent(value -> {
            if (shouldForget.test(value)) {
                brain.forget(memoryType);
            }
        });
    }
    
    // 定时忘记
    public static <T> void forgetMemoryAfter(
        Brain<?> brain,
        MemoryModuleType<T> memoryType,
        int ticks
    ) {
        brain.getMemory(memoryType).ifPresent(value -> {
            // 检查时间戳
        });
    }
}
```

### 内置过期条件

```java
// VillageRiseToVillageBoundaryTask.java
public class VillageRiseToVillageBoundaryTask extends Task<VillagerEntity> {
    
    @Override
    public boolean shouldRun(ServerWorld world, VillagerEntity entity) {
        // 检查记忆是否过期
        return entity.getBrain().hasMemory(MemoryModuleType.MEETING_POINT) &&
               !entity.getBrain().hasMemoryValueThat(
                   MemoryModuleType.MEETING_TIME,
                   time -> world.getTime() - time > 24000  // 超过一天
               );
    }
}
```

### 常用过期策略

```java
// 常见过期策略
public class MemoryStrategies {
    
    // 立即过期
    public static <T> Predicate<T> IMMEDIATELY = value -> true;
    
    // 永不过期
    public static <T> Predicate<T> NEVER = value -> false;
    
    // 一段时间后过期
    public static <T> Predicate<T> afterTicks(long ticks) {
        return value -> {
            // 检查创建时间
            return currentTime - createTime > ticks;
        };
    }
}
```

## 4. Sensor 更新 Memory

### Sensor 工作流程

```java
// Sensor.java
public abstract class Sensor<D extends Entity> {
    protected final int range;
    
    // 每个 tick 传感器运行
    public void tick(ServerWorld world, D entity) {
        if (this.activated) {
            this.sense(world, entity);
        }
    }
    
    // 具体的感知逻辑（子类实现）
    protected abstract void sense(ServerWorld world, D entity);
}
```

### NearestVisibleLivingEntitySensor 示例

```java
// NearestVisibleLivingEntitySensor.java
public class NearestVisibleLivingEntitySensor extends Sensor<CreatureEntity> {
    
    @Override
    protected void sense(ServerWorld world, CreatureEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 1. 获取所有可见实体
        List<LivingEntity> visibleEntities = this.getVisibleEntities(entity, 16.0);
        
        // 2. 分类存储
        // 最近可见玩家
        brain.remember(MemoryModuleType.NEAREST_VISIBLE_PLAYER,
            this.findNearest(visibleEntities, player -> player instanceof PlayerEntity)
        );
        
        // 最近可见敌对实体
        brain.remember(MemoryModuleType.NEAREST_VISIBLE_HOSTILE,
            this.findNearest(visibleEntities, this::isHostile)
        );
        
        // 可攻击的最近实体
        brain.remember(MemoryModuleType.NEAREST_ATTACKABLE,
            this.findNearestAttackable(visibleEntities)
        );
    }
}
```

### HurtBySensor 示例

```java
// HurtBySensor.java
public class HurtBySensor extends Sensor<CreatureEntity> {
    
    @Override
    protected void sense(ServerWorld world, CreatureEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 检查是否受伤
        if (entity.hadWorld()) {
            DamageTracker tracker = entity.getDamageTracker();
            DamageSource lastDamageSource = tracker.getMostRecentDamage();
            
            if (lastDamageSource != null) {
                Entity attacker = lastDamageSource.getAttacker();
                
                if (attacker instanceof LivingEntity livingAttacker) {
                    // 记住伤害来源
                    brain.remember(MemoryModuleType.HURT_BY_ENTITY, livingAttacker, 100);
                    // 触发恐慌
                    brain.remember(MemoryModuleType.IS_PANICKING, true, 200);
                }
            }
        }
    }
}
```

## 5. Task 中使用 Memory

### 读取 Memory

```java
// WalkToTargetTask.java
public class WalkToTargetTask extends Task<CreatureEntity> {
    
    @Override
    public void tick(ServerWorld world, CreatureEntity entity, long time) {
        // 获取目标位置
        Optional<BlockPos> targetOpt = entity.getBrain()
            .getMemory(MemoryModuleType.WALK_TARGET);
        
        if (targetOpt.isPresent()) {
            BlockPos target = targetOpt.get();
            
            // 检查是否到达
            if (target.isWithinDistance(entity.getPos(), 2.0)) {
                // 到达目标，清除记忆
                entity.getBrain().forget(MemoryModuleType.WALK_TARGET);
                this.stop(world, entity, time);
                return;
            }
            
            // 移动到目标
            double speed = this.speed;
            entity.getNavigation().startMovingTo(
                target.getX(), target.getY(), target.getZ(),
                speed
            );
        }
    }
}
```

### 条件检查

```java
// MeleeAttackTask.java
public class MeleeAttackTask extends Task<MobEntity> {
    
    @Override
    public boolean shouldRun(ServerWorld world, MobEntity entity, long time) {
        // 检查是否有攻击目标
        Optional<LivingEntity> targetOpt = entity.getBrain()
            .getMemory(MemoryModuleType.NEAREST_ATTACKABLE);
        
        return targetOpt.isPresent() &&
               this.isTargetInRange(entity, targetOpt.get());
    }
    
    private boolean isTargetInRange(MobEntity entity, LivingEntity target) {
        double squaredDistance = entity.squaredDistanceTo(target);
        double attackRange = 2.0;  // 2 格攻击范围
        
        return squaredDistance < attackRange * attackRange;
    }
}
```

### 写入 Memory

```java
// ActiveTargetTask.java
public class ActiveTargetTask<T extends LivingEntity> extends Task<MobEntity> {
    private final Predicate<LivingEntity> targetPredicate;
    
    @Override
    public void tick(ServerWorld world, MobEntity entity, long time) {
        // 从传感器数据中找目标
        List<LivingEntity> visibleEntities = entity.getBrain()
            .getMemory(MemoryModuleType.NEAREST_VISIBLE_HOSTILE)
            .orElse(Collections.emptyList());
        
        // 筛选有效目标
        LivingEntity nearestTarget = visibleEntities.stream()
            .filter(this.targetPredicate)
            .min((a, b) -> Double.compare(
                entity.squaredDistanceTo(a),
                entity.squaredDistanceTo(b)
            ))
            .orElse(null);
        
        // 写入目标记忆
        if (nearestTarget != null) {
            entity.getBrain().remember(MemoryModuleType.NEAREST_ATTACKABLE, nearestTarget);
        }
    }
}
```

## 6. Memory 共享（村民示例）

### 村民之间的信息共享

```java
// VillagerBrain.java
public class VillagerBrain {
    
    public static void registerVillagerActivities() {
        // Golem 感知共享
        Brain<VillagerEntity> brain = villager.getBrain();
        
        // 检查是否有铁傀儡在附近（通过记忆共享）
        brain.remember(MemoryModuleType.NEAREST_VISIBLE_PLAYER, nearestPlayer);
        
        // 如果附近有僵尸，村民会记住
        if (brain.hasMemory(MemoryModuleType.VILLAGER_HOSTILE_TARGET)) {
            // 进入警戒状态
            brain.addActivity(Activity.VILLAGER_HOSTILES, ...);
        }
    }
}
```

### 村民-铁傀儡协作

```java
// IronGolemEntity.java
public class IronGolemEntity extends GolemEntity {
    
    @Override
    protected void sense(ServerWorld world, IronGolemEntity entity) {
        Brain<IronGolemEntity> brain = entity.getBrain();
        
        // 感知附近的村民
        brain.remember(MemoryModuleType.NEAREST_VISIBLE_PLAYER, ...);
        
        // 感知攻击目标
        if (entity.isAttacking()) {
            brain.remember(MemoryModuleType.ATTACK_TARGET, entity.getTarget());
        }
    }
}
```

## Mermaid 图表：Memory 生命周期

```mermaid
flowchart TD
    A["Sensor 感知"] -->|"更新数据"| B["Memory 写入"]
    
    B --> C{"设置过期时间?"}
    C -->|"是| D["记录时间戳"]
    C -->|"否| E["永不过期"]
    
    D --> F["Brain 存储"]
    E --> F
    
    F --> G["Task 读取"]
    
    G --> H{"条件检查"}
    H -->|"通过| I["执行行为"]
    H -->|"失败| J["跳过"]
    
    I --> K["修改 Memory"]
    
    K --> L{"超时?"}
    L -->|"是| M["自动清除"]
    L -->|"否| F
    
    M --> N["触发事件"]
    N --> F
    
    subgraph TimeBased["时间驱动"]
        T1["24:00 清除睡眠记忆"]
        T2["1分钟 清除恐慌状态"]
        T3["5秒 清除看向目标"]
    end
    
    F --> TimeBased
```

## 实战演示：创建自定义 Memory

### 1. 定义 Memory 类型

```java
public class MyModMemory {
    
    // 自定义记忆：最喜欢的食物位置
    public static final MemoryModuleType<GlobalPos> FAVORITE_FOOD_POS = 
        MemoryModuleType.createCodec(
            "favorite_food_pos",
            1,  // 永不过期
            GlobalPos.CODEC
        );
    
    // 自定义记忆：恐惧目标
    public static final MemoryModuleType<LivingEntity> SCARED_BY = 
        MemoryModuleType.createCodec(
            "scared_by",
            200,  // 10 秒过期
            LivingEntity.CODEC
        );
    
    // 自定义记忆：是否被驯服
    public static final MemoryModuleType<Boolean> IS_TAMED = 
        MemoryModuleType.createCodec(
            "is_tamed",
            1,
            Codec.BOOL
        );
}
```

### 2. 创建自定义 Sensor

```java
public class FoodSensor extends Sensor<MyAnimalEntity> {
    
    @Override
    protected void sense(ServerWorld world, MyAnimalEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 查找食物
        BlockPos pos = this.findFood(entity);
        
        if (pos != null) {
            // 记住食物位置
            brain.remember(MyModMemory.FAVORITE_FOOD_POS, GlobalPos.create(
                world.getRegistryKey(),
                pos
            ));
        }
    }
    
    private BlockPos findFood(MyAnimalEntity entity) {
        // 在范围内搜索食物方块
        Box searchBox = new Box(
            entity.getX() - 8, entity.getY() - 4, entity.getZ() - 8,
            entity.getX() + 8, entity.getY() + 4, entity.getZ() + 8
        );
        
        // 查找最近的胡萝卜
        return world.findClosest(
            Blocks.CARROTS.getDefaultState(),
            false,
            pos -> true,
            entity.getPos(),
            8.0
        );
    }
}
```

### 3. 使用自定义 Memory

```java
public class EatFoodTask extends Task<MyAnimalEntity> {
    
    @Override
    public boolean shouldRun(ServerWorld world, MyAnimalEntity entity, long time) {
        // 需要有食物记忆
        return entity.getBrain().hasMemory(MyModMemory.FAVORITE_FOOD_POS);
    }
    
    @Override
    public void tick(ServerWorld world, MyAnimalEntity entity, long time) {
        Optional<GlobalPos> foodPosOpt = entity.getBrain()
            .getMemory(MyModMemory.FAVORITE_FOOD_POS);
        
        if (foodPosOpt.isPresent()) {
            GlobalPos foodPos = foodPosOpt.get();
            
            // 检查位置是否在同一个世界
            if (foodPos.getWorldKey() == world.getRegistryKey()) {
                BlockPos pos = foodPos.getPos();
                
                // 检查是否到达
                if (entity.getBlockPos().isWithinDistance(pos, 1.0)) {
                    // 吃掉食物
                    world.breakBlock(pos, false);
                    
                    // 治疗
                    entity.heal(2.0f);
                    
                    // 清除记忆
                    entity.getBrain().forget(MyModMemory.FAVORITE_FOOD_POS);
                    
                    this.stop(world, entity, time);
                } else {
                    // 移动到食物位置
                    entity.getNavigation().startMovingTo(
                        pos.getX(), pos.getY(), pos.getZ(), 1.0
                    );
                }
            }
        }
    }
}
```

## 课后自查

完成本章学习后，你应该能够：

- [ ] 解释 Memory 系统的设计理念
- [ ] 理解 MemoryModuleType 的创建方法
- [ ] 掌握不同类型 Memory 的使用场景
- [ ] 理解 Memory 的过期机制
- [ ] 知道 Sensor 如何更新 Memory
- [ ] 能够在 Task 中读写 Memory
- [ ] 能够创建自定义 Memory 类型

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 记忆模块 | MemoryModule | Brain 中存储的数据单元 |
| 记忆类型 | MemoryModuleType | 记忆的数据类型定义 |
| 过期时间 | Expiry | Memory 自动清除的时间 |
| 传感器更新 | Sensor Update | Sensor 写入新 Memory 的过程 |
| 记忆共享 | Memory Sharing | 多个实体共享 Memory |

---

**参考源码路径**：

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\memory\MemoryModuleType.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\memory\Memory.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\sensor\NearestVisibleLivingEntitySensor.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\sensor\HurtBySensor.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\task\WalkToTargetTask.java`
