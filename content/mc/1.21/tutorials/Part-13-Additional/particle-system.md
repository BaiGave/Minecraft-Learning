# Minecraft 粒子系统详解

## 目标

学完本教程后，你将能够：
- 理解 Minecraft 粒子系统的核心概�?- 掌握 Particle、ParticleEffect、ParticleType 的关�?- 学会�?mod 中创建和生成自定义粒�?- 了解如何创建带有参数的复杂粒子效�?
## 前置知识

- Java 基础（类、接口、抽象类�?- [声音系统](./sound-system.md) - 粒子常与声音配合使用
- [实体系统](/mc/1.21/tutorials/Part-4-Entity/20-entity-intro/) - 实体是粒子的主要生产�?- [属性系统](/mc/1.21/tutorials/Part-4-Entity/24-entity-attributes/) - 了解属性修饰符

## 核心概念

### 什么是粒子系统�?
想象你在放烟花：
- **烟花�?* = 粒子效果（ParticleEffect�?- **爆炸的火�?* = 实际显示的粒子（Particle�?- **发射�?* = 粒子管理器（ParticleManager�?
Minecraft 的粒子系统负责显示那�?*小小的、短暂的视觉效果**。当你：
- 挖掘方块时飞溅的碎屑
- 喝下药水时飘起的彩色粒子
- 火焰燃烧时跳动的火苗
- 凋灵发射的蓝色魔法弹

这些都是粒子�?
### 生活比喻：粒�?= 电影院里的灰尘颗�?
想象阳光透过窗户照进电影院：
- 光线中漂浮的微小灰尘 = 游戏中的粒子
- 灰尘有不同大小、颜色、飘动方�?= 不同的粒子类�?- 风吹过时灰尘飘动的轨�?= 粒子的运动方�?- 但这些灰尘不是游戏的主角，它们只�?*点缀和反�?*

### 粒子系统的组�?
```
┌─────────────────────────────────────────────────────────�?�?                    粒子系统组成                          �?├─────────────────────────────────────────────────────────�?�?                                                        �?�?  ParticleType (类型定义)                                �?�?     �?实现                                              �?�?  ParticleEffect (效果参数)                              �?�?     �?生成                                              �?�?  Particle (实际显示的粒�?                               �?�?                                                        �?�?  �?ParticleManager (管理�? 统一调度                    �?�?                                                        �?└─────────────────────────────────────────────────────────�?```

## 图解（Mermaid�?
### 粒子生成流程�?
```mermaid
flowchart TD
    A[事件触发<br/>�? 挖掘方块] --> B[创建 ParticleEffect]
    B --> C[调用 World#addParticle]
    C --> D[ParticleManager 接收请求]
    D --> E{粒子类型检查}
    E -->|简单粒子| F[直接创建 Particle]
    E -->|复杂粒子| G[解析额外参数]
    G --> F
    F --> H[分配到客户端渲染]
    H --> I[渲染粒子精灵图]
    I --> J[显示在屏幕上]
    
    style A fill:#fff3e0
    style J fill:#e8f5e8
```

### 粒子系统类关系图

```mermaid
classDiagram
    class ParticleType~T extends ParticleEffect~ {
        +boolean alwaysShow
        +getCodec() MapCodec
        +getPacketCodec() PacketCodec
    }
    
    class ParticleEffect {
        <<interface>>
        +getType() ParticleType
    }
    
    class SimpleParticleType {
        +getType() ParticleType
    }
    
    class Particle {
        +Vec3d velocity
        +float size
        +int age
        +tick() void
        +render() void
    }
    
    class DustParticleEffect {
        +Vector3f color
        +float scale
    }
    
    class BlockStateParticleEffect {
        +BlockState state
    }
    
    class ParticleTypes {
        <<static registry>>
        +FLAME
        +EXPLOSION
        +BUBBLE
        +DUST
        +...
    }
    
    ParticleType <|.. SimpleParticleType : implements
    ParticleType <|-- Particle : creates
    ParticleEffect <|.. ParticleType : type parameter
    ParticleEffect <|-- DustParticleEffect : extends
    ParticleEffect <|-- BlockStateParticleEffect : extends
    ParticleTypes --> ParticleType : registers
```

