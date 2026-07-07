import { RewindGlyph } from './icons';
import styles from './JoinRewindCard.module.css';

interface JoinRewindCardProps {
  onSignIn: () => void;
}

const BENEFITS = [
  'Save scores and ranks',
  'Play in private groups',
  'Access the full archive',
  'Get daily reminders. No spam.',
];

export function JoinRewindCard({ onSignIn }: JoinRewindCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.highlight}>
        <RewindGlyph className={styles.icon} />
        <p className={styles.heading}>
          Sign in to unlock
          <br />
          free Rewind features
        </p>
      </div>
      <ul className={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <li key={benefit} className={styles.benefit}>
            {benefit}
          </li>
        ))}
      </ul>
      <button type="button" className={styles.signInButton} onClick={onSignIn}>
        Sign In
      </button>
    </div>
  );
}
