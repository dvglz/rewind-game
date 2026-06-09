export function hidesCompletedGameLock(search: string): boolean {
  return new URLSearchParams(search).get('test') === '1';
}

export function shouldEnableHapticsDebug(_search: string, _hasVibrateSupport: boolean): boolean {
  // No longer needed — sound fallback in haptics.ts handles all browsers
  // without navigator.vibrate (Safari). Keeping the function to avoid
  // breaking the call site.
  return false;
}
