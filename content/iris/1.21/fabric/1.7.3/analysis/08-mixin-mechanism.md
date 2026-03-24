# Iris Mixin 注入机制分析

> 基于 Iris v1.7.3 源码的 Mixin 注入深度分析

## 项目信息

| 属性 | 值 |
|------|-----|
| Mod 版本 | 1.7.3 |
| Minecraft 版本 | 1.21 |
| Mixin 版本 | 0.8+ |
| 分析日期 | 2026-03-23 |

---

## 文档目录

| 文档 | 说明 |
|------|------|
| [01-architecture-overview.md](01-architecture-overview.md) | 整体架构设计模式、模块划分 |
| [02-rendering-pipeline.md](02-rendering-pipeline.md) | 渲染管线 - GBuffer、Composite Pass |
| [03-shaderpack-system.md](03-shaderpack-system.md) | 着色器包加载与解析 |
| [04-shadow-system.md](04-shadow-system.md) | 阴影系统 - 视锥体剔除、阴影渲染 |
| [05-framebuffer-texture.md](05-framebuffer-texture.md) | 帧缓冲与纹理系统 |
| [06-uniforms.md](06-uniforms.md) | Uniform 管理 |
| [07-sodium-integration.md](07-sodium-integration.md) | Sodium 集成系统 |
| [08-mixin-mechanism.md](08-mixin-mechanism.md) | Mixin 注入机制 |
| [README.md](README.md) | 模块说明 |
| [SUMMARY.md](SUMMARY.md) | 总结文档 |

---

## 1. Mixin 配置架构

### 1.1 配置文件结构

Iris 使用了多个 Mixin 配置文件来组织不同功能的注入：

| 配置文件 | 用途 |
|---------|------|
| `mixins.iris.json` | 主配置，包含 100+ 个 Mixin 类 |
| `mixins.iris.vertexformat.json` | 顶点格式相关注入 |
| `mixins.iris.fantastic.json` | 粒子系统相关 |
| `mixins.iris.compat.sodium.json` | Sodium 兼容层 |
| `mixins.iris.compat.indium.json` | Indium 兼容层 |

### 1.2 主配置文件结构

```json
{
  "required": true,
  "minVersion": "0.8",
  "package": "net.irisshaders.iris.mixin",
  "compatibilityLevel": "JAVA_8",
  "client": [
    "DimensionTypeAccessor",
    "GameRendererAccessor",
    "MixinGameRenderer",
    "MixinGlStateManager",
    "MixinLevelRenderer",
    "MixinRenderSystem",
    "MixinProgram",
    ...
  ],
  "injectors": {
    "defaultRequire": 1,
    "maxShiftBy": 2
  }
}
```

---

## 2. MixinGameRenderer - 游戏渲染钩子

### 2.1 着色器覆盖注入模式

每个 `get*Shader` 方法都使用 `@Inject` 注入到 **HEAD** 位置，并设置 `cancellable = true`：

```java
@Inject(method = "getPositionShader", at = @At("HEAD"), cancellable = true)
private static void iris$overridePositionShader(CallbackInfoReturnable<ShaderInstance> cir) {
    if (isSky()) {
        override(ShaderKey.SKY_BASIC, cir);
    } else if (ShadowRenderer.ACTIVE) {
        override(ShaderKey.SHADOW_BASIC, cir);
    } else if (shouldOverrideShaders()) {
        override(ShaderKey.BASIC, cir);
    }
}
```

### 2.2 被拦截的着色器类型（30+ 个）

| 着色器类型 | 注入方法 | 覆盖逻辑 |
|-----------|---------|---------|
| 基础着色器 | `getPositionShader` | Sky/Shadow/Basic |
| 颜色着色器 | `getPositionColorShader` | Sky/Shadow/Basic Color |
| 纹理着色器 | `getPositionTexShader` | Sky/Shadow/Textured |
| 粒子着色器 | `getParticleShader` | Weather/Shadow/Particles |
| 实体着色器 | `getRendertypeEntityCutoutShader` | Shadow/Hand/Block Entity |
| 云朵着色器 | `getRendertypeCloudsShader` | Shadow/Clouds |
| 地形着色器 | `getRendertypeSolidShader` | Shadow/Moving Block/Terrain |
| 半透明着色器 | `getRendertypeTranslucentShader` | Shadow/Moving Block/Terrain Trans |
| 闪烁着色器 | `getRendertypeGlintShader` | Glint |
| 文字着色器 | `getRendertypeTextShader` | Shadow/Hand/Block Entity/Text |

### 2.3 渲染阶段判断逻辑

