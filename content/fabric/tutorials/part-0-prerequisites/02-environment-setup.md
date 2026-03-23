# 第二章：开发环境搭建

> 这一章会手把手教你安装和配置所有开发 Mod 所需的工具。

---

## 目录

1. [需要安装什么？](#1-需要安装什么)
2. [安装 Java JDK](#2-安装-java-jdk)
3. [安装 IntelliJ IDEA](#3-安装-intellij-idea)
4. [安装 Git（可选但推荐）](#4-安装-git可选但推荐)
5. [安装 Fabric Example Mod](#5-安装-fabric-example-mod)
6. [首次运行测试](#6-首次运行测试)
7. [常见问题](#7-常见问题)

---

## 1. 需要安装什么？

开发 Minecraft Mod 需要安装以下软件：

| 软件 | 作用 | 必须？ |
|------|------|--------|
| **Java JDK 21** | 编程语言运行环境 | ✅ 必须 |
| **IntelliJ IDEA** | 代码编辑器 | ✅ 必须 |
| **Git** | 版本控制工具 | 推荐 |
| **Fabric Example Mod** | 官方示例项目 | ✅ 必须 |

**类比**：就像做饭需要锅、炉灶和食材一样，开发 Mod 需要 JDK（厨艺）、IDEA（厨师工作站）和示例代码（食谱）。

---

## 2. 安装 Java JDK

### 2.1 什么是 JDK？

JDK = Java Development Kit（Java 开发工具包）

```
JDK 包含：
├── Java 编译器 (javac)     把 .java 变成 .class
├── Java 运行时 (java)       运行程序
└── 开发工具                 调试、文档生成等
```

### 2.2 下载 JDK

1. 打开浏览器，访问：https://adoptium.net/

2. 点击 **"Latest release"** 按钮下载

3. 运行安装程序，一路点击"下一步"即可

### 2.3 验证安装

打开命令行（Windows 按 `Win + R`，输入 `cmd`），输入：

```bash
java -version
```

看到类似以下输出就说明安装成功：

```
openjdk version "21.0.x" ...
```

### 2.4 设置环境变量（如果提示找不到 java）

如果提示找不到命令，按以下步骤设置：

**Windows 10/11**：

1. 按 `Win + R`，输入 `sysdm.cpl`，回车
2. 点击"高级"选项卡 → "环境变量"
3. 在"系统变量"中找到 `Path`，双击编辑
4. 点击"新建"，输入 `C:\Program Files\Eclipse Adoptium\jdk-21.0.x\bin`
5. 确定保存

---

## 3. 安装 IntelliJ IDEA

### 3.1 什么是 IntelliJ IDEA？

IntelliJ IDEA 是一个强大的代码编辑器，由 JetBrains 公司开发。专门用于 Java 开发。

```
编辑器对比：

Notepad（记事本）  →  只能看文字，没有代码高亮
                    →  适合看，不适合写

IntelliJ IDEA      →  代码高亮、自动补全、错误提示
                    →  专门为 Java 开发设计
                    →  免费！有社区版
```

### 3.2 下载 IntelliJ IDEA

1. 访问：https://www.jetbrains.com/idea/download/

2. 下载 **Community（社区版）** - 免费开源版本

3. 运行安装程序：
   - 勾选"创建桌面快捷方式"
   - 勾选".java"文件关联
   - 勾选"更新 PATH"

### 3.3 首次启动设置

1. 启动 IntelliJ IDEA

2. 安装推荐插件（直接点 OK 或 Skip）

3. 选择主题（深色/浅色都可）

---

## 4. 安装 Git（可选但推荐）

### 4.1 什么是 Git？

Git 是一个"时光机"，可以：
- 保存代码的历史版本
- 轻松回退到之前的版本
- 与他人协作开发

### 4.2 下载 Git

1. 访问：https://git-scm.com/download/win

2. 下载 Windows 版本

3. 安装时保持默认选项即可

---

## 5. 安装 Fabric Example Mod

### 5.1 下载官方示例

1. 访问 Fabric 官方仓库：https://github.com/FabricMC/fabric-example-mod

2. 点击绿色的 **"Use this template"** 按钮

3. 输入仓库名称（随意），点击 **"Create repository"**

4. 点击 **"Code"** 按钮，复制 HTTPS 链接

### 5.2 在 IDEA 中打开项目

1. 打开 IntelliJ IDEA

2. 选择 **"Get from VCS"**（从版本控制获取）

3. 粘贴刚才复制的链接

4. 选择存放目录，点击 **Clone**

5. 等待下载完成...

### 5.3 等待依赖下载

首次打开项目时，IDEA 会自动下载所有依赖（可能需要几分钟）：

```
进度条会显示：Downloading Gradle...
                              ↓
Dependencies being set up...
                              ↓
Indexing files...
```

**耐心等待！不要关闭窗口。**

### 5.4 项目结构介绍

下载完成后，你会看到这样的结构：

```
fabric-example-mod/
├── src/
│   └── main/
│       ├── java/                    ← Java 代码放这里
│       │   └── net/
│       │       └── fabricmc/
│       │           └── examplemod/
│       │               └── ExampleMod.java
│       └── resources/
│           └── fabric.mod.json       ← Mod 配置文件
├── build.gradle                     ← 构建配置
├── settings.gradle                  ← 项目设置
└── gradle.properties                ← Gradle 属性
```

---

## 6. 首次运行测试

### 6.1 运行游戏

1. 在 IDEA 右侧找到 **Gradle** 面板

2. 展开 **fabric-example-mod** → **Tasks** → **fabric**

3. 双击 **runClient**

```
等待中...
    ↓
下载 Minecraft 客户端...
    ↓
启动游戏...
    ↓
游戏窗口出现！
```

### 6.2 验证 Mod 已加载

1. 在主菜单点击 **"Mods"**

2. 找到 **"fabric-example-mod"**

3. 如果看到它，说明 Mod 加载成功了！

### 6.3 测试基础功能

进入游戏后，打开聊天框，输入：

```
/example command
```

如果显示 "Example command executed!"，说明 Mod 完全正常！

---

## 7. 常见问题

### Q1: 下载太慢了怎么办？

**A**: 可以配置国内镜像源。在 `build.gradle` 文件中添加：

```groovy
repositories {
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle' }
}
```

### Q2: 运行时报错 "Gradle sync failed"

**A**: 
1. 确保网络畅通
2. 点击 IDEA 菜单：**File** → **Invalidate Caches** → **Invalidate and Restart**
3. 重启后再次尝试

### Q3: Java 版本不对

**A**: 确保安装了 JDK 21，在 IDEA 中：
1. **File** → **Project Structure** → **Project**
2. 检查 **SDK** 是否为 21
3. 如果不是，点击 **Add SDK** → **Download JDK** → 选择 21

### Q4: 找不到 Gradle 面板

**A**: 
1. 点击 IDEA 右侧的 **Gradle** 图标
2. 或者菜单：**View** → **Tool Windows** → **Gradle**

---

## 下一步

环境搭建完成！现在你可以：
- 深入了解 [Fabric 基础概念](../part-1-basics/01-fabric-intro.md)
- 或者直接开始 [创建你的第一个 Mod](../part-1-basics/04-first-mod.md)

---

*遇到问题？欢迎在 [Fabric Discord](https://discord.gg/fabricmc) 提问！*
