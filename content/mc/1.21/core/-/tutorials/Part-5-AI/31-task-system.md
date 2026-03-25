---
title: 第 31 章：Task 任务系统（Task System）
readingTime: 45
---

# 第 31 章：Task 任务系统（Task System）

> 深入了解实体的"行为指令"

---

## 章节目标

- 理解 Task 的设计理念和生命周期
- 掌握 Task 的两种类型（TickTask 和 OneShotTask）
- 了解内置 Task 的实现原理
- 理解 Task 的优先级和互斥
- 能够创建自定义 Task

## 前置知识

- 熟悉 Brain 和 Memory 系统
- 了解 Java 泛型和函数式接口

## 核心概念

### Task = 大脑下达的"指令"

想象你是僵尸的大脑：
- 🧠 **思考**："玩家在 10 格外！"
- 📋 **决定**："我应该攻击他！"
- 📢 **下达指令**："Task 启动！移动并攻击！"

**Task 就是 Brain 决定"要做什么"后执行的具体行为！**

## 1. Task 设计理念

### Task vs Goal 对比

| 特性 | Goal 系统 | Task 系统 |
|------|-----------|-----------|
| 记忆访问 | ❌ 无 | ✅ 通过 Memory |
| 条件检查 | ✅ canStart() | ✅ shouldRun() |
| 运行模式 | 单次/循环 | ✅ Tick/一次性 |
| 互斥控制 | ✅ MutexFlags | ✅ Activity 隔离 |
| 状态管理 | 简单 | ✅ start/stop/tick |

### Task 生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                      Task 生命周期                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. shouldRun() ──► 2. start() ──► 3. tick() ──► 4. stop()       │
│      │                   │             │               │              │
│      ▼                   ▼             ▼               ▼              │
│  条件检查              初始化         每tick执行      清理              │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Task 基础结构

### Task 接口

```java
// Task.java
public abstract class Task<E extends Entity> implements Comparable<Task<?>> {
    // 默认优先级
    protected final int priority;
    
    // 运行间隔
    private final int ticksInterval;
    
    // 开始条件
    public abstract boolean shouldRun(ServerWorld world, E entity, long time);
    
    // 开始执行
    public void start(ServerWorld world, E entity, long time) {}
    
    // 每 tick 执行
    public abstract void tick(ServerWorld world, E entity, long time);
    
    // 停止执行
    public void stop(ServerWorld world, E entity, long time) {}
    
    // 运行间隔
    public int getTicksInterval() {
        return this.ticksInterval;
    }
    
    // 优先级
    public int getPriority() {
        return this.priority;
    }
}
```

### Task 实现示例

```java
// 简单的 Idle Task
public class IdleTask extends Task<CreatureEntity> {
    
    public IdleTask(int minDuration, int maxDuration) {
        super(0);
        this.minDuration = minDuration;
        this.maxDuration = maxDuration;
    }
    
    @Override
    public boolean shouldRun(ServerWorld world, CreatureEntity entity, long time) {
        // 总是运行
        return true;
    }
    
    @Override
    public void tick(ServerWorld world, CreatureEntity entity, long time) {
        // 播放 idle 动画或待机
        entity.setCharged(false);
    }
}
```

## 3. Task 类型详解

### 3.1 OneShotTask 一次性任务

**特点**：执行一次后自动停止

```java
// OneShotTask.java
public class OneShotTask<E extends Entity> extends Task<E> {
    private final Tickable task;
    
    public OneShotTask(Tickable task) {
        super(0);  // 一次性任务通常优先级较低
        this.task = task;
    }
    
    @Override
    public boolean shouldRun(ServerWorld world, E entity, long time) {
        return true;  // 由内部逻辑决定
    }
    
    @Override
    public void tick(ServerWorld world, E entity, long time) {
        // 执行任务，返回是否完成
        if (this.task.tick(entity)) {
            this.stop(world, entity, time);
        }
    }
}

// 使用示例
public static OneShotTask<ZombieEntity> createPanicTask() {
    return new OneShotTask<>(entity -> {
        // 逃跑逻辑
        if (entity.isInDanger()) {
            // 逃跑
            return false;  // 未完成
        }
        return true;  // 完成，停止
    });
}
```

### 3.2 CompositeTask 组合任务

**特点**：由多个子任务组成