```java
private static boolean isBlockEntities() {
    WorldRenderingPipeline pipeline = Iris.getPipelineManager().getPipelineNullable();
    return pipeline != null && pipeline.getPhase() == WorldRenderingPhase.BLOCK_ENTITIES;
}

private static boolean isEntities() {
    WorldRenderingPipeline pipeline = Iris.getPipelineManager().getPipelineNullable();
    return pipeline != null && pipeline.getPhase() == WorldRenderingPhase.ENTITIES;
}

private static boolean isSky() {
    WorldRenderingPipeline pipeline = Iris.getPipelineManager().getPipelineNullable();
    if (pipeline != null) {
        return switch (pipeline.getPhase()) {
            case CUSTOM_SKY, SKY, SUNSET, SUN, STARS, VOID, MOON -> true;
            default -> false;
        };
    }
    return false;
}
```

### 2.4 框架级别注入

**帧开始钩子**：

```java
@Inject(method = "render", at = @At("HEAD"))
private void iris$startFrame(DeltaTracker deltaTracker, boolean bl, boolean bl2, boolean bl3, CallbackInfo ci) {
    CapturedRenderingState.INSTANCE.setRealTickDelta(deltaTracker.getGameTimeDeltaPartialTick(true));
    SystemTimeUniforms.COUNTER.beginFrame();
    SystemTimeUniforms.TIMER.beginFrame(Util.getNanos());
}
```

**帧结束钩子**：

```java
@Inject(method = "renderLevel", at = @At("TAIL"))
private void iris$runColorSpace(DeltaTracker deltaTracker, CallbackInfo ci) {
    Iris.getPipelineManager().getPipeline().ifPresent(WorldRenderingPipeline::finalizeGameRendering);
}
```

---

## 3. MixinLevelRenderer - 世界渲染钩子

### 3.1 渲染管线初始化

**在 `renderLevel` 方法 HEAD 注入**：

```java
@Inject(method = "renderLevel", at = @At("HEAD"))
private void iris$setupPipeline(DeltaTracker deltaTracker, boolean renderBlockOutline,
                           Camera camera, GameRenderer gameRenderer, LightTexture lightTexture,
                           Matrix4f modelView, Matrix4f projection, CallbackInfo callback) {
    DHCompat.checkFrame();

    IrisTimeUniforms.updateTime();
    CapturedRenderingState.INSTANCE.setGbufferModelView(modelView);
    CapturedRenderingState.INSTANCE.setGbufferProjection(projection);
    float fakeTickDelta = deltaTracker.getGameTimeDeltaPartialTick(false);
    CapturedRenderingState.INSTANCE.setTickDelta(fakeTickDelta);
    CapturedRenderingState.INSTANCE.setCloudTime((ticks + fakeTickDelta) * 0.03F);

    pipeline = Iris.getPipelineManager().preparePipeline(Iris.getCurrentDimension());

    if (pipeline.shouldDisableFrustumCulling()) {
        this.cullingFrustum = new NonCullingFrustum();
    }

    Minecraft.getInstance().smartCull = !pipeline.shouldDisableOcclusionCulling();
}
```

### 3.2 天空渲染阶段细分

```java
// 开始正常天空渲染
@Inject(method = "renderSky", at = @At(value = "INVOKE", target = "Lnet/minecraft/client/renderer/FogRenderer;levelFogColor()V"))
private void iris$renderSky$beginNormalSky(...) {
    pipeline.setPhase(WorldRenderingPhase.SKY);
}

// 设置太阳渲染阶段
@Inject(method = "renderSky", at = @At(value = "FIELD", target = "Lnet/minecraft/client/renderer/LevelRenderer;SUN_LOCATION:Lnet/minecraft/resources/ResourceLocation;"))
private void iris$setSunRenderStage(...) {
    pipeline.setPhase(WorldRenderingPhase.SUN);
}

// 设置日落渲染阶段
@Inject(method = "renderSky", at = @At(value = "INVOKE", target = "Lnet/minecraft/client/renderer/DimensionSpecialEffects;getSunriseColor(FF)[F"))
private void iris$setSunsetRenderStage(...) {
    pipeline.setPhase(WorldRenderingPhase.SUNSET);
}

// 设置月亮渲染阶段
@Inject(method = "renderSky", at = @At(value = "FIELD", target = "Lnet/minecraft/client/renderer/LevelRenderer;MOON_LOCATION:Lnet/minecraft/resources/ResourceLocation;"))
private void iris$setMoonRenderStage(...) {
    pipeline.setPhase(WorldRenderingPhase.MOON);
}

// 设置星星渲染阶段
@Inject(method = "renderSky", at = @At(value = "INVOKE", target = "Lnet/minecraft/client/multiplayer/ClientLevel;getStarBrightness(F)F"))
private void iris$setStarRenderStage(...) {
    pipeline.setPhase(WorldRenderingPhase.STARS);
}
```

