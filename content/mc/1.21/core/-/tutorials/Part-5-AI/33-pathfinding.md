---
title: 第 33 章：路径导航（Pathfinding）
readingTime: 45
---

# 第 33 章：路径导航（Pathfinding）

> 深入了解实体的"找路"能力

---

## 章节目标

- 理解 PathNode 和 Path 的概念
- 掌握 Navigation 导航系统的工作原理
- 了解 A* 寻路算法的基础
- 理解路径节点处理器（NodeProcessor）
- 能够配置自定义导航参数

## 前置知识

- 熟悉 MobEntity 的概念
- 了解 Java 集合和队列基础

## 核心概念

### Navigation = 实体的"找路能力"

想象你在玩迷宫游戏：
- 🗺️ **地图**：整个世界
- 📍 **起点**：你现在的位置
- 🎯 **终点**：你要去的位置
- 🛤️ **路径**：从起点到终点的路线

**Navigation 就是 Minecraft 生物"找路去目的地"的能力！**

## 1. 路径系统概述

### 核心类结构

```
┌─────────────────────────────────────────────────────────────────┐
│                      路径导航系统架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│   │    Path    │      │  PathNode   │      │Navigation   │     │
│   │  (路径)    │ ───► │ (路径节点)  │ ───► │ (导航器)    │     │
│   └─────────────┘      └─────────────┘      └─────────────┘     │
│                                                                     │
│   ┌─────────────┐      ┌─────────────┐                           │
│   │EntityNavigator│    │NodeProcessor│                           │
│   │  (实体导航) │ ───► │ (节点处理)  │                           │
│   └─────────────┘      └─────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 路径搜索流程

```mermaid
flowchart TD
    A["请求导航"] --> B["创建 PathNode"]
    
    B --> C["A* 搜索"]
    
    C --> D{"找到路径?"}
    D -->|"是| E["返回 Path"]
    D -->|"否| F["返回 null"]
    
    E --> G["逐节点移动"]
    F --> H["原地等待"]
    
    G --> I{"到达目标?"}
    I -->|"是| J["完成"]
    I -->|"否| G
    
    I -->|"卡住| K["重新搜索"]
    K --> C
```

## 2. PathNode 路径节点

### PathNode 结构

```java
// PathNode.java
public class PathNode {
    // 位置
    public int x, y, z;
    
    // 代价（用于 A* 算法）
    public float nodeCost;
    public float penalty;
    
    // 路径状态
    public boolean visited;
    public float distanceToTarget;
    
    // 父节点（用于回溯）
    @Nullable
    public PathNode previous;
    
    // 节点类型
    public PathNodeType type;
    
    // 比较器（用于优先队列）
    public int compareTo(@Nullable PathNode pathNode) {
        return Float.compare(this.distanceToTarget, pathNode.distanceToTarget);
    }
}
```

### PathNodeType 节点类型

```java
// PathNodeType.java
public enum PathNodeType {
    BLOCKED,           // 被阻挡（不可通行）
    OPEN,              // 开放（可以通行）
    WALKABLE,          // 可行走
    WATER,             // 水中
    WATER_BORDER,      // 水边
    LAVA,              // 岩浆
    LAVA_BORDER,       // 岩浆边
    OPEN_OR_BORDER,    // 开放或边界
    DAMAGE_FIRE,       // 火焰伤害
    DAMAGE_CACTUS,     // 仙人掌
    DAMAGE_OTHER,      // 其他伤害
    TRAP,              // 陷阱
    PLAYER_NOT_SOFT_SLEEP,  // 玩家未软睡觉
    POWDER_SNOW,       // 粉雪
    DANGER_CACTUS,     // 仙人掌危险
    DANGER_FIRE,       // 火焰危险
    DANGER_OTHER,      // 其他危险
    RAIL,              // 轨道
    RAIL_CONNECTED,    // 连接的轨道
    FENCE,             // 栅栏
}
```

### 节点代价计算

```java
// 节点通行代价
public float getCost(PathNodeType type) {
    switch (type) {
        case BLOCKED:
            return -1.0f;  // 不可通行
        case WALKABLE:
            return 1.0f;
        case WATER:
            return 2.0f;   // 水中更慢
        case LAVA:
            return 4.0f;   // 岩浆更慢
        case DANGER_FIRE:
        case DANGER_CACTUS:
        case DAMAGE_FIRE:
        case DAMAGE_CACTUS:
            return 8.0f;   // 危险区域惩罚
        default:
            return 1.0f;
    }
}
```

## 3. Path 路径

### Path 结构

```java
// Path.java
public class Path {
    // 路径节点列表
    private final PathNode[] nodes;
    
