# Minecraft 源码学习路线图

> 包含所有核心系统的可视化图表，帮助萌新理解MC的整体架构

---

## 一、全局学习路线图

```mermaid
flowchart TB
    subgraph Phase0["第0部分：前置知识 (2-3天)"]
        P0-1["Java基础速查<br/>01-java-basics.md"]
        P0-2["开发环境搭建<br/>02-development-env.md"]
        P0-3["项目结构介绍<br/>03-project-intro.md"]
        P0-4["课程概述<br/>00-course-overview.md"]
    end

    subgraph Phase1["第1部分：核心基础 (3-5天)"]
        P1-1["注册表系统 ⭐<br/>04-registry-system.md"]
        P1-2["客户端-服务端架构<br/>05-client-server-arch.md"]
        P1-3["全局常量与版本<br/>06-shared-constants.md"]
        P1-4["启动引导流程<br/>07-bootstrap-flow.md"]
    end

    subgraph Phase2["第2部分：世界系统 (5-7天)"]
        P2-1["World核心类<br/>08-world-core.md"]
        P2-2["Chunk区块系统<br/>09-chunk-system.md"]
        P2-3["Biome生物群系<br/>10-biome-system.md"]
        P2-4["地形生成<br/>11-terrain-gen.md"]
        P2-5["光照系统<br/>12-lighting-system.md"]
        P2-6["Heightmap高度图<br/>13-heightmap.md"]
    end

    subgraph Phase3["第3部分：方块物品 (5-7天)"]
        P3-1["Block方块基础<br/>14-block-basics.md"]
        P3-2["BlockState方块状态<br/>15-block-state.md"]
        P3-3["BlockEntity方块实体<br/>16-block-entity.md"]
        P3-4["Item物品基础<br/>17-item-basics.md"]
        P3-5["ItemStack物品堆叠<br/>18-item-stack.md"]
        P3-6["Component组件系统<br/>19-item-component.md"]
    end

    subgraph Phase4["第4部分：实体系统 (5-7天)"]
        P4-1["Entity实体入门<br/>20-entity-intro.md"]
        P4-2["实体生命周期<br/>21-entity-lifecycle.md"]
        P4-3["LivingEntity<br/>22-living-entity.md"]
        P4-4["MobEntity生物<br/>23-mob-entity.md"]
        P4-5["Attribute属性<br/>24-entity-attributes.md"]
        P4-6["Damage伤害系统<br/>25-damage-system.md"]
        P4-7["Spawn生成系统<br/>26-spawn-system.md"]
    end

    subgraph Phase5["第5部分：AI系统 (5-7天)"]
        P5-1["AI Brain入门 ⭐<br/>27-ai-brain-intro.md"]
        P5-2["Memory记忆系统<br/>28-memory-system.md"]
        P5-3["Sensor传感器<br/>29-sensor-system.md"]
        P5-4["Task任务系统<br/>30-task-system.md"]
        P5-5["Activity & Schedule<br/>31-activity-schedule.md"]
        P5-6["Pathfinding路径<br/>32-pathfinding.md"]
    end

    subgraph Phase6["第6部分：网络系统 (3-5天)"]
        P6-1["Network网络入门<br/>33-network-intro.md"]
        P6-2["Packet数据包<br/>34-packet-system.md"]
        P6-3["Protocol协议状态<br/>35-protocol-states.md"]
        P6-4["Sync同步机制<br/>36-sync-mechanism.md"]
    end

    subgraph Phase7["第7部分：命令系统 (2-3天)"]
        P7-1["Command命令入门<br/>37-command-intro.md"]
        P7-2["Brigadier基础<br/>38-brigadier-basics.md"]
        P7-3["自定义命令<br/>39-custom-command.md"]
    end

    subgraph Phase8["第8部分：资源系统 (3-5天)"]
        P8-1["ResourcePack资源包<br/>40-resource-pack.md"]
        P8-2["Datapack数据包<br/>41-datapack-intro.md"]
        P8-3["LootTable战利品<br/>42-loot-table.md"]
        P8-4["Advancement进度<br/>43-advancement.md"]
        P8-5["Recipe配方<br/>44-recipe-system.md"]
    end

    subgraph Phase9["第9部分：客户端 (3-5天)"]
        P9-1["MinecraftClient<br/>45-minecraft-client.md"]
        P9-2["Render渲染<br/>46-render-system.md"]
        P9-3["GUI界面<br/>47-gui-system.md"]
        P9-4["Input输入<br/>48-input-handling.md"]
    end

    subgraph Phase10["第10部分：服务端 (2-3天)"]
        P10-1["Server服务端入门<br/>49-server-intro.md"]
        P10-2["PlayerManager玩家<br/>50-player-manager.md"]
        P10-3["Save存档系统<br/>51-save-system.md"]
        P10-4["独立vs整合服务器<br/>52-dedicated-vs-integrated.md"]
    end

    subgraph Phase11["第11部分：进阶 (3-5天)"]
        P11-1["DataFixer数据修复<br/>53-datafixer.md"]
        P11-2["Fluid流体<br/>54-fluids.md"]
        P11-3["Village村民<br/>55-village-system.md"]
        P11-4["Raid袭击<br/>56-raid-system.md"]
        P11-5["Structure结构<br/>57-structure-system.md"]
    end

    subgraph Phase12["第12部分：实战 💪"]
        P12-1["项目1:新方块<br/>98-project1-block.md"]
        P12-2["项目2:新物品<br/>99-project2-item.md"]
        P12-3["项目3:新生物<br/>100-project3-entity.md"]
        P12-4["项目4:数据包<br/>101-project4-datapack.md"]
    end

    P0-1 --> P0-2 --> P0-3 --> P0-4
    P0-4 --> P1-1 --> P1-2 --> P1-3 --> P1-4
    P1-4 --> P2-1 --> P2-2 --> P2-3 --> P2-4 --> P2-5 --> P2-6
    P2-6 --> P3-1 --> P3-2 --> P3-3 --> P3-4 --> P3-5 --> P3-6
    P3-6 --> P4-1 --> P4-2 --> P4-3 --> P4-4 --> P4-5 --> P4-6 --> P4-7
    P4-7 --> P5-1 --> P5-2 --> P5-3 --> P5-4 --> P5-5 --> P5-6
    P5-6 --> P6-1 --> P6-2 --> P6-3 --> P6-4
    P6-4 --> P7-1 --> P7-2 --> P7-3
    P7-3 --> P8-1 --> P8-2 --> P8-3 --> P8-4 --> P8-5
    P8-5 --> P9-1 --> P9-2 --> P9-3 --> P9-4
    P9-4 --> P10-1 --> P10-2 --> P10-3 --> P10-4
    P10-4 --> P11-1 --> P11-2 --> P11-3 --> P11-4 --> P11-5
    P11-5 --> P12-1
    P12-1 --> P12-2 --> P12-3 --> P12-4

    style P1-1 fill:#ff6b6b,color:#fff
    style P5-1 fill:#ff6b6b,color:#fff
```