### 3.3 地形渲染阶段

```java
@Inject(method = "renderSectionLayer", at = @At("HEAD"))
private void iris$beginTerrainLayer(RenderType renderType, double d, double e, double f, Matrix4f matrix4f, Matrix4f matrix4f2, CallbackInfo ci) {
    pipeline.setPhase(WorldRenderingPhase.fromTerrainRenderType(renderType));
}

@Inject(method = "renderSectionLayer", at = @At("RETURN"))
private void iris$endTerrainLayer(RenderType renderType, double d, double e, double f, Matrix4f matrix4f, Matrix4f matrix4f2, CallbackInfo ci) {
    pipeline.setPhase(WorldRenderingPhase.NONE);
}
```

### 3.4 透明渲染特殊处理

```java
@Inject(method = "renderLevel", at = @At(value = "CONSTANT", args = "stringValue=translucent"))
private void iris$beginTranslucents(DeltaTracker deltaTracker, boolean bl, Camera camera, GameRenderer gameRenderer, LightTexture lightTexture, Matrix4f modelMatrix, Matrix4f matrix4f2, CallbackInfo ci) {
    pipeline.beginHand();
    HandRenderer.INSTANCE.renderSolid(modelMatrix, deltaTracker.getGameTimeDeltaPartialTick(true), camera, gameRenderer, pipeline);
    Minecraft.getInstance().getProfiler().popPush("iris_pre_translucent");
    pipeline.beginTranslucents();
}
```

---

## 4. MixinGlStateManager - OpenGL 状态管理钩子

### 4.1 纹理单元数量扩展

```java
@ModifyConstant(method = "<clinit>", constant = @Constant(intValue = 12), require = 1)
private static int iris$increaseMaximumAllowedTextureUnits(int existingValue) {
    // 将纹理单元数量从 12 扩展到 128
    return 128;
}
```

---

## 5. 其他关键 Mixin 类

### 5.1 MixinMinecraft_PipelineManagement - 管线生命周期管理

```java
@Inject(method = "clearClientLevel", at = @At("HEAD"))
public void iris$trackLastDimensionOnLeave(Screen arg, CallbackInfo ci) {
    Iris.lastDimension = Iris.getCurrentDimension();
}

@Inject(method = "setLevel", at = @At("HEAD"))
private void iris$trackLastDimensionOnLevelChange(ClientLevel clientLevel, ReceivingLevelScreen.Reason reason, CallbackInfo ci) {
    Iris.lastDimension = Iris.getCurrentDimension();
}

@Inject(method = "updateLevelInEngines", at = @At("HEAD"))
private void iris$resetPipeline(@Nullable ClientLevel level, CallbackInfo ci) {
    if (Iris.getCurrentDimension() != Iris.lastDimension) {
        Iris.logger.info("Reloading pipeline on dimension change: " + Iris.lastDimension + " => " + Iris.getCurrentDimension());
        Iris.getPipelineManager().destroyPipeline();
        if (level != null) {
            Iris.getPipelineManager().preparePipeline(Iris.getCurrentDimension());
        }
    }
}
```

### 5.2 MixinRenderSystem - 渲染系统初始化

```java
@Inject(method = "initRenderer", at = @At("RETURN"), remap = false)
private static void iris$onRendererInit(int debugVerbosity, boolean alwaysFalse, CallbackInfo ci) {
    Iris.duringRenderSystemInit();
    GLDebug.reloadDebugState();
    IrisRenderSystem.initRenderer();
    IrisSamplers.initRenderer();
    Iris.onRenderSystemInit();
}

@Inject(method = "_setShaderTexture(ILnet/minecraft/resources/ResourceLocation;)V",
    at = @At(value = "INVOKE", target = "Lnet/minecraft/client/renderer/texture/AbstractTexture;getId()I", shift = At.Shift.AFTER),
    locals = LocalCapture.CAPTURE_FAILHARD)
private static void _setShaderTexture(int unit, ResourceLocation resourceLocation, CallbackInfo ci,
                                     TextureManager lv, AbstractTexture tex) {
    TextureTracker.INSTANCE.onSetShaderTexture(unit, tex.getId());
}
```

### 5.3 MixinEntityRenderDispatcher - 实体阴影管理

