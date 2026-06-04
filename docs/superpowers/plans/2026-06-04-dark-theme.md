# Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished charcoal dark theme with `system / light / dark` switching, persistent preference storage, and runtime `theme-color` updates without changing layout.

**Architecture:** Theme resolution stays centralized in a small theme module plus a React hook that applies a `data-theme` attribute and updates the browser meta color. UI surfaces continue using semantic tokens, with a small visible switch control on the home screen and dark-safe neutral cleanup in existing CSS.

**Tech Stack:** React 19, TypeScript, Vite, CSS Modules, Vitest, Testing Library

---

## File Structure

### Create

- `src/lib/theme.ts` — pure theme constants and browser-safe helpers for preference storage, system theme detection, theme resolution, root attribute application, and `theme-color` updates
- `src/lib/theme.test.ts` — unit tests for theme resolution and browser interaction helpers
- `src/hooks/useThemePreference.ts` — React hook that reads preference, listens for system changes, applies theme, and exposes setters
- `src/hooks/useThemePreference.test.tsx` — hook tests for persistence and `matchMedia` behavior
- `src/components/ThemeSwitch.tsx` — segmented control for `System / Light / Dark`
- `src/components/ThemeSwitch.module.css` — token-driven styles for the switch
- `src/components/ThemeSwitch.test.tsx` — render and interaction tests for the switch

### Modify

- `src/App.tsx` — install the theme hook once at the app root and pass theme state to `HomeScreen`
- `src/screens/HomeScreen.tsx` — render the visible theme switch without changing screen structure materially
- `src/screens/HomeScreen.module.css` — add a small theme control area that fits the current home layout
- `src/styles/tokens.css` — split light tokens from dark overrides under `[data-theme="dark"]`
- `src/styles/global.css` — ensure global background/text use semantic tokens only
- `src/components/Timeline.module.css` — replace light-only grays with semantic muted colors
- `src/screens/GameScreen.module.css` — replace light-only neutral copy with semantic muted colors
- `index.html` — set a dark-safe baseline `theme-color` meta value that runtime code will override

### Optional touchpoints only if needed during implementation

- `src/components/ShareCard.module.css` — only if a hardcoded light neutral is discovered during review
- `src/components/Header.module.css` — only if dark contrast shows a token gap rather than a layout issue
- `src/screens/ResultsScreen.tsx` — only if inline styles need a missing semantic token, not for layout changes

---

### Task 1: Build the theme engine

**Files:**
- Create: `src/lib/theme.ts`
- Test: `src/lib/theme.test.ts`

- [ ] **Step 1: Write the failing theme helper tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  getStoredThemePreference,
  resolveTheme,
  setStoredThemePreference,
  applyResolvedTheme,
  updateThemeColorMeta,
} from './theme';

