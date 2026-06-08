export function hidesCompletedGameLock(search: string): boolean {
  return new URLSearchParams(search).get('test') === '1';
}

export function shouldEnableHapticsDebug(search: string, hasVibrateSupport: boolean): boolean {
  return hidesCompletedGameLock(search) && !hasVibrateSupport;
}
