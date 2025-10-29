# VideoTool - 强大的跨平台视频处理工具

<div align="center">
  <img src="./resources/icons/icon.png" alt="VideoTool Logo" width="200"/>
  
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

## 功能特性

- **字幕格式转换** - SRT→ASS 智能转换，内置14种样式模板和7条正则规则
- **音视频合并** - 支持硬件加速，快速合并音频和视频文件  
- **字幕烧录** - 将字幕永久嵌入视频，支持 ASS/SRT 格式
- **自动化 FFmpeg** - 一键安装 FFmpeg，无需手动配置
- **跨平台支持** - macOS（Intel + Apple Silicon）、Windows
- **现代化界面** - 简洁美观的用户界面，操作流畅

> 更多功能正在开发中，敬请期待！查看 [项目状态](https://github.com/binbin1213/VideoTool/wiki/Project-Status) 了解详情

## 下载安装

### 下载预编译版本

访问 [Releases 页面](https://github.com/binbin1213/VideoTool/releases) 下载适合您系统的版本：

- **macOS**: `VideoTool-{version}-universal.dmg` (支持 Intel 和 Apple Silicon)
- **Windows**: `VideoTool-Setup-{version}.exe` (安装版) 或 `VideoTool-{version}.exe` (便携版)

### 从源码构建

如果您想从源码构建，请参阅[开发](#开发)部分。

---

## 快速开始

### 系统要求

- Node.js 18+ 
- pnpm 8+
- FFmpeg（自动包含在打包版本中）

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建应用

```bash
# 构建 macOS 版本 (x64/arm64 单独构建)
pnpm build:mac

# 构建 macOS 通用版本 (x64 + arm64)
pnpm build:mac:universal

# 构建 Windows 版本
pnpm build:win

# 构建所有平台 (macOS + Windows)
pnpm build:all
```

### GitHub Actions 自动构建

本项目配置了 GitHub Actions 自动构建。创建 Git Tag 即可触发自动构建和发布：

```bash
git tag v1.0.2
git push origin v1.0.2
```

> 详细的发布流程和配置说明请查看 [发布流程 Wiki](https://github.com/binbin1213/VideoTool/wiki/Release-Process)

## 开发

### 项目结构

```
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
```

### 技术栈

- **框架**: Electron 34 + React 18.3
- **语言**: TypeScript 5.7
- **构建**: Vite 6 + electron-builder
- **状态管理**: Zustand 5
- **UI库**: React Bootstrap 2 + Bootstrap 5
- **视频处理**: FFmpeg (fluent-ffmpeg)
- **样式**: Sass (SCSS)

### 开发脚本

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm test         # 运行测试
pnpm lint         # 代码检查
pnpm format       # 代码格式化
```

## 文档

- **[Wiki 文档](https://github.com/binbin1213/VideoTool/wiki)** - 完整使用指南和开发文档
- **[快速开始](https://github.com/binbin1213/VideoTool/wiki/Quick-Start)** - 新手入门教程
- **[项目状态](https://github.com/binbin1213/VideoTool/wiki/Project-Status)** - 开发进度和功能清单
- **[发布流程](https://github.com/binbin1213/VideoTool/wiki/Release-Process)** - GitHub Actions 自动构建说明

## 贡献

欢迎贡献代码！请查看 [贡献指南](https://github.com/binbin1213/VideoTool/wiki/Contributing) 了解如何参与项目开发。

## 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/binbin1213/VideoTool/issues)
- **功能建议**: [GitHub Discussions](https://github.com/binbin1213/VideoTool/discussions)
- **邮件联系**: piaozhitian@gmail.com

---

<div align="center">
  <p>
    <strong>VideoTool</strong> - 让视频处理更简单
  </p>
  <p>
    <sub>Made with Love by Binbin | Copyright © 2025</sub>
  </p>
</div>
