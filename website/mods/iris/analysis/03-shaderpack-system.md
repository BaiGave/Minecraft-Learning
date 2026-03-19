# Iris 着色器包系统

> 加载、解析、预处理与程序管理

## 1. 概述

Iris 的着色器包系统负责加载、解析和预处理第三方光影包，实现与 OptiFine shadersmod 的兼容性。

**核心文件**：

| 文件 | 路径 |
|------|------|
| `ShaderPack` | `shaderpack/ShaderPack.java` |
| `ProgramSet` | `shaderpack/programs/ProgramSet.java` |
| `ProgramSource` | `shaderpack/programs/ProgramSource.java` |
| `IdMap` | `shaderpack/IdMap.java` |
| `ShaderProperties` | `shaderpack/properties/ShaderProperties.java` |
| `IncludeProcessor` | `shaderpack/include/IncludeProcessor.java` |
| `JcppProcessor` | `shaderpack/preprocessor/JcppProcessor.java` |

---

## 2. ShaderPack 核心结构

```startLine:68:100:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/ShaderPack.java
public class ShaderPack {
    // 程序集
    private final ProgramSet base;
    
    // ID 映射
    private final IdMap idMap;
    
    // 语言映射
    private final LanguageMap languageMap;
    
    // 自定义纹理
    private final EnumMap<TextureStage, Object2ObjectMap<String, CustomTextureData>> customTextureDataMap;
    private final CustomTextureData customNoiseTexture;
    
    // 自定义 Uniform
    public final CustomUniforms.Builder customUniforms;
    
    // 选项和菜单
    private final ShaderPackOptions shaderPackOptions;
    private final OptionMenuContainer menuContainer;
    private final ProfileSet.ProfileResult profile;
    
    // 功能标志
    private final Set<FeatureFlags> activeFeatures;
    
    // Iris 自定义图像
    private final List<ImageInformation> irisCustomImages;
}
```

### 2.1 加载流程

```startLine:89:150:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/ShaderPack.java
public ShaderPack(Path root, Map<String, String> changedConfigs, 
                  ImmutableList<StringPair> environmentDefines) {
    // 1. 扫描着色器源文件
    IncludeGraph graph = new IncludeGraph(root, starts.build());
    
    // 2. 加载语言文件
    this.languageMap = new LanguageMap(root.resolve("lang"));
    
    // 3. 解析选项
    this.shaderPackOptions = new ShaderPackOptions(graph, changedConfigs);
    
    // 4. 加载属性
    this.shaderProperties = loadProperties(root, "shaders.properties")
        .map(source -> new ShaderProperties(source, shaderPackOptions, finalEnvironmentDefines))
        .orElseGet(ShaderProperties::empty);
    
    // 5. 检测功能标志
    activeFeatures = new HashSet<>();
    for (FeatureFlags flag : shaderProperties.getRequiredFeatureFlags()) {
        activeFeatures.add(FeatureFlags.getValue(flag));
    }
    
    // 6. 加载程序集
    this.sourceProvider = (path) -> {
        // GLSL 预处理
        String source = JcppProcessor.glslPreprocessSource(source, environmentDefines);
        return source;
    };
    
    this.base = new ProgramSet(AbsolutePackPath.fromAbsolutePath("/"), sourceProvider, ...);
    
    // 7. 加载 ID 映射
    this.idMap = new IdMap(root, shaderPackOptions, environmentDefines);
}
```

---

## 3. 程序管理

### 3.1 ProgramSet

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/programs/ProgramSet.java
public class ProgramSet implements ProgramSetInterface {
    private final AbsolutePackPath basePath;
    private final Function<AbsolutePackPath, String> sourceProvider;
    private final ShaderProperties shaderProperties;
    
    // 各阶段的程序
    public ProgramSource[] getComposite(ProgramArrayId id) { ... }
    public ProgramSource[] getShadowComposite(ProgramArrayId id) { ... }
    public ComputeSource[] getCompute(ProgramArrayId id) { ... }
    public ComputeSource[] getSetup(ProgramArrayId id) { ... }
}
```

### 3.2 ProgramSource

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/programs/ProgramSource.java
public class ProgramSource {
    private final String name;
    private final AbsolutePackPath path;
    
    // 着色器源代码
    private final Optional<String> vertexSource;
    private final Optional<String> fragmentSource;
    private final Optional<String> geometrySource;
    private final Optional<String> computeSource;
    
    // 指令
    private final ProgramDirectives directives;
    
    public Optional<String> getVertexSource() { return vertexSource; }
    public Optional<String> getFragmentSource() { return fragmentSource; }
    public ProgramDirectives getDirectives() { return directives; }
}
```

