# 模组源码分析写作提示词（给 AI / 团队）

请**系统性地分析**指定模组源码（可按子系统拆分多篇文章），经**一轮交叉审查**后，将 Markdown 放入 `content/{模组slug}/analysis/`，布局可参考 `content/mc/1.21/analysis/` 或同模组下的 `analysis/SUMMARY.md` 索引结构。

---

## 一、致谢与元信息（必须）

1. 在 **`content/{模组slug}/README.md`** 中写明：`originalAuthor`、`sourceUrl`（若有）、`modVersion`、`minecraftVersion`、`loader`。  
2. 分析文档前言或 `SUMMARY.md` 中应**致谢原作者**，并注明本分析为第三方学习笔记，**以官方仓库与许可证为准**。

---

## 二、目录与版本分支

与教程相同，支持：

- `content/{模组slug}/analysis/`（无版本分支）  
- `content/{模组slug}/{MC版本}/analysis/`  
- `content/{模组slug}/{MC版本}-{加载器}/analysis/`  

详见 `prompt-specs/mc-tutorial.md` 第二节。

---

## 三、写作与引用

1. **源码路径**：`D:\Minecraft-Learning\assets\{模组文件夹名}\src\...`。  
2. 架构文建议：`01-architecture-overview.md`、按子系统的 `02-xxx-system.md`，以及 **`SUMMARY.md`** 作总览。  
3. 命名：**英文 kebab-case** 文件名 + `XX-` 序号（与仓库 `mod-analysis-storage` 规则一致）。  
4. 可含 Mermaid 架构图；代码块使用 ` ```java ` 等标准围栏。

---

## 四、与分析对象的关系

| 维度 | 分析文档 |
|------|----------|
| 读者 | 有基础的开发者 |
| 目的 | 理解架构与扩展点 |
| 代码密度 | 可较高 |
| 示例 | 可选，偏调用链与类职责 |
