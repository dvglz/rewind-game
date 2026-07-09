/**
 * Compute the URL query string for a screen transition.
 *
 * Practice context (`practice`, `date`, `archiveDate`) only belongs on the
 * `game` and `results` screens. Navigating anywhere else strips it so that
 * today's live game always returns to the main screen — a lingering
 * `?date=…&practice=1` must never leak into the home/intro view. A bare `date`
 * override without `practice` (e.g. rewind-lab mode) is left untouched.
 */
export function computeNavSearch(currentSearch: string, screen: string): string {
  const params = new URLSearchParams(currentSearch);

  if (screen === 'home') {
    params.delete('mode');
    params.delete('returnTo');
    params.delete('authReason');
  } else {
    params.set('mode', screen);
  }

  // Preserve returnTo only for the auth screen.
  if (screen !== 'auth') {
    params.delete('returnTo');
    params.delete('authReason');
  }

  // Practice context is scoped to the game/results screens.
  if (screen !== 'game' && screen !== 'results') {
    if (params.get('practice') === '1') {
      params.delete('date');
    }
    params.delete('practice');
    params.delete('archiveDate');
  }

  return params.toString();
}

export type Screen =
  | 'home' | 'game' | 'ordering' | 'results'
  | 'groups' | 'auth' | 'leaderboard' | 'howto' | 'archive';

const SCREEN_PATHS: Record<Screen, string> = {
  home: '/',
  game: '/game',
  ordering: '/ordering',
  results: '/results',
  groups: '/groups',
  auth: '/auth',
  leaderboard: '/leaderboard',
  howto: '/howto',
  archive: '/archive',
};

export function pathForScreen(screen: Screen): string {
  return SCREEN_PATHS[screen];
}

/** Reverse of pathForScreen; unknown paths fall back to home. Trailing-slash tolerant. */
export function screenFromPathname(pathname: string): Screen {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const found = (Object.keys(SCREEN_PATHS) as Screen[]).find((s) => SCREEN_PATHS[s] === clean);
  return found ?? 'home';
}

function withPrefix(search: string): string {
  return search ? `?${search}` : '';
}

/**
 * Build the target { pathname, search } for a screen transition, carrying the
 * context query per the same rules the old computeNavSearch enforced:
 *  - returnTo/authReason only survive on the auth screen
 *  - practice/date/archiveDate only survive on game + results
 *  - a bare `date` override (lab mode, no practice) is left untouched
 *  - from=app and sport are always preserved
 */
export function buildTo(screen: Screen, currentSearch: string): { pathname: string; search: string } {
  const params = new URLSearchParams(currentSearch);

  if (screen !== 'auth') {
    params.delete('returnTo');
    params.delete('authReason');
  }

  if (screen !== 'game' && screen !== 'results') {
    if (params.get('practice') === '1') params.delete('date');
    params.delete('practice');
    params.delete('archiveDate');
  }

  return { pathname: SCREEN_PATHS[screen], search: withPrefix(params.toString()) };
}

/**
 * Legacy compatibility: old links use /?mode=<screen>. On first load, translate
 * them to the new path while keeping the remaining query params. Returns null
 * when there is no `mode` param to translate.
 */
export function legacyRedirect(currentSearch: string): { pathname: string; search: string } | null {
  const params = new URLSearchParams(currentSearch);
  const mode = params.get('mode');
  if (!mode) return null;
  params.delete('mode');
  const screen: Screen = (Object.keys(SCREEN_PATHS) as Screen[]).includes(mode as Screen)
    ? (mode as Screen)
    : 'home';
  return { pathname: SCREEN_PATHS[screen], search: withPrefix(params.toString()) };
}
