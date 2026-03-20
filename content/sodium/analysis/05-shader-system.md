# Sodium 着色器系统

> 自定义 GLSL 着色器与顶点格式优化

## 1. 概述

Sodium 使用自定义 GLSL 着色器实现高级渲染效果，包括抗锯齿、雾渲染优化和顶点压缩。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `ChunkShader` | `common/.../render/chunk/shader/ChunkShader.java` |
| `ShaderConstants` | `common/.../gl/shader/ShaderConstants.java` |
| `ShaderLoader` | `common/.../gl/shader/ShaderLoader.java` |
| `GlShader` | `common/.../gl/shader/GlShader.java` |

**着色器文件**：

| 文件 | 路径 |
|------|------|
| `rendertype_solid.vsh` | `common/.../resources/assets/sodium/shaders/` |
| `rendertype_solid.fsh` | `common/.../resources/assets/sodium/shaders/` |
| `rendertype_cutout.vsh` | `common/.../resources/assets/sodium/shaders/` |
| `rendertype_translucent.vsh` | `common/.../resources/assets/sodium/shaders/` |

---

## 2. 着色器资源结构

### 2.1 资源路径

```
common/src/main/resources/
└── assets/
    └── sodium/
        └── shaders/
            ├── include/
            │   ├── common.glsl           # 共享代码
            │   ├── fog.glsl              # 雾函数
            │   ├── vertex_attribute.glsl # 顶点属性
            │   └── noise.glsl            # 噪声函数
            ├── blocks/
            │   ├── rendertype_solid.vsh
            │   ├── rendertype_solid.fsh
            │   ├── rendertype_cutout.vsh
            │   ├── rendertype_cutout.fsh
            │   ├── rendertype_translucent.vsh
            │   ├── rendertype_translucent.fsh
            │   └── ...
            └── environment/
                ├── sky.glsl
                └── clouds.glsl
```

---

## 3. 顶点着色器

### 3.1 Solid 顶点着色器

```glsl
#version 450

// 包含顶点属性定义
#include <vertex_attribute.glsl>

// 包含雾函数
#include <fog.glsl>

// Uniform 块
layout(std140) uniform Uniforms {
    mat4 u_ModelViewMatrix;
    mat4 u_ProjectionMatrix;
    mat4 u_ModelViewProjectionMatrix;
    vec4 u_FogColor;
    vec2 u_FogScale;
    float u_FogStart;
    float u_FogEnd;
    float u_FogShape;
    vec4 u_AmbientLight;
    vec4 u_BlockLight;
    
    #ifdef USE_RGSS
    vec4 u_RGSSSamples[4];
    float u_RGSSKernel[16];
    #endif
};

// 实例数据
layout(location = 5) in ivec4 a_Flags;

// 顶点输出
out float v_ao;
out float v_Light;
out vec2 v_Uv;
out vec4 v_Color;
out vec3 v_Pos;
out vec3 v_Normal;

// 雾参数输出
out float v_FogStart;
out float v_FogEnd;
out float v_FogColor;
out float v_FogShape;

void main() {
    // 解码位置
    ivec2 packedPos = ivec2(a_Pos >> 16, a_Pos & 0xFFFF);
    vec3 position = vec3(packedPos, a_Pos_Mid) * (1.0 / 4096.0);
    
    // 计算顶点坐标
    vec4 pos = u_ModelViewMatrix * vec4(position, 1.0);
    gl_Position = u_ProjectionMatrix * pos;
    
    // 解码法线
    vec3 normal = decodeNormalizedNormal(a_Normal);
    
    // 解码光照
    float blockLight = unpackUnorm(a_Light, 0) * 15.0 / 16.0;
    float skyLight = unpackUnorm(a_Light, 4) * 15.0 / 16.0;
    v_Light = mix(u_BlockLight, u_AmbientLight, skyLight) * (0.8 + blockLight * 0.2);
    
    // 解码 AO
    v_ao = float((a_Flags.x >> 16) & 0xFF) / 255.0;
    
    // 纹理坐标
    v_Uv = a_Uv * (1.0 / 16.0);
    
    // 颜色
    v_Color = unpackSnorm4x8(a_Color) * (1.0 / 127.0);
    
    // 法线
    v_Normal = normal;
    
    // 位置（用于雾计算）
    v_Pos = pos.xyz;
    
    // 雾
    v_FogStart = u_FogStart;
    v_FogEnd = u_FogEnd;
    v_FogColor = u_FogColor;
    v_FogShape = u_FogShape;
}
```

