import { vibrateConfirm } from '../lib/haptics';
import styles from './ConfirmButton.module.css';

interface ConfirmButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
}

export function ConfirmButton({ onConfirm, disabled }: ConfirmButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    vibrateConfirm();
    onConfirm();
  };

  return (
    <div className={styles.container}>
      <button className={styles.button} onClick={handleClick} disabled={disabled}>
        <span className={styles.label}>Lock</span>
      </button>
    </div>
  );
}
