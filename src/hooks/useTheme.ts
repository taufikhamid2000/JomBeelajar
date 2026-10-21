import { useEffect, useSyncExternalStore } from 'react';
import {
  getSystemTheme,
  initializeTheme,
  setTheme as setGlobalTheme,
} from '@/lib/theme';

type Theme = 'light' | 'dark';

// Fired on same-tab theme changes so every useTheme() consumer re-reads the
// stored value (the native `storage` event only fires in *other* tabs).
const THEME_CHANGE_EVENT = 'jb-theme-change';

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot(): Theme {
  try {
    const saved = window.localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage unavailable (private mode etc.) — fall back to system.
  }
  return getSystemTheme();
}

function getServerSnapshot(): Theme {
  return 'light';
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Persist the system preference on first visit (no state update needed —
    // the snapshot already resolves to the same value).
    initializeTheme();
  }, []);

  const setTheme = (newTheme: Theme) => {
    setGlobalTheme(newTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
