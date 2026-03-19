# Sodium 渲染管线

> 从 Minecraft Tick 到 GPU 渲染的完整流程

## 1. 概述

Sodium 的渲染管线负责协调所有渲染组件，将 Minecraft 世界转换为 GPU 可识别的绘制命令。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `SodiumWorldRenderer` | `common/.../render/SodiumWorldRenderer.java` |
| `RenderSectionManager` | `common/.../render/chunk/RenderSectionManager.java` |
| `TerrainRenderPass` | `common/.../render/chunk/terrain/TerrainRenderPass.java` |
| `DefaultTerrainRenderPasses` | `common/.../render/chunk/terrain/DefaultTerrainRenderPasses.java` |

---

## 2. 渲染 Pass 系统

### 2.1 Pass 类型定义

```startLine:1:40:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/terrain/TerrainRenderPass.java
public class TerrainRenderPass {
    public final String name;
    public final ChunkSectionLayer layer;
    public final boolean isTranslucent;
    public final boolean isCutout;
    
    // 着色器程序名称
    public final String shaderProgram;
    
    // 渲染顺序（越大越后渲染）
    public final int renderOrder;
}
```

### 2.2 默认 Pass 配置

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/terrain/DefaultTerrainRenderPasses.java
public class DefaultTerrainRenderPasses {
    public static final TerrainRenderPass SOLID = new TerrainRenderPass(
        "solid",
        ChunkSectionLayer.SOLID,
        false,
        false,
        "rendertype_solid",
        0
    );
    
    public static final TerrainRenderPass CUTOUT_MIPPED = new TerrainRenderPass(
        "cutout_mipped",
        ChunkSectionLayer.CUTOUT_MIPPED,
        false,
        true,
        "rendertype_cutout_mipped",
        1
    );
    
    public static final TerrainRenderPass CUTOUT = new TerrainRenderPass(
        "cutout",
        ChunkSectionLayer.CUTOUT,
        false,
        true,
        "rendertype_cutout",
        2
    );
    
    public static final TerrainRenderPass TRANSLUCENT = new TerrainRenderPass(
        "translucent",
        ChunkSectionLayer.TRANSLUCENT,
        true,     // 半透明
        true,
        "rendertype_translucent",
        3
    );
    
    public static final TerrainRenderPass TIGER = new TerrainRenderPass(
        "tiger",
        ChunkSectionLayer.TIGER,
        false,
        true,
        "rendertype_tiger",
        4
    );
    
    // 按渲染顺序排列
    public static final TerrainRenderPass[] ORDERED_PASSES = {
        SOLID,
        CUTOUT_MIPPED,
        CUTOUT,
        TRANSLUCENT,
        TIGER
    };
}
```

### 2.3 Pass 渲染顺序

```
┌─────────────────────────────────────────────────────────────┐
│                    渲染 Pass 顺序                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SOLID          → 不透明方块（石头、草方块等）              │
│  2. CUTOUT_MIPPED  → 有纹理但支持 Mipmap（树叶等）           │
│  3. CUTOUT         → 精细裁剪纹理（花、栅栏等）              │
│  4. TRANSLUCENT    → 半透明方块（冰、染色玻璃等）            │
│  5. TIGER          → 特殊 Pass（树叶等需二次渲染）          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. SodiumWorldRenderer

### 3.1 类结构

```startLine:1:100:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/SodiumWorldRenderer.java
public class SodiumWorldRenderer {
    private final Minecraft client;
    private final RenderSectionManager sectionManager;
    private final DefaultChunkRenderer chunkRenderer;
    private final EntityColorCache entityColorCache;
    
    // 相机状态
    private Camera camera;
    private Vec3 lastCameraPos;
    private int lastCameraSectionX;
    private int lastCameraSectionY;
    private int lastCameraSectionZ;
    
    // 帧计数
    private int frameIndex;
    private int lastFrameIndex;
}
```

### 3.2 渲染入口

