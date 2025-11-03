import { useTranslation } from 'react-i18next';
import styles from './BasicTab.module.scss';

interface VideoTabProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export const VideoTab = ({ config, onChange }: VideoTabProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 分辨率 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.resolution')}:</label>
        <select
          className={styles.select}
          value={config.resolution || 'original'}
          onChange={(e) => onChange('resolution', e.target.value)}
        >
          <option value="original">{t('transcode.original')}</option>
          <option value="3840x2160">4K (3840×2160)</option>
          <option value="2560x1440">2K (2560×1440)</option>
          <option value="1920x1080">1080p (1920×1080)</option>
          <option value="1280x720">720p (1280×720)</option>
          <option value="854x480">480p (854×480)</option>
          <option value="640x360">360p (640×360)</option>
          <option value="custom">{t('transcode.customResolution')}</option>
        </select>
      </div>

      {/* 自定义分辨率 */}
      {config.resolution === 'custom' && (
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.customSize')}:</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              className={styles.input}
              placeholder={t('transcode.width')}
              value={config.customWidth || ''}
              onChange={(e) => onChange('customWidth', parseInt(e.target.value) || 0)}
              style={{ width: '100px' }}
            />
            <span>×</span>
            <input
              type="number"
              className={styles.input}
              placeholder={t('transcode.height')}
              value={config.customHeight || ''}
              onChange={(e) => onChange('customHeight', parseInt(e.target.value) || 0)}
              style={{ width: '100px' }}
            />
          </div>
        </div>
      )}

      {/* 帧率 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.framerate')}:</label>
        <select
          className={styles.select}
          value={config.framerate || 'original'}
          onChange={(e) => onChange('framerate', e.target.value)}
        >
          <option value="original">{t('transcode.original')}</option>
          <option value="60">60 fps ({t('transcode.smooth')})</option>
          <option value="50">50 fps (PAL)</option>
          <option value="30">30 fps ({t('transcode.standard')})</option>
          <option value="25">25 fps (PAL)</option>
          <option value="24">24 fps ({t('transcode.cinematic')})</option>
          <option value="custom">{t('transcode.custom')}</option>
        </select>
      </div>

      {/* 自定义帧率 */}
      {config.framerate === 'custom' && (
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.customFramerate')}:</label>
          <input
            type="number"
            className={styles.input}
            placeholder="fps"
            value={config.customFramerate || ''}
            onChange={(e) => onChange('customFramerate', parseInt(e.target.value) || 0)}
            style={{ width: '120px' }}
            min="1"
            max="120"
          />
        </div>
      )}

      {/* 宽高比 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.aspectRatio')}:</label>
        <select
          className={styles.select}
          value={config.aspectRatio || 'original'}
          onChange={(e) => onChange('aspectRatio', e.target.value)}
        >
          <option value="original">{t('transcode.original')}</option>
          <option value="16:9">16:9 ({t('transcode.widescreen')})</option>
          <option value="4:3">4:3 ({t('transcode.standard')})</option>
          <option value="21:9">21:9 ({t('transcode.ultrawide')})</option>
          <option value="1:1">1:1 ({t('transcode.square')})</option>
          <option value="9:16">9:16 ({t('transcode.vertical')})</option>
        </select>
      </div>

      {/* 旋转 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.rotate')}:</label>
        <select
          className={styles.select}
          value={config.rotate || '0'}
          onChange={(e) => onChange('rotate', e.target.value)}
        >
          <option value="0">{t('transcode.noRotate')} (0°)</option>
          <option value="90">{t('transcode.clockwise90')} (90°)</option>
          <option value="180">{t('transcode.rotate180')} (180°)</option>
          <option value="270">{t('transcode.counterclockwise90')} (270°)</option>
        </select>
      </div>

      {/* 翻转 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.flip')}:</label>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.flipHorizontal || false}
              onChange={(e) => onChange('flipHorizontal', e.target.checked)}
            />
            <span>{t('transcode.horizontal')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.flipVertical || false}
              onChange={(e) => onChange('flipVertical', e.target.checked)}
            />
            <span>{t('transcode.vertical')}</span>
          </label>
        </div>
      </div>

      {/* 裁剪 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.crop')}:</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            type="number"
            className={styles.input}
            placeholder={t('transcode.top')}
            value={config.cropTop || ''}
            onChange={(e) => onChange('cropTop', parseInt(e.target.value) || 0)}
            min="0"
          />
          <input
            type="number"
            className={styles.input}
            placeholder={t('transcode.bottom')}
            value={config.cropBottom || ''}
            onChange={(e) => onChange('cropBottom', parseInt(e.target.value) || 0)}
            min="0"
          />
          <input
            type="number"
            className={styles.input}
            placeholder={t('transcode.left')}
            value={config.cropLeft || ''}
            onChange={(e) => onChange('cropLeft', parseInt(e.target.value) || 0)}
            min="0"
          />
          <input
            type="number"
            className={styles.input}
            placeholder={t('transcode.right')}
            value={config.cropRight || ''}
            onChange={(e) => onChange('cropRight', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div className={styles.hint} style={{ marginTop: '4px', fontSize: '11px', color: 'var(--vt-color-text-tertiary)' }}>
          {t('transcode.cropHint') || '裁剪像素数（上、下、左、右）'}
        </div>
      </div>
    </div>
  );
};

