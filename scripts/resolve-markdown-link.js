/**
 * resolve-markdown-link.js
 * ========================
 * 将 Markdown 中的链接 URL 转换为正确的 HTML href。
 * 适用于 content/xxx → docs/xxx 的转换规则。
 *
 * 支持的链接类型
 * -----------------
 * 1. 锚点链接       [跳到顶部](#top)              → href="#top"
 * 2. 外部链接       [GitHub](https://github.com)  → href="https://github.com" target="_blank"
 * 3. 相对路径       [下一章](02-iris-setup.md)    → href="02-iris-setup.html"
 * 4. 根路径绝对     /iris/tutorials/02            → href="02-iris.html"
 *                  /iris/analysis/06-uniforms    → href="../analysis/06-uniforms.html"
 *                  /iris/                        → href="../index.html/"
 *                  /docs/iris/index.html          → href="../index.html"
 * 5. ../ 系列      [返回](../)                   → href="../"
 *                  [跳到 analysis](../analysis/)  → href="../analysis/"
 *
 * 目录引用约定：URL 以 / 结尾 → 视为目录，href 末尾加 /
 * 新增模块只需在 convert.js 注册，其余逻辑完全通用。
 */

// ============================================================================
// 已知模块名（用于判断 /mc/1.21/ 是版本目录而非子目录）
// 未来新增模块只需在这里注册，其余逻辑自动适配
// ============================================================================
const KNOWN_MODULES = ['mc', 'iris', 'sodium'];

/** 教程 HTML 文件名：两位数字- slug，避免 .../04-foo/ 被当成目录导致 404 */
function isTutorialDocSlug(name) {
    return /^\d{2}-[a-z0-9.-]+$/i.test(name);
}

// ============================================================================
// 公开 API
// ============================================================================

/**
 * @typedef {Object} SourceFile
 * @property {string} module       - 'mc' | 'iris' | 'sodium' | ...
 * @property {string|null} version - '1.21' | null
 * @property {string} type         - 'tutorials' | 'analysis'
 * @property {string|null} part    - 'Part-1-Foundation' | null
 * @property {string} filename     - '01-shader-basics.md'
 */

/**
 * 将 URL 解析为 HTML href。
 */
function resolveMarkdownLink(rawUrl, source) {
    const url = rawUrl.trim();

    if (url.startsWith('#')) {
        return { href: url, isExternal: false, isAnchor: true };
    }

    if (/^https?:\/\//i.test(url)) {
        return { href: url, isExternal: true, isAnchor: false };
    }

    let fragment = '';
    let cleanUrl = url;
    const hashIdx = url.indexOf('#');
    if (hashIdx !== -1) {
        cleanUrl = url.slice(0, hashIdx);
        fragment = url.slice(hashIdx);
    }

    const resolved = resolveInternalUrl(cleanUrl, source);
    return { href: resolved + fragment, isExternal: false, isAnchor: false };
}

// ============================================================================
// 内部实现
// ============================================================================

function resolveInternalUrl(url, source) {
    const normalized = url.replace(/\.md$/i, '');
    if (normalized.startsWith('/')) {
        return resolveRootAbsoluteLink(normalized, source);
    }
    return resolveRelativeLink(normalized, source);
}

// --------------------------------------------------------------------------
// 根路径绝对链接（/xxx/yyy、/docs/xxx/yyy）
// --------------------------------------------------------------------------

/**
 * @typedef {Object} ParseResult
 * @property {string[]} segs     - 目标 docs/ 目录段（不含 docs 前缀）
 * @property {string}   file     - 目标文件名（不含扩展名时 buildRel 补 .html）
 * @property {boolean}  isDir    - 是否为目录引用（href 末尾加 /）
 * @property {string|null} dirName - 目录引用时，目录的名字（如 'analysis'），用于 href
 */

/**
 * 将根路径绝对 URL 解析为 {segs, file, isDir, dirName}。
 *
 * 核心：URL 以 / 结尾时，最后一段是目录名。
 * 例如 /iris/analysis/ → segs=[iris], dirName='analysis', isDir=true
 * /iris/ → segs=[], dirName='iris', isDir=true
 * /docs/mc/1.21/index.html → segs=[mc, 1.21], dirName=null, isDir=true
 */
