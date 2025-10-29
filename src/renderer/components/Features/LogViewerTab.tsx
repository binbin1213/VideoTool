import { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Badge, Alert } from 'react-bootstrap';
import { FaTrash, FaDownload, FaSearch, FaFolder, FaInfoCircle } from 'react-icons/fa';
import { LogEntry } from '../../App';

interface LogViewerTabProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

function LogViewerTab({ logs, onClearLogs }: LogViewerTabProps) {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [systemLogPath, setSystemLogPath] = useState<string>('');

  // 获取系统日志文件路径
  useEffect(() => {
    const fetchLogPath = async () => {
      try {
        const path = await window.electron.ipcRenderer.invoke('get-log-path');
        setSystemLogPath(path);
      } catch (error) {
        console.error('获取日志路径失败:', error);
      }
    };
    fetchLogPath();
  }, []);

  const getLevelClass = (level: string) => {
    return `level-${level}`;
  };

  const filteredLogs = logs.filter(log => {
    const matchLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchSearch = !searchText || log.message.toLowerCase().includes(searchText.toLowerCase());
    return matchLevel && matchSearch;
  });

  const handleClearLogs = () => {
    if (confirm('确定要清空所有日志吗？')) {
      onClearLogs();
    }
  };

  const handleExportLogs = () => {
    const content = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `videotool-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenLogFolder = async () => {
    try {
      await window.electron.ipcRenderer.invoke('open-log-folder');
    } catch (error) {
      console.error('打开日志文件夹失败:', error);
      alert('打开日志文件夹失败，请手动打开:\n' + systemLogPath);
    }
  };

  return (
    <div className="log-viewer-container">
      <div className="log-viewer-header">
        <h2>📋 日志查看器</h2>
      </div>

      <div className="log-viewer-content">
        <Card>
          <Card.Body>
            {/* 系统日志路径提示 */}
            {systemLogPath && (
              <Alert variant="info" className="mb-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <FaInfoCircle className="me-2" />
                  <small>
                    <strong>完整日志文件：</strong>
                    <code className="ms-2" style={{ fontSize: '0.85em' }}>{systemLogPath}</code>
                  </small>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={handleOpenLogFolder}
                >
                  <FaFolder className="me-1" />
                  打开文件夹
                </Button>
              </Alert>
            )}
            
            {/* 工具栏 */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex gap-2 align-items-center">
                <Form.Select 
                  size="sm" 
                  style={{ width: 'auto' }}
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="all">全部日志</option>
                  <option value="info">信息</option>
                  <option value="success">成功</option>
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                </Form.Select>

                <div className="input-group" style={{ width: '250px' }}>
                  <span className="input-group-text">
                    <FaSearch size={12} />
                  </span>
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="搜索日志..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>

                <Badge bg="secondary" className="ms-2">
                  {filteredLogs.length} / {logs.length}
                </Badge>
              </div>

              <div className="d-flex gap-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={handleExportLogs}
                >
                  <FaDownload className="me-1" />
                  导出日志
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={handleClearLogs}
                >
                  <FaTrash className="me-1" />
                  清空日志
                </Button>
              </div>
            </div>

            {/* 日志列表 */}
            <div className="log-list">
              {filteredLogs.length === 0 ? (
                <div className="text-center" style={{ color: '#858585', paddingTop: '40px' }}>
                  <p>暂无日志记录</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div key={index} className="log-item">
                    <span className={`log-level-text ${getLevelClass(log.level)}`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="log-timestamp">{log.timestamp}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default LogViewerTab;

