import { ipcMain } from 'electron';
import log from 'electron-log';
import { TranscodeService } from '../services/TranscodeService';
import { OptimizerFactory } from '../services/optimizers/OptimizerFactory';
import type {
  TranscodeConfig,
  TranscodeProgress,
  VideoInfo,
  AIConfig,
} from '../../types/transcode.types';
import { OptimizationGoal } from '../services/optimizers/ParameterOptimizer';

log.info('正在创建 TranscodeService 实例...');
const transcodeService = new TranscodeService();
log.info('TranscodeService 实例创建成功');

/**
 * 注册视频转码相关的 IPC 处理器
 */
export function registerTranscodeHandlers() {
  log.info('开始注册视频转码 IPC handlers...');
  
  // 注意：get-video-info 已在 merge.handlers 中注册，这里不重复注册

  /**
   * 执行转码
   */
  ipcMain.handle(
    'start-transcode',
    async (event, config: TranscodeConfig): Promise<void> => {
      try {
        log.info('开始转码:', config);

        await transcodeService.transcode(config, (progress: TranscodeProgress) => {
          // 发送进度更新
          event.sender.send('transcode-progress', progress);
        });

        log.info('转码完成');
      } catch (error: any) {
        log.error('转码失败:', error);
        throw error;
      }
    }
  );

  /**
   * 取消转码
   */
  ipcMain.handle('cancel-transcode', async () => {
    try {
      log.info('取消转码');
      transcodeService.cancel();
    } catch (error: any) {
      log.error('取消转码失败:', error);
      throw error;
    }
  });

  /**
   * AI 参数优化（智能优化）
   */
  ipcMain.handle(
    'optimize-transcode-params',
    async (
      _,
      videoInfo: VideoInfo,
      goal: OptimizationGoal,
      aiConfig?: AIConfig
    ): Promise<any> => {
      try {
        log.info('智能参数优化:', { videoInfo, goal, aiConfig });

        // 使用智能优化（带预处理逻辑）
        const suggestion = await OptimizerFactory.smartOptimize(videoInfo, goal, aiConfig);

        log.info('优化建议:', suggestion);
        return suggestion;
      } catch (error: any) {
        log.error('参数优化失败:', error);
        throw error;
      }
    }
  );

  /**
   * 检查优化器可用性
   */
  ipcMain.handle(
    'check-optimizer-availability',
    async (_, aiConfig?: AIConfig): Promise<{ rule: boolean; ai: boolean }> => {
      try {
        return await OptimizerFactory.checkAvailability(
          aiConfig?.apiKey,
          aiConfig?.platform
        );
      } catch (error: any) {
        log.error('检查优化器可用性失败:', error);
        return { rule: true, ai: false };
      }
    }
  );

  // 注意：select-output-path 已在 merge.handlers 中注册，这里不重复注册

  log.info('视频转码 IPC handlers 已注册');
}