    // 当前索引
    private int currentNodeIndex;
    
    // 总代价
    private float totalCost;
    
    // 获取当前节点
    public PathNode getCurrent() {
        return this.currentNodeIndex < this.nodes.length 
            ? this.nodes[this.currentNodeIndex] 
            : this.nodes[this.nodes.length - 1];
    }
    
    // 获取下一个节点
    @Nullable
    public PathNode getNext() {
        return this.currentNodeIndex < this.nodes.length - 1 
            ? this.nodes[this.currentNodeIndex + 1] 
            : null;
    }
    
    // 检查是否到达终点
    public boolean isDone() {
        return this.currentNodeIndex >= this.nodes.length;
    }
    
    // 移动到下一个节点
    public void next() {
        this.currentNodeIndex++;
    }
    
    // 获取路径长度
    public int getLength() {
        return this.nodes.length;
    }
    
    // 获取目标位置
    public Vec3d getEnd() {
        PathNode node = this.nodes[this.nodes.length - 1];
        return new Vec3d(node.x + 0.5, node.y + 0.5, node.z + 0.5);
    }
}
```

### Path 常用方法

```java
// Path.java 常用方法
public class Path {
    
    // 获取当前位置
    public Vec3d getCurrentPos() {
        PathNode node = this.getCurrent();
        return new Vec3d(node.x + 0.5, node.y, node.z + 0.5);
    }
    
    // 获取目标位置
    public Vec3d getTarget() {
        PathNode node = this.nodes[this.nodes.length - 1];
        return new Vec3d(node.x + 0.5, node.y, node.z + 0.5);
    }
    
    // 获取剩余距离
    public float getRemainingDistance() {
        float distance = 0.0f;
        PathNode current = this.getCurrent();
        
        for (int i = this.currentNodeIndex; i < this.nodes.length; i++) {
            PathNode next = this.nodes[i];
            distance += current.distanceTo(next);
            current = next;
        }
        
        return distance;
    }
    
    // 检查目标是否到达
    public boolean hasReached() {
        return this.hasReached(this.getCurrent());
    }
    
    private boolean hasReached(PathNode node) {
        return node.x == (int)Math.floor(this.targetX) &&
               node.z == (int)Math.floor(this.targetZ);
    }
}
```

## 4. Navigation 导航器

### Navigation 结构

```java
// Navigation.java
public class Navigation {
    protected final MobEntity entity;
    protected final World world;
    
    // 当前路径
    @Nullable
    protected Path currentPath;
    
    // 节点处理器
    protected final PathNodeNavigator nodeNavigator;
    
    // 速度
    protected double speed;
    
    // 最大路径距离
    protected int maxPathLength = 100;
    
    // 终点位置
    protected BlockPos target;
    protected Vec3d targetVec;
    
    // 是否正在导航
    protected boolean isNavigating;
}
```

### Navigation 主要方法

```java
// Navigation.java
public class Navigation {
    
    // 开始移动到目标位置
    public void startMovingTo(double x, double y, double z, double speed) {
        this.setTargetPos(x, y, z);
        this.speed = speed;
        
        // 查找路径
        this.currentPath = this.findPathTo(x, y, z);
        
        if (this.currentPath != null) {
            this.isNavigating = true;
            this.onPathStart();
        }
    }
    
    // 开始追踪实体
    public void startMovingTo(Entity target, double speed) {
        this.setTargetEntity(target);
        this.speed = speed;
        
        // 查找路径
        this.currentPath = this.findPathTo(target);
        
        if (this.currentPath != null) {
            this.isNavigating = true;
            this.onPathStart();
        }
    }
    
