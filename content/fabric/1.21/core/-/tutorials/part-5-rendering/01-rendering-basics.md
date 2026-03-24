# 渲染基础

> 学会使用 Fabric API 的渲染系统，创建自定义方块和物品的渲染效果

## 什么是渲染？

在 Minecraft 中，当你看到方块、物品、生物时，都是通过**渲染系统**把数据变成屏幕上的像素。Fabric API 提供了一套强大的渲染 API，让我们可以：

- 创建自定义模型
- 控制方块和物品的渲染方式
- 添加特殊效果（如半透明、发光）

本章将带你从零开始，掌握 Fabric 的渲染系统。

---

## 1. 核心概念

### 1.1 渲染器 (Renderer)

渲染器是整个系统的核心，负责创建渲染所需的各种对象：

```java
// 获取渲染器实例
Renderer renderer = RendererAccess.INSTANCE.getRenderer();

// 渲染器提供两个主要功能：
// 1. 创建 MeshBuilder - 用于构建网格
// 2. 创建 MaterialFinder - 用于查找材质
```

**MeshBuilder** 是什么？它就像一个"积木建造器"，用来组装三维模型的各个面（称为"四边形"，Quad）。

### 1.2 四边形 (Quad)

四边形是渲染的基本单位，每个四边形包含：

```
┌─────────────┐
│  顶点 0     │ ← 四个顶点定义四边形的位置
│ ┌─────────┐ │
│ │         │ │
│ │   面    │ │ ← 颜色、纹理、法线等信息
│ │         │ │
│ └─────────┘ │
│  顶点 1     │
└─────────────┘
```

每个顶点包含：
- **位置** (x, y, z) - 在 3D 空间中的坐标
- **颜色** (ARGB) - 顶点颜色
- **UV 坐标** (u, v) - 纹理贴图位置

### 1.3 材质 (RenderMaterial)

材质定义了如何渲染四边形：

```java
public interface RenderMaterial {
    // 混合模式 - 决定透明度处理方式
    BlendMode blendMode();  // SOLID/CUTOUT/CUTOUT_MIPPED/TRANSLUCENT
    
    // 环境光遮蔽 - 决定是否有阴影
    TriState ambientOcclusion();  // TRUE/FALSE/DEFAULT
}
```

| 混合模式 | 说明 | 用途 |
|---------|------|------|
| SOLID | 不透明 | 普通方块 |
| CUTOUT | 镂空 | 树叶、玻璃 |
| CUTOUT_MIPPED | 镂空+MIP贴图 | 树叶优化版 |
| TRANSLUCENT | 半透明 | 冰块、水 |

---

## 2. 简单方块渲染示例

让我们创建一个简单的发光方块，理解渲染流程。

### 2.1 添加依赖

在 `build.gradle` 中添加：

```groovy
dependencies {
    // 渲染 API
    modImplementation 'net.fabricmc:fabric-renderer-api-v1:3.0.0'
    // 渲染器实现（需要同时包含）
    modImplementation 'net.fabricmc:fabric-renderer-indigo:1.0.0'
}
```

### 2.2 创建发光方块

```java
package com.example.mod.block;

import net.fabricmc.fabric.api.renderer.v1.RendererAccess;
import net.fabricmc.fabric.api.rendering.v1.model.FabricBakedModel;
import net.fabricmc.fabric.api.rendering.v1.render.RenderContext;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.block.ShapeContext;
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

// 1. 定义我们的发光方块
public class GlowBlock extends Block {
    
    public GlowBlock() {
        super(Settings.copy(Blocks.STONE));
    }
    
    // 2. 重写 getRenderedModel 方法，返回自定义模型
    @Override
    public BakedModel getRenderedModel(BlockState state, ModelTransformation transformation) {
        return GlowBlockModel.INSTANCE;
    }
    
    // 3. 静态内部类：自定义渲染模型
    private static class GlowBlockModel implements BakedModel, FabricBakedModel {
        
        // 单例实例
        static final GlowBlockModel INSTANCE = new GlowBlockModel();
        
        // 创建一个简单的发光颜色（黄色，略带透明）
        private static final int GLOW_COLOR = 0x80FFFF00;  // ARGB: 半透明黄色
        
        @Override
        public boolean isVanillaAdapter() {
            // 返回 false 表示使用 Fabric 的自定义渲染
            return false;
        }
        
        @Override
        public void emitBlockQuads(BlockRenderView blockView, BlockState state,
                                   BlockPos pos, Supplier<Random> randomSupplier,
                                   RenderContext context) {
            // 获取渲染器
            var renderer = RendererAccess.INSTANCE.getRenderer();
            
            // 获取 MeshBuilder 用于构建网格
            var meshBuilder = renderer.meshBuilder();
            var emitter = meshBuilder.getEmitter();
            
            // 为每个面创建发光四边形
            for (Direction direction : Direction.values()) {
                // 设置四边形属性
                emitter.square(direction, 0, 0, 1, 1, 0);  // 基本位置
                
                // 设置发光颜色（使用 -1 表示使用顶点颜色）
                emitter.color(-1, 
                    (GLOW_COLOR >> 16) & 0xFF,  // R
                    (GLOW_COLOR >> 8) & 0xFF,   // G
                    (GLOW_COLOR) & 0xFF,        // B
                    (GLOW_COLOR >> 24) & 0xFF   // A
                );
                
                // 设置发光材质
                emitter.material(renderer.materialFinder()
                    .blendMode(net.fabricmc.fabric.api.renderer.v1.material.RenderMaterial.BlenderMode.TRANSLUCENT)
                    .find());
                
                // 设置法线（决定光线如何反射）
                emitter.normal(direction, 0, 1, 0);
            }
            
            // 输出所有四边形
            meshBuilder.build().outputTo(context.getEmitter());
        }
        
        // 物品模型也需要实现（类似）
        @Override
        public void emitItemQuads(ItemStack stack, Supplier<Random> randomSupplier,
                                  RenderContext context) {
            // 物品模型的渲染逻辑类似，但更简单
            // 暂时使用默认渲染
        }
        
        // 这些是 BakedModel 接口的必需方法
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

### 2.3 注册方块

```java
// 在你的 Mod 主类中
public class MyMod implements ModInitializer {
    
