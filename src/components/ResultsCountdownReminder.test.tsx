import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ResultsCountdownReminder } from './ResultsCountdownReminder';

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));

vi.mock('../lib/analytics', () => ({
  track: trackMock,
  trackPageView: vi.fn(),
  initAnalytics: vi.fn(),
  setUser: vi.fn(),
  clearUser: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  trackMock.mockReset();
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

test('shows the countdown on mount with no promo link yet', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));

  render(<ResultsCountdownReminder showNotifyCta onNotify={vi.fn()} />);

  expect(screen.getByText('New Game in 23:00:00')).toBeTruthy();
  expect(screen.queryByRole('link', { name: /Play 18 Names/ })).toBeNull();
});

test('rolls to the 18 Names promo after the swap delay', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));

  render(<ResultsCountdownReminder showNotifyCta onNotify={vi.fn()} />);

  expect(screen.queryByRole('link', { name: /Play 18 Names/ })).toBeNull();

  act(() => {
    vi.advanceTimersByTime(3000);
  });

  const link = screen.getByRole('link', { name: /Play 18 Names/ });
  expect(link.getAttribute('href')).toBe(
    'https://clutchpoints-18names-test.4taps.me/?lab=2099-12-31&practice=1'
  );
  expect(link.getAttribute('target')).toBe('_blank');
  expect(link.getAttribute('rel')).toContain('noopener');
});

test('tracks a results-surface click on the rolled-in promo', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));

  render(<ResultsCountdownReminder showNotifyCta onNotify={vi.fn()} />);

  act(() => {
    vi.advanceTimersByTime(3000);
  });

  const link = screen.getByRole('link', { name: /Play 18 Names/ });
  link.addEventListener('click', (e) => e.preventDefault());
  fireEvent.click(link);
  expect(trackMock).toHaveBeenCalledWith('promo_18names_click', { surface: 'results' });
});
