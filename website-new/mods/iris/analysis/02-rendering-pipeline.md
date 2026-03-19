# Iris 渲染管线

> GBuffer、Composite Pass 与渲染阶段管理

## 1. 概述

Iris 的渲染管线是整个光影系统的核心，负责协调 GBuffer 渲染、阴影渲染、合成 Pass 和最终输出。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `IrisRenderingPipeline` | `pipeline/IrisRenderingPipeline.java` |
| `CompositeRenderer` | `pipeline/CompositeRenderer.java` |
| `FinalPassRenderer` | `pipeline/FinalPassRenderer.java` |
| `SodiumTerrainPipeline` | `pipeline/SodiumTerrainPipeline.java` |

---

## 2. 渲染阶段 (WorldRenderingPhase)

```startLine:1:40:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/WorldRenderingPhase.java
public enum WorldRenderingPhase {
    NONE,           // 无阶段
    
    // 主世界渲染阶段
    SKY,            // 天空渲染
    SKIP,           // 跳过
    TERRAIN,        // 地形
    ENTITIES,       // 实体
    BLOCK_ENTITIES, // 方块实体
    TRANSLUCENT,    // 半透明
    
    // 合成阶段
    SHADOW,         // 阴影
    PREPARE,        // 准备
    DEFERRED,       // 延迟
    TRANSLUCENT_SORT, // 半透明排序
    COMPOSITE,      // 合成
    FINAL,          // 最终
    AFTER_SKY,      // 天空之后
}
```

---

## 3. IrisRenderingPipeline 核心结构

```startLine:118:180:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/IrisRenderingPipeline.java
public class IrisRenderingPipeline implements WorldRenderingPipeline {
    // 渲染目标管理
    private final RenderTargets renderTargets;
    
    // 着色器映射
    private final ShaderMap shaderMap;
    
    // 自定义 Uniform
    private final CustomUniforms customUniforms;
    
    // 阴影系统
    private final ShadowRenderer shadowRenderer;
    private final ShadowCompositeRenderer shadowCompositeRenderer;
    private final ShadowRenderTargets shadowRenderTargets;
    
    // Composite 渲染器 (按阶段分组)
    private final CompositeRenderer beginRenderer;
    private final CompositeRenderer prepareRenderer;
    private final CompositeRenderer deferredRenderer;
    private final CompositeRenderer compositeRenderer;
    private final FinalPassRenderer finalPassRenderer;
    
    // 深度采样
    private final CenterDepthSampler centerDepthSampler;
    
    // Sodium 地形管线
    private final SodiumTerrainPipeline sodiumTerrainPipeline;
}
```

### 3.1 渲染目标结构

```startLine:42:75:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/targets/RenderTargets.java
public class RenderTargets {
    // 主渲染目标数组 (colortex0-15)
    private final RenderTarget[] targets;
    
    // 深度纹理
    private final DepthTexture noTranslucents;   // depthtex1 (不含半透明)
    private final DepthTexture noHand;           // depthtex2 (不含手)
    
    // 深度帧缓冲
    private final GlFramebuffer depthSourceFb;
    private final GlFramebuffer noTranslucentsDestFb;
    private final GlFramebuffer noHandDestFb;
}
```

---

## 4. 渲染流程详解

### 4.1 beginLevelRendering()

```startLine:848:1015:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/IrisRenderingPipeline.java
public void beginLevelRendering() {
    isRenderingWorld = true;
    
    // 1. 清除自定义图像
    for (GlImage image : clearImages) {
        ARBClearTexture.glClearTexImage(...);
    }
    
    // 2. 阴影 Pass (如果启用)
    if (shadowRenderTargets != null) {
        // - 清除深度缓冲
        // - 执行阴影计算着色器
        // - 清除颜色缓冲
    }
    
    // 3. 更新帧 Uniform
    updateNotifier.onNewFrame();
    customUniforms.update();
    
    // 4. 调整渲染目标大小
    if (changed) {
        // 重建帧缓冲
    }
    
    // 5. 清除渲染目标
    for (ClearPass clearPass : passes) {
        clearPass.execute(fogColor);
    }
    
    // 6. 切换到主帧缓冲
    main.bindWrite(true);
    
    // 7. 执行 Setup 计算
    for (ComputeProgram program : setup) {
        program.use();
        program.dispatch(1, 1);
    }
    
    // 8. Begin Pass
    isBeforeTranslucent = true;
    beginRenderer.renderAll();
    
    // 9. 渲染地平线
    horizonRenderer.renderHorizon(...);
}
```

### 4.2 renderShadows()

```startLine:1018:1024:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/IrisRenderingPipeline.java
public void renderShadows(LevelRendererAccessor worldRenderer, Camera playerCamera) {
    // 阴影渲染
    if (shadowRenderer != null) {
        this.shadowRenderer.renderShadows(worldRenderer, playerCamera);
    }
    
    // Prepare Pass
    prepareRenderer.renderAll();
}
```

### 4.3 beginTranslucents()

```startLine:1052:1078:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/IrisRenderingPipeline.java
public void beginTranslucents() {
    isBeforeTranslucent = false;
    
    // 复制深度纹理 (不含半透明)
    renderTargets.copyPreTranslucentDepth();
    
    // Deferred Pass
    deferredRenderer.renderAll();
    
    // 启用混合
    RenderSystem.enableBlend();
}
```

### 4.4 finalizeLevelRendering()

```startLine:1081:1085:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/IrisRenderingPipeline.java
public void finalizeLevelRendering() {
    isRenderingWorld = false;
    
    // Composite Pass
    compositeRenderer.renderAll();
    
    // Final Pass
    finalPassRenderer.renderFinalPass();
}
```

