const APP_MODE_KEY = 'rewind_from_app';

export function isAppMode(search: string = window.location.search): boolean {
  try {
    if (sessionStorage.getItem(APP_MODE_KEY) === '1') return true;
    const fromApp = new URLSearchParams(search).get('from') === 'app';
    if (fromApp) sessionStorage.setItem(APP_MODE_KEY, '1');
    return fromApp;
  } catch {
    // sessionStorage unavailable (e.g. some WebView privacy modes) — URL only.
    return new URLSearchParams(search).get('from') === 'app';
  }
}

export function ensureAppModeParam(): void {
  if (!isAppMode()) return;
  const url = new URL(window.location.href);
  if (url.searchParams.get('from') === 'app') return;
  url.searchParams.set('from', 'app');
  window.history.replaceState(null, '', url.toString());
}
