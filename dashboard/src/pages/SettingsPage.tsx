import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MdButton, MdTextField, MdSelect, MdLoading, MdIcon } from '../components/atoms';
import { MdTabs, PageHeader, NoticeBanner, SurfaceCard, SwitchRow, EmptyState } from '../components/molecules';
import { ChannelItem, RoleItem } from '../types/api';

const TAB_MAP: Record<string, number> = {
  general: 0,
  bot: 0,
  welcome: 1,
  milestone: 2,
  audit: 3,
};

export const SettingsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [searchParams] = useSearchParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMilestone, setTestingMilestone] = useState(false);
  const [notice, setNotice] = useState('');

  // Settings State
  const [botNickname, setBotNickname] = useState('');
  const [serverName, setServerName] = useState('');

  // Welcome / Goodbye
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeChannelId, setWelcomeChannelId] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const [goodbyeEnabled, setGoodbyeEnabled] = useState(false);
  const [goodbyeChannelId, setGoodbyeChannelId] = useState('');
  const [goodbyeMessage, setGoodbyeMessage] = useState('');

  // Milestone
  const [milestoneEnabled, setMilestoneEnabled] = useState(false);
  const [milestoneEvery, setMilestoneEvery] = useState(50);
  const [milestoneGoals, setMilestoneGoals] = useState('10, 25, 50, 100');
  const [milestoneChannelId, setMilestoneChannelId] = useState('');
  const [milestoneRoleId, setMilestoneRoleId] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TAB_MAP[tabParam] !== undefined) {
      setTabIndex(TAB_MAP[tabParam]);
    }
  }, [searchParams]);

  const fetchSettings = () => {
    Promise.all([
      fetch(`/api/guilds/${guildId}/settings`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/audit`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([setData, chanData, roleData, auditData]) => {
        if (setData.general) {
          setBotNickname(setData.general.botNickname || '');
          setServerName(setData.general.name || '');
        }
        if (setData.welcome) {
          setWelcomeEnabled(setData.welcome.enabled);
          setWelcomeChannelId(setData.welcome.channelId || '');
          setWelcomeMessage(setData.welcome.message || '');
        }
        if (setData.goodbye) {
          setGoodbyeEnabled(setData.goodbye.enabled);
          setGoodbyeChannelId(setData.goodbye.channelId || '');
          setGoodbyeMessage(setData.goodbye.message || '');
        }
        if (setData.milestone) {
          setMilestoneEnabled(setData.milestone.enabled);
          setMilestoneEvery(setData.milestone.every || 50);
          setMilestoneGoals((setData.milestone.goals || []).join(', '));
          setMilestoneChannelId(setData.milestone.channelId || '');
          setMilestoneRoleId(setData.milestone.roleId || '');
        }
        if (chanData.channels) {
          setChannels(chanData.channels.filter((c: any) => c.typeName === 'text'));
        }
        if (roleData.roles) setRoles(roleData.roles);
        if (auditData.logs) setAuditLogs(auditData.logs);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, [guildId]);

  const handleSave = async () => {
    setSaving(true);
    setNotice('');
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
          general: {
            botNickname,
            name: serverName,
          },
          welcome: {
            enabled: welcomeEnabled,
            channelId: welcomeChannelId,
            message: welcomeMessage,
          },
          goodbye: {
            enabled: goodbyeEnabled,
            channelId: goodbyeChannelId,
            message: goodbyeMessage,
          },
          milestone: {
            enabled: milestoneEnabled,
            every: milestoneEvery,
            goals: goalsArr,
            channelId: milestoneChannelId,
            roleId: milestoneRoleId,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice('Settings updated and saved successfully!');
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestMilestone = async () => {
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
        alert(data.message);
      } else {
        alert(data.error || 'Failed to send test banner');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setTestingMilestone(false);
    }
  };

  if (loading) return <MdLoading />;

  const channelOptions = [
    { value: '', label: 'Select a channel...' },
    ...channels.map((c) => ({ value: c.id, label: `#${c.name}` })),
  ];

  const roleOptions = [
    { value: '', label: 'None (No reward role)' },
    ...roles.filter((r) => !r.isEveryone && r.editable).map((r) => ({ value: r.id, label: r.name })),
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        category="SETTINGS"
        title="Bot & Server Settings"
        description="Configure ArchiBot nickname, automated greetings, member milestones, and view Discord audit logs."
        actions={
          <MdButton variant="filled" icon="save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </MdButton>
        }
      />

      {notice && <NoticeBanner message={notice} tone="success" />}

      {/* Tabs (Only Real Bot Features) */}
      <MdTabs
        activeIndex={tabIndex}
        onChange={setTabIndex}
        tabs={[
          { id: 'general', label: 'General & Bot', icon: 'smart_toy' },
          { id: 'welcome', label: 'Welcome & Goodbye', icon: 'waving_hand' },
          { id: 'milestone', label: 'Milestone Celebrations', icon: 'emoji_events' },
          { id: 'audit', label: 'Discord Audit Logs', icon: 'history' },
        ]}
      />

      {/* Tab 0: General & Bot */}
      {tabIndex === 0 && (
        <SurfaceCard className="flex flex-col gap-4">
          <h3 className="text-xs font-normal text-discord-white">ArchiBot Profile in this Server</h3>
          <MdTextField
            label="ArchiBot Server Nickname"
            value={botNickname}
            onChange={setBotNickname}
            placeholder="e.g. ArchiBot Architect"
          />

          <h3 className="text-xs font-normal text-discord-white mt-2">Discord Server Name</h3>
          <MdTextField label="Server Name" value={serverName} onChange={setServerName} />
        </SurfaceCard>
      )}

      {/* Tab 1: Welcome & Goodbye */}
      {tabIndex === 1 && (
        <div className="flex flex-col gap-5">
          {/* Welcome Card */}
          <SurfaceCard className="flex flex-col gap-4">
            <SwitchRow
              label="Welcome Message System"
              description="Automatically greet new members when they join the server."
              checked={welcomeEnabled}
              onChange={setWelcomeEnabled}
            />

            {welcomeEnabled && (
              <>
                <MdSelect
                  label="Welcome Channel"
                  value={welcomeChannelId}
                  onChange={setWelcomeChannelId}
                  options={channelOptions}
                />
                <MdTextField
                  label="Welcome Message Template"
                  value={welcomeMessage}
                  onChange={setWelcomeMessage}
                  type="textarea"
                  rows={3}
                />
                <div className="text-xs text-discord-muted font-normal">
                  <span className="font-normal text-discord-text">Supported variables:</span>{' '}
                  <code className="bg-discord-surface px-1.5 py-0.5 rounded text-discord-text">{'{user}'}</code> (mention),{' '}
                  <code className="bg-discord-surface px-1.5 py-0.5 rounded text-discord-text">{'{username}'}</code> (name),{' '}
                  <code className="bg-discord-surface px-1.5 py-0.5 rounded text-discord-text">{'{server}'}</code> (server name),{' '}
                  <code className="bg-discord-surface px-1.5 py-0.5 rounded text-discord-text">{'{memberCount}'}</code> (total member count).
                </div>
              </>
            )}
          </SurfaceCard>

          {/* Goodbye Card */}
          <SurfaceCard className="flex flex-col gap-4">
            <SwitchRow
              label="Goodbye Message System"
              description="Post an alert when a member leaves the server."
              checked={goodbyeEnabled}
              onChange={setGoodbyeEnabled}
            />

            {goodbyeEnabled && (
              <>
                <MdSelect
                  label="Goodbye Channel"
                  value={goodbyeChannelId}
                  onChange={setGoodbyeChannelId}
                  options={channelOptions}
                />
                <MdTextField
                  label="Goodbye Message Template"
                  value={goodbyeMessage}
                  onChange={setGoodbyeMessage}
                  type="textarea"
                  rows={2}
                />
              </>
            )}
          </SurfaceCard>
        </div>
      )}

      {/* Tab 2: Milestone Celebrations */}
      {tabIndex === 2 && (
        <SurfaceCard className="flex flex-col gap-4">
          <SwitchRow
            label="Member Milestone Celebrations"
            description="ArchiBot generates a custom celebration card and posts it whenever your server hits target member milestones."
            checked={milestoneEnabled}
            onChange={setMilestoneEnabled}
          />

          {milestoneEnabled && (
            <>
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

              <div className="flex flex-wrap items-center gap-3 mt-1">
                <MdButton
                  variant="tonal"
                  icon="celebration"
                  onClick={handleTestMilestone}
                  disabled={testingMilestone || !milestoneChannelId}
                >
                  {testingMilestone ? 'Sending Test...' : 'Send Test Milestone Card to Discord'}
                </MdButton>
                <span className="text-xs text-discord-muted">
                  Generates an image banner and sends it to the selected channel.
                </span>
              </div>
            </>
          )}
        </SurfaceCard>
      )}

      {/* Tab 3: Audit Logs */}
      {tabIndex === 3 && (
        <SurfaceCard>
          <h3 className="text-xs font-normal text-discord-white mb-4">
            Recent Discord Server Audit Logs ({auditLogs.length})
          </h3>

          {auditLogs.length === 0 ? (
            <EmptyState icon="history" description="No audit log entries found." className="py-6" />
          ) : (
            <md-list>
              {auditLogs.map((log) => (
                <md-list-item key={log.id} class="rounded-lg mb-1 bg-discord-surface border border-discord-border">
                  {log.executor?.avatar ? (
                    <img
                      slot="start"
                      src={log.executor.avatar}
                      alt="executor"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <MdIcon name="person" slot="start" />
                  )}
                  <span className="text-xs text-discord-text">
                    <span className="font-normal">{log.executor?.username || 'System'}</span> performed action{' '}
                    <code className="bg-discord-canvas px-1.5 py-0.5 rounded text-discord-blurple">{log.action}</code>
                  </span>
                  <div slot="supporting-text" className="text-xs text-discord-muted">
                    Reason: {log.reason}
                  </div>
                  <div slot="trailing-supporting-text" className="text-xs text-discord-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </md-list-item>
              ))}
            </md-list>
          )}
        </SurfaceCard>
      )}
    </div>
  );
};
