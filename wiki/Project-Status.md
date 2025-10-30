# VideoTool 项目开发状态清单

> 最后更新：2025年10月30日

---

## 项目总览

- **项目名称**: VideoTool - 视频处理工具
- **技术栈**: Electron + React + TypeScript + FFmpeg + AI (DeepSeek/OpenAI)
- **当前版本**: 1.0.0
- **完成度**: 约 65%（核心字幕转换 + 音视频合并 + 字幕烧录 + 视频转码 + FFmpeg 自动安装已完成）

---

## ✅ 已完成功能

### 1. 项目基础架构 ✅
- [x] Electron + React + TypeScript 项目搭建
- [x] Vite 构建配置
- [x] TypeScript 类型配置
- [x] ESLint + Prettier 代码规范
- [x] 开发环境热重载
- [x] 生产环境打包（macOS x64）

**相关文件**:
- `package.json` - 依赖管理和构建脚本
- `vite.config.ts` - Vite 配置
- `tsconfig.json` / `tsconfig.main.json` - TypeScript 配置

---

### 2. UI 框架和布局 ✅
- [x] React Bootstrap UI 组件库
- [x] 固定窗口尺寸布局（900x600，3:2 比例）
- [x] 侧边栏导航组件
- [x] Logo 和品牌标识集成
- [x] 全局样式系统（SCSS）
- [x] 响应式元素缩放

**相关文件**:
- `src/renderer/App.tsx` - 主应用组件
- `src/renderer/components/Layout/Sidebar.tsx` - 侧边栏
- `src/renderer/styles/App.scss` - 全局样式
- `src/renderer/assets/logo.png` - Logo 资源

---

### 3. 字幕格式转换 (SRT → ASS) ✅
- [x] SRT 文件解析
- [x] 正则表达式预处理（7条规则）
- [x] ASS 样式模板（3种样式）
- [x] ASS 文件生成
- [x] 拖拽上传文件
- [x] 文件选择器
- [x] 转换进度显示
- [x] 转换结果下载
- [x] 功能说明界面

**相关文件**:
- `src/renderer/components/Features/SubtitleConvertTab.tsx` - 字幕转换UI
- `src/renderer/utils/subtitleConverter.ts` - 转换核心逻辑
- `src/shared/types/subtitle.types.ts` - 类型定义
- `src/shared/presets/subtitle-convert/regex-rules.json` - 正则规则
- `src/shared/presets/subtitle-convert/ass-styles.txt` - ASS样式模板

**测试状态**: ✅ 已测试通过

---

### 4. 全局日志系统 ✅
- [x] 日志状态管理
- [x] 日志级别（info/success/warning/error）
- [x] 独立日志查看页面
- [x] VS Code 终端风格界面
- [x] 日志过滤和搜索
- [x] 日志导出功能
- [x] 日志清空功能

**相关文件**:
- `src/renderer/App.tsx` - 全局日志状态管理
- `src/renderer/components/Features/LogViewerTab.tsx` - 日志查看器

**测试状态**: ✅ 已测试通过

---

### 5. 音视频合并 ✅
- [x] FFmpeg 服务封装
- [x] 视频文件选择
- [x] 音频文件选择
- [x] 视频/音频信息读取
- [x] 编码参数配置（视频编码、音频编码、比特率）
- [x] 合并进度显示（实时进度条）
- [x] 输出路径选择
- [x] IPC 通信（主进程与渲染进程）
- [x] 错误处理和日志记录
- [x] UI 界面设计

**相关文件**:
- `src/renderer/components/Features/MergeTab.tsx` - 音视频合并UI
- `src/main/services/FFmpegService.ts` - FFmpeg 核心服务
- `src/main/ipc/merge.handlers.ts` - IPC 通信处理
- `src/shared/types/merge.types.ts` - 类型定义

**支持格式**:
- 视频: MP4, AVI, MKV, MOV, FLV, WMV, WebM, M4V
- 音频: MP3, AAC, WAV, FLAC, M4A, WMA, OGG, Opus

