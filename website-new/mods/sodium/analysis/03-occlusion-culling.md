# Sodium 遮挡剔除系统

> 可见性判断与方向优化算法

## 1. 概述

遮挡剔除（Occlusion Culling）是 Sodium 最重要的优化之一。通过判断区块之间的可见性，避免渲染被其他区块遮挡的区块。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `OcclusionCuller` | `common/.../render/chunk/occlusion/OcclusionCuller.java` |
| `VisibilityEncoding` | `common/.../render/chunk/occlusion/VisibilityEncoding.java` |
| `GraphDirection` | `common/.../render/chunk/occlusion/GraphDirection.java` |
| `VisibilityData` | `common/.../render/chunk/occlusion/VisibilityData.java` |

---

## 2. 核心概念

### 2.1 什么是遮挡剔除？

```
        Camera
           │
           ▼
    ┌──────────────┐
    │   Chunk A    │ ← 可见（相机所在区块）
    └──────┬───────┘
           │
    ┌──────┴───────┐
    │   Chunk B    │ ← 可见（被 A 遮挡？不）
    └──────┬───────┘
           │
    ┌──────┴───────┐
    │   Chunk C    │ ← 不可见（被 A 遮挡）
    └──────────────┘
```

### 2.2 方向编码

每个区块有 6 个方向（X+, X-, Y+, Y-, Z+, Z-），使用 36 位（6×6）编码方向之间的可见性：

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/occlusion/VisibilityEncoding.java
public class VisibilityEncoding {
    // 每个方向使用 6 位
    // TOTAL_DIRECTIONS = 6 (立方体的面)
    // DIRECTION_BITS = 6 (每个方向需要 6 位来编码与其他方向的关系)
    // TOTAL_BITS = 36
    
    public static final int TOTAL_BITS = DIRECTION_BITS * TOTAL_DIRECTIONS;  // 36
    public static final long DIRECTION_MASK = (1L << DIRECTION_BITS) - 1;     // 0x3F
    
    // 创建从给定方向进入的可见性掩码
    public static long createMask(Direction direction) {
        int offset = getDirectionIndex(direction) * DIRECTION_BITS;
        return DIRECTION_MASK << offset;
    }
    
    // 获取区块 A 的给定方向能看到区块 B 的哪些方向
    public static int getConnections(long visibilityData, Direction incoming) {
        int offset = getDirectionIndex(incoming) * DIRECTION_BITS;
        return (int)((visibilityData >> offset) & DIRECTION_MASK);
    }
    
    // 折叠所有方向的可见性
    public static int foldOutgoingDirections(long visibilityData) {
        int connections = 0;
        for (int i = 0; i < TOTAL_DIRECTIONS; i++) {
            int direction = (int)((visibilityData >> (i * DIRECTION_BITS)) & DIRECTION_MASK);
            connections |= (1 << i) & ~direction;
        }
        return connections;
    }
}
```

---

## 3. 遮挡剔除算法

### 3.1 图遍历实现

```startLine:31:120:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/occlusion/OcclusionCuller.java
public class OcclusionCuller {
    private final OcclusionResolver resolver;
    private final ChunkVisibility solver;
    
    // 双缓冲队列，避免分配
    private final Int2IntMap[] queues = new Int2IntMap[2];
    private int currentQueue = 0;
    
    public void findVisible(RenderSectionVisitor visitor,
                           Viewport viewport,
                           float searchDistance,
                           boolean useOcclusionCulling,
                           int frame) {
        // 1. 初始化
        Int2IntMap queue = queues[currentQueue];
        queue.clear();
        
        RenderSection cameraSection = getCameraSection(viewport);
        if (cameraSection == null) return;
        
        // 2. 将相机所在区块加入队列
        queue.put(cameraSection.getSectionIndex(), INCOMING_UNASSIGNED);
        
        // 3. 图遍历
        int queueOffset = 0;
        int queueSize = queue.size();
        
        while (queueOffset < queueSize) {
            int index = queue.get(queueOffset++);
            RenderSection section = getSectionByIndex(index);
            
            if (section == null || !isInRange(section, viewport, searchDistance)) {
                continue;
            }
            
            // 4. 检查可见性
            if (!useOcclusionCulling || !isOccluded(section, frame)) {
                // 5. 标记为可见并通知访问者
                visitor.visit(section);
                
                // 6. 将邻居加入队列
                long mask = section.getVisibilityData();
                for (Direction dir : DIRECTIONS) {
                    if (isDirectionVisible(mask, dir)) {
                        int neighborIndex = getNeighborIndex(section, dir);
                        if (!queue.containsKey(neighborIndex)) {
                            queue.put(neighborIndex, getIncomingDirection(dir));
                            queueSize++;
                        }
                    }
                }
            }
        }
    }
    
