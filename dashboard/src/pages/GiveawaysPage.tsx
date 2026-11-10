import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ColorPickerField,
  ConfirmDialog,
  EmojiPickerField,
  EmptyState,
  ImageUploadBox,
  MdButton,
  MdChip,
  MdDialog,
  MdDivider,
  MdIcon,
  MdIconButton,
  MdSelect,
  MdTabs,
  MdTextField,
  PageHeader,
  SettingsSkeleton,
  StatusBadge,
  SurfaceCard,
  SwitchRow,
  toast,
  UnsavedChangesBar,
} from '../components/ui';
import { DiscordEmbedPreview } from '../components/features';
import { useServerSwitch } from '../components/layout';
import { useRealtime } from '../hooks/useRealtime';
import { ChannelItem, RoleItem } from '../types/api';

export interface GiveawayConfig {
  managerRoleId: string | null;
  pingRoleId: string | null;
  requiredRoleId: string | null;
  excludedRoleId: string | null;
  bypassRoleId: string | null;
  winnerRoleId: string | null;
  minAccountAgeDays: number;
  minServerDays: number;
  embedColor: string;
  footerText: string;
  embedThumbnailUrl?: string | null;
  embedImageUrl?: string | null;
  embedFooterIcon?: string | null;
  buttonLabel: string;
  buttonEmoji: string;
  buttonStyle: 'primary' | 'secondary' | 'success' | 'danger';
  showHost: boolean;
  dmWinners: boolean;
  logChannelId: string | null;
  multipliersEnabled: boolean;
  boosterRoleId: string | null;
  boosterMultiplier: number;
  claimInstructions: string;
}

export interface GiveawayItem {
  id: string;
  prize: string;
  description: string;
  channelId: string;
  channelName: string;
  messageId: string | null;
  winnerCount: number;
  hostId: string | null;
  hostName: string;
  requiredRoleId: string | null;
  winnerRoleId: string | null;
  status: 'active' | 'ended';
  createdAt: string;
  endsAt: string;
  endedAt: string | null;
  participantsCount: number;
  participants: string[];
  winners: string[];
}

export interface GiveawaySummary {
  activeCount: number;
  endedCount: number;
  totalParticipants: number;
  totalGiveaways: number;
}

export interface GiveawaysPageProps {
  mode?: 'management' | 'config';
}

const DEFAULT_CONFIG: GiveawayConfig = {
  managerRoleId: null,
  pingRoleId: null,
  requiredRoleId: null,
  excludedRoleId: null,
  bypassRoleId: null,
  winnerRoleId: null,
  minAccountAgeDays: 0,
  minServerDays: 0,
  embedColor: '#5865F2',
  footerText: 'ArchiBot Giveaways',
  embedThumbnailUrl: null,
  embedImageUrl: null,
  embedFooterIcon: null,
  buttonLabel: 'Participate ({count})',
  buttonEmoji: '🎉',
  buttonStyle: 'primary',
  showHost: true,
  dmWinners: true,
  logChannelId: null,
  multipliersEnabled: false,
  boosterRoleId: null,
  boosterMultiplier: 2,
  claimInstructions: 'Open a ticket or contact staff to claim your prize.',
};

const GIVEAWAY_TABS = [
  { id: 'management', label: 'Giveaway Management', icon: 'celebration' },
  { id: 'config', label: 'Default Configuration', icon: 'tune' },
];

const MULTIPLIER_OPTIONS = [
  { value: '2', label: '2x Entries (Double Chance)' },
  { value: '3', label: '3x Entries (Triple Chance)' },
  { value: '4', label: '4x Entries (4x Chance)' },
  { value: '5', label: '5x Entries (5x Chance)' },
  { value: '10', label: '10x Entries (10x Chance)' },
];

const DURATION_OPTIONS = [
  { value: '10', label: '10 Minutes', short: '10m' },
  { value: '30', label: '30 Minutes', short: '30m' },
  { value: '60', label: '1 Hour', short: '1h' },
  { value: '360', label: '6 Hours', short: '6h' },
  { value: '720', label: '12 Hours', short: '12h' },
  { value: '1440', label: '24 Hours (1 Day)', short: '1d' },
  { value: '4320', label: '3 Days', short: '3d' },
  { value: '10080', label: '7 Days (1 Week)', short: '7d' },
];

const QUICK_DURATION_PRESETS = [
  { value: '60', label: '1h' },
  { value: '360', label: '6h' },
  { value: '1440', label: '1d' },
  { value: '4320', label: '3d' },
  { value: '10080', label: '7d' },
];

