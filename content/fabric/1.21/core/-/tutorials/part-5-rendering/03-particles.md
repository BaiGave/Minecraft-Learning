# 粒子效果

> 学会创建自定义粒子效果，为你的 Mod 添加绚丽的外观

## 什么是粒子？

粒子（Particles）是 Minecraft 中的小型视觉效果：
- 火焰燃烧时的火焰粒子
- 法师施展魔法时的魔法粒子
- 生物受伤时的血液粒子

Fabric API 提供了完整的粒子系统支持，让我们可以创建任意类型的粒子效果。

---

## 1. 粒子系统架构

### 1.1 核心组件

```
粒子系统 = 粒子类型 + 粒子工厂 + 粒子渲染器

1. 粒子类型 (ParticleType) - 定义粒子的种类
2. 粒子工厂 (ParticleFactory) - 创建粒子的实例
3. 粒子效果 (ParticleEffect) - 粒子渲染时的参数
```

### 1.2 创建流程

```
1. 注册粒子类型
   ↓
2. 在客户端注册粒子工厂
   ↓
3. 在游戏中生成粒子
```

---

## 2. 完整示例：火焰粒子

### 2.1 添加依赖

在 `build.gradle` 中添加：

```groovy
dependencies {
    // 粒子 API
    modImplementation 'net.fabricmc:fabric-particles-v1:2.0.0'
}
```

### 2.2 创建粒子类型

```java
package com.example.mod.particle;

import net.fabricmc.fabric.api.particle.v1.FabricParticleTypes;
import net.minecraft.particle.ParticleType;
import net.minecraft.util.Identifier;
import net.minecraft.util.registry.Registry;

// 1. 创建粒子类型
public class ModParticles {
    
    // 简单的火焰粒子类型
    public static final ParticleType<?> FLAME_PARTICLE = 
        FabricParticleTypes.simple();
    
    // 带有数据的复杂粒子类型（后面会用到）
    // public static final ParticleType<FlameParticleEffect> FLAME_WITH_DATA = ...
    
    // 注册所有粒子
    public static void register() {
        Registry.register(
            Registry.PARTICLE_TYPE,
            Identifier.of("mymod", "flame"),
            FLAME_PARTICLE
        );
    }
}
```

### 2.3 注册粒子工厂

粒子工厂只在客户端需要注册，所以放在客户端初始化类中：

```java
package com.example.mod.client;

import com.example.mod.particle.ModParticles;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.particle.v1.ParticleFactoryRegistry;
import net.minecraft.client.particle.FlameParticle;
import net.minecraft.client.particle.SpriteTexturedParticle;

// 2. 在客户端初始化时注册工厂
public class MyModClient implements ClientModInitializer {
    
    @Override
    public void initializeClient() {
        // 获取粒子工厂注册表
        ParticleFactoryRegistry registry = ParticleFactoryRegistry.getInstance();
        
        // 注册火焰粒子工厂
        // 使用已有的 FlameParticle 作为演示
        registry.register(
            ModParticles.FLAME_PARTICLE,
            // lambda 表达式创建粒子工厂
            provider -> new FlameParticle(provider)
        );
    }
}
```

### 2.4 生成粒子

现在可以在游戏中生成粒子了：

```java
package com.example.mod.event;

import com.example.mod.particle.ModParticles;
import net.fabricmc.fabric.api.client.particle.v1.ClientPlayConnectionEvents;
import net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents;
import net.minecraft.block.BlockState;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.network.ServerPlayConnectionListener;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

// 生成粒子的工具类
public class ParticleHelper {
    
    // 在世界中的某个位置生成火焰粒子
    public static void spawnFlameParticles(World world, double x, double y, double z) {
        // 参数: 粒子类型, X, Y, Z, 速度 X, 速度 Y, 速度 Z
        world.addParticle(
            ModParticles.FLAME_PARTICLE,  // 粒子类型
            x, y, z,                     // 位置
            0, 0.1, 0                    // 速度（稍微向上飘）
        );
    }
    
    // 在区域中生成多个粒子
    public static void spawnFlameParticlesInArea(World world, BlockPos pos) {
        for (int i = 0; i < 10; i++) {
            // 在方块周围随机位置生成
            double x = pos.getX() + Math.random();
            double y = pos.getY() + Math.random();
            double z = pos.getZ() + Math.random();
            
            spawnFlameParticles(world, x, y, z);
        }
    }
}
```