### 粒子生命周期时序�?
```mermaid
sequenceDiagram
    participant Server as 服务�?    participant PM as ParticleManager
    participant Renderer as 粒子渲染�?    participant Client as 客户端显�?    
    Server->>PM: addParticle(effect, x, y, z, vx, vy, vz)
    PM->>PM: 选择或创建粒子实�?    PM->>Renderer: 发送粒子数�?    Renderer->>Renderer: 更新粒子状�?    Renderer->>Renderer: 计算运动和衰�?    Renderer->>Client: 渲染当前�?    
    loop 每tick
        Renderer->>Renderer: tick() - 更新位置和生命周�?        Renderer->>Renderer: 检查是否消�?    end
    
    Note over PM,Client: 粒子只在客户端显�?```

## 核心代码

### 1. ParticleEffect - 粒子效果接口

`ParticleEffect` 是一个接口，定义了粒子的基本参数�?
```java
// 源码位置: net.minecraft.particle.ParticleEffect
public interface ParticleEffect {
    ParticleType<?> getType();
}
```

**萌新理解**：ParticleEffect 就像一�?粒子处方"，告诉游�?我要生成什么样的粒�?�?
### 2. ParticleType - 粒子类型

`ParticleType` 是粒子的类型定义，类似于注册表中的键�?
```java
// 源码位置: net.minecraft.particle.ParticleType
public abstract class ParticleType<T extends ParticleEffect> {
    private final boolean alwaysShow;
    
    protected ParticleType(boolean alwaysShow) {
        this.alwaysShow = alwaysShow;
    }
    
    // 某些粒子总是显示（如爆炸），不受距离影响
    public boolean shouldAlwaysSpawn() {
        return this.alwaysShow;
    }
    
    public abstract MapCodec<T> getCodec();
    public abstract PacketCodec<? super RegistryByteBuf, T> getPacketCodec();
}
```

### 3. SimpleParticleType - 简单粒子类�?
不需要额外参数的粒子类型�?
```java
// 源码位置: net.minecraft.particle.SimpleParticleType
public class SimpleParticleType extends ParticleType<SimpleParticleType> 
                                implements ParticleEffect {
    
    protected SimpleParticleType(boolean alwaysShow) {
        super(alwaysShow);
    }
    
    // 简单粒子直接返回自�?    public SimpleParticleType getType() {
        return this;
    }
}
```

### 4. 常见粒子类型

```java
// 源码位置: net.minecraft.particle.ParticleTypes
public class ParticleTypes {
    // 无参数粒�?    public static final SimpleParticleType FLAME = register("flame", false);
    public static final SimpleParticleType SMOKE = register("smoke", false);
    public static final SimpleParticleType BUBBLE = register("bubble", false);
    public static final SimpleParticleType EXPLOSION = register("explosion", true);
    public static final SimpleParticleType HEART = register("heart", false);
    public static final SimpleParticleType CRIT = register("crit", false);
    public static final SimpleParticleType ENCHANT = register("enchant", false);
    
    // 带方块状态的粒子
    public static final ParticleType<BlockStateParticleEffect> BLOCK = 
        register("block", false, BlockStateParticleEffect::createCodec, ...);
    
    // 带颜色的粒子（用于药水效果）
    public static final ParticleType<EntityEffectParticleEffect> ENTITY_EFFECT = 
        register("entity_effect", false, ...);
    
    // 灰尘粒子（红石粉等）
    public static final ParticleType<DustParticleEffect> DUST = 
        register("dust", false, DustParticleEffect::CODEC, ...);
    
    // 物品粒子
    public static final ParticleType<ItemStackParticleEffect> ITEM = 
        register("item", false, ...);
}
```

### 5. 带参数的粒子效果

#### DustParticleEffect - 彩色灰尘粒子

```java
// 源码位置: net.minecraft.particle.DustParticleEffect
public class DustParticleEffect extends AbstractDustParticleEffect {
    public static final Vector3f RED = Vec3d.unpackRgb(0xFF0000).toVector3f();
    public static final DustParticleEffect DEFAULT = new DustParticleEffect(RED, 1.0f);
    
    private final Vector3f color;
    
    public DustParticleEffect(Vector3f color, float scale) {
        super(scale);
        this.color = color;
    }
    
    public ParticleType<DustParticleEffect> getType() {
        return ParticleTypes.DUST;
    }
    
    public Vector3f getColor() {
        return this.color;
    }
}
```

#### BlockStateParticleEffect - 方块状态粒�?
```java
// 用于显示被挖掘方块的材质
public class BlockStateParticleEffect implements ParticleEffect {
    private final ParticleType<BlockStateParticleEffect> type;
    private final BlockState state;
    
    public BlockStateParticleEffect(ParticleType<BlockStateParticleEffect> type, 
                                    BlockState state) {
        this.type = type;
        this.state = state;
    }
    
    public ParticleType<BlockStateParticleEffect> getType() {
        return type;
    }
}
```

