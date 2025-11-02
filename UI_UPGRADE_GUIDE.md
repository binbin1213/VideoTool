# VideoTool UI 升级指南

## 📋 概述

本次升级按照 HandBrake UI 规范对 VideoTool 进行了**渐进式改造**（方案A），保持现有功能稳定的前提下，提升了设计系统的完整性和可维护性。

**升级版本**: v1.1.0-dev → v1.2.0  
**升级日期**: 2025-01-XX  
**升级方式**: 最小改动方案（保留现有组件结构）

---

## ✅ 已完成的改造

### 1. 设计令牌系统升级 ✅

**文件**: `src/renderer/styles/tokens.scss`

#### 主要变更：
- ✅ 字体大小从 11px 升级到 14px（符合桌面标准）
- ✅ 新增完整的 8pt 网格系统（4/8/12/16/24/32/40/48px）
- ✅ 控件高度从 22px 升级到 32px（更符合规范）
- ✅ 新增完整的颜色体系（品牌色/中性色/语义色）
- ✅ 新增深色主题色值定义
- ✅ 新增状态透明度定义（hover/pressed/selected/disabled）
- ✅ 新增完整的圆角/阴影/图标/动效定义

#### 新增设计令牌：
```scss
// 字体
$font-size-base: 14px    // 从 11px 升级
$font-size-lg: 16px      // 按钮/强调文本
$font-size-xl: 20px      // 标题

// 颜色
$color-brand-primary: #FF6A00  // 橙色主色
$color-semantic-info: #2680EB
$color-semantic-success: #2EAE4E
$color-semantic-warning: #F59E0B
$color-semantic-danger: #E5484D

// 控件尺寸
$button-height-md: 32px  // 从 22px 升级
$input-height-md: 32px

// 状态
$state-alpha-hover: 0.04
$state-alpha-pressed: 0.08
$state-opacity-disabled: 0.38
```

**兼容性**: 保留了旧变量别名（如 `$spacing-xs`），逐步迁移。

---

### 2. 深色主题支持 ✅

**文件**: `src/renderer/styles/global.scss`

#### 实现方式：
- ✅ 使用 CSS 变量（`--vt-*`）支持动态主题切换
- ✅ 定义了浅色和深色两套完整的颜色系统
- ✅ 通过 `[data-theme="dark"]` 选择器切换主题
- ✅ 覆盖了 Bootstrap 的 CSS 变量以确保全局一致

#### CSS 变量示例：
```scss
:root {
  --vt-color-bg: #FFFFFF;
  --vt-color-text-primary: #111827;
  --vt-color-border: #E5E7EB;
}

[data-theme="dark"] {
  --vt-color-bg: #0B0F14;
  --vt-color-text-primary: #F3F4F6;
  --vt-color-border: #2A2F3A;
}
```

#### 深色主题预览：
- 背景: `#0B0F14` (深色)
- 主文本: `#F3F4F6` (浅色)
- 边框: `#2A2F3A` (暗色)

---

### 3. 主题管理系统 ✅

**文件**: 
- `src/renderer/store/slices/themeSlice.ts` (新建)
- `src/renderer/store/index.ts` (新建)

#### 功能特性：
- ✅ Zustand 状态管理
- ✅ 支持三种主题模式：`light` / `dark` / `system`
- ✅ 自动跟随系统主题变化
- ✅ 主题偏好持久化到 localStorage
- ✅ 平滑过渡动画（180ms）

#### 使用方法：
```tsx
import { useTheme } from './store';

function Component() {
  const { theme, effectiveTheme, setTheme } = useTheme();
  
  // 切换主题
  setTheme('dark');  // 或 'light' 或 'system'
}
```

#### 已集成位置：
- ✅ `App.tsx` 中初始化主题

---

### 4. 国际化支持 (i18next) ✅

**文件**:
- `src/renderer/i18n/config.ts` (新建)
- `src/renderer/locales/zh-CN.json` (新建)
- `src/renderer/locales/en-US.json` (新建)

#### 功能特性：
- ✅ 支持中文（zh-CN）和英文（en-US）
- ✅ 自动检测系统语言
- ✅ 语言偏好持久化
- ✅ 支持插值变量（如 `{{version}}`）

