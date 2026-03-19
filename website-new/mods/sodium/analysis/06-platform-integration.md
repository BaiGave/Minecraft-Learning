# Sodium 平台集成机制

> Fabric 和 NeoForge 的服务加载与 Mixin 配置

## 1. 概述

Sodium 需要同时支持 Fabric 和 NeoForge 两个模组加载器。通过服务加载模式和 Mixin 配置实现平台无关的代码设计。

**核心文件**：

| 文件 | 平台 | 路径 |
|------|------|------|
| `Services` | Common | `common/.../services/Services.java` |
| `FabricBlockAccess` | Fabric | `fabric/.../FabricBlockAccess.java` |
| `NeoForgeBlockAccess` | NeoForge | `neoforge/.../NeoForgeBlockAccess.java` |
| `SodiumFabricMod` | Fabric | `fabric/.../SodiumFabricMod.java` |
| `SodiumForgeMod` | NeoForge | `neoforge/.../SodiumForgeMod.java` |

---

## 2. 服务加载模式

### 2.1 Services 类

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/services/Services.java
public class Services {
    private static final Map<Class<?>, Object> cache = new ConcurrentHashMap<>();
    
    public static <T> T load(Class<T> clazz) {
        return cache.computeIfAbsent(clazz, Services::loadInternal);
    }
    
    private static <T> T loadInternal(Class<T> clazz) {
        // 获取服务加载器
        ServiceLoader<T> loader = ServiceLoader.load(clazz, clazz.getClassLoader());
        
        // 遍历所有实现
        Iterator<T> iterator = loader.iterator();
        if (!iterator.hasNext()) {
            throw new ServiceConfigurationError("No provider for " + clazz.getName());
        }
        
        T service = iterator.next();
        
        // 检查是否有多个实现
        if (iterator.hasNext()) {
            throw new ServiceConfigurationError("Multiple providers for " + clazz.getName());
        }
        
        return service;
    }
}
```

### 2.2 服务接口定义

**PlatformBlockAccess**：

```startLine:1:60:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/services/PlatformBlockAccess.java
public interface PlatformBlockAccess {
    PlatformBlockAccess INSTANCE = Services.load(PlatformBlockAccess.class);
    
    /**
     * 获取方块的光照发射值
     */
    int getLightEmission(BlockState state, BlockAndTintGetter level, BlockPos pos);
    
    /**
     * 检查方块是否应该跳过渲染
     */
    boolean shouldSkipRender(BlockState state);
    
    /**
     * 获取方块的纹理
     */
    BlockRenderProperties getRenderProperties(BlockState state);
    
    /**
     * 检查方块是否有大型碰撞形状
     */
    boolean hasLargeCollisionShape(BlockState state);
}
```

**PlatformLevelAccess**：

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/services/PlatformLevelAccess.java
public interface PlatformLevelAccess {
    PlatformLevelAccess INSTANCE = Services.load(PlatformLevelAccess.class);
    
    /**
     * 获取世界类型标识
     */
    WorldType getWorldType(ClientWorld world);
    
    /**
     * 获取维度类型
     */
    DimensionType getDimensionType(ClientWorld world);
    
    /**
     * 检查是否是过度世界
     */
    boolean isNether(ClientWorld world);
}
```

### 2.3 服务配置文件

**Fabric META-INF/services**：

```
fabric/src/main/resources/META-INF/services/
└── net.caffeinemc.mods.sodium.client.services.PlatformBlockAccess
```

文件内容：
```
net.caffeinemc.mods.sodium.client.platform.windows.WindowsBlockAccess
# 或
net.caffeinemc.mods.sodium.client.platform.linux.LinuxBlockAccess
```

**NeoForge META-INF/services**：

```
neoforge/src/main/resources/META-INF/services/
└── net.caffeinemc.mods.sodium.client.services.PlatformBlockAccess
```

文件内容：
```
net.caffeinemc.mods.sodium.client.platform.windows.WindowsBlockAccess
```

---

## 3. Fabric 集成

### 3.1 Mod 入口

