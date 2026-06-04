import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { ShareCard } from '../components/ShareCard';
import { loadGameState, loadStats } from '../engine/storage';
import { getTodaysPuzzle, getSport } from '../data/puzzles';
import { getMaxPossibleScore } from '../engine/scoring';
import { generateShareText, shareResults, type ShareOutcome } from '../lib/share';
import { getUser, signInWithEmail } from '../lib/supabase';

interface ResultsScreenProps {
  onHome: () => void;
}

export function ResultsScreen({ onHome }: ResultsScreenProps) {
  const puzzle = getTodaysPuzzle();
  const sport = getSport();
  const state = useMemo(() => loadGameState(puzzle.id), [puzzle.id]);
  const stats = useMemo(() => loadStats(), []);
  const [shareState, setShareState] = useState<ShareOutcome | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const maxScore = getMaxPossibleScore(5);

  useEffect(() => {
    void (async () => {
      const user = await getUser();
      setIsAuthed(Boolean(user));
    })();
  }, []);

  if (!state || !state.completed) {
    onHome();
    return null;
  }

  const handleShare = async () => {
    if (!state) return;
    const text = generateShareText(
      puzzle.number,
      state.results,
      state.totalScore,
      maxScore,
      stats.currentStreak,
      sport,
    );
    const outcome = await shareResults(text);
    setShareState(outcome);
    if (outcome !== 'failed') {
      setTimeout(() => setShareState(null), 2000);
    }
  };

  const handleCreateAccount = async () => {
    if (isAuthed) return;
    if (!showAuthForm) {
      setShowAuthForm(true);
      return;
    }
    if (!email) return;
    const success = await signInWithEmail(email);
    if (success) {
      setEmailSent(true);
    }
  };

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <Header sport={sport} onHome={onHome} />
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '400px',
        padding: '16px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: '16px',
        overflowY: 'auto',
        touchAction: 'pan-y',
      }}>
        <ShareCard
          puzzleNumber={puzzle.number}
          results={state.results}
          totalScore={state.totalScore}
          maxScore={maxScore}
          stats={stats}
          sport={sport}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: '16px',
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              border: 'none',
              background: 'var(--color-text)',
              color: 'var(--color-bg)',
              borderRadius: '999px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Share Score
          </button>
          <span style={{
            minHeight: '20px',
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: shareState === 'failed' ? 'var(--color-wrong)' : 'var(--color-correct)',
          }}>
            {shareState === 'shared' && 'Shared'}
            {shareState === 'copied' && 'Copied to clipboard'}
            {shareState === 'failed' && 'Sharing unavailable on this device'}
          </span>
        </div>

        <section style={{
          border: '1px dashed var(--color-border)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            textTransform: 'uppercase',
          }}>
            {isAuthed ? 'Account Ready' : 'Create Account'}
          </h3>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--color-muted)',
            lineHeight: 1.5,
          }}>
            {isAuthed
              ? 'Your account is connected for future leaderboard and streak features.'
              : 'Use email sign-in to unlock saved identity and future leaderboard placement.'}
          </p>
          {!isAuthed && showAuthForm && (
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                padding: '12px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
              }}
            />
          )}
          {!isAuthed && emailSent && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--color-correct)',
            }}>
              Check your email for the login link.
            </p>
          )}
          <button
            onClick={() => void handleCreateAccount()}
            disabled={isAuthed}
            style={{
              width: '100%',
              padding: '16px',
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              border: '2px solid var(--color-border)',
              background: isAuthed ? 'var(--color-border)' : 'transparent',
              color: 'var(--color-text)',
              borderRadius: '999px',
              cursor: isAuthed ? 'default' : 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {isAuthed ? 'Account Linked' : showAuthForm ? 'Send Magic Link' : 'Create Account'}
          </button>
        </section>

        <button
          onClick={onHome}
          style={{
            width: '100%',
            padding: '16px',
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            border: '2px solid var(--color-border)',
            background: 'transparent',
            borderRadius: '999px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Home
        </button>
      </div>
    </div>
  );
}
