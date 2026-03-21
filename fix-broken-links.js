/**
 * 修复损坏的链接
 * 替换不存在的目录名称为实际存在的目录
 */

const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname, 'website');

// 目录名称映射：不存在的 -> 实际存在的
const pathMappings = {
    'Part-12-Project': 'Part-12-Practice',
    'Part-13-Extra': 'Part-13-Additional',
    'Part-5-Event': 'Part-5-AI',
    'Part-5-Event/32-event-system.html': 'Part-5-AI/32-pathfinding.html'
};

// 递归扫描
function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (item.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    });
}

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let originalContent = content;
    
    // 替换损坏的链接
    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
        const regex = new RegExp(oldPath.replace(/[-\/\\]/g, '[/\\\\]'), 'g');
        if (regex.test(content)) {
            content = content.replace(regex, newPath);
            modified = true;
            console.log(`  [修复] ${filePath.replace(WEBSITE_DIR, '')}: ${oldPath} -> ${newPath}`);
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}

console.log('开始修复损坏的链接...\n');
scanDirectory(WEBSITE_DIR);
console.log('\n完成！');