---

## 5. CompositeRenderer

```startLine:59:100:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/CompositeRenderer.java
public class CompositeRenderer {
    private final RenderTargets renderTargets;
    private final ImmutableList<Pass> passes;
    private final TextureAccess noiseTexture;
    private final CenterDepthSampler centerDepthSampler;
    private final CustomUniforms customUniforms;
    
    public void renderAll() {
        RenderSystem.disableBlend();
        FullScreenQuadRenderer.INSTANCE.begin();
        
        for (Pass renderPass : passes) {
            // 1. 执行计算着色器
            for (ComputeProgram computeProgram : renderPass.computes) {
                if (computeProgram != null) {
                    computeProgram.use();
                    this.customUniforms.push(computeProgram);
                    computeProgram.dispatch(main.width, main.height);
                }
            }
            
            // 2. 内存屏障
            IrisRenderSystem.memoryBarrier(...);
            
            // 3. 设置视口
            RenderSystem.viewport(beginWidth, beginHeight, ...);
            
            // 4. 绑定帧缓冲
            renderPass.framebuffer.bind();
            renderPass.program.use();
            
            // 5. 设置混合模式
            if (renderPass.blendModeOverride != null) {
                renderPass.blendModeOverride.apply();
            }
            
            // 6. 上传 Uniform
            this.customUniforms.push(renderPass.program);
            
            // 7. 渲染全屏四边形
            FullScreenQuadRenderer.INSTANCE.renderQuad();
        }
        
        FullScreenQuadRenderer.INSTANCE.end();
    }
}
```

### 5.1 Pass 结构

```startLine:434:455:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/CompositeRenderer.java
private static class Pass {
    int[] drawBuffers;                    // 绘制缓冲
    int viewWidth;                        // 视口宽度
    int viewHeight;                       // 视口高度
    Program program;                      // 着色器程序
    BlendModeOverride blendModeOverride;  // 混合模式覆盖
    ComputeProgram[] computes;            // 计算着色器
    GlFramebuffer framebuffer;           // 帧缓冲
    ViewportData viewportScale;          // 视口缩放
}
```

---

## 6. GBuffer 系统

### 6.1 渲染目标布局

```
┌──────────────────────────────────────────────────────────────┐
│                    Minecraft 帧缓冲                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Depth Texture (depthtex0)              │  │
│  │                    深度 + 模板                           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Color Texture (colortex0)              │  │
│  │                    场景颜色                             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Iris 中间缓冲                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  depthtex1   │ │  depthtex2   │ │  colortex1   │  ...   │
│  │ 不含半透明   │ │   不含手    │ │  自定义1     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    阴影贴图                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Shadow Map (shadowmap)                      │  │
│  │                    深度 + 颜色                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 深度纹理复制

```startLine:209:230:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/targets/RenderTargets.java
public void copyPreTranslucentDepth() {
    if (translucentDepthDirty) {
        // 直接从主深度纹理复制
        RenderSystem.bindTexture(noTranslucents.getTextureId());
        depthSourceFb.bindAsReadBuffer();
        IrisRenderSystem.copyTexImage2D(..., cachedWidth, cachedHeight, 0);
    } else {
        // 使用优化策略复制
        copyStrategy.copy(depthSourceFb, getDepthTexture(), 
                        noTranslucentsDestFb, noTranslucents.getTextureId(),
                        getCurrentWidth(), getCurrentHeight());
    }
}
```

---

## 7. BufferFlipper (缓冲翻转)

用于在主/备用纹理之间切换：

```startLine:1:50:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/targets/BufferFlipper.java
public class BufferFlipper {
    private final Map<Integer, Boolean> flipped = new HashMap<>();
    
    public void flip(int buffer) {
        flipped.compute(buffer, (k, v) -> v == null || !v);
    }
    
    public ImmutableSet<Integer> snapshot() {
        // 返回所有"翻转"状态的缓冲
    }
}
```

---

## 8. 渲染阶段顺序

```
┌─────────────────────────────────────────────────────────────┐
│                  完整渲染阶段顺序                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Setup] ──► Setup Compute                                 │
│                                                              │
│  [Begin] ──► Begin Composite Passes                        │
│             ├── composite0                                   │
│             ├── composite1                                   │
│             └── ...                                          │
│                                                              │
│  [Shadow] ──► Shadow Render                                  │
│             ├── Shadow Map Generation                        │
│             └── ShadowComposite Passes                      │
│                                                              │
│  [Prepare] ─► Prepare Composite Passes                       │
│                                                              │
│  [Terrain] ─► Terrain Pass (由 Sodium 处理)                  │
│             ├── Solid                                        │
│             ├── Cutout                                       │
│             ├── Translucent                                  │
│             └── ...                                          │
│                                                              │
│  [Deferred] ─► Deferred Composite Passes                    │
│                                                              │
│  [Translucent] ─► Translucent Deferred                      │
│                                                              │
│  [Composite] ─► Composite Passes                            │
│             ├── composite1...N                               │
│             └── shadowcomp1...N                              │
│                                                              │
│  [Final] ──► Final Pass                                     │
│             └── 屏幕输出                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [03-shaderpack-system.md](03-shaderpack-system.md) - 着色器包系统
- [04-shadow-system.md](04-shadow-system.md) - 阴影系统
- [05-framebuffer-texture.md](05-framebuffer-texture.md) - 帧缓冲与纹理

---

*生成时间: 2026-03-19*
