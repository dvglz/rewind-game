import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ShareCard } from './ShareCard';

test('shows result tiers in the per-round summary', () => {
  render(
    <ShareCard
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
    />
  );

  expect(screen.getByText('Better luck tomorrow')).not.toBeNull();
  expect(screen.getByText('Perfect')).not.toBeNull();
  expect(screen.getByText('2yrs early')).not.toBeNull();
  expect(screen.getByText('4yrs late')).not.toBeNull();
  expect(screen.getByText('8yrs late')).not.toBeNull();
  expect(screen.getByText('12yrs late')).not.toBeNull();
});
