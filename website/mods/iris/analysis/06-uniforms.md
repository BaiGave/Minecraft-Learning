# Iris Uniform 系统

> 统一变量管理与更新机制

## 1. 概述

Iris 的 Uniform 系统负责向着色器提供各种游戏状态数据，包括相机、生物群系、时间、光照等。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `CommonUniforms` | `uniforms/CommonUniforms.java` |
| `CameraUniforms` | `uniforms/CameraUniforms.java` |
| `BiomeUniforms` | `uniforms/BiomeUniforms.java` |
| `MatrixUniforms` | `uniforms/MatrixUniforms.java` |
| `CustomUniforms` | `uniforms/custom/CustomUniforms.java` |

---

## 2. Uniform 更新频率

```startLine:1:20:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/gl/uniform/UniformUpdateFrequency.java
public enum UniformUpdateFrequency {
    /** 仅设置一次 */
    ONCE,
    
    /** 每帧更新 */
    PER_FRAME,
    
    /** 每游戏刻更新 */
    PER_TICK,
    
    /** 自定义更新 */
    CUSTOM
}
```

---

## 3. CommonUniforms

提供着色器需要的所有通用 Uniform：

```startLine:111:171:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/CommonUniforms.java
public static void addCommonUniforms(DynamicUniformHolder uniforms, IdMap idMap, 
                                    PackDirectives directives, FrameUpdateNotifier updateNotifier, 
                                    FogMode fogMode) {
    addNonDynamicUniforms(uniforms, idMap, directives, updateNotifier);
    addDynamicUniforms(uniforms, fogMode);
}

public static void addNonDynamicUniforms(UniformHolder uniforms, IdMap idMap, 
                                       PackDirectives directives, FrameUpdateNotifier updateNotifier) {
    // 相机 Uniform
    CameraUniforms.addCameraUniforms(uniforms, updateNotifier);
    
    // 视口 Uniform
    ViewportUniforms.addViewportUniforms(uniforms);
    
    // 世界时间 Uniform
    WorldTimeUniforms.addWorldTimeUniforms(uniforms);
    
    // 系统时间 Uniform
    SystemTimeUniforms.addSystemTimeUniforms(uniforms);
    
    // 生物群系 Uniform
    BiomeUniforms.addBiomeUniforms(uniforms);
    
    // 天体 Uniform
    new CelestialUniforms(directives.getSunPathRotation()).addCelestialUniforms(uniforms);
    
    // Iris 特有 Uniform
    IrisExclusiveUniforms.addIrisExclusiveUniforms(uniforms);
    
    // 时间 Uniform
    IrisTimeUniforms.addTimeUniforms(uniforms);
    
    // 矩阵 Uniform
    MatrixUniforms.addMatrixUniforms(uniforms, directives);
    
    // ID 映射 Uniform
    IdMapUniforms.addIdMapUniforms(updateNotifier, uniforms, idMap, directives.isOldHandLight());
}
```

### 3.1 动态 Uniform

```startLine:63:109:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/CommonUniforms.java
public static void addDynamicUniforms(DynamicUniformHolder uniforms, FogMode fogMode) {
    // 雾 Uniform
    FogUniforms.addFogUniforms(uniforms, fogMode);
    IrisInternalUniforms.addFogUniforms(uniforms, fogMode);
    
    // 实体 ID
    uniforms.uniform1i("entityId", 
        CapturedRenderingState.INSTANCE::getCurrentRenderedEntity, 
        StateUpdateNotifiers.fallbackEntityNotifier);
    
    // 纹理尺寸
    uniforms.uniform2i("atlasSize", () -> {
        int glId = RenderSystem.getShaderTexture(0);
        AbstractTexture texture = TextureTracker.INSTANCE.getTexture(glId);
        if (texture instanceof TextureAtlas atlas) {
            return new Vector2i(atlasAccessor.callGetWidth(), atlasAccessor.callGetHeight());
        }
        return ZERO_VECTOR_2i;
    }, listener -> {});
    
    // 混合函数
    uniforms.uniform4i("blendFunc", () -> {
        GlStateManager.BlendState blend = GlStateManagerAccessor.getBLEND();
        if (((BooleanStateAccessor) blend.mode).isEnabled()) {
            return new Vector4i(blend.srcRgb, blend.dstRgb, blend.srcAlpha, blend.dstAlpha);
        }
        return ZERO_VECTOR_4i;
    }, StateUpdateNotifiers.blendFuncNotifier);
    
    // 渲染阶段
    uniforms.uniform1i("renderStage", 
        () -> GbufferPrograms.getCurrentPhase().ordinal(), 
        StateUpdateNotifiers.phaseChangeNotifier);
}
```

