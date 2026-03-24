# 第二章：数据附件教程

> 这一章学习如何使用 Fabric 的数据附件 API 为游戏对象附加自定义数据。

---

## 目录

1. [数据附件概述](#1-数据附件概述)
2. [定义附件类型](#2-定义附件类型)
3. [使用附件](#3-使用附件)
4. [附件类型详解](#4-附件类型详解)
5. [完整示例：玩家数据追踪](#5-完整示例玩家数据追踪)
6. [完整示例：实体状态管理](#6-完整示例实体状态管理)

---

## 1. 数据附件概述

### 1.1 什么是数据附件？

数据附件 API（Data Attachment API）允许我们向游戏对象（如玩家、实体、方块实体、世界、区块）附加任意类型的数据。这些数据会自动在世界中持久化，并可以在需要时读取或修改。

### 1.2 支持的对象类型

| 对象类型 | 说明 |
|---------|------|
| `PlayerEntity` | 玩家 |
| `Entity` | 通用实体 |
| `BlockEntity` | 方块实体 |
| `World` | 世界 |
| `ServerChunkCache` | 区块（可选） |

### 1.3 依赖添加

```groovy
dependencies {
    // 数据附件 API（在 fabric-api 中已包含）
    modImplementation 'net.fabricmc:fabric-api:${fabric_version}'
}
```

---

## 2. 定义附件类型

### 2.1 创建持久化附件

持久化附件使用 `CompoundTag` 作为存储格式，会自动保存到世界数据中。

```java
import net.fabricmc.fabric.api.attachment.v1.AttachmentRegistry;
import net.fabricmc.fabric.api.attachment.v1.AttachmentType;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.util.Identifier;

// 定义玩家数据附件
public static final AttachmentType<CompoundTag> PLAYER_DATA = 
    AttachmentRegistry.createPersistent(
        Identifier.of("mymod", "player_data"),  // 附件标识符
        CompoundTag.CODEC                      // NBT 编解码器
    );
```

### 2.2 创建带默认值的附件

对于简单数据类型，可以使用默认值初始化。

```java
import net.minecraft.util.math.BlockPos;

// 玩家死亡次数
public static final AttachmentType<Integer> DEATH_COUNT =
    AttachmentRegistry.createDefaulted(
        Identifier.of("mymod", "death_count"),
        () -> 0  // 默认值
    );

// 玩家最后死亡位置
public static final AttachmentType<BlockPos> LAST_DEATH_POSITION =
    AttachmentRegistry.createDefaulted(
        Identifier.of("mymod", "last_death_pos"),
        () -> BlockPos.ORIGIN  // 默认值
    );

// 实体是否被驯化
public static final AttachmentType<Boolean> TAMED =
    AttachmentRegistry.createDefaulted(
        Identifier.of("mymod", "tamed"),
        () -> false
    );
```

### 2.3 使用自定义类型

可以 attachments 任何实现了 `Codec` 的数据类型。

```java
import net.minecraft.util.dynamic.DynamicRegistryManager;
import net.minecraft.nbt.CompoundTag;

// 自定义数据类
public class PlayerStats {
    private int kills;
    private int deaths;
    private long playTime;  // 毫秒
    
    // 需要实现 NBT 序列化
    public CompoundTag toNbt() {
        CompoundTag tag = new CompoundTag();
        tag.putInt("kills", kills);
        tag.putInt("deaths", deaths);
        tag.putLong("playTime", playTime);
        return tag;
    }
    
    public static PlayerStats fromNbt(CompoundTag tag) {
        PlayerStats stats = new PlayerStats();
        stats.kills = tag.getInt("kills");
        stats.deaths = tag.getInt("deaths");
        stats.playTime = tag.getLong("playTime");
        return stats;
    }
}

// 创建附件类型（需要注册 Codec）
public static final AttachmentType<PlayerStats> PLAYER_STATS = 
    AttachmentRegistry.createDefaulted(
        Identifier.of("mymod", "player_stats"),
        () -> new PlayerStats()
    );
// 注意：实际使用需要为 PlayerStats 注册 Codec
```

---

## 3. 使用附件

### 3.1 基本操作

```java
import net.fabricmc.fabric.api.attachment.v1.AttachmentTarget;

// 获取附件值（不存在则创建）
int deaths = player.getAttachedOrCreate(Attachments.DEATH_COUNT);

// 获取附件值（不存在返回 null）
Integer kills = player.getAttached(Attachments.KILLS);

// 设置附件值
player.setAttached(Attachments.DEATH_COUNT, deaths + 1);

// 原子修改
player.modifyAttached(Attachments.DEATH_COUNT, old -> old + 1);
```

### 3.2 完整示例

```java
import net.fabricmc.fabric.api.attachment.v1.AttachmentTarget;
import net.minecraft.entity.player.PlayerEntity;

// 玩家死亡时记录
public void onPlayerDeath(PlayerEntity player) {
    // 获取当前死亡次数并增加
    player.modifyAttached(Attachments.DEATH_COUNT, count -> count + 1);
    
    // 记录死亡位置
    BlockPos deathPos = player.getBlockPos();
    player.setAttached(Attachments.LAST_DEATH_POSITION, deathPos);
    
    // 获取玩家数据并修改
    CompoundTag data = player.getAttachedOrCreate(Attachments.PLAYER_DATA);
    data.putInt("deaths", data.getInt("deaths") + 1);
}

// 玩家击杀时记录
public void onPlayerKill(PlayerEntity player, Entity killedEntity) {
    player.modifyAttached(Attachments.KILLS, kills -> kills + 1);
}
```

### 3.3 在实体上使用

```java
// 定义实体附件
public static final AttachmentType<Integer> ENTITY_LEVEL =
    AttachmentRegistry.createDefaulted(
        Identifier.of("mymod", "level"),
        () -> 1
    );

public static final AttachmentType<Long> LAST_INTERACTION =
    AttachmentRegistry.createDefaulted(
        Identifier.of("mymod", "last_interaction"),
        () -> 0L
    );

// 在实体类中使用
public class MyEntity extends MobEntity {
    public void gainExperience(int amount) {
        // 获取当前等级
        int currentLevel = this.getAttachedOrCreate(Attachments.ENTITY_LEVEL);
        
        // 增加经验值
        int currentExp = this.getAttachedOrCreate(Attachments.ENTITY_EXP);
        this.setAttached(Attachments.ENTITY_EXP, currentExp + amount);
        
        // 检查升级
        if (currentExp >= expToNextLevel(currentLevel)) {
            this.setAttached(Attachments.ENTITY_LEVEL, currentLevel + 1);
            this.setAttached(Attachments.ENTITY_EXP, 0);
            this.getWorld().sendEntityStatus(this, (byte) 30);  // ���级粒子效果
        }
    }
    
    private int expToNextLevel(int level) {
        return level * 100;
    }
}
```

---

## 4. 附件类型详解

### 4.1 AttachmentRegistry 方法

| 方法 | 说明 |
|-----|------|
| `createPersistent(id, codec)` | 创建持久化附件 |
| `createDefaulted(id, defaultSupplier)` | 创建带默认值的附件 |
| `createLazy(id, initializer)` | 创建延迟初始化的附件 |

### 4.2 AttachmentTarget 接口

所有可以被附加数据的对象都实现了 `AttachmentTarget` 接口：

```java
public interface AttachmentTarget {
    // 检查是否有附件
    boolean hasAttached(AttachmentType<?> type);
    
    // 获取附件（不存在返回 null）
    <T> T getAttached(AttachmentType<T> type);
    
    // 获取附件（不存在则创建）
    <T> T getAttachedOrCreate(AttachmentType<T> type);
    
    // 设置附件
    <T> void setAttached(AttachmentType<T> type, T value);
    
    // 原子修改
    <T> void modifyAttached(AttachmentType<T> type, UnaryOperator<T> mapper);
    
    // 获取可以附加的对象类型
    AttachmentType getAttachmentType(AttachmentType<?> type);
}
```

### 4.3 附件序列化

附件会在以下时机自动持久化：

1. **玩家**：在退出游戏时保存到玩家数据文件
2. **实体**：在实体进入不活跃状态或世界保存时
3. **方块实体**：在方块实体标记为脏时（`markDirty()`）

```java
// 方块实体的附件会在以下情况下保存：
public void onChanged() {
    // 调用 markDirty() 会触发保存
    markDirty();
}
```

---

## 5. 完整示例：玩家数据追踪

### 5.1 定义附件

```java
package net.example.mymod.attachment;

import net.fabricmc.fabric.api.attachment.v1.AttachmentRegistry;
import net.fabricmc.fabric.api.attachment.v1.AttachmentType;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.util.Identifier;
import net.example.mymod.Mymod;

public class ModAttachments {
    
    // 玩家击杀数
    public static final AttachmentType<Integer> KILLS = 
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "kills"),
            () -> 0
        );
    
    // 玩家死亡次数
    public static final AttachmentType<Integer> DEATHS = 
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "deaths"),
            () -> 0
        );
    
    // 玩家游戏时间（刻）
    public static final AttachmentType<Long> PLAY_TIME = 
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "play_time"),
            () -> 0L
        );
    
    // 玩家自定义数据（复杂数据）
    public static final AttachmentType<CompoundTag> CUSTOM_DATA = 
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "custom_data"),
            () -> new CompoundTag()
        );
    
    // 最后重生点
    public static final AttachmentType<net.minecraft.util.math.BlockPos> RESPAWN_POS = 
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "respawn_pos"),
            () -> null
        );
    
    public static void register() {
        // 空调用，确保类被加载
    }
}
```

### 5.2 事件监听器

```java
package net.example.mymod.event;

import net.example.mymod.attachment.ModAttachments;
import net.fabricmc.fabric.api.attachment.v1.AttachmentTarget;
import net.minecraft.entity.Entity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;

public class PlayerEventHandler {
    
    // 玩家死亡事件
    public static void onPlayerDeath(PlayerEntity player) {
        // 增加死亡次数
        player.modifyAttached(ModAttachments.DEATHS, count -> count + 1);
        
        // 记录死亡位置
        BlockPos deathPos = player.getBlockPos();
        player.setAttached(ModAttachments.RESPAWN_POS, deathPos);
        
        // 记录到自定义数据
        CompoundTag data = player.getAttachedOrCreate(ModAttachments.CUSTOM_DATA);
        data.putLong("lastDeathTime", player.getWorld().getTime());
    }
    
    // 玩家击杀实体事件
    public static void onEntityKilled(PlayerEntity player, Entity killedEntity) {
        // 增加击杀数
        player.modifyAttached(ModAttachments.KILLS, count -> count + 1);
        
        // 添加击杀奖励到自定义数据
        CompoundTag data = player.getAttachedOrCreate(ModAttachments.CUSTOM_DATA);
        int totalKills = data.getInt("totalKills");
        data.putInt("totalKills", totalKills + 1);
    }
    
    // 玩家重生时设置自定义重生点
    public static void onPlayerRespawn(PlayerEntity player) {
        BlockPos respawnPos = player.getAttachedOrCreate(ModAttachments.RESPAWN_POS);
        
        if (respawnPos != null) {
            // 检查位置是否有效
            if (player.getWorld().getBlockState(respawnPos).isAir()) {
                // 设置玩家位置到记录的重生点
                player.setPosition(
                    respawnPos.getX() + 0.5,
                    respawnPos.getY(),
                    respawnPos.getZ() + 0.5
                );
            }
        }
    }
    
    // 游戏刻更新（追踪游戏时间）
    public static void onServerTick(net.minecraft.server.MinecraftServer server) {
        // ��历所有玩家
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            // 增加游戏时间
            player.modifyAttached(ModAttachments.PLAY_TIME, time -> time + 1);
        }
    }
}
```

### 5.3 展示玩家数据

```java
package net.example.mymod.command;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.context.CommandContext;
import net.minecraft.command.CommandSource;
import net.minecraft.command.argument.EntityArgumentType;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

public class StatsCommand {
    
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(
            net.minecraft.server.command.CommandManager.literal("stats")
                .requires(source -> source.hasPermissionLevel(2))
                .then(net.minecraft.server.command.CommandManager.argument("player", EntityArgumentType.player())
                    .executes(StatsCommand::showStats)
                )
        );
    }
    
    private static int showStats(CommandContext<ServerCommandSource> context) {
        ServerPlayerEntity player = EntityArgumentType.getPlayer(context, "player");
        
        int kills = player.getAttachedOrCreate(net.example.mymod.attachment.ModAttachments.KILLS);
        int deaths = player.getAttachedOrCreate(net.example.mymod.attachment.ModAttachments.DEATHS);
        long playTime = player.getAttachedOrCreate(net.example.mymod.attachment.ModAttachments.PLAY_TIME);
        
        // 计算游戏时间
        long hours = playTime / 72000;  // 72000 刻 = 1 小时
        long minutes = (playTime % 72000) / 1200;  // 1200 刻 = 1 分钟
        
        double kdRatio = deaths > 0 ? (double) kills / deaths : kills;
        
        // 发送消息
        context.getSource().sendFeedback(() -> Text.literal(
            "=== " + player.getName().getString() + " 的统计 ===\n" +
            "击杀: " + kills + "\n" +
            "死亡: " + deaths + "\n" +
            "K/D: " + String.format("%.2f", kdRatio) + "\n" +
            "游戏时间: " + hours + " 小时 " + minutes + " 分钟"
        ), false);
        
        return 1;
    }
}
```

---

## 6. 完整示例：实体状态管理

### 6.1 实体附件定义

```java
package net.example.mymod.attachment;

import net.fabricmc.fabric.api.attachment.v1.AttachmentRegistry;
import net.fabricmc.fabric.api.attachment.v1.AttachmentType;
import net.minecraft.util.Identifier;
import net.example.mymod.Mymod;

public class EntityAttachments {
    
    // 实体等级
    public static final AttachmentType<Integer> LEVEL =
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "level"),
            () -> 1
        );
    
    // 实体经验值
    public static final AttachmentType<Integer> EXPERIENCE =
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "experience"),
            () -> 0
        );
    
    // 忠诚度（驯化程度）
    public static final AttachmentType<Integer> LOYALTY =
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "loyalty"),
            () -> 0
        );
    
    // 最后交互时间
    public static final AttachmentType<Long> LAST_INTERACT =
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "last_interact"),
            () -> 0L
        );
    
    // 是否被驯化
    public static final AttachmentType<Boolean> TAMED =
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "tamed"),
            () -> false
        );
    
    // 所有者 UUID
    public static final AttachmentType<String> OWNER_UUID =
        AttachmentRegistry.createDefaulted(
            Identifier.of(Mymod.MOD_ID, "owner_uuid"),
            () -> ""
        );
    
    public static void register() {}
}
```

### 6.2 实体交互处理

```java
package net.example.mymod.entity;

import net.example.mymod.attachment.EntityAttachments;
import net.fabricmc.fabric.api.attachment.v1.AttachmentTarget;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.passive.PassiveEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.Hand;

public class CustomPetEntity extends PassiveEntity {
    
    // 驯化该实体
    public boolean tame(PlayerEntity player) {
        if (this.getWorld().isClient()) {
            return false;
        }
        
        // 设置已驯化
        this.setAttached(EntityAttachments.TAMED, true);
        
        // 设置所有者
        this.setAttached(EntityAttachments.OWNER_UUID, player.getUuidAsString());
        
        // 设置初始忠诚度
        this.setAttached(EntityAttachments.LOYALTY, 50);
        
        // 设置名字
        this.setCustomName(Text.literal(player.getName().getString() + "'s Pet"));
        this.setCustomNameVisible(true);
        
        // 播放音效
        this.playSound(SoundEvents.ENTITY_CAT_AMBIENT, 1.0f, 1.0f);
        
        return true;
    }
    
    // 与实体交互
    @Override
    public boolean interactMob(PlayerEntity player, Hand hand) {
        if (this.getWorld().isClient()) {
            return super.interactMob(player, hand);
        }
        
        // 检查是否已驯化
        Boolean isTamed = this.getAttached(EntityAttachments.TAMED);
        
        if (Boolean.TRUE.equals(isTamed)) {
            // 检查是否是主人
            String ownerUuid = this.getAttachedOrCreate(EntityAttachments.OWNER_UUID);
            if (ownerUuid.equals(player.getUuidAsString())) {
                // 抚摸增加忠诚度
                this.modifyAttached(EntityAttachments.LOYALTY, loyalty -> 
                    Math.min(100, loyalty + 5)
                );
                
                // 更新最后交互时间
                this.setAttached(
                    EntityAttachments.LAST_INTERACT, 
                    this.getWorld().getTime()
                );
                
                // 播放开心音效
                this.playSound(SoundEvents.ENTITY_CAT_PURR, 0.5f, 1.0f);
                
                player.sendMessage(Text.literal("忠诚度: " + 
                    this.getAttachedOrCreate(EntityAttachments.LOYALTY)), true);
                
                return true;
            }
        } else {
            // 尝试驯化
            // 消耗食物
            var itemStack = player.getStackInHand(hand);
            if (itemStack.isOf(Items.COD)) {
                itemStack.decrement(1);
                return this.tame(player);
            }
        }
        
        return super.interactMob(player, hand);
    }
    
    // 实体 AI 行为 - 检查忠诚度
    public void checkBehavior() {
        if (this.getWorld().isClient()) return;
        
        Boolean isTamed = this.getAttached(EntityAttachments.TAMED);
        if (!Boolean.TRUE.equals(isTamed)) return;
        
        Integer loyalty = this.getAttachedOrCreate(EntityAttachments.LOYALTY);
        
        // 忠诚度太低可能会逃跑
        if (loyalty < 10) {
            // 有概率逃跑
            if (this.getRandom().nextFloat() < 0.01) {
                this.setAttached(EntityAttachments.TAMED, false);
                this.setAttached(EntityAttachments.OWNER_UUID, "");
                this.setAttached(EntityAttachments.LOYALTY, 0);
                
                // 逃跑！
                this.getNavigation().startMovingTo(
                    this.getX() + this.getRandom().nextFloat() * 20 - 10,
                    this.getY(),
                    this.getZ() + this.getRandom().nextFloat() * 20 - 10,
                    1.5
                );
            }
        }
    }
}
```

### 6.3 实体属性修改

实体等级会影响属性。

```java
package net.example.mymod.entity;

import net.example.mymod.attachment.EntityAttachments;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.passive.PassiveEntity;
import net.minecraft.world.World;

public class CustomPetEntity extends PassiveEntity {
    
    // 根据等级更新属性
    public void updateAttributes() {
        int level = this.getAttachedOrCreate(EntityAttachments.LEVEL);
        
        // 基础属性
        double baseHealth = 20.0;
        double baseSpeed = 0.3;
        
        // 等级加成
        double healthBonus = level * 5.0;
        double speedBonus = level * 0.02;
        
        // 应用属性
        this.getAttributeInstance(EntityAttributes.GENERIC_MAX_HEALTH)
            .setBaseValue(baseHealth + healthBonus);
        this.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED)
            .setBaseValue(baseSpeed + speedBonus);
        
        // 如果当前生命值超过最大生命值，调整为最大
        if (this.getHealth() > this.getMaxHealth()) {
            this.setHealth((float) this.getMaxHealth());
        }
    }
    
    // 获得经验
    public void gainExperience(int amount) {
        int currentExp = this.getAttachedOrCreate(EntityAttachments.EXPERIENCE);
        int currentLevel = this.getAttachedOrCreate(EntityAttachments.LEVEL);
        
        int newExp = currentExp + amount;
        int expToLevel = getExpRequired(currentLevel);
        
        while (newExp >= expToLevel) {
            newExp -= expToLevel;
            this.levelUp();
        }
        
        this.setAttached(EntityAttachments.EXPERIENCE, newExp);
    }
    
    private void levelUp() {
        this.modifyAttached(EntityAttachments.LEVEL, level -> level + 1);
        
        // 播放升级效果
        this.getWorld().sendEntityStatus(this, (byte) 30);  // 粒子效果
        
        // 增加属性
        this.updateAttributes();
    }
    
    private int getExpRequired(int level) {
        return level * 100 + 50;
    }
}
```

---

## 下一步

现在你学会了数据附件 API！接下来可以学习：

- [配方系统](./03-recipes.md) - 创建自定义合成配方
- [战利品表](./04-loot-tables.md) - 修改战利品掉落

---

*参考：[其他子系统分析 - 数据附件部分](../../analysis/11-other-subsystems.md)*