# Reveal Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat answer reveal with a 5-beat dramatic sequence: micro-pause, spotlight scroll, landing flash, badge slide-up, and tick reveal — plus confetti + shimmer for perfect guesses.

**Architecture:** The reveal orchestration lives in `GameScreen.tsx`'s `handleConfirm`. Each beat is a timed step using `await sleep()` and CSS class toggling. The scroll easing and spotlight callback live in `useTimeline.ts`. Confetti is an isolated canvas component. All changes are visual — no new state, data, or API calls.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + React Testing Library, requestAnimationFrame canvas animation.

**Branch:** `feature/reveal-animation` (already created off `main`)

---

## File Structure

| File | Role |
|------|------|
| `src/hooks/useTimeline.ts` | Scroll easing, duration formula, spotlight callback |
| `src/components/Timeline.tsx` | Spotlight dim/highlight classes per tick |
| `src/components/Timeline.module.css` | `.tickDimmed`, `.tickHighlight` styles |
| `src/components/Confetti.tsx` | Canvas-based dual-source confetti (new file) |
| `src/screens/GameScreen.tsx` | 5-beat reveal orchestration |
| `src/screens/GameScreen.module.css` | Flash overlay, micro-pause, badge slide-up, shimmer |

---

### Task 1: Overshoot Easing + Duration Formula in useTimeline

**Files:**
- Modify: `src/hooks/useTimeline.ts`

This task replaces `easeInOutCubic` with the 20% overshoot easing curve and updates the duration formula. It also adds a `spotlightCallback` parameter to `scrollToYear` so the caller can receive per-frame center position updates (used by GameScreen to drive spotlight dimming on the Timeline).

- [ ] **Step 1: Write overshoot easing test**

Create `src/hooks/useTimeline.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { easeOvershoot } from './useTimeline';

describe('easeOvershoot', () => {
  it('returns 0 at t=0', () => {
    expect(easeOvershoot(0)).toBeCloseTo(0, 5);
  });

  it('returns 1 at t=1', () => {
    expect(easeOvershoot(1)).toBeCloseTo(1, 5);
  });

  it('overshoots past 1.0 near t=0.72', () => {
    expect(easeOvershoot(0.72)).toBeCloseTo(1.2, 1);
  });

  it('peak is approximately 1.20', () => {
    const peak = easeOvershoot(0.72);
    expect(peak).toBeGreaterThan(1.15);
    expect(peak).toBeLessThan(1.25);
  });

  it('is monotonically increasing in the first phase', () => {
    let prev = 0;
    for (let t = 0.1; t <= 0.72; t += 0.1) {
      const val = easeOvershoot(t);
      expect(val).toBeGreaterThan(prev);
      prev = val;
    }
  });

  it('settles back from overshoot in the second phase', () => {
    const atPeak = easeOvershoot(0.72);
    const atEnd = easeOvershoot(1);
    expect(atPeak).toBeGreaterThan(atEnd);
  });
});

describe('getScrollDuration', () => {
  // Import inline to avoid hook context issues
  let getScrollDuration: (yearDiff: number) => number;

  beforeAll(async () => {
    const mod = await import('./useTimeline');
    getScrollDuration = mod.getScrollDuration;
  });

  it('returns 900 for 1-year diff', () => {
    expect(getScrollDuration(1)).toBe(900);
  });

  it('returns yearDiff * 160 for mid-range', () => {
    expect(getScrollDuration(10)).toBe(1600);
  });

  it('clamps to 2400 for large diffs', () => {
    expect(getScrollDuration(20)).toBe(2400);
  });

  it('returns 900 minimum for 0 diff', () => {
    expect(getScrollDuration(0)).toBe(900);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useTimeline.test.ts`
Expected: FAIL — `easeOvershoot` and `getScrollDuration` are not exported.

- [ ] **Step 3: Export easeOvershoot and getScrollDuration, update scrollToYear**

In `src/hooks/useTimeline.ts`, add these exported functions before the `useTimeline` hook:

