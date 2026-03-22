/**
 * Markdown 内联链接的安全输出（防 javascript:/data: 注入，外链 noopener）
 */

function sanitizeUrl(url) {
    const t = String(url).trim();
    const l = t.toLowerCase();
    if (l.startsWith('javascript:') || l.startsWith('vbscript:')) return '#';
    if (l.startsWith('data:') && !l.startsWith('data:image/')) return '#';
    return t;
}

function escapeAttr(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

/**
 * @param {string} text 链接可见文字
 * @param {string} rawUrl  Markdown 中的 URL
 * @returns {string} HTML <a> 片段
 */
function markdownLinkToHtml(text, rawUrl) {
    const url = sanitizeUrl(rawUrl);
    const isHttp = /^https?:\/\//i.test(url);
    // 仅对站内相对/根路径 .md 做 .html 替换，避免误改外链
    const href =
        !isHttp && /\.md(#.*)?$/i.test(url)
            ? url.replace(/\.md(#.*)?$/i, (_, anchor) => '.html' + (anchor || ''))
            : url;
    const displayText = String(text).replace(/\.md$/i, '');
    const safeHref = escapeAttr(href);
    const safeText = escapeAttr(displayText);
    if (/^https?:\/\//i.test(href)) {
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
    }
    return `<a href="${safeHref}">${safeText}</a>`;
}

function markdownImageToHtml(alt, rawSrc) {
    const src = sanitizeUrl(rawSrc);
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" class="doc-image" loading="lazy">`;
}

module.exports = {
    sanitizeUrl,
    escapeAttr,
    markdownLinkToHtml,
    markdownImageToHtml
};
