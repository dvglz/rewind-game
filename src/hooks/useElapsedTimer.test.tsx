import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useElapsedTimer } from './useElapsedTimer';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-01T00:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

test('returns elapsed ms from startedAt and advances on tick', () => {
  const startedAt = Date.now();
  const { result } = renderHook(() => useElapsedTimer(startedAt, false));
  expect(result.current).toBe(0);

  act(() => {
    vi.setSystemTime(startedAt + 3000);
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(4000);
});

test('resyncs to wall clock after a large jump (backgrounded tab)', () => {
  const startedAt = Date.now();
  const { result } = renderHook(() => useElapsedTimer(startedAt, false));

  // Simulate the tab being backgrounded: real time jumps 90s but only one tick fires.
  act(() => {
    vi.setSystemTime(startedAt + 90_000);
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(91_000);
});

test('freezes at the final value once complete', () => {
  const startedAt = Date.now();
  const { result, rerender } = renderHook(
    ({ complete }) => useElapsedTimer(startedAt, complete),
    { initialProps: { complete: false } }
  );

  act(() => {
    vi.setSystemTime(startedAt + 5000);
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(6000);

  act(() => {
    vi.setSystemTime(startedAt + 5200);
    rerender({ complete: true });
  });
  const frozen = result.current;
  expect(frozen).toBe(5200);

  // Further clock movement must not change a completed timer.
  act(() => {
    vi.setSystemTime(startedAt + 20_000);
    vi.advanceTimersByTime(5000);
  });
  expect(result.current).toBe(frozen);
});
