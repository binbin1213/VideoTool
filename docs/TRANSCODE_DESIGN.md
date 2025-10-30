# 视频转码功能设计方案

## 📋 一、功能概述

视频转码是将视频从一种格式/编码转换为另一种格式/编码的过程，满足不同播放设备、平台和场景的需求。

---

## 🎯 二、功能需求

### 2.1 核心功能

- ✅ 支持常见视频格式转换（MP4, MKV, AVI, MOV, FLV, WebM 等）
- ✅ 支持多种视频编码（H.264, H.265/HEVC, VP9, AV1）
- ✅ 支持音频编码选择（AAC, MP3, Opus, FLAC）
- ✅ 支持分辨率调整（保持原始/自定义）
- ✅ 支持帧率调整（保持原始/自定义）
- ✅ 支持比特率控制（CRF/CBR/VBR）
- ✅ 硬件加速支持（VideoToolbox, NVENC, QSV）

### 2.2 高级功能（可选）

- 🔄 视频裁剪（时间范围）
- 🔄 视频旋转/翻转
- 🔄 添加水印
- 🔄 调整音量
- 🔄 批量转码
- 🔄 预设模板（Web 优化、移动设备、高质量等）

---

## 🎨 三、UI 设计

```
┌─────────────────────────────────────────┐
│  视频转码                                │
├─────────────────────────────────────────┤
│                                          │
│  📁 输入文件：                            │
│  ┌──────────────────────────────────┐   │
│  │ 选择视频文件...        [浏览...]  │   │
│  └──────────────────────────────────┘   │
│  ℹ️ 文件信息：1920x1080, 25fps, H.264   │
│                                          │
│  ⚙️ 输出设置                              │
│  ┌──────────────────────────────────┐   │
│  │ 格式：     [MP4 ▼]               │   │
│  │ 视频编码： [H.264 ▼]             │   │
│  │ 音频编码： [AAC ▼]               │   │
│  │ 分辨率：   [保持原始 ▼]          │   │
│  │ 帧率：     [保持原始 ▼]          │   │
│  │ 质量：     CRF [23] ━━●━━ (0-51) │   │
│  │ 预设：     [Medium ▼]            │   │
│  └──────────────────────────────────┘   │
│                                          │
│  🚀 硬件加速                              │
│  ☑️ 启用硬件加速 [VideoToolbox ▼]       │
│                                          │
│  🔧 高级选项 (折叠)                       │
│  ┌──────────────────────────────────┐   │
│  │ ☐ 裁剪时间段                      │   │
│  │ ☐ 调整音量                        │   │
│  │ ☐ 两遍编码（更高质量）             │   │
│  └──────────────────────────────────┘   │
│                                          │
│  💾 输出路径：                            │
│  ┌──────────────────────────────────┐   │
│  │ 桌面/output.mp4        [浏览...]  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────┐        │
│  │ 进度：45% ████████░░░░░░░    │        │
│  │ 速度：2.3x  预计剩余：1分30秒 │        │
│  └─────────────────────────────┘        │
│                                          │
│       [开始转码]  [取消]  [打开输出]     │
│                                          │
└─────────────────────────────────────────┘
```

---

## 💻 四、技术实现

### 4.1 文件结构

```
src/
├── main/
│   ├── ipc/
│   │   └── transcode.handlers.ts        # IPC 处理器
│   └── services/
│       └── TranscodeService.ts          # 转码服务
├── renderer/
│   └── components/
│       └── Features/
│           └── TranscodeTab.tsx         # 转码界面组件
└── types/
    └── transcode.types.ts               # 类型定义
```

### 4.2 核心类型定义

**`src/types/transcode.types.ts`**

```typescript
/**
 * 视频转码配置
 */
export interface TranscodeConfig {
  // ===== 输入输出 =====
  inputPath: string;
  outputPath: string;
  
  // ===== 格式和编码 =====
  format: 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm' | 'flv';
  videoCodec: 'libx264' | 'libx265' | 'vp9' | 'av1' | 'copy';
  audioCodec: 'aac' | 'mp3' | 'opus' | 'flac' | 'copy';
  
  // ===== 视频参数 =====
  resolution?: {
    width: number;
    height: number;
  } | 'original';
  framerate?: number | 'original';
  
  // ===== 质量控制 =====
  qualityMode: 'crf' | 'bitrate';
  crf?: number;              // 0-51, 默认 23 (越小质量越好)
  videoBitrate?: string;     // 如 "5M"
  audioBitrate?: string;     // 如 "192k"
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 
          'medium' | 'slow' | 'slower' | 'veryslow';
  
  // ===== 硬件加速 =====
  useHardwareAccel: boolean;
  hwaccel: 'none' | 'videotoolbox' | 'nvenc' | 'qsv';
  
  // ===== 高级选项 =====
  trim?: {
    start: string;  // "00:00:10"
    end: string;    // "00:05:30"
  };
  volume?: number;  // 0.5 = 50%, 2.0 = 200%
  twoPass?: boolean;
}

/**
 * 视频文件信息
 */
export interface VideoInfo {
  duration: number;      // 时长（秒）
  width: number;         // 宽度
  height: number;        // 高度
  fps: number;          // 帧率
  videoCodec: string;   // 视频编码
  audioCodec: string;   // 音频编码
  bitrate: number;      // 比特率（bps）
  size: number;         // 文件大小（bytes）
}

/**
 * 转码进度信息
 */
export interface TranscodeProgress {
  percent: number;       // 完成百分比 (0-100)
  currentTime: number;   // 当前处理时间（秒）
  speed: number;         // 处理速度（倍数，如 2.3x）
  eta: number;          // 预计剩余时间（秒）
  fps: number;          // 当前处理帧率
}
```

