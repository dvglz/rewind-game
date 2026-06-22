import { expect, test } from 'vitest';
import { getTodayString } from './date';

test('returns the Pacific calendar date, not the UTC date', () => {
  // 2026-06-19 05:00 UTC = 2026-06-18 22:00 Pacific (PDT, UTC-7).
  // UTC would say the 19th; Pacific (and the backend) say the 18th.
  expect(getTodayString(new Date('2026-06-19T05:00:00Z'))).toBe('2026-06-18');
});

test('rolls over at Pacific midnight', () => {
  // 2026-06-19 06:59 UTC = 2026-06-18 23:59 Pacific → still the 18th.
  expect(getTodayString(new Date('2026-06-19T06:59:00Z'))).toBe('2026-06-18');
  // 2026-06-19 07:00 UTC = 2026-06-19 00:00 Pacific → now the 19th.
  expect(getTodayString(new Date('2026-06-19T07:00:00Z'))).toBe('2026-06-19');
});

test('handles standard time (winter, UTC-8)', () => {
  // 2026-01-15 07:30 UTC = 2026-01-14 23:30 PST (UTC-8) → still the 14th.
  expect(getTodayString(new Date('2026-01-15T07:30:00Z'))).toBe('2026-01-14');
  // 2026-01-15 08:00 UTC = 2026-01-15 00:00 PST → the 15th.
  expect(getTodayString(new Date('2026-01-15T08:00:00Z'))).toBe('2026-01-15');
});
