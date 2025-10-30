import log from 'electron-log';
import { ParameterOptimizer, OptimizationGoal, OptimizationSuggestion } from './ParameterOptimizer';
import { RuleBasedOptimizer } from './RuleBasedOptimizer';
import { AIOptimizer } from './AIOptimizer';
import type { VideoInfo, AIConfig } from '../../../types/transcode.types';

/**
 * 优化器类型
 */
export type OptimizerType = 'rule' | 'ai' | 'auto';

/**
 * 优化器工厂
 * 负责创建和管理参数优化器
 */
export class OptimizerFactory {
  private static ruleOptimizer: RuleBasedOptimizer | null = null;
  private static aiOptimizer: AIOptimizer | null = null;

  /**
   * 获取优化器
   */
  static async getOptimizer(
    type: OptimizerType = 'auto',
    aiApiKey?: string,
    aiPlatform?: 'deepseek' | 'openai'
  ): Promise<ParameterOptimizer> {
    switch (type) {
      case 'rule':
        return this.getRuleOptimizer();

      case 'ai':
        return this.getAIOptimizer(aiApiKey, aiPlatform);

      case 'auto':
      default:
        return this.getAutoOptimizer(aiApiKey, aiPlatform);
    }
  }

  /**
   * 获取规则优化器（单例）
   */
  private static getRuleOptimizer(): RuleBasedOptimizer {
    if (!this.ruleOptimizer) {
      this.ruleOptimizer = new RuleBasedOptimizer();
      log.info('创建规则优化器');
    }
    return this.ruleOptimizer;
  }

  /**
   * 获取 AI 优化器（单例）
   */
  private static getAIOptimizer(
    apiKey?: string,
    platform: 'deepseek' | 'openai' = 'deepseek'
  ): AIOptimizer {
    if (!apiKey) {
      throw new Error('AI 优化器需要 API Key');
    }

    // 如果平台或 Key 变化，重新创建
    if (
      !this.aiOptimizer ||
      (this.aiOptimizer as any).apiKey !== apiKey ||
      (this.aiOptimizer as any).platform !== platform
    ) {
      this.aiOptimizer = new AIOptimizer(apiKey, platform);
      log.info(`创建 AI 优化器 (${platform})`);
    }

    return this.aiOptimizer;
  }

  /**
   * 自动选择最佳优化器
   * 优先使用 AI，不可用时降级到规则
   */
  private static async getAutoOptimizer(
    aiApiKey?: string,
    aiPlatform?: 'deepseek' | 'openai'
  ): Promise<ParameterOptimizer> {
    // 尝试使用 AI 优化器
    if (aiApiKey) {
      try {
        const aiOptimizer = this.getAIOptimizer(aiApiKey, aiPlatform);
        const available = await aiOptimizer.isAvailable();

        if (available) {
          log.info(`自动选择：AI 优化器 (${aiPlatform})`);
          return aiOptimizer;
        }

        log.info('AI 优化器不可用，降级到规则优化器');
      } catch (error) {
        log.error('创建 AI 优化器失败:', error);
      }
    }

    // 降级到规则优化器
    log.info('自动选择：规则优化器');
    return this.getRuleOptimizer();
  }

  /**
   * 检查所有优化器可用性
   */
  static async checkAvailability(
    aiApiKey?: string,
    aiPlatform?: 'deepseek' | 'openai'
  ): Promise<{
    rule: boolean;
    ai: boolean;
  }> {
    const ruleOptimizer = this.getRuleOptimizer();

    let aiAvailable = false;
    if (aiApiKey) {
      try {
        const aiOptimizer = this.getAIOptimizer(aiApiKey, aiPlatform);
        aiAvailable = await aiOptimizer.isAvailable();
      } catch (error) {
        log.error('检查 AI 可用性失败:', error);
      }
    }

    const ruleAvailable = await ruleOptimizer.isAvailable();

    return {
      rule: ruleAvailable,
      ai: aiAvailable,
    };
  }

