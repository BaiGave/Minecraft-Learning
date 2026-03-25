---
title: 第 27 章：生成系统（Spawn System）
readingTime: 35
---

# 第 27 章：生成系统（Spawn System）

> 深入了解生物是如何在世界中生成的

---

## 章节目标

- 理解 Minecraft 的生成系统架构
- 掌握 SpawnHelper 自然生成机制
- 了解 SpawnRestriction 限制规则
- 理解 SpawnSettings 生物群系设置
- 掌握特殊生成器（Cat、Phantom、Patrol）
- 了解刷怪笼的工作原理

## 前置知识

- 熟悉 Entity 基础概念
- 了解世界生成的基础

## 核心概念

### 生成系统 = 生物的"出生地"

想象大自然的生态平衡：
- 🐄 牛羊在草原上吃草
- 🐺 狼在森林里嚎叫
- 🧟 僵尸在黑暗中游荡
- 🦇 蝙蝠在洞穴里飞舞

**Minecraft 的生成系统就是决定"什么生物在哪里出现"的机制**

## 1. 生成系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      生成系统架构图                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│   │ SpawnHelper │      │  Spawner    │      │   Patrol    │     │
│   │  (自然生成)  │      │ (刷怪笼)    │      │  (巡逻队)   │     │
│   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘     │
│          │                    │                    │              │
│          └────────────────────┼────────────────────┘              │
│                               ▼                                     │
│                    ┌─────────────────────┐                         │
│                    │   SpawnDispatcher   │                         │
│                    │     (生成调度器)     │                         │
│                    └──────────┬──────────┘                         │
│                               ▼                                     │
│                    ┌─────────────────────┐                         │
│                    │  SpawnConditions   │                         │
│                    │    (生成条件)        │                         │
│                    └──────────┬──────────┘                         │
│                               ▼                                     │
│                    ┌─────────────────────┐                         │
│                    │   SpawnLocation    │                         │
│                    │    (生成位置)       │                         │
│                    └─────────────────────┘                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 2. SpawnGroup 生物群组

### 生物分类

```java
// SpawnGroup.java
public enum SpawnGroup implements Registrable<SpawnGroup> {
    MONSTER("monster", 70),      // 怪物：僵尸、骷髅、蜘蛛...
    CREATURE("creature", 10),    // 生物：牛、猪、羊...
    AMBIENT("ambient", 15),      // 环境：蝙蝠、灯笼鱼...
    WATER_CREATURE("water_creature", 5),  // 水生生物：海龟...
    WATER_AMBIENT("water_ambient", 5),    // 水中环境：鱼...
    MISC("misc", -1);            // 其他：物品、经验球...
    
    private final String name;
    private final int weight;  // 生成权重
    
    public int getWeight() { return weight; }
}
```

### SpawnGroup 权重

```
生成权重分配（每区块每 tick）：

MONSTER (怪物)     █████████████████████████████████████████████████████ 70%
CREATURE (生物)     ███████████ 10%
AMBIENT (环境)      ████████████ 15%
WATER_CREATURE (水生) ███ 5%
WATER_AMBIENT (水中)  ███ 5%
```

## 3. SpawnHelper 自然生成

### 自然生成流程

```java
// SpawnHelper.java
public class SpawnHelper {
    // 每 tick 处理自然生成
    public static void spawn(
        ServerWorld world,
        ChunkHolder chunkHolder,
        SpawnRestrictLagsRegion spawnRestrictLagsRegion,
        SpawnPredicate predicate,
        boolean spawnAnimals
    ) {
        // 1. 获取区块
        ServerChunk chunk = chunkHolder.getReadableChunk();
        if (chunk == null) return;
        
        // 2. 创建生成上下文
        SpawnContext context = new SpawnContext(
            world, chunk, spawnAnimals
        );
        
        // 3. 按群组分批生成
        for (SpawnGroup group : SpawnGroup.values()) {
            if (group == SpawnGroup.MISC) continue;
            if (!spawnAnimals && group == SpawnGroup.CREATURE) continue;
            
            // 生成该群组的实体
            spawnGroup(context, group, predicate);
        }
    }
}
```

### 生成条件检查

```java
// SpawnHelper.java
private static void spawnGroup(
    SpawnContext context,
    SpawnGroup group,
    SpawnPredicate predicate
) {
    // 1. 获取该群组的配额
    int cap = context.getCapForGroup(group);
    
    // 2. 检查密度上限
    if (context.getEntityCount() >= cap) {
        return;
    }
    
    // 3. 尝试生成
    for (int i = 0; i < group.getSpawnCount(); i++) {
        // 随机选择位置
        BlockPos pos = context.getRandomPosInChunk();
        
        // 检查并生成
        if (!trySpawn(group, pos, context, predicate)) {
            break;  // 无法生成，停止尝试
        }
    }
}
```

