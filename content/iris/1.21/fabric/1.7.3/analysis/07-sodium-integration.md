# Iris Sodium 集成系统分析

> 基于 Iris v1.7.3 源码的 Sodium 集成深度分析

## 项目信息

| 属性 | 值 |
|------|-----|
| Mod 版本 | 1.7.3 |
| Minecraft 版本 | 1.21 |
| Sodium 版本 | 0.5.9 |
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

## 1. 整体架构设计

### 1.1 分层架构

Iris 通过 `sodiumCompatibility` 模块实现与 Sodium 的深度集成，采用分层架构：

```
┌─────────────────────────────────────────────────────────────┐
│                    Iris (主模块)                            │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ SodiumTerrainPipeline │  │ WorldRenderingPipeline       │  │
│  └────────┬────────┘  └─────────────────────────────────┘  │
└───────────┼────────────────────────────────────────────────┘
            │
┌───────────┼────────────────────────────────────────────────┐
│           ▼     sodiumCompatibility 模块                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              impl (实现层)                           │   │
│  │  ┌──────────────┐ ┌───────────────┐ ┌─────────────┐ │   │
│  │  │vertex_format │ │shader_overrides│ │ shadow_map  │ │   │
│  │  │ (顶点格式)   │ │ (着色器覆盖)  │ │ (阴影映射)  │ │   │
│  │  └──────────────┘ └───────────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              mixin (注入层)                          │   │
│  │  ┌──────────────┐ ┌───────────────┐ ┌─────────────┐ │   │
│  │  │vertex_format │ │shader_overrides│ │ shadow_map  │ │   │
│  │  └──────────────┘ └───────────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### 1.2 核心类表

| 类名 | 位置 | 功能 |
|------|------|------|
| `SodiumTerrainPipeline` | pipeline/ | Sodium 地形渲染管线 |
| `IrisChunkProgramOverrides` | sodiumCompatibility/impl/shader_overrides/ | 着色器程序覆盖管理 |
| `XHFPModelVertexType` | sodiumCompatibility/impl/vertex_format/terrain_xhfp/ | 扩展顶点格式 |
| `MixinShaderChunkRenderer` | sodiumCompatibility/mixin/ | 渲染器注入 |
| `MixinRenderSectionManager` | sodiumCompatibility/mixin/shadow_map/ | 区块渲染管理 |

---

## 2. 顶点格式扩展机制

### 2.1 扩展属性注入

Iris 通过 Mixin hack 技术向 Sodium 的枚举添加新的顶点属性：

```java
static {
    int baseOrdinal = $VALUES.length;

    IrisChunkMeshAttributes.NORMAL
        = ChunkMeshAttributeAccessor.createChunkMeshAttribute("NORMAL", baseOrdinal);
    IrisChunkMeshAttributes.TANGENT
        = ChunkMeshAttributeAccessor.createChunkMeshAttribute("TANGENT", baseOrdinal + 1);
    IrisChunkMeshAttributes.MID_TEX_COORD
        = ChunkMeshAttributeAccessor.createChunkMeshAttribute("MID_TEX_COORD", baseOrdinal + 2);
    IrisChunkMeshAttributes.BLOCK_ID
        = ChunkMeshAttributeAccessor.createChunkMeshAttribute("BLOCK_ID", baseOrdinal + 3);
    IrisChunkMeshAttributes.MID_BLOCK
        = ChunkMeshAttributeAccessor.createChunkMeshAttribute("MID_BLOCK", baseOrdinal + 4);

    $VALUES = ArrayUtils.addAll($VALUES,
        IrisChunkMeshAttributes.NORMAL,
        IrisChunkMeshAttributes.TANGENT,
        IrisChunkMeshAttributes.MID_TEX_COORD,
        IrisChunkMeshAttributes.BLOCK_ID,
        IrisChunkMeshAttributes.MID_BLOCK);
}
```

### 2.2 自定义顶点类型

`XHFPModelVertexType` 定义了扩展的顶点格式（Stride = 40 字节）：

```
┌─────────────────────────────────────────────────────────────────────┐
│                   XHFPModelVertexType 布局 (40 字节)                │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────────────┤
│POS(0-7) │COLOR(8-11)│TEX(12-15)│LIGHT(16-19)│MID_TEX(20-23)│ TANGENT(24-27)│
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│NORM(28-31)│BLOCK_ID(32-33)│MID_BLOCK(36-39)│                         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────────────┘
```

| 偏移 | 属性 | 类型 | 说明 |
|------|------|------|------|
| 0-7 | Position | float[2] | X, Y 坐标 |
| 8-11 | Color | ubyte[4] | 颜色 + 透明度 |
| 12-15 | TexCoord | ushort[2] | 纹理坐标 |
| 16-19 | LightCoord | ushort[2] | 光照坐标 |
| 20-23 | MidTexCoord | ushort[2] | 中点纹理坐标 |
| 24-27 | Tangent | byte[4] | 切线向量 |
| 28-31 | Normal | byte[4] | 法线向量 |
| 32-33 | BlockId | short[2] | 方块 ID |
| 36-39 | MidBlock | byte[4] | 中点坐标 |

---

## 3. 缓冲区构建器扩展

### 3.1 顶点序列化器注册

Iris 注册了多个顶点格式转换器来处理不同格式间的数据转换：

```java
@Inject(method = "<init>", at = @At("TAIL"))
private void putSerializerIris(CallbackInfo ci) {
    cache.put(createKey(..., IrisVertexFormats.ENTITY), new ModelToEntityVertexSerializer());
    cache.put(createKey(..., IrisVertexFormats.TERRAIN), new IrisEntityToTerrainVertexSerializer());
    cache.put(createKey(..., IrisVertexFormats.TERRAIN), new EntityToTerrainVertexSerializer());
    cache.put(createKey(..., IrisVertexFormats.GLYPH), new GlyphExtVertexSerializer());
}
```

### 3.2 顶点转换逻辑

`EntityToTerrainVertexSerializer` 实现法线和切线计算：

```java
public class EntityToTerrainVertexSerializer implements VertexSerializer {
    @Override
    public void serialize(long src, long dst, int vertexCount) {
        int quadCount = vertexCount / 4;
        for (int i = 0; i < quadCount; i++) {
            int normal = MemoryUtil.memGetInt(src + 32);
            int tangent = NormalHelper.computeTangent(...);

            // 计算中点纹理坐标
            float midU = 0, midV = 0;
            for (int vertex = 0; vertex < 4; vertex++) {
                midU += MemoryUtil.memGetFloat(src + 16 + (ModelVertex.STRIDE * vertex));
                midV += MemoryUtil.memGetFloat(src + 20 + (ModelVertex.STRIDE * vertex));
            }
            midU /= 4;
            midV /= 4;
            // 写入扩展顶点数据...
        }
    }
}
```

---

## 4. 渲染钩子实现

### 4.1 着色器程序覆盖

`IrisChunkProgramOverrides` 是核心着色器管理类：

```java
public class IrisChunkProgramOverrides {
    private final EnumMap<IrisTerrainPass, GlProgram<IrisChunkShaderInterface>> programs
        = new EnumMap<>(IrisTerrainPass.class);
    private boolean shadersCreated = false;

