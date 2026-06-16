import styles from './ToastRegion.module.css';

export const TOAST_REGION_ID = 'rewind-toast-region';

export function ToastRegion() {
  return <div id={TOAST_REGION_ID} className={styles.region} aria-live="polite" />;
}