function parseRootPath(normalized) {
    const hadTrailingSlash = normalized !== '' && normalized[normalized.length - 1] === '/';

    // 用 lastIndexOf('/') 分割：最后一个 '/' 之前是目录，之后是末尾段
    // '/iris/analysis/' → lastSlash=13, destDir='/iris/analysis', lastSeg=''
    // '/iris/analysis'   → lastSlash=13, destDir='/iris', lastSeg='analysis'
    // '/iris/'           → lastSlash=5,  destDir='/iris',   lastSeg=''
    const lastSlash = normalized.lastIndexOf('/');
    const destDir = lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
    const lastSeg = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
    const dirSegs = destDir.split('/').filter(Boolean);

    let segs = [];
    let file = '';
    let isDir = false;
    let dirName = null;

    if (lastSeg === '') {
        // /.../04-registry-system/ 实际是单篇教程页，不是子目录
        if (dirSegs.length > 0) {
            const slug = dirSegs[dirSegs.length - 1];
            if (isTutorialDocSlug(slug)) {
                let outSegs = dirSegs.slice(0, -1);
                if (outSegs.length > 0 && outSegs[0] === 'docs') {
                    outSegs = outSegs.slice(1);
                }
                return { segs: outSegs, file: slug, isDir: false, dirName: null };
            }
        }
        // URL 以 / 结尾 → 目录引用
        // lastSeg 为空，说明末尾是 /，lastSeg 之前是目录名
        isDir = true;
        if (dirSegs.length === 0) {
            // 根路径 / → 无目录（罕见）
            file = '';
        } else if (dirSegs.length === 1) {
            // /iris/ → 单段（模块名），指向模块根目录 → ../{模块名}/（错！）
            // 正确：segs=[模块名]，dirName='index.html' → buildRel → ../index.html/
            dirName = 'index.html';
            file = '';
            segs = dirSegs;
        } else if (dirSegs.length === 2 && /^\d+\.\d+/.test(dirSegs[1])) {
            // /mc/1.21/ → 第二段是版本号，指向版本 index.html
            dirName = 'index.html';
            file = '';
            segs = dirSegs;
        } else {
            // /iris/analysis/ → 子目录引用
            // dirSegs = ['iris', 'analysis']，弹出 'analysis' 作为 dirName
            dirName = dirSegs.pop();
            file = 'index.html';
            segs = dirSegs;
        }
    } else if (lastSeg.includes('.')) {
        // 含扩展名 → 已有文件名
        file = lastSeg;
        segs = dirSegs;
    } else {
        // 无扩展名 → 视为文件（补 .html）
        file = lastSeg;
        segs = dirSegs;
    }

    // 统一去掉 docs/ 前缀
    if (segs.length > 0 && segs[0] === 'docs') {
        segs = segs.slice(1);
    }

    return { segs, file, isDir, dirName };
}

function resolveRootAbsoluteLink(normalized, source) {
    const { segs, file, isDir, dirName } = parseRootPath(normalized);
    return buildRel(source, segs, file, isDir, dirName);
}

// --------------------------------------------------------------------------
// 相对路径链接（../xxx、./xxx、xxx）
// --------------------------------------------------------------------------

