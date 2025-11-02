# VideoTool UI 规范补充说明

**项目名称**: VideoTool  
**制定日期**: 2025-11-01  
**适用范围**: VideoTool 项目所有 UI 开发  

---

## 📋 概述

本文档是对 HandBrake UI 规范的补充说明，定义了 VideoTool 项目特有的 UI 规范要求。

---

## 🎨 配色方案

### 1. 品牌色定义

**VideoTool 采用黑白灰配色方案，不使用彩色作为品牌色。**

#### 品牌色色值
```scss
// 品牌主色（中灰色系）
$color-brand-primary: #4B5563;      // neutral.600
$color-brand-primary-600: #374151;  // neutral.700
$color-brand-primary-700: #1F2937;  // neutral.800
```

#### 说明
- ✅ **允许**：使用黑色、白色、灰色系作为主要视觉元素
- ❌ **禁止**：使用橙色、蓝色、紫色等彩色作为品牌色或主要交互元素

### 2. 语义色使用规范

**语义色仅限用于系统提示和状态反馈，不得用于常规 UI 元素。**

#### 允许使用的语义色
```scss
$color-semantic-info: #2680EB;      // 蓝色 - 信息提示
$color-semantic-success: #2EAE4E;   // 绿色 - 成功状态
$color-semantic-warning: #F59E0B;   // 黄色 - 警告提示
$color-semantic-danger: #E5484D;    // 红色 - 错误/危险
```

#### 使用场景限定
| 颜色 | 允许使用 | 禁止使用 |
|------|---------|---------|
| Info (蓝色) | 信息提示框、帮助文本 | 按钮、链接、图标 |
| Success (绿色) | 成功提示、完成状态 | 常规按钮、导航元素 |
| Warning (黄色) | 警告横幅、提示 | 主题色、强调元素 |
| Danger (红色) | 错误提示、删除确认 | 常规文本、装饰 |

### 3. Focus 指示器颜色

**Focus ring 使用灰色系，不使用蓝色。**

```scss
// 浅色主题
$color-light-focus: #374151;  // neutral.700 (深灰)

// 深色主题
$color-dark-focus: #9CA3AF;   // neutral.400 (浅灰)
```

---

## 🚫 图标与表情符号规范

### 1. Emoji 表情符号使用规范

**严格限制 emoji 表情符号的使用。**

#### ❌ 禁止使用的表情符号
```
装饰性 emoji：
- ⚙️ 齿轮
- 💡 灯泡
- 🎉 庆祝
- 🚀 火箭
- 🔧 扳手
- 📋 剪贴板
- 🎨 调色板

国旗 emoji：
- 🇨🇳 中国国旗
- 🇺🇸 美国国旗
- 其他国旗

天气/时间 emoji：
- ☀️ 太阳
- 🌙 月亮
- ⭐ 星星
```

#### ✅ 允许少量使用的符号（仅限必要场景）

**商业通用符号**（系统状态提示）：
```
✓  成功标记（可用于完成状态）
✗  错误标记（可用于失败状态）
ℹ  信息标记（可用于提示）
⚠  警告标记（可用于警告，但需谨慎）
```

**使用原则**：
1. **优先使用图标字体**（如 FontAwesome）替代 emoji
2. **仅在无合适图标字体时**考虑使用商业通用符号
3. **完全禁止**装饰性、文化相关性的 emoji

#### 正确示例

```tsx
// ❌ 错误：使用 emoji
<h4>⚙️ 偏好设置</h4>
<option value="zh-CN">🇨🇳 简体中文</option>
<p>💡 提示：更改后立即生效</p>

// ✅ 正确：使用图标字体或纯文本
<h4><FaCog /> 偏好设置</h4>  // 使用图标字体
<h4>偏好设置</h4>              // 或使用纯文本

<option value="zh-CN">简体中文</option>
<option value="en-US">English</option>

<p>提示：更改后立即生效</p>
```

---

## 🎯 按钮样式规范

### 1. 按钮类型定义

**VideoTool 使用 Neutral 按钮风格，不使用彩色按钮。**

#### 主要按钮 (Primary Button)
- **背景色**：`var(--vt-color-text-primary)` (深灰/黑色)
- **文字色**：`var(--vt-color-bg)` (白色)
- **用途**：主要操作、确认按钮

#### 次要按钮 (Neutral Button)
- **背景色**：`var(--vt-color-surface)` (浅灰)
- **文字色**：`var(--vt-color-text-primary)` (深灰/黑色)
- **边框**：`1px solid var(--vt-color-border)`
- **用途**：取消、返回、次要操作

#### 危险按钮 (Danger Button)
- **背景色**：`var(--vt-color-semantic-danger)` (红色)
- **文字色**：`#FFFFFF` (白色)
- **用途**：删除、清空等危险操作（限定使用）

### 2. 禁止的按钮样式

```scss
// ❌ 禁止：彩色按钮
.button-orange {
  background-color: #FF6A00;  // 禁止使用橙色
}

.button-blue {
  background-color: #2680EB;  // 禁止使用蓝色（除 Danger 外）
}

// ✅ 允许：黑白灰按钮
.button-primary {
  background-color: var(--vt-color-text-primary);  // 深灰/黑色
  color: var(--vt-color-bg);
}
```

---

## 📝 文本与标签规范

### 1. 界面文本要求

**界面文本应简洁、专业，避免过度装饰。**

