import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { GroupsScreen } from './GroupsScreen';

const { fetchGroups, fetchLeaderboard, createGroup, joinGroup, leaveGroup } = vi.hoisted(() => ({
  fetchGroups: vi.fn(),
  fetchLeaderboard: vi.fn(),
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
  leaveGroup: vi.fn(),
}));

vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://clutchpoints-rewind-test.4taps.me');

vi.mock('../lib/playhub', () => ({
  fetchGroups,
  createGroup,
  joinGroup,
  leaveGroup,
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

const smallGroup = {
  id: 42,
  name: 'the boys',
  invite_link: 'https://some-backend.test/?invite=YPWFZC',
  members_count: 3,
  members: [
    { group: 42, user: { id: 7, username: 'You', email: 'you@test.dev' }, joined_at: '2026-06-01T00:00:00Z' },
    { group: 42, user: { id: 9, username: 'Mike', email: 'mike@test.dev' }, joined_at: '2026-06-02T00:00:00Z' },
    { group: 42, user: { id: 11, username: 'Sarah', email: 'sarah@test.dev' }, joined_at: '2026-06-03T00:00:00Z' },
  ],
};

const bigGroup = {
  id: 88,
  name: 'office sickos',
  invite_link: 'OFFICE',
  members_count: 12,
  members: [
    { group: 88, user: { id: 7, username: 'You', email: 'you@test.dev' }, joined_at: '2026-06-01T00:00:00Z' },
  ],
};

beforeEach(() => {
  fetchGroups.mockReset();
  fetchLeaderboard.mockReset();
  createGroup.mockReset();
  joinGroup.mockReset();
  leaveGroup.mockReset();
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: false,
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

test('shows groups sorted by member count before opening one group', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup, bigGroup]);

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  const rows = await screen.findAllByRole('button', { name: /members/i });
  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain('office sickos');
  expect(rows[0].textContent).toContain('12 members');
  expect(rows[1].textContent).toContain('the boys');
  expect(rows[1].textContent).toContain('3 members');
  expect(screen.getByRole('button', { name: /join by code/i })).not.toBeNull();
  expect(screen.getByRole('button', { name: /create group/i })).not.toBeNull();
  expect(fetchLeaderboard).not.toHaveBeenCalled();
});

test('opens a selected group and keeps DNP members visible while merging scores by user id', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup, bigGroup]);
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: { rank: 2, userId: 7, displayName: 'You', score: 820, timeMs: 156000, isCurrentUser: true },
    entries: [
      { rank: 1, userId: 9, displayName: 'Changed Name', score: 940, timeMs: 72000, isCurrentUser: false },
    ],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));

  expect(fetchLeaderboard).toHaveBeenCalledWith(expect.any(Number), 42);
  expect(await screen.findByText('Mike')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  expect(await screen.findByText('Sarah')).not.toBeNull();
  expect(await screen.findByText('DNP')).not.toBeNull();
  expect(await screen.findByText('940')).not.toBeNull();
  expect(await screen.findByText('820')).not.toBeNull();
});

test('shares selected group invite links with the configured public app url', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup]);
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));
  fireEvent.click(await screen.findByRole('button', { name: /invite friends/i }));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    expect.stringContaining('https://clutchpoints-rewind-test.4taps.me/?invite=YPWFZC'),
  );
});

test('opens the joined group after joining by invite link', async () => {
  joinGroup.mockResolvedValueOnce(smallGroup);
  fetchGroups.mockResolvedValueOnce([smallGroup, bigGroup]);
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
  expect(await screen.findByRole('heading', { name: 'the boys' })).not.toBeNull();
});

test('leaves only the selected group and returns to the groups list', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup, bigGroup]);
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [],
  });
  leaveGroup.mockResolvedValueOnce(undefined);

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));
  fireEvent.click(await screen.findByRole('button', { name: /^leave group$/i }));
  fireEvent.click(await screen.findByRole('button', { name: /tap again to leave/i }));

  expect(leaveGroup).toHaveBeenCalledWith(42);
  expect(await screen.findByRole('heading', { name: 'My Groups' })).not.toBeNull();
  expect(screen.queryByRole('button', { name: /the boys/i })).toBeNull();
  expect(screen.getByRole('button', { name: /office sickos/i })).not.toBeNull();
});

test('shows the existing empty state when the user has no groups', async () => {
  fetchGroups.mockResolvedValueOnce([]);

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  expect(await screen.findByText(/Bring Rewind/)).not.toBeNull();
  expect(screen.getByRole('button', { name: /join by code/i })).not.toBeNull();
  expect(screen.getByRole('button', { name: /create group/i })).not.toBeNull();
});

test('opens the created group even when the follow-up groups refresh fails', async () => {
  const createdGroup = {
    id: 99,
    name: 'new crew',
    invite_link: 'NEWCREW',
    members_count: 1,
    members: [{ group: 99, user: { id: 7, username: 'You', email: 'you@test.dev' }, joined_at: '2026-06-30T00:00:00Z' }],
  };
  fetchGroups.mockResolvedValueOnce([]);
  createGroup.mockResolvedValueOnce(createdGroup);
  fetchGroups.mockRejectedValueOnce(new Error('Failed to load'));
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /create group/i }));
  fireEvent.change(screen.getByPlaceholderText('Group name'), { target: { value: 'new crew' } });
  fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

  expect(await screen.findByRole('heading', { name: 'new crew' })).not.toBeNull();
  expect(screen.queryByText('Failed to load')).toBeNull();
});

test('top back arrow returns from group detail to the groups list', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup, bigGroup]);
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: null,
    entries: [],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));
  fireEvent.click(await screen.findByRole('button', { name: 'Back' }));

  expect(await screen.findByRole('heading', { name: 'My Groups' })).not.toBeNull();
});

test('wordmark navigates home via onBack', async () => {
  const onBack = vi.fn();
  fetchGroups.mockResolvedValueOnce([smallGroup]);

  render(<GroupsScreen onBack={onBack} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: 'REWIND' }));

  expect(onBack).toHaveBeenCalledTimes(1);
});

test('shows the loading overlay until the groups resolve', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup]);

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
  await screen.findByText('My Groups');
  expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
});
