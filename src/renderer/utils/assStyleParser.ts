/**
 * ASS 字幕样式解析器
 * 用于解析 ASS 模板文件中的样式定义
 */

import type { ASSStyleParams } from './subtitleConverter';

/**
 * 解析 ASS 样式行
 * 格式：Style: Name, Fontname, Fontsize, ...
 */
function parseStyleLine(line: string): ASSStyleParams {
  // 移除 "Style: " 前缀
  const content = line.substring(7).trim();
  
  // 按逗号分割（ASS 格式使用逗号分隔）
  const parts = content.split(',').map(p => p.trim());
  
  return {
    name: parts[0],
    fontname: parts[1],
    fontsize: parseInt(parts[2]),
    primaryColour: parts[3],
    secondaryColour: parts[4],
    outlineColour: parts[5],
    backColour: parts[6],
    bold: parseInt(parts[7]) as 0 | 1,
    italic: parseInt(parts[8]) as 0 | 1,
    underline: parseInt(parts[9]) as 0 | 1,
    strikeOut: parseInt(parts[10]) as 0 | 1,
    scaleX: parseInt(parts[11]),
    scaleY: parseInt(parts[12]),
    spacing: parseFloat(parts[13]),
    angle: parseFloat(parts[14]),
    borderStyle: parseInt(parts[15]) as 1 | 3,
    outline: parseFloat(parts[16]),
    shadow: parseFloat(parts[17]),
    alignment: parseInt(parts[18]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    marginL: parseInt(parts[19]),
    marginR: parseInt(parts[20]),
    marginV: parseInt(parts[21]),
    encoding: parseInt(parts[22]),
    lineSpacing: parseFloat(parts[23] || '0')
  };
}

/**
 * 解析 ASS 模板文件内容
 * @param content ASS 文件内容
 * @returns 样式名称到样式参数的映射
 */
export function parseASSTemplate(content: string): Record<string, ASSStyleParams> {
  const styles: Record<string, ASSStyleParams> = {};
  const lines = content.split('\n');
  
  let inStylesSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检测 [V4+ Styles] 段落
    if (trimmedLine === '[V4+ Styles]') {
      inStylesSection = true;
      continue;
    }
    
    // 遇到新的段落，退出样式段落
    if (trimmedLine.startsWith('[') && trimmedLine !== '[V4+ Styles]') {
      inStylesSection = false;
      continue;
    }
    
    // 解析样式行
    if (inStylesSection && trimmedLine.startsWith('Style:')) {
      try {
        const style = parseStyleLine(trimmedLine);
        styles[style.name] = style;
      } catch (error) {
        console.warn(`Failed to parse style line: ${trimmedLine}`, error);
      }
    }
  }
  
  return styles;
}

/**
 * 从 ASS 模板提取分辨率信息
 */
export function parseASSResolution(content: string): { width: number; height: number } {
  const lines = content.split('\n');
  let width = 1920;  // 默认 1080p
  let height = 1080;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('PlayResX:')) {
      width = parseInt(trimmed.split(':')[1].trim());
    } else if (trimmed.startsWith('PlayResY:')) {
      height = parseInt(trimmed.split(':')[1].trim());
    }
  }
  
  return { width, height };
}

