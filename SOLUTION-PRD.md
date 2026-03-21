# Blog 项目链接和导航问题解决方案 PRD v2.0

> 本文档旨在解决博客项目的 404 链接问题和"原版分析"页面不可见问题

---

## 1. 问题概述

### 1.1 用户反馈的问题

1. **部分链接点进去 404** - 用户点击某些链接时页面不存在
2. **原版分析页面消失** - "原版分析"相关内容无法正常访问

### 1.2 问题根因分析

通过代码审查，发现以下问题：

| # | 问题类型 | 根因 | 影响范围 |
|---|---------|------|---------|
| 1 | 缺少配置文件 | 项目根目录没有 `hugo.toml` 或 `config.toml` | 全部页面 |
| 2 | 相对链接失效 | 使用 `../Part-X/xx.md` 格式的相对路径链接在非预期入口访问时解析错误 | content/mc/1.21/tutorials/, content/iris/, content/sodium/ |
| 3 | 缺少导航菜单 | 没有定义 `[[menu]]` 配置，用户无法通过菜单访问 | content/mc/1.21/analysis/ |
| 4 | 缺少主题/模板 | 没有 themes/ 和 layouts/ 目录 | 页面渲染样式 |
| 5 | 目录结构歧义 | `content/mc/1.21/analysis/` vs `content/sodium/analysis/` 路径未明确 | 原版分析页面 |

---

## 2. 项目现状分析

### 2.1 当前目录结构（已核实）

```
D:\Blog\
└── content/
    ├── mc/
    │   └── 1.21/
    │       ├── tutorials/           # MC 教程 (82 个文件)
    │       │   ├── Part-0-Prerequisites/     # 5 个文件
    │       │   ├── Part-1-Foundation/        # 4 个文件
    │       │   ├── Part-2-World/            # 6 个文件
    │       │   ├── Part-3-Block-Item/       # 6 个文件
    │       │   ├── Part-4-Entity/           # 7 个文件
    │       │   ├── Part-5-AI/               # 6 个文件 ⚠️ (不是 Part-5-Event)
    │       │   ├── Part-6-Network/         # 4 个文件
    │       │   ├── Part-7-Command/          # 4 个文件
    │       │   ├── Part-8-Resource/         # 5 个文件
    │       │   ├── Part-9-Client/            # 4 个文件
    │       │   ├── Part-10-Server/           # 4 个文件
    │       │   ├── Part-11-Advanced/        # 5 个文件
    │       │   ├── Part-12-Practice/         # 4 个文件
    │       │   ├── Part-13-Additional/      # 9 个文件
    │       │   └── README.md
    │       └── analysis/             # 原版分析 (12 个文件)
    │           ├── README.md
    │           ├── SUMMARY.md
    │           └── 01-10-*.md
    ├── iris/
    │   ├── tutorials/               # Iris 教程 (4 个文件，包含 README.md)
    │   │   ├── README.md
    │   │   ├── 01-shader-basics.md
    │   │   ├── 02-iris-setup.md
    │   │   └── 03-create-simple-shader.md
    │   └── analysis/                # Iris 分析 (7 个文件)
    │       ├── README.md
    │       ├── SUMMARY.md
    │       └── 01-06-*.md
    └── sodium/
        ├── tutorials/              # Sodium 教程 (3 个文件，包含 README.md)
        │   ├── README.md
        │   ├── 01-mod-dev-intro.md
        │   └── 03-multithreading-basics.md
        └── analysis/              # Sodium 分析 (8 个文件，包含 README.md)
            ├── README.md
            ├── SUMMARY.md
            └── 01-06-*.md
```

### 2.2 实际链接格式分析

**MC 教程中的链接格式**：
```markdown
[04-注册表系统.md](../Part-1-Foundation/04-registry-system.md)
[20-entity-intro.md](../Part-4-Entity/20-entity-intro.md)
```

**Iris 教程中的链接格式**：
```markdown
[02-iris-setup.md](./02-iris-setup.md)
```

### 2.3 内容统计（已修正）

