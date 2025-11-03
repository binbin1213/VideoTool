# ASS 字幕样式说明

> VideoTool 字幕转换功能使用的 ASS 字幕样式定义  
> 最后更新：2025-11-03

---

## 📋 概述

ASS (Advanced SubStation Alpha) 是一种功能强大的字幕格式，支持丰富的样式定义。本文档详细说明了 VideoTool 中使用的字幕样式配置。

---

## 📁 相关文件

| 文件 | 位置 | 用途 |
|------|------|------|
| **subtitle-styles.template.ass** | `docs/subtitle-styles.template.ass` | 1080p 样式模板 ⭐ |
| **subtitle-styles.template.4k.ass** | `docs/subtitle-styles.template.4k.ass` | 4K 样式模板 ⭐ |
| **subtitleConverter.ts** | `src/renderer/utils/subtitleConverter.ts` | 前端样式定义（代码） |
| **ASSGenerator.ts** | `src/main/utils/subtitle/ASSGenerator.ts` | 后端 ASS 生成器 |

---

## 🎯 分辨率选择指南

### 如何选择正确的模板？

| 视频分辨率 | 使用模板 | 说明 |
|-----------|---------|------|
| **1920×1080 (1080p)** | `subtitle-styles.template.ass` | ✅ 标准高清 |
| **3840×2160 (4K)** | `subtitle-styles.template.4k.ass` | ✅ 超高清4K |
| 其他分辨率 | 选择最接近的 | 可能需要微调 |

### 为什么需要不同模板？

ASS 字幕使用**绝对像素值**定义字号和边距。同样的字号在不同分辨率上显示大小不同：

```
1080p 视频: 90px 字号 = 正常大小 ✅
4K 视频:   90px 字号 = 显示太小 ❌（只有正常的50%）
4K 视频:   180px 字号 = 正常大小 ✅
```

### 模板参数对比

| 参数 | 1080p 模板 | 4K 模板 | 缩放比例 |
|------|-----------|---------|----------|
| **分辨率** | 1920×1080 | 3840×2160 | ×2 |
| **双语原文字号** | 70 | 140 | ×2 |
| **双语译文字号** | 90 | 180 | ×2 |
| **标准字幕字号** | 90 | 180 | ×2 |
| **注释字号** | 65 | 130 | ×2 |
| **左右边距** | 25 | 50 | ×2 |
| **垂直边距** | 50-90 | 100-180 | ×2 |
| **描边宽度** | 0.5 | 1.0 | ×2 |
| **字符间距** | 1 | 2 | ×2 |

---

## 🎯 ASS 文件结构

ASS 字幕文件由三个主要部分组成：

```ini
[Script Info]      # 脚本信息
...

[V4+ Styles]      # 样式定义
...

[Events]          # 字幕事件（对话、注释）
...
```

---

## 📊 [Script Info] - 脚本信息

### 配置说明

```ini
[Script Info]
Title: VideoTool Subtitle Styles    # 字幕标题
ScriptType: v4.00+                   # 脚本版本（V4+ 格式）
Collisions: Normal                   # 碰撞处理：Normal（正常显示）
WrapStyle: 0                         # 换行模式：0（智能换行）
PlayResX: 1920                       # 播放分辨率宽度（1080p）
PlayResY: 1080                       # 播放分辨率高度（1080p）
ScaledBorderAndShadow: no           # 边框阴影缩放：否
Synch Point: 1                       # 同步点
```

### 分辨率配置

| 分辨率 | PlayResX | PlayResY | 模板文件 | 说明 |
|--------|----------|----------|----------|------|
| **1080p** | 1920 | 1080 | `subtitle-styles.template.ass` | ✅ 标准高清 |
| **4K** | 3840 | 2160 | `subtitle-styles.template.4k.ass` | ✅ 超高清 |

**重要提示：**
- ⚠️ 分辨率和字号必须匹配，否则字幕大小不正确
- ✅ 我们提供了 1080p 和 4K 两个预配置模板
- 📐 4K 模板的所有参数都是 1080p 的 2 倍

---

## 🎨 [V4+ Styles] - 样式定义

### Format 格式说明

```ini
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, 
        OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, 
        ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, 
        Alignment, MarginL, MarginR, MarginV, Encoding
```

### 参数详解

