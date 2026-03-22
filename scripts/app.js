/**
 * MC 开发文档中心 - 前端 JavaScript 模块
 * 
 * 包含主题切换、侧边栏、搜索、进度等核心功能
 * 使用 ES Module 规范
 */

// ============================================
// Theme (主题管理)
// ============================================

/**
 * 主题管理器
 * 支持自动检测系统主题、手动切换、记住用户偏好
 */
export class ThemeManager {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'mc-docs-theme';
        this.defaultTheme = options.default || 'auto'; // light, dark, auto
        this.respectSystem = options.respectSystem !== false;
        this.onChange = options.onChange || null;
    }

    /**
     * 初始化主题
     */
    init() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const theme = savedTheme || this.defaultTheme;
        this.applyTheme(theme);
        this.bindEvents();
        return this;
    }

    /**
     * 应用主题
     */
    applyTheme(theme) {
        let actualTheme = theme;
        if (theme === 'auto') {
            actualTheme = this.getSystemTheme();
        }
        document.documentElement.setAttribute('data-theme', actualTheme);
        localStorage.setItem(this.storageKey, theme);
        if (this.onChange) {
            this.onChange(actualTheme);
        }
    }

    /**
     * 获取系统主题
     */
    getSystemTheme() {
        if (this.respectSystem && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    }

    /**
     * 切换主题
     */
    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        this.applyTheme(theme);
    }

    /**
     * 获取当前主题
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        if (this.respectSystem) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                const savedTheme = localStorage.getItem(this.storageKey);
                if (savedTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }
}

// ============================================
// Sidebar (侧边栏管理)
// ============================================

/**
 * 侧边栏管理器
 * 支持折叠/展开、移动端抽屉模式
 */
export class SidebarManager {
    constructor(options = {}) {
        this.sidebarSelector = options.sidebarSelector || '.sidebar';
        this.toggleSelector = options.toggleSelector || '.sidebar-toggle';
        this.overlaySelector = options.overlaySelector || '.sidebar-overlay';
        this.collapseBtnSelector = options.collapseBtnSelector || '.sidebar-collapse';
        this.defaultCollapsed = options.defaultCollapsed || false;
        this.storageKey = options.storageKey || 'mc-docs-sidebar-collapsed';
        this.onToggle = options.onToggle || null;
    }

    /**
     * 初始化侧边栏
     */
    init() {
        this.sidebar = document.querySelector(this.sidebarSelector);
        this.toggleBtn = document.querySelector(this.toggleSelector);
        this.overlay = document.querySelector(this.overlaySelector);
        this.collapseBtn = document.querySelector(this.collapseBtnSelector);
        if (!this.sidebar) return;
        // 恢复折叠状态
        const isCollapsed = localStorage.getItem(this.storageKey) === 'true';
        if (isCollapsed) {
            this.collapse();
        }
        this.bindEvents();
        return this;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 移动端切换按钮
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
        // 覆盖层点击关闭
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        // 折叠按钮
        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', () => this.toggleCollapse());
        }
        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    /**
     * 切换移动端抽屉
     */
    toggle() {
        this.sidebar.classList.toggle('open');
        if (this.overlay) {
            this.overlay.classList.toggle('visible');
        }
        if (this.onToggle) {
            this.onToggle(this.sidebar.classList.contains('open'));
        }
    }

    /**
     * 打开侧边栏
     */
    open() {
        this.sidebar.classList.add('open');
        if (this.overlay) {
            this.overlay.classList.add('visible');
        }
    }

    /**
     * 关闭侧边栏
     */
    close() {
        this.sidebar.classList.remove('open');
        if (this.overlay) {
            this.overlay.classList.remove('visible');
        }
    }

    /**
     * 切换折叠状态
     */
    toggleCollapse() {
        this.sidebar.classList.toggle('collapsed');
        const isCollapsed = this.sidebar.classList.contains('collapsed');
        localStorage.setItem(this.storageKey, isCollapsed);
        if (this.onToggle) {
            this.onToggle(!isCollapsed);
        }
    }

    /**
     * 折叠侧边栏
     */
    collapse() {
        this.sidebar.classList.add('collapsed');
        localStorage.setItem(this.storageKey, 'true');
    }

    /**
     * 展开侧边栏
     */
    expand() {
        this.sidebar.classList.remove('collapsed');
        localStorage.setItem(this.storageKey, 'false');
    }

    /**
     * 是否折叠
     */
    isCollapsed() {
        return this.sidebar.classList.contains('collapsed');
    }
}

// ============================================
// Navigation (导航管理)
// ============================================

/**
 * 导航管理器
 * 处理导航链接高亮、折叠分组等
 */
