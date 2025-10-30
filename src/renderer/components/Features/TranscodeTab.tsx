import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, ProgressBar } from 'react-bootstrap';
import type { TranscodeConfig, VideoInfo, AIConfig } from '../../../types/transcode.types';

const { ipcRenderer } = (window as any).electron;

// 状态持久化 key
const STORAGE_KEY = 'transcode_tab_state';

function TranscodeTab() {
  // 从 localStorage 恢复状态
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedState = loadState();

  const [videoFile, setVideoFile] = useState<string>(savedState.videoFile || '');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(savedState.videoInfo || null);
  const [outputPath, setOutputPath] = useState<string>(savedState.outputPath || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ message: string; type: string }>>([]);
  

  // AI 配置
  const [aiEnabled, setAiEnabled] = useState(savedState.aiEnabled || false);
  const [aiPlatform, setAiPlatform] = useState<'deepseek' | 'openai'>(savedState.aiPlatform || 'deepseek');
  const [aiApiKey, setAiApiKey] = useState(savedState.aiApiKey || '');
  const [aiSuggestion, setAiSuggestion] = useState<any>(savedState.aiSuggestion || null);

  // 转码参数
  const [transcodeConfig, setTranscodeConfig] = useState<Partial<TranscodeConfig>>(savedState.transcodeConfig || {
    format: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 23,
    preset: 'medium',
    useHardwareAccel: false,
    hwaccel: 'none',
  });

  // 保存状态到 localStorage
  useEffect(() => {
    const stateToSave = {
      videoFile,
      videoInfo,
      outputPath,
      aiEnabled,
      aiPlatform,
      aiApiKey,
      aiSuggestion,
      transcodeConfig,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [videoFile, videoInfo, outputPath, aiEnabled, aiPlatform, aiApiKey, aiSuggestion, transcodeConfig]);

  const addLog = (message: string, type: string = 'info') => {
    setLogs((prev) => [...prev, { message, type }].slice(-10));
  };

  const handleSelectVideo = async () => {
    try {
      const filePath = await ipcRenderer.invoke('select-video-file');
      if (!filePath) return;

      setVideoFile(filePath);
      addLog(`选择视频: ${filePath}`, 'success');

      // 获取视频信息
      try {
        const info = await ipcRenderer.invoke('get-video-info', filePath);
        setVideoInfo(info);
        const codec = info.videoCodec ? info.videoCodec.toUpperCase() : 'UNKNOWN';
        const bitrate = info.bitrate ? (info.bitrate / 1000000).toFixed(2) : '0.00';
        addLog(
          `视频信息: ${info.width}x${info.height} ${codec}, ${bitrate}Mbps, ${Math.floor(info.duration / 60)}:${Math.round(info.duration % 60).toString().padStart(2, '0')}`,
          'success'
        );

        // 自动设置输出路径
        const defaultOutput = filePath.replace(/\.[^.]+$/, '_转码.mp4');
        setOutputPath(defaultOutput);
      } catch (error: any) {
        addLog(`获取视频信息失败: ${error.message}`, 'error');
      }
    } catch (error: any) {
      addLog(`选择文件失败: ${error.message}`, 'error');
    }
  };

  const handleSelectOutput = async () => {
    try {
      const filePath = await ipcRenderer.invoke('select-output-path', '转码视频.mp4');
      if (filePath) {
        setOutputPath(filePath);
        addLog(`设置输出路径: ${filePath}`, 'success');
      }
    } catch (error: any) {
      addLog(`选择输出路径失败: ${error.message}`, 'error');
    }
  };

  const handleAIOptimize = async () => {
    if (!videoInfo) {
      addLog('请先选择视频', 'error');
      return;
    }

    try {
      // 如果启用了 AI 但没有 API Key，提示但仍然继续（会自动降级到规则引擎）
      if (aiEnabled && !aiApiKey) {
        addLog('⚠️ 未配置 API Key，将使用规则引擎优化', 'info');
      } else if (aiEnabled) {
        addLog('🤖 AI 正在分析视频参数...', 'info');
      } else {
        addLog('🔧 规则引擎正在分析视频参数...', 'info');
      }

      const aiConfig: AIConfig | undefined = aiEnabled && aiApiKey
        ? {
            enabled: true,
            platform: aiPlatform,
            apiKey: aiApiKey,
          }
        : undefined;

      const suggestion = await ipcRenderer.invoke(
        'optimize-transcode-params',
        videoInfo,
        { target: 'balanced' }, // 默认平衡模式
        aiConfig
      );

      // 自动应用 AI 推荐的配置
      setTranscodeConfig(suggestion.config);
      
      // 简单记录建议，但不显示在界面上
      setAiSuggestion(suggestion);
      
      addLog(`✅ AI 已自动配置参数！${suggestion.reason}`, 'success');
      addLog(`📊 预估输出大小: ~${suggestion.estimatedSize}MB (置信度: ${(suggestion.confidence * 100).toFixed(0)}%)`, 'info');
    } catch (error: any) {
      addLog(`❌ AI 优化失败: ${error.message}`, 'error');
    }
  };

  const handleStartTranscode = async () => {
    if (!videoFile || !outputPath) {
      addLog('请选择输入和输出文件', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      addLog('开始转码...', 'info');

      const config: TranscodeConfig = {
        inputPath: videoFile,
        outputPath,
        ...transcodeConfig,
      } as TranscodeConfig;

      // 监听进度
      ipcRenderer.on('transcode-progress', (_: any, progressData: any) => {
        setProgress(progressData.percent);
        addLog(
          `进度: ${progressData.percent}% (${progressData.speed.toFixed(1)}x)`,
          'info'
        );
      });

      await ipcRenderer.invoke('start-transcode', config);

      addLog('转码完成！', 'success');
      setProgress(100);
    } catch (error: any) {
      addLog(`转码失败: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      ipcRenderer.removeAllListeners('transcode-progress');
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      overflow: 'auto', 
      padding: '20px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 className="mb-4">🎬 视频转码</h3>

      {/* 文件选择 */}
      <Card className="mb-3">
        <Card.Header>
          <strong>1. 选择文件</strong>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>输入视频</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                value={videoFile || ''}
                placeholder="选择视频文件..."
                readOnly
              />
              <Button onClick={handleSelectVideo} variant="outline-primary">
                浏览...
              </Button>
            </div>
          </Form.Group>

          {videoInfo && (
            <Alert variant="info" className="mt-2">
              <div style={{ fontSize: '0.9rem' }}>
                <strong>📹 视频信息</strong>
                <div className="mt-2" style={{ lineHeight: '1.8' }}>
                  <div className="row">
                    <div className="col-md-6">
                      <span className="text-muted">分辨率：</span>
                      <strong>{videoInfo.width || 0}x{videoInfo.height || 0}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">帧率：</span>
                      <strong>{(videoInfo.fps || 0).toFixed(2)} fps</strong>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <span className="text-muted">时长：</span>
                      <strong>
                        {Math.floor((videoInfo.duration || 0) / 60)}分{Math.round((videoInfo.duration || 0) % 60)}秒
                      </strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">文件大小：</span>
                      <strong>{((videoInfo.size || 0) / 1024 / 1024).toFixed(2)} MB</strong>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <span className="text-muted">视频编码：</span>
                      <strong>{videoInfo.videoCodec ? videoInfo.videoCodec.toUpperCase() : 'UNKNOWN'}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">音频编码：</span>
                      <strong>{videoInfo.audioCodec ? videoInfo.audioCodec.toUpperCase() : 'NONE'}</strong>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <span className="text-muted">总比特率：</span>
                      <strong>{((videoInfo.bitrate || 0) / 1000000).toFixed(2)} Mbps</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">音频码率：</span>
                      <strong>{((videoInfo.audioBitrate || 0) / 1000).toFixed(0)} kbps</strong>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <span className="text-muted">格式：</span>
                      <strong>{videoInfo.formatName || 'UNKNOWN'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
          )}

          <Form.Group>
            <Form.Label>输出路径</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control type="text" value={outputPath || ''} readOnly />
              <Button onClick={handleSelectOutput} variant="outline-primary">
                浏览...
              </Button>
            </div>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* AI 优化 */}
      <Card className="mb-3">
        <Card.Header>
          <strong>2. AI 智能优化 (可选)</strong>
        </Card.Header>
        <Card.Body>
          <Form.Check
            type="checkbox"
            label="启用 AI 智能优化"
            checked={aiEnabled}
            onChange={(e) => setAiEnabled(e.target.checked)}
            className="mb-3"
          />

          {aiEnabled && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>AI 平台</Form.Label>
                <Form.Select
                  value={aiPlatform || 'deepseek'}
                  onChange={(e) => setAiPlatform(e.target.value as any)}
                >
                  <option value="deepseek">DeepSeek (推荐，便宜)</option>
                  <option value="openai">OpenAI</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <Form.Control
                  type="password"
                  value={aiApiKey || ''}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="输入你的 API Key..."
                />
                <Form.Text className="text-muted">
                  需要自己申请 API Key。DeepSeek: ¥0.001/次, OpenAI: $0.001/次
                </Form.Text>
              </Form.Group>

              <Button 
                onClick={handleAIOptimize} 
                disabled={!videoInfo || isProcessing}
                variant="primary"
                className="w-100"
              >
                🤖 AI 自动配置参数
              </Button>
              <Form.Text className="text-muted d-block mt-2">
                AI 会根据视频特征自动推荐并应用最佳转码参数
              </Form.Text>
            </>
          )}
        </Card.Body>
      </Card>

      {/* 转码参数 */}
      <Card className="mb-3">
        <Card.Header>
          <strong>3. 转码参数</strong>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>格式</Form.Label>
                <Form.Select
                  value={transcodeConfig.format || 'mp4'}
                  onChange={(e) =>
                    setTranscodeConfig({ ...transcodeConfig, format: e.target.value as any })
                  }
                >
                  <option value="mp4">MP4</option>
                  <option value="mkv">MKV</option>
                  <option value="webm">WebM</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>视频编码</Form.Label>
                <Form.Select
                  value={transcodeConfig.videoCodec || 'libx264'}
                  onChange={(e) =>
                    setTranscodeConfig({ ...transcodeConfig, videoCodec: e.target.value as any })
                  }
                >
                  <option value="copy">流式复制 (无损，极快)</option>
                  <option value="libx264">H.264</option>
                  <option value="libx265">H.265 (更小)</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>质量 (CRF): {transcodeConfig.crf}</Form.Label>
                <Form.Range
                  min={18}
                  max={28}
                  value={transcodeConfig.crf || 23}
                  onChange={(e) =>
                    setTranscodeConfig({ ...transcodeConfig, crf: parseInt(e.target.value) })
                  }
                />
                <Form.Text className="text-muted">18=高质量, 23=默认, 28=小文件</Form.Text>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>编码速度</Form.Label>
                <Form.Select
                  value={transcodeConfig.preset || 'medium'}
                  onChange={(e) =>
                    setTranscodeConfig({ ...transcodeConfig, preset: e.target.value as any })
                  }
                >
                  <option value="veryfast">极快</option>
                  <option value="fast">快速</option>
                  <option value="medium">中等</option>
                  <option value="slow">慢速 (高质量)</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="🚀 启用硬件加速 (VideoToolbox)"
                  checked={transcodeConfig.useHardwareAccel || false}
                  onChange={(e) =>
                    setTranscodeConfig({
                      ...transcodeConfig,
                      useHardwareAccel: e.target.checked,
                      hwaccel: e.target.checked ? 'videotoolbox' : 'none',
                    })
                  }
                />
                <Form.Text className="text-muted">
                  硬件加速可提升 3-10 倍速度，但 H.265 可能不支持
                </Form.Text>
              </Form.Group>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* 进度和日志 */}
      {isProcessing && (
        <Card className="mb-3">
          <Card.Body>
            <div className="mb-2">
              <strong>转码进度: {progress}%</strong>
            </div>
            <ProgressBar now={progress} animated striped variant="success" />
          </Card.Body>
        </Card>
      )}

      {logs.length > 0 && (
        <Card className="mb-3">
          <Card.Header>
            <strong>日志</strong>
          </Card.Header>
          <Card.Body style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {logs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  color: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'inherit',
                  fontSize: '13px',
                  marginBottom: '5px',
                }}
              >
                {log.message}
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="d-flex gap-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStartTranscode}
          disabled={!videoFile || !outputPath || isProcessing}
        >
          {isProcessing ? '转码中...' : '🚀 开始转码'}
        </Button>

        {isProcessing && (
          <Button
            variant="danger"
            size="lg"
            onClick={() => ipcRenderer.invoke('cancel-transcode')}
          >
            取消
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}

export default TranscodeTab;

