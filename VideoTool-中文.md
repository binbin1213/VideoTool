# VideoTool 视频处理软件 - 完整技术规格文档

## 📋 项目概述

VideoTool 是一款功能强大的跨平台视频处理桌面应用程序，提供音视频合并、视频转码压缩、字幕烧录等核心功能，以及丰富的视频编辑工具。

**设计理念**：简单易用、功能强大、性能优异、完全本地化处理

---

## 🎯 核心功能

### 1. 音视频合并
- 将音频和视频文件合并为单个输出文件（支持MP4、MOV、MKV等）
- **内置预设**：高质量、快速处理、平衡模式等
- **自定义设置**：
  - 视频编解码器（H.264、H.265、VP9等）
  - 音频编解码器（AAC、MP3、FLAC等）
  - 比特率、分辨率、帧率控制
  - 音频采样率和声道配置
- **设置管理**：支持预设的导入/导出（JSON格式）

### 2. 视频转码和压缩
- **输入格式支持**：MP4、AVI、MKV、MOV、FLV、WebM、WMV、MPEG等
- **输出格式支持**：MP4、MOV、MKV、WebM、AVI等
- **压缩选项**：
  - 分辨率调整（4K、1080p、720p、480p或自定义）
  - 比特率控制（CBR、VBR）
  - 编码质量预设（CRF值控制）
  - 目标文件大小设置（自动计算参数）
- **智能压缩**：AI分析推荐最佳压缩参数
- **预设和自定义设置**：JSON导入/导出

### 3. 字幕烧录/封装 ⭐ v1.1.0 重大升级

#### 3.1 硬字幕模式（烧录）
- **支持格式**：SRT、ASS、SSA、VTT
- **字幕样式自定义**：
  - 字体选择和大小
  - 颜色和描边
  - 位置和对齐方式
  - 阴影和背景
- **高级功能**：
  - 质量预设（H.264高质量/平衡/硬件加速，H.265小体积）
  - CRF 质量控制（18-28）
  - 编码速度预设（ultrafast ~ veryslow）
  - 硬件加速支持（VideoToolbox/NVENC/QSV）
- **特点**：
  - 字幕永久嵌入视频画面
  - 不可关闭或切换
  - 需要重新编码视频
  - 输出为 MP4 格式

#### 3.2 软字幕模式（封装）⭐ 新增
- **支持格式**：SRT、ASS
- **多轨道支持**：
  - 同时选择多个字幕文件
  - 无数量限制
  - 自动识别语言代码（从文件名）
  - 自动设置元数据（语言标签和显示名称）
- **支持的语言代码**：
  - `zh-Hans` (简体中文)
  - `zh-Hant` (繁体中文)
  - `en` (英语)
  - `ja` (日语)
  - `ko` (韩语)
  - `es` (西班牙语)
  - `fr` (法语)
  - `de` (德语)
  - `pt` (葡萄牙语)
  - `th` (泰语)
  - `vi` (越南语)
  - `id` (印尼语)
  - `hi` (印地语)
- **文件命名格式**：`视频名称.语言代码.srt`（如：`video.zh-Hans.srt`）
- **特点**：
  - 字幕作为独立轨道，播放器可开关
  - 视频和音频直接复制，无需重新编码
  - 处理速度极快
  - 输出为 MKV 格式
  - 支持多语言字幕轨道

### 4. 字幕格式转换 ⭐ v1.1.0 重大升级

#### 4.1 SRT转ASS转换器

**核心流程**：
```
SRT文件 → 正则预处理 → 解析SRT → 应用ASS样式 → 添加水印（可选） → 生成ASS文件
```

**v1.1.0 新增功能**：
- ✨ **批量转换**: 一次选择多个SRT文件批量转换
- 🎨 **样式编辑器**: 可视化编辑ASS样式参数
- 👁️ **实时预览**: 预览样式效果和水印位置
- 💾 **自定义预设**: 保存和管理自定义样式
- 🔖 **字幕水印**: 添加文字水印到字幕中

**功能特性**：

##### 正则替换预处理
在转换前必须应用以下正则替换规则（按顺序执行）：

| 序号 | 正则表达式 | 替换为 | 说明 |
|------|-----------|--------|------|
| 1 | `</?i>` | 空字符串 | 移除斜体标签`<i>`和`</i>` |
| 2 | `[""]+` | 空字符串 | 移除中文引号"" |
| 3 | `\s*[，。；、~·？！￥—]+\s*` | 一个空格 | 替换中文标点符号（逗号、句号、分号等） |
| 4 | `(?<!^)\s*-\s*` | 空格+`-` | 格式化非开头位置的连字符，移除多余空格 |
| 5 | `^\s*-\s*` | `-` | 格式化开头的连字符 |
| 6 | `[,?!;'"{}]+` | 一个空格 | 替换英文标点符号 |
| 7 | `(^\s+)\|(\s+$)` | 空字符串 | 移除字幕文本开头和结尾的所有空格 |

**处理示例**：
```
原始文本: "  你好，世界！这是一段<i>测试</i>字幕。  "
处理后:   "你好 世界 这是一段测试字幕 "
```

##### ASS样式模板系统

**内置样式模板**（基于提供的字幕样式.txt）：

