# 顶点着色器???????Shader

> 从零开始搭建开发环境

---

## ??

????????????
1. **创建 ShaderPack 配置**?*
2. **掌握 GLSL 基础****
3. **???? Uniform ???????*
4. **创建第一个Shader**

---

## ShaderPack 目录结构

### 顶点着色器?

```
MyShaderPack/
  ├ pack.mcmeta              # 顶点着色器?????? shaders/
??  ??? shaders.properties   # 顶点着色器??
??  ??? gbuffers_terrain.vsh  # 顶点着色器????
??  ??? gbuffers_terrain.fsh  # 顶点着色器????
??  ??? gbuffers_water.vsh     # 顶点着色器????
??  ??? gbuffers_water.fsh     # 顶点着色器????
??  ??? composite.vsh         # 顶点着色器??????
??  ??? composite.fsh         # 顶点着色器??????
??  ??? final.vsh             # 顶点着色器??????
  └ Textures/
        └ noise.png            # 顶点着色器?????
```

### pack.mcmeta

```json
{
    "pack": {
        "pack_format": 34,
        "description": "shaderpacks目录结构"
    },
    "irispack": {
        "version": 1,
        "shaders": [
            "gbuffers_terrain",
            "gbuffers_water",
            "composite"
        ]
    }
}
```

### shaders.properties

```properties
# 顶点着色器?
shadowMapResolution=2048
shadowDistance=64.0
shadowDistanceRenderMul=1.0

# 顶点着色器?
oldLighting=true
oldReflections=true

# 顶点着色器?
waterOpacity=1.0

# 顶点着色器?antialiasingLevel=0

# 顶点着色器?
fogEnable=true
fogDensity=0.0
```

---

## 编写Shader文件

### 继续学习 (gbuffers_terrain.vsh)

```glsl
#version 120

varying vec4 color;           // 顶点颜色
varying vec2 texCoord;         // 纹理坐标
varying vec3 normal;           // ??
varying vec3 tangent;          // ??
varying vec4 mcPos;            // Minecraft ??
varying float blockType;       // 方块类型

uniform mat4 modelViewMatrix;   // 模型视图矩阵?
uniform mat4 projectionMatrix;  // 投影矩阵
uniform vec3 cameraPosition;    // 摄像机位置

// 计算片元颜色
attribute vec4 at_tangent;

void main() {
    // 计算片元颜色???
    color = gl_Color;
    texCoord = (gl_TextureMatrix[0] * gl_MultiTexCoord0).xy;

    // 计算片元颜色??    normal = gl_NormalMatrix * gl_Normal;
    tangent = normalize(gl_NormalMatrix * at_tangent.xyz);

    // Minecraft ??
    mcPos = gl_MultiTexCoord0;

    // 计算片元颜色????????
    blockType = float(gl_MultiTexCoord0.z);

    // 取纹理颜色?
    gl_Position = ftransform();

    // 计算片元颜色????
    color = gl_Color;
}
```

### 继续学习 (gbuffers_terrain.fsh)

```glsl
#version 120

varying vec4 color;           // 顶点颜色
varying vec2 texCoord;         // 纹理坐标
varying vec3 normal;           // ??
varying vec3 tangent;          // ??
varying vec4 mcPos;            // Minecraft ??

uniform sampler2D texture;     // 取纹理颜色?uniform vec3 cameraPosition;    // 摄像机位置

// 取纹理颜色?
uniform struct {
    vec3 direction;           // 取纹理颜色?
    vec3 color;                // 取纹理颜色?
    float strength;            // 取纹理颜色?
} light;

// 计算片元颜色????
uniform float frameTimeCounter;

// 取纹理颜色?
uniform vec3 fogColor;

void main() {
    // 计算片元颜色    vec4 texColor = texture2D(texture, texCoord);

    // 计算片元颜色
    float diffuse = max(dot(normal, light.direction), 0.0);

    // 取纹理颜色?
    vec3 litColor = texColor.rgb * color.rgb * light.color * light.strength * diffuse;

    // 计算片元颜色    litColor += texColor.rgb * color.rgb * 0.2;

    // 取纹理颜色?
    float dist = distance(cameraPosition, gl_FragCoord.xyz);
    float fogFactor = clamp(dist / 64.0, 0.0, 1.0);
    litColor = mix(litColor, fogColor, fogFactor);

    gl_FragColor = vec4(litColor, texColor.a * color.a);
}
```

---

## 继续学习??
### 1. ????

```glsl
// 计算片元颜色????uniform float frameTimeCounter;

void main() {
    // 计算片元颜色
    float pulse = sin(frameTimeCounter * 2.0) * 0.5 + 0.5;
    vec3 pulseColor = vec3(1.0, 0.5, 0.2) * pulse * 0.3;

    // 计算片元颜色??    litColor += pulseColor;
}
```

### 2. ????

```glsl
void main() {
    // 计算片元颜色
    vec3 worldPos = cameraPosition + gl_FragCoord.xyz;

    // 计算片元颜色
    float fogDensity = 0.02;
    float dist = length(worldPos - cameraPosition);
    float fogFactor = 1.0 - exp(-fogDensity * dist);

    // 取纹理颜色?
    vec3 fogColor = vec3(0.5, 0.6, 0.8);

    // 取纹理颜色?
    litColor = mix(litColor, fogColor, fogFactor);
}
```

