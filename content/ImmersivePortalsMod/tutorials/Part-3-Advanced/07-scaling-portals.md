# 第七章：缩放传送

> **本章目标**：理解空间缩放传送门的原理，掌握巨型传送门和微型传送门的创建方法。

---

## 目录

- [目标](#目标)
- [前置知识](#前置知识)
- [什么是缩放传送门？](#什么是缩放传送门)
- [缩放传送的原理](#缩放传送的原理)
- [巨型传送门 vs 微型传送门](#巨型传送门-vs-微型传送门)
- [缩放传送门示意图](#缩放传送门示意图)
- [代码示例](#代码示例)
- [课后自查](#课后自查)

---

## 目标

学完本章后，你将理解：

1. **什么是缩放传送门** - 通过传送门改变物体大小
2. **缩放因子（scaling）** - 控制空间缩放的比例
3. **巨型传送门（scale > 1）** - 让物体变大的传送门
4. **微型传送门（scale < 1）** - 让物体缩小的传送门
5. **缩放传送的应用场景** - 创意玩法和实用技巧

---

## 前置知识

- 理解传送门实体的基本概念
- 了解传送门的变换原理（参考第二章）
- 知道向量和矩阵的基本运算
- 了解**缩放变换**的概念

---

## 什么是缩放传送门？

### 概念解释

**缩放传送门**是一种特殊的传送门，它不仅改变实体的**位置**，还会改变实体的**大小**。

```
┌─────────────────────────────────────────────────────────────┐
│                    普通传送门 vs 缩放传送门                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  普通传送门（scale = 1.0）                                  │
│  ┌─────────────────┐                                        │
│  │                 │                                        │
│  │    [玩家 ●]     │                                        │
│  │                 │                                        │
│  └─────────────────┘                                        │
│         ↓ scale = 1.0                                        │
│         ↓ 不改变大小                                          │
│         ↓                                                   │
│  玩家保持原大小                                             │
│                                                               │
│  缩放传送门（scale = 0.5）                                  │
│  ┌─────────────────┐                                        │
│  │                 │                                        │
│  │    [玩家 ●]     │                                        │
│  │                 │                                        │
│  └─────────────────┘                                        │
│         ↓ scale = 0.5                                        │
│         ↓ 缩小到一半                                          │
│         ↓                                                   │
│  玩家缩小到原来的 50%                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 缩放因子（scaling）

每个传送门都有一个 `scaling` 属性：

| scaling 值 | 效果 | 示例应用 |
|------------|------|----------|
| `1.0` | 无缩放（普通传送门） | 标准传送 |
| `> 1.0` | 放大 | 巨人国入口 |
| `< 1.0` | 缩小 | 小人国入口 |
| `0.5` | 缩小到一半 | 缩小效果 |
| `2.0` | 放大到两倍 | 放大效果 |
| `0.25` | 缩小到 1/4 | 微型世界 |
| `4.0` | 放大到 4 倍 | 巨型世界 |

---

## 缩放传送的原理

### 缩放变换数学

缩放传送门的变换公式是：

```
P' = Scale × Rotation × (P - Origin) + Destination
```

其中 **Scale** 就是 `scaling` 属性。

### 缩放变换图解

```
┌─────────────────────────────────────────────────────────────┐
│                    缩放变换示意图                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  输入点 P = (4, 4)                                          │
│  Origin = (2, 2)                                            │
│  局部坐标 L = P - Origin = (2, 2)                           │
│                                                               │
│  scale = 0.5 (缩小)                                         │
│  L' = L × 0.5 = (1, 1)                                     │
│                                                               │
│  scale = 2.0 (放大)                                         │
│  L' = L × 2.0 = (4, 4)                                     │
│                                                               │
│  scale = 1.0 (无缩放)                                       │
│  L' = L × 1.0 = (2, 2)                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 源码解析

```java
// D:\Minecraft-Learning\assets\ImmersivePortalsMod-6.0.6-mc1.21.1\src\main\java\qouteall\imm_ptl\core\portal\Portal.java

/**
 * 缩放传送门的点变换
 */
@Override
public Vec3 transformPoint(Vec3 pos) {
    // 1. 计算局部坐标（相对于传送门原点）
    Vec3 localPos = pos.subtract(getOriginPos());

    // 2. 应用旋转变换
    Vec3 rotated = transformLocalVecNonScale(localPos);

    // 3. 应用缩放变换
    Vec3 scaled = rotated.scale(scaling);

    // 4. 加上目标位置
    return scaled.add(getDestPos());
}

/**
 * 向量缩放变换
 */
@Override
public Vec3 transformLocalVec(Vec3 localVec) {
    // 先应用非缩放的变换（旋转等）
    return transformLocalVecNonScale(localVec).scale(scaling);
}
```

### 实体穿过缩放传送门

当实体穿过缩放传送门时：

1. **位置变换** - 传送到目标位置（按比例）
2. **大小变换** - 实体的碰撞箱和视觉大小按比例缩放
3. **速度变换** - 移动速度也按比例调整

```java
// 实体穿过传送门时的变换
public void teleportEntity(Entity entity, Portal portal) {
    // 获取变换后的位置
    Vec3 newPos = portal.transformPoint(entity.position());

    // 获取缩放因子
    double scale = portal.getScaling();

    // 应用位置
    entity.setPos(newPos);

    // 应用缩放到实体大小
    // 注意：Minecraft 实体的缩放需要特殊处理
    entity.setScale(scale);

    // 调整速度
    Vec3 newVelocity = portal.transformLocalVec(entity.getDeltaMovement())
        .scale(scale);
    entity.setDeltaMovement(newVelocity);
}
```

---

## 巨型传送门 vs 微型传送门

### 巨型传送门（scale > 1）

当你穿过巨型传送门时，你会**变大**。

```
┌─────────────────────────────────────────────────────────────┐
│                    巨型传送门 (scale > 1)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  场景：玩家要进入"巨人王国"                                    │
│                                                               │
│       正常大小的玩家                                           │
│            ●                                                 │
│  ┌─────────────────┐                                        │
│  │   巨型传送门     │                                        │
│  │    scale=3.0   │                                        │
│  └─────────────────┘                                        │
│            ↓                                                 │
│            ↓                                                 │
│       3倍大小的玩家                                           │
│           ●●●                                                │
│                                                               │
│  💡 玩家现在可以踩爆建筑物！                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 微型传送门（scale < 1）

当你穿过微型传送门时，你会**变小**。

```
┌─────────────────────────────────────────────────────────────┐
│                    微型传送门 (scale < 1)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  场景：玩家要进入"小人国"                                      │
│                                                               │
│       正常大小的玩家                                           │
│            ●                                                 │
│  ┌─────────────────┐                                        │
│  │   微型传送门     │                                        │
│  │    scale=0.1    │                                        │
│  └─────────────────┘                                        │
│            ↓                                                 │
│            ↓                                                 │
│       1/10 大小的玩家                                         │
│            ·                                                 │
│                                                               │
│  💡 玩家现在可以探索微观世界！                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 双向传送门的重要性

缩放传送门通常需要**成对**创建：

```
┌─────────────────────────────────────────────────────────────┐
│                    双向缩放传送门系统                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  普通世界 ────────┬────────────────────────────────────     │
│                   │                                        │
│                   │ scale = 3.0                             │
│                   ↓                                        │
│            ┌─────────────┐                                 │
│            │  放大传送门  │                                 │
│            └─────────────┘                                 │
│                   │                                        │
│                   │ scale = 1/3 ≈ 0.333                    │
│                   ↓                                        │
│  巨人王国 ────────┘                                        │
│                                                               │
│  ✅ 从普通世界进入巨人王国（变大）                            │
│  ✅ 从巨人王国返回普通世界（变小回原样）                       │
│                                                               │
│  ⚠️ 注意：返回传送门的 scale 应该是 1/scale！               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 缩放传送门示意图

### 完整工作流程

```mermaid
flowchart LR
    subgraph Normal["普通世界"]
        P1["玩家 ●"]
        A1["放大传送门\nscale=2.0"]
    end

    subgraph Giant["巨人王国"]
        P2["玩家 ◉◉"]
        B1["缩小传送门\nscale=0.5"]
    end

    P1 -->|"穿过 scale=2.0"| A1
    A1 -->|"大小 ×2"| P2
    P2 -->|"穿过 scale=0.5"| B1
    B1 -->|"大小 ×0.5| P1

    style P1 fill:#e3f2fd
    style P2 fill:#fff3e0
    style A1 fill:#c8e6c9
    style B1 fill:#ffcdd2
```

### 不同缩放比例的效果

```
┌─────────────────────────────────────────────────────────────┐
│                    缩放比例效果对比                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  scale = 4.0 (极巨化)                                        │
│  ● ● ● ●                                                      │
│  💡 玩家变成 4 倍大小，可以轻松翻越高山                      │
│                                                               │
│  scale = 2.0 (巨人化)                                        │
│  ● ●                                                          │
│  💡 玩家变成 2 倍大小，一步顶三步                            │
│                                                               │
│  scale = 1.0 (正常)                                           │
│  ●                                                             │
│  💡 普通大小                                                 │
│                                                               │
│  scale = 0.5 (小矮人)                                        │
│      ·                                                        │
│  💡 玩家变成一半大小，需要更小的空间                         │
│                                                               │
│  scale = 0.25 (微型)                                          │
│      .                                                        │
│  💡 玩家变成 1/4 大小，可以进入管道和缝隙                    │
│                                                               │
│  scale = 0.1 (纳米)                                           │
│      ·                                                        │
│  💡 玩家变得非常微小，视野完全不同                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 嵌套缩放传送门

缩放传送门也可以嵌套！

```
┌─────────────────────────────────────────────────────────────┐
│                    嵌套缩放传送门                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 0: scale=1.0  正常大小的世界                          │
│  Layer 1: scale=2.0  2倍大小的世界                          │
│  Layer 2: scale=0.5  1倍大小的世界（2×0.5=1）              │
│                                                               │
│  💡 嵌套缩放可以抵消效果，创建"正常"世界中的"异常"空间       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 代码示例

### 创建缩放传送门

```java
/**
 * 缩放传送门创建示例
 */
public class ScalingPortalExample {

    /**
     * 创建缩放传送门
     *
     * @param world     传送门所在的世界
     * @param position  传送门位置
     * @param destPos   目标位置
     * @param normal    传送门法向量
     * @param width     传送门宽度
     * @param height    传送门高度
     * @param scale     缩放因子（1.0 = 不缩放）
     */
    public static Portal createScalingPortal(
        ServerLevel world,
        Vec3 position,
        Vec3 destPos,
        Vec3 normal,
        double width,
        double height,
        double scale
    ) {
        // 1. 创建传送门实体
        Portal portal = new Portal(Portal.ENTITY_TYPE, world);

        // 2. 设置位置
        portal.setPos(position.x, position.y, position.z);

        // 3. 设置目标维度（同一维度则为自身）
        portal.setDestDim(world.dimension());

        // 4. 设置目标位置
        portal.setDestination(destPos);

        // 5. 设置法向量和轴
        Vec3 up = new Vec3(0, 1, 0);
        if (Math.abs(normal.dot(up)) > 0.99) {
            up = new Vec3(1, 0, 0);
        }
        Vec3 axisW = normal.cross(up).normalize();
        Vec3 axisH = normal.cross(axisW).normalize();

        portal.setAxisW(axisW);
        portal.setAxisH(axisH);

        // 6. 设置尺寸
        portal.setWidth(width);
        portal.setHeight(height);

        // 7. 设置缩放因子 💡 关键！
        portal.setScaling(scale);

        // 8. 添加到世界
        world.addFreshEntity(portal);

        return portal;
    }

    /**
     * 创建"小人国"传送门对
     * 从正常世界进入微小世界，再返回
     */
    public static void createShrinkingWorldPair(ServerLevel world) {
        Vec3 normal = new Vec3(0, 0, 1);
        double scale = 0.1;  // 缩小到 1/10

        // 正常世界 -> 小人国（缩小）
        createScalingPortal(
            world,
            new Vec3(100, 64, 100),   // 正常世界入口位置
            new Vec3(200, 6.4, 200),   // 小人国目标位置（高度也缩小）
            normal,
            3.0,                        // 传送门宽度
            4.0,                        // 传送门高度
            scale                       // scale = 0.1
        );

        // 小人国 -> 正常世界（放大回来）
        createScalingPortal(
            world,
            new Vec3(200, 6.4, 200),   // 小人国入口位置
            new Vec3(100, 64, 100),   // 正常世界目标位置
            normal,
            0.3,                        // 传送门宽度（缩小）
            0.4,                        // 传送门高度（缩小）
            1.0 / scale                 // scale = 10.0
        );
    }

    /**
     * 创建"巨人国"传送门对
     * 从正常世界进入巨大世界，再返回
     */
    public static void createGiantWorldPair(ServerLevel world) {
        Vec3 normal = new Vec3(0, 0, 1);
        double scale = 4.0;  // 放大 4 倍

        // 正常世界 -> 巨人国（放大）
        createScalingPortal(
            world,
            new Vec3(100, 64, 100),
            new Vec3(300, 256, 300),    // 巨人国目标位置（高度放大）
            normal,
            3.0,
            4.0,
            scale                       // scale = 4.0
        );

        // 巨人国 -> 正常世界（缩小回来）
        createScalingPortal(
            world,
            new Vec3(300, 256, 300),
            new Vec3(100, 64, 100),
            normal,
            12.0,                       // 传送门宽度（放大 3×4）
            16.0,                       // 传送门高度（放大 4×4）
            1.0 / scale                 // scale = 0.25
        );
    }
}
```

### 使用 PortalAPI 创建缩放传送门

```java
/**
 * 使用 PortalAPI 创建缩放传送门的示例
 */
public class PortalAPIScalingExample {

    /**
     * 使用 PortalAPI 设置传送门属性
     */
    public static Portal createPortalWithAPI(
        ServerLevel world,
        Vec3 position,
        Vec3 destDim,
        Vec3 destPos,
        double scale
    ) {
        // 1. 创建传送门实体
        Portal portal = new Portal(Portal.ENTITY_TYPE, world);

        // 2. 使用 PortalAPI 设置位置和方向
        // 注意：具体 API 调用可能略有不同，请参考官方文档
        PortalAPI.setPortalPositionAndSize(
            portal,
            position,
            destPos,
            scale  // 缩放因子
        );

        // 3. 设置目标维度
        portal.setDestDim(ResourceKey.create(Registries.DIMENSION, destDim));

        // 4. 设置缩放（如果 API 不支持）
        if (scale != 1.0) {
            portal.setScaling(scale);
        }

        // 5. 添加到世界
        world.addFreshEntity(portal);

        // 6. 同步到客户端
        portal.reloadAndSyncToClient();

        return portal;
    }
}
```

### 反向传送门的缩放计算

```java
/**
 * 创建反向传送门时自动计算缩放
 */
public class ReversePortalScaling {

    /**
     * 创建缩放传送门的反向传送门
     * 反向传送门的缩放应该是原传送门的倒数
     */
    public static Portal createReverseScalingPortal(
        Portal originalPortal,
        ServerLevel targetWorld
    ) {
        // 使用 PortalManipulation 创建反向传送门
        Portal reverse = PortalManipulation.createReversePortal(
            originalPortal,
            Portal.ENTITY_TYPE
        );

        // 重要：反向传送门的缩放应该是原传送门的倒数
        double originalScale = originalPortal.getScaling();
        double reverseScale = 1.0 / originalScale;

        reverse.setScaling(reverseScale);

        // 设置目标维度为原维度
        reverse.setDestDim(originalPortal.level().dimension());

        // 设置目标位置
        reverse.setDestination(originalPortal.getOriginPos());

        // 添加到世界
        targetWorld.addFreshEntity(reverse);

        return reverse;
    }
}
```

---

## 课后自查

完成本章节学习后，请确认你能回答以下问题：

- [ ] **Q1**: 什么是缩放传送门？它与普通传送门的核心区别是什么？

- [ ] **Q2**: 如果一个传送门的 scale = 3.0，穿过它后玩家会变大还是变小？变成原来的多少倍？

- [ ] **Q3**: 为什么缩放传送门通常需要成对创建？返回传送门的 scale 应该是多少？

- [ ] **Q4**: scale = 0.25 和 scale = 4.0 是什么关系？

- [ ] **Q5**: 列举至少 2 个缩放传送门的实际应用场景。

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [02-portal-entity.md](../analysis/02-portal-entity.md) | 传送门实体系统详解 |
| [03-teleportation-system.md](../analysis/03-teleportation-system.md) | 传送系统详解 |
| [05-nested-portals.md](./05-nested-portals.md) | 嵌套传送门 |
| [SUMMARY.md](../analysis/SUMMARY.md) | 架构总结 |

---

## 附录：缩放公式速查

| 公式 | 说明 |
|------|------|
| `L' = L × scale` | 局部坐标缩放 |
| `P' = (P - Origin) × scale + Destination` | 完整点变换 |
| `reverseScale = 1.0 / originalScale` | 反向传送门缩放 |
| `scale > 1` | 放大 |
| `scale < 1` | 缩小 |
| `scale = 1` | 无缩放 |

---

*文档版本：ImmersivePortalsMod 6.0.6, Minecraft 1.21.1*
*最后更新：2026-03-24*
