import { autoUpdater } from 'electron-updater';
import { BrowserWindow, app } from 'electron';
import log from 'electron-log';

/**
 * 自动更新服务
 * 负责检查、下载和安装应用更新
 */
export class AutoUpdateService {
  private mainWindow: BrowserWindow | null = null;
  private customUpdateUrl: string | null = null;

  constructor() {
    // 配置日志
    autoUpdater.logger = log;
    (autoUpdater.logger as typeof log).transports.file.level = 'info';

    // 配置更新服务器
    autoUpdater.autoDownload = false; // 不自动下载，让用户确认
    autoUpdater.autoInstallOnAppQuit = true; // 退出时自动安装

    // 检测并设置国内更新源
    this.setupUpdateServer();

    // 监听更新事件
    this.setupEventListeners();
  }

  /**
   * 设置更新服务器（优先使用国内源）
   */
  private setupUpdateServer() {
    // 优先级 1: 使用环境变量配置自定义更新源（推荐用于 OSS/COS）
    const customUrl = process.env.CUSTOM_UPDATE_URL;
    
    if (customUrl) {
      log.info('✅ 使用自定义更新源:', customUrl);
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: customUrl,
      } as any);
      this.customUpdateUrl = customUrl;
      return;
    }

    // 优先级 2: 默认使用 GitHub Releases
    // 注意：国内用户可能无法访问，建议配置 CUSTOM_UPDATE_URL 环境变量
    const locale = app.getLocale();
    if (locale === 'zh-CN' || locale === 'zh-TW') {
      log.warn('⚠️  检测到中文系统，但未配置国内更新源');
      log.warn('⚠️  国内用户可能无法检查更新，建议配置 CUSTOM_UPDATE_URL 环境变量');
      log.warn('⚠️  详见文档: docs/UPDATE_SERVER_SETUP.md');
    }
    
    log.info('使用 GitHub 官方源（国内可能无法访问）');
  }


  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 设置更新事件监听器
   */
  private setupEventListeners() {
    // 检查更新出错
    autoUpdater.on('error', (error) => {
      log.error('自动更新错误:', error);
      this.sendStatusToWindow('update-error', {
        message: error.message || '检查更新失败',
      });
    });

    // 检查更新中
    autoUpdater.on('checking-for-update', () => {
      log.info('正在检查更新...');
      this.sendStatusToWindow('checking-for-update', null);
    });

    // 有可用更新
    autoUpdater.on('update-available', (info) => {
      log.info('发现新版本:', info);
      this.sendStatusToWindow('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    // 没有可用更新
    autoUpdater.on('update-not-available', (info) => {
      log.info('当前已是最新版本:', info);
      this.sendStatusToWindow('update-not-available', {
        version: info.version,
      });
    });

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      log.info('下载进度:', progressObj);
      this.sendStatusToWindow('download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      });
    });

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      log.info('更新下载完成:', info);
      this.sendStatusToWindow('update-downloaded', {
        version: info.version,
      });
    });
  }

  /**
   * 向渲染进程发送更新状态
   */
  private sendStatusToWindow(event: string, data: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', { event, data });
    }
  }

  /**
   * 检查更新
   */
  async checkForUpdates(): Promise<any> {
    try {
      log.info('手动检查更新...');
      if (this.customUpdateUrl) {
        log.info('当前更新源:', this.customUpdateUrl);
      }
      const result = await autoUpdater.checkForUpdates();
      return result;
    } catch (error: any) {
      log.error('检查更新失败:', error);
      throw error;
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(): Promise<void> {
    try {
      log.info('开始下载更新...');
      await autoUpdater.downloadUpdate();
    } catch (error: any) {
      log.error('下载更新失败:', error);
      throw error;
    }
  }

  /**
   * 退出并安装更新
   */
  quitAndInstall(): void {
    log.info('退出并安装更新...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * 应用启动时自动检查更新
   */
  async checkForUpdatesOnStartup(): Promise<void> {
    // 开发环境不检查更新
    if (process.env.NODE_ENV === 'development') {
      log.info('开发环境，跳过更新检查');
      return;
    }

    try {
      // 延迟 3 秒后检查，避免启动时卡顿
      setTimeout(async () => {
        log.info('应用启动，自动检查更新...');
        await this.checkForUpdates();
      }, 3000);
    } catch (error) {
      log.error('启动时检查更新失败:', error);
    }
  }
}

// 导出单例
export const autoUpdateService = new AutoUpdateService();

