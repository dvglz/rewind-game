import { beforeEach, expect, test } from 'vitest';
import { getPuzzleForDate, getTodaysPuzzle, isRewindLabMode } from './puzzles';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  sessionStorage.clear();
});

test('starts the launch puzzle sequence at #001 on June 16, 2026', () => {
  expect(getPuzzleForDate('2026-06-16').number).toBe(1);
});

test('rewindLab selects a puzzle by one-based puzzle number', () => {
  window.history.replaceState({}, '', '/?rewindLab=003');

  const puzzle = getTodaysPuzzle();

  expect(isRewindLabMode()).toBe(true);
  expect(puzzle.id).toBe('lab-2026-06-18-american');
  expect(puzzle.number).toBe(3);
  expect(puzzle.events[0].text).toContain('Kawhi');
});

test('rewindLab selects a puzzle by date', () => {
  window.history.replaceState({}, '', '/?sport=soccer&rewindLab=2026-06-20');

  const puzzle = getTodaysPuzzle();

  expect(puzzle.id).toBe('lab-2026-06-20-soccer');
  expect(puzzle.number).toBe(5);
  expect(puzzle.sport).toBe('soccer');
});

test('rewindLab accepts a stable puzzle id', () => {
  window.history.replaceState({}, '', '/?rewindLab=2026-06-17-american');

  const puzzle = getTodaysPuzzle();

  expect(puzzle.id).toBe('lab-2026-06-17-american');
  expect(puzzle.number).toBe(2);
});
