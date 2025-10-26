/**
 * 正则替换规则
 */
export interface RegexRule {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  description: string;
  enabled: boolean;
  order: number;
}

/**
 * SRT字幕条目
 */
export interface SRTSubtitle {
  index: number;
  startTime: string;  // "00:00:00,000"
  endTime: string;    // "00:00:06,800"
  text: string;
  originalText?: string;
}

/**
 * ASS样式定义
 */
export interface ASSStyle {
  name: string;
  fontname: string;
  fontsize: number;
  primaryColour: string;
  secondaryColour: string;
  outlineColour: string;
  backColour: string;
  bold: number;
  italic: number;
  underline: number;
  strikeOut: number;
  scaleX: number;
  scaleY: number;
  spacing: number;
  angle: number;
  borderStyle: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
  marginV: number;
  encoding: number;
  lineSpacing: number;
}

/**
 * ASS配置选项
 */
export interface ASSOptions {
  resolution: { width: number; height: number };
  scriptType: string;
  wrapStyle: number;
  scaledBorderAndShadow: boolean;
}

/**
 * 转换选项
 */
export interface ConvertOptions {
  encoding: string;
  regexRules: RegexRule[];
  selectedStyle: string;
  styles: ASSStyle[];
  assOptions: ASSOptions;
  applyRegexRules: boolean;
  timeOffset?: number;
}

/**
 * 转换结果
 */
export interface ConvertResult {
  success: boolean;
  outputPath?: string;
  errors?: string[];
  warnings?: string[];
  stats: {
    totalSubtitles: number;
    processedSubtitles: number;
    duration: number;
  };
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