    public void createShaders(SodiumTerrainPipeline pipeline, ChunkVertexType vertexType) {
        if (pipeline != null) {
            pipeline.patchShaders(vertexType);
            for (IrisTerrainPass pass : IrisTerrainPass.values()) {
                this.programs.put(pass, createShader(pass, pipeline, vertexType));
            }
        }
    }
}
```

### 4.2 渲染通道枚举

```java
public enum IrisTerrainPass {
    SHADOW("shadow"),
    SHADOW_CUTOUT("shadow"),
    GBUFFER_SOLID("gbuffers_terrain"),
    GBUFFER_CUTOUT("gbuffers_terrain_cutout"),
    GBUFFER_TRANSLUCENT("gbuffers_water");

    public TerrainRenderPass toTerrainPass() {
        switch (this) {
            case SHADOW, GBUFFER_SOLID:
                return DefaultTerrainRenderPasses.SOLID;
            case SHADOW_CUTOUT, GBUFFER_CUTOUT:
                return DefaultTerrainRenderPasses.CUTOUT;
            case GBUFFER_TRANSLUCENT:
                return DefaultTerrainRenderPasses.TRANSLUCENT;
        }
    }
}
```

### 4.3 渲染器注入

```java
@Mixin(ShaderChunkRenderer.class)
public class MixinShaderChunkRenderer implements ShaderChunkRendererExt {
    @Inject(method = "begin", at = @At("HEAD"), cancellable = true)
    private void iris$begin(TerrainRenderPass pass, CallbackInfo ci) {
        this.override = irisChunkProgramOverrides.getProgramOverride(pass, this.vertexType);
        if (this.override == null) return;
        ci.cancel();
        irisChunkProgramOverrides.bindFramebuffer(pass);
        pass.startDrawing();
        override.bind();
        override.getInterface().setupState();
    }

