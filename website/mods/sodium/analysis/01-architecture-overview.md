# Sodium 整体架构分析

> 高性能 Minecraft 渲染优化 Mod 架构设计文档

## 项目信息

| 属性 | 值 |
|------|-----|
| Mod 名称 | Sodium |
| 当前版本 | 0.8.6 |
| 支持 Minecraft | 1.21.11 |
| 支持平台 | Fabric, NeoForge |
| Java 版本 | JDK 21 |
| 构建工具 | Gradle 8.10.x |
| 许可证 | Polyform Shield 1.0.0 |

## 文档目录

| 文档 | 说明 |
|------|------|
| [01-architecture-overview.md](01-architecture-overview.md) | 整体架构设计模式、模块划分、核心设计原则 |
| [02-chunk-render-system.md](02-chunk-render-system.md) | 区块渲染系统 - 异步构建、批处理、网格生成 |
| [03-occlusion-culling.md](03-occlusion-culling.md) | 遮挡剔除系统 - 可见性判断、方向优化 |
| [04-render-pipeline.md](04-render-pipeline.md) | 渲染管线 - 渲染 Pass、多线程架构 |
| [05-shader-system.md](05-shader-system.md) | 着色器系统 - GLSL 着色器、顶点格式 |
| [06-platform-integration.md](06-platform-integration.md) | 平台集成 - Fabric/NeoForge 服务加载 |

---

## 1. 项目结构

### 1.1 模块划分

```
D:/Projects/sodium/
├── common/              # 核心渲染引擎（平台无关）
│   ├── src/main/java/
│   │   └── net/caffeinemc/mods/sodium/
│   │       ├── client/         # 客户端代码
│   │       │   ├── SodiumClientMod.java
│   │       │   ├── render/    # 渲染系统
│   │       │   ├── gui/       # GUI 配置
│   │       │   ├── config/    # 配置系统
│   │       │   └── services/  # 平台服务接口
│   │       └── mixin/         # Mixin 注入
│   ├── src/api/         # 公共 API
│   └── main/resources/  # 资源文件
├── fabric/              # Fabric 模组加载器集成
│   └── src/main/java/
│       └── net/caffeinemc/mods/sodium/fabric/
├── neoforge/            # NeoForge 模组加载器集成
│   └── src/main/java/
│       └── net/caffeinemc/mods/sodium/neoforge/
├── frapi/               # Fabric Renderer API 实现
├── buildSrc/            # Gradle 构建配置
├── settings.gradle.kts  # 项目设置
└── gradle.properties    # Gradle 属性
```

### 1.2 核心模块职责

| 模块 | 职责 |
|------|------|
| **common** | 包含所有渲染优化逻辑、遮挡剔除、多线程构建、批处理渲染 |
| **fabric** | Fabric 平台的 Mixin 配置、平台特定实现、服务注册 |
| **neoforge** | NeoForge 平台的事件处理、配置集成 |
| **frapi** | 为第三方 mod 提供渲染 API 访问接口 |

---

## 2. 架构设计模式

### 2.1 服务加载模式 (Service Loader Pattern)

Sodium 使用 Java SPI (Service Provider Interface) 实现平台无关代码：

```startLine:1:25:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/services/Services.java
public static <T> T load(Class<T> clazz) {
    return ServicesLoader.load(clazz, clazz.getClassLoader());
}
```

**平台服务接口定义**：

```java
// common 模块定义接口
public interface PlatformBlockAccess {
    PlatformBlockAccess INSTANCE = Services.load(PlatformBlockAccess.class);
    
    int getLightEmission(BlockState state, BlockAndTintGetter level, BlockPos pos);
    boolean shouldSkipRender(BlockState state);
}

// fabric 模块提供实现
public class FabricBlockAccess implements PlatformBlockAccess { ... }

// neoforge 模块提供实现
public class NeoForgeBlockAccess implements PlatformBlockAccess { ... }
```

### 2.2 Mixin 注入模式

使用 Mixin 框架进行字节码注入：

```json
// frapi/src/main/resources/frapi.mixins.json
{
  "required": true,
  "package": "net.caffeinemc.mods.sodium.mixin.frapi",
  "compatibilityLevel": "JAVA_21",
  "mixins": [
    "BakedModelMixin",
    "ModelBlockRendererMixin"
  ],
  "injectors": {
    "defaultRequire": 1
  }
}
```

### 2.3 多层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    渲染优化层 (Mixin)                         │
│  • LevelRendererMixin - 替换主渲染器                         │
│  • GameRendererMixin - 注入性能统计                          │
│  • BlockEntityRendererMixin - 区块实体渲染                   │
├─────────────────────────────────────────────────────────────┤
│                    渲染管线层 (Pipeline)                      │
│  • SodiumWorldRenderer - 世界渲染协调                        │
│  • RenderSectionManager - 区块管理                            │
│  • ChunkBuilder - 异步构建                                    │
├─────────────────────────────────────────────────────────────┤
│                    平台抽象层 (Services)                      │
│  • PlatformBlockAccess - 方块访问                            │
│  • PlatformLevelAccess - 世界访问                             │
│  • PlatformModelAccess - 模型访问                            │
├─────────────────────────────────────────────────────────────┤
│                    平台实现层                                │
│  • FabricBlockAccess / NeoForgeBlockAccess                  │
│  • FabricLevelAccess / NeoForgeLevelAccess                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 核心组件交互

