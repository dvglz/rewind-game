import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { JoinRewindCard } from './JoinRewindCard';

test('renders the unlock benefits and fires onSignIn from the Sign In button', () => {
  const onSignIn = vi.fn();
  render(<JoinRewindCard onSignIn={onSignIn} />);

  expect(screen.getByText(/Sign in to unlock/i)).not.toBeNull();
  expect(screen.getByText('Save scores and ranks')).not.toBeNull();
  expect(screen.getByText('Play in private groups')).not.toBeNull();
  expect(screen.getByText('Access the full archive')).not.toBeNull();
  expect(screen.getByText('Get daily reminders. No spam.')).not.toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  expect(onSignIn).toHaveBeenCalledTimes(1);
});
