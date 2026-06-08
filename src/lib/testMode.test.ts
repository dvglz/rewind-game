import { expect, test } from 'vitest';
import { hidesCompletedGameLock } from './testMode';

test('keeps the completed-game lock enabled by default', () => {
  expect(hidesCompletedGameLock('')).toBe(false);
  expect(hidesCompletedGameLock('?foo=bar')).toBe(false);
});

test('disables the completed-game lock only when test=1 is present', () => {
  expect(hidesCompletedGameLock('?test=1')).toBe(true);
  expect(hidesCompletedGameLock('?mode=results&test=1')).toBe(true);
  expect(hidesCompletedGameLock('?test=0')).toBe(false);
});