### 3.1 渲染流程

```
Minecraft Tick Loop
        │
        ▼
GameRenderer.render() ─────► SodiumWorldRenderer.render()
        │                           │
        │                    ┌──────┴──────┐
        │                    ▼             ▼
        │              setupTerrain()  renderWorld()
        │                    │             │
        │                    ▼             ▼
        │            OcclusionCuller   DefaultChunkRenderer
        │                    │             │
        │                    ▼             ▼
        │            RenderSectionManager ◄──────────────┐
        │                    │                          │
        │                    ▼                          │
        │            ChunkBuilder (Worker Threads)       │
        │                    │                          │
        │                    ▼                          │
        │            ChunkMesh → GlBuffer               │
        │                                               │
        └───────────────────────────────────────────────┘
```

### 3.2 区块更新流程

```
Chunk Load/Unload Event
        │
        ▼
RenderSectionManager.onSectionAdded()
        │
        ├──► Check if in render distance
        │
        ├──► Create/Update RenderSection
        │
        └──► Queue ChunkBuilder task
                    │
                    ▼
            Worker Thread Pool
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Thread #1   Thread #2   Thread #N
        │           │           │
        ▼           ▼           ▼
   Mesh Build  Mesh Build  Mesh Build
        │           │           │
        └───────────┴───────────┘
                    │
                    ▼
            ChunkRenderStorage
                    │
                    ▼
            GPU Buffer Upload
```

---

## 4. 关键设计决策

### 4.1 为什么选择多线程？

**问题**：原版 Minecraft 的区块网格构建在主线程执行，导致大型区块变更时帧率骤降。

**解决方案**：
- 创建专用工作线程池
- 使用无锁数据结构（`ChunkJobQueue`）
- 支持任务窃取负载均衡

```startLine:38:65:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/executor/ChunkBuilder.java
public class ChunkBuilder {
    public ChunkBuilder(ClientLevel level, ChunkVertexType vertexType) {
        int count = getOptimalThreadCount();
        for (int i = 0; i < count; i++) {
            Thread thread = new Thread(worker, "Chunk Render Task Executor #" + i);
            thread.setPriority(Math.max(0, Thread.NORM_PRIORITY - 2));
        }
    }
    
    private static int getOptimalThreadCount() {
        int processors = Runtime.getRuntime().availableProcessors();
        return Math.max(1, Math.min(processors - 2, 10));
    }
}
```

### 4.2 遮挡剔除的必要性

**问题**：渲染不可见的区块浪费 GPU 和 CPU 资源。

**解决方案**：
- 实现基于图的可见性传播算法
- 使用位掩码高效编码方向可见性
- 相机移动时增量更新

### 4.3 MultiDraw 批处理

**问题**：每个区块一次 draw call 产生过多 draw calls。

**解决方案**：
- 合并同一 region 内多个区块的绘制
- 使用共享索引缓冲区
- 单次 `glMultiDrawElementsBaseVertex` 调用渲染多个网格

---

## 5. 版本兼容性策略

### 5.1 源码集分离

```
common/src/
├── main/        # 核心逻辑
├── api/         # API 定义
├── boot/        # 早期初始化
└── desktop/     # 桌面平台代码
```

### 5.2 Access Widener

定义需要访问的私有成员：

```
sodium-common.accesswidener
accessible class net.minecraft.world.level/BlockAndTintGetter
accessible field net.minecraft.world/level/Level/watching
```

### 5.3 平台特定 Mixin

每个平台有独立的 Mixin 配置文件，避免代码冲突。

---

## 6. 性能优化技术总结

| 技术 | 位置 | 效果 |
|------|------|------|
| 多线程构建 | `ChunkBuilder` | CPU 利用率提升，帧率稳定 |
| 遮挡剔除 | `OcclusionCuller` | 减少不必要的渲染 |
| MultiDraw | `DefaultChunkRenderer` | 减少 Draw Calls |
| 顶点压缩 | `ChunkVertexEncoder` | 减少显存占用 |
| 缓冲区池化 | `GlBufferArena` | 减少 GC 压力 |
| 无分支代码 | `BitwiseMath` | 提升 CPU 流水线效率 |

---

## 7. 相关文档链接

- [02-chunk-render-system.md](02-chunk-render-system.md) - 区块渲染系统详解
- [03-occlusion-culling.md](03-occlusion-culling.md) - 遮挡剔除算法
- [04-render-pipeline.md](04-render-pipeline.md) - 渲染管线流程
- [05-shader-system.md](05-shader-system.md) - 着色器系统
- [06-platform-integration.md](06-platform-integration.md) - 平台集成机制

---

*生成时间: 2026-03-19*
*基于 Sodium v0.8.6 源码分析*
