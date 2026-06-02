import { type RefObject } from 'react';
import styles from './Timeline.module.css';

interface TimelineProps {
  containerRef: RefObject<HTMLDivElement | null>;
  rangeStart: number;
  rangeEnd: number;
  yearWidth: number;
  onScroll: () => void;
  disabled?: boolean;
}

export function Timeline({
  containerRef,
  rangeStart,
  rangeEnd,
  yearWidth,
  onScroll,
  disabled,
}: TimelineProps) {
  const years = Array.from(
    { length: rangeEnd - rangeStart + 1 },
    (_, i) => rangeStart + i
  );

  return (
    <div className={styles.wrapper}>
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
            return (
              <div
                key={year}
                className={`${styles.tick} ${isMajor ? styles.tickMajor : styles.tickMinor}`}
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
    </div>
  );
}
