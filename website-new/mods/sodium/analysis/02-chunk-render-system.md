# Sodium 区块渲染系统

> 多线程异步构建与批处理渲染机制

## 1. 概述

区块（Chunk）是 Minecraft 世界的基本渲染单位。Sodium 通过多线程异步构建和批处理渲染显著优化了区块渲染性能。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `RenderSection` | `common/.../render/chunk/RenderSection.java` |
| `RenderSectionManager` | `common/.../render/chunk/RenderSectionManager.java` |
| `ChunkBuilder` | `common/.../render/chunk/compile/executor/ChunkBuilder.java` |
| `DefaultChunkRenderer` | `common/.../render/chunk/DefaultChunkRenderer.java` |
| `BlockRenderer` | `common/.../render/chunk/compile/pipeline/BlockRenderer.java` |

---

## 2. 核心数据结构

### 2.1 RenderSection

`RenderSection` 是区块渲染的基本单位：

```startLine:1:80:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/RenderSection.java
public class RenderSection {
    private static final int SECTION_HEIGHT = 16;
    
    // 区块坐标（区块级，不是方块级）
    private final int sectionX;
    private final int sectionY;
    private final int sectionZ;
    
    // 渲染数据
    private volatile ChunkGraphicsState graphicsState;
    private volatile int frameIndex;
    
    // 可见性数据
    private volatile long visibilityData;
    private volatile long neighborVisibilityData;
    
    // 包围盒
    private final AABB boundingBox;
    
    public int getCenterX() { return sectionX << 4 | 8; }
    public int getCenterY() { return sectionY << 4 | 8; }
    public int getCenterZ() { return sectionZ << 4 | 8; }
}
```

### 2.2 RenderSectionManager

管理所有 `RenderSection` 的生命周期：

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/RenderSectionManager.java
public class RenderSectionManager implements ChunkTracker {
    private final RenderSection[] sections;
    private final ChunkTracker tracker;
    private final ChunkUpdateQueue updateQueue;
    
    // 区块可见性状态
    private final RemovableMultiTree<RenderSection> sectionTree;
    private final OcclusionCuller occlusionCuller;
    
    // 渲染列表
    private final ChunkRenderList[] renderLists;
}
```

### 2.3 RenderRegion

区块区域分组，优化 GPU 缓冲区管理：

```startLine:1:60:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/region/RenderRegion.java
public class RenderRegion {
    public static final int REGION_WIDTH = 8;    // X 方向区块数
    public static final int REGION_HEIGHT = 4;   // Y 方向区块数
    public static final int REGION_DEPTH = 8;    // Z 方向区块数
    
    // 区域内的区块总数: 8 × 4 × 8 = 256
    private static final int REGION_SIZE = REGION_WIDTH * REGION_HEIGHT * REGION_DEPTH;
    
    // GPU 缓冲区
    private final GlBuffer vertexBuffer;
    private final GlBuffer uploadBuffer;
    
    // 缓存的批处理
    private final CachedBatch[] cachedBatches;
}
```

---

## 3. 多线程构建系统

### 3.1 ChunkBuilder 架构

```startLine:1:40:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/executor/ChunkBuilder.java
public class ChunkBuilder implements AutoCloseable {
    private final ClientLevel level;
    private final ChunkVertexType vertexType;
    private final Thread[] workers;
    private final ChunkJobQueue queue;
    private final ChunkJobCollector collector;
    
    public ChunkBuilder(ClientLevel level, ChunkVertexType vertexType) {
        this.level = level;
        this.vertexType = vertexType;
        this.queue = new ChunkJobQueue();
        this.collector = new ChunkJobCollector();
        
        int count = calculateOptimalThreadCount();
        this.workers = new Thread[count];
        
        for (int i = 0; i < count; i++) {
            this.workers[i] = new Thread(new WorkerRunnable(), 
                "Chunk Render Task Executor #" + i);
        }
    }
}
```

### 3.2 任务调度

```startLine:100:180:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/executor/ChunkBuilder.java
public void submit(RenderSection section, BuildPriority priority) {
    ChunkJob job = ChunkJob.create(section, priority);
    this.queue.enqueue(job);
    this.workerSemaphore.release();
}