| 模块 | 目录 | 实际文件数 |
|------|------|-----------|
| Minecraft 1.21 教程 | `content/mc/1.21/tutorials/` | 82 |
| Minecraft 1.21 分析 | `content/mc/1.21/analysis/` | 12 |
| Iris 教程 | `content/iris/tutorials/` | 4 |
| Iris 分析 | `content/iris/analysis/` | 7 |
| Sodium 教程 | `content/sodium/tutorials/` | 3 |
| Sodium 分析 | `content/sodium/analysis/` | 8 |

---

## 3. 解决方案设计

### 3.1 方案一：最小化修复（推荐实施）

只添加必要的配置文件，修复链接格式。

**优点**：
- 改动最小
- 风险最低
- 快速见效

**缺点**：
- 样式保持默认
- 功能有限

#### 3.1.1 第一步：检查现有配置文件

在创建 `hugo.toml` 之前，必须先检查是否存在现有配置文件：

```bash
# 检查项目根目录
ls -la D:\Blog\*.toml D:\Blog\*.yaml D:\Blog\*.yml D:\Blog\config.* 2>/dev/null
```

如果存在现有配置文件（如 `config.toml`），则应：
- 迁移现有配置到 `hugo.toml`，或
- 继续使用现有配置文件，只添加缺失的配置

#### 3.1.2 第二步：创建/更新 Hugo 配置

**选项 A：如果没有现有配置文件**

创建新的 `hugo.toml`：

```toml
baseURL = "https://your-domain.com/"
languageCode = "zh-cn"
title = "Blog"
canonifyURLs = false
disablePathToLower = true
uglyURLs = false

[frontmatter]
date = ["date", "publishDate"]
lastmod = ["lastmod", ":git"]
expiryDate = ["expiryDate"]

[markup]
  [markup.tableOfContents]
    startLevel = 2
    endLevel = 6
    ordered = false

[permalinks]
  mc = "/mc/:section/:filename/"
  iris = "/iris/:section/:filename/"
  sodium = "/sodium/:section/:filename/"

[[menu.main]]
  name = "首页"
  url = "/"
  weight = 0

[[menu.main]]
  name = "MC 教程"
  url = "/mc/1.21/tutorials/"
  weight = 1

[[menu.main]]
  name = "MC 原版分析"
  url = "/mc/1.21/analysis/"
  weight = 2

[[menu.main]]
  name = "Iris"
  url = "/iris/"
  weight = 3

[[menu.main]]
  name = "Sodium"
  url = "/sodium/"
  weight = 4
```

**选项 B：如果存在现有配置文件（如 config.toml）**

直接修改现有配置文件，添加缺失的配置项。

#### 3.1.3 第三步：链接格式转换规则

**转换规则说明**：

| 原格式 | 新格式 | 示例 |
|--------|--------|------|
| `../Part-X/xx.md` | `/mc/1.21/tutorials/Part-X/xx/` | `../Part-4-Entity/20-entity-intro.md` → `/mc/1.21/tutorials/Part-4-Entity/20-entity-intro/` |
| `./02-xxx.md` | `/iris/tutorials/02-xxx/` | `./02-iris-setup.md` → `/iris/tutorials/02-iris-setup/` |
| `./SUMMARY.md` | `/iris/analysis/SUMMARY/` | `./SUMMARY.md` → `/iris/analysis/SUMMARY/` |

**关键点**：
- 移除 `.md` 扩展名
- 添加前导 `/` 变为绝对路径
- 使用目录路径格式（以 `/` 结尾）

#### 3.1.4 第四步：批量修复脚本

