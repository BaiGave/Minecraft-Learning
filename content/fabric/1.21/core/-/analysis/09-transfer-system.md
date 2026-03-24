# Fabric API 传输/存储系统分析

## 概述

Transfer API 是 Fabric 提供的统一资源传输抽象层，支持流体、物品等不同类型资源的插入和提取操作。

**模块**: `fabric-transfer-api-v1`

---

## 1. 核心接口架构

### 1.1 存储接口层次

```
Storage<T>                    // 资源存储容器
├── insert()                   // 插入资源
├── extract()                  // 提取资源
├── supportsInsertion()         // 是否支持插入
├── supportsExtraction()        // 是否支持提取
└── iterator()                // 遍历存储内容

StorageView<T>                // 单种资源的视图
├── extract()                  // 从视图提取
├── isResourceBlank()          // 资源是否为空
├── getResource()             // 获取资源
├── getAmount()                // 获取数量
└── getCapacity()              // 获取容量

SlottedStorage<T>             // 槽位化存储
├── getSlotCount()            // 获取槽位数
└── getSlot(index)            // 获取特定槽位

SingleSlotStorage<T>           // 单槽位存储
```

### 1.2 Storage 接口

```java
public interface Storage<T> extends Iterable<StorageView<T>> {
    static <T> Storage<T> empty() { ... }

    default boolean supportsInsertion() { return true; }
    long insert(T resource, long maxAmount, TransactionContext transaction);

    default boolean supportsExtraction() { return true; }
    long extract(T resource, long maxAmount, TransactionContext transaction);

    Iterator<StorageView<T>> iterator();
    default long getVersion() { ... }
}
```

---

## 2. 流体存储系统

### 2.1 FluidVariant 流体变体

```java
public interface FluidVariant extends TransferVariant<Fluid> {
    static FluidVariant blank() { return of(Fluids.EMPTY); }
    static FluidVariant of(Fluid fluid) { return of(fluid, ComponentChanges.EMPTY); }
    static FluidVariant of(Fluid fluid, ComponentChanges components) { ... }

    default Fluid getFluid() { return getObject(); }
    FluidVariant withComponentChanges(ComponentChanges changes);
}
```

### 2.2 流体常量系统

```java
public final class FluidConstants {
    public static final long BUCKET = 81000;      // 1桶 = 81000滴
    public static final long BOTTLE = 27000;      // 1瓶 = 27000滴
    public static final long BLOCK = 81000;       // 1方块 = 81000滴
    public static final long INGOT = 9000;        // 1锭 = 9000滴
    public static final long NUGGET = 1000;       // 1粒 = 1000滴
    public static final long DROPLET = 1;         // 1滴
}
```

---

## 3. 物品存储系统

### 3.1 ItemVariant 物品变体

```java
public interface ItemVariant extends TransferVariant<Item> {
    static ItemVariant blank() { return of(Items.AIR); }
    static ItemVariant of(ItemStack stack) { return of(stack.getItem(), stack.getComponentChanges()); }
    static ItemVariant of(ItemConvertible item) { return of(item, ComponentChanges.EMPTY); }

    boolean matches(ItemStack stack);  // 匹配物品和组件
    ItemStack toStack();              // 转换为物品堆
    ItemStack toStack(int count);
}
```

### 3.2 InventoryStorage 物品存储包装器

```java
public interface InventoryStorage extends SlottedStorage<ItemVariant> {
    static InventoryStorage of(Inventory inventory, @Nullable Direction direction) { ... }

    @UnmodifiableView List<SingleSlotStorage<ItemVariant>> getSlots();
}
```

---

## 4. 事务管理系统

### 4.1 事务核心接口

```java
public interface Transaction extends AutoCloseable, TransactionContext {
    static Transaction openOuter() { ... }
    static boolean isOpen() { return getLifecycle() != Lifecycle.NONE; }

    void abort();    // 回滚事务
    void commit();    // 提交事务

    enum Lifecycle { NONE, OPEN, CLOSING, OUTER_CLOSING }
}
```

### 4.2 SnapshotParticipant 快照参与者

```java
public abstract class SnapshotParticipant<T> implements Transaction.CloseCallback,
        Transaction.OuterCloseCallback {
    // 1. 修改前调用：保存状态快照
    public void updateSnapshots(TransactionContext transaction) { ... }

    // 2. 事务关闭回调
    @Override
    public void onClose(TransactionContext transaction, Transaction.Result result) {
        if (result.wasAborted()) {
            readSnapshot(snapshot);      // 回滚到快照
            releaseSnapshot(snapshot);
        } else {
            releaseSnapshot(snapshot);
            transaction.addOuterCloseCallback(this);
        }
    }

    protected abstract T createSnapshot();
    protected abstract void readSnapshot(T snapshot);
    protected void onFinalCommit() { }
}
```

---

## 5. API Lookup 机制

### 5.1 BlockApiLookup

```java
public interface BlockApiLookup<A, C> {
    static <A, C> BlockApiLookup<A, C> get(Identifier lookupId, Class<A> apiClass, Class<C> contextClass);

    A find(World world, BlockPos pos, C context);

    void registerSelf(BlockEntityType<?>... blockEntityTypes);
    void registerForBlockEntity(BiFunction<? super T, C, @Nullable A> provider, BlockEntityType<T> blockEntityType);
    void registerFallback(BlockApiProvider<A, C> fallbackProvider);
}
```

---

## 6. 使用示例

### 6.1 创建流体存储方块实体

```java
public class MyFluidTankBlockEntity extends BlockEntity {
    private final SingleFluidStorage storage = new SingleFluidStorage() {
        @Override
        protected FluidVariant getBlankVariant() {
            return FluidVariant.blank();
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
            markDirty();
        }
    };
}
```

### 6.2 使用存储

```java
public void onBlockActivated(World world, BlockPos pos, PlayerEntity player) {
    Storage<FluidVariant> storage = FluidStorage.SIDED.find(world, pos, null);

    if (storage != null) {
        FluidVariant variant = FluidVariant.of(Fluids.WATER);

        try (Transaction tx = Transaction.openOuter()) {
            // 尝试插入1000滴水
            long inserted = storage.insert(variant, 1000, tx);
            tx.commit();  // 提交更改
        }
    }
}
```

### 6.3 资源传输

```java
// 从源提取并插入目标
long moved = StorageUtil.move(
    sourceStorage,
    targetStorage,
    resource -> true,  // 过滤器
    FluidConstants.BUCKET,  // 最大数量
    null  // 事务（null表示自动管理）
);
```

---

## 架构总结

```
┌─────────────────────────────────────────────────────────────┐
│                    Transfer API                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Storage<T>                                                │
│  ├── CombinedStorage<T,S>                                   │
│  ├── SingleVariantStorage<T>                                │
│  │   ├── SingleFluidStorage                                 │
│  │   └── SingleItemStorage                                 │
│  └── InventoryStorageImpl                                   │
│                                                              │
│  TransferVariant<O>                                         │
│  ├── FluidVariant                                          │
│  └── ItemVariant                                           │
│                                                              │
│  Transaction                                                │
│  ├── SnapshotParticipant                                    │
│  └── Context/Result                                         │
│                                                              │
│  API Lookup                                                 │
│  ├── BlockApiLookup<A, C>                                   │
│  ├── ItemApiLookup<A, C>                                    │
│  └── EntityApiLookup<A, C>                                  │
└─────────────────────────────────────────────────────────────┘
```

---

*源码位置: `fabric-transfer-api-v1/`*
