# Minecraft 1.21 实体系统深度分析

## 1. 系统架构概述

Minecraft 的实体系统是游戏中最复杂的子系统之一，负责管理所有动态对象（玩家、生物、投射物、载具等）。1.21 版本的实体系统采用了高度面向对象的设计，通过继承层次结构实现了代码复用和统一的行为管理。

### 1.1 核心架构组件

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Entity Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   PlayerEntity   │  │   MobEntity      │  │ ProjectileEntity │   │
│  │   (extends       │  │   (extends       │  │ (extends Entity) │   │
│  │   LivingEntity)  │  │   LivingEntity)  │  │                  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                     LivingEntity Layer                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  AttributeSystem │  │ StatusEffectSystem│ │  Brain/AI System │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                       Entity Base Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   DataTracker    │  │  EntityType      │  │  MovementSystem  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 包结构

```
net.minecraft.entity/
├── ai/                - AI系统 (brain, task, sensor, control, goal, pathing)
├── attribute/         - 属性系统 (属性实例、修饰符)
├── boss/             - Boss相关 (凋零、末影龙)
├── damage/           - 伤害系统 (伤害源、伤害追踪)
├── data/             - 数据同步 (DataTracker, TrackedData)
├── decoration/       - 装饰实体 (物品框、画、光标)
├── effect/           - 药水效果系统
├── mob/              - 生物实体 (所有可生成生物)
├── passive/          - 被动生物 (动物)
├── player/           - 玩家实体
├── projectile/       - 投射物 (箭矢、火球、珍珠)
├── raid/             - 袭击系统
├── vehicle/          - 载具 (矿车、船)
├── Entity.java       - 基础实体类
├── LivingEntity.java - 有生命实体基类
├── MobEntity.java    - 生物基类
├── EntityType.java   - 实体类型注册
└── ...
```

---

## 2. 核心类分析

### 2.1 Entity 类 (`net.minecraft.entity.Entity`)

`Entity` 是所有实体的基类，提供了实体的基本属性和行为。

```java
237:243:Entity.java
public abstract class Entity
    implements DataTracked,
               Nameable,
               EntityLike,
               CommandOutput,
               ScoreHolder,
               AttachmentTarget {
```

#### 2.1.1 核心字段

```java
// 实体标识
private final EntityType<?> type;
private int id = CURRENT_ID.incrementAndGet();  // 网络ID
protected UUID uuid = MathHelper.randomUuid(this.random);  // 持久化UUID

// 位置和运动
public double prevX, prevY, prevZ;  // 上一tick位置
private Vec3d pos;                   // 当前坐标
private Vec3d velocity;              // 速度向量
private float yaw, pitch;            // 旋转角度
private Box boundingBox;              // 碰撞箱
public boolean onGround;             // 是否在地面上

// 实体状态
public int fireTicks = -this.getBurningDuration();  // 燃烧时间
protected boolean touchingWater;     // 接触液体
protected boolean submergedInWater;  // 浸没在水中
public int age;                     // 实体年龄
public float fallDistance;          // 掉落高度
public boolean noClip;              // 无碰撞

// 数据追踪
protected final DataTracker dataTracker;
protected static final TrackedData<Byte> FLAGS = DataTracker.registerData(Entity.class, TrackedDataHandlerRegistry.BYTE);
protected static final TrackedData<Integer> AIR = DataTracker.registerData(Entity.class, TrackedDataHandlerRegistry.INTEGER);
protected static final TrackedData<EntityPose> POSE = DataTracker.registerData(Entity.class, TrackedDataHandlerRegistry.ENTITY_POSE);

// 骑乘系统
private ImmutableList<Entity> passengerList = ImmutableList.of();
@Nullable
private Entity vehicle;
```

#### 2.1.2 实体生命周期

```java
// 创建实体
public Entity(EntityType<?> type, World world) {
    this.type = type;
    this.world = world;
    this.dimensions = type.getDimensions();
    this.pos = Vec3d.ZERO;
    this.dataTracker = builder.build();
    this.setPosition(0.0, 0.0, 0.0);
}

// 销毁实体
public void kill() {
    this.remove(RemovalReason.KILLED);
    this.emitGameEvent(GameEvent.ENTITY_DIE);
}

public final void discard() {
    this.remove(RemovalReason.DISCARDED);
}

public void remove(RemovalReason reason) {
    this.setRemoved(reason);
}

// 实体Tick
public void tick() {
    this.baseTick();
}

public void baseTick() {
    this.getWorld().getProfiler().push("entityBaseTick");
    // 检查骑乘状态
    if (this.hasVehicle() && this.getVehicle().isRemoved()) {
        this.stopRiding();
    }
    // 处理门户传送冷却
    this.tickPortalTeleportation();
    // 处理水分状态
    this.updateWaterState();
    this.updateSubmergedInWaterState();
    this.updateSwimming();
    // 处理火焰状态
    if (this.getWorld().isClient) {
        this.extinguish();
    } else if (this.fireTicks > 0) {
        // 服务器端燃烧处理
    }
    this.getWorld().getProfiler().pop();
}
```

#### 2.1.3 位置和运动

