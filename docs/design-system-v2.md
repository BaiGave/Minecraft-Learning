# Minecraft Learning - Design System V2

> 一个现代化的、专业的技术文档站点设计系统

---

## 一、设计理念

### 1.1 核心价值

- **专业感**：沉稳的深色调 + 精致的细节
- **易读性**：清晰的信息层级 + 舒适的阅读体验
- **一致性**：统一的组件系统 + 规范的设计语言
- **现代感**：微妙的动效 + 精致的交互

### 1.2 设计关键词

```
深空灰 · 靛蓝 · 紫罗兰 · 玻璃拟态 · 精致动效 · 沉浸阅读
```

---

## 二、色彩系统

### 2.1 主色板（Primary Palette）

```css
:root {
  /* 深靛蓝系 - 主色调 */
  --color-primary-50:  #eef2ff;   /* 最浅 */
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;   /* 主色 */
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;   /* 最深 */
  
  /* 深空灰 - 背景主色 */
  --color-slate-50:   #f8fafc;
  --color-slate-100: #f1f5f9;
  --color-slate-200: #e2e8f0;
  --color-slate-300: #cbd5e1;
  --color-slate-400: #94a3b8;
  --color-slate-500: #64748b;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1e293b;
  --color-slate-900: #0f172a;
  --color-slate-950: #020617;
  
  /* 紫罗兰点缀 */
  --color-violet-500: #8b5cf6;
  --color-violet-600: #7c3aed;
}
```

### 2.2 语义色（Semantic Colors）

```css
:root {
  /* 成功 - 翡翠绿 */
  --color-success-500: #10b981;
  --color-success-600: #059669;
  
  /* 警告 - 琥珀 */
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  
  /* 错误 - 玫红 */
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  
  /* 信息 - 天蓝 */
  --color-info-500: #3b82f6;
  --color-info-600: #2563eb;
}
```

### 2.3 深色模式

```css
/* 浅色模式（默认） */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-elevated: #ffffff;
  
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --text-inverse: #ffffff;
  
  --border-default: #e2e8f0;
  --border-muted: #f1f5f9;
  --border-strong: #cbd5e1;
}

/* 深色模式 */
:root[data-theme="dark"],
:root.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-elevated: #1e293b;
  
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --text-inverse: #0f172a;
  
  --border-default: #334155;
  --border-muted: #1e293b;
  --border-strong: #475569;
}
```

### 2.4 玻璃拟态（Glassmorphism）

```css
:root {
  /* 毛玻璃背景 */
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  
  /* 深色模式 */
  --glass-bg-dark: rgba(15, 23, 42, 0.8);
  --glass-border-dark: rgba(255, 255, 255, 0.1);
}

/* 使用示例 */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
}
```

---

## 三、排版系统

### 3.1 字体栈

```css
:root {
  /* 主字体 - 中文优化 */
  --font-sans: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', Roboto, sans-serif;
  
  /* 代码字体 */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 
               'Cascadia Code', Consolas, monospace;
  
  /* 数字字体 */
  --font-numeric: 'Tabular Nums', var(--font-sans);
}
```

### 3.2 字体尺寸

```css
:root {
  /* 标题系统 - 比例 1.25 */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;    /* 14px */
  --text-base: 1rem;         /* 16px */
  --text-lg:   1.125rem;    /* 18px */
  --text-xl:   1.25rem;     /* 20px */
  --text-2xl:  1.5rem;      /* 24px */
  --text-3xl:  1.875rem;    /* 30px */
  --text-4xl:  2.25rem;      /* 36px */
  --text-5xl:  3rem;         /* 48px */
  
  /* 行高 */
  --leading-none:   1;
  --leading-tight:  1.25;
  --leading-snug:  1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose:  2;
  
  /* 字重 */
  --font-normal:    400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;
  
  /* 字间距 */
  --tracking-tight:   -0.025em;
  --tracking-normal:  0;
  --tracking-wide:    0.025em;
}
```

### 3.3 文章排版