    // 停止移动
    public void stop() {
        this.currentPath = null;
        this.isNavigating = false;
        this.target = null;
        this.targetVec = null;
        this.onPathStop();
    }
    
    // 每 tick 更新
    public void tick() {
        if (!this.isNavigating) {
            return;
        }
        
        // 检查目标是否有效
        if (!this.isTargetValid()) {
            this.stop();
            return;
        }
        
        // 更新路径（如果目标在移动）
        if (this.updatePath()) {
            // 移动到下一个节点
            this.moveToNextNode();
        }
    }
}
```

### 导航更新

```java
// Navigation.java 导航更新
protected boolean updatePath() {
    // 检查是否需要更新
    if (this.currentPath != null && !this.currentPath.isDone()) {
        // 如果目标是实体，可能需要重新计算
        if (this.targetEntity != null) {
            double distance = this.entity.squaredDistanceTo(this.targetEntity);
            
            // 如果距离变化太大，重新搜索
            if (distance > 4.0) {
                this.currentPath = this.findPathTo(this.targetEntity);
            }
        }
    }
    
    return this.currentPath != null;
}

protected void moveToNextNode() {
    if (this.currentPath == null || this.currentPath.isDone()) {
        this.stop();
        return;
    }
    
    // 获取下一个节点位置
    Vec3d nodePos = this.currentPath.getCurrentPos();
    
    // 设置移动控制器的目标
    this.entity.getMoveControl().setWantedPosition(
        nodePos.x, nodePos.y, nodePos.z, 
        this.speed
    );
    
    // 移动到节点后前进到下一个
    if (this.hasReachedNode(this.currentPath.getCurrent())) {
        this.currentPath.next();
    }
}
```

## 5. A* 寻路算法

### A* 算法概述

```
A* 算法 = 贪心 + 动态规划

核心公式：f(n) = g(n) + h(n)
- f(n) = 从起点到终点的总代价
- g(n) = 从起点到当前节点的代价
- h(n) = 从当前节点到终点的估计代价（启发函数）

启发函数选择：
- 曼哈顿距离（ Manhattan）：|dx| + |dz|
- 欧几里得距离（Euclidean）：√(dx² + dz²)
- 对角线距离（Diagonal）：max(|dx|, |dz|)
```

### A* 实现

```java
// PathNodeNavigator.java A* 搜索
public class Path findPathTo(double targetX, double targetY, double targetZ) {
    // 1. 初始化
    PathNode startNode = this.getNode(
        (int)Math.floor(entity.x),
        (int)Math.floor(entity.y),
        (int)Math.floor(entity.z)
    );
    
    PathNode targetNode = this.getNode(
        (int)Math.floor(targetX),
        (int)Math.floor(targetY),
        (int)Math.floor(targetZ)
    );
    
    // 2. 优先队列（按 f 值排序）
    PriorityQueue<PathNode> openSet = new PriorityQueue<>();
    startNode.distanceToTarget = startNode.distanceTo(targetNode);
    openSet.add(startNode);
    
    // 3. 已访问集合
    Set<PathNode> closedSet = new HashSet<>();
    
    // 4. A* 搜索循环
    while (!openSet.isEmpty()) {
        // 取最小 f 值的节点
        PathNode current = openSet.poll();
        
        // 如果是目标，结束
        if (current.equals(targetNode)) {
            return reconstructPath(current);
        }
        
        closedSet.add(current);
        
        // 遍历邻居
        for (PathNode neighbor : this.getNeighbors(current)) {
            if (closedSet.contains(neighbor)) {
                continue;
            }
            
            // 计算 g 值
            float tentativeG = current.gScore + current.distanceTo(neighbor);
            
            if (tentativeG < neighbor.gScore) {
                // 更新路径
                neighbor.previous = current;
                neighbor.gScore = tentativeG;
                neighbor.distanceToTarget = neighbor.gScore + neighbor.distanceTo(targetNode);
                
                if (!openSet.contains(neighbor)) {
                    openSet.add(neighbor);
                }
            }
        }
    }
    
