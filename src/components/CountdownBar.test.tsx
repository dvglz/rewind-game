import { render, screen } from '@testing-library/react';
import { expect, test, vi, afterEach } from 'vitest';
import { CountdownBar } from './CountdownBar';

afterEach(() => vi.useRealTimers());

test('renders the puzzle number and a HH:MM:SS countdown', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z')); // 1h past Pacific midnight → 23h left
  render(<CountdownBar puzzleNumber={6} />);
  expect(screen.getByText(/Rewind #6/)).not.toBeNull();
  expect(screen.getByText(/23:00:0/)).not.toBeNull();
});