---

## 二、系统依赖关系图

```mermaid
flowchart TD
    subgraph Core["核心层"]
        Registry["注册表系统<br/>Registry"]
        Constants["常量系统<br/>SharedConstants"]
        Bootstrap["启动引导<br/>Bootstrap"]
    end

    subgraph Content["内容层 - 游戏元素"]
        Block["方块系统<br/>Block"]
        Item["物品系统<br/>Item"]
        Entity["实体系统<br/>Entity"]
        Biome["生物群系<br/>Biome"]
        Fluid["流体系统<br/>Fluid"]
    end

    subgraph WorldLayer["世界层"]
        World["World世界"]
        Chunk["Chunk区块"]
        Gen["地形生成<br/>ChunkGenerator"]
        Light["光照系统"]
        Heightmap["高度图"]
        Border["世界边界"]
    end

    subgraph EntityAI["实体AI层"]
        Living["LivingEntity"]
        Mob["MobEntity"]
        Brain["AI大脑<br/>Brain"]
        Memory["记忆系统"]
        Sensor["传感器"]
        Task["任务"]
        Path["路径导航"]
    end

    subgraph Network["网络层"]
        Packet["数据包<br/>Packet"]
        Protocol["协议状态"]
        Sync["同步机制"]
    end

    subgraph Gameplay["游戏机制层"]
        Damage["伤害系统"]
        Spawn["生成系统"]
        Recipe["配方系统"]
        Loot["战利品表"]
        Adv["进度系统"]
        Command["命令系统"]
    end

    subgraph Client["客户端层"]
        MCClient["MinecraftClient"]
        Render["渲染引擎"]
        GUI["GUI系统"]
        Input["输入处理"]
        Audio["音频系统"]
    end

    subgraph Server["服务端层"]
        Server["MinecraftServer"]
        PlayerMgr["玩家管理"]
        Save["存档系统"]
        Tick["Tick循环"]
    end

    Core --> Registry
    Registry --> Block
    Registry --> Item
    Registry --> Entity
    Registry --> Biome
    Registry --> Fluid

    Block --> World
    Item --> World
    Entity --> World
    Biome --> World

    World --> Chunk
    World --> Gen
    World --> Light
    World --> Heightmap
    World --> Border

    Entity --> Living
    Living --> Mob
    Mob --> Brain
    Brain --> Memory
    Brain --> Sensor
    Brain --> Task
    Brain --> Path

    World --> Network
    Network --> Sync

    Entity --> Damage
    Entity --> Spawn
    World --> Gameplay

    Tick --> Server
    Server --> PlayerMgr
    Server --> Save

    MCClient --> Render
    MCClient --> GUI
    MCClient --> Input
    MCClient --> Audio

    Network <-->|数据包| Client
    Network <-->|数据包| Server

    style Registry fill:#ffd93d,color:#000
    style World fill:#6bcb77,color:#000
    style Brain fill:#ff6b6b,color:#fff
    style Network fill:#4d96ff,color:#fff
```