```java
646:662:Entity.java
public final void setPosition(Vec3d pos) {
    this.setPosition(pos.getX(), pos.getY(), pos.getZ());
}

public void setPosition(double x, double y, double z) {
    this.setPos(x, y, z);
    this.setBoundingBox(this.calculateBoundingBox());
}

protected Box calculateBoundingBox() {
    return this.dimensions.getBoxAt(this.pos);
}

912:1013:Entity.java
public void move(MovementType movementType, Vec3d movement) {
    if (this.noClip) {
        this.setPosition(this.getX() + movement.x, this.getY() + movement.y, this.getZ() + movement.z);
        return;
    }
    
    this.getWorld().getProfiler().push("move");
    
    // 碰撞检测和移动调整
    Vec3d vec3d = this.adjustMovementForCollisions(movement);
    
    // 更新位置
    if (vec3d.lengthSquared() > 1.0E-7) {
        this.setPosition(this.getX() + vec3d.x, this.getY() + vec3d.y, this.getZ() + vec3d.z);
    }
    
    // 碰撞检测
    this.horizontalCollision = movement.x != vec3d.x || movement.z != vec3d.z;
    this.verticalCollision = movement.y != vec3d.y;
    this.groundCollision = this.verticalCollision && movement.y < 0.0;
    this.setOnGround(this.groundCollision, vec3d);
    
    // 处理掉落
    BlockPos blockPos = this.getLandingPos();
    BlockState blockState = this.getWorld().getBlockState(blockPos);
    this.fall(vec3d.y, this.isOnGround(), blockState, blockPos);
    
    this.getWorld().getProfiler().pop();
}
```

#### 2.1.4 数据追踪系统

```java
// TrackedData - 需要同步的数据
protected static final TrackedData<Byte> FLAGS = DataTracker.registerData(Entity.class, TrackedDataHandlerRegistry.BYTE);
protected static final int ON_FIRE_FLAG_INDEX = 0;
private static final int SNEAKING_FLAG_INDEX = 1;
private static final int SPRINTING_FLAG_INDEX = 3;
private static final int SWIMMING_FLAG_INDEX = 4;
private static final int INVISIBLE_FLAG_INDEX = 5;
protected static final int GLOWING_FLAG_INDEX = 6;
protected static final int FALL_FLYING_FLAG_INDEX = 7;

// 数据读写
public <T> void setData(TrackedData<T> data, T value) {
    this.dataTracker.set(data, value);
}

public <T> T getData(TrackedData<T> data) {
    return this.dataTracker.get(data);
}

// 标志位操作
public void setFlag(int index, boolean value) {
    byte b = this.dataTracker.get(FLAGS);
    if (value) {
        b = (byte)(b | 1 << index);
    } else {
        b = (byte)(b & ~(1 << index));
    }
    this.dataTracker.set(FLAGS, b);
}

public boolean getFlag(int index) {
    return (this.dataTracker.get(FLAGS) & 1 << index) != 0;
}
```

#### 2.1.5 骑乘系统

```java
// 添加乘客
public void addPassenger(Entity passenger) {
    if (passenger.getVehicle() != this) {
        throw new IllegalStateException("Use method startRiding");
    }
    if (this.passengerList.isEmpty()) {
        this.passengerList = ImmutableList.of(passenger);
    } else {
        this.passengerList = ImmutableList.<Entity>builder().addAll(this.passengerList).add(passenger).build();
    }
    passenger.vehicle = this;
}

// 移除乘客
public void removePassenger(Entity passenger) {
    // ... 移除逻辑
}

// 开始骑乘
public boolean startRiding(Entity entity) {
    return this.startRiding(entity, false);
}

public boolean startRiding(Entity entity, boolean force) {
    for (Entity entity2 = entity; entity2.vehicle != null; entity2 = entity2.vehicle) {
        if (entity2.vehicle == this) {
            return false;
        }
    }
    if (force || this.canRide(entity) && entity.canAddPassenger(this)) {
        this.vehicle = entity;
        entity.addPassenger(this);
        return true;
    }
    return false;
}

// 停止骑乘
public void stopRiding() {
    // ...
}
```

---

### 2.2 LivingEntity 类 (`net.minecraft.entity.LivingEntity`)

`LivingEntity` 是所有有生命实体的基类，继承自 Entity，增加了生命值、药水效果、AI 等功能。

```java
158:160:LivingEntity.java
public abstract class LivingEntity
    extends Entity
    implements Attackable {
```

#### 2.2.1 核心字段

```java
// 属性系统
private final AttributeContainer attributes;
private final Map<RegistryEntry<StatusEffect>, StatusEffectInstance> activeStatusEffects;

// 生命值
protected static final TrackedData<Float> HEALTH = DataTracker.registerData(LivingEntity.class, TrackedDataHandlerRegistry.FLOAT);

// 药水效果
protected static final TrackedData<List<ParticleEffect>> POTION_SWIRLS = DataTracker.registerData(LivingEntity.class, TrackedDataHandlerRegistry.PARTICLE_LIST);
protected static final TrackedData<Integer> STUCK_ARROW_COUNT = DataTracker.registerData(LivingEntity.class, TrackedDataHandlerRegistry.INTEGER);
protected static final TrackedData<Integer> STINGER_COUNT = DataTracker.registerData(LivingEntity.class, TrackedDataHandlerRegistry.INTEGER);

// AI大脑
protected Brain<?> brain;

// 物理状态
public int handSwingTicks;
public Hand preferredHand;
public float sidewaysSpeed;
public float upwardSpeed;
public float forwardSpeed;
public float distanceTraveled;
public float speed;

// 动画
public final LimbAnimator limbAnimator = new LimbAnimator();
public float bodyYaw;
public float headYaw;

// 伤害追踪
protected int playerHitTimer;
protected float lastDamageTaken;
protected int scoreAmount;
```

