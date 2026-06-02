import { useState, useEffect } from 'react';
import { getLeaderboard, signInWithEmail, getUser, type LeaderboardEntry } from '../lib/supabase';
import styles from './Leaderboard.module.css';

interface LeaderboardProps {
  puzzleId: string;
}

export function Leaderboard({ puzzleId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      setIsAuthed(!!user);
      const lb = await getLeaderboard(puzzleId);
      setEntries(lb);
      setLoading(false);
    })();
  }, [puzzleId]);

  const handleAuth = async () => {
    if (!email) return;
    const success = await signInWithEmail(email);
    if (success) setEmailSent(true);
  };

  if (loading) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Today's Leaderboard</h3>

      {entries.length > 0 ? (
        <div className={styles.list}>
          {entries.map((entry) => (
            <div key={entry.rank} className={styles.row}>
              <span className={styles.rank}>#{entry.rank}</span>
              <span className={styles.name}>{entry.displayName}</span>
              <span className={styles.score}>{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
          No scores yet today. Be the first!
        </p>
      )}

      {!isAuthed && (
        <div className={styles.authPrompt}>
          {emailSent ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              Check your email for the login link!
            </p>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>
                Sign in to join the leaderboard
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.emailInput}
              />
              <br />
              <button onClick={handleAuth} className={styles.authButton}>
                Send Magic Link
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
