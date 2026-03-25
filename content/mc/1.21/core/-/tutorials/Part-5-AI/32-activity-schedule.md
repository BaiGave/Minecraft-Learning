---
title: 第 32 章：Activity 与 Schedule（Activity and Schedule）
readingTime: 40
---

# 第 32 章：Activity 与 Schedule（Activity and Schedule）

> 深入了解实体的"行为状态"和"日程安排"

---

## 章节目标

- 理解 Activity 活动状态的概念
- 掌握 Activity 的注册和切换
- 了解 Schedule 日程系统的原理
- 理解 Activity 之间的优先级关系
- 能够创建自定义 Activity 和 Schedule

## 前置知识

- 熟悉 Brain 和 Task 系统
- 了解 Memory 基础

## 核心概念

### Activity = 实体的"工作模式"

想象人类的一天：
- 🌅 **早上**：起床、吃早餐、去上班
- ☀️ **白天**：工作、开会、休息
- 🌙 **晚上**：回家、吃晚饭、睡觉

**Activity 就是 Minecraft 生物的"工作模式"！**

### Schedule = 实体的时间表

Schedule 定义了"什么时间做什么活动"：
- 🕐 8:00 → 工作
- 🕐 12:00 → 吃饭
- 🕐 22:00 → 睡觉

## 1. Activity 系统

### Activity 枚举

```java
// Activity.java
public enum Activity {
    // 核心活动（始终运行）
    CORE,
    
    // 基础活动
    IDLE,       // 空闲/发呆
    WORK,       // 工作
    REST,       // 休息
    MEET,       // 社交
    PANIC,      // 恐慌/逃跑
    
    // 战斗相关
    PREY,       // 捕猎
    FIGHT,      // 战斗
    FIGHT,      // 战斗
    
    // 移动相关
    ROAM,       // 漫游
    JUMP,       // 跳跃
    LONG_JUMP,  // 远跳
    WALK,       // 行走
    
    // 特殊活动
    BREED,      // 繁殖
    RIDE,       // 骑乘
    CROUCHING,  // 蹲伏
    
    // 生物特定
    TAKEOFF,    // 起飞（蝙蝠）
    GLIDE,      // 滑翔
    LAND,       // 降落
    
    // 村民相关
    SLEEP,      // 睡觉
    INFLUENCE_VILLAGER_HOSTILES,  // 影响村民敌对
    INFLUENCE_VILLAGER_REPUTATION // 影响村民声望
}
```

### Activity 在 Brain 中的结构

```java
// Brain.java
public class Brain<D extends Entity> {
    // 活动列表
    private final Map<Activity, BrainTaskGroup> activities = new EnumMap<>(Activity.class);
    
    // 当前活动
    private final Set<Activity> activeActivities = new HashSet<>();
    
    // 核心活动（始终运行）
    private static final Set<Activity> CORE_ACTIVITIES = EnumSet.of(Activity.CORE);
    
    // 添加活动
    public void addActivity(Activity activity, int priority, List<? extends Task> tasks) {
        BrainTaskGroup group = new BrainTaskGroup(tasks);
        this.activities.put(activity, group);
        group.priority = priority;
    }
    
    // 设置活动激活
    public void setActiveActivity(Activity activity) {
        this.activeActivities.clear();
        this.activeActivities.add(Activity.CORE);  // 始终包含 CORE
        this.activeActivities.add(activity);
    }
    
    // 检查活动是否激活
    public boolean isActivityActive(Activity activity) {
        return this.activeActivities.contains(activity);
    }
}
```

### Activity 切换示例

```java
// 村民活动切换
public class VillagerBrain {
    
    public static void updateActivities(VillagerEntity villager) {
        Brain<VillagerEntity> brain = villager.getBrain();
        
        // 检查是否恐慌
        if (brain.hasMemory(MemoryModuleType.VILLAGER_HOSTILE_TARGET)) {
            brain.setActiveActivity(Activity.VILLAGER_HOSTILES);
            return;
        }
        
        // 检查是否在工作
        if (brain.hasMemory(MemoryModuleType.JOB_SITE)) {
            brain.setActiveActivity(Activity.WORK);
            return;
        }
        
        // 默认空闲
        brain.setActiveActivity(Activity.IDLE);
    }
}
```

