# Iris 光影 Mod 整体架构分析

> 高性能 Minecraft 光影渲染 Mod

## 项目信息

| 属性 | 值 |
|------|-----|
| Mod 名称 | Iris |
| 当前版本 | 1.7.3 |
| 支持 Minecraft | 1.21 |
| 支持平台 | Fabric |
| Java 版本 | JDK 21 |
| 构建工具 | Gradle 8.10.x |
| GitHub | IrisShaders/Iris |

## 文档目录

| 文档 | 说明 |
|------|------|
| [01-architecture-overview.md](01-architecture-overview.md) | 整体架构设计模式、模块划分 |
| [02-rendering-pipeline.md](02-rendering-pipeline.md) | 渲染管线 - GBuffer、Composite Pass |
| [03-shaderpack-system.md](03-shaderpack-system.md) | 着色器包加载与解析 |
| [04-shadow-system.md](04-shadow-system.md) | 阴影系统 - 视锥体剔除、阴影渲染 |
| [05-framebuffer-texture.md](05-framebuffer-texture.md) | 帧缓冲与纹理系统 |
| [06-uniforms.md](06-uniforms.md) | Uniform 管理 |
| [SUMMARY.md](SUMMARY.md) | 总结文档 |

---

## 1. 项目结构

### 1.1 核心模块

```
D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/
├── pipeline/                    # 渲染管线核心
│   ├── IrisRenderingPipeline.java    # 主渲染管线
│   ├── CompositeRenderer.java         # 合成渲染器
│   ├── FinalPassRenderer.java         # 最终 Pass 渲染
│   ├── SodiumTerrainPipeline.java    # Sodium 地形集成
│   └── WorldRenderingPhase.java      # 渲染阶段
├── shaderpack/                  # 着色器包系统
│   ├── ShaderPack.java              # 着色器包加载器
│   ├── programs/                   # 程序管理
│   ├── properties/                 # 属性解析
│   └── preprocessor/               # GLSL 预处理器
├── shadows/                     # 阴影系统
│   ├── ShadowRenderer.java          # 阴影渲染器
│   ├── ShadowCompositeRenderer.java # 阴影合成
│   └── frustum/                   # 视锥体剔除
├── targets/                      # 渲染目标
│   ├── RenderTargets.java           # 多渲染目标管理
│   ├── RenderTarget.java            # 单个渲染目标
│   └── DepthTexture.java            # 深度纹理
├── uniforms/                     # Uniform 管理
│   ├── CommonUniforms.java         # 通用 Uniform
│   ├── CameraUniforms.java         # 相机 Uniform
│   ├── BiomeUniforms.java          # 生物群系 Uniform
│   └── custom/                     # 自定义 Uniform
├── gl/                           # OpenGL 封装
│   ├── program/                    # 程序管理
│   ├── shader/                     # 着色器编译
│   ├── buffer/                     # 缓冲区
│   └── texture/                    # 纹理管理
└── mixin/                        # Mixin 注入
    ├── MixinGameRenderer.java
    ├── MixinLevelRenderer.java
    └── ...
```

### 1.2 源码统计

| 模块 | 文件数 | 说明 |
|------|--------|------|
| pipeline | ~20 | 渲染管线核心 |
| shaderpack | ~80 | 着色器包加载解析 |
| shadows | ~15 | 阴影系统 |
| targets | ~10 | 帧缓冲管理 |
| uniforms | ~30 | Uniform 管理 |
| gl | ~50 | OpenGL 封装 |
| mixin | ~100 | Mixin 注入 |
| 其他 | ~50 | GUI、粒子、兼容层 |

---

