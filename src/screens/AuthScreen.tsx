import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { loginWithGoogle, requestEmailCode, validateEmailCode } from '../lib/auth';
import { ArrowLeft } from '../components/icons';
import { Toast } from '../components/Toast';
import { OtpInput } from '../components/OtpInput';
import { track, setUser as setAnalyticsUser } from '../lib/analytics';
import styles from './AuthScreen.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;

interface AuthScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  returnTo: string | null;
  contextMessage?: string;
}

export function AuthScreen({ onBack, onSuccess, returnTo, contextMessage }: AuthScreenProps) {
  void returnTo; // navigation state is handled by the caller via onSuccess
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
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
      track('auth_success', { method: 'google' });
      setAnalyticsUser({ user_id: user.id, is_authenticated: true, auth_method: 'google' });
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
    if (!isValidEmail) return;
    setLoading(true);
    try {
      await requestEmailCode(email.trim());
      setCode('');
      setStep('code');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (fullCode: string) => {
    setLoading(true);
    try {
      const user = await validateEmailCode(email.trim(), fullCode);
      setUser(user);
      track('auth_success', { method: 'email' });
      setAnalyticsUser({ user_id: user.id, is_authenticated: true, auth_method: 'email' });
      onSuccess();
      // Keep the button in its loading state through navigation — do not reset
      // here, or it flashes back to "Verify" before the route changes.
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid code');
      setCode('');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await requestEmailCode(email.trim());
      setCode('');
      showToast('New code sent');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const backToEmail = () => {
    setStep('email');
    setCode('');
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button
          className={styles.backButton}
          onClick={step === 'code' ? backToEmail : onBack}
          type="button"
          aria-label="Back"
        >
          <ArrowLeft />
        </button>
        <span className={styles.wordmark}>REWIND</span>
        <span className={styles.topBarSpacer} />
      </div>

      <div className={styles.content}>
        {step === 'code' ? (
          <div className={styles.codeStep}>
            <h1 className={styles.heading}>Enter code</h1>
            <p className={styles.subtitle}>
              We sent a {CODE_LENGTH}-digit code to <strong>{email}</strong>
            </p>

            <OtpInput
              length={CODE_LENGTH}
              value={code}
              onChange={setCode}
              onComplete={submitCode}
              disabled={loading}
              autoFocus
            />

            <button
              className={styles.sendButton}
              type="button"
              disabled={loading || code.length !== CODE_LENGTH}
              onClick={() => submitCode(code)}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>

            <div className={styles.codeActions}>
              <button className={styles.resendButton} onClick={handleResend} type="button" disabled={loading}>
                Resend code
              </button>
              <button className={styles.resendButton} onClick={backToEmail} type="button">
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className={styles.heading}>{'Sign in\nto Rewind'}</h1>
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
                  {loading ? 'Sending…' : 'Get Code'}
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
