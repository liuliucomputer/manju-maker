#!/usr/bin/env node
/**
 * Capacitor CLI 启动脚本
 */
const { execSync } = require('child_process');
const path = require('path');

const cliPath = path.join(__dirname, '..', 'node_modules', '@capacitor/cli', 'bin', 'capacitor');
const args = process.argv.slice(2);

try {
  const result = execSync(`node "${cliPath}" ${args.join(' ')}`, {
    stdio: 'inherit',
    cwd: __dirname
  });
  process.exit(result.status || 0);
} catch (e) {
  if (e.status !== undefined) {
    process.exit(e.status);
  }
  console.error(e.message);
  process.exit(1);
}