#### 2.2.2 属性系统

```java
198:199:LivingEntity.java
private final AttributeContainer attributes;

277:289:LivingEntity.java
protected LivingEntity(EntityType<? extends LivingEntity> entityType, World world) {
    super(entityType, world);
    this.attributes = new AttributeContainer(DefaultAttributeRegistry.get(entityType));
    this.setHealth(this.getMaxHealth());
    // ...
}

323:325:LivingEntity.java
public static DefaultAttributeContainer.Builder createLivingAttributes() {
    return DefaultAttributeContainer.builder()
        .add(EntityAttributes.GENERIC_MAX_HEALTH)
        .add(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE)
        .add(EntityAttributes.GENERIC_MOVEMENT_SPEED)
        .add(EntityAttributes.GENERIC_ARMOR)
        .add(EntityAttributes.GENERIC_ARMOR_TOUGHNESS)
        .add(EntityAttributes.GENERIC_MAX_ABSORPTION)
        .add(EntityAttributes.GENERIC_STEP_HEIGHT)
        .add(EntityAttributes.GENERIC_SCALE)
        .add(EntityAttributes.GENERIC_GRAVITY)
        // ... 更多属性
}
```

#### 2.2.3 伤害系统

```java
// 造成伤害
public boolean damage(DamageSource source, float amount) {
    if (this.isInvulnerableTo(source)) {
        return false;
    }
    
    if (this.isSleeping() && !this.getWorld().isClient) {
        this.wakeUp();
    }
    
    this.applyAttributesModifiersIfMoved();
    
    // 计算实际伤害
    float damage = amount;
    damage = this.modifyAppliedDamage(source, damage);
    
    // 检查伤害是否大于0
    if (damage <= 0) {
        return false;
    }
    
    // 造成伤害
    return this.applyDamage(source, damage);
}

protected boolean applyDamage(DamageSource source, float damage) {
    float absorbed;
    this.getWorld().getProfiler().push("damage");
    
    // 吸收值处理
    if (damage < this.absorptionAmount) {
        this.absorptionAmount -= damage;
        damage = 0.0f;
    } else {
        damage -= this.absorptionAmount;
        this.setAbsorptionAmount(0.0f);
    }
    
    // 触发伤害事件
    this.getDamageTracker().trackDamage(source, this.health, damage);
    
    // 应用伤害到生命值
    this.health = this.health - damage;
    
    // 设置无敌时间
    this.setAbsorptionAmount(this.getAttributeValue(EntityAttributes.GENERIC_MAX_ABSORPTION));
    
    // 触发视觉效果
    this.setHurtTime(this.maxHurtTime);
    this.hurtTime = this.maxHurtTime;
    this.lastDamageSource = source;
    this.lastDamageTime = this.age;
    
    this.getWorld().getProfiler().pop();
    return true;
}
```

#### 2.2.4 药水效果系统

```java
// 添加药水效果
public void addStatusEffect(StatusEffectInstance effect) {
    this.addStatusEffect(effect, EntityPoses.DEFAULT);
}

public void addStatusEffect(StatusEffectInstance effect, EntityPose pose) {
    if (!this.isAffectedBy(effect)) {
        return;
    }
    StatusEffectInstance existingEffect = this.activeStatusEffects.get(effect.getEffectType());
    if (existingEffect == null) {
        this.activeStatusEffects.put(effect.getEffectType(), effect);
        this.onStatusEffectApplied(effect, pose);
    } else {
        existingEffect.combine(effect);
        this.onStatusEffectUpdated(existingEffect, true, pose);
    }
    this.effectsChanged = true;
}

// 药水效果Tick
private void tickStatusEffects() {
    // 每tick调用一次
    for (Iterator<Map.Entry<RegistryEntry<StatusEffect>, StatusEffectInstance>> it = this.activeStatusEffects.entrySet().iterator(); it.hasNext(); ) {
        StatusEffectInstance effectInstance = it.next();
        StatusEffect effect = effectInstance.getEffectType().value();
        
        if (!effectInstance.tick(this)) {
            // 效果结束
            this.onStatusEffectRemoved(effectInstance);
            it.remove();
            this.effectsChanged = true;
        } else if (effectInstance.shouldTick()) {
            // 每刻应用效果
            effect.applyUpdateEffect(this);
        }
    }
    
    if (this.effectsChanged) {
        this.onStatusEffectsChanged();
        this.effectsChanged = false;
    }
}
```

#### 2.2.5 基础Tick逻辑

