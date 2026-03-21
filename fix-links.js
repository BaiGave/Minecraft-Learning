/**
 * 链接修复脚本
 * 自动扫描 website 目录下所有 HTML 文件，将 .md 链接替换为 .html
 * 同时验证链接是否有效
 * 
 * 使用方法：node fix-links.js
 */

const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname, 'website');

// 统计信息
const stats = {
    filesScanned: 0,
    filesModified: 0,
    linksFixed: 0,
    brokenLinks: [],
    skippedExternal: 0
};

// 递归扫描目录
function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // 跳过 node_modules 等目录
            if (!['node_modules', '.git', 'scripts'].includes(item)) {
                scanDirectory(fullPath);
            }
        } else if (item.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    });
}

// 处理单个 HTML 文件
function processHtmlFile(filePath) {
    stats.filesScanned++;
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    
    // 匹配 Markdown 链接并替换为 HTML
    // 匹配规则：href="xxx.md" 或 href="./xxx.md" 或 href="../xxx.md"
    const mdLinkRegex = /(href=["'])([^"']*\.md)(["'])/gi;
    
    content = content.replace(mdLinkRegex, (match, prefix, link, suffix) => {
        // 检查是否是外部链接
        if (link.startsWith('http://') || link.startsWith('https://')) {
            stats.skippedExternal++;
            return match;
        }
        
        // 替换 .md 为 .html
        const newLink = link.replace(/\.md$/i, '.html');
        stats.linksFixed++;
        
        console.log(`  [修复] ${filePath.replace(WEBSITE_DIR, '')}: ${link} -> ${newLink}`);
        return `${prefix}${newLink}${suffix}`;
    });
    
    // 检查是否有指向不存在文件的链接
    const htmlLinkRegex = /href=["']([^"']+\.html)["']/gi;
    let match;
    while ((match = htmlLinkRegex.exec(content)) !== null) {
        const link = match[1];
        
        // 跳过外部链接和锚点
        if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) {
            continue;
        }
        
        // 解析相对路径
        const linkPath = path.resolve(path.dirname(filePath), link.split('#')[0]);
        
        // 检查文件是否存在
        if (!fs.existsSync(linkPath)) {
            const relativePath = path.relative(WEBSITE_DIR, linkPath);
            stats.brokenLinks.push({
                file: filePath.replace(WEBSITE_DIR, ''),
                link: link,
                target: relativePath
            });
        }
    }
    
    // 如果内容有变化，写回文件
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        stats.filesModified++;
    }
}

// 打印报告
function printReport() {
    console.log('\n' + '='.repeat(50));
    console.log('链接修复报告');
    console.log('='.repeat(50));
    console.log(`扫描文件数: ${stats.filesScanned}`);
    console.log(`修改文件数: ${stats.filesModified}`);
    console.log(`修复链接数: ${stats.linksFixed}`);
    console.log(`跳过外部链接: ${stats.skippedExternal}`);
    
    if (stats.brokenLinks.length > 0) {
        console.log('\n警告: 发现 ${stats.brokenLinks.length} 个可能失效的链接:');
        stats.brokenLinks.forEach(item => {
            console.log(`  - ${item.file}: ${item.link} (目标不存在: ${item.target})`);
        });
    } else {
        console.log('\n✓ 未发现失效链接');
    }
    
    console.log('='.repeat(50));
}

// 主函数
function main() {
    console.log('开始扫描并修复 HTML 链接...\n');
    
    if (!fs.existsSync(WEBSITE_DIR)) {
        console.error(`错误: ${WEBSITE_DIR} 目录不存在`);
        process.exit(1);
    }
    
    scanDirectory(WEBSITE_DIR);
    printReport();
    
    if (stats.brokenLinks.length > 0) {
        process.exit(1);
    }
}

main();
