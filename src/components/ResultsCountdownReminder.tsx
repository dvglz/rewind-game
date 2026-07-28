import { useEffect, useState } from 'react';
import { RewindGlyph } from './icons';
import { formatCountdown, msToNextReset } from '../lib/countdown';
import { track } from '../lib/analytics';
import { EIGHTEEN_NAMES_URL, EIGHTEEN_PROMO } from '../data/crossPromo';
import styles from './ResultsCountdownReminder.module.css';

// How long the live countdown holds before rolling over to the 18 Names promo.
// Every mount restarts this (component state), so a fresh results view always
// leads with the countdown before revealing the cross-promo.
const PROMO_SWAP_MS = 3000;

interface ResultsCountdownReminderProps {
  showNotifyCta: boolean;
  onNotify: () => void;
}

export function ResultsCountdownReminder({ showNotifyCta, onNotify }: ResultsCountdownReminderProps) {
  const [remaining, setRemaining] = useState(() => msToNextReset());
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(msToNextReset());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const swap = window.setTimeout(() => setShowPromo(true), PROMO_SWAP_MS);
    return () => window.clearTimeout(swap);
  }, []);

  return (
    <section className={styles.reminder} aria-label="Next Rewind puzzle">
      {showPromo ? (
        <div className={styles.roll}>
          <div className={styles.rollOld} aria-hidden="true">
            <RewindGlyph className={styles.glyph} aria-hidden="true" />
            <span className={styles.countdown}>New Game in {formatCountdown(remaining)}</span>
          </div>
          <a
            className={styles.rollNew}
            href={EIGHTEEN_NAMES_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('promo_18names_click', { surface: 'results' })}
          >
            <RewindGlyph className={styles.glyph} aria-hidden="true" />
            <span className={styles.promoText}>Play {EIGHTEEN_PROMO.title}</span>
          </a>
        </div>
      ) : (
        <>
          <div className={styles.countdownGroup}>
            <RewindGlyph className={styles.glyph} aria-hidden="true" />
            <span className={styles.countdown}>New Game in {formatCountdown(remaining)}</span>
          </div>
          {showNotifyCta && (
            <button className={styles.notifyButton} type="button" onClick={onNotify}>
              Notify Me
            </button>
          )}
        </>
      )}
    </section>
  );
}
