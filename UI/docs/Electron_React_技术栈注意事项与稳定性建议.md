# Electron + React 技术栈注意事项与稳定性建议

适用技术栈：
- 框架：Electron 34 + React 18.3
- 语言：TypeScript 5.7
- 构建：Vite 6 + electron-builder
- 状态管理：Zustand 5
- UI 库：React Bootstrap 2 + Bootstrap 5
- 视频处理：FFmpeg（fluent-ffmpeg / 本地可执行）
- 样式：Sass（SCSS）

目标：在保证安全、性能与可维护性的前提下，高一致性落地“设计令牌 + 组件状态”体系，并稳定支撑 FFmpeg 编码任务。

---

## 1. 安全与进程架构

- Browser/Renderer/Preload 职责清晰：
  - Renderer：纯 UI 与轻逻辑；禁直接访问 Node 能力与 shell。
  - Preload：通过 `contextBridge` 暴露受限 API（白名单），类型化入参/出参。
  - Main：文件系统、FFmpeg 调度、队列与系统集成；资源与崩溃保护。
- Electron 配置（强制）：
  - `sandbox: true`、`contextIsolation: true`、`nodeIntegration: false`、禁用 `remote`；
  - CSP 生效（脚本/样式/媒体源白名单）；
  - 外链统一经 `shell.openExternal` 且校验 URL 协议。
- IPC 安全：
  - channel 常量统一管理；请求/响应定义 TS 类型 + zod 校验；
  - 频率限流（≥200ms）与 payload 尺寸限制；
  - 生命周期管理：`ipcRenderer.once` 用于一次性事件，避免监听泄漏。

---

## 2. 构建与打包

- 分离构建：vite + vite-plugin-electron（或等价方案）分别产出 main/preload/renderer；main/preload 独立 tsconfig（`module`/`target` 与 Node/Electron 匹配）。
- electron-builder：
  - 开启 asar；FFmpeg 等需运行时访问的二进制/滤镜库放 `extraResources` 或 `asarUnpack`；
  - 多平台 ffmpeg 路径自检（macOS/Win/Linux）+ fallback；
  - 代码签名/公证 + electron-updater（建议手动触发下载、显示发布说明、允许回滚）。

---

## 3. FFmpeg 与性能

- 可执行路径：优先 `ffmpeg-static` 或 `@ffmpeg-installer/ffmpeg`，在 main 解析真实路径；开发/生产差异通过环境变量注入。
- 进程管理：
  - 使用 `child_process.spawn`；stderr 解析进度（`frame`, `fps`, `time`, `bitrate`）；
  - 统一超时/取消/重试策略；失败日志持久化；
  - 文件写入策略：临时目录输出 → 成功后原子重命名；
  - `powerSaveBlocker.start('prevent-app-suspension')` 防系统休眠。
- 并发：
  - 按 CPU 核 + IO 带宽设置并行上限，缺省 1–2 个；
  - 队列在 main，renderer 仅呈现 UI；
  - 进度事件节流（≥200ms），避免 IPC 风暴。
- 硬件加速：
  - macOS：VideoToolbox；Windows：QSV/NVENC；Linux：VAAPI；
  - 检测失败自动回退软件编码（x264/x265），并提示用户。

---

## 4. 状态管理（Zustand 5）

- 结构：slices（ui/userSettings/queue/presets），`combine` 组装；
- 性能：选择器订阅 + `shallow`，避免全局重渲染；
- 持久化：
  - UI 偏好可用 `persist`（localStorage）；
  - 关键设置/队列建议主进程 `electron-store`（或文件）持久化，renderer 通过 IPC 同步；
- 开发工具：devtools 仅在开发启用，生产关闭以避性能开销。

---

## 5. UI 与样式（对齐设计令牌）

- 令牌注入：
  - 以 `docs/tokens/handbrake-ui-tokens.json` 生成 `_tokens.scss`（CSS Variables）；
  - 在 `:root` 与 `[data-bs-theme="dark"]` 注入变量，覆盖 Bootstrap 主题变量（`$body-bg/$body-color/$border-color/$btn-*/$input-*`）。
