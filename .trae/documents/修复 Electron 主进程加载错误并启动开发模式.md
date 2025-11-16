## 问题
- 报错：`exports is not defined in ES module scope`
- 原因：`package.json` 设置了 `type: "module"`，导致 `.js` 被当作 ESM；而主进程编译产物是 CommonJS（包含 `exports/require`），被错误解析

## 方案
- 保持主进程为 CommonJS，改 Electron 入口为 `.cjs`
- 修改 `package.json`：
  - `main: dist/main/main/index.cjs`
  - `build:main` 在 `tsc` 后重命名 `index.js` → `index.cjs`
- 允许依赖安装脚本并重新安装 Electron 二进制，使用镜像提升成功率

## 步骤
1) 修改 `package.json` 两处：入口和 `build:main` 重命名
2) 执行：
- `pnpm config set ignore-scripts false`
- `export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`
- `pnpm install --force`
3) 验证：
- `npx electron --version`
4) 启动开发：
- `pnpm run build:main`，`npm run dev`

## 预期
- Electron 主进程以 CommonJS 正常加载，窗口弹出；前端继续使用 Vite 开发服务器