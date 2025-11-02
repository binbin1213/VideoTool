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

    // 检查是否可以用copy（避免不必要的转码）
    const copyResult = this.checkCopyOptimization(videoInfo, goal);
    if (copyResult) {
      return copyResult;
    }

    // 根据场景选择优化策略
    let result: OptimizationSuggestion;

    switch (goal.target) {
      case 'mobile':
        result = this.optimizeForMobile(videoInfo);
        break;
      
      case 'web':
        result = this.optimizeForWeb(videoInfo);
        break;
      
      case 'archive':
        result = this.optimizeForArchive(videoInfo);
        break;
      
      case 'compress':
        result = this.optimizeForCompress(videoInfo, goal.maxFileSize);
        break;
      
      case 'fast':
        result = this.optimizeForFast(videoInfo);
        break;

      case 'quality':
        result = this.optimizeForQualityLegacy(videoInfo);
        break;

      case 'size':
        result = this.optimizeForSizeLegacy(videoInfo, goal.maxFileSize);
        break;

      case 'speed':
        result = this.optimizeForSpeedLegacy(videoInfo);
        break;

      case 'balanced':
      case 'custom':
      default:
        result = this.optimizeBalanced(videoInfo);
        break;
    }

    // 合并基础配置
    if (baseConfig) {
      result.config = { ...result.config, ...baseConfig };
    }

    return result;
  }

  /**
   * 检查是否可以使用copy（无损转码）
   */
  private checkCopyOptimization(videoInfo: VideoInfo, goal: OptimizationGoal): OptimizationSuggestion | null {
    // compress场景总是需要重新编码
    if (goal.target === 'compress' || goal.target === 'size') {
      return null;
    }

    const videoCodec = videoInfo.videoCodec.toLowerCase();
    const audioCodec = videoInfo.audioCodec.toLowerCase();
    const formatName = videoInfo.formatName.toLowerCase();
    const bitrateInMbps = videoInfo.bitrate / 1000000;
    const width = videoInfo.width || 1920;

    // 检查编码是否现代
    const isModernVideoCodec = ['h264', 'hevc', 'h265'].includes(videoCodec);
    const isModernAudioCodec = ['aac', 'mp3', 'opus'].includes(audioCodec);
    
    if (!isModernVideoCodec || !isModernAudioCodec) {
      return null; // 编码过时，需要转码
    }

    // 检查容器格式
    const needsContainerConversion = !['mp4', 'mov'].includes(formatName);

    // 检查编码兼容性
    const isH264 = videoCodec === 'h264';

    // Web/Mobile场景需要H.264
    if ((goal.target === 'web' || goal.target === 'mobile') && !isH264) {
      return null; // H.265不兼容，需要转码
    }

    // mobile场景：4K降到1080p
    if (goal.target === 'mobile' && width > 1920) {
      return null; // 需要降低分辨率
    }

    // 检查码率是否合理
    let maxBitrate = 10;
    if (width <= 1280) maxBitrate = 6;
    else if (width <= 1920) maxBitrate = 10;
    else if (width <= 2560) maxBitrate = 20;
    else maxBitrate = 50;

    if (bitrateInMbps > maxBitrate) {
      return null; // 码率过高，需要重新编码
    }

    // 可以使用copy
    const format = needsContainerConversion ? 'mp4' : formatName;
    let reason = '';

    if (needsContainerConversion) {
      reason = `原视频编码已是${videoCodec.toUpperCase()}+${audioCodec.toUpperCase()}，只需从${formatName.toUpperCase()}转换容器到MP4，使用copy模式无损最快`;
    } else {
      reason = `原视频已是${videoCodec.toUpperCase()}+${audioCodec.toUpperCase()}+MP4，参数合理（码率${bitrateInMbps.toFixed(1)}Mbps），无需转码`;
    }

    log.info('规则优化器：可以使用copy模式');

    return {
      config: {
        format: format as any,
        videoCodec: 'copy' as any,
        audioCodec: 'copy' as any,
        resolution: 'original',
        framerate: 'original',
        qualityMode: undefined,
        crf: undefined,
        preset: undefined,
        audioBitrate: undefined,
        useHardwareAccel: false,
        hwaccel: 'none',
      },
      reason,
      estimatedSize: Math.round(videoInfo.size / 1024 / 1024),
      estimatedTime: Math.round(videoInfo.duration * 0.05), // copy很快，约5%时间
      confidence: 0.95,
    };
  }

  /**
   * 移动设备场景
   */
  private optimizeForMobile(videoInfo: VideoInfo): OptimizationSuggestion {
    const width = videoInfo.width || 1920;
    let config: Partial<TranscodeConfig>;
    let reason: string;

    if (width > 1920) {
      // 4K降到1080p
      config = {
        format: 'mp4',
        videoCodec: 'libx264',
        audioCodec: 'aac',
        resolution: { width: 1920, height: 1080 },
        framerate: 'original',
        qualityMode: 'crf',
        crf: 24,
        preset: 'fast',
        audioBitrate: '128k',
        useHardwareAccel: false,
        hwaccel: 'none',
      };
      reason = '移动设备场景：原视频4K，降至1080p确保兼容性和流畅播放，使用H.264+fast预设';
    } else {
      // 1080p及以下，重新编码但保持分辨率
      config = {
        format: 'mp4',
        videoCodec: 'libx264',
        audioCodec: 'aac',
        resolution: 'original',
        framerate: 'original',
        qualityMode: 'crf',
        crf: 25,
        preset: 'fast',
        audioBitrate: '128k',
        useHardwareAccel: false,
        hwaccel: 'none',
      };
      reason = '移动设备场景：使用H.264确保兼容性，适度压缩（CRF 25）平衡质量和大小';
    }

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason,
      estimatedSize: this.estimateFileSizeSync(videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(videoInfo, fullConfig),
      confidence: 0.9,
    };
  }

  /**
   * Web播放场景
   */
  private optimizeForWeb(videoInfo: VideoInfo): OptimizationSuggestion {
    const config: Partial<TranscodeConfig> = {
      format: 'mp4',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      resolution: 'original',
      framerate: 'original',
      qualityMode: 'crf',
      crf: 23,
      preset: 'medium',
      audioBitrate: '128k',
      useHardwareAccel: false,
      hwaccel: 'none',
    };

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: 'Web播放场景：使用H.264+AAC确保最佳兼容性，CRF 23平衡质量和文件大小',
      estimatedSize: this.estimateFileSizeSync(videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(videoInfo, fullConfig),
      confidence: 0.9,
    };
  }

  /**
   * 高质量存档场景
   */
  private optimizeForArchive(videoInfo: VideoInfo): OptimizationSuggestion {
    const width = videoInfo.width || 1920;
    const useH265 = width >= 1920; // 1080p及以上使用H.265

    const config: Partial<TranscodeConfig> = {
      format: 'mkv',
      videoCodec: useH265 ? 'libx265' : 'libx264',
      audioCodec: 'aac',
      resolution: 'original',
      framerate: 'original',
      qualityMode: 'crf',
      crf: 18,
      preset: 'slow',
      audioBitrate: '192k',
      useHardwareAccel: false,
      hwaccel: 'none',
    };

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: `高质量存档场景：使用${useH265 ? 'H.265' : 'H.264'}+低CRF值(18)保持最佳质量，slow预设优化压缩效率`,
      estimatedSize: this.estimateFileSizeSync(videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(videoInfo, fullConfig),
      confidence: 0.9,
    };
  }

  /**
   * 极致压缩场景
   */
  private optimizeForCompress(videoInfo: VideoInfo, maxFileSize?: number): OptimizationSuggestion {
    const width = videoInfo.width || 1920;
    let resolution: any = 'original';
    let crf = 28;

    // 降低分辨率以压缩
    if (width > 1920) {
      resolution = { width: 1280, height: 720 };
    } else if (width > 1280) {
      resolution = { width: 1280, height: 720 };
    }

    // 如果有目标文件大小，调整CRF
    if (maxFileSize && videoInfo.duration > 0) {
      const currentSize = videoInfo.size / 1024 / 1024; // MB
      if (currentSize > maxFileSize * 1.5) {
        crf = 30;
      }
    }

    const config: Partial<TranscodeConfig> = {
      format: 'mp4',
      videoCodec: 'libx265',
      audioCodec: 'aac',
      resolution,
      framerate: 'original',
      qualityMode: 'crf',
      crf: Math.min(crf, 30),
      preset: 'medium',
      audioBitrate: '64k',
      useHardwareAccel: false,
      hwaccel: 'none',
    };

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: `极致压缩场景：使用H.265+高CRF值(${crf})，${resolution !== 'original' ? '降低分辨率到720p，' : ''}降低音频码率到64k，显著减小文件大小`,
      estimatedSize: this.estimateFileSizeSync(videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(videoInfo, fullConfig),
      confidence: 0.85,
    };
  }

  /**
   * 快速转码场景
   */
  private optimizeForFast(videoInfo: VideoInfo): OptimizationSuggestion {
    const platform = process.platform;
    let hwaccel: 'videotoolbox' | 'nvenc' | 'none' = 'none';
    let useHardwareAccel = false;

    if (platform === 'darwin') {
      hwaccel = 'videotoolbox';
      useHardwareAccel = true;
    }

    const config: Partial<TranscodeConfig> = {
      format: 'mp4',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      resolution: 'original',
      framerate: 'original',
      qualityMode: 'crf',
      crf: 23,
      preset: 'veryfast',
      audioBitrate: '128k',
      useHardwareAccel,
      hwaccel,
    };

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: `快速转码场景：使用veryfast预设${useHardwareAccel ? '+硬件加速' : ''}，最大化转码速度`,
      estimatedSize: this.estimateFileSizeSync(videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(videoInfo, fullConfig),
      confidence: 0.9,
    };
  }

  /**
   * 优化质量（旧版兼容）
   */
  private optimizeForQualityLegacy(_videoInfo: VideoInfo): OptimizationSuggestion {
    const config: Partial<TranscodeConfig> = {
      format: 'mkv',
      videoCodec: 'libx265',
      audioCodec: 'flac',
      qualityMode: 'crf',
      crf: 18,
      preset: 'slow',
      resolution: 'original',
      framerate: 'original',
      audioBitrate: undefined,
      useHardwareAccel: false,
    };

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: '优化画质：使用H.265+低CRF值+无损音频，保证最佳质量',
      estimatedSize: this.estimateFileSizeSync(_videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(_videoInfo, fullConfig),
      confidence: 0.8,
    };
  }

  /**
   * 优化文件大小（旧版兼容）
   */
  private optimizeForSizeLegacy(
    videoInfo: VideoInfo,
    maxFileSize?: number
  ): OptimizationSuggestion {
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

    const config: Partial<TranscodeConfig> = {
      format: 'mp4',
      videoCodec: 'libx265',
      audioCodec: 'aac',
      qualityMode: 'crf',
      crf: Math.min(crf, 32),
      preset: 'medium',
      resolution,
      framerate: 'original',
      audioBitrate: '96k',
      useHardwareAccel: false,
    };

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: '优化文件大小：使用H.265+高CRF值，降低分辨率和音频码率',
      estimatedSize: this.estimateFileSizeSync(videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(videoInfo, fullConfig),
      confidence: 0.8,
    };
  }

  /**
   * 优化速度（旧版兼容）
   */
  private optimizeForSpeedLegacy(_videoInfo: VideoInfo): OptimizationSuggestion {
    // 检测平台，选择硬件加速
    const platform = process.platform;
    let hwaccel: 'videotoolbox' | 'nvenc' | 'none' = 'none';

    if (platform === 'darwin') {
      hwaccel = 'videotoolbox';
    }
    // Windows/Linux 可以检测 NVIDIA 显卡，这里简化处理

    const config: Partial<TranscodeConfig> = {
      format: 'mp4',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      qualityMode: 'crf',
      crf: 23,
      preset: 'veryfast',
      resolution: 'original',
      framerate: 'original',
      audioBitrate: '128k',
      useHardwareAccel: hwaccel !== 'none',
      hwaccel,
    };

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: '优化速度：使用veryfast预设+硬件加速，最快转码',
      estimatedSize: this.estimateFileSizeSync(_videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(_videoInfo, fullConfig),
      confidence: 0.8,
    };
  }

  /**
   * 平衡优化
   */
  private optimizeBalanced(videoInfo: VideoInfo): OptimizationSuggestion {
    const useH265 = videoInfo.width >= 1920;

    const config: Partial<TranscodeConfig> = {
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

    const fullConfig = this.fillDefaultConfig(config);
    return {
      config,
      reason: '平衡模式：在质量、大小和速度间取得最佳平衡',
      estimatedSize: this.estimateFileSizeSync(videoInfo, fullConfig),
      estimatedTime: this.estimateTranscodeTimeSync(videoInfo, fullConfig),
      confidence: 0.85,
    };
  }

  /**
   * 同步版本的文件大小估算
   */
  private estimateFileSizeSync(videoInfo: VideoInfo, config: TranscodeConfig): number {
    try {
      // 如果是copy模式，返回原文件大小
      if (config.videoCodec === 'copy' || config.videoCodec === 'copy' as any) {
        return Math.round(videoInfo.size / 1024 / 1024);
      }

      const targetBitrate = this.estimateBitrate(videoInfo, config);
      const audioSize = this.estimateAudioSize(videoInfo.duration, config.audioBitrate);
      const videoSize = (targetBitrate * videoInfo.duration) / 8 / 1024;

      return Math.round(videoSize + audioSize);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 同步版本的转码时间估算
   */
  private estimateTranscodeTimeSync(videoInfo: VideoInfo, config: TranscodeConfig): number {
    try {
      // 如果是copy模式，很快
      if (config.videoCodec === 'copy' || config.videoCodec === 'copy' as any) {
        return Math.round(videoInfo.duration * 0.05);
      }

      let speed = 1.0;

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

      if (config.videoCodec === 'libx265') {
        speed *= 0.3;
      }

      if (config.useHardwareAccel) {
        speed *= 5.0;
      }

      const pixels = videoInfo.width * videoInfo.height;
      if (pixels > 1920 * 1080) {
        speed *= 0.5;
      }

      return Math.round(videoInfo.duration / speed);
    } catch (error) {
      return 0;
    }
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

