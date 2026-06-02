import { vibrateConfirm } from '../lib/haptics';
import styles from './ConfirmButton.module.css';

interface ConfirmButtonProps {
  selectedYear: number;
  onConfirm: () => void;
  disabled?: boolean;
}

export function ConfirmButton({ selectedYear, onConfirm, disabled }: ConfirmButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    vibrateConfirm();
    onConfirm();
  };

  return (
    <div className={styles.container}>
      <span className={styles.year}>{selectedYear}</span>
      <button className={styles.button} onClick={handleClick} disabled={disabled}>
        <div className={styles.arrow} />
      </button>
    </div>
  );
}
