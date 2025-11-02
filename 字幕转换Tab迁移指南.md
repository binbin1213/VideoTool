# SubtitleConvertTab 迁移指南

**文件**: `src/renderer/components/Features/SubtitleConvertTab.tsx`  
**状态**: 部分完成，需继续  
**已完成**: 40% (基础结构、翻译文件、样式文件)

---

## ✅ 已完成的部分

### 1. 基础设施
- ✅ 创建 `SubtitleConvertTab.module.scss` 样式文件
- ✅ 添加完整的翻译文件 (`zh-CN.json` 中的 `subtitleConvert` 部分)
- ✅ 导入 `useTranslation` 和 CSS 模块
- ✅ 移除 Bootstrap 组件的导入（Button, Form, Alert, ProgressBar）

### 2. 已迁移的UI部分
- ✅ 容器结构 (`.container`, `.header`, `.content`)
- ✅ 标题（移除 emoji，添加翻译）
- ✅ 批量模式开关（自定义 Switch 组件）
- ✅ 文件选择区域（移除 emoji，使用 CSS 模块）
- ✅ 文件列表（移除 ✓ ⏳ emoji，使用状态样式）

---

## 🚧 待完成的部分

### 剩余需要替换的元素统计

| 组件类型 | 数量 | 优先级 |
|---------|------|--------|
| `Form.Select` | ~8个 | ⭐⭐⭐ 高 |
| `Form.Check` (checkbox) | ~3个 | ⭐⭐ 中 |
| `Form.Control` (input) | ~10个 | ⭐⭐⭐ 高 |
| `Button` | ~8个 | ⭐⭐⭐ 高 |
| `ProgressBar` | 1个 | ⭐⭐ 中 |
| `Alert` | 1-2个 | ⭐⭐ 中 |
| `Badge` | 2个 | ⭐ 低 |
| Emoji 表情 | ~15处 | ⭐⭐⭐ 高 |

---

## 📋 详细迁移步骤

### Step 1: 替换所有 Button 组件

#### 查找模式
```tsx
// ❌ 旧代码
<Button variant="primary" size="lg" onClick={handleConvert}>
  {converting ? '转换中...' : '开始转换'}
</Button>
```

#### 替换为
```tsx
// ✅ 新代码
<button 
  className={`${styles.buttonPrimary} ${styles.buttonLarge}`}
  onClick={handleConvert}
  disabled={converting}
>
  {converting 
    ? (t('subtitleConvert.converting') || '转换中...') 
    : (t('subtitleConvert.startConvert') || '开始转换')
  }
</button>
```

#### 按钮样式对照表

| Bootstrap | CSS 模块 | 说明 |
|-----------|---------|------|
| `variant="primary"` | `styles.buttonPrimary` | 主要按钮（中灰色） |
| `variant="secondary"` | `styles.buttonSecondary` | 次要按钮（浅灰色） |
| `variant="outline-secondary"` | `styles.buttonSecondary` | 同上 |
| `variant="danger"` | `styles.buttonDanger` | 危险按钮（红色） |
| `size="sm"` | `styles.buttonSmall` | 小按钮 |
| `size="lg"` | `styles.buttonLarge` | 大按钮 |
| （无size） | `styles.button` | 中等按钮（默认） |

---

### Step 2: 替换所有 Form.Select

#### 查找模式
```tsx
// ❌ 旧代码
<Form.Select
  value={selectedStyle}
  onChange={(e) => setSelectedStyle(e.target.value)}
  style={{ width: '180px' }}
>
  <option value="style1">样式1</option>
  <option value="style2">样式2</option>
</Form.Select>
```

#### 替换为
```tsx
// ✅ 新代码
<select
  className={styles.select}
  value={selectedStyle}
  onChange={(e) => setSelectedStyle(e.target.value)}
  style={{ width: '180px' }}
>
  <option value="style1">{t('subtitleConvert.style1') || '样式1'}</option>
  <option value="style2">{t('subtitleConvert.style2') || '样式2'}</option>
</select>
```

---

### Step 3: 替换所有 Form.Check (checkbox)

#### 查找模式
```tsx
// ❌ 旧代码
<Form.Check
  type="checkbox"
  label="应用清理规则"
  checked={applyRegex}
  onChange={(e) => setApplyRegex(e.target.checked)}
/>
```

