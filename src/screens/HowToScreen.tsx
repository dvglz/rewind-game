import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { RewindGlyph } from '../components/icons';
import { markRulesSeen } from '../engine/storage';
import { track } from '../lib/analytics';
import styles from './HowToScreen.module.css';

export type HowToEntryPoint = 'first_run' | 'menu' | 'footer';

interface HowToScreenProps {
  mode: 'play' | 'home';
  entryPoint: HowToEntryPoint;
  onPlay: () => void;
  onHome: () => void;
}

export function HowToScreen({ mode, entryPoint, onPlay, onHome }: HowToScreenProps) {
  useEffect(() => {
    markRulesSeen();
    track('rules_view', { entry_point: entryPoint });
  }, [entryPoint]);

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <RewindGlyph
          className={`${styles.glyph} ${styles.item}`}
          style={{ '--stagger-index': 0 } as CSSProperties}
        />

        <h1
          className={`${styles.title} ${styles.item}`}
          style={{ '--stagger-index': 1 } as CSSProperties}
        >
          Remember<br/>when it happened?
        </h1>

        <div
          className={`${styles.body} ${styles.item}`}
          style={{ '--stagger-index': 2 } as CSSProperties}
        >
          <p>5 iconic sports moments. Scroll the timeline, lock the year. Closer guess, higher score.</p>
        </div>

        <div
          className={`${styles.body} ${styles.item}`}
          style={{ '--stagger-index': 3 } as CSSProperties}
        >
          <p>NBA, NFL, MLB, college, and more. Later rounds are worth more. Fastest time breaks ties.</p>
        </div>

        <p
          className={`${styles.hook} ${styles.item}`}
          style={{ '--stagger-index': 4 } as CSSProperties}
        >
          Can you hit perfect 1,000?
        </p>

        <p
          className={`${styles.emojiRow} ${styles.item}`}
          style={{ '--stagger-index': 5 } as CSSProperties}
          aria-label="Five green circles"
        >
          🟢🟢🟢🟢🟢
        </p>

        {mode === 'play' ? (
          <button
            type="button"
            className={`${styles.cta} ${styles.item}`}
            style={{ '--stagger-index': 6 } as CSSProperties}
            onClick={onPlay}
          >
            Play
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.cta} ${styles.item}`}
            style={{ '--stagger-index': 6 } as CSSProperties}
            onClick={onHome}
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}
