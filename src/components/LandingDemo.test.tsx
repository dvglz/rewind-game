import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getLandingDemoResultColor, LandingDemo } from './LandingDemo';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

beforeEach(() => {
  // jsdom does not implement scrollTo, which the real timeline calls.
  Element.prototype.scrollTo = vi.fn();
});

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  // @ts-expect-error reset the stub between tests
  delete window.matchMedia;
});

test('renders the reused timeline', () => {
  mockReducedMotion(false);
  render(<LandingDemo />);
  // The real Timeline component is mounted (its scroller test id).
  expect(screen.getByTestId('timeline-scroller')).not.toBeNull();
});

test('holds a static revealed frame under reduced motion', () => {
  mockReducedMotion(true);
  render(<LandingDemo />);
  const labels = ['Perfect', 'Great', 'Ballpark', 'Wrong Era', 'Not Even Close'];
  const found = labels.some((label) => screen.queryByText(label) !== null);
  expect(found).toBe(true);
});

test('scores the reduced-motion frame from the actual year gap', () => {
  mockReducedMotion(true);
  render(<LandingDemo />);
  // Example 0 is a perfect guess, so the static reduced-motion frame reveals "Perfect".
  expect(screen.getByText('Perfect')).not.toBeNull();
  expect(screen.queryByText('Wrong Era')).toBeNull();
});

test('uses home demo scoring tiers independent of game scoring', () => {
  expect(getLandingDemoResultColor(0)).toBe('perfect');
  expect(getLandingDemoResultColor(1)).toBe('ballpark');
  expect(getLandingDemoResultColor(3)).toBe('ballpark');
  expect(getLandingDemoResultColor(4)).toBe('not-even-close');
  expect(getLandingDemoResultColor(6)).toBe('not-even-close');
  expect(getLandingDemoResultColor(7)).toBe('wrong-era');
});

test('uses a sequential scatter intro instead of collapsing cards into a deck', () => {
  const css = readFileSync(resolve(__dirname, './LandingDemo.module.css'), 'utf8');
  const burstCardBlock = css.match(/\.burstCard\s*\{([^}]*)\}/);
  const burstPopBlock = css.match(/@keyframes burstPop\s*\{([\s\S]*?)\n\}/);

  expect(burstCardBlock?.[1] ?? '').toMatch(/animation:\s*burstPop/);
  expect(burstPopBlock?.[1] ?? '').toMatch(/translate\(var\(--x\), var\(--y\)\)/);
  expect(css).not.toMatch(/\.deckCard:not\(:first-child\)/);
});

test('spaces burst cards vertically and remounts the burst on each loop', () => {
  const source = readFileSync(resolve(__dirname, './LandingDemo.tsx'), 'utf8');

  expect(source).toMatch(/setBurstCycle\(\(cycle\) => cycle \+ 1\)/);
  expect(source).toMatch(/key=\{burstCycle\}/);
  // Burst cards spread top-to-bottom across the band (top and bottom of the zig-zag).
  expect(source).toMatch(/y: -92/);
  expect(source).toMatch(/y: 96/);
});

