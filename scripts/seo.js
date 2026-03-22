/**
 * SEO Utilities - SEO 工具
 *
 * Provides functions for:
 * - Sitemap generation
 * - Meta tag generation
 * - Open Graph tags
 * - Structured data (JSON-LD)
 *
 * @module SEO
 */

const fs = require('fs');
const path = require('path');
const { PUBLISH_SITE_URL } = require('./publish-config');

// ============================================================================
// Configuration
// ============================================================================

const SEO_CONFIG = {
    siteUrl: PUBLISH_SITE_URL,
    siteName: 'Minecraft Learning',
    siteDescription: '个人技术博客与 Minecraft 1.21 源码教程网站，包含 MC/Iris/Sodium 源码分析',
    siteLocale: 'zh_CN',
    author: 'baigave',
    twitter: '@baigave',

    // 与 scripts/seo.js 一致：站点地图在仓库根目录
    sitemapPath: path.join(__dirname, '..', '..', 'sitemap.xml'),
    robotsPath: path.join(__dirname, '..', '..', 'robots.txt')
};

// ============================================================================
// Sitemap Generator
// ============================================================================

/**
 * Generate sitemap XML
 * @param {Array} pages - Array of page objects { url, lastmod, changefreq, priority }
 * @returns {string} Sitemap XML
 */
