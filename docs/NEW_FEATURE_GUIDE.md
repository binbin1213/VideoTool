# 新功能页面开发指南

> VideoTool 功能页面开发完整指南  
> 最后更新：2025-11-03  
> 版本：v1.0.0

---

## 📚 前置阅读

开发新功能页面前，请先阅读以下文档：

1. **必读** ✅ [`docs/UI_DESIGN_GUIDE.md`](./UI_DESIGN_GUIDE.md) - UI设计规范（组件、样式、动效）
2. **必读** ✅ 本文档 - 功能开发规范（文件结构、命名、国际化）
3. 参考 📖 [`字幕转换Tab迁移指南.md`](../字幕转换Tab迁移指南.md) - 实际开发示例

---

## 🎯 快速开始检查清单

新增功能页面需要完成以下步骤（**按顺序**）：

- [ ] 1. 确定功能名称和ID（kebab-case）
- [ ] 2. 创建文件结构（组件、样式、类型）
- [ ] 3. 添加国际化翻译（中英文）
- [ ] 4. 实现主组件（使用UI规范）
- [ ] 5. 添加到侧边栏菜单
- [ ] 6. 如需主进程功能，实现IPC通信
- [ ] 7. 测试功能
- [ ] 8. 提交代码

---

## 📁 文件结构规范

### 简单功能页面（推荐）

```
src/renderer/components/Features/
└── MyFeatureTab.tsx                    # 主组件
└── MyFeatureTab.module.scss            # 样式文件
```

**适用场景：**
- 单一功能，代码量 < 500 行
- 不需要复杂状态管理
- 示例：`AboutTab`, `LogViewerTab`

### 复杂功能页面

```
src/renderer/components/Features/
└── MyFeatureTab/
    ├── index.tsx                       # 主入口
    ├── MyFeatureTab.module.scss        # 主样式
    ├── components/                     # 子组件
    │   ├── SubComponent1.tsx
    │   ├── SubComponent1.module.scss
    │   ├── SubComponent2.tsx
    │   └── SubComponent2.module.scss
    ├── hooks/                          # 自定义Hooks
    │   ├── useMyFeature.ts
    │   └── useMyFeatureConfig.ts
    └── types.ts                        # 类型定义（可选）
```

**适用场景：**
- 复杂功能，代码量 > 500 行
- 需要多个子组件
- 需要自定义Hooks管理状态
- 示例：`TranscodeTab`

---

## 📝 命名规范

### 1. 功能ID（kebab-case）

用于路由、侧边栏标识、翻译键名：

```typescript
// ✅ 正确
'subtitle-convert'
'video-merge'
'my-feature'

// ❌ 错误
'SubtitleConvert'   // 不要用PascalCase
'subtitle_convert'  // 不要用snake_case
'subtitleConvert'   // 不要用camelCase
```

### 2. 组件名（PascalCase）

```typescript
// ✅ 正确
SubtitleConvertTab.tsx
MyFeatureTab.tsx
FileSelector.tsx

// ❌ 错误
subtitle-convert-tab.tsx  // 不要用kebab-case
subtitleConvertTab.tsx    // 不要用camelCase
```

### 3. 样式文件（与组件同名）

```scss
// ✅ 正确
SubtitleConvertTab.module.scss
MyFeatureTab.module.scss

// ❌ 错误
SubtitleConvert.scss        // 缺少 .module
subtitle-convert.module.scss // 大小写不一致
```

### 4. 样式类名（camelCase + BEM）

```scss
// ✅ 正确 - BEM风格
.container { }
.header { }
.header__title { }
.button--primary { }
.fileList { }
.fileList__item { }
.fileList__item--active { }

// ❌ 错误
.Container { }              // 不要用PascalCase
.file-list { }              // 不要用kebab-case
.file_list { }              // 不要用snake_case
```

### 5. 变量名（camelCase）

```typescript
// ✅ 正确
const inputFile = '';
const isLoading = false;
const handleFileSelect = () => {};

// ❌ 错误
const InputFile = '';       // 不要用PascalCase
const input_file = '';      // 不要用snake_case
```

