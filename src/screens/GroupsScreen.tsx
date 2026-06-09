import { useState, useEffect } from 'react';
import { fetchGroup, createGroup, joinGroup, leaveGroup } from '../lib/playhub';
import { GroupLeaderboard } from '../components/GroupLeaderboard';
import { DateSelector } from '../components/DateSelector';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { JoinGroupModal } from '../components/JoinGroupModal';
import { ArrowLeft, Plus } from '../components/icons';
import { Toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { loadGameState } from '../engine/storage';
import { getTodaysPuzzle } from '../data/puzzles';
import type { PlayhubGroup, GroupLeaderboardEntry, GroupMember } from '../types';
import styles from './GroupsScreen.module.css';

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

interface GroupsScreenProps {
  onBack: () => void;
  onRequireAuth: () => void;
  isAuthenticated: boolean;
  pendingInvite?: string;
  onInviteHandled?: () => void;
}

export function GroupsScreen({ onBack, onRequireAuth, isAuthenticated, pendingInvite, onInviteHandled }: GroupsScreenProps) {
  const { user: authUser } = useAuth();
  const [group, setGroup] = useState<PlayhubGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [toast, setToast] = useState('');
  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchGroup()
      .then((g) => {
        if (cancelled) return;
        setGroup(g);
        if (pendingInvite && !g) {
          joinGroup(pendingInvite)
            .then(() => fetchGroup())
            .then((joined) => { if (!cancelled) setGroup(joined); })
            .catch((err) => {
              if (!cancelled) showToast(err instanceof Error ? err.message : 'Failed to join group');
            })
            .finally(() => { if (!cancelled) onInviteHandled?.(); });
        } else if (pendingInvite && g) {
          showToast("You're already in a group");
          onInviteHandled?.();
        }
      })
      .catch(() => { if (!cancelled) setGroup(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreate = async (name: string) => {
    await createGroup(name);
    setShowCreate(false);
    const g = await fetchGroup();
    setGroup(g);
    showToast('Group created');
  };

  const handleJoin = async (code: string) => {
    await joinGroup(code);
    setShowJoin(false);
    const g = await fetchGroup();
    setGroup(g);
  };

  const handleLeave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    await leaveGroup();
    setConfirmLeave(false);
    setGroup(null);
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
    const inviteUrl = `${window.location.origin}/?invite=${code}`;
    const shareText = `Guess 5 sports moments by year.\n\nJoin my Rewind group!\n\nLink: ${inviteUrl}\n\nUse this code to join: ${code}`;

    if (window.isSecureContext && navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      showToast('Copied!');
    } catch {
      showToast(fallbackCopy(shareText) ? 'Copied!' : 'Copy failed');
    }
  };

  if (loading) return null;

  const MOCK_SCORES: Record<string, number | null> = {
    'you': 820, 'Mike': 940, 'Sarah': 670, 'Jordan': null, 'Alex': 750,
  };
  const useMock = import.meta.env.VITE_MOCK_API === 'true';

  const isToday = dayOffset === 0;
  const myScore = (() => {
    if (!isToday) return null;
    const puzzle = getTodaysPuzzle();
    const saved = loadGameState(puzzle.id);
    return saved?.completed ? saved.totalScore : null;
  })();

  const leaderboardEntries: GroupLeaderboardEntry[] = isToday
    ? (group?.members ?? []).map((m) => {
        const name = getMemberName(m);
        const memberId = getMemberId(m);
        const isMe = memberId != null && authUser != null && memberId === authUser.id;
        return {
          displayName: isMe ? 'You' : name,
          score: useMock ? (MOCK_SCORES[name] ?? null) : (isMe ? myScore : null),
          isCurrentUser: isMe,
        };
      })
    : [];

  const memberCount = group?.members.length ?? 0;
  const memberLabel = `${memberCount} member${memberCount !== 1 ? 's' : ''}`;

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft />
        </button>
        <span className={styles.wordmark}>REWIND</span>
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