### 位置选择算法

```java
// 位置选择策略
public BlockPos getRandomPosInChunk() {
    Random random = context.getRandom();
    
    // 随机选择区块内的 X、Z 坐标
    int x = random.nextInt(16);
    int z = random.nextInt(16);
    
    // 获取该列的最高实体可生成位置
    int y = context.getTopYBetween(x, z);
    
    return new BlockPos(x, y, z);
}

// 最高可生成位置
public int getTopYBetween(int x, int z) {
    // 从顶部向下搜索
    Chunk chunk = this.getChunk();
    
    for (int y = chunk.getHeight(); y >= chunk.getMinY(); y--) {
        BlockState state = chunk.getBlockState(x, y, z);
        
        // 检查是否是可以生成的方块
        if (isValidSpawnBlock(state)) {
            return y + 1;  // 返回可以站立的位置
        }
    }
    
    return -1;  // 找不到合适位置
}
```

## 4. SpawnRestriction 生成限制

### SpawnRestriction 类

```java
// SpawnRestriction.java
public class SpawnRestriction<L extends Entity> {
    private static final Map<EntityType<?>, SpawnRestriction<?>> RESTRICTIONS = new HashMap<>();
    
    // 位置模式
    public enum Location {
        IN_GROUND,      // 地面（需要固体方块）
        NO_RESTRICTIONS, // 无限制
        IN_AIR,        // 空中
        IN_WATER,      // 水中
        ON_GROUND      // 地面上
    }
    
    // 宽度限制
    public record WidthWrapper(double width) {}
    
    // 创建限制规则
    public static <L extends Entity> void register(
        EntityType<L> type,
        Location location,
        Heightmap.Type heightmap,
        SpawnPredicate<L> predicate
    ) {
        RESTRICTIONS.put(type, new SpawnRestriction<>(
            location, heightmap, predicate
        ));
    }
}
```

### 常用限制规则

```java
// 常见生物的生成限制
public static void init() {
    // 僵尸：需要地面
    SpawnRestriction.register(
        EntityType.ZOMBIE,
        SpawnRestriction.Location.ON_GROUND,
        Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
        ZombieEntity::canSpawn
    );
    
    // 鱿鱼：水中
    SpawnRestriction.register(
        EntityType.SQUID,
        SpawnRestriction.Location.IN_WATER,
        Heightmap.Type.MOTION_BLOCKING,
        SquidEntity::canSpawn
    );
    
    // 蝙蝠：空中
    SpawnRestriction.register(
        EntityType.BAT,
        SpawnRestriction.Location.ON_GROUND,
        Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
        BatEntity::canSpawn
    );
    
    // 村民：地面
    SpawnRestriction.register(
        EntityType.VILLAGER,
        SpawnRestriction.Location.ON_GROUND,
        Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
        VillagerEntity::canSpawn
    );
}
```

## 5. SpawnDensityCapper 密度上限

### 密度控制

```java
// SpawnDensityCapper.java
public class SpawnDensityCapper {
    // 检查是否达到密度上限
    public static <T extends Entity> boolean canSpawn(
        EntityType<T> type,
        ServerWorld world,
        BlockPos pos,
        int existingCount
    ) {
        // 获取该类型实体的密度上限
        int maxDensity = getMaxDensity(type);
        
        // 附近已有数量超过上限
        if (existingCount >= maxDensity) {
            return false;
        }
        
        return true;
    }
    
    // 不同生物的密度上限
    private static int getMaxDensity(EntityType<?> type) {
        if (type == EntityType.ZOMBIE) return 70;    // 僵尸最多 70
        if (type == EntityType.SKELETON) return 70;  // 骷髅最多 70
        if (type == EntityType.SPIDER) return 70;    // 蜘蛛最多 70
        if (type == EntityType.COW) return 15;       // 牛最多 15
        if (type == EntityType.PIG) return 40;      // 猪最多 40
        // ...
        return 10;  // 默认上限
    }
}
```

### 密度检查

```java
// 获取附近同类实体数量
public int getNearbyEntityCount(
    EntityType<?> type,
    ServerWorld world,
    BlockPos center,
    int radius
) {
    Box box = new Box(
        center.getX() - radius, 0, center.getZ() - radius,
        center.getX() + radius, world.getHeight(), center.getZ() + radius
    );
    
    return world.getEntitiesByType(
        type,
        box,
        entity -> true
    ).size();
}
```

## 6. SpawnSettings 生物群系设置

### 生物群系生成配置