```typescript
export function easeOvershoot(t: number): number {
  if (t < 0.72) {
    const p = t / 0.72;
    return 1.20 * (1 - Math.pow(1 - p, 3));
  }
  const p = (t - 0.72) / 0.28;
  return 1.20 + (1.0 - 1.20) * (1 - Math.pow(1 - p, 2));
}

export function getScrollDuration(yearDiff: number): number {
  return Math.min(2400, Math.max(900, Math.abs(yearDiff) * 160));
}
```

Then inside `scrollToYear`, replace the easing and duration:

Replace:
```typescript
const duration = Math.min(1900, Math.max(1150, Math.abs(distance) * 5.5));
const startedAt = performance.now();

const easeInOutCubic = (t: number) => (
  t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
);
```

With:
```typescript
// Duration scales with year distance, not pixel distance
const yearDiff = Math.abs(year - selectedYear);
const duration = getScrollDuration(yearDiff);
const startedAt = performance.now();
```

And in the `tick` function, replace:
```typescript
const eased = easeInOutCubic(progress);
container.scrollLeft = start + distance * eased;
```

With:
```typescript
const eased = easeOvershoot(progress);
container.scrollLeft = start + distance * eased;
```

Also add a `spotlightCallback` parameter to `scrollToYear`. Update the signature:

```typescript
const scrollToYear = useCallback((
  year: number,
  smooth = true,
  suppressFeedback = false,
  spotlightCallback?: (centerX: number) => void,
) => {
```

In the `tick` function, after setting `container.scrollLeft`, add:

```typescript
if (spotlightCallback) {
  const currentCenterX = container.scrollLeft + container.clientWidth / 2;
  spotlightCallback(currentCenterX);
}
```

The `selectedYear` used inside `getScrollDuration` needs to be referenced. Since `selectedYear` is state, capture it via a ref. Add a ref at the top of the hook:

```typescript
const selectedYearRef = useRef(RANGE_END);
```

Update `syncYear` to also set the ref:
```typescript
const syncYear = useCallback((year: number) => {
  setSelectedYear(year);
  selectedYearRef.current = year;
  lastHapticYear.current = year;
}, []);
```

And in `handleScroll`, after `setSelectedYear(clamped)`:
```typescript
selectedYearRef.current = clamped;
```

Then in `scrollToYear` use `selectedYearRef.current`:
```typescript
const yearDiff = Math.abs(year - selectedYearRef.current);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useTimeline.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTimeline.ts src/hooks/useTimeline.test.ts
git commit -m "feat(reveal): replace easeInOutCubic with 20% overshoot easing, add spotlight callback"
```

---

### Task 2: Timeline Spotlight Dimming

**Files:**
- Modify: `src/components/Timeline.tsx`
- Modify: `src/components/Timeline.module.css`

Add props and CSS classes so GameScreen can drive per-tick spotlight dimming during scroll.

- [ ] **Step 1: Write test for spotlight props**

Add to `src/components/Timeline.test.tsx`:

```typescript
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Timeline } from './Timeline';

test('applies dimmed class to ticks outside spotlight window', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2000}
      rangeEnd={2010}
      yearWidth={60}
      onScroll={() => {}}
      spotlightCenter={2005}
      spotlightActive={true}
    />
  );

  const tick2000 = screen.getByText('2000').parentElement!;
  const tick2005 = screen.getByText('2005').parentElement!;
  const tick2010 = screen.getByText('2010').parentElement!;

  expect(tick2005.className).toContain('highlight');
  expect(tick2000.className).toContain('dimmed');
  expect(tick2010.className).toContain('dimmed');
});

test('does not apply spotlight classes when spotlightActive is false', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2000}
      rangeEnd={2010}
      yearWidth={60}
      onScroll={() => {}}
      spotlightCenter={2005}
      spotlightActive={false}
    />
  );

  const tick2000 = screen.getByText('2000').parentElement!;
  expect(tick2000.className).not.toContain('dimmed');
  expect(tick2000.className).not.toContain('highlight');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Timeline.test.tsx`
Expected: FAIL — `spotlightCenter` and `spotlightActive` are not accepted props.

- [ ] **Step 3: Add spotlight props to Timeline**

In `src/components/Timeline.tsx`, update the interface:

