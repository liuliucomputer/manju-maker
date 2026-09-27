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

// Clean up old output
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log('  ✓ 清理旧输出');
}

// Create directory structure
const dirs = [
  'resources/app/src',
  'locales',
  'resources/app/node_modules/electron/dist',
];
for (const d of dirs) {
  fs.mkdirSync(path.join(OUT, d), { recursive: true });
}

// Copy app files
const appFiles = [
  ['src/main.js', 'resources/app/src/main.js'],
  ['index.html', 'resources/app/index.html'],
  ['package.json', 'resources/app/package.json'],
];
for (const [src, dst] of appFiles) {
  fs.copyFileSync(path.join(ROOT, src), path.join(OUT, dst));
  console.log(`  ✓ ${dst}`);
}

// Copy Electron binaries to root
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

// Copy locales
const localesSrc = path.join(ELECTRON_PKG, 'locales');
if (fs.existsSync(localesSrc)) {
  const localesDst = path.join(OUT, 'locales');
  execSync(`xcopy /E /I /Q "${localesSrc}" "${localesDst}"`, { stdio: 'inherit' });
  console.log('  ✓ locales/');
}

// Copy resources (including default_app.asar)
const resSrc = path.join(ELECTRON_PKG, 'resources');
const resDst = path.join(OUT, 'resources');
execSync(`xcopy /E /I /Q "${resSrc}" "${resDst}"`, { stdio: 'inherit' });
console.log('  ✓ resources/');

// Copy electron.exe to app/node_modules/electron/dist
const exeSrc = path.join(ELECTRON_PKG, 'electron.exe');
const exeDst = path.join(OUT, 'resources', 'app', 'node_modules', 'electron', 'dist', 'electron.exe');
if (fs.existsSync(exeSrc)) {
  fs.copyFileSync(exeSrc, exeDst);
  console.log('  ✓ resources/app/node_modules/electron/dist/electron.exe');
}

// Create electron stub - returns empty object, triggers main.js fallback logic
const stubDir = path.join(OUT, 'resources', 'app', 'node_modules', 'electron');
fs.writeFileSync(path.join(stubDir, 'path.txt'), 'electron', 'utf8');
fs.writeFileSync(path.join(stubDir, 'index.js'), `
module.exports = {};
`, 'utf8');
fs.writeFileSync(path.join(stubDir, 'package.json'), JSON.stringify({
  name: 'electron', version: '28.3.3', main: 'index.js'
}, null, 2), 'utf8');
console.log('  ✓ electron stub (empty object)');

// Replace icon in electron.exe using IconReplacer tool
const icoPath = path.join(ROOT, 'dist', '漫剧制作', 'app.ico');
if (fs.existsSync(icoPath)) {
  const iconReplacerPath = path.join(__dirname, 'IconReplacer.exe');
  try {
    execSync(`"${iconReplacerPath}" "${path.join(OUT, 'electron.exe')}" "${icoPath}"`, { stdio: 'inherit' });
    console.log('  ✓ Icon replaced');
  } catch (e) {
    console.log('  ⚠ Icon replacement failed (non-critical)');
  }
}

// Copy platforms/Windows documentation into dist
const platformsSrc = path.join(ROOT, 'platforms', 'Windows');
if (fs.existsSync(platformsSrc)) {
  const files = fs.readdirSync(platformsSrc);
  for (const f of files) {
    const srcFile = path.join(platformsSrc, f);
    const dstFile = path.join(OUT, f);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, dstFile);
      console.log(`  ✓ ${f} (from platforms/Windows)`);
    }
  }
}

// Generate launch BAT (always regenerate to ensure consistency)
const launcherBat = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "" "electron.exe" "resources\\app"
exit
`;
fs.writeFileSync(path.join(OUT, '启动漫剧制作记.bat'), launcherBat, 'utf8');
console.log('  ✓ 启动漫剧制作记.bat');

// Calculate total size
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
console.log(`💡 双击 "启动漫剧制作记.bat" 即可运行`);
