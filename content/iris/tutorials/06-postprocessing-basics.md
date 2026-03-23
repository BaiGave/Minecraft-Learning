# 第六章：后处理效果入门

> 创建合成着色器实现视觉效果

---

## 什么是后处理？

后处理（Post-Processing）是在场景渲染完成后，对最终图像进行效果处理的技术。

```
┌─────────────────────────────────────────────────────────────┐
│                      渲染管线                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐                                           │
│   │  GBuffer   │  ← 渲染场景到多个缓冲区                    │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │ Composite1  │  ← 后处理 Pass 1                         │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │ Composite2  │  ← 后处理 Pass 2                         │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │   Final    │  ← 最终输出到屏幕                          │
│   └─────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 合成着色器（Composite Shader）

### 命名规则

| 文件名 | 说明 |
|--------|------|
| `composite1.vsh` | 合成 Pass 1 顶点着色器 |
| `composite1.fsh` | 合成 Pass 1 片元着色器 |
| `composite2.vsh` | 合成 Pass 2 顶点着色器 |
| `composite2.fsh` | 合成 Pass 2 片元着色器 |

可以创建 `composite1` 到 `composite99`。

---

## 可用的 GBuffer 纹理

### 颜色纹理（colortex）

| 纹理 | 说明 |
|------|------|
| `colortex0` | 主颜色缓冲区 |
| `colortex1` | 法线/NRM |
| `colortex2` | 镜面/Specular |
| `colortex3-15` | 自定义缓冲区 |

### 深度纹理

| 纹理 | 说明 |
|------|------|
| `depthtex0` | 主深度（完整） |
| `depthtex1` | 不含半透明 |
| `depthtex2` | 不含手部 |

### 阴影纹理

| 纹理 | 说明 |
|------|------|
| `shadowtex0` | 阴影深度 |
| `shadowcolor0` | 阴影颜色 |

---

## 第一个合成着色器

### 创建文件

```
my-shaderpack/
└── shaders/
    ├── gbuffers_terrain.fsh           # 地形着色器
    ├── composite1.vsh                 # 合成顶点着色器
    └── composite1.fsh                 # 合成片元着色器
```

### 顶点着色器 (composite1.vsh)

```glsl
#version 330 core

out vec2 texCoord;

void main() {
    // 生成全屏四边形的纹理坐标
    vec2 position = vec2(
        (gl_VertexID & 1) * 2,
        (gl_VertexID >> 1) * 2
    ) - 1.0;

    texCoord = position * 0.5 + 0.5;

    gl_Position = vec4(position, 0.0, 1.0);
}
```

### 片元着色器 (composite1.fsh)

```glsl
#version 330 core

uniform sampler2D colortex0;      // 主颜色
uniform vec2 viewSize;           // 视图大小

in vec2 texCoord;
out vec4 fragColor;

void main() {
    // 采样主颜色
    vec4 color = texture(colortex0, texCoord);

    // 增加一点亮度
    color.rgb *= 1.1;

    fragColor = color;
}
```

---

## 实战：创建晕影效果

### 晕影（Vignette）效果

```glsl
#version 330 core

uniform sampler2D colortex0;
uniform vec2 viewSize;

in vec2 texCoord;
out vec4 fragColor;

void main() {
    // 采样场景
    vec4 color = texture(colortex0, texCoord);

    // 计算到中心的距离
    vec2 center = vec2(0.5);
    float dist = distance(texCoord, center);

    // 晕影强度
    float vignette = smoothstep(0.8, 0.4, dist);

    // 应用晕影
    color.rgb *= vignette;

    fragColor = color;
}
```

---

## 实战：创建色差效果

### 色彩偏移（Chromatic Aberration）

```glsl
#version 330 core

uniform sampler2D colortex0;
uniform vec2 viewSize;
uniform float frameTime;          // 用于动画

in vec2 texCoord;
out vec4 fragColor;

void main() {
    // 色差强度（随时间变化）
    float aberration = 0.003 + 0.001 * sin(frameTime * 2.0);

    // 偏移方向（从中心向外）
    vec2 direction = texCoord - vec2(0.5);
    float dist = length(direction);

    // 分离 RGB 通道
    vec2 offset = direction * dist * aberration;

    float r = texture(colortex0, texCoord + offset).r;
    float g = texture(colortex0, texCoord).g;
    float b = texture(colortex0, texCoord - offset).b;

    fragColor = vec4(r, g, b, 1.0);
}
```

---

## 实战：创建模糊效果

### 多级模糊

```glsl
#version 330 core

uniform sampler2D colortex0;
uniform vec2 viewSize;
uniform float frameTime;

in vec2 texCoord;
out vec4 fragColor;

// 9x9 高斯模糊核
const int kernelSize = 4;
const float weights[9] = float[](
    0.0162162162, 0.0540540541, 0.1216216216, 0.1945945946,
    0.2270270270,
    0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162
);

