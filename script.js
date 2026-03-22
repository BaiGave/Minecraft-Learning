/**
 * 根目录静态页脚本（Legacy 文章列表等）
 *
 * Features:
 * - Mobile menu toggle
 * - Smooth scroll
 * - Article search and filter
 * - Scroll animations
 * - Code copy functionality
 * - Back to top button
 *
 * @module Blog
 * @version 1.0.0
 */

// ============================================================================
// Utility Functions - 工具函数
// ============================================================================

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 250) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Safe querySelector with null check
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element
 * @returns {Element|null}
 */
function $(selector, parent = document) {
    try {
        return parent.querySelector(selector);
    } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
        return null;
    }
}

/**
 * Safe querySelectorAll with null check
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element
 * @returns {Element[]}
 */
function $$(selector, parent = document) {
    try {
        return Array.from(parent.querySelectorAll(selector));
    } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
        return [];
    }
}

/**
 * Check if element is in viewport
 * @param {Element} element - Target element
 * @returns {boolean}
 */
function isInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    } catch (e) {
        console.error('Failed to copy:', e);
        return false;
    }
}

// ============================================================================
// Toast Notification System - 轻提示系统
// ============================================================================

const Toast = {
    container: null,

    init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        document.body.appendChild(this.container);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .toast {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
            }
            .toast.success { border-left: 4px solid #10b981; }
            .toast.error { border-left: 4px solid #ef4444; }
            .toast.warning { border-left: 4px solid #f59e0b; }
            .toast.info { border-left: 4px solid #3b82f6; }
        `;
        document.head.appendChild(style);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}; font-size: 1.25rem;"></i>
            <span style="color: #374151; font-size: 0.95rem;">${message}</span>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// ============================================================================
// Mobile Menu - 移动端菜单
// ============================================================================

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
    const navLinks = $('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

/**
 * Close mobile menu when clicking outside
 */
function initMobileMenuClose() {
    document.addEventListener('click', (e) => {
        const nav = $('.navbar');
        const menuBtn = $('.mobile-menu-btn');
        const navLinks = $('.nav-links');

        if (navLinks && !navLinks.contains(e.target) && !menuBtn?.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// ============================================================================
// Smooth Scroll - 平滑滚动
// ============================================================================

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = $(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Close mobile menu if open
                const navLinks = $('.nav-links');
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
}

// ============================================================================
// Scroll Animations - 滚动动画
// ============================================================================

/**
 * Initialize scroll-triggered animations using Intersection Observer
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all article cards
    $$('.article-card').forEach(card => {
        observer.observe(card);
    });
}

// ============================================================================
// Article Filtering - 文章筛选
// ============================================================================

/**
 * Filter articles by category
 * @param {string} category - Category to filter by ('all' for all)
 */
function filterArticles(category) {
    const cards = $$('.article-card');
    const buttons = $$('.category-btn');

    // Update active button
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = $(`.category-btn[onclick*="'${category}'"]`) || $('.category-btn');
    if (activeBtn) activeBtn.classList.add('active');

    // Filter cards with animation
    cards.forEach((card, index) => {
        const cardCategory = card.dataset.category;
        const shouldShow = category === 'all' || cardCategory === category;

        if (shouldShow) {
            card.style.display = '';
            card.style.animationDelay = `${index * 0.1}s`;
            // Trigger reflow for animation
            void card.offsetWidth;
            card.classList.add('animate-in');
        } else {
            card.style.display = 'none';
        }
    });

    // Update empty state
    const visibleCards = cards.filter(c => c.style.display !== 'none');
    const emptyState = $('.empty-state');
    const grid = $('#articles-grid');

    if (emptyState && grid) {
        if (visibleCards.length === 0 && category !== 'all') {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }
}

// ============================================================================
// Article Search - 文章搜索
// ============================================================================

/**
 * Search articles by query
 * @param {string} query - Search query
 */
function searchArticles(query) {
    const cards = $$('.article-card');
    const searchLower = query.toLowerCase().trim();

    if (!searchLower) {
        // Reset all cards
        cards.forEach(card => {
            card.style.display = '';
        });
        return;
    }

    cards.forEach(card => {
        const title = ($('h2', card)?.textContent || '').toLowerCase();
        const excerpt = ($('.article-card-excerpt', card)?.textContent || '').toLowerCase();
        const tags = ($('.tags', card)?.textContent || '').toLowerCase();
        const category = ($('.article-card-category', card)?.textContent || '').toLowerCase();

        const matches = title.includes(searchLower) ||
            excerpt.includes(searchLower) ||
            tags.includes(searchLower) ||
            category.includes(searchLower);

        card.style.display = matches ? '' : 'none';
    });
}

// ============================================================================
// Code Copy - 代码复制
// ============================================================================

/**
 * Copy code block content
 * @param {HTMLElement} button - Copy button element
 */
async function copyCode(button) {
    const preBlock = button.parentElement.nextElementSibling;
    if (!preBlock) return;

    const code = preBlock.textContent;
    const success = await copyToClipboard(code);

    if (success) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> 已复制';
        Toast.success('代码已复制到剪贴板');

        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    } else {
        Toast.error('复制失败，请手动复制');
    }
}

/**
 * Initialize copy buttons for code blocks
 */
function initCodeCopy() {
    const preBlocks = $$('pre');
    preBlocks.forEach(pre => {
        // Create wrapper for positioning
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Create copy button
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="fas fa-copy"></i> 复制';
        button.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            background: rgba(255,255,255,0.9);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s;
        `;

        // Show on hover
        pre.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        pre.addEventListener('mouseleave', () => {
            button.style.opacity = '0';
        });

        button.addEventListener('click', () => copyCode(button));
        wrapper.appendChild(button);
    });
}

// ============================================================================
// Back to Top - 返回顶部
// ============================================================================

/**
 * Create and initialize back to top button
 */
function initBackToTop() {
    const button = document.createElement('button');
    button.id = 'back-to-top';
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 48px;
        height: 48px;
        background: var(--primary-color, #4F46E5);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    // Add button styles
    const style = document.createElement('style');
    style.textContent = `
        #back-to-top:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        #back-to-top.visible {
            opacity: 1;
            visibility: visible;
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(button);

    // Scroll handler
    const handleScroll = throttle(() => {
        if (window.scrollY > 300) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    }, 100);

    window.addEventListener('scroll', handleScroll);

    // Click handler
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================================================
// Reading Progress - 阅读进度
// ============================================================================

/**
 * Initialize reading progress bar
 */
function initReadingProgress() {
    // Only on article pages
    if (!$('.article-content')) return;

    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--primary-color, #4F46E5), var(--secondary-color, #0EA5E9));
        width: 0%;
        z-index: 1001;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    const updateProgress = throttle(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = `${Math.min(100, progress)}%`;
    }, 50);

    window.addEventListener('scroll', updateProgress);
}

// ============================================================================
// Article Page - 文章页面
// ============================================================================

/**
 * Render article content on article.html
 */
function initArticlePage() {
    // Check if we're on the article page
    const container = $('#article-container');
    if (!container) return;

    // Get article ID from URL
    const params = new URLSearchParams(window.location.search);
    const articleId = parseInt(params.get('id')) || null;

    // Find article (assumes articles data is injected via script)
    if (typeof articles === 'undefined') {
        console.warn('Articles data not found');
        return;
    }

    const article = articles.find(a => a.id === articleId);

    if (article) {
        renderArticle(article, container);
        document.title = `${article.title} - 技术博客`;
    } else {
        container.innerHTML = `
            <div class="not-found">
                <i class="fas fa-file-circle-xmark" style="font-size: 4rem; color: var(--text-muted, #94A3B8); margin-bottom: 24px;"></i>
                <h2>文章未找到</h2>
                <p>您访问的文章不存在或已被删除</p>
                <a href="index.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: var(--primary-color, #4F46E5); color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    <i class="fas fa-home"></i> 返回首页
                </a>
            </div>
        `;
    }
}

/**
 * Render article to container
 * @param {Object} article - Article data
 * @param {HTMLElement} container - Container element
 */
function renderArticle(article, container) {
    const tagsHtml = Array.isArray(article.tags)
        ? article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
        : '';

    const iconClass = article.icon || 'fa-solid fa-file-lines';

    container.innerHTML = `
        <div class="article-header-simple">
            <div class="container-narrow">
                <a href="index.html" class="back-link">
                    <i class="fas fa-arrow-left"></i> 返回文章列表
                </a>
                <h1>${article.title}</h1>
                <div class="article-meta">
                    <span><i class="far fa-calendar"></i> ${article.date}</span>
                    <span><i class="far fa-clock"></i> ${article.readingTime} 分钟阅读</span>
                    <span><i class="far fa-folder"></i> ${article.categoryName}</span>
                </div>
                <div class="tags" style="margin-top: 16px;">${tagsHtml}</div>
            </div>
        </div>
        <div class="article-cover">
            <div class="article-cover-image" style="background: linear-gradient(135deg, var(--primary-color, #4F46E5), var(--secondary-color, #0EA5E9));">
                <i class="${iconClass}"></i>
            </div>
        </div>
        <article class="article-content">${article.content}</article>
        <div class="container-narrow">
            <div class="article-footer">
                <div class="article-tags">
                    <div class="article-tags-title"><i class="fas fa-tags"></i> 标签</div>
                    <div class="tags">${tagsHtml}</div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// Initialize - 初始化
// ============================================================================

/**
 * Main initialization function
 */
function init() {
    try {
        // Mobile menu
        initMobileMenuClose();

        // Smooth scroll
        initSmoothScroll();

        // Scroll animations
        initScrollAnimations();

        // Code copy
        initCodeCopy();

        // Back to top
        initBackToTop();

        // Reading progress
        initReadingProgress();

        // Article page
        initArticlePage();

        // Log success (only in verbose mode)
        if (window.location.search.includes('debug')) {
            console.log('Blog root script initialized');
        }
    } catch (error) {
        console.error('Root script initialization failed:', error);
    }
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleMobileMenu,
        filterArticles,
        searchArticles,
        copyCode,
        Toast
    };
}
