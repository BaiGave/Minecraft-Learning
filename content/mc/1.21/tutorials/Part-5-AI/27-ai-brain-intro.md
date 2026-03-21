# �?7章：AI大脑 - 生物�?思考中�?

> **注意**：以下代码示例基�?CFR 反编译结果，实际 Minecraft 源码可能有所差异。在使用时请以游戏源码为准�?
## 目标

- 理解 AI 大脑是什�?- 掌握 Brain、Task、Activity 三者的关系
- 能够画出 AI 三层架构�?
## 前置知识

- 了解什么是实体（Entity�?- 知道生物�?LivingEntity 的子�?- 具备基本的面向对象概�?
## 核心概念：什么是AI大脑�?
### 生活比喻

想象你是一只僵尸。你需要思考：

- "前面有人吗？"（感知）
- "我要追过去打他！"（决策）
- "先迈左脚，再迈右�?.."（行动）

**AI大脑** 就是生物�?大脑"，它负责�?1. **感知** - 通过传感器收集周围信�?2. **记忆** - 记住重要的事�?3. **决策** - 决定做什�?4. **行动** - 执行具体的任�?
> **一句话理解**：AI大脑就是生物�?指挥�?，协调感知、记忆、决策和行动�?
### 源码解读

�?Minecraft 中，每个 `LivingEntity`（活着的生物）都有一个大脑：

```java
public class Brain<E extends LivingEntity> {
    // 记忆存储 - 生物记住的信�?    private final Map<MemoryModuleType<?>, Optional<? extends Memory<?>>> memories;

    // 传感器列�?- 生物�?感官"
    private final Map<SensorType<? extends Sensor<? super E>>, Sensor<? super E>> sensors;

    // 任务映射 - 按优先级组织的行�?    private final Map<Integer, Map<Activity, Set<Task<? super E>>>> tasks;

    // 日程�?- 生物的时间表
    private Schedule schedule;
}
```

**源码位置**：`net/minecraft/entity/ai/brain/Brain.java`

## 图解：AI三层架构

Minecraft �?AI 系统分为三层，从底层到顶层：

```mermaid
graph TB
    subgraph "第三层：决策�?Activity"
        A["WORK 工作"]
        B["REST 休息"]
        C["FIGHT 战斗"]
    end

    subgraph "第二层：执行�?Task"
        D["攻击任务"]
        E["逃跑任务"]
        F["觅食任务"]
    end

    subgraph "第一层：感知�?Sensor + Memory"
        G["附近生物传感�?]
        H["最近床传感�?]
        I["伤害来源传感�?]
        J["短期记忆"]
        K["长期记忆"]
    end

    G --> J
    H --> J
    I --> K
    J --> D
    J --> E
    K --> F
    D -.-> A
    E -.-> C
    F -.-> B
```

### 层次详解

| 层级 | 组件 | 作用 | 类比 |
|------|------|------|------|
| 第三�?| Activity（活动） | 生物当前的状�?| "我现在在做什�? |
| 第二�?| Task（任务） | 具体的行为动�?| "我要攻击�? |
| 第一�?| Sensor + Memory | 感知和记�?| "眼睛看到敌人" |

## 图解：生物的"思�?流程

```mermaid
sequenceDiagram
    participant 世界 as 游戏世界
    participant 传感�?as 传感�?    participant 记忆 as 记忆模块
    participant 活动 as 活动管理�?    participant 任务 as 任务执行�?
    世界->>传感�? �?0tick更新一�?    传感�?>>记忆: 更新记忆内容
    记忆->>活动: 检查条�?    活动->>任务: 激活合适的任务
    任务->>任务: tick()执行�?    任务-->>活动: 任务完成/失败
```

## 图解：Brain的tick循环

每一刻（tick），大脑都会执行一次完整的思考循环：

```mermaid
flowchart TD
    A["tick() 开�?] --> B["tickMemories()<br/>检查记忆是否过�?]
    B --> C["tickSensors()<br/>传感器更�?]
    C --> D["startTasks()<br/>启动符合条件的任�?]
    D --> E["updateTasks()<br/>更新运行中的任务"]
    E --> F["tick() 结束"]

    style A fill:#e1f5fe
    style F fill:#e8f5e8
```

## 核心代码：创建一个简单的大脑

### 1. 创建大脑配置

