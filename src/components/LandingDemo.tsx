import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { GameEvent, ResultColor } from '../types';
import { getResultColorVar, getResultLabel } from '../engine/scoring';
import { getScrollDuration, useTimeline } from '../hooks/useTimeline';
import { Timeline } from './Timeline';
import styles from './LandingDemo.module.css';

interface DemoExample {
  prompt: string;
  /** Correct answer year, used for scoring the demo honestly. */
  actualYear: number;
  /** The year the pointer scrubs to and rests on. */
  guessYear: number;
  /** Where the pointer parks before scrubbing into the guess. */
  startOffset: number;
}

// Curated pool, decoupled from today's puzzle. Leads with a perfect guess so the
// demo opens on the satisfying reveal, then mixes in looser guesses for variety.
const EXAMPLES: DemoExample[] = [
  { prompt: 'MJ Flu Game takes place', actualYear: 1997, guessYear: 1997, startOffset: 4 },
  { prompt: 'Shaq is drafted by Orlando', actualYear: 1992, guessYear: 1993, startOffset: -5 },
  { prompt: 'Cavs come back from 3-1', actualYear: 2016, guessYear: 2016, startOffset: -6 },
  { prompt: "Pierce's Wheelchair game", actualYear: 2008, guessYear: 2017, startOffset: -5 },
  { prompt: "Zion's shoe explodes", actualYear: 2019, guessYear: 2021, startOffset: -6 },
];

// Opening burst: the five demo questions pop in one-by-one in a lively
// left/right zig-zag with playful tilt. Cards alternate sides so the beat feels
// energetic and scattered, yet never overlaps — every prompt stays legible.
const BURST_LAYOUT = [
  { x: -28, y: -92, r: '-7deg', delay: 0 },
  { x: 58, y: -40, r: '6deg', delay: 90 },
  { x: -54, y: 4, r: '-5deg', delay: 180 },
  { x: 62, y: 50, r: '8deg', delay: 270 },
  { x: -22, y: 96, r: '-4deg', delay: 360 },
];

const BURST_CARDS = EXAMPLES.map((ex, i) => ({ prompt: ex.prompt, ...BURST_LAYOUT[i] }));

export function getLandingDemoResultColor(diff: number): ResultColor {
  const absDiff = Math.abs(diff);
  if (absDiff === 0) return 'perfect';
  if (absDiff <= 3) return 'ballpark';
  if (absDiff <= 6) return 'not-even-close';
  return 'wrong-era';
}

const showsCorrectYear = (tier: ResultColor) => tier === 'perfect';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function usePageHidden(): boolean {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return hidden;
}

