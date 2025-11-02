# HandBrake 桌面端 UI 开发规范（跨平台总纲）

适用范围：macOS（AppKit/Objective‑C + XIB）、Windows（WPF/.NET + XAML + MVVM）、Linux（GTK4 + C + GtkBuilder + gresource）。本规范旨在统一三平台的信息架构、交互与视觉、一致的工程与代码组织方式，确保新增/迭代 UI 的可维护性与一致性。

## 1. 统一设计原则

- 一致性优先：三平台的主信息架构一致（主窗口结构、工具栏、Tab、状态栏、队列/预览），必要差异必须有平台理由并保持术语一致。
- 系统优先：优先使用平台原生控件/样式（AppKit、WPF、GTK4），自动适配浅/深色与可访问性能力。
- 可用性为王：关键路径两步内可达；操作可被发现（可见入口+快捷键+菜单），状态可见，错误可理解并可行动。
- UI 与任务解耦：UI 线程仅负责渲染与轻逻辑；扫描/转码/预览等重任务在后台线程/进程完成（Windows 维持 Worker 进程隔离）。
- 国际化默认开启：所有用户可见文案进入 i18n 资源；禁止硬编码字符串与单位；占位符可翻译、可复数化。
- 可访问性内建：键盘可达性、朗读信息、对比度、焦点可视化均为必选项，不是额外增强。

## 2. 信息架构（IA）与导航

- 结构（统一）：
  - 顶部工具栏：源选择、预设、预览、队列、开始/停止。
  - 主面板为 Tab（顺序固定）：Summary → Picture → Filters → Video → Audio → Subtitles → Chapters。
  - 底部状态区：进度条/文本、目的地路径、即时状态。
- 导航与操作：
  - Tab 键顺序清晰且跨平台一致；重要操作提供双入口（工具栏/菜单/快捷键/右键）。
  - 建议统一快捷键：
    - 打开源 ⌘/Ctrl+O；开始编码 ⌘/Ctrl+B；停止 ⌘/Ctrl+S；预览 ⌘/Ctrl+P；队列 ⌘/Ctrl+J；前/后标题 ⌘/Ctrl+← →；切换 Tab ⌘/Ctrl+1..7。

## 3. 布局与响应

- 窗口与最小尺寸：初始约 1060×690；最小宽度不小于 1000；分栏/详细面板设置合理最小厚度，避免破版。
- 自动布局：
  - macOS：Auto Layout + 优先级/抗压缩；禁用窗口 Tab 合并；macOS 11+ 使用合适 `toolbarStyle`。
  - Windows：`UseLayoutRounding`、`SnapsToDevicePixels`、`TextFormattingMode=Display`；Grid + 星号尺寸；Tab 内控件具备换行/收缩策略。
  - GTK：GtkBuilder + GtkGrid/GtkBox；默认尺寸读取首选项并回写；遵循 GTK4 尺寸策略。
- 列表/长内容：虚拟化或惰性渲染；撑满可用空间；滚动条/分页清晰；避免布局抖动。

## 4. 主题、色彩与图标

- 主题：跟随系统浅/深色；禁强制自定义整套色板；必要强调色遵循平台建议。
- 颜色语义：成功/信息/警告/错误四类；对比度满足 WCAG AA；禁仅用颜色传达状态。
- 字体：使用系统 UI 字体；日志/进度等数字用等宽字体。
- 图标：统一使用 `graphics/` 资源（优先矢量：macOS PDF、Windows DrawingImage/Geometry、GTK SVG）；支持 HiDPI/Retina；禁位图拉伸失真。

## 5. 可访问性（A11y）

- 键盘：完整 Tab 顺序、箭头导航、快捷键提示；默认聚焦合理；焦点可见。
- 朗读/辅助：提供可访问名称、描述、提示；图标/自定义控件必须有替代文本。
- 对比与状态：错误/警告带图标与文本，不仅靠颜色；禁动画干扰阅读。

## 6. 国际化（i18n/L10n）

- 资源：
  - macOS：`.lproj/*.strings`；XIB 绑定 IBOutlet；禁止硬编码。
  - Windows：`.resx` + 绑定；不要在 XAML 内直接写显示文本。
  - GTK：`.po` + `.ui` 文案统一 gettext；通过 gresource 打包。
- 文案规则：完整句式；具名占位 `{count}`；单位/格式本地化；支持复数与 RTL。
- 测试：伪本地化（加宽/超长）与 RTL；溢出与截断检查；必要时提示“需重启后生效”。

## 7. 长任务、性能与并发

- 线程模型：UI 线程不执行耗时；扫描/转码/预览帧后台；Windows 继续使用 Worker 进程隔离以提升稳定性。
- 进度刷新：不确定 → 确定进度；最小刷新周期建议 ≥ 200ms；支持取消/重试。
- 资源：大图/缩略图异步解码与缓存；限制并发，避免阻塞 UI。

## 8. 状态持久化与首选项