### 3.3 ProgramArrayId

程序数组标识符：

```java
public enum ProgramArrayId {
    // Composite
    Begin,
    Prepare,
    Deferred,
    Composite,
    
    // Shadow
    ShadowSolid,
    ShadowCutout,
    ShadowTranslucent,
    ShadowComposite,
    
    // Terrain
    TerrainSolid,
    TerrainCutout,
    TerrainTranslucent,
    TerrainEntity,
    
    // Special
    SkyBasic,
    SkyTextured,
    Clouds,
    Weather,
    Water,
    
    // ...
}
```

---

## 4. Include 处理器

### 4.1 IncludeGraph

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/include/IncludeGraph.java
public class IncludeGraph {
    private final Map<AbsolutePackPath, FileNode> nodes = new HashMap<>();
    private final Map<AbsolutePackPath, IOException> failures = new HashMap<>();
    
    public IncludeGraph(Path root, ImmutableList<AbsolutePackPath> starts) {
        // 1. 遍历所有着色器文件
        for (AbsolutePackPath path : starts) {
            traverseAndBuildGraph(root, path);
        }
    }
    
    private void traverseAndBuildGraph(Path root, AbsolutePackPath path) {
        FileNode node = new FileNode(path);
        
        // 2. 解析 #include 指令
        String content = readFile(root.resolve(path));
        for (String line : content.split("\n")) {
            if (line.startsWith("#include")) {
                String includePath = parseInclude(line);
                AbsolutePackPath includeAbsPath = resolveInclude(path, includePath);
                
                // 3. 递归处理
                if (!nodes.containsKey(includeAbsPath)) {
                    traverseAndBuildGraph(root, includeAbsPath);
                }
                
                node.addDependency(includeAbsPath);
            }
        }
        
        nodes.put(path, node);
    }
}
```

### 4.2 IncludeProcessor

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/include/IncludeProcessor.java
public class IncludeProcessor {
    private final IncludeGraph graph;
    
    public ImmutableList<String> getIncludedFile(AbsolutePackPath path) {
        FileNode node = graph.getNode(path);
        if (node == null) {
            return null;
        }
        
        List<String> result = new ArrayList<>();
        for (AbsolutePackPath dep : node.getDependencies()) {
            // 递归包含依赖
            ImmutableList<String> depContent = getIncludedFile(dep);
            if (depContent != null) {
                result.addAll(depContent);
            }
        }
        
        // 添加自身内容
        result.addAll(node.getContent());
        
        return ImmutableList.copyOf(result);
    }
}
```

---

## 5. GLSL 预处理器

### 5.1 JcppProcessor

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/preprocessor/JcppProcessor.java
public class JcppProcessor {
    private static final JCPP pp = new JCPP();
    
    static {
        pp.addInput(new PropertiesCommentListener());
        pp.addInput(new PropertyCollectingListener());
    }
    
    public static String glslPreprocessSource(String source, 
                                               Iterable<StringPair> environmentDefines) {
        // 1. 设置输入
        Reader reader = new StringReader(source);
        SimpleCharStream chars = new SimpleCharStream(reader);
        JCPP.PPTokenManager tm = pp.new PPTokenManager(chars);
        
        // 2. 配置预处理器
        CPreprocessor张艺驰 mc = new CPreprocessor();
        mc.addInput(new GlslCollectingListener());
        
        // 3. 添加环境定义
        for (StringPair define : environmentDefines) {
            mc.addMacro(define.getFirst(), define.getSecond());
        }
        
        // 4. 处理
        mc.run();
        
        // 5. 返回处理后的源代码
        return mc.getOutput();
    }
}
```

### 5.2 支持的预处理指令

- `#define` - 宏定义
- `#ifdef` / `#ifndef` - 条件编译
- `#include` - 文件包含
- `#version` - GLSL 版本
- `#extension` - 扩展声明

---

## 6. ID 映射

### 6.1 IdMap

```startLine:1:80:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/IdMap.java
public class IdMap {
    // 方块属性
    private final Int2ObjectMap<Properties> blockProperties;
    private final int[][] blockStateIds;
    
    // 实体 ID
    private final Int2IntMap entityIdMap;
    
    // 物品 ID
    private final Int2IntMap itemIdMap;
    
    // 皮革盔甲颜色
    private final Int2IntMap leatherArmorColors;
    
    public Int2IntMap getEntityIdMap() {
        return entityIdMap;
    }
    
    public Int2IntMap getItemIdMap() {
        return itemIdMap;
    }
    
    public Int2ObjectMap<Properties> getBlockProperties() {
        return blockProperties;
    }
}
```

