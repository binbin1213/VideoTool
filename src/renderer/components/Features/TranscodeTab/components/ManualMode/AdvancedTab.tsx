import { useTranslation } from 'react-i18next';
import styles from './BasicTab.module.scss';

interface AdvancedTabProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export const AdvancedTab = ({ config, onChange }: AdvancedTabProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 硬件加速 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.hardwareAccel')}:</label>
        <select
          className={styles.select}
          value={config.hwaccel || 'none'}
          onChange={(e) => onChange('hwaccel', e.target.value)}
        >
          <option value="none">{t('transcode.none')}</option>
          <option value="auto">{t('transcode.auto')}</option>
          <option value="videotoolbox">VideoToolbox (macOS)</option>
          <option value="cuda">CUDA (NVIDIA)</option>
          <option value="qsv">Quick Sync (Intel)</option>
          <option value="vaapi">VAAPI (Linux)</option>
        </select>
        <div className={styles.hint} style={{ marginTop: '4px' }}>
          {t('transcode.hwaccelHint') || '硬件加速可大幅提升转码速度'}
        </div>
      </div>

      {/* 元数据处理 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.metadata')}:</label>
        <select
          className={styles.select}
          value={config.metadata || 'copy'}
          onChange={(e) => onChange('metadata', e.target.value)}
        >
          <option value="copy">{t('transcode.copyMetadata')}</option>
          <option value="remove">{t('transcode.removeMetadata')}</option>
        </select>
      </div>

      {/* 字幕处理 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.subtitles')}:</label>
        <select
          className={styles.select}
          value={config.subtitles || 'copy'}
          onChange={(e) => onChange('subtitles', e.target.value)}
        >
          <option value="copy">{t('transcode.copySubtitles')}</option>
          <option value="remove">{t('transcode.removeSubtitles')}</option>
          <option value="burn">{t('transcode.burnSubtitles')}</option>
        </select>
        <div className={styles.hint} style={{ marginTop: '4px' }}>
          {t('transcode.subtitlesHint') || '烧录字幕会将字幕永久嵌入画面'}
        </div>
      </div>

      {/* 音轨处理 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.audioTracks')}:</label>
        <select
          className={styles.select}
          value={config.audioTracks || 'all'}
          onChange={(e) => onChange('audioTracks', e.target.value)}
        >
          <option value="all">{t('transcode.allTracks')}</option>
          <option value="first">{t('transcode.firstTrack')}</option>
          <option value="select">{t('transcode.selectTracks')}</option>
        </select>
      </div>

      {/* 快速开始 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.fastStart')}:</label>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.fastStart || false}
              onChange={(e) => onChange('fastStart', e.target.checked)}
            />
            <span>{t('transcode.enableFastStart')}</span>
          </label>
        </div>
        <div className={styles.hint} style={{ marginTop: '4px' }}>
          {t('transcode.fastStartHint') || '将元数据移到文件开头，适合网络播放'}
        </div>
      </div>

      {/* 两遍编码 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.twoPass')}:</label>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.twoPass || false}
              onChange={(e) => onChange('twoPass', e.target.checked)}
            />
            <span>{t('transcode.enableTwoPass')}</span>
          </label>
        </div>
        <div className={styles.hint} style={{ marginTop: '4px' }}>
          {t('transcode.twoPassHint') || '两遍编码可获得更好的质量，但耗时翻倍'}
        </div>
      </div>

      {/* 线程数 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.threads')}:</label>
        <select
          className={styles.select}
          value={config.threads || 'auto'}
          onChange={(e) => onChange('threads', e.target.value)}
        >
          <option value="auto">{t('transcode.auto')} ({t('transcode.recommended2')})</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="16">16</option>
        </select>
        <div className={styles.hint} style={{ marginTop: '4px' }}>
          {t('transcode.threadsHint') || '编码线程数，自动为最优'}
        </div>
      </div>

      {/* GOP大小 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.gopSize')}:</label>
        <input
          type="number"
          className={styles.input}
          placeholder="250"
          value={config.gopSize || ''}
          onChange={(e) => onChange('gopSize', parseInt(e.target.value) || 0)}
          min="0"
          max="600"
        />
        <div className={styles.hint} style={{ marginTop: '4px' }}>
          {t('transcode.gopSizeHint') || '关键帧间隔，留空使用默认值（通常为帧率×10）'}
        </div>
      </div>

      {/* 自定义FFmpeg参数 */}
      <div className={styles.field}>
        <label className={styles.label}>{t('transcode.customParams')}:</label>
        <input
          type="text"
          className={styles.input}
          placeholder="-tune film -x264opts keyint=24"
          value={config.customParams || ''}
          onChange={(e) => onChange('customParams', e.target.value)}
        />
        <div className={styles.hint} style={{ marginTop: '4px' }}>
          ⚠️ {t('transcode.customParamsHint') || '仅供高级用户使用，错误的参数可能导致转码失败'}
        </div>
      </div>

      {/* 警告提示 */}
      <div className={styles.hint} style={{ marginTop: '8px', padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '6px', borderLeft: '3px solid #F59E0B' }}>
        ⚠️ {t('transcode.advancedWarning') || '高级选项可能影响输出质量和兼容性，请谨慎使用'}
      </div>
    </div>
  );
};

