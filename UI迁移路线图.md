# VideoTool UI 迁移路线图

**当前版本**: v1.1.0-dev  
**开始日期**: 2025-11-01  
**目标**: 将所有 UI 组件迁移到符合 VideoTool UI 规范

---

## ✅ 已完成（Phase 1）

### 1. 核心基础设施
- [x] 升级设计令牌系统 (`tokens.scss`)
  - 字体、间距、圆角、阴影、控件尺寸
  - 黑白灰配色方案（`#4B5563` 品牌色）
  - 状态透明度定义
  
- [x] 实现深色主题支持
  - CSS 变量系统 (`global.scss`)
  - `data-theme` 属性切换
  - 浅色/深色主题自动适配

- [x] 主题切换功能
  - Zustand store (`themeSlice.ts`)
  - 三种模式：浅色/深色/跟随系统
  - localStorage 持久化

- [x] 国际化系统
  - i18next 配置 (`i18n/config.ts`)
  - 中文/英文翻译文件
  - 系统语言检测

### 2. AboutTab 完全重构
- [x] 创建 CSS 模块 (`AboutTab.module.scss`)
- [x] 符合 UI 规范的按钮样式（Neutral 风格）
- [x] 移除所有 emoji 表情符号
- [x] 提取所有文本到翻译文件
- [x] 使用品牌色 `#4B5563`
- [x] 8pt 网格系统
- [x] 状态效果（hover/pressed/focus/disabled）

### 3. 规范文档
- [x] UI 规范遵循报告 (`UI_SPEC_COMPLIANCE.md`)
- [x] 黑白灰配色方案文档 (`BLACK_WHITE_THEME.md`)
- [x] VideoTool UI 规范补充说明 (`VideoTool_UI_规范补充说明.md`)
- [x] 无限循环修复文档 (`INFINITE_LOOP_FIX.md`)
- [x] 进程管理改进 (`DEV_PROCESS_GUIDE.md`)

---

## 🚀 下一步（Phase 2）- 其他功能标签页迁移

### 优先级 1: 核心功能标签页

#### 2.1 SubtitleConvertTab（字幕转换）
**当前状态**: 使用 Bootstrap 默认样式，未遵循规范

**需要改进**:
- [ ] 创建 `SubtitleConvertTab.module.scss`
- [ ] 按钮改为 Neutral 风格（中灰色）
- [ ] 文件选择区域样式优化
- [ ] 移除 emoji 表情符号
- [ ] 提取文本到翻译文件
- [ ] 进度条使用规范样式
- [ ] 日志输出区域样式优化

**估计工作量**: 4-6 小时

---

#### 2.2 MergeTab（音视频合并）
**当前状态**: 使用 Bootstrap 默认样式

**需要改进**:
- [ ] 创建 `MergeTab.module.scss`
- [ ] 文件选择按钮样式
- [ ] 硬件加速选择器样式
- [ ] 输出格式选择器样式
- [ ] 合并按钮（Primary 风格）
- [ ] 进度显示优化
- [ ] 文本国际化

**估计工作量**: 4-6 小时

---

#### 2.3 TranscodeTab（视频转码）
**当前状态**: 开发中，样式未完善

**需要改进**:
- [ ] 创建 `TranscodeTab.module.scss`
- [ ] 编码器选择器（H.264/H.265/AV1）
- [ ] 质量/码率控制组件
- [ ] 预设选择器样式
- [ ] 转码按钮
- [ ] 文本国际化

**估计工作量**: 4-6 小时

---

#### 2.4 SubtitleBurnTab（字幕烧录）
**当前状态**: 基础功能完成，样式需优化

**需要改进**:
- [ ] 创建 `SubtitleBurnTab.module.scss`
- [ ] 视频/字幕文件选择区域
- [ ] 字体/样式配置面板
- [ ] 预览功能样式
- [ ] 烧录按钮
- [ ] 文本国际化

**估计工作量**: 5-7 小时

---

### 优先级 2: 辅助功能标签页

#### 2.5 BatchTab（批量处理）
**当前状态**: 开发中

**需要改进**:
- [ ] 文件列表样式（Table 组件）
- [ ] 操作按钮组
- [ ] 批量进度显示
- [ ] 文本国际化

**估计工作量**: 6-8 小时

---