private static int calculateOptimalThreadCount() {
    int processors = Runtime.getRuntime().availableProcessors();
    int maxThreads = Math.max(1, processors - 2);
    // 智能限制线程数
    return Math.min(maxThreads, 10);
}
```

### 3.3 工作线程执行

```startLine:200:280:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/executor/ChunkBuilder.java
private class WorkerRunnable implements Runnable {
    @Override
    public void run() {
        while (!isShutdown.get()) {
            try {
                ChunkJob job = queue.dequeue(timeout);
                
                if (job != null) {
                    BuildResult result = buildChunk(job.section);
                    collector.offer(result);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
    
    private BuildResult buildChunk(RenderSection section) {
        ChunkBuildBuffers buffers = buffersByThread.get();
        ChunkBuildContext context = new ChunkBuildContext(buffers);
        
        // 调用渲染管道构建网格
        return BlockRenderer.render(context, section, vertexType);
    }
}
```

---

## 4. 网格构建流程

### 4.1 BlockRenderer 管道

```startLine:1:80:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/pipeline/BlockRenderer.java
public class BlockRenderer {
    private final ChunkOcclusionTracker occlusionTracker;
    private final ChunkBuildBuffers buffers;
    
    public static BuildResult render(ChunkBuildContext context,
                                     RenderSection section,
                                     ChunkVertexType vertexType) {
        // 1. 收集需要渲染的方块
        List<BlockPos> blocks = collectRenderableBlocks(section);
        
        // 2. 按材质分组
        Map<RenderMaterial, List<BlockPos>> byMaterial = groupByMaterial(blocks);
        
        // 3. 对每个材质渲染
        for (Map.Entry<RenderMaterial, List<BlockPos>> entry : byMaterial) {
            RenderMaterial material = entry.getKey();
            List<BlockPos> positions = entry.getValue();
            
            // 渲染该材质的所有方块
            renderBlocks(context, section, material, positions);
        }
        
        // 4. 构建最终网格
        return buildMesh(context, section, vertexType);
    }
}
```

### 4.2 遮挡追踪

```startLine:1:60:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/pipeline/BlockOcclusionCache.java
public class BlockOcclusionCache {
    private static final int CACHE_SIZE = 512;
    
    // LRU 缓存
    private final Long2ObjectMap<BlockOcclusionData> cache;
    
    public boolean shouldDrawSide(BlockState selfState, 
                                   BlockGetter view,
                                   BlockPos selfPos, 
                                   Direction facing) {
        BlockState neighborState = view.getBlockState(selfPos.relative(facing));
        
        // 全方块形状 - 快速路径
        if (neighborState.isSolid() && neighborState.hasLargeCollisionShape()) {
            return false;
        }
        
        // VoxelShape 交集检测 - 慢速路径（带缓存）
        return this.lookupOcclusion(selfState, neighborState, facing);
    }
    
    private boolean lookupOcclusion(BlockState self, BlockState neighbor, Direction facing) {
        long cacheKey = calculateCacheKey(self, neighbor, facing);
        BlockOcclusionData data = cache.get(cacheKey);
        
        if (data != null) {
            return data.isVisible(facing);
        }
        
        // 计算并缓存结果
        data = computeOcclusion(self, neighbor, facing);
        cache.put(cacheKey, data);
        return data.isVisible(facing);
    }
}
```

### 4.3 顶点编码

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/vertex/format/ChunkVertexEncoder.java
public interface ChunkVertexEncoder {
    long write(long ptr, int materialBits, Vertex[] vertices, int sectionIndex);
    
    class Vertex {
        public float x, y, z;      // 位置 (16-bit 压缩)
        public int color;          // ABGR 颜色
        public float ao;           // 环境光遮蔽 [0, 1]
        public float u, v;         // 纹理坐标
        public int light;          // 天空 + 阻塞光照
    }
}

public enum ChunkVertexType {
    VANILLA(24),      // 24 bytes per vertex
    IMMIX(16);        // 优化格式，16 bytes per vertex
    
    public final int stride;
    private final ChunkVertexEncoder encoder;
}
```

---

## 5. 批处理渲染

### 5.1 DefaultChunkRenderer

```startLine:1:80:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/DefaultChunkRenderer.java
public class DefaultChunkRenderer {
    private final RenderDevice device;
    private final ChunkShader parentShader;
    private final SharedQuadIndexBuffer indexBuffer;
    
    public void render(ChunkRenderMatrices matrices,
                       CommandList commandList,
                       ChunkRenderListIterable renderLists,
                       TerrainRenderPass renderPass) {
        // 按 Region 分组渲染
        while (iterator.hasNext()) {
            ChunkRenderList renderList = iterator.next();
            RenderRegion region = renderList.getRegion();
            
            // 获取或创建缓存的批处理
            CachedBatch batch = region.getCachedBatch(renderPass);
            
            if (!batch.isFilled()) {
                // 填充批处理
                fillCommandBuffer(batch, region, storage, renderPass);
            }
            
            // 执行绘制（每个 Region 一次 Draw Call）
            executeDrawBatch(commandList, tessellation, batch);
        }
    }
    
    private void executeDrawBatch(CommandList commandList,
                                  Tessellator tessellator,
                                  CachedBatch batch) {
        // 使用 MultiDraw 批量绘制
        batch.multiDraw(commandList, tessellator, indexBuffer);
    }
}
```

### 5.2 MultiDrawBatch

```startLine:1:60:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/gl/device/MultiDrawBatch.java
public interface MultiDrawBatch {
    void begin();
    void add(int vertexCount, int firstVertex);
    void end();
    void draw(CommandList commandList, Tessellator tessellator, 
              SharedQuadIndexBuffer indices);
    void multiDraw(CommandList commandList, Tessellator tessellator,
                   SharedQuadIndexBuffer indices);
}
```

### 5.3 共享索引缓冲区

```startLine:1:40:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/DefaultChunkRenderer.java
public class SharedQuadIndexBuffer {
    private static final int[] QUAD_INDICES;
    
    static {
        // 预生成 quad 索引模式
        QUAD_INDICES = new int[6 * 1024 * 1024];  // 6M quads
        for (int i = 0; i < QUAD_INDICES.length; i += 6) {
            int base = (i / 6) * 4;
            QUAD_INDICES[i + 0] = base + 0;
            QUAD_INDICES[i + 1] = base + 1;
            QUAD_INDICES[i + 2] = base + 2;
            QUAD_INDICES[i + 3] = base + 0;
            QUAD_INDICES[i + 4] = base + 2;
            QUAD_INDICES[i + 5] = base + 3;
        }
    }
}
```

---

## 6. 渲染列表管理

### 6.1 ChunkRenderList

```startLine:1:80:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/lists/ChunkRenderList.java
public class ChunkRenderList {
    private static final int SORTING_HISTOGRAM_SIZE = 64;
    
    // 排序后的区块索引数组
    private int[] sortedIndices;
    private int sortedCount;
    
    // 几何数据位图
    private long[] sectionsWithGeometryMap;
    
    // 相机相对位置
    private int relativeCameraX;
    private int relativeCameraY;
    private int relativeCameraZ;
    
    public void sort(int cameraX, int cameraY, int cameraZ) {
        // 直方图排序 - O(n) 复杂度
        int[] histogram = new int[SORTING_HISTOGRAM_SIZE];
        
        // 第一遍：计算直方图
        for (int i = 0; i < sectionsWithGeometryMap.length; i++) {
            long map = sectionsWithGeometryMap[i];
            while (map != 0) {
                int index = Long.numberOfTrailingZeros(map);
                map &= map - 1;
                
                int distance = calculateDistance(i, index, cameraX, cameraY, cameraZ);
                histogram[distance]++;
            }
        }
        
        // 第二遍：前缀和
        for (int i = 1; i < SORTING_HISTOGRAM_SIZE; i++) {
            histogram[i] += histogram[i - 1];
        }
        
        // 第三遍：收集排序结果
        // ... 
    }
    
    private int calculateDistance(int regionIndex, int sectionIndex, 
                                   int camX, int camY, int camZ) {
        // 使用曼哈顿距离
        int dx = Math.abs(sectionX - camX);
        int dy = Math.abs(sectionY - camY);
        int dz = Math.abs(sectionZ - camZ);
        return (dx + dy + dz) / 16;  // 区块级距离
    }
}
```

---

## 7. 帧预算控制

```startLine:100:150:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/executor/ChunkBuilder.java
public class ChunkBuilder {
    // 估算任务耗时
    var uploadBudget = new LimitedResourceBudget(
        Math.max((long)(averageFrameDuration * 0.1f), MIN_UPLOAD_DURATION_BUDGET),
        regions.getStagingBuffer().getUploadSizeLimit(averageFrameDuration)
    );
    
    // 控制每帧处理的 Chunk 数量
    while (!queue.isEmpty() && workBudget.hasRemaining()) {
        ChunkJob job = queue.dequeue();
        if (job != null) {
            processJob(job);
            workBudget.decrement(job.getEstimatedCost());
        }
    }
}
```

---

## 8. 性能优化要点

| 优化项 | 实现方式 | 效果 |
|--------|----------|------|
| **多线程构建** | 专用工作线程池 | 帧率更稳定 |
| **直方图排序** | O(n) 排序算法 | 排序更快 |
| **MultiDraw** | 批量绘制 | 减少 Draw Calls |
| **共享索引** | 预生成索引缓冲 | 减少显存占用 |
| **帧预算** | 时间片控制 | 避免卡顿 |
| **工作窃取** | 负载均衡 | CPU 利用率更高 |

---

## 9. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [03-occlusion-culling.md](03-occlusion-culling.md) - 遮挡剔除
- [04-render-pipeline.md](04-render-pipeline.md) - 渲染管线

---

*生成时间: 2026-03-19*
