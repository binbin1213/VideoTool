import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaRobot } from 'react-icons/fa';
import buttonStyles from '../../../../../styles/components/Button.module.scss';
import basicStyles from '../ManualMode/BasicTab.module.scss';
import { SceneSelector } from './SceneSelector';
import { AIConfig } from './AIConfig';
import { AISuggestion } from './AISuggestion';

interface AIModeProps {
  videoInfo: any;
  aiSuggestion: any;
  analyzing: boolean;
  aiPlatform: 'deepseek' | 'openai';
  apiKey: string;
  onPlatformChange: (platform: 'deepseek' | 'openai') => void;
  onApiKeyChange: (apiKey: string) => void;
  onTestConnection: () => Promise<any>;
  onAnalyze: (videoInfo: any, goal: string) => Promise<void>;
  onAcceptSuggestion: () => void;
  onSwitchToManual: () => void;
}

export const AIMode = ({
  videoInfo,
  aiSuggestion,
  analyzing,
  aiPlatform,
  apiKey,
  onPlatformChange,
  onApiKeyChange,
  onTestConnection,
  onAnalyze,
  onAcceptSuggestion,
  onSwitchToManual,
}: AIModeProps) => {
  const { t } = useTranslation();
  const [selectedScene, setSelectedScene] = useState('mobile');
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await onTestConnection();
      if (result.ai) {
        alert(t('transcode.connectionSuccess'));
      } else {
        alert(t('transcode.connectionFailed'));
      }
    } catch (error: any) {
      alert(error.message || t('transcode.connectionFailed'));
    } finally {
      setTesting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!videoInfo) {
      alert(t('transcode.noVideoSelected'));
      return;
    }
    try {
      await onAnalyze(videoInfo, selectedScene);
    } catch (error: any) {
      alert(error.message || t('transcode.analysisFailed'));
    }
  };

  const handleReanalyze = () => {
    handleAnalyze();
  };

  const handleTweak = () => {
    onSwitchToManual();
  };

  return (
    <div className={basicStyles.container}>
      {/* 场景选择 */}
      <SceneSelector
        selectedScene={selectedScene}
        onSelectScene={setSelectedScene}
        disabled={analyzing}
      />

      {/* AI配置 */}
      <AIConfig
        platform={aiPlatform}
        apiKey={apiKey}
        onPlatformChange={onPlatformChange}
        onApiKeyChange={onApiKeyChange}
        onTestConnection={handleTestConnection}
        testing={testing}
      />

      {/* 分析按钮 */}
      {!aiSuggestion && (
        <div style={{ marginTop: '16px' }}>
          <button
            className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonLarge}`}
            onClick={handleAnalyze}
            disabled={!videoInfo || analyzing}
          >
            <FaRobot />
            {analyzing ? t('transcode.analyzing') : t('transcode.startAnalysis')}
          </button>
          {!apiKey && (
            <div className={basicStyles.hint} style={{ marginTop: '8px' }}>
              💡 {t('transcode.noApiKeyHint') || '未配置API Key时将使用规则引擎（快速、免费）'}
            </div>
          )}
        </div>
      )}

      {/* AI建议 */}
      {aiSuggestion && (
        <AISuggestion
          suggestion={aiSuggestion}
          onAccept={onAcceptSuggestion}
          onTweak={handleTweak}
          onReanalyze={handleReanalyze}
        />
      )}
    </div>
  );
};