#### 2.6 LogViewerTab（日志查看）
**当前状态**: 基本完成

**需要改进**:
- [ ] 创建 `LogViewerTab.module.scss`
- [ ] 日志过滤器样式
- [ ] 日志项样式优化
- [ ] 清空日志按钮
- [ ] 文本国际化

**估计工作量**: 2-3 小时

---

### 优先级 3: 布局组件

#### 2.7 Sidebar（侧边栏）
**当前状态**: 基本符合规范

**需要改进**:
- [ ] 创建 `Sidebar.module.scss`
- [ ] 选中态高亮（使用品牌色）
- [ ] Hover 效果
- [ ] 图标颜色统一为灰色
- [ ] 文本国际化（已部分完成）

**估计工作量**: 2-3 小时

---

## 🎨 Phase 3 - 创建通用组件库

### 3.1 基础组件

#### Button 组件
```tsx
// src/renderer/components/Common/Button/Button.tsx
<Button variant="primary">确认</Button>
<Button variant="neutral">取消</Button>
<Button variant="danger">删除</Button>
```

**功能**:
- 三种变体：primary/neutral/danger
- 三种尺寸：sm/md/lg
- 状态：hover/pressed/focus/disabled
- 图标支持

**估计工作量**: 3-4 小时

---

#### Input 组件
```tsx
// src/renderer/components/Common/Input/Input.tsx
<Input placeholder="请输入..." />
<Input type="number" />
<Input error="格式错误" />
```

**功能**:
- 统一样式（32px 高度）
- 错误状态
- Focus ring
- 前缀/后缀图标

**估计工作量**: 3-4 小时

---

#### Select 组件
```tsx
// src/renderer/components/Common/Select/Select.tsx
<Select options={[...]} />
```

**功能**:
- 统一样式
- 自定义选项渲染
- 搜索功能（可选）

**估计工作量**: 4-5 小时

---

#### Card/Section 组件
```tsx
// src/renderer/components/Common/Card/Card.tsx
<Card title="标题">内容</Card>
```

**功能**:
- 统一的卡片样式
- 可选标题和边框
- 内边距规范

**估计工作量**: 2-3 小时

---

#### Progress 组件
```tsx
// src/renderer/components/Common/Progress/Progress.tsx
<Progress value={50} />
<Progress indeterminate />
```

**功能**:
- 确定进度/不确定进度
- 百分比显示
- 自定义颜色（默认品牌色）

**估计工作量**: 2-3 小时

---

#### Alert 组件
```tsx
// src/renderer/components/Common/Alert/Alert.tsx
<Alert variant="info">提示信息</Alert>
<Alert variant="warning">警告信息</Alert>
```

**功能**:
- 四种语义色：info/success/warning/danger
- 可关闭
- 图标支持

**估计工作量**: 2-3 小时

---

### 3.2 复合组件

#### FileSelector 组件
```tsx
// src/renderer/components/Common/FileSelector/FileSelector.tsx
<FileSelector 
  accept=".mp4,.mkv"
  onFileSelect={handleFile}
/>
```

**功能**:
- 拖拽上传
- 点击选择
- 文件预览
- 进度显示

**估计工作量**: 4-5 小时

---

#### SegmentedControl 组件
```tsx
// 已在 AboutTab 中实现，需提取为通用组件
<SegmentedControl 
  options={['浅色', '深色', '系统']}
  value={theme}
  onChange={setTheme}
/>
```

**估计工作量**: 2-3 小时

---

## 📊 Phase 4 - 全局样式优化

### 4.1 FFmpeg 状态横幅
- [ ] 使用规范的 Alert 组件
- [ ] 按钮样式统一
- [ ] 进度条样式

**估计工作量**: 1-2 小时

---

### 4.2 模态框（Modal）
- [ ] 覆盖 Bootstrap Modal 样式
- [ ] 按钮样式统一
- [ ] 圆角、间距符合规范

**估计工作量**: 2-3 小时

---

### 4.3 全局滚动条样式
```scss
// src/renderer/styles/scrollbar.scss
::-webkit-scrollbar {
  width: 8px;
}
```

**估计工作量**: 1 小时

---

## 🧪 Phase 5 - 测试与优化

