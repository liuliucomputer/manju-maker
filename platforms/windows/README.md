# 漫剧制作记 - Windows 版本

## 启动方式
双击 `启动漫剧制作记.bat`

## 功能说明
- 剧本模式：输入剧本 → AI 拆解分镜 → 生成视频
- 小说模式：输入小说 → AI 提取场景 → 生成视频

## API 配置
- 端点: https://api.agnes-ai.cn/v1
- 文本模型: agnes-2.5-flash
- 视频模型: agnes-video-v2.0

## 开发说明
修改 source 代码后运行 `npm run build` 重新打包。
首次打包会替换 electron.exe 图标（使用 dist/漫剧制作/app.ico）。