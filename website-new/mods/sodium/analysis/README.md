# Sodium 源代码分析

> 基于 v0.8.6 源码的完整分析报告

## 项目信息

| 属性 | 值 |
|------|-----|
| Mod 名称 | Sodium |
| 当前版本 | 0.8.6 |
| 支持 Minecraft | 1.21.11 |
| 支持平台 | Fabric, NeoForge |
| Java 版本 | JDK 21 |
| 构建工具 | Gradle 8.10.x |
| 许可证 | Polyform Shield 1.0.0 |
| GitHub | CaffeineMC/sodium |

## 文档目录

### 架构分析

| 文档 | 说明 |
|------|------|
| [01-architecture-overview.md](01-architecture-overview.md) | 整体架构设计模式、模块划分、核心设计原则 |
| [SUMMARY.md](SUMMARY.md) | 整体总结 - 核心要点、架构图、技术栈 |

### 系统分析

| 文档 | 说明 |
|------|------|
| [02-chunk-render-system.md](02-chunk-render-system.md) | 区块渲染系统 - 多线程构建、批处理、网格生成 |
| [03-occlusion-culling.md](03-occlusion-culling.md) | 遮挡剔除系统 - 可见性判断、方向优化 |
| [04-render-pipeline.md](04-render-pipeline.md) | 渲染管线 - Pass 系统、命令封装、渲染流程 |
| [05-shader-system.md](05-shader-system.md) | 着色器系统 - GLSL 着色器、顶点格式 |
| [06-platform-integration.md](06-platform-integration.md) | 平台集成 - Fabric/NeoForge 服务加载 |

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sodium 0.8.6                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────┐    ┌────────────────────────────┐  │
│  │        Fabric          │    │        NeoForge             │  │
│  │   SodiumFabricMod      │    │   SodiumForgeMod            │  │
│  │   + Mixin 配置         │    │   + 事件系统                │  │
│  │   + FRAPI 注册        │    │   + FRAPI 注册              │  │
│  └──────────┬───────────┘    └──────────────┬───────────────┘  │
│             │                                 │                  │
│             └───────────────┬─────────────────┘                  │
│                             ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     Common (核心模块)                         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │              渲染管线 (Render Pipeline)              │  │ │
│  │  │  • SodiumWorldRenderer                               │  │ │
│  │  │  • RenderSectionManager                              │  │ │
│  │  │  • TerrainRenderPass                                 │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │ │
│  │  │  区块构建系统    │  │   遮挡剔除系统   │  │ 着色器系统 │ │ │
│  │  │  ChunkBuilder  │  │ OcclusionCuller │  │  Shader   │ │ │
│  │  │  • 多线程池    │  │  • 图遍历算法   │  │ • GLSL    │ │ │
│  │  │  • 任务调度    │  │  • 可见性编码   │  │ • Vertex  │ │ │
│  │  │  • 帧预算     │  │  • 方向优化     │  │           │ │ │
│  │  └─────────────────┘  └─────────────────┘  └────────────┘ │ │
│  │                                                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                  │ │
│  │  │   批处理渲染    │  │   平台抽象层    │                  │ │
│  │  │  Batch Render  │  │    Services     │                  │ │
│  │  │  • MultiDraw   │  │ • PlatformBlock │                  │ │
│  │  │  • 共享索引   │  │ • PlatformLevel │                  │ │
│  │  │  • GPU 缓冲   │  │ • PlatformModel │                  │ │
│  │  └─────────────────┘  └─────────────────┘                  │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 核心优化技术

| 技术 | 说明 | 效果 |
|------|------|------|
| **多线程区块构建** | 专用工作线程池异步构建网格 | 帧率稳定 |
| **遮挡剔除** | 图遍历 + 方向优化判断可见性 | 减少渲染 |
| **MultiDraw 批处理** | 合并多个区块为一次 Draw Call | 减少 Draw Calls |
| **直方图排序** | O(n) 复杂度的区块排序 | 排序加速 |
| **顶点压缩** | Half-float 代替 float | 显存减少 33% |
| **帧预算控制** | 基于时间的任务调度 | 避免卡顿 |
| **缓冲区池化** | GPU 内存池管理 | 减少 GC |
| **无分支代码** | 位运算避免 CPU 分支预测失败 | 流水线效率 |

---

## 源码统计

```
D:/Projects/sodium/
├── common/                              # 核心模块
│   └── src/main/java/net/caffeinemc/
│       └── mods/sodium/
│           ├── client/                  # 客户端代码
│           │   ├── SodiumClientMod.java
│           │   ├── render/              # 渲染系统 (~100 文件)
│           │   │   ├── SodiumWorldRenderer.java
│           │   │   ├── chunk/          # 区块渲染
│           │   │   │   ├── RenderSectionManager.java
│           │   │   │   ├── ChunkBuilder.java
│           │   │   │   ├── DefaultChunkRenderer.java
│           │   │   │   ├── occlusion/  # 遮挡剔除
│           │   │   │   │   └── OcclusionCuller.java
│           │   │   │   ├── compile/   # 编译系统
│           │   │   │   └── region/    # 区域管理
│           │   │   ├── shader/        # 着色器管理
│           │   │   └── gl/            # OpenGL 封装
│           │   ├── gui/               # GUI
│           │   ├── config/            # 配置
│           │   └── services/         # 平台服务接口
│           └── mixin/                 # Mixin 注入
│   └── src/api/                        # 公共 API
├── fabric/                             # Fabric 集成 (~30 文件)
├── neoforge/                           # NeoForge 集成 (~30 文件)
├── frapi/                              # FRAPI 实现 (~20 文件)
└── buildSrc/                           # 构建配置
```

---

## 关键版本信息

| 组件 | 版本 |
|------|------|
| Minecraft | 1.21.11 |
| NeoForge | 21.11.10-beta |
| Fabric Loader | 0.18.1 |
| Fabric API | 0.140.0+1.21.11 |
| Mixin | 0.3.x |

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 语言 | Java 21 |
| 字节码注入 | Mixin |
| 平台支持 | Fabric API, NeoForge |
| 图形 API | OpenGL 3.3+ |
| 构建工具 | Gradle 8.10.x |
| 性能分析 | Tracy (可选) |

---

## OpenGL 要求

| 要求 | 版本 | 说明 |
|------|------|------|
| **最低版本** | OpenGL 3.3 | 基本的顶点属性 |
| **推荐版本** | OpenGL 4.5 | SPIR-V 支持 |
| **可选扩展** | GL_ARB_gl_spirv | SPIR-V 着色器编译 |
| **可选扩展** | GL_ARB_vertex_attrib_64bit | 64-bit 顶点属性 |

---

## 相关项目

| 项目 | 说明 |
|------|------|
| [Iris](https://github.com/IrisShaders/Iris) | Sodium 的前身，着色器支持 |
| [Indium](https://github.com/comp500/Indium) | Fabric 渲染 API 实现 |
| [Sodium Extra](https://github.com/FlashyReese/sodium-extra) | Sodium 的扩展功能 |

---

## 使用说明

这些文档旨在帮助理解 Sodium 的内部工作原理，包括：
- 渲染优化技术的实现细节
- 多平台支持的架构设计
- 与 Minecraft 交互的机制

代码引用使用源代码中的实际类名和方法签名。

---

*生成时间: 2026-03-19*
*基于 Sodium v0.8.6 源码分析*
