# Minecraft 1.21 数据修复（DataFixer）系统分析

## 目录
1. [概述](#概述)
2. [架构设计](#架构设计)
3. [Schema 系统](#schema-系统)
4. [Fix 系统](#fix-系统)
5. [版本管理](#版本管理)
6. [数据转换流程](#数据转换流程)
7. [常见修复类型](#常见修复类型)
8. [TypeReferences 类型引用](#typereferences-类型引用)
9. [实际应用场景](#实际应用场景)
10. [关键代码引用](#关键代码引用)

---

## 概述

Minecraft 的 DataFixer 系统（也称为 DataFixerUpper）是游戏用于处理世界数据随版本迁移的核心组件。当游戏更新时，某些数据结构（如方块ID、物品ID、NBT格式）会发生变化，DataFixer 系统确保旧版本的世界数据能够正确转换到新版本。

**核心目标：**
- 确保旧世界数据可以加载到新版本
- 保持游戏逻辑的向后兼容性
- 支持增量版本迁移（可以跳过多个版本）
- 自动化数据转换减少手动修复

**使用场景：**
- 加载旧版本创建的存档
- 导入旧版本的 NBT 数据
- 迁移配置和进度数据
- 处理数据包和战利品表

---

## 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DataFixer 架构                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │     Schemas     │───>│     Schemas     │───>│     Schemas     │ │
│  │    (数据模式)    │    │    (数据模式)    │    │    (数据模式)    │ │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘ │
│           │                     │                     │           │
│           └─────────────────────┼─────────────────────┘           │
│                                 ▼                                   │
│                    ┌─────────────────────┐                        │
│                    │   DataFixerUpper   │                        │
│                    │   (修复器上层)       │                        │
│                    └──────────┬──────────┘                        │
│                               │                                     │
│                    ┌─────────┴─────────┐                        │
│                    │    DataFixerUpper   │                        │
│                    │    (增量修复器)      │                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
│           ┌─────────────────┼─────────────────┐                 │
│           ▼                 ▼                 ▼                 │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │     Fix_1      │ │     Fix_2      │ │     Fix_N      │       │
│  │   (版本1修复)   │ │   (版本2修复)   │ │   (版本N修复)   │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

**核心文件：** `..../source/net/minecraft/datafixer/Schemas.java`

```java
// Schemas 类管理所有的数据模式版本
public class Schemas {
    
    // 版本号到模式的映射
    private final Int2ObjectMap<Schema> versions;
    
    // 初始化标志
    private volatile boolean initialized;
    
    // 获取指定版本的 Schema
    public Schema getSchema(int version) {
        return versions.get(version);
    }
}
```

### 2.3 Mojang DataFixerLib

Minecraft 使用了 Mojang 的 DataFixerLib 库，该库提供：

- **DynamicOps**：通用数据操作接口
- **TypeCache**：类型缓存优化
- **FunctionAdapter**：函数适配
- ** optic**：光学系统（类似 lens，用于数据导航）

```java
// DataFixerBuilder 用于构建修复器
DataFixerBuilder builder = new DataFixerBuilder(DataFixerConstants.DATA_VERSION);

// 添加版本范围
builder.addSchema(1343, factory);
builder.addSchema(1344, factory);
// ...

// 构建修复器
DataFixer fixerUpper = builder.build();
```

---

## Schema 系统

### 3.1 Schema 概述

Schema 定义了数据的结构和验证规则，每个游戏版本对应一个 Schema。

**核心文件：** `..../source/net/minecraft/datafixer/schema/`

### 3.2 Schema 定义示例

```java
// Schema1460.java - 1.14.4 版本的 Schema
public class Schema1460 extends Schema {
    
    public Schema1460(int versionKey, Schema parent) {
        super(versionKey, parent);
    }
    
    public void registerTypes(SchemaFactory factory) {
        // 注册类型定义
        factory.registerSimple(
            new LazyTypeReference("Level"), 
            () -> DSL.and(
                DSL.fields("Level",
                    DSL.optionalFields("Player", TypeReferences.PLAYER)
                )
            )
        );
        
        // 注册方块类型
        factory.registerSimple(
            new LazyTypeReference("BlockEntity"), 
            () -> DSL.fields("BlockEntity",
                TypeReferences.BLOCK_ENTITY.in(p -> p.get("id"))
            )
        );
    }
}
```

### 3.3 DSL 类型定义

DataFixer 使用领域特定语言（DSL）定义数据结构：

```java
// 基本类型
DSL::remainder  // 保留所有未处理的字段
DSL::optionalFields  // 可选字段
DSL::fields  // 必需字段
DSL::choice  // 联合类型

// 类型引用
TypeReferences.PLAYER  // 玩家类型
TypeReferences.BLOCK_ENTITY  // 方块实体类型
TypeReferences.ITEM_STACK  // 物品堆叠类型

// 约束
DSL.constType(TypeSerializer)  // 常量类型
DSL.enumType(Class)  // 枚举类型
```

### 3.4 版本链

Schema 版本形成链式结构：

```
Schema 1343 (1.8)
    ↓
Schema 1451 (1.9)
    ↓
Schema 1451 (1.10)
    ↓
Schema 1451 (1.11)
    ↓
Schema 1451 (1.12)
    ↓
Schema 1515 (1.13)
    ↓
Schema 1631 (1.14)
    ↓
Schema 2202 (1.15)
    ↓
Schema 2586 (1.16)
    ↓
Schema 3120 (1.17)
    ↓
Schema 3465 (1.19)
    ↓
Schema 3578 (1.20)
    ↓
Schema 3705 (1.21)
```

---

## Fix 系统

### 4.1 Fix 概述

Fix 是实际执行数据转换的组件。每个 Fix 针对特定版本的特定类型执行转换。

**核心文件：** `..../source/net/minecraft/datafixer/fix/`

### 4.2 Fix 类型层次

```
Fix
├── ChoiceFix  (类型选择修复)
├── RenameFix  (重命名修复)
├── AddFix     (添加字段修复)
└── [其他专用修复...]
    ├── BlockNameFlatteningFix  (方块名扁平化)
    ├── ItemStackComponentizationFix  (物品组件化)
    └── EntityBlockStateFix  (实体方块状态)
```

### 4.3 ChoiceFix

ChoiceFix 用于处理类型分支：

```java
// ChoiceFix.java 简化示意
public class ChoiceFix extends Fix {
    
    private final Type<?> type;
    private final List<Pair<TypeChoiceFix, UnaryOperator>> choices;
    
    @Override
    public Dynamic<?> fix(Dynamic<?> data) {
        // 根据条件选择不同的修复策略
        String type = data.get("id").asString("");
        for (Pair<TypeChoiceFix, UnaryOperator> choice : choices) {
            if (choice.getFirst().test(data)) {
                return choice.getSecond().apply(data);
            }
        }
        return data;
    }
}
```

### 4.4 注册修复

```java
// 在 Schema 中注册修复
public class Schema1629 extends Schema {
    
    @Override
    public void registerFixes(FixerUpper upper) {
        // 注册方块名修复
        this.registerFix(
            upper, 
            "Block Name", 
            new BlockNameFlatteningFix(this)
        );
        
        // 注册物品ID修复
        this.registerFix(
            upper, 
            "Item Id", 
            new ItemIdFix(this)
        );
    }
}
```

---

## 版本管理

### 5.1 版本常量

```java
// SharedConstants.java
public class SharedConstants {
    
    // 当前数据版本
    public static final int CURRENT_DATA_VERSION = 3705;
    
    // 版本历史（部分）
    // 1.8: 1343
    // 1.9: 1451
    // 1.10: 1451
    // 1.11: 1451
    // 1.12: 1451
    // 1.13: 1515
    // 1.14: 1631
    // 1.15: 2202
    // 1.16: 2586
    // 1.17: 3120
    // 1.18: 3120
    // 1.19: 3465
    // 1.19.4: 3337
    // 1.20: 3578
    // 1.21: 3705
}
```

### 5.2 数据版本检查

```java
// LevelDataGeneratorOptionsFix.java
public class LevelDataGeneratorOptionsFix extends ChoiceFix {
    
    private static final int MIN_VERSION = 1494;
    private static final int MAX_VERSION = 1629;
    
    @Override
    public int getDataVersion() {
        return MAX_VERSION;
    }
    
    @Override
    public boolean shouldFix(
        Dynamic<?> data, 
        Dynamic<?> comp
    ) {
        return data.getDataVersion() >= MIN_VERSION && 
               data.getDataVersion() < MAX_VERSION;
    }
}
```

### 5.3 增量修复

DataFixer 支持增量修复，可以从任意版本迁移到当前版本：

```java
// 假设玩家存档是版本 2000
// 当前版本是 3705

// 修复器会按顺序执行：
// 2000 -> 2001 -> 2002 -> ... -> 3705

// 这确保了即使跳过多个版本也能正确迁移
public Dynamic<?> update(
    DynamicOps ops, 
    Dynamic input, 
    int version, 
    int targetVersion
) {
    if (version >= targetVersion) {
        return input;
    }
    
    Dynamic current = input;
    for (int v = version; v < targetVersion; v++) {
        Fix fix = getFix(v);
        current = fix.fix(current);
    }
    return current;
}
```

---

## 数据转换流程

### 6.1 世界加载流程中的数据修复

```
┌─────────────────────────────────────────────────────────────────────┐
│                    世界加载数据修复流程                                 │
└─────────────────────────────────────────────────────────────────────┘

1. 读取世界文件
   │
   ▼
2. 提取数据版本
   │
   ▼
3. 版本比较
   │
   ├── 当前版本 == 数据版本 ──> 直接使用，无需修复
   │
   └── 当前版本 > 数据版本 ──> 执行数据修复
       │
       ▼
4. 创建 DataFixerUpper
       │
       ▼
5. 遍历版本链，执行修复
       │
       ▼
6. 返回修复后的数据
       │
       ▼
7. 加载世界
```

### 6.2 NBT 数据修复

```java
// 使用 DataFixer 修复 NBT
public NbtCompound fixNbt(NbtCompound nbt, int fromVersion, int toVersion) {
    
    // 将 NBT 转换为 Dynamic
    Dynamic<NbtElement> dynamic = Dynamic.convert(
        NbtOps.INSTANCE,  // NBT 操作
        JsonOps.INSTANCE,  // JSON 操作
        nbt
    );
    
    // 添加版本信息
    dynamic = dynamic.set("DataVersion", dynamic.createInt(fromVersion));
    
    // 执行修复
    dynamic = fixerUpper.update(
        dynamic, 
        fromVersion, 
        toVersion
    );
    
    // 提取修复后的数据
    return (NbtCompound) dynamic.getValue();
}
```

### 6.3 Chunk 数据修复

Chunk 数据修复是性能关键路径：

```java
// Chunk 数据修复流程
public ProtoChunk fixChunk(
    ProtoChunk chunk, 
    int version
) {
    // 1. 检查是否需要修复
    if (version >= CURRENT_DATA_VERSION) {
        return chunk;
    }
    
    // 2. 修复方块状态
    chunk.setBlockStateArray(
        fixBlockStateArray(chunk.getBlockStateArray(), version)
    );
    
    // 3. 修复方块实体
    for (BlockEntity entity : chunk.getBlockEntities()) {
        entity.read(fixNbt(entity.toNbt(), version));
    }
    
    // 4. 修复生物群系
    chunk.setBiomes(fixBiomes(chunk.getBiomes(), version));
    
    return chunk;
}
```

---

## 常见修复类型

### 7.1 方块名扁平化 (1.13)

将数字 ID 转换为命名空间 ID：

```java
// BlockNameFlatteningFix.java
public class BlockNameFlatteningFix extends ChoiceFix {
    
    // 映射表: 数字ID -> 字符串ID
    // 1 -> "minecraft:air"
    // 2 -> "minecraft:stone"
    // ...
    
    @Override
    public Dynamic<?> fix(Dynamic<?> data) {
        // 将 "id" 字段从整数转换为字符串
        int id = data.get("id").asInt(0);
        String name = getBlockName(id);
        return data.set("id", data.createString(name));
    }
}
```

### 7.2 物品堆叠组件化 (1.20.5)

将物品的 NBT 数据转换为组件系统：

```java
// ItemStackComponentizationFix.java
public class ItemStackComponentizationFix extends Fix {
    
    @Override
    public Dynamic<?> fix(Dynamic<?> data) {
        // 1. 提取旧 NBT 格式中的数据
        String displayName = data.get("display").get("Name").asString("");
        List<String> lore = data.get("display").get("Lore").asList(...);
        
        // 2. 转换为新组件格式
        Dynamic<?> components = data.createMap(Map.of(
            "custom_name", data.createString(displayName),
            "lore", data.createList(lore.stream())
        ));
        
        // 3. 用新格式替换旧格式
        return data.remove("tag").set("components", components);
    }
}
```

### 7.3 实体方块状态修复

```java
// EntityBlockStateFix.java
public class EntityBlockStateFix extends ChoiceFix {
    
    // 修复格式变化
    // 旧: {BlockState: "minecraft:facing=north"}
    // 新: {BlockState: {Facing: "north"}}
    
    @Override
    public Dynamic<?> fix(Dynamic<?> data) {
        String blockState = data.get("BlockState").asString("");
        if (blockState.isEmpty()) {
            return data;
        }
        
        // 解析方块状态字符串
        Map<String, String> state = parseBlockState(blockState);
        
        // 转换为对象格式
        Dynamic<?> stateObj = data.createMap(
            state.entrySet().stream()
                .map(e -> Map.entry(e.getKey(), data.createString(e.getValue())))
                .collect(Collectors.toMap())
        );
        
        return data.set("BlockState", stateObj);
    }
}
```

### 7.4 UUID 修复

```java
// EntityUuidFix.java
// 修复数字数组格式的 UUID 为字符串格式

// 旧格式: [Long, Long] (两个长整数)
// 新格式: String (标准 UUID 字符串)

// 格式: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 7.5 命名空间重命名

```java
// AdvancementRenameFix.java
// 修复进度 ID 的命名空间

// 旧: "achievements.mineStone"
// 新: "minecraft:adventure/mine_a_block"
```

---

## TypeReferences 类型引用

### 8.1 类型引用常量

**核心文件：** `..../source/net/minecraft/datafixer/TypeReferences.java`

```java
public class TypeReferences {
    
    // 世界数据
    public static final TypeReference LEVEL = new TypeReference("Level");
    public static final TypeReference GAME_OPTIONS = new TypeReference("GameOptions");
    public static final TypeReference PLAYER = new TypeReference("Player");
    
    // 方块相关
    public static final TypeReference CHUNK = new TypeReference("Chunk");
    public static final TypeReference BLOCK_ENTITY = new TypeReference("BlockEntity");
    public static final TypeReference BLOCK_STATE = new TypeReference("BlockState");
    
    // 物品相关
    public static final TypeReference ITEM_STACK = new TypeReference("ItemStack");
    public static final TypeReference ITEM = new TypeReference("Item");
    
    // 实体相关
    public static final TypeReference ENTITY = new TypeReference("Entity");
    public static final TypeReference ENTITY_CHUNK = new TypeReference("EntityChunk");
    
    // 进度相关
    public static final TypeReference ADVANCEMENTS = new TypeReference("Advancements");
    public static final TypeReference ADVANCEMENT = new TypeReference("Advancement");
    
    // 结构相关
    public static final TypeReference STRUCTURE = new TypeReference("Structure");
    
    // 其他
    public static final TypeReference POI_CHUNK = new TypeReference("POIChunk");
    public static final TypeReference STATS = new TypeReference("Stats");
    public static final TypeReference RECIPE = new TypeReference("Recipe");
}
```

### 8.2 类型定义使用

```java
// 在 Schema 中使用类型引用
public void registerTypes(SchemaFactory factory) {
    
    // 定义玩家类型
    factory.registerSimple(
        PLAYER, 
        () -> DSL.fields(
            "player",
            DSL.optionalFields(
                "Inventory",
                DSL.list(TypeReferences.ITEM_STACK),
                "EnderItems",
                DSL.list(TypeReferences.ITEM_STACK),
                "Abilities"
            )
        )
    );
    
    // 定义物品堆叠类型
    factory.registerSimple(
        ITEM_STACK, 
        () -> DSL.fields(
            "Item",
            TypeReferences.ITEM.in(DSL::field),
            DSL.optionalFields(
                "tag",  // NBT 数据
                DSL.remainder()
            )
        )
    );
}
```

---

## 实际应用场景

### 9.1 加载旧存档

```java
// ServerLifecycleHooks.java
public ServerWorld loadWorld(
    ServerWorld world, 
    SaveProperties properties, 
    WorldDetails worldDetails
) {
    // 1. 获取存档数据版本
    int dataVersion = properties.getDataVersion();
    
    // 2. 比较版本
    if (dataVersion < SharedConstants.CURRENT_DATA_VERSION) {
        // 3. 修复世界数据
        worldData.fixData();
    }
    
    // 4. 加载世界
    return new ServerWorld(...);
}
```

### 9.2 修复世界难度

```java
// LevelDataGeneratorOptionsFix.java
public class LevelDataGeneratorOptionsFix extends ChoiceFix {
    
    @Override
    public Dynamic<?> fix(Dynamic<?> data) {
        // 修复难度设置格式变化
        String difficulty = data.get("difficulty").asString("hard");
        return data.set(
            "difficulty", 
            data.createString("hard".equals(difficulty) ? "hard" : difficulty)
        );
    }
}
```

### 9.3 修复物品附魔

```java
// ItemStackEnchantmentFix.java
public class ItemStackEnchantmentFix extends ChoiceFix {
    
    // 1.13+ 格式: {Enchantments: [{id: "minecraft:sharpness", lvl: 1}]}
    // 1.12  格式: {ench: [{id: 16, lvl: 1}]} (数字ID)
    
    @Override
    public Dynamic<?> fix(Dynamic<?> data) {
        // 提取旧格式数据
        ListTag ench = data.get("ench").asList();
        
        // 转换为新格式
        ListTag newEnch = new ListTag();
        for (Tag tag : ench) {
            int oldId = ((IntTag) tag.get("id")).asInt();
            int level = ((IntTag) tag.get("lvl")).asInt();
            
            String newId = convertEnchantmentId(oldId);
            
            CompoundTag newTag = new CompoundTag();
            newTag.put("id", StringTag.of("minecraft:" + newId));
            newTag.put("lvl", IntTag.of(level));
            
            newEnch.add(newTag);
        }
        
        return data.remove("ench").set("Enchantments", newEnch);
    }
}
```

---

## 关键代码引用

### 10.1 创建 DataFixer

```java
// DataFixers.java
public static DataFixerUpper createUpperFixer() {
    DataFixerBuilder builder = new DataFixerBuilder(
        SharedConstants.CURRENT_DATA_VERSION
    );
    
    // 添加所有版本 Schema
    Schemas.getInstance().getSchemas().forEach((version, schema) -> {
        builder.addSchema(version, schema::registerTypes);
    });
    
    // 构建并返回
    return builder.build();
}
```

### 10.2 使用 FixerUpper

```java
// 修复 NBT 数据
DynamicOps<NbtElement> ops = NbtOps.INSTANCE;

// 将 NBT 转换为 Dynamic
Dynamic<NbtElement> dynamic = Dynamic.convert(ops, input);

// 执行版本修复
dynamic = fixerUpper.update(
    dynamic,  // 输入数据
    inputVersion,  // 起始版本
    SharedConstants.CURRENT_DATA_VERSION  // 目标版本
);

// 转换回 NBT
NbtCompound result = (NbtCompound) dynamic.getValue();
```

### 10.3 自定义 Fix 开发教程

#### 10.3.1 为什么需要自定义 Fix

当你开发 Mod 时，如果修改了游戏数据结构（如重命名方块、改变物品 NBT 格式），需要添加自定义 Fix 确保旧世界数据能正确迁移。

#### 10.3.2 完整示例：重命名自定义方块

```java
// 1. 创建自定义修复类
public class ModBlockRenameFix extends ChoiceFix {
    private final Map<String, String> blockRenames;

    public ModBlockRenameFix(Schema schema, int version,
                             Map<String, String> blockRenames) {
        super(schema, false, "mod_block_rename", References.BLOCK_ENTITY, version);
        this.blockRenames = blockRenames;
    }

    @Override
    protected TypeRewriteRule makeRule() {
        // 创建类型规则
        return this.facade.getChoiceType(
            References.BLOCK_ENTITY,
            this.getVersionKey()
        ).revision(this.fromVersion()).type().xpath(
            this.xpath("d/@id")  // 定位到方块 ID
        ).visit(
            XpatHVisitor.fromChanger(
                pair -> pair.mapFirst(name -> {
                    // 执行重命名
                    String oldName = name.asString("");
                    String newName = blockRenames.getOrDefault(oldName, oldName);
                    return name.equals(oldName) ?
                        name.createString(newName) : name;
                })
            )
        );
    }
}

// 2. 注册自定义 Fix
public class ModDataFixes {
    public static final int BLOCK_RENAME_VERSION = 5000;

    public static void register(DataFixerBuilder builder) {
        // 添加 Mod 数据版本
        builder.addSchema(BLOCK_RENAME_VERSION, ModSchema::new);

        // 注册自定义修复
        builder.getRegistryBuilder()
            .addMigrator(
                new ModMigrator(
                    BLOCK_RENAME_VERSION,
                    Map.of(
                        "mymod:old_block", "mymod:new_block",
                        "mymod:deprecated_block", "mymod:replacement_block"
                    )
                )
            );
    }

    private static class ModSchema extends Schema {
        public ModSchema(int versionKey, @Nullable Schema parent) {
            super(versionKey, parent);
        }

        @Override
        public void registerTypes(SchemaFactory factory) {
            factory.registerSimple(
                new ResourceLocation("mymod", "custom_block")
            );
        }
    }
}

// 3. 应用到世界加载
public class ModWorldLoader {
    public static DataFixerUpper createDataFixer() {
        DataFixerBuilder builder = new DataFixerBuilder(
            DataFixerConstants.DATA_VERSION
        );

        // 注册游戏原有 Fix
        // ...

        // 注册 Mod 自定义 Fix
        ModDataFixes.register(builder);

        return builder.build();
    }
}
```

#### 10.3.3 常见 Fix 模式

| 模式 | 用途 | 代码模式 |
|------|------|---------|
| 重命名 | ID 映射 | `xpath + fromChanger` |
| 添加字段 | 默认值填充 | `xpath + addElement` |
| 删除字段 | 清理废弃数据 | `xpath + removeElement` |
| 类型转换 | NBT 标签类型变更 | `xpath + xfrm` |

#### 10.3.4 注意事项

1. **版本号必须递增**：每次 Fix 都要使用更高的版本号
2. **向后兼容**：确保旧版本数据能正确迁移
3. **幂等性**：重复应用 Fix 不应产生错误结果
4. **测试**：务必测试各种旧版本数据的迁移

```java
// 测试示例
@Test
public void testDataFixerMigration() {
    NbtCompound oldData = createOldVersionData();
    DataFixerUpper fixer = ModWorldLoader.createDataFixer();

    // 从旧版本迁移到最新版本
    NbtCompound migratedData = fixer.update(
        References.STRUCTURE,
        new Dynamic<>(NbtOps.INSTANCE, oldData),
        MIN_VERSION,
        DataFixerConstants.DATA_VERSION
    ).getValue();

    // 验证迁移结果
    assertEquals("mymod:new_block",
        migratedData.getString("BlockId"));
}
```

---

### 10.4 版本号参考表

| 游戏版本 | 数据版本 | 重大变化 |
|---------|---------|----------|
| 1.13 | 1343 | 方块状态系统引入 |
| 1.14 | 1515 | 村民数据结构变化 |
| 1.15 | 1631 | 蜜蜂和蜂巢 |
| 1.16 | 2202 | 下界更新 |
| 1.17 | 2586 | 洞穴与山峰 |
| 1.18 | 2865 | 世界高度扩展 |
| 1.19 | 3120 | 幽匿系统 |
| 1.20 | 3465 | 考古系统 |
| 1.21 | 3953 | 当前版本 |

---

## 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        版本与修复映射                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  版本号: 1343 ──┬──> Schema1343 ──> Fix[1343->1451]              │
│                 │                                                  │
│  版本号: 1451 ──┼──> Schema1451 ──> Fix[1451->1515]              │
│                 │                                                  │
│  版本号: 1515 ──┼──> Schema1515 ──> Fix[1515->1631]              │
│                 │                                                  │
│  版本号: 1631 ──┼──> Schema1631 ──> Fix[1631->2202]              │
│                 │                                                  │
│  版本号: 2202 ──┼──> Schema2202 ──> Fix[2202->2586]              │
│                 │                                                  │
│  版本号: 2586 ──┼──> Schema2586 ──> Fix[2586->3120]              │
│                 │                                                  │
│  版本号: 3120 ──┼──> Schema3120 ──> Fix[3120->3465]              │
│                 │                                                  │
│  版本号: 3465 ──┼──> Schema3465 ──> Fix[3465->3578]              │
│                 │                                                  │
│  版本号: 3578 ──┼──> Schema3578 ──> Fix[3578->3705]              │
│                 │                                                  │
│  版本号: 3705 ──┴──> Schema3705 (当前版本)                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           数据修复流程                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  输入数据 ──> [版本检查] ──> [需要修复?] ──┬──> 否 ──> 直接返回     │
│                                          │                          │
│                                          └──> 是 ──> [逐版本修复]   │
│                                                          │          │
│                                                     ┌────┴────┐    │
│                                                     │  Fix 1  │    │
│                                                     └────┬────┘    │
│                                                          │          │
│                                                     ┌────┴────┐    │
│                                                     │  Fix 2  │    │
│                                                     └────┬────┘    │
│                                                          │          │
│                                                          ▼          │
│                                                    ┌─────────┐      │
│                                                    │  输出数据 │      │
│                                                    └─────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 总结

Minecraft 的 DataFixer 系统是一个精心设计的版本迁移框架：

1. **增量修复**：支持从任意旧版本迁移到新版本
2. **Schema 驱动**：通过模式定义验证数据结构
3. **类型安全**：TypeReference 提供强类型的数据引用
4. **DSL 表达**：领域特定语言简化类型定义
5. **自动化处理**：在世界加载时自动执行修复

这套系统确保了 Minecraft 能够保持对旧世界数据的兼容性，同时允许开发者在更新中自由改变数据结构。
