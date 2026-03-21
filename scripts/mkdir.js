/**
 * 目录结构初始化脚本
 *
 * 自动创建标准目录结构
 *
 * 使用方法：
 *   node scripts/mkdir.js              # 创建所有定义模块的目录
 *   node scripts/mkdir.js mc           # 创建特定模块
 *   node scripts/mkdir.js --list       # 列出可用模块
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const WEBSITE_DIR = path.join(ROOT, 'website', 'docs');
const SOURCES_DIR = path.join(ROOT, 'sources');

// 定义所有模块和版本
const MODULES = {
    mc: {
        type: 'versioned',
        versions: ['1.18.2', '1.19.4', '1.20.4', '1.21', '1.21.4'],
        description: 'Minecraft 原版'
    },
    sodium: {
        type: 'flat',
        description: 'Sodium 优化模组'
    },
    iris: {
        type: 'flat',
        description: 'Iris 光影支持模组'
    },
    fabric: {
        type: 'flat',
        description: 'Fabric 模组加载器'
    },
    lithium: {
        type: 'flat',
        description: 'Lithium 游戏优化模组'
    }
};

// 每个模块必须包含的子目录
const REQUIRED_SUBDIRS = ['tutorials', 'analysis'];

// ============================================================================
// Logger
// ============================================================================

const Logger = {
    colors: {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        cyan: '\x1b[36m',
        red: '\x1b[31m',
        magenta: '\x1b[35m'
    },

    log(msg, color) {
        console.log((color ? this.colors[color] : '') + msg + this.colors.reset);
    },

    info(msg) { this.log('ℹ  ' + msg, 'blue'); },
    success(msg) { this.log('✓  ' + msg, 'green'); },
    warning(msg) { this.log('⚠  ' + msg, 'yellow'); },
    error(msg) { this.log('✗  ' + msg, 'red'); },

    header(msg) {
        console.log('\n' + this.colors.cyan + '='.repeat(60) + this.colors.reset);
        console.log(this.colors.bright + this.colors.cyan + '  ' + msg + this.colors.reset);
        console.log(this.colors.cyan + '='.repeat(60) + this.colors.reset + '\n');
    },

    section(msg) {
        console.log('\n' + this.colors.magenta + '▶ ' + msg + this.colors.reset);
    }
};

// ============================================================================
// Directory Operations
// ============================================================================

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        return true;
    }
    return false;
}

function createVersionReadme(dirPath, version) {
    const readmePath = path.join(dirPath, 'README.md');

    if (!fs.existsSync(readmePath)) {
        const lines = [
            '# Minecraft ' + version,
            '',
            '本目录包含 Minecraft ' + version + ' 版本的教程和分析文档。',
            '',
            '## 目录结构',
            '',
            '```',
            version + '/',
            '├── tutorials/    # 版本特定教程',
            '└── analysis/     # 版本特定分析',
            '```',
            '',
            '## 内容说明',
            '',
            '- **tutorials/**: 针对 ' + version + ' 版本的开发教程',
            '- **analysis/**: ' + version + ' 的源码架构分析',
            '',
            '## 资源文件',
            '',
            '对应的源文件位于 `../../sources/mc/' + version + '/` 目录。'
        ];
        fs.writeFileSync(readmePath, lines.join('\n'), 'utf8');
        Logger.success('  └─ ' + version + '/README.md');
    }
}

function createModuleReadme(dirPath, moduleInfo) {
    const readmePath = path.join(dirPath, 'README.md');
    const moduleName = path.basename(dirPath);

    if (!fs.existsSync(readmePath)) {
        const lines = [
            '# ' + moduleInfo.description,
            '',
            '模块 ID: `' + moduleName + '`',
            '',
            '## 目录结构',
            '',
            '```',
            moduleName + '/',
            '├── tutorials/    # 教程文章',
            '└── analysis/     # 源码分析',
            '```',
            '',
            '## 内容说明',
            '',
            '- **tutorials/**: 包含入门指南、实战教程等教学性质的文章',
            '- **analysis/**: 包含源码架构解析、系统分析等技术深度文章'
        ];
        fs.writeFileSync(readmePath, lines.join('\n'), 'utf8');
        Logger.success('  └─ README.md');
    }
}

function createSubdirPlaceholder(dirPath, subdir, version) {
    const readmePath = path.join(dirPath, subdir, 'README.md');

    if (!fs.existsSync(readmePath)) {
        const subdirTitle = subdir === 'tutorials' ? '教程' : '分析';
        let content;
        if (version) {
            content = '# ' + version + ' ' + subdirTitle + '\n\n此目录用于存放 ' + version + ' 的 ' + subdirTitle.toLowerCase() + '文章。\n';
        } else {
            content = '# ' + subdirTitle + '\n\n此目录用于存放 ' + subdirTitle.toLowerCase() + '相关文章。\n';
        }
        fs.writeFileSync(readmePath, content, 'utf8');
        const prefix = version ? version + '/' : '';
        Logger.success('  └─ ' + prefix + subdir + '/README.md');
    }
}

function createMcSourcesDir(version) {
    const sourcesDir = path.join(SOURCES_DIR, 'mc', version);
    const subdirs = ['client', 'server', 'mappings'];

    ensureDir(sourcesDir);

    subdirs.forEach(function(subdir) {
        const subdirPath = path.join(sourcesDir, subdir);
        ensureDir(subdirPath);

        const readmePath = path.join(subdirPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
            const subdirTitle = subdir.charAt(0).toUpperCase() + subdir.slice(1);
            const lines = [
                '# Minecraft ' + version + ' ' + subdirTitle + ' 源码',
                '',
                '此目录用于存放 Minecraft ' + version + ' ' + subdir + ' 相关文件。'
            ];
            fs.writeFileSync(readmePath, lines.join('\n'), 'utf8');
        }
    });
}

function createModSourcesDir(modName) {
    const sourcesDir = path.join(SOURCES_DIR, modName);

    ensureDir(sourcesDir);

    const readmePath = path.join(sourcesDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
        const lines = [
            '# ' + modName + ' 源码',
            '',
            '此目录用于存放 ' + modName + ' 的源代码。',
            '',
            '## 版本目录',
            '',
            '```',
            modName + '/',
            '├── 0.5.4/',
            '├── 0.5.5/',
            '└── 1.0.x/',
            '```'
        ];
        fs.writeFileSync(readmePath, lines.join('\n'), 'utf8');
    }
}

// ============================================================================
// Main Functions
// ============================================================================

function createModuleStructure(moduleName, moduleInfo) {
    Logger.section('创建 ' + moduleName + ' (' + moduleInfo.description + ')');

    const contentModuleDir = path.join(CONTENT_DIR, moduleName);
    const websiteModuleDir = path.join(WEBSITE_DIR, moduleName);

    // 确保 website 目录与 content 目录结构一致
    ensureDir(websiteModuleDir);

    if (moduleInfo.type === 'versioned') {
        moduleInfo.versions.forEach(function(version) {
            Logger.info('版本: ' + version);

            const versionContentDir = path.join(contentModuleDir, version);
            const versionWebsiteDir = path.join(websiteModuleDir, version);

            // Content 目录
            ensureDir(versionContentDir);
            createVersionReadme(versionContentDir, version);

            // Website 目录 (与 content 结构一致)
            ensureDir(versionWebsiteDir);

            // 子目录
            REQUIRED_SUBDIRS.forEach(function(subdir) {
                ensureDir(path.join(versionContentDir, subdir));
                ensureDir(path.join(versionWebsiteDir, subdir));
                createSubdirPlaceholder(versionContentDir, subdir, version);
            });

            // Sources 目录
            createMcSourcesDir(version);
        });
    } else {
        // Mod 扁平结构
        ensureDir(contentModuleDir);
        createModuleReadme(contentModuleDir, moduleInfo);

        REQUIRED_SUBDIRS.forEach(function(subdir) {
            ensureDir(path.join(contentModuleDir, subdir));
            ensureDir(path.join(websiteModuleDir, subdir));
            createSubdirPlaceholder(contentModuleDir, subdir, null);
        });

        createModSourcesDir(moduleName);
    }

    Logger.success(moduleName + ' 目录结构创建完成');
}

function createSourcesBaseStructure() {
    Logger.section('创建 sources 基础目录');

    ensureDir(SOURCES_DIR);

    Object.keys(MODULES).forEach(function(moduleName) {
        ensureDir(path.join(SOURCES_DIR, moduleName));
    });

    Logger.success('sources 基础目录创建完成');
}

function createAllStructures() {
    Logger.header('博客项目目录初始化');

    ensureDir(CONTENT_DIR);
    ensureDir(WEBSITE_DIR);
    createSourcesBaseStructure();

    Object.keys(MODULES).forEach(function(moduleName) {
        createModuleStructure(moduleName, MODULES[moduleName]);
    });

    console.log('\n');
    Logger.header('初始化完成！');
    Logger.info('Content 目录: ' + path.relative(ROOT, CONTENT_DIR));
    Logger.info('Website  目录: ' + path.relative(ROOT, WEBSITE_DIR));
    Logger.info('Sources  目录: ' + path.relative(ROOT, SOURCES_DIR));
}

function listModules() {
    Logger.header('可用模块列表');

    Object.keys(MODULES).forEach(function(moduleName) {
        var info = MODULES[moduleName];
        console.log('\n' + Logger.colors.bright + moduleName + Logger.colors.reset + ' - ' + info.description);
        console.log('  类型: ' + (info.type === 'versioned' ? '版本目录' : '扁平结构'));
        if (info.versions) {
            console.log('  版本: ' + info.versions.join(', '));
        }
    });
}

// ============================================================================
// CLI Entry Point
// ============================================================================

function main() {
    var args = process.argv.slice(2);

    if (args.length === 0) {
        createAllStructures();
        return;
    }

    var command = args[0];

    switch (command) {
        case '--list':
        case '-l':
            listModules();
            break;

        case '--help':
        case '-h':
            console.log('\n博客项目目录初始化脚本\n\n使用方法：\n  node scripts/mkdir.js              创建所有模块的目录结构\n  node scripts/mkdir.js <module>      创建特定模块的目录\n  node scripts/mkdir.js --list        列出可用模块\n  node scripts/mkdir.js --help        显示帮助\n\n示例：\n  node scripts/mkdir.js              # 初始化全部\n  node scripts/mkdir.js mc            # 只创建 MC 相关\n');
            break;

        default:
            if (command.startsWith('--')) {
                Logger.error('未知选项: ' + command);
            } else if (MODULES[command]) {
                createModuleStructure(command, MODULES[command]);
            } else {
                Logger.error('未知模块: ' + command);
                Logger.info('使用 --list 查看可用模块');
            }
    }
}

main();
