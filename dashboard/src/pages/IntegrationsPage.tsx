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

type BotCategory =
  | 'core'
  | 'moderation'
  | 'utility'
  | 'ai'
  | 'music'
  | 'gaming'
  | 'economy'
  | 'custom';

interface BotIntegrationItem {
  id: string;
  username: string;
  displayName: string;
  nickname: string | null;
  avatar: string;
  joinedAt: number | string | null;
  isSelf: boolean;
  status: string;
  category: BotCategory;
  prefix: string;
  commands: string[];
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

interface BotPresetItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  channelsPreview: string[];
}

const DEFAULT_PRESETS: BotPresetItem[] = [
  {
    id: 'bot_sandbox',
    title: 'Dedicated Bot Command Sandbox',
    category: 'utility',
    icon: 'terminal',
    description:
      'Creates a dedicated #bot-commands text channel so bot interactions and slash commands stay organized away from general chat.',
    channelsPreview: ['🤖・bot-commands'],
  },
  {
    id: 'voice_bot_lounge',
    title: 'Audio & Voice Bot Lounge',
    category: 'music',
    icon: 'graphic_eq',
    description:
      'Creates an "AUDIO & VOICE BOTS" category with a #audio-controls text channel and a dedicated 🔊 Bot Audio Lounge voice room.',
    channelsPreview: ['🎛️・audio-controls', '🔊 Bot Audio Lounge'],
  },
  {
    id: 'interactive_bot_zone',
    title: 'Interactive & Activity Bot Zone',
    category: 'gaming',
    icon: 'extension',
    description:
      'Creates a "BOT ACTIVITIES" category with isolated channels for interactive bots, leveling checks, and community activities.',
    channelsPreview: ['🤖・bot-activities', '📊・rank-and-stats'],
  },
];

const CATEGORY_META: Record<
  string,
  { label: string; icon: string; tone: 'blurple' | 'green' | 'yellow' | 'red' | 'premium' | 'neutral' }
> = {
  core: { label: 'Core & System', icon: 'verified', tone: 'blurple' },
  moderation: { label: 'Moderation & Security', icon: 'shield', tone: 'blurple' },
  utility: { label: 'Utility & Automation', icon: 'build', tone: 'neutral' },
  ai: { label: 'AI & Webhooks', icon: 'auto_awesome', tone: 'premium' },
  music: { label: 'Audio & Voice', icon: 'graphic_eq', tone: 'premium' },
  gaming: { label: 'Games & Entertainment', icon: 'sports_esports', tone: 'green' },
  economy: { label: 'Economy & Leveling', icon: 'monitoring', tone: 'yellow' },
  custom: { label: 'Custom Bot', icon: 'smart_toy', tone: 'neutral' },
};

function detectClientBotDefaults(username: string, displayName: string): {
  category: BotCategory;
  prefix: string;
  notes: string;
  isSelf: boolean;
} {
  const combined = `${username || ''} ${displayName || ''}`.trim();
  if (/archibot/i.test(combined)) {
    return {
      category: 'core',
      prefix: '/',
      notes: 'Primary server architecture, templates, analytics, and community engine.',
      isSelf: true,
    };
  }
  if (/dyno|carl|mee6|probot|wick|vortex|sapphire|security|automod|double\s*counter|pandez|modmail|ticket|logger|audit|guard|shield|mod/i.test(combined)) {
    return {
      category: 'moderation',
      prefix: '/',
      notes: 'Server moderation, security, logging, and automated protection.',
      isSelf: false,
    };
  }
  if (/music|radio|audio|sound|voice|lofi|jockie|fredboat|uzox|flavi|chip|green-bot|pancake|rythm|hydra|vexera|spotify|tts/i.test(combined)) {
    return {
      category: 'music',
      prefix: '/',
      notes: 'Voice channel audio, radio streaming, and sound utilities.',
      isSelf: false,
    };
  }
  if (/game|rpg|gacha|trivia|card|arcade|play|karuta|mudae|poketwo|poké|dank|owo|fisher|akinator|counting|wordle|uno/i.test(combined)) {
    return {
      category: 'gaming',
      prefix: '/',
      notes: 'Interactive chat games, multiplayer activities, and entertainment.',
      isSelf: false,
    };
  }
  if (/economy|level|xp|rank|coin|bank|shop|currency|unbelievaboat|tatsu|arcane/i.test(combined)) {
    return {
      category: 'economy',
      prefix: '/',
      notes: 'Server leveling, XP progression, and community rewards.',
      isSelf: false,
    };
  }
  if (/ai|gpt|claude|gemini|midjourney|chat|assistant|translate|webhook|github|notify|rss/i.test(combined)) {
    return {
      category: 'ai',
      prefix: '/',
      notes: 'AI assistant, external webhook integration, and automated feeds.',
      isSelf: false,
    };
  }
  return {
    category: 'utility',
    prefix: '/',
    notes: 'Slash commands, utilities, and server automation.',
    isSelf: false,
  };
}