| # | 参数 | 类型 | 说明 | 示例 |
|---|------|------|------|------|
| 1 | **Name** | 字符串 | 样式名称 | `译文字幕 底部` |
| 2 | **Fontname** | 字符串 | 字体名称 | `Microsoft YaHei` |
| 3 | **Fontsize** | 数字 | 字体大小（像素） | `90` |
| 4 | **PrimaryColour** | 颜色 | 主颜色（BGR格式） | `&H00FFFFFF` (白色) |
| 5 | **SecondaryColour** | 颜色 | 次颜色（卡拉OK） | `&H00535353` (灰色) |
| 6 | **OutlineColour** | 颜色 | 描边颜色 | `&H00000000` (黑色) |
| 7 | **BackColour** | 颜色 | 背景颜色 | `&H00000000` (黑色) |
| 8 | **Bold** | 0/1 | 是否加粗 | `1` (加粗) |
| 9 | **Italic** | 0/1 | 是否斜体 | `0` (正常) |
| 10 | **Underline** | 0/1 | 是否下划线 | `0` (无) |
| 11 | **StrikeOut** | 0/1 | 是否删除线 | `0` (无) |
| 12 | **ScaleX** | 百分比 | 水平缩放 | `100` (100%) |
| 13 | **ScaleY** | 百分比 | 垂直缩放 | `100` (100%) |
| 14 | **Spacing** | 数字 | 字符间距 | `1` (1像素) |
| 15 | **Angle** | 角度 | 旋转角度 | `0` (无旋转) |
| 16 | **BorderStyle** | 1/3 | 边框样式 | `1` (描边+阴影) |
| 17 | **Outline** | 数字 | 描边宽度 | `0.5` (0.5像素) |
| 18 | **Shadow** | 数字 | 阴影距离 | `0` (无阴影) |
| 19 | **Alignment** | 1-9 | 对齐方式 | `2` (底部居中) |
| 20 | **MarginL** | 像素 | 左边距 | `25` |
| 21 | **MarginR** | 像素 | 右边距 | `25` |
| 22 | **MarginV** | 像素 | 垂直边距 | `90` |
| 23 | **Encoding** | 数字 | 字符编码 | `1` (默认) |

---

## 🎨 颜色格式

ASS 使用 **BGR (蓝绿红)** 格式，而不是常见的 RGB：

### 格式：`&H00BBGGRR`

| 颜色 | BGR 值 | 说明 |
|------|--------|------|
| 白色 | `&H00FFFFFF` | 字幕主要颜色 |
| 黑色 | `&H00000000` | 描边/背景颜色 |
| 灰色 | `&H00535353` | 次要颜色 |
| 灰色 | `&H004E4E4E` | 双语次要颜色 |
| 红色 | `&H000000FF` | BB=00, GG=00, RR=FF |
| 绿色 | `&H0000FF00` | BB=00, GG=FF, RR=00 |
| 蓝色 | `&H00FF0000` | BB=FF, GG=00, RR=00 |

### 颜色计算示例

**RGB (255, 165, 0) → BGR:**
```
R=255 (0xFF), G=165 (0xA5), B=0 (0x00)
BGR = &H00 + A5 + FF = &H0000A5FF
```

---

## 📍 对齐方式 (Alignment)

ASS 使用数字键盘布局表示对齐方式：

```
┌─────────────────────┐
│  7      8       9   │  ← 顶部
│  ↑      ↑       ↑   │
│  左    中    右      │
│                     │
│  4      5       6   │  ← 中部
│  ↑      ↑       ↑   │
│  左    中    右      │
│                     │
│  1      2       3   │  ← 底部
│  ↑      ↑       ↑   │
│  左    中    右      │
└─────────────────────┘
```

| 值 | 位置 | 常用场景 |
|----|------|----------|
| **1** | 左下 | 演职员表（左） |
| **2** | 中下 | ✅ 标准字幕（底部居中） |
| **3** | 右下 | 演职员表（右） |
| **4** | 左中 | 特殊效果 |
| **5** | 正中 | 歌词、标题 |
| **6** | 右中 | 特殊效果 |
| **7** | 左上 | 水印 |
| **8** | 中上 | 顶部字幕、注释 |
| **9** | 右上 | 水印 |

---

## 📦 预设样式

VideoTool 提供 6 个预设样式：

### 1. 双语 原文

```ini
Style: 双语 原文,Microsoft YaHei,70,&H00FFFFFF,&H004E4E4E,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0.5,0,2,25,25,80,1
```

