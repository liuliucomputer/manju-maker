#!/bin/bash
# Codemagic iOS 构建脚本
# 在 Mac 环境或云构建中使用

set -e

# 安装依赖
npm install

# 同步 Capacitor
npx cap sync ios

# 进入 iOS 目录
cd ios

# 安装 CocoaPods 依赖
pod install --repo-update

# 构建 Archive
xcodebuild -workspace App.xcworkspace \
  -scheme "漫剧制作记" \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  archive \
  -archivePath build/漫剧制作记.xcarchive

# 导出 IPA
xcodebuild -exportArchive \
  -archivePath build/漫剧制作记.xcarchive \
  -exportPath build/Exported \
  -exportOptionsPlist ExportOptions.plist

echo "构建完成！IPA 位于 build/Exported/"
