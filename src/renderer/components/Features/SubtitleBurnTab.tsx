import { useState, useEffect } from 'react';
import { Button, Form, Alert, ProgressBar, Badge } from 'react-bootstrap';
import formStyles from '../../styles/components/FormControls.module.scss';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';
import type { VideoInfo } from '../../../shared/types/merge.types';
import type { SubtitleFileInfo, SubtitleBurnProgress } from '../../../shared/types/subtitle-burn.types';
import type { TaskProgress } from '../../App';

const { ipcRenderer } = (window as any).electron;

interface SubtitleBurnTabProps {
  addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
  taskProgress: TaskProgress;
  setTaskProgress: React.Dispatch<React.SetStateAction<TaskProgress>>;
}

function SubtitleBurnTab({ addLog, taskProgress, setTaskProgress }: SubtitleBurnTabProps) {
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<string | null>(null); // 硬字幕：单个文件
  const [subtitleFiles, setSubtitleFiles] = useState<string[]>([]); // 软字幕：多个文件
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [subtitleInfo, setSubtitleInfo] = useState<SubtitleFileInfo | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [videoCodec, setVideoCodec] = useState<'libx264' | 'libx265'>('libx264');
  const [audioCodec, setAudioCodec] = useState<'copy' | 'aac'>('copy');
  const [crf, setCrf] = useState(18);
  const [preset, setPreset] = useState<'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'>('slow');
  const [tune, setTune] = useState<'film' | 'grain' | 'none'>('film');
  const [qualityPreset, setQualityPreset] = useState<'h264_quality' | 'h264_balanced' | 'h264_hw' | 'hevc_size'>('h264_quality');
  const [useHardwareAccel, setUseHardwareAccel] = useState(false);
  const [hwaccel, setHwaccel] = useState<'videotoolbox' | 'nvenc' | 'qsv' | 'none'>('videotoolbox');
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [subtitleType, setSubtitleType] = useState<'hard' | 'soft'>('soft'); // 默认软字幕

  // 检查 FFmpeg 是否可用
  useEffect(() => {
    const checkFFmpeg = async () => {
      try {
        const available = await ipcRenderer.invoke('check-ffmpeg');
        setFfmpegAvailable(available);
        if (available) {
          addLocalLog('FFmpeg 检查通过', 'success');
        } else {
          addLocalLog('FFmpeg 不可用', 'error');
        }
      } catch (error) {
        setFfmpegAvailable(false);
        addLocalLog('FFmpeg 检查失败', 'error');
      }
    };
    checkFFmpeg();

    // 监听进度更新（使用全局状态）
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

  // 根据质量预设自动设置参数
  useEffect(() => {
    if (qualityPreset === 'h264_quality') {
      setUseHardwareAccel(false);
      setVideoCodec('libx264');
      setCrf(18);
      setPreset('slow');
      setTune('film');
    } else if (qualityPreset === 'h264_balanced') {
      setUseHardwareAccel(false);
      setVideoCodec('libx264');
      setCrf(19);
      setPreset('medium');
      setTune('film');
    } else if (qualityPreset === 'h264_hw') {
      setUseHardwareAccel(true);
      setHwaccel('videotoolbox');
      setVideoCodec('libx264');
      setCrf(20);
      setPreset('medium');
      setTune('none');
    } else if (qualityPreset === 'hevc_size') {
      setUseHardwareAccel(false);
      setVideoCodec('libx265');
      setCrf(21);
      setPreset('slow');
      setTune('grain');
    }
  }, [qualityPreset]);

  const addLocalLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedLog = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    setLogs(prev => [...prev, formattedLog]);
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
        addLocalLog('⚠️ 软字幕已自动修正为 .mkv 格式（支持多轨道和样式）', 'warning');
      } else if (subtitleType === 'hard' && !outputPath.toLowerCase().endsWith('.mp4')) {
        outputPath = outputPath.replace(/\.[^.]+$/, '') + '.mp4';
      }

      addLocalLog(`输出路径: ${outputPath}`, 'info');
      addLocalLog(`字幕类型: ${subtitleType === 'soft' ? '软字幕（封装）' : '硬字幕（烧录）'}`, 'info');
      if (subtitleType === 'hard') {
        addLocalLog(`编码参数: ${videoCodec}, CRF=${crf}, Preset=${preset}, Tune=${tune}${useHardwareAccel ? ', HW=' + hwaccel : ''}`, 'info');
        if (useHardwareAccel) {
          addLocalLog(`✨ 硬件加速: ${hwaccel.toUpperCase()}`, 'info');
        }
      } else {
        addLocalLog(`✨ 软字幕模式：视频/音频直接复制，无需重新编码`, 'info');
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
        hwaccel: useHardwareAccel ? hwaccel : 'none',
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
    <div className="subtitle-burn-container">
      <div className="subtitle-burn-header">
        <h2>
          <FaPlay className="me-2" />
          字幕烧录
        </h2>
      </div>

      <div className="subtitle-burn-content">
        <div className="main-area">
          {/* FFmpeg 状态检查 */}
          {ffmpegAvailable === false && (
            <Alert variant="danger" className="mb-3">
              <Alert.Heading>❌ FFmpeg 不可用</Alert.Heading>
              <p>FFmpeg 组件未能正常加载，字幕烧录功能无法使用。</p>
            </Alert>
          )}

          {/* 文件选择 */}
          <div className="mb-4" style={{ 
            padding: '16px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h6 className="mb-3" style={{ fontSize: '14px', fontWeight: 600, color: '#495057' }}>
              📁 选择文件
            </h6>
            {/* 视频文件选择 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  color: '#000',
                  minWidth: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  height: '22px'
                }}>
                  视频:
                </div>
                <Button 
                  onClick={handleSelectVideo}
                  variant="outline-secondary"
                  size="sm"
                  style={{
                    minWidth: '50px',
                    height: '22px',
                    padding: '0 8px',
                    fontSize: '10px',
                    color: '#666',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    lineHeight: '20px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  浏览
                </Button>
                <div className="flex-grow-1 text-truncate">
                  {videoFile ? (
                    <span>
                      <strong>{videoFile.split(/[\\/]/).pop()}</strong>
                    </span>
                  ) : (
                    <span className="text-muted">未选择视频文件</span>
                  )}
                </div>
              </div>
              {videoFile && videoInfo && (
                <div 
                  className="text-muted small mt-1" 
                  style={{ 
                    marginLeft: '56px',
                    padding: '6px 10px',
                    background: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    display: 'inline-block'
                  }}
                >
                  <span style={{ marginRight: '12px' }}>
                    分辨率: {videoInfo.width}×{videoInfo.height}
                  </span>
                  <span style={{ marginRight: '12px' }}>
                    编码: {videoInfo.codec.toUpperCase()}
                  </span>
                  <span style={{ marginRight: '12px' }}>
                    时长: {formatDuration(videoInfo.duration)}
                  </span>
                  <span style={{ marginRight: '12px' }}>
                    帧率: {videoInfo.fps.toFixed(2)}fps
                  </span>
                  <span>
                    大小: {formatFileSize(videoInfo.bitrate / 8 * videoInfo.duration)}
                  </span>
                </div>
              )}
            </div>

            {/* 字幕文件选择 */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  color: '#000',
                  minWidth: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  height: '22px'
                }}>
                  字幕:
                </div>
                <Button 
                  onClick={handleSelectSubtitle}
                  variant="outline-secondary"
                  size="sm"
                  style={{
                    minWidth: '50px',
                    height: '22px',
                    padding: '0 8px',
                    fontSize: '10px',
                    color: '#666',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    lineHeight: '20px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  浏览
                </Button>
                <div className="flex-grow-1">
                  {subtitleType === 'soft' ? (
                    // 软字幕：显示多个文件
                    subtitleFiles.length > 0 ? (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '6px', 
                        alignItems: 'center',
                        maxHeight: '80px',
                        overflowY: 'auto',
                        padding: '4px'
                      }}>
                        {subtitleFiles.map((file, index) => {
                          const filename = file.split(/[\\/]/).pop() || '';
                          const langCode = extractLanguageCode(filename);
                          const langName = getLanguageName(langCode);
                          return (
                            <div 
                              key={index}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                background: '#f0f0f0',
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}
                            >
                              <Badge 
                                bg="info"
                                style={{ 
                                  fontSize: '9px',
                                  fontWeight: 'normal',
                                  padding: '2px 6px'
                                }}
                              >
                                {langCode}
                              </Badge>
                              <span style={{ color: '#666' }}>{langName}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted">未选择字幕文件（可多选）</span>
                    )
                  ) : (
                    // 硬字幕：显示单个文件
                    subtitleFile ? (
                      <span>
                        <strong>{subtitleFile.split(/[\\/]/).pop()}</strong>
                      </span>
                    ) : (
                      <span className="text-muted">未选择字幕文件</span>
                    )
                  )}
                </div>
              </div>
              {/* 硬字幕：显示详细信息 */}
              {subtitleType === 'hard' && subtitleFile && subtitleInfo && (
                <div 
                  className="text-muted small mt-1" 
                  style={{ 
                    marginLeft: '56px',
                    padding: '6px 10px',
                    background: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    display: 'inline-block'
                  }}
                >
                  <span style={{ marginRight: '12px' }}>
                    格式: {subtitleInfo.format.toUpperCase()}
                  </span>
                  <span>
                    大小: {formatFileSize(subtitleInfo.size)}
                  </span>
                </div>
              )}
              {/* 软字幕：显示文件数量提示 */}
              {subtitleType === 'soft' && subtitleFiles.length > 0 && (
                <div 
                  className="text-muted small mt-1" 
                  style={{ 
                    marginLeft: '56px',
                    fontSize: '11px'
                  }}
                >
                  已选择 {subtitleFiles.length} 个字幕文件
                </div>
              )}
            </div>
          </div>

          {/* 字幕设置 */}
          <div className="mb-4" style={{ 
            padding: '16px', 
            background: '#fff', 
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h6 className="mb-3" style={{ fontSize: '14px', fontWeight: 600, color: '#495057' }}>
              ⚙️ 字幕配置
            </h6>
            {/* 字幕类型选择 */}
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="subtitle-type-switch"
                label={
                  <span>
                    {subtitleType === 'soft' ? '🎬 软字幕（无需编码）' : '🔥 硬字幕（烧录画面）'}
                    <Badge bg={subtitleType === 'soft' ? 'success' : 'primary'} className="ms-2">
                      {subtitleType === 'soft' ? '秒级完成' : '兼容性强'}
                    </Badge>
                  </span>
                }
                checked={subtitleType === 'soft'}
                onChange={(e) => setSubtitleType(e.target.checked ? 'soft' : 'hard')}
                disabled={taskProgress.isRunning}
              />
              <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                {subtitleType === 'hard' 
                  ? '硬字幕：烧录到画面，兼容性强，需重新编码。'
                  : '软字幕：可开关，MKV 保留样式，MP4 丢样式，画质 100% 保留。'
                }
              </Form.Text>
            </Form.Group>

            {/* 质量预设（仅硬字幕） */}
            {subtitleType === 'hard' && (
              <Form.Group className="mb-0">
                <div className={formStyles.fieldWrap}>
                  <div className={formStyles.label}>质量预设:</div>
                  <div>
                    <Form.Select
                      className={formStyles.select}
                      value={qualityPreset}
                      onChange={(e) => setQualityPreset(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="h264_quality">高质量（H.264，CRF 18，slow，film）</option>
                      <option value="h264_balanced">均衡（H.264，CRF 19，medium，film）</option>
                      <option value="h264_hw">硬件加速（H.264，VideoToolbox）</option>
                      <option value="hevc_size">高压缩（HEVC，CRF 21，slow，grain）</option>
                    </Form.Select>
                    <div className={formStyles.help}>
                      {qualityPreset === 'h264_quality' && '画质最佳，速度较慢'}
                      {qualityPreset === 'h264_balanced' && '画质与速度平衡'}
                      {qualityPreset === 'h264_hw' && '速度最快，画质略低'}
                      {qualityPreset === 'hevc_size' && '体积最小，编码慢'}
                    </div>
                  </div>
                </div>
              </Form.Group>
            )}
          </div>

          {/* 高级设置（仅硬字幕显示且软件编码时显示详细参数） */}
          {subtitleType === 'hard' && qualityPreset !== 'h264_hw' && (
            <div className="mb-4" style={{ 
              padding: '16px', 
              background: '#fff', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h6 className="mb-3" style={{ fontSize: '14px', fontWeight: 600, color: '#495057' }}>
                🔧 高级设置
              </h6>

              {/* 视频编码器 */}
              <Form.Group className="mb-2">
                <div className={formStyles.fieldWrap}>
                  <div className={formStyles.label}>视频编码器:</div>
                  <div>
                    <Form.Select
                      className={formStyles.select}
                      value={videoCodec}
                      onChange={(e) => setVideoCodec(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="libx264">H.264 (推荐)</option>
                      <option value="libx265">H.265 (更小体积)</option>
                    </Form.Select>
                    <div className={formStyles.help}>H.265 更小，H.264 兼容好</div>
                  </div>
                </div>
              </Form.Group>

              {/* 音频编码 */}
              <Form.Group className="mb-2">
                <div className={formStyles.fieldWrap}>
                  <div className={formStyles.label}>音频编码:</div>
                  <div>
                    <Form.Select
                      className={formStyles.select}
                      value={audioCodec}
                      onChange={(e) => setAudioCodec(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="copy">直接复制（推荐）</option>
                      <option value="aac">AAC 重新编码</option>
                    </Form.Select>
                    <div className={formStyles.help}>复制最快且无损</div>
                  </div>
                </div>
              </Form.Group>

              {/* 调优 */}
              <Form.Group className="mb-2">
                <div className={formStyles.fieldWrap}>
                  <div className={formStyles.label}>调优(tune):</div>
                  <div>
                    <Form.Select
                      className={formStyles.select}
                      value={tune}
                      onChange={(e) => setTune(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="film">film（自然画面）</option>
                      <option value="grain">grain（颗粒保留）</option>
                      <option value="none">无</option>
                    </Form.Select>
                    <div className={formStyles.help}>H.264 推荐 film，颗粒明显时用 grain</div>
                  </div>
                </div>
              </Form.Group>

              {/* 质量控制 CRF */}
              <Form.Group className="mb-2">
                <div className={formStyles.fieldWrap}>
                  <div className={formStyles.label}>质量控制 (CRF): {crf}</div>
                  <div>
                    <Form.Range
                      min={18}
                      max={28}
                      value={crf}
                      onChange={(e) => setCrf(parseInt(e.target.value))}
                      disabled={taskProgress.isRunning}
                      style={{ width: '100%' }}
                    />
                    <div className={formStyles.help}>18≈高质量 | 20≈均衡 | 23≈标准压缩</div>
                  </div>
                </div>
              </Form.Group>

              {/* 编码速度 */}
              <Form.Group className="mb-3">
                <div className={formStyles.fieldWrap}>
                  <div className={formStyles.label}>编码速度:</div>
                  <div>
                    <Form.Select
                      className={formStyles.select}
                      value={preset}
                      onChange={(e) => setPreset(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="ultrafast">极速（质量较低）</option>
                      <option value="superfast">超快</option>
                      <option value="veryfast">很快</option>
                      <option value="faster">较快</option>
                      <option value="fast">快速</option>
                      <option value="medium">标准（推荐）</option>
                      <option value="slow">慢速（质量好）</option>
                      <option value="slower">很慢</option>
                      <option value="veryslow">极慢（质量极好）</option>
                    </Form.Select>
                    <div className={formStyles.help}>越慢越清晰，体积更小</div>
                  </div>
                </div>
              </Form.Group>

              <Alert variant="info" className="mb-0">
                <small>
                  <strong>💡 提示：</strong>
                  字幕烧录需要重新编码视频。当前使用软件编码（高质量），如需更快速度可在上方切换硬件加速预设。
                </small>
              </Alert>
            </div>
          )}

          {/* 开始烧录/封装按钮 */}
          <div className="mb-3">
            <div className="d-grid">
              <Button
                variant="primary"
                size="lg"
                onClick={handleBurn}
                disabled={
                  !videoFile || 
                  (subtitleType === 'soft' ? subtitleFiles.length === 0 : !subtitleFile) || 
                  taskProgress.isRunning || 
                  ffmpegAvailable === false
                }
              >
                {taskProgress.isRunning && taskProgress.taskType === 'burn' 
                  ? (subtitleType === 'soft' ? '封装中...' : '烧录中...') 
                  : (subtitleType === 'soft' ? '开始封装' : '开始烧录')
                }
              </Button>
            </div>
          </div>

          {/* 烧录进度 */}
          {taskProgress.isRunning && taskProgress.taskType === 'burn' && (
            <div className="mb-3">
              <div>
                <h6>烧录进度</h6>
                <ProgressBar
                  now={taskProgress.progress}
                  label={`${taskProgress.progress}%`}
                  animated={taskProgress.progress < 100}
                  variant={taskProgress.progress === 100 ? 'success' : 'primary'}
                />
                {taskProgress.progressText && (
                  <div className="text-muted small mt-2">{taskProgress.progressText}</div>
                )}
                <Alert variant="warning" className="mt-3 mb-0">
                  <small>⏱️ 烧录过程需要重新编码，请耐心等待...</small>
                </Alert>
              </div>
            </div>
          )}

          {/* 烧录结果 */}
          {result && (
            <Alert variant={result.success ? 'success' : 'danger'}>
              <Alert.Heading>
                {result.success ? '✅ 烧录成功！' : '❌ 烧录失败'}
              </Alert.Heading>
              <p>{result.message}</p>
              {result.outputPath && (
                <p className="mb-0">
                  <strong>输出文件：</strong>{result.outputPath}
                </p>
              )}
            </Alert>
          )}
        </div>

        <div className="info-area">
          {/* 功能说明 */}
          <div className="mb-3">
            <div >
              <FaInfoCircle className="me-2" />
              功能说明
            </div>
            <div>
              <h6>字幕类型：</h6>
              <ul className="small mb-2">
                <li><strong>硬字幕：</strong>烧录到画面，需重新编码，兼容性强</li>
                <li><strong>软字幕：</strong>可开关，秒级完成，画质 100% 保留</li>
              </ul>

              <hr />

              <h6>软字幕说明：</h6>
              <ul className="small mb-2">
                <li><strong>MKV + ASS：</strong>完整保留字幕样式（推荐）</li>
                <li><strong>MP4 + mov_text：</strong>样式丢失，但兼容性好</li>
                <li><strong>优势：</strong>视频/音频直接复制，无画质损失</li>
              </ul>

              <hr />

              <h6>硬字幕质量预设：</h6>
              <ul className="small mb-0">
                <li><strong>高质量：</strong>CRF 18, slow, film（推荐）</li>
                <li><strong>均衡：</strong>CRF 19, medium, film</li>
                <li><strong>硬件加速：</strong>VideoToolbox（5-10x 更快）</li>
                <li><strong>高压缩：</strong>HEVC, CRF 21（体积小）</li>
              </ul>
            </div>
          </div>

          {/* 日志提示 */}
          {logs.length > 0 && (
            <div className="mb-3">
              <div >📋 处理日志</div>
              <div className="text-center" style={{ padding: '20px' }}>
                <p className="mb-2" style={{ fontSize: '13px', color: '#6c757d' }}>
                  共 {logs.length} 条日志记录
                </p>
                <p className="mb-0" style={{ fontSize: '11px', color: '#adb5bd' }}>
                  详细日志请查看专门的日志页面
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubtitleBurnTab;