| 参数 | 值 | 说明 |
|------|-----|------|
| 字体 | Microsoft YaHei | 微软雅黑 |
| 字号 | 70 | 较小（原文） |
| 主颜色 | 白色 | &H00FFFFFF |
| 加粗 | 否 | 0 |
| 对齐 | 底部居中 | 2 |
| 垂直边距 | 80px | 稍高（原文在上） |

**用途：** 双语字幕的原文（上方较小字幕）

---

### 2. 双语 译文

```ini
Style: 双语 译文,Microsoft YaHei,90,&H00FFFFFF,&H004E4E4E,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,25,25,90,1
```

| 参数 | 值 | 说明 |
|------|-----|------|
| 字体 | Microsoft YaHei | 微软雅黑 |
| 字号 | 90 | 较大（译文） |
| 主颜色 | 白色 | &H00FFFFFF |
| 加粗 | **是** | 1 |
| 对齐 | 底部居中 | 2 |
| 垂直边距 | 90px | 标准底部 |

**用途：** 双语字幕的译文（下方较大字幕）

---

### 3. 译文字幕 底部 ⭐

```ini
Style: 译文字幕 底部,Microsoft YaHei,90,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,25,25,90,1
```

| 参数 | 值 | 说明 |
|------|-----|------|
| 字体 | Microsoft YaHei | 微软雅黑 |
| 字号 | 90 | 标准大小 |
| 主颜色 | 白色 | &H00FFFFFF |
| 加粗 | **是** | 1 |
| 对齐 | 底部居中 | 2 |
| 垂直边距 | 90px | 标准底部 |

**用途：** ⭐ 最常用的单语字幕样式

---

### 4. 译文字幕 顶部

```ini
Style: 译文字幕 顶部,Microsoft YaHei,90,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,8,25,25,50,1
```

| 参数 | 值 | 说明 |
|------|-----|------|
| 字体 | Microsoft YaHei | 微软雅黑 |
| 字号 | 90 | 标准大小 |
| 对齐 | **顶部居中** | 8 |
| 垂直边距 | 50px | 顶部边距 |

**用途：** 顶部字幕（避免遮挡画面）

---

### 5. 注释 底部

```ini
Style: 注释 底部,Microsoft YaHei,65,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,2,25,25,50,1
```

| 参数 | 值 | 说明 |
|------|-----|------|
| 字号 | **65** | 较小（注释用） |
| 对齐 | 底部居中 | 2 |
| 垂直边距 | 50px | 较小边距 |

**用途：** 底部注释、说明文字

---

### 6. 注释 顶部

```ini
Style: 注释 顶部,Microsoft YaHei,65,&H00FFFFFF,&H00535353,&H00000000,&H00000000,1,0,0,0,100,100,1,0,1,0.5,0,8,25,25,50,1
```

| 参数 | 值 | 说明 |
|------|-----|------|
| 字号 | **65** | 较小（注释用） |
| 对齐 | **顶部居中** | 8 |

**用途：** 顶部注释、说明文字

---

## 🔄 样式对比

### 字号对比（1080p）

| 样式 | 字号 | 用途 | 相对大小 |
|------|------|------|----------|
| 注释 | 65 | 注释、说明 | 小 |
| 双语原文 | 70 | 双语上方 | 中小 |
| 双语译文 | 90 | 双语下方 | 标准 |
| 译文字幕 | 90 | 单语字幕 | 标准 ⭐ |

### 边距对比

| 样式 | 垂直边距 | 说明 |
|------|----------|------|
| 注释 | 50px | 较小边距 |
| 双语原文 | 80px | 原文在上方 |
| 译文字幕 | 90px | 标准底部 ⭐ |

---

## 💻 代码集成

### 前端样式定义

**文件：** `src/renderer/utils/subtitleConverter.ts`

```typescript
const PRESET_STYLES: Record<string, ASSStyleParams> = {
  '译文字幕 底部': {
    name: '译文字幕 底部',
    fontname: 'Microsoft YaHei',
    fontsize: 90,  // 1080p 分辨率
    primaryColour: '&H00FFFFFF',
    bold: 1,
    alignment: 2,  // 底部居中
    marginV: 90,
    // ... 其他参数
  },
  '双语 原文': { /* ... */ },
  '双语 译文': { /* ... */ }
};
```

### 后端生成器

**文件：** `src/main/utils/subtitle/ASSGenerator.ts`