    private boolean isDirectionVisible(long visibilityData, Direction dir) {
        // 检查给定方向的可见性位
        return ((visibilityData >> getBitOffset(dir)) & 1L) == 0;
    }
}
```

### 3.2 可见性数据存储

```startLine:1:40:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/RenderSection.java
public class RenderSection {
    // 36 位掩码编码该区块的可见性
    // 每一位表示：从某个方向看，该方向是否被遮挡
    private volatile long visibilityData;
    
    // 邻居的可见性数据聚合
    private volatile long neighborVisibilityData;
    
    // 更新可见性数据
    public void updateVisibility(ChunkOcclusionData[] neighbors) {
        long data = 0;
        
        for (Direction dir : DIRECTIONS) {
            ChunkOcclusionData neighbor = neighbors[dir.get3DDataValue()];
            if (neighbor != null) {
                // 合并邻居的可见性信息
                data |= neighbor.getDirectionMask(dir.getOpposite());
            }
        }
        
        this.visibilityData = data;
    }
}
```

---

## 4. 方向优化

### 4.1 角度可见性优化

基于几何原理，某些方向对不可能同时可见：

```startLine:107:150:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/occlusion/OcclusionCuller.java
private static long getAngleVisibilityMask(Viewport viewport, RenderSection section) {
    // 计算相机到区块中心的距离分量
    double dx = Math.abs(transform.x - section.getCenterX());
    double dy = Math.abs(transform.y - section.getCenterY());
    double dz = Math.abs(transform.z - section.getCenterZ());
    
    long mask = 0L;
    
    // 优化规则：
    // 1. 如果 X 或 Z 距离大于 Y 距离，则上下方向相互遮挡
    if (dx > dy || dz > dy) {
        mask |= GraphDirection.UP_DOWN_OCCLUDED;
    }
    
    // 2. 如果 X 距离大于 Z 距离，则南北方向相互遮挡
    if (dx > dz) {
        mask |= GraphDirection.NORTH_SOUTH_OCCLUDED;
    }
    
    // 3. 如果 Z 距离大于 X 距离，则东西方向相互遮挡
    if (dz > dx) {
        mask |= GraphDirection.EAST_WEST_OCCLUDED;
    }
    
    return mask;
}
```

### 4.2 方向常量定义

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/occlusion/GraphDirection.java
public class GraphDirection {
    // 基本方向掩码（对应 Direction 枚举）
    public static final int POS_X = 1 << 0;   // 1  (East)
    public static final int NEG_X = 1 << 1;   // 2  (West)
    public static final int POS_Y = 1 << 2;   // 4  (Up)
    public static final int NEG_Y = 1 << 3;   // 8  (Down)
    public static final int POS_Z = 1 << 4;   // 16 (South)
    public static final int NEG_Z = 1 << 5;   // 32 (North)
    
    // 方向对遮挡掩码
    public static final long UP_DOWN_OCCLUDED = 
        ((long) POS_Y << 32) | ((long) NEG_Y << 0);
    
    public static final long NORTH_SOUTH_OCCLUDED = 
        ((long) POS_Z << 32) | ((long) NEG_Z << 0);
    
    public static final long EAST_WEST_OCCLUDED = 
        ((long) POS_X << 32) | ((long) NEG_X << 0);
}
```

### 4.3 优化效果示意

```
相机位置假设: (100, 70, 100)
当前区块位置: (96, 64, 96)

dx = |100-100| = 0   ← X 距离最小
dz = |100-104| = 4   ← Z 距离中等
dy = |70-72| = 2     ← Y 距离中等

判断:
- X 距离(0) < Z 距离(4) → 东西方向不相互遮挡 ✓
- X 距离(0) < Y 距离(2) → 上下方向不相互遮挡 ✓
- Y 距离(2) < Z 距离(4) → 南北方向不相互遮挡 ✓

结论: 三个方向对都没有遮挡关系
```

