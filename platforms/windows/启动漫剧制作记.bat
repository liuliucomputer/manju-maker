@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "" "electron.exe" "resources\app"
exit
