import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ColorPickerField,
  EmptyState,
  MdChip,
  MdDivider,
  MdIcon,
  MdSelect,
  MdSwitch,
  MdTextField,
  PageHeader,
  SettingsSkeleton,
  SurfaceCard,
  SwitchRow,
  toast,
  UnsavedChangesBar,
} from '../components/ui';
import { useServerSwitch, ThemeMode } from '../components/layout';
import { ChannelItem, MemberItem, RoleItem } from '../types/api';

const ACCENT_PRESETS = [
  { label: 'Slate', value: '#4E5466' },
  { label: 'Violet', value: '#6D28D9' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Blurple', value: '#5865F2' },
  { label: 'Royal Blue', value: '#2563EB' },
  { label: 'Sky Blue', value: '#0EA5E9' },
  { label: 'Teal', value: '#0891B2' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Rose', value: '#EC4899' },
];

interface SavedSettingsSnapshot {
  botNickname: string;
  serverName: string;
  adminRoleId: string;
  language: string;
  footerText: string;
  footerIconUrl: string;
  embedColor: string;
  generalLogChannelId: string;
  inviteLogChannelId: string;
  boosterLogChannelId: string;
  accessControlEnabled: boolean;
  accessRoleIds: string[];
  accessMemberIds: string[];
  antiInvite: boolean;
  antiSpam: boolean;
}

export const SettingsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    registerServerFetch,
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
  } = useServerSwitch();
  const [customAccentInput, setCustomAccentInput] = useState(accentColor);

  useEffect(() => {
    setCustomAccentInput(accentColor);
  }, [accentColor]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reference Data
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);

  // 1. Admin Role & Language
  const [adminRoleId, setAdminRoleId] = useState('');
  const [language, setLanguage] = useState('en');

  // 2. Identity & Customization
  const [botNickname, setBotNickname] = useState('');
  const [serverName, setServerName] = useState('');
  const [serverInfo, setServerInfo] = useState<{
    memberCount?: number;
    serverIcon?: string | null;
    botAvatar?: string | null;
    botName?: string;
  }>({});
  const [footerText, setFooterText] = useState('');
  const [footerIconUrl, setFooterIconUrl] = useState('');
  const [embedColor, setEmbedColor] = useState('#5865F2');

  // 3. Logging Channels
  const [generalLogChannelId, setGeneralLogChannelId] = useState('');
  const [inviteLogChannelId, setInviteLogChannelId] = useState('');
  const [boosterLogChannelId, setBoosterLogChannelId] = useState('');

  // 4. Access Control
  const [accessControlEnabled, setAccessControlEnabled] = useState(false);
  const [accessRoleIds, setAccessRoleIds] = useState<string[]>([]);
  const [accessMemberIds, setAccessMemberIds] = useState<string[]>([]);

  // 5. Server Protection
  const [antiInvite, setAntiInvite] = useState(false);
  const [antiSpam, setAntiSpam] = useState(false);

  // Snapshot for dirty checking & reset
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSettingsSnapshot | null>(null);

  // Backward compatibility: redirect ?tab=welcome, ?tab=milestone, and ?tab=audit to their dedicated routes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'welcome') {
      navigate(`/guilds/${guildId}/welcome`, { replace: true });
      return;
    }
    if (tabParam === 'milestone') {
      navigate(`/guilds/${guildId}/milestones`, { replace: true });
      return;
    }
    if (tabParam === 'audit') {
      navigate(`/guilds/${guildId}/audit`, { replace: true });
      return;
    }
  }, [searchParams, guildId, navigate]);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);

    const p = Promise.all([
      fetch(`/api/guilds/${guildId}/settings`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/members?limit=200`, { credentials: 'include' })
        .then((r) => r.json())
        .catch(() => ({ members: [] })),
    ])
      .then(([setData, roleData, chanData, memData]) => {
        if (roleData?.roles) setRoles(roleData.roles);
        if (chanData?.channels) setChannels(chanData.channels);
        if (memData?.members) setMembers(memData.members);

        const g = setData.general || {};
        const c = setData.customization || {};
        const l = setData.logging || {};
        const ac = setData.accessControl || {};
        const am = setData.automod || {};
        const sc = setData.systemChannels || {};

        const loadedNickname = g.botNickname || '';
        const loadedServerName = g.name || '';
        const loadedAdminRole = g.adminRoleId || '';
        const loadedLanguage = g.language || 'en';

        const loadedFooterText = c.footerText ?? `${g.botName || 'ArchiBot'} • Server Architect`;
        const loadedFooterIcon = c.footerIconUrl || '';
        const loadedEmbedColor = c.embedColor || '#5865F2';

        const loadedGeneralLog = l.generalChannelId || am.logChannelId || '';
        const loadedInviteLog = l.inviteChannelId || sc.inviteLogsId || '';
        const loadedBoosterLog = l.boosterChannelId || sc.boosterLogsId || '';

        const loadedAcEnabled = Boolean(ac.enabled);
        const loadedAcRoles = Array.isArray(ac.roleIds) ? ac.roleIds : [];
        const loadedAcMembers = Array.isArray(ac.memberIds) ? ac.memberIds : [];

        const loadedAntiInvite = Boolean(am.antiInvite);
        const loadedAntiSpam = Boolean(am.antiSpam);

        setBotNickname(loadedNickname);
        setServerName(loadedServerName);
        setAdminRoleId(loadedAdminRole);
        setLanguage(loadedLanguage);
        setServerInfo({
          memberCount: g.memberCount,
          serverIcon: g.serverIcon,
          botAvatar: g.botAvatar,
          botName: g.botName,
        });

        setFooterText(loadedFooterText);
        setFooterIconUrl(loadedFooterIcon);
        setEmbedColor(loadedEmbedColor);

        setGeneralLogChannelId(loadedGeneralLog);
        setInviteLogChannelId(loadedInviteLog);
        setBoosterLogChannelId(loadedBoosterLog);

        setAccessControlEnabled(loadedAcEnabled);
        setAccessRoleIds(loadedAcRoles);
        setAccessMemberIds(loadedAcMembers);

        setAntiInvite(loadedAntiInvite);
        setAntiSpam(loadedAntiSpam);

        setSavedSnapshot({
          botNickname: loadedNickname,
          serverName: loadedServerName,
          adminRoleId: loadedAdminRole,
          language: loadedLanguage,
          footerText: loadedFooterText,
          footerIconUrl: loadedFooterIcon,
          embedColor: loadedEmbedColor,
          generalLogChannelId: loadedGeneralLog,
          inviteLogChannelId: loadedInviteLog,
          boosterLogChannelId: loadedBoosterLog,
          accessControlEnabled: loadedAcEnabled,
          accessRoleIds: loadedAcRoles,
          accessMemberIds: loadedAcMembers,
          antiInvite: loadedAntiInvite,
          antiSpam: loadedAntiSpam,
        });
      })
      .catch((err) => {
        toast.error(`Failed to load settings: ${err.message}`);
      })
      .finally(() => setLoading(false));

    registerServerFetch(p);
  }, [guildId, registerServerFetch]);

  const sortedRoles = useMemo(
    () =>
      roles
        .filter((r) => !r.isEveryone && !r.managed)
        .sort((a, b) => b.position - a.position),
    [roles]
  );

  const adminRoleOptions = useMemo(
    () => [
      { value: '', label: 'Select a role...' },
      ...sortedRoles.map((r) => ({
        value: r.id,
        label: r.name,
        color: r.color && r.color !== '#000000' ? r.color : '#80848e',
      })),
    ],
    [sortedRoles]
  );

  const availableAccessRoleOptions = useMemo(
    () => [
      { value: '', label: 'Select a role...' },
      ...sortedRoles
        .filter((r) => !accessRoleIds.includes(r.id))
        .map((r) => ({
          value: r.id,
          label: r.name,
          color: r.color && r.color !== '#000000' ? r.color : '#80848e',
        })),
    ],
    [sortedRoles, accessRoleIds]
  );

  const availableAccessMemberOptions = useMemo(
    () => [
      { value: '', label: 'Search for a member...' },
      ...members
        .filter((m) => !m.bot && !accessMemberIds.includes(m.id))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }))
        .map((m) => ({
          value: m.id,
          label: `${m.displayName} (@${m.username})`,
        })),
    ],
    [members, accessMemberIds]
  );

  const textChannelOptions = useMemo(() => {
    const textChans = channels
      .filter((c) => c.typeName === 'text' || c.typeName === 'announcement')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return [
      { value: '', label: 'None (Disabled)' },
      ...textChans.map((c) => ({ value: c.id, label: `#${c.name}` })),
    ];
  }, [channels]);

  const totalAccessRules = accessRoleIds.length + accessMemberIds.length;

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    if (botNickname !== savedSnapshot.botNickname) return true;
    if (serverName !== savedSnapshot.serverName) return true;
    if (adminRoleId !== savedSnapshot.adminRoleId) return true;
    if (language !== savedSnapshot.language) return true;
    if (footerText !== savedSnapshot.footerText) return true;
    if (footerIconUrl !== savedSnapshot.footerIconUrl) return true;
    if (embedColor !== savedSnapshot.embedColor) return true;
    if (generalLogChannelId !== savedSnapshot.generalLogChannelId) return true;
    if (inviteLogChannelId !== savedSnapshot.inviteLogChannelId) return true;
    if (boosterLogChannelId !== savedSnapshot.boosterLogChannelId) return true;
    if (accessControlEnabled !== savedSnapshot.accessControlEnabled) return true;
    if (JSON.stringify(accessRoleIds) !== JSON.stringify(savedSnapshot.accessRoleIds)) return true;
    if (JSON.stringify(accessMemberIds) !== JSON.stringify(savedSnapshot.accessMemberIds)) return true;
    if (antiInvite !== savedSnapshot.antiInvite) return true;
    if (antiSpam !== savedSnapshot.antiSpam) return true;
    return false;
  }, [
    savedSnapshot,
    botNickname,
    serverName,
    adminRoleId,
    language,
    footerText,
    footerIconUrl,
    embedColor,
    generalLogChannelId,
    inviteLogChannelId,
    boosterLogChannelId,
    accessControlEnabled,
    accessRoleIds,
    accessMemberIds,
    antiInvite,
    antiSpam,
  ]);

  if (loading && !savedSnapshot) {
    return <SettingsSkeleton />;
  }

  const handleAddAccessRole = (roleId: string) => {
    if (!roleId || accessRoleIds.includes(roleId) || totalAccessRules >= 10) return;
    setAccessRoleIds((prev) => [...prev, roleId]);
  };

  const handleRemoveAccessRole = (roleId: string) => {
    setAccessRoleIds((prev) => prev.filter((id) => id !== roleId));
  };

  const handleAddAccessMember = (memberId: string) => {
    if (!memberId || accessMemberIds.includes(memberId) || totalAccessRules >= 10) return;
    setAccessMemberIds((prev) => [...prev, memberId]);
  };

  const handleRemoveAccessMember = (memberId: string) => {
    setAccessMemberIds((prev) => prev.filter((id) => id !== memberId));
  };

  const handleReset = () => {
    if (!savedSnapshot) return;
    setBotNickname(savedSnapshot.botNickname);
    setServerName(savedSnapshot.serverName);
    setAdminRoleId(savedSnapshot.adminRoleId);
    setLanguage(savedSnapshot.language);
    setFooterText(savedSnapshot.footerText);
    setFooterIconUrl(savedSnapshot.footerIconUrl);
    setEmbedColor(savedSnapshot.embedColor);
    setGeneralLogChannelId(savedSnapshot.generalLogChannelId);
    setInviteLogChannelId(savedSnapshot.inviteLogChannelId);
    setBoosterLogChannelId(savedSnapshot.boosterLogChannelId);
    setAccessControlEnabled(savedSnapshot.accessControlEnabled);
    setAccessRoleIds(savedSnapshot.accessRoleIds);
    setAccessMemberIds(savedSnapshot.accessMemberIds);
    setAntiInvite(savedSnapshot.antiInvite);
    setAntiSpam(savedSnapshot.antiSpam);
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
          general: {
            botNickname,
            name: serverName,
            adminRoleId: adminRoleId || null,
            language,
          },
          customization: {
            footerText,
            footerIconUrl,
            embedColor,
          },
          logging: {
            generalChannelId: generalLogChannelId || null,
            inviteChannelId: inviteLogChannelId || null,
            boosterChannelId: boosterLogChannelId || null,
          },
          accessControl: {
            enabled: accessControlEnabled,
            roleIds: accessRoleIds,
            memberIds: accessMemberIds,
          },
          automod: {
            antiInvite,
            antiSpam,
            logChannelId: generalLogChannelId || null,
          },
          systemChannels: {
            inviteLogsId: inviteLogChannelId || null,
            boosterLogsId: boosterLogChannelId || null,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSnapshot({
          botNickname,
          serverName,
          adminRoleId,
          language,
          footerText,
          footerIconUrl,
          embedColor,
          generalLogChannelId,
          inviteLogChannelId,
          boosterLogChannelId,
          accessControlEnabled,
          accessRoleIds,
          accessMemberIds,
          antiInvite,
          antiSpam,
        });
        toast.success('Settings saved successfully.');
      } else {
        toast.error(data.error || 'Failed to save settings.');
      }
    } catch (err: any) {
      toast.error(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      <PageHeader
        title="Settings"
        description="Modify ArchiBot's appearance, general settings, customization, logging, and access control to your desire."
      />

      {/* 0. Appearance (Accent Color & Interface Theme) */}
      <SurfaceCard
        title="Appearance"
        subtitle="Change how ArchiBot looks and feels in your browser."
        className="flex flex-col gap-5"
      >
        {/* Accent Color */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xs font-normal text-discord-white">Accent color</div>
            <div className="text-xs font-normal text-discord-muted mt-0.5">
              Update your dashboard to your brand color.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              {ACCENT_PRESETS.map((preset) => {
                const isSelected = accentColor.toUpperCase() === preset.value.toUpperCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setAccentColor(preset.value)}
                    className={`relative w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                      isSelected ? 'scale-105' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: preset.value,
                      boxShadow: isSelected
                        ? `0 0 0 2px var(--color-discord-card), 0 0 0 4px ${preset.value}`
                        : 'none',
                    }}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 sm:ml-2">
              <span className="text-xs font-normal text-discord-muted">Custom</span>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-discord-surface border border-discord-border focus-within:border-discord-blurple transition-colors">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(accentColor) ? accentColor : '#5865F2'}
                  onChange={(e) => setAccentColor(e.target.value.toUpperCase())}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  title="Pick custom accent color"
                />
                <input
                  type="text"
                  value={customAccentInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomAccentInput(val);
                    const normalized = val.startsWith('#') ? val : `#${val}`;
                    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
                      setAccentColor(normalized.toUpperCase());
                    }
                  }}
                  placeholder="#5865F2"
                  maxLength={7}
                  className="w-20 bg-transparent text-xs font-normal text-discord-white focus:outline-none font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <MdDivider />

        {/* Interface Theme */}
        <div className="flex flex-col gap-3.5">
          <div>
            <div className="text-xs font-normal text-discord-white">Interface theme</div>
            <div className="text-xs font-normal text-discord-muted mt-0.5">
              Select or customize your UI theme.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                { id: 'system' as ThemeMode, label: 'System preference' },
                { id: 'light' as ThemeMode, label: 'Light' },
                { id: 'dark' as ThemeMode, label: 'Dark' },
              ] as const
            ).map((option) => {
              const selected = themeMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setThemeMode(option.id)}
                  className="group flex flex-col gap-2.5 text-left cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                >
                  {/* Visual Dashboard Preview Frame */}
                  <div
                    className={`w-full h-36 rounded-xl p-2 transition-all overflow-hidden border-2 ${
                      selected
                        ? 'border-discord-blurple shadow-sm'
                        : 'border-discord-border hover:border-discord-border-hover'
                    }`}
                    style={{
                      backgroundColor:
                        option.id === 'light'
                          ? '#F2F3F5'
                          : option.id === 'dark'
                          ? '#0E1015'
                          : '#181B23',
                    }}
                  >
                    {option.id === 'system' ? (
                      /* Split Light / Dark Preview */
                      <div className="w-full h-full rounded-lg overflow-hidden grid grid-cols-2 border border-discord-border/40">
                        {/* Left Half: Light */}
                        <div className="bg-[#FFFFFF] p-2.5 flex flex-col gap-2 border-r border-[#DBDEE1]">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ED4245]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FEE75C]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#57F287]" />
                          </div>
                          <div className="flex gap-2 flex-1 min-h-0">
                            <div className="w-8 flex flex-col gap-1.5 pt-0.5">
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: accentColor }}
                                />
                                <span
                                  className="h-1.5 flex-1 rounded-full"
                                  style={{ backgroundColor: accentColor }}
                                />
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-[#E3E5E8]" />
                              <div className="h-1.5 w-4/5 rounded-full bg-[#E3E5E8]" />
                              <div className="h-1.5 w-full rounded-full bg-[#E3E5E8]" />
                            </div>
                            <div className="flex-1 bg-[#F8F9FA] rounded-md p-2 flex flex-col gap-1.5 border border-[#EBEDEF]">
                              <div className="text-[9px] font-normal text-[#111214] truncate">
                                Your dashboard
                              </div>
                              <div className="flex-1 rounded bg-[#FFFFFF] border border-[#EBEDEF]" />
                            </div>
                          </div>
                        </div>

                        {/* Right Half: Dark */}
                        <div className="bg-[#14161D] p-2.5 flex flex-col gap-2">
                          <div className="flex items-center justify-end gap-1">
                            <span className="h-2 w-5 rounded bg-[#232733]" />
                            <span
                              className="h-2 w-5 rounded"
                              style={{ backgroundColor: accentColor }}
                            />
                          </div>
                          <div className="flex-1 bg-[#181B23] rounded-md p-2 flex flex-col gap-1.5 border border-[#232733]">
                            <div className="text-[9px] font-normal text-[#F2F3F5] truncate">
                              Preview
                            </div>
                            <div className="flex-1 rounded bg-[#20242F] border border-[#232733]" />
                          </div>
                        </div>
                      </div>
                    ) : option.id === 'light' ? (
                      /* Full Light Preview */
                      <div className="w-full h-full rounded-lg bg-[#FFFFFF] border border-[#DBDEE1] p-2.5 flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ED4245]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FEE75C]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#57F287]" />
                        </div>
                        <div className="flex gap-2.5 flex-1 min-h-0">
                          <div className="w-10 flex flex-col gap-1.5 pt-0.5">
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: accentColor }}
                              />
                              <span
                                className="h-1.5 flex-1 rounded-full"
                                style={{ backgroundColor: accentColor }}
                              />
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#E3E5E8]" />
                            <div className="h-1.5 w-4/5 rounded-full bg-[#E3E5E8]" />
                            <div className="h-1.5 w-full rounded-full bg-[#E3E5E8]" />
                          </div>
                          <div className="flex-1 bg-[#F8F9FA] rounded-md p-2 flex flex-col gap-1.5 border border-[#EBEDEF]">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-normal text-[#111214]">
                                Your dashboard
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="h-2 w-4 rounded bg-[#E3E5E8]" />
                                <span
                                  className="h-2 w-4 rounded"
                                  style={{ backgroundColor: accentColor }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 flex-1">
                              <div className="rounded bg-[#FFFFFF] border border-[#EBEDEF]" />
                              <div className="rounded bg-[#FFFFFF] border border-[#EBEDEF]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Full Dark Preview */
                      <div className="w-full h-full rounded-lg bg-[#14161D] border border-[#232733] p-2.5 flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ED4245]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FEE75C]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#57F287]" />
                        </div>
                        <div className="flex gap-2.5 flex-1 min-h-0">
                          <div className="w-10 flex flex-col gap-1.5 pt-0.5">
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: accentColor }}
                              />
                              <span
                                className="h-1.5 flex-1 rounded-full"
                                style={{ backgroundColor: accentColor }}
                              />
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#232733]" />
                            <div className="h-1.5 w-4/5 rounded-full bg-[#232733]" />
                            <div className="h-1.5 w-full rounded-full bg-[#232733]" />
                          </div>
                          <div className="flex-1 bg-[#181B23] rounded-md p-2 flex flex-col gap-1.5 border border-[#232733]">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-normal text-[#F2F3F5]">
                                Your dashboard
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="h-2 w-4 rounded bg-[#232733]" />
                                <span
                                  className="h-2 w-4 rounded"
                                  style={{ backgroundColor: accentColor }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 flex-1">
                              <div className="rounded bg-[#20242F] border border-[#232733]" />
                              <div className="rounded bg-[#20242F] border border-[#232733]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Radio Check + Label */}
                  <div className="flex items-center gap-2 px-0.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        selected
                          ? 'bg-discord-blurple text-discord-white'
                          : 'border border-discord-border-hover bg-discord-surface/40'
                      }`}
                    >
                      {selected && <MdIcon name="check" className="!text-[12px]" />}
                    </span>
                    <span
                      className={`text-xs font-normal ${
                        selected ? 'text-discord-white' : 'text-discord-text/90'
                      }`}
                    >
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SurfaceCard>

      {/* 1. Admin Role */}
      <SurfaceCard
        title="Admin Role"
        subtitle="Select a role that will be able to execute all commands and manage ArchiBot modules in your server."
        className="flex flex-col gap-4"
      >
        <MdSelect
          label="Administrator Role"
          value={adminRoleId}
          onChange={setAdminRoleId}
          options={adminRoleOptions}
        />
      </SurfaceCard>

      {/* 2. Language */}
      <SurfaceCard
        title="Language"
        subtitle="Choose one of the languages we offer for the best user experience."
        className="flex flex-col gap-4"
      >
        <MdSelect
          label="Bot Language"
          value={language}
          onChange={setLanguage}
          options={[
            {
              value: 'en',
              label: 'English',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23B22234"/><path d="M0,4.6h60M0,10.8h60M0,16.9h60M0,23.1h60M0,29.2h60M0,35.4h60" stroke="%23FFF" stroke-width="3.08"/><rect width="26" height="21.5" fill="%233C3B6E"/><g fill="%23FFF"><circle cx="4.5" cy="4" r="1.2"/><circle cx="10.2" cy="4" r="1.2"/><circle cx="15.8" cy="4" r="1.2"/><circle cx="21.5" cy="4" r="1.2"/><circle cx="7.3" cy="7.4" r="1.2"/><circle cx="13" cy="7.4" r="1.2"/><circle cx="18.7" cy="7.4" r="1.2"/><circle cx="4.5" cy="10.8" r="1.2"/><circle cx="10.2" cy="10.8" r="1.2"/><circle cx="15.8" cy="10.8" r="1.2"/><circle cx="21.5" cy="10.8" r="1.2"/><circle cx="7.3" cy="14.2" r="1.2"/><circle cx="13" cy="14.2" r="1.2"/><circle cx="18.7" cy="14.2" r="1.2"/><circle cx="4.5" cy="17.6" r="1.2"/><circle cx="10.2" cy="17.6" r="1.2"/><circle cx="15.8" cy="17.6" r="1.2"/><circle cx="21.5" cy="17.6" r="1.2"/></g></svg>',
            },
            {
              value: 'id',
              label: 'Bahasa Indonesia',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="20" fill="%23CE1126"/><rect y="20" width="60" height="20" fill="%23FFFFFF"/></svg>',
            },
            {
              value: 'es',
              label: 'Español (Spanyol)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23AA151B"/><rect y="10" width="60" height="20" fill="%23F1BF00"/><rect x="14" y="15" width="6" height="10" rx="2" fill="%23AA151B"/></svg>',
            },
            {
              value: 'fr',
              label: 'Français (Prancis)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="20" height="40" fill="%23002395"/><rect x="20" width="20" height="40" fill="%23FFFFFF"/><rect x="40" width="20" height="40" fill="%23ED2939"/></svg>',
            },
            {
              value: 'de',
              label: 'Deutsch (Jerman)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.33" fill="%23000000"/><rect y="13.33" width="60" height="13.33" fill="%23DD0000"/><rect y="26.66" width="60" height="13.34" fill="%23FFCE00"/></svg>',
            },
            {
              value: 'pt-BR',
              label: 'Português (Brasil)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23009B3A"/><polygon points="30,5 54,20 30,35 6,20" fill="%23FEDF00"/><circle cx="30" cy="20" r="8.5" fill="%23002776"/><path d="M22,18 Q30,15 38,21" stroke="%23FFFFFF" stroke-width="2" fill="none"/></svg>',
            },
            {
              value: 'pt-PT',
              label: 'Português (Portugal)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="24" height="40" fill="%23006600"/><rect x="24" width="36" height="40" fill="%23FF0000"/><circle cx="24" cy="20" r="7.5" fill="%23FFCC00"/><rect x="20.5" y="16.5" width="7" height="7" rx="1.5" fill="%23FFFFFF" stroke="%23FF0000" stroke-width="1.5"/></svg>',
            },
            {
              value: 'zh',
              label: '中文 (Mandarin)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23DE2910"/><circle cx="12" cy="12" r="5" fill="%23FFDE00"/><circle cx="22" cy="5" r="1.8" fill="%23FFDE00"/><circle cx="25" cy="9" r="1.8" fill="%23FFDE00"/><circle cx="25" cy="15" r="1.8" fill="%23FFDE00"/><circle cx="22" cy="19" r="1.8" fill="%23FFDE00"/></svg>',
            },
            {
              value: 'ja',
              label: '日本語 (Jepang)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23FFFFFF"/><circle cx="30" cy="20" r="11" fill="%23BC002D"/></svg>',
            },
            {
              value: 'ko',
              label: '한국어 (Korea)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23FFFFFF"/><circle cx="30" cy="20" r="9.5" fill="%23CD2E3A"/><path d="M20.5,20 A9.5,9.5 0 0,0 39.5,20 A4.75,4.75 0 0,0 30,20 A4.75,4.75 0 0,1 20.5,20 Z" fill="%230047A0"/><g stroke="%23000" stroke-width="1.6"><line x1="13" y1="8" x2="18" y2="14"/><line x1="42" y1="8" x2="47" y2="14"/><line x1="13" y1="32" x2="18" y2="26"/><line x1="42" y1="32" x2="47" y2="26"/></g></svg>',
            },
            {
              value: 'it',
              label: 'Italiano (Italia)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="20" height="40" fill="%23009246"/><rect x="20" width="20" height="40" fill="%23FFFFFF"/><rect x="40" width="20" height="40" fill="%23CE2B37"/></svg>',
            },
            {
              value: 'nl',
              label: 'Nederlands (Belanda)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.33" fill="%23AE1C28"/><rect y="13.33" width="60" height="13.33" fill="%23FFFFFF"/><rect y="26.66" width="60" height="13.34" fill="%2321468B"/></svg>',
            },
            {
              value: 'ru',
              label: 'Русский (Rusia)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.33" fill="%23FFFFFF"/><rect y="13.33" width="60" height="13.33" fill="%230039A6"/><rect y="26.66" width="60" height="13.34" fill="%23D52B1E"/></svg>',
            },
            {
              value: 'sv',
              label: 'Svenska (Swedia)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23006AA7"/><rect x="18" width="7" height="40" fill="%23FECC02"/><rect y="16.5" width="60" height="7" fill="%23FECC02"/></svg>',
            },
            {
              value: 'no',
              label: 'Norsk (Norwegia)',
              iconUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="%23BA0C2F"/><rect x="16" width="10" height="40" fill="%23FFFFFF"/><rect y="15" width="60" height="10" fill="%23FFFFFF"/><rect x="18.5" width="5" height="40" fill="%2300205B"/><rect y="17.5" width="60" height="5" fill="%2300205B"/></svg>',
            },
          ]}
        />
      </SurfaceCard>

      {/* 3. Customization */}
      <SurfaceCard
        title="Customization"
        subtitle="Customize ArchiBot's identity in your server and give its responses the look of your dreams."
        className="flex flex-col gap-5"
      >
        {/* Bot & Server Identity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MdTextField
            label="Bot Server Nickname"
            value={botNickname}
            onChange={setBotNickname}
            placeholder={serverInfo.botName || 'ArchiBot'}
            supportingText="Optional custom display nickname for ArchiBot in this server."
          />
          <MdTextField
            label="Server Name"
            value={serverName}
            onChange={setServerName}
            placeholder="Discord Server Name"
            supportingText="Public name of your Discord server (requires Manage Server)."
          />
        </div>

        <MdDivider />

        {/* General Message Footer */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-normal text-discord-white">General Message Footer</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MdTextField
              label="Footer Text"
              value={footerText}
              onChange={setFooterText}
              placeholder="ArchiBot • Server Architect"
            />
            <MdTextField
              label="Footer Icon URL"
              value={footerIconUrl}
              onChange={setFooterIconUrl}
              placeholder="https://example.com/icon.png"
            />
          </div>
        </div>

        {/* General Embed Color */}
        <div className="max-w-md">
          <ColorPickerField
            label="General Embed Color"
            value={embedColor}
            onChange={setEmbedColor}
          />
        </div>
      </SurfaceCard>

      {/* 4. Logging */}
      <SurfaceCard
        title="Logging"
        subtitle="Track general actions, member invites, and server boosts in dedicated channels."
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MdSelect
            label="Logging Channel"
            value={generalLogChannelId}
            onChange={setGeneralLogChannelId}
            options={textChannelOptions}
          />
          <MdSelect
            label="Invite Logs Channel"
            value={inviteLogChannelId}
            onChange={setInviteLogChannelId}
            options={textChannelOptions}
          />
          <MdSelect
            label="Booster Logs Channel"
            value={boosterLogChannelId}
            onChange={setBoosterLogChannelId}
            options={textChannelOptions}
          />
        </div>
        <p className="text-xs font-normal text-discord-muted">
          With no channel selected, events left on default will not be logged. This covers moderation actions, invite tracking, and server boosts.
        </p>
      </SurfaceCard>

      {/* 5. Access Control */}
      <SurfaceCard
        title="Access Control"
        subtitle="Grant dashboard and moderation access per role or member."
        headerAction={
          <MdSwitch
            checked={accessControlEnabled}
            onChange={setAccessControlEnabled}
          />
        }
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between text-xs font-normal">
          <span className="text-discord-white">Access Rules</span>
          <span className="text-discord-muted">{totalAccessRules}/10</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MdSelect
            label="Add Role Rule"
            value=""
            onChange={handleAddAccessRole}
            options={availableAccessRoleOptions}
            disabled={!accessControlEnabled || totalAccessRules >= 10}
          />
          <MdSelect
            label="Add Member Rule"
            value=""
            onChange={handleAddAccessMember}
            options={availableAccessMemberOptions}
            disabled={!accessControlEnabled || totalAccessRules >= 10}
          />
        </div>

        {totalAccessRules === 0 ? (
          <EmptyState
            icon="group"
            title="No rules yet"
            description="Pick a role or a member above to give them dashboard access."
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {accessRoleIds.map((rId) => {
              const roleObj = roles.find((r) => r.id === rId);
              return (
                <MdChip
                  key={`role-${rId}`}
                  variant="assist"
                  icon="close"
                  label={`Role: @${roleObj ? roleObj.name : rId}`}
                  onClick={() => handleRemoveAccessRole(rId)}
                />
              );
            })}
            {accessMemberIds.map((mId) => {
              const memObj = members.find((m) => m.id === mId);
              return (
                <MdChip
                  key={`mem-${mId}`}
                  variant="assist"
                  icon="close"
                  label={`Member: ${memObj ? `${memObj.displayName} (@${memObj.username})` : mId}`}
                  onClick={() => handleRemoveAccessMember(mId)}
                />
              );
            })}
          </div>
        )}
      </SurfaceCard>

      {/* 6. Server Protection */}
      <SurfaceCard
        title="Server Protection"
        subtitle="Configure automated chat protection against unauthorized invite links and message flooding."
        className="flex flex-col gap-3"
      >
        <SwitchRow
          label="Anti-Invite Protection"
          description="Automatically block unauthorized Discord server invite links posted by non-admins."
          checked={antiInvite}
          onChange={setAntiInvite}
        />
        <SwitchRow
          label="Anti-Spam Protection"
          description="Detect and prevent rapid message flooding in text channels."
          checked={antiSpam}
          onChange={setAntiSpam}
        />
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
