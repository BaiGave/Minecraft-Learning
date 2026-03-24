# 🎮 实战项目：从零打造你的魔法世界！

> **"看百遍不如做一遍"** —— 这一章，我们要做点真正酷的东西！

---

## 📖 目录

1. [🚀 为什么做这个项目？](#1-为什么做这个项目)
2. [✨ 我们要做什么](#2-我们要做什么)
3. [🏗️ 项目架构](#3-项目架构)
4. [📚 技术要点](#4-技术要点)
5. [🎯 准备工作](#5-准备工作)

---

## 1. 为什么做这个项目？

### 1.1 学了那么多，该实战了！

```mermaid
journey
    title 我的 Mod 开发之路

    section 过去
      学习基础: 5: 我
      了解概念: 3: 我
      看懂代码: 4: 我

    section 现在
      实战项目: 1: 我
      做出成品: 5: 我
      分享给朋友: 5: 我
```

你学到的知识就像一把瑞士军刀，现在该用它来创造东西了！

### 1.2 这个项目能学到什么？

```mermaid
mindmap
  root((🎯 学完这个项目你会))
    💎 方块系统
      BlockEntity 存储
      自定义发光
      物品交互
    🪄 物品系统
      自定义行为
      耐久度
      右键功能
    👾 实体系统
      创建新生物
      自定义 AI
      驯服机制
    🌟 视觉效果
      粒子特效
      投掷物
      网络同步
```

### 1.3 成就感来源

```mermaid
graph TD
    A["📚 学习理论"] --> B["💻 写代码"]
    B --> C["🔄 反复调试"]
    C --> D{"✨ 成功运行？"}
    D -->|是| E["🎉 太棒了！"]
    D -->|否| C
    E --> F["🎮 给朋友炫耀"]
    E --> G["📸 发到 Discord"]
    E --> H["🚀 发布到 Modrinth"]

    style A fill:#4ecdc4
    style E fill:#ffd93d
    style H fill:#6bcb77
```

---

## 2. 我们要做什么

### 2.1 项目全景图

```mermaid
flowchart TB
    subgraph "🎮 最终目标"
        direction TB
        GOAL["✨ 创造一个完整的魔法 Mod ✨"]
    end

    subgraph "📦 模块一：魔法水晶"
        direction LR
        M1_1["💎 发光方块"]
        M1_2["🧪 可收集水晶"]
        M1_3["✨ 粒子特效"]
    end

    subgraph "🪄 模块二：魔法棒"
        direction LR
        M2_1["⚡ 蓄力发射"]
        M2_2["💥 爆炸效果"]
        M2_3["🎯 追踪目标"]
    end

    subgraph "🧚 模块三：魔法生物"
        direction LR
        M3_1["👼 新生物"]
        M3_2["❤️ 驯服系统"]
        M3_3["⚔️ 协助战斗"]
    end

    GOAL --> M1_1 & M2_1 & M3_1
    M1_1 --> M1_2 --> M1_3
    M2_1 --> M2_2 --> M2_3
    M3_1 --> M3_2 --> M3_3

    style GOAL fill:#9b59b6,color:#fff
    style M1_1 fill:#3498db
    style M2_1 fill:#e74c3c
    style M3_1 fill:#2ecc71
```

### 2.2 模块一：魔法水晶 💎

> 你的第一个作品 —— 会发光的魔法水晶！

```mermaid
graph LR
    A["👤 玩家发现"] --> B["💎 放置方块"]
    B --> C["🌟 方块发光"]
    C --> D["🖱️ 右键点击"]
    D --> E["✨ 播放粒子"]
    E --> F["📦 获得水晶"]
    F --> G["🔄 循环"]
```

**功能清单**：
- ✅ 发着紫光的方块
- ✅ 右键收集水晶
- ✅ 粒子特效
- ✅ 耐久度系统

### 2.3 模块二：魔法棒 🪄

> 发射魔法弹，boom！

```mermaid
sequenceDiagram
    participant P as 👤 玩家
    participant W as 🪄 魔法棒
    participant M as 💨 魔法弹
    participant T as 🎯 目标

    P->>W: 按住右键蓄力
    W->>P: 显示蓄力指示
    P->>W: 松开右键
    W->>M: 发射魔法弹！
    M->>T: 飞向目标
    T->>P: 💥 爆炸！造成伤害
```

**功能清单**：
- ✅ 蓄力系统
- ✅ 发射魔法弹
- ✅ 爆炸效果
- ✅ 耐久度消耗

### 2.4 模块三：魔法生物 🧚

> 驯服你的魔法小伙伴！

```mermaid
stateDiagram-v2
    [*] --> Wild: 生成于世界

    Wild --> Following: 喂食水晶
    Wild --> Following: 驯服成功

    Following --> Sitting: /sit 命令
    Following --> Wild: 主人死亡

    Sitting --> Following: /stand 命令
    Sitting --> Wild: 主人死亡

    Following --> Attacking: 发现敌人
    Attacking --> Following: 击杀敌人

    Following --> [*]: 被击杀
    Wild --> [*]: 被击杀
```

**功能清单**：
- ✅ 自然生成
- ✅ 用水晶驯服
- ✅ 跟随/坐下命令
- ✅ 协助攻击

---

## 3. 项目架构

### 3.1 目录结构

```mermaid
graph TD
    subgraph "📁 项目结构"
        ROOT["📂 src/main/java"]
        PKG["📦 net.example.mymod"]
    end

    subgraph "🧩 核心模块"
        INIT["📋 init/"]
        BLOCKS["🧱 block/"]
        ITEMS["📦 item/"]
        ENTITY["👾 entity/"]
        NETWORK["🌐 network/"]
    end

    ROOT --> PKG
    PKG --> INIT
    PKG --> BLOCKS & ITEMS & ENTITY & NETWORK

    style ROOT fill:#3498db,color:#fff
    style PKG fill:#9b59b6,color:#fff
    style INIT fill:#e67e22
    style BLOCKS fill:#1abc9c
    style ITEMS fill:#e74c3c
    style ENTITY fill:#2ecc71
    style NETWORK fill:#f39c12
```

**详细文件**：

```mermaid
filesystem
    .
    ├── Mymod.java ────────────── "🎮 Mod 入口"
    ├── init/
    │   ├── ModBlocks.java ───── "🧱 方块注册"
    │   ├── ModItems.java ────── "📦 物品注册"
    │   └── ModEntities.java ──── "👾 实体注册"
    ├── block/
    │   └── MagicCrystalBlock.java "💎 魔法水晶方块"
    ├── item/
    │   ├── MagicCrystalItem.java "🧪 水晶物品"
    │   └── MagicWandItem.java ─ "🪄 魔法棒"
    ├── entity/
    │   ├── MagicCreature.java ── "🧚 魔法生物"
    │   └── MagicCreatureGoals.java "🤖 AI 行为"
    └── network/
        └── ModNetworking.java ─── "🌐 网络通信"
```

### 3.2 依赖关系图

```mermaid
flowchart TB
    subgraph "🎯 核心"
        MOD["🧙 Mymod.java<br/>(Mod入口)"]
    end

    subgraph "📋 注册层"
        REGB["🧱 ModBlocks"]
        REGI["📦 ModItems"]
        REGE["👾 ModEntities"]
    end

    subgraph "💎 具体实现"
        CRYSTAL["💎 MagicCrystalBlock"]
        WAND["🪄 MagicWandItem"]
        CREATURE["🧚 MagicCreature"]
    end

    MOD --> REGB & REGI & REGE
    REGB --> CRYSTAL
    REGI --> WAND
    REGE --> CREATURE

    WAND -.->|"使用"| PROJ["💨 MagicProjectile"]
    PROJ -.->|"产生"| PARTICLE["✨ 粒子效果"]

    style MOD fill:#9b59b6,color:#fff
    style CRYSTAL fill:#3498db,color:#fff
    style WAND fill:#e74c3c,color:#fff
    style CREATURE fill:#2ecc71,color:#fff
```

---

## 4. 技术要点

### 4.1 学习路径图

```mermaid
flowchart LR
    A["🧱 魔法水晶"] --> B["🪄 魔法棒"]
    B --> C["🧚 魔法生物"]

    A -->|"学会"| A1["方块创建"]
    A -->|"学会"| A2["BlockEntity"]
    A -->|"学会"| A3["粒子效果"]

    B -->|"学会"| B1["自定义物品"]
    B -->|"学会"| B2["投掷物实体"]
    B -->|"学会"| B3["网络通信"]

    C -->|"学会"| C1["实体系统"]
    C -->|"学会"| C2["AI 行为"]
    C -->|"学会"| C3["驯服机制"]
```

### 4.2 技术对照表

```mermaid
table
    | 模块 | 技术点 | 难度 |
    |------|--------|------|
    | 💎 魔法水晶 | BlockEntity 存储 | ⭐⭐ |
    | 💎 魔法水晶 | luminance() 发光 | ⭐ |
    | 💎 魔法水晶 | 粒子特效 | ⭐⭐ |
    | 🪄 魔法棒 | Item.use() 物品使用 | ⭐⭐ |
    | 🪄 魔法棒 | ProjectileEntity 投掷物 | ⭐⭐⭐ |
    | 🪄 魔法棒 | 网络同步 | ⭐⭐⭐ |
    | 🧚 魔法生物 | PathAwareEntity | ⭐⭐⭐ |
    | 🧚 魔法生物 | GoalSelector AI | ⭐⭐⭐⭐ |
    | 🧚 魔法生物 | Tameable 驯服 | ⭐⭐⭐ |
```

### 4.3 核心概念关联

```mermaid
graph LR
    subgraph "📚 基础概念"
        E1["⚡ 事件系统"]
        E2["📦 注册机制"]
        E3["🆔 Identifier"]
    end

    subgraph "💎 魔法水晶"
        C1["BlockEntity"]
        C2["粒子 API"]
    end

    subgraph "🪄 魔法棒"
        W1["Item 覆写"]
        W2["网络包 C2S"]
    end

    subgraph "🧚 魔法生物"
        M1["Entity 创建"]
        M2["AI Goals"]
    end

    E1 --> C1 & W1 & M1
    E2 --> C1 & W1 & M1
    C1 --> C2
    W1 --> W2
```

---

## 5. 准备工作

### 5.1 前置知识检查

```mermaid
flowchart TD
    START["🙋 开始前检查"] --> Q1{"了解 Java 基础？"}
    Q1 -->|否| J["📚 先学 Java 基础"]
    Q1 -->|是| Q2{"会搭开发环境？"}
    J --> Q1

    Q2 -->|否| E["🛠️ 环境搭建"]
    Q2 -->|是| Q3{"创建过方块/物品？"}
    E --> Q2

    Q3 -->|否| B["🧱 基础教程"]
    Q3 -->|是| READY["✅ 准备就绪！"]
    B --> Q3

    style START fill:#9b59b6,color:#fff
    style READY fill:#2ecc71,color:#fff
```

### 5.2 环境检查清单

```mermaid
pie "环境准备度"
    "✅ Java 21 安装" : 25
    "✅ IntelliJ IDEA" : 25
    "✅ Minecraft 1.21+" : 25
    "✅ Fabric 模组" : 25
```

### 5.3 开始前确认

> 运行以下命令确认环境：

```bash
# 检查 Java 版本
java -version
# 应该显示：java version "21.x.x"

# 检查 Gradle
./gradlew --version
# 应该正常运行
```

---

## 🎯 总结

```mermaid
flowchart TD
    A["🚀 准备好了吗？"] --> B{"我已就位！"}
    B -->|是| C["💎 进入第一章"]
    B -->|否| D["📚 先复习前置知识"]

    C --> E["🧱 魔法水晶方块"]
    E --> F["🪄 魔法棒"]
    F --> G["🧚 魔法生物"]
    G --> H["🎉 完成！发布你的 Mod！"]

    style A fill:#9b59b6,color:#fff
    style H fill:#ffd93d,color:#000
```

### 你将获得：

- ✅ 一个完整的 Mod 源码
- ✅ 3 个自定义方块/物品/实体
- ✅ 网络同步的实战经验
- ✅ 发布到 Modrinth 的能力
- ✅ 在朋友面前炫耀的资本 😎

---

## 下一步

准备好开始了吗？

- [💎 第一章：魔法水晶](./02-magic-crystal.md) - 创建会发光的方块
- [🪄 第二章：魔法棒](./03-magic-wand.md) - 发射魔法弹
- [🧚 第三章：魔法生物](./04-magic-creature.md) - 驯服你的伙伴

---

*🎮 "代码改变世界，Mod 改变 Minecraft！"*