### 6. 类型名（PascalCase）

```typescript
// ✅ 正确
interface MyFeatureConfig { }
type FileStatus = 'pending' | 'processing' | 'done';

// ❌ 错误
interface myFeatureConfig { }  // 不要用camelCase
type file_status = ...;        // 不要用snake_case
```

---

## 🌍 国际化（i18n）规范

### 1. 翻译文件位置

```
src/renderer/locales/
├── zh-CN.json    # 简体中文（主要）
└── en-US.json    # 英文（次要）
```

### 2. 翻译键名结构

```json
{
  "myFeature": {
    "title": "功能标题",
    "description": "功能描述",
    "button": {
      "start": "开始",
      "stop": "停止",
      "reset": "重置"
    },
    "form": {
      "inputFile": "输入文件",
      "outputPath": "输出路径",
      "format": "格式"
    },
    "status": {
      "idle": "空闲",
      "processing": "处理中",
      "success": "成功",
      "error": "错误"
    },
    "message": {
      "selectFile": "请选择文件",
      "processSuccess": "处理成功",
      "processError": "处理失败: {{error}}"
    }
  }
}
```

### 3. 使用翻译

```typescript
import { useTranslation } from 'react-i18next';

function MyFeatureTab() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <button>{t('myFeature.button.start')}</button>
      
      {/* 带参数的翻译 */}
      <p>{t('myFeature.message.processError', { error: 'file not found' })}</p>
    </div>
  );
}
```

### 4. 侧边栏翻译

在 `locales/zh-CN.json` 和 `en-US.json` 中添加：

```json
{
  "sidebar": {
    "my_feature": "我的功能"
  }
}
```

---

## 🎨 组件开发规范

### 1. 组件模板

```typescript
// MyFeatureTab.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './MyFeatureTab.module.scss';

function MyFeatureTab() {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStart = async () => {
    try {
      setIsProcessing(true);
      // 处理逻辑
      alert(t('myFeature.message.processSuccess'));
    } catch (error) {
      alert(t('myFeature.message.processError', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('myFeature.title')}</h1>
        <p className={styles.description}>{t('myFeature.description')}</p>
      </div>

      <div className={styles.content}>
        <button 
          className={styles.button}
          onClick={handleStart}
          disabled={isProcessing}
        >
          {t('myFeature.button.start')}
        </button>
      </div>
    </div>
  );
}

export default MyFeatureTab;
```

### 2. 样式模板

```scss
// MyFeatureTab.module.scss
@use '../../styles/tokens.scss' as t;

// ========================================
// 容器
// ========================================
.container {
  padding: t.$spacing-5;
  background-color: var(--vt-color-bg);
}

// ========================================
// 头部
// ========================================
.header {
  margin-bottom: t.$spacing-6;
}

.title {
  font-size: t.$font-size-xl;
  font-weight: t.$font-weight-semibold;
  color: var(--vt-color-text-primary);
  margin-bottom: t.$spacing-2;
}

.description {
  font-size: t.$font-size-base;
  color: var(--vt-color-text-secondary);
}

// ========================================
// 内容区域
// ========================================
.content {
  // 内容样式
}

// ========================================
// 按钮
// ========================================
.button {
  height: t.$button-height-sm; // 28px
  padding: 0 t.$spacing-3;
  font-size: t.$font-size-base; // 14px
  font-weight: 400;
  border-radius: t.$radius-sm;
  transition: all t.$motion-duration-fast t.$motion-easing-standard;
  
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, t.$state-alpha-hover);
  }
  
  &:disabled {
    opacity: t.$state-opacity-disabled;
    cursor: not-allowed;
  }
}
```

### 3. 使用设计系统

**必须遵循 [`UI_DESIGN_GUIDE.md`](./UI_DESIGN_GUIDE.md) 中的规范：**

