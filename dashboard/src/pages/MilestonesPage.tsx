import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdChip,
  MdDivider,
  MdSelect,
  MdSwitch,
  MdTextField,
  StatusBadge,
} from '../components/atoms';
import {
  EmptyState,
  PageHeader,
  SettingsSkeleton,
  SurfaceCard,
  SwitchRow,
  toast,
  UnsavedChangesBar,
} from '../components/molecules';
import { DiscordEmbedPreview } from '../components/organisms';
import { useServerSwitch } from '../components/templates';
import { ChannelItem, RoleItem, UserProfile } from '../types/api';

interface SavedMilestoneSnapshot {
  enabled: boolean;
  every: number;
  goals: string;
  channelId: string;
  roleId: string;
}

export interface MilestonesPageProps {
  user?: UserProfile | null;
}

export const MilestonesPage: React.FC<MilestonesPageProps> = ({ user }) => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMilestone, setTestingMilestone] = useState(false);

  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [serverInfo, setServerInfo] = useState<{
    memberCount: number;
    serverName: string;
    botName: string;
    botAvatar: string | null;
  }>({
    memberCount: 0,
    serverName: 'Discord Server',
    botName: 'ArchiBot',
    botAvatar: null,
  });

  // Milestone Configuration
  const [milestoneEnabled, setMilestoneEnabled] = useState(false);
  const [milestoneEvery, setMilestoneEvery] = useState(50);
  const lastIntervalRef = useRef<number>(50);
  const [milestoneGoals, setMilestoneGoals] = useState('10, 25, 50, 100');
  const [milestoneChannelId, setMilestoneChannelId] = useState('');
  const [milestoneRoleId, setMilestoneRoleId] = useState('');
  const [newGoalInput, setNewGoalInput] = useState('');
  const [goalInputError, setGoalInputError] = useState('');

  // Snapshot for dirty checking & reset
  const [savedSnapshot, setSavedSnapshot] = useState<SavedMilestoneSnapshot | null>(null);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);

    const p = Promise.all([
      fetch(`/api/guilds/${guildId}/settings`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([setData, chanData, roleData]) => {
        const g = setData.general || {};
        const m = setData.milestone || {};
        const loadedEnabled = Boolean(m.enabled);
        const loadedEvery = m.every ?? 50;
        const loadedGoals = (m.goals || [10, 25, 50, 100]).join(', ');
        const loadedChannelId = m.channelId || '';
        const loadedRoleId = m.roleId || '';

        setServerInfo({
          memberCount: Number(g.memberCount) || 0,
          serverName: g.name || 'Discord Server',
          botName: g.botName || 'ArchiBot',
          botAvatar: g.botAvatar || null,
        });

        setMilestoneEnabled(loadedEnabled);
        setMilestoneEvery(loadedEvery);
        if (loadedEvery > 0) {
          lastIntervalRef.current = loadedEvery;
        }
        setMilestoneGoals(loadedGoals);
        setMilestoneChannelId(loadedChannelId);
        setMilestoneRoleId(loadedRoleId);

        setSavedSnapshot({
          enabled: loadedEnabled,
          every: loadedEvery,
          goals: loadedGoals,
          channelId: loadedChannelId,
          roleId: loadedRoleId,
        });

        if (chanData.channels) {
          setChannels(
            chanData.channels.filter(
              (c: ChannelItem) => c.typeName === 'text' || c.typeName === 'announcement'
            )
          );
        }
        if (roleData.roles) {
          setRoles(roleData.roles);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  }, [guildId, registerServerFetch]);

  const parsedGoals = useMemo(() => {
    const nums = milestoneGoals
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0);
    return Array.from(new Set(nums)).sort((a, b) => a - b);
  }, [milestoneGoals]);

  const progressStats = useMemo(() => {
    const count = serverInfo.memberCount;
    const candidates = parsedGoals.filter((g) => g > count);
    if (milestoneEvery > 0) {
      candidates.push((Math.floor(count / milestoneEvery) + 1) * milestoneEvery);
    }
    const next = candidates.length > 0 ? Math.min(...candidates) : null;
    const remaining = next !== null ? Math.max(0, next - count) : null;

    // Following milestone after 'next' (for preview)
    const sampleCount = next ?? Math.max(50, count || 50);
    const afterCandidates = parsedGoals.filter((g) => g > sampleCount);
    if (milestoneEvery > 0) {
      afterCandidates.push((Math.floor(sampleCount / milestoneEvery) + 1) * milestoneEvery);
    }
    const afterNext = afterCandidates.length > 0 ? Math.min(...afterCandidates) : null;
    const afterRemaining = afterNext !== null ? afterNext - sampleCount : null;

    return {
      count,
      next,
      remaining,
      sampleCount,
      afterNext,
      afterRemaining,
    };
  }, [serverInfo.memberCount, parsedGoals, milestoneEvery]);

  const sortedChannels = useMemo(
    () =>
      [...channels].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      ),
    [channels]
  );

  const channelOptions = useMemo(
    () => [
      { value: '', label: 'Select a channel...' },
      ...sortedChannels.map((c) => ({ value: c.id, label: `#${c.name}` })),
    ],
    [sortedChannels]
  );

  const sortedAssignableRoles = useMemo(
    () =>
      roles
        .filter((r) => !r.isEveryone && !r.managed && r.editable)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [roles]
  );

  const roleOptions = useMemo(
    () => [
      { value: '', label: 'None (Disabled)' },
      ...sortedAssignableRoles.map((r) => ({
        value: r.id,
        label: r.name,
        color: r.color && r.color !== '#000000' ? r.color : '#80848e',
      })),
    ],
    [sortedAssignableRoles]
  );

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === milestoneChannelId) || null,
    [channels, milestoneChannelId]
  );

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === milestoneRoleId) || null,
    [roles, milestoneRoleId]
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    if (milestoneEnabled !== savedSnapshot.enabled) return true;
    if (milestoneEvery !== savedSnapshot.every) return true;
    if (milestoneGoals !== savedSnapshot.goals) return true;
    if (milestoneChannelId !== savedSnapshot.channelId) return true;
    if (milestoneRoleId !== savedSnapshot.roleId) return true;
    return false;
  }, [
    savedSnapshot,
    milestoneEnabled,
    milestoneEvery,
    milestoneGoals,
    milestoneChannelId,
    milestoneRoleId,
  ]);

  if (loading && channels.length === 0 && roles.length === 0) {
    return <SettingsSkeleton />;
  }

  const updateGoalsFromArray = (arr: number[]) => {
    const uniqueSorted = Array.from(new Set(arr.filter((n) => n > 0))).sort((a, b) => a - b);
    setMilestoneGoals(uniqueSorted.join(', '));
  };

  const handleToggleRecurringInterval = (enabled: boolean) => {
    if (enabled) {
      const restored = lastIntervalRef.current > 0 ? lastIntervalRef.current : 50;
      setMilestoneEvery(restored);
    } else {
      if (milestoneEvery > 0) {
        lastIntervalRef.current = milestoneEvery;
      }
      setMilestoneEvery(0);
    }
  };

  const handleIntervalInputChange = (val: string) => {
    const parsed = Number.parseInt(val.trim(), 10);
    const nextVal = Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
    if (nextVal > 0) {
      lastIntervalRef.current = nextVal;
    }
    setMilestoneEvery(nextVal);
  };

  const handleAddGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = newGoalInput.trim();
    if (!raw) {
      setGoalInputError('Please enter at least one target member number.');
      return;
    }

    const tokens = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedNumbers = tokens.map((t) => Number.parseInt(t, 10));

    if (parsedNumbers.some((n) => !Number.isInteger(n) || n <= 0)) {
      setGoalInputError('Enter valid positive whole numbers (e.g. 100 or 100, 250, 500).');
      return;
    }

    const newUnique = parsedNumbers.filter((n) => !parsedGoals.includes(n));
    if (newUnique.length === 0) {
      setGoalInputError('That milestone target is already in your list.');
      return;
    }

    updateGoalsFromArray([...parsedGoals, ...newUnique]);
    setNewGoalInput('');
    setGoalInputError('');
  };

  const handleRemoveGoal = (goalToRemove: number) => {
    updateGoalsFromArray(parsedGoals.filter((g) => g !== goalToRemove));
  };

  const handleReset = () => {
    if (!savedSnapshot) return;
    setMilestoneEnabled(savedSnapshot.enabled);
    setMilestoneEvery(savedSnapshot.every);
    if (savedSnapshot.every > 0) {
      lastIntervalRef.current = savedSnapshot.every;
    }
    setMilestoneGoals(savedSnapshot.goals);
    setMilestoneChannelId(savedSnapshot.channelId);
    setMilestoneRoleId(savedSnapshot.roleId);
    setNewGoalInput('');
    setGoalInputError('');
  };

  const handleSave = async () => {
    if (!guildId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          milestone: {
            enabled: milestoneEnabled,
            every: milestoneEvery,
            goals: parsedGoals,
            channelId: milestoneChannelId || null,
            roleId: milestoneRoleId || null,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        const normalizedGoalsStr = parsedGoals.join(', ');
        setMilestoneGoals(normalizedGoalsStr);
        setSavedSnapshot({
          enabled: milestoneEnabled,
          every: milestoneEvery,
          goals: normalizedGoalsStr,
          channelId: milestoneChannelId,
          roleId: milestoneRoleId,
        });
        toast.success('Milestone configuration saved successfully.');
      } else {
        toast.error(data.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      toast.error(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestMilestone = async () => {
    if (!guildId) return;
    if (!milestoneChannelId) {
      toast.warning('Please select an announcement channel first.');
      return;
    }
    setTestingMilestone(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/milestone/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channelId: milestoneChannelId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Test milestone celebration card sent!');
      } else {
        toast.error(data.error || 'Failed to send test milestone banner.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setTestingMilestone(false);
    }
  };

  const previewUsername =
    (user?.global_name || user?.username || 'ArchiMember').replace(' (Local Admin)', '').trim() ||
    'ArchiMember';

  const previewAvatarUrl = useMemo(() => {
    if (!user?.avatar) return undefined;
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }, [user?.id, user?.avatar]);

  const previewEmbedDescription = useMemo(() => {
    const lines = [
      `Congratulations @${previewUsername}! You brought our community to ${progressStats.sampleCount.toLocaleString()} members!`,
    ];
    if (selectedRole) {
      lines.push(`🎁 Special reward unlocked: @${selectedRole.name}`);
    }
    if (progressStats.afterNext !== null) {
      lines.push(
        `🎯 Next milestone: ${progressStats.afterNext.toLocaleString()} members - ${progressStats.afterRemaining?.toLocaleString()} to go.`
      );
    }
    return lines.join('\n');
  }, [previewUsername, progressStats, selectedRole]);

  const intervalSupportingText = useMemo(() => {
    if (milestoneEvery <= 0) return undefined;
    const nextSteps = [1, 2, 3, 4]
      .map(
        (step) =>
          (
            (Math.floor(serverInfo.memberCount / milestoneEvery) + step) *
            milestoneEvery
          ).toLocaleString()
      )
      .join(', ');
    return `Next recurring checkpoints from ${serverInfo.memberCount.toLocaleString()} members: ${nextSteps}…`;
  }, [milestoneEvery, serverInfo.memberCount]);

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      <PageHeader
        title="Member Milestones"
        description="Celebrate server growth automatically with milestone announcements, custom goal targets, and member reward roles."
      />

      {/* 1. Milestone System (Matches WelcomePage & SettingsPage SurfaceCard pattern) */}
      <SurfaceCard
        title="Milestone System"
        subtitle="Enable automatic milestone celebrations, select an announcement channel, and assign a reward role to the milestone member."
        headerAction={
          <MdSwitch
            checked={milestoneEnabled}
            onChange={setMilestoneEnabled}
          />
        }
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <MdSelect
            label="Announcement Channel"
            value={milestoneChannelId}
            onChange={setMilestoneChannelId}
            options={channelOptions}
          />
          <MdSelect
            label="Milestone Winner Reward Role"
            value={milestoneRoleId}
            onChange={setMilestoneRoleId}
            options={roleOptions}
          />
        </div>
        <p className="text-xs font-normal text-discord-muted">
          The member whose join reaches a milestone count is mentioned in the announcement channel and automatically receives the selected reward role.
        </p>
      </SurfaceCard>

      {/* 2. Milestone Intervals & Goal Targets (Manual Inputs + Reusable MdChip List) */}
      <SurfaceCard
        title="Milestone Intervals & Goal Targets"
        subtitle="Enter a recurring member interval, add specific milestone target numbers, or combine both."
        className="flex flex-col gap-5"
      >
        {/* Recurring Member Interval */}
        <div className="flex flex-col gap-3">
          <SwitchRow
            label="Recurring Member Interval"
            description="Celebrate automatically every time your server grows by a custom number of members."
            checked={milestoneEvery > 0}
            onChange={handleToggleRecurringInterval}
          />

          {milestoneEvery > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <MdTextField
                label="Celebrate Every (Members)"
                value={milestoneEvery}
                debounceMs={250}
                onChange={handleIntervalInputChange}
                placeholder="50"
                type="number"
                supportingText={intervalSupportingText}
              />
            </div>
          )}
        </div>

        <MdDivider />

        {/* Specific Milestone Goals */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between text-xs font-normal">
            <div>
              <div className="text-xs font-normal text-discord-white">Specific Milestone Goals</div>
              <div className="text-xs font-normal text-discord-muted mt-0.5">
                Enter a target member count (or multiple numbers separated by commas) to add custom milestone goals.
              </div>
            </div>
            <span className="text-discord-muted shrink-0">
              {parsedGoals.length} {parsedGoals.length === 1 ? 'target' : 'targets'}
            </span>
          </div>

          <form
            onSubmit={handleAddGoal}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                handleAddGoal();
              }
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3"
          >
            <div className="flex-1">
              <MdTextField
                label="Add Target Member Count"
                value={newGoalInput}
                onChange={(val) => {
                  setNewGoalInput(val);
                  if (goalInputError) setGoalInputError('');
                }}
                placeholder="e.g. 100 or 100, 250, 500, 1000"
                supportingText={goalInputError || undefined}
              />
            </div>
            <div className="flex items-center gap-2 sm:pt-2">
              <MdButton
                type="submit"
                variant="tonal"
                icon="add"
                disabled={!newGoalInput.trim()}
              >
                Add Target
              </MdButton>
              {parsedGoals.length > 0 && (
                <MdButton
                  variant="text"
                  onClick={() => updateGoalsFromArray([])}
                >
                  Clear All
                </MdButton>
              )}
            </div>
          </form>

          {parsedGoals.length === 0 ? (
            <EmptyState
              icon="flag"
              title="No milestone targets yet"
              description="Enter a member count above and click Add Target to create your custom milestone goals."
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {parsedGoals.map((goal) => {
                const reached = serverInfo.memberCount >= goal;
                return (
                  <MdChip
                    key={goal}
                    variant="assist"
                    icon={reached ? 'check_circle' : 'close'}
                    label={`${goal.toLocaleString()} members`}
                    onClick={() => handleRemoveGoal(goal)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </SurfaceCard>

      {/* 3. Live Discord Preview (Reusing DiscordEmbedPreview Organism) */}
      <SurfaceCard
        title="Live Preview"
        subtitle={
          selectedChannel
            ? `Previewing milestone announcement in #${selectedChannel.name} (${serverInfo.memberCount.toLocaleString()} current members).`
            : 'Preview how ArchiBot announces milestones in Discord.'
        }
        headerAction={
          <StatusBadge
            size="xs"
            variant="soft"
            tone={progressStats.next !== null ? 'blurple' : 'neutral'}
            label={
              progressStats.next !== null
                ? `Next: ${progressStats.next.toLocaleString()} (${progressStats.remaining?.toLocaleString()} left)`
                : 'No upcoming goal'
            }
          />
        }
        className="flex flex-col gap-4"
      >
        <DiscordEmbedPreview
          botName={serverInfo.botName}
          botAvatar={serverInfo.botAvatar}
          content={`🎉 @${previewUsername}`}
          embed={{
            color: '#F1C40F',
            title: '🏆 Community Milestone Reached!',
            description: previewEmbedDescription,
            thumbnailUrl: previewAvatarUrl,
          }}
          embedBannerSlot={
            <div className="relative w-full h-28 rounded-md bg-[#181920] border-2 border-[#F1C40F] overflow-hidden flex flex-col items-center justify-center select-none">
              <div className="absolute inset-1.5 border border-[#786214] pointer-events-none" />
              <div className="text-[10px] font-mono tracking-[0.22em] text-[#F1C40F] uppercase">
                COMMUNITY MILESTONE
              </div>
              <div
                className="text-lg font-mono tracking-wider text-white mt-1"
                style={{ textShadow: '2px 2px 0px #825F0A' }}
              >
                {progressStats.sampleCount.toLocaleString()} MEMBERS
              </div>
              <div className="w-24 h-0.5 bg-[#F1C40F] mt-2" />
            </div>
          }
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs font-normal text-discord-muted">
            {milestoneChannelId
              ? `Sends a sample milestone card to #${selectedChannel?.name || 'selected channel'}.`
              : 'Select an announcement channel above to send a test card.'}
          </span>
          <MdButton
            variant="tonal"
            icon="send"
            onClick={handleTestMilestone}
            disabled={testingMilestone || !milestoneChannelId}
          >
            {testingMilestone ? 'Sending Test...' : 'Send Test'}
          </MdButton>
        </div>
      </SurfaceCard>

      {/* Floating Unsaved Changes Modal Bar at Bottom Center */}
      <UnsavedChangesBar
        show={isDirty}
        onReset={handleReset}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
};