```startLine:1:80:D:/Projects/sodium/fabric/src/main/java/net/caffeinemc/mods/sodium/fabric/SodiumFabricMod.java
@Environment(EnvType.CLIENT)
public class SodiumFabricMod implements ClientModInitializer {
    private static final String MOD_ID = "sodium";
    private static String version;
    
    @Override
    public void onInitializeClient() {
        version = FabricLoader.getInstance()
            .getModContainer(MOD_ID)
            .map(ModContainer::getMetadata)
            .map(Version::getFriendlyString)
            .orElse("unknown");
        
        // 初始化核心模块
        SodiumClientMod.onInitialization(version);
        
        // 收集配置入口点
        ConfigLoaderFabric.collectConfigEntryPoints();
        
        // 注册 FRAPI
        FRAPIProvider.getInstance().register();
        
        // 注册 Flawless Frames
        FabricLoader.getInstance()
            .getEntrypoints("frex_flawless_frames", FlawlessFramesEntryPoint.class)
            .forEach(ep -> ep.accept(FlawlessFrames.getProvider()));
        
        SodiumFabricMod.LOGGER.info("Sodium initialized on Fabric");
    }
}
```

### 3.2 Fabric 特定实现

```startLine:1:80:D:/Projects/sodium/fabric/src/main/java/net/caffeinemc/mods/sodium/fabric/FabricBlockAccess.java
public class FabricBlockAccess implements PlatformBlockAccess {
    
    @Override
    public int getLightEmission(BlockState state, BlockAndTintGetter level, BlockPos pos) {
        // Fabric 实现
        return state.getLightEmission(level, pos);
    }
    
    @Override
    public boolean shouldSkipRender(BlockState state) {
        // 检查方块是否透明
        return state.isSolid() && state.getRenderShape() == RenderShape.INVISIBLE;
    }
    
    @Override
    public BlockRenderProperties getRenderProperties(BlockState state) {
        RenderShape shape = state.getRenderShape();
        return new BlockRenderProperties(
            shape == RenderShape.SOLID,
            shape == RenderShape.TRANSLUCENT,
            state.isSolid()
        );
    }
}
```

### 3.3 Fabric Mixin 配置

```json
{
  "required": true,
  "package": "net.caffeinemc.mods.sodium.mixin",
  "compatibilityLevel": "JAVA_21",
  "client": [
    "core.render.world.LevelRendererMixin",
    "core.render.world.sky.LevelSkyMixin",
    "core.render.world.clouds.CloudRendererMixin",
    "features.render.entity.EntityRendererMixin",
    "features.options.GameOptionsMixin"
  ],
  "injectors": {
    "defaultRequire": 1
  }
}
```

### 3.4 LevelRenderer Mixin

```startLine:1:100:D:/Projects/sodium/fabric/src/main/java/net/caffeinemc/mods/sodium/mixin/core/render/world/LevelRendererMixin.java
@Mixin(LevelRenderer.class)
public abstract class LevelRendererMixin implements WorldRenderer {
    
    @Shadow
    @Final
    private Minecraft client;
    
    @Inject(at = @At("HEAD"), method = "renderLevel")
    private void onRenderLevel(PoseStack matrices, 
                               float tickDelta, 
                               long limitTimeNano,
                               boolean renderBlockOutline,
                               Camera camera,
                               GameRenderer gameRenderer,
                               Matrix4f projectionMatrix,
                               CallbackInfo ci) {
        // 在渲染开始前调用 Sodium
        SodiumWorldRenderer.getInstance()
            .onRenderStarted((LevelRenderer)(Object)this, camera);
    }
    
    @Inject(at = @At("RETURN"), method = "renderLevel")
    private void onRenderLevelEnd(CallbackInfo ci) {
        // 渲染结束后清理
        SodiumWorldRenderer.getInstance().onRenderEnded();
    }
    
    @Redirect(method = "renderLevel",
              at = @At(value = "INVOKE", 
                       target = "Lnet/minecraft/client/renderer/chunk/ChunkRenderDispatcher;compileChunks()V"))
    private void redirectCompileChunks(ChunkRenderDispatcher dispatcher) {
        // 重定向到 Sodium 的异步编译
        // 原版编译被禁用
    }
}
```

---

## 4. NeoForge 集成

### 4.1 Mod 入口

