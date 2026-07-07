import { expect, test, vi } from 'vitest';
import { generateShareText, shareResults } from './share';

vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://clutchpoints-rewind-test.4taps.me');

test('formats the share text as an NBA challenge with the emoji row', () => {
  const text = generateShareText(
    6,
    [
      { event: { text: 'Q1', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 100 },
      { event: { text: 'Q2', year: 2010 }, guessedYear: 2011, actualYear: 2010, diff: 1, score: 82 },
      { event: { text: 'Q3', year: 2010 }, guessedYear: 2012, actualYear: 2010, diff: 2, score: 72 },
      { event: { text: 'Q4', year: 2010 }, guessedYear: 2016, actualYear: 2010, diff: 6, score: 42 },
      { event: { text: 'Q5', year: 2010 }, guessedYear: 2014, actualYear: 2010, diff: 4, score: 64 },
    ],
    790,
    1000,
    0,
    'american',
    '2026-06-06',
  );

  expect(text).toBe(
    [
      '⏪ Rewind #006 – Guess 5 NBA moments by year',
      '🟢🟢🟢🟠🟡',
      '',
      'Top this. https://clutchpoints-rewind-test.4taps.me',
    ].join('\n'),
  );
});

test('adds the soccer marker only for soccer shares', () => {
  const text = generateShareText(
    6,
    [{ event: { text: 'Q1', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 100 }],
    100,
    1000,
    0,
    'soccer',
    '2026-06-06',
  );

  expect(text.startsWith('⏪ Rewind ⚽ #006 – Guess 5 NBA moments by year')).toBe(true);
});

test('normalizes a bare public app url to https for share and invite links', async () => {
  vi.resetModules();
  vi.stubEnv('VITE_PUBLIC_APP_URL', 'rewindgame.com');

  const { generateShareText: generateText, getPublicAppUrl } = await import('./share');
  const text = generateText(
    1,
    [{ event: { text: 'Q1', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 100 }],
    100,
    1000,
    0,
    'american',
    '2026-06-16',
  );

  expect(getPublicAppUrl()).toBe('https://rewindgame.com');
  expect(text).toContain('https://rewindgame.com');
});

test('native share sends only text to avoid duplicating the Rewind title', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: true,
  });
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: share,
  });

  const text = 'Rewind #001 / Jun 6, 2026';

  await shareResults(text);

  expect(share).toHaveBeenCalledWith({ text });
});

test('uses the Archive title when the archive flag is set', () => {
  const text = generateShareText(2, [], 800, 1000, 0, 'american', '2026-06-19', true);
  expect(text.startsWith('⏪ Rewind Archive #002')).toBe(true);
  expect(text).not.toContain('Rewind #');
});
