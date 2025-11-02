# HandBrake UI 组件样式规范

本文件基于“设计令牌”定义 Button、Input、Tabs、List、Toolbar、Progress、StatusBar、Alert 的样式与状态。所有色值/尺寸均来源于 tokens（见 `docs/HandBrake_UI_视觉样式与设计令牌.md` 与 `docs/tokens/handbrake-ui-tokens.json`）。

---

## 1. Button（按钮）

- 尺寸：`control.button.height.md`（32），左右内边距 `control.button.paddingX.md`（12），圆角 `radius.md`（8）。
- 字体：`type.lg`（16/22），`weight.medium`。
- 类型：Primary、Neutral、Danger。
- 颜色（Light）：
  - Primary：bg `brand.primary`，text `#FFF`，border 同 bg；
  - Neutral：bg `neutral.100`，text `text.primary.light`，border `border.light`；
  - Danger：bg `semantic.danger`，text `#FFF`；
- 状态：
  - hover：叠加 `state.alpha.hover`；
  - pressed：叠加 `state.alpha.pressed`；
  - focus：1–2px `color.focus` 外发光；
  - disabled：`opacity = state.opacity.disable`，禁交互。

## 2. Input（文本框/选择器）

- 尺寸：高度 32，左右内边距 12，圆角 `radius.sm`（4）。
- 字体：`type.md`（14/20）。
- 边框：`border.light`，聚焦高亮 `color.focus`，错误边框 `semantic.danger`。
- 占位符：`text.secondary.light`；禁用态：整体 `opacity.disable`。

## 3. Tabs（选项卡）

- 高度：32，指示条：2px（强调色）。
- 文本：`type.md`，选中可 `weight.medium`。
- 间距：Tab 之间 `space.4`，与内容区 `space.6`。

## 4. List（列表与行）

- 行高：`list.row.height.md`（32），紧凑与宽松为 28/40。
- 交替底色可选（对比轻微）；选中态使用 `state.alpha.selected` 叠加或边框高亮。
- 选中/悬停时文本对比仍需达标（AA）。

## 5. Toolbar（工具栏）

- 图标：20 或 24；按钮间距 `space.2`；分组间距 `space.4`；整体内边距 `space.3`。
- 文字标签 `type.sm`，隐藏/显示由布局断点决定。

## 6. Progress（进度）

- 条高：4px；颜色：品牌主色（70%）或语义色；
- 不确定进度：跑马灯，周期 `motion.normal`；
- 百分比文本：等宽字体（`font.family.mono`）。

## 7. StatusBar（状态栏）

- 字体：`type.sm`，等宽用于数字；
- 文本对齐与可复制性；
- 背景：`surface`；边界上方 1px `border` 线。

## 8. Alert（提示/警告/错误）

- 颜色：Info `semantic.info`、Success `semantic.success`、Warning `semantic.warning`、Danger `semantic.danger`；
- 结构：左图标 + 标题（`type.md`/`weight.semibold`）+ 正文（`type.sm`）；
- 圆角：`radius.md`；内边距：`space.4`；
- 关闭按钮：图标 16，hover/pressed 叠加透明度。

---

## 平台落地提示

- macOS：使用系统控件样式，必要时自定义 `NSView` 层样式；等宽/数字使用 `monospacedDigitSystemFont`；模板图标让系统着色。
- Windows：建议以 `ResourceDictionary` 提供颜色/Size/CornerRadius 等，控件 `Style` 仅绑定资源键；虚拟化列表确保性能。
- GTK：CSS 变量与类名（如 `.hb-button-primary`）配合 GtkBuilder，实现统一风格；主题切换靠系统或 CSS 覆盖。


