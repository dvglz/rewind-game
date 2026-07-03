import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { RoundDots } from './RoundDots';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

test('animates only the requested completed dot', () => {
  const { rerender } = render(<RoundDots results={[{ diff: 0 }]} currentRound={1} totalRounds={5} />);

  expect(screen.getAllByTestId('round-dot')[0].className).not.toContain('doneAnimated');

  rerender(
    <RoundDots
      results={[{ diff: 0 }, { diff: 1 }]}
      currentRound={2}
      totalRounds={5}
      animatedDoneIndex={1}
    />
  );

  const dots = screen.getAllByTestId('round-dot');
  expect(dots[0].className).not.toContain('doneAnimated');
  expect(dots[1].className).toContain('doneAnimated');
});

test('keeps completion animation off the stable done state', () => {
  const css = readFileSync(resolve(__dirname, './RoundDots.module.css'), 'utf8');
  const doneBlock = css.match(/\.done\s*\{([^}]*)\}/)?.[1] ?? '';

  expect(doneBlock).not.toMatch(/animation:/);
  expect(css).toMatch(/\.doneAnimated\s*\{[^}]*animation:\s*dotPop/);
});