```java
// SequenceTask.java - 按顺序执行
public class SequenceTask<E extends Entity> extends Task<E> {
    private final List<Task<? super E>> tasks;
    private int currentTaskIndex;
    
    @Override
    public boolean shouldRun(ServerWorld world, E entity, long time) {
        return this.tasks.get(this.currentTaskIndex).shouldRun(world, entity, time);
    }
    
    @Override
    public void start(ServerWorld world, E entity, long time) {
        this.currentTaskIndex = 0;
        this.tasks.get(0).start(world, entity, time);
    }
    
    @Override
    public void tick(ServerWorld world, E entity, long time) {
        Task<? super E> currentTask = this.tasks.get(this.currentTaskIndex);
        currentTask.tick(world, entity, time);
        
        // 检查当前任务是否完成
        if (!currentTask.shouldRun(world, entity, time)) {
            currentTask.stop(world, entity, time);
            this.currentTaskIndex++;
            
            // 如果还有下一个任务，启动它
            if (this.currentTaskIndex < this.tasks.size()) {
                this.tasks.get(this.currentTaskIndex).start(world, entity, time);
            } else {
                this.stop(world, entity, time);
            }
        }
    }
}

// 使用示例：破门后攻击
SequenceTask<ZombieEntity> breakDoorAndAttack = new SequenceTask<>(List.of(
    new BreakDoorGoal(zombie -> true),
    new MeleeAttackTask(1.0)
));
```

### 3.3 RandomTask 随机任务

```java
// RandomTask.java
public class RandomTask<E extends Entity> extends Task<E> {
    private final List<TickableTask<E>> tasks;
    private final IntStream weights;
    
    @Override
    public void tick(ServerWorld world, E entity, long time) {
        // 随机选择任务执行
    }
}

// 使用示例
RandomTask<VillagerEntity> idleBehaviors = new RandomTask<>(
    List.of(
        new IdleTask(30, 60),      // 站立发呆
        new StrollTask(0.6),        // 闲逛
        new LookAtEntityTask(...)   // 看向某物
    ),
    // 权重
    IntStream.of(3, 5, 2)
);
```

## 4. 内置 Task 详解

### 4.1 WalkToTargetTask 走向目标

```java
// WalkToTargetTask.java
public class WalkToTargetTask extends Task<CreatureEntity> {
    private static final int RUN_INTERVAL = 60;
    
    @Override
    public boolean shouldRun(ServerWorld world, CreatureEntity entity, long time) {
        return entity.getBrain().hasMemory(MemoryModuleType.WALK_TARGET);
    }
    
    @Override
    public void tick(ServerWorld world, CreatureEntity entity, long time) {
        // 获取目标位置
        Optional<BlockPos> targetOpt = entity.getBrain()
            .getMemory(MemoryModuleType.WALK_TARGET);
        
        if (targetOpt.isEmpty()) {
            this.stop(world, entity, time);
            return;
        }
        
        BlockPos target = targetOpt.get();
        
        // 检查是否到达
        if (target.isWithinDistance(entity.getPos(), 2.0)) {
            entity.getBrain().forget(MemoryModuleType.WALK_TARGET);
            this.stop(world, entity, time);
            return;
        }
        
        // 移动到目标
        entity.getNavigation().startMovingTo(
            target.getX(), target.getY(), target.getZ(),
            1.0
        );
    }
    
    @Override
    public void stop(ServerWorld world, CreatureEntity entity, long time) {
        // 停止移动
        entity.getNavigation().stop();
    }
}
```

### 4.2 MeleeAttackTask 近战攻击

```java
// MeleeAttackTask.java
public class MeleeAttackTask extends Task<MobEntity> {
    private final double speed;
    private final boolean followingTargetEvenIfNotReachable;
    private double squaredMaxAttackDistance;
    
    @Override
    public boolean shouldRun(ServerWorld world, MobEntity entity, long time) {
        // 检查是否有攻击目标
        Optional<LivingEntity> targetOpt = entity.getBrain()
            .getMemory(MemoryModuleType.NEAREST_ATTACKABLE);
        
        if (targetOpt.isEmpty()) {
            return false;
        }
        
        LivingEntity target = targetOpt.get();
        double distance = entity.squaredDistanceTo(target);
        
        return distance <= this.squaredMaxAttackDistance;
    }
    
    @Override
    public void tick(ServerWorld world, MobEntity entity, long time) {
        // 获取目标
        Optional<LivingEntity> targetOpt = entity.getBrain()
            .getMemory(MemoryModuleType.NEAREST_ATTACKABLE);
        
        if (targetOpt.isEmpty()) {
            return;
        }
        
        LivingEntity target = targetOpt.get();
        
        // 面向目标
        entity.getLookControl().lookAt(target, 30.0f, 30.0f);
        
        // 移动到攻击范围
        if (entity.squaredDistanceTo(target) > this.squaredMaxAttackDistance) {
            entity.getNavigation().startMovingTo(target, this.speed);
        } else {
            entity.getNavigation().stop();
            
            // 攻击
            this.tryAttack(entity, target);
        }
    }
    
    protected boolean tryAttack(MobEntity entity, LivingEntity target) {
        // 检查攻击冷却
        if (entity.getAttackInterval() > 0) {
            return false;
        }
        
        // 检查是否面对目标
        if (!entity.canSee(target)) {
            return false;
        }
        
        // 造成伤害
        entity.tryAttack(target);
        return true;
    }
}
```

