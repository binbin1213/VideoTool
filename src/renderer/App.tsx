import { useState, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './components/Layout/Sidebar';
import SubtitleConvertTab from './components/Features/SubtitleConvertTab';
import MergeTab from './components/Features/MergeTab';
import SubtitleBurnTab from './components/Features/SubtitleBurnTab';
import LogViewerTab from './components/Features/LogViewerTab';
import './styles/App.scss';

type TabType = 'subtitle-convert' | 'merge' | 'transcode' | 'subtitle-burn' | 'batch' | 'logs';

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
      <Container fluid className="main-content">
        <Row className="h-100">
          <Col xs="auto" className="sidebar-col p-0">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </Col>
          <Col className="content-col p-0">
            {renderContent()}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;

