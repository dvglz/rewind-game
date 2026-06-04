# Dark Theme Design

Date: 2026-06-04
Branch: `feature/dark-theme`

## Goal

Add a polished dark theme to Rewind without changing layout, spacing, motion, or gameplay behavior. Provide a user-facing theme switch with `system`, `light`, and `dark` modes, persist the choice locally, and update the browser theme color to match the active theme.

## Scope

In scope:

- Add a dark visual system based on charcoal neutrals rather than pure black
- Preserve current success, warning, and error color brightness
- Support `system`, `light`, and `dark` theme modes
- Persist user theme preference locally
- Follow OS theme changes while in `system` mode
- Update the browser `theme-color` meta value at runtime
- Replace remaining hardcoded light-only neutral colors with semantic tokens where needed

Out of scope:

- Layout changes
- Typography changes
- Animation changes
- Gameplay, scoring, puzzle, or results logic changes

## UX Behavior

### Theme modes

- `system`: follows `prefers-color-scheme`
- `light`: always uses the light theme
- `dark`: always uses the dark theme

### Default behavior

- New users start in `system`
- The resolved active theme is computed from:
  - explicit user preference if set to `light` or `dark`
  - OS preference if set to `system`

### Persistence

- Store the theme preference in local storage
- Persist only the selected mode (`system`, `light`, or `dark`), not the resolved theme

### Runtime updates

- When the selected mode is `system`, the app listens for `prefers-color-scheme` changes and updates immediately
- When the selected mode is `light` or `dark`, OS changes are ignored

## Visual Design

### Dark theme direction

- Editorial charcoal, not OLED black
- Warm off-white text rather than pure white
- Low-contrast slate borders
- Muted copy remains readable against the darker background
- Existing success/yellow/orange/red accents retain their current brightness so gameplay feedback stays vivid

### Palette direction

Representative dark values:

- `--color-bg: #17181C`
- `--color-text: #F3F1EB`
- `--color-border: #343741`
- `--color-muted: #9DA3AE`

The exact values can be tuned during implementation, but the theme should stay in this neutral charcoal range and avoid blue-heavy or purple-heavy dark grays.

### Layout constraint

No layout or geometry changes are allowed as part of this work. Existing spacing, control sizes, and timeline positioning remain unchanged.

## Architecture

### Theme model

Introduce two concepts:

- `ThemePreference`: `system | light | dark`
- `ResolvedTheme`: `light | dark`

The app stores the preference and computes the resolved theme from it.

### Theme application

- Apply the resolved theme via a root attribute on `document.documentElement`, for example `data-theme="dark"`
- CSS tokens are declared for light by default and overridden under `[data-theme="dark"]`
- Components continue consuming semantic tokens instead of hardcoded colors

### Theme controller

Add a small theme utility or hook responsible for:

- reading the saved preference on startup
- resolving the active theme
- listening to `matchMedia('(prefers-color-scheme: dark)')` when preference is `system`
- applying the root attribute
- updating `meta[name="theme-color"]`
- writing preference changes back to local storage

This logic should stay separate from individual screen components.

## UI Integration

### Theme switcher

Add a visible control for:

- `System`
- `Light`
- `Dark`

The control should be implemented using existing UI patterns where possible and should not introduce a layout rewrite. Placement can be within existing settings/debug/home UI surfaces, but the interaction must be user-accessible and not hidden.

### Browser theme color

- `index.html` keeps a baseline `theme-color`
- runtime logic updates the `theme-color` meta tag to the active theme background
- for dark mode, use the main dark background color

## CSS and Tokens

### Token changes

Update `src/styles/tokens.css` to support:

- light theme semantic tokens
- dark theme semantic token overrides

Existing accent tokens remain semantically named and retain near-current brightness.

### Neutral cleanup

Replace hardcoded neutral values in component CSS with semantic tokens where needed, especially values that currently assume a light background, such as:

- muted descriptive text
- unrevealed/revealed minor timeline labels
- low-emphasis body copy

The goal is to make dark mode complete without introducing component-specific layout changes.

## Error Handling

- If local storage is unavailable, fall back to `system`
- If `matchMedia` is unavailable, treat `system` as `light`
- If the theme meta tag cannot be found, the theme still applies visually; only browser chrome color remains unchanged

## Testing

### Automated

Add tests for:

- preference resolution for `system`, `light`, and `dark`
- persistence behavior
- OS theme change handling while in `system`
- no OS-driven change while in explicit `light` or `dark`
- runtime theme-color meta updates

### Manual verification

Check:

- home, game, and results screens in light and dark
- timeline legibility in both themes
- badge colors and result colors remain bright enough in dark mode
- theme switch persists across reload
- `system` tracks OS preference

## Risks

### Incomplete dark neutral conversion

Risk:
- leftover hardcoded grays make dark mode feel unfinished

Mitigation:
- replace all obvious hardcoded neutral values encountered in shared UI styles with semantic tokens

### Theme flicker on load

Risk:
- app may briefly render light before switching to dark

Mitigation:
- initialize theme as early as practical from saved preference before or during app bootstrap

## Implementation Notes

- Keep the implementation small and token-driven
- Prefer central theme logic over scattered conditional styling
- Avoid per-component theme branching unless a token-based approach is insufficient
