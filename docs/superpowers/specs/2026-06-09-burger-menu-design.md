# Burger Menu Design

## Goal

Replace the existing dropdown `BurgerMenu` with a full-screen overlay menu that provides top-level navigation, settings, and auth actions without interfering with gameplay flows.

## Current Context

The current menu is a small top-right dropdown used on `HomeScreen` with a single `Groups` action. Recent app work has added auth flows, theme preference handling, and more top-level destinations, so the existing menu no longer matches the information architecture of the app.

## Scope

- Create a new full-screen `MenuOverlay` component
- Update `BurgerMenu` so it becomes a trigger for the overlay instead of rendering a dropdown
- Add a persisted `Sound & Haptics` preference
- Reuse the existing `ThemeSwitch` inside the overlay
- Show auth state and sign-in/sign-out actions in the overlay
- Add burger menu access on all top-level screens only

## Out Of Scope

- A dedicated standalone `How to Play` screen
- New sound effect infrastructure
- Changes to gameplay, ordering, or group-detail flows
- Refactoring auth or navigation beyond what is required to expose menu actions cleanly

## Menu Structure

The overlay is split into two sections separated by a visual divider.

### Top Section: Navigation

- `Today's Game`
  - If a game is in progress, navigate to the active gameplay flow
  - Otherwise navigate to `Home`
- `Leaderboard`
  - Navigate to `Results`
- `Groups`
  - Navigate to `Groups`
- `How to Play`
  - Navigate to `Home`, using the existing home description as the instructional landing area for now

The current top-level destination is visually marked as active and is not interactive.

### Bottom Section: Settings And Meta

- `Sound & Haptics`
  - Single toggle
  - Default is enabled
  - Persists to `localStorage` key `rewind_haptics_enabled`
- `Appearance`
  - Reuse existing `ThemeSwitch`
  - Uses the existing theme-preference persistence path

After a divider:

- `Share Feedback`
  - Opens a configurable `mailto:` or feedback URL
- `Check Clutch Play`
  - Opens `https://play.clutchpoints.com` in a new tab
- `Auth Row`
  - Signed out: `Sign In`, navigates to auth with `returnTo` set to the current top-level screen
  - Signed in: show truncated email plus a distinct `Sign Out` action

## Visual And Motion Direction

- Full-screen takeover overlay using `100vw` x `100dvh`
- Solid background `var(--color-bg)`
- No transparency or blurred app backdrop
- Overlay sits above all screen content with a dedicated high `z-index`
- Open animation: fade plus subtle scale from `0.97` to `1` over about `200ms`
- Close animation: fade out over about `150ms`
- Menu items fade in with a short stagger, opacity-only, no vertical translation

The menu should feel like app-level navigation, not a popover or utility tray.

## Trigger And Placement

The trigger remains in the same top-right position as the current burger icon. When the overlay is open, the overlay shows a close `X` in that same corner position.

The burger icon appears only on these top-level screens:

- `Home`
- `Results`
- `Groups`
- `Auth`

The burger icon does not appear on:

- `GameScreen`
- `OrderingScreen`
- group detail states
- modal surfaces
- other nested or task-focused views

## Interaction Behavior

### Opening

- User taps the burger icon
- Overlay mounts above the app
- Interaction is locked to the overlay surface

### Closing

- User taps the `X`
- User presses `Escape`
- User taps a navigation or external/auth action that leaves the current flow

### Non-Closing Interactions

These keep the overlay open so the user can adjust multiple settings in one pass:

- `Sound & Haptics`
- `Appearance`

### Navigation Rules

- Tapping a non-active nav item closes the overlay first, then runs navigation
- Tapping the active nav item does nothing
- `Today's Game` acts as a resume entry point when a game is already in progress

## Component Architecture

### `BurgerMenu`

`BurgerMenu` remains a small reusable trigger component. It should own only the local open/close state and button rendering for the top-right icon.

### `MenuOverlay`

`MenuOverlay` owns:

- full-screen layout
- section rendering
- active-item presentation
- close button
- escape-key handling
- open/close animation state

`MenuOverlay` should stay mostly presentational. It receives state and actions from its parent instead of discovering navigation rules internally.

### App-Level Ownership

Screen or app-level code should provide:

- the current top-level screen key
- whether a game is in progress
- callbacks for top-level navigation targets
- feedback and external-link targets
- auth state and `signOut`

This keeps routing and auth decisions in the existing application state layer rather than inside the overlay UI.

## Preferences

### Sound And Haptics

Add a `useHapticsEnabled()` hook as the persistence boundary for the new preference.

- Reads the `rewind_haptics_enabled` value
- Defaults to enabled when no value exists
- Updates `localStorage` when toggled

`lib/haptics.ts` becomes the enforcement boundary:

- existing vibration helpers remain the public API
- each helper becomes a no-op when haptics are disabled

That approach avoids scattering toggle checks throughout gameplay and UI code.

### Appearance

Reuse `ThemeSwitch` directly inside the overlay. The existing `useThemePreference` behavior remains the source of truth for appearance.

## Auth Behavior

The overlay derives auth state from `useAuth()`.

### Signed Out

- Show a `Sign In` row
- Close the overlay
- Navigate to auth with `returnTo` set to the current top-level screen

### Signed In

- Show a truncated email value as status text
- Show a separate `Sign Out` action
- On sign-out, close the overlay and call the existing `signOut()` path

The overlay should not add its own auth state layer. It reacts to existing auth state only.

## Edge Cases

- If auth state is still hydrating, render stable fallback text instead of shifting layout
- If the signed-in user has no email available, use a safe fallback label
- External-link actions close the overlay when the action starts
- The menu must not appear above modals or nested screens that are intentionally focused on a task

## Files

- Create `src/components/MenuOverlay.tsx`
- Create `src/components/MenuOverlay.module.css`
- Modify `src/components/BurgerMenu.tsx`
- Modify `src/components/BurgerMenu.module.css`
- Create `src/hooks/useHapticsEnabled.ts`
- Modify `src/lib/haptics.ts`
- Modify `src/screens/HomeScreen.tsx`
- Modify `src/screens/ResultsScreen.tsx`
- Modify `src/screens/GroupsScreen.tsx`
- Modify `src/screens/AuthScreen.tsx`
- Modify `src/App.tsx`

## Verification Targets

Implementation verification should cover:

- burger icon appears only on allowed top-level screens
- overlay opens and closes correctly
- active nav item is visibly current and non-interactive
- non-active nav items close then navigate
- `Today's Game` routes correctly based on in-progress state
- settings remain open after interaction
- haptics preference persists and disables vibration helpers
- auth row renders correct signed-in or signed-out behavior
- `Escape` closes the overlay on keyboard-capable devices

## Recommended Implementation Shape

This is one bounded feature and should be implemented as a single plan. The design deliberately avoids introducing a new global menu state manager, a new route layer, or separate settings infrastructure. The simplest correct shape is:

- app-owned navigation callbacks
- a lightweight trigger component
- a dedicated full-screen overlay component
- one new persisted preference hook

That keeps the work focused and low-risk while still making the menu feel like a first-class navigation surface.
