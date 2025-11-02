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
   * 智能优化 - 规则优先策略
   * 
   * 新策略（2024）：
   * 1. 标准场景（mobile/web/archive/compress/fast）→ 规则引擎（快速、免费、可靠）
   * 2. AI模式需要用户明确启用 → AI优化器（灵活、智能）
   * 3. 降级 → 规则引擎
   */
  static async smartOptimize(
    videoInfo: VideoInfo,
    goal: OptimizationGoal,
    aiConfig?: AIConfig
  ): Promise<OptimizationSuggestion> {
    // 标准场景：优先使用规则引擎（快速、免费、可靠）
    const standardScenes = ['mobile', 'web', 'archive', 'compress', 'fast', 'quality', 'size', 'speed', 'balanced', 'custom'];
    
    if (standardScenes.includes(goal.target)) {
      // 用户明确启用AI且提供了API Key
      if (aiConfig?.enabled && aiConfig.apiKey) {
        try {
          log.info(`标准场景 [${goal.target}]，用户启用AI，尝试使用 AI 优化器`);
          const optimizer = this.getAIOptimizer(aiConfig.apiKey, aiConfig.platform);
          const available = await optimizer.isAvailable();
          
          if (available) {
            return optimizer.optimize(videoInfo, goal);
          }
          
          log.warn('AI 不可用，降级到规则优化器');
        } catch (error) {
          log.error('AI 优化失败，降级到规则优化器:', error);
        }
      }
      
      // 默认使用规则引擎（大部分场景）
      log.info(`标准场景 [${goal.target}]，使用规则优化器（快速、免费、可靠）`);
      const optimizer = this.getRuleOptimizer();
      return optimizer.optimize(videoInfo, goal);
    }

    // 非标准场景：降级到规则引擎
    log.info(`场景 [${goal.target}]，使用规则优化器`);
    const optimizer = this.getRuleOptimizer();
    return optimizer.optimize(videoInfo, goal);
  }

}

