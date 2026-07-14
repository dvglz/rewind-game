import { useEffect, useMemo, useState } from 'react';
import { getDateOverride } from '../data/puzzles';
import { SPECIAL_DAYS, getActiveSpecial, specialEndDate, type SpecialDay } from '../data/specials';
import { fetchLeaderboard } from '../lib/leaderboard';
import { getDayOffsetFromToday } from '../lib/leaderboard';
import { formatTime } from '../lib/formatTime';
import { LEADERBOARD_PAGE_LIMIT } from '../config/leaderboard';
import { GroupLeaderboard } from '../components/GroupLeaderboard';
import { DateSelector } from '../components/DateSelector';
import { ArrowLeft, RewindGlyph } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { track } from '../lib/analytics';
import type { GlobalLeaderboard, GroupLeaderboardEntry } from '../types';
import styles from './LeaderboardScreen.module.css';

interface LeaderboardScreenProps {
  onBack: () => void;
}

function shiftDateByDays(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/**
 * The day picker walks an ordered list of board slots: one per regular day,
 * plus one extra slot per special event pinned right after its date — so
 * Jul 15 shows twice: the daily board, then "Jul 15 · Messi Special 🇦🇷".
 */
type BoardSlot =
  | { kind: 'regular'; offset: number }
  | { kind: 'special'; offset: number; special: SpecialDay };

const MAX_SLOT_DAYS = 60;

function buildSlots(activeDate: string): BoardSlot[] {
  const specials = SPECIAL_DAYS.filter((s) => s.enabled && s.date <= activeDate);
  const slots: BoardSlot[] = [];
  for (let offset = 0; offset < MAX_SLOT_DAYS; offset++) {
    slots.push({ kind: 'regular', offset });
    const date = shiftDateByDays(activeDate, -offset);
    // Multi-day specials get one board slot per live day.
    const special = specials.find((s) => date >= s.date && date <= specialEndDate(s));
    if (special) slots.push({ kind: 'special', offset, special });
  }
  return slots;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const { user: authUser } = useAuth();
  const activeDate = getDateOverride();
  const activeDateOffset = getDayOffsetFromToday(activeDate);
  const slots = useMemo(() => buildSlots(activeDate), [activeDate]);
  // Opening the leaderboard from special mode lands on that special's board.
  const [slotIndex, setSlotIndex] = useState(() => {
    const active = getActiveSpecial();
    if (!active) return 0;
    const index = slots.findIndex((s) => s.kind === 'special' && s.special.slug === active.slug);
    return index >= 0 ? index : 0;
  });
  const [board, setBoard] = useState<GlobalLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const slot = slots[slotIndex] ?? slots[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const gameMode = slot.kind === 'special' ? slot.special.gameMode : undefined;
    fetchLeaderboard(activeDateOffset + slot.offset, undefined, gameMode)
      .then((b) => { if (!cancelled) setBoard(b); })
      .catch(() => { if (!cancelled) setBoard(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeDateOffset, slot]);

  useEffect(() => {
    track('leaderboard_view', {
      scope: 'global',
      day_offset: slot.offset,
      ...(slot.kind === 'special' ? { special: slot.special.slug } : {}),
    });
  }, [slot]);

  const entries: GroupLeaderboardEntry[] = (board?.entries ?? []).map((e) => ({
    displayName: e.displayName,
    score: e.score,
    time: formatTime(e.timeMs),
    isCurrentUser: e.isCurrentUser,
  }));

  const pinnedEntry =
    board?.currentUser && board.currentUser.rank > LEADERBOARD_PAGE_LIMIT
      ? {
          rank: board.currentUser.rank,
          displayName: authUser?.username ?? board.currentUser.displayName,
          score: board.currentUser.score,
          time: formatTime(board.currentUser.timeMs),
        }
      : undefined;

  // Prev must stay available when the next-older slot is a special, even if
  // the regular chain reports no previous board.
  const nextOlder = slots[slotIndex + 1];
  const hasPrevious = nextOlder?.kind === 'special' ? true : (board?.hasPrevious ?? true);

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft />
        </button>
        <button className={`${styles.wordmark} ${styles.wordmarkAction}`} onClick={onBack} type="button">
          REWIND
        </button>
        <span className={styles.topBarSpacer} />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Leaderboard</h1>

        <DateSelector
          dayOffset={slot.offset}
          baseDate={activeDate}
          hasPrevious={hasPrevious}
          specialLabel={slot.kind === 'special' ? `${slot.special.label} ${slot.special.flag}` : undefined}
          canNext={slotIndex > 0}
          onPrev={() => setSlotIndex((i) => Math.min(i + 1, slots.length - 1))}
          onNext={() => setSlotIndex((i) => Math.max(0, i - 1))}
        />

        <div className={styles.leaderboardArea}>
          {loading ? (
            <div className={styles.loadingState} role="status" aria-label="Loading leaderboard">
              <RewindGlyph className={styles.loadingGlyph} aria-hidden="true" />
            </div>
          ) : (
            <GroupLeaderboard
              entries={entries}
              pinnedEntry={pinnedEntry}
              emptySeed={`lb-${slotIndex}`}
            />
          )}
        </div>

        <p className={styles.disclaimer}>
          Updates every 2 min. Ties: fastest run, then earliest submission.
        </p>
      </div>
    </div>
  );
}
