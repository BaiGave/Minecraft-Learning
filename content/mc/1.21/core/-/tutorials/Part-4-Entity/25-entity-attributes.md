---
title: 第 25 章：属性系统（Entity Attributes）
readingTime: 35
---

# 第 25 章：属性系统（Entity Attributes）

> 深入了解实体的能力数值是如何定义和计算的

---

## 章节目标

- 理解 Attribute 和 AttributeModifier 的概念
- 掌握 AttributeContainer 的工作原理
- 了解常用属性的含义和用途
- 理解属性修饰符的操作类型
- 能够创建和修改自定义属性

## 前置知识

- 熟悉 LivingEntity 的概念
- 了解 Java 面向对象编程

## 核心概念

### 属性 = 生物的"能力值"

想象 RPG 游戏里的角色属性点：
- 💗 生命值上限
- ⚡ 移动速度
- ⚔️ 攻击力
- 🛡️ 防御力

**Minecraft 的属性系统就是给实体定义这些"能力值"的机制**

## 1. 核心类结构

```
┌─────────────────────────────────────────────────────────────────┐
│                    EntityAttribute (属性定义)                    │
├─────────────────────────────────────────────────────────────────┤
│  - id: Identifier                    属性唯一标识                │
│  - defaultValue: double              默认值                     │
│  - tracked: boolean                  是否需要同步客户端           │
│  - propertyGetter: Function         属性计算回调                │
├─────────────────────────────────────────────────────────────────┤
│  + getDefaultValue(): double        获取默认值                  │
│  + clamp(value): double             限制值在 min-max 范围内      │
│  + getTracked(): boolean            是否追踪                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EntityAttributeInstance (属性实例)                  │
├─────────────────────────────────────────────────────────────────┤
│  - attribute: EntityAttribute        关联的属性定义              │
│  - baseValue: double                基础值                      │
│  - modifiers: List                  修饰符列表                   │
├─────────────────────────────────────────────────────────────────┤
│  + getValue(): double               获取最终计算值              │
│  + setBaseValue(v): void            设置基础值                  │
│  + addModifier(m): void             添加修饰符                  │
│  + removeModifier(id): void          移除修饰符                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AttributeContainer (属性容器)                     │
├─────────────────────────────────────────────────────────────────┤
│  - attributes: Map<EntityAttribute, EntityAttributeInstance>      │
├─────────────────────────────────────────────────────────────────┤
│  + get(attribute): Instance         获取属性实例                │
│  + addTemporaryModifiers(): void    添加临时修饰符              │
│  + addPersistentModifiers(): void    添加永久修饰符             │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 常用属性详解

### GENERIC_MAX_HEALTH 最大生命

```java
// 默认值：20.0 (10 颗心)
// 修改示例：苦力怕爆炸后虚弱
public static final EntityAttribute GENERIC_MAX_HEALTH = 
    EntityAttribute.create(
        Identifier.ofVanilla("generic.max_health"),
        20.0
    ).clamp(1.0, 1024.0).tracked().build();
```

### GENERIC_MOVEMENT_SPEED 移动速度

```java
// 默认值：0.7 (blocks/秒)
// 修改示例：速度药水增加 20% 每级
public static final EntityAttributeModifier SPEED_BONUS = 
    new EntityAttributeModifier(
        Identifier.ofVanilla("effect.speed"),
        0.2,  // +20%
        EntityAttributeModifier.Operation.ADD_MULTIPLY_TOTAL
    );

// 缓慢药水减少 15% 每级
public static final EntityAttributeModifier SLOW_BONUS = 
    new EntityAttributeModifier(
        Identifier.ofVanilla("effect.slowness"),
        -0.15,  // -15%
        EntityAttributeModifier.Operation.ADD_MULTIPLY_TOTAL
    );
```

### GENERIC_ARMOR 护甲

```java
// 默认值：0.0
// 每件护甲装备提供固定的护甲值
// 护甲点的最大有效值约为 20
```

### GENERIC_ARMOR_TOUGHNESS 护甲韧性

```java
// 默认值：0.0
// 韧性越高，高伤害的减免效果越好
// 钻石护甲：toughness = 2.0
// 下界合金护甲：toughness = 3.0
```

### GENERIC_ATTACK_DAMAGE 攻击伤害

```java
// 默认值：2.0
// 用于近战攻击计算
// 剑的伤害加成在附魔系统中处理
```

### GENERIC_ATTACK_KNOCKBACK 攻击击退

```java
// 默认值：0.0
// 击退效果 = base + modifier
// 击退附魔会增加这个值
```

### GENERIC_FOLLOW_RANGE 追踪范围

```java
// 默认值：32.0
// 生物追踪目标的最大距离
// 末影人：64.0
// 唤魔者：16.0
```

### GENERIC_KNOCKBACK_RESISTANCE 击退抗性

```java
// 默认值：0.0
// 范围：0.0 - 1.0
// 1.0 = 完全免疫击退
// 保护附魔提供击退抗性
```

## 3. EntityAttributeModifier 修饰符

### 修饰符结构

```java
public class EntityAttributeModifier {
    private final UUID uuid;
    private final String name;
    private final double value;
    private final Operation operation;
    
