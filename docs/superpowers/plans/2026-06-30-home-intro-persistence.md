# Home Intro Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the animated landing demo only as a first-time intro, then use a compact home screen for returning, authenticated, and app-mode users.

**Architecture:** Add one localStorage-backed intro helper, then wire it through auth success, app-mode home mount, sign-out cleanup, and HomeScreen rendering. `HomeScreen` stays presentational: it decides whether to show `LandingDemo` from auth/app-mode/local intro state and exposes compact layout through a conditional class.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, CSS modules, browser localStorage/sessionStorage.

---

## File Structure

- Create: `src/lib/homeIntro.ts` - single-purpose localStorage helper for the home intro flag.
- Create: `src/lib/homeIntro.test.ts` - unit coverage for read/mark/clear behavior and storage failure fallbacks.
- Modify: `src/context/AuthContext.tsx` - mark intro seen on successful `setUser()`, clear intro seen on sign-out.
- Modify: `src/context/AuthContext.test.tsx` - verify auth success marks intro seen and sign-out clears it.
- Modify: `src/App.tsx` - mark intro seen from the app-owned game start path, after the first-run rules gate passes.
- Modify: `src/App.test.tsx` - verify successful Start/Resume marks intro seen while first-run how-to does not.
- Modify: `src/screens/HomeScreen.tsx` - hide `LandingDemo` when intro is seen, authenticated, or app mode; mark app-mode sessions seen; hide footer sign-in in app mode.
- Modify: `src/screens/HomeScreen.module.css` - add compact home spacing for the no-demo layout.
- Modify: `src/screens/HomeScreen.test.tsx` - cover demo visibility, app-mode footer suppression, and compact class behavior.

## Task 1: Home Intro Storage Helper

**Files:**
- Create: `src/lib/homeIntro.ts`
- Create: `src/lib/homeIntro.test.ts`

- [ ] **Step 1: Write the failing storage helper tests**

Create `src/lib/homeIntro.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearHomeIntroSeen, hasSeenHomeIntro, markHomeIntroSeen } from './homeIntro';

describe('home intro persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts unseen by default', () => {
    expect(hasSeenHomeIntro()).toBe(false);
  });

  it('marks the intro as seen', () => {
    markHomeIntroSeen();

    expect(hasSeenHomeIntro()).toBe(true);
  });

  it('clears the intro flag', () => {
    markHomeIntroSeen();
    clearHomeIntroSeen();

    expect(hasSeenHomeIntro()).toBe(false);
  });

  it('falls back safely when localStorage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(hasSeenHomeIntro()).toBe(false);
  });

  it('does not throw when localStorage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => markHomeIntroSeen()).not.toThrow();
    expect(() => clearHomeIntroSeen()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/lib/homeIntro.test.ts
```

Expected: FAIL because `src/lib/homeIntro.ts` does not exist.

- [ ] **Step 3: Implement the storage helper**

Create `src/lib/homeIntro.ts`:

```ts
const HOME_INTRO_SEEN_KEY = 'rewind_home_intro_seen';

export function hasSeenHomeIntro(): boolean {
  try {
    return localStorage.getItem(HOME_INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHomeIntroSeen(): void {
  try {
    localStorage.setItem(HOME_INTRO_SEEN_KEY, '1');
  } catch {
    // Storage may be unavailable in private or locked-down WebView contexts.
  }
}

export function clearHomeIntroSeen(): void {
  try {
    localStorage.removeItem(HOME_INTRO_SEEN_KEY);
  } catch {
    // Storage may be unavailable in private or locked-down WebView contexts.
  }
}
```

- [ ] **Step 4: Run the focused helper test**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/lib/homeIntro.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the helper**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
git add src/lib/homeIntro.ts src/lib/homeIntro.test.ts
git commit -m "feat: add home intro persistence helper"
```

## Task 2: Auth Success and Sign-Out Wiring

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/context/AuthContext.test.tsx`

- [ ] **Step 1: Extend the AuthContext helper mock**

In `src/context/AuthContext.test.tsx`, add a mock for `../lib/homeIntro` below the existing `../engine/storage` mock:

```ts
vi.mock('../lib/homeIntro', () => ({
  markHomeIntroSeen: vi.fn(),
  clearHomeIntroSeen: vi.fn(),
}));
```

- [ ] **Step 2: Add a test for successful auth marking intro seen**

In `src/context/AuthContext.test.tsx`, update `TestConsumer` so it can call `setUser`:

```tsx
function TestConsumer() {
  const { user, loading, isAuthenticated, signOut, setUser } = useAuth();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="name">{user?.firstName ?? 'none'}</span>
      <button onClick={signOut} type="button">sign out</button>
      <button
        onClick={() => setUser({
          id: 2,
          objectId: 'def',
          username: 'directuser',
          email: 'direct@example.com',
          firstName: 'Direct',
          lastName: 'User',
          accessToken: 'tok_456',
          avatarUrl: null,
          thumbnailUrl: null,
        })}
        type="button"
      >
        set user
      </button>
    </div>
  );
}
```

Add this test after `resolves to authenticated when profile returns user`:

