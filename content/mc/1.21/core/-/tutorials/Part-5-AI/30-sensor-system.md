---
title: 第 30 章：Sensor 传感器（Sensor System）
readingTime: 40
---

# 第 30 章：Sensor 传感器（Sensor System）

> 深入了解实体的"眼睛、耳朵和触觉"

---

## 章节目标

- 理解 Sensor 的设计理念
- 掌握内置 Sensor 的工作原理
- 了解 Sensor 如何更新 Memory
- 理解 Sensor 的触发频率配置
- 能够创建自定义 Sensor

## 前置知识

- 熟悉 Brain 和 Memory 系统
- 了解 Java 泛型基础

## 核心概念

### Sensor = 实体的"感觉器官"

想象你是一个感知世界的生物：
- 👀 **视觉**：看到前方有玩家
- 👂 **听觉**：听到附近有爆炸声
- 🖐️ **触觉**：刚才被箭射中了
- 🧠 **直觉**：能感觉到蜘蛛网在附近

**Sensor 就是 Minecraft 生物感知世界的方式！**

## 1. Sensor 设计理念

### 为什么需要 Sensor？

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sensor 在 Brain 中的位置                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│   世界 ──► [Sensor] ──► [Memory] ──► [Task] ──► [执行]          │
│                                                                     │
│   Sensor = 收集信息                                                │
│   Memory = 存储信息                                                │
│   Task   = 使用信息                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Sensor vs 直接访问

| 方式 | 优点 | 缺点 |
|------|------|------|
| Sensor | ✅ 集中管理、统一更新 | 略有延迟 |
| 直接访问 | ✅ 实时 | ❌ 难以管理、容易冲突 |

## 2. Sensor 基础结构

### Sensor 接口

```java
// Sensor.java
public abstract class Sensor<D extends Entity> {
    // 感知范围
    protected final int range;
    
    // 是否激活
    private boolean activated = true;
    
    // 计时器
    private int sensorTimer;
    
    // 运行间隔（ticks）
    private static final int SENSOR_TICK_INTERVAL = 20;  // 每秒检查一次
    
    // 感知方法（子类实现）
    protected abstract void sense(ServerWorld world, D entity);
    
    // 每 tick 更新
    public void tick(ServerWorld world, D entity) {
        if (!this.activated) {
            return;
        }
        
        // 间隔检查
        if (++this.sensorTimer >= SENSOR_TICK_INTERVAL) {
            this.sensorTimer = 0;
            this.sense(world, entity);
        }
    }
}
```

### SensorType 注册

```java
// SensorType.java
public class SensorType<D extends Entity> implements RegistryEntry<SensorType<D>> {
    private final Identifier id;
    private final Supplier<Sensor<D>> sensorFactory;
    
    // 创建新的 SensorType
    public static <D extends Entity> SensorType<D> create(
        String id,
        Supplier<Sensor<D>> factory
    ) {
        return new SensorType<>(Identifier.ofVanilla(id), factory);
    }
}
```

## 3. 内置 Sensor 详解

### 3.1 NearestVisibleLivingEntitySensor 最近可见实体

**功能**：感知最近可见的生物

```java
// NearestVisibleLivingEntitySensor.java
public class NearestVisibleLivingEntitySensor extends Sensor<CreatureEntity> {
    
    @Override
    protected void sense(ServerWorld world, CreatureEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 1. 获取所有可见实体
        List<LivingEntity> visibleEntities = this.getVisibleEntities(entity);
        
        // 2. 存储最近玩家
        brain.remember(MemoryModuleType.NEAREST_VISIBLE_PLAYER,
            this.getNearestPlayer(visibleEntities));
        
        // 3. 存储最近敌对实体
        brain.remember(MemoryModuleType.NEAREST_VISIBLE_HOSTILE,
            this.getNearestHostile(visibleEntities));
        
        // 4. 存储可攻击目标
        brain.remember(MemoryModuleType.NEAREST_ATTACKABLE,
            this.getNearestAttackable(entity, visibleEntities));
    }
    
    private List<LivingEntity> getVisibleEntities(CreatureEntity entity) {
        // 搜索范围：16 格
        Box searchBox = this.createSearchBox(entity, 16.0);
        
        // 获取该范围内所有生物
        return world.getEntitiesByClass(
            LivingEntity.class,
            searchBox,
            entity -> entity != entity  // 排除自己
        ).stream()
            .filter(this::isEntityVisible)
            .collect(Collectors.toList());
    }
    
    private boolean isEntityVisible(LivingEntity entity) {
        // 1. 检查距离
        double distance = entity.squaredDistanceTo(entity);
        if (distance > 16.0 * 16.0) {
            return false;
        }
        
        // 2. 检查视线（直线可见）
        return this.hasLineOfSight(entity, entity);
    }
}
```

