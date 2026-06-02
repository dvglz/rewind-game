import { useTimeline } from '../hooks/useTimeline';
import styles from './Timeline.module.css';

interface TimelineProps {
  disabled?: boolean;
  onYearChange?: (year: number) => void;
}

export function Timeline({ disabled, onYearChange }: TimelineProps) {
  const timeline = useTimeline();

  const years = Array.from(
    { length: timeline.rangeEnd - timeline.rangeStart + 1 },
    (_, i) => timeline.rangeStart + i
  );

  return (
    <div className={styles.wrapper}>
      <div
        ref={timeline.containerRef}
        className={styles.scrollContainer}
        onScroll={() => {
          timeline.handleScroll();
          onYearChange?.(timeline.selectedYear);
        }}
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
              >
                <div className={styles.tickLine} />
                <span className={styles.yearLabel}>{year}</span>
              </div>
            );
          })}
        </div>
        <div style={{ minWidth: '50vw', flexShrink: 0 }} />
      </div>
      <div className={styles.centerIndicator} />
    </div>
  );
}