#### 替换为
```tsx
// ✅ 新代码
<label className={styles.checkbox}>
  <input
    type="checkbox"
    checked={applyRegex}
    onChange={(e) => setApplyRegex(e.target.checked)}
  />
  <span>{t('subtitleConvert.applyRules', { count: regexRules.filter(r => r.enabled).length }) || '应用清理规则'}</span>
</label>
```

---

### Step 4: 替换所有 Form.Control (input)

#### 查找模式
```tsx
// ❌ 旧代码
<Form.Control
  type="text"
  placeholder="输入水印文字"
  value={watermarkText}
  onChange={(e) => setWatermarkText(e.target.value)}
/>
```

#### 替换为
```tsx
// ✅ 新代码
<input
  type="text"
  className={styles.input}
  placeholder={t('subtitleConvert.watermarkText') || '输入水印文字'}
  value={watermarkText}
  onChange={(e) => setWatermarkText(e.target.value)}
/>
```

---

### Step 5: 替换 ProgressBar

#### 查找模式
```tsx
// ❌ 旧代码
<ProgressBar
  now={progress}
  label={`${progress}%`}
  animated={progress < 100}
  variant={progress === 100 ? 'success' : 'primary'}
/>
```

#### 替换为
```tsx
// ✅ 新代码
<div className={styles.section}>
  <div className={styles.progressBar}>
    <div 
      className={styles.progressFill}
      style={{ width: `${progress}%` }}
    />
  </div>
  <div className={styles.progressText}>{progress}%</div>
</div>
```

---

### Step 6: 替换 Alert

#### 查找模式
```tsx
// ❌ 旧代码
<Alert variant={result.success ? 'success' : 'danger'}>
  <Alert.Heading>
    {result.success ? '✅ 转换成功！' : '❌ 转换失败'}
  </Alert.Heading>
  <p>{result.message}</p>
</Alert>
```

#### 替换为
```tsx
// ✅ 新代码
<div className={`${styles.alert} ${result.success ? styles.alertSuccess : styles.alertError}`}>
  <div className={styles.alertHeading}>
    {result.success 
      ? (t('subtitleConvert.convertSuccess') || '转换成功！')
      : (t('subtitleConvert.convertFailed') || '转换失败')
    }
  </div>
  <div className={styles.alertText}>{result.message}</div>
  {result.outputPath && (
    <div className={styles.alertText}>
      <strong>{t('subtitleConvert.outputFile') || '输出文件'}：</strong>
      {result.outputPath}
    </div>
  )}
</div>
```

---

### Step 7: 替换 Badge

#### 查找模式
```tsx
// ❌ 旧代码
<Badge bg="secondary" style={{ fontSize: '9px' }}>预设</Badge>
<Badge bg="info" style={{ fontSize: '9px' }}>自定义</Badge>
```

#### 替换为
```tsx
// ✅ 新代码
<span className={`${styles.badge} ${styles.badgePreset}`}>
  {t('subtitleConvert.preset') || '预设'}
</span>
<span className={`${styles.badge} ${styles.badgeCustom}`}>
  {t('subtitleConvert.custom') || '自定义'}
</span>
```

---

### Step 8: 移除所有 Emoji 表情符号

需要移除的 emoji 清单：

| 位置 | 旧文本 | 新文本 |
|------|--------|--------|
| 批量模式 | `📦 批量转换模式` | `批量转换模式` |
| 单文件模式 | `📄 单文件转换模式` | `单文件转换模式` |
| 文件列表 | `📋 文件列表` | `文件列表` |
| 成功标记 | `✓` | 保留（或用文字"完成"） |
| 处理中 | `⏳` | 改为 `...` |
| 转换成功 | `✅ 转换成功！` | `转换成功！` |
| 转换失败 | `❌ 转换失败` | `转换失败` |
| 样式预览 | `📺 样式预览` | `样式预览` |
| 功能说明 | `📖 功能说明` | `功能说明` |
| 处理日志 | `📋 处理日志` | `处理日志` |
| 提示信息 | `💡 提示` | `提示` |

#### 全局搜索替换命令

```bash
# 搜索所有 emoji
grep -n '[📦📄📋📺✓⏳✅❌📖💡]' src/renderer/components/Features/SubtitleConvertTab.tsx
```

---

### Step 9: 替换内联样式和 fieldset