### 2.5 在 Mod 主类中初始化

```java
package com.example.mod;

import com.example.mod.particle.ModParticles;
import net.fabricmc.api.ModInitializer;

public class MyMod implements ModInitializer {
    
    @Override
    public void onInitialize() {
        // 注册粒子类型
        ModParticles.register();
        
        // 其他初始化...
    }
}
```

---

## 3. 高级：自定义粒子工厂

### 3.1 创建自定义粒子类

```java
package com.example.mod.client.particle;

import net.minecraft.client.particle.SpriteTexturedParticle;
import net.minecraft.client.texture.Sprite;
import net.minecraft.util.math.MathHelper;

// 自定义粒子类
public class CustomFlameParticle extends SpriteTexturedParticle {
    
    // 粒子生命周期中的位置
    private float yaw;
    private float pitch;
    
    public CustomFlameParticle(Factory factory) {
        super(factory);
        
        // 设置粒子基本属性
        this.maxAge = 40;                    // 存活 40 刻（约 2 秒）
        this.scale = 0.5f;                   // 大小为 0.5
        this.setVelocity(0, 0.1, 0);         // 向上飘
        this.setBoundingBoxSpacing(0.5f, 0.5f);
    }
    
    @Override
    public void tick() {
        // 每次更新调用
        
        // 向上移动
        this.velocityY += 0.01;
        
        // 随机左右摆动
        this.velocityX += (Math.random() - 0.5) * 0.1;
        this.velocityZ += (Math.random() - 0.5) * 0.1;
        
        // 淡出效果
        float alpha = 1.0f - ((float) this.age / this.maxAge);
        this.setAlpha(alpha * 0.8f);
        
        // 调用父类的 tick 方法
        super.tick();
    }
    
    @Override
    protected float getMinU() {
        return sprite.getMinU();
    }
    
    @Override
    protected float getMaxU() {
        return sprite.getMaxU();
    }
    
    @Override
    protected float getMinV() {
        return sprite.getMinV();
    }
    
    @Override
    protected float getMaxV() {
        return sprite.getMaxV();
    }
    
    // 工厂类，用于创建粒子
    public static class Factory implements net.fabricmc.fabric.api.client.particle.v1.ParticleFactory<net.minecraft.particle.ParticleDefaultType> {
        
        private final Sprite sprite;
        
        public Factory(Sprite sprite) {
            this.sprite = sprite;
        }
        
        @Override
        public CustomFlameParticle create(net.minecraft.particle.ParticleDefaultType parameters,
                                          net.minecraft.client.particle.ParticleTextureSheet sheet) {
            // 这里会返回带有 Sprite 的粒子
            // 实际实现需要更复杂的处理
            return null;  // 简化示例
        }
    }
}
```

### 3.2 使用 Sprite 的工厂

更常见的写法是使用 `SpriteProviderWithAlpha`：

```java
package com.example.mod.client;

import com.example.mod.particle.ModParticles;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.particle.v1.ParticleFactoryRegistry;
import net.minecraft.client.particle.FlameParticle;
import net.minecraft.client.particle.SpriteProvider;

// 带有 Sprite 的粒子工厂
public class MyModClient implements ClientModInitializer {
    
    @Override
    public void initializeClient() {
        ParticleFactoryRegistry registry = ParticleFactoryRegistry.getInstance();
        
        // 方法 1: 使用已有的粒子类
        registry.register(
            ModParticles.FLAME_PARTICLE,
            // SpriteProvider 会自动加载纹理
            provider -> new FlameParticle(provider)
        );
        
        // 方法 2: 延迟加载 Sprite（更推荐）
        // 这种方式会在需要时从纹理图集加载 Sprite
        registry.register(
            ModParticles.FLAME_PARTICLE,
            // PendingParticleFactory 在首次渲染时才加载 Sprite
            provider -> new SpriteParticle(provider)
        );
    }
}

// 自定义粒子类示例
class SpriteParticle extends net.minecraft.client.particle.SpriteTexturedParticle {
    
    private final float initialVelocityY;
    
    public SpriteParticle(SpriteProvider spriteProvider) {
        super(spriteProvider);
        
        this.maxAge = 30;
        this.scale = 0.3f;
        this.initialVelocityY = 0.05f;
        this.setVelocity(
            (Math.random() - 0.5) * 0.1,
            this.initialVelocityY,
            (Math.random() - 0.5) * 0.1
        );
    }
    
    @Override
    public void tick() {
        // 向上飘动
        this.velocityY += 0.005;
        
        // 逐渐变小
        this.scale *= 0.95;
        
        // 淡出
        this.setAlpha(this.age > 20 ? 1.0f - (this.age - 20) / 10f : 1.0f);
        
        super.tick();
    }
}
```

