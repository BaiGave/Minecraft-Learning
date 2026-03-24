# Fabric API 资源加载系统分析

## 概述

资源加载系统包含三个核心模块：
- `fabric-resource-loader-v0` - 资源管理器扩展
- `fabric-resource-conditions-api-v1` - 资源条件 API
- `fabric-convention-tags-v2` - 约定标签系统

---

## 1. fabric-resource-loader-v0 模块

### 1.1 ResourceManagerHelper

```java
public interface ResourceManagerHelper {
    // 注册资源重载监听器
    void registerReloadListener(IdentifiableResourceReloadListener listener);

    // 注册内置资源包
    static boolean registerBuiltinResourcePack(Identifier id, ModContainer container,
        ResourcePackActivationType activationType);
}
```

### 1.2 资源重载监听器

```java
// 简单异步资源重载监听器
public interface SimpleResourceReloadListener<T> extends IdentifiableResourceReloadListener {
    // 异步加载阶段（可多线程）
    CompletableFuture<T> load(ResourceManager manager, Profiler profiler, Executor executor);

    // 同步应用阶段（在主线程）
    CompletableFuture<Void> apply(T data, ResourceManager manager, Profiler profiler, Executor executor);
}

// 同步监听器
public interface SimpleSynchronousResourceReloadListener
        extends IdentifiableResourceReloadListener, SynchronousResourceReloader {
}
```

### 1.3 资源包激活类型

```java
public enum ResourcePackActivationType {
    NORMAL,           // 正常激活，用户完全控制
    DEFAULT_ENABLED,   // 默认启用，用户仍可禁用
    ALWAYS_ENABLED     // 始终启用，用户无法禁用
}
```

---

## 2. fabric-resource-conditions-api-v1 模块

### 2.1 资源条件接口

```java
public interface ResourceCondition {
    Codec<ResourceCondition> CODEC = ...;

    ResourceConditionType<?> getType();
    boolean test(@Nullable RegistryWrapper.WrapperLookup registryLookup);
}
```

### 2.2 预定义条件类型

| 条件ID | 描述 | JSON格式 |
|--------|------|----------|
| `fabric:true` | 始终通过 | `{"condition": "fabric:true"}` |
| `fabric:not` | 条件取反 | `{"condition": "fabric:not", "value": {...}}` |
| `fabric:and` | 全部通过 | `{"condition": "fabric:and", "values": [...]}` |
| `fabric:or` | 任一通过 | `{"condition": "fabric:or", "values": [...]}` |
| `all_mods_loaded` | 所有模组加载 | `{"condition": "all_mods_loaded", "values": [...]}` |
| `any_mods_loaded` | 任一模组加载 | `{"condition": "any_mods_loaded", "values": [...]}` |
| `tags_populated` | 标签存在 | `{"condition": "tags_populated", "registry": "...", "values": [...]}` |
| `features_enabled` | 功能启用 | `{"condition": "features_enabled", "features": [...]}` |

### 2.3 工厂方法

```java
public final class ResourceConditions {
    public static ResourceCondition alwaysTrue()
    public static ResourceCondition not(ResourceCondition condition)
    public static ResourceCondition and(ResourceCondition... conditions)
    public static ResourceCondition or(ResourceCondition... conditions)
    public static ResourceCondition allModsLoaded(String... modIds)
    public static ResourceCondition anyModsLoaded(String... modIds)
    public static ResourceCondition tagsPopulated(TagKey<T>... tags)
    public static ResourceCondition featuresEnabled(Identifier... features)
}
```

---

## 3. fabric-convention-tags-v2 模块

### 3.1 约定标签系统

```java
public record TagRegistration<T>(RegistryKey<Registry<T>> registryKey) {
    public static final TagRegistration<Item> ITEM_TAG =
        new TagRegistration<>(RegistryKeys.ITEM);
    public static final TagRegistration<Block> BLOCK_TAG =
        new TagRegistration<>(RegistryKeys.BLOCK);
    // ...

    // 命名空间前缀: c:
    public TagKey<T> registerC(String tagId) {
        return TagKey.of(registryKey, Identifier.of(TagUtil.C_TAG_NAMESPACE, tagId));
    }
}
```

### 3.2 约定标签示例

```java
// 方块标签
public final class ConventionalBlockTags {
    public static final TagKey<Block> STONES = register("stones");
    public static final TagKey<Block> ORES = register("ores");
    public static final TagKey<Block> COAL_ORES = register("ores/coal");
    public static final TagKey<Block> STORAGE_BLOCKS = register("storage_blocks");
}

// 物品标签
public final class ConventionalItemTags {
    public static final TagKey<Item> GEMS = register("gems");
    public static final TagKey<Item> INGOTS = register("ingots");
    public static final TagKey<Item> TOOLS = register("tools");
}
```

---

## 4. 使用示例

### 4.1 注册资源重载监听器

```java
public class MyDataListener implements SimpleResourceReloadListener<MyData> {
    @Override
    public Identifier getFabricId() {
        return Identifier.of("mymod", "my_data");
    }

    @Override
    public CompletableFuture<MyData> load(ResourceManager manager,
            Profiler profiler, Executor executor) {
        return CompletableFuture.supplyAsync(() -> {
            MyData data = new MyData();
            // 从 manager 读取资源...
            return data;
        }, executor);
    }

    @Override
    public CompletableFuture<Void> apply(MyData data,
            ResourceManager manager, Profiler profiler, Executor executor) {
        return CompletableFuture.runAsync(() -> {
            // 应用数据到游戏
        });
    }
}

// 注册
ResourceManagerHelper.get(ResourceType.SERVER_DATA)
    .registerReloadListener(new MyDataListener());
```

### 4.2 使用资源条件

```json
{
  "type": "mymod:my_recipe",
  "fabric:load_conditions": [
    {"condition": "all_mods_loaded", "values": ["required_mod"]},
    {"condition": "fabric:not", "value": {"condition": "any_mods_loaded", "values": ["incompatible_mod"]}}
  ]
}
```

### 4.3 使用约定标签

```java
// 在配方中使用约定标签
ShapedRecipeJsonBuilder.create(RecipeCategory.MISC, MY_ITEM)
    .input('#', ConventionalItemTags.INGOTS_IRON)  // 使用 #c:ingots/iron
    .pattern("###")
    .pattern("###")
    .pattern("###")
    .offerTo(lookup);
```

---

*源码位置: `fabric-resource-loader-v0/`, `fabric-resource-conditions-api-v1/`, `fabric-convention-tags-v2/`*
