import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { GroupsScreen } from './GroupsScreen';

const { fetchGroup, fetchLeaderboard, joinGroup } = vi.hoisted(() => ({
  fetchGroup: vi.fn(),
  fetchLeaderboard: vi.fn(),
  joinGroup: vi.fn(),
}));

vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://clutchpoints-rewind-test.4taps.me');

vi.mock('../lib/playhub', () => ({
  fetchGroup,
  createGroup: vi.fn(),
  joinGroup,
  leaveGroup: vi.fn(),
}));

vi.mock('../lib/leaderboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/leaderboard')>();
  return {
    ...actual,
    fetchLeaderboard,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 7, username: 'You', email: 'you@test.dev' },
  }),
}));

beforeEach(() => {
  fetchGroup.mockReset();
  fetchLeaderboard.mockReset();
  joinGroup.mockReset();
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: false,
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

test('keeps all group members visible while merging backend scores', async () => {
  fetchGroup.mockResolvedValueOnce({
    id: 42,
    name: 'the boys',
    invite_link: 'YPWFZC',
    members: [
      { group: 42, user: { id: 7, username: 'You', email: 'you@test.dev' }, joined_at: '2026-06-01T00:00:00Z' },
      { group: 42, user: { id: 9, username: 'Mike', email: 'mike@test.dev' }, joined_at: '2026-06-02T00:00:00Z' },
      { group: 42, user: { id: 11, username: 'Sarah', email: 'sarah@test.dev' }, joined_at: '2026-06-03T00:00:00Z' },
    ],
  });

  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [
      { rank: 1, displayName: 'Mike', score: 940, timeMs: 72000, isCurrentUser: false },
      { rank: 2, displayName: 'You', score: 820, timeMs: 156000, isCurrentUser: true },
    ],
  });

  render(
    <GroupsScreen
      onBack={() => {}}
      onRequireAuth={() => {}}
      isAuthenticated
    />,
  );

  expect(await screen.findByText('Mike')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  expect(await screen.findByText('Sarah')).not.toBeNull();
  expect(await screen.findByText('DNP')).not.toBeNull();
  expect(await screen.findByText('940')).not.toBeNull();
  expect(await screen.findByText('820')).not.toBeNull();
});

test('shares group invite links with the configured public app url', async () => {
  fetchGroup.mockResolvedValueOnce({
    id: 42,
    name: 'the boys',
    invite_link: 'https://some-backend.test/?invite=YPWFZC',
    members: [
      { group: 42, user: { id: 7, username: 'You', email: 'you@test.dev' }, joined_at: '2026-06-01T00:00:00Z' },
    ],
  });

  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [],
  });

  render(
    <GroupsScreen
      onBack={() => {}}
      onRequireAuth={() => {}}
      isAuthenticated
    />,
  );

  fireEvent.click(await screen.findByRole('button', { name: /invite friends/i }));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    expect.stringContaining('https://clutchpoints-rewind-test.4taps.me/?invite=YPWFZC'),
  );
});

test('shows a success toast after joining by invite link', async () => {
  joinGroup.mockResolvedValueOnce(undefined);
  fetchGroup.mockResolvedValueOnce({
    id: 42,
    name: 'the boys',
    invite_link: 'YPWFZC',
    members: [
      { group: 42, user: { id: 7, username: 'You', email: 'you@test.dev' }, joined_at: '2026-06-01T00:00:00Z' },
    ],
  });
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [],
  });

  render(
    <GroupsScreen
      onBack={() => {}}
      onRequireAuth={() => {}}
      isAuthenticated
      pendingInvite="YPWFZC"
    />,
  );

  expect(await screen.findByText('Joined group')).not.toBeNull();
});

test('rewind wordmark navigates home via onBack', async () => {
  const onBack = vi.fn();
  fetchGroup.mockResolvedValueOnce({
    id: 42,
    name: 'the boys',
    invite_link: 'YPWFZC',
    members: [
      { group: 42, user: { id: 7, username: 'You', email: 'you@test.dev' }, joined_at: '2026-06-01T00:00:00Z' },
    ],
  });
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [],
  });

  render(
    <GroupsScreen
      onBack={onBack}
      onRequireAuth={() => {}}
      isAuthenticated
    />,
  );

  fireEvent.click(await screen.findByRole('button', { name: 'REWIND' }));

  expect(onBack).toHaveBeenCalledTimes(1);
});