### 3.2 HurtBySensor 受伤感知

**功能**：记住伤害来源

```java
// HurtBySensor.java
public class HurtBySensor extends Sensor<CreatureEntity> {
    
    @Override
    protected void sense(ServerWorld world, CreatureEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 检查是否有最近伤害
        DamageTracker tracker = entity.getDamageTracker();
        DamageSource recentDamage = tracker.getMostRecentDamage();
        
        if (recentDamage != null && recentDamage.getAttacker() instanceof LivingEntity attacker) {
            // 记住攻击者（10 秒后过期）
            brain.remember(MemoryModuleType.HURT_BY_ENTITY, attacker, 200);
            
            // 如果正在逃跑，延长逃跑时间
            if (brain.hasMemory(MemoryModuleType.IS_PANICKING)) {
                brain.remember(MemoryModuleType.IS_PANICKING, true, 200);
            }
        }
    }
}
```

### 3.3 NearestBedSensor 床感知

**功能**：感知附近的床（用于幻翼）

```java
// NearestBedSensor.java
public class NearestBedSensor extends Sensor<PhantomEntity> {
    
    @Override
    protected void sense(ServerWorld world, PhantomEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 只有在白天感知床位置
        if (!world.isDay()) {
            brain.forget(MemoryModuleType.NEAREST_BED);
            return;
        }
        
        // 在范围内搜索床
        BlockPos nearestBed = world.findNearest(
            BlockTags.BEDS,
            entity.getBlockPos(),
            8,  // 搜索范围
            64   // 最大距离
        );
        
        if (nearestBed != null) {
            brain.remember(MemoryModuleType.NEAREST_BED, GlobalPos.create(
                world.getRegistryKey(),
                nearestBed
            ));
        } else {
            brain.forget(MemoryModuleType.NEAREST_BED);
        }
    }
}
```

### 3.4 GolemSensor 铁傀儡感知

**功能**：村民感知铁傀儡

```java
// GolemSensor.java
public class GolemSensor extends Sensor<VillagerEntity> {
    
    @Override
    protected void sense(ServerWorld world, VillagerEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 查找附近的铁傀儡
        IronGolemEntity nearestGolem = world.getClosestEntity(
            IronGolemEntity.class,
            entity.getPos(),
            10.0,  // 10 格范围
            entity
        );
        
        brain.remember(MemoryModuleType.GOLEM_DETECTED, nearestGolem != null);
    }
}
```

### 3.5 VillagerHostilesSensor 敌对感知

**功能**：村民感知附近的敌对实体

```java
// VillagerHostilesSensor.java
public class VillagerHostilesSensor extends Sensor<VillagerEntity> {
    
    @Override
    protected void sense(ServerWorld world, VillagerEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 搜索范围内的敌对实体
        Box searchBox = this.createSearchBox(entity, 8.0);
        
        // 查找攻击村民的实体
        List<LivingEntity> hostileEntities = world.getEntitiesByClass(
            LivingEntity.class,
            searchBox,
            this::isHostileToVillager
        );
        
        // 如果有敌对实体，记住
        if (!hostileEntities.isEmpty()) {
            // 按距离排序
            hostileEntities.sort((a, b) -> Double.compare(
                entity.squaredDistanceTo(a),
                entity.squaredDistanceTo(b)
            ));
            
            // 记住最近的敌对实体
            brain.remember(MemoryModuleType.VILLAGER_HOSTILE_TARGET, 
                hostileEntities.get(0));
        } else {
            brain.forget(MemoryModuleType.VILLAGER_HOSTILE_TARGET);
        }
    }
    
    private boolean isHostileToVillager(LivingEntity entity) {
        // 僵尸、尸壳、劫掠兽等会攻击村民
        return entity instanceof ZombieEntity ||
               entity instanceof RavagerEntity ||
               entity instanceof VexEntity;
    }
}
```

### 3.6 DummySensor 空传感器

**功能**：不做任何事的占位符

```java
// DummySensor.java
public class DummySensor extends Sensor<DummyEntity> {
    
    @Override
    protected void sense(ServerWorld world, DummyEntity entity) {
        // 什么也不做
    }
}
```

## 4. Sensor 配置

### 感知范围配置

