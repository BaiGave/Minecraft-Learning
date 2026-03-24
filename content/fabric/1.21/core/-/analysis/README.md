# Fabric API 深度分析总览

> 本文档是对 Fabric API 0.116.9-1.21.1 版本的全面系统分析

## 目录

### 核心模块
- [01-fabric-api-base.md](01-fabric-api-base.md) - 核心基础模块（事件系统、拓扑排序、工具类）
- [02-block-system.md](02-block-system.md) - 方块系统（方块API、方块视图、渲染层）
- [03-item-recipe-system.md](03-item-recipe-system.md) - 物品与配方系统（物品API、物品栏、配方扩展）
- [04-biome-dimension-system.md](04-biome-dimension-system.md) - 生物群系与维度系统
- [05-entity-event-system.md](05-entity-event-system.md) - 实体与事件系统
- [06-rendering-system.md](06-rendering-system.md) - 渲染系统（渲染器API、粒子、流体渲染）
- [07-networking-system.md](07-networking-system.md) - 网络系统
- [08-resource-system.md](08-resource-system.md) - 资源加载系统
- [09-transfer-system.md](09-transfer-system.md) - 传输/存储系统（流体、物品存储）
- [10-command-screen-system.md](10-command-screen-system.md) - 命令与屏幕系统
- [11-other-subsystems.md](11-other-subsystems.md) - 其他子系统

## 模块架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Fabric API                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  核心层                                                                 │
│  ├── fabric-api-base          事件系统、拓扑排序、工具类                    │
│  ├── fabric-convention-tags-v2  约定标签系统                             │
│  └── fabric-api-lookup-api-v1  跨模组API查找                            │
├─────────────────────────────────────────────────────────────────────────┤
│  世界生成层                                                              │
│  ├── fabric-biome-api-v1      生物群系添加/修改                          │
│  └── fabric-dimensions-v1      维度数据处理                              │
├─────────────────────────────────────────────────────────────────────────┤
│  实体/物品层                                                            │
│  ├── fabric-entity-events-v1   实体事件                                 │
│  ├── fabric-item-api-v1        物品扩展                                 │
│  ├── fabric-item-group-api-v1   物品栏系统                              │
│  ├── fabric-recipe-api-v1      配方API                                 │
│  └── fabric-object-builder-api-v1 对象构建器                            │
├─────────────────────────────────────────────────────────────────────────┤
│  渲染层                                                                 │
│  ├── fabric-renderer-api-v1    渲染器API                               │
│  ├── fabric-renderer-indigo    默认Indigo渲染器                          │
│  ├── fabric-rendering-v1       渲染事件                                 │
│  ├── fabric-rendering-fluids-v1 流体渲染                               │
│  ├── fabric-particles-v1       粒子系统                                │
│  └── fabric-client-tags-api-v1  客户端标签                             │
├─────────────────────────────────────────────────────────────────────────┤
│  交互层                                                                 │
│  ├── fabric-events-interaction-v0 交互事件                              │
│  ├── fabric-command-api-v2     命令API                                 │
│  ├── fabric-screen-api-v1       屏幕API                                │
│  ├── fabric-screen-handler-api-v1 屏幕处理器                           │
│  └── fabric-key-binding-api-v1  按键绑定                               │
├─────────────────────────────────────────────────────────────────────────┤
│  网络层                                                                 │
│  ├── fabric-networking-api-v1  通用网络API                             │
│  └── fabric-message-api-v1     消息API                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  数据层                                                                 │
│  ├── fabric-transfer-api-v1    流体/物品传输                            │
│  ├── fabric-data-attachment-api-v1 数据附件                           │
│  ├── fabric-loot-api-v3        战利品表                                │
│  └── fabric-registry-sync-v0   注册表同步                              │
├─────────────────────────────────────────────────────────────────────────┤
│  资源层                                                                 │
│  ├── fabric-resource-loader-v0 资源加载                                │
│  └── fabric-resource-conditions-api-v1 资源条件                        │
├─────────────────────────────────────────────────────────────────────────┤
│  其他模块                                                               │
│  ├── fabric-gametest-api-v1    游戏测试                                 │
│  ├── fabric-sound-api-v1       声音API                                 │
│  └── fabric-transitive-access-wideners-v1 访问扩展                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## 核心技术分析

### 1. Mixin 注入机制

Fabric API 大量使用 Mixin 框架实现无侵入式修改：

| 注入类型 | 说明 | 示例 |
|----------|------|------|
| 接口注入 | 为目标类添加接口实现 | `BlockMixin implements FabricBlock` |
| 方法注入 | 在指定位置插入代码 | `@Inject(at = @At("HEAD"))` |
| 方法重定向 | 替换方法调用 | `@Redirect` |
| 方法包装 | 包裹原有方法调用 | `@WrapOperation` |
| 字段注入 | 添加新字段 | `@Unique` |

### 2. 事件系统

所有事件使用统一的工厂模式创建：

```java
Event<T> EVENT = EventFactory.createArrayBacked(
    T.class,
    callbacks -> (param1, param2) -> {
        for (T callback : callbacks) {
            callback.method(param1, param2);
        }
    }
);
```

### 3. API Lookup 模式

使用查找器实现跨模组解耦通信：

```java
BlockApiLookup<FluidContainer, Direction> FLUID_CONTAINER = 
    BlockApiLookup.get(Identifier.of("mymod", "fluid_container"), ...);

// 注册提供者
FLUID_CONTAINER.registerSelf(TANK_BLOCK_ENTITY_TYPE);

// 查询
FluidContainer container = FLUID_CONTAINER.find(world, pos, direction);
```

### 4. 事务管理

Transfer API 使用快照机制确保原子性：

```java
try (Transaction tx = Transaction.openOuter()) {
    storage.insert(resource, amount, tx);
    tx.commit();  // 提交
}  // 未提交则自动回滚
```

## 设计模式总结

| 模式 | 应用场景 |
|------|----------|
| 工厂模式 | `EventFactory.createArrayBacked()` |
| 建造者模式 | `FabricItemGroup.builder()` |
| 观察者模式 | 所有事件系统 |
| 策略模式 | `invokerFactory` 参数化 |
| 适配器模式 | `InventoryStorage` 包装原版库存 |
| 注册表模式 | `BlockApiLookup` 全局注册表 |
| 快照模式 | `SnapshotParticipant` 事务支持 |

## 文档维护

- **源版本**: Fabric API 0.116.9-1.21.1
- **分析日期**: 2026-03-23
- **源码位置**: `assets/fabric-api-0.116.9-1.21.1/`
