import { type RefObject } from 'react';
import styles from './Timeline.module.css';

interface TimelineProps {
  containerRef: RefObject<HTMLDivElement | null>;
  rangeStart: number;
  rangeEnd: number;
  yearWidth: number;
  onScroll: () => void;
  disabled?: boolean;
  revealedYear?: number | null;
  indicatorColor?: string;
}

export function Timeline({
  containerRef,
  rangeStart,
  rangeEnd,
  yearWidth,
  onScroll,
  disabled,
  revealedYear,
  indicatorColor,
}: TimelineProps) {
  const years = Array.from(
    { length: rangeEnd - rangeStart + 1 },
    (_, i) => rangeStart + i
  );

  return (
    <div className={styles.wrapper} data-testid="timeline-wrapper">
      <div
        ref={containerRef}
        className={styles.scrollContainer}
        onScroll={onScroll}
        style={{ pointerEvents: disabled ? 'none' : 'auto' }}
      >
        <div style={{ minWidth: '50vw', flexShrink: 0 }} />
        <div className={styles.track}>
          {years.map((year) => {
            const isMajor = year % 5 === 0;
            const isRevealed = revealedYear !== null && revealedYear !== undefined;
            const isCorrectYear = revealedYear === year;
            const tickClassName = [
              styles.tick,
              isMajor ? styles.tickMajor : styles.tickMinor,
              isRevealed ? styles.tickRevealed : '',
              isCorrectYear ? styles.tickCorrect : '',
            ].filter(Boolean).join(' ');

            return (
              <div
                key={year}
                className={tickClassName}
                style={{ width: yearWidth }}
              >
                <div className={styles.tickLine} />
                <span className={styles.yearLabel}>{year}</span>
              </div>
            );
          })}
        </div>
        <div style={{ minWidth: '50vw', flexShrink: 0 }} />
      </div>
      <div
        className={styles.centerIndicator}
        data-testid="timeline-indicator"
        style={indicatorColor ? { borderBottomColor: indicatorColor } : undefined}
      />
    </div>
  );
}
