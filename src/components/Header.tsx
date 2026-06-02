import styles from './Header.module.css';

export function Header() {
  const today = new Date();
  const formatted = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  return (
    <header className={styles.header}>
      <span className={styles.wordmark}>REWIND</span>
      <span className={styles.date}>{formatted}</span>
    </header>
  );
}
