# 文档目录与构建约定（教程 / 分析）

本仓库的静态页由 `scripts/converter.js` 生成。请**按下列规则**组织 `content/`，避免索引、侧栏链接与真实 HTML 路径不一致（例如出现 `tutorials/01-java-basics.html` 找不到，实际文件在 `Part-0-Prerequisites/01-java-basics.html`）。

## 1. 总体结构

```
content/
  {模块名}/                    # 如 mc、fabric、iris
    {版本}/                    # 仅「多版本」模块需要，如 mc/1.21/
      tutorials/               # 教程 Markdown
      analysis/                # 源码分析 Markdown
    tutorials/                 # 无版本模块：直接放在模块下
    analysis/
```

- **Minecraft 原版（`mc`）**：必须使用版本目录，例如 `content/mc/1.21/tutorials/`。
- **Fabric / Iris 等**：无版本目录时，使用 `content/fabric/tutorials/`。

## 2. 分 Part 教程（与「原版 MC」一致）

在 `tutorials/` 下用 **子文件夹** 区分大章，命名约定：

| 风格 | 示例 | 说明 |
|------|------|------|
| MC 常用 | `Part-0-Prerequisites`、`Part-1-Foundation` | 与现有 MC 教程一致，推荐 |
| Fabric 等 | `part-0-prerequisites`、`part-1-basics` | 小写 + 连字符，与现有 Fabric 教程一致 |

构建时会：

- **保留子目录**：输出为 `docs/.../tutorials/Part-0-Prerequisites/01-java-basics.html`（不是扁平的 `tutorials/01-java-basics.html`）。
- 从路径中解析 Part 序号（`Part-3` → Part 3），用于**索引页分组**与**侧栏分组**。
- 导航中的 `file` 键为**相对 `tutorials/`（或 `analysis/`）的路径且不含扩展名**，例如：`Part-0-Prerequisites/01-java-basics`。

## 3. 分析文档（analysis）

规则与教程相同：可在 `analysis/` 下使用子目录；输出路径与 `content` 镜像一致，链接与索引使用相对路径。

## 4. 文件名

- 同一 Part 内建议保持 `01-xxx.md`、`02-xxx.md` 编号，**不同 Part 之间允许重复编号**（因路径不同）。
- 跳过：`README.md`、`SUMMARY.md`（可在目录中用于说明，但不会生成独立教程页）。

## 5. 构建命令

```bash
# 全量（含各模块索引 + scan-docs）
node scripts/converter.js all
node scan-docs.js
```

Windows 下可双击 `build.bat`（已包含上述步骤）。**仅修改 `styles.css` 等样式时**，无需重新跑转换器，刷新浏览器即可。

## 6. 主题与教程页样式

教程/分析页主区域背景使用 `styles.css` 中的 `--bg-primary` / `--bg-secondary`（见 `styles/variables.css` 的 `[data-theme="dark"]`）。若黑夜模式下正文仍发白，检查页面是否引入 `styles.css` 且 `data-theme` 已设为 `dark`。

**一劳永逸约定**：侧栏、顶栏、正文文字色**只用** `var(--text-primary)` 等变量，并随 `html[data-theme="light"|"dark"]` 切换。**禁止**在 `converter.js` 的页面内联 `<style>` 里给 `.sidebar-nav`、`.sidebar-header` 写 `color: white` / `rgba(255,255,255,…)`，否则会盖住 `styles.css`，浅色模式下字会「消失」。模块强调色只用 `--module-accent` 做点缀（顶线、hover 背景混合等）。

## 7. 与旧链接的关系

若站外或书签仍使用扁平 URL（如 `.../tutorials/01-java-basics.html`），在采用子目录结构后该地址会 **404**。正确 URL 需包含 Part 目录，例如：

`docs/mc/1.21/tutorials/Part-0-Prerequisites/01-java-basics.html`

首页与模块索引中的卡片链接由构建脚本根据上述规则自动生成，**无需手写** `onclick` 中的路径。

## 8. Mermaid 图（避免 “Syntax error in text”）

页面使用 **Mermaid 10.x** 渲染 ` ```mermaid ` 代码块。常见报错原因：

1. **节点文字里用了英文双引号 `"..."`**  
   形如 `E["服务端是"权威""]` 时，Mermaid 会把第一个 `"` 当成字符串结束符，整段语法被破坏。  
   **写法**：改用中文直角引号 **`「权威」`**，或去掉引号，或使用 `#quot;`（视版本而定，推荐「」）。

2. **`flowchart` 里连线指向不存在的节点 ID**  
   例如子图声明为 `subgraph 共享代码`，却写 `共享 --> 客户端独占`（`共享` 不是合法 ID）。  
   **写法**：连线两端必须是已定义的 **节点 ID** 或 **子图 ID**，与子图首行标识一致。

3. **圆括号节点里的内嵌引号**  
   如 `M[显示"无可用配方"]` 同样可能触发解析错误，改为 `M[显示「无可用配方」]`。

修改 Markdown 后需重新执行 `node scripts/converter.js …` 生成 HTML。

---

*维护：修改 `content/` 结构后请重新运行 `converter.js`，并检查 `docs/` 中对应 HTML 是否更新。*
