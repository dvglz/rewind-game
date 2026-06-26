import { useEffect, useState } from 'react';
import { RewindGlyph } from './icons';
import { formatCountdown, msToNextReset } from '../lib/countdown';
import styles from './ResultsCountdownReminder.module.css';

interface ResultsCountdownReminderProps {
  showNotifyCta: boolean;
  onNotify: () => void;
}

export function ResultsCountdownReminder({ showNotifyCta, onNotify }: ResultsCountdownReminderProps) {
  const [remaining, setRemaining] = useState(() => msToNextReset());

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(msToNextReset());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className={styles.reminder} aria-label="Next Rewind puzzle">
      <div className={styles.countdownGroup}>
        <RewindGlyph className={styles.glyph} aria-hidden="true" />
        <span className={styles.countdown}>New Game in {formatCountdown(remaining)}</span>
      </div>
      {showNotifyCta && (
        <button className={styles.notifyButton} type="button" onClick={onNotify}>
          Notify Me
        </button>
      )}
    </section>
  );
}
