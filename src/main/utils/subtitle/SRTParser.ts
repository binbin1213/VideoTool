import type { SRTSubtitle, ValidationResult } from '../../../shared/types/subtitle.types';

/**
 * SRT字幕解析器
 * 用于解析SRT格式的字幕文件
 */
export class SRTParser {
  /**
   * 解析SRT内容
   * @param content SRT文件内容
   * @returns 解析后的字幕数组
   */
  parse(content: string): SRTSubtitle[] {
    const subtitles: SRTSubtitle[] = [];
    
    // 标准化换行符
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 按空行分割字幕块
    const blocks = content.split(/\n\n+/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      
      if (lines.length < 3) continue;
      
      try {
        // 第一行：序号
        const index = parseInt(lines[0], 10);
        
        // 第二行：时间轴
        const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
        
        if (!timeMatch) continue;
        
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        
        // 第三行及之后：字幕文本
        const text = lines.slice(2).join('\n');
        
        subtitles.push({
          index,
          startTime,
          endTime,
          text,
          originalText: text,
        });
      } catch (error) {
        console.error('Error parsing subtitle block:', error);
      }
    }
    
    return subtitles;
  }

  /**
   * 验证SRT内容
   * @param content SRT文件内容
   * @returns 验证结果
   */
  validate(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!content || content.trim().length === 0) {
      errors.push('文件内容为空');
      return { valid: false, errors, warnings };
    }
    
    // 检查基本格式
    const blocks = content.split(/\n\n+/);
    
    if (blocks.length === 0) {
      errors.push('未找到字幕块');
      return { valid: false, errors, warnings };
    }
    
    // 检查每个字幕块
    for (let i = 0; i < blocks.length; i++) {
      const lines = blocks[i].trim().split('\n');
      
      if (lines.length < 3) {
        warnings.push(`字幕块 ${i + 1} 格式不完整`);
        continue;
      }
      
      // 检查序号
      const index = parseInt(lines[0], 10);
      if (isNaN(index)) {
        warnings.push(`字幕块 ${i + 1} 序号无效`);
      }
      
      // 检查时间轴
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) {
        warnings.push(`字幕块 ${i + 1} 时间轴格式无效`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 检测文件编码（简化版）
   * @param buffer 文件Buffer
   * @returns 编码类型
   */
  detectEncoding(buffer: Buffer): string {
    // 检查 BOM
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return 'utf-8';
    }
    
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return 'utf-16le';
    }
    
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return 'utf-16be';
    }
    
    // 默认返回 utf-8
    return 'utf-8';
  }
}

