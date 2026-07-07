import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ShareCard } from './ShareCard';

const results = [
  { event: { text: 'R1', year: 2012 }, guessedYear: 2012, actualYear: 2012, diff: 0, score: 100 },
  { event: { text: 'R2', year: 2012 }, guessedYear: 2011, actualYear: 2012, diff: -1, score: 100 },
  { event: { text: 'R3', year: 2012 }, guessedYear: 2013, actualYear: 2012, diff: 1, score: 200 },
  { event: { text: 'R4', year: 2012 }, guessedYear: 2014, actualYear: 2012, diff: 2, score: 244 },
  { event: { text: 'R5', year: 2012 }, guessedYear: 2023, actualYear: 2012, diff: 11, score: 244 },
];

test('renders the redesigned header and round list', () => {
  render(
    <ShareCard
      results={results}
      totalScore={888}
      maxScore={1000}
      dateLabel="June 10, 2026"
      elapsedMs={156000}
    />
  );

  expect(screen.getByText('June 10, 2026')).not.toBeNull();
  expect(screen.getByText('888')).not.toBeNull();
  expect(screen.getByText('/ 1,000')).not.toBeNull();
  expect(screen.getByText('02:36')).not.toBeNull();
  expect(screen.getAllByTestId('round-dot')).toHaveLength(5);

  const roundList = screen.getByTestId('round-list');
  expect(within(roundList).getByText('Round 1')).not.toBeNull();
  expect(within(roundList).getByText('Perfect')).not.toBeNull();
  expect(within(roundList).getByText('11yrs late')).not.toBeNull();
  expect(within(roundList).getAllByText('244')).toHaveLength(2);
});

test('hides the time pill when elapsedMs is omitted', () => {
  render(<ShareCard results={results} totalScore={888} maxScore={1000} />);
  expect(screen.queryByText('02:36')).toBeNull();
});
