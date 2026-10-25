import { logger } from './logger';

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

// Get system color scheme preference
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// Initialize theme from localStorage or system preference
export function initializeTheme(): 'light' | 'dark' {
  // Check localStorage first
  const savedTheme = safeStorage.getItem('theme') as 'light' | 'dark' | null;
  if (savedTheme) {
    return savedTheme;
  }

  // No saved choice: default to the light look ('dark' in the legacy
  // inverted class mechanism) regardless of OS preference.
  safeStorage.setItem('theme', 'dark');
  return 'dark';
}

// Apply theme to document
function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}

// Set theme in both localStorage and HTML class
export function setTheme(theme: 'light' | 'dark'): void {
  safeStorage.setItem('theme', theme);
  applyTheme(theme);
}
