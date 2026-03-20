# Iris 源代码分析

> 基于 v1.7.3 源码的完整分析报告

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
| 代码文件 | ~620 个 Java 文件 |

## 文档目录

### 架构分析

| 文档 | 说明 |
|------|------|
| [01-architecture-overview.md](01-architecture-overview.md) | 整体架构设计模式、模块划分 |
| [SUMMARY.md](SUMMARY.md) | 整体总结 - 核心要点、架构图 |

### 系统分析

| 文档 | 说明 |
|------|------|
| [02-rendering-pipeline.md](02-rendering-pipeline.md) | 渲染管线 - GBuffer、Composite Pass |
| [03-shaderpack-system.md](03-shaderpack-system.md) | 着色器包加载与解析 |
| [04-shadow-system.md](04-shadow-system.md) | 阴影系统 - 视锥体剔除、阴影渲染 |
| [05-framebuffer-texture.md](05-framebuffer-texture.md) | 帧缓冲与纹理系统 |
| [06-uniforms.md](06-uniforms.md) | Uniform 管理 |

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Iris 1.7.3                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   渲染管线 (Pipeline)                       │ │
│  │  • IrisRenderingPipeline                                    │ │
│  │  • CompositeRenderer                                       │ │
│  │  • FinalPassRenderer                                      │ │
│  │  • SodiumTerrainPipeline                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │   着色器包系统     │  │      阴影系统       │                │
│  │  ShaderPack       │  │   ShadowRenderer    │                │
│  │  ProgramSet       │  │   Frustum Culling  │                │
│  │  TransformPatcher │  │   Shadow Matrices   │                │
│  └─────────────────────┘  └─────────────────────┘                │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │   帧缓冲系统       │  │    Uniform 系统     │                │
│  │   RenderTargets    │  │   CommonUniforms    │                │
│  │   GlFramebuffer   │  │   CameraUniforms    │                │
│  │   DepthTexture    │  │   BiomeUniforms     │                │
│  └─────────────────────┘  └─────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心优化技术

| 技术 | 说明 | 效果 |
|------|------|------|
| **高级视锥体剔除** | 基于光源方向的智能剔除 | 阴影渲染加速 |
| **GBuffer 多目标** | 延迟渲染架构 | 高质量后期处理 |
| **Uniform 缓存** | 脏值检测优化 | 减少 GPU 传输 |
| **深度复制优化** | 智能选择复制策略 | 减少带宽占用 |
| **Buffer 翻转** | 主/备用纹理切换 | 支持 Ping-Pong 渲染 |
| **计算着色器** | 异步后处理 | 性能提升 |

---

## 源码统计

```
D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/
├── pipeline/                    # 渲染管线 (~20 文件)
├── shaderpack/                  # 着色器包 (~80 文件)
├── shadows/                     # 阴影系统 (~15 文件)
├── targets/                     # 帧缓冲 (~10 文件)
├── uniforms/                    # Uniform (~30 文件)
├── gl/                          # OpenGL 封装 (~50 文件)
│   ├── program/                 # 程序管理
│   ├── shader/                  # 着色器编译
│   ├── buffer/                  # 缓冲区
│   └── texture/                 # 纹理
├── mixin/                        # Mixin 注入 (~100 文件)
└── [其他]                       # GUI、兼容层等 (~50 文件)
```

---

## 关键版本信息

| 组件 | 版本 |
|------|------|
| Minecraft | 1.21 |
| Sodium | 0.5.9 |
| Fabric Loader | 0.15.11 |
| Fabric API | 0.100.1 |

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 语言 | Java 21 |
| 字节码注入 | Mixin |
| 平台支持 | Fabric |
| 图形 API | OpenGL 3.3+ |
| 构建工具 | Gradle 8.10.x |
| GLSL 工具 | glsl-transformer, jcpp |
| 图形界面 | Swing (原生) |

---

## OpenGL 要求

| 要求 | 版本 | 说明 |
|------|------|------|
| **最低版本** | OpenGL 3.3 | 基本功能 |
| **推荐版本** | OpenGL 4.5 | 全部功能 |
| **可选扩展** | GL_ARB_shader_storage_buffer_object | SSBO 支持 |
| **可选扩展** | GL_ARB_compute_shader | 计算着色器 |

---

## 第三方依赖

| 库 | 用途 |
|------|------|
| **glsl-transformer** | GLSL 代码转换 |
| **jcpp** | GLSL 预处理器 |
| **ANTLR4** | 属性文件解析 |
| **fastutil** | 高性能集合 |
| **JOML** | 矩阵/向量数学 |

---

## 与 Sodium 的关系

| 方面 | Sodium | Iris |
|------|--------|------|
| **目标** | 帧率优化 | 光影支持 |
| **核心** | 多线程构建 | 延迟渲染 |
| **集成** | SodiumTerrainPipeline | - |
| **可独立** | 是 | 否 (依赖 Sodium) |

---

## 相关项目

| 项目 | 说明 |
|------|------|
| [Sodium](https://github.com/CaffeineMC/sodium) | 高性能渲染优化 Mod |
| [Indium](https://github.com/comp500/Indium) | Fabric 渲染 API |
| [Distant Horizons](https://github.com/sparticuzz/DistantHorizons) | 远距离渲染 |

---

## 使用说明

这些文档旨在帮助理解 Iris 的内部工作原理，包括：
- 延迟渲染架构的实现细节
- 光影包加载和解析机制
- 高级视锥体剔除算法
- 与 Minecraft/Sodium 的交互方式

---

*生成时间: 2026-03-19*
*基于 Iris v1.7.3 源码分析*
