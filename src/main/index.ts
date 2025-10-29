import { app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import log from 'electron-log';
import { registerMergeHandlers } from './ipc/merge.handlers';
import { registerSubtitleBurnHandlers } from './ipc/subtitle-burn.handlers';
import { registerFFmpegHandlers } from './ipc/ffmpeg.handlers';
import { FFmpegManager } from './services/FFmpegManager';
import { initializeFFmpegPath } from './services/FFmpegService';

// 配置日志
log.transports.file.level = 'info';
log.info('App starting...');

// 主窗口引用
let mainWindow: BrowserWindow | null = null;

// 判断是否是开发环境
const isDev = process.env.NODE_ENV === 'development';

/**
 * 创建主窗口
 */
function createWindow() {
  // 加载Logo图标
  const iconPath = isDev 
    ? path.join(__dirname, '../../public/logo.png')
    : path.join(__dirname, '../../public/logo.png');
  
  log.info('Loading icon from:', iconPath);
  const icon = nativeImage.createFromPath(iconPath);
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    resizable: true,
    icon: icon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      devTools: true,
    },
    title: 'VideoTool - 视频处理工具',
    show: false, // 先不显示，等加载完成再显示
    backgroundColor: '#ffffff',
  });

  // 窗口准备好后再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // 加载应用
  if (isDev) {
    // 开发环境：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:5173');
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
  
  // 先创建窗口
  createWindow();
  
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

