import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearHomeIntroSeen, hasSeenHomeIntro, markHomeIntroSeen } from './homeIntro';

describe('home intro persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts unseen by default', () => {
    expect(hasSeenHomeIntro()).toBe(false);
  });

  it('marks the intro as seen', () => {
    markHomeIntroSeen();

    expect(hasSeenHomeIntro()).toBe(true);
  });

  it('clears the intro flag', () => {
    markHomeIntroSeen();
    clearHomeIntroSeen();

    expect(hasSeenHomeIntro()).toBe(false);
  });

  it('falls back safely when localStorage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(hasSeenHomeIntro()).toBe(false);
  });

  it('does not throw when localStorage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => markHomeIntroSeen()).not.toThrow();
    expect(() => clearHomeIntroSeen()).not.toThrow();
  });
});
