# Minecraft 1.21 核心参考速查表

> 包含所有核心系统的关键类、接口、枚举速查表

---

## 1. 版本常量速查

| 常量名 | 值 | 说明 |
|--------|-----|------|
| `PROTOCOL_VERSION` | 767 | 网络协议版本 |
| `WORLD_VERSION` | 3953 | 世界数据版本 |
| `RESOURCE_PACK_VERSION` | 34 | 资源包版本 |
| `DATA_PACK_VERSION` | 48 | 数据包版本 |
| `TICKS_PER_SECOND` | 20 | 每秒游戏刻 |
| `TICKS_PER_DAY` | 24000 | 一天的游戏刻数 |
| `DEFAULT_WORLD_HEIGHT` | 256 | 默认世界高度 |
| `CHUNK_WIDTH` | 16 | 区块宽度（格） |
| `MAX_ENTITY_TRACKING_RANGE` | 64 | 实体最大追踪距离 |

---

## 2. 注册表系统速查

| 注册表键 | 类 | 内置条目数 |
|----------|-----|-----------|
| `BLOCK` | `Registry<Block>` | ~2000 |
| `ITEM` | `Registry<Item>` | ~2000 |
| `ENTITY_TYPE` | `Registry<EntityType>` | ~600 |
| `FLUID` | `Registry<Fluid>` | ~30 |
| `SOUND_EVENT` | `Registry<SoundEvent>` | ~600 |
| `POTION` | `DefaultedRegistry<Potion>` | ~50 |
| `BIOME` | `Registry<Biome>` | ~100 |
| `RECIPE_TYPE` | `Registry<RecipeType>` | ~10 |
| `PARTICLE_TYPE` | `Registry<ParticleType>` | ~100 |
| `STATUS_EFFECT` | `Registry<StatusEffect>` | ~50 |

**关键类：**

| 类 | 用途 |
|----|------|
| `Identifier` | 资源定位符（如 `minecraft:stone`） |
| `RegistryKey<T>` | 注册表键（包含命名空间和路径） |
| `RegistryEntry<T>` | 注册表条目（包含引用信息） |
| `TagKey<T>` | 标签键（如 `#minecraft:logs`） |
| `Holder<T>` | 值持有者（用于跨模组引用） |

---

## 3. 方块系统速查

| 类 | 用途 |
|----|------|
| `Block` | 方块基类 |
| `BlockState` | 方块状态（包含属性值） |
| `AbstractBlock` | 抽象方块实现 |
| `BlockEntity` | 方块实体（可选，用于存储额外数据） |
| `BlockPos` | 方块坐标（x, y, z） |
| `BlockBox` | 方块边界框 |
| `BlockStatePredicate` | 方块状态谓词 |

**常见方块方法：**

| 方法 | 用途 |
|------|------|
| `Block::getDefaultState` | 获取默认状态 |
| `BlockState::with` | 设置属性值 |
| `BlockState::get` | 获取属性值 |
| `World::setBlockState` | 设置方块 |
| `World::getBlockState` | 获取方块状态 |
| `World::getBlockEntity` | 获取方块实体 |

---

## 4. 物品系统速查

| 类 | 用途 |
|----|------|
| `Item` | 物品基类 |
| `ItemStack` | 物品堆叠（包含数量和 NBT） |
| `ItemGroup` | 物品创造栏分组 |
| `EquipmentSlot` | 装备槽位 |
| `ComponentMap` | 组件映射（1.21+） |
| `DataComponentTypes` | 组件类型注册表 |

**常见物品方法：**

| 方法 | 用途 |
|------|------|
| `ItemStack::getItem` | 获取物品类型 |
| `ItemStack::getCount` | 获取数量 |
| `ItemStack::getOrDefault` | 获取组件值 |
| `ItemStack::set` | 设置组件值 |
| `Item::use` | 使用物品 |
| `Item::onEntityUse` | 实体交互 |

---

## 5. 实体系统速查

| 类 | 用途 |
|----|------|
| `Entity` | 实体基类 |
| `LivingEntity` | 有生命实体（血量、药水效果） |
| `MobEntity` | 生物实体（AI） |
| `PlayerEntity` | 玩家实体 |
| `EntityType<T>` | 实体类型定义 |
| `EntityPose` | 实体姿势 |

**实体属性速查：**

| 属性 | 默认值 | 范围 |
|------|--------|------|
| `GENERIC_MAX_HEALTH` | 20.0 | 1.0 - 1024.0 |
| `GENERIC_MOVEMENT_SPEED` | 0.7 | 0.0 - 1024.0 |
| `GENERIC_ATTACK_DAMAGE` | 1.0 | 0.0 - 2048.0 |
| `GENERIC_ARMOR` | 0.0 | 0.0 - 30.0 |
| `GENERIC_ARMOR_TOUGHNESS` | 0.0 | 0.0 - 20.0 |
| `GENERIC_ATTACK_SPEED` | 4.0 | 0.0 - 1024.0 |
| `GENERIC_LUCK` | 0.0 | -1024.0 - 1024.0 |

