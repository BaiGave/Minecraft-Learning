# 自定义模型

> 学会创建复杂的三维模型，包括方块模型、物品模型和多面模型

## 什么是自定义模型？

前面的教程中，我们创建了简单的发光方块，但那只是一个面。在实际游戏中，我们需要更复杂的模型：
- 有多个面的方块
- 有纹理的模型
- 复杂的物品模型

本章将教你如何创建这些复杂模型。

---

## 1. 模型的基本组成

### 1.1 顶点与面

```
立方体 = 6 个面 × 4 个顶点 = 24 个顶点

每个面需要：
- 4 个顶点的位置 (x, y, z)
- 4 个顶点的 UV 坐标 (u, v)
- 法线方向 (normal)
- 颜色或纹理
```

### 1.2 构建流程

```
1. 获取 Renderer
   ↓
2. 创建 MeshBuilder
   ↓
3. 使用 QuadEmitter 添加四边形
   ↓
4. 构建 Mesh
   ↓
5. 输出到 RenderContext
```

---

## 2. 完整示例：自定义纹理方块

### 2.1 纹理资源准备

首先，你需要一张纹理图片，放在 `src/main/resources/assets/mymod/textures/block/` 目录下，命名为 `custom_block.png`。

### 2.2 创建带纹理的方块模型

```java
package com.example.mod.block;

import net.fabricmc.fabric.api.renderer.v1.RendererAccess;
import net.fabricmc.fabric.api.rendering.v1.model.FabricBakedModel;
import net.fabricmc.fabric.api.rendering.v1.render.RenderContext;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.client.render.model.BakedModel;
import net.minecraft.client.render.model.json.ModelOverrideList;
import net.minecraft.client.render.model.json.ModelTransformation;
import net.minecraft.client.texture.Sprite;
import net.minecraft.item.ItemStack;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.BlockRenderView;

import java.util.function.Supplier;

// 创建带纹理的自定义方块
public class TexturedBlock extends Block {
    
    // 纹理 ID
    private static final Identifier TEXTURE_ID = Identifier.of("mymod", "block/custom_block");
    
    public TexturedBlock() {
        super(Settings.copy(Blocks.STONE));
    }
    
    @Override
    public BakedModel getRenderedModel(BlockState state, ModelTransformation transformation) {
        return TexturedBlockModel.INSTANCE;
    }
    
    // 静态内部类：纹理方块模型
    private static class TexturedBlockModel implements BakedModel, FabricBakedModel {
        
        static final TexturedBlockModel INSTANCE = new TexturedBlockModel();
        
        @Override
        public boolean isVanillaAdapter() {
            return false;
        }
        
        @Override
        public void emitBlockQuads(BlockRenderView blockView, BlockState state,
                                   BlockPos pos, Supplier<Random> randomSupplier,
                                   RenderContext context) {
            
            // 获取渲染器和纹理
            var renderer = RendererAccess.INSTANCE.getRenderer();
            var meshBuilder = renderer.meshBuilder();
            var emitter = meshBuilder.getEmitter();
            
            // 获取纹理 Sprite
            Sprite sprite = blockView.getSprite(TEXTURE_ID);
            if (sprite == null) {
                return;  // 没有纹理则不渲染
            }
            
            // 为每个方向绘制一个面
            for (Direction direction : Direction.values()) {
                // 设置基础属性
                emitter.square(direction, 0, 0, 1, 1, 0);
                
                // 设置 UV 坐标（将纹理映射到整个面）
                // sprite.getMinU() 获取纹理左边缘
                // sprite.getMaxU() 获取纹理右边缘
                emitter.uv(0, sprite.getMinU(), sprite.getMinV());
                emitter.uv(1, sprite.getMaxU(), sprite.getMinV());
                emitter.uv(2, sprite.getMaxU(), sprite.getMaxV());
                emitter.uv(3, sprite.getMinU(), sprite.getMaxV());
                
                // 设置法线
                emitter.normal(direction, 
                    direction.getVector().getX(),
                    direction.getVector().getY(),
                    direction.getVector().getZ()
                );
                
                // 使用默认材质（SOLID）
                emitter.material(renderer.materialFinder()
                    .blendMode(net.fabricmc.fabric.api.renderer.v1.material.RenderMaterial.BlenderMode.SOLID)
                    .find());
            }
            
            // 输出到上下文
            meshBuilder.build().outputTo(context.getEmitter());
        }
        
        @Override
        public void emitItemQuads(ItemStack stack, Supplier<Random> randomSupplier,
                                  RenderContext context) {
            // 简化版：渲染一个面作为物品
            var renderer = RendererAccess.INSTANCE.getRenderer();
            var meshBuilder = renderer.meshBuilder();
            var emitter = meshBuilder.getEmitter();
            
            // 物品通常只渲染上面
            emitter.square(Direction.UP, 0, 0, 1, 1, 0);
            emitter.material(renderer.materialFinder()
                .blendMode(net.fabricmc.fabric.api.renderer.v1.material.RenderMaterial.BlenderMode.SOLID)
                .find());
            
            meshBuilder.build().outputTo(context.getEmitter());
        }
        
        // BakedModel 接口方法
        @Override
        public Sprite getParticleSprite() {
            return null;
        }
        
        @Override
        public boolean usesAo() {
            return false;
        }
        
        @Override
        public boolean isSideCulled(Direction direction) {
            return false;
        }
        
        @Override
        public ModelOverrideList getOverrides() {
            return ModelOverrideList.EMPTY;
        }
        
        @Override
        public ModelTransformation getTransformation() {
            return ModelTransformation.UNTRANSFORMED;
        }
    }
}
```

