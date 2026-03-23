# Fabric API 命令与屏幕系统分析

## 概述

命令与屏幕系统包含四个核心模块：
- `fabric-command-api-v2` - 命令 API
- `fabric-screen-api-v1` - 屏幕 API
- `fabric-screen-handler-api-v1` - 屏幕处理器 API
- `fabric-key-binding-api-v1` - 按键绑定 API

---

## 1. fabric-command-api-v2 模块

### 1.1 命令注册回调

```java
public interface CommandRegistrationCallback {
    Event<CommandRegistrationCallback> EVENT = ...;

    void register(
        CommandDispatcher<ServerCommandSource> dispatcher,
        CommandRegistryAccess registryAccess,
        CommandManager.RegistrationEnvironment environment
    );
}
```

### 1.2 实体选择器选项注册

```java
public final class EntitySelectorOptionRegistry {
    public static void register(
        Identifier id,
        Text description,
        EntitySelectorOptions.SelectorHandler handler,
        Predicate<EntitySelectorReader> canUse
    ) { ... }

    public static void registerNonRepeatable(
        Identifier id,
        Text description,
        EntitySelectorOptions.SelectorHandler handler
    ) { ... }
}
```

### 1.3 客户端命令

```java
public final class ClientCommandManager {
    public static @Nullable CommandDispatcher<FabricClientCommandSource> getActiveDispatcher() { ... }
    public static LiteralArgumentBuilder<FabricClientCommandSource> literal(String name) { ... }
    public static <T> RequiredArgumentBuilder<FabricClientCommandSource, T> argument(String name, ArgumentType<T> type) { ... }
}
```

---

## 2. fabric-screen-api-v1 模块

### 2.1 Screens 工具类

```java
public final class Screens {
    public static List<ClickableWidget> getButtons(Screen screen) { ... }
    public static TextRenderer getTextRenderer(Screen screen) { ... }
    public static MinecraftClient getClient(Screen screen) { ... }
}
```

### 2.2 ScreenEvents 事件系统

```java
public final class ScreenEvents {
    // 全局事件
    public static final Event<BeforeInit> BEFORE_INIT = ...;
    public static final Event<AfterInit> AFTER_INIT = ...;

    // 每个屏幕实例的事件
    public static Event<Remove> remove(Screen screen) { ... }
    public static Event<BeforeRender> beforeRender(Screen screen) { ... }
    public static Event<AfterRender> afterRender(Screen screen) { ... }
    public static Event<BeforeTick> beforeTick(Screen screen) { ... }
    public static Event<AfterTick> afterTick(Screen screen) { ... }
}
```

### 2.3 键盘/鼠标事件

```java
public final class ScreenKeyboardEvents {
    public static Event<AllowKeyPress> allowKeyPress(Screen screen) { ... }
    public static Event<BeforeKeyPress> beforeKeyPress(Screen screen) { ... }
    public static Event<AfterKeyPress> afterKeyPress(Screen screen) { ... }
}

public final class ScreenMouseEvents {
    public static Event<AllowMouseClick> allowMouseClick(Screen screen) { ... }
    public static Event<BeforeMouseClick> beforeMouseClick(Screen screen) { ... }
    public static Event<AfterMouseClick> afterMouseClick(Screen screen) { ... }
}
```

**事件触发顺序**：`AllowX` → `BeforeX` → `AfterX`

---

## 3. fabric-screen-handler-api-v1 模块

### 3.1 扩展屏幕处理器类型

```java
public class ExtendedScreenHandlerType<T extends ScreenHandler, D> extends ScreenHandlerType<T> {
    private final ExtendedFactory<T, D> factory;
    private final PacketCodec<? super RegistryByteBuf, D> packetCodec;

    public T create(int syncId, PlayerInventory inventory, D data) {
        return factory.create(syncId, inventory, data);
    }
}
```

### 3.2 扩展屏幕处理器工厂

```java
public interface ExtendedScreenHandlerFactory<D> extends NamedScreenHandlerFactory {
    D getScreenOpeningData(ServerPlayerEntity player);
}
```

---

## 4. fabric-key-binding-api-v1 模块

### 4.1 KeyBindingHelper

```java
public final class KeyBindingHelper {
    public static KeyBinding registerKeyBinding(KeyBinding keyBinding) { ... }
    public static InputUtil.Key getBoundKeyOf(KeyBinding keyBinding) { ... }
}
```

---

## 5. 使用示例

### 5.1 注册服务端命令

```java
CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
    dispatcher.register(literal("fabric_common_test_command")
        .executes(context -> {
            context.getSource().sendFeedback(Text.literal("Hello!"));
            return 1;
        }));

    // 仅专用服务器
    if (environment.dedicated) {
        dispatcher.register(literal("fabric_dedicated_test_command")
            .executes(context -> { ... }));
    }
});
```

### 5.2 屏幕事件监听

```java
ScreenEvents.AFTER_INIT.register((client, screen, width, height) -> {
    if (screen instanceof TitleScreen) {
        List<ClickableWidget> buttons = Screens.getButtons(screen);
        buttons.add(new ButtonWidget(...));

        ScreenEvents.afterRender(screen).register((_screen, drawContext, mouseX, mouseY, tickDelta) -> {
            drawContext.drawGuiTexture(ARMOR_FULL_TEXTURE, x, y, 20, 20);
        });
    }
});
```

### 5.3 按键绑定

```java
KeyBinding binding = KeyBindingHelper.registerKeyBinding(
    new KeyBinding("key.example.test1", InputUtil.Type.KEYSYM, GLFW.GLFW_KEY_P, "key.category.example")
);

ClientTickEvents.END_CLIENT_TICK.register(client -> {
    while (binding.wasPressed()) {
        client.player.sendMessage(Text.literal("Key pressed!"), false);
    }
});
```

---

*源码位置: `fabric-command-api-v2/`, `fabric-screen-api-v1/`, `fabric-screen-handler-api-v1/`, `fabric-key-binding-api-v1/`*
