import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import styles from './OtpInput.module.css';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Fired when all slots are filled. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Segmented numeric code input (one box per digit) with auto-advance,
 * backspace-to-previous, and full paste support.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusAt = (i: number) => {
    const clamped = Math.max(0, Math.min(length - 1, i));
    inputs.current[clamped]?.focus();
    inputs.current[clamped]?.select();
  };

  const commit = (next: string) => {
    const trimmed = next.slice(0, length);
    onChange(trimmed);
    if (trimmed.length === length) onComplete?.(trimmed);
  };

  const handleChange = (index: number, raw: string) => {
    const onlyDigits = raw.replace(/\D/g, '');
    if (!onlyDigits) return;

    const chars = value.split('');
    // Fill from the current slot forward (handles fast typing / multi-char).
    let cursor = index;
    for (const ch of onlyDigits) {
      if (cursor >= length) break;
      chars[cursor] = ch;
      cursor += 1;
    }
    commit(chars.join('').slice(0, length));
    focusAt(cursor);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = value.split('');
      if (chars[index]) {
        chars[index] = '';
        onChange(chars.join(''));
      } else if (index > 0) {
        chars[index - 1] = '';
        onChange(chars.join(''));
        focusAt(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    commit(pasted.slice(0, length));
    focusAt(pasted.length);
  };

  return (
    <div className={styles.group} role="group" aria-label="Verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          className={styles.cell}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