```startLine:200:300:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/SodiumWorldRenderer.java
public void render(LevelRenderer levelRenderer, 
                   float tickDelta, 
                   long limitTimeNano,
                   boolean renderBlockOutline,
                   Camera camera,
                   MatrixStack matrixStack) {
    
    // 1. 更新相机状态
    this.camera = camera;
    updateCamera(tickDelta);
    
    // 2. 设置地形渲染
    this.setupTerrain(camera, tickDelta);
    
    // 3. 渲染世界
    this.renderWorld(levelRenderer, tickDelta, matrixStack);
    
    // 4. 渲染实体（使用原始渲染器）
    this.renderEntities(levelRenderer, tickDelta, matrixStack);
}

private void setupTerrain(Camera camera, float tickDelta) {
    // 相机位置
    Vec3 cameraPos = camera.getPosition();
    
    // 检测相机移动
    boolean cameraMoved = checkCameraMoved(cameraPos);
    
    if (cameraMoved) {
        // 相机移动，触发遮挡剔除重新计算
        this.sectionManager.update(camera, this.occlusionCuller);
    }
    
    // 处理区块加载/卸载
    this.sectionManager.processChunkUpdates();
    
    // 触发新的构建任务
    this.chunkBuilder.resume();
}

private void renderWorld(LevelRenderer levelRenderer, 
                        float tickDelta, 
                        MatrixStack matrixStack) {
    
    ChunkRenderMatrices matrices = ChunkRenderMatrices.of(matrixStack);
    
    // 遍历所有 Pass
    for (TerrainRenderPass pass : DefaultTerrainRenderPasses.ORDERED_PASSES) {
        // 选择对应着色器
        ChunkShader shader = this.shaderManager.getShader(pass);
        
        // 渲染该 Pass
        this.chunkRenderer.render(matrices, commandList, renderLists, pass, shader);
    }
}
```

---

## 4. RenderSectionManager

### 4.1 职责概述

`RenderSectionManager` 负责管理世界中的所有区块渲染单元，协调区块加载、卸载、可见性计算和渲染列表更新。

```startLine:1:80:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/RenderSectionManager.java
public class RenderSectionManager implements ChunkTracker {
    private final ClientWorld level;
    private final RenderSection[] sections;
    
    // 区块可见性状态
    private final ChunkVisibility visibility;
    private final OcclusionCuller occlusionCuller;
    
    // 渲染列表
    private final ChunkRenderList[] renderLists;
    private final RenderRegion[] regions;
    
    // 区块追踪
    private final ChunkTracker tracker;
    private final ChunkUpdateQueue updateQueue;
    
    // 相机状态
    private int cameraX, cameraY, cameraZ;
    private int cameraSectionX, cameraSectionY, cameraSectionZ;
}
```

### 4.2 区块更新流程

```startLine:100:200:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/RenderSectionManager.java
public void onSectionAdded(int sectionX, int sectionY, int sectionZ) {
    // 1. 获取或创建 RenderSection
    RenderSection section = getOrCreateSection(sectionX, sectionY, sectionZ);
    
    // 2. 更新邻居的可见性数据
    updateNeighborVisibility(section);
    
    // 3. 加入渲染管理器
    scheduleRebuild(section, BuildReason.SECTION_BUILT);
}

public void onSectionRemoved(int sectionX, int sectionY, int sectionZ) {
    int sectionIndex = encodeSectionIndex(sectionX, sectionY, sectionZ);
    RenderSection section = sections[sectionIndex];
    
    if (section != null) {
        // 1. 更新邻居的可见性数据
        updateNeighborVisibility(section);
        
        // 2. 从渲染管理器移除
        section.setDirty();
    }
}

private void scheduleRebuild(RenderSection section, BuildReason reason) {
    // 根据距离确定优先级
    BuildPriority priority = calculatePriority(section, reason);
    
    // 加入构建队列
    this.chunkBuilder.submit(section, priority);
}
```

### 4.3 可见性更新

```startLine:200:300:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/RenderSectionManager.java
public void update(Camera camera, OcclusionCuller culler) {
    // 1. 更新相机位置
    updateCameraPosition(camera);
    
    // 2. 执行遮挡剔除
    ChunkVisibility visibility = culler.findVisible(
        camera,
        maxRenderDistance,
        useOcclusionCulling,
        frameIndex
    );
    
    // 3. 更新渲染列表
    for (TerrainRenderPass pass : DefaultTerrainRenderPasses.ORDERED_PASSES) {
        ChunkRenderList list = renderLists[pass.ordinal()];
        list.update(visibility, cameraSectionX, cameraSectionY, cameraSectionZ);
    }
}

private void updateCameraPosition(Camera camera) {
    Vec3 pos = camera.getPosition();
    
    this.cameraX = (int) pos.x;
    this.cameraY = (int) pos.y;
    this.cameraZ = (int) pos.z;
    
    this.cameraSectionX = SectionPos.blockToSectionCoord(cameraX);
    this.cameraSectionY = SectionPos.blockToSectionCoord(cameraY);
    this.cameraSectionZ = SectionPos.blockToSectionCoord(cameraZ);
}
```

---

## 5. 渲染列表迭代器