function resolveRelativeLink(normalized, source) {
    const hadTrailingSlash = normalized !== '' && normalized[normalized.length - 1] === '/';

    let remaining = normalized.startsWith('./') ? normalized.slice(2) : normalized;

    let upCount = 0;
    while (remaining.startsWith('../')) {
        upCount++;
        remaining = remaining.slice(3);
    }

    const segs = remaining.split('/').filter(Boolean);
    const lastSeg = segs.length > 0 ? segs[segs.length - 1] : '';
    const dirSegs = segs.length > 1 ? segs.slice(0, -1) : [];

    let isDir = false;
    let file = lastSeg;
    let dirName = null;

    if (hadTrailingSlash && lastSeg && isTutorialDocSlug(lastSeg.replace(/\.md$/i, ''))) {
        const base = lastSeg.replace(/\.md$/i, '');
        isDir = false;
        file = base.includes('.') ? base : `${base}.html`;
        dirName = null;
    } else if (remaining === '' || hadTrailingSlash) {
        // ../ 或 ../xxx/ → 目录引用
        isDir = true;
        if (lastSeg === '') {
            // 纯粹的 ../ → 向上走一级，取父目录的 index.html
            file = 'index.html';
        } else {
            // ../xxx/ → xxx 是子目录名
            dirName = dirSegs.length > 0 ? dirSegs.pop() : lastSeg;
            file = 'index.html';
        }
    } else if (!lastSeg.includes('.')) {
        file = lastSeg + '.html';
    }
    // 有扩展名 → file 保持原样

    // 源文件目录（不含 docs 前缀，不含文件名）
    const srcDir = getSourceDir(source); // [iris, tutorials]

    // 从源目录向上跳 upCount 步后的目录
    const baseSegs = srcDir.slice(0, Math.max(0, srcDir.length - upCount));

    // 目标 docs/ 段
    const destSegs = [...baseSegs, ...dirSegs];

    return buildRel(source, destSegs, file, isDir, dirName);
}

// --------------------------------------------------------------------------
// 核心：相对路径计算
// --------------------------------------------------------------------------

/**
 * 核心：最近公共祖先（LCA）
 *
 * 源文件：docs/iris/tutorials/01-shader-basics.html
 * srcDir = [iris, tutorials]（不含 docs 前缀，不含文件名）
 *
 * 例1：同目录文件
 *   destSegs=[iris, tutorials]，file=02, isDir=false
 *   lca=2, srcDirLen=2, up=2-2=0
 *   → rel='02.html'
 *
 * 例2：跨类型
 *   destSegs=[iris, analysis]，file=06-uniforms, isDir=false
 *   lca=1, srcDirLen=2, up=2-1=1
 *   → rel='../06-uniforms.html'
 *
 * 例3：/iris/analysis/（目录引用）
 *   destSegs=[iris]，file=index.html, isDir=true, dirName='analysis'
 *   lca=1, srcDirLen=2, up=2-1=1
 *   down=['analysis'] → rel='../analysis/'
 *
 * 例4：/iris/（模块根目录引用）
 *   destSegs=[], file=index.html, isDir=true, dirName='iris'
 *   lca=0, srcDirLen=2, up=2-0=2
 *   down=['iris'] → rel='../../iris/'
 */
function buildRel(source, destSegs, file, isDir, dirName) {
    const srcDir = getSourceDir(source);
    const srcDirLen = srcDir.length;

    // 计算 LCA（用不含 docs 前缀的段）
    let lca = 0;
    while (
        lca < srcDirLen &&
        lca < destSegs.length &&
        srcDir[lca] === destSegs[lca]
    ) { lca++; }

    // 从源文件位置向上走到 lca
    const upCount = Math.max(0, srcDirLen - lca);

    // 目录引用时，最终 href 段 = dirName（目录名）
    // 非目录引用时，最终 href 段 = file（文件名，自动补 .html）
    let finalSeg;
    if (isDir && dirName !== null) {
        // 目录引用：href 末尾段就是 dirName，不拼接 index.html
        // 例如 /iris/analysis/ → dirName='analysis' → href='../analysis/'
        finalSeg = dirName;
    } else if (!isDir && file && !file.includes('.')) {
        // 非目录 + 无扩展名 → 补 .html
        finalSeg = file + '.html';
    } else {
        finalSeg = file;
    }

    // lca 之后的目标段 + 最终段
    const downSegs = [...destSegs.slice(lca), finalSeg];

    const relParts = [...Array(upCount).fill('..'), ...downSegs];
    const base = relParts.join('/');

    return isDir ? base + '/' : base;
}

/**
 * 获取源文件在 docs/ 下的目录路径段数组（不含 docs 前缀，不含文件名）。
 */
function getSourceDir(source) {
    const parts = [];
    parts.push(source.module);
    if (source.version) parts.push(source.version);
    parts.push(source.type);
    if (source.part) parts.push(source.part);
    return parts; // e.g. [iris, tutorials] 或 [mc, 1.21, tutorials, Part-1]
}

module.exports = { resolveMarkdownLink };