### Activity 优先级

```
Activity 优先级（高 → 低）：

PANIC (恐慌)    ████████████████████████████████████████ 最高
FIGHT (战斗)    ███████████████████████████████████
WORK (工作)     ███████████████████████████
BREED (繁殖)    ████████████████
IDLE (空闲)    ████████████ 最低
```

### Activity 注册流程

```java
// 完整的 Activity 注册
public void initBrain() {
    Brain<MyEntity> brain = this.getBrain();
    
    // 1. 注册 Core 活动（始终运行）
    brain.addActivity(Activity.CORE, 0, ImmutableList.of(
        // 看向攻击者
        new LookAtEntityTask(
            entity -> entity.getBrain().hasMemory(MemoryModuleType.HURT_BY_ENTITY),
            8.0f,
            30
        ),
        // 更新行走
        new WalkToTargetTask(1.0f)
    ));
    
    // 2. 注册 Idle 活动
    brain.addActivity(Activity.IDLE, 1, ImmutableList.of(
        new IdleTask(30, 60),
        new StrollTask(0.6f),
        new LookAtEntityTask(
            playerPredicate,
            8.0f
        )
    ));
    
    // 3. 注册 Work 活动
    brain.addActivity(Activity.WORK, 2, ImmutableList.of(
        new WorkAtJobSiteTask(0.8f),
        new IdleTask(20, 40)
    ));
    
    // 4. 注册 Panic 活动
    brain.addActivity(Activity.PANIC, 3, ImmutableList.of(
        new PanicTask(1.6f),
        new ForgetTask<>(MemoryModuleType.HURT_BY_ENTITY)
    ));
}
```

## 2. Schedule 系统

### Schedule 定义

```java
// Schedule.java
public class Schedule {
    private final String name;
    private final ScheduleEntry[] entries;
    
    // 创建 Schedule
    public static Schedule create(String name, Consumer<Builder> builderConsumer) {
        Builder builder = new Builder();
        builderConsumer.accept(builder);
        return new Schedule(name, builder.build());
    }
    
    // 获取某个时间点的活动
    public Activity getActivityForTime(long time) {
        int i = TimeHelper.getTimeOfDayComponent(time, 24000);
        
        for (int j = this.entries.length - 1; j >= 0; --j) {
            if (i >= this.entries[j].getStartTime()) {
                return this.entries[j].getActivity();
            }
        }
        
        return this.entries[this.entries.length - 1].getActivity();
    }
}
```

### ScheduleEntry

```java
// ScheduleEntry.java
public class ScheduleEntry {
    private final int startTime;  // 开始时间 (0-24000)
    private final Activity activity;  // 活动
    
    public ScheduleEntry(int startTime, Activity activity) {
        this.startTime = startTime;
        this.activity = activity;
    }
    
    public int getStartTime() {
        return this.startTime;
    }
    
    public Activity getActivity() {
        return this.activity;
    }
}
```

### 内置 Schedule

```java
// 村民默认日程
public static final Schedule VILLAGER_DEFAULT = Schedule.create("villager_default", builder -> {
    // 午夜后
    builder.changeActivityAt(25000, Activity.IDLE);      // 凌晨
    builder.changeActivityAt(30000, Activity.WORK);     // 早上开始工作
    builder.changeActivityAt(50000, Activity.IDLE);    // 中午休息
    builder.changeActivityAt(65000, Activity.WORK);    // 下午继续工作
    builder.changeActivityAt(75000, Activity.REST);    // 晚上回家休息
    builder.changeActivityAt(90000, Activity.IDLE);    // 深夜继续休息
});

// 村民工作日程
public static final Schedule VILLAGER_WORK = Schedule.create("villager_work", builder -> {
    builder.changeActivityAt(0, Activity.WORK);        // 全天工作
    builder.changeActivityAt(75000, Activity.REST);    // 晚上休息
});

// 村民休息日程
public static final Schedule VILLAGER_REST = Schedule.create("villager_rest", builder -> {
    builder.changeActivityAt(0, Activity.REST);        // 全天休息
});
```

