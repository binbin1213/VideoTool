# 贡献指南

感谢您考虑为 VideoTool 做出贡献！

---

## 如何贡献

### 报告 Bug

1. 搜索现有 Issues，确保问题尚未被报告
2. 创建新 Issue：https://github.com/binbin1213/VideoTool/issues/new
3. 详细描述问题：
   - 问题描述
   - 重现步骤
   - 预期行为 vs 实际行为
   - 系统环境（操作系统、版本号）
   - 相关截图或日志

### 提出功能建议

访问 [Discussions](https://github.com/binbin1213/VideoTool/discussions) 在"Ideas"分类下创建讨论。

### 提交代码

#### 前置要求

- Node.js 18+
- pnpm 8+
- Git 基础知识
- TypeScript/React 开发经验

#### 开发流程

**1. Fork 仓库**

点击页面右上角的 "Fork" 按钮。

**2. 克隆到本地**

```bash
git clone https://github.com/YOUR_USERNAME/VideoTool.git
cd VideoTool
```

**3. 创建功能分支**

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构

**4. 安装依赖**

```bash
pnpm install
```

**5. 开发和测试**

```bash
pnpm dev          # 启动开发服务器
pnpm lint         # 代码检查
pnpm format       # 代码格式化
pnpm type-check   # 类型检查
```

**6. 提交代码**

```bash
git add .
git commit -m "feat: 添加新功能"
```

提交信息规范（Conventional Commits）：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式
- `refactor:` - 重构
- `test:` - 测试相关

**7. 推送到 Fork 仓库**

```bash
git push origin feature/your-feature-name
```

**8. 创建 Pull Request**

访问您的 Fork 仓库页面，点击 "Compare & pull request"。

---

## 代码规范

### TypeScript

- 使用 TypeScript 严格模式
- 所有函数和变量要有明确类型
- 避免使用 `any` 类型

### React

- 使用函数组件和 Hooks
- 组件命名使用 PascalCase
- Props 接口命名：`组件名 + Props`

### 样式

- 使用 SCSS 编写样式
- 遵循 BEM 命名规范
- 避免过深的嵌套（最多 3 层）

### 文件组织

```
src/
├── main/              # Electron 主进程
│   ├── index.ts
│   ├── ipc/          # IPC 处理器
│   ├── services/     # 业务服务
│   └── utils/        # 工具函数
├── renderer/         # React 渲染进程
│   ├── components/   # React 组件
│   ├── hooks/        # 自定义 Hooks
│   ├── styles/       # 样式文件
│   └── utils/        # 工具函数
└── shared/           # 共享代码
    ├── types/        # 类型定义
    └── presets/      # 预设配置
```

### 注释

```typescript
/**
 * 转换 SRT 字幕文件为 ASS 格式
 * @param srtPath SRT 文件路径
 * @param options 转换选项
 * @returns 转换后的 ASS 文件路径
 */
export async function convertSrtToAss(
  srtPath: string,
  options: ConvertOptions
): Promise<string> {
  // 实现代码...
}
```

---

## 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch
```

---

## 代码审查

所有 PR 都需要通过代码审查才能合并。审查关注：

- 代码质量和可读性
- 是否遵循项目规范
- 是否有适当的注释
- 是否通过所有测试
- 文档是否更新

---

## 发布流程

维护者会定期发布新版本：

1. 更新 `package.json` 版本号
2. 更新 CHANGELOG
3. 创建 Git Tag
4. GitHub Actions 自动构建和发布

详见 [发布流程](Release-Process) Wiki 页面。

---

## 沟通渠道

- **GitHub Issues** - Bug 报告和功能请求
- **GitHub Discussions** - 一般讨论和问答
- **Email** - piaozhitian@gmail.com

---

## 感谢

感谢所有为 VideoTool 做出贡献的开发者！

您的贡献让这个项目变得更好！

---

## 许可证

贡献的代码将采用 [MIT License](https://github.com/binbin1213/VideoTool/blob/main/LICENSE) 开源协议。

通过提交 PR，您同意您的代码在 MIT 协议下发布。