export class NavigationManager {
    constructor(options = {}) {
        this.navSelector = options.navSelector || '.sidebar-nav';
        this.activeClass = options.activeClass || 'active';
        this.collapseClass = options.collapseClass || 'collapsed';
    }

    /**
     * 初始化导航
     */
    init() {
        this.nav = document.querySelector(this.navSelector);
        if (!this.nav) return;
        this.highlightCurrentPage();
        this.bindCollapseEvents();
        return this;
    }

    /**
     * 高亮当前页面
     */
    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const links = this.nav.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && this.pathMatches(currentPath, href)) {
                link.classList.add(this.activeClass);
                // 展开父分组
                const group = link.closest('.nav-group');
                if (group) {
                    group.classList.remove(this.collapseClass);
                }
            }
        });
    }

    /**
     * 路径匹配
     */
    pathMatches(current, target) {
        return current.endsWith(target) || current.includes(target);
    }

    /**
     * 绑定折叠事件
     */
    bindCollapseEvents() {
        const headers = this.nav.querySelectorAll('.nav-group-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const group = header.closest('.nav-group');
                if (group) {
                    group.classList.toggle(this.collapseClass);
                }
            });
        });
    }
}

// ============================================
// Search (搜索管理)
// ============================================

/**
 * 搜索管理器
 * 使用 FlexSearch 实现客户端全文搜索
 */
export class SearchManager {
    constructor(options = {}) {
        this.searchInputSelector = options.searchInputSelector || '#searchInput';
        this.searchResultsSelector = options.searchResultsSelector || '#searchResults';
        this.hotkey = options.hotkey || '/';
        this.maxResults = options.maxResults || 10;
        this.index = null;
        this.documents = [];
    }

    /**
     * 初始化搜索
     */
    async init() {
        this.input = document.querySelector(this.searchInputSelector);
        this.resultsContainer = document.querySelector(this.searchResultsSelector);
        if (!this.input) return;
        await this.loadIndex();
        this.bindEvents();
        return this;
    }

    /**
     * 加载搜索索引
     */
    async loadIndex() {
        // 尝试从 CDN 加载 FlexSearch
        if (typeof FlexSearch === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/flexsearch@0.7.31/dist/flexsearch.min.js');
        }
        this.index = new FlexSearch.Document({
            document: {
                id: 'id',
                index: ['title', 'content', 'module'],
                store: ['title', 'url', 'module', 'type']
            },
            tokenize: 'forward',
            resolution: 9
        });
    }

    /**
     * 添加文档到索引
     */
    addDocument(doc) {
        this.documents.push(doc);
        if (this.index) {
            this.index.add(doc);
        }
    }

    /**
     * 搜索
     */
    search(query) {
        if (!this.index || !query.trim()) {
            return [];
        }
        const results = this.index.search(query, {
            limit: this.maxResults,
            enrich: true
        });
        return this.flattenResults(results);
    }

