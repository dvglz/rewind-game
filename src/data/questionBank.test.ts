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

test('eligible pool has enough questions per difficulty for 30 days', () => {
  const eligible = getEligibleQuestions();
  const count = (d: string) => eligible.filter((q) => q.difficulty === d).length;
  expect(count('easy')).toBeGreaterThanOrEqual(60);
  expect(count('medium')).toBeGreaterThanOrEqual(30);
  expect(count('hard')).toBeGreaterThanOrEqual(60);
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

test('newly curated days use final editorial copy', () => {
  expect(questionById.get('evt_lebron_si_cover')?.title).toBe(
    'LeBron lands on the SI cover as a high school junior',
  );
  expect(questionById.get('evt_blake_roty_after_injury')?.title).toBe(
    'Blake Griffin wins Rookie of the Year after missing first season due to injury',
  );
  expect(questionById.get('evt_melo_syracuse_title')?.title).toBe(
    'Carmelo carries Syracuse to a national title before getting drafted to the NBA',
  );
  expect(questionById.get('evt_melo_syracuse_title')?.reveal).toBe(
    'In 2003, Melo won it all for the Orange as a freshman before becoming a top NBA prospect.',
  );
  expect(questionById.get('evt_hakeem_before_jordan_draft')?.title).toBe(
    'Hakeem goes first before Jordan goes third in the draft',
  );
  expect(questionById.get('evt_draymond_second_round_pick')?.title).toBe(
    'Golden State takes Draymond in the second round of the draft',
  );
  expect(questionById.get('evt_kg_high_school_draft')?.title).toBe(
    'Kevin Garnett jumps straight from high school to the NBA',
  );
  expect(questionById.get('evt_curry_davidson_elite_eight')?.title).toBe(
    'Curry carries Davidson to the Elite Eight',
  );
  expect(questionById.get('evt_kemba_uconn_title')?.title).toBe(
    'Kemba Walker carries UConn through March Madness',
  );
  expect(questionById.get('evt_rasheed_technical_foul_record')?.title).toBe(
    'Rasheed Wallace sets the single-season record for techs',
  );
  expect(questionById.get('evt_nba_dress_code')?.title).toBe(
    'The NBA brings in its controversial business-casual dress code',
  );
  expect(questionById.get('evt_nba_2k_debut_iverson')?.title).toBe(
    'NBA 2K launches with Iverson on the cover',
  );
  expect(questionById.get('evt_nba_2k_debut_iverson')?.reveal).toBe(
    'In 1999, the first NBA 2K debuted with Allen Iverson as its cover star.',
  );
  expect(questionById.get('evt_first_draft_lottery_ewing')?.title).toBe(
    'The first Draft Lottery sends Patrick Ewing to NY',
  );
  expect(questionById.get('evt_mikal_bridges_ironman_streak')?.title).toBe(
    'Mikal Bridges plays 23 sec to keep his ironman streak alive',
  );
  expect(questionById.get('evt_fred_vanvleet_undrafted')?.title).toBe(
    'VanVleet goes undrafted before earning an NBA spot',
  );
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

test('DAY_DEFINITIONS: 40 days of 5 eligible, unique ids', () => {
  expect(DAY_DEFINITIONS).toHaveLength(40);
  const all = DAY_DEFINITIONS.flat();
  expect(all).toHaveLength(200);
  expect(new Set(all).size).toBe(200);
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
