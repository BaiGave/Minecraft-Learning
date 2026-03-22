// 教程章节页面的 JavaScript

// 进度条
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById('readingProgress');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
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

document.querySelectorAll('.tutorial-content > *').forEach(el => {
    observer.observe(el);
});

// 目录高亮
const tocLinks = document.querySelectorAll('.sidebar-toc a');
const sections = document.querySelectorAll('.tutorial-content h2, .tutorial-content h3');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    tocLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// 代码复制功能
document.querySelectorAll('.code-reference').forEach(block => {
    const copyBtn = block.querySelector('.code-reference-copy');
    const code = block.querySelector('code');

    if (copyBtn && code) {
        copyBtn.addEventListener('click', async () => {
            await navigator.clipboard.writeText(code.textContent);
            copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
            }, 2000);
        });
    }
});

// 平滑滚动到锚点
document.querySelectorAll('.sidebar-toc a[href^="#"]').forEach(anchor => {
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

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // Alt + Left: 上一章
    if (e.altKey && e.key === 'ArrowLeft') {
        const prevLink = document.querySelector('.tutorial-nav-btn.prev');
        if (prevLink) prevLink.click();
    }
    // Alt + Right: 下一章
    if (e.altKey && e.key === 'ArrowRight') {
        const nextLink = document.querySelector('.tutorial-nav-btn.next');
        if (nextLink) nextLink.click();
    }
});
