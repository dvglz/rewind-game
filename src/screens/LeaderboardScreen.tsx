import { useEffect, useMemo, useState } from 'react';
import { getDateOverride } from '../data/puzzles';
import { buildBoardSlots, initialSlotIndex } from '../lib/boardSlots';
import { fetchLeaderboard, getDayOffsetFromToday } from '../lib/leaderboard';
import { periodLabel } from '../lib/periodLabel';
import { formatTime } from '../lib/formatTime';
import { LEADERBOARD_PAGE_LIMIT, DEFAULT_LEADERBOARD_PERIOD, type LeaderboardPeriod } from '../config/leaderboard';
import { GroupLeaderboard } from '../components/GroupLeaderboard';
import { DateSelector } from '../components/DateSelector';
import { PeriodSelector } from '../components/PeriodSelector';
import { ArrowLeft, RewindGlyph } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { track } from '../lib/analytics';
import type { GlobalLeaderboard, GroupLeaderboardEntry } from '../types';
import styles from './LeaderboardScreen.module.css';

interface LeaderboardScreenProps {
  onBack: () => void;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const { user: authUser } = useAuth();
  const activeDate = getDateOverride();
  const activeDateOffset = getDayOffsetFromToday(activeDate);
  const slots = useMemo(() => buildBoardSlots(activeDate), [activeDate]);

  const [period, setPeriod] = useState<LeaderboardPeriod>(DEFAULT_LEADERBOARD_PERIOD);
  // Daily navigates via slots (incl. specials); weekly/monthly via periodOffset.
  const [slotIndex, setSlotIndex] = useState(() => initialSlotIndex(slots));
  const [periodOffset, setPeriodOffset] = useState(0);
  const [board, setBoard] = useState<GlobalLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  const isDaily = period === 'daily';
  const slot = slots[slotIndex] ?? slots[0];
  const gameMode = isDaily && slot.kind === 'special' ? slot.special.gameMode : undefined;
  const offset = isDaily ? activeDateOffset + slot.offset : periodOffset;

  const changePeriod = (next: LeaderboardPeriod) => {
    setPeriod(next);
    setSlotIndex(initialSlotIndex(slots));
    setPeriodOffset(0);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBoard(null);
    fetchLeaderboard(offset, { period, gameMode })
      .then((b) => { if (!cancelled) setBoard(b); })
      .catch(() => { if (!cancelled) setBoard(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [offset, period, gameMode]);

  useEffect(() => {
    track('leaderboard_view', {
      scope: 'global',
      period,
      day_offset: isDaily ? slot.offset : periodOffset,
      ...(isDaily && slot.kind === 'special' ? { special: slot.special.slug } : {}),
    });
  }, [period, slot, periodOffset, isDaily]);

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

  const nextOlder = slots[slotIndex + 1];
  const dailyHasPrevious = nextOlder?.kind === 'special' ? true : (board?.hasPrevious ?? true);

  const periodText = isDaily ? { label: undefined, subLabel: undefined } : periodLabel(period, periodOffset, board?.startDate, board?.endDate);

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

        <PeriodSelector value={period} onChange={changePeriod} />

        {isDaily ? (
          <DateSelector
            dayOffset={slot.offset}
            baseDate={activeDate}
            hasPrevious={dailyHasPrevious}
            specialLabel={slot.kind === 'special' ? `${slot.special.label} ${slot.special.flag}` : undefined}
            canNext={slotIndex > 0}
            onPrev={() => setSlotIndex((i) => Math.min(i + 1, slots.length - 1))}
            onNext={() => setSlotIndex((i) => Math.max(0, i - 1))}
          />
        ) : (
          <DateSelector
            dayOffset={periodOffset}
            baseDate={activeDate}
            hasPrevious={board?.hasPrevious ?? true}
            label={periodText.label}
            subLabel={periodText.subLabel}
            unit={period === 'weekly' ? 'week' : 'month'}
            canNext={periodOffset > 0}
            onPrev={() => setPeriodOffset((o) => o + 1)}
            onNext={() => setPeriodOffset((o) => Math.max(0, o - 1))}
          />
        )}

        <div className={styles.leaderboardArea}>
          {loading ? (
            <div className={styles.loadingState} role="status" aria-label="Loading leaderboard">
              <RewindGlyph className={styles.loadingGlyph} aria-hidden="true" />
            </div>
          ) : (
            <GroupLeaderboard
              entries={entries}
              pinnedEntry={pinnedEntry}
              emptySeed={`lb-${period}-${isDaily ? slotIndex : periodOffset}`}
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