### 4.3 RangedAttackTask 远程攻击

```java
// RangedAttackTask.java
public class RangedAttackTask<T extends MobEntity> extends Task<T> {
    private final RangedAttackEntity attackEntity;
    private final double speed;
    private final int intervalTicks;
    private final float attackRadius;
    
    @Override
    public boolean shouldRun(ServerWorld world, T entity, long time) {
        // 检查目标
        Optional<LivingEntity> targetOpt = entity.getBrain()
            .getMemory(MemoryModuleType.NEAREST_ATTACKABLE);
        
        return targetOpt.isPresent() && 
               this.isTargetWithinRange(entity, targetOpt.get());
    }
    
    @Override
    public void tick(ServerWorld world, T entity, long time) {
        Optional<LivingEntity> targetOpt = entity.getBrain()
            .getMemory(MemoryModuleType.NEAREST_ATTACKABLE);
        
        if (targetOpt.isEmpty()) {
            return;
        }
        
        LivingEntity target = targetOpt.get();
        
        // 面向目标
        entity.getLookControl().lookAt(target);
        
        // 检查是否在攻击范围内
        double distance = entity.squaredDistanceTo(target);
        if (distance > (double)(this.attackRadius * this.attackRadius)) {
            // 接近目标
            entity.getNavigation().startMovingTo(target, this.speed);
        } else if (entity.canSee(target)) {
            // 停止并攻击
            entity.getNavigation().stop();
            
            // 检查攻击间隔
            if (time % this.intervalTicks == 0) {
                this.attack(entity, target);
            }
        }
    }
    
    private void attack(T entity, LivingEntity target) {
        // 使用投射物攻击
        this.attackEntity.attack(target, (float)this.getSpeed());
    }
}
```

### 4.4 PanicTask 恐慌任务

```java
// PanicTask.java
public class PanicTask extends Task<MobEntity> {
    
    @Override
    public boolean shouldRun(ServerWorld world, MobEntity entity, long time) {
        // 检查是否需要逃跑
        return entity.getBrain().hasMemory(MemoryModuleType.HURT_BY_ENTITY) ||
               entity.getBrain().hasMemory(MemoryModuleType.IS_PANICKING);
    }
    
    @Override
    public void start(ServerWorld world, MobEntity entity, long time) {
        super.start(world, entity, time);
        
        // 标记为恐慌状态
        entity.getBrain().remember(MemoryModuleType.IS_PANICKING, true);
        
        // 设置逃跑速度
        entity.getNavigation().setSpeed(1.6);
    }
    
    @Override
    public void tick(ServerWorld world, MobEntity entity, long time) {
        // 随机选择逃跑方向
        double escapeX = entity.getX() + (world.getRandom().nextDouble() - 0.5) * 10.0;
        double escapeZ = entity.getZ() + (world.getRandom().nextDouble() - 0.5) * 10.0;
        
        // 向上搜索安全位置
        BlockPos escapePos = this.findSafePosition(world, entity, escapeX, escapeZ);
        
        // 移动到安全位置
        entity.getNavigation().startMovingTo(
            escapePos.getX(), escapePos.getY(), escapePos.getZ(),
            1.6
        );
    }
    
    @Override
    public void stop(ServerWorld world, MobEntity entity, long time) {
        // 清除恐慌状态
        entity.getBrain().forget(MemoryModuleType.IS_PANICKING);
        entity.getNavigation().stop();
    }
}
```

### 4.5 LookAtEntityTask 看向实体

```java
// LookAtEntityTask.java
public class LookAtEntityTask extends Task<CreatureEntity> {
    private final Predicate<Entity> targetPredicate;
    private final float lookDistance;
    private final int minDuration;
    private final int maxDuration;
    
    @Override
    public boolean shouldRun(ServerWorld world, CreatureEntity entity, long time) {
        // 查找符合条件的实体
        Entity target = world.getClosestEntity(
            this.targetPredicate,
            entity.getPos(),
            entity,
            (double)this.lookDistance
        );
        
        return target != null && entity.canSee(target);
    }
    
    @Override
    public void start(ServerWorld world, CreatureEntity entity, long time) {
        // 开始看向实体
        Entity target = this.findTarget(entity);
        if (target != null) {
            entity.getBrain().remember(MemoryModuleType.LOOK_TARGET, 
                new EntityHitResult(target));
        }
    }
}
```

## 5. Task 优先级

### 优先级机制

