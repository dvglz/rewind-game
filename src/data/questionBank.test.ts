import { expect, test } from 'vitest';
import {
  REWIND_QUESTION_BANK,
  questionById,
  getEligibleQuestions,
  QUESTION_DIFFICULTIES,
  QUESTION_SPORTS,
  QUESTION_THEMES,
} from './questionBank';
import { DAY_DEFINITIONS } from './dayDefinitions';

const YEAR_IN_TEXT = /\b(19|20)\d{2}\b/;

test('bank is non-empty and indexable by id', () => {
  expect(REWIND_QUESTION_BANK.length).toBeGreaterThan(50);
  const first = REWIND_QUESTION_BANK[0];
  expect(questionById.get(first.id)).toBe(first);
});

test('eligible pool has enough questions per difficulty for 10 days', () => {
  const eligible = getEligibleQuestions();
  const count = (d: string) => eligible.filter((q) => q.difficulty === d).length;
  expect(count('easy')).toBeGreaterThanOrEqual(20);
  expect(count('medium')).toBeGreaterThanOrEqual(10);
  expect(count('hard')).toBeGreaterThanOrEqual(20);
});

test('every id is unique and evt_-prefixed', () => {
  const ids = REWIND_QUESTION_BANK.map((q) => q.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id.startsWith('evt_')).toBe(true);
});

test('no title leaks a 4-digit year', () => {
  const offenders = REWIND_QUESTION_BANK.filter((q) => YEAR_IN_TEXT.test(q.title));
  expect(offenders.map((q) => q.id)).toEqual([]);
});

test('date parses and reveal confirms the same year', () => {
  for (const q of REWIND_QUESTION_BANK) {
    const year = new Date(q.date).getFullYear();
    expect(Number.isFinite(year)).toBe(true);
    expect(year).toBeGreaterThanOrEqual(1946);
    expect(year).toBeLessThanOrEqual(new Date().getFullYear() + 1);
    expect(q.reveal).toContain(String(year));
  }
});

test('enums, themes and priority are valid', () => {
  for (const q of REWIND_QUESTION_BANK) {
    expect(QUESTION_DIFFICULTIES).toContain(q.difficulty);
    expect(QUESTION_SPORTS).toContain(q.sport);
    expect(q.theme.length).toBeGreaterThan(0);
    for (const t of q.theme) expect(QUESTION_THEMES).toContain(t);
    expect([1, 2, 3]).toContain(q.priority);
  }
});

test('DAY_DEFINITIONS: 10 days of 5 eligible, unique ids', () => {
  expect(DAY_DEFINITIONS).toHaveLength(10);
  const all = DAY_DEFINITIONS.flat();
  expect(all).toHaveLength(50);
  expect(new Set(all).size).toBe(50);
  for (const id of all) {
    const q = questionById.get(id);
    expect(q, `unknown id ${id}`).toBeDefined();
    expect(q!.eligibleForMain).toBe(true);
  }
});

test('DAY_DEFINITIONS: every day is E E M H H with fresh team/player', () => {
  for (const day of DAY_DEFINITIONS) {
    expect(day).toHaveLength(5);
    const qs = day.map((id) => questionById.get(id)!);
    expect(qs.map((q) => q.difficulty)).toEqual(['easy', 'easy', 'medium', 'hard', 'hard']);
    const teams = qs.map((q) => q.teams[0]);
    const players = qs.map((q) => q.players[0]);
    expect(new Set(teams).size).toBe(teams.length);
    expect(new Set(players).size).toBe(players.length);
    const decades = new Set(qs.map((q) => Math.floor(new Date(q.date).getFullYear() / 10)));
    expect(decades.size).toBeGreaterThanOrEqual(2);
  }
});
