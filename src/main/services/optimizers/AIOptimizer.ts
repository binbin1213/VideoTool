import log from 'electron-log';
import {
  ParameterOptimizer,
  OptimizationGoal,
  OptimizationSuggestion,
} from './ParameterOptimizer';
import type {
  TranscodeConfig,
  VideoInfo,
  AIPlatform,
  VideoCodec,
  AudioCodec,
  VideoFormat,
  EncodePreset,
} from '../../../types/transcode.types';
import { AI_MODELS } from '../../../types/transcode.types';

/**
 * AI 参数优化器
 * 使用 DeepSeek/OpenAI 分析视频参数并推荐最佳转码方案
 */
export class AIOptimizer extends ParameterOptimizer {
  private apiKey: string;
  private platform: AIPlatform;
  private model: string;
  private endpoint: string;

  constructor(apiKey: string, platform: AIPlatform = 'deepseek') {
    super();
    this.apiKey = apiKey;
    this.platform = platform;
    this.model = AI_MODELS[platform].default;
    this.endpoint = AI_MODELS[platform].endpoint;
  }

  get name(): string {
    return `AI 优化器 (${this.platform})`;
  }

  get version(): string {
    return '1.0.0';
  }

  /**
   * 检查 AI 服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      log.warn('AI 优化器：未配置 API Key');
      return false;
    }

    try {
      // 发送简单测试请求
      await this.callAI('Hello', 10);
      log.info('AI 优化器：服务可用');
      return true;
    } catch (error: any) {
      log.error('AI 优化器不可用:', error.message);
      return false;
    }
  }

  /**
   * AI 优化参数
   */
  async optimize(
    videoInfo: VideoInfo,
    goal: OptimizationGoal,
    baseConfig?: Partial<TranscodeConfig>
  ): Promise<OptimizationSuggestion> {
    log.info('AI 优化器开始分析:', { videoInfo, goal });

    try {
      // 构建 AI prompt
      const prompt = this.buildOptimizationPrompt(videoInfo, goal);

      // 调用 AI
      const aiResponse = await this.callAI(prompt);

      // 解析 AI 响应
      const suggestion = this.parseAIResponse(aiResponse, videoInfo);

      // 合并用户自定义配置
      if (baseConfig) {
        suggestion.config = { ...suggestion.config, ...baseConfig };
      }

      log.info('AI 分析完成:', suggestion);
      return suggestion;
    } catch (error: any) {
      log.error('AI 优化失败:', error);
      throw new Error(`AI 优化失败: ${error.message}`);
    }
  }

  /**
   * AI 预估文件大小
   */
  async estimateFileSize(videoInfo: VideoInfo, config: TranscodeConfig): Promise<number> {
    // 使用简单数学模型（AI 预估成本太高，暂不实现）
    return this.simpleEstimateSize(videoInfo, config);
  }

  /**
   * AI 预估转码时间
   */
  async estimateTranscodeTime(
    videoInfo: VideoInfo,
    config: TranscodeConfig
  ): Promise<number> {
    // 使用简单数学模型
    return this.simpleEstimateTime(videoInfo, config);
  }

