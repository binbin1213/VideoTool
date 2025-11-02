# VideoTool UI 升级快速开始

## 🎉 升级完成！

恭喜！VideoTool 已成功按照 **方案A（最小改动方案）** 完成升级。

---

## ✅ 已完成的核心改造

### 1️⃣ 设计令牌系统 ✨
- ✅ 字体从 11px → 14px（更易读）
- ✅ 控件高度从 22px → 32px（更易点击）
- ✅ 完整的 8pt 网格系统
- ✅ 品牌色、语义色、状态透明度
- ✅ 圆角、阴影、图标、动效定义

### 2️⃣ 深色主题支持 🌙
- ✅ CSS 变量实现动态切换
- ✅ 浅色和深色完整色系
- ✅ 平滑过渡动画（180ms）

### 3️⃣ 主题管理系统 🎨
- ✅ Zustand 状态管理
- ✅ 支持 light/dark/system 三种模式
- ✅ 自动跟随系统主题
- ✅ 持久化到 localStorage

### 4️⃣ 国际化支持 🌍
- ✅ i18next 配置完成
- ✅ 支持中文和英文
- ✅ 自动检测系统语言
- ✅ 核心组件已翻译（App、Sidebar）

---

## 🚀 立即测试

### 启动开发服务器
```bash
pnpm run dev
```

### 验证功能清单
- [ ] 应用正常启动，字体变大了（14px）
- [ ] 侧边栏菜单显示正常
- [ ] FFmpeg 提示框文案已翻译
- [ ] 浅色主题显示正常
- [ ] 深色主题支持（通过系统设置切换）

---

## 🎨 添加主题切换按钮（可选）

在 `Header.tsx` 或 `AboutTab.tsx` 中添加：

```tsx
import { useTheme } from '../store';
import { FaMoon, FaSun } from 'react-icons/fa';

function ThemeToggle() {
  const { effectiveTheme, setTheme } = useTheme();
  
  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={() => setTheme(effectiveTheme === 'light' ? 'dark' : 'light')}
      title={effectiveTheme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {effectiveTheme === 'light' ? <FaMoon /> : <FaSun />}
    </Button>
  );
}
```

---

## 🌍 添加语言切换（可选）

```tsx
import { useTranslation } from 'react-i18next';

function LanguageSwitch() {
  const { i18n } = useTranslation();
  
  return (
    <select 
      value={i18n.language} 
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="form-select form-select-sm"
      style={{ width: 'auto' }}
    >
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
    </select>
  );
}
```

---

## 📁 新增文件清单

```
src/renderer/
├── store/
│   ├── index.ts                    [新建] Zustand store 入口
│   └── slices/
│       └── themeSlice.ts          [新建] 主题管理 slice
├── i18n/
│   └── config.ts                   [新建] i18next 配置
├── locales/
│   ├── zh-CN.json                  [新建] 中文翻译
│   └── en-US.json                  [新建] 英文翻译
└── styles/
    ├── tokens.scss                 [更新] 完整设计令牌
    └── global.scss                 [更新] CSS 变量和主题

根目录/
├── UI_UPGRADE_GUIDE.md             [新建] 详细升级指南
└── UI_UPGRADE_QUICKSTART.md        [本文件] 快速开始
```

---

## 🔧 修改的现有文件

| 文件 | 主要变更 |
|------|---------|
| `App.tsx` | ✅ 初始化主题、使用 i18n |
| `Sidebar.tsx` | ✅ 使用 i18n 翻译菜单 |
| `index.tsx` | ✅ 导入 i18n 配置 |
| `tokens.scss` | ✅ 完整设计令牌系统 |
| `global.scss` | ✅ CSS 变量和深色主题 |
| `App.scss` | ✅ 使用 CSS 变量 |

---

## 🎯 下一步建议

### 立即可做（10分钟）
1. ✅ 运行 `pnpm run dev` 测试应用
2. ✅ 切换系统主题查看深色模式
3. ✅ 添加主题切换按钮到 UI

### 短期优化（1-2天）
4. 📝 翻译其他 Tab 组件（SubtitleConvertTab、MergeTab 等）
5. 🎨 优化深色模式下的样式细节
6. 🔍 运行对比度检查脚本

### 长期规划（1周+）
7. ♿ 添加完整的可访问性支持（aria-label、键盘导航）
8. 📸 截图浅色/深色主题用于文档
9. 🌐 添加更多语言（日语、韩语等）

---

## 📖 详细文档

完整的升级指南、使用方法和最佳实践，请阅读：
👉 **[UI_UPGRADE_GUIDE.md](./UI_UPGRADE_GUIDE.md)**

HandBrake UI 规范文档：
👉 **[UI/docs/README.md](./UI/docs/README.md)**

---

## 💡 常见问题

### Q: 字体怎么变大了？
A: 从 11px 升级到 14px 是设计规范要求，提升可读性。如果觉得太大，可以暂时改回：
```scss
// tokens.scss
$font-size-base: 13px; // 或 12px
```

### Q: 如何强制使用浅色主题？
A: 在 `App.tsx` 中修改：
```tsx
useEffect(() => {
  setTheme('light'); // 强制浅色
}, []);
```

### Q: 如何添加新的翻译？
A: 
1. 在 `locales/zh-CN.json` 添加键值对
2. 在 `locales/en-US.json` 添加对应翻译
3. 在组件中使用 `t('your.key')`

---

## 🎊 升级成功！

您的 VideoTool 现在拥有：
- ✨ 现代化的设计系统
- 🌙 深色主题支持
- 🌍 国际化能力
- 🎨 可定制的主题

开始享受更好的开发和用户体验吧！🚀

---

**有问题？** 查看 [UI_UPGRADE_GUIDE.md](./UI_UPGRADE_GUIDE.md) 获取详细帮助。

**反馈与建议？** 欢迎提 Issue 或 PR！