```powershell
# PowerShell 脚本：批量替换相对链接为绝对链接

$contentDir = "D:\Blog\content"

# 1. 修复 MC 教程中的链接
Get-ChildItem -Path "$contentDir\mc\1.21\tutorials" -Filter "*.md" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # 替换 ../Part-X/xx.md 格式
    $newContent = $content -replace '\.\./Part-(\w+)/(\d+-[\w-]+)\.md', '/mc/1.21/tutorials/Part-$1/$2/'
    # 替换同目录的 ./xx.md 格式
    $newContent = $newContent -replace '\.\/(\d+-[\w-]+)\.md', '/mc/1.21/tutorials/$1/'
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.Name)"
    }
}

# 2. 修复 Iris 教程中的链接
Get-ChildItem -Path "$contentDir\iris\tutorials" -Filter "*.md" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '\.\/(\d+-[\w-]+)\.md', '/iris/tutorials/$1/'
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed Iris: $($_.Name)"
    }
}

# 3. 修复 Iris 分析中的链接
Get-ChildItem -Path "$contentDir\iris\analysis" -Filter "*.md" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '\.\/(\d+-[\w-]+)\.md', '/iris/analysis/$1/'
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed Iris Analysis: $($_.Name)"
    }
}

# 4. 修复 Sodium 教程中的链接
Get-ChildItem -Path "$contentDir\sodium\tutorials" -Filter "*.md" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '\.\/(\d+-[\w-]+)\.md', '/sodium/tutorials/$1/'
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed Sodium: $($_.Name)"
    }
}

# 5. 修复 Sodium 分析中的链接
Get-ChildItem -Path "$contentDir\sodium\analysis" -Filter "*.md" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '\.\/(\d+-[\w-]+)\.md', '/sodium/analysis/$1/'
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed Sodium Analysis: $($_.Name)"
    }
}

Write-Host "Link fixing completed!"
```

### 3.2 方案二：完整优化方案（可选）

在方案一基础上，添加主题和完善的模板系统。

#### 3.2.1 主题选择建议

| 主题 | 特点 | 适用场景 |
|------|------|---------|
| **hugo-theme-pure** | 简洁、文档友好、中文支持好 | 技术文档/博客 |
| **hugo-book** | 侧边栏导航、目录结构清晰 | 教程/手册 |
| **Docsy** | 大型文档站点、搜索功能 | 项目文档 |

**推荐**：`hugo-theme-pure` 或 `hugo-book`

#### 3.2.2 layouts 目录结构

```
layouts/
├── _default/
│   ├── baseof.html
│   ├── list.html
│   └── single.html
├── index.html
└── partials/
    └── menu.html
```

---

## 4. 具体实施计划

### 4.1 实施优先级（已调整）

| 优先级 | 阶段 | 任务 | 说明 |
|--------|------|------|------|
| P0 | 阶段一 | 检查现有配置文件 | 避免配置冲突 |
| P0 | 阶段一 | 创建/更新 Hugo 配置 | 核心配置 |
| P1 | 阶段二 | 修复 MC 教程链接 | 82 个文件，文件最多 |
| P1 | 阶段二 | 修复 MC 分析链接 | 12 个文件 |
| P2 | 阶段二 | 修复 Iris 链接 | 11 个文件 |
| P2 | 阶段二 | 修复 Sodium 链接 | 11 个文件 |
| P3 | 阶段三 | 添加主题和模板 | 可选优化 |

### 4.2 详细任务列表

#### 阶段一：核心配置（必须完成）

```bash
# 1. 检查现有配置
ls *.toml *.yaml *.yml config.* 2>/dev/null || echo "No existing config found"

# 2. 创建 hugo.toml
# (见上方 3.1.2 节)

# 3. 本地测试
hugo server -D
# 访问 http://localhost:1313 验证
```

#### 阶段二：链接修复（按优先级执行）

```bash
# 1. 修复 MC 教程 (82 个文件)
# 执行脚本或手动替换

# 2. 修复 MC 分析 (12 个文件)

# 3. 修复 Iris (11 个文件)

# 4. 修复 Sodium (11 个文件)

# 5. 验证所有链接
hugo --verbose | grep -i "warning\|error"
```

#### 阶段三：可选优化

```bash
# 添加主题
git submodule add https://github.com/example/hugo-theme themes/hugo-theme

# 或创建自定义 layouts
mkdir -p layouts/_default
```

---

## 5. 链接修复规范

### 5.1 链接格式标准