    /**
     * 扁平化结果
     */
    flattenResults(results) {
        const seen = new Set();
        const unique = [];
        results.forEach(field => {
            field.result.forEach(item => {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    unique.push(item.doc);
                }
            });
        });
        return unique;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 输入搜索
        this.input.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        // 快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === this.hotkey && document.activeElement !== this.input) {
                e.preventDefault();
                this.input.focus();
            }
        });
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) {
                this.hideResults();
            }
        });
    }

    /**
     * 处理搜索
     */
    handleSearch(query) {
        if (!query.trim()) {
            this.hideResults();
            return;
        }
        const results = this.search(query);
        this.showResults(results, query);
    }

    /**
     * 显示结果
     */
    showResults(results, query) {
        if (!this.resultsContainer) return;
        if (results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p>未找到 "${query}" 相关结果</p>
                </div>
            `;
            this.resultsContainer.style.display = 'block';
            return;
        }
        this.resultsContainer.innerHTML = results.map(doc => `
            <a href="${doc.url}" class="search-result-item">
                <div class="result-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="result-content">
                    <div class="result-title">${doc.title}</div>
                    <div class="result-meta">${doc.module} · ${doc.type}</div>
                </div>
            </a>
        `).join('');
        this.resultsContainer.style.display = 'block';
    }

    /**
     * 隐藏结果
     */
    hideResults() {
        if (this.resultsContainer) {
            this.resultsContainer.style.display = 'none';
        }
    }

    /**
     * 加载脚本
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// ============================================
// Reading Progress (阅读进度)
// ============================================

/**
 * 阅读进度管理器
 */
export class ProgressManager {
    constructor(options = {}) {
        this.selector = options.selector || '.reading-progress';
        this.showPercentage = options.showPercentage !== false;
        this.position = options.position || 'top';
    }

    /**
     * 初始化
     */
    init() {
        this.element = document.querySelector(this.selector);
        if (!this.element) {
            // 创建进度条
            this.createProgressBar();
        } else {
            this.element = document.querySelector(this.selector);
        }
        if (this.showPercentage) {
            this.element.classList.add('percentage');
        }
        this.bindEvents();
        this.update();
        return this;
    }

    /**
     * 创建进度条
     */
    createProgressBar() {
        const progress = document.createElement('div');
        progress.className = 'reading-progress';
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', '100');
        document.body.appendChild(progress);
        this.element = progress;
    }

    /**
     * 绑定滚动事件
     */
    bindEvents() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.update();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    /**
     * 更新进度
     */
    update() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        this.element.style.width = `${Math.min(progress, 100)}%`;
        this.element.setAttribute('aria-valuenow', Math.round(progress));
        if (this.showPercentage) {
            this.element.setAttribute('data-percentage', `${Math.round(progress)}%`);
        }
    }
}

// ============================================
// Keyboard Navigation (键盘导航)
// ============================================

/**
 * 键盘导航管理器
 */
export class KeyboardManager {
    constructor(options = {}) {
        this.shortcuts = options.shortcuts || {
            search: '/',
            nextDoc: 'j',
            prevDoc: 'k',
            darkMode: 'd',
            sidebar: '['
        };
        this.enabled = options.enabled !== false;
    }

    /**
     * 初始化
     */
    init() {
        if (!this.enabled) return;
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        return this;
    }

    /**
     * 处理按键
     */
    handleKeydown(e) {
        // 忽略在输入框中的按键
        const tag = document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            return;
        }
        const key = e.key;
        switch (key) {
            case this.shortcuts.search:
                e.preventDefault();
                this.focusSearch();
                break;
            case this.shortcuts.darkMode:
                e.preventDefault();
                this.toggleDarkMode();
                break;
            case this.shortcuts.sidebar:
                e.preventDefault();
                this.toggleSidebar();
                break;
            case this.shortcuts.nextDoc:
                e.preventDefault();
                this.navigateToNext();
                break;
            case this.shortcuts.prevDoc:
                e.preventDefault();
                this.navigateToPrev();
                break;
        }
    }

    /**
     * 聚焦搜索框
     */
    focusSearch() {
        const searchInput = document.querySelector('#searchInput, .search-box input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    /**
     * 切换深色模式
     */
    toggleDarkMode() {
        const themeManager = window.themeManager;
        if (themeManager) {
            themeManager.toggle();
        }
    }

    /**
     * 切换侧边栏
     */
    toggleSidebar() {
        const sidebarManager = window.sidebarManager;
        if (sidebarManager) {
            sidebarManager.toggleCollapse();
        }
    }

    /**
     * 导航到下一篇
     */
    navigateToNext() {
        const nextLink = document.querySelector('.prev-next .next a');
        if (nextLink) {
            window.location.href = nextLink.href;
        }
    }

    /**
     * 导航到上一篇
     */
    navigateToPrev() {
        const prevLink = document.querySelector('.prev-next .prev a');
        if (prevLink) {
            window.location.href = prevLink.href;
        }
    }
}

// ============================================
// App (应用入口)
// ============================================

/**
 * 应用入口类
 */
export class App {
    constructor(options = {}) {
        this.options = options;
        this.themeManager = null;
        this.sidebarManager = null;
        this.navigationManager = null;
        this.searchManager = null;
        this.progressManager = null;
        this.keyboardManager = null;
    }

    /**
     * 初始化所有模块
     */
    init() {
        // 主题管理
        this.themeManager = new ThemeManager({
            onChange: (theme) => {
                console.log('Theme changed to:', theme);
            }
        }).init();
        window.themeManager = this.themeManager;

        // 侧边栏管理
        this.sidebarManager = new SidebarManager({
            onToggle: (isOpen) => {
                console.log('Sidebar toggled:', isOpen ? 'open' : 'closed');
            }
        }).init();
        window.sidebarManager = this.sidebarManager;

        // 导航管理
        this.navigationManager = new NavigationManager().init();

        // 搜索管理
        this.searchManager = new SearchManager({
            hotkey: '/',
            maxResults: 10
        }).init();

        // 阅读进度
        this.progressManager = new ProgressManager({
            showPercentage: true
        }).init();

        // 键盘导航
        this.keyboardManager = new KeyboardManager().init();

        return this;
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.MCDocsApp = App;
    window.ThemeManager = ThemeManager;
    window.SidebarManager = SidebarManager;
    window.NavigationManager = NavigationManager;
    window.SearchManager = SearchManager;
    window.ProgressManager = ProgressManager;
    window.KeyboardManager = KeyboardManager;
}
