# VideoTool UI 设计规范

> 最后更新：2025-11-03  
> 版本：v1.2.0

---

## 📐 设计原则

### 1. 一致性 (Consistency)
- 相同类型的组件保持统一的视觉风格
- 相同功能的交互行为保持一致
- 字体、颜色、间距使用统一的设计Token

### 2. 精致性 (Refinement)
- 注重细节，追求视觉上的精致感
- 组件尺寸适中，避免过大或过小
- 合理的间距和留白

### 3. 易用性 (Usability)
- 界面清晰，信息层级分明
- 交互反馈及时、明确
- 避免不必要的复杂性

---

## 🎨 设计Token

### 字体 (Typography)

| Token | 值 | 用途 | 示例 |
|-------|-----|------|------|
| `font-size-xs` | 12px | 辅助信息、提示文字 | 文件大小、时间戳 |
| `font-size-sm` | 13px | 次要文字 | 表格内容、标签 |
| **`font-size-base`** | **14px** | **正文、表单控件** | **按钮、选择框、输入框** ✅ |
| `font-size-md` | 16px | 标题、强调文字 | 卡片标题 |
| `font-size-lg` | 18px | 大标题 | 页面主标题 |
| `font-size-xl` | 20px | 特大标题 | 欢迎页 |

**字体粗细：**
- `font-weight-normal`: **400** (默认，用于正文、按钮、表单控件) ✅
- `font-weight-medium`: 500 (中等强调)
- `font-weight-semibold`: 600 (强调标题)
- `font-weight-bold`: 700 (特别强调)

### 组件高度 (Component Heights)

| Token | 值 | 用途 | 应用 |
|-------|-----|------|------|
| **`button-height-sm`** | **28px** | **小按钮、表单控件** | **所有选择框、默认按钮** ✅ |
| `button-height-md` | 32px | ~~中等按钮~~ | ⚠️ 已弃用 |
| `button-height-lg` | 36px | 大按钮 | 主要操作按钮 |
| `input-height-md` | 32px | 输入框 | 文本输入、数字输入 |

### 间距 (Spacing)

| Token | 值 | 用途 |
|-------|-----|------|
| `spacing-1` | 4px | 极小间距 |
| `spacing-2` | 8px | 小间距 |
| `spacing-3` | 12px | 中等间距（表单控件内边距） |
| `spacing-4` | 16px | 常规间距 |
| `spacing-5` | 20px | 大间距 |
| `spacing-6` | 24px | 特大间距 |

### 圆角 (Border Radius)

| Token | 值 | 用途 |
|-------|-----|------|
| `radius-sm` | 6px | 小组件（按钮、输入框、选择框） |
| `radius-md` | 8px | 中等组件（卡片） |
| `radius-lg` | 12px | 大组件（模态框） |

---

## 🧩 组件规范

### 1. 按钮 (Button)

#### 尺寸规范

| 类型 | 高度 | 内边距 | 字体大小 | 字体粗细 | 使用场景 |
|------|------|----------|----------|----------|----------|
| **默认/Medium** | **28px** ✅ | **0 12px** | **14px** | **400** | **标准操作** |
| Small | 28px | 0 12px | 14px | 400 | 次要操作 |
| Large | 36px | 0 20px | 16px | 500 | 主要操作、强调 |

#### 样式代码示例

```scss
// Button.module.scss
%button-base {
  height: t.$button-height-sm; // 28px ✅
  padding: 0 t.$spacing-3; // 0 12px
  font-size: t.$font-size-base; // 14px ✅
  font-weight: 400; // 正常字重 ✅
  border-radius: t.$radius-sm;
  transition: all 0.2s;
}
```

#### 状态

- **Normal**: 默认样式
- **Hover**: 背景色加深 5-10%
- **Active**: 背景色加深 10-15%
- **Disabled**: 透明度 50%，禁用交互

---

### 2. 选择框 (Select)

#### ✅ **统一规范（v1.2.0+）**

| 属性 | 值 | 说明 |
|------|-----|------|
| **高度** | **28px** | 与按钮同高 ✅ |
| **字体大小** | **14px** | 与正文一致 ✅ |
| **字体粗细** | **400** | 正常字重 ✅ |
| **内边距** | 左 12px，右 32px | 右侧留空间给下拉箭头 |
| **圆角** | 6px | 与按钮一致 |
| **边框** | 1px solid | 使用 `--vt-color-border` |

#### 样式代码示例