    // 没找到路径
    return null;
}
```

### 邻居节点获取

```java
// 获取邻居节点
protected List<PathNode> getNeighbors(PathNode node) {
    List<PathNode> neighbors = new ArrayList<>();
    
    // 搜索 3x3 的方块（考虑上下层）
    for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
            for (int dz = -1; dz <= 1; dz++) {
                if (dx == 0 && dy == 0 && dz == 0) {
                    continue;
                }
                
                PathNode neighbor = this.getNode(node.x + dx, node.y + dy, node.z + dz);
                
                if (neighbor != null && this.canPathThrough(neighbor)) {
                    neighbors.add(neighbor);
                }
            }
        }
    }
    
    return neighbors;
}

// 检查是否可以通行
protected boolean canPathThrough(PathNode node) {
    // 检查节点类型
    if (node.type == PathNodeType.BLOCKED) {
        return false;
    }
    
    // 检查方块是否阻挡
    BlockState state = this.world.getBlockState(node.x, node.y, node.z);
    return !state.blocksMovement();
}
```

## 6. EntityNavigation 子类

### LandNavigation 陆地导航

```java
// LandNavigation.java
public class LandNavigation extends Navigation {
    
    @Override
    protected Path findPathTo(double targetX, double targetY, double targetZ) {
        return this.nodeNavigator.findPath(
            this.entity,
            targetX, targetY, targetZ,
            this.maxPathLength
        );
    }
    
    @Override
    protected boolean canWalkOnWater(PathNodeType type) {
        // 陆地生物不能在水上行走
        return false;
    }
}
```

### WaterNavigation 水中导航

```java
// WaterNavigation.java
public class WaterNavigation extends Navigation {
    
    @Override
    protected boolean isValidPosition(PathNode node) {
        // 水中导航需要检查水下环境
        return node.type == PathNodeType.WATER || 
               node.type == PathNodeType.WATER_BORDER;
    }
    
    @Override
    protected boolean canWalkOnWater(PathNodeType type) {
        return true;  // 鱼可以在水面上移动
    }
}
```

### FlyingNavigation 飞行导航

```java
// FlyingNavigation.java
public class FlyingNavigation extends Navigation {
    
    @Override
    protected boolean isValidPosition(PathNode node) {
        // 飞行生物不受地面限制
        return node.type != PathNodeType.BLOCKED;
    }
    
    @Override
    protected float getDistanceFactor(PathNode from, PathNode to) {
        // 飞行生物可以直接斜向移动
        return 1.0f;
    }
}
```

## 7. NodeProcessor 节点处理器

### LandNodeProcessor

```java
// LandNodeProcessor.java
public class LandNodeProcessor extends NodeProcessor {
    
    @Override
    public PathNode getNode(int x, int y, int z) {
        // 创建节点
        PathNode node = this.createNode(x, y, z);
        
        // 计算节点类型
        node.type = this.getNodeType(x, y, z);
        
        // 检查惩罚
        node.penalty = this.world.getBlockState(x, y, z).getOpacity();
        
        return node;
    }
    
    @Override
    protected PathNodeType getNodeType(int x, int y, int z) {
        BlockState state = this.world.getBlockState(x, y, z);
        Block block = state.getBlock();
        
        // 检查是否阻挡
        if (state.blocksMovement()) {
            // 检查是否是门或栅栏
            if (block instanceof DoorBlock || block instanceof FenceBlock) {
                return PathNodeType.OPEN;
            }
            return PathNodeType.BLOCKED;
        }
        
        // 检查液体
        if (state.isIn(FluidTags.WATER)) {
            return PathNodeType.WATER;
        }
        
        if (state.isIn(FluidTags.LAVA)) {
            return PathNodeType.LAVA;
        }
        
        return PathNodeType.WALKABLE;
    }
}
```

## 8. MoveControl 移动控制

### OrdinaryMoveControl 陆地移动

```java
// OrdinaryMoveControl.java
public class OrdinaryMoveControl extends MoveControl {
    