describe('resolveTheme', () => {
  it('returns explicit light and dark preferences unchanged', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('maps system preference to the current OS scheme', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('storage helpers', () => {
  it('falls back to system when no stored preference exists', () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    expect(getStoredThemePreference()).toBe(DEFAULT_THEME_PREFERENCE);
  });

  it('stores only valid preferences', () => {
    setStoredThemePreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});

describe('DOM helpers', () => {
  it('applies data-theme to documentElement', () => {
    applyResolvedTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('updates the browser theme-color meta tag', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#ffffff" />';
    updateThemeColorMeta('#17181C');
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
    ).toBe('#17181C');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/theme.test.ts`

Expected: FAIL with module-not-found or missing export errors for `./theme`

- [ ] **Step 3: Write the minimal theme engine**

```ts
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'rewind_theme_preference';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

const VALID_PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return prefersDark ? 'dark' : 'light';
}

export function getStoredThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return VALID_PREFERENCES.includes(stored as ThemePreference)
      ? (stored as ThemePreference)
      : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function setStoredThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage failures and keep runtime state alive
  }
}

export function getSystemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme;
}

export function updateThemeColorMeta(color: string): void {
  const node = document.querySelector('meta[name="theme-color"]');
  if (node) node.setAttribute('content', color);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/theme.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat: add theme preference engine"
```

### Task 2: Add the React theme controller

**Files:**
- Create: `src/hooks/useThemePreference.ts`
- Create: `src/hooks/useThemePreference.test.tsx`
- Modify: `src/App.tsx`
- Test: `src/hooks/useThemePreference.test.tsx`

- [ ] **Step 1: Write the failing hook test**

```tsx
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useThemePreference } from './useThemePreference';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.head.innerHTML = '<meta name="theme-color" content="#ffffff" />';
});

test('starts in system mode and applies the resolved theme', () => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as typeof window.matchMedia;

  const { result } = renderHook(() => useThemePreference());

  expect(result.current.preference).toBe('system');
  expect(result.current.theme).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('persists explicit theme changes and ignores system changes when locked', () => {
  let listener: ((event: MediaQueryListEvent) => void) | null = null;

  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn((_name, cb) => { listener = cb; }),
    removeEventListener: vi.fn(),
  }) as typeof window.matchMedia;

  const { result } = renderHook(() => useThemePreference());

  act(() => result.current.setPreference('dark'));
  expect(result.current.theme).toBe('dark');
  expect(localStorage.getItem('rewind_theme_preference')).toBe('dark');

  act(() => listener?.({ matches: true } as MediaQueryListEvent));
  expect(result.current.theme).toBe('dark');
});
```

- [ ] **Step 2: Run the hook test to verify it fails**

Run: `npx vitest run src/hooks/useThemePreference.test.tsx`

Expected: FAIL because `useThemePreference` does not exist yet

- [ ] **Step 3: Implement the hook and root install in App**

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  applyResolvedTheme,
  getStoredThemePreference,
  getSystemPrefersDark,
  resolveTheme,
  setStoredThemePreference,
  updateThemeColorMeta,
  type ThemePreference,
  type ResolvedTheme,
} from '../lib/theme';

const LIGHT_THEME_COLOR = '#FFFFFF';
const DARK_THEME_COLOR = '#17181C';

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredThemePreference());
  const [prefersDark, setPrefersDark] = useState<boolean>(() => getSystemPrefersDark());

  const theme = useMemo<ResolvedTheme>(
    () => resolveTheme(preference, prefersDark),
    [preference, prefersDark],
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    setPrefersDark(media.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    applyResolvedTheme(theme);
    updateThemeColorMeta(theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }, [theme]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    setStoredThemePreference(next);
  };

  return { preference, theme, setPreference };
}
```

```tsx
// App.tsx
const theme = useThemePreference();

<HomeScreen
  onPlay={...}
  themePreference={theme.preference}
  onThemePreferenceChange={theme.setPreference}
/>
```

- [ ] **Step 4: Run the hook test to verify it passes**

Run: `npx vitest run src/hooks/useThemePreference.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useThemePreference.ts src/hooks/useThemePreference.test.tsx src/App.tsx
git commit -m "feat: add root theme controller"
```

### Task 3: Add the visible theme switch

**Files:**
- Create: `src/components/ThemeSwitch.tsx`
- Create: `src/components/ThemeSwitch.module.css`
- Create: `src/components/ThemeSwitch.test.tsx`
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/HomeScreen.module.css`
- Test: `src/components/ThemeSwitch.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { ThemeSwitch } from './ThemeSwitch';

test('renders system, light, and dark options and reports selection', () => {
  const onChange = vi.fn();

  render(<ThemeSwitch value="system" onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: /dark/i }));
  expect(onChange).toHaveBeenCalledWith('dark');
  expect(screen.getByRole('button', { name: /system/i })).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npx vitest run src/components/ThemeSwitch.test.tsx`

Expected: FAIL because `ThemeSwitch` does not exist yet

- [ ] **Step 3: Implement the switch and mount it on HomeScreen**

```tsx
// ThemeSwitch.tsx
import type { ThemePreference } from '../lib/theme';
import styles from './ThemeSwitch.module.css';

interface ThemeSwitchProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  return (
    <div className={styles.root} role="group" aria-label="Theme">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          className={value === option ? styles.optionActive : styles.option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
```

```tsx
// HomeScreen.tsx
interface HomeScreenProps {
  onPlay: () => void;
  themePreference: ThemePreference;
  onThemePreferenceChange: (value: ThemePreference) => void;
}

<div className={styles.themeRow}>
  <span className={styles.themeLabel}>Theme</span>
  <ThemeSwitch
    value={themePreference}
    onChange={onThemePreferenceChange}
  />
</div>
```

```css
/* HomeScreen.module.css */
.themeRow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.themeLabel {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-muted);
}
```

- [ ] **Step 4: Run the component test to verify it passes**

Run: `npx vitest run src/components/ThemeSwitch.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ThemeSwitch.tsx src/components/ThemeSwitch.module.css src/components/ThemeSwitch.test.tsx src/screens/HomeScreen.tsx src/screens/HomeScreen.module.css
git commit -m "feat: add visible theme switch"
```

### Task 4: Add dark tokens and neutral cleanup

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/components/Timeline.module.css`
- Modify: `src/screens/GameScreen.module.css`
- Modify: `src/screens/HomeScreen.module.css`
- Modify: `index.html`
- Test: `src/lib/theme.test.ts`

- [ ] **Step 1: Write the failing token/meta assertions**

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('dark theme assets', () => {
  it('sets a dark-safe baseline theme-color in index.html', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    expect(html).toContain('meta name="theme-color" content="#17181C"');
  });

  it('defines a dark token override block', () => {
    const css = fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('--color-bg: #17181C;');
  });
});
```

- [ ] **Step 2: Run the token/meta assertions to verify they fail**

Run: `npx vitest run src/lib/theme.test.ts`

Expected: FAIL because `index.html` still uses a white theme color and dark token overrides are missing

- [ ] **Step 3: Implement tokenized light/dark values and replace hardcoded neutrals**

```css
/* tokens.css */
:root {
  --color-bg: #FFFFFF;
  --color-text: #000000;
  --color-surface: #FFFFFF;
  --color-surface-overlay: rgba(255, 255, 255, 0.96);
  --color-correct: #22C55E;
  --color-close: #EAB308;
  --color-wrong-era: #F97316;
  --color-wrong: #EF4444;
  --color-muted: #9CA3AF;
  --color-border: #E5E7EB;
  --color-subtle-text: #666666;
}

[data-theme='dark'] {
  --color-bg: #17181C;
  --color-text: #F3F1EB;
  --color-surface: #17181C;
  --color-surface-overlay: rgba(23, 24, 28, 0.96);
  --color-muted: #9DA3AE;
  --color-border: #343741;
  --color-subtle-text: #8D939E;
}
```

```css
/* Timeline.module.css / GameScreen.module.css / HomeScreen.module.css */
.yearLabel { color: var(--color-subtle-text); }
.tickRevealed .yearLabel { color: var(--color-subtle-text); }
.revealDetail { color: var(--color-subtle-text); }
.debugMenu { background: var(--color-surface-overlay); }
```

```html
<!-- index.html -->
<meta name="theme-color" content="#17181C" />
```

- [ ] **Step 4: Run the token/meta assertions to verify they pass**

Run: `npx vitest run src/lib/theme.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css src/components/Timeline.module.css src/screens/GameScreen.module.css src/screens/HomeScreen.module.css index.html
git commit -m "feat: add dark theme token system"
```

### Task 5: Verify the full integration

**Files:**
- Test: `src/lib/theme.test.ts`
- Test: `src/hooks/useThemePreference.test.tsx`
- Test: `src/components/ThemeSwitch.test.tsx`
- Test: `src/components/Timeline.test.tsx`
- Test: `src/screens/GameScreen.test.tsx`

- [ ] **Step 1: Run focused theme tests**

Run: `npx vitest run src/lib/theme.test.ts src/hooks/useThemePreference.test.tsx src/components/ThemeSwitch.test.tsx`

Expected: PASS

- [ ] **Step 2: Run broader UI regression coverage**

Run: `npx vitest run src/components/Timeline.test.tsx src/screens/GameScreen.test.tsx src/hooks/useGame.test.tsx src/components/ShareCard.test.tsx tests/scoring.test.ts`

Expected: PASS

- [ ] **Step 3: Run lint and production build**

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual verification checklist**

Check in the browser:

```text
1. Home screen renders in light and dark with no layout movement
2. Theme switch shows System / Light / Dark and persists after reload
3. System mode follows OS changes
4. Game screen timeline labels, muted copy, and buttons remain readable in dark
5. Results screen cards, borders, and muted text are readable in dark
6. Mobile browser chrome color matches the active theme background
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts src/hooks/useThemePreference.ts src/hooks/useThemePreference.test.tsx src/components/ThemeSwitch.tsx src/components/ThemeSwitch.module.css src/components/ThemeSwitch.test.tsx src/screens/HomeScreen.tsx src/screens/HomeScreen.module.css src/styles/tokens.css src/styles/global.css src/components/Timeline.module.css src/screens/GameScreen.module.css index.html src/App.tsx
git commit -m "feat: add system light dark theme support"
```