### 4.3 FFmpeg 命令构建

**`src/main/services/TranscodeService.ts` 核心方法**

```typescript
import ffmpeg from 'fluent-ffmpeg';
import log from 'electron-log';
import { TranscodeConfig, TranscodeProgress } from '../../types/transcode.types';

export class TranscodeService {
  /**
   * 构建 FFmpeg 命令参数
   */
  private buildFFmpegCommand(config: TranscodeConfig): string[] {
    const options: string[] = [];
    
    // ===== 硬件加速（解码） =====
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
    
    // ===== 输入文件 =====
    options.push('-i', config.inputPath);
    
    // ===== 时间裁剪 =====
    if (config.trim) {
      options.push('-ss', config.trim.start);
      options.push('-to', config.trim.end);
    }
    
    // ===== 视频编码 =====
    if (config.videoCodec !== 'copy') {
      const videoCodec = this.getVideoCodec(config);
      options.push('-c:v', videoCodec);
      
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
      
      // 预设（软件编码）
      if (!config.useHardwareAccel || config.hwaccel === 'none') {
        options.push('-preset', config.preset);
      }
      
      // 分辨率调整
      if (config.resolution && config.resolution !== 'original') {
        const { width, height } = config.resolution;
        options.push('-vf', `scale=${width}:${height}`);
      }
      
      // 帧率调整
      if (config.framerate && config.framerate !== 'original') {
        options.push('-r', config.framerate.toString());
      }
    } else {
      options.push('-c:v', 'copy');
    }
    
    // ===== 音频编码 =====
    if (config.audioCodec !== 'copy') {
      options.push('-c:a', config.audioCodec);
      
      if (config.audioBitrate) {
        options.push('-b:a', config.audioBitrate);
      }
      
      // 音量调整
      if (config.volume && config.volume !== 1.0) {
        options.push('-af', `volume=${config.volume}`);
      }
    } else {
      options.push('-c:a', 'copy');
    }
    
    // ===== 输出 =====
    options.push('-y'); // 覆盖已存在文件
    options.push(config.outputPath);
    
    return options;
  }
  
  /**
   * 获取硬件编码器名称
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
   */
  private crfToBitrate(crf: number): string {
    // 1080p 估算值
    const bitrateMap: Record<number, number> = {
      18: 10, 20: 8, 23: 5, 26: 3, 28: 2, 30: 1.5
    };
    
    const bitrate = bitrateMap[crf] || 5;
    return `${bitrate}M`;
  }
  
  /**
   * 执行转码
   */
  public async transcode(
    config: TranscodeConfig,
    onProgress: (progress: TranscodeProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(config.inputPath);
      const options = this.buildFFmpegCommand(config);
      
      log.info('FFmpeg 转码命令:', options.join(' '));
      
      // 应用参数
      command.outputOptions(options);
      
      // 进度监听
      command.on('progress', (progress) => {
        const { percent, timemark, currentFps } = progress;
        
        onProgress({
          percent: Math.round(percent || 0),
          currentTime: this.parseTimemark(timemark),
          speed: currentFps / 25, // 假设原始 25fps
          fps: currentFps,
          eta: 0, // 需要计算
        });
      });
      
      // 完成
      command.on('end', () => {
        log.info('转码完成:', config.outputPath);
        resolve();
      });
      
      // 错误
      command.on('error', (err) => {
        log.error('转码失败:', err);
        reject(err);
      });
      
      // 执行
      command.run();
    });
  }
  
  /**
   * 解析时间标记
   */
  private parseTimemark(timemark: string): number {
    const parts = timemark.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
}
```

### 4.4 预设模板

**常用转码预设**