    @Override
    public void tick() {
        if (!this.active) {
            return;
        }
        
        // 获取当前朝向和目标朝向
        float currentYaw = this.entity.yaw;
        float targetYaw = this.wantedYaw;
        
        // 计算角度差
        float angleDiff = MathHelper.wrapDegrees(targetYaw - currentYaw);
        
        // 转向
        float turnSpeed = 0.1f;
        float newYaw = currentYaw + angleDiff * turnSpeed;
        this.entity.setYaw(newYaw);
        
        // 移动
        if (angleDiff != 0) {
            this.entity.setForwardSpeed(this.speed);
        }
        
        // 跳跃
        if (this.entity.isOnGround() && this.jumpVelocityMultiplier > 0) {
            this.entity.jump();
        }
    }
}
```

## Mermaid 图表：Navigation 系统架构

```mermaid
flowchart TB
    subgraph Input["输入"]
        A1["startMovingTo<br/>开始移动"]
        A2["Entity target<br/>目标实体"]
    end
    
    subgraph PathFinding["寻路"]
        B1["findPath()<br/>查找路径"]
        B2["A* Algorithm<br/>A* 算法"]
        B3["Path returned<br/>返回路径"]
    end
    
    subgraph Execution["执行"]
        C1["tick()<br/>每 tick 更新"]
        C2["moveToNextNode()<br/>移动到节点"]
        C3["MoveControl<br/>移动控制"]
        C4["Entity position<br/>实体位置更新"]
    end
    
    subgraph Feedback["反馈"]
        D1["hasReached?<br/>到达?"]
        D2["stuck?<br/>卡住?"}
        D3["repath<br/>重新寻路"]
    end
    
    Input --> PathFinding
    PathFinding --> Execution
    Execution --> Feedback
    Feedback -->|"未到达| Execution
    Feedback -->|"到达| End["完成"]
    Feedback -->|"卡住| PathFinding
```

## 实战演示：创建自定义 Navigation

### 需求

- 创建一个可以在墙上行走的生物
- 需要修改 Navigation 以支持垂直行走

### 实现

```java
// WallWalkerNavigation.java
public class WallWalkerNavigation extends Navigation {
    
    public WallWalkerNavigation(MobEntity entity, World world) {
        super(entity, world);
    }
    
    @Override
    protected Path findPathTo(double targetX, double targetY, double targetZ) {
        // 使用支持墙壁行走的节点处理器
        return this.nodeNavigator.findPath(
            this.entity,
            targetX, targetY, targetZ,
            this.maxPathLength
        );
    }
    
    @Override
    protected boolean isPositionProhibited(PathNode node) {
        // 墙壁行者可以穿过墙壁（但不是完全阻挡的方块）
        BlockState state = this.world.getBlockState(node.x, node.y, node.z);
        return state.blocksMovement();
    }
}

// WallWalkerNavigationFactory.java
public class WallWalkerNavigationFactory implements NavigationFactory {
    
    @Override
    public Navigation create(MobEntity entity, World world) {
        return new WallWalkerNavigation(entity, world);
    }
}

// 注册到 Entity
public class WallWalkerEntity extends MobEntity {
    
    @Override
    protected Navigation createNavigation() {
        return new WallWalkerNavigation(this, this.getWorld());
    }
}
```

## 课后自查

完成本章学习后，你应该能够：

- [ ] 解释 PathNode 和 Path 的区别
- [ ] 理解 Navigation 的工作流程
- [ ] 了解 A* 寻路算法的基本原理
- [ ] 掌握不同 Navigation 子类的特点
- [ ] 理解 NodeProcessor 的作用
- [ ] 能够创建自定义 Navigation

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 路径节点 | PathNode | 路径上的一个位置点 |
| 路径 | Path | 从起点到终点的节点序列 |
| 导航器 | Navigation | 负责找路和移动的组件 |
| A* 算法 | A* Algorithm | 启发式搜索寻路算法 |
| 节点处理器 | NodeProcessor | 处理节点类型的组件 |
| 移动控制 | MoveControl | 控制实体物理移动的组件 |

---

**参考源码路径**：

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\pathing\Path.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\pathing\PathNode.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\pathing\EntityNavigation.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\pathing\PathNodeNavigator.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\ai\pathing\LandNodeProcessor.java`
