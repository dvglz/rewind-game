import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeenRules, markRulesSeen } from './storage';

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
