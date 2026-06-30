import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';
import { AuthProvider } from '../context/AuthContext';

const { fetchProfileMock } = vi.hoisted(() => ({
  fetchProfileMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  fetchProfile: fetchProfileMock,
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

vi.mock('../lib/homeIntro', () => ({
  hasSeenHomeIntro: vi.fn(() => false),
  markHomeIntroSeen: vi.fn(),
}));

beforeEach(() => {
  fetchProfileMock.mockResolvedValue(null);
});

afterEach(async () => {
  window.history.replaceState({}, '', '/');
  sessionStorage.clear();
  const homeIntro = await import('../lib/homeIntro');
  (homeIntro.hasSeenHomeIntro as ReturnType<typeof vi.fn>).mockReturnValue(false);
  vi.clearAllMocks();
});

test('renders the home screen core actions without the theme switcher', () => {
  render(
    <AuthProvider>
    <HomeScreen
      onPlay={() => {}}
      hasInProgressGame={false}
      hasCompletedGame={false}
      onViewResults={() => {}}
      onLeaderboard={() => {}}
      showDebugTools={false}
      onGroups={() => {}}
      onArchive={() => {}}
      onNavigateAuth={() => {}}
      onSignOut={() => {}}
      onHowTo={() => {}}
    />
    </AuthProvider>
  );

  expect(screen.getByRole('button', { name: 'Start' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Menu' })).not.toBeNull();
  expect(screen.queryByRole('button', { name: 'Debug' })).toBeNull();
  expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull();
});

test('shows only see results when todays game is already completed', () => {
  render(
    <AuthProvider>
    <HomeScreen
      onPlay={() => {}}
      hasInProgressGame={false}
      hasCompletedGame={true}
      onViewResults={() => {}}
      onLeaderboard={() => {}}
      showDebugTools={false}
      onGroups={() => {}}
      onArchive={() => {}}
      onNavigateAuth={() => {}}
      onSignOut={() => {}}
      onHowTo={() => {}}
    />
    </AuthProvider>
  );

  expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  expect(screen.getByRole('button', { name: 'See Results' })).not.toBeNull();
});

test('shows the active puzzle date with abbreviated month and no weekday', () => {
  window.history.replaceState({}, '', '/?date=2026-06-15');

  render(
    <AuthProvider>
      <HomeScreen
        onPlay={() => {}}
        hasInProgressGame={false}
        hasCompletedGame={false}
        onViewResults={() => {}}
        onLeaderboard={() => {}}
        showDebugTools={false}
        onGroups={() => {}}
        onArchive={() => {}}
        onNavigateAuth={() => {}}
        onSignOut={() => {}}
        onHowTo={() => {}}
      />
    </AuthProvider>
  );

  const meta = document.querySelector('p[class*="meta"]');
  expect(meta?.textContent).toContain('· Jun 15, 2026');
  expect(meta?.textContent).not.toContain('June 15, 2026');
  expect(meta?.textContent).not.toContain('Monday');
});

test('footer invites returning players to sign in', () => {
  const onNavigateAuth = vi.fn();

  render(
    <AuthProvider>
      <HomeScreen
        onPlay={() => {}}
        hasInProgressGame={false}
        hasCompletedGame={false}
        onViewResults={() => {}}
        onLeaderboard={() => {}}
        showDebugTools={false}
        onGroups={() => {}}
        onArchive={() => {}}
        onNavigateAuth={onNavigateAuth}
        onSignOut={() => {}}
        onHowTo={() => {}}
      />
    </AuthProvider>
  );

  expect(screen.queryByRole('button', { name: 'How to Play' })).toBeNull();
  expect(screen.getByText('Played before?')).not.toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

  expect(onNavigateAuth).toHaveBeenCalledWith('home');
});

test('shows a groups prompt for signed-in players', async () => {
  const onGroups = vi.fn();
  fetchProfileMock.mockResolvedValue({
    id: 1,
    objectId: 'abc',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    accessToken: 'tok_123',
    avatarUrl: null,
    thumbnailUrl: null,
  });

  render(
    <AuthProvider>
      <HomeScreen
        onPlay={() => {}}
        hasInProgressGame={false}
        hasCompletedGame={false}
        onViewResults={() => {}}
        onLeaderboard={() => {}}
        showDebugTools={false}
        onGroups={onGroups}
        onArchive={() => {}}
        onNavigateAuth={() => {}}
        onSignOut={() => {}}
        onHowTo={() => {}}
      />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByText(/Settle who knows ball in/)).not.toBeNull();
  });

  expect(screen.getByText(/Settle who knows ball in/).className).toContain('footerCta');
  expect(screen.queryByText('Played before?')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Sign In' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Groups' }));

  expect(onGroups).toHaveBeenCalledTimes(1);
});

test('hides intro demo and footer sign-in in app mode', async () => {
  const { markHomeIntroSeen } = await import('../lib/homeIntro');
  window.history.replaceState({}, '', '/?from=app');

  render(
    <AuthProvider>
      <HomeScreen
        onPlay={() => {}}
        hasInProgressGame={false}
        hasCompletedGame={false}
        onViewResults={() => {}}
        onLeaderboard={() => {}}
        showDebugTools={false}
        onGroups={() => {}}
        onArchive={() => {}}
        onNavigateAuth={() => {}}
        onSignOut={() => {}}
        onHowTo={() => {}}
      />
    </AuthProvider>
  );

  expect(screen.queryByText('Shaq is drafted by Orlando')).toBeNull();
  expect(screen.queryByText('Played before?')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Sign In' })).toBeNull();
  expect(markHomeIntroSeen).toHaveBeenCalledTimes(1);
});

test('shows the landing demo for anonymous first-time web users', () => {
  render(
    <AuthProvider>
      <HomeScreen
        onPlay={() => {}}
        hasInProgressGame={false}
        hasCompletedGame={false}
        onViewResults={() => {}}
        onLeaderboard={() => {}}
        showDebugTools={false}
        onGroups={() => {}}
        onArchive={() => {}}
        onNavigateAuth={() => {}}
        onSignOut={() => {}}
        onHowTo={() => {}}
      />
    </AuthProvider>
  );

  expect(screen.getByText('Rose becomes the youngest MVP')).not.toBeNull();
});

test('hides the landing demo after the intro has been seen', async () => {
  const { hasSeenHomeIntro } = await import('../lib/homeIntro');
  (hasSeenHomeIntro as ReturnType<typeof vi.fn>).mockReturnValue(true);

  render(
    <AuthProvider>
      <HomeScreen
        onPlay={() => {}}
        hasInProgressGame={false}
        hasCompletedGame={false}
        onViewResults={() => {}}
        onLeaderboard={() => {}}
        showDebugTools={false}
        onGroups={() => {}}
        onArchive={() => {}}
        onNavigateAuth={() => {}}
        onSignOut={() => {}}
        onHowTo={() => {}}
      />
    </AuthProvider>
  );

  expect(screen.queryByText('Shaq is drafted by Orlando')).toBeNull();
});

test('compacts home spacing on short mobile screens', () => {
  const css = readFileSync(resolve(__dirname, './HomeScreen.module.css'), 'utf8');
  const compactBlock = css.match(/@media \(max-height: 760px\)[\s\S]*?\.container\s*\{([^}]*)\}/);
  const compactActionsBlock = css.match(/@media \(max-height: 760px\)[\s\S]*?\.actions\s*\{([^}]*)\}/);

  expect(compactBlock?.[1] ?? '').toMatch(/gap:\s*12px;/);
  // Top padding keeps the wordmark off the screen edge (plus notch safe-area).
  expect(compactBlock?.[1] ?? '').toMatch(/padding:\s*calc\(28px \+ env\(safe-area-inset-top, 0px\)\) 18px 76px;/);
  expect(compactActionsBlock?.[1] ?? '').toMatch(/gap:\s*8px;/);
  expect(css).toMatch(/\.footerLink\s*\{[\s\S]*?text-decoration:\s*underline;/);
  expect(css).toMatch(/\.containerCompact\s*\{/);
  expect(css).toMatch(/\.containerCompact\s+\.actions\s*\{/);
});
