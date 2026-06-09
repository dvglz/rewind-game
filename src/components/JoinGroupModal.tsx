import { useState, useRef, useEffect } from 'react';
import styles from './Modal.module.css';

interface JoinGroupModalProps {
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
  initialCode?: string;
}

export function JoinGroupModal({ onClose, onJoin, initialCode = '' }: JoinGroupModalProps) {
  const [code, setCode] = useState(initialCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = code.length === 8;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setError('');
    setLoading(true);
    try {
      await onJoin(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check the code, something's wrong");
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Join a group</h2>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          placeholder="ABCD1234"
          maxLength={8}
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSubmit}
            disabled={!isValid || loading}
            type="button"
          >
            {loading ? '...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
