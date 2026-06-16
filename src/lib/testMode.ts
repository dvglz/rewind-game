export function hidesCompletedGameLock(search: string, isProduction = import.meta.env.PROD): boolean {
  if (isProduction) return false;

  return new URLSearchParams(search).get('test') === '1';
}

export function shouldEnableHapticsDebug(_search: string, _hasVibrateSupport: boolean): boolean {
  // No longer needed — sound fallback in haptics.ts handles all browsers
  // without navigator.vibrate (Safari). Keeping the function to avoid
  // breaking the call site.
  return false;
}
