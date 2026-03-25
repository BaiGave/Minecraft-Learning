---
title: 第 44 章：自定义命令实战（Custom Command Practice）
readingTime: 35
---

# 第 44 章：自定义命令实战（Custom Command Practice）

## 章节目标

- 学会创建自定义命令的完整流程
- 掌握自定义参数类型的创建方法
- 理解命令权限系统的实现
- 能够编写实际可用的命令

## 前置知识

- 完成《Brigadier 基础》章节
- 熟悉 Java 类的创建
- 了解 Minecraft 模组开发基础

## 目录

- [命令创建基础](#命令创建基础)
- [实战1：创建 /heal 命令](#实战1创建-heal-命令)
- [实战2：创建带参数的命令](#实战2创建带参数的命令)
- [实战3：创建自定义参数类型](#实战3创建自定义参数类型)
- [实战4：创建复杂命令](#实战4创建复杂命令)
- [命令权限管理](#命令权限管理)
- [调试技巧](#调试技巧)
- [课后自查](#课后自查)

---

## 命令创建基础

### 命令结构回顾

```
┌─────────────────────────────────────────────────────────────┐
│                    命令创建的三个步骤                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ 定义命令                                               │
│     ┌─────────────────────────────────────────────────┐    │
│     │ LiteralArgumentBuilder.literal("mycommand")     │    │
│     │     .then(...)                                  │    │
│     │     .executes(context -> { ... });              │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  2️⃣ 注册命令                                               │
│     ┌─────────────────────────────────────────────────┐    │
│     │ dispatcher.register(command);                  │    │
│     │ // 在命令注册阶段调用                            │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  3️⃣ 执行逻辑                                               │
│     ┌─────────────────────────────────────────────────┐    │
│     │ public int execute(CommandContext<S> context) {│    │
│     │     // 命令执行时的逻辑                          │    │
│     │     return 1;  // 返回成功                       │    │
│     │ }                                              │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CommandContext 上下文

```java
// CommandContext 是命令执行时的"瑞士军刀"
public class CommandContext<S> {
    
    // 获取命令来源（执行者）
    public S getSource() {
        return this.source;
    }
    
    // 获取参数值
    public <T> T getArgument(String name, Class<T> clazz) {
        return (T) this.arguments.getArgument(name, clazz);
    }
    
    // 获取子节点（用于子命令）
    public CommandContext<S> getChild() {
        return this.child;
    }
    
    // 检查某个参数是否存在
    public boolean hasArgument(String name) {
        return this.arguments.contains(name);
    }
}
```

---

## 实战1：创建 /heal 命令

### 需求分析

```
┌─────────────────────────────────────────────────────────────┐
│  /heal 命令                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  功能：恢复玩家的生命值                                      │
│                                                             │
│  语法：                                                    │
│  • /heal              - 恢复满血                            │
│  • /heal <player>     - 恢复指定玩家的生命                   │
│  • /heal <amount>     - 恢复指定数量的生命                   │
│  • /heal <player> <amount> - 恢复指定玩家指定生命            │
│                                                             │
│  权限：需要 2 级权限                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 完整代码

```java
// D:\Minecraft-Learning\assets\example-mod\src\main\java\com\example\command\HealCommand.java

public class HealCommand {
    
    // 最大生命值常量
    private static final float MAX_HEALTH = 20.0f;
    
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        
        dispatcher.register(
            LiteralArgumentBuilder.<ServerCommandSource>literal("heal")
                // 设置权限等级
                .requires(source -> source.hasPermission(2))
                // 帮助信息描述
                .executes(context -> executeHeal(context))
                // /heal <player>
                .then(
                    Argument.<ServerCommandSource>argument(
                        "target", 
                        EntityArgumentType.player()  // 单个玩家
                    )
                    .executes(context -> executeHealTarget(context))
                )
        );
    }
    
    // /heal - 治疗命令执行者自己
    private static int executeHeal(CommandContext<ServerCommandSource> context) {
        // 获取命令来源（命令执行者）
        ServerCommandSource source = context.getSource();
        ServerPlayerEntity player = source.getPlayer();
        
        if (player == null) {
            // 如果执行者不是玩家（如命令方块），发送错误
            source.sendError(Text.literal("该命令只能由玩家执行"));
            return 0;
        }
        
        // 恢复满血
        healPlayer(player, MAX_HEALTH);
        
        // 发送成功消息
        player.sendMessage(
            Text.literal("已恢复满生命值"), 
            false  // 不作为系统消息
        );
        
        return 1;  // 返回成功状态码
    }
    
    // /heal <player> - 治疗指定玩家
    private static int executeHealTarget(CommandContext<ServerCommandSource> context) {
        // 获取参数
        ServerPlayerEntity target = context.getArgument("target", ServerPlayerEntity.class);
        
        // 恢复满血
        healPlayer(target, MAX_HEALTH);
        
        // 获取执行者
        ServerCommandSource source = context.getSource();
        
        // 发送消息给执行者
        source.sendMessage(
            Text.literal("已恢复 " + target.getName().getString() + " 的生命值")
        );
        
        // 发送消息给目标玩家
        target.sendMessage(
            Text.literal("你的生命值已恢复"), 
            false
        );
        
        return 1;
    }
    
    // 治疗玩家
    private static void healPlayer(ServerPlayerEntity player, float amount) {
        player.setHealth(amount);
        
        // 播放治疗音效
        player.playSound(
            SoundEvents.ENTITY_PLAYER_BURP,  // 用嗝声作为治疗音效
            1.0f, 
            1.0f
        );
        
        // 给予治疗粒子效果
        player.world.sendEntityStatus(player, (byte)9);  // 爱心粒子
    }
}
```

---

## 实战2：创建带参数的命令

### 需求：创建 /spawn 命令

```
┌─────────────────────────────────────────────────────────────┐
│  /spawn 命令                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  功能：在指定位置生成实体                                     │
│                                                             │
│  语法：                                                    │
│  • /spawn <entity_type>              - 在执行者位置生成      │
│  • /spawn <entity_type> <x> <y> <z>  - 在指定坐标生成       │
│  • /spawn <entity_type> @<selector>    - 在目标位置生成     │
│                                                             │
│  示例：                                                    │
│  • /spawn minecraft:cow                                    │
│  • /spawn minecraft:wolf ~ ~ ~                            │
│  • /spawn minecraft:zombie 100 64 -200                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 完整代码

```java
public class SpawnCommand {
    
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        
        dispatcher.register(
            LiteralArgumentBuilder.<ServerCommandSource>literal("spawn")
                .requires(source -> source.hasPermission(2))
                // 主参数：实体类型
                .then(
                    Argument.<ServerCommandSource>argument(
                        "entity", 
                        RegistryEntryArgumentType.registryEntry(
                            Registries.ENTITY_TYPE
                        )
                    )
                    .executes(context -> executeSpawn(context))
                    // 可选：位置参数
                    .then(
                        Argument.<ServerCommandSource>argument(
                            "pos", 
                            Vec3ArgumentType.vec3()
                        )
                        .executes(context -> executeSpawnAt(context))
                    )
                )
        );
    }
    
    // /spawn <entity> - 在执行者位置生成
    private static int executeSpawn(CommandContext<ServerCommandSource> context) {
        ServerCommandSource source = context.getSource();
        
        // 获取实体类型参数
        EntityType<?> entityType = context.getArgument(
            "entity", 
            RegistryEntry.Reference.class
        ).value();
        
        // 在执行者位置生成
        return spawnEntity(
            context, 
            entityType, 
            source.getPosition()
        );
    }
    
    // /spawn <entity> <pos> - 在指定位置生成
    private static int executeSpawnAt(CommandContext<ServerCommandSource> context) {
        // 获取位置参数（支持 ~ 和 ^）
        Vec3d pos = context.getArgument("pos", PosArgument.class)
            .toAbsolutePos(context.getSource());
        
        // 获取实体类型
        EntityType<?> entityType = context.getArgument(
            "entity", 
            RegistryEntry.Reference.class
        ).value();
        
        return spawnEntity(context, entityType, pos);
    }
    
    // 通用生成逻辑
    private static int spawnEntity(
            CommandContext<ServerCommandSource> context,
            EntityType<?> entityType,
            Vec3d pos
    ) {
        ServerCommandSource source = context.getSource();
        ServerWorld world = source.getWorld();
        
        try {
            // 创建实体
            Entity entity = entityType.create(world);
            
            if (entity == null) {
                source.sendError(Text.literal("无法创建该类型的实体"));
                return 0;
            }
            
            // 设置位置
            entity.setPosition(pos.x, pos.y, pos.z);
            
            // 生成实体到世界
            world.spawnEntity(entity);
            
            // 发送成功消息
            source.sendMessage(
                Text.literal("已在 " + 
                    (int)pos.x + ", " + 
                    (int)pos.y + ", " + 
                    (int)pos.z + 
                    " 生成 " + entityType.getId().toString()
                )
            );
            
            // 生成粒子效果
            world.spawnParticles(
                ParticleTypes.SMOKE,
                pos.x, pos.y + 1, pos.z,
                10,  // 粒子数量
                0.5, 0.5, 0.5,  // 扩散范围
                0.01  // 速度
            );
            
            return 1;
            
        } catch (Exception e) {
            source.sendError(Text.literal("生成实体时出错: " + e.getMessage()));
            return 0;
        }
    }
}
```

---

## 实战3：创建自定义参数类型

### 需求：创建一个 "颜色" 参数类型

```
┌─────────────────────────────────────────────────────────────┐
│  自定义颜色参数                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  需求：                                                    │
│  • 输入: red, blue, green, yellow, purple 等               │
│  • 返回: 对应的 Color 对象                                   │
│  • 建议: 提供可用的颜色列表供选择                             │
│                                                             │
│  用途：                                                    │
│  • /setcolor <color>                                       │
│  • /particle <type> <color>                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 完整代码

```java
// 自定义颜色参数类型
public class ColorArgumentType implements ArgumentType<Color> {
    
    // 预定义的可用颜色
    private static final Collection<String> EXAMPLES = Arrays.asList(
        "red", "blue", "green", "yellow", "purple",
        "orange", "pink", "cyan", "magenta", "white",
        "black", "gray", "brown"
    );
    
    @Override
    public Color parse(StringReader reader) throws CommandSyntaxException {
        // 读取颜色名称
        String colorName = reader.readUnquotedString().toLowerCase();
        
        // 转换为 Color 对象
        Color color = getColorFromName(colorName);
        
        if (color == null) {
            // 抛出解析错误
            throw CommandSyntaxException.BUILT_IN_EXCEPTIONS
                .readerExpectedValue()
                .createWithContext(reader, 
                    "有效的颜色: red, blue, green, yellow, purple");
        }
        
        return color;
    }
    
    @Override
    public <S> CompletableFuture<Suggestions> listSuggestions(
            CommandContext<S> context,
            SuggestionsBuilder builder
    ) {
        // 获取已输入的部分
        String remaining = builder.getRemaining().toLowerCase();
        
        // 过滤匹配的颜色
        for (String color : EXAMPLES) {
            if (color.startsWith(remaining)) {
                builder.suggest(color);
            }
        }
        
        return builder.buildFuture();
    }
    
    @Override
    public Collection<String> getExamples() {
        return EXAMPLES;
    }
    
    // 颜色名称到 Color 的映射
    private static Color getColorFromName(String name) {
        return switch (name) {
            case "red" -> new Color(255, 0, 0);
            case "blue" -> new Color(0, 0, 255);
            case "green" -> new Color(0, 255, 0);
            case "yellow" -> new Color(255, 255, 0);
            case "purple" -> new Color(128, 0, 128);
            case "orange" -> new Color(255, 165, 0);
            case "pink" -> new Color(255, 192, 203);
            case "cyan" -> new Color(0, 255, 255);
            case "magenta" -> new Color(255, 0, 255);
            case "white" -> new Color(255, 255, 255);
            case "black" -> new Color(0, 0, 0);
            case "gray", "grey" -> new Color(128, 128, 128);
            case "brown" -> new Color(139, 69, 19);
            default -> null;
        };
    }
    
    // 工厂方法
    public static ColorArgumentType color() {
        return new ColorArgumentType();
    }
    
    // 从上下文获取颜色值
    public static Color getColor(
            CommandContext<ServerCommandSource> context,
            String name
    ) {
        return context.getArgument(name, Color.class);
    }
}
```

### 使用自定义参数

```java
public class SetColorCommand {
    
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        
        dispatcher.register(
            LiteralArgumentBuilder.<ServerCommandSource>literal("setcolor")
                .requires(source -> source.hasPermission(2))
                .then(
                    Argument.<ServerCommandSource>argument(
                        "color", 
                        new ColorArgumentType()  // 使用自定义参数
                    )
                    .executes(context -> executeSetColor(context))
                )
        );
    }
    
    private static int executeSetColor(CommandContext<ServerCommandSource> context) {
        // 获取自定义参数
        Color color = ColorArgumentType.getColor(context, "color");
        
        ServerCommandSource source = context.getSource();
        ServerPlayerEntity player = source.getPlayer();
        
        // 使用颜色值
        player.sendMessage(
            Text.literal("你选择了颜色: RGB(" + 
                color.getRed() + ", " + 
                color.getGreen() + ", " + 
                color.getBlue() + ")")
        );
        
        return 1;
    }
}
```

---

## 实战4：创建复杂命令

### 需求：创建 /timewarp 命令（时间操控）

```
┌─────────────────────────────────────────────────────────────┐
│  /timewarp 命令                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  功能：操控世界时间                                          │
│                                                             │
│  语法：                                                    │
│  • /timewarp <time>           - 设置时间                    │
│  • /timewarp <time> <target>  - 设置指定世界的时间          │
│  • /timewarp day             - 快进到白天                   │
│  • /timewarp night           - 快进到夜晚                   │
│  • /timewarp sunrise         - 快进到日出                   │
│  • /timewarp sunset          - 快进到日落                   │
│                                                             │
│  参数：                                                    │
│  • time: 0-24000 (Minecraft 时间)                          │
│  • target: overworld, nether, end                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 完整代码

```java
public class TimeWarpCommand {
    
    // Minecraft 时间常量
    private static final long FULL_DAY = 24000L;
    private static final long MIDDAY = 6000L;
    private static final long MIDNIGHT = 18000L;
    private static final long SUNRISE = 23000L;
    private static final long SUNSET = 12000L;
    
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        
        dispatcher.register(
            LiteralArgumentBuilder.<ServerCommandSource>literal("timewarp")
                .requires(source -> source.hasPermission(2))
                .executes(TimeWarpCommand::executeUsage)
                // 时间预设
                .then(
                    LiteralArgumentBuilder.literal("day")
                        .executes(TimeWarpCommand::executeDay)
                )
                .then(
                    LiteralArgumentBuilder.literal("night")
                        .executes(TimeWarpCommand::executeNight)
                )
                .then(
                    LiteralArgumentBuilder.literal("sunrise")
                        .executes(TimeWarpCommand::executeSunrise)
                )
                .then(
                    LiteralArgumentBuilder.literal("sunset")
                        .executes(TimeWarpCommand::executeSunset)
                )
                // 数值时间
                .then(
                    Argument.<ServerCommandSource>argument(
                        "time", 
                        LongArgumentType.longArg(0, FULL_DAY)
                    )
                    .executes(TimeWarpCommand::executeSetTime)
                    .then(
                        Argument.<ServerCommandSource>argument(
                            "world", 
                            DimensionArgumentType.dimension()
                        )
                        .executes(TimeWarpCommand::executeSetTimeWorld)
                    )
                )
        );
    }
    
    // 通用时间设置逻辑
    private static int setTime(CommandContext<ServerCommandSource> context, long time) {
        ServerCommandSource source = context.getSource();
        ServerWorld world = source.getWorld();
        
        // 设置世界时间
        world.setTimeOfDay(time);
        
        // 格式化时间显示
        String timeStr = formatTime(time);
        
        source.sendMessage(
            Text.literal("世界时间已设置为: " + timeStr + " (" + time + ")")
        );
        
        return 1;
    }
    
    private static int setTimeWorld(CommandContext<ServerCommandSource> context, long time) {
        ServerCommandSource source = context.getSource();
        ServerWorld targetWorld = context.getArgument("world", ServerWorld.class);
        
        targetWorld.setTimeOfDay(time);
        
        source.sendMessage(
            Text.literal("世界 " + targetWorld.getRegistryKey().getValue() + 
                " 的时间已设置为: " + formatTime(time))
        );
        
        return 1;
    }
    
    // 执行方法
    private static int executeUsage(CommandContext<ServerCommandSource> context) {
        context.getSource().sendMessage(
            Text.literal("用法: /timewarp <day|night|sunrise|sunset|<0-24000>> [world]")
        );
        return 0;
    }
    
    private static int executeDay(CommandContext<ServerCommandSource> context) {
        return setTime(context, MIDDAY);
    }
    
    private static int executeNight(CommandContext<ServerCommandSource> context) {
        return setTime(context, MIDNIGHT);
    }
    
    private static int executeSunrise(CommandContext<ServerCommandSource> context) {
        return setTime(context, SUNRISE);
    }
    
    private static int executeSunset(CommandContext<ServerCommandSource> context) {
        return setTime(context, SUNSET);
    }
    
    private static int executeSetTime(CommandContext<ServerCommandSource> context) {
        long time = context.getArgument("time", Long.class);
        return setTime(context, time);
    }
    
    private static int executeSetTimeWorld(CommandContext<ServerCommandSource> context) {
        long time = context.getArgument("time", Long.class);
        return setTimeWorld(context, time);
    }
    
    // 时间格式化
    private static String formatTime(long timeOfDay) {
        long hours = (timeOfDay % FULL_DAY) / 1000;
        long minutes = ((timeOfDay % 1000) * 60) / 1000;
        return String.format("%02d:%02d", hours, minutes);
    }
}
```

---

## 命令权限管理

### 权限等级

```java
// Minecraft 默认权限等级
public static final int PERMISSION_LEVEL_OPERATORS = 3;  // OP 等级
public static final int PERMISSION_LEVEL_BROADCAST = 2;  // 可以执行但广播
public static final int PERMISSION_LEVEL_GAMEMODES = 2;  // 允许使用游戏模式命令
public static final int PERMISSION_LEVEL_MOVEMENT = 0;   // 允许移动相关命令
public static final int PERMISSION_LEVEL_OTHER = 2;      // 其他命令

// 检查权限
.requires(source -> source.hasPermission(2))

// 或者使用更细粒度的检查
.requires(source -> {
    if (source.hasPermissionLevel(4)) {
        return true;  // OP 4 级及以上
    }
    // 检查特定权限
    return source.getServer().getPermissionLevel(source.getEntity()) >= 2;
})
```

### 命令方块支持

```java
// 默认情况下，命令方块没有权限执行命令
// 需要在命令方块设置中启用

// 检查是否是命令方块执行
.requires(source -> {
    if (source.getEntity() instanceof ServerCommandBlockEntity) {
        // 命令方块需要额外检查
        return ((ServerCommandBlockEntity)source.getEntity()).isAllowed();
    }
    return true;
})
```

---

## 调试技巧

### 1. 命令解析调试

```java
// 在命令执行前打印上下文信息
private static int debugCommand(CommandContext<ServerCommandSource> context) {
    ServerCommandSource source = context.getSource();
    
    // 打印所有参数
    System.out.println("=== Command Debug ===");
    System.out.println("Source: " + source);
    System.out.println("World: " + source.getWorld().getRegistryKey());
    System.out.println("Position: " + source.getPosition());
    
    // 遍历所有参数
    for (String key : context.getArguments().keySet()) {
        System.out.println("Arg[" + key + "]: " + context.getArgument(key, Object.class));
    }
    System.out.println("====================");
    
    return 1;
}
```

### 2. 常见错误处理

```java
// 玩家未找到
EntityArgumentType.getPlayer(context, "player")
// 可能抛出: DISCONNECTED_EXCEPTION

// 实体未找到
EntityArgumentType.getEntity(context, "entity")
// 可能抛出: TOO_MANY_ENTITIES_EXCEPTION

// 处理这些异常
try {
    ServerPlayerEntity player = EntityArgumentType.getPlayer(context, "player");
    // ...
} catch (CommandSyntaxException e) {
    context.getSource().sendError(
        Text.literal("错误: " + e.getMessage())
    );
    return 0;
}
```

### 3. 命令日志

```
┌─────────────────────────────────────────────────────────────┐
│  命令执行日志                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  服务端控制台会自动记录所有命令执行                          │
│                                                             │
│  [Server thread/INFO]: <Steve> /heal                       │
│  → 执行者 Steve 运行了 /heal 命令                           │
│                                                             │
│  [Server thread/INFO]: Executed command: /heal              │
│  → 命令执行完成                                            │
│                                                             │
│  如果命令失败:                                              │
│  [Server thread/WARN]: Command failed: /heal                │
│  → 命令执行失败                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| CommandDispatcher | CommandDispatcher | 命令调度器，管理所有命令 |
| CommandContext | CommandContext | 命令执行时的上下文 |
| CommandSource | CommandSource | 命令的来源（玩家/命令方块/控制台） |
| ArgumentType | ArgumentType | 参数解析器接口 |
| LiteralArgumentBuilder | LiteralArgumentBuilder | 字面量命令构建器 |

---

## 课后自查

- [ ] 创建一个 `/fly` 命令，允许玩家切换飞行模式
- [ ] 创建一个 `/tpall` 命令，将所有玩家传送到执行者位置
- [ ] 创建一个自定义参数类型 `MoneyArgument`，支持 "100g", "50k" 等格式
- [ ] 修改 `/heal` 命令，添加恢复饱食度的功能
- [ ] 理解命令返回值的含义（0 vs 1 vs 2+）

---

## 下章预告

恭喜你完成了 Part-7 命令系统的学习！接下来你可以继续探索其他高级主题，或者开始自己的模组开发实践。

---

## 参考资料

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\command\argument\`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\server\command\`
- [Brigadier GitHub](https://github.com/Mojang/brigadier)
- [Minecraft Wiki: Commands](https://minecraft.wiki/w/Commands)