```java
376:470:LivingEntity.java
@Override
public void baseTick() {
    this.lastHandSwingProgress = this.handSwingProgress;
    
    if (this.firstUpdate) {
        this.getSleepingPosition().ifPresent(this::setPositionInBed);
    }
    
    // 服务器端的附魔处理
    if (this.getWorld() instanceof ServerWorld) {
        EnchantmentHelper.onTick((ServerWorld)this.getWorld(), this);
    }
    
    super.baseTick();
    
    // 窒息伤害检测
    if (!this.getWorld().isClient) {
        if (this.isInsideWall()) {
            this.damage(this.getDamageSources().inWall(), 1.0f);
        }
    }
    
    // 水下呼吸
    if (this.isSubmergedIn(FluidTags.WATER) && !this.canBreatheInWater()) {
        this.setAir(this.getNextAirUnderwater(this.getAir()));
        if (this.getAir() == -20) {
            this.setAir(0);
            this.damage(this.getDamageSources().drown(), 2.0f);
        }
    } else if (this.getAir() < this.getMaxAir()) {
        this.setAir(this.getNextAirOnLand(this.getAir()));
    }
    
    // 更新药水效果
    this.tickStatusEffects();
    
    // 更新旋转角度插值
    this.prevLookDirection = this.lookDirection;
    this.prevBodyYaw = this.bodyYaw;
    this.prevHeadYaw = this.headYaw;
}
```

---

## 3. AI 大脑系统 (Brain)

### 3.1 Brain 类结构

```java
61:139:Brain.java
public class Brain<E extends LivingEntity> {
    private final Supplier<Codec<Brain<E>>> codecSupplier;
    private static final int ACTIVITY_REFRESH_COOLDOWN = 20;
    
    // 记忆系统
    private final Map<MemoryModuleType<?>, Optional<? extends Memory<?>>> memories = Maps.newHashMap();
    
    // 传感器系统
    private final Map<SensorType<? extends Sensor<? super E>>, Sensor<? super E>> sensors = Maps.newLinkedHashMap();
    
    // 任务系统
    private final Map<Integer, Map<Activity, Set<Task<? super E>>>> tasks = Maps.newTreeMap();
    
    // 日程安排
    private Schedule schedule = Schedule.EMPTY;
    private final Map<Activity, Set<Pair<MemoryModuleType<?>, MemoryModuleState>>> requiredActivityMemories = Maps.newHashMap();
    private final Map<Activity, Set<MemoryModuleType<?>>> forgettingActivityMemories = Maps.newHashMap();
    
    // 活动状态
    private Set<Activity> coreActivities = Sets.newHashSet();
    private final Set<Activity> possibleActivities = Sets.newHashSet();
    private Activity defaultActivity = Activity.IDLE;
}
```

### 3.2 记忆系统 (Memory)

```java
// 记忆模块类型
public class MemoryModuleType<T> {
    private final Codec<T> codec;
    // ...
}

// 记忆条目
public class Memory<U> {
    private final U value;
    private final long expiryTime;  // 过期时间
    private long globalExpiryTime;
    
    public boolean isExpired() {
        return this.expiryTime != Long.MAX_VALUE && Util.getMeasuringTimeMs() > this.expiryTime + this.globalExpiryTime;
    }
}

// Brain中的记忆操作
public <U> void remember(MemoryModuleType<U> type, U value, long expiry) {
    this.setMemory(type, Optional.of(Memory.timed(value, expiry)));
}

public <U> void remember(MemoryModuleType<U> type, @Nullable U value) {
    this.remember(type, Optional.ofNullable(value));
}

public <U> void forget(MemoryModuleType<U> type) {
    this.setMemory(type, Optional.empty());
}

public <U> Optional<U> getOptionalRegisteredMemory(MemoryModuleType<U> type) {
    Optional<Memory<?>> optional = this.memories.get(type);
    if (optional == null) {
        throw new IllegalStateException("Unregistered memory fetched: " + type);
    }
    return optional.map(Memory::getValue);
}
```

### 3.3 传感器系统 (Sensor)

```java
// 传感器基类
public abstract class Sensor<E extends LivingEntity> {
    private static final int DEFAULT_MAX_VISIBLE = 128;
    
    public abstract void sense(ServerWorld world, E entity);
    
    public abstract Set<MemoryModuleType<?>> getOutputMemoryModules();
    
    public int getMaxVisible() {
        return 128;
    }
}

// 常用传感器示例
public class NearestLivingEntitiesSensor extends Sensor<LivingEntity> {
    @Override
    public void sense(ServerWorld world, LivingEntity entity) {
        List<LivingEntity> list = world.getTargetableEntities(
            entity, 
            this.getMaxVisible(), 
            entity -> entity.getType() != EntityType.PLAYER || !((PlayerEntity)entity).isCreative()
        );
        entity.getBrain().remember(MemoryModuleType.NEAREST_LIVING_ENTITIES, list);
    }
    
    @Override
    public Set<MemoryModuleType<?>> getOutputMemoryModules() {
        return ImmutableSet.of(MemoryModuleType.NEAREST_LIVING_ENTITIES);
    }
}
```

### 3.4 活动系统 (Activity)

