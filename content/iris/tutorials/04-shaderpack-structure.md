# 第四章：ShaderPack 结构详解

> 理解完整的光影包文件结构

---

## ShaderPack 是什么？

ShaderPack（光影包）是一个包含着色器文件、配置文件和资源的压缩包或文件夹，用于修改 Minecraft 的视觉效果。

### 文件夹结构 vs ZIP 结构

```
文件夹结构                          ZIP 结构
┌─────────────────────┐           ┌─────────────────────┐
│ my-shaderpack/      │           │ my-shaderpack.zip  │
│ ├── shaders/        │           │ ├── shaders/        │
│ │   ├── *.vsh       │           │ │   ├── *.vsh       │
│ │   └── *.fsh       │           │ │   └── *.fsh       │
│ ├── lang/           │           │ ├── lang/            │
│ └── *.properties    │           │ └── *.properties    │
└─────────────────────┘           └─────────────────────┘
```

---

## 完整目录结构

```
Sildurs-Vibrant-Shaders/           # 光影包根目录
│
├── shaders/                       # 【核心】所有着色器文件
│   │
│   ├── gbuffers_terrain.vsh      # 地形顶点着色器
│   ├── gbuffers_terrain.fsh      # 地形片元着色器
│   ├── gbuffers_water.vsh        # 水顶点着色器
│   ├── gbuffers_water.fsh        # 水片元着色器
│   ├── gbuffers_entities.vsh      # 实体顶点着色器
│   ├── gbuffers_entities.fsh      # 实体片元着色器
│   ├── gbuffers_skybasic.vsh      # 天空基础顶点着色器
│   ├── gbuffers_skybasic.fsh      # 天空基础片元着色器
│   ├── composite1.vsh            # 合成着色器 1
│   ├── composite1.fsh             # 合成着色器 1
│   ├── composite2.vsh            # 合成着色器 2
│   ├── composite2.fsh
│   ├── shadow.vsh                 # 阴影顶点着色器
│   ├── shadow.fsh                 # 阴影片元着色器
│   ├── final.vsh                  # 最终着色器
│   ├── final.fsh                 # 最终片元着色器
│   │
│   └── shadow.glsl                # 【可选】共享代码
│
├── lang/                          # 【可选】语言文件
│   ├── en_us.json                 # 英文
│   └── zh_cn.json                 # 中文
│
├── shaders.properties              # 【重要】配置文件
├── dimension.properties            # 【可选】维度配置
├── block.properties               # 【可选】方块映射
├── entity.properties              # 【可选】实体映射
├── PART.png                       # 【可选】预览图
└── LICENSE                        # 【可选】许可证
```

---

## shaders/ 目录详解

### 着色器类型对照表

| 文件名模式 | 用途 | 渲染时机 |
|-----------|------|---------|
| `gbuffers_basic.*` | 基础几何 | 所有物体 |
| `gbuffers_terrain.*` | 地形 | 方块 |
| `gbuffers_water.*` | 水和岩浆 | 液体 |
| `gbuffers_entities.*` | 实体 | 怪物、动物 |
| `gbuffers_armor_glint.*` | 护甲闪光 | 附魔效果 |
| `gbuffers_particles.*` | 粒子 | 粒子效果 |
| `gbuffers_clouds.*` | 云朵 | 云 |
| `gbuffers_weather.*` | 天气 | 雨雪 |
| `gbuffers_skybasic.*` | 天空 | 天空盒 |
| `gbuffers_skytextured.*` | 纹理天空 | 云 |
| `gbuffers_textured_lit.*` | 发光方块 | 萤石、南瓜灯 |
| `composite[1-99].*` | 合成着色器 | 后处理 |
| `shadow.*` | 阴影着色器 | 阴影贴图 |
| `final.*` | 最终着色器 | 最后输出 |

---

## shaders.properties 详解

这是最重要的配置文件！

### 基本配置项

```properties
# 阴影配置
shadowMapResolution=2048          # 阴影贴图分辨率（数值越大越清晰）
shadowDistance=256               # 阴影渲染距离（单位：方块）

# 云朵配置
clouds=0                         # 0=原版 1=开 2=关
cloudHeight=128.0                # 云朵高度

# 光照配置
oldLighting=0.0                   # 0=新光照 1=旧光照

# 其他
weatherSpeedTweak=1.0            # 天气速度调整
sunPathRotation=0.0              # 太阳路径旋转
```

### 配置项详解

