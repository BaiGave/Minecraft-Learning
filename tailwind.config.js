/**
 * Tailwind CSS Configuration
 * 
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    "./*.html",
    "./**/*.html",
    "./scripts/**/*.js",
  ],
  theme: {
    extend: {
      // MC 品牌色系
      colors: {
        mc: {
          primary: '#5B8C5A',
          'primary-dark': '#4A7349',
          'primary-light': '#6FA070',
          secondary: '#3D5A80',
          secondary_light: '#5c7aa3',
          accent: '#E07A5F',
          'accent-light': '#e8957a',
          'accent-secondary': '#F2CC8F',
          'accent-tertiary': '#FFE066',
        },
        dark: {
          DEFAULT: '#1a1a2e',
          secondary: '#16213e',
          tertiary: '#0f3460',
        },
        light: {
          DEFAULT: '#f8f9fa',
          secondary: '#eef2f7',
        },
      },
      // 字体
      fontFamily: {
        sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      // 圆角
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },
      // 阴影
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 25px rgba(0, 0, 0, 0.15)',
        xl: '0 20px 40px rgba(0, 0, 0, 0.2)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
      },
      // 间距
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'fade-in-up': 'fadeInUp 0.5s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'slide-out': 'slideOut 0.3s ease forwards',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(100%)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      // 过渡
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        slower: '500ms',
      },
      // 最大宽度
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      // Z-index
      zIndex: {
        dropdown: '100',
        sticky: '200',
        fixed: '300',
        modalBackdrop: '400',
        modal: '500',
        popover: '600',
        tooltip: '700',
        toast: '800',
      },
    },
  },
  plugins: [],
  // 生产环境 purge
  mode: process.env.NODE_ENV === 'production' ? 'jit' : undefined,
};
