# HandBrake UI 视觉样式与设计令牌（Design Tokens）

本文件定义跨平台可落地的视觉系统：颜色、字体、字号、行高、间距、圆角、阴影、图标规格、控件尺寸、状态、动效与布局网格；并提供 macOS、Windows（WPF）、Linux（GTK4）实现映射建议。

设计目标：
- 基于 HandBrake UI 观感进行现代化统一，确保高对比、可读性与跨平台一致体验；
- 全量参数化（令牌化），便于在代码、主题与构建系统中统一替换与校验；
- 轻动效、强信息密度、清晰的层级与分组。

---

## 1. 颜色（Colors）

语义优先，浅/深色各定义一套。对比度须满足 AA（正文≥4.5:1，标题/大字≥3:1）。

基础调色板（建议值，可按品牌微调但保持对比）：

```
color.brand.primary       = #FF6A00  // 品牌主色（橙）
color.brand.primary-600   = #E65F00
color.brand.primary-700   = #CC5400

color.neutral.0           = #FFFFFF
color.neutral.50          = #F9FAFB
color.neutral.100         = #F3F4F6
color.neutral.200         = #E5E7EB
color.neutral.300         = #D1D5DB
color.neutral.400         = #9CA3AF
color.neutral.500         = #6B7280
color.neutral.600         = #4B5563
color.neutral.700         = #374151
color.neutral.800         = #1F2937
color.neutral.900         = #111827

color.semantic.info       = #2680EB
color.semantic.success    = #2EAE4E
color.semantic.warning    = #F59E0B
color.semantic.danger     = #E5484D

// 按主题派生
// Light
color.bg.light            = #FFFFFF
color.surface.light       = #F9FAFB
color.surface.elev1.light = #FFFFFF
color.text.primary.light  = #111827
color.text.secondary.light= #4B5563
color.text.disabled.light = #9CA3AF
color.border.light        = #E5E7EB
color.focus               = #2680EB

// Dark
color.bg.dark             = #0B0F14
color.surface.dark        = #121821
color.surface.elev1.dark  = #0F141C
color.text.primary.dark   = #F3F4F6
color.text.secondary.dark = #CBD5E1
color.text.disabled.dark  = #8B95A7
color.border.dark         = #2A2F3A
```

状态叠加（以透明度叠加在当前控件底色上）：
```
state.alpha.hover    = 0.04
state.alpha.pressed  = 0.08
state.alpha.selected = 0.12
state.opacity.disable= 0.38
```

按钮与输入框配色规范（示例）：
```
// Button (Primary)
btn.primary.bg.light         = color.brand.primary
btn.primary.text.light       = #FFFFFF
btn.primary.bg.dark          = color.brand.primary
btn.primary.text.dark        = #0B0F14
btn.primary.hover.overlay    = state.alpha.hover
btn.primary.pressed.overlay  = state.alpha.pressed

// Button (Neutral)
btn.neutral.bg.light         = color.neutral.100
btn.neutral.text.light       = color.text.primary.light
btn.neutral.bg.dark          = color.surface.elev1.dark
btn.neutral.text.dark        = color.text.primary.dark

// Input
input.bg.light               = #FFFFFF
input.text.light             = color.text.primary.light
input.border.light           = color.border.light
input.bg.dark                = color.surface.elev1.dark
input.text.dark              = color.text.primary.dark
input.border.dark            = color.border.dark
input.focus.ring             = color.focus (1–2px)
```

---

## 2. 字体与排版（Typography）

字体家族（按平台回退）：
```
font.family.sans.macos   = -apple-system, SF Pro Text, Helvetica Neue, Arial
font.family.sans.windows = Segoe UI Variable, Segoe UI, Arial
font.family.sans.gtk     = Inter, Cantarell, Noto Sans, Arial
font.family.mono         = SF Mono, Menlo, Consolas, "Courier New"
```

字号与行高（统一 8pt 网格对齐）：
```
type.xs  = 12pt  / lh 16pt  // 注释、标签
type.sm  = 13pt  / lh 18pt  // 次要文本
type.md  = 14pt  / lh 20pt  // 正文（默认）
type.lg  = 16pt  / lh 22pt  // 强调正文/按钮文本
type.xl  = 20pt  / lh 26pt  // 标题（面板级）
type.2xl = 24pt  / lh 30pt  // 主标题

weight.regular   = 400
weight.medium    = 500
weight.semibold  = 600
```

数字/进度使用等宽字体（`font.family.mono`），保证数字对齐。

---

## 3. 间距、圆角与阴影（Spacing, Radius, Shadows）

```
space.0 = 0
space.1 = 4
space.2 = 8
space.3 = 12
space.4 = 16
space.5 = 20
space.6 = 24
space.8 = 32
space.10= 40
space.12= 48

radius.sm = 4
radius.md = 8
radius.lg = 12
radius.pill = 999

shadow.none = 0
// 轻/中/重：由平台映射，建议：
shadow.sm   = y 1 blur 2 alpha 0.12
shadow.md   = y 2 blur 8 alpha 0.16
shadow.lg   = y 8 blur 24 alpha 0.18
```

---

## 4. 图标（Iconography）

