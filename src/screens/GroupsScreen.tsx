import { useState, useEffect, useMemo, useRef } from 'react';
import { getDateOverride } from '../data/puzzles';
import { buildBoardSlots, initialSlotIndex } from '../lib/boardSlots';
import { fetchGroups, fetchGroup, createGroup, joinGroup, leaveGroup } from '../lib/playhub';
import { fetchLeaderboard, getDayOffsetFromToday } from '../lib/leaderboard';
import { periodLabel } from '../lib/periodLabel';
import { formatTime } from '../lib/formatTime';
import { DEFAULT_LEADERBOARD_PERIOD, type LeaderboardPeriod } from '../config/leaderboard';
import { GroupLeaderboard } from '../components/GroupLeaderboard';
import { DateSelector } from '../components/DateSelector';
import { PeriodSelector } from '../components/PeriodSelector';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { JoinGroupModal } from '../components/JoinGroupModal';
import { ArrowLeft, Plus, RewindGlyph } from '../components/icons';
import { Toast } from '../components/Toast';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useAuth } from '../context/AuthContext';
import { track } from '../lib/analytics';
import { getPublicAppUrl } from '../lib/share';
import type { GlobalLeaderboard, PlayhubGroup, GroupLeaderboardEntry, GroupMember } from '../types';
import styles from './GroupsScreen.module.css';

interface GroupBoardState {
  groupId: number;
  /** Day/period offset the board was fetched for. */
  dayOffset: number;
  /** Period the board was fetched for. */
  period: LeaderboardPeriod;
  /** Special game mode the board was fetched for (undefined = regular). */
  gameMode?: string;
  board: GlobalLeaderboard | null;
}

function extractInviteCode(inviteLink: string): string {
  const match = inviteLink.match(/invite=([A-Za-z0-9]+)/);
  if (match) return match[1];
  return inviteLink.replace(/[^A-Za-z0-9]/g, '');
}

function getMemberName(m: GroupMember): string {
  return typeof m.user === 'string' ? m.user : m.user.username;
}

function getMemberId(m: GroupMember): number | null {
  return typeof m.user === 'string' ? null : m.user.id;
}