```java
@Inject(method = RENDER_SHADOW, at = @At("HEAD"), cancellable = true)
private static void iris$maybeSuppressEntityShadow(PoseStack poseStack, MultiBufferSource bufferSource,
                                               Entity entity, float opacity, float tickDelta,
                                               LevelReader level, float radius, CallbackInfo ci) {
    if (!iris$maybeSuppressShadow(ci)) {
        Object2IntFunction<NamespacedId> entityIds = WorldRenderingSettings.INSTANCE.getEntityIds();
        if (entityIds == null) {
            return;
        }
        cachedId = CapturedRenderingState.INSTANCE.getCurrentRenderedEntity();
        CapturedRenderingState.INSTANCE.setCurrentEntity(entityIds.getInt(shadowId));
    }
}

@Inject(method = "renderShadow", at = @At("RETURN"))
private static void restoreShadow(PoseStack pPoseStack0, MultiBufferSource pMultiBufferSource1,
                                 Entity pEntity2, float pFloat3, float pFloat4,
                                 LevelReader pLevelReader5, float pFloat6, CallbackInfo ci) {
    CapturedRenderingState.INSTANCE.setCurrentEntity(cachedId);
    cachedId = 0;
}
```

---

## 6. 渲染管线交互流程

```
Minecraft.render()
    │
    ├─► MixinGameRenderer.iris$startFrame()     [帧开始]
    │       - 更新 CapturedRenderingState
    │
    └─► LevelRenderer.renderLevel()
            │
            ├─► HEAD: iris$setupPipeline()     [管线初始化]
            │       - preparePipeline()
            │       - 设置剔除模式
            │
            ├─► CLEAR after: iris$beginLevelRender()
            │       - beginLevelRendering()
            │
            ├─► renderSky() before: iris$renderTerrainShadows()
            │       - renderShadows()          [阴影渲染]
            │
            ├─► renderSky() inject points
            │       - setPhase(SKY/SUN/SUNSET/MOON/STARS)
            │
            ├─► renderClouds()前后: setPhase(CLOUDS)
            │
            ├─► renderSectionLayer() HEAD/RETURN
            │       - setPhase(TERRAIN_*)      [地形渲染]
            │
            ├─► translucent constant: beginTranslucents()
            │       - beginHand()
            │       - beginTranslucents()
            │
            ├─► renderWeather()前后: setPhase(RAIN_SNOW)
            │
            └─► RETURN before: iris$endLevelRender()
                    - finalizeLevelRendering()
                    - HandRenderer.renderTranslucent()
```

---

## 7. 注入类型总结

| 注入类型 | 用途 | 示例 |
|---------|------|------|
| `@Inject(at = HEAD)` | 在方法开始前执行 | 管线初始化、状态重置 |
| `@Inject(at = RETURN)` | 在方法返回前执行 | 清理、收尾工作 |
| `@Inject(at = INVOKE)` | 在特定调用前后 | 渲染阶段切换 |
| `@Redirect` | 替换方法调用 | 手持渲染禁用 |
| `@ModifyConstant` | 修改常量值 | 纹理单元数量 |
| `@ModifyArg` | 修改方法参数 | 雨雪深度写入 |

---

## 8. WorldRenderingPhase 枚举

| 阶段 | 说明 | Mixin 注入点 |
|------|------|-------------|
| `NONE` | 无阶段 | 默认 |
| `SKY` | 天空渲染 | `renderSky` 内部 |
| `SUNSET` | 日落 | `renderSky` 内部 |
| `CUSTOM_SKY` | 自定义天空 | 特定注入点 |
| `SUN` | 太阳 | `renderSky` 内部 |
| `MOON` | 月亮 | `renderSky` 内部 |
| `STARS` | 星星 | `renderSky` 内部 |
| `VOID` | 虚空 | `renderSky` 内部 |
| `TERRAIN_SOLID` | 固体地形 | `renderSectionLayer` |
| `TERRAIN_CUTOUT_MIPPED` | 裁剪地形(带Mipmap) | `renderSectionLayer` |
| `TERRAIN_CUTOUT` | 裁剪地形 | `renderSectionLayer` |
| `ENTITIES` | 实体 | `renderEntities` |
| `BLOCK_ENTITIES` | 方块实体 | `renderBlockEntities` |
| `HAND_SOLID` | 手部(固体) | `renderItemInHand` |
| `TERRAIN_TRANSLUCENT` | 半透明地形 | `renderSectionLayer` |
| `TRIPWIRE` | 绊线 | `renderSectionLayer` |
| `PARTICLES` | 粒子 | `renderSnowAndRain` |
| `CLOUDS` | 云 | `renderClouds` |
| `RAIN_SNOW` | 雨/雪 | `renderWeather` |
| `HAND_TRANSLUCENT` | 手部(半透明) | `renderTranslucent` |

---

## 9. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-rendering-pipeline.md](02-rendering-pipeline.md) - 渲染管线详解
- [07-sodium-integration.md](07-sodium-integration.md) - Sodium 集成

---

*生成时间: 2026-03-23*
*基于 Iris v1.7.3 源码分析*
