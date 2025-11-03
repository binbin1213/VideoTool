import ffmpeg from 'fluent-ffmpeg';
import log from 'electron-log';
import path from 'path';
import fs from 'fs-extra';
import type {
  TranscodeConfig,
  TranscodeProgress,
  TranscodeResult,
  VideoInfo,
} from '../../types/transcode.types';

/**
 * 视频转码服务
 */
export class TranscodeService {
  private currentProcess: any = null;

  /**
   * 获取视频信息
   */
  async getVideoInfo(filePath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          log.error('获取视频信息失败:', err);
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        if (!videoStream) {
          reject(new Error('未找到视频流'));
          return;
        }

        // 确保宽高有效
        const width = videoStream.width ?? 0;
        const height = videoStream.height ?? 0;

        if (width === 0 || height === 0) {
          log.warn('视频流缺少宽高信息，尝试从其他流获取');
        }

        // 提取所有音频轨道
        const audioTracks = metadata.streams
          .filter((s) => s.codec_type === 'audio')
          .map((stream, idx) => ({
            index: stream.index || idx,
            codec: stream.codec_name || 'unknown',
            language: stream.tags?.language || undefined,
            channels: stream.channels || undefined,
            sampleRate: stream.sample_rate || undefined,
          }));

        // 提取所有字幕轨道
        const subtitleTracks = metadata.streams
          .filter((s) => s.codec_type === 'subtitle')
          .map((stream, idx) => ({
            index: stream.index || idx,
            codec: stream.codec_name || 'unknown',
            language: stream.tags?.language || undefined,
            title: stream.tags?.title || undefined,
            forced: stream.disposition?.forced === 1,
            default: stream.disposition?.default === 1,
          }));

        const info: VideoInfo = {
          duration: metadata.format.duration || 0,
          width,
          height,
          fps: this.parseFps(videoStream.r_frame_rate),
          videoCodec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name || 'none',
          bitrate: metadata.format.bit_rate || 0,
          size: metadata.format.size || 0,
          formatName: metadata.format.format_name || 'unknown',
          audioTracks: audioTracks.length > 0 ? audioTracks : undefined,
          subtitleTracks: subtitleTracks.length > 0 ? subtitleTracks : undefined,
        };

        log.info('视频信息:', info);
        log.info(`发现 ${audioTracks.length} 个音频轨道, ${subtitleTracks.length} 个字幕轨道`);
        resolve(info);
      });
    });
  }

  /**
   * 执行转码
   */
  async transcode(
    config: TranscodeConfig,
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<TranscodeResult> {
    const startTime = Date.now();

    try {
      // 验证输入文件
      if (!(await fs.pathExists(config.inputPath))) {
        throw new Error('输入文件不存在');
      }

      // 创建输出目录
      const outputDir = path.dirname(config.outputPath);
      await fs.ensureDir(outputDir);

      // 获取视频信息（用于计算进度）
      const videoInfo = await this.getVideoInfo(config.inputPath);
      const totalDuration = videoInfo.duration;

      // 构建并执行 FFmpeg 命令
      await this.executeFFmpeg(config, totalDuration, onProgress);

      const duration = (Date.now() - startTime) / 1000;

      log.info(`转码完成，耗时 ${duration.toFixed(2)} 秒`);

      return {
        success: true,
        outputPath: config.outputPath,
        duration,
      };
    } catch (error: any) {
      log.error('转码失败:', error);

      return {
        success: false,
        error: error.message || '转码失败',
      };
    }
  }

  /**
   * 取消转码
   */
  cancel(): void {
    if (this.currentProcess) {
      log.info('取消转码');
      this.currentProcess.kill('SIGKILL');
      this.currentProcess = null;
    }
  }

  /**
   * 执行 FFmpeg 命令
   */
  private executeFFmpeg(
    config: TranscodeConfig,
    totalDuration: number,
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(config.inputPath);

      // 输入选项（硬件加速解码）
      const inputOptions = this.buildInputOptions(config);
      if (inputOptions.length > 0) {
        command.inputOptions(inputOptions);
      }

      // 视频编码
      if (config.videoCodec !== 'copy') {
        const videoCodec = this.getVideoCodec(config);
        command.videoCodec(videoCodec);
      } else {
        command.videoCodec('copy');
      }

      // 音频编码
      if (config.audioCodec !== 'copy') {
        command.audioCodec(config.audioCodec);
      } else {
        command.audioCodec('copy');
      }

      // 输出选项
      const outputOptions = this.buildOutputOptions(config);
      command.outputOptions(outputOptions);

      // 输出格式
      command.format(config.format);

      // 输出文件
      command.output(config.outputPath);

      // 进度监听
      command.on('progress', (progress: any) => {
        if (onProgress && progress.timemark) {
          const currentTime = this.parseTimemark(progress.timemark);
          const percent = (currentTime / totalDuration) * 100;
          const speed = progress.currentFps / 25; // 粗略估算

          onProgress({
            percent: Math.min(Math.round(percent), 100),
            currentTime,
            speed: parseFloat(speed.toFixed(2)),
            fps: progress.currentFps || 0,
            eta: totalDuration - currentTime,
          });
        }
      });

      // 完成
      command.on('end', () => {
        log.info('FFmpeg 执行完成');
        this.currentProcess = null;
        resolve();
      });

      // 错误
      command.on('error', (err: Error) => {
        log.error('FFmpeg 执行失败:', err);
        this.currentProcess = null;
        reject(err);
      });

      // 保存进程引用（用于取消）
      this.currentProcess = command;

      // 执行
      log.info('开始转码:', config);
      command.run();
    });
  }

  /**
   * 构建输入选项
   */
  private buildInputOptions(config: TranscodeConfig): string[] {
    const options: string[] = [];

    // 硬件加速（解码）
    if (config.useHardwareAccel && config.hwaccel !== 'none') {
      if (config.hwaccel === 'videotoolbox') {
        options.push('-hwaccel', 'videotoolbox');
      } else if (config.hwaccel === 'nvenc') {
        options.push('-hwaccel', 'cuda');
        options.push('-hwaccel_output_format', 'cuda');
      } else if (config.hwaccel === 'qsv') {
        options.push('-hwaccel', 'qsv');
      }
    }

    return options;
  }

  /**
   * 构建输出选项
   */
  private buildOutputOptions(config: TranscodeConfig): string[] {
    const options: string[] = [];

    // 视频编码选项
    if (config.videoCodec !== 'copy') {
      // 质量控制
      if (config.qualityMode === 'crf' && config.crf !== undefined) {
        // VideoToolbox 不支持 CRF，使用比特率代替
        if (config.hwaccel === 'videotoolbox') {
          const bitrate = this.crfToBitrate(config.crf);
          options.push('-b:v', bitrate);
          options.push('-maxrate', `${parseInt(bitrate) * 1.2}M`);
          options.push('-bufsize', `${parseInt(bitrate) * 2}M`);
        } else {
          options.push('-crf', config.crf.toString());
        }
      } else if (config.videoBitrate) {
        options.push('-b:v', config.videoBitrate);
      }

      // 预设（仅软件编码）
      if (!config.useHardwareAccel || config.hwaccel === 'none') {
        options.push('-preset', config.preset);
      }

      // 分辨率
      if (config.resolution && config.resolution !== 'original') {
        const { width, height } = config.resolution;
        options.push('-vf', `scale=${width}:${height}`);
      }

      // 帧率
      if (config.framerate && config.framerate !== 'original') {
        options.push('-r', config.framerate.toString());
      }
    }

    // 音频编码选项
    if (config.audioCodec !== 'copy') {
      if (config.audioBitrate) {
        options.push('-b:a', config.audioBitrate);
      }

      // 音量调整
      if (config.volume && config.volume !== 1.0) {
        options.push('-af', `volume=${config.volume}`);
      }
    }

    // 时间裁剪
    if (config.trim) {
      options.push('-ss', config.trim.start);
      options.push('-to', config.trim.end);
    }

    // 覆盖已存在文件
    options.push('-y');

    return options;
  }

  /**
   * 获取视频编码器（包括硬件加速）
   */
  private getVideoCodec(config: TranscodeConfig): string {
    if (!config.useHardwareAccel || config.hwaccel === 'none') {
      return config.videoCodec;
    }

    // 硬件编码器映射
    const hwCodecMap: Record<string, Record<string, string>> = {
      videotoolbox: {
        libx264: 'h264_videotoolbox',
        libx265: 'hevc_videotoolbox',
      },
      nvenc: {
        libx264: 'h264_nvenc',
        libx265: 'hevc_nvenc',
      },
      qsv: {
        libx264: 'h264_qsv',
        libx265: 'hevc_qsv',
      },
    };

    return hwCodecMap[config.hwaccel]?.[config.videoCodec] || config.videoCodec;
  }

  /**
   * CRF 转比特率（粗略估算）
   * 用于 VideoToolbox 等不支持 CRF 的编码器
   */
  private crfToBitrate(crf: number): string {
    // 1080p 估算值
    const bitrateMap: Record<number, number> = {
      18: 10,
      20: 8,
      23: 5,
      26: 3,
      28: 2,
      30: 1.5,
    };

    // 查找最接近的 CRF 值
    let closestCrf = 23;
    let minDiff = Math.abs(crf - 23);

    for (const key of Object.keys(bitrateMap)) {
      const diff = Math.abs(crf - parseInt(key));
      if (diff < minDiff) {
        minDiff = diff;
        closestCrf = parseInt(key);
      }
    }

    const bitrate = bitrateMap[closestCrf] || 5;
    return `${bitrate}M`;
  }

  /**
   * 解析帧率字符串
   */
  private parseFps(fpsString?: string): number {
    if (!fpsString) return 0;

    try {
      if (fpsString.includes('/')) {
        const [num, den] = fpsString.split('/').map(Number);
        return Math.round(num / den);
      }
      return parseFloat(fpsString);
    } catch {
      return 0;
    }
  }

  /**
   * 解析时间标记（转换为秒）
   */
  private parseTimemark(timemark: string): number {
    try {
      const parts = timemark.split(':');
      const hours = parseInt(parts[0] || '0');
      const minutes = parseInt(parts[1] || '0');
      const seconds = parseFloat(parts[2] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    } catch {
      return 0;
    }
  }
}

