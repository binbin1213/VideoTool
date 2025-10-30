import log from 'electron-log';
import {
  ParameterOptimizer,
  OptimizationGoal,
  OptimizationSuggestion,
} from './ParameterOptimizer';
import type { TranscodeConfig, VideoInfo } from '../../../types/transcode.types';

/**
 * 基于规则的参数优化器
 * v1.0 版本使用，基于经验规则和数学模型
 */
export class RuleBasedOptimizer extends ParameterOptimizer {
  get name(): string {
    return '规则优化器';
  }

  get version(): string {
    return '1.0.0';
  }

  async isAvailable(): Promise<boolean> {
    return true; // 规则优化器始终可用
  }

  /**
   * 优化参数
   */
  async optimize(
    videoInfo: VideoInfo,
    goal: OptimizationGoal,
    baseConfig?: Partial<TranscodeConfig>
  ): Promise<OptimizationSuggestion> {
    log.info('规则优化器开始分析:', { videoInfo, goal });

    // 根据目标选择策略
    let config: Partial<TranscodeConfig>;
    let reason: string;

    switch (goal.target) {
      case 'quality':
        config = this.optimizeForQuality(videoInfo);
        reason = '优化画质：使用较低 CRF 值和较慢预设，保证最佳质量';
        break;

      case 'size':
        config = this.optimizeForSize(videoInfo, goal.maxFileSize);
        reason = '优化文件大小：使用 H.265 编码和较高 CRF 值，降低分辨率';
        break;

      case 'speed':
        config = this.optimizeForSpeed(videoInfo);
        reason = '优化速度：启用硬件加速，使用快速预设';
        break;

      case 'balanced':
      default:
        config = this.optimizeBalanced(videoInfo);
        reason = '平衡模式：在质量、大小和速度间取得最佳平衡';
        break;
    }

    // 合并基础配置
    if (baseConfig) {
      config = { ...config, ...baseConfig };
    }

    // 预估输出
    const fullConfig = this.fillDefaultConfig(config);
    const estimatedSize = await this.estimateFileSize(videoInfo, fullConfig);
    const estimatedTime = await this.estimateTranscodeTime(videoInfo, fullConfig);

    return {
      config,
      reason,
      estimatedSize,
      estimatedTime,
      confidence: 0.8, // 规则优化器置信度 80%
    };
  }

  /**
   * 优化质量
   */
  private optimizeForQuality(_videoInfo: VideoInfo): Partial<TranscodeConfig> {
    return {
      format: 'mkv',
      videoCodec: 'libx265', // H.265 质量更好
      audioCodec: 'flac', // 无损音频
      qualityMode: 'crf',
      crf: 18, // 高质量
      preset: 'slow', // 慢速编码，质量优先
      resolution: 'original',
      framerate: 'original',
      audioBitrate: undefined, // 无损
      useHardwareAccel: false, // 软件编码质量更好
    };
  }

  /**
   * 优化文件大小
   */
  private optimizeForSize(
    videoInfo: VideoInfo,
    maxFileSize?: number
  ): Partial<TranscodeConfig> {
    // 计算目标比特率
    let crf = 28; // 默认高压缩
    let resolution: any = 'original';

    if (maxFileSize && videoInfo.duration > 0) {
      // 根据目标文件大小计算 CRF
      const targetBitrate = (maxFileSize * 8 * 1024) / videoInfo.duration; // kbps
      crf = this.bitrateToCrf(targetBitrate);

      // 如果是高分辨率，降低分辨率
      if (videoInfo.width > 1920) {
        resolution = { width: 1920, height: 1080 };
      } else if (videoInfo.width > 1280) {
        resolution = { width: 1280, height: 720 };
      }
    }

    return {
      format: 'mp4',
      videoCodec: 'libx265', // H.265 压缩率更高
      audioCodec: 'aac',
      qualityMode: 'crf',
      crf: Math.min(crf, 32), // 限制最高值
      preset: 'medium',
      resolution,
      framerate: 'original',
      audioBitrate: '96k', // 降低音频比特率
      useHardwareAccel: false,
    };
  }

  /**
   * 优化速度
   */
  private optimizeForSpeed(_videoInfo: VideoInfo): Partial<TranscodeConfig> {
    // 检测平台，选择硬件加速
    const platform = process.platform;
    let hwaccel: 'videotoolbox' | 'nvenc' | 'none' = 'none';

    if (platform === 'darwin') {
      hwaccel = 'videotoolbox';
    }
    // Windows/Linux 可以检测 NVIDIA 显卡，这里简化处理

    return {
      format: 'mp4',
      videoCodec: 'libx264', // H.264 编码更快
      audioCodec: 'aac',
      qualityMode: 'crf',
      crf: 23,
      preset: 'veryfast', // 最快预设
      resolution: 'original',
      framerate: 'original',
      audioBitrate: '128k',
      useHardwareAccel: hwaccel !== 'none',
      hwaccel,
    };
  }

