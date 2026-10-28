import { Router } from 'express';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { state, saveState } from '../botClient.js';
import { buildMilestoneCardPayload, computeMilestoneProgress } from '../../bot.js';

const router = Router();
router.use(verifySession);

router.get('/:guildId/settings', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const me = await guild.members.fetchMe().catch(() => null);

  const cfg = state.guilds[guild.id] || {};

  res.json({
    general: {
      name: guild.name,
      description: guild.description || '',
      verificationLevel: guild.verificationLevel,
      afkChannelId: guild.afkChannelId,
      afkTimeout: guild.afkTimeout,
      systemChannelId: guild.systemChannelId,
      botNickname: me?.nickname || '',
    },
    milestone: cfg.milestone || {
      enabled: false,
      every: 50,
      goals: [],
      channelId: null,
      roleId: null,
    },
    welcome: cfg.welcomeConfig || {
      enabled: Boolean(cfg.welcomeId),
      channelId: cfg.welcomeId || null,
      message: '👋 Welcome to **{server}**, {user}! You are member **#{memberCount}**.',
    },
    goodbye: cfg.goodbyeConfig || {
      enabled: Boolean(cfg.goodbyeId),
      channelId: cfg.goodbyeId || null,
      message: '👋 **{username}** has left the server.',
    },
    automod: cfg.automod || {
      antiInvite: false,
      antiSpam: false,
      badWords: [],
      logChannelId: null,
    },
    systemChannels: {
      welcomeId: cfg.welcomeId || null,
      rulesId: cfg.rulesId || null,
      verifyId: cfg.verifyId || null,
      goodbyeId: cfg.goodbyeId || null,
      rolesPickId: cfg.rolesPickId || null,
      inviteLogsId: cfg.inviteLogsId || null,
      boosterLogsId: cfg.boosterLogsId || null,
      dateId: cfg.dateId || null,
      presenceId: cfg.presenceId || null,
      usersId: cfg.usersId || null,
    },
  });
});

router.patch('/:guildId/settings', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const cfg = (state.guilds[guild.id] ??= {});

  const { general, milestone, welcome, goodbye, automod, systemChannels } = req.body;

  try {
    if (general?.botNickname !== undefined) {
      const me = await guild.members.fetchMe();
      await me.setNickname(general.botNickname?.trim() || null).catch(() => {});
    }

    if (general?.name && general.name !== guild.name) {
      await guild.setName(general.name.trim().slice(0, 100)).catch(() => {});
    }

    if (milestone) {
      cfg.milestone = {
        enabled: Boolean(milestone.enabled),
        every: Number(milestone.every) || 0,
        goals: Array.isArray(milestone.goals)
          ? milestone.goals.map(Number).filter((n) => n > 0).sort((a, b) => a - b)
          : [],
        channelId: milestone.channelId || null,
        roleId: milestone.roleId || null,
        highestReached: Math.max(cfg.milestone?.highestReached || 0, guild.memberCount),
      };
    }

    if (welcome) {
      cfg.welcomeConfig = {
        enabled: Boolean(welcome.enabled),
        channelId: welcome.channelId || null,
        message: welcome.message || 'Welcome to {server}, {user}!',
      };
      if (welcome.channelId) cfg.welcomeId = welcome.channelId;
    }

    if (goodbye) {
      cfg.goodbyeConfig = {
        enabled: Boolean(goodbye.enabled),
        channelId: goodbye.channelId || null,
        message: goodbye.message || 'Goodbye {username}!',
      };
      if (goodbye.channelId) cfg.goodbyeId = goodbye.channelId;
    }

    if (automod) {
      cfg.automod = {
        antiInvite: Boolean(automod.antiInvite),
        antiSpam: Boolean(automod.antiSpam),
        badWords: Array.isArray(automod.badWords) ? automod.badWords.map((s) => String(s).trim()).filter(Boolean) : [],
        logChannelId: automod.logChannelId || null,
      };
    }

    if (systemChannels) {
      for (const [key, val] of Object.entries(systemChannels)) {
        if (val) cfg[key] = val;
        else delete cfg[key];
      }
    }

    saveState();
    return res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to save settings: ${err.message}` });
  }
});

router.post('/:guildId/milestone/test', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const cfg = state.guilds[guild.id] || {};
  const milestone = cfg.milestone || {};

  const targetChannelId = milestone.channelId || cfg.welcomeId || req.body?.channelId;
  const targetChannel = guild.channels.cache.get(targetChannelId);

  if (!targetChannel || !targetChannel.isTextBased()) {
    return res.status(400).json({ error: 'Please configure a valid channel for milestone announcements first.' });
  }

  try {
    const { next, remaining } = computeMilestoneProgress(guild.memberCount, milestone);
    const count = next || Math.max(50, guild.memberCount);

    const payload = buildMilestoneCardPayload({
      count,
      next: next || count + 50,
      remaining: remaining || 50,
      userId: req.user.id,
      avatarUrl: req.user.avatar
        ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
        : guild.iconURL() || undefined,
      rewardRoleId: milestone.roleId || null,
    });

    await targetChannel.send(payload);
    return res.json({ success: true, message: `Sample milestone card sent to #${targetChannel.name}!` });
  } catch (err) {
    return res.status(500).json({ error: `Failed to send test milestone card: ${err.message}` });
  }
});

router.get('/:guildId/audit', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;

  try {
    const auditLogs = await guild.fetchAuditLogs({ limit: 30 }).catch(() => null);
    if (!auditLogs) {
      return res.json({ logs: [] });
    }

    const logs = auditLogs.entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actionType: entry.actionType,
      executor: entry.executor
        ? {
            id: entry.executor.id,
            username: entry.executor.username,
            avatar: entry.executor.displayAvatarURL(),
          }
        : null,
      targetId: entry.targetId,
      reason: entry.reason || 'No reason provided',
      createdAt: entry.createdAt,
      changes: entry.changes || [],
    }));

    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch audit logs: ${err.message}` });
  }
});

export default router;