---

## 4. 片段着色器

### 4.1 Solid 片段着色器

```glsl
#version 450

// 包含雾函数
#include <fog.glsl>

// Uniform 块
layout(std140) uniform Uniforms {
    mat4 u_ModelViewMatrix;
    mat4 u_ProjectionMatrix;
    mat4 u_ModelViewProjectionMatrix;
    vec4 u_FogColor;
    vec2 u_FogScale;
    float u_FogStart;
    float u_FogEnd;
    float u_FogShape;
    vec4 u_AmbientLight;
    vec4 u_BlockLight;
    
    #ifdef USE_RGSS
    vec4 u_RGSSSamples[4];
    float u_RGSSKernel[16];
    #endif
};

// 顶点输入
in float v_ao;
in float v_Light;
in vec2 v_Uv;
in vec4 v_Color;
in vec3 v_Pos;
in vec3 v_Normal;

// 雾输入
in float v_FogStart;
in float v_FogEnd;
in float v_FogColor;
in float v_FogShape;

// 纹理采样器
uniform sampler2D u_Texture;

// 片段输出
layout(location = 0) out vec4 out_Color;

void main() {
    // 采样纹理
    vec4 color = texture(u_Texture, v_Uv);
    
    // Alpha 测试（裁剪）
    if (color.a < 0.1) {
        discard;
    }
    
    // 应用光照
    color.rgb *= v_Light;
    
    // 应用 AO
    color.rgb *= mix(1.0, v_ao, 0.65);
    
    // 应用顶点颜色
    color *= v_Color;
    
    // 应用雾
    color = applyFog(color, v_Pos.z, v_FogStart, v_FogEnd, v_FogColor, v_FogShape);
    
    out_Color = color;
}
```

---

## 5. 雾函数实现

### 5.1 Fog.glsl

```glsl
// 雾函数实现
vec4 applyFog(vec4 color, float viewDepth, 
              float fogStart, float fogEnd, 
              vec4 fogColor, float fogShape) {
    
    // 根据雾形状参数调整计算
    float fogSize = mix(fogEnd, fogStart, fogShape);
    float fogFactor = clamp((viewDepth - fogSize) / (fogEnd - fogSize), 0.0, 1.0);
    
    // 平滑雾
    fogFactor = fogFactor * fogFactor * (3.0 - 2.0 * fogFactor);
    
    // 混合颜色
    return mix(color, fogColor, fogFactor);
}

// 雾缩放计算
vec2 calculateFogScale(float fogEnd, float fogStart, float fogShape) {
    float fogRange = max(fogEnd - fogStart, 1e-5);
    return vec2(1.0 / fogRange, -fogStart / fogRange);
}
```

---

## 6. 顶点格式

### 6.1 Vanilla 格式（24 bytes）

```startLine:1:60:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/vertex/format/ChunkVertexType.java
public enum ChunkVertexType {
    VANILLA(24) {
        @Override
        public ChunkVertexEncoder createEncoder() {
            return (ptr, materialBits, vertices, sectionIndex) -> {
                for (Vertex vertex : vertices) {
                    // 位置: 3 floats = 12 bytes
                    memPutFloat(ptr + 0, vertex.x);
                    memPutFloat(ptr + 4, vertex.y);
                    memPutFloat(ptr + 8, vertex.z);
                    
                    // 颜色: 4 bytes
                    memPutInt(ptr + 12, vertex.color);
                    
                    // UV: 2 floats = 8 bytes
                    memPutFloat(ptr + 16, vertex.u);
                    memPutFloat(ptr + 20, vertex.v);
                    
                    ptr += 24;
                }
            };
        }
    }
}
```