    public enum Operation {
        ADD_VALUE,           // 加法：base + value
        ADD_MULTIPLY_BASE,   // 乘法（基础）：base * (1 + value)
        ADD_MULTIPLY_TOTAL   // 乘法（总数）：result * (1 + value)
    }
}
```

### 操作类型详解

```
基础值 = 20.0

1. ADD_VALUE (加法)
   value = 5.0
   结果 = 20.0 + 5.0 = 25.0

2. ADD_MULTIPLY_BASE (乘法-基础)
   value = 0.5 (+50%)
   结果 = 20.0 * (1 + 0.5) = 30.0

3. ADD_MULTIPLY_TOTAL (乘法-总数)
   value = 0.25 (+25%)
   结果 = (20.0 + 5.0) * (1 + 0.25) = 31.25
```

### 多个修饰符的计算

```
假设基础值 = 20.0

修饰符列表：
1. ADD_VALUE: +5.0
2. ADD_MULTIPLY_BASE: +0.2 (20%)
3. ADD_MULTIPLY_TOTAL: +0.1 (10%)

计算步骤：
1. 基础值: 20.0
2. +ADD_VALUE: 20.0 + 5.0 = 25.0
3. ×ADD_MULTIPLY_BASE: 25.0 * (1 + 0.2) = 30.0
4. ×ADD_MULTIPLY_TOTAL: 30.0 * (1 + 0.1) = 33.0

最终结果: 33.0
```

## 4. 属性容器

### AttributeContainer 类

```java
// AttributeContainer.java
public class AttributeContainer {
    private final Map<EntityAttribute, EntityAttributeInstance> attributes = new HashMap<>();
    
    // 获取或创建属性实例
    public EntityAttributeInstance get(EntityAttribute attribute) {
        return this.attributes.computeIfAbsent(
            attribute, 
            attr -> new EntityAttributeInstance(attr, this::onDirty)
        );
    }
    
    // 添加临时修饰符
    public void addTemporaryModifiers(AttributeModifiers modifiers) {
        modifiers.getModifiers().forEach(mod -> {
            this.get(mod.getAttribute()).addModifier(mod);
        });
    }
    
    // 移除临时修饰符
    public void removeModifiers(AttributeModifiers modifiers) {
        modifiers.getModifiers().forEach(mod -> {
            this.get(mod.getAttribute()).removeModifier(mod.getId());
        });
    }
}
```

## 5. 属性同步

属性值变化时需要同步到客户端：

```java
// EntityAttributeInstance.java
public class EntityAttributeInstance {
    // 当值变化时调用
    private void onDirty(EntityAttributeInstance instance) {
        // 标记为需要同步
        this.dirty = true;
    }
    
    // 同步到客户端
    public List<AttributeModifier> getSyncData() {
        if (!this.dirty) {
            return Collections.emptyList();
        }
        this.dirty = false;
        return Collections.singletonList(
            new AttributeModifier(
                this.attribute.getId(),
                this.value,
                this.operation
            )
        );
    }
}
```

## 6. 属性修饰符来源

### 装备物品

```java
// ItemStack 属性加成
public class ArmorItem extends Item {
    @Override
    public AttributeModifiers getAttributeModifiers() {
        return AttributeModifiers.builder()
            .add(
                EntityAttributes.GENERIC_ARMOR, 
                new EntityAttributeModifier(
                    EQUIPMENT_GROUP_ID,  // 使用装备槽位作为 ID
                    this.getMaterial().getArmor Toughness(),
                    EntityAttributeModifier.Operation.ADD_VALUE
                )
            )
            .build();
    }
}
```

### 药水效果

```java
// StatusEffect.java
public class SpeedEffect extends StatusEffect {
    @Override
    public void applyUpdateEffect(LivingEntity entity, int amplifier) {
        entity.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED)
            .addTemporaryModifier(
                new EntityAttributeModifier(
                    getSpeedModifierId(),
                    0.2 * (amplifier + 1),  // 每级 +20%
                    EntityAttributeModifier.Operation.ADD_MULTIPLY_TOTAL
                )
            );
    }
}
```

### 附魔

```java
// ProtectionEnchantment.java
public class ProtectionEnchantment extends Enchantment {
    @Override
    public int getProtectionAmount(int level, DamageSource source) {
        // 保护附魔减少伤害
        return level * (source.isIn(DamageTypeTags.IS_FIRE) ? 1 : 2);
    }
}
```

## Mermaid 图表：属性计算流程

```mermaid
flowchart TD
    A["基础值<br/>baseValue"] --> B{"遍历所有修饰符"}
    
    B -->|ADD_VALUE| C["value = base + modifier"]
    B -->|ADD_MULTIPLY_BASE| D["value = value * (1 + modifier)"]
    B -->|ADD_MULTIPLY_TOTAL| E["标记 MultiplyTotal"]
    
    C --> F["下一个修饰符"]
    D --> F
    E --> F
    
    F -->|还有| B
    F -->|结束| G{"有 MultiplyTotal?"}
    
    G -->|"是| H["value = value * (1 + sum)"]
    G -->|"否| I["返回 value"]
    
    H --> I
    I --> J["clamp<br/>限制在 min-max"]
    J --> K["最终属性值"]