**功能特点**:
- 支持直接复制模式（最快速度，推荐）
- 支持重新编码（H.264/H.265）
- **硬件加速支持**（重新编码时可用，VideoToolbox/NVENC/QSV）
- 实时显示合并进度和时间标记
- 显示视频/音频详细信息（分辨率、编码、比特率等）
- 可配置音频比特率（128k-320k）
- FFmpeg 可用性检查

**测试状态**: ✅ 开发完成，测试通过

---

### 6. 字幕烧录 ✅
- [x] FFmpeg 字幕滤镜封装
- [x] 视频文件选择
- [x] 字幕文件选择（SRT/ASS/SSA/VTT）
- [x] 字幕信息读取
- [x] 编码参数配置（视频编码器、质量控制 CRF、编码速度 Preset）
- [x] 烧录进度显示（实时进度条）
- [x] 输出路径选择
- [x] IPC 通信（主进程与渲染进程）
- [x] 错误处理和日志记录
- [x] UI 界面设计

**相关文件**:
- `src/renderer/components/Features/SubtitleBurnTab.tsx` - 字幕烧录UI
- `src/main/services/FFmpegService.ts` - FFmpeg 核心服务（添加 burnSubtitles 方法）
- `src/main/ipc/subtitle-burn.handlers.ts` - IPC 通信处理
- `src/shared/types/subtitle-burn.types.ts` - 类型定义

**支持格式**:
- 字幕: SRT, ASS, SSA, VTT
- 视频: MP4, AVI, MKV, MOV, FLV, WMV, WebM, M4V

**功能特点**:
- 支持多种字幕格式烧录
- H.264/H.265 编码器选择
- **硬件加速支持**（VideoToolbox/NVENC/QSV，5-10倍加速）
- CRF 质量控制（18-28，可调节）
- 编码速度预设（ultrafast ~ veryslow）
- 音频直接复制（无损）或重新编码
- 实时显示烧录进度和时间标记
- 自动显示视频和字幕详细信息

**技术要点**:
- 使用 FFmpeg subtitles 滤镜
- 必须重新编码视频（不支持 copy 模式）
- 路径特殊字符自动转义处理
- 支持 Windows 和 macOS 路径格式

**测试状态**: ✅ 开发完成，待用户测试

---

### 6. FFmpeg 自动下载和安装 ✅
- [x] FFmpeg 安装检测
- [x] 自动下载 FFmpeg
- [x] 跨平台支持（macOS/Windows/Linux）
- [x] 下载进度显示
- [x] 安装对话框提示
- [x] 系统 FFmpeg 检测
- [x] 自定义路径管理

**支持平台**:
- **macOS**: 从 evermeet.cx 下载（官方编译）
- **Windows**: 从 GitHub FFmpeg-Builds 下载
- **Linux**: 从 johnvansickle.com 下载静态编译版

**功能特性**:
-  应用启动时自动检测
-  一键下载安装
-  下载失败自动重试
-  实时进度反馈
-  优先使用系统已安装的 FFmpeg
- 💾 本地缓存管理（存储在 userData 目录）
-  自动设置执行权限（Unix系统）

**技术亮点**:
- 智能路径检测（系统 → 本地 → 自动下载）
- 安全的 HTTPS 下载
- 跨平台压缩包处理（ZIP/TAR.XZ）
- 优雅的错误处理和用户提示

**相关文件**:
- `src/main/services/FFmpegManager.ts` - FFmpeg 管理服务
- `src/main/ipc/ffmpeg.handlers.ts` - IPC 通信接口
- `src/main/index.ts` - 启动时初始化
- `src/main/services/FFmpegService.ts` - FFmpeg 路径配置

**下载源**:
- macOS: https://evermeet.cx/ffmpeg/
- Windows: https://github.com/BtbN/FFmpeg-Builds
- Linux: https://johnvansickle.com/ffmpeg/

**测试状态**: ✅ 已实现，待测试

---

