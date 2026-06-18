import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem('fritzstore-theme');
  if (stored !== null) {
    return stored === 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Apply initial theme immediately to prevent flash
const initialDark = getInitialTheme();
applyTheme(initialDark);

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: initialDark,

  toggle: () => {
    set((state) => {
      const next = !state.isDark;
      localStorage.setItem('fritzstore-theme', next ? 'dark' : 'light');
      applyTheme(next);
      return { isDark: next };
    });
  },
}));