```java
// 活动类型
public class Activity {
    public static final Activity CORE = new Activity("core");
    public static final Activity IDLE = new Activity("idle");
    public static final Activity WORK = new Activity("work");
    public static final Activity PLAY = new Activity("play");
    public static final Activity REST = new Activity("rest");
    public static final Activity MELEE_COMBAT = new Activity("melee_combat");
    public static final Activity RANGED_COMBAT = new Activity("ranged_combat");
    public static final Activity FLEE = new Activity("flee");
}

// 日程安排
public class Schedule {
    public static final Schedule EMPTY = new Schedule();
    
    private final Map<Integer, Activity> activityForTime = new Object2IntOpenHashMap<>();
    
    public Activity getActivityForTime(int time) {
        return this.activityForTime.get(time);
    }
}

// Brain Tick
public void tick(ServerWorld world, E entity) {
    // 1. Tick记忆（处理过期）
    this.tickMemories();
    
    // 2. Tick传感器（收集信息）
    this.tickSensors(world, entity);
    
    // 3. 启动满足条件的任务
    this.startTasks(world, entity);
    
    // 4. 更新运行中的任务
    this.updateTasks(world, entity);
}

public void refreshActivities(long timeOfDay, long time) {
    if (time - this.activityStartTime > 20L) {
        this.activityStartTime = time;
        Activity activity = this.getSchedule().getActivityForTime((int)(timeOfDay % 24000L));
        if (!this.possibleActivities.contains(activity)) {
            this.doExclusively(activity);
        }
    }
}
```

### 3.5 任务系统 (Task)

```java
// 任务基类
public abstract class Task<E extends LivingEntity> {
    private final int minRunTime;
    private final int maxRunTime;
    protected MultiTickTask.Status status = MultiTickTask.Status.STOPPED;
    protected long startTime;
    protected long endTime;
    
    public MultiTickTask.Status getStatus() {
        return this.status;
    }
    
    public void tryStarting(ServerWorld world, E entity, long time) {
        if (this.canRun(entity)) {
            this.status = MultiTickTask.Status.RUNNING;
            this.start(world, entity, time);
        }
    }
    
    public void tick(ServerWorld world, E entity, long time) {
        if (this.status == MultiTickTask.Status.RUNNING) {
            if (!this.shouldKeepRunning(entity) || time > this.endTime) {
                this.doStop(world, entity, time);
            } else {
                this.run(world, entity, time);
            }
        }
    }
    
    protected abstract boolean canRun(E entity);
    protected abstract void start(ServerWorld world, E entity, long time);
    protected abstract void run(ServerWorld world, E entity, long time);
    protected abstract void stop(ServerWorld world, E entity, long time);
}

// 任务状态
public enum Status {
    STOPPED,   // 停止
    RUNNING,   // 运行中
    FINISHED   // 已完成
}
```

---

## 4. 实体类型系统 (EntityType)

### 4.1 EntityType 类结构

```java
// 实体类型注册
public class EntityType<T extends Entity> {
    public static final MapCodec<EntityType<?>> CODEC = RecordCodecBuilder.mapCodec(
        instance -> instance.group(
            Registries.ENTITY_TYPE.getEntryCodec().fieldOf("type").forGetter(EntityType::getCodecId),
            EntityComponentMap.Factory.getCodec().forGetter(EntityType::getComponents)
        ).apply(instance, (type, components) -> type)
    );
    
    private final EntityFactory<T> factory;
    private final MapCodec<EntityType<T>> codec;
    private final Map<MemoryModuleType<?>, MemoryStatus> attachedMemories;
    private final EntityDimensions dimensions;
    private final boolean saveable;
    private final boolean summonable;
    private final boolean spawnable;
    
    // 实体创建
    public T create(World world) {
        return this.factory.create(this, world);
    }
    
    // 实体生成
    public List<Entity> spawn(ServerWorld world, @Nullable NbtCompound nbt, 
                             @Nullable Consumer<T> customizer, BlockPos pos,
                             SpawnReason spawnReason, boolean align, boolean invertY) {
        // ...
    }
}
```

### 4.2 实体维度 (EntityDimensions)

```java
public class EntityDimensions {
    private final float width;
    private final float height;
    private final boolean fixed;
    
    public Box getBoxAt(Vec3d pos) {
        return new Box(
            pos.x - this.width / 2.0,
            pos.y,
            pos.z - this.width / 2.0,
            pos.x + this.width / 2.0,
            pos.y + this.height,
            pos.z + this.width / 2.0
        );
    }
    
    public EntityDimensions scaling(float factor) {
        return new EntityDimensions(this.width * factor, this.height * factor, this.fixed);
    }
}
```

---

## 5. 移动控制系统

### 5.1 移动控制类型

```java
// 基础移动控制
public abstract class MoveControl {
    protected final MobEntity entity;
    protected double targetX;
    protected double targetY;
    protected double targetZ;
    protected double speed;
    
    public abstract void tick();
}

// 陆地移动
public class OrdinaryEntityMoveControl implements MoveControl {
    @Override
    public void tick() {
        // 处理地面移动逻辑
    }
}

// 水下移动
public class AquaticMoveControl implements MoveControl {
    @Override
    public void tick() {
        // 处理水下移动逻辑
    }
}

// 飞行移动
public class FlightMoveControl implements MoveControl {
    @Override
    public void tick() {
        // 处理飞行移动逻辑
    }
}
```

