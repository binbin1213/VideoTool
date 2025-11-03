import { useTranslation } from 'react-i18next';
import styles from './BasicTab.module.scss';

interface AudioTabProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export const AudioTab = ({ config, onChange }: AudioTabProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 音量调整 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.volume')}:
          <span className={styles.value}>
            {config.volume !== undefined ? `${config.volume > 0 ? '+' : ''}${config.volume}dB` : '0dB'}
          </span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="-20"
          max="20"
          value={config.volume || 0}
          onChange={(e) => onChange('volume', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>{t('transcode.quieter')} (-20dB)</span>
          <span>{t('transcode.original')} (0dB)</span>
          <span>{t('transcode.louder')} (+20dB)</span>
        </div>
      </div>

      {/* 音频延迟 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.audioDelay')}:
          <span className={styles.value}>
            {config.audioDelay !== undefined ? `${config.audioDelay > 0 ? '+' : ''}${config.audioDelay}ms` : '0ms'}
          </span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="-5000"
          max="5000"
          step="100"
          value={config.audioDelay || 0}
          onChange={(e) => onChange('audioDelay', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>{t('transcode.earlier')} (-5s)</span>
          <span>{t('transcode.synchronized')} (0s)</span>
          <span>{t('transcode.later')} (+5s)</span>
        </div>
      </div>

      {/* 采样率 + 标准化 + 动态范围压缩 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.sampleRate')}:</label>
          <select
            className={styles.select}
            value={config.sampleRate || 'original'}
            onChange={(e) => onChange('sampleRate', e.target.value)}
          >
            <option value="original">{t('transcode.original')}</option>
            <option value="48000">48000 Hz</option>
            <option value="44100">44100 Hz (CD)</option>
            <option value="32000">32000 Hz</option>
            <option value="24000">24000 Hz</option>
            <option value="22050">22050 Hz</option>
            <option value="16000">16000 Hz</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.normalization')}:</label>
          <select
            className={styles.select}
            value={config.normalization || 'none'}
            onChange={(e) => onChange('normalization', e.target.value)}
          >
            <option value="none">{t('transcode.none')}</option>
            <option value="peak">{t('transcode.peakNormalization')}</option>
            <option value="rms">{t('transcode.rmsNormalization')}</option>
            <option value="loudness">{t('transcode.loudnessNormalization')}</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.compression')}:</label>
          <select
            className={styles.select}
            value={config.compression || 'none'}
            onChange={(e) => onChange('compression', e.target.value)}
          >
            <option value="none">{t('transcode.none')}</option>
            <option value="light">{t('transcode.light')}</option>
            <option value="medium">{t('transcode.medium')}</option>
            <option value="strong">{t('transcode.strong')}</option>
          </select>
        </div>
      </div>

      {/* 提示 */}
      <div className={styles.hint} style={{ marginTop: '8px', padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
        💡 {t('transcode.audioHint') || '音频处理可能影响音质，建议保持原始设置或轻度调整'}
      </div>
    </div>
  );
};

