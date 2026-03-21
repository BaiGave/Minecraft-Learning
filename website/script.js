/**
 * Website JavaScript - 教程站交互脚本
 *
 * Features:
 * - Mobile menu toggle
 * - Smooth scroll
 * - Navigation dropdown
 * - Scroll animations
 * - Progress bar
 * - Keyboard shortcuts
 * - Search functionality
 *
 * @module Website
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
 * Initialize mobile menu close on outside click
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
// Navigation Dropdown - 导航下拉菜单
// ============================================================================

/**
 * Render navigation dropdown with module data
 */
function renderNavigationDropdown() {
    const dropdown = document.getElementById('navDropdown');
    if (!dropdown) return;

    // Default module data (fallback if no global moduleData)
    const defaultModuleData = {
        mc: { name: 'Minecraft 原版', docsDir: 'docs/mc', defaultVersion: '1.21', versions: ['1.21'] },
        iris: { name: 'Iris 光影', docsDir: 'docs/iris', versions: null },
        sodium: { name: 'Sodium 优化', docsDir: 'docs/sodium', versions: null },
        fabric: { name: 'Fabric 模组', docsDir: 'docs/fabric', versions: null },
        lithium: { name: 'Lithium 优化', docsDir: 'docs/lithium', versions: null }
    };

    // Use global moduleData if available, otherwise use default
    const moduleData = typeof window.moduleData !== 'undefined' ? window.moduleData : defaultModuleData;

    const links = Object.entries(moduleData).map(([key, mod]) => {
        let href;
        if (mod.versions && mod.versions.length > 0) {
            const defaultVersion = mod.defaultVersion || Object.keys(mod.versions)[0] || '1.21';
            href = `${mod.docsDir}/${defaultVersion}/index.html`;
        } else {
            href = `${mod.docsDir}/index.html`;
        }
        return `<a href="${href}">${mod.name}</a>`;
    }).join('');

    dropdown.innerHTML = links || '<a href="#">暂无文档</a>';
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
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // Observe cards and sections
    const selectors = [
        '.system-card',
        '.tip-card',
        '.path-item',
        '.catalog-part',
        '.roadmap-card',
        '.module-card',
        '.doc-card'
    ];

    selectors.forEach(selector => {
        $$(selector).forEach(el => observer.observe(el));
    });
}

// ============================================================================
// Progress Bar - 阅读进度条
// ============================================================================

/**
 * Initialize reading progress bar
 */
function initProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;

    const updateProgress = throttle(() => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
        progressBar.style.width = scrolled + '%';
    }, 50);

    window.addEventListener('scroll', updateProgress);
}

// ============================================================================
// Navbar Scroll Effect - 导航栏滚动效果
// ============================================================================

/**
 * Initialize navbar shadow on scroll
 */
function initNavbarScrollEffect() {
    const navbar = $('.navbar');
    if (!navbar) return;

    const handleScroll = throttle(() => {
        if (window.scrollY > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
    }, 100);

    window.addEventListener('scroll', handleScroll);
}

// ============================================================================
// Search - 搜索功能
// ============================================================================

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = $('#searchInput');
    if (!searchInput) return;

    const handleSearch = debounce((e) => {
        const query = e.target.value.toLowerCase();
        const catalogParts = $$('.catalog-part');

        catalogParts.forEach(part => {
            const text = part.textContent.toLowerCase();
            part.style.display = text.includes(query) ? 'block' : 'none';
        });
    }, 300);

    searchInput.addEventListener('input', handleSearch);
}

// ============================================================================
// Code Copy - 代码复制
// ============================================================================

/**
 * Copy code from code blocks
 * @param {HTMLElement} button - Copy button element
 */
async function copyCode(button) {
    const codeBlock = button.closest('.code-reference')?.querySelector('code') ||
                      button.parentElement.nextElementSibling?.querySelector('code');

    if (!codeBlock) {
        Toast.error('代码块未找到');
        return;
    }

    const success = await copyToClipboard(codeBlock.textContent);

    if (success) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> 已复制';
        Toast.success('代码已复制到剪贴板');

        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    } else {
        Toast.error('复制失败');
    }
}

/**
 * Initialize copy buttons for code blocks
 */
