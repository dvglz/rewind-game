import { expect, test, vi } from 'vitest';
import { generateShareText, shareResults } from './share';

vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://clutchpoints-rewind-test.4taps.me');

test('formats the share text as an NBA challenge with the emoji row', () => {
  const text = generateShareText(
    20,
    [
      { event: { text: 'Q1', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 100 },
      { event: { text: 'Q2', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 100 },
      { event: { text: 'Q3', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 200 },
      { event: { text: 'Q4', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 300 },
      { event: { text: 'Q5', year: 2010 }, guessedYear: 2010, actualYear: 2010, diff: 0, score: 300 },
    ],
    1000,
    1000,
    0,
    'american',
    '2026-06-06',
    false,
    30000,
  );

  expect(text).toBe(
    [
      '⏪ Rewind #020',
      'Guess 5 NBA moments by year',
      '🟢🟢🟢🟢🟢 in 00:30',
      'Can you beat it? https://clutchpoints-rewind-test.4taps.me',
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
    false,
    47000,
  );

  expect(text.startsWith('⏪ Rewind ⚽ #006\nGuess 5 NBA moments by year\n🟢 in 00:47')).toBe(true);
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
    false,
    0,
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
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true }), // coarse pointer => touch device
  });

  const text = 'Rewind #001 / Jun 6, 2026';

  await shareResults(text);

  expect(share).toHaveBeenCalledWith({ text });
});

test('copies to clipboard on desktop instead of invoking native share', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: true,
  });
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: share,
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }), // fine pointer => desktop
  });

  const text = 'Rewind #001 / Jun 6, 2026';

  const outcome = await shareResults(text);

  expect(share).not.toHaveBeenCalled();
  expect(writeText).toHaveBeenCalledWith(text);
  expect(outcome).toBe('copied');
});

test('uses the Archive title when the archive flag is set', () => {
  const text = generateShareText(2, [], 800, 1000, 0, 'american', '2026-06-19', true, 0);
  expect(text.startsWith('⏪ Rewind Archive #002')).toBe(true);
  expect(text).not.toContain('Rewind #');
});

test('special share text uses flag, label, shareLine, and /slug URL', () => {
  const results = Array.from({ length: 10 }, (_, i) => ({
    event: { text: `Q${i + 1}`, year: 2010 },
    guessedYear: 2010,
    actualYear: 2010,
    diff: 0,
    score: 100,
  }));

  const text = generateShareText(
    28,
    results,
    1000,
    1000,
    3,
    'american',
    undefined,
    false,
    83_000,
    {
      slug: 'messi',
      flag: '🇦🇷',
      label: 'Messi Special',
      shareLine: 'I walked Messi’s journey — 10 moments by year',
    },
  );

  expect(text).toContain('⏪ Rewind #028 🇦🇷 Messi Special');
  expect(text).toContain('I walked Messi’s journey — 10 moments by year');
  expect(text).toContain('🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢');
  expect(text).toMatch(/Can you beat it\? https:\/\/.+\/messi$/);
});

test('non-special share text is unchanged', () => {
  const results = Array.from({ length: 5 }, (_, i) => ({
    event: { text: `Q${i + 1}`, year: 2010 },
    guessedYear: 2010,
    actualYear: 2010,
    diff: 0,
    score: 100,
  }));

  const text = generateShareText(28, results, 1000, 1000, 3, 'american', undefined, false, 83_000);

  expect(text).toContain('⏪ Rewind #028\n');
  expect(text).toContain('Guess 5 NBA moments by year');
  expect(text).not.toContain('messi');
});