---

## 3. 完整示例：复杂物品模型

### 3.1 创建多面体物品

```java
package com.example.mod.item;

import net.fabricmc.fabric.api.renderer.v1.RendererAccess;
import net.fabricmc.fabric.api.rendering.v1.model.FabricBakedModel;
import net.fabricmc.fabric.api.rendering.v1.render.RenderContext;
import net.minecraft.client.render.model.BakedModel;
import net.minecraft.client.render.model.json.ModelOverrideList;
import net.minecraft.client.render.model.json.ModelTransformation;
import net.minecraft.client.texture.Sprite;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.Direction;
import net.minecraft.util.math.random.Random;

import java.util.function.Supplier;

// 自定义物品模型
public class CustomItemModel implements BakedModel, FabricBakedModel {
    
    // 物品纹理
    private static final Identifier ITEM_TEXTURE = Identifier.of("mymod", "item/custom_item");
    
    // 物品颜色（紫色）
    private static final int ITEM_COLOR = 0xFF00FF;
    
    @Override
    public boolean isVanillaAdapter() {
        return false;
    }
    
    @Override
    public void emitItemQuads(ItemStack stack, Supplier<Random> randomSupplier,
                              RenderContext context) {
        
        var renderer = RendererAccess.INSTANCE.getRenderer();
        var meshBuilder = renderer.meshBuilder();
        var emitter = meshBuilder.getEmitter();
        
        // 创建一个四面体形状的物品
        
        // 面 1：前面
        emitter.square(Direction.SOUTH, 
            0.25f, 0.25f,  // 左上
            0.75f, 0.75f,  // 右下
            0.5f           // Z 深度
        );
        
        // 设置颜色
        emitter.color(-1, 
            (ITEM_COLOR >> 16) & 0xFF,
            (ITEM_COLOR >> 8) & 0xFF,
            ITEM_COLOR & 0xFF,
            255
        );
        
        // 面 2：后面
        emitter.square(Direction.NORTH, 
            0.25f, 0.25f,
            0.75f, 0.75f,
            0.5f
        );
        
        // 面 3：左面
        emitter.square(Direction.WEST, 
            0.5f, 0.25f,
            0.5f, 0.75f,
            0.25f
        );
        
        // 面 4：右面
        emitter.square(Direction.EAST, 
            0.5f, 0.25f,
            0.5f, 0.75f,
            0.75f
        );
        
        // 面 5：上面
        emitter.square(Direction.UP, 
            0.25f, 0.5f,
            0.75f, 0.5f,
            0.75f
        );
        
        // 面 6：下面
        emitter.square(Direction.DOWN, 
            0.25f, 0.5f,
            0.75f, 0.5f,
            0.25f
        );
        
        // 设置材质
        emitter.material(renderer.materialFinder()
            .blendMode(net.fabricmc.fabric.api.renderer.v1.material.RenderMaterial.BlenderMode.CUTOUT)
            .find());
        
        meshBuilder.build().outputTo(context.getEmitter());
    }
    
    // Block 模型不需要实现（返回空）
    @Override
    public void emitBlockQuads(net.minecraft.world.BlockRenderView blockView,
                               net.minecraft.block.BlockState state,
                               net.minecraft.util.math.BlockPos pos,
                               Supplier<Random> randomSupplier,
                               RenderContext context) {
        // 不渲染方块形式
    }
    
    @Override
    public Sprite getParticleSprite() {
        return null;
    }
    
    @Override
    public boolean usesAo() {
        return false;
    }
    
    @Override
    public boolean isSideCulled(Direction direction) {
        return false;
    }
    
    @Override
    public ModelOverrideList getOverrides() {
        return ModelOverrideList.EMPTY;
    }
    
    @Override
    public ModelTransformation getTransformation() {
        return ModelTransformation.UNTRANSFORMED;
    }
}
```