---

## 4. 相机 Uniform

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/CameraUniforms.java
public class CameraUniforms {
    public static void addCameraUniforms(UniformHolder uniforms, FrameUpdateNotifier updateNotifier) {
        // 世界空间相机位置
        uniforms.uniform3d(PER_FRAME, "cameraPosition", CameraUniforms::getCameraPosition);
        
        // 平滑相机位置
        uniforms.uniform3d(PER_FRAME, "cameraPositionSmooth", CameraUniforms::getCameraPositionSmooth);
        
        // 相机变换矩阵
        uniforms.uniformMatrix4f(PER_FRAME, false, "modelViewMatrix", 
            CapturedRenderingState.INSTANCE::getGbufferModelView);
        
        // 投影矩阵
        uniforms.uniformMatrix4f(PER_FRAME, false, "projectionMatrix", 
            CapturedRenderingState.INSTANCE::getGbufferProjection);
    }
    
    private static Vector3d getCameraPosition() {
        Vector3d pos = CapturedRenderingState.INSTANCE.getCameraPosition();
        // 应用偏移
        return new Vector3d(pos.x - CameraUniforms.getDiffX(), 
                          pos.y - CameraUniforms.getDiffY(), 
                          pos.z - CameraUniforms.getDiffZ());
    }
}
```

---

## 5. 天体 Uniform

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/CelestialUniforms.java
public class CelestialUniforms {
    private final float sunPathRotation;
    
    public void addCelestialUniforms(UniformHolder uniforms) {
        uniforms.uniform1f(PER_FRAME, "sunAngle", this::getSunAngle);
        uniforms.uniform1f(PER_FRAME, "moonAngle", this::getMoonAngle);
        uniforms.uniform1f(PER_FRAME, "sunPathRotation", () -> sunPathRotation);
        
        // 太阳位置 (世界空间)
        uniforms.uniform3d(PER_FRAME, "sunPosition", this::getSunPosition);
        uniforms.uniform3d(PER_FRAME, "moonPosition", this::getMoonPosition);
    }
    
    private double getSunAngle() {
        // 获取天空角度
        float skyAngle = getLevel().getTimeOfDay(CapturedRenderingState.INSTANCE.getTickDelta());
        
        // 调整到 [0, 1) 范围
        if (skyAngle < 0.25f) {
            return skyAngle + 0.75f;
        } else {
            return skyAngle - 0.25f;
        }
    }
    
    private Vector3d getSunPosition() {
        Vector3d cameraPos = CameraUniforms.getCameraPosition();
        
        // 计算太阳相对于相机的位置
        double sunAngle = getSunAngle() * 2 * Math.PI;
        double sunHeight = Math.sin(sunAngle);
        double sunX = Math.cos(sunAngle);
        double sunZ = Math.sin(sunAngle);
        
        return new Vector3d(
            cameraPos.x + sunX * 1000,
            cameraPos.y + sunHeight * 1000,
            cameraPos.z + sunZ * 1000
        );
    }
}
```

---

## 6. 矩阵 Uniform

```startLine:1:50:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/MatrixUniforms.java
public class MatrixUniforms {
    public static void addMatrixUniforms(UniformHolder uniforms, PackDirectives directives) {
        // GBuffer 矩阵
        uniforms.uniformMatrix4f(PER_FRAME, false, "gbufferModelView", 
            CapturedRenderingState.INSTANCE::getGbufferModelView);
        uniforms.uniformMatrix4f(PER_FRAME, false, "gbufferModelViewInverse", 
            CapturedRenderingState.INSTANCE::getGbufferModelViewInverse);
        uniforms.uniformMatrix4f(PER_FRAME, false, "gbufferProjection", 
            CapturedRenderingState.INSTANCE::getGbufferProjection);
        uniforms.uniformMatrix4f(PER_FRAME, false, "gbufferProjectionInverse", 
            CapturedRenderingState.INSTANCE::getGbufferProjectionInverse);
        
        // 阴影矩阵
        uniforms.uniformMatrix4f(PER_FRAME, false, "shadowModelView", 
            ShadowRenderer::getShadowModelView);
        uniforms.uniformMatrix4f(PER_FRAME, false, "shadowProjection", 
            ShadowRenderer::getShadowProjection);
    }
}
```

---

## 7. 自定义 Uniform

### 7.1 CustomUniforms

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/custom/CustomUniforms.java
public class CustomUniforms {
    private final Map<String, CustomUniformHolder> uniforms = new HashMap<>();
    private final Builder builder;
    
