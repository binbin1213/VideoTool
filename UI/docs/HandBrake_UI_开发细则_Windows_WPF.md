# HandBrake Windows UI 开发细则（WPF / .NET / MVVM）

本指南适用于 Windows WPF + MVVM 项目；本文档可独立于任何仓库使用，示例中涉及的路径应替换为你项目内的实际路径。

## 1. 架构与组织

- 外壳窗口：`Views/ShellView.xaml`，装配 `MainView`/`OptionsView` 等，设置窗口尺寸、拖拽与可见性。
- 视图命名：`<Feature>View.xaml`；视图模型：`<Feature>ViewModel.cs`；服务：`<Feature>Service.cs`。
- MVVM 约束：事件/操作通过 `ICommand`；业务逻辑不放在 code-behind；UI 状态通过绑定与通知属性驱动。

## 2. 布局与呈现

- 全局渲染建议：
  - `SnapsToDevicePixels="True"`、`UseLayoutRounding="True"`、`TextOptions.TextFormattingMode="Display"`。
- 布局：
  - 使用 Grid + 星号尺寸构建弹性布局；Tab 内控件具备最小宽度/换行策略。
  - 大列表/队列使用虚拟化容器（`VirtualizingStackPanel`）与延迟加载。

## 3. 主题、样式与资源

- 主题通过 `Themes/Light.xaml`、`Themes/Dark.xaml` 的 ResourceDictionary 切换；样式键命名 `Style.<Control>.<Purpose>`。
- 禁止在 XAML 内直接写死颜色/字体，统一来自资源；图标优先使用矢量 Path/DrawingImage。

## 4. 可访问性（A11y）

- 键盘：确定且一致的 Tab 顺序；快捷键合理可达。
- 自动化属性：为交互控件设置 `AutomationProperties.Name` 与 `AutomationProperties.HelpText`。
- 对比与可读性：浅/深色均满足对比度；焦点可见；错误不只靠颜色表达。

## 5. 交互与反馈

- 拖拽：外壳窗口处理 Drop（参考 `ShellView_OnDrop`），过滤非法类型并提示。
- 状态与进度：主视图提供清晰进度/状态文本；日志面板可复制、按任务过滤。
- 预览：预览帧解码异步，限制并发，避免 UI 卡顿。

## 6. 长任务与隔离

- 采用 Worker 进程（`HandBrake.Worker`）进行转码任务，与 UI 进程隔离，避免崩溃拖垮界面。
- 进度刷新频次控制（建议 ≥ 200ms）；提供取消/重试；错误可追溯并含解决建议。

## 7. 设置与持久化

- 通过设置服务封装应用/用户设置（避免在 ViewModel 之外直接读写磁盘）。
- 保存窗口状态、最近源、预设、主题偏好、日志等级、队列状态等；应用启动时恢复。

## 8. 国际化

- 字符串进入 `.resx`；XAML 通过绑定/静态资源引用，不直接硬编码显示文本。
- 伪本地化、超长文本与 RTL 检查；避免字符串拼接导致语序问题。

## 9. 命名规范

- 视图：`<Feature>View`；视图模型：`<Feature>ViewModel`；命令：`<Action>Command`；服务：`<Domain>Service`。
- 资源键：PascalCase；样式：`Style.<Control>.<Purpose>`；图标：`Icon.<Name>`。

## 10. 新增参数/控件实施清单

1) 设计对齐：确定所处 Tab 与分组；与 macOS/GTK 统一术语/文案/Tooltip。

2) 实现步骤：
- XAML 放置控件，绑定到 ViewModel 属性/命令；验证规则（DataAnnotations/ValidationRule）。
- ViewModel 将 UI 值映射到核心参数；通过服务层持久化。
- 性能：必要时 UI 虚拟化/延迟加载；避免热路径频繁触发 Layout。

3) 校验：浅/深色、键盘与可访问性、伪本地化、性能与回归冒烟。

## 11. 参考文件

- `Views/ShellView.xaml`：外壳窗口、尺寸、拖拽、视图装配与可见性绑定。
- `Themes/Light.xaml`、`Themes/Dark.xaml`：主题与样式入口。
- `Views/MainView.xaml` 及其子视图：主 UI 的分区与控件布局。

## 12. PR 检查单（Windows 专项）

- 无硬编码字符串；XAML 绑定无错误；主题资源引用规范。
- 自动化属性补全；Tab 顺序与快捷键说明；浅/深色截图。
- 回归冒烟（打开源→预设→配置→预览→入队→开始→查看日志）与 Worker 进程下异常恢复验证。


