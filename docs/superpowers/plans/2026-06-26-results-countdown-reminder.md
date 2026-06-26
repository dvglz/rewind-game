# Results Countdown Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky theme-inverted countdown reminder to the daily results screen, with logged-out `Notify Me` routing to auth copy only.

**Architecture:** Keep countdown math in `src/lib/countdown.ts`, render a focused `ResultsCountdownReminder` component from `ResultsScreen`, and let `App` encode the reminder auth reason with `authReason=reminder`. The auth screen remains generic; it only receives a context message from `App`.

**Tech Stack:** Vite, React, TypeScript, CSS modules, Vitest, Testing Library.

---

## File Structure

- Create `src/components/ResultsCountdownReminder.tsx`: results-only sticky reminder component, countdown timer, optional CTA.
- Create `src/components/ResultsCountdownReminder.module.css`: theme-inverted sticky bar styling.
- Create `src/components/ResultsCountdownReminder.test.tsx`: component unit tests for logged-out, logged-in, app-mode, and timer rendering.
- Modify `src/screens/ResultsScreen.tsx`: import and render the reminder for non-practice results; pass a reminder auth callback.
- Modify `src/screens/ResultsScreen.module.css`: add bottom padding for the sticky reminder and remove the old normal-results footer path.
- Modify `src/screens/ResultsScreen.test.tsx`: assert results behavior wires `Notify Me`, hides reminder in practice, and keeps app mode CTA-free.
- Modify `src/App.tsx`: add `navigateToReminderAuth()` and reminder-specific `AuthScreen.contextMessage`.
- Modify `src/App.test.tsx`: mock `ResultsScreen` and `AuthScreen` props enough to verify reminder auth navigation and copy.
- Keep existing untracked `RankHook*`, `RoundBreakdown*`, and `resultsCopy*` files untouched.

---

### Task 1: Countdown Reminder Component

**Files:**
- Create: `src/components/ResultsCountdownReminder.tsx`
- Create: `src/components/ResultsCountdownReminder.module.css`
- Create: `src/components/ResultsCountdownReminder.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `src/components/ResultsCountdownReminder.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ResultsCountdownReminder } from './ResultsCountdownReminder';

afterEach(() => {
  vi.useRealTimers();
});

test('shows countdown and Notify Me for logged-out web users', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));
  const onNotify = vi.fn();

  render(<ResultsCountdownReminder showNotifyCta onNotify={onNotify} />);

  expect(screen.getByText('New Game in 23:00:00')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Notify Me' }));
  expect(onNotify).toHaveBeenCalledTimes(1);
});

test('omits Notify Me for authenticated users and app mode', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));

  render(<ResultsCountdownReminder showNotifyCta={false} onNotify={vi.fn()} />);

  expect(screen.getByText('New Game in 23:00:00')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Notify Me' })).toBeNull();
});

test('updates the countdown every second', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T08:00:00Z'));

  render(<ResultsCountdownReminder showNotifyCta onNotify={vi.fn()} />);

  expect(screen.getByText('New Game in 23:00:00')).toBeTruthy();

  act(() => {
    vi.setSystemTime(new Date('2026-06-24T08:00:01Z'));
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByText('New Game in 22:59:59')).toBeTruthy();
});
```

- [ ] **Step 2: Run the new component tests to verify they fail**

Run: `npx vitest run src/components/ResultsCountdownReminder.test.tsx`

Expected: FAIL because `./ResultsCountdownReminder` does not exist.

- [ ] **Step 3: Implement the component**

Create `src/components/ResultsCountdownReminder.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { RewindGlyph } from './icons';
import { formatCountdown, msToNextReset } from '../lib/countdown';
import styles from './ResultsCountdownReminder.module.css';

interface ResultsCountdownReminderProps {
  showNotifyCta: boolean;
  onNotify: () => void;
}

