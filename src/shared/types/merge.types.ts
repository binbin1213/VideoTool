/**
 * 音视频合并相关的类型定义
 */

export interface MergeOptions {
  videoPath: string;
  audioPath: string;
  outputPath: string;
  videoCodec?: 'copy' | 'libx264' | 'libx265';
  audioCodec?: 'copy' | 'aac' | 'mp3';
  audioBitrate?: string;
  useHardwareAccel?: boolean; // 是否使用硬件加速
  hwaccel?: 'videotoolbox' | 'nvenc' | 'qsv' | 'none'; // 硬件加速类型
}

export interface MergeProgress {
  percent: number;
  timemark?: string;
  currentFps?: number;
  targetSize?: number;
}

export interface MergeResult {
  success: boolean;
  message: string;
  outputPath?: string;
  error?: string;
}

export interface VideoInfo {
  // ===== 基础信息 =====
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  bitrate: number;
  
  // ===== 扩展字段（用于转码功能） =====
  videoCodec?: string;
  audioCodec?: string;
  audioBitrate?: number;
  size?: number;
  formatName?: string;
  thumbnail?: string; // 视频缩略图（base64 编码）

  // ===== 视频详细参数（AI 分析用） =====
  pixelFormat?: string;
  colorSpace?: string;
  colorRange?: string;
  colorPrimaries?: string;
  colorTransfer?: string;
  bitDepth?: number;
  profile?: string;
  level?: number;
  
  // ===== 音频详细参数（AI 分析用） =====
  sampleRate?: number;
  channels?: number;
  channelLayout?: string;
  audioBitDepth?: number;

  // ===== 轨道信息 =====
  audioTracks?: Array<{
    index: number;
    codec: string;
    language?: string;
    channels?: number;
    sampleRate?: number;
  }>;
  subtitleTracks?: Array<{
    index: number;
    codec: string;
    language?: string;
    title?: string;
    forced?: boolean;
    default?: boolean;
  }>;
}

export interface AudioInfo {
  duration: number;
  codec: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