---

## 4. 高级：带数据的粒子

### 4.1 创建粒子效果类

```java
package com.example.mod.particle;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.particle.ParticleEffect;
import net.minecraft.particle.ParticleType;

// 带参数的粒子效果
public class MagicParticleEffect implements ParticleEffect {
    
    // Codec 用于网络传输和文件读写
    public static final Codec<MagicParticleEffect> CODEC = RecordCodecBuilder.create(instance ->
        instance.group(
            Codec.FLOAT.fieldOf("r").forGetter(e -> e.r),
            Codec.FLOAT.fieldOf("g").forGetter(e -> e.g),
            Codec.FLOAT.fieldOf("b").forGetter(e -> e.b),
            Codec.FLOAT.fieldOf("size").forGetter(e -> e.size)
        ).apply(instance, MagicParticleEffect::new)
    );
    
    // PacketCodec 用于数据包传输
    public static final PacketCodec<RegistryByteBuf, MagicParticleEffect> PACKET_CODEC =
        PacketCodec.tuple(
            PacketCodec.of((buf, e) -> buf.writeFloat(e.r), RegistryByteBuf::readFloat),
            PacketCodec.of((buf, e) -> buf.writeFloat(e.g), RegistryByteBuf::readFloat),
            PacketCodec.of((buf, e) -> buf.writeFloat(e.b), RegistryByteBuf::readFloat),
            PacketCodec.of((buf, e) -> buf.writeFloat(e.size), RegistryByteBuf::readFloat),
            MagicParticleEffect::new
        );
    
    public final float r;
    public final float g;
    public final float b;
    public final float size;
    
    public MagicParticleEffect(float r, float g, float b, float size) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.size = size;
    }
    
    @Override
    public ParticleType<?> getType() {
        return ModParticles.MAGIC_PARTICLE;
    }
}
```

### 4.2 注册复杂粒子类型

```java
public class ModParticles {
    
    // 带参数的魔法粒子
    public static final ParticleType<MagicParticleEffect> MAGIC_PARTICLE = 
        FabricParticleTypes.complex(
            MagicParticleEffect.CODEC,
            MagicParticleEffect.PACKET_CODEC
        );
    
    public static void register() {
        // ... 其他注册
        
        Registry.register(
            Registry.PARTICLE_TYPE,
            Identifier.of("mymod", "magic"),
            MAGIC_PARTICLE
        );
    }
}
```

### 4.3 为带参数的粒子创建工厂

```java
// 注册带参数的粒子工厂
registry.register(
    ModParticles.MAGIC_PARTICLE,
    // 使用 SpriteProvider 来处理纹理
    provider -> new SpriteTexturedParticle.Factory(provider)
);
```

---

## 5. 实际应用：玩家手持物品发光

### 5.1 粒子生成器类