```typescript
export class ASSGenerator {
  generate(subtitles: SRTSubtitle[], selectedStyle: string): string {
    // 1. 生成 [Script Info]
    // 2. 生成 [V4+ Styles]
    // 3. 生成 [Events]
    return assContent;
  }
}
```

---

## 🎬 使用示例

### 场景 1：标准单语字幕

```typescript
const assContent = generateASS(
  subtitles,
  '译文字幕 底部'  // ← 使用标准样式
);
```

**效果：**
- 底部居中
- 字号 90
- 加粗白色
- 适合大多数场景 ✅

---

### 场景 2：双语字幕

```typescript
// 原文
const originalContent = generateASS(subtitles1, '双语 原文');

// 译文
const translationContent = generateASS(subtitles2, '双语 译文');
```

**效果：**
- 原文在上（字号 70，较小）
- 译文在下（字号 90，较大、加粗）

---

### 场景 3：顶部字幕（避免遮挡）

```typescript
const assContent = generateASS(
  subtitles,
  '译文字幕 顶部'  // ← 顶部显示
);
```

**效果：**
- 顶部居中显示
- 适合画面下方有重要内容时

---

## ⚙️ 自定义样式

### 方法 1：修改模板文件

**1080p 视频：** 编辑 `docs/subtitle-styles.template.ass`

```ini
Style: 自定义样式,Microsoft YaHei,100,&H00FFFFFF,...
```

**4K 视频：** 编辑 `docs/subtitle-styles.template.4k.ass`

```ini
Style: 自定义样式,Microsoft YaHei,200,&H00FFFFFF,...  # 字号×2
```

### 方法 2：代码中添加

在 `subtitleConverter.ts` 中添加：

```typescript
const PRESET_STYLES = {
  // ... 现有样式
  '自定义样式': {
    name: '自定义样式',
    fontsize: 100,  // 更大字号
    primaryColour: '&H0000FFFF',  // 黄色
    // ...
  }
};
```

### 方法 3：动态传参

```typescript
const customStyle: ASSStyleParams = {
  name: '临时样式',
  fontsize: 120,
  primaryColour: '&H000000FF',  // 红色
  // ...
};

const assContent = generateASS(
  subtitles, 
  '自定义样式',
  undefined,
  customStyle  // ← 传入自定义参数
);
```

---

## 📐 分辨率适配

### 1080p 和 4K 参数对照表

我们提供了预配置的模板，无需手动计算：

| 样式 | 1080p 字号 | 4K 字号 | 说明 |
|------|-----------|---------|------|
| 双语原文 | 70 | 140 | 较小字体 |
| 双语译文 | 90 | 180 | 标准字体，加粗 |
| 译文字幕 | 90 | 180 | 最常用 ⭐ |
| 注释 | 65 | 130 | 小字注释 |

### 转换公式（参考）

如果需要其他分辨率，使用以下公式：

**公式：** 新参数 = 1080p参数 × (目标高度 ÷ 1080)

**示例：** 1440p (2K)

```
分辨率: 2560×1440
字号: 90 × (1440÷1080) = 120
边距: 90 × (1440÷1080) = 120
```

---

## ⚠️ 注意事项

### 1. 字体兼容性

- ✅ **推荐：** `Microsoft YaHei` (跨平台)
- ⚠️ **避免：** `微软雅黑` (中文名，可能不兼容)
- 📦 **备选：** `Arial`, `Noto Sans CJK`

### 2. 颜色格式

- ❌ **错误：** `#FFFFFF` (HTML格式)
- ✅ **正确：** `&H00FFFFFF` (BGR格式)

### 3. 分辨率一致性

- 样式定义的分辨率必须与视频一致
- 否则字幕大小会不正确

### 4. 编码问题

- ASS 文件必须使用 **UTF-8** 编码
- 否则中文会乱码

---

## 🔗 相关文档

- [字幕正则替换规则](./SUBTITLE_REGEX_RULES.md) - 字幕文本处理规则
- [新功能开发指南](./NEW_FEATURE_GUIDE.md) - 开发新功能参考
- [UI设计规范](./UI_DESIGN_GUIDE.md) - UI组件规范

---

## 📊 文件版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v2.0 | 2025-11-03 | 完整优化：修复分辨率、统一字体、删除冗余样式 |
| v1.0 | 2024-XX-XX | 初始版本 |

---

**最后更新：2025-11-03**  
**文档版本：v1.0.0**

