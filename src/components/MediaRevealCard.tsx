import { useState, type CSSProperties } from 'react';
import type { SpecialEventMedia } from '../types';
import styles from './MediaRevealCard.module.css';

interface MediaRevealCardProps {
  media: SpecialEventMedia;
  /** Reveal blurb shown inside the overlay (replaces the footer reveal text on media rounds). */
  detail: string;
  /** Slight print-photo rotation in degrees, varied per round. */
  tilt: number;
  buttonLabel: string;
  onNext: () => void;
}

export function MediaRevealCard({ media, detail, tilt, buttonLabel, onNext }: MediaRevealCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={styles.overlay} role="dialog" aria-label={media.caption}>
      {!imageFailed && (
        <div className={styles.photoZone}>
          <div
            className={styles.polaroid}
            style={{ '--tilt': `${tilt}deg` } as CSSProperties}
          >
            <img
              className={styles.photo}
              src={media.src}
              alt={media.caption}
              onError={() => setImageFailed(true)}
            />
          </div>
        </div>
      )}
      <div className={styles.footer}>
        <p className={styles.detail}>
          {detail}{' '}
          <a
            className={styles.creditsLink}
            href={media.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={media.credit}
          >
            Image credits.
          </a>
        </p>
        <button type="button" className={styles.nextButton} onClick={onNext}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
