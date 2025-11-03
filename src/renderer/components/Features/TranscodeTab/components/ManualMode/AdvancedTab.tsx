import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BasicTab.module.scss';

interface AdvancedTabProps {
  config: any;
  videoInfo: any;
  onChange: (field: string, value: any) => void;
}

export const AdvancedTab = ({ config, videoInfo, onChange }: AdvancedTabProps) => {
  const { t } = useTranslation();
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  // 处理音轨选择
  const handleAudioTrackToggle = (trackIndex: number) => {
    const currentTracks = config.selectedAudioTracks || [];
    const newTracks = currentTracks.includes(trackIndex)
      ? currentTracks.filter((i: number) => i !== trackIndex)
      : [...currentTracks, trackIndex];
    onChange('selectedAudioTracks', newTracks);
  };

  // 处理字幕选择
  const handleSubtitleTrackToggle = (trackIndex: number) => {
    const currentTracks = config.selectedSubtitleTracks || [];
    const newTracks = currentTracks.includes(trackIndex)
      ? currentTracks.filter((i: number) => i !== trackIndex)
      : [...currentTracks, trackIndex];
    onChange('selectedSubtitleTracks', newTracks);
  };

  return (
    <div className={styles.container}>
      {/* 硬件加速 + 元数据 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.hardwareAccel')}:</label>
          <select
            className={styles.select}
            value={config.hwaccel || 'none'}
            onChange={(e) => {
              const value = e.target.value;
              onChange('hwaccel', value);
              // 自动设置 useHardwareAccel 标志
              onChange('useHardwareAccel', value !== 'none');
            }}
          >
            <option value="none">{t('transcode.none')}</option>
            <option value="auto">{t('transcode.auto')}</option>
            <option value="videotoolbox">VideoToolbox (macOS)</option>
            <option value="cuda">CUDA (NVIDIA)</option>
            <option value="qsv">Quick Sync (Intel)</option>
            <option value="vaapi">VAAPI (Linux)</option>
          </select>
        </div>

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
      </div>

      {/* 字幕处理 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>
            {t('transcode.subtitles')}
            {videoInfo?.subtitleTracks && videoInfo.subtitleTracks.length > 0 && (
              <span style={{ color: '#999', fontSize: '11px', marginLeft: '4px' }}>
                ({videoInfo.subtitleTracks.length}条)
              </span>
            )}
          </label>
          <select
            className={styles.select}
            value={config.subtitles || 'copy'}
            onChange={(e) => onChange('subtitles', e.target.value)}
          >
            <option value="copy">{t('transcode.copySubtitles')}</option>
            <option value="remove">{t('transcode.removeSubtitles')}</option>
            <option value="burn">{t('transcode.burnSubtitles')}</option>
          </select>
        </div>

        {/* 字幕选择按钮 */}
        {config.subtitles === 'copy' && videoInfo?.subtitleTracks && videoInfo.subtitleTracks.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>&nbsp;</label>
            <button
              onClick={() => setShowSubtitleModal(true)}
              style={{
                padding: '0 16px',
                backgroundColor: '#1890ff',
                color: '#fff',
                border: '1px solid #1890ff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                width: '100%',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
            >
              {t('transcode.selectSubtitles') || '选择字幕轨道'} ({(config.selectedSubtitleTracks || []).length || videoInfo.subtitleTracks.length}/{videoInfo.subtitleTracks.length})
            </button>
          </div>
        )}
      </div>


      {/* 音轨处理 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>
            {t('transcode.audioTracks')}
            {videoInfo?.audioTracks && videoInfo.audioTracks.length > 0 && (
              <span style={{ color: '#999', fontSize: '11px', marginLeft: '4px' }}>
                ({videoInfo.audioTracks.length}个)
              </span>
            )}
          </label>
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

        {/* 音轨选择按钮 */}
        {config.audioTracks === 'select' && videoInfo?.audioTracks && videoInfo.audioTracks.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>&nbsp;</label>
            <button
              onClick={() => setShowAudioModal(true)}
              style={{
                padding: '0 16px',
                backgroundColor: '#1890ff',
                color: '#fff',
                border: '1px solid #1890ff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                width: '100%',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
            >
              {t('transcode.selectAudioTracks') || '选择音轨'} ({(config.selectedAudioTracks || []).length || videoInfo.audioTracks.length}/{videoInfo.audioTracks.length})
            </button>
          </div>
        )}
      </div>

      {/* 快速开始 + 两遍编码 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.fastStart || false}
              onChange={(e) => onChange('fastStart', e.target.checked)}
            />
            <span>{t('transcode.enableFastStart')}</span>
          </label>
        </div>

        <div className={styles.field}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.twoPass || false}
              onChange={(e) => onChange('twoPass', e.target.checked)}
            />
            <span>{t('transcode.enableTwoPass')}</span>
          </label>
        </div>
      </div>

      {/* 线程数 + GOP大小 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>{t('transcode.threads')}:</label>
          <select
            className={styles.select}
            value={config.threads || 'auto'}
            onChange={(e) => onChange('threads', e.target.value)}
          >
            <option value="auto">{t('transcode.auto')}</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16</option>
          </select>
        </div>

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

      {/* 字幕选择弹窗 */}
      {showSubtitleModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowSubtitleModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                {t('transcode.selectSubtitles') || '选择字幕轨道'}
              </h3>
              <button
                onClick={() => setShowSubtitleModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            {/* 字幕轨道表格 */}
            <div style={{ 
              border: '1px solid #E5E5E5',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F5F5' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px', borderBottom: '1px solid #E5E5E5' }}>✓</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>轨道</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>语言</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>格式</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>标题</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px', borderBottom: '1px solid #E5E5E5' }}>标记</th>
                  </tr>
                </thead>
                <tbody>
                  {videoInfo?.subtitleTracks?.map((track: any, idx: number) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: idx === videoInfo.subtitleTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                        <input
                          type="checkbox"
                          checked={(config.selectedSubtitleTracks || []).includes(track.index)}
                          onChange={() => handleSubtitleTrackToggle(track.index)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.subtitleTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>#{track.index + 1}</td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.subtitleTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>{track.language || '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.subtitleTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>{track.codec?.toUpperCase()}</td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.subtitleTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>{track.title || '-'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '11px', borderBottom: idx === videoInfo.subtitleTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                        {track.forced && <span style={{ color: '#1890ff', marginRight: '4px' }}>强制</span>}
                        {track.default && <span style={{ color: '#52c41a' }}>默认</span>}
                        {!track.forced && !track.default && '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 提示信息 */}
            <div style={{ fontSize: '11px', color: '#666', marginTop: '12px', padding: '8px 12px', backgroundColor: '#F5F5F5', borderRadius: '4px' }}>
              💡 {t('transcode.subtitleSelectHint') || '未选择任何字幕时将保留所有字幕'}
            </div>

            {/* 关闭按钮 */}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => setShowSubtitleModal(false)}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {t('common.confirm') || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 音轨选择弹窗 */}
      {showAudioModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowAudioModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                {t('transcode.selectAudioTracks') || '选择音轨'}
              </h3>
              <button
                onClick={() => setShowAudioModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            {/* 音轨表格 */}
            <div style={{ 
              border: '1px solid #E5E5E5',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F5F5' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px', borderBottom: '1px solid #E5E5E5' }}>✓</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>轨道</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>语言</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>编码</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>声道</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>采样率</th>
                  </tr>
                </thead>
                <tbody>
                  {videoInfo?.audioTracks?.map((track: any, idx: number) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: idx === videoInfo.audioTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                        <input
                          type="checkbox"
                          checked={(config.selectedAudioTracks || []).includes(track.index)}
                          onChange={() => handleAudioTrackToggle(track.index)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.audioTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>#{track.index + 1}</td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.audioTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>{track.language || '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.audioTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>{track.codec?.toUpperCase()}</td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.audioTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                        {track.channels === 6 ? '5.1' : track.channels === 2 ? '立体声' : track.channels === 1 ? '单声道' : track.channels || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: idx === videoInfo.audioTracks.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                        {track.sampleRate ? `${(track.sampleRate / 1000).toFixed(1)} kHz` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 提示信息 */}
            <div style={{ fontSize: '11px', color: '#666', marginTop: '12px', padding: '8px 12px', backgroundColor: '#F5F5F5', borderRadius: '4px' }}>
              💡 {t('transcode.audioSelectHint') || '未选择任何音轨时将使用第一音轨'}
            </div>

            {/* 关闭按钮 */}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => setShowAudioModal(false)}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {t('common.confirm') || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

