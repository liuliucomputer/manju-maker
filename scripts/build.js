/**
 * 打包脚本：生成可独立运行的便携版应用
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', '漫剧制作');
const ELECTRON_PKG = path.join(ROOT, 'node_modules', 'electron');

console.log('📦 打包漫剧制作工具...');

// 清理旧输出
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log('  ✓ 清理旧输出');
}

// 创建目录结构
const dirs = [
  'resources/app/src',
  'locales',
  'resources/app/node_modules/electron/dist',
];
for (const d of dirs) {
  fs.mkdirSync(path.join(OUT, d), { recursive: true });
}

// 复制应用文件
const appFiles = [
  ['src/main.js', 'resources/app/src/main.js'],
  ['index.html', 'resources/app/index.html'],
  ['package.json', 'resources/app/package.json'],
];
for (const [src, dst] of appFiles) {
  fs.copyFileSync(path.join(ROOT, src), path.join(OUT, dst));
  console.log(`  ✓ ${dst}`);
}

// 复制 Electron 二进制到根目录
const binFiles = [
  'electron.exe', 'ffmpeg.dll', 'd3dcompiler_47.dll',
  'libEGL.dll', 'libGLESv2.dll', 'icudtl.dat',
  'snapshot_blob.bin', 'v8_context_snapshot.bin',
  'resources.pak', 'chrome_100_percent.pak', 'chrome_200_percent.pak',
  'vulkan-1.dll', 'vk_swiftshader.dll', 'vk_swiftshader_icd.json',
  'LICENSE', 'LICENSES.chromium.html', 'version',
];
for (const f of binFiles) {
  const src = path.join(ELECTRON_PKG, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUT, f));
    console.log(`  ✓ ${f} (${(fs.statSync(src).size / 1024 / 1024).toFixed(1)} MB)`);
  }
}

// 复制 locales
const localesSrc = path.join(ELECTRON_PKG, 'locales');
if (fs.existsSync(localesSrc)) {
  const localesDst = path.join(OUT, 'locales');
  execSync(`xcopy /E /I /Q "${localesSrc}" "${localesDst}"`, { stdio: 'inherit' });
  console.log('  ✓ locales/');
}

// 复制 resources（含 default_app.asar）
const resSrc = path.join(ELECTRON_PKG, 'resources');
const resDst = path.join(OUT, 'resources');
execSync(`xcopy /E /I /Q "${resSrc}" "${resDst}"`, { stdio: 'inherit' });
console.log('  ✓ resources/');

// 复制 electron.exe 到 app/node_modules/electron/dist
const exeSrc = path.join(ELECTRON_PKG, 'electron.exe');
const exeDst = path.join(OUT, 'resources', 'app', 'node_modules', 'electron', 'dist', 'electron.exe');
if (fs.existsSync(exeSrc)) {
  fs.copyFileSync(exeSrc, exeDst);
  console.log('  ✓ resources/app/node_modules/electron/dist/electron.exe');
}

// 创建 electron stub - 返回空对象，让 main.js 使用 fallback
const stubDir = path.join(OUT, 'resources', 'app', 'node_modules', 'electron');
fs.writeFileSync(path.join(stubDir, 'path.txt'), 'electron', 'utf8');
// 关键：返回空对象，触发 main.js 中的 fallback 逻辑
fs.writeFileSync(path.join(stubDir, 'index.js'), `
module.exports = {};
`, 'utf8');
fs.writeFileSync(path.join(stubDir, 'package.json'), JSON.stringify({
  name: 'electron', version: '28.3.3', main: 'index.js'
}, null, 2), 'utf8');
console.log('  ✓ electron stub (empty object)');

// 生成启动 BAT
const launcherBat = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "" "electron.exe" "resources\\app"
exit
`;
fs.writeFileSync(path.join(OUT, '启动漫剧制作.bat'), launcherBat, 'utf8');

// 创建使用说明
const readme = `漫剧制作工具 v1.0
================

使用方法：
1. 双击 "启动漫剧制作.bat" 运行
2. 选择「剧本模式」或「小说模式」
3. 输入内容后点击「开始生成」

功能：
- 剧本模式：输入剧本 → AI 拆解分镜 → 生成视频
- 小说模式：输入小说 → AI 提取场景 → 生成视频

AI 模型：
- 文本分镜：agnes-2.5-flash
- 视频生成：agnes-video-v2.0
- API：https://api.agnes-ai.cn/v1

大小：约 230 MB（含 Electron 运行时）
`;
fs.writeFileSync(path.join(OUT, '使用说明.txt'), readme, 'utf8');

// 计算总大小
let totalSize = 0;
function calcSize(dir) {
  let size = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) size += calcSize(p);
    else size += fs.statSync(p).size;
  }
  return size;
}
totalSize = calcSize(OUT);

console.log(`\n✅ 打包完成！`);
console.log(`📂 输出目录: ${OUT}`);
console.log(`📊 总大小: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`💡 双击 "启动漫剧制作.bat" 即可运行`);
