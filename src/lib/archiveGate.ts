export type ArchiveGateAction = 'play' | 'play-free' | 'gate';

interface ArchiveGateInput {
  isAuthenticated: boolean;
  /** Local mock-API dev mode, which bypasses auth gates like the leaderboard does. */
  mockMode: boolean;
  /** Whether the logged-out user has already spent their single free archived game. */
  freeUsed: boolean;
}

/**
 * Decide what happens when someone taps a past puzzle in the Archive.
 * Logged-out users get one free game ('play-free'); after that they're gated
 * to sign-in ('gate'). Authenticated and mock-mode users always 'play'.
 */
export function archiveGateAction({ isAuthenticated, mockMode, freeUsed }: ArchiveGateInput): ArchiveGateAction {
  if (isAuthenticated || mockMode) return 'play';
  if (freeUsed) return 'gate';
  return 'play-free';
}
