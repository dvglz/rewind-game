import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ResultsScreen } from './ResultsScreen';

const completedState = {
  puzzleId: 'p1',
  currentRound: 5,
  results: [
    { event: { text: 'R1', year: 2012 }, guessedYear: 2012, actualYear: 2012, diff: 0, score: 100 },
    { event: { text: 'R2', year: 2012 }, guessedYear: 2011, actualYear: 2012, diff: -1, score: 100 },
    { event: { text: 'R3', year: 2012 }, guessedYear: 2013, actualYear: 2012, diff: 1, score: 200 },
    { event: { text: 'R4', year: 2012 }, guessedYear: 2014, actualYear: 2012, diff: 2, score: 244 },
    { event: { text: 'R5', year: 2012 }, guessedYear: 2023, actualYear: 2012, diff: 11, score: 244 },
  ],
  totalScore: 888,
  completed: true,
  elapsedMs: 156000,
};

vi.mock('../engine/storage', () => ({
  loadGameState: () => completedState,
  loadStats: () => ({ currentStreak: 1, maxStreak: 1, gamesPlayed: 1, lastPlayedDate: null }),
}));

let mockAuthed = false;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuthed }),
}));

beforeEach(() => {
  mockAuthed = false;
});

test('logged-in users get friends CTA plus inline leaderboard link', () => {
  const onGroups = vi.fn();
  const onLeaderboard = vi.fn();

  mockAuthed = true;
  render(
    <ResultsScreen
      onHome={() => {}}
      onGroups={onGroups}
      onLeaderboard={onLeaderboard}
      onRequireAuth={() => {}}
    />
  );

  expect(screen.getByRole('button', { name: /See Friends' Scores/i })).not.toBeNull();
  expect(screen.getByRole('button', { name: /^Leaderboard$/i })).not.toBeNull();
  expect(screen.queryByRole('button', { name: /Create an Account/i })).toBeNull();
  expect(screen.getByText('2m 36s')).not.toBeNull();

  fireEvent.click(screen.getByRole('button', { name: /^Leaderboard$/i }));
  expect(onLeaderboard).toHaveBeenCalledTimes(1);
});

test('logged-out users get account CTA, benefits sentence, and sign-in link', () => {
  const onRequireAuth = vi.fn();

  mockAuthed = false;
  render(
    <ResultsScreen
      onHome={() => {}}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={onRequireAuth}
    />
  );

  expect(screen.getByRole('button', { name: /Create an Account/i })).not.toBeNull();
  expect(screen.getByText(/rank worldwide/i)).not.toBeNull();
  expect(screen.getByRole('button', { name: /^Sign in$/i })).not.toBeNull();
  expect(screen.queryByRole('button', { name: /See Friends' Scores/i })).toBeNull();
});