#### 查找所有 fieldset
```tsx
// ❌ 旧代码
<fieldset style={{ border: 'none', backgroundColor: '#fff', marginBottom: '4px', padding: '0 6px 6px 6px' }}>
  <legend style={{ display: 'none' }}>...</legend>
  ...
</fieldset>
```

#### 替换为
```tsx
// ✅ 新代码
<div className={styles.section}>
  <div className={styles.sectionTitle}>...</div>
  ...
</div>
```

---

### Step 10: 替换表单布局

#### 查找 Form.Group 和 Row/Col
```tsx
// ❌ 旧代码
<Form.Group as={Row} className={`mb-2 align-items-center ${formStyles.rowTight}`}>
  <Form.Label column sm={2} className={formStyles.label}>ASS样式模板:</Form.Label>
  <Col sm={10}>
    <Form.Select ... />
  </Col>
</Form.Group>
```

#### 替换为
```tsx
// ✅ 新代码
<div className={styles.formRow}>
  <label className={styles.formLabel}>
    {t('subtitleConvert.styleTemplate') || 'ASS样式模板'}:
  </label>
  <div className={styles.formControl}>
    <select className={styles.select} ... />
  </div>
</div>
```

---

## 🎯 Modal 样式编辑器迁移

Modal 部分较复杂，保留 Bootstrap Modal 组件，只替换内部的表单元素。

### 需要做的：

1. **Form.Group → div**
   ```tsx
   // 将所有 <Form.Group> 改为 <div className={styles.formRow}>
   ```

2. **Form.Label → label**
   ```tsx
   // 将所有 <Form.Label> 改为 <label className={styles.formLabel}>
   ```

3. **Form.Control → input**
   ```tsx
   // 将 <Form.Control type="number"> 改为 <input type="number" className={styles.input}>
   ```

4. **Form.Select → select**
   ```tsx
   // 将所有 <Form.Select> 改为 <select className={styles.select}>
   ```

5. **Modal 按钮**
   ```tsx
   // 将 Modal.Footer 中的 Button 改为自定义按钮样式
   <Button variant="secondary" → <button className={styles.buttonSecondary}
   <Button variant="primary" → <button className={styles.buttonPrimary}
   ```

---

## 📝 翻译文本替换清单

所有硬编码的中文文本都需要替换为 `t('subtitleConvert.xxx')`：

### 主要文本列表

```typescript
// 标题和导航
'字幕格式转换 (SRT → ASS)' → t('subtitleConvert.title')
'批量转换模式' → t('subtitleConvert.batchMode')
'单文件转换模式' → t('subtitleConvert.singleMode')

// 文件操作
'点击选择多个SRT文件' → t('subtitleConvert.selectMultipleFiles')
'点击选择或拖拽SRT文件到此处' → t('subtitleConvert.selectOrDrag')
'支持的格式：.srt' → t('subtitleConvert.supportedFormat')
'已选择 N 个文件' → t('subtitleConvert.filesSelected', { count: N })

// 按钮文本
'开始转换' → t('subtitleConvert.startConvert')
'转换中...' → t('subtitleConvert.converting')
'清空重新开始' → t('subtitleConvert.clearAndRestart')
'编辑' → t('subtitleConvert.editStyle')
'删除' → t('subtitleConvert.deleteStyle')

// 设置项
'ASS样式模板' → t('subtitleConvert.styleTemplate')
'清理规则' → t('subtitleConvert.cleaningRules')
'添加水印' → t('subtitleConvert.addWatermark')
'启用字幕水印' → t('subtitleConvert.enableWatermark')

// 样式编辑器
'字体名称' → t('subtitleConvert.fontName')
'字体大小' → t('subtitleConvert.fontSize')
'文字颜色' → t('subtitleConvert.textColor')
'描边颜色' → t('subtitleConvert.outlineColor')
'描边宽度' → t('subtitleConvert.outlineWidth')
'对齐方式' → t('subtitleConvert.alignment')
'底部边距' → t('subtitleConvert.bottomMargin')

// 颜色选项
'白色' → t('subtitleConvert.white')
'黑色' → t('subtitleConvert.black')
'红色' → t('subtitleConvert.red')
// ...等等
```

---

## 🔍 查找和替换技巧

### 1. 使用 VS Code 正则搜索

#### 查找所有 Button
```regex
<Button\s+variant="(primary|secondary|danger|outline-[^"]+)"[^>]*>
```

#### 查找所有 Form.Select
```regex
<Form\.Select[^>]*>
```

