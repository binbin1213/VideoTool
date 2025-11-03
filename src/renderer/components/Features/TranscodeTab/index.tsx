import { useState } from 'react';
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
    selectOutputPath,
    updateConfig,
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

  const handleAcceptAISuggestion = async () => {
    try {
      const aiConfig = await applyAISuggestion();
      if (aiConfig) {
        // 将AI建议应用到转码配置
        updateConfig(aiConfig);
        // 切换到手动模式，让用户看到并可以微调参数
        setMode('manual');
        alert('AI方案已应用！已切换到手动模式，您可以查看和调整参数。');
      }
    } catch (error: any) {
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
            <ManualMode
              config={config}
              onConfigChange={updateConfig}
            />
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

