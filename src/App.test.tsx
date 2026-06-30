import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useMemo, useState, createContext, useContext, type ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';

const { trackPageViewMock } = vi.hoisted(() => ({
  trackPageViewMock: vi.fn(),
}));

type AuthValue = {
  isAuthenticated: boolean;
  loading: boolean;
  user: { id: number; username: string; email: string } | null;
};

const AuthStateContext = createContext<AuthValue>({
  isAuthenticated: false,
  loading: true,
  user: null,
});

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      Promise.resolve().then(() => {
        setIsAuthenticated(true);
      });
    }, []);

    const value = useMemo<AuthValue>(() => ({
      isAuthenticated,
      loading: !isAuthenticated,
      user: isAuthenticated ? { id: 7, username: 'authed', email: 'authed@test.dev' } : null,
    }), [isAuthenticated]);

    return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
  },
  useAuth: () => useContext(AuthStateContext),
}));

vi.mock('web-haptics/react', () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

vi.mock('./lib/haptics', () => ({
  initHaptics: vi.fn(),
}));

vi.mock('./hooks/useThemePreference', () => ({
  useThemePreference: vi.fn(),
}));

vi.mock('./lib/api', () => ({
  fetchMyScore: vi.fn().mockResolvedValue(null),
  flushPendingScore: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./lib/analytics', () => ({
  initAnalytics: vi.fn(),
  trackPageView: trackPageViewMock,
  track: vi.fn(),
}));

vi.mock('./lib/homeIntro', () => ({
  markHomeIntroSeen: vi.fn(),
}));

vi.mock('./engine/storage', () => ({
  clearGameState: vi.fn(),
  loadGameState: vi.fn().mockReturnValue(null),
  pruneOldGameStates: vi.fn(),
  hasSeenRules: vi.fn().mockReturnValue(true),
  markRulesSeen: vi.fn(),
  hasUsedArchiveFreePlay: vi.fn().mockReturnValue(false),
  markArchiveFreePlayUsed: vi.fn(),
}));

vi.mock('./data/puzzles', () => ({
  beginPuzzleSession: vi.fn(),
  getDateOverride: vi.fn().mockReturnValue('2026-06-15'),
  getSport: vi.fn().mockReturnValue('american'),
  getTodaysPuzzle: vi.fn().mockReturnValue({ id: '2026-06-15-american', number: 1 }),
  isRewindLabMode: vi.fn().mockReturnValue(false),
  isPracticeMode: vi.fn().mockReturnValue(false),
}));

vi.mock('./lib/testMode', () => ({
  hidesCompletedGameLock: vi.fn().mockReturnValue(false),
  shouldEnableHapticsDebug: vi.fn().mockReturnValue(false),
}));

vi.mock('./screens/HomeScreen', () => ({
  HomeScreen: ({
    onPlay,
    onLeaderboard,
  }: {
    onPlay: () => void;
    onLeaderboard: () => void;
  }) => (
    <div data-testid="home-screen">
      home
      <button type="button" onClick={onPlay}>Start</button>
      <button type="button" onClick={onLeaderboard}>Leaderboard</button>
    </div>
  ),
}));

vi.mock('./screens/GameScreen', () => ({
  GameScreen: () => <div data-testid="game-screen">game</div>,
}));

vi.mock('./screens/OrderingScreen', () => ({
  OrderingScreen: () => <div data-testid="ordering-screen">ordering</div>,
}));

vi.mock('./screens/ResultsScreen', () => ({
  ResultsScreen: ({ onRequireAuth }: { onRequireAuth: (reason?: 'default' | 'reminder') => void }) => (
    <div data-testid="results-screen">
      results
      <button type="button" onClick={() => onRequireAuth('reminder')}>Notify Me</button>
    </div>
  ),
}));

vi.mock('./screens/LeaderboardScreen', () => ({
  LeaderboardScreen: () => <div data-testid="leaderboard-screen">leaderboard</div>,
}));

vi.mock('./screens/ArchiveScreen', () => ({
  ArchiveScreen: () => <div data-testid="archive-screen">archive</div>,
}));

vi.mock('./screens/AuthScreen', () => ({
  AuthScreen: ({
    contextMessage,
    showAppDownloadLink,
  }: {
    contextMessage?: string;
    showAppDownloadLink?: boolean;
  }) => (
    <div data-testid="auth-screen">
      <span data-testid="auth-copy">{contextMessage ?? 'auth'}</span>
      {showAppDownloadLink ? <span data-testid="app-download-link">ios-link</span> : null}
    </div>
  ),
}));

vi.mock('./screens/GroupsScreen', () => ({
  GroupsScreen: ({ pendingInvite }: { pendingInvite?: string }) => (
    <div data-testid="groups-screen">{pendingInvite ?? 'groups'}</div>
  ),
}));

beforeEach(async () => {
  trackPageViewMock.mockClear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/?invite=EMNRLJ2G&returnTo=groups');
  const storage = await import('./engine/storage');
  vi.mocked(storage.hasSeenRules).mockReturnValue(true);
  const homeIntro = await import('./lib/homeIntro');
  vi.mocked(homeIntro.markHomeIntroSeen).mockClear();
});

test('shows the loading overlay while auth resolves, then lands on groups for an invite link', async () => {
  const { App } = await import('./App');

  render(<App />);

  expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
  expect(screen.queryByTestId('auth-screen')).toBeNull();

  await waitFor(() => {
    expect(screen.getByTestId('groups-screen').textContent).toContain('EMNRLJ2G');
  });

  expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
});

test('updates the URL before tracking SPA navigation pageviews', async () => {
  window.history.replaceState({}, '', '/');
  trackPageViewMock.mockImplementation((screen: string) => {
    if (screen === 'leaderboard') {
      expect(window.location.search).toBe('?mode=leaderboard');
    }
  });

  const { App } = await import('./App');

  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });

  screen.getByRole('button', { name: 'Leaderboard' }).click();

  await waitFor(() => {
    expect(trackPageViewMock).toHaveBeenCalledWith('leaderboard');
  });
});