### 5.2 路径导航

```java
// 路径节点
public class PathNode {
    public int x, y, z;
    public float penalty;
    public PathNode previous;
    public boolean visited;
    public PathNodeType type;
}

// 路径
public class Path {
    private final PathNode[] nodes;
    private int currentNodeIndex;
    
    public Vec3d getPos(float entityWidth, float entityHeight) {
        // 根据节点计算路径点
    }
    
    public boolean isFinished() {
        return this.currentNodeIndex >= this.nodes.length;
    }
}

// 导航系统
public abstract class EntityNavigation {
    protected final MobEntity entity;
    protected Path path;
    protected double speed;
    
    public void tick() {
        if (this.path != null && !this.path.isFinished()) {
            this.followPath();
        }
    }
    
    protected void followPath() {
        // 跟随路径移动
    }
    
    public boolean moveTo(double x, double y, double z, double speed) {
        // 移动到目标位置
    }
}
```

#### 5.2.1 A* 路径搜索算法

Minecraft 使用 A* 算法优化路径搜索：

```java
//astarsearcher.java 简化示意
public class AStarNode implements Comparable<AStarNode> {
    public int x, y, z;
    public float gScore;      // 从起点到当前节点的实际代价
    public float fScore;      // gScore + 启发式估计
    public AStarNode parent;  // 父节点（用于回溯路径）
    public float penalty;    // 路径惩罚（用于穿越困难地形）

    @Override
    public int compareTo(AStarNode other) {
        return Float.compare(this.fScore, other.fScore);
    }
}

// A* 搜索核心
public class AStarPathFinder {
    private static final int MAX_ITERATIONS = 65536;

    public Path findPath(NodeProcessor processor, BlockPos start, BlockPos end,
                        int maxIterations, float followDistance) {

        AStarNode startNode = new AStarNode(start);
        AStarNode endNode = new AStarNode(end);

        // 优先队列（按 fScore 排序）
        PriorityQueue<AStarNode> openSet = new PriorityQueue<>();
        openSet.add(startNode);

        // 已访问集合
        Set<Long> visited = new HashSet<>();
        visited.add(toLong(startNode));

        while (!openSet.isEmpty() && maxIterations-- > 0) {
            // 取出 fScore 最小的节点
            AStarNode current = openSet.poll();

            // 到达目标
            if (current.distanceTo(endNode) < followDistance) {
                return reconstructPath(current);
            }

            // 遍历邻居
            for (AStarNode neighbor : processor.getSuccessors(current)) {
                // 计算 gScore
                float tentativeGScore = current.gScore +
                    current.distanceTo(neighbor) + neighbor.penalty;

                if (tentativeGScore < neighbor.gScore) {
                    neighbor.parent = current;
                    neighbor.gScore = tentativeGScore;
                    neighbor.fScore = tentativeGScore + heuristic(neighbor, endNode);

                    if (!visited.contains(toLong(neighbor))) {
                        openSet.add(neighbor);
                        visited.add(toLong(neighbor));
                    }
                }
            }
        }
        return null; // 未找到路径
    }

    // 启发式函数（曼哈顿距离或欧几里得距离）
    private float heuristic(AStarNode a, AStarNode b) {
        return a.distanceTo(b);
    }
}
```

**关键设计特点：**

| 特性 | 实现 | 说明 |
|------|------|------|
| 优先队列 | `PriorityQueue` | 保证每次取出最优节点 |
| 已访问集合 | `HashSet<Long>` | O(1) 查找，避免重复处理 |
| 最大迭代次数 | `MAX_ITERATIONS=65536` | 防止搜索过深 |
| 路径惩罚 | `penalty` | 穿过岩浆/水等困难地形时增加代价 |
| 跳点搜索 | `JumpPointSearch` | 优化直线移动，跳过中间节点 |

---

## 6. 瞄准系统 (TargetPredicate)

### 6.1 目标选择器

```java
public class TargetPredicate {
    private DistanceDistancePredicate distance;
    private EntityTypePredicate entityType;
    private ScoreboardPredicate scoreboard;
    private EntityTypePredicate§<Entity> relation;
    private Set<Byte> flags;
    private Map<RegistryEntry<DamageType>, DamagePredicate> damageTypes;
    
    public static TargetPredicate createAttackable() {
        return new TargetPredicate()
            .setBaseMaxDistance(64.0)
            .includeHidden()
            .setPredicate(Entity::isAlive);
    }
    
    public static TargetPredicate createNonAttackable() {
        return new TargetPredicate()
            .setBaseMaxDistance(64.0)
            .setPredicate(entity -> !entity.isDiscrete());
    }
    
    public boolean test(@Nullable LivingEntity attacker, LivingEntity target) {
        // 测试目标是否满足条件
    }
}
```

---

## 7. 关键算法和流程

### 7.1 实体加载/保存流程

