# Fabric API 渲染系统分析

## 概述

渲染系统包含多个核心模块：
- `fabric-renderer-api-v1` - 渲染器 API 核心
- `fabric-renderer-indigo` - Indigo 默认渲染器实现
- `fabric-rendering-v1` - 渲染事件
- `fabric-rendering-fluids-v1` - 流体渲染
- `fabric-particles-v1` - 粒子系统
- `fabric-client-tags-api-v1` - 客户端标签

---

## 1. fabric-renderer-api-v1 模块

### 1.1 核心接口关系

```
Renderer (主接口)
    ├── meshBuilder() → MeshBuilder
    ├── materialFinder() → MaterialFinder
    └── materialById(Identifier) → RenderMaterial

RendererAccess (渲染器访问入口)
    ├── INSTANCE (单例)
    ├── registerRenderer(Renderer)
    └── getRenderer()

RenderContext (渲染上下文)
    ├── getEmitter() → QuadEmitter
    ├── pushTransform(QuadTransform)
    └── isFaceCulled(Direction)
```

### 1.2 渲染材质系统 (RenderMaterial)

材质使用位编码存储渲染属性：

```java
public interface RenderMaterial {
    // 混合模式
    BlendMode blendMode();           // SOLID/CUTOUT/CUTOUT_MIPPED/TRANSLUCENT

    // 环境光遮蔽
    TriState ambientOcclusion();     // TRUE/FALSE/DEFAULT

    // 其他属性...
}
```

### 1.3 Mesh 系统

```java
public interface Mesh {
    // 遍历所有四边形
    void forEach(Consumer<QuadView> consumer);

    // 输出到 QuadEmitter
    void outputTo(QuadEmitter emitter);
}

public interface MeshBuilder {
    QuadEmitter getEmitter();  // 获取发射器添加四边形
    Mesh build();              // 构建 Mesh 并重置 Builder
}
```

### 1.4 四边形数据结构 (QuadView)

```java
public interface QuadView {
    // 顶点属性
    float x(int vertexIndex);
    float y(int vertexIndex);
    float z(int vertexIndex);
    int color(int vertexIndex);      // ARGB 格式
    float u(int vertexIndex);        // 纹理 U 坐标
    float v(int vertexIndex);        // 纹理 V 坐标

    // 面信息
    Direction cullFace();           // 裁剪面
    Direction lightFace();         // 光照面

    // 材质和标签
    RenderMaterial material();
    int tag();                       // 用户自定义标签
}
```

### 1.5 FabricBakedModel 接口

```java
public interface FabricBakedModel {
    default boolean isVanillaAdapter() {
        return true;
    }

    default void emitBlockQuads(BlockRenderView blockView, BlockState state,
                               BlockPos pos, Supplier<Random> randomSupplier,
                               RenderContext context);

    default void emitItemQuads(ItemStack stack, Supplier<Random> randomSupplier,
                              RenderContext context);
}
```

---

## 2. fabric-renderer-indigo 模块

### 2.1 IndigoRenderer 实现

```java
public class IndigoRenderer implements Renderer {
    public static final IndigoRenderer INSTANCE = new IndigoRenderer();

    @Override
    public MeshBuilder meshBuilder() {
        return new MeshBuilderImpl();
    }

    @Override
    public MaterialFinder materialFinder() {
        return new MaterialFinderImpl();
    }
}
```

### 2.2 四边形编码格式

Indigo 使用紧凑的整数数组编码四边形数据：

```java
// 头部信息 (4 个 int)
HEADER_BITS = 0;        // 裁剪面、法线标志
HEADER_FACE_NORMAL = 1;
HEADER_COLOR_INDEX = 2;
HEADER_TAG = 3;
HEADER_STRIDE = 4;

// 顶点数据 (每个顶点 8 个 int)
VERTEX_X = HEADER_STRIDE + 0;
VERTEX_Y = HEADER_STRIDE + 1;
// ... 共 8 个 int
```

---

## 3. fabric-particles-v1 模块

### 3.1 粒子类型创建

```java
public final class FabricParticleTypes {
    // 创建简单粒子类型
    public static SimpleParticleType simple() {
        return simple(false);
    }

    // 创建带自定义 Codec 的复杂粒子类型
    public static <T extends ParticleEffect> ParticleType<T> complex(
            final MapCodec<T> codec,
            final PacketCodec<? super RegistryByteBuf, T> packetCodec);
}
```

