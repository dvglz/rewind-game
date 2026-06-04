import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  getSystemPrefersDark,
  getStoredThemePreference,
  resolveTheme,
  setStoredThemePreference,
  updateThemeColorMeta,
} from './theme';

const originalMatchMedia = window.matchMedia;
const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');

function restoreDocument(): void {
  if (originalDocumentDescriptor) {
    Object.defineProperty(globalThis, 'document', originalDocumentDescriptor);
  }
}

beforeEach(() => {
  restoreDocument();
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = '';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
});

afterEach(() => {
  restoreDocument();
  vi.restoreAllMocks();
});

test('ships a dark-safe theme-color baseline and dark token overrides', () => {
  const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

  expect(indexHtml).toContain('<meta name="theme-color" content="#17181C" />');
  expect(tokensCss).toMatch(/\[data-theme=["']dark["']\]\s*\{/);
  expect(tokensCss).toContain('--color-bg: #17181C;');
});

test('resolves explicit light preference to light', () => {
  expect(resolveTheme('light', true)).toBe('light');
});

test('resolves explicit dark preference to dark', () => {
  expect(resolveTheme('dark', false)).toBe('dark');
});

test('resolves system preference using a dark system setting', () => {
  expect(resolveTheme('system', true)).toBe('dark');
});

test('resolves system preference using a light system setting', () => {
  expect(resolveTheme('system', false)).toBe('light');
});

test('falls back to the default theme preference when nothing is stored', () => {
  expect(getStoredThemePreference()).toBe(DEFAULT_THEME_PREFERENCE);
});

test('falls back to the default theme preference when stored data is invalid', () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'sepia');

  expect(getStoredThemePreference()).toBe(DEFAULT_THEME_PREFERENCE);
});

test('falls back to the default theme preference when storage access throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('storage blocked');
  });

  expect(getStoredThemePreference()).toBe(DEFAULT_THEME_PREFERENCE);
});

test('stores a dark theme preference in localStorage', () => {
  setStoredThemePreference('dark');

  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
});

test('does not throw when storing a theme preference fails', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('storage blocked');
  });

  expect(() => setStoredThemePreference('dark')).not.toThrow();
});

test('reads a dark system color-scheme preference from matchMedia', () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({ matches: true }),
  });

  expect(getSystemPrefersDark()).toBe(true);
});

test('returns false when matchMedia is unavailable', () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: undefined,
  });

  expect(getSystemPrefersDark()).toBe(false);
});

test('applies the resolved theme to the document root dataset', () => {
  applyResolvedTheme('dark');

  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('does not throw when applying a resolved theme without document access', () => {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    get() {
      throw new Error('document unavailable');
    },
  });

  expect(() => applyResolvedTheme('dark')).not.toThrow();
});

test('updates the theme-color meta tag content', () => {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.appendChild(meta);

  updateThemeColorMeta('#17181C');

  expect(meta.content).toBe('#17181C');
});

test('does not create a theme-color meta tag when one is missing', () => {
  expect(() => updateThemeColorMeta('#17181C')).not.toThrow();

  expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
});

test('does not throw when updating the theme-color meta tag without document access', () => {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    get() {
      throw new Error('document unavailable');
    },
  });

  expect(() => updateThemeColorMeta('#17181C')).not.toThrow();
});
