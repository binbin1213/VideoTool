import { ipcMain, BrowserWindow } from 'electron';
import { FFmpegManager } from '../services/FFmpegManager';
import { initializeFFmpegPath } from '../services/FFmpegService';
import log from 'electron-log';

/**
 * 注册 FFmpeg 相关的 IPC handlers
 */
export function registerFFmpegHandlers(): void {
  /**
   * 检查 FFmpeg 状态
   */
  ipcMain.handle('check-ffmpeg-status', async () => {
    return await FFmpegManager.checkFFmpeg();
  });

  /**
   * 下载并安装 FFmpeg
   */
  ipcMain.handle('download-ffmpeg', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender);
    if (!mainWindow) {
      log.error('无法获取主窗口进行 FFmpeg 下载进度更新');
      return { success: false, message: '无法获取主窗口' };
    }

    try {
      const success = await FFmpegManager.downloadAndInstall((message, progress) => {
        mainWindow.webContents.send('ffmpeg-download-progress', { progress, message });
      });
      
      if (success) {
        initializeFFmpegPath(); // 更新 FFmpegService 的路径
        return { success: true, message: 'FFmpeg 安装成功' };
      } else {
        return { success: false, message: 'FFmpeg 安装失败' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      log.error('FFmpeg 下载安装失败:', errorMessage);
      return { success: false, message: errorMessage };
    }
  });

  /**
   * 获取日志文件路径
   */
  ipcMain.handle('get-log-path', () => {
    return log.transports.file.getFile().path;
  });

  /**
   * 打开日志文件夹
   */
  ipcMain.handle('open-log-folder', async () => {
    const { shell } = require('electron');
    const logPath = log.transports.file.getFile().path;
    const logDir = require('path').dirname(logPath);
    await shell.openPath(logDir);
    return logDir;
  });

  log.info('FFmpeg IPC handlers registered');
}