```
icon.size.sm = 16
icon.size.md = 20
icon.size.lg = 24
icon.size.xl = 32
icon.stroke  = 1.5px（线性图标）

// 资源格式建议：
macOS  使用 PDF 矢量模板 + 系统着色
Windows 使用 Path/DrawingImage（XAML 几何数据）
GTK    使用 SVG（遵循 24px 基线网格）
```

命名：`Icon.<Action>`（如 `Icon.Play`、`Icon.Stop`、`Icon.Queue`），前后景清晰，在深浅色均可辨。

---

## 5. 控件尺寸（Controls Sizing）

统一高密度桌面规格，基于 8pt 网格：

```
button.height.sm = 28   paddingX.sm = 10
button.height.md = 32   paddingX.md = 12   // 默认
button.height.lg = 36   paddingX.lg = 16
button.radius    = radius.md

input.height.sm  = 28   paddingX.sm = 10
input.height.md  = 32   paddingX.md = 12
input.height.lg  = 36   paddingX.lg = 12
input.radius     = radius.sm

checkbox.size    = 16
switch.height    = 20   switch.width = 36

segment.height   = 28   segment.gap  = 1   segment.radius = radius.md
tab.height       = 32   tab.indicator = 2（下划线或背景）

list.row.height.sm = 28
list.row.height.md = 32 // 默认
list.row.height.lg = 40
```

---

## 6. 状态（States）

各控件均需定义 `default/hover/focus/pressed/selected/disabled`：
- Hover：在当前底色上叠加 `state.alpha.hover`；
- Pressed：叠加 `state.alpha.pressed`；
- Focus：显示 1–2px focus ring（`color.focus`），满足可达性；
- Disabled：文本/图标 `opacity = state.opacity.disable`；禁用交互与光标；
- Selected：适度提升背景对比或高亮边框，同时保持文本可读性。

---

## 7. 动效（Motion）

面向微交互，克制且快速：
```
motion.fast    = 120ms
motion.normal  = 180ms   // 默认
motion.slow    = 240ms
easing.standard   = cubic-bezier(0.2, 0, 0, 1)
easing.decelerate = cubic-bezier(0, 0, 0.2, 1)
easing.accelerate = cubic-bezier(0.3, 0, 1, 1)
```

过渡范围：颜色、背景、阴影、位移 ≤ 2px；避免大范围布局抖动。

---

## 8. 布局网格（Grid & Layout）

```
grid.base = 8
content.padding.window = 16（左右外边距）
section.gap = 24
max.content.width = 1240（中心对齐）

breakpoint.compact  <  1120  // 适当隐藏次要列/工具
breakpoint.cozy     >= 1120  // 默认
breakpoint.spacious >= 1440  // 展开更多信息/列
```

---

## 9. 组件样式要点（示例）

- Toolbar：图标 20/24，按钮间距 `space.2`，分组之间 `space.4`；禁用态降低不透明度。
- Tabs：指示条 2px；选中 Tab 使用强调色或加粗文本（`weight.medium`）。
- 表单：标签 `type.xs` 次级色；校验错误用 `color.semantic.danger` + 文本说明；成功用 `success` 辅助色。
- 进度条：高度 4px；不确定进度使用跑马灯，颜色为品牌主色 70% 不透明度。

---

## 10. 平台实现映射（关键点）

macOS（AppKit）：
- 字体：`NSFont.systemFont(ofSize:weight:)`，等宽用 `monospacedDigitSystemFontOfSize`；
- 主题：使用系统外观，颜色通过 `NSColor` 适配浅/深色；Focus ring 使用 `NSColor.keyboardFocusIndicatorColor`；
- 阴影：`NSShadow` 或视图层 `shadow*` 属性；
- 图标：使用 PDF 模板图，`isTemplate = YES` 允许系统着色。

Windows（WPF）：
- 字体：`FontFamily="Segoe UI Variable"` 回退 `Segoe UI`；字号使用 `pt` 对齐网格；
- 主题与颜色：通过 `ResourceDictionary` 暴露令牌键；`DynamicResource` 切主题；
- 阴影：`DropShadowEffect`（克制使用）或 WinUI 3 映射；
- 图标：Path/Geometry 数据，命名 `Icon.*`，支持 `Foreground` 动态绑定。

GTK4：
- 字体：CSS `font` 设置于根节点；
- 主题与颜色：在 CSS 变量中定义令牌，或用自定义样式类；
- 阴影：`box-shadow`；
- 图标：SVG 放入 `gresource`，按 24px 基线绘制。

---

## 11. 可访问性与对比校验

- 所有文本与其背景的对比度：正文 ≥ 4.5:1，标题/≥18pt 文本 ≥ 3:1；
- Focus ring 必须可见；键盘路径完整；图标需可读的替代文本或可访问名称；
- 颜色不作为唯一信息载体，配合图标/文本/样式提示。

---

## 12. 令牌交付格式（建议）

建议同时维护 JSON 与平台映射资源：
```
tokens.json         // 设计源（上文结构）
macos/Colors.plist  // 颜色映射
windows/Theme.xaml  // 颜色/字号/间距映射
docs/platform-mappings/gtk/theme.css       // GTK CSS 变量映射
```

并在 CI 中校验对比度与主题一致性（可用脚本扫描 tokens 与快照截图）。


