import { useTranslation } from 'react-i18next';
import buttonStyles from '../../../../styles/components/Button.module.scss';
import styles from './FileSelector.module.scss';
import type { VideoInfo } from '../../../../../types/transcode.types';

interface FileSelectorProps {
  videoFile: string;
  videoInfo: VideoInfo | null;
  outputPath: string;
  loading: boolean;
  onSelectVideo: () => void;
  onSelectOutput: () => void;
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

// 格式化时长
const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const FileSelector = ({
  videoFile,
  videoInfo,
  outputPath,
  loading,
  onSelectVideo,
  onSelectOutput,
}: FileSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 输入视频 */}
      <div className={styles.section}>
        <div className={styles.fileRow}>
          <button
            className={buttonStyles.buttonSecondary}
            onClick={onSelectVideo}
            disabled={loading}
          >
            {t('transcode.selectVideo') || '选择视频'}
          </button>
          <div className={styles.fileInfo}>
            {loading ? (
              <span className={styles.loading}>{t('transcode.loading') || '加载中...'}</span>
            ) : videoFile ? (
              <strong>{videoFile.split(/[\\/]/).pop()}</strong>
            ) : (
              <span className={styles.empty}>{t('transcode.noVideoSelected') || '未选择视频'}</span>
            )}
          </div>
        </div>

        {/* 视频信息 */}
        {videoInfo && (
          <div className={styles.videoInfo}>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('transcode.resolution') || '分辨率'}:</span>
              <span className={styles.value}>{videoInfo.width} × {videoInfo.height}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('transcode.codec') || '编码'}:</span>
              <span className={styles.value}>{videoInfo.videoCodec.toUpperCase()}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('transcode.duration') || '时长'}:</span>
              <span className={styles.value}>{formatDuration(videoInfo.duration)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('transcode.frameRate') || '帧率'}:</span>
              <span className={styles.value}>{videoInfo.fps.toFixed(2)} fps</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('transcode.size') || '大小'}:</span>
              <span className={styles.value}>{formatFileSize(videoInfo.size)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 输出路径 */}
      <div className={styles.section}>
        <div className={styles.fileRow}>
          <button
            className={buttonStyles.buttonSecondary}
            onClick={onSelectOutput}
            disabled={!videoFile}
          >
            {t('transcode.outputPath') || '输出路径'}
          </button>
          <div className={styles.fileInfo}>
            {outputPath ? (
              <strong>{outputPath.split(/[\\/]/).pop()}</strong>
            ) : (
              <span className={styles.empty}>{t('transcode.noOutputSelected') || '未设置输出路径'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