| 配置项 | 取值范围 | 默认值 | 说明 |
|--------|---------|--------|------|
| `shadowMapResolution` | 256-8192 | 1024 | 阴影分辨率 |
| `shadowDistance` | 16-1024 | 160 | 阴影距离 |
| `clouds` | 0/1/2 | 0 | 0=原版 1=开启 2=关闭 |
| `oldLighting` | 0.0-1.0 | 0.0 | 0=新版 1=旧版 |
| `sunPathRotation` | -180到180 | 0 | 太阳旋转角度 |

---

## 常见着色器程序

### 1. GBuffer 程序（几何缓冲）

这些着色器处理场景中的实际物体：

```glsl
// gbuffers_terrain.fsh 示例
#version 330 core

in vec2 TexCoord;
in vec3 Color;
uniform sampler2D DiffuseSampler;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(DiffuseSampler, TexCoord);
    fragColor = texColor * vec4(Color, 1.0);
}
```

### 2. Composite 程序（合成）

这些着色器处理后处理效果，可以访问所有 GBuffer 数据：

```glsl
// composite1.fsh 示例
#version 330 core

uniform sampler2D DiffuseSampler;      // colortex0 - 场景颜色
uniform sampler2D DepthSampler0;      // depthtex0 - 深度
uniform sampler2D DepthSampler1;      // depthtex1 - 地形深度

out vec4 fragColor;

void main() {
    vec4 color = texture(DiffuseSampler, gl_FragCoord.xy / viewSize);
    fragColor = color;
}
```

### 3. Shadow 程序（阴影）

渲染到阴影贴图：

```glsl
// shadow.vsh 示例
#version 330 core

uniform mat4 shadowModelViewMatrix;
uniform mat4 shadowProjectionMatrix;

in vec3 Position;

void main() {
    gl_Position = shadowProjectionMatrix * shadowModelViewMatrix * vec4(Position, 1.0);
}
```

---

## 维度配置 (dimension.properties)

可以为不同的世界维度设置不同的配置：

```properties
# 主世界配置
dimension.Overworld.weather.enable=true
dimension.Overworld.clouds=true

# 下界配置
dimension.TheNether.ambientLight=0.2
dimension.TheNether.fogDensity=0.1

# 末地配置
dimension.TheEnd.ambientLight=0.1
dimension.TheEnd.skyColor=0x000008
```

---

## ID 映射文件

### block.properties

映射方块属性，用于程序化着色：

```properties
# 格式：方块ID = 属性
# 属性：smooth, rough, special

minecraft:diamond_block=smooth
minecraft:cobblestone=rough
minecraft:glowstone=special:10.0
```

### entity.properties

映射实体 ID：

```properties
# 格式：实体名称 = ID

minecraft:pig=0
minecraft:cow=1
minecraft:creeper=2
```

---

## 共享代码 (.glsl)

可以使用 `.glsl` 文件存储共享代码：

### shadow.glsl

```glsl
// shadow.glsl - 阴影着色器使用的共享函数

const float shadowDistance = 160.0;
const float shadowMapSize = 2048.0;

float getShadow(vec3 position) {
    // 计算阴影强度
    return 1.0;
}
```

### 在着色器中使用

```glsl
#version 330 core

// 导入共享代码
// 第一行必须是 #include
#include "shadow.glsl"

uniform sampler2D shadowmap;

out vec4 fragColor;

void main() {
    float shadow = getShadow(vPosition);
    fragColor = vec4(shadow);
}
```

---

## 文件加载顺序

```
1. 加载 *.properties 文件
       ↓
2. 处理 #include 指令
       ↓
3. 编译顶点着色器
       ↓
4. 编译片元着色器
       ↓
5. 创建程序
       ↓
6. 渲染
```

---

## 实践：创建一个完整 ShaderPack

### 步骤 1：创建目录

```
MyShaderPack/
└── shaders/
```

### 步骤 2：添加配置文件

创建 `shaders.properties`：

```properties
shadowMapResolution=1024
shadowDistance=128
clouds=0
oldLighting=0.0
```

### 步骤 3：添加地形着色器

创建 `shaders/gbuffers_terrain.fsh`：

```glsl
#version 330 core

in vec2 TexCoord;
in vec3 Color;
uniform sampler2D DiffuseSampler;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(DiffuseSampler, TexCoord);
    fragColor = texColor * vec4(Color, 1.0) * 1.2;  // 增亮 20%
}
```

### 步骤 4：测试

将文件夹放入 `shaderpacks` 目录并测试！

---

## 下一步

- [第五章：Uniform 入门](05-uniform-basics.md) - 学习使用内置变量
- [第一章：Shader 基础](01-shader-basics.md) - 复习 GLSL 语法

---

*教程版本：Iris 1.7.x / Minecraft 1.21*
