/**
 * 线上站点根 URL（与 GitHub Pages 路径一致：用户名.github.io/仓库名）
 * 自定义域名或 fork 后请设置环境变量 PUBLISH_SITE_URL，例如：
 *   PUBLISH_SITE_URL=https://example.com  npm run build:website
 */
const raw = process.env.PUBLISH_SITE_URL || 'https://baigave.github.io/Minecraft-Learning';
const PUBLISH_SITE_URL = raw.replace(/\/$/, '');

module.exports = { PUBLISH_SITE_URL };
