import { useTranslation } from 'react-i18next';
import { FaCog, FaCheckCircle } from 'react-icons/fa';
import buttonStyles from '../../../../../styles/components/Button.module.scss';
import styles from './AIConfig.module.scss';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <FaCog />
        <span>{t('transcode.aiConfig')}</span>
      </div>

      <div className={styles.content}>
        {/* 平台选择 */}
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.aiPlatform')}:</label>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                name="platform"
                value="deepseek"
                checked={platform === 'deepseek'}
                onChange={() => onPlatformChange('deepseek')}
              />
              <span>DeepSeek</span>
            </label>
            <label className={styles.radio}>
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

        {/* API Key */}
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.apiKey')}:</label>
          <div className={styles.inputGroup}>
            <input
              type="password"
              className={styles.input}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={t('transcode.enterApiKey')}
            />
            <button
              className={`${buttonStyles.buttonSecondary} ${buttonStyles.buttonSmall}`}
              onClick={onTestConnection}
              disabled={!apiKey || testing}
            >
              <FaCheckCircle />
              {testing ? t('transcode.testing') : t('transcode.testConnection')}
            </button>
          </div>
        </div>

        <div className={styles.hint}>
          {platform === 'deepseek' ? (
            <p>
              {t('transcode.deepseekHint')}
              <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">
                https://platform.deepseek.com
              </a>
            </p>
          ) : (
            <p>
              {t('transcode.openaiHint')}
              <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">
                https://platform.openai.com
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

