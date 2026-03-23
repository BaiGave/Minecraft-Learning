# 第一章：Java 编程基础

> 如果你之前没接触过 Java 编程，这章会带你了解开发 Mod 所需的所有 Java 知识。
> 如果你已经有 Java 基础，可以跳过这章。

---

## 目录

1. [什么是 Java？](#1-什么是-java)
2. [变量和数据类型](#2-变量和数据类型)
3. [控制流程](#3-控制流程)
4. [方法（函数）](#4-方法函数)
5. [类和对象](#5-类和对象)
6. [接口](#6-接口)
7. [常用集合](#7-常用集合)
8. [Lambda 表达式](#8-lambda-表达式)
9. [实战练习](#9-实战练习)

---

## 1. 什么是 Java？

### 1.1 编程语言是什么？

想象你有一只会执行命令的机器人。你需要用某种语言告诉它做什么：

```
机器人，去把门打开！
```

编程语言就是人与电脑沟通的方式。Java 就是其中一种非常流行的编程语言。

### 1.2 Java 的特点

| 特点 | 解释 |
|------|------|
| **面向对象** | 一切皆为"对象"，像搭积木一样组织代码 |
| **跨平台** | 一次编写，到处运行 |
| **类型安全** | 编译时就检查错误，减少运行时崩溃 |
| **自动内存管理** | 不需要手动释放内存 |

### 1.3 Java 程序长什么样？

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("你好，世界！");
    }
}
```

**逐行解释**：

| 行号 | 代码 | 含义 |
|------|------|------|
| 1 | `public class HelloWorld` | 定义一个叫 "HelloWorld" 的类 |
| 2 | `public static void main(String[] args)` | 程序入口方法，电脑从这里开始执行 |
| 3 | `System.out.println(...)` | 打印内容到屏幕 |

> **记住**：每条语句以分号 `;` 结尾！

---

## 2. 变量和数据类型

### 2.1 变量是什么？

变量就像一个带标签的盒子，你可以往里面放东西：

```
┌─────────────────┐
│      盒子       │  ← 变量名: age
│        18       │  ← 存放的值: 18
└─────────────────┘
```

### 2.2 基本数据类型

Java 有几种基本的数据类型：

| 类型 | 中文名 | 示例 | 能存什么 |
|------|--------|------|----------|
| `int` | 整数 | `int age = 18;` | -21亿 到 21亿 的整数 |
| `long` | 长整数 | `long bigNumber = 9999999999L;` | 更大的整数（带 L 后缀） |
| `float` | 浮点数 | `float pi = 3.14f;` | 小数（带 f 后缀） |
| `double` | 双精度 | `double precise = 3.1415926535;` | 更精确的小数 |
| `boolean` | 布尔 | `boolean isActive = true;` | true（真）或 false（假） |
| `char` | 字符 | `char grade = 'A';` | 单个字符（用单引号） |
| `String` | 字符串 | `String name = "张三";` | 文字（用双引号） |

### 2.3 定义变量

```java
// 语法：类型 变量名 = 初始值;

int playerLevel = 1;                    // 整数
String playerName = "Steve";            // 字符串
boolean hasDiamond = false;             // 布尔值
double health = 20.0;                  // 小数
```

### 2.4 变量命名规则

```
✅ 正确的命名：
    playerHealth
    itemCount
    MAX_SIZE
    myModId

❌ 错误的命名：
    123abc      （不能以数字开头）
    my-name      （不能有连字符）
    class        （不能使用保留字）
```

**命名建议**：
- 变量名用小写字母开头，后续单词首字母大写：`playerHealth`
- 常量全部大写，单词间用下划线连接：`MAX_SIZE`
- 类名首字母大写：`MyFirstClass`

---

## 3. 控制流程

### 3.1 if 条件判断

```java
int health = 15;

if (health > 10) {
    System.out.println("状态良好！");
} else if (health > 5) {
    System.out.println("需要治疗！");
} else {
    System.out.println("危险！");
}
```

**流程图**：

```
         health > 10 ?
           ↙     ↘
         是         否
          ↓         health > 5 ?
     "状态良好"      ↙     ↘
                   是         否
                    ↓         ↓
              "需要治疗"   "危险"
```

### 3.2 for 循环

当你需要重复做某件事时：

```java
// 打印 5 次 "Hello!"
for (int i = 0; i < 5; i++) {
    System.out.println("Hello! 第 " + i + " 次");
}
```

**逐行动图解**：

```
i = 0 → i < 5? 是 → 打印 → i++ → i = 1
i = 1 → i < 5? 是 → 打印 → i++ → i = 2
i = 2 → i < 5? 是 → 打印 → i++ → i = 3
i = 3 → i < 5? 是 → 打印 → i++ → i = 4
i = 4 → i < 5? 是 → 打印 → i++ → i = 5
i = 5 → i < 5? 否 → 结束循环
```

### 3.3 for-each 循环（增强 for 循环）

遍历集合时特别有用：

```java
String[] items = {"钻石剑", "金苹果", "附魔书"};

for (String item : items) {
    System.out.println("背包里有：" + item);
}
```

**输出**：
```
背包里有：钻石剑
背包里有：金苹果
背包里有：附魔书
```

### 3.4 switch 多分支

```java
int day = 3;

switch (day) {
    case 1:
        System.out.println("星期一");
        break;
    case 2:
        System.out.println("星期二");
        break;
    case 3:
        System.out.println("星期三");
        break;
    default:
        System.out.println("其他日子");
}
```

> **重要**：每个 case 后面要加 `break;`，否则会"贯穿"执行下面的 case！

---

## 4. 方法（函数）

### 4.1 什么是方法？

方法就像一个"命令包"，把一组操作打包起来，可以反复使用：

```java
// 定义方法
public static void  sayHello() {
    System.out.println("你好！");
}

// 调用方法
sayHello();  // 输出：你好！
sayHello();  // 再调用一次，输出：你好！
```

### 4.2 带参数的方法

方法可以接收"输入"：

```java
// 定义：参数是 String 类型的 name
public static void greet(String name) {
    System.out.println("你好，" + name + "！");
}

// 调用
greet("Steve");      // 输出：你好，Steve！
greet("Alex");       // 输出：你好，Alex！
```

### 4.3 带返回值的方法

方法可以返回"结果"：

```java
// 定义：返回 int 类型的值
public static int add(int a, int b) {
    return a + b;  // 返回 a + b 的结果
}

// 调用
int result = add(5, 3);  // result = 8
System.out.println("5 + 3 = " + result);  // 输出：5 + 3 = 8
```

### 4.4 方法的完整语法

```java
修饰符 返回类型 方法名(参数列表) {
    // 方法体
    return 结果;  // 如果返回类型不是 void
}
```

**示例**：

```java
public static int max(int a, int b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}
```

---

## 5. 类和对象

### 5.1 面向对象是什么？

**类** 是"图纸"，**对象** 是根据图纸造出来的"产品"：

```
类（图纸）                    对象（产品）
┌─────────────────┐          ┌─────────────────┐
│   Player        │          │   Player 1       │
│  - name          │ ──────►  │   name: Steve    │
│  - health        │          │   health: 20    │
│  - attack()      │          │   attack()      │
│  - takeDamage()  │          │   takeDamage()  │
└─────────────────┘          └─────────────────┘

                       ┌─────────────────┐
                       │   Player 2       │
                       │   name: Alex    │
                       │   health: 20    │
                       │   attack()      │
                       │   takeDamage()  │
                       └─────────────────┘
```

### 5.2 定义类

```java
public class Player {
    // 属性（字段）
    String name;      // 玩家名称
    int health;       // 生命值
    int attackPower;  // 攻击力

    // 构造方法（创建对象时调用）
    public Player(String name, int health) {
        this.name = name;
        this.health = health;
        this.attackPower = 5;
    }

    // 方法
    public void attack(Player target) {
        System.out.println(this.name + " 攻击了 " + target.name + "！");
        target.takeDamage(this.attackPower);
    }

    public void takeDamage(int damage) {
        this.health -= damage;
        System.out.println(this.name + " 受到了 " + damage + " 点伤害，剩余生命：" + this.health);
    }
}
```

### 5.3 创建和使用对象

```java
public class Main {
    public static void main(String[] args) {
        // 创建对象：new + 构造方法
        Player player1 = new Player("Steve", 20);
        Player player2 = new Player("Alex", 20);

        // 调用方法
        player1.attack(player2);
    }
}
```

**输出**：
```
Steve 攻击了 Alex！
Alex 受到了 5 点伤害，剩余生命：15
```

### 5.4 关键字 `this`

`this` 代表"当前对象"：

```java
public Player(String name, int health) {
    this.name = name;      // this.name = 这个对象的 name
    this.health = health;  // this.health = 这个对象的 health
}
```

---

## 6. 接口

### 6.1 什么是接口？

接口就像"合同"，规定必须做什么，但不规定怎么做。

**场景**：假设所有"能攻击的东西"都要实现 `Attackable` 接口：

```java
// 定义接口
public interface Attackable {
    void attack();           // 必须实现攻击方法
    int getAttackPower();     // 必须实现获取攻击力的方法
}

// 实现接口
public class Sword implements Attackable {
    private int damage = 10;

    @Override
    public void attack() {
        System.out.println("用剑挥砍！造成 " + damage + " 点伤害");
    }

    @Override
    public int getAttackPower() {
        return damage;
    }
}
```

### 6.2 为什么需要接口？

```
不用接口：              用接口：
Sword 类 ──► 无统一标准    Sword 类 ──► Attackable ──► 统一处理
Axe 类   ──► 无统一标准    Axe 类   ──► Attackable ──► 统一处理
Bow 类   ──► 无统一标准    Bow 类   ──► Attackable ──► 统一处理
```

**使用接口**：

```java
public static void attackAll(Attackable[] items) {
    for (Attackable item : items) {
        item.attack();  // 统一调用 attack 方法
    }
}
```

### 6.3 Fabric 中的接口

Fabric API 大量使用接口。例如 `FabricBlock` 接口：

```java
public interface FabricBlock {
    // 接口定义的方法
    default BlockState getAppearance(BlockState state, BlockRenderView renderView,
                                   BlockPos pos, Direction side,
                                   @Nullable BlockState sourceState,
                                   @Nullable BlockPos sourcePos) {
        return state;  // 默认实现：返回原始状态
    }
}
```

任何类实现这个接口，就需要提供 `getAppearance` 方法的具体实现。

---

## 7. 常用集合

### 7.1 List（列表）

有序、可重复的集合：

```java
import java.util.List;
import java.util.ArrayList;

List<String> inventory = new ArrayList<>();

inventory.add("钻石");    // 添加元素
inventory.add("红石");
inventory.add("青金石");

System.out.println(inventory.get(0));  // 获取第0个：钻石
System.out.println(inventory.size());  // 列表大小：3

for (String item : inventory) {
    System.out.println(item);
}
```

### 7.2 Map（映射）

键值对集合，通过"钥匙"找"值"：

```java
import java.util.Map;
import java.util.HashMap;

Map<String, Integer> itemPrices = new HashMap<>();

itemPrices.put("钻石", 1000);    // 存放
itemPrices.put("铁锭", 20);
itemPrices.put("煤炭", 10);

int diamondPrice = itemPrices.get("钻石");  // 通过键获取值：1000
boolean hasDiamond = itemPrices.containsKey("钻石");  // 检查是否存在：true
```

**理解 Map**：

```
键（String）     →    值（Integer）
  "钻石"        →      1000
  "铁锭"        →       20
  "煤炭"        →       10
```

### 7.3 Set（集合）

无序、不重复的集合：

```java
import java.util.Set;
import java.util.HashSet;

Set<String> tags = new HashSet<>();

tags.add("可燃烧");
tags.add("可堆叠");
tags.add("可燃烧");  // 重复的，不会添加

System.out.println(tags.size());  // 大小：2（重复的没加进去）
```

---

## 8. Lambda 表达式

### 8.1 什么是 Lambda？

Lambda 是一种简洁的"匿名函数"写法。在 Fabric 中大量使用。

### 8.2 从匿名类到 Lambda

**传统写法（匿名内部类）**：

```java
button.onClick(new OnClickListener() {
    @Override
    public void onClick() {
        System.out.println("按钮被点击了！");
    }
});
```

**Lambda 写法**：

```java
button.onClick(() -> {
    System.out.println("按钮被点击了！");
});
```

**简化过程**：

```java
// 完整写法
(x, y) -> { return x + y; }

// 如果只有一行，可以省略 return 和大括号
(x, y) -> x + y

// 只有一个参数，可以省略括号
x -> x * 2

// 没有参数
() -> System.out.println("Hello!")
```

### 8.3 在 Fabric 中的应用

```java
// 注册事件监听
ServerLifecycleEvents.SERVER_STARTED.register(server -> {
    System.out.println("服务器启动成功！");
});

// 注册方块放置事件
BlockEvents.BEFORE_PLACE.register((world, pos, state, player) -> {
    if (pos.getY() < 0) {
        return false;  // 阻止在 y<0 的地方放置
    }
    return true;  // 允许放置
});
```

---

## 9. 实战练习

### 练习 1：变量和运算

创建一个程序，计算玩家的有效生命值（生命值 + 10点护甲）：

```java
public class Practice1 {
    public static void main(String[] args) {
        int health = 20;
        int armor = 15;

        // 计算有效生命值
        int effectiveHealth = health + armor;

        System.out.println("基础生命：" + health);
        System.out.println("护甲加成：" + armor);
        System.out.println("有效生命：" + effectiveHealth);
    }
}
```

### 练习 2：类和对象

创建一个 `Item` 类，包含名称、价格，并实现打八折的功能：

```java
public class Item {
    String name;
    int price;

    public Item(String name, int price) {
        this.name = name;
        this.price = price;
    }

    // 打八折
    public int getDiscountedPrice() {
        return (int)(price * 0.8);  // 80%
    }

    public static void main(String[] args) {
        Item diamond = new Item("钻石", 1000);
        System.out.println(diamond.name + " 原价：" + diamond.price);
        System.out.println(diamond.name + " 八折：" + diamond.getDiscountedPrice());
    }
}
```

### 练习 3：使用 List

创建一个物品清单，添加3个物品，然后遍历打印：

```java
import java.util.List;
import java.util.ArrayList;

public class Practice3 {
    public static void main(String[] args) {
        List<String> items = new ArrayList<>();

        items.add("铁锭 x64");
        items.add("金锭 x32");
        items.add("钻石 x16");

        System.out.println("=== 背包物品清单 ===");
        for (int i = 0; i < items.size(); i++) {
            System.out.println((i + 1) + ". " + items.get(i));
        }
    }
}
```

---

## 答案

### 练习 1
（上面的代码就是完整答案）

### 练习 2
（上面的代码就是完整答案）

### 练习 3
（上面的代码就是完整答案）

---

## 下一步

现在你已经掌握了 Java 的基础知识！下一步：
- [开发环境搭建](02-environment-setup.md) - 安装开发工具
- [创建你的第一个 Mod](../part-1-basics/01-fabric-intro.md) - 开始 Fabric 开发

---

*还有什么不清楚的？试试在搜索引擎搜索 "Java 基础教程"，或者在 [Fabric Discord](https://discord.gg/fabricmc) 提问！*
