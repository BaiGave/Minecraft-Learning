/**
 * Copy Libraries Script
 * 
 * This script copies necessary library files from node_modules to the lib directory.
 * Run this after npm install to ensure all libraries are available locally.
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // 源目录 (node_modules)
  srcDir: path.join(__dirname, '..', 'node_modules'),
  
  // 目标目录
  destDir: path.join(__dirname, '..', 'lib'),
  
  // 需要复制的库
  libraries: {
    // Lucide Icons (SVG 图标)
    'lucide-static': {
      src: 'icons',
      dest: 'lucide/icons',
      files: null // 复制整个 icons 目录
    },
    
    // FlexSearch (搜索)
    'flexsearch': {
      src: 'dist',
      dest: 'flexsearch',
      files: ['flexsearch.bundle.min.js']
    },
    
    // Highlight.js (代码高亮)
    'highlight.js': {
      src: '',
      dest: 'highlight.js',
      files: ['styles/github.css', 'styles/github-dark.css', 'lib/index.js']
    },
    
    // CountUp.js (数字动画)
    'countup.js': {
      src: 'dist',
      dest: 'countup',
      files: ['countUp.min.js']
    },
    
    // Mermaid (图表)
    'mermaid': {
      src: 'dist',
      dest: 'mermaid',
      files: ['mermaid.min.js']
    },
    
    // Font Awesome (图标 - 保留兼容)
    '@fortawesome/fontawesome-free': {
      src: '',
      dest: 'font-awesome',
      files: ['css/all.min.css', 'webfonts/fa-brands-400.ttf', 'webfonts/fa-brands-400.woff2', 'webfonts/fa-regular-400.ttf', 'webfonts/fa-regular-400.woff2', 'webfonts/fa-solid-900.ttf', 'webfonts/fa-solid-900.woff2']
    }
  }
};

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created: ${dirPath}`);
  }
}

/**
 * 复制文件
 */
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${path.basename(src)}`);
    return true;
  } catch (error) {
    console.error(`  Failed: ${error.message}`);
    return false;
  }
}

/**
 * 复制目录内容
 */
function copyDir(src, dest, files) {
  ensureDir(dest);
  
  if (!files) {
    // 复制整个目录
    try {
      const items = fs.readdirSync(src);
      items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          copyFile(srcPath, destPath);
        }
      });
    } catch (error) {
      console.error(`Failed to copy directory ${src}: ${error.message}`);
    }
  } else {
    // 只复制指定文件
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      if (fs.existsSync(srcPath)) {
        // 确保目标目录存在
        const destFileDir = path.dirname(destPath);
        ensureDir(destFileDir);
        copyFile(srcPath, destPath);
      } else {
        console.warn(`  File not found: ${file}`);
      }
    });
  }
}

/**
 * 主函数
 */
function main() {
  console.log('========================================');
  console.log('  Copying local libraries to lib/ directory');
  console.log('========================================\n');
  
  // 确保目标目录存在
  ensureDir(config.destDir);
  
  // 复制每个库
  let successCount = 0;
  let failCount = 0;
  
  for (const [libName, libConfig] of Object.entries(config.libraries)) {
    const libSrcDir = path.join(config.srcDir, libName);
    const srcPath = path.join(libSrcDir, libConfig.src);
    const destPath = path.join(config.destDir, libConfig.dest);
    
    console.log(`\n[${libName}]`);
    
    if (fs.existsSync(libSrcDir)) {
      copyDir(srcPath, destPath, libConfig.files);
      successCount++;
    } else {
      console.warn(`  Library not found: ${libName}`);
      failCount++;
    }
  }
  
  console.log('\n========================================');
  console.log(`  Done! ${successCount} libraries, ${failCount} failed.`);
  console.log('========================================');
  
  // 输出使用说明
  console.log('\nUsage in HTML:');
  console.log('  <!-- Lucide Icons (新组件) -->');
  console.log('  <script src="lib/lucide/lucide.min.js"></script>');
  console.log('  <script>lucide.createIcons();</script>');
  console.log('');
  console.log('  <!-- Font Awesome (保留兼容) -->');
  console.log('  <link rel="stylesheet" href="lib/font-awesome/css/all.min.css">');
  console.log('');
  console.log('  <!-- FlexSearch -->');
  console.log('  <script src="lib/flexsearch/flexsearch.min.js"></script>');
  console.log('');
  console.log('  <!-- Highlight.js -->');
  console.log('  <link rel="stylesheet" href="lib/highlight.js/styles/github.css">');
  console.log('  <script src="lib/highlight.js/lib/index.js"></script>');
  console.log('');
  console.log('  <!-- CountUp.js -->');
  console.log('  <script src="lib/countup/countUp.min.js"></script>');
  console.log('');
  console.log('  <!-- Mermaid -->');
  console.log('  <script src="lib/mermaid/mermaid.min.js"></script>');
}

// 运行
main();
