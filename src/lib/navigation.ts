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
  } else {
    params.set('mode', screen);
  }

  // Preserve returnTo only for the auth screen.
  if (screen !== 'auth') {
    params.delete('returnTo');
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
