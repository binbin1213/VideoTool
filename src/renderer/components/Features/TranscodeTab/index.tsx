import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFileVideo, FaRobot, FaTools } from 'react-icons/fa';
import styles from './TranscodeTab.module.scss';
import { FileSelector } from './components/FileSelector';
import { AIMode } from './components/AIMode';
import { ManualMode } from './components/ManualMode';
import { useVideoInfo } from './hooks/useVideoInfo';
import { useTranscodeConfig } from './hooks/useTranscodeConfig';
import { useAIOptimizer } from './hooks/useAIOptimizer';

function TranscodeTab() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const pendingSwitchToManual = useRef(false);

  // Hooks
  const {
    videoFile,
    videoInfo,
    loading: videoLoading,
    selectVideo,
  } = useVideoInfo();

  const {
    outputPath,
    config,
    isProcessing,
    progress,
    selectOutputPath,
    updateConfig,
    startTranscode,
  } = useTranscodeConfig();

  const {
    aiPlatform,
    aiApiKey,
    aiSuggestion,
    analyzing,
    setAiEnabled,
    setAiPlatform,
    setAiApiKey,
    analyzeVideo,
    applyAISuggestion,
    testConnection,
  } = useAIOptimizer();

  // 监听配置变化，当配置更新后切换到手动模式
  useEffect(() => {
    if (pendingSwitchToManual.current && config.resolution) {
      console.log('🔄 配置已更新，准备切换模式');
      console.log('📊 最新的 config:', config);
      console.log('  - resolution:', config.resolution);
      console.log('  - format:', config.format);
      console.log('  - videoCodec:', config.videoCodec);
      
      pendingSwitchToManual.current = false;
      setMode('manual');
      console.log('✅ 已切换到手动模式');
      
      setTimeout(() => {
        alert('AI方案已应用！您可以在手动模式中查看和调整参数。');
      }, 100);
    }
  }, [config]);

  const handleSelectVideo = async () => {
    try {
      const info = await selectVideo();
      if (info) {
        // 自动设置输出路径
        const defaultOutput = videoFile.replace(/\.[^.]+$/, '_转码.mp4');
        await selectOutputPath(defaultOutput.split(/[\\/]/).pop() || '转码视频.mp4');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectOutput = async () => {
    try {
      await selectOutputPath(videoFile.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '_转码.mp4') || '转码视频.mp4');
    } catch (error) {
      console.error(error);
    }
  };

  const handlePlatformChange = (platform: 'deepseek' | 'openai') => {
    setAiPlatform(platform);
  };

  const handleApiKeyChange = (key: string) => {
    setAiApiKey(key);
    setAiEnabled(!!key); // 有API Key就启用AI
  };

  const handleStartTranscode = async () => {
    if (!videoFile) {
      alert('请先选择输入视频文件');
      return;
    }
    if (!outputPath) {
      alert('请先选择输出路径');
      return;
    }

    try {
      await startTranscode(videoFile);
      alert('转码完成！');
    } catch (error: any) {
      alert(error.message || '转码失败');
    }
  };

  const handleAcceptAISuggestion = async () => {
    try {
      const aiConfig = await applyAISuggestion();
      console.log('🤖 AI返回的原始配置:', aiConfig);
      
      if (aiConfig) {
        // 转换AI配置格式为手动模式配置格式
        const manualConfig: any = {};

        // 基础参数 - 直接映射
        if (aiConfig.format) manualConfig.format = aiConfig.format;
        if (aiConfig.videoCodec) manualConfig.videoCodec = aiConfig.videoCodec;
        if (aiConfig.audioCodec) manualConfig.audioCodec = aiConfig.audioCodec;
        if (aiConfig.crf !== undefined) manualConfig.crf = aiConfig.crf;
        if (aiConfig.preset) manualConfig.preset = aiConfig.preset;

        // 处理音频比特率 - 确保格式正确
        if (aiConfig.audioBitrate) {
          const bitrate = aiConfig.audioBitrate.toString();
          // 确保有k后缀
          manualConfig.audioBitrate = bitrate.includes('k') ? bitrate : `${bitrate}k`;
        }

        // 处理分辨率 - AI可能返回对象或字符串
        if (aiConfig.resolution) {
          if (typeof aiConfig.resolution === 'object' && aiConfig.resolution.width) {
            // AI返回了对象 {width, height}
            const { width, height } = aiConfig.resolution;
            // 转换为 VideoTab 期望的格式 "widthxheight"
            manualConfig.resolution = `${width}x${height}`;
          } else if (aiConfig.resolution === 'original') {
            // AI返回了 'original' 字符串
            manualConfig.resolution = 'original';
          } else {
            // 其他字符串格式，尝试解析或直接使用
            manualConfig.resolution = aiConfig.resolution;
          }
        } else {
          // 如果AI没有返回分辨率，默认为原始
          manualConfig.resolution = 'original';
        }

        // 处理帧率
        if (aiConfig.framerate) {
          manualConfig.framerate = aiConfig.framerate;
        } else {
          manualConfig.framerate = 'original';
        }

        // 其他可能的字段
        if (aiConfig.audioChannels) {
          manualConfig.audioChannels = aiConfig.audioChannels.toString();
        }

        console.log('📝 转换后的手动模式配置:', manualConfig);
        console.log('📦 转换前的当前配置:', config);
        console.log('🔍 详细字段对比:');
        console.log('  - format:', aiConfig.format, '→', manualConfig.format);
        console.log('  - videoCodec:', aiConfig.videoCodec, '→', manualConfig.videoCodec);
        console.log('  - audioCodec:', aiConfig.audioCodec, '→', manualConfig.audioCodec);
        console.log('  - crf:', aiConfig.crf, '→', manualConfig.crf);
        console.log('  - preset:', aiConfig.preset, '→', manualConfig.preset);
        console.log('  - resolution:', aiConfig.resolution, '→', manualConfig.resolution);
        console.log('  - audioBitrate:', aiConfig.audioBitrate, '→', manualConfig.audioBitrate);

        // 设置待切换标记
        pendingSwitchToManual.current = true;
        console.log('🔄 准备更新配置并切换模式...');
        
        // 应用配置（useEffect 会监听 config 变化并自动切换模式）
        updateConfig(manualConfig);
      }
    } catch (error: any) {
      console.error('❌ 应用AI方案失败:', error);
      alert(error.message || '应用AI方案失败');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>
          <FaFileVideo />
          {t('transcode.title') || '视频转码'}
        </h2>
      </div>

      {/* Mode Toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${mode === 'ai' ? styles.active : ''}`}
          onClick={() => setMode('ai')}
        >
          <FaRobot />
          <span>{t('transcode.aiMode') || 'AI决策模式'}</span>
          <span className={styles.badge}>{t('transcode.recommended') || '推荐'}</span>
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'manual' ? styles.active : ''}`}
          onClick={() => setMode('manual')}
        >
          <FaTools />
          <span>{t('transcode.manualMode') || '手动模式'}</span>
          <span className={styles.badge}>{t('transcode.professional') || '专业'}</span>
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.mainArea}>
          {/* 文件选择 */}
          <FileSelector
            videoFile={videoFile}
            videoInfo={videoInfo}
            outputPath={outputPath}
            loading={videoLoading}
            onSelectVideo={handleSelectVideo}
            onSelectOutput={handleSelectOutput}
          />

          {/* 模式内容 */}
          {mode === 'ai' ? (
            <AIMode
              videoInfo={videoInfo}
              aiSuggestion={aiSuggestion}
              analyzing={analyzing}
              aiPlatform={aiPlatform}
              apiKey={aiApiKey}
              onPlatformChange={handlePlatformChange}
              onApiKeyChange={handleApiKeyChange}
              onTestConnection={testConnection}
              onAnalyze={analyzeVideo}
              onAcceptSuggestion={handleAcceptAISuggestion}
              onSwitchToManual={() => setMode('manual')}
            />
          ) : (
            <>
              <ManualMode
                config={config}
                videoInfo={videoInfo}
                onConfigChange={updateConfig}
              />
              
              {/* 转码控制区域 */}
              <div className={styles.transcodeControl}>
                <button
                  className={styles.startButton}
                  onClick={handleStartTranscode}
                  disabled={!videoFile || !outputPath || isProcessing}
                >
                  {isProcessing ? '转码中...' : '开始转码'}
                </button>
                
                {isProcessing && (
                  <div className={styles.progressArea}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>{progress.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.infoArea}>
          <div className={styles.infoSection}>
            <div className={styles.infoHeader}>
              <span>{t('transcode.modeGuide') || '模式说明'}</span>
            </div>
            <div className={styles.infoContent}>
              {mode === 'ai' ? (
                <>
                  <h4>{t('transcode.aiModeTitle')}</h4>
                  <p>{t('transcode.aiModeDesc')}</p>
                  <ul>
                    <li>{t('transcode.aiModeFeature1')}</li>
                    <li>{t('transcode.aiModeFeature2')}</li>
                    <li>{t('transcode.aiModeFeature3')}</li>
                    <li>{t('transcode.aiModeFeature4')}</li>
                  </ul>
                </>
              ) : (
                <>
                  <h4>{t('transcode.manualModeTitle')}</h4>
                  <p>{t('transcode.manualModeDesc')}</p>
                  <ul>
                    <li>{t('transcode.manualModeFeature1')}</li>
                    <li>{t('transcode.manualModeFeature2')}</li>
                    <li>{t('transcode.manualModeFeature3')}</li>
                    <li>{t('transcode.manualModeFeature4')}</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TranscodeTab;

