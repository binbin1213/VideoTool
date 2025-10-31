# 更新日志

所有值得注意的项目更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.1.0-dev] - 2025-10-31

### 新增
- **多轨道字幕封装**: 软字幕模式支持同时选择和封装多个语言字幕文件
- **语言自动识别**: 从字幕文件名中自动提取语言代码（支持 `zh-Hans`, `en`, `ja`, `ko`, `es`, `fr`, `de`, `pt`, `th`, `vi`, `id`, `hi`, `zh-Hant` 等13种语言）
- **字幕元数据管理**: 自动为每个字幕轨道设置语言标签和显示名称
- **MKV容器支持**: 软字幕自动使用MKV格式输出，支持多轨道
- **字幕批量转换**: 支持一次选择多个SRT文件批量转换为ASS格式
- **ASS样式编辑器**: 可视化编辑字体、大小、颜色、描边、对齐方式、底部边距等6个核心参数
- **实时样式预览**: 在编辑器中实时预览ASS样式效果，包括主预览区和模拟字幕预览
- **自定义样式预设**: 支持保存、加载和删除自定义ASS样式预设
- **字幕水印功能**: 在ASS字幕中添加可自定义位置的文字水印
- **后端文件保存**: 新增 Electron IPC 处理器，避免浏览器批量下载限制

### 改进
- **UI/UX优化**:
  - 统一表单元素对齐（使用 `FormControls.module.scss` 布局系统）
  - 卡片式文件信息展示，更清晰直观
  - 优化"浏览"按钮设计（字体大小、颜色、边框、间距）
  - 为表单控件添加帮助文本和说明
  - 软字幕文件显示为带语言标签的徽章列表

- **后端增强**:
  - `FFmpegService.embedSoftSubtitles` 方法支持接收字幕路径数组
  - 动态生成多个字幕输入流的 FFmpeg 命令
  - 为每个字幕流自动设置 `-metadata:s:s:X language=CODE` 和 `title=NAME`
  - 输出路径选择对话框支持 MKV/AVI/MOV 等多种格式

- **字幕转换增强**:
  - 样式选择器改为下拉菜单，分组显示"预设样式"和"自定义样式"
  - 字体名称改为下拉选择，内置常见中英文字体
  - 增加描边颜色选项，更好地预览样式效果

### 修复
- 修复批量转换字幕时只保存一个文件的问题（改用 Electron IPC 后端保存）
- 修复软字幕封装时"开始封装"按钮禁用状态判断错误（从 `!subtitleFile` 改为 `subtitleFiles.length === 0`）
- 修复输出文件扩展名不正确的问题（软字幕强制 `.mkv`，硬字幕强制 `.mp4`）
- 修复"浏览"按钮文字溢出和垂直显示问题（调整 `minWidth`、`padding`、`whiteSpace`）
- 修复表单元素对齐不一致的问题（统一使用 `formStyles.fieldWrap` 布局）
- 修复字幕选择区域滚动显示问题（添加 `maxHeight` 和 `overflowY`）

### 技术细节
- 新增文件: `src/main/ipc/subtitle-convert.handlers.ts`
- 新增文件: `src/renderer/styles/components/FormControls.module.scss`
- 修改文件: `src/main/services/FFmpegService.ts` (embedSoftSubtitles 方法)
- 修改文件: `src/main/ipc/merge.handlers.ts` (select-output-path 过滤器)
- 修改文件: `src/renderer/utils/subtitleConverter.ts` (样式管理、水印支持)
- 修改文件: `src/renderer/components/Features/SubtitleBurnTab.tsx` (多文件、UI优化)
- 修改文件: `src/renderer/components/Features/SubtitleConvertTab.tsx` (批量转换、编辑器)

## [1.0.0] - 2025-10-26

### 新增
- 基础项目架构（Electron + React + TypeScript + Vite）
- 字幕格式转换（SRT → ASS），支持正则预处理和样式模板
- 音视频合并功能，支持硬件加速
- 字幕烧录功能（硬字幕模式）
- FFmpeg 自动下载和安装
- 全局日志系统
- 侧边栏导航和固定窗口布局
- macOS 应用打包

### 已知问题
- macOS DMG 安装包生成失败
- 缺少 Windows 平台打包支持

---

## 图例

- `新增` - 新功能
- `改进` - 对现有功能的改进
- `修复` - Bug 修复
- `技术细节` - 技术实现细节和文件变更
- `已知问题` - 当前版本的已知问题
- `废弃` - 即将移除的功能
- `移除` - 已移除的功能
- `安全` - 安全相关的修复