```ts
it('marks the home intro as seen when auth succeeds through setUser', async () => {
  const { fetchProfile } = await import('../lib/auth');
  const { markHomeIntroSeen } = await import('../lib/homeIntro');
  (fetchProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );

  await act(async () => {});
  await act(async () => {
    screen.getByText('set user').click();
  });

  expect(markHomeIntroSeen).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('authed').textContent).toBe('true');
  expect(screen.getByTestId('name').textContent).toBe('Direct');
});
```

- [ ] **Step 3: Update the sign-out test expectation**

In `clears auth and local game state on sign out`, import `clearHomeIntroSeen` and assert it was called:

```ts
const { clearHomeIntroSeen } = await import('../lib/homeIntro');
```

Add this assertion after `expect(clearAllGameStates).toHaveBeenCalledTimes(1);`:

```ts
expect(clearHomeIntroSeen).toHaveBeenCalledTimes(1);
```

- [ ] **Step 4: Run the focused auth test to verify it fails**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/context/AuthContext.test.tsx
```

Expected: FAIL because `AuthContext` does not call `markHomeIntroSeen()` or `clearHomeIntroSeen()` yet.

- [ ] **Step 5: Wire the intro helper into AuthContext**

In `src/context/AuthContext.tsx`, add this import:

```ts
import { clearHomeIntroSeen, markHomeIntroSeen } from '../lib/homeIntro';
```

Update `setUser`:

```ts
const setUser = useCallback((u: AuthUser) => {
  storeToken(u.accessToken);
  markHomeIntroSeen();
  setUserState(u);
}, []);
```

Update `signOut`:

```ts
const signOut = useCallback(() => {
  clearAccessToken();
  clearAllGameStates();
  clearHomeIntroSeen();
  clearScoreSyncState();
  clearAnalyticsUser();
  setUserState(null);
}, []);
```

- [ ] **Step 6: Run the focused auth test**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/context/AuthContext.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the auth wiring**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
git add src/context/AuthContext.tsx src/context/AuthContext.test.tsx
git commit -m "feat: persist home intro state through auth"
```

## Task 3: Successful Start/Resume Persistence in App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Mock the home intro helper and expose the HomeScreen play action**

In `src/App.test.tsx`, add this mock after the existing analytics mock:

```ts
vi.mock('./lib/homeIntro', () => ({
  markHomeIntroSeen: vi.fn(),
}));
```

Update the `./engine/storage` mock so it includes `hasSeenRules`:

```ts
vi.mock('./engine/storage', () => ({
  clearGameState: vi.fn(),
  loadGameState: vi.fn().mockReturnValue(null),
  pruneOldGameStates: vi.fn(),
  hasSeenRules: vi.fn().mockReturnValue(true),
  hasUsedArchiveFreePlay: vi.fn().mockReturnValue(false),
  markArchiveFreePlayUsed: vi.fn(),
}));
```

Update the `./screens/HomeScreen` mock so it receives and renders `onPlay`:

```tsx
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
```

Update `beforeEach`:

```ts
beforeEach(async () => {
  trackPageViewMock.mockClear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/?invite=EMNRLJ2G&returnTo=groups');
  const storage = await import('./engine/storage');
  vi.mocked(storage.hasSeenRules).mockReturnValue(true);
  const homeIntro = await import('./lib/homeIntro');
  vi.mocked(homeIntro.markHomeIntroSeen).mockClear();
});
```

- [ ] **Step 2: Add App tests for successful game entry**

Add these tests after `updates the URL before tracking SPA navigation pageviews`:

```tsx
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

test('does not mark the home intro seen when first-run rules intercept Start', async () => {
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
    expect(screen.queryByTestId('home-screen')).toBeNull();
  });
  expect(screen.queryByTestId('game-screen')).toBeNull();
  expect(markHomeIntroSeen).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run the focused App test to verify it fails**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/App.test.tsx
```

Expected: FAIL because `App.startGame()` does not call `markHomeIntroSeen()` yet.

- [ ] **Step 4: Implement App game-start marking**

In `src/App.tsx`, add this import:

```ts
import { markHomeIntroSeen } from './lib/homeIntro';
```

Update `startGame` so it marks only after the caller has passed the first-run rules gate:

```ts
const startGame = () => {
  const sport = getSport();
  const puzzle = getTodaysPuzzle(sport);
  const saved = loadGameState(puzzle.id);
  markHomeIntroSeen();
  if (saved && !saved.completed) {
    navigate('game');
    return;
  }
  beginPuzzleSession();
  clearGameState(puzzle.id);
  navigate('game');
};
```

- [ ] **Step 5: Run the focused App test**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the App wiring**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
git add src/App.tsx src/App.test.tsx
git commit -m "feat: mark home intro seen on game start"
```

## Task 4: HomeScreen Demo Gating and Compact Layout

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/HomeScreen.module.css`
- Modify: `src/screens/HomeScreen.test.tsx`

- [ ] **Step 1: Mock the home intro helper in HomeScreen tests**

In `src/screens/HomeScreen.test.tsx`, add this mock after imports and before `afterEach`:

