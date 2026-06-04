import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { THEME_STORAGE_KEY } from '../lib/theme';
import { useThemePreference } from './useThemePreference';

const originalMatchMedia = window.matchMedia;

function mockMatchMedia(initialMatches: boolean, options?: { legacyOnly?: boolean }) {
  let matches = initialMatches;
  let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
  let legacyChangeListener: ((event: MediaQueryListEvent) => void) | null = null;

  const addEventListener = options?.legacyOnly
    ? undefined
    : vi.fn((eventName: string, listener: EventListenerOrEventListenerObject) => {
        if (eventName === 'change' && typeof listener === 'function') {
          changeListener = listener as (event: MediaQueryListEvent) => void;
        }
      });
  const removeEventListener = options?.legacyOnly
    ? undefined
    : vi.fn((eventName: string, listener: EventListenerOrEventListenerObject) => {
        if (eventName === 'change' && listener === changeListener) {
          changeListener = null;
        }
      });
  const addListener = vi.fn((listener: (event: MediaQueryListEvent) => void) => {
    legacyChangeListener = listener;
  });
  const removeListener = vi.fn((listener: (event: MediaQueryListEvent) => void) => {
    if (legacyChangeListener === listener) {
      legacyChangeListener = null;
    }
  });

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener,
    removeListener,
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      expect(query).toBe('(prefers-color-scheme: dark)');
      return mediaQueryList;
    }),
  });

  return {
    mediaQueryList,
    emitChange(nextMatches: boolean) {
      matches = nextMatches;
      changeListener?.({ matches: nextMatches } as MediaQueryListEvent);
      legacyChangeListener?.({ matches: nextMatches } as MediaQueryListEvent);
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.head.innerHTML = '<meta name="theme-color" content="#FFFFFF" />';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
});

test('defaults to system and applies the resolved dark theme from system preference', () => {
  mockMatchMedia(true);

  const { result } = renderHook(() => useThemePreference());

  expect(result.current.preference).toBe('system');
  expect(result.current.theme).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('persists an explicit dark preference and ignores later system theme changes while locked', () => {
  const media = mockMatchMedia(true);

  const { result } = renderHook(() => useThemePreference());

  act(() => {
    result.current.setPreference('dark');
  });

  expect(result.current.preference).toBe('dark');
  expect(result.current.theme).toBe('dark');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

  act(() => {
    media.emitChange(false);
  });

  expect(result.current.preference).toBe('dark');
  expect(result.current.theme).toBe('dark');
});

test('falls back to addListener and removeListener in older environments', () => {
  const media = mockMatchMedia(false, { legacyOnly: true });

  const { result, unmount } = renderHook(() => useThemePreference());

  act(() => {
    media.emitChange(true);
  });

  expect(result.current.theme).toBe('dark');
  expect(addListenerCalls(media.mediaQueryList)).toHaveBeenCalledOnce();

  unmount();

  expect(removeListenerCalls(media.mediaQueryList)).toHaveBeenCalledOnce();
});

function addListenerCalls(mediaQueryList: MediaQueryList) {
  return mediaQueryList.addListener as unknown as ReturnType<typeof vi.fn>;
}

function removeListenerCalls(mediaQueryList: MediaQueryList) {
  return mediaQueryList.removeListener as unknown as ReturnType<typeof vi.fn>;
}
