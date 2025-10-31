/**
 * 视频转码相关类型定义
 */

/**
 * 视频格式类型
 */
export type VideoFormat = 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm' | 'flv';

/**
 * 视频编码类型
 */
export type VideoCodec = 'libx264' | 'libx265' | 'vp9' | 'av1' | 'copy';

/**
 * 音频编码类型
 */
export type AudioCodec = 'aac' | 'mp3' | 'opus' | 'flac' | 'copy';

/**
 * 编码预设（速度）
 */
export type EncodePreset =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow';

/**
 * 硬件加速类型
 */
export type HardwareAccel = 'none' | 'videotoolbox' | 'nvenc' | 'qsv' | 'auto' | 'vaapi';

/**
 * 质量控制模式
 */
export type QualityMode = 'crf' | 'bitrate';

/**
 * 分辨率配置
 */
export interface Resolution {
  width: number;
  height: number;
}

/**
 * 时间裁剪配置
 */
export interface TimeTrim {
  start: string; // "00:00:10"
  end: string; // "00:05:30"
}

/**
 * 画面裁剪配置
 */
export interface Crop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * 滤镜配置
 */
export interface Filters {
  // 反交错
  deinterlace?: boolean;
  deinterlaceMode?: 'yadif' | 'bwdif' | 'none';
  
  // 降噪
  denoise?: boolean;
  denoiseMode?: 'nlmeans' | 'hqdn3d' | 'none';
  denoiseStrength?: 'light' | 'medium' | 'strong';
  
  // 锐化
  sharpen?: boolean;
  sharpenMode?: 'unsharp' | 'lapsharp' | 'none';
  sharpenStrength?: number; // 0-2
  
  // 去块效应
  deblock?: boolean;
  deblockStrength?: number; // 0-10
  
  // 色度平滑
  chromaSmooth?: boolean;
  chromaSmoothStrength?: 'light' | 'medium' | 'strong';
  
  // 色彩空间
  colorspace?: 'bt709' | 'bt2020' | 'bt601' | 'auto';
}

/**
 * 音频轨道配置
 */
export interface AudioTrack {
  index: number;
  codec: string;
  language?: string;
  channels?: number;
  sampleRate?: number;
  // 输出配置
  outputCodec?: AudioCodec;
  outputBitrate?: string;
  mixdown?: 'mono' | 'stereo' | 'dpl2' | '5.1' | '6.1' | '7.1';
  gain?: number; // 增益（dB）
  drc?: number; // 动态范围压缩 0-4
}

/**
 * 字幕轨道配置
 */
export interface SubtitleTrack {
  index: number;
  codec: string;
  language?: string;
  title?: string;
  forced?: boolean;
  default?: boolean;
  burn?: boolean; // 烧录到视频
}

/**
 * 视频转码配置
 */
export interface TranscodeConfig {
  // ===== 输入输出 =====
  inputPath: string;
  outputPath: string;

  // ===== 格式和编码 =====
  format: VideoFormat;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;

  // ===== 视频参数 =====
  resolution?: Resolution | 'original';
  framerate?: number | 'original';
  framerateMode?: 'cfr' | 'vfr' | 'pfr'; // 恒定/可变/峰值帧率

  // ===== 尺寸调整 =====
  rotate?: 0 | 90 | 180 | 270; // 旋转角度
  flip?: 'horizontal' | 'vertical' | 'none'; // 翻转
  crop?: Crop; // 裁剪
  autoCrop?: boolean; // 自动裁剪黑边
  scaleMode?: 'fit' | 'fill' | 'stretch'; // 缩放模式
  keepAspectRatio?: boolean; // 保持宽高比

  // ===== 质量控制 =====
  qualityMode: QualityMode;
  crf?: number; // 0-51, 默认 23 (越小质量越好)
  videoBitrate?: string; // 如 "5M"
  audioBitrate?: string; // 如 "192k"
  preset: EncodePreset;

  // ===== 编码器设置 =====
  tune?: string; // 编码器调优 (film, animation, grain, stillimage, none)
  profile?: string; // 编码器 Profile (baseline, main, high, auto)
  level?: string; // 编码器 Level (3.0, 3.1, 4.0, 4.1, 5.0, 5.1, auto)
  pixelFormat?: string; // 像素格式

  // ===== 硬件加速 =====
  useHardwareAccel: boolean;
  hwaccel: HardwareAccel;

  // ===== 滤镜 =====
  filters?: Filters;

  // ===== 音频轨道 =====
  audioTracks?: AudioTrack[];
  
  // ===== 字幕轨道 =====
  subtitleTracks?: SubtitleTrack[];

  // ===== 高级选项 =====
  trim?: TimeTrim;
  volume?: number; // 0.5 = 50%, 2.0 = 200%
  twoPass?: boolean;
}

