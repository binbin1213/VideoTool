import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaRedo } from 'react-icons/fa';
import buttonStyles from '../../../../../styles/components/Button.module.scss';
import basicStyles from '../ManualMode/BasicTab.module.scss';

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
    <div style={{ 
      border: '2px solid #1890ff',
      borderRadius: '8px',
      padding: '12px',
      backgroundColor: 'color-mix(in srgb, #1890ff 8%, var(--vt-color-surface-elev1))', // 使用主题变量 ✅
      marginTop: '16px'
    }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <FaCheckCircle style={{ color: '#1890ff', fontSize: '16px' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1890ff' }}>
          {t('transcode.aiRecommendation')}
        </span>
      </div>

      {/* 参数配置 - 紧凑的两列布局 */}
      <div style={{ 
        fontSize: '12px', 
        lineHeight: '1.8',
        marginBottom: '8px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px 16px'
      }}>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.format')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>{config.format?.toUpperCase()}</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.videoCodec')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>{config.videoCodec}</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.audioCodec')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>{config.audioCodec?.toUpperCase()}</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.resolution')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>
            {config.resolution === 'original'
              ? t('transcode.original')
              : `${config.resolution?.width}x${config.resolution?.height}`}
          </span>
        </div>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.quality')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>CRF {config.crf}</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.preset')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>{config.preset}</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.audioBitrate')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>{config.audioBitrate}</span>
        </div>
      </div>

      {/* 推荐理由 */}
      {reason && (
        <div className={basicStyles.hint} style={{ 
          marginBottom: '8px',
          fontSize: '11px',
          padding: '8px',
          backgroundColor: 'var(--vt-color-surface-elev1)', // 使用主题变量 ✅
          borderLeft: '3px solid #1890ff'
        }}>
          <strong>{t('transcode.reason')}:</strong> {reason}
        </div>
      )}

      {/* 预估结果 - 单行显示 */}
      <div style={{ 
        fontSize: '12px',
        marginBottom: '12px',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.estimatedSize')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 600, color: '#1890ff' }}>~{estimatedSize}MB</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>{t('transcode.confidence')}:</span>
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>
            {'★'.repeat(Math.round((confidence || 0.9) * 5))}
            {'☆'.repeat(5 - Math.round((confidence || 0.9) * 5))}
            {' '}
            {Math.round((confidence || 0.9) * 100)}%
          </span>
        </div>
      </div>

      {/* 操作按钮 - 横排紧凑 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonSmall}`}
          onClick={onAccept}
          style={{ flex: 1 }}
        >
          {t('transcode.acceptAI')}
        </button>
        <button
          className={`${buttonStyles.buttonSecondary} ${buttonStyles.buttonSmall}`}
          onClick={onTweak}
          style={{ flex: 1 }}
        >
          {t('transcode.tweakParams')}
        </button>
        <button
          className={`${buttonStyles.buttonSecondary} ${buttonStyles.buttonSmall}`}
          onClick={onReanalyze}
        >
          <FaRedo />
          {t('transcode.reanalyze')}
        </button>
      </div>
    </div>
  );
};

