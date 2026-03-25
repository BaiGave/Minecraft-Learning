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

## 五、Mermaid 图表规范（必须遵守）

Mermaid 10.x 对节点标签语法极为敏感，以下规则**必须**遵守：

### 5.1 尖括号转义（最容易出错）

节点文案中的 **Java 泛型**（如 `RegistryKey<T>`）和 **命令占位符**（如 `<player>`）**必须**使用 Mermaid 实体写法：

| 要写的文字 | 正确写法 | 错误写法 |
|-----------|----------|---------|
| `RegistryKey<Block>` | `RegistryKey#lt;Block#gt;` | `RegistryKey<Block>` |
| `EntityEntry<T>` | `EntityEntry#lt;T#gt;` | `EntityEntry<T>` |
| `<player>` | `#lt;player#gt;` | `<player>` |
| `<x> <y> <z>` | `#lt;x#gt; #lt;y#gt; #lt;z#gt;` | `<x> <y> <z>` |

> 注意：HTML 转义（如 `&lt;`、`&gt;`）在 Mermaid 里**不生效**，必须用 `#lt;` / `#gt;`。

### 5.2 subgraph ID 规范

- ID 只用**字母、数字、连字符**，禁止空格，禁止中文。
- 标题文字放**双引号内**，如：`subgraph ID["显示标题"]`。

```mermaid
%% 正确
subgraph Layer1["第一层：标识符"]
    A["Identifier"]
end

%% 错误（ID 有空格，会炸）
subgraph 第一层["第一层：标识符"]
```

### 5.3 每张图不超过 20 个节点

复杂架构图**必须拆分**为两张 mermaid 块，不要把所有类塞进一张图。

### 5.4 校验

写完后运行（若已安装）：

```bash
node scripts/validate-mermaid.mjs
```

---

## 六、表格规范

1. **不要把表格放进引用块（`>`）里**，很多 Markdown 解析器无法处理多行表格嵌套引用块，会导致表格乱码。
2. 表格单元格内含**带下划线的名称**（如 `ENTITY_TYPE`、`LOOT_TABLE`）时，**必须**用反引号包裹：

```markdown
| 类型 | 特点 | 示例 |
|------|------|------|
| 静态注册表 | 游戏内置 | `BLOCK`, `ITEM`, `ENTITY_TYPE` |
```

---

## 七、代码引用规范（cite existing code）

引用仓库中**已存在的代码**，使用三段式引用格式（**不带语言标签**）：

```
code references (startLine:endLine:filepath)
    // code content
```

引用**新写的或提案代码**，使用标准 markdown 代码块（带语言标签）：

```java
// standard markdown code block with language tag
```

示例：

```32:45:src/net/minecraft/registry/Registries.java
public static final DefaultedRegistry<Block> BLOCK = ...
```

这是 ` ```java ` 格式用于**提案代码**，不是引用现有文件。

---

## 八、与分析对象的关系

| 维度 | 分析文档 |
|------|----------|
| 读者 | 有基础的开发者 |
| 目的 | 理解架构与扩展点 |
| 代码密度 | 可较高 |
| 示例 | 可选，偏调用链与类职责 |
| Mermaid | 可选；但若有，必须遵守第五节的转义规则 |
