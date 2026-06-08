export function hidesCompletedGameLock(search: string): boolean {
  return new URLSearchParams(search).get('test') === '1';
}
