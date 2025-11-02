import { useState, useCallback } from 'react';
import type { TranscodeConfig } from '../../../../../types/transcode.types';

const { ipcRenderer } = (window as any).electron;

export const useTranscodeConfig = () => {
  const [outputPath, setOutputPath] = useState<string>('');
  const [config, setConfig] = useState<Partial<TranscodeConfig>>({
    format: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 23,
    preset: 'medium',
    useHardwareAccel: false,
    hwaccel: 'none',
    resolution: 'original',
    framerate: 'original',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectOutputPath = async (defaultName: string = '转码视频.mp4') => {
    try {
      const filePath = await ipcRenderer.invoke('select-output-path', defaultName);
      if (filePath) {
        setOutputPath(filePath);
        return filePath;
      }
      return null;
    } catch (error: any) {
      throw new Error(`选择输出路径失败: ${error.message}`);
    }
  };

  const updateConfig = useCallback((updates: Partial<TranscodeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const startTranscode = async (inputPath: string) => {
    if (!inputPath || !outputPath) {
      throw new Error('请先选择输入文件和输出路径');
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      const fullConfig: TranscodeConfig = {
        inputPath,
        outputPath,
        ...config,
      } as TranscodeConfig;

      // 监听进度
      ipcRenderer.on('transcode-progress', (_: any, progressData: any) => {
        setProgress(progressData.percent);
      });

      await ipcRenderer.invoke('start-transcode', fullConfig);
      setProgress(100);
      setIsProcessing(false);
      return true;
    } catch (error: any) {
      setIsProcessing(false);
      throw new Error(`转码失败: ${error.message}`);
    } finally {
      ipcRenderer.removeAllListeners('transcode-progress');
    }
  };

  const resetConfig = () => {
    setConfig({
      format: 'mp4',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      qualityMode: 'crf',
      crf: 23,
      preset: 'medium',
      useHardwareAccel: false,
      hwaccel: 'none',
      resolution: 'original',
      framerate: 'original',
    });
    setOutputPath('');
    setProgress(0);
  };

  return {
    config,
    outputPath,
    isProcessing,
    progress,
    updateConfig,
    selectOutputPath,
    startTranscode,
    resetConfig,
  };
};