```java
// Sensor 感知范围
public class SensorRanges {
    // 近距离：4 格
    public static final int CLOSE = 4;
    
    // 中距离：8 格
    public static final int MEDIUM = 8;
    
    // 正常距离：16 格
    public static final int NORMAL = 16;
    
    // 远距离：32 格
    public static final int FAR = 32;
    
    // 超远距离：64 格
    public static final int VERY_FAR = 64;
}

// 配置示例
public class CatSensor extends Sensor<CatEntity> {
    // 猫能感知 8 格范围内的实体
    public CatSensor() {
        super(8);
    }
}
```

### 触发频率配置

```java
// SensorType 中的触发间隔
public static final int DEFAULT_TICK_INTERVAL = 20;  // 1 秒

// 修改触发间隔
public class SlowSensor extends Sensor<MyEntity> {
    // 每 2 秒触发一次
    private int sensorTimer = 0;
    private static final int TICK_INTERVAL = 40;
    
    @Override
    public void tick(ServerWorld world, MyEntity entity) {
        if (!this.activated) {
            return;
        }
        
        if (++this.sensorTimer >= TICK_INTERVAL) {
            this.sensorTimer = 0;
            this.sense(world, entity);
        }
    }
}
```

## 5. 自定义 Sensor

### 创建步骤

```java
// 步骤 1：创建 Sensor 类
public class FoodSensor extends Sensor<MyAnimalEntity> {
    
    public FoodSensor() {
        super(8);  // 8 格感知范围
    }
    
    @Override
    protected void sense(ServerWorld world, MyAnimalEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 查找食物
        Optional<BlockPos> foodPos = this.findFood(entity);
        
        if (foodPos.isPresent()) {
            brain.remember(
                MyModMemoryTypes.NEAREST_FOOD, 
                GlobalPos.create(world.getRegistryKey(), foodPos.get())
            );
        } else {
            brain.forget(MyModMemoryTypes.NEAREST_FOOD);
        }
    }
    
    private Optional<BlockPos> findFood(MyAnimalEntity entity) {
        // 在感知范围内搜索食物方块
        Box searchBox = this.createSearchBox(entity, (double) this.range);
        
        // 搜索逻辑...
        return Optional.empty();
    }
}

// 步骤 2：注册 SensorType
public class MyModSensors {
    public static final SensorType<MyAnimalEntity> FOOD_SENSOR = 
        SensorType.create("food_sensor", FoodSensor::new);
}

// 步骤 3：在 Brain Profile 中使用
public static Brain.Profile<MyAnimalEntity> createBrainProfile() {
    return Brain.Profile.create(
        "my_animal_brain",
        ImmutableList.of(
            // 内置传感器
            Sensor.NEAREST_LIVING,
            Sensor.HURT_BY,
            // 自定义传感器
            MyModSensors.FOOD_SENSOR
        ),
        // 记忆类型
        ImmutableList.of(
            MyModMemoryTypes.NEAREST_FOOD,
            MemoryModuleType.HURT_BY_ENTITY,
            MemoryModuleType.IS_PANICKING
        )
    );
}
```

## Mermaid 图表：Sensor 工作流程

```mermaid
flowchart TD
    A["每 tick"] --> B{"传感器计时器<br/>>= 20?"}
    
    B -->|"否| End["返回"]
    B -->|"是| C["重置计时器"]
    
    C --> D["执行 sense()"]
    
    D --> E["搜索附近实体"]
    E --> F{"找到目标?"}
    
    F -->|"是| G["过滤有效目标"]
    F -->|"否| H["清除记忆"]
    
    G --> I["计算距离"]
    I --> J["排序"]
    J --> K["存储到 Memory"]
    
    H --> End
    K --> End
    
    subgraph Filtering["目标过滤"]
        F1["检查距离"]
        F2["检查视线"]
        F3["检查类型"]
        F4["检查状态"]
    end
    
    E --> Filtering
    Filtering --> F
```

## 6. Sensor 性能优化

### 常见优化策略

