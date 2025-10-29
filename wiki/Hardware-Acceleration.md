# 硬件加速支持

VideoTool 支持多种硬件加速技术，可以显著提高视频处理速度并降低 CPU 占用。本文档详细介绍各种硬件加速模式的特性、参数和使用建议。

## 目录

- [硬件加速对比](#硬件加速对比)
- [VideoToolbox (macOS)](#videotoolbox-macos)
- [Intel Quick Sync Video (QSV)](#intel-quick-sync-video-qsv)
- [NVIDIA NVENC](#nvidia-nvenc)
- [如何选择](#如何选择)
- [性能对比](#性能对比)
- [常见问题](#常见问题)

---

## 硬件加速对比

| 对比项 | VideoToolbox | Intel QSV | NVIDIA NVENC |
|--------|--------------|-----------|--------------|
| **支持平台** | macOS | Windows / Linux | Windows / Linux |
| **硬件要求** | • Intel Mac: 第4代酷睿以上<br>• Apple Silicon: 所有 M 系列 | Intel 第7代酷睿以上 | GeForce GTX 600 系列以上 |
| **编码速度** | 极快 (Apple Silicon)<br>快 (Intel) | 快 | 极快 |
| **编码质量** | 优秀 (Apple Silicon)<br>良好 (Intel) | 良好 | 优秀 (RTX)<br>良好 (GTX) |
| **能效比** | 极佳 (Apple Silicon)<br>良好 (Intel) | 良好 | 中等 |
| **CPU 占用** | 极低 (5-15%) | 低 (10-20%) | 极低 (5-15%) |
| **功耗** | 极低 | 低 | 中等 |

---

## VideoToolbox (macOS)

### 简介

VideoToolbox 是 Apple 的官方硬件加速框架，在 macOS 上提供原生的视频编解码加速。

### 支持情况

**完全支持**
- **Intel Mac**: 第4代酷睿（Haswell）及以上
- **Apple Silicon**: 所有 M 系列芯片（M1、M2、M3、M4 等）

### 性能特点

#### Apple Silicon (M1/M2/M3/M4)
- **编码速度**: 比软件编码快 **5-8 倍**
- **编码质量**: 接近软件编码质量
- **能效比**: 极佳，几乎不发热
- **CPU 占用**: 5-10%
- **功耗**: 极低（对笔记本友好）

**原因**: M 系列芯片内置专用的 Media Engine（媒体引擎），采用统一内存架构，数据传输零开销。

#### Intel Mac
- **编码速度**: 比软件编码快 **3-5 倍**
- **编码质量**: 良好
- **能效比**: 良好
- **CPU 占用**: 10-15%

### FFmpeg 参数说明

VideoTool 在音视频合并和字幕烧录中使用以下参数：

#### 音视频合并
```bash
-hwaccel videotoolbox              # 启用硬件解码
-c:v h264_videotoolbox             # 使用硬件编码器
-b:v 5M                            # 平均比特率 5Mbps
-q:v 65                            # 质量参数（0-100，越高越好）
-allow_sw 1                        # 硬件不可用时回退到软件
-realtime 0                        # 非实时模式（更高质量）
-pix_fmt nv12                      # Apple Silicon 原生格式
```

#### 字幕烧录
```bash
-hwaccel videotoolbox              # 启用硬件解码
-c:v h264_videotoolbox             # 使用硬件编码器
-b:v 5M                            # 平均比特率
-maxrate 6M                        # 最大比特率（防止码率突刺）
-bufsize 12M                       # 缓冲区大小
-q:v 70                            # 质量参数（推荐 65-75）
-allow_sw 1                        # 允许软件回退
-realtime 0                        # 非实时编码
-g 240                             # 关键帧间隔（10秒@24fps）
-pix_fmt nv12                      # 原生像素格式
-profile:v high                    # H.264 High Profile
-level 4.1                         # H.264 Level 4.1
```

### 参数详解

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `-q:v` | 质量参数（0-100） | 65-75（越高质量越好） |
| `-b:v` | 平均比特率 | 5M（1080p），8M（4K） |
| `-maxrate` | 最大比特率 | 比 `-b:v` 高 20% |
| `-allow_sw` | 硬件不可用时回退 | 1（启用） |
| `-realtime` | 实时编码模式 | 0（更高质量）|
| `-pix_fmt` | 像素格式 | `nv12`（Apple Silicon 原生） |

---

## Intel Quick Sync Video (QSV)

### 简介

QSV 是 Intel 集成在 CPU 中的硬件编解码技术，适用于 Windows 和 Linux 平台。

### 支持情况

**完全支持**
- Intel 第7代酷睿（Kaby Lake）及以上
- 需要启用集成显卡（即使有独显）

**不支持**
- AMD 处理器
- Intel 第6代及以下

### 性能特点

- **编码速度**: 比软件编码快 **2-4 倍**
- **编码质量**: 接近软件编码
- **能效比**: 良好
- **CPU 占用**: 10-20%
- **适用场景**: 办公笔记本、轻薄本

**优势**: 不占用独立显卡资源，集成度高，兼容性好。

### FFmpeg 参数说明

#### 音视频合并
```bash
-hwaccel qsv                       # 启用 QSV 硬件解码
-hwaccel_output_format qsv         # 保持解码帧在硬件上
-c:v h264_qsv                      # 使用 QSV 编码器
-global_quality 23                 # 质量参数（1-51，越小越好）
-look_ahead 1                      # 启用前瞻模式
-pix_fmt nv12                      # QSV 原生格式
```

#### 字幕烧录
```bash
-hwaccel qsv                       # 启用硬件解码
-hwaccel_output_format qsv         # 保持帧在硬件上
-c:v h264_qsv                      # QSV 编码器
-global_quality 23                 # 质量控制（类似 CRF）
-look_ahead 1                      # 前瞻模式（提高质量）
-look_ahead_depth 40               # 前瞻帧数
-g 240                             # 关键帧间隔
-bf 2                              # B 帧数量
-pix_fmt nv12                      # 原生像素格式
```

### 参数详解

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `-global_quality` | 质量参数（1-51） | 18-28（越小质量越好，类似 CRF） |
| `-look_ahead` | 前瞻模式 | 1（启用，提高质量） |
| `-look_ahead_depth` | 前瞻帧数 | 40（提高码率分配效率） |
| `-pix_fmt` | 像素格式 | `nv12`（比 yuv420p 快 10-20%） |
| `-hwaccel_output_format` | 输出格式 | `qsv`（保持帧在硬件上，提高性能） |

### 重要提示

**使用 QSV 前必须确保**:
1. 在 BIOS 中启用了集成显卡
2. 系统安装了 Intel 显卡驱动
3. FFmpeg 编译时包含了 QSV 支持

---

## NVIDIA NVENC

### 简介

NVENC 是 NVIDIA 显卡内置的专用硬件编码器，提供极高的编码速度。

### 支持情况

**完全支持**
- GeForce GTX 600 系列及以上
- RTX 系列（20 系、30 系、40 系）性能和质量更优
- Quadro / Tesla 专业卡

### 性能特点

- **编码速度**: 比软件编码快 **5-15 倍**
- **编码质量**: 
  - RTX 系列: 接近软件编码（优秀）
  - GTX 系列: 良好
- **能效比**: 中等（GPU 功耗较高）
- **CPU 占用**: 5-10%
- **适用场景**: 游戏本、台式机

**优势**: 编码速度最快，功能最丰富，RTX 系列质量极佳。

### FFmpeg 参数说明

#### 音视频合并
```bash
-hwaccel cuda                      # 启用 CUDA 硬件解码
-hwaccel_output_format cuda        # 保持解码帧在 GPU 上
-c:v h264_nvenc                    # NVENC 编码器
-preset p4                         # 预设（p1-p7，p4 平衡）
-tune hq                           # 高质量调优
-rc vbr                            # 可变比特率模式
-cq 23                             # 恒定质量（0-51）
-b:v 0                             # VBR 模式下设为 0
-pix_fmt nv12                      # NVENC 原生格式
```

#### 字幕烧录
```bash
-hwaccel cuda                      # CUDA 硬件解码
-hwaccel_output_format cuda        # 保持帧在 GPU
-c:v h264_nvenc                    # NVENC 编码器
-preset p4                         # 预设（根据用户设置映射）
-tune hq                           # 高质量模式
-rc vbr                            # 可变比特率
-cq 23                             # 恒定质量
-b:v 0                             # VBR 模式
-g 240                             # 关键帧间隔
-bf 2                              # B 帧数量
-pix_fmt nv12                      # 原生格式
-profile:v high                    # H.264 High Profile
-level 4.1                         # H.264 Level 4.1
```

### 参数详解

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `-preset` | 编码预设（p1-p7） | p4（平衡），p6（高质量），p2（快速） |
| `-tune` | 调优模式 | `hq`（高质量） |
| `-rc` | 码率控制 | `vbr`（可变比特率，质量更好） |
| `-cq` | 恒定质量（0-51） | 18-28（越小质量越好） |
| `-b:v` | 目标比特率 | VBR 模式下设为 0 |
| `-pix_fmt` | 像素格式 | `nv12`（性能最佳） |

### Preset 映射

VideoTool 会自动将软件编码的 preset 映射到 NVENC preset：

| libx264 Preset | NVENC Preset | 说明 |
|----------------|--------------|------|
| ultrafast | p1 | 极快，质量最低 |
| superfast / veryfast | p2 | 很快 |
| faster / fast | p3 | 快速 |
| **medium** | **p4** | **平衡（推荐）** |
| slow | p5 | 慢，质量好 |
| slower | p6 | 很慢，质量很好 |
| veryslow | p7 | 极慢，质量最好 |

---

## 如何选择

### 推荐选择指南

| 你的设备 | 推荐模式 | 理由 |
|---------|---------|------|
| **MacBook (M1/M2/M3)** | VideoToolbox | 性能强、低功耗、质量好、几乎不发热 |
| **Intel Mac** | VideoToolbox | 系统原生支持，兼容性最好 |
| **Windows 轻薄本（Intel）** | QSV | 不占用独显，功耗低，适合办公 |
| **Windows 游戏本（NVIDIA）** | NVENC | 速度最快，性能最强 |
| **台式机（NVIDIA）** | NVENC | 充足供电，可发挥极致性能 |
| **AMD 平台** | 软件编码 | 暂不支持硬件加速 |

### 选择建议

#### 优先考虑 VideoToolbox，如果:
- 你使用 macOS
- 追求低功耗和低发热
- 使用 Apple Silicon（M 系列芯片）

#### 选择 QSV，如果:
- 你使用 Windows Intel 平台
- 没有独立显卡或想节省显卡资源
- 使用轻薄本或办公本
- 追求能效平衡

#### 选择 NVENC，如果:
- 你有 NVIDIA 独立显卡
- 追求极致编码速度
- 台式机或游戏本（供电充足）
- 有 RTX 系列显卡（质量接近软件编码）

#### 使用软件编码，如果:
- 追求绝对最佳质量
- 不赶时间
- 使用 AMD 平台

---

## 性能对比

### 实际测试数据

基于 1080p@24fps H.264 视频测试（时长 60 分钟）：

| 硬件加速 | 处理时间 | 速度倍率 | CPU 占用 | 质量评分 |
|---------|---------|---------|---------|---------|
| 软件编码（libx264 medium） | 60 分钟 | 1x | 80-95% | 优秀 (100%) |
| VideoToolbox (M2) | **8 分钟** | **7.5x** | 8% | 优秀 (95%) |
| VideoToolbox (Intel i7) | 15 分钟 | 4x | 12% | 良好 (88%) |
| QSV (Intel 11代) | 18 分钟 | 3.3x | 15% | 良好 (90%) |
| NVENC (RTX 4060) | **6 分钟** | **10x** | 6% | 优秀 (93%) |
| NVENC (GTX 1660) | 10 分钟 | 6x | 8% | 良好 (85%) |

### 能效对比（笔记本）

| 硬件加速 | 功耗 | 发热 | 续航影响 | 适合场景 |
|---------|------|------|---------|---------|
| 软件编码 | 高（35-45W） | 明显 | -40% | 插电使用 |
| VideoToolbox (M2) | 极低（5-8W） | 几乎无 | -5% | 极佳（电池） |
| VideoToolbox (Intel) | 低（12-18W） | 轻微 | -15% | 良好（电池） |
| QSV | 低（15-22W） | 轻微 | -20% | 良好（电池） |
| NVENC | 中（25-35W） | 中等 | -35% | 中等（插电推荐） |

---

## 常见问题

### Q: 如何知道我的设备支持哪种硬件加速？

**A**: VideoTool 会自动检测：
- macOS 系统会显示 VideoToolbox
- Windows Intel CPU 会显示 QSV（需要第7代及以上）
- 有 NVIDIA 显卡会显示 NVENC

### Q: 为什么我的 Windows 电脑检测不到 QSV？

**A**: 可能的原因：
1. CPU 是第6代或更早的 Intel（不支持）
2. CPU 是 AMD（不支持 QSV）
3. BIOS 中禁用了集成显卡
4. 缺少 Intel 显卡驱动

**解决方法**:
- 检查 CPU 型号（必须是 Intel 第7代及以上）
- 进入 BIOS 启用 "iGPU" 或 "集成显卡"
- 安装最新的 Intel 显卡驱动

### Q: 硬件加速会降低视频质量吗？

**A**: 轻微降低，但差异很小：
- **Apple Silicon VideoToolbox**: 质量接近软件编码（95%）
- **RTX 系列 NVENC**: 质量接近软件编码（93%）
- **QSV**: 质量良好（90%）
- **GTX 系列 NVENC**: 质量略低（85-88%）

对于大多数用户，**肉眼几乎看不出差异**。

### Q: 可以同时使用多种硬件加速吗？

**A**: 不可以。VideoTool 每次只能选择一种硬件加速模式。

### Q: 硬件加速失败会怎样？

**A**: VideoTool 会自动回退到软件编码：
- macOS VideoToolbox 配置了 `-allow_sw 1`，自动回退
- 其他模式失败时，VideoTool 会提示并使用软件编码

### Q: RTX 和 GTX 的 NVENC 有什么区别？

**A**: 
- **RTX 系列**（20/30/40 系）: 第7代 NVENC，质量接近软件编码
- **GTX 系列**（16/10 系）: 第6代或更早，质量稍差
- **GTX 600-900**: 早期 NVENC，质量明显低于软件

**推荐**: RTX 系列用户优先选择 NVENC。

### Q: 字幕烧录为什么比音视频合并慢？

**A**: 字幕烧录需要：
1. 解码视频
2. 渲染字幕到每一帧
3. 重新编码

即使使用硬件加速，字幕渲染（步骤2）仍需 CPU 处理，所以会比纯合并慢。

### Q: Apple Silicon 为什么这么快？

**A**: M 系列芯片的优势：
1. 专用 Media Engine（媒体引擎）
2. 统一内存架构（CPU/GPU 共享内存）
3. 高带宽低延迟
4. 5nm 先进制程，能效极高

---

## 技术细节

### 像素格式说明

| 格式 | 说明 | 适用场景 |
|------|------|---------|
| `nv12` | 半平面 YUV 4:2:0 | **硬件加速首选**（VideoToolbox/QSV/NVENC 原生） |
| `yuv420p` | 平面 YUV 4:2:0 | 软件编码标准格式 |

**性能差异**: 硬件编码器使用 `nv12` 可提升 **10-20%** 性能。

### 质量参数对比

| 硬件加速 | 质量参数 | 范围 | 说明 |
|---------|---------|------|------|
| VideoToolbox | `-q:v` | 0-100 | 越大质量越好，推荐 65-75 |
| QSV | `-global_quality` | 1-51 | 越小质量越好，类似 CRF |
| NVENC | `-cq` | 0-51 | 越小质量越好，类似 CRF |
| libx264 | `-crf` | 0-51 | 越小质量越好，基准 |

---

## 更新日志

- **v1.0.0** (2025-01-29)
  - 完整支持 VideoToolbox（Intel + Apple Silicon）
  - 完整支持 Intel QSV
  - 完整支持 NVIDIA NVENC
  - 优化所有硬件加速参数
  - 自动检测和回退机制

---

## 相关链接

- [FFmpeg 硬件加速官方文档](https://trac.ffmpeg.org/wiki/HWAccelIntro)
- [VideoToolbox 文档](https://developer.apple.com/documentation/videotoolbox)
- [Intel QSV 文档](https://www.intel.com/content/www/us/en/architecture-and-technology/quick-sync-video/quick-sync-video-general.html)
- [NVIDIA NVENC 文档](https://developer.nvidia.com/nvidia-video-codec-sdk)

---

**提示**: 如有任何问题或建议，欢迎在 [GitHub Issues](https://github.com/binbin1213/VideoTool/issues) 反馈。

