# 我的技术博客

个人技术博客 + Minecraft 1.21 源码教程站。

- **博客首页**：技术文章、随想
- **MC 教程**：导航栏「MC 教程」可进入教程站

## 本地预览

用浏览器直接打开 `index.html`，或使用任意静态服务器（如 `npx serve .`）。

## 写新文章

1. 在 `posts/` 下新建 `.md` 文件，按 `first-post.md` 格式写前置元数据
2. 运行 `node convert.js` 重新生成页面
3. 提交并推送到 GitHub

## 部署

已配置 GitHub Pages 后，推送 `main` 分支即可自动部署。

访问：**https://baigave.github.io/Blog/**

详细步骤见 [DEPLOY.md](DEPLOY.md)。