```java
// 优化 1：使用缓存
public class CachedSensor extends Sensor<CreatureEntity> {
    private final Map<UUID, CachedEntity> cache = new HashMap<>();
    private int cacheTimer = 0;
    
    @Override
    protected void sense(ServerWorld world, CreatureEntity entity) {
        if (++cacheTimer < 10) {
            return;  // 10 ticks 不更新
        }
        cacheTimer = 0;
        
        // 正常感知逻辑...
    }
}

// 优化 2：按条件感知
public class ConditionalSensor extends Sensor<CreatureEntity> {
    
    @Override
    protected void sense(ServerWorld world, CreatureEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 只在需要时感知
        if (!brain.hasMemory(MemoryModuleType.IS_PANICKING)) {
            // 不需要感知敌对实体
            return;
        }
        
        // 感知逻辑...
    }
}

// 优化 3：空间分区搜索
public class OptimizedSensor extends Sensor<CreatureEntity> {
    
    @Override
    protected void sense(ServerWorld world, CreatureEntity entity) {
        // 使用空间索引快速查找
        Chunk chunk = world.getChunk(entity.getBlockPos());
        
        // 只搜索相关区块的实体
        List<LivingEntity> entities = chunk.getEntitiesOfClass(
            LivingEntity.class,
            searchBox
        );
    }
}
```

## 实战演示：创建一个"危险感知" Sensor

### 需求

- 感知附近的岩浆、火焰
- 感知附近的 TNT
- 感知附近的仙人掌

### 实现

```java
public class DangerSensor extends Sensor<MyCreatureEntity> {
    
    public DangerSensor() {
        super(6);  // 6 格范围
    }
    
    @Override
    protected void sense(ServerWorld world, MyCreatureEntity entity) {
        Brain<?> brain = entity.getBrain();
        
        // 查找最近的危险
        Optional<BlockPos> nearestDanger = this.findNearestDanger(entity);
        
        if (nearestDanger.isPresent()) {
            // 记住危险位置
            brain.remember(
                MyModMemoryTypes.NEAREST_DANGER,
                GlobalPos.create(world.getRegistryKey(), nearestDanger.get())
            );
            
            // 如果附近有危险且正在发呆，触发逃跑
            if (!brain.hasMemory(MemoryModuleType.IS_PANICKING)) {
                Optional<BlockPos> safeSpot = this.findSafeSpot(entity);
                safeSpot.ifPresent(pos -> 
                    brain.remember(MyModMemoryTypes.WALK_TARGET, pos)
                );
            }
        } else {
            brain.forget(MyModMemoryTypes.NEAREST_DANGER);
        }
    }
    
    private Optional<BlockPos> findNearestDanger(MyCreatureEntity entity) {
        World world = entity.getWorld();
        BlockPos center = entity.getBlockPos();
        
        // 搜索范围内的所有方块
        for (int x = -range; x <= range; x++) {
            for (int y = -range / 2; y <= range / 2; y++) {
                for (int z = -range; z <= range; z++) {
                    BlockPos check = center.add(x, y, z);
                    BlockState state = world.getBlockState(check);
                    
                    if (this.isDangerous(state)) {
                        return Optional.of(check);
                    }
                }
            }
        }
        
        return Optional.empty();
    }
    
    private boolean isDangerous(BlockState state) {
        Block block = state.getBlock();
        return block == Blocks.LAVA ||
               block == Blocks.FIRE ||
               block == Blocks.MAGMA_BLOCK ||
               block == Blocks.TNT ||
               block == Blocks.CACTUS;
    }
    
    private Optional<BlockPos> findSafeSpot(MyCreatureEntity entity) {
        // 简单的安全位置查找：向上或远离危险
        World world = entity.getWorld();
        BlockPos entityPos = entity.getBlockPos();
        
        // 向上搜索
        for (int y = entityPos.getY() + 1; y < world.getHeight(); y++) {
            BlockPos up = new BlockPos(entityPos.getX(), y, entityPos.getZ());
            if (world.getBlockState(up).isAir() &&
                world.getBlockState(up.down()).isSolidBlock()) {
                return Optional.of(up);
            }
        }
        
        return Optional.empty();
    }
}
```

## 课后自查

完成本章学习后，你应该能够：

- [ ] 解释 Sensor 在 Brain 系统中的作用
- [ ] 理解内置 Sensor 的工作原理
- [ ] 掌握 Sensor 的感知范围配置
- [ ] 理解 Sensor 的触发频率
- [ ] 能够创建自定义 Sensor
- [ ] 了解 Sensor 性能优化的方法

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 传感器 | Sensor | 收集环境信息的组件 |
| 感知范围 | Range | Sensor 能感知到的最大距离 |
| 视线检测 | Line of Sight | 检查两点之间是否有障碍 |
| 触发间隔 | Tick Interval | Sensor 更新的频率 |
| 目标过滤 | Filtering | 从候选实体中筛选有效目标 |

---

**参考源码路径**：

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\sensor\Sensor.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\sensor\NearestVisibleLivingEntitySensor.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\sensor\HurtBySensor.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\sensor\NearestBedSensor.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\sensor\VillagerHostilesSensor.java`
