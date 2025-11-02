import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaVideo, 
  FaMusic, 
  FaPlay, 
  FaCog, 
  FaCheckCircle,
  FaTimesCircle,
  FaBolt
} from 'react-icons/fa';
import type { VideoInfo, AudioInfo, MergeProgress } from '../../../shared/types/merge.types';
import type { TaskProgress } from '../../App';
import styles from './MergeTab.module.scss';

const { ipcRenderer } = (window as any).electron;

interface MergeTabProps {
  addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
  taskProgress: TaskProgress;
  setTaskProgress: React.Dispatch<React.SetStateAction<TaskProgress>>;
}

function MergeTab({ addLog, taskProgress, setTaskProgress }: MergeTabProps) {
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [videoCodec, setVideoCodec] = useState<'copy' | 'libx264' | 'libx265'>('copy');
  const [audioCodec, setAudioCodec] = useState<'aac' | 'mp3' | 'copy'>('aac');
  const [audioBitrate, setAudioBitrate] = useState('192k');
  const [useHardwareAccel, setUseHardwareAccel] = useState(false);
  const [hwaccel, setHwaccel] = useState<'videotoolbox' | 'nvenc' | 'qsv' | 'none'>('videotoolbox');
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);

  // 检查 FFmpeg 是否可用
  useEffect(() => {
    const checkFFmpeg = async () => {
      try {
        const available = await ipcRenderer.invoke('check-ffmpeg');
        setFfmpegAvailable(available);
        if (available) {
          addLocalLog(t('merge.ffmpegCheckPassed', 'FFmpeg check passed'), 'success');
        } else {
          addLocalLog(t('merge.ffmpegNotAvailable', 'FFmpeg not available'), 'error');
        }
      } catch (error) {
        setFfmpegAvailable(false);
        addLocalLog(t('merge.ffmpegCheckFailed', 'FFmpeg check failed'), 'error');
      }
    };
    checkFFmpeg();

    // 监听进度更新（使用全局状态）
    const progressHandler = (_event: any, progressData: MergeProgress) => {
      setTaskProgress({
        taskType: 'merge',
        isRunning: true,
        progress: progressData.percent,
        progressText: progressData.timemark 
          ? `${t('merge.progress', 'Progress')}: ${progressData.percent}% | ${t('merge.time', 'Time')}: ${progressData.timemark}`
          : `${progressData.percent}%`
      });
    };

    ipcRenderer.on('merge-progress', progressHandler);

    return () => {
      ipcRenderer.removeListener('merge-progress', progressHandler);
    };
  }, [setTaskProgress]);

  const addLocalLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    addLog(message, type);
  };

  const handleSelectVideo = async () => {
    try {
      const filePath = await ipcRenderer.invoke('select-video-file');
      if (filePath) {
        setVideoFile(filePath);
        setResult(null);
        addLocalLog(`${t('merge.selectVideo', 'Select video')}: ${filePath}`, 'info');

        // 获取视频信息
        const info = await ipcRenderer.invoke('get-video-info', filePath);
        if (info) {
          setVideoInfo(info);
          addLocalLog(`${t('merge.videoInfo', 'Video info')}: ${info.width}x${info.height}, ${info.codec}, ${info.fps.toFixed(2)}fps`, 'info');
        }
      }
    } catch (error) {
      addLocalLog(t('merge.selectVideoFailed', 'Failed to select video file'), 'error');
    }
  };

  const handleSelectAudio = async () => {
    try {
      const filePath = await ipcRenderer.invoke('select-audio-file');
      if (filePath) {
        setAudioFile(filePath);
        setResult(null);
        addLocalLog(`${t('merge.selectAudio', 'Select audio')}: ${filePath}`, 'info');

        // 获取音频信息
        const info = await ipcRenderer.invoke('get-audio-info', filePath);
        if (info) {
          setAudioInfo(info);
          addLocalLog(`${t('merge.audioInfo', 'Audio info')}: ${info.codec}, ${info.bitrate / 1000}kbps, ${info.sampleRate}Hz`, 'info');
        }
      }
    } catch (error) {
      addLocalLog(t('merge.selectAudioFailed', 'Failed to select audio file'), 'error');
    }
  };

  const handleMerge = async () => {
    if (!videoFile || !audioFile) {
      addLocalLog(t('merge.selectFilesFirst', 'Please select video and audio files first'), 'error');
      return;
    }

    // 更新全局状态
    setTaskProgress({
      taskType: 'merge',
      isRunning: true,
      progress: 0,
      progressText: t('merge.preparing', 'Preparing...')
    });
    setResult(null);

    try {
      addLocalLog(t('merge.startMerging', 'Starting merge'), 'info');

      // 选择输出路径
      const videoFileName = videoFile.split(/[\\/]/).pop() || 'output.mp4';
      const defaultFileName = videoFileName.replace(/\.[^.]+$/, '_merged.mp4');
      const outputPath = await ipcRenderer.invoke('select-output-path', defaultFileName);

      if (!outputPath) {
        addLocalLog(t('merge.userCancelled', 'User cancelled'), 'warning');
        setTaskProgress({
          taskType: null,
          isRunning: false,
          progress: 0,
          progressText: ''
        });
        return;
      }

      addLocalLog(`${t('merge.outputPath', 'Output path')}: ${outputPath}`, 'info');
      if (videoCodec !== 'copy' && useHardwareAccel) {
        addLocalLog(`${t('merge.hardwareAccel', 'Hardware Acceleration')}: ${hwaccel.toUpperCase()}`, 'info');
      }

      // 调用合并
      const result = await ipcRenderer.invoke('merge-audio-video', {
        videoPath: videoFile,
        audioPath: audioFile,
        outputPath,
        videoCodec,
        audioCodec,
        audioBitrate,
        useHardwareAccel: videoCodec !== 'copy' ? useHardwareAccel : false,
        hwaccel: useHardwareAccel && videoCodec !== 'copy' ? hwaccel : 'none',
      });

      if (result.success) {
        addLocalLog(t('merge.mergeSuccess', 'Merge successful!'), 'success');
        setResult({
          success: true,
          message: t('merge.mergeSuccess'),
          outputPath: result.outputPath,
        });
        setTaskProgress({
          taskType: null,
          isRunning: false,
          progress: 100,
          progressText: t('merge.mergeComplete', 'Merge complete')
        });
      } else {
        addLocalLog(`${t('merge.mergeFailed', 'Merge failed')}: ${result.message}`, 'error');
        setResult({
          success: false,
          message: result.message,
        });
        setTaskProgress({
          taskType: null,
          isRunning: false,
          progress: 0,
          progressText: ''
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('merge.unknownError', 'Unknown error');
      addLocalLog(`${t('merge.mergeFailed')}: ${errorMessage}`, 'error');
      setResult({
        success: false,
        message: errorMessage,
      });
      setTaskProgress({
        taskType: null,
        isRunning: false,
        progress: 0,
        progressText: ''
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleClearAll = () => {
    setVideoFile(null);
    setAudioFile(null);
    setVideoInfo(null);
    setAudioInfo(null);
    setResult(null);
    addLocalLog(t('merge.clearedAll', 'Cleared all selections'), 'info');
  };

  return (
    <div className={styles.container}>
      {/* 标题栏（支持拖拽） */}
      <div className={styles.header}>
        <h2>
          <FaPlay />
          {t('merge.title')}
        </h2>
      </div>

      {/* 内容区 */}
      <div className={styles.content}>
        {/* 主内容区 */}
        <div className={styles.mainArea}>
          {/* FFmpeg 状态检查 */}
          {ffmpegAvailable === false && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <div className={styles.alertHeading}>
                <FaTimesCircle />
                {t('merge.ffmpegNotAvailable')}
              </div>
              <p className={styles.alertText}>
                {t('merge.ffmpegNotAvailableDetail')}
              </p>
            </div>
          )}

          {/* 文件选择区 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FaVideo />
              {t('merge.videoFile')}
            </h3>
            <div className={styles.formRow}>
              <button
                className={styles.buttonSecondary}
                onClick={handleSelectVideo}
                disabled={taskProgress.isRunning}
              >
                {t('merge.browse')}
              </button>
              <div className={styles.fileInfo}>
                {videoFile ? (
                  <span className={styles.fileName}>{videoFile.split(/[\\/]/).pop()}</span>
                ) : (
                  <span className={styles.fileHint}>{t('merge.noVideoSelected')}</span>
                )}
              </div>
            </div>
            {videoInfo && (
              <div className={styles.fileDetails}>
                {videoInfo.width}×{videoInfo.height} · {videoInfo.codec} · {videoInfo.fps.toFixed(2)}fps · {formatDuration(videoInfo.duration)} · {formatFileSize(videoInfo.bitrate / 8 * videoInfo.duration)}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FaMusic />
              {t('merge.audioFile')}
            </h3>
            <div className={styles.formRow}>
              <button
                className={styles.buttonSecondary}
                onClick={handleSelectAudio}
                disabled={taskProgress.isRunning}
              >
                {t('merge.browse')}
              </button>
              <div className={styles.fileInfo}>
                {audioFile ? (
                  <span className={styles.fileName}>{audioFile.split(/[\\/]/).pop()}</span>
                ) : (
                  <span className={styles.fileHint}>{t('merge.noAudioSelected')}</span>
                )}
              </div>
            </div>
            {audioInfo && (
              <div className={styles.fileDetails}>
                {audioInfo.codec} · {Math.round(audioInfo.bitrate / 1000)}kbps · {audioInfo.sampleRate}Hz · {audioInfo.channels}声道 · {formatDuration(audioInfo.duration)}
              </div>
            )}
          </div>

          {/* 编码设置 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FaCog />
              {t('merge.videoSettings')} / {t('merge.audioSettings')}
            </h3>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>{t('merge.videoCodec')}</label>
              <select
                className={styles.select}
                value={videoCodec}
                onChange={(e) => setVideoCodec(e.target.value as any)}
                disabled={taskProgress.isRunning}
              >
                <option value="copy">{t('merge.copy')}</option>
                <option value="libx264">H.264</option>
                <option value="libx265">H.265</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>{t('merge.audioCodec')}</label>
              <select
                className={styles.select}
                value={audioCodec}
                onChange={(e) => setAudioCodec(e.target.value as any)}
                disabled={taskProgress.isRunning}
              >
                <option value="aac">AAC</option>
                <option value="mp3">MP3</option>
                <option value="copy">{t('merge.copy')}</option>
              </select>
            </div>

            {audioCodec !== 'copy' && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('merge.audioBitrate')}</label>
                <select
                  className={styles.select}
                  value={audioBitrate}
                  onChange={(e) => setAudioBitrate(e.target.value)}
                  disabled={taskProgress.isRunning}
                >
                  <option value="128k">128 kbps</option>
                  <option value="192k">192 kbps</option>
                  <option value="256k">256 kbps</option>
                  <option value="320k">320 kbps</option>
                </select>
              </div>
            )}

            {/* 硬件加速 */}
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                <FaBolt />
                {t('merge.hardwareAccel')}
              </label>
              <div className={styles.switchWrapper}>
                <input
                  type="checkbox"
                  id="merge-hwaccel"
                  className={styles.switchInput}
                  checked={useHardwareAccel}
                  onChange={(e) => setUseHardwareAccel(e.target.checked)}
                  disabled={taskProgress.isRunning || videoCodec === 'copy'}
                />
                <label htmlFor="merge-hwaccel" className={styles.switchLabel}>
                  {t('merge.enable')}
                </label>
              </div>
            </div>

            {useHardwareAccel && videoCodec !== 'copy' && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('merge.accelerationType')}</label>
                <select
                  className={styles.select}
                  value={hwaccel}
                  onChange={(e) => setHwaccel(e.target.value as any)}
                  disabled={taskProgress.isRunning}
                >
                  <option value="videotoolbox">{t('merge.videotoolbox')}</option>
                  <option value="nvenc">{t('merge.nvenc')}</option>
                  <option value="qsv">{t('merge.qsv')}</option>
                </select>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className={styles.buttonGroup}>
            <button
              className={styles.buttonPrimaryLarge}
              onClick={handleMerge}
              disabled={!videoFile || !audioFile || taskProgress.isRunning || ffmpegAvailable === false}
            >
              {taskProgress.isRunning && taskProgress.taskType === 'merge' 
                ? t('merge.merging') 
                : t('merge.startMerge')}
            </button>
            <button
              className={styles.buttonSecondary}
              onClick={handleClearAll}
              disabled={taskProgress.isRunning || (!videoFile && !audioFile)}
            >
              {t('merge.clearAll')}
            </button>
          </div>

          {/* 合并进度 */}
          {taskProgress.isRunning && taskProgress.taskType === 'merge' && (
            <div className={styles.section}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${taskProgress.progress}%` }}
                />
              </div>
              <div className={styles.progressText}>
                {taskProgress.progressText || `${taskProgress.progress}%`}
              </div>
            </div>
          )}

          {/* 合并结果 */}
          {result && (
            <div className={`${styles.alert} ${result.success ? styles.alertSuccess : styles.alertError}`}>
              <div className={styles.alertHeading}>
                {result.success ? <FaCheckCircle /> : <FaTimesCircle />}
                {result.success ? t('merge.mergeSuccess') : t('merge.mergeFailed')}
              </div>
              <p className={styles.alertText}>{result.message}</p>
              {result.outputPath && (
                <p className={styles.alertText}>
                  <strong>{t('merge.outputFile')}:</strong> {result.outputPath}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <div className={styles.infoArea}>
          <h6>
            {t('merge.guideTitle')}
          </h6>

          <h6>{t('merge.guideSteps')}</h6>
          <ol>
            <li>{t('merge.step1')}</li>
            <li>{t('merge.step2')}</li>
            <li>{t('merge.step3')}</li>
            <li>{t('merge.step4')}</li>
            <li>{t('merge.step5')}</li>
          </ol>

          <h6>{t('merge.guideNotes')}</h6>
          <ul>
            <li>{t('merge.note1')}</li>
            <li>{t('merge.note2')}</li>
            <li>{t('merge.note3')}</li>
            <li>{t('merge.note4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MergeTab;