```
// NBT序列化
public void writeNbt(NbtCompound nbt) {
    // 1. 保存类型
    nbt.putString("id", Registries.ENTITY_TYPE.getId(this.type).toString());
    
    // 2. 保存UUID
    nbt.putUuid("UUID", this.uuid);
    
    // 3. 保存位置
    nbt.putDouble("Pos", this.pos.toVector3fArray());
    
    // 4. 保存旋转
    nbt.putFloat("YRot", this.yaw);
    nbt.putFloat("XRot", this.pitch);
    
    // 5. 保存速度
    nbt.putDouble("Motion", this.velocity.toVector3fArray());
    
    // 6. 保存FallDistance
    nbt.putFloat("FallDistance", this.fallDistance);
    
    // 7. 保存FireTicks
    nbt.putShort("Fire", (short)this.fireTicks);
    
    // 8. 保存Air
    nbt.putShort("Air", (short)this.getAir());
    
    // 9. 保存OnGround
    nbt.putBoolean("OnGround", this.onGround);
    
    // 10. 保存CustomName
    if (this.getCustomName() != null) {
        nbt.put("CustomName", NbtOps.INSTANCE.convertTo(JsonOps.COMPRESSED, this.getDisplayName()));
    }
    
    // 11. 保存数据追踪器数据
    // ...
    
    // 12. 保存Passengers
    if (!this.passengerList.isEmpty()) {
        NbtList passengers = new NbtList();
        for (Entity passenger : this.passengerList) {
            NbtCompound passengerNbt = new NbtCompound();
            passenger.writeNbt(passengerNbt);
            passengers.add(passengerNbt);
        }
        nbt.put("Passengers", passengers);
    }
}
```

### 7.2 实体碰撞检测

```
实体碰撞检测流程
         │
         ▼
┌────────────────────────┐
│ 计算实体边界盒          │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ 获取区块内所有实体      │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ 边界盒相交检测          │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ 返回所有碰撞实体        │
└────────────────────────┘
```

### 7.3 生物AI决策循环

```
每个Tick
         │
         ▼
┌────────────────────────┐
│ Brain.tick()            │
└────────────────────────┘
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
┌────────────────────────┐    ┌────────────────────────┐
│  1. tickMemories()      │    │  2. tickSensors()       │
│  - 检查记忆过期          │    │  - 传感器收集环境信息    │
│  - 更新记忆状态          │    │  - 更新记忆模块          │
└────────────────────────┘    └────────────────────────┘
         │                                  │
         └──────────────────────────────────┤
                                           ▼
                              ┌────────────────────────┐
                              │  3. refreshActivities()  │
                              │  - 根据日程更新活动       │
                              │  - 检查活动切换条件       │
                              └────────────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │  4. startTasks()       │
                              │  - 检查任务启动条件      │
                              │  - 启动满足条件的任务    │
                              └────────────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │  5. updateTasks()       │
                              │  - 更新运行中的任务      │
                              │  - 检查是否需要停止      │
                              └────────────────────────┘
```

---

## 8. 属性系统详解

### 8.1 属性类型

```java
public static class EntityAttributes {
    // 通用属性
    public static final EntityAttribute GENERIC_MAX_HEALTH;
    public static final EntityAttribute GENERIC_FOLLOW_RANGE;
    public static final EntityAttribute GENERIC_KNOCKBACK_RESISTANCE;
    public static final EntityAttribute GENERIC_MOVEMENT_SPEED;
    public static final EntityAttribute GENERIC_ARMOR;
    public static final EntityAttribute GENERIC_ARMOR_TOUGHNESS;
    public static final EntityAttribute GENERIC_ATTACK_DAMAGE;
    public static final EntityAttribute GENERIC_ATTACK_KNOCKBACK;
    public static final EntityAttribute GENERIC_MAX_ABSORPTION;
    
    // 特殊属性
    public static final EntityAttribute GENERIC_STEP_HEIGHT;
    public static final EntityAttribute GENERIC_GRAVITY;
    public static final EntityAttribute GENERIC_LUCK;
    public static final EntityAttribute GENERIC_SAFE_FALL_DISTANCE;
    public static final EntityAttribute GENERIC_FALL_DAMAGE_MULTIPLIER;
    
    // 游泳/攀爬属性
    public static final EntityAttribute HORSE_JUMP_STRENGTH;
    public static final EntityAttribute FLYING_SPEED;
    public static final EntityAttribute SPAWN_REINFORCEMENTS_CHANCE;
}
```

### 8.2 属性修饰符

```java
// 修饰符操作
public enum Operation {
    ADD_VALUE,           // 加法
    MULTIPLY_BASE,       // 乘法（基于基础值）
    MULTIPLY_TOTAL       // 乘法（基于最终值）
}

// 修饰符
public class EntityAttributeModifier {
    private final UUID uuid;
    private final String name;
    private final double value;
    private final Operation operation;
    
    // 示例：疾跑速度加成
    public static final EntityAttributeModifier SPRINTING_SPEED_BOOST = 
        new EntityAttributeModifier(
            Identifier.ofVanilla("sprinting"), 
            0.3f, 
            EntityAttributeModifier.Operation.ADD_MULTIPLIED_TOTAL
        );
}
```

### 8.3 属性容器

```java
public class AttributeContainer {
    private final Map<RegistryEntry<EntityAttribute>, EntityAttributeInstance> instances;
    
    public double getValue(EntityAttribute attribute) {
        EntityAttributeInstance instance = this.instances.get(attribute);
        return instance != null ? instance.getValue() : attribute.getDefaultValue();
    }
    
    public void addTemporaryModifier(EntityAttributeModifier modifier) {
        // 临时添加修饰符
    }
    
    public void removeModifier(Identifier id) {
        // 移除指定修饰符
    }
}
```

