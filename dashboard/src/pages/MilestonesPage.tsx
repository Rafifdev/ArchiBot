import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  DiscordMark,
  EmptyState,
  MdButton,
  MdChip,
  MdDivider,
  MdIcon,
  MdSelect,
  MdSwitch,
  MdTextField,
  PageHeader,
  SettingsSkeleton,
  StatusBadge,
  SurfaceCard,
  toast,
  UnsavedChangesBar,
} from '../components/ui';
import { useServerSwitch } from '../components/layout';
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

const INTERVAL_PRESETS = [
  { label: 'Custom Only', value: 0 },
  { label: 'Every 10', value: 10 },
  { label: 'Every 25', value: 25 },
  { label: 'Every 50', value: 50 },
  { label: 'Every 100', value: 100 },
  { label: 'Every 250', value: 250 },
  { label: 'Every 500', value: 500 },
];

const QUICK_GOAL_PRESETS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

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
  const [milestoneGoals, setMilestoneGoals] = useState('10, 25, 50, 100');
  const [milestoneChannelId, setMilestoneChannelId] = useState('');
  const [milestoneRoleId, setMilestoneRoleId] = useState('');
  const [newGoalInput, setNewGoalInput] = useState('');

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

    // Determine previous milestone for progress bar
    const prevCandidates = parsedGoals.filter((g) => g <= count);
    if (milestoneEvery > 0 && count >= milestoneEvery) {
      prevCandidates.push(Math.floor(count / milestoneEvery) * milestoneEvery);
    }
    const prev = prevCandidates.length > 0 ? Math.max(...prevCandidates) : 0;

    const span = next !== null ? Math.max(1, next - prev) : 1;
    const percent =
      next !== null ? Math.min(100, Math.max(4, Math.round(((count - prev) / span) * 100))) : 100;

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
      prev,
      next,
      remaining,
      percent,
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
      { value: '', label: 'Select announcement channel...' },
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
      { value: '', label: 'None (No reward role)' },
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

  const handleAddGoal = (val?: number) => {
    const target = val ?? Number.parseInt(newGoalInput.trim(), 10);
    if (!Number.isInteger(target) || target <= 0) return;
    updateGoalsFromArray([...parsedGoals, target]);
    if (val === undefined) setNewGoalInput('');
  };

  const handleRemoveGoal = (goalToRemove: number) => {
    updateGoalsFromArray(parsedGoals.filter((g) => g !== goalToRemove));
  };

  const handleReset = () => {
    if (!savedSnapshot) return;
    setMilestoneEnabled(savedSnapshot.enabled);
    setMilestoneEvery(savedSnapshot.every);
    setMilestoneGoals(savedSnapshot.goals);
    setMilestoneChannelId(savedSnapshot.channelId);
    setMilestoneRoleId(savedSnapshot.roleId);
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

  const previewUsername = user?.global_name || user?.username || 'ArchiMember';

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      <PageHeader
        category="COMMUNITY & ENGAGEMENT"
        title="Member Milestones"
        description="Celebrate server growth automatically with custom milestone banner cards, goal tracking, and member reward roles."
        actions={
          <div className="flex items-center gap-2.5">
            <MdButton
              variant="tonal"
              icon="celebration"
              onClick={handleTestMilestone}
              disabled={testingMilestone || !milestoneChannelId}
            >
              {testingMilestone ? 'Sending Test...' : 'Send Test Card'}
            </MdButton>
            <MdButton variant="filled" icon="save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </MdButton>
          </div>
        }
      />

      {/* 1. Live Server Milestone Progress Overview */}
      <SurfaceCard className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center text-discord-blurple shrink-0">
              <MdIcon name="emoji_events" className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xs font-normal text-discord-white">
                  Milestone Growth Tracker
                </h2>
                <StatusBadge
                  size="xs"
                  variant="soft"
                  tone={milestoneEnabled ? 'green' : 'neutral'}
                  label={milestoneEnabled ? 'Active' : 'Disabled'}
                />
              </div>
              <p className="text-xs font-normal text-discord-muted mt-0.5">
                Real-time progress toward the next community milestone in {serverInfo.serverName}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-normal text-discord-muted">Enable Celebrations</span>
            <MdSwitch checked={milestoneEnabled} onChange={setMilestoneEnabled} />
          </div>
        </div>

        {/* 4 Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-discord-surface border border-discord-border flex flex-col gap-1">
            <span className="text-xs font-normal text-discord-muted flex items-center gap-1.5">
              <MdIcon name="groups" className="!text-base text-discord-blurple" />
              Current Members
            </span>
            <span className="text-base font-normal text-discord-white">
              {progressStats.count.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-discord-surface border border-discord-border flex flex-col gap-1">
            <span className="text-xs font-normal text-discord-muted flex items-center gap-1.5">
              <MdIcon name="flag" className="!text-base text-discord-yellow" />
              Next Milestone
            </span>
            <span className="text-base font-normal text-discord-white">
              {progressStats.next !== null
                ? `${progressStats.next.toLocaleString()} Members`
                : 'No Upcoming Goal'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-discord-surface border border-discord-border flex flex-col gap-1">
            <span className="text-xs font-normal text-discord-muted flex items-center gap-1.5">
              <MdIcon name="trending_up" className="!text-base text-discord-green" />
              Remaining to Goal
            </span>
            <span className="text-base font-normal text-discord-white">
              {progressStats.remaining !== null
                ? `${progressStats.remaining.toLocaleString()} to go`
                : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-discord-surface border border-discord-border flex flex-col gap-1">
            <span className="text-xs font-normal text-discord-muted flex items-center gap-1.5">
              <MdIcon name="workspace_premium" className="!text-base text-discord-fuchsia" />
              Reward Role
            </span>
            <span className="text-xs font-normal text-discord-white truncate pt-0.5">
              {selectedRole ? `@${selectedRole.name}` : 'None configured'}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        {progressStats.next !== null && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-normal">
              <span className="text-discord-muted">
                Progress from {progressStats.prev.toLocaleString()} to{' '}
                <span className="text-discord-white">
                  {progressStats.next.toLocaleString()} members
                </span>
              </span>
              <span className="text-discord-blurple">{progressStats.percent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-discord-surface border border-discord-border overflow-hidden">
              <div
                className="h-full rounded-full bg-discord-blurple transition-all duration-500"
                style={{ width: `${progressStats.percent}%` }}
              />
            </div>
          </div>
        )}
      </SurfaceCard>

      {/* 2. Main 2-Column Configuration & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings & Goal Targets */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Delivery & Reward Role Card */}
          <SurfaceCard
            title="Announcement & Reward Role"
            subtitle="Choose where ArchiBot posts milestone celebration banners and which role the milestone member unlocks."
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-discord-surface/60 border border-discord-border text-xs font-normal text-discord-muted">
              <MdIcon name="info" className="!text-base text-discord-blurple shrink-0 mt-0.5" />
              <span>
                The member whose join triggers a milestone count is mentioned in the announcement
                and automatically receives the optional reward role.
              </span>
            </div>
          </SurfaceCard>

          {/* Interval & Custom Goals Card */}
          <SurfaceCard
            title="Milestone Intervals & Goal Targets"
            subtitle="Celebrate automatically every N members, at specific milestone numbers, or both."
            className="flex flex-col gap-5"
          >
            {/* Recurring Interval */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xs font-normal text-discord-white">
                  Recurring Member Interval
                </div>
                <div className="text-xs font-normal text-discord-muted mt-0.5">
                  Celebrate every time your server grows by a fixed number of members (set to 0 to
                  use custom goals only).
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {INTERVAL_PRESETS.map((preset) => (
                  <MdChip
                    key={preset.value}
                    variant="filter"
                    selected={milestoneEvery === preset.value}
                    label={preset.label}
                    onClick={() => setMilestoneEvery(preset.value)}
                  />
                ))}
              </div>

              <div className="max-w-xs pt-1">
                <MdTextField
                  label="Custom Interval (Every N Members)"
                  value={milestoneEvery}
                  onChange={(val) => setMilestoneEvery(Math.max(0, Number.parseInt(val, 10) || 0))}
                  type="number"
                />
              </div>
            </div>

            <MdDivider />

            {/* Custom Goal Targets */}
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-normal text-discord-white">
                    Specific Milestone Goals ({parsedGoals.length})
                  </div>
                  <div className="text-xs font-normal text-discord-muted mt-0.5">
                    Add special member count milestones that always trigger a celebration card.
                  </div>
                </div>
              </div>

              {/* Active Goal Chips */}
              {parsedGoals.length === 0 ? (
                <EmptyState
                  icon="flag"
                  title="No custom goals added"
                  description="Add a custom member goal below or pick from the quick presets."
                />
              ) : (
                <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-discord-surface/60 border border-discord-border">
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

              {/* Add Custom Goal Input + Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <MdTextField
                    label="Add Custom Member Goal"
                    value={newGoalInput}
                    onChange={setNewGoalInput}
                    placeholder="e.g. 750"
                    type="number"
                  />
                </div>
                <MdButton
                  variant="tonal"
                  icon="add"
                  onClick={() => handleAddGoal()}
                  disabled={!newGoalInput.trim() || Number.parseInt(newGoalInput, 10) <= 0}
                >
                  Add Target
                </MdButton>
              </div>

              {/* Quick Goal Preset Pills */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-normal text-discord-muted">
                  Quick Goal Presets:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {QUICK_GOAL_PRESETS.map((preset) => {
                    const exists = parsedGoals.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          exists ? handleRemoveGoal(preset) : handleAddGoal(preset)
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-normal border transition-colors cursor-pointer ${
                          exists
                            ? 'bg-discord-active border-discord-blurple text-discord-white'
                            : 'bg-discord-surface border-discord-border text-discord-text/80 hover:text-discord-white hover:border-discord-border-hover'
                        }`}
                      >
                        {exists ? '✓ ' : '+ '}
                        {preset.toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* Right Column: Live Discord Celebration Card Preview */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-6">
          <SurfaceCard
            title="Live Discord Preview"
            subtitle={
              selectedChannel
                ? `Previewing announcement in #${selectedChannel.name}`
                : 'Preview how ArchiBot announces milestones in Discord.'
            }
            className="flex flex-col gap-4"
          >
            {/* Simulated Discord Message Container */}
            <div className="rounded-xl bg-[#313338] border border-[#232428] p-4 text-[#DBDEE1] font-sans">
              <div className="flex items-start gap-3">
                {/* Bot Avatar */}
                {serverInfo.botAvatar ? (
                  <img
                    src={serverInfo.botAvatar}
                    alt={serverInfo.botName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-discord-blurple flex items-center justify-center text-white shrink-0 mt-0.5">
                    <DiscordMark className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Bot Username + APP Badge + Timestamp */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-normal text-white">
                      {serverInfo.botName}
                    </span>
                    <span className="px-1 py-0.2 rounded bg-[#5865F2] text-[10px] font-normal text-white leading-tight">
                      APP
                    </span>
                    <span className="text-[11px] font-normal text-[#949BA4]">
                      Today at 12:00 PM
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="text-xs font-normal text-[#DBDEE1] mt-1">
                    🎉{' '}
                    <span className="px-1 py-0.5 rounded bg-[#5865F2]/30 text-[#C9CDFB]">
                      @{previewUsername}
                    </span>
                  </div>

                  {/* Discord Rich Embed (Gold Milestone Theme #F1C40F) */}
                  <div className="mt-2 rounded bg-[#2B2D31] border-l-4 border-l-[#F1C40F] p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="text-xs font-normal text-white">
                          🏆 Community Milestone Reached!
                        </div>
                        <div className="text-xs font-normal text-[#DBDEE1] leading-relaxed flex flex-col gap-1">
                          <div>
                            Congratulations{' '}
                            <span className="px-1 py-0.5 rounded bg-[#5865F2]/30 text-[#C9CDFB]">
                              @{previewUsername}
                            </span>
                            ! You brought our community to{' '}
                            <span className="text-white">
                              {progressStats.sampleCount.toLocaleString()}
                            </span>{' '}
                            members!
                          </div>

                          {selectedRole && (
                            <div>
                              🎁 Special reward unlocked:{' '}
                              <span
                                className="px-1 py-0.5 rounded"
                                style={{
                                  backgroundColor:
                                    selectedRole.color && selectedRole.color !== '#000000'
                                      ? `${selectedRole.color}26`
                                      : 'rgba(88,101,242,0.25)',
                                  color:
                                    selectedRole.color && selectedRole.color !== '#000000'
                                      ? selectedRole.color
                                      : '#C9CDFB',
                                }}
                              >
                                @{selectedRole.name}
                              </span>
                            </div>
                          )}

                          {progressStats.afterNext !== null && (
                            <div>
                              🎯 Next milestone:{' '}
                              <span className="text-white">
                                {progressStats.afterNext.toLocaleString()}
                              </span>{' '}
                              members -{' '}
                              <span className="text-white">
                                {progressStats.afterRemaining?.toLocaleString()}
                              </span>{' '}
                              to go.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Member Avatar Thumbnail */}
                      {user?.avatar ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                          alt={previewUsername}
                          className="w-11 h-11 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-[#1E1F22] flex items-center justify-center text-[#F1C40F] shrink-0">
                          <MdIcon name="emoji_events" className="text-xl" />
                        </div>
                      )}
                    </div>

                    {/* Simulated Milestone Banner Image (Matches generateMilestoneBanner in captcha.js) */}
                    <div className="relative w-full h-28 rounded-md bg-[#181920] border-2 border-[#F1C40F] overflow-hidden flex flex-col items-center justify-center select-none">
                      {/* Inner Gold Frame */}
                      <div className="absolute inset-1.5 border border-[#786214] pointer-events-none" />

                      {/* Subtle Confetti Dots */}
                      <span className="absolute top-3 left-6 w-1.5 h-1.5 bg-[#5865F2] opacity-80" />
                      <span className="absolute top-5 left-20 w-1.5 h-1.5 bg-[#57F287] opacity-80" />
                      <span className="absolute top-4 right-10 w-1.5 h-1.5 bg-[#EB459E] opacity-80" />
                      <span className="absolute top-7 right-24 w-1.5 h-1.5 bg-[#FEE75C] opacity-80" />
                      <span className="absolute bottom-4 left-12 w-1.5 h-1.5 bg-[#ED4245] opacity-80" />
                      <span className="absolute bottom-5 right-14 w-1.5 h-1.5 bg-[#5865F2] opacity-80" />

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
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <MdButton
                variant="tonal"
                icon="celebration"
                onClick={handleTestMilestone}
                disabled={testingMilestone || !milestoneChannelId}
                className="w-full"
              >
                {testingMilestone
                  ? 'Sending Test Banner...'
                  : 'Send Test Milestone Card to Discord'}
              </MdButton>
              <span className="text-xs font-normal text-discord-muted text-center">
                {milestoneChannelId
                  ? 'Renders and posts a live sample milestone card to the selected channel.'
                  : 'Select an announcement channel on the left to test on Discord.'}
              </span>
            </div>
          </SurfaceCard>
        </div>
      </div>

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