#### ❌ 禁止的文本风格
```tsx
// 过度使用 emoji
"🎉 恭喜！更新成功！🎉"
"⚠️ 警告 ⚠️"
"💡 小提示：记得保存哦~"

// 过度装饰
"========== 偏好设置 =========="
"★★★ 重要提示 ★★★"
```

#### ✅ 推荐的文本风格
```tsx
// 简洁专业
"更新成功"
"警告"
"提示：记得保存"

// 清晰明确
"偏好设置"
"重要提示"
```

### 2. 语言选择器标签

**语言选项使用文字标识，不使用国旗 emoji。**

```tsx
// ❌ 错误
<option value="zh-CN">🇨🇳 简体中文</option>
<option value="en-US">🇺🇸 English</option>

// ✅ 正确
<option value="zh-CN">简体中文</option>
<option value="en-US">English</option>
```

---

## 🖼️ 图标使用规范

### 1. 图标来源

**使用 FontAwesome 或其他图标字体库，不使用 emoji。**

#### 推荐图标库
- **FontAwesome** (react-icons/fa)
- **Material Icons** (react-icons/md)
- **Feather Icons** (react-icons/fi)

#### 图标尺寸规范
```scss
$icon-size-sm: 16px;  // 小图标
$icon-size-md: 20px;  // 中等图标（默认）
$icon-size-lg: 24px;  // 大图标
$icon-size-xl: 32px;  // 特大图标
```

### 2. 图标颜色

**图标颜色与文本颜色保持一致，使用灰色系。**

```tsx
// ✅ 正确：使用主题色
<FaCog style={{ color: 'var(--vt-color-text-primary)' }} />
<FaLanguage style={{ color: 'var(--vt-color-text-secondary)' }} />

// ❌ 错误：使用固定彩色
<FaCog style={{ color: '#FF6A00' }} />  // 橙色
<FaLanguage style={{ color: '#2680EB' }} />  // 蓝色
```

---

## 🎭 主题切换规范

### 1. 主题模式标识

**主题模式使用图标 + 文字，不使用 emoji。**

```tsx
// ❌ 错误：使用 emoji
当前: {effectiveTheme === 'light' ? '☀️ 浅色' : '🌙 深色'}

// ✅ 正确：使用文字或图标字体
当前: {effectiveTheme === 'light' ? '浅色' : '深色'}
// 或
<FaSun /> 浅色  <FaMoon /> 深色
```

### 2. 主题按钮样式

**主题切换按钮选中态使用黑白反色。**

```scss
// 选中状态
.segmentButtonActive {
  background-color: var(--vt-color-text-primary);  // 黑色（浅色模式）
  color: var(--vt-color-bg);                       // 白色
}

// 未选中状态
.segmentButton {
  background-color: var(--vt-color-bg);
  color: var(--vt-color-text-primary);
}
```

---

## ⚠️ 特殊提示与警告

### 1. 系统提示样式

**系统级提示可使用语义色，但应谨慎使用符号。**

```tsx
// ✅ 推荐：使用语义色背景 + 图标字体
<Alert variant="warning">
  <FaExclamationTriangle /> FFmpeg 未安装
</Alert>

// ⚠️ 谨慎使用：商业符号
<Alert variant="warning">
  ⚠ FFmpeg 未安装  {/* 仅在无合适图标时使用 */}
</Alert>

// ❌ 避免：emoji 装饰
<Alert variant="warning">
  ⚠️ FFmpeg 未安装 ⚠️
</Alert>
```

---

## 📊 总结对照表

| 元素 | 禁止 | 允许 |
|------|------|------|
| 品牌色 | 橙色、蓝色等彩色 | 黑白灰 |
| 按钮 | 彩色背景 | 黑白灰背景 |
| 图标 | Emoji 表情符号 | FontAwesome 等图标字体 |
| 文本装饰 | 🎉💡⚙️ 等 emoji | 纯文本或图标字体 |
| 语言标识 | 🇨🇳🇺🇸 国旗 emoji | 文字标识 |
| 状态提示 | 装饰性 emoji | 语义色 + 图标字体或商业符号 |
| Focus 指示器 | 蓝色 | 灰色系 |
| 进度条 | 彩色 | 深灰/黑色 |

---

## 🔍 代码审查清单

在提交代码前，请确认：

- [ ] 未使用橙色、蓝色等彩色作为品牌色
- [ ] 未使用 emoji 表情符号（⚙️💡🎉🚀🇨🇳🇺🇸☀️🌙等）
- [ ] 按钮使用黑白灰配色
- [ ] 图标使用 FontAwesome 等图标字体
- [ ] 语言选项使用纯文本标识
- [ ] Focus ring 使用灰色系
- [ ] 语义色仅用于系统提示和状态反馈
- [ ] 文本简洁专业，无过度装饰

---

## 📚 相关文档

- [HandBrake_UI_视觉样式与设计令牌.md](./HandBrake_UI_视觉样式与设计令牌.md)
- [HandBrake_UI_组件样式规范.md](./HandBrake_UI_组件样式规范.md)
- [BLACK_WHITE_THEME.md](../../BLACK_WHITE_THEME.md)
- [UI_SPEC_COMPLIANCE.md](../../UI_SPEC_COMPLIANCE.md)

---

## 📝 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2025-11-01 | 初始版本，定义黑白灰配色和 emoji 使用规范 |

---

**规范状态**: ✓ 已生效  
**强制执行**: 是  
**审核人员**: 项目负责人  
**最后更新**: 2025-11-01

