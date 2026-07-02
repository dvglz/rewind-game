import { useEffect, useState } from 'react';
import { msToNextReset, formatCountdown } from '../lib/countdown';
import styles from './CountdownBar.module.css';

interface CountdownBarProps {
  puzzleNumber: number;
}

export function CountdownBar({ puzzleNumber }: CountdownBarProps) {
  const [remaining, setRemaining] = useState(() => msToNextReset());

  useEffect(() => {
    const id = setInterval(() => setRemaining(msToNextReset()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.bar}>
      <span className={styles.label}>Rewind #{puzzleNumber}</span>
      <span className={styles.dot}>·</span>
      <span className={styles.label}>next in </span>
      <span className={styles.time}>{formatCountdown(remaining)}</span>
    </div>
  );
}
