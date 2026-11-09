import { Router } from 'express';
import {
  ChannelType,
  EmbedBuilder,
  OverwriteType,
  PermissionFlagsBits,
} from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { client, state, saveState } from '../botClient.js';

const router = Router();
router.use(verifySession);

const UNIVERSAL_CATEGORY_PATTERNS = [
  {
    match: /dyno|carl|mee6|probot|wick|vortex|sapphire|security|automod|double\s*counter|pandez|modmail|ticket|logger|audit|guard|shield|mod/i,
    category: 'moderation',
    defaultPrefix: '/',
    defaultNotes: 'Server moderation, security, logging, and automated protection.',
  },
  {
    match: /music|radio|audio|sound|voice|lofi|jockie|fredboat|uzox|flavi|chip|green-bot|pancake|rythm|hydra|vexera|spotify|tts/i,
    category: 'music',
    defaultPrefix: '/',
    defaultNotes: 'Voice channel audio, radio streaming, and sound utilities.',
  },
  {
    match: /game|rpg|gacha|trivia|card|arcade|play|karuta|mudae|poketwo|poké|dank|owo|fisher|akinator|counting|wordle|uno/i,
    category: 'gaming',
    defaultPrefix: '/',
    defaultNotes: 'Interactive chat games, multiplayer activities, and entertainment.',
  },
  {
    match: /economy|level|xp|rank|coin|bank|shop|currency|unbelievaboat|tatsu|arcane/i,
    category: 'economy',
    defaultPrefix: '/',
    defaultNotes: 'Server leveling, XP progression, and community rewards.',
  },
  {
    match: /ai|gpt|claude|gemini|midjourney|chat|assistant|translate|webhook|github|notify|rss/i,
    category: 'ai',
    defaultPrefix: '/',
    defaultNotes: 'AI assistant, external webhook integration, and automated feeds.',
  },
];

export const BOT_ENVIRONMENT_PRESETS = [
  {
    id: 'bot_sandbox',
    title: 'Dedicated Bot Command Sandbox',
    category: 'utility',
    icon: 'terminal',
    description: 'Creates a dedicated #bot-commands text channel so bot interactions and slash commands stay organized away from general chat.',
    channelsPreview: ['🤖・bot-commands'],
  },
  {
    id: 'voice_bot_lounge',
    title: 'Audio & Voice Bot Lounge',
    category: 'music',
    icon: 'graphic_eq',
    description: 'Creates an "AUDIO & VOICE BOTS" category with a #audio-controls text channel and a dedicated 🔊 Bot Audio Stage voice room.',
    channelsPreview: ['🎛️・audio-controls', '🔊 Bot Audio Lounge'],
  },
  {
    id: 'interactive_bot_zone',
    title: 'Interactive & Activity Bot Zone',
    category: 'gaming',
    icon: 'extension',
    description: 'Creates a "BOT ACTIVITIES" category with isolated channels for interactive bots, leveling checks, and community activities.',
    channelsPreview: ['🤖・bot-activities', '📊・rank-and-stats'],
  },
];

function ensureGuildBotIntegrationsState(guildId) {
  if (!state.guilds) state.guilds = {};
  if (!state.guilds[guildId]) state.guilds[guildId] = {};
  if (!state.guilds[guildId].botIntegrations) {
    state.guilds[guildId].botIntegrations = {};
  }
  return state.guilds[guildId].botIntegrations;
}

function detectBotDefaults(username, displayName) {
  const combined = `${username || ''} ${displayName || ''}`.trim();
  for (const rule of UNIVERSAL_CATEGORY_PATTERNS) {
    if (rule.match.test(combined)) {
      return {
        category: rule.category,
        prefix: rule.defaultPrefix,
        notes: rule.defaultNotes,
      };
    }
  }
  return {
    category: 'utility',
    prefix: '/',
    notes: 'Slash commands, utilities, and server automation.',
  };
}

