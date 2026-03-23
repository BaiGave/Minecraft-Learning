# 第三章：创建第一个 Shader

> 从零开始编写你的第一个光影着色器

---

## 本章目标

完成本章后，你将：
1. 理解 Iris 着色器的基本结构
2. 创建第一个简单的 ShaderPack
3. 实现基础的视觉效果

---

## ShaderPack 最小结构

Iris ShaderPack 只需要一个着色器文件就可以工作！

### 最简 ShaderPack

```
my-first-shaderpack/
└── shaders/
    └── gbuffers_terrain.fsh    # 只需要片元着色器
```

是的，你没看错！Iris 可以使用内置的顶点着色器。

---

## 创建第一个着色器

### 步骤 1：创建文件结构

```
my-first-shaderpack/
└── shaders/
    └── gbuffers_terrain.fsh
```

### 步骤 2：编写片元着色器

打开 `gbuffers_terrain.fsh`，输入以下代码：

```glsl
#version 330 core

// 这是一个最简单的地形着色器
// 它会显示原版的纹理，但稍微亮一点

in vec2 TexCoord;
uniform sampler2D DiffuseSampler;

out vec4 fragColor;

void main() {
    // 采样原版纹理
    vec4 texColor = texture(DiffuseSampler, TexCoord);

    // 让颜色变亮 20%
    fragColor = texColor * 1.2;
}
```

### 步骤 3：放入游戏目录

将整个 `my-first-shaderpack` 文件夹复制到：

```
C:\Users\你的用户名\AppData\Roaming\.minecraft\shaderpacks\
```

### 步骤 4：测试

1. 启动 Minecraft
2. 进入 "Options" → "Video Settings" → "Shaders"
3. 选择 "my-first-shaderpack"
4. 进入一个世界看看效果！

---

## 理解 gbuffers_terrain

`gbuffers_terrain` 是 Iris 处理所有地形方块（石头、泥土、草方块等）的着色器。

### 什么是 gbuffers？

"gbuffers" = "Geometry Buffers"（几何缓冲区）

Iris 使用多个缓冲区来存储不同的渲染数据：

| 缓冲区 | 用途 |
|--------|------|
| `gbuffers_basic` | 基础几何 |
| `gbuffers_terrain` | 地形（所有方块） |
| `gbuffers_water` | 水和岩浆 |
| `gbuffers_entities` | 实体（怪物、动物） |
| `gbuffers_textured_lit` | 发光纹理（萤石等） |
| `gbuffers_armor_glint` | 护甲附魔闪光 |
| `gbuffers_particles` | 粒子效果 |
| `gbuffers_skybasic` | 天空基础 |
| `gbuffers_skytextured` | 云 |
| `gbuffers_clouds` | 云朵 |
| `gbuffers_weather` | 雨、雪 |

---

## 内置顶点着色器

### 什么时候需要顶点着色器？

- 修改顶点位置（扭曲、波动）
- 传递自定义数据给片元着色器
- 改变坐标系统

### 内置可用的顶点属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `Position` | vec3 | 顶点位置 |
| `Color` | vec4 | 顶点颜色 |
| `TexCoord` | vec2 | 纹理坐标 |
| `Normal` | vec3 | 法线 |

### 内置可用的 Uniform

| Uniform 名 | 类型 | 说明 |
|------------|------|------|
| `ModelViewMatrix` | mat4 | 模型-视图矩阵 |
| `ProjectionMatrix` | mat4 | 投影矩阵 |
| `TextureMatrix` | mat4 | 纹理矩阵 |

---

## 实战练习：创建更复杂的效果

### 练习 1：调整对比度和饱和度

```glsl
#version 330 core

in vec2 TexCoord;
uniform sampler2D DiffuseSampler;

out vec4 fragColor;

vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
}

vec3 adjustSaturation(vec3 color, float saturation) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(gray), color, saturation);
}

void main() {
    vec4 texColor = texture(DiffuseSampler, TexCoord);

    vec3 adjusted = adjustContrast(texColor.rgb, 1.2);  // 增加对比度
    adjusted = adjustSaturation(adjusted, 1.3);          // 增加饱和度

    fragColor = vec4(adjusted, texColor.a);
}
```

### 练习 2：添加马赛克效果

```glsl
#version 330 core

in vec2 TexCoord;
uniform sampler2D DiffuseSampler;
uniform vec2 texelSize;  // 纹素大小

out vec4 fragColor;

void main() {
    // 将坐标向下取整，实现像素化
    vec2 pixelated = floor(TexCoord / texelSize / 8.0) * 8.0 * texelSize;
    vec4 color = texture(DiffuseSampler, pixelated);

    fragColor = color;
}
```

### 练习 3：反相颜色效果

```glsl
#version 330 core

in vec2 TexCoord;
uniform sampler2D DiffuseSampler;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(DiffuseSampler, TexCoord);
    fragColor = vec4(1.0 - texColor.rgb, texColor.a);  // 反转 RGB
}
```

---

## 调试技巧

### 使用占位符颜色快速测试

```glsl
#version 330 core

out vec4 fragColor;

void main() {
    // 测试时使用纯色，便于检查渲染是否正常
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);  // 红色
}
```

### 使用渐变色检查 UV

```glsl
#version 330 core

in vec2 TexCoord;

out vec4 fragColor;

void main() {
    fragColor = vec4(TexCoord, 0.0, 1.0);  // R=X, G=Y, B=0
}
```

---

## 常见问题

### 1. 着色器不显示

- 检查文件名是否正确（大小写敏感）
- 确保放在 `shaders/` 目录下
- 检查游戏是否正确加载了 ShaderPack

### 2. 编译错误

- 检查 GLSL 语法（分号、括号）
- 确保 `#version` 在第一行
- 检查 uniform 名称是否正确

### 3. 只有部分方块受影响

- 不是所有着色器都会被创建
- 只有存在的文件会被加载
- 其他使用内置默认值

---

## 作业

1. 创建一个增加亮度的 ShaderPack
2. 创建一个反相颜色的 ShaderPack
3. 创建一个简单的马赛克 ShaderPack
4. 挑战：创建一个随时间变化的颜色效果

---

## 下一步

- [第四章：ShaderPack 结构详解](04-shaderpack-structure.md) - 了解完整的光影包结构
- [第五章：Uniform 入门](05-uniform-basics.md) - 学习使用内置变量

---

*教程版本：Iris 1.7.x / Minecraft 1.21*