## 实战演示

### 场景 1：基础粒子生成

最简单的粒子生成，不需要额外参数�?
```java
// 在服务端或客户端生成粒子
// 方法1：带速度参数
world.addParticle(
    ParticleTypes.FLAME,           // 火焰粒子
    x, y, z,                     // 位置
    velocityX, velocityY, velocityZ  // 速度
);

// 方法2：不带速度（粒子静止）
world.addParticle(
    ParticleTypes.HEART,
    player.getX(), 
    player.getY() + 1.5,        // 在玩家头部高�?    player.getZ(),
    0, 0, 0                      // 零速度
);

// 方法3：服务端广播给附近玩�?world.syncGlobalEvent(eventId, pos, data);
// 例如：挖掘方块效�?world.syncGlobalEvent(2001, blockPos, Block.getRawIdFromState(blockState));
```

### 场景 2：彩色灰尘粒�?
```java
// 创建一个红色灰尘效�?public void spawnRedDust(World world, Vec3d pos) {
    DustParticleEffect redDust = new DustParticleEffect(
        new Vector3f(1.0f, 0.0f, 0.0f),  // 红色
        1.0f                               // 正常大小
    );
    
    world.addParticle(redDust,
        pos.x, pos.y, pos.z,
        0, 0.1, 0  // 向上飘动的速度
    );
}

// 创建一个渐变色的灰尘效�?public void spawnRainbowDust(World world, Vec3d pos, float hue) {
    float r = (MathHelper.sin(hue) + 1) / 2;
    float g = (MathHelper.sin(hue + 2.1f) + 1) / 2;
    float b = (MathHelper.sin(hue + 4.2f) + 1) / 2;
    
    DustParticleEffect rainbow = new DustParticleEffect(
        new Vector3f(r, g, b),
        0.8f
    );
    
    world.addParticle(rainbow, pos.x, pos.y, pos.z, 0, 0.05, 0);
}
```

### 场景 3：方块材质粒�?
显示方块被破坏时的材质效果�?
```java
// 在方块被破坏时生�?public void onBlockDestroy(World world, BlockPos pos, BlockState state) {
    // 生成方块材质的破坏粒�?    BlockStateParticleEffect particle = new BlockStateParticleEffect(
        ParticleTypes.BLOCK,
        state
    );
    
    // 在方块位置生成多个粒�?    for (int i = 0; i < 8; i++) {
        world.addParticle(particle,
            pos.getX() + 0.5 + (random.nextDouble() - 0.5),
            pos.getY() + 0.5 + (random.nextDouble() - 0.5),
            pos.getZ() + 0.5 + (random.nextDouble() - 0.5),
            (random.nextDouble() - 0.5) * 0.5,
            random.nextDouble() * 0.5,
            (random.nextDouble() - 0.5) * 0.5
        );
    }
}
```

### 场景 4：粒子群生成

生成大量粒子营造视觉效果�?
```java
// 爆炸效果 - 生成一圈粒�?public void createExplosionEffect(World world, Vec3d center) {
    // 爆炸核心粒子
    world.addParticle(ParticleTypes.EXPLOSION,
        center.x, center.y, center.z,
        0, 0, 0
    );
    
    // 烟雾�?    for (int i = 0; i < 20; i++) {
        double angle = i * (Math.PI * 2 / 20);
        double radius = 0.5;
        
        world.addParticle(ParticleTypes.LARGE_SMOKE,
            center.x + Math.cos(angle) * radius,
            center.y,
            center.z + Math.sin(angle) * radius,
            Math.cos(angle) * 0.1,
            0.2,
            Math.sin(angle) * 0.1
        );
    }
    
    // 火花飞溅
    for (int i = 0; i < 30; i++) {
        double speed = random.nextDouble() * 0.3;
        double theta = random.nextDouble() * Math.PI * 2;
        double phi = random.nextDouble() * Math.PI;
        
        world.addParticle(ParticleTypes.FLAME,
            center.x, center.y, center.z,
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed,
            Math.sin(phi) * Math.sin(theta) * speed
        );
    }
}
```

