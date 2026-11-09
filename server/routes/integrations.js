import { Router } from 'express';
import {
  ChannelType,
  EmbedBuilder,
  OverwriteType,
  PermissionFlagsBits,
} from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { client, state, saveState, DANGEROUS_PERMS } from '../botClient.js';

const router = Router();
router.use(verifySession);

const KNOWN_BOT_PATTERNS = [
  {
    match: /lofi|jockie|fredboat|uzox|flavi|chip|green-bot|pancake|rythm|groovy|hydra|vexera|music|radio|24\/7|spotify/i,
    category: 'music',
    defaultPrefix: '/',
    defaultNotes: 'Play music, 24/7 radio streams, and manage voice queues.',
  },
  {
    match: /karuta|mudae|poketwo|poké|dank\s*memer|owo|idle\s*rpg|epic\s*rpg|ani\s*game|virtual\s*fisher|gacha|trivia|akinator|truth\s*or\s*dare|counting|wordle|uno/i,
    category: 'gaming',
    defaultPrefix: '!',
    defaultNotes: 'Interactive chat minigames, card drops, and leaderboards.',
  },
  {
    match: /dyno|carl|mee6|probot|wick|vortex|sapphire|security|automod|double\s*counter|pandez|modmail|ticket\s*tool|arcane|statbot/i,
    category: 'moderation',
    defaultPrefix: '?',
    defaultNotes: 'Server moderation, logging, reaction roles, and utilities.',
  },
  {
    match: /unbelievaboat|tatsu|taiko|economy|casino|blackjack|bank/i,
    category: 'economy',
    defaultPrefix: '!',
    defaultNotes: 'Server currency, daily rewards, and shop leaderboards.',
  },
];

export const RECOMMENDED_BOTS = [
  {
    id: 'lofi-radio',
    name: 'Lofi Radio 24/7',
    category: 'music',
    prefix: '/play',
    badge: '24/7 Chill Beats',
    description: 'High-quality 24/7 Lofi Hip-Hop beats for study, coding, and chill voice lounges.',
    recommendedChannel: '🔊 Lofi Radio 24/7',
    inviteUrl: 'https://top.gg/bot/712351084597968907',
    commands: ['/play', '/station', '/247', '/volume'],
  },
  {
    id: 'jockie-music',
    name: 'Jockie Music',
    category: 'music',
    prefix: 'm!play',
    badge: 'Multi-Instance Music',
    description: 'Feature-rich multi-source music bot supporting playlists, filters, and multiple voice channels.',
    recommendedChannel: '🎵・music-requests',
    inviteUrl: 'https://www.jockiemusic.com/',
    commands: ['m!play <song>', 'm!skip', 'm!queue', 'm!leave'],
  },
  {
    id: 'green-bot',
    name: 'Green-bot',
    category: 'music',
    prefix: '/play',
    badge: '24/7 Audio & Filters',
    description: 'Clean slash-command music player with bassboost, nightcore filters, and dedicated request channels.',
    recommendedChannel: '🎵・music-requests',
    inviteUrl: 'https://green-bot.app/',
    commands: ['/play', '/filter', '/autoplay', '/stop'],
  },
  {
    id: 'karuta',
    name: 'Karuta',
    category: 'gaming',
    prefix: 'k!',
    badge: 'Anime Card TCG',
    description: 'Collect, trade, and upgrade over 90,000 anime characters with custom frames and dyes.',
    recommendedChannel: '🃏・karuta-drops',
    inviteUrl: 'https://karuta.com/',
    commands: ['k!drop', 'k!collection', 'k!view', 'k!daily'],
  },
  {
    id: 'mudae',
    name: 'Mudae',
    category: 'gaming',
    prefix: '$',
    badge: 'Waifu / Husbando Gacha',
    description: 'Roll and claim characters from anime and video games, plus multiplayer tea party word games.',
    recommendedChannel: '🎰・mudae-rolls',
    inviteUrl: 'https://top.gg/bot/432610292342587392',
    commands: ['$wa', '$ha', '$wg', '$tu'],
  },
  {
    id: 'dank-memer',
    name: 'Dank Memer',
    category: 'economy',
    prefix: '/pls',
    badge: 'Global Economy & Memes',
    description: 'Massive global currency game featuring fishing, farming, pets, heists, and interactive minigames.',
    recommendedChannel: '🐸・dank-memer',
    inviteUrl: 'https://dankmemer.lol/',
    commands: ['/beg', '/fish', '/dig', '/balance'],
  },
  {
    id: 'poketwo',
    name: 'Pokétwo',
    category: 'gaming',
    prefix: '@Pokétwo',
    badge: 'Catch & Battle',
    description: 'Spawn wild Pokémon as members chat, catch them, trade on the market, and battle friends.',
    recommendedChannel: '⚡・poketwo-spawns',
    inviteUrl: 'https://poketwo.net/',
    commands: ['@Pokétwo catch <name>', '@Pokétwo hint', '@Pokétwo pokemon', '@Pokétwo market'],
  },
  {
    id: 'owo-bot',
    name: 'OwO',
    category: 'gaming',
    prefix: 'owo ',
    badge: 'Zoo & Battle RPG',
    description: 'Hunt animals, build a weaponized zoo team, battle other members, and climb global leaderboards.',
    recommendedChannel: '🐾・owo-hunting',
    inviteUrl: 'https://top.gg/bot/408785106942164992',
    commands: ['owo hunt', 'owo battle', 'owo zoo', 'owo daily'],
  },
];

