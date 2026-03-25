---
title: 第 47 章：数据包入门（Datapack Introduction）
readingTime: 30
---

# 第 47 章：数据包入门（Datapack Introduction）

## 章节目标

- 理解数据包的概念与作用
- 掌握数据包的目录结构
- 学会创建自定义函数
- 了解数据包的文件格式

## 前置知识

- 资源包基础概念
- JSON 格式基础
- 命令基础（如 `/function`、`/advancement`）

## 核心概念

### 什么是数据包？

**数据包（Datapack）** 是 Minecraft 1.13+ 引入的数据驱动系统，用于自定义游戏逻辑。你可以把它想象成**游戏的"数据配置表"**——就像一个餐厅的菜单，列出了所有可用的"菜品"（游戏规则、配方、进度等）。

数据包可以自定义的内容包括：
- ⚙️ 游戏规则（gamerule）
- 📜 进度/成就（advancement）
- 🗺️ 战利品表（loot_table）
- 🍳 配方（recipe）
- ⚔️ 函数（function）
- 📍 结构（structure）
- 🌍 标签（tag）

### 数据包 vs 资源包

| 特性 | 数据包 | 资源包 |
|------|--------|--------|
| **作用对象** | 服务端/游戏逻辑 | 客户端/外观 |
| **影响范围** | 规则、配方、进度等 | 纹理、音效、模型等 |
| **存放位置** | 世界目录的 `datapacks/` | `.minecraft/resourcepacks/` |
| **是否需要服务器** | 单人游戏也需要 | 仅客户端需要 |

## 数据包文件结构

```
📁 my-datapack/
├── 📄 pack.mcmeta          # 数据包元数据
│
├── 📁 data/
│   ├── 📁 minecraft/      # 原版命名空间
│   │   ├── 📁 advancements/    # 进度
│   │   │   └── custom_advancement.json
│   │   ├── 📁 functions/        # 函数
│   │   │   ├── tick.mcfunction
│   │   │   └── hello.mcfunction
│   │   ├── 📁 loot_tables/      # 战利品表
│   │   │   └── blocks/
│   │   │       └── custom_block.json
│   │   ├── 📁 recipes/          # 配方
│   │   │   └── custom_item.json
│   │   └── 📁 tags/
│   │       └── blocks/
│   │           └── my_tag.json
│   │
│   └── 📁 mymod/          # 自定义命名空间
│       ├── 📁 functions/
│       ├── 📁 advancements/
│       └── 📁 recipes/
```

## pack.mcmeta 文件格式

```json
{
    "pack": {
        "pack_format": 34,
        "description": "我的数据包 v1.0"
    },
    "supported_formats": {
        "min": 26,
        "max": 34
    }
}
```

### Pack Format 版本对照

| Minecraft 版本 | Pack Format |
|----------------|-------------|
| 1.21 | 34 |
| 1.20.4 | 26 |
| 1.19 - 1.20.3 | 24 |
| 1.18 - 1.18.2 | 22 |
| 1.17 | 20 |
| 1.16 - 1.16.5 | 16 |
| 1.15 - 1.15.2 | 9 |
| 1.14 - 1.14.4 | 6 |
| 1.13 - 1.13.2 | 4 |

## 加载与管理命令

```mcfunction
# 列出当前世界的数据包
/datapack list

# 启用数据包
/datapack enable "file/my-datapack"

# 禁用数据包
/datapack disable "file/my-datapack"

# 重新加载数据包（服务端命令）
/reload
```

## 函数系统详解

### 什么是函数？

**函数（Function）** 是一系列命令的集合，类似编程语言中的函数或脚本。

```mcfunction
# 文件：data/mymod/functions/hello.mcfunction

# 发送欢迎消息
tellraw @a {"text":"欢迎来到自定义世界！","color":"gold"}

# 给所有玩家发放物品
give @a diamond 1

# 设置时间
time set day
```

### 函数调用

```mcfunction
# 调用函数
function mymod:hello

# 条件执行（当玩家拥有钻石时）
execute if entity @a[nbt={Inventory:[{id:"minecraft:diamond"}]}] run function mymod:greeting
```

### tick.json - 循环执行函数