function analyzeBotPermissions(member) {
  try {
    const perms = member.permissions;
    if (!perms || typeof perms.has !== 'function') {
      return { isAdmin: false, riskLevel: 'safe', dangerousPermissions: [] };
    }
    const isAdmin = perms.has(PermissionFlagsBits.Administrator);
    const dangerousList = [];

    const checks = [
      [PermissionFlagsBits.Administrator, 'Administrator'],
      [PermissionFlagsBits.ManageGuild, 'Manage Server'],
      [PermissionFlagsBits.ManageRoles, 'Manage Roles'],
      [PermissionFlagsBits.ManageChannels, 'Manage Channels'],
      [PermissionFlagsBits.ManageWebhooks, 'Manage Webhooks'],
      [PermissionFlagsBits.BanMembers, 'Ban Members'],
      [PermissionFlagsBits.KickMembers, 'Kick Members'],
      [PermissionFlagsBits.MentionEveryone, 'Mention Everyone'],
      [PermissionFlagsBits.ManageMessages, 'Manage Messages'],
    ];

    for (const [bit, label] of checks) {
      if (perms.has(bit)) {
        dangerousList.push(label);
      }
    }

    let riskLevel = 'safe';
    if (
      isAdmin ||
      perms.has(PermissionFlagsBits.ManageGuild) ||
      perms.has(PermissionFlagsBits.ManageRoles) ||
      perms.has(PermissionFlagsBits.BanMembers)
    ) {
      riskLevel = 'high';
    } else if (dangerousList.length > 0) {
      riskLevel = 'medium';
    }

    return {
      isAdmin,
      riskLevel,
      dangerousPermissions: dangerousList,
    };
  } catch {
    return { isAdmin: false, riskLevel: 'safe', dangerousPermissions: [] };
  }
}

function formatBotMember(member, guild, savedMeta = {}) {
  const isSelf = member.id === client.user?.id;
  const detected = detectBotDefaults(member.user?.username, member.displayName);
  const permAudit = analyzeBotPermissions(member);

  const roles = [...(member.roles?.cache?.values() || [])]
    .filter((r) => r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: r.hexColor === '#000000' ? null : r.hexColor,
      managed: Boolean(r.managed),
    }));

  const explicitAllowed = new Set(Array.isArray(savedMeta.allowedChannelIds) ? savedMeta.allowedChannelIds : []);
  const explicitBlocked = new Set(Array.isArray(savedMeta.blockedChannelIds) ? savedMeta.blockedChannelIds : []);

  for (const ch of guild.channels?.cache?.values() || []) {
    if (ch.type === ChannelType.GuildCategory || !ch.permissionOverwrites?.cache) continue;
    const ow = ch.permissionOverwrites.cache.get(member.id);
    if (!ow) continue;
    if (
      ow.deny?.has(PermissionFlagsBits.ViewChannel) ||
      ow.deny?.has(PermissionFlagsBits.SendMessages) ||
      ow.deny?.has(PermissionFlagsBits.Connect)
    ) {
      explicitBlocked.add(ch.id);
    } else if (
      ow.allow?.has(PermissionFlagsBits.ViewChannel) ||
      ow.allow?.has(PermissionFlagsBits.SendMessages) ||
      ow.allow?.has(PermissionFlagsBits.Connect)
    ) {
      explicitAllowed.add(ch.id);
    }
  }

  return {
    id: member.id,
    username: member.user?.username || member.displayName || 'bot',
    displayName: member.displayName || member.user?.username || 'Bot',
    nickname: member.nickname || null,
    avatar: member.user?.displayAvatarURL ? member.user.displayAvatarURL({ size: 128 }) : '',
    joinedAt: member.joinedTimestamp || null,
    isSelf,
    status: member.presence?.status || 'online',
    category: isSelf ? 'core' : savedMeta.category || detected.category,
    prefix: isSelf ? '/' : savedMeta.prefix ?? detected.prefix,
    commands: Array.isArray(savedMeta.commands) ? savedMeta.commands : [],
    notes: isSelf
      ? 'Primary server architecture, templates, analytics, and community engine.'
      : savedMeta.notes ?? detected.notes,
    allowedChannelIds: [...explicitAllowed],
    blockedChannelIds: [...explicitBlocked],
    isSandboxed: explicitAllowed.size > 0 || explicitBlocked.size > 0,
    roles,
    ...permAudit,
  };
}

// GET /api/guilds/:guildId/integrations
router.get('/:guildId/integrations', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  try {
    if (guild.members.cache.size < guild.memberCount) {
      await guild.members.fetch({ limit: 200 }).catch(() => {});
    }
    await guild.channels.fetch().catch(() => {});
    await guild.roles.fetch().catch(() => {});

    const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);

    const bots = [...guild.members.cache.values()]
      .filter((m) => m.user?.bot)
      .map((m) => formatBotMember(m, guild, savedIntegrations[m.id] || {}))
      .sort((a, b) => {
        if (a.isSelf && !b.isSelf) return -1;
        if (!a.isSelf && b.isSelf) return 1;
        return a.displayName.localeCompare(b.displayName);
      });

    const channels = [...guild.channels.cache.values()]
      .filter(
        (c) =>
          c.type === ChannelType.GuildText ||
          c.type === ChannelType.GuildVoice ||
          c.type === ChannelType.GuildStageVoice ||
          c.type === ChannelType.GuildAnnouncement
      )
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type:
          c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
            ? 'voice'
            : 'text',
        parentName: c.parent?.name || null,
      }));

    const assignableRoles = [...guild.roles.cache.values()]
      .filter((r) => r.id !== guild.id && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor === '#000000' ? null : r.hexColor,
      }));

    return res.json({
      bots,
      channels,
      assignableRoles,
      presets: BOT_ENVIRONMENT_PRESETS,
    });
  } catch (err) {
    return res.status(500).json({
      error: `Failed to fetch bot integrations: ${err.message}`,
    });
  }
});

