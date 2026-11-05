import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdSelect,
  MdTextField,
  PageHeader,
  SettingsSkeleton,
  SurfaceCard,
  SwitchRow,
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

export const MilestonesPage: React.FC<MilestonesPageProps> = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMilestone, setTestingMilestone] = useState(false);

  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);

  // Milestone Configuration
  const [milestoneEnabled, setMilestoneEnabled] = useState(false);
  const [milestoneEvery, setMilestoneEvery] = useState(50);
  const [milestoneGoals, setMilestoneGoals] = useState('10, 25, 50, 100');
  const [milestoneChannelId, setMilestoneChannelId] = useState('');
  const [milestoneRoleId, setMilestoneRoleId] = useState('');

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
        const m = setData.milestone || {};
        const loadedEnabled = Boolean(m.enabled);
        const loadedEvery = m.every || 50;
        const loadedGoals = (m.goals || [10, 25, 50, 100]).join(', ');
        const loadedChannelId = m.channelId || '';
        const loadedRoleId = m.roleId || '';

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
          setChannels(chanData.channels.filter((c: ChannelItem) => c.typeName === 'text'));
        }
        if (roleData.roles) {
          setRoles(roleData.roles);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  }, [guildId, registerServerFetch]);

  const sortedChannels = useMemo(
    () => [...channels].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
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
      { value: '', label: 'None (No reward role)' },
      ...sortedAssignableRoles.map((r) => ({ value: r.id, label: r.name })),
    ],
    [sortedAssignableRoles]
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    if (milestoneEnabled !== savedSnapshot.enabled) return true;
    if (milestoneEvery !== savedSnapshot.every) return true;
    if (milestoneGoals !== savedSnapshot.goals) return true;
    if (milestoneChannelId !== savedSnapshot.channelId) return true;
    if (milestoneRoleId !== savedSnapshot.roleId) return true;
    return false;
  }, [savedSnapshot, milestoneEnabled, milestoneEvery, milestoneGoals, milestoneChannelId, milestoneRoleId]);

  if (loading && channels.length === 0 && roles.length === 0) {
    return <SettingsSkeleton />;
  }

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
      const goalsArr = milestoneGoals
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n > 0);

      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          milestone: {
            enabled: milestoneEnabled,
            every: milestoneEvery,
            goals: goalsArr,
            channelId: milestoneChannelId || null,
            roleId: milestoneRoleId || null,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSnapshot({
          enabled: milestoneEnabled,
          every: milestoneEvery,
          goals: milestoneGoals,
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
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to send test milestone banner.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setTestingMilestone(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl pb-16">
      <PageHeader
        title="Member Milestones"
        description="Celebrate server growth with automatic member milestone announcement cards and reward roles."
        actions={
          <MdButton variant="filled" icon="save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </MdButton>
        }
      />

      <SurfaceCard
        title="Milestone Celebrations"
        subtitle="ArchiBot generates a custom celebration card and posts it whenever your server hits target member milestones."
        collapsible
        defaultOpen
        className="flex flex-col gap-4"
      >
        <SwitchRow
          label="Milestone Celebrations"
          checked={milestoneEnabled}
          onChange={setMilestoneEnabled}
        />

        {milestoneEnabled && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MdSelect
                label="Celebration Announcement Channel"
                value={milestoneChannelId}
                onChange={setMilestoneChannelId}
                options={channelOptions}
              />
              <MdSelect
                label="Optional Reward Role Granted"
                value={milestoneRoleId}
                onChange={setMilestoneRoleId}
                options={roleOptions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MdTextField
                label="Interval (e.g. Every N members)"
                value={milestoneEvery}
                onChange={(val) => setMilestoneEvery(Number(val) || 0)}
                type="number"
              />
              <div className="md:col-span-2">
                <MdTextField
                  label="Custom Goal Targets (comma-separated)"
                  value={milestoneGoals}
                  onChange={setMilestoneGoals}
                  placeholder="10, 25, 50, 100, 250, 500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <MdButton
                variant="tonal"
                icon="celebration"
                onClick={handleTestMilestone}
                disabled={testingMilestone || !milestoneChannelId}
              >
                {testingMilestone ? 'Sending Test...' : 'Send Test Milestone Card to Discord'}
              </MdButton>
              <span className="text-xs font-normal text-discord-muted">
                Generates a live image banner and sends it to the selected celebration channel.
              </span>
            </div>
          </div>
        )}
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
