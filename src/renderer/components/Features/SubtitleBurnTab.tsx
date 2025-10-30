import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, ProgressBar, Badge, Row, Col } from 'react-bootstrap';
import { FaFileVideo, FaClosedCaptioning, FaPlay, FaCog, FaInfoCircle } from 'react-icons/fa';
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
  const [subtitleFile, setSubtitleFile] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [subtitleInfo, setSubtitleInfo] = useState<SubtitleFileInfo | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [videoCodec, setVideoCodec] = useState<'libx264' | 'libx265'>('libx264');
  const [audioCodec, setAudioCodec] = useState<'copy' | 'aac'>('copy');
  const [crf, setCrf] = useState(23);
  const [preset, setPreset] = useState<'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'>('medium');
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

  const handleSelectSubtitle = async () => {
    try {
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
    } catch (error) {
      addLocalLog('选择字幕文件失败', 'error');
    }
  };

  const handleBurn = async () => {
    if (!videoFile || !subtitleFile) {
      addLocalLog('请先选择视频和字幕文件', 'error');
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

      // 选择输出路径
      const videoFileName = videoFile.split(/[\\/]/).pop() || 'output.mp4';
      const defaultFileName = videoFileName.replace(/\.[^.]+$/, '_字幕.mp4');
      const outputPath = await ipcRenderer.invoke('select-output-path', defaultFileName);

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

      addLocalLog(`输出路径: ${outputPath}`, 'info');
      addLocalLog(`编码参数: ${videoCodec}, CRF=${crf}, Preset=${preset}`, 'info');
      if (useHardwareAccel) {
        addLocalLog(`✨ 硬件加速: ${hwaccel.toUpperCase()}`, 'info');
      }

      // 调用烧录
      const result = await ipcRenderer.invoke('burn-subtitles', {
        videoPath: videoFile,
        subtitlePath: subtitleFile,
        outputPath,
        videoCodec,
        audioCodec,
        crf,
        preset,
        useHardwareAccel,
        hwaccel: useHardwareAccel ? hwaccel : 'none',
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

          {/* 视频文件选择 */}
          <Card className="mb-3">
            <Card.Header>
              <FaFileVideo className="me-2" />
              选择视频文件
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3">
                <Button 
                  onClick={handleSelectVideo}
                  variant="secondary"
                >
                  浏览
                </Button>
                <div className="flex-grow-1">
                  {videoFile ? (
                    <div>
                      <div className="text-truncate">
                        <strong>{videoFile.split(/[\\/]/).pop()}</strong>
                      </div>
                      {videoInfo && (
                        <div className="text-muted small mt-1">
                          {videoInfo.width}×{videoInfo.height} | {videoInfo.codec} | 
                          {' '}{videoInfo.fps.toFixed(2)}fps | 
                          {' '}{formatDuration(videoInfo.duration)} | 
                          {' '}{formatFileSize(videoInfo.bitrate / 8 * videoInfo.duration)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">未选择视频文件</span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* 字幕文件选择 */}
          <Card className="mb-3">
            <Card.Header>
              <FaClosedCaptioning className="me-2" />
              选择字幕文件
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3">
                <Button 
                  onClick={handleSelectSubtitle}
                  variant="secondary"
                >
                  浏览
                </Button>
                <div className="flex-grow-1">
                  {subtitleFile ? (
                    <div>
                      <div className="text-truncate">
                        <strong>{subtitleFile.split(/[\\/]/).pop()}</strong>
                      </div>
                      {subtitleInfo && (
                        <div className="text-muted small mt-1">
                          格式: {subtitleInfo.format.toUpperCase()} | 
                          {' '}大小: {formatFileSize(subtitleInfo.size)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">未选择字幕文件</span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* 烧录设置 */}
          <Card className="mb-3">
            <Card.Header>
              <FaCog className="me-2" />
              烧录设置
            </Card.Header>
            <Card.Body>
              {/* 硬件加速开关 */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="hardware-accel-switch"
                  label={
                    <span>
                      ⚡ 启用硬件加速 
                      <Badge bg="success" className="ms-2">5-10x 更快</Badge>
                    </span>
                  }
                    checked={useHardwareAccel}
                    onChange={(e) => setUseHardwareAccel(e.target.checked)}
                    disabled={taskProgress.isRunning}
                />
                <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                  使用 GPU 加速视频编码，大幅提升处理速度
                </Form.Text>
              </Form.Group>

              <Row>
                {useHardwareAccel && (
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>硬件加速类型</Form.Label>
                      <Form.Select
                        value={hwaccel}
                        onChange={(e) => setHwaccel(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="videotoolbox">VideoToolbox (macOS 推荐)</option>
                        <option value="nvenc">NVENC (NVIDIA GPU)</option>
                        <option value="qsv">Quick Sync Video (Intel GPU)</option>
                      </Form.Select>
                      <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                        根据您的系统和硬件选择合适的加速方式
                      </Form.Text>
                    </Form.Group>
                  </Col>
                )}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>视频编码器</Form.Label>
                    <Form.Select
                      value={videoCodec}
                      onChange={(e) => setVideoCodec(e.target.value as any)}
                      disabled={taskProgress.isRunning || useHardwareAccel}
                    >
                      <option value="libx264">H.264 (推荐)</option>
                      <option value="libx265">H.265 (更小体积)</option>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                      {useHardwareAccel ? '硬件加速时自动选择编码器' : 'H.264 兼容性好，H.265 压缩率高'}
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>音频编码</Form.Label>
                    <Form.Select
                      value={audioCodec}
                      onChange={(e) => setAudioCodec(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="copy">直接复制（推荐）</option>
                      <option value="aac">AAC 重新编码</option>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                      直接复制音频最快且无损
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>质量控制 (CRF): {crf}</Form.Label>
                    <Form.Range
                      min={18}
                      max={28}
                      value={crf}
                      onChange={(e) => setCrf(parseInt(e.target.value))}
                      disabled={taskProgress.isRunning}
                    />
                    <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                      18=极高质量（大文件） | 23=标准 | 28=低质量（小文件）
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>编码速度</Form.Label>
                    <Form.Select
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
                    <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                      速度越慢质量越好，文件越小
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Alert variant={useHardwareAccel ? 'success' : 'info'} className="mb-3">
                <small>
                  {useHardwareAccel ? (
                    <>
                      <strong>⚡ 硬件加速已启用：</strong>
                      处理速度将大幅提升（通常 5-10 倍）！VideoToolbox 适用于 macOS 系统。
                    </>
                  ) : (
                    <>
                      <strong>💡 提示：</strong>
                      字幕烧录需要重新编码视频，建议启用硬件加速以提升速度。
                      软件编码推荐 CRF=23 和 medium preset。
                    </>
                  )}
                </small>
              </Alert>

              <div className="d-grid">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBurn}
                  disabled={!videoFile || !subtitleFile || taskProgress.isRunning || ffmpegAvailable === false}
                >
                  {taskProgress.isRunning && taskProgress.taskType === 'burn' ? '烧录中...' : '开始烧录'}
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* 烧录进度 */}
          {taskProgress.isRunning && taskProgress.taskType === 'burn' && (
            <Card className="mb-3">
              <Card.Body>
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
              </Card.Body>
            </Card>
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
          <Card className="mb-3">
            <Card.Header>
              <FaInfoCircle className="me-2" />
              功能说明
            </Card.Header>
            <Card.Body>
              <h6>使用步骤：</h6>
              <ol className="small">
                <li>选择视频文件</li>
                <li>选择字幕文件 (SRT/ASS)</li>
                <li>配置编码参数</li>
                <li>点击"开始烧录"</li>
                <li>选择保存位置</li>
                <li>等待烧录完成</li>
              </ol>

              <hr />

              <h6>支持格式：</h6>
              <ul className="small mb-2">
                <li><strong>SRT：</strong>最常用的字幕格式</li>
                <li><strong>ASS/SSA：</strong>支持高级样式</li>
                <li><strong>VTT：</strong>Web 字幕格式</li>
              </ul>

              <hr />

              <h6>参数说明：</h6>
              <ul className="small mb-0">
                <li><strong>CRF：</strong>控制质量，推荐 23</li>
                <li><strong>Preset：</strong>编码速度，推荐 medium</li>
                <li><strong>H.264：</strong>兼容性最好</li>
                <li><strong>H.265：</strong>文件更小，但编码慢</li>
              </ul>
            </Card.Body>
          </Card>

          {/* 日志提示 */}
          {logs.length > 0 && (
            <Card className="mb-3">
              <Card.Header>📋 处理日志</Card.Header>
              <Card.Body className="text-center" style={{ padding: '20px' }}>
                <p className="mb-2" style={{ fontSize: '13px', color: '#6c757d' }}>
                  共 {logs.length} 条日志记录
                </p>
                <p className="mb-0" style={{ fontSize: '11px', color: '#adb5bd' }}>
                  详细日志请查看专门的日志页面
                </p>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubtitleBurnTab;