// PATCH /api/guilds/:guildId/integrations/:botId
router.patch('/:guildId/integrations/:botId', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { botId } = req.params;
  const {
    nickname,
    category,
    prefix,
    commands,
    notes,
    addRoles,
    removeRoles,
    allowedChannelIds,
    blockedChannelIds,
  } = req.body;

  const member = await guild.members.fetch(botId).catch(() => null);
  if (!member || !member.user.bot) {
    return res.status(404).json({ error: 'Bot member not found in this server.' });
  }

  try {
    const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);
    const currentMeta = savedIntegrations[botId] || {};

    if (category !== undefined) currentMeta.category = String(category).trim();
    if (prefix !== undefined) currentMeta.prefix = String(prefix).trim();
    if (notes !== undefined) currentMeta.notes = String(notes).trim();
    if (Array.isArray(commands)) currentMeta.commands = commands.map((c) => String(c).trim()).filter(Boolean);
    if (Array.isArray(allowedChannelIds)) currentMeta.allowedChannelIds = allowedChannelIds;
    if (Array.isArray(blockedChannelIds)) currentMeta.blockedChannelIds = blockedChannelIds;

    savedIntegrations[botId] = currentMeta;
    saveState();

    if (nickname !== undefined && nickname !== member.nickname) {
      await member.setNickname(nickname ? nickname.trim() : null, 'Updated via ArchiBot Bot Integrations');
    }

    if (Array.isArray(addRoles) && addRoles.length > 0) {
      await member.roles.add(addRoles, 'Bot role assigned via ArchiBot Dashboard');
    }

    if (Array.isArray(removeRoles) && removeRoles.length > 0) {
      await member.roles.remove(removeRoles, 'Bot role removed via ArchiBot Dashboard');
    }

    const updated = await guild.members.fetch(botId);
    res.json({
      success: true,
      bot: formatBotMember(updated, guild, savedIntegrations[botId]),
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Failed to update bot integration settings.',
    });
  }
});

// POST /api/guilds/:guildId/integrations/:botId/isolate
router.post('/:guildId/integrations/:botId/isolate', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { botId } = req.params;
  const { allowedChannelIds = [], blockedChannelIds = [], restrictOtherTextChannels = false } = req.body;

  const member = await guild.members.fetch(botId).catch(() => null);
  if (!member || !member.user.bot) {
    return res.status(404).json({ error: 'Bot member not found in this server.' });
  }

  await guild.channels.fetch().catch(() => {});

  const allowedSet = new Set(Array.isArray(allowedChannelIds) ? allowedChannelIds : []);
  const blockedSet = new Set(Array.isArray(blockedChannelIds) ? blockedChannelIds : []);

  if (restrictOtherTextChannels && allowedSet.size > 0) {
    for (const ch of guild.channels.cache.values()) {
      if (ch.type === ChannelType.GuildText && !allowedSet.has(ch.id)) {
        blockedSet.add(ch.id);
      }
    }
  }

  let updatedCount = 0;
  const errors = [];

  for (const ch of guild.channels.cache.values()) {
    if (ch.type === ChannelType.GuildCategory || !ch.permissionOverwrites) continue;
    const isVoice = ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice;

    try {
      if (allowedSet.has(ch.id)) {
        const allowRules = isVoice
          ? { ViewChannel: true, Connect: true, Speak: true }
          : { ViewChannel: true, SendMessages: true, EmbedLinks: true, AttachFiles: true, UseApplicationCommands: true };
        await ch.permissionOverwrites.edit(
          member.id,
          allowRules,
          { type: OverwriteType.Member, reason: `ArchiBot Sandbox: Allowed ${member.user.username}` }
        );
        updatedCount++;
      } else if (blockedSet.has(ch.id)) {
        const denyRules = isVoice
          ? { Connect: false, Speak: false }
          : { SendMessages: false, UseApplicationCommands: false };
        await ch.permissionOverwrites.edit(
          member.id,
          denyRules,
          { type: OverwriteType.Member, reason: `ArchiBot Sandbox: Restricted ${member.user.username}` }
        );
        updatedCount++;
      } else {
        const existingOverwrite = ch.permissionOverwrites.cache.get(member.id);
        if (existingOverwrite) {
          await existingOverwrite.delete(`ArchiBot Sandbox: Cleared custom overwrite for ${member.user.username}`);
          updatedCount++;
        }
      }
    } catch (err) {
      errors.push(`#${ch.name}: ${err.message}`);
    }
  }

  const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);
  savedIntegrations[botId] = {
    ...(savedIntegrations[botId] || {}),
    allowedChannelIds: [...allowedSet],
    blockedChannelIds: [...blockedSet],
  };
  saveState();

  res.json({
    success: true,
    updatedCount,
    errors: errors.slice(0, 5),
    bot: formatBotMember(member, guild, savedIntegrations[botId]),
  });
});

