import type { ThemePreference } from '../lib/theme';
import styles from './ThemeSwitch.module.css';

interface ThemeSwitchProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  return (
    <div className={styles.root} role="group" aria-label="Theme">
      {OPTIONS.map((option) => {
        const isSelected = option === value;

        return (
          <button
            key={option}
            type="button"
            className={isSelected ? styles.optionActive : styles.option}
            aria-pressed={isSelected}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
