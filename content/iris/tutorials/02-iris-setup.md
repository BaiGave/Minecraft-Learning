# 第二章：Iris 开发环境搭建

> 搭建完整的 Iris 光影开发环境

---

## 环境要求

### 软件需求

| 软件 | 版本 | 说明 |
|------|------|------|
| Java Development Kit (JDK) | 21+ | 必须，Minecraft 1.21 需要 |
| Integrated Development Environment | - | 推荐 IntelliJ IDEA |
| Git | - | 用于克隆源码 |
| Minecraft Launcher | - | 游戏启动器 |

### 可选软件

| 软件 | 用途 |
|------|------|
| Iris Mod | 测试你的 ShaderPack |
| Sodium | 搭配 Iris 使用 |
| VSCode / IDEA | 代码编辑 |
| VSCode GLSL 插件 | 语法高亮 |

---

## 第一步：安装 JDK 21

### Windows

1. 访问 [Adoptium](https://adoptium.net/) 下载 JDK 21
2. 运行安装程序
3. 设置环境变量：

```powershell
# 在 PowerShell 中验证
java -version
```

### 验证安装

```bash
$ java -version
openjdk version "21.0.x" ...
```

---

## 第二步：安装 IntelliJ IDEA

1. 访问 [JetBrains](https://www.jetbrains.com/idea/) 下载 IDEA
2. 安装并启动
3. 安装 GLSL 插件：
   - `File` → `Settings` → `Plugins`
   - 搜索 "GLSL" 并安装

---

## 第三步：克隆 Iris 源码

### 方法一：使用 Git

```bash
# 克隆仓库
git clone https://github.com/IrisShaders/Iris.git

# 进入目录
cd Iris

# 查看分支
git branch -a
```

### 方法二：直接下载

1. 访问 [Iris GitHub Releases](https://github.com/IrisShaders/Iris/releases)
2. 下载源码包
3. 解压到本地目录

---

## 第四步：导入项目

### 使用 IDEA 导入

1. `File` → `Open`
2. 选择 Iris 项目根目录
3. 选择 "Import as Gradle project"
4. 等待依赖下载完成（约 5-10 分钟）

### 目录结构

```
Iris/
├── src/
│   ├── main/
│   │   ├── java/           # Java 源代码
│   │   └── resources/      # 资源文件 (shader, mixin配置)
│   └── sodiumCompatibility/ # Sodium 兼容代码
├── build.gradle.kts         # Gradle 构建配置
├── settings.gradle.kts      # 项目设置
└── gradle.properties       # Gradle 属性
```

---

## 第五步：运行开发版本

### 配置运行目标

1. 在 IDEA 中打开 Gradle 面板
2. 展开 `iris` → `Tasks` → `minecraft`
3. 双击 `runClient` 运行测试客户端

### 或使用命令行

```bash
# Windows
.\gradlew.bat runClient

# macOS / Linux
./gradlew runClient
```

---

## 第六步：安装测试 Mod

### 必需 Mod

| Mod | 版本 | 用途 |
|-----|------|------|
| Fabric Loader | 0.15.x | Mod 加载器 |
| Fabric API | 0.100.x | Fabric API |
| Sodium | 0.5.9+ | 渲染优化 |
| Iris | 1.7.3+ | 光影支持 |

### 安装步骤

1. 安装 Fabric Loader（如果未安装）
2. 启动一次游戏生成 `.minecraft/mods` 目录
3. 将上述 Mod 的 `.jar` 文件放入 `mods` 目录
4. 重新启动游戏

---

## 第七步：创建测试 ShaderPack

### 项目结构

```
MyShaderPack/
├── shaderpacks/                    # 放入 Minecraft 目录
│   └── my-shaderpack/
│       ├── shaders.properties       # 配置文件
│       └── shaders/
│           ├── gbuffers_terrain.vsh
│           ├── gbuffers_terrain.fsh
│           ├── gbuffers_water.vsh
│           ├── gbuffers_water.fsh
│           ├── composite1.vsh
│           ├── composite1.fsh
│           └── ...
└── build.gradle.kts               # 可选：自动化构建
```

### 放入游戏目录

```bash
# Windows
C:\Users\你的用户名\AppData\Roaming\.minecraft\shaderpacks\

# macOS
~/Library/Application Support/minecraft/shaderpacks/

# Linux
~/.minecraft/shaderpacks/
```

---

## 常见问题

### 1. Gradle 同步失败

```
问题：Could not resolve net.fabricmc:fabric-loader:...
解决：检查网络连接，或配置国内镜像
```

在 `build.gradle.kts` 中添加：

```kotlin
repositories {
    maven("https://maven.aliyun.com/repository/public")
}
```

### 2. JDK 版本不匹配

```
问题：Unsupported class file major version 65
解决：确保使用 JDK 21
```

在 IDEA 中设置：
`File` → `Project Structure` → `Project SDK` → 选择 21

### 3. 运行客户端无反应

检查 IDEA 控制台是否有错误日志，常见原因：
- 显存不足（降低游戏分辨率）
- Mod 版本冲突
- Java 内存不足

---

## 验证环境

运行成功应该看到：

```
> Configure project :
> Task :runClient
[游戏窗口打开]
```

在游戏中：
1. 进入 "Options" → "Video Settings" → "Shaders"
2. 选择你的测试 ShaderPack
3. 点击 "Done"

---

## 下一步

- [第三章：创建第一个 Shader](03-create-simple-shader.md) - 编写你的第一个着色器
- [第一章：Shader 基础](01-shader-basics.md) - 复习 GLSL 基础

---

## 附录：快捷命令

```bash
# 运行客户端
./gradlew runClient

# 构建发布版本
./gradlew build

# 清理并重新构建
./gradlew clean build

# 只编译 Java
./gradlew compileJava
```

---

*教程版本：Iris 1.7.x / Minecraft 1.21*