```java
package com.example.mod.util;

import com.example.mod.particle.ModParticles;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.particle.ParticleEffect;
import net.minecraft.util.Hand;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

// 玩家粒子工具类
public class PlayerParticleEffects {
    
    // 在玩家手中生成粒子
    public static void spawnHoldingParticles(PlayerEntity player) {
        World world = player.getWorld();
        
        // 检查主手和副手
        for (Hand hand : Hand.values()) {
            var stack = player.getStackInHand(hand);
            
            // 检查是否是特定物品（这里用 modid:enchanted_gem ���例）
            if (stack.getItem().toString().contains("mymod")) {
                spawnEnchantedParticles(world, player, hand);
            }
        }
    }
    
    private static void spawnEnchantedParticles(World world, PlayerEntity player, Hand hand) {
        // 获取玩家朝向
        Vec3d lookDir = player.getRotationVector();
        Vec3d handPos = player.getHandPos(hand);
        
        // 生成魔法粒子
        for (int i = 0; i < 3; i++) {
            world.addParticle(
                ModParticles.FLAME_PARTICLE,
                handPos.x,
                handPos.y,
                handPos.z,
                // 随机速度
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
        }
    }
    
    // 爆炸效果粒子
    public static void spawnExplosion(World world, Vec3d position) {
        // 简单的爆炸环
        for (int i = 0; i < 20; i++) {
            double angle = (i / 20.0) * Math.PI * 2;
            world.addParticle(
                ModParticles.FLAME_PARTICLE,
                position.x,
                position.y,
                position.z,
                Math.cos(angle) * 0.5,  // 水平速度
                0.2,                      // 向上速度
                Math.sin(angle) * 0.5   // 水平速度
            );
        }
    }
}
```

### 5.2 在事件中触发

```java
// 在玩家交互时生成粒子
PlayerBlockBreakEvents.AFTER.register((world, player, pos, state, blockEntity) -> {
    // 挖掘完成后生成粒子
    PlayerParticleEffects.spawnExplosion(world, Vec3d.ofCenter(pos));
});
```

---

## 6. 粒子纹理

### 6.1 准备纹理

在 `src/main/resources/assets/mymod/textures/particle/` 目录下放置粒子纹理。

### 6.2 纹理图集配置

粒子通常打包在纹理图集中。在 `assets/mymod/minecraft/textures/particle/` 创建粒子纹理。

对于自定义粒子，通常需要：
1. 在 `assets/mymod/particles/` 定义粒子 JSON（可选）
2. 或让粒子自动从纹理图集获取

---

## 7. 常见问题

### Q: 粒子不显示？

1. **检查粒子工厂是否注册** - 确保在客户端正确注册
2. **检查粒子类型是否注册** - 服务端和客户端都需要
3. **检查粒子生成位置** - 确保在玩家可见范围内
4. **检查粒子生命周期** - 确保 `maxAge > 0`

### Q: 如何让粒子跟随实体？

```java
// 在实体的 tick() 方法中
@Override
public void tick() {
    super.tick();
    
    // 每���几刻生成一次粒子
    if (this.age % 5 == 0) {
        this.getWorld().addParticle(
            ModParticles.FLAME_PARTICLE,
            this.getX(), this.getY() + 0.5, this.getZ(),
            0, 0, 0
        );
    }
}
```

### Q: 如何控制粒子数量？

```java
// 限制粒子生成频率
private int particleCooldown = 0;

public void update() {
    if (particleCooldown > 0) {
        particleCooldown--;
        return;
    }
    
    // 生成粒子
    spawnParticles();
    
    // 重置冷却（每 2 tick 生成一次）
    particleCooldown = 2;
}
```

---

## 8. 练习题

1. **练习 1**: 创建一个绿色魔法粒子
   - 使用已有的粒子类型，改变生成参数

2. **练习 2**: 创建一个跟随玩家的粒子轨迹
   - 在玩家移动时在脚下生成粒子

3. **练习 3**: 创建一个爆炸效果
   - 在特定事件触发时生成一圈向外扩散的粒子

4. **练习 4**: 创建一个自定义粒子类
   - 实现粒子随时间改变大小和透明度

---

## 9. 总结

本章学习了：
- 粒子系统的基本架构
- 如何创建粒子类型
- 如何注册粒子工厂
- 如何在游戏中生成粒子
- 如何创建自定义粒子效果

---

## 相关资料

- [渲染系统分析文档 - 粒子部分](../analysis/06-rendering-system.md)
- [Fabric Particles API Wiki](https://fabricmc.net/wiki/documentation:fabric_particles_v1)
- [Minecraft Wiki: Particles](https://minecraft.wiki/w/Particles)