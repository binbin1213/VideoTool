const path = require('path');
const fs = require('fs-extra');

const PLATFORM_KEEP = {
  win32: ['win32-ia32', 'win32-x64', 'win32-ia32-static', 'win32-x64-static'],
  darwin: ['darwin-x64', 'darwin-arm64'],
  linux: ['linux-ia32', 'linux-x64', 'linux-arm64', 'linux-arm'],
};

async function pruneFFmpegInstaller(appOutDir, platform) {
  const keepList = PLATFORM_KEEP[platform] || [];
  const ffmpegBase = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'node_modules', '@ffmpeg-installer');

  if (!(await fs.pathExists(ffmpegBase))) {
    return;
  }

  const entries = await fs.readdir(ffmpegBase);

  for (const entry of entries) {
    const fullPath = path.join(ffmpegBase, entry);
    const keep = keepList.some((pattern) => entry.startsWith(pattern));

    if (!keep) {
      try {
        await fs.remove(fullPath);
      } catch (error) {
        console.warn('[afterPack] Failed to remove', fullPath, error);
      }
    }
  }
}

module.exports = async function afterPack(context) {
  const platform = context.electronPlatformName;
  await pruneFFmpegInstaller(context.appOutDir, platform);
};

