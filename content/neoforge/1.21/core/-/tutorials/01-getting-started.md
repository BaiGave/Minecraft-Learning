# NeoForge 入门指南

## 什么是 NeoForge？

NeoForge 是 Forge 的社区分支 fork，旨在提供更快的更新速度和更现代化的代码架构。

## 环境搭建

### 前置要求

- JDK 17+
- Gradle 8.x
- Minecraft 1.20.4+

### 创建项目

```bash
neoforge setup
gradlew build
```

## mod 注解

```java
@Mod(NeoForgeMod.MOD_ID)
public class NeoForgeMod {
    public static final String MOD_ID = "neoforge-mod";

    public NeoForgeMod(FMLJavaModLoadingContext context) {
        context.registerConfig(ModConfig.Type.COMMON, ConfigSpec.builder().build());
        LOGGER.info("NeoForge mod loaded!");
    }
}
```

## 事件总线

NeoForge 使用强类型事件总线：

```java
@SubscribeEvent
public void onPlayerTick(PlayerTickEvent event) {
    if (event.phase == TickEvent.Phase.END) {
        // 处理玩家tick
    }
}
```

## 下一步

- [NeoForge 事件系统](tutorials/02-event-system.html)
- [创建自定义方块](tutorials/03-custom-block.html)
