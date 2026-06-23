import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeenRules, markRulesSeen, hasSeenGrade, markGradeSeen, hasUsedArchiveFreePlay, markArchiveFreePlayUsed } from './storage';

describe('rules-seen flag', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to false when never set', () => {
    expect(hasSeenRules()).toBe(false);
  });

  it('returns true after markRulesSeen()', () => {
    markRulesSeen();
    expect(hasSeenRules()).toBe(true);
  });

  it('persists the flag in localStorage', () => {
    markRulesSeen();
    expect(localStorage.getItem('rewind_rules_seen')).toBe('1');
  });
});

describe('grade-seen flag (once per puzzle/day)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to false for a puzzle never marked', () => {
    expect(hasSeenGrade('2026-06-16-american')).toBe(false);
  });

  it('returns true only for the marked puzzle id', () => {
    markGradeSeen('2026-06-16-american');
    expect(hasSeenGrade('2026-06-16-american')).toBe(true);
    expect(hasSeenGrade('2026-06-17-american')).toBe(false);
  });
});

describe('archive free-play flag (one free past puzzle before sign-in)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to false when never set', () => {
    expect(hasUsedArchiveFreePlay()).toBe(false);
  });

  it('returns true after markArchiveFreePlayUsed()', () => {
    markArchiveFreePlayUsed();
    expect(hasUsedArchiveFreePlay()).toBe(true);
  });

  it('persists the flag in localStorage', () => {
    markArchiveFreePlayUsed();
    expect(localStorage.getItem('rewind_archive_free_used')).toBe('1');
  });
});
