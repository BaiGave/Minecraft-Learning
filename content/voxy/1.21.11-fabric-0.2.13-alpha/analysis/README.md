---
title: Voxy 架构分析
---

# Voxy 架构分析

本文档目录收录 Voxy 模组所有架构分析文档。

## 分析文档

| 序号 | 文档 | 核心内容 |
|------|------|----------|
| 01 | [01-architecture-overview.md](./01-architecture-overview.md) | 整体架构、LOD 概念、线程模型、存储系统、Mixin 依赖 |
| 02 | [02-world-engine.md](./02-world-engine.md) | WorldSection、WorldEngine、WorldUpdater、ActiveSectionTracker |
| 03 | [03-voxelization-system.md](./03-voxelization-system.md) | VoxelizedSection、WorldConversionFactory、LOD Mipper |
| 04 | [04-storage-persistence.md](./04-storage-persistence.md) | RocksDB、压缩算法、存储抽象、Section 序列化 |
| 05 | [05-thread-service.md](./05-thread-service.md) | UnifiedServiceThreadPool、ServiceManager、优先级调度 |
| 06 | [06-rendering-core.md](./06-rendering-core.md) | RenderEngine、Capabilities 检测、Sodium/Iris 兼容 |
| 07 | [07-world-importers.md](./07-world-importers.md) | WorldImporter、DHImporter、ImportManager |
| 08 | [08-config-system.md](./08-config-system.md) | Serialization、ConfigOption、ModMenu/Sodium 集成 |

## 总结

[SUMMARY.md](./SUMMARY.md) — 各子系统关键设计决策速查表

## 快速导航

返回 [voxy/README.md](../README.md) — 模组首页
