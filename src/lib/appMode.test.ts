import { beforeEach, describe, it, expect, vi } from 'vitest';
import { isAppMode, ensureAppModeParam } from './appMode';

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('isAppMode', () => {
  it('returns true and stores the flag when ?from=app is in the search', () => {
    expect(isAppMode('?from=app')).toBe(true);
    expect(sessionStorage.getItem('rewind_from_app')).toBe('1');
  });

  it('returns true from the stored flag even when the param is gone', () => {
    sessionStorage.setItem('rewind_from_app', '1');
    expect(isAppMode('')).toBe(true);
  });

  it('returns false when neither the param nor the flag is present', () => {
    expect(isAppMode('?foo=bar')).toBe(false);
  });

  it('falls back to the URL check when sessionStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(isAppMode('?from=app')).toBe(true);
    expect(isAppMode('?foo=bar')).toBe(false);
  });
});

describe('ensureAppModeParam', () => {
  it('appends from=app to the URL when app mode is active and the param is missing', () => {
    sessionStorage.setItem('rewind_from_app', '1');
    window.history.replaceState(null, '', '/?mode=groups');
    ensureAppModeParam();
    expect(new URL(window.location.href).searchParams.get('from')).toBe('app');
    expect(new URL(window.location.href).searchParams.get('mode')).toBe('groups');
  });

  it('does nothing when not in app mode', () => {
    window.history.replaceState(null, '', '/?mode=groups');
    ensureAppModeParam();
    expect(new URL(window.location.href).searchParams.get('from')).toBeNull();
  });

  it('does nothing when the param is already present', () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    window.history.replaceState(null, '', '/?from=app');
    replaceSpy.mockClear();
    ensureAppModeParam();
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
