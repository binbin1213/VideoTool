import { ipcMain, dialog } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import log from 'electron-log';

/**
 * 注册字幕转换相关的 IPC handlers
 */
export function registerSubtitleConvertHandlers() {
  /**
   * 选择保存目录（用于批量转换）
   */
  ipcMain.handle('select-save-directory', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择保存目录',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  /**
   * 保存ASS文件到指定目录
   */
  ipcMain.handle('save-ass-file', async (_event, content: string, directory: string, filename: string) => {
    try {
      const filePath = path.join(directory, filename);
      await fs.writeFile(filePath, content, 'utf-8');
      log.info(`ASS文件已保存: ${filePath}`);
      return { success: true, filePath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      log.error('保存ASS文件失败:', errorMessage);
      return { success: false, message: errorMessage };
    }
  });
}