### 6.2 加载流程

```startLine:100:180:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/IdMap.java
public IdMap(Path root, ShaderPackOptions options, 
             Iterable<StringPair> environmentDefines) {
    // 1. 加载 blocks.properties
    Properties blockProps = loadProperties(root, "blocks.properties");
    
    // 2. 解析方块映射
    blockProperties = new Int2ObjectArrayMap<>();
    for (Map.Entry<Object, Object> entry : blockProps.entrySet()) {
        String key = (String) entry.getKey();
        String value = (String) entry.getValue();
        
        if (key.startsWith("block.")) {
            BlockEntry blockEntry = BlockEntry.parse(key.substring(6), value);
            int blockId = getBlockId(blockEntry.getBlockName());
            blockProperties.put(blockId, blockEntry);
        }
    }
    
    // 3. 加载 entity.properties
    Properties entityProps = loadProperties(root, "entity.properties");
    entityIdMap = parseIdMap(entityProps);
    
    // 4. 加载 item.properties
    Properties itemProps = loadProperties(root, "item.properties");
    itemIdMap = parseIdMap(itemProps);
}
```

---

## 7. ShaderProperties

### 7.1 属性文件格式

```
# shaders.properties
shadowMapResolution=2048
shadowDistance=64.0
shadowDistanceRenderMul=1.0
fogMode=exp2
oldLighting=true
```

### 7.2 解析

```startLine:1:60:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/properties/ShaderProperties.java
public class ShaderProperties {
    // 阴影设置
    private final float shadowDistance;
    private final int shadowMapResolution;
    
    // 雾设置
    private final FogMode fogMode;
    private final float fogStart;
    private final float fogEnd;
    
    // 渲染设置
    private final boolean oldLighting;
    private final boolean separateEntityDraws;
    
    // 粒子渲染
    private final ParticleRenderingSettings particleRendering;
    
    // 自定义纹理
    private final Map<TextureStage, Map<String, String>> customTextures;
}
```

---

## 8. 维度支持

### 8.1 维度属性

```
# dimension.properties
dimension.overworld=world0
dimension.nether=world-1
dimension.end=world1
```

### 8.2 ProgramSet 切换

```startLine:526:556:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/shaderpack/ShaderPack.java
public ProgramSet getProgramSet(NamespacedId dimension) {
    ProgramSetInterface overrides = this.overrides.computeIfAbsent(dimension, dim -> {
        if (dimensionMap.containsKey(dimension)) {
            String name = dimensionMap.get(dimension);
            if (dimensionIds.contains(name)) {
                // 加载维度特定的程序集
                return new ProgramSet(
                    AbsolutePackPath.fromAbsolutePath("/" + name),
                    sourceProvider, shaderProperties, this);
            }
        }
        return ProgramSetInterface.Empty.INSTANCE;
    });
    
    // 如果没有覆盖，返回基础程序集
    if (overrides instanceof ProgramSet) {
        return (ProgramSet) overrides;
    } else {
        return base;
    }
}
```

---

## 9. 功能标志

```startLine:1:40:D:/Projects/Iris-1.7.3-1.21/src/main/java/net/irisshaders/iris/features/FeatureFlags.java
public enum FeatureFlags {
    // 必需标志
    SSBO,           // Shader Storage Buffer Objects
    CULL,           // 背面剔除
    SEPARATE_HARDWARE_SAMPLERS,  // 分离硬件采样器
    
    // 可选标志
    CUSTOM_IMAGES,  // 自定义图像
    FIXED_SUN,      // 固定太阳位置
    NO_PREVIEW_RENDER,  // 禁用预览渲染
    
    // 检测
    GBUFFERS_GEOMETRY,  // 几何着色器
    GBUFFERS_TEXT,       // 文本渲染
    GBUFFERS_ENTITIES_COLOR,  // 实体颜色
    HAND_TRANSLUCENT;   // 手部半透明
}
```

---

## 10. 相关文档

- [01-architecture-overview.md](01-architecture-overview.md) - 整体架构
- [02-rendering-pipeline.md](02-rendering-pipeline.md) - 渲染管线
- [04-shadow-system.md](04-shadow-system.md) - 阴影系统
- [05-framebuffer-texture.md](05-framebuffer-texture.md) - 帧缓冲与纹理
- [06-uniforms.md](06-uniforms.md) - Uniform 管理

---

*生成时间: 2026-03-19*
