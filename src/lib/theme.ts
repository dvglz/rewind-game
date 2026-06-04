export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'rewind_theme_preference';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }

  return preference;
}

export function getStoredThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function setStoredThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage failures so theme selection remains non-blocking.
  }
}

export function getSystemPrefersDark(): boolean {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch {
    return false;
  }
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  try {
    const root = document.documentElement;
    if (!root) return;
    root.dataset.theme = theme;
  } catch {
    // Ignore DOM access failures in non-browser or restricted contexts.
  }
}

export function updateThemeColorMeta(color: string): void {
  try {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    meta.content = color;
  } catch {
    // Ignore DOM access failures in non-browser or restricted contexts.
  }
}
