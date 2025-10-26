import { ipcMain } from 'electron';
import { FFmpegManager } from '../services/FFmpegManager';
import log from 'electron-log';

/**
 * 注册 FFmpeg 相关的 IPC handlers
 */
export function registerFFmpegHandlers(): void {
  /**
   * 检查 FFmpeg 状态
   */
  ipcMain.handle('ffmpeg:check-status', async () => {
    try {
      const status = await FFmpegManager.checkFFmpeg();
      return { success: true, data: status };
    } catch (error) {
      log.error('检查 FFmpeg 状态失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  });

  /**
   * 下载并安装 FFmpeg
   */
  ipcMain.handle('ffmpeg:download-install', async (_, onProgressChannel: string) => {
    try {
      const success = await FFmpegManager.downloadAndInstall((message, progress) => {
        // 发送进度更新到渲染进程
        if (onProgressChannel) {
          ipcMain.emit(onProgressChannel, { message, progress });
        }
        log.info(`FFmpeg 安装进度: ${message} ${progress}%`);
      });

      return { success };
    } catch (error) {
      log.error('下载安装 FFmpeg 失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  });

  /**
   * 获取 FFmpeg 路径
   */
  ipcMain.handle('ffmpeg:get-path', async () => {
    const ffmpegPath = FFmpegManager.getFFmpegPath();
    const ffprobePath = FFmpegManager.getFFprobePath();
    
    return {
      ffmpeg: ffmpegPath,
      ffprobe: ffprobePath,
    };
  });

  log.info('FFmpeg IPC handlers registered');
}