- React Bootstrap：
  - 统一在 SCSS 中覆盖组件变量，保证 Primary/Neutral/Danger 与输入控件风格一致；
  - 焦点 ring 显式配置（1–2px，主色或 `--hb-focus`）。
- 长列表：使用 `react-window`/`react-virtualized`；
- 布局网格与间距：遵循 8pt 网格，窗口左右 16，分区 24；
- 深色模式：`nativeTheme.shouldUseDarkColors` → preload 暴露 → Zustand 驱动 `data-bs-theme` 与 CSS vars。

---

## 6. Electron 集成体验

- 系统菜单与快捷键：主流程（打开源/预览/开始/停止/队列）映射全局/窗口快捷键；
- 拖拽：主窗口与目标区域处理文件/目录拖入（校验类型）；
- 文件对话框：`dialog.showOpenDialog`/`showSaveDialog`；
- 单实例锁：`app.requestSingleInstanceLock()`；
- 崩溃与恢复：
  - 任务进行中崩溃 → 启动时恢复队列（基于持久化记录）或提示恢复选项；
  - UI 崩溃隔离：重启 renderer，不影响 main 任务。

---

## 7. 日志、观测与错误处理

- 日志：`electron-log`（main/renderer 分流），按任务 ID 打标签；
- 崩溃：Sentry/Crashpad 集成，脱敏处理（路径/用户信息）；
- 错误呈现：非阻断优先；致命错误模态 + 可复制技术详情；
- 指标：关键路径时延（打开源/开始任务到首帧时间/队列吞吐）。

---

## 8. 测试与质量

- 单测：Vitest（逻辑/工具函数/令牌映射）；
- E2E：Playwright for Electron（窗口、菜单、快捷键、拖拽、进度）；
- 视觉与可达性：
  - 运行 `docs/scripts/contrast_check.py`（AA 对比度保障）；
  - 快照/截图对照（浅/深色）；键盘路径与屏幕阅读器检查。
- CI：
  - 构建 main/preload/renderer；
  - 执行对比度脚本 + 单测；
  - 选做：打包 smoke（各平台）。

---

## 9. 目录结构建议

```
project/
  packages/
    main/           # Electron 主进程（FFmpeg/队列/IPC）
    preload/        # contextBridge API（类型安全）
    renderer/       # React UI（Zustand/React-Bootstrap/SCSS）
    shared/         # 类型/常量/校验（IPC schema、channel、错误码）
  resources/        # FFmpeg 可执行/滤镜/图标（打包时 extraResources）
  scripts/          # 生成 tokens→SCSS、构建工具
  docs/             # 本目录（规范/令牌/样板/校验脚本）
```

---

## 10. 常见陷阱与对策（Checklist）

- 安全：未开 `contextIsolation/sandbox`、打开 `nodeIntegration`、滥用 `remote` → 立即整改。
- IPC：无类型/校验、频繁事件未节流、监听未移除 → 引入 schema 与节流，封装订阅管理。
- 打包：FFmpeg 在 asar 内不可执行、缺少 `extraResources/asarUnpack` → 修配置并自检路径。
- 主题：仅覆盖颜色未处理状态/深色 → 用 tokens + 组件状态 JSON 完整映射。
- 性能：在 renderer 调 FFmpeg、频繁 setState、长列表无虚拟化 → 移至 main、节流、虚拟化。
- 稳定性：崩溃丢队列/进度、休眠致任务中断 → 持久化 + 恢复流程、powerSaveBlocker。

---

## 11. 令牌落地最小闭环

1) 将 `docs/tokens/handbrake-ui-tokens.json` 生成 `_tokens.scss`（CSS vars）；
2) 使用 SCSS 覆盖 Bootstrap 变量（按钮/输入/边框/文本等）；
3) 按 `docs/tokens/handbrake-ui-components-*.json` 映射组件各状态（default/hover/pressed/focus/disabled）；
4) `data-bs-theme` 与系统深色同步；
5) 运行 `python3 docs/scripts/contrast_check.py ...` 校验对比度。