```java
// SpawnSettings.java
public class SpawnSettings {
    // 怪物生成配置
    private final Map<EntityType<?>, SpawnSettings.SpawnEntry> creatureSpawns;
    private final Map<EntityType<?>, SpawnSettings.SpawnEntry> ambientSpawns;
    private final Map<EntityType<?>, SpawnSettings.SpawnEntry> waterCreatureSpawns;
    private final Map<EntityType<?>, SpawnSettings.SpawnEntry> waterAmbientSpawns;
    
    // 添加生成配置
    public SpawnSettings addSpawn(
        SpawnGroup group,
        SpawnSettings.SpawnEntry entry
    ) {
        switch (group) {
            case CREATURE -> this.creatureSpawns.put(entry.type, entry);
            case AMBIENT -> this.ambientSpawns.put(entry.type, entry);
            case WATER_CREATURE -> this.waterCreatureSpawns.put(entry.type, entry);
            case WATER_AMBIENT -> this.waterAmbientSpawns.put(entry.type, entry);
        }
        return this;
    }
}
```

### SpawnEntry 条目

```java
// SpawnEntry.java
public static class SpawnEntry {
    public final EntityType<?> type;        // 实体类型
    public final int weight;               // 生成权重
    public final int minCount;             // 最小数量（一组）
    public final int maxCount;             // 最大数量（一组）
    
    public SpawnEntry(EntityType<?> type, int weight, int min, int max) {
        this.type = type type;
        this.weight = weight;
        this.minCount = min;
        this.maxCount = max;
    }
}
```

### 生物群系配置示例

```json
// worldgen/biome/plains.json
{
    "spawners": {
        "monster": {
            "type": "zombie",
            "weight": 95,
            "minCount": 1,
            "maxCount": 4
        },
        "creature": {
            "type": "cow",
            "weight": 10,
            "minCount": 4,
            "maxCount": 4
        },
        "ambient": {
            "type": "bat",
            "weight": 10,
            "minCount": 1,
            "maxCount": 2
        }
    }
}
```

## 7. 特殊生成器

### Cat 生成

```java
// CatSpawner.java
public class CatSpawner implements SpecialSpawner {
    @Override
    public int getWeight(ServerWorld world, boolean boolean) {
        return 8;  // 生成权重
    }
    
    @Override
    public boolean canSpawn(
        ServerWorld world,
        SpawnContext context
    ) {
        // 猫只在村庄生成
        return context.getTargetPos() != null && 
               isNearVillage(world, context.getTargetPos());
    }
    
    @Override
    @Nullable
    public Entity spawn(
        ServerWorld world,
        GroupEntityView groupEntityView,
        BlockPos pos
    ) {
        // 生成猫实体
        CatEntity cat = new CatEntity(EntityType.CAT, world);
        cat.initialize(world, world.getLocalDifficulty(pos), 
            SpawnReason.NATURAL, null);
        cat.setPos(pos.getX(), pos.getY(), pos.getZ());
        
        return world.spawnEntity(cat) ? cat : null;
    }
}
```

### Phantom 生成

```java
// PhantomSpawner.java
public class PhantomSpawner implements SpecialSpawner {
    @Override
    public int getWeight(ServerWorld world, boolean skipped) {
        // 只有玩家在高空飞行时生成
        if (!hasPlayerInSky(world)) {
            return 0;
        }
        return 5;
    }
    
    @Override
    public boolean canSpawn(ServerWorld world, SpawnContext context) {
        // 检查是否有玩家在空中
        return hasPlayerAboveHeight(world, context.getTargetPos(), 40);
    }
}
```

### Patrol 生成

```java
// PatrolSpawner.java
public class PatrolSpawner implements SpecialSpawner {
    @Override
    public int getWeight(ServerWorld world, boolean skipped) {
        // 困难模式更容易生成巡逻队
        return world.getDifficulty() == Difficulty.HARD ? 5 : 0;
    }
    
    @Override
    public boolean canSpawn(ServerWorld world, SpawnContext context) {
        // 巡逻队只在夜晚生成
        return world.isNight() && 
               !isNearVillage(world, context.getTargetPos());
    }
}
```

## Mermaid 图表：自然生成流程

```mermaid
flowchart TD
    A["每 tick"] --> B{"区块已加载?"}
    
    B -->|"否| End["结束"]
    B -->|"是| C["获取生成配额"]
    
    C --> D{"配额未满?"}
    D -->|"满| End
    D -->|"未满| E["按群组处理"]
    
    E --> F{"遍历 SpawnGroup"}
    F -->|MONSTER| G["检查怪物生成"]
    F -->|CREATURE| H["检查动物生成"]
    F -->|AMBIENT| I["检查环境生成"]
    
    G --> J["位置检查"]
    H --> J
    I --> J
    
    J --> K{"亮度足够?"}
    J --> L{"距离足够?"}
    
    K -->|"否| M["跳过"]
    L -->|"否| M
    
    K -->|"是| N{"密度未满?"}
    L -->|"是| N
    
    N -->|"否| M
    N -->|"是| O["生成实体"]
    O --> P["成功?"}
    
    P -->|"是| F
    P -->|"否| F
    M --> F
    
    F -->|"遍历完成| End
```

