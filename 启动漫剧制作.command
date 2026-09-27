#!/bin/bash
echo "正在启动漫剧制作记..."
cd "$(dirname "$0")"
node node_modules/.bin/electron .