### 场景 5：创建自定义粒子效果�?
```java
// 第一步：定义粒子效果�?public class MagicOrbParticleEffect implements ParticleEffect {
    private final ParticleType<MagicOrbParticleEffect> type;
    private final float rotationSpeed;
    private final int color;
    
    public MagicOrbParticleEffect(ParticleType<MagicOrbParticleEffect> type,
                                   float rotationSpeed, int color) {
        this.type = type;
        this.rotationSpeed = rotationSpeed;
        this.color = color;
    }
    
    @Override
    public ParticleType<MagicOrbParticleEffect> getType() {
        return type;
    }
    
    public float getRotationSpeed() { return rotationSpeed; }
    public int getColor() { return color; }
}

// 第二步：注册粒子类型
public static final ParticleType<MagicOrbParticleEffect> MAGIC_ORB = 
    ParticleTypes.register("magic_orb", false,
        type -> MagicOrbParticleEffect.CODEC,
        type -> MagicOrbParticleEffect.PACKET_CODEC
    );

// 第三步：生成粒子
public void spawnMagicOrb(World world, Vec3d pos) {
    MagicOrbParticleEffect effect = new MagicOrbParticleEffect(
        ModParticles.MAGIC_ORB,
        2.0f,
        0x8800FF  // 紫色
    );
    
    world.addParticle(effect,
        pos.x, pos.y, pos.z,
        0, 0.05, 0
    );
}
```

## 常见粒子类型速查�?
| 粒子名称 | 说明 | 常用场景 |
|---------|------|---------|
| `FLAME` | 火焰 | 熔炉、火把、岩�?|
| `SMOKE` | 烟雾 | 爆炸、烟雾弹 |
| `BUBBLE` | 气泡 | 水下、喷�?|
| `HEART` | 爱心 | 繁殖、治�?|
| `CRIT` | 暴击 | 暴击伤害 |
| `ENCHANT` | 附魔 | 附魔台、书�?|
| `EXPLOSION` | 爆炸 | TNT、恶魂火�?|
| `DUST` | 灰尘 | 红石、魔�?|
| `BLOCK` | 方块碎片 | 挖掘、摔�?|
| `ITEM` | 物品图标 | 消耗物�?|
| `NOTE` | 音符 | 音符�?|
| `SLIME` | 史莱�?| 史莱姆块 |
| `SPIT` | 吐息 | 羊驼 |
| `SQUID_INK` | 墨汁 | 鱿鱼 |

## 小结

| 概念 | 作用 | 生活比喻 |
|------|------|----------|
| `ParticleType` | 粒子的类型定�?| 粒子"种类标签" |
| `ParticleEffect` | 粒子的参数配�?| 粒子"配方�? |
| `SimpleParticleType` | 无参数的简单粒�?| 直接拿来的成�?|
| `DustParticleEffect` | 带颜色的灰尘粒子 | 彩色粉末 |
| `World#addParticle` | 生成粒子的方�?| 按下"生成"按钮 |

**核心要点�?*
1. 粒子只在客户端显�?2. 粒子通过 `World#addParticle()` �?`syncGlobalEvent()` 生成
3. 简单粒子用 `SimpleParticleType`，复杂粒子用专门�?Effect �?4. 声音和粒子经常一起使用增强效�?
## 练习

### 练习 1：基础粒子生成
创建一个方块，玩家右键点击时在方块上方生成火焰粒子�?
### 练习 2：彩色粒子特�?使用 `DustParticleEffect` 创建一个彩虹色的粒子喷泉效果�?
### 练习 3：爆炸效�?模拟 TNT 爆炸效果，包含爆炸核心、烟雾环和飞溅火花�?
### 练习 4：自定义粒子类型
创建一个带有旋转动画的自定义魔法球粒子效果�?
## 相关链接

### 内部链接
- [声音系统](./sound-system.md) - 声音与粒子配�?- [实体系统](/mc/1.21/tutorials/Part-4-Entity/20-entity-intro/) - 实体产生粒子
- [物品系统](/mc/1.21/tutorials/Part-3-Block-Item/17-item-basics/) - 物品消耗产生粒�?- [方块实体](/mc/1.21/tutorials/Part-3-Block-Item/16-block-entity/) - 创建能发射粒子的方块

### 外部资源
- [Minecraft Wiki: Particles](https://minecraft.fandom.com/wiki/Particle)
- [粒子ID列表](https://minecraft.fandom.com/wiki/Particle#List_of_particles)
- [JOML�?Vector3f文档](https://joml-ci.github.io/JOML/apidocs/org/joml/Vector3f.html)
