# 第四章：魔法生物 - 自定义实体与 AI

> 在这一章中，我们将创建一个完整的魔法生物，包括自定义实体、属性系统、行为 AI、驯服机制和自然生成。

---

## 目录

1. [概述](#1-概述)
2. [创建实体类](#2-创建实体类)
3. [定义实体属性](#3-定义实体属性)
4. [实现 AI 行为](#4-实现-ai-行为)
5. [驯服系统](#5-驯服系统)
6. [自然生成](#6-自然生成)
7. [与魔法棒联动](#7-与魔法棒联动)
8. [测试运行](#8-测试运行)

---

## 1. 概述

### 1.1 本章目标

魔法水晶精灵是一个可以驯服的魔法生物，具有以下功能：
- **自然生成**：在特定生物群系中自然生成
- **驯服机制**：使用魔法水晶驯服
- **跟随行为**：驯服后跟随玩家
- **攻击行为**：攻击时发射魔法弹
- **坐下命令**：可以被命令坐下

### 1.2 技术架构

```
┌─────────────────────────────────────────────────────┐
│                 魔法生物系统                         │
├──��──────────────────────────────────────────────────┤
│  MagicCreatureEntity (实体)                        │
│  ├── 继承 PathAwareEntity（可寻路）                 │
│  ├── DefaultAttributeContainer（属性）             │
│  └── Tameable（可驯服）                             │
├─────────────────────────────────────────────────────┤
│  MagicCreatureGoals (AI 行为)                       │
│  ├── WanderGoal - 随机游荡                          │
│  ├── FollowOwnerGoal - 跟随主人                    │
│  ├── AttackGoal - 攻击敌人                          │
│  └── SitGoal - 坐下命令                             │
├─────────────────────────────────────────────────────┤
│  Spawn Conditions (生成条件)                        │
│  ├── BiomeModification - 生物群系修改              │
│  └── SpawnWeight - 生成权重                         │
└─────────────────────────────────────────────────────┘
```

---

## 2. 创建实体类

### 2.1 创建魔法生物实体

创建 `src/main/java/net/example/mymod/entity/MagicCreatureEntity.java`：

```java
package net.example.mymod.entity;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.ai.goal.*;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.passive.PassiveEntity;
import net.minecraft.entity.passive.TameableEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;
import org.jetbrains.annotations.Nullable;
import net.example.mymod.entity.ai.FollowOwnerGoal;
import net.example.mymod.entity.ai.MagicAttackGoal;

/**
 * 魔法水晶精灵
 * 特性：
 * - 可被驯服
 * - 跟随玩家
 * - 发射魔法弹攻击
 */
public class MagicCreatureEntity extends TameableEntity {
    
    public MagicCreatureEntity(EntityType<? extends MagicCreatureEntity> type, World world) {
        super(type, world);
    }
    
    // 定义实体属性
    public static DefaultAttributeContainer.Builder createAttributes() {
        return MobEntity.createMobAttributes()
            // 最大生命值
            .add(EntityAttributes.GENERIC_MAX_HEALTH, 20.0)
            // 移动速度
            .add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.3)
            // 攻击伤害
            .add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 4.0)
            // 击退抗性
            .add(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE, 0.3)
            // 跟踪范围
            .add(EntityAttributes.GENERIC_FOLLOW_RANGE, 32.0);
    }
    
    // 初始化 AI 目标
    @Override
    protected void initGoals() {
        // 获取目标选择器
        this.goalSelector.add(1, new SwimGoal(this));
        
        // 坐下目标（优先级最高）
        this.goalSelector.add(2, new SitGoal(this));
        
        // 跟随主人目标
        this.goalSelector.add(3, new FollowOwnerGoal(this, 1.0, 5.0f, 2.0f));
        
        // 攻击目标
        this.goalSelector.add(4, new MagicAttackGoal(this, 1.0, true));
        
        // 游荡目标（空闲时随机移动）
        this.goalSelector.add(5, new WanderAroundGoal(this, 1.0));
        
        // 看向玩家目标
        this.goalSelector.add(6, new LookAtEntityGoal(this, PlayerEntity.class, 8.0f));
        
        // 目标选择器：选择攻击目标
        this.targetSelector.add(1, new TrackOwnerAttackerGoal(this));
        this.targetSelector.add(2, new ActiveTargetGoal<>(this, PlayerEntity.class, 
            true, this::shouldAttackPlayer));
    }
    
    // 是否应该攻击玩家（未驯服时攻击）
    private boolean shouldAttackPlayer(PlayerEntity player) {
        return !isTamed() && this.canTarget.test(player);
    }
    
    // 生成时调用
    @Override
    public void onSpawn() {
        super.onSpawn();
        
        // 生成时播放音效
        if (!getWorld().isClient()) {
            playSound(net.minecraft.sound.SoundEvents.ENTITY_ELDER_GUARDIAN_HURT, 
                0.5f, 1.0f);
        }
    }
    
    // 每帧更新
    @Override
    public void tick() {
        super.tick();
        
        // 客户端：生成漂浮粒子
        if (getWorld().isClient() && this.age % 20 == 0) {
            spawnParticles();
        }
    }
    
    // 生成魔法粒子
    private void spawnParticles() {
        double x = this.getX() + (getWorld().getRandom().nextDouble() - 0.5) * 1.0;
        double y = this.getY() + 0.5;
        double z = this.getZ() + (getWorld().getRandom().nextDouble() - 0.5) * 1.0;
        
        getWorld().addParticle(
            net.minecraft.particle.ParticleTypes.ENCHANT,
            x, y, z,
            0, 0.05, 0
        );
    }
    
    // 处理交互（用于驯服）
    @Override
    public ActionResult interactMob(PlayerEntity player, net.minecraft.util.Hand hand) {
        ItemStack itemStack = player.getStackInHand(hand);
        
        // 检查是否是魔法水晶
        if (itemStack.getItem() == net.example.mymod.init.ModItems.MAGIC_CRYSTAL) {
            // 未驯服时尝试驯服
            if (!isTamed()) {
                if (!getWorld().isClient()) {
                    // 驯服成功
                    setTamed(true);
                    setOwner(player);
                    
                    // 消耗物品
                    itemStack.decrement(1);
                    
                    // 播放驯服音效
                    playSound(net.minecraft.sound.SoundEvents.ENTITY_CAT_BEG_FOR_FOOD, 
                        1.0f, 1.0f);
                    
                    // 发送消息
                    player.sendMessage(
                        net.minecraft.text.Text.literal("§a魔法生物已被驯服！"),
                        true
                    );
                }
                return ActionResult.SUCCESS;
            }
        }
        
        // 驯服后点击可以命令坐下/起立
        if (isTamed() && isOwner(player)) {
            if (!getWorld().isClient()) {
                setSitting(!isSitting());
                playSound(net.minecraft.sound.SoundEvents.ENTITY_CAT_PURR, 
                    0.5f, 1.0f);
            }
            return ActionResult.SUCCESS;
        }
        
        return super.interactMob(player, hand);
    }
    
    // 处理伤害
    @Override
    public boolean damage(DamageSource source, float amount) {
        boolean result = super.damage(source, amount);
        
        // 受伤时如果有主人，攻击攻击者
        if (result && getOwner() != null && source.getAttacker() != null) {
            this.setTarget((LivingEntity) source.getAttacker());
        }
        
        return result;
    }
    
    // 获取用于繁殖的实体类
    @Override
    public EntityType<? extends PassiveEntity> getBreedOffspring() {
        return net.example.mymod.init.ModEntities.MAGIC_CREATURE;
    }
    
    // 是否可以 breeding
    @Override
    public boolean canBreed() {
        return false;  // 魔法生物不能自然繁殖
    }
}
```

---

## 3. 定义实体属性

### 3.1 在 ModEntities 中注册

更新 `ModEntities.java`：

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.entity.MagicCreatureEntity;
import net.example.mymod.entity.projectile.MagicProjectileEntity;
import net.minecraft.entity.EntityType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModEntities {
    
    // 魔法弹实体
    public static final EntityType<MagicProjectileEntity> MAGIC_PROJECTILE = 
        EntityType.Builder.<MagicProjectileEntity>create(
            MagicProjectileEntity::new,
            EntityType.Group.PROJECTILE
        )
        .dimensions(0.25f, 0.25f)
        .trackRangeBlocks(32)
        .build()
        .setKey(Identifier.of(Mymod.MOD_ID, "magic_projectile"));
    
    // 魔法生物实体
    public static final EntityType<MagicCreatureEntity> MAGIC_CREATURE = 
        EntityType.Builder.<MagicCreatureEntity>create(
            MagicCreatureEntity::new,
            EntityType.Group.CREATURE
        )
        .dimensions(0.6f, 0.8f)  // 宽 0.6，高 0.8
        .trackRangeBlocks(16)
        .defaultStepHeight(0.6f)
        .build()
        .setKey(Identifier.of(Mymod.MOD_ID, "magic_creature"));
    
    public static void register() {
        Registry.register(
            Registries.ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "magic_projectile"),
            MAGIC_PROJECTILE
        );
        
        Registry.register(
            Registries.ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "magic_creature"),
            MAGIC_CREATURE
        );
    }
}
```

### 3.2 实体属性工厂

为了正确设置实体属性，需要创建一个工厂方法。在 `MagicCreatureEntity` 内部已经有 `createAttributes()` 方法，但我们需要确保它在注册时被使用。

由于 Minecraft 1.20+ 的实体属性是通过实体类型工厂自动设置的，我们不需要额外代码。

---

## 4. 实现 AI 行为

### 4.1 创建 AI 行为类

创建 `src/main/java/net/example/mymod/entity/ai/FollowOwnerGoal.java`：

```java
package net.example.mymod.entity.ai;

import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.Goal;
import net.minecraft.entity.passive.TameableEntity;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.math.Vec3d;

import java.util.EnumSet;

/**
 * 跟随主人目标
 * 让已驯服的生物跟随主人
 */
public class FollowOwnerGoal extends Goal {
    
    private final TameableEntity entity;
    private final double speed;
    private final float minDistance;
    private final float maxDistance;
    
    private LivingEntity target;
    private int cooldown = 0;
    
    public FollowOwnerGoal(TameableEntity entity, double speed, 
                           float minDistance, float maxDistance) {
        this.entity = entity;
        this.speed = speed;
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
        
        // 设置 controls：包含移动
        this.setControls(EnumSet.of(Goal.Control.MOVE));
    }
    
    @Override
    public boolean canStart() {
        // 检查是否有主人
        LivingEntity owner = entity.getOwner();
        if (owner == null) {
            return false;
        }
        
        // 如果坐下，不跟随
        if (entity.isSitting()) {
            return false;
        }
        
        this.target = owner;
        return true;
    }
    
    @Override
    public boolean shouldContinue() {
        // 如果坐下或没有主人，停止
        if (entity.isSitting() || entity.getOwner() == null) {
            return false;
        }
        
        // 如果距离太近，不需要跟随
        double distance = entity.squaredDistanceTo(target.getX(), 
            target.getY(), target.getZ());
        
        return distance > (minDistance * minDistance);
    }
    
    @Override
    public void start() {
        cooldown = 0;
    }
    
    @Override
    public void stop() {
        this.target = null;
        // 停止移动
        entity.getNavigation().stop();
    }
    
    @Override
    public void tick() {
        if (target == null) return;
        
        // 检查是否冷却
        if (cooldown > 0) {
            cooldown--;
            return;
        }
        
        // 计算与目标的距离
        double distance = entity.squaredDistanceTo(
            target.getX(), target.getY(), target.getZ()
        );
        
        // 距离太远，尝试靠近
        if (distance > (maxDistance * maxDistance)) {
            Vec3d targetPos = target.getPos();
            
            // 保持在主人上方一点
            Vec3d movePos = new Vec3d(
                targetPos.x,
                targetPos.y + 1.0,
                targetPos.z
            );
            
            entity.getNavigation().startMovingTo(
                entity, movePos, speed
            );
            
            cooldown = 10;  // 每 10 tick 重新计算一次路径
        }
    }
}
```

### 4.2 创建攻击目标

创建 `src/main/java/net/example/mymod/entity/ai/MagicAttackGoal.java`：

```java
package net.example.mymod.entity.ai;

import net.example.mymod.entity.MagicCreatureEntity;
import net.example.mymod.entity.projectile.MagicProjectileEntity;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.world.World;

/**
 * 魔法攻击目标
 * 在一定距离内发射魔法弹攻击敌人
 */
public class MagicAttackGoal extends MeleeAttackGoal {
    
    // 攻击冷却
    private int attackCooldown = 0;
    // 攻击范围（魔法弹射程）
    private static final float ATTACK_RANGE = 16.0f;
    // 最小攻击距离（太近时用近战）
    private static final float MIN_ATTACK_RANGE = 3.0f;
    
    public MagicAttackGoal(MagicCreatureEntity entity, double speed, boolean pauseWhenIdle) {
        super(entity, speed, pauseWhenIdle);
    }
    
    @Override
    public void start() {
        super.start();
        attackCooldown = 0;
    }
    
    @Override
    public void tick() {
        super.tick();
        
        // 更新攻击冷却
        if (attackCooldown > 0) {
            attackCooldown--;
        }
    }
    
    @Override
    protected void attack(LivingEntity target) {
        // 检查是否可以远程攻击
        double distance = this.mob.squaredDistanceTo(target.getPos());
        float range = ATTACK_RANGE;
        
        // 检查是否在攻击范围内
        if (distance > range * range) {
            // 距离太远，不攻击
            return;
        }
        
        // 检查冷却
        if (attackCooldown > 0) {
            return;
        }
        
        // 检查是否太近（太近时用近战）
        if (distance < MIN_ATTACK_RANGE * MIN_ATTACK_RANGE) {
            // 执行近战攻击
            super.attack(target);
            return;
        }
        
        // 发射魔法弹
        shootMagicProjectile(target);
        
        // 设置冷却（2 秒）
        attackCooldown = 40;
    }
    
    // 发射魔法弹
    private void shootMagicProjectile(LivingEntity target) {
        World world = mob.getWorld();
        
        if (!(world instanceof ServerWorld serverWorld)) {
            return;
        }
        
        // 创建魔法弹实体
        MagicProjectileEntity.shoot(
            world,
            mob,
            java.util.Optional.empty(),  // 没有物品时使用默认
            1.0f  // 满蓄力
        );
        
        // 播放发射音效
        world.playSound(
            null,
            mob.getPos(),
            net.minecraft.sound.SoundEvents.ENTITY_PHANTOM_SHOOT,
            net.minecraft.sound.SoundCategory.HOSTILE,
            0.5f, 0.8f
        );
    }
}
```

### 4.3 修改 MagicProjectileEntity 支持空物品发射

更新 `MagicProjectileEntity` 支持不需要物品的发射方式：

```java
// 在 MagicProjectileEntity 中添加重载方法
public static void shoot(World world, LivingEntity shooter, 
                          java.util.Optional<ItemStack> wandStack, float charge) {
    if (!(world instanceof ServerWorld serverWorld)) return;
    
    EntityType<MagicProjectileEntity> entityType = 
        net.example.mymod.init.ModEntities.MAGIC_PROJECTILE;
    
    MagicProjectileEntity projectile = entityType.create(serverWorld);
    if (projectile == null) return;
    
    projectile.setOwner(shooter);
    
    // 设置位置
    projectile.setPosition(
        shooter.getX(),
        shooter.getEyeY() - 0.1,
        shooter.getZ()
    );
    
    // 计算方向：指向目标
    Vec3d shooterPos = shooter.getPos();
    Vec3d targetPos = target.getPos();
    Vec3d direction = targetPos.subtract(shooterPos).normalize();
    
    float velocity = 1.5f + charge * 2.0f;
    Vec3d velocityVec = direction.multiply(velocity);
    
    projectile.setVelocity(velocityVec);
    
    serverWorld.spawnEntity(projectile);
}
```

---

## 5. 驯服系统

### 5.1 Tameable 接口

`MagicCreatureEntity` 继承自 `TameableEntity`，这提供了：
- `setOwner()` - 设置主人
- `getOwner()` - 获取主人
- `isTamed()` - 是否已驯服
- `isOwner()` - 检查是否是主人
- `setSitting()` / `isSitting()` - 坐下/起立

### 5.2 驯服逻辑

在 `MagicCreatureEntity.interactMob()` 方法中，我们实现了：
1. 检查玩家手持物品是否为魔法水晶
2. 如果未驯服，使用水晶驯服
3. 如果已驯服且是主人，点击切换坐下状态

### 5.3 攻击目标选择

添加 `TrackOwnerAttackerGoal` 来让魔法生物在受伤时攻击伤害来源：

```java
// 在 initGoals 中添加
this.targetSelector.add(1, new TrackOwnerAttackerGoal(this));
```

---

## 6. 自然生成

### 6.1 创建生成条件类

创建 `src/main/java/net/example/mymod/world/ModWorldEvents.java`：

```java
package net.example.mymod.world;

import net.example.mymod.Mymod;
import net.example.mymod.init.ModEntities;
import net.fabricmc.fabric.api.biome.v1.BiomeModificationContext;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.biome.v1.ModificationPhase;
import net.fabricmc.fabric.api.event.player.PlayerEvent;
import net.minecraft.entity.EntityType;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.Biome;

/**
 * 世界生成事件
 * 添加魔法生物的自然生成
 */
public class ModWorldEvents {
    
    public static void registerSpawns() {
        // 使用 Fabric API 的生物群系修改
        net.fabricmc.fabric.api.biome.v1.BiomeModifications.addSpawn(
            BiomeSelectors.includeByKey(
                // 在这些生物群系生成
                BiomeKeys.FOREST,
                BiomeKeys.BIRCH_FOREST,
                BiomeKeys.DARK_FOREST,
                BiomeKeys.PLAINS,
                BiomeKeys.SUNFLOWER_PLAINS
            ),
            // 实体类型
            net.fabricmc.fabric.api.biome.v1.SpawnCategory.CREATURE,
            // 实体类型
            ModEntities.MAGIC_CREATURE,
            // 生成权重（越高越容易生成）
            10,
            // 最小生成数量
            1,
            // 最大生成数量
            3
        );
    }
    
    public static void init() {
        registerSpawns();
    }
}
```

### 6.2 使用更简单的生成方式（Fabric 1.20+）

如果你使用的 Fabric 版本较新，可以使用更简单的方式：

```java
package net.example.mymod.world;

import net.example.mymod.Mymod;
import net.example.mymod.init.ModEntities;
import net.minecraft.entity.EntityType;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.tag.BiomeTags;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.Biome;
import net.minecraft.world.biome.SpawnSettings;
import net.minecraft.registry.entry.RegistryEntry;

public class ModWorldEvents {
    
    public static void addSpawn() {
        // 创建生成设置
        SpawnSettings.Builder builder = new SpawnSettings.Builder();
        
        builder.spawn(
            EntityType.SHEEP.getSpawnGroup(),  // 使用羊的组
            new SpawnSettings.SpawnEntry(
                ModEntities.MAGIC_CREATURE,
                10,  // 权重
                1,   // 最小数量
                3    // 最大数量
            )
        );
        
        // 应用到所有森林生物群系
        // 注意：这需要更复杂的 Fabric API 代码
    }
}
```

### 6.3 简单的注册方式

在 Mod 入口中直接添加生成（在 `Mymod.java` 中）：

```java
@Override
public void onInitialize() {
    LOGGER.info("开始加载魔法水晶 Mod...");
    
    // ... 其他注册 ...
    
    // 添加生物生成
    addEntitySpawns();
    
    LOGGER.info("魔法水晶 Mod 加载完成！");
}

private void addEntitySpawns() {
    // 使用 Fabric API 的简化的生物群系修改
    net.fabricmc.fabric.api.biome.v1.BiomeModifications.addSpawn(
        // 选择所有森林类型的生物群系
        net.fabricmc.fabric.api.biome.v1.BiomeSelectors.tag(
            net.minecraft.registry.tag.BiomeTags.IS_FOREST
        ),
        net.fabricmc.fabric.api.biome.v1.SpawnCategory.CREATURE,
        ModEntities.MAGIC_CREATURE,
        8,   // 权重
        1,   // 最小组大小
        3    // 最大组大小
    );
}
```

---

## 7. 与魔法棒联动

### 7.1 魔法生物可以被魔法棒攻击

由于魔法生物继承自 `TameableEntity`（间接继承 `LivingEntity`），魔法弹可以正确识别并造成伤害。

### 7.2 魔法生物可以发射魔法弹

在 `MagicAttackGoal` 中，我们已经实现了魔法生物的攻击逻辑。

---

## 8. 完整代码整合

### 8.1 项目结构

```
src/main/java/net/example/mymod/
├── Mymod.java
├── init/
│   ├── ModBlocks.java
│   ├── ModItems.java
│   ├── ModBlockEntities.java
│   └── ModEntities.java
├── block/
│   └── MagicCrystalBlock.java
├── block/entity/
│   └── MagicCrystalBlockEntity.java
├── item/
│   ├── MagicCrystalItem.java
│   └── MagicWandItem.java
├── entity/
│   ├── MagicCreatureEntity.java
│   └── projectile/
│       └── MagicProjectileEntity.java
├── entity/ai/
│   ├── FollowOwnerGoal.java
│   └── MagicAttackGoal.java
├── network/
│   └── ModNetworking.java
└── world/
    └── ModWorldEvents.java
```

### 8.2 代码要点回顾

| 类 | 职责 | 关键方法 |
|-----|------|----------|
| `MagicCreatureEntity` | 实体核心 | `initGoals()` - AI 初始化 |
| `FollowOwnerGoal` | 跟随行为 | `tick()` - 跟随逻辑 |
| `MagicAttackGoal` | 攻击行为 | `shootMagicProjectile()` - 发射 |
| `ModWorldEvents` | 自然生成 | `addSpawn()` - 添加生成 |

---

## 9. 测试运行

### 9.1 编译并运行

```bash
./gradlew build
./gradlew runClient
```

### 9.2 游戏内测试

1. **自然生成测试**：
   - 创建一个新的世界
   - 进入森林生物群系
   - 等待一段时间，观察是否有魔法生物生成

2. **驯服测试**：
   - 找到魔法生物
   - 给予魔法水晶：
     ```
     /give @p mymod:magic_crystal
     ```
   - 右键点击魔法生物
   - 观察是否被驯服

3. **跟随测试**：
   - 驯服后走开
   - 观察魔法生物是否跟随

4. **坐下测试**：
   - 驯服后右键点击
   - 观察坐下/起立状态切换

5. **攻击测试**：
   - 攻击魔法生物（或其他生物）
   - 观察魔法生物发射魔法弹攻击

6. **与魔法棒联动**：
   - 用魔法棒射击魔法生物
   - 观察伤害效果

### 9.3 预期效果

| 功能 | 预期结果 |
|------|----------|
| 自然生成 | 森林中随机生成 |
| 驯服 | 使用水晶驯服，显示消息 |
| 跟随 | 保持一定距离跟随 |
| 坐下 | 右键切换坐下状态 |
| 攻击 | 发射魔法弹攻击目标 |
| 受伤 | 攻击伤害来源 |

---

## 常见问题

### Q1: 魔法生物不生成？
检查生成条件是否正确，确保生物群系选择正确。尝试增加生成权重。

### Q2: 魔法生物不跟随？
检查 `FollowOwnerGoal` 是否正确添加，确保 `setControls` 包含 `MOVE`。

### Q3: 魔法弹发射方向错误？
检查 `shoot` 方法中的方向计算。

### Q4: 驯服没有效果？
检查 `interactMob` 方法，确保正确使用 `isTamed()` 和 `setOwner()`。

---

## 进阶功能

完成基础功能后，可以尝试扩展：

1. **繁殖系统**
   - 允许两只已驯服的魔法生物繁殖

2. **进化系统**
   - 使用不同水晶让魔法生物进化

3. **特殊技能**
   - 添加更多攻击模式

4. **骑乘系统**
   - 允许玩家骑乘魔法生物

---

## 项目完成总结

恭喜！你已经完成了整个魔法水晶 Mod 的开发：

- ✅ **魔法水晶方块**：发光、可收集
- ✅ **魔法水晶物品**：可堆叠、有工具提示
- ✅ **魔法棒**：蓄力发射、网络通信
- ✅ **魔法弹**：粒子效果、伤害判定、爆炸效果
- ✅ **魔法生物**：自然生成、驯服、跟随、攻击

这是一个完整的、功能丰富的 Mod，涵盖了 Fabric 开发的核心知识点。

---

*你的魔法冒险已经开始了！创造出更多神奇的内容吧！*