test('drives the burst from the five demo examples so the prompts stay in sync', () => {
  const source = readFileSync(resolve(__dirname, './LandingDemo.tsx'), 'utf8');

  expect(source).toMatch(/const BURST_CARDS = EXAMPLES\.map\(/);
  expect(source).toMatch(/const BURST_LAYOUT = \[/);
});

test('uses the requested demo sequence and scoring beats', () => {
  const source = readFileSync(resolve(__dirname, './LandingDemo.tsx'), 'utf8');

  expect(source).toMatch(/MJ Flu Game takes place[\s\S]*actualYear: 1997, guessYear: 1997/);
  expect(source).toMatch(/Shaq is drafted by Orlando[\s\S]*actualYear: 1992, guessYear: 1993/);
  expect(source).toMatch(/Cavs come back from 3-1[\s\S]*actualYear: 2016, guessYear: 2016/);
  expect(source).toMatch(/Pierce's Wheelchair game[\s\S]*actualYear: 2008, guessYear: 2017/);
  expect(source).toMatch(/Zion's shoe explodes[\s\S]*actualYear: 2019, guessYear: 2021/);
  expect([
    getLandingDemoResultColor(1997 - 1997),
    getLandingDemoResultColor(1993 - 1992),
    getLandingDemoResultColor(2016 - 2016),
    getLandingDemoResultColor(2017 - 2008),
    getLandingDemoResultColor(2021 - 2019),
  ]).toEqual(['perfect', 'ballpark', 'perfect', 'wrong-era', 'ballpark']);
});

test('keeps timeline continuity when moving between demo examples', () => {
  const source = readFileSync(resolve(__dirname, './LandingDemo.tsx'), 'utf8');

  expect(source).toMatch(/let parkedYear = EXAMPLES\[0\]\.guessYear \+ EXAMPLES\[0\]\.startOffset;/);
  expect(source).toMatch(/const shouldParkBeforeScene = i === 0 && parkedYear !== start;/);
  expect(source).toMatch(/parkedYear = ex\.guessYear;/);
});

test('keeps the demo compact on short mobile screens', () => {
  const css = readFileSync(resolve(__dirname, './LandingDemo.module.css'), 'utf8');
  const compactBlock = css.match(/@media \(max-height: 760px\)[\s\S]*?\.demo\s*\{([^}]*)\}/);
  const compactCardRowBlock = css.match(/@media \(max-height: 760px\)[\s\S]*?\.cardRow\s*\{([^}]*)\}/);

  expect(compactBlock?.[1] ?? '').toMatch(/height:\s*248px;/);
  expect(compactCardRowBlock?.[1] ?? '').toMatch(/height:\s*70px;/);
  expect(css).toMatch(/--timeline-height:\s*140px;/);
  expect(css).toMatch(/bottom:\s*48px;/);
});

test('floats the landing tier label like the in-game toast', () => {
  const css = readFileSync(resolve(__dirname, './LandingDemo.module.css'), 'utf8');

  expect(css).toMatch(/animation:\s*pillFloat 1600ms linear forwards;/);
  expect(css).toMatch(/100%\s*\{\s*opacity:\s*0;\s*transform:\s*translateX\(-50%\) translateY\(-72px\);/);
});

test('uses larger denser burst cards on short screens', () => {
  const css = readFileSync(resolve(__dirname, './LandingDemo.module.css'), 'utf8');
  const compactCardBlock = css.match(/@media \(max-height: 760px\)[\s\S]*?\.burstCard\s*\{([^}]*)\}/);

  expect(compactCardBlock?.[1] ?? '').toMatch(/font-size:\s*15px;/);
  expect(compactCardBlock?.[1] ?? '').toMatch(/padding:\s*8px 12px;/);
});

test('holds the burst scene slightly longer before switching to timeline', () => {
  const source = readFileSync(resolve(__dirname, './LandingDemo.tsx'), 'utf8');

  expect(source).toMatch(/await wait\(2600\);/);
});

test('mimics a thumb scrubbing the timeline on each round', () => {
  const source = readFileSync(resolve(__dirname, './LandingDemo.tsx'), 'utf8');
  const css = readFileSync(resolve(__dirname, './LandingDemo.module.css'), 'utf8');

  // The cue is triggered right before the smooth scroll, in the scroll direction.
  expect(source).toMatch(/setScrub\(\{/);
  expect(source).toMatch(/dir: ex\.guessYear >= parkedYear \? 1 : -1/);
  expect(source).toMatch(/className=\{styles\.scrubCue\}/);
  expect(css).toMatch(/@keyframes scrubGesture/);
});

test('hands off from the burst by lifting it away as the timeline fades in', () => {
  const css = readFileSync(resolve(__dirname, './LandingDemo.module.css'), 'utf8');
  const burstHiddenBlock = css.match(/\.burstHidden\s*\{([^}]*)\}/);

  expect(burstHiddenBlock?.[1] ?? '').toMatch(/transform:\s*translateZ\(0\) translateY\(-10px\);/);
});

test('parks the first timeline before revealing the first active card', () => {
  const source = readFileSync(resolve(__dirname, './LandingDemo.tsx'), 'utf8');

  expect(source).toMatch(/setTimelineReady\(false\);[\s\S]*await scrollToYear\(firstStart, false, true\);[\s\S]*setShowPile\(false\);[\s\S]*await wait\(360\);[\s\S]*setTimelineReady\(true\);/);
  expect(source).toMatch(/!\s*effShowPile && timelineReady && \(/);
});

test('keeps the burst layer compositor-stable while it fades out', () => {
  const css = readFileSync(resolve(__dirname, './LandingDemo.module.css'), 'utf8');
  const burstBlock = css.match(/\.burst\s*\{([^}]*)\}/);

  expect(burstBlock?.[1] ?? '').toMatch(/transform:\s*translateZ\(0\);/);
  expect(burstBlock?.[1] ?? '').toMatch(/will-change:\s*opacity;/);
});
