# 第一章：传输 API 教程

> 这一章学习 Fabric 的传输 API，用于处理流体、物品等资源的存储和传输。

---

## 目录

1. [传输 API 概述](#1-传输-api-概述)
2. [流体存储系统](#2-流体存储系统)
3. [物品存储系统](#3-物品存储系统)
4. [存储查找与使用](#4-存储查找与使用)
5. [事务管理](#5-事务管理)
6. [完整示例：流体储罐方块](#6-完整示例流体储罐方块)
7. [完整示例：物品管道方块](#7-完整示例物品管道方块)

---

## 1. 传输 API 概述

### 1.1 什么是传输 API？

传输 API（Transfer API）是 Fabric 提供的一套统一的资源传输抽象层。它允许我们以相同的方式处理不同类型的资源（如流体和物品），而不需要关心具体的实现细节。

### 1.2 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                    传输 API 架构                              │
├─────────────────────���───────────────────────────────────────┤
│                                                              │
│  Storage<T>          // 资源存储容器                          │
│  ├── insert()        // 插入资源                              │
│  ├── extract()       // 提取资源                              │
│  └── iterator()     // 遍历存储内容                          │
│                                                              │
│  StorageView<T>      // 单个存储视图                          │
│  ├── getResource()   // 获取资源                              │
│  ├── getAmount()    // 获取数量                              │
│  └── getCapacity()   // 获取容量                              │
│                                                              │
│  TransferVariant<T>  // 资源变体                              │
│  ├── FluidVariant    // 流体变体                              │
│  └── ItemVariant     // 物品变体                              │
│                                                              │
│  Transaction         // 事务管理                              │
│  └── SnapshotParticipant  // 快照参与者                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 依赖添加

在 `build.gradle` 中添加依赖：

```groovy
dependencies {
    // 传输 API
    modImplementation 'net.fabricmc:fabric-transfer-api-v1:${fabric_version}'
}
```

> **注意**：在 1.20.4+ 版本中，传输 API 已包含在 `fabric-api` 依赖中，无需单独添加。

---

## 2. 流体存储系统

### 2.1 FluidVariant 流体变体

流体变体代表一种特定的流体。类似于 `ItemStack` 代表物品堆，流体变体代表一定量的流体。

```java
// 创建空白流体变体（代表空）
FluidVariant blank = FluidVariant.blank();

// 创建水的流体变体
FluidVariant water = FluidVariant.of(Fluids.WATER);

// 获取流体对象
Fluid fluid = water.getFluid();  // 返回 Water
```

### 2.2 流体常量

Fabric 提供了流体常量系统，方便转换不同的计量单位：

```java
// 流体常量
FluidConstants.BUCKET    // 1桶 = 81000 滴
FluidConstants.BLOCK    // 1方块 = 81000 滴
FluidConstants.BOTTLE    // 1瓶 = 27000 滴
FluidConstants.INGOT    // 1锭 = 9000 滴
FluidConstants.NUGGET   // 1粒 = 1000 滴
FluidConstants.DROPLET // 1滴
```

### 2.3 SingleFluidStorage 单槽流体存储

`SingleFluidStorage` 是最常用的流体存储实现，适用于单种流体的存储（如储罐）。

```java
import net.fabricmc.fabric.api.transfer.v1.fluid.FluidConstants;
import net.fabricmc.fabric.api.transfer.v1.fluid.FluidStorage;
import net.fabricmc.fabric.api.transfer.v1.fluid.FluidVariant;
import net.fabricmc.fabric.api.transfer.v1.fluid.SingleFluidStorage;
import net.fabricmc.fabric.api.transfer.v1.storage.Storage;
import net.fabricmc.fabric.api.transfer.v1.storage.base.SingleSlotStorage;
import net.fabricmc.fabric.api.transfer.v1.transaction.Transaction;

// 创建流体存储
SingleFluidStorage storage = new SingleFluidStorage() {
    @Override
    protected FluidVariant getBlankVariant() {
        return FluidVariant.blank();  // 空白变体
    }

    @Override
    protected long getCapacity(FluidVariant variant) {
        return FluidConstants.BUCKET * 100;  // 100桶容量
    }

    @Override
    protected boolean canInsert(FluidVariant variant) {
        return variant.isOf(Fluids.WATER);  // 只接受水
    }

    @Override
    protected boolean canExtract(FluidVariant variant) {
        return true;  // 可以提取任何流体
    }

    @Override
    protected void onFinalCommit() {
        // 事务提交后的回调，用于保存数据
        markDirty();
    }
};
```

**关键方法说明**：

| 方法 | 说明 |
|-----|------|
| `getBlankVariant()` | 返回空白状态时的流体变体 |
| `getCapacity(variant)` | 返回给定流体的容量 |
| `canInsert(variant)` | 检查是否可以插入该流体 |
| `canExtract(variant)` | 检查是否可以提取流体 |
| `onFinalCommit()` | 事务成功提交后的回调 |

---

## 3. 物品存储系统

### 3.1 ItemVariant 物品变体

物品变体类似于 `ItemStack`，但更加轻量，用于传输 API。

```java
// 创建空白物品变体
ItemVariant blank = ItemVariant.of(Items.AIR);

// 从物品创建
ItemVariant diamond = ItemVariant.of(Items.DIAMOND);

// 从物品堆创建（保留组件/NBT）
ItemStack stack = new ItemStack(Items.DIAMOND, 10);
ItemVariant variant = ItemVariant.of(stack);

// 转换回物品堆
ItemStack restoredStack = variant.toStack();       // 64个
ItemStack restoredStack10 = variant.toStack(10);   // 10个
```

### 3.2 InventoryStorage 物品存储包装器

`InventoryStorage` 将普通的 `Inventory` 接口转换为 Storage API 兼容的格式。

```java
import net.fabricmc.fabric.api.transfer.v1.storage.InventoryStorage;
import net.fabricmc.fabric.api.transfer.v1.storage.SlottedStorage;
import net.fabricmc.fabric.api.transfer.v1.storage.base.SingleSlotStorage;

// 假设有一个 Inventory
Inventory inventory = ...;

// 包装为 Storage（null 表示无方向限制）
InventoryStorage storage = InventoryStorage.of(inventory, null);

// 获取槽位列表
List<SingleSlotStorage<ItemVariant>> slots = storage.getSlots();

// 遍历槽位
for (SingleSlotStorage<ItemVariant> slot : storage) {
    if (!slot.isResourceBlank()) {
        ItemVariant variant = slot.getResource();
        long amount = slot.getAmount();
        // 处理物品
    }
}
```

---

## 4. 存储查找与使用

### 4.1 查找流体存储

```java
// 获取方块位置的流体存储
Storage<FluidVariant> fluidStorage = FluidStorage.SIDED.find(world, pos, direction);

// 参数说明：
// - world: 世界
// - pos: 方块位置
// - direction: 交互方向（可以为 null）
```

### 4.2 查找物品存储

```java
// 获取方块位置的物品存储
Storage<ItemVariant> itemStorage = ItemStorage.SIDED.find(world, pos, direction);
```

### 4.3 使用存储进行插入和提取

```java
// 插入流体
Storage<FluidVariant> storage = FluidStorage.SIDED.find(world, pos, null);
if (storage != null) {
    FluidVariant water = FluidVariant.of(Fluids.WATER);
    
    // 开启事务
    try (Transaction tx = Transaction.openOuter()) {
        // 尝试插入 1000 滴
        long inserted = storage.insert(water, 1000, tx);
        
        if (inserted > 0) {
            tx.commit();  // 提交更改
            System.out.println("成功插入 " + inserted + " 滴流体");
        }
        // 如果没有插入，事务会自动回滚
    }
}

// 提取流体
try (Transaction tx = Transaction.openOuter()) {
    FluidVariant extractedVariant = null;
    long maxExtract = FluidConstants.BUCKET;  // 提取最多1桶
    
    // 从存储中提取（可以是任意流体）
    long extracted = storage.extract(
        resource -> true,  // 过滤器：接受任何流体
        maxExtract,
        tx
    );
    
    if (extracted > 0) {
        tx.commit();
    }
}
```

### 4.4 资源传输工具

`StorageUtil` 提供了便捷的资源传输方法：

```java
import net.fabricmc.fabric.api.transfer.v1.storage.StorageUtil;

// 从源传输到目标
long moved = StorageUtil.move(
    sourceStorage,           // 源存储
    targetStorage,           // ���标存储
    resource -> true,        // 资源过滤器（null 表示接受所有）
    FluidConstants.BUCKET,   // 每次传输最大量
    null                     // 事务（null 表示自动管理）
);

// 传输到空存储（只移动第一种资源）
long moved = StorageUtil.move(
    sourceStorage,
    targetStorage,
    variant -> variant.isOf(Fluids.LAVA),  // 只传输岩浆
    FluidConstants.BUCKET * 10,            // 最多10桶
    null
);
```

---

## 5. 事务管理

### 5.1 事务基础

事务用于确保多个存储操作要么全部成功，要么全部回滚。

```java
// 开启外部事务
try (Transaction tx = Transaction.openOuter()) {
    // 在这里进行存储操作
    
    // 提交事务
    tx.commit();
}
// 事务自动关闭

// 手动回滚
try (Transaction tx = Transaction.openOuter()) {
    storage.insert(variant, amount, tx);
    
    if (somethingWrong) {
        tx.abort();  // 回滚所有更改
        return;
    }
    
    tx.commit();
}
```

### 5.2 SnapshotParticipant 快照参与者

如果你的方块实体需要在事务中正确保存状态，需要继承 `SnapshotParticipant`。

```java
import net.fabricmc.fabric.api.transfer.v1.transaction.SnapshotParticipant;
import net.fabricmc.fabric.api.transfer.v1.transaction.TransactionContext;

public class MyBlockEntity extends BlockEntity implements SnapshotParticipant<MyData> {
    
    private int storedAmount;
    private Fluid storedFluid;
    
    @Override
    public MyData createSnapshot() {
        // 创建数据快照
        return new MyData(storedAmount, storedFluid);
    }

    @Override
    public void readSnapshot(MyData snapshot) {
        // 从快照恢复数据
        this.storedAmount = snapshot.amount;
        this.storedFluid = snapshot.fluid;
    }

    @Override
    public void onFinalCommit() {
        // 最终提交时的回调
        markDirty();
    }
}
```

---

## 6. 完整示例：流体储罐方块

### 6.1 方块类

```java
package net.example.mymod.block;

import net.example.mymod.block.entity.FluidTankBlockEntity;
import net.minecraft.block.BlockState;
import net.minecraft.block.BlockWithEntity;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

public class FluidTankBlock extends BlockWithEntity {
    
    public FluidTankBlock(Settings settings) {
        super(settings);
    }

    @Override
    public BlockEntity createBlockEntity(BlockPos pos, BlockState state) {
        return new FluidTankBlockEntity(pos, state);
    }
    
    @Override
    public BlockRenderType getRenderType(BlockState state) {
        return BlockRenderType.INVISIBLE;  // 使用自定义渲染
    }
}
```

### 6.2 方块实体类

```java
package net.example.mymod.block.entity;

import net.fabricmc.fabric.api.transfer.v1.fluid.FluidConstants;
import net.fabricmc.fabric.api.transfer.v1.fluid.FluidStorage;
import net.fabricmc.fabric.api.transfer.v1.fluid.FluidVariant;
import net.fabricmc.fabric.api.transfer.v1.fluid.SingleFluidStorage;
import net.fabricmc.fabric.api.transfer.v1.transaction.TransactionContext;
import net.fabricmc.fabric.api.transfer.v1.transaction.SnapshotParticipant;
import net.minecraft.block.BlockState;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

public class FluidTankBlockEntity extends BlockEntity implements SnapshotParticipant<FluidTankData> {
    
    // 存储当前流体数据
    private FluidVariant currentVariant = FluidVariant.blank();
    private long amount = 0;
    
    // 容量：100桶
    private static final long CAPACITY = FluidConstants.BUCKET * 100;
    
    // 流体存储实现
    private final SingleFluidStorage fluidStorage = new SingleFluidStorage() {
        @Override
        protected FluidVariant getBlankVariant() {
            return FluidVariant.blank();
        }

        @Override
        protected long getCapacity(FluidVariant variant) {
            return CAPACITY;
        }

        @Override
        protected boolean canInsert(FluidVariant variant) {
            // 只能插入水或岩浆
            return variant.isOf(net.minecraft.fluid.Fluids.WATER) 
                || variant.isOf(net.minecraft.fluid.Fluids.LAVA);
        }

        @Override
        protected boolean canExtract(FluidVariant variant) {
            return true;
        }

        @Override
        protected void onFinalCommit() {
            markDirty();
        }
    };
    
    public FluidTankBlockEntity(BlockPos pos, BlockState state) {
        super(ModBlockEntities.FLUID_TANK, pos, state);
    }
    
    // 获取流体存储（供外部访问）
    public SingleFluidStorage getFluidStorage() {
        return fluidStorage;
    }
    
    @Override
    protected void writeNbt(NbtCompound nbt) {
        super.writeNbt(nbt);
        // 保存流体数据
        nbt.putLong("amount", amount);
        if (!currentVariant.isBlank()) {
            nbt.putString("fluid", currentVariant.getFluid().toString());
        }
    }
    
    @Override
    public void readNbt(NbtCompound nbt) {
        super.readNbt(nbt);
        // 读取流体数据
        amount = nbt.getLong("amount");
        String fluidName = nbt.getString("fluid");
        if (!fluidName.isEmpty()) {
            // 这里需要根据字符串获取 Fluid
            // 简化处理，实际项目中应妥善保存
        }
    }
    
    // SnapshotParticipant 实现
    @Override
    public FluidTankData createSnapshot() {
        return new FluidTankData(currentVariant, amount);
    }
    
    @Override
    public void readSnapshot(FluidTankData snapshot) {
        this.currentVariant = snapshot.variant;
        this.amount = snapshot.amount;
    }
    
    @Override
    public void onFinalCommit() {
        markDirty();
    }
    
    // 数据快照类
    private record FluidTankData(FluidVariant variant, long amount) {}
}
```

### 6.3 注册方块实体

```java
package net.example.mymod.init;

import net.example.mymod.block.entity.FluidTankBlockEntity;
import net.minecraft.block.entity.BlockEntityType;
import net.minecraft.registry.Registry;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.example.mymod.Mymod;

public class ModBlockEntities {
    public static final BlockEntityType<FluidTankBlockEntity> FLUID_TANK = 
        Registry.register(
            Registries.BLOCK_ENTITY_TYPE,
            Identifier.of(Mymod.MOD_ID, "fluid_tank"),
            BlockEntityType.Builder.create(
                FluidTankBlockEntity::new,
                ModBlocks.FLUID_TANK
            ).build()
        );
    
    public static void register() {
        // 注册方块实体
    }
}
```

### 6.4 使用流体储罐

```java
package net.example.mymod.util;

import net.fabricmc.fabric.api.transfer.v1.fluid.FluidConstants;
import net.fabricmc.fabric.api.transfer.v1.fluid.FluidStorage;
import net.fabricmc.fabric.api.transfer.v1.fluid.FluidVariant;
import net.fabricmc.fabric.api.transfer.v1.storage.Storage;
import net.fabricmc.fabric.api.transfer.v1.transaction.Transaction;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

public class FluidHelper {
    
    // 从储罐中提取流体到桶中
    public static boolean fillBucket(World world, BlockPos tankPos) {
        // 获取流体存储
        Storage<FluidVariant> storage = FluidStorage.SIDED.find(world, tankPos, null);
        
        if (storage == null) {
            return false;
        }
        
        try (Transaction tx = Transaction.openOuter()) {
            // 提取一桶流体
            long extracted = storage.extract(
                variant -> true,         // 提取任何流体
                FluidConstants.BUCKET,   // 提取1桶
                tx
            );
            
            if (extracted > 0) {
                tx.commit();
                return true;
            }
        }
        
        return false;
    }
    
    // 向储罐注入流体
    public static long fillTank(World world, BlockPos tankPos, net.minecraft.fluid.Fluid fluid, long amount) {
        Storage<FluidVariant> storage = FluidStorage.SIDED.find(world, tankPos, null);
        
        if (storage == null) {
            return 0;
        }
        
        FluidVariant variant = FluidVariant.of(fluid);
        
        try (Transaction tx = Transaction.openOuter()) {
            long inserted = storage.insert(variant, amount, tx);
            
            if (inserted > 0) {
                tx.commit();
            }
            
            return inserted;
        }
    }
}
```

---

## 7. 完整示例：物品管道方块

### 7.1 物品传输方块实体

```java
package net.example.mymod.block.entity;

import net.fabricmc.fabric.api.transfer.v1.item.InventoryStorage;
import net.fabricmc.fabric.api.transfer.v1.item.ItemStorage;
import net.fabricmc.fabric.api.transfer.v1.item.ItemVariant;
import net.fabricmc.fabric.api.transfer.v1.storage.Storage;
import net.fabricmc.fabric.api.transfer.v1.storage.base.SingleSlotStorage;
import net.fabricmc.fabric.api.transfer.v1.storage.base.SlottedStorage;
import net.fabricmc.fabric.api.transfer.v1.transaction.Transaction;
import net.fabricmc.fabric.api.transfer.v1.transaction.TransactionContext;
import net.fabricmc.fabric.api.transfer.v1.transaction.SnapshotParticipant;
import net.minecraft.block.BlockState;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.inventory.Inventory;
import net.minecraft.inventory.SidedInventory;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import net.minecraft.world.World;

import java.util.List;

public class ItemPipeBlockEntity extends BlockEntity implements SnapshotParticipant<ItemPipeData> {
    
    // 内部缓存的物品
    private ItemVariant cachedResource = ItemVariant blank();
    private long cachedAmount = 0;
    
    public ItemPipeBlockEntity(BlockPos pos, BlockState state) {
        super(ModBlockEntities.ITEM_PIPE, pos, state);
    }
    
    // 每刻调用一次，传输物品
    public void tick() {
        if (world == null || world.isClient()) {
            return;
        }
        
        // 从相邻方块获取物品
        for (Direction direction : Direction.values()) {
            if (direction == Direction.DOWN) continue;  // 跳过向下
            
            BlockPos neighborPos = pos.offset(direction);
            Storage<ItemVariant> neighborStorage = ItemStorage.SIDED.find(world, neighborPos, direction.getOpposite());
            
            if (neighborStorage != null) {
                // 从邻居提取物品到当前方块
                try (Transaction tx = Transaction.openOuter()) {
                    long extracted = neighborStorage.extract(
                        variant -> true,  // 提取任何物品
                        64,               // 最多64个
                        tx
                    );
                    
                    if (extracted > 0) {
                        tx.commit();
                        cachedAmount += extracted;
                    }
                }
                break;  // 每刻只从一个方向获取
            }
        }
        
        // 如果有物品，推送到输出方向（假设是南）
        if (cachedAmount > 0) {
            Direction outputDir = Direction.SOUT;
            BlockPos outputPos = pos.offset(outputDir);
            Storage<ItemVariant> outputStorage = ItemStorage.SIDED.find(world, outputPos, outputDir.getOpposite());
            
            if (outputStorage != null) {
                try (Transaction tx = Transaction.openOuter()) {
                    long inserted = outputStorage.insert(cachedResource, cachedAmount, tx);
                    
                    if (inserted > 0) {
                        cachedAmount -= inserted;
                        tx.commit();
                    }
                }
            }
        }
        
        // ��记需要保存
        if (cachedAmount > 0) {
            markDirty();
        }
    }
    
    @Override
    protected void writeNbt(NbtCompound nbt) {
        super.writeNbt(nbt);
        nbt.putLong("amount", cachedAmount);
    }
    
    @Override
    public void readNbt(NbtCompound nbt) {
        super.readNbt(nbt);
        cachedAmount = nbt.getLong("amount");
    }
    
    // SnapshotParticipant 实现
    @Override
    public ItemPipeData createSnapshot() {
        return new ItemPipeData(cachedResource, cachedAmount);
    }
    
    @Override
    public void readSnapshot(ItemPipeData snapshot) {
        this.cachedResource = snapshot.resource();
        this.cachedAmount = snapshot.amount();
    }
    
    @Override
    public void onFinalCommit() {
        markDirty();
    }
    
    private record ItemPipeData(ItemVariant resource, long amount) {}
}
```

### 7.2 方块类（带刻面更新）

```java
package net.example.mymod.block;

import net.example.mymod.block.entity.ItemPipeBlockEntity;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

public class ItemPipeBlock extends Block {
    
    public ItemPipeBlock(Settings settings) {
        super(settings);
    }
    
    @Override
    public BlockEntity createBlockEntity(BlockPos pos, BlockState state) {
        return new ItemPipeBlockEntity(pos, state);
    }
    
    @Override
    public void onStateAdded(BlockState state, World world, BlockPos pos, BlockState oldState, boolean moved) {
        super.onStateAdded(state, world, pos, oldState, moved);
        
        // 添加到刻面更新
        if (!world.isClient()) {
            world.scheduleBlockTick(pos, this, 1);
        }
    }
    
    @Override
    public void scheduledTick(BlockState state, World world, BlockPos pos) {
        super.scheduledTick(state, world, pos);
        
        // 获取方块实体并执行传输
        BlockEntity blockEntity = world.getBlockEntity(pos);
        if (blockEntity instanceof ItemPipeBlockEntity pipe) {
            pipe.tick();
        }
        
        // 继续调度下一次更新
        world.scheduleBlockTick(pos, this, 1);
    }
}
```

---

## 下一步

现在你学会了传输 API！接下来可以学习：

- [数据附件](./02-data-attachment.md) - 存储自定义数据
- [配方系统](./03-recipes.md) - 创建自定义合成配方

---

*参考：[传输系统分析](../../analysis/09-transfer-system.md)*