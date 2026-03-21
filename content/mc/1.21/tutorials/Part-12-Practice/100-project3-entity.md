# 项目3：添加新生物

> 创建一个会攻击玩家�?火焰精灵"�?
---

## 项目目标

学完这个项目后，你将掌握�?- 如何注册一个自定义实体类型
- 如何创建实体�?- 如何添加属性（生命值、攻击力等）
- 如何添加 AI 行为
- 如何添加掉落物（战利品表�?- 如何添加材质
- 如何测试

---

## 项目概览

```mermaid
flowchart TD
    A[开始项目] --> B[注册实体类型]
    B --> C[创建实体类]
    C --> D[设置实体属性]
    D --> E[添加AI行为]
    E --> F[创建战利品表]
    F --> G[添加材质]
    G --> H[测试游戏]
    
    style A fill:#90EE90
    style H fill:#87CEEB
```

---

## 所需知识

- 注册表基础（Part-1 �?章）
- 实体生命周期（Part-4 �?1章）
- LivingEntity（Part-4 �?2章）
- MobEntity（Part-4 �?3章）
- AI系统（Part-5�?- 战利品表（Part-8 �?2章）

---

## 步骤详解

### 步骤 1：什么是实体�?
#### 实体的层次结�?
```
Entity（实体）
    �?    ├── 不需�?tick 的实�?    �?  ├── 物品掉落�?(ItemEntity)
    �?  ├── 经验�?(ExperienceOrbEntity)
    �?  └── 展示实体 (DisplayEntity)
    �?    └── 需�?tick 的实�?        �?        └── LivingEntity（活着的实体）
                �?                ├── 玩家 (PlayerEntity)
                �?                └── MobEntity（会思考的生物�?                        �?                        ├── 被动生物（猪、牛、羊...�?                        ├── 中立生物（狼、蜜�?..�?                        └── 敌对生物（僵尸、骷�?..�?```

#### 生活中的比喻

```
实体就像游戏中的"角色"�?
┌─────────────────────────────────────────�?�? 实体类型        �? 现实类比            �?├─────────────────┼─────────────────────  �?�? 物品掉落�?    �? 地上掉的钱包        �?�? 经验�?        �? 收集的能量球         �?�? 被动生物       �? 小羊、牛等家�?     �?�? 敌对生物       �? 野狼、狮子等捕食�? �?└─────────────────────────────────────────�?```

---

### 步骤 2：注册实体类�?
#### 核心概念

注册实体类型就像给生�?登记户口"�?
```
┌─────────────────────────────────────────�?�?          Minecraft 注册�?              �?�?                                      �?�? namespace:path = 唯一�?身份证号"     �?�?                                      �?�? "minecraft:pig"        �?�?          �?�? "minecraft:zombie"     �?僵尸         �?�? "mymod:flame_spirit"   �?你的火焰精灵 �?�?                                      �?└─────────────────────────────────────────�?```

#### 代码实现

�?Mod 主类中添加：

```java
public class MyMod implements ModInitializer {
    
    // 定义火焰精灵实体类型
    public static final EntityType<FlameSpiritEntity> FLAME_SPIRIT = 
        EntityType.Builder.create(FlameSpiritEntity::new, SpawnGroup.MONSTER)
            .dimensions(0.6f, 1.8f)           // �?.6，高1.8（类似僵尸）
            .eyeHeight(1.62f)                  // 眼睛高度
            .maxTrackingRange(8)               // 最大追踪距�?            .trackingTickInterval(2)           // 追踪更新间隔
            .build("flame_spirit");           // 注册 ID
}
```

#### EntityType.Builder 参数说明

| 参数 | 说明 | 僵尸参考�?|
|------|------|-----------|
| dimensions | 碰撞箱尺�?| 0.6f, 1.8f |
| eyeHeight | 眼睛高度 | 1.62f |
| maxTrackingRange | 最大追踪范�?| 8 |
| trackingTickInterval | 追踪更新间隔 | 2 |

---

### 步骤 3：创建实体类

#### 为什么需要自定义实体类？