### 7. 视频转码 ✅ ⭐ **NEW**
- [x] 智能优化系统（三层决策）
- [x] 完美视频检测（自动识别无需转码的视频）
- [x] 规则引擎优化器
- [x] AI 智能优化器（DeepSeek / OpenAI）
- [x] 流式复制模式（无损，极快）
- [x] H.264 / H.265 编码
- [x] AAC / MP3 音频编码
- [x] CRF 质量控制（18-28）
- [x] 编码速度预设（veryfast ~ slow）
- [x] 硬件加速支持（VideoToolbox）
- [x] 状态持久化（页面切换不丢失配置）
- [x] 实时进度显示
- [x] IPC 通信（主进程与渲染进程）
- [x] 错误处理和日志记录
- [x] UI 界面设计

**相关文件**:
- `src/renderer/components/Features/TranscodeTab.tsx` - 视频转码UI
- `src/main/services/TranscodeService.ts` - 转码核心服务
- `src/main/services/optimizers/OptimizerFactory.ts` - 智能优化工厂
- `src/main/services/optimizers/RuleBasedOptimizer.ts` - 规则引擎
- `src/main/services/optimizers/AIOptimizer.ts` - AI 优化器
- `src/main/services/optimizers/ParameterOptimizer.ts` - 优化器基类
- `src/main/ipc/transcode.handlers.ts` - IPC 通信处理
- `src/types/transcode.types.ts` - 类型定义

**支持格式**:
- 输入: MP4, MKV, AVI, MOV, FLV, WMV, WebM, M4V
- 输出: MP4, MKV, WebM

**核心功能**:

**🧠 智能优化系统（三层决策）**:
1. **第一层 - 完美视频检测**:
   - 自动识别 H.264/H.265 + AAC + MP4，比特率合理的视频
   - 推荐流式复制（5 秒完成，100% 无损）
   - 避免不必要的质量损失和时间浪费

2. **第二层 - 简单场景检测**:
   - 标准分辨率（720p/1080p/1440p/4K）
   - 常见编码（H.264/H.265）
   - 使用规则引擎快速决策（< 1ms 响应）

3. **第三层 - AI 智能分析**:
   - 复杂场景交给 AI 深度分析
   - 提取详细视频参数（色彩空间、位深度、Profile、Level等）
   - 优先推荐 H.264（兼容性最好）
   - 提供详细理由和预估信息

**🤖 AI 优化器**:
- 支持 DeepSeek（推荐，¥0.001/次）
- 支持 OpenAI（$0.001/次）
- 智能编码器选择（优先 H.264）
- 场景化推荐（Web/移动/存档/压缩/快速）
- 无 API Key 时自动降级到规则引擎

**🚀 硬件加速**:
- VideoToolbox 支持（macOS）
- H.264: 速度提升 5-10 倍
- H.265: 部分支持（有限制）

**💾 状态持久化**:
- 已选择的视频文件
- AI 配置（平台、API Key）
- 转码参数设置
- 输出路径

**性能测试**:
- 测试视频: 24分钟 1080p H.264 (880MB)
- 流式复制: **5 秒**（智能优化推荐）
- H.265 重编码: 15-20 分钟
- H.264 硬件加速: 2-3 分钟
- **速度提升: 180-240 倍**

**技术亮点**:
- 三层智能决策系统
- AI 驱动参数优化
- 完美视频自动识别
- 智能降级机制
- 流式复制极速处理

**测试状态**: ✅ 开发完成，测试通过

---

### 8. 应用打包和分发 ✅ (部分完成)
- [x] macOS x64 应用打包（.app）
- [x] 应用图标生成（.icns）
- [x] 静态资源打包优化
- [ ] macOS DMG 安装包（失败，需修复）
- [ ] macOS arm64 (Apple Silicon) 支持（需下载依赖）
- [ ] macOS Universal 通用包
- [ ] Windows 打包（.exe / .msi）
- [ ] 代码签名

**相关文件**:
- `resources/icons/icon.icns` - macOS 图标
- `resources/icons/icon.png` - Windows 图标源文件
- `package.json` (build 配置) - Electron Builder 配置

