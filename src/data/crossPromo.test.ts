import { expect, test } from 'vitest';
import { EIGHTEEN_NAMES_URL, EIGHTEEN_PROMO } from './crossPromo';

test('promo URL points at the 18 Names test deployment pinned to the LeJawn lab day', () => {
  const url = new URL(EIGHTEEN_NAMES_URL);
  expect(url.hostname).toBe('clutchpoints-18names-test.4taps.me');
  expect(url.searchParams.get('lab')).toBe('2099-12-31');
  expect(url.searchParams.get('practice')).toBe('1');
});

test('promo copy carries the Bron-in-Philly hook', () => {
  expect(EIGHTEEN_PROMO.title).toBe('18 Names — Bron in Philly');
  expect(EIGHTEEN_PROMO.cta).toBe('Play 18 Names');
});