普通实体只能设置属性，但如果你想：
- 自定义生命值和攻击�?- 添加特殊 AI 行为
- 自定义死亡掉�?
就需要创建自定义实体类�?
#### 代码实现

```java
// src/main/java/com/mymod/entity/FlameSpiritEntity.java

public class FlameSpiritEntity extends MobEntity {
    
    // 构造函�?    public FlameSpiritEntity(EntityType<? extends FlameSpiritEntity> entityType, World world) {
        super(entityType, world);
    }
    
    // 初始化目标选择器（攻击谁）
    @Override
    protected void initGoals() {
        super.initGoals();
        
        // 攻击玩家
        this.goalSelector.addGoal(1, new MeleeAttackGoal(this, 1.2, false));
        
        // 巡�?        this.goalSelector.addGoal(3, new WanderAroundGoal(this, 0.8));
        
        // 看玩�?        this.goalSelector.addGoal(4, new LookAtPlayerGoal(this, PlayerEntity.class, 8.0f));
        
        // 随机环顾
        this.goalSelector.addGoal(5, new RandomLookAroundGoal(this));
        
        // 目标：玩�?        this.targetSelector.addGoal(1, new ActiveTargetGoal<>(this, PlayerEntity.class, true));
    }
    
    // 实体死亡时掉�?    @Override
    protected void dropLoot(DamageSource source, boolean causedByPlayer) {
        super.dropLoot(source, causedByPlayer);
        
        // 额外掉落：火焰精�?        if (causedByPlayer) {
            this.dropStack(new ItemStack(Items.BLAZE_POWDER, this.random.nextInt(2) + 1));
        }
    }
}
```

---

### 步骤 4：设置实体属�?
#### 常见属性一�?
```java
// 在实体类中覆�?initializeData 方法
@Override
public void initializeData() {
    // 设置最大生命�?    this.getAttributeInstance(EntityAttributes.GENERIC_MAX_HEALTH).setBaseValue(20.0);
    
    // 设置移动速度
    this.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED).setBaseValue(0.3);
    
    // 设置攻击伤害
    this.getAttributeInstance(EntityAttributes.GENERIC_ATTACK_DAMAGE).setBaseValue(5.0);
    
    // 设置护甲
    this.getAttributeInstance(EntityAttributes.GENERIC_ARMOR).setBaseValue(2.0);
    
    // 设置击退抗�?    this.getAttributeInstance(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE).setBaseValue(0.5);
}
```

#### 属性对应表

| 属�?| 说明 | 僵尸参�?| 玩家参�?|
|------|------|---------|---------|
| GENERIC_MAX_HEALTH | 最大生�?| 20 | 20 |
| GENERIC_MOVEMENT_SPEED | 移动速度 | 0.23 | 0.1 |
| GENERIC_ATTACK_DAMAGE | 攻击伤害 | 3.0 | 1.0 |
| GENERIC_ARMOR | 护甲�?| 2.0 | 0.0 |
| ZOMBIE_SPAWN_REINFORCEMENT | 召唤援军 | 0.1 | - |

---

### 步骤 5：添�?AI 行为

#### 核心概念

```
┌─────────────────────────────────────────�?�?          MobEntity �?AI 系统           �?�?                                      �?�? GoalSelector（行为目标）                �?�?   └── 决定"做什�?                    �?�?       ├── 巡�?(WanderAroundGoal)      �?�?       ├── 攻击 (MeleeAttackGoal)       �?�?       └── 看向玩家 (LookAtPlayerGoal) �?�?                                      �?�? TargetSelector（目标选择�?             �?�?   └── 决定"打谁"                      �?�?       └── ActiveTargetGoal            �?�?                                      �?└─────────────────────────────────────────�?```

