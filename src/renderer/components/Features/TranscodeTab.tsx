import { useState, useEffect } from 'react';
import { Button, Form, ProgressBar, Row, Col, Nav } from 'react-bootstrap';
import styles from './TranscodeTab.module.scss';
import tabs from '../../styles/components/Tabs.module.scss';
import type { TranscodeConfig, VideoInfo, AIConfig } from '../../../types/transcode.types';

const { ipcRenderer } = (window as any).electron;

// 用户设置持久化 key（仅保存设置，不保存文件路径）
const SETTINGS_KEY = 'transcode_tab_settings';

// 检测操作系统
const getPlatform = (): 'darwin' | 'win32' | 'linux' => {
  return (window as any).electron?.process?.platform || 'darwin';
};

// 获取硬件加速选项
const getHardwareAccelOptions = () => {
  const platform = getPlatform();
  switch (platform) {
    case 'darwin':
      return {
        label: '启用硬件加速 (VideoToolbox)',
        value: 'videotoolbox',
        description: '硬件加速可提升 3-10 倍速度'
      };
    case 'win32':
      return {
        label: '启用硬件加速 (NVENC/QSV)',
        value: 'auto',
        description: 'NVIDIA 或 Intel 硬件加速'
      };
    case 'linux':
      return {
        label: '启用硬件加速 (VAAPI)',
        value: 'vaapi',
        description: '硬件加速可提升转码速度'
      };
    default:
      return {
        label: '启用硬件加速',
        value: 'auto',
        description: '硬件加速可提升转码速度'
      };
  }
};

