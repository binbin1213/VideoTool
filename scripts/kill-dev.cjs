#!/usr/bin/env node

/**
 * 清理 VideoTool 开发环境的残留进程
 * 使用: node scripts/kill-dev.js
 * 或: pnpm run kill-dev
 */

const { execSync } = require('child_process');
const os = require('os');

function killProcesses() {
  const platform = os.platform();
  
  try {
    if (platform === 'darwin' || platform === 'linux') {
      // macOS / Linux
      console.log('🔍 正在查找残留进程...');
      
      const processPatterns = [
        'electron.*VideoTool',
        'vite.*VideoTool',
        'node.*VideoTool',
        'esbuild.*VideoTool',
        'pnpm.*dev'
      ];
      
      let killedCount = 0;
      
      processPatterns.forEach(pattern => {
        try {
          // 使用 pgrep 查找进程
          const pids = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8' })
            .trim()
            .split('\n')
            .filter(pid => pid);
          
          if (pids.length > 0) {
            console.log(`  找到 ${pids.length} 个 "${pattern}" 进程`);
            pids.forEach(pid => {
              try {
                process.kill(parseInt(pid), 'SIGKILL');
                killedCount++;
                console.log(`    ✅ 已杀死进程 ${pid}`);
              } catch (err) {
                // 进程可能已经不存在了
              }
            });
          }
        } catch (err) {
          // pgrep 未找到匹配进程时会返回错误，这是正常的
        }
      });
      
      if (killedCount === 0) {
        console.log('✨ 没有找到残留进程');
      } else {
        console.log(`\n✅ 总共清理了 ${killedCount} 个残留进程`);
      }
      
    } else if (platform === 'win32') {
      // Windows
      console.log('🔍 正在查找残留进程...');
      
      const tasks = [
        'electron.exe',
        'node.exe'
      ];
      
      let killedCount = 0;
      
      tasks.forEach(task => {
        try {
          execSync(`taskkill /F /IM ${task}`, { encoding: 'utf8', stdio: 'pipe' });
          killedCount++;
          console.log(`  ✅ 已杀死 ${task}`);
        } catch (err) {
          // 任务不存在，忽略
        }
      });
      
      if (killedCount === 0) {
        console.log('✨ 没有找到残留进程');
      } else {
        console.log(`\n✅ 总共清理了 ${killedCount} 个残留进程`);
      }
    }
    
  } catch (error) {
    console.error('❌ 清理进程时出错:', error.message);
    process.exit(1);
  }
}

console.log('🧹 VideoTool 进程清理工具');
console.log('================================\n');

killProcesses();

console.log('\n💡 提示: 如果仍有问题，请手动检查:');
console.log('  macOS/Linux: ps aux | grep -E "electron|vite|node" | grep VideoTool');
console.log('  Windows: tasklist | findstr "electron node"');
console.log('================================\n');

