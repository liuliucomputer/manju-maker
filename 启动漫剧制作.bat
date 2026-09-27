@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动漫剧制作记...
node node_modules\.bin\electron.cmd .
pause
