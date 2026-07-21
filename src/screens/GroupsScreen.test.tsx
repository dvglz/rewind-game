import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { GroupsScreen } from './GroupsScreen';

const { fetchGroups, fetchGroup, fetchLeaderboard, createGroup, joinGroup, leaveGroup } = vi.hoisted(() => ({
  fetchGroups: vi.fn(),
  fetchGroup: vi.fn(),
  fetchLeaderboard: vi.fn(),
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
  leaveGroup: vi.fn(),
}));

vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://clutchpoints-rewind-test.4taps.me');

vi.mock('../lib/playhub', () => ({
  fetchGroups,
  fetchGroup,
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
  fetchGroup.mockReset();
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

  expect(fetchLeaderboard).toHaveBeenCalledWith(expect.any(Number), { period: 'daily', groupId: 42, gameMode: undefined });
  expect(await screen.findByText('Mike')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  expect(await screen.findByText('Sarah')).not.toBeNull();
  expect(await screen.findByText('DNP')).not.toBeNull();
  expect(await screen.findByText('940')).not.toBeNull();
  expect(await screen.findByText('820')).not.toBeNull();
});

test('shows group leaderboard scores when the group roster is missing', async () => {
  fetchGroups.mockResolvedValueOnce([{ ...smallGroup, members: [] }]);
  fetchGroup.mockRejectedValueOnce(new Error('Detail unavailable'));
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: { rank: 2, userId: 7, displayName: 'You', score: 820, timeMs: 156000, isCurrentUser: true },
    entries: [
      { rank: 1, userId: 9, displayName: 'Mike', score: 940, timeMs: 72000, isCurrentUser: false },
    ],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));

  expect(fetchLeaderboard).toHaveBeenCalledWith(expect.any(Number), { period: 'daily', groupId: 42, gameMode: undefined });
  expect(await screen.findByText('Mike')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  expect(await screen.findByText('940')).not.toBeNull();
  expect(await screen.findByText('820')).not.toBeNull();
  expect(screen.queryByText(/no one played/i)).toBeNull();
});

test('deduplicates the current user when falling back to leaderboard scores', async () => {
  fetchGroups.mockResolvedValueOnce([{ ...smallGroup, members: [] }]);
  fetchGroup.mockRejectedValueOnce(new Error('Detail unavailable'));
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: { rank: 2, userId: 7, displayName: 'You', score: 820, timeMs: 156000, isCurrentUser: true },
    entries: [
      { rank: 1, userId: 9, displayName: 'Mike', score: 940, timeMs: 72000, isCurrentUser: false },
      { rank: 2, userId: 7, displayName: 'You', score: 820, timeMs: 156000, isCurrentUser: true },
    ],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));

  expect(await screen.findByText('Mike')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  expect(screen.getAllByText('You')).toHaveLength(1);
  expect(screen.getAllByText('820')).toHaveLength(1);
});

test('loads group detail on open to keep DNP members visible when list rows are summary-only', async () => {
  fetchGroups.mockResolvedValueOnce([{ ...smallGroup, members: [] }]);
  fetchGroup.mockResolvedValueOnce(smallGroup);
  fetchLeaderboard.mockResolvedValueOnce({
    date: '2026-06-12',
    currentUser: { rank: 2, userId: 7, displayName: 'You', score: 820, timeMs: 156000, isCurrentUser: true },
    entries: [
      { rank: 1, userId: 9, displayName: 'Changed Name', score: 940, timeMs: 72000, isCurrentUser: false },
    ],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));

  expect(fetchGroup).toHaveBeenCalledWith(42);
  expect(await screen.findByText('Mike')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  expect(await screen.findByText('Sarah')).not.toBeNull();
  expect(await screen.findByText('DNP')).not.toBeNull();
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
    [
      '⏪ Join "the boys" on Rewind',
      'Guess 5 NBA moments by year',
      'Go https://clutchpoints-rewind-test.4taps.me/?invite=YPWFZC or use code YPWFZC',
    ].join('\n'),
  );
});

test('opens the joined group after joining by invite link', async () => {
  joinGroup.mockResolvedValueOnce(smallGroup);
  fetchGroups.mockResolvedValueOnce([bigGroup]);
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

test('opens an existing invited group without rejoining it', async () => {
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

  expect(await screen.findByRole('heading', { name: 'the boys' })).not.toBeNull();
  expect(joinGroup).not.toHaveBeenCalled();
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

test('shows the glyph loader instead of flashing DNP while group scores are loading', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup]);
  let resolveBoard: (board: unknown) => void = () => {};
  fetchLeaderboard.mockImplementationOnce(
    () => new Promise((resolve) => { resolveBoard = resolve; }),
  );

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));

  // While the scores request is still in flight, members must NOT be shown as
  // DNP — that is the flicker the loader replaces.
  expect(await screen.findByRole('status', { name: /loading scores/i })).toBeTruthy();
  expect(screen.queryByText('DNP')).toBeNull();

  // Once scores resolve, DNP legitimately appears for members who did not play.
  resolveBoard({
    date: '2026-06-12',
    currentUser: { rank: 1, userId: 7, displayName: 'You', score: 820, timeMs: 156000, isCurrentUser: true },
    entries: [
      { rank: 1, userId: 9, displayName: 'Mike', score: 940, timeMs: 72000, isCurrentUser: false },
    ],
  });

  expect(await screen.findByText('DNP')).not.toBeNull();
  expect(screen.queryByRole('status', { name: /loading scores/i })).toBeNull();
});

test('copies the invite on desktop instead of opening the native share sheet', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }), // fine pointer => desktop
  });

  fetchGroups.mockResolvedValueOnce([smallGroup]);
  fetchLeaderboard.mockResolvedValueOnce({ date: '2026-06-12', currentUser: null, entries: [] });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));
  fireEvent.click(await screen.findByRole('button', { name: /invite friends/i }));

  expect(share).not.toHaveBeenCalled();
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    [
      '⏪ Join "the boys" on Rewind',
      'Guess 5 NBA moments by year',
      'Go https://clutchpoints-rewind-test.4taps.me/?invite=YPWFZC or use code YPWFZC',
    ].join('\n'),
  );
  expect(await screen.findByText(/copied/i)).toBeTruthy();
});

test('uses the native share sheet on touch devices', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true }), // coarse pointer => touch
  });

  fetchGroups.mockResolvedValueOnce([smallGroup]);
  fetchLeaderboard.mockResolvedValueOnce({ date: '2026-06-12', currentUser: null, entries: [] });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));
  fireEvent.click(await screen.findByRole('button', { name: /invite friends/i }));

  expect(share).toHaveBeenCalledWith({ text: expect.stringContaining('YPWFZC') });
});

test('refetches the group board weekly when Weekly is selected', async () => {
  fetchGroups.mockResolvedValueOnce([smallGroup, bigGroup]);
  fetchLeaderboard.mockResolvedValue({
    date: '2026-07-14',
    startDate: '2026-07-14',
    endDate: '2026-07-20',
    hasPrevious: true,
    currentUser: null,
    entries: [],
  });

  render(<GroupsScreen onBack={() => {}} onRequireAuth={() => {}} isAuthenticated />);

  fireEvent.click(await screen.findByRole('button', { name: /the boys/i }));
  await screen.findByRole('heading', { name: 'the boys' });

  fetchLeaderboard.mockClear();
  fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }));

  await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalled());
  const opts = fetchLeaderboard.mock.calls.at(-1)?.[1] as { period?: string; groupId?: number } | undefined;
  expect(opts?.period).toBe('weekly');
  expect(opts?.groupId).toBeTruthy();
});
