import { useState } from 'react';

export const HAPTICS_ENABLED_STORAGE_KEY = 'rewind_haptics_enabled';
let hapticsEnabledState: boolean | null = null;

function parseStoredValue(value: string | null): boolean {
  if (value === 'false') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  return true;
}

export function getStoredHapticsEnabled(): boolean {
  if (hapticsEnabledState !== null) {
    return hapticsEnabledState;
  }

  try {
    const enabled = parseStoredValue(localStorage.getItem(HAPTICS_ENABLED_STORAGE_KEY));
    hapticsEnabledState = enabled;
    return enabled;
  } catch {
    hapticsEnabledState = true;
    return true;
  }
}

export function setStoredHapticsEnabled(enabled: boolean): void {
  hapticsEnabledState = enabled;

  try {
    localStorage.setItem(HAPTICS_ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage failures so haptics stay non-blocking.
  }
}

export function useHapticsEnabled() {
  const [enabled, setEnabledState] = useState<boolean>(() => getStoredHapticsEnabled());

  const setEnabled = (next: boolean) => {
    setEnabledState(next);
    setStoredHapticsEnabled(next);
  };

  return { enabled, setEnabled };
}
