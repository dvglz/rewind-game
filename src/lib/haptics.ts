/**
 * Haptic feedback using web-haptics library.
 * Provides stronger, more reliable haptics across iOS + Android.
 */
import { useWebHaptics } from 'web-haptics/react';
import { getStoredHapticsEnabled } from '../hooks/useHapticsEnabled';
import { soundLight, soundMedium, soundHeavy, soundConfirm, soundError } from './sounds';

type TriggerInput =
  | string
  | number
  | number[]
  | Array<{ duration: number; delay?: number; intensity?: number }>;

interface QueuedHaptic {
  input: TriggerInput;
  fallback: number | number[];
  durationMs: number;
}

// Singleton trigger for non-hook usage
let _trigger: ((input?: TriggerInput, options?: { intensity?: number }) => Promise<void> | undefined) | null = null;
let queue: QueuedHaptic[] = [];
let queueTimer: ReturnType<typeof setTimeout> | null = null;

export function initHaptics(trigger: (input?: TriggerInput, options?: { intensity?: number }) => Promise<void> | undefined) {
  _trigger = trigger;
}

function canPlayHaptics(): boolean {
  return getStoredHapticsEnabled();
}

function needsSoundFallback(): boolean {
  return !('ontouchstart' in window) && navigator.maxTouchPoints === 0;
}

function playImmediate(input: TriggerInput, fallback: number | number[]): void {
  if (!canPlayHaptics()) {
    return;
  }

  if (_trigger) {
    void _trigger(input);
  } else {
    navigator?.vibrate?.(fallback);
  }
}

function drainQueue(): void {
  if (queueTimer || queue.length === 0) return;

  const next = queue.shift();
  if (!next) return;

  playImmediate(next.input, next.fallback);

  queueTimer = setTimeout(() => {
    queueTimer = null;
    drainQueue();
  }, next.durationMs);
}

function enqueue(input: TriggerInput, fallback: number | number[], durationMs: number): void {
  if (!canPlayHaptics()) {
    return;
  }

  queue.push({ input, fallback, durationMs });
  drainQueue();
}

export function clearHaptics(): void {
  queue = [];
  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
}

export function vibrateLight(): void {
  if (!canPlayHaptics()) return;
  if (needsSoundFallback()) {
    soundLight();
  } else {
    enqueue('selection', 8, 14);
  }
}

export function vibrateMedium(): void {
  if (!canPlayHaptics()) return;
  if (needsSoundFallback()) {
    soundMedium();
  } else {
    enqueue('light', 14, 20);
  }
}

export function vibrateHeavy(): void {
  if (!canPlayHaptics()) return;
  if (needsSoundFallback()) {
    soundHeavy();
  } else {
    clearHaptics();
    playImmediate('heavy', 35);
  }
}

export function vibrateConfirm(): void {
  if (!canPlayHaptics()) return;
  if (needsSoundFallback()) {
    soundConfirm();
  } else {
    clearHaptics();
    playImmediate('success', [30, 40, 45]);
  }
}

export function vibrateError(): void {
  if (!canPlayHaptics()) return;
  if (needsSoundFallback()) {
    soundError();
  } else {
    clearHaptics();
    playImmediate('error', [35, 30, 35, 30, 35]);
  }
}

export { useWebHaptics };
