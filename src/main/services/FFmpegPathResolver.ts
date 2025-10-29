import path from 'path';
import fs from 'fs-extra';
import log from 'electron-log';
import { app } from 'electron';

export interface FFmpegPathInfo {
  ffmpegPath: string;
  ffprobePath: string;
}

/**
 * 检测是否存在随应用打包的 FFmpeg
 */
export function findBundledFFmpeg(): FFmpegPathInfo | null {
  const platform = process.platform;
  const isWin = platform === 'win32';
  const isMac = platform === 'darwin';

  log.info('=== 检测打包的 FFmpeg ===');
  log.info('平台:', platform);
  log.info('process.resourcesPath:', process.resourcesPath);
  log.info('app.getAppPath():', app.getAppPath());

  if (!isWin && !isMac) {
    log.warn('不支持的平台:', platform);
    return null;
  }

  const ffmpegExe = isWin ? 'ffmpeg.exe' : 'ffmpeg';
  const ffprobeExe = isWin ? 'ffprobe.exe' : 'ffprobe';
  const platformDir = isWin ? 'win' : 'mac';

  const appPath = app.getAppPath();
  const normalizedAppPath = appPath.endsWith('.asar') ? path.dirname(appPath) : appPath;

  const possiblePaths = [
    path.join(process.resourcesPath, 'ffmpeg', platformDir),
    path.join(normalizedAppPath, 'resources', 'ffmpeg', platformDir),
    path.join(path.dirname(process.execPath), 'resources', 'ffmpeg', platformDir),
  ];

  log.info('尝试以下路径:');
  for (const basePath of possiblePaths) {
    const ffmpegPath = path.join(basePath, ffmpegExe);
    const ffprobePath = path.join(basePath, ffprobeExe);

    log.info(`  检查: ${ffmpegPath}`);

    try {
      const ffmpegExists = fs.existsSync(ffmpegPath);
      const ffprobeExists = fs.existsSync(ffprobePath);

      log.info(`    ffmpeg 存在: ${ffmpegExists}`);
      log.info(`    ffprobe 存在: ${ffprobeExists}`);

      if (ffmpegExists && ffprobeExists) {
        log.info(`✅ 找到打包的 FFmpeg: ${ffmpegPath}`);
        return { ffmpegPath, ffprobePath };
      }
    } catch (error) {
      log.error('    检查路径出错:', error);
    }
  }

  log.warn('❌ 未找到打包的 FFmpeg');
  return null;
}

