/**
 * Tutorial Page JavaScript - Design System V2
 * Minecraft Learning - Enhanced Tutorial Interactions
 */

// ============================================================================
// Reading Progress Bar - 阅读进度条
// ============================================================================

(function() {
    const progressBar = document.getElementById('readingProgress');
    if (progressBar) {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
                    progressBar.style.width = Math.min(scrolled, 100) + '%';
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
})();

// ============================================================================
// Scroll Animations - 滚动动画
// ============================================================================

(function() {
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

    // Observe content elements with staggered animation
    const contentElements = document.querySelectorAll('.tutorial-content > *');
    contentElements.forEach((el, index) => {
        el.style.animationDelay = `${Math.min(index * 50, 500)}ms`;
        observer.observe(el);
    });
})();

// ============================================================================
// TOC Highlighting - 目录高亮
// ============================================================================

(function() {
    const tocLinks = document.querySelectorAll('.toc-list a, .sidebar-toc a');
    const sections = document.querySelectorAll('.tutorial-content h2[id], .tutorial-content h3[id]');

    if (tocLinks.length > 0 && sections.length > 0) {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    let current = '';

                    sections.forEach(section => {
                        const sectionTop = section.offsetTop;
                        if (window.scrollY >= sectionTop - 150) {
                            current = section.getAttribute('id');
                        }
                    });

                    tocLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + current) {
                            link.classList.add('active');
                            // Scroll TOC link into view
                            link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
})();

// ============================================================================
// Code Copy - 代码复制
// ============================================================================

(function() {
    // Handle code reference blocks
    document.querySelectorAll('.code-reference').forEach(block => {
        const copyBtn = block.querySelector('.code-reference-copy');
        const code = block.querySelector('code');

        if (copyBtn && code) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code.textContent);
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                    copyBtn.style.color = 'var(--color-success-500, #10b981)';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.color = '';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });
        }
    });

    // Handle inline copy buttons for pre > code blocks
    document.querySelectorAll('.tutorial-content pre').forEach(pre => {
        if (!pre.closest('.code-reference') && !pre.querySelector('.copy-btn')) {
            const wrapper = pre.parentElement;
            if (wrapper && wrapper.style.position !== 'absolute') {
                wrapper.style.position = 'relative';
            }

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.setAttribute('aria-label', '复制代码');
            
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(pre.textContent);
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.style.color = 'var(--color-success-500, #10b981)';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                        copyBtn.style.color = '';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });

            pre.appendChild(copyBtn);
        }
    });
})();

// ============================================================================
// Smooth Scroll to Anchor - 平滑滚动到锚点
// ============================================================================

(function() {
    document.querySelectorAll('.sidebar-toc a[href^="#"], .toc-list a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                const offset = 80; // Account for fixed navbar
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL without triggering scroll
                history.pushState(null, null, '#' + targetId);
            }
        });
    });
})();

// ============================================================================
// Keyboard Shortcuts - 键盘快捷键
// ============================================================================

(function() {
    document.addEventListener('keydown', (e) => {
        // Skip if in input/textarea
        if (e.target.matches('input, textarea, [contenteditable="true"]')) {
            return;
        }

        // Alt + Left: 上一章
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevLink = document.querySelector('.tutorial-nav-btn.prev, .part-nav-link.prev');
            if (prevLink) {
                const href = prevLink.getAttribute('href');
                if (href) window.location.href = href;
            }
        }

        // Alt + Right: 下一章
        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            const nextLink = document.querySelector('.tutorial-nav-btn.next, .part-nav-link.next');
            if (nextLink) {
                const href = nextLink.getAttribute('href');
                if (href) window.location.href = href;
            }
        }

        // Alt + Home: 返回目录
        if (e.altKey && e.key === 'Home') {
            e.preventDefault();
            const backLink = document.querySelector('.tutorial-nav-back, .back-to-index');
            if (backLink) {
                const href = backLink.getAttribute('href');
                if (href) window.location.href = href;
            }
        }

        // Escape: 关闭可能的弹窗
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active, .dropdown-menu.active').forEach(el => {
                el.classList.remove('active');
            });
        }
    });
})();

// ============================================================================
// Mobile Sidebar - 移动端侧边栏
// ============================================================================

(function() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.tutorial-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            if (overlay) overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar?.classList.remove('mobile-open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close on navigation
    if (sidebar) {
        sidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
})();

// ============================================================================
// Collapsible Sidebar Groups - 可折叠侧边栏分组
// ============================================================================

(function() {
    const sidebarGroups = document.querySelectorAll('.sidebar-group');

    sidebarGroups.forEach(group => {
        const header = group.querySelector('.sidebar-group-header');
        if (header) {
            header.addEventListener('click', () => {
                group.classList.toggle('expanded');
                const isExpanded = group.classList.contains('expanded');
                header.setAttribute('aria-expanded', isExpanded);
            });

            // Initialize aria-expanded
            header.setAttribute('aria-expanded', group.classList.contains('expanded'));
        }
    });

    // Expand current section based on URL
    const currentPath = window.location.pathname;
    sidebarGroups.forEach(group => {
        const links = group.querySelectorAll('a');
        links.forEach(link => {
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
                group.classList.add('expanded');
            }
        });
    });
})();

// ============================================================================
// Print Styles Enhancement - 打印样式增强
// ============================================================================

(function() {
    // Add print-friendly class to body when printing
    window.addEventListener('beforeprint', () => {
        document.body.classList.add('printing');
        // Expand all sidebar groups for printing
        document.querySelectorAll('.sidebar-group').forEach(group => {
            group.classList.add('expanded');
        });
    });

    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
    });
})();

// ============================================================================
// Accessibility Enhancements - 可访问性增强
// ============================================================================

(function() {
    // Skip to content link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const main = document.querySelector('.tutorial-content');
            if (main) {
                main.setAttribute('tabindex', '-1');
                main.focus();
            }
        });
    }

    // Focus management for sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sidebarToggle.click();
            }
        });
    }
})();

// ============================================================================
// Mermaid Diagram Enhancement - Mermaid 图表增强
// ============================================================================

(function() {
    // Re-render Mermaid diagrams when theme changes
    if (typeof mermaid !== 'undefined') {
        window.addEventListener('themechange', (e) => {
            // Mermaid will auto-update if reinitialized
            mermaid.init(undefined, '.tutorial-content .mermaid');
        });
    }

    // Lazy load Mermaid for better performance
    if (typeof mermaid !== 'undefined') {
        const mermaidElements = document.querySelectorAll('.tutorial-content .mermaid:not([data-processed])');
        if (mermaidElements.length > 0) {
            mermaid.init({ theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default' }, mermaidElements);
        }
    }
})();