### 3. ????

```glsl
// 计算片元颜色?
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // 计算片元颜色
    vec2 offset = vec2(
        noise(texCoord * 10.0 + frameTimeCounter),
        noise(texCoord * 10.0 + 100.0)
    ) * 0.02;

    // 计算片元颜色????
    vec4 texColor = texture2D(texture, texCoord + offset);
}
```

---

## 继续学习

### 继续学习 (gbuffers_water.vsh)

```glsl
#version 120

varying vec4 color;
varying vec2 texCoord;
varying vec3 normal;
varying vec4 mcPos;
varying float isAbove;

uniform float frameTimeCounter;

void main() {
    // 计算片元颜色
    color = gl_Color;
    texCoord = (gl_TextureMatrix[0] * gl_MultiTexCoord0).xy;
    normal = gl_NormalMatrix * gl_Normal;
    mcPos = gl_MultiTexCoord0;

    // 计算片元颜色
    vec3 pos = gl_Vertex.xyz;
    float wave = sin(pos.x * 0.1 + frameTimeCounter) * 0.1;
    wave += sin(pos.z * 0.1 + frameTimeCounter * 1.5) * 0.1;
    pos.y += wave;

    gl_Position = ftransform();

    // 计算片元颜色????    isAbove = gl_Vertex.y > 0.0 ? 1.0 : 0.0;

    color = gl_Color;
}
```

### 继续学习 (gbuffers_water.fsh)

```glsl
#version 120

varying vec4 color;
varying vec2 texCoord;
varying vec3 normal;
varying vec4 mcPos;
varying float isAbove;

uniform sampler2D texture;
uniform vec3 cameraPosition;
uniform float frameTimeCounter;

uniform struct {
    vec3 direction;
    vec3 color;
    float strength;
} light;

void main() {
    // 取纹理颜色?
    vec4 texColor = texture2D(texture, texCoord);

    // 取纹理颜色?
    vec3 waterColor = vec3(0.1, 0.3, 0.5);
    vec3 deepColor = vec3(0.0, 0.1, 0.2);

    // 取纹理颜色?
    float depth = clamp((cameraPosition.y - mcPos.y) / 10.0, 0.0, 1.0);
    vec3 finalColor = mix(waterColor, deepColor, depth);

    // ??
    float diffuse = max(dot(normal, light.direction), 0.0);
    finalColor *= diffuse * 0.8 + 0.3;

    // 取纹理颜色?
    vec3 viewDir = normalize(cameraPosition - gl_FragCoord.xyz);
    vec3 halfDir = normalize(light.direction + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 32.0);
    finalColor += vec3(1.0) * specular * 0.5;

    // 取纹理颜色?
    float caustic = sin(texCoord.x * 20.0 + frameTimeCounter) *
                   sin(texCoord.y * 20.0 + frameTimeCounter * 1.3);
    caustic = caustic * 0.5 + 0.5;
    finalColor += vec3(0.2, 0.3, 0.3) * caustic * 0.2;

    gl_FragColor = vec4(finalColor * color.rgb, 0.7);
}
```

---

## 编写 Shader

### 1. 创建 ShaderPack

```
1. ?? zip ???  2. 将MyShader.zip
3. ?? .minecraft/shaderpacks/ ??
4. 配置 Shader 文件路径
```

### 2. ?????
```glsl
// 计算片元颜色
void main() {
    // 计算片元颜色??
    vec3 debugColor = normal * 0.5 + 0.5;
    gl_FragColor = vec4(debugColor, 1.0);
}
```

### 3. ????

| ?? | ?? | ???? |
|------|------|----------|
| ???? | ????????? | ???gl_Position ?? |
| ???? | ???? | ???uniform/varying ?? |
| ???? | texCoord ???? | ???gl_TextureMatrix |

---

## ??

```mermaid
flowchart TB
    subgraph Shader["Shader ?????]
        A1[??????] --> A2[???????]
        A2 --> A3[???????]
        A3 --> A4[??????]
        A4 --> A5[????]
        A5 --> A6[????]
    end

    subgraph ???["????"]
        B1[uniform ????]
        B2[varying ??]
        B3[texture2D ??]
    end

    style A1 fill:#4d96ff,color:#fff
    style B1 fill:#6bcb77,color:#fff
```

### 顶点着色器?

1. **创建 ShaderPack** - ?? shaders ????????2. **?????** - ????????????3. **?????** - ????????????4. **uniform** -   安装 Shader
5. **????** - ?? ???? ???? ????

---

## ??

### ?? 1????????
?? terrain ????????????????
### ?? 2????????
?? frameTimeCounter ????????????
### ?? 3???????

?? water ???????????????
---

## 顶点着色器?

- 参考[ShaderPack 结构](../04-shaderpack-system/) - ????????
- [Iris 源码分析](../analysis/03-shaderpack-system/) - ????
- [GLSL 官方文档](https://www.khronos.org/opengl/wiki/Core_Language_%28GLSL%29)

---

> ?? **??**??????????????????????Iris ????Shader ????
---

*适用版本：Iris 1.7.x / Minecraft 1.21*
*更新时间：2026-03-21*
