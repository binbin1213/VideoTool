/**
 * Electron API 类型定义
 */
export interface ElectronAPI {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => Promise<any>;
    on: (channel: string, listener: (event: unknown, ...args: any[]) => void) => () => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

