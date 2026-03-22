/**
 * Theme Manager - Design System V2
 * Minecraft Learning - Dark/Light Mode Support
 */

const ThemeManager = {
    STORAGE_KEY: 'mc-learning-theme',
    THEMES: ['light', 'dark'],
    
    // 获取系统主题偏好
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    
    // 获取保存的主题
    getSavedTheme() {
        return localStorage.getItem(this.STORAGE_KEY);
    },
    
    // 设置主题
    setTheme(theme) {
        // 验证主题值
        if (!this.THEMES.includes(theme)) {
            theme = 'light';
        }
        
        // 设置 HTML 属性
        document.documentElement.setAttribute('data-theme', theme);
        
        // 保存到 localStorage
        localStorage.setItem(this.STORAGE_KEY, theme);
        
        // 更新按钮状态
        this.updateToggleButtons(theme);
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },
    
    // 切换主题
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || this.getSystemTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    },
    
    // 获取当前主题
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.getSystemTheme();
    },
    
    // 更新切换按钮状态
    updateToggleButtons(theme) {
        if (!theme) {
            theme = this.getCurrentTheme();
        }
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.theme === theme) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    },
    
    // 初始化
    init() {
        // 防止闪烁 - 立即应用保存的主题
        const saved = this.getSavedTheme();
        const theme = saved || this.getSystemTheme();
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新按钮状态
        this.updateToggleButtons(theme);
        
        // 绑定切换按钮事件
        this.bindToggleButtons();
        
        // 监听系统主题变化
        this.watchSystemTheme();

        // 其他标签页 / 窗口修改 localStorage 时保持同步
        this.syncAcrossTabs();
        
        // 键盘快捷键 Alt+T 切换主题
        this.bindKeyboardShortcut();
    },

    syncAcrossTabs() {
        window.addEventListener('storage', (e) => {
            if (e.key !== this.STORAGE_KEY || e.newValue == null) return;
            if (!this.THEMES.includes(e.newValue)) return;
            document.documentElement.setAttribute('data-theme', e.newValue);
            this.updateToggleButtons(e.newValue);
        });
    },
    
    // 绑定切换按钮
    bindToggleButtons() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = btn.dataset.theme;
                if (theme && this.THEMES.includes(theme)) {
                    this.setTheme(theme);
                }
            });
            
            // 键盘可访问性
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    },
    
    // 监听系统主题变化
    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // 只有当用户没有手动设置主题时才跟随系统
            if (!this.getSavedTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },
    
    // 键盘快捷键
    bindKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Alt + T 切换主题
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }
};

// 自动初始化
(function() {
    // 如果 DOM 已加载，立即初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
    } else {
        ThemeManager.init();
    }
})();

// 导出到全局
window.ThemeManager = ThemeManager;