```startLine:1:80:D:/Projects/sodium/neoforge/src/main/java/net/caffeinemc/mods/sodium/neoforge/SodiumForgeMod.java
@Mod(value = Sodium.MOD_ID, dist = Dist.CLIENT)
public class SodiumForgeMod {
    private static final Logger LOGGER = LogUtils.getLogger();
    
    public SodiumForgeMod(IEventBus modBus, ModContainer modContainer) {
        // 注册配置屏幕
        modContainer.registerExtensionPoint(IConfigScreenFactory.class, 
            (minecraft, parent) -> VideoSettingsScreen.createScreen(parent));
        
        // 初始化核心
        SodiumClientMod.onInitialization(modContainer.getVersion());
        
        // 注册事件处理器
        modBus.addListener(this::onClientSetup);
        
        // 注册 FRAPI
        FRAPIProvider.getInstance().register();
        
        LOGGER.info("Sodium initialized on NeoForge");
    }
    
    private void onClientSetup(FMLClientSetupEvent event) {
        event.enqueueWork(() -> {
            // 配置加载
            ConfigLoaderForge.collectConfigEntryPoints();
        });
    }
}
```

### 4.2 NeoForge 特定实现

```startLine:1:80:D:/Projects/sodium/neoforge/src/main/java/net/caffeinemc/mods/sodium/neoforge/NeoForgeBlockAccess.java
public class NeoForgeBlockAccess implements PlatformBlockAccess {
    
    @Override
    public int getLightEmission(BlockState state, BlockAndTintGetter level, BlockPos pos) {
        // NeoForge 实现
        if (state.hasEmissiveLighting(level, pos)) {
            return state.getEmissiveLight(level, pos);
        }
        return state.getLightEmission();
    }
    
    @Override
    public boolean shouldSkipRender(BlockState state) {
        // NeoForge 的跳过渲染逻辑
        return state.is(Blocks.AIR) || 
               state.getRenderShape() == VoxelShape.EMPTY;
    }
    
    @Override
    public BlockRenderProperties getRenderProperties(BlockState state) {
        VoxelShape shape = state.getOcclusionShape();
        return new BlockRenderProperties(
            !shape.isEmpty(),
            state.useNeighborBrightness(),
            state.isSolid()
        );
    }
}
```

### 4.3 NeoForge Mixin 配置

```json
{
  "required": true,
  "package": "net.caffeinemc.mods.sodium.mixin",
  "compatibilityLevel": "JAVA_21",
  "client": [
    "platform.neoforge.LevelRendererMixin",
    "platform.neoforge.GameRendererMixin",
    "platform.neoforge.LevelSliceMixin"
  ],
  "injectors": {
    "defaultRequire": 1
  }
}
```

---

## 5. Mixin 系统

### 5.1 Mixin 优先级

```java
// 高优先级确保在 Minecraft 之前执行
@Mixin(value = Minecraft.class, priority = 1000)
public class MinecraftMixin { ... }

// 默认优先级
@Mixin(ChunkRenderDispatcher.class)
public class ChunkRenderDispatcherMixin { ... }

// 低优先级确保在其他 Mixin 之后执行
@Mixin(value = BlockColors.class, priority = 999)
public class BlockColorsMixin { ... }
```

### 5.2 注入点类型

| 注解 | 用途 |
|------|------|
| `@At("HEAD")` | 方法执行前 |
| `@At("RETURN")` | 方法正常返回后 |
| `@At("TAIL")` | 方法执行后（包括异常） |
| `@At("INVOKE")` | 调用特定方法时 |
| `@At("FIELD")` | 访问字段时 |

### 5.3 修改器类型

| 注解 | 用途 |
|------|------|
| `@Inject` | 插入新代码 |
| `@Redirect` | 重定向方法调用 |
| `@ModifyArg` | 修改方法参数 |
| `@ModifyVariable` | 修改局部变量 |
| `@WrapOperation` | 包装方法调用 |
| `@Shadow` | 引用目标类的方法/字段 |

---

## 6. Access Widener

### 6.1 用途

Access Widener 允许 mod 访问 Minecraft 类的私有成员：

