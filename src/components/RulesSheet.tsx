import { useEffect } from 'react';
import { RULES_LINES, RULES_HOOK } from '../lib/rulesCopy';
import { track } from '../lib/analytics';
import styles from './RulesSheet.module.css';

interface RulesSheetProps {
  onClose: () => void;
}

export function RulesSheet({ onClose }: RulesSheetProps) {
  useEffect(() => {
    track('rules_view', { entry_point: 'in_game' });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      data-testid="rules-sheet-backdrop"
      onClick={onClose}
    >
      <div
        className={styles.sheet}
        role="dialog"
        aria-label="How to play"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className={styles.title}>How to play</h2>
        {RULES_LINES.map((line) => (
          <p key={line} className={styles.line}>{line}</p>
        ))}
        <p className={styles.hook}>{RULES_HOOK}</p>
      </div>
    </div>
  );
}