---

## 三、客户端-服务端通信架构

```mermaid
flowchart LR
    subgraph Client["客户端 Client"]
        C1["MinecraftClient<br/>主客户端"]
        C2["ClientWorld<br/>客户端世界"]
        C3["GameRenderer<br/>渲染器"]
        C4["InputHandler<br/>输入处理"]
        C5["SoundManager<br/>声音管理"]
    end

    subgraph Server["服务端 Server"]
        S1["MinecraftServer<br/>主服务器"]
        S2["ServerWorld<br/>服务端世界"]
        S3["PlayerManager<br/>玩家管理"]
        S4["CommandManager<br/>命令管理"]
        S5["SaveLoader<br/>存档加载"]
    end

    subgraph Network["网络层 Protocol 767"]
        P1["数据包<br/>Packet"]
        P2["ClientConnection<br/>Netty连接"]
        P3["PacketByteBuf<br/>数据缓冲"]
    end

    C1 <-->|"Tick同步"| C2
    C2 <-->|"渲染"| C3
    C4 -->|"输入"| C1
    C1 -->|"播放"| C5

    S1 -->|"Tick"| S2
    S2 -->|"实体"| S3
    S1 -->|"命令"| S4
    S1 -->|"保存"| S5

    C1 <-->|"移动/交互"| P2
    S1 <-->|"状态同步"| P2
    P2 <--> P3

    P1 -->|"ServerBound| P3
    P3 -->|"ClientBound| P1

    style C1 fill:#4d96ff,color:#fff
    style S1 fill:#ff6b6b,color:#fff
    style P2 fill:#ffd93d,color:#000
```

---

## 四、Tick游戏循环流程

```mermaid
flowchart TD
    Start(["开始Tick<br/>20次/秒"]) --> CheckPause{"游戏暂停?"}

    CheckPause -->|是| Wait["等待..."]
    Wait --> EndTick

    CheckPause -->|否| ProcessServer["服务端Tick"]
    ProcessServer --> EntityTick["实体Tick<br/>Entity.tick()"]
    EntityTick --> BlockTick["方块Tick<br/>随机Tick"]
    BlockTick --> WeatherTick["天气Tick"]
    WeatherTick --> ContainerTick["容器Tick"]
    ContainerTick --> Schedule["调度下一个Tick"]

    ProcessServer --> CheckSave{"需要保存?"}
    CheckSave -->|是| AutoSave["自动保存检查"]
    AutoSave --> SaveCheck{"保存计时器?"}
    SaveCheck -->|是| DoSave["保存世界"]
    SaveCheck -->|否| Continue1
    DoSave --> Continue1["继续"]

    ProcessServer --> CheckAutoSave{"Autosave?"}
    CheckAutoSave -->|是| ServerSave["ServerWorld保存"]
    CheckAutoSave -->|否| Continue2
    ServerSave --> Continue2["继续"]

    Schedule --> CheckAutoSave
    Continue1 --> CheckAutoSave
    Continue2 --> EndTick

    EndTick(["结束Tick"])
    EndTick -->|60ms后| Start

    style Start fill:#6bcb77,color:#fff
    style EndTick fill:#6bcb77,color:#fff
    style EntityTick fill:#ff6b6b,color:#fff
    style BlockTick fill:#ffd93d,color:#000
```

---

## 五、注册表系统架构

