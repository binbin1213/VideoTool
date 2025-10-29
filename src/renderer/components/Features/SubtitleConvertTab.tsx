import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { FaFileUpload, FaPlay, FaCog } from 'react-icons/fa';
import {
  applyRegexRules,
  parseSRT,
  generateASS,
  getDefaultRegexRules,
  getAvailableStyles,
} from '../../utils/subtitleConverter';

interface SubtitleConvertTabProps {
  addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
}

function SubtitleConvertTab({ addLog }: SubtitleConvertTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('译文字幕 底部');
  const [regexRules, setRegexRules] = useState<any[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [applyRegex, setApplyRegex] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化加载预设
  useEffect(() => {
    const rules = getDefaultRegexRules();
    const availableStyles = getAvailableStyles();
    setRegexRules(rules);
    setStyles(availableStyles);
    addLog('字幕转换模块初始化成功', 'info');
  }, []);

  const addLocalLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedLog = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    setLogs(prev => [...prev, formattedLog]);
    // 同时添加到全局日志
    addLog(message, type);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setLogs([]);
      addLocalLog(`选择文件: ${file.name}`, 'info');
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.srt')) {
      setSelectedFile(file);
      setResult(null);
      setLogs([]);
      addLocalLog(`拖入文件: ${file.name}`, 'info');
    } else {
      addLocalLog('请选择SRT格式的字幕文件', 'error');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      addLocalLog('请先选择文件', 'error');
      return;
    }

    setConverting(true);
    setProgress(0);
    setResult(null);

    try {
      addLocalLog(`开始转换: ${selectedFile.name}`, 'info');
      setProgress(20);

      // 读取文件内容
      const content = await selectedFile.text();
      addLocalLog('文件读取完成', 'success');
      setProgress(40);

      // 解析字幕
      const subtitles = parseSRT(content);
      
      if (subtitles.length === 0) {
        addLocalLog('未能解析到有效的字幕内容', 'error');
        setResult({ success: false, message: '未能解析到有效的字幕内容' });
        setConverting(false);
        return;
      }

      addLocalLog(`成功解析 ${subtitles.length} 条字幕`, 'success');
      setProgress(60);

      // 应用正则替换
      const processedSubtitles = applyRegex ? subtitles.map(sub => ({
        ...sub,
        text: applyRegexRules(sub.text, regexRules)
      })) : subtitles;
      
      if (applyRegex) {
        const enabledRules = regexRules.filter(r => r.enabled).length;
        addLocalLog(`应用了 ${enabledRules} 条正则替换规则`, 'info');
      }
      setProgress(80);

      // 生成ASS
      const assContent = generateASS(processedSubtitles, selectedStyle);
      addLocalLog(`使用样式: ${selectedStyle}`, 'info');
      setProgress(90);

      // 创建下载
      const blob = new Blob([assContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const outputFileName = selectedFile.name.replace('.srt', '.ass');
      link.download = outputFileName;
      link.click();
      URL.revokeObjectURL(url);

      addLocalLog(`✓ 转换成功！已下载: ${outputFileName}`, 'success');
      setProgress(100);
      setResult({ 
        success: true, 
        message: `成功转换 ${subtitles.length} 条字幕`,
        outputPath: outputFileName
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLocalLog(`转换失败: ${errorMessage}`, 'error');
      setResult({ success: false, message: errorMessage });
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="subtitle-convert-container">
      <div className="subtitle-convert-header">
        <h2>
          <FaPlay className="me-2" />
          字幕格式转换 (SRT → ASS)
        </h2>
      </div>

      <div className="subtitle-convert-content">
        <div className="main-area">
          {/* 文件选择区域 */}
          <Card className="mb-3">
            <Card.Header>
              <FaFileUpload className="me-2" />
              选择SRT文件
            </Card.Header>
            <Card.Body>
              <div
                className="file-selector-zone text-center"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <FaFileUpload size={48} className="mb-3" style={{ color: '#667eea' }} />
                <p className="mb-2" style={{ fontSize: '15px', fontWeight: '500', color: '#495057' }}>
                  {selectedFile ? (
                    <strong>{selectedFile.name}</strong>
                  ) : (
                    '点击选择或拖拽SRT文件到此处'
                  )}
                </p>
                <p className="text-muted small">支持的格式：.srt</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".srt"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </Card.Body>
          </Card>

          {/* 转换设置 */}
          <Card className="mb-3">
            <Card.Header>
              <FaCog className="me-2" />
              转换设置
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>ASS样式模板</Form.Label>
                <Form.Select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                >
                  {styles.map(style => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                  选择字幕样式模板，共 {styles.length} 种预设样式
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label={`应用正则替换规则 (${regexRules.filter(r => r.enabled).length} 条已启用)`}
                  checked={applyRegex}
                  onChange={(e) => setApplyRegex(e.target.checked)}
                />
                <Form.Text style={{ fontSize: '13px', color: '#495057' }}>
                  自动清理标签、格式化标点符号等
                </Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleConvert}
                  disabled={!selectedFile || converting}
                >
                  {converting ? '转换中...' : '开始转换'}
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* 转换进度 */}
          {converting && (
            <Card className="mb-3">
              <Card.Body>
                <h6>转换进度</h6>
                <ProgressBar
                  now={progress}
                  label={`${progress}%`}
                  animated={progress < 100}
                  variant={progress === 100 ? 'success' : 'primary'}
                />
              </Card.Body>
            </Card>
          )}

          {/* 转换结果 */}
          {result && (
            <Alert variant={result.success ? 'success' : 'danger'}>
              <Alert.Heading>
                {result.success ? '✅ 转换成功！' : '❌ 转换失败'}
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
            <Card.Header>📖 功能说明</Card.Header>
            <Card.Body>
              <h6>转换流程：</h6>
              <ol className="small">
                <li>选择SRT字幕文件</li>
                <li>应用正则替换规则清理文本</li>
                <li>选择ASS样式模板</li>
                <li>点击"开始转换"</li>
                <li>自动下载ASS文件</li>
              </ol>

              <hr />

              <h6>正则替换规则：</h6>
              <ul className="small">
                <li>移除HTML标签</li>
                <li>清理标点符号</li>
                <li>格式化空格</li>
                <li>统一换行符</li>
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

export default SubtitleConvertTab;