export function LandingDemo() {
  const reducedMotion = usePrefersReducedMotion();
  const pageHidden = usePageHidden();

  // Feed the timeline the example years so its range brackets them.
  const events: GameEvent[] = useMemo(
    () => EXAMPLES.map((ex) => ({ text: ex.prompt, year: ex.actualYear })),
    [],
  );
  const timeline = useTimeline(events);
  const { scrollToYear, rangeStart, rangeEnd } = timeline;

  const [showPile, setShowPile] = useState(true);
  const [burstCycle, setBurstCycle] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  // Drives the touch cue that mimics a thumb scrubbing the timeline each round.
  const [scrub, setScrub] = useState<{ key: number; dir: number; dur: number } | null>(null);
  const scrubKeyRef = useRef(0);

  // Reduced motion: position the timeline on example 0 once, no looping.
  // (Rendered state is derived below, so no setState here.)
  useEffect(() => {
    if (reducedMotion) {
      void scrollToYear(EXAMPLES[0].guessYear, false, true);
    }
  }, [reducedMotion, scrollToYear]);

  useEffect(() => {
    if (reducedMotion || pageHidden) {
      return;
    }

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(resolve, ms);
        cleanups.push(() => window.clearTimeout(id));
      });
    const cleanups: Array<() => void> = [];

    async function run() {
      let parkedYear = EXAMPLES[0].guessYear + EXAMPLES[0].startOffset;
      // Loop forever: pile beat, then each example played start to finish.
      while (!cancelled) {
        setBurstCycle((cycle) => cycle + 1);
        setShowPile(true);
        setRevealedIndex(null);
        setScrub(null);
        await wait(2600);
        if (cancelled) return;

        const firstStart = Math.min(
          rangeEnd,
          Math.max(rangeStart, EXAMPLES[0].guessYear + EXAMPLES[0].startOffset),
        );
        await scrollToYear(firstStart, false, true);
        parkedYear = firstStart;
        setActiveIndex(0);
        setShowPile(false);

        for (let i = 0; i < EXAMPLES.length && !cancelled; i += 1) {
          const ex = EXAMPLES[i];
          const start = Math.min(rangeEnd, Math.max(rangeStart, ex.guessYear + ex.startOffset));
          const shouldParkBeforeScene = i === 0 && parkedYear !== start;
          if (shouldParkBeforeScene) {
            await scrollToYear(start, false, true);
            parkedYear = start;
          }
          setActiveIndex(i);
          setRevealedIndex(null);
          await wait(280);
          if (cancelled) return;
          // Show a thumb "scrubbing" the strip in the same direction the years travel.
          scrubKeyRef.current += 1;
          setScrub({
            key: scrubKeyRef.current,
            dir: ex.guessYear >= parkedYear ? 1 : -1,
            dur: getScrollDuration(Math.abs(ex.guessYear - parkedYear)),
          });
          await scrollToYear(ex.guessYear, true, true);
          parkedYear = ex.guessYear;
          if (cancelled) return;
          setRevealedIndex(i);
          await wait(1300);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [reducedMotion, pageHidden, scrollToYear, rangeStart, rangeEnd]);

  // Under reduced motion, render a static revealed frame on example 0.
  const effShowPile = reducedMotion ? false : showPile;
  const effActiveIndex = reducedMotion ? 0 : activeIndex;
  const active = EXAMPLES[effActiveIndex];
  const revealed = reducedMotion ? true : revealedIndex !== null;
  const diff = active.guessYear - active.actualYear;
  const tier: ResultColor = getLandingDemoResultColor(diff);
  const pillColor = getResultColorVar(tier);
  const pillStyle = { '--pill-color': pillColor } as CSSProperties;

  return (
    <div className={styles.demo} aria-hidden="true">
      <div className={styles.cardRow}>
        {!effShowPile && (
          <p key={effActiveIndex} className={`${styles.card} ${styles.activeCard}`}>
            {active.prompt}
          </p>
        )}
      </div>

      <div className={styles.timelineBox}>
        <div className={`${styles.timelineInner} ${effShowPile ? styles.timelineDim : ''}`}>
          <Timeline
            containerRef={timeline.containerRef}
            rangeStart={timeline.rangeStart}
            rangeEnd={timeline.rangeEnd}
            yearWidth={timeline.yearWidth}
            onScroll={timeline.handleScroll}
            disabled
            revealedYear={revealed && showsCorrectYear(tier) ? active.actualYear : null}
            indicatorColor={revealed ? pillColor : undefined}
          />
        </div>

        <div key={burstCycle} className={`${styles.burst} ${effShowPile ? '' : styles.burstHidden}`}>
          {BURST_CARDS.map((c, i) => (
            <span
              key={i}
              className={`${styles.card} ${styles.burstCard}`}
              style={
                {
                  '--x': `${c.x}px`,
                  '--y': `${c.y}px`,
                  '--r': c.r,
                  '--delay': `${c.delay}ms`,
                } as CSSProperties
              }
            >
            {c.prompt}
            </span>
          ))}
        </div>

        {!effShowPile && scrub && (
          <span
            key={`scrub-${scrub.key}`}
            className={styles.scrubCue}
            style={
              {
                '--scrub-dur': `${scrub.dur}ms`,
                '--from': `${scrub.dir * 30}px`,
                '--to': `${scrub.dir * -30}px`,
              } as CSSProperties
            }
          />
        )}

        <div className={styles.labelRow}>
          {revealed && (
            <span
              className={`${styles.pill} ${tier === 'ballpark' ? styles.pillDark : ''}`}
              style={pillStyle}
            >
              {getResultLabel(tier)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
