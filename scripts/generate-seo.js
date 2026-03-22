/**
 * 仅重新生成仓库根目录的 sitemap.xml 与 robots.txt（不跑全文转换）
 * 用法：node scripts/generate-seo.js
 */
const path = require('path');
const fs = require('fs');
const { generateSitemapFromContent, generateRobotsTxt } = require('./seo.js');

const ROOT = path.join(__dirname, '..');
const contentDir = path.join(ROOT, 'content');

generateSitemapFromContent({
    baseDir: contentDir,
    outputPath: path.join(ROOT, 'sitemap.xml'),
    verbose: true
});
fs.writeFileSync(path.join(ROOT, 'robots.txt'), generateRobotsTxt(), 'utf8');
console.log('OK: sitemap.xml + robots.txt（根目录）');
