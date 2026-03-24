# Fabric API 方块系统模块分析

## 概述

方块系统模块包含三个子模块：
- `fabric-block-api-v1` - 核心方块扩展
- `fabric-block-view-api-v2` - 方块视图扩展
- `fabric-blockrenderlayer-v1` - 渲染层控制

---

## 1. fabric-block-api-v1 模块

### 1.1 核心 API 接口

#### FabricBlock 接口

```java
public interface FabricBlock {
    /**
     * Return the current appearance of the block.
     */
    default BlockState getAppearance(BlockState state, BlockRenderView renderView,
                                   BlockPos pos, Direction side,
                                   @Nullable BlockState sourceState,
                                   @Nullable BlockPos sourcePos) {
        return state;
    }
}
```

**用途**：
- 实现 **覆盖物 (Covers)** 和 **外观方块 (Facades)** - 代理其他方块的模型
- 支持 **连接纹理 (Connected Textures)** 模型的无缝连接

#### FabricBlockState 接口

```java
public interface FabricBlockState {
    default BlockState getAppearance(BlockRenderView renderView, BlockPos pos,
                                   Direction side, @Nullable BlockState sourceState,
                                   @Nullable BlockPos sourcePos) {
        BlockState self = (BlockState) this;
        return self.getBlock().getAppearance(self, renderView, pos, side, sourceState, sourcePos);
    }
}
```

### 1.2 功能性标签 (BlockFunctionalityTags)

```java
public final class BlockFunctionalityTags {
    /**
     * Blocks in this tag let the player climb open trapdoors above them.
     */
    public static final TagKey<Block> CAN_CLIMB_TRAPDOOR_ABOVE = create("can_climb_trapdoor_above");
}
```

---

## 2. fabric-block-view-api-v2 模块

### 2.1 核心 API 接口

#### FabricBlockView 接口

```java
public interface FabricBlockView {
    /**
     * Retrieves block entity render data for a given block position.
     * 多线程环境下安全访问
     */
    @Nullable
    default Object getBlockEntityRenderData(BlockPos pos) {
        BlockEntity blockEntity = ((BlockView) this).getBlockEntity(pos);
        return blockEntity == null ? null : blockEntity.getRenderData();
    }

    /**
     * Checks whether biome retrieval is supported.
     */
    default boolean hasBiomes() {
        return false;
    }

    /**
     * Retrieves the biome at the given position.
     */
    @UnknownNullability
    default RegistryEntry<Biome> getBiomeFabric(BlockPos pos) {
        return null;
    }
}
```

#### RenderDataBlockEntity 接口

```java
public interface RenderDataBlockEntity {
    /**
     * Gets the render data provided by this block entity.
     * Must be safe to use in a multithreaded environment.
     */
    @Nullable
    default Object getRenderData() {
        return null;
    }
}
```

---

## 3. fabric-blockrenderlayer-v1 模块

### 3.1 核心 API

```java
public interface BlockRenderLayerMap {
    BlockRenderLayerMap INSTANCE = new BlockRenderLayerMapImpl();

    void putBlock(Block block, RenderLayer renderLayer);
    void putBlocks(RenderLayer renderLayer, Block... blocks);
    void putFluid(Fluid fluid, RenderLayer renderLayer);
    void putFluids(RenderLayer renderLayer, Fluid... fluids);
}
```

### 3.2 常用 RenderLayer 类型

| RenderLayer | 用途 | 示例 |
|-------------|------|------|
| `RenderLayer.getSolid()` | 实心不透明 | 石头、泥土 |
| `RenderLayer.getCutout()` | 透明镂空 | 栅栏、活板门 |
| `RenderLayer.getCutoutMipped()` | 带 Mipmap 的镂空 | 玻璃 |
| `RenderLayer.getTranslucent()` | 半透明混合 | 冰、染色玻璃 |

---

## 4. Mixin 注入点总结