```mermaid
flowchart TB
    subgraph Registry["注册表系统 Registry"]
        subgraph Identifiers["标识符 Identifier"]
            I1["minecraft:stone"]
            I2["minecraft:diamond_sword"]
            I3["minecraft:pig"]
        end

        subgraph Keys["注册键 RegistryKey"]
            K1["RegistryKey<Block>"]
            K2["RegistryKey<Item>"]
            K3["RegistryKey<EntityType>"]
        end

        subgraph Entries["注册条目 RegistryEntry"]
            E1["RegistryEntry<Block>"]
            E2["RegistryEntry<Item>"]
            E3["RegistryEntry<EntityType>"]
        end
    end

    subgraph Registries["内置注册表"]
        R1["BLOCK 注册表"]
        R2["ITEM 注册表"]
        R3["ENTITY_TYPE 注册表"]
        R4["BIOME 注册表"]
        R5["SOUND_EVENT 注册表"]
        R6["POTION 注册表"]
    end

    I1 -->|创建| K1
    I2 -->|创建| K2
    I3 -->|创建| K3

    K1 -->|查找| R1
    K2 -->|查找| R2
    K3 -->|查找| R3

    R1 -->|返回| E1
    R2 -->|返回| E2
    R3 -->|返回| E3

    style Registry fill:#ffd93d,color:#000
    style Registries fill:#4d96ff,color:#fff
    style R1 fill:#ff6b6b,color:#fff
    style R2 fill:#ff6b6b,color:#fff
    style R3 fill:#ff6b6b,color:#fff
```

---

## 六、实体系统继承关系

```mermaid
flowchart BT
    Entity["Entity<br/>基础实体<br/><br/>位置、移动、碰撞"] --> Object["Object"]

    Entity --> EntityWithOwner["EntityWithOwner<br/>有主人的实体<br/><br/>标记所有者"]
    Entity --> Projectile["Projectile<br/>投射物<br/><br/>发射和飞行"]

    Projectile --> Arrow["ArrowEntity<br/>箭矢"]
    Projectile --> Fireball["FireballEntity<br/>火球"]
    Projectile --> EnderPearl["EnderPearlEntity<br/>末影珍珠"]

    Entity --> LivingEntity["LivingEntity ⭐<br/>有生命实体<br/><br/>生命值、效果"]

    LivingEntity --> MobEntity["MobEntity<br/>生物实体<br/><br/>AI、移动"]

    MobEntity --> AnimalEntity["AnimalEntity<br/>动物<br/><br/>繁殖"]
    MobEntity --> Monster["Monster<br/>怪物<br/><br/>攻击玩家"]
    MobEntity --> Ambient["AmbientEntity<br/>环境生物<br/><br/>蝙蝠"]
    MobEntity --> WaterEntity["WaterAnimal<br/>水下生物<br/><br/>鱿鱼"]

    AnimalEntity --> Pig["Pig<br/>猪"]
    AnimalEntity --> Cow["Cow<br/>牛"]
    AnimalEntity --> Sheep["Sheep<br/>羊"]
    AnimalEntity --> Chicken["Chicken<br/>鸡"]

    Monster --> Zombie["Zombie<br/>僵尸"]
    Monster --> Skeleton["Skeleton<br/>骷髅"]
    Monster --> Creeper["Creeper<br/>苦力怕"]

    LivingEntity --> PlayerEntity["PlayerEntity<br/>玩家实体<br/><br/>物品栏、技能"]

    PlayerEntity --> ServerPlayerEntity["ServerPlayerEntity<br/>服务端玩家"]
    PlayerEntity --> ClientPlayerEntity["ClientPlayerEntity<br/>客户端玩家"]

    MobEntity --> PathfinderMob["PathfinderMob<br/>可寻路的生物<br/><br/>目标选择"]

    PathfinderMob --> IronGolem["IronGolem<br/>铁傀儡"]
    PathfinderMob --> VillagerEntity["VillagerEntity<br/>村民<br/><br/>AI大脑"]

    VillagerEntity --> Merchant["Merchant<br/>商人<br/><br/>交易"]
    VillagerEntity --> WanderingTrader["WanderingTrader<br/>流浪商人"]

    style Entity fill:#4d96ff,color:#fff
    style LivingEntity fill:#ff6b6b,color:#fff
    style MobEntity fill:#6bcb77,color:#fff
    style PlayerEntity fill:#ffd93d,color:#000
```

---

## 七、AI大脑系统架构

