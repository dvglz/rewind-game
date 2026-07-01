import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { RoundDots } from './RoundDots';

test('renders exactly totalRounds dots', () => {
  render(<RoundDots results={[]} currentRound={0} totalRounds={5} />);
  expect(screen.getAllByTestId('round-dot')).toHaveLength(5);
});

test('marks completed, current, and upcoming dots by state', () => {
  render(
    <RoundDots
      results={[{ diff: 0 }, { diff: 1 }, { diff: 20 }]}
      currentRound={3}
      totalRounds={5}
    />
  );
  const states = screen.getAllByTestId('round-dot').map((d) => d.getAttribute('data-state'));
  expect(states).toEqual(['done', 'done', 'done', 'current', 'upcoming']);
});

test('colors a completed dot with its tier color', () => {
  render(<RoundDots results={[{ diff: 0 }]} currentRound={1} totalRounds={5} />);
  const first = screen.getAllByTestId('round-dot')[0];
  // diff 0 => 'perfect' => var(--color-correct)
  expect(first.style.background).toContain('--color-correct');
});
