# 🔖 注册系统 —— 给你的 Mod 对象发"身份证"！

> **TL;DR** 注册 = 给方块/物品/实体分配唯一的 ID，没有注册 = 游戏不认识你！

---

## 📖 目录

1. [🎯 为什么要注册？](#1-为什么要注册)
2. [📚 注册表系统](#2-注册表系统)
3. [🧱 注册方块](#3-注册方块)
4. [📦 注册物品](#4-注册物品)
5. [👾 注册实体](#5-注册实体)
6. [💡 同时注册方块和物品](#6-同时注册方块和物品)
7. [❓ 常见问题](#7-常见问题)

---

## 1. 为什么要注册？

### 1.1 什么是注册？

```mermaid
flowchart LR
    subgraph "🏠 Minecraft 世界"
        direction TB
        W["🎮 世界"]
        W --> O1["🧱 方块"]
        W --> O2["📦 物品"]
        W --> O3["👾 实体"]
    end

    subgraph "🔖 注册 = 发身份证"
        R["📋 注册表"]
        R --> ID1["minecraft:stone"]
        R --> ID2["mymod:magic_crystal"]
        R --> ID3["minecraft:diamond"]
    end

    O1 -.->|"对照"| R
```

**注册 = 给游戏对象分配唯一的 Identifier（标识符）**

### 1.2 不注册会怎样？

```mermaid
flowchart TD
    A["❌ 不注册"] --> B{"游戏不认识你的对象"}
    B --> C["👤 玩家无法获得"]
    B --> D["💾 无法保存到存档"]
    B --> E["🌐 网络无法同步"]

    style A fill:#e74c3c,color:#fff
    style C fill:#f39c12
    style D fill:#f39c12
    style E fill:#f39c12
```

### 1.3 注册的好处

```mermaid
flowchart LR
    subgraph "✅ 注册后"
        G1["👤 玩家可用 /give 获取"]
        G2["💾 自动保存到存档"]
        G3["🌐 多人游戏同步"]
        G4["📖 JEI/REI 显示"]
    end

    style G1 fill:#2ecc71
    style G2 fill:#2ecc71
    style G3 fill:#2ecc71
    style G4 fill:#2ecc71
```

---

## 2. 注册表系统

### 2.1 注册表是什么？

```mermaid
flowchart TB
    subgraph "📚 注册表 Registry = 大字典"
        direction TB

        R1["📖 物品注册表<br/>Registries.ITEM"]
        R1 --> I1["minecraft:diamond → 钻石"]
        R1 --> I2["minecraft:stick → 木棍"]
        R1 --> I3["mymod:crystal → 魔法水晶"]

        R2["🧱 方块注册表<br/>Registries.BLOCK"]
        R2 --> B1["minecraft:stone → 石头"]
        R2 --> B2["minecraft:bedrock → 基岩"]

        R3["👾 实体注册表<br/>Registries.ENTITY_TYPE"]
        R3 --> E1["minecraft:pig → 猪"]
        R3 --> E2["mymod:magic_slime → 魔法史莱姆"]
    end

    style R1 fill:#e74c3c,color:#fff
    style R2 fill:#3498db,color:#fff
    style R3 fill:#2ecc71,color:#fff
```

### 2.2 Identifier（标识符）= 门牌号

```mermaid
flowchart LR
    ID["🔖 Identifier.of(namespace, path)"]

    ID --> N["命名空间<br/>通常是 mod ID<br/>例：mymod"]
    ID --> P["路径<br/>对象名称<br/>例：magic_crystal"]

    ID --> FINAL["最终格式：mymod:magic_crystal"]
    N -->|"组合"| FINAL
    P --> FINAL

    style ID fill:#9b59b6,color:#fff
    style FINAL fill:#2ecc71
```

### 2.3 常用注册表速查

```mermaid
mindmap
  root((📚 Registries))
    🧱 方块
      Registries.BLOCK
      方块本身
    📦 物品
      Registries.ITEM
      物品形式
    👾 实体
      Registries.ENTITY_TYPE
      生物/投射物
    🎵 音效
      Registries.SOUND_EVENT
      自定义声音
    ✨ 粒子
      Registries.PARTICLE_TYPE
      特效粒子
    📋 方块实体
      Registries.BLOCK_ENTITY_TYPE
      存储数据的方块
```

---

## 3. 注册方块

### 3.1 注册流程图

```mermaid
flowchart TD
    A["🧱 创建 Block 对象"] --> B["🔖 创建 Identifier"]
    B --> C["📝 Registry.register()"]
    C --> D["✅ 注册成功！"]

    style A fill:#3498db
    style D fill:#2ecc71
```

### 3.2 完整代码

```java
public class ModBlocks {

    // ========== 1️⃣ 创建方块 ==========
    public static final Block MAGIC_BLOCK = new Block(
        Block.Settings.create()
            .strength(3.0f)           // 硬度
            .luminance(state -> 10)   // 发光
    );

    // ========== 2️⃣ 注册方块 ==========
    public static void register() {
        registerBlock("magic_block", MAGIC_BLOCK);
    }

    private static void registerBlock(String name, Block block) {
        // 注册到方块注册表
        Registry.register(
            Registries.BLOCK,                           // 注册表
            Identifier.of(Mymod.MOD_ID, name),        // ID
            block                                        // 方块对象
        );

        // 同时注册物品形式
        Registry.register(
            Registries.ITEM,
            Identifier.of(Mymod.MOD_ID, name),
            new BlockItem(block, new FabricItemSettings())
        );
    }
}
```

### 3.3 方块属性对照表

```mermaid
pie "方块属性用途"
    "硬度 strength" : 40
    "音效 sounds" : 20
    "发光 luminance" : 20
    "工具要求" : 20
```

---

## 4. 注册物品

### 4.1 物品类型

```mermaid
flowchart TD
    A["📦 物品类型"] --> B["普通物品"]
    A --> C["工具类物品"]
    A --> D["食物"]
    A --> E["方块物品"]
    A --> F["特殊物品"]

    B --> B1["堆叠物品<br/>maxCount()"]
    C --> C1["有耐久度<br/>maxDamage()"]
    D --> D1["可食用<br/>food()"]
    E --> E1["BlockItem"]
    F --> F1["自定义行为<br/>继承 Item"]

    style A fill:#e74c3c,color:#fff
    style B fill:#3498db
    style C fill:#9b59b6
    style D fill:#2ecc71
```

### 4.2 完整代码

```java
public class ModItems {

    // ========== 普通物品 ==========
    public static final Item MAGIC_CRYSTAL = new Item(
        new FabricItemSettings().maxCount(64)
    );

    // ========== 不可堆叠 ==========
    public static final Item TOOL = new Item(
        new FabricItemSettings().maxCount(1)
    );

    // ========== 有耐久度 ==========
    public static final Item DURABLE_ITEM = new Item(
        new FabricItemSettings().maxDamage(100)
    );

    // ========== 食物 ==========
    public static final Item MAGIC_FOOD = new Item(
        new FabricItemSettings()
            .maxCount(16)
            .food(new FoodComponent.Builder()
                .hunger(8)           // 恢复 8 点饥饿
                .saturationModifier(10f)
                .alwaysEdible()        // 空腹时也可吃
                .statusEffect(
                    new StatusEffectInstance(
                        StatusEffects.SPEED,
                        600,          // 30 秒
                        0             // 1 级
                    ),
                    1.0f            // 100% 概率
                )
                .build()
            )
    );

    public static void register() {
        registerItem("magic_crystal", MAGIC_CRYSTAL);
        registerItem("magic_tool", TOOL);
        registerItem("magic_food", MAGIC_FOOD);
    }

    private static void registerItem(String name, Item item) {
        Registry.register(
            Registries.ITEM,
            Identifier.of(Mymod.MOD_ID, name),
            item
        );
    }
}
```

### 4.3 物品设置速查

```mermaid
table
    | 设置 | 代码 | 说明 |
    |------|------|------|
    | 堆叠数 | .maxCount(64) | 最大 64 |
    | 不可堆叠 | .maxCount(1) | 单独占位 |
    | 耐久度 | .maxDamage(100) | 使用消耗 |
    | 配方剩余 | .recipeRemainder(Items.STICK) | 留下什么 |
    | 物品栏 | .group(ItemGroup.MISC) | 分类显示 |
    | 防火 | .fireproof() | 不怕岩浆 |
```

---

## 5. 注册实体

### 5.1 实体注册流程

```mermaid
flowchart TD
    A["👾 创建 EntityType"] --> B["设置属性"]
    B --> C["指定 SpawnGroup"]
    C --> D["注册到注册表"]
    D --> E["✅ 实体创建成功"]

    A -->|"EntityType.Builder.create()"| A
    B -->|"dimensions()<br/>maxTrackDistance()"| B
    C -->|"CREATURE<br/>MONSTER<br/>AQUATIC"| C

    style A fill:#3498db
    style E fill:#2ecc71
```

### 5.2 完整代码

```java
public class ModEntities {

    public static final EntityType<MagicSlime> MAGIC_SLIME = EntityType.Builder
        .create(MagicSlime::new, SpawnGroup.CREATURE)  // 实体工厂 + 生成组
        .dimensions(1.0f, 1.0f)                       // 碰撞箱大小
        .maxTrackDistance(10.0f)                       // 最大追踪距离
        .trackRangeBlocks(8)                           // 追踪范围
        .build("magic_slime");                         // ID

    public static void register() {
        registerEntity("magic_slime", MAGIC_SLIME);
    }

    private static <T extends Entity> void registerEntity(String name, EntityType<T> entity) {
        Registry.register(
            Registries.ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, name),
            entity
        );
    }
}
```

### 5.3 SpawnGroup（生成组）

```mermaid
flowchart TB
    SG["👾 SpawnGroup 生成组"]

    SG --> CREATURE["🐄 CREATURE<br/>动物、被动生物"]
    SG --> MONSTER["💀 MONSTER<br/>僵尸、骷髅等"]
    SG --> AMBIENT["🦇 AMBIENT<br/>蝙蝠等"]
    SG --> AQUATIC["🐟 AQUATIC<br/>鱼、鱿鱼"]
    SG --> MISC["📦 MISC<br/>掉落物、经验球"]

    style CREATURE fill:#2ecc71
    style MONSTER fill:#e74c3c
    style AMBIENT fill:#95a5a6
    style AQUATIC fill:#3498db
    style MISC fill:#f39c12
```

---

## 6. 同时注册方块和物品

### 6.1 为什么要同时注册？

```mermaid
flowchart LR
    A["🧱 方块 Block"] --> B["放置到世界"]
    B --> C["🎮 游戏内"]

    D["📦 物品 Item"] --> E["玩家背包"]
    E --> C

    A -.->|"需要"| D["BlockItem"]

    style A fill:#3498db
    style D fill:#e74c3c
```

### 6.2 推荐模式

```java
private static void registerBlock(String name, Block block) {
    Identifier id = Identifier.of(Mymod.MOD_ID, name);

    // 1️⃣ 先注册方块
    Registry.register(Registries.BLOCK, id, block);

    // 2️⃣ 再注册物品（BlockItem = 方块的物品形式）
    Registry.register(
        Registries.ITEM, id,
        new BlockItem(block, new FabricItemSettings())
    );
}
```

### 6.3 注册顺序

```mermaid
flowchart LR
    A["🧱 方块"] --> B["📦 物品"]
    B --> C["👾 实体"]
    C --> D["🎵 音效"]
    D --> E["✨ 粒子"]

    style A fill:#3498db
    style B fill:#e74c3c
    style C fill:#2ecc71
```

---

## 7. 常见问题

### 7.1 错误排查流程

```mermaid
flowchart TD
    A["❓ 游戏找不到？"] --> B{"注册方法调用了？"}
    B -->|否| FIX["📝 调用 register()"]
    B -->|是| C{"ID 正确？"}
    C -->|否| FIX2["🔖 检查 Identifier"]
    C -->|是| D{"资源文件存在？"}
    D -->|否| FIX3["📁 添加语言文件"]
    D -->|是| E["✅ 没问题"]

    style FIX fill:#e74c3c
    style FIX2 fill:#e74c3c
    style FIX3 fill:#e74c3c
    style E fill:#2ecc71
```

### 7.2 常见错误

```mermaid
pie "注册错误分布"
    "ID 重复" : 35
    "忘记调用 register()" : 30
    "资源文件缺失" : 20
    "命名空间错误" : 15
```

### 7.3 快速检查清单

| 检查项 | ✅/❌ |
|--------|--------|
| 调用了 `register()` 方法？ | |
| ID 格式正确（modid:name）？ | |
| 命名空间用小写？ | |
| 添加了语言文件？ | |
| 重新构建了项目？ | |

---

## 🎯 总结

```mermaid
flowchart TD
    START["🔖 注册系统核心"] --> A["Identifier = 门牌号"]
    START --> B["Registry = 大字典"]
    START --> C["Registry.register() = 登记"]

    A --> D["格式：modid:name"]
    B --> E["BLOCK / ITEM / ENTITY_TYPE"]
    C --> F["三参数：表 + ID + 对象"]

    START2["💡 记住"] --> T1["先注册方块，再注册物品"]
    START2 --> T2["方块 + BlockItem = 可放置"]
    START2 --> T3["ID 唯一，不能重复"]
```

### 记住这三步：

1. **创建对象** `new Block(...)` / `new Item(...)`
2. **创建 ID** `Identifier.of(MOD_ID, name)`
3. **注册** `Registry.register(Registries.XXX, id, object)`

---

## 下一步

- [🧱 创建方块](./01-creating-blocks.md) - 实战创建你的第一个方块
- [📦 创建物品](./03-creating-items.md) - 创造更多物品类型

---

*💡 **提示**：注册是 Fabric 开发的基础，几乎每个 Mod 都要用到！*
