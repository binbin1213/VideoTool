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
    const goalMap: Record<string, string> = {
      // 前端场景映射
      mobile: '移动设备播放，优先H.264确保兼容性，适度压缩文件大小。分辨率建议：1080p及以下保持原样，4K降至1080p（移动设备4K意义不大），使用CRF 24-26',
      web: 'Web播放和社交媒体分享，平衡质量和文件大小，保持1080p或原分辨率，使用H.264确保最佳兼容性',
      archive: '高质量存档，优先保持原始质量，可使用H.265压缩，不限制文件大小',
      compress: '极致压缩文件大小，可接受质量损失，使用高CRF值（27-28），可降低分辨率（1080p→720p），降低音频码率',
      fast: '最快转码速度，优先使用copy保持原编码，如需转码则使用veryfast预设',
      custom: '根据视频实际情况灵活调整，平衡各项指标',
      // 旧版兼容
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
${goalMap[goal.target] || goalMap['custom']}`;

    if (goal.maxFileSize) {
      prompt += `\n- 目标文件大小: < ${goal.maxFileSize} MB`;
    }

    if (goal.targetQuality) {
      prompt += `\n- 目标质量: ${goal.targetQuality}`;
    }

    prompt += `\n\n## 核心原则：避免不必要的转码

**第一优先：使用 copy 保持原编码（无损、最快、无质量损失）**

关键判断逻辑：
1. **编码兼容性检查**：
   - 视频是 H.264 或 H.265 → 编码合格
   - 音频是 AAC/MP3/Opus → 编码合格
   
2. **场景兼容性检查**：
   - [Web] 需要 H.264（H.265 兼容性差）
   - [移动设备] 需要 H.264
   - [存档] H.264/H.265 都可以
   - [快速转码] 任何现代编码都可以

3. **容器转换判断**：
   - MKV → MP4：只需转容器，用 copy
   - AVI → MP4：只需转容器，用 copy
   - 任何现代容器之间转换：用 copy

**使用 copy 的标准情况**：
- ✅ 原视频是 H.264，目标场景是 Web/移动设备/存档/快速 → videoCodec: "copy"
- ✅ 原音频是 AAC，目标场景是 Web/移动设备/存档/快速 → audioCodec: "copy"
- ✅ 只是容器转换（MKV→MP4，AVI→MP4）→ 全部 copy
- ✅ 码率合理（< 8Mbps for 1080p）→ copy
- ✅ 场景是"快速转码"或"高质量存档" → 优先 copy
- ✅ **场景是"移动设备"且原视频是1080p H.264 → 可以用 copy**

**必须重新编码的情况**：
- ❌ 原编码过时（MPEG2、VC-1、WMV、RealVideo）
- ❌ 编码不兼容场景（原是 H.265，目标是 Web/移动设备）
- ❌ 码率明显过高（> 10Mbps for 1080p）
- ❌ **场景是"极致压缩"（compress）→ 必须重新编码，使用 libx264/libx265，CRF 27-28**
- ❌ **场景是"移动设备"且原分辨率 > 1080p（如4K）→ 重新编码降至1080p**
- ❌ 非标准参数（奇怪的分辨率、帧率）

**重要提示**：
- 文件大小本身不是重新编码的理由（除非场景是compress）
- 只要编码兼容且场景不是compress，优先用 copy 保证质量
- MKV 转 MP4 只是容器转换，不需要重新编码（除非场景明确要求压缩）
- **场景优先级最高**：场景需求 > 编码兼容性 > 文件大小
- **mobile场景：1080p及以下的H.264视频可以直接copy，无需降低分辨率**

## 视频编码器选择

**H.264 (libx264) - 首选编码器**
适用场景：
- [Web] Web 播放、流媒体分发
- [移动设备] 移动设备、平板、智能电视
- [快速转码] 需要快速完成
- [通用] 不确定播放环境时的安全选择
优势：兼容性最好，速度快，硬件解码支持广泛

**H.265 (libx265) - 特定场景使用**
适用场景：
- [高质量存档] 4K 及以上分辨率，长期存档
- [小文件压缩] 需要极致压缩（目标 < 原大小 50%）
- [10bit色深] 需要保持高色彩精度
劣势：编码慢 3-5 倍，部分旧设备不支持

## 音频编码器选择

**优先使用 copy 保持原音频：**
- 原音频已经是 AAC/MP3/Opus
- 码率合理（96k-256k）
- 采样率标准（44.1kHz/48kHz）

**需要转码的情况：**
- 原音频编码过时（AC3、DTS、PCM、WMA）
- 码率过高（> 320k）或过低（< 64k）
- 目标场景不兼容（如 Web 需要 AAC）

推荐音频编码：
- AAC (通用首选)：兼容性好，质量高
- MP3 (备选)：兼容性最好，但质量略低
- Opus (高级场景)：质量最好，但兼容性稍差

## 使用场景参考方案

**1. [mobile] 移动设备**：
- 分辨率：1080p及以下保持原样，4K降至1080p
- 编码：MP4 + H.264（或copy如果原本就是） + AAC
- 质量：CRF 24-26（如需重新编码）
- 预设：fast
- 音频：copy 或 AAC 128k
- 说明：现代移动设备完全支持1080p，优先兼容性而非降低分辨率

**2. [web] Web播放**：
- 分辨率：保持1080p或原分辨率
- 编码：MP4 + H.264 + AAC（如果原视频已是H.264+AAC则用copy）
- 质量：CRF 23
- 预设：medium
- 音频：128k
- 说明：平衡质量和文件大小，H.264确保最佳兼容性

**3. [archive] 高质量存档**：
- 分辨率：原分辨率
- 编码：MKV + copy（如果原编码合理）或 H.265（需要压缩时）
- 质量：CRF 18-20
- 预设：slow
- 音频：copy 或 AAC 192k
- 说明：保持最高质量，可使用H.265压缩

**4. [compress] 极致压缩**：
- 分辨率：720p或更低
- 编码：MP4 + H.265 + AAC
- 质量：CRF 27-28
- 预设：medium
- 音频：64k
- 说明：最小文件大小，接受一定质量损失，必须重新编码

**5. [fast] 快速转码**：
- 分辨率：原分辨率
- 编码：MP4 + copy + copy（优先）
- 预设：veryfast（如需重新编码）
- 说明：优先使用copy保持原编码，最快速度

**6. [custom] 自定义**：
- 根据视频实际情况灵活调整，平衡各项指标

## 请提供以下建议（必须严格按 JSON 格式返回）：

\`\`\`json
{
  "format": "mp4/mkv/webm",
  "videoCodec": "copy/libx264/libx265/vp9",
  "audioCodec": "copy/aac/mp3/opus",
  "resolution": "original 或 {width: number, height: number}",
  "framerate": "original 或具体数字",
  "crf": 18-28之间的数字 (如果使用copy则填23),
  "preset": "veryfast/fast/medium/slow/veryslow",
  "audioBitrate": "64k/96k/128k/192k/256k",
  "reason": "详细说明推荐理由，特别说明为什么选择copy或重新编码（100字以内）",
  "estimatedSize": 预估文件大小(MB),
  "confidence": 0.0-1.0之间的置信度
}
\`\`\`

重要说明：
1. 必须返回有效的 JSON 格式
2. videoCodec 和 audioCodec 可以是 "copy"（保持原编码，无损最快）
3. **如果原视频编码合理且符合目标场景，强烈优先使用 copy**
4. **特别注意：MKV→MP4 只是容器转换，应该用 copy，不要重新编码**
5. resolution 如果是 original 直接写字符串，否则写对象 {width, height}
6. framerate 同理
7. **reason 必须明确说明为什么选择 copy 或为什么必须重新编码**
   - 如果用 copy：说明"原编码已是H.264，只需转容器到MP4，无损最快"
   - 如果重新编码：说明"原编码是XXX，不兼容Web，必须重新编码为H.264"
8. 不要添加任何额外说明，只返回 JSON

**示例判断**：
- 原视频：MKV + H.264 + AAC，目标[web] → 推荐 copy（只转容器）
- 原视频：MKV + H.264 + AAC，目标[compress] → 推荐 libx265, CRF 27-28（极致压缩）
- 原视频：MP4 + H.264 + AAC, 1080p，目标[mobile] → 推荐 copy（现代移动设备支持1080p）
- 原视频：MP4 + H.264 + AAC, 4K，目标[mobile] → 推荐 libx264, 1080p（4K降至1080p）
- 原视频：MP4 + H.265 + AAC，目标[web] → 推荐 libx264（H.265不兼容Web）
- 原视频：MKV + MPEG2 + AC3，目标任何 → 推荐 libx264 + aac（编码过时）
- 原视频：MKV + H.264 + AAC，目标[fast] → 推荐 copy（最快）
- 原视频：MKV + H.264 + AAC，目标[archive] → 推荐 copy（保持质量）`;

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
        qualityMode: aiSuggestion.videoCodec === 'copy' ? undefined : 'crf',
        crf: aiSuggestion.videoCodec === 'copy' ? undefined : aiSuggestion.crf,
        preset: aiSuggestion.videoCodec === 'copy' ? undefined : (aiSuggestion.preset as EncodePreset),
        audioBitrate: aiSuggestion.audioCodec === 'copy' ? undefined : aiSuggestion.audioBitrate,
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
              content: '你是一位专业的视频编码专家，精通 FFmpeg 和各种视频编码器。你擅长分析视频技术参数，并根据使用场景推荐最优的转码方案。你的核心原则是：1) 避免不必要的转码，优先使用copy保持原编码；2) 优先推荐H.264以确保兼容性；3) 根据具体场景灵活调整参数。',
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