    public static class Builder {
        private final List<CustomUniformDefinition> definitions = new ArrayList<>();
        
        public Builder uniform1f(String name, Supplier<Float> supplier) {
            definitions.add(new CustomUniformDefinition(name, Type.FLOAT, () -> new float[]{supplier.get()}));
            return this;
        }
        
        public Builder uniform2f(String name, Supplier<Vector2f> supplier) {
            definitions.add(new CustomUniformDefinition(name, Type.VECTOR_2, () -> {
                Vector2f v = supplier.get();
                return new float[]{v.x, v.y};
            }));
            return this;
        }
        
        public CustomUniforms build(UniformFactory factory) {
            for (CustomUniformDefinition def : definitions) {
                CustomUniformHolder holder = factory.createHolder(def);
                uniforms.put(def.name, holder);
            }
            return new CustomUniforms(uniforms);
        }
    }
    
    public void push(Program program) {
        for (CustomUniformHolder holder : uniforms.values()) {
            holder.push(program);
        }
    }
    
    public void update() {
        for (CustomUniformHolder holder : uniforms.values()) {
            holder.update();
        }
    }
}
```

### 7.2 缓存的 Uniform

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/custom/cached/CachedUniform.java
public class CachedUniform<T> {
    private final Supplier<T> supplier;
    private final UniformPusher<T> pusher;
    private T cachedValue;
    private boolean hasUpdated = false;
    
    public CachedUniform(Supplier<T> supplier, UniformPusher<T> pusher) {
        this.supplier = supplier;
        this.pusher = pusher;
    }
    
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
    
    private static boolean equals(Object a, Object b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }
}
```

---

## 8. CapturedRenderingState

捕获的渲染状态：

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/CapturedRenderingState.java
public class CapturedRenderingState {
    public static final CapturedRenderingState INSTANCE = new CapturedRenderingState();
    
    private Matrix4f gbufferModelView;
    private Matrix4f gbufferModelViewInverse;
    private Matrix4f gbufferProjection;
    private Matrix4f gbufferProjectionInverse;
    
    private Vector3d cameraPosition;
    private Vector3d fogColor;
    
    private float tickDelta;
    
    private int currentRenderedEntity;
    
    private CapturedRenderingState() {}
    
    public void captureMatrices(Matrix4f modelView, Matrix4f projection) {
        this.gbufferModelView = new Matrix4f(modelView);
        this.gbufferProjection = new Matrix4f(projection);
        this.gbufferModelViewInverse = new Matrix4f(modelView).invert();
        this.gbufferProjectionInverse = new Matrix4f(projection).invert();
    }
    
    public void captureCameraPosition(Vector3d position) {
        this.cameraPosition = position;
    }
}
```

---

## 9. UniformHolder

### 9.1 创建 Uniform

```startLine:1:50:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/gl/uniform/UniformHolder.java
public interface UniformHolder {
    // 单值 Uniform
    UniformHolder uniform1i(String name, Supplier<Integer> supplier, ...);
    UniformHolder uniform1f(String name, Supplier<Float> supplier, ...);
    UniformHolder uniform1b(String name, Supplier<Boolean> supplier, ...);
    
    // 向量 Uniform
    UniformHolder uniform2i(String name, Supplier<Vector2i> supplier, ...);
    UniformHolder uniform2f(String name, Supplier<Vector2f> supplier, ...);
    UniformHolder uniform3d(String name, Supplier<Vector3d> supplier, ...);
    UniformHolder uniform4f(String name, Supplier<Vector4f> supplier, ...);
    
    // 矩阵 Uniform
    UniformHolder uniformMatrix4f(boolean transpose, String name, Supplier<Matrix4f> supplier, ...);
}
```

---

## 10. Uniform 推送机制

```startLine:250:310:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/CompositeRenderer.java
public void renderAll() {
    FullScreenQuadRenderer.INSTANCE.begin();
    
    for (Pass renderPass : passes) {
        // ...
        
        renderPass.program.use();
        
        // 推送自定义 Uniform
        this.customUniforms.push(renderPass.program);
        
        // ...
    }
}
```

---

## 11. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-rendering-pipeline.md](02-rendering-pipeline.md) - 渲染管线
- [03-shaderpack-system.md](03-shaderpack-system.md) - 着色器包系统
- [04-shadow-system.md](04-shadow-system.md) - 阴影系统
- [05-framebuffer-texture.md](05-framebuffer-texture.md) - 帧缓冲与纹理

---

*生成时间: 2026-03-19*