function TranscodeTab() {
  // 从 localStorage 恢复用户设置（不包括文件路径）
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedSettings = loadSettings();

  // 临时状态（不持久化）
  const [videoFile, setVideoFile] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [outputPath, setOutputPath] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ message: string; type: string }>>([]);
  const [activeTab, setActiveTab] = useState<string>('basic');
  
  // AI 配置（持久化）
  const [aiEnabled, setAiEnabled] = useState(savedSettings.aiEnabled || false);
  const [aiPlatform, setAiPlatform] = useState<'deepseek' | 'openai'>(savedSettings.aiPlatform || 'deepseek');
  const [aiApiKey, setAiApiKey] = useState(savedSettings.aiApiKey || '');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  // 转码参数（不持久化，每次使用默认值）
  const [transcodeConfig, setTranscodeConfig] = useState<Partial<TranscodeConfig>>({
    format: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 23,
    preset: 'medium',
    useHardwareAccel: false,
    hwaccel: 'none',
    // 尺寸相关
    rotate: 0,
    flip: 'none',
    autoCrop: false,
    keepAspectRatio: true,
    scaleMode: 'fit',
    // 滤镜
    filters: {},
  });

  // 仅保存用户设置到 localStorage（不包括临时文件路径和转码参数）
  useEffect(() => {
    const settingsToSave = {
      aiEnabled,
      aiPlatform,
      aiApiKey,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
  }, [aiEnabled, aiPlatform, aiApiKey]);

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
        addLog(`视频信息加载成功`, 'success');

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
        { target: 'balanced' },
        aiConfig
      );

      setTranscodeConfig(suggestion.config);
      setAiSuggestion(suggestion);
      
      addLog(`✅ 参数已自动配置！${suggestion.reason}`, 'success');
      addLog(`📊 预估输出: ~${suggestion.estimatedSize}MB (置信度: ${(suggestion.confidence * 100).toFixed(0)}%)`, 'info');
    } catch (error: any) {
      addLog(`❌ 优化失败: ${error.message}`, 'error');
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

  const handleClearAll = () => {
    setVideoFile('');
    setVideoInfo(null);
    setOutputPath('');
    setProgress(0);
    setLogs([]);
    setAiSuggestion(null);
    addLog('已清空所有文件选择', 'info');
  };

  

  return (
    <div className={styles.root}>
      {/* 顶部拖拽区域，避免顶部点击命中标签 */}
      <div className={styles.dragArea} />
      
      {/* 顶部区域移除，统一在底部操作区显示“源/另存为” */}
      
      {/* 顶部不再显示“另存为” */}

      {/* ==================== 中间 Tab 切换区域 ==================== */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Tab 导航 */}
        <Nav 
          variant="tabs" 
          activeKey={activeTab} 
          onSelect={(k) => setActiveTab(k || 'basic')} 
          style={{ 
            borderBottom: '1px solid #ddd',
            flexShrink: 0
          }}
          className={tabs.tabsBar}
        >
          <Nav.Item>
            <Nav.Link eventKey="basic" className={styles.navLink}>摘要</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="dimensions" className={styles.navLink}>尺寸</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="filters" className={styles.navLink}>滤镜</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="video" className={styles.navLink}>视频</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="audio" className={styles.navLink}>音频</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="subtitle" className={styles.navLink}>字幕</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Tab 内容 */}
        <div className={styles.contentArea}>
          
          {/* Tab 1: 基本信息 */}
          {activeTab === 'basic' && (
            <div>
              {!videoInfo ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#999',
                  fontSize: '12px'
                }}>
                  请先选择视频文件
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* 左侧：视频预览图 (16:9) - 最大化空间 */}
                  <div style={{ 
                    flex: 1,
                    minWidth: 0
                  }}>
                    <div style={{ 
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 比例
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#000',
                      overflow: 'hidden'
                    }}>
                      {videoInfo.thumbnail ? (
                        <img 
                          src={videoInfo.thumbnail} 
                          alt="视频预览"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                          fontSize: '10px'
                        }}>
                          正在加载预览图...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右侧：详细信息 */}
                  <div style={{ width: '300px', flexShrink: 0 }}>
                    {/* 视频信息 */}
                    <div style={{ border: '1px solid #ddd', marginBottom: '8px', borderRadius: '4px' }}>
                      <div style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#d3d3d3', 
                        borderTopLeftRadius: '4px', 
                        borderTopRightRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        视频
                      </div>
                      <div style={{ padding: '10px 12px', fontSize: '10px', lineHeight: '1.7' }}>
                        <div><strong>编码:</strong> {videoInfo.videoCodec?.toUpperCase()}</div>
                        <div><strong>Profile:</strong> {videoInfo.profile}, Level: {videoInfo.level}</div>
                        <div><strong>分辨率:</strong> {videoInfo.width} × {videoInfo.height}</div>
                        <div><strong>帧率:</strong> {videoInfo.fps?.toFixed(2)} FPS</div>
                        <div><strong>比特率:</strong> {((videoInfo.bitrate || 0) / 1000000).toFixed(2)} Mbps</div>
                        <div><strong>像素格式:</strong> {videoInfo.pixelFormat}</div>
                        <div><strong>位深度:</strong> {videoInfo.bitDepth} bit</div>
                      </div>
                    </div>

                    {/* 音频信息 */}
                    <div style={{ border: '1px solid #ddd', marginBottom: '8px', borderRadius: '4px' }}>
                      <div style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#d3d3d3', 
                        borderTopLeftRadius: '4px', 
                        borderTopRightRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        音频
                      </div>
                      <div style={{ padding: '10px 12px', fontSize: '10px', lineHeight: '1.7' }}>
                        <div><strong>编码:</strong> {videoInfo.audioCodec?.toUpperCase()}</div>
                        <div><strong>比特率:</strong> {((videoInfo.audioBitrate || 0) / 1000).toFixed(0)} kbps</div>
                        <div><strong>采样率:</strong> {videoInfo.sampleRate} Hz</div>
                        <div><strong>声道:</strong> {videoInfo.channels} ({videoInfo.channelLayout})</div>
                      </div>
                    </div>

                    {/* 文件信息 */}
                    <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      <div style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#d3d3d3', 
                        borderTopLeftRadius: '4px', 
                        borderTopRightRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        文件
                      </div>
                      <div style={{ padding: '10px 12px', fontSize: '10px', lineHeight: '1.7' }}>
                        <div><strong>格式:</strong> {videoInfo.formatName}</div>
                        <div><strong>时长:</strong> {Math.floor(videoInfo.duration / 60)}:{String(Math.round(videoInfo.duration % 60)).padStart(2, '0')}</div>
                        <div><strong>大小:</strong> {(videoInfo.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 视频参数 */}
          {activeTab === 'video' && (
            <div>
              {/* 基础设置 */}
              <fieldset className={styles.fieldset}>
                <legend style={{ display: 'none' }}>输出格式</legend>
                
                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    格式:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.format || 'mp4'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, format: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="mp4">MP4</option>
                      <option value="mkv">MKV</option>
                      <option value="webm">WebM</option>
                    </Form.Select>
                  </Col>
                  <Form.Label column sm={2} style={{ fontSize: '10px', textAlign: 'right' }}>
                    视频编码:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.videoCodec || 'libx264'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, videoCodec: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="copy">流式复制 (无损)</option>
                      <option value="libx264">H.264</option>
                      <option value="libx265">H.265</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </fieldset>

              {/* 质量设置 */}
              <fieldset className={styles.fieldset}>
                <legend style={{ display: 'none' }}>质量</legend>
                
                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    质量 (CRF):
                  </Form.Label>
                  <Col sm={6}>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Range
                        min={18}
                        max={28}
                        value={transcodeConfig.crf || 23}
                        onChange={(e) =>
                          setTranscodeConfig({ ...transcodeConfig, crf: parseInt(e.target.value) })
                        }
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '10px', minWidth: '30px' }}>{transcodeConfig.crf}</span>
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      (18=高质量, 23=默认, 28=小文件)
                    </div>
                  </Col>
                </Form.Group>
              </fieldset>

              {/* 帧率设置 */}
              <fieldset className={styles.fieldset}>
                <legend style={{ display: 'none' }}>帧率 (FPS)</legend>
                
                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    帧率:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.framerate || 'original'}
                      onChange={(e) =>
                        setTranscodeConfig({ 
                          ...transcodeConfig, 
                          framerate: e.target.value === 'original' ? 'original' : parseInt(e.target.value)
                        })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="original">保持原始帧率</option>
                      <option value="24">24 FPS (电影)</option>
                      <option value="25">25 FPS (PAL)</option>
                      <option value="30">30 FPS (标准)</option>
                      <option value="50">50 FPS (高帧率)</option>
                      <option value="60">60 FPS (高帧率)</option>
                    </Form.Select>
                  </Col>
                  <Form.Label column sm={2} style={{ fontSize: '10px', textAlign: 'right' }}>
                    帧率模式:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.framerateMode || 'cfr'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, framerateMode: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="cfr">恒定帧率 (CFR)</option>
                      <option value="vfr">可变帧率 (VFR)</option>
                      <option value="pfr">峰值帧率 (PFR)</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </fieldset>

              {/* 编码器设置 */}
              <fieldset className={styles.fieldset}>
                <legend style={{ display: 'none' }}>编码器设置</legend>
                
                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    编码速度:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.preset || 'medium'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, preset: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="ultrafast">超快</option>
                      <option value="veryfast">极快</option>
                      <option value="fast">快速</option>
                      <option value="medium">中等</option>
                      <option value="slow">慢速 (高质量)</option>
                      <option value="slower">更慢</option>
                      <option value="veryslow">极慢 (最高质量)</option>
                    </Form.Select>
                  </Col>
                  <Form.Label column sm={2} style={{ fontSize: '10px', textAlign: 'right' }}>
                    调优:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.tune || 'none'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, tune: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="none">无</option>
                      <option value="film">电影</option>
                      <option value="animation">动画</option>
                      <option value="grain">颗粒感</option>
                      <option value="stillimage">静止图像</option>
                    </Form.Select>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    Profile:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.profile || 'auto'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, profile: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="auto">自动</option>
                      <option value="baseline">Baseline</option>
                      <option value="main">Main</option>
                      <option value="high">High</option>
                    </Form.Select>
                  </Col>
                  <Form.Label column sm={2} style={{ fontSize: '10px', textAlign: 'right' }}>
                    Level:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.level || 'auto'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, level: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="auto">自动</option>
                      <option value="3.0">3.0</option>
                      <option value="3.1">3.1</option>
                      <option value="4.0">4.0</option>
                      <option value="4.1">4.1</option>
                      <option value="5.0">5.0</option>
                      <option value="5.1">5.1</option>
                    </Form.Select>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-0 align-items-center">
                  <Col sm={2}></Col>
                  <Col sm={10}>
                    {(() => {
                      const hwOptions = getHardwareAccelOptions();
                      return (
                        <Form.Check
                          type="checkbox"
                          label={`${hwOptions.label} - ${hwOptions.description}`}
                          checked={transcodeConfig.useHardwareAccel || false}
                          onChange={(e) =>
                            setTranscodeConfig({
                              ...transcodeConfig,
                              useHardwareAccel: e.target.checked,
                              hwaccel: e.target.checked ? (hwOptions.value as any) : 'none',
                            })
                          }
                          style={{ fontSize: '10px' }}
                        />
                      );
                    })()}
                  </Col>
                </Form.Group>
              </fieldset>

              {/* 信息提示 */}
              <div className={styles.infoBox}>
                <strong>提示：</strong> Preset 控制编码速度（速度越慢质量越高），Tune 针对特定内容类型优化。
              </div>
            </div>
          )}

          {/* Tab 2: 尺寸 */}
          {activeTab === 'dimensions' && (
            <div>
              {/* 方向 & 裁剪 */}
              <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>方向 & 裁剪</legend>
                
                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    翻转:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.flip || 'none'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, flip: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="none">无</option>
                      <option value="horizontal">水平</option>
                      <option value="vertical">垂直</option>
                    </Form.Select>
                  </Col>
                  <Form.Label column sm={2} style={{ fontSize: '10px', textAlign: 'right' }}>
                    旋转:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.rotate || 0}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, rotate: parseInt(e.target.value) as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value={0}>0°</option>
                      <option value={90}>90°</option>
                      <option value={180}>180°</option>
                      <option value={270}>270°</option>
                    </Form.Select>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-0 align-items-center">
                  <Col sm={2}></Col>
                  <Col sm={10}>
                    <Form.Check
                      type="checkbox"
                      label="自动裁剪黑边"
                      checked={transcodeConfig.autoCrop || false}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, autoCrop: e.target.checked })
                      }
                      style={{ fontSize: '10px' }}
                    />
                  </Col>
                </Form.Group>
              </fieldset>

              {/* 分辨率 & 缩放 */}
              <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>分辨率 & 缩放</legend>
                
                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    分辨率:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={typeof transcodeConfig.resolution === 'string' ? transcodeConfig.resolution : 'custom'}
                      onChange={(e) => {
                        if (e.target.value === 'original') {
                          setTranscodeConfig({ ...transcodeConfig, resolution: 'original' });
                        } else {
                          const presets: any = {
                            '4K': { width: 3840, height: 2160 },
                            '1440p': { width: 2560, height: 1440 },
                            '1080p': { width: 1920, height: 1080 },
                            '720p': { width: 1280, height: 720 },
                            '480p': { width: 854, height: 480 },
                          };
                          setTranscodeConfig({ ...transcodeConfig, resolution: presets[e.target.value] || 'original' });
                        }
                      }}
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="original">原始分辨率</option>
                      <option value="4K">3840×2160 (4K)</option>
                      <option value="1440p">2560×1440 (2K)</option>
                      <option value="1080p">1920×1080 (Full HD)</option>
                      <option value="720p">1280×720 (HD)</option>
                      <option value="480p">854×480 (SD)</option>
                    </Form.Select>
                  </Col>
                  <Form.Label column sm={2} style={{ fontSize: '10px', textAlign: 'right' }}>
                    缩放模式:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.scaleMode || 'fit'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, scaleMode: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="fit">适应 (保持比例)</option>
                      <option value="fill">填充</option>
                      <option value="stretch">拉伸</option>
                    </Form.Select>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-0 align-items-center">
                  <Col sm={2}></Col>
                  <Col sm={10}>
                    <Form.Check
                      type="checkbox"
                      label="保持宽高比"
                      checked={transcodeConfig.keepAspectRatio !== false}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, keepAspectRatio: e.target.checked })
                      }
                      style={{ fontSize: '10px' }}
                    />
                  </Col>
                </Form.Group>
              </fieldset>

              {/* 尺寸信息汇总 */}
              <fieldset style={{ border: 'none', backgroundColor: '#f8f9fa', padding: '8px 12px', marginTop: '8px' }}>
                <legend style={{ display: 'none' }}>尺寸信息</legend>
                {videoInfo ? (
                  <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.8' }}>
                    <div><strong>存储大小:</strong> {videoInfo.width}×{videoInfo.height}</div>
                    <div><strong>显示大小:</strong> {videoInfo.width}×{videoInfo.height}</div>
                    <div><strong>宽高比:</strong> {(videoInfo.width / videoInfo.height).toFixed(2)}</div>
                    <div style={{ borderTop: '1px solid #ddd', marginTop: '6px', paddingTop: '6px' }}>
                      {transcodeConfig.resolution && transcodeConfig.resolution !== 'original' ? (
                        <>
                          <div><strong>输出尺寸:</strong> {(transcodeConfig.resolution as any).width}×{(transcodeConfig.resolution as any).height}</div>
                          <div><strong>输出宽高比:</strong> {((transcodeConfig.resolution as any).width / (transcodeConfig.resolution as any).height).toFixed(2)}</div>
                        </>
                      ) : (
                        <div><strong>输出尺寸:</strong> {videoInfo.width}×{videoInfo.height} (保持原始)</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: '#999' }}>请先选择视频文件</div>
                )}
              </fieldset>
            </div>
          )}

          {/* Tab 3: 滤镜 */}
          {activeTab === 'filters' && (
            <div className={styles.filtersPane}>
              {/* 预设 */}
              <fieldset style={{ border: 'none', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>预设</legend>
                <Form.Group as={Row} className={`mb-1 align-items-center ${styles.rowTight}`}>
                  <Form.Label column sm={1} className={styles.label}>
                    预设：
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select size="sm" defaultValue="default" className={styles.select}>
                      <option value="default">默认</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </fieldset>
              {/* 反交错 */}
              <fieldset style={{ border: 'none', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>反交错滤镜</legend>
                
                <Form.Group as={Row} className={`mb-1 align-items-center ${styles.rowTight}`}>
                  <Form.Label column sm={1} className={styles.label}>
                    反交错：
                  </Form.Label>
                  <Col sm={4}>
                    <div className={styles.fieldWrap}>
                      <Form.Select
                        size="sm"
                        value={transcodeConfig.filters?.deinterlaceMode || 'none'}
                        onChange={(e) =>
                          setTranscodeConfig({
                            ...transcodeConfig,
                            filters: { ...transcodeConfig.filters, deinterlaceMode: e.target.value as any, deinterlace: e.target.value !== 'none' }
                          })
                        }
                        className={styles.select}
                      >
                        <option value="none">关</option>
                        <option value="yadif">Yadif (标准)</option>
                        <option value="bwdif">BWDif (高质量)</option>
                      </Form.Select>
                      <span className={styles.help}>减少锯齿与闪烁</span>
                    </div>
                  </Col>
                </Form.Group>
              </fieldset>

              {/* 降噪 */}
              <fieldset style={{ border: 'none', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>降噪</legend>
                
                <Form.Group as={Row} className={`mb-1 align-items-center ${styles.rowTight}`}>
                  <Form.Label column sm={1} className={styles.label}>
                    降噪：
                  </Form.Label>
                  <Col sm={4}>
                    <div className={styles.fieldWrap}>
                      <Form.Select
                        size="sm"
                        value={transcodeConfig.filters?.denoiseMode || 'none'}
                        onChange={(e) =>
                          setTranscodeConfig({
                            ...transcodeConfig,
                            filters: { ...transcodeConfig.filters, denoiseMode: e.target.value as any, denoise: e.target.value !== 'none' }
                          })
                        }
                        className={styles.select}
                      >
                        <option value="none">关</option>
                        <option value="nlmeans">NLMeans (高质量)</option>
                        <option value="hqdn3d">HQDN3D (快速)</option>
                      </Form.Select>
                      <span className={styles.help}>去除噪点，提升压缩效率</span>
                    </div>
                  </Col>
                </Form.Group>
                
                {/* 降噪强度（条件显示） */}
                {transcodeConfig.filters?.denoiseMode && transcodeConfig.filters.denoiseMode !== 'none' && (
                  <Form.Group as={Row} className={`mb-1 align-items-center ${styles.rowTight}`}>
                    <Form.Label column sm={1} className={styles.label}>
                      强度：
                    </Form.Label>
                    <Col sm={4}>
                      <Form.Select
                        size="sm"
                        value={transcodeConfig.filters?.denoiseStrength || 'medium'}
                        onChange={(e) =>
                          setTranscodeConfig({
                            ...transcodeConfig,
                            filters: { ...transcodeConfig.filters, denoiseStrength: e.target.value as any }
                          })
                        }
                        className={styles.select}
                      >
                        <option value="light">轻度</option>
                        <option value="medium">中度</option>
                        <option value="strong">强力</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                )}
              </fieldset>

              {/* 锐化 */}
              <fieldset style={{ border: 'none', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>锐化</legend>
                
                <Form.Group as={Row} className={`mb-1 align-items-center ${styles.rowTight}`}>
                  <Form.Label column sm={1} className={styles.label}>
                    锐化：
                  </Form.Label>
                  <Col sm={4}>
                    <div className={styles.fieldWrap}>
                      <Form.Select
                        size="sm"
                        value={transcodeConfig.filters?.sharpenMode || 'none'}
                        onChange={(e) =>
                          setTranscodeConfig({
                            ...transcodeConfig,
                            filters: { ...transcodeConfig.filters, sharpenMode: e.target.value as any, sharpen: e.target.value !== 'none' }
                          })
                        }
                        className={styles.select}
                      >
                        <option value="none">关</option>
                        <option value="unsharp">Unsharp</option>
                        <option value="lapsharp">Lapsharp</option>
                      </Form.Select>
                      <span className={styles.help}>增强边缘细节</span>
                    </div>
                  </Col>
                </Form.Group>
                
                {/* 锐化强度（条件显示） */}
                {transcodeConfig.filters?.sharpenMode && transcodeConfig.filters.sharpenMode !== 'none' && (
                  <Form.Group as={Row} className={`mb-1 align-items-center ${styles.rowTight}`}>
                    <Form.Label column sm={1} className={styles.label}>
                      强度：
                    </Form.Label>
                    <Col sm={4}>
                      <Form.Range
                        min={0}
                        max={2}
                        step={0.1}
                        value={transcodeConfig.filters?.sharpenStrength || 1}
                        onChange={(e) =>
                          setTranscodeConfig({
                            ...transcodeConfig,
                            filters: { ...transcodeConfig.filters, sharpenStrength: parseFloat(e.target.value) }
                          })
                        }
                      />
                      <div className={styles.help} style={{ textAlign: 'center' }}>
                        {(transcodeConfig.filters?.sharpenStrength || 1).toFixed(1)}
                      </div>
                    </Col>
                  </Form.Group>
                )}
              </fieldset>

              {/* 去块效应 */}
              <fieldset style={{ border: 'none', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>去块效应</legend>
                
                <Form.Group as={Row} className={`mb-1 align-items-center ${styles.rowTight}`}>
                  <Form.Label column sm={1} className={styles.label}>
                    去块效应：
                  </Form.Label>
                  <Col sm={4}>
                    <div className={styles.fieldWrap}>
                      <Form.Select
                        size="sm"
                        value={(transcodeConfig.filters?.deblock ? 'on' : 'off') as any}
                        onChange={(e) =>
                          setTranscodeConfig({
                            ...transcodeConfig,
                            filters: { 
                              ...transcodeConfig.filters, 
                              deblock: e.target.value === 'on' 
                            }
                          })
                        }
                        className={styles.select}
                      >
                        <option value="off">关</option>
                        <option value="on">开</option>
                      </Form.Select>
                      <span className={styles.help}>减少方块伪影</span>
                    </div>
                  </Col>
                  {transcodeConfig.filters?.deblock && (
                    <>
                      <Form.Label column sm={1} className={styles.labelRight}>
                        强度：
                      </Form.Label>
                      <Col sm={4}>
                        <Form.Range
                          min={0}
                          max={10}
                          value={transcodeConfig.filters?.deblockStrength || 4}
                          onChange={(e) =>
                            setTranscodeConfig({
                              ...transcodeConfig,
                              filters: { ...transcodeConfig.filters, deblockStrength: parseInt(e.target.value) }
                            })
                          }
                        />
                        <div className={styles.help} style={{ textAlign: 'center' }}>
                          {transcodeConfig.filters?.deblockStrength || 4}
                        </div>
                      </Col>
                    </>
                  )}
                </Form.Group>
              </fieldset>

              {/* 色彩空间 */}
              <fieldset style={{ border: 'none' }}>
                <legend style={{ display: 'none' }}>色彩空间</legend>
                
                <Form.Group as={Row} className={`mb-0 align-items-center ${styles.rowTight}`}>
                  <Form.Label column sm={1} className={styles.label}>
                    色彩空间：
                  </Form.Label>
                  <Col sm={4}>
                    <div className={styles.fieldWrap}>
                      <Form.Select
                        size="sm"
                        value={transcodeConfig.filters?.colorspace || 'auto'}
                        onChange={(e) =>
                          setTranscodeConfig({
                            ...transcodeConfig,
                            filters: { ...transcodeConfig.filters, colorspace: e.target.value as any }
                          })
                        }
                        className={styles.select}
                      >
                        <option value="auto">自动</option>
                        <option value="bt709">BT.709 (HD)</option>
                        <option value="bt2020">BT.2020 (HDR)</option>
                        <option value="bt601">BT.601 (SD)</option>
                      </Form.Select>
                      <span className={styles.help}>选择合适的色彩标准</span>
                    </div>
                  </Col>
                </Form.Group>
              </fieldset>
            </div>
          )}

          {/* Tab 5: 音频 */}
          {activeTab === 'audio' && (
            <div>
              <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>音频轨道</legend>
                
                {videoInfo && videoInfo.audioTracks && videoInfo.audioTracks.length > 0 ? (
                  <div style={{ fontSize: '10px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '40px 1fr 100px 80px 80px 60px',
                      gap: '8px',
                      padding: '6px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '3px',
                      marginBottom: '4px',
                      fontWeight: 'bold'
                    }}>
                      <div>轨道</div>
                      <div>编解码器</div>
                      <div>混音</div>
                      <div>采样率</div>
                      <div>比特率</div>
                      <div>增益</div>
                    </div>
                    {videoInfo.audioTracks.map((track, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '40px 1fr 100px 80px 80px 60px',
                          gap: '8px',
                          padding: '6px',
                          borderBottom: idx < videoInfo.audioTracks!.length - 1 ? '1px solid #eee' : 'none',
                          alignItems: 'center'
                        }}
                      >
                        <div>{track.index + 1}</div>
                        <div>{track.codec?.toUpperCase() || 'Unknown'}</div>
                        <Form.Select 
                          size="sm" 
                          style={{ fontSize: '10px', height: '22px' }}
                          defaultValue="stereo"
                        >
                          <option value="mono">Mono</option>
                          <option value="stereo">Stereo</option>
                          <option value="dpl2">Dolby Pro Logic II</option>
                          <option value="5.1">5.1</option>
                        </Form.Select>
                        <div>{track.sampleRate ? `${(track.sampleRate / 1000).toFixed(0)} kHz` : 'N/A'}</div>
                        <Form.Select 
                          size="sm" 
                          style={{ fontSize: '10px', height: '22px' }}
                          defaultValue="160"
                        >
                          <option value="64">64 kbps</option>
                          <option value="96">96 kbps</option>
                          <option value="128">128 kbps</option>
                          <option value="160">160 kbps</option>
                          <option value="192">192 kbps</option>
                          <option value="256">256 kbps</option>
                        </Form.Select>
                        <div style={{ textAlign: 'center' }}>0 dB</div>
                      </div>
                    ))}
                  </div>
                ) : videoInfo ? (
                  <div style={{ fontSize: '10px', color: '#999', padding: '10px' }}>无音频轨道</div>
                ) : (
                  <div style={{ fontSize: '10px', color: '#999', padding: '10px' }}>请先选择视频文件</div>
                )}
              </fieldset>

              <fieldset style={{ border: 'none', backgroundColor: '#fff' }}>
                <legend style={{ display: 'none' }}>音频设置</legend>
                
                <Form.Group as={Row} className="mb-1 align-items-center">
                  <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                    编码器:
                  </Form.Label>
                  <Col sm={4}>
                    <Form.Select
                      size="sm"
                      value={transcodeConfig.audioCodec || 'aac'}
                      onChange={(e) =>
                        setTranscodeConfig({ ...transcodeConfig, audioCodec: e.target.value as any })
                      }
                      style={{ fontSize: '10px', height: '20px' }}
                    >
                      <option value="copy">流式复制 (无损)</option>
                      <option value="aac">AAC (推荐)</option>
                      <option value="mp3">MP3</option>
                      <option value="opus">Opus</option>
                      <option value="flac">FLAC (无损)</option>
                    </Form.Select>
                  </Col>
                </Form.Group>

                <div style={{ fontSize: '10px', color: '#666', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginTop: '8px' }}>
                  <strong>提示：</strong> AAC 编码器提供最佳的兼容性和质量平衡。
                </div>
              </fieldset>
            </div>
          )}

          {/* Tab 6: 字幕 */}
          {activeTab === 'subtitle' && (
            <div>
              <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
                <legend style={{ display: 'none' }}>字幕轨道</legend>
                
                {videoInfo && videoInfo.subtitleTracks && videoInfo.subtitleTracks.length > 0 ? (
                  <div style={{ fontSize: '10px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '40px 1fr 80px 100px 80px 80px 80px',
                      gap: '8px',
                      padding: '6px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '3px',
                      marginBottom: '4px',
                      fontWeight: 'bold'
                    }}>
                      <div>轨道</div>
                      <div>标题</div>
                      <div>语言</div>
                      <div>编解码器</div>
                      <div>仅强制</div>
                      <div>默认</div>
                      <div>烧录</div>
                    </div>
                    {videoInfo.subtitleTracks.map((track, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '40px 1fr 80px 100px 80px 80px 80px',
                          gap: '8px',
                          padding: '6px',
                          borderBottom: idx < videoInfo.subtitleTracks!.length - 1 ? '1px solid #eee' : 'none',
                          alignItems: 'center'
                        }}
                      >
                        <div>{track.index + 1}</div>
                        <div>{track.title || `字幕 ${track.index + 1}`}</div>
                        <div>{track.language || 'und'}</div>
                        <div>{track.codec?.toUpperCase() || 'Unknown'}</div>
                        <div style={{ textAlign: 'center' }}>
                          <Form.Check type="checkbox" disabled style={{ margin: 0 }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <Form.Check type="checkbox" disabled style={{ margin: 0 }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <Form.Check type="checkbox" disabled style={{ margin: 0 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : videoInfo ? (
                  <div style={{ fontSize: '10px', color: '#999', padding: '10px' }}>无字幕轨道</div>
                ) : (
                  <div style={{ fontSize: '10px', color: '#999', padding: '10px' }}>请先选择视频文件</div>
                )}
              </fieldset>

              <div style={{ fontSize: '10px', color: '#666', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong>提示：</strong> 烧录字幕会将字幕永久嵌入视频，无法关闭。不烧录则作为单独的字幕轨道保存。
              </div>
            </div>
          )}

          {/* Tab 7: AI 优化 */}
          {activeTab === 'ai' && (
            <div>
              <Form.Group as={Row} className="mb-1 align-items-center">
                <Col sm={2}></Col>
                <Col sm={10}>
                  <Form.Check
                    type="checkbox"
                    label="启用 AI 智能优化"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    style={{ fontSize: '10px' }}
                  />
                </Col>
              </Form.Group>

              {aiEnabled && (
                <>
                  <Form.Group as={Row} className="mb-1 align-items-center">
                    <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                      AI 平台:
                    </Form.Label>
                    <Col sm={4}>
                      <Form.Select
                        size="sm"
                        value={aiPlatform || 'deepseek'}
                        onChange={(e) => setAiPlatform(e.target.value as any)}
                        style={{ fontSize: '10px', height: '20px' }}
                      >
                        <option value="deepseek">DeepSeek</option>
                        <option value="openai">OpenAI</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-1 align-items-center">
                    <Form.Label column sm={2} style={{ fontSize: '10px' }}>
                      API Key:
                    </Form.Label>
                    <Col sm={6}>
                      <Form.Control
                        size="sm"
                        type="password"
                        value={aiApiKey || ''}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="输入 API Key"
                        style={{ fontSize: '10px', height: '22px' }}
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-0 align-items-center">
                    <Col sm={2}></Col>
                    <Col sm={10}>
                      <Button 
                        onClick={handleAIOptimize} 
                        disabled={!videoInfo || isProcessing}
                        variant="primary"
                        size="sm"
                        style={{ fontSize: '10px', height: '22px', padding: '2px 16px' }}
                      >
                        🤖 AI 自动配置参数
                      </Button>
                      <span className="text-muted ms-2" style={{ fontSize: '10px' }}>
                        AI 会自动分析并应用最佳转码参数
                      </span>
                    </Col>
                  </Form.Group>
                </>
              )}

              {/* 日志显示 */}
              {logs.length > 0 && (
                <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>日志:</div>
                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        color: log.type === 'error' ? '#dc3545' : log.type === 'success' ? '#28a745' : '#6c757d',
                        fontSize: '10px',
                        marginBottom: '2px',
                        lineHeight: '1.4'
                      }}
                    >
                      {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 浮动操作按钮已并入第一行 */}

      {/* ==================== 底部固定区域 ==================== */}
      <div className={styles.footerBar}>
        {/* 按钮移动到上方（右对齐） */}
        <div className={styles.actionsFloat}>
          <Button
            variant="success"
            size="sm"
            onClick={handleStartTranscode}
            disabled={!videoFile || !outputPath || isProcessing}
          >
            {isProcessing ? '转码中...' : '开始转码'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => ipcRenderer.invoke('cancel-transcode')}
            disabled={!isProcessing}
          >
            取消
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleClearAll}
            disabled={isProcessing || (!videoFile && !outputPath)}
          >
            清空
          </Button>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.bottomLeft}>
            {/* 源 */}
            <Form.Group as={Row} className="mb-1 align-items-center">
              <Form.Label column sm={1} style={{ fontSize: '10px', fontWeight: 'normal' }}>
                源:
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  size="sm"
                  value={videoFile || ''}
                  placeholder="未选择视频文件"
                  readOnly
                  style={{ fontSize: '10px', height: '24px', backgroundColor: '#fff' }}
                  title={videoFile || ''}
                />
              </Col>
              <Col sm={2}>
                <Button 
                  onClick={handleSelectVideo}
                  variant="outline-secondary"
                  size="sm"
                  style={{ fontSize: '10px', height: '24px', padding: '2px 12px', width: '100%' }}
                >
                  浏览...
                </Button>
              </Col>
            </Form.Group>

            {/* 另存为 */}
            <Form.Group as={Row} className="mb-1 align-items-center">
              <Form.Label column sm={1} style={{ fontSize: '10px', fontWeight: 'normal' }}>
                另存为:
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  size="sm"
                  value={outputPath || ''}
                  placeholder="未选择输出路径"
                  readOnly
                  style={{ fontSize: '10px', height: '24px', backgroundColor: '#fff' }}
                  title={outputPath || ''}
                />
              </Col>
              <Col sm={2}>
                <Button 
                  onClick={handleSelectOutput}
                  variant="outline-secondary"
                  size="sm"
                  style={{ fontSize: '10px', height: '24px', padding: '2px 12px', width: '100%' }}
                >
                  浏览...
                </Button>
              </Col>
            </Form.Group>

            {/* 进度条 */}
            {isProcessing && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', marginBottom: '4px' }}>
                  转码进度: {progress}%
                </div>
                <ProgressBar now={progress} animated striped variant="success" style={{ height: '16px' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TranscodeTab;
