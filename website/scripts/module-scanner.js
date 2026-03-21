/**
 * Dynamic Module Scanner
 * 自动扫描 docs/ 目录结构，动态生成模块数据
 */

class ModuleScanner {
    constructor(basePath = 'docs/') {
        this.basePath = basePath;
        this.moduleConfig = {
            mc: {
                name: 'Minecraft 原版',
                icon: 'cube',
                color: '#5B8C5A',
                colorGradient: 'linear-gradient(135deg, #5B8C5A 0%, #6FA070 100%)',
                description: 'Minecraft 核心架构与源码深度解析',
                hasVersions: true,
                docTypes: ['analysis', 'tutorials']
            },
            iris: {
                name: 'Iris 光影',
                icon: 'sun',
                color: '#E07A5F',
                colorGradient: 'linear-gradient(135deg, #E07A5F 0%, #F2CC8F 100%)',
                description: 'Shader 加载器与渲染管线深度解析',
                hasVersions: false,
                docTypes: ['analysis', 'tutorials']
            },
            sodium: {
                name: 'Sodium 优化',
                icon: 'bolt',
                color: '#F2CC8F',
                colorGradient: 'linear-gradient(135deg, #F2CC8F 0%, #FFE066 100%)',
                description: '现代渲染优化与 Sodium 架构设计',
                hasVersions: false,
                docTypes: ['analysis', 'tutorials']
            },
            fabric: {
                name: 'Fabric 模组',
                icon: 'layer-group',
                color: '#7B68EE',
                colorGradient: 'linear-gradient(135deg, #7B68EE 0%, #9370DB 100%)',
                description: 'Fabric 模组开发框架详解',
                hasVersions: false,
                docTypes: ['analysis', 'tutorials']
            },
            lithium: {
                name: 'Lithium 优化',
                icon: 'atom',
                color: '#20B2AA',
                colorGradient: 'linear-gradient(135deg, #20B2AA 0%, #48D1CC 100%)',
                description: '游戏性能优化插件分析',
                hasVersions: false,
                docTypes: ['analysis', 'tutorials']
            }
        };
    }

    /**
     * 扫描所有模块
     * @returns {Object} 模块数据
     */
    scanAllModules() {
        const modules = {};
        
        // 获取 docs 目录下的所有子目录（模块）
        const moduleDirs = this.getSubdirectories(this.basePath);
        
        moduleDirs.forEach(slug => {
            const config = this.moduleConfig[slug];
            if (config) {
                modules[slug] = {
                    ...config,
                    slug: slug,
                    docsDir: `${this.basePath}${slug}`
                };
                
                if (config.hasVersions) {
                    modules[slug].versions = this.scanVersions(`${this.basePath}${slug}/`);
                } else {
                    modules[slug].docs = this.scanDocs(`${this.basePath}${slug}/`, config.docTypes);
                }
            }
        });
        
        return modules;
    }

    /**
     * 扫描版本目录 (用于 mc 等多版本模块)
     * @param {string} modulePath - 模块路径
     * @returns {Object} 版本数据
     */
    scanVersions(modulePath) {
        const versions = {};
        const versionDirs = this.getSubdirectories(modulePath);
        
        versionDirs.forEach(version => {
            // 跳过非版本目录如 index.html
            if (version.includes('.')) return;
            
            versions[version] = {
                name: version,
                docs: this.scanDocs(`${modulePath}${version}/`, this.moduleConfig.mc.docTypes)
            };
        });
        
        // 按版本号排序（降序）
        const sortedVersions = Object.keys(versions).sort((a, b) => {
            return this.compareVersions(b, a);
        });
        
        const sortedVersionsObj = {};
        sortedVersions.forEach(v => sortedVersionsObj[v] = versions[v]);
        
        return sortedVersionsObj;
    }

    /**
     * 扫描文档目录
     * @param {string} basePath - 基础路径
     * @param {Array} docTypes - 文档类型 ['analysis', 'tutorials']
     * @returns {Object} 扫描结果
     */
    scanDocs(basePath, docTypes) {
        const result = {};
        
        docTypes.forEach(type => {
            const typePath = `${basePath}${type}/`;
            const files = this.getHtmlFiles(typePath);
            
            if (files.length > 0) {
                result[type] = files.map(file => this.parseDocFile(typePath, file));
            }
        });
        
        return result;
    }

    /**
     * 解析文档文件获取信息
     * @param {string} path - 文件路径
     * @param {string} filename - 文件名
     * @returns {Object} 文档信息
     */
    parseDocFile(path, filename) {
        const id = filename.replace('.html', '');
        
        // 尝试从文件内容中提取标题和描述
        // 这个需要在实际使用时通过 fetch 获取
        // 暂时返回基于文件名的推断
        
        return {
            id: id,
            title: this.inferTitle(id),
            desc: this.inferDesc(id),
            time: '待定',
            filename: filename
        };
    }