| Mixin 类 | 目标类 | 功能 |
|----------|--------|------|
| `BlockMixin` | `Block` | 实现 `FabricBlock` |
| `BlockStateMixin` | `BlockState` | 实现 `FabricBlockState` |
| `BlockViewMixin` | `BlockView` | 实现 `FabricBlockView` |
| `BlockEntityMixin` | `BlockEntity` | 实现 `RenderDataBlockEntity` |
| `WorldViewMixin` | `WorldView` | 实现 `hasBiomes()` 和 `getBiomeFabric()` |
| `ChunkSectionMixin` | `ChunkSection` | 修复 Mod 方块空气检测 |
| `LivingEntityMixin` | `LivingEntity` | 活板门攀爬标签支持 |
| `RenderLayersMixin` | `RenderLayers` | 渲染层映射初始化 |

### 关键 Mixin 详解

#### ChunkSectionMixin - 修复 Mod 方块 isAir 问题

```java
@Redirect(method = "setBlockState...",
    at = @At(value = "INVOKE", target = "Lnet/minecraft/block/BlockState;isAir()Z"))
private boolean modifyAirCheck(BlockState blockState) {
    return blockState.isOf(Blocks.AIR) || blockState.isOf(Blocks.CAVE_AIR)
           || blockState.isOf(Blocks.VOID_AIR);
}
```

**问题背景**：原版 `isAir()` 方法使用 `==` 比较，导致 Mod 方块被错误替换为空气。

---

## 5. 使用示例

### 5.1 自定义外观方块

```java
public class FacadeBlock extends Block implements FabricBlock {
    private final Block mimickingBlock;

    @Override
    public BlockState getAppearance(BlockState state, BlockRenderView renderView,
                                  BlockPos pos, Direction side,
                                  @Nullable BlockState sourceState,
                                  @Nullable BlockPos sourcePos) {
        // 返回被模拟方块的状态，实现视觉伪装
        return mimickingBlock.getDefaultState();
    }
}
```

### 5.2 线程安全的方块实体渲染数据

```java
public class MyBlockEntity extends BlockEntity implements RenderDataBlockEntity {
    private volatile int cachedColor;  // volatile 保证线程可见性

    @Override
    public Object getRenderData() {
        return cachedColor;  // 返回不可变/线程安全的渲染数据
    }
}

// 在模型中使用
public class MyBakedModel implements FabricBakedModel {
    @Override
    public List<BakedQuad> emitBlockQuads(...) {
        Object renderData = ((FabricBlockView) view).getBlockEntityRenderData(pos);
        if (renderData instanceof Integer color) {
            // 使用缓存的颜色数据
        }
    }
}
```

### 5.3 设置自定义渲染层

```java
public class MyModClient implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        BlockRenderLayerMap.INSTANCE.putBlocks(
            RenderLayer.getCutout(),
            MyModBlocks.TRANSPARENT_BLOCK_1,
            MyModBlocks.TRANSPARENT_BLOCK_2
        );

        BlockRenderLayerMap.INSTANCE.putFluid(
            RenderLayer.getTranslucent(),
            MyModFluids.CUSTOM_LIQUID
        );
    }
}
```

---

## 架构总结

```
┌─────────────────────────────────────────────────────────────────┐
│                      Fabric Block API                           │
├─────────────────────────────────────────────────────────────────┤
│  fabric-block-api-v1          fabric-block-view-api-v2          │
│  ┌─────────────────┐         ┌─────────────────────┐            │
│  │   FabricBlock   │◄────────│   FabricBlockView   │            │
│  │  +getAppearance │         │ +getBlockEntity...  │            │
│  ├─────────────────┤         │ +hasBiomes()        │            │
│  │ FabricBlockState│         │ +getBiomeFabric()   │            │
│  │  +getAppearance │         ├─────────────────────┤            │
│  ├─────────────────┤         │ RenderDataBlockEntity            │
│  │BlockFunctionalityTags     │ +getRenderData()    │            │
│  │ CAN_CLIMB_TRAPDOOR_ABOVE  └─────────────────────┘            │
│  └─────────────────┘                                           │
├─────────────────────────────────────────────────────────────────┤
│  fabric-blockrenderlayer-v1 (Client Only)                       │
│  ┌─────────────────────────────────────────┐                    │
│  │         BlockRenderLayerMap             │                    │
│  │  +putBlock(Block, RenderLayer)          │                    │
│  │  +putFluid(Fluid, RenderLayer)         │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

*源码位置: `fabric-block-api-v1/`, `fabric-block-view-api-v2/`, `fabric-blockrenderlayer-v1/`*