void main() {
    // 纹素大小
    vec2 texelSize = 1.0 / viewSize;

    vec4 color = vec4(0.0);

    // 水平模糊
    for (int i = -kernelSize; i <= kernelSize; i++) {
        vec2 offset = vec2(float(i) * texelSize.x, 0.0);
        color += texture(colortex0, texCoord + offset) * weights[kernelSize + i];
    }

    fragColor = color;
}
```

---

## 深度应用：景深效果

### Depth of Field（景深）

```glsl
#version 330 core

uniform sampler2D colortex0;
uniform sampler2D depthtex0;     // 深度纹理
uniform vec2 viewSize;
uniform float frameTime;

in vec2 texCoord;
out vec4 fragColor;

const float FOCUS_DISTANCE = 0.1;  // 焦点距离
const float FOCUS_RANGE = 0.05;    // 焦点范围
const int BLUR_SAMPLES = 8;         // 模糊采样数

void main() {
    // 读取深度并转为线性
    float depth = texture(depthtex0, texCoord).r;
    float linearDepth = depth * 1000.0;  // 简化的线性转换

    // 计算模糊半径
    float coc = abs(linearDepth - FOCUS_DISTANCE) / FOCUS_RANGE;
    coc = clamp(coc, 0.0, 1.0);

    // 如果不在焦点上，应用模糊
    if (coc > 0.0) {
        vec2 texelSize = 1.0 / viewSize;
        vec4 color = vec4(0.0);
        float total = 0.0;

        for (int i = 0; i < BLUR_SAMPLES; i++) {
            float angle = float(i) / float(BLUR_SAMPLES) * 6.28318;
            vec2 offset = vec2(cos(angle), sin(angle)) * texelSize * coc * 10.0;
            color += texture(colortex0, texCoord + offset);
            total += 1.0;
        }

        fragColor = color / total;
    } else {
        fragColor = texture(colortex0, texCoord);
    }
}
```

---

## 最终着色器（Final Shader）

`final.vsh` / `final.fsh` 是最后一个处理的着色器，用于最终的屏幕输出。

### 示例：伽马校正

```glsl
#version 330 core

uniform sampler2D colortex0;

in vec2 texCoord;
out vec4 fragColor;

void main() {
    vec4 color = texture(colortex0, texCoord);

    // 伽马校正（2.2）
    color.rgb = pow(color.rgb, vec3(1.0 / 2.2));

    fragColor = color;
}
```

---

## 多 Pass 组合

### Pass 1: 模糊

```glsl
// composite1.fsh - 高斯模糊
uniform sampler2D colortex0;
uniform vec2 viewSize;
in vec2 texCoord;
out vec4 fragColor;

void main() {
    vec2 texelSize = 1.0 / viewSize;
    vec4 color = texture(colortex0, texCoord);

    // 简单模糊
    color += texture(colortex0, texCoord + vec2(texelSize.x, 0)) * 0.5;
    color += texture(colortex0, texCoord - vec2(texelSize.x, 0)) * 0.5;

    fragColor = color / 2.0;
}
```

### Pass 2: 叠加

```glsl
// composite2.fsh - 与原图叠加
uniform sampler2D colortex0;  // 已处理（模糊）
uniform sampler2D colortex1;  // 未处理（原始）
in vec2 texCoord;
out vec4 fragColor;

void main() {
    vec4 blurred = texture(colortex0, texCoord);
    vec4 original = texture(colortex1, texCoord);

    // 叠加效果
    fragColor = mix(original, blurred, 0.5);
}
```

---

## 常用内置 Uniform

| Uniform | 类型 | 说明 |
|---------|------|------|
| `colortex[0-15]` | sampler2D | 颜色缓冲区 |
| `depthtex[0-2]` | sampler2D | 深度缓冲区 |
| `shadowtex[0-1]` | sampler2D | 阴影缓冲区 |
| `shadowcolor[0-7]` | sampler2D | 阴影颜色缓冲区 |
| `viewSize` | vec2 | 视图分辨率 |
| `frameTime` | float | 帧时间 |
| `frameCounter` | int | 帧计数 |

---

## 常见问题

### 1. 效果不显示

- 检查文件名是否正确（`composite1` 不是 `composite`）
- 确保有顶点着色器和片元着色器

### 2. 纹理采样错误

- 确认纹理在正确的 Pass 中可用
- GBuffer 纹理在 composite 中可用

### 3. 性能问题

- 减少采样次数
- 使用近似算法代替精确计算

---

## 练习

### 练习 1：创建晕影效果

创建一个简单的屏幕晕影效果。

### 练习 2：创建颜色分级

调整图像的颜色等级（增加对比度、饱和度）。

### 练习 3：创建动态效果

使用 `frameTime` 创建一个随时间变化的波纹效果。

---

## 下一步

- [分析文档](/iris/analysis/) - 深入了解 Iris 内部机制
- [第三章：创建第一个 Shader](/iris/tutorials/03-create-simple-shader.md) - 回顾基础

---

*教程版本：Iris 1.7.x / Minecraft 1.21*
