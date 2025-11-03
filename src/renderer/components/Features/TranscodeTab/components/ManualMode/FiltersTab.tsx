import { useTranslation } from 'react-i18next';
import styles from './BasicTab.module.scss';

interface FiltersTabProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export const FiltersTab = ({ config, onChange }: FiltersTabProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 亮度 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.brightness')}:
          <span className={styles.value}>
            {config.brightness !== undefined ? `${config.brightness > 0 ? '+' : ''}${config.brightness}%` : '0%'}
          </span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="-100"
          max="100"
          value={config.brightness || 0}
          onChange={(e) => onChange('brightness', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>{t('transcode.darker')} (-100)</span>
          <span>{t('transcode.original')} (0)</span>
          <span>{t('transcode.brighter')} (+100)</span>
        </div>
      </div>

      {/* 对比度 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.contrast')}:
          <span className={styles.value}>
            {config.contrast !== undefined ? `${config.contrast > 0 ? '+' : ''}${config.contrast}%` : '0%'}
          </span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="-100"
          max="100"
          value={config.contrast || 0}
          onChange={(e) => onChange('contrast', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>{t('transcode.lower')} (-100)</span>
          <span>{t('transcode.original')} (0)</span>
          <span>{t('transcode.higher')} (+100)</span>
        </div>
      </div>

      {/* 饱和度 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.saturation')}:
          <span className={styles.value}>
            {config.saturation !== undefined ? `${config.saturation > 0 ? '+' : ''}${config.saturation}%` : '0%'}
          </span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="-100"
          max="100"
          value={config.saturation || 0}
          onChange={(e) => onChange('saturation', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>{t('transcode.desaturated')} (-100)</span>
          <span>{t('transcode.original')} (0)</span>
          <span>{t('transcode.vibrant')} (+100)</span>
        </div>
      </div>

      {/* 色相 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.hue')}:
          <span className={styles.value}>{config.hue || 0}°</span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="-180"
          max="180"
          value={config.hue || 0}
          onChange={(e) => onChange('hue', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>-180°</span>
          <span>0°</span>
          <span>+180°</span>
        </div>
      </div>

      {/* 伽马 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.gamma')}:
          <span className={styles.value}>{(config.gamma !== undefined ? config.gamma / 10 : 10) / 10}</span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="1"
          max="30"
          value={config.gamma !== undefined ? config.gamma : 10}
          onChange={(e) => onChange('gamma', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>{t('transcode.darker')} (0.1)</span>
          <span>{t('transcode.normal')} (1.0)</span>
          <span>{t('transcode.brighter')} (3.0)</span>
        </div>
      </div>

      {/* 锐化 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.sharpen')}:</label>
        <select
          className={styles.select}
          value={config.sharpen || 'none'}
          onChange={(e) => onChange('sharpen', e.target.value)}
        >
          <option value="none">{t('transcode.none')}</option>
          <option value="light">{t('transcode.light')}</option>
          <option value="medium">{t('transcode.medium')}</option>
          <option value="strong">{t('transcode.strong')}</option>
        </select>
      </div>

      {/* 降噪 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.denoise')}:</label>
        <select
          className={styles.select}
          value={config.denoise || 'none'}
          onChange={(e) => onChange('denoise', e.target.value)}
        >
          <option value="none">{t('transcode.none')}</option>
          <option value="light">{t('transcode.light')}</option>
          <option value="medium">{t('transcode.medium')}</option>
          <option value="strong">{t('transcode.strong')}</option>
        </select>
      </div>

      {/* 模糊 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.blur')}:</label>
        <select
          className={styles.select}
          value={config.blur || 'none'}
          onChange={(e) => onChange('blur', e.target.value)}
        >
          <option value="none">{t('transcode.none')}</option>
          <option value="light">{t('transcode.light')}</option>
          <option value="medium">{t('transcode.medium')}</option>
          <option value="strong">{t('transcode.strong')}</option>
        </select>
      </div>

      {/* 特殊效果 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.specialEffects')}:</label>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.grayscale || false}
              onChange={(e) => onChange('grayscale', e.target.checked)}
            />
            <span>{t('transcode.grayscale')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.negate || false}
              onChange={(e) => onChange('negate', e.target.checked)}
            />
            <span>{t('transcode.negate')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.sepia || false}
              onChange={(e) => onChange('sepia', e.target.checked)}
            />
            <span>{t('transcode.sepia')}</span>
          </label>
        </div>
      </div>

      {/* 提示 */}
      <div className={styles.hint} style={{ marginTop: '8px', padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
        💡 {t('transcode.filterHint') || '滤镜效果会增加转码时间，建议按需使用'}
      </div>
    </div>
  );
};

