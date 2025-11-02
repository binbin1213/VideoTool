import type { TranscodeConfig, VideoInfo } from '../../../types/transcode.types';

/**
 * 优化目标
 */
export interface OptimizationGoal {
  target: 'quality' | 'size' | 'speed' | 'balanced' | 'mobile' | 'web' | 'archive' | 'compress' | 'fast' | 'custom';
  maxFileSize?: number; // MB
  targetQuality?: 'low' | 'medium' | 'high' | 'ultra';
  maxDuration?: number; // 秒（转码时间限制）
}

/**
 * 优化建议
 */
export interface OptimizationSuggestion {
  config: Partial<TranscodeConfig>;
  reason: string;
  estimatedSize?: number; // MB
  estimatedTime?: number; // 秒
  confidence: number; // 0-1
}

/**
 * 参数优化器接口
 * 所有优化器都必须实现这个接口
 */
export abstract class ParameterOptimizer {
  /**
   * 优化器名称
   */
  abstract get name(): string;

  /**
   * 优化器版本
   */
  abstract get version(): string;

  /**
   * 是否可用
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * 分析视频并推荐参数
   */
  abstract optimize(
    videoInfo: VideoInfo,
    goal: OptimizationGoal,
    baseConfig?: Partial<TranscodeConfig>
  ): Promise<OptimizationSuggestion>;

  /**
   * 预估输出文件大小
   */
  abstract estimateFileSize(
    videoInfo: VideoInfo,
    config: TranscodeConfig
  ): Promise<number>;

  /**
   * 预估转码时间
   */
  abstract estimateTranscodeTime(
    videoInfo: VideoInfo,
    config: TranscodeConfig
  ): Promise<number>;
}