function generateSitemap(pages) {
    const urls = pages.map(page => {
        const lastmod = page.lastmod || new Date().toISOString().split('T')[0];
        const changefreq = page.changefreq || 'weekly';
        const priority = page.priority || '0.5';

        return `  <url>
    <loc>${SEO_CONFIG.siteUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Generate sitemap from content directory
 * @param {Object} options - Options
 * @returns {string} Sitemap XML
 */
function generateSitemapFromContent(options = {}) {
    const {
        baseDir = path.join(__dirname, '..', 'content'),
        outputPath = SEO_CONFIG.sitemapPath,
        verbose = false
    } = options;

    const pages = [];

    // Static pages
    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/index.html', priority: '0.9', changefreq: 'weekly' },
        { url: '/catalog.html', priority: '0.8', changefreq: 'weekly' },
        { url: '/roadmap.html', priority: '0.7', changefreq: 'weekly' },
        { url: '/about.html', priority: '0.6', changefreq: 'monthly' }
    ];

    pages.push(...staticPages);

    // Module pages
    const modulePages = [
        { url: '/docs/mc/1.21/index.html', priority: '0.8', changefreq: 'weekly' },
        { url: '/docs/iris/index.html', priority: '0.8', changefreq: 'weekly' },
        { url: '/docs/sodium/index.html', priority: '0.8', changefreq: 'weekly' }
    ];

    pages.push(...modulePages);

    // MC 各版本索引（modulePages 已含当前默认版本入口时可在此追加其他版本）
    const mcVersions = [];
    mcVersions.forEach(version => {
        pages.push({
            url: `/docs/mc/${version}/index.html`,
            priority: '0.7',
            changefreq: 'weekly'
        });
    });

    // Scan content directory for MD files
    try {
        const scanDir = (dir, prefix = '') => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    scanDir(fullPath, prefix);
                } else if (entry.name.endsWith('.md')) {
                    // Convert to URL
                    let url = fullPath
                        .replace(baseDir, '')
                        .replace(/\\/g, '/')
                        .replace(/\.md$/, '.html')
                        .replace(/^\//, '');

                    // Handle module/version structure
                    if (url.startsWith('/mc/')) {
                        url = `/docs${url}`;
                    } else if (url.startsWith('/iris/')) {
                        url = `/docs${url}`;
                    } else if (url.startsWith('/sodium/')) {
                        url = `/docs${url}`;
                    } else {
                        url = `/docs/${url}`;
                    }

                    pages.push({
                        url,
                        priority: url.includes('/tutorials/') ? '0.6' : '0.5',
                        changefreq: 'monthly'
                    });
                }
            }
        };

        if (fs.existsSync(baseDir)) {
            scanDir(baseDir);
        }
    } catch (e) {
        if (verbose) {
            console.warn('Failed to scan content directory:', e.message);
        }
    }

    // Generate and save sitemap
    const sitemap = generateSitemap(pages);

    if (outputPath) {
        fs.writeFileSync(outputPath, sitemap, 'utf8');
    }

    return sitemap;
}

// ============================================================================
// Meta Tags Generator
// ============================================================================

/**
 * Generate HTML meta tags
 * @param {Object} options - Page options
 * @returns {string} HTML meta tags
 */
function generateMetaTags(options = {}) {
    const {
        title = SEO_CONFIG.siteName,
        description = SEO_CONFIG.siteDescription,
        url = '',
        image = `${SEO_CONFIG.siteUrl}/og-image.png`,
        type = 'website',
        author = SEO_CONFIG.author,
        publishedTime = null,
        modifiedTime = null,
        tags = []
    } = options;

    const fullUrl = url ? `${SEO_CONFIG.siteUrl}${url}` : SEO_CONFIG.siteUrl;
    const fullTitle = title === SEO_CONFIG.siteName ? title : `${title} | ${SEO_CONFIG.siteName}`;

    const metaTags = `
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="title" content="${escapeHtml(fullTitle)}">
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="author" content="${escapeHtml(author)}">
    <meta name="keywords" content="${escapeHtml(tags.join(', ') || 'Minecraft, 源码, 教程, Java, 技术博客')}">
    <link rel="canonical" href="${escapeHtml(fullUrl)}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${escapeHtml(fullUrl)}">
    <meta property="og:title" content="${escapeHtml(fullTitle)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:site_name" content="${escapeHtml(SEO_CONFIG.siteName)}">
    <meta property="og:locale" content="${SEO_CONFIG.siteLocale}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${SEO_CONFIG.twitter}">
    <meta name="twitter:url" content="${escapeHtml(fullUrl)}">
    <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">

    <!-- Article specific -->
    ${type === 'article' ? `
    <meta property="article:published_time" content="${publishedTime || new Date().toISOString()}">
    <meta property="article:modified_time" content="${modifiedTime || new Date().toISOString()}">
    <meta property="article:author" content="${escapeHtml(author)}">
    ${tags.map(tag => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n    ')}
    ` : ''}
`.trim();

    return metaTags;
}

// ============================================================================
// JSON-LD Structured Data
// ============================================================================

/**
 * Generate JSON-LD structured data
 * @param {Object} options - Schema options
 * @returns {string} JSON-LD script tag
 */
function generateJsonLd(options = {}) {
    const {
        type = 'WebSite',
        title = SEO_CONFIG.siteName,
        description = SEO_CONFIG.siteDescription,
        url = '',
        author = SEO_CONFIG.author
    } = options;

    const fullUrl = url ? `${SEO_CONFIG.siteUrl}${url}` : SEO_CONFIG.siteUrl;

    let schema;

    if (type === 'WebSite') {
        schema = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: title,
            url: SEO_CONFIG.siteUrl,
            description: description,
            author: {
                '@type': 'Person',
                name: author,
                url: SEO_CONFIG.siteUrl
            }
        };
    } else if (type === 'Article') {
        schema = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description: description,
            url: fullUrl,
            author: {
                '@type': 'Person',
                name: author
            },
            publisher: {
                '@type': 'Organization',
                name: SEO_CONFIG.siteName,
                logo: {
                    '@type': 'ImageObject',
                    url: `${SEO_CONFIG.siteUrl}/logo.png`
                }
            },
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString()
        };
    } else if (type === 'BreadcrumbList') {
        schema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: options.items || []
        };
    }

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

// ============================================================================
// Robots.txt Generator
// ============================================================================

/**
 * Generate robots.txt
 * @param {Object} options - Options
 * @returns {string} robots.txt content
 */
function generateRobotsTxt(options = {}) {
    const {
        allow = ['/'],
        disallow = ['/api/', '/private/', '/admin/'],
        sitemapUrl = `${SEO_CONFIG.siteUrl}/sitemap.xml`,
        userAgent = '*'
    } = options;

    const lines = [
        '# https://www.robotstxt.org/robotstxt.html',
        `User-agent: ${userAgent}`,
        '',
        '# Allow rules',
        ...allow.map(path => `Allow: ${path}`),
        '',
        '# Disallow rules',
        ...disallow.map(path => `Disallow: ${path}`),
        '',
        `# Sitemap`,
        `Sitemap: ${sitemapUrl}`
    ];

    return lines.join('\n');
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    SEO_CONFIG,
    generateSitemap,
    generateSitemapFromContent,
    generateMetaTags,
    generateJsonLd,
    generateRobotsTxt,
    escapeHtml
};