function getMemberCount(group: PlayhubGroup): number {
  const count = group.members_count;
  if (typeof count === 'number') return count;
  if (typeof count === 'string') {
    const parsed = Number.parseInt(count, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return group.members.length;
}

function sortGroups(groups: PlayhubGroup[]): PlayhubGroup[] {
  return [...groups].sort((a, b) => getMemberCount(b) - getMemberCount(a));
}

function mergeGroup(groups: PlayhubGroup[], group: PlayhubGroup): PlayhubGroup[] {
  return sortGroups([group, ...groups.filter((g) => g.id !== group.id)]);
}

interface GroupsScreenProps {
  onBack: () => void;
  onRequireAuth: () => void;
  isAuthenticated: boolean;
  pendingInvite?: string;
  onInviteHandled?: () => void;
}

export function GroupsScreen({ onBack, onRequireAuth, isAuthenticated, pendingInvite, onInviteHandled }: GroupsScreenProps) {
  const { user: authUser } = useAuth();
  const activeDate = getDateOverride();
  const activeDateOffset = getDayOffsetFromToday(activeDate);
  const [groups, setGroups] = useState<PlayhubGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [toast, setToast] = useState('');
  const slots = useMemo(() => buildBoardSlots(activeDate), [activeDate]);
  const [slotIndex, setSlotIndex] = useState(() => initialSlotIndex(slots));
  const [period, setPeriod] = useState<LeaderboardPeriod>(DEFAULT_LEADERBOARD_PERIOD);
  const [periodOffset, setPeriodOffset] = useState(0);
  const [groupBoardState, setGroupBoardState] = useState<GroupBoardState | null>(null);
  const detailGroupIds = useRef(new Set<number>());
  const group = selectedGroupId == null ? null : groups.find((g) => g.id === selectedGroupId) ?? null;
  const isDaily = period === 'daily';
  const slot = slots[slotIndex] ?? slots[0];
  const slotGameMode = isDaily && slot.kind === 'special' ? slot.special.gameMode : undefined;
  const requestedDayOffset = isDaily ? activeDateOffset + slot.offset : periodOffset;
  // The stored board only counts when it matches BOTH the open group and the
  // selected day/period — so switching group, day, or period makes it "not
  // loaded yet" and we show the loader instead of stale scores or a DNP flash.
  const activeBoardState =
    group &&
    groupBoardState?.groupId === group.id &&
    groupBoardState.dayOffset === requestedDayOffset &&
    groupBoardState.period === period &&
    groupBoardState.gameMode === slotGameMode
      ? groupBoardState
      : null;
  const groupBoard = activeBoardState?.board ?? null;
  // Scores for the selected group + day haven't arrived yet: show a loader
  // rather than rendering every member as DNP while the request is in flight.
  const boardLoading = !!group && activeBoardState == null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    if (pendingInvite) {
      fetchGroups()
        .then((initialGroups) => {
          if (cancelled) return;
          const sortedGroups = sortGroups(initialGroups);
          const existingGroup = sortedGroups.find((g) => extractInviteCode(g.invite_link) === pendingInvite);
          if (existingGroup) {
            setGroups(sortedGroups);
            setSelectedGroupId(existingGroup.id);
            return;
          }
          return joinGroup(pendingInvite)
            .then((joinedGroup) => {
              track('group_join', { via: 'invite_link' });
              return fetchGroups()
                .then((nextGroups) => ({ joinedGroup, nextGroups }))
                .catch(() => ({ joinedGroup, nextGroups: initialGroups }));
            })
            .then(({ joinedGroup, nextGroups }) => {
              if (!cancelled) {
                setGroups(mergeGroup(nextGroups, joinedGroup));
                setSelectedGroupId(joinedGroup.id);
                showToast('Joined group');
              }
            });
        })
        .catch((err) => {
          if (cancelled) return;
          showToast(err instanceof Error ? err.message : 'Failed to join group');
          return fetchGroups().then((nextGroups) => {
            if (cancelled) return;
            setGroups(sortGroups(nextGroups));
            const existingGroup = nextGroups.find((g) => extractInviteCode(g.invite_link) === pendingInvite);
            if (existingGroup) setSelectedGroupId(existingGroup.id);
          });
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
          onInviteHandled?.();
        });
    } else {
      fetchGroups()
        .then((nextGroups) => { if (!cancelled) setGroups(sortGroups(nextGroups)); })
        .catch(() => { if (!cancelled) setGroups([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!group || group.members.length > 0 || detailGroupIds.current.has(group.id)) return;

    let cancelled = false;
    const groupId = group.id;
    detailGroupIds.current.add(groupId);
    fetchGroup(groupId)
      .then((detailedGroup) => {
        if (!cancelled) setGroups((currentGroups) => mergeGroup(currentGroups, detailedGroup));
      })
      .catch(() => {
        // Keep the score-only fallback when group detail is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [group]);

  useEffect(() => {
    if (!group) return;

    let cancelled = false;
    const groupId = group.id;
    const requested = isDaily ? activeDateOffset + slot.offset : periodOffset;
    const gameMode = isDaily && slot.kind === 'special' ? slot.special.gameMode : undefined;
    fetchLeaderboard(requested, { period, groupId: group.id, gameMode })
      .then((board) => {
        if (!cancelled) setGroupBoardState({ groupId, dayOffset: requested, period, gameMode, board });
      })
      .catch(() => {
        if (!cancelled) setGroupBoardState({ groupId, dayOffset: requested, period, gameMode, board: null });
      });

    return () => {
      cancelled = true;
    };
  }, [activeDateOffset, slot, periodOffset, period, isDaily, group?.id]);

  useEffect(() => {
    if (!group) return;
    track('leaderboard_view', {
      scope: 'group',
      period,
      day_offset: isDaily ? slot.offset : periodOffset,
      ...(isDaily && slot.kind === 'special' ? { special: slot.special.slug } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, slot, period, periodOffset, isDaily]);

  const handleCreate = async (name: string) => {
    const createdGroup = await createGroup(name);
    track('group_create');
    setShowCreate(false);
    setGroups((currentGroups) => mergeGroup(currentGroups, createdGroup));
    setSelectedGroupId(createdGroup.id);
    showToast('Group created');
    fetchGroups()
      .then((nextGroups) => setGroups(mergeGroup(nextGroups, createdGroup)))
      .catch(() => undefined);
  };

  const handleJoin = async (code: string) => {
    const joinedGroup = await joinGroup(code);
    track('group_join', { via: 'code' });
    setShowJoin(false);
    setGroups((currentGroups) => mergeGroup(currentGroups, joinedGroup));
    setSelectedGroupId(joinedGroup.id);
    showToast('Joined group');
    fetchGroups()
      .then((nextGroups) => setGroups(mergeGroup(nextGroups, joinedGroup)))
      .catch(() => undefined);
  };

  const handleLeave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    if (!group) return;
    await leaveGroup(group.id);
    track('group_leave');
    setConfirmLeave(false);
    setGroups((currentGroups) => currentGroups.filter((g) => g.id !== group.id));
    setSelectedGroupId(null);
    showToast('You left the group');
  };

  const fallbackCopy = (text: string): boolean => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  };

  const handleInvite = async () => {
    if (!group) return;

    const code = extractInviteCode(group.invite_link);
    const inviteUrl = `${getPublicAppUrl()}/?invite=${code}`;
    const shareText = `⏪ Join "${group.name}" on Rewind\nGuess 5 NBA moments by year\nGo ${inviteUrl} or use code ${code}`;

    // Native share is a great experience on phones/tablets, but on desktop
    // (notably Windows Chrome/Edge) the OS share flyout frequently resolves as
    // success when dismissed, so the code below would `return` without ever
    // copying — the invite silently does nothing. Only offer native share when
    // the primary pointer is coarse (touch); everything else copies + toasts.
    const preferNativeShare =
      window.isSecureContext &&
      typeof navigator.share === 'function' &&
      !!window.matchMedia?.('(pointer: coarse)').matches;

    if (preferNativeShare) {
      try {
        await navigator.share({
          text: shareText,
        });
        track('invite_share', { method: 'native' });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      track('invite_share', { method: 'clipboard' });
      showToast('Copied!');
    } catch {
      if (fallbackCopy(shareText)) {
        track('invite_share', { method: 'clipboard' });
        showToast('Copied!');
      } else {
        showToast('Copy failed');
      }
    }
  };

  if (loading) return <LoadingOverlay />;

  const scoreRows = [
    ...(groupBoard?.entries ?? []),
    ...(groupBoard?.currentUser ? [groupBoard.currentUser] : []),
  ];
  const uniqueScoreRows = Array.from(
    new Map(
      scoreRows.map((entry) => [
        entry.userId != null ? `user:${entry.userId}` : `name:${entry.displayName}`,
        entry,
      ] as const),
    ).values(),
  );
  const scoreByUserId = new Map(
    uniqueScoreRows
      .filter((entry) => entry.userId != null)
      .map((entry) => [entry.userId as number, entry] as const),
  );
  const scoreByName = new Map(
    uniqueScoreRows.map((entry) => [entry.displayName, entry] as const),
  );

  const memberRows: GroupLeaderboardEntry[] = (group?.members ?? []).map((member) => {
    const name = getMemberName(member);
    const memberId = getMemberId(member);
    const isMe = memberId != null && authUser != null && memberId === authUser.id;
    const scoreEntry = memberId != null
      ? scoreByUserId.get(memberId) ?? (isMe ? groupBoard?.currentUser : undefined)
      : scoreByName.get(name);

    return {
      displayName: name,
      score: scoreEntry?.score ?? null,
      time: scoreEntry ? formatTime(scoreEntry.timeMs) : undefined,
      isCurrentUser: isMe,
    };
  });
  const scoreOnlyRows: GroupLeaderboardEntry[] = uniqueScoreRows.map((entry) => ({
    displayName: entry.displayName,
    score: entry.score,
    time: formatTime(entry.timeMs),
    isCurrentUser: entry.isCurrentUser,
  }));
  const leaderboardEntries = memberRows.length > 0 ? memberRows : scoreOnlyRows;

  const memberCount = group ? getMemberCount(group) : 0;
  const memberLabel = `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
  const handleBack = () => {
    if (group) {
      setSelectedGroupId(null);
      setConfirmLeave(false);
      setPeriodOffset(0);
      setPeriod(DEFAULT_LEADERBOARD_PERIOD);
      return;
    }
    onBack();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={handleBack} type="button" aria-label="Back">
          <ArrowLeft />
        </button>
        <button className={styles.wordmarkButton} onClick={onBack} type="button">
          <span className={styles.wordmark}>REWIND</span>
        </button>
        <span className={styles.topBarSpacer} />
      </div>

      {group ? (
        <div className={`${styles.content} ${styles.detailContent}`}>
          <div className={styles.detailHeader}>
            <h1 className={styles.groupName}>{group.name}</h1>
            <p className={styles.memberCount}>{memberLabel}</p>

            <button className={styles.inviteButton} onClick={handleInvite} type="button">
              <Plus />
              Invite Friends
            </button>

            <PeriodSelector value={period} onChange={(next) => { setPeriod(next); setSlotIndex(initialSlotIndex(slots)); setPeriodOffset(0); }} />

            {isDaily ? (
              <DateSelector
                dayOffset={slot.offset}
                baseDate={activeDate}
                specialLabel={slot.kind === 'special' ? `${slot.special.label} ${slot.special.flag}` : undefined}
                canNext={slotIndex > 0}
                onPrev={() => setSlotIndex((i) => Math.min(i + 1, slots.length - 1))}
                onNext={() => setSlotIndex((i) => Math.max(0, i - 1))}
              />
            ) : (
              <DateSelector
                dayOffset={periodOffset}
                baseDate={activeDate}
                hasPrevious={groupBoard?.hasPrevious ?? true}
                label={periodLabel(period, periodOffset, groupBoard?.startDate, groupBoard?.endDate).label}
                subLabel={periodLabel(period, periodOffset, groupBoard?.startDate, groupBoard?.endDate).subLabel}
                canNext={periodOffset > 0}
                onPrev={() => setPeriodOffset((o) => o + 1)}
                onNext={() => setPeriodOffset((o) => Math.max(0, o - 1))}
              />
            )}
          </div>

          <div className={styles.leaderboardArea}>
            {boardLoading ? (
              <div className={styles.loadingState} role="status" aria-label="Loading scores">
                <RewindGlyph className={styles.loadingGlyph} aria-hidden="true" />
              </div>
            ) : (
              <GroupLeaderboard
                entries={leaderboardEntries}
                emptySeed={`day-${slotIndex}`}
              />
            )}
          </div>

          <p className={styles.disclaimer}>
            Updates every 2 min. Ties: fastest run, then earliest submission.
          </p>

          <button
            className={`${styles.leaveButton} ${confirmLeave ? styles.leaveButtonConfirm : ''}`}
            onClick={handleLeave}
            type="button"
          >
            {confirmLeave ? 'Tap Again to Leave' : 'Leave Group'}
          </button>
        </div>
      ) : groups.length > 0 ? (
        <div className={styles.content}>
          <h1 className={styles.listTitle}>My Groups</h1>
          <div className={styles.groupList}>
            {groups.map((g) => {
              const count = getMemberCount(g);
              const label = `${count} member${count !== 1 ? 's' : ''}`;
              return (
                <button
                  key={g.id}
                  className={styles.groupRow}
                  onClick={() => {
                    setSelectedGroupId(g.id);
                    setSlotIndex(initialSlotIndex(slots));
                    setPeriod(DEFAULT_LEADERBOARD_PERIOD);
                    setPeriodOffset(0);
                    setConfirmLeave(false);
                  }}
                  type="button"
                >
                  <span className={styles.groupRowName}>{g.name}</span>
                  <span className={styles.groupRowCount}>{label}</span>
                </button>
              );
            })}
          </div>
          <div className={styles.listActions}>
            <button
              className={styles.listButtonPrimary}
              onClick={() => isAuthenticated ? setShowJoin(true) : onRequireAuth()}
              type="button"
            >
              Join by Code
            </button>
            <button
              className={styles.listButtonSecondary}
              onClick={() => isAuthenticated ? setShowCreate(true) : onRequireAuth()}
              type="button"
            >
              Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <h1 className={styles.emptyTitle}>
              Bring Rewind{'\n'}to your group chat
            </h1>
            <p className={styles.emptySubtitle}>
              Compare scores and see who knows sports best.
            </p>
            <div className={styles.emptyActions}>
              <button
                className={styles.emptyButtonPrimary}
                onClick={() => isAuthenticated ? setShowJoin(true) : onRequireAuth()}
                type="button"
              >
                Join by Code
              </button>
              <button
                className={styles.emptyButtonSecondary}
                onClick={() => isAuthenticated ? setShowCreate(true) : onRequireAuth()}
                type="button"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
      {showJoin && (
        <JoinGroupModal onClose={() => setShowJoin(false)} onJoin={handleJoin} />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}
