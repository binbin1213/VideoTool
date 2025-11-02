# HandBrake Linux UI 开发细则（GTK4 / C / GtkBuilder）

本指南适用于 GTK4 + C 项目；本文档可独立于任何仓库使用，示例中涉及的路径应替换为你项目内的实际路径。

## 1. 工程与结构

- 程序入口与初始化：在 `GtkApplication::activate` 中只做轻量初始化；为避免 GAction 与 GtkBuilder 时序问题，UI 初始化可通过 `g_idle_add` 延迟至 idle。
- UI 资源：建议使用 GtkBuilder `.ui` 并通过 gresource 打包（Meson `gnome.compile_resources`）。
- 模块化组件：`ghb-button`、`ghb-file-button`、`ghb-queue-row`、`ghb-string-list` 等（`.c` + `.ui`）。

## 2. 布局与呈现

- 布局容器：优先 `GtkGrid`/`GtkBox`；Tab 面板与分组保持与 macOS/Windows 一致顺序与分区。
- 窗口尺寸：默认宽高来自用户首选项键（如 `window_width`/`window_height`），应用启动恢复并在退出时回写。
- 资源加载：图标/界面通过 gresource；避免运行时文件路径依赖。

## 3. 主题、色彩与图标

- 遵循 GTK4 与 Adwaita HIG；浅/深色由系统控制，不自定义整套色板。
- 图标优先 SVG；HiDPI 支持；禁用位图拉伸。

## 4. 可访问性（A11y）

- 键盘：完整 Tab 顺序与焦点链；快捷键与菜单条目对齐。
- 无障碍名称：自定义控件提供 `accessible-name/description`；错误提供图标与文本。
- 对比：遵循 GTK 默认对比要求；禁动画干扰阅读。

## 5. 交互与反馈

- 进度/状态：底部状态栏或面板即时反馈；长细节进入日志；错误信息提供行动建议。
- 拖拽：主窗口/主要容器支持文件/目录拖入；非法类型拒绝并提示。
- 预览：帧解码异步；控制并发；避免主循环阻塞。

## 6. 长任务与计时器

- 后台任务：libhb 相关调用在后台线程执行；与 UI 交互通过 `g_idle_add` 回到主线程。
- 进度刷新：使用 `g_timeout_add` 周期刷新（现有实现约 200ms），避免过度频繁。

## 7. 首选项与持久化

- 统一 `ud->prefs` 字典访问：
  - 启动读取：窗口尺寸、默认源、日志等级、自动选择、队列恢复等。
  - 退出回写：窗口状态、最近源、用户更改的选项。

## 8. 国际化

- 字符串进入 `.po` 与 `.ui`；使用 gettext；`GETTEXT_PACKAGE` 在构建中设置。
- 文案：完整句式与具名占位符；避免在 C 代码中拼接多段句子。
- 测试：伪本地化/RTL；溢出/截断检查；必要时提示用户“需重启生效”。

## 9. 命名规范

- C 符号：前缀 `ghb_`；函数 `<module>_<verb>`；回调 `on_<widget>_<signal>`。
- UI 文件：`ghb-<control>.ui`；资源 id 与对象名语义化，便于 `ghb_builder_widget()` 检索。

## 10. 新增参数/控件实施清单

1) 设计对齐：确定所属 Tab/分组；与 macOS/Windows 的术语/位置/Tooltip 对齐。

2) 实现步骤：
- 在 `.ui` 文件新增控件，设置 `id` 与可访问名称；更新 `ui_res.gresource.xml`，确保被打包。
- 在对应模块 `*.c`：
  - 通过 `gtk_builder_get_object` 获取控件；在 `callbacks.c`/模块内连接信号。
  - 在 `ud->prefs` 中读写默认值与持久化；与 libhb 参数建立映射。
  - 跨线程回到 UI 线程使用 `g_idle_add`。

3) 校验：浅/深色、键盘导航、可访问性、伪本地化、性能与回归冒烟。

## 11. 参考文件

上述内容为参考实践，请在你的项目中按对应文件结构落地实现。

## 12. PR 检查单（GTK 专项）

- `.ui` 与 `.po` 键值补齐；gresource 更新；构建通过。
- 可访问性名称/描述补全；Tab 顺序；浅/深色截图。
- 回归冒烟（打开源→预设→配置→预览→入队→开始→查看日志），计时器刷新频率与 UI 流畅度验证。