#### 常用 Goal �?
```java
// 1. 巡逻目�?this.goalSelector.addGoal(3, new WanderAroundGoal(this, speed));

// 2. 近战攻击目标
this.goalSelector.addGoal(1, new MeleeAttackGoal(this, speed, followWhenNotAgressive));

// 3. 看向玩家
this.goalSelector.addGoal(4, new LookAtPlayerGoal(this, PlayerEntity.class, maxDistance));

// 4. 随机环顾
this.goalSelector.addGoal(5, new RandomLookAroundGoal(this));

// 5. 游泳
this.goalSelector.addGoal(1, new SwimAroundGoal(this, speed, chance));

// 6. 逃跑（低血量时�?this.goalSelector.addGoal(1, new EscapeDangerGoal(this, speed));
```

#### 常用 Target �?
```java
// 1. 攻击最近的可视玩家
this.targetSelector.addGoal(1, new ActiveTargetGoal<>(
    this, 
    PlayerEntity.class, 
    true  // checkVisibility
));

// 2. 攻击最近的同类
this.targetSelector.addGoal(1, new NearestAttackableTargetGoal<>(
    this,
    FlameSpiritEntity.class,
    true
));
```

#### 完整示例：火焰精�?AI

```java
@Override
protected void initGoals() {
    super.initGoals();
    
    // 优先�?0：逃跑（当生命值低时）
    this.goalSelector.addGoal(0, new EscapeDangerGoal(this, 1.5));
    
    // 优先�?1：近战攻�?    this.goalSelector.addGoal(1, new MeleeAttackGoal(this, 1.2, false));
    
    // 优先�?2：火焰冲刺（自定义目标）
    this.goalSelector.addGoal(2, new FlameChargeGoal(this, 2.0));
    
    // 优先�?3：巡�?    this.goalSelector.addGoal(4, new WanderAroundGoal(this, 0.8));
    
    // 优先�?5：看向玩�?    this.goalSelector.addGoal(5, new LookAtPlayerGoal(this, PlayerEntity.class, 8.0f));
    
    // 优先�?6：随机环�?    this.goalSelector.addGoal(6, new RandomLookAroundGoal(this));
    
    // 目标：攻击玩�?    this.targetSelector.addGoal(0, new ActiveTargetGoal<>(
        this, PlayerEntity.class, 0, true, false, Predicate.not(Entity::isInvisible)));
    
    // 目标：攻击最近的火焰精灵
    this.targetSelector.addGoal(1, new NearestAttackableTargetGoal<>(
        this, FlameSpiritEntity.class, true
    ));
}
```

#### 自定�?Goal 示例

```java
// 火焰冲刺目标
public class FlameChargeGoal extends Goal {
    
    private final FlameSpiritEntity entity;
    private final double speed;
    private int cooldown = 0;
    
    public FlameChargeGoal(FlameSpiritEntity entity, double speed) {
        this.entity = entity;
        this.speed = speed;
        this.setControls(EnumSet.of(Goal.Control.MOVE, Goal.Control.LOOK));
    }
    
    @Override
    public boolean canStart() {
        // 查找附近的玩�?        LivingEntity target = entity.getTarget();
        return target != null 
            && entity.squaredDistanceTo(target) < 100 // 10格以�?            && cooldown <= 0;
    }
    
    @Override
    public void start() {
        LivingEntity target = entity.getTarget();
        if (target != null) {
            // 快速冲向目�?            entity.getNavigation().startMovingTo(target, speed);
            cooldown = 200; // 10秒冷�?        }
    }
    
    @Override
    public void tick() {
        if (cooldown > 0) cooldown--;
    }
}
```

---

### 步骤 6：添加掉落物（战利品表）

#### 战利品表文件结构

```
data/
└── mymod/
    └── loot_tables/
        └── entities/
            └── flame_spirit.json
```

#### 战利品表 JSON

```json
{
    "pools": [
        {
            "rolls": 1,
            "entries": [
                {
                    "type": "item",
                    "name": "minecraft:blaze_rod",
                    "weight": 1,
                    "functions": [
                        {
                            "function": "minecraft:set_count",
                            "count": {
                                "type": "minecraft:uniform",
                                "min": 1,
                                "max": 2
                            }
                        }
                    ]
                }
            ]
        },
        {
            "rolls": 1,
            "entries": [
                {
                    "type": "item",
                    "name": "mymod:flame_essence",
                    "weight": 5,
                    "conditions": [
                        {
                            "condition": "minecraft:random_chance",
                            "chance": 0.1
                        }
                    ]
                }
            ]
        }
    ]
}
```

