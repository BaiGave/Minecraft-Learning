# 第五章：Uniform 入门

> 学习使用 Iris 内置的 Uniform 变量

---

## 什么是 Uniform？

Uniform（统一变量）是一种从 CPU（Java）传递给 GPU（Shader）的数据。它在一次渲染过程中保持不变（"统一"）。

```
┌─────────────────────────────────────────────────────────────┐
│                      应用程序 (Java)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Uniform 值设置                                         │  │
│  │  glUniform1f(location, 3.14f);                       │  │
│  │  glUniformMatrix4fv(location, matrix);                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 传递数据
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      着色器 (GLSL)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ uniform float myValue;                               │  │
│  │ uniform vec3 lightDir;                               │  │
│  │ uniform mat4 projection;                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Uniform vs Attribute vs Varying

| 类型 | 来源 | 变化频率 | 示例 |
|------|------|---------|------|
| `attribute` | 顶点数据 | 每顶点变化 | 位置、UV |
| `varying` | 顶点着色器输出 | 已插值 | 法线、颜色 |
| `uniform` | CPU 设置 | 整个 DrawCall | 时间、矩阵 |

---

## Iris 内置 Uniform

Iris 提供了大量内置 Uniform，开发者可以直接使用！

### 时间相关 Uniform

| Uniform | 类型 | 说明 |
|---------|------|------|
| `frameTime` | float | 当前帧时间（秒） |
| `frameCounter` | int | 帧计数器 |
| `frameRate` | float | 预估帧率 |

### 相机相关 Uniform

| Uniform | 类型 | 说明 |
|---------|------|------|
| `cameraPosition` | vec3 | 相机世界坐标 |
| `cameraRotation` | mat4 | 相机旋转矩阵 |

### 光照相关 Uniform

| Uniform | 类型 | 说明 |
|---------|------|------|
| `sunPosition` | vec3 | 太阳位置 |
| `moonPosition` | vec3 | 月亮位置 |
| `sunPathRotation` | float | 太阳路径旋转 |
| `ambientLight` | float | 环境光照强度 |

### 天气相关 Uniform

| Uniform | 类型 | 说明 |
|---------|------|------|
| `rainStrength` | float | 雨强度 (0-1) |
| `wetness` | float | 湿润程度 (0-1) |
| `isWet` | bool | 是否下雨 |

---

## 实战：使用时间 Uniform

### 创建动态闪烁效果

```glsl
#version 330 core

in vec2 TexCoord;
in vec3 Color;
uniform sampler2D DiffuseSampler;
uniform float frameTime;        // 导入时间
uniform float frameCounter;     // 导入帧计数

out vec4 fragColor;

void main() {
    // 采样纹理
    vec4 texColor = texture(DiffuseSampler, TexCoord);

    // 创建闪烁效果：0.8 + 0.2 * sin(time)
    float flicker = 0.8 + 0.2 * sin(frameTime * 10.0);

    // 混合闪烁
    fragColor = texColor * vec4(Color, 1.0) * flicker;
}
```

---

## 实战：使用光照 Uniform

### 创建阳光方向感知的着色器

```glsl
#version 330 core

in vec2 TexCoord;
in vec3 Normal;              // 导入法线
in vec3 Color;
uniform sampler2D DiffuseSampler;
uniform vec3 sunPosition;    // 导入太阳位置

out vec4 fragColor;

void main() {
    vec4 texColor = texture(DiffuseSampler, TexCoord);

    // 归一化太阳方向
    vec3 sunDir = normalize(sunPosition);

    // 计算漫反射
    float diffuse = max(dot(Normal, sunDir), 0.0);

    // 环境光 + 漫反射
    float light = 0.3 + diffuse * 0.7;

    fragColor = texColor * vec4(Color, 1.0) * light;
}
```

---

## 实战：使用天气 Uniform

### 创建下雨时的效果

```glsl
#version 330 core

in vec2 TexCoord;
in vec3 Color;
uniform sampler2D DiffuseSampler;
uniform float rainStrength;    // 雨强度

out vec4 fragColor;

