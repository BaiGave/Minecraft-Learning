# Iris 阴影系统

> 视锥体剔除、阴影渲染与高级优化

## 1. 概述

Iris 的阴影系统是光影效果的核心，通过先进的视锥体剔除算法和优化的阴影贴图生成，实现高质量的动态阴影。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `ShadowRenderer` | `shadows/ShadowRenderer.java` |
| `ShadowCompositeRenderer` | `shadows/ShadowCompositeRenderer.java` |
| `ShadowRenderTargets` | `shadows/ShadowRenderTargets.java` |
| `ShadowMatrices` | `shadows/ShadowMatrices.java` |
| `AdvancedShadowCullingFrustum` | `shadows/frustum/advanced/AdvancedShadowCullingFrustum.java` |

---

## 2. ShadowRenderer 核心结构

```startLine:57:150:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/ShadowRenderer.java
public class ShadowRenderer {
    // 阴影距离参数
    private final float halfPlaneLength;        // 半平面长度
    private final float nearPlane, farPlane;     // 近/远裁剪平面
    private final float voxelDistance;           // 体素距离
    private final float renderDistanceMultiplier; // 渲染距离乘数
    private final int resolution;                // 阴影贴图分辨率
    private final float intervalSize;            // 区间大小
    
    // 渲染控制
    private final boolean shouldRenderTerrain;      // 渲染地形阴影
    private final boolean shouldRenderTranslucent;  // 渲染半透明阴影
    private final boolean shouldRenderEntities;     // 渲染实体阴影
    private final boolean shouldRenderPlayer;      // 渲染玩家阴影
    
    // 剔除状态
    private final ShadowCullState packCullingState;  // 光影包剔除模式
    private FrustumHolder terrainFrustumHolder;      // 地形视锥体
    private FrustumHolder entityFrustumHolder;        // 实体视锥体
    
    // 渲染缓冲
    private final RenderBuffers buffers;
}
```

---

## 3. 渲染流程

### 3.1 renderShadows()

```startLine:355:577:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/ShadowRenderer.java
public void renderShadows(LevelRendererAccessor levelRenderer, Camera playerCamera) {
    // 1. 检查阴影距离
    if (IrisVideoSettings.getOverriddenShadowDistance(...) == 0) {
        return;
    }
    
    ACTIVE = true;
    
    // 2. 创建阴影相机
    PoseStack modelView = createShadowModelView(this.sunPathRotation, this.intervalSize);
    MODELVIEW = new Matrix4f(modelView.last().pose());
    
    // 3. 创建视锥体
    terrainFrustumHolder = createShadowFrustum(renderDistanceMultiplier, terrainFrustumHolder);
    FRUSTUM = terrainFrustumHolder.getFrustum();
    
    // 4. 设置投影矩阵
    Matrix4f shadowProjection = ShadowMatrices.createOrthoMatrix(
        halfPlaneLength, nearPlane, farPlane);
    PROJECTION = shadowProjection;
    
    // 5. 禁用背面剔除（防止山峰无阴影）
    RenderSystem.disableCull();
    
    // 6. 渲染不透明地形
    if (shouldRenderTerrain) {
        levelRenderer.invokeRenderSectionLayer(RenderType.solid(), ...);
        levelRenderer.invokeRenderSectionLayer(RenderType.cutout(), ...);
        levelRenderer.invokeRenderSectionLayer(RenderType.cutoutMipped(), ...);
    }
    
    // 7. 渲染实体
    if (shouldRenderEntities) {
        renderEntities(...);
    }
    
    // 8. 渲染方块实体
    if (shouldRenderBlockEntities) {
        ShadowRenderingState.renderBlockEntities(...);
    }
    
    // 9. 复制半透明深度
    copyPreTranslucentDepth();
    
    // 10. 渲染半透明地形
    if (shouldRenderTranslucent) {
        levelRenderer.invokeRenderSectionLayer(RenderType.translucent(), ...);
    }
    
    // 11. 生成 Mipmap
    generateMipmaps();
    
    // 12. 恢复状态
    RenderSystem.enableCull();
    ACTIVE = false;
}
```

---

## 4. 视锥体剔除系统

### 4.1 视锥体类型