```json
{
    "values": [
        "mymod:tick_loop"
    ]
}
```

```mcfunction
# 文件：data/mymod/functions/tick_loop.mcfunction

# 每 tick 执行一次（每秒 20 次）
scoreboard players add @a test 1

# 检测玩家分数达到 100
execute as @a[scores={test=100..}] run function mymod:reward
```

## 标签系统详解

### 什么是标签？

**标签（Tag）** 是用于分组和引用多个方块/物品/实体等的机制。

```json
{
    "replace": false,
    "values": [
        "minecraft:stone",
        "minecraft:cobblestone",
        "mymod:custom_stone"
    ]
}
```

### 使用标签

```mcfunction
# 检测玩家是否站在标签中的方块上
execute if block ~ ~-1 ~ #mymod:my_stones run say 你站在自定义石头上！

# 清除标签中的所有物品
clear @a #mymod:my_items
```

## 进度系统入门

```json
{
    "display": {
        "icon": {
            "item": "minecraft:diamond"
        },
        "title": "自定义成就",
        "description": "获得第一颗钻石！",
        "frame": "task",
        "show_toast": true,
        "announce_to_chat": true,
        "hidden": false
    },
    "parent": "minecraft:story/mine_stone",
    "criteria": {
        "get_diamond": {
            "trigger": "minecraft:inventory_changed",
            "conditions": {
                "items": [
                    {
                        "items": ["minecraft:diamond"]
                    }
                ]
            }
        }
    }
}
```

## 配方系统入门

### 有形状配方

```json
{
    "type": "minecraft:crafting_shaped",
    "pattern": [
        "D D",
        " S ",
        " S "
    ],
    "key": {
        "D": {
            "item": "minecraft:diamond"
        },
        "S": {
            "item": "minecraft:stick"
        }
    },
    "result": {
        "item": "minecraft:diamond_sword"
    }
}
```

### 无形状配方

```json
{
    "type": "minecraft:crafting_shapeless",
    "ingredients": [
        {"item": "minecraft:diamond"},
        {"item": "minecraft:diamond"},
        {"item": "minecraft:diamond"},
        {"item": "minecraft:stick"},
        {"item": "minecraft:stick"}
    ],
    "result": {
        "item": "minecraft:diamond_pickaxe"
    }
}
```

## 完整示例：自定义科技数据包

### 目录结构

```
📁 tech-datapack/
├── 📄 pack.mcmeta
└── 📁 data/
    └── 📁 techmod/
        ├── 📁 advancements/
        │   └── first_machine.json
        ├── 📁 functions/
        │   ├── tick.mcfunction
        │   ├── machine/
        │   │   ├── activate.mcfunction
        │   │   └── deactivate.mcfunction
        │   └── machine_check.mcfunction
        ├── 📁 recipes/
        │   └── machine_core.json
        └── 📁 tags/
            └── 📁 blocks/
                └── machines.json
```

### 核心函数逻辑

```mcfunction
# tick.mcfunction - 每 tick 检查机器状态

# 检查所有机器方块
execute as @e[type=area_effect_cloud,tag=machine_core] at @s run function techmod:machine_check
```

```mcfunction
# machine_check.mcfunction - 检查单台机器

# 获取机器位置
execute store result score @s machine_x run data get entity @s Pos[0]
execute store result score @s machine_y run data get entity @s Pos[1]
execute store result score @s machine_z run data get entity @s Pos[2]

# 检查是否应该激活
execute if block ~ ~ ~ crafting_table unless block ~ ~1 ~ air run function techmod:machine/activate
```

## 课后自查

- [ ] 理解数据包与资源包的区别
- [ ] 能够创建包含正确 `pack.mcmeta` 的数据包
- [ ] 掌握函数的创建和调用方法
- [ ] 理解标签系统的用途
- [ ] 能够创建自定义进度
- [ ] 能够创建自定义配方
- [ ] 理解 tick 函数的循环机制

## 下一步

- **战利品表**：深入学习掉落系统
- **高级函数**：execute 命令的高级用法
- **数据包发布**：学习如何将数据包打包分享

---

*数据包是服务器管理员和红石工程师的利器，通过它你可以在不安装模组的情况下添加新内容！*