## 2. 核心架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (Application)                     │
│  • ShaderPackScreen (GUI)                                   │
│  • Config (配置管理)                                        │
│  • UpdateChecker (更新检查)                                 │
├─────────────────────────────────────────────────────────────┤
│                    管线层 (Pipeline)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              IrisRenderingPipeline                     │  │
│  │  • 管理整个渲染流程                                     │  │
│  │  • 协调 GBuffer、阴影、Composite Pass                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ SodiumTerrain│  │   Shadow    │  │   Composite    │   │
│  │  Pipeline    │  │   Renderer   │  │   Renderer      │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    着色器包层 (ShaderPack)                   │
│  • ShaderPack (包加载)                                      │
│  • ProgramSet (程序集)                                     │
│  • IdMap (ID 映射)                                         │
│  • ShaderProperties (属性)                                  │
├─────────────────────────────────────────────────────────────┤
│                    OpenGL 封装层                             │
│  • Program (着色器程序)                                     │
│  • GlFramebuffer (帧缓冲)                                   │
│  • GlTexture (纹理)                                         │
│  • ShaderStorageBuffer (SSBO)                               │
├─────────────────────────────────────────────────────────────┤
│                    Minecraft / Sodium                         │
│  • LevelRenderer (原版渲染器)                               │
│  • SodiumWorldRenderer (Sodium 渲染器)                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 渲染流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    完整渲染流程                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. beginLevelRendering()                                       │
│     ├── 清除帧缓冲                                               │
│     ├── Setup 计算                                              │
│     └── Begin Pass (天空、雾气等)                                │
│                                                                  │
│  2. renderShadows()                                            │
│     ├── ShadowRenderer.renderShadows()                          │
│     │   ├── 创建阴影视锥体                                      │
│     │   ├── 渲染地形到阴影贴图                                  │
│     │   ├── 渲染实体到阴影贴图                                  │
│     │   └── ShadowComposite Pass                               │
│     └── Prepare Pass                                            │
│                                                                  │
│  3. 地形渲染 (Sodium Terrain Pipeline)                          │
│     ├── GBuffer 渲染                                            │
│     │   ├── gbuffers_textured_lit                              │
│     │   ├── gbuffers_terrain                                   │
│     │   ├── gbuffers_water                                     │
│     │   └── gbuffers_entities                                   │
│     └── Deferred Pass                                           │
│                                                                  │
│  4. beginTranslucents()                                        │
│     ├── 复制深度纹理 (depthtex1)                               │
│     └── Deferred Pass (半透明内容)                              │
│                                                                  │
│  5. finalizeLevelRendering()                                   │
│     ├── Composite Passes                                        │
│     │   ├── composite1...N                                      │
│     │   └── shadowcomp1...N                                    │
│     └── Final Pass (最终合成)                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 关键设计模式

### 3.1 观察者模式

`FrameUpdateNotifier` 用于通知 Uniform 更新：

```startLine:1:30:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/uniforms/FrameUpdateNotifier.java
public class FrameUpdateNotifier {
    private final Set<Runnable> listeners = new HashSet<>();
    
    public void onNewFrame() {
        for (Runnable listener : listeners) {
            listener.run();
        }
    }
    
    public void addListener(Runnable listener) {
        listeners.add(listener);
    }
}
```

### 3.2 策略模式

不同的视锥体剔除策略：

```startLine:1:40:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shadows/frustum/advanced/AdvancedShadowCullingFrustum.java
public class AdvancedShadowCullingFrustum implements Frustum {
    // 高级视锥体剔除：考虑邻居区块遮挡
}

public class NonCullingFrustum implements Frustum {
    // 不剔除：所有内容都渲染
}
```

### 3.3 工厂模式

`ShaderCreator` 创建着色器程序：

```startLine:1:50:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/pipeline/programs/ShaderCreator.java
public class ShaderCreator {
    public static ExtendedShader create(ShaderRenderingPipeline pipeline, ...) {
        // 创建带扩展功能的着色器
    }
    
    public static FallbackShader createFallback(...) {
        // 创建后备着色器
    }
}
```

---

## 4. 技术栈

| 组件 | 技术 |
|------|------|
| 语言 | Java 21 |
| 字节码注入 | Mixin |
| 图形 API | OpenGL 3.3+ |
| 第三方库 | |
| - GLSL 转换 | glsl-transformer |
| - 预处理 | jcpp (JCPP) |
| - JSON 解析 | ANTLR4 |
| 构建工具 | Gradle 8.10.x |

---

## 5. OpenGL 要求

| 要求 | 版本 | 说明 |
|------|------|------|
| **最低版本** | OpenGL 3.3 | 基本的顶点属性 |
| **推荐版本** | OpenGL 4.5 | 更新的功能支持 |
| **可选扩展** | GL_ARB_shader_storage_buffer_object | SSBO 支持 |
| **可选扩展** | GL_ARB_compute_shader | 计算着色器 |

---

## 6. 相关文档

- [02-rendering-pipeline.md](02-rendering-pipeline.md) - 渲染管线详解
- [03-shaderpack-system.md](03-shaderpack-system.md) - 着色器包系统
- [04-shadow-system.md](04-shadow-system.md) - 阴影系统
- [05-framebuffer-texture.md](05-framebuffer-texture.md) - 帧缓冲与纹理
- [06-uniforms.md](06-uniforms.md) - Uniform 管理
- [SUMMARY.md](SUMMARY.md) - 总结

---

*生成时间: 2026-03-19*
*基于 Iris v1.7.3 源码分析*