    @Inject(method = "end", at = @At("HEAD"), cancellable = true)
    private void iris$onEnd(TerrainRenderPass pass, CallbackInfo ci) {
        ProgramUniforms.clearActiveUniforms();
        ProgramSamplers.clearActiveSamplers();
        if (override != null) {
            irisChunkProgramOverrides.unbindFramebuffer();
            override.getInterface().restore();
            override.unbind();
            pass.endDrawing();
            override = null;
            ci.cancel();
        }
    }
}
```

---

## 5. 阴影渲染集成

### 5.1 渲染列表切换

```java
@Mixin(RenderSectionManager.class)
public class MixinRenderSectionManager {
    @Unique
    private @NotNull SortedRenderLists shadowRenderLists = SortedRenderLists.empty();

    @Redirect(method = "createTerrainRenderList",
        at = @At(value = "FIELD", target = "renderLists:..."))
    private void useShadowRenderList(RenderSectionManager instance, SortedRenderLists value) {
        if (ShadowRenderingState.areShadowsCurrentlyBeingRendered()) {
            shadowRenderLists = value;
        } else {
            renderLists = value;
        }
    }

    @Redirect(method = {"getRenderLists", "getVisibleChunkCount", "renderLayer"},
        at = @At(value = "FIELD", target = "renderLists:..."))
    private SortedRenderLists useShadowRenderList2(RenderSectionManager instance) {
        return ShadowRenderingState.areShadowsCurrentlyBeingRendered()
            ? shadowRenderLists : renderLists;
    }
}
```

### 5.2 区块实体渲染

```java
@Mixin(SodiumWorldRenderer.class)
public class MixinSodiumWorldRenderer {
    static {
        ShadowRenderingState.setBlockEntityRenderFunction((shadowRenderer, bufferSource, ...) -> {
            renderLightsOnly = lightsOnly;
            ((SodiumWorldRendererAccessor) SodiumWorldRenderer.instance())
                .invokeRenderBlockEntities(...);
            ((SodiumWorldRendererAccessor) SodiumWorldRenderer.instance())
                .invokeRenderGlobalBlockEntities(...);
            renderLightsOnly = false;
            return beList;
        });
    }

    @Inject(method = "isEntityVisible", at = @At("HEAD"), cancellable = true)
    private void iris$overrideEntityCulling(Entity entity, CallbackInfoReturnable<Boolean> cir) {
        if (ShadowRenderingState.areShadowsCurrentlyBeingRendered())
            cir.setReturnValue(true);
    }
}
```

---

## 6. SodiumTerrainPipeline 核心逻辑

### 6.1 默认顶点着色器

```glsl
#version 330 core
in ivec2 a_LightCoord;
in vec4 a_Color;
in vec2 a_TexCoord;
in uvec4 a_PosId;
uniform mat4 iris_ProjectionMatrix;
uniform mat4 iris_ModelViewMatrix;
uniform vec3 u_RegionOffset;
vec3 _vert_position;
vec2 _vert_tex_diffuse_coord;
ivec2 _vert_tex_light_coord;
uint _draw_id;
uint _material_params;
out float v_FragDistance;