```

## 实战演示：创建自定义属性

### 1. 定义新属性

```java
// 在 Mod 中注册
public class MyModAttributes {
    
    // 火焰伤害抗性
    public static final EntityAttribute FIRE_RESISTANCE = 
        EntityAttribute.create(
            new Identifier("mymod", "fire_resistance"),
            0.0
        ).clamp(0.0, 1.0).tracked().build();
    
    // 暴击倍率
    public static final EntityAttribute CRITICAL_MULTIPLIER = 
        EntityAttribute.create(
            new Identifier("mymod", "critical_multiplier"),
            1.5
        ).clamp(1.0, 5.0).tracked().build();
}
```

### 2. 使用自定义属性

```java
public class MyEntity extends LivingEntity {
    
    public MyEntity(EntityType<?> type, World world) {
        super(type, world);
        
        // 确保属性已注册
        this.getAttributeInstance(MyModAttributes.FIRE_RESISTANCE);
        this.getAttributeInstance(MyModAttributes.CRITICAL_MULTIPLIER);
    }
    
    // 使用属性
    public float getFireDamageReduction() {
        return (float) this.getAttributeValue(MyModAttributes.FIRE_RESISTANCE);
    }
    
    public float calculateCriticalDamage(float baseDamage) {
        return baseDamage * (float) this.getAttributeValue(MyModAttributes.CRITICAL_MULTIPLIER);
    }
}
```

### 3. 添加修饰符

```java
// 添加临时加成
public void applyPowerUp() {
    this.getAttributeInstance(MyModAttributes.CRITICAL_MULTIPLIER)
        .addTemporaryModifier(
            new EntityAttributeModifier(
                Identifier.of("mymod", "power_up"),
                0.5,  // +50% 暴击
                EntityAttributeModifier.Operation.ADD_MULTIPLY_TOTAL
            )
        );
}

// 移除加成
public void removePowerUp() {
    this.getAttributeInstance(MyModAttributes.CRITICAL_MULTIPLIER)
        .removeModifier(Identifier.of("mymod", "power_up"));
}
```

## 完整示例：铁剑的属性加成

```java
// IronSwordItem.java
public class IronSwordItem extends SwordItem {
    public IronSwordItem(Item.Settings settings) {
        super(
            Tiers.IRON,
            3,    // attack damage (基础)
            2.4f, // attack speed
            settings
        );
    }
    
    @Override
    public AttributeModifiers getAttributeModifiers() {
        return AttributeModifiers.builder()
            .add(
                EntityAttributes.GENERIC_ATTACK_DAMAGE,
                new EntityAttributeModifier(
                    EQUIPMENT_GROUP_ID,
                    3.0,  // 铁剑攻击力加成
                    EntityAttributeModifier.Operation.ADD_VALUE
                ),
                EquipmentSlot.MAINHAND
            )
            .add(
                EntityAttributes.GENERIC_ATTACK_SPEED,
                new EntityAttributeModifier(
                    EQUIPMENT_GROUP_ID,
                    -2.4,  // 攻击速度惩罚
                    EntityAttributeModifier.Operation.ADD_VALUE
                ),
                EquipmentSlot.MAINHAND
            )
            .build();
    }
}
```

## 课后自查

完成本章学习后，你应该能够：

- [ ] 解释 EntityAttribute 和 EntityAttributeInstance 的区别
- [ ] 理解三种修饰符操作类型的区别
- [ ] 知道常用属性的含义和默认值
- [ ] 理解属性修饰符的计算顺序
- [ ] 能够创建自定义属性
- [ ] 能够添加和移除属性修饰符
- [ ] 理解属性同步的机制

## 关键术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 属性 | Attribute | 实体的能力定义 |
| 属性实例 | AttributeInstance | 属性在实体上的具体值 |
| 属性容器 | AttributeContainer | 管理所有属性的容器 |
| 修饰符 | Modifier | 临时或永久改变属性值的机制 |
| 基础值 | Base Value | 属性的原始/默认数值 |

---

**参考源码路径**：

- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\attribute\EntityAttribute.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\attribute\EntityAttributeInstance.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\attribute\EntityAttributeModifier.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\attribute\AttributeContainer.java`
- `D:\Minecraft-Learning\assets\mc\1.21\net\minecraft\entity\attribute\EntityAttributes.java`
