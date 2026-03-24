const fs = require('fs');
const path = require('path');

// Get all MD files and convert to relative paths from content/
const mdFiles = [];
function getFiles(dir, prefix = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            getFiles(path.join(dir, item.name), prefix + '/' + item.name);
        } else if (item.name.endsWith('.md')) {
            // Store relative path from content/
            const relPath = (prefix + '/' + item.name).replace(/^\//, '');
            mdFiles.push(relPath);
        }
    }
}
getFiles('content');

// Convert MD path (e.g., fabric/tutorials/part-1-basics/01-fabric-intro.md)
// to expected HTML path (e.g., fabric/tutorials/part-1-basics/01-fabric-intro.html)
function mdToHtml(mdPath) {
    // Remove .md extension
    let htmlPath = mdPath.replace(/\.md$/, '');
    
    // Special case: README.md -> root/README.html
    if (htmlPath.endsWith('/README') || htmlPath === 'README') {
        htmlPath = htmlPath.replace(/\/README$/, '/root/README').replace(/^README$/, 'root/README');
    }
    
    return htmlPath + '.html';
}

// Build set of expected HTML files (relative paths without docs/ prefix)
const expectedHtmlFiles = new Set(mdFiles.map(mdToHtml));

// Get all actual HTML files
const htmlFiles = [];
function getHtmlFiles(dir, prefix = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            getHtmlFiles(path.join(dir, item.name), prefix + '/' + item.name);
        } else if (item.name.endsWith('.html')) {
            // Store relative path from docs/
            const relPath = (prefix + '/' + item.name).replace(/^\//, '');
            htmlFiles.push(relPath);
        }
    }
}
getHtmlFiles('docs');

// Find orphaned HTML files (exist in docs/ but no corresponding MD in content/)
const orphaned = htmlFiles.filter(html => !expectedHtmlFiles.has(html));

console.log('=== ORPHANED HTML FILES (no corresponding MD source) ===\n');
console.log('Total MD files:', mdFiles.length);
console.log('Total HTML files:', htmlFiles.length);
console.log('Expected HTML files:', expectedHtmlFiles.size);
console.log('Orphaned HTML files:', orphaned.length);
console.log('\n--- Orphaned Files ---');
orphaned.forEach(f => console.log(f));

// Also check for expected but missing
console.log('\n--- Expected but Missing HTML files ---');
const missing = [];
expectedHtmlFiles.forEach(expected => {
    if (!fs.existsSync(path.join('docs', expected))) {
        missing.push(expected);
    }
});
console.log('Missing HTML files:', missing.length);
missing.forEach(f => console.log(f));
