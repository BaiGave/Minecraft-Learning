/**
 * Build Script - 增强的构建脚本
 *
 * Features:
 * - Full build
 * - Incremental build (only changed files)
 * - Watch mode (auto-rebuild on changes)
 * - Clean build
 *
 * Usage:
 *   node build.js           # Full build
 *   node build.js --watch   # Watch mode
 *   node build.js --clean  # Clean output
 *   node build.js --help   # Show help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    websiteDir: __dirname,
    outputDir: path.join(__dirname, 'docs'),
    contentDir: path.join(__dirname, '..', 'content'),
    blogDir: path.join(__dirname, '..'),
    blogPostsDir: path.join(__dirname, '..', 'posts'),
    hashFile: path.join(__dirname, '.build-hash.json'),
    debounceMs: 500
};

// ============================================================================
// Logger
// ============================================================================

const Logger = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',

    log(msg, color = 'white') {
        console.log(`${this[color]}${msg}${this.reset}`);
    },
    info(msg) { this.log(`ℹ  ${msg}`, 'blue'); },
    success(msg) { this.log(`✓  ${msg}`, 'green'); },
    warning(msg) { this.log(`⚠  ${msg}`, 'yellow'); },
    error(msg) { this.log(`✗  ${msg}`, 'red'); },
    header(msg) {
        console.log(`\n${this.cyan}${'='.repeat(50)}${this.reset}`);
        console.log(`${this.bright}${this.cyan}  ${msg}${this.reset}`);
        console.log(`${this.cyan}${'='.repeat(50)}${this.reset}\n`);
    }
};

// ============================================================================
// Build Hash (for incremental builds)
// ============================================================================

/**
 * Get file hash map
 */
function getHashMap() {
    try {
        if (fs.existsSync(CONFIG.hashFile)) {
            return JSON.parse(fs.readFileSync(CONFIG.hashFile, 'utf8'));
        }
    } catch (e) {
        // Ignore
    }
    return {};
}

/**
 * Save file hash map
 */
function saveHashMap(hashMap) {
    try {
        fs.writeFileSync(CONFIG.hashFile, JSON.stringify(hashMap, null, 2), 'utf8');
    } catch (e) {
        // Ignore
    }
}

/**
 * Calculate file hash (simple version)
 */
function getFileHash(filePath) {
    try {
        const stat = fs.statSync(filePath);
        const mtime = stat.mtime.getTime();
        return `${mtime}`;
    } catch (e) {
        return null;
    }
}

/**
 * Get all markdown files
 */
function getAllMarkdownFiles(dir, baseDir = dir) {
    const files = [];

    function scan(currentDir) {
        if (!fs.existsSync(currentDir)) return;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                scan(fullPath);
            } else if (entry.name.endsWith('.md')) {
                const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
                files.push({ fullPath, relativePath });
            }
        }
    }

    scan(dir);
    return files;
}

/**
 * Find changed files
 */
function findChangedFiles(dir, baseDir = dir) {
    const hashMap = getHashMap();
    const newHashMap = {};
    const changedFiles = [];

    const allFiles = getAllMarkdownFiles(dir, baseDir);

    for (const file of allFiles) {
        const hash = getFileHash(file.fullPath);
        newHashMap[file.relativePath] = hash;

        if (!hashMap[file.relativePath] || hashMap[file.relativePath] !== hash) {
            changedFiles.push(file);
        }
    }

    // Save new hash map
    saveHashMap(newHashMap);

    return changedFiles;
}

// ============================================================================
// Build Commands
// ============================================================================

/**
 * Run convert.js
 */
function runConverter(dir, label = 'Converter') {
    Logger.info(`${label}: Running converter...`);
    try {
        const result = execSync('node convert.js', {
            cwd: dir,
            encoding: 'utf8',
            stdio: 'pipe'
        });
        return { success: true, output: result };
    } catch (e) {
        return { success: false, output: e.stdout || e.message };
    }
}

/**
 * Full build
 */
