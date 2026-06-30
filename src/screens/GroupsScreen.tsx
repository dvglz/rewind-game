import { useState, useEffect } from 'react';
import { getDateOverride } from '../data/puzzles';
import { fetchGroups, createGroup, joinGroup, leaveGroup } from '../lib/playhub';
import { fetchLeaderboard, getDayOffsetFromToday } from '../lib/leaderboard';
import { formatTime } from '../lib/formatTime';
import { GroupLeaderboard } from '../components/GroupLeaderboard';
import { DateSelector } from '../components/DateSelector';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { JoinGroupModal } from '../components/JoinGroupModal';
import { ArrowLeft, Plus } from '../components/icons';
import { Toast } from '../components/Toast';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useAuth } from '../context/AuthContext';
import { track } from '../lib/analytics';
import { getPublicAppUrl } from '../lib/share';
import type { GlobalLeaderboard, PlayhubGroup, GroupLeaderboardEntry, GroupMember } from '../types';
import styles from './GroupsScreen.module.css';

interface GroupBoardState {
  groupId: number;
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
  const [dayOffset, setDayOffset] = useState(0);
  const [groupBoardState, setGroupBoardState] = useState<GroupBoardState | null>(null);
  const group = selectedGroupId == null ? null : groups.find((g) => g.id === selectedGroupId) ?? null;
  const groupBoard = group && groupBoardState?.groupId === group.id ? groupBoardState.board : null;

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
    if (!group) return;

    let cancelled = false;
    const groupId = group.id;
    fetchLeaderboard(activeDateOffset + dayOffset, group.id)
      .then((board) => {
        if (!cancelled) setGroupBoardState({ groupId, board });
      })
      .catch(() => {
        if (!cancelled) setGroupBoardState({ groupId, board: null });
      });

    return () => {
      cancelled = true;
    };
  }, [activeDateOffset, dayOffset, group]);

  useEffect(() => {
    if (!group) return;
    track('leaderboard_view', { scope: 'group', day_offset: dayOffset });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, dayOffset]);

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
    const shareText = `Guess 5 sports moments by year.\n\nJoin my Rewind group!\n\nLink: ${inviteUrl}\n\nUse this code to join: ${code}`;

    if (window.isSecureContext && navigator.share) {
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
  const scoreByUserId = new Map(
    scoreRows
      .filter((entry) => entry.userId != null)
      .map((entry) => [entry.userId as number, entry] as const),
  );
  const scoreByName = new Map(
    scoreRows.map((entry) => [entry.displayName, entry] as const),
  );

  const leaderboardEntries: GroupLeaderboardEntry[] = (group?.members ?? []).map((member) => {
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

  const memberCount = group ? getMemberCount(group) : 0;
  const memberLabel = `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
  const handleBack = () => {
    if (group) {
      setSelectedGroupId(null);
      setConfirmLeave(false);
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
        <div className={styles.content}>
          <h1 className={styles.groupName}>{group.name}</h1>
          <p className={styles.memberCount}>{memberLabel}</p>

          <button className={styles.inviteButton} onClick={handleInvite} type="button">
            <Plus />
            Invite Friends
          </button>

          <DateSelector
            dayOffset={dayOffset}
            baseDate={activeDate}
            onPrev={() => setDayOffset((d) => d + 1)}
            onNext={() => setDayOffset((d) => Math.max(0, d - 1))}
          />

          <div className={styles.leaderboardArea}>
            <GroupLeaderboard
              entries={leaderboardEntries}
              emptySeed={`day-${dayOffset}`}
            />
          </div>

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
                    setDayOffset(0);
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