### 3.2 粒子工厂注册

```java
public interface ParticleFactoryRegistry {
    // 注册直接工厂
    <T extends ParticleEffect> void register(ParticleType<T> type,
                                             ParticleFactory<T> factory);

    // 注册延迟工厂（带 Sprite 加载）
    <T extends ParticleEffect> void register(ParticleType<T> type,
                                             PendingParticleFactory<T> constructor);
}
```

---

## 4. fabric-rendering-fluids-v1 模块

### 4.1 FluidRenderHandler 接口

```java
public interface FluidRenderHandler {
    // 获取流体精灵图
    Sprite[] getFluidSprites(@Nullable BlockRenderView view,
                              @Nullable BlockPos pos,
                              FluidState state);

    // 获取流体着色颜色
    default int getFluidColor(@Nullable BlockRenderView view,
                              @Nullable BlockPos pos,
                              FluidState state) {
        return -1;  // 返回 -1 表示使用默认
    }

    // 渲染流体
    default void renderFluid(BlockPos pos, BlockRenderView world,
                           VertexConsumer vertexConsumer,
                           BlockState blockState,
                           FluidState fluidState);
}
```

### 4.2 SimpleFluidRenderHandler

```java
public class SimpleFluidRenderHandler implements FluidRenderHandler {
    protected final Identifier stillTexture;
    protected final Identifier flowingTexture;
    protected final Identifier overlayTexture;
    protected final Sprite[] sprites;
    protected final int tint;

    // 创建带颜色的水渲染器
    public static SimpleFluidRenderHandler coloredWater(int tint) {
        return new SimpleFluidRenderHandler(
            WATER_STILL, WATER_FLOWING, WATER_OVERLAY, tint);
    }
}
```

---

## 5. 使用示例

### 5.1 创建自定义粒子类型

```java
// 在模组初始化时
public static final SimpleParticleType CUSTOM_PARTICLE = FabricParticleTypes.simple();

// 注册粒子类型
Registry.register(Registry.PARTICLE_TYPE,
    Identifier.of("mymod", "custom_particle"),
    CUSTOM_PARTICLE);

// 在客户端初始化时注册工厂
ParticleFactoryRegistry.getInstance().register(
    CUSTOM_PARTICLE,
    provider -> new SpriteTexturedParticle.Factory(provider)
);
```

### 5.2 创建自定义流体渲染

```java
public class MyFluidRenderHandler extends SimpleFluidRenderHandler {
    public MyFluidRenderHandler() {
        super(
            Identifier.of("mymod", "block/my_fluid"),
            Identifier.of("mymod", "block/my_fluid_flow"),
            Identifier.of("mymod", "block/my_fluid_overlay"),
            0xRRGGBB
        );
    }
}

// 注册处理器
FluidRenderHandlerRegistry.INSTANCE.register(
    MY_FLUID_STILL, MY_FLUID_FLOWING,
    new MyFluidRenderHandler()
);
```

### 5.3 创建增强烘焙模型

```java
public class MyBakedModel implements BakedModel, FabricBakedModel {
    private final Mesh mesh;

    @Override
    public boolean isVanillaAdapter() {
        return false;  // 声明为增强模型
    }

    @Override
    public void emitBlockQuads(BlockRenderView blockView, BlockState state,
                             BlockPos pos, Supplier<Random> randomSupplier,
                             RenderContext context) {
        mesh.outputTo(context.getEmitter());
    }
}
```

---

## 架构总结

```
┌─────────────────────────────────────────────────────────────┐
│                    Fabric Renderer API                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              fabric-renderer-api-v1                   │   │
│  │  Renderer, RenderMaterial, Mesh, QuadView,           │   │
│  │  FabricBakedModel, RenderContext                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              fabric-renderer-indigo                   │   │
│  │  IndigoRenderer, MeshBuilderImpl,                     │   │
│  │  AoCalculator, EncodingFormat                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  particles  │  │   fluids   │  │    tags    │        │
│  │   -v1       │  │  -fluids   │  │ -client    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

*源码位置: `fabric-renderer-api-v1/`, `fabric-renderer-indigo/`, `fabric-rendering-v1/`, `fabric-rendering-fluids-v1/`, `fabric-particles-v1/`*