function initCodeCopy() {
    const codeBlocks = $$('.code-reference');
    codeBlocks.forEach(block => {
        const copyBtn = block.querySelector('.code-reference-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => copyCode(copyBtn));
        }
    });

    // Also handle regular pre > code blocks
    $$('pre code').forEach(code => {
        const pre = code.parentElement;
        if (pre.tagName === 'PRE' && !pre.closest('.code-reference')) {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                background: rgba(255,255,255,0.9);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.2s;
            `;

            pre.addEventListener('mouseenter', () => {
                copyBtn.style.opacity = '1';
            });
            pre.addEventListener('mouseleave', () => {
                copyBtn.style.opacity = '0';
            });

            copyBtn.addEventListener('click', () => copyCode(copyBtn));
            wrapper.appendChild(copyBtn);
        }
    });
}

// ============================================================================
// Keyboard Shortcuts - 键盘快捷键
// ============================================================================

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // '/' key for quick search (if not in input)
        if (e.key === '/' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const searchInput = $('#searchInput');
            searchInput?.focus();
        }

        // 'Escape' to close modals
        if (e.key === 'Escape') {
            $$('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            // Close mobile menu
            const navLinks = $('.nav-links');
            if (navLinks) {
                navLinks.classList.remove('active');
            }
        }

        // 'Alt + Arrow' for tutorial navigation (handled in tutorial.js)
    });
}

// ============================================================================
// TOC Highlighting - 目录高亮
// ============================================================================

/**
 * Initialize table of contents highlighting
 */
function initTocHighlighting() {
    const tocLinks = $$('.sidebar-toc a');
    const sections = $$('.tutorial-content h2, .tutorial-content h3');

    if (tocLinks.length === 0 || sections.length === 0) return;

    const handleScroll = throttle(() => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }, 100);

    window.addEventListener('scroll', handleScroll);
}

// ============================================================================
// Smooth Scroll to TOC - 目录锚点滚动
// ============================================================================

/**
 * Initialize smooth scroll for TOC links
 */
function initTocScroll() {
    $$('.sidebar-toc a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 100;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================================================
// Sidebar Toggle (Mobile) - 侧边栏切换
// ============================================================================

/**
 * Initialize sidebar toggle button for mobile
 */
function initSidebarToggle() {
    const toggleBtn = $('.sidebar-toggle');
    const sidebar = $('.docs-sidebar');

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// ============================================================================
// TOC Toggle (Mobile) - 目录切换
// ============================================================================

/**
 * Initialize TOC toggle button for mobile
 */
function initTocToggle() {
    const tocToggle = $('.toc-toggle');
    const tocSidebar = $('.tutorial-sidebar');

    if (!tocToggle || !tocSidebar) return;

    tocToggle.addEventListener('click', () => {
        tocSidebar.classList.toggle('active');
    });
}

// ============================================================================
// Module Card Interaction - 模组卡片交互
// ============================================================================

/**
 * Initialize module card hover effects with mouse tracking
 */
function initModuleCardEffects() {
    const cards = $$('.module-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
            card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
        });
    });
}

// ============================================================================
// Version Selection - 版本选择
// ============================================================================

/**
 * Initialize version selection functionality
 */
function initVersionSelection() {
    const versionCards = $$('.version-card');

    versionCards.forEach(card => {
        card.addEventListener('click', () => {
            const href = card.dataset.href;
            if (href) {
                window.location.href = href;
            }
        });
    });
}

// ============================================================================
// Doc Type Tabs - 文档类型标签切换
// ============================================================================

/**
 * Initialize doc type tab switching
 */
function initDocTypeTabs() {
    const tabBtns = $$('.tab-btn');
    const docCards = $$('.doc-card');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;

            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            docCards.forEach(card => {
                const cardType = card.dataset.type;
                if (type === 'all' || cardType === type) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ============================================================================
// Initialize - 初始化
// ============================================================================

/**
 * Main initialization function
 */
function init() {
    try {
        // Core functionality
        renderNavigationDropdown();
        initMobileMenuClose();
        initSmoothScroll();
        initScrollAnimations();
        initProgressBar();
        initNavbarScrollEffect();
        initSearch();
        initCodeCopy();
        initKeyboardShortcuts();

        // TOC functionality (tutorial pages)
        initTocHighlighting();
        initTocScroll();

        // Mobile toggles
        initSidebarToggle();
        initTocToggle();

        // Card effects
        initModuleCardEffects();

        // Version selection
        initVersionSelection();

        // Doc type tabs
        initDocTypeTabs();

        // Log success in debug mode
        if (window.location.search.includes('debug')) {
            console.log('Website JS initialized successfully');
        }
    } catch (error) {
        console.error('Website JS initialization failed:', error);
    }
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleMobileMenu,
        copyCode,
        Toast
    };
}