    /**
     * 根据文件名推断标题
     */
    inferTitle(id) {
        // 移除编号前缀
        const cleaned = id.replace(/^\d+-/, '');
        // 转换为可读标题
        return cleaned
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/Mc/g, 'MC')
            .replace(/Cpu/g, 'CPU')
            .replace(/Gpu/g, 'GPU')
            .replace(/Ai/g, 'AI')
            .replace(/Io/g, 'IO');
    }

    /**
     * 根据文件名推断描述
     */
    inferDesc(id) {
        const descMap = {
            'architecture': '架构与设计模式',
            'client': '客户端模块',
            'server': '服务端模块',
            'world': '世界系统',
            'entity': '实体系统',
            'block': '方块系统',
            'item': '物品系统',
            'network': '网络协议',
            'render': '渲染系统',
            'chunk': '区块系统',
            'biome': '生物群系',
            'terrain': '地形生成',
            'ai': 'AI 系统',
            'command': '命令系统',
            'resource': '资源系统',
            'datafixer': '数据修复',
            'registry': '注册表',
            'package': '包结构',
            'shader': '着色器',
            'shadow': '阴影系统',
            'optimization': '性能优化',
            'multithreading': '多线程',
            'thread': '线程'
        };
        
        const lower = id.toLowerCase();
        for (const [key, desc] of Object.entries(descMap)) {
            if (lower.includes(key)) return desc;
        }
        return '相关内容';
    }

    /**
     * 获取子目录列表
     */
    getSubdirectories(path) {
        // 这个需要服务器端实现或使用预定义的目录结构
        // 在浏览器中无法直接访问文件系统
        // 解决方案：使用预扫描的结果或通过 index.json
        return this.getKnownDirectories(path);
    }

    /**
     * 获取已知目录（在客户端可用）
     */
    getKnownDirectories(path) {
        const known = {
            'docs/': ['mc', 'iris', 'sodium', 'fabric', 'lithium'],
            'docs/mc/': ['1.18', '1.18.2', '1.19', '1.19.4', '1.20', '1.20.4', '1.21', '1.21.4'],
            'docs/iris/': ['analysis', 'tutorials'],
            'docs/sodium/': ['analysis', 'tutorials'],
            'docs/fabric/': ['analysis', 'tutorials'],
            'docs/lithium/': ['analysis', 'tutorials']
        };
        return known[path] || [];
    }

    /**
     * 获取 HTML 文件列表
     */
    getHtmlFiles(path) {
        // 同样需要服务器端或预定义
        const knownFiles = {
            'docs/mc/1.21/analysis/': [
                '01-architecture-overview.html',
                '02-client-module.html',
                '03-server-module.html',
                '04-world-system.html',
                '05-entity-system.html',
                '06-block-item-system.html',
                '07-network-protocol.html',
                '08-datafixer-system.html',
                '09-registry-system.html',
                '10-package-structure.html'
            ],
            'docs/mc/1.21/tutorials/': [
                '00-course-overview.html',
                '00-TUTORIAL-PLAN.html',
                '01-java-basics.html',
                '01-LEARNING-ROADMAP.html',
                '02-development-env.html',
                '03-project-intro.html',
                '04-registry-system.html',
                '04-sourcecode-guide.html',
                '05-client-server-arch.html',
                '06-shared-constants.html',
                '07-bootstrap-flow.html'
            ],
            'docs/iris/analysis/': [
                '01-architecture-overview.html',
                '02-rendering-pipeline.html',
                '03-shaderpack-system.html',
                '04-shadow-system.html',
                '05-framebuffer-texture.html',
                '06-uniforms.html'
            ],
            'docs/iris/tutorials/': [
                '01-shader-basics.html',
                '02-iris-setup.html',
                '03-create-simple-shader.html'
            ],
            'docs/sodium/analysis/': [
                '01-architecture-overview.html',
                '02-chunk-render-system.html',
                '03-occlusion-culling.html',
                '04-render-pipeline.html',
                '05-shader-system.html',
                '06-platform-integration.html'
            ],
            'docs/sodium/tutorials/': [
                '01-mod-dev-intro.html',
                '02-thread-optimization.html',
                '03-multithreading-basics.html'
            ]
        };
        return knownFiles[path] || [];
    }

    /**
     * 比较版本号
     */
    compareVersions(a, b) {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA !== numB) return numA - numB;
        }
        return 0;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleScanner;
}