const BUTTON_STYLE_OPTIONS = [
  { value: 'primary', label: 'Blurple (Primary)', color: '#5865F2' },
  { value: 'secondary', label: 'Gray (Secondary)', color: '#4E5058' },
  { value: 'success', label: 'Green (Success)', color: '#57F287' },
  { value: 'danger', label: 'Red (Danger)', color: '#ED4245' },
];

function formatRelativeTime(isoDate: string): string {
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return '—';
  const diffMs = target - Date.now();
  const absMins = Math.round(Math.abs(diffMs) / 60_000);

  if (absMins < 1) return diffMs >= 0 ? 'in <1m' : 'just now';
  if (absMins < 60) return diffMs >= 0 ? `in ${absMins}m` : `${absMins}m ago`;
  const hours = Math.round(absMins / 60);
  if (hours < 24) return diffMs >= 0 ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return diffMs >= 0 ? `in ${days}d` : `${days}d ago`;
}

function getButtonColorClasses(style: GiveawayConfig['buttonStyle']): string {
  switch (style) {
    case 'success':
      return 'bg-discord-green text-discord-canvas';
    case 'danger':
      return 'bg-discord-red text-white';
    case 'secondary':
      return 'bg-discord-surface border border-discord-border text-discord-white';
    default:
      return 'bg-discord-blurple text-white';
  }
}

