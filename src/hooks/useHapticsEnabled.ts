import { useState } from 'react';

export const HAPTICS_ENABLED_STORAGE_KEY = 'rewind_haptics_enabled';
let hapticsEnabledFallback: boolean | null = null;
let useFallbackValue = false;

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
  if (useFallbackValue && hapticsEnabledFallback !== null) {
    return hapticsEnabledFallback;
  }

  try {
    return parseStoredValue(localStorage.getItem(HAPTICS_ENABLED_STORAGE_KEY));
  } catch {
    if (hapticsEnabledFallback !== null) {
      return hapticsEnabledFallback;
    }

    return true;
  }
}

export function setStoredHapticsEnabled(enabled: boolean): void {
  hapticsEnabledFallback = enabled;

  try {
    localStorage.setItem(HAPTICS_ENABLED_STORAGE_KEY, String(enabled));
    useFallbackValue = false;
  } catch {
    useFallbackValue = true;
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