```startLine:270:348:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/ShadowRenderer.java
private FrustumHolder createShadowFrustum(float renderMultiplier, FrustumHolder holder) {
    // 根据配置选择不同的剔除策略
    
    if (packCullingState == ShadowCullState.DISTANCE) {
        // 距离剔除
        return new BoxCullingFrustum(distance);
    }
    
    if (packHasVoxelization) {
        // 体素化检测：高级剔除
        return new AdvancedShadowCullingFrustum(...);
    }
    
    // 标准高级剔除
    return new AdvancedShadowCullingFrustum(...);
}
```

### 4.2 高级视锥体剔除

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/frustum/advanced/AdvancedShadowCullingFrustum.java
public class AdvancedShadowCullingFrustum extends ShadowCullingFrustum {
    private final Vector3f shadowLightVectorFromOrigin;
    private final BoxCuller culler;
    
    public AdvancedShadowCullingFrustum(Matrix4f modelView, Matrix4f projection,
                                        Vector3f shadowLightVector, BoxCuller culler) {
        super(modelView, projection);
        this.shadowLightVectorFromOrigin = shadowLightVector;
        this.culler = culler;
    }
    
    @Override
    public boolean isBoxVisible(double minX, double minY, double minZ,
                               double maxX, double maxY, double maxZ) {
        // 1. 检查 Box 与阴影光源的方向
        Vector4f boxCenter = new Vector4f(
            (float)(minX + maxX) / 2,
            (float)(minY + maxY) / 2,
            (float)(minZ + maxZ) / 2, 1.0f);
        
        // 2. 计算盒子中心到光源的方向
        Vector4f toLight = shadowLightVectorFromOrigin.mul(boxCenter.w(), boxCenter);
        
        // 3. 如果盒子在光源的反方向，提前剔除
        if (toLight.dot(boxCenter) < 0) {
            return false;
        }
        
        // 4. 检查邻居遮挡
        return culler.isCulled(minX, minY, minZ, maxX, maxY, maxZ);
    }
}
```

### 4.3 BoxCuller

用于高效检测盒子是否在视锥体内：

```startLine:1:50:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/frustum/BoxCuller.java
public class BoxCuller {
    private final double distance;
    private double offsetX, offsetY, offsetZ;
    
    public BoxCuller(double distance) {
        this.distance = distance;
    }
    
    public void setPosition(double x, double y, double z) {
        this.offsetX = x;
        this.offsetY = y;
        this.offsetZ = z;
    }
    
    public boolean isCulled(double minX, double minY, double minZ,
                           double maxX, double maxY, double maxZ) {
        // 球形距离检测
        double centerX = (minX + maxX) / 2;
        double centerY = (minY + maxY) / 2;
        double centerZ = (minZ + maxZ) / 2;
        
        double dx = centerX - offsetX;
        double dy = centerY - offsetY;
        double dz = centerZ - offsetZ;
        
        // 球形距离
        double distSq = dx * dx + dy * dy + dz * dz;
        double maxDistSq = distance + Math.sqrt(
            (maxX - minX) * (maxX - minX) +
            (maxY - minY) * (maxY - minY) +
            (maxZ - minZ) * (maxZ - minZ)
        ) / 2;
        
        return distSq > maxDistSq * maxDistSq;
    }
}
```

---

## 5. 阴影矩阵计算

### 5.1 正交投影矩阵

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/ShadowMatrices.java
public class ShadowMatrices {
    public static Matrix4f createOrthoMatrix(float size, float near, float far) {
        Matrix4f ortho = new Matrix4f();
        
        // 正交投影参数
        float range = far - near;
        
        ortho.m00(1.0f / size);    // (right - left) / 2
        ortho.m11(1.0f / size);    // (top - bottom) / 2
        ortho.m22(-2.0f / range);   // -2 / (far - near)
        ortho.m33(1.0f);
        ortho.m23(-(far + near) / range);  // -(far + near) / (far - near)
        
        return ortho;
    }
    
    public static void createModelViewMatrix(PoseStack matrices, float shadowAngle,
                                            float intervalSize, float sunPathRotation,
                                            double cameraX, double cameraY, double cameraZ) {
        matrices.pushPose();
        
        // 1. 移动到相机位置
        matrices.translate(-cameraX, -cameraY, -cameraZ);
        
        // 2. 旋转到光源方向
        float sunAngle = getSunAngle();
        matrices.mulPose(Vector3f.YN.rotationDegrees(sunAngle * 360.0f));
        
        // 3. 应用区间旋转
        if (intervalSize > 1) {
            matrices.mulPose(Vector3f.XN.rotationDegrees(
                Math.floor(sunAngle * intervalSize) * (360.0f / intervalSize)));
        }
        
        matrices.translate(cameraX, cameraY, cameraZ);
    }
}
```

