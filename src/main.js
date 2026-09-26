// main.js - 漫剧制作工具主进程
const path = require('path');
const https = require('https');
const fs = require('fs');

// ── 数据目录 ─────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(require('os').homedir(), '.manju-maker');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// 加载配置
let API_CONFIG = {
      return new Promise(r => this.once('ready', r));
    }
    isReady() { return this._ready; }
    quit() { process.exit(0); }
    relaunch() { process.exit(0); }
    getPath(name) {
      const os = require('os');
      const paths = {
        home: os.homedir(),
        appData: path.join(os.homedir(), 'AppData', 'Roaming'),
        userData: path.join(os.homedir(), '.manju-maker'),
      };
      return paths[name] || paths.home;
    }
    getVersion() { return '18.18.2'; }
    on(event, fn) {
      if (event === 'ready') {
        this._ready = true;
        setImmediate(() => this.emit('ready'));
      }
      super.on(event, fn);
    }
  }

  class BrowserWindow {
    constructor(options = {}) {
      this.opts = options;
      this._closed = false;
      this._url = null;
      BrowserWindow._all.push(this);
    }
    loadFile(filePath) { this._url = filePath; }
    loadURL(url) { this._url = url; }
    destroy() {
      this._closed = true;
      BrowserWindow._all = BrowserWindow._all.filter(w => w !== this);
    }
    isDestroyed() { return this._closed; }
    setSize(w, h) { this.opts.width = w; this.opts.height = h; return this; }
    center() { return this; }
    show() { return this; }
    focus() { return this; }
    getWebContents() {
      return {
        zoomFactor: 1,
        openDevTools: () => {},
        closeDevTools: () => {},
        executeJavaScript: async () => null,
        on: () => {},
        once: () => {},
        send: () => {},
      };
    }
    static getAllWindows() { return BrowserWindow._all; }
  }
  BrowserWindow._all = [];

  electron = {
    app: new FakeApp(),
    BrowserWindow,
    ipcMain: {
      _handlers: {},
      handle(channel, fn) { this._handlers[channel] = fn; },
      on() {},
      removeHandler(channel) { delete this._handlers[channel]; },
    },
    dialog: {
      showSaveDialog() { return Promise.resolve({ canceled: true, filePath: '' }); },
      showMessageBox() { return Promise.resolve({ response: 0 }); },
      showOpenDialog() { return Promise.resolve({ canceled: true, filePaths: [] }); },
    },
    shell: { openExternal() { return Promise.resolve(); } },
    Menu: {
      buildFromTemplate() { return { items: [] }; },
      setApplicationMenu() {},
    },
    MenuItem: class {},
    screen: {
      getPrimaryDisplay() {
        return { workAreaSize: { width: 1920, height: 1080 } };
      },
    },
  };
} // end catch (e)

// ── 配置 ────────────────────────────────────────────────────────────────────
let API_CONFIG = {
  apiUrl: 'https://api.agnes-ai.cn/v1',
  apiKey: 'sk-C0BS2BvYhjqnWy4k0wuq87QGYddR1cWb6NuxfWwKlkHDrosK',
  textModel: 'agnes-2.5-flash',
  videoModel: 'agnes-video-v2.0',
};

// 从用户配置加载
try {
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(require('os').homedir(), '.manju-maker', 'config.json');
  if (fs.existsSync(configPath)) {
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    API_CONFIG = { ...API_CONFIG, ...saved };
  }
} catch(e) {}

const { app, BrowserWindow, ipcMain, dialog } = electron;

let mainWindow;

// ── 主窗口 ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d0d',
    frame: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC：发起 LLM 调用 ───────────────────────────────────────────────────────
function callLLM({ model, messages, maxTokens = 4096, apiKey, apiUrl }) {
  const api = apiKey || API_CONFIG.apiKey;
  const url = (apiUrl || API_CONFIG.apiUrl).replace(/\/$/, '');
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: model || API_CONFIG.textModel, messages, max_tokens: maxTokens, temperature: 0.7 });
    const urlObj = new URL(`${url}/chat/completions`);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

ipcMain.handle('call-llm', async (_event, args) => {
  const { model, messages, maxTokens = 4096, apiKey, apiUrl } = args;
  // 如果传入的是小说拆解任务，使用特定提示词
  const firstMsg = messages?.[0]?.content || '';
  if (firstMsg.includes('漫剧制作博主') || firstMsg.includes('小说')) {
    // 保留原有逻辑，但允许自定义提示词
  }
  return await callLLM(args);
});