## 8. 刷怪笼（Mob Spawner）

### 区块方块刷怪笼

```java
// MobSpawnerBlockEntity.java
public class MobSpawnerBlockEntity extends BlockEntity {
    private final MobSpawnerLogic logic = new MobSpawnerLogic(this);
    
    @Override
    public void tick() {
        this.logic.serverTick(this.getWorld(), this.getPos());
    }
}

// MobSpawnerLogic.java
public class MobSpawnerLogic {
    private EntityLike entityData;  // 要生成的实体类型
    private int delay = 20;         // 生成延迟
    private int minSpawnDelay = 200; // 最小延迟
    private int maxSpawnDelay = 800; // 最大延迟
    private int spawnCount = 4;      // 每次生成数量
    
    public void serverTick(World world, BlockPos pos) {
        if (--this.delay > 0) {
            return;
        }
        
        // 生成实体
        this.spawnEntities();
        
        // 重置延迟
        this.delay = this.minSpawnDelay + 
            world.getRandom().nextInt(this.maxSpawnDelay - this.minSpawnDelay);
    }
    
    private void spawnEntities() {
        for (int i = 0; i < this.spawnCount; i++) {
            // 选择随机位置（刷怪笼周围）
            BlockPos spawnPos = this.getRandomPos();
            
            // 尝试生成
            if (this.trySpawn(spawnPos)) {
                break;  // 成功则停止
            }
        }
    }
}
```

## 实战演示：创建自定义生成规则

### 1. 注册生成限制

```java
// ModEntities.java
public class MyModEntities {
    
    public static final EntityType<MyMonsterEntity> MY_MONSTER = 
        EntityType.Builder.create(MyMonsterEntity::new, SpawnGroup.MONSTER)
            .dimensions(0.6f, 1.95f)
            .maxTrackingRange(64)
            .build("my_monster");
    
    public static void registerSpawnRestrictions() {
        SpawnRestriction.register(
            MY_MONSTER,
            SpawnRestriction.Location.ON_GROUND,
            Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
            MyMonsterEntity::canSpawn
        );
    }
}
```

### 2. 定义生成条件

```java
// MyMonsterEntity.java
public class MyMonsterEntity extends HostileEntity {
    
    // 生成条件检查
    public static boolean canSpawn(
        EntityType<MyMonsterEntity> type,
        ServerWorld world,
        HostileEntity.HostileSpawningData data,
        SpawnReason reason,
        BlockPos pos
    ) {
        // 1. 检查基础条件
        if (!MobEntity.canMobSpawn(type, world, reason, pos, data)) {
            return false;
        }
        
        // 2. 只在黑暗中生成
        if (world.getLightLevel(pos) > 7) {
            return false;
        }
        
        // 3. 只在地狱生物群系生成
        if (world.getBiome(pos).getKey() != Registries.BIOME.getKey(Biomes.NETHER_WASTES)) {
            return false;
        }
        
        return true;
    }
}
```

### 3. 添加到生物群系

```json
// data/mymod/worldgen/biome/my_biome.json
{
    "spawners": {
        "monster": [
            {
                "type": "mymod:my_monster",
                "weight": 10,
                "minCount": 1,
                "maxCount": 3
            }
        ]
    }
}
```

## 课后自查

完成本章学习后，你应该能够：

- [ ] 解释 Minecraft 生成系统的架构
- [ ] 理解 SpawnGroup 的作用
- [ ] 掌握 SpawnHelper 的生成流程
- [ ] 知道 SpawnRestriction 的使用方法
- [ ] 理解 SpawnSettings 生物群系配置
- [ ] 了解特殊生成器的工作原理
- [ ] 能够创建自定义生成规则

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 生成组 | SpawnGroup | 生物的分类（怪物、动物等） |
| 生成助手 | SpawnHelper | 处理自然生成的系统 |
| 生成限制 | SpawnRestriction | 定义生物生成的条件 |
| 密度上限 | Density Cap | 限制某类型实体的最大数量 |
| 生物群系设置 | SpawnSettings | 生物群系中各生物的生成配置 |
| 特殊生成器 | SpecialSpawner | 处理特殊生物的生成逻辑 |

---

**参考源码路径**：

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\SpawnHelper.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\SpawnRestriction.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\world\spawner\SpawnDensityCapper.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\world\spawner\Spawner.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\world\spawner\cat\CatSpawner.java`
