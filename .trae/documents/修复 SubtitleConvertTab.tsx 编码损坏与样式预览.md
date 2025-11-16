## 问题概述
- 文件 `src/renderer/components/Features/SubtitleConvertTab.tsx` 出现大量语法错误，核心原因是源码中混入了 Unicode 转义文本（如 `\u003c`、`\u003e`、`\u0026`），导致 TypeScript 泛型、JSX、字符串常量全部失效。
- 另外，预览描边/阴影的拼接曾被替换，需恢复为稳定实现。

## 修复目标
- 恢复该文件的全部可编译性和功能，让页面重新“可用”。
- 保留预览缩放逻辑（字体、描边、阴影按 1/2 缩放），但使用稳定的组合函数。

## 具体修复步骤
1. 全面纠正编码污染
- 仅在 `SubtitleConvertTab.tsx` 内执行全量替换：
  - 将所有 `\u003c` 替换为 `<`
  - 将所有 `\u003e` 替换为 `>`
  - 将所有 `\u0026` 替换为 `&`
- 这将恢复 TypeScript 泛型（如 `useState<...>`）、JSX 标签（如 `<div>`）、以及字符串字面量（如 `&H`）。

2. 恢复稳定的预览阴影拼接
- 在 `renderStylePreview` 中恢复使用组合方法：`getCombinedTextShadow(Number(Outline)/2, outlineCssColor, Number(Shadow)/2, shadowCssColor)`
- 位置参考：`SubtitleConvertTab.tsx:282-314`（当前损坏段）
- 保留字体与描边/阴影的 1/2 缩放；组合逻辑依赖：
  - `getOutlineTextShadow` 位于 `SubtitleConvertTab.tsx:250-263`
  - `getShadowTextShadow` 位于 `SubtitleConvertTab.tsx:265-269`
  - `getCombinedTextShadow` 位于 `SubtitleConvertTab.tsx:271-280`

3. 逐项语法/类型自检
- 编译自检：确保不再出现“应为 => / 无效字符 / 模块声明名称只能使用引号”等诊断。
- 类型自检：验证 `useState<File | null>`、`React.ChangeEvent<HTMLInputElement>`、`ASSStyleParams`、`SubtitleFormat` 等泛型与类型位点均恢复。
- 功能自检：
  - 单文件/批量选择、拖拽、格式检测与日志输出
  - 转换流程（含水印与正则规则开关）
  - 预览渲染：字体、粗斜体、下划线/删除线、描边与阴影效果均可见

4. 交互与可视验证
- 启动应用，进入字幕转换页面：
  - 选择样式进行预览，确认描边更平滑（环形投影）与阴影距离正确缩放
  - 选择文件进行一次完整转换，确认状态与日志正常

## 风险与回滚
- 替换仅在单文件内进行，若出现异常，可立即还原为替换前版本。
- 无需新建文件或改动其他模块。

## 验收标准
- 该 TSX 文件零诊断错误，页面可以正常加载与操作。
- 预览中的描边和阴影在视觉上与缩放预期一致（均为原值的 1/2）。
- 单文件与批量转换流程均可顺畅完成（日志/提示无异常）。

请确认计划，我将立刻执行修复。