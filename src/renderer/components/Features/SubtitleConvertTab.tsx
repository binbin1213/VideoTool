import { useState, useRef, useEffect } from 'react';
import { Modal, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaFileUpload, FaPlay, FaCog, FaSave, FaTrash, FaFile, FaFolderOpen } from 'react-icons/fa';
import styles from './SubtitleConvertTab.module.scss';
import buttonStyles from '../../styles/components/Button.module.scss';
import Switch from '../common/Switch';
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
  const { t } = useTranslation();
  const [batchMode, setBatchMode] = useState(false); // 批量模式开关
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // 批量文件列表
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0); // 当前处理的文件索引
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('译文字幕 底部');
  const [targetResolution, setTargetResolution] = useState<'1080p' | '4k'>('1080p'); // 目标分辨率
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
      
      // 根据目标分辨率选择 videoHeight 参数
      const videoHeight = targetResolution === '4k' ? 2160 : 1080;
      
      const assContent = generateASS(processedSubtitles, selectedStyle, watermark, undefined, videoHeight);
      addLocalLog(`使用样式: ${selectedStyle}`, 'info');
      addLocalLog(`目标分辨率: ${targetResolution === '4k' ? '4K (2160p)' : '1080p'}`, 'info');
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <FaPlay />
          {t('subtitleConvert.title') || '字幕格式转换 (SRT → ASS)'}
        </h2>
      </div>

      <div className={styles.content}>
        <div className={styles.mainArea}>
          {/* 批量模式开关 */}
          <div className={styles.modeSwitch}>
            <span className={styles.modeSwitchLabel}>
              {batchMode ? <FaFolderOpen /> : <FaFile />}
              {batchMode 
                ? (t('subtitleConvert.batchMode') || '批量转换模式（可选择多个文件）')
                : (t('subtitleConvert.singleMode') || '单文件转换模式')
              }
                </span>
            <Switch
              checked={batchMode}
              onChange={(checked) => {
                setBatchMode(checked);
                setSelectedFile(null);
                setSelectedFiles([]);
                setResult(null);
                setLogs([]);
              }}
              disabled={converting}
            />
          </div>

          {/* 文件选择区域 */}
          <div className={styles.section}>
            <div
              className={styles.fileSelector}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <FaFileUpload size={48} className={styles.fileIcon} />
              <p className={styles.fileText}>
                {batchMode ? (
                  selectedFiles.length > 0 ? (
                    <strong>{t('subtitleConvert.filesSelected', { count: selectedFiles.length }) || `已选择 ${selectedFiles.length} 个文件`}</strong>
                  ) : (
                    t('subtitleConvert.selectMultipleFiles') || '点击选择多个SRT文件'
                  )
                ) : (
                  selectedFile ? (
                    <strong>{selectedFile.name}</strong>
                  ) : (
                    t('subtitleConvert.selectOrDrag') || '点击选择或拖拽SRT文件到此处'
                  )
                )}
              </p>
              <p className={styles.fileHint}>{t('subtitleConvert.supportedFormat') || '支持的格式：.srt'}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt"
              multiple={batchMode}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* 批量模式：文件列表 */}
          {batchMode && selectedFiles.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                {t('subtitleConvert.fileList') || '文件列表'} ({selectedFiles.length}个)
              </div>
              <div className={styles.fileList}>
              {selectedFiles.map((file, index) => (
                <div 
                  key={index}
                    className={`${styles.fileItem} ${index === currentFileIndex && converting ? styles.processing : ''}`}
                >
                    <span className={styles.fileIndex}>{index + 1}.</span>
                    <span className={styles.fileName}>{file.name}</span>
                  {converting && index < currentFileIndex && (
                      <span className={styles.fileStatus} style={{ color: 'var(--vt-color-semantic-success)' }}>✓</span>
                  )}
                  {converting && index === currentFileIndex && (
                      <span className={styles.fileStatus} style={{ color: 'var(--vt-color-semantic-info)' }}>...</span>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          {/* 转换设置 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <FaCog /> {t('subtitleConvert.settings') || '转换设置'}
            </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('subtitleConvert.styleTemplate') || 'ASS样式模板'}:</label>
                <div className={styles.formControl}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className={styles.select}
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      style={{ width: '180px' }}
                    >
                      <optgroup label={t('subtitleConvert.presetStyles') || '预设样式'}>
                        {getPresetStyleNames().map(style => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </optgroup>
                      {getCustomStyles().length > 0 && (
                        <optgroup label={t('subtitleConvert.customStyles') || '自定义样式'}>
                          {getCustomStyles().map(style => (
                            <option key={style.name} value={style.name}>{style.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    
                    <button
                      className={buttonStyles.buttonSecondary}
                      onClick={handleEditStyle}
                    >
                      {t('subtitleConvert.editStyle') || '编辑'}
                    </button>
                    
                    {!getPresetStyleNames().includes(selectedStyle) && (
                      <button
                        className={`${buttonStyles.buttonDanger} ${buttonStyles.buttonSmall}`}
                        onClick={() => handleDeleteCustomStyle(selectedStyle)}
                      >
                        <FaTrash size={10} />
                      </button>
                    )}
                    
                    <span style={{ fontSize: '11px', color: 'var(--vt-color-text-tertiary)' }}>
                      {getPresetStyleNames().includes(selectedStyle) ? (
                        <span className={`${styles.badge} ${styles.badgePreset}`}>{t('subtitleConvert.preset') || '预设'}</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeCustom}`}>{t('subtitleConvert.custom') || '自定义'}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 目标分辨率选择 */}
              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('subtitleConvert.targetResolution') || '目标分辨率'}:</label>
                <div className={styles.formControl}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="targetResolution"
                        value="1080p"
                        checked={targetResolution === '1080p'}
                        onChange={(e) => setTargetResolution(e.target.value as '1080p' | '4k')}
                      />
                      <span>1080p</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="targetResolution"
                        value="4k"
                        checked={targetResolution === '4k'}
                        onChange={(e) => setTargetResolution(e.target.value as '1080p' | '4k')}
                      />
                      <span>4K (2160p)</span>
                    </label>
                    <span style={{ fontSize: '12px', color: 'var(--vt-color-text-tertiary)', marginLeft: '8px' }}>
                      💡 {t('subtitleConvert.resolutionHint') || '根据目标视频分辨率选择，4K视频字幕字号更大'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('subtitleConvert.cleaningRules') || '清理规则'}:</label>
                <div className={styles.formControl}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={applyRegex}
                      onChange={(e) => setApplyRegex(e.target.checked)}
                    />
                    <span>{t('subtitleConvert.applyRules', { count: regexRules.filter(r => r.enabled).length }) || `应用 (${regexRules.filter(r => r.enabled).length})`}</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--vt-color-text-tertiary)', marginLeft: '8px' }}>
                    {t('subtitleConvert.autoCleanTags') || '自动清理标签与标点'}
                  </span>
                  </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('subtitleConvert.addWatermark') || '添加水印'}:</label>
                <div className={styles.formControl}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className={styles.checkbox}>
                      <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                    />
                      <span>{t('subtitleConvert.enableWatermark') || '启用字幕水印'}</span>
                    </label>
                    {enableWatermark && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder={t('subtitleConvert.watermarkText') || '输入水印文字'}
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          style={{ width: '160px' }}
                        />
                        <select
                          className={styles.select}
                          value={watermarkPosition}
                          onChange={(e) => setWatermarkPosition(e.target.value as any)}
                          style={{ width: '120px' }}
                        >
                          <option value="top-left">{t('subtitleConvert.positionTopLeft') || '左上角'}</option>
                          <option value="top-right">{t('subtitleConvert.positionTopRight') || '右上角'}</option>
                          <option value="bottom-left">{t('subtitleConvert.positionBottomLeft') || '左下角'}</option>
                          <option value="bottom-right">{t('subtitleConvert.positionBottomRight') || '右下角'}</option>
                        </select>
                        <span style={{ fontSize: '11px', color: 'var(--vt-color-text-tertiary)' }}>
                          {t('subtitleConvert.watermarkHint') || '(半透明小字)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonLarge}`}
                  onClick={handleConvert}
                  disabled={(batchMode ? selectedFiles.length === 0 : !selectedFile) || converting}
                  style={{ flex: 1 }}
                >
                  {converting 
                    ? (batchMode 
                        ? t('subtitleConvert.batchConverting', { current: currentFileIndex + 1, total: selectedFiles.length }) || `转换中... (${currentFileIndex + 1}/${selectedFiles.length})`
                        : t('subtitleConvert.converting') || '转换中...'
                      )
                    : (batchMode 
                        ? t('subtitleConvert.startBatchConvert', { count: selectedFiles.length }) || `开始批量转换 (${selectedFiles.length}个文件)`
                        : t('subtitleConvert.startConvert') || '开始转换'
                      )
                  }
                </button>
                <button
                  className={buttonStyles.buttonSecondary}
                  onClick={handleClearAll}
                  disabled={converting || (batchMode ? selectedFiles.length === 0 : !selectedFile)}
                >
                  {t('subtitleConvert.clearAndRestart') || '清空重新开始'}
                </button>
              </div>
          </div>

          {/* 样式预览 */}
          <div className={styles.stylePreview}>
            <div className={styles.previewBox}>
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
                      lineHeight: 1.4,
                      marginBottom: '6px'
                    }}>
                      {t('subtitleConvert.previewText') || '这是字幕预览效果'}
                    </div>
                    <div style={{
                      fontFamily: currentStyle.fontname,
                      fontSize: `${currentStyle.fontsize * 0.9}px`,
                      color: textColor,
                      textShadow: textShadow,
                      fontWeight: currentStyle.bold ? 'bold' : 'normal',
                      textAlign: 'center' as const,
                      lineHeight: 1.4,
                      opacity: 0.9
                    }}>
                      {t('subtitleConvert.previewTextEn') || 'Subtitle Preview'}
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--vt-color-text-tertiary)', 
              marginTop: '8px',
              textAlign: 'center' as const
            }}>
              {t('subtitleConvert.currentStyle') || '当前样式'}：<strong>{selectedStyle}</strong>
              {enableWatermark && watermarkText && (
                <span style={{ marginLeft: '12px' }}>
                  | {t('subtitleConvert.watermark') || '水印'}：{watermarkText} ({watermarkPosition === 'top-left' ? (t('subtitleConvert.positionTopLeft') || '左上') : watermarkPosition === 'top-right' ? (t('subtitleConvert.positionTopRight') || '右上') : watermarkPosition === 'bottom-left' ? (t('subtitleConvert.positionBottomLeft') || '左下') : (t('subtitleConvert.positionBottomRight') || '右下')})
                </span>
              )}
            </div>
          </div>

          {/* 转换进度 */}
          {converting && (
            <div className={styles.section}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.progressText}>{progress}%</div>
            </div>
          )}

          {/* 转换结果 */}
          {result && (
            <div className={`${styles.alert} ${result.success ? styles.alertSuccess : styles.alertError}`}>
              <div className={styles.alertHeading}>
                {result.success 
                  ? (t('subtitleConvert.convertSuccess') || '转换成功！')
                  : (t('subtitleConvert.convertFailed') || '转换失败')
                }
              </div>
              <div className={styles.alertText}>{result.message}</div>
              {result.outputPath && (
                <div className={styles.alertText} style={{ marginBottom: 0 }}>
                  <strong>{t('subtitleConvert.outputFile') || '输出文件'}：</strong>{result.outputPath}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.infoArea}>
          {/* 功能说明 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{t('subtitleConvert.guideTitle') || '功能说明'}</div>
            <h6>{t('subtitleConvert.convertSteps') || '转换流程'}：</h6>
            <ol>
              <li>{t('subtitleConvert.step1') || '选择SRT字幕文件'}</li>
              <li>{t('subtitleConvert.step2') || '应用正则替换规则清理文本'}</li>
              <li>{t('subtitleConvert.step3') || '选择ASS样式模板'}</li>
              <li>{t('subtitleConvert.step4') || '点击"开始转换"'}</li>
              <li>{t('subtitleConvert.step5') || '自动下载ASS文件'}</li>
            </ol>

            <hr />

            <h6>{t('subtitleConvert.cleaningRulesTitle') || '正则替换规则'}：</h6>
            <ul>
              <li>{t('subtitleConvert.removeHTMLTags') || '移除HTML标签'}</li>
              <li>{t('subtitleConvert.cleanPunctuation') || '清理标点符号'}</li>
              <li>{t('subtitleConvert.formatSpaces') || '格式化空格'}</li>
              <li>{t('subtitleConvert.unifyLineBreaks') || '统一换行符'}</li>
            </ul>
          </div>

          {/* 日志提示 */}
          {logs.length > 0 && (
            <div className={styles.section}>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <p style={{ color: 'var(--vt-color-text-secondary)' }}>
                  {t('subtitleConvert.logCount', { count: logs.length }) || `共 ${logs.length} 条日志记录`}
                </p>
                <p style={{ color: 'var(--vt-color-text-tertiary)' }}>
                  {t('subtitleConvert.viewDetailedLogs') || '详细日志请查看专门的日志页面'}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 样式编辑器 Modal */}
      <Modal show={showStyleEditor} onHide={() => setShowStyleEditor(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className={styles.modalTitle}>
            <FaCog />
            {t('subtitleConvert.styleEditor') || '编辑ASS样式'} - {editingStyle?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingStyle && (
            <div>
              <Row>
                <Col md={6}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.fontName') || '字体名称'}
                    </label>
                    <select
                      className={styles.select}
                      value={editingStyle.fontname}
                      onChange={(e) => setEditingStyle({...editingStyle, fontname: e.target.value})}
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
                    </select>
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.fontSelectHint') || '选择系统中已安装的字体'}
                    </small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.fontSize') || '字体大小'}
                    </label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editingStyle.fontsize}
                      onChange={(e) => setEditingStyle({...editingStyle, fontsize: parseInt(e.target.value) || 18})}
                      min={8}
                      max={72}
                    />
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.fontSizeHint') || '推荐: 14-24'}
                    </small>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.textColor') || '文字颜色'}
                    </label>
                    <select
                      className={styles.select}
                      value={editingStyle.primaryColour}
                      onChange={(e) => setEditingStyle({...editingStyle, primaryColour: e.target.value})}
                    >
                      <option value="&H00FFFFFF">{t('subtitleConvert.white') || '白色'}</option>
                      <option value="&H00000000">{t('subtitleConvert.black') || '黑色'}</option>
                      <option value="&H000000FF">{t('subtitleConvert.red') || '红色'}</option>
                      <option value="&H0000FF00">{t('subtitleConvert.green') || '绿色'}</option>
                      <option value="&H00FF0000">{t('subtitleConvert.blue') || '蓝色'}</option>
                      <option value="&H0000FFFF">{t('subtitleConvert.yellow') || '黄色'}</option>
                    </select>
                    <small className={styles.fieldHint}>
                      字幕主色
                    </small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.outlineColor') || '描边颜色'}
                    </label>
                    <select
                      className={styles.select}
                      value={editingStyle.outlineColour}
                      onChange={(e) => setEditingStyle({...editingStyle, outlineColour: e.target.value})}
                    >
                      <option value="&H00000000">{t('subtitleConvert.black') || '黑色'}</option>
                      <option value="&H00FFFFFF">{t('subtitleConvert.white') || '白色'}</option>
                      <option value="&H00404040">{t('subtitleConvert.darkGray') || '深灰'}</option>
                      <option value="&H00808080">{t('subtitleConvert.gray') || '灰色'}</option>
                      <option value="&H000000FF">{t('subtitleConvert.red') || '红色'}</option>
                      <option value="&H0000FF00">{t('subtitleConvert.green') || '绿色'}</option>
                      <option value="&H00FF0000">{t('subtitleConvert.blue') || '蓝色'}</option>
                    </select>
                    <small className={styles.fieldHint}>
                      描边边框色
                    </small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.outlineWidth') || '描边宽度'}
                    </label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editingStyle.outline}
                      onChange={(e) => setEditingStyle({...editingStyle, outline: parseFloat(e.target.value) || 0})}
                      min={0}
                      max={5}
                      step={0.1}
                    />
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.outlineWidthHint') || '推荐: 0.5-1.5'}
                    </small>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.alignment') || '对齐方式'}
                    </label>
                    <select
                      className={styles.select}
                      value={editingStyle.alignment}
                      onChange={(e) => setEditingStyle({...editingStyle, alignment: parseInt(e.target.value) as any})}
                    >
                      <option value={1}>{t('subtitleConvert.bottomLeft') || '底部左对齐'}</option>
                      <option value={2}>{t('subtitleConvert.bottomCenter') || '底部居中'}</option>
                      <option value={3}>{t('subtitleConvert.bottomRight') || '底部右对齐'}</option>
                      <option value={4}>{t('subtitleConvert.middleLeft') || '中间左对齐'}</option>
                      <option value={5}>{t('subtitleConvert.middleCenter') || '中间居中'}</option>
                      <option value={6}>{t('subtitleConvert.middleRight') || '中间右对齐'}</option>
                      <option value={7}>{t('subtitleConvert.topLeft') || '顶部左对齐'}</option>
                      <option value={8}>{t('subtitleConvert.topCenter') || '顶部居中'}</option>
                      <option value={9}>{t('subtitleConvert.topRight') || '顶部右对齐'}</option>
                    </select>
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.alignmentHint') || '数字键盘布局: 1-9'}
                    </small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.bottomMargin') || '底部边距'}
                    </label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editingStyle.marginV}
                      onChange={(e) => setEditingStyle({...editingStyle, marginV: parseInt(e.target.value) || 0})}
                      min={0}
                      max={100}
                    />
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.marginHint') || '推荐: 10-30（距离底部的像素）'}
                    </small>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.savePresetName') || '保存为新预设名称（可选）'}
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder={t('subtitleConvert.savePresetPlaceholder') || '留空则使用原样式名'}
                      value={customStyleName}
                      onChange={(e) => setCustomStyleName(e.target.value)}
                    />
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.savePresetHint') || '输入名称将保存为新的自定义样式'}
                    </small>
                  </div>
                </Col>
              </Row>

              <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginBottom: '16px' }}>
                <strong>{t('common.info') || '提示'}：</strong>
                {t('subtitleConvert.editorTip') || '修改后点击"保存"将创建自定义样式预设，不会影响原预设样式。'}
              </div>

              {/* 样式预览 */}
              <div className={styles.modalPreviewWrapper}>
                <div className={styles.modalPreviewTitle}>
                  {t('subtitleConvert.realTimePreview') || '实时预览'}：
                </div>
                <div 
                  className={styles.modalPreviewBox}
                  style={{ 
                  alignItems: editingStyle.alignment <= 3 ? 'flex-end' : editingStyle.alignment <= 6 ? 'center' : 'flex-start',
                  justifyContent: editingStyle.alignment % 3 === 1 ? 'flex-start' : editingStyle.alignment % 3 === 2 ? 'center' : 'flex-end'
                  }}
                >
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
                    {t('subtitleConvert.previewText') || '这是字幕预览效果'}
                    <br />
                    <span style={{ fontSize: '0.85em', opacity: 0.9 }}>{t('subtitleConvert.previewTextEn') || 'Subtitle Preview'}</span>
                  </div>
                </div>
                <div className={styles.modalPreviewNote}>
                  {t('subtitleConvert.previewNote') || '预览按实际渲染可能略有差异'}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className={buttonStyles.buttonSecondary} onClick={() => setShowStyleEditor(false)}>
            {t('common.cancel') || '取消'}
          </button>
          <button className={buttonStyles.buttonPrimary} onClick={handleSaveCustomStyle}>
            <FaSave style={{ marginRight: '4px' }} />
            {t('subtitleConvert.saveAsPreset') || '保存为预设'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SubtitleConvertTab;