| 类型 | 原格式 | 新格式 | 示例 |
|------|--------|--------|------|
| 跨目录相对链接 | `../Part-X/xx.md` | `/mc/1.21/tutorials/Part-X/xx/` | `../Part-4-Entity/20-entity-intro.md` → `/mc/1.21/tutorials/Part-4-Entity/20-entity-intro/` |
| 同目录相对链接 | `./xx.md` | `/xxx/tutorials/xx/` | `./02-iris-setup.md` → `/iris/tutorials/02-iris-setup/` |
| 父目录相对链接 | `../analysis/xx.md` | `/xxx/analysis/xx/` | `../analysis/SUMMARY.md` → `/iris/analysis/SUMMARY/` |
| 外部链接 | URL | URL（保持不变） | `https://minecraft.wiki/` |

### 5.2 禁止使用的格式

```markdown
❌ ./02-xxx.md       # 相对路径
❌ ../Part-X/xx.md   # 相对路径
❌ xx.md             # 无路径前缀
❌ xx.md#anchor      # 带锚点的相对路径
```

### 5.3 推荐使用的格式

```markdown
✅ /mc/1.21/tutorials/Part-4-Entity/20-entity-intro/           # MC 教程绝对路径
✅ /iris/tutorials/02-iris-setup/                                # Iris 教程绝对路径
✅ /mc/1.21/analysis/                                            # MC 分析目录
✅ [链接文本](https://minecraft.wiki/)                           # 外部链接保持原样
```

---

## 6. 导航结构设计

### 6.1 顶部导航菜单

```
┌─────────┬──────────────────┬───────────┬──────────┬────────────┐
│  首页   │   MC 1.21 教程   │ MC 原版分析 │   Iris   │  Sodium    │
└─────────┴──────────────────┴───────────┴──────────┴────────────┘
  /            /mc/1.21/tutorials/  /mc/1.21/analysis/  /iris/   /sodium/
```

### 6.2 MC 原版分析页面结构（已核实）

```
MC 原版分析 (/mc/1.21/analysis/)
├── README.md (总览)           ✓
├── SUMMARY.md (总结)          ✓
├── 01-architecture-overview.md  ✓ 架构总览
├── 02-client-module.md          ✓ 客户端模块
├── 03-server-module.md          ✓ 服务端模块
├── 04-world-system.md           ✓ 世界系统
├── 05-entity-system.md          ✓ 实体系统
├── 06-block-item-system.md      ✓ 方块物品系统
├── 07-network-protocol.md       ✓ 网络协议
├── 08-datafixer-system.md       ✓ 数据修复系统
├── 09-registry-system.md        ✓ 注册表系统
└── 10-package-structure.md      ✓ 包结构
```

### 6.3 MC 教程目录结构（已核实）

```
MC 教程 (/mc/1.21/tutorials/)
├── Part-0-Prerequisites/    # 前置知识 (5 文件)
│   ├── 01-java-basics.md
│   ├── 02-development-env.md
│   ├── 03-project-intro.md
│   ├── 04-sourcecode-guide.md
│   └── README.md
├── Part-1-Foundation/       # 核心基础 (4 文件)
│   ├── 04-registry-system.md  ⚠️ 注意：编号从 04 开始
│   ├── 05-client-server-arch.md
│   ├── 06-shared-constants.md
│   └── 07-bootstrap-flow.md
├── Part-2-World/            # 世界系统 (6 文件)
├── Part-3-Block-Item/       # 方块物品 (6 文件)
├── Part-4-Entity/           # 实体系统 (7 文件)
├── Part-5-AI/               # AI 系统 (6 文件) ⚠️ 不是 Part-5-Event
├── Part-6-Network/           # 网络系统 (4 文件)
├── Part-7-Command/          # 命令系统 (4 文件)
├── Part-8-Resource/         # 资源系统 (5 文件)
├── Part-9-Client/           # 客户端 (4 文件)
├── Part-10-Server/          # 服务端 (4 文件)
├── Part-11-Advanced/        # 进阶主题 (5 文件)
├── Part-12-Practice/        # 实战项目 (4 文件)
├── Part-13-Additional/      # 补充系统 (9 文件)
└── README.md
```

### 6.4 Iris/Sodium 页面结构

