import { describe, it, expect } from 'vitest';
import { archiveGateAction } from './archiveGate';

describe('archiveGateAction (soft gate for past puzzles)', () => {
  it('lets authenticated users play unconditionally', () => {
    expect(archiveGateAction({ isAuthenticated: true, mockMode: false, freeUsed: false })).toBe('play');
    expect(archiveGateAction({ isAuthenticated: true, mockMode: false, freeUsed: true })).toBe('play');
  });

  it('lets mock-mode (local dev) bypass the gate', () => {
    expect(archiveGateAction({ isAuthenticated: false, mockMode: true, freeUsed: true })).toBe('play');
  });

  it('grants the first free play to a logged-out user', () => {
    expect(archiveGateAction({ isAuthenticated: false, mockMode: false, freeUsed: false })).toBe('play-free');
  });

  it('gates a logged-out user who already spent their free play', () => {
    expect(archiveGateAction({ isAuthenticated: false, mockMode: false, freeUsed: true })).toBe('gate');
  });
});
