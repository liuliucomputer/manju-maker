# 漫剧制作记

AI 驱动的漫剧制作工具，支持剧本模式和小说模式，自动生成 1~2 秒短视频片段。

## 功能特性

- **剧本模式**：输入剧本 → AI 拆解分镜 → 生成视频
- **小说模式**：输入小说 → AI 改编为漫剧剧本 → 生成视频
- **深色/浅色主题**：自动保存用户偏好
- **自定义 API 配置**：支持自定义端点、API Key、文本模型、视频模型
- **本地数据存储**：项目历史保存在 `~/.manju-maker/projects.json`

## 使用方法

### 1. 运行应用

双击 `启动漫剧制作.bat`（Windows）或 `启动漫剧制作.command`（macOS）

### 2. 基本流程

1. 选择「剧本模式」或「小说模式」
2. 输入内容（剧本或小说正文）
3. 点击「开始生成」
4. AI 自动拆解分镜并生成视频
5. 预览和导出最终漫剧

### 3. 自定义 API 配置

点击右上角 ⚙️ 设置按钮，可配置：
- API 端点
- API Key
- 文本模型
- 视频模型

不填写时使用内置默认配置。

## 技术栈

- **框架**：Electron
- **AI API**：agnes-2.5-flash（文本）+ agnes-video-v2.0（视频）
- **数据存储**：本地 JSON 文件

## 开发说明

### 项目结构

```
manju-maker/
├── index.html          # 主界面
├── src/
│   └── main.js         # Electron 主进程
├── scripts/
│   └── build.js        # 打包脚本
├── package.json
└── dist/               # 打包输出
```

### 打包命令

```bash
node scripts/build.js
```

### 数据目录

所有用户数据存储在 `~/.manju-maker/`：
- `config.json` - API 配置
- `projects.json` - 项目历史
- `theme.json` - 主题设置

## 开源许可

MIT License
