import { useTranslation } from 'react-i18next';
import basicStyles from '../ManualMode/BasicTab.module.scss';
import buttonStyles from '../../../../../styles/components/Button.module.scss';

interface AIConfigProps {
  platform: 'deepseek' | 'openai';
  apiKey: string;
  onPlatformChange: (platform: 'deepseek' | 'openai') => void;
  onApiKeyChange: (apiKey: string) => void;
  onTestConnection: () => Promise<void>;
  testing?: boolean;
}

export const AIConfig = ({
  platform,
  apiKey,
  onPlatformChange,
  onApiKeyChange,
  onTestConnection,
  testing,
}: AIConfigProps) => {
  const { t } = useTranslation();

  return (
    <>
      {/* 平台选择 + API Key输入框 */}
      <div className={basicStyles.row}>
        <div className={basicStyles.field}>
          <label className={basicStyles.label}>{t('transcode.aiPlatform')}</label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '28px' }}>
            <label className={basicStyles.checkbox}>
              <input
                type="radio"
                name="platform"
                value="deepseek"
                checked={platform === 'deepseek'}
                onChange={() => onPlatformChange('deepseek')}
              />
              <span>DeepSeek</span>
            </label>
            <label className={basicStyles.checkbox}>
              <input
                type="radio"
                name="platform"
                value="openai"
                checked={platform === 'openai'}
                onChange={() => onPlatformChange('openai')}
              />
              <span>OpenAI</span>
            </label>
          </div>
        </div>

        <div className={basicStyles.field}>
          <label className={basicStyles.label}>{t('transcode.apiKey')}</label>
          <input
            type="password"
            className={basicStyles.input}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={t('transcode.enterApiKey')}
          />
        </div>

        <div className={basicStyles.field}>
          <label className={basicStyles.label}>&nbsp;</label>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <button
              onClick={onTestConnection}
              disabled={!apiKey || testing}
              className={buttonStyles.buttonPrimary}
            >
              {testing ? t('transcode.testing') : t('transcode.testConnection')}
            </button>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className={basicStyles.hint} style={{ marginTop: '4px' }}>
        {platform === 'deepseek' ? (
          <>
            {t('transcode.deepseekHint')}
            <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '4px' }}>
              https://platform.deepseek.com
            </a>
          </>
        ) : (
          <>
            {t('transcode.openaiHint')}
            <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '4px' }}>
              https://platform.openai.com
            </a>
          </>
        )}
      </div>
    </>
  );
};