---

## 9. 数据同步系统

### 9.1 数据追踪器

```java
public class DataTracker {
    private final Map<TrackedData<?>, Object> entries = new Object2ObjectOpenHashMap<>();
    
    public static <T> TrackedData<T> registerData(Class<?> owner, TrackedDataHandler<T> handler) {
        return TrackedData.registerData(TrackedDataHolder.getLocalId(owner), handler);
    }
    
    public <T> void add(TrackedData<T> data, T defaultValue) {
        this.entries.put(data, defaultValue);
    }
    
    public <T> T get(TrackedData<T> data) {
        return (T) this.entries.get(data);
    }
    
    public <T> void set(TrackedData<T> data, T value) {
        this.entries.put(data, value);
        this.dirty.add(data);
    }
}
```

### 9.2 常用追踪数据

```java
// Entity级别
FLAGS              - 实体标志位（燃烧、下潜等）
AIR                - 剩余空气时间
CUSTOM_NAME        - 自定义名称
NAME_VISIBLE       - 名称可见性
SILENT            - 静音
NO_GRAVITY        - 无重力
POSE              - 姿势

// LivingEntity级别
LIVING_FLAGS       - 生命实体标志
HEALTH             - 生命值
POTION_SWIRLS     - 药水粒子效果
STUCK_ARROW_COUNT - 插入的箭矢数量
STINGER_COUNT     - 刺数量
SLEEPING_POSITION - 睡眠位置
```

---

## 10. 文件结构

```
source/net/minecraft/entity/
├── Entity.java                       # 基础实体类
├── LivingEntity.java                 # 有生命实体
├── MobEntity.java                    # 生物基类
├── EntityType.java                   # 实体类型注册
├── EntityDimensions.java             # 实体尺寸
├── EntityPose.java                   # 实体姿势
├── EntityAttachments.java            # 实体附件
├── data/
│   ├── DataTracker.java             # 数据追踪器
│   ├── TrackedData.java             # 追踪数据
│   └── TrackedDataHandler.java      # 数据处理器
├── ai/
│   ├── brain/
│   │   ├── Brain.java              # AI大脑
│   │   ├── Activity.java            # 活动
│   │   ├── Memory.java              # 记忆
│   │   ├── MemoryModuleType.java    # 记忆模块类型
│   │   ├── Schedule.java            # 日程表
│   │   ├── LookTarget.java          # 注视目标
│   │   ├── WalkTarget.java          # 行走目标
│   │   └── sensor/                  # 传感器
│   │       ├── Sensor.java          # 传感器基类
│   │       └── NearestLivingEntitiesSensor.java
│   ├── control/
│   │   ├── MoveControl.java        # 移动控制
│   │   ├── LookControl.java        # 注视控制
│   │   └── JumpControl.java        # 跳跃控制
│   ├── goal/
│   │   ├── Goal.java              # 目标基类
│   │   ├── MoveToTargetGoal.java
│   │   └── MeleeAttackGoal.java
│   └── pathing/
│       ├── EntityNavigation.java    # 路径导航
│       ├── Path.java                # 路径
│       └── PathNode.java            # 路径节点
├── attribute/
│   ├── EntityAttributes.java       # 属性定义
│   ├── EntityAttribute.java         # 属性基类
│   ├── EntityAttributeInstance.java # 属性实例
│   └── EntityAttributeModifier.java # 属性修饰符
├── effect/
│   ├── StatusEffect.java           # 药水效果
│   └── StatusEffectInstance.java   # 效果实例
├── damage/
│   ├── DamageSource.java           # 伤害源
│   ├── DamageSources.java          # 伤害源工厂
│   └── DamageTracker.java          # 伤害追踪
├── mob/                            # 生物实现
│   ├── ZombieEntity.java
│   ├── SkeletonEntity.java
│   └── ...
├── player/
│   ├── PlayerEntity.java
│   ├── ServerPlayerEntity.java
│   └── ...
└── projectile/
    ├── ProjectileEntity.java
    ├── ArrowEntity.java
    └── ...
```

---

## 11. 总结

Minecraft 1.21 的实体系统是一个复杂而精密的系统：

1. **继承层次清晰**：
   - Entity → LivingEntity → MobEntity → SpecificMobs
   - 每层都有明确的职责和抽象

2. **模块化设计**：
   - 属性系统独立管理实体能力
   - AI系统通过Brain-Sensor-Task解耦
   - 数据同步通过DataTracker统一管理

3. **高性能实现**：
   - 路径导航使用A*算法优化
   - 碰撞检测按区块组织
   - 数据同步增量更新

4. **可扩展性**：
   - EntityType支持新实体注册
   - Goal/Task系统支持自定义AI
   - Sensor系统支持自定义感知

5. **持久化支持**：
   - 完整的NBT序列化/反序列化
   - UUID保证跨会话一致性

这个系统为mod开发提供了丰富的扩展点，同时也确保了游戏运行的稳定性和性能。
