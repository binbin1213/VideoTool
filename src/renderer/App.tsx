import { useState, useCallback, useEffect } from 'react';
import { Container, Row, Col, Alert, Button, Spinner } from 'react-bootstrap';
import Sidebar from './components/Layout/Sidebar';
import SubtitleConvertTab from './components/Features/SubtitleConvertTab';
import MergeTab from './components/Features/MergeTab';
import SubtitleBurnTab from './components/Features/SubtitleBurnTab';
import LogViewerTab from './components/Features/LogViewerTab';
import AboutTab from './components/Features/AboutTab';
import './styles/App.scss';

const { ipcRenderer } = (window as any).electron;

type TabType = 'subtitle-convert' | 'merge' | 'transcode' | 'subtitle-burn' | 'batch' | 'logs' | 'about';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface TaskProgress {
  taskType: 'merge' | 'burn' | null;
  isRunning: boolean;
  progress: number;
  progressText: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('subtitle-convert');
  const [globalLogs, setGlobalLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleString(),
      level: 'info',
      message: '应用启动成功'
    }
  ]);
  
  // 全局任务进度状态
  const [taskProgress, setTaskProgress] = useState<TaskProgress>({
    taskType: null,
    isRunning: false,
    progress: 0,
    progressText: ''
  });

  // FFmpeg 状态
  const [ffmpegStatus, setFfmpegStatus] = useState<{
    installed: boolean;
    checking: boolean;
    installing: boolean;
    downloadProgress: number;
    downloadMessage: string;
  }>({
    installed: true, // 默认假设已安装，避免闪烁
    checking: true,
    installing: false,
    downloadProgress: 0,
    downloadMessage: ''
  });

  // 检查 FFmpeg 状态
  useEffect(() => {
    const checkFFmpeg = async () => {
      try {
        const status = await ipcRenderer.invoke('check-ffmpeg-status');
        setFfmpegStatus(prev => ({
          ...prev,
          installed: status.installed,
          checking: false
        }));
        
        if (!status.installed) {
          addLog('FFmpeg 未安装，某些功能可能无法使用', 'warning');
        } else {
          addLog(`FFmpeg 已就绪 (${status.version})`, 'success');
        }
      } catch (error) {
        console.error('检查 FFmpeg 状态失败:', error);
        setFfmpegStatus(prev => ({
          ...prev,
          checking: false,
          installed: false
        }));
      }
    };

    checkFFmpeg();

    // 监听 FFmpeg 下载进度
    const progressHandler = (_event: any, data: { progress: number; message: string }) => {
      setFfmpegStatus(prev => ({
        ...prev,
        downloadProgress: data.progress,
        downloadMessage: data.message
      }));
    };

    ipcRenderer.on('ffmpeg-download-progress', progressHandler);

    return () => {
      ipcRenderer.removeListener('ffmpeg-download-progress', progressHandler);
    };
  }, []);

  // 安装 FFmpeg
  const handleInstallFFmpeg = async () => {
    setFfmpegStatus(prev => ({ ...prev, installing: true, downloadProgress: 0 }));
    addLog('开始下载 FFmpeg...', 'info');

    try {
      const result = await ipcRenderer.invoke('download-ffmpeg');
      
      if (result.success) {
        setFfmpegStatus({
          installed: true,
          checking: false,
          installing: false,
          downloadProgress: 100,
          downloadMessage: '安装完成'
        });
        addLog('FFmpeg 安装成功！', 'success');
      } else {
        setFfmpegStatus(prev => ({ ...prev, installing: false }));
        addLog(`FFmpeg 安装失败: ${result.message}`, 'error');
      }
    } catch (error) {
      setFfmpegStatus(prev => ({ ...prev, installing: false }));
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLog(`FFmpeg 安装失败: ${errorMessage}`, 'error');
    }
  };

  const addLog = useCallback((message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleString(),
      level,
      message
    };
    setGlobalLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setGlobalLogs([
      {
        timestamp: new Date().toLocaleString(),
        level: 'info',
        message: '日志已清空'
      }
    ]);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'subtitle-convert':
        return <SubtitleConvertTab addLog={addLog} />;
      case 'merge':
        return <MergeTab addLog={addLog} taskProgress={taskProgress} setTaskProgress={setTaskProgress} />;
      case 'subtitle-burn':
        return <SubtitleBurnTab addLog={addLog} taskProgress={taskProgress} setTaskProgress={setTaskProgress} />;
      case 'logs':
        return <LogViewerTab logs={globalLogs} onClearLogs={clearLogs} />;
      case 'about':
        return <AboutTab />;
      case 'transcode':
        return <div className="p-4"><h3>视频转码功能开发中...</h3></div>;
      case 'batch':
        return <div className="p-4"><h3>批量处理功能开发中...</h3></div>;
      default:
        return <div className="p-4"><h3>欢迎使用 VideoTool</h3></div>;
    }
  };

  return (
    <div className="app">
      <Container fluid className="main-content" style={{ padding: 0 }}>
        <Row className="h-100" style={{ margin: 0 }}>
          <Col className="sidebar-col p-0" style={{ flex: '0 0 180px', maxWidth: '180px' }}>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </Col>
          <Col className="content-col p-0">
            {/* FFmpeg 状态提示横幅 */}
            {!ffmpegStatus.checking && !ffmpegStatus.installed && (
              <Alert variant="warning" className="m-3 mb-0" dismissible={false}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <strong>⚠️ FFmpeg 未安装</strong>
                    <p className="mb-0 mt-1 small">
                      VideoTool 需要 FFmpeg 才能处理视频文件。某些功能（音视频合并、字幕烧录等）将无法使用。
                    </p>
                  </div>
                  <div className="ms-3">
                    {ffmpegStatus.installing ? (
                      <div className="text-center" style={{ minWidth: '150px' }}>
                        <Spinner animation="border" size="sm" className="me-2" />
                        <div className="small mt-1">
                          {ffmpegStatus.downloadMessage}
                          <br />
                          {ffmpegStatus.downloadProgress > 0 && `${ffmpegStatus.downloadProgress}%`}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleInstallFFmpeg}
                      >
                        立即安装
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            )}
            
            {renderContent()}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;

