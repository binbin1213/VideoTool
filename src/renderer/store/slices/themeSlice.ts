import { StateCreator } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeSlice {
  theme: Theme;
  effectiveTheme: 'light' | 'dark'; // 实际应用的主题（system 会解析为 light 或 dark）
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', theme);
  // 同时更新 localStorage 以便下次启动恢复
  localStorage.setItem('vt-theme', theme);
};

const getSystemTheme = (): 'light' | 'dark' => {
  // 尝试从 Electron 获取系统主题
  const electron = (window as any).electron;
  if (electron?.ipcRenderer) {
    try {
      // 这个会在 preload 中暴露
      return electron.nativeTheme?.shouldUseDarkColors ? 'dark' : 'light';
    } catch (error) {
      console.warn('无法获取系统主题，使用默认浅色主题', error);
    }
  }
  
  // 回退到 CSS media query
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const createThemeSlice: StateCreator<ThemeSlice> = (set, get) => ({
  theme: 'system',
  effectiveTheme: 'light',

  setTheme: (theme: Theme) => {
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(effectiveTheme);
    
    set({ 
      theme, 
      effectiveTheme 
    });
    
    // 保存用户偏好
    localStorage.setItem('vt-theme-preference', theme);
  },

  initTheme: () => {
    // 从 localStorage 读取用户偏好
    const savedTheme = localStorage.getItem('vt-theme-preference') as Theme;
    const theme = savedTheme || 'system';
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    
    applyTheme(effectiveTheme);
    set({ theme, effectiveTheme });

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const currentTheme = get().theme;
      if (currentTheme === 'system') {
        const newEffectiveTheme = e.matches ? 'dark' : 'light';
        applyTheme(newEffectiveTheme);
        set({ effectiveTheme: newEffectiveTheme });
      }
    });
  },
});

