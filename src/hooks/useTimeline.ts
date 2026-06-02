import { useRef, useState, useCallback, useEffect } from 'react';
import { vibrateLight, vibrateMedium } from '../lib/haptics';

const YEAR_WIDTH = 60;
const RANGE_START = 1984;
const RANGE_END = 2026;

export function useTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState(RANGE_END);
  const lastHapticYear = useRef(RANGE_END);
  const animationFrameRef = useRef<number | null>(null);
  const animationRejectRef = useRef<(() => void) | null>(null);
  const suppressScrollFeedbackRef = useRef(true);

  const syncYear = useCallback((year: number) => {
    setSelectedYear(year);
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

      const duration = Math.min(1900, Math.max(1150, Math.abs(distance) * 5.5));
      const startedAt = performance.now();

      const easeInOutCubic = (t: number) => (
        t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2
      );

      animationRejectRef.current = () => {
        resolve();
      };

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(progress);
        container.scrollLeft = start + distance * eased;

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
  }, [cancelAnimation, syncYear]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const spacer = container.clientWidth / 2;
    const centerX = container.scrollLeft + container.clientWidth / 2;
    const posInTrack = centerX - spacer;
    const yearIndex = Math.round((posInTrack - YEAR_WIDTH / 2) / YEAR_WIDTH);
    const clamped = Math.max(RANGE_START, Math.min(RANGE_END, yearIndex + RANGE_START));

    setSelectedYear(clamped);

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
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      void scrollToYear(RANGE_END, false, true);
    });
  }, [scrollToYear]);

  useEffect(() => cancelAnimation, [cancelAnimation]);

  return {
    containerRef,
    selectedYear,
    scrollToYear,
    syncYear,
    handleScroll,
    rangeStart: RANGE_START,
    rangeEnd: RANGE_END,
    yearWidth: YEAR_WIDTH,
  };
}
