import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  variant?: 'default' | 'error';
}

export function Toast({ message, variant = 'default' }: ToastProps) {
  return (
    <div className={`${styles.toast} ${variant === 'error' ? styles.error : ''}`}>
      {message}
    </div>
  );
}
