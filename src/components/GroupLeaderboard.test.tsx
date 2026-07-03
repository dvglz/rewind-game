import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { GroupLeaderboard } from './GroupLeaderboard';

const entries = [
  { displayName: 'Mike', score: 940, isCurrentUser: false },
  { displayName: 'Sarah', score: 670, isCurrentUser: false },
];

test('renders a pinned row above the table when pinnedEntry is provided', () => {
  render(
    <GroupLeaderboard
      entries={entries}
      pinnedEntry={{ rank: 34, displayName: 'You', score: 410 }}
    />
  );
  expect(screen.getByText('34')).not.toBeNull();
  expect(screen.getByText('You')).not.toBeNull();
  expect(screen.getByText('410')).not.toBeNull();
});

test('does not render a pinned row when pinnedEntry is absent', () => {
  render(<GroupLeaderboard entries={entries} />);
  expect(screen.queryByText('You')).toBeNull();
});

test('marks DNP rows as muted', () => {
  render(<GroupLeaderboard entries={[{ displayName: 'Sarah', score: null, isCurrentUser: false }]} />);

  expect(screen.getByText('Sarah').closest('div[class*="row"]')?.className).toContain('rowNotPlayed');
});
