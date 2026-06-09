import { useState, useEffect } from 'react';
import { fetchGroup, createGroup, joinGroup, leaveGroup } from '../lib/playhub';
import { GroupLeaderboard } from '../components/GroupLeaderboard';
import { DateSelector } from '../components/DateSelector';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { JoinGroupModal } from '../components/JoinGroupModal';
import { ArrowLeft, Plus } from '../components/icons';
import { Toast } from '../components/Toast';
import type { PlayhubGroup, GroupLeaderboardEntry } from '../types';
import styles from './GroupsScreen.module.css';

interface GroupsScreenProps {
  onBack: () => void;
  onRequireAuth: () => void;
  isAuthenticated: boolean;
}

export function GroupsScreen({ onBack, onRequireAuth, isAuthenticated }: GroupsScreenProps) {
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
      .then((g) => { if (!cancelled) setGroup(g); })
      .catch(() => { if (!cancelled) setGroup(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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

    const shareText = `Join us in Rewind Game: Guess when that happened in sports! Use code: ${group.invite_link}`;
    const shareUrl = window.location.origin;

    if (window.isSecureContext && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Rewind group',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(group.invite_link);
      showToast('Copied!');
    } catch {
      showToast(fallbackCopy(group.invite_link) ? 'Copied!' : 'Copy failed');
    }
  };

  if (loading) return null;

  // TODO: Replace with real leaderboard data when endpoint is ready
  const MOCK_SCORES: Record<string, number | null> = {
    'you': 820, 'Mike': 940, 'Sarah': 670, 'Jordan': null, 'Alex': 750,
  };
  const useMock = import.meta.env.VITE_MOCK_API === 'true';

  // Only show leaderboard data for "Today" (offset 0). Past days show empty.
  const isToday = dayOffset === 0;
  const leaderboardEntries: GroupLeaderboardEntry[] = isToday
    ? (group?.members ?? []).map((m) => ({
        displayName: m.user,
        score: useMock ? (MOCK_SCORES[m.user] ?? null) : null,
        isCurrentUser: m.user === 'you',
      }))
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
              authCta={!isAuthenticated ? {
                text: 'Sign in to see your rank',
                onPress: onRequireAuth,
              } : undefined}
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
