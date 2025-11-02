# HandBrake UI 文档目录说明（Navigation Guide）

本目录提供一套可独立迁移的 UI 规范与资源（无需依赖原仓库路径）。你可以直接复制整个 `docs/` 到任意项目中使用。

注：如需对照原始项目源代码进行参考，本机源码路径为：
`/Users/binbin/Downloads/HandBrake`

## 快速开始

1) 视觉与规范快速浏览：
- 总纲（任阅其一）：
  - `UI_SPEC.md`
  - `HandBrake_桌面端_UI_开发规范_跨平台总纲.md`
- 视觉令牌与样式（推荐）：
  - `HandBrake_UI_视觉样式与设计令牌.md`
  - 组件样式：`HandBrake_UI_组件样式规范.md`
  - 状态色值：`HandBrake_UI_组件状态色值对照.md`

2) 机器可读 Tokens 与平台映射：
- Tokens JSON：`tokens/handbrake-ui-tokens.json`
- 组件状态映射：
  - `tokens/handbrake-ui-components-light.json`
  - `tokens/handbrake-ui-components-dark.json`
- 平台映射样板：
  - Windows（WPF）：`platform-mappings/windows/Theme.xaml`
  - macOS（AppKit）：`platform-mappings/macos/Colors.plist`
  - GTK（GTK4）：`platform-mappings/gtk/theme.css`

3) 校验与截图：
- 截图与可访问性规范：`HandBrake_UI_截图规范与可访问性校验.md`
- 对比度脚本：`scripts/contrast_check.py`
  - 运行示例：
    ```bash
    python3 docs/scripts/contrast_check.py \
      --tokens docs/tokens/handbrake-ui-tokens.json \
      --light docs/tokens/handbrake-ui-components-light.json \
      --dark  docs/tokens/handbrake-ui-components-dark.json
    ```

## 目录结构

```
docs/
  README.md                               # 本目录说明与导航
  UI_SPEC.md                              # 跨平台 UI 总纲（含链接与摘要）
  HandBrake_桌面端_UI_开发规范_跨平台总纲.md  # 总纲（中文命名版）

  HandBrake_UI_视觉样式与设计令牌.md        # 设计令牌（人类可读）
  HandBrake_UI_组件样式规范.md              # Button/Input/Tabs/List/Toolbar/Progress/StatusBar/Alert
  HandBrake_UI_组件状态色值对照.md          # 组件各状态（Light/Dark）色值对照（按令牌名）
  HandBrake_UI_图标规范.md                  # 图标尺寸/网格/线宽/命名/格式/可访问性
  HandBrake_UI_截图规范与可访问性校验.md    # 截图清单、A11y 检查与脚本指引
  Electron_React_技术栈注意事项与稳定性建议.md # 面向 Electron + React 技术栈的落地指南

  tokens/
    handbrake-ui-tokens.json              # 全量设计令牌（颜色/字体/间距/圆角/阴影/动效/网格）
    handbrake-ui-components-light.json    # Light 主题组件状态映射
    handbrake-ui-components-dark.json     # Dark  主题组件状态映射

  platform-mappings/
    windows/Theme.xaml                    # WPF 主题样板（绑定至令牌键）
    macos/Colors.plist                    # AppKit 颜色样板（运行时映射至 NSColor）
    gtk/theme.css                         # GTK4 CSS 变量样板（与令牌对应）

  scripts/
    contrast_check.py                     # 文本/边框与背景的对比度校验脚本（基于令牌）
```

## 推荐阅读顺序

1. UI 总纲（`UI_SPEC.md` 或 中文总纲）
2. 视觉令牌（`HandBrake_UI_视觉样式与设计令牌.md`）
3. 组件样式规范与状态色值（`HandBrake_UI_组件样式规范.md`、`HandBrake_UI_组件状态色值对照.md`）
4. 平台映射样板（Windows/macOS/GTK）
5. 截图与 A11y 校验（截图规范与 `scripts/contrast_check.py`）

## 常用任务指引

- “新增参数/控件”跨平台实施模板：见 `UI_SPEC.md` “跨平台新增参数实施模板”章节。
- 自定义主题/品牌色：修改 `tokens/handbrake-ui-tokens.json` 中 `color.brand.*` 与相关语义色；
  - 同步更新平台映射样板（或使用动态资源绑定）。
- 批量对比度检查：执行上方脚本命令，修复报告中的 `FAIL/MISSING`。

## 迁移/独立使用说明

- 本 `docs/` 目录所有引用均使用相对路径，仅依赖 Python3（对比度脚本）。
- 拷贝到新项目后，建议：
  - 在 CI 中加入对 `scripts/contrast_check.py` 的执行；
  - 将平台样板文件集成到你的 UI 主题资源加载流程；
  - 以 Tokens JSON 为源，统一管理颜色/字号/间距等。

## 维护规范（建议）

- 新增/修改样式：先改 Tokens，再更新组件映射与平台样板；
- 新增组件：补充至组件样式规范与状态映射（轻/深）；
- 提交 PR：附浅/深色截图、A11y 说明、对比度检查报告；
- 版本标记：在总纲顶部追加“版本/日期/变更要点”。


