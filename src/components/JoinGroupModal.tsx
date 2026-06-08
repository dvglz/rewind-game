import { useState, useRef, useEffect } from 'react';
import styles from './Modal.module.css';

const CODE_LENGTH = 6;

interface JoinGroupModalProps {
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export function JoinGroupModal({ onClose, onJoin }: JoinGroupModalProps) {
  const [chars, setChars] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const code = chars.join('');
  const isFull = code.length === CODE_LENGTH && chars.every((c) => c !== '');

  const handleSubmit = async () => {
    if (!isFull || loading) return;
    setError('');
    setLoading(true);
    try {
      await onJoin(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check the code, something's wrong");
      setLoading(false);
    }
  };

  const updateChar = (index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const next = [...chars];
    if (upper.length === 0) {
      next[index] = '';
      setChars(next);
      return;
    }
    // Handle paste: spread characters across fields
    if (upper.length > 1) {
      const pasted = upper.slice(0, CODE_LENGTH);
      for (let i = 0; i < CODE_LENGTH; i++) {
        next[i] = pasted[i] ?? '';
      }
      setChars(next);
      const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    next[index] = upper[0];
    setChars(next);
    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[index] === '' && index > 0) {
        const next = [...chars];
        next[index - 1] = '';
        setChars(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...chars];
        next[index] = '';
        setChars(next);
      }
      e.preventDefault();
    } else if (e.key === 'Enter' && isFull) {
      void handleSubmit();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!pasted) return;
    const next = [...chars];
    for (let i = 0; i < CODE_LENGTH; i++) {
      next[i] = pasted[i] ?? '';
    }
    setChars(next);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Join a group</h2>
        <div className={styles.codeFields} onPaste={handlePaste}>
          {chars.map((char, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className={`${styles.codeChar} ${char ? styles.codeCharFilled : ''}`}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              maxLength={1}
              value={char}
              onChange={(e) => updateChar(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Code character ${i + 1}`}
            />
          ))}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSubmit}
            disabled={!isFull || loading}
            type="button"
          >
            {loading ? '...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