```typescript
interface TimelineProps {
  containerRef: RefObject<HTMLDivElement | null>;
  rangeStart: number;
  rangeEnd: number;
  yearWidth: number;
  onScroll: () => void;
  disabled?: boolean;
  revealedYear?: number | null;
  indicatorColor?: string;
  spotlightCenter?: number | null;
  spotlightActive?: boolean;
}
```

Add the new props to destructuring:

```typescript
export function Timeline({
  containerRef,
  rangeStart,
  rangeEnd,
  yearWidth,
  onScroll,
  disabled,
  revealedYear,
  indicatorColor,
  spotlightCenter,
  spotlightActive,
}: TimelineProps) {
```

Update the tick className logic inside the `.map()`:

```typescript
{years.map((year) => {
  const isMajor = year % 5 === 0;
  const isRevealed = revealedYear !== null && revealedYear !== undefined;
  const isCorrectYear = revealedYear === year;

  let spotlightClass = '';
  if (spotlightActive && spotlightCenter != null) {
    const dist = Math.abs(year - spotlightCenter);
    if (dist <= 2) {
      spotlightClass = styles.tickHighlight;
    } else {
      spotlightClass = styles.tickDimmed;
    }
  }

  const tickClassName = [
    styles.tick,
    isMajor ? styles.tickMajor : styles.tickMinor,
    isRevealed ? styles.tickRevealed : '',
    isCorrectYear ? styles.tickCorrect : '',
    spotlightClass,
  ].filter(Boolean).join(' ');

  return (
    <div
      key={year}
      className={tickClassName}
      style={{ width: yearWidth }}
    >
      <span className={styles.yearLabel}>{year}</span>
      <div className={styles.tickLine} />
    </div>
  );
})}
```

- [ ] **Step 4: Add spotlight CSS classes**

In `src/components/Timeline.module.css`, add before the `@media` block:

```css
.tickHighlight .tickLine {
  opacity: 1 !important;
}

.tickHighlight .yearLabel {
  opacity: 1 !important;
}

.tickDimmed .tickLine {
  opacity: 0.05 !important;
  transition: opacity 0.12s ease;
}

.tickDimmed.tickMajor .tickLine {
  opacity: 0.1 !important;
}

.tickDimmed .yearLabel {
  color: var(--color-muted) !important;
  opacity: 0.2 !important;
  transition: opacity 0.12s ease, color 0.12s ease;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/Timeline.test.tsx`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Timeline.tsx src/components/Timeline.module.css src/components/Timeline.test.tsx
git commit -m "feat(reveal): add spotlight dimming to Timeline component"
```

---

### Task 3: Confetti Component

**Files:**
- Create: `src/components/Confetti.tsx`
- Create: `src/components/Confetti.test.tsx`

Canvas-based dual-source confetti for perfect guess. Performance-optimized: DPR capped at 2, flat typed arrays, all rectangles, no wobble trig.

- [ ] **Step 1: Write test**

Create `src/components/Confetti.test.tsx`:

```typescript
import { render } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { Confetti } from './Confetti';

