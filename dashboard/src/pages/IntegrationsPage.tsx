import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  MdButton,
  MdChip,
  MdDialog,
  MdDivider,
  MdIcon,
  MdIconButton,
  MdSelect,
  MdTabs,
  MdTextField,
  MembersSkeleton,
  PageHeader,
  SectionHeader,
  StatusBadge,
  SurfaceCard,
  SwitchRow,
  toast,
} from '../components/ui';
import { useServerSwitch } from '../components/layout';

interface BotRoleItem {
  id: string;
  name: string;
  color: string | null;
  managed?: boolean;
}

interface BotIntegrationItem {
  id: string;
  username: string;
  displayName: string;
  nickname: string | null;
  avatar: string;
  joinedAt: number | null;
  isSelf: boolean;
  status: string;
  category: 'core' | 'music' | 'gaming' | 'economy' | 'moderation' | 'utility';
  prefix: string;
  notes: string;
  allowedChannelIds: string[];
  blockedChannelIds: string[];
  isSandboxed: boolean;
  roles: BotRoleItem[];
  isAdmin: boolean;
  riskLevel: 'high' | 'medium' | 'safe';
  dangerousPermissions: string[];
}

interface ChannelOption {
  id: string;
  name: string;
  type: 'text' | 'voice';
  parentName: string | null;
}

interface RecommendedBotItem {
  id: string;
  name: string;
  category: string;
  prefix: string;
  badge: string;
  description: string;
  recommendedChannel: string;
  inviteUrl: string;
  commands: string[];
}

interface BotPresetItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  channelsPreview: string[];
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: string; tone: 'blurple' | 'green' | 'yellow' | 'red' | 'premium' | 'neutral' }
> = {
  core: { label: 'Core Engine', icon: 'verified', tone: 'blurple' },
  music: { label: 'Music & Lofi', icon: 'headphones', tone: 'premium' },
  gaming: { label: 'Minigame & Gacha', icon: 'sports_esports', tone: 'green' },
  economy: { label: 'Economy & Grinding', icon: 'monetization_on', tone: 'yellow' },
  moderation: { label: 'Moderation & Security', icon: 'shield', tone: 'blurple' },
  utility: { label: 'Utility & Automation', icon: 'smart_toy', tone: 'neutral' },
};

