import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ShareCard } from './ShareCard';

test('shows result tiers in the per-round summary', () => {
  render(
    <ShareCard
      puzzleNumber={12}
      results={[
        {
          event: { text: 'Round 1', year: 2012 },
          guessedYear: 2012,
          actualYear: 2012,
          diff: 0,
          score: 100,
        },
        {
          event: { text: 'Round 2', year: 2012 },
          guessedYear: 2010,
          actualYear: 2012,
          diff: -2,
          score: 114,
        },
        {
          event: { text: 'Round 3', year: 2012 },
          guessedYear: 2016,
          actualYear: 2012,
          diff: 4,
          score: 68,
        },
        {
          event: { text: 'Round 4', year: 2012 },
          guessedYear: 2020,
          actualYear: 2012,
          diff: 8,
          score: 29,
        },
        {
          event: { text: 'Round 5', year: 2012 },
          guessedYear: 2024,
          actualYear: 2012,
          diff: 12,
          score: 12,
        },
      ]}
      totalScore={323}
      maxScore={1000}
      stats={{
        currentStreak: 3,
        maxStreak: 4,
        gamesPlayed: 10,
        lastPlayedDate: '2026-06-03',
      }}
      sport="nba"
    />
  );

  expect(screen.getByText('Perfect')).not.toBeNull();
  expect(screen.getByText('Great')).not.toBeNull();
  expect(screen.getByText('Ballpark')).not.toBeNull();
  expect(screen.getByText('Wrong Era')).not.toBeNull();
  expect(screen.getByText('Not Even Close')).not.toBeNull();
});