```scss
// 标准选择框样式
.select {
  height: t.$button-height-sm; // 28px，与按钮同高 ✅
  padding: 0 32px 0 t.$spacing-3; // 左12px，右32px
  font-size: t.$font-size-base; // 14px，与正文一致 ✅
  font-weight: 400; // 正常字重，不加粗 ✅
  font-family: t.$font-family-sans;
  color: var(--vt-color-text-primary);
  background-color: #FFFFFF;
  border: 1px solid var(--vt-color-border);
  border-radius: t.$radius-sm;
  cursor: pointer;
  appearance: none; // 移除默认样式
  
  // 自定义下拉箭头（SVG）
  background-image: url("data:image/svg+xml;utf8,...");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 18px 18px;
  
  &:hover {
    border-color: var(--vt-color-brand-primary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--vt-color-focus);
    box-shadow: 0 0 0 3px rgba(var(--vt-color-brand-primary-rgb), 0.1);
  }
}
```

#### ✅ 应用范围

**已统一的页面：**
- ✅ 字幕转换页面 - 输出格式、编码、字符集
- ✅ 音视频合并页面 - 输出格式
- ✅ 字幕烧录页面 - 质量预设、编码器
- ✅ 视频转码页面 - 格式、编码、质量、预设
- ✅ 日志查看页面 - 日志级别
- ✅ 关于页面 - 主题、语言

#### 视觉对齐

```
标签文字：      [选择框 ▼]  [按钮]
  14px             28px       28px     ← 高度一致
  400粗细          14px       14px     ← 字体大小一致
                   400        400      ← 字体粗细一致
```

---

### 3. 输入框 (Input)

#### 尺寸规范

| 属性 | 值 | 说明 |
|------|-----|------|
| 高度 | 32px | 标准输入框 |
| 字体大小 | 14px | 与正文一致 |
| 字体粗细 | 400 | 正常字重 |
| 内边距 | 0 12px | 左右均等 |
| 圆角 | 6px | 与按钮一致 |

#### 样式代码示例

```scss
.input {
  height: t.$input-height-md; // 32px
  padding: 0 t.$spacing-3; // 0 12px
  font-size: t.$font-size-base; // 14px
  font-weight: 400;
  border: 1px solid var(--vt-color-border);
  border-radius: t.$radius-sm;
  
  &:focus {
    outline: none;
    border-color: var(--vt-color-focus);
    box-shadow: 0 0 0 3px rgba(var(--vt-color-brand-primary-rgb), 0.1);
  }
  
  &::placeholder {
    color: var(--vt-color-text-tertiary);
  }
}
```

---

### 4. 滑块 (Slider)

#### 尺寸规范

| 属性 | 值 |
|------|-----|
| 轨道高度 | 4px |
| 滑块直径 | 16px |
| 字体大小（数值） | 14px |

#### 样式代码示例

```scss
.slider {
  height: 4px;
  background: var(--vt-color-fill-secondary);
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--vt-color-brand-primary);
    cursor: pointer;
  }
}
```

---

### 5. 开关 (Switch)

#### 尺寸规范

| 属性 | 值 |
|------|-----|
| 宽度 | 40px |
| 高度 | 22px |
| 圆球直径 | 18px |

---

### 6. 卡片 (Card)

#### 样式规范

| 属性 | 值 |
|------|-----|
| 内边距 | 16px 或 20px |
| 圆角 | 8px |
| 背景色 | #FFFFFF |
| 边框 | 1px solid var(--vt-color-border) |
| 阴影（hover） | 0 2px 8px rgba(0, 0, 0, 0.08) |

---

### 7. 表格 (Table)

#### 样式规范

| 属性 | 值 |
|------|-----|
| 行高 | 40px |
| 单元格内边距 | 12px |
| 表头字体粗细 | 500 |
| 边框颜色 | var(--vt-color-border) |

---

## 🎯 布局规范

### 1. 页面结构

```
┌─────────────────────────────────┐
│  Page Header (32px height)      │
├─────────────────────────────────┤
│                                 │
│  Content Area                   │
│  - padding: 20px                │
│  - max-width: 1200px            │
│                                 │
└─────────────────────────────────┘
```

### 2. 表单布局

**标签与控件：**
- 标签位置：左对齐，控件右侧
- 标签宽度：固定（如 120px）
- 标签与控件间距：12px
- 垂直间距：16px

**示例：**
```
输出格式：    [选择框 ▼]
编码：        [选择框 ▼]
质量：        [滑块──────●──] 23
```