```java
// 定义需要的记忆模块类型
Collection<MemoryModuleType<?>> memoryModules = ImmutableList.of(
    MemoryModuleType.NEAREST_VISIBLE_ATTACKABLE,
    MemoryModuleType.WALK_TARGET,
    MemoryModuleType.HURT_BY_ENTITY
);

// 定义需要的传感�?Collection<SensorType<? extends Sensor<?>>> sensorTypes = ImmutableList.of(
    SensorType.NEAREST_LIVING_ENTITIES,
    SensorType.HURT_BY
);

// 创建大脑配置
Profile<E> profile = Brain.createProfile(memoryModules, sensorTypes);

// 使用配置创建大脑
Brain<E> brain = profile.deserialize(data);
```

### 2. 设置活动

```java
// 设置核心活动（始终运行）
brain.setCoreActivities(ImmutableSet.of(Activity.CORE));

// 设置默认活动
brain.setDefaultActivity(Activity.IDLE);

// 为活动添加任�?brain.setTaskList(Activity.IDLE, 0, ImmutableList.of(
    new IdleWanderTask(),
    new LookAtEntityTask(5)
));
```

### 3. 大脑的tick方法

```java
public void tick(ServerWorld world, E entity) {
    this.tickMemories();      // 检查记忆过�?    this.tickSensors(world, entity);  // 更新传感�?    this.startTasks(world, entity);   // 启动新任�?    this.updateTasks(world, entity);  // 更新运行中的任务
}
```

## 实战演示：僵尸的行为

让我们看一个具体的例子——僵尸是如何"思�?的：

```mermaid
flowchart LR
    subgraph 感知
        S1["看到玩家"]
        S2["受伤记忆"]
    end

    subgraph 记忆
        M1["附近玩家 = Steve"]
        M2["攻击目标 = Steve"]
    end

    subgraph 决策
        D1{"有攻击目标？"}
    end

    subgraph 行动
        A1["追踪任务"]
        A2["攻击任务"]
    end

    S1 --> M1
    S2 --> M2
    M1 --> D1
    M2 --> D1
    D1 -->|是| A1
    A1 --> A2
```

### 僵尸大脑的核心代�?
```java
// 为僵尸设置战斗AI
brain.setTaskList(Activity.CORE, 0, ImmutableList.of(
    new LookAtEntityTask(EntityPredicate.IS_VISIBLE),
    new MoveToTargetTask()
));

brain.setTaskList(Activity.FIGHT, 0, ImmutableList.of(
    new MeleeAttackTask(20),
    new BackUpIfTooCloseTask(20)
));
brain.setTaskList(Activity.FIGHT, 5, ImmutableList.of(
    new JumpOnHurtByTargetTask()
), MemoryModuleType.HURT_BY_ENTITY);
```

## 重要概念：Activity vs Task

萌新经常搞混这两个概念：

| 概念 | 英文 | 作用 | 例子 |
|------|------|------|------|
| Activity | 活动 | 表示"状�? | WORK（工作）、REST（休息） |
| Task | 任务 | 执行"动作" | 攻击、逃跑、觅�?|

**简单理�?*�?- Activity = "我现在是员工"（状态）
- Task = "我现在在写代�?（动作）

一�?Activity 可以包含多个 Task，就�?工作"状态包�?写代�?�?开�?�?吃饭"等任务�?
## 小结

1. **AI大脑**是生物的思考中心，管理感知、记忆、决策和行动
2. **三层架构**：感知层(Sensor) �?执行�?Task) �?决策�?Activity)
3. **记忆模块**存储生物的各种信息（位置、目标、状态等�?4. **传感�?*定期更新感知信息到记�?5. **活动**表示生物的当前状态，**任务**是具体的行为
6. **tick循环**：每tick执行一次完整的思考流�?
## 练习

1. **思考题**：如果僵尸找不到攻击目标，它会处于什么Activity�?2. **动手�?*：查看村民（Villager）有哪些Activity
3. **挑战�?*：尝试理�?`Brain.tick()` 方法的执行顺�?
## 相关链接

- **上一�?*：[�?6�?生成系统](/mc/1.21/tutorials/Part-4-Entity/26-spawn-system/)
- **下一�?*：[�?8�?记忆系统](./28-memory-system.md)
- **相关源码**�?  - `net/minecraft/entity/ai/brain/Brain.java`
  - `net/minecraft/entity/ai/brain/Activity.java`

### 源码文件位置

| 文件 | 源码路径 | 说明 |
|------|----------|------|
| Brain.java | `net/minecraft/entity/ai/brain/Brain.java` | AI大脑基类 |
| Activity.java | `net/minecraft/entity/ai/brain/Activity.java` | 活动定义 |
| Task.java | `net/minecraft/entity/ai/brain/task/Task.java` | 任务基类 |