#### 使用方法：
```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t, i18n } = useTranslation();
  
  return <div>{t('sidebar.subtitle_convert')}</div>;
  
  // 切换语言
  i18n.changeLanguage('en-US');
}
```

#### 已翻译的模块：
- ✅ 应用启动消息
- ✅ 侧边栏菜单
- ✅ FFmpeg 安装提示
- ✅ 日志消息
- ✅ 通用按钮

---

### 5. 组件国际化改造 ✅

**已更新的组件**:
- ✅ `App.tsx` - 主应用和 FFmpeg 提示
- ✅ `Sidebar.tsx` - 侧边栏菜单

#### 改造方式：
```tsx
// 改造前
<Button>立即安装</Button>

// 改造后
<Button>{t('ffmpeg.install_now')}</Button>
```

---

## 🚀 如何使用新特性

### 1. 使用新的设计令牌

在组件样式中引用新的 tokens：

```scss
@use '../styles/tokens' as t;

.my-component {
  font-size: t.$font-size-base;      // 14px
  padding: t.$spacing-4;             // 16px
  border-radius: t.$radius-md;       // 8px
  color: var(--vt-color-text-primary); // 使用 CSS 变量支持主题切换
  
  &:hover {
    opacity: calc(1 - #{t.$state-alpha-hover}); // 0.96
  }
}
```

### 2. 添加主题切换按钮

可以在设置或 Header 中添加主题切换功能：

```tsx
import { useTheme } from '../store';

function ThemeToggle() {
  const { effectiveTheme, setTheme } = useTheme();
  
  return (
    <Button 
      onClick={() => setTheme(effectiveTheme === 'light' ? 'dark' : 'light')}
    >
      {effectiveTheme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
```

### 3. 添加语言切换

```tsx
import { useTranslation } from 'react-i18next';

function LanguageToggle() {
  const { i18n } = useTranslation();
  
  return (
    <select 
      value={i18n.language} 
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
    </select>
  );
}
```

---

## 📝 待完成任务（后续迭代）

### 阶段二：组件样式优化
- [ ] 更新 `FormControls.module.scss` 使用新的控件尺寸
- [ ] 为所有按钮添加 hover/focus 状态
- [ ] 统一输入框样式（高度32px，圆角4px）
- [ ] 添加焦点环（focus ring）提升可访问性

### 阶段三：完整国际化
- [ ] 翻译 `SubtitleConvertTab` 组件
- [ ] 翻译 `MergeTab` 组件
- [ ] 翻译 `TranscodeTab` 组件
- [ ] 翻译 `SubtitleBurnTab` 组件
- [ ] 翻译 `BatchTab` 组件
- [ ] 翻译 `LogViewerTab` 组件
- [ ] 翻译 `AboutTab` 组件

### 阶段四：可访问性增强
- [ ] 为所有交互控件添加 `aria-label`
- [ ] 确保键盘导航完整（Tab 顺序）
- [ ] 运行对比度检查脚本 `python3 UI/docs/scripts/contrast_check.py`
- [ ] 添加屏幕阅读器支持

### 阶段五：视觉优化
- [ ] 设计并添加主题切换按钮（建议在 Header 或设置中）
- [ ] 设计并添加语言切换下拉框
- [ ] 优化深色模式下的图标显示
- [ ] 截图（浅色/深色各一套）用于文档

---

## 🔍 兼容性说明

### 向后兼容
- ✅ 保留了旧的 SCSS 变量别名（如 `$font-family-base` → `$font-family-sans`）
- ✅ 保留了旧的间距变量（`$spacing-xs` 等）
- ✅ 现有组件无需立即修改，逐步迁移

### 破坏性变更
- ⚠️ 默认字体大小从 11px 变为 14px（可能导致布局轻微变化）
- ⚠️ 控件高度从 22px 变为 32px（影响按钮、输入框等）

### 迁移建议
1. **立即测试**: 运行应用检查布局是否需要微调
2. **逐步替换**: 新组件使用新变量，旧组件保持不变
3. **统一迁移**: 在某个版本统一移除旧变量别名

---

## 📊 升级前后对比

