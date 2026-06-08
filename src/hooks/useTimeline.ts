import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { vibrateLight, vibrateMedium } from '../lib/haptics';
import type { GameEvent } from '../types';

export function easeOvershoot(t: number): number {
  if (t < 0.18) {
    const p = t / 0.18;
    return 0.05 * p * p;
  }
  if (t < 0.94) {
    const p = (t - 0.18) / 0.76;
    return 0.05 + (1.008 - 0.05) * (1 - Math.pow(1 - p, 3));
  }

  const p = (t - 0.94) / 0.06;
  return 1.008 + (1.0 - 1.008) * (1 - Math.pow(1 - p, 2));
}

export function getScrollDuration(yearDiff: number): number {
  return Math.min(2400, Math.max(900, Math.abs(yearDiff) * 160));
}

const YEAR_WIDTH = 60;
const DEFAULT_RANGE_START = 1980;
const DEFAULT_RANGE_END = 2026;
const RANGE_PADDING = 5;

function computeRange(events: GameEvent[]): { start: number; end: number } {
  const currentYear = new Date().getFullYear();
  const end = Math.max(currentYear, DEFAULT_RANGE_END);
  if (events.length === 0) return { start: DEFAULT_RANGE_START, end };
  const minYear = Math.min(...events.map(e => e.year));
  // Only expand past default if a question is older; round down to nearest 5 with padding
  const start = minYear < DEFAULT_RANGE_START
    ? Math.floor((minYear - RANGE_PADDING) / 5) * 5
    : DEFAULT_RANGE_START;
  return { start, end };
}

export function useTimeline(events: GameEvent[] = []) {
  const range = useMemo(() => computeRange(events), [events]);
  const RANGE_START = range.start;
  const RANGE_END = range.end;

  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState(RANGE_END);
  const selectedYearRef = useRef(RANGE_END);
  const lastHapticYear = useRef(RANGE_END);
  const animationFrameRef = useRef<number | null>(null);
  const animationRejectRef = useRef<(() => void) | null>(null);
  const suppressScrollFeedbackRef = useRef(true);

  const syncYear = useCallback((year: number) => {
    setSelectedYear(year);
    selectedYearRef.current = year;
    lastHapticYear.current = year;
  }, []);

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (animationRejectRef.current) {
      animationRejectRef.current();
      animationRejectRef.current = null;
    }
  }, []);

  const scrollToYear = useCallback((
    year: number,
    smooth = true,
    suppressFeedback = false,
    spotlightCallback?: (centerX: number) => void,
  ) => {
    const container = containerRef.current;
    if (!container) return Promise.resolve();
    // The track starts after a 50vw (clientWidth/2) spacer.
    // Tick center for year Y = spacer + (Y - RANGE_START) * YEAR_WIDTH + YEAR_WIDTH/2
    // To center it: scrollLeft = tickCenter - clientWidth/2
    const spacer = container.clientWidth / 2;
    const tickCenter = spacer + (year - RANGE_START) * YEAR_WIDTH + YEAR_WIDTH / 2;
    const scrollTarget = tickCenter - container.clientWidth / 2;

    cancelAnimation();
    suppressScrollFeedbackRef.current = suppressFeedback;

    if (!smooth) {
      container.scrollTo({
        left: scrollTarget,
        behavior: 'auto',
      });
      syncYear(year);
      window.setTimeout(() => {
        suppressScrollFeedbackRef.current = false;
      }, 0);
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const start = container.scrollLeft;
      const distance = scrollTarget - start;

      if (Math.abs(distance) < 1) {
        syncYear(year);
        resolve();
        return;
      }

      const yearDiff = Math.abs(year - selectedYearRef.current);
      const duration = getScrollDuration(yearDiff);
      const startedAt = performance.now();

      animationRejectRef.current = () => {
        resolve();
      };

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOvershoot(progress);
        container.scrollLeft = start + distance * eased;

        if (spotlightCallback) {
          const currentCenterX = container.scrollLeft + container.clientWidth / 2;
          spotlightCallback(currentCenterX);
        }

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        animationFrameRef.current = null;
        animationRejectRef.current = null;
        syncYear(year);
        suppressScrollFeedbackRef.current = false;
        resolve();
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    });
  }, [RANGE_START, cancelAnimation, syncYear]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const spacer = container.clientWidth / 2;
    const centerX = container.scrollLeft + container.clientWidth / 2;
    const posInTrack = centerX - spacer;
    const yearIndex = Math.round((posInTrack - YEAR_WIDTH / 2) / YEAR_WIDTH);
    const clamped = Math.max(RANGE_START, Math.min(RANGE_END, yearIndex + RANGE_START));

    setSelectedYear(clamped);
    selectedYearRef.current = clamped;

    if (suppressScrollFeedbackRef.current) {
      lastHapticYear.current = clamped;
      return;
    }

    if (clamped !== lastHapticYear.current) {
      const direction = clamped > lastHapticYear.current ? 1 : -1;
      for (
        let year = lastHapticYear.current + direction;
        year !== clamped + direction;
        year += direction
      ) {
        if (year % 5 === 0) {
          vibrateMedium();
        } else {
          vibrateLight();
        }
      }
      lastHapticYear.current = clamped;
    }
  }, [RANGE_END, RANGE_START]);

  const snapToClosestYear = useCallback(() => {
    return scrollToYear(selectedYearRef.current, false, true);
  }, [scrollToYear]);

  useEffect(() => {
    requestAnimationFrame(() => {
      void scrollToYear(RANGE_END, false, true);
    });
  }, [RANGE_END, scrollToYear]);

  useEffect(() => cancelAnimation, [cancelAnimation]);

  return {
    containerRef,
    selectedYear,
    scrollToYear,
    syncYear,
    handleScroll,
    snapToClosestYear,
    rangeStart: RANGE_START,
    rangeEnd: RANGE_END,
    yearWidth: YEAR_WIDTH,
  };
}