```mermaid
flowchart TB
    subgraph Brain["AI大脑 Brain"]
        subgraph Memory["记忆系统 MemoryModule"]
            M1["最近实体"]
            M2["村庄位置"]
            M3["敌对目标"]
            M4["工作位置"]
            M5["家庭位置"]
        end

        subgraph Activities["活动 Activity"]
            A1["IDLE 空闲"]
            A2["WORK 工作"]
            A3["REST 休息"]
            A4["FIGHT 战斗"]
            A5["PANIC 恐慌"]
        end

        subgraph Tasks["任务 Task"]
            T1["WalkToTarget"]
            T2["LookAtTarget"]
            T3["AttackTarget"]
            T4["GotoWork"]
        end

        subgraph Schedule["日程表 Schedule"]
            S1["06:00 工作"]
            S2["12:00 休息"]
            S3["18:00 回家"]
            S4["22:00 睡觉"]
        end
    end

    subgraph Sensors["传感器 Sensor"]
        SE1["NearestLivingEntity<br/>最近生物"]
        SE2["NearestBed<br/>最近床"]
        SE3["HurtBy<br/>被谁伤害"]
        SE4["NearestPoI<br/>最近兴趣点"]
    end

    subgraph Mob["生物 MobEntity"]
        MB["MobEntity<br/>拥有Brain"]
    end

    Sensors -->|"感知"| Memory
    Memory -->|"决策"| Brain
    Brain -->|"选择"| Activities
    Activities -->|"执行"| Tasks
    Schedule -->|"控制"| Activities
    Brain -->|"控制"| MB

    style Brain fill:#ff6b6b,color:#fff
    style Memory fill:#ffd93d,color:#000
    style Sensors fill:#4d96ff,color:#fff
```

---

## 八、网络协议状态机

```mermaid
flowchart LR
    subgraph Handshaking["HANDSHAKING 握手"]
        H1["ClientHello<br/>开始连接"]
    end

    subgraph Status["STATUS 状态查询"]
        S1["PingRequest<br/>ping请求"]
        S2["PingResponse<br/>ping响应"]
    end

    subgraph Login["LOGIN 登录"]
        L1["LoginStart<br/>开始登录"]
        L2["LoginSuccess<br/>登录成功"]
        L3["LoginDisconnect<br/>断开连接"]
    end

    subgraph Configuration["CONFIGURATION 配置"]
        C1["ConfigRegistry<br/>同步注册表"]
        C2["ConfigKnownPacks<br/>同步数据包"]
    end

    subgraph Play["PLAY 游戏"]
        P1["移动包"]
        P2["交互包"]
        P3["方块交互"]
        P4["实体移动"]
        P5["聊天消息"]
        P6["区块数据"]
    end

    H1 -->|"1"| S1
    H1 -->|"2"| L1
    S1 -->|"3"| S2
    S2 -->|"4"| H1
    L1 -->|"5"| L2
    L2 -->|"6"| C1
    L1 -->|"5"| L3
    C1 -->|"7"| C2
    C2 -->|"8"| P1
    P1 -->|"游戏进行"| P2
    P2 -->|"..."| P6

    style H1 fill:#ffd93d,color:#000
    style L1 fill:#ff6b6b,color:#fff
    style C1 fill:#4d96ff,color:#fff
    style P1 fill:#6bcb77,color:#fff
```

---

## 九、世界生成管线

```mermaid
flowchart TB
    subgraph Generator["地形生成 ChunkGenerator"]
        G1["基础高度<br/>BaseNoise"]
        G2["侵蚀<br/>Erosion"]
        G3["压力<br/>Pressure"]
        G4["温度<br/>Temperature"]
        G5["湿度<br/>Humidity"]
    end

    subgraph Biome["生物群系 BiomeSource"]
        B1["生物群系噪声"]
        B2["岛屿遮罩<br/>IslandCache"]
        B3["大陆遮罩"]
    end

    subgraph Surface["表面构建"]
        S1["选择生物群系"]
        S2["表面方块"]
        S3["水下页面"]
        S4["石牙/柱子"]
    end

    subgraph Features["特征生成"]
        F1["矿石生成"]
        F2["洞穴生成"]
        F3["湖泊"]
        F4["树木"]
        F5["地表植被"]
    end

    subgraph Structures["结构生成"]
        ST1["废弃矿井"]
        ST2["村庄"]
        ST3["要塞"]
        ST4["沙漠神殿"]
    end

    G1 --> G2 --> G3
    B1 --> B2 --> B3
    B3 --> S1
    G5 --> S1
    S1 --> S2 --> S3 --> S4
    S4 --> F1 --> F2 --> F3 --> F4 --> F5
    B3 --> ST1 --> ST2 --> ST3 --> ST4

    style Generator fill:#4d96ff,color:#fff
    style Biome fill:#6bcb77,color:#fff
    style Surface fill:#ffd93d,color:#000
    style Features fill:#ff6b6b,color:#fff
```

