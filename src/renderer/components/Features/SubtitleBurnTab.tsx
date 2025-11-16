import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { VideoInfo } from '../../../shared/types/merge.types';
import type { SubtitleFileInfo, SubtitleBurnProgress } from '../../../shared/types/subtitle-burn.types';
import type { TaskProgress } from '../../App';
import styles from './SubtitleBurnTab.module.scss';
import buttonStyles from '../../styles/components/Button.module.scss';
import selectStyles from '../../styles/components/Select.module.scss';
import Switch from '../Common/Switch';

const { ipcRenderer } = (window as any).electron;

interface SubtitleBurnTabProps {
  addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
  taskProgress: TaskProgress;
  setTaskProgress: React.Dispatch<React.SetStateAction<TaskProgress>>;
  ffmpegAvailable?: boolean;
}

function SubtitleBurnTab({ addLog, taskProgress, setTaskProgress, ffmpegAvailable = true }: SubtitleBurnTabProps) {
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<string | null>(null); // 硬字幕：单个文件
  const [subtitleFiles, setSubtitleFiles] = useState<string[]>([]); // 软字幕：多个文件
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [subtitleInfo, setSubtitleInfo] = useState<SubtitleFileInfo | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [qualityPreset, setQualityPreset] = useState<'h264_quality' | 'h264_balanced' | 'h264_hw' | 'hevc_size'>('h264_quality');
  const [subtitleType, setSubtitleType] = useState<'hard' | 'soft'>('soft'); // 默认软字幕

  // 监听进度更新（使用全局状态）
  useEffect(() => {
    const progressHandler = (_event: any, progressData: SubtitleBurnProgress) => {
      setTaskProgress({
        taskType: 'burn',
        isRunning: true,
        progress: progressData.percent,
        progressText: progressData.timemark 
          ? `进度: ${progressData.percent}% | 时间: ${progressData.timemark}`
          : `${progressData.percent}%`
      });
    };

    ipcRenderer.on('subtitle-burn-progress', progressHandler);

    return () => {
      ipcRenderer.removeListener('subtitle-burn-progress', progressHandler);
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
        addLocalLog(`选择视频: ${filePath}`, 'info');

        // 获取视频信息
        const info = await ipcRenderer.invoke('get-video-info', filePath);
        if (info) {
          setVideoInfo(info);
          addLocalLog(`视频信息: ${info.width}x${info.height}, ${info.codec}, ${info.fps.toFixed(2)}fps`, 'info');
        }
      }
    } catch (error) {
      addLocalLog('选择视频文件失败', 'error');
    }
  };

  // 从文件名提取语言代码
  const extractLanguageCode = (filename: string): string => {
    // 匹配格式：xxx.en.srt, xxx.zh-Hans.srt 等
    const match = filename.match(/\.([a-z]{2}(-[A-Za-z]+)?)\.(?:srt|ass|ssa|vtt)$/i);
    return match ? match[1] : 'und'; // und = undefined/unknown
  };

  // 语言代码映射到可读名称
  const getLanguageName = (code: string): string => {
    const languageMap: Record<string, string> = {
      'zh-Hans': '简体中文',
      'zh-Hant': '繁体中文',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'ru': 'Русский',
      'pt': 'Português',
      'it': 'Italiano',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'th': 'ภาษาไทย',
      'vi': 'Tiếng Việt',
      'id': 'Bahasa Indonesia',
      'und': '未知'
    };
    return languageMap[code] || code;
  };

  const handleSelectSubtitle = async () => {
    try {
      if (subtitleType === 'soft') {
        // 软字幕：支持多选
        const filePaths = await ipcRenderer.invoke('select-subtitle-files-multiple');
        if (filePaths && filePaths.length > 0) {
          setSubtitleFiles(filePaths);
          setResult(null);
          addLocalLog(`选择 ${filePaths.length} 个字幕文件`, 'info');
          filePaths.forEach((path: string, index: number) => {
            const filename = path.split(/[\\/]/).pop() || '';
            const langCode = extractLanguageCode(filename);
            const langName = getLanguageName(langCode);
            addLocalLog(`字幕 ${index + 1}: ${filename} [${langName}]`, 'info');
          });
        }
      } else {
        // 硬字幕：单选
        const filePath = await ipcRenderer.invoke('select-subtitle-file');
        if (filePath) {
          setSubtitleFile(filePath);
          setResult(null);
          addLocalLog(`选择字幕: ${filePath}`, 'info');

          // 获取字幕信息
          const info = await ipcRenderer.invoke('get-subtitle-info', filePath);
          if (info) {
            setSubtitleInfo(info);
            addLocalLog(`字幕格式: ${info.format.toUpperCase()}, 大小: ${(info.size / 1024).toFixed(2)} KB`, 'info');
          }
        }
      }
    } catch (error) {
      addLocalLog('选择字幕文件失败', 'error');
    }
  };

  const handleClearAll = () => {
    setVideoFile(null);
    setSubtitleFile(null);
    setSubtitleFiles([]);
    setVideoInfo(null);
    setSubtitleInfo(null);
    setResult(null);
    addLocalLog('已清空所有文件选择', 'info');
  };

  const handleBurn = async () => {
    // 验证文件选择
    if (!videoFile) {
      addLocalLog('请先选择视频文件', 'error');
      return;
    }
    
    if (subtitleType === 'soft' && subtitleFiles.length === 0) {
      addLocalLog('请先选择至少一个字幕文件', 'error');
      return;
    }
    
    if (subtitleType === 'hard' && !subtitleFile) {
      addLocalLog('请先选择字幕文件', 'error');
      return;
    }

    // 更新全局状态
    setTaskProgress({
      taskType: 'burn',
      isRunning: true,
      progress: 0,
      progressText: '准备中...'
    });
    setResult(null);

    try {
      addLocalLog('开始字幕烧录', 'info');

      // 选择输出路径（软字幕建议 MKV，硬字幕 MP4）
      const videoFileName = videoFile.split(/[\\/]/).pop() || 'output.mp4';
      const ext = subtitleType === 'soft' ? '.mkv' : '.mp4';
      const defaultFileName = videoFileName.replace(/\.[^.]+$/, `_字幕${ext}`);
      let outputPath = await ipcRenderer.invoke('select-output-path', defaultFileName);

      if (!outputPath) {
        addLocalLog('用户取消保存', 'warning');
        setTaskProgress({
          taskType: null,
          isRunning: false,
          progress: 0,
          progressText: ''
        });
        return;
      }

      // 强制使用正确的扩展名（防止用户修改）
      if (subtitleType === 'soft' && !outputPath.toLowerCase().endsWith('.mkv')) {
        outputPath = outputPath.replace(/\.[^.]+$/, '') + '.mkv';
        addLocalLog('软字幕已自动修正为 .mkv 格式（支持多轨道和样式）', 'warning');
      } else if (subtitleType === 'hard' && !outputPath.toLowerCase().endsWith('.mp4')) {
        outputPath = outputPath.replace(/\.[^.]+$/, '') + '.mp4';
      }

      addLocalLog(`输出路径: ${outputPath}`, 'info');
      addLocalLog(`字幕类型: ${subtitleType === 'soft' ? '软字幕（封装）' : '硬字幕（烧录）'}`, 'info');

      // 根据质量预设确定参数
      let videoCodec: 'libx264' | 'libx265' = 'libx264';
      let audioCodec: 'copy' | 'aac' = 'copy';
      let crf = 18;
      let preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow' = 'slow';
      let tune: 'film' | 'grain' | 'none' = 'film';
      let useHardwareAccel = false;
      let hwaccel: 'videotoolbox' | 'nvenc' | 'qsv' | 'none' = 'none';

      if (subtitleType === 'hard') {
        if (qualityPreset === 'h264_quality') {
          videoCodec = 'libx264';
          crf = 18;
          preset = 'slow';
          tune = 'film';
        } else if (qualityPreset === 'h264_balanced') {
          videoCodec = 'libx264';
          crf = 19;
          preset = 'medium';
          tune = 'film';
        } else if (qualityPreset === 'h264_hw') {
          videoCodec = 'libx264';
          crf = 20;
          preset = 'medium';
          tune = 'none';
          useHardwareAccel = true;
          hwaccel = 'videotoolbox';
        } else if (qualityPreset === 'hevc_size') {
          videoCodec = 'libx265';
          crf = 21;
          preset = 'slow';
          tune = 'grain';
        }
        addLocalLog(`编码参数: ${videoCodec}, CRF=${crf}, Preset=${preset}, Tune=${tune}${useHardwareAccel ? ', HW=' + hwaccel : ''}`, 'info');
      } else {
        addLocalLog(`软字幕模式：视频/音频直接复制，无需重新编码`, 'info');
      }

      // 调用烧录
      const result = await ipcRenderer.invoke('burn-subtitles', {
        videoPath: videoFile,
        subtitlePath: subtitleType === 'soft' ? subtitleFiles : subtitleFile,
        outputPath,
        videoCodec,
        audioCodec,
        crf,
        preset,
        tune,
        useHardwareAccel,
        hwaccel,
        subtitleType,
      });

      if (result.success) {
        addLocalLog('✓ 烧录成功！', 'success');
        setResult({
          success: true,
          message: '字幕烧录完成',
          outputPath: result.outputPath,
        });
        setTaskProgress({
          taskType: null,
          isRunning: false,
          progress: 100,
          progressText: '烧录完成'
        });
      } else {
        addLocalLog(`烧录失败: ${result.message}`, 'error');
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
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLocalLog(`烧录失败: ${errorMessage}`, 'error');
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

  return (
    <div className={styles.container}>
      {/* 标题栏（支持拖拽） */}
      <div className={styles.header}>
        <h2>
          {t('subtitleBurn.title')}
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
                {t('subtitleBurn.ffmpegNotAvailable')}
              </div>
              <p className={styles.alertText}>{t('subtitleBurn.ffmpegNotAvailableDetail')}</p>
            </div>
          )}

          {/* 文件选择 */}
          <div className={styles.fileSection}>
            {/* 视频文件选择 */}
            <div className={styles.fileRow}>
              <button 
                  onClick={handleSelectVideo}
                className={buttonStyles.buttonSecondary}
              >
                {t('subtitleBurn.selectVideo')}
              </button>
              <div className={styles.fileInfo}>
                  {videoFile ? (
                      <strong>{videoFile.split(/[\\/]/).pop()}</strong>
                  ) : (
                  <span className={styles.fileInfoEmpty}>{t('subtitleBurn.noVideoSelected')}</span>
                  )}
                </div>
              </div>
              <div className={styles.fileDetails}>
                {videoFile && videoInfo && (
                  <>
                    <span>{t('subtitleBurn.resolution')}: {videoInfo.width}×{videoInfo.height}</span>
                    <span>{t('subtitleBurn.codec')}: {videoInfo.codec.toUpperCase()}</span>
                    <span>{t('subtitleBurn.duration')}: {formatDuration(videoInfo.duration)}</span>
                    <span>{t('subtitleBurn.frameRate')}: {videoInfo.fps.toFixed(2)}fps</span>
                    <span>{t('subtitleBurn.size')}: {formatFileSize(videoInfo.bitrate / 8 * videoInfo.duration)}</span>
                  </>
                )}
              </div>

            {/* 字幕文件选择 */}
            <div className={styles.fileRow}>
              <button 
                  onClick={handleSelectSubtitle}
                className={buttonStyles.buttonSecondary}
              >
                {t('subtitleBurn.selectSubtitle')}
              </button>
              <div className={styles.fileInfo}>
                  {subtitleType === 'soft' ? (
                    // 软字幕：显示多个文件
                    subtitleFiles.length > 0 ? (
                    <div className={styles.subtitleFileList}>
                        {subtitleFiles.map((file, index) => {
                          const filename = file.split(/[\\/]/).pop() || '';
                          const langCode = extractLanguageCode(filename);
                          const langName = getLanguageName(langCode);
                          return (
                          <div key={index} className={styles.subtitleTag}>
                            <span className={styles.langCode}>{langCode}</span>
                            <span className={styles.langName}>{langName}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                    <span className={styles.fileInfoEmpty}>{t('subtitleBurn.noSubtitleSelectedMulti')}</span>
                    )
                  ) : (
                    // 硬字幕：显示单个文件
                    subtitleFile ? (
                        <strong>{subtitleFile.split(/[\\/]/).pop()}</strong>
                    ) : (
                    <span className={styles.fileInfoEmpty}>{t('subtitleBurn.noSubtitleSelected')}</span>
                    )
                  )}
                </div>
              </div>
            
              {/* 字幕详细信息 */}
              {subtitleType === 'hard' ? (
                <div className={styles.fileDetails}>
                  {subtitleFile && subtitleInfo && (
                    <>
                      <span>{t('subtitleBurn.format')}: {subtitleInfo.format.toUpperCase()}</span>
                      <span>{t('subtitleBurn.size')}: {formatFileSize(subtitleInfo.size)}</span>
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.fileCount}>
                  {subtitleFiles.length > 0 && t('subtitleBurn.filesSelected', { count: subtitleFiles.length })}
                </div>
              )}
          </div>

          {/* 字幕配置 */}
          <div className={styles.configSection}>
            <h3 className={styles.configSectionTitle}>{t('subtitleBurn.subtitleConfig')}</h3>
            
            {/* 字幕类型选择 */}
            <div className={styles.switchField}>
              <div className={styles.switchRow}>
                <Switch
                checked={subtitleType === 'soft'}
                  onChange={(checked) => setSubtitleType(checked ? 'soft' : 'hard')}
                disabled={taskProgress.isRunning}
                  label={subtitleType === 'soft' ? t('subtitleBurn.softSubtitle') : t('subtitleBurn.hardSubtitle')}
              />
                <span className={subtitleType === 'soft' ? styles.badgeSuccess : styles.badgePrimary}>
                  {subtitleType === 'soft' ? t('subtitleBurn.fastCompletion') : t('subtitleBurn.strongCompatibility')}
                </span>
              </div>
              <div className={styles.fieldHelp}>
                {subtitleType === 'hard' 
                  ? t('subtitleBurn.hardSubtitleDesc')
                  : t('subtitleBurn.softSubtitleDesc')
                }
              </div>
            </div>

            {/* 质量预设（仅硬字幕） */}
            {subtitleType === 'hard' && (
              <div className={styles.formField}>
                <div className={styles.formControl}>
                  <select
                    className={selectStyles.select}
                      value={qualityPreset}
                      onChange={(e) => setQualityPreset(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                    <option value="h264_quality">{t('subtitleBurn.qualityHigh')}</option>
                    <option value="h264_balanced">{t('subtitleBurn.qualityBalanced')}</option>
                    <option value="h264_hw">{t('subtitleBurn.qualityHardware')}</option>
                    <option value="hevc_size">{t('subtitleBurn.qualityHighCompression')}</option>
                  </select>
                  <div className={styles.fieldHelp}>
                    {qualityPreset === 'h264_quality' && t('subtitleBurn.qualityHighDesc')}
                    {qualityPreset === 'h264_balanced' && t('subtitleBurn.qualityBalancedDesc')}
                    {qualityPreset === 'h264_hw' && t('subtitleBurn.qualityHardwareDesc')}
                    {qualityPreset === 'hevc_size' && t('subtitleBurn.qualityHighCompressionDesc')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 开始烧录/封装按钮 */}
          <div className={styles.buttonGroup}>
            <button
              className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonMedium}`}
                onClick={handleBurn}
                disabled={
                  !videoFile || 
                  (subtitleType === 'soft' ? subtitleFiles.length === 0 : !subtitleFile) || 
                  taskProgress.isRunning || 
                  ffmpegAvailable === false
                }
              >
                {taskProgress.isRunning && taskProgress.taskType === 'burn' 
                ? (subtitleType === 'soft' ? t('subtitleBurn.embedding') : t('subtitleBurn.burning')) 
                : (subtitleType === 'soft' ? t('subtitleBurn.startEmbed') : t('subtitleBurn.startBurn'))
                }
            </button>
            <button
              className={`${buttonStyles.buttonSecondary} ${buttonStyles.buttonMedium}`}
                onClick={handleClearAll}
                disabled={
                  taskProgress.isRunning || 
                  (!videoFile && !subtitleFile && subtitleFiles.length === 0)
                }
              >
              {t('subtitleBurn.clearAll')}
            </button>
          </div>

          {/* 烧录进度 */}
          {taskProgress.isRunning && taskProgress.taskType === 'burn' && (
            <div className={styles.progressSection}>
              <h3 className={styles.progressTitle}>{t('subtitleBurn.progress')}</h3>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${taskProgress.progress}%` }}
                />
                <span className={styles.progressLabel}>{taskProgress.progress}%</span>
              </div>
                {taskProgress.progressText && (
                <div className={styles.progressText}>{taskProgress.progressText}</div>
                )}
              <div className={`${styles.alert} ${styles.alertWarning}`}>
                <span>{t('subtitleBurn.progressWait')}</span>
              </div>
            </div>
          )}

          {/* 烧录结果 */}
          {result && (
            <div className={styles.resultSection}>
              <div className={`${styles.alert} ${result.success ? styles.alertSuccess : styles.alertError}`}>
                <div className={styles.alertHeading}>
                  {result.success ? `✅ ${t('subtitleBurn.burnSuccess')}` : `❌ ${t('subtitleBurn.burnFailed')}`}
                </div>
                <p className={styles.alertText}>{result.message}</p>
                {result.outputPath && (
                  <p className={styles.alertText}>
                    <strong>{t('subtitleBurn.outputFile')}：</strong>{result.outputPath}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <div className={styles.infoArea}>
          {/* 功能说明 */}
          <div className={styles.infoSection}>
            <div className={styles.infoContent}>
              <h4 className={styles.infoSubtitle}>{t('subtitleBurn.guideSubtitleTypes')}</h4>
              <ul className={styles.infoList}>
                <li>{t('subtitleBurn.guideHardSubtitle')}</li>
                <li>{t('subtitleBurn.guideSoftSubtitle')}</li>
              </ul>

              <div className={styles.infoDivider} />

              <h4 className={styles.infoSubtitle}>{t('subtitleBurn.guideSoftSubtitleInfo')}</h4>
              <ul className={styles.infoList}>
                <li>{t('subtitleBurn.guideMkvAss')}</li>
                <li>{t('subtitleBurn.guideMp4MovText')}</li>
                <li>{t('subtitleBurn.guideAdvantage')}</li>
              </ul>

              <div className={styles.infoDivider} />

              <h4 className={styles.infoSubtitle}>{t('subtitleBurn.guideQualityPresets')}</h4>
              <ul className={styles.infoList}>
                <li>{t('subtitleBurn.guideQualityHigh')}</li>
                <li>{t('subtitleBurn.guideQualityBalanced')}</li>
                <li>{t('subtitleBurn.guideQualityHardware')}</li>
                <li>{t('subtitleBurn.guideQualityCompression')}</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SubtitleBurnTab;

