# 第一章：实体基础

> 这一章学习如何在 Fabric 中创建自定义实体，包括生物、怪物等。

---

## 目录

1. [实体概述](#1-实体概述)
2. [创建基本实体](#2-创建基本实体)
3. [注册实体](#3-注册实体)
4. [实体行为](#4-实体行为)
5. [实体生成](#5-实体生成)
6. [完整示例](#6-完整示例)

---

## 1. 实体概述

### 1.1 什么是实体？

实体是 Minecraft 中可以移动和交互的对象，包括：
- 生物（玩家、动物、怪物）
- 物品掉落物
- 箭矢、投掷物
- 矿车、船

### 1.2 实体的类型

```
┌─────────────────────────────────────┐
│              实体类型                    │
├─────────────────────────────────────┤
│  LivingEntity (活物)                  │
│  ├── MobEntity (生物)                 │
│  │   ├── CreatureEntity (动物)         │
│  │   └── MonsterEntity (怪物)          │
│  └── PlayerEntity (玩家)               │
├─────────────────────────────────────┤
│  Entity (非活物)                       │
│  ├── ItemEntity (掉落物)               │
│  ├── ProjectileEntity (弹射物)        │
│  └── ExperienceOrbEntity (经验球)     │
└─────────────────────────────────────┘
```

---

## 2. 创建基本实体

### 2.1 创建实体类

```java
package net.example.mymod.entity;

import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.control.JumpControl;
import net.minecraft.entity.ai.control.LookControl;
import net.minecraft.entity.ai.control.MoveControl;
import net.minecraft.entity.ai.pathfinding.PathNodeType;
import net.minecraft.entity.ai.pathfinding.SwimNavigation;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.mob.PathAwareEntity;
import net.minecraft.world.World;

public class MagicSlimeEntity extends PathAwareEntity {

    public MagicSlimeEntity(EntityType<? extends PathAwareEntity> entityType, World world) {
        super(entityType, world);
    }

    @Override
    protected void initGoals() {
        // 在这里设置 AI 目标
    }
}
```

### 2.2 实体属性

```java
public static DefaultAttributeContainer.Builder createSlimeAttributes() {
    return LivingEntity.createLivingAttributes()
        .add(EntityAttributes.GENERIC_MAX_HEALTH, 20.0)     // 最大生命
        .add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.25)  // 移动速度
        .add(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE, 0.5)  // 抗击退
        .add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 3.0)    // 攻击伤害
        .add(EntityAttributes.GENERIC_FOLLOW_RANGE, 16.0);   // 追踪范围
}
```

---

## 3. 注册实体

### 3.1 定义实体类型

```java
public static final EntityType<MagicSlimeEntity> MAGIC_SLIME = EntityType.Builder
    .create(MagicSlimeEntity::new, SpawnGroup.CREATURE)
    .dimensions(1.0f, 1.0f)          // 碰撞箱大小
    .maxTrackDistance(16.0f)          // 最大追踪距离
    .trackRangeChunks(8)              // 追踪范围（区块）
    .build("magic_slime");
```

### 3.2 注册实体

```java
public static void register() {
    Registry.register(
        Registries.ENTITY_TYPE,
        Identifier.of(MOD_ID, "magic_slime"),
        MAGIC_SLIME
    );
}
```

### 3.3 实体参数说明

```java
EntityType.Builder.create(Factory, SpawnGroup)
    .dimensions(width, height)           // 宽和高
    .maxTrackDistance(distance)          // 最大追踪距离
    .trackRangeChunks(chunks)            // 追踪区块范围
    .fireImmune()                        // 火焰免疫
    .spawnMethod(SpawnCondition)         // 生成条件
    .build(id)                           // ID
```

---

## 4. 实体行为

### 4.1 添加 AI 目标

```java
@Override
protected void initGoals() {
    // 设置目标优先级
    this.goalSelector.add(0, new WanderAroundGoal(this, 1.0));
    this.goalSelector.add(1, new LookAtEntityGoal(this, PlayerEntity.class, 8.0f));
    this.goalSelector.add(2, new LookAtEntityGoal(this, MagicSlimeEntity.class, 8.0f));
    this.goalSelector.add(3, new SwimGoal(this));

    // 目标
    this.targetSelector.add(0, new RevengeGoal(this));
    this.targetSelector.add(1, new ActiveTargetGoal<>(this, PlayerEntity.class, true));
}
```

### 4.2 常用 AI 目标

```java
// 移动目标
new WanderAroundGoal(this, speed)           // 徘徊
new GoToWalkTargetGoal(this, speed)         // 走向目标点
new SwimGoal(this)                          // 游泳
new FleeEntityGoal<>(this, PlayerEntity.class, range)  // 逃离玩家

// 看向目标
new LookAtEntityGoal(this, PlayerEntity.class, distance)  // 看玩家
new LookAtEntityGoal(this, EntityType, distance)          // 看其他实体

// 攻击目标
new ActiveTargetGoal<>(this, EntityType, keepDistance)     // 主动攻击
new MeleeAttackGoal(this, speed, shouldFollow)            // 近战攻击
new FollowTargetGoal<>(this, EntityType)                 // 追踪目标

// 其他
new BreatheAirGoal(this)                   // 呼吸空气
new EatGrassGoal(this)                     // 吃草
```

---

## 5. 实体生成

### 5.1 生物群系生成

```java
// 在 Mod 初始化时注册
public void onInitialize() {
    // 添加到草地生物群系
    BiomeModifications.addSpawn(
        BiomeSelectors.includeByKey(BiomeKeys.PLAINS),  // 生物群系
        SpawnGroup.CREATURE,                             // 生成组
        ModEntities.MAGIC_SLIME,                         // 实体类型
        10,                                              // 权重
        1,                                               // 最小数量
        4                                                // 最大数量
    );
}
```

### 5.2 生成条件

```java
// 选择特定生物群系
BiomeSelectors.includeByKey(
    BiomeKeys.PLAINS,
    BiomeKeys.FOREST,
    BiomeKeys.BIRCH_FOREST
)

// 排除特定生物群系
BiomeSelectors.excludeByKey(
    BiomeKeys.DESERT,
    BiomeKeys.OCEAN
)

// 自定义选择器
BiomeSelectors.foundInOverworld()  // 主世界
BiomeSelectors.foundInTheNether()   // 下界
BiomeSelectors.foundInTheEnd()     // 末地
```

---

## 6. 完整示例

### 6.1 完整实体类

```java
package net.example.mymod.entity;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.ActiveTargetGoal;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.entity.ai.goal.WanderAroundGoal;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.mob.PathAwareEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.world.World;

public class MagicSlimeEntity extends PathAwareEntity {

    public MagicSlimeEntity(EntityType<? extends MagicSlimeEntity> entityType, World world) {
        super(entityType, world);
    }

    public static DefaultAttributeContainer.Builder createAttributes() {
        return LivingEntity.createLivingAttributes()
            .add(EntityAttributes.GENERIC_MAX_HEALTH, 30.0)
            .add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.3)
            .add(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE, 0.5)
            .add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 5.0)
            .add(EntityAttributes.GENERIC_FOLLOW_RANGE, 20.0);
    }

    @Override
    protected void initGoals() {
        // 攻击玩家
        this.goalSelector.add(1, new MeleeAttackGoal(this, 1.2, false));
        this.targetSelector.add(1, new ActiveTargetGoal<>(this, PlayerEntity.class, true));

        // 游荡
        this.goalSelector.add(2, new WanderAroundGoal(this, 0.8));
    }

    @Override
    public boolean isInvulnerableTo(net.minecraft.damage.DamageSource damageSource) {
        // 火焰免疫
        return damageSource.isFire() || super.isInvulnerableTo(damageSource);
    }
}
```

### 6.2 注册

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.entity.MagicSlimeEntity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.world.Heightmap;
import net.minecraft.world.biome.BiomeKeys;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;

public class ModEntities {
    public static final EntityType<MagicSlimeEntity> MAGIC_SLIME = EntityType.Builder
        .create(MagicSlimeEntity::new, SpawnGroup.MONSTER)
        .dimensions(0.8f, 0.8f)
        .maxTrackDistance(16.0f)
        .trackRangeChunks(8)
        .build("magic_slime");

    public static void register() {
        Registry.register(Registries.ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "magic_slime"),
            MAGIC_SLIME
        );
    }

    public static void addSpawns() {
        // 添加到森林生物群系
        BiomeModifications.addSpawn(
            BiomeSelectors.includeByKey(BiomeKeys.FOREST, BiomeKeys.DARK_FOREST),
            SpawnGroup.MONSTER,
            MAGIC_SLIME,
            10,   // 权重
            1,    // 最小群数
            3     // 最大群数
        );
    }
}
```

---

## 下一步

现在你学会了创建实体！接下来可以学习：
- [实体属性](./02-entity-attributes.md) - 自定义实体属性
- [实体生成](./03-spawning.md) - 控制实体生成规则

---

*参考：[实体系统分析](../../analysis/05-entity-event-system.md)*
