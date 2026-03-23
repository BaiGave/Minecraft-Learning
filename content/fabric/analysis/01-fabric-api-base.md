# Fabric API Base 模块深度分析

## 概述

`fabric-api-base` 是 Fabric API 的核心基础模块，为所有其他 API 模块提供基础设施支持。

**模块信息**：
- 依赖：`fabricloader >= 0.15.11`
- 环境：`*`（全环境）
- 生命周期状态：`stable`

---

## 1. 事件系统（Event System）

### 1.1 核心接口设计

#### Event.java

```java
public abstract class Event<T> {
    protected volatile T invoker;

    public final T invoker() {
        return invoker;
    }

    public abstract void register(T listener);

    public static final Identifier DEFAULT_PHASE = Identifier.of("fabric", "default");

    public void register(Identifier phase, T listener) {
        register(listener);
    }

    public void addPhaseOrdering(Identifier firstPhase, Identifier secondPhase) {
    }
}
```

**设计要点**：
- **泛型类型参数 `T`**：表示监听器类型
- **volatile invoker**：使用 volatile 保证多线程可见性
- **Invoker 模式**：将多个监听器合并为一个调用者

### 1.2 事件工厂（EventFactory）

```java
public final class EventFactory {
    // 创建简单的事件
    public static <T> Event<T> createArrayBacked(Class<? super T> type,
        Function<T[], T> invokerFactory)

    // 创建带自定义空调用者的事件
    public static <T> Event<T> createArrayBacked(Class<T> type, T emptyInvoker,
        Function<T[], T> invokerFactory)

    // 创建带多阶段的事件
    public static <T> Event<T> createWithPhases(Class<? super T> type,
        Function<T[], T> invokerFactory, Identifier... defaultPhases)
}
```

### 1.3 数组后端事件实现（ArrayBackedEvent）

```java
class ArrayBackedEvent<T> extends Event<T> {
    private final Function<T[], T> invokerFactory;
    private final Object lock = new Object();
    private T[] handlers;
    private final Map<Identifier, EventPhaseData<T>> phases = new LinkedHashMap<>();

    @Override
    public void register(Identifier phaseIdentifier, T listener) {
        synchronized (lock) {
            getOrCreatePhase(phaseIdentifier, true).addListener(listener);
            rebuildInvoker(handlers.length + 1);
        }
    }
}
```

**核心特性**：
1. **线程安全**：使用 `synchronized` 保护注册逻辑
2. **延迟构建**：仅在需要时重建 invoker
3. **阶段（Phase）支持**：支持多个命名阶段和阶段排序

---

## 2. 拓扑排序实现（Toposort）

### 2.1 核心设计

Fabric 使用 **Kosaraju 算法** 实现强连通分量（SCC）检测。

```java
public class NodeSorting {
    public static <N extends SortableNode<N>> boolean sort(
            List<N> sortedNodes, String elementDescription, Comparator<N> comparator) {
        // 第一步：Kosaraju SCC 第一次遍历
        List<N> toposort = new ArrayList<>(sortedNodes.size());
        for (N node : sortedNodes) {
            forwardVisit(node, null, toposort);
        }

        // 第二步：Kosaraju SCC 第二次遍历
        Map<N, NodeScc<N>> nodeToScc = new IdentityHashMap<>();
        for (N node : toposort) {
            if (!node.visited) {
                List<N> sccNodes = new ArrayList<>();
                backwardVisit(node, sccNodes);
                // 处理循环依赖
            }
        }
    }
}
```

### 2.2 可排序节点（SortableNode）

```java
public abstract class SortableNode<N extends SortableNode<N>> {
    final List<N> subsequentNodes = new ArrayList<>();
    final List<N> previousNodes = new ArrayList<>();
    boolean visited = false;

    public static <N extends SortableNode<N>> void link(N first, N second) {
        if (first == second) {
            throw new IllegalArgumentException("Cannot link a node to itself!");
        }
        first.subsequentNodes.add(second);
        second.previousNodes.add(first);
    }
}
```

### 2.3 排序算法特点

