import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ResultsScreen } from './ResultsScreen';

const { fetchMyScore, supersededRef, gradeSeenRef, markGradeSeen } = vi.hoisted(() => ({
  fetchMyScore: vi.fn(),
  supersededRef: { value: false },
  gradeSeenRef: { value: false },
  markGradeSeen: vi.fn(),
}));

let currentState: typeof completedState | null;
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
  loadGameState: () => currentState,
  loadStats: () => ({ currentStreak: 1, maxStreak: 1, gamesPlayed: 1, lastPlayedDate: null }),
  hasSeenGrade: () => gradeSeenRef.value,
  markGradeSeen,
}));

vi.mock('../lib/api', () => ({
  fetchMyScore,
  isScoreSuperseded: () => supersededRef.value,
}));

let mockAuthed = false;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuthed }),
}));

beforeEach(() => {
  currentState = completedState;
  mockAuthed = false;
  supersededRef.value = false;
  gradeSeenRef.value = false;
  markGradeSeen.mockReset();
  fetchMyScore.mockReset();
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

test('wordmark navigates home via onHome', () => {
  const onHome = vi.fn();

  render(
    <ResultsScreen
      onHome={onHome}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={() => {}}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'REWIND' }));

  expect(onHome).toHaveBeenCalledTimes(1);
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

test('falls back to backend score when local state is missing', async () => {
  currentState = null;
  mockAuthed = true;
  fetchMyScore.mockResolvedValueOnce({
    scores: 777,
    created_at: '2026-06-12T00:00:00Z',
    metadata: {
      total_time: 83,
      puzzle_number: 1,
      sport: 'american',
      rounds: [
        { event_text: 'Remote R1', guessed_year: 2010, actual_year: 2012, diff: -2, score: 82, tier: 'great' },
        { event_text: 'Remote R2', guessed_year: 2014, actual_year: 2012, diff: 2, score: 82, tier: 'great' },
      ],
    },
  });

  render(
    <ResultsScreen
      onHome={() => {}}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={() => {}}
    />
  );

  expect(await screen.findByText('777')).not.toBeNull();
  expect(await screen.findByText('1m 23s')).not.toBeNull();
});

test('does not keep the previous user remote score after sign out and sign in as another user', async () => {
  currentState = null;
  const onHome = vi.fn();
  mockAuthed = true;
  fetchMyScore
    .mockResolvedValueOnce({
      scores: 777,
      created_at: '2026-06-12T00:00:00Z',
      metadata: {
        total_time: 83,
        puzzle_number: 1,
        sport: 'american',
        rounds: [
          { event_text: 'Remote R1', guessed_year: 2010, actual_year: 2012, diff: -2, score: 82, tier: 'great' },
        ],
      },
    })
    .mockResolvedValueOnce(null);

  const { rerender } = render(
    <ResultsScreen
      onHome={onHome}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={() => {}}
    />
  );

  expect(await screen.findByText('777')).not.toBeNull();

  mockAuthed = false;
  rerender(
    <ResultsScreen
      onHome={onHome}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={() => {}}
    />
  );

  mockAuthed = true;
  rerender(
    <ResultsScreen
      onHome={onHome}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={() => {}}
    />
  );

  expect(onHome).toHaveBeenCalled();
  expect(screen.queryByText('777')).toBeNull();
});

test('prefers the backend (recorded) score over local when the local play was superseded', async () => {
  currentState = completedState; // local completed, totalScore 888
  mockAuthed = true;
  supersededRef.value = true;
  fetchMyScore.mockResolvedValueOnce({
    scores: 777,
    created_at: '2026-06-12T00:00:00Z',
    metadata: {
      total_time: 83,
      puzzle_number: 1,
      sport: 'american',
      rounds: [
        { event_text: 'Remote R1', guessed_year: 2010, actual_year: 2012, diff: -2, score: 82, tier: 'great' },
      ],
    },
  });

  render(
    <ResultsScreen onHome={() => {}} onGroups={() => {}} onLeaderboard={() => {}} onRequireAuth={() => {}} />
  );

  expect(await screen.findByText('777')).not.toBeNull();
  expect(screen.queryByText('888')).toBeNull();
  expect(await screen.findByText('Showing your score from earlier today')).not.toBeNull();
});

test('shows the score-grade toast once and marks it seen for today', () => {
  vi.useFakeTimers();
  currentState = completedState;
  gradeSeenRef.value = false;

  render(
    <ResultsScreen onHome={() => {}} onGroups={() => {}} onLeaderboard={() => {}} onRequireAuth={() => {}} />
  );

  act(() => { vi.advanceTimersByTime(700); });

  expect(markGradeSeen).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});

test('does not re-show the score-grade toast once it has been seen today', () => {
  vi.useFakeTimers();
  currentState = completedState;
  gradeSeenRef.value = true; // already seen earlier today

  render(
    <ResultsScreen onHome={() => {}} onGroups={() => {}} onLeaderboard={() => {}} onRequireAuth={() => {}} />
  );

  act(() => { vi.advanceTimersByTime(700); });

  expect(markGradeSeen).not.toHaveBeenCalled();
  vi.useRealTimers();
});