export const BOT_ENVIRONMENT_PRESETS = [
  {
    id: 'lofi_music',
    title: 'Lofi & Music Studio Lounge',
    category: 'music',
    icon: 'headphones',
    description: 'Creates a dedicated "LOFI & MUSIC LOUNGE" category with #music-requests, 🔊 Lofi Radio 24/7, and 🎶 Music Stage.',
    channelsPreview: ['🎵・music-requests', '🔊 Lofi Radio 24/7', '🎶 Music Lounge'],
  },
  {
    id: 'gaming_arcade',
    title: 'Minigame & Gacha Arcade',
    category: 'gaming',
    icon: 'sports_esports',
    description: 'Creates a dedicated "MINIGAME ARCADE" category with isolated channels for Karuta, Mudae, Dank Memer, and Pokétwo.',
    channelsPreview: ['🎮・bot-arcade', '🃏・gacha-drops', '🐸・economy-grind'],
  },
  {
    id: 'bot_sandbox',
    title: 'Dedicated Bot Sandbox',
    category: 'utility',
    icon: 'terminal',
    description: 'Creates a clean #bot-commands sandbox channel so third-party bot commands never clutter your main general chat.',
    channelsPreview: ['🤖・bot-commands', '📋・bot-directory'],
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
  for (const rule of KNOWN_BOT_PATTERNS) {
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
    notes: 'Slash commands and server automation.',
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

  // Inspect existing channel-level member overwrites to see where bot is already explicitly allowed/blocked
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
      recommendedBots: RECOMMENDED_BOTS,
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
    if (Array.isArray(allowedChannelIds)) currentMeta.allowedChannelIds = allowedChannelIds;
    if (Array.isArray(blockedChannelIds)) currentMeta.blockedChannelIds = blockedChannelIds;

    savedIntegrations[botId] = currentMeta;
    saveState();

    if (nickname !== undefined && nickname !== member.nickname) {
      await member.setNickname(nickname ? nickname.trim() : null, 'Updated via ArchiBot Bot Integrations Studio');
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
  await guild.members.fetch().catch(() => {});

  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isTextBased()) {
    return res.status(404).json({ error: 'Target text channel not found.' });
  }

  const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);
  const bots = [...guild.members.cache.values()]
    .filter((m) => m.user.bot)
    .map((m) => formatBotMember(m, guild, savedIntegrations[m.id] || {}));

  const categoryLabels = {
    core: '⚙️ Core Server Engine',
    music: '🎵 Music & Lofi Radio Bots',
    gaming: '🎮 Minigame & Gacha Bots',
    economy: '🪙 Economy & Currency Bots',
    moderation: '🛡️ Moderation & Security Bots',
    utility: '🔧 Utility & Automation Bots',
  };

  const grouped = {};
  for (const b of bots) {
    const cat = b.category || 'utility';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title?.trim() || `🤖 ${guild.name} — Bot Directory & Command Guide`)
    .setDescription(
      description?.trim() ||
        'Use the right prefix and designated channels below when interacting with bots in our server.'
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
      return `• **${b.displayName}** (\`${b.prefix || '/'}\`) — ${b.notes || 'Server bot'}${channelHint}`;
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
  const { presetId } = req.body;

  await guild.channels.fetch().catch(() => {});

  try {
    const createdChannels = [];

    if (presetId === 'lofi_music') {
      const category = await guild.channels.create({
        name: '🎧 LOFI & MUSIC LOUNGE',
        type: ChannelType.GuildCategory,
        reason: 'ArchiBot Bot Integrations Preset: Lofi & Music Lounge',
      });

      const textCh = await guild.channels.create({
        name: '🎵・music-requests',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Type /play or music bot commands here to queue songs and Lofi streams.',
      });

      const lofiVoice = await guild.channels.create({
        name: '🔊 Lofi Radio 24/7',
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      const stageVoice = await guild.channels.create({
        name: '🎶 Music Lounge',
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      createdChannels.push(textCh.name, lofiVoice.name, stageVoice.name);
    } else if (presetId === 'gaming_arcade') {
      const category = await guild.channels.create({
        name: '🎮 MINIGAME ARCADE',
        type: ChannelType.GuildCategory,
        reason: 'ArchiBot Bot Integrations Preset: Minigame Arcade',
      });

      const ch1 = await guild.channels.create({
        name: '🎮・bot-arcade',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'General chat games, trivia, Pokétwo, and OwO commands.',
      });

      const ch2 = await guild.channels.create({
        name: '🃏・gacha-drops',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Dedicated room for Karuta (k!d) and Mudae ($wa / $ha) card rolls.',
      });

      const ch3 = await guild.channels.create({
        name: '🐸・economy-grind',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Dank Memer, UnbelievaBoat, and currency grinding commands.',
      });

      createdChannels.push(ch1.name, ch2.name, ch3.name);
    } else if (presetId === 'bot_sandbox') {
      const sandboxCh = await guild.channels.create({
        name: '🤖・bot-commands',
        type: ChannelType.GuildText,
        topic: 'Dedicated sandbox for third-party bot commands and slash utilities.',
        reason: 'ArchiBot Bot Integrations Preset: Dedicated Bot Sandbox',
      });
      createdChannels.push(sandboxCh.name);
    } else {
      return res.status(400).json({ error: 'Unknown preset ID.' });
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
    await member.kick('Removed third-party bot via ArchiBot Bot Integrations Studio');
    const savedIntegrations = ensureGuildBotIntegrationsState(guild.id);
    delete savedIntegrations[botId];
    saveState();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to remove bot from server.' });
  }
});

export default router;
