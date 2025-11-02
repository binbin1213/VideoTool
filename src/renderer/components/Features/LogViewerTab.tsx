import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaDownload, FaSearch, FaInfoCircle, FaSyncAlt } from 'react-icons/fa';
import { LogEntry } from '../../App';
import styles from './LogViewerTab.module.scss';

interface LogViewerTabProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

function LogViewerTab({ logs, onClearLogs }: LogViewerTabProps) {
  const { t } = useTranslation();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]); // 从文件读取的日志
  const [loading, setLoading] = useState<boolean>(false);
  const logListRef = useRef<HTMLDivElement>(null); // 日志列表容器引用

  // 滚动到日志底部（最新日志）
  const scrollToBottom = () => {
    if (logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight;
    }
  };

  // 读取完整日志文件
  const loadSystemLogs = async () => {
    setLoading(true);
    try {
      const logs = await (window as any).electron.ipcRenderer.invoke('read-log-file', 1000);
      setSystemLogs(logs);
      // 延迟滚动到底部，确保 DOM 已更新
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('读取日志文件失败:', error);
      alert('读取日志文件失败！');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时自动读取日志
  useEffect(() => {
    loadSystemLogs();
  }, []);

  const getLevelClass = (level: string) => {
    switch (level) {
      case 'info':
        return styles.levelInfo;
      case 'success':
        return styles.levelSuccess;
      case 'warning':
        return styles.levelWarning;
      case 'error':
        return styles.levelError;
      default:
        return '';
    }
  };

  // 使用系统日志代替传入的 logs
  const allLogs = systemLogs.length > 0 ? systemLogs : logs;
  
  const filteredLogs = allLogs.filter(log => {
    const matchLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchSearch = !searchText || log.message.toLowerCase().includes(searchText.toLowerCase());
    return matchLevel && matchSearch;
  });

  // 当日志更新或过滤条件变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [systemLogs, filterLevel, searchText]);

  const handleClearLogs = async () => {
    if (confirm(t('logs.confirmClear'))) {
      try {
        const result = await (window as any).electron.ipcRenderer.invoke('clear-log-file');
        if (result.success) {
          // 清空前端显示
          setSystemLogs([]);
          onClearLogs();
          alert(t('logs.clearSuccess'));
        } else {
          alert(t('logs.clearFailed') + ': ' + result.message);
        }
      } catch (error) {
        console.error('清空日志失败:', error);
        alert(t('logs.clearFailed'));
      }
    }
  };

  const handleExportLogs = () => {
    const content = allLogs.map(log => 
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <FaInfoCircle />
          {t('logs.title')}
        </h2>
      </div>

      <div className={styles.content}>
        {/* 工具栏 */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <select 
              className={styles.select}
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="all">{t('logs.filterAll')}</option>
              <option value="info">{t('logs.filterInfo')}</option>
              <option value="success">{t('logs.filterSuccess')}</option>
              <option value="warning">{t('logs.filterWarning')}</option>
              <option value="error">{t('logs.filterError')}</option>
            </select>

            <div className={styles.searchGroup}>
              <span className={styles.searchIcon}>
                <FaSearch size={12} />
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={t('logs.searchPlaceholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <span className={styles.badge}>
              {filteredLogs.length} / {allLogs.length}
            </span>
          </div>

          <div className={styles.toolbarRight}>
            <button 
              className={styles.buttonSuccess}
              onClick={loadSystemLogs}
              disabled={loading}
            >
              <FaSyncAlt />
              {loading ? t('logs.refreshing') : t('logs.refresh')}
            </button>
            <button 
              className={styles.buttonPrimary}
              onClick={handleExportLogs}
            >
              <FaDownload />
              {t('logs.export')}
            </button>
            <button 
              className={styles.buttonDanger}
              onClick={handleClearLogs}
            >
              <FaTrash />
              {t('logs.clear')}
            </button>
          </div>
        </div>

        {/* 日志列表 */}
        <div className={styles.logList} ref={logListRef}>
          {filteredLogs.length === 0 ? (
            <div className={styles.logEmpty}>
              <p>{t('logs.empty')}</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className={styles.logItem}>
                <span className={`${styles.logLevel} ${getLevelClass(log.level)}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className={styles.logTimestamp}>{log.timestamp}</span>
                <span className={styles.logMessage}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default LogViewerTab;
