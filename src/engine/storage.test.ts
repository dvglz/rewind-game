import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeenRules, markRulesSeen, hasSeenGrade, markGradeSeen } from './storage';

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
