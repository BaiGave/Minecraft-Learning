---
title: API 高级应用
readingTime: 30
---

# API 高级应用

> 本章目标：掌握 ImmPtlEntityExtension 接口、自定义传送门生成器，以及完整模组集成方法。

---

## 目录

- [ImmPtlEntityExtension 接口](#immtlentitityextension-接口)
- [自定义传送门生成器](#自定义传送门生成器)
- [完整模组集成示例](#完整模组集成示例)
- [API 最佳实践](#api-最佳实践)
- [课后自查](#课后自查)

---

## ImmPtlEntityExtension 接口

### 什么是 ImmPtlEntityExtension？

**ImmPtlEntityExtension** 是一个允许开发者控制实体传送行为的接口。通过实现这个接口，你可以：
- 自定义实体的传送逻辑
- 阻止特定实体传送
- 在传送时执行特殊效果
- 修改传送目的地

源码位置：
```
D:\Minecraft-Learning\assets\ImmersivePortalsMod-6.0.6-mc1.21.1\src\main\java\qouteall\imm_ptl\core\api\ImmPtlEntityExtension.java
```

### 接口定义

```java
public interface ImmPtlEntityExtension {
    
    // 当实体被传送前调用
    default void ip_onEntityTeleported(
        ServerWorld sourceWorld,
        ServerWorld destinationWorld,
        Vec3d sourcePosition,
        Vec3d destinationPosition
    ) {}
    
    // 检查实体是否可以传送
    default boolean ip_canTeleport(Portal portal) {
        return true;
    }
    
    // 获取实体的特殊目的地（可选）
    default Vec3d ip_getCustomTeleportDestination(Portal portal) {
        return null;
    }
    
    // 当实体进入传送门时调用
    default void ip_onEnterPortal(Portal portal) {}
    
    // 当实体离开传送门时调用
    default void ip_onExitPortal(Portal portal) {}
}
```

### 实现示例：阻止特定实体传送

```java
public class MyEntityExtension implements ImmPtlEntityExtension {
    
    private static final Set<EntityType<?>> BLOCKED_TYPES = Set.of(
        EntityType.VILLAGER,  // 村民不能传送
        EntityType.ITEM        // 物品不能传送
    );
    
    @Override
    public boolean ip_canTeleport(Portal portal) {
        // 获取当前实体
        Entity entity = (Entity) this;
        
        // 检查是否是阻止列表中的类型
        if (BLOCKED_TYPES.contains(entity.getType())) {
            return false;  // 阻止传送
        }
        
        return true;  // 允许传送
    }
}
```

### 实现示例：自定义传送目的地

```java
public class HomeTeleporter implements ImmPtlEntityExtension {
    
    private Vec3d homePosition = null;
    
    @Override
    public Vec3d ip_getCustomTeleportDestination(Portal portal) {
        // 返回玩家的家位置
        if (homePosition == null) {
            // 使用玩家首次登录的位置作为"家"
            PlayerEntity player = (PlayerEntity) this;
            homePosition = player.getPos();
        }
        
        // 返回固定的目的地
        return homePosition;
    }
    
    @Override
    public void ip_onEntityTeleported(
        ServerWorld sourceWorld,
        ServerWorld destinationWorld,
        Vec3d sourcePosition,
        Vec3d destinationPosition
    ) {
        // 传送成功后播放音效
        PlayerEntity player = (PlayerEntity) this;
        player.playSound(SoundEvents.UI_TOAST_CHALLENGE_COMPLETE, 1.0F, 1.0F);
        
        // 发送消息
        player.sendMessage(Text.literal("已传送到家！"), true);
    }
}
```

---

## 自定义传送门生成器

### PortalGenerator 接口

**PortalGenerator** 允许你定义自定义的传送门创建和触发逻辑。

```java
public interface PortalGenerator {
    
    // 获取生成器标识符
    Identifier getIdentifier();
    
    // 检查是否应该创建传送门
    boolean shouldGeneratePortal(BlockPos pos, Level world);
    
    // 创建传送门
    @Nullable Portal createPortal(BlockPos pos, Level world);
    
    // 传送门创建后的处理
    default void onPortalCreated(Portal portal, BlockPos framePos) {}
}
```

### 完整示例：创建下界传送门生成器

```java
public class NetherPortalGenerator implements PortalGenerator {
    
    public static final Identifier ID = new Identifier("mymod", "nether_portal");
    
    @Override
    public Identifier getIdentifier() {
        return ID;
    }
    
    @Override
    public boolean shouldGeneratePortal(BlockPos pos, Level world) {
        // 只在下界维度生成
        return world.dimension() == Level.NETHER;
    }
    
    @Override
    public Portal createPortal(BlockPos pos, Level world) {
        // 创建传送门实体
        Portal portal = new Portal(world);
        
        // 设置传送门位置（在方块位置）
        Vec3d portalPos = Vec3d.atCenterOf(pos);
        portal.setPos(portalPos.x, portalPos.y, portalPos.z);
        
        // 设置传送门大小
        portal.setWidth(2.0);
        portal.setHeight(3.0);
        
        // 设置轴向（朝向 Z 轴）
        portal.setAxisW(new Vec3d(0, 0, 1));
        portal.setAxisH(new Vec3d(0, 1, 0));
        
        // 设置目标维度为主世界
        ResourceKey<Level> netherKey = Level.NETHER;
        ResourceKey<Level> overworldKey = Level.OVERWORLD;
        portal.setDestinationDimension(overworldKey);
        
        // 计算主世界对应位置（下界坐标转换）
        Vec3d overworldPos = convertNetherToOverworld(portalPos);
        portal.setDestination(overworldPos);
        
        // 生成到世界
        world.spawnEntity(portal);
        
        return portal;
    }
    
    @Override
    public void onPortalCreated(Portal portal, BlockPos framePos) {
        // 添加粒子效果
        ServerWorld world = (ServerWorld) portal.getWorld();
        world.spawnParticles(
            ParticleTypes.PORTAL,
            portal.getX(), portal.getY(), portal.getZ(),
            100,  // 粒子数量
            1.0, 1.0, 1.0,  // 偏移
            0.1   // 速度
        );
    }
    
    // 下界坐标转换为主世界坐标（8倍）
    private Vec3d convertNetherToOverworld(Vec3d netherPos) {
        return new Vec3d(
            netherPos.x * 8,
            netherPos.y,
            netherPos.z * 8
        );
    }
}
```

### 注册自定义生成器

```java
public class MyMod implements DedicatedServerModInit {
    
    @Override
    public void onInitialize() {
        // 注册自定义传送门生成器
        PortalGeneratorRegistry.register(new NetherPortalGenerator());
    }
}
```

---

## 完整模组集成示例

### 模组概述

创建一个完整的"回家传送门"模组，包含：
- 自定义传送门物品
- 右键使用创建传送门对
- 支持玩家传送

### 项目结构

```
src/main/java/com/example/hometeleporter/
├── HomeTeleporterMod.java      # 模组主类
├── item/HomePortalWandItem.java # 传送门魔杖物品
├── entity/HomePortalEntity.java # 自定义传送门实体
└── mixin/PortalMixin.java       # Mixin 注入
```

### 模组主类

```java
@Mod(HomeTeleporterMod.MOD_ID)
public class HomeTeleporterMod implements DedicatedServerModInit {
    
    public static final String MOD_ID = "hometeleporter";
    
    @Override
    public void onInitialize() {
        // 注册物品
        Registry.register(
            Registries.ITEM,
            new Identifier(MOD_ID, "home_portal_wand"),
            new HomePortalWandItem()
        );
        
        // 注册实体类型
        Registry.register(
            Registries.ENTITY_TYPE,
            new Identifier(MOD_ID, "home_portal"),
            HomePortalEntity.TYPE
        );
        
        // 注册传送门生成器
        PortalGeneratorRegistry.register(new HomePortalGenerator());
        
        HomeTeleporterMod.LOGGER.info("HomeTeleporterMod 已加载！");
    }
}
```

### 传送门魔杖物品

```java
public class HomePortalWandItem extends Item {
    
    public HomePortalWandItem() {
        super(new Settings()
            .maxCount(1)
            .rarity(Rarity.EPIC)
        );
    }
    
    @Override
    public TypedActionResult<ItemStack> use(
        Level world,
        PlayerEntity player,
        Hand hand
    ) {
        if (world.isClient) {
            return TypedActionResult.pass(player.getStackInHand(hand));
        }
        
        // 检查是否在主世界
        if (world.dimension() != Level.OVERWORLD) {
            player.sendMessage(
                Text.literal("这个物品只能在主世界使用！"),
                false
            );
            return TypedActionResult.fail(player.getStackInHand(hand));
        }
        
        // 获取玩家朝向的方块
        BlockHitResult hit = raycast(player, 10.0, false);
        
        if (hit.getType() == MissType.MISS) {
            player.sendMessage(
                Text.literal("请指向一个方块！"),
                false
            );
            return TypedActionResult.fail(player.getStackInHand(hand));
        }
        
        BlockPos pos = hit.getBlockPos();
        
        // 创建传送门对
        createPortalPair(world, pos, player);
        
        // 消耗物品
        player.getStackInHand(hand).decrement(1);
        
        // 播放音效
        player.playSound(SoundEvents.BLOCK_PORTAL_AMBIENT, 1.0F, 1.0F);
        
        return TypedActionResult.success(player.getStackInHand(hand));
    }
    
    private void createPortalPair(Level world, BlockPos pos, PlayerEntity player) {
        // 位置 A（玩家位置）
        Vec3d posA = player.getPos();
        
        // 位置 B（玩家指向的位置）
        Vec3d posB = Vec3d.atCenterOf(pos);
        
        // 创建传送门 A（回到这里）
        Portal portalA = new Portal(world);
        portalA.setPos(posA.x, posA.y, posA.z);
        portalA.setWidth(2.0);
        portalA.setHeight(3.0);
        portalA.setAxisW(new Vec3d(0, 0, 1));
        portalA.setAxisH(new Vec3d(0, 1, 0));
        portalA.setDestinationDimension(world.getDimensionKey());
        portalA.setDestination(posB);
        portalA.setCustomName(Text.literal("回家传送门"));
        world.spawnEntity(portalA);
        
        // 创建传送门 B（从这里出发）
        Portal portalB = new Portal(world);
        portalB.setPos(posB.x, posB.y, posB.z);
        portalB.setWidth(2.0);
        portalB.setHeight(3.0);
        portalB.setAxisW(new Vec3d(0, 0, 1));
        portalB.setAxisH(new Vec3d(0, 1, 0));
        portalB.setDestinationDimension(world.getDimensionKey());
        portalB.setDestination(posA);
        portalB.setCustomName(Text.literal("出发传送门"));
        world.spawnEntity(portalB);
        
        // 发送成功消息
        player.sendMessage(
            Text.literal("已创建传送门对！"),
            false
        );
    }
}
```

### 自定义传送门实体

```java
public class HomePortalEntity extends Portal {
    
    public static final EntityType<HomePortalEntity> TYPE = FabricEntityTypeBuilder
        .create(MobCategory.MISC, HomePortalEntity::new)
        .dimensions(EntityDimensions.fixed(2, 3))
        .fireImmune()
        .build();
    
    public HomePortalEntity(Level world) {
        super(TYPE, world);
    }
    
    @Override
    public boolean canTeleportEntity(Entity entity) {
        // 只有玩家可以使用这个传送门
        return entity instanceof PlayerEntity;
    }
    
    @Override
    public void tick() {
        super.tick();
        
        // 添加持续的粒子效果
        if (this.getWorld().isClient) {
            this.getWorld().addParticle(
                ParticleTypes.PORTAL,
                this.getX() + random.nextGaussian() * 0.5,
                this.getY() + random.nextGaussian() * 1.5,
                this.getZ() + random.nextGaussian() * 0.5,
                0, 0.02, 0
            );
        }
    }
}
```

### Mixin：修改传送行为

```java
@Mixin(Portal.class)
public abstract class PortalMixin {
    
    @Shadow
    protected abstract boolean canTeleport(Entity entity);
    
    @Inject(
        method = "onEntityCollision",
        at = @At("HEAD"),
        cancellable = true
    )
    private void onEntityCollision(Entity entity, CallbackInfo ci) {
        // 检查是否是回家传送门
        if (this instanceof HomePortalEntity) {
            // 如果是物品，阻止传送
            if (entity instanceof ItemEntity) {
                ci.cancel();
            }
        }
    }
}
```

---

## API 最佳实践

### 1. 性能优化

💡 **避免在每帧创建对象**：
```java
// 不好：每帧创建新对象
public Vec3d getOffset() {
    return new Vec3d(1, 0, 0);  // 每次调用都创建新对象
}

// 好：使用常量或缓存
private static final Vec3d OFFSET = new Vec3d(1, 0, 0);

public Vec3d getOffset() {
    return OFFSET;
}
```

### 2. 空值检查

```java
// 始终检查空值
public Vec3d getDestination(Portal portal) {
    if (portal == null) {
        return Vec3d.ZERO;
    }
    
    Vec3d customDest = portal.getCustomTeleportDestination();
    return customDest != null ? customDest : portal.getDestination();
}
```

### 3. 同步问题

```java
// 在服务端处理所有传送逻辑
public class SafeTeleportHandler {
    
    public void teleport(PlayerEntity player, Portal portal) {
        // 只在服务端执行
        if (player.getWorld().isClient) {
            return;
        }
        
        // 执行传送
        doTeleport(player, portal);
    }
}
```

### 4. 错误恢复

```java
public boolean safeTeleport(PlayerEntity player, Portal portal) {
    try {
        // 验证传送条件
        if (!validateTeleport(player, portal)) {
            return false;
        }
        
        // 执行传送
        performTeleport(player, portal);
        return true;
        
    } catch (Exception e) {
        // 记录错误
        LOGGER.error("传送失败：", e);
        
        // 尝试恢复到安全位置
        player.setPosition(player.getSpawnPoint(player.getWorld(), player.getBlockPos()));
        return false;
    }
}
```

---

## 课后自查

✅ **第1题**：ImmPtlEntityExtension 接口有哪些方法？每个方法的作用是什么？

✅ **第2题**：如何创建一个自定义的 PortalGenerator？

✅ **第3题**：在多线程环境下，如何保证传送操作的安全性？

✅ **第4题**：设计一个"主城传送门"模组，包含哪些核心组件？

✅ **第5题**：如何处理传送过程中的异常情况？有哪些最佳实践？

---

## 下一步

- [教程总结](../SUMMARY.md) - 回顾整个教程系列
- [ImmersivePortalsMod 文档](../README.md) - 返回模组文档首页

---

*教程版本：ImmersivePortalsMod 6.0.6 / Minecraft 1.21.1*
