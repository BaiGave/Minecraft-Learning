# Iris 分析总结

> 核心要点速览

---

## 1. 项目概述

Iris 是 CaffeineMC 开发的高性能 Minecraft 光影 Mod，旨在取代 OptiFine 的着色器支持。

| 属性 | 值 |
|------|-----|
| 版本 | 1.7.3 |
| Minecraft | 1.21 |
| 代码行数 | ~60,000 行 |
| Java 文件 | ~620 个 |
| 许可证 | Polyform Shield |

---

## 2. 核心架构

### 2.1 分层设计

```
┌─────────────────────────────────────────────────────────────┐
│                    渲染管线层                               │
│  • IrisRenderingPipeline - 主协调器                          │
│  • CompositeRenderer - 合成渲染                             │
│  • SodiumTerrainPipeline - 地形集成                         │
├─────────────────────────────────────────────────────────────┤
│                    着色器包层                               │
│  • ShaderPack - 包加载                                      │
│  • ProgramSet - 程序管理                                   │
│  • TransformPatcher - 着色器转换                           │
├─────────────────────────────────────────────────────────────┤
│                    阴影系统                                   │
│  • ShadowRenderer - 阴影渲染                                │
│  • AdvancedShadowCullingFrustum - 高级剔除                   │
├─────────────────────────────────────────────────────────────┤
│                    OpenGL 封装                               │
│  • Program - 着色器程序                                     │
│  • GlFramebuffer - 帧缓冲                                   │
│  • RenderTargets - 多渲染目标                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 渲染流程

```
beginLevelRendering()
    │
    ├── Setup Compute
    │
    ├── Begin Composite Passes
    │
    └── Sky Rendering

renderShadows()
    │
    ├── Create Shadow Frustum
    │
    ├── Terrain Shadow Pass
    │
    ├── Entity Shadow Pass
    │
    └── ShadowComposite Passes

Terrain Rendering (Sodium)
    │
    ├── GBuffer Solid
    │
    ├── GBuffer Cutout
    │
    ├── Deferred Pass
    │
    └── Translucent

beginTranslucents()
    │
    ├── Copy Pre-Translucent Depth
    │
    └── Deferred Pass

finalizeLevelRendering()
    │
    ├── Composite Passes
    │
    └── Final Pass
```

---

## 3. 核心优化技术

### 3.1 视锥体剔除

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/frustum/advanced/AdvancedShadowCullingFrustum.java
public boolean isBoxVisible(double minX, double minY, double minZ,
                           double maxX, double maxY, double maxZ) {
    // 1. 检查光源方向
    Vector4f toLight = shadowLightVector.mul(boxCenter);
    if (toLight.dot(boxCenter) < 0) {
        return false;  // 提前剔除
    }
    
    // 2. 邻居遮挡检测
    return culler.isCulled(minX, minY, minZ, maxX, maxY, maxZ);
}
```

**效果**：显著减少阴影渲染的物体数量。

### 3.2 GBuffer 系统

```
主帧缓冲:
├── depthtex0 (深度 + 模板)
└── colortex0 (颜色)

中间缓冲:
├── depthtex1 (不含半透明深度)
├── depthtex2 (不含手深度)
└── colortex1-15 (自定义)

阴影贴图:
├── shadowmap (阴影深度)
└── shadowcolor0-N (阴影颜色)
```

### 3.3 Uniform 缓存

```startLine:1:50:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/custom/cached/CachedUniform.java
public class CachedUniform<T> {
    private T cachedValue;
    private boolean hasUpdated = false;
    
    public void update() {
        T newValue = supplier.get();
        if (!hasUpdated || !equals(cachedValue, newValue)) {
            cachedValue = newValue;
            hasUpdated = true;
        }
    }
    
    public void push(int location) {
        if (hasUpdated) {
            pusher.push(location, cachedValue);
        }
    }
}
```

**效果**：减少不必要的 Uniform 更新。

---

## 4. 着色器包兼容性

### 4.1 支持的程序

| 类型 | 程序 | 说明 |
|------|------|------|
| GBuffer | gbuffers_terrain | 地形 |
| GBuffer | gbuffers_water | 水 |
| GBuffer | gbuffers_entities | 实体 |
| Composite | composite1-8 | 合成 |
| Shadow | shadow | 阴影 |

### 4.2 属性文件

```
# shaders.properties
shadowMapResolution=2048
shadowDistance=64.0
oldLighting=true
```

### 4.3 ID 映射

- `blocks.properties` - 方块属性映射
- `entity.properties` - 实体 ID
- `item.properties` - 物品 ID
- `particles.properties` - 粒子 ID

---

## 5. 与 Sodium 的关系

| 方面 | Sodium | Iris |
|------|--------|------|
| **目标** | 帧率优化 | 光影支持 |
| **渲染** | 多线程构建 | 着色器渲染 |
| **集成** | SodiumTerrainPipeline | SodiumInterop |
| **依赖** | 可独立运行 | 依赖 Sodium |

### 5.1 SodiumTerrainPipeline

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/SodiumTerrainPipeline.java
public class SodiumTerrainPipeline {
    private final IrisRenderingPipeline iris;
    private final SodiumWorldRenderer sodiumRenderer;
    
    public void renderTerrain(float tickDelta) {
        // 使用 Sodium 的渲染器渲染地形
        sodiumRenderer.render(...);
    }
}
```

---

## 6. 设计亮点

### 6.1 观察者模式

```java
FrameUpdateNotifier.onNewFrame()
    │
    └──► Uniform.update()
         └──► 所有监听的 Uniform 刷新
```

### 6.2 策略模式

```java
DepthCopyStrategy fastest(boolean hasStencil) {
    if (supportsDirectAccess()) {
        return new DirectAccessCopyStrategy();
    }
    return new TexImage2DCopyStrategy();
}
```

### 6.3 工厂模式

```java
ShaderCreator.create(...)
    │
    ├──► ExtendedShader (扩展着色器)
    │
    └──► FallbackShader (后备着色器)
```

---

## 7. 性能对比

| 指标 | OptiFine | Iris |
|------|----------|------|
| 帧率 | 基准 | 相似或更高 |
| 兼容性 | 原生 | 高 |
| 代码质量 | 闭源 | 开源 |
| 可维护性 | N/A | 高 |

---

## 8. 学习价值

Iris 是一个优秀的开源图形渲染项目，适合学习：

1. **延迟渲染**：GBuffer、多渲染目标
2. **着色器系统**：GLSL 预处理、程序管理
3. **阴影优化**：视锥体剔除、Mipmap
4. **性能优化**：Uniform 缓存、深度复制优化
5. **平台兼容**：Mixin、OpenGL 封装

---

## 9. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-rendering-pipeline.md](02-rendering-pipeline.md) - 渲染管线
- [03-shaderpack-system.md](03-shaderpack-system.md) - 着色器包系统
- [04-shadow-system.md](04-shadow-system.md) - 阴影系统
- [05-framebuffer-texture.md](05-framebuffer-texture.md) - 帧缓冲与纹理
- [06-uniforms.md](06-uniforms.md) - Uniform 管理

---

*生成时间: 2026-03-19*
