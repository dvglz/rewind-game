/**
 * Haptic feedback using web-haptics library.
 * Provides stronger, more reliable haptics across iOS + Android.
 */
import { useWebHaptics } from 'web-haptics/react';
import { getStoredHapticsEnabled } from '../hooks/useHapticsEnabled';

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
  enqueue('selection', 8, 14);
}

export function vibrateMedium(): void {
  enqueue('light', 14, 20);
}

export function vibrateHeavy(): void {
  clearHaptics();
  playImmediate('heavy', 35);
}

export function vibrateConfirm(): void {
  clearHaptics();
  playImmediate('success', [30, 40, 45]);
}

export function vibrateError(): void {
  clearHaptics();
  playImmediate('error', [35, 30, 35, 30, 35]);
}

export { useWebHaptics };