### 3. 按钮组

**水平排列：**
- 按钮间距：8px
- 主按钮在最右侧
- 次要按钮在左侧

**示例：**
```
[取消]  [开始转换]
 ↑次要    ↑主要
```

---

## 🎨 颜色规范

### 主题色

| 名称 | 亮色模式 | 暗色模式 | 用途 |
|------|----------|----------|------|
| 品牌主色 | #007AFF | #0A84FF | 主按钮、链接、选中状态 |
| 成功色 | #34C759 | #30D158 | 成功提示、进度完成 |
| 警告色 | #FF9500 | #FF9F0A | 警告提示 |
| 错误色 | #FF3B30 | #FF453A | 错误提示、危险操作 |

### 文字颜色

| 名称 | 亮色模式 | 暗色模式 | 用途 |
|------|----------|----------|------|
| 主要文字 | #1D1D1F | #F5F5F7 | 标题、正文 |
| 次要文字 | #6E6E73 | #98989D | 辅助信息 |
| 三级文字 | #86868B | #636366 | 占位符、禁用文字 |

### 背景颜色

| 名称 | 亮色模式 | 暗色模式 | 用途 |
|------|----------|----------|------|
| 页面背景 | #F5F5F5 | #1C1C1E | 主背景 |
| 卡片背景 | #FFFFFF | #2C2C2E | 卡片、模态框 |
| 悬浮背景 | #F0F0F0 | #3A3A3C | hover状态 |

### 边框颜色

| 名称 | 亮色模式 | 暗色模式 | 用途 |
|------|----------|----------|------|
| 默认边框 | #D1D1D6 | #38383A | 输入框、选择框、卡片 |
| 聚焦边框 | #007AFF | #0A84FF | focus状态 |

---

## ✅ 实施检查清单

### 新组件开发

- [ ] 使用设计Token（字体、颜色、间距）
- [ ] 按钮高度28px，字体14px，字重400
- [ ] 选择框高度28px，字体14px，字重400
- [ ] 输入框高度32px，字体14px
- [ ] 圆角统一6px（小组件）
- [ ] 实现hover、focus、disabled状态
- [ ] 支持深色模式（使用CSS变量）

### 组件审查

- [ ] 与相邻组件高度对齐
- [ ] 字体大小与周围文字一致
- [ ] 内边距、外边距使用Token
- [ ] 交互反馈清晰（hover、active）
- [ ] 禁用状态视觉明确
- [ ] 响应式布局适配

---

## 📚 参考资源

### 设计Token定义

- `src/renderer/styles/tokens.scss` - 设计Token定义
- `src/renderer/styles/components/Button.module.scss` - 按钮样式规范

### 示例页面

- `SubtitleConvertTab` - 表单布局、选择框使用示例
- `TranscodeTab` - 复杂表单、双模式布局示例
- `AboutTab` - 信息展示、语言选择示例

---

## 🔄 变更历史

### v1.2.0 (2025-11-03)

**重大变更：**
- ✅ **统一所有选择框规范**：高度28px、字体14px、字重400
- ✅ **统一按钮默认尺寸**：高度28px、字体14px、字重400
- ✅ **废弃button-height-md (32px)**：统一使用28px

**影响范围：**
- 字幕转换页面
- 音视频合并页面
- 字幕烧录页面
- 视频转码页面
- 日志查看页面
- 关于页面

**迁移指南：**
```scss
// ❌ 旧写法
.select {
  height: t.$button-height-md; // 32px
  font-size: t.$font-size-sm; // 13px
}

// ✅ 新写法
.select {
  height: t.$button-height-sm; // 28px
  font-size: t.$font-size-base; // 14px
  font-weight: 400; // 正常字重
}
```

### v1.1.0 (2025-11-02)

- 初始UI规范文档
- 定义基础设计Token
- 确立组件样式规范

---

## 💡 设计原则提示

### DO ✅

- 使用设计Token，避免硬编码
- 保持组件尺寸一致性
- 提供清晰的交互反馈
- 注重细节和精致度
- 考虑深色模式支持

### DON'T ❌

- 不要随意修改Token值
- 不要使用过大的组件尺寸
- 不要忽略hover/focus状态
- 不要在组件中硬编码颜色
- 不要忘记字体粗细设置

---

## 📞 联系方式

如有UI设计相关问题，请参考：
- 本设计规范文档
- 查看示例页面源代码
- 检查设计Token定义

---

**最后更新：2025-11-03**  
**文档版本：v1.2.0**

