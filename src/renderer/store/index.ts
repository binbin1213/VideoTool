import { create } from 'zustand';
import { ThemeSlice, createThemeSlice } from './slices/themeSlice';

// 组合所有 slice
type StoreState = ThemeSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createThemeSlice(...a),
}));

// 便捷的 hooks - 分开选择避免无限循环
export const useTheme = () => ({
  theme: useStore((state) => state.theme),
  effectiveTheme: useStore((state) => state.effectiveTheme),
  setTheme: useStore((state) => state.setTheme),
  initTheme: useStore((state) => state.initTheme),
});