function fullBuild() {
    Logger.header('Full Build');

    const startTime = Date.now();

    // 仓库根目录文章（Hugo/legacy）
    Logger.info('Building root posts site...');
    const blogResult = runConverter(CONFIG.blogDir, 'RootSite');
    if (blogResult.success) {
        Logger.success('Root posts site built successfully');
    } else {
        Logger.error('Root posts site build failed');
        console.log(blogResult.output);
    }

    // Build website
    Logger.info('Building website...');
    const websiteResult = runConverter(CONFIG.websiteDir, 'Website');
    if (websiteResult.success) {
        Logger.success('Website built successfully');
    } else {
        Logger.error('Website build failed');
        console.log(websiteResult.output);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    Logger.success(`Build completed in ${duration}s`);

    return blogResult.success && websiteResult.success;
}

/**
 * Incremental build
 */
function incrementalBuild() {
    Logger.header('Incremental Build');

    const startTime = Date.now();
    let totalChanged = 0;
    let totalProcessed = 0;

    // Check root posts
    const blogChanged = findChangedFiles(CONFIG.blogPostsDir, CONFIG.blogDir);
    if (blogChanged.length > 0) {
        Logger.info(`Root posts: ${blogChanged.length} changed file(s)`);
        const result = runConverter(CONFIG.blogDir, 'RootSite');
        if (result.success) {
            Logger.success(`Root posts: ${blogChanged.length} file(s) processed`);
            totalProcessed += blogChanged.length;
        }
    } else {
        Logger.info('Root posts: No changes');
    }

    // Check website content
    const websiteChanged = findChangedFiles(CONFIG.contentDir, CONFIG.contentDir);
    if (websiteChanged.length > 0) {
        Logger.info(`Website: ${websiteChanged.length} changed file(s)`);
        const result = runConverter(CONFIG.websiteDir, 'Website');
        if (result.success) {
            Logger.success(`Website: ${websiteChanged.length} file(s) processed`);
            totalProcessed += websiteChanged.length;
        }
    } else {
        Logger.info('Website: No changes');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (totalProcessed > 0) {
        Logger.success(`Incremental build completed: ${totalProcessed} file(s) in ${duration}s`);
    } else {
        Logger.success('No files to rebuild');
    }

    return totalProcessed > 0;
}

/**
 * Clean build
 */
function cleanBuild() {
    Logger.header('Clean Build');

    // Remove hash file
    if (fs.existsSync(CONFIG.hashFile)) {
        fs.unlinkSync(CONFIG.hashFile);
        Logger.success('Removed build cache');
    }

    // Remove output directories
    const dirsToClean = [
        CONFIG.outputDir,
        path.join(CONFIG.blogDir, 'index.html'),
        path.join(CONFIG.blogDir, 'tech-blog.html'),
        path.join(CONFIG.blogDir, 'article.html'),
        path.join(CONFIG.blogDir, 'sitemap.xml'),
        path.join(CONFIG.blogDir, 'robots.txt')
    ];

    let removed = 0;
    for (const dir of dirsToClean) {
        if (fs.existsSync(dir)) {
            if (fs.statSync(dir).isDirectory()) {
                fs.rmSync(dir, { recursive: true });
            } else {
                fs.unlinkSync(dir);
            }
            removed++;
        }
    }

    Logger.success(`Cleaned ${removed} item(s)`);

    // Run full build
    return fullBuild();
}

/**
 * Watch mode
 */
function watchMode() {
    Logger.header('Watch Mode');
    Logger.info('Watching for changes...');
    Logger.info('Press Ctrl+C to stop\n');

    let buildTimeout = null;
    let lastBuild = 0;

    // Watch blog posts
    const blogWatcher = fs.watch(CONFIG.blogPostsDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.md')) {
            scheduleBuild('RootSite');
        }
    });

    // Watch website content
    const websiteWatcher = fs.watch(CONFIG.contentDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.md')) {
            scheduleBuild('Website');
        }
    });

    // Watch scripts
    const scriptsDir = path.join(CONFIG.websiteDir, 'scripts');
    if (fs.existsSync(scriptsDir)) {
        const scriptsWatcher = fs.watch(scriptsDir, (eventType, filename) => {
            if (filename && (filename.endsWith('.js') || filename.endsWith('.css'))) {
                scheduleBuild('Website');
            }
        });
    }

    function scheduleBuild(source) {
        // Debounce builds
        const now = Date.now();
        if (now - lastBuild < CONFIG.debounceMs) {
            clearTimeout(buildTimeout);
        }

        buildTimeout = setTimeout(() => {
            lastBuild = Date.now();
            Logger.info(`\n[${new Date().toLocaleTimeString()}] ${source} changed - rebuilding...`);

            if (source === 'RootSite') {
                const result = runConverter(CONFIG.blogDir, 'RootSite');
                if (result.success) {
                    Logger.success('Root posts site rebuilt');
                } else {
                    Logger.error('Root posts site rebuild failed');
                }
            } else {
                const result = runConverter(CONFIG.websiteDir, 'Website');
                if (result.success) {
                    Logger.success('Website rebuilt');
                } else {
                    Logger.error('Website rebuild failed');
                }
            }

            Logger.info('Watching for changes...');
        }, CONFIG.debounceMs);
    }

    // Handle exit
    process.on('SIGINT', () => {
        Logger.info('\nStopping watcher...');
        blogWatcher.close();
        websiteWatcher.close();
        process.exit(0);
    });
}

// ============================================================================
// Main
// ============================================================================

function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Build Script

Usage:
  node build.js [options]

Options:
  --full       Full build (default)
  --incremental  Incremental build (only changed files)
  --watch      Watch mode (auto-rebuild on changes)
  --clean      Clean and rebuild
  --help, -h   Show this help

Examples:
  node build.js            # Full build
  node build.js --watch    # Watch for changes
  node build.js --clean    # Clean and rebuild
`);
        return;
    }

    if (args.includes('--clean')) {
        cleanBuild();
    } else if (args.includes('--watch') || args.includes('-w')) {
        watchMode();
    } else if (args.includes('--incremental') || args.includes('-i')) {
        incrementalBuild();
    } else {
        fullBuild();
    }
}

main();
