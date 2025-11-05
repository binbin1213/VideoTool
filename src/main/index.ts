import { app, BrowserWindow, nativeImage, Menu, shell, ipcMain, type MenuItemConstructorOptions } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import log from 'electron-log';
import { registerMergeHandlers } from './ipc/merge.handlers';
import { registerSubtitleBurnHandlers } from './ipc/subtitle-burn.handlers';
import { registerSubtitleConvertHandlers } from './ipc/subtitle-convert.handlers';
import { registerFFmpegHandlers } from './ipc/ffmpeg.handlers';
import { registerTranscodeHandlers } from './ipc/transcode.handlers';
import { registerUpdateHandlers } from './ipc/update.handlers';
import { FFmpegManager } from './services/FFmpegManager';
import { initializeFFmpegPath } from './services/FFmpegService';
import { autoUpdateService } from './services/AutoUpdateService';

// 配置日志
// 强制设置日志路径（确保在用户数据目录）
const userDataPath = app.getPath('userData');
const logsPath = path.join(userDataPath, 'logs');

// 确保日志目录存在
try {
  fs.ensureDirSync(logsPath);
} catch (error) {
  console.error('创建日志目录失败:', error);
}

// 设置日志文件路径
log.transports.file.resolvePathFn = () => path.join(logsPath, 'main.log');
log.transports.file.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
log.transports.console.level = 'debug';

// 确保日志可以写入
try {
  const logFilePath = log.transports.file.getFile().path;
  
  // 打印日志文件路径到控制台（即使文件日志失败也能看到）
  console.log('='.repeat(80));
  console.log('VideoTool 启动');
  console.log('日志文件路径:', logFilePath);
  console.log('用户数据路径:', userDataPath);
  console.log('应用版本:', app.getVersion());
  console.log('平台:', process.platform);
  console.log('='.repeat(80));
  
  // 同时写入日志文件
  log.info('='.repeat(80));
  log.info('VideoTool 启动');
  log.info('日志文件路径:', logFilePath);
  log.info('用户数据路径:', userDataPath);
  log.info('应用版本:', app.getVersion());
  log.info('Electron 版本:', process.versions.electron);
  log.info('Node 版本:', process.versions.node);
  log.info('平台:', process.platform);
  log.info('架构:', process.arch);
  log.info('='.repeat(80));
} catch (error) {
  console.error('日志初始化失败:', error);
}

// 主窗口引用
let mainWindow: BrowserWindow | null = null;

// 判断是否是开发环境
const isDev = process.env.NODE_ENV === 'development';
// 开发模式静默 Electron 安全警告
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

/**
 * 创建主窗口
 */
async function createWindow() {
  // 加载Logo图标
  const iconPath = isDev 
    ? path.join(__dirname, '../../public/logo.png')
    : path.join(__dirname, '../../public/logo.png');
  
  log.info('Loading icon from:', iconPath);
  const icon = nativeImage.createFromPath(iconPath);
  
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 956,
    minWidth: 975, // 最小宽度（确保内容完整显示的最优值）
    minHeight: 795, // 最小高度（确保内容完整显示的最优值）
    resizable: true, // 允许手动调整大小
    maximizable: true, // 允许最大化
    fullscreenable: true, // 允许全屏
    icon: icon,
    titleBarStyle: 'hiddenInset', // macOS: 隐藏标题栏，保留交通灯按钮
    webPreferences: {
      // 生产环境加固：关闭 nodeIntegration，开启 contextIsolation/webSecurity
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      devTools: isDev,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'VideoTool - 视频处理工具',
    show: false, // 先不显示，等加载完成再显示
    backgroundColor: '#ffffff',
  });

  // 窗口准备好后再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    // 仅在开发环境打开开发者工具
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // 加载应用
  if (isDev) {
    // 开发环境：加载 Vite 开发服务器
    // 尝试多个端口，因为 Vite 可能会自动切换端口
    const tryPorts = [5173, 5174, 5175, 5176, 5177, 5178];
    let loaded = false;
    
    for (const port of tryPorts) {
      try {
        const url = `http://localhost:${port}`;
        log.info(`尝试加载 Vite 开发服务器: ${url}`);
        await mainWindow.loadURL(url);
        log.info(`✅ 成功加载: ${url}`);
        loaded = true;
        break;
      } catch (error) {
        log.warn(`端口 ${port} 不可用，尝试下一个...`);
      }
    }
    
    if (!loaded) {
      log.error('无法连接到 Vite 开发服务器，请确保 Vite 正在运行');
    }
  } else {
    // 生产环境：加载构建后的文件
    const rendererPath = path.join(__dirname, '../../renderer/index.html');
    log.info('Loading renderer from:', rendererPath);
    mainWindow.loadFile(rendererPath);
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 设置应用菜单（中文化）
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'VideoTool',
      submenu: [
        {
          label: '关于 VideoTool',
          role: 'about',
        },
        { type: 'separator' },
        {
          label: '退出',
          role: 'quit',
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' },
      ],
    },
    {
      label: '查看',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '强制重新加载', role: 'forceReload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' },
        { type: 'separator' },
        { label: '最大化', role: 'zoom' },
      ],
    },
  ];

  // macOS 需要特殊处理
  if (process.platform === 'darwin') {
    template[0].submenu = [
      { label: '关于 VideoTool', role: 'about' },
      { type: 'separator' },
      { label: '隐藏 VideoTool', role: 'hide' },
      { label: '隐藏其他', role: 'hideOthers' },
      { label: '显示全部', role: 'unhide' },
      { type: 'separator' },
      { label: '退出 VideoTool', role: 'quit' },
    ] as MenuItemConstructorOptions[];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  log.info('Main window created');
}

/**
 * 应用准备就绪
 */
app.whenReady().then(async () => {
  // 注册 IPC handlers（必须在窗口创建前）
  registerFFmpegHandlers();
  registerMergeHandlers();
  registerSubtitleBurnHandlers();
  registerSubtitleConvertHandlers();
  registerTranscodeHandlers();
  registerUpdateHandlers();
  
  // 注册打开外部链接的 handler
  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
      log.info('打开外部链接:', url);
    } catch (error) {
      log.error('打开外部链接失败:', error);
      throw error;
    }
  });
  
  // 先创建窗口
  createWindow();
  
  // 设置主窗口引用给自动更新服务
  if (mainWindow) {
    autoUpdateService.setMainWindow(mainWindow);
  }
  
  // 窗口创建后再初始化 FFmpeg（避免在没有窗口时弹出对话框导致崩溃）
  setTimeout(async () => {
    try {
      log.info('正在初始化 FFmpeg...');
      const ffmpegStatus = await FFmpegManager.initialize();
      
      if (ffmpegStatus.installed) {
        log.info('FFmpeg 已就绪:', ffmpegStatus.version);
        // 更新 FFmpegService 使用的路径
        initializeFFmpegPath();
      } else {
        log.warn('FFmpeg 未安装，某些功能可能无法使用');
      }
    } catch (error) {
      log.error('FFmpeg 初始化失败:', error);
    }
    
    // FFmpeg 初始化完成后，检查应用更新
    autoUpdateService.checkForUpdatesOnStartup();
  }, 1000); // 延迟1秒，确保窗口已完全加载

  // macOS：点击 Dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * 所有窗口关闭时退出应用（除了 macOS）
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 应用退出前的清理工作
 */
app.on('before-quit', () => {
  log.info('App quitting...');
});

