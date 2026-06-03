import type { RoundResult as RoundResultType } from '../types';
import { getResultColor, getResultEmoji, getResultLabel } from '../engine/scoring';
import styles from './RoundResult.module.css';

interface RoundResultProps {
  result: RoundResultType;
  onNext: () => void;
  isLast: boolean;
}

export function RoundResult({ result, onNext, isLast }: RoundResultProps) {
  const color = getResultColor(result.diff);
  const emoji = getResultEmoji(color);

  const diffText = getResultLabel(color);

  return (
    <div className={styles.overlay}>
      <span className={styles.resultColor}>{emoji}</span>
      <span className={styles.actualYear}>{result.actualYear}</span>
      <span className={styles.diff}>{diffText}</span>
      <p className={styles.eventText}>{result.event.text}</p>
      <button className={styles.nextButton} onClick={onNext}>
        {isLast ? 'See Results' : 'Next'}
      </button>
    </div>
  );
}
