# Wiki 文档说明

本目录包含了 VideoTool 项目的所有 Wiki 文档。

## 文档列表

| 文件名 | 说明 | 对应 Wiki 页面 |
|--------|------|---------------|
| `Home.md` | Wiki 主页，包含导航和概览 | [Home](https://github.com/binbin1213/VideoTool/wiki) |
| `Quick-Start.md` | 新手入门指南 | [Quick-Start](https://github.com/binbin1213/VideoTool/wiki/Quick-Start) |
| `Project-Status.md` | 开发进度和功能清单 | [Project-Status](https://github.com/binbin1213/VideoTool/wiki/Project-Status) |
| `Release-Process.md` | GitHub Actions 构建说明 | [Release-Process](https://github.com/binbin1213/VideoTool/wiki/Release-Process) |
| `Contributing.md` | 如何参与项目开发 | [Contributing](https://github.com/binbin1213/VideoTool/wiki/Contributing) |
| `FAQ.md` | FAQ 和问题排查 | [FAQ](https://github.com/binbin1213/VideoTool/wiki/FAQ) |

## 如何使用

### 方式一：复制到 GitHub Wiki

1. 访问项目的 Wiki 页面: https://github.com/binbin1213/VideoTool/wiki
2. 点击右侧的 "New Page"
3. 复制对应 .md 文件的内容
4. 粘贴到编辑器中
5. 设置页面标题（与文件名对应，如"Quick-Start"）
6. 点击 "Save Page"

### 方式二：使用 Git（推荐）

```bash
# 1. Clone Wiki 仓库
git clone https://github.com/binbin1213/VideoTool.wiki.git

# 2. 复制文档文件
cp wiki/*.md VideoTool.wiki/

# 3. 提交并推送
cd VideoTool.wiki
git add .
git commit -m "更新 Wiki 文档"
git push
```

## 更新文档

当需要更新 Wiki 时：

1. 编辑 `wiki/` 目录下的对应文件
2. 复制更新后的内容到 GitHub Wiki
3. 或使用 Git 方式推送更新

## Wiki 页面链接

主 Wiki: https://github.com/binbin1213/VideoTool/wiki

所有页面都会自动在侧边栏显示，方便导航。

## 注意事项

- Wiki 页面名称必须与 Markdown 文件中的一级标题一致
- 图片链接使用 GitHub raw 链接确保显示
- 内部链接使用相对路径（如 `[快速开始](Quick-Start)`）
- 文档已移除所有表情符号，保持专业简洁

---

创建日期: 2025-10-29  
最后更新: 2025-10-29