```
Iris (/iris/)
├── 教程 (/iris/tutorials/)
│   ├── README.md
│   ├── 01-shader-basics.md
│   ├── 02-iris-setup.md
│   └── 03-create-simple-shader.md
└── 分析 (/iris/analysis/)
    ├── README.md
    ├── SUMMARY.md
    ├── 01-architecture-overview.md
    ├── 02-rendering-pipeline.md
    ├── 03-shaderpack-system.md
    ├── 04-shadow-system.md
    ├── 05-framebuffer-texture.md
    └── 06-uniforms.md

Sodium (/sodium/)
├── 教程 (/sodium/tutorials/)
│   ├── README.md
│   ├── 01-mod-dev-intro.md
│   └── 03-multithreading-basics.md
└── 分析 (/sodium/analysis/)
    ├── README.md
    ├── SUMMARY.md
    ├── 01-architecture-overview.md
    ├── 02-chunk-render-system.md
    ├── 03-occlusion-culling.md
    ├── 04-render-pipeline.md
    ├── 05-shader-system.md
    └── 06-platform-integration.md
```

---

## 7. 验证清单

### 7.1 配置验证

- [ ] 项目根目录无现有配置文件，或已迁移配置到 hugo.toml
- [ ] `hugo server` 能正常启动
- [ ] 无配置相关警告或错误

### 7.2 功能验证

- [ ] 首页 `/` 能正常访问
- [ ] MC 教程 `/mc/1.21/tutorials/` 能正常访问
- [ ] MC 原版分析 `/mc/1.21/analysis/` 能正常访问
- [ ] Iris 教程 `/iris/tutorials/` 能正常访问
- [ ] Iris 分析 `/iris/analysis/` 能正常访问
- [ ] Sodium 教程 `/sodium/tutorials/` 能正常访问
- [ ] Sodium 分析 `/sodium/analysis/` 能正常访问

### 7.3 链接验证

- [ ] 所有 `../Part-X/xx.md` 格式链接已替换为 `/mc/1.21/tutorials/...`
- [ ] 所有 `./xx.md` 格式链接已替换为绝对路径
- [ ] 所有 `.md` 扩展名已移除
- [ ] 所有链接以 `/` 结尾或对应实际页面路径

### 7.4 导航验证

- [ ] 顶部菜单显示正确
- [ ] 点击菜单项能正确跳转到对应页面
- [ ] 菜单权重排序正确

---

## 8. 风险评估与缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 现有配置文件冲突 | 站点无法构建 | **先检查现有配置**，再决定创建或迁移 |
| 链接修复遗漏 | 部分页面仍 404 | 使用自动化脚本批量修复，并人工抽检 |
| 正则表达式错误 | 链接格式错误 | 先在少量文件上测试，确认无误后批量执行 |
| Hugo 版本差异 | 配置不兼容 | 确保使用最新稳定版 Hugo |

---

## 9. 附录

### 9.1 Hugo 文档参考

- [Hugo 官方文档](https://gohugo.io/documentation/)
- [Hugo 菜单配置](https://gohugo.io/content-management/menu/)
- [Hugo 链接管理](https://gohugo.io/content-management/links/)
- [Hugo 永久链接](https://gohugo.io/content-management/urls/)

### 9.2 快速检查命令

```bash
# 检查 Hugo 版本
hugo version

# 检查项目配置
hugo config

# 列出所有页面
hugo list all

# 检查死链
hugo --verbose 2>&1 | grep -i "warning.*link"
```

### 9.3 回滚方案

如果修复后出现问题，可以：

```bash
# 使用 Git 回滚
git checkout -- content/

# 或回滚配置文件
git checkout -- hugo.toml config.toml
```

---

## 10. 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| 1.0 | 2026-03-21 | 初始版本 |
| 2.0 | 2026-03-21 | 修订版本，修复评审问题 |

### v2.0 修复的问题

1. ✅ 修正 `Part-5-Event` 为 `Part-5-AI`
2. ✅ 更新目录结构描述与实际一致
3. ✅ 修正内容统计（包含 README.md）
4. ✅ 添加配置文件冲突检查步骤
5. ✅ 完善链接转换规则说明
6. ✅ 调整实施优先级（MC 教程优先）
7. ✅ 添加 PowerShell 批量修复脚本
8. ✅ 修正 MC 原版分析文件列表

---

*文档版本：2.0*
*创建时间：2026-03-21*
*最后更新：2026-03-21*
*作者：Cursor Agent*
