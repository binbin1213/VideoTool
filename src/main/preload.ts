import { contextBridge, ipcRenderer } from 'electron';

// 仅暴露受限、白名单的 IPC 能力到渲染进程
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (event: unknown, ...args: any[]) => void) => {
      ipcRenderer.on(channel, listener as any);
      return () => ipcRenderer.removeListener(channel, listener as any);
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, listener as any);
    },
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  },
});


