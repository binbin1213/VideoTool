/**
 * 字幕烧录相关的类型定义
 */

export interface SubtitleBurnOptions {
  videoPath: string;
  subtitlePath: string;
  outputPath: string;
  videoCodec?: 'libx264' | 'libx265' | 'copy';
  audioCodec?: 'copy' | 'aac';
  crf?: number; // 质量控制 (18-28, 越小质量越好)
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  // 画面调优
  tune?: 'film' | 'grain' | 'none';
  useHardwareAccel?: boolean; // 是否使用硬件加速
  hwaccel?: 'videotoolbox' | 'nvenc' | 'qsv' | 'none'; // 硬件加速类型
  // 字幕类型
  subtitleType?: 'hard' | 'soft'; // 硬字幕（烧录）或软字幕（封装）
}

export interface SubtitleBurnProgress {
  percent: number;
  timemark?: string;
  currentFps?: number;
  targetSize?: number;
}

export interface SubtitleBurnResult {
  success: boolean;
  message: string;
  outputPath?: string;
  error?: string;
}

export interface SubtitleFileInfo {
  path: string;
  format: 'srt' | 'ass' | 'ssa' | 'vtt' | 'unknown';
  size: number;
}

