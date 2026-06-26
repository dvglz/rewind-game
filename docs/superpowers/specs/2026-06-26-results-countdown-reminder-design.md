# Results Countdown Reminder Design

## Goal

Add a lean sticky countdown reminder to the Rewind results screen. The reminder makes tomorrow's puzzle feel concrete, gives logged-out web users a clear "Notify Me" path into sign-in, and avoids backend notification scheduling in this pass.

## Scope

In scope:

- Daily results screen countdown reminder.
- Logged-out `Notify Me` CTA that routes to the existing auth screen.
- Reminder-focused auth screen copy.
- Theme-aware visual treatment based on the provided Figma frames:
  - Unauthed frame: `260:583`
  - Authed frame: `260:588`

Out of scope:

- Creating notification schedules on the backend.
- Email, push, or unsubscribe backend behavior.
- User-selectable reminder timing.
- Rank hook, round breakdown, or other untracked results experiments.

## User Experience

The reminder appears only on non-practice results.

Logged-out web users see:

- Rewind glyph.
- `New Game in HH:MM:SS`
- Underlined `Notify Me` action.

Tapping `Notify Me` opens the existing sign-in screen with `returnTo=results`. The auth subtitle is:

`Get notified when tomorrow's puzzle drops. No spam. Unsubscribe anytime.`

Authenticated web users and app-mode users see only:

- Rewind glyph.
- `New Game in HH:MM:SS`

Practice/archive results do not show the sticky reminder, because those sessions are not about waiting for tomorrow's daily puzzle.

## Visual Design

The reminder is a sticky bottom band inside the results screen.

It matches the Figma structure and proportions:

- Horizontal layout.
- Glyph and countdown grouped together with a small gap.
- Optional CTA spaced after the countdown.
- 16px vertical padding.
- Condensed display type at roughly 22px.
- Tabular countdown numbers.

The band reflects the active theme by inverting against the page:

- Light theme results page: dark band background, light text.
- Dark theme results page: light band background, dark text.

This keeps the reminder visually prominent without adding decorative cards. Results content needs enough bottom padding so the sticky band never covers the share/account/friends controls.

## Architecture

Keep the implementation small:

- Reuse the existing countdown time logic from `src/lib/countdown.ts`.
- Adapt or replace the existing untracked `CountdownBar` component with a results-specific component named `ResultsCountdownReminder`.
- Render the component from `ResultsScreen` for non-practice results.
- Pass auth state into the component so it can decide whether to show `Notify Me`.
- Reuse the existing `onRequireAuth` navigation path, but let `App` provide reminder-specific auth copy when the return reason is reminder.

The URL/navigation state stays simple. Use `authReason=reminder` to distinguish this from the existing rank/friends auth gate while preserving `returnTo=results`.

## Data Flow

1. `ResultsScreen` knows the current puzzle and auth state.
2. `ResultsCountdownReminder` computes remaining time to the next reset using `msToNextReset()`.
3. The countdown updates every second while visible.
4. Logged-out `Notify Me` calls a results callback.
5. `App` routes to auth with `returnTo=results` plus reminder context.
6. `AuthScreen` displays the reminder-specific subtitle.
7. Successful auth returns to results using the existing auth success flow.

No backend reminder request is made.

## Error Handling

The countdown is local-only and does not block results rendering. If auth is unavailable or app mode is active, the component does not show a broken CTA. It degrades to countdown-only.

## Analytics

Track the reminder CTA tap as a lightweight event:

- `notify_me_click`
- Params: `game_number`, `is_authenticated: false`

No PII is sent. Auth success tracking remains unchanged.

## Testing

Add focused tests:

- Logged-out results show `Notify Me` and tapping it invokes auth navigation.
- Logged-in results show the countdown but not `Notify Me`.
- App mode does not show `Notify Me`.
- Practice results do not render the reminder.
- Auth screen shows reminder-specific copy when routed from the reminder CTA.
- Countdown formatting remains covered by the existing countdown tests.

Run at least:

- `npx vitest run src/screens/ResultsScreen.test.tsx src/App.test.tsx src/components/CountdownBar.test.tsx src/lib/countdown.test.ts`
- `npm run build`
