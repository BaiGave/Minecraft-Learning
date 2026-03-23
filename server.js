/**
 * 本地开发服务器
 * 运行: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3456;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let filePath = path.join(ROOT, decodeURIComponent(parsedUrl.pathname));
    
    // 安全检查：防止路径遍历
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // 尝试 index.html
            filePath = path.join(filePath, 'index.html');
            fs.stat(filePath, (err2, stats2) => {
                if (err2 || !stats2) {
                    res.writeHead(404);
                    res.end('Not Found: ' + parsedUrl.pathname);
                    return;
                }
                serveFile(filePath, res);
            });
            return;
        }
        serveFile(filePath, res);
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('Server Error');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   🌐 MC Learning - 本地开发服务器            ║
╚═══════════════════════════════════════════════╝

服务器已启动: http://localhost:${PORT}

按 Ctrl+C 停止服务器
`);
});