---

## 6. AI 系统速查

| 类 | 用途 |
|----|------|
| `Brain<T>` | AI 大脑 |
| `MemoryModuleType` | 记忆模块类型 |
| `SensorType` | 传感器类型 |
| `Activity` | 活动状态 |
| `Schedule` | 时间表 |
| `PathNode` | 路径节点 |
| `Path` | 路径 |
| `PathNavigator` | 路径导航器 |

**常用记忆类型：**

| 记忆类型 | 内容 |
|---------|------|
| `WALK_TARGET` | 行走目标位置 |
| `LOOK_TARGET` | 注视目标 |
| `ATTACK_TARGET` | 攻击目标 |
| `BREED_TARGET` | 繁殖目标 |
| `NEAREST_LIVING_ENTITIES` | 最近生物 |
| `HOME` | 家位置 |
| `INTERACTION_TARGET` | 交互目标 |

**常用传感器：**

| 传感器 | 检测内容 |
|--------|---------|
| `NEAREST_LIVING_ENTITIES` | 最近生物 |
| `NEAREST_PLAYERS` | 最近玩家 |
| `NEAREST_ITEMS` | 最近物品 |
| `HURT_BY` | 伤害来源 |
| `ANGER_TIME` | 愤怒时间 |

---

## 7. 网络协议速查

| 协议状态 | 说明 |
|---------|------|
| `HANDSHAKING` | 握手阶段 |
| `STATUS` | 状态查询 |
| `LOGIN` | 登录阶段 |
| `CONFIGURATION` | 配置阶段（1.19.3+） |
| `PLAY` | 游戏阶段 |

**关键数据包类：**

| 类 | 方向 | 用途 |
|----|------|------|
| `HandshakeS2CPacket` | S2C | 协议版本交换 |
| `LoginS2CPacket` | S2C | 登录成功/失败 |
| `PlayLoadedInS2CPacket` | S2C | 开始游戏 |
| `SpawnEntityS2CPacket` | S2C | 生成实体 |
| `ChunkDataS2CPacket` | S2C | 区块数据 |
| `ClientCommandC2SPacket` | C2S | 客户端命令 |
| `PlayerMoveC2SPacket` | C2S | 玩家移动 |

---

## 8. 世界系统速查

| 类 | 用途 |
|----|------|
| `World` | 世界基类 |
| `ServerWorld` | 服务端世界 |
| `ClientWorld` | 客户端世界 |
| `WorldBorder` | 世界边界 |
| `ChunkManager` | 区块管理器 |
| `ServerChunkManager` | 服务端区块管理 |
| `ChunkGenerator` | 区块生成器 |

**世界坐标系统：**

| 类 | 范围 | 用途 |
|----|------|------|
| `BlockPos` | 整数 | 方块位置 |
| `Vec3d` | 浮点 | 3D 位置 |
| `Vec3i` | 整数 | 3D 向量 |
| `ChunkPos` | 整数 | 区块坐标 |
| `SectionPos` | 整数 | 区块段坐标 |

---

## 9. 粒子系统速查

| 粒子类型 | ID | 用途 |
|---------|-----|------|
| `FLAME` | `flame` | 火焰 |
| `SMOKE` | `smoke` | 烟雾 |
| `BUBBLE` | `bubble` | 气泡 |
| `HEART` | `heart` | 爱心 |
| `CRIT` | `crit` | 暴击 |
| `DUST` | `dust` | 彩色灰尘 |
| `BLOCK` | `block` | 方块碎片 |
| `ITEM` | `item` | 物品图标 |

---

## 10. 声音系统速查

| 声音类别 | 设置滑块 |
|---------|---------|
| `MASTER` | 总音量 |
| `MUSIC` | 音乐 |
| `RECORDS` | 唱片 |
| `WEATHER` | 天气 |
| `BLOCKS` | 方块 |
| `HOSTILE` | 敌对生物 |
| `NEUTRAL` | 中立生物 |
| `PLAYERS` | 玩家 |
| `AMBIENT` | 环境 |
| `VOICE` | 语音 |

---

## 11. 进度系统速查

| 触发器 ID | 用途 |
|-----------|------|
| `inventory_changed` | 背包变化 |
| `player_killed_entity` | 击杀实体 |
| `enter_block` | 进入方块 |
| `effects_changed` | 药水效果变化 |
| `recipe_unlocked` | 配方解锁 |
| `tick` | 每刻检查 |
| `location` | 位置检查 |
| `breed_animals` | 繁殖动物 |

| 框架类型 | 外观 | 难度 |
|---------|------|------|
| `TASK` | 绿色对勾 | 普通 |
| `GOAL` | 绿色旗帜 | 中等 |
| `CHALLENGE` | 红色感叹号 | 困难 |

---

## 12. 战利品系统速查

| 条件 ID | 用途 |
|---------|------|
| `random_chance` | 随机概率 |
| `killed_by_player` | 被玩家击杀 |
| `survives_explosion` | 爆炸中存活 |
| `table_bonus` | 时运加成 |
| `enchantment_check` | 附魔检查 |