#### 相关条件说明

| 条件 | 说明 | 用法 |
|------|------|------|
| killed_by_player | 被玩家击杀 | 只有玩家击杀才掉�?|
| random_chance | 随机概率 | chance: 0.1 表示10%概率 |
| entity_properties | 实体属�?| 检查实体是否着火等 |
| enchantment_check | 附魔检�?| 检查抢夺附魔等�?|

---

### 步骤 7：添加材�?
#### 材质文件结构

```
resources/
└── assets/
    └── mymod/
        └── textures/
            └── entity/
                └── flame_spirit/
                    ├── flame_spirit.png         # 实体主材�?                    └── flame_spirit_layer_1.png # 叠加层（如有�?```

#### 实体渲染模型（需要资源包�?
```
resources/
└── assets/
    └── mymod/
        └── models/
            └── entity/
                └── flame_spirit.json
```

---

## 完整代码

### Mod 主类

```java
package com.mymod;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.fabricmc.api.ModInitializer;
import com.mymod.entity.FlameSpiritEntity;

public class MyMod implements ModInitializer {
    
    // 注册火焰精灵实体类型
    public static final EntityType<FlameSpiritEntity> FLAME_SPIRIT = 
        Registry.register(
            Registries.ENTITY_TYPE,
            Identifier.of("mymod", "flame_spirit"),
            EntityType.Builder.create(FlameSpiritEntity::new, SpawnGroup.MONSTER)
                .dimensions(0.6f, 1.8f)
                .eyeHeight(1.62f)
                .maxTrackingRange(8)
                .build()
        );
    
    @Override
    public void onInitialize() {
        System.out.println("火焰精灵 Mod 已加载！");
    }
}
```

### 自定义实体类

```java
package com.mymod.entity;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.ai.goal.ActiveTargetGoal;
import net.minecraft.entity.ai.goal.EscapeDangerGoal;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.entity.ai.goal.WanderAroundGoal;
import net.minecraft.entity.ai.goal.LookAtPlayerGoal;
import net.minecraft.entity.ai.goal.RandomLookAroundGoal;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.world.World;

public class FlameSpiritEntity extends MobEntity {
    
    public FlameSpiritEntity(EntityType<? extends FlameSpiritEntity> entityType, World world) {
        super(entityType, world);
    }
    
    @Override
    public void initializeData() {
        super.initializeData();
        // 设置火焰精灵的属�?        this.getAttributeInstance(EntityAttributes.GENERIC_MAX_HEALTH).setBaseValue(30.0);
        this.getAttributeInstance(EntityAttributes.GENERIC_ATTACK_DAMAGE).setBaseValue(6.0);
    }
    
    @Override
    protected void initGoals() {
        super.initGoals();
        
        // 逃跑目标（低血量时�?        this.goalSelector.addGoal(0, new EscapeDangerGoal(this, 1.5));
        
        // 攻击目标
        this.goalSelector.addGoal(1, new MeleeAttackGoal(this, 1.2, false));
        
        // 巡�?        this.goalSelector.addGoal(3, new WanderAroundGoal(this, 0.8));
        
        // 看向玩家
        this.goalSelector.addGoal(4, new LookAtPlayerGoal(this, PlayerEntity.class, 8.0f));
        
        // 随机环顾
        this.goalSelector.addGoal(5, new RandomLookAroundGoal(this));
        
        // 目标选择：玩�?        this.targetSelector.addGoal(0, new ActiveTargetGoal<>(
            this, PlayerEntity.class, true
        ));
    }
    
    @Override
    protected void dropLoot(DamageSource source, boolean causedByPlayer) {
        super.dropLoot(source, causedByPlayer);
        
        // 额外掉落
        if (causedByPlayer) {
            // 必定掉落烈焰�?            this.dropStack(new ItemStack(Items.BLAZE_ROD, this.random.nextInt(2) + 1));
        }
    }
}
```