```java
// Task 优先级
public static final int DEFAULT_PRIORITY = 0;

// 优先级数字越小越高
// 0 = 最高优先级
// 10 = 普通优先级
// 100 = 低优先级

// 示例：僵尸的 Task 优先级
public class ZombieEntity extends HostileEntity {
    
    protected void initGoals() {
        // 最高优先级：漂浮（在水里）
        this.goalSelector.add(1, new FloatGoal(this));  // priority = 1
        
        // 高优先级：攻击目标
        this.goalSelector.add(2, new MeleeAttackGoal(this, 1.0));  // priority = 2
        
        // 普通优先级：游荡
        this.goalSelector.add(5, new WanderAroundGoal(this, 0.8));  // priority = 5
    }
}
```

### Activity 中的优先级

```java
// 在 Brain Activity 中注册
brain.addActivity(Activity.CORE, ImmutableList.of(
    // 优先级 0：最高
    new LookAtEntityTask(predicate, 8.0f)
));

brain.addActivity(Activity.IDLE, ImmutableList.of(
    // 优先级 0：默认
    new IdleTask(30, 60)
));

brain.addActivity(Activity.PANIC, ImmutableList.of(
    // 优先级 0：最高
    new PanicTask(1.6)
));
```

## 6. 创建自定义 Task

### 示例：吃东西任务

```java
public class EatFoodTask extends Task<MyAnimalEntity> {
    private static final int MAX_DISTANCE = 8;
    
    @Override
    public boolean shouldRun(ServerWorld world, MyAnimalEntity entity, long time) {
        // 检查是否有食物位置记忆
        return entity.getBrain().hasMemory(MyModMemoryTypes.NEAREST_FOOD) &&
               entity.getHealth() < entity.getMaxHealth();  // 受伤时寻找食物
    }
    
    @Override
    public void start(ServerWorld world, MyAnimalEntity entity, long time) {
        // 获取食物位置
        Optional<GlobalPos> foodPos = entity.getBrain()
            .getMemory(MyModMemoryTypes.NEAREST_FOOD);
        
        if (foodPos.isPresent()) {
            // 设置行走目标
            entity.getBrain().remember(MemoryModuleType.WALK_TARGET, 
                foodPos.get().getPos());
        }
    }
    
    @Override
    public void tick(ServerWorld world, MyAnimalEntity entity, long time) {
        // 获取食物位置
        Optional<GlobalPos> foodPos = entity.getBrain()
            .getMemory(MyModMemoryTypes.NEAREST_FOOD);
        
        if (foodPos.isEmpty()) {
            this.stop(world, entity, time);
            return;
        }
        
        BlockPos pos = foodPos.get().getPos();
        
        // 检查是否到达
        if (entity.getBlockPos().isWithinDistance(pos, 1.0)) {
            // 吃食物
            if (world.getBlockState(pos).isOf(Blocks.CARROTS)) {
                world.breakBlock(pos, false);
                entity.heal(4.0f);  // 恢复 2 颗心
                
                // 清除食物记忆
                entity.getBrain().forget(MyModMemoryTypes.NEAREST_FOOD);
                this.stop(world, entity, time);
            }
        }
    }
    
    @Override
    public void stop(ServerWorld world, MyAnimalEntity entity, long time) {
        // 清除行走目标
        entity.getBrain().forget(MemoryModuleType.WALK_TARGET);
    }
}
```

## Mermaid 图表：Task 执行流程

```mermaid
flowchart TD
    A["Brain.tick()"] --> B["遍历 Activity"]
    
    B --> C{"Activity 激活?"}
    C -->|"否| End["返回"]
    C -->|"是| D["获取 Task 列表"]
    
    D --> E{"遍历 Task"}
    
    E --> F{"shouldRun()?"}
    F -->|"否| G["跳过"]
    F -->|"是| H{"Task 运行中?"}
    
    H -->|"否| I["start()"]
    I --> J["tick()"]
    H -->|"是| J
    
    J --> K{"shouldContinue()?"}
    K -->|"否| L["stop()"]
    K -->|"是| E
    
    L --> E
    G --> E
    E -->|"遍历完成| End
```

## 课后自查

完成本章学习后，你应该能够：

- [ ] 解释 Task 和 Goal 系统的区别
- [ ] 理解 Task 的生命周期
- [ ] 掌握 OneShotTask 和 TickTask 的区别
- [ ] 知道内置 Task 的使用场景
- [ ] 理解 Task 优先级的概念
- [ ] 能够创建自定义 Task

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 任务 | Task | 具体的行为执行单元 |
| 一次性任务 | OneShotTask | 只执行一次的任务 |
| 组合任务 | CompositeTask | 由多个子任务组成 |
| 优先级 | Priority | Task 的执行顺序 |
| 行为状态 | Activity | Task 的分组/隔离机制 |

---

**参考源码路径**：

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\task\Task.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\task\WalkToTargetTask.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\task\MeleeAttackTask.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\task\PanicTask.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\task\SequenceTask.java`
