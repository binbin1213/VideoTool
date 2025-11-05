import { ipcMain, dialog, BrowserWindow } from 'electron';
import path from 'path';
import { app } from 'electron';
import { FFmpegService } from '../services/FFmpegService';
import type { MergeOptions } from '../../shared/types/merge.types';
import log from 'electron-log';

/**
 * 注册音视频合并相关的 IPC handlers
 */
export function registerMergeHandlers() {
  /**
   * 合并音视频
   */
  ipcMain.handle('merge-audio-video', async (event, options: MergeOptions) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender);
    
    try {
      log.info('收到合并请求:', options);

      const result = await FFmpegService.mergeAudioVideo(options, (progress) => {
        // 发送进度更新到渲染进程
        mainWindow?.webContents.send('merge-progress', progress);
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      log.error('合并失败:', errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  });

  /**
   * 选择视频文件
   */
  ipcMain.handle('select-video-file', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择视频文件',
      filters: [
        { name: '视频文件', extensions: ['mp4', 'avi', 'mkv', 'mov', 'flv', 'wmv', 'webm', 'm4v'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  /**
   * 选择音频文件
   */
  ipcMain.handle('select-audio-file', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择音频文件',
      filters: [
        { name: '音频文件', extensions: ['mp3', 'aac', 'wav', 'flac', 'm4a', 'wma', 'ogg', 'opus'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  /**
   * 选择输出路径
   */
  ipcMain.handle('select-output-path', async (_event, defaultFileName: string) => {
    const result = await dialog.showSaveDialog({
      title: '保存合并后的视频',
      defaultPath: path.join(app.getPath('videos'), defaultFileName),
      filters: [
        { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'mov'] },
        { name: 'MP4 视频', extensions: ['mp4'] },
        { name: 'MKV 视频', extensions: ['mkv'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      return result.filePath;
    }
    return null;
  });

  /**
   * 获取视频信息（包含缩略图）
   */
  ipcMain.handle('get-video-info', async (_event, videoPath: string) => {
    try {
      const info = await FFmpegService.getVideoInfo(videoPath);
      if (!info) {
        return null;
      }

      // 提取视频缩略图（已禁用）
      // log.info('开始提取视频缩略图...');
      // const thumbnail = await FFmpegService.extractVideoThumbnail(videoPath, 1);
      // 
      // if (thumbnail) {
      //   info.thumbnail = thumbnail;
      //   log.info('✅ 缩略图已添加到视频信息');
      // } else {
      //   log.warn('⚠️ 缩略图提取失败，继续返回视频信息');
      // }

      return info;
    } catch (error) {
      log.error('获取视频信息失败:', error);
      return null;
    }
  });

  /**
   * 获取音频信息
   */
  ipcMain.handle('get-audio-info', async (_event, audioPath: string) => {
    try {
      const info = await FFmpegService.getAudioInfo(audioPath);
      return info;
    } catch (error) {
      log.error('获取音频信息失败:', error);
      return null;
    }
  });

  /**
   * 检查 FFmpeg 是否可用
   */
  ipcMain.handle('check-ffmpeg', async () => {
    return await FFmpegService.checkFFmpeg();
  });

  log.info('音视频合并 IPC handlers 已注册');
}