```css
.article-content {
  font-family: var(--font-sans);
  font-size: var(--text-lg);        /* 18px 正文 */
  line-height: var(--leading-relaxed); /* 1.625 */
  color: var(--text-primary);
  
  h1 { font-size: var(--text-4xl); font-weight: var(--font-bold); }
  h2 { font-size: var(--text-2xl); font-weight: var(--font-semibold); }
  h3 { font-size: var(--text-xl); font-weight: var(--font-semibold); }
  h4 { font-size: var(--text-lg); font-weight: var(--font-medium); }
  
  p { margin-bottom: var(--space-4); }
  
  a {
    color: var(--color-primary-600);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
    
    &:hover {
      border-bottom-color: var(--color-primary-400);
    }
  }
  
  blockquote {
    background: var(--bg-secondary);
    border-left: 4px solid var(--color-primary-500);
    padding: var(--space-4) var(--space-6);
    margin: var(--space-6) 0;
    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
    
    p { margin-bottom: 0; }
  }
}
```

---

## 四、间距系统

### 4.1 基础间距

```css
:root {
  --space-0:   0;
  --space-px:   1px;
  --space-0-5: 0.125rem;  /* 2px */
  --space-1:   0.25rem;   /* 4px */
  --space-1-5: 0.375rem;  /* 6px */
  --space-2:   0.5rem;    /* 8px */
  --space-2-5: 0.625rem;  /* 10px */
  --space-3:   0.75rem;    /* 12px */
  --space-3-5: 0.875rem;  /* 14px */
  --space-4:   1rem;      /* 16px */
  --space-5:   1.25rem;   /* 20px */
  --space-6:   1.5rem;    /* 24px */
  --space-7:   1.75rem;   /* 28px */
  --space-8:   2rem;      /* 32px */
  --space-9:   2.25rem;   /* 36px */
  --space-10:  2.5rem;    /* 40px */
  --space-12:  3rem;      /* 48px */
  --space-14:  3.5rem;    /* 56px */
  --space-16:  4rem;      /* 64px */
  --space-20:  5rem;      /* 80px */
  --space-24:  6rem;      /* 96px */
}
```

---

## 五、圆角系统

```css
:root {
  --radius-none: 0;
  --radius-sm:   0.25rem;   /* 4px */
  --radius-md:   0.375rem;   /* 6px */
  --radius-lg:   0.5rem;     /* 8px */
  --radius-xl:   0.75rem;    /* 12px */
  --radius-2xl:  1rem;       /* 16px */
  --radius-3xl: 1.5rem;     /* 24px */
  --radius-full: 9999px;
}
```

### 使用场景

| 组件 | 圆角值 |
|------|--------|
| 按钮 | `--radius-lg` (8px) |
| 输入框 | `--radius-md` (6px) |
| 卡片 | `--radius-xl` (12px) |
| 模态框 | `--radius-2xl` (16px) |
| 头像 | `--radius-full` (圆形) |

---

## 六、阴影系统

```css
:root {
  /* 柔和阴影 - 默认状态 */
  --shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1), 
               0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1), 
               0 8px 10px -6px rgba(0, 0, 0, 0.1);
  
  /* 深色模式阴影 */
  --shadow-sm-dark: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md-dark: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 
                   0 2px 4px -2px rgba(0, 0, 0, 0.3);
}

/* 悬浮阴影 */
.shadow-hover {
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
}
```

---

## 七、过渡动画

### 7.1 基础过渡

```css
:root {
  /* 过渡时间 */
  --duration-fast:   150ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
  --duration-slower: 500ms;
  
  /* 缓动函数 */
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);  /* 弹性 */
}
```

### 7.2 关键帧动画

```css
/* 入场动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes fadeInUp {
  from { 
    opacity: 0; 
    transform: translateY(16px); 
  }
  to   { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes fadeInScale {
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to   { 
    opacity: 1; 
    transform: scale(1); 
  }
}

/* 滑入动画 */
@keyframes slideInRight {
  from { 
    opacity: 0; 
    transform: translateX(20px); 
  }
  to   { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes slideInDown {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to   { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* 骨架屏闪烁 */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 7.3 动画类

```css
.animate-fadeIn {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

.animate-fadeInUp {
  animation: fadeInUp var(--duration-slow) var(--ease-out);
}

.animate-fadeInScale {
  animation: fadeInScale var(--duration-normal) var(--ease-spring);
}

/* 入场延迟 - stagger 效果 */
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }
```

---

## 八、组件系统

### 8.1 按钮（Button）

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2-5) var(--space-5);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: 1;
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  white-space: nowrap;
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* 主要按钮 */
.btn-primary {
  background: var(--color-primary-600);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--color-primary-700);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:active:not(:disabled) {
    background: var(--color-primary-800);
    transform: translateY(0);
  }
}

/* 次要按钮 */
.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-default);
  
  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
  }
}

/* 幽灵按钮 */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  
  &:hover:not(:disabled) {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

/* 图标按钮 */
.btn-icon {
  padding: var(--space-2-5);
  aspect-ratio: 1;
}

/* 尺寸 */
.btn-sm { padding: var(--space-1-5) var(--space-3-5); font-size: var(--text-xs); }
.btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
```