---

## 5. 区块遮挡追踪

### 5.1 ChunkOcclusionTracker

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/ChunkOcclusionTracker.java
public class ChunkOcclusionTracker {
    private static final int MAX_TRACKED_CHUNKS = 64;
    
    // LRU 缓存追踪的区块
    private final Long2IntMap trackingMap;
    private final IntList trackingList;
    
    // 区块遮挡数据
    private final ChunkOcclusionData[] data;
    
    public void markDirty(int sectionX, int sectionY, int sectionZ) {
        long key = encodeKey(sectionX, sectionY, sectionZ);
        
        if (!trackingMap.containsKey(key)) {
            // 添加到追踪列表
            if (trackingList.size() >= MAX_TRACKED_CHUNKS) {
                long removed = trackingList.removeInt(trackingList.size() - 1);
                trackingMap.remove(removed);
            }
            trackingList.add(key);
            trackingMap.put(key, trackingList.size() - 1);
        }
        
        // 标记需要重新计算
        setDirty(encodeSectionIndex(sectionX, sectionY, sectionZ));
    }
    
    public ChunkOcclusionData getData(int sectionX, int sectionY, int sectionZ) {
        int index = encodeSectionIndex(sectionX, sectionY, sectionZ);
        return data[index];
    }
}
```

### 5.2 ChunkOcclusionData

```startLine:1:40:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/compile/ChunkOcclusionData.java
public class ChunkOcclusionData {
    private final long[] directionMasks = new long[6];
    
    // 获取从给定方向观察时，哪个方向是可见的
    public long getDirectionMask(Direction from) {
        return directionMasks[from.get3DDataValue()];
    }
    
    // 合并两个区块的遮挡数据
    public void merge(ChunkOcclusionData other, Direction connectionDir) {
        for (int i = 0; i < 6; i++) {
            Direction dir = Direction.from3DDataValue(i);
            if (isDirectionBlocked(connectionDir, dir)) {
                directionMasks[i] |= (1L << connectionDir.get3DDataValue());
            }
        }
    }
    
    private boolean isDirectionBlocked(Direction from, Direction to) {
        // 检查两个方向是否相互遮挡
        return isOpposite(from, to) || hasSolidConnection(from, to);
    }
}
```

---

## 6. 可见性判断流程

### 6.1 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    可见性判断流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 获取相机位置和朝向                                       │
│           │                                                 │
│           ▼                                                 │
│  2. 计算角度可见性掩码                                        │
│     (基于 X/Y/Z 距离分量)                                    │
│           │                                                 │
│           ▼                                                 │
│  3. 从相机所在区块开始 BFS                                   │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────┐                   │
│  │ 对每个访问的区块:                     │                   │
│  │  - 检查是否在渲染距离内               │                   │
│  │  - 检查是否被当前帧内其他区块遮挡      │                   │
│  │  - 应用角度优化掩码                   │                   │
│  │  - 标记为可见/不可见                  │                   │
│  │  - 将可见邻居加入队列                 │                   │
│  └─────────────────────────────────────┘                   │
│           │                                                 │
│           ▼                                                 │
│  4. 返回所有可见区块列表                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 性能考量

| 优化项 | 实现方式 | 效果 |
|--------|----------|------|
| **双缓冲队列** | 避免每帧分配新队列 | 减少 GC |
| **位掩码运算** | 36 位编码方向可见性 | O(1) 判断 |
| **角度优化** | 利用几何关系提前排除 | 减少遍历 |
| **增量更新** | 只追踪变更的区块 | 减少计算 |

---

## 7. 与 Minecraft 原版的区别

| 特性 | 原版 Minecraft | Sodium |
|------|---------------|--------|
| 剔除方式 | 简单距离判断 | 完整图遍历 |
| 方向优化 | 无 | 角度掩码优化 |
| 缓存策略 | 无 | LRU 区块追踪 |
| 可见性编码 | 无 | 36 位掩码 |

---

## 8. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-chunk-render-system.md](02-chunk-render-system.md) - 区块渲染系统
- [04-render-pipeline.md](04-render-pipeline.md) - 渲染管线

---

*生成时间: 2026-03-19*
