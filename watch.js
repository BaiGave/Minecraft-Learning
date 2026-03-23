/**
 * Watch & Auto-Build - Listens for file changes and rebuilds automatically
 * Usage: node watch.js
 *
 * Requires: chokidar  (npm install chokidar)
 *   or:   npm install  (from root directory)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const WEBSITE = __dirname;

const C_RESET = '\x1b[0m';
const C_GREEN = '\x1b[32m';
const C_YELLOW = '\x1b[33m';
const C_CYAN = '\x1b[36m';
const C_DIM = '\x1b[2m';
const C_BOLD = '\x1b[1m';

let building = false;
let pending = false;
let debounceTimer = null;

// ── Try to use chokidar if available ──────────────────────────────────────
let chokidar = null;
try {
    chokidar = require('chokidar');
} catch (_) { /* not installed */ }

const DEBOUNCE_MS = 600; // wait this long after last change before rebuilding

function log(msg) {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`  ${C_CYAN}[${now}]${C_RESET} ${msg}`);
}

function build(showHeader) {
    if (building) { pending = true; return; }
    building = true;

    if (showHeader !== false) {
        console.log('\n' + C_BOLD + '─'.repeat(50));
        console.log(`  ${C_YELLOW}⚡ Rebuilding...`);
        console.log('─'.repeat(50) + C_RESET);
    }

    try {
        // Step 1: Convert markdown articles (content/ → docs/)
        execSync('node build/convert.js', { cwd: WEBSITE, stdio: 'pipe', shell: true });
        console.log(`  ${C_GREEN}✓${C_RESET} build/convert.js`);

        // Step 2: Regenerate module index pages
        execSync('node scripts/converter.js index', { cwd: WEBSITE, stdio: 'pipe', shell: true });
        console.log(`  ${C_GREEN}✓${C_RESET} scripts/converter.js index`);

        // Step 3: Scan docs/ and regenerate site stats + sitemap
        execSync('node scan-docs.js', { cwd: WEBSITE, stdio: 'pipe', shell: true });
        console.log(`  ${C_GREEN}✓${C_RESET} scan-docs.js`);

        log(`${C_GREEN}✓ Build complete${C_RESET}`);
    } catch (e) {
        // error already printed by execSync
        log(`${C_YELLOW}⚠ Build had errors${C_RESET}`);
    }

    building = false;

    if (pending) {
        pending = false;
        build(false);
    }
}

function scheduleBuild() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => build(false), DEBOUNCE_MS);
}

// ── File-system polling fallback (no chokidar) ──────────────────────────────
const WATCH_PATHS = [
    path.join(WEBSITE, 'content'),   // 源 Markdown 文档
    path.join(WEBSITE, 'docs'),      // 输出 HTML
    path.join(WEBSITE, 'scripts'),  // 模板生成脚本
    path.join(WEBSITE, 'build'),    // 构建脚本
    path.join(WEBSITE, 'scan-docs.js'),
];

const FILE_MTIM = new Map();
let pollInterval = null;

function getFiles(dir, files) {
    files = files || [];
    try {
        fs.readdirSync(dir).forEach(name => {
            const fp = path.join(dir, name);
            try {
                const st = fs.statSync(fp);
                if (st.isDirectory()) {
                    getFiles(fp, files);
                } else if (/\.(js|md|html)$/i.test(name)) {
                    files.push(fp);
                }
            } catch (_) {}
        });
    } catch (_) {}
    return files;
}

function poll() {
    let changed = false;
    WATCH_PATHS.forEach(wp => {
        if (!fs.existsSync(wp)) return;
        const files = getFiles(wp);
        files.forEach(fp => {
            try {
                const m = fs.statSync(fp).mtimeMs;
                if (FILE_MTIM.get(fp) !== m) {
                    FILE_MTIM.set(fp, m);
                    changed = true;
                }
            } catch (_) {}
        });
    });
    if (changed) {
        scheduleBuild();
    }
}

// ── Banner ─────────────────────────────────────────────────────────────────
console.log(`
${C_BOLD}╔═══════════════════════════════════════════════╗
║   🔄 MC 开发文档 - 自动构建 (Watch Mode)         ║
╚═══════════════════════════════════════════════╝${C_RESET}

  监听目录：
    • content/      (源 Markdown 文档，改动即触发重建)
    • build/        (构建脚本)
    • scripts/      (模板生成脚本)
    • docs/         (输出 HTML)
    • scan-docs.js  (站点统计)

  按 ${C_YELLOW}Ctrl+C${C_RESET} 停止
${'─'.repeat(50)}
`);

// ── Start watching ─────────────────────────────────────────────────────────
if (chokidar) {
    // chokidar mode (recommended: npm install chokidar)
    const patterns = [
        path.join(WEBSITE, 'content', '**', '*.md'),
        path.join(WEBSITE, 'docs', '**', '*.html'),
        path.join(WEBSITE, 'scripts', '**', '*.js'),
        path.join(WEBSITE, 'build', '**', '*.js'),
        path.join(WEBSITE, 'scan-docs.js'),
    ];

    log(`${C_CYAN}Using chokidar (npm install chokidar for best performance)${C_RESET}`);

    const watcher = chokidar.watch(patterns, {
        ignoreInitial: true,
        persistent: true,
        usePolling: false,
    });

    watcher.on('all', (event, fp) => {
        log(`${C_YELLOW}${event}${C_RESET} ${path.relative(WEBSITE, fp)}`);
        scheduleBuild();
    });

    watcher.on('error', err => log(`${C_YELLOW}Watch error: ${err.message}${C_RESET}`));

} else {
    // Polling fallback (works without any extra dependencies)
    log(`${C_DIM}chokidar not found — using polling fallback${C_RESET}`);
    log(`${C_DIM}Run: npm install chokidar for faster file watching${C_RESET}\n`);

    // Init mtimes
    WATCH_PATHS.forEach(wp => {
        if (fs.existsSync(wp)) getFiles(wp).forEach(fp => {
            try { FILE_MTIM.set(fp, fs.statSync(fp).mtimeMs); } catch (_) {}
        });
    });

    pollInterval = setInterval(poll, 1200);
}

// Initial build
build(false);

// Graceful exit
process.on('SIGINT', () => {
    console.log(`\n${C_YELLOW}  Stopping watcher...${C_RESET}`);
    if (pollInterval) clearInterval(pollInterval);
    process.exit(0);
});
