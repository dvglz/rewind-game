import { render, screen, waitFor } from '@testing-library/react';
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
}));

vi.mock('./engine/storage', () => ({
  clearGameState: vi.fn(),
  loadGameState: vi.fn().mockReturnValue(null),
  pruneOldGameStates: vi.fn(),
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
  HomeScreen: ({ onLeaderboard }: { onLeaderboard: () => void }) => (
    <div data-testid="home-screen">
      home
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
  ResultsScreen: () => <div data-testid="results-screen">results</div>,
}));

vi.mock('./screens/LeaderboardScreen', () => ({
  LeaderboardScreen: () => <div data-testid="leaderboard-screen">leaderboard</div>,
}));

vi.mock('./screens/ArchiveScreen', () => ({
  ArchiveScreen: () => <div data-testid="archive-screen">archive</div>,
}));

vi.mock('./screens/AuthScreen', () => ({
  AuthScreen: () => <div data-testid="auth-screen">auth</div>,
}));

vi.mock('./screens/GroupsScreen', () => ({
  GroupsScreen: ({ pendingInvite }: { pendingInvite?: string }) => (
    <div data-testid="groups-screen">{pendingInvite ?? 'groups'}</div>
  ),
}));

beforeEach(() => {
  trackPageViewMock.mockClear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/?invite=EMNRLJ2G&returnTo=groups');
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
