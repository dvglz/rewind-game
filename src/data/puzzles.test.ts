import { beforeEach, expect, test } from 'vitest';
import { getPuzzleForDate, getTodaysPuzzle, isRewindLabMode, isPracticeMode } from './puzzles';

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
