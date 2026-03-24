# NeoForge 事件系统

## 事件概述

NeoForge 使用强类型事件系统替代 Forge 的反射机制，性能更优。

## 事件层级

```
Event
├── PlayerEvent
│   ├── PlayerLoggedInEvent
│   ├── PlayerRespawnEvent
│   └── PlayerTickEvent
├── BlockEvent
│   ├── BlockPlaceEvent
│   └── BlockBreakEvent
├── EntityEvent
│   ├── EntityJoinLevelEvent
│   └── LivingDeathEvent
└── LifecycleEvent
    ├── PlayerSetupEvent
    └── RegistryEvent
```

## 注册事件

### 方法一：@SubscribeEvent（仍支持）

```java
@Mod.EventBusSubscriber(modid = MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public static class ForgeEvents {
    @SubscribeEvent
    public static void onPlayerTick(PlayerTickEvent event) {
        // 处理逻辑
    }
}
```

### 方法二：IModEventBus（推荐）

```java
public NeoForgeMod(FMLJavaModLoadingContext context) {
    IModEventBus bus = context.getModEventBus();
    bus.addListener(this::setup);
    bus.addListener(this::clientSetup);
}
```

## 事件优先级

```java
@SubscribeEvent(priority = EventPriority.HIGH)  // 先执行
public void highPriority(Event event) { }

@SubscribeEvent(priority = EventPriority.LOW)   // 后执行
public void lowPriority(Event event) { }
```

## 取消事件

```java
@SubscribeEvent
public void onBlockPlace(BlockPlaceEvent event) {
    if (someCondition) {
        event.setCanceled(true);
    }
}
```