### Schedule 时间表

```
Villager Default Schedule (24000 = 1 天):

┌─────────────────────────────────────────────────────────────────┐
│ 时间   │ 活动   │ 描述                                          │
├─────────────────────────────────────────────────────────────────┤
│ 0:00   │ IDLE   │ 开始新的一天                                 │
│ 5:00   │ WORK   │ 起床，去工作站                               │
│ 10:00  │ IDLE   │ 午餐休息                                     │
│ 13:00  │ WORK   │ 继续工作                                     │
│ 19:00  │ REST   │ 回家长休息                                   │
│ 22:00  │ IDLE   │ 深夜继续休息                                 │
│ 24:00  │ IDLE   │ 新的一天开始                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Schedule 应用

```java
// 应用 Schedule
public class VillagerEntity extends MerchantEntity {
    
    @Override
    public void tick() {
        super.tick();
        
        // 每 tick 更新日程
        if (this.age % 20 == 0) {  // 每秒检查一次
            this.updateSchedule();
        }
    }
    
    private void updateSchedule() {
        Brain<VillagerEntity> brain = this.getBrain();
        
        // 获取当前时间的活动
        Schedule schedule = brain.getSchedule();
        long time = this.getWorld().getTimeOfDay();
        Activity activity = schedule.getActivityForTime(time);
        
        // 切换活动
        if (!brain.isActivityActive(activity)) {
            brain.setActiveActivity(activity);
        }
    }
}
```

## 3. Activity 与 Task 配合

### 典型配合模式

```java
// Activity 与 Task 的配合
public static void registerVillageActivities() {
    
    // CORE 活动：始终运行的基础行为
    brain.addActivity(Activity.CORE, 0, ImmutableList.of(
        // 看向伤害来源
        new LookAtEntityTask(
            EntityPredicate.hasMemory(MemoryModuleType.HURT_BY_ENTITY),
            8.0f,
            30
        ),
        // 清除无效行走目标
        new WalkToTargetTask(1.0f)
    ));
    
    // IDLE 活动：空闲时的行为
    brain.addActivity(Activity.IDLE, 1, ImmutableList.of(
        // 随机游荡
        new StrollTask(0.6f).predicate(Optional.of(false)),
        // 发呆
        new IdleTask(30, 60)
    ));
    
    // WORK 活动：工作时的行为
    brain.addActivity(Activity.WORK, 2, ImmutableList.of(
        // 去工作站
        new WalkToJobSiteTask(1.0f),
        // 在工作站工作
        new WorkAtJobSiteTask(0.5f)
    ));
    
    // PANIC 活动：恐慌时的行为
    brain.addActivity(Activity.PANIC, 3, ImmutableList.of(
        // 逃跑
        new PanicTask(1.6f),
        // 清除恐惧记忆
        new ExpireMemoryTask<>(MemoryModuleType.HURT_BY_ENTITY),
        // 回到安全位置
        new WalkToTargetTask(1.0f)
    ));
}
```

### 活动切换条件

```java
// Activity 切换逻辑
public void updateActivity(VillagerEntity villager) {
    Brain<VillagerEntity> brain = villager.getBrain();
    
    // 1. 优先处理恐慌
    if (brain.hasMemory(MemoryModuleType.VILLAGER_HOSTILE_TARGET)) {
        brain.setActiveActivity(Activity.VILLAGER_HOSTILES);
        return;
    }
    
    // 2. 检查是否有敌人在附近
    if (brain.hasMemory(MemoryModuleType.NEAREST_HOSTILE)) {
        brain.setActiveActivity(Activity.FIGHT);
        return;
    }
    
    // 3. 检查是否有工作站
    if (brain.hasMemory(MemoryModuleType.JOB_SITE)) {
        brain.setActiveActivity(Activity.WORK);
        return;
    }
    
    // 4. 默认空闲
    brain.setActiveActivity(Activity.IDLE);
}
```

## 4. 自定义 Activity 和 Schedule

### 创建自定义 Activity

```java
// 在 Mod 中添加新 Activity
public class MyModActivities {
    // 跟随主人活动
    public static final Activity FOLLOW_OWNER = Activity.register("follow_owner");
    
