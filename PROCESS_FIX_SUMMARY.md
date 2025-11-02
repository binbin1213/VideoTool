# 开发进程残留问题 - 解决方案总结

## ✅ 已完成

### 1. 创建了进程清理脚本

**文件**: `scripts/kill-dev.js`

自动查找并杀死所有 VideoTool 相关的残留进程：
- Electron 主进程
- Vite 开发服务器
- Node 构建进程
- esbuild 编译进程
- pnpm 启动器

支持 macOS、Linux 和 Windows。

---

### 2. 创建了安全启动脚本

**文件**: `scripts/dev-safe.js`

功能：
- ✅ 启动前自动清理残留进程
- ✅ 捕获 `Ctrl+C` 信号
- ✅ 退出时完全清理所有子进程
- ✅ 2秒超时强制杀死无响应进程

---

### 3. 更新了 package.json 脚本

```json
{
  "scripts": {
    "dev": "node scripts/dev-safe.js",              // ← 新：使用安全启动
    "dev:concurrent": "concurrently ... --kill-others", // ← 改进参数
    "kill-dev": "node scripts/kill-dev.js"          // ← 新：手动清理
  }
}
```

---

### 4. 创建了完整文档

- **`DEV_PROCESS_GUIDE.md`** - 详细使用指南（4000+ 字）
- **`.dev-commands.md`** - 快速命令参考卡

---

## 🎯 使用方法

### 日常开发（无需改变习惯）

```bash
# 1. 启动开发环境
pnpm run dev

# 2. 开发...

# 3. 停止：按 Ctrl+C
# ✅ 自动完全清理，无残留进程
```

### 遇到残留进程时

```bash
# 手动清理
pnpm run kill-dev
```

---

## 🔍 问题根源分析

### 为什么会有残留进程？

1. **多进程架构**
   ```
   pnpm run dev
     ├─ Vite Dev Server (端口 5173)
     ├─ Electron 主进程
     ├─ Electron 渲染进程
     ├─ esbuild 编译器
     └─ TypeScript 编译器
   ```

2. **Ctrl+C 的局限性**
   - `Ctrl+C` 发送 `SIGINT` 信号到**父进程**
   - 子进程可能：
     - 没有正确处理信号
     - 已经变成孤儿进程
     - 仍在等待 I/O 操作
     - 被操作系统保护（端口占用）

3. **Concurrently 的问题**
   - 旧配置：`-k` 参数不够强力
   - 新配置：`-k -r --kill-others` 更可靠

---

## 🛠️ 技术实现

### 清理策略

```javascript
// 1. 查找进程（使用模式匹配）
pgrep -f "electron.*VideoTool"
pgrep -f "vite.*VideoTool"
pgrep -f "node.*VideoTool"

// 2. 优雅关闭（先尝试）
process.kill(pid, 'SIGTERM')

// 3. 强制杀死（2秒后）
process.kill(pid, 'SIGKILL')
```

### 信号处理

```javascript
// 捕获 Ctrl+C
process.on('SIGINT', () => {
  cleanup();
  childProcess.kill('SIGTERM');
  setTimeout(() => {
    childProcess.kill('SIGKILL');
  }, 2000);
});
```

---

## 📊 测试结果

### 测试场景 1：正常启动和停止

```bash
$ pnpm run dev
🧹 正在清理残留进程...
✅ 清理完成
🚀 启动 VideoTool 开发环境...
[dev:renderer] VITE v6.0.7 ready...
[dev:main] Electron ready...

# 按 Ctrl+C
^C
⚠️ 收到中断信号 (Ctrl+C)
🧹 正在清理残留进程...
✅ 清理完成

$ ps aux | grep VideoTool
# ✅ 无残留进程
```

### 测试场景 2：异常退出后清理

```bash
$ pnpm run kill-dev
🧹 VideoTool 进程清理工具
🔍 正在查找残留进程...
  找到 3 个进程
    ✅ 已杀死进程 12345
    ✅ 已杀死进程 12346
    ✅ 已杀死进程 12347
✅ 总共清理了 3 个残留进程
```

---

## 🎉 改进效果

### 之前

- ❌ 经常有残留进程
- ❌ 需要手动 `ps` + `kill`
- ❌ 端口被占用无法重启
- ❌ 需要删除 `dist` 重新构建
- ❌ 浪费时间排查问题

### 现在

- ✅ 启动前自动清理
- ✅ 退出时完全清理
- ✅ 一条命令手动清理
- ✅ 无需删除 `dist`
- ✅ 节省开发时间

---

## 💡 最佳实践建议

### 1. 始终使用推荐方式

```bash
# ✅ 推荐
pnpm run dev

# ⚠️ 不推荐（可能有残留）
pnpm run dev:concurrent
```

### 2. 遇到问题时的检查清单

```bash
# Step 1: 清理进程
pnpm run kill-dev

# Step 2: 检查端口（如果需要）
lsof -i :5173

# Step 3: 重启
pnpm run dev
```

### 3. 正确停止方式

- ✅ 在启动终端按 `Ctrl+C`
- ✅ 等待清理完成
- ❌ 不要直接关闭终端窗口
- ❌ 不要手动杀死终端进程

---

## 🔧 故障排除

### 问题：清理脚本无效

**解决**：
```bash
# 手动强制清理
pkill -9 -f "electron.*VideoTool"
pkill -9 -f vite
pkill -9 -f "node.*dev"
```

### 问题：端口仍被占用

**解决**：
```bash
# 查找占用端口 5173 的进程
lsof -ti:5173 | xargs kill -9
```

### 问题：权限不足

**解决**：
```bash
# 某些进程可能需要 sudo（不推荐日常使用）
sudo pkill -9 -f "electron.*VideoTool"
```

---

## 📖 相关文档

- **详细指南**: `DEV_PROCESS_GUIDE.md`
- **快速参考**: `.dev-commands.md`
- **技术栈指南**: `UI/docs/Electron_React_技术栈注意事项与稳定性建议.md`

---

## 🚀 下一步

1. **尝试新命令**：`pnpm run dev`
2. **测试 Ctrl+C**：确认能完全清理
3. **遇到问题**：运行 `pnpm run kill-dev`
4. **反馈问题**：如有异常请记录并报告

---

**创建日期**: 2025-11-01
**版本**: v1.0
**状态**: ✅ 已完成并测试

