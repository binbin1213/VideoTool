# HandBrake UI 图标规范（Iconography）

本规范定义图标尺寸、网格、线宽、圆角、命名、着色、对比与平台交付格式，基于 8pt 网格与 24px 基线。

## 1. 尺寸与网格

- 基础尺寸：16 / 20 / 24 / 32（px），推荐主界面使用 20 或 24。
- 网格：24×24 基线对齐；关键曲线与拐点对齐像素栅格，避免模糊。
- 触控/命中区域：≥ 32×32；较小图标需通过容器提供额外空白。

## 2. 线宽与圆角

- 线性图标线宽：1.5px；小尺寸（16px）可适当加粗至 1.75px 以保证可读。
- 端点：圆端（Round Cap）、圆角连接（Round Join）。
- 面性图标圆角：遵循 `radius.sm=4`/`radius.md=8` 的层级，保持一致性。

## 3. 命名与分类

- 命名：`Icon.<Action>` 或 `Icon.<Object>`，示例：
  - `Icon.Play`、`Icon.Stop`、`Icon.Queue`、`Icon.Preset`、`Icon.Preview`、`Icon.Source`、`Icon.Subtitles`。
- 状态/变体：`Icon.<Action>.Filled`、`Icon.<Action>.Outline`；优先使用 Outline。
- 文件组织：`icons/<size>/<name>.svg|pdf|xaml`，导出时包含尺寸后缀或向量模板标记。

## 4. 颜色与着色

- 默认采用当前文本色（`text.primary`），禁硬编码；
- 语义提示可用 `semantic.info/success/warning/danger`；
- 深/浅色主题需自适应：模板图标（macOS PDF isTemplate）、WPF Path 绑定 `Foreground`、GTK CSS `fill`。

## 5. 对比度与可访问性

- 图标与背景对比度建议 ≥ 3:1；信息性/低优先图标可降至 2:1，但不可用于关键操作；
- 禁仅用颜色表达状态，配合形状/文本；
- 焦点或选中时增加可见性（背景或描边）。

## 6. 平台交付格式

- macOS：PDF 向量模板，`isTemplate=YES`，由系统根据前景色着色；
- Windows：XAML Path/DrawingImage（Geometry 数据），支持 `Foreground` 动态绑定；
- GTK：SVG（24px 基线），随 gresource 打包，CSS 控制 `fill`。

## 7. 统一图标清单（建议初始集）

- 导航/工具：`Icon.Source`、`Icon.Preset`、`Icon.Preview`、`Icon.Queue`、`Icon.Start`、`Icon.Stop`、`Icon.Settings`、`Icon.Info`。
- 媒体：`Icon.Play`、`Icon.Pause`、`Icon.Reload`、`Icon.Snapshot`。
- 结构：`Icon.TabSummary`、`Icon.TabPicture`、`Icon.TabFilters`、`Icon.TabVideo`、`Icon.TabAudio`、`Icon.TabSubtitles`、`Icon.TabChapters`。
- 状态：`Icon.Success`、`Icon.Warning`、`Icon.Error`、`Icon.Info`。


