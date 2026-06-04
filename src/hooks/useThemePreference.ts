import { useEffect, useState } from 'react';
import {
  applyResolvedTheme,
  getStoredThemePreference,
  getSystemPrefersDark,
  resolveTheme,
  setStoredThemePreference,
  updateThemeColorMeta,
  type ThemePreference,
} from '../lib/theme';

const DARK_THEME_COLOR = '#17181C';
const LIGHT_THEME_COLOR = '#FFFFFF';

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  );
  const [prefersDark, setPrefersDark] = useState<boolean>(() => getSystemPrefersDark());

  const theme = resolveTheme(preference, prefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => {
        mediaQueryList.removeEventListener('change', handleChange);
      };
    }

    mediaQueryList.addListener(handleChange);
    return () => {
      mediaQueryList.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    applyResolvedTheme(theme);
    updateThemeColorMeta(theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }, [theme]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    setStoredThemePreference(next);
  };

  return { preference, theme, setPreference };
}
