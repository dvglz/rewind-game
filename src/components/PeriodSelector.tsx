import { LEADERBOARD_PERIODS, type LeaderboardPeriod } from '../config/leaderboard';
import styles from './PeriodSelector.module.css';

interface PeriodSelectorProps {
  value: LeaderboardPeriod;
  onChange: (period: LeaderboardPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className={styles.selector} role="tablist" aria-label="Leaderboard period">
      {LEADERBOARD_PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={value === p.id}
          className={`${styles.tab} ${value === p.id ? styles.tabActive : ''}`}
          onClick={() => onChange(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
