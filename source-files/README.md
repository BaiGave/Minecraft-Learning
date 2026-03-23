# 源文件目录 (Source Files)

此目录用于存放收集来的项目源文件，如：
- Minecraft 源码反编译版本
- 模组源码（如 Fabric、Forge、Iris、Sodium 等）
- Shader 源码文件
- 配置文件和资源文件

## 目录结构建议

```
source-files/
├── minecraft/           # Minecraft 源码
│   └── 1.21/          # 按版本分类
├── mods/               # 模组源码
│   ├── fabric/
│   ├── forge/
│   ├── iris/
│   ├── sodium/
│   └── lithium/
└── shaders/            # Shader 源文件
    └── iris/
```

## 注意事项

- 这些文件通常体积较大（几百 MB 到几 GB）
- 建议使用 Git LFS 或子模块管理
- 确保你有权使用这些源码（遵循相应许可证）