function getLocalBotMetaMap(guildId?: string): Record<string, any> {
  if (!guildId) return {};
  try {
    const raw = localStorage.getItem(`archibot_bot_meta_${guildId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalBotMeta(guildId: string | undefined, botId: string, patch: Record<string, any>) {
  if (!guildId) return;
  try {
    const map = getLocalBotMetaMap(guildId);
    map[botId] = { ...(map[botId] || {}), ...patch };
    localStorage.setItem(`archibot_bot_meta_${guildId}`, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

async function safeJsonFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Endpoint unavailable (${res.status})`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const IntegrationsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<BotIntegrationItem[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<BotRoleItem[]>([]);
  const [presets, setPresets] = useState<BotPresetItem[]>(DEFAULT_PRESETS);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Universal OAuth2 Bot Invite Generator State
  const [inviteClientId, setInviteClientId] = useState('');
  const [invitePermLevel, setInvitePermLevel] = useState('standard');

  // Custom Bot Room Builder State
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customTextChannel, setCustomTextChannel] = useState('');
  const [customVoiceChannel, setCustomVoiceChannel] = useState('');
  const [customRoomBotIds, setCustomRoomBotIds] = useState<string[]>([]);
  const [creatingCustomRoom, setCreatingCustomRoom] = useState(false);

  // Manage Bot Modal
  const [editingBot, setEditingBot] = useState<BotIntegrationItem | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editCategory, setEditCategory] = useState<BotCategory>('utility');
  const [editPrefix, setEditPrefix] = useState('/');
  const [editCommandsText, setEditCommandsText] = useState('');
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

    const loadTask = (async () => {
      try {
        const data = await safeJsonFetch(`/api/guilds/${guildId}/integrations`);
        const localMap = getLocalBotMetaMap(guildId);
        if (Array.isArray(data.bots)) {
          setBots(
            data.bots.map((b: BotIntegrationItem) => ({
              ...b,
              commands: Array.isArray(b.commands) ? b.commands : [],
              ...(localMap[b.id] || {}),
            }))
          );
        }
        if (Array.isArray(data.channels)) {
          setChannels(data.channels);
          const firstText = data.channels.find((c: ChannelOption) => c.type === 'text');
          if (firstText && !guideChannelId) setGuideChannelId(firstText.id);
        }
        if (Array.isArray(data.assignableRoles)) setAssignableRoles(data.assignableRoles);
        if (Array.isArray(data.presets)) setPresets(data.presets);
      } catch {
        // Fallback: Build Bot Integrations state from existing /members, /channels, and /roles endpoints
        try {
          const [membersRes, channelsRes, rolesRes] = await Promise.all([
            safeJsonFetch(`/api/guilds/${guildId}/members?limit=200`).catch(() => ({ members: [] })),
            safeJsonFetch(`/api/guilds/${guildId}/channels`).catch(() => ({ channels: [] })),
            safeJsonFetch(`/api/guilds/${guildId}/roles`).catch(() => ({ roles: [] })),
          ]);

          const localMap = getLocalBotMetaMap(guildId);
          const rawMembers = Array.isArray(membersRes.members) ? membersRes.members : [];
          const rawChannels = Array.isArray(channelsRes.channels) ? channelsRes.channels : [];
          const rawRoles = Array.isArray(rolesRes.roles) ? rolesRes.roles : [];

          const categoryLookup = new Map<string, string>();
          for (const ch of rawChannels) {
            if (ch.typeName === 'category' || ch.type === 4) {
              categoryLookup.set(ch.id, ch.name);
            }
          }

          const mappedChannels: ChannelOption[] = rawChannels
            .filter(
              (c: any) =>
                c.typeName === 'text' ||
                c.typeName === 'voice' ||
                c.typeName === 'stage' ||
                c.typeName === 'announcement'
            )
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              type: c.typeName === 'voice' || c.typeName === 'stage' ? 'voice' : 'text',
              parentName: c.parentId ? categoryLookup.get(c.parentId) || null : null,
            }));

          setChannels(mappedChannels);
          const firstText = mappedChannels.find((c) => c.type === 'text');
          if (firstText && !guideChannelId) setGuideChannelId(firstText.id);

          const mappedRoles: BotRoleItem[] = rawRoles
            .filter((r: any) => !r.managed && r.name !== '@everyone')
            .map((r: any) => ({
              id: r.id,
              name: r.name,
              color: r.color === '#000000' ? null : r.color,
              managed: Boolean(r.managed),
            }));
          setAssignableRoles(mappedRoles);

          const botMembers: BotIntegrationItem[] = rawMembers
            .filter((m: any) => Boolean(m.bot))
            .map((m: any) => {
              const detected = detectClientBotDefaults(m.username, m.displayName);
              const saved = localMap[m.id] || {};
              const allowedChannelIds = Array.isArray(saved.allowedChannelIds)
                ? saved.allowedChannelIds
                : [];
              const blockedChannelIds = Array.isArray(saved.blockedChannelIds)
                ? saved.blockedChannelIds
                : [];
              const isHighPrivilege = !m.manageable && !detected.isSelf;

              return {
                id: m.id,
                username: m.username,
                displayName: saved.nickname || m.displayName || m.username,
                nickname: saved.nickname ?? (m.displayName !== m.username ? m.displayName : null),
                avatar: m.avatar,
                joinedAt: m.joinedAt || null,
                isSelf: detected.isSelf,
                status: 'online',
                category: (saved.category as BotCategory) || detected.category,
                prefix: saved.prefix ?? detected.prefix,
                commands: Array.isArray(saved.commands) ? saved.commands : [],
                notes: saved.notes ?? detected.notes,
                allowedChannelIds,
                blockedChannelIds,
                isSandboxed: allowedChannelIds.length > 0 || blockedChannelIds.length > 0,
                roles: Array.isArray(m.roles) ? m.roles : [],
                isAdmin: isHighPrivilege,
                riskLevel: isHighPrivilege ? 'high' : 'safe',
                dangerousPermissions: isHighPrivilege ? ['Elevated Role Hierarchy'] : [],
              };
            })
            .sort((a, b) => {
              if (a.isSelf && !b.isSelf) return -1;
              if (!a.isSelf && b.isSelf) return 1;
              return a.displayName.localeCompare(b.displayName);
            });

          setBots(botMembers);
        } catch {
          toast.error('Could not load server bot integrations.');
        }
      } finally {
        setLoading(false);
      }
    })();

    registerServerFetch(loadTask);
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
        b.id.includes(q) ||
        b.prefix.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q)
      );
    });
  }, [bots, search, categoryFilter]);

  const stats = useMemo(() => {
    const thirdPartyCount = bots.filter((b) => !b.isSelf).length;
    const onlineCount = bots.filter((b) => b.status !== 'offline').length;
    const highRiskCount = bots.filter((b) => !b.isSelf && b.riskLevel === 'high').length;
    const sandboxedCount = bots.filter((b) => b.isSandboxed).length;
    return {
      total: bots.length,
      thirdPartyCount,
      onlineCount,
      highRiskCount,
      sandboxedCount,
    };
  }, [bots]);

  const openManageModal = (bot: BotIntegrationItem) => {
    setEditingBot(bot);
    setEditNickname(bot.nickname || '');
    setEditCategory(bot.category || 'utility');
    setEditPrefix(bot.prefix || '/');
    setEditCommandsText(Array.isArray(bot.commands) ? bot.commands.join(', ') : '');
    setEditNotes(bot.notes || '');
    setEditRoleIds(bot.roles.filter((r) => !r.managed).map((r) => r.id));
  };

  const handleSaveBotMeta = async () => {
    if (!editingBot || !guildId) return;
    setSavingBot(true);

    const parsedCommands = editCommandsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const currentAssignableIds = editingBot.roles.filter((r) => !r.managed).map((r) => r.id);
    const addRoles = editRoleIds.filter((id) => !currentAssignableIds.includes(id));
    const removeRoles = currentAssignableIds.filter((id) => !editRoleIds.includes(id));

    saveLocalBotMeta(guildId, editingBot.id, {
      category: editCategory,
      prefix: editPrefix,
      commands: parsedCommands,
      notes: editNotes,
      nickname: editNickname || null,
    });

    try {
      const data = await safeJsonFetch(`/api/guilds/${guildId}/integrations/${editingBot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: editNickname,
          category: editCategory,
          prefix: editPrefix,
          commands: parsedCommands,
          notes: editNotes,
          addRoles,
          removeRoles,
        }),
      });
      setBots((prev) =>
        prev.map((b) =>
          b.id === editingBot.id ? { ...data.bot, commands: parsedCommands } : b
        )
      );
      toast.success(`Saved configuration for ${editingBot.displayName}.`);
      setEditingBot(null);
    } catch {
      try {
        if (editNickname !== (editingBot.nickname || '') || addRoles.length || removeRoles.length) {
          await safeJsonFetch(`/api/guilds/${guildId}/members/${editingBot.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nickname: editNickname,
              addRoles,
              removeRoles,
            }),
          }).catch(() => {});
        }

        const updatedRoles = assignableRoles.filter((r) => editRoleIds.includes(r.id));
        setBots((prev) =>
          prev.map((b) =>
            b.id === editingBot.id
              ? {
                  ...b,
                  displayName: editNickname.trim() || b.username,
                  nickname: editNickname.trim() || null,
                  category: editCategory,
                  prefix: editPrefix,
                  commands: parsedCommands,
                  notes: editNotes,
                  roles: updatedRoles.length ? updatedRoles : b.roles,
                }
              : b
          )
        );
        toast.success(`Saved configuration for ${editingBot.displayName}.`);
        setEditingBot(null);
      } catch (err: any) {
        toast.error(err.message || 'Could not update bot settings.');
      }
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

    const effectiveBlocked = [...sandboxBlockedIds];
    if (restrictOtherText && sandboxAllowedIds.length > 0) {
      for (const ch of channels) {
        if (
          ch.type === 'text' &&
          !sandboxAllowedIds.includes(ch.id) &&
          !effectiveBlocked.includes(ch.id)
        ) {
          effectiveBlocked.push(ch.id);
        }
      }
    }

    saveLocalBotMeta(guildId, sandboxBot.id, {
      allowedChannelIds: sandboxAllowedIds,
      blockedChannelIds: effectiveBlocked,
      isSandboxed: sandboxAllowedIds.length > 0 || effectiveBlocked.length > 0,
    });

    try {
      const data = await safeJsonFetch(
        `/api/guilds/${guildId}/integrations/${sandboxBot.id}/isolate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            allowedChannelIds: sandboxAllowedIds,
            blockedChannelIds: effectiveBlocked,
            restrictOtherTextChannels: restrictOtherText,
          }),
        }
      );

      setBots((prev) => prev.map((b) => (b.id === sandboxBot.id ? data.bot : b)));
      toast.success(
        `Updated ${data.updatedCount} channel permission overwrites for ${sandboxBot.displayName}.`
      );
      setSandboxBot(null);
    } catch {
      setBots((prev) =>
        prev.map((b) =>
          b.id === sandboxBot.id
            ? {
                ...b,
                allowedChannelIds: sandboxAllowedIds,
                blockedChannelIds: effectiveBlocked,
                isSandboxed: sandboxAllowedIds.length > 0 || effectiveBlocked.length > 0,
              }
            : b
        )
      );
      toast.success(`Saved channel sandbox rules for ${sandboxBot.displayName}.`);
      setSandboxBot(null);
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
      const data = await safeJsonFetch(`/api/guilds/${guildId}/integrations/publish-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: guideChannelId,
          title: guideTitle,
          description: guideDescription,
        }),
      });
      toast.success(`Posted the Server Bot Directory embed to #${data.channelName}.`);
      setPublishModalOpen(false);
    } catch {
      try {
        const categoryLabels: Record<string, string> = {
          core: '⚙️ Core & System Bots',
          moderation: '🛡️ Moderation & Security Bots',
          utility: '🔧 Utility & Automation Bots',
          ai: '✨ AI & Webhook Integrations',
          music: '🎵 Audio & Voice Bots',
          gaming: '🎮 Games & Entertainment Bots',
          economy: '🪙 Economy & Leveling Bots',
          custom: '🧩 Custom & Other Bots',
        };

        const fields = Object.entries(categoryLabels)
          .map(([catKey, label]) => {
            const list = bots.filter((b) => (b.category || 'utility') === catKey);
            if (!list.length) return null;
            const value = list
              .map((b) => {
                const chHint = b.allowedChannelIds.length
                  ? ` • 📍 ${b.allowedChannelIds
                      .slice(0, 3)
                      .map((id) => `<#${id}>`)
                      .join(', ')}`
                  : '';
                const cmdHint =
                  Array.isArray(b.commands) && b.commands.length > 0
                    ? ` (${b.commands.slice(0, 4).map((c) => `\`${c}\``).join(', ')})`
                    : '';
                return `• **${b.displayName}** (\`${b.prefix || '/'}\`) — ${b.notes}${cmdHint}${chHint}`;
              })
              .join('\n')
              .slice(0, 1024);
            return { name: label, value, inline: false };
          })
          .filter(Boolean);

        await safeJsonFetch(`/api/guilds/${guildId}/embeds/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: guideChannelId,
            embed: {
              title: guideTitle.trim() || '🤖 Server Bot Directory & Command Guide',
              description: guideDescription.trim(),
              color: '#5865F2',
              timestamp: true,
              fields,
            },
          }),
        });

        const chName = channels.find((c) => c.id === guideChannelId)?.name || 'channel';
        toast.success(`Posted the Server Bot Directory embed to #${chName}.`);
        setPublishModalOpen(false);
      } catch (err: any) {
        toast.error(err.message || 'Could not post Bot Directory embed.');
      }
    } finally {
      setPublishingGuide(false);
    }
  };

  const handleOpenBotAuthorize = (botIdOrInput: string, permPreset = 'standard') => {
    const raw = botIdOrInput.trim();
    if (!raw) {
      toast.warning('Please enter a Discord Bot Client ID or Invite URL.');
      return;
    }

    // If full URL was pasted, open directly
    if (/^https?:\/\//i.test(raw)) {
      window.open(raw, '_blank', 'noopener,noreferrer');
      return;
    }

    const clientIdMatch = /\d{15,22}/.exec(raw);
    if (!clientIdMatch) {
      toast.warning('Please enter a valid numeric Discord Application / Client ID (17-20 digits).');
      return;
    }

    const permMap: Record<string, string> = {
      minimal: '2147485696', // View Channels, Send Messages, Embed Links, Use Slash Commands
      voice: '36702208', // View Channels, Connect, Speak, Use Voice Activity
      standard: '1099511627775', // Standard Moderation & Utility
      admin: '8', // Administrator
    };
    const permissions = permMap[permPreset] || '2147485696';
    const guildParam = guildId ? `&guild_id=${guildId}&disable_guild_select=false` : '';
    const url = `https://discord.com/oauth2/authorize?client_id=${clientIdMatch[0]}&permissions=${permissions}&scope=bot%20applications.commands${guildParam}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCreateCustomBotRoom = async () => {
    if (!guildId) return;
    if (!customTextChannel.trim() && !customVoiceChannel.trim()) {
      toast.warning('Please provide at least a Text Channel or Voice Channel name.');
      return;
    }

    setCreatingCustomRoom(true);
    try {
      const data = await safeJsonFetch(`/api/guilds/${guildId}/integrations/presets/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: 'custom',
          customCategoryName,
          customTextChannel,
          customVoiceChannel,
          allowedBotIds: customRoomBotIds,
        }),
      });
      toast.success(`Created ${data.createdChannels.join(', ')} successfully.`);
      setCustomCategoryName('');
      setCustomTextChannel('');
      setCustomVoiceChannel('');
      setCustomRoomBotIds([]);
      fetchIntegrations();
    } catch {
      try {
        const createdNames: string[] = [];
        let parentId: string | undefined;
        if (customCategoryName.trim()) {
          const catRes = await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: customCategoryName.trim(), type: 'category' }),
          });
          parentId = catRes.channel?.id;
        }
        if (customTextChannel.trim()) {
          await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: customTextChannel.trim(),
              type: 'text',
              parentId,
              topic: 'Dedicated channel for bot commands and integrations.',
            }),
          });
          createdNames.push(customTextChannel.trim());
        }
        if (customVoiceChannel.trim()) {
          await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: customVoiceChannel.trim(),
              type: 'voice',
              parentId,
            }),
          });
          createdNames.push(customVoiceChannel.trim());
        }
        toast.success(`Created ${createdNames.join(', ')} successfully.`);
        setCustomCategoryName('');
        setCustomTextChannel('');
        setCustomVoiceChannel('');
        setCustomRoomBotIds([]);
        fetchIntegrations();
      } catch (err: any) {
        toast.error(err.message || 'Could not create custom bot channels.');
      }
    } finally {
      setCreatingCustomRoom(false);
    }
  };

  const handleApplyPreset = async (preset: BotPresetItem) => {
    if (!guildId) return;
    setApplyingPresetId(preset.id);
    try {
      const data = await safeJsonFetch(`/api/guilds/${guildId}/integrations/presets/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: preset.id }),
      });
      toast.success(`Created ${data.createdChannels.join(', ')} for ${preset.title}.`);
      fetchIntegrations();
    } catch {
      try {
        const createdNames: string[] = [];
        if (preset.id === 'voice_bot_lounge') {
          const catRes = await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '🔊 AUDIO & VOICE BOTS', type: 'category' }),
          });
          const parentId = catRes.channel?.id;
          await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: '🎛️・audio-controls',
              type: 'text',
              parentId,
              topic: 'Use audio and voice bot commands here.',
            }),
          });
          await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '🔊 Bot Audio Lounge', type: 'voice', parentId }),
          });
          createdNames.push('🎛️・audio-controls', '🔊 Bot Audio Lounge');
        } else if (preset.id === 'interactive_bot_zone') {
          const catRes = await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '🤖 BOT ACTIVITIES', type: 'category' }),
          });
          const parentId = catRes.channel?.id;
          await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '🤖・bot-activities', type: 'text', parentId }),
          });
          await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '📊・rank-and-stats', type: 'text', parentId }),
          });
          createdNames.push('🤖・bot-activities', '📊・rank-and-stats');
        } else {
          await safeJsonFetch(`/api/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: '🤖・bot-commands',
              type: 'text',
              topic: 'Dedicated sandbox for third-party bot commands and slash utilities.',
            }),
          });
          createdNames.push('🤖・bot-commands');
        }

        toast.success(`Created ${createdNames.join(', ')} for ${preset.title}.`);
        fetchIntegrations();
      } catch (err: any) {
        toast.error(err.message || 'Could not create preset channels.');
      }
    } finally {
      setApplyingPresetId(null);
    }
  };

  const handleConfirmKickBot = async () => {
    if (!kickBotTarget || !guildId) return;
    try {
      await safeJsonFetch(`/api/guilds/${guildId}/integrations/${kickBotTarget.id}`, {
        method: 'DELETE',
      });
      setBots((prev) => prev.filter((b) => b.id !== kickBotTarget.id));
      toast.success(`${kickBotTarget.displayName} has been removed from the server.`);
    } catch {
      try {
        await safeJsonFetch(`/api/guilds/${guildId}/members/${kickBotTarget.id}/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Removed bot via ArchiBot Dashboard' }),
        });
        setBots((prev) => prev.filter((b) => b.id !== kickBotTarget.id));
        toast.success(`${kickBotTarget.displayName} has been removed from the server.`);
      } catch (err: any) {
        toast.error(err.message || 'Could not remove bot from the server.');
      }
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
        description="Universal control center for all bots in your server — manage roles, nicknames, command prefixes, channel access permissions, and security privileges from one place."
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
              icon="person_add"
              onClick={() => setTabIndex(3)}
            >
              Add Bot / Create Sandbox
            </MdButton>
          </div>
        }
      />

      {/* Top Universal Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-discord-muted">
                Total Installed Bots
              </div>
              <div className="text-2xl font-normal text-discord-white mt-1">{stats.total}</div>
              <div className="text-xs text-discord-muted mt-1">
                {stats.thirdPartyCount} external + ArchiBot
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
                Active & Online
              </div>
              <div className="text-2xl font-normal text-discord-white mt-1">
                {stats.onlineCount}
              </div>
              <div className="text-xs text-discord-muted mt-1">
                Connected & responding in guild
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center text-discord-green">
              <MdIcon name="sensors" className="text-xl" />
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
                Scoped to specific channels
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
                  ? 'All external bots scoped safely'
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
          { id: 'sandboxes', label: 'Channel Access', icon: 'lock_person' },
          { id: 'commands', label: 'Command Registry', icon: 'terminal' },
          { id: 'builder', label: 'Add Bot & Rooms', icon: 'add_circle' },
        ]}
        activeIndex={tabIndex}
        onChange={setTabIndex}
      />

      {/* TAB 0: INSTALLED BOTS (UNIVERSAL ROSTER) */}
      {tabIndex === 0 && (
        <div className="space-y-4">
          <SurfaceCard>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Bots', icon: 'apps' },
                  { id: 'moderation', label: 'Moderation', icon: 'shield' },
                  { id: 'utility', label: 'Utility', icon: 'build' },
                  { id: 'ai', label: 'AI & Webhooks', icon: 'auto_awesome' },
                  { id: 'music', label: 'Audio & Voice', icon: 'graphic_eq' },
                  { id: 'gaming', label: 'Games', icon: 'sports_esports' },
                  { id: 'economy', label: 'Economy & XP', icon: 'monitoring' },
                  { id: 'custom', label: 'Custom', icon: 'smart_toy' },
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
                  label="Search bot name, ID, or prefix..."
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
              description="Try clearing your search filter or authorize a new bot in the Add Bot & Rooms tab."
              action={
                <MdButton variant="tonal" icon="person_add" onClick={() => setTabIndex(3)}>
                  Add Bot to Server
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
                              {bot.isSelf && <StatusBadge label="Primary Engine" tone="blurple" />}
                            </div>
                            <div className="text-xs text-discord-muted mt-0.5 flex flex-wrap items-center gap-2">
                              <span>@{bot.username}</span>
                              <span>•</span>
                              <span>ID: {bot.id}</span>
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
                            bot.roles.slice(0, 5).map((r) => <Badge key={r.id}>{r.name}</Badge>)
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
                                ch • Restricted in{' '}
                                <span className="text-discord-white">
                                  {bot.blockedChannelIds.length}
                                </span>{' '}
                                ch
                              </span>
                            ) : (
                              <span>Default access (follows role permissions)</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <MdButton
                              size="sm"
                              variant="tonal"
                              icon="lock_person"
                              onClick={() => openSandboxModal(bot)}
                            >
                              Channels
                            </MdButton>
                            <MdButton
                              size="sm"
                              variant="outlined"
                              icon="edit"
                              onClick={() => openManageModal(bot)}
                            >
                              Configure
                            </MdButton>
                            <MdIconButton
                              icon="open_in_new"
                              title="Re-authorize / OAuth2 Link"
                              onClick={() => handleOpenBotAuthorize(bot.id, 'standard')}
                            />
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

      {/* TAB 1: UNIVERSAL CHANNEL ACCESS & SANDBOXES */}
      {tabIndex === 1 && (
        <div className="space-y-4">
          <SurfaceCard
            title="Universal Channel Access & Sandbox Control"
            subtitle="Control exactly which text and voice channels each bot is allowed to read, message, or connect to — preventing unwanted bot responses in general chat."
            headerAction={
              <MdButton
                size="sm"
                variant="tonal"
                icon="add_circle"
                onClick={() => setTabIndex(3)}
              >
                Create Bot Channel
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
                            <StatusBadge label="Custom Channel Scope" tone="green" />
                          ) : (
                            <StatusBadge label="Default Role Scope" tone="neutral" />
                          )}
                        </div>
                        <div className="text-xs text-discord-muted mt-1 flex flex-wrap items-center gap-1.5">
                          {allowedNames.length > 0 ? (
                            <>
                              <span>Explicitly allowed in:</span>
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
                            <span>No explicit channel whitelist configured yet.</span>
                          )}
                          {blockedCount > 0 && (
                            <span className="text-discord-muted">
                              • Restricted in {blockedCount} channel{blockedCount > 1 ? 's' : ''}
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
                        Manage Channel Access
                      </MdButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* TAB 2: UNIVERSAL COMMAND & PREFIX REGISTRY */}
      {tabIndex === 2 && (
        <div className="space-y-4">
          <SurfaceCard
            title="Universal Bot Command & Prefix Registry"
            subtitle="Document prefixes, key slash commands, and usage notes for every bot in your server, then publish an automated Server Bot Directory embed to Discord."
            headerAction={
              <MdButton
                variant="filled"
                icon="send"
                onClick={() => setPublishModalOpen(true)}
              >
                Publish Directory to Discord
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

                        {Array.isArray(bot.commands) && bot.commands.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[11px] text-discord-muted">Commands:</span>
                            {bot.commands.map((cmd) => (
                              <code
                                key={cmd}
                                className="px-1.5 py-0.5 rounded text-[11px] bg-discord-card border border-discord-border text-discord-white"
                              >
                                {cmd}
                              </code>
                            ))}
                          </div>
                        )}

                        {bot.dangerousPermissions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[11px] text-discord-muted">
                              Elevated Permissions:
                            </span>
                            {bot.dangerousPermissions.slice(0, 6).map((perm) => (
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
                        Edit Prefix & Commands
                      </MdButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* TAB 3: UNIVERSAL ADD BOT (BY CLIENT ID / URL) & CUSTOM SANDBOX ROOM BUILDER */}
      {tabIndex === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 1. Universal OAuth2 Bot Invite Generator */}
            <SurfaceCard
              title="Authorize Any Discord Bot (OAuth2 Generator)"
              subtitle="Invite any public or custom Discord bot directly into this server using its Application / Client ID or OAuth2 invite link."
            >
              <div className="space-y-4">
                <MdTextField
                  label="Bot Application / Client ID or Invite URL"
                  value={inviteClientId}
                  onChange={setInviteClientId}
                  placeholder="e.g. 123456789012345678 or https://discord.com/oauth2/authorize..."
                  icon="smart_toy"
                />

                <MdSelect
                  label="Initial Permission Scope"
                  value={invitePermLevel}
                  onChange={setInvitePermLevel}
                  options={[
                    {
                      value: 'minimal',
                      label: 'Minimal Safe Scope (View, Send Messages, Embeds & Slash Commands)',
                    },
                    {
                      value: 'voice',
                      label: 'Audio & Voice Scope (View, Connect, Speak & Voice Activity)',
                    },
                    {
                      value: 'standard',
                      label: 'Standard Utility & Moderation Scope',
                    },
                    {
                      value: 'admin',
                      label: 'Full Administrator (Only for trusted bots)',
                    },
                  ]}
                />

                <div className="flex items-center justify-end pt-1">
                  <MdButton
                    variant="filled"
                    icon="open_in_new"
                    onClick={() => handleOpenBotAuthorize(inviteClientId, invitePermLevel)}
                  >
                    Authorize Bot to Server
                  </MdButton>
                </div>
              </div>
            </SurfaceCard>

            {/* 2. Universal Custom Bot Room & Category Builder */}
            <SurfaceCard
              title="Custom Bot Room & Sandbox Builder"
              subtitle="Create custom text or voice channels for any bot workflow and immediately grant channel access to selected bots."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MdTextField
                    label="Category Name (Optional)"
                    value={customCategoryName}
                    onChange={setCustomCategoryName}
                    placeholder="e.g. 🤖 BOT ZONE"
                  />
                  <MdTextField
                    label="Text Channel Name"
                    value={customTextChannel}
                    onChange={setCustomTextChannel}
                    placeholder="e.g. 🤖・bot-commands"
                  />
                  <MdTextField
                    label="Voice Channel (Optional)"
                    value={customVoiceChannel}
                    onChange={setCustomVoiceChannel}
                    placeholder="e.g. 🔊 Bot Lounge"
                  />
                </div>

                <div>
                  <div className="text-xs text-discord-muted mb-2">
                    Grant Channel Access to Installed Bots (Optional):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 rounded-xl bg-discord-surface border border-discord-border">
                    {bots.map((b) => {
                      const selected = customRoomBotIds.includes(b.id);
                      return (
                        <MdChip
                          key={b.id}
                          label={b.displayName}
                          selected={selected}
                          onClick={() =>
                            setCustomRoomBotIds((prev) =>
                              prev.includes(b.id)
                                ? prev.filter((id) => id !== b.id)
                                : [...prev, b.id]
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <MdButton
                    variant="filled"
                    icon="add_circle"
                    loading={creatingCustomRoom}
                    onClick={handleCreateCustomBotRoom}
                  >
                    Create Bot Channels
                  </MdButton>
                </div>
              </div>
            </SurfaceCard>
          </div>

          {/* 3. Generic 1-Click Bot Sandbox Templates */}
          <div>
            <SectionHeader title="Quick Sandbox Environment Templates" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <SurfaceCard key={preset.id}>
                  <div className="flex flex-col justify-between h-full gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center text-discord-blurple">
                          <MdIcon name={preset.icon} className="text-xl" />
                        </div>
                        <StatusBadge label="1-Click Template" tone="blurple" />
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
                      variant="tonal"
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
        </div>
      )}

      {/* MODAL 1: CONFIGURE BOT METADATA, PREFIX, COMMANDS & ROLES */}
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
                placeholder="e.g. / or ! or ?"
              />
            </div>

            <MdSelect
              label="Bot Functional Category"
              value={editCategory}
              onChange={(val) => setEditCategory(val as BotCategory)}
              options={[
                { value: 'moderation', label: 'Moderation & Security' },
                { value: 'utility', label: 'Utility & Automation' },
                { value: 'ai', label: 'AI & Webhook Integration' },
                { value: 'music', label: 'Audio & Voice' },
                { value: 'gaming', label: 'Games & Entertainment' },
                { value: 'economy', label: 'Economy & Leveling' },
                { value: 'core', label: 'Core & System' },
                { value: 'custom', label: 'Custom / Other' },
              ]}
            />

            <MdTextField
              label="Key Commands (Comma-separated)"
              value={editCommandsText}
              onChange={setEditCommandsText}
              placeholder="e.g. /help, /settings, /play, /ticket"
            />

            <MdTextField
              type="textarea"
              rows={3}
              label="Usage Notes (Displayed in Server Bot Directory)"
              value={editNotes}
              onChange={setEditNotes}
              placeholder="Describe what members or staff can do with this bot..."
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
          sandboxBot ? `Channel Access — ${sandboxBot.displayName}` : 'Channel Access'
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
              <span className="text-discord-green">Allowed</span> to access or{' '}
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
            ArchiBot will generate a formatted Discord embed listing all installed bots in your server grouped by category, including each bot&apos;s command prefix, registered commands, and designated channels.
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
            ? `Are you sure you want to kick ${kickBotTarget.displayName} (@${kickBotTarget.username}) from the server? You can always re-authorize it later.`
            : ''
        }
        confirmLabel="Remove Bot"
        danger
      />
    </div>
  );
};