---

## 🔲 待开发功能

### 1. 批量处理 🔲
**功能描述**: 批量执行转码、压缩、字幕烧录等操作

**技术要点**:
- 任务队列管理
- 并发控制（防止系统过载）
- 进度跟踪（总体进度 + 单个任务进度）
- 错误处理和重试机制
- 批量配置模板

**技术文档**:
- Node.js 异步控制: https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/
- p-queue 库: https://github.com/sindresorhus/p-queue
- Bull Queue (高级队列): https://github.com/OptimalBits/bull

**开发规则**:
1. 创建 `src/renderer/components/Features/BatchTab.tsx`
2. 创建 `src/main/services/TaskQueueService.ts` 管理任务队列
3. 支持拖拽多文件上传
4. 显示任务列表和状态
5. 支持暂停/恢复/取消任务
6. 保存批量处理模板

**预估工作量**: 4-5天

---

### 3. 视频编辑工具 🔲

#### 3.1 视频裁剪 🔲
**功能**: 裁剪视频画面尺寸

**FFmpeg 命令**: `ffmpeg -i input.mp4 -vf "crop=w:h:x:y" output.mp4`

**技术文档**: https://ffmpeg.org/ffmpeg-filters.html#crop

---

#### 3.2 视频旋转 🔲
**功能**: 旋转视频方向（90/180/270度）

**FFmpeg 命令**: `ffmpeg -i input.mp4 -vf "transpose=1" output.mp4`

**技术文档**: https://ffmpeg.org/ffmpeg-filters.html#transpose-1

---

#### 3.3 添加水印 🔲
**功能**: 在视频上添加图片或文字水印

**FFmpeg 命令**: `ffmpeg -i video.mp4 -i logo.png -filter_complex "overlay=W-w-10:H-h-10" output.mp4`

**技术文档**: https://ffmpeg.org/ffmpeg-filters.html#overlay-1

---

#### 3.4 音频提取 🔲
**功能**: 从视频中提取音频轨道

**FFmpeg 命令**: `ffmpeg -i video.mp4 -vn -acodec copy audio.aac`

**技术文档**: https://trac.ffmpeg.org/wiki/ExtractAudio

---

#### 3.5 视频分割 🔲
**功能**: 将视频按时间点分割为多段

**FFmpeg 命令**: `ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:30 -c copy output.mp4`

**技术文档**: https://trac.ffmpeg.org/wiki/Seeking

---

#### 3.6 视频转 GIF 🔲
**功能**: 将视频片段转换为 GIF 动图

**FFmpeg 命令**: `ffmpeg -i video.mp4 -vf "fps=10,scale=320:-1" output.gif`

**技术文档**: https://ffmpeg.org/ffmpeg-filters.html#palettegen

--- **视频编辑工具预估总工作量**: 5-7天

---

## 📚 通用技术文档

### FFmpeg 相关
- **FFmpeg 官方文档**: https://ffmpeg.org/documentation.html
- **FFmpeg 命令行工具**: https://ffmpeg.org/ffmpeg.html
- **FFmpeg 滤镜文档**: https://ffmpeg.org/ffmpeg-filters.html
- **FFmpeg Wiki**: https://trac.ffmpeg.org/wiki
- **fluent-ffmpeg (Node.js库)**: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg

### Electron 相关
- **Electron 官方文档**: https://www.electronjs.org/docs/latest/
- **Electron IPC 通信**: https://www.electronjs.org/docs/latest/tutorial/ipc
- **Electron Builder 打包**: https://www.electron.build/
- **主进程和渲染进程**: https://www.electronjs.org/docs/latest/tutorial/process-model

### React 相关
- **React 官方文档**: https://react.dev/
- **React Hooks**: https://react.dev/reference/react/hooks
- **React Bootstrap**: https://react-bootstrap.github.io/

### TypeScript 相关
- **TypeScript 官方文档**: https://www.typescriptlang.org/docs/
- **TypeScript 类型声明**: https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html

