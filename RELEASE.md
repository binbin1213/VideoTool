# VideoTool 发布指南

## 版本号管理

本项目使用 `npm version` 命令自动管理版本号，无需手动修改代码。

### 三个核心命令

```bash
# 补丁版本（Bug 修复）：1.0.0 → 1.0.1
npm version patch

# 小版本（新功能）：1.0.0 → 1.1.0
npm version minor

# 大版本（破坏性更新）：1.0.0 → 2.0.0
npm version major
```

### 命令效果

执行 `npm version` 后会自动：
- ✅ 修改 `package.json` 中的 `version` 字段
- ✅ 创建 git commit（提交信息为版本号）
- ✅ 创建 git tag（格式：`v1.0.1`）

## 完整发布流程

### 方式一：快速发布（推荐）

```bash
# 1. 确保代码已提交
git status

# 2. 自动升级版本并创建 tag
npm version patch  # 或 minor/major

# 3. 推送代码和标签
git push --follow-tags

# 完成！GitHub Actions 会自动构建并发布
```

### 方式二：分步操作

```bash
# 1. 升级版本
npm version patch

# 2. 推送代码
git push

# 3. 推送标签
git push --tags
```

## 版本号规范

遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：

- **MAJOR（大版本）**：不兼容的 API 修改
- **MINOR（小版本）**：向下兼容的功能性新增
- **PATCH（补丁版本）**：向下兼容的问题修正

### 示例

```
1.0.0 → 1.0.1  (修复了字幕烧录的 bug)          → patch
1.0.1 → 1.1.0  (新增了视频剪辑功能)            → minor
1.1.0 → 2.0.0  (重构了整个 UI，API 有变化)    → major
```

## 自动化构建

### 触发条件

推送 `v*` 格式的 tag 到 GitHub 会触发 `.github/workflows/release.yml`

### 构建产物

- **macOS**: `VideoTool-{version}-universal.dmg` (支持 Intel + Apple Silicon)
- **Windows**: `VideoTool-Setup-{version}.exe` (安装程序)

### 查看构建进度

```
https://github.com/binbin1213/VideoTool/actions
```

## 注意事项

1. ⚠️ 发布前确保所有改动已提交（`git status` 应该是干净的）
2. ⚠️ 版本号只能升不能降
3. ⚠️ 标签一旦推送就不要删除，保持发布历史完整
4. ✅ 构建大约需要 15-30 分钟
5. ✅ 构建完成后会自动创建 GitHub Release

## 回滚版本

如果需要回滚或删除错误的发布：

```bash
# 删除本地 tag
git tag -d v1.0.1

# 删除远程 tag
git push origin --delete v1.0.1

# 在 GitHub 上手动删除对应的 Release
```

## 常见问题

### Q: 执行 npm version 报错？

**A:** 确保工作区干净：
```bash
git status  # 应该没有未提交的改动
```

### Q: 如何跳过 git hooks？

**A:** 添加 `--no-git-tag-version` 参数：
```bash
npm version patch --no-git-tag-version
```

### Q: 如何预览版本号变化？

**A:** 使用 `--dry-run`：
```bash
npm version patch --dry-run
```

## 相关文件

- `package.json` - 版本号配置
- `.github/workflows/release.yml` - 自动构建配置
- `.github/workflows/build.yml` - 手动构建配置