  /**
   * 智能优化 - 带预处理逻辑
   * 
   * 策略：
   * 1. 检查是否需要转码（已经完美则建议 copy）
   * 2. 简单场景用规则引擎
   * 3. 复杂场景才调用 AI
   */
  static async smartOptimize(
    videoInfo: VideoInfo,
    goal: OptimizationGoal,
    aiConfig?: AIConfig
  ): Promise<OptimizationSuggestion> {
    // 1. 检查是否已经完美（不需要转码）
    if (this.isPerfectVideo(videoInfo, goal)) {
      log.info('视频已经完美，建议流式复制');
      return {
        config: {
          format: 'mp4',
          videoCodec: 'copy' as any,
          audioCodec: 'copy' as any,
          resolution: 'original',
          framerate: 'original',
          qualityMode: 'crf',
          crf: 23,
          preset: 'medium',
          audioBitrate: '128k',
          useHardwareAccel: false,
          hwaccel: 'none',
        },
        reason: '原视频格式已经很好（H.264/H.265 + AAC + MP4，比特率合理），建议直接使用或流式复制，避免质量损失和时间浪费',
        estimatedSize: Math.round(videoInfo.size / 1024 / 1024),
        estimatedTime: 5, // 流式复制很快
        confidence: 1.0,
      };
    }

    // 2. 检查是否简单场景（用规则就够）
    if (this.isSimpleCase(videoInfo, goal)) {
      log.info('简单场景，使用规则优化器');
      const optimizer = this.getRuleOptimizer();
      return optimizer.optimize(videoInfo, goal);
    }

    // 3. 复杂场景，尝试使用 AI
    if (aiConfig?.enabled && aiConfig.apiKey) {
      try {
        log.info('复杂场景，使用 AI 优化器');
        const optimizer = this.getAIOptimizer(aiConfig.apiKey, aiConfig.platform);
        const available = await optimizer.isAvailable();
        
        if (available) {
          return optimizer.optimize(videoInfo, goal);
        }
        
        log.warn('AI 不可用，降级到规则优化器');
      } catch (error) {
        log.error('AI 优化失败:', error);
      }
    }

    // 4. 降级到规则优化器
    log.info('使用规则优化器');
    const optimizer = this.getRuleOptimizer();
    return optimizer.optimize(videoInfo, goal);
  }

  /**
   * 判断视频是否已经完美（不需要转码）
   */
  private static isPerfectVideo(videoInfo: VideoInfo, goal: OptimizationGoal): boolean {
    // 如果用户明确要求压缩大小，则需要转码
    if (goal.maxFileSize && videoInfo.size > goal.maxFileSize * 1024 * 1024) {
      return false;
    }

    // 检查格式是否已经很好
    const isGoodCodec = ['h264', 'hevc', 'h265'].includes(videoInfo.videoCodec.toLowerCase());
    const isGoodAudio = ['aac', 'mp3'].includes(videoInfo.audioCodec.toLowerCase());
    const isGoodFormat = ['mp4', 'mov'].includes(videoInfo.formatName.toLowerCase());

    if (!isGoodCodec || !isGoodAudio || !isGoodFormat) {
      return false;
    }

    // 检查比特率是否合理（不过高也不过低）
    const bitrateInMbps = videoInfo.bitrate / 1000000;
    const width = videoInfo.width || 1920;

    let minBitrate = 2; // Mbps
    let maxBitrate = 10; // Mbps

    if (width <= 1280) {
      // 720p
      minBitrate = 1.5;
      maxBitrate = 6;
    } else if (width <= 1920) {
      // 1080p
      minBitrate = 2;
      maxBitrate = 10;
    } else if (width <= 2560) {
      // 1440p
      minBitrate = 6;
      maxBitrate = 20;
    } else {
      // 4K+
      minBitrate = 15;
      maxBitrate = 50;
    }

    const isReasonableBitrate = bitrateInMbps >= minBitrate && bitrateInMbps <= maxBitrate;

    const isPerfect = isGoodCodec && isGoodAudio && isGoodFormat && isReasonableBitrate;
    
    if (isPerfect) {
      log.info(`视频已完美: ${videoInfo.videoCodec} + ${videoInfo.audioCodec} + ${videoInfo.formatName}, ${bitrateInMbps.toFixed(2)} Mbps`);
    }

    return isPerfect;
  }

  /**
   * 判断是否简单场景（规则引擎足够）
   */
  private static isSimpleCase(videoInfo: VideoInfo, goal: OptimizationGoal): boolean {
    // 以下场景认为简单，可用规则处理：
    
    // 1. 标准分辨率转换（1080p → 720p, 4K → 1080p）
    const width = videoInfo.width || 1920;
    const isStandardResolution = [1280, 1920, 2560, 3840].includes(width);

    // 2. 常见编码（H.264, H.265）
    const isCommonCodec = ['h264', 'hevc', 'h265'].includes(videoInfo.videoCodec.toLowerCase());

    // 3. 平衡模式（不追求极致）
    const isBalancedGoal = goal.target === 'balanced' || goal.target === 'speed';

    // 4. 无特殊要求
    const noSpecialRequirements = !goal.maxFileSize && !goal.targetQuality;

    const isSimple = isStandardResolution && isCommonCodec && isBalancedGoal && noSpecialRequirements;

    if (isSimple) {
      log.info('简单场景：标准分辨率 + 常见编码 + 平衡模式');
    }

    return isSimple;
  }
}

