#!/usr/bin/env node

/**
 * 安全启动开发环境
 * 1. 清理残留进程
 * 2. 启动开发服务器
 * 3. 监听退出信号，确保完全清理
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 清理残留进程
function cleanup() {
  log('yellow', '\n🧹 正在清理残留进程...');
  
  try {
    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      // macOS / Linux
      const patterns = [
        'electron.*VideoTool',
        'vite.*5173',
        'node.*dev:renderer',
        'esbuild.*VideoTool'
      ];
      
      patterns.forEach(pattern => {
        try {
          execSync(`pkill -9 -f "${pattern}"`, { stdio: 'ignore' });
        } catch (err) {
          // 忽略错误（进程可能不存在）
        }
      });
    }
    
    log('green', '✅ 清理完成\n');
  } catch (error) {
    log('red', `⚠️ 清理时出现错误: ${error.message}\n`);
  }
}

// 编译主进程
function buildMain() {
  log('blue', '📦 编译主进程代码...');
  
  try {
    execSync('pnpm run build:main', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('green', '✅ 主进程编译完成\n');
    return true;
  } catch (error) {
    log('red', '❌ 主进程编译失败\n');
    return false;
  }
}

// 启动开发服务器
function startDev() {
  log('blue', '🚀 启动 VideoTool 开发环境...\n');
  
  const dev = spawn('pnpm', ['run', 'dev:concurrent'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });
  
  // 处理 Ctrl+C
  process.on('SIGINT', () => {
    log('yellow', '\n\n⚠️ 收到中断信号 (Ctrl+C)');
    cleanup();
    dev.kill('SIGTERM');
    setTimeout(() => {
      dev.kill('SIGKILL');
      process.exit(0);
    }, 2000);
  });
  
  // 处理进程退出
  dev.on('exit', (code) => {
    log('yellow', `\n开发服务器已退出 (代码: ${code})`);
    cleanup();
    process.exit(code || 0);
  });
  
  // 处理异常
  process.on('uncaughtException', (error) => {
    log('red', `\n❌ 未捕获的异常: ${error.message}`);
    cleanup();
    dev.kill('SIGKILL');
    process.exit(1);
  });
}

// 主流程
console.log('================================');
log('blue', '  VideoTool 开发环境启动器');
console.log('================================\n');

// 先清理一次
cleanup();

// 编译主进程
const buildSuccess = buildMain();

if (!buildSuccess) {
  log('red', '❌ 无法启动开发环境，请检查主进程代码\n');
  process.exit(1);
}

// 等待一下再启动
setTimeout(() => {
  startDev();
}, 500);

