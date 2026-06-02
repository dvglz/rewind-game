/**
 * Web Vibration API wrapper for timeline scroll feedback.
 * Falls back silently on unsupported devices.
 */
export function vibrateLight(): void {
  navigator?.vibrate?.(5);
}

export function vibrateMedium(): void {
  navigator?.vibrate?.(15);
}

export function vibrateHeavy(): void {
  navigator?.vibrate?.(30);
}

export function vibrateConfirm(): void {
  navigator?.vibrate?.([15, 50, 15]);
}