void main() {
    _vert_init();
    vec3 translation = u_RegionOffset + _get_draw_translation(_draw_id);
    vec3 position = _vert_position + translation;
    v_FragDistance = getFragDistance(fogShape, position);
    gl_Position = iris_ProjectionMatrix * iris_ModelViewMatrix * vec4(position, 1.0);
    v_ColorModulator = vec4((_vert_color.rgb * _vert_color.a), 1)
                     * vec4(_sample_lightmap(_vert_tex_light_coord), 1.0);
}
```

### 6.2 着色器补丁处理

```java
public void patchShaders(ChunkVertexType vertexType) {
    ShaderAttributeInputs inputs = new ShaderAttributeInputs(true, true, false, true, true);

    // 处理 terrainSolid
    terrainSolidSource.ifPresentOrElse(sources -> {
        Map<PatchShaderType, String> transformed = TransformPatcher.patchSodium(
            sources.getName(),
            sources.getVertexSource().orElse(null),
            sources.getFragmentSource().orElse(null),
            AlphaTest.ALWAYS, inputs, parent.getTextureMap());
        terrainSolidVertex = Optional.ofNullable(transformed.get(PatchShaderType.VERTEX));
        terrainSolidFragment = Optional.ofNullable(transformed.get(PatchShaderType.FRAGMENT));
    }, () -> {
        terrainSolidVertex = Optional.of(defaultVertex);
        terrainSolidFragment = Optional.of(defaultFragment);
    });
    // 类似处理 cutout, translucent, shadow...
}
```

---

## 7. 架构总结图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           SodiumTerrainPipeline                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ patchShaders() → TransformPatcher.patchSodium()                   │ │
│  │   - 转换 gbuffers_terrain/gbuffers_water/shadow 着色器           │ │
│  │   - 注入 uniform: iris_ModelViewMatrix, iris_ProjectionMatrix    │ │
│  │   - 注入属性: NORMAL, TANGENT, MID_TEX_COORD, BLOCK_ID, MID_BLOCK│ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       IrisChunkProgramOverrides                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ createShader(pass, pipeline)                                       │ │
│  │   - 为 GBUFFER_SOLID/CUTOUT, TRANSLUCENT, SHADOW 创建程序        │ │
│  │   - 绑定属性位置: a_PosId, a_Color, a_TexCoord, mc_Entity...     │ │
│  │   - 创建 IrisChunkShaderInterface                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      MixinShaderChunkRenderer                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ begin()          │  │ end()           │  │ iris$getOverride()     │  │
│  │ - 绑定帧缓冲     │  │ - 清除uniform   │  │ - 返回当前override程序 │  │
│  │ - 启用绘制       │  │ - 恢复状态      │  │                        │  │
│  │ - 调用setupState │  │ - 禁用绘制      │  │                        │  │
│  └──────────────────┘  └──────────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        XHFPModelVertexType                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ STRIDE = 40 bytes                                                 │ │
│  │ ┌──────┬────────────┬────────────┬──────────────┬──────────────┐ │ │
│  │ │POS(0)│COLOR(8)   │TEX(12)    │LIGHT(16)     │MID_TEX(20)   │ │ │
│  │ ├──────┼────────────┼────────────┼──────────────┼──────────────┤ │ │
│  │ │TANG(24)│NORM(28)  │BLOCK_ID(32)│MID_BLOCK(36)│              │ │ │
│  │ └──────┴────────────┴────────────┴──────────────┴──────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 关键设计模式

| 模式 | 应用位置 | 说明 |
|------|---------|------|
| **策略模式** | `IrisTerrainPass` | 为不同渲染通道定义不同策略 |
| **装饰器模式** | `IrisChunkShaderInterface` | 扩展 ChunkShaderInterface 添加 Iris 特定功能 |
| **工厂模式** | `VertexSerializerRegistryImpl` | 注册多种顶点转换器 |
| **代理模式** | `ShaderBindingContextExt` | 提供 uniform 绑定的延迟解析 |
| **单例模式** | `ShadowRenderingState` | 管理阴影渲染全局状态 |

---

## 9. 相关文档

- [02-rendering-pipeline.md](02-rendering-pipeline.md) - 渲染管线详解
- [04-shadow-system.md](04-shadow-system.md) - 阴影系统
- [08-mixin-mechanism.md](08-mixin-mechanism.md) - Mixin 注入机制

---

*生成时间: 2026-03-23*
*基于 Iris v1.7.3 源码分析*
