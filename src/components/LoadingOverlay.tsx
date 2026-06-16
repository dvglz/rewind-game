import { RewindGlyph } from './icons';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  label?: string;
}

export function LoadingOverlay({ label }: LoadingOverlayProps) {
  return (
    <div className={styles.overlay} role="status" aria-label={label ?? 'Loading'}>
      <RewindGlyph className={styles.glyph} aria-hidden="true" />
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
