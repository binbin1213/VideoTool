import * as fs from 'fs-extra';
import * as path from 'path';
import { RegexProcessor } from './RegexProcessor';
import { SRTParser } from './SRTParser';
import { ASSGenerator } from './ASSGenerator';
import type {
  ConvertOptions,
  ConvertResult,
  ValidationResult,
  RegexRule,
  ASSStyle,
} from '../../../shared/types/subtitle.types';

/**
 * 字幕转换器主类
 * 整合SRT解析、正则处理和ASS生成功能
 */
export class SubtitleConverter {
  /**
   * SRT转ASS转换
   * @param srtFilePath SRT文件路径
   * @param assFilePath ASS文件路径
   * @param options 转换选项
   * @returns 转换结果
   */
  async convertSrtToAss(
    srtFilePath: string,
    assFilePath: string,
    options: ConvertOptions
  ): Promise<ConvertResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. 读取SRT文件
      if (!await fs.pathExists(srtFilePath)) {
        return {
          success: false,
          errors: ['输入文件不存在'],
          warnings,
          stats: { totalSubtitles: 0, processedSubtitles: 0, duration: 0 },
        };
      }

      const srtContent = await fs.readFile(srtFilePath, { encoding: options.encoding as BufferEncoding });

      // 2. 解析SRT
      const parser = new SRTParser();
      const validation = parser.validate(srtContent.toString());

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
          stats: { totalSubtitles: 0, processedSubtitles: 0, duration: 0 },
        };
      }

      warnings.push(...validation.warnings);

      let subtitles = parser.parse(srtContent.toString());
      const totalSubtitles = subtitles.length;

      // 3. 应用正则替换
      if (options.applyRegexRules && options.regexRules.length > 0) {
        const processor = new RegexProcessor(options.regexRules);
        subtitles = subtitles.map((sub) => ({
          ...sub,
          text: processor.applyRules(sub.text),
        }));
      }

      // 4. 应用时间偏移
      if (options.timeOffset && options.timeOffset !== 0) {
        subtitles = this.applyTimeOffset(subtitles, options.timeOffset);
      }

      // 5. 生成ASS
      const generator = new ASSGenerator(options.styles, options.assOptions);
      const assContent = generator.generate(subtitles, options.selectedStyle);

      // 6. 写入文件
      await fs.ensureDir(path.dirname(assFilePath));
      await fs.writeFile(assFilePath, assContent, 'utf-8');

      const duration = Date.now() - startTime;

      return {
        success: true,
        outputPath: assFilePath,
        errors,
        warnings,
        stats: {
          totalSubtitles,
          processedSubtitles: subtitles.length,
          duration,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [`转换失败: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        stats: { totalSubtitles: 0, processedSubtitles: 0, duration: Date.now() - startTime },
      };
    }
  }

  /**
   * 批量转换
   * @param files 文件列表
   * @param options 转换选项
   * @param onProgress 进度回调
   * @returns 转换结果数组
   */
  async batchConvert(
    files: Array<{ input: string; output: string }>,
    options: ConvertOptions,
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<ConvertResult[]> {
    const results: ConvertResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = ((i + 1) / files.length) * 100;

      if (onProgress) {
        onProgress(progress, file.input);
      }

      const result = await this.convertSrtToAss(file.input, file.output, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 预览转换结果
   * @param srtContent SRT内容
   * @param options 转换选项
   * @returns ASS内容预览
   */
  async previewConversion(
    srtContent: string,
    options: ConvertOptions
  ): Promise<string> {
    try {
      const parser = new SRTParser();
      let subtitles = parser.parse(srtContent);

      // 应用正则替换
      if (options.applyRegexRules && options.regexRules.length > 0) {
        const processor = new RegexProcessor(options.regexRules);
        subtitles = subtitles.map((sub) => ({
          ...sub,
          text: processor.applyRules(sub.text),
        }));
      }

      // 生成ASS
      const generator = new ASSGenerator(options.styles, options.assOptions);
      return generator.generate(subtitles, options.selectedStyle);
    } catch (error) {
      throw new Error(`预览失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证SRT文件
   * @param filePath 文件路径
   * @returns 验证结果
   */
  async validateSRT(filePath: string): Promise<ValidationResult> {
    try {
      if (!await fs.pathExists(filePath)) {
        return {
          valid: false,
          errors: ['文件不存在'],
          warnings: [],
        };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const parser = new SRTParser();
      return parser.validate(content);
    } catch (error) {
      return {
        valid: false,
        errors: [`验证失败: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
      };
    }
  }

  /**
   * 获取默认正则规则
   * @returns 默认正则规则数组
   */
  getDefaultRegexRules(): RegexRule[] {
    try {
      const rulesPath = path.join(__dirname, '../../../shared/presets/subtitle-convert/regex-rules.json');
      const rulesData = fs.readFileSync(rulesPath, 'utf-8');
      const data = JSON.parse(rulesData);
      return data.rules || [];
    } catch (error) {
      console.error('Error loading default regex rules:', error);
      return [];
    }
  }

  /**
   * 获取默认样式
   * @returns 默认样式数组
   */
  getDefaultStyles(): ASSStyle[] {
    try {
      const stylesPath = path.join(__dirname, '../../../shared/presets/subtitle-convert/ass-styles.txt');
      const generator = new ASSGenerator([], {
        resolution: { width: 384, height: 288 },
        scriptType: 'v4.00+',
        wrapStyle: 0,
        scaledBorderAndShadow: false,
      });
      return generator.parseStylesFromFile(stylesPath);
    } catch (error) {
      console.error('Error loading default styles:', error);
      return [];
    }
  }

  /**
   * 应用时间偏移
   */
  private applyTimeOffset(subtitles: any[], offset: number): any[] {
    return subtitles.map((sub) => ({
      ...sub,
      startTime: this.adjustTime(sub.startTime, offset),
      endTime: this.adjustTime(sub.endTime, offset),
    }));
  }

  /**
   * 调整时间
   */
  private adjustTime(timeStr: string, offsetMs: number): string {
    // 解析时间
    const parts = timeStr.split(/[:,]/);
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    const milliseconds = parseInt(parts[3], 10);

    // 转换为总毫秒数
    let totalMs = hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    totalMs += offsetMs;

    // 确保不为负
    if (totalMs < 0) totalMs = 0;

    // 转换回时间格式
    const newHours = Math.floor(totalMs / 3600000);
    const newMinutes = Math.floor((totalMs % 3600000) / 60000);
    const newSeconds = Math.floor((totalMs % 60000) / 1000);
    const newMs = totalMs % 1000;

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')},${String(newMs).padStart(3, '0')}`;
  }
}