export const IntegrationsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<BotIntegrationItem[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<BotRoleItem[]>([]);
  const [recommendedBots, setRecommendedBots] = useState<RecommendedBotItem[]>([]);
  const [presets, setPresets] = useState<BotPresetItem[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [discoveryCategory, setDiscoveryCategory] = useState<string>('all');

  // Manage Bot Modal
  const [editingBot, setEditingBot] = useState<BotIntegrationItem | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editCategory, setEditCategory] = useState('utility');
  const [editPrefix, setEditPrefix] = useState('/');
  const [editNotes, setEditNotes] = useState('');
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [savingBot, setSavingBot] = useState(false);

  // Channel Sandbox Modal
  const [sandboxBot, setSandboxBot] = useState<BotIntegrationItem | null>(null);
  const [sandboxAllowedIds, setSandboxAllowedIds] = useState<string[]>([]);
  const [sandboxBlockedIds, setSandboxBlockedIds] = useState<string[]>([]);
  const [restrictOtherText, setRestrictOtherText] = useState(false);
  const [channelSearch, setChannelSearch] = useState('');
  const [savingSandbox, setSavingSandbox] = useState(false);

  // Publish Bot Directory Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [guideChannelId, setGuideChannelId] = useState('');
  const [guideTitle, setGuideTitle] = useState('');
  const [guideDescription, setGuideDescription] = useState(
    'Use the designated channels and command prefixes below when interacting with bots in our server.'
  );
  const [publishingGuide, setPublishingGuide] = useState(false);

  // Preset & Remove Bot State
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  const [kickBotTarget, setKickBotTarget] = useState<BotIntegrationItem | null>(null);

  const fetchIntegrations = () => {
    if (!guildId) return;
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/integrations`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.bots)) setBots(data.bots);
        if (Array.isArray(data.channels)) {
          setChannels(data.channels);
          const firstText = data.channels.find((c: ChannelOption) => c.type === 'text');
          if (firstText && !guideChannelId) setGuideChannelId(firstText.id);
        }
        if (Array.isArray(data.assignableRoles)) setAssignableRoles(data.assignableRoles);
        if (Array.isArray(data.recommendedBots)) setRecommendedBots(data.recommendedBots);
        if (Array.isArray(data.presets)) setPresets(data.presets);
      })
      .catch(() => {
        toast.error('Could not load server bot integrations.');
      })
      .finally(() => setLoading(false));

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchIntegrations();
  }, [guildId]);

  const filteredBots = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bots.filter((b) => {
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        b.displayName.toLowerCase().includes(q) ||
        b.username.toLowerCase().includes(q) ||
        b.prefix.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q)
      );
    });
  }, [bots, search, categoryFilter]);

  const filteredDiscovery = useMemo(() => {
    return recommendedBots.filter((item) => {
      if (discoveryCategory !== 'all' && item.category !== discoveryCategory) return false;
      return true;
    });
  }, [recommendedBots, discoveryCategory]);

  const stats = useMemo(() => {
    const thirdPartyCount = bots.filter((b) => !b.isSelf).length;
    const highRiskCount = bots.filter((b) => !b.isSelf && b.riskLevel === 'high').length;
    const sandboxedCount = bots.filter((b) => b.isSandboxed).length;
    const musicAndGameCount = bots.filter(
      (b) => b.category === 'music' || b.category === 'gaming' || b.category === 'economy'
    ).length;
    return {
      total: bots.length,
      thirdPartyCount,
      highRiskCount,
      sandboxedCount,
      musicAndGameCount,
    };
  }, [bots]);

  const openManageModal = (bot: BotIntegrationItem) => {
    setEditingBot(bot);
    setEditNickname(bot.nickname || '');
    setEditCategory(bot.category || 'utility');
    setEditPrefix(bot.prefix || '/');
    setEditNotes(bot.notes || '');
    setEditRoleIds(bot.roles.filter((r) => !r.managed).map((r) => r.id));
  };

  const handleSaveBotMeta = async () => {
    if (!editingBot || !guildId) return;
    setSavingBot(true);

    const currentAssignableIds = editingBot.roles.filter((r) => !r.managed).map((r) => r.id);
    const addRoles = editRoleIds.filter((id) => !currentAssignableIds.includes(id));
    const removeRoles = currentAssignableIds.filter((id) => !editRoleIds.includes(id));

    try {
      const res = await fetch(`/api/guilds/${guildId}/integrations/${editingBot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nickname: editNickname,
          category: editCategory,
          prefix: editPrefix,
          notes: editNotes,
          addRoles,
          removeRoles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update bot');

      setBots((prev) => prev.map((b) => (b.id === editingBot.id ? data.bot : b)));
      toast.success(`Saved configuration for ${editingBot.displayName}.`);
      setEditingBot(null);
    } catch (err: any) {
      toast.error(err.message || 'Could not update bot settings.');
    } finally {
      setSavingBot(false);
    }
  };

  const openSandboxModal = (bot: BotIntegrationItem) => {
    setSandboxBot(bot);
    setSandboxAllowedIds([...(bot.allowedChannelIds || [])]);
    setSandboxBlockedIds([...(bot.blockedChannelIds || [])]);
    setRestrictOtherText(false);
    setChannelSearch('');
  };

  const toggleSandboxChannel = (channelId: string, mode: 'allow' | 'block') => {
    if (mode === 'allow') {
      setSandboxBlockedIds((prev) => prev.filter((id) => id !== channelId));
      setSandboxAllowedIds((prev) =>
        prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
      );
    } else {
      setSandboxAllowedIds((prev) => prev.filter((id) => id !== channelId));
      setSandboxBlockedIds((prev) =>
        prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
      );
    }
  };

  const handleApplySandbox = async () => {
    if (!sandboxBot || !guildId) return;
    setSavingSandbox(true);

    try {
      const res = await fetch(`/api/guilds/${guildId}/integrations/${sandboxBot.id}/isolate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          allowedChannelIds: sandboxAllowedIds,
          blockedChannelIds: sandboxBlockedIds,
          restrictOtherTextChannels: restrictOtherText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync channel sandbox');

      setBots((prev) => prev.map((b) => (b.id === sandboxBot.id ? data.bot : b)));
      toast.success(
        `Updated ${data.updatedCount} channel permission overwrites for ${sandboxBot.displayName}.`
      );
      setSandboxBot(null);
    } catch (err: any) {
      toast.error(err.message || 'Could not apply channel restrictions.');
    } finally {
      setSavingSandbox(false);
    }
  };

  const handlePublishGuide = async () => {
    if (!guildId || !guideChannelId) {
      toast.warning('Please select a text channel to publish the Bot Guide.');
      return;
    }
    setPublishingGuide(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/integrations/publish-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          channelId: guideChannelId,
          title: guideTitle,
          description: guideDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish Bot Directory');

      toast.success(
        `Posted the Server Bot Directory embed to #${data.channelName}.`
      );
      setPublishModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Could not post Bot Directory embed.');
    } finally {
      setPublishingGuide(false);
    }
  };

  const handleApplyPreset = async (preset: BotPresetItem) => {
    if (!guildId) return;
    setApplyingPresetId(preset.id);
    try {
      const res = await fetch(`/api/guilds/${guildId}/integrations/presets/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ presetId: preset.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create preset channels');

      toast.success(
        `Created ${data.createdChannels.join(', ')} for ${preset.title}.`
      );
      fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message || 'Could not create preset channels.');
    } finally {
      setApplyingPresetId(null);
    }
  };

  const handleConfirmKickBot = async () => {
    if (!kickBotTarget || !guildId) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/integrations/${kickBotTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove bot');

      setBots((prev) => prev.filter((b) => b.id !== kickBotTarget.id));
      toast.success(`${kickBotTarget.displayName} has been removed from the server.`);
    } catch (err: any) {
      toast.error(err.message || 'Could not remove bot from the server.');
    } finally {
      setKickBotTarget(null);
    }
  };

  const textChannelOptions = useMemo(
    () =>
      channels
        .filter((c) => c.type === 'text')
        .map((c) => ({
          value: c.id,
          label: `#${c.name}${c.parentName ? ` (${c.parentName})` : ''}`,
        })),
    [channels]
  );

  const filteredModalChannels = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.parentName && c.parentName.toLowerCase().includes(q))
    );
  }, [channels, channelSearch]);

  if (loading && bots.length === 0) return <MembersSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        category="SERVER MANAGEMENT"
        title="Bot Integrations"
        description="Manage third-party bots (Lofi Radio, Music, Karuta, Mudae, Economy, and Moderation), isolate bot spam to dedicated sandbox channels, and publish a unified command directory."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <MdButton
              variant="tonal"
              icon="menu_book"
              onClick={() => setPublishModalOpen(true)}
            >
              Publish Bot Directory
            </MdButton>
            <MdButton
              variant="filled"
              icon="auto_Fix_high"
              onClick={() => setTabIndex(3)}
            >
              1-Click Bot Rooms
            </MdButton>
          </div>
        }
      />

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-discord-muted">
                Installed Bots
              </div>
              <div className="text-2xl font-normal text-discord-white mt-1">{stats.total}</div>
              <div className="text-xs text-discord-muted mt-1">
                {stats.thirdPartyCount} third-party + ArchiBot
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center text-discord-blurple">
              <MdIcon name="smart_toy" className="text-xl" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-discord-muted">
                Music & Game Bots
              </div>
              <div className="text-2xl font-normal text-discord-white mt-1">
                {stats.musicAndGameCount}
              </div>
              <div className="text-xs text-discord-muted mt-1">
                Lofi, radio, gacha & minigames
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center text-discord-green">
              <MdIcon name="headphones" className="text-xl" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-discord-muted">
                Channel Sandboxed
              </div>
              <div className="text-2xl font-normal text-discord-white mt-1">
                {stats.sandboxedCount}
              </div>
              <div className="text-xs text-discord-muted mt-1">
                Isolated from general chat spam
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center text-discord-blurple">
              <MdIcon name="lock_person" className="text-xl" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-discord-muted">
                High-Privilege Bots
              </div>
              <div className="text-2xl font-normal text-discord-white mt-1">
                {stats.highRiskCount}
              </div>
              <div className="text-xs text-discord-muted mt-1">
                {stats.highRiskCount === 0
                  ? 'No risky third-party admins'
                  : 'Has Admin / Manage Server'}
              </div>
            </div>
            <div
              className={`w-11 h-11 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center ${
                stats.highRiskCount > 0 ? 'text-discord-yellow' : 'text-discord-green'
              }`}
            >
              <MdIcon
                name={stats.highRiskCount > 0 ? 'gpp_maybe' : 'verified_user'}
                className="text-xl"
              />
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* Main Navigation Tabs */}
      <MdTabs
        tabs={[
          { id: 'installed', label: `Installed Bots (${bots.length})`, icon: 'smart_toy' },
          { id: 'sandboxes', label: 'Channel Sandboxes', icon: 'tune' },
          { id: 'commands', label: 'Commands & Prefixes', icon: 'terminal' },
          { id: 'discovery', label: 'Bot Presets & Discovery', icon: 'explore' },
        ]}
        activeIndex={tabIndex}
        onChange={setTabIndex}
      />

      {/* TAB 0: INSTALLED BOTS */}
      {tabIndex === 0 && (
        <div className="space-y-4">
          <SurfaceCard>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Bots', icon: 'apps' },
                  { id: 'music', label: 'Music & Lofi', icon: 'headphones' },
                  { id: 'gaming', label: 'Minigame & Gacha', icon: 'sports_esports' },
                  { id: 'economy', label: 'Economy', icon: 'monetization_on' },
                  { id: 'moderation', label: 'Moderation', icon: 'shield' },
                  { id: 'utility', label: 'Utility', icon: 'build' },
                ].map((cat) => (
                  <MdChip
                    key={cat.id}
                    label={cat.label}
                    icon={cat.icon}
                    selected={categoryFilter === cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                  />
                ))}
              </div>
              <div className="w-full lg:w-72">
                <MdTextField
                  label="Search bot name or prefix..."
                  value={search}
                  onChange={setSearch}
                  debounceMs={250}
                  icon="search"
                />
              </div>
            </div>
          </SurfaceCard>

          {filteredBots.length === 0 ? (
            <EmptyState
              icon="smart_toy"
              title="No matching bots found"
              description="Try clearing your category filter or explore popular Lofi & Minigame bots in the Discovery tab."
              action={
                <MdButton variant="tonal" icon="explore" onClick={() => setTabIndex(3)}>
                  Browse Recommended Bots
                </MdButton>
              }
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredBots.map((bot) => {
                const catMeta = CATEGORY_META[bot.category] || CATEGORY_META.utility;
                return (
                  <SurfaceCard key={bot.id}>
                    <div className="flex flex-col justify-between h-full gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={bot.avatar}
                              alt={bot.displayName}
                              className="w-12 h-12 rounded-xl object-cover border border-discord-border"
                            />
                            <span
                              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-discord-card ${
                                bot.status === 'offline' ? 'bg-discord-muted' : 'bg-discord-green'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-normal text-discord-white truncate">
                                {bot.displayName}
                              </span>
                              <StatusBadge label={catMeta.label} tone={catMeta.tone} />
                              {bot.isSelf && <StatusBadge label="Primary Bot" tone="blurple" />}
                            </div>
                            <div className="text-xs text-discord-muted mt-0.5 flex flex-wrap items-center gap-2">
                              <span>@{bot.username}</span>
                              <span>•</span>
                              <span>
                                Prefix:{' '}
                                <code className="px-1.5 py-0.5 rounded bg-discord-surface text-discord-white border border-discord-border">
                                  {bot.prefix || '/'}
                                </code>
                              </span>
                            </div>
                            <p className="text-xs text-discord-muted mt-2 line-clamp-2">
                              {bot.notes}
                            </p>
                          </div>
                        </div>

                        {/* Security Risk Badge */}
                        <div className="shrink-0">
                          {bot.riskLevel === 'high' ? (
                            <StatusBadge
                              label={bot.isAdmin ? 'Admin Access' : 'High Privilege'}
                              tone="yellow"
                            />
                          ) : bot.riskLevel === 'medium' ? (
                            <StatusBadge label="Moderate Perms" tone="neutral" />
                          ) : (
                            <StatusBadge label="Scoped Safe" tone="green" />
                          )}
                        </div>
                      </div>

                      <MdDivider />

                      {/* Roles & Channel Sandbox Summary */}
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-discord-muted mr-1">Roles:</span>
                          {bot.roles.length === 0 ? (
                            <span className="text-xs text-discord-muted">No roles assigned</span>
                          ) : (
                            bot.roles.slice(0, 5).map((r) => (
                              <Badge key={r.id}>
                                {r.name}
                              </Badge>
                            ))
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2 text-discord-muted">
                            <MdIcon name="lock_person" className="text-sm text-discord-blurple" />
                            {bot.allowedChannelIds.length > 0 || bot.blockedChannelIds.length > 0 ? (
                              <span>
                                Allowed in{' '}
                                <span className="text-discord-white">
                                  {bot.allowedChannelIds.length}
                                </span>{' '}
                                ch • Blocked in{' '}
                                <span className="text-discord-white">
                                  {bot.blockedChannelIds.length}
                                </span>{' '}
                                ch
                              </span>
                            ) : (
                              <span>Unrestricted (can respond in all visible channels)</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <MdButton
                              size="sm"
                              variant="tonal"
                              icon="tune"
                              onClick={() => openSandboxModal(bot)}
                            >
                              Sandbox
                            </MdButton>
                            <MdButton
                              size="sm"
                              variant="outlined"
                              icon="edit"
                              onClick={() => openManageModal(bot)}
                            >
                              Configure
                            </MdButton>
                            {!bot.isSelf && (
                              <MdIconButton
                                icon="person_remove"
                                title="Remove bot from server"
                                onClick={() => setKickBotTarget(bot)}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: CHANNEL SANDBOXES */}
      {tabIndex === 1 && (
        <div className="space-y-4">
          <SurfaceCard
            title="Channel Sandbox & Anti-Spam Isolation"
            subtitle="Restrict Lofi music bots to voice lounges and keep gacha/minigame bots (Karuta, Mudae, Dank Memer) inside dedicated arcade channels so they never clutter general chat."
            headerAction={
              <MdButton
                size="sm"
                variant="tonal"
                icon="add_circle"
                onClick={() => setTabIndex(3)}
              >
                Create Sandbox Channels
              </MdButton>
            }
          >
            <div className="space-y-3">
              {bots.map((bot) => {
                const catMeta = CATEGORY_META[bot.category] || CATEGORY_META.utility;
                const allowedNames = bot.allowedChannelIds
                  .map((id) => channels.find((c) => c.id === id)?.name)
                  .filter(Boolean);
                const blockedCount = bot.blockedChannelIds.length;

                return (
                  <div
                    key={bot.id}
                    className="p-4 rounded-xl bg-discord-surface border border-discord-border flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={bot.avatar}
                        alt={bot.displayName}
                        className="w-10 h-10 rounded-xl object-cover border border-discord-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-normal text-discord-white">
                            {bot.displayName}
                          </span>
                          <StatusBadge label={catMeta.label} tone={catMeta.tone} />
                          {bot.isSandboxed ? (
                            <StatusBadge label="Sandboxed" tone="green" />
                          ) : (
                            <StatusBadge label="All Channels" tone="neutral" />
                          )}
                        </div>
                        <div className="text-xs text-discord-muted mt-1 flex flex-wrap items-center gap-1.5">
                          {allowedNames.length > 0 ? (
                            <>
                              <span>Allowed in:</span>
                              {allowedNames.slice(0, 4).map((name) => (
                                <span
                                  key={name}
                                  className="px-2 py-0.5 rounded-md bg-discord-card border border-discord-border text-discord-white"
                                >
                                  #{name}
                                </span>
                              ))}
                              {allowedNames.length > 4 && (
                                <span>+{allowedNames.length - 4} more</span>
                              )}
                            </>
                          ) : (
                            <span>No specific channel whitelist configured yet.</span>
                          )}
                          {blockedCount > 0 && (
                            <span className="text-discord-muted">
                              • Muted in {blockedCount} channel{blockedCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <MdButton
                        size="sm"
                        variant="filled"
                        icon="lock_person"
                        onClick={() => openSandboxModal(bot)}
                      >
                        Configure Allowed Channels
                      </MdButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* TAB 2: COMMANDS & PREFIXES */}
      {tabIndex === 2 && (
        <div className="space-y-4">
          <SurfaceCard
            title="Bot Command Prefix Registry & Server Directory"
            subtitle="Document each bot's prefix and usage notes so members never get confused, then publish a clean Bot Directory embed directly to Discord."
            headerAction={
              <MdButton
                variant="filled"
                icon="send"
                onClick={() => setPublishModalOpen(true)}
              >
                Publish Guide to Discord
              </MdButton>
            }
          >
            <div className="space-y-3">
              {bots.map((bot) => {
                const catMeta = CATEGORY_META[bot.category] || CATEGORY_META.utility;
                return (
                  <div
                    key={bot.id}
                    className="p-4 rounded-xl bg-discord-surface border border-discord-border flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <img
                        src={bot.avatar}
                        alt={bot.displayName}
                        className="w-10 h-10 rounded-xl object-cover border border-discord-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-normal text-discord-white">
                            {bot.displayName}
                          </span>
                          <StatusBadge label={catMeta.label} tone={catMeta.tone} />
                          <code className="px-2 py-0.5 rounded bg-discord-card border border-discord-border text-xs text-discord-blurple">
                            Prefix: {bot.prefix || '/'}
                          </code>
                        </div>
                        <p className="text-xs text-discord-muted mt-1">{bot.notes}</p>
                        {bot.dangerousPermissions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[11px] text-discord-muted">Key Permissions:</span>
                            {bot.dangerousPermissions.slice(0, 5).map((perm) => (
                              <span
                                key={perm}
                                className="px-1.5 py-0.5 rounded text-[11px] bg-discord-card border border-discord-border text-discord-muted"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <MdButton
                        size="sm"
                        variant="outlined"
                        icon="edit"
                        onClick={() => openManageModal(bot)}
                      >
                        Edit Prefix & Notes
                      </MdButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* TAB 3: BOT PRESETS & DISCOVERY */}
      {tabIndex === 3 && (
        <div className="space-y-6">
          {/* 1-Click Environment Builders */}
          <div>
            <SectionHeader title="1-Click Bot Environment Builders" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <SurfaceCard key={preset.id}>
                  <div className="flex flex-col justify-between h-full gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center text-discord-blurple">
                          <MdIcon name={preset.icon} className="text-xl" />
                        </div>
                        <StatusBadge label="1-Click Setup" tone="blurple" />
                      </div>
                      <h3 className="text-base font-normal text-discord-white">{preset.title}</h3>
                      <p className="text-xs text-discord-muted mt-1 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-discord-border">
                        <div className="text-[11px] uppercase tracking-wider text-discord-muted mb-2">
                          Channels Created Automatically
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {preset.channelsPreview.map((chName) => (
                            <span
                              key={chName}
                              className="px-2 py-1 rounded-lg bg-discord-surface border border-discord-border text-xs text-discord-white"
                            >
                              {chName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <MdButton
                      variant="filled"
                      icon="add_business"
                      loading={applyingPresetId === preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full justify-center"
                    >
                      Deploy {preset.title}
                    </MdButton>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </div>

          {/* Curated Third-Party Bot Directory */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <SectionHeader title="Popular Third-Party Bots (Lofi, Music & Minigames)" className="mb-0" />
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'music', label: 'Lofi & Music' },
                  { id: 'gaming', label: 'Minigames & Gacha' },
                  { id: 'economy', label: 'Economy' },
                ].map((cat) => (
                  <MdChip
                    key={cat.id}
                    label={cat.label}
                    selected={discoveryCategory === cat.id}
                    onClick={() => setDiscoveryCategory(cat.id)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredDiscovery.map((rec) => {
                const isAlreadyInstalled = bots.some((b) =>
                  b.displayName.toLowerCase().includes(rec.name.split(' ')[0].toLowerCase()) ||
                  b.username.toLowerCase().includes(rec.name.split(' ')[0].toLowerCase())
                );
                const catMeta = CATEGORY_META[rec.category] || CATEGORY_META.utility;

                return (
                  <SurfaceCard key={rec.id}>
                    <div className="flex flex-col justify-between h-full gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-normal text-discord-white">{rec.name}</h4>
                            <div className="mt-1">
                              <StatusBadge label={rec.badge} tone={catMeta.tone} />
                            </div>
                          </div>
                          {isAlreadyInstalled && (
                            <StatusBadge label="Installed" tone="green" />
                          )}
                        </div>

                        <p className="text-xs text-discord-muted mt-3 leading-relaxed">
                          {rec.description}
                        </p>

                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-discord-muted">
                            <span>Default Prefix:</span>
                            <code className="px-1.5 py-0.5 rounded bg-discord-surface border border-discord-border text-discord-white">
                              {rec.prefix}
                            </code>
                          </div>
                          <div className="flex items-center justify-between text-discord-muted">
                            <span>Best Room:</span>
                            <span className="text-discord-white">{rec.recommendedChannel}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-discord-border">
                          <div className="text-[11px] text-discord-muted mb-1.5">
                            Popular Commands:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {rec.commands.map((cmd) => (
                              <code
                                key={cmd}
                                className="px-1.5 py-0.5 rounded bg-discord-surface border border-discord-border text-[11px] text-discord-muted"
                              >
                                {cmd}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>

                      <MdButton
                        variant={isAlreadyInstalled ? 'tonal' : 'outlined'}
                        size="sm"
                        icon="open_in_new"
                        onClick={() => window.open(rec.inviteUrl, '_blank', 'noopener,noreferrer')}
                        className="w-full justify-center"
                      >
                        {isAlreadyInstalled ? 'View Official Docs' : `Invite ${rec.name}`}
                      </MdButton>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CONFIGURE BOT METADATA, PREFIX & ROLES */}
      <MdDialog
        open={Boolean(editingBot)}
        onClose={() => setEditingBot(null)}
        headline={editingBot ? `Configure ${editingBot.displayName}` : 'Configure Bot'}
        actions={
          <div className="flex items-center justify-end gap-2">
            <MdButton variant="text" onClick={() => setEditingBot(null)}>
              Cancel
            </MdButton>
            <MdButton
              variant="filled"
              icon="save"
              loading={savingBot}
              onClick={handleSaveBotMeta}
            >
              Save Changes
            </MdButton>
          </div>
        }
      >
        {editingBot && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MdTextField
                label="Server Nickname"
                value={editNickname}
                onChange={setEditNickname}
                placeholder={editingBot.username}
              />
              <MdTextField
                label="Command Prefix"
                value={editPrefix}
                onChange={setEditPrefix}
                placeholder="e.g. / or k! or $"
              />
            </div>

            <MdSelect
              label="Bot Functional Category"
              value={editCategory}
              onChange={setEditCategory}
              options={[
                { value: 'music', label: 'Music & Lofi Studio' },
                { value: 'gaming', label: 'Minigame & Gacha Arcade' },
                { value: 'economy', label: 'Economy & Currency' },
                { value: 'moderation', label: 'Moderation & Security' },
                { value: 'utility', label: 'Utility & Automation' },
                { value: 'core', label: 'Core Server Engine' },
              ]}
            />

            <MdTextField
              type="textarea"
              rows={3}
              label="Usage Notes (Displayed in Server Bot Directory)"
              value={editNotes}
              onChange={setEditNotes}
              placeholder="Describe what members can do with this bot..."
            />

            <div>
              <div className="text-xs text-discord-muted mb-2">
                Assigned Server Roles (Click to toggle):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 rounded-xl bg-discord-surface border border-discord-border">
                {assignableRoles.length === 0 ? (
                  <span className="text-xs text-discord-muted">No assignable roles available.</span>
                ) : (
                  assignableRoles.map((role) => {
                    const selected = editRoleIds.includes(role.id);
                    return (
                      <MdChip
                        key={role.id}
                        label={role.name}
                        selected={selected}
                        onClick={() =>
                          setEditRoleIds((prev) =>
                            prev.includes(role.id)
                              ? prev.filter((id) => id !== role.id)
                              : [...prev, role.id]
                          )
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </MdDialog>

      {/* MODAL 2: CHANNEL SANDBOX & PERMISSION ISOLATION */}
      <MdDialog
        open={Boolean(sandboxBot)}
        onClose={() => setSandboxBot(null)}
        headline={
          sandboxBot ? `Channel Sandbox — ${sandboxBot.displayName}` : 'Channel Sandbox'
        }
        actions={
          <div className="flex items-center justify-end gap-2">
            <MdButton variant="text" onClick={() => setSandboxBot(null)}>
              Cancel
            </MdButton>
            <MdButton
              variant="filled"
              icon="sync_lock"
              loading={savingSandbox}
              onClick={handleApplySandbox}
            >
              Sync Channel Permissions
            </MdButton>
          </div>
        }
      >
        {sandboxBot && (
          <div className="space-y-4">
            <p className="text-xs text-discord-muted leading-relaxed">
              Choose which channels <span className="text-discord-white">{sandboxBot.displayName}</span> is explicitly{' '}
              <span className="text-discord-green">Allowed</span> to use or{' '}
              <span className="text-discord-red">Blocked</span> from messaging/connecting. ArchiBot will automatically apply Discord permission overwrites.
            </p>

            <SwitchRow
              boxed
              label="Strict Sandbox Mode (Mute in all other text channels)"
              description="When enabled, any text channel not marked as Allowed below will automatically have Send Messages & Slash Commands disabled for this bot."
              checked={restrictOtherText}
              onChange={setRestrictOtherText}
            />

            <MdTextField
              label="Filter channels..."
              value={channelSearch}
              onChange={setChannelSearch}
              debounceMs={250}
              icon="search"
            />

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredModalChannels.map((ch) => {
                const isAllowed = sandboxAllowedIds.includes(ch.id);
                const isBlocked = sandboxBlockedIds.includes(ch.id);
                return (
                  <div
                    key={ch.id}
                    className="px-3 py-2 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MdIcon
                        name={ch.type === 'voice' ? 'volume_up' : 'tag'}
                        className="text-base text-discord-muted"
                      />
                      <div className="truncate">
                        <span className="text-xs text-discord-white">{ch.name}</span>
                        {ch.parentName && (
                          <span className="text-[11px] text-discord-muted ml-2">
                            ({ch.parentName})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <MdButton
                        size="xs"
                        variant={isAllowed ? 'filled' : 'outlined'}
                        icon="check"
                        onClick={() => toggleSandboxChannel(ch.id, 'allow')}
                      >
                        Allow
                      </MdButton>
                      <MdButton
                        size="xs"
                        variant={isBlocked ? 'danger' : 'outlined'}
                        icon="block"
                        onClick={() => toggleSandboxChannel(ch.id, 'block')}
                      >
                        Block
                      </MdButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </MdDialog>

      {/* MODAL 3: PUBLISH BOT DIRECTORY EMBED */}
      <MdDialog
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        headline="Publish Server Bot Directory to Discord"
        actions={
          <div className="flex items-center justify-end gap-2">
            <MdButton variant="text" onClick={() => setPublishModalOpen(false)}>
              Cancel
            </MdButton>
            <MdButton
              variant="filled"
              icon="send"
              loading={publishingGuide}
              onClick={handlePublishGuide}
            >
              Publish Embed
            </MdButton>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-discord-muted leading-relaxed">
            ArchiBot will generate a formatted Discord embed listing all installed bots grouped by category (Music & Lofi, Minigames, Economy, Moderation, and Utilities), including each bot&apos;s prefix and allowed channels.
          </p>

          <MdSelect
            label="Target Text Channel"
            value={guideChannelId}
            onChange={setGuideChannelId}
            options={textChannelOptions}
          />

          <MdTextField
            label="Embed Title (Optional)"
            value={guideTitle}
            onChange={setGuideTitle}
            placeholder="🤖 Server Bot Directory & Command Guide"
          />

          <MdTextField
            type="textarea"
            rows={3}
            label="Introduction Text"
            value={guideDescription}
            onChange={setGuideDescription}
          />
        </div>
      </MdDialog>

      {/* MODAL 4: REMOVE BOT CONFIRMATION */}
      <ConfirmDialog
        open={Boolean(kickBotTarget)}
        onClose={() => setKickBotTarget(null)}
        onConfirm={handleConfirmKickBot}
        title={kickBotTarget ? `Remove ${kickBotTarget.displayName}?` : 'Remove Bot?'}
        message={
          kickBotTarget
            ? `Are you sure you want to kick ${kickBotTarget.displayName} (@${kickBotTarget.username}) from the server? You can always re-invite it later.`
            : ''
        }
        confirmLabel="Remove Bot"
        danger
      />
    </div>
  );
};
