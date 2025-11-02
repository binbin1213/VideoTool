import { useTranslation } from 'react-i18next';
import styles from './BasicTab.module.scss';

interface BasicTabProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export const BasicTab = ({ config, onChange }: BasicTabProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 格式 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.format')}:</label>
        <select
          className={styles.select}
          value={config.format || 'mp4'}
          onChange={(e) => onChange('format', e.target.value)}
        >
          <option value="mp4">MP4</option>
          <option value="mkv">MKV</option>
          <option value="avi">AVI</option>
          <option value="mov">MOV</option>
          <option value="webm">WebM</option>
        </select>
      </div>

      {/* 视频编码 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.videoCodec')}:</label>
        <select
          className={styles.select}
          value={config.videoCodec || 'libx264'}
          onChange={(e) => onChange('videoCodec', e.target.value)}
        >
          <option value="libx264">H.264 (libx264)</option>
          <option value="libx265">H.265 (libx265)</option>
          <option value="h264_videotoolbox">H.264 ({t('transcode.hwAccelerated')})</option>
          <option value="hevc_videotoolbox">H.265 ({t('transcode.hwAccelerated')})</option>
          <option value="vp9">VP9</option>
          <option value="copy">{t('transcode.copyStream')}</option>
        </select>
      </div>

      {/* 质量控制 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {t('transcode.quality')} (CRF):
          <span className={styles.value}>{config.crf || 23}</span>
        </label>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="51"
          value={config.crf || 23}
          onChange={(e) => onChange('crf', parseInt(e.target.value))}
        />
        <div className={styles.sliderHint}>
          <span>{t('transcode.highQuality')} (0)</span>
          <span>{t('transcode.balanced')} (23)</span>
          <span>{t('transcode.lowQuality')} (51)</span>
        </div>
      </div>

      {/* 预设 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.preset')}:</label>
        <select
          className={styles.select}
          value={config.preset || 'medium'}
          onChange={(e) => onChange('preset', e.target.value)}
        >
          <option value="ultrafast">ultrafast ({t('transcode.fastest')})</option>
          <option value="superfast">superfast</option>
          <option value="veryfast">veryfast</option>
          <option value="faster">faster</option>
          <option value="fast">fast</option>
          <option value="medium">medium ({t('transcode.recommended2')})</option>
          <option value="slow">slow</option>
          <option value="slower">slower</option>
          <option value="veryslow">veryslow ({t('transcode.highestQuality')})</option>
        </select>
      </div>

      {/* 音频编码 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.audioCodec')}:</label>
        <select
          className={styles.select}
          value={config.audioCodec || 'aac'}
          onChange={(e) => onChange('audioCodec', e.target.value)}
        >
          <option value="aac">AAC</option>
          <option value="mp3">MP3</option>
          <option value="opus">Opus</option>
          <option value="vorbis">Vorbis</option>
          <option value="copy">{t('transcode.copyStream')}</option>
        </select>
      </div>

      {/* 音频码率 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.audioBitrate')}:</label>
        <select
          className={styles.select}
          value={config.audioBitrate || '128k'}
          onChange={(e) => onChange('audioBitrate', e.target.value)}
        >
          <option value="96k">96 kbps</option>
          <option value="128k">128 kbps ({t('transcode.recommended2')})</option>
          <option value="192k">192 kbps</option>
          <option value="256k">256 kbps</option>
          <option value="320k">320 kbps</option>
        </select>
      </div>
    </div>
  );
};