    // 巡逻活动
    public static final Activity PATROL = Activity.register("patrol");
    
    // 进食活动
    public static final Activity EATING = Activity.register("eating");
}

// Activity 注册
public class Activity {
    private static int nextId = 0;
    
    public static Activity register(String name) {
        return new Activity(nextId++, name);
    }
}
```

### 创建自定义 Schedule

```java
// 自定义日程
public class MyModSchedules {
    public static final Schedule WOLF_DAY = Schedule.create("wolf_day", builder -> {
        // 白天：跟随主人
        builder.changeActivityAt(0, Activity.FOLLOW_OWNER);
        // 下午：巡逻
        builder.changeActivityAt(6000, Activity.PATROL);
        // 晚上：跟随主人
        builder.changeActivityAt(12000, Activity.FOLLOW_OWNER);
    });
    
    public static final Schedule WOLF_NIGHT = Schedule.create("wolf_night", builder -> {
        // 夜晚：跟随主人
        builder.changeActivityAt(0, Activity.FOLLOW_OWNER);
    });
}
```

### 使用自定义 Activity

```java
public class MyWolfEntity extends TameableEntity {
    
    @Override
    protected void initBrain() {
        Brain<MyWolfEntity> brain = this.getBrain();
        
        // 注册 Follow Owner 活动
        brain.addActivity(Activity.FOLLOW_OWNER, 0, ImmutableList.of(
            // 跟随主人
            new FollowOwnerTask(1.2f, 5.0f, 2.0f),
            // 看向主人
            new LookAtEntityTask(
                entity -> entity.getOwner(),
                8.0f
            )
        ));
        
        // 注册 Patrol 活动
        brain.addActivity(Activity.PATROL, 1, ImmutableList.of(
            // 随机巡逻
            new StrollTask(0.8f),
            // 警戒模式
            new LookAtEntityTask(
                EntityPredicates.VALID_LIVING_ENTITY,
                12.0f,
                40
            )
        ));
        
        // 设置默认日程
        brain.setSchedule(MyModSchedules.WOLF_DAY);
    }
}
```

## Mermaid 图表：Activity 切换流程

```mermaid
flowchart TD
    A["每 tick 检查"] --> B{"Schedule 时间变化?"}
    
    B -->|"是| C["获取新 Activity"]
    B -->|"否| E{"内存状态变化?"}
    
    C --> D["切换 Activity"]
    D --> End
    
    E -->|"敌对出现| F["切换到 FIGHT"]
    E -->|"受伤| G["切换到 PANIC"]
    E -->|"无变化| End
    
    subgraph Priority["优先级检查"]
        P1["PANIC > FIGHT > WORK > IDLE"]
    end
    
    G --> Priority
    F --> Priority
    Priority --> End
```

## Mermaid 图表：Schedule 时间线

```mermaid
gantt
    title Villager Daily Schedule
    dateFormat HH:mm
    axisFormat %H:%M
    
    section Activities
    IDLE (睡眠)     : 00:00 - 05:00
    WORK (工作)     : 05:00 - 10:00
    IDLE (休息)     : 10:00 - 13:00
    WORK (工作)     : 13:00 - 19:00
    REST (回家)     : 19:00 - 24:00
```

## 实战演示：创建宠物跟随系统

### 需求

- 宠物默认跟随主人
- 当主人停下时，宠物在主人身边游荡
- 当主人受到攻击，宠物切换到战斗模式
- 晚上宠物会待在主人身边休息

### 实现

```java
public class PetBrain {
    
    public static Brain.Profile<PetEntity> createPetBrainProfile() {
        return Brain.Profile.create(
            "pet_brain",
            ImmutableList.of(
                Sensor.NEAREST_LIVING,
                Sensor.HURT_BY
            ),
            ImmutableList.of(
                MemoryModuleType.NEAREST_OWNER,
                MemoryModuleType.HURT_BY_ENTITY,
                MemoryModuleType.WALK_TARGET,
                MemoryModuleType.LOOK_TARGET
            )
        );
    }
    
