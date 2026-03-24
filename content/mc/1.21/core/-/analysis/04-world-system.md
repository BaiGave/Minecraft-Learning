# Minecraft 1.21 世界系统深度分析

## 1. 系统架构概述

Minecraft 的世界系统是游戏的核心子系统，负责管理所有的空间数据、方块状态、物理模拟和环境计算。1.21 版本的世界系统建立在模块化架构之上，通过清晰的接口定义实现高度解耦。

### 1.1 核心架构组件

```
┌─────────────────────────────────────────────────────────────────────┐
│                           World Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Server    │  │   Client    │  │   Debug     │  │   Flat     │ │
│  │   World     │  │   World     │  │   World     │  │   World    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        World Core (Abstract)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ ChunkManager │ │ EntityLookup │ │  TickManager │ │WorldBorder  │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                         Data Layer                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │    Chunk     │ │  BlockState  │ │  BlockEntity │ │   Heightmap │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      Generation Layer                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ChunkGenerator│ │   Biome     │ │  Structures  │ │  Features   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 包结构

```
net.minecraft.world/
├── biome/           - 生物群系定义、温度、降水、生成设置
├── block/           - 方块与世界的交互（邻居更新、状态变化）
├── border/          - 世界边界管理
├── chunk/           - 区块数据结构、加载、保存
├── dimension/       - 维度类型定义
├── entity/          - 实体与世界的关联
├── event/           - 游戏事件系统
├── explosion/       - 爆炸模拟
├── gen/             - 世界生成（地形、噪声、特征）
├── level/           - 级别属性和难度
├── poi/             - 村民兴趣点
├── spawner/         - 生物生成逻辑
├── storage/         - 世界保存和加载
├── tick/            - Tick调度系统
├── timer/           - 游戏时间系统
├── updater/         - 状态更新系统
└── World.java       - 核心世界类
```

---

## 2. 核心类分析

### 2.1 World 类 (`net.minecraft.world.World`)

`World` 是整个世界系统的核心抽象类，定义了对世界的所有基本操作。

```java
90:92:World.java
public abstract class World
    implements WorldAccess,
               AutoCloseable {
```

#### 2.1.1 核心字段

```java
// 世界标识
public static final RegistryKey<World> OVERWORLD = RegistryKey.of(RegistryKeys.WORLD, Identifier.ofVanilla("overworld"));
public static final RegistryKey<World> NETHER = RegistryKey.of(RegistryKeys.WORLD, Identifier.ofVanilla("the_nether"));
public static final RegistryKey<World> END = RegistryKey.of(RegistryKeys.WORLD, Identifier.ofVanilla("the_end"));

// 坐标边界
public static final int HORIZONTAL_LIMIT = 30000000;  // X/Z 轴限制
public static final int MAX_Y = 20000000;             // 最大高度
public static final int MIN_Y = -20000000;             // 最小高度
public static final int MAX_UPDATE_DEPTH = 512;        // 最大更新深度

// 世界属性
protected final MutableWorldProperties properties;
protected final RegistryEntry<DimensionType> dimensionEntry;
protected final WorldBorder border;
protected final BiomeAccess biomeAccess;
protected final RegistryKey<World> registryKey;
protected final DamageSources damageSources;

// 区块相关
protected int lcgBlockSeed = Random.create().nextInt();  // 随机数种子
protected int lcgBlockSeedIncrement = 1013904223;

// 天气系统
protected float rainGradientPrev;
protected float rainGradient;
protected float thunderGradientPrev;
protected float thunderGradient;

// 客户端/服务端标识
public final boolean isClient;

// 区块实体Tick调度
protected final List<BlockEntityTickInvoker> blockEntityTickers;
protected final List<BlockEntityTickInvoker> pendingBlockEntityTickers;
```

#### 2.1.2 坐标验证

```java
183:185:World.java
public boolean isInBuildLimit(BlockPos pos) {
    return !this.isOutOfHeightLimit(pos) && World.isValidHorizontally(pos);
}

203:205:World.java
public static boolean isValid(BlockPos pos) {
    return !World.isInvalidVertically(pos.getY()) && World.isValidHorizontally(pos);
}

207:209:World.java
private static boolean isValidHorizontally(BlockPos pos) {
    return pos.getX() >= -30000000 && pos.getZ() >= -30000000 && pos.getX() < 30000000 && pos.getZ() < 30000000;
}

211:213:World.java
private static boolean isInvalidVertically(int y) {
    return y < -20000000 || y >= 20000000;
}
```

**坐标系统说明**：
- 水平范围：`-30,000,000` 到 `+30,000,000`（不包括）
- 垂直范围：`-20,000,000` 到 `+20,000,000`（不包括）
- 有效区块坐标：X/Z 约 -1875 到 +1874（共3750个区块宽度）

#### 2.1.3 区块访问

```java
218:235:World.java
public WorldChunk getWorldChunk(BlockPos pos) {
    return this.getChunk(ChunkSectionPos.getSectionCoord(pos.getX()), 
                         ChunkSectionPos.getSectionCoord(pos.getZ()));
}

@Override
public WorldChunk getChunk(int i, int j) {
    return (WorldChunk)this.getChunk(i, j, ChunkStatus.FULL);
}

@Override
@Nullable
public Chunk getChunk(int chunkX, int chunkZ, ChunkStatus leastStatus, boolean create) {
    Chunk chunk = this.getChunkManager().getChunk(chunkX, chunkZ, leastStatus, create);
    if (chunk == null && create) {
        throw new IllegalStateException("Should always be able to create a chunk!");
    }
    return chunk;
}
```

#### 2.1.4 方块操作

```java
238:279:World.java
@Override
public boolean setBlockState(BlockPos pos, BlockState state, int flags) {
    return this.setBlockState(pos, state, flags, 512);
}

@Override
public boolean setBlockState(BlockPos pos, BlockState state, int flags, int maxUpdateDepth) {
    if (this.isOutOfHeightLimit(pos)) {
        return false;
    }
    if (!this.isClient && this.isDebugWorld()) {
        return false;
    }
    WorldChunk worldChunk = this.getWorldChunk(pos);
    Block block = state.getBlock();
    BlockState blockState = worldChunk.setBlockState(pos, state, (flags & Block.MOVED) != 0);
    
    if (blockState != null) {
        BlockState blockState2 = this.getBlockState(pos);
        if (blockState2 == state) {
            // 触发方块事件
            if ((flags & Block.NOTIFY_LISTENERS) != 0) {
                this.updateListeners(pos, blockState, state, flags);
            }
            if ((flags & Block.NOTIFY_NEIGHBORS) != 0) {
                this.updateNeighbors(pos, blockState.getBlock());
            }
            // 递归更新邻居
            if ((flags & Block.FORCE_STATE) == 0 && maxUpdateDepth > 0) {
                blockState.prepare(this, pos, i, maxUpdateDepth - 1);
                state.updateNeighbors(this, pos, i, maxUpdateDepth - 1);
            }
        }
        return true;
    }
    return false;
}
```

**方块标志位**：
- `Block.MOVED` - 方块被移动（如活塞）
- `Block.NOTIFY_LISTENERS` - 通知监听器
- `Block.NOTIFY_NEIGHBORS` - 通知邻居方块
- `Block.FORCE_STATE` - 强制设置状态，跳过递归
- `Block.SKIP_DROPS` - 跳过掉落物生成
- `Block.NO_REDRAW` - 不触发重绘

#### 2.1.5 区块实体管理

```java
607:630:World.java
@Override
@Nullable
public BlockEntity getBlockEntity(BlockPos pos) {
    if (this.isOutOfHeightLimit(pos)) {
        return null;
    }
    if (!this.isClient && Thread.currentThread() != this.thread) {
        return null;
    }
    return this.getWorldChunk(pos).getBlockEntity(pos, WorldChunk.CreationType.IMMEDIATE);
}

public void addBlockEntity(BlockEntity blockEntity) {
    BlockPos blockPos = blockEntity.getPos();
    if (this.isOutOfHeightLimit(blockPos)) {
        return;
    }
    this.getWorldChunk(blockPos).addBlockEntity(blockEntity);
}

public void removeBlockEntity(BlockPos pos) {
    if (this.isOutOfHeightLimit(pos)) {
        return;
    }
    this.getWorldChunk(pos).removeBlockEntity(pos);
}
```

#### 2.1.6 爆炸系统

```java
575:597:World.java
public Explosion createExplosion(@Nullable Entity entity, @Nullable DamageSource damageSource,
    @Nullable ExplosionBehavior behavior, double x, double y, double z, float power,
    boolean createFire, ExplosionSourceType explosionSourceType, boolean particles,
    ParticleEffect particle, ParticleEffect emitterParticle, RegistryEntry<SoundEvent> soundEvent) {
    
    // 根据爆炸源类型决定破坏方式
    Explosion.DestructionType destructionType = switch (explosionSourceType.ordinal()) {
        case 0 -> Explosion.DestructionType.KEEP;  // NONE
        case 1 -> this.getDestructionType(GameRules.BLOCK_EXPLOSION_DROP_DECAY);  // BLOCK
        case 2 -> {  // MOB
            if (this.getGameRules().getBoolean(GameRules.DO_MOB_GRIEFING)) {
                yield this.getDestructionType(GameRules.MOB_EXPLOSION_DROP_DECAY);
            }
            yield Explosion.DestructionType.KEEP;
        }
        case 3 -> this.getDestructionType(GameRules.TNT_EXPLOSION_DROP_DECAY);  // TNT
        case 4 -> Explosion.DestructionType.TRIGGER_BLOCK;  // TRIGGER
    };
    
    Explosion explosion = new Explosion(this, entity, damageSource, behavior, 
                                        x, y, z, power, createFire, destructionType,
                                        particle, emitterParticle, soundEvent);
    explosion.collectBlocksAndDamageEntities();
    explosion.affectWorld(particles);
    return explosion;
}

1067:1090:World.java
public static enum ExplosionSourceType implements StringIdentifiable {
    NONE("none"),     // 无来源（如床在末地爆炸）
    BLOCK("block"),   // 方块（TNT不属于此类）
    MOB("mob"),       // 生物（如苦力怕）
    TNT("tnt"),       // TNT
    TRIGGER("trigger");  // 触发器方块
}
```

### 2.2 ChunkManager 类

`ChunkManager` 是区块管理的核心接口，提供区块的加载、保存和调度。

```java
17:20:ChunkManager.java
public abstract class ChunkManager
    implements ChunkProvider,
               AutoCloseable {
```

#### 2.2.1 核心接口

```java
@Nullable
public abstract Chunk getChunk(int var1, int var2, ChunkStatus var3, boolean var4);

public abstract void tick(BooleanSupplier var1, boolean var2);

public abstract String getDebugString();

public abstract int getLoadedChunkCount();

public abstract LightingProvider getLightingProvider();

public void setMobSpawnOptions(boolean spawnMonsters, boolean spawnAnimals);
```

---

## 3. 区块数据结构详解

### 3.1 区块架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         WorldChunk                              │
├─────────────────────────────────────────────────────────────────┤
│  ChunkPos pos                    - 区块坐标                      │
│  ChunkSection[] sectionArray     - 区块截面数组                   │
│  Map<Heightmap.Type, Heightmap>  - 高度图映射                     │
│  Map<BlockPos, BlockEntity>      - 方块实体映射                   │
│  ChunkTickScheduler<Block>       - 方块Tick调度器                 │
│  ChunkTickScheduler<Fluid>       - 流体Tick调度器                  │
│  Int2ObjectMap<GameEventDispatcher>  - 游戏事件调度器              │
├─────────────────────────────────────────────────────────────────┤
│                         ChunkSection                             │
├─────────────────────────────────────────────────────────────────┤
│  PalettedContainer<BlockState>    - 方块状态容器（调色板压缩）     │
│  PalettedContainer<Biome>        - 生物群系容器                   │
│  ChunkNibbleArray skyLight        - 天空光照                      │
│  ChunkNibbleArray blockLight      - 方块光照                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 WorldChunk 类

```java
62:112:WorldChunk.java
public class WorldChunk extends Chunk {
    private final Map<BlockPos, WrappedBlockEntityTickInvoker> blockEntityTickers;
    private boolean loadedToWorld;
    final World world;
    
    @Nullable
    private Supplier<ChunkLevelType> levelTypeProvider;
    @Nullable
    private EntityLoader entityLoader;
    private final Int2ObjectMap<GameEventDispatcher> gameEventDispatchers;
    private final ChunkTickScheduler<Block> blockTickScheduler;
    private final ChunkTickScheduler<Fluid> fluidTickScheduler;
```

#### 3.2.1 方块状态操作

```java
160:187:WorldChunk.java
@Override
public BlockState getBlockState(BlockPos pos) {
    int i = pos.getX();
    int j = pos.getY();
    int k = pos.getZ();
    
    if (this.world.isDebugWorld()) {
        // 调试世界的特殊处理
        BlockState blockState = null;
        if (j == 60) {
            blockState = Blocks.BARRIER.getDefaultState();
        }
        if (j == 70) {
            blockState = DebugChunkGenerator.getBlockState(i, k);
        }
        return blockState == null ? Blocks.AIR.getDefaultState() : blockState;
    }
    
    try {
        ChunkSection chunkSection;
        int l = this.getSectionIndex(j);
        if (l >= 0 && l < this.sectionArray.length && !(chunkSection = this.sectionArray[l]).isEmpty()) {
            return chunkSection.getBlockState(i & 0xF, j & 0xF, k & 0xF);
        }
        return Blocks.AIR.getDefaultState();
    } catch (Throwable throwable) {
        // 错误处理...
    }
}
```

#### 3.2.2 方块状态设置

```java
210:269:WorldChunk.java
@Override
@Deprecated
public BlockState setBlockState(BlockPos pos, BlockState state, boolean moved) {
    int l, k, j = pos.getY();
    ChunkSection chunkSection = this.getSection(this.getSectionIndex(j));
    boolean bl = chunkSection.isEmpty();
    
    if (bl && state.isAir()) {
        return null;
    }
    
    int j1 = pos.getX() & 0xF;
    BlockState blockState = chunkSection.setBlockState(j1, k = i & 0xF, l = pos.getZ() & 0xF, state);
    
    if (blockState == state) {
        return null;
    }
    
    // 更新高度图
    ((Heightmap)this.heightmaps.get(Heightmap.Type.MOTION_BLOCKING)).trackUpdate(j1, i, l, state);
    ((Heightmap)this.heightmaps.get(Heightmap.Type.MOTION_BLOCKING_NO_LEAVES)).trackUpdate(j1, i, l, state);
    ((Heightmap)this.heightmaps.get(Heightmap.Type.OCEAN_FLOOR)).trackUpdate(j1, i, l, state);
    ((Heightmap)this.heightmaps.get(Heightmap.Type.WORLD_SURFACE)).trackUpdate(j1, i, l, state);
    
    // 光照更新
    boolean bl2 = chunkSection.isEmpty();
    if (bl != bl2) {
        this.world.getChunkManager().getLightingProvider().setSectionStatus(pos, bl2);
    }
    if (ChunkLightProvider.needsLightUpdate(this, pos, blockState, state)) {
        // 天空光照更新...
        this.chunkSkyLight.isSkyLightAccessible(this, j1, i, l);
        this.world.getChunkManager().getLightingProvider().checkBlock(pos);
    }
    
    // 方块实体处理
    if (!chunkSection.getBlockState(j1, k, l).isOf(block)) {
        return null;
    }
    if (state.hasBlockEntity()) {
        BlockEntity blockEntity = this.getBlockEntity(pos, CreationType.CHECK);
        if (blockEntity == null) {
            blockEntity = ((BlockEntityProvider)block).createBlockEntity(pos, state);
            if (blockEntity != null) {
                this.addBlockEntity(blockEntity);
            }
        }
    }
    
    this.needsSaving = true;
    return blockState;
}
```

### 3.3 调色板系统 (PalettedContainer)

Minecraft 使用**调色板压缩**来存储区块数据，显著减少内存占用。

```java
// 调色板类型
public interface Palette<T> {
    int getIndex(T object);
    T get(int index);
    void read(DataBitsReader reader);
    void write(DataBitsWriter writer);
}

// 单值调色板（所有方块相同）
public class SingularPalette<T> implements Palette<T> {
    private final T value;
}

// ID列表调色板
public class IdListPalette<T> implements Palette<T> {
    private final ArrayList<T> entries;
}

// BiMap调色板（双向映射）
public class BiMapPalette<T> implements Palette<T> {
    private final Int2ObjectMap<T> entries;
    private final Object2IntMap<T> idMap;
}

// 数组调色板
public class ArrayPalette<T> implements Palette<T> {
    private final T[] entries;
}
```

---

## 4. 高度图系统 (Heightmap)

### 4.1 Heightmap 类型

```java
public enum Type {
    MOTION_BLOCKING,       // 阻挡运动的最高点（含液体）
    MOTION_BLOCKING_NO_LEAVES,  // 不含树叶
    OCEAN_FLOOR,           // 海洋底部（不含生物）
    WORLD_SURFACE;         // 世界表面（空气与固体交界）
}
```

### 4.2 高度图数据结构

```java
// Heightmap 存储为 long[] 数组
// 每个条目存储一个柱的Y坐标
// 使用前导零计数(LZC)编码压缩

public class Heightmap {
    private final Chunk getChunk();
    private final Type type;
    private final Long2ObjectMap<Heightmap> child;
    private final long[] data;
    
    public int getHeight(int x, int z) {
        return this.data[index(x, z)] & 0xFFFFFFL;
    }
    
    public void trackUpdate(int x, int y, int z, BlockState state) {
        int i = index(x, z);
        if (y > (int)(this.data[i] & 0xFFFFFFL)) {
            if (this.accepts(state)) {
                this.data[i] = y + (this.data[i] & 0xFF000000L);
            }
        }
    }
}
```

---

## 5. 生物群系系统 (Biome)

### 5.1 Biome 类结构

```java
45:75:Biome.java
public final class Biome {
    private final Weather weather;
    private final GenerationSettings generationSettings;
    private final SpawnSettings spawnSettings;
    private final BiomeEffects effects;
    private final ThreadLocal<Long2FloatLinkedOpenHashMap> temperatureCache;
}
```

#### 5.1.1 天气配置

```java
231:233:Biome.java
record Weather(boolean hasPrecipitation, float temperature, 
               TemperatureModifier temperatureModifier, float downfall) {
}
```

#### 5.1.2 温度计算

```java
96:119:Biome.java
private float computeTemperature(BlockPos pos) {
    float f = this.weather.temperatureModifier.getModifiedTemperature(pos, this.getTemperature());
    if (pos.getY() > 80) {
        float g = (float)(TEMPERATURE_NOISE.sample(
            (float)pos.getX() / 8.0f, (float)pos.getZ() / 8.0f, false) * 8.0);
        return f - (g + (float)pos.getY() - 80.0f) * 0.05f / 40.0f;
    }
    return f;
}

@Deprecated
private float getTemperature(BlockPos blockPos) {
    long l = blockPos.asLong();
    Long2FloatLinkedOpenHashMap long2FloatLinkedOpenHashMap = this.temperatureCache.get();
    float f = long2FloatLinkedOpenHashMap.get(l);
    if (!Float.isNaN(f)) {
        return f;
    }
    float g = this.computeTemperature(blockPos);
    if (long2FloatLinkedOpenHashMap.size() == 1024) {
        long2FloatLinkedOpenHashMap.removeFirstFloat();
    }
    long2FloatLinkedOpenHashMap.put(l, g);
    return g;
}
```

#### 5.1.3 温度修饰符

```java
258:304:Biome.java
public static enum TemperatureModifier implements StringIdentifiable {
    NONE("none") {
        @Override
        public float getModifiedTemperature(BlockPos pos, float temperature) {
            return temperature;
        }
    },
    FROZEN("frozen") {
        @Override
        public float getModifiedTemperature(BlockPos pos, float temperature) {
            double d = FROZEN_OCEAN_NOISE.sample(pos.getX() * 0.05, pos.getZ() * 0.05, false) * 7.0;
            double e = d + FOLIAGE_NOISE.sample(pos.getX() * 0.2, pos.getZ() * 0.2, false);
            if (e < 0.3 && FOLIAGE_NOISE.sample(pos.getX() * 0.09, pos.getZ() * 0.09, false) < 0.8) {
                return 0.2f;
            }
            return temperature;
        }
    };
}
```

### 5.2 生物群系效果

```java
public final class BiomeEffects {
    private final int skyColor;
    private final int fogColor;
    private final int waterColor;
    private final int waterFogColor;
    private final Optional<Integer> grassColor;
    private final Optional<Integer> foliageColor;
    private final GrassColorModifier grassColorModifier;
    private final Optional<BiomeParticleConfig> particleConfig;
    private final Optional<RegistryEntry<SoundEvent>> loopSound;
    private final Optional<BiomeMoodSound> moodSound;
    private final Optional<BiomeAdditionsSound> additionsSound;
    private final Optional<MusicSound> music;
}
```

---

## 6. 世界生成系统

### 6.1 ChunkGenerator 架构

```java
90:104:ChunkGenerator.java
public abstract class ChunkGenerator {
    protected final BiomeSource biomeSource;
    private final Supplier<List<PlacedFeatureIndexer.IndexedFeatures>> indexedFeaturesListSupplier;
    private final Function<RegistryEntry<Biome>, GenerationSettings> generationSettingsGetter;
    
    public ChunkGenerator(BiomeSource biomeSource) {
        this(biomeSource, biomeEntry -> biomeEntry.value().getGenerationSettings());
    }
}
```

#### 6.1.1 特征生成

```java
262:339:ChunkGenerator.java
public void generateFeatures(StructureWorldAccess world, Chunk chunk, 
                             StructureAccessor structureAccessor) {
    ChunkPos chunkPos = chunk.getPos();
    if (SharedConstants.isOutsideGenerationArea(chunkPos)) {
        return;
    }
    
    // 设置随机种子
    ChunkRandom chunkRandom = new ChunkRandom(new Xoroshiro128PlusPlusRandom(RandomSeed.getSeed()));
    long l = chunkRandom.setPopulationSeed(world.getSeed(), blockPos.getX(), blockPos.getZ());
    
    // 按生成步骤执行
    for (int k = 0; k < j; ++k) {
        // 1. 生成结构
        if (structureAccessor.shouldGenerateStructures()) {
            List<Structure> structures = map.getOrDefault(k, Collections.emptyList());
            for (Structure structure : structures) {
                chunkRandom.setDecoratorSeed(l, m, k);
                structureAccessor.getStructureStarts(chunkSectionPos, structure)
                    .forEach(start -> start.place(world, structureAccessor, this, 
                                                  chunkRandom, blockBox, chunkPos));
            }
        }
        
        // 2. 生成特征
        List<PlacedFeatureIndexer.IndexedFeatures> indexedFeatures = list.get(k);
        for (RegistryEntry<Biome> biome : set) {
            List<RegistryEntryList<PlacedFeature>> features = 
                generationSettingsGetter.apply(biome).getFeatures();
            if (k < features.size()) {
                for (PlacedFeature feature : features.get(k)) {
                    chunkRandom.setDecoratorSeed(l, p, k);
                    feature.generate(world, this, chunkRandom, blockPos);
                }
            }
        }
    }
}
```

### 6.2 地形噪声生成

```java
public abstract class NoiseChunkGenerator extends ChunkGenerator {
    public abstract CompletableFuture<Chunk> populateNoise(Blender blender, NoiseConfig noiseConfig,
                                                           StructureAccessor structureAccessor, 
                                                           Chunk chunk);
    
    public abstract int getHeight(int x, int z, Heightmap.Type type, 
                                  HeightlimitView world, NoiseConfig noiseConfig);
}
```

#### 6.2.1 噪声填充实现

```java
274:335:NoiseChunkGenerator.java
private Chunk populateNoise(Blender blender, NoiseConfig noiseConfig,
                            StructureAccessor structureAccessor, Chunk chunk) {
    ChunkNoiseSampler chunkNoiseSampler = chunk.getOrCreateChunkNoiseSampler(
        chunkx -> this.createChunkNoiseSampler(chunkx, noiseConfig, structureAccessor, blender));
    
    chunkNoiseSampler.sampleStartDensity();
    
    // 遍历区块内的每个位置
    for (int o = 0; o < 16/k; ++o) {
        chunkNoiseSampler.sampleEndDensity(o);
        
        for (int p = 0; p < 16/k; ++p) {
            for (int r = cellHeight - 1; r >= 0; --r) {
                chunkNoiseSampler.onSampledCellCorners(r, p);
                
                for (int s = l - 1; s >= 0; --s) {
                    // 采样噪声值
                    BlockState blockState = chunkNoiseSampler.sampleBlockState();
                    
                    // 如果噪声值低于阈值，放置空气
                    if (blockState == null) {
                        blockState = this.settings.value().defaultBlock();
                    }
                    
                    // 设置方块
                    chunkSection.setBlockState(y, u, ab, blockState, false);
                    
                    // 更新高度图
                    heightmap.trackUpdate(y, t, ab, blockState);
                    heightmap2.trackUpdate(y, t, ab, blockState);
                }
            }
        }
    }
    
    return chunk;
}
```

---

## 7. Tick 调度系统

### 7.1 TickManager

```java
public abstract class TickManager {
    public abstract boolean shouldTick();
    public abstract void schedule(Runnable runnable);
}
```

### 7.2 区块Tick调度

```java
512:520:WorldChunk.java
public void disableTickSchedulers(long time) {
    this.blockTickScheduler.disable(time);
    this.fluidTickScheduler.disable(time);
}

public void addChunkTickSchedulers(ServerWorld world) {
    ((WorldTickScheduler)world.getBlockTickScheduler())
        .addChunkTickScheduler(this.pos, this.blockTickScheduler);
    ((WorldTickScheduler)world.getFluidTickScheduler())
        .addChunkTickScheduler(this.pos, this.fluidTickScheduler);
}
```

---

## 8. 光照系统

### 8.1 LightingProvider

```java
public class LightingProvider {
    private final ChunkProvider chunkProvider;
    private final LightType[] types;
    private final ChunkLightProvider[] lightProviders;
    
    public void checkBlock(BlockPos pos) {
        this.checkBlock(pos, LightType.SKY);
        this.checkBlock(pos, LightType.BLOCK);
    }
    
    public void setSectionStatus(BlockPos pos, boolean isEmpty) {
        // 通知光照提供者区块状态变化
    }
}
```

### 8.2 光照计算

```java
// 天空光照：从最高点向下传播
// 方块光照：从光源向外衰减
public int getLight(LightType type, BlockPos pos) {
    if (pos.getY() < world.getBottomY() || pos.getY() >= world.getTopY()) {
        return type == LightType.SKY ? 15 : 0;
    }
    // 光照值 = min(天空光照 + 方块光照, 15)
}
```

---

## 9. 关键算法和流程

### 9.1 区块加载流程

```
请求区块坐标 (chunkX, chunkZ)
         │
         ▼
┌────────────────────────┐
│ ChunkManager.getChunk() │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│   检查缓存/已加载区块    │
└────────────────────────┘
         │
    ┌────┴────┐
    │ 存在?   │
    └────┬────┘
    Yes  │  No
    ┌────┴────────────────┐
    │ 返回缓存区块        │──▶ 返回加载的区块
    └────────────────────┘
    │
    ▼ No
┌────────────────────────┐
│ 检查是否为生成中的区块  │
└────────────────────────┘
         │
    ┌────┴────┐
    │ 正在生成?│
    └────┬────┘
    Yes  │  No
    ┌────┴────────────────┐
    │ 返回进度对象/null   │──▶ 开始生成区块
    └────────────────────┘
```

### 9.2 方块更新流程

```
setBlockState() 调用
         │
         ▼
┌────────────────────────┐
│  验证坐标范围           │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  获取/创建 WorldChunk  │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  设置方块状态到截面     │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  更新高度图             │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  触发光照更新           │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  处理方块实体           │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  标记区块需要保存       │
└────────────────────────┘
         │
         ▼
    递归更新邻居方块
```

---

## 10. 系统间交互

### 10.1 世界与实体系统

```java
// World.java
public List<Entity> getOtherEntities(@Nullable Entity except, Box box, 
                                     Predicate<? super Entity> predicate) {
    this.getProfiler().visit("getEntities");
    ArrayList<Entity> list = Lists.newArrayList();
    this.getEntityLookup().forEachIntersects(box, entity -> {
        if (entity != except && predicate.test(entity)) {
            list.add(entity);
        }
    });
    return list;
}
```

### 10.2 世界与生物群系

```java
// World.java
public boolean hasRain(BlockPos pos) {
    if (!this.isRaining()) {
        return false;
    }
    if (!this.isSkyVisible(pos)) {
        return false;
    }
    if (this.getTopPosition(Heightmap.Type.MOTION_BLOCKING, pos).getY() > pos.getY()) {
        return false;
    }
    Biome biome = this.getBiome(pos).value();
    return biome.getPrecipitation(pos) == Biome.Precipitation.RAIN;
}
```

---

## 11. 性能优化机制

### 11.1 懒加载

- 区块按需加载
- 方块实体延迟创建
- 实体数据按需同步

### 11.2 缓存策略

- 温度缓存 (1024条目 LRU)
- 光照缓存
- 高度图缓存

### 11.3 多线程

- 区块生成异步执行
- 光照计算可并行
- 网络包异步发送

---

## 12. 文件结构

```
source/net/minecraft/world/
├── World.java                      # 核心世界类
├── WorldAccess.java                # 世界访问接口
├── WorldProperties.java            # 世界属性
├── MutableWorldProperties.java     # 可变世界属性
├── GameRules.java                 # 游戏规则
├── Heightmap.java                 # 高度图
├── BlockView.java                 # 方块视图接口
├── EntityView.java                # 实体视图接口
├── LocalDifficulty.java           # 区域难度
├── WorldEvents.java               # 世界事件ID
├── biome/
│   ├── Biome.java                 # 生物群系类
│   ├── BiomeEffects.java          # 生物群系效果
│   ├── BiomeKeys.java             # 生物群系键
│   ├── GenerationSettings.java    # 生成设置
│   ├── SpawnSettings.java         # 出生设置
│   └── ...
├── chunk/
│   ├── Chunk.java                 # 区块基类
│   ├── WorldChunk.java            # 完整区块
│   ├── ProtoChunk.java            # 原型区块
│   ├── ChunkProvider.java         # 区块提供者接口
│   ├── ChunkManager.java          # 区块管理器
│   ├── ChunkSection.java          # 区块截面
│   ├── PalettedContainer.java     # 调色板容器
│   └── ...
└── gen/
    ├── chunk/
    │   ├── ChunkGenerator.java     # 区块生成器
    │   ├── NoiseChunkGenerator.java # 噪声区块生成器
    │   └── ...
    ├── feature/                    # 特征（树、矿石等）
    ├── structure/                  # 结构（村庄、要塞等）
    └── ...
```

---

## 13. 总结

Minecraft 1.21 的世界系统是一个高度模块化、设计精良的系统：

1. **抽象层次清晰**：从 World 基类到 ServerWorld/ClientWorld 实现，从 ChunkManager 到具体 Chunk 实现
2. **性能优化**：调色板压缩、LRU缓存、异步加载
3. **可扩展性**：ChunkGenerator、BiomeSource 等接口支持自定义生成
4. **数据持久化**：完整的 NBT 序列化/反序列化机制
5. **光照系统**：天空光和方块光分层处理
6. **事件系统**：游戏事件机制实现方块间通信

这个系统的设计理念为 mod 开发提供了良好的扩展点，同时也确保了游戏核心的稳定性和性能。
