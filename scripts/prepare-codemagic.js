#!/usr/bin/env node
/**
 * 自动化脚本：准备 Codemagic 云构建所需文件
 */
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = 'D:\\manju-maker';
const OUTPUT_DIR = path.join(PROJECT_DIR, 'codemagic-ready');

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 复制关键文件
const filesToCopy = [
  'capacitor.config.json',
  'package.json',
  'package-lock.json',
  'www/index.html',
  'www/main.js',
];

console.log('准备 Codemagic 构建文件...\n');

for (const file of filesToCopy) {
  const src = path.join(PROJECT_DIR, file);
  const dst = path.join(OUTPUT_DIR, file);
  
  if (fs.existsSync(src)) {
    const content = fs.readFileSync(src, 'utf-8');
    fs.writeFileSync(dst, content);
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} (not found)`);
  }
}

console.log('\n完成！文件已准备在:', OUTPUT_DIR);
console.log('\n下一步：');
console.log('1. 将此目录内容推送到 GitHub');
console.log('2. 在 Codemagic 导入项目');
console.log('3. 配置 Apple Developer 凭据');
console.log('4. 开始云构建');
