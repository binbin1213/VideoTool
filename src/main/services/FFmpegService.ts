import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs-extra';
import log from 'electron-log';
import type { MergeOptions, MergeProgress, VideoInfo, AudioInfo } from '../../shared/types/merge.types';
import type { SubtitleBurnOptions, SubtitleBurnProgress } from '../../shared/types/subtitle-burn.types';
import { FFmpegManager } from './FFmpegManager';
import { findBundledFFmpeg } from './FFmpegPathResolver';

// 设置 FFmpeg 路径
export function initializeFFmpegPath(): void {
  // 优先级 1: 用户自定义路径（通过下载管理器设置）
  const customPath = FFmpegManager.getFFmpegPath();
  const customProbePath = FFmpegManager.getFFprobePath();
  
  if (customPath) {
    log.info('✅ 使用自定义 FFmpeg 路径:', customPath);
    ffmpeg.setFfmpegPath(customPath);
    
    if (customProbePath) {
      ffmpeg.setFfprobePath(customProbePath);
    }
    return;
  }
  
  // 优先级 2: 打包的 FFmpeg
  const bundledFFmpeg = findBundledFFmpeg();
  if (bundledFFmpeg) {
    log.info('✅ 使用打包的 FFmpeg:', bundledFFmpeg.ffmpegPath);
    ffmpeg.setFfmpegPath(bundledFFmpeg.ffmpegPath);
    ffmpeg.setFfprobePath(bundledFFmpeg.ffprobePath);
    return;
  }
  
  // 优先级 3: 回退到 @ffmpeg-installer/ffmpeg
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    log.info('⚠️ 使用 ffmpeg-installer 路径:', ffmpegInstaller.path);
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  } catch (error) {
    log.error('❌ 加载 ffmpeg-installer 失败:', error);
    log.warn('⚠️ FFmpeg 初始化失败，请手动安装 FFmpeg');
  }
}

// 注意：不要在这里自动初始化！
// initializeFFmpegPath() 必须在 app.whenReady() 之后调用
// 在 main/index.ts 中会正确调用

