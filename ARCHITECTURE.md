# 项目架构设计文档

## 1. 概述

本文档定义了博客项目的目录架构标准，确保内容组织的一致性和可扩展性。

### 1.1 设计目标

- **一致性**: 所有模块/版本采用统一的目录结构
- **可扩展性**: 支持未来添加新的模块或版本
- **自动化**: 自动创建必要的目录结构
- **清晰分离**: 明确区分源文件(.md)和输出文件(.html)

---

## 2. 目录结构

### 2.1 整体架构

```
Blog/
├── content/                    # 源文件目录 (Markdown)
│   ├── mc/                     # Minecraft 原版
│   │   └── {version}/          # 版本目录 (如 1.18, 1.19, 1.20, 1.21)
│   │       ├── tutorials/      # 教程文章
│   │       └── analysis/       # 源码分析
│   ├── {mod-name}/             # Mod 目录 (如 sodium, iris)
│   │   ├── tutorials/          # 教程文章
│   │   └── analysis/          # 源码分析
│   └── ...                     # 其他模块
│
├── website/                    # 输出网站目录 (HTML)
│   ├── docs/                   # 文档页面
│   │   ├── mc/
│   │   │   └── {version}/
│   │   │       ├── tutorials/  # 教程 HTML
│   │   │       └── analysis/   # 分析 HTML
│   │   ├── {mod-name}/
│   │   │   ├── tutorials/
│   │   │   └── analysis/
│   │   └── ...
│   └── ...
│
├── sources/                    # 源文件目录 (JAR/decompiled)
│   ├── mc/
│   │   └── {version}/         # 如 1.18.2, 1.19.4, 1.20.4, 1.21
│   │       ├── client/         # 客户端源码
│   │       ├── server/         # 服务端源码
│   │       └── mappings/      # 混淆映射
│   ├── sodium/
│   │   └── {version}/         # 如 0.5.4, 0.5.5
│   │       └── src/            # 源码
│   ├── iris/
│   │   └── {version}/
│   │       └── src/
│   └── ...                     # 其他 Mod 源文件
│
├── layouts/                    # Hugo 布局模板
├── static/                     # 静态资源
├── posts/                      # 博客文章 (可选)
└── scripts/                    # 构建脚本
```

### 2.2 内容目录结构详解

每个模块/版本必须包含以下目录结构，即使暂时为空：

```
{module}/
├── tutorials/                  # 教程目录
│   ├── README.md              # 章节说明
│   └── {topic}/               # 主题子目录
│       └── {article}.md       # 具体文章
│
└── analysis/                   # 分析目录
    ├── README.md              # 章节说明
    ├── SUMMARY.md             # 导航摘要
    └── {topic}/               # 主题子目录
        └── {article}.md       # 具体文章
```

### 2.3 源文件目录结构

`sources/` 目录用于存储原始的 Minecraft 和 Mod 源文件：

```
sources/
├── mc/                         # Minecraft 源文件
│   ├── 1.18.2/
│   │   ├── client/             # 客户端反编译源码
│   │   ├── server/             # 服务端反编译源码
│   │   └── mappings/           # Mojang mappings
│   ├── 1.19.4/
│   ├── 1.20.4/
│   ├── 1.21/
│   └── 1.21.4/
│
├── sodium/                     # Sodium 源码
│   ├── 0.5.4/
│   │   └── src/                # 源码
│   ├── 0.5.5/
│   └── 1.0.x/
│
├── iris/                       # Iris 源码
│   ├── 1.7/
│   └── 1.8/
│
└── fabric/                     # Fabric 相关
    └── loader/
```

---

## 3. 模块定义

### 3.1 当前模块

| 模块 ID | 名称 | 说明 |
|---------|------|------|
| `mc` | Minecraft 原版 | 不同版本的分析和教程 |
| `sodium` | Sodium | 优化模组 |
| `iris` | Iris | 光影支持模组 |

### 3.2 版本命名规范

- **Minecraft 版本**: 使用三位版本号，如 `1.18.2`, `1.21.4`
- **Mod 版本**: 使用实际版本号，如 `0.5.4`, `1.0.x`

---

## 4. 自动化目录创建

### 4.1 mkdir.js 脚本

使用 `scripts/mkdir.js` 自动创建标准目录结构：

```bash
# 创建所有模块的标准目录
node scripts/mkdir.js

# 创建特定模块的目录
node scripts/mkdir.js mc sodium iris

# 创建特定版本目录
node scripts/mkdir.js mc/1.22 sodium/0.5.5
```

### 4.2 目录创建规则

1. **自动创建子目录**: 每个模块自动创建 `tutorials/` 和 `analysis/` 目录
2. **版本目录**: MC 版本目录自动包含上述两个子目录
3. **占位文件**: 空目录创建 `.gitkeep` 或 `README.md` 占位

---

## 5. 转换流程

### 5.1 Markdown → HTML 转换

```
content/{module}/{version}/{category}/{article}.md
    ↓
website/docs/{module}/{version}/{category}/{article}.html
```

### 5.2 转换脚本

`convert.js` 负责将 `content/` 中的 Markdown 文件转换为 `website/docs/` 中的 HTML 文件。

---

## 6. Hugo 配置

### 6.1 permalinks 配置

```toml
[permalinks]
  mc = "/mc/:version/:section/:filename/"
  sodium = "/sodium/:section/:filename/"
  iris = "/iris/:section/:filename/"
```

### 6.2 内容组织

```toml
[frontmatter]
date = ["date", "publishDate"]
lastmod = ["lastmod", ":git"]
```

---

## 7. 迁移指南

### 7.1 从旧架构迁移

1. 运行 `node scripts/mkdir.js` 创建新目录结构
2. 将现有 `.md` 文件移动到对应的新目录
3. 更新 Hugo 配置文件
4. 运行 `node convert.js` 重新生成 HTML
5. 验证网站功能正常

### 7.2 新项目初始化

1. 克隆项目后运行 `node scripts/mkdir.js` 初始化目录
2. 根据需要在对应目录创建 Markdown 文件
3. 使用 `node convert.js` 生成网站

---

## 8. 最佳实践

1. **保持一致性**: 所有模块使用相同的目录命名
2. **版本隔离**: 不同版本的内容放在独立目录
3. **自动维护**: 使用脚本创建目录，避免手动操作
4. **文档先行**: 每个章节创建 README.md 说明内容
5. **源文件归档**: JAR 和源码放在 sources/ 目录便于参考