---

## 4. 高级：使用 Mesh 缓存

对于复杂的模型，每次渲染时重新创建会很慢。我们可以缓存 Mesh：

```java
public class CachedBlockModel implements BakedModel, FabricBakedModel {
    
    // 缓存的 Mesh
    private static Mesh CACHED_MESH;
    
    @Override
    public void emitBlockQuads(BlockRenderView blockView, BlockState state,
                               BlockPos pos, Supplier<Random> randomSupplier,
                               RenderContext context) {
        
        // 如果还没有缓存，创建并缓存
        if (CACHED_MESH == null) {
            CACHED_MESH = createMesh();
        }
        
        // 直接输出缓存的 Mesh
        CACHED_MESH.outputTo(context.getEmitter());
    }
    
    private static Mesh createMesh() {
        var renderer = RendererAccess.INSTANCE.getRenderer();
        var meshBuilder = renderer.meshBuilder();
        var emitter = meshBuilder.getEmitter();
        
        // 构建模型...（省略具体代码）
        
        return meshBuilder.build();
    }
}
```

---

## 5. 高级：动态模型

### 5.1 根据方块状态渲染不同模型

```java
@Override
public void emitBlockQuads(BlockRenderView blockView, BlockState state,
                           BlockPos pos, Supplier<Random> randomSupplier,
                           RenderContext context) {
    
    // 获取方块状态
    int variant = state.get(Properties.VARIANT);  // 假设你有这个属性
    
    // 根据状态选择不同的渲染
    switch (variant) {
        case 0:
            renderType1(context);
            break;
        case 1:
            renderType2(context);
            break;
        default:
            renderDefault(context);
            break;
    }
}
```

### 5.2 根据世界时间动画

```java
@Override
public void emitBlockQuads(BlockRenderView blockView, BlockState state,
                           BlockPos pos, Supplier<Random> randomSupplier,
                           RenderContext context) {
    
    // 获取世界时间
    long worldTime = blockView.getWorld().getTime();
    
    // 计算动画偏移
    float offset = (float) (worldTime % 20) / 20.0f;
    
    // 使用偏移值调整 UV 坐标实现动画效果
    emitter.uv(0, sprite.getMinU() + offset, sprite.getMinV());
    // ...
}
```

---

## 6. 技巧与最佳实践

### 6.1 性能优化

1. **使用 Mesh 缓存**：复杂模型只创建一次
2. **启用面剔除**：不渲染被遮挡的面
3. **使用简单的材质模式**：SOLID 比 TRANSLUCENT 快

```java
// 检查面是否被剔除
if (!context.isFaceCulled(direction)) {
    // 只渲染可见的面
    emitter.square(direction, ...);
}
```

### 6.2 调试技巧

```java
// 在 emitBlockQuads 开头添加日志
System.out.println("Rendering block at: " + pos);
```

---

## 7. 练习题

1. **练习 1**: 创建一个六面不同颜色的方块
   - 每个面使用不同的颜色
   - 提示：每个面单独设置颜色

2. **练习 2**: 创建一个有纹理的物品
   - 物品显示纹理而不是纯色
   - 提示：使用 `emitItemQuads` 并设置 UV

3. **练习 3**: 创建一个旋转的方块
   - 方块根据时间旋转
   - 提示：使用 `pushTransform` 应用旋转

4. **练习 4**: 创建一个变体方块
   - 根据方块元数据显示不同纹理
   - 提示：在 `emitBlockQuads` 中检查 `state.get(METADATA)`

---

## 8. 下一步

现在你已经掌握了自定义模型，让我们继续学习粒子效果：

- **[粒子效果](03-particles.md)** - 创建火焰、烟雾、魔法效果

---

## 相关资料

- [渲染系统分析文档](../analysis/06-rendering-system.md)
- [Fabric Wiki: Custom Models](https://fabricmc.net/wiki/documentation:fabric_renderer_api_v1)
- [Indigo Renderer 源码](https://github.com/FabricMC/fabric/tree/1.21/fabric-renderer-indigo)