import { logger } from './logger';

export const THEME_KEY = 'jb-theme';

// Safe localStorage wrapper to handle SSR
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      logger.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      logger.error('Storage setItem error:', error);
    }
  },
};

// Saved choice, else light (never follows the OS).
export function initializeTheme(): 'light' | 'dark' {
  return safeStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

// <html class="dark"> is the dark look; no class is the light look.
function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Set theme in both localStorage and HTML class
export function setTheme(theme: 'light' | 'dark'): void {
  safeStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}