### 6.2 IMMIX 格式（16 bytes，优化格式）

```startLine:60:120:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/vertex/format/ChunkVertexType.java
    IMMIX(16) {
        @Override
        public ChunkVertexEncoder createEncoder() {
            return (ptr, materialBits, vertices, sectionIndex) -> {
                for (Vertex vertex : vertices) {
                    // 位置: 3 half-floats = 6 bytes
                    memPutShort(ptr + 0, floatToHalf(vertex.x));
                    memPutShort(ptr + 2, floatToHalf(vertex.y));
                    memPutShort(ptr + 4, floatToHalf(vertex.z));
                    
                    // 颜色 + AO: 4 bytes
                    int colorAo = packColorAo(vertex.color, vertex.ao);
                    memPutInt(ptr + 6, colorAo);
                    
                    // UV + 光照: 4 bytes
                    int uvLight = packUvLight(vertex.u, vertex.v, vertex.light);
                    memPutInt(ptr + 10, uvLight);
                    
                    // 法线: 2 bytes
                    memPutShort(ptr + 14, encodeNormal(vertex.normal));
                    
                    ptr += 16;
                }
            };
        }
    }
}
```

### 6.3 顶点编码工具

```startLine:1:50:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/vertex/format/ChunkVertexEncoder.java
public interface ChunkVertexEncoder {
    long write(long ptr, int materialBits, Vertex[] vertices, int sectionIndex);
    
    class Vertex {
        public float x, y, z;
        public int color;          // ABGR
        public float ao;           // [0, 1]
        public float u, v;
        public int light;          // 天空 + 阻塞光
        public Vec3f normal;
    }
    
    static int packColorAo(int color, float ao) {
        int aoByte = (int)(ao * 255.0f);
        return (aoByte << 24) | (color & 0x00FFFFFF);
    }
    
    static int packUvLight(float u, float v, int light) {
        int uByte = (int)(u * 65535.0f);
        int vByte = (int)(v * 65535.0f);
        return ((uByte & 0xFFFF) << 16) | (vByte & 0xFFFF);
    }
    
    static short floatToHalf(float value) {
        // IEEE 754 float to half conversion
        int bits = Float.floatToIntBits(value);
        int sign = (bits >> 16) & 0x8000;
        int exponent = ((bits >> 23) & 0xFF) - 127 + 15;
        int mantissa = (bits >> 13) & 0x3FF;
        
        if (exponent <= 0) return (short)sign;
        if (exponent > 30) return (short)(sign | 0x7C00);
        
        return (short)(sign | (exponent << 10) | mantissa);
    }
}
```

---

## 7. 着色器管理

### 7.1 ChunkShader

```startLine:1:80:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/render/chunk/shader/ChunkShader.java
public class ChunkShader implements AutoCloseable {
    private final GlShader vertexShader;
    private final GlShader fragmentShader;
    private final GlProgram program;
    
    // Uniform 位置
    private final int u_ModelViewMatrix;
    private final int u_ProjectionMatrix;
    private final int u_ModelViewProjectionMatrix;
    private final int u_FogColor;
    private final int u_FogScale;
    private final int u_Texture;
    
    public ChunkShader(ShaderLoader loader) {
        this.vertexShader = loader.loadVertexShader("rendertype_solid.vsh");
        this.fragmentShader = loader.loadFragmentShader("rendertype_solid.fsh");
        this.program = GlProgram.create("rendertype_solid", 
                                        vertexShader, fragmentShader);
        
        // 缓存 Uniform 位置
        this.u_ModelViewMatrix = program.getUniform("u_ModelViewMatrix");
        this.u_ProjectionMatrix = program.getUniform("u_ProjectionMatrix");
        // ...
    }
    
    public void bind(CommandList commandList) {
        commandList.bindShader(program);
    }
    
    public void unbind(CommandList commandList) {
        commandList.unbindShader();
    }
    
    public void uploadUniforms(CommandList commandList, UniformData data) {
        commandList.setUniform(u_ModelViewMatrix, data.modelViewMatrix);
        commandList.setUniform(u_ProjectionMatrix, data.projectionMatrix);
        commandList.setUniform(u_FogColor, data.fogColor);
        // ...
    }
}
```

