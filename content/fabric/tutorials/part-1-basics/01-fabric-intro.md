# 🎮 Fabric 是什么？—— 让你的 MC 听你的话！

> **TL;DR** 如果你想让 Minecraft 执行你的想法，Fabric 就是那把钥匙！

---

## 📖 目录

1. [🎯 Fabric 是什么？](#1-fabric-是什么)
2. [🔥 为什么选 Fabric？](#2-为什么选-fabric)
3. [🏗️ Fabric 的核心架构](#3-fabric-的核心架构)
4. [🧩 Fabric 能做什么？](#4-fabric-能做什么)
5. [🚀 快速开始](#5-快速开始)

---

## 1. Fabric 是什么？

### 1.1 一句话解释

```
🎮 Minecraft 就像一个精密的机器
🔧 Fabric 就是让你能改装这台机器的工具箱
```

**没有 Mod**：你只能玩别人设计好的游戏
**有 Fabric Mod**：你可以添加新物品、新世界、新玩法...一切皆有可能！

### 1.2 官方定义

> Fabric 是一个轻量级、模块化的 Mod 加载工具和 API 框架

翻译成人话就是：
- **轻量级**：不会让游戏变卡
- **模块化**：想要什么功能就加什么，不需要全部装
- **API 框架**：提供了大量现成的代码，直接调用就行

### 1.3 Fabric vs Forge 对比

```mermaid
graph TD
    subgraph "选择 Fabric"
        A[追求性能] --> F[轻量快速]
        B[喜欢现代技术] --> F
        C[想快速开发] --> F
    end

    subgraph "选择 Forge"
        D[需要复杂功能] --> G[生态丰富]
        E[老项目兼容] --> G
    end

    F -->|现代 Minecraft| H[推荐 1.20+]
    G -->|传统方案| I[适合大型 Mod]
```

### 1.4 Fabric 的组成

```mermaid
graph TB
    subgraph "Fabric 生态"
        A[Fabric Loader<br/>Mod 加载器] --> B[Fabric API<br/>开发接口]
        A --> C[Fabric Installer<br/>安装器]
        B --> D[Mixin<br/>代码注入]
    end

    subgraph "你的 Mod"
        E[你的代码] --> B
    end

    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style D fill:#ffe66d
```

---

## 2. 为什么选 Fabric？

### 2.1 四大优势

```mermaid
quadrantChart
    title 选择 Fabric 的理由
    x-axis 低门槛 --> 高性能
    y-axis 简单易用 --> 功能强大
    quadrant-1 完美选择
    quadrant-2 过渡方案
    quadrant-3 不推荐
    quadrant-4 别选这个
    "🚀 轻量快速": [0.9, 0.8]
    "📚 文档丰富": [0.7, 0.6]
    "🎯 开发简单": [0.8, 0.5]
    "💪 功能完整": [0.5, 0.7]
```

| 优势 | 说明 | 比喻 |
|------|------|------|
| ⚡ **速度快** | 原生兼容，性能损失小 | 改装跑车不影响引擎 |
| 📖 **文档好** | 官方文档详细，社区活跃 | 有详细的改装说明书 |
| 🔧 **好上手** | 新手也能快速开发 | 乐高积木式的组装 |
| 🧩 **模块化** | 按需引入，不臃肿 | 需要什么加什么 |

### 2.2 开发体验对比

```mermaid
graph LR
    subgraph "传统方式 Forge"
        A[创建方块] --> B[写 50 行注册代码]
        B --> C[配置 json]
        C --> D[写 mixin]
        D --> E[测试]
    end

    subgraph "Fabric 方式"
        F[创建方块] --> G[FabricItemSettings]
        G --> H[Registry.register]
        H --> I[测试]
    end

    style B fill:#ff9999
    style G fill:#99ff99
```

---

## 3. Fabric 的核心架构

### 3.1 整体架构图

```mermaid
flowchart TB
    subgraph "Minecraft 核心"
        MC1["🎮 Minecraft 底层代码"]
    end

    subgraph "Mixin 注入层"
        MX1["💉 Mixin<br/>修改游戏行为"]
        MX2["@Inject 注解"]
    end

    subgraph "Fabric API 层"
        API1["📦 注册系统<br/>Registry"]
        API2["⚡ 事件系统<br/>Event"]
        API3["🌐 网络系统<br/>Networking"]
        API4["🗺️ 世界生成<br/>Biome/Feature"]
        API5["🎨 渲染系统<br/>Renderer"]
    end

    subgraph "你的 Mod"
        MOD["✨ 你的代码"]
    end

    MC1 <--> MX1
    MX1 <--> API1 & API2 & API3 & API4 & API5
    MOD --> API1

    style MC1 fill:#4a5568,color:#fff
    style MX1 fill:#e53e3e,color:#fff
    style API1 fill:#38a169,color:#fff
    style MOD fill:#805ad5,color:#fff
```

### 3.2 工作流程

```mermaid
sequenceDiagram
    participant U as 👤 你
    participant F as 🔧 Fabric
    participant M as 🎮 Minecraft
    participant Mx as 💉 Mixin

    U->>F: 编写 Mod 代码
    F->>Mx: 通过 Mixin 注入
    Mx->>M: 修改游戏行为
    M-->>U: 游戏按你的想法运行！

    Note over U,M: Mod 加载流程
    M->>F: 启动游戏
    F->>U: 加载你的 Mod
    U->>M: 体验新功能！
```

### 3.3 注册系统架构

```mermaid
flowchart LR
    subgraph "注册表 Registry"
        direction TB
        R1["📦 BLOCK<br/>方块"]
        R2["📦 ITEM<br/>物品"]
        R3["📦 ENTITY_TYPE<br/>实体"]
        R4["📦 BIOME<br/>生物群系"]
    end

    subgraph "注册流程"
        direction TB
        P1["1️⃣ 创建对象"]
        P2["2️⃣ 定义 ID"]
        P3["3️⃣ 注册到表"]
        P4["4️⃣ 同步到客户端"]
    end

    P1 --> P2 --> P3 --> P4
    P3 --> R1 & R2 & R3 & R4

    style R1 fill:#f6e05e
    style R2 fill:#68d391
    style R3 fill:#fc8181
    style R4 fill:#63b3ed
```

---

## 4. Fabric 能做什么？

### 4.1 功能全景图

```mermaid
mindmap
  root((✨ 你能创造的))
    🎮 游戏玩法
      新物品
      新装备
      新附魔
      新合成
    🌍 世界改造
      新生物群系
      新地形
      新矿物
      新结构
    👾 全新生物
      友好的 NPC
      敌对的怪物
      坐骑系统
    🎨 视觉特效
      自定义粒子
      光影效果
      新的方块模型
    ⚔️ 玩法系统
      新职业
      技能树
      任务系统
    🌐 多人玩法
      自定义数据包
      同步逻辑
      新的聊天命令
```

### 4.2 常用 API 一览

```mermaid
graph TD
    subgraph "📚 Fabric API 模块"
        B1["fabric-block-api<br/>方块 API"]
        B2["fabric-item-api<br/>物品 API"]
        B3["fabric-entity-events<br/>实体事件"]
        B4["fabric-biome-api<br/>生物群系"]
        B5["fabric-networking<br/>网络通信"]
        B6["fabric-command-api<br/>命令系统"]
        B7["fabric-renderer<br/>渲染器"]
    end

    subgraph "🎯 你想实现"
        G1["创造新方块"]
        G2["创造新物品"]
        G3["监听玩家"]
        G4["创建新世界"]
        G5["客户端服务端通信"]
        G6["自定义命令"]
    end

    G1 --> B1
    G2 --> B2
    G3 --> B3
    G4 --> B4
    G5 --> B5
    G6 --> B6

    style B1 fill:#48bb78
    style B2 fill:#48bb78
    style B3 fill:#4299e1
    style B4 fill:#9f7aea
    style B5 fill:#ed8936
    style B6 fill:#f56565
```

---

## 5. 快速开始

### 5.1 环境要求

```mermaid
pie "开发环境" 
    "Java 21" : 60
    "IntelliJ IDEA" : 30
    "Minecraft 1.21+" : 10
```

### 5.2 下一步

现在你已经了解了 Fabric 的全貌！接下来：

```mermaid
graph LR
    A[📖 继续学习] --> B["环境搭建<br/>part-0/02"]
    B --> C["Mod 结构<br/>part-1/02"]
    C --> D["事件系统<br/>part-1/03"]
    D --> E["创建第一个方块<br/>part-2/01"]

    style A fill:#4c51bf,color:#fff
    style E fill:#38a169,color:#fff
```

---

## 🎯 总结

```mermaid
flowchart TD
    START["🤔 你想制作 Mod"] --> Q1{选择框架}
    Q1 -->|轻量快速| F[Fabric ✓]
    Q1 -->|功能丰富| Fo[Forge]
    F --> F1[安装 Fabric]
    F1 --> F2[创建项目]
    F2 --> F3[编写代码]
    F3 --> F4[打包发布]

    START2["🎮 玩游戏"] -->|加载 Mod| LOAD[Mod Loader]
    LOAD -->|Mixin 注入| MIX[修改行为]
    MIX -->|API 调用| API[调用 Fabric]
    API -->|运行| RUN[实现功能]

    style F fill:#4ecdc4
    style F4 fill:#38a169
    style RUN fill:#805ad5
```

**记住**：
- Fabric = 轻量 + 快速 + 现代
- 一切从注册开始
- 事件系统是核心

---

## 下一步

- [🛠️ 环境搭建](../part-0-prerequisites/02-environment-setup.md) - 配置开发工具
- [📁 Mod 项目结构](./02-mod-structure.md) - 了解代码组织
- [⚡ 事件系统](./03-event-system.md) - 响应游戏事件

---

*有问题？加入 [Fabric Discord](https://discord.gg/fabricmc) 或在 GitHub 提问！*