```
# sodium-common.accesswidener
accessWidener v2 named

# 访问类
accessible class net/minecraft/world/level/BlockAndTintGetter
accessible class net/minecraft/world/level/Level
accessible class net/minecraft/client/renderer/chunk/ChunkRenderDispatcher

# 访问字段
accessible field net/minecraft/world/level/Level watching
accessible field net/minecraft/client/renderer/chunk/ChunkRenderDispatcher builtSections

# 访问方法
accessible method net/minecraft/world/level/Level getBlockState (Lnet/minecraft/core/BlockPos;)Lnet/minecraft/world/level/block/state/BlockState;
```

### 6.2 注册

```kotlin
// build.gradle.kts
accessWidener("src/main/resources/sodium-${platform}.accesswidener")
```

---

## 7. FRAPI 集成

### 7.1 FRAPI 是什么

FRAPI (Fabric Renderer API) 允许第三方 mod 使用 Sodium 的渲染系统。

### 7.2 FRAPIProvider

```startLine:1:50:D:/Projects/sodium/frapi/src/main/java/net/caffeinemc/mods/sodium/client/render/frapi/FRAPIProvider.java
public class FRAPIProvider {
    private static final FRAPIProvider INSTANCE = new FRAPIProvider();
    private boolean registered = false;
    
    public static FRAPIProvider getInstance() {
        return INSTANCE;
    }
    
    public void register() {
        if (registered) return;
        
        // 注册到 FRAPI
        Loader.instance().extend(
            SodiumRenderer.INSTANCE,
            SodiumWorldRendererAccessor.getInstance()
        );
        
        registered = true;
    }
}
```

### 7.3 Renderer 实现

```startLine:1:80:D:/Projects/sodium/frapi/src/main/java/net/caffeinemc/mods/sodium/client/render/frapi/SodiumRenderer.java
public class SodiumRenderer implements Renderer {
    public static final SodiumRenderer INSTANCE = new SodiumRenderer();
    
    private SodiumRenderer() {}
    
    @Override
    public MutableMesh mutableMesh() {
        return new MutableMeshImpl();
    }
    
    @Override
    public MutableMesh mutableMesh(MeshBuilder<?> builder) {
        return new MutableMeshImpl(builder);
    }
    
    @Override
    public MeshBuilder<?> meshBuilder() {
        return SodiumMeshBuilder.INSTANCE;
    }
    
    @Override
    public void render(ModelBlockRenderer renderer, 
                       BakedModel model,
                       BlockState state,
                       BlockPos pos,
                       Level level,
                       PoseStack matrixStack,
                       RenderType renderType) {
        // 使用 Sodium 的渲染管道
    }
}
```

---

## 8. 配置系统

### 8.1 Fabric 配置加载

```startLine:1:60:D:/Projects/sodium/fabric/src/main/java/net/caffeinemc/mods/sodium/fabric/config/ConfigLoaderFabric.java
public class ConfigLoaderFabric {
    public static void collectConfigEntryPoints() {
        // 收集所有配置选项
        SodiumConfig.collectOptions(new FabricConfigOptions());
        
        // 监听配置变化
        FabricLoader.getInstance().getConfigDir();
    }
}
```

### 8.2 NeoForge 配置加载

```startLine:1:60:D:/Projects/sodium/neoforge/src/main/java/net/caffeinemc/mods/sodium/neoforge/config/ConfigLoaderForge.java
public class ConfigLoaderForge {
    public static void collectConfigEntryPoints() {
        // 收集配置
        SodiumConfig.collectOptions(new ForgeConfigOptions());
        
        // 注册配置ChangedListener
        ModLoadingContext.get().registerExtensionPoint(
            IConfigScreenFactory.class,
            (mc, parent) -> VideoSettingsScreen.createScreen(parent)
        );
    }
}
```

---

## 9. 平台检测

```java
// 检测当前平台
public enum Platform {
    FABRIC,
    NEOFORGE;
    
    public static Platform getCurrent() {
        // 通过类存在性检测
        if (Class.forName("net.fabricmc.api.EnvType") != null) {
            return FABRIC;
        }
        return NEOFORGE;
    }
}
```

---

## 10. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-chunk-render-system.md](02-chunk-render-system.md) - 区块渲染系统
- [04-render-pipeline.md](04-render-pipeline.md) - 渲染管线

---

*生成时间: 2026-03-19*
