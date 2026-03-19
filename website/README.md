# MC 开发文档中心

一个专注于 Minecraft 源码和 Mod 开发的开源学习项目。

## 文档分类

### 原版 Minecraft
深入学习 Minecraft 源码架构，包含注册表系统、AI 大脑、World、实体等核心内容。

### Sodium
高性能渲染优化 Mod 源码分析，涵盖 Chunk 渲染、视锥剔除、着色器管理等。

### Iris
光影 Mod 渲染架构深度解析，包括渲染管线、ShaderPack 系统、阴影系统等。

## 技术栈

- HTML5 + CSS3
- Vanilla JavaScript
- Font Awesome 6
- Google Fonts (Noto Sans SC)

## 运行方式

直接用浏览器打开 `index.html` 即可。

## 项目结构

```
website-new/
├── index.html          # 主页
├── about.html          # 关于页面
├── styles.css          # 全局样式
├── script.js           # 全局脚本
├── vanilla/            # 原版文档
│   ├── index.html
│   ├── styles.css
│   ├── analysis/       # 分析文档
│   └── tutorials/      # 教程文档
├── mods/               # Mod 文档
│   ├── sodium/
│   │   ├── index.html
│   │   └── analysis/
│   └── iris/
│       ├── index.html
│       └── analysis/
```

## License

MIT License
