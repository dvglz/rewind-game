import { useRef, useState, useCallback, useEffect } from 'react';
import { vibrateLight, vibrateMedium } from '../lib/haptics';

const YEAR_WIDTH = 60;
const RANGE_START = 1984;
const RANGE_END = 2026;

export function useTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState(RANGE_END);
  const lastHapticYear = useRef(RANGE_END);

  const scrollToYear = useCallback((year: number, smooth = true) => {
    const container = containerRef.current;
    if (!container) return;
    const offset = (year - RANGE_START) * YEAR_WIDTH;
    const centerOffset = offset - container.clientWidth / 2 + YEAR_WIDTH / 2;
    container.scrollTo({
      left: centerOffset,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const centerX = container.scrollLeft + container.clientWidth / 2;
    const year = Math.round(centerX / YEAR_WIDTH) + RANGE_START;
    const clamped = Math.max(RANGE_START, Math.min(RANGE_END, year));

    setSelectedYear(clamped);

    if (clamped !== lastHapticYear.current) {
      if (clamped % 5 === 0) {
        vibrateMedium();
      } else {
        vibrateLight();
      }
      lastHapticYear.current = clamped;
    }
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToYear(RANGE_END, false);
    });
  }, [scrollToYear]);

  return {
    containerRef,
    selectedYear,
    scrollToYear,
    handleScroll,
    rangeStart: RANGE_START,
    rangeEnd: RANGE_END,
    yearWidth: YEAR_WIDTH,
  };
}
