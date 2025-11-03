import { useTranslation } from 'react-i18next';
import styles from './BasicTab.module.scss';

interface BasicTabProps {
  config: any;
  onChange: (field: string, value: any) => void;
}

export const BasicTab = ({ config, onChange }: BasicTabProps) => {
  const { t } = useTranslation();

  // 调试：打印接收到的配置
  console.log('⚙️ BasicTab 接收到的配置:', config);
  console.log('  - format:', config.format);
  console.log('  - videoCodec:', config.videoCodec);
  console.log('  - audioCodec:', config.audioCodec);
  console.log('  - crf:', config.crf);
  console.log('  - preset:', config.preset);
  console.log('  - audioBitrate:', config.audioBitrate);

  // 根据音频编码器获取推荐的码率选项
  const getAudioBitrateOptions = (codec: string) => {
    switch (codec) {
      case 'ac3':
        return [
          { value: '192k', label: '192 kbps', recommended: false },
          { value: '256k', label: '256 kbps', recommended: false },
          { value: '384k', label: '384 kbps', recommended: false },
          { value: '448k', label: '448 kbps', recommended: false },
          { value: '640k', label: '640 kbps', recommended: true }, // 5.1推荐
        ];
      case 'eac3':
        return [
          { value: '128k', label: '128 kbps', recommended: false },
          { value: '192k', label: '192 kbps', recommended: false },
          { value: '384k', label: '384 kbps', recommended: false },
          { value: '768k', label: '768 kbps', recommended: true }, // 5.1推荐
          { value: '1536k', label: '1536 kbps', recommended: false },
        ];
      default: // aac, mp3, opus, vorbis
        return [
          { value: '96k', label: '96 kbps', recommended: false },
          { value: '128k', label: '128 kbps', recommended: true },
          { value: '192k', label: '192 kbps', recommended: false },
          { value: '256k', label: '256 kbps', recommended: false },
          { value: '320k', label: '320 kbps', recommended: false },
        ];
    }
  };

  const audioBitrateOptions = getAudioBitrateOptions(config.audioCodec || 'aac');

  // 判断是否显示声道选择（杜比格式需要）
  const showChannelsOption = ['ac3', 'eac3'].includes(config.audioCodec || 'aac');

  return (
    <div className={styles.container}>
      {/* 格式 + 视频编码 */}
      <div className={styles.row}>
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

        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.videoCodec')}:</label>
          <select
            className={styles.select}
            value={config.videoCodec || 'libx264'}
            onChange={(e) => {
              const codec = e.target.value;
              onChange('videoCodec', codec);
              
              // 如果选择了硬件加速编码器，自动设置对应的硬件加速选项
              // 注意：软件编码器也可以配合硬件解码使用，所以不自动禁用
              if (codec === 'h264_videotoolbox' || codec === 'hevc_videotoolbox') {
                onChange('useHardwareAccel', true);
                onChange('hwaccel', 'videotoolbox');
              } else if (codec.includes('nvenc')) {
                onChange('useHardwareAccel', true);
                onChange('hwaccel', 'cuda');
              } else if (codec.includes('qsv')) {
                onChange('useHardwareAccel', true);
                onChange('hwaccel', 'qsv');
              }
              // 软件编码器（libx264/libx265/vp9）不自动改变硬件加速设置
              // 因为硬件解码+软件编码也是一种有效的组合
            }}
          >
            <option value="libx264">H.264 (libx264) - {t('transcode.recommended')}</option>
            <option value="libx265">H.265 (libx265)</option>
            <option value="h264_videotoolbox">H.264 ({t('transcode.hwAccelerated')})</option>
            <option value="hevc_videotoolbox">H.265 ({t('transcode.hwAccelerated')})</option>
            <option value="vp9">VP9</option>
            <option value="copy">{t('transcode.copyStream')}</option>
          </select>
        </div>
      </div>

      {/* H.265 兼容性警告 */}
      {(config.videoCodec === 'libx265' || config.videoCodec === 'hevc_videotoolbox') && (
        <div className={styles.warning}>
          <span className={styles.warningIcon}>⚠️</span>
          <div className={styles.warningText}>
            <strong>{t('transcode.h265Warning')}</strong>
            <p>{t('transcode.h265WarningDesc')}</p>
          </div>
        </div>
      )}

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

      {/* 音频编码 + 码率 + 声道 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.audioCodec')}:</label>
          <select
            className={styles.select}
            value={config.audioCodec || 'aac'}
            onChange={(e) => onChange('audioCodec', e.target.value)}
          >
            <option value="aac">AAC</option>
            <option value="ac3">Dolby Digital (AC-3)</option>
            <option value="eac3">Dolby Digital Plus (E-AC-3)</option>
            <option value="mp3">MP3</option>
            <option value="opus">Opus</option>
            <option value="vorbis">Vorbis</option>
            <option value="copy">{t('transcode.copyStream')}</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.audioBitrate')}:</label>
          <select
            className={styles.select}
            value={config.audioBitrate || '128k'}
            onChange={(e) => onChange('audioBitrate', e.target.value)}
          >
            {audioBitrateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.recommended && ` (${t('transcode.recommended2')})`}
              </option>
            ))}
          </select>
        </div>

        {showChannelsOption && (
          <div className={styles.field}>
            <label className={styles.label}>{t('transcode.audioChannels')}:</label>
            <select
              className={styles.select}
              value={config.audioChannels || '2'}
              onChange={(e) => onChange('audioChannels', e.target.value)}
            >
              <option value="2">2.0 ({t('transcode.stereo')})</option>
              <option value="6">5.1 ({t('transcode.surround')})</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