export const GiveawaysPage: React.FC<GiveawaysPageProps> = ({ mode = 'management' }) => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { registerServerFetch } = useServerSwitch();

  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [botName, setBotName] = useState('ArchiBot');
  const [botAvatar, setBotAvatar] = useState<string | null>(null);

  // Management State
  const [giveaways, setGiveaways] = useState<GiveawayItem[]>([]);
  const [summary, setSummary] = useState<GiveawaySummary>({
    activeCount: 0,
    endedCount: 0,
    totalParticipants: 0,
    totalGiveaways: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [actingId, setActingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GiveawayItem | null>(null);

  // Create Giveaway Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPrize, setNewPrize] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [newDuration, setNewDuration] = useState('1440');
  const [newWinnerCount, setNewWinnerCount] = useState('1');
  const [newRequiredRoleId, setNewRequiredRoleId] = useState('');
  const [newWinnerRoleId, setNewWinnerRoleId] = useState('');

  // Configuration State
  const [config, setConfig] = useState<GiveawayConfig>(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] = useState<GiveawayConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.botTag) setBotName(String(d.botTag).split('#')[0]);
        if (d.botAvatar) setBotAvatar(d.botAvatar);
      })
      .catch(() => {});
  }, []);

  const fetchGiveawayData = useCallback(
    (silent = false) => {
      if (!guildId) return;
      if (!silent) setLoading(true);

      const p = Promise.all([
        fetch(`/api/guilds/${guildId}/giveaways`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' }).then((r) => r.json()),
      ])
        .then(([gwData, chanData, roleData]) => {
          if (gwData.config) {
            const loadedCfg: GiveawayConfig = {
              ...DEFAULT_CONFIG,
              ...gwData.config,
              buttonLabel:
                gwData.config.buttonLabel === 'Participate' || !gwData.config.buttonLabel
                  ? 'Participate ({count})'
                  : gwData.config.buttonLabel,
            };
            setConfig(loadedCfg);
            setSavedConfig(loadedCfg);
            if (!silent) {
              setNewRequiredRoleId(loadedCfg.requiredRoleId || '');
              setNewWinnerRoleId(loadedCfg.winnerRoleId || '');
            }
          }
          if (Array.isArray(gwData.giveaways)) {
            setGiveaways(gwData.giveaways);
          }
          if (gwData.summary) {
            setSummary(gwData.summary);
          }
          if (chanData.channels) {
            const textChans = chanData.channels.filter((c: ChannelItem) => c.typeName === 'text');
            setChannels(textChans);
            setNewChannelId((prev) => prev || textChans[0]?.id || '');
          }
          if (roleData.roles) {
            setRoles(roleData.roles);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          if (!silent) setLoading(false);
        });

      if (!silent) {
        registerServerFetch(p);
      }
    },
    [guildId, registerServerFetch]
  );

  useEffect(() => {
    fetchGiveawayData(false);
  }, [fetchGiveawayData]);

  // Real-time updates when participants join or giveaways end
  useRealtime(guildId, (msg) => {
    if (msg.event === 'GIVEAWAY_UPDATE') {
      fetchGiveawayData(true);
    }
  });

  const sortedChannels = useMemo(
    () => [...channels].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [channels]
  );

  const channelOptions = useMemo(
    () => [
      { value: '', label: 'None (Disabled)' },
      ...sortedChannels.map((c) => ({ value: c.id, label: `#${c.name}` })),
    ],
    [sortedChannels]
  );

  const targetChannelOptions = useMemo(
    () => [
      { value: '', label: 'Select a text channel...' },
      ...sortedChannels.map((c) => ({ value: c.id, label: `#${c.name}` })),
    ],
    [sortedChannels]
  );

  const sortedRoles = useMemo(
    () =>
      roles
        .filter((r) => !r.isEveryone)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [roles]
  );

  const assignableRoles = useMemo(
    () => sortedRoles.filter((r) => !r.managed && r.editable),
    [sortedRoles]
  );

  const roleOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...sortedRoles.map((r) => ({
        value: r.id,
        label: r.name,
        color: r.color && r.color !== '#000000' ? r.color : '#80848e',
      })),
    ],
    [sortedRoles]
  );

  const rewardRoleOptions = useMemo(
    () => [
      { value: '', label: 'None (No reward role)' },
      ...assignableRoles.map((r) => ({
        value: r.id,
        label: r.name,
        color: r.color && r.color !== '#000000' ? r.color : '#80848e',
      })),
    ],
    [assignableRoles]
  );

  const getRoleName = useCallback(
    (roleId: string | null | undefined) => {
      if (!roleId) return null;
      return roles.find((r) => r.id === roleId)?.name || null;
    },
    [roles]
  );

  const getChannelName = useCallback(
    (chanId: string | null | undefined) => {
      if (!chanId) return null;
      return channels.find((c) => c.id === chanId)?.name || null;
    },
    [channels]
  );

  const filteredGiveaways = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return giveaways.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (!q) return true;
      return (
        g.prize.toLowerCase().includes(q) ||
        g.channelName.toLowerCase().includes(q) ||
        g.hostName.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
      );
    });
  }, [giveaways, searchQuery, statusFilter]);

  const isConfigDirty = useMemo(() => {
    if (!savedConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(savedConfig);
  }, [config, savedConfig]);

  const handleResetConfig = () => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  };

  const handleSaveConfig = async () => {
    if (!guildId) return;
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/giveaways/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSavedConfig(data.config || config);
        toast.success(data.message || 'Giveaway configuration saved.');
      } else {
        toast.error(data.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateGiveaway = async () => {
    if (!guildId) return;
    if (!newPrize.trim()) {
      toast.error('Please enter a prize for the giveaway.');
      return;
    }
    if (!newChannelId) {
      toast.error('Please select a channel to post the giveaway.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/giveaways`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prize: newPrize.trim(),
          description: newDescription.trim(),
          channelId: newChannelId,
          durationMinutes: Number.parseInt(newDuration, 10) || 60,
          winnerCount: Math.max(1, Number.parseInt(newWinnerCount, 10) || 1),
          requiredRoleId: newRequiredRoleId || null,
          winnerRoleId: newWinnerRoleId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Giveaway launched to Discord!');
        setNewPrize('');
        setNewDescription('');
        fetchGiveawayData(true);
      } else {
        toast.error(data.error || 'Failed to create giveaway.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleEndGiveaway = async (giveawayId: string) => {
    if (!guildId) return;
    setActingId(giveawayId);
    try {
      const res = await fetch(`/api/guilds/${guildId}/giveaways/${giveawayId}/end`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Giveaway ended!');
        fetchGiveawayData(true);
      } else {
        toast.error(data.error || 'Failed to end giveaway.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setActingId(null);
    }
  };

  const handleRerollGiveaway = async (giveawayId: string) => {
    if (!guildId) return;
    setActingId(giveawayId);
    try {
      const res = await fetch(`/api/guilds/${guildId}/giveaways/${giveawayId}/reroll`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Giveaway rerolled!');
        fetchGiveawayData(true);
      } else {
        toast.error(data.error || 'Failed to reroll giveaway.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setActingId(null);
    }
  };

  const handleDeleteGiveaway = async () => {
    if (!guildId || !deleteTarget) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/giveaways/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Giveaway deleted.');
        setDeleteTarget(null);
        fetchGiveawayData(true);
      } else {
        toast.error(data.error || 'Failed to delete giveaway.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleTabChange = useCallback(
    (index: number) => {
      if (index === 0) {
        navigate(`/guilds/${guildId}/giveaways`);
      } else {
        navigate(`/guilds/${guildId}/giveaways/config`);
      }
    },
    [guildId, navigate]
  );

  if (loading && giveaways.length === 0 && channels.length === 0) {
    return <SettingsSkeleton />;
  }

  const buttonColorClass = getButtonColorClasses(config.buttonStyle);
  const pingRoleName = getRoleName(config.pingRoleId);

  // Build Live Discord Embed Preview helper
  const renderGiveawayPreview = (opts: {
    prize: string;
    description?: string;
    durationLabel: string;
    winnersCount: number;
    entriesCount: number;
    reqRoleId: string | null;
    rewardRoleId: string | null;
  }) => {
    const reqName = getRoleName(opts.reqRoleId);
    const rewardName = getRoleName(opts.rewardRoleId);

    const descLines: string[] = [];
    if (opts.description?.trim()) {
      descLines.push(opts.description.trim(), '');
    }
    descLines.push('Click the button below to enter this giveaway!', '');
    descLines.push(`Ends: ${opts.durationLabel}`);
    descLines.push(`Winners: ${opts.winnersCount}`);
    descLines.push(`Entries: ${opts.entriesCount}`);
    if (config.showHost) {
      descLines.push('Hosted by: @ServerAdmin');
    }
    if (reqName) {
      descLines.push(`Required Role: @${reqName}`);
    }
    if (rewardName) {
      descLines.push(`Winner Reward Role: @${rewardName}`);
    }
    if (config.dmWinners && config.claimInstructions) {
      descLines.push(`Claim Note: ${config.claimInstructions}`);
    }

    return (
      <DiscordEmbedPreview
        botName={botName}
        botAvatar={botAvatar}
        content={pingRoleName ? `@${pingRoleName}` : undefined}
        embed={{
          title: `🎉 ${opts.prize || 'Discord Nitro 1 Month'}`,
          description: descLines.join('\n'),
          color: config.embedColor || '#5865F2',
          thumbnailUrl: config.embedThumbnailUrl || undefined,
          imageUrl: config.embedImageUrl || undefined,
          footerText: `${config.footerText || 'ArchiBot Giveaways'} • ID: preview`,
          footerIcon: config.embedFooterIcon || undefined,
          timestamp: true,
        }}
        componentsSlot={
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-normal select-none shadow-sm ${buttonColorClass}`}
          >
            {config.buttonEmoji && <span>{config.buttonEmoji}</span>}
            <span>
              {(config.buttonLabel || 'Participate ({count})').replaceAll(
                '{count}',
                String(opts.entriesCount)
              )}
            </span>
          </span>
        }
      />
    );
  };

  // ============================================================================
  // VIEW 1: GIVEAWAY CONFIGURATION (Matches Tickety layout)
  // ============================================================================
  if (mode === 'config') {
    return (
      <div className="flex flex-col gap-6 w-full pb-16">
        <PageHeader
          title="Giveaway Configuration"
          description="Configure the giveaway system to make it truly yours."
        />

        {/* Top Tab Bar: Giveaway Management | Default Configuration */}
        <MdTabs
          tabs={GIVEAWAY_TABS}
          activeIndex={1}
          onChange={handleTabChange}
        />

        {/* 1. Who Can Create Giveaways */}
        <SurfaceCard
          title="Who Can Create Giveaways"
          subtitle="Members with Manage Server or Administrator permissions can always create and host giveaways. Select a manager role for staff who do not have these permissions."
          className="flex flex-col gap-4"
        >
          <div className="max-w-md">
            <MdSelect
              label="Giveaway Manager Role"
              value={config.managerRoleId || ''}
              onChange={(val) => setConfig((prev) => ({ ...prev, managerRoleId: val || null }))}
              options={roleOptions}
            />
          </div>
        </SurfaceCard>

        {/* 2. Role Multipliers */}
        <SurfaceCard
          title="Role Multipliers"
          subtitle="Give members extra entry chances or tickets based on their server roles (e.g., Server Boosters or VIPs)."
          className="flex flex-col gap-5"
        >
          <SwitchRow
            label="Enable Role Multipliers"
            description="Grant extra ticket weight in giveaway drawings to members who boost or hold designated roles."
            checked={config.multipliersEnabled}
            onChange={(val) => setConfig((prev) => ({ ...prev, multipliersEnabled: val }))}
          />

          {config.multipliersEnabled && (
            <div className="pt-2 border-t border-discord-border flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <MdSelect
                    label="Multiplier Role"
                    value={config.boosterRoleId || ''}
                    onChange={(val) => setConfig((prev) => ({ ...prev, boosterRoleId: val || null }))}
                    options={roleOptions}
                  />
                  <span className="text-xs font-normal text-discord-muted px-1">
                    Select a VIP or booster role (Discord Nitro Boosters get boosted automatically).
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <MdSelect
                    label="Entry Multiplier"
                    value={String(config.boosterMultiplier || 2)}
                    onChange={(val) =>
                      setConfig((prev) => ({
                        ...prev,
                        boosterMultiplier: Math.max(1, Number.parseInt(val, 10) || 2),
                      }))
                    }
                    options={MULTIPLIER_OPTIONS}
                  />
                  <span className="text-xs font-normal text-discord-muted px-1">
                    Multiplies how many tickets are entered into the draw per member.
                  </span>
                </div>
              </div>
            </div>
          )}
        </SurfaceCard>

        {/* 3. Entry Requirements & Winner Rewards */}
        <SurfaceCard
          title="Entry Requirements"
          subtitle="Set default conditions, roles, and minimum account age required to enter giveaways."
          className="flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <MdSelect
                label="Required Role"
                value={config.requiredRoleId || ''}
                onChange={(val) => setConfig((prev) => ({ ...prev, requiredRoleId: val || null }))}
                options={roleOptions}
              />
              <span className="text-xs font-normal text-discord-muted px-1">
                Members must hold this role to enter (e.g. @Verified or @Community).
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <MdSelect
                label="Blocked / Excluded Role"
                value={config.excludedRoleId || ''}
                onChange={(val) => setConfig((prev) => ({ ...prev, excludedRoleId: val || null }))}
                options={roleOptions}
              />
              <span className="text-xs font-normal text-discord-muted px-1">
                Members with this role are blocked from joining giveaways.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <MdSelect
                label="Bypass Role"
                value={config.bypassRoleId || ''}
                onChange={(val) => setConfig((prev) => ({ ...prev, bypassRoleId: val || null }))}
                options={roleOptions}
              />
              <span className="text-xs font-normal text-discord-muted px-1">
                Members with this role can join even without the Required Role (e.g. @VIP).
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <MdSelect
                label="Winner Reward Role"
                value={config.winnerRoleId || ''}
                onChange={(val) => setConfig((prev) => ({ ...prev, winnerRoleId: val || null }))}
                options={rewardRoleOptions}
              />
              <span className="text-xs font-normal text-discord-muted px-1">
                Automatically granted to winners when a giveaway ends.
              </span>
            </div>
          </div>

          <MdDivider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MdTextField
              label="Minimum Account Age (Days)"
              type="number"
              value={String(config.minAccountAgeDays)}
              onChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  minAccountAgeDays: Math.max(0, Number.parseInt(val, 10) || 0),
                }))
              }
              supportingText="Blocks brand-new Discord alt accounts from entering (0 = disabled)."
            />
            <MdTextField
              label="Minimum Time in Server (Days)"
              type="number"
              value={String(config.minServerDays)}
              onChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  minServerDays: Math.max(0, Number.parseInt(val, 10) || 0),
                }))
              }
              supportingText="Requires members to stay in the server before joining (0 = disabled)."
            />
          </div>
        </SurfaceCard>

        {/* 4. Winner Notifications */}
        <SurfaceCard
          title="Winner Notifications"
          subtitle="Send automatic congratulatory direct messages and claim instructions to winners."
          className="flex flex-col gap-5"
        >
          <SwitchRow
            label="DM Winners Automatically"
            description="Send a direct message congratulating winners with a link to the giveaway channel when they win."
            checked={config.dmWinners}
            onChange={(val) => setConfig((prev) => ({ ...prev, dmWinners: val }))}
          />

          {config.dmWinners && (
            <div className="pt-2 border-t border-discord-border">
              <MdTextField
                label="Winner Instructions & Claim Note"
                value={config.claimInstructions || ''}
                onChange={(val) => setConfig((prev) => ({ ...prev, claimInstructions: val }))}
                placeholder="Open a ticket or contact staff to claim your prize."
                supportingText="Sent directly in the winner's Discord DM and included in the giveaway conclusion announcement."
              />
            </div>
          )}
        </SurfaceCard>

        {/* 6. Giveaway Embed & Live Discord Preview */}
        <SurfaceCard
          title="Giveaway Embed"
          subtitle="Customize the appearance of the giveaway embed."
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Controls */}
            <div className="xl:col-span-7 flex flex-col gap-5">
              {/* Embed Color Row */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-normal text-discord-white">Embed Color</span>
                <div className="flex items-center gap-3">
                  {/* Pick Color Button with overlay native color input */}
                  <div className="relative inline-flex items-center">
                    <MdButton
                      variant="tonal"
                      icon="palette"
                    >
                      Pick Color
                    </MdButton>
                    <input
                      type="color"
                      value={config.embedColor || '#5865F2'}
                      onChange={(e) => setConfig((prev) => ({ ...prev, embedColor: e.target.value }))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      title="Choose embed color"
                    />
                  </div>

                  {/* Color preview bar with overlay native color input */}
                  <div
                    className="relative flex-1 h-10 rounded-xl cursor-pointer transition-all hover:opacity-90 shadow-sm border border-discord-border select-none"
                    style={{ backgroundColor: config.embedColor || '#5865F2' }}
                    title={`Selected color: ${config.embedColor || '#5865F2'} (Click to change)`}
                  >
                    <input
                      type="color"
                      value={config.embedColor || '#5865F2'}
                      onChange={(e) => setConfig((prev) => ({ ...prev, embedColor: e.target.value }))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 rounded-xl"
                      title="Choose embed color"
                    />
                  </div>
                </div>
              </div>

              {/* Embed Thumbnail & Embed Image Row */}
              <div className="flex items-start gap-10 pt-1">
                <ImageUploadBox
                  label="Embed Thumbnail"
                  tooltip="Small thumbnail image displayed at the top right of the embed."
                  value={config.embedThumbnailUrl}
                  onChange={(val) => setConfig((prev) => ({ ...prev, embedThumbnailUrl: val || null }))}
                />
                <ImageUploadBox
                  label="Embed Image"
                  tooltip="Large banner image displayed at the bottom of the embed."
                  value={config.embedImageUrl}
                  onChange={(val) => setConfig((prev) => ({ ...prev, embedImageUrl: val || null }))}
                />
              </div>

              {/* Embed Footer Section */}
              <div className="flex flex-col gap-2 pt-2 border-t border-discord-border">
                <span className="text-xs font-normal text-discord-white">Embed Footer</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-[220px] sm:max-w-[72%]">
                    <MdTextField
                      label="Text"
                      value={config.footerText}
                      onChange={(val) => setConfig((prev) => ({ ...prev, footerText: val }))}
                      placeholder="ArchiBot Giveaways"
                    />
                  </div>
                  <ImageUploadBox
                    label="Icon"
                    size="sm"
                    floatingLabel
                    tooltip="Small icon displayed next to the footer text."
                    value={config.embedFooterIcon}
                    onChange={(val) => setConfig((prev) => ({ ...prev, embedFooterIcon: val || null }))}
                  />
                </div>
              </div>

              <MdDivider />

              <SwitchRow
                label="Display Host in Embed"
                description="Show which admin or manager hosted the giveaway inside the Discord embed."
                checked={config.showHost}
                onChange={(val) => setConfig((prev) => ({ ...prev, showHost: val }))}
              />
            </div>

            {/* Right Live Preview */}
            <div className="xl:col-span-5 flex flex-col gap-2">
              <span className="text-xs font-normal text-discord-muted">Live Discord Preview</span>
              {renderGiveawayPreview({
                prize: 'Discord Nitro 1 Month',
                description: 'Celebrate our community milestone by joining this giveaway!',
                durationLabel: 'in 24 hours',
                winnersCount: 1,
                entriesCount: 18,
                reqRoleId: config.requiredRoleId,
                rewardRoleId: config.winnerRoleId,
              })}
            </div>
          </div>
        </SurfaceCard>

        {/* 6. Participate Button */}
        <SurfaceCard
          title="Participate Button"
          subtitle="Modify the giveaway participation button."
          className="flex flex-col gap-5"
        >
          {/* Form Controls Row: Emoji (Emoticon Menu) | Label (50% width) | Color */}
          <div className="flex flex-wrap items-start gap-4">
            {/* Emoji (Restored to Emoticon Menu) */}
            <div className="w-24 sm:w-28 shrink-0">
              <EmojiPickerField
                label="Emoji"
                value={config.buttonEmoji}
                onChange={(emoji) => setConfig((prev) => ({ ...prev, buttonEmoji: emoji }))}
              />
            </div>

            {/* Label (50% width) */}
            <div className="flex-1 min-w-[240px] sm:max-w-[50%]">
              <MdTextField
                label="Label"
                value={config.buttonLabel}
                onChange={(val) => setConfig((prev) => ({ ...prev, buttonLabel: val }))}
                placeholder="Participate ({count})"
              />
            </div>

            {/* Color (Material Outlined Box matching input style with floating label) */}
            <div className="relative w-fit shrink-0 group">
              <span className="absolute -top-2 left-3 px-1 bg-discord-card text-[11px] font-normal text-discord-muted select-none pointer-events-none z-10 transition-colors group-hover:text-discord-text group-focus-within:text-discord-blurple">
                Color
              </span>
              <div className="h-14 px-4 rounded-lg border border-[var(--md-sys-color-outline)] group-hover:border-[var(--md-sys-color-on-surface)] group-focus-within:border-discord-blurple transition-colors flex items-center justify-center gap-3.5">
                {[
                  { id: 'primary', color: '#5865F2', label: 'Blurple' },
                  { id: 'secondary', color: '#4E5058', label: 'Gray' },
                  { id: 'success', color: '#57F287', label: 'Green' },
                  { id: 'danger', color: '#ED4245', label: 'Red' },
                ].map((c) => {
                  const isSelected = config.buttonStyle === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          buttonStyle: c.id as GiveawayConfig['buttonStyle'],
                        }))
                      }
                      className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-discord-white ring-offset-2 ring-offset-discord-card scale-110 shadow-sm'
                          : 'opacity-70 hover:opacity-100 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.color }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview Row */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-normal text-discord-muted">Preview</span>
            <div className="flex items-center">
              <button
                type="button"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-normal shadow-sm select-none cursor-default transition-all ${buttonColorClass}`}
              >
                {config.buttonEmoji && <span className="text-sm">{config.buttonEmoji}</span>}
                <span>{config.buttonLabel || 'Participate ({count})'}</span>
              </button>
            </div>
          </div>
        </SurfaceCard>

        {/* 8. Ping Configuration & Logging */}
        <SurfaceCard
          title="Ping Configuration & Logging"
          subtitle="Configure announcement role mentions and audit logging channels for giveaway lifecycle events."
          className="flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <MdSelect
                label="Announcement Ping Role"
                value={config.pingRoleId || ''}
                onChange={(val) => setConfig((prev) => ({ ...prev, pingRoleId: val || null }))}
                options={roleOptions}
              />
              <span className="text-xs font-normal text-discord-muted px-1">
                Mentioned above the embed when a giveaway is launched.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <MdSelect
                label="Giveaway Log Channel"
                value={config.logChannelId || ''}
                onChange={(val) => setConfig((prev) => ({ ...prev, logChannelId: val || null }))}
                options={channelOptions}
              />
              <span className="text-xs font-normal text-discord-muted px-1">
                Receives audit logs when giveaways start, end, or reroll.
              </span>
            </div>
          </div>
        </SurfaceCard>

        <UnsavedChangesBar
          show={isConfigDirty}
          onReset={handleResetConfig}
          onSave={handleSaveConfig}
          saving={savingConfig}
        />
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: GIVEAWAY MANAGEMENT
  // ============================================================================
  const kpiCards = [
    {
      icon: 'insights',
      label: 'ACTIVE',
      value: summary.activeCount,
      subtext: 'Currently accepting entries',
    },
    {
      icon: 'task_alt',
      label: 'ENDED',
      value: summary.endedCount,
      subtext: 'Completed giveaways',
    },
    {
      icon: 'group',
      label: 'PARTICIPANTS',
      value: summary.totalParticipants,
      subtext: 'Total joined entries',
    },
    {
      icon: 'calendar_today',
      label: 'ALL GIVEAWAYS',
      value: summary.totalGiveaways,
      subtext: 'Across this server',
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      <PageHeader
        title="Giveaway Management"
        description="Browse and manage your server's active and ended giveaways."
        actions={
          <MdButton
            variant="filled"
            size="sm"
            icon="add"
            onClick={() => setCreateOpen(true)}
          >
            Create New Giveaway
          </MdButton>
        }
      />

      {/* Top Tab Bar: Giveaway Management | Default Configuration */}
      <MdTabs
        tabs={GIVEAWAY_TABS}
        activeIndex={0}
        onChange={handleTabChange}
      />

      {/* 1. Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <SurfaceCard key={kpi.label} className="flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-discord-surface border border-discord-border flex items-center justify-center text-discord-muted shrink-0">
                <MdIcon name={kpi.icon} className="text-lg text-discord-muted" />
              </div>
              <span className="text-xs font-normal text-discord-muted truncate">
                {kpi.label}
              </span>
            </div>

            <div className="text-xl font-normal text-discord-white mt-3.5 tracking-tight">
              {kpi.value}
            </div>

            <div className="text-xs font-normal text-discord-muted mt-1 truncate">
              {kpi.subtext}
            </div>
          </SurfaceCard>
        ))}
      </div>

      {/* 2. Giveaways Filter & List Card */}
      <SurfaceCard className="flex flex-col gap-4">
        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <MdTextField
              label="Search"
              placeholder="Search prize, channel, host, or ID..."
              value={searchQuery}
              onChange={setSearchQuery}
              debounceMs={250}
              icon="search"
            />
          </div>
          <div className="w-full sm:w-56 shrink-0">
            <MdSelect
              label="Status"
              value={statusFilter}
              onChange={(val) => setStatusFilter((val as 'all' | 'active' | 'ended') || 'all')}
              options={[
                { value: 'all', label: 'All Giveaways' },
                { value: 'active', label: 'Active' },
                { value: 'ended', label: 'Ended' },
              ]}
            />
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-2 py-2 text-xs font-normal text-discord-muted border-b border-discord-border">
          <div className="col-span-4">Prize</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Host / Channel</div>
          <div className="col-span-2">End / Created</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Giveaways Rows or Empty State */}
        {filteredGiveaways.length === 0 ? (
          <EmptyState
            icon="redeem"
            title="No Giveaways Yet"
            description="Create your first giveaway and it shows up here with its entries."
            className="min-h-[340px] py-24 sm:py-28"
          />
        ) : (
          <div className="flex flex-col">
            {filteredGiveaways.map((g, idx) => (
              <React.Fragment key={g.id}>
                {idx > 0 && <MdDivider />}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-2 py-3.5">
                  {/* Prize Column */}
                  <div className="md:col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-discord-white truncate">
                        {g.prize}
                      </span>
                      <span className="text-[11px] font-normal text-discord-muted">
                        #{g.id}
                      </span>
                    </div>
                    <div className="text-xs font-normal text-discord-muted mt-0.5 truncate">
                      {g.winnerCount} {g.winnerCount === 1 ? 'winner' : 'winners'} • {g.participantsCount}{' '}
                      {g.participantsCount === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>

                  {/* Status Column */}
                  <div className="md:col-span-2 flex items-center">
                    <StatusBadge
                      size="sm"
                      tone={g.status === 'active' ? 'green' : 'neutral'}
                      label={g.status === 'active' ? 'Active' : 'Ended'}
                    />
                  </div>

                  {/* Host / Channel Column */}
                  <div className="md:col-span-3 min-w-0">
                    <div className="text-xs font-normal text-discord-white truncate">
                      #{g.channelName}
                    </div>
                    <div className="text-xs font-normal text-discord-muted mt-0.5 truncate">
                      Hosted by {g.hostName}
                    </div>
                  </div>

                  {/* End / Created Column */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="text-xs font-normal text-discord-white truncate">
                      {g.status === 'active'
                        ? `Ends ${formatRelativeTime(g.endsAt)}`
                        : `Ended ${formatRelativeTime(g.endedAt || g.endsAt)}`}
                    </div>
                    <div className="text-xs font-normal text-discord-muted mt-0.5 truncate">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="md:col-span-1 flex items-center justify-end gap-1.5 shrink-0">
                    {g.status === 'active' ? (
                      <MdButton
                        variant="tonal"
                        size="xs"
                        icon="stop_circle"
                        loading={actingId === g.id}
                        onClick={() => handleEndGiveaway(g.id)}
                      >
                        End
                      </MdButton>
                    ) : (
                      <MdButton
                        variant="tonal"
                        size="xs"
                        icon="casino"
                        disabled={g.participantsCount === 0}
                        loading={actingId === g.id}
                        onClick={() => handleRerollGiveaway(g.id)}
                      >
                        Reroll
                      </MdButton>
                    )}
                    <MdIconButton
                      icon="delete"
                      title="Delete Giveaway"
                      onClick={() => setDeleteTarget(g)}
                    />
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </SurfaceCard>

      {/* Create New Giveaway Modal Dialog */}
      <MdDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        headline="Create New Giveaway"
        actions={
          <>
            <MdButton variant="text" onClick={() => setCreateOpen(false)}>
              Cancel
            </MdButton>
            <MdButton
              variant="filled"
              icon="celebration"
              loading={creating}
              disabled={!newPrize.trim() || !newChannelId}
              onClick={handleCreateGiveaway}
            >
              Launch Giveaway
            </MdButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 min-w-[300px] sm:min-w-[440px] pt-2">
          <MdTextField
            label="Prize"
            placeholder="e.g. Discord Nitro 1 Month"
            value={newPrize}
            onChange={setNewPrize}
          />

          <MdSelect
            label="Announcement Channel"
            value={newChannelId}
            onChange={setNewChannelId}
            options={targetChannelOptions}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MdSelect
              label="Duration"
              value={newDuration}
              onChange={setNewDuration}
              options={DURATION_OPTIONS}
            />
            <MdTextField
              label="Number of Winners"
              type="number"
              value={newWinnerCount}
              onChange={setNewWinnerCount}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MdSelect
              label="Required Role (Optional)"
              value={newRequiredRoleId}
              onChange={setNewRequiredRoleId}
              options={roleOptions}
            />
            <MdSelect
              label="Winner Reward Role (Optional)"
              value={newWinnerRoleId}
              onChange={setNewWinnerRoleId}
              options={rewardRoleOptions}
            />
          </div>

          <MdTextField
            label="Description (Optional)"
            type="textarea"
            rows={3}
            placeholder="Add extra rules or details about the prize..."
            value={newDescription}
            onChange={setNewDescription}
          />
        </div>
      </MdDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Giveaway"
        message={
          deleteTarget
            ? `Are you sure you want to delete the "${deleteTarget.prize}" giveaway? This will also remove its giveaway message from Discord if still present.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteGiveaway}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
