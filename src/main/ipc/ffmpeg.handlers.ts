import { ipcMain, BrowserWindow } from 'electron';
import { FFmpegManager } from '../services/FFmpegManager';
import { initializeFFmpegPath } from '../services/FFmpegService';
import log from 'electron-log';
import fs from 'fs-extra';
import path from 'path';

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
    const logDir = path.dirname(logPath);
    await shell.openPath(logDir);
    return logDir;
  });

  /**
   * 读取完整日志文件内容
   * @param maxLines 最大读取行数（默认 1000）
   */
  ipcMain.handle('read-log-file', async (_event, maxLines: number = 1000) => {
    try {
      const logPath = log.transports.file.getFile().path;
      
      // 检查文件是否存在
      if (!fs.existsSync(logPath)) {
        log.warn('日志文件不存在:', logPath);
        return [];
      }

      // 读取文件内容
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      // 获取最新的 maxLines 行
      const recentLines = lines.slice(-maxLines);

      // 解析日志格式: [INFO] 2025/10/31 11:44:20 消息内容
      const parsedLogs = recentLines.map(line => {
        const match = line.match(/^\[(\w+)\]\s+(.+?)\s+(.+)$/);
        if (match) {
          const level = match[1].toLowerCase();
          const timestamp = match[2];
          const message = match[3];
          
          return {
            timestamp,
            level: level === 'success' ? 'success' : level === 'error' ? 'error' : level === 'warn' ? 'warning' : 'info',
            message
          };
        }
        
        // 如果无法解析，返回原始内容
        return {
          timestamp: new Date().toLocaleString(),
          level: 'info',
          message: line
        };
      });

      // 不记录日志，避免循环记录
      return parsedLogs;
    } catch (error) {
      log.error('读取日志文件失败:', error);
      return [];
    }
  });

  /**
   * 清空日志文件
   */
  ipcMain.handle('clear-log-file', async () => {
    try {
      const logPath = log.transports.file.getFile().path;
      
      // 检查文件是否存在
      if (!fs.existsSync(logPath)) {
        log.warn('日志文件不存在，无需清空');
        return { success: true, message: '日志文件不存在' };
      }

      // 清空文件内容（保留文件）
      await fs.writeFile(logPath, '');
      log.info('✅ 日志文件已清空');
      
      return { success: true, message: '日志已清空' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      log.error('清空日志文件失败:', errorMsg);
      return { success: false, message: errorMsg };
    }
  });

  log.info('FFmpeg IPC handlers registered');
}

