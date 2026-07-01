import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

vi.mock('../lib/analytics', () => ({ track: vi.fn() }));
import { track } from '../lib/analytics';
import { RulesSheet } from './RulesSheet';

test('renders the rules copy', () => {
  render(<RulesSheet onClose={() => {}} />);
  expect(
    screen.getByText('NBA, NFL, MLB, college, and more. Later rounds are worth more. Fastest time breaks ties.')
  ).toBeInTheDocument();
});

test('fires an in_game rules_view event on mount', () => {
  render(<RulesSheet onClose={() => {}} />);
  expect(track).toHaveBeenCalledWith('rules_view', { entry_point: 'in_game' });
});

test('calls onClose on close button, backdrop, and Escape', () => {
  const onClose = vi.fn();
  const { rerender } = render(<RulesSheet onClose={onClose} />);

  fireEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(onClose).toHaveBeenCalledTimes(1);

  onClose.mockClear();
  rerender(<RulesSheet onClose={onClose} />);
  fireEvent.click(screen.getByTestId('rules-sheet-backdrop'));
  expect(onClose).toHaveBeenCalledTimes(1);

  onClose.mockClear();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});
