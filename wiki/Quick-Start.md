# 快速开始

本指南将帮助您快速上手 VideoTool。

---

## 安装

### 下载安装包（推荐）

访问 [Releases 页面](https://github.com/binbin1213/VideoTool/releases) 下载最新版本：

- **macOS**: `VideoTool-{version}-universal.dmg` (支持 Intel 和 Apple Silicon)
- **Windows**: `VideoTool-Setup-{version}.exe` (安装版) 或便携版

### 从源码构建

```bash
# 1. 克隆仓库
git clone https://github.com/binbin1213/VideoTool.git
cd VideoTool

# 2. 安装依赖
pnpm install

# 3. 启动开发模式
pnpm dev
```

---

## 首次启动

### FFmpeg 检测

首次启动时，应用会自动检测 FFmpeg：
- 已安装：直接使用
- 未安装：点击"立即安装 FFmpeg"按钮一键安装

---

## 使用字幕转换

### 步骤 1：选择文件

- **点击上传**：点击"选择SRT文件"区域
- **拖拽上传**：从文件管理器拖拽 .srt 文件

### 步骤 2：配置选项

**ASS样式模板**（14种可选）：
- 译文字幕 底部（推荐）
- 译文字幕 顶部
- 双语 原文 / 译文
- 歌词样式
- 演职人员名单
- 注释文字

**正则替换规则**（7条）：
- 移除 HTML 标签
- 移除中文引号
- 替换标点符号
- 格式化连字符
- 清理首尾空格

### 步骤 3：开始转换

1. 点击"开始转换"按钮
2. 观察进度显示
3. 完成后自动下载 .ass 文件

---

## 使用音视频合并

### 步骤 1：选择文件

1. 选择视频文件
2. 选择音频文件

### 步骤 2：配置编码

**视频编码**：
- 直接复制（推荐）- 最快，无损
- H.264 - 通用兼容
- H.265 - 更高压缩率

**音频编码**：
- AAC（推荐）
- MP3
- 直接复制

**硬件加速**（可选）：
- VideoToolbox (macOS)
- NVENC (NVIDIA GPU)
- QSV (Intel GPU)

### 步骤 3：开始合并

1. 选择输出位置
2. 点击"开始合并"按钮
3. 等待处理完成

---

## 使用字幕烧录

### 步骤 1：选择文件

1. 选择视频文件
2. 选择字幕文件（ASS 或 SRT）

### 步骤 2：配置选项

- 选择视频编码
- 启用硬件加速（推荐）

### 步骤 3：开始烧录

1. 选择输出位置
2. 点击"开始烧录"按钮
3. 观察实时进度

---

## 常见问题

### FFmpeg 未安装？

点击应用顶部的"立即安装 FFmpeg"按钮，等待自动下载和安装。

### 转换/合并失败？

1. 检查文件是否正常
2. 查看"日志查看"页面的详细错误
3. 尝试重新安装 FFmpeg

### macOS 提示"无法打开应用"？

```bash
sudo xattr -rd com.apple.quarantine /Applications/VideoTool.app
```

---

## 使用技巧

1. **批量处理**：重复使用相同设置，依次处理多个文件
2. **硬件加速**：启用可大幅提升处理速度
3. **直接复制模式**：音视频合并时最快且无损

---

## 需要帮助？

1. 查看"日志查看"页面
2. 按 F12 查看开发者工具
3. [GitHub Issues](https://github.com/binbin1213/VideoTool/issues)
4. Email: piaozhitian@gmail.com

---

## 下一步

- 查看 [功能详解](Feature-Guide) 了解更多功能
- 查看 [项目状态](Project-Status) 了解开发进度
- 查看 [贡献指南](Contributing) 参与开发

---

**最后更新**: 2025-10-29  
**应用版本**: v1.0.2