void main() {
    vec4 texColor = texture(DiffuseSampler, TexCoord);

    // 下雨时降低饱和度，增加蓝色调
    vec3 rainyColor = mix(texColor.rgb, texColor.rgb * vec3(0.7, 0.8, 1.0), rainStrength);

    // 下雨时变暗
    float darken = 1.0 - rainStrength * 0.3;
    rainyColor *= darken;

    fragColor = vec4(rainyColor * Color, texColor.a);
}
```

---

## 纹理 Uniform

Iris 提供了多个纹理采样器：

### GBuffer 纹理

| Uniform | 类型 | 说明 |
|---------|------|------|
| `DiffuseSampler` | sampler2D | 漫反射纹理 |
| `LightMapSampler` | sampler2D | 光照图纹理 |
| `SmoothSampler` | sampler2D | 平滑纹理 |
| `NearestSampler` | sampler2D | 最近邻采样纹理 |

### 自定义纹理

通过配置文件可以添加自定义纹理：

```properties
# textures.properties
texture.noise=noise.png
texture.gradient=gradient.png
```

然后在着色器中使用：

```glsl
uniform sampler2D NOISE;    // noise.png
uniform sampler2D GRADIENT; // gradient.png
```

---

## 深度 Uniform

### 获取深度值

```glsl
#version 330 core

// 深度采样器
uniform sampler2D depthtex0;   // 主深度（不含半透明）
uniform sampler2D depthtex1;   // 不含半透明物体深度
uniform sampler2D depthtex2;   // 不含手部深度

// 深度转线性
float getLinearDepth(float depth) {
    float near = 0.05;
    float far = 1000.0;
    float z = depth * 2.0 - 1.0;
    return (2.0 * near * far) / (far + near - z * (far - near));
}

out vec4 fragColor;

void main() {
    // 读取深度
    float depth = texture(depthtex0, gl_FragCoord.xy / viewSize).r;

    // 转为线性深度
    float linearDepth = getLinearDepth(depth);

    // 可视化深度
    fragColor = vec4(vec3(depth), 1.0);
}
```

---

## 矩阵 Uniform

### 可用的矩阵 Uniform

| Uniform | 类型 | 说明 |
|---------|------|------|
| `ModelViewMatrix` | mat4 | 模型-视图矩阵 |
| `ProjectionMatrix` | mat4 | 投影矩阵 |
| `ModelViewProjectionMatrix` | mat4 | MVP 矩阵 |

### 使用矩阵进行坐标变换

```glsl
#version 330 core

in vec3 Position;
in vec3 Normal;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

// 输出到片元着色器
out vec3 vNormal;
out vec3 vPosition;

void main() {
    vNormal = Normal;
    vPosition = Position;

    // 计算最终位置
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Position, 1.0);
}
```

---

## 调试 Uniform

### 常用调试技巧

```glsl
#version 330 core

uniform float frameTime;
uniform float rainStrength;
uniform vec3 sunPosition;

out vec4 fragColor;

void main() {
    // 调试：输出帧时间来确认 uniform 工作
    fragColor = vec4(fract(frameTime), 0.0, 0.0, 1.0);

    // 或者：输出太阳位置
    // fragColor = vec4(sunPosition * 0.5 + 0.5, 1.0);

    // 或者：输出雨强度
    // fragColor = vec4(rainStrength, 0.0, 0.0, 1.0);
}
```

---

## 常见问题

### 1. Uniform 值为 0

- 检查 uniform 名称是否正确（大小写敏感）
- 确保着色器文件被正确加载

### 2. 纹理采样返回黑色

- 检查 sampler uniform 名称
- 确认纹理已绑定

### 3. 动画不工作

- 确认 `frameTime` 在片元着色器中使用
- 检查是否忘记声明 uniform

---

## 练习

### 练习 1：创建呼吸效果

使用 `frameTime` 创建一个方块颜色周期性变化的呼吸效果。

### 练习 2：雨天特效

使用 `rainStrength` 创建一个下雨时颜色变暗、偏蓝的效果。

### 练习 3：跟随太阳旋转

使用 `sunPathRotation` 创建一个与太阳同步旋转的效果。

---

## 下一步

- [第六章：后处理效果入门](06-postprocessing-basics.md) - 创建合成着色器
- [第四章：ShaderPack 结构](04-shaderpack-structure.md) - 了解更多配置

---

*教程版本：Iris 1.7.x / Minecraft 1.21*
