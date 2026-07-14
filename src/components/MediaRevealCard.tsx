import { useState } from 'react';
import type { SpecialEventMedia } from '../types';
import styles from './MediaRevealCard.module.css';

interface MediaRevealCardProps {
  media: SpecialEventMedia;
  buttonLabel: string;
  onNext: () => void;
}

export function MediaRevealCard({ media, buttonLabel, onNext }: MediaRevealCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={styles.backdrop}>
      <div className={styles.card} role="dialog" aria-label={media.caption}>
        {!imageFailed && (
          <img
            className={styles.photo}
            src={media.src}
            alt={media.caption}
            onError={() => setImageFailed(true)}
          />
        )}
        <p className={styles.caption}>{media.caption}</p>
        <p className={styles.credit}>{media.credit}</p>
        <button type="button" className={styles.nextButton} onClick={onNext}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
