import { beforeEach, describe, expect, test } from 'vitest';
import { getPuzzleForDate, getTodaysPuzzle, isRewindLabMode, isPracticeMode } from './puzzles';
import { MESSI_SPECIAL, SPECIAL_DAYS } from './specials';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  sessionStorage.clear();
});

test('starts the launch puzzle sequence at #001 on June 18, 2026', () => {
  expect(getPuzzleForDate('2026-06-18').number).toBe(1);
});

test('rewindLab selects a puzzle by one-based puzzle number', () => {
  window.history.replaceState({}, '', '/?rewindLab=003');

  const puzzle = getTodaysPuzzle();

  expect(isRewindLabMode()).toBe(true);
  expect(puzzle.id).toBe('lab-2026-06-20-american');
  expect(puzzle.number).toBe(3);
  expect(puzzle.events).toHaveLength(5);
  expect(typeof puzzle.events[0].year).toBe('number');
  expect(puzzle.events[0].text.length).toBeGreaterThan(0);
});

test('rewindLab selects expanded puzzle numbers beyond day 10', () => {
  window.history.replaceState({}, '', '/?rewindLab=011');

  const puzzle = getTodaysPuzzle();

  expect(isRewindLabMode()).toBe(true);
  expect(puzzle.id).toBe('lab-2026-06-28-american');
  expect(puzzle.number).toBe(11);
  expect(puzzle.events.map((event) => event.text)).toEqual([
    'LeBron signs with the Lakers in free agency',
    'Harden is named MVP after his 30-point Rockets season',
    "Zion's shoe explodes during Duke-UNC",
    'Milwaukee drafts Giannis with the 15th pick out of Greece',
    "Paul Pierce's wheelchair game becomes NBA Finals folklore",
  ]);
});

test('rewindLab selects newly added puzzle numbers beyond day 20', () => {
  window.history.replaceState({}, '', '/?rewindLab=021');

  const puzzle = getTodaysPuzzle();

  expect(isRewindLabMode()).toBe(true);
  expect(puzzle.id).toBe('lab-2026-07-08-american');
  expect(puzzle.number).toBe(21);
  expect(puzzle.events.map((event) => event.text)).toEqual([
    'LeBron lands on the SI cover as a high school junior',
    'Ron Artest officially becomes Metta World Peace',
    'Muggsy Bogues enters the NBA at 5-foot-3',
    'The NBA brings in the three-point line',
    'Blake Griffin wins Rookie of the Year after missing first season due to injury',
  ]);
});

test('rewindLab ignores random mode and selects the exact numbered puzzle', () => {
  window.history.replaceState({}, '', '/?rewindLab=011');
  localStorage.setItem('rewind_random_mode', 'true');

  const puzzle = getTodaysPuzzle();

  expect(puzzle.number).toBe(11);
  expect(puzzle.events.map((event) => event.text)).toEqual([
    'LeBron signs with the Lakers in free agency',
    'Harden is named MVP after his 30-point Rockets season',
    "Zion's shoe explodes during Duke-UNC",
    'Milwaukee drafts Giannis with the 15th pick out of Greece',
    "Paul Pierce's wheelchair game becomes NBA Finals folklore",
  ]);
});

test('rewindLab selects a puzzle by date', () => {
  window.history.replaceState({}, '', '/?sport=soccer&rewindLab=2026-06-22');

  const puzzle = getTodaysPuzzle();

  expect(puzzle.id).toBe('lab-2026-06-22-soccer');
  expect(puzzle.number).toBe(5);
  expect(puzzle.sport).toBe('soccer');
});

test('rewindLab accepts a stable puzzle id', () => {
  window.history.replaceState({}, '', '/?rewindLab=2026-06-19-american');

  const puzzle = getTodaysPuzzle();

  expect(puzzle.id).toBe('lab-2026-06-19-american');
  expect(puzzle.number).toBe(2);
});

test('event years match the question date regardless of player timezone', () => {
  const originalTZ = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    // Day 23: every event uses a bare-year date ('2003', '1984', ...).
    const puzzle = getPuzzleForDate('2026-07-10');
    expect(puzzle.events.map((event) => event.year)).toEqual([2003, 1984, 1985, 1983, 2019]);
  } finally {
    process.env.TZ = originalTZ;
  }
});

test('isPracticeMode reflects the ?practice=1 param', () => {
  window.history.replaceState({}, '', '/');
  expect(isPracticeMode()).toBe(false);
  window.history.replaceState({}, '', '/?practice=1');
  expect(isPracticeMode()).toBe(true);
});

test('practice mode gives the dated puzzle an isolated practice- id', () => {
  window.history.replaceState({}, '', '/?date=2026-06-19&practice=1');
  const puzzle = getTodaysPuzzle();
  expect(puzzle.id).toBe('practice-2026-06-19-american');
  expect(puzzle.number).toBe(2); // 2026-06-19 = Day 2 (launch is 06-18)
  expect(puzzle.events).toHaveLength(5);
});

describe('special day resolution', () => {
  test('2026-07-15 american resolves to the Messi special', () => {
    const puzzle = getPuzzleForDate('2026-07-15', 'american');
    expect(puzzle.special?.slug).toBe('messi');
    expect(puzzle.id).toBe('2026-07-15-american-special-messi');
    expect(puzzle.number).toBe(28);
    expect(puzzle.events).toHaveLength(10);
    expect(puzzle.weights).toEqual(MESSI_SPECIAL.weights);
    expect(puzzle.events[0].year).toBe(2000);
    expect(puzzle.events[0].detail).toMatch(/^In 2000, /);
  });

  test('special overrides random mode on its date', () => {
    localStorage.setItem('rewind_random_mode', 'true');
    sessionStorage.setItem('rewind_random_seed', 'abc-123');
    try {
      expect(getPuzzleForDate('2026-07-15', 'american').special?.slug).toBe('messi');
    } finally {
      localStorage.removeItem('rewind_random_mode');
      sessionStorage.removeItem('rewind_random_seed');
    }
  });

  test('soccer sport and neighboring dates are untouched', () => {
    expect(getPuzzleForDate('2026-07-15', 'soccer').special).toBeUndefined();
    expect(getPuzzleForDate('2026-07-14', 'american').special).toBeUndefined();
    expect(getPuzzleForDate('2026-07-14', 'american').events).toHaveLength(5);
  });

  test('kill switch restores the regular day', () => {
    const disabled = { ...MESSI_SPECIAL, enabled: false };
    const days = SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, disabled);
    try {
      const puzzle = getPuzzleForDate('2026-07-15', 'american');
      expect(puzzle.special).toBeUndefined();
      expect(puzzle.id).toBe('2026-07-15-american');
      expect(puzzle.events).toHaveLength(5);
    } finally {
      SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, ...days);
    }
  });
});
