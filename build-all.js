/**
 * Build All - Runs both markdown article conversion AND module index generation
 * Usage: node build-all.js
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WEBSITE = __dirname;

const C_SKIP = '\x1b[2m';
const C_RESET = '\x1b[0m';

function log(label, msg, color = '\x1b[36m') {
    console.log(`  ${color}[${label}]${C_RESET} ${msg}`);
}

function run(label, cmd, cwd) {
    console.log(`\n${'─'.repeat(50)}`);
    log('BUILD', label, '\x1b[1m\x1b[36m');
    console.log(`${'─'.repeat(50)}`);
    try {
        execSync(cmd, {
            cwd: cwd || WEBSITE,
            stdio: 'inherit',
            shell: true
        });
        log('OK', label + ' 完成', '\x1b[32m');
    } catch (e) {
        log('FAIL', label + ' 失败', '\x1b[31m');
        process.exit(1);
    }
}

console.log('\n' + '\x1b[1m' + '╔══════════════════════════════════════╗\x1b[0m');
console.log('\x1b[1m' + '║     MC 开发文档 - 全量构建            ║\x1b[0m');
console.log('\x1b[1m' + '╚══════════════════════════════════════╝\x1b[0m\n');

// Step 1: Convert markdown articles to HTML
run('步骤 1/2', 'node convert.js', WEBSITE);

// Step 2: Generate module index pages
run('步骤 2/2', 'node scripts/converter.js index', WEBSITE);

// Step 3: Generate site stats
run('步骤 3/3', 'node generate-stats.js', WEBSITE);

console.log('\n' + '\x1b[1m' + '╔══════════════════════════════════════╗\x1b[0m');
console.log('\x1b[1m' + '║     ✓ 全量构建完成！                 ║\x1b[0m');
console.log('\x1b[1m' + '╚══════════════════════════════════════╝\x1b[0m\n');
