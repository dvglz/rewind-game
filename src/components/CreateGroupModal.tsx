import { useState } from 'react';
import styles from './Modal.module.css';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateGroupModal({ onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || loading) return;
    setError('');
    setLoading(true);
    try {
      await onCreate(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Create a group</h2>
        <input
          className={styles.input}
          type="text"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          maxLength={60}
        />
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            type="button"
          >
            {loading ? '...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