/**
 * 视频文件信息
 */
export interface VideoInfo {
  // ===== 基础信息（UI 显示） =====
  duration: number; // 时长（秒）
  width: number; // 宽度
  height: number; // 高度
  fps: number; // 帧率
  videoCodec: string; // 视频编码
  audioCodec: string; // 音频编码
  bitrate: number; // 比特率（bps）
  audioBitrate?: number; // 音频比特率（bps）
  size: number; // 文件大小（bytes）
  formatName: string; // 格式名称
  thumbnail?: string; // 视频缩略图（base64 编码）

  // ===== 视频详细参数（AI 分析用） =====
  pixelFormat?: string; // 像素格式 (yuv420p, yuv420p10le, etc.)
  colorSpace?: string; // 色彩空间 (bt709, bt2020nc, etc.)
  colorRange?: string; // 色彩范围 (tv, pc)
  colorPrimaries?: string; // 色彩原色 (bt709, bt2020, etc.)
  colorTransfer?: string; // 传输特性 (bt709, smpte2084, etc.)
  bitDepth?: number; // 位深度 (8, 10, 12)
  profile?: string; // 编码 Profile (High, Main, Baseline)
  level?: number; // 编码 Level (4.0, 4.1, 5.0)
  
  // ===== 音频详细参数（AI 分析用） =====
  sampleRate?: number; // 采样率 (44100, 48000, 96000, etc.)
  channels?: number; // 声道数 (1, 2, 6, 8, etc.)
  channelLayout?: string; // 声道布局 (stereo, 5.1, 7.1, etc.)
  audioBitDepth?: number; // 音频位深度 (16, 24, 32)
  
  // ===== 轨道信息 =====
  audioTracks?: AudioTrack[]; // 音频轨道列表
  subtitleTracks?: SubtitleTrack[]; // 字幕轨道列表
}

/**
 * 转码进度信息
 */
export interface TranscodeProgress {
  percent: number; // 完成百分比 (0-100)
  currentTime: number; // 当前处理时间（秒）
  speed: number; // 处理速度（倍数，如 2.3x）
  eta: number; // 预计剩余时间（秒）
  fps: number; // 当前处理帧率
}

/**
 * 转码结果
 */
export interface TranscodeResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration?: number; // 转码耗时（秒）
}

/**
 * 预设模板
 */
export interface TranscodePreset {
  name: string;
  description: string;
  format: VideoFormat;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  qualityMode: QualityMode;
  crf?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  preset: EncodePreset;
  resolution?: Resolution | 'original';
}

/**
 * 常用分辨率预设
 */
export const COMMON_RESOLUTIONS = {
  '4K': { width: 3840, height: 2160 },
  '1440p': { width: 2560, height: 1440 },
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
  '360p': { width: 640, height: 360 },
} as const;

/**
 * 常用帧率预设
 */
export const COMMON_FRAMERATES = [24, 25, 30, 50, 60] as const;

/**
 * AI 平台类型
 */
export type AIPlatform = 'deepseek' | 'openai';

/**
 * AI 配置
 */
export interface AIConfig {
  enabled: boolean;
  platform: AIPlatform;
  apiKey: string;
  model?: string; // 可选，使用默认模型
}

/**
 * AI 模型配置
 */
export const AI_MODELS = {
  deepseek: {
    default: 'deepseek-chat',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
  },
  openai: {
    default: 'gpt-4o-mini', // 使用更便宜的版本
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
} as const;

/**
 * 转码预设模板
 */
export const TRANSCODE_PRESETS: Record<string, TranscodePreset> = {
  webOptimized: {
    name: 'Web 优化',
    description: '适合网页和流媒体播放',
    format: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 23,
    preset: 'medium',
    audioBitrate: '128k',
    resolution: COMMON_RESOLUTIONS['1080p'],
  },
  mobile: {
    name: '移动设备',
    description: '适合手机平板观看，文件较小',
    format: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 26,
    preset: 'fast',
    audioBitrate: '96k',
    resolution: COMMON_RESOLUTIONS['720p'],
  },
  highQuality: {
    name: '高质量',
    description: '最佳画质，适合长期保存',
    format: 'mkv',
    videoCodec: 'libx265',
    audioCodec: 'flac',
    qualityMode: 'crf',
    crf: 18,
    preset: 'slow',
    resolution: 'original',
  },
  smallFile: {
    name: '小文件',
    description: '极度压缩，节省存储空间',
    format: 'mp4',
    videoCodec: 'libx265',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 28,
    preset: 'medium',
    audioBitrate: '64k',
    resolution: COMMON_RESOLUTIONS['720p'],
  },
  fast: {
    name: '快速转码',
    description: '转码速度最快，质量一般',
    format: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 23,
    preset: 'veryfast',
    resolution: 'original',
  },
};

