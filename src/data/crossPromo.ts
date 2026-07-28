// 18 Names cross-promo. LOCAL-ONLY for now: origin/dev deploys BOTH the test site
// and rewindgame.com (live), so there is no safe test-only deploy branch — do not
// push until the ship path is explicitly decided. At launch, swap the host for the
// real 18 Names domain (keep the UTM params).
export const EIGHTEEN_NAMES_URL =
  'https://clutchpoints-18names-test.4taps.me/?utm_source=rewind&utm_medium=crosspromo';

export const EIGHTEEN_PROMO = {
  kicker: 'New game',
  title: '18 Names — Bron in Philly',
  cta: 'Play 18 Names',
  homeBanner: '🔤 New: Play 18 Names — Bron in Philly',
  menuLabel: '18 Names',
} as const;