### 8.2 输入框（Input）

```css
.input {
  display: block;
  width: 100%;
  padding: var(--space-2-5) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast), 
              box-shadow var(--duration-fast);
  
  &::placeholder {
    color: var(--text-tertiary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
  
  &:disabled {
    background: var(--bg-secondary);
    cursor: not-allowed;
  }
}

/* 带图标 */
.input-with-icon {
  position: relative;
  
  .input-icon {
    position: absolute;
    left: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
  }
  
  .input {
    padding-left: var(--space-10);
  }
}
```

### 8.3 卡片（Card）

```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: all var(--duration-normal) var(--ease-out);
}

.card-hover {
  &:hover {
    border-color: var(--color-primary-300);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
}

/* 玻璃态卡片 */
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
}
```

### 8.4 徽章（Badge）

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-0-5) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.badge-primary {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

.badge-success {
  background: #d1fae5;
  color: #047857;
}

.badge-warning {
  background: #fef3c7;
  color: #b45309;
}

.badge-error {
  background: #fee2e2;
  color: #dc2626;
}
```

### 8.5 代码块（Code Block）

```css
/* 代码块容器 */
.code-block {
  position: relative;
  background: #0d1117;  /* GitHub 深色 */
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin: var(--space-4) 0;
  
  /* 标题栏 */
  &::before {
    content: attr(data-filename);
    display: block;
    padding: var(--space-2) var(--space-4);
    background: #161b22;
    border-bottom: 1px solid #30363d;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: #8b949e;
  }
  
  /* 代码区域 */
  pre {
    margin: 0;
    padding: var(--space-4);
    overflow-x: auto;
    
    code {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      line-height: var(--leading-relaxed);
      color: #c9d1d9;
    }
  }
  
  /* 复制按钮 */
  .copy-btn {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    padding: var(--space-1-5) var(--space-2-5);
    background: #30363d;
    border: none;
    border-radius: var(--radius-md);
    color: #8b949e;
    font-size: var(--text-xs);
    cursor: pointer;
    opacity: 0;
    transition: all var(--duration-fast);
    
    &:hover {
      background: #484f58;
      color: white;
    }
  }
  
  &:hover .copy-btn {
    opacity: 1;
  }
}

/* 行号 */
.code-line {
  display: table-row;
  
  .line-number {
    display: table-cell;
    width: 1%;
    padding-right: var(--space-4);
    text-align: right;
    color: #484f58;
    user-select: none;
  }
  
  .line-content {
    display: table-cell;
  }
}
```

### 8.6 提示框（Callout）

```css
.callout {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  margin: var(--space-4) 0;
  
  .callout-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-top: 2px;
  }
  
  .callout-content {
    flex: 1;
    min-width: 0;
    
    p:last-child { margin-bottom: 0; }
  }
}

