import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('useHapticsEnabled', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('defaults to enabled when storage is empty', async () => {
    const { useHapticsEnabled, getStoredHapticsEnabled } = await import('./useHapticsEnabled');

    expect(getStoredHapticsEnabled()).toBe(true);

    const { result } = renderHook(() => useHapticsEnabled());

    expect(result.current.enabled).toBe(true);
  });

  it('reads a stored disabled value', async () => {
    localStorage.setItem('rewind_haptics_enabled', 'false');

    const { useHapticsEnabled, getStoredHapticsEnabled } = await import('./useHapticsEnabled');

    expect(getStoredHapticsEnabled()).toBe(false);

    const { result } = renderHook(() => useHapticsEnabled());

    expect(result.current.enabled).toBe(false);
  });

  it('persists changes when toggled through the hook', async () => {
    const { useHapticsEnabled } = await import('./useHapticsEnabled');
    const { result } = renderHook(() => useHapticsEnabled());

    act(() => {
      result.current.setEnabled(false);
    });

    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem('rewind_haptics_enabled')).toBe('false');
  });

  it('keeps haptics disabled in memory when storage writes fail', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    const vibrateSpy = vi.fn();

    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vibrateSpy,
    });

    const { useHapticsEnabled } = await import('./useHapticsEnabled');
    const { vibrateHeavy } = await import('../lib/haptics');
    const { result } = renderHook(() => useHapticsEnabled());

    act(() => {
      result.current.setEnabled(false);
    });

    vibrateHeavy();

    expect(result.current.enabled).toBe(false);
    expect(setItemSpy).toHaveBeenCalledWith('rewind_haptics_enabled', 'false');
    expect(vibrateSpy).not.toHaveBeenCalled();
  });
});

describe('haptics guards', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('skips navigator vibration when haptics are disabled', async () => {
    localStorage.setItem('rewind_haptics_enabled', 'false');

    const vibrateSpy = vi.fn();

    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vibrateSpy,
    });

    const { vibrateHeavy } = await import('../lib/haptics');

    vibrateHeavy();

    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it('still uses navigator vibration when enabled and no web-haptics trigger exists', async () => {
    const vibrateSpy = vi.fn();

    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vibrateSpy,
    });

    const { vibrateConfirm } = await import('../lib/haptics');

    vibrateConfirm();

    expect(vibrateSpy).toHaveBeenCalledWith([30, 40, 45]);
  });
});
