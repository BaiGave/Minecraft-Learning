# 模组源码分析写作提示词（给 AI / 团队）

请**系统性地分析**指定模组源码（可按子系统拆分多篇文章），经**一轮交叉审查**后，将 Markdown 放入版本分支目录下的 `analysis/`。

---

## 一、目录结构（必须遵守）

分析文档**必须**放在版本分支目录下：

```
content/{模组名}/
└── {MC版本}-{加载器}-{模组版本}/      ← 必须使用这种格式
    └── analysis/                        ← 分析文档放在这里
        └── *.md
```

**正确示例（参考 sodium、iris）：**

```
content/sodium/1.21/fabric/0.8.6/analysis/
content/iris/1.21/fabric/1.7.3/analysis/
content/voxy/1.21.11-fabric-0.2.13-alpha/analysis/
```

❌ **错误示例（无版本分支）：**

```
content/voxy/analysis/           ← 缺少版本信息
content/voxy/1.21/analysis/       ← 缺少加载器和模组版本
```

---

## 二、版本目录命名规范

| 字段 | 说明 | 示例 |
|------|------|------|
| `{MC版本}` | Minecraft 版本号 | `1.21`、`1.21.11` |
| `{加载器}` | 加载器小写 | `fabric`、`neoforge` |
| `{模组版本}` | 模组版本号 | `0.2.13-alpha`、`6.0.6` |

完整格式：`{MC版本}-{加载器}-{模组版本}`，三部分用**短横线分隔**，无空格。

---

## 三、致谢与元信息（必须）

1. 在 **`content/{模组slug}/README.md`** 中写明：`originalAuthor`、`sourceUrl`、`modVersion`、`minecraftVersion`、`loader`。
2. 分析文档前言或 `SUMMARY.md` 中应**致谢原作者**，并注明本分析为第三方学习笔记，**以官方仓库与许可证为准**。

---

## 四、写作与引用

1. **源码路径**：`D:\Minecraft-Learning\assets\{模组文件夹名}\src\...`。
2. 架构文建议：`01-architecture-overview.md`、按子系统的 `02-xxx-system.md`，以及 **`SUMMARY.md`** 作总览。
3. 命名：**英文 kebab-case** 文件名 + `XX-` 序号。
4. 可含 Mermaid 架构图；代码块使用 ` ```java ` 等标准围栏。

---

## 五、与分析对象的关系

| 维度 | 分析文档 |
|------|----------|
| 读者 | 有基础的开发者 |
| 目的 | 理解架构与扩展点 |
| 代码密度 | 可较高 |
| 示例 | 可选，偏调用链与类职责 |
