import { ipcMain } from 'electron';
import { autoUpdateService } from '../services/AutoUpdateService';
import log from 'electron-log';

/**
 * 注册自动更新相关的 IPC 处理器
 */
export function registerUpdateHandlers() {
  // 检查更新
  ipcMain.handle('check-for-updates', async () => {
    try {
      log.info('IPC: 检查更新');
      const result = await autoUpdateService.checkForUpdates();
      return { success: true, data: result };
    } catch (error: any) {
      log.error('IPC: 检查更新失败', error);
      return { success: false, error: error.message };
    }
  });

  // 下载更新
  ipcMain.handle('download-update', async () => {
    try {
      log.info('IPC: 下载更新');
      await autoUpdateService.downloadUpdate();
      return { success: true };
    } catch (error: any) {
      log.error('IPC: 下载更新失败', error);
      return { success: false, error: error.message };
    }
  });

  // 退出并安装
  ipcMain.handle('quit-and-install', () => {
    try {
      log.info('IPC: 退出并安装');
      autoUpdateService.quitAndInstall();
      return { success: true };
    } catch (error: any) {
      log.error('IPC: 退出并安装失败', error);
      return { success: false, error: error.message };
    }
  });

  log.info('自动更新 IPC 处理器注册完成');
}