.callout-info {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  
  .callout-icon { color: #2563eb; }
}

.callout-tip {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  
  .callout-icon { color: #059669; }
}

.callout-warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
  
  .callout-icon { color: #d97706; }
}

.callout-danger {
  background: #fee2e2;
  border: 1px solid #fecaca;
  
  .callout-icon { color: #dc2626; }
}
```

---

## 九、导航系统

### 9.1 顶部导航栏

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  z-index: 1000;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-default);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  .navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }
  
  .navbar-logo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    text-decoration: none;
  }
  
  .navbar-links {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    
    a {
      padding: var(--space-2) var(--space-3);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all var(--duration-fast);
      
      &:hover {
        color: var(--text-primary);
        background: var(--bg-secondary);
      }
      
      &.active {
        color: var(--color-primary-600);
        background: var(--color-primary-50);
      }
    }
  }
  
  /* 主题切换 */
  .theme-toggle {
    display: flex;
    padding: var(--space-1);
    background: var(--bg-secondary);
    border-radius: var(--radius-full);
    
    button {
      padding: var(--space-1-5);
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--duration-fast);
      
      &:hover { color: var(--text-primary); }
      
      &.active {
        background: var(--bg-primary);
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);
      }
    }
  }
}
```

### 9.2 下拉菜单

```css
.dropdown {
  position: relative;
  
  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    
    i { transition: transform var(--duration-fast); }
  }
  
  .dropdown-menu {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    min-width: 200px;
    background: var(--bg-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: var(--space-2);
    box-shadow: var(--shadow-xl);
    opacity: 0;
    visibility: hidden;
    transition: all var(--duration-normal) var(--ease-out);
    
    a {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2-5) var(--space-3);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: all var(--duration-fast);
      
      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
    }
  }
  
  &:hover .dropdown-menu,
  &:focus-within .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
    
    i { transform: rotate(180deg); }
  }
}
```

### 9.3 侧边栏

```css
.sidebar {
  position: sticky;
  top: calc(64px + var(--space-6));
  width: 280px;
  height: fit-content;
  max-height: calc(100vh - 64px - var(--space-12));
  overflow-y: auto;
  
  /* 滚动条 */
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 3px;
    
    &:hover { background: var(--border-strong); }
  }
}

.sidebar-section {
  margin-bottom: var(--space-6);
  
  .sidebar-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }
  
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    color: var(--text-secondary);
    font-size: var(--text-sm);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all var(--duration-fast);
    
    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    &.active {
      background: var(--color-primary-50);
      color: var(--color-primary-700);
      font-weight: var(--font-medium);
    }
  }
  
  /* 可折叠 */
  .sidebar-group {
    .sidebar-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) var(--space-3);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: all var(--duration-fast);
      
      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
      
      i { transition: transform var(--duration-fast); }
    }
    
    .sidebar-group-content {
      padding-left: var(--space-4);
      overflow: hidden;
      max-height: 0;
      transition: max-height var(--duration-normal) var(--ease-out);
    }
    
    &.expanded .sidebar-group-content {
      max-height: 500px;
    }
    
    &.expanded .sidebar-group-header i {
      transform: rotate(90deg);
    }
  }
}
```

---

## 十、响应式断点

```css
:root {
  --breakpoint-sm:  640px;   /* @media (min-width: 640px) */
  --breakpoint-md:  768px;   /* @media (min-width: 768px) */
  --breakpoint-lg: 1024px;   /* @media (min-width: 1024px) */
  --breakpoint-xl: 1280px;   /* @media (min-width: 1280px) */
  --breakpoint-2xl: 1536px;  /* @media (min-width: 1536px) */
}

/* 移动优先断点 */
/* sm: 平板竖屏 */
@media (min-width: 640px) { ... }

/* md: 平板横屏 */
@media (min-width: 768px) { ... }

/* lg: 笔记本 */
@media (min-width: 1024px) { ... }

/* xl: 桌面 */
@media (min-width: 1280px) { ... }
```

---

## 十一、可访问性

### 11.1 焦点样式

```css
/* 全局焦点样式 */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* 移除默认焦点环 */
:focus:not(:focus-visible) {
  outline: none;
}

/* 暗色焦点环 */
[data-theme="dark"] :focus-visible {
  outline-color: var(--color-primary-400);
}
```

### 11.2 ARIA 属性

```html
<!-- 导航 -->
<nav aria-label="主导航">
  <ul role="list">
    <li><a href="/" aria-current="page">首页</a></li>
  </ul>
</nav>

<!-- 搜索 -->
<div role="combobox" aria-expanded="false" aria-haspopup="listbox">
  <input aria-autocomplete="list" aria-controls="search-results" />
</div>

<!-- 折叠组 -->
<div role="region" aria-labelledby="section-title">
  <button aria-expanded="true" aria-controls="section-content">
    <span id="section-title">标题</span>
  </button>
  <div id="section-content" hidden>内容</div>
</div>
```

### 11.3 跳过链接

```html
<a href="#main-content" class="skip-link">
  跳过导航，跳转到主要内容
</a>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-600);
  color: white;
  border-radius: var(--radius-md);
  z-index: 9999;
  
  &:focus {
    top: var(--space-4);
  }
}
</style>
```

---

## 十二、深色模式

### 12.1 实现方式

```javascript
// 主题管理
const ThemeManager = {
  STORAGE_KEY: 'mc-learning-theme',
  
  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  
  getSavedTheme() {
    return localStorage.getItem(this.STORAGE_KEY);
  },
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateToggleButtons();
  },
  
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },
  
  init() {
    const saved = this.getSavedTheme();
    const theme = saved || this.getSystemTheme();
    this.setTheme(theme);
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!this.getSavedTheme()) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
  }
};
```

### 12.2 CSS 变量覆盖

```css
/* 深色模式变量 */
:root[data-theme="dark"],
:root.dark {
  /* 覆盖浅色变量 */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-default: #334155;
  
  /* 深色模式特定阴影 */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  
  /* 代码块背景 */
  --code-bg: #0d1117;
}

/* 自动适应系统偏好 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    /* ... */
  }
}
```

---

## 十三、图标系统

### 13.1 图标库

使用 **Lucide Icons** 作为主图标库：

```html
<!-- CDN 引入 -->
<script src="https://unpkg.com/lucide@latest"></script>

<!-- 或 npm 安装 -->
<!-- npm install lucide-static -->
```

### 13.2 图标使用规范

```html
<!-- 使用 i 标签 -->
<i data-lucide="menu" class="icon-sm"></i>
<i data-lucide="search" class="icon-md"></i>
<i data-lucide="settings" class="icon-lg"></i>

<!-- 或 SVG 内联 -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
     viewBox="0 0 24 24" fill="none" stroke="currentColor" 
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="11" cy="11" r="8"></circle>
  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
</svg>
```

### 13.3 图标尺寸

```css
.icon-xs  { width: 12px; height: 12px; }
.icon-sm  { width: 16px; height: 16px; }
.icon-md  { width: 20px; height: 20px; }
.icon-lg  { width: 24px; height: 24px; }
.icon-xl  { width: 32px; height: 32px; }
```

---

## 十四、构建说明

### 14.1 文件结构

```
styles/
├── variables.css      # CSS 变量定义
├── reset.css         # CSS 重置
├── base.css          # 基础样式
├── components.css    # 组件样式
├── utilities.css     # 工具类
├── dark-mode.css     # 深色模式
└── main.css         # 入口文件（@import 其他文件）

# 简化版（单文件）
styles.css            # 包含所有样式
```

### 14.2 使用方式

```html
<head>
  <!-- 深色模式需在最前 -->
  <script>
    // 防止闪烁
    const theme = localStorage.getItem('mc-learning-theme') 
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  </script>
  
  <link rel="stylesheet" href="styles.css">
  
  <!-- 第三方库 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
</head>
```

### 14.3 深色模式切换

```html
<div class="theme-toggle" role="group" aria-label="主题切换">
  <button class="theme-btn" data-theme="light" aria-label="浅色模式">
    <i data-lucide="sun"></i>
  </button>
  <button class="theme-btn" data-theme="dark" aria-label="深色模式">
    <i data-lucide="moon"></i>
  </button>
  <button class="theme-btn" data-theme="system" aria-label="跟随系统">
    <i data-lucide="monitor"></i>
  </button>
</div>

<script>
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    ThemeManager.setTheme(btn.dataset.theme);
  });
});
</script>
```

---

## 十五、设计资源

### 15.1 推荐工具

| 用途 | 工具 | 链接 |
|------|------|------|
| 设计稿 | Figma | https://figma.com |
| 配色方案 | Coolors | https://coolors.co |
| 图标 | Lucide | https://lucide.dev |
| 渐变 | Gradient Hunt | https://gradienthunt.com |
| 阴影 | Shadow Palette | https://shadows.brumm.af |
| 动画 | Easings | https://easings.net |

### 15.2 推荐字体

| 用途 | 字体 | 链接 |
|------|------|------|
| 中英文 | Inter | https://rsms.me/inter/ |
| 中文 | Noto Sans SC | https://fonts.google.com/noto |
| 代码 | JetBrains Mono | https://jetbrains.com/mono |

---

*Design System V2 - Minecraft Learning*
*Last Updated: 2026-03-22*
