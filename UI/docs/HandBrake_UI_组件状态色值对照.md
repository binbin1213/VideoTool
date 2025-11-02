# HandBrake UI 组件状态色值对照（Light / Dark）

说明：本文件以“令牌名”为主（而非直接十六进制），便于统一替换与平台映射。若无特殊说明，文本默认使用 `text.primary`，边框默认使用 `border`，背景默认 `surface` 或控件专属背景。

## Button

Primary
```
default: { bg: brand.primary, text: #FFFFFF, border: brand.primary }
hover:   { overlay: state.alpha.hover }
pressed: { overlay: state.alpha.pressed }
focus:   { ring: focus }
disabled:{ opacity: state.opacity.disabled }
```

Neutral
```
default: { bg: neutral.100 (light) | surface.elev1 (dark), text: text.primary, border: border }
hover:   { overlay: state.alpha.hover }
pressed: { overlay: state.alpha.pressed }
focus:   { ring: focus }
disabled:{ opacity: state.opacity.disabled }
```

Danger
```
default: { bg: semantic.danger, text: #FFFFFF, border: semantic.danger }
hover:   { overlay: state.alpha.hover }
pressed: { overlay: state.alpha.pressed }
focus:   { ring: focus }
disabled:{ opacity: state.opacity.disabled }
```

## Input（TextBox/ComboBox）
```
default: { bg: #FFFFFF (light) | surface.elev1 (dark), text: text.primary, border: border }
hover:   { border: border }
focus:   { border: focus, ring: focus }
error:   { border: semantic.danger }
placeholder: { color: text.secondary }
disabled: { opacity: state.opacity.disabled }
```

## Tabs
```
tab: { height: 32, indicator: 2 }
default: { text: text.secondary }
active: { text: text.primary, indicator: brand.primary }
hover:  { overlay: state.alpha.hover }
```

## List Row
```
default: { bg: surface, text: text.primary }
hover:   { overlay: state.alpha.hover }
selected:{ overlay: state.alpha.selected, border: brand.primary (optional) }
```

## Toolbar Button
```
default: { icon: text.primary, bg: transparent }
hover:   { overlay: state.alpha.hover }
pressed: { overlay: state.alpha.pressed }
disabled:{ opacity: state.opacity.disabled }
```

## Progress
```
bar: { height: 4, fg: brand.primary (0.7 alpha), bg: neutral.200 (light) | border.dark (dark) }
indeterminate: { animation: motion.normal }
```

## Alert（Info/Success/Warning/Danger）
```
info:    { icon: semantic.info,    border: semantic.info,    bg: semantic.info (alpha 0.08) }
success: { icon: semantic.success, border: semantic.success, bg: semantic.success (alpha 0.08) }
warning: { icon: semantic.warning, border: semantic.warning, bg: semantic.warning (alpha 0.08) }
danger:  { icon: semantic.danger,  border: semantic.danger,  bg: semantic.danger (alpha 0.08) }
```

注：Light/Dark 切换时，`text.*`、`border`、`surface.*` 按主题自动取值（见令牌定义）。


