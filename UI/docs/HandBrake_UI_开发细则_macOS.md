# HandBrake macOS UI 开发细则（AppKit / Objective‑C）

本指南适用于 macOS AppKit + Objective‑C 项目；本文档可独立于任何仓库使用，示例中涉及的路径应替换为你项目内的实际路径。

## 1. 工程与结构

- 主窗口与控制器：
  - `HBController`：应用主窗口控制器，负责工具栏、主 Tab、状态栏、拖拽、预设 Popover 等。
  - `HBQueueController`：队列窗口，使用 `NSSplitViewController` 组织表格与详情面板。
  - XIB：`Base.lproj/MainWindow.xib` 绑定主窗口 IBOutlet（如 `summaryTab`、`scanIndicator` 等）。
- 规则：视图声明（XIB）与控制逻辑（Controller）解耦；所有 IBOutlet/IBAction 语义化命名。

## 2. 布局与窗口

- Auto Layout：
  - 必须使用 Auto Layout；设置内容压缩/拥抱优先级，避免约束歧义与运行时断言。
  - 列表/容器设置最小尺寸，保持在最小窗口下不破版。
- 窗口与 Toolbar：
  - 禁用窗口 Tab 合并：`self.window.tabbingMode = NSWindowTabbingModeDisallowed;`
  - macOS 11+：根据窗口类型设置 `toolbarStyle`（主窗口 Expanded，队列窗口 Unified）。
  - `NSToolbar` 应支持用户自定义与 autosave，`displayMode = IconAndLabel`。

## 3. 主题、字体与图标

- 跟随系统浅/深色与强调色；优先系统控件与标准外观，避免自绘。
- 等宽字体：进度/日志使用 `+[NSFont monospacedDigitSystemFontOfSize:weight:]` 等。
- 图标：优先 PDF 矢量；Retina 就绪；工具栏图标提供启用/禁用态。

## 4. 可访问性（A11y）

- 键盘：完整的 Tab 顺序；初始焦点合理；所有操作可被键盘触达。
- 可读性：聚焦环可见；对比度达标；错误不只用颜色表达，配合图标与文本。
- VoiceOver：给自定义控件添加可访问名称与描述。

## 5. 交互与反馈

- 预设 Popover：
  - 使用 `NSPopover`，建议尺寸 300×580，`behavior = NSPopoverBehaviorSemitransient`。
- 拖拽：
  - 在 `NSWindow` 与主 `NSTabView` 注册 `NSPasteboardTypeFileURL`；非法类型弹非阻塞提示。
- 进度/状态：
  - 底部状态栏展示短文本进度；长细节进入日志视图；避免频繁 UI 刷新。

## 6. 长任务与后台执行

- UI 线程仅做渲染；扫描/转码/预览在后台执行。
- 进度模式：不确定 → 确定；提供取消；错误清晰可理解并可复制。

## 7. 首选项与持久化

- 使用 `NSUserDefaults`：
  - 保存：窗口尺寸、最后目的地、日志等级、首选项、最近源等。
  - 沙箱构建下，目录权限使用 bookmark/token（参考 `__SANDBOX_ENABLED__` 路径）。
- 键名常量化，并处理历史迁移。

## 8. 国际化

- `.lproj/*.strings` 与 XIB 本地化；禁止硬编码字符串。
- 文案：完整句式、具名占位符（如 `%@` 需结合格式化上下文），尽量避免拼接句。
- 伪本地化测试（加宽/RTL），防止截断与溢出。

## 9. 命名规范

- 控制器：`HB<Feature>ViewController`、`HB<Feature>Controller`。
- IBOutlet：语义清晰（如 `summaryTab`、`pictureTab`、`scanIndicator`、`statusField`）。
- 资源：XIB 文件语义命名；图标按用途分组存放。

## 10. 新增参数/控件实施清单

1) 设计对齐：
- 确定归属 Tab（Summary/Picture/Filters/Video/Audio/Subtitles/Chapters）与分组。
- 三平台术语、文案、Tooltip 一致。

2) 实现步骤：
- 在关联的 XIB 放置控件，命名规范；连接 IBOutlet/IBAction 至对应控制器。
- 在控制器中：
  - 更新界面状态与与 libhb 参数映射。
  - 读写 `NSUserDefaults` 实现持久化（含默认值与迁移）。
  - 保证 UI 更新在主线程（必要时 `dispatch_async` 回到主队列）。

3) 校验：
- 浅/深色、最小窗口、键盘导航、VoiceOver、伪本地化、性能（刷新频率）全面通过。

## 11. 代码片段参考（路径）

上述内容为参考实践，请在你的项目中按对应文件结构落地实现。

## 12. 兼容性与可用性

- 使用 `@available(macOS 11, *)` 保护新 API；老系统优雅降级。
- 禁止使用私有 API；优先系统建议的人机界面指南（HIG）。

## 13. PR 检查单（macOS 专项）

- XIB/约束无警告；控制器无 UI 主线程之外的直接操作。
- 本地化键补齐；浅/深色截图；键盘路径说明；VoiceOver 简述。
- 变更点：首选项键名、新的 IBOutlet/IBAction 清单；回归冒烟（打开源→预设→配置→预览→入队→开始→查看日志）。


