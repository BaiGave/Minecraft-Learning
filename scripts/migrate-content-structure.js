/**
 * Content 目录迁移脚本
 *
 * 将现有的混乱目录结构统一为：
 * content/{模组}/{MC版本}/{加载器}/{模组版本}/{tutorials,analysis}/...
 *
 * 迁移规则：
 * - fabric/1.21/-/core/tutorials -> fabric/1.21/core/-/tutorials
 * - sodium/.../analysis/analysis -> sodium/.../analysis
 * - sodium/.../tutorials/tutorials -> sodium/.../tutorials
 *
 * 使用方法：
 *   node scripts/migrate-content-structure.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

const C_GREEN = '\x1b[32m';
const C_YELLOW = '\x1b[33m';
const C_RED = '\x1b[31m';
const C_CYAN = '\x1b[36m';
const C_RESET = '\x1b[0m';

function log(msg, color = C_GREEN) {
    console.log(`${color}${msg}${C_RESET}`);
}

function warn(msg) {
    console.log(`${C_YELLOW}[WARN] ${msg}${C_RESET}`);
}

function error(msg) {
    console.log(`${C_RED}[ERROR] ${msg}${C_RESET}`);
}

function info(msg) {
    console.log(`${C_CYAN}[INFO] ${msg}${C_RESET}`);
}

/**
 * 复制目录到新位置
 */
function copyDir(src, dest) {
    try {
        if (!fs.existsSync(src)) return false;

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
        return true;
    } catch (e) {
        error(`复制失败 ${src} -> ${dest}: ${e.message}`);
        return false;
    }
}

/**
 * 删除目录
 */
function removeDir(dir) {
    try {
        if (fs.existsSync(dir)) {
            if (fs.statSync(dir).isDirectory()) {
                fs.rmSync(dir, { recursive: true, force: true });
            } else {
                fs.unlinkSync(dir);
            }
        }
        return true;
    } catch (e) {
        warn(`无法删除 ${dir}: ${e.message}`);
        return false;
    }
}

/**
 * 递归删除空目录
 */
function removeEmptyDirs(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            removeEmptyDirs(path.join(dir, entry.name));
        }
    }

    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0) {
        try {
            fs.rmdirSync(dir);
            log(`删除空目录: ${path.relative(CONTENT_DIR, dir)}`);
        } catch (e) {
            // 忽略
        }
    }
}

/**
 * 检查目录是否为空
 */
function isEmptyDir(dir) {
    if (!fs.existsSync(dir)) return true;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.length === 0;
}

/**
 * 执行迁移
 */
