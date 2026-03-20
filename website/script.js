// Minecraft 源码教程 - 脚本

// 模块数据配置（与 index.html 同步）
const moduleData = {
    mc: {
        name: 'Minecraft 原版',
        slug: 'mc',
        docsDir: 'docs/mc',
        defaultVersion: '1.21',
        versions: ['1.21', '1.20', '1.19', '1.18']
    },
    iris: {
        name: 'Iris 光影',
        slug: 'iris',
        docsDir: 'docs/iris',
        versions: null
    },
    sodium: {
        name: 'Sodium 优化',
        slug: 'sodium',
        docsDir: 'docs/sodium',
        versions: null
    }
};

// 填充导航下拉菜单
function renderNavigationDropdown() {
    const dropdown = document.getElementById('navDropdown');
    if (!dropdown) return;
    
    const links = Object.entries(moduleData).map(([key, mod]) => {
        let href;
        if (mod.versions && mod.versions.length > 0) {
            const defaultVersion = mod.defaultVersion || mod.versions[0];
            href = `${mod.docsDir}/${defaultVersion}/index.html`;
        } else {
            href = `${mod.docsDir}/index.html`;
        }
        return `<a href="${href}">${mod.name}</a>`;
    }).join('');
    
    dropdown.innerHTML = links || '<a href="#">暂无文档</a>';
}

// 页面加载时填充下拉菜单
document.addEventListener('DOMContentLoaded', () => {
    renderNavigationDropdown();
});

// 移动端菜单切换
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// 滚动动画
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

document.querySelectorAll('.system-card, .tip-card, .path-item, .catalog-part, .roadmap-card').forEach(el => {
    observer.observe(el);
});

// 导航栏滚动效果
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }
    
    lastScroll = currentScroll;
});

// 搜索功能
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.catalog-part').forEach(part => {
            const text = part.textContent.toLowerCase();
            part.style.display = text.includes(query) ? 'block' : 'none';
        });
    });
}

// 复制代码功能
document.querySelectorAll('pre code').forEach(block => {
    block.parentElement.style.position = 'relative';
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
    `;
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(block.textContent);
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    };
    block.parentElement.appendChild(copyBtn);
});

// 进度条
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // '/' 键快速搜索
    if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
    }
    // 'Escape' 关闭弹窗
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});