beforeEach(() => {
  // Mock canvas context
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    scale: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

test('renders a fixed-position canvas element', () => {
  const { container } = render(<Confetti active={true} />);
  const canvas = container.querySelector('canvas');
  expect(canvas).toBeTruthy();
  expect(canvas!.style.position).toBe('fixed');
  expect(canvas!.style.pointerEvents).toBe('none');
});

test('does not render canvas when not active', () => {
  const { container } = render(<Confetti active={false} />);
  const canvas = container.querySelector('canvas');
  expect(canvas).toBeNull();
});

test('calls onComplete after animation finishes', async () => {
  vi.useFakeTimers();
  const onComplete = vi.fn();
  render(<Confetti active={true} onComplete={onComplete} />);

  // Confetti duration is 1400ms, advance past it
  vi.advanceTimersByTime(1500);
  expect(onComplete).toHaveBeenCalled();
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Confetti.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Confetti component**

Create `src/components/Confetti.tsx`:

```typescript
import { useRef, useEffect } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const DURATION = 1400;
const COUNT_PER_SOURCE = 40;
const TOTAL = COUNT_PER_SOURCE * 2;
const FADE_START = (DURATION - 300) / 1000;

const COLORS = ['#22c55e', '#4ade80', '#16a34a', '#f5f5f5', '#86efac', '#a3e635', '#bbf7d0'];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const targetX = W / 2;
    const targetY = H * 0.35;

    // Flat typed arrays for performance
    const px = new Float32Array(TOTAL);
    const py = new Float32Array(TOTAL);
    const pvx = new Float32Array(TOTAL);
    const pvy = new Float32Array(TOTAL);
    const pgrav = new Float32Array(TOTAL);
    const phw = new Float32Array(TOTAL);
    const phh = new Float32Array(TOTAL);
    const prot = new Float32Array(TOTAL);
    const protspd = new Float32Array(TOTAL);
    const popacity = new Float32Array(TOTAL);
    const pdrag = new Float32Array(TOTAL);
    const pcolor: string[] = new Array(TOTAL);

    const sources = [{ x: -10, y: -10 }, { x: W + 10, y: -10 }];
    let idx = 0;

    for (const src of sources) {
      for (let i = 0; i < COUNT_PER_SOURCE; i++) {
        const startX = src.x + (Math.random() - 0.5) * 60;
        const startY = src.y + Math.random() * 25;
        const aimX = targetX + (Math.random() - 0.5) * W * 0.8;
        const aimY = targetY + (Math.random() - 0.5) * H * 0.35;
        const dx = aimX - startX;
        const dy = aimY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 550 + Math.random() * 450;
        const sz = 3.5 + Math.random() * 5.5;
        const ar = 0.4 + Math.random() * 0.6;

        px[idx] = startX;
        py[idx] = startY;
        pvx[idx] = (dx / dist) * speed;
        pvy[idx] = (dy / dist) * speed * 0.45;
        pgrav[idx] = 380 + Math.random() * 250;
        phw[idx] = sz / 2;
        phh[idx] = (sz * ar) / 2;
        prot[idx] = Math.random() * Math.PI * 2;
        protspd[idx] = (Math.random() - 0.5) * 16;
        popacity[idx] = 0.8 + Math.random() * 0.2;
        pdrag[idx] = 0.965 + Math.random() * 0.025;
        pcolor[idx] = COLORS[Math.floor(Math.random() * COLORS.length)];
        idx++;
      }
    }

    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > DURATION) {
        ctx.clearRect(0, 0, W, H);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, W, H);
      const t = elapsed / 1000;

      for (let i = 0; i < TOTAL; i++) {
        const df = Math.pow(pdrag[i], t * 60);
        const x = px[i] + pvx[i] * t * df;
        const y = py[i] + pvy[i] * t * df + 0.5 * pgrav[i] * t * t;
        if (y > H + 30) continue;

        let alpha = popacity[i];
        if (t > FADE_START) alpha *= Math.max(0, 1 - (t - FADE_START) / 0.3);
        if (alpha <= 0) continue;

        const rot = prot[i] + protspd[i] * t;
        const scaleX = Math.abs(Math.cos(rot * 1.5));
        const hw = phw[i] * Math.max(0.2, scaleX);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pcolor[i];
        ctx.fillRect(-hw, -phh[i], hw * 2, phh[i] * 2);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Confetti.test.tsx`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Confetti.tsx src/components/Confetti.test.tsx
git commit -m "feat(reveal): add Confetti component for perfect guess celebration"
```

---

### Task 4: GameScreen CSS — Flash Overlay, Micro-pause, Badge Slide-up, Shimmer

**Files:**
- Modify: `src/screens/GameScreen.module.css`

Add all the CSS classes needed by the reveal orchestration. No component changes yet — just the styles.

- [ ] **Step 1: Add flash overlay styles**

In `src/screens/GameScreen.module.css`, add after `.revealPanelVisible`:

```css
.flashOverlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.08s ease;
}

.flashOverlayVisible {
  opacity: 0.08;
}

.flashOverlayFading {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.flashOverlayPerfect {
  opacity: 0.12;
}
```

- [ ] **Step 2: Add micro-pause dim classes**

```css
.micropauseDim {
  opacity: 0.35;
  transition: opacity 0.2s ease;
}

.micropauseRestore {
  opacity: 1;
  transition: opacity 0.3s ease;
}
```

- [ ] **Step 3: Add badge slide-up animation**

Replace the existing `.badgeRow` block and add animation classes:

```css
.badgeRow {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 12px;
  min-height: 22px;
  opacity: 0;
  transform: translateY(20px);
}

.badgeSlideUp {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.25s ease, transform 0.45s cubic-bezier(0.22, 1.6, 0.36, 1);
}
```

- [ ] **Step 4: Add perfect year shimmer styles**

```css
.yearWrap {
  display: inline-block;
}

.yearPop {
  animation: perfectPop 0.4s cubic-bezier(0.22, 1.6, 0.36, 1) forwards;
}

@keyframes perfectPop {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.15); }
  60%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}

@keyframes shimmerLTR {
  from { background-position: 100% 0; }
  to   { background-position: -30% 0; }
}

.yearShimmer {
  -webkit-text-fill-color: transparent;
  background: linear-gradient(
    90deg,
    var(--color-correct) 0%,
    var(--color-correct) 25%,
    #bbf7d0 42%,
    #f0fdf4 50%,
    #bbf7d0 58%,
    var(--color-correct) 75%,
    var(--color-correct) 100%
  );
  background-size: 250% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: shimmerLTR 0.9s 0.3s linear infinite;
}
```

- [ ] **Step 5: Add indicator dim class**

```css
.indicatorDimmed {
  border-top-color: var(--color-muted) !important;
  transition: border-top-color 0.15s ease;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/GameScreen.module.css
git commit -m "feat(reveal): add CSS for flash overlay, micro-pause, badge slide-up, shimmer"
```

---

### Task 5: GameScreen Reveal Orchestration

**Files:**
- Modify: `src/screens/GameScreen.tsx`

This is the core task. Rewrite `handleConfirm` to run the 5-beat sequence, add the flash overlay element, wire up spotlight, confetti, and shimmer.

- [ ] **Step 1: Add imports and state**

At the top of `GameScreen.tsx`, add the Confetti import:

```typescript
import { Confetti } from '../components/Confetti';
```

Inside the component, add new state after the existing state declarations:

```typescript
const [spotlightCenter, setSpotlightCenter] = useState<number | null>(null);
const [spotlightActive, setSpotlightActive] = useState(false);
const [flashColor, setFlashColor] = useState<string | null>(null);
const [flashState, setFlashState] = useState<'off' | 'on' | 'fading'>('off');
const [micropause, setMicropause] = useState(false);
const [badgeVisible, setBadgeVisible] = useState(false);
const [showConfetti, setShowConfetti] = useState(false);
const [isPerfectReveal, setIsPerfectReveal] = useState(false);
const flashTimer = useRef<ReturnType<typeof setTimeout>>(null);
```

Add a sleep helper at the top of the file (outside the component):

```typescript
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
```

- [ ] **Step 2: Rewrite handleConfirm with 5-beat sequence**

Replace the entire `handleConfirm` callback:

```typescript
const handleConfirm = useCallback(async () => {
  const result = game.submitGuess(timeline.selectedYear);
  if (!result) return;

  setPendingResult(result);
  setIsResolving(true);
  setShowRevealText(false);
  setBadgeVisible(false);
  setIsPerfectReveal(false);
  setShowConfetti(false);

  const resultColor = getResultColor(result.diff);
  const colorVar = getResultColorVar(resultColor);
  const isPerfect = result.diff === 0;

  // === Beat 1: Micro-pause (280ms) ===
  setMicropause(true);
  await sleep(280);

  // === Beat 2: Spotlight Scroll (or confetti for perfect) ===
  if (isPerfect) {
    // Perfect: skip scroll, fire confetti
    setShowConfetti(true);
  } else {
    // Scroll with spotlight
    setSpotlightActive(true);
    await timeline.scrollToYear(result.actualYear, true, false, (centerX: number) => {
      // Convert pixel centerX to year for spotlight
      const spacer = timeline.containerRef.current
        ? timeline.containerRef.current.clientWidth / 2
        : 0;
      const posInTrack = centerX - spacer;
      const yearFloat = posInTrack / timeline.yearWidth + timeline.rangeStart;
      setSpotlightCenter(Math.round(yearFloat));
    });
    // Clear spotlight
    setSpotlightActive(false);
    setSpotlightCenter(null);
  }

  // === Beat 3: Landing ===
  // Flash
  setFlashColor(colorVar);
  setFlashState('on');
  flashTimer.current = setTimeout(() => setFlashState('fading'), isPerfect ? 150 : 120);
  setTimeout(() => setFlashState('off'), isPerfect ? 650 : 520);

  // Haptic
  if (resultColor === 'perfect' || resultColor === 'great') {
    vibrateConfirm();
  } else if (resultColor === 'ballpark') {
    vibrateMedium();
  } else {
    vibrateError();
  }

  // Restore from micropause
  setMicropause(false);

  await sleep(80);

  // Reveal result (year color shift + tick reveal happen here)
  setRevealResult(result);
  setPendingResult(null);
  setIsResolving(false);

  if (isPerfect) {
    setIsPerfectReveal(true);
  }

  await sleep(150);

  // === Beat 4: Badge slide-up ===
  setBadgeVisible(true);

  // === Beat 5: Detail text (250ms after badge starts) ===
  revealTimer.current = setTimeout(() => {
    setShowRevealText(true);
  }, 250);
}, [game, timeline]);
```

- [ ] **Step 3: Update handleNext to reset new state**

Replace the `handleNext` callback:

```typescript
const handleNext = useCallback(() => {
  setPendingResult(null);
  setRevealResult(null);
  setIsResolving(false);
  setShowRevealText(false);
  setBadgeVisible(false);
  setShowConfetti(false);
  setIsPerfectReveal(false);
  setMicropause(false);
  setFlashState('off');
  setSpotlightActive(false);
  setSpotlightCenter(null);
  if (revealTimer.current) clearTimeout(revealTimer.current);
  if (flashTimer.current) clearTimeout(flashTimer.current);

  if (game.isComplete) {
    onFinish();
  }
}, [game.isComplete, onFinish]);
```

- [ ] **Step 4: Update the indicator color logic**

Replace the `indicatorColor` line:

```typescript
const indicatorColor = micropause
  ? 'var(--color-muted)'
  : isRevealing
    ? colorVar
    : undefined;
```

- [ ] **Step 5: Update the JSX**

Replace the `topSection` div content. Key changes: wrap year in shimmer wrapper, add flash overlay, update badge with slide-up, add confetti, add micropause classes, pass spotlight props to Timeline.

Full updated return JSX:

```typescript
return (
  <div className={styles.screen}>
    <Header sport={puzzle.sport} onHome={onHome} />

    <div className={styles.topSection} style={{ position: 'relative' }}>
      {/* Flash overlay */}
      {flashState !== 'off' && (
        <div
          className={`${styles.flashOverlay} ${
            flashState === 'on'
              ? isPerfectReveal || (pendingResult && pendingResult.diff === 0)
                ? styles.flashOverlayPerfect
                : styles.flashOverlayVisible
              : styles.flashOverlayFading
          }`}
          style={{ background: flashColor ?? undefined }}
        />
      )}

      <div className={styles.contentWidth}>
        <p className={styles.roundCounter}>
          Question {displayRound}/{game.totalRounds}
        </p>
        <div className={styles.promptShell}>
          {!!displayText && (
            <h2
              className={`${styles.question} ${activeResult ? '' : styles.questionFresh} ${
                micropause ? styles.micropauseDim : ''
              } ${!micropause && revealResult ? styles.micropauseRestore : ''}`}
            >
              {displayText}
            </h2>
          )}

          <div className={`${styles.revealPanel} ${isRevealing ? styles.revealPanelVisible : styles.revealPanelIdle}`}>
            <div className={isPerfectReveal ? styles.yearWrap + ' ' + styles.yearPop : ''}>
              <span
                className={`${styles.answerYear} ${
                  micropause ? styles.micropauseDim : ''
                } ${!micropause && revealResult ? styles.micropauseRestore : ''} ${
                  isPerfectReveal ? styles.yearShimmer : ''
                }`}
                data-testid="headline-year"
                style={!isPerfectReveal ? { color: headlineYearColor } : undefined}
              >
                {headlineYear}
              </span>
            </div>
            {revealResult && (
              <div className={`${styles.badgeRow} ${badgeVisible ? styles.badgeSlideUp : ''}`}>
                <span className={styles.badgeSquare} style={{ background: colorVar }} />
                <span className={styles.badgeText}>{scoreBadgeText}</span>
              </div>
            )}
          </div>

          <p className={styles.themeLine}>
            {!activeResult && puzzle.theme ? puzzle.theme : ''}
          </p>
        </div>
      </div>
    </div>

    <div className={styles.timelineRegion}>
      <Timeline
        containerRef={timeline.containerRef}
        rangeStart={timeline.rangeStart}
        rangeEnd={timeline.rangeEnd}
        yearWidth={timeline.yearWidth}
        onScroll={handleScroll}
        disabled={isLocked}
        revealedYear={revealResult?.actualYear ?? null}
        indicatorColor={indicatorColor}
        spotlightCenter={spotlightCenter}
        spotlightActive={spotlightActive}
      />
    </div>

    <div className={styles.footerSlot}>
      <div className={styles.detailSlot}>
        {isRevealing ? (
          <p className={`${styles.revealDetail} ${showRevealText ? styles.revealDetailVisible : ''}`}>
            {revealResult?.event.detail ?? ''}
          </p>
        ) : null}
      </div>
      <div className={styles.buttonRail}>
        {isRevealing ? (
          <button
            onClick={handleNext}
            className={styles.nextButton}
          >
            {game.isComplete ? 'See results' : 'Next round'}
          </button>
        ) : !isResolving ? (
          <ConfirmButton
            onConfirm={handleConfirm}
            disabled={isLocked}
          />
        ) : null}
      </div>
    </div>

    <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
  </div>
);
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests pass. The existing GameScreen tests mock `useTimeline` so the new `spotlightCallback` parameter is ignored.

- [ ] **Step 7: Commit**

```bash
git add src/screens/GameScreen.tsx
git commit -m "feat(reveal): wire up 5-beat reveal sequence with spotlight, confetti, shimmer"
```

---

### Task 6: Update Existing Tests

**Files:**
- Modify: `src/screens/GameScreen.test.tsx`

The existing tests may need minor updates since `handleConfirm` now uses `sleep()` and more state. Ensure they still work with the async flow.

- [ ] **Step 1: Update GameScreen test mocks**

In `src/screens/GameScreen.test.tsx`, add the Confetti mock after the other mocks:

```typescript
vi.mock('../components/Confetti', () => ({
  Confetti: () => null,
}));
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/screens/GameScreen.test.tsx
git commit -m "test(reveal): update GameScreen tests for new reveal flow"
```

---

### Task 7: Manual Integration Test

**Files:** None (testing only)

- [ ] **Step 1: Start dev server**

Run: `npx vite dev`

- [ ] **Step 2: Test normal reveal (non-perfect)**

1. Open the app
2. Pick a year that's 3-5 off from the answer
3. Tap Lock
4. Verify: question dims → spotlight scroll with overshoot → flash in result color → year color shifts + tick turns green simultaneously → badge slides up → detail text fades in

- [ ] **Step 3: Test perfect reveal**

1. If you know the answer, pick the exact year
2. Tap Lock
3. Verify: question dims → confetti from top corners → flash → year pops + shimmer starts → badge slides up

- [ ] **Step 4: Test large miss (12+ years)**

1. Pick a year far from the answer
2. Verify scroll takes ~2.4s and spotlight sweeps correctly

- [ ] **Step 5: Test on mobile**

Open on phone (same WiFi network, use local IP). Verify confetti runs at smooth FPS.

- [ ] **Step 6: Final commit with any fixes**

```bash
git add -A
git commit -m "fix(reveal): integration test fixes"
```

(Only if fixes were needed — skip if everything worked.)
