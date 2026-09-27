#!/usr/bin/env node
/**
 * Capacitor CLI 包装脚本（处理编码问题）
 */
const { execSync } = require('child_process');
const path = require('path');

process.env.NODE_OPTIONS = '--encoding=utf-8';

const cliPath = path.join(__dirname, '..', 'node_modules', '@capacitor/cli', 'dist', 'index.js');
const args = process.argv.slice(2);

try {
  const result = execSync(`node "${cliPath}" ${args.join(' ')}`, {
    stdio: 'inherit',
    cwd: __dirname,
    encoding: 'utf-8'
  });
  if (result) process.stdout.write(result);
} catch (e) {
  console.error(e.message);
  process.exit(e.status || 1);
}