    public static void initBrain(PetEntity pet) {
        Brain<PetEntity> brain = pet.getBrain();
        
        // Core 活动
        brain.addActivity(Activity.CORE, 0, ImmutableList.of(
            new FollowOwnerTask(1.2f, 10.0f, 2.0f)
        ));
        
        // Idle 活动
        brain.addActivity(Activity.IDLE, 1, ImmutableList.of(
            new StrollTask(0.5f),
            new IdleTask(20, 40)
        ));
        
        // 战斗活动
        brain.addActivity(Activity.FIGHT, 2, ImmutableList.of(
            new MeleeAttackTask(1.0f),
            new ActiveTargetTask<>(
                entity -> entity.getBrain().hasMemory(MemoryModuleType.HURT_BY_ENTITY),
                8.0f
            )
        ));
        
        // 恐慌活动
        brain.addActivity(Activity.PANIC, 3, ImmutableList.of(
            new PanicTask(1.6f),
            new ExpireMemoryTask<>(MemoryModuleType.HURT_BY_ENTITY)
        ));
        
        // 日程安排
        brain.setSchedule(Schedule.create("pet_schedule", builder -> {
            builder.changeActivityAt(0, Activity.IDLE);      // 夜间休息
            builder.changeActivityAt(5000, Activity.IDLE);    // 继续休息
            builder.changeActivityAt(12000, Activity.IDLE);   // 白天活动
        }));
    }
    
    public static void updateActivities(PetEntity pet) {
        Brain<PetEntity> brain = pet.getBrain();
        
        // 优先级最高的条件先检查
        
        // 1. 恐慌状态
        if (brain.hasMemory(MemoryModuleType.IS_PANICKING)) {
            brain.setActiveActivity(Activity.PANIC);
            return;
        }
        
        // 2. 主人受伤
        if (brain.hasMemory(MemoryModuleType.HURT_BY_ENTITY)) {
            brain.setActiveActivity(Activity.FIGHT);
            return;
        }
        
        // 3. 跟随主人
        brain.setActiveActivity(Activity.CORE);
    }
}

// FollowOwnerTask
public class FollowOwnerTask extends Task<PetEntity> {
    private final float speed;
    private final float followDistance;
    private final float startDistance;
    
    @Override
    public boolean shouldRun(ServerWorld world, PetEntity pet, long time) {
        return pet.getOwner() != null;
    }
    
    @Override
    public void tick(ServerWorld world, PetEntity pet, long time) {
        PlayerEntity owner = pet.getOwner();
        
        if (owner == null) return;
        
        double distance = pet.squaredDistanceTo(owner);
        
        // 如果太远，跑过去
        if (distance > this.followDistance * this.followDistance) {
            pet.getNavigation().startMovingTo(owner, this.speed);
        }
        // 如果太近，后退一点
        else if (distance < this.startDistance * this.startDistance) {
            // 计算后退方向
            Vec3d away = pet.getPos().subtract(owner.getPos()).normalize();
            BlockPos back = pet.getBlockPos().add(
                (int)(away.x * 2),
                0,
                (int)(away.z * 2)
            );
            pet.getNavigation().startMovingTo(back.getX(), back.getY(), back.getZ(), this.speed);
        }
        // 在范围内，随机游荡
        else {
            pet.getNavigation().stop();
            // 随机发呆或小范围移动
        }
    }
}
```

## 课后自查

完成本章学习后，你应该能够：

- [ ] 解释 Activity 和 Schedule 的区别
- [ ] 理解 Activity 优先级的概念
- [ ] 掌握内置 Schedule 的使用方法
- [ ] 知道 Activity 切换的触发条件
- [ ] 能够创建自定义 Activity
- [ ] 能够创建自定义 Schedule
- [ ] 能够实现 Activity 和 Task 的配合

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 活动 | Activity | 实体的行为状态 |
| 日程 | Schedule | 基于时间的活动安排 |
| 活动切换 | Activity Switch | 根据条件改变当前活动 |
| 优先级 | Priority | 活动的重要程度 |
| 时间点 | Time Point | Schedule 中的时间标记 |

---

**参考源码路径**：

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\Activity.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\Schedule.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\Brain.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\brain\task\FollowOwnerTask.java`
