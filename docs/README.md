# VideoTool 开发文档索引

> 所有开发相关文档的索引和使用指南  
> 最后更新：2025-11-03

---

## 🚀 新功能开发

### ✅ 必读文档（按顺序）

| # | 文档 | 用途 | 重要性 |
|---|------|------|--------|
| 1 | [UI设计规范](./UI_DESIGN_GUIDE.md) | UI组件、样式、动效规范 | ⭐⭐⭐ 必读 |
| 2 | [新功能页面开发指南](./NEW_FEATURE_GUIDE.md) | 文件结构、命名、国际化、IPC | ⭐⭐⭐ 必读 |

**开发新功能页面时，只需要阅读这两份文档！** ✅

---

## 📚 完整文档列表

### 核心开发文档

| 文档 | 说明 | 何时使用 |
|------|------|----------|
| **[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)** | **UI设计规范** - 13类组件、动效、响应式 | 开发任何UI时必读 ⭐⭐⭐ |
| **[NEW_FEATURE_GUIDE.md](./NEW_FEATURE_GUIDE.md)** | **新功能开发指南** - 完整开发流程 | 新增功能页面时必读 ⭐⭐⭐ |

### 技术文档

| 文档 | 说明 | 何时使用 |
|------|------|----------|
| [SUBTITLE_REGEX_RULES.md](./SUBTITLE_REGEX_RULES.md) | 字幕正则替换规则说明 | 了解字幕转换规则 |
| [SUBTITLE_STYLES.md](./SUBTITLE_STYLES.md) | ASS 字幕样式说明 | 了解字幕样式配置 |

### 部署配置文档

| 文档 | 说明 | 何时使用 |
|------|------|----------|
| [UPDATE_SERVER_SETUP.md](./UPDATE_SERVER_SETUP.md) | 自动更新服务器配置 | 配置应用自动更新 |
| [OSS_QUICK_SETUP.md](./OSS_QUICK_SETUP.md) | OSS存储快速配置 | 配置云存储 |

---

## 📖 根目录文档

### 项目说明

| 文档 | 说明 |
|------|------|
| [README.md](../README.md) | 项目总览 |
| [LICENSE](../LICENSE) | 开源许可证（MIT） |

---

## 🎯 快速查找

### 我想...

#### 开发新功能页面
1. ✅ 先读：[NEW_FEATURE_GUIDE.md](./NEW_FEATURE_GUIDE.md)
2. ✅ 再读：[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)

#### 设计UI组件
1. ✅ 查阅：[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)
   - 组件规范（13类）
   - 颜色、字体、间距Token
   - 动效规范
   - 响应式设计

#### 了解字幕转换功能
1. 📖 正则规则：[SUBTITLE_REGEX_RULES.md](./SUBTITLE_REGEX_RULES.md)
   - 7条正则替换规则
   - 详细示例和说明
   - 技术实现代码
2. 📖 样式配置：[SUBTITLE_STYLES.md](./SUBTITLE_STYLES.md)
   - ASS 字幕样式说明
   - 6个预设样式详解
   - 颜色、对齐、分辨率适配

#### 实现FFmpeg功能
1. 📖 查看：`src/main/services/FFmpegService.ts`
2. 📖 示例：`src/main/ipc/subtitle-convert.handlers.ts`

#### 配置自动更新
1. 📖 阅读：[UPDATE_SERVER_SETUP.md](./UPDATE_SERVER_SETUP.md)

#### 配置云存储
1. 📖 阅读：[OSS_QUICK_SETUP.md](./OSS_QUICK_SETUP.md)

---

## 📋 开发检查清单

### 新功能开发

```
□ 1. 阅读 NEW_FEATURE_GUIDE.md
□ 2. 阅读 UI_DESIGN_GUIDE.md
□ 3. 确定功能ID（kebab-case）
□ 4. 创建文件结构
□ 5. 添加国际化翻译
□ 6. 实现UI（遵循设计规范）
□ 7. 实现逻辑（如需IPC）
□ 8. 添加到侧边栏
□ 9. 测试功能
□ 10. 提交代码
```

### 代码审查

```
□ 1. 遵循命名规范
□ 2. 使用设计Token（不硬编码）
□ 3. 使用国际化（不硬编码文字）
□ 4. 完整错误处理
□ 5. 实现交互状态（hover/focus/disabled）
□ 6. 响应式布局
□ 7. 类型安全
```

---

## 🆘 常见问题

### Q: 开发新功能需要看哪些文档？

**A:** 只需要两份：
1. **[NEW_FEATURE_GUIDE.md](./NEW_FEATURE_GUIDE.md)** - 开发流程、文件结构、命名规范
2. **[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)** - UI组件、样式规范

### Q: UI设计规范包含什么？

**A:** 包含：
- 13类UI组件规范（按钮、选择框、输入框、开关等）
- 设计Token（字体、颜色、间距、阴影、图标）
- 动效规范（时长、缓动、透明度）
- 响应式设计（断点、网格）
- 实施检查清单（38项）

### Q: 如何确保代码符合规范？

**A:** 使用检查清单：
- [NEW_FEATURE_GUIDE.md](./NEW_FEATURE_GUIDE.md) 中的"开发检查清单"
- [UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md) 中的"实施检查清单"

### Q: 文档目录有多少个文档？

**A:** 
- ✅ **核心开发文档**：2份（必读）
- 📖 **技术文档**：2份（字幕相关）
- ⚙️ **部署配置文档**：2份
- 📄 **总计**：6份精简文档

---

## 📞 获取帮助

- 📖 **查阅文档**：从本索引找到相关文档
- 🔍 **搜索代码**：查看现有功能实现
- 💬 **提问**：在项目issue中提问

---

## 📝 文档贡献

如需更新文档：

1. 修改相应的 `.md` 文件
2. 更新本索引（如有必要）
3. 提交时注明文档版本
4. 在变更历史中记录

---

**文档版本：v1.0.0**  
**最后更新：2025-11-03**

---

## 📊 文档统计

**docs/ 目录：**
- 📄 核心开发文档：**2份**（必读）
- 📄 技术文档：**2份**（字幕相关）
- 📄 部署配置文档：**2份**
- 📄 docs/ 总计：**6份**

**根目录：**
- 📄 README.md + LICENSE：**2份**

**整体统计：**
- 📄 项目总文档数：**8份**（从53份精简到8份）
- 📉 文档精简率：**85%**
- ✅ 新功能开发覆盖率：**100%**

