# 模组教程写作提示词（给 AI / 团队）

根据**源码与既有分析文档**，为指定模组编写**面向新手**的教程系列，放入本仓库版本分支目录下的 `tutorials/`。

---

## 一、目录结构（必须遵守）

教程文档**必须**放在版本分支目录下：

```
content/{模组名}/
└── {MC版本}-{加载器}-{模组版本}/      ← 必须使用这种格式
    └── tutorials/                       ← 教程文档放在这里
        └── Part-*/                      ← 按章节分目录
            └── *.md
```

**正确示例（参考 sodium、iris）：**

```
content/sodium/1.21/fabric/0.8.6/tutorials/
content/iris/1.21/fabric/1.7.3/tutorials/
content/voxy/1.21.11-fabric-0.2.13-alpha/tutorials/
```

❌ **错误示例（无版本分支）：**

```
content/voxy/tutorials/              ← 缺少版本信息
content/voxy/1.21/tutorials/        ← 缺少加载器和模组版本
```

### 版本目录命名规范

| 字段 | 说明 | 示例 |
|------|------|------|
| `{MC版本}` | Minecraft 版本号 | `1.21`、`1.21.11` |
| `{加载器}` | 加载器小写 | `fabric`、`neoforge` |
| `{模组版本}` | 模组版本号 | `0.2.13-alpha`、`6.0.6` |

完整格式：`{MC版本}-{加载器}-{模组版本}`，三部分用**短横线分隔**，无空格。同模组下**不要混用**多种版本目录命名风格。

---

## 二、致谢与元信息（必须）

1. 每个模组必须在 **`content/{模组slug}/README.md`** 中用 YAML 标明原作者与出处（构建后会显示在文档站模组首页）：
   - `originalAuthor`：原作者昵称或姓名
   - `sourceUrl`：官方 GitHub / CurseForge / Modrinth 等链接（能填必填）
   - `modVersion`、`minecraftVersion`、`loader`（如 `Fabric` / `NeoForge` / `Forge`）
2. 正文或教程前言中至少有一句**明确致谢原作者**，并说明本仓库文档为学习笔记、以官方授权与仓库为准。

---

## 三、Part 与标题（避免「第 X 章」与 Part 冲突）

1. 教程按文件夹 **`Part-0-xxx`、`Part-1-yyy`** 分块；侧边栏会显示为 **Part-0 / Part-1** 并附带文件夹后缀说明。
2. **模组教程**（各模组 `tutorials/`）：**禁止**在某一 Part 内使用与全书无关的「第四章」「第七章」等**全局章号**作为一级标题（易与 Part 编号混淆）。请改用**本节主题**，例如：`# 渲染原理`、`# 缩放传送门`。
3. **例外**：`content/mc/1.21/core/-/tutorials/` 为**全书连续编号**的源码课，须统一为 **`第 NN 章：主题（English）`**，且 **NN 与文件名数字前缀一致**；`title` 与正文首个 `#` 标题保持一致。勿混用「第四章」「08 - 」等与文件名不一致的写法。
4. 每个教程文件**开头必须是真实 YAML Frontmatter**（见下文），**不要**把 `---` 写在 ` ```yaml ` 代码块里，否则站点无法解析标题。

---

## 四、链接与索引页

1. `tutorials/README.md`、`tutorials/SUMMARY.md` 会被构建为 **`README.html`、`SUMMARY.html`**，可作为教程目录与总结入口。
2. 文内链接请写相对路径 `.md`，构建时会替换为 `.html`；例如：`[返回教程首页](../README.md)`、`[教程总结](../SUMMARY.md)`。

---

## 五、写作要求（风格与结构）

1. **源码路径写法**：`D:\Minecraft-Learning\assets\{模组文件夹名}\src\...`（与仓库规则一致）。
2. **对齐** `content/mc/1.21/tutorials/` 风格：
   - 开篇说明本章目标与前置知识
   - 含 `## 目录` 并用 `[标题](#锚点)` 跳转
   - 关键术语首次出现时简短解释
   - 使用 `✅`、`💡`、ASCII 示意图等
   - **至少一个**可运行或可跟读的小例子（开发者视角走通一条逻辑）
   - **至少 1～2 张 Mermaid 图**（`flowchart TB` 等）
3. 文末可附 **3～5 条「课后自查」**。

---

## 六、Frontmatter（每个教程文件必填）

```yaml
---
title: 章节中文标题
readingTime: 30
---
```

正文首行 `#` 标题应与 `title` 一致或语义一致；**标题与卡片展示以 `title` 与首个 `#` 为准**（勿依赖英文文件名）。

---

## 七、Mermaid 图表规范（必须遵守）

Mermaid 10.x 对节点标签语法极为敏感，以下规则**必须**遵守。

### 7.1 尖括号转义（最容易出错！）

节点文案中的 **Java 泛型** 和 **命令占位符** 必须用 `#lt;` / `#gt;` 实体写法：

| 要写的文字 | 正确写法 | 错误写法（会炸图！） |
|-----------|----------|----------------------|
| `RegistryKey<T>` | `RegistryKey#lt;T#gt;` | `RegistryKey<T>` |
| `<player>` | `#lt;player#gt;` | `<player>` |
| `<x> <y> <z>` | `#lt;x#gt; #lt;y#gt; #lt;z#gt;` | `<x> <y> <z>` |

> **常见陷阱**：`RegistryKey<Block>`、`EntityModel<T>`、`<target>`、`<item>` 等都含裸 `<`，必须转义。

### 7.2 subgraph ID 规范

- ID 只用**字母、数字、连字符**，禁止空格，禁止中文。
- 标题文字放**双引号内**。

```mermaid
%% ✅ 正确
subgraph Identifiers["标识符层"]
    A["Identifier"]
end

%% ❌ 错误（ID 含空格，会炸）
subgraph 标识符层["标识符层"]
```

### 7.3 每张图不超过 20 个节点

复杂图**必须拆分**为两张 mermaid 块。

### 7.4 校验

写完教程后运行：

```bash
node scripts/validate-mermaid.mjs
```

---

## 八、表格规范

1. **不要把表格放进引用块（`>`）里**，解析器无法正确处理，会导致表格乱码。改用普通段落后直接接表格。
2. 表格单元格含**带下划线的名称**（如 `ENTITY_TYPE`、`LOOT_TABLE`）时，**必须**用反引号包裹：

```markdown
| 类型 | 特点 | 示例 |
|------|------|------|
| 静态注册表 | 游戏内置 | `BLOCK`, `ITEM`, `ENTITY_TYPE` |
```

---

## 九、代码引用规范

引用仓库中**已存在的代码**，使用三段式引用格式（**不带语言标签**）：

```
code references (startLine:endLine:filepath)
    // code content
```

引用**新写的示例代码**，使用标准 markdown 代码块（带语言标签）：

````markdown
```java
// 示例代码
```
````

示例（引用现有源码）：

```35:42:src/net/minecraft/registry/Registries.java
public static final DefaultedRegistry<Block> BLOCK = ...
```

---

## 十、与分析文档的区别

| 维度 | 教程（本提示词） | 分析文档 |
|------|------------------|----------|
| 读者 | 新手为主 | 有基础 |
| Mermaid | **必须含**，且必须遵守转义规则 | 可选 |
| 代码 | 精选片段 + 讲解 | 可更密、更偏架构 |
| 语气 | 友好、有举例 | 客观 |
| 示例 | 必须有 | 可选 |