- ✅ 按钮高度：28px
- ✅ 选择框高度：28px
- ✅ 字体大小：14px（正文）
- ✅ 字体粗细：400（正常）
- ✅ 间距：使用 `t.$spacing-*`
- ✅ 颜色：使用 CSS 变量 `var(--vt-color-*)`
- ✅ 动画：使用 `t.$motion-*`

---

## 🔌 IPC通信规范

如果功能需要调用主进程（FFmpeg、文件系统等），需要实现IPC通信。

### 1. 定义IPC Handler（主进程）

```typescript
// src/main/ipc/my-feature.handlers.ts
import { ipcMain } from 'electron';

export function registerMyFeatureHandlers() {
  // 处理功能请求
  ipcMain.handle('my-feature-process', async (event, params: MyFeatureParams) => {
    try {
      // 处理逻辑
      const result = await processMyFeature(params);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // 取消处理
  ipcMain.handle('my-feature-cancel', async () => {
    // 取消逻辑
    return { success: true };
  });
}
```

### 2. 在主进程注册Handler

```typescript
// src/main/index.ts
import { registerMyFeatureHandlers } from './ipc/my-feature.handlers';

// 注册所有IPC handlers
registerMyFeatureHandlers();
```

### 3. 在渲染进程调用

```typescript
// MyFeatureTab.tsx
const handleProcess = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke('my-feature-process', {
      inputFile: '/path/to/file',
      options: { /* ... */ }
    });

    if (result.success) {
      console.log('Success:', result.data);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('IPC Error:', error);
  }
};
```

### 4. 定义类型（可选但推荐）

```typescript
// src/shared/types/my-feature.types.ts
export interface MyFeatureParams {
  inputFile: string;
  outputPath: string;
  options: MyFeatureOptions;
}

export interface MyFeatureOptions {
  quality: number;
  format: string;
}

export interface MyFeatureResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

---

## 🗂️ 添加到应用

### 1. 添加到侧边栏

编辑 `src/renderer/components/Layout/Sidebar.tsx`：

```typescript
import { FaMyIcon } from 'react-icons/fa'; // 选择合适的图标

const menuItems = [
  // ... 其他菜单项
  { 
    id: 'my-feature', 
    icon: FaMyIcon, 
    label: t('sidebar.my_feature') 
  },
];
```

### 2. 添加到主应用路由

编辑 `src/renderer/App.tsx`：

```typescript
import MyFeatureTab from './components/Features/MyFeatureTab';

