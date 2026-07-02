import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { RoundBreakdown } from './RoundBreakdown';
import type { RoundResult } from '../types';

const results: RoundResult[] = [
  { event: { text: 'R1', year: 2012 }, guessedYear: 2012, actualYear: 2012, diff: 0, score: 100 },
  { event: { text: 'R2', year: 2012 }, guessedYear: 2011, actualYear: 2012, diff: -1, score: 100 },
  { event: { text: 'R3', year: 2012 }, guessedYear: 2013, actualYear: 2012, diff: 1, score: 200 },
  { event: { text: 'R4', year: 2012 }, guessedYear: 2014, actualYear: 2012, diff: 2, score: 244 },
  { event: { text: 'R5', year: 2012 }, guessedYear: 2023, actualYear: 2012, diff: 11, score: 244 },
];

test('renders one row per round with number, accuracy label, and score', () => {
  render(<RoundBreakdown results={results} />);
  const rows = screen.getAllByTestId('breakdown-row');
  expect(rows).toHaveLength(5);

  const list = screen.getByTestId('round-list');
  expect(within(list).getByText('Round 1')).not.toBeNull();
  expect(within(list).getByText('Perfect')).not.toBeNull();
  expect(within(list).getByText('11yrs late')).not.toBeNull();
  expect(within(list).getAllByText('244')).toHaveLength(2);
});