| 特性 | 说明 |
|------|------|
| **Kosaraju 算法** | 两遍 DFS 检测强连通分量 |
| **循环处理** | 循环依赖中的节点按 comparator 排序 |
| **确定性** | 无论输入顺序如何，结果始终一致 |

---

## 3. 基础工具类

### 3.1 TriState（三态布尔）

```java
public enum TriState {
    FALSE,   // 布尔值 false
    DEFAULT, // 引用默认值
    TRUE;    // 布尔值 true

    public static TriState of(boolean bool) {
        return bool ? TRUE : FALSE;
    }

    public static TriState of(@Nullable Boolean bool) {
        return bool == null ? DEFAULT : of(bool.booleanValue());
    }
}
```

**使用场景**：
- 配置选项（启用/禁用/默认）
- 功能开关（强制开启/关闭/跟随全局设置）

### 3.2 BooleanFunction（布尔函数接口）

```java
@FunctionalInterface
public interface BooleanFunction<R> {
    R apply(boolean value);
}
```

---

## 4. 自动调用事件机制（AutoInvokingEvent）

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.FIELD, ElementType.METHOD })
public @interface AutoInvokingEvent {
}
```

**设计理念**：如果消费者实现了回调接口，自动调用而无需手动注册。

---

## 5. 设计模式分析

| 模式 | 应用 |
|------|------|
| 工厂模式 | `EventFactory` |
| 策略模式 | `invokerFactory` 参数化 |
| 模板方法模式 | `Event` 骨架方法 |
| 依赖注入 | `SortableNode.link()` |
| 弱引用缓存 | `EventFactoryImpl` 使用 `MapMaker().weakKeys()` |

---

## 6. 使用示例

### 6.1 基础事件创建

```java
@FunctionalInterface
public interface PlayerJumpCallback {
    void onPlayerJump(PlayerEntity player);
}

public static final Event<PlayerJumpCallback> PLAYER_JUMP =
    EventFactory.createArrayBacked(
        PlayerJumpCallback.class,
        callbacks -> (player) -> {
            for (PlayerJumpCallback callback : callbacks) {
                callback.onPlayerJump(player);
            }
        }
    );

PLAYER_JUMP.register((player) -> {
    player.world.sendEntityStatus(player, (byte) 1);
});
```

### 6.2 带阶段的事件

```java
public static final Identifier EARLY_PHASE = Identifier.of("modid", "early");
public static final Identifier LATE_PHASE = Identifier.of("modid", "late");

public static final Event<InitCallback> INIT =
    EventFactory.createWithPhases(
        InitCallback.class,
        callbacks -> () -> { for (InitCallback c : callbacks) c.onInit(); },
        EARLY_PHASE, Event.DEFAULT_PHASE, LATE_PHASE
    );

INIT.register(EARLY_PHASE, () -> System.out.println("Early!"));
```

### 6.3 TriState 使用

```java
TriState enabled = config.getEnableStatus();

boolean actualEnabled = enabled.orElse(true);  // 提供默认值

Optional<String> result = triState.map(enabled -> enabled ? "ON" : "OFF");
```

---

## 7. 性能优化

### 7.1 单监听器优化

```java
public static <T> Event<T> createArrayBacked(Class<T> type, T emptyInvoker,
        Function<T[], T> invokerFactory) {
    return createArrayBacked(type, listeners -> {
        if (listeners.length == 0) return emptyInvoker;
        else if (listeners.length == 1) return listeners[0];  // 单监听器直接返回
        else return invokerFactory.apply(listeners);
    });
}
```

### 7.2 volatile 读优化

`invoker` 字段使用 volatile，确保读操作比同步块更轻量。

---

## 8. 总结

`fabric-api-base` 模块展现了以下设计智慧：

| 方面 | 实现 |
|------|------|
| **类型安全** | 泛型确保编译时类型检查 |
| **线程安全** | synchronized + volatile |
| **确定性** | 拓扑排序保证执行顺序 |
| **灵活性** | 阶段机制支持优先级 |
| **性能** | 单监听器优化、延迟构建 |
| **可扩展性** | 函数式工厂、策略模式 |

---

*源码位置: `fabric-api-base/src/main/java/net/fabricmc/fabric/`*