| 项目 | 升级前 | 升级后 | 改进 |
|------|--------|--------|------|
| 字体大小 | 11px | 14px | 更易读，符合桌面标准 |
| 控件高度 | 22px | 32px | 更易点击，符合人机工程学 |
| 深色主题 | ❌ | ✅ | 护眼，适配系统 |
| 国际化 | ❌ | ✅ 中英文 | 面向全球用户 |
| 设计令牌 | 不完整 | 完整体系 | 易维护，可定制 |
| 主题切换 | ❌ | ✅ | 用户体验提升 |
| CSS 变量 | ❌ | ✅ | 动态主题，性能好 |

---

## 🛠 开发者指南

### 新建组件时的最佳实践

```tsx
// 1. 导入必要的依赖
import { useTranslation } from 'react-i18next';
import styles from './MyComponent.module.scss';

// 2. 组件内使用国际化
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div className={styles.container}>
      <h2>{t('myComponent.title')}</h2>
      {/* 使用语义化的翻译键 */}
    </div>
  );
}

// 3. 样式中使用设计令牌
// MyComponent.module.scss
@use '../../styles/tokens' as t;

.container {
  padding: t.$spacing-4;
  background-color: var(--vt-color-surface);
  color: var(--vt-color-text-primary);
  border-radius: t.$radius-md;
  
  // 支持主题切换
  transition: background-color var(--vt-motion-duration-normal),
              color var(--vt-motion-duration-normal);
}
```

### 添加新的翻译

1. 在 `locales/zh-CN.json` 中添加：
```json
{
  "myFeature": {
    "title": "我的功能",
    "description": "这是描述"
  }
}
```

2. 在 `locales/en-US.json` 中添加对应翻译：
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is the description"
  }
}
```

---

## 📚 参考文档

### 项目文档
- 完整规范: `UI/docs/README.md`
- 设计令牌: `UI/docs/HandBrake_UI_视觉样式与设计令牌.md`
- Electron 指南: `UI/docs/Electron_React_技术栈注意事项与稳定性建议.md`

### 外部资源
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [i18next 文档](https://www.i18next.com/)
- [WCAG 对比度标准](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

## 🐛 已知问题

1. **字体大小变化**
   - 现象: 部分组件可能看起来比之前大
   - 原因: 字体从 11px 升级到 14px
   - 解决: 如需调整，使用 `$font-size-sm` (13px)

2. **控件高度变化**
   - 现象: 按钮、输入框变高
   - 原因: 高度从 22px 升级到 32px
   - 解决: 符合规范，无需调整（更易点击）

---

## 💡 下一步建议

### 优先级 P0（高优先级）
1. **添加主题切换按钮** - 让用户可以手动切换浅色/深色
2. **完整测试** - 在浅色和深色主题下测试所有功能
3. **翻译关键组件** - 优先翻译用户最常用的功能

### 优先级 P1（中等）
4. **可访问性审计** - 运行对比度检查脚本
5. **组件样式统一** - 使用新的设计令牌重写样式
6. **性能优化** - 使用 React.memo 优化重渲染

### 优先级 P2（低）
7. **更多语言支持** - 添加日语、韩语等
8. **自定义主题** - 允许用户自定义品牌色
9. **动画优化** - 添加更多细腻的过渡效果

---

## ❓ 常见问题

### Q: 为什么字体变大了？
A: 从 11px 升级到 14px 是为了符合桌面应用标准，提升可读性。HandBrake 和大多数专业桌面应用都使用 14px。

### Q: 如何禁用深色主题？
A: 在 `themeSlice.ts` 中将默认主题改为 `'light'` 并移除系统主题监听。

### Q: 可以保留旧的字体大小吗？
A: 可以，在组件样式中使用 `font-size: 11px` 或创建自定义变量。但建议适应新标准。

### Q: 如何添加更多语言？
A: 
1. 在 `locales/` 创建新文件如 `ja-JP.json`
2. 在 `i18n/config.ts` 的 `resources` 中注册
3. 添加到 `supportedLanguages` 数组

---

## 🎉 总结

本次升级成功地在**不破坏现有功能**的前提下，为 VideoTool 建立了：
- ✅ 完整的设计令牌系统
- ✅ 深色主题支持
- ✅ 国际化基础设施
- ✅ 主题管理系统

后续可以在此基础上**渐进式迭代**，逐步完善更多功能和翻译。

**升级建议**: 先测试现有功能，确认无问题后再继续后续阶段的优化。

---

**维护者**: Binbin  
**最后更新**: 2025-01-XX  
**文档版本**: 1.0

