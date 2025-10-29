import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { FaFileVideo, FaFileAudio, FaPlay, FaCog, FaInfoCircle } from 'react-icons/fa';
import type { VideoInfo, AudioInfo, MergeProgress } from '../../../shared/types/merge.types';
import type { TaskProgress } from '../../App';

const { ipcRenderer } = window.require('electron');

interface MergeTabProps {
  addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
  taskProgress: TaskProgress;
  setTaskProgress: React.Dispatch<React.SetStateAction<TaskProgress>>;
}

function MergeTab({ addLog, taskProgress, setTaskProgress }: MergeTabProps) {
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
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
    const progressHandler = (_event: any, progressData: MergeProgress) => {
      setTaskProgress({
        taskType: 'merge',
        isRunning: true,
        progress: progressData.percent,
        progressText: progressData.timemark 
          ? `进度: ${progressData.percent}% | 时间: ${progressData.timemark}`
          : `${progressData.percent}%`
      });
    };

    ipcRenderer.on('merge-progress', progressHandler);

    return () => {
      ipcRenderer.removeListener('merge-progress', progressHandler);
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

  const handleSelectAudio = async () => {
    try {
      const filePath = await ipcRenderer.invoke('select-audio-file');
      if (filePath) {
        setAudioFile(filePath);
        setResult(null);
        addLocalLog(`选择音频: ${filePath}`, 'info');

        // 获取音频信息
        const info = await ipcRenderer.invoke('get-audio-info', filePath);
        if (info) {
          setAudioInfo(info);
          addLocalLog(`音频信息: ${info.codec}, ${info.bitrate / 1000}kbps, ${info.sampleRate}Hz`, 'info');
        }
      }
    } catch (error) {
      addLocalLog('选择音频文件失败', 'error');
    }
  };

  const handleMerge = async () => {
    if (!videoFile || !audioFile) {
      addLocalLog('请先选择视频和音频文件', 'error');
      return;
    }

    // 更新全局状态
    setTaskProgress({
      taskType: 'merge',
      isRunning: true,
      progress: 0,
      progressText: '准备中...'
    });
    setResult(null);

    try {
      addLocalLog('开始音视频合并', 'info');

      // 选择输出路径
      const videoFileName = videoFile.split(/[\\/]/).pop() || 'output.mp4';
      const defaultFileName = videoFileName.replace(/\.[^.]+$/, '_merged.mp4');
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
      if (videoCodec !== 'copy' && useHardwareAccel) {
        addLocalLog(`✨ 硬件加速: ${hwaccel.toUpperCase()}`, 'info');
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
        addLocalLog('✓ 合并成功！', 'success');
        setResult({
          success: true,
          message: '音视频合并完成',
          outputPath: result.outputPath,
        });
        setTaskProgress({
          taskType: null,
          isRunning: false,
          progress: 100,
          progressText: '合并完成'
        });
      } else {
        addLocalLog(`合并失败: ${result.message}`, 'error');
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
      addLocalLog(`合并失败: ${errorMessage}`, 'error');
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
    <div className="merge-container">
      <div className="merge-header">
        <h2>
          <FaPlay className="me-2" />
          音视频合并
        </h2>
      </div>

      <div className="merge-content">
        <div className="main-area">
          {/* FFmpeg 状态检查 */}
          {ffmpegAvailable === false && (
            <Alert variant="danger" className="mb-3">
              <Alert.Heading>❌ FFmpeg 不可用</Alert.Heading>
              <p>FFmpeg 组件未能正常加载，音视频合并功能无法使用。</p>
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
                  style={{ 
                    backgroundColor: '#e9ecef',
                    border: '1px solid #ced4da',
                    color: '#495057',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontWeight: '500',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  浏览...
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

          {/* 音频文件选择 */}
          <Card className="mb-3">
            <Card.Header>
              <FaFileAudio className="me-2" />
              选择音频文件
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3">
                <Button 
                  onClick={handleSelectAudio}
                  style={{ 
                    backgroundColor: '#e9ecef',
                    border: '1px solid #ced4da',
                    color: '#495057',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontWeight: '500',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  浏览...
                </Button>
                <div className="flex-grow-1">
                  {audioFile ? (
                    <div>
                      <div className="text-truncate">
                        <strong>{audioFile.split(/[\\/]/).pop()}</strong>
                      </div>
                      {audioInfo && (
                        <div className="text-muted small mt-1">
                          {audioInfo.codec} | 
                          {' '}{Math.round(audioInfo.bitrate / 1000)}kbps | 
                          {' '}{audioInfo.sampleRate}Hz | 
                          {' '}{audioInfo.channels}声道 | 
                          {' '}{formatDuration(audioInfo.duration)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">未选择音频文件</span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* 合并设置 */}
          <Card className="mb-3">
            <Card.Header>
              <FaCog className="me-2" />
              合并设置
            </Card.Header>
            <Card.Body>
              {/* 硬件加速开关 */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="merge-hardware-accel-switch"
                  label={
                    <span>
                      ⚡ 启用硬件加速 
                      <Badge bg="success" className="ms-2">5-10x 更快</Badge>
                      {videoCodec === 'copy' && (
                        <Badge bg="secondary" className="ms-2">仅重新编码可用</Badge>
                      )}
                    </span>
                  }
                    checked={useHardwareAccel}
                    onChange={(e) => setUseHardwareAccel(e.target.checked)}
                    disabled={taskProgress.isRunning || videoCodec === 'copy'}
                />
                <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                  {videoCodec === 'copy' 
                    ? '直接复制模式不需要硬件加速（已是最快方式）。选择重新编码可启用硬件加速。'
                    : '使用 GPU 加速视频编码，大幅提升处理速度'
                  }
                </Form.Text>
              </Form.Group>

              {useHardwareAccel && videoCodec !== 'copy' && (
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
              )}

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>视频编码</Form.Label>
                    <Form.Select
                      value={videoCodec}
                      onChange={(e) => setVideoCodec(e.target.value as any)}
                      disabled={taskProgress.isRunning}
                    >
                      <option value="copy">直接复制（最快，推荐）</option>
                      <option value="libx264">H.264 重新编码</option>
                      <option value="libx265">H.265 重新编码</option>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                      {videoCodec === 'copy' 
                        ? '推荐使用"直接复制"以获得最快速度且无损质量'
                        : '重新编码可启用硬件加速，大幅提升处理速度'
                      }
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
                      <option value="aac">AAC（推荐）</option>
                      <option value="mp3">MP3</option>
                      <option value="copy">直接复制</option>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                      AAC 是最通用的音频格式
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {audioCodec !== 'copy' && (
                <Form.Group className="mb-3">
                  <Form.Label>音频比特率</Form.Label>
                  <Form.Select
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(e.target.value)}
                      disabled={taskProgress.isRunning}
                  >
                    <option value="128k">128 kbps（普通质量）</option>
                    <option value="192k">192 kbps（较好质量）</option>
                    <option value="256k">256 kbps（高质量）</option>
                    <option value="320k">320 kbps（极高质量）</option>
                  </Form.Select>
                </Form.Group>
              )}

              <div className="d-grid">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleMerge}
                  disabled={!videoFile || !audioFile || taskProgress.isRunning || ffmpegAvailable === false}
                >
                  {taskProgress.isRunning && taskProgress.taskType === 'merge' ? '合并中...' : '开始合并'}
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* 合并进度 */}
          {taskProgress.isRunning && taskProgress.taskType === 'merge' && (
            <Card className="mb-3">
              <Card.Body>
                <h6>合并进度</h6>
                <ProgressBar
                  now={taskProgress.progress}
                  label={`${taskProgress.progress}%`}
                  animated={taskProgress.progress < 100}
                  variant={taskProgress.progress === 100 ? 'success' : 'primary'}
                />
                {taskProgress.progressText && (
                  <div className="text-muted small mt-2">{taskProgress.progressText}</div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* 合并结果 */}
          {result && (
            <Alert variant={result.success ? 'success' : 'danger'}>
              <Alert.Heading>
                {result.success ? '✅ 合并成功！' : '❌ 合并失败'}
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
                <li>选择音频文件</li>
                <li>配置编码参数（可选）</li>
                <li>点击"开始合并"</li>
                <li>选择保存位置</li>
                <li>等待合并完成</li>
              </ol>

              <hr />

              <h6>编码说明：</h6>
              <ul className="small">
                <li>
                  <strong>直接复制：</strong>不重新编码，速度最快，推荐使用
                </li>
                <li>
                  <strong>重新编码：</strong>可以调整参数，但速度较慢
                </li>
                <li>
                  <strong>AAC 音频：</strong>兼容性最好，推荐使用
                </li>
              </ul>

              <hr />

              <h6>支持格式：</h6>
              <p className="small mb-0">
                <strong>视频：</strong>MP4, AVI, MKV, MOV, FLV, WMV, WebM<br />
                <strong>音频：</strong>MP3, AAC, WAV, FLAC, M4A, WMA, OGG
              </p>
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

export default MergeTab;

