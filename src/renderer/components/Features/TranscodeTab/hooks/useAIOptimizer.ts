import { useState, useEffect } from 'react';
import type { AIConfig, VideoInfo } from '../../../../../types/transcode.types';

const { ipcRenderer } = (window as any).electron;

// 用户AI配置持久化 key
const AI_SETTINGS_KEY = 'transcode_ai_settings';

export const useAIOptimizer = () => {
  // 从 localStorage 恢复AI配置
  const loadAISettings = () => {
    try {
      const saved = localStorage.getItem(AI_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedSettings = loadAISettings();

  const [aiEnabled, setAiEnabled] = useState(savedSettings.aiEnabled || false);
  const [aiPlatform, setAiPlatform] = useState<'deepseek' | 'openai'>(
    savedSettings.aiPlatform || 'deepseek'
  );
  const [aiApiKey, setAiApiKey] = useState(savedSettings.aiApiKey || '');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 持久化AI配置
  useEffect(() => {
    const settingsToSave = {
      aiEnabled,
      aiPlatform,
      aiApiKey,
    };
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settingsToSave));
  }, [aiEnabled, aiPlatform, aiApiKey]);

  const optimize = async (videoInfo: VideoInfo, goal: string = 'balanced') => {
    if (!videoInfo) {
      throw new Error('请先选择视频文件');
    }

    try {
      setIsOptimizing(true);
      setError(null);

      // 构建AI配置（如果没有API Key，后端会自动降级到规则引擎）
      const aiConfig: AIConfig = {
        enabled: aiEnabled && !!aiApiKey, // 只有有API Key才真正启用AI
        platform: aiPlatform,
        apiKey: aiApiKey || '',
      };

      const suggestion = await ipcRenderer.invoke(
        'optimize-transcode-params',
        videoInfo,
        { target: goal },
        aiConfig
      );

      setAiSuggestion(suggestion);
      setIsOptimizing(false);
      return suggestion;
    } catch (err: any) {
      const errorMsg = `优化分析失败: ${err.message}`;
      setError(errorMsg);
      setIsOptimizing(false);
      throw new Error(errorMsg);
    }
  };

  const testConnection = async () => {
    if (!aiApiKey) {
      throw new Error('请先输入API Key');
    }

    try {
      const aiConfig: AIConfig = {
        enabled: true,
        platform: aiPlatform,
        apiKey: aiApiKey,
      };

      const result = await ipcRenderer.invoke('check-optimizer-availability', aiConfig);
      return result;
    } catch (err: any) {
      throw new Error(`连接测试失败: ${err.message}`);
    }
  };

  const clearSuggestion = () => {
    setAiSuggestion(null);
    setError(null);
  };

  const applyAISuggestion = async () => {
    if (!aiSuggestion) {
      throw new Error('没有AI建议');
    }
    // 这里将AI建议应用到转码配置
    // 在手动模式中可以看到AI推荐的参数
    return aiSuggestion.config;
  };

  return {
    aiEnabled,
    aiPlatform,
    aiApiKey,
    aiSuggestion,
    isOptimizing,
    analyzing: isOptimizing, // 别名
    error,
    setAiEnabled,
    setAiPlatform,
    setAiApiKey,
    optimize,
    analyzeVideo: optimize, // 别名
    testConnection,
    clearSuggestion,
    applyAISuggestion,
  };
};

