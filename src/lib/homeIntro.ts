const HOME_INTRO_SEEN_KEY = 'rewind_home_intro_seen';

export function hasSeenHomeIntro(): boolean {
  try {
    return localStorage.getItem(HOME_INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHomeIntroSeen(): void {
  try {
    localStorage.setItem(HOME_INTRO_SEEN_KEY, '1');
  } catch {
    // Storage may be unavailable in private or locked-down WebView contexts.
  }
}

export function clearHomeIntroSeen(): void {
  try {
    localStorage.removeItem(HOME_INTRO_SEEN_KEY);
  } catch {
    // Storage may be unavailable in private or locked-down WebView contexts.
  }
}
