---
title: 网络加密系统 (Network Encryption System)
readingTime: 30
---

# Minecraft 1.21 网络加密系统分析

> 分析基于 Minecraft 1.21 反编译源代码 (CFR 0.2.2)
> 版本信息: Protocol 767, Network Encryption Module
> 核心包: `net.minecraft.network.encryption`

---

## 目录

1. [概述](#概述)
2. [加密握手流程](#加密握手流程)
3. [核心类结构](#核心类结构)
4. [密钥生成与管理](#密钥生成与管理)
5. [数据包加密流程](#数据包加密流程)
6. [1.19+ 变更](#119-变更)
7. [源码分析](#源码分析)
8. [安全考虑](#安全考虑)
9. [关键代码引用](#关键代码引用)

---

## 概述

Minecraft 1.21 的网络加密系统是保护客户端与服务端通信安全的关键组件。在线多人游戏面临多种安全威胁，包括：

- **窃听 (Eavesdropping)**: 攻击者拦截网络流量，窃取敏感信息
- **中间人攻击 (MITM)**: 第三方伪装成服务端或客户端
- **数据篡改 (Tampering)**: 修改传输中的数据包
- **身份伪装 (Impersonation)**: 冒充其他玩家身份

### 加密系统设计目标

Minecraft 网络加密系统实现了以下核心目标：

1. **机密性 (Confidentiality)**: 确保只有通信双方能读取数据
2. **完整性 (Integrity)**: 检测数据是否被篡改
3. **身份认证 (Authentication)**: 验证通信双方的身份
4. **前向保密 (Forward Secrecy)**: 每次连接使用独立的会话密钥

### 加密算法选择

```38:45:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
private static final String AES = "AES";
private static final int AES_KEY_LENGTH = 128;
private static final String RSA = "RSA";
private static final int RSA_KEY_LENGTH = 1024;
private static final String ISO_8859_1 = "ISO_8859_1";
private static final String SHA1 = "SHA-1";
public static final String SHA256_WITH_RSA = "SHA256withRSA";
```

| 算法 | 用途 | 密钥长度 | 说明 |
|------|------|----------|------|
| **AES/CFB8/NoPadding** | 数据包加密 | 128-bit | 流式加密模式，适合变长数据 |
| **RSA** | 密钥交换 | 1024-bit | 非对称加密传输会话密钥 |
| **SHA-1** | Server ID 计算 | - | 历史兼容性 |
| **SHA256withRSA** | 签名验证 | - | 1.19+ 玩家公钥认证 |

---

## 加密握手流程

### 整体流程图

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Server as 服务端
    participant Auth as Mojang Auth
    
    Note over Client,Server: 握手阶段 (Handshake)
    Client->>Server: HandshakeC2SPacket<br/>(意图: LOGIN)
    
    Note over Client,Server: 登录阶段 (Login) - 无加密
    Client->>Server: LoginHelloC2SPacket<br/>(玩家名, UUID)
    Server->>Server: 生成 RSA 密钥对<br/>生成随机 nonce
    
    Server->>Client: LoginHelloS2CPacket<br/>(serverId, publicKey, nonce, needsAuth)
    
    Note over Client: 解码服务端公钥<br/>生成 AES 会话密钥
    
    Client->>Client: 生成随机 verifyToken
    Client->>Client: RSA加密: {secretKey, verifyToken}
    
    Client->>Server: LoginKeyC2SPacket<br/>(encryptedSecretKey, encryptedNonce)
    
    alt 传统模式 (1.18及之前)
        Server->>Server: RSA解密获取secretKey<br/>验证nonce
    else Mojang 账号模式 (1.19+)
        Server->>Auth: 验证玩家公钥
        Auth-->>Server: 公钥有效
        Server->>Server: 用玩家公钥验证签名
    end
    
    Server->>Client: LoginSuccessS2CPacket<br/>(GameProfile)
    
    Note over Client,Server: 加密通道已建立
    
    Client->>Server: 加密数据包...
    Server->>Client: 加密数据包...
```

### 详细握手步骤

#### 第一步：握手包 (Handshake)

```16:26:assets/mc/1.21/net/minecraft/network/packet/c2s/handshake/HandshakeC2SPacket.java
private void write(PacketByteBuf buf) {
    buf.writeVarInt(SharedConstants.getProtocolVersion().getId());
    buf.writeString(this.hostname);
    buf.writeShort(port);
    buf.writeVarInt(this.intent.getId());
}

public record HandshakeC2SPacket(String hostname, int port, ConnectionIntent intent)
```

客户端发送 `HandshakeC2SPacket`，其中 `intent` 指定连接意图：
- `STATUS`: 服务器状态查询 (ping)
- `LOGIN`: 登录游戏
- `TRANSFER`: 服务器转移

#### 第二步：登录 Hello

```14:24:assets/mc/1.21/net/minecraft/network/packet/c2s/login/LoginHelloC2SPacket.java
private LoginHelloC2SPacket(PacketByteBuf buf) {
    this(buf.readString(16), buf.readUuid());
}

private void write(PacketByteBuf buf) {
    buf.writeString(this.name, 16);
    buf.writeUuid(this.profileId);
}

public record LoginHelloC2SPacket(String name, UUID profileId)
```

客户端发送 `LoginHelloC2SPacket`，包含：
- `name`: 玩家名称
- `profileId`: 玩家 UUID (来自 Mojang 认证)

#### 第三步：服务端 Hello 响应

```24:36:assets/mc/1.21/net/minecraft/network/packet/s2c/login/LoginHelloS2CPacket.java
private LoginHelloS2CPacket(PacketByteBuf buf) {
    this.serverId = buf.readString(20);
    this.publicKey = buf.readByteArray();
    this.nonce = buf.readByteArray();
    this.needsAuthentication = buf.readBoolean();
}

public LoginHelloS2CPacket(String serverId, byte[] publicKey, 
                           byte[] nonce, boolean needsAuthentication)
```

服务端响应 `LoginHelloS2CPacket`：
- `serverId`: 服务器唯一标识 (用于旧版 Yggdrasil 认证)
- `publicKey`: RSA 公钥 (X.509 编码)
- `nonce`: 随机数，用于验证客户端
- `needsAuthentication`: 是否需要 Mojang 账号认证 (1.19+)

#### 第四步：客户端密钥响应

```34:42:assets/mc/1.21/net/minecraft/network/packet/c2s/login/LoginKeyC2SPacket.java
public LoginKeyC2SPacket(SecretKey secretKey, PublicKey publicKey, 
                        byte[] nonce) throws NetworkEncryptionException {
    this.encryptedSecretKey = NetworkEncryptionUtils.encrypt(publicKey, 
        secretKey.getEncoded());
    this.nonce = NetworkEncryptionUtils.encrypt(publicKey, nonce);
}

private LoginKeyC2SPacket(PacketByteBuf buf) {
    this.encryptedSecretKey = buf.readByteArray();
    this.nonce = buf.readByteArray();
}

public SecretKey decryptSecretKey(PrivateKey privateKey) 
    throws NetworkEncryptionException {
    return NetworkEncryptionUtils.decryptSecretKey(privateKey, 
        this.encryptedSecretKey);
}
```

客户端发送 `LoginKeyC2SPacket`：
- `encryptedSecretKey`: RSA 加密的 AES 会话密钥
- `nonce`: RSA 加密的随机数

#### 第五步：服务端验证

服务端执行以下验证：

```103:111:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static KeyPair generateServerKeyPair() throws NetworkEncryptionException {
    try {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA);
        keyPairGenerator.initialize(1024);
        return keyPairGenerator.generateKeyPair();
    } catch (Exception exception) {
        throw new NetworkEncryptionException(exception);
    }
}
```

1. 使用 RSA 私钥解密 `encryptedSecretKey`
2. 重建 AES 会话密钥
3. 验证 nonce (传统模式) 或验证公钥签名 (1.19+)
4. 发送 `LoginSuccessS2CPacket`

---

## 核心类结构

### 类图总览

```
net.minecraft.network.encryption
├── NetworkEncryptionUtils          # 核心加密工具类
│   ├── SecureRandomUtil            # 安全随机数工具
│   └── SignatureData               # 签名数据结构
├── PacketEncryptor                # Netty 数据包加密处理器
├── PacketDecryptor                # Netty 数据包解密处理器
├── PacketEncryptionManager        # 加密管理核心逻辑
├── PlayerPublicKey                # 玩家公钥记录 (1.19+)
├── PlayerKeyPair                  # 玩家密钥对记录 (1.19+)
├── SignatureVerifier              # 签名验证接口
├── Signer                         # 签名接口
├── SignatureUpdatable             # 签名更新回调
├── ClientPlayerSession            # 客户端会话
├── PublicPlayerSession            # 公开会话信息
└── NetworkEncryptionException     # 加密异常
```

### NetworkEncryptionUtils

核心加密工具类，提供所有加密/解密操作：

```37:96:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public class NetworkEncryptionUtils {
    private static final String AES = "AES";
    private static final int AES_KEY_LENGTH = 128;
    private static final String RSA = "RSA";
    private static final int RSA_KEY_LENGTH = 1024;
    
    public static SecretKey generateSecretKey() throws NetworkEncryptionException {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(AES);
            keyGenerator.init(128);
            return keyGenerator.generateKey();
        } catch (Exception exception) {
            throw new NetworkEncryptionException(exception);
        }
    }
    
    public static KeyPair generateServerKeyPair() throws NetworkEncryptionException {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA);
            keyPairGenerator.initialize(1024);
            return keyPairGenerator.generateKeyPair();
        } catch (Exception exception) {
            throw new NetworkEncryptionException(exception);
        }
    }
    
    public static Cipher cipherFromKey(int opMode, Key key) 
        throws NetworkEncryptionException {
        try {
            Cipher cipher = Cipher.getInstance("AES/CFB8/NoPadding");
            cipher.init(opMode, key, new IvParameterSpec(key.getEncoded()));
            return cipher;
        } catch (Exception exception) {
            throw new NetworkEncryptionException(exception);
        }
    }
}
```

#### 关键方法

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `generateSecretKey()` | `SecretKey` | 生成 128-bit AES 会话密钥 |
| `generateServerKeyPair()` | `KeyPair` | 生成 1024-bit RSA 密钥对 |
| `encrypt(Key, byte[])` | `byte[]` | 使用指定密钥加密数据 |
| `decrypt(Key, byte[])` | `byte[]` | 使用指定密钥解密数据 |
| `decryptSecretKey(PrivateKey, byte[])` | `SecretKey` | RSA 解密获取 AES 密钥 |
| `cipherFromKey(int, Key)` | `Cipher` | 创建 AES/CFB8/NoPadding 密码器 |
| `computeServerId(String, PublicKey, SecretKey)` | `byte[]` | 计算 SHA-1 Server ID |
| `RSA_PUBLIC_KEY_CODEC` | `Codec<PublicKey>` | PEM 格式公钥编解码器 |
| `RSA_PRIVATE_KEY_CODEC` | `Codec<PrivateKey>` | PEM 格式私钥编解码器 |

### SecureRandomUtil

```375:381:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static class SecureRandomUtil {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static long nextLong() {
        return SECURE_RANDOM.nextLong();
    }
}
```

提供密码学安全的随机数生成，使用 Java 内置的 `SecureRandom`。

### PacketEncryptor

Netty `MessageToByteEncoder` 实现，用于加密输出数据：

```12:29:assets/mc/1.21/net/minecraft/network/encryption/PacketEncryptor.java
public class PacketEncryptor
extends MessageToByteEncoder<ByteBuf> {
    private final PacketEncryptionManager manager;

    public PacketEncryptor(Cipher cipher) {
        this.manager = new PacketEncryptionManager(cipher);
    }

    @Override
    protected void encode(ChannelHandlerContext channelHandlerContext, 
                         ByteBuf byteBuf, ByteBuf byteBuf2) throws Exception {
        this.manager.encrypt(byteBuf, byteBuf2);
    }
}
```

### PacketDecryptor

Netty `MessageToMessageDecoder` 实现，用于解密输入数据：

```13:30:assets/mc/1.21/net/minecraft/network/encryption/PacketDecryptor.java
public class PacketDecryptor
extends MessageToMessageDecoder<ByteBuf> {
    private final PacketEncryptionManager manager;

    public PacketDecryptor(Cipher cipher) {
        this.manager = new PacketEncryptionManager(cipher);
    }

    @Override
    protected void decode(ChannelHandlerContext channelHandlerContext, 
                         ByteBuf byteBuf, List<Object> list) throws Exception {
        list.add(this.manager.decrypt(channelHandlerContext, byteBuf));
    }
}
```

### PacketEncryptionManager

加密/解密的核心实现，处理字节缓冲区的加解密操作：

```11:46:assets/mc/1.21/net/minecraft/network/encryption/PacketEncryptionManager.java
public class PacketEncryptionManager {
    private final Cipher cipher;
    private byte[] conversionBuffer = new byte[0];
    private byte[] encryptionBuffer = new byte[0];

    protected PacketEncryptionManager(Cipher cipher) {
        this.cipher = cipher;
    }

    private byte[] toByteArray(ByteBuf buf) {
        int i = buf.readableBytes();
        if (this.conversionBuffer.length < i) {
            this.conversionBuffer = new byte[i];
        }
        buf.readBytes(this.conversionBuffer, 0, i);
        return this.conversionBuffer;
    }

    protected ByteBuf decrypt(ChannelHandlerContext context, ByteBuf buf) 
        throws ShortBufferException {
        int i = buf.readableBytes();
        byte[] bs = this.toByteArray(buf);
        ByteBuf byteBuf = context.alloc().heapBuffer(this.cipher.getOutputSize(i));
        byteBuf.writerIndex(this.cipher.update(bs, 0, i, byteBuf.array(), 
            byteBuf.arrayOffset()));
        return byteBuf;
    }

    protected void encrypt(ByteBuf buf, ByteBuf result) throws ShortBufferException {
        int i = buf.readableBytes();
        byte[] bs = this.toByteArray(buf);
        int j = this.cipher.getOutputSize(i);
        if (this.encryptionBuffer.length < j) {
            this.encryptionBuffer = new byte[j];
        }
        result.writeBytes(this.encryptionBuffer, 0, this.cipher.update(bs, 0, i, 
            this.encryptionBuffer));
    }
}
```

---

## 密钥生成与管理

### 服务端密钥生成

服务端在启动时生成 RSA 密钥对：

```103:111:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static KeyPair generateServerKeyPair() throws NetworkEncryptionException {
    try {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA);
        keyPairGenerator.initialize(1024);
        return keyPairGenerator.generateKeyPair();
    } catch (Exception exception) {
        throw new NetworkEncryptionException(exception);
    }
}
```

#### 密钥生成流程

```
1. 创建 KeyPairGenerator 实例
   └─ Algorithm: RSA
   
2. 初始化密钥生成器
   └─ Key Size: 1024 bits
   
3. 生成密钥对
   ├─ Public Key (服务端发送)
   └─ Private Key (服务端保留，用于解密)
```

### 会话密钥生成

客户端生成 AES 会话密钥：

```88:96:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static SecretKey generateSecretKey() throws NetworkEncryptionException {
    try {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(AES);
        keyGenerator.init(128);
        return keyGenerator.generateKey();
    } catch (Exception exception) {
        throw new NetworkEncryptionException(exception);
    }
}
```

### 密钥交换机制

```
┌─────────────────────────────────────────────────────────────┐
│                    RSA 密钥交换流程                           │
├─────────────────────────────────────────────────────────────┤
│  客户端                                                        │
│  ┌─────────────────┐                                          │
│  │  生成 AES 密钥  │  SecretKey (128-bit)                    │
│  └────────┬────────┘                                          │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                          │
│  │ RSA 加密传输     │  RSA(PublicKey, SecretKey)              │
│  └────────┬────────┘                                          │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                       网络传输                                 │
│              encryptedSecretKey = [encrypted bytes]           │
└───────────┬───────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│  服务端                                                          │
│  ┌─────────────────┐                                          │
│  │ RSA 解密获取    │  RSA_Decrypt(PrivateKey, encryptedKey)    │
│  └────────┬────────┘                                          │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                          │
│  │ 重建 AES 密钥   │  new SecretKeySpec(bytes, "AES")         │
│  └────────┬────────┘                                          │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                          │
│  │ 配置加密管道    │  PacketEncryptor/Decryptor              │
│  └─────────────────┘                                          │
└───────────────────────────────────────────────────────────────┘
```

### PEM 格式编解码

Minecraft 支持 PEM 格式的密钥存储：

```211:216:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static String encodeRsaPublicKey(PublicKey key) {
    if (!RSA.equals(key.getAlgorithm())) {
        throw new IllegalArgumentException("Public key must be RSA");
    }
    return "-----BEGIN RSA PUBLIC KEY-----\n" + BASE64_ENCODER.encodeToString(key.getEncoded()) + "\n-----END RSA PUBLIC KEY-----\n";
}
```

#### PEM 格式结构

```
-----BEGIN RSA PUBLIC KEY-----
[MimeEncoder.encode(key.getEncoded())]
-----END RSA PUBLIC KEY-----

-----BEGIN RSA PRIVATE KEY-----
[MimeEncoder.encode(key.getEncoded())]
-----END RSA PRIVATE KEY-----
```

---

## 数据包加密流程

### AES/CFB8 加密模式

Minecraft 使用 AES/CFB8 (Cipher FeedBack 8-bit) 模式进行数据包加密：

```340:348:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static Cipher cipherFromKey(int opMode, Key key) throws NetworkEncryptionException {
    try {
        Cipher cipher = Cipher.getInstance("AES/CFB8/NoPadding");
        cipher.init(opMode, key, new IvParameterSpec(key.getEncoded()));
        return cipher;
    } catch (Exception exception) {
        throw new NetworkEncryptionException(exception);
    }
}
```

#### CFB8 模式特点

- **流式加密**: 适合变长数据包，无需填充
- **自同步**: 每个加密块影响后续所有块
- **IV 复用**: 使用密钥本身作为初始化向量

### 加密管道配置

```
ChannelPipeline
├── SplitterHandler          # 拆分数据包长度前缀
├── SizePrepender            # 添加长度前缀
├── PacketDecoder            # 解码 VarInt + Packet
├── DurationLimiter          # 限流
├── IdleStateHandler         # 空闲检测
├── PacketEncryption         # [新增] AES 加密
│   └─ PacketEncryptor       # 或 PacketDecryptor
├── PacketDeflater           # Zlib 压缩
└── EncoderHandler           # 最终编码
```

### 数据包加密流程

```mermaid
sequenceDiagram
    participant App as 应用层
    participant Pipe as Netty Pipeline
    participant Enc as PacketEncryptor
    participant Cipher as AES/CFB8
    participant Net as 网络
    
    App->>Pipe: write(packet)
    Pipe->>Enc: encode(ctx, buf)
    Note over Enc: buf = PacketByteBuf
    Enc->>Cipher: encrypt(buf, result)
    Note over Cipher: AES/CFB8<br/>buf.readableBytes() -> result
    Cipher-->>Enc: encrypted bytes
    Enc-->>Pipe: result ByteBuf
    Pipe->>Net: channelWrite(encryptedBuf)
    Net->>Net: TCP 传输
```

### 解密流程

```mermaid
sequenceDiagram
    participant Net as 网络
    participant Pipe as Netty Pipeline
    participant Dec as PacketDecryptor
    participant Cipher as AES/CFB8
    participant App as 应用层
    
    Net->>Pipe: channelRead(buf)
    Pipe->>Dec: decode(ctx, buf, out)
    Note over Dec: buf = encrypted bytes
    Dec->>Cipher: decrypt(ctx, buf)
    Note over Cipher: AES/CFB8<br/>buf.readableBytes() -> newBuf
    Cipher-->>Dec: decrypted ByteBuf
    Dec->>App: list.add(decryptedBuf)
    Note over App: PacketDecoder 处理
```

---

## 1.19+ 变更

Minecraft 1.19 引入了 Mojang 账号系统和公钥身份认证机制，这是加密系统的重大升级。

### 新增组件

#### PlayerPublicKey

玩家公钥记录，包含服务端签名的公钥信息：

```33:57:assets/mc/1.21/net/minecraft/network/encryption/PlayerPublicKey.java
public record PlayerPublicKey(PublicKeyData data) {
    public static final Text EXPIRED_PUBLIC_KEY_TEXT = 
        Text.translatable("multiplayer.disconnect.expired_public_key");
    private static final Text INVALID_PUBLIC_KEY_SIGNATURE_TEXT = 
        Text.translatable("multiplayer.disconnect.invalid_public_key_signature.new");
    public static final Duration EXPIRATION_GRACE_PERIOD = Duration.ofHours(8L);
    public static final Codec<PlayerPublicKey> CODEC = 
        PublicKeyData.CODEC.xmap(PlayerPublicKey::new, PlayerPublicKey::data);

    public static PlayerPublicKey verifyAndDecode(
        SignatureVerifier servicesSignatureVerifier, 
        UUID playerUuid, 
        PublicKeyData publicKeyData) throws PublicKeyException {
        if (!publicKeyData.verifyKey(servicesSignatureVerifier, playerUuid)) {
            throw new PublicKeyException(INVALID_PUBLIC_KEY_SIGNATURE_TEXT);
        }
        return new PlayerPublicKey(publicKeyData);
    }

    public record PublicKeyData(Instant expiresAt, PublicKey key, byte[] keySignature) {
        // 包含过期时间、公钥、签名
    }
}
```

#### PlayerKeyPair

玩家密钥对记录：

```27:36:assets/mc/1.21/net/minecraft/network/encryption/PlayerKeyPair.java
public record PlayerKeyPair(PrivateKey privateKey, PlayerPublicKey publicKey, 
                            Instant refreshedAfter) {
    public static final Codec<PlayerKeyPair> CODEC = RecordCodecBuilder.create(
        instance -> instance.group(
            NetworkEncryptionUtils.RSA_PRIVATE_KEY_CODEC
                .fieldOf("private_key")
                .forGetter(PlayerKeyPair::privateKey),
            PlayerPublicKey.CODEC
                .fieldOf("public_key")
                .forGetter(PlayerKeyPair::publicKey),
            Codecs.INSTANT
                .fieldOf("refreshed_after")
                .forGetter(PlayerKeyPair::refreshedAfter)
        ).apply(instance, PlayerKeyPair::new)
    );

    public boolean isExpired() {
        return this.refreshedAfter.isBefore(Instant.now());
    }
}
```

### 签名验证机制

#### SignatureVerifier 接口

```18:62:assets/mc/1.21/net/minecraft/network/encryption/SignatureVerifier.java
public interface SignatureVerifier {
    public static final SignatureVerifier NOOP = (updatable, signatureData) -> true;
    public static final Logger LOGGER = LogUtils.getLogger();

    public boolean validate(SignatureUpdatable var1, byte[] var2);

    default public boolean validate(byte[] signedData, byte[] signatureData) {
        return this.validate(updater -> updater.update(signedData), signatureData);
    }

    public static SignatureVerifier create(PublicKey publicKey, String algorithm) {
        return (updatable, signatureData) -> {
            try {
                Signature signature = Signature.getInstance(algorithm);
                signature.initVerify(publicKey);
                return SignatureVerifier.verify(updatable, signatureData, signature);
            } catch (Exception exception) {
                LOGGER.error("Failed to verify signature", exception);
                return false;
            }
        };
    }
}
```

### 1.19+ 认证流程对比

```
┌────────────────────────────────────────────────────────────────┐
│                     1.18 及之前 (传统模式)                       │
├────────────────────────────────────────────────────────────────┤
│  1. 客户端发送 nonce                                             │
│  2. 服务端 用私钥解密 nonce                                       │
│  3. 服务端 比对 nonce                                            │
│  4. ⚠️ 无法验证客户端身份真实性                                     │
│  5. ⚠️ 无法防止 replay 攻击                                       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                     1.19+ (Mojang 账号模式)                      │
├────────────────────────────────────────────────────────────────┤
│  1. 客户端包含 Mojang 签名的公钥                                   │
│  2. 服务端 向 Mojang 验证公钥签名                                  │
│  3. 服务端 使用玩家公钥验证 nonce 签名                              │
│  4. ✅ 玩家身份被 Mojang 认证                                      │
│  5. ✅ 签名包含时间戳，防止 replay                                  │
└────────────────────────────────────────────────────────────────┘
```

### 公钥数据结构

```58:100:assets/mc/1.21/net/minecraft/network/encryption/PlayerPublicKey.java
public record PublicKeyData(Instant expiresAt, PublicKey key, byte[] keySignature) {
    private static final int KEY_SIGNATURE_MAX_SIZE = 4096;
    public static final Codec<PublicKeyData> CODEC = RecordCodecBuilder.create(
        instance -> instance.group(
            Codecs.INSTANT.fieldOf("expires_at").forGetter(PublicKeyData::expiresAt),
            NetworkEncryptionUtils.RSA_PUBLIC_KEY_CODEC
                .fieldOf("key")
                .forGetter(PublicKeyData::key),
            Codecs.BASE_64.fieldOf("signature_v2").forGetter(PublicKeyData::keySignature)
        ).apply(instance, PublicKeyData::new)
    );

    boolean verifyKey(SignatureVerifier servicesSignatureVerifier, UUID playerUuid) {
        return servicesSignatureVerifier.validate(
            this.toSerializedString(playerUuid), 
            this.keySignature
        );
    }

    private byte[] toSerializedString(UUID playerUuid) {
        byte[] bs = this.key.getEncoded();
        byte[] cs = new byte[24 + bs.length];
        ByteBuffer byteBuffer = ByteBuffer.wrap(cs).order(ByteOrder.BIG_ENDIAN);
        byteBuffer.putLong(playerUuid.getMostSignificantBits())
                  .putLong(playerUuid.getLeastSignificantBits())
                  .putLong(this.expiresAt.toEpochMilli())
                  .put(bs);
        return cs;
    }

    public boolean isExpired() {
        return this.expiresAt.isBefore(Instant.now());
    }

    public boolean isExpired(Duration gracePeriod) {
        return this.expiresAt.plus(gracePeriod).isBefore(Instant.now());
    }
}
```

#### 签名数据序列化格式

```
┌────────────────┬────────────────┬─────────────────┬────────────────────┐
│ Player UUID MSB│ Player UUID LSB │ 过期时间 (ms)    │ 公钥编码数据        │
│   (8 bytes)   │   (8 bytes)    │   (8 bytes)     │  (variable)        │
└────────────────┴────────────────┴─────────────────┴────────────────────┘
         24 bytes fixed header              + key.getEncoded().length
```

---

## 源码分析

### 登录状态机

```26:31:assets/mc/1.21/net/minecraft/network/state/LoginStates.java
public class LoginStates {
    public static final NetworkState.Factory<ServerLoginPacketListener, PacketByteBuf> 
        C2S_FACTORY = NetworkStateBuilder.c2s(NetworkPhase.LOGIN, builder -> 
            builder
                .add(LoginPackets.HELLO_C2S, LoginHelloC2SPacket.CODEC)
                .add(LoginPackets.KEY, LoginKeyC2SPacket.CODEC)
                .add(LoginPackets.CUSTOM_QUERY_ANSWER, LoginQueryResponseC2SPacket.CODEC)
                .add(LoginPackets.LOGIN_ACKNOWLEDGED, EnterConfigurationC2SPacket.CODEC)
                .add(CookiePackets.COOKIE_RESPONSE, CookieResponseC2SPacket.CODEC)
        );
    
    public static final NetworkState.Factory<ClientLoginPacketListener, PacketByteBuf> 
        S2C_FACTORY = NetworkStateBuilder.s2c(NetworkPhase.LOGIN, builder -> 
            builder
                .add(LoginPackets.LOGIN_DISCONNECT, LoginDisconnectS2CPacket.CODEC)
                .add(LoginPackets.HELLO_S2C, LoginHelloS2CPacket.CODEC)
                .add(LoginPackets.GAME_PROFILE, LoginSuccessS2CPacket.CODEC)
                .add(LoginPackets.LOGIN_COMPRESSION, LoginCompressionS2CPacket.CODEC)
                .add(LoginPackets.CUSTOM_QUERY, LoginQueryRequestS2CPacket.CODEC)
                .add(CookiePackets.COOKIE_REQUEST, CookieRequestS2CPacket.CODEC)
        );
}
```

#### 服务端登录状态

| 状态 | 等待数据包 | 说明 |
|------|----------|------|
| `HELLO` | `LoginHelloC2SPacket` | 接收玩家信息 |
| `KEY` | `LoginKeyC2SPacket` | 接收加密密钥 |
| `AUTHENTICATION` | `LoginQueryResponseC2SPacket` | Mojang 认证查询 |
| `WAITING_FOR_ACKNOWLEDGEMENT` | `EnterConfigurationC2SPacket` | 等待确认 |

#### 客户端登录状态

| 状态 | 接收数据包 | 说明 |
|------|----------|------|
| `INITIAL` | - | 初始状态 |
| `HELLO` | `LoginHelloS2CPacket` | 接收服务端公钥 |
| `WAITING_FOR_TRANSFER` | `ServerTransferS2CPacket` | 等待服务器转移 |
| `WAITING_FOR_LOGIN_ACKNOWLEDGEMENT` | `LoginSuccessS2CPacket` | 等待登录成功 |

### RSA 加解密实现

```294:331:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static byte[] encrypt(Key key, byte[] data) throws NetworkEncryptionException {
    return NetworkEncryptionUtils.crypt(1, key, data);
}

public static byte[] decrypt(Key key, byte[] data) throws NetworkEncryptionException {
    return NetworkEncryptionUtils.crypt(2, key, data);
}

private static byte[] crypt(int opMode, Key key, byte[] data) 
    throws NetworkEncryptionException {
    try {
        return NetworkEncryptionUtils.createCipher(opMode, key.getAlgorithm(), key)
            .doFinal(data);
    } catch (Exception exception) {
        throw new NetworkEncryptionException(exception);
    }
}

private static Cipher createCipher(int opMode, String algorithm, Key key) 
    throws Exception {
    Cipher cipher = Cipher.getInstance(algorithm);
    cipher.init(opMode, key);
    return cipher;
}
```

### Server ID 计算 (旧版兼容)

```121:127:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public static byte[] computeServerId(String baseServerId, PublicKey publicKey, 
                                     SecretKey secretKey) 
    throws NetworkEncryptionException {
    try {
        return NetworkEncryptionUtils.hash(
            baseServerId.getBytes(ISO_8859_1), 
            secretKey.getEncoded(), 
            publicKey.getEncoded()
        );
    } catch (Exception exception) {
        throw new NetworkEncryptionException(exception);
    }
}

private static byte[] hash(byte[] ... bytes) throws Exception {
    MessageDigest messageDigest = MessageDigest.getInstance(SHA1);
    for (byte[] bs : bytes) {
        messageDigest.update(bs);
    }
    return messageDigest.digest();
}
```

Server ID 用于旧版 Minecraft 第三方登录系统（如 Steam 等）：

```
Server ID = SHA1(serverId + AES_Key + RSA_PublicKey)
```

### 签名数据处理

```354:373:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
public record SignatureData(long salt, byte[] signature) {
    public static final SignatureData NONE = new SignatureData(0L, ByteArrays.EMPTY_ARRAY);

    public SignatureData(PacketByteBuf buf) {
        this(buf.readLong(), buf.readByteArray());
    }

    public boolean isSignaturePresent() {
        return this.signature.length > 0;
    }

    public static void write(PacketByteBuf buf, SignatureData signatureData) {
        buf.writeLong(signatureData.salt);
        buf.writeByteArray(signatureData.signature);
    }

    public byte[] getSalt() {
        return Longs.toByteArray(this.salt);
    }
}
```

签名数据包含：
- `salt`: 随机盐值，防止 hash 碰撞
- `signature`: RSA 签名数据

---

## 安全考虑

### 潜在风险

#### 1. RSA 密钥长度 (1024-bit)

虽然 1024-bit RSA 在当前仍是安全的，但业界趋势是迁移到 2048-bit：

```
密钥长度安全等级:
├── 512-bit  : ❌ 不安全 (可在数分钟内分解)
├── 768-bit  : ⚠️  较弱 (专业团队可分解)
├── 1024-bit : ⚠️  旧标准 (国家级别攻击者可分解)
└── 2048-bit : ✅ 当前推荐标准
```

#### 2. AES 密钥长度 (128-bit)

128-bit AES 是当前对称加密的标准选择：

| 密钥长度 | 安全性 | 性能 | 适用场景 |
|----------|--------|------|----------|
| 128-bit | ✅ 足够 | ✅ 更快 | Minecraft 当前使用 |
| 192-bit | ✅ 更高 | ⚠️ 中等 | 高安全需求 |
| 256-bit | ✅ 最高 | ⚠️ 较慢 | 军事级应用 |

#### 3. 密钥重用

服务端 RSA 密钥对在服务器生命周期内重复使用：

- **优点**: 简化密钥管理
- **缺点**: 如果密钥泄露，历史通信可能被解密

#### 4. CFB8 模式的 IV

使用密钥本身作为 IV：

```343:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
cipher.init(opMode, key, new IvParameterSpec(key.getEncoded()));
```

理论上，每次加密应该使用唯一的 IV。但 CFB 模式的特性使得密钥重用是可接受的，因为：

1. CFB8 是流式模式，每个密文字节依赖于所有明文字节
2. 密钥是随机生成的，每次连接不同
3. 每次连接的数据量有限

### 安全最佳实践

#### 1. 防止中间人攻击

- 服务端必须验证客户端公钥签名 (1.19+)
- 使用 Mojang 认证服务验证玩家身份

#### 2. 防止重放攻击

- Nonce 机制确保每个登录尝试唯一
- 公钥包含过期时间
- 8 小时宽限期允许密钥过期后短暂使用

#### 3. 加密强度

```python
# 当前配置评估
ENCRYPTION_CONFIG = {
    "symmetric": {
        "algorithm": "AES/CFB8/NoPadding",
        "key_size": 128,
        "rating": "SECURE"
    },
    "asymmetric": {
        "algorithm": "RSA/None/PKCS1Padding",
        "key_size": 1024,
        "rating": "ACCEPTABLE"  # 建议升级到 2048
    },
    "signature": {
        "algorithm": "SHA256withRSA",
        "rating": "SECURE"
    }
}
```

#### 4. 异常处理

所有加密操作必须捕获异常并转换为 `NetworkEncryptionException`：

```316:322:assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
private static byte[] crypt(int opMode, Key key, byte[] data) 
    throws NetworkEncryptionException {
    try {
        return NetworkEncryptionUtils.createCipher(opMode, key.getAlgorithm(), key)
            .doFinal(data);
    } catch (Exception exception) {
        throw new NetworkEncryptionException(exception);
    }
}
```

---

## 关键代码引用

### 核心加密工具类

```NetworkEncryptionUtils.java
assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionUtils.java
├── Line 37-52:    常量定义
├── Line 88-96:    generateSecretKey()
├── Line 103-111:  generateServerKeyPair()
├── Line 121-127:  computeServerId()
├── Line 276-283:  decryptSecretKey()
├── Line 294-296:  encrypt()
├── Line 307-309:  decrypt()
├── Line 316-322:  crypt()
├── Line 327-331:  createCipher()
├── Line 340-348:  cipherFromKey()
├── Line 211-216:  encodeRsaPublicKey()
├── Line 230-235:  encodeRsaPrivateKey()
└── Line 375-381:  SecureRandomUtil
```

### 数据包加解密处理器

```PacketEncryptor.java
assets/mc/1.21/net/minecraft/network/encryption/PacketEncryptor.java
├── Line 12-29:  完整实现

PacketDecryptor.java
assets/mc/1.21/net/minecraft/network/encryption/PacketDecryptor.java
├── Line 13-30:  完整实现

PacketEncryptionManager.java
assets/mc/1.21/net/minecraft/network/encryption/PacketEncryptionManager.java
├── Line 11-18:  构造函数和字段
├── Line 20-27:  toByteArray()
├── Line 29-35:  decrypt()
└── Line 37-45:  encrypt()
```

### 登录数据包

```LoginHelloC2SPacket.java
assets/mc/1.21/net/minecraft/network/packet/c2s/login/LoginHelloC2SPacket.java
├── Line 14-36:  完整实现

LoginKeyC2SPacket.java
assets/mc/1.21/net/minecraft/network/packet/c2s/login/LoginKeyC2SPacket.java
├── Line 19-70:  完整实现

LoginHelloS2CPacket.java
assets/mc/1.21/net/minecraft/network/packet/s2c/login/LoginHelloS2CPacket.java
├── Line 16-71:  完整实现

LoginSuccessS2CPacket.java
assets/mc/1.21/net/minecraft/network/packet/s2c/login/LoginSuccessS2CPacket.java
├── Line 15-38:  完整实现
```

### 1.19+ 公钥系统

```PlayerPublicKey.java
assets/mc/1.21/net/minecraft/network/encryption/PlayerPublicKey.java
├── Line 33-56:   PlayerPublicKey record
├── Line 58-100:  PublicKeyData record
└── Line 102-107: PublicKeyException

PlayerKeyPair.java
assets/mc/1.21/net/minecraft/network/encryption/PlayerKeyPair.java
├── Line 27-36:  完整实现

SignatureVerifier.java
assets/mc/1.21/net/minecraft/network/encryption/SignatureVerifier.java
├── Line 18-61:  完整实现

Signer.java
assets/mc/1.21/net/minecraft/network/encryption/Signer.java
├── Line 12-33:  完整实现
```

### 状态定义

```LoginStates.java
assets/mc/1.21/net/minecraft/network/state/LoginStates.java
├── Line 26-31:  完整定义

NetworkEncryptionException.java
assets/mc/1.21/net/minecraft/network/encryption/NetworkEncryptionException.java
└── Line 1-10:  异常定义
```

---

## 总结

Minecraft 1.21 的网络加密系统采用了成熟的加密技术：

| 组件 | 技术 | 状态 |
|------|------|------|
| 对称加密 | AES/CFB8 128-bit | ✅ 安全 |
| 密钥交换 | RSA 1024-bit | ⚠️ 可接受 |
| 签名验证 | SHA256withRSA | ✅ 安全 |
| 身份认证 | Mojang 公钥 (1.19+) | ✅ 安全 |

### 架构优势

1. **分层设计**: 清晰的加密层抽象
2. **Netty 集成**: 高效的异步加密处理
3. **向后兼容**: 保持对旧版客户端的支持
4. **可验证签名**: Mojang 公钥认证机制

### 改进建议

1. 升级 RSA 密钥到 2048-bit
2. 实现 Perfect Forward Secrecy (PFS)
3. 添加连接级别的会话密钥轮换

---

## 参考资料

- [Java Cryptography Architecture](https://docs.oracle.com/javase/8/docs/technotes/guides/security/crypto/CryptoSpec.html)
- [Netty Pipeline](https://netty.io/wiki/user-guide-for-4.x.html)
- [Minecraft Protocol Documentation](https://wiki.vg/Protocol)
- [AES CFB Mode](https://csrc.nist.gov/publications/detail/sp/800-38a/final)
