import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  MessageFlags,
} from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { client, state, saveState } from '../botClient.js';
import { broadcastToGuild } from '../ws.js';

const router = Router();
router.use(verifySession);

const DEFAULT_GIVEAWAY_CONFIG = {
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

function getGuildGiveawayConfig(guildId) {
  state.guilds[guildId] = state.guilds[guildId] ?? {};
  const raw = state.guilds[guildId].giveawayConfig || {};
  return {
    managerRoleId: raw.managerRoleId || null,
    pingRoleId: raw.pingRoleId || null,
    requiredRoleId: raw.requiredRoleId || null,
    excludedRoleId: raw.excludedRoleId || null,
    bypassRoleId: raw.bypassRoleId || null,
    winnerRoleId: raw.winnerRoleId || null,
    minAccountAgeDays: Math.max(0, Number(raw.minAccountAgeDays) || 0),
    minServerDays: Math.max(0, Number(raw.minServerDays) || 0),
    embedColor: raw.embedColor || DEFAULT_GIVEAWAY_CONFIG.embedColor,
    footerText: raw.footerText ?? DEFAULT_GIVEAWAY_CONFIG.footerText,
    embedThumbnailUrl: raw.embedThumbnailUrl || null,
    embedImageUrl: raw.embedImageUrl || null,
    embedFooterIcon: raw.embedFooterIcon || null,
    buttonLabel:
      (raw.buttonLabel === 'Participate' || !raw.buttonLabel)
        ? DEFAULT_GIVEAWAY_CONFIG.buttonLabel
        : raw.buttonLabel,
    buttonEmoji: raw.buttonEmoji ?? DEFAULT_GIVEAWAY_CONFIG.buttonEmoji,
    buttonStyle: ['primary', 'secondary', 'success', 'danger'].includes(raw.buttonStyle)
      ? raw.buttonStyle
      : DEFAULT_GIVEAWAY_CONFIG.buttonStyle,
    showHost: raw.showHost !== undefined ? Boolean(raw.showHost) : true,
    dmWinners: raw.dmWinners !== undefined ? Boolean(raw.dmWinners) : true,
    logChannelId: raw.logChannelId || null,
    multipliersEnabled: Boolean(raw.multipliersEnabled),
    boosterRoleId: raw.boosterRoleId || null,
    boosterMultiplier: Math.max(1, Math.min(10, Number(raw.boosterMultiplier) || 2)),
    claimInstructions: raw.claimInstructions ?? DEFAULT_GIVEAWAY_CONFIG.claimInstructions,
  };
}

function getGuildGiveawaysList(guildId) {
  state.guilds[guildId] = state.guilds[guildId] ?? {};
  if (!Array.isArray(state.guilds[guildId].giveaways)) {
    state.guilds[guildId].giveaways = [];
  }
  return state.guilds[guildId].giveaways;
}

function parseColorInt(hexColor, fallback = 0x5865f2) {
  if (!hexColor || typeof hexColor !== 'string') return fallback;
  const clean = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  const parsed = Number.parseInt(clean, 16);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function mapButtonStyle(styleName) {
  switch (styleName) {
    case 'secondary':
      return ButtonStyle.Secondary;
    case 'success':
      return ButtonStyle.Success;
    case 'danger':
      return ButtonStyle.Danger;
    default:
      return ButtonStyle.Primary;
  }
}

function buildGiveawayDiscordMessage(giveaway, config) {
  const isEnded = giveaway.status === 'ended';
  const endsUnix = Math.floor(new Date(giveaway.endsAt).getTime() / 1000);
  const participantsCount = Array.isArray(giveaway.participants) ? giveaway.participants.length : 0;
  const winners = Array.isArray(giveaway.winners) ? giveaway.winners : [];

  const lines = [];
  if (giveaway.description?.trim()) {
    lines.push(giveaway.description.trim(), '');
  }

  if (isEnded) {
    lines.push(`**Status:** Ended <t:${endsUnix}:R>`);
    if (winners.length > 0) {
      lines.push(`**Winner${winners.length > 1 ? 's' : ''}:** ${winners.map((id) => `<@${id}>`).join(', ')}`);
    } else {
      lines.push('**Winners:** No valid entries');
    }
  } else {
    lines.push('Click the button below to enter this giveaway!', '');
    lines.push(`**Ends:** <t:${endsUnix}:R> (<t:${endsUnix}:f>)`);
    lines.push(`**Winners:** ${giveaway.winnerCount}`);
  }

  lines.push(`**Entries:** ${participantsCount}`);

  if (config.showHost && giveaway.hostId) {
    lines.push(`**Hosted by:** <@${giveaway.hostId}>`);
  }

  const reqRole = giveaway.requiredRoleId || config.requiredRoleId;
  if (reqRole) {
    lines.push(`**Required Role:** <@&${reqRole}>`);
  }

  const rewardRole = giveaway.winnerRoleId || config.winnerRoleId;
  if (rewardRole) {
    lines.push(`**Winner Reward Role:** <@&${rewardRole}>`);
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎉 ${giveaway.prize}`)
    .setDescription(lines.join('\n'))
    .setColor(isEnded ? 0x2b2d31 : parseColorInt(config.embedColor, 0x5865f2))
    .setFooter({
      text: `${config.footerText || 'ArchiBot Giveaways'} • ID: ${giveaway.id}`,
      iconURL: config.embedFooterIcon || undefined,
    })
    .setTimestamp(new Date(isEnded && giveaway.endedAt ? giveaway.endedAt : giveaway.endsAt));

  if (config.embedThumbnailUrl) {
    try {
      embed.setThumbnail(config.embedThumbnailUrl);
    } catch {}
  }
  if (config.embedImageUrl) {
    try {
      embed.setImage(config.embedImageUrl);
    } catch {}
  }

  let btnLabel = config.buttonLabel || 'Participate ({count})';
  if (btnLabel.includes('{count}')) {
    btnLabel = btnLabel.replaceAll('{count}', String(participantsCount));
  } else {
    btnLabel = `${btnLabel} (${participantsCount})`;
  }
  const button = new ButtonBuilder()
    .setCustomId(`giveaway_join:${giveaway.id}`)
    .setLabel(btnLabel.slice(0, 80))
    .setStyle(mapButtonStyle(config.buttonStyle))
    .setDisabled(isEnded);

  const emojiStr = (config.buttonEmoji || '').trim();
  if (emojiStr) {
    try {
      button.setEmoji(emojiStr);
    } catch {
      // Ignore invalid emoji syntax
    }
  }

  const row = new ActionRowBuilder().addComponents(button);
  return { embeds: [embed], components: [row] };
}

function pickRandomWinners(participants, count, excludeIds = []) {
  const pool = [...new Set(participants)].filter((id) => !excludeIds.includes(id));
  const fallbackPool = pool.length > 0 ? pool : [...new Set(participants)];
  const shuffled = [...fallbackPool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.max(1, count));
}

async function sendGiveawayLog(guild, config, title, description, color = 0x5865f2) {
  if (!config.logChannelId) return;
  const logCh = guild.channels.cache.get(config.logChannelId);
  if (!logCh || !logCh.isTextBased()) return;
  try {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();
    await logCh.send({ embeds: [embed] });
  } catch {
    // Ignore log delivery errors
  }
}

function pickRandomWinnersWithMultipliers(guild, participants, count, config) {
  if (!Array.isArray(participants) || participants.length === 0) return [];
  if (!config.multipliersEnabled) {
    return pickRandomWinners(participants, count);
  }
  const boosterMultiplier = Math.max(1, Math.min(10, Number(config.boosterMultiplier) || 2));
  const pool = [];
  for (const userId of participants) {
    let weight = 1;
    const member = guild.members?.cache?.get(userId);
    if (member && (member.premiumSince || (config.boosterRoleId && member.roles.cache.has(config.boosterRoleId)))) {
      weight = boosterMultiplier;
    }
    for (let w = 0; w < weight; w++) {
      pool.push(userId);
    }
  }
  const winners = [];
  const maxWinners = Math.min(count, participants.length);
  while (winners.length < maxWinners && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const chosen = pool[idx];
    if (!winners.includes(chosen)) {
      winners.push(chosen);
    }
    for (let i = pool.length - 1; i >= 0; i--) {
      if (pool[i] === chosen) pool.splice(i, 1);
    }
  }
  return winners;
}

export async function concludeGiveaway(guild, giveawayId) {
  const giveaways = getGuildGiveawaysList(guild.id);
  const giveaway = giveaways.find((g) => g.id === giveawayId);
  if (!giveaway || giveaway.status === 'ended') return giveaway;

  const config = getGuildGiveawayConfig(guild.id);
  const winners = pickRandomWinnersWithMultipliers(guild, giveaway.participants || [], giveaway.winnerCount || 1, config);

  giveaway.status = 'ended';
  giveaway.endedAt = new Date().toISOString();
  giveaway.winners = winners;
  saveState();

  const channel = guild.channels.cache.get(giveaway.channelId);
  if (channel && channel.isTextBased()) {
    if (giveaway.messageId) {
      try {
        const msg = await channel.messages.fetch(giveaway.messageId);
        if (msg) {
          await msg.edit(buildGiveawayDiscordMessage(giveaway, config));
        }
      } catch {
        // Original giveaway message may have been deleted
      }
    }

    try {
      if (winners.length > 0) {
        let winText = `🎉 Congratulations ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`;
        if (config.claimInstructions) {
          winText += `\n📌 **Claim Instructions:** ${config.claimInstructions}`;
        }
        await channel.send({ content: winText });
      } else {
        await channel.send({
          content: `😕 The giveaway for **${giveaway.prize}** ended with no valid entries.`,
        });
      }
    } catch {
      // Ignore send error
    }
  }

  // Assign Winner Role & Send Winner DM
  const rewardRoleId = giveaway.winnerRoleId || config.winnerRoleId;
  for (const winnerId of winners) {
    try {
      const member = await guild.members.fetch(winnerId);
      if (member && rewardRoleId && guild.roles.cache.has(rewardRoleId)) {
        await member.roles.add(rewardRoleId, `Won giveaway: ${giveaway.prize}`).catch(() => {});
      }
      if (member && config.dmWinners) {
        let dmDesc = `Congratulations! You won **${giveaway.prize}** in **${guild.name}**!\n\nChannel: <#${giveaway.channelId}>`;
        if (config.claimInstructions) {
          dmDesc += `\n\n📌 **Claim Instructions:**\n${config.claimInstructions}`;
        }
        const dmEmbed = new EmbedBuilder()
          .setTitle('🎉 You Won a Giveaway!')
          .setDescription(dmDesc)
          .setColor(parseColorInt(config.embedColor, 0x5865f2))
          .setTimestamp();
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
      }
    } catch {
      // Member may have left or closed DMs
    }
  }

  await sendGiveawayLog(
    guild,
    config,
    '🏁 Giveaway Ended',
    `**Prize:** ${giveaway.prize}\n**Channel:** <#${giveaway.channelId}>\n**Entries:** ${giveaway.participants.length}\n**Winners:** ${
      winners.length > 0 ? winners.map((id) => `<@${id}>`).join(', ') : 'None'
    }`,
    0x57f287
  );

  broadcastToGuild(guild.id, { event: 'GIVEAWAY_UPDATE', guildId: guild.id });
  return giveaway;
}