    // 定义发光方块
    public static final Block GLOW_BLOCK = new GlowBlock();
    
    @Override
    public void onInitialize() {
        // 注册方块
        Registry.register(Registry.BLOCK, Identifier.of("mymod", "glow_block"), GLOW_BLOCK);
        
        // 注册方块物品形式（让你可以在物品栏看到）
        Registry.register(Registry.ITEM, Identifier.of("mymod", "glow_block"),
            new BlockItem(GLOW_BLOCK, new Item.Settings()));
    }
}
```

---

## 3. 理解 RenderContext

`RenderContext` 是渲染时的上下文对象，提供了许多有用的方法：

```java
// 获取四边形发射器 - 用于添加四边形
QuadEmitter emitter = context.getEmitter();

// 检查面是否被剔除（被相邻方块遮挡）
boolean isCulled = context.isFaceCulled(Direction.UP);

// 应用变换（旋转、缩放、平移）
context.pushTransform(quadView -> {
    // 可以修改 quadView 的属性
    return quadView;
});
```

---

## 4. 材质查找器

`MaterialFinder` 用于查找或创建材质：

```java
MaterialFinder finder = renderer.materialFinder();

// 设置材质属性
finder.blendMode(BlendMode.TRANSLUCENT);  // 半透明
finder.ambientOcclusion(TriState.TRUE);   // 开启环境光遮蔽
finder.cullface(Direction.UP);             // 面剔除方向

// 查找或创建材质
RenderMaterial material = finder.find();
```

---

## 5. 常见问题

### Q: 方块不渲染怎么办？

1. 检查 `isVanillaAdapter()` 是否返回 `false`
2. 检查 `emitBlockQuads` 是否被调用
3. 检查是否正确输出到 emitter
4. 查看游戏日志中的渲染错误

### Q: 如何让方块发光？

发光效果通常需要：
1. 使用 `TRANSLUCENT` 混合模式
2. 设置亮度大于 0 的颜色
3. 或者使用 `LightmapTextureManager`

### Q: 如何添加纹理？

纹理需要通过 Sprite 加载，然后在 UV 坐标中使用：

```java
// 获取纹理 Sprite
Sprite sprite = blockView.getSprite(Identifier.of("mymod", "block/my_texture"));

// 设置 UV 坐标
emitter.u(0, sprite.getMinU());  // 左上角 U
emitter.v(0, sprite.getMinV());  // 左上角 V
emitter.u(1, sprite.getMaxU());  // 右下角 U
emitter.v(1, sprite.getMaxV());  // 右下角 V
```

---

## 6. 练习题

1. **练习 1**: 创建一个会随时间改变颜色的方块
   - 提示：在 `emitBlockQuads` 中使用 `System.currentTimeMillis()` 或世界时间

2. **练习 2**: 创建一个半透明的蓝色冰块
   - 提示：使用 `BlendMode.TRANSLUCENT` 和蓝色颜色

3. **练习 3**: 创建一个只有顶部发光的方块
   - 提示：只遍历 `Direction.UP` 方向

---

## 7. 下一步

现在你了解了渲染基础，让我们继续学习：

- **[自定义模型](02-custom-models.md)** - 创建更复杂的三维模型
- **[粒子效果](03-particles.md)** - 添加火焰、烟雾等粒子效果

---

## 相关资料

- [渲染系统分析文档](../analysis/06-rendering-system.md)
- [Fabric Renderer API Wiki](https://fabricmc.net/wiki/documentation:fabric_renderer_api_v1)
- [Indigo Renderer 源码](https://github.com/FabricMC/fabric/tree/1.21/fabric-renderer-indigo)