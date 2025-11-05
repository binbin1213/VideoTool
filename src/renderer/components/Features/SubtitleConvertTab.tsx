import { useState, useRef, useEffect } from 'react';
import { Modal, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './SubtitleConvertTab.module.scss';
import buttonStyles from '../../styles/components/Button.module.scss';
import selectStyles from '../../styles/components/Select.module.scss';
import Switch from '../Common/Switch';
import {
  getDefaultRegexRules,
  getStyleParams,
  saveCustomStyle,
  deleteCustomStyle,
  getPresetStyleNames,
  getCustomStyles,
  convertSubtitle,
  type ASSStyleParams,
  type SubtitleFormat,
} from '../../utils/subtitleConverter';

const { ipcRenderer } = (window as any).electron;

interface SubtitleConvertTabProps {
  addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
}

function SubtitleConvertTab({ addLog }: SubtitleConvertTabProps) {
  const { t, i18n } = useTranslation();
  const [batchMode, setBatchMode] = useState(false); // 批量模式开关
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // 批量文件列表
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0); // 当前处理的文件索引
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('电影字幕 底部'); // 使用模板中的默认样式 ✅
  const [targetResolution, setTargetResolution] = useState<'1080p' | '4k'>('1080p'); // 目标分辨率
  const [inputFormat, setInputFormat] = useState<SubtitleFormat>('srt'); // 输入格式
  const [outputFormat, setOutputFormat] = useState<SubtitleFormat>('ass'); // 输出格式
  const [regexRules, setRegexRules] = useState<any[]>([]);
  const [applyRegex, setApplyRegex] = useState(true);
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  const [isDragging, setIsDragging] = useState(false); // 拖拽状态
  
  // 样式编辑器
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [editingStyle, setEditingStyle] = useState<ASSStyleParams | null>(null);
  // 错误提示弹窗
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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

  // 自动检测文件格式
  const detectFileFormat = (fileName: string): SubtitleFormat => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.srt')) return 'srt';
    if (lowerName.endsWith('.ass') || lowerName.endsWith('.ssa')) return 'ass';
    if (lowerName.endsWith('.vtt')) return 'vtt';
    return 'srt'; // 默认
  };

  // 翻译样式名称
  const translateStyleName = (styleName: string): string => {
    const key = `subtitleConvert.styleName_${styleName}`;
    const translated = t(key);
    // 如果翻译键不存在，返回原名称
    return translated === key ? styleName : translated;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (batchMode) {
      // 批量模式：选择多个文件
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        // 验证所有文件是否为同一格式
        const detectedFormat = detectFileFormat(files[0].name);
        const allSameFormat = files.every(file => detectFileFormat(file.name) === detectedFormat);
        
        if (!allSameFormat) {
          const formats = Array.from(new Set(files.map(f => detectFileFormat(f.name).toUpperCase())));
          // 根据语言选择分隔符：中文用顿号，英文用逗号
          const separator = i18n.language.startsWith('zh') ? '、' : ', ';
          const formatsText = formats.join(separator);
          
          addLocalLog(`❌ ${t('subtitleConvert.mixedFormatError')}`, 'error');
          addLocalLog(`${t('subtitleConvert.detectedFormats', { formats: formatsText })}`, 'error');
          
          // 显示错误弹窗
          const errorMsg = `${t('subtitleConvert.mixedFormatError')}\n\n${t('subtitleConvert.detectedFormats', { formats: formatsText })}\n\n${t('subtitleConvert.pleaseReselectSameFormat')}`;
          setErrorMessage(errorMsg);
          setShowErrorModal(true);
          
          // 清空已选择的文件
          event.target.value = '';
          return;
        }
        
        setSelectedFiles(files);
        setResult(null);
        setLogs([]);
        setInputFormat(detectedFormat);
        
        addLocalLog(`选择 ${files.length} 个文件`, 'info');
        addLocalLog(`检测到格式: ${detectedFormat.toUpperCase()}`, 'info');
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
        
        // 自动检测并设置输入格式
        const detectedFormat = detectFileFormat(file.name);
        setInputFormat(detectedFormat);
        
        addLocalLog(`选择文件: ${file.name}`, 'info');
        addLocalLog(`检测到格式: ${detectedFormat.toUpperCase()}`, 'info');
      }
    }
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    const validExtensions = ['.srt', '.ass', '.ssa', '.vtt'];
    const isValidFile = file && validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (isValidFile) {
      setSelectedFile(file);
      setResult(null);
      setLogs([]);
      
      // 自动检测并设置输入格式
      const detectedFormat = detectFileFormat(file.name);
      setInputFormat(detectedFormat);
      
      addLocalLog(`拖入文件: ${file.name}`, 'info');
      addLocalLog(`检测到格式: ${detectedFormat.toUpperCase()}`, 'info');
    } else {
      addLocalLog('请选择字幕文件（支持 SRT、ASS、VTT 格式）', 'error');
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

  // ASS颜色转CSS颜色 ✅
  const assColorToCss = (assColor: string): string => {
    // 预设颜色映射
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
    
    // 如果在预设中找到，直接返回
    if (colorMap[assColor]) {
      return colorMap[assColor];
    }
    
    // 解析自定义 ASS 颜色格式：&HAABBGGRR 或 &H00BBGGRR
    if (assColor && assColor.startsWith('&H')) {
      // 移除 "&H" 前缀
      const hex = assColor.substring(2).toUpperCase();
      
      if (hex.length === 8) {
        // 格式：AABBGGRR（带透明度）
        // 跳过前两位（透明度AA），提取 BBGGRR
        const bb = hex.substring(2, 4);
        const gg = hex.substring(4, 6);
        const rr = hex.substring(6, 8);
        return `#${rr}${gg}${bb}`;
      } else if (hex.length === 6) {
        // 格式：BBGGRR（无透明度）
        const bb = hex.substring(0, 2);
        const gg = hex.substring(2, 4);
        const rr = hex.substring(4, 6);
        return `#${rr}${gg}${bb}`;
      }
    }
    
    return '#FFFFFF'; // 默认白色
  };

  // CSS颜色转ASS颜色 ✅
  const cssColorToAss = (cssColor: string): string => {
    // 移除 # 符号
    const hex = cssColor.replace('#', '').toUpperCase();
    
    if (hex.length === 6) {
      // 格式：RRGGBB → &H00BBGGRR
      const rr = hex.substring(0, 2);
      const gg = hex.substring(2, 4);
      const bb = hex.substring(4, 6);
      return `&H00${bb}${gg}${rr}`;
    }
    
    return '&H00FFFFFF'; // 默认白色
  };

  // 生成描边效果的textShadow（使用更精细的描边算法）✅
  const getOutlineTextShadow = (width: number, color: string): string => {
    if (width <= 0) return '';
    // 使用原始宽度值，不乘以2，更接近ASS的真实描边效果 ✅
    const w = width;
    return `${color} ${w}px 0px 0px, ${color} -${w}px 0px 0px, ${color} 0px ${w}px 0px, ${color} 0px -${w}px 0px, ${color} ${w}px ${w}px 0px, ${color} -${w}px -${w}px 0px, ${color} ${w}px -${w}px 0px, ${color} -${w}px ${w}px 0px`;
  };

  // 生成阴影效果的textShadow ✅
  const getShadowTextShadow = (distance: number, color: string): string => {
    if (distance <= 0) return '';
    return `${color} ${distance}px ${distance}px ${distance * 0.5}px`;
  };

  // 合并描边和阴影效果 ✅
  const getCombinedTextShadow = (outline: number, outlineColor: string, shadow: number, shadowColor: string): string => {
    const outlineShadow = getOutlineTextShadow(outline, outlineColor);
    const shadowEffect = getShadowTextShadow(shadow, shadowColor);
    
    if (outlineShadow && shadowEffect) {
      return `${outlineShadow}, ${shadowEffect}`;
    }
    return outlineShadow || shadowEffect || 'none';
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
    
    const name = customStyleName.trim() || `${t('subtitleConvert.customStylePrefix')}-${Date.now()}`;
    const styleToSave: ASSStyleParams = {
      ...editingStyle,
      name
    };
    
    saveCustomStyle(styleToSave);
    addLocalLog(`${t('subtitleConvert.saveAsPreset')}: ${name}`, 'success');
    
    // 切换到新保存的样式
    setSelectedStyle(name);
    setShowStyleEditor(false);
  };

  // 删除自定义样式
  const handleDeleteCustomStyle = (styleName: string) => {
    if (window.confirm(t('subtitleConvert.confirmDeleteStyle', { styleName }))) {
      deleteCustomStyle(styleName);
      addLocalLog(`${t('subtitleConvert.deleteStyle')} ${t('subtitleConvert.custom')}: ${styleName}`, 'info');
      
      // 如果删除的是当前选中的样式，切换到默认样式
      if (selectedStyle === styleName) {
        setSelectedStyle('电影字幕 底部'); // 使用模板中的默认样式 ✅
      }
    }
  };

  // 单文件转换（返回ASS内容，不直接下载）
  const convertSingleFile = async (file: File, saveDirectory?: string): Promise<{ success: boolean; message: string; outputPath?: string; assContent?: string; fileName?: string }> => {
    try {
      addLocalLog(`开始转换: ${file.name}`, 'info');
      addLocalLog(`输入格式: ${inputFormat.toUpperCase()} → 输出格式: ${outputFormat.toUpperCase()}`, 'info');

      // 读取文件内容
      const content = await file.text();
      addLocalLog(`文件读取完成`, 'info');

      // 准备转换选项
      const videoHeight = outputFormat === 'ass' ? (targetResolution === '4k' ? 2160 : 1080) : undefined;
      const watermark = outputFormat === 'ass' && enableWatermark && watermarkText ? {
        text: watermarkText,
        position: watermarkPosition
      } : undefined;

      // 使用统一转换函数
      const outputContent = convertSubtitle(content, inputFormat, outputFormat, {
        styleName: selectedStyle,
        watermark,
        videoHeight,
        regexRules: applyRegex ? regexRules : undefined,
        applyRegex
      });

      addLocalLog(`转换完成`, 'success');
      
      // 记录转换详情
      if (outputFormat === 'ass') {
        addLocalLog(`使用样式: ${translateStyleName(selectedStyle)}`, 'info');
        addLocalLog(`目标分辨率: ${targetResolution === '4k' ? '4K (2160p)' : '1080p'}`, 'info');
        if (watermark) {
          addLocalLog(`已添加水印: ${watermarkText} (位置: ${watermarkPosition})`, 'info');
        }
      }
      if (applyRegex) {
        const enabledRules = regexRules.filter(r => r.enabled).length;
        addLocalLog(`应用了 ${enabledRules} 条正则替换规则`, 'info');
      }

      // 生成输出文件名（保留语言代码）
      const inputExt = new RegExp(`\\.(${inputFormat})$`, 'i');
      const outputFileName = file.name.replace(inputExt, `.${outputFormat}`);

      // 如果提供了保存目录，使用Electron API保存
      if (saveDirectory) {
        const saveResult = await ipcRenderer.invoke('save-ass-file', outputContent, saveDirectory, outputFileName);
        if (saveResult.success) {
          addLocalLog(`✓ 已保存: ${outputFileName}`, 'success');
          return {
            success: true,
            message: `转换成功`,
            outputPath: saveResult.filePath
          };
        } else {
          throw new Error(saveResult.message);
        }
      } else {
        // 单文件模式：浏览器下载
        const blob = new Blob([outputContent], { type: 'text/plain;charset=utf-8' });
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
          message: `转换成功`,
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
          {t('subtitleConvert.title') || '字幕格式转换 (SRT → ASS)'}
        </h2>
      </div>

      <div className={styles.content}>
        <div className={styles.mainArea}>
          {/* 批量模式开关 */}
          <div className={styles.modeSwitch}>
            <span className={styles.modeSwitchLabel}>
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
              className={`${styles.fileSelector} ${isDragging ? styles.fileSelectorDragging : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
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
              accept=".srt,.ass,.ssa,.vtt"
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
              {t('subtitleConvert.settings') || '转换设置'}
            </div>

              {/* 输入格式选择 */}
              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('subtitleConvert.inputFormat') || '输入格式'}:</label>
                <div className={styles.formControl}>
                  <select
                    className={selectStyles.select}
                    value={inputFormat}
                    onChange={(e) => setInputFormat(e.target.value as SubtitleFormat)}
                    style={{ width: '180px' }}
                  >
                    <option value="srt">SRT</option>
                    <option value="ass">ASS/SSA</option>
                    <option value="vtt">WebVTT</option>
                  </select>
                </div>
              </div>

              {/* 输出格式选择 */}
              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('subtitleConvert.outputFormat') || '输出格式'}:</label>
                <div className={styles.formControl}>
                  <select
                    className={selectStyles.select}
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as SubtitleFormat)}
                    style={{ width: '180px' }}
                  >
                    <option value="srt">SRT</option>
                    <option value="ass">ASS</option>
                    <option value="vtt">WebVTT</option>
                  </select>
                </div>
              </div>

              {/* ASS 样式模板（仅在输出为 ASS 时显示） */}
              {outputFormat === 'ass' && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>{t('subtitleConvert.styleTemplate') || 'ASS样式模板'}:</label>
                <div className={styles.formControl}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className={selectStyles.select}
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      style={{ width: '180px' }}
                    >
                      <optgroup label={t('subtitleConvert.presetStyles') || '预设样式'}>
                        {getPresetStyleNames().map(style => (
                          <option key={style} value={style}>{translateStyleName(style)}</option>
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
                        {t('subtitleConvert.deleteStyle') || '删除'}
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
              )}

              {/* 目标分辨率选择（仅在输出为 ASS 时显示） */}
              {outputFormat === 'ass' && (
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
                  </div>
                </div>
              </div>
              )}

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
                          className={selectStyles.select}
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
                const shadowColor = assColorToCss(currentStyle.backColour);
                const textShadow = getCombinedTextShadow(currentStyle.outline, outlineColor, currentStyle.shadow, shadowColor); // 合并描边和阴影 ✅
                
                return (
                  <div style={{
                    fontFamily: currentStyle.fontname,
                    fontSize: `${currentStyle.fontsize * 1}px`, // 使用1倍大小 ✅
                    color: textColor,
                    textShadow: textShadow,
                    fontWeight: currentStyle.bold ? 'bold' : 'normal',
                    fontStyle: currentStyle.italic ? 'italic' : 'normal',
                    textAlign: 'center' as const,
                    lineHeight: 1.5
                  }}>
                    {t('subtitleConvert.previewText') || '这是字幕预览效果'}
                    <br />
                    <span style={{ fontSize: '0.85em', opacity: 0.9 }}>
                      {t('subtitleConvert.previewTextEn') || 'Subtitle Preview'}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--vt-color-text-tertiary)', 
              marginTop: '8px',
              textAlign: 'center' as const
            }}>
              {t('subtitleConvert.currentStyle') || '当前样式'}：<strong>{translateStyleName(selectedStyle)}</strong>
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
              <li>{t('subtitleConvert.step1') || '选择字幕文件（SRT/ASS/VTT）'}</li>
              <li>{t('subtitleConvert.step2New') || '选择输入和输出格式'}</li>
              <li>{t('subtitleConvert.step3New') || '配置转换选项（样式、分辨率等）'}</li>
              <li>{t('subtitleConvert.step4') || '点击"开始转换"'}</li>
              <li>{t('subtitleConvert.step5New') || '自动下载转换后的文件'}</li>
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
            {t('subtitleConvert.styleEditor') || '编辑ASS样式'} - {editingStyle?.name ? translateStyleName(editingStyle.name) : ''}
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
                      className={selectStyles.select}
                      value={editingStyle.fontname}
                      onChange={(e) => setEditingStyle({...editingStyle, fontname: e.target.value})}
                    >
                      <optgroup label={t('subtitleConvert.fontGroupChinese') || '中文字体（推荐）'}>
                        <option value="Microsoft YaHei">微软雅黑 (Microsoft YaHei)</option>
                        <option value="PingFang SC">苹方简体 (PingFang SC)</option>
                        <option value="PingFang TC">苹方繁体 (PingFang TC)</option>
                        <option value="Heiti SC">黑体简体 (Heiti SC)</option>
                        <option value="STHeiti">华文黑体 (STHeiti)</option>
                        <option value="SimHei">黑体 (SimHei)</option>
                        <option value="SimSun">宋体 (SimSun)</option>
                        <option value="KaiTi">楷体 (KaiTi)</option>
                      </optgroup>
                      <optgroup label={t('subtitleConvert.fontGroupEnglish') || '英文字体'}>
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className={selectStyles.select}
                        value={['&H00FFFFFF', '&H00000000', '&H000000FF', '&H0000FF00', '&H00FF0000', '&H0000FFFF'].includes(editingStyle.primaryColour) ? editingStyle.primaryColour : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            setEditingStyle({...editingStyle, primaryColour: e.target.value});
                          }
                        }}
                        style={{ flex: 1 }}
                      >
                        <option value="&H00FFFFFF">{t('subtitleConvert.white') || '白色'}</option>
                        <option value="&H00000000">{t('subtitleConvert.black') || '黑色'}</option>
                        <option value="&H000000FF">{t('subtitleConvert.red') || '红色'}</option>
                        <option value="&H0000FF00">{t('subtitleConvert.green') || '绿色'}</option>
                        <option value="&H00FF0000">{t('subtitleConvert.blue') || '蓝色'}</option>
                        <option value="&H0000FFFF">{t('subtitleConvert.yellow') || '黄色'}</option>
                        <option value="custom">{t('subtitleConvert.customColor') || '自定义'}</option>
                      </select>
                      <input
                        type="color"
                        value={assColorToCss(editingStyle.primaryColour)}
                        onChange={(e) => {
                          const newColor = cssColorToAss(e.target.value);
                          console.log('文字颜色变更:', e.target.value, '→', newColor);
                          setEditingStyle({...editingStyle, primaryColour: newColor});
                        }}
                        onInput={(e) => {
                          // 实时响应颜色变化 ✅
                          const target = e.target as HTMLInputElement;
                          const newColor = cssColorToAss(target.value);
                          setEditingStyle({...editingStyle, primaryColour: newColor});
                        }}
                        style={{ width: '40px', height: '32px', border: '1px solid var(--vt-color-border)', borderRadius: '4px', cursor: 'pointer' }}
                        title={t('subtitleConvert.pickColor') || '选择颜色'}
                      />
                    </div>
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.textColorHint') || '字幕主色（可点击色块自定义）'}
                    </small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.outlineColor') || '描边颜色'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className={selectStyles.select}
                        value={editingStyle.outline === 0 ? 'none' : ['&H00000000', '&H00FFFFFF', '&H00404040', '&H00808080', '&H000000FF', '&H0000FF00', '&H00FF0000'].includes(editingStyle.outlineColour) ? editingStyle.outlineColour : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'none') {
                            setEditingStyle({...editingStyle, outline: 0}); // 无描边：设置宽度为0 ✅
                          } else if (e.target.value !== 'custom') {
                            setEditingStyle({
                              ...editingStyle, 
                              outlineColour: e.target.value,
                              outline: editingStyle.outline === 0 ? 1 : editingStyle.outline // 如果之前是0，恢复为1 ✅
                            });
                          }
                        }}
                        style={{ flex: 1 }}
                      >
                        <option value="none">{t('subtitleConvert.noOutline') || '无描边'}</option>
                        <option value="&H00000000">{t('subtitleConvert.black') || '黑色'}</option>
                        <option value="&H00FFFFFF">{t('subtitleConvert.white') || '白色'}</option>
                        <option value="&H00404040">{t('subtitleConvert.darkGray') || '深灰'}</option>
                        <option value="&H00808080">{t('subtitleConvert.gray') || '灰色'}</option>
                        <option value="&H000000FF">{t('subtitleConvert.red') || '红色'}</option>
                        <option value="&H0000FF00">{t('subtitleConvert.green') || '绿色'}</option>
                        <option value="&H00FF0000">{t('subtitleConvert.blue') || '蓝色'}</option>
                        <option value="custom">{t('subtitleConvert.customColor') || '自定义'}</option>
                      </select>
                      <input
                        type="color"
                        value={assColorToCss(editingStyle.outlineColour)}
                        onChange={(e) => {
                          const newColor = cssColorToAss(e.target.value);
                          console.log('描边颜色变更:', e.target.value, '→', newColor);
                          setEditingStyle({
                            ...editingStyle, 
                            outlineColour: newColor,
                            outline: editingStyle.outline === 0 ? 1 : editingStyle.outline
                          });
                        }}
                        onInput={(e) => {
                          // 实时响应颜色变化 ✅
                          const target = e.target as HTMLInputElement;
                          const newColor = cssColorToAss(target.value);
                          setEditingStyle({
                            ...editingStyle, 
                            outlineColour: newColor,
                            outline: editingStyle.outline === 0 ? 1 : editingStyle.outline
                          });
                        }}
                        style={{ width: '40px', height: '32px', border: '1px solid var(--vt-color-border)', borderRadius: '4px', cursor: 'pointer' }}
                        title={t('subtitleConvert.pickColor') || '选择颜色'}
                        disabled={editingStyle.outline === 0}
                      />
                    </div>
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.outlineColorHint') || '描边边框色（可点击色块自定义）'}
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

              {/* 阴影设置 ✅ */}
              <Row>
                <Col md={4}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.shadowColor') || '阴影颜色'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className={selectStyles.select}
                        value={editingStyle.shadow === 0 ? 'none' : ['&H00000000', '&H00404040', '&H00808080', '&H00FFFFFF'].includes(editingStyle.backColour) ? editingStyle.backColour : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'none') {
                            setEditingStyle({...editingStyle, shadow: 0}); // 无阴影：设置距离为0 ✅
                          } else if (e.target.value !== 'custom') {
                            setEditingStyle({
                              ...editingStyle, 
                              backColour: e.target.value,
                              shadow: editingStyle.shadow === 0 ? 2 : editingStyle.shadow // 如果之前是0，恢复为2 ✅
                            });
                          }
                        }}
                        style={{ flex: 1 }}
                      >
                        <option value="none">{t('subtitleConvert.noShadow') || '无阴影'}</option>
                        <option value="&H00000000">{t('subtitleConvert.black') || '黑色'}</option>
                        <option value="&H00404040">{t('subtitleConvert.darkGray') || '深灰'}</option>
                        <option value="&H00808080">{t('subtitleConvert.gray') || '灰色'}</option>
                        <option value="&H00FFFFFF">{t('subtitleConvert.white') || '白色'}</option>
                        <option value="custom">{t('subtitleConvert.customColor') || '自定义'}</option>
                      </select>
                      <input
                        type="color"
                        value={assColorToCss(editingStyle.backColour)}
                        onChange={(e) => {
                          const newColor = cssColorToAss(e.target.value);
                          console.log('阴影颜色变更:', e.target.value, '→', newColor);
                          setEditingStyle({
                            ...editingStyle, 
                            backColour: newColor,
                            shadow: editingStyle.shadow === 0 ? 2 : editingStyle.shadow
                          });
                        }}
                        onInput={(e) => {
                          // 实时响应颜色变化 ✅
                          const target = e.target as HTMLInputElement;
                          const newColor = cssColorToAss(target.value);
                          setEditingStyle({
                            ...editingStyle, 
                            backColour: newColor,
                            shadow: editingStyle.shadow === 0 ? 2 : editingStyle.shadow
                          });
                        }}
                        style={{ width: '40px', height: '32px', border: '1px solid var(--vt-color-border)', borderRadius: '4px', cursor: 'pointer' }}
                        title={t('subtitleConvert.pickColor') || '选择颜色'}
                        disabled={editingStyle.shadow === 0}
                      />
                    </div>
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.shadowColorHint') || '阴影颜色（可点击色块自定义）'}
                    </small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>
                      {t('subtitleConvert.shadowDistance') || '阴影距离'}
                    </label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editingStyle.shadow}
                      onChange={(e) => setEditingStyle({...editingStyle, shadow: parseFloat(e.target.value) || 0})}
                      min={0}
                      max={10}
                      step={0.5}
                    />
                    <small className={styles.fieldHint}>
                      {t('subtitleConvert.shadowDistanceHint') || '推荐: 1-3'}
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
                      className={selectStyles.select}
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
                    // flex-direction: column 时，justifyContent 控制垂直，alignItems 控制水平 ✅
                    justifyContent: editingStyle.alignment <= 3 ? 'flex-end' : editingStyle.alignment <= 6 ? 'center' : 'flex-start', // 垂直对齐
                    alignItems: editingStyle.alignment % 3 === 1 ? 'flex-start' : editingStyle.alignment % 3 === 2 ? 'center' : 'flex-end' // 水平对齐
                  }}
                >
                  <div style={{
                    fontFamily: editingStyle.fontname,
                    fontSize: `${editingStyle.fontsize * 0.6}px`, // 缩小字号以适应预览框 ✅
                    color: assColorToCss(editingStyle.primaryColour),
                    textShadow: getCombinedTextShadow(
                      editingStyle.outline * 0.8, 
                      assColorToCss(editingStyle.outlineColour), 
                      editingStyle.shadow * 0.8, 
                      assColorToCss(editingStyle.backColour)
                    ), // 合并描边和阴影效果 ✅
                    fontWeight: editingStyle.bold ? 'bold' : 'normal',
                    fontStyle: editingStyle.italic ? 'italic' : 'normal',
                    textDecoration: editingStyle.underline ? 'underline' : 'none',
                    padding: `${editingStyle.marginV * 0.3}px ${editingStyle.marginL * 0.5}px`, // 调整padding比例 ✅
                    textAlign: editingStyle.alignment % 3 === 1 ? 'left' : editingStyle.alignment % 3 === 2 ? 'center' : 'right', // 文本对齐 ✅
                    lineHeight: 1.5
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
            {t('subtitleConvert.saveAsPreset') || '保存为预设'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* 错误提示弹窗 */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className={styles.modalTitle}>
            ⚠️ {t('common.error') || '错误'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
            {errorMessage}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button 
            className={buttonStyles.buttonPrimary} 
            onClick={() => setShowErrorModal(false)}
          >
            {t('common.confirm') || '确定'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SubtitleConvertTab;

