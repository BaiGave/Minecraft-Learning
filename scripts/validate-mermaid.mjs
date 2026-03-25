/**
 * 启发式校验 content/ 下 Markdown 中的 ```mermaid 块，避免 Mermaid 10.x 常见语法炸弹：
 * - 双引号节点文案里出现未转义的「< + 英文字母」（Java 泛型、命令占位符等），
 *   应用 Mermaid 实体写法：#lt; #gt;（见 https://mermaid.js.org/syntax/flowchart.html ）
 *
 * 说明：不在 Node 里直接调用 mermaid.parse()（依赖浏览器/DOMPurify，CLI 下易报错）。
 *
 * 用法:
 *   node scripts/validate-mermaid.mjs              # 默认：仅 MC 1.21 教程（最易踩雷）
 *   node scripts/validate-mermaid.mjs --all        # 扫描整个 content/（分析文档可能有历史遗留）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ARGS = process.argv.slice(2);
const SCAN_ALL = ARGS.includes('--all');
const DEFAULT_TUTORIAL_ROOT = path.join(ROOT, 'content', 'mc', '1.21', 'core', '-', 'tutorials');
const CONTENT_ROOT = path.join(ROOT, 'content');

const MERMAID_BLOCK = /```mermaid\n([\s\S]*?)```/g;

/** 在双引号包裹的 label 内检测危险的裸 < （已排除 <br、#lt;、</ 等） */
function findUnsafeAngleInQuotedLabels(mermaidCode) {
  const errors = [];
  const re = /"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(mermaidCode)) !== null) {
    let inner = m[1];
    inner = inner.replace(/<br\s*\/?>/gi, '');
    inner = inner.replace(/#lt;/gi, 'X');
    inner = inner.replace(/#gt;/gi, 'X');
    inner = inner.replace(/#amp;/gi, 'X');
    if (/<[A-Za-z]/.test(inner)) {
      errors.push(m[0].slice(0, 80) + (m[0].length > 80 ? '…' : ''));
    }
  }
  return errors;
}

function walkMd(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkMd(p, out);
    else if (name.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function main() {
  const roots = SCAN_ALL ? [CONTENT_ROOT] : [DEFAULT_TUTORIAL_ROOT];
  const files = roots.flatMap((r) => walkMd(r));
  let blocks = 0;
  const failures = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    MERMAID_BLOCK.lastIndex = 0;
    while ((m = MERMAID_BLOCK.exec(text)) !== null) {
      blocks++;
      const code = m[1].trim();
      if (!code) continue;
      const bad = findUnsafeAngleInQuotedLabels(code);
      if (bad.length) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        failures.push({ file: rel, samples: bad });
      }
    }
  }

  const scope = SCAN_ALL ? 'content/' : 'content/mc/1.21/core/-/tutorials/';
  console.log(`Mermaid 启发式校验 (${scope}): ${files.length} 个 .md，${blocks} 个 mermaid 块。`);
  if (failures.length === 0) {
    console.log('✓ 未发现双引号节点中的裸 <字母 模式。');
    process.exit(0);
  }

  console.error(`✗ ${failures.length} 个文件存在问题节点文案（请用 #lt; #gt; 或改写文案）:\n`);
  for (const f of failures) {
    console.error(`  ${f.file}`);
    f.samples.forEach((s) => console.error(`    例: ${s}`));
    console.error('');
  }
  process.exit(1);
}

main();