```typescript
export const TRANSCODE_PRESETS = {
  // Web 优化 (适合网页播放)
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
    resolution: { width: 1920, height: 1080 },
  },
  
  // 移动设备 (较小文件)
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
    resolution: { width: 1280, height: 720 },
  },
  
  // 高质量 (适合存档)
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
  
  // 小文件 (节省空间)
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
    resolution: { width: 1280, height: 720 },
  },
  
  // 快速转码 (速度优先)
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
```

---

## 📐 五、实现步骤

### Phase 1: 基础功能 (1-2天)

**目标：实现最小可用版本**

- [ ] 创建类型定义文件 `transcode.types.ts`
- [ ] 实现 `TranscodeService` 基础服务
- [ ] 实现 IPC 通信处理器
- [ ] 创建基础 UI 界面（文件选择 + 开始按钮）
- [ ] 实现基本转码功能（MP4 → MP4, H.264 → H.264）

**验收标准**：能够完成最基本的视频格式转换

### Phase 2: 完善功能 (2-3天)

**目标：支持多种格式和参数调整**

- [ ] 支持多种输出格式（MP4, MKV, WebM）
- [ ] 支持多种视频编码（H.264, H.265, VP9）
- [ ] 支持多种音频编码（AAC, MP3, Opus）
- [ ] 实现质量控制（CRF 滑块）
- [ ] 实现分辨率调整下拉框
- [ ] 实现帧率调整下拉框
- [ ] 实现硬件加速开关
- [ ] 优化进度显示（百分比 + 速度 + ETA）

**验收标准**：支持常见的转码场景和参数调整

### Phase 3: 高级功能 (2-3天)

**目标：增强用户体验和高级选项**

- [ ] 实现预设模板选择
- [ ] 实现视频时间裁剪功能
- [ ] 实现音量调整功能
- [ ] 实现两遍编码选项
- [ ] 显示输入视频详细信息
- [ ] 预估输出文件大小
- [ ] 支持中断和恢复
- [ ] 完善错误处理和提示

**验收标准**：提供完整的高级功能和良好的用户体验

### Phase 4: 优化和测试 (1-2天)

**目标：稳定性和性能优化**

- [ ] 性能优化（大文件处理）
- [ ] UI/UX 优化（响应式、流畅度）
- [ ] 全面功能测试
- [ ] 多平台兼容性测试
- [ ] 边界情况测试
- [ ] 编写使用文档
- [ ] 代码审查和重构

**验收标准**：功能稳定，体验流畅，无明显 bug

---

## ⚠️ 六、注意事项

### 6.1 性能考虑

- **大文件处理**：视频文件可能非常大（>10GB），需要：
  - 分块处理避免内存溢出
  - 清晰的进度提示
  - 支持暂停/恢复/取消
  
- **硬件加速**：
  - VideoToolbox (macOS): 3-10倍速度提升
  - NVENC (NVIDIA): 5-15倍速度提升
  - QSV (Intel): 3-8倍速度提升
  - 需要检测硬件支持情况

- **两遍编码**：
  - 质量提升约 10-20%
  - 时间增加 100%（翻倍）
  - 适合追求极致质量的场景

### 6.2 兼容性问题

- **编码器参数**：不同编码器对参数支持不同
  - libx264: 支持 CRF, preset
  - h264_videotoolbox: 不支持 CRF，需用比特率
  - h264_nvenc: 参数名称不同 (preset → preset)

- **格式限制**：某些编码不支持某些容器
  - VP9 → 推荐 WebM
  - H.265 → 推荐 MP4 或 MKV
  - FLAC → 推荐 MKV（MP4 不支持）

- **平台差异**：
  - macOS: 仅支持 VideoToolbox
  - Windows: 支持 NVENC, QSV
  - Linux: 主要使用软件编码

### 6.3 用户体验

- **预设模板**：降低专业门槛
  - 大多数用户不了解编码参数
  - 提供场景化预设（Web、Mobile、Archive）
  - 允许在预设基础上微调

- **实时反馈**：
  - 清晰的进度条
  - 实时速度和剩余时间
  - 预估输出文件大小

- **错误处理**：
  - 友好的错误提示
  - 提供解决方案建议
  - 详细的日志记录

### 6.4 安全性

- **路径验证**：防止路径注入攻击
- **磁盘空间**：转码前检查剩余空间
- **文件权限**：检查读写权限
- **资源限制**：避免同时转码过多文件

---

## 🧪 七、测试用例

### 7.1 功能测试

