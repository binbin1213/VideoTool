import { app, dialog } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import log from 'electron-log';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import { createWriteStream } from 'fs';
import { Extract } from 'unzipper';

const execAsync = promisify(exec);

export interface FFmpegStatus {
  installed: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export class FFmpegManager {
  private static ffmpegPath: string | null = null;
  private static ffprobePath: string | null = null;
  
  // FFmpeg 下载地址（根据平台）
  private static readonly DOWNLOAD_URLS = {
    darwin: {
      url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
      ffprobeUrl: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
    },
    win32: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    },
    linux: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    },
  };

  /**
   * 获取 FFmpeg 安装目录
   */
  private static getFFmpegDir(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'ffmpeg');
  }

  /**
   * 获取 FFmpeg 可执行文件路径
   */
  private static getFFmpegExecutable(): string {
    const ffmpegDir = this.getFFmpegDir();
    const platform = process.platform;
    
    if (platform === 'win32') {
      return path.join(ffmpegDir, 'ffmpeg.exe');
    } else {
      return path.join(ffmpegDir, 'ffmpeg');
    }
  }

  /**
   * 获取 FFprobe 可执行文件路径
   */
  private static getFFprobeExecutable(): string {
    const ffmpegDir = this.getFFmpegDir();
    const platform = process.platform;
    
    if (platform === 'win32') {
      return path.join(ffmpegDir, 'ffprobe.exe');
    } else {
      return path.join(ffmpegDir, 'ffprobe');
    }
  }

  /**
   * 检查 FFmpeg 是否已安装
   */
  static async checkFFmpeg(): Promise<FFmpegStatus> {
    try {
      // 1. 先检查本地安装的 FFmpeg
      const localPath = this.getFFmpegExecutable();
      
      if (fs.existsSync(localPath)) {
        try {
          const { stdout } = await execAsync(`"${localPath}" -version`);
          const version = stdout.split('\n')[0];
          log.info('找到本地 FFmpeg:', version);
          
          this.ffmpegPath = localPath;
          this.ffprobePath = this.getFFprobeExecutable();
          
          return {
            installed: true,
            version,
            path: localPath,
          };
        } catch (error) {
          log.warn('本地 FFmpeg 无法执行:', error);
        }
      }

      // 2. 检查系统环境变量中的 FFmpeg
      try {
        const { stdout } = await execAsync('ffmpeg -version');
        const version = stdout.split('\n')[0];
        log.info('找到系统 FFmpeg:', version);
        
        this.ffmpegPath = 'ffmpeg';
        this.ffprobePath = 'ffprobe';
        
        return {
          installed: true,
          version,
          path: 'ffmpeg (系统)',
        };
      } catch (error) {
        log.info('系统未安装 FFmpeg');
      }

      // 3. 都没有找到
      return {
        installed: false,
        error: 'FFmpeg 未安装',
      };
    } catch (error) {
      log.error('检查 FFmpeg 失败:', error);
      return {
        installed: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 下载文件并显示进度
   */
  private static async downloadFile(
    url: string,
    destPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        // 处理重定向
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            log.info('重定向到:', redirectUrl);
            this.downloadFile(redirectUrl, destPath, onProgress)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`下载失败，状态码: ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        const fileStream = createWriteStream(destPath);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize > 0 && onProgress) {
            const progress = (downloadedSize / totalSize) * 100;
            onProgress(progress);
          }
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }

  /**
   * 解压文件
   */
  private static async extractArchive(archivePath: string, destDir: string): Promise<void> {
    const ext = path.extname(archivePath).toLowerCase();
    
    if (ext === '.zip') {
      // 解压 ZIP
      await fs.createReadStream(archivePath)
        .pipe(Extract({ path: destDir }))
        .promise();
    } else if (ext === '.xz' || ext === '.tar') {
      // 解压 tar.xz (Linux)
      await execAsync(`tar -xf "${archivePath}" -C "${destDir}"`);
    }
  }

  /**
   * 下载并安装 FFmpeg
   */
  static async downloadAndInstall(
    onProgress?: (message: string, progress?: number) => void
  ): Promise<boolean> {
    try {
      const platform = process.platform as 'darwin' | 'win32' | 'linux';
      const downloadInfo = this.DOWNLOAD_URLS[platform];
      
      if (!downloadInfo) {
        throw new Error(`不支持的平台: ${platform}`);
      }

      const ffmpegDir = this.getFFmpegDir();
      const tempDir = path.join(app.getPath('temp'), 'ffmpeg-download');
      
      // 清理并创建目录
      await fs.remove(tempDir);
      await fs.ensureDir(tempDir);
      await fs.ensureDir(ffmpegDir);

      onProgress?.('开始下载 FFmpeg...', 0);
      log.info('开始下载 FFmpeg 到:', tempDir);

      // macOS: 下载 ffmpeg 和 ffprobe
      if (platform === 'darwin') {
        const ffmpegZip = path.join(tempDir, 'ffmpeg.zip');
        const ffprobeZip = path.join(tempDir, 'ffprobe.zip');

        // 下载 ffmpeg
        onProgress?.('下载 FFmpeg (1/2)...', 0);
        await this.downloadFile(downloadInfo.url, ffmpegZip, (progress) => {
          onProgress?.(`下载 FFmpeg (1/2): ${Math.round(progress)}%`, progress * 0.4);
        });

        // 下载 ffprobe
        onProgress?.('下载 FFprobe (2/2)...', 40);
        const ffprobeUrl = (downloadInfo as { ffprobeUrl?: string }).ffprobeUrl;
        if (ffprobeUrl) {
          await this.downloadFile(ffprobeUrl, ffprobeZip, (progress) => {
            onProgress?.(`下载 FFprobe (2/2): ${Math.round(progress)}%`, 40 + progress * 0.4);
          });
        }

        // 解压
        onProgress?.('解压文件...', 80);
        await this.extractArchive(ffmpegZip, ffmpegDir);
        await this.extractArchive(ffprobeZip, ffmpegDir);

      } else {
        // Windows/Linux: 下载并解压
        const archiveName = platform === 'win32' ? 'ffmpeg.zip' : 'ffmpeg.tar.xz';
        const archivePath = path.join(tempDir, archiveName);

        await this.downloadFile(downloadInfo.url, archivePath, (progress) => {
          onProgress?.(`下载 FFmpeg: ${Math.round(progress)}%`, progress * 0.8);
        });

        onProgress?.('解压文件...', 80);
        await this.extractArchive(archivePath, tempDir);

        // 复制可执行文件到目标目录
        const extractedFiles = await fs.readdir(tempDir, { recursive: true });
        
        for (const file of extractedFiles) {
          const filePath = path.join(tempDir, file.toString());
          const fileName = path.basename(file.toString());
          
          if (fileName.startsWith('ffmpeg') || fileName.startsWith('ffprobe')) {
            const isExecutable = platform === 'win32' ? fileName.endsWith('.exe') : true;
            if (isExecutable) {
              const destPath = path.join(ffmpegDir, fileName);
              await fs.copy(filePath, destPath);
              log.info('复制文件:', fileName);
            }
          }
        }
      }

      // 设置执行权限 (macOS/Linux)
      if (platform !== 'win32') {
        const ffmpegPath = this.getFFmpegExecutable();
        const ffprobePath = this.getFFprobeExecutable();
        
        await fs.chmod(ffmpegPath, 0o755);
        await fs.chmod(ffprobePath, 0o755);
        log.info('设置执行权限');
      }

      // 清理临时文件
      await fs.remove(tempDir);

      // 验证安装
      const status = await this.checkFFmpeg();
      if (!status.installed) {
        throw new Error('FFmpeg 安装验证失败');
      }

      onProgress?.('FFmpeg 安装成功！', 100);
      log.info('FFmpeg 安装成功');
      
      return true;
    } catch (error) {
      log.error('下载安装 FFmpeg 失败:', error);
      onProgress?.(`安装失败: ${error instanceof Error ? error.message : '未知错误'}`, 0);
      return false;
    }
  }

  /**
   * 显示安装对话框
   */
  static async showInstallDialog(): Promise<boolean> {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'FFmpeg 未安装',
      message: 'VideoTool 需要 FFmpeg 才能处理视频文件。',
      detail: '是否立即下载并安装 FFmpeg？\n\n这将需要几分钟时间，具体取决于您的网络速度。',
      buttons: ['立即安装', '稍后安装', '取消'],
      defaultId: 0,
      cancelId: 2,
    });

    return result.response === 0;
  }

  /**
   * 获取 FFmpeg 路径
   */
  static getFFmpegPath(): string | null {
    return this.ffmpegPath;
  }

  /**
   * 获取 FFprobe 路径
   */
  static getFFprobePath(): string | null {
    return this.ffprobePath;
  }

  /**
   * 初始化 FFmpeg（应用启动时调用）
   */
  static async initialize(): Promise<FFmpegStatus> {
    log.info('初始化 FFmpeg...');
    
    const status = await this.checkFFmpeg();
    
    if (!status.installed) {
      log.warn('FFmpeg 未安装');
      
      // 显示安装对话框
      const shouldInstall = await this.showInstallDialog();
      
      if (shouldInstall) {
        // TODO: 显示进度窗口
        const success = await this.downloadAndInstall((message, progress) => {
          log.info(`安装进度: ${message} ${progress}%`);
        });
        
        if (success) {
          return await this.checkFFmpeg();
        }
      }
    }
    
    return status;
  }
}

