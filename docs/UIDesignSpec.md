## VideoTool UI 设计规范（v0.2）

目标：在保证与 HandBrake 视觉风格相近的同时，建立稳定、可扩展、可模块化的样式体系，避免全局样式互相覆盖。

— 基础设计令牌（Design Tokens）
- 字体
  - 基础字号：11px（控件、正文；参考 HandBrake controlContent）
  - 极小字号：9px（脚注/提示）
  - 字体族：系统 UI 字体（含中日韩补全）
  - 等宽数字：系统等宽数字字体（用于时间、进度、码率等数值）
- 颜色
  - 文本主色：#000（可替换为系统 labelColor 以适配暗色）
  - 文本次级：#777
  - 分隔/描边：#DDD
  - 背景：#FFF
  - 强调色：#0d6efd（交互强调）
- 间距（px）：2 / 4 / 6 / 8 / 12 / 16（分别对应 xxs~xl）
- 圆角：4px

— 控件规格
- 下拉/输入（small）
  - 高度 22px，line-height 22px，padding: 0 10px 0 8px，字号 11px
  - 迷你尺寸（HUD/紧凑）：高度 18px（少量场景）
- 标签（表单左列）
  - 高度 22px，`display:flex; align-items:center;`，不换行
  - 与控件同字号 11px；默认左对齐（右对齐时用 `.labelRight`）
- 复选/单选：与系统对齐，行高不小于 22px
- 表格
  - 行高 25px，单元格间距 3×2

— 布局与对齐
- 表单行：标签-控件-说明
  - 统一紧凑布局：`--bs-gutter-x: 4px`（`rowTight`）
  - 滤镜页：标签列宽 `sm=1`，控件列宽 `sm=4`，说明跟随在同一行
  - 其它页（视频/尺寸等）可按内容采用 `sm=2/4/6`，但需保持同一页内部一致
  - 上下行距：6–8px
- 分组：fieldset 无背景，仅保留必要分隔

— 提示说明
- 与控件同一行，单行显示（nowrap），颜色次级色，字号 11px
 - 组件类：`.help`，与控件间距 8px

— 交互与状态
- 焦点：描边或阴影轻提示（不改变高度），颜色取强调色
- 禁用：不透明度 0.5，鼠标禁用

— 图标与素材
- 行内小图标 12px；间距与文字一致（8px）

— 样式组织与约束
- 必须使用 SCSS Modules（组件级作用域）
  - 每个模块：`Xxx.module.scss`；组件中 `import styles from './Xxx.module.scss'`
  - 全局仅保留 reset、变量、mixins，不写控件级样式，不使用 `!important`
- 共享令牌与工具
  - `src/renderer/styles/tokens.scss`：设计令牌
  - `src/renderer/styles/mixins.scss`：常用 mixin（控件、标签、说明、紧凑行）
  - 模块内通过 `@use '../../styles/tokens' as t` 与 `@use '../../styles/mixins' as m`

— 代码规范补充
- 栅格列宽（如 `sm=1/2/4`）属于布局结构，需在 TSX 中修改；
- 样式细节（间距、行高、颜色、对齐）必须在 SCSS 中完成，不允许新的内联 `style={{...}}`；
- 迁移存量内联样式时，优先提取到模块类，并复用 tokens/mixins；

— 变更记录
- v0.2（当前）
  - 统一标签高度到 22px，使用 flex 垂直居中；
  - 滤镜页表单行采用 `sm=1 | sm=4` + `rowTight (4px)`；
  - 明确“布局在 TSX、样式在 SCSS”的分工，禁止新增内联样式；
  - 增补 `.navLink/.headerBar/.contentArea/.fieldset/.infoBox` 等通用类。

— 命名规范
- 类名：语义化（例如 `.row`, `.label`, `.select`, `.help`）
- 变量：小写短横线（`$font-size-base`）
- 禁止在模块外写 `.form-select` 等全局覆盖；确需覆盖时用 `:global(.form-select)` 并局限在根容器下

— 无障碍与多语言
- 字体不小于 11px；行内说明不截断关键信息
- 预留多语言扩展空间（Label 固定列宽避免溢出）

— 实施计划
1) 建立 tokens/mixins 与模块样式样本（本提交）
2) 渐进迁移：转码模块 → 其它模块（尺寸/视频/音频/字幕）
3) 审视暗色模式适配（未来可将文本主色切换为系统语义色）