### 5.1 ChunkRenderListIterable

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/lists/ChunkRenderListIterable.java
public interface ChunkRenderListIterable extends Iterable<ChunkRenderList> {
    // 获取可见的渲染列表数量
    int getVisibleListCount();
    
    // 获取特定 Pass 的列表
    ChunkRenderList getListForPass(TerrainRenderPass pass);
}

public class ChunkRenderListIterableImpl implements ChunkRenderListIterable {
    private final ChunkRenderList[] lists;
    
    @Override
    public Iterator<ChunkRenderList> iterator() {
        return new FilteredIterator(lists, ChunkRenderList::hasGeometry);
    }
}
```

---

## 6. 命令列表封装

### 6.1 CommandList 接口

```startLine:1:60:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/gl/device/CommandList.java
public interface CommandList extends AutoCloseable {
    void uploadData(GlBuffer buffer, ByteBuffer data);
    
    void bindBuffer(GlBuffer buffer);
    void unbindBuffer();
    
    void bindTexture(int unit, GlTexture texture);
    void unbindTexture(int unit);
    
    void bindShader(GlShader shader);
    void unbindShader();
    
    void setUniform(int location, UniformValue value);
    
    void drawElements(int mode, int count, int type, long indices);
    void multiDrawElementsBaseVertex(int mode, int[] counts, int type, 
                                      long[] indices, int[] baseVertices);
    
    void enableCull();
    void disableCull();
    void enableDepthTest();
    void disableDepthTest();
    
    void depthFunc(int func);
    void depthMask(boolean mask);
    
    void enableBlend();
    void disableBlend();
    void blendFunc(int srcFactor, int dstFactor);
}
```

### 6.2 RenderDevice 实现

```startLine:1:80:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/gl/device/RenderDevice.java
public class RenderDevice {
    private static final ThreadLocal<RenderDevice> INSTANCE = 
        ThreadLocal.withInitial(() -> new RenderDevice());
    
    private CommandList commandList;
    private DrawParameters drawParameters;
    
    public static RenderDevice get() {
        return INSTANCE.get();
    }
    
    public void execute(Command task) {
        task.execute(commandList);
    }
    
    public <R> R transform(Function<CommandList, R> function) {
        return function.apply(commandList);
    }
}
```

---

## 7. 完整渲染流程

### 7.1 时序图

```
Minecraft Render Thread
        │
        ▼
GameRenderer.render()
        │
        ├──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
SodiumWorldRenderer.setupTerrain()     BlockEntityRendererDispatcher.render()
        │                                      │
        ├──► OcclusionCuller.findVisible()     │
        │                                      │
        ├──► RenderSectionManager.update()      │
        │                                      │
        └──► ChunkBuilder.resume()             │
                │                              │
                │    [Worker Threads]          │
                │                              │
                ▼                              ▼
        RenderSectionManager.renderWorld()
                │
                ▼
        ┌─────────────────────────────────────┐
        │  foreach TerrainRenderPass:         │
        │    DefaultChunkRenderer.render()    │
        │    ├──► bindShader()                │
        │    ├──► multiDrawElements()         │
        │    └──► unbindShader()              │
        └─────────────────────────────────────┘
```

### 7.2 每帧执行的操作

| 阶段 | 操作 | 复杂度 |
|------|------|--------|
| **Setup** | 相机移动检测 | O(1) |
| **Setup** | 区块加载/卸载处理 | O(n) |
| **Setup** | 遮挡剔除 | O(v) v=可见区块数 |
| **Build** | 网格构建（异步） | O(b) b=构建中的区块 |
| **Render** | 着色器绑定 | O(p) p=Pass数量 |
| **Render** | 批处理绘制 | O(r) r=Region数 |

---

## 8. 与原版 Minecraft 的差异

| 特性 | 原版 Minecraft | Sodium |
|------|---------------|--------|
| 区块渲染 | 逐个渲染，每区块一次 Draw Call | 批处理，多区块一次 Draw Call |
| 网格构建 | 主线程 | 专用线程池 |
| 可见性计算 | 简单距离判断 | 完整图遍历 + 遮挡检测 |
| Pass 排序 | 无 | 按材质类型排序 |
| 帧预算控制 | 无 | 基于时间的任务调度 |

---

## 9. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-chunk-render-system.md](02-chunk-render-system.md) - 区块渲染系统
- [03-occlusion-culling.md](03-occlusion-culling.md) - 遮挡剔除
- [05-shader-system.md](05-shader-system.md) - 着色器系统
- [06-platform-integration.md](06-platform-integration.md) - 平台集成

---

*生成时间: 2026-03-19*
