import { ChevronLeft } from './icons';
import { ChevronRight } from './icons';
import styles from './DateSelector.module.css';

interface DateSelectorProps {
  /** Number of days back from today (0 = today) */
  dayOffset: number;
  /** Base ISO date that should be treated as "today" for this selector. */
  baseDate?: string;
  hasPrevious?: boolean;
  /** Overrides the weekday line (e.g. "Messi Special 🇦🇷" for a special-event board). */
  specialLabel?: string;
  /** Explicit primary line (overrides the computed weekday/Today line). */
  label?: string;
  /** Explicit secondary line (overrides the computed date line). */
  subLabel?: string;
  /** Force the next arrow's state (used when a special slot sits between days). */
  canNext?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function DateSelector({ dayOffset, baseDate, hasPrevious = true, specialLabel, label, subLabel, canNext, onPrev, onNext }: DateSelectorProps) {
  const date = baseDate ? new Date(`${baseDate}T00:00:00Z`) : new Date();
  if (baseDate) {
    date.setUTCDate(date.getUTCDate() - dayOffset);
  } else {
    date.setDate(date.getDate() - dayOffset);
  }

  const dayLabel = label ?? specialLabel ?? (dayOffset === 0
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'long', ...(baseDate ? { timeZone: 'UTC' } : {}) }));

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(baseDate ? { timeZone: 'UTC' } : {}),
  });

  const nextDisabled = canNext != null ? !canNext : dayOffset === 0;

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
        <span className={styles.dateLabel}>{subLabel ?? dateStr}</span>
      </div>
      <button
        className={`${styles.arrow} ${nextDisabled ? styles.arrowDisabled : ''}`}
        onClick={onNext}
        disabled={nextDisabled}
        type="button"
        aria-label="Next day"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