---

## 6. 阴影采样配置

### 6.1 深度采样设置

```startLine:200:268:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/ShadowRenderer.java
private void configureDepthSampler(int glTextureId, 
                                   PackShadowDirectives.DepthSamplingSettings settings) {
    // 1. 硬件过滤
    if (settings.getHardwareFiltering() && !separateHardwareSamplers) {
        // 启用硬件 PCF
        IrisRenderSystem.texParameteri(glTextureId, GL_TEXTURE_2D, 
            GL_TEXTURE_COMPARE_MODE, GL_COMPARE_REF_TO_TEXTURE);
    }
    
    // 2. Swizzle (修复旧光影包兼容)
    IrisRenderSystem.texParameteriv(glTextureId, GL_TEXTURE_2D, 
        GL_TEXTURE_SWIZZLE_RGBA,
        new int[]{GL_RED, GL_RED, GL_RED, GL_ONE});
    
    // 3. 过滤模式
    if (!settings.getNearest()) {
        IrisRenderSystem.texParameteri(glTextureId, GL_TEXTURE_2D, 
            GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        IrisRenderSystem.texParameteri(glTextureId, GL_TEXTURE_2D, 
            GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    } else {
        IrisRenderSystem.texParameteri(glTextureId, GL_TEXTURE_2D, 
            GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        IrisRenderSystem.texParameteri(glTextureId, GL_TEXTURE_2D, 
            GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    }
    
    // 4. Mipmap
    if (settings.getMipmap()) {
        int filteringMode = settings.getNearest() ? 
            GL_NEAREST_MIPMAP_NEAREST : GL_LINEAR_MIPMAP_LINEAR;
        mipmapPasses.add(new MipmapPass(glTextureId, filteringMode));
    }
}
```

---

## 7. ShadowRenderTargets

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/ShadowRenderTargets.java
public class ShadowRenderTargets {
    private final DepthTexture depthTexture;
    private final RenderTarget[] colorTargets;
    private final GlFramebuffer depthSourceFb;
    
    public ShadowRenderTargets(IrisRenderingPipeline pipeline, int resolution, 
                              PackShadowDirectives directives) {
        // 1. 创建深度纹理
        this.depthTexture = new DepthTexture("shadowmap", resolution, resolution);
        
        // 2. 创建颜色目标
        int colorBufferCount = directives.getColorBuffersEnabled();
        this.colorTargets = new RenderTarget[colorBufferCount];
        
        for (int i = 0; i < colorBufferCount; i++) {
            this.colorTargets[i] = new RenderTarget(...);
        }
        
        // 3. 创建帧缓冲
        this.depthSourceFb = createFramebuffer();
    }
    
    public void copyPreTranslucentDepth() {
        // 复制半透明深度
    }
}
```

---

## 8. 剔除模式枚举

```startLine:1:30:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/properties/ShadowCullState.java
public enum ShadowCullState {
    DEFAULT,           // 默认：根据是否检测到体素化自动选择
    DISTANCE,          // 仅距离剔除
    REVERSED,          // 反转剔除（用于特定光影包）
    ADVANCED,          // 高级剔除
    NONE;              // 无剔除
}
```

---

## 9. 性能优化

### 9.1 剔除策略选择

| 策略 | 适用场景 | 性能 |
|------|----------|------|
| **None** | 调试/特殊效果 | 最慢 |
| **Distance** | 远距离阴影 | 快 |
| **Advanced** | 标准使用 | 中等 |
| **Voxelization** | 体素化光影包 | 智能 |

### 9.2 优化技术

1. **实体剔除**：单独的实体视锥体，可以比地形更近
2. **区块剔除**：基于距离的快速剔除
3. **Mipmap 生成**：可选的阴影贴图 Mipmap
4. **硬件过滤**：GPU 端的 PCF 过滤

---

## 10. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-rendering-pipeline.md](02-rendering-pipeline.md) - 渲染管线
- [03-shaderpack-system.md](03-shaderpack-system.md) - 着色器包系统

---

*生成时间: 2026-03-19*
