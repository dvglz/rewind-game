import { expect, test } from 'vitest';
import { EIGHTEEN_NAMES_URL, EIGHTEEN_PROMO } from './crossPromo';

test('promo URL points at the 18 Names test deployment with campaign params', () => {
  const url = new URL(EIGHTEEN_NAMES_URL);
  expect(url.hostname).toBe('clutchpoints-18names-test.4taps.me');
  expect(url.searchParams.get('utm_source')).toBe('rewind');
  expect(url.searchParams.get('utm_medium')).toBe('crosspromo');
});

test('promo copy carries the Bron-in-Philly hook', () => {
  expect(EIGHTEEN_PROMO.title).toBe('18 Names — Bron in Philly');
  expect(EIGHTEEN_PROMO.cta).toBe('Play 18 Names');
});
