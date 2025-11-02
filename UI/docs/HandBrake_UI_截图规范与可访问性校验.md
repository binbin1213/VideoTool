# HandBrake UI 截图规范与可访问性校验

本规范用于 PR 视觉回归与可访问性（A11y）检查，确保浅/深色、对比度、键盘可达性与状态展示的一致性。

## 1. 截图清单（Light / Dark 各一套）

- 主窗口默认态（工具栏 + Summary）
- Picture / Filters / Video / Audio / Subtitles / Chapters Tab（各 1）
- 预设 Popover 展开、队列窗口（含分栏）
- 进度条（确定 + 不确定）、错误提示（Alert.Danger）
- 表单聚焦与错误态（Input Focus + Error）

规范：
- 分辨率 ≥ 1440×900；缩放 100%；
- 窗口左右内边距 16pt 可见；
- 文案包含中英文与长文本示例；
- 深色模式开启后复拍同一组镜头。

## 2. 对比度检查

- 文本与背景对比：正文 ≥ 4.5:1，≥18pt 或粗体标题 ≥ 3:1；
- 运行 `docs/scripts/contrast_check.py` 自动校验令牌对；
- 对比不达标必须调整 tokens 或组件样式。

## 3. 键盘与焦点

- 全键盘导航（Tab/Shift+Tab/箭头）覆盖主路径；
- 焦点环始终可见（1–2px focus ring）；
- 所有操作均有键盘路径替代（含菜单项）。

## 4. 屏幕阅读器

- 图标/按钮/输入具备可访问名称（Name/Label）与帮助文本（描述可选）；
- 状态变化（错误、完成）可被朗读；
- Tab 顺序符合视觉与层级逻辑。

## 5. 命令

```
python3 docs/scripts/contrast_check.py \
  --tokens docs/tokens/handbrake-ui-tokens.json \
  --light docs/tokens/handbrake-ui-components-light.json \
  --dark  docs/tokens/handbrake-ui-components-dark.json
```

输出报告包括：
- 每个组件/状态的文本-背景/边框-背景对比；
- 未定义或无法解析的令牌键；
- 低于阈值的失败项列表。


