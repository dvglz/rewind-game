import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ResultsCountdownReminder } from './ResultsCountdownReminder';

afterEach(() => {
  vi.useRealTimers();
});

test('shows countdown and Notify Me for logged-out web users', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));
  const onNotify = vi.fn();

  render(<ResultsCountdownReminder showNotifyCta onNotify={onNotify} />);

  expect(screen.getByText('New Game in 23:00:00')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Notify Me' }));
  expect(onNotify).toHaveBeenCalledTimes(1);
});

test('omits Notify Me for authenticated users and app mode', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));

  render(<ResultsCountdownReminder showNotifyCta={false} onNotify={vi.fn()} />);

  expect(screen.getByText('New Game in 23:00:00')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Notify Me' })).toBeNull();
});

test('updates the countdown every second', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));

  render(<ResultsCountdownReminder showNotifyCta onNotify={vi.fn()} />);

  expect(screen.getByText('New Game in 23:00:00')).toBeTruthy();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByText('New Game in 22:59:59')).toBeTruthy();
});