- macOS：`NSUserDefaults`（键常量化）；迁移老键需兼容；沙箱环境处理 bookmark/token。
- Windows：设置服务层封装（AppSettings/UserSettings），禁 UI 直接读写文件。
- GTK：统一 `prefs` 字典键空间，应用生命周期中读取与回写窗口大小、最近源、日志等级、队列恢复等。

## 9. 错误、通知与日志

- 层级：提示 < 警告 < 错误（阻断）；致命错误使用模态，普通问题尽量非阻塞。
- 呈现：控件内联错误 + 顶部/底部聚合 + 可复制的日志细节；错误文案包含行动建议。
- 日志：等宽字体、可复制；按任务过滤；重要阶段生成关键节点，方便问题追踪。

## 10. 命名与工程组织

- 视图/控制/资源命名：
  - macOS：`HB<Feature>ViewController`、`HB<Feature>Controller`；XIB 语义命名（如 `MainWindow.xib`）；IBOutlet 如 `summaryTab`、`scanIndicator`。
  - Windows：`<Feature>View.xaml`、`<Feature>ViewModel.cs`、`<Feature>Service.cs`；资源键 PascalCase；样式 `Style.<Control>.<Purpose>`。
  - GTK：C 文件 `featurehandler.c`，UI `ghb-<control>.ui`；符号统一前缀 `ghb_`；信号函数 `<module>_<verb>`。
- 资源分布：图标按平台资源体系存放；同语义保持同名映射；字符串全部进入本地化资源。

## 11. 评审与测试清单（必过）

- 视觉/布局：浅/深色一致；HiDPI 清晰；最小尺寸不破版；文案不溢出。
- 交互：键盘导航/快捷键无冲突；拖拽导入/导出；Tab 切换与焦点管理。
- 可访问性：屏幕阅读器朗读合理；焦点环可见；对比度达标。
- 国际化：伪本地化/RTL；占位/复数正确；单位/格式本地化。
- 性能：首次打开、Tab 切换流畅；列表滚动不卡顿；长任务期间 UI 保持响应。
- 稳定性：取消/失败/重试路径；崩溃不丢队列与设置（Windows 进程隔离）。

## 12. PR 提交流程

- 必附材料：
  - 影响范围与截图/动图（浅/深色、关键路径）。
  - i18n 改动点与新键名清单。
  - 可访问性说明（键盘路径、自动化属性/可访问名称）。
  - 回归冒烟通过记录：打开源 → 选预设 → 配置 → 预览 → 入队 → 开始 → 查看日志。
- 同步项：
  - 版本/依赖最小版本声明（macOS 11+ API `@available` 守护；Windows 目标框架；GTK 依赖版本）。
  - 文档：如新增组件，补充平台细则文档使用方式/限制说明。

## 13. 视觉样式与设计令牌（新增）

完整的颜色/字体/字号/行高/间距/圆角/阴影/图标/控件尺寸/状态/动效/网格定义，见：
- `docs/HandBrake_UI_视觉样式与设计令牌.md`
- 机器可读：`docs/tokens/handbrake-ui-tokens.json`
- 平台映射样板：
  - Windows：`docs/platform-mappings/windows/Theme.xaml`
  - macOS：`docs/platform-mappings/macos/Colors.plist`
  - GTK：`docs/platform-mappings/gtk/theme.css`

摘要（关键默认值）：
- 字体：正文 14pt/20lh，按钮/强调 16pt，标题 20–24pt；
- 颜色：文本（浅）#111827，（深）#F3F4F6；边框（浅）#E5E7EB，（深）#2A2F3A；主色 #FF6A00；
- 控件高：按钮/输入框 32pt，圆角 8；列表行高 32pt；
- 图标：20/24px；间距：8pt 网格；动效：180ms；状态：hover/pressed 0.04/0.08；

组件样式规范：`docs/HandBrake_UI_组件样式规范.md`。

拓展资料：
- 图标规范：`docs/icons/HandBrake_UI_图标规范.md`
- 组件状态色值对照：`docs/HandBrake_UI_组件状态色值对照.md`
- 截图与可访问性校验：`docs/HandBrake_UI_截图规范与可访问性校验.md`

## 14. 跨平台“新增参数”实施模板

1) 设计与对齐：确定参数归属 Tab/分组；三平台术语与文案统一；占位/提示一致。

2) 实现：
- macOS：XIB 放置控件 → IBOutlet/IBAction 绑定 → 控制器与 libhb 映射 → `NSUserDefaults` 持久化。
- Windows：XAML + ViewModel 属性/Command 绑定 → 验证规则 → 设置服务持久化。
- GTK：`.ui` 加控件 → `callbacks.c` 绑定信号 → 读写 `prefs` → 与 libhb 对接。

3) 校验：视觉/交互/a11y/i18n/性能清单全通过；新增/变更键名记录进变更说明。

---

说明：本 `docs/` 目录可独立迁移与使用，不依赖原项目源码路径。若需在原仓库中比对实现，可在本机查看原始项目源代码：`/Users/binbin/Downloads/HandBrake`。