---

## 测试步骤

1. **启动游戏**
   ```
   运行你的 Mod 开发环�?   ```

2. **生成实体**
   ```
   /summon mymod:flame_spirit
   ```

3. **测试功能**
   - 观察火焰精灵是否生成
   - 尝试攻击它，观察是否反击
   - 击杀后检查掉落物�?
---

## 常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| 实体不生�?| 材质�?AI 配置错误 | 检查日�?|
| AI 不工�?| 未正确初始化目标 | �?initGoals 中添加目�?|
| 掉落物品不对 | 战利品表路径错误 | 检�?JSON 位置 |
| 实体穿墙 | 未设置碰撞检�?| 检�?dimensions |

---

## 遇到问题怎么办？

### 调试技�?
1. **查看日志**
   ```
   游戏崩溃时查看终端输�?   ```

2. **逐步测试**
   ```
   先创建一个最简单的实体
   �?添加一�?AI 目标
   �?再添加一�?   ```

3. **使用命令测试**
   ```
   /summon mymod:flame_spirit ~ ~ ~ {Attributes:[{Name:generic.maxHealth,Base:50}]}
   ```

### 常见错误

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `Entity Type not found` | 实体类型未注�?| 确保�?onInitialize 中注�?|
| `NullPointerException` | AI 目标引用空对�?| 检查目标是否存�?|
| `ConcurrentModificationException` | AI 列表并发修改 | 在服务端单线程中操作 |

---

## 扩展挑战

完成了基础项目？试试这些挑战：

### 挑战 1：创建飞行生�?
```java
public class FlameBatEntity extends MobEntity implements FlyingEntity {
    
    @Override
    protected void initGoals() {
        super.initGoals();
        
        // 飞行相关�?AI
        this.goalSelector.addGoal(0, new FlyGoal(this, 1.0));
        this.goalSelector.addGoal(1, new MeleeAttackGoal(this, 1.2, true));
    }
}
```

### 挑战 2：创建骑乘生�?
```java
public class FlameHorseEntity extends HorseEntity {
    
    @Override
    protected void initGoals() {
        super.initGoals();
        // 添加骑乘相关 AI
    }
    
    @Override
    public boolean canBeSaddled() {
        return true;
    }
}
```

### 挑战 3：创建自定义掉落物品

```java
@Override
protected void dropLoot(DamageSource source, boolean causedByPlayer) {
    super.dropLoot(source, causedByPlayer);
    
    // 检查击杀者是否有特定附魔
    if (causedByPlayer && source.getAttacker() instanceof PlayerEntity player) {
        ItemStack weapon = player.getMainStack();
        int lootingLevel = EnchantmentHelper.getLevel(Enchantments.LOOTING, weapon);
        
        // 根据抢夺等级增加掉落
        this.dropStack(new ItemStack(ModItems.FLAME_ESSENCE, 1 + lootingLevel));
    }
}
```

---

## 参考资�?
### 相关章节

- [注册表基础](/mc/1.21/tutorials/Part-1-Foundation/04-registry-system/)
- [实体生命周期](/mc/1.21/tutorials/Part-4-Entity/21-entity-lifecycle/)
- [MobEntity](/mc/1.21/tutorials/Part-4-Entity/23-mob-entity/)
- [AI系统](/mc/1.21/tutorials/Part-5-AI/27-ai-brain-intro/)
- [战利品表](/mc/1.21/tutorials/Part-8-Resource/42-loot-table/)

### 源码参�?
```
source/net/minecraft/entity/EntityType.java     - 实体类型定义
source/net/minecraft/entity/mob/MobEntity.java  - MobEntity 主类
source/net/minecraft/entity/mob/ZombieEntity.java - 僵尸实体参�?source/net/minecraft/entity/ai/goal/*.java     - AI 目标�?```

---

## 下一�?
学会了创建生物？接下来我们学习创建数据包�?
> [项目4：创建数据包](./101-project4-datapack.md)

---

*本教程基�?Minecraft 1.21 源码编写*
