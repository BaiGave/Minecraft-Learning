# Minecraft 1.21 服务端模块分析

## 目录
1. [服务端架构概述](#1-服务端架构概述)
2. [主类分析 (MinecraftServer)](#2-主类分析-minecraftserver)
3. [服务器生命周期](#3-服务器生命周期)
4. [玩家管理系统 (PlayerManager)](#4-玩家管理系统-playermanager)
5. [世界管理](#5-世界管理)
6. [网络协议实现](#6-网络协议实现)
7. [整合服务器 vs 独立服务器](#7-整合服务器-vs-独立服务器)
8. [Tick 系统分析](#8-tick-系统分析)
9. [命令系统](#9-命令系统)
10. [关键代码引用](#10-关键代码引用)

---

## 1. 服务端架构概述

### 1.1 模块层次结构

```
net.minecraft.server
├── MinecraftServer.java          # 核心抽象基类
├── PlayerManager.java            # 玩家管理抽象类
├── ServerNetworkIo.java          # 网络I/O管理
├── ServerTickManager.java        # Tick管理器
├── Main.java                     # 独立服务器入口
│
├── dedicated/                    # 独立服务器模块
│   ├── MinecraftDedicatedServer.java
│   ├── DedicatedPlayerManager.java
│   ├── DedicatedServer.java
│   └── ServerPropertiesHandler.java
│
├── integrated/                   # 整合服务器模块(单人游戏)
│   ├── IntegratedServer.java
│   └── IntegratedPlayerManager.java
│
└── network/                      # 网络处理模块
    ├── ServerLoginNetworkHandler.java
    ├── ServerPlayNetworkHandler.java
    └── ServerHandshakeNetworkHandler.java
```

### 1.2 设计模式

服务端采用**模板方法模式**：

```java
// MinecraftServer.java:211-216
public abstract class MinecraftServer
extends ReentrantThreadExecutor<ServerTask>
implements QueryableServer, ChunkErrorHandler, CommandOutput, AutoCloseable
```

`MinecraftServer` 是抽象基类，定义了服务端的核心流程：

```java
// MinecraftServer.java:359
protected abstract boolean setupServer() throws IOException;  // 子类实现

// MinecraftServer.java:661
protected void runServer() {
    if (this.setupServer()) {
        while (this.running) {
            this.tick(...);
        }
    }
}
```

---

## 2. 主类分析 (MinecraftServer)

### 2.1 核心成员变量

```java
// MinecraftServer.java:235-306
public abstract class MinecraftServer {
    // 存储与会话
    protected final LevelStorage.Session session;
    protected final PlayerSaveHandler saveHandler;
    
    // 网络
    private final ServerNetworkIo networkIo;
    
    // 世界管理
    private final Map<RegistryKey<World>, ServerWorld> worlds;
    
    // 玩家管理
    private PlayerManager playerManager;
    
    // 配置状态
    private volatile boolean running = true;
    private int ticks;
    private int ticksUntilAutosave = 6000;  // 约5分钟
    
    // 性能监控
    private final long[] tickTimes = new long[100];
    private float averageTickTime;
    
    // Tick管理
    private final ServerTickManager tickManager;
    
    // 服务器线程
    private final Thread serverThread;
}
```

### 2.2 静态工厂方法

```java
// MinecraftServer.java:308-319
public static <S extends MinecraftServer> S startServer(Function<Thread, S> serverFactory) {
    AtomicReference<MinecraftServer> atomicReference = new AtomicReference<>();
    Thread thread = new Thread(() -> ((MinecraftServer)atomicReference.get()).runServer(), "Server thread");
    thread.setUncaughtExceptionHandler((thread, throwable) -> LOGGER.error("Uncaught exception", throwable));
    if (Runtime.getRuntime().availableProcessors() > 4) {
        thread.setPriority(8);  // 高优先级线程
    }
    MinecraftServer server = serverFactory.apply(thread);
    atomicReference.set(server);
    thread.start();
    return server;
}
```

**设计要点**：
- 使用 `AtomicReference` 解决线程初始化时序问题
- 服务器线程名称固定为 "Server thread"
- 多核系统上提升线程优先级到 8

### 2.3 构造与初始化

```java
// MinecraftServer.java:321-347
public MinecraftServer(Thread serverThread, LevelStorage.Session session, 
                       ResourcePackManager dataPackManager, SaveLoader saveLoader,
                       Proxy proxy, DataFixer dataFixer, ApiServices apiServices,
                       WorldGenerationProgressListenerFactory factory) {
    super("Server");
    
    this.combinedDynamicRegistries = saveLoader.combinedDynamicRegistries();
    this.saveProperties = saveLoader.saveProperties();
    
    // 验证主世界维度数据存在
    if (!this.combinedDynamicRegistries.getCombinedRegistryManager()
        .get(RegistryKeys.DIMENSION).contains(DimensionOptions.OVERWORLD)) {
        throw new IllegalStateException("Missing Overworld dimension data");
    }
    
    this.networkIo = new ServerNetworkIo(this);
    this.tickManager = new ServerTickManager(this);
    this.session = session;
    this.saveHandler = session.createSaveHandler();
    this.commandFunctionManager = new CommandFunctionManager(...);
    this.structureTemplateManager = new StructureTemplateManager(...);
}
```

---

## 3. 服务器生命周期

### 3.1 启动流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main.main()                              │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              选项解析与配置文件加载                       │    │
│  │  - server.properties                                     │    │
│  │  - eula.txt                                              │    │
│  │  - 命令行参数                                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 MinecraftServer.startServer()            │    │
│  │  - 创建服务器线程                                        │    │
│  │  - 调用 runServer()                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              setupServer() (子类实现)                    │    │
│  │  - 网络绑定                                              │    │
│  │  - 生成密钥对                                            │    │
│  │  - 加载世界                                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Tick 循环                             │    │
│  │  while (running) {                                      │    │
│  │      tick();     // 处理一个游戏刻                      │    │
│  │      wait(50ms); // 等待下一个刻                       │    │
│  │  }                                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   shutdown()                             │    │
│  │  - 保存所有数据                                          │    │
│  │  - 关闭所有连接                                         │    │
│  │  - 关闭世界                                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Tick 循环核心实现

```java
// MinecraftServer.java:661-736
protected void runServer() {
    try {
        if (this.setupServer()) {  // 初始化服务器
            this.tickStartTimeNanos = Util.getMeasuringTimeNano();
            
            while (this.running) {
                long targetTickTime;
                
                // 检测服务器过载
                if (tickManager.isSprinting() && tickManager.sprint()) {
                    targetTickTime = 0L;  // 加速模式
                } else {
                    targetTickTime = tickManager.getNanosPerTick();  // 50ms
                    
                    // 检测卡顿
                    long elapsed = Util.getMeasuringTimeNano() - tickStartTimeNanos;
                    if (elapsed > OVERLOAD_THRESHOLD_NANOS + 20L * targetTickTime) {
                        LOGGER.warn("Can't keep up! Running {}ms or {} ticks behind",
                            elapsed / TimeHelper.MILLI_IN_NANOS, elapsed / targetTickTime);
                    }
                }
                
                this.tickStartTimeNanos += targetTickTime;
                this.startTickMetrics();
                
                // 执行Tick
                this.profiler.push("tick");
                this.tick(shouldKeepTicking);
                this.profiler.swap("nextTickWait");
                
                // 等待下一个Tick
                this.waitingForNextTick = true;
                this.tickEndTimeNanos = Math.max(Util.getMeasuringTimeNano() + targetTickTime, tickStartTimeNanos);
                
                this.runTasksTillTickEnd();  // 处理异步任务
                this.profiler.pop();
                this.pushFullTickLog();
                this.endTickMetrics();
            }
        }
    } catch (Throwable e) {
        // 崩溃报告处理
        CrashReport report = createCrashReport(e);
        // 保存到 crash-reports 目录
    } finally {
        this.stopped = true;
        this.shutdown();  // 清理资源
    }
}
```

### 3.3 Tick 方法

```java
// MinecraftServer.java:887-914
public void tick(BooleanSupplier shouldKeepTicking) {
    long startTime = Util.getMeasuringTimeNano();
    ++this.ticks;
    
    this.tickManager.step();           // Tick管理器步进
    this.tickWorlds(shouldKeepTicking); // 更新所有世界
    
    // 定期更新服务器元数据
    if (startTime - lastPlayerSampleUpdate >= PLAYER_SAMPLE_UPDATE_INTERVAL_NANOS) {
        this.lastPlayerSampleUpdate = startTime;
        this.metadata = this.createMetadata();
    }
    
    // 自动保存
    --this.ticksUntilAutosave;
    if (this.ticksUntilAutosave <= 0) {
        this.ticksUntilAutosave = this.getAutosaveInterval();
        this.saveAll(true, false, false);
    }
    
    // 更新Tick时间统计
    long tickDuration = Util.getMeasuringTimeNano() - startTime;
    recentTickTimesNanos = recentTickTimesNanos - tickTimes[ticks % 100] + tickDuration;
    tickTimes[ticks % 100] = tickDuration;
    averageTickTime = averageTickTime * 0.8f + tickDuration * 0.2f;
}
```

### 3.4 世界Tick

```java
// MinecraftServer.java:967-1007
public void tickWorlds(BooleanSupplier shouldKeepTicking) {
    // 禁用所有玩家的网络刷新
    getPlayerManager().getPlayerList().forEach(player -> 
        player.networkHandler.disableFlush());
    
    // 执行数据包函数
    profiler.push("commandFunctions");
    getCommandFunctionManager().tick();
    
    // Tick所有世界
    profiler.swap("levels");
    for (ServerWorld serverWorld : this.getWorlds()) {
        profiler.push(serverWorld.toString());
        
        // 每20tick同步一次时间
        if (ticks % 20 == 0) {
            sendTimeUpdatePackets(serverWorld);
        }
        
        // 世界Tick
        serverWorld.tick(shouldKeepTicking);
        profiler.pop();
    }
    
    // 处理网络连接
    profiler.swap("connection");
    getNetworkIo().tick();
    
    // 更新玩家延迟
    profiler.swap("players");
    playerManager.updatePlayerLatency();
    
    // 发送区块数据
    profiler.swap("send chunks");
    for (ServerPlayerEntity player : playerManager.getPlayerList()) {
        player.networkHandler.chunkDataSender.sendChunkBatches(player);
        player.networkHandler.enableFlush();
    }
}
```

### 3.5 关闭流程

```java
// MinecraftServer.java:583-624
public void shutdown() {
    LOGGER.info("Stopping server");
    this.getNetworkIo().stop();        // 停止网络
    
    if (this.playerManager != null) {
        LOGGER.info("Saving players");
        this.playerManager.saveAllPlayerData();
        this.playerManager.disconnectAllPlayers();
    }
    
    LOGGER.info("Saving worlds");
    for (ServerWorld serverWorld : this.getWorlds()) {
        serverWorld.savingDisabled = false;
    }
    
    // 等待区块保存完成
    while (worlds.values().stream()
        .anyMatch(world -> world.getChunkManager().chunkLoadingManager.shouldDelayShutdown())) {
        for (ServerWorld world : worlds) {
            world.getChunkManager().removePersistentTickets();
            world.getChunkManager().tick(() -> true, false);
        }
        runTasksTillTickEnd();
    }
    
    this.save(false, true, false);    // 最终保存
    
    // 关闭所有世界
    for (ServerWorld serverWorld : this.getWorlds()) {
        serverWorld.close();
    }
    
    this.session.close();              // 关闭存储会话
}
```

---

## 4. 玩家管理系统 (PlayerManager)

### 4.1 概述

`PlayerManager` 是玩家管理的抽象基类，负责：

- 玩家列表管理
- 登录验证与过滤
- 玩家数据保存
- 权限与白名单
- 消息广播
- 统计与进度追踪

### 4.2 核心数据结构

```java
// PlayerManager.java:119-146
public abstract class PlayerManager {
    private final MinecraftServer server;
    private final List<ServerPlayerEntity> players;          // 玩家列表
    private final Map<UUID, ServerPlayerEntity> playerMap;   // UUID索引
    
    // 访问控制
    private final BannedPlayerList bannedProfiles;           // 封禁玩家
    private final BannedIpList bannedIps;                    // 封禁IP
    private final OperatorList ops;                          // OP列表
    private final Whitelist whitelist;                       // 白名单
    
    // 玩家数据
    private final Map<UUID, ServerStatHandler> statisticsMap;
    private final Map<UUID, PlayerAdvancementTracker> advancementTrackers;
    
    // 配置
    private boolean whitelistEnabled;
    private int viewDistance;
    private int simulationDistance;
}
```

### 4.3 玩家连接处理

```java
// PlayerManager.java:155-240
public void onPlayerConnect(ClientConnection connection, ServerPlayerEntity player, 
                           ConnectedClientData clientData) {
    GameProfile profile = player.getGameProfile();
    
    // 从UserCache获取/缓存玩家信息
    UserCache userCache = this.server.getUserCache();
    if (userCache != null) {
        String name = userCache.getByUuid(profile.getId())
            .map(GameProfile::getName).orElse(profile.getName());
        userCache.add(profile);
    }
    
    // 加载玩家数据
    Optional<NbtCompound> playerData = loadPlayerData(player);
    
    // 确定出生世界
    RegistryKey<World> respawnDim = playerData
        .flatMap(nbt -> DimensionType.worldFromDimensionNbt(...))
        .orElse(World.OVERWORLD);
    ServerWorld spawnWorld = server.getWorld(respawnDim) ?: server.getOverworld();
    player.setServerWorld(spawnWorld);
    
    // 创建网络处理器
    ServerPlayNetworkHandler handler = new ServerPlayNetworkHandler(
        server, connection, player, clientData);
    connection.transitionInbound(..., handler);
    
    // 发送初始数据包
    handler.sendPacket(new GameJoinS2CPacket(...));
    handler.sendPacket(new DifficultyS2CPacket(...));
    handler.sendPacket(new PlayerAbilitiesS2CPacket(...));
    handler.sendPacket(new SynchronizeRecipesS2CPacket(...));
    
    // 发送命令树
    sendCommandTree(player);
    
    // 发送记分板
    sendScoreboard(serverWorld.getScoreboard(), player);
    
    // 加入玩家列表
    this.players.add(player);
    this.playerMap.put(player.getUuid(), player);
    this.sendToAll(PlayerListS2CPacket.entryFromPlayer(List.of(player)));
    
    // 触发连接事件
    serverWorld.onPlayerConnected(player);
    bossBarManager.onPlayerConnect(player);
}
```

### 4.4 连接检查

```java
// PlayerManager.java:347-371
@Nullable
public Text checkCanJoin(SocketAddress address, GameProfile profile) {
    // 检查封禁玩家列表
    if (this.bannedProfiles.contains(profile)) {
        BannedPlayerEntry entry = bannedProfiles.get(profile);
        MutableText reason = Text.translatable("multiplayer.disconnect.banned.reason", 
            entry.getReason());
        if (entry.getExpiryDate() != null) {
            reason.append(Text.translatable("multiplayer.disconnect.banned.expiration", 
                DATE_FORMATTER.format(entry.getExpiryDate())));
        }
        return reason;
    }
    
    // 检查白名单
    if (!this.isWhitelisted(profile)) {
        return Text.translatable("multiplayer.disconnect.not_whitelisted");
    }
    
    // 检查封禁IP
    if (this.bannedIps.isBanned(address)) {
        return Text.translatable("multiplayer.disconnect.banned_ip.reason", ...);
    }
    
    // 检查服务器人数
    if (players.size() >= maxPlayers && !canBypassPlayerLimit(profile)) {
        return Text.translatable("multiplayer.disconnect.server_full");
    }
    
    return null;  // 允许加入
}
```

### 4.5 玩家重生

```java
// PlayerManager.java:394-437
public ServerPlayerEntity respawnPlayer(ServerPlayerEntity player, boolean alive, 
                                       Entity.RemovalReason reason) {
    // 获取重生目标
    TeleportTarget target = player.getRespawnTarget(alive, TeleportTarget.NO_OP);
    ServerWorld targetWorld = target.world();
    
    // 创建新玩家实体
    ServerPlayerEntity newPlayer = new ServerPlayerEntity(
        server, targetWorld, player.getGameProfile(), player.getClientOptions());
    newPlayer.networkHandler = player.networkHandler;  // 复用网络连接
    newPlayer.copyFrom(player, alive);
    newPlayer.setId(player.getId());
    
    // 设置位置
    Vec3d pos = target.pos();
    newPlayer.refreshPositionAndAngles(pos.x, pos.y, pos.z, 
        target.yaw(), target.pitch());
    
    // 发送重生包
    newPlayer.networkHandler.sendPacket(new PlayerRespawnS2CPacket(
        newPlayer.createCommonPlayerSpawnInfo(targetWorld), 
        alive ? KEEP_ATTRIBUTES : 0));
    
    // 更新列表
    this.players.remove(player);
    this.players.add(newPlayer);
    this.playerMap.put(newPlayer.getUuid(), newPlayer);
    
    return newPlayer;
}
```

### 4.6 消息广播

```java
// PlayerManager.java:683-774
public void broadcast(Text message, boolean overlay) {
    this.server.sendMessage(message);  // 发送到控制台
    for (ServerPlayerEntity player : this.players) {
        player.sendMessageToClient(message, overlay);
    }
}

// 聊天消息广播
public void broadcast(SignedMessage message, ServerPlayerEntity sender, 
                      MessageType.Parameters params) {
    // 验证消息签名
    boolean secure = verify(message);
    this.server.logChatMessage(message.getContent(), params, secure ? null : "Not Secure");
    
    SentMessage sent = SentMessage.of(message);
    for (ServerPlayerEntity player : this.players) {
        boolean shouldFilter = shouldFilterMessagesSentTo.test(player);
        player.sendChatMessage(sent, shouldFilter, params);
    }
}
```

---

## 5. 世界管理

### 5.1 世界创建

```java
// MinecraftServer.java:387-435
protected void createWorlds(WorldGenerationProgressListener listener) {
    ServerWorldProperties properties = saveProperties.getMainWorldProperties();
    boolean isDebugWorld = saveProperties.isDebugWorld();
    
    // 获取维度配置
    Registry<DimensionOptions> registry = combinedDynamicRegistries
        .getCombinedRegistryManager().get(RegistryKeys.DIMENSION);
    
    // 主世界特殊生成器
    DimensionOptions overworld = registry.get(DimensionOptions.OVERWORLD);
    ServerWorld mainWorld = new ServerWorld(
        this, workerExecutor, session, properties,
        World.OVERWORLD, overworld, listener, isDebugWorld,
        BiomeAccess.hashSeed(seed), specialSpawners, true, null);
    worlds.put(World.OVERWORLD, mainWorld);
    
    // 初始化计分板和数据命令存储
    initScoreboard(mainWorld.getPersistentStateManager());
    dataCommandStorage = new DataCommandStorage(persistentStateManager);
    
    // 设置世界边界监听器
    WorldBorder border = mainWorld.getWorldBorder();
    border.addListener(new WorldBorderListener.WorldBorderSyncer(...));
    
    // 为未初始化的世界设置出生点
    if (!serverWorldProperties.isInitialized()) {
        setupSpawn(mainWorld, serverWorldProperties, 
            generatorOptions.hasBonusChest(), isDebugWorld);
        serverWorldProperties.setInitialized(true);
    }
    
    // 创建其他维度世界(下界、末地)
    for (Entry<RegistryKey<DimensionOptions>, DimensionOptions> entry : registry.getEntrySet()) {
        if (entry.getKey() == DimensionOptions.OVERWORLD) continue;
        
        RegistryKey<World> worldKey = RegistryKey.of(RegistryKeys.WORLD, 
            entry.getKey().getValue());
        ServerWorld dimWorld = new ServerWorld(
            this, workerExecutor, session, unmodifiableProps,
            worldKey, entry.getValue(), listener, isDebugWorld,
            BiomeAccess.hashSeed(seed), ImmutableList.of(), 
            false, randomSequencesState);
        
        border.addListener(new WorldBorderListener.WorldBorderSyncer(
            dimWorld.getWorldBorder()));
        worlds.put(worldKey, dimWorld);
    }
}
```

### 5.2 出生点设置

```java
// MinecraftServer.java:437-471
private static void setupSpawn(ServerWorld world, ServerWorldProperties properties,
                               boolean bonusChest, boolean debugWorld) {
    if (debugWorld) {
        properties.setSpawnPos(BlockPos.ORIGIN.up(80), 0.0f);
        return;
    }
    
    // 找到最佳出生位置
    ChunkPos spawnChunk = new ChunkPos(
        world.getChunkManager().getNoiseConfig()
            .getMultiNoiseSampler().findBestSpawnPosition());
    
    int spawnHeight = world.getChunkManager().getChunkGenerator()
        .getSpawnHeight(world);
    if (spawnHeight < world.getBottomY()) {
        BlockPos pos = spawnChunk.getStartPos();
        spawnHeight = world.getTopY(Heightmap.Type.WORLD_SURFACE, 
            pos.getX() + 8, pos.getZ() + 8);
    }
    
    // 螺旋搜索安全位置
    int j = 0, k = 0, l = 0, m = -1;
    for (int n = 0; n < MathHelper.square(11); ++n) {
        BlockPos testPos;
        if (j >= -5 && j <= 5 && k >= -5 && k <= 5 &&
            (testPos = SpawnLocating.findServerSpawnPoint(world, 
                new ChunkPos(spawnChunk.x + j, spawnChunk.z + k))) != null) {
            properties.setSpawnPos(testPos, 0.0f);
            break;
        }
        // 螺旋路径计算
        if (j == k || (j < 0 && j == -k) || (j > 0 && j == 1 - k)) {
            int temp = l; l = -m; m = temp;
        }
        j += l; k += m;
    }
    
    // 生成奖励箱
    if (bonusChest) {
        featureRegistry.getEntry(MiscConfiguredFeatures.BONUS_CHEST)
            .ifPresent(feature -> feature.generate(...));
    }
}
```

### 5.3 准备开始区域

```java
// MinecraftServer.java:484-515
private void prepareStartRegion(WorldGenerationProgressListener listener) {
    ServerWorld overworld = getOverworld();
    BlockPos spawn = overworld.getSpawnPos();
    
    listener.start(new ChunkPos(spawn));
    
    // 等待出生点区块加载完成
    int radius = getGameRules().getInt(GameRules.SPAWN_CHUNK_RADIUS);
    int totalChunks = radius > 0 ? MathHelper.square(
        WorldGenerationProgressListener.getStartRegionSize(radius)) : 0;
    
    while (overworld.getChunkManager().getTotalChunksLoadedCount() < totalChunks) {
        tickStartTimeNanos = Util.getMeasuringTimeNano() + 
            PREPARE_START_REGION_TICK_DELAY_NANOS;
        runTasksTillTickEnd();
    }
    
    // 恢复强制加载的区块
    for (ServerWorld world : worlds.values()) {
        ForcedChunkState forced = world.getPersistentStateManager()
            .get(ForcedChunkState.getPersistentStateType(), "chunks");
        if (forced != null) {
            for (long chunkPos : forced.getChunks()) {
                world.getChunkManager().setChunkForced(
                    new ChunkPos(chunkPos), true);
            }
        }
    }
    
    listener.stop();
    updateMobSpawnOptions();
}
```

---

## 6. 网络协议实现

### 6.1 网络架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      客户端连接                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ServerHandshakeNetworkHandler                  │
│                         握手协议                                  │
│   - 协议版本检查                                                 │
│   - 状态切换 (STATUS / LOGIN / TRANSFER)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  ServerQueryNetworkHandler │     │  ServerLoginNetworkHandler │
│       状态查询            │     │       登录协议           │
│   - 服务器信息             │     │   - 离线/在线验证        │
│   - Ping测试              │     │   - 加密握手            │
└─────────────────────────┘     │   - 重复登录检测         │
                                └─────────────────────────┘
                                                  │
                                                  ▼
                                ┌─────────────────────────┐
                                │ ServerPlayNetworkHandler │
                                │       游戏协议           │
                                │   - 玩家移动同步        │
                                │   - 方块交互            │
                                │   - 物品交互            │
                                │   - 聊天消息            │
                                │   - 实体同步            │
                                └─────────────────────────┘
```

### 6.2 握手处理

```java
// ServerHandshakeNetworkHandler.java:33-75
@Override
public void onHandshake(HandshakeC2SPacket packet) {
    switch (packet.intendedState()) {
        case LOGIN:
            login(packet, false);
            break;
        case STATUS:
            // 处理服务器信息查询
            ServerMetadata metadata = server.getServerMetadata();
            connection.transitionOutbound(QueryStates.S2C);
            if (server.acceptsStatusQuery() && metadata != null) {
                connection.transitionInbound(QueryStates.C2S,
                    new ServerQueryNetworkHandler(metadata, connection));
            } else {
                connection.disconnect(IGNORING_STATUS_REQUEST_MESSAGE);
            }
            break;
        case TRANSFER:
            if (!server.acceptsTransfers()) {
                connection.disconnect(...);
            }
            login(packet, true);
            break;
    }
}

private void login(HandshakeC2SPacket packet, boolean transfer) {
    connection.transitionOutbound(LoginStates.S2C);
    
    // 协议版本检查
    if (packet.protocolVersion() != SharedConstants.getGameVersion()
        .getProtocolVersion()) {
        connection.send(new LoginDisconnectS2CPacket(
            Text.translatable("multiplayer.disconnect.outdated_client", ...)));
        connection.disconnect(text);
    } else {
        connection.transitionInbound(LoginStates.C2S,
            new ServerLoginNetworkHandler(server, connection, transfer));
    }
}
```

### 6.3 登录流程

```java
// ServerLoginNetworkHandler.java:138-237
@Override
public void onHello(LoginHelloC2SPacket packet) {
    Validate.validState(this.state == State.HELLO, "Unexpected hello packet");
    this.profileName = packet.name();
    
    // 主机玩家直接通过
    GameProfile hostProfile = server.getHostProfile();
    if (hostProfile != null && profileName.equalsIgnoreCase(hostProfile.getName())) {
        startVerify(hostProfile);
        return;
    }
    
    // 在线模式需要加密
    if (server.isOnlineMode() && !connection.isLocal()) {
        this.state = State.KEY;
        connection.send(new LoginHelloS2CPacket("",
            server.getKeyPair().getPublic().getEncoded(), nonce, true));
    } else {
        startVerify(Uuids.getOfflinePlayerProfile(profileName));
    }
}

@Override
public void onKey(LoginKeyC2SPacket packet) {
    // 验证Nonce
    PrivateKey privateKey = server.getKeyPair().getPrivate();
    if (!packet.verifySignedNonce(nonce, privateKey)) {
        throw new IllegalStateException("Protocol error");
    }
    
    // 设置加密
    SecretKey secretKey = packet.decryptSecretKey(privateKey);
    Cipher encryptCipher = NetworkEncryptionUtils.cipherFromKey(2, secretKey);
    Cipher decryptCipher = NetworkEncryptionUtils.cipherFromKey(1, secretKey);
    connection.setupEncryption(encryptCipher, decryptCipher);
    
    // 异步验证
    Thread verifier = new Thread("User Authenticator #" + nextId.incrementAndGet()) {
        @Override
        public void run() {
            ProfileResult result = server.getSessionService()
                .hasJoinedServer(playerName, serverId, clientAddress);
            
            if (result != null) {
                // 验证成功
                startVerify(result.profile());
            } else if (server.isSingleplayer()) {
                // 单人模式允许离线
                startVerify(Uuids.getOfflinePlayerProfile(playerName));
            } else {
                disconnect(Text.translatable("multiplayer.disconnect.unverified_username"));
            }
        }
    };
    verifier.start();
}
```

### 6.4 游戏玩法网络处理

```java
// ServerPlayNetworkHandler.java:266-322
@Override
public void tick() {
    // 同步玩家位置
    syncWithPlayerPosition();
    player.playerTick();
    
    // 检测飞行作弊
    if (floating && !player.isSleeping() && !player.hasVehicle() && !player.isDead()) {
        if (++floatingTicks > getMaxAllowedFloatingTicks(player)) {
            disconnect(Text.translatable("multiplayer.disconnect.flying"));
            return;
        }
    }
    
    // 基础Tick
    baseTick();
    
    // 检测闲置
    if (server.getPlayerIdleTimeout() > 0 &&
        Util.getMeasuringTimeMs() - player.getLastActionTime() > 
            server.getPlayerIdleTimeout() * 60000) {
        disconnect(Text.translatable("multiplayer.disconnect.idling"));
    }
}
```

### 6.5 网络I/O管理

```java
// ServerNetworkIo.java:73-109
public void bind(@Nullable InetAddress address, int port) throws IOException {
    EventLoopGroup group;
    Class<? extends ServerChannel> channelClass;
    
    // 选择IO模型
    if (Epoll.isAvailable() && server.isUsingNativeTransport()) {
        channelClass = EpollServerSocketChannel.class;
        group = EPOLL_CHANNEL.get();
        LOGGER.info("Using epoll channel type");
    } else {
        channelClass = NioServerSocketChannel.class;
        group = DEFAULT_CHANNEL.get();
        LOGGER.info("Using default channel type");
    }
    
    new ServerBootstrap()
        .channel(channelClass)
        .childHandler(new ChannelInitializer<Channel>() {
            @Override
            protected void initChannel(Channel ch) {
                // 设置TCP选项
                ch.config().setOption(ChannelOption.TCP_NODELAY, true);
                
                // 添加超时处理器
                ChannelPipeline pipeline = ch.pipeline()
                    .addLast("timeout", new ReadTimeoutHandler(30));
                
                // 可选的查询处理器
                if (server.acceptsStatusQuery()) {
                    pipeline.addLast("legacy_query", 
                        new LegacyQueryHandler(server));
                }
                
                // 网络压缩
                int rateLimit = server.getRateLimit();
                ClientConnection conn = rateLimit > 0 ?
                    new RateLimitedConnection(rateLimit) :
                    new ClientConnection(NetworkSide.SERVERBOUND);
                
                // 启动握手处理器
                conn.setInitialPacketListener(
                    new ServerHandshakeNetworkHandler(server, conn));
            }
        })
        .group(group)
        .localAddress(address, port)
        .bind().syncUninterruptibly();
}
```

---

## 7. 整合服务器 vs 独立服务器

### 7.1 类层次结构

```
MinecraftServer (抽象基类)
    │
    ├── IntegratedServer (整合服务器)
    │       │
    │       └── IntegratedPlayerManager
    │
    └── MinecraftDedicatedServer (独立服务器)
            │
            └── DedicatedPlayerManager
```

### 7.2 整合服务器 (IntegratedServer)

```java
// IntegratedServer.java:46-67
@Environment(EnvType.CLIENT)
public class IntegratedServer extends MinecraftServer {
    private final MinecraftClient client;
    private boolean paused = true;      // 可暂停
    private int lanPort = -1;           // LAN端口
    @Nullable private GameMode forcedGameMode;
    @Nullable private LanServerPinger lanPinger;
    
    @Override
    public boolean setupServer() {
        setOnlineMode(true);           // 在线模式
        setPvpEnabled(true);
        setFlightEnabled(true);
        generateKeyPair();
        loadWorld();
        return true;
    }
    
    @Override
    public boolean isPaused() {
        return this.paused;  // 客户端暂停时服务器也暂停
    }
    
    @Override
    public void tick(BooleanSupplier shouldKeepTicking) {
        boolean wasPaused = paused;
        paused = MinecraftClient.getInstance().isPaused();
        
        // 暂停时保存游戏
        if (!wasPaused && paused) {
            LOGGER.info("Saving and pausing game...");
            saveAll(false, false, false);
            return;
        }
        
        super.tick(shouldKeepTicking);
        
        // 动态调整视距
        int viewDist = Math.max(2, client.options.getViewDistance().getValue());
        if (viewDist != playerManager.getViewDistance()) {
            playerManager.setViewDistance(viewDist);
        }
    }
    
    @Override
    public boolean openToLan(@Nullable GameMode gameMode, boolean cheatsAllowed, int port) {
        // 打开LAN游戏
        getNetworkIo().bind(null, port);
        lanPort = port;
        lanPinger = new LanServerPinger(getServerMotd(), "" + port);
        lanPinger.start();
        return true;
    }
}
```

### 7.3 独立服务器 (MinecraftDedicatedServer)

```java
// MinecraftDedicatedServer.java:72-206
public class MinecraftDedicatedServer extends MinecraftServer 
    implements DedicatedServer {
    
    private final List<PendingServerCommand> commandQueue = 
        Collections.synchronizedList(Lists.newArrayList());
    @Nullable private QueryResponseHandler queryResponseHandler;
    @Nullable private RconListener rconServer;
    private final ServerPropertiesLoader propertiesLoader;
    private final TextFilterer filterer;
    
    @Override
    public boolean setupServer() throws IOException {
        // 启动控制台输入处理线程
        Thread consoleThread = new Thread("Server console handler") {
            @Override
            public void run() {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(System.in, StandardCharsets.UTF_8));
                while (!isStopped() && isRunning()) {
                    String line = reader.readLine();
                    if (line != null) {
                        enqueueCommand(line, getCommandSource());
                    }
                }
            }
        };
        consoleThread.setDaemon(true);
        consoleThread.start();
        
        // 加载配置
        ServerPropertiesHandler props = propertiesLoader.getPropertiesHandler();
        setOnlineMode(props.onlineMode);
        setPvpEnabled(props.pvp);
        setFlightEnabled(props.allowFlight);
        
        // 绑定网络
        InetAddress addr = serverIp.isEmpty() ? null : InetAddress.getByName(serverIp);
        getNetworkIo().bind(addr, serverPort);
        
        // 启动Watchdog
        if (getMaxTickTime() > 0) {
            Thread watchdog = new Thread(new DedicatedServerWatchdog(this));
            watchdog.setName("Server Watchdog");
            watchdog.setDaemon(true);
            watchdog.start();
        }
        
        return true;
    }
    
    @Override
    public boolean isDedicated() {
        return true;
    }
    
    @Override
    public boolean isWorldAllowed(World world) {
        // 下界可能需要单独启用
        if (world.getRegistryKey() == World.NETHER) {
            return getProperties().allowNether;
        }
        return true;
    }
}
```

### 7.4 关键差异对比

| 特性 | 整合服务器 | 独立服务器 |
|------|-----------|-----------|
| 运行环境 | 客户端内 | 独立JVM |
| 可暂停 | 是 (跟随游戏) | 否 |
| 控制台 | 无 | 有 (stdin) |
| 玩家上限 | 8 | 配置决定 |
| 出生点保护 | 无 | 有 (spawn-protection) |
| 白名单 | 无 | 有 |
| RCON | 无 | 有 |
| Query | 无 | 有 |
| GUI | 无 | 可选 (Swing) |
| Watchdog | 无 | 有 |

---

## 8. Tick 系统分析

### 8.1 ServerTickManager

```java
// ServerTickManager.java:14-122
public class ServerTickManager extends TickManager {
    private long sprintTicks = 0L;           // 加速Tick数
    private long scheduledSprintTicks = 0L;  // 计划加速数
    private boolean wasFrozen = false;       // 冻结前状态
    
    @Override
    public void setFrozen(boolean frozen) {
        super.setFrozen(frozen);
        sendUpdateTickRatePacket();  // 通知客户端
    }
    
    // 单步执行 (调试用)
    public boolean step(int ticks) {
        if (!isFrozen()) return false;
        this.stepTicks = ticks;
        sendStepPacket();
        return true;
    }
    
    // 加速模式
    public boolean startSprint(int ticks) {
        this.scheduledSprintTicks = ticks;
        this.sprintTicks = ticks;
        this.wasFrozen = isFrozen();
        setFrozen(false);
        return true;
    }
    
    // 加速Tick
    public boolean sprint() {
        if (!shouldTick) return false;
        if (sprintTicks > 0) {
            --sprintTicks;
            return true;
        }
        finishSprinting();
        return false;
    }
}
```

### 8.2 Tick同步

```java
// MinecraftServer.java:780-783
private boolean shouldKeepTicking() {
    return hasRunningTasks() || 
           Util.getMeasuringTimeNano() < 
               (waitingForNextTick ? tickEndTimeNanos : tickStartTimeNanos);
}
```

### 8.3 过载检测

```java
// MinecraftServer.java:677-682
long elapsed = Util.getMeasuringTimeNano() - tickStartTimeNanos;
if (elapsed > OVERLOAD_THRESHOLD_NANOS + 20L * targetTickTime) {
    long missedTicks = elapsed / targetTickTime;
    LOGGER.warn("Can't keep up! Running {}ms or {} ticks behind",
        elapsed / TimeHelper.MILLI_IN_NANOS, missedTicks);
    tickStartTimeNanos += missedTicks * targetTickTime;
}
```

---

## 9. 命令系统

### 9.1 命令管理器

```java
// MinecraftServer.java:1584-1586
public CommandManager getCommandManager() {
    return this.resourceManagerHolder.dataPackContents.getCommandManager();
}

// 发送命令树
public void sendCommandTree(ServerPlayerEntity player) {
    getCommandManager().sendCommandTree(player);
}
```

### 9.2 命令源

```java
// MinecraftServer.java:1591-1594
public ServerCommandSource getCommandSource() {
    ServerWorld world = getOverworld();
    return new ServerCommandSource(
        this,
        Vec3d.of(world.getSpawnPos()),
        Vec2f.ZERO,
        world,
        4,
        "Server",
        Text.literal("Server"),
        this,
        null
    );
}
```

### 9.3 独立服务器命令队列

```java
// MinecraftDedicatedServer.java:294-302
public void enqueueCommand(String command, ServerCommandSource source) {
    commandQueue.add(new PendingServerCommand(command, source));
}

public void executeQueuedCommands() {
    while (!commandQueue.isEmpty()) {
        PendingServerCommand cmd = commandQueue.remove(0);
        getCommandManager().executeWithPrefix(cmd.source, cmd.command);
    }
}

// tickWorlds中调用
@Override
public void tickWorlds(BooleanSupplier shouldKeepTicking) {
    super.tickWorlds(shouldKeepTicking);
    executeQueuedCommands();
}
```

---

## 10. 关键代码引用

### 10.1 MinecraftServer.java 关键方法

| 方法 | 行号 | 描述 |
|------|------|------|
| `startServer()` | 308-319 | 服务器启动入口 |
| `runServer()` | 661-736 | 主Tick循环 |
| `tick()` | 887-914 | 每个Tick执行 |
| `tickWorlds()` | 967-1007 | 世界Tick |
| `createWorlds()` | 387-435 | 世界创建 |
| `loadWorld()` | 361-382 | 加载世界 |
| `shutdown()` | 583-624 | 关闭服务器 |
| `save()` | 541-562 | 保存世界 |
| `saveAll()` | 567-576 | 保存所有数据 |

### 10.2 PlayerManager.java 关键方法

| 方法 | 行号 | 描述 |
|------|------|------|
| `onPlayerConnect()` | 155-240 | 处理玩家连接 |
| `checkCanJoin()` | 347-371 | 检查能否加入 |
| `respawnPlayer()` | 394-437 | 玩家重生 |
| `remove()` | 321-344 | 移除玩家 |
| `broadcast()` | 683-774 | 消息广播 |
| `saveAllPlayerData()` | 571-575 | 保存所有玩家数据 |

### 10.3 ServerLoginNetworkHandler.java 状态机

```
HELLO -> KEY (在线模式)
KEY -> AUTHENTICATING
AUTHENTICATING -> VERIFYING
VERIFYING -> WAITING_FOR_DUPE_DISCONNECT / SUCCESS
WAITING_FOR_DUPE_DISCONNECT -> SUCCESS
SUCCESS -> PROTOCOL_SWITCHING
PROTOCOL_SWITCHING -> ACCEPTED (进入配置阶段)
```

### 10.4 DedicatedPlayerManager.java 特有功能

- 白名单管理 (`setWhitelistEnabled`)
- OP管理 (`addToOperators`, `removeFromOperators`)
- 封禁列表加载/保存
- 玩家人数限制绕过检查

### 10.5 IntegratedServer.java 特有功能

- 暂停同步 (`isPaused()`)
- LAN开放 (`openToLan()`)
- 动态视距调整
- 客户端集成

---

## 附录: 数据流图

### 玩家登录流程

```
Client                    Server                      Database
  │                          │                            │
  │──── Handshake ──────────▶│                            │
  │                          │                            │
  │──── LoginHello ─────────▶│                            │
  │                          │── Online Mode? ──────────▶│
  │                          │◀── Authentication ────────│
  │◀─── LoginHello ──────────│                            │
  │                          │                            │
  │──── LoginKey ───────────▶│                            │
  │                          │── Validate ───────────────▶│
  │                          │◀── Profile ────────────────│
  │◀─── LoginSuccess ────────│                            │
  │                          │                            │
  │──── Configuration ───────▶│                            │
  │◀─── Configuration ───────│                            │
  │                          │                            │
  │──── PlayPackets ────────▶│── Load Player ────────────▶│
  │                          │◀── PlayerData ────────────│
  │◀─── GameJoin ────────────│                            │
  │◀─── Chunks/Data ─────────│                            │
```

### Tick流程

```
Server Thread
    │
    ├── startTickMetrics()
    │
    ├── tick() ──────────────▶ tickManager.step()
    │                           tickWorlds()
    │                              │
    │                              ├── PlayerManager (disable flush)
    │                              ├── CommandFunctionManager.tick()
    │                              ├── for each World:
    │                              │      World.tick()
    │                              ├── NetworkIo.tick()
    │                              ├── PlayerManager.updatePlayerLatency()
    │                              └── for each Player:
    │                                     ChunkDataSender.sendChunkBatches()
    │                                     enableFlush()
    │
    ├── waitForNextTick()
    │
    ├── runTasksTillTickEnd()
    │      └── ReentrantThreadExecutor.runTasks()
    │
    └── endTickMetrics()
```

---

*文档版本: 1.0*
*Minecraft版本: 1.21*
*生成时间: 2026-03-19*