function migrate() {
    log('\n========================================');
    log('  Content 目录结构迁移工具');
    log('========================================\n');

    if (!fs.existsSync(CONTENT_DIR)) {
        error(`Content 目录不存在: ${CONTENT_DIR}`);
        return;
    }

    info('开始扫描现有目录结构...\n');

    // 定义迁移规则
    const migrations = [
        // fabric: 1.21/-/core/tutorials -> 1.21/core/-/tutorials
        { from: 'fabric/1.21/-/core/tutorials', to: 'fabric/1.21/core/-/tutorials' },
        { from: 'fabric/1.21/-/core/analysis', to: 'fabric/1.21/core/-/analysis' },

        // neoforge: 1.21/-/core/tutorials -> 1.21/core/-/tutorials
        { from: 'neoforge/1.21/-/core/tutorials', to: 'neoforge/1.21/core/-/tutorials' },
        { from: 'neoforge/1.21/-/core/analysis', to: 'neoforge/1.21/core/-/analysis' },

        // forge: 1.21/-/core/tutorials -> 1.21/core/-/tutorials
        { from: 'forge/1.21/-/core/tutorials', to: 'forge/1.21/core/-/tutorials' },
        { from: 'forge/1.21/-/core/analysis', to: 'forge/1.21/core/-/analysis' },

        // sodium: 移除重复的 analysis/analysis 和 tutorials/tutorials
        { from: 'sodium/1.21/neoforge/0.8.6/analysis/analysis', to: 'sodium/1.21/neoforge/0.8.6/analysis' },
        { from: 'sodium/1.21/neoforge/0.8.6/tutorials/tutorials', to: 'sodium/1.21/neoforge/0.8.6/tutorials' },
        { from: 'sodium/1.21/fabric/0.8.6/analysis/analysis', to: 'sodium/1.21/fabric/0.8.6/analysis' },
        { from: 'sodium/1.21/fabric/0.8.6/tutorials/tutorials', to: 'sodium/1.21/fabric/0.8.6/tutorials' },

        // sodium 带 neoforge 加载器的版本
        { from: 'sodium/1.21/neoforge/0.8.6/tutorials/Part-1', to: 'sodium/1.21/neoforge/0.8.6/tutorials/Part-1' },
    ];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 第一步：执行迁移
    for (const m of migrations) {
        const fromPath = path.join(CONTENT_DIR, m.from);
        const toPath = path.join(CONTENT_DIR, m.to);

        if (!fs.existsSync(fromPath)) {
            warn(`跳过（源不存在）: ${m.from}`);
            skipCount++;
            continue;
        }

        // 如果目标已存在，检查内容是否相同
        if (fs.existsSync(toPath)) {
            // 目标存在，检查是否需要合并或跳过
            const fromFiles = countFiles(fromPath);
            const toFiles = countFiles(toPath);
            if (fromFiles === toFiles && fromFiles > 0) {
                warn(`跳过（目标已存在且内容相同）: ${m.to}`);
                skipCount++;
                continue;
            }
            warn(`目标已存在，将被覆盖: ${m.to}`);
        }

        log(`迁移: ${m.from}`);
        log(`    -> ${m.to}`);

        // 使用复制+删除的方式
        if (copyDir(fromPath, toPath)) {
            log(`  [OK] 复制完成`);

            // 删除原目录
            if (removeDir(fromPath)) {
                log(`  [OK] 删除原目录`);
            }

            successCount++;
        } else {
            error(`  [FAIL] 复制失败`);
            errorCount++;
        }
    }

    // 第二步：清理空的父目录
    log('\n========================================');
    log('  清理空目录');
    log('========================================\n');

    // 清理迁移过程中产生的空目录
    const dirsToCheck = [
        'fabric/1.21/-/core',
        'fabric/1.21/-',
        'fabric/1.21',
        'neoforge/1.21/-/core',
        'neoforge/1.21/-',
        'neoforge/1.21',
        'forge/1.21/-/core',
        'forge/1.21/-',
        'forge/1.21',
    ];

    for (const dir of dirsToCheck) {
        const fullPath = path.join(CONTENT_DIR, dir);
        if (fs.existsSync(fullPath) && isEmptyDir(fullPath)) {
            if (removeDir(fullPath)) {
                log(`删除空目录: ${dir}`);
            }
        }
    }

    // 第三步：清理根目录下的残留文件
    log('\n========================================');
    log('  清理残留文件');
    log('========================================\n');

    if (fs.existsSync(CONTENT_DIR)) {
        const rootItems = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
        for (const item of rootItems) {
            const itemPath = path.join(CONTENT_DIR, item.name);

            // 删除残留的 README.md, SUMMARY.md
            if (item.isFile() && (item.name === 'README.md' || item.name === 'SUMMARY.md')) {
                log(`删除残留文件: ${item.name}`);
                fs.unlinkSync(itemPath);
            }

            // 清理旧的混乱目录（如直接在模组下的 tutorials/analysis 而没有版本层级）
            if (item.isDirectory()) {
                const subPath = path.join(itemPath);
                const oldTutorials = path.join(subPath, 'tutorials');
                const oldAnalysis = path.join(subPath, 'analysis');

                // 检查是否是旧的根 tutorials/analysis 目录（没有正确版本结构）
                if (item.name !== 'mc' && fs.existsSync(oldTutorials)) {
                    const hasCorrectStructure = fs.readdirSync(subPath, { withFileTypes: true })
                        .some(e => e.isDirectory() && /^\d+\.\d+/.test(e.name));
                    if (!hasCorrectStructure) {
                        warn(`发现可能的旧格式目录: ${item.name}/tutorials（无版本结构）`);
                    }
                }
            }
        }
    }

    // 最终检查：列出最终结构
    log('\n========================================');
    log('  最终目录结构');
    log('========================================\n');

    listStructure(CONTENT_DIR, '', 0);

    log('\n========================================');
    log(`  迁移完成`);
    log(`  成功: ${successCount}`);
    log(`  跳过: ${skipCount}`);
    log(`  失败: ${errorCount}`);
    log('========================================\n');
}

/**
 * 计算目录中的文件数量
 */
function countFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }
    return count;
}

/**
 * 列出目录结构
 */
function listStructure(dir, prefix, depth) {
    if (depth > 4) return;  // 限制深度

    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => !e.name.startsWith('.'));

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
        const childPrefix = prefix + (isLast ? '    ' : '│   ');

        if (entry.isDirectory()) {
            log(currentPrefix + entry.name + '/');
            listStructure(path.join(dir, entry.name), childPrefix, depth + 1);
        } else if (entry.name.endsWith('.md')) {
            log(currentPrefix + entry.name);
        }
    }
}

migrate();
