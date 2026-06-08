import { useState, useRef, useEffect } from 'react';
import styles from './BurgerMenu.module.css';

interface MenuItem {
  label: string;
  onClick: () => void;
}

interface BurgerMenuProps {
  items: MenuItem[];
}

export function BurgerMenu({ items }: BurgerMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
        aria-label="Menu"
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          {items.map((item) => (
            <button
              key={item.label}
              className={styles.item}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