```ts
vi.mock('../lib/homeIntro', () => ({
  hasSeenHomeIntro: vi.fn(() => false),
  markHomeIntroSeen: vi.fn(),
}));
```

Update `afterEach`:

```ts
afterEach(async () => {
  window.history.replaceState({}, '', '/');
  sessionStorage.clear();
  const homeIntro = await import('../lib/homeIntro');
  (homeIntro.hasSeenHomeIntro as ReturnType<typeof vi.fn>).mockReturnValue(false);
  vi.clearAllMocks();
});
```

- [ ] **Step 2: Add tests for intro demo visibility**

Add these tests before `compacts home spacing on short mobile screens`:

```tsx
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

  expect(screen.getByText('Shaq is drafted by Orlando')).not.toBeNull();
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
```

- [ ] **Step 3: Add a test for app-mode suppression**

Add this test after the footer sign-in test:

```tsx
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
```

- [ ] **Step 4: Add a compact-layout CSS assertion**

Extend `compacts home spacing on short mobile screens` with:

```ts
expect(css).toMatch(/\.containerCompact\s*\{/);
expect(css).toMatch(/\.containerCompact\s+\.actions\s*\{/);
```

- [ ] **Step 5: Run the focused HomeScreen test to verify it fails**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/screens/HomeScreen.test.tsx
```

Expected: FAIL because `HomeScreen` always renders `LandingDemo`, does not mark app-mode sessions seen, does not hide the footer in app mode, and has no compact class yet.

- [ ] **Step 6: Implement HomeScreen behavior**

In `src/screens/HomeScreen.tsx`, change the React import:

```ts
import { useEffect, useMemo, useState } from 'react';
```

Add the intro helper import:

```ts
import { hasSeenHomeIntro, markHomeIntroSeen } from '../lib/homeIntro';
```

After `const hideAuthControls = isAppMode();`, add:

```ts
const showIntroDemo = !hideAuthControls && !isAuthenticated && !hasSeenHomeIntro();
```

Add this effect before `const sportOptions = useMemo(...)`:

```ts
useEffect(() => {
  if (hideAuthControls) {
    markHomeIntroSeen();
  }
}, [hideAuthControls]);
```

Change the root element:

```tsx
<div className={`${styles.container} ${showIntroDemo ? '' : styles.containerCompact}`}>
```

Render the demo conditionally:

```tsx
{showIntroDemo && <LandingDemo />}
```

Wrap the footer CTA so it does not render in app mode:

```tsx
{!hideAuthControls && (
  <p className={styles.footerCta}>
    Played before?{' '}
    <button type="button" className={styles.footerLink} onClick={() => onNavigateAuth('home')}>
      Sign In
    </button>
  </p>
)}
```

- [ ] **Step 7: Implement compact layout CSS**

In `src/screens/HomeScreen.module.css`, add after `.container`:

```css
.containerCompact {
  justify-content: center;
  gap: 44px;
}

.containerCompact .actions {
  gap: 16px;
}
```

In the existing `@media (max-height: 760px)` block, add:

```css
  .containerCompact {
    gap: 32px;
  }

  .containerCompact .actions {
    gap: 10px;
  }
```

- [ ] **Step 8: Run the focused HomeScreen test**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/screens/HomeScreen.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Run the combined focused test set**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run src/lib/homeIntro.test.ts src/context/AuthContext.test.tsx src/App.test.tsx src/screens/HomeScreen.test.tsx src/lib/appMode.test.ts src/lib/navigation.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit the home wiring**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
git add src/screens/HomeScreen.tsx src/screens/HomeScreen.module.css src/screens/HomeScreen.test.tsx
git commit -m "feat: show compact home after intro"
```

## Task 5: Full Verification

**Files:**
- No source edits unless verification reveals a defect.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npx vitest run
```

Expected: PASS.

- [ ] **Step 2: Run the production build**

Run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npm run build
```

Expected: PASS.

- [ ] **Step 3: Optional visual smoke check**

If a dev server can be started in the environment, run:

```bash
cd /Users/dvglz/Documents/gameee/rewind
npm run dev -- --host 127.0.0.1
```

Open these URLs:

- `http://127.0.0.1:5173/` - first-time web home should show the landing demo and footer sign-in.
- `http://127.0.0.1:5173/?from=app` - app-mode home should hide the demo and footer sign-in.

If port `5173` is occupied, use the Vite-assigned fallback port printed in the terminal.

- [ ] **Step 4: Commit any verification fixes**

If verification required source fixes, commit them:

```bash
cd /Users/dvglz/Documents/gameee/rewind
git add <fixed-files>
git commit -m "fix: stabilize home intro persistence"
```

If verification did not require source fixes, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers intro-only demo rendering, compact home, successful Start/Resume marking from `App.startGame()`, successful sign-in marking, app-mode first-session marking, app-mode footer hiding, web sign-out clearing, and test coverage.
- Placeholder scan: No TBD/TODO/later placeholders remain. The only optional step is explicitly a visual smoke check and is not required for functional completion.
- Type consistency: Helper names are consistently `hasSeenHomeIntro`, `markHomeIntroSeen`, and `clearHomeIntroSeen`; app mode remains `isAppMode()` / `?from=app`.