### 7.2 ShaderLoader

```startLine:1:60:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/gl/shader/ShaderLoader.java
public class ShaderLoader {
    private static final String SHADER_PATH = "assets/sodium/shaders";
    
    public GlShader loadVertexShader(String name) {
        String source = loadShaderSource("blocks/" + name);
        return GlShader.create(GL_VERTEX_SHADER, name, preprocess(source));
    }
    
    public GlShader loadFragmentShader(String name) {
        String source = loadShaderSource("blocks/" + name);
        return GlShader.create(GL_FRAGMENT_SHADER, name, preprocess(source));
    }
    
    private String loadShaderSource(String path) {
        InputStream stream = getClass().getResourceAsStream("/" + SHADER_PATH + "/" + path);
        return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    }
    
    private String preprocess(String source) {
        // 处理 #include 指令
        return source.replaceAll("#include\\s+\"([^\"]+)\"", 
                                 match -> loadInclude(match.group(1)));
    }
}
```

---

## 8. 着色器常量

### 8.1 ShaderConstants

```startLine:1:40:D:/Projects/sodium/common/src/main/java/net/caffeinemc/mods/sodium/client/gl/shader/ShaderConstants.java
public class ShaderConstants {
    // 着色器宏定义
    public static final String USE_FOG = "USE_FOG";
    public static final String USE_FRAGMENT_DISCARD = "USE_FRAGMENT_DISCARD";
    public static final String USE_VERTEX_COMPRESSION = "USE_VERTEX_COMPRESSION";
    public static final String USE_RGSS = "USE_RGSS";
    public static final String USE_ENTITY_CLOUD = "USE_ENTITY_CLOUD";
    
    // 抗锯齿模式
    public enum AntiAliasing {
        NONE(0),
        MSAA4X(4),
        MSAA8X(8),
        RGSS(4);  // Rotated Grid Super-Sampling
        
        public final int samples;
    }
}
```

### 8.2 Uniform 定义

```java
layout(std140) uniform Uniforms {
    mat4 u_ModelViewMatrix;              // 模型视图矩阵
    mat4 u_ProjectionMatrix;              // 投影矩阵
    mat4 u_ModelViewProjectionMatrix;   // MVP 矩阵
    vec4 u_FogColor;                     // 雾颜色
    vec2 u_FogScale;                     // 雾缩放
    float u_FogStart;                    // 雾起始距离
    float u_FogEnd;                      // 雾结束距离
    float u_FogShape;                    // 雾形状参数
    vec4 u_AmbientLight;                 // 环境光
    vec4 u_BlockLight;                   // 方块光
};
```

---

## 9. 性能优化特性

| 特性 | 实现方式 | 效果 |
|------|----------|------|
| **顶点压缩** | Half-float 代替 float | 减少 33% 带宽 |
| **Include 预处理** | GLSL #include | 代码复用 |
| **Uniform 缓存** | 预缓存位置 | 减少查询 |
| **批量 Uniform** | std140 布局 | 减少设置调用 |
| **RGSS 抗锯齿** | 着色器内采样 | 平滑边缘 |

---

## 10. OpenGL 要求

| 要求 | 版本 | 说明 |
|------|------|------|
| **最低版本** | OpenGL 3.3 | 基本的顶点属性 |
| **推荐版本** | OpenGL 4.5 | SPIR-V 支持 |
| **可选扩展** | GL_ARB_gl_spirv | SPIR-V 着色器 |
| **可选扩展** | GL_ARB_vertex_attrib_64bit | 64-bit 属性 |

---

## 11. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-chunk-render-system.md](02-chunk-render-system.md) - 区块渲染系统
- [04-render-pipeline.md](04-render-pipeline.md) - 渲染管线

---

*生成时间: 2026-03-19*