| 测试场景 | 输入 | 预期输出 | 优先级 |
|---------|------|---------|--------|
| 基本转码 | MP4 (H.264) | MP4 (H.264) | P0 |
| 编码转换 | MP4 (H.264) | MP4 (H.265) | P0 |
| 格式转换 | MP4 | MKV | P0 |
| 降低分辨率 | 4K (3840x2160) | 1080p (1920x1080) | P1 |
| 降低帧率 | 60fps | 30fps | P1 |
| 质量调整 | CRF 23 | CRF 18 (高质量) | P1 |
| 硬件加速 | 软件编码 vs VideoToolbox | 速度提升 3-10x | P0 |
| 时间裁剪 | 00:00:10 - 00:05:30 | 5分20秒视频 | P2 |
| 音量调整 | 音量 x2.0 | 音量提升一倍 | P2 |

### 7.2 性能测试

| 测试场景 | 文件大小 | 预期结果 |
|---------|---------|---------|
| 小文件 | < 100MB | 流畅处理 |
| 中等文件 | 100MB - 2GB | 正常处理 |
| 大文件 | 2GB - 10GB | 稳定处理，无内存溢出 |
| 超大文件 | > 10GB | 支持处理，可能较慢 |

### 7.3 边界测试

- ❌ 无效文件路径
- ❌ 损坏的视频文件
- ❌ 磁盘空间不足
- ❌ 中途取消转码
- ❌ 系统休眠/关机
- ❌ 网络存储路径
- ❌ 特殊字符文件名

---

## 📊 八、性能指标

### 转码速度对比

**测试环境**：1080p 30fps H.264 视频，5分钟时长

| 编码方式 | 处理时间 | 速度倍数 | 质量 |
|---------|---------|---------|-----|
| libx264 (fast) | 3分钟 | 1.67x | 良好 |
| libx264 (medium) | 5分钟 | 1.0x | 优秀 |
| libx264 (slow) | 10分钟 | 0.5x | 极佳 |
| h264_videotoolbox | 1分钟 | 5.0x | 良好 |
| h264_nvenc | 40秒 | 7.5x | 良好 |

### 文件大小对比

**测试环境**：1080p 30fps，5分钟时长

| 编码 | CRF/质量 | 文件大小 |
|-----|---------|---------|
| H.264 | CRF 18 | ~500MB |
| H.264 | CRF 23 | ~200MB |
| H.264 | CRF 28 | ~80MB |
| H.265 | CRF 23 | ~100MB |
| VP9 | CRF 30 | ~90MB |

---

## 📚 九、参考资料

### FFmpeg 文档

- [FFmpeg 官方文档](https://ffmpeg.org/documentation.html)
- [H.264 编码指南](https://trac.ffmpeg.org/wiki/Encode/H.264)
- [H.265 编码指南](https://trac.ffmpeg.org/wiki/Encode/H.265)
- [硬件加速指南](https://trac.ffmpeg.org/wiki/HWAccelIntro)

### 编码参数说明

**CRF (Constant Rate Factor)**
- 范围：0-51 (0=无损, 51=最差)
- 推荐值：
  - 18-20: 高质量（视觉无损）
  - 23: 默认值（良好质量）
  - 26-28: 可接受质量（较小文件）

**Preset（编码速度）**
- ultrafast: 极快，质量差
- fast: 快速，质量一般
- medium: 默认，平衡
- slow: 慢速，质量好
- veryslow: 极慢，质量极佳

---

## 🎯 十、成功标准

### 功能完整性

- ✅ 支持至少 3 种格式转换（MP4, MKV, WebM）
- ✅ 支持至少 3 种视频编码（H.264, H.265, VP9）
- ✅ 支持硬件加速（至少支持 VideoToolbox）
- ✅ 支持分辨率和帧率调整
- ✅ 提供至少 3 个预设模板

### 性能标准

- ✅ 硬件加速速度提升至少 3 倍
- ✅ 支持处理 10GB 以上大文件
- ✅ UI 响应流畅，无明显卡顿

### 用户体验

- ✅ 界面简洁直观，易于理解
- ✅ 进度显示清晰准确
- ✅ 错误提示友好有用
- ✅ 预设模板满足 80% 常见需求

### 稳定性

- ✅ 连续转码 10 个文件无崩溃
- ✅ 各种边界情况处理正确
- ✅ 内存占用合理（< 500MB）

---

## 📝 十一、后续优化方向

### v1.1 增强版

- 🔄 批量转码支持
- 🔄 拖拽文件上传
- 🔄 转码队列管理
- 🔄 历史记录查看

### v1.2 专业版

- 🔄 视频滤镜（调色、锐化等）
- 🔄 添加水印/字幕
- 🔄 视频拼接/分割
- 🔄 高级参数自定义

### v1.3 智能版

- 🔄 AI 自动参数优化
- 🔄 智能质量评估
- 🔄 预设模板推荐
- 🔄 转码结果预览

---

**文档版本**: v1.0  
**最后更新**: 2025-10-30  
**作者**: AI Assistant

