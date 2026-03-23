# 第一章：Shader 基础入门

> 零基础学习 GLSL 着色器编程

---

## 什么是 Shader（着色器）？

Shader（着色器）是一种运行在 GPU 上的特殊程序，负责决定屏幕上每个像素的颜色。

### 为什么需要 Shader？

| 对比项 | CPU 程序 | GPU Shader |
|--------|---------|-----------|
| 执行方式 | 顺序执行 | 并行执行（数千个线程） |
| 擅长领域 | 逻辑判断、分支 | 图形计算、大量数据 |
| 典型应用 | 游戏逻辑、AI | 渲染、特效 |

在 Minecraft 中，Shader 可以实现：
- 动态光照和阴影
- 水面波纹和反射
- 大气散射（天空颜色）
- 各种视觉特效

---

## GLSL 基础语法

GLSL（OpenGL Shading Language）是编写 Shader 的语言，语法类似 C 语言。

### 1. 变量类型

```glsl
// 标量类型
float myFloat = 3.14;    // 浮点数
int myInt = 42;          // 整数
bool myBool = true;      // 布尔值

// 向量类型（重点！）
vec2 uv = vec2(0.5, 1.0);      // 2D 向量（纹理坐标）
vec3 normal = vec3(0.0, 1.0, 0.0);  // 3D 向量（法线、颜色）
vec4 color = vec4(1.0, 0.0, 0.0, 1.0); // 4D 向量（RGBA 颜色）

// 向量分量访问
color.r = 0.5;           // 使用 r/g/b/a
color.x = 0.5;           // 使用 x/y/z/w
color.s = 0.5;           // 使用 s/t/p/q（纹理坐标用这个）
```

### 2. 矩阵类型

```glsl
mat2 mat2x2 = mat2(1.0, 0.0,    // 第一列
                   0.0, 1.0);    // 第二列

mat3 modelMatrix;        // 3x3 变换矩阵
mat4 mvpMatrix;          // 4x4 MVP 矩阵（模型-视图-投影）

// 矩阵运算
mat4 transformed = projectionMatrix * viewMatrix * modelMatrix;
```

### 3. 关键字

```glsl
// 精度限定符
precision highp float;    // 高精度（推荐）

// 存储限定符
attribute vec3 position;  // 顶点属性（顶点着色器）
varying vec2 texCoord;    // 在顶点/片元着色器间传递
uniform mat4 mvp;         // 全局统一变量

// 片元着色器专用
gl_FragColor = vec4(1.0); // 输出像素颜色
gl_FragCoord.xy;           // 像素的屏幕坐标
```

---

## 顶点着色器 vs 片元着色器

Shader 分为两种类型，它们协同工作：

```
┌─────────────────────────────────────────────────────────────┐
│                      渲染流程                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  顶点着色器 (Vertex Shader)                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  输入：顶点数据（位置、UV、法线...）                      │ │
│  │  处理：坐标变换、传递数据给片元着色器                      │ │
│  │  输出：裁剪空间坐标、插值数据                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ▼                                  │
│                    GPU 自动插值                               │
│                           ▼                                  │
│  片元着色器 (Fragment/Pixel Shader)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  输入：插值后的数据（顶点着色器输出的值）                  │ │
│  │  处理：计算每个像素的颜色                                │ │
│  │  输出：最终像素颜色                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 顶点着色器示例

```glsl
#version 330 core

// 顶点属性（从 Minecraft 传入）
in vec3 Position;           // 顶点位置
in vec2 TexCoord;           // 纹理坐标
in vec3 Normal;             // 法线

// 输出到片元着色器
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vPosition;

uniform mat4 ModelViewMatrix;   // 模型-视图矩阵
uniform mat4 ProjectionMatrix;  // 投影矩阵

void main() {
    vTexCoord = TexCoord;
    vNormal = Normal;
    vPosition = Position;

    // 坐标变换：世界坐标 → 裁剪坐标
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Position, 1.0);
}
```

### 片元着色器示例

```glsl
#version 330 core

// 从顶点着色器接收（已插值）
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler2D DiffuseSampler;  // 漫反射纹理
uniform vec3 LightDirection;       // 光照方向

out vec4 fragColor;

void main() {
    // 采样纹理颜色
    vec4 texColor = texture(DiffuseSampler, vTexCoord);

    // 简单光照计算
    float diffuse = max(dot(vNormal, LightDirection), 0.0);
    vec3 finalColor = texColor.rgb * diffuse;

    fragColor = vec4(finalColor, texColor.a);
}
```

---

## 常用内置函数

```glsl
// 数学函数
sin(x), cos(x), tan(x)         // 三角函数
pow(x, y)                      // 幂函数 x^y
sqrt(x), inversesqrt(x)        // 平方根
abs(x), sign(x)                // 绝对值、符号
floor(x), ceil(x), fract(x)    // 向下/向上取整、取小数

// 向量函数
dot(a, b)                       // 点积
cross(a, b)                      // 叉积
length(v)                        // 向量长度
normalize(v)                     // 归一化
mix(a, b, t)                     // 线性插值 a*(1-t) + b*t
clamp(x, min, max)               // 限制范围
smoothstep(a, b, x)              // 平滑插值

// 纹理采样
texture(sampler, coord)          // 采样纹理
textureLod(sampler, coord, lod)  // 指定 LOD 采样
```

---

## 实战：创建一个简单的颜色渐变

### 1. 创建项目结构

```
my-shaderpack/
└── shaders/
    └── gbuffers_basic.vsh    // 顶点着色器
    └── gbuffers_basic.fsh    // 片元着色器
```

### 2. 顶点着色器 (gbuffers_basic.vsh)

```glsl
#version 330 core

// 从 Minecraft 传入的顶点属性（固定名称）
in vec3 Position;
in vec4 Color;

out vec4 vColor;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

void main() {
    vColor = Color;

    // MVP 变换
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Position, 1.0);
}
```

### 3. 片元着色器 (gbuffers_basic.fsh)

```glsl
#version 330 core

in vec4 vColor;

out vec4 fragColor;

void main() {
    // 直接输出颜色（带渐强效果）
    fragColor = vColor * 1.5;  // 让颜色更亮一些
}
```

---

## 调试技巧

### 1. 用颜色输出调试信息

```glsl
// 输出法线（用于检查法线是否正确）
fragColor = vec4(vNormal * 0.5 + 0.5, 1.0);

// 输出 UV 坐标（检查 UV 是否正确）
fragColor = vec4(vTexCoord, 0.0, 1.0);

// 输出深度（调试深度问题）
fragColor = vec4(gl_FragCoord.z);
```

### 2. 常见错误

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| 黑色画面 | 纹理未绑定 | 检查 sampler uniform |
| 纯白画面 | 颜色计算错误 | 检查 uniform 值 |
| 编译失败 | 语法错误 | 检查分号、括号 |
| 位置偏移 | MVP 矩阵问题 | 检查 uniform 顺序 |

---

## 练习题

1. **基础练习**：修改上面的片元着色器，让颜色从左到右渐变

2. **进阶练习**：实现一个简单的棋盘格纹理效果

3. **挑战练习**：实现一个随时间变化的颜色动画

---

## 下一步

- [第二章：开发环境搭建](02-iris-setup.md) - 搭建 Iris 开发环境
- [第四章：ShaderPack 结构详解](04-shaderpack-structure.md) - 理解完整的光影包结构

---

*教程版本：Iris 1.7.x / Minecraft 1.21*
