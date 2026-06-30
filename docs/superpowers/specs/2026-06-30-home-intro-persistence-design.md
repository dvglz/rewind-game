# Home Intro Persistence - Design

## Goal

Use the animated landing demo as an intro experience for new users, while giving regular players a compact home screen that does not replay the demo on every visit.

The compact home should keep the same core branding, headline, primary action, and puzzle date, but omit the demo block. App-mode sessions should also avoid web-only auth prompts.

## User Experience

Home has two presentation modes:

- **Intro home**: current home content with the animated `LandingDemo`, shown to anonymous web users who have not meaningfully engaged yet.
- **Compact home**: same home content without `LandingDemo`, shown to returning local users, authenticated users, and app-mode users.

The "Played before? Sign In" footer CTA remains web-only. It is hidden whenever app mode is active.

## Intro State Rules

Add one local persistence flag for the home intro.

- Mark the intro as seen after a successful Start or Resume action.
- Mark the intro as seen after successful Sign In, so direct sign-in users do not return to the animated intro.
- Mark the intro as seen during the first app-mode home session.
- Clear the intro-seen flag on web sign-out, so signing out deliberately restores the full intro home.

The flag is local to the browser/device. It is not synced to the backend.

## App Mode

Use the existing `isAppMode()` helper as the source of truth for app sessions. The current repo behavior keys app mode from `?from=app` and session storage, so this design does not introduce a separate literal `?app` mode unless the host app starts sending it.

When app mode is active:

- Hide `LandingDemo`.
- Hide "Played before? Sign In".
- Mark the intro as seen locally.
- Keep existing app-mode auth-route blocking behavior unchanged.

## Implementation Shape

Add a small focused helper for intro persistence, either in `src/lib/homeIntro.ts` or alongside the existing local storage helpers in `src/engine/storage.ts`.

The helper should expose:

- `hasSeenHomeIntro(): boolean`
- `markHomeIntroSeen(): void`
- `clearHomeIntroSeen(): void`

`HomeScreen` should compute whether to show `LandingDemo` from:

```ts
const appMode = isAppMode();
const showIntroDemo = !appMode && !isAuthenticated && !hasSeenHomeIntro();
```

Button handlers should mark the intro before delegating to existing navigation:

- Start/Resume: `markHomeIntroSeen(); onPlay();`
- Footer Sign In: route with `onNavigateAuth('home')`; do not mark intro seen until auth succeeds.
- Sign Out: call existing sign-out behavior, then clear the intro flag and show the current toast.

For successful sign-in, mark the intro in the auth success path, preferably when `AuthContext.setUser()` stores the authenticated user. This covers both footer-driven sign-in and direct auth links.

## Layout

When `LandingDemo` is absent, the home screen should use compact spacing rather than leaving an empty demo-sized gap. This can be handled with a conditional class on the home container or content area.

The compact layout should preserve:

- centered wordmark, headline, and description;
- primary action width and type style;
- puzzle meta using the existing `#NNN · Jun 30, 2026` format;
- enough vertical breathing room on mobile without pushing the primary button under browser chrome.

## Testing

Add focused tests for:

- anonymous first-time web users see `LandingDemo`;
- users with the intro-seen flag do not see `LandingDemo`;
- authenticated users do not see `LandingDemo`;
- app-mode users do not see `LandingDemo` and do not see "Played before? Sign In";
- Start/Resume marks intro seen before calling `onPlay`;
- footer Sign In routes to auth without marking intro seen;
- auth success marks intro seen for footer-driven and direct sign-in paths;
- sign-out clears the intro-seen flag.

Existing app-mode tests should continue to verify `?from=app` preservation and auth-route blocking.