---

## 开发规范

### 代码规范
1. **使用 TypeScript** - 所有新代码必须使用 TS
2. **遵循 ESLint 规则** - 运行 `pnpm lint` 检查
3. **使用 Prettier 格式化** - 运行 `pnpm format` 自动格式化
4. **组件命名** - PascalCase（大驼峰）
5. **文件命名** - PascalCase.tsx（组件）/ camelCase.ts（工具）

### 目录结构规范
```
src/
├── main/                    # Electron 主进程
│   ├── index.ts            # 主入口
│   ├── services/           # 业务服务（FFmpeg、文件处理等）
│   └── utils/              # 工具函数
├── renderer/               # React 渲染进程
│   ├── App.tsx             # 根组件
│   ├── components/         # React 组件
│   │   ├── Layout/         # 布局组件
│   │   └── Features/       # 功能组件（各个Tab页面）
│   ├── utils/              # 前端工具函数
│   ├── styles/             # 样式文件
│   └── assets/             # 静态资源
└── shared/                 # 主进程和渲染进程共享代码
    ├── types/              # TypeScript 类型定义
    └── presets/            # 预设配置文件
```

### Git 提交规范
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具配置

---

## 开发优先级建议

### Phase 1: 核心视频功能（优先）
1. ~~**音视频合并**~~ - ✅ 已完成
2. ~~**字幕烧录**~~ - ✅ 已完成
3. ~~**视频转码/压缩**~~ - ✅ 已完成（智能优化 + AI 驱动）

### Phase 2: 编辑工具
4. **视频分割** - 相对简单，用户需求高
5. **音频提取** - 简单实用
6. **添加水印** - 商业需求

### Phase 3: 高级功能
7. **批量处理** - 提升效率
8. **视频裁剪/旋转/GIF** - 补充功能

---

## 开发流程建议

### 每个新功能的开发步骤：

1. **需求分析**
   - 明确功能需求
   - 确定用户交互流程

2. **技术调研**
   - 查阅上述技术文档
   - 测试 FFmpeg 命令是否可行

3. **UI 设计**
   - 参考字幕转换页面布局
   - 创建 React 组件

4. **后端逻辑**
   - 创建主进程服务
   - 封装 FFmpeg 命令
   - 实现 IPC 通信

5. **前端集成**
   - 连接 UI 和后端 API
   - 添加错误处理
   - 实现进度显示

6. **测试**
   - 功能测试
   - 边界条件测试
   - 性能测试

7. **日志和文档**
   - 添加操作日志
   - 更新用户文档

---

## 快速开始下一个功能

### 示例：开发"音视频合并"功能

1. **创建服务类**:
```typescript
// src/main/services/FFmpegService.ts
import ffmpeg from 'fluent-ffmpeg';

export class FFmpegService {
  async mergeAudioVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .videoCodec('copy')
        .audioCodec('aac')
        .on('progress', (progress) => {
          if (onProgress) onProgress(progress.percent || 0);
        })
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }
}
```

2. **创建UI组件**:
```typescript
// src/renderer/components/Features/MergeTab.tsx
import { useState } from 'react';
import { Button, Form, ProgressBar } from 'react-bootstrap';

function MergeTab() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  
  const handleMerge = async () => {
    // 调用主进程 FFmpeg 服务
    // 显示进度
    // 下载结果
  };
  
  return (
    <div>
      <h2>音视频合并</h2>
      {/* UI 实现 */}
    </div>
  );
}
```

3. **在侧边栏添加入口**:
```typescript
// src/renderer/components/Layout/Sidebar.tsx
// 取消 "音视频合并" 的 "开发中..." 状态
```

---

## 需要帮助？

如果在开发过程中遇到问题，可以：
1. 查阅上述技术文档链接
2. 查看已完成的字幕转换功能作为参考
3. 搜索 FFmpeg 相关的 StackOverflow 问题
4. 查看 `VideoTool-中文.md` 项目文档

--- **祝开发顺利！🎉**