// POST /api/guilds/:guildId/integrations/publish-guide
router.post('/:guildId/integrations/publish-guide', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { channelId, title, description } = req.body;

  if (!channelId) {
    return res.status(400).json({ error: 'Please select a target text channel.' });
  }

  await guild.channels.fetch().catch(() => {});
  if (guild.members.cache.size < guild.memberCount) {
    await guild.members.fetch({ limit: 200 }).catch(() => {});
  }

  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isTextBased()) {
    return res.status(404).json({ error: 'Target text channel not found.' });
  }

  const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);
  const bots = [...guild.members.cache.values()]
    .filter((m) => m.user?.bot)
    .map((m) => formatBotMember(m, guild, savedIntegrations[m.id] || {}));

  const categoryLabels = {
    core: '⚙️ Core & System Bots',
    moderation: '🛡️ Moderation & Security Bots',
    utility: '🔧 Utility & Automation Bots',
    ai: '✨ AI & Webhook Integrations',
    music: '🎵 Audio & Voice Bots',
    gaming: '🎮 Games & Entertainment Bots',
    economy: '🪙 Economy & Leveling Bots',
    custom: '🧩 Custom & Other Bots',
  };

  const grouped = {};
  for (const b of bots) {
    const cat = b.category || 'utility';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title?.trim() || `🤖 ${guild.name} — Server Bot Directory`)
    .setDescription(
      description?.trim() ||
        'Use the designated prefixes and channels below when interacting with bots in our server.'
    )
    .setTimestamp();

  if (guild.iconURL()) {
    embed.setThumbnail(guild.iconURL({ size: 128 }));
  }

  for (const [catKey, label] of Object.entries(categoryLabels)) {
    const list = grouped[catKey];
    if (!list || list.length === 0) continue;

    const lines = list.map((b) => {
      const allowedMentions = (b.allowedChannelIds || [])
        .slice(0, 3)
        .map((id) => `<#${id}>`)
        .join(', ');
      const channelHint = allowedMentions ? ` • 📍 ${allowedMentions}` : '';
      const cmdHint =
        Array.isArray(b.commands) && b.commands.length > 0
          ? ` (${b.commands.slice(0, 4).map((c) => `\`${c}\``).join(', ')})`
          : '';
      return `• **${b.displayName}** (\`${b.prefix || '/'}\`) — ${b.notes || 'Server bot'}${cmdHint}${channelHint}`;
    });

    embed.addFields({
      name: label,
      value: lines.join('\n').slice(0, 1024),
      inline: false,
    });
  }

  try {
    const sent = await channel.send({ embeds: [embed] });
    res.json({
      success: true,
      messageId: sent.id,
      channelName: channel.name,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Failed to publish Bot Directory embed.',
    });
  }
});