---

## 十、关键类速查表

```mermaid
flowchart LR
    subgraph World["世界核心"]
        W1["World<br/>世界基类"]
        W2["ServerWorld<br/>服务端世界"]
        W3["ClientWorld<br/>客户端世界"]
    end

    subgraph Entity["实体核心"]
        E1["Entity<br/>实体基类"]
        E2["LivingEntity<br/>有生命实体"]
        E3["MobEntity<br/>生物实体"]
    end

    subgraph Block["方块核心"]
        B1["Block<br/>方块"]
        B2["BlockState<br/>方块状态"]
        B3["BlockEntity<br/>方块实体"]
    end

    subgraph Item["物品核心"]
        I1["Item<br/>物品"]
        I2["ItemStack<br/>物品堆叠"]
        I3["ItemGroup<br/>物品栏"]
    end

    subgraph Registry["注册表"]
        R1["Registries<br/>所有注册表"]
        R2["Identifier<br/>标识符"]
        R3["RegistryKey<br/>注册键"]
    end

    subgraph Network["网络"]
        N1["Packet<br/>数据包"]
        N2["ClientPlayHandler<br/>客户端处理"]
        N3["ServerPlayHandler<br/>服务端处理"]
    end

    W1 --> W2
    W1 --> W3
    E1 --> E2
    E2 --> E3
    R1 --> R2
    R2 --> R3

    style W1 fill:#4d96ff,color:#fff
    style E1 fill:#ff6b6b,color:#fff
    style B1 fill:#6bcb77,color:#fff
    style I1 fill:#ffd93d,color:#000
    style R1 fill:#9b59b6,color:#fff
    style N1 fill:#e74c3c,color:#fff
```

---

## 十一、萌新学习检查点

```mermaid
flowchart LR
    subgraph Checkpoints["学习检查点"]
        C1["✅ 理解注册表三层结构"]
        C2["✅ 能找到石头方块的代码"]
        C3["✅ 理解客户端-服务端分离"]
        C4["✅ 理解World和Chunk的关系"]
        C5["✅ 理解Entity是什么"]
        C6["✅ 理解AI大脑的三层结构"]
        C7["✅ 理解网络数据包流程"]
        C8["✅ 能创建自定义命令"]
        C9["✅ 能创建数据包"]
        C10["✅ 能添加新方块/物品"]
    end

    Start["开始学习"] --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 --> C6
    C6 --> C7
    C7 --> C8
    C8 --> C9
    C9 --> C10
    C10 --> Done["完成基础学习！"]

    style C1 fill:#6bcb77,color:#fff
    style C2 fill:#6bcb77,color:#fff
    style C3 fill:#6bcb77,color:#fff
    style C4 fill:#6bcb77,color:#fff
    style C5 fill:#6bcb77,color:#fff
    style C6 fill:#6bcb77,color:#fff
    style C7 fill:#6bcb77,color:#fff
    style C8 fill:#6bcb77,color:#fff
    style C9 fill:#6bcb77,color:#fff
    style C10 fill:#6bcb77,color:#fff
    style Done fill:#ffd93d,color:#000
```

---

## 十二、时间规划建议

| 阶段 | 内容 | 建议时间 | 累计 |
|------|------|---------|------|
| 第0部分 | 前置知识 | 2-3天 | 2-3天 |
| 第1部分 | 核心基础 | 3-5天 | 5-8天 |
| 第2部分 | 世界系统 | 5-7天 | 10-15天 |
| 第3部分 | 方块物品 | 5-7天 | 15-22天 |
| 第4部分 | 实体系统 | 5-7天 | 20-29天 |
| 第5部分 | AI系统 | 5-7天 | 25-36天 |
| 第6部分 | 网络系统 | 3-5天 | 28-41天 |
| 第7-8部分 | 命令资源 | 5-8天 | 33-49天 |
| 第9-10部分 | 客户端服务端 | 5-8天 | 38-57天 |
| 第11-12部分 | 进阶实战 | 7-14天 | 45-71天 |

---

*文档更新时间: 2026-03-19*
