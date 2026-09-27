/**
 * 生成多尺寸 ICO 文件
 */
const fs = require('fs');
const path = require('path');

// 使用 Canvas 创建 ICO
const sizes = [256, 128, 64, 48, 32, 16];

function createICO(inputPath, outputPath) {
  // 简单方法：使用 ImageMagick 或 sharp
  // 这里我们尝试用 Node.js 原生方式创建
  console.log(`生成 ICO: ${outputPath}`);
  
  // 使用 PowerShell 调用 ImageMagick
  const sizesStr = sizes.join(',');
  try {
    const { execSync } = require('child_process');
    execSync(`magick "${inputPath}" -define icon:auto-resize=${sizesStr} "${outputPath}"`, { 
      stdio: 'inherit',
      shell: 'powershell.exe'
    });
    console.log('  ✓ ICO 生成成功');
  } catch (e) {
    console.error('  ✗ 自动生成失败:', e.message);
    console.log('  请手动转换或使用在线工具');
  }
}

const icoPath = path.join(__dirname, '..', 'dist', '漫剧制作', 'app.ico');
const srcPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.png');

if (!fs.existsSync(icoPath)) {
  createICO(srcPath, icoPath);
}