### 5.1 可访问性测试
- [ ] 键盘导航测试
- [ ] 屏幕阅读器测试
- [ ] 对比度验证（WCAG AA）
- [ ] Focus 指示器可见性

**估计工作量**: 4-6 小时

---

### 5.2 响应式适配
- [ ] Compact 布局（< 1120px）
- [ ] Cozy 布局（≥ 1120px）
- [ ] Spacious 布局（≥ 1440px）

**估计工作量**: 6-8 小时

---

### 5.3 性能优化
- [ ] 代码分割
- [ ] 懒加载优化
- [ ] 样式代码去重
- [ ] CSS 压缩

**估计工作量**: 3-4 小时

---

### 5.4 主题切换动画
- [ ] 平滑过渡效果
- [ ] 防止闪烁
- [ ] 优化切换性能

**估计工作量**: 2-3 小时

---

## 📅 时间估算

| 阶段 | 内容 | 估计时间 |
|------|------|---------|
| ✅ Phase 1 | 基础设施 + AboutTab | **已完成** |
| Phase 2 | 6 个功能标签页 | 27-41 小时 |
| Phase 3 | 通用组件库（8个组件） | 22-29 小时 |
| Phase 4 | 全局样式优化 | 4-6 小时 |
| Phase 5 | 测试与优化 | 15-21 小时 |
| **总计** | | **68-97 小时** |

---

## 🎯 建议的执行顺序

### 短期目标（1-2 周）
1. **SubtitleConvertTab**（最常用功能）
2. **MergeTab**（核心功能）
3. **Sidebar**（全局组件）

### 中期目标（3-4 周）
4. **创建 Button/Input/Select 通用组件**
5. **TranscodeTab + SubtitleBurnTab**
6. **LogViewerTab**

### 长期目标（5-6 周）
7. **BatchTab**
8. **创建其他通用组件**
9. **全局样式优化**
10. **可访问性和响应式测试**

---

## 💡 最佳实践建议

### 1. 组件迁移流程
```
1. 创建 .module.scss 文件
2. 移除 Bootstrap 类名
3. 应用设计令牌
4. 提取文本到翻译文件
5. 移除 emoji 表情符号
6. 测试深浅色主题
7. 测试所有状态（hover/focus/disabled）
```

### 2. 样式编写规范
```scss
// ✅ 使用设计令牌
height: t.$button-height-md;
padding: 0 t.$spacing-3;
border-radius: t.$radius-md;

// ✅ 使用 CSS 变量
background-color: var(--vt-color-brand-primary);
color: var(--vt-color-text-primary);

// ❌ 避免硬编码
height: 32px;  // 应该用 t.$button-height-md
padding: 0 12px;  // 应该用 t.$spacing-3
```

### 3. 组件提取时机
当某个 UI 模式在 **3 个或以上**的地方重复使用时，应提取为通用组件。

---

## 📝 下一步行动

### 立即开始（推荐）
**从 SubtitleConvertTab 开始**，因为：
- ✅ 是最常用的功能
- ✅ 相对简单，适合建立迁移流程
- ✅ 完成后有明显的视觉改进

### 准备工作
1. 检查 `SubtitleConvertTab.tsx` 当前代码
2. 规划需要的组件和样式
3. 创建 `SubtitleConvertTab.module.scss`
4. 开始迁移

---

## 🔧 辅助工具

### 开发命令
```bash
# 启动开发服务器
pnpm run dev

# 清理进程
pnpm run kill-dev

# 检查 linter
pnpm run lint

# 构建生产版本
pnpm run build
```

### 检查清单模板
复制 `VideoTool_UI_规范补充说明.md` 中的"代码审查清单"，每个组件迁移完成后检查一遍。

---

## 📚 参考文档

- [VideoTool_UI_规范补充说明.md](./UI/docs/VideoTool_UI_规范补充说明.md)
- [HandBrake_UI_视觉样式与设计令牌.md](./UI/docs/HandBrake_UI_视觉样式与设计令牌.md)
- [UI_SPEC_COMPLIANCE.md](./UI_SPEC_COMPLIANCE.md)
- [BLACK_WHITE_THEME.md](./BLACK_WHITE_THEME.md)

---

**路线图版本**: v1.0  
**最后更新**: 2025-11-01  
**状态**: 🚀 Phase 1 完成，准备开始 Phase 2