export class FFmpegService {
  /**
   * 合并音视频文件
   */
  static async mergeAudioVideo(
    options: MergeOptions,
    onProgress?: (progress: MergeProgress) => void
  ): Promise<{ success: boolean; message: string; outputPath?: string }> {
    const { 
      videoPath, 
      audioPath, 
      outputPath, 
      videoCodec = 'copy', 
      audioCodec = 'aac', 
      audioBitrate = '192k',
      useHardwareAccel = false,
      hwaccel = 'none',
    } = options;

    log.info('开始音视频合并', { videoPath, audioPath, outputPath, useHardwareAccel, hwaccel });

    return new Promise((resolve, reject) => {
      try {
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        fs.ensureDirSync(outputDir);

        let totalDuration = 0;

        const command = ffmpeg()
          .input(videoPath)
          .input(audioPath);

        // 硬件加速配置（仅在需要重新编码视频时使用）
        if (videoCodec !== 'copy' && useHardwareAccel && hwaccel !== 'none') {
          if (hwaccel === 'videotoolbox') {
            log.info('启用 VideoToolbox 硬件加速');
            command.inputOptions(['-hwaccel videotoolbox']);
            command.videoCodec('h264_videotoolbox');
            // VideoToolbox 支持 Intel 和 Apple Silicon
            command.outputOptions([
              '-b:v 5M',           // 比特率（VideoToolbox 不支持 -q:v）
              '-maxrate 6M',       // 最大比特率
              '-bufsize 12M',      // 缓冲区大小
              '-allow_sw 1',       // 允许软件编码回退
              '-realtime 0',       // 非实时编码（更高质量）
              '-pix_fmt nv12',     // Apple Silicon 原生格式
            ]);
          } else if (hwaccel === 'nvenc') {
            log.info('启用 NVENC 硬件加速');
            command.inputOptions(['-hwaccel cuda', '-hwaccel_output_format cuda']);
            command.videoCodec('h264_nvenc');
            // NVENC 默认质量参数
            command.outputOptions([
              '-preset p4',        // p1-p7, p4 平衡速度和质量
              '-tune hq',          // 高质量模式
              '-rc vbr',           // 可变比特率
              '-cq 23',            // 恒定质量 (0-51, 类似 CRF)
              '-b:v 0',            // VBR 模式下设置为 0
              '-pix_fmt nv12',     // NVENC 原生格式
            ]);
          } else if (hwaccel === 'qsv') {
            log.info('启用 QSV 硬件加速');
            command.inputOptions(['-hwaccel qsv', '-hwaccel_output_format qsv']);
            command.videoCodec('h264_qsv');
            // QSV 默认质量参数
            command.outputOptions([
              '-global_quality 23',
              '-look_ahead 1',
              '-pix_fmt nv12',
            ]);
          }
        } else {
          command.videoCodec(videoCodec);
        }

        command.audioCodec(audioCodec);

        // 如果音频编码不是copy，设置比特率
        if (audioCodec !== 'copy') {
          command.audioBitrate(audioBitrate);
        }

        command
          .on('start', (commandLine) => {
            log.info('FFmpeg 命令:', commandLine);
          })
          .on('codecData', (data) => {
            // 获取总时长
            const duration = data.duration || '00:00:00';
            totalDuration = FFmpegService.parseTimemark(duration);
            log.info('视频总时长:', totalDuration, '秒');
          })
          .on('progress', (progress) => {
            if (onProgress) {
              let percent = 0;
              if (totalDuration > 0 && progress.timemark) {
                const currentTime = FFmpegService.parseTimemark(progress.timemark);
                percent = Math.min((currentTime / totalDuration) * 100, 100);
              }

              onProgress({
                percent: Math.round(percent),
                timemark: progress.timemark,
                currentFps: progress.currentFps,
                targetSize: progress.targetSize,
              });
            }
          })
          .on('end', () => {
            log.info('音视频合并完成:', outputPath);
            resolve({
              success: true,
              message: '合并成功',
              outputPath,
            });
          })
          .on('error', (err, _stdout, stderr) => {
            log.error('音视频合并失败:', err.message);
            log.error('FFmpeg stderr:', stderr);
            
            // 从 stderr 中提取关键错误信息
            const errorDetail = FFmpegService.parseFFmpegError(stderr, err.message);
            
            reject({
              success: false,
              message: `合并失败: ${errorDetail}`,
            });
          })
          .save(outputPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        log.error('合并过程异常:', errorMessage);
        log.error('异常详情:', error);
        reject({
          success: false,
          message: `合并异常: ${errorMessage}`,
        });
      }
    });
  }

  /**
   * 获取视频信息
   */
  static async getVideoInfo(videoPath: string): Promise<VideoInfo | null> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          log.error('获取视频信息失败:', err.message);
          resolve(null);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        if (!videoStream) {
          resolve(null);
          return;
        }

        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        // 格式名称优化：根据文件扩展名判断
        let formatName = 'UNKNOWN';
        const ext = videoPath.split('.').pop()?.toLowerCase() || '';
        
        if (ext) {
          // 优先使用文件扩展名
          formatName = ext.toUpperCase();
        } else if (metadata.format.format_name) {
          // 如果没有扩展名，取第一个格式
          formatName = metadata.format.format_name.split(',')[0].toUpperCase();
        }

        // 解析位深度（从像素格式推断）
        const pixelFormat = videoStream.pix_fmt || '';
        let bitDepth = 8; // 默认 8bit
        if (pixelFormat.includes('10le') || pixelFormat.includes('10be') || pixelFormat.includes('p010')) {
          bitDepth = 10;
        } else if (pixelFormat.includes('12le') || pixelFormat.includes('12be')) {
          bitDepth = 12;
        }

        const info: VideoInfo = {
          // ===== 基础信息 =====
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          codec: videoStream.codec_name || 'unknown',
          fps: eval(videoStream.r_frame_rate || '0') || 0,
          bitrate: metadata.format.bit_rate || 0,
          videoCodec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name || 'none',
          audioBitrate: audioStream?.bit_rate ? Number(audioStream.bit_rate) : 0,
          size: metadata.format.size || 0,
          formatName: formatName,

          // ===== 视频详细参数（AI 分析用） =====
          pixelFormat: pixelFormat || undefined,
          colorSpace: videoStream.color_space || undefined,
          colorRange: videoStream.color_range || undefined,
          colorPrimaries: videoStream.color_primaries || undefined,
          colorTransfer: videoStream.color_transfer || undefined,
          bitDepth: bitDepth,
          profile: videoStream.profile ? String(videoStream.profile) : undefined,
          level: videoStream.level ? Number(videoStream.level) / 10 : undefined, // level 通常是 40, 41 等，除以 10 得到 4.0, 4.1

          // ===== 音频详细参数（AI 分析用） =====
          sampleRate: audioStream?.sample_rate ? Number(audioStream.sample_rate) : undefined,
          channels: audioStream?.channels || undefined,
          channelLayout: audioStream?.channel_layout || undefined,
          audioBitDepth: audioStream?.bits_per_sample || undefined,
        };

        log.info('视频信息:', info);
        resolve(info);
      });
    });
  }

  /**
   * 获取音频信息
   */
  static async getAudioInfo(audioPath: string): Promise<AudioInfo | null> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          log.error('获取音频信息失败:', err.message);
          resolve(null);
          return;
        }

        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
        if (!audioStream) {
          resolve(null);
          return;
        }

        const info: AudioInfo = {
          duration: metadata.format.duration || 0,
          codec: audioStream.codec_name || 'unknown',
          bitrate: typeof audioStream.bit_rate === 'string' ? parseInt(audioStream.bit_rate) : (audioStream.bit_rate || 0),
          sampleRate: audioStream.sample_rate || 0,
          channels: audioStream.channels || 0,
        };

        resolve(info);
      });
    });
  }

  /**
   * 解析时间标记为秒数
   */
  private static parseTimemark(timemark: string): number {
    const parts = timemark.split(':');
    if (parts.length === 3) {
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }

  /**
   * 解析 FFmpeg 错误信息，提取关键错误并提供友好提示
   */
  private static parseFFmpegError(stderr: string | null, defaultMessage: string): string {
    if (!stderr || stderr.trim() === '') {
      return defaultMessage || '未知错误';
    }

    // 提取完整的错误日志，方便调试
    log.error('完整 FFmpeg 错误输出:', stderr);

    // 常见的 FFmpeg 错误模式
    const errorPatterns = [
      // 硬件加速相关错误
      {
        pattern: /Device creation failed|Cannot load.*qsv|No such filter.*qsv|hwaccel.*not available/i,
        message: 'QSV 硬件加速不可用。请检查：\n1. CPU 是否为 Intel 第7代及以上\n2. BIOS 是否启用了集成显卡\n3. 是否安装了 Intel 显卡驱动'
      },
      {
        pattern: /cuda|nvenc.*not found|Cannot load.*nvenc/i,
        message: 'NVENC 硬件加速不可用。请检查：\n1. 是否有 NVIDIA 显卡\n2. 是否安装了最新的 NVIDIA 驱动\n3. 显卡是否支持 NVENC'
      },
      {
        pattern: /videotoolbox.*failed|No device available|Cannot load.*videotoolbox/i,
        message: 'VideoToolbox 硬件加速失败。系统可能不支持或资源占用过高'
      },
      // 编码器错误
      {
        pattern: /Unknown encoder|Encoder.*not found/i,
        message: '找不到指定的编码器。FFmpeg 可能编译时未包含该编码器'
      },
      // 文件相关错误
      {
        pattern: /No such file or directory|Cannot open.*file/i,
        message: '找不到输入文件或无法访问。请检查文件路径是否正确'
      },
      {
        pattern: /Permission denied/i,
        message: '没有文件访问权限。请检查文件/文件夹权限'
      },
      {
        pattern: /Invalid data found|Invalid argument/i,
        message: '输入文件格式无效或已损坏'
      },
      // 编解码错误
      {
        pattern: /Codec.*not currently supported/i,
        message: '不支持的编解码格式。请使用其他编码器或转换输入文件格式'
      },
      {
        pattern: /Conversion failed/i,
        message: '编码转换失败。可能是参数不兼容或文件格式问题'
      },
      // 过滤器错误
      {
        pattern: /No such filter|Cannot find.*filter/i,
        message: '找不到指定的过滤器。可能是 FFmpeg 版本不支持'
      },
      // 字幕相关错误
      {
        pattern: /subtitles.*failed|ass.*error/i,
        message: '字幕处理失败。请检查字幕文件格式是否正确'
      },
      // 资源不足
      {
        pattern: /Out of memory|Cannot allocate memory/i,
        message: '内存不足。请关闭其他应用程序或使用较低的质量设置'
      },
    ];

    // 匹配错误模式
    for (const { pattern, message } of errorPatterns) {
      if (pattern.test(stderr)) {
        return message;
      }
    }

    // 尝试提取 FFmpeg 的最后一个错误行
    const lines = stderr.split('\n').filter(line => line.trim());
    const errorLines = lines.filter(line => 
      line.includes('Error') || 
      line.includes('error') || 
      line.includes('failed') ||
      line.includes('Fatal') ||
      line.includes('Cannot')
    );

    if (errorLines.length > 0) {
      // 返回最相关的错误信息
      const lastError = errorLines[errorLines.length - 1];
      // 清理 FFmpeg 的日志前缀
      const cleanError = lastError
        .replace(/^\[\w+\s@\s[^\]]+\]\s*/, '')  // 移除 [h264 @ 0x...] 这样的前缀
        .replace(/^Error\s*/i, '')
        .trim();
      
      if (cleanError.length > 10) {
        return cleanError.length > 200 ? cleanError.substring(0, 200) + '...' : cleanError;
      }
    }

    // 如果没有匹配到，返回默认消息和部分 stderr
    const lastLines = lines.slice(-5).join('\n');
    return `${defaultMessage}\n\n详细信息:\n${lastLines.substring(0, 300)}`;
  }

  /**
   * 烧录字幕到视频
   */
  static async burnSubtitles(
    options: SubtitleBurnOptions,
    onProgress?: (progress: SubtitleBurnProgress) => void
  ): Promise<{ success: boolean; message: string; outputPath?: string }> {
    const {
      videoPath,
      subtitlePath,
      outputPath,
      videoCodec = 'libx264',
      audioCodec = 'copy',
      crf = 23,
      preset = 'medium',
      useHardwareAccel = false,
      hwaccel = 'none',
    } = options;

    log.info('开始字幕烧录', { videoPath, subtitlePath, outputPath, useHardwareAccel, hwaccel });

    return new Promise((resolve, reject) => {
      try {
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        fs.ensureDirSync(outputDir);

        // 处理字幕文件路径（Windows 路径需要转义）
        const escapedSubtitlePath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
        const subtitlesFilter = `subtitles='${escapedSubtitlePath}'`;

        let totalDuration = 0;

        const command = ffmpeg()
          .input(videoPath);

        let enableHardware = useHardwareAccel && hwaccel !== 'none';
        if (enableHardware && hwaccel === 'qsv') {
          log.warn('QSV 硬件加速与字幕滤镜兼容性较差，自动切换为软件编码');
          enableHardware = false;
        }

        // 硬件加速配置
        if (enableHardware) {
          if (hwaccel === 'videotoolbox') {
            // macOS VideoToolbox 硬件加速（支持 Intel 和 Apple Silicon）
            log.info('启用 VideoToolbox 硬件加速');
            command.inputOptions(['-hwaccel videotoolbox']);
            command.videoCodec('h264_videotoolbox');
            // VideoToolbox 配置 - 针对 1080p@24fps 优化
            command.outputOptions([
              '-b:v 5M',           // 比特率 5Mbps（VideoToolbox 不支持 -q:v）
              '-maxrate 6M',       // 最大比特率
              '-bufsize 12M',      // 缓冲区大小
              '-allow_sw 1',       // 允许软件编码回退
              '-realtime 0',       // 非实时编码（更高质量）
              '-g 240',            // 关键帧间隔 (10秒@24fps)
              '-pix_fmt nv12',     // Apple Silicon 原生格式（Intel 也支持）
              '-profile:v high',   // H.264 High Profile
              '-level 4.1',        // H.264 Level 4.1 (支持 1080p@30fps)
            ]);
          } else if (hwaccel === 'nvenc') {
            // NVIDIA NVENC 硬件加速
            log.info('启用 NVENC 硬件加速');
            command.inputOptions(['-hwaccel cuda', '-hwaccel_output_format cuda']);
            command.videoCodec('h264_nvenc');
            // NVENC preset 映射: medium -> p4, fast -> p2, slow -> p6
            const nvencPresetMap: Record<string, string> = {
              'ultrafast': 'p1',
              'superfast': 'p2',
              'veryfast': 'p2',
              'faster': 'p3',
              'fast': 'p3',
              'medium': 'p4',
              'slow': 'p5',
              'slower': 'p6',
              'veryslow': 'p7',
            };
            const nvencPreset = nvencPresetMap[preset] || 'p4';
            command.outputOptions([
              `-preset ${nvencPreset}`,
              '-tune hq',          // 高质量模式
              '-rc vbr',           // 可变比特率
              `-cq ${crf}`,        // 恒定质量
              '-b:v 0',            // VBR 模式下设置为 0
              '-g 240',
              '-bf 2',
              '-pix_fmt nv12',     // NVENC 原生格式
              '-profile:v high',
              '-level 4.1',
            ]);
          } else if (hwaccel === 'qsv') {
            // Intel Quick Sync Video 硬件加速
            log.info('启用 QSV 硬件加速');
            command.inputOptions(['-hwaccel qsv', '-hwaccel_output_format qsv']);
            command.videoCodec('h264_qsv');
            // QSV 质量控制: global_quality 范围 1-51 (类似CRF，越小质量越好)
            const qsvQuality = Math.max(1, Math.min(51, crf));
            command.outputOptions([
              `-global_quality ${qsvQuality}`,
              '-look_ahead 1',
              '-look_ahead_depth 40',
              '-g 240',
              '-bf 2',
              '-pix_fmt nv12',
            ]);
          }
        } else {
          // 软件编码 - 针对 1080p@24fps 优化
          command.videoCodec(videoCodec);
          if (videoCodec !== 'copy') {
            const outputOptions = [
              `-crf ${crf}`,
              `-preset ${preset}`,
              '-g 240', // 关键帧间隔 (10秒@24fps)
              '-bf 2', // B帧数量
              '-pix_fmt yuv420p', // 像素格式
              '-profile:v high', // H.264 High Profile
              '-level 4.1', // H.264 Level
              '-movflags +faststart', // 流媒体优化
              '-x264opts keyint=240:min-keyint=24:scenecut=40', // x264 优化参数
            ];
            
            // 针对 H.265 的特殊配置
            if (videoCodec === 'libx265') {
              outputOptions.push(
                '-x265-params keyint=240:min-keyint=24:scenecut=40'
              );
            }
            
            command.outputOptions(outputOptions);
          }
        }

        command.audioCodec(audioCodec);

        // 如果视频需要重新编码，设置编码参数
        if (videoCodec !== 'copy' || enableHardware) {
          command.videoFilters(subtitlesFilter);
        } else {
          // copy 模式不支持滤镜，需要重新编码
          log.warn('字幕烧录需要重新编码视频，自动切换到 libx264');
          command
            .videoCodec('libx264')
            .outputOptions([
              `-crf ${crf}`,
              `-preset ${preset}`,
              '-g 240',
              '-bf 2',
              '-pix_fmt yuv420p',
              '-profile:v high',
              '-level 4.1',
              '-movflags +faststart',
              '-x264opts keyint=240:min-keyint=24:scenecut=40',
            ])
            .videoFilters(subtitlesFilter);
        }
        
        // 设置帧率和时间戳模式
        command.outputOptions([
          '-r 24000/1001', // 精确的 23.976 fps (电影标准帧率)
          '-vsync cfr', // 恒定帧率模式
          '-force_key_frames expr:gte(t,n_forced*10)', // 每10秒强制关键帧
        ]);

        command
          .on('start', (commandLine) => {
            log.info('FFmpeg 命令:', commandLine);
          })
          .on('codecData', (data) => {
            const duration = data.duration || '00:00:00';
            totalDuration = FFmpegService.parseTimemark(duration);
            log.info('视频总时长:', totalDuration, '秒');
          })
          .on('progress', (progress) => {
            if (onProgress) {
              let percent = 0;
              if (totalDuration > 0 && progress.timemark) {
                const currentTime = FFmpegService.parseTimemark(progress.timemark);
                percent = Math.min((currentTime / totalDuration) * 100, 100);
              }

              onProgress({
                percent: Math.round(percent),
                timemark: progress.timemark,
                currentFps: progress.currentFps,
                targetSize: progress.targetSize,
              });
            }
          })
          .on('end', () => {
            log.info('字幕烧录完成:', outputPath);
            resolve({
              success: true,
              message: '烧录成功',
              outputPath,
            });
          })
          .on('error', (err, _stdout, stderr) => {
            log.error('字幕烧录失败:', err.message);
            log.error('FFmpeg stderr:', stderr);
            
            // 从 stderr 中提取关键错误信息
            const errorDetail = FFmpegService.parseFFmpegError(stderr, err.message);
            
            reject({
              success: false,
              message: `烧录失败: ${errorDetail}`,
            });
          })
          .save(outputPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        log.error('烧录过程异常:', errorMessage);
        log.error('异常详情:', error);
        reject({
          success: false,
          message: `烧录异常: ${errorMessage}`,
        });
      }
    });
  }

  /**
   * 检查 FFmpeg 是否可用
   */
  static checkFFmpeg(): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err) => {
        if (err) {
          log.error('FFmpeg 不可用:', err.message);
          resolve(false);
        } else {
          log.info('FFmpeg 可用');
          resolve(true);
        }
      });
    });
  }
}

