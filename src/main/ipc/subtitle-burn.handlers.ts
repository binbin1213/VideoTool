import { ipcMain, dialog, BrowserWindow } from 'electron';
import path from 'path';
import { FFmpegService } from '../services/FFmpegService';
import type { SubtitleBurnOptions } from '../../shared/types/subtitle-burn.types';
import log from 'electron-log';
import fs from 'fs-extra';

/**
 * 注册字幕烧录相关的 IPC handlers
 */
export function registerSubtitleBurnHandlers() {
  /**
   * 烧录字幕到视频
   */
  ipcMain.handle('burn-subtitles', async (event, options: SubtitleBurnOptions) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender);
    
    try {
      log.info('收到烧录请求:', options);

      const result = await FFmpegService.burnSubtitles(options, (progress) => {
        // 发送进度更新到渲染进程
        mainWindow?.webContents.send('subtitle-burn-progress', progress);
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      log.error('烧录失败:', errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  });

  /**
   * 选择字幕文件
   */
  ipcMain.handle('select-subtitle-file', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择字幕文件',
      filters: [
        { name: '字幕文件', extensions: ['srt', 'ass', 'ssa', 'vtt'] },
        { name: 'SRT 字幕', extensions: ['srt'] },
        { name: 'ASS 字幕', extensions: ['ass', 'ssa'] },
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
   * 获取字幕文件信息
   */
  ipcMain.handle('get-subtitle-info', async (_event, subtitlePath: string) => {
    try {
      const stats = await fs.stat(subtitlePath);
      const ext = path.extname(subtitlePath).toLowerCase().replace('.', '');
      
      let format: 'srt' | 'ass' | 'ssa' | 'vtt' | 'unknown' = 'unknown';
      if (['srt', 'ass', 'ssa', 'vtt'].includes(ext)) {
        format = ext as 'srt' | 'ass' | 'ssa' | 'vtt';
      }

      return {
        path: subtitlePath,
        format,
        size: stats.size,
      };
    } catch (error) {
      log.error('获取字幕信息失败:', error);
      return null;
    }
  });

  log.info('字幕烧录 IPC handlers 已注册');
}