// Runtime listener for Discord Participate button & auto-expiration timer
let runtimeAttached = false;
function ensureGiveawayRuntime() {
  if (runtimeAttached) return;
  runtimeAttached = true;

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('giveaway_join:')) return;
      if (!interaction.guild) return;

      const giveawayId = interaction.customId.slice('giveaway_join:'.length);
      const guildId = interaction.guild.id;
      const giveaways = getGuildGiveawaysList(guildId);
      const giveaway = giveaways.find((g) => g.id === giveawayId);

      if (!giveaway) {
        return interaction.reply({
          content: '❌ This giveaway no longer exists.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (giveaway.status === 'ended' || new Date(giveaway.endsAt).getTime() <= Date.now()) {
        await concludeGiveaway(interaction.guild, giveaway.id);
        return interaction.reply({
          content: '⌛ This giveaway has already ended.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const config = getGuildGiveawayConfig(guildId);
      const member = interaction.member;
      const userId = interaction.user.id;

      giveaway.participants = Array.isArray(giveaway.participants) ? giveaway.participants : [];

      // If already entered, allow leaving on second click
      const existingIdx = giveaway.participants.indexOf(userId);
      if (existingIdx !== -1) {
        giveaway.participants.splice(existingIdx, 1);
        saveState();
        await interaction.update(buildGiveawayDiscordMessage(giveaway, config)).catch(() => {});
        broadcastToGuild(guildId, { event: 'GIVEAWAY_UPDATE', guildId });
        return interaction.followUp({
          content: `ℹ️ You have left the giveaway for **${giveaway.prize}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Check Excluded Role
      if (config.excludedRoleId && member?.roles?.cache?.has(config.excludedRoleId)) {
        return interaction.reply({
          content: `❌ Members with <@&${config.excludedRoleId}> are excluded from joining giveaways.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Check Required Role (unless Bypass Role is held)
      const hasBypass = config.bypassRoleId && member?.roles?.cache?.has(config.bypassRoleId);
      const reqRoleId = giveaway.requiredRoleId || config.requiredRoleId;
      if (reqRoleId && !hasBypass && !member?.roles?.cache?.has(reqRoleId)) {
        return interaction.reply({
          content: `❌ You need the <@&${reqRoleId}> role to enter this giveaway.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Check Minimum Account Age
      if (config.minAccountAgeDays > 0) {
        const accountAgeDays = (Date.now() - interaction.user.createdTimestamp) / (1000 * 60 * 60 * 24);
        if (accountAgeDays < config.minAccountAgeDays) {
          return interaction.reply({
            content: `❌ Your Discord account must be at least **${config.minAccountAgeDays} days** old to enter.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // Check Minimum Server Time
      if (config.minServerDays > 0 && member?.joinedTimestamp) {
        const serverDays = (Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24);
        if (serverDays < config.minServerDays) {
          return interaction.reply({
            content: `❌ You must be a member of this server for at least **${config.minServerDays} days** to enter.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      giveaway.participants.push(userId);
      saveState();

      await interaction.update(buildGiveawayDiscordMessage(giveaway, config)).catch(() => {});
      broadcastToGuild(guildId, { event: 'GIVEAWAY_UPDATE', guildId });

      return interaction.followUp({
        content: `✅ You are now entered into the **${giveaway.prize}** giveaway! Good luck! 🎉`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('Giveaway button interaction error:', err.message);
    }
  });

  // Periodic check for expired giveaways every 15 seconds
  setInterval(async () => {
    if (!client.isReady()) return;
    const now = Date.now();
    for (const [guildId, guildData] of Object.entries(state.guilds || {})) {
      const list = guildData?.giveaways;
      if (!Array.isArray(list) || list.length === 0) continue;
      for (const g of list) {
        if (g.status === 'active' && new Date(g.endsAt).getTime() <= now) {
          const guild = client.guilds.cache.get(guildId);
          if (guild) {
            await concludeGiveaway(guild, g.id).catch(() => {});
          }
        }
      }
    }
  }, 15_000).unref();
}

ensureGiveawayRuntime();

function formatGiveawayForApi(guild, g) {
  const ch = guild.channels.cache.get(g.channelId);
  const participants = Array.isArray(g.participants) ? g.participants : [];
  const winners = Array.isArray(g.winners) ? g.winners : [];
  return {
    id: g.id,
    prize: g.prize,
    description: g.description || '',
    channelId: g.channelId,
    channelName: ch ? ch.name : g.channelName || 'deleted-channel',
    messageId: g.messageId || null,
    winnerCount: Number(g.winnerCount) || 1,
    hostId: g.hostId || null,
    hostName: g.hostName || 'Admin',
    requiredRoleId: g.requiredRoleId || null,
    winnerRoleId: g.winnerRoleId || null,
    status: g.status === 'ended' ? 'ended' : 'active',
    createdAt: g.createdAt,
    endsAt: g.endsAt,
    endedAt: g.endedAt || null,
    participantsCount: participants.length,
    participants,
    winners,
  };
}

// GET /api/guilds/:guildId/giveaways
router.get('/:guildId/giveaways', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const config = getGuildGiveawayConfig(guild.id);
  const rawList = getGuildGiveawaysList(guild.id);

  // Auto-conclude any overdue active giveaways before returning
  const now = Date.now();
  for (const g of rawList) {
    if (g.status === 'active' && new Date(g.endsAt).getTime() <= now) {
      await concludeGiveaway(guild, g.id).catch(() => {});
    }
  }

  const formatted = [...rawList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((g) => formatGiveawayForApi(guild, g));

  const activeCount = formatted.filter((g) => g.status === 'active').length;
  const endedCount = formatted.filter((g) => g.status === 'ended').length;
  const totalParticipants = formatted.reduce((acc, g) => acc + g.participantsCount, 0);

  return res.json({
    config,
    giveaways: formatted,
    summary: {
      activeCount,
      endedCount,
      totalParticipants,
      totalGiveaways: formatted.length,
    },
  });
});

// PATCH or PUT /api/guilds/:guildId/giveaways/config
const updateConfigHandler = async (req, res) => {
  const guild = req.guild;
  const current = getGuildGiveawayConfig(guild.id);
  const body = req.body || {};

  const updated = {
    managerRoleId: body.managerRoleId !== undefined ? body.managerRoleId || null : current.managerRoleId,
    pingRoleId: body.pingRoleId !== undefined ? body.pingRoleId || null : current.pingRoleId,
    requiredRoleId: body.requiredRoleId !== undefined ? body.requiredRoleId || null : current.requiredRoleId,
    excludedRoleId: body.excludedRoleId !== undefined ? body.excludedRoleId || null : current.excludedRoleId,
    bypassRoleId: body.bypassRoleId !== undefined ? body.bypassRoleId || null : current.bypassRoleId,
    winnerRoleId: body.winnerRoleId !== undefined ? body.winnerRoleId || null : current.winnerRoleId,
    minAccountAgeDays:
      body.minAccountAgeDays !== undefined
        ? Math.max(0, Number.parseInt(body.minAccountAgeDays, 10) || 0)
        : current.minAccountAgeDays,
    minServerDays:
      body.minServerDays !== undefined
        ? Math.max(0, Number.parseInt(body.minServerDays, 10) || 0)
        : current.minServerDays,
    embedColor: body.embedColor !== undefined ? String(body.embedColor || '#5865F2') : current.embedColor,
    footerText: body.footerText !== undefined ? String(body.footerText).slice(0, 120) : current.footerText,
    embedThumbnailUrl:
      body.embedThumbnailUrl !== undefined
        ? (body.embedThumbnailUrl ? String(body.embedThumbnailUrl).slice(0, 500) : null)
        : current.embedThumbnailUrl,
    embedImageUrl:
      body.embedImageUrl !== undefined
        ? (body.embedImageUrl ? String(body.embedImageUrl).slice(0, 500) : null)
        : current.embedImageUrl,
    embedFooterIcon:
      body.embedFooterIcon !== undefined
        ? (body.embedFooterIcon ? String(body.embedFooterIcon).slice(0, 500) : null)
        : current.embedFooterIcon,
    buttonLabel:
      body.buttonLabel !== undefined
        ? String(body.buttonLabel || 'Participate ({count})').slice(0, 60)
        : current.buttonLabel,
    buttonEmoji:
      body.buttonEmoji !== undefined ? String(body.buttonEmoji || '🎉').slice(0, 32) : current.buttonEmoji,
    buttonStyle:
      body.buttonStyle !== undefined && ['primary', 'secondary', 'success', 'danger'].includes(body.buttonStyle)
        ? body.buttonStyle
        : current.buttonStyle,
    showHost: body.showHost !== undefined ? Boolean(body.showHost) : current.showHost,
    dmWinners: body.dmWinners !== undefined ? Boolean(body.dmWinners) : current.dmWinners,
    logChannelId: body.logChannelId !== undefined ? body.logChannelId || null : current.logChannelId,
    multipliersEnabled:
      body.multipliersEnabled !== undefined ? Boolean(body.multipliersEnabled) : current.multipliersEnabled,
    boosterRoleId: body.boosterRoleId !== undefined ? body.boosterRoleId || null : current.boosterRoleId,
    boosterMultiplier:
      body.boosterMultiplier !== undefined
        ? Math.max(1, Math.min(10, Number.parseInt(body.boosterMultiplier, 10) || 2))
        : current.boosterMultiplier,
    claimInstructions:
      body.claimInstructions !== undefined
        ? String(body.claimInstructions).slice(0, 500)
        : current.claimInstructions,
  };

  state.guilds[guild.id] = state.guilds[guild.id] ?? {};
  state.guilds[guild.id].giveawayConfig = updated;
  saveState();

  return res.json({
    success: true,
    message: 'Giveaway configuration saved successfully.',
    config: updated,
  });
};

router.patch('/:guildId/giveaways/config', verifyGuildAccess, updateConfigHandler);
router.put('/:guildId/giveaways/config', verifyGuildAccess, updateConfigHandler);

// POST /api/guilds/:guildId/giveaways (Create & Launch Giveaway)
router.post('/:guildId/giveaways', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const config = getGuildGiveawayConfig(guild.id);
  const {
    prize,
    description,
    channelId,
    durationMinutes = 60,
    winnerCount = 1,
    requiredRoleId,
    winnerRoleId,
  } = req.body || {};

  if (!prize || !String(prize).trim()) {
    return res.status(400).json({ error: 'Please provide a prize name for the giveaway.' });
  }

  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isTextBased()) {
    return res.status(400).json({ error: 'Please select a valid text channel to post the giveaway.' });
  }

  const mins = Math.max(1, Math.min(43_200, Number(durationMinutes) || 60));
  const winnersNum = Math.max(1, Math.min(25, Number.parseInt(winnerCount, 10) || 1));
  const now = new Date();
  const endsAt = new Date(now.getTime() + mins * 60_000);

  const shortId = randomUUID().split('-')[0];
  const hostId = req.user?.id && /^\d{17,20}$/.test(String(req.user.id)) ? String(req.user.id) : guild.ownerId;
  const hostName = req.user?.global_name || req.user?.username || 'Server Admin';

  const newGiveaway = {
    id: shortId,
    guildId: guild.id,
    prize: String(prize).trim().slice(0, 180),
    description: String(description || '').trim().slice(0, 1000),
    channelId: channel.id,
    channelName: channel.name,
    messageId: null,
    winnerCount: winnersNum,
    hostId,
    hostName,
    requiredRoleId: requiredRoleId !== undefined ? requiredRoleId || null : config.requiredRoleId,
    winnerRoleId: winnerRoleId !== undefined ? winnerRoleId || null : config.winnerRoleId,
    status: 'active',
    createdAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    endedAt: null,
    participants: [],
    winners: [],
  };

  try {
    const discordPayload = buildGiveawayDiscordMessage(newGiveaway, config);
    if (config.pingRoleId && guild.roles.cache.has(config.pingRoleId)) {
      discordPayload.content = `<@&${config.pingRoleId}>`;
    }

    const sentMsg = await channel.send(discordPayload);
    newGiveaway.messageId = sentMsg.id;
  } catch (err) {
    return res.status(500).json({
      error: `Failed to post giveaway message in #${channel.name}: ${err.message}`,
    });
  }

  const list = getGuildGiveawaysList(guild.id);
  list.push(newGiveaway);
  saveState();

  await sendGiveawayLog(
    guild,
    config,
    '🎁 Giveaway Created',
    `**Prize:** ${newGiveaway.prize}\n**Channel:** <#${channel.id}>\n**Winners:** ${newGiveaway.winnerCount}\n**Ends:** <t:${Math.floor(
      endsAt.getTime() / 1000
    )}:R>\n**Host:** <@${hostId}>`,
    parseColorInt(config.embedColor, 0x5865f2)
  );

  broadcastToGuild(guild.id, { event: 'GIVEAWAY_UPDATE', guildId: guild.id });

  return res.json({
    success: true,
    message: `Giveaway "${newGiveaway.prize}" launched in #${channel.name}!`,
    giveaway: formatGiveawayForApi(guild, newGiveaway),
  });
});

// POST /api/guilds/:guildId/giveaways/:giveawayId/end
router.post('/:guildId/giveaways/:giveawayId/end', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { giveawayId } = req.params;
  const list = getGuildGiveawaysList(guild.id);
  const target = list.find((g) => g.id === giveawayId);

  if (!target) {
    return res.status(404).json({ error: 'Giveaway not found.' });
  }
  if (target.status === 'ended') {
    return res.status(400).json({ error: 'This giveaway has already ended.' });
  }

  const concluded = await concludeGiveaway(guild, giveawayId);
  return res.json({
    success: true,
    message:
      concluded.winners?.length > 0
        ? `Giveaway ended! Picked ${concluded.winners.length} winner(s).`
        : 'Giveaway ended (no participants joined).',
    giveaway: formatGiveawayForApi(guild, concluded),
  });
});

// POST /api/guilds/:guildId/giveaways/:giveawayId/reroll
router.post('/:guildId/giveaways/:giveawayId/reroll', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { giveawayId } = req.params;
  const list = getGuildGiveawaysList(guild.id);
  const target = list.find((g) => g.id === giveawayId);

  if (!target) {
    return res.status(404).json({ error: 'Giveaway not found.' });
  }
  if (target.status !== 'ended') {
    return res.status(400).json({ error: 'Only ended giveaways can be rerolled.' });
  }
  if (!Array.isArray(target.participants) || target.participants.length === 0) {
    return res.status(400).json({ error: 'Cannot reroll a giveaway with 0 participants.' });
  }

  const config = getGuildGiveawayConfig(guild.id);
  const newWinners = pickRandomWinners(target.participants, target.winnerCount || 1, target.winners || []);
  target.winners = newWinners;
  saveState();

  const channel = guild.channels.cache.get(target.channelId);
  if (channel && channel.isTextBased()) {
    if (target.messageId) {
      try {
        const msg = await channel.messages.fetch(target.messageId);
        if (msg) {
          await msg.edit(buildGiveawayDiscordMessage(target, config));
        }
      } catch {
        // Ignore missing message
      }
    }
    try {
      await channel.send({
        content: `🎲 **Giveaway Rerolled!** Congratulations ${newWinners
          .map((id) => `<@${id}>`)
          .join(', ')} on winning **${target.prize}**!`,
      });
    } catch {
      // Ignore send error
    }
  }

  await sendGiveawayLog(
    guild,
    config,
    '🎲 Giveaway Rerolled',
    `**Prize:** ${target.prize}\n**Channel:** <#${target.channelId}>\n**New Winner(s):** ${newWinners
      .map((id) => `<@${id}>`)
      .join(', ')}`,
    0xfee75c
  );

  broadcastToGuild(guild.id, { event: 'GIVEAWAY_UPDATE', guildId: guild.id });

  return res.json({
    success: true,
    message: `Rerolled "${target.prize}"! New winner(s) announced in Discord.`,
    giveaway: formatGiveawayForApi(guild, target),
  });
});

// DELETE /api/guilds/:guildId/giveaways/:giveawayId
router.delete('/:guildId/giveaways/:giveawayId', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { giveawayId } = req.params;
  const list = getGuildGiveawaysList(guild.id);
  const idx = list.findIndex((g) => g.id === giveawayId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Giveaway not found.' });
  }

  const [removed] = list.splice(idx, 1);
  saveState();

  if (removed.channelId && removed.messageId) {
    const channel = guild.channels.cache.get(removed.channelId);
    if (channel && channel.isTextBased()) {
      try {
        const msg = await channel.messages.fetch(removed.messageId);
        if (msg) await msg.delete().catch(() => {});
      } catch {
        // Ignore if message was already deleted
      }
    }
  }

  broadcastToGuild(guild.id, { event: 'GIVEAWAY_UPDATE', guildId: guild.id });

  return res.json({
    success: true,
    message: `Giveaway "${removed.prize}" deleted.`,
  });
});

export default router;
