# VideoTool - 强大的跨平台视频处理工具

<div align="center">
  <img src="./Logo.png" alt="VideoTool Logo" width="200"/>
  
  <p>
    <strong>专业的视频处理工具 - 支持转码、合并、字幕处理和格式转换</strong>
  </p>

  <p>
    <a href="https://github.com/binbin1213/VideoTool/actions">
      <img src="https://github.com/binbin1213/VideoTool/workflows/Build%20and%20Release/badge.svg" alt="Build Status">
    </a>
    <a href="https://github.com/binbin1213/VideoTool/releases">
      <img src="https://img.shields.io/github/v/release/binbin1213/VideoTool?include_prereleases" alt="Release">
    </a>
    <a href="https://github.com/binbin1213/VideoTool/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
    </a>
  </p>

  <p>
    <a href="#功能特性">功能特性</a> •
    <a href="#快速开始">快速开始</a> •
    <a href="#下载安装">下载安装</a> •
    <a href="#开发">开发</a> •
    <a href="#文档">文档</a>
  </p>
</div>

## ✨ 功能特性

- 🎬 **视频转码和压缩** - 支持多种格式，智能压缩算法
- 🎵 **音视频合并** - 轻松合并音频和视频文件
- 📝 **字幕烧录** - 将字幕硬编码到视频中
- 🔄 **字幕格式转换** - SRT转ASS，支持正则预处理和样式模板
- ⚡ **批量处理** - 一键处理多个文件
- 🎨 **专业样式** - 12种内置字幕样式模板
- 🌐 **跨平台** - 支持 macOS 和 Windows

## 📥 下载安装

### 下载预编译版本

访问 [Releases 页面](https://github.com/binbin1213/VideoTool/releases) 下载适合您系统的版本：

- **macOS**: `VideoTool-{version}-universal.dmg` (支持 Intel 和 Apple Silicon)
- **Windows**: `VideoTool-Setup-{version}.exe` (安装版) 或 `VideoTool-{version}.exe` (便携版)
- **Linux**: `VideoTool-{version}.AppImage` / `.deb` / `.rpm`

### 从源码构建

如果您想从源码构建，请参阅[开发](#开发)部分。

---

## 🚀 快速开始

### 系统要求

- Node.js 18+ 
- pnpm 8+
- FFmpeg（自动包含在打包版本中）

### 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 开发模式

\`\`\`bash
pnpm dev
\`\`\`

### 构建应用

\`\`\`bash
# 构建 macOS 版本
pnpm build:mac

# 构建 Windows 版本
pnpm build:win

# 构建 Linux 版本
pnpm build:linux

# 构建所有平台
pnpm build:all
\`\`\`

### GitHub Actions 自动构建

本项目配置了 GitHub Actions 自动构建。创建 Git Tag 即可触发自动构建和发布：

\`\`\`bash
git tag v1.0.0
git push origin v1.0.0
\`\`\`

详细说明请查看 [.github/RELEASE.md](./.github/RELEASE.md)

## 🛠️ 开发

### 项目结构

\`\`\`
VideoTool/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts
│   │   ├── services/      # 服务层
│   │   └── utils/         # 工具函数
│   ├── renderer/          # React 渲染进程
│   │   ├── components/    # React 组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   └── styles/        # 样式文件
│   └── shared/            # 共享代码
│       ├── types/         # 类型定义
│       └── presets/       # 预设配置
├── public/                # 静态资源
└── resources/             # 构建资源
\`\`\`

### 技术栈

- **框架**: Electron 34 + React 18
- **语言**: TypeScript 5
- **构建**: Vite 6
- **状态管理**: Zustand
- **UI库**: React Bootstrap
- **视频处理**: FFmpeg

### 开发脚本

\`\`\`bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm test         # 运行测试
pnpm lint         # 代码检查
pnpm format       # 代码格式化
\`\`\`

## 📖 文档

详细文档请参阅:
- [中文文档](./VideoTool-中文.md) - 完整的技术规格和功能说明
- [English Documentation](./VideoTool-English.md) - Complete technical specifications

## 🎯 字幕转换功能

VideoTool 的亮点功能 - SRT转ASS字幕转换器:

### 特性

- ✅ **智能预处理**: 7条内置正则规则自动清理字幕文本
- ✅ **丰富样式**: 12种专业ASS样式模板
- ✅ **批量转换**: 一键转换多个文件
- ✅ **实时预览**: 转换前预览效果
- ✅ **高度灵活**: 自定义规则和样式

### 内置正则规则

1. 移除斜体标签 `<i>` 和 `</i>`
2. 移除中文引号 `""`
3. 替换中文标点符号
4. 格式化连字符
5. 替换英文标点
6. 清理首尾空格

### 样式模板

- 双语原文/译文
- 歌词样式（白色/蓝色）
- 演职人员名单（左/右对齐）
- 注释说明文字
- 自定义样式支持

## 🤝 贡献

欢迎贡献代码！请先阅读贡献指南。

## 📄 许可证

[MIT License](LICENSE)

## 📞 联系方式

- GitHub Issues: [问题反馈](https://github.com/binbin1213/VideoTool/issues)
- GitHub Discussions: [讨论区](https://github.com/binbin1213/VideoTool/discussions)

---

<div align="center">
  <strong>Made with ❤️ by VideoTool Team</strong>
</div>

