import { ChevronLeft } from './icons';
import { ChevronRight } from './icons';
import styles from './DateSelector.module.css';

interface DateSelectorProps {
  /** Number of days back from today (0 = today) */
  dayOffset: number;
  hasPrevious?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function DateSelector({ dayOffset, hasPrevious = true, onPrev, onNext }: DateSelectorProps) {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);

  const dayLabel = dayOffset === 0
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'long' });

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday = dayOffset === 0;

  return (
    <div className={styles.selector}>
      <button
        className={`${styles.arrow} ${!hasPrevious ? styles.arrowDisabled : ''}`}
        onClick={onPrev}
        disabled={!hasPrevious}
        type="button"
        aria-label="Previous day"
      >
        <ChevronLeft />
      </button>
      <div className={styles.center}>
        <span className={styles.dayLabel}>{dayLabel}</span>
        <span className={styles.dateLabel}>{dateStr}</span>
      </div>
      <button
        className={`${styles.arrow} ${isToday ? styles.arrowDisabled : ''}`}
        onClick={onNext}
        disabled={isToday}
        type="button"
        aria-label="Next day"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