| 函数 ID | 用途 |
|---------|------|
| `set_count` | 设置数量 |
| `set_nbt` | 设置 NBT |
| `enchant_randomly` | 随机附魔 |
| `looting_enchant` | 抢夺加成 |
| `furnace_smelt` | 熔炉烧制 |

---

## 13. 配方系统速查

| 配方类型 | JSON ID | 输出 |
|---------|---------|------|
| 有形状合成 | `crafting_shaped` | 任意 |
| 无形状合成 | `crafting_shapeless` | 任意 |
| 熔炉烧制 | `smelting` | 经验值 |
| 烟熏炉 | `smoking` | 1.5x 经验 |
| 高炉 | `blasting` | 2x 经验 |
| 锻造 | `smithing_transform` | 装备升级 |
| 切石 | `stonecutting` | 材料转换 |

---

## 14. 常用事件速查

| 事件类 | 触发时机 |
|--------|---------|
| `PlayerTickEvent` | 玩家每刻 |
| `LivingEntityUseItemEvent` | 使用物品时 |
| `LivingEntityDropsEvent` | 生物掉落时 |
| `BlockBreakEvent` | 方块破坏时 |
| `ItemCraftedEvent` | 物品合成时 |
| `PlayerLoggedInEvent` | 玩家登录时 |
| `PlayerRespawnEvent` | 玩家重生时 |
| `ChunkLoadEvent` | 区块加载时 |
| `ChunkUnloadEvent` | 区块卸载时 |

---

## 15. 常用工具类速查

| 类 | 用途 |
|----|------|
| `Identifier` | 资源标识符 |
| `Text` | 文本组件 |
| `NbtCompound` | NBT 复合标签 |
| `ItemStack` | 物品堆叠 |
| `BlockPos` | 方块坐标 |
| `Vec3d` | 3D 向量 |
| `AxisRotation` | 轴旋转 |
| `Direction` | 方向（东西南北上下） |
| `ItemConvertible` | 可转换为物品的接口 |
| `BlockConvertible` | 可转换为方块的接口 |

---

## 16. 网络压缩速查

| 设置 | 值 | 说明 |
|------|-----|------|
| 压缩阈值 | 256 字节 | 小于此不压缩 |
| 压缩级别 | 默认 | zlib 压缩 |
| 禁用阈值 | -1 | 禁用压缩 |

---

## 17. 数据包序列化速查

| 类型 | Codec | 说明 |
|------|-------|------|
| `int` | `Codec.INT` | 32 位整数 |
| `VarInt` | `VarIntCodec` | 可变长度整数 |
| `long` | `Codec.LONG` | 64 位整数 |
| `float` | `Codec.FLOAT` | 32 位浮点 |
| `double` | `Codec.DOUBLE` | 64 位浮点 |
| `String` | `Codec.STRING` | UTF-8 字符串 |
| `Boolean` | `Codec.BOOL` | 布尔值 |
| `NbtElement` | `NbtOps.INSTANCE` | NBT 数据 |
| `Identifier` | `Identifier.CODEC` | 资源标识符 |
| `ItemStack` | `ItemStack.CODEC` | 物品堆叠 |

---

## 18. 世界生成速查

| 噪声类型 | 用途 |
|---------|------|
| `PERLIN` | Perlin 噪声 |
| `OPEN_SIMPLEX2` | 开 simplicial 噪声 |
| `VALUE` | 值噪声 |

| 生物群系类型 | 温度 |
|-------------|------|
| `DESERT` | 2.0 |
| `PLAINS` | 0.8 |
| `FOREST` | 0.7 |
| `TAIGA` | 0.25 |
| `MOUNTAINS` | 0.2 |
| `OCEAN` | 0.5 |
| `SNOW` | 0.0 |
| `NETHER` | 2.0 |
| `END` | 0.5 |

---

## 19. 性能优化速查

| 指标 | 正常值 | 问题值 |
|------|--------|--------|
| TPS | 20.0 | <15 |
| 平均 Tick 时间 | <50ms | >50ms |
| 内存使用 | <70% | >85% |
| 区块加载 | <100/sec | >500/sec |
| 实体数量 | <300 | >500 |

**优化建议：**

1. **区块加载**：使用视距限制
2. **实体数量**：减少生物群系生成
3. **红石**：避免高频更新
4. **村民**：限制工作站数量
5. **实体追踪**：使用追踪距离限制

---

## 20. 常见错误码速查

| 错误码 | 原因 | 解决方案 |
|--------|------|---------|
| `disconnect.timeout` | 连接超时 | 检查网络 |
| `disconnect.end` | 服务器关闭 | 等待重连 |
| `disconnect.quitting` | 主动退出 | 正常 |
| `disconnect.kicked` | 被踢出 | 检查原因 |
| `disconnect.invalid_signature` | 签名无效 | 刷新会话 |
| `disconnect.bad_packet` | 错误数据包 | 更新客户端 |

---

*本速查表基于 Minecraft 1.21 源码分析整理*