export function ResultsCountdownReminder({ showNotifyCta, onNotify }: ResultsCountdownReminderProps) {
  const [remaining, setRemaining] = useState(() => msToNextReset());

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(msToNextReset());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className={styles.reminder} aria-label="Next Rewind puzzle">
      <div className={styles.countdownGroup}>
        <RewindGlyph className={styles.glyph} aria-hidden="true" />
        <span className={styles.countdown}>New Game in {formatCountdown(remaining)}</span>
      </div>
      {showNotifyCta && (
        <button className={styles.notifyButton} type="button" onClick={onNotify}>
          Notify Me
        </button>
      )}
    </section>
  );
}
```

Create `src/components/ResultsCountdownReminder.module.css`:

```css
.reminder {
  position: sticky;
  bottom: 0;
  z-index: 5;
  width: 100%;
  min-height: 54px;
  padding: 16px max(16px, env(safe-area-inset-left)) calc(16px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right));
  background: var(--color-text);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 22px;
  line-height: 1;
}

[data-theme="dark"] .reminder {
  background: var(--color-text);
  color: var(--color-bg);
}

.countdownGroup {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.glyph {
  width: 22px;
  height: 12px;
  flex: 0 0 auto;
}

.countdown {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.notifyButton {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  color: color-mix(in srgb, currentColor 70%, transparent);
  font: inherit;
  line-height: 1;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.notifyButton:active {
  transform: scale(0.96);
}

@media (max-width: 360px) {
  .reminder {
    gap: 8px;
    font-size: 20px;
    padding-left: 12px;
    padding-right: 12px;
  }

  .countdownGroup {
    gap: 8px;
  }
}
```

- [ ] **Step 4: Run the component tests to verify they pass**

Run: `npx vitest run src/components/ResultsCountdownReminder.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the component**

```bash
git add src/components/ResultsCountdownReminder.tsx src/components/ResultsCountdownReminder.module.css src/components/ResultsCountdownReminder.test.tsx
git commit -m "feat: add results countdown reminder component"
```

---

### Task 2: Wire Reminder Into Results Screen

**Files:**
- Modify: `src/screens/ResultsScreen.tsx`
- Modify: `src/screens/ResultsScreen.module.css`
- Modify: `src/screens/ResultsScreen.test.tsx`

- [ ] **Step 1: Write failing ResultsScreen tests**

In `src/screens/ResultsScreen.test.tsx`, add these tests near the existing logged-out/app/practice result tests:

```tsx
test('logged-out daily results show Notify Me and route to auth', () => {
  const onRequireAuth = vi.fn();
  mockAuthed = false;

  render(
    <ResultsScreen
      onHome={() => {}}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={onRequireAuth}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Notify Me' }));

  expect(onRequireAuth).toHaveBeenCalledWith('reminder');
});

test('logged-in daily results show countdown without Notify Me', () => {
  mockAuthed = true;

  render(
    <ResultsScreen
      onHome={() => {}}
      onGroups={() => {}}
      onLeaderboard={() => {}}
      onRequireAuth={() => {}}
    />
  );

  expect(screen.getByLabelText('Next Rewind puzzle')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Notify Me' })).toBeNull();
});
```

Update the existing `practice mode shows Play Again + Back to Archive and skips the remote fetch` test with:

```tsx
expect(screen.queryByLabelText('Next Rewind puzzle')).toBeNull();
```

Update the existing `hides the sign-in prompt when in app mode` test with:

```tsx
expect(screen.getByLabelText('Next Rewind puzzle')).toBeTruthy();
expect(screen.queryByRole('button', { name: 'Notify Me' })).toBeNull();
```

- [ ] **Step 2: Run ResultsScreen tests to verify they fail**

Run: `npx vitest run src/screens/ResultsScreen.test.tsx`

Expected: FAIL because `Notify Me` is not rendered and `onRequireAuth` does not accept the reminder reason yet.

- [ ] **Step 3: Update ResultsScreen props and render the reminder**

In `src/screens/ResultsScreen.tsx`, add the import:

```tsx
import { ResultsCountdownReminder } from '../components/ResultsCountdownReminder';
```

Change the props interface:

```tsx
type AuthReason = 'default' | 'reminder';

interface ResultsScreenProps {
  onHome: () => void;
  onGroups: () => void;
  onLeaderboard: () => void;
  onRequireAuth: (reason?: AuthReason) => void;
  onBackToArchive?: () => void;
  onPlayAgain?: () => void;
}
```

Remove the normal-results footer block:

```tsx
{!practice && (
  <div className={styles.footer} style={{ animationDelay: '780ms' }}>
    <RewindGlyph className={styles.rewindGlyph} />
    <p className={styles.motivational}>
      New questions drop daily.
      <br />
      Get back tomorrow.
    </p>
  </div>
)}
```

Add the sticky reminder after the content div and before toasts:

```tsx
      </div>
      {!practice && (
        <ResultsCountdownReminder
          showNotifyCta={!isAuthenticated && !appMode}
          onNotify={() => {
            track('notify_me_click', {
              game_number: puzzle.number,
              is_authenticated: false,
            });
            onRequireAuth('reminder');
          }}
        />
      )}
      {showMotivational && <Toast message={motivationalLabel} />}
```

Remove the unused `RewindGlyph` import from `ResultsScreen.tsx`.

- [ ] **Step 4: Update ResultsScreen CSS**

In `src/screens/ResultsScreen.module.css`, change `.content` padding:

```css
.content {
  --results-action-width: min(280px, calc(100vw - 48px));
  flex: 1;
  width: 100%;
  max-width: 400px;
  padding: 16px 24px 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  overflow-y: auto;
  touch-action: pan-y;
  scrollbar-width: none;
}
```

In the `@media (min-width: 900px)` block, change `.content` padding:

```css
  .content {
    max-width: 480px;
    padding: 24px 32px 104px;
    gap: 16px;
  }
```

Delete these obsolete normal-results footer selectors:

```css
.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
}

.rewindGlyph {
  width: 64px;
  height: 35px;
  color: var(--color-text);
}

.motivational {
  text-align: center;
  font-family: var(--font-display);
  font-size: 32px;
  line-height: 1.1;
  color: var(--color-text);
  max-width: 28ch;
  margin-top: 6px;
}
```

Also remove `.footer` from the animation selector:

```css
.shareButton,
.descriptionLine,
.contextLine {
  opacity: 0;
  animation: fadeInUp 0.35s ease forwards;
}
```

- [ ] **Step 5: Run ResultsScreen tests to verify they pass**

Run: `npx vitest run src/screens/ResultsScreen.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit ResultsScreen wiring**

```bash
git add src/screens/ResultsScreen.tsx src/screens/ResultsScreen.module.css src/screens/ResultsScreen.test.tsx
git commit -m "feat: show countdown reminder on results"
```

---

### Task 3: Route Notify Me To Reminder Auth Copy

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing App test for reminder auth copy**

In `src/App.test.tsx`, update the `ResultsScreen` mock to expose the callback:

```tsx
vi.mock('./screens/ResultsScreen', () => ({
  ResultsScreen: ({ onRequireAuth }: { onRequireAuth: (reason?: 'default' | 'reminder') => void }) => (
    <div data-testid="results-screen">
      results
      <button type="button" onClick={() => onRequireAuth('reminder')}>Notify Me</button>
    </div>
  ),
}));
```

Update the `AuthScreen` mock to render its context message:

```tsx
vi.mock('./screens/AuthScreen', () => ({
  AuthScreen: ({ contextMessage }: { contextMessage?: string }) => (
    <div data-testid="auth-screen">{contextMessage ?? 'auth'}</div>
  ),
}));
```

Add this test:

```tsx
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

  screen.getByRole('button', { name: 'Notify Me' }).click();

  await waitFor(() => {
    expect(screen.getByTestId('auth-screen').textContent).toBe(
      "Get notified when tomorrow's puzzle drops. No spam. Unsubscribe anytime.",
    );
  });
  expect(window.location.search).toContain('returnTo=results');
  expect(window.location.search).toContain('authReason=reminder');
});
```

- [ ] **Step 2: Run App test to verify it fails**

Run: `npx vitest run src/App.test.tsx`

Expected: FAIL because `ResultsScreen` is currently passed `onRequireAuth={() => navigateToAuth('results')}` and no `authReason` is written.

- [ ] **Step 3: Implement reminder auth routing in App**

In `src/App.tsx`, add this constant near the top-level constants:

```tsx
const REMINDER_AUTH_MESSAGE = "Get notified when tomorrow's puzzle drops. No spam. Unsubscribe anytime.";
```

Add a helper after `navigateToAuth`:

```tsx
  const navigateToReminderAuth = () => {
    if (appMode) return;
    const params = new URLSearchParams(window.location.search);
    params.set('mode', 'auth');
    params.set('returnTo', 'results');
    params.set('authReason', 'reminder');
    const nextSearch = params.toString();
    window.history.pushState({}, '', `/?${nextSearch}`);
    setScreen('auth');
    trackPageView('auth');
  };
```

Change the results screen prop:

```tsx
          onRequireAuth={(reason) => {
            if (reason === 'reminder') {
              navigateToReminderAuth();
              return;
            }
            navigateToAuth('results');
          }}
```

Add an auth reason helper near `getReturnTo`:

```tsx
  const getAuthReason = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get('authReason');
  };
