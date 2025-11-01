import { useState, useRef, useEffect } from 'react';
import { Button, Form, Alert, ProgressBar, Row, Col, Modal, Badge } from 'react-bootstrap';
import formStyles from '../../styles/components/FormControls.module.scss';
import { FaFileUpload, FaPlay, FaCog, FaEdit, FaSave, FaTrash } from 'react-icons/fa';
import {
  applyRegexRules,
  parseSRT,
  generateASS,
  getDefaultRegexRules,
  getStyleParams,
  saveCustomStyle,
  deleteCustomStyle,
  getPresetStyleNames,
  getCustomStyles,
  type ASSStyleParams,
} from '../../utils/subtitleConverter';

const { ipcRenderer } = (window as any).electron;

interface SubtitleConvertTabProps {
  addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
}

function SubtitleConvertTab({ addLog }: SubtitleConvertTabProps) {
  const [batchMode, setBatchMode] = useState(false); // 批量模式开关
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // 批量文件列表
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0); // 当前处理的文件索引
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('译文字幕 底部');
  const [regexRules, setRegexRules] = useState<any[]>([]);
  const [applyRegex, setApplyRegex] = useState(true);
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  
  // 样式编辑器
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [editingStyle, setEditingStyle] = useState<ASSStyleParams | null>(null);
  const [customStyleName, setCustomStyleName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化加载预设
  useEffect(() => {
    const rules = getDefaultRegexRules();
    setRegexRules(rules);
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
    if (batchMode) {
      // 批量模式：选择多个文件
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        setSelectedFiles(files);
        setResult(null);
        setLogs([]);
        addLocalLog(`选择 ${files.length} 个文件`, 'info');
        files.forEach((file, index) => {
          addLocalLog(`${index + 1}. ${file.name}`, 'info');
        });
      }
    } else {
      // 单文件模式
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        setResult(null);
        setLogs([]);
        addLocalLog(`选择文件: ${file.name}`, 'info');
      }
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

  const handleClearAll = () => {
    setSelectedFile(null);
    setSelectedFiles([]);
    setResult(null);
    setProgress(0);
    setCurrentFileIndex(0);
    addLocalLog('已清空所有文件选择', 'info');
  };

  // ASS颜色转CSS颜色
  const assColorToCss = (assColor: string): string => {
    const colorMap: Record<string, string> = {
      '&H00FFFFFF': '#FFFFFF',
      '&H00000000': '#000000',
      '&H00404040': '#404040',
      '&H00808080': '#808080',
      '&H000000FF': '#FF0000',
      '&H0000FF00': '#00FF00',
      '&H00FF0000': '#0000FF',
      '&H0000FFFF': '#FFFF00'
    };
    return colorMap[assColor] || '#FFFFFF';
  };

  // 生成描边效果的textShadow
  const getOutlineTextShadow = (width: number, color: string): string => {
    if (width <= 0) return 'none';
    const w = width * 2;
    return `${color} ${w}px 0px 0px, ${color} -${w}px 0px 0px, ${color} 0px ${w}px 0px, ${color} 0px -${w}px 0px, ${color} ${w}px ${w}px 0px, ${color} -${w}px -${w}px 0px, ${color} ${w}px -${w}px 0px, ${color} -${w}px ${w}px 0px`;
  };

  // 打开样式编辑器
  const handleEditStyle = () => {
    const style = getStyleParams(selectedStyle);
    if (style) {
      setEditingStyle({...style});
      setCustomStyleName('');
      setShowStyleEditor(true);
    }
  };

  // 保存自定义样式
  const handleSaveCustomStyle = () => {
    if (!editingStyle) return;
    
    const name = customStyleName.trim() || `自定义-${Date.now()}`;
    const styleToSave: ASSStyleParams = {
      ...editingStyle,
      name
    };
    
    saveCustomStyle(styleToSave);
    addLocalLog(`保存自定义样式: ${name}`, 'success');
    
    // 切换到新保存的样式
    setSelectedStyle(name);
    setShowStyleEditor(false);
  };

  // 删除自定义样式
  const handleDeleteCustomStyle = (styleName: string) => {
    if (window.confirm(`确定要删除样式"${styleName}"吗？`)) {
      deleteCustomStyle(styleName);
      addLocalLog(`删除自定义样式: ${styleName}`, 'info');
      
      // 如果删除的是当前选中的样式，切换到默认样式
      if (selectedStyle === styleName) {
        setSelectedStyle('译文字幕 底部');
      }
    }
  };

  // 单文件转换（返回ASS内容，不直接下载）
  const convertSingleFile = async (file: File, saveDirectory?: string): Promise<{ success: boolean; message: string; outputPath?: string; assContent?: string; fileName?: string }> => {
    try {
      addLocalLog(`开始转换: ${file.name}`, 'info');

      // 读取文件内容
      const content = await file.text();
      addLocalLog(`文件读取完成`, 'info');

      // 解析字幕
      const subtitles = parseSRT(content);
      
      if (subtitles.length === 0) {
        addLocalLog(`未能解析到有效的字幕内容`, 'error');
        return { success: false, message: '未能解析到有效的字幕内容' };
      }

      addLocalLog(`成功解析 ${subtitles.length} 条字幕`, 'success');

      // 应用正则替换
      const processedSubtitles = applyRegex ? subtitles.map(sub => ({
        ...sub,
        text: applyRegexRules(sub.text, regexRules)
      })) : subtitles;
      
      if (applyRegex) {
        const enabledRules = regexRules.filter(r => r.enabled).length;
        addLocalLog(`应用了 ${enabledRules} 条正则替换规则`, 'info');
      }

      // 生成ASS（包含水印）
      const watermark = enableWatermark && watermarkText ? {
        text: watermarkText,
        position: watermarkPosition
      } : undefined;
      
      const assContent = generateASS(processedSubtitles, selectedStyle, watermark);
      addLocalLog(`使用样式: ${selectedStyle}`, 'info');
      if (watermark) {
        addLocalLog(`已添加水印: ${watermarkText} (位置: ${watermarkPosition})`, 'info');
      }

      // 保留语言代码：xxx.zh-Hans.srt → xxx.zh-Hans.ass
      const outputFileName = file.name.replace(/\.srt$/i, '.ass');

      // 如果提供了保存目录，使用Electron API保存
      if (saveDirectory) {
        const saveResult = await ipcRenderer.invoke('save-ass-file', assContent, saveDirectory, outputFileName);
        if (saveResult.success) {
          addLocalLog(`✓ 已保存: ${outputFileName}`, 'success');
          return {
            success: true,
            message: `成功转换 ${subtitles.length} 条字幕`,
            outputPath: saveResult.filePath
          };
        } else {
          throw new Error(saveResult.message);
        }
      } else {
        // 单文件模式：浏览器下载
        const blob = new Blob([assContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outputFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        addLocalLog(`✓ 转换成功！已下载: ${outputFileName}`, 'success');
        return {
          success: true,
          message: `成功转换 ${subtitles.length} 条字幕`,
          outputPath: outputFileName
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLocalLog(`转换失败: ${errorMessage}`, 'error');
      return { success: false, message: errorMessage };
    }
  };

  const handleConvert = async () => {
    if (batchMode) {
      // 批量转换
      if (selectedFiles.length === 0) {
        addLocalLog('请先选择文件', 'error');
        return;
      }

      // 先让用户选择保存目录
      const saveDirectory = await ipcRenderer.invoke('select-save-directory');
      if (!saveDirectory) {
        addLocalLog('未选择保存目录，取消批量转换', 'warning');
        return;
      }

      addLocalLog(`保存目录: ${saveDirectory}`, 'info');

      setConverting(true);
      setProgress(0);
      setResult(null);

      try {
        addLocalLog(`开始批量转换 ${selectedFiles.length} 个文件`, 'info');
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
          setCurrentFileIndex(i);
          const file = selectedFiles[i];
          const fileProgress = ((i + 1) / selectedFiles.length) * 100;
          setProgress(Math.round(fileProgress));

          addLocalLog(`\n[${i + 1}/${selectedFiles.length}] 处理: ${file.name}`, 'info');
          const result = await convertSingleFile(file, saveDirectory);
          
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        setProgress(100);
        const summary = `批量转换完成！成功: ${successCount}, 失败: ${failCount}\n保存位置: ${saveDirectory}`;
        addLocalLog(summary, successCount === selectedFiles.length ? 'success' : 'warning');
        setResult({ 
          success: successCount > 0, 
          message: summary
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        addLocalLog(`批量转换失败: ${errorMessage}`, 'error');
        setResult({ success: false, message: errorMessage });
      } finally {
        setConverting(false);
        setCurrentFileIndex(0);
      }

    } else {
      // 单文件转换
      if (!selectedFile) {
        addLocalLog('请先选择文件', 'error');
        return;
      }

      setConverting(true);
      setProgress(0);
      setResult(null);

      try {
        setProgress(20);
        const result = await convertSingleFile(selectedFile);
        setProgress(100);
        setResult(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        addLocalLog(`转换失败: ${errorMessage}`, 'error');
        setResult({ success: false, message: errorMessage });
      } finally {
        setConverting(false);
      }
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
          {/* 批量模式开关 */}
          <fieldset style={{ border: 'none', backgroundColor: '#f8f9fa', marginBottom: '8px', padding: '8px 12px', borderRadius: '6px' }}>
            <Form.Check
              type="switch"
              id="batch-mode-switch"
              label={
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  {batchMode ? '📦 批量转换模式（可选择多个文件）' : '📄 单文件转换模式'}
                </span>
              }
              checked={batchMode}
              onChange={(e) => {
                setBatchMode(e.target.checked);
                setSelectedFile(null);
                setSelectedFiles([]);
                setResult(null);
                setLogs([]);
              }}
              disabled={converting}
            />
          </fieldset>

          {/* 文件选择区域 */}
          <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
            <legend style={{ display: 'none' }}>
              <FaFileUpload className="me-1" />
              选择SRT文件
            </legend>
            <div
              className="file-selector-zone text-center"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <FaFileUpload size={48} className="mb-3" style={{ color: '#667eea' }} />
              <p className="mb-2" style={{ fontSize: '15px', fontWeight: '500', color: '#495057' }}>
                {batchMode ? (
                  selectedFiles.length > 0 ? (
                    <strong>已选择 {selectedFiles.length} 个文件</strong>
                  ) : (
                    '点击选择多个SRT文件'
                  )
                ) : (
                  selectedFile ? (
                    <strong>{selectedFile.name}</strong>
                  ) : (
                    '点击选择或拖拽SRT文件到此处'
                  )
                )}
              </p>
              <p className="text-muted small">支持的格式：.srt</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt"
              multiple={batchMode}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </fieldset>

          {/* 批量模式：文件列表 */}
          {batchMode && selectedFiles.length > 0 && (
            <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '8px 12px', maxHeight: '200px', overflowY: 'auto' }}>
              <legend style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
                📋 文件列表 ({selectedFiles.length}个)
              </legend>
              {selectedFiles.map((file, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    marginBottom: '4px',
                    background: index === currentFileIndex && converting ? '#e7f3ff' : '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: index === currentFileIndex && converting ? '1px solid #0d6efd' : '1px solid transparent'
                  }}
                >
                  <span style={{ marginRight: '8px', color: '#6c757d' }}>{index + 1}.</span>
                  <span style={{ flex: 1, color: '#495057' }}>{file.name}</span>
                  {converting && index < currentFileIndex && (
                    <span style={{ color: '#28a745', fontSize: '10px' }}>✓</span>
                  )}
                  {converting && index === currentFileIndex && (
                    <span style={{ color: '#0d6efd', fontSize: '10px' }}>⏳</span>
                  )}
                </div>
              ))}
            </fieldset>
          )}

          {/* 转换设置 */}
          <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
            <legend style={{ display: 'none' }}>
              <FaCog className="me-1" />
              转换设置
            </legend>
              <Form.Group as={Row} className={`mb-2 align-items-center ${formStyles.rowTight}`}>
                <Form.Label column sm={2} className={formStyles.label}>ASS样式模板:</Form.Label>
                <Col sm={10}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Form.Select
                      className={formStyles.select}
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      style={{ width: '180px' }}
                    >
                      <optgroup label="预设样式">
                        {getPresetStyleNames().map(style => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </optgroup>
                      {getCustomStyles().length > 0 && (
                        <optgroup label="自定义样式">
                          {getCustomStyles().map(style => (
                            <option key={style.name} value={style.name}>{style.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </Form.Select>
                    
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleEditStyle}
                      style={{ fontSize: '11px', height: '22px', padding: '0 10px' }}
                    >
                      <FaEdit size={10} className="me-1" />
                      编辑
                    </Button>
                    
                    {!getPresetStyleNames().includes(selectedStyle) && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteCustomStyle(selectedStyle)}
                        style={{ fontSize: '11px', height: '22px', padding: '0 10px' }}
                      >
                        <FaTrash size={10} />
                      </Button>
                    )}
                    
                    <span style={{ fontSize: '10px', color: '#6c757d' }}>
                      {getPresetStyleNames().includes(selectedStyle) ? (
                        <Badge bg="secondary" style={{ fontSize: '9px' }}>预设</Badge>
                      ) : (
                        <Badge bg="info" style={{ fontSize: '9px' }}>自定义</Badge>
                      )}
                    </span>
                  </div>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className={`mb-2 align-items-center ${formStyles.rowTight}`}>
                <Form.Label column sm={2} className={formStyles.label}>清理规则:</Form.Label>
                <Col sm={4}>
                  <div className={formStyles.controlInline}>
                    <Form.Check
                      type="checkbox"
                      label={`应用 (${regexRules.filter(r => r.enabled).length})`}
                      checked={applyRegex}
                      onChange={(e) => setApplyRegex(e.target.checked)}
                    />
                    <span className={formStyles.help}>自动清理标签与标点</span>
                  </div>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className={`mb-2 align-items-center ${formStyles.rowTight}`}>
                <Form.Label column sm={2} className={formStyles.label}>添加水印:</Form.Label>
                <Col sm={10}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Form.Check
                      type="checkbox"
                      label="启用字幕水印"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                    />
                    {enableWatermark && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <Form.Control
                          type="text"
                          placeholder="输入水印文字"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          style={{ width: '160px', fontSize: '11px', height: '22px' }}
                        />
                        <Form.Select
                          value={watermarkPosition}
                          onChange={(e) => setWatermarkPosition(e.target.value as any)}
                          style={{ width: '120px', fontSize: '11px', height: '22px' }}
                        >
                          <option value="top-left">左上角</option>
                          <option value="top-right">右上角</option>
                          <option value="bottom-left">左下角</option>
                          <option value="bottom-right">右下角</option>
                        </Form.Select>
                        <span style={{ fontSize: '10px', color: '#6c757d' }}>
                          (半透明小字)
                        </span>
                      </div>
                    )}
                  </div>
                </Col>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleConvert}
                  disabled={(batchMode ? selectedFiles.length === 0 : !selectedFile) || converting}
                >
                  {converting 
                    ? (batchMode ? `转换中... (${currentFileIndex + 1}/${selectedFiles.length})` : '转换中...') 
                    : (batchMode ? `开始批量转换 (${selectedFiles.length}个文件)` : '开始转换')
                  }
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={converting || (batchMode ? selectedFiles.length === 0 : !selectedFile)}
                >
                  清空重新开始
                </Button>
              </div>
          </fieldset>

          {/* 样式预览 */}
          <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '12px' }}>
            <legend style={{ fontSize: '11px', fontWeight: 600, marginBottom: '12px', color: '#495057' }}>
              📺 样式预览
            </legend>
            <div style={{ 
              position: 'relative',
              width: '100%',
              minHeight: '120px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px'
            }}>
              {(() => {
                const currentStyle = getStyleParams(selectedStyle);
                if (!currentStyle) return null;
                
                const textColor = assColorToCss(currentStyle.primaryColour);
                const outlineColor = assColorToCss(currentStyle.outlineColour);
                const textShadow = getOutlineTextShadow(currentStyle.outline, outlineColor);
                
                return (
                  <>
                    <div style={{
                      fontFamily: currentStyle.fontname,
                      fontSize: `${currentStyle.fontsize * 1.2}px`,
                      color: textColor,
                      textShadow: textShadow,
                      fontWeight: currentStyle.bold ? 'bold' : 'normal',
                      fontStyle: currentStyle.italic ? 'italic' : 'normal',
                      textAlign: 'center' as const,
                      lineHeight: 1.6,
                      marginBottom: '12px'
                    }}>
                      这是字幕预览效果
                    </div>
                    <div style={{
                      fontFamily: currentStyle.fontname,
                      fontSize: `${currentStyle.fontsize * 0.9}px`,
                      color: textColor,
                      textShadow: textShadow,
                      fontWeight: currentStyle.bold ? 'bold' : 'normal',
                      textAlign: 'center' as const,
                      lineHeight: 1.6,
                      opacity: 0.95
                    }}>
                      Subtitle Preview Effect
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#6c757d', 
              marginTop: '8px',
              textAlign: 'center' as const
            }}>
              当前样式：<strong>{selectedStyle}</strong>
              {enableWatermark && watermarkText && (
                <span style={{ marginLeft: '12px' }}>
                  | 水印：{watermarkText} ({watermarkPosition === 'top-left' ? '左上' : watermarkPosition === 'top-right' ? '右上' : watermarkPosition === 'bottom-left' ? '左下' : '右下'})
                </span>
              )}
            </div>
          </fieldset>

          {/* 转换进度 */}
          {converting && (
            <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
              <legend style={{ display: 'none' }}>转换进度</legend>
              <ProgressBar
                now={progress}
                label={`${progress}%`}
                animated={progress < 100}
                variant={progress === 100 ? 'success' : 'primary'}
              />
            </fieldset>
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
          <fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
            <legend style={{ display: 'none' }}>📖 功能说明</legend>
            <h6 style={{ fontSize: '10px', marginBottom: '8px' }}>转换流程：</h6>
            <ol className="small" style={{ fontSize: '10px', paddingLeft: '20px', marginBottom: '12px' }}>
              <li>选择SRT字幕文件</li>
              <li>应用正则替换规则清理文本</li>
              <li>选择ASS样式模板</li>
              <li>点击"开始转换"</li>
              <li>自动下载ASS文件</li>
            </ol>

            <hr style={{ margin: '8px 0' }} />

            <h6 style={{ fontSize: '10px', marginBottom: '8px' }}>正则替换规则：</h6>
            <ul className="small" style={{ fontSize: '10px', paddingLeft: '20px', marginBottom: '0' }}>
              <li>移除HTML标签</li>
              <li>清理标点符号</li>
              <li>格式化空格</li>
              <li>统一换行符</li>
            </ul>
          </fieldset>

          {/* 日志提示 */}
          {logs.length > 0 && (
            <fieldset style={{ border: 'none', backgroundColor: '#fff', padding: '0 6px 6px 6px' }}>
              <legend style={{ display: 'none' }}>📋 处理日志</legend>
              <div className="text-center" style={{ padding: '10px' }}>
                <p className="mb-2" style={{ fontSize: '10px', color: '#6c757d' }}>
                  共 {logs.length} 条日志记录
                </p>
                <p className="mb-0" style={{ fontSize: '10px', color: '#adb5bd' }}>
                  详细日志请查看专门的日志页面
                </p>
              </div>
            </fieldset>
          )}

        </div>
      </div>

      {/* 样式编辑器 Modal */}
      <Modal show={showStyleEditor} onHide={() => setShowStyleEditor(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '16px' }}>
            <FaCog className="me-2" />
            编辑ASS样式 - {editingStyle?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingStyle && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>字体名称</Form.Label>
                    <Form.Select
                      value={editingStyle.fontname}
                      onChange={(e) => setEditingStyle({...editingStyle, fontname: e.target.value})}
                      style={{ fontSize: '12px' }}
                    >
                      <optgroup label="中文字体（推荐）">
                        <option value="Microsoft YaHei">微软雅黑 (Microsoft YaHei)</option>
                        <option value="PingFang SC">苹方简体 (PingFang SC)</option>
                        <option value="PingFang TC">苹方繁体 (PingFang TC)</option>
                        <option value="Heiti SC">黑体简体 (Heiti SC)</option>
                        <option value="STHeiti">华文黑体 (STHeiti)</option>
                        <option value="SimHei">黑体 (SimHei)</option>
                        <option value="SimSun">宋体 (SimSun)</option>
                        <option value="KaiTi">楷体 (KaiTi)</option>
                      </optgroup>
                      <optgroup label="英文字体">
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Tahoma">Tahoma</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </optgroup>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '10px' }}>
                      选择系统中已安装的字体
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>字体大小</Form.Label>
                    <Form.Control
                      type="number"
                      value={editingStyle.fontsize}
                      onChange={(e) => setEditingStyle({...editingStyle, fontsize: parseInt(e.target.value) || 18})}
                      min={8}
                      max={72}
                      style={{ fontSize: '12px' }}
                    />
                    <Form.Text style={{ fontSize: '10px' }}>
                      推荐: 14-24
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>文字颜色</Form.Label>
                    <Form.Select
                      value={editingStyle.primaryColour}
                      onChange={(e) => setEditingStyle({...editingStyle, primaryColour: e.target.value})}
                      style={{ fontSize: '12px' }}
                    >
                      <option value="&H00FFFFFF">白色</option>
                      <option value="&H00000000">黑色</option>
                      <option value="&H000000FF">红色</option>
                      <option value="&H0000FF00">绿色</option>
                      <option value="&H00FF0000">蓝色</option>
                      <option value="&H0000FFFF">黄色</option>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '10px' }}>
                      字幕主色
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>描边颜色</Form.Label>
                    <Form.Select
                      value={editingStyle.outlineColour}
                      onChange={(e) => setEditingStyle({...editingStyle, outlineColour: e.target.value})}
                      style={{ fontSize: '12px' }}
                    >
                      <option value="&H00000000">黑色</option>
                      <option value="&H00FFFFFF">白色</option>
                      <option value="&H00404040">深灰</option>
                      <option value="&H00808080">灰色</option>
                      <option value="&H000000FF">红色</option>
                      <option value="&H0000FF00">绿色</option>
                      <option value="&H00FF0000">蓝色</option>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '10px' }}>
                      描边边框色
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>描边宽度</Form.Label>
                    <Form.Control
                      type="number"
                      value={editingStyle.outline}
                      onChange={(e) => setEditingStyle({...editingStyle, outline: parseFloat(e.target.value) || 0})}
                      min={0}
                      max={5}
                      step={0.1}
                      style={{ fontSize: '12px' }}
                    />
                    <Form.Text style={{ fontSize: '10px' }}>
                      推荐: 0.5-1.5
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>对齐方式</Form.Label>
                    <Form.Select
                      value={editingStyle.alignment}
                      onChange={(e) => setEditingStyle({...editingStyle, alignment: parseInt(e.target.value) as any})}
                      style={{ fontSize: '12px' }}
                    >
                      <option value={1}>底部左对齐</option>
                      <option value={2}>底部居中</option>
                      <option value={3}>底部右对齐</option>
                      <option value={4}>中间左对齐</option>
                      <option value={5}>中间居中</option>
                      <option value={6}>中间右对齐</option>
                      <option value={7}>顶部左对齐</option>
                      <option value={8}>顶部居中</option>
                      <option value={9}>顶部右对齐</option>
                    </Form.Select>
                    <Form.Text style={{ fontSize: '10px' }}>
                      数字键盘布局: 1-9
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>底部边距</Form.Label>
                    <Form.Control
                      type="number"
                      value={editingStyle.marginV}
                      onChange={(e) => setEditingStyle({...editingStyle, marginV: parseInt(e.target.value) || 0})}
                      min={0}
                      max={100}
                      style={{ fontSize: '12px' }}
                    />
                    <Form.Text style={{ fontSize: '10px' }}>
                      推荐: 10-30（距离底部的像素）
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>保存为新预设名称（可选）</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="留空则使用原样式名"
                      value={customStyleName}
                      onChange={(e) => setCustomStyleName(e.target.value)}
                      style={{ fontSize: '12px' }}
                    />
                    <Form.Text style={{ fontSize: '10px' }}>
                      输入名称将保存为新的自定义样式
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Alert variant="info" style={{ fontSize: '11px', padding: '8px 12px', marginBottom: '16px' }}>
                <strong>💡 提示：</strong>
                修改后点击"保存"将创建自定义样式预设，不会影响原预设样式。
              </Alert>

              {/* 样式预览 */}
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#f8f9fa', 
                borderRadius: '6px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: '#495057' }}>
                  实时预览：
                </div>
                <div style={{ 
                  position: 'relative',
                  width: '100%',
                  height: '120px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: editingStyle.alignment <= 3 ? 'flex-end' : editingStyle.alignment <= 6 ? 'center' : 'flex-start',
                  justifyContent: editingStyle.alignment % 3 === 1 ? 'flex-start' : editingStyle.alignment % 3 === 2 ? 'center' : 'flex-end'
                }}>
                  <div style={{
                    fontFamily: editingStyle.fontname,
                    fontSize: `${editingStyle.fontsize * 0.8}px`,
                    color: assColorToCss(editingStyle.primaryColour),
                    textShadow: getOutlineTextShadow(editingStyle.outline, assColorToCss(editingStyle.outlineColour)),
                    fontWeight: editingStyle.bold ? 'bold' : 'normal',
                    fontStyle: editingStyle.italic ? 'italic' : 'normal',
                    textDecoration: editingStyle.underline ? 'underline' : 'none',
                    padding: `${editingStyle.marginV * 0.5}px ${editingStyle.marginL}px`,
                    textAlign: 'center' as const,
                    lineHeight: 1.4
                  }}>
                    这是字幕预览效果
                    <br />
                    <span style={{ fontSize: '0.85em', opacity: 0.9 }}>Subtitle Preview</span>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#6c757d', 
                  marginTop: '6px',
                  textAlign: 'center' as const
                }}>
                  预览按实际渲染可能略有差异
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStyleEditor(false)} size="sm">
            取消
          </Button>
          <Button variant="primary" onClick={handleSaveCustomStyle} size="sm">
            <FaSave className="me-1" />
            保存为预设
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SubtitleConvertTab;