#### 查找所有 emoji
```regex
[📦📄📋📺✓⏳✅❌📖💡🎉]
```

### 2. 分批替换策略

建议按以下顺序替换，每完成一步测试一次：

1. ✅ **第一批**：容器和标题（已完成）
2. ⏳ **第二批**：所有按钮（约8个）
3. ⏳ **第三批**：所有 Form.Select（约8个）
4. ⏳ **第四批**：所有 Form.Check 和 Form.Control
5. ⏳ **第五批**：Progress 和 Alert
6. ⏳ **第六批**：移除所有 emoji
7. ⏳ **第七批**：Modal 内部表单
8. ⏳ **第八批**：添加所有翻译调用

---

## 🧪 测试清单

完成迁移后需要测试：

### 功能测试
- [ ] 单文件模式选择文件
- [ ] 批量模式选择多个文件
- [ ] 拖拽上传文件
- [ ] 样式模板选择
- [ ] 清理规则开关
- [ ] 水印功能开关和设置
- [ ] 开始转换按钮
- [ ] 进度条显示
- [ ] 成功/失败提示
- [ ] 样式预览
- [ ] 样式编辑器打开
- [ ] 保存自定义样式
- [ ] 删除自定义样式

### UI测试
- [ ] 浅色主题显示正常
- [ ] 深色主题显示正常
- [ ] 按钮 hover 效果
- [ ] 按钮 focus 效果
- [ ] 表单元素 focus ring
- [ ] 进度条动画
- [ ] Alert 样式正确
- [ ] Modal 样式正确

### 国际化测试
- [ ] 切换到英文，所有文本正确显示
- [ ] 切换回中文，所有文本正确显示
- [ ] 翻译插值（如 {{count}}）正常工作

---

## 📊 进度追踪

| 任务 | 状态 | 预计时间 |
|------|------|---------|
| 创建样式文件 | ✅ 完成 | - |
| 添加翻译文件 | ✅ 完成 | - |
| 基础结构迁移 | ✅ 完成 | - |
| 替换按钮组件 | ⏳ 待完成 | 30分钟 |
| 替换表单组件 | ⏳ 待完成 | 45分钟 |
| 移除 emoji | ⏳ 待完成 | 15分钟 |
| Modal 迁移 | ⏳ 待完成 | 30分钟 |
| 添加翻译调用 | ⏳ 待完成 | 45分钟 |
| 测试和修复 | ⏳ 待完成 | 30分钟 |
| **总计** | **40%** | **~3小时** |

---

## 💡 提示和最佳实践

### 1. 逐步迁移
不要一次性替换所有内容，按组件类型分批进行，每完成一批就测试。

### 2. 保留备份
```bash
# 已经创建了备份
cp SubtitleConvertTab.tsx SubtitleConvertTab.tsx.backup
```

### 3. 使用查找替换
VS Code 的查找替换功能可以大大加快速度：
- `Cmd+F` (Mac) 或 `Ctrl+F` (Windows) 打开查找
- 启用正则表达式模式
- 使用上面提供的正则表达式

### 4. 即时测试
每完成一部分就运行 `pnpm run dev` 测试，确保没有语法错误。

### 5. Linter 检查
```bash
# 检查语法错误
pnpm run lint src/renderer/components/Features/SubtitleConvertTab.tsx
```

---

## 🆘 常见问题

### Q: 替换后出现样式错误？
**A**: 检查 CSS 模块的类名是否正确，确保已导入 `styles`。

### Q: 翻译不显示？
**A**: 检查是否导入了 `useTranslation`，并且 `zh-CN.json` 中有对应的键。

### Q: 按钮点击无响应？
**A**: 检查 `disabled` 属性是否正确设置，事件处理函数是否绑定。

### Q: 深色主题颜色不对？
**A**: 确保使用了 CSS 变量（`var(--vt-color-xxx)`）而不是硬编码颜色。

---

## 📚 参考文档

- [VideoTool_UI_规范补充说明.md](./UI/docs/VideoTool_UI_规范补充说明.md)
- [AboutTab.module.scss](./src/renderer/components/Features/AboutTab.module.scss) - 参考示例
- [AboutTab.tsx](./src/renderer/components/Features/AboutTab.tsx) - 参考示例

---

**创建日期**: 2025-11-01  
**最后更新**: 2025-11-01  
**状态**: 进行中 (40% 完成)

