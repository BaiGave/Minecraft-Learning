---
title: 第 02 章：开发环境搭建（Development Environment）
readingTime: 30
---

# 第 02 章：开发环境搭建（Development Environment）

## 章节目标

学完本章后，你将能够：
- 正确配置 IDEA 环境用于 Minecraft 源码阅读
- 使用 FabricLoom 反编译 Minecraft 源码
- 配置源码映射以便调试

## 前置知识

- 熟悉 Java 开发环境
- 了解 Minecraft 模组开发基础（可选）

## 环境要求

| 组件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| JDK | 21 | 21 LTS |
| IDEA | 2024.1 | 2024.2+ |
| 内存 | 8GB | 16GB+ |

## 安装 JDK 21

### 方法 1: 下载安装包

从 [Adoptium](https://adoptium.net/) 下载：

```bash
# Windows
# 下载并运行 .msi 安装包

# macOS
brew install openjdk@21

# Linux
sudo apt install openjdk-21-jdk
```

### 方法 2: 使用 SDKMAN

```bash
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.2-tem
```

### 验证安装

```bash
java -version
# openjdk version "21.0.2" 2024-01-16
# ...

echo $JAVA_HOME
# 确保 JAVA_HOME 设置正确
```

## 安装 IntelliJ IDEA

### 下载

从 [JetBrains 官网](https://www.jetbrains.com/idea/download/) 下载 Ultimate 或 Community 版本。

### 推荐的插件

| 插件名称 | 用途 |
|----------|------|
| Minecraft Development | 快速创建模组项目 |
| Fabric Support | Fabric 项目支持 |
| Minecraft Annotations | Minecraft 注解支持 |
| NBT Language Support | NBT 文件语法高亮 |

## 源码项目结构

Minecraft 源码项目通常包含以下目录：

```
D:\Minecraft-Learning\assets\minecraft\
├── source/                    # 反编译的 Java 源码
│   └── net/minecraft/
│       ├── client/            # 客户端代码
│       ├── server/            # 服务端代码
│       └── [共享代码]
├── assets/                    # 游戏资源
│   └── minecraft/
│       ├── textures/          # 纹理图片
│       ├── models/            # 方块/物品模型 JSON
│       ├── lang/              # 语言文件
│       └── shaders/           # GLSL 着色器
└── data/                      # 数据包
```

## 使用 FabricLoom 反编译

### 步骤 1: 创建 Gradle 项目

```groovy
// build.gradle
plugins {
    id 'fabric-loom' version '1.7-SNAPSHOT'
    id 'maven-publish'
}

repositories {
    mavenCentral()
    maven { url "https://maven.fabricmc.net/" }
}

dependencies {
    minecraft "com.mojang:minecraft:1.21"
    mappings "net.fabricmc:yarn:1.21+build.3:v2"
    modImplementation "net.fabricmc:fabric-loader:0.15.11"
}
```

### 步骤 2: 运行反编译任务

```bash
./gradlew loom
# 或
./gradlew setup
```

### 步骤 3: 导入 IDEA

1. File → Open → 选择项目 build.gradle
2. 等待 Gradle 同步完成
3. IDEA 会自动识别 Minecraft 源码

## 直接阅读已有源码

如果你已经有反编译的源码：

### 步骤 1: 打开项目

1. File → Open → 选择 `D:\Minecraft-Learning\assets\minecraft\source` 目录
2. 选择 "Open as Project"

### 步骤 2: 配置 SDK

1. File → Project Structure → Platform Settings → SDKs
2. 添加 JDK 21
3. 设置 Project SDK

### 步骤 3: 配置源码根目录

1. File → Project Structure → Project Settings → Project
2. 在 "Sources" 标签页添加 `source` 目录

## IDEA 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 搜索类 |
| `Ctrl+Shift+N` | 搜索文件 |
| `Ctrl+Shift+Alt+N` | 搜索符号（方法、字段） |
| `Ctrl+点击` | 跳转到定义 |
| `Ctrl+Alt+B` | 查看接口实现 |
| `Ctrl+H` | 查看类层次结构 |
| `Alt+F7` | 查找所有引用 |
| `Ctrl+F12` | 查看文件结构 |
| `Ctrl+Shift+T` | 转到测试类 |
| `F2` / `Shift+F2` | 下一个/上一个错误 |

## 源码阅读配置

### 添加注释字典

创建字典文件加速 alt+enter 补全：

```xml
<!-- .idea/dictionaries/custom.xml -->
<component name="DictionaryProvider">
    <dictionary name="custom">
        <words>
            <w>registries</w>
            <w>blockentity</w>
            <w>worldborder</w>
        </words>
    </dictionary>
</component>
```

### 配置代码样式

```xml
<!-- .idea/codeStyles/Project.xml -->
<code_scheme name="Project" version="173">
    <HTMLCodeStyleSettings>
        <option name="HTML_SPACE_INSIDE_EMPTY_TAG" value="true" />
    </HTMLCodeStyleSettings>
    <JavaCodeStyleSettings>
        <option name="CLASS_COUNT_TO_USE_IMPORT_ON_DEMAND" value="999" />
        <option name="NAMES_COUNT_TO_USE_IMPORT_ON_DEMAND" value="999" />
    </JavaCodeStyleSettings>
</code_scheme>
```

### 启用参数名称提示

Settings → Editor → General → Appearance → Show parameter name hints

## 反编译工具对比

| 工具 | 优点 | 缺点 |
|------|------|------|
| CFR | 保留更多原始结构 | 变量名混淆 |
| Procyon | 变量名可读性较好 | 部分语法可能不正确 |
| Fernflower | Minecraft 默认使用 | 偶尔反编译错误 |

## 常见问题解决

### 问题 1: 无法识别 Minecraft 类

**解决**: 确认 `source` 目录被标记为 Sources Root
- 右键目录 → Mark Directory as → Sources Root

### 问题 2: 泛型显示异常

**解决**: 确保使用 JDK 21 并启用类型推断
- Settings → Build → Compiler → Java Compiler
- 设置 "Use '--release' option" 为 false

### 问题 3: 中文显示乱码

**解决**: 配置 IDEA 编码为 UTF-8
- Settings → Editor → File Encodings
- 设置所有编码为 UTF-8

### 问题 4: 内存不足

**解决**: 增加 IDEA 堆内存
- 编辑 `idea64.vmoptions`:
```properties
-Xmx4096m
-Xms1024m
-XX:MaxMetaspaceSize=512m
```

## 调试 Minecraft

### 启动配置

创建调试配置：

```
Main Class: net.minecraft.client.main.Main  (客户端)
            net.minecraft.server.Main       (服务端)

VM Options:
  -Xmx4G -Xms2G
  -Dfabric.dli.config=run/config.json
  -Dfabric.dli.env=development
```

### 添加断点

可以在任何 Minecraft 类中添加断点：

```java
// 例如在 World.java 的 setBlock 方法添加断点
public boolean setBlock(BlockPos pos, BlockState state, int flags) {
    // 设置断点在这里
    if (this.isClient) {
        return this.clientWorldStub.setBlock(pos, state, flags);
    }
    return this.serverWorld.setBlock(pos, state, flags);
}
```

## 源码映射表

Minecraft 使用 Yarn 映射表将混淆名称转为可读名称：

```
yarn:mapping -> spade:1.21 -> official
```

理解映射：
- **Yarn 名称**: `method_1234` → `getBlockState`
- **Spade 名称**: 开发者友好的临时名称
- **官方名称**: Mojang 内部使用的名称

## 课后自查

1. 你的 JDK 和 IDEA 版本是否正确？
2. 能否成功导入 Minecraft 源码项目？
3. `Ctrl+N` 能搜索到 `World` 类吗？
4. 配置了哪些 IDEA 插件？
5. 如何在 Minecraft 源码中设置断点？

## 下一步

现在开发环境已经配置完成，让我们学习 [项目结构与源码阅读技巧](./03-project-structure.md)。
