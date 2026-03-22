/**
 * Shared JavaScript Utilities
 * 共享的 JavaScript 工具函数
 *
 * This module provides common utilities for the website:
 * - DOM manipulation helpers
 * - Event handling utilities
 * - Performance optimization helpers
 */

export const Utils = {
    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 250) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 250) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Query selector with error handling
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (default: document)
     * @returns {Element|null}
     */
    $(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (e) {
            console.error(`Invalid selector: ${selector}`, e);
            return null;
        }
    },

    /**
     * Query selector all with error handling
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (default: document)
     * @returns {NodeList}
     */
    $$(selector, parent = document) {
        try {
            return parent.querySelectorAll(selector);
        } catch (e) {
            console.error(`Invalid selector: ${selector}`, e);
            return [];
        }
    },

    /**
     * Add event listener with automatic cleanup tracking
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Cleanup function
     */
    on(element, event, handler, options = {}) {
        if (!element) {
            console.warn('Cannot add event listener: element is null');
            return () => {};
        }
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    },

    /**
     * Check if element is in viewport
     * @param {Element} element - Target element
     * @returns {boolean}
     */
    isInViewport(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Smooth scroll to element
     * @param {Element|string} target - Target element or selector
     * @param {number} offset - Offset from top in px
     */
    scrollTo(target, offset = 0) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!element) {
            console.warn(`Target not found: ${target}`);
            return;
        }

        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    /**
     * Get scroll percentage
     * @returns {number} Percentage (0-100)
     */
    getScrollPercentage() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            // Fallback for older browsers
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
            console.error('Failed to copy to clipboard:', e);
            return false;
        }
    },

    /**
     * Format date to locale string
     * @param {string|Date} date - Date to format
     * @param {string} locale - Locale (default: 'zh-CN')
     * @returns {string}
     */
    formatDate(date, locale = 'zh-CN') {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Parse URL parameters
     * @param {string} param - Parameter name
     * @returns {string|null}
     */
    getUrlParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param);
    },

    /**
     * Create element with attributes and content
     * @param {string} tag - HTML tag
     * @param {Object} attrs - Attributes
     * @param {string|Element} content - Inner content
     * @returns {Element}
     */
    createElement(tag, attrs = {}, content = '') {
        const element = document.createElement(tag);

        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on')) {
                const event = key.slice(2).toLowerCase();
                element.addEventListener(event, value);
            } else {
                element.setAttribute(key, value);
            }
        });

        if (content) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else if (content instanceof Node) {
                element.appendChild(content);
            }
        }

        return element;
    },

    /**
     * Storage helpers with error handling
     */
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error(`Failed to get localStorage key "${key}":`, e);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error(`Failed to set localStorage key "${key}":`, e);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        }
    }
};

/**
 * Simple pub/sub event system
 */
export const EventBus = {
    events: {},

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        // Return unsubscribe function
        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    },

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Error in event handler for "${event}":`, e);
                }
            });
        }
    },

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     */
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
};

/**
 * Toast notification system
 */
export const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = Utils.createElement('div', {
                className: 'toast-container',
                style: {
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: '9999',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }
            });
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const toast = Utils.createElement('div', {
            className: 'toast',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderLeft: `4px solid ${colors[type] || colors.info}`,
                animation: 'slideIn 0.3s ease'
            }
        });

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}; font-size: 1.25rem;"></i>
            <span style="color: #374151; font-size: 0.95rem;">${message}</span>
        `;

        this.container.appendChild(toast);

        // Auto remove
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

// Add toast animations
if (typeof document !== 'undefined') {
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
    `;
    document.head.appendChild(style);
}

export default { Utils, EventBus, Toast };
