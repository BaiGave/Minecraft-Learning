# 部署到 GitHub Pages

本文档帮助你把博客和教程网站部署到 GitHub Pages，让任何人都能访问。

## 准备工作

### 1. 安装 Git

如果没有安装，先下载安装：https://git-scm.com/download/win

### 2. 创建 GitHub 账号

如果没有，访问 https://github.com 注册一个账号。

---

## 部署步骤

### 步骤 1：创建 GitHub 仓库

1. 登录 GitHub，点击右上角 **+** → **New repository**
2. 填写仓库名称（例如 `my-blog`）
3. 选择 **Public**（公开仓库）
4. 点击 **Create repository**

### 步骤 2：初始化本地 Git 仓库

在 `d:\Projects\mc` 目录下打开终端（或在 Cursor 终端中），执行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - 我的技术博客"
```

### 步骤 3：关联 GitHub 仓库

把本地仓库连接到 GitHub（把下面的 `你的用户名` 和 `仓库名` 换成你的）：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
```

### 步骤 4：推送到 GitHub

```bash
git branch -M main
git push -u origin main
```

### 步骤 5：启用 GitHub Pages

1. 在 GitHub 仓库页面，点击 **Settings**（设置）
2. 左侧菜单找到 **Pages**
3. **Source** 选项选择 **Deploy from a branch**
4. **Branch** 选择 **main**，文件夹选择 **/ (root)**
5. 点击 **Save**

### 步骤 6：等待部署

等待 1-2 分钟，GitHub 会自动构建并部署。

访问 `https://你的用户名.github.io/仓库名/` 查看你的网站！

---

## 目录结构说明

部署后，博客和教程都在同一个网站上：

```
https://你的用户名.github.io/仓库名/
├── index.html          ← 博客首页
├── article.html        ← 博客文章页
├── styles.css          ← 博客样式
├── script.js           ← 博客脚本
├── posts/              ← 博客文章（Markdown）
├── website/            ← MC 教程网站
│   ├── index.html      ← 教程首页
│   ├── catalog.html    ← 教程目录
│   └── tutorials/      ← 所有教程页面
```

---

## 常见问题

### Q: 访问 404？

等待 2-3 分钟让 GitHub 部署完成。如果长时间还是 404，检查：
- Settings → Pages 是否正确配置
- 仓库是否为 Public

### Q: 样式不显示？

检查浏览器控制台（F12）是否有路径错误。确保 `index.html` 中的 CSS/JS 路径正确。

### Q: 如何更新文章？

1. 修改 `posts/` 下的 Markdown 文件
2. 运行 `node convert.js` 重新生成
3. 提交并推送：

```bash
git add .
git commit -m "更新文章"
git push
```

GitHub 会自动重新部署。

### Q: 如何添加自定义域名？

在仓库 Settings → Pages → Custom domain 中添加你的域名，然后按提示配置 DNS。

---

## 进阶：自动部署（可选）

使用 GitHub Actions 实现每次推送自动部署：

1. 在仓库创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

2. 推送后，GitHub 会自动部署。

---

## 享受你的博客！

现在你的博客已经上线，快去写文章吧！

有任何问题随时问我。