// POST /api/guilds/:guildId/integrations/presets/apply
router.post('/:guildId/integrations/presets/apply', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { presetId, customCategoryName, customTextChannel, customVoiceChannel, allowedBotIds = [] } = req.body;

  await guild.channels.fetch().catch(() => {});

  try {
    const createdChannels = [];
    const createdChannelObjects = [];

    if (presetId === 'custom') {
      let parentId = null;
      if (customCategoryName?.trim()) {
        const cat = await guild.channels.create({
          name: customCategoryName.trim(),
          type: ChannelType.GuildCategory,
          reason: 'ArchiBot Bot Integrations: Custom Bot Category',
        });
        parentId = cat.id;
      }

      if (customTextChannel?.trim()) {
        const textCh = await guild.channels.create({
          name: customTextChannel.trim(),
          type: ChannelType.GuildText,
          parent: parentId || undefined,
          topic: 'Dedicated channel for bot commands and integrations.',
        });
        createdChannels.push(textCh.name);
        createdChannelObjects.push(textCh);
      }

      if (customVoiceChannel?.trim()) {
        const voiceCh = await guild.channels.create({
          name: customVoiceChannel.trim(),
          type: ChannelType.GuildVoice,
          parent: parentId || undefined,
        });
        createdChannels.push(voiceCh.name);
        createdChannelObjects.push(voiceCh);
      }
    } else if (presetId === 'voice_bot_lounge') {
      const category = await guild.channels.create({
        name: '🔊 AUDIO & VOICE BOTS',
        type: ChannelType.GuildCategory,
        reason: 'ArchiBot Bot Integrations Preset: Audio & Voice Bots',
      });

      const textCh = await guild.channels.create({
        name: '🎛️・audio-controls',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Use audio and voice bot commands here.',
      });

      const voiceCh = await guild.channels.create({
        name: '🔊 Bot Audio Lounge',
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      createdChannels.push(textCh.name, voiceCh.name);
      createdChannelObjects.push(textCh, voiceCh);
    } else if (presetId === 'interactive_bot_zone') {
      const category = await guild.channels.create({
        name: '🤖 BOT ACTIVITIES',
        type: ChannelType.GuildCategory,
        reason: 'ArchiBot Bot Integrations Preset: Bot Activities',
      });

      const ch1 = await guild.channels.create({
        name: '🤖・bot-activities',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Dedicated channel for interactive bot commands and activities.',
      });

      const ch2 = await guild.channels.create({
        name: '📊・rank-and-stats',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Check your server rank, levels, and bot statistics here.',
      });

      createdChannels.push(ch1.name, ch2.name);
      createdChannelObjects.push(ch1, ch2);
    } else if (presetId === 'bot_sandbox') {
      const sandboxCh = await guild.channels.create({
        name: '🤖・bot-commands',
        type: ChannelType.GuildText,
        topic: 'Dedicated sandbox for third-party bot commands and slash utilities.',
        reason: 'ArchiBot Bot Integrations Preset: Dedicated Bot Sandbox',
      });
      createdChannels.push(sandboxCh.name);
      createdChannelObjects.push(sandboxCh);
    } else {
      return res.status(400).json({ error: 'Unknown preset ID.' });
    }

    // If specific bots were selected, grant them explicit access to the newly created channels
    if (Array.isArray(allowedBotIds) && allowedBotIds.length > 0 && createdChannelObjects.length > 0) {
      const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);
      for (const botId of allowedBotIds) {
        const meta = savedIntegrations[botId] || {};
        const allowedSet = new Set(Array.isArray(meta.allowedChannelIds) ? meta.allowedChannelIds : []);
        for (const ch of createdChannelObjects) {
          allowedSet.add(ch.id);
          const isVoice = ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice;
          await ch.permissionOverwrites
            ?.edit(
              botId,
              isVoice
                ? { ViewChannel: true, Connect: true, Speak: true }
                : { ViewChannel: true, SendMessages: true, EmbedLinks: true, UseApplicationCommands: true },
              { type: OverwriteType.Member, reason: 'ArchiBot Bot Sandbox Assignment' }
            )
            .catch(() => {});
        }
        savedIntegrations[botId] = { ...meta, allowedChannelIds: [...allowedSet] };
      }
      saveState();
    }

    res.json({
      success: true,
      presetId,
      createdChannels,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Failed to apply bot environment preset.',
    });
  }
});

// DELETE /api/guilds/:guildId/integrations/:botId
router.delete('/:guildId/integrations/:botId', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { botId } = req.params;

  if (botId === client.user?.id) {
    return res.status(400).json({ error: 'Cannot kick ArchiBot from its own dashboard.' });
  }

  const member = await guild.members.fetch(botId).catch(() => null);
  if (!member || !member.user.bot) {
    return res.status(404).json({ error: 'Bot member not found in this server.' });
  }

  if (!member.kickable) {
    return res.status(403).json({
      error: 'ArchiBot cannot remove this bot because its highest role is above or equal to ArchiBot.',
    });
  }

  try {
    await member.kick('Removed bot via ArchiBot Bot Integrations');
    const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);
    delete savedIntegrations[botId];
    saveState();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to remove bot from server.' });
  }
});

export default router;