  /**
   * 构建优化 prompt
   */
  private buildOptimizationPrompt(videoInfo: VideoInfo, goal: OptimizationGoal): string {
    const goalMap = {
      quality: '最佳画质，文件大小其次',
      size: '最小文件大小，可接受一定质量损失',
      speed: '最快转码速度',
      balanced: '平衡质量、大小和速度',
    };

    // 构建详细的视频信息
    let videoDetails = `## 基础视频信息
- 分辨率: ${videoInfo.width}x${videoInfo.height}
- 帧率: ${videoInfo.fps} fps
- 时长: ${Math.round(videoInfo.duration / 60)} 分 ${Math.round(videoInfo.duration % 60)} 秒
- 当前大小: ${Math.round(videoInfo.size / 1024 / 1024)} MB
- 总比特率: ${Math.round(videoInfo.bitrate / 1000)} kbps`;

    // 添加视频编码详细信息
    videoDetails += `\n\n## 视频编码详情
- 编码器: ${videoInfo.videoCodec}`;
    if (videoInfo.profile) videoDetails += `\n- Profile: ${videoInfo.profile}`;
    if (videoInfo.level) videoDetails += `\n- Level: ${videoInfo.level}`;
    if (videoInfo.pixelFormat) videoDetails += `\n- 像素格式: ${videoInfo.pixelFormat}`;
    if (videoInfo.bitDepth) videoDetails += `\n- 位深度: ${videoInfo.bitDepth}bit`;
    if (videoInfo.colorSpace) videoDetails += `\n- 色彩空间: ${videoInfo.colorSpace}`;
    if (videoInfo.colorRange) videoDetails += `\n- 色彩范围: ${videoInfo.colorRange}`;
    if (videoInfo.colorPrimaries) videoDetails += `\n- 色彩原色: ${videoInfo.colorPrimaries}`;
    if (videoInfo.colorTransfer) videoDetails += `\n- 传输特性: ${videoInfo.colorTransfer}`;

    // 添加音频详细信息
    videoDetails += `\n\n## 音频详情
- 编码器: ${videoInfo.audioCodec}`;
    if (videoInfo.audioBitrate) videoDetails += `\n- 比特率: ${Math.round(videoInfo.audioBitrate / 1000)} kbps`;
    if (videoInfo.sampleRate) videoDetails += `\n- 采样率: ${videoInfo.sampleRate} Hz`;
    if (videoInfo.channels) videoDetails += `\n- 声道数: ${videoInfo.channels}`;
    if (videoInfo.channelLayout) videoDetails += `\n- 声道布局: ${videoInfo.channelLayout}`;
    if (videoInfo.audioBitDepth) videoDetails += `\n- 位深度: ${videoInfo.audioBitDepth}bit`;

    let prompt = `你是一位视频编码专家。请仔细分析以下详细的视频技术参数，并推荐最佳转码方案。

${videoDetails}

## 优化目标
${goalMap[goal.target]}`;

    if (goal.maxFileSize) {
      prompt += `\n- 目标文件大小: < ${goal.maxFileSize} MB`;
    }

    if (goal.targetQuality) {
      prompt += `\n- 目标质量: ${goal.targetQuality}`;
    }

    prompt += `\n\n## 编码器选择原则
⚠️ **重要：优先推荐 H.264 (libx264)**，理由：
- ✅ 兼容性最好，所有设备都支持
- ✅ 编码速度快（比 H.265 快 3-5 倍）
- ✅ 硬件解码支持广泛，播放流畅

**特别注意：以下场景必须推荐 H.264**：
- 🌐 Web 播放、流媒体分发
- 📱 移动设备兼容性要求高
- ⚡ 快速转码需求
- 🎮 游戏录屏、直播录制

**仅在以下情况推荐 H.265 (libx265)**：
- 📼 视频分辨率 ≥ 4K (3840x2160)
- 💾 长期存档，极致压缩（目标大小 < 原视频 50%）
- 🎨 10bit 色深，需保持高色彩精度

## 常见使用场景参考
1. **Web 优化**：MP4 + H.264 + AAC, CRF 23, medium, 音频 128k, 1080p
2. **移动设备**：MP4 + H.264 + AAC, CRF 26, fast, 音频 96k, 720p
3. **高质量存档**：MKV + H.265 + FLAC, CRF 18, slow, 原分辨率
4. **小文件压缩**：MP4 + H.265 + AAC, CRF 28, medium, 音频 64k, 720p
5. **快速转码**：MP4 + H.264 + AAC, CRF 23, veryfast, 原分辨率

## 请提供以下建议（必须严格按 JSON 格式返回）：

\`\`\`json
{
  "format": "mp4/mkv/webm",
  "videoCodec": "libx264/libx265/vp9",
  "audioCodec": "aac/mp3/opus",
  "resolution": "original 或 {width: number, height: number}",
  "framerate": "original 或具体数字",
  "crf": 18-28之间的数字,
  "preset": "fast/medium/slow",
  "audioBitrate": "96k/128k/192k",
  "reason": "详细说明推荐理由（100字以内）",
  "estimatedSize": 预估文件大小(MB),
  "confidence": 0.0-1.0之间的置信度
}
\`\`\`

注意：
1. 必须返回有效的 JSON 格式
2. resolution 如果是 original 直接写字符串，否则写对象
3. framerate 同理
4. 不要添加任何额外说明，只返回 JSON`;

    return prompt;
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(response: string, _videoInfo: VideoInfo): OptimizationSuggestion {
    try {
      // 提取 JSON（AI 可能会用 ```json 包裹）
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        throw new Error('无法从 AI 响应中提取 JSON');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const aiSuggestion = JSON.parse(jsonStr);

      // 转换为标准格式
      const config: Partial<TranscodeConfig> = {
        format: aiSuggestion.format as VideoFormat,
        videoCodec: aiSuggestion.videoCodec as VideoCodec,
        audioCodec: aiSuggestion.audioCodec as AudioCodec,
        resolution:
          aiSuggestion.resolution === 'original' ? 'original' : aiSuggestion.resolution,
        framerate:
          aiSuggestion.framerate === 'original' ? 'original' : aiSuggestion.framerate,
        qualityMode: 'crf',
        crf: aiSuggestion.crf,
        preset: aiSuggestion.preset as EncodePreset,
        audioBitrate: aiSuggestion.audioBitrate,
        useHardwareAccel: false, // AI 暂不推荐硬件加速，避免兼容性问题
        hwaccel: 'none',
      };

      return {
        config,
        reason: aiSuggestion.reason || 'AI 智能推荐',
        estimatedSize: aiSuggestion.estimatedSize || 0,
        estimatedTime: 0,
        confidence: aiSuggestion.confidence || 0.9,
      };
    } catch (error: any) {
      log.error('解析 AI 响应失败:', error);
      log.error('原始响应:', response);
      throw new Error(`解析 AI 响应失败: ${error.message}`);
    }
  }

  /**
   * 调用 AI API
   */
  private async callAI(prompt: string, maxTokens: number = 500): Promise<string> {
    if (!this.apiKey) {
      throw new Error('未配置 AI API Key');
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一位视频编码专家，擅长分析视频参数并推荐最佳转码方案。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.3, // 降低随机性，提高准确性
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `AI API 请求失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('AI 响应格式错误');
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      if (error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络或 API 地址');
      }
      throw error;
    }
  }

  /**
   * 简单文件大小估算
   */
  private simpleEstimateSize(videoInfo: VideoInfo, config: TranscodeConfig): number {
    const crf = config.crf || 23;
    const crfFactor = Math.pow(2, (23 - crf) / 6);

    let baseBitrate = 2000;
    const width =
      config.resolution === 'original'
        ? videoInfo.width
        : (config.resolution as any)?.width || videoInfo.width;

    if (width >= 3840) baseBitrate = 8000;
    else if (width >= 2560) baseBitrate = 5000;
    else if (width >= 1920) baseBitrate = 3000;
    else if (width >= 1280) baseBitrate = 2000;
    else baseBitrate = 1000;

    if (config.videoCodec === 'libx265') baseBitrate *= 0.5;

    const bitrate = baseBitrate * crfFactor;
    const videoSize = (bitrate * videoInfo.duration) / 8 / 1024;
    const audioSize =
      ((parseInt(config.audioBitrate || '128k') * videoInfo.duration) / 8 / 1024) || 0;

    return Math.round(videoSize + audioSize);
  }

  /**
   * 简单时间估算
   */
  private simpleEstimateTime(videoInfo: VideoInfo, config: TranscodeConfig): number {
    let speed = 1.0;

    const presetMap: Record<string, number> = {
      veryfast: 3,
      fast: 1.5,
      medium: 1,
      slow: 0.5,
      veryslow: 0.3,
    };
    speed *= presetMap[config.preset] || 1;

    if (config.videoCodec === 'libx265') speed *= 0.3;
    if (config.useHardwareAccel) speed *= 5;

    return Math.round(videoInfo.duration / speed);
  }
}

