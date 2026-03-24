# NeoForge 架构解析

## 与 Forge 的区别

| 特性 | NeoForge | Forge |
|------|----------|-------|
| 更新速度 | 快 | 慢 |
| 代码风格 | 现代、简洁 | 传统 |
| 事件系统 | 强类型 | 反射 |
| 社区维护 | 活跃 | 较慢 |
| 版本支持 | 1.20+ | 全版本 |

## 核心组件

### RegistryEntries

```java
DeferredHolder<Block, Block> RUBY_BLOCK = REGISTRATE
    .createBlock("ruby_block", Properties.copy(Blocks.IRON_BLOCK))
    .lang("Ruby Block")
    .register();

// 使用时获取
public static final RegistryEntry<Block> RUBY_BLOCK = BLOCKS
    .register("ruby_block", () -> new Block(BlockBehaviour.Properties.copy(Blocks.IRON_BLOCK)));
```

### DeferredRegister（延迟注册）

```java
public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(
    NeoForgeMod.MOD_ID, Registries.ITEM
);

public static final RegistryEntry<Item> RUBY = ITEMS.register("ruby", () -> new Item(
    new Item.Properties().stacksTo(64)
));
```

## 配置文件

```java
// ConfigSpec 定义
private static final ForgeConfigSpec.ConfigValue<Integer> MAGIC_NUMBER;
private static final ForgeConfigSpec.ConfigValue<String> MAGIC_STRING;

static {
    Pair<Config, ForgeConfigSpec> pair = new ForgeConfigSpec.Builder()
        .configure(Config::new);
    CONFIG = pair.getLeft();
    SPEC = pair.getRight();
}
```