  /**
   * 平衡优化
   */
  private optimizeBalanced(videoInfo: VideoInfo): Partial<TranscodeConfig> {
    // 根据分辨率选择编码器
    const useH265 = videoInfo.width >= 1920; // 1080p 以上用 H.265

    return {
      format: 'mp4',
      videoCodec: useH265 ? 'libx265' : 'libx264',
      audioCodec: 'aac',
      qualityMode: 'crf',
      crf: 23,
      preset: 'medium',
      resolution: 'original',
      framerate: 'original',
      audioBitrate: '128k',
      useHardwareAccel: false,
    };
  }

  /**
   * 预估文件大小（MB）
   */
  async estimateFileSize(videoInfo: VideoInfo, config: TranscodeConfig): Promise<number> {
    try {
      // 基础计算：比特率 × 时长
      const targetBitrate = this.estimateBitrate(videoInfo, config);
      const audioSize = this.estimateAudioSize(videoInfo.duration, config.audioBitrate);
      const videoSize = (targetBitrate * videoInfo.duration) / 8 / 1024; // MB

      return Math.round(videoSize + audioSize);
    } catch (error) {
      log.error('预估文件大小失败:', error);
      return 0;
    }
  }

  /**
   * 预估转码时间（秒）
   */
  async estimateTranscodeTime(
    videoInfo: VideoInfo,
    config: TranscodeConfig
  ): Promise<number> {
    try {
      // 基础速度（基于实测数据）
      let speed = 1.0; // 1x 实时速度

      // 预设影响
      const presetSpeedMap: Record<string, number> = {
        ultrafast: 8.0,
        superfast: 5.0,
        veryfast: 3.0,
        faster: 2.0,
        fast: 1.5,
        medium: 1.0,
        slow: 0.5,
        slower: 0.3,
        veryslow: 0.15,
      };
      speed *= presetSpeedMap[config.preset] || 1.0;

      // 编码器影响
      if (config.videoCodec === 'libx265') {
        speed *= 0.3; // H.265 慢 3 倍
      }

      // 硬件加速影响
      if (config.useHardwareAccel) {
        speed *= 5.0; // 硬件加速快 5 倍
      }

      // 分辨率影响
      const pixels = videoInfo.width * videoInfo.height;
      if (pixels > 1920 * 1080) {
        speed *= 0.5; // 4K 慢一半
      }

      return Math.round(videoInfo.duration / speed);
    } catch (error) {
      log.error('预估转码时间失败:', error);
      return 0;
    }
  }

  /**
   * 预估比特率（kbps）
   */
  private estimateBitrate(videoInfo: VideoInfo, config: TranscodeConfig): number {
    if (config.qualityMode === 'bitrate' && config.videoBitrate) {
      return parseInt(config.videoBitrate) * 1000;
    }

    // 根据 CRF 和分辨率估算
    const crf = config.crf || 23;
    const resolution = config.resolution === 'original' ? videoInfo.width : config.resolution?.width || videoInfo.width;

    // CRF 对比特率的影响（经验公式）
    const crfFactor = Math.pow(2, (23 - crf) / 6);

    // 分辨率对比特率的影响
    let baseBitrate = 2000; // 720p 基准
    if (resolution >= 3840) baseBitrate = 8000; // 4K
    else if (resolution >= 2560) baseBitrate = 5000; // 1440p
    else if (resolution >= 1920) baseBitrate = 3000; // 1080p
    else if (resolution >= 1280) baseBitrate = 2000; // 720p
    else baseBitrate = 1000; // 480p

    // H.265 比特率约为 H.264 的 50%
    if (config.videoCodec === 'libx265') {
      baseBitrate *= 0.5;
    }

    return Math.round(baseBitrate * crfFactor);
  }

  /**
   * 预估音频大小（MB）
   */
  private estimateAudioSize(duration: number, audioBitrate?: string): number {
    if (!audioBitrate) return 0;

    const bitrate = parseInt(audioBitrate) || 128; // kbps
    return (bitrate * duration) / 8 / 1024; // MB
  }

  /**
   * 比特率转 CRF（粗略）
   */
  private bitrateToCrf(bitrate: number): number {
    // 经验映射
    if (bitrate > 8000) return 18;
    if (bitrate > 5000) return 20;
    if (bitrate > 3000) return 23;
    if (bitrate > 1500) return 26;
    if (bitrate > 800) return 28;
    return 30;
  }

  /**
   * 填充默认配置
   */
  private fillDefaultConfig(config: Partial<TranscodeConfig>): TranscodeConfig {
    return {
      inputPath: '',
      outputPath: '',
      format: config.format || 'mp4',
      videoCodec: config.videoCodec || 'libx264',
      audioCodec: config.audioCodec || 'aac',
      resolution: config.resolution || 'original',
      framerate: config.framerate || 'original',
      qualityMode: config.qualityMode || 'crf',
      crf: config.crf || 23,
      preset: config.preset || 'medium',
      useHardwareAccel: config.useHardwareAccel || false,
      hwaccel: config.hwaccel || 'none',
      ...config,
    } as TranscodeConfig;
  }
}

