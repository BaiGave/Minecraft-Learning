# 第三章：魔法棒 - 特殊物品与网络通信

> 在这一章中，我们将创建一个可以发射魔法弹的魔法棒，学习特殊物品的实现、投掷物实体创建和客户端-服务端网络通信。

---

## 目录

1. [概述](#1-概述)
2. [创建魔法棒物品](#2-创建魔法棒物品)
3. [创建魔法弹实体](#3-创建魔法弹实体)
4. [实现网络通信](#4-实现网络通信)
5. [实现蓄力与发射](#5-实现蓄力与发射)
6. [添加粒子效果](#6-添加粒子效果)
7. [完整代码整合](#7-完整代码整合)
8. [测试运行](#8-测试运行)

---

## 1. 概述

### 1.1 本章目标

魔法棒是一个特殊的物品，具有以下功能：
- **蓄力机制**：按住右键蓄力，松开发射
- **发射魔法弹**：发射紫罗兰色的魔法弹
- **实体交互**：魔法弹击中实体造成伤害
- **方块交互**：魔法弹击中方块产生爆炸效果
- **耐久度系统**：使用次数有限

### 1.2 技术架构

```
┌─────────────────────────────────────────────────────���
│                    魔法棒系统                         │
├─────────────────────────────────────────────────────┤
│  MagicWandItem (物品)                                │
│  ├── use() - 物品使用入口                            │
│  └── onStoppedUsing() - 释放时触发                   │
├─────────────────────────────────────────────────────┤
│  ModNetworking (网络)                               │
│  ├── C2S 发射数据包                                  │
│  └── 同步蓄力状态                                    │
├─────────────────────────────────────────────────────┤
│  MagicProjectileEntity (投掷物)                     │
│  ├── tick() - 每帧更新                               │
│  ├── onHit() - 击中处理                              │
│  └── 粒子效果                                        │
└─────────────────────────────────────────────────────┘
```

---

## 2. 创建魔法棒物品

### 2.1 创建魔法棒物品类

创建 `src/main/java/net/example/mymod/item/MagicWandItem.java`：

```java
package net.example.mymod.item;

import net.minecraft.enchantment.Enchantments;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.text.Text;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.util.UseAction;
import net.minecraft.world.World;

import java.util.List;

/**
 * 魔法棒物品
 * 特性：
 * - 蓄力发射机制
 * - 耐久度系统
 * - 自定义工具提示
 */
public class MagicWandItem extends Item {
    
    // 魔法棒最大耐久度
    private static final int MAX_DURABILITY = 256;
    
    // 蓄力时间（ tick）
    private static final int MAX_CHARGE_TIME = 40;
    
    public MagicWandItem() {
        super(new Item.Settings()
            .maxCount(1)                      // 不可堆叠
            .maxDamage(MAX_DURABILITY)        // 耐久度
            .enchantable(10)                  // 可附魔
        );
    }
    
    // 获取物品使用动作类型
    @Override
    public UseAction getUseAction(ItemStack stack) {
        return UseAction.BOW;  // 使用弓的蓄力动画
    }
    
    // 获取最大蓄力时间
    @Override
    public int getMaxUseTime(ItemStack stack) {
        return MAX_CHARGE_TIME;
    }
    
    // 物品开始使用时调用
    @Override
    public void onUseTick(World world, LivingEntity user, int remainingTicks) {
        // 可以在蓄力过程中添加视觉反馈
        if (remainingTicks % 5 == 0 && !world.isClient()) {
            // 每 5 tick 播放一次音效（服务端）
            user.playSound(
                net.minecraft.sound.SoundEvents.ITEM_TRIDENT_RIPPLE, 
                0.3f, 
                1.0f
            );
        }
    }
    
    // 物品使用完成时调用（松开右键）
    @Override
    public void onStoppedUsing(ItemStack stack, World world, 
                                LivingEntity user, int remainingUseTicks) {
        if (!(user instanceof PlayerEntity player)) return;
        
        // 计算蓄力程度 (0.0 - 1.0)
        int usedTicks = this.getMaxUseTime(stack) - remainingTicks;
        float charge = Math.min((float) usedTicks / MAX_CHARGE_TIME, 1.0f);
        
        // 至少需要 20% 蓄力才能发射
        if (charge < 0.2f) {
            // 蓄力不足，返还物品
            return;
        }
        
        // 触发发射逻辑
        if (world.isClient()) {
            // 客户端：发送数据包给服务端
            net.example.mymod.network.ModNetworking.sendShootPacket(charge);
        } else {
            // 服务端：直接发射
            net.example.mymod.entity.projectile.MagicProjectileEntity.shoot(
                world, player, stack, charge
            );
        }
        
        // 消耗耐久度（服务端）
        if (!world.isClient()) {
            stack.damage(1, player, 
                p -> p.sendToolBreakStatus(Hand.MAIN_HAND));
        }
    }
    
    // 可选：添加工具提示
    @Override
    public void appendTooltip(ItemStack stack, TooltipContext context, 
                              List<Text> tooltip, TooltipType type) {
        super.appendTooltip(stack, context, tooltip, type);
        tooltip.add(Text.literal("§d按住右键蓄力"));
        tooltip.add(Text.literal("§7松开右键发射魔法弹"));
    }
}
```

### 2.2 注册魔法棒物品

在 `ModItems.java` 中添加：

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.item.MagicCrystalItem;
import net.example.mymod.item.MagicWandItem;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModItems {
    
    public static final Item MAGIC_CRYSTAL = new MagicCrystalItem();
    public static final Item MAGIC_WAND = new MagicWandItem();
    
    public static void register() {
        registerItem("magic_crystal", MAGIC_CRYSTAL);
        registerItem("magic_wand", MAGIC_WAND);
    }
    
    private static void registerItem(String name, Item item) {
        Registry.register(
            Registries.ITEM,
            Identifier.of(Mymod.MOD_ID, name),
            item
        );
    }
}
```

---

## 3. 创建魔法弹实体

### 3.1 创建投掷物实体类

创建 `src/main/java/net/example/mymod/entity/projectile/MagicProjectileEntity.java`：

```java
package net.example.mymod.entity.projectile;

import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.projectile.ProjectileEntity;
import net.minecraft.entity.projectile.ProjectileUtil;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.hit.EntityHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/**
 * 魔法弹实体
 * 特性：
 * - 发光粒子效果
 * - 击中实体造成伤害
 * - 击中方块产生爆炸
 */
public class MagicProjectileEntity extends ProjectileEntity {
    
    // 伤害值
    private static final float DAMAGE = 8.0f;
    // 爆炸半径
    private static final float EXPLOSION_POWER = 1.5f;
    
    // 发射者（用于伤害归属）
    private LivingEntity owner;
    
    public MagicProjectileEntity(EntityType<? extends MagicProjectileEntity> type, World world) {
        super(type, world);
    }
    
    // 静态方法：创建并发射魔法弹
    public static void shoot(World world, LivingEntity shooter, 
                              ItemStack wandStack, float charge) {
        if (!(world instanceof ServerWorld serverWorld)) return;
        
        // 创建魔法弹实体
        EntityType<MagicProjectileEntity> entityType = 
            net.example.mymod.init.ModEntities.MAGIC_PROJECTILE;
        
        MagicProjectileEntity projectile = entityType.create(serverWorld);
        if (projectile == null) return;
        
        // 设置发射者
        projectile.setOwner(shooter);
        
        // 设置位置到发射者
        projectile.setPosition(
            shooter.getX(),
            shooter.getEyeY() - 0.1,
            shooter.getZ()
        );
        
        // 计算发射方向（使用玩家视线方向）
        Vec3d direction = shooter.getRotationVector();
        
        // 根据蓄力程度调整速度
        float velocity = 1.5f + charge * 2.0f;  // 1.5 - 3.5
        Vec3d velocityVec = direction.multiply(velocity);
        
        // 设置速度
        projectile.setVelocity(velocityVec);
        
        // 添加到世界
        serverWorld.spawnEntity(projectile);
    }
    
    // 设置所有者
    public void setOwner(LivingEntity owner) {
        this.owner = owner;
    }
    
    public LivingEntity getOwner() {
        return owner;
    }
    
    // 每帧更新
    @Override
    public void tick() {
        super.tick();
        
        // 检查是否超出边界
        if (this.getPos().y < -20 || this.getPos().y > 320) {
            this.discard();
            return;
        }
        
        // 生成飞行轨迹粒子
        spawnTrailParticles();
        
        // 碰撞检测
        HitResult hitResult = ProjectileUtil.getCollisionCollisions(
            this, this::canHit
        );
        
        if (hitResult.getType() != HitResult.Type.MISS) {
            onCollision(hitResult);
        }
    }
    
    // 生成轨迹粒子
    private void spawnTrailParticles() {
        if (this.getWorld() instanceof ServerWorld serverWorld) {
            // 紫罗兰色魔法粒子
            serverWorld.spawnParticles(
                ParticleTypes.WITCH,
                this.getX(), this.getY(), this.getZ(),
                1,  // 粒子数量
                0.0, 0.0, 0.0,
                0.1
            );
            
            // 偶尔生成发光粒子
            if (this.getWorld().getRandom().nextInt(3) == 0) {
                serverWorld.spawnParticles(
                    ParticleTypes.ENCHANT,
                    this.getX(), this.getY(), this.getZ(),
                    1, 0.0, 0.0, 0.0, 0.0
                );
            }
        }
    }
    
    // 碰撞处理
    @Override
    protected void onCollision(HitResult hitResult) {
        super.onCollision(hitResult);
        
        World world = this.getWorld();
        
        if (world.isClient()) {
            this.discard();
            return;
        }
        
        switch (hitResult.getType()) {
            case ENTITY -> {
                // 击中实体
                EntityHitResult entityHit = (EntityHitResult) hitResult;
                Entity hitEntity = entityHit.getEntity();
                
                // 造成伤害
                if (hitEntity instanceof LivingEntity livingEntity) {
                    livingEntity.damage(
                        DamageSource.magicProjectile(this, this.getOwner()),
                        DAMAGE
                    );
                    
                    // 播放击中音效
                    world.playSound(null, hitEntity.getPos(), 
                        SoundEvents.ENTITY_PLAYER_ATTACK_STRONG,
                        net.minecraft.sound.SoundCategory.PLAYERS, 
                        1.0f, 1.0f);
                }
            }
            case BLOCK -> {
                // 击中方块 - 产生爆炸效果
                createExplosion();
            }
            default -> {}
        }
        
        // 无论击中什么都消失
        this.discard();
    }
    
    // 创建爆炸效果
    private void createExplosion() {
        World world = this.getWorld();
        if (!(world instanceof ServerWorld serverWorld)) return;
        
        // 生成爆炸粒子
        Vec3d pos = this.getPos();
        
        // 紫色爆炸粒子
        for (int i = 0; i < 10; i++) {
            serverWorld.spawnParticles(
                ParticleTypes.WITCH,
                pos.getX(), pos.getY(), pos.getZ(),
                1, 
                (world.getRandom().nextDouble() - 0.5) * 2,
                (world.getRandom().nextDouble() - 0.5) * 2,
                (world.getRandom().nextDouble() - 0.5) * 2,
                0.1
            );
        }
        
        // 播放爆炸音效
        world.playSound(null, pos, 
            SoundEvents.ENTITY_WITHER_SHOOT,
            net.minecraft.sound.SoundCategory.BLOCKS, 
            0.5f, 0.8f);
    }
    
    // 写入 NBT 数据
    @Override
    protected void writeCustomDataToNbt(NbtCompound nbt) {
        super.writeCustomDataToNbt(nbt);
        if (owner != null) {
            nbt.putUuid("Owner", owner.getUuid());
        }
    }
    
    // 读取 NBT 数据
    @Override
    protected void readCustomDataFromNbt(NbtCompound nbt) {
        super.readCustomDataFromNbt(nbt);
        if (nbt.contains("Owner")) {
            // 需要在服务端解析 UUID
        }
    }
}
```

### 3.2 注册实体类型

创建 `src/main/java/net/example/mymod/init/ModEntities.java`：

```java
package net.example.mymod.init;

import net.example.mymod.Mymod;
import net.example.mymod.entity.projectile.MagicProjectileEntity;
import net.minecraft.entity.EntityType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.world.World;

public class ModEntities {
    
    // 魔法弹实体
    public static final EntityType<MagicProjectileEntity> MAGIC_PROJECTILE = 
        EntityType.Builder.<MagicProjectileEntity>create(
            MagicProjectileEntity::new,
            EntityType.Group.PROJECTILE
        )
        .dimensions(0.25f, 0.25f)  // 碰撞箱大小
        .trackRangeBlocks(32)       // 跟踪距离
        .build()
        .setKey(Identifier.of(Mymod.MOD_ID, "magic_projectile"));
    
    public static void register() {
        Registry.register(
            Registries.ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "magic_projectile"),
            MAGIC_PROJECTILE
        );
    }
}
```

---

## 4. 实现网络通信

### 4.1 为什么需要网络通信？

在 Minecraft 中：
- **客户端**：渲染游戏、处理输入
- **服务端**：游戏逻辑、数据存储

当我们手持魔法棒蓄力时：
1. 客户端检测到玩家按下右键，开始蓄力
2. 当玩家松开右键，客户端需要告诉服务端"发射魔法弹"
3. 服务端创建实体并执行逻辑
4. 服务端同步实体位置给客户端进行渲染

### 4.2 创建网络消息类

创建 `src/main/java/net/example/mymod/network/ModNetworking.java`：

```java
package net.example.mymod.network;

import net.example.mymod.Mymod;
import net.example.mymod.entity.projectile.MagicProjectileEntity;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.network.PacketByteBuf;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.Identifier;

/**
 * 网络通信管理器
 * 处理客户端-服务端之间的数据包传输
 */
public class ModNetworking {
    
    // 消息 ID
    public static final Identifier SHOOT_PACKET_ID = 
        Identifier.of(Mymod.MOD_ID, "shoot_packet");
    
    /**
     * 服务端初始化：注册接收客户端数据包的处理器
     */
    public static void registerServerReceivers() {
        ServerPlayNetworking.registerReceiver(
            SHOOT_PACKET_ID,
            (server, player, handler, buf, responseSender) -> {
                // 读取蓄力程度
                float charge = buf.readFloat();
                
                // 在服务端线程执行游戏逻辑
                server.execute(() -> {
                    // 获取玩家当前手持物品
                    ItemStack handStack = player.getMainHandStack();
                    
                    // 检查是否是魔法棒
                    if (handStack.getItem() instanceof 
                        net.example.mymod.item.MagicWandItem) {
                        
                        // 发射魔法弹
                        MagicProjectileEntity.shoot(
                            player.getWorld(),
                            player,
                            handStack,
                            charge
                        );
                        
                        // 消耗耐久度
                        handStack.damage(1, player,
                            p -> p.sendToolBreakStatus(
                                net.minecraft.util.Hand.MAIN_HAND
                            ));
                    }
                });
            }
        );
    }
    
    /**
     * 客户端发送发射数据包
     */
    public static void sendShootPacket(float charge) {
        // 创建缓冲区并写入数据
        PacketByteBuf buf = new PacketByteBuf(
            java.nio.ByteBuffer.allocate(4).putFloat(charge).flip()
        );
        
        // 发送到服务端
        ClientPlayNetworking.send(SHOOT_PACKET_ID, buf);
    }
    
    /**
     * 初始化入口（从 Mod 入口调用）
     */
    public static void init() {
        registerServerReceivers();
    }
}
```

---

## 5. 实现蓄力与发射

### 5.1 完整的魔法棒类

之前创建的 `MagicWandItem` 已经是完整的。现在我们只需要确保网络通信已初始化。

### 5.2 更新 Mod 入口

更新 `Mymod.java`：

```java
package net.example.mymod;

import net.fabricmc.api.ModInitializer;
import net.example.mymod.init.ModBlocks;
import net.example.mymod.init.ModItems;
import net.example.mymod.init.ModBlockEntities;
import net.example.mymod.init.ModEntities;
import net.example.mymod.network.ModNetworking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Mymod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("开始加载魔法水晶 Mod...");
        
        // 注册顺序很重要
        ModBlockEntities.register();
        ModBlocks.register();
        ModItems.register();
        
        // 注册实体
        ModEntities.register();
        
        // 注册网络通信
        ModNetworking.init();
        
        LOGGER.info("魔法水晶 Mod 加载完成！");
    }
}
```

---

## 6. 添加粒子效果

### 6.1 蓄力时的视觉效果

在 `MagicWandItem.onUseTick()` 方法中，我们已经添加了蓄力音效。你也可以添加蓄力粒子效果：

```java
@Override
public void onUseTick(World world, LivingEntity user, int remainingTicks) {
    if (world.isClient() && remainingTicks % 3 == 0) {
        // 客户端：生成蓄力粒子
        double x = user.getX();
        double y = user.getEyeY();
        double z = user.getZ();
        
        // 获取玩家面朝方向
        Vec3d direction = user.getRotationVector();
        
        ((net.minecraft.client.world.ClientWorld)world).addParticle(
            net.minecraft.particle.ParticleTypes.ENCHANT,
            x + direction.x * 0.5,
            y + direction.y * 0.5,
            z + direction.z * 0.5,
            0, 0, 0
        );
    }
}
```

### 6.2 飞行轨迹粒子

在 `MagicProjectileEntity.tick()` 方法中，我们已经在 `spawnTrailParticles()` 中实现了轨迹粒子效果。

---

## 7. 完整代码整合

### 7.1 项目结构

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
│   └── projectile/
│       └── MagicProjectileEntity.java
└── network/
    └── ModNetworking.java
```

### 7.2 代码要点回顾

| 类 | 职责 | 关键方法 |
|-----|------|----------|
| `MagicWandItem` | 物品逻辑 | `onStoppedUsing()` - 发射触发 |
| `MagicProjectileEntity` | 投掷物逻辑 | `tick()` - 移动和碰撞检测 |
| `ModNetworking` | 网络通信 | `registerServerReceivers()` - 服务端接收 |
| `ModEntities` | 实体注册 | `register()` - 注册实体类型 |

---

## 8. 测试运行

### 8.1 编译并运行

```bash
./gradlew build
./gradlew runClient
```

### 8.2 游戏内测试

1. 获取魔法棒：
   ```
   /give @p mymod:magic_wand
   ```
2. 切换到生存模式
3. 调整到第三人称视角
4. **蓄力**：按住右键
5. **发射**：松开右键
6. 观察：
   - 蓄力动画（使用弓的动画）
   - 魔法弹发射
   - 粒子效果
   - 击中实体/方块的效果
   - 耐久度消耗

### 8.3 预期效果

| 功能 | 预期结果 |
|------|----------|
| 蓄力动画 | 显示弓的蓄力动画 |
| 发射 | 紫罗兰色魔法弹飞出 |
| 轨迹粒子 | 紫色魔法粒子跟随 |
| 击中实体 | 实体受到 8 点伤害 |
| 击中方块 | 紫色爆炸粒子效果 |
| 耐久度 | 每次发射消耗 1 点 |

---

## 常见问题

### Q1: 魔法弹不显示？
检查实体是否正确添加到世界，确保 `serverWorld.spawnEntity()` 被调用。

### Q2: 伤害没有生效？
检查 `DamageSource` 是否正确设置，确认 `setOwner()` 被调用。

### Q3: 网络数据包发送失败？
确保在客户端发送数据包，不要在服务端调用 `sendShootPacket()`。

### Q4: 耐久度消耗异常？
使用 `stack.damage()` 方法，它会自动处理不可修复物品的情况。

---

## 进阶功能

完成基础功能后，可以尝试扩展：

1. **不同蓄力程度不同效果**
   - 低蓄力：减速弹
   - 高蓄力：穿透弹

2. **多重发射**
   - 满蓄力时发射三发散射

3. **附魔支持**
   - 力量附魔增加伤害
   - 耐久附魔减少消耗

4. **粒子优化**
   - 使用自定义粒子类型
   - 添加命中爆炸动画

---

## 下一步

现在我们已经完成了魔法棒的开发。接下来让我们学习创建魔法生物：

- [第四章：魔法生物](./04-magic-creature.md) - 创建自定义实体和 AI 行为

---

*魔法棒是魔法师的标志武器，但只有真正的魔法生物才能成为魔法师的伙伴！*