ipcMain.handle('save-file', async (_event, args) => {
  const fs = require('fs');
  let filePath;
  if (args.filePath) {
    filePath = args.filePath;
  } else {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog({
      title: '保存项目',
      defaultPath: args.fileName || '漫剧项目.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled) return { canceled: true };
    filePath = result.filePath;
  }
  fs.writeFileSync(filePath, JSON.stringify(args.content, null, 2), 'utf8');
  return { canceled: false, path: filePath };
});

ipcMain.handle('read-file', async () => {
  const fs = require('fs');
  const filePath = path.join(require('os').homedir(), 'manju-work.json');
  if (fs.existsSync(filePath)) {
    return { success: true, content: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  }
  return { success: false };
});

// ── IPC：视频生成（异步任务 + 轮询）────────────────────────────────────────
async function fetchWithTimeout(url, options, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error('Invalid JSON: ' + data.substring(0, 300))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

ipcMain.handle('generate-video', async (_event, args) => {
  const { prompt, width = 1152, height = 768, numFrames = 121, frameRate = 24, image, model, apiKey, endpoint } = args;

  const api = apiKey || API_CONFIG.apiKey;
  const videoApiUrl = (endpoint || API_CONFIG.apiUrl).replace(/\/$/, '');
  const videoModel = model || API_CONFIG.videoModel;

  // Step 1: 提交视频生成任务
  const submitBody = JSON.stringify({
    model: videoModel,
    prompt,
    width,
    height,
    num_frames: numFrames,
    frame_rate: frameRate,
    ...(image ? { image } : {}),
  });

  let videoId;
  try {
    const res = await fetchWithTimeout(
      `${videoApiUrl}/v1/videos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api}`,
          'Content-Length': Buffer.byteLength(submitBody),
        },
      },
      30000
    );
    if (res.status !== 200 && res.status !== 201) {
      return { error: `提交失败 (${res.status}): ${JSON.stringify(res.body)}` };
    }
    videoId = res.body.id || res.body.video_id;
    if (!videoId) return { error: '未返回 video_id: ' + JSON.stringify(res.body) };
  } catch (e) {
    return { error: `提交视频任务失败: ${e.message}` };
  }

  // Step 2: 轮询等待结果
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const res = await fetchWithTimeout(
        `${videoApiUrl}/agnesapi?video_id=${videoId}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${api}` },
        },
        15000
      );
      if (res.status === 200) {
        const data = res.body;
        if (data.status === 'completed' || data.video_url) {
          return { videoUrl: data.video_url || data.url || data.video };
        }
        if (data.status === 'failed' || data.error) {
          return { error: `视频生成失败: ${JSON.stringify(data.error || data)}` };
        }
      }
    } catch (e) {
      // 继续轮询
    }
  }
  return { error: '视频生成超时（超过5分钟未完成任务）' };
});

// ── IPC：保存 API 配置 ───────────────────────────────────────────────────────
ipcMain.handle('save-api-config', async (_event, config) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  API_CONFIG = { ...API_CONFIG, ...config };
  return { success: true };
});

// ── IPC：加载项目历史 ───────────────────────────────────────────────────────
ipcMain.handle('load-projects', async () => {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      return { success: true, projects: JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8')) };
    }
  } catch(e) {}
  return { success: false, projects: [] };
});

// ── IPC：保存项目历史 ───────────────────────────────────────────────────────
ipcMain.handle('save-projects', async (_event, projects) => {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
});

// ── IPC：加载主题设置 ───────────────────────────────────────────────────────
ipcMain.handle('load-theme', async () => {
  try {
    const themeFile = path.join(DATA_DIR, 'theme.json');
    if (fs.existsSync(themeFile)) {
      return { success: true, theme: JSON.parse(fs.readFileSync(themeFile, 'utf8')).theme };
    }
  } catch(e) {}
  return { success: false, theme: 'dark' };
});

// ── IPC：保存主题设置 ───────────────────────────────────────────────────────
ipcMain.handle('save-theme', async (_event, theme) => {
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'theme.json'), JSON.stringify({ theme }), 'utf8');
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
});

console.log('漫剧制作记已启动 ✓');
console.log('数据目录:', DATA_DIR);
