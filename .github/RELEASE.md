# 🚀 GitHub Actions 自动构建说明

## 📦 自动构建流程

本项目已配置 GitHub Actions，可以自动构建 macOS、Windows 和 Linux 版本的应用。

### 触发条件

1. **推送到 main 分支**：自动构建并上传构建产物
2. **创建 Pull Request**：自动构建用于测试
3. **创建 Tag**：自动构建并创建 GitHub Release
4. **手动触发**：在 GitHub Actions 页面手动运行

---

## 🏷️ 创建 Release 版本

### 方法一：使用命令行创建 Tag

```bash
# 1. 确保代码已提交
git add .
git commit -m "准备发布 v1.0.0"

# 2. 创建并推送 tag
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub Actions 会自动：
#    - 构建 macOS、Windows、Linux 版本
#    - 创建 GitHub Release
#    - 上传所有安装包
```

### 方法二：在 GitHub 网页创建 Release

1. 访问：https://github.com/binbin1213/VideoTool/releases/new
2. 输入 Tag 版本：如 `v1.0.0`
3. 填写 Release 标题和说明
4. 点击 "Publish release"
5. GitHub Actions 会自动构建并上传文件

---

## 📥 构建产物

### macOS
- `VideoTool-1.0.0-universal.dmg` - Universal 安装包（Intel + Apple Silicon）
- `VideoTool-1.0.0-arm64-mac.zip` - Apple Silicon 版本
- `VideoTool-1.0.0-x64-mac.zip` - Intel 版本

### Windows
- `VideoTool Setup 1.0.0.exe` - NSIS 安装程序
- `VideoTool 1.0.0.exe` - 便携版

### Linux
- `VideoTool-1.0.0.AppImage` - AppImage 格式
- `videotool_1.0.0_amd64.deb` - Debian/Ubuntu
- `videotool-1.0.0.x86_64.rpm` - RedHat/Fedora/CentOS

---

## 🔧 配置说明

### GitHub Token

GitHub Actions 使用 `GITHUB_TOKEN` 自动认证，无需额外配置。

### 代码签名（可选）

如果需要对应用进行代码签名：

#### macOS
```yaml
env:
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  CSC_LINK: ${{ secrets.MAC_CERT }}
  CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
```

#### Windows
```yaml
env:
  WIN_CSC_LINK: ${{ secrets.WIN_CERT }}
  WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CERT_PASSWORD }}
```

在 GitHub 仓库设置中添加这些 Secrets：
Settings → Secrets and variables → Actions → New repository secret

---

## 📊 查看构建状态

1. 访问：https://github.com/binbin1213/VideoTool/actions
2. 查看最近的工作流运行记录
3. 点击具体的运行查看详细日志
4. 下载构建产物测试

---

## 🎯 版本号规范

建议使用语义化版本号：`v主版本.次版本.修订号`

- `v1.0.0` - 首次正式发布
- `v1.0.1` - Bug 修复
- `v1.1.0` - 新功能
- `v2.0.0` - 重大更新

---

## 📝 发布检查清单

- [ ] 更新 `package.json` 中的版本号
- [ ] 更新 `PROJECT_STATUS.md` 完成度
- [ ] 测试所有功能是否正常
- [ ] 更新 CHANGELOG（如果有）
- [ ] 创建 Git Tag 并推送
- [ ] 等待 GitHub Actions 构建完成
- [ ] 测试下载的安装包
- [ ] 编写 Release Notes

---

## 🐛 故障排除

### 构建失败

1. 查看 Actions 日志找到错误信息
2. 检查依赖是否正确安装
3. 确认 Node.js 版本兼容性

### 找不到构建产物

1. 确认工作流已成功完成
2. 检查 `release/` 目录路径配置
3. 查看 electron-builder 输出日志

### 无法创建 Release

1. 确认 Tag 格式正确（以 `v` 开头）
2. 检查 `GITHUB_TOKEN` 权限
3. 确认仓库设置允许创建 Release

---

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/actions)
- [electron-builder 文档](https://www.electron.build/)
- [项目仓库](https://github.com/binbin1213/VideoTool)

