import { describe, expect, test } from 'vitest';
import { fetchLeaderboard } from './leaderboard';
import { LEADERBOARD_PAGE_LIMIT } from '../config/leaderboard';

describe('fetchLeaderboard (mock)', () => {
  test('returns at most LEADERBOARD_PAGE_LIMIT entries', async () => {
    const board = await fetchLeaderboard(0);
    expect(board.entries.length).toBeLessThanOrEqual(LEADERBOARD_PAGE_LIMIT);
    expect(board.entries.length).toBeGreaterThan(0);
  });

  test('entries are ranked 1..N in descending score order', async () => {
    const board = await fetchLeaderboard(0);
    board.entries.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1);
      if (i > 0) {
        expect(entry.score).toBeLessThanOrEqual(board.entries[i - 1].score);
      }
    });
  });

  test('no score exceeds the 1000 daily cap', async () => {
    const board = await fetchLeaderboard(0);
    board.entries.forEach((e) => expect(e.score).toBeLessThanOrEqual(1000));
  });

  test('is deterministic for the same dayOffset', async () => {
    const a = await fetchLeaderboard(2);
    const b = await fetchLeaderboard(2);
    expect(b).toEqual(a);
  });

  test('differs across days', async () => {
    const today = await fetchLeaderboard(0);
    const yesterday = await fetchLeaderboard(1);
    expect(yesterday.date).not.toBe(today.date);
  });

  test('mocks the current user outside the top page so the pin is exercised', async () => {
    const board = await fetchLeaderboard(0);
    expect(board.currentUser).not.toBeNull();
    expect(board.currentUser!.rank).toBeGreaterThan(LEADERBOARD_PAGE_LIMIT);
    expect(board.currentUser!.isCurrentUser).toBe(true);
  });
});
