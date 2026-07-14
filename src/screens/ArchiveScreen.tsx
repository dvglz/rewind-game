import { getPuzzleForDate, getSport } from '../data/puzzles';
import { getTodayString } from '../lib/date';
import { ArrowLeft } from '../components/icons';
import styles from './ArchiveScreen.module.css';

interface ArchiveScreenProps {
  onBack: () => void;
  onPlayPast: (date: string) => void;
}

function shiftDate(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function ArchiveScreen({ onBack, onPlayPast }: ArchiveScreenProps) {
  const sport = getSport();
  const today = getTodayString();

  // Every past day back to launch (#001). Today's number bounds the loop; the
  // `number < 1` break is a safety net for dates before DAY_ZERO_DATE.
  const todayNumber = getPuzzleForDate(today, sport).number;
  const days: { date: string; number: number; flag?: string }[] = [];
  for (let offset = 1; offset < todayNumber; offset++) {
    const date = shiftDate(today, -offset);
    const puzzle = getPuzzleForDate(date, sport);
    if (puzzle.number < 1) break; // before launch
    days.push({ date, number: puzzle.number, flag: puzzle.special?.flag });
  }

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft />
        </button>
        <button className={`${styles.wordmark} ${styles.wordmarkAction}`} onClick={onBack} type="button">
          REWIND
        </button>
        <span className={styles.topBarSpacer} />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Archive</h1>
        <p className={styles.subtitle}>Replay past days. Scores aren’t saved.</p>

        {days.length === 0 ? (
          <p className={styles.empty}>No past puzzles yet — check back tomorrow.</p>
        ) : (
          <ul className={styles.list}>
            {days.map(({ date, number, flag }) => (
              <li key={date}>
                <button
                  className={styles.row}
                  type="button"
                  onClick={() => onPlayPast(date)}
                  aria-label={`Play #${String(number).padStart(3, '0')}`}
                >
                  <span className={styles.rowNumber}>
                    #{String(number).padStart(3, '0')}{flag ? ` ${flag}` : ''}
                  </span>
                  <span className={styles.rowDate}>{formatDate(date)}</span>
                  <span className={styles.rowPlay}>Play</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
