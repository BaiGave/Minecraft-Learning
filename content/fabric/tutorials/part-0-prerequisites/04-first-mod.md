# 第四章：创建你的第一个 Mod

> 终于到了动手环节！这一章会带你创建一个最简单的 Mod。

---

## 目录

1. [准备项目](#1-准备项目)
2. [创建 Mod 主类](#2-创建-mod-主类)
3. [注册第一个物品](#3-注册第一个物品)
4. [添加纹理和模型](#4-添加纹理和模型)
5. [添加语言文件](#5-添加语言文件)
6. [运行测试](#6-运行测试)
7. [完整代码汇总](#7-完整代码汇总)

---

## 1. 准备项目

### 1.1 基于官方模板

我们将基于 [第二章](part-0-prerequisites/02-environment-setup.md) 安装的 Fabric Example Mod 进行修改。

打开项目后，找到 `ExampleMod.java` 文件：

```
src/main/java/net/fabricmc/examplemod/
    └── ExampleMod.java    ← 打开这个文件
```

### 1.2 清理模板代码

把文件内容替换成最简单的 Mod 结构：

```java
package net.fabricmc.examplemod;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExampleMod implements ModInitializer {
    // Logger 用于在控制台打印信息
    public static final Logger LOGGER = LoggerFactory.getLogger("examplemod");

    @Override
    public void onInitialize() {
        // 这个方法会在 Mod 加载时执行
        LOGGER.info("你好！我的第一个 Mod 启动成功了！");
    }
}
```

---

## 2. 创建 Mod 主类

### 2.1 解释代码

```java
package net.fabricmc.examplemod;  // 包名，类似于文件夹路径
```

**包名解释**：`net.fabricmc.examplemod` 这个包名遵循域名反转的规则：
- `net.fabricmc` - 代表 Fabric 官方
- `examplemod` - 代表你的 Mod 名称

如果你有自己的域名（如 `mymod.com`），可以写成 `com.mymod.modname`。

```java
import net.fabricmc.api.ModInitializer;
```

**导入语句**：告诉 Java 我们要使用 Fabric 的 `ModInitializer` 接口。

```java
public class ExampleMod implements ModInitializer {
```

**类声明**：`ExampleMod` 是一个类，它实现了 `ModInitializer` 接口。

### 2.2 ModInitializer 接口

`ModInitializer` 是 Fabric 提供的接口，所有 Mod 主类都必须实现它：

```
┌─────────────────────────────┐
│    ModInitializer           │  ← 接口（合同）
│    (必须实现的方法)           │
├─────────────────────────────┤
│ + onInitialize(): void      │  ← Mod 加载时调用
└─────────────────────────────┘
              ↑
              │
┌─────────────────────────────┐
│    ExampleMod                │  ← 我们的类（实现合同）
│    (实际工作的代码)           │
├─────────────────────────────┤
│ + onInitialize(): void      │  ← 提供具体实现
└─────────────────────────────┘
```

### 2.3 LOGGER 的作用

```java
public static final Logger LOGGER = LoggerFactory.getLogger("examplemod");
```

**Logger** 用于在控制台（和游戏日志）中打印信息，方便调试。

```
运行游戏时，控制台会显示：
[main/INFO] (examplemod) 你好！我的第一个 Mod 启动成功了！
```

---

## 3. 注册第一个物品

### 3.1 添加物品注册代码

修改 `ExampleMod.java`：

```java
package net.fabricmc.examplemod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.item.v1.FabricItemSettings;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExampleMod implements ModInitializer {
    public static final Logger LOGGER = LoggerFactory.getLogger("examplemod");

    // 👇 新增：定义一个"魔法水晶"物品
    public static final Item MAGIC_CRYSTAL = Registry.register(
        Registries.ITEM,              // 注册表类型：物品
        Identifier.of("examplemod", "magic_crystal"),  // 物品 ID
        new Item(FabricItemSettings().maxCount(64))    // 物品设置
    );

    @Override
    public void onInitialize() {
        LOGGER.info("你好！我的第一个 Mod 启动成功了！");
        LOGGER.info("我创建了一个物品：{}", MAGIC_CRYSTAL.getTranslationKey());
    }
}
```

### 3.2 代码解释

```
Registry.register() 的三个参数：

1. Registries.ITEM
   └── 要注册到什么注册表（物品注册表）

2. Identifier.of("examplemod", "magic_crystal")
   └── 物品的 ID（命名空间 + 名称）
       最终格式：examplemod:magic_crystal

3. new Item(FabricItemSettings().maxCount(64))
   └── 物品本身 + 它的设置
       maxCount(64) = 最多堆叠 64 个
```

### 3.3 理解 ID

物品 ID 就像物品的"身份证号"：

```
物品 ID = 命名空间:物品名

examplemod:magic_crystal
    │          │
    │          └── 物品名称（英文）
    │
    └── 命名空间（通常是 Mod ID）
```

**命名空间规则**：
- 通常使用 Mod ID
- 只能包含小写字母、数字、下划线
- 不能有空格或特殊字符

---

## 4. 添加纹理和模型

### 4.1 创建资源文件夹

在 `src/main/resources/` 下创建以下结构：

```
resources/
├── assets/
│   └── examplemod/              ← 和你的 Mod ID 一致
│       ├── lang/
│       │   └── en_us.json      ← 语言文件（后面创建）
│       ├── models/
│       │   └── item/
│       │       └── magic_crystal.json   ← 物品模型
│       └── textures/
│           └── item/
│               └── magic_crystal.png    ← 物品纹理
```

### 4.2 创建物品纹理

创建一个 16x16 像素的 PNG 图片，保存为 `magic_crystal.png`。

> **提示**：你可以使用 Paint.net、GIMP 或任何图像编辑软件创建。
> 如果不会画，可以先用一个纯色图片（如紫色方块）代替。

### 4.3 创建物品模型

创建 `resources/assets/examplemod/models/item/magic_crystal.json`：

```json
{
    "parent": "minecraft:item/generated",
    "textures": {
        "layer0": "examplemod:item/magic_crystal"
    }
}
```

**解释**：
- `"parent": "minecraft:item/generated"` - 使用默认的物品模型
- `"layer0"` - 物品使用的纹理路径

### 4.4 纹理路径规则

```
"layer0": "examplemod:item/magic_crystal"

读取的实际文件：
resources/assets/examplemod/textures/item/magic_crystal.png
```

---

## 5. 添加语言文件

### 5.1 创建语言文件

创建 `resources/assets/examplemod/lang/en_us.json`：

```json
{
    "item.examplemod.magic_crystal": "Magic Crystal"
}
```

### 5.2 语言文件格式

```
JSON 格式：键值对

"键" : "值"

"item.examplemod.magic_crystal" : "Magic Crystal"
│                            │            │
│                            │            └── 显示的文字
│                            │
│                            └── 物品的翻译键（自动生成）
│
└── 固定前缀：item.你的ModID.你的物品ID
```

### 5.3 添加中文支持（可选）

创建 `resources/assets/examplemod/lang/zh_cn.json`：

```json
{
    "item.examplemod.magic_crystal": "魔法水晶"
}
```

---

## 6. 运行测试

### 6.1 启动游戏

在 IDEA 中：
1. 打开右侧 Gradle 面板
2. 展开 **Tasks** → **fabric**
3. 双击 **runClient**

### 6.2 检查日志

启动时观察控制台，应该看到：

```
[main/INFO] (examplemod) 你好！我的第一个 Mod 启动成功了！
[main/INFO] (examplemod) 我创建了一个物品：item.examplemod.magic_crystal
```

### 6.3 在游戏中验证

1. 进入游戏
2. 打开创意模式物品栏
3. 搜索 "magic" 或 "crystal"
4. 应该能看到你的魔法水晶！

---

## 7. 完整代码汇总

### 7.1 Mod 主类

`src/main/java/net/fabricmc/examplemod/ExampleMod.java`：

```java
package net.fabricmc.examplemod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.item.v1.FabricItemSettings;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExampleMod implements ModInitializer {
    public static final Logger LOGGER = LoggerFactory.getLogger("examplemod");

    // 注册一个叫 "magic_crystal" 的物品
    public static final Item MAGIC_CRYSTAL = Registry.register(
        Registries.ITEM,
        Identifier.of("examplemod", "magic_crystal"),
        new Item(FabricItemSettings().maxCount(64))
    );

    @Override
    public void onInitialize() {
        LOGGER.info("你好！我的第一个 Mod 启动成功了！");
        LOGGER.info("我创建了一个物品：{}", MAGIC_CRYSTAL.getTranslationKey());
    }
}
```

### 7.2 资源文件结构

```
src/main/resources/
├── assets/
│   └── examplemod/
│       ├── lang/
│       │   ├── en_us.json
│       │   └── zh_cn.json       （可选）
│       ├── models/
│       │   └── item/
│       │       └── magic_crystal.json
│       └── textures/
│           └── item/
│               └── magic_crystal.png
```

### 7.3 模型文件

`models/item/magic_crystal.json`：

```json
{
    "parent": "minecraft:item/generated",
    "textures": {
        "layer0": "examplemod:item/magic_crystal"
    }
}
```

### 7.4 语言文件

`lang/en_us.json`：

```json
{
    "item.examplemod.magic_crystal": "Magic Crystal"
}
```

---

## 挑战练习

### 练习 1：添加更多物品

尝试添加第二种物品，比如"能量棒"：

```java
public static final Item ENERGY_BAR = Registry.register(
    Registries.ITEM,
    Identifier.of("examplemod", "energy_bar"),
    new Item(FabricItemSettings().food( // TODO: 添加食物属性
        new FoodComponent.Builder()
            .hunger(4)     // 恢复 4 点饥饿值
            .saturationModifier(2.0f)  // 饱和度
            .build()
    ))
);
```

### 练习 2：自定义堆叠数量

创建一个最多只能堆叠 16 个的物品：

```java
public static final Item RARE_GEM = Registry.register(
    Registries.ITEM,
    Identifier.of("examplemod", "rare_gem"),
    new Item(FabricItemSettings().maxCount(16))  // 最多 16 个
);
```

### 练习 3：不可堆叠物品

创建一个不可堆叠（数量永远为 1）的物品：

```java
public static final Item TOOL = Registry.register(
    Registries.ITEM,
    Identifier.of("examplemod", "special_tool"),
    new Item(FabricItemSettings().maxCount(1))  // 不可堆叠
);
```

---

## 下一步

太棒了！你已经创建了自己的第一个 Mod！

接下来可以学习：
- [创建自定义方块](../part-2-blocks-items/01-creating-blocks.md) - 继续扩展你的 Mod
- [Fabric 基础概念](../part-1-basics/01-fabric-intro.md) - 深入理解 Fabric API

---

*有什么问题？去 [Fabric Discord](https://discord.gg/fabricmc) 提问！*
