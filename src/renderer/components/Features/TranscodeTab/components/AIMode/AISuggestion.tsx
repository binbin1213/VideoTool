import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaRedo } from 'react-icons/fa';
import buttonStyles from '../../../../../styles/components/Button.module.scss';
import styles from './AISuggestion.module.scss';

interface AISuggestionProps {
  suggestion: any;
  onAccept: () => void;
  onTweak: () => void;
  onReanalyze: () => void;
}

export const AISuggestion = ({ suggestion, onAccept, onTweak, onReanalyze }: AISuggestionProps) => {
  const { t } = useTranslation();

  if (!suggestion) return null;

  const { config, reason, estimatedSize, confidence } = suggestion;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaCheckCircle className={styles.icon} />
        <span className={styles.title}>{t('transcode.aiRecommendation')}</span>
      </div>

      <div className={styles.content}>
        {/* 参数 */}
        <div className={styles.section}>
          <h4>{t('transcode.parameters')}</h4>
          <div className={styles.params}>
            <div className={styles.param}>
              <span className={styles.label}>{t('transcode.format')}:</span>
              <span className={styles.value}>{config.format?.toUpperCase()}</span>
            </div>
            <div className={styles.param}>
              <span className={styles.label}>{t('transcode.videoCodec')}:</span>
              <span className={styles.value}>{config.videoCodec}</span>
            </div>
            <div className={styles.param}>
              <span className={styles.label}>{t('transcode.audioCodec')}:</span>
              <span className={styles.value}>{config.audioCodec?.toUpperCase()}</span>
            </div>
            <div className={styles.param}>
              <span className={styles.label}>{t('transcode.resolution')}:</span>
              <span className={styles.value}>
                {config.resolution === 'original'
                  ? t('transcode.original')
                  : `${config.resolution?.width}x${config.resolution?.height}`}
              </span>
            </div>
            <div className={styles.param}>
              <span className={styles.label}>{t('transcode.quality')}:</span>
              <span className={styles.value}>CRF {config.crf}</span>
            </div>
            <div className={styles.param}>
              <span className={styles.label}>{t('transcode.preset')}:</span>
              <span className={styles.value}>{config.preset}</span>
            </div>
            <div className={styles.param}>
              <span className={styles.label}>{t('transcode.audioBitrate')}:</span>
              <span className={styles.value}>{config.audioBitrate}</span>
            </div>
          </div>
        </div>

        {/* 推荐理由 */}
        {reason && (
          <div className={styles.section}>
            <h4>{t('transcode.reason')}</h4>
            <p className={styles.reason}>{reason}</p>
          </div>
        )}

        {/* 预估结果 */}
        <div className={styles.section}>
          <h4>{t('transcode.estimation')}</h4>
          <div className={styles.estimates}>
            <div className={styles.estimate}>
              <span className={styles.label}>{t('transcode.estimatedSize')}:</span>
              <span className={styles.value}>~{estimatedSize}MB</span>
            </div>
            <div className={styles.estimate}>
              <span className={styles.label}>{t('transcode.confidence')}:</span>
              <span className={styles.value}>
                {'★'.repeat(Math.round((confidence || 0.9) * 5))}
                {'☆'.repeat(5 - Math.round((confidence || 0.9) * 5))}
                {' '}
                {Math.round((confidence || 0.9) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonMedium}`}
          onClick={onAccept}
        >
          {t('transcode.acceptAI')}
        </button>
        <button
          className={`${buttonStyles.buttonSecondary} ${buttonStyles.buttonMedium}`}
          onClick={onTweak}
        >
          {t('transcode.tweakParams')}
        </button>
        <button
          className={`${buttonStyles.buttonSecondary} ${buttonStyles.buttonMedium}`}
          onClick={onReanalyze}
        >
          <FaRedo />
          {t('transcode.reanalyze')}
        </button>
      </div>
    </div>
  );
};

