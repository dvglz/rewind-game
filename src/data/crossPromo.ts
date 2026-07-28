// 18 Names cross-promo. Dev/test only for now: this ships via origin-4taps/dev
// (test site) and must not reach the prod deploy branches until launch.
// Swap the host for the real 18 Names domain at launch.
export const EIGHTEEN_NAMES_URL =
  'https://clutchpoints-18names-test.4taps.me/?utm_source=rewind&utm_medium=crosspromo';

export const EIGHTEEN_PROMO = {
  kicker: 'New game',
  title: '18 Names — Bron in Philly',
  cta: 'Play 18 Names',
  homeBanner: '🔤 New: Play 18 Names — Bron in Philly',
  menuLabel: '18 Names',
} as const;