1. **双语 原文**
   - 字体：微软雅黑，14号
   - 颜色：白色 (#FFFFFF)
   - 描边：0.5像素
   - 位置：底部居中
   - 用途：双语字幕的原文部分

2. **双语 译文**
   - 字体：Microsoft YaHei，18号，加粗
   - 颜色：白色 (#FFFFFF)
   - 描边：0.5像素
   - 位置：底部居中
   - 用途：双语字幕的译文部分

3. **双语 歌词 白色**
   - 字体：微软雅黑，10号，加粗斜体
   - 颜色：白色 (#FFFFFF)
   - 对齐：居中偏上
   - 用途：歌词字幕

4. **歌词 顶部 蓝色**
   - 字体：Microsoft YaHei，15号，加粗
   - 颜色：橙蓝色 (#FFAA55)
   - 位置：顶部居中
   - 用途：顶部歌词显示

5. **译文字幕 底部**
   - 字体：Microsoft YaHei，18号，加粗
   - 颜色：白色 (#FFFFFF)
   - 位置：底部，边距10
   - 用途：常规译文字幕

6. **译文字幕 顶部**
   - 字体：Microsoft YaHei，18号，加粗
   - 颜色：白色 (#FFFFFF)
   - 位置：顶部，边距10
   - 用途：顶部译文字幕

7. **译文字幕 贴底**
   - 字体：Microsoft YaHei，18号，加粗
   - 颜色：白色 (#FFFFFF)
   - 位置：贴底（边距0）
   - 用途：紧贴底部的字幕

8. **演职人员 左/右**
   - 字体：Microsoft YaHei，13号，加粗
   - 颜色：白色 (#FFFFFF)
   - 对齐：左对齐/右对齐
   - 用途：片头片尾演职人员名单

9. **注 底部/顶部/贴底**
   - 字体：Microsoft YaHei，13号，加粗
   - 颜色：白色 (#FFFFFF)
   - 位置：底部/顶部/贴底
   - 用途：注释说明文字

**完整ASS样式定义**：
```ass
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding, LineSpacing

Style: 双语 原文,微软雅黑,14,&H00FFFFFF,&H004E4E4E,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0.5,0,2,5,5,3,1,0
Style: 双语 译文,Microsoft YaHei,18,&H00FFFFFF,&H004E4E4E,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,5,5,3,1,0
Style: 双语 歌词 白色,微软雅黑,10,&H00FFFFFF,&H004E4E4E,&H00000000,&H00000000,1,1,0,0,100,100,0,0,1,0.5,0,7,10,10,10,1,0
Style: 歌词 顶部 蓝色,Microsoft YaHei,15,&H00FFAA55,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,8,5,5,10,1,0
Style: 译文字幕 底部,Microsoft YaHei,18,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,5,5,10,1,1
Style: 译文字幕 顶部,Microsoft YaHei,18,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,8,5,5,10,1,1
Style: 译文字幕 贴底,Microsoft YaHei,18,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,5,5,0,1,1
Style: 演职人员 右,Microsoft YaHei,13,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,3,0,15,10,1,1
Style: 演职人员 左,Microsoft YaHei,13,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,1,15,0,10,1,1
Style: 注 底部,Microsoft YaHei,13,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,5,5,10,1,1
Style: 注 顶部,Microsoft YaHei,13,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,8,5,5,10,1,1
Style: 注 贴底,Microsoft YaHei,13,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,5,5,0,1,1
```

##### 用户界面功能

1. **正则规则管理**
   - 内置默认规则（上述7条规则）
   - 支持自定义添加/编辑/删除规则
   - 规则启用/禁用开关
   - 规则优先级调整（拖拽排序）
   - 规则导入/导出（JSON格式）
   - 正则表达式测试器（实时测试）

2. **样式选择器**
   - 下拉菜单选择默认样式
   - 支持多样式选择（为不同类型字幕应用不同样式）
   - 样式预览窗口
   - 自定义样式编辑器
   - 样式模板导入（支持导入.ass样式文件）

3. **转换预览**
   - 实时预览转换后效果
   - 对比视图（SRT原文 vs ASS效果）
   - 支持逐条预览
   - 时间轴可视化

4. **批量转换**
   - 批量导入多个SRT文件
   - 统一应用相同规则和样式
   - 进度显示
   - 错误报告

5. **高级选项**
   - 字符编码选择（UTF-8、GBK、GB2312等）
   - 分辨率设置（PlayResX/PlayResY）
   - 时间偏移调整
   - 输出文件命名规则

#### 4.2 转换工作流

```
┌─────────────────────────────────────┐
│  1. 选择SRT文件                      │
│     - 单个文件                       │
│     - 批量文件                       │
│     - 拖拽上传                       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. 配置正则替换规则                 │
│     - 使用默认规则                   │
│     - 自定义规则                     │
│     - 启用/禁用特定规则              │
│     - 实时预览替换效果               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. 选择ASS样式                      │
│     - 从预设样式中选择               │
│     - 导入自定义样式模板             │
│     - 编辑样式参数                   │
│     - 预览样式效果                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. 高级设置（可选）                 │
│     - 字符编码                       │
│     - 视频分辨率                     │
│     - 时间偏移                       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. 预览和确认                       │
│     - 查看转换预览                   │
│     - 对比原始和处理后               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  6. 执行转换                         │
│     - 显示进度                       │
│     - 错误处理                       │
│     - 生成ASS文件                    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  7. 完成                             │
│     - 打开输出文件夹                 │
│     - 查看转换日志                   │
│     - 继续转换其他文件               │
└─────────────────────────────────────┘
```

#### 4.3 技术实现要点

**正则替换引擎**：
```typescript
interface RegexRule {
  id: string;
  name: string;
  pattern: string;        // 正则表达式
  replacement: string;    // 替换文本
  description: string;    // 规则说明
  enabled: boolean;       // 是否启用
  order: number;          // 执行顺序
}

class RegexProcessor {
  private rules: RegexRule[];
  
  // 应用所有启用的规则
  applyRules(text: string): string {
    let result = text;
    const enabledRules = this.rules
      .filter(r => r.enabled)
      .sort((a, b) => a.order - b.order);
    
    for (const rule of enabledRules) {
      const regex = new RegExp(rule.pattern, 'g');
      result = result.replace(regex, rule.replacement);
    }
    
    return result;
  }
  
  // 测试单个规则
  testRule(text: string, rule: RegexRule): string {
    const regex = new RegExp(rule.pattern, 'g');
    return text.replace(regex, rule.replacement);
  }
}
```

**SRT解析器**：
```typescript
interface SRTSubtitle {
  index: number;
  startTime: string;  // "00:00:00,000"
  endTime: string;    // "00:00:06,800"
  text: string;       // 字幕文本
}

class SRTParser {
  parse(srtContent: string): SRTSubtitle[] {
    // 解析SRT格式
    // 返回字幕数组
  }
}
```

**ASS生成器**：
```typescript
interface ASSStyle {
  name: string;
  fontname: string;
  fontsize: number;
  primaryColour: string;
  secondaryColour: string;
  outlineColour: string;
  backColour: string;
  bold: number;
  italic: number;
  // ... 其他样式属性
}

class ASSGenerator {
  private styles: ASSStyle[];
  
  generate(
    subtitles: SRTSubtitle[], 
    selectedStyle: string,
    options: ASSOptions
  ): string {
    // 生成ASS文件内容
    // 包含：[Script Info], [V4+ Styles], [Events]
  }
}
```

**完整转换流程**：
```typescript
class SubtitleConverter {
  async convertSrtToAss(
    srtFilePath: string,
    assFilePath: string,
    options: ConvertOptions
  ): Promise<void> {
    // 1. 读取SRT文件
    const srtContent = await fs.readFile(srtFilePath, options.encoding);
    
    // 2. 应用正则替换
    const processor = new RegexProcessor(options.regexRules);
    const processedContent = this.processSubtitles(srtContent, processor);
    
    // 3. 解析SRT
    const parser = new SRTParser();
    const subtitles = parser.parse(processedContent);
    
    // 4. 生成ASS
    const generator = new ASSGenerator(options.styles);
    const assContent = generator.generate(
      subtitles, 
      options.selectedStyle,
      options.assOptions
    );
    
    // 5. 保存ASS文件
    await fs.writeFile(assFilePath, assContent, 'utf-8');
  }
  
  private processSubtitles(
    content: string, 
    processor: RegexProcessor
  ): string {
    // 按字幕条目分割
    const entries = content.split(/\n\n+/);
    
    return entries.map(entry => {
      const lines = entry.split('\n');
      if (lines.length >= 3) {
        // 处理字幕文本（第3行开始）
        const textLines = lines.slice(2);
        const processedText = textLines
          .map(line => processor.applyRules(line))
          .join('\n');
        
        return [...lines.slice(0, 2), processedText].join('\n');
      }
      return entry;
    }).join('\n\n');
  }
}
```

#### 4.4 配置文件格式

**正则规则配置（regex-rules.json）**：
```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "rule-001",
      "name": "移除斜体标签",
      "pattern": "</?i>",
      "replacement": "",
      "description": "用于替换<i>和</i>",
      "enabled": true,
      "order": 1
    },
    {
      "id": "rule-002",
      "name": "移除中文引号",
      "pattern": "[\"\"]+",
      "replacement": "",
      "description": "用于替换""中文标点",
      "enabled": true,
      "order": 2
    },
    {
      "id": "rule-003",
      "name": "替换中文标点",
      "pattern": "\\s*[，。；、~·？！￥—]+\\s*",
      "replacement": " ",
      "description": "用于替换中文标点符号",
      "enabled": true,
      "order": 3
    },
    {
      "id": "rule-004",
      "name": "格式化连字符（非开头）",
      "pattern": "(?<!^)\\s*-\\s*",
      "replacement": " -",
      "description": "用于替换不在开头的-中的多余空格",
      "enabled": true,
      "order": 4
    },
    {
      "id": "rule-005",
      "name": "格式化连字符（开头）",
      "pattern": "^\\s*-\\s*",
      "replacement": "-",
      "description": "用于格式化在开头的-",
      "enabled": true,
      "order": 5
    },
    {
      "id": "rule-006",
      "name": "替换英文标点",
      "pattern": "[,?!;'\"{}]+",
      "replacement": " ",
      "description": "用于替换英文标点",
      "enabled": true,
      "order": 6
    },
    {
      "id": "rule-007",
      "name": "清理首尾空格",
      "pattern": "(^\\s+)|(\\s+$)",
      "replacement": "",
      "description": "用于去除字幕开头和结尾的所有空格",
      "enabled": true,
      "order": 7
    }
  ]
}
```

**转换配置示例（convert-config.json）**：
```json
{
  "encoding": "utf-8",
  "defaultStyle": "译文字幕 底部",
  "resolution": {
    "width": 384,
    "height": 288
  },
  "timeOffset": 0,
  "outputNaming": "{filename}.ass",
  "applyRegexRules": true,
  "regexRulesFile": "./regex-rules.json",
  "styleTemplateFile": "./字幕样式.txt"
}
```

### 5. 批量处理 ⭐ 新增
- 批量导入多个文件
- 队列管理系统
  - 查看、添加、删除任务
  - 暂停、恢复、取消任务
  - 任务优先级调整
- 批量应用相同设置
- 并行处理（多任务同时进行）

### 5. 视频编辑工具 ⭐ 新增

#### 5.1 视频裁剪/剪辑
- 精确时间段选择
- 时间轴可视化编辑
- 多段剪辑合并
- 关键帧预览

#### 5.2 视频旋转/翻转
- 90°、180°、270°旋转
- 水平/垂直翻转
- 自动调整分辨率

#### 5.3 添加水印
- 图片水印（PNG、JPG支持透明度）
- 文字水印（自定义字体、颜色、透明度）
- 位置和大小调整
- 时间范围控制（全程或指定时间段）

#### 5.4 音频处理
- 从视频提取音频
- 音频替换
- 音量调节和淡入淡出
- 音频格式转换（MP3、AAC、FLAC、WAV、OGG）

#### 5.5 视频分割
- 按时长分割
- 按文件大小分割
- 手动指定分割点
- 批量输出

#### 5.6 GIF生成
- 视频片段转GIF
- 帧率和质量控制
- 循环次数设置
- 文件大小优化

---

## 💻 支持平台

### macOS
- **架构**：x86_64（Intel）和 ARM64（Apple Silicon）通用二进制
- **最低版本**：macOS 10.15 (Catalina)
- **推荐版本**：macOS 12+ (Monterey及以上)
- **特性支持**：
  - 代码签名和公证
  - DMG安装包美化
  - Retina显示屏优化

### Windows
- **架构**：x64
- **最低版本**：Windows 10 (1809或更高版本)
- **推荐版本**：Windows 11
- **特性支持**：
  - 代码签名
  - NSIS安装程序
  - 开始菜单集成

---

## 🎨 用户界面设计

### 整体布局
- **现代化设计**：遵循Material Design或Fluent Design设计规范
- **响应式界面**：适配不同分辨率和窗口大小
- **标签页导航**：每个核心功能独立标签页
- **深色/浅色主题**：支持主题切换和系统主题跟随

### 主要组件

#### 1. 文件选择器
- 拖拽上传支持
- 文件浏览器选择
- 最近使用文件列表
- 文件信息显示（时长、分辨率、编解码器、文件大小）

#### 2. 设置面板
- 预设选择下拉菜单
- 自定义参数表单
- 设置预览和验证
- 保存/加载设置配置

#### 3. 预览窗口
- 视频播放器集成（video.js）
- 播放控制（播放/暂停、快进/倒退、进度条）
- 截图功能
- 处理前后对比视图
- 实时效果预览（特别是字幕和水印）

#### 4. 进度显示
- 实时进度条（百分比）
- 详细信息：
  - 当前处理速度（fps）
  - 已用时间/剩余时间
  - 当前文件大小/预估最终大小
- 多任务进度列表

#### 5. 日志控制台
- 实时处理日志
- 不同级别日志（信息、警告、错误）
- 日志搜索和过滤
- 日志导出功能
- 清除日志按钮

#### 6. 工具栏
- 快捷操作按钮
- 设置和帮助入口
- 语言切换
- 主题切换

### 多语言支持 ⭐ 新增
- 简体中文
- English
- 日本語（可扩展）
- 一键切换，实时生效

### 交互优化 ⭐ 新增
- **键盘快捷键**：
  - `Ctrl/Cmd + O`：打开文件
  - `Ctrl/Cmd + S`：保存设置
  - `Ctrl/Cmd + Enter`：开始处理
  - `Esc`：取消当前任务
  - `F11`：全屏预览
- **右键菜单**：快捷操作
- **Tooltip提示**：功能说明
- **操作引导**：首次使用向导

---

## 🏗️ 技术架构

### 整体框架
```
┌─────────────────────────────────────────┐
│         Electron Desktop App             │
├─────────────────────────────────────────┤
│  UI Layer (React + TypeScript)          │
│  ├─ Components (功能组件)               │
│  ├─ State Management (Zustand/Redux)    │
│  └─ Styling (SCSS/Tailwind CSS)         │
├─────────────────────────────────────────┤
│  Business Logic Layer (Node.js)         │
│  ├─ FFmpeg Wrapper (命令生成和执行)     │
│  ├─ Task Manager (任务队列管理)         │
│  ├─ Settings Manager (配置管理)         │
│  └─ File Manager (文件操作)             │
├─────────────────────────────────────────┤
│  IPC Communication (进程间通信)          │
├─────────────────────────────────────────┤
│  Native Layer                            │
│  ├─ FFmpeg (视频处理引擎)               │
│  ├─ File System (文件系统)              │
│  └─ Hardware Acceleration (硬件加速)    │
└─────────────────────────────────────────┘
```

### 核心技术栈

#### 前端框架
- **Electron.js 28+**：桌面应用框架
- **React 18+**：UI组件库
- **TypeScript 5+**：类型安全的JavaScript ⭐ 新增
- **React Router**：路由管理
- **Zustand** 或 **Redux Toolkit**：状态管理 ⭐ 新增

#### UI组件库
- **React Bootstrap 2+** 或 **Ant Design**：UI组件
- **Tailwind CSS** 或 **SCSS**：样式解决方案 ⭐ 新增
- **react-icons**：图标库
- **video.js**：视频播放器 ⭐ 新增

#### 后端逻辑
- **Node.js 18+**：业务逻辑层
- **child_process**：FFmpeg进程管理
- **fluent-ffmpeg**：FFmpeg命令封装
- **fs-extra**：增强的文件系统操作

#### 数据存储
- **electron-store**：配置持久化
- **JSON**：设置和预设存储
- **lowdb** 或 **SQLite**：历史记录存储 ⭐ 新增

#### FFmpeg集成
- **@ffmpeg-installer/ffmpeg**：FFmpeg二进制文件
- **ffprobe-static**：视频信息探测
- **动态下载**：首次运行时下载FFmpeg（可选） ⭐ 新增

#### 工具库
- **i18next + react-i18next**：国际化 ⭐ 新增
- **dayjs**：日期时间处理 ⭐ 新增
- **classnames**：CSS类名管理 ⭐ 新增
- **electron-log**：日志管理 ⭐ 新增
- **electron-updater**：自动更新 ⭐ 新增

#### 开发工具 ⭐ 新增
- **ESLint + Prettier**：代码规范
- **Jest**：单元测试
- **Playwright** 或 **Spectron**：E2E测试
- **electron-builder**：打包构建
- **Webpack** 或 **Vite**：模块打包

---

## 📁 项目结构

```plaintext
VideoTool/
├── src/
│   ├── main/                          # Electron主进程
│   │   ├── index.ts                   # 主进程入口
│   │   ├── window.ts                  # 窗口管理
│   │   ├── ipc/                       # IPC处理器
│   │   │   ├── ffmpeg.handler.ts      # FFmpeg相关IPC
│   │   │   ├── file.handler.ts        # 文件操作IPC
│   │   │   ├── settings.handler.ts    # 设置相关IPC
│   │   │   └── subtitle.handler.ts    # 字幕转换IPC ⭐ 新增
│   │   ├── services/                  # 服务层
│   │   │   ├── FFmpegService.ts       # FFmpeg服务
│   │   │   ├── TaskService.ts         # 任务管理服务
│   │   │   ├── SettingsService.ts     # 设置管理服务
│   │   │   └── SubtitleService.ts     # 字幕转换服务 ⭐ 新增
│   │   └── utils/                     # 工具函数
│   │       ├── ffmpeg.util.ts         # FFmpeg工具
│   │       ├── file.util.ts           # 文件工具
│   │       ├── subtitle/              # 字幕工具 ⭐ 新增
│   │       │   ├── RegexProcessor.ts  # 正则替换引擎
│   │       │   ├── SRTParser.ts       # SRT解析器
│   │       │   ├── ASSGenerator.ts    # ASS生成器
│   │       │   └── SubtitleConverter.ts  # 字幕转换器
│   │       └── logger.ts              # 日志工具
│   │
│   ├── renderer/                      # Electron渲染进程
│   │   ├── index.tsx                  # 渲染进程入口
│   │   ├── App.tsx                    # 根组件
│   │   ├── components/                # React组件
│   │   │   ├── Layout/                # 布局组件
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── Common/                # 通用组件
│   │   │   │   ├── FileSelector.tsx
│   │   │   │   ├── Progress.tsx
│   │   │   │   ├── Preview.tsx
│   │   │   │   ├── LogConsole.tsx
│   │   │   │   └── SettingsPanel.tsx
│   │   │   └── Features/              # 功能组件
│   │   │       ├── MergeTab.tsx       # 合并功能
│   │   │       ├── TranscodeTab.tsx   # 转码功能
│   │   │       ├── SubtitleTab.tsx    # 字幕烧录功能
│   │   │       ├── SubtitleConvertTab.tsx  # 字幕转换功能 ⭐ 新增
│   │   │       ├── BatchTab.tsx       # 批量处理
│   │   │       ├── CropTab.tsx        # 裁剪功能
│   │   │       ├── WatermarkTab.tsx   # 水印功能
│   │   │       └── ToolsTab.tsx       # 其他工具
│   │   │
│   │   ├── hooks/                     # 自定义Hooks
│   │   │   ├── useFFmpeg.ts
│   │   │   ├── useSettings.ts
│   │   │   ├── useTaskQueue.ts
│   │   │   ├── useSubtitleConvert.ts  # 字幕转换Hook ⭐ 新增
│   │   │   └── useTheme.ts
│   │   │
│   │   ├── store/                     # 状态管理
│   │   │   ├── index.ts
│   │   │   ├── slices/
│   │   │   │   ├── task.slice.ts
│   │   │   │   ├── settings.slice.ts
│   │   │   │   └── ui.slice.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── styles/                    # 样式文件
│   │   │   ├── global.scss
│   │   │   ├── themes/
│   │   │   │   ├── light.scss
│   │   │   │   └── dark.scss
│   │   │   └── components/
│   │   │
│   │   ├── locales/                   # 国际化文件
│   │   │   ├── zh-CN.json
│   │   │   ├── en-US.json
│   │   │   └── ja-JP.json
│   │   │
│   │   ├── types/                     # TypeScript类型定义
│   │   │   ├── ffmpeg.types.ts
│   │   │   ├── task.types.ts
│   │   │   ├── settings.types.ts
│   │   │   └── subtitle.types.ts      # 字幕转换类型 ⭐ 新增
│   │   │
│   │   └── utils/                     # 渲染进程工具
│   │       ├── format.ts              # 格式化工具
│   │       ├── validation.ts          # 验证工具
│   │       └── constants.ts           # 常量定义
│   │
│   └── shared/                        # 共享代码
│       ├── constants.ts               # 全局常量
│       ├── types.ts                   # 共享类型
│       └── presets/                   # 预设配置
│           ├── merge.presets.json
│           ├── transcode.presets.json
│           ├── subtitle.presets.json
│           ├── subtitle-convert/      # 字幕转换预设 ⭐ 新增
│           │   ├── regex-rules.json   # 正则替换规则
│           │   ├── ass-styles.txt     # ASS样式模板
│           │   └── convert-config.json # 转换配置
│
├── public/                            # 静态资源
│   ├── index.html                     # HTML模板
│   ├── icons/                         # 应用图标
│   │   ├── icon.icns                  # macOS图标
│   │   ├── icon.ico                   # Windows图标
│   │   └── icon.png                   # 通用图标
│   └── assets/                        # 其他资源
│       ├── images/
│       └── fonts/
│
├── resources/                         # 构建资源
│   ├── ffmpeg/                        # FFmpeg二进制
│   │   ├── darwin-x64/
│   │   ├── darwin-arm64/
│   │   └── win32-x64/
│   └── installer/                     # 安装程序资源
│
├── tests/                             # 测试文件
│   ├── unit/                          # 单元测试
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                   # 集成测试
│   └── e2e/                           # 端到端测试
│
├── scripts/                           # 构建脚本
│   ├── build.js                       # 构建脚本
│   ├── dev.js                         # 开发脚本
│   └── download-ffmpeg.js             # FFmpeg下载脚本
│
├── docs/                              # 文档
│   ├── API.md                         # API文档
│   ├── ARCHITECTURE.md                # 架构文档
│   └── CONTRIBUTING.md                # 贡献指南
│
├── .github/                           # GitHub配置
│   └── workflows/                     # CI/CD工作流
│       ├── build.yml
│       └── test.yml
│
├── package.json                       # 项目配置
├── tsconfig.json                      # TypeScript配置
├── .eslintrc.js                       # ESLint配置
├── .prettierrc                        # Prettier配置
├── electron-builder.yml               # 打包配置
├── README.md                          # 项目说明
└── LICENSE                            # 许可证
```

---

## 📦 核心模块详解

### 1. FFmpegWrapper（FFmpeg封装器）

**职责**：生成和执行FFmpeg命令

**主要功能**：
- 命令生成器（基于用户设置生成FFmpeg命令）
- 进程管理（启动、监控、终止FFmpeg进程）
- 进度解析（解析FFmpeg输出获取进度信息）
- 错误处理（捕获和解析FFmpeg错误）

**接口示例**：
```typescript
interface FFmpegWrapper {
  merge(audioPath: string, videoPath: string, outputPath: string, options: MergeOptions): Promise<void>;
  transcode(inputPath: string, outputPath: string, options: TranscodeOptions): Promise<void>;
  burnSubtitle(videoPath: string, subtitlePath: string, outputPath: string, options: SubtitleOptions): Promise<void>;
  getVideoInfo(filePath: string): Promise<VideoInfo>;
  cancel(taskId: string): void;
  onProgress(callback: (progress: Progress) => void): void;
}
```

**优化特性** ⭐：
- 硬件加速支持（NVIDIA NVENC、AMD VCE、Intel QSV）
- 多线程编码
- 自动选择最优编码参数

### 2. TaskManager（任务管理器）

**职责**：管理视频处理任务队列

**主要功能**：
- 任务队列管理（FIFO、优先级队列）
- 并发控制（同时运行的最大任务数）
- 任务状态追踪（待处理、处理中、已完成、失败）
- 断点续传（任务中断后恢复）⭐ 新增
- 任务历史记录 ⭐ 新增

**接口示例**：
```typescript
interface TaskManager {
  addTask(task: Task): string;
  removeTask(taskId: string): void;
  pauseTask(taskId: string): void;
  resumeTask(taskId: string): void;
  cancelTask(taskId: string): void;
  getTaskStatus(taskId: string): TaskStatus;
  getTaskQueue(): Task[];
  setMaxConcurrency(max: number): void;
  retryFailedTask(taskId: string): void; // 新增
}
```

### 3. SettingsManager（设置管理器）

**职责**：管理用户设置和预设

**主要功能**：
- 预设加载和保存
- 自定义设置验证
- 设置导入/导出（JSON格式）
- 默认设置管理
- 设置历史记录 ⭐ 新增
- 云同步（可选）⭐ 新增

**接口示例**：
```typescript
interface SettingsManager {
  loadPresets(feature: FeatureType): Preset[];
  savePreset(feature: FeatureType, preset: Preset): void;
  deletePreset(feature: FeatureType, presetId: string): void;
  exportSettings(filePath: string): void;
  importSettings(filePath: string): Settings;
  getDefaultSettings(feature: FeatureType): Settings;
  validateSettings(settings: Settings): ValidationResult;
}
```

### 4. FileManager（文件管理器）⭐ 新增

**职责**：文件操作和管理

**主要功能**：
- 文件信息读取
- 临时文件管理
- 磁盘空间检查
- 文件备份和恢复
- 文件命名规则

**接口示例**：
```typescript
interface FileManager {
  getFileInfo(filePath: string): Promise<FileInfo>;
  checkDiskSpace(path: string): Promise<DiskSpace>;
  createTempFile(extension: string): string;
  cleanupTempFiles(): void;
  backupFile(filePath: string): Promise<string>;
  generateOutputName(inputPath: string, options: NamingOptions): string;
}
```

### 5. SubtitleConverter（字幕转换器）⭐ 新增

**职责**：SRT字幕转换为ASS格式，支持正则预处理和样式应用

**主要功能**：
- 正则替换预处理（应用7条内置规则）
- SRT格式解析
- ASS格式生成
- 样式模板管理
- 批量转换支持
- 转换预览和验证

**核心组件**：

#### 5.1 RegexProcessor（正则处理器）
```typescript
interface RegexRule {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  description: string;
  enabled: boolean;
  order: number;
}

class RegexProcessor {
  constructor(rules: RegexRule[]);
  applyRules(text: string): string;
  testRule(text: string, rule: RegexRule): string;
  addRule(rule: RegexRule): void;
  removeRule(ruleId: string): void;
  updateRule(ruleId: string, updates: Partial<RegexRule>): void;
  enableRule(ruleId: string, enabled: boolean): void;
  reorderRules(ruleIds: string[]): void;
  exportRules(): string; // JSON格式
  importRules(json: string): void;
}
```

#### 5.2 SRTParser（SRT解析器）
```typescript
interface SRTSubtitle {
  index: number;
  startTime: string;  // "00:00:00,000"
  endTime: string;    // "00:00:06,800"
  text: string;
  originalText?: string; // 处理前的原始文本
}

class SRTParser {
  parse(content: string): SRTSubtitle[];
  validate(content: string): ValidationResult;
  detectEncoding(buffer: Buffer): string;
}
```

#### 5.3 ASSGenerator（ASS生成器）
```typescript
interface ASSStyle {
  name: string;
  fontname: string;
  fontsize: number;
  primaryColour: string;
  secondaryColour: string;
  outlineColour: string;
  backColour: string;
  bold: number;
  italic: number;
  underline: number;
  strikeOut: number;
  scaleX: number;
  scaleY: number;
  spacing: number;
  angle: number;
  borderStyle: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
  marginV: number;
  encoding: number;
  lineSpacing: number;
}

interface ASSOptions {
  resolution: { width: number; height: number };
  scriptType: string;
  wrapStyle: number;
  scaledBorderAndShadow: boolean;
}

class ASSGenerator {
  constructor(styles: ASSStyle[], options: ASSOptions);
  generate(subtitles: SRTSubtitle[], defaultStyle: string): string;
  addStyle(style: ASSStyle): void;
  removeStyle(styleName: string): void;
  getStyles(): ASSStyle[];
  parseStylesFromFile(filePath: string): ASSStyle[];
}
```

#### 5.4 SubtitleConverter（主转换器）
```typescript
interface ConvertOptions {
  encoding: string;
  regexRules: RegexRule[];
  selectedStyle: string;
  styles: ASSStyle[];
  assOptions: ASSOptions;
  applyRegexRules: boolean;
  timeOffset?: number; // 毫秒
}

interface ConvertResult {
  success: boolean;
  outputPath?: string;
  errors?: string[];
  warnings?: string[];
  stats: {
    totalSubtitles: number;
    processedSubtitles: number;
    duration: number; // 毫秒
  };
}

class SubtitleConverter {
  async convertSrtToAss(
    srtFilePath: string,
    assFilePath: string,
    options: ConvertOptions
  ): Promise<ConvertResult>;
  
  async batchConvert(
    files: Array<{ input: string; output: string }>,
    options: ConvertOptions,
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<ConvertResult[]>;
  
  async previewConversion(
    srtContent: string,
    options: ConvertOptions
  ): Promise<string>; // 返回ASS内容预览
  
  validateSRT(filePath: string): Promise<ValidationResult>;
  
  getDefaultRegexRules(): RegexRule[];
  
  getDefaultStyles(): ASSStyle[];
}
```

**使用示例**：
```typescript
// 1. 初始化转换器
const converter = new SubtitleConverter();

// 2. 配置选项
const options: ConvertOptions = {
  encoding: 'utf-8',
  regexRules: converter.getDefaultRegexRules(),
  selectedStyle: '译文字幕 底部',
  styles: converter.getDefaultStyles(),
  assOptions: {
    resolution: { width: 384, height: 288 },
    scriptType: 'v4.00+',
    wrapStyle: 0,
    scaledBorderAndShadow: false
  },
  applyRegexRules: true,
  timeOffset: 0
};

// 3. 转换单个文件
const result = await converter.convertSrtToAss(
  '/path/to/input.srt',
  '/path/to/output.ass',
  options
);

if (result.success) {
  console.log(`转换成功！处理了 ${result.stats.totalSubtitles} 条字幕`);
} else {
  console.error('转换失败：', result.errors);
}

// 4. 批量转换
const files = [
  { input: 'ep01.srt', output: 'ep01.ass' },
  { input: 'ep02.srt', output: 'ep02.ass' }
];

const results = await converter.batchConvert(files, options, (progress, file) => {
  console.log(`处理进度: ${progress}% - ${file}`);
});
```

**内置正则规则**：

| 规则ID | 名称 | 正则 | 替换 | 顺序 |
|--------|------|------|------|------|
| rule-001 | 移除斜体标签 | `</?i>` | `` | 1 |
| rule-002 | 移除中文引号 | `[""]+` | `` | 2 |
| rule-003 | 替换中文标点 | `\s*[，。；、~·？！￥—]+\s*` | ` ` | 3 |
| rule-004 | 格式化连字符（非开头） | `(?<!^)\s*-\s*` | ` -` | 4 |
| rule-005 | 格式化连字符（开头） | `^\s*-\s*` | `-` | 5 |
| rule-006 | 替换英文标点 | `[,?!;'"{}]+` | ` ` | 6 |
| rule-007 | 清理首尾空格 | `(^\s+)\|(\s+$)` | `` | 7 |

**内置样式模板**：共12种样式（双语原文/译文、歌词、演职人员、注释等），详见"字幕格式转换"章节。

---

## ⚡ 性能优化策略

### 1. 硬件加速 ⭐
- **NVIDIA GPU**：使用NVENC编码器（h264_nvenc、hevc_nvenc）
- **AMD GPU**：使用AMF编码器（h264_amf、hevc_amf）
- **Intel GPU**：使用QSV编码器（h264_qsv、hevc_qsv）
- **自动检测**：程序启动时检测可用硬件加速

### 2. 多线程处理 ⭐
- FFmpeg的threads参数优化
- 批量处理时的并行任务
- 充分利用多核CPU

### 3. 内存优化 ⭐
- 大文件分块处理
- 及时释放内存资源
- 临时文件管理优化

### 4. 编码优化 ⭐
- 两次编码（Two-pass encoding）提高质量
- 预设选择（ultrafast、fast、medium、slow）
- CRF值优化

### 5. 缓存策略 ⭐
- 视频信息缓存
- 预览帧缓存
- 设置和预设缓存

---

## 🛡️ 错误处理和恢复

### 1. 错误类型
- **文件错误**：文件不存在、格式不支持、文件损坏
- **参数错误**：设置参数无效、冲突的选项
- **处理错误**：FFmpeg执行失败、编码错误
- **系统错误**：磁盘空间不足、权限不足

### 2. 错误处理策略 ⭐
- **友好的错误提示**：详细说明错误原因和解决方案
- **自动重试**：网络或临时错误自动重试（最多3次）
- **日志记录**：详细记录错误堆栈和上下文
- **错误恢复**：尽可能恢复到上一个稳定状态
- **崩溃报告**：集成Sentry收集崩溃信息

### 3. 断点续传 ⭐
- 保存任务进度
- 检测未完成任务
- 恢复中断任务

---

## 🔐 安全性和隐私

### 1. 数据安全
- **本地处理**：所有处理完全在本地进行，不上传到云端
- **数据加密**：敏感配置使用加密存储
- **权限控制**：最小权限原则

### 2. 文件安全
- **原文件保护**：可选备份原文件
- **临时文件清理**：处理完成后自动删除临时文件
- **安全删除**：覆盖删除敏感文件

### 3. 隐私保护
- **匿名统计**：使用统计数据完全匿名，需用户同意
- **本地存储**：历史记录和设置仅保存在本地
- **清除数据**：提供完全清除数据功能

---

## 📊 数据格式

### 1. 预设配置格式（JSON）

```json
{
  "id": "preset-001",
  "name": "高质量1080p",
  "description": "高质量1080p输出，适合存档",
  "feature": "transcode",
  "settings": {
    "video": {
      "codec": "libx264",
      "resolution": "1920x1080",
      "bitrate": "5000k",
      "fps": 30,
      "preset": "slow",
      "crf": 18
    },
    "audio": {
      "codec": "aac",
      "bitrate": "192k",
      "sampleRate": 48000,
      "channels": 2
    }
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "isBuiltIn": true
}
```

### 2. 任务配置格式

```json
{
  "id": "task-001",
  "type": "transcode",
  "status": "processing",
  "priority": 1,
  "input": {
    "filePath": "/path/to/input.mp4",
    "fileSize": 1073741824,
    "duration": 3600,
    "videoCodec": "h264",
    "audioCodec": "aac"
  },
  "output": {
    "filePath": "/path/to/output.mp4",
    "format": "mp4"
  },
  "settings": {
    "presetId": "preset-001"
  },
  "progress": {
    "percent": 45.5,
    "speed": 2.5,
    "fps": 30,
    "timeElapsed": 600,
    "timeRemaining": 720,
    "currentSize": 524288000
  },
  "createdAt": "2025-01-01T12:00:00Z",
  "startedAt": "2025-01-01T12:00:05Z",
  "completedAt": null,
  "error": null
}
```

### 3. 支持的输入输出格式

**视频格式**：
- 输入：MP4, MOV, AVI, MKV, FLV, WebM, WMV, MPEG, MPG, 3GP, TS, M4V
- 输出：MP4, MOV, MKV, WebM, AVI, FLV

**音频格式**：
- 输入：MP3, AAC, FLAC, WAV, OGG, M4A, WMA, ALAC
- 输出：MP3, AAC, FLAC, WAV, OGG, M4A

**字幕格式**：
- 支持：SRT, ASS, SSA, VTT, SUB

**图片格式**（水印、GIF）：
- 支持：JPG, PNG, GIF, WebP, BMP

---

## 🎓 用户帮助系统

### 1. 内置帮助
- **功能说明**：每个功能页面的详细说明
- **快速入门**：首次使用向导
- **Tooltip提示**：鼠标悬停显示说明
- **示例模板**：预设配置示例

### 2. 文档系统
- **用户手册**：完整的使用指南
- **视频教程**：操作演示视频
- **FAQ**：常见问题解答
- **更新日志**：版本更新说明

### 3. 反馈系统
- **问题报告**：Bug反馈入口
- **功能建议**：新功能建议
- **用户社区**：论坛或Discord群组
- **邮件支持**：技术支持邮箱

---

## 🚀 开发路线图

### 第一阶段：MVP（最小可行产品）- 2个月

**目标**：实现核心功能，发布可用版本

- ✅ 基础架构搭建
  - Electron + React + TypeScript项目初始化
  - 基础UI框架
  - FFmpeg集成
  
- ✅ 核心功能实现
  - 音视频合并
  - 视频转码和压缩
  - 字幕烧录
  
- ✅ 基础设置系统
  - 内置预设
  - 自定义设置
  - JSON导入/导出
  
- ✅ 进度和日志
  - 实时进度显示
  - 基本日志输出
  
- ✅ 基础错误处理

**交付物**：
- Windows和macOS安装包
- 基础用户文档

### 第二阶段：功能增强 - 2个月

**目标**：增强用户体验，添加常用功能

- 🔄 用户体验优化
  - 拖拽上传
  - 主题切换（深色/浅色）
  - 多语言支持（中英文）
  - 键盘快捷键
  
- 🔄 批量处理
  - 任务队列系统
  - 并行处理
  - 任务管理（暂停/恢复/取消）
  
- 🔄 预览功能
  - 视频播放器集成
  - 实时预览效果
  - 截图功能
  
- 🔄 设置系统增强
  - 预设管理优化
  - 最近使用记录
  - 设置搜索

- 🔄 字幕转换功能 ⭐ 新增
  - SRT转ASS转换器
  - 正则替换预处理
  - 样式模板管理
  - 批量转换支持

**交付物**：
- 功能增强版本
- 用户反馈收集

### 第三阶段：高级功能 - 2个月

**目标**：添加专业功能，提升竞争力

- 🔜 视频编辑工具
  - 视频裁剪/剪辑
  - 视频旋转/翻转
  - 添加水印
  - 视频分割
  - GIF生成
  
- 🔜 硬件加速
  - NVIDIA GPU加速
  - AMD GPU加速
  - Intel QSV加速
  - 自动检测和配置
  
- 🔜 音频处理
  - 音频提取
  - 音量调节
  - 音频格式转换
  
- 🔜 高级字幕功能
  - 字幕编辑器
  - 多语言字幕轨道
  - 字幕样式模板
  - ✅ SRT转ASS转换（已在第二阶段完成）

**交付物**：
- 专业版本
- 完整功能文档

### 第四阶段：完善和优化 - 1-2个月

**目标**：完善细节，优化性能

- 🔜 性能优化
  - 内存优化
  - 处理速度优化
  - 启动速度优化
  
- 🔜 稳定性增强
  - 断点续传
  - 自动重试
  - 错误恢复
  
- 🔜 自动更新
  - electron-updater集成
  - 版本检查
  - 增量更新
  
- 🔜 测试完善
  - 单元测试覆盖
  - 集成测试
  - E2E测试
  
- 🔜 云功能（可选）
  - 设置云同步
  - 预设分享社区

**交付物**：
- 稳定版本 v1.0
- 完整测试报告

### 第五阶段：扩展和生态 - 持续

**目标**：构建生态，持续迭代

- 🔜 插件系统
  - 插件API
  - 插件市场
  
- 🔜 AI功能
  - 智能压缩参数推荐
  - 视频内容分析
  - 自动字幕生成
  
- 🔜 更多平台
  - Linux支持
  - Web版本（WebAssembly）
  
- 🔜 企业功能
  - 批量授权
  - 自定义品牌
  - API接口

**交付物**：
- 持续更新
- 社区建设

---

## 📝 开发规范

### 1. 代码规范

**TypeScript规范**：
- 严格模式（strict: true）
- 显式类型声明
- 避免使用any类型
- 使用接口定义数据结构

**命名规范**：
- 组件：PascalCase（如`MergeTab.tsx`）
- 函数和变量：camelCase（如`handleSubmit`）
- 常量：UPPER_SNAKE_CASE（如`MAX_FILE_SIZE`）
- 类型和接口：PascalCase，接口以I开头（如`ITaskConfig`）

**注释规范**：
- 使用JSDoc格式
- 每个函数必须有说明
- 复杂逻辑添加行内注释
- 使用英文注释

**示例**：
```typescript
/**
 * 合并音频和视频文件
 * @param audioPath - 音频文件路径
 * @param videoPath - 视频文件路径
 * @param outputPath - 输出文件路径
 * @param options - 合并选项
 * @returns Promise<void>
 * @throws {FileNotFoundError} 当输入文件不存在时
 */
async function mergeAudioVideo(
  audioPath: string,
  videoPath: string,
  outputPath: string,
  options: IMergeOptions
): Promise<void> {
  // 实现代码
}
```

### 2. Git规范

**分支策略**：
- `main`：主分支，稳定版本
- `develop`：开发分支
- `feature/*`：功能分支
- `bugfix/*`：Bug修复分支
- `release/*`：发布分支

**提交信息格式**（Conventional Commits）：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**：
- `feat`：新功能
- `fix`：Bug修复
- `docs`：文档更新
- `style`：代码格式（不影响代码运行）
- `refactor`：重构
- `perf`：性能优化
- `test`：测试相关
- `chore`：构建过程或辅助工具的变动

**示例**：
```
feat(merge): 添加音视频合并功能

- 实现FFmpeg命令生成
- 添加进度监听
- 支持自定义编码参数

Closes #123
```

### 3. 测试规范

**测试覆盖率要求**：
- 核心模块：> 80%
- 工具函数：> 90%
- UI组件：> 60%

**测试文件命名**：
- 单元测试：`*.test.ts`
- 集成测试：`*.integration.test.ts`
- E2E测试：`*.e2e.test.ts`

**测试结构**：
```typescript
describe('FFmpegWrapper', () => {
  describe('merge', () => {
    it('应该成功合并音视频文件', async () => {
      // Arrange
      const audioPath = '/path/to/audio.mp3';
      const videoPath = '/path/to/video.mp4';
      const outputPath = '/path/to/output.mp4';
      
      // Act
      await ffmpegWrapper.merge(audioPath, videoPath, outputPath);
      
      // Assert
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });
});
```

---

## 📦 package.json 配置

```json
{
  "name": "videotool",
  "version": "1.0.0",
  "description": "强大的跨平台视频处理工具",
  "main": "dist/main/index.js",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "concurrently \"npm run dev:renderer\" \"npm run dev:main\"",
    "dev:renderer": "vite",
    "dev:main": "electron .",
    "build": "npm run build:renderer && npm run build:main",
    "build:renderer": "vite build",
    "build:main": "tsc -p tsconfig.main.json",
    "build:mac": "electron-builder --mac",
    "build:mac:universal": "electron-builder --mac --universal",
    "build:win": "electron-builder --win",
    "build:all": "electron-builder -mw",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,scss}\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  },
  "dependencies": {
    "electron-store": "^8.1.0",
    "fluent-ffmpeg": "^2.1.2",
    "fs-extra": "^11.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "zustand": "^4.4.7",
    "i18next": "^23.7.0",
    "react-i18next": "^14.0.0",
    "dayjs": "^1.11.10",
    "classnames": "^2.5.0",
    "react-bootstrap": "^2.9.0",
    "bootstrap": "^5.3.2",
    "react-icons": "^5.0.0",
    "video.js": "^8.6.0",
    "electron-log": "^5.0.0",
    "electron-updater": "^6.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/fluent-ffmpeg": "^2.1.24",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@vitejs/plugin-react": "^4.2.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@playwright/test": "^1.40.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.2.0",
    "concurrently": "^8.2.0",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    "sass": "^1.69.0"
  },
  "build": {
    "appId": "com.videotool.app",
    "productName": "VideoTool",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64", "universal"]
        }
      ],
      "category": "public.app-category.video",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "win": {
      "target": ["nsis", "portable"],
      "arch": ["x64"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "videotool"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

---

## 🔧 配置文件

### TypeScript配置（tsconfig.json）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"],
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "release"]
}
```

### ESLint配置（.eslintrc.js）

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  env: {
    browser: true,
    node: true,
    es6: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  }
};
```

---

## 🎯 性能指标

### 目标性能指标

- **启动时间**：< 3秒（冷启动）
- **UI响应**：< 100ms
- **内存占用**：< 500MB（空闲状态）
- **处理速度**：
  - 合并：1-2x实时速度
  - 转码：0.5-2x实时速度（取决于设置）
  - 字幕烧录：0.5-1.5x实时速度
- **文件大小**：
  - macOS：< 300MB（含FFmpeg）
  - Windows：< 250MB（含FFmpeg）

### 质量指标

- **崩溃率**：< 0.1%
- **Bug密度**：< 1个/KLOC
- **测试覆盖率**：> 70%
- **用户满意度**：> 4.5/5.0

---

## 📄 许可和版权

### 开源许可
- **推荐**：MIT License（允许商业使用）
- **备选**：GPL v3（要求开源衍生作品）

### 第三方依赖许可
- Electron：MIT
- React：MIT
- FFmpeg：LGPL/GPL（注意分发限制）
- 其他依赖：见各自许可证

### 注意事项
- FFmpeg使用LGPL许可，动态链接可用于商业软件
- 如需静态编译FFmpeg，需考虑GPL许可要求
- 所有第三方依赖许可需在About页面展示

---

## 📞 支持和联系

### 技术支持
- **邮箱**：support@videotool.com
- **GitHub Issues**：https://github.com/username/videotool/issues
- **文档**：https://videotool.com/docs

### 社区
- **Discord**：https://discord.gg/videotool
- **论坛**：https://forum.videotool.com
- **Twitter**：@VideoToolApp

---

## 🎉 总结

VideoTool是一款功能强大、易于使用的跨平台视频处理工具，具有以下特点：

✅ **功能完整**：音视频合并、转码压缩、字幕烧录、**字幕格式转换**、批量处理等
✅ **跨平台**：支持macOS（Intel/Apple Silicon）和Windows
✅ **性能优异**：硬件加速、多线程处理
✅ **用户友好**：现代化UI、多语言、主题切换
✅ **高度可定制**：丰富的预设和自定义选项
✅ **字幕处理专业**：SRT转ASS转换、正则预处理、12种样式模板 ⭐
✅ **完全本地化**：数据不上传，保护隐私
✅ **持续更新**：自动更新、活跃开发

### 🌟 字幕转换功能亮点

VideoTool独有的字幕转换功能，让字幕处理变得简单高效：

- 📝 **智能预处理**：7条内置正则规则，自动清理和格式化字幕文本
- 🎨 **丰富样式**：12种专业ASS样式模板（双语、歌词、演职人员等）
- ⚡ **批量转换**：一键转换多个文件，提高工作效率
- 👁️ **实时预览**：转换前预览效果，确保结果符合预期
- 🔧 **高度灵活**：自定义正则规则、导入样式模板、调整参数
- 💾 **配置管理**：保存常用设置，一键应用

通过遵循本文档的规格说明，可以开发出一款专业级的视频处理工具！

---

**文档版本**：v2.1 ⭐ 新增字幕转换功能  
**最后更新**：2025-10-26  
**维护者**：VideoTool开发团队