function App() {
  const renderContent = () => {
    switch (activeTab) {
      // ... 其他 case
      case 'my-feature':
        return <MyFeatureTab />;
      default:
        return <SubtitleConvertTab />;
    }
  };

  return (
    // ...
  );
}
```

---

## ✅ 开发检查清单

### 开发前

- [ ] 确定功能名称（kebab-case ID）
- [ ] 设计UI草图
- [ ] 确定是否需要主进程支持
- [ ] 阅读 `UI_DESIGN_GUIDE.md`

### 开发中

**文件结构：**
- [ ] 创建组件文件（`.tsx`）
- [ ] 创建样式文件（`.module.scss`）
- [ ] 如需类型定义，创建 `types.ts`

**国际化：**
- [ ] 添加中文翻译（`zh-CN.json`）
- [ ] 添加英文翻译（`en-US.json`）
- [ ] 添加侧边栏翻译
- [ ] 组件中使用 `t()` 函数

**UI实现：**
- [ ] 遵循UI设计规范（按钮28px、字体14px等）
- [ ] 使用设计Token（`t.$spacing-*`、`t.$font-*`）
- [ ] 使用CSS变量（`var(--vt-color-*)`）
- [ ] 实现hover、focus、disabled状态
- [ ] 响应式布局适配

**功能实现：**
- [ ] 状态管理（useState、useEffect）
- [ ] 表单验证
- [ ] 错误处理
- [ ] 加载状态
- [ ] 如需IPC，实现主进程Handler

**集成：**
- [ ] 添加到侧边栏菜单
- [ ] 添加到App路由
- [ ] 选择合适的图标

### 开发后

- [ ] 功能测试（正常流程）
- [ ] 边界测试（异常输入）
- [ ] 错误处理测试
- [ ] UI响应式测试
- [ ] 深色模式测试（如支持）
- [ ] 代码审查（linter、类型检查）
- [ ] 提交代码（清晰的commit message）

---

## 📚 参考示例

### 简单页面示例

- **AboutTab** - 信息展示页面
- **LogViewerTab** - 日志查看页面

### 复杂页面示例

- **SubtitleConvertTab** - 字幕转换（完整功能）
- **TranscodeTab** - 视频转码（双模式、多组件）

### 迁移参考

- [`字幕转换Tab迁移指南.md`](../字幕转换Tab迁移指南.md) - 实际迁移过程记录

---

## 🎯 最佳实践

### DO ✅

1. **使用设计Token**
```scss
// ✅ 使用Token
.button {
  height: t.$button-height-sm;
  padding: 0 t.$spacing-3;
  font-size: t.$font-size-base;
}
```

2. **使用国际化**
```typescript
// ✅ 使用翻译
<h1>{t('myFeature.title')}</h1>
```

3. **类型安全**
```typescript
// ✅ 定义类型
interface MyFeatureConfig {
  quality: number;
  format: string;
}
```

4. **错误处理**
```typescript
// ✅ 完整的错误处理
try {
  await processFile();
} catch (error) {
  alert(t('myFeature.message.error', { 
    error: error instanceof Error ? error.message : 'Unknown' 
  }));
}
```

### DON'T ❌

1. **不要硬编码样式**
```scss
// ❌ 硬编码
.button {
  height: 28px;        // 应该用 t.$button-height-sm
  padding: 0 12px;     // 应该用 t.$spacing-3
  font-size: 14px;     // 应该用 t.$font-size-base
}
```

2. **不要硬编码文字**
```typescript
// ❌ 硬编码中文
<h1>我的功能</h1>

// ✅ 使用翻译
<h1>{t('myFeature.title')}</h1>
```

3. **不要忽略错误处理**
```typescript
// ❌ 没有错误处理
const result = await window.electron.ipcRenderer.invoke('process');
console.log(result);

// ✅ 完整错误处理
try {
  const result = await window.electron.ipcRenderer.invoke('process');
  if (result.success) {
    // 处理成功
  } else {
    // 处理错误
  }
} catch (error) {
  // 处理异常
}
```

4. **不要使用Bootstrap组件**
```typescript
// ❌ 使用Bootstrap
import { Button } from 'react-bootstrap';

// ✅ 使用自定义样式
<button className={styles.button}>...</button>
```

---

## 🆘 常见问题

### Q: 我的功能需要FFmpeg，如何调用？

**A:** 参考 `src/main/ipc/subtitle-convert.handlers.ts`，实现IPC Handler调用 `FFmpegService`。

### Q: 我的样式没有生效？

**A:** 检查：
1. 是否使用了 `.module.scss` 后缀
2. 是否正确导入了 styles：`import styles from './MyFeature.module.scss'`
3. 是否使用了 `className={styles.myClass}`

### Q: 翻译不显示？

**A:** 检查：
1. 翻译键名是否正确（区分大小写）
2. 是否在 `zh-CN.json` 和 `en-US.json` 都添加了翻译
3. 是否使用了 `useTranslation()` Hook

### Q: 如何选择图标？

**A:** 
1. 浏览 [react-icons.github.io/react-icons](https://react-icons.github.io/react-icons/)
2. 选择 Font Awesome (Fa*) 系列
3. 导入并使用：`import { FaMyIcon } from 'react-icons/fa'`

### Q: 如何测试我的功能？

**A:** 参考 [`TESTING_GUIDE.md`](../TESTING_GUIDE.md)

---

## 📞 获取帮助

- 📖 查阅文档：`docs/` 目录
- 🔍 搜索示例：查看现有功能页面代码
- 💬 提问：在项目issue中提问

---

**最后更新：2025-11-03**  
**文档版本：v1.0.0**

