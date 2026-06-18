import { beforeEach, expect, test } from 'vitest';
import { getPuzzleForDate, getTodaysPuzzle, isRewindLabMode } from './puzzles';

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
