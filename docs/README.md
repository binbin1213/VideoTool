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

### 专项功能文档

| 文档 | 说明 | 何时使用 |
|------|------|----------|
| [TRANSCODE_DESIGN.md](./TRANSCODE_DESIGN.md) | 视频转码功能设计 | 了解转码功能架构 |
| [VIDEO_TRANSCODE_SUMMARY.md](./VIDEO_TRANSCODE_SUMMARY.md) | 视频转码总结 | 转码功能参考 |

### 部署文档

| 文档 | 说明 | 何时使用 |
|------|------|----------|
| [UPDATE_SERVER_SETUP.md](./UPDATE_SERVER_SETUP.md) | 自动更新服务器配置 | 配置应用自动更新 |
| [OSS_QUICK_SETUP.md](./OSS_QUICK_SETUP.md) | OSS存储快速配置 | 配置云存储 |

### 历史参考文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [UIDesignSpec.md](./UIDesignSpec.md) | 旧版UI规范 | ⚠️ 已过时，请使用 UI_DESIGN_GUIDE.md |

---

## 📖 根目录文档

### 项目说明

| 文档 | 说明 |
|------|------|
| [README.md](../README.md) | 项目总览 |
| [VideoTool-中文.md](../VideoTool-中文.md) | 中文说明 |
| [CHANGELOG.md](../CHANGELOG.md) | 变更日志 |
| [PROJECT_STATUS.md](../PROJECT_STATUS.md) | 项目状态 |

### 快速开始

| 文档 | 说明 |
|------|------|
| [QUICK_START.md](../QUICK_START.md) | 快速开始指南 |
| [DEV_PROCESS_GUIDE.md](../DEV_PROCESS_GUIDE.md) | 开发进程管理（清理残留进程） |

### 测试文档

| 文档 | 说明 |
|------|------|
| [TESTING_GUIDE.md](../TESTING_GUIDE.md) | 测试指南 |

### 迁移文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [字幕转换Tab迁移指南.md](../字幕转换Tab迁移指南.md) | 字幕转换功能迁移详细过程 | ✅ 完成，可作参考 |
| [UI迁移路线图.md](../UI迁移路线图.md) | UI升级路线图 | 📝 规划文档 |
| [UI_UPGRADE_GUIDE.md](../UI_UPGRADE_GUIDE.md) | UI升级指南 | 📝 升级参考 |

### 主题文档

| 文档 | 说明 |
|------|------|
| [黑白灰主题方案.md](../黑白灰主题方案.md) | 主题色彩方案 |

### 发布文档

| 文档 | 说明 |
|------|------|
| [RELEASE.md](../RELEASE.md) | 发布流程 |
| [RELEASE_NOTES_v1.1.0-dev.md](../RELEASE_NOTES_v1.1.0-dev.md) | 发布说明 |

---

## 🎯 快速查找

### 我想...

#### 开发新功能页面
1. ✅ 先读：[NEW_FEATURE_GUIDE.md](./NEW_FEATURE_GUIDE.md)
2. ✅ 再读：[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)
3. 📖 参考：[字幕转换Tab迁移指南.md](../字幕转换Tab迁移指南.md)

#### 设计UI组件
1. ✅ 查阅：[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)
   - 组件规范（13类）
   - 颜色、字体、间距Token
   - 动效规范
   - 响应式设计

#### 实现FFmpeg功能
1. 📖 参考：[TRANSCODE_DESIGN.md](./TRANSCODE_DESIGN.md)
2. 📖 查看：`src/main/services/FFmpegService.ts`
3. 📖 示例：`src/main/ipc/subtitle-convert.handlers.ts`

#### 配置自动更新
1. 📖 阅读：[UPDATE_SERVER_SETUP.md](./UPDATE_SERVER_SETUP.md)

#### 调试进程问题
1. 📖 阅读：[DEV_PROCESS_GUIDE.md](../DEV_PROCESS_GUIDE.md)

#### 测试功能
1. 📖 阅读：[TESTING_GUIDE.md](../TESTING_GUIDE.md)

#### 发布新版本
1. 📖 阅读：[RELEASE.md](../RELEASE.md)

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

### Q: 旧文档还需要看吗？

**A:** 
- ✅ **必读**：`NEW_FEATURE_GUIDE.md` + `UI_DESIGN_GUIDE.md`
- ⚠️ **已过时**：`UIDesignSpec.md`（已被 `UI_DESIGN_GUIDE.md` 取代）
- 📖 **可参考**：其他文档按需查阅

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

- 📄 核心开发文档：**2份**（必读）
- 📄 专项功能文档：2份
- 📄 部署文档：2份
- 📄 总文档数：**20+ 份**
- ✅ 新功能开发覆盖率：**100%**

