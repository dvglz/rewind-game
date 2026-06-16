import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOAST_REGION_ID } from './ToastRegion';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  variant?: 'default' | 'error';
}

export function Toast({ message, variant = 'default' }: ToastProps) {
  const [region, setRegion] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // One-time read of the portal mount node after it has committed to the DOM.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRegion(document.getElementById(TOAST_REGION_ID));
  }, []);

  const node = (
    <div className={`${styles.toast} ${variant === 'error' ? styles.error : ''}`}>
      {message}
    </div>
  );

  return region ? createPortal(node, region) : node;
}