```

In `handleAuthSuccess`, after reading `returnTo`, clear stale auth reason before navigating:

```tsx
    const returnTo = getReturnTo();
    const params = new URLSearchParams(window.location.search);
    params.delete('authReason');
    const nextWithoutReason = params.toString();
    window.history.replaceState({}, '', nextWithoutReason ? `/?${nextWithoutReason}` : '/');
```

Keep the existing return handling after that.

Change the `AuthScreen` `contextMessage` expression:

```tsx
            contextMessage={
              pendingInvite
                ? "You'll join a group right after signing in"
                : getReturnTo() === 'archive'
                  ? 'Sign in to keep playing past puzzles'
                  : getAuthReason() === 'reminder'
                    ? REMINDER_AUTH_MESSAGE
                    : undefined
            }
```

- [ ] **Step 4: Run App tests to verify they pass**

Run: `npx vitest run src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit auth routing**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: route results reminder to auth copy"
```

---

### Task 4: Final Verification

**Files:**
- Verify all files touched in Tasks 1-3.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npx vitest run src/components/ResultsCountdownReminder.test.tsx src/screens/ResultsScreen.test.tsx src/App.test.tsx src/lib/countdown.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full build**

Run:

```bash
npm run build
```

Expected: PASS, with Vite producing `dist/`.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short --branch
```

