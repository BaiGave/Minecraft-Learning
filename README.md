# Minecraft Learning

Minecraft 原版 / Iris / Sodium 源码教程与技术分析站点，纯静态页面，可本地直接打开或通过任意静态服务器托管。

## 目录结构

```
Minecraft-Learning/
├── index.html              # 首页
├── roadmap.html            # 学习路线图
├── catalog.html            # 文档目录
├── about.html              # 关于页面
│
├── styles.css              # 主页样式
├── tutorial.css            # 教程页样式
├── roadmap.css            # 路线图样式
├── catalog.css             # 目录页样式
├── about.css               # 关于页样式
│
├── script.js               # 主页交互脚本
├── tutorial.js             # 教程页交互脚本
│
├── site-stats.js           # 站点统计数据 (生成)
├── site-stats.json         # 站点统计数据 (生成)
│
├── package.json            # 项目配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
│
├── build/                   # 构建脚本目录
│   ├── convert.js          # Markdown → HTML 转换脚本
│   └── watch.js            # 文件监听与自动构建
│
├── scripts/                 # 构建辅助脚本
│   ├── config.js           # 模块配置
│   ├── utils.js            # 工具函数
│   ├── convert.js           # 转换辅助脚本
│   ├── converter.js         # 转换器核心
│   ├── seo.js              # SEO 生成
│   ├── search.js           # 搜索功能
│   ├── theme.js            # 主题管理
│   ├── safe-markdown-link.js
│   ├── resolve-markdown-link.js
│   ├── publish-config.js
│   └── ...
│
├── content/                 # 教程源码（Markdown）
│   ├── mc/1.21/            # MC 1.21 教程 + 源码分析
│   ├── iris/               # Iris 光影教程 + 分析
│   └── sodium/              # Sodium 优化教程 + 分析
│
├── styles/                  # 样式源文件
│   ├── main.css
│   ├── components.css
│   ├── shell.css
│   ├── variables.css
│   └── tailwind.css
│
├── lib/                     # 第三方库本地副本
│   ├── highlight.js/
│   ├── flexsearch/
│   ├── countup/
│   ├── font-awesome/
│   └── lucide/
│
├── src/                     # Tailwind 源码
│   └── tailwind.css
│
└── docs/                   # 生成的 HTML 文档（部署用）
    ├── mc/1.21/
    ├── iris/
    └── sodium/
```

## 快速开始

### 1. 安装依赖（可选）

```bash
npm install
```

### 2. 本地预览

```bash
# 使用静态服务器
npm run dev

# 或直接用浏览器打开 index.html
```

### 3. 构建文档

```bash
# 转换 Markdown 到 HTML
node build/convert.js

# 监听文件变化并自动构建
node build/watch.js
```

## 编写教程

### 1. 创建教程

在 `content/` 下创建 Markdown 文件：

```markdown
# 教程标题

> **简介** 这里是教程的简短描述

## 第一部分

正文内容...

## 第二部分

更多内容...
```

### 2. 代码块格式

```java
// 普通代码块
public class Example {
    public void test() {
        System.out.println("Hello");
    }
}
```

```mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[执行]
    B -->|否| D[退出]
```

```startLine:endLine:filepath
// 代码引用块（用于引用源码）
```

### 3. 重新构建

```bash
npm run build
```

## 项目脚本

| 脚本 | 说明 |
|------|------|
| `npm run build` | 一键构建：MD→HTML → 索引页 → 统计（全量） |
| `npm run dev` | 监听文件变化，自动重建（开发时用） |
| `npm run preview` | 启动本地服务器 `http://localhost:3456` 预览 |
| `npm run clean` | 清理 `docs/` 和样式文件 |

## 部署

项目已配置 GitHub Pages：

1. 推送代码到 GitHub `main` 分支
2. GitHub Actions 自动构建（若仓库中已配置 workflow）
3. 访问 `https://你的用户名.github.io/Minecraft-Learning/`（站点根路径与仓库名一致）

**本地预览（推荐）**：不要用资源管理器双击打开 `docs/*.html`（`file://` 协议下浏览器会限制跨文件访问、脚本与部分资源）。在项目根目录执行：

```bash
node server.js
```

浏览器打开 `http://localhost:3456` 即可，行为与 GitHub Pages 上的 `https` 站点一致。

## 技术栈

- **样式**: Tailwind CSS 3.4 + 自定义 CSS
- **图标**: Font Awesome 6.5 + Lucide Icons
- **搜索**: FlexSearch（本地）
- **代码高亮**: Highlight.js（本地）
- **数字动画**: CountUp.js（本地）
- **图表**: Mermaid.js（本地）
- **字体**: Noto Sans SC + Inter（Google Fonts CDN）

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
