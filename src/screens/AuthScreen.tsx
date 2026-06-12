import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { loginWithGoogle, loginWithEmail } from '../lib/auth';
import { ArrowLeft } from '../components/icons';
import { Toast } from '../components/Toast';
import styles from './AuthScreen.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  returnTo: string | null;
  contextMessage?: string;
}

export function AuthScreen({ onBack, onSuccess, returnTo, contextMessage }: AuthScreenProps) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const isValidEmail = EMAIL_RE.test(email.trim());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential);
      setUser(user);
      onSuccess();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const { containerRef } = useGoogleSignIn({
    onCredential: handleGoogleCredential,
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      // Preserve current query params (invite, returnTo) through the magic link redirect
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('mode', 'auth');
      if (returnTo) currentParams.set('returnTo', returnTo);
      const redirectUri = `${window.location.origin}/?${currentParams.toString()}`;
      await loginWithEmail(email.trim(), redirectUri);
      setEmailSent(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft />
        </button>
        <span className={styles.wordmark}>REWIND</span>
        <span className={styles.topBarSpacer} />
      </div>

      <div className={styles.content}>
        {emailSent ? (
          <div className={styles.emailSent}>
            <span className={styles.emailSentTitle}>Check your email</span>
            <p className={styles.emailSentMessage}>
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <button
              className={styles.resendButton}
              onClick={() => setEmailSent(false)}
              type="button"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className={styles.heading}>{'Sign in\nto Clutch Play'}</h1>
            <p className={styles.subtitle}>
              {contextMessage ?? 'Play with friends, track your scores'}
            </p>

            <div className={styles.providers}>
              <div className={styles.googleButton} ref={containerRef} />

              <span className={styles.divider}>or</span>

              <form className={styles.emailForm} onSubmit={handleEmailSubmit}>
                <input
                  className={styles.emailInput}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
                <button
                  className={styles.sendButton}
                  type="submit"
                  disabled={loading || !isValidEmail}
                >
                  {loading ? 'Sending…' : 'Send Link'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast} variant="error" />}
    </div>
  );
}