Expected:

- Branch `dev`.
- New implementation commits ahead of `origin/dev`.
- Pre-existing unrelated untracked `RankHook*`, `RoundBreakdown*`, `resultsCopy*`, and old `CountdownBar*` files may still be present unless superseded by this implementation.

- [ ] **Step 4: Final implementation commit if verification changed files**

If formatting or snapshots changed during verification, commit only files related to the reminder:

```bash
git add src/components/ResultsCountdownReminder.tsx src/components/ResultsCountdownReminder.module.css src/components/ResultsCountdownReminder.test.tsx src/screens/ResultsScreen.tsx src/screens/ResultsScreen.module.css src/screens/ResultsScreen.test.tsx src/App.tsx src/App.test.tsx
git commit -m "test: verify results countdown reminder"
```

Skip this commit if there are no additional reminder changes after the Task 1-3 commits.

---

## Self-Review

- Spec coverage: Tasks 1-3 cover the sticky countdown, logged-out `Notify Me`, auth copy with unsubscribe wording, theme-inverted styling, no backend request, app-mode CTA removal, and practice exclusion.
- Placeholder scan: no `TBD`, `TODO`, "similar to", or unspecified test/error-handling steps remain.
- Type consistency: `AuthReason`, `ResultsCountdownReminderProps`, `authReason=reminder`, and `REMINDER_AUTH_MESSAGE` are used consistently across component, screen, app, and tests.
