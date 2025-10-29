# FFmpeg 二进制文件

此目录用于存放各平台的 FFmpeg 可执行文件，打包时会自动包含到应用中。

## 🚀 自动化说明

**GitHub Actions 构建时会自动下载 FFmpeg，无需手动提交二进制文件到仓库。**

- macOS: 通过 Homebrew 安装（~660 KB）
- Windows: 从 gyan.dev 下载 essentials 版本（~94 MB）

**本地开发时**，可以选择：
1. 手动放置 FFmpeg 到对应目录（如下方说明）
2. 或者使用应用内的 FFmpeg 下载功能

## 目录结构

```
resources/ffmpeg/
├── win/          # Windows 平台
│   ├── ffmpeg.exe
│   └── ffprobe.exe
└── mac/          # macOS 平台
    ├── ffmpeg
    └── ffprobe
```

## 下载 FFmpeg

### Windows

访问 [FFmpeg 官网](https://www.ffmpeg.org/download.html#build-windows) 或使用以下链接：

**推荐来源 1: gyan.dev**
- 下载地址：https://www.gyan.dev/ffmpeg/builds/
- 选择：`ffmpeg-release-essentials.zip`
- 解压后将 `bin/ffmpeg.exe` 和 `bin/ffprobe.exe` 复制到 `resources/ffmpeg/win/`

**推荐来源 2: BtbN**
- 下载地址：https://github.com/BtbN/FFmpeg-Builds/releases
- 选择：`ffmpeg-master-latest-win64-gpl.zip`
- 解压后将 `bin/ffmpeg.exe` 和 `bin/ffprobe.exe` 复制到 `resources/ffmpeg/win/`

### macOS

**方法 1: 使用 Homebrew**
```bash
brew install ffmpeg

# 复制到项目
cp /opt/homebrew/bin/ffmpeg resources/ffmpeg/mac/
cp /opt/homebrew/bin/ffprobe resources/ffmpeg/mac/

# 如果是 Intel Mac
cp /usr/local/bin/ffmpeg resources/ffmpeg/mac/
cp /usr/local/bin/ffprobe resources/ffmpeg/mac/
```

**方法 2: 下载静态编译版本**
- 下载地址：https://evermeet.cx/ffmpeg/
- 下载 `ffmpeg` 和 `ffprobe`
- 解压后复制到 `resources/ffmpeg/mac/`

## 注意事项

1. **文件大小**: FFmpeg 可执行文件较大（100-200MB），会增加安装包大小
2. **许可证**: 确保使用的 FFmpeg 构建符合 GPL 许可要求
3. **架构支持**: 
   - Windows: x64
   - macOS: 建议使用 Universal Binary（支持 Intel + Apple Silicon）
4. **可执行权限**: macOS 需要设置执行权限：
   ```bash
   chmod +x resources/ffmpeg/mac/ffmpeg
   chmod +x resources/ffmpeg/mac/ffprobe
   ```

## 验证

放置文件后，可以验证：

### Windows
```cmd
resources\ffmpeg\win\ffmpeg.exe -version
```

### macOS
```bash
resources/ffmpeg/mac/ffmpeg -version
```

## 自动回退

如果 `resources/ffmpeg/` 目录中没有对应平台的 FFmpeg：
1. 应用会尝试使用系统安装的 FFmpeg
2. 如果系统也没有，会提示用户下载安装