test('marks the home intro as seen when Start enters the game', async () => {
  window.history.replaceState({}, '', '/');
  const { markHomeIntroSeen } = await import('./lib/homeIntro');
  const { App } = await import('./App');

  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Start' }));

  await waitFor(() => {
    expect(screen.getByTestId('game-screen')).toBeTruthy();
  });
  expect(markHomeIntroSeen).toHaveBeenCalledTimes(1);
});

test('starts the game even when first-run rules have not been seen', async () => {
  window.history.replaceState({}, '', '/');
  const storage = await import('./engine/storage');
  vi.mocked(storage.hasSeenRules).mockReturnValue(false);
  const { markHomeIntroSeen } = await import('./lib/homeIntro');
  const { App } = await import('./App');

  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Start' }));

  await waitFor(() => {
    expect(screen.getByTestId('game-screen')).toBeTruthy();
  });
  expect(markHomeIntroSeen).toHaveBeenCalledTimes(1);
});

test('does not render the auth screen in app mode even with mode=auth', async () => {
  sessionStorage.clear();
  window.history.replaceState({}, '', '/?from=app&mode=auth');

  const { App } = await import('./App');
  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });
  expect(screen.queryByTestId('auth-screen')).toBeNull();

  window.history.replaceState({}, '', '/');
  sessionStorage.clear();
});

test('routes Notify Me from results to auth with reminder copy', async () => {
  const { loadGameState } = await import('./engine/storage');
  vi.mocked(loadGameState).mockReturnValue({
    puzzleId: '2026-06-15-american',
    currentRound: 5,
    results: [],
    totalScore: 500,
    completed: true,
    elapsedMs: 90000,
  });
  window.history.replaceState({}, '', '/?mode=results');

  const { App } = await import('./App');
  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('results-screen')).toBeTruthy();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Notify Me' }));

  await waitFor(() => {
    expect(screen.getByTestId('auth-copy').textContent).toBe(
      "Get notified when tomorrow's puzzle drops. No spam. Unsubscribe anytime.",
    );
  });
  expect(screen.getByTestId('app-download-link')).toBeTruthy();
  expect(window.location.search).toContain('returnTo=results');
  expect(window.location.search).toContain('authReason=reminder');
});
