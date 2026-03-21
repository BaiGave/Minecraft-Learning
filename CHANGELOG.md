# Changelog - 变更日志

所有重要的项目变更都会记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

## [1.1.0] - 2026-03-21

### Added

- **统一设计系统** - 新增 `website/scripts/design-system.css` CSS 变量文件
  - 完整的色彩系统（主色、辅助色、语义色）
  - 排版系统（字体、字号、字重、行高）
  - 间距系统
  - 阴影系统
  - 圆角系统
  - 过渡动画系统
  - 层级系统

- **共享工具库** - 新增 `website/scripts/utils.js`
  - `Utils` - 通用工具函数（防抖、节流、DOM 查询等）
  - `EventBus` - 事件发布/订阅系统
  - `Toast` - 轻提示通知组件

- **变更日志** - 新增 `CHANGELOG.md`

### Improved

- **构建脚本重构** - 优化 `convert.js` 和 `website/convert.js`
  - 添加详细的彩色日志输出
  - 进度条显示
  - 错误处理和统计摘要
  - 支持 `--verbose` 和 `--dry-run` 参数

- **JavaScript 重构** - 优化 `script.js` 和 `website/script.js`
  - 添加错误处理（try-catch）
  - 添加空值检查（防御性编程）
  - 统一工具函数
  - 更好的代码组织
  - Toast 通知系统

- **文档改进** - 更新 `README.md`
  - 完整的项目结构说明
  - NPM 脚本使用说明
  - 博客和教程写作指南

- **项目配置** - 优化 `package.json`
  - NPM 脚本（build:blog, build:website, build:all）
  - 开发服务器配置

## [1.0.0] - 2026-03-20

### Added

- **博客系统**
  - `index.html` - 博客首页
  - `article.html` - 文章详情页
  - `convert.js` - Markdown 转 HTML 构建脚本
  - `posts/` - 博客文章源文件目录

- **教程站系统**
  - `website/index.html` - 教程站首页
  - `website/catalog.html` - 文档目录页
  - `website/roadmap.html` - 学习路线图
  - `website/about.html` - 关于页面
  - `website/convert.js` - 教程 Markdown 转 HTML 构建脚本
  - `website/content/` - 教程源码目录

- **内容**
  - MC 1.21 教程 (82 篇)
  - MC 1.21 源码分析 (12 篇)
  - Iris 光影教程 (4 篇) + 源码分析 (6 篇)
  - Sodium 优化教程 (3 篇) + 源码分析 (6 篇)

- **样式系统**
  - 响应式设计
  - 深色模式支持
  - 代码高亮
  - 移动端优化

- **交互功能**
  - 移动端菜单
  - 平滑滚动
  - 文章搜索和筛选
  - 代码复制
  - 返回顶部按钮
  - 阅读进度条

---

## 如何编写变更日志

### 类别说明

- **Added** - 新增功能
- **Changed** - 功能的变更
- **Deprecated** - 已废弃的功能
- **Removed** - 已移除的功能
- **Fixed** - Bug 修复
- **Security** - 安全相关修复
- **Improved** - 优化和改进

### 版本格式

```
## [版本号] - 日期

### Added/Changed/Fixed...
- 具体变更内容
```

### 语义化版本

- **Major** (主版本) - 不兼容的 API 变更
- **Minor** (次版本) - 向后兼容的功能新增
- **Patch** (修订版) - 向后兼容的 Bug 修复
