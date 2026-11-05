import { Router } from 'express';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { state, saveState } from '../botClient.js';
import {
  buildGoodbyePayload,
  buildMilestoneCardPayload,
  buildWelcomePayload,
  computeMilestoneProgress,
  formatGreetingTemplate,
} from '../../bot.js';

const router = Router();
router.use(verifySession);

router.get('/:guildId/settings', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const me = await guild.members.fetchMe().catch(() => null);

  const cfg = state.guilds[guild.id] || {};
  const wCfg = cfg.welcomeConfig || {};
  const gCfg = cfg.goodbyeConfig || {};
  const defaultAutoRoles = Array.isArray(wCfg.autoRoleIds)
    ? wCfg.autoRoleIds
    : cfg.memberRoleId
    ? [cfg.memberRoleId]
    : [];

  res.json({
    general: {
      name: guild.name,
      memberCount: guild.memberCount,
      serverIcon: guild.iconURL() || null,
      botAvatar: me?.user?.displayAvatarURL?.() || null,
      botName: me?.displayName || 'ArchiBot',
      description: guild.description || '',
      verificationLevel: guild.verificationLevel,
      afkChannelId: guild.afkChannelId,
      afkTimeout: guild.afkTimeout,
      systemChannelId: guild.systemChannelId,
      botNickname: me?.nickname || '',
      adminRoleId: cfg.adminRoleId || null,
      language: cfg.language || 'en',
    },
    customization: {
      footerText: cfg.customization?.footerText ?? `${me?.displayName || 'ArchiBot'} • Server Architect`,
      footerIconUrl: cfg.customization?.footerIconUrl ?? '',
      embedColor: cfg.customization?.embedColor ?? '#5865F2',
    },
    logging: {
      generalChannelId: cfg.logChannelId || cfg.automod?.logChannelId || null,
      inviteChannelId: cfg.inviteLogsId || null,
      boosterChannelId: cfg.boosterLogsId || null,
    },
    accessControl: {
      enabled: Boolean(cfg.accessControl?.enabled),
      roleIds: Array.isArray(cfg.accessControl?.roleIds) ? cfg.accessControl.roleIds : [],
      memberIds: Array.isArray(cfg.accessControl?.memberIds) ? cfg.accessControl.memberIds : [],
    },
    milestone: cfg.milestone || {
      enabled: false,
      every: 50,
      goals: [10, 25, 50, 100],
      channelId: null,
      roleId: null,
    },
    welcome: {
      enabled: wCfg.enabled !== undefined ? Boolean(wCfg.enabled) : Boolean(cfg.welcomeId),
      autoRoleIds: defaultAutoRoles,
      cardEnabled: wCfg.cardEnabled !== undefined ? Boolean(wCfg.cardEnabled) : true,
      cardLayout: wCfg.cardLayout || 'centered',
      cardBg: wCfg.cardBg || 'midnight',
      cardCustomBg: wCfg.cardCustomBg || '#1E2238',
      cardDim: wCfg.cardDim !== undefined ? Number(wCfg.cardDim) : 25,
      cardAccent: wCfg.cardAccent || '#5865F2',
      cardTitle: wCfg.cardTitle || 'WELCOME',
      messageEnabled: wCfg.messageEnabled !== undefined ? Boolean(wCfg.messageEnabled) : true,
      channelId: wCfg.channelId || cfg.welcomeId || null,
      message:
        wCfg.message ||
        'Glad to have you with us, {user}!\nYou are member **#{memberCount}**.',
      onboardingEnabled: wCfg.onboardingEnabled !== undefined ? Boolean(wCfg.onboardingEnabled) : true,
      onboardingChannels: Array.isArray(wCfg.onboardingChannels)
        ? wCfg.onboardingChannels
        : [
            cfg.rulesId ? { id: 'rules', action: 'read', channelId: cfg.rulesId } : null,
            cfg.verifyId ? { id: 'verify', action: 'verify in', channelId: cfg.verifyId } : null,
            cfg.rolesPickId ? { id: 'roles', action: 'pick your roles in', channelId: cfg.rolesPickId } : null,
          ].filter(Boolean),
      channelDelivery: wCfg.channelDelivery || {
        content: 'Welcome {user} to **{server}**! You are member **#{memberCount}**.',
        embed: {
          enabled: true,
          color: wCfg.cardAccent || '#5865F2',
          authorName: '',
          authorIconMode: 'none',
          authorIconUrl: '',
          title: '🛬 Welcome to {server}!',
          description:
            wCfg.message || 'Glad to have you with us, {user}! Explore our channels and enjoy your stay.',
          thumbnailMode: 'member',
          thumbnailUrl: '',
          imageUrl: '',
          footerText: '{server} • Member #{memberCount}',
          footerIconMode: 'server',
          footerIconUrl: '',
          timestamp: true,
          fields: [],
        },
        cardEnabled: wCfg.cardEnabled !== undefined ? Boolean(wCfg.cardEnabled) : true,
        cardPlacement: 'attachment',
      },
      dmEnabled: Boolean(wCfg.dmEnabled),
      dmMessage:
        wCfg.dmMessage ||
        '👋 Welcome to **{server}**, {username}! Feel free to explore our channels and enjoy your stay.',
      dmDelivery: wCfg.dmDelivery || {
        content: 'Welcome to **{server}**, {username}!',
        embed: {
          enabled: true,
          color: '#5865F2',
          authorName: '',
          authorIconMode: 'none',
          authorIconUrl: '',
          title: '👋 Welcome to {server}!',
          description:
            wCfg.dmMessage ||
            'Glad you joined **{server}**, {username}! Feel free to read our rules, pick your roles, and say hello.',
          thumbnailMode: 'server',
          thumbnailUrl: '',
          imageUrl: '',
          footerText: '{server}',
          footerIconMode: 'server',
          footerIconUrl: '',
          timestamp: false,
          fields: [],
        },
        cardEnabled: false,
        cardPlacement: 'attachment',
      },
    },
    goodbye: {
      enabled: gCfg.enabled !== undefined ? Boolean(gCfg.enabled) : Boolean(cfg.goodbyeId),
      channelId: gCfg.channelId || cfg.goodbyeId || null,
      message:
        gCfg.message ||
        '**{member.username}** has left **{guild.name}**.',
      delivery: gCfg.delivery || {
        content: gCfg.message || '**{member.username}** has left **{guild.name}**.',
        embed: {
          enabled: false,
          color: '#5865F2',
          authorName: '',
          authorIconMode: 'none',
          authorIconUrl: '',
          title: '',
          description: '',
          thumbnailMode: 'none',
          thumbnailUrl: '',
          imageUrl: '',
          footerText: '',
          footerIconMode: 'none',
          footerIconUrl: '',
          timestamp: false,
          fields: [],
        },
        cardEnabled: false,
        cardPlacement: 'attachment',
      },
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

  const {
    general,
    customization,
    logging,
    accessControl,
    milestone,
    welcome,
    goodbye,
    automod,
    systemChannels,
    botNickname,
    serverName,
  } = req.body;

  try {
    const nextNickname = general?.botNickname !== undefined ? general.botNickname : botNickname;
    if (nextNickname !== undefined) {
      const me = await guild.members.fetchMe();
      await me.setNickname(nextNickname?.trim() || null).catch(() => {});
    }

    const nextServerName = general?.name !== undefined ? general.name : serverName;
    if (nextServerName && nextServerName !== guild.name) {
      await guild.setName(nextServerName.trim().slice(0, 100)).catch(() => {});
    }

    if (general?.adminRoleId !== undefined) {
      if (general.adminRoleId) cfg.adminRoleId = general.adminRoleId;
      else delete cfg.adminRoleId;
    }

    if (general?.language !== undefined) {
      cfg.language = general.language === 'id' ? 'id' : 'en';
    }

    if (customization) {
      cfg.customization = {
        ...(cfg.customization || {}),
        footerText:
          customization.footerText !== undefined
            ? String(customization.footerText).slice(0, 200)
            : cfg.customization?.footerText ?? '',
        footerIconUrl:
          customization.footerIconUrl !== undefined
            ? String(customization.footerIconUrl).trim()
            : cfg.customization?.footerIconUrl ?? '',
        embedColor:
          customization.embedColor !== undefined
            ? String(customization.embedColor)
            : cfg.customization?.embedColor ?? '#5865F2',
      };
    }

    if (logging) {
      if (logging.generalChannelId !== undefined) {
        if (logging.generalChannelId) cfg.logChannelId = logging.generalChannelId;
        else delete cfg.logChannelId;
        cfg.automod = {
          ...(cfg.automod || {}),
          logChannelId: logging.generalChannelId || null,
        };
      }
      if (logging.inviteChannelId !== undefined) {
        if (logging.inviteChannelId) cfg.inviteLogsId = logging.inviteChannelId;
        else delete cfg.inviteLogsId;
      }
      if (logging.boosterChannelId !== undefined) {
        if (logging.boosterChannelId) cfg.boosterLogsId = logging.boosterChannelId;
        else delete cfg.boosterLogsId;
      }
    }

    if (accessControl) {
      cfg.accessControl = {
        enabled: Boolean(accessControl.enabled),
        roleIds: Array.isArray(accessControl.roleIds)
          ? [...new Set(accessControl.roleIds.filter(Boolean))].slice(0, 10)
          : cfg.accessControl?.roleIds || [],
        memberIds: Array.isArray(accessControl.memberIds)
          ? [...new Set(accessControl.memberIds.filter(Boolean))].slice(0, 10)
          : cfg.accessControl?.memberIds || [],
      };
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
      const prev = cfg.welcomeConfig || {};
      const nextAutoRoles = Array.isArray(welcome.autoRoleIds)
        ? welcome.autoRoleIds.filter(Boolean)
        : prev.autoRoleIds || (cfg.memberRoleId ? [cfg.memberRoleId] : []);

      cfg.welcomeConfig = {
        ...prev,
        enabled: welcome.enabled !== undefined ? Boolean(welcome.enabled) : Boolean(prev.enabled),
        autoRoleIds: nextAutoRoles,
        cardEnabled: welcome.cardEnabled !== undefined ? Boolean(welcome.cardEnabled) : prev.cardEnabled ?? true,
        cardLayout: welcome.cardLayout || prev.cardLayout || 'centered',
        cardBg: welcome.cardBg || prev.cardBg || 'midnight',
        cardCustomBg: welcome.cardCustomBg || prev.cardCustomBg || '#1E2238',
        cardDim: welcome.cardDim !== undefined ? Number(welcome.cardDim) : prev.cardDim ?? 25,
        cardAccent: welcome.cardAccent || prev.cardAccent || '#5865F2',
        cardTitle: welcome.cardTitle !== undefined ? String(welcome.cardTitle) : prev.cardTitle || 'WELCOME',
        messageEnabled:
          welcome.messageEnabled !== undefined ? Boolean(welcome.messageEnabled) : prev.messageEnabled ?? true,
        channelId: welcome.channelId !== undefined ? welcome.channelId || null : prev.channelId || null,
        message:
          welcome.message !== undefined
            ? welcome.message
            : prev.message || 'Glad to have you with us, {user}!\nYou are member **#{memberCount}**.',
        onboardingEnabled:
          welcome.onboardingEnabled !== undefined ? Boolean(welcome.onboardingEnabled) : prev.onboardingEnabled ?? true,
        onboardingChannels: Array.isArray(welcome.onboardingChannels)
          ? welcome.onboardingChannels
          : prev.onboardingChannels || [],
        dmEnabled: welcome.dmEnabled !== undefined ? Boolean(welcome.dmEnabled) : Boolean(prev.dmEnabled),
        dmMessage:
          welcome.dmMessage !== undefined
            ? welcome.dmMessage
            : prev.dmMessage || '👋 Welcome to **{server}**, {username}!',
        channelDelivery: welcome.channelDelivery !== undefined ? welcome.channelDelivery : prev.channelDelivery,
        dmDelivery: welcome.dmDelivery !== undefined ? welcome.dmDelivery : prev.dmDelivery,
      };

      if (welcome.channelId !== undefined) {
        if (welcome.channelId) cfg.welcomeId = welcome.channelId;
        else delete cfg.welcomeId;
      }
      if (Array.isArray(welcome.autoRoleIds)) {
        if (nextAutoRoles[0]) cfg.memberRoleId = nextAutoRoles[0];
        else delete cfg.memberRoleId;
      }
    }

    if (goodbye) {
      const prevG = cfg.goodbyeConfig || {};
      cfg.goodbyeConfig = {
        ...prevG,
        enabled: goodbye.enabled !== undefined ? Boolean(goodbye.enabled) : Boolean(prevG.enabled),
        channelId: goodbye.channelId !== undefined ? goodbye.channelId || null : prevG.channelId || null,
        message:
          goodbye.message !== undefined
            ? goodbye.message
            : prevG.message || '**{member.username}** has left **{guild.name}**.',
        delivery: goodbye.delivery !== undefined ? goodbye.delivery : prevG.delivery,
      };
      if (goodbye.channelId !== undefined) {
        if (goodbye.channelId) cfg.goodbyeId = goodbye.channelId;
        else delete cfg.goodbyeId;
      }
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

router.post('/:guildId/welcome/test', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const cfg = state.guilds[guild.id] || {};
  const draftWelcome = { ...(cfg.welcomeConfig || {}), ...(req.body?.welcome || {}) };
  const targetChannelId = req.body?.channelId || draftWelcome.channelId || cfg.welcomeId;
  const targetChannel = guild.channels.cache.get(targetChannelId);

  if (!targetChannel || !targetChannel.isTextBased()) {
    return res.status(400).json({ error: 'Please select a valid Welcome Channel first.' });
  }

  try {
    const avatarUrl = req.user.avatar
      ? req.user.avatar.startsWith('http')
        ? req.user.avatar
        : `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      : guild.iconURL() || undefined;
    const msProgress = computeMilestoneProgress(guild.memberCount, cfg.milestone || {});
    const payload = buildWelcomePayload({
      userId: req.user.id,
      username: req.user.global_name || req.user.username || 'Member',
      avatarUrl,
      guild,
      cfg: { ...cfg, welcomeConfig: draftWelcome },
      msProgress,
    });
    await targetChannel.send(payload);
    return res.json({ success: true, message: `Test welcome message sent to #${targetChannel.name}!` });
  } catch (err) {
    return res.status(500).json({ error: `Failed to send test welcome: ${err.message}` });
  }
});

router.post('/:guildId/welcome/test-dm', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const cfg = state.guilds[guild.id] || {};
  const draftWelcome = { ...(cfg.welcomeConfig || {}), ...(req.body?.welcome || {}) };

  try {
    const member =
      guild.members.cache.get(req.user.id) || (await guild.members.fetch(req.user.id).catch(() => null));
    if (!member) {
      return res.status(400).json({ error: 'Could not locate your Discord member profile in this server.' });
    }
    const payload = buildWelcomePayload({
      userId: member.id,
      username: member.user.globalName || member.user.username,
      avatarUrl: member.user.displayAvatarURL(),
      guild,
      cfg: { ...cfg, welcomeConfig: draftWelcome },
      target: 'dm',
    });
    await member.send(payload);
    return res.json({ success: true, message: `Test Welcome DM sent to @${member.user.username}!` });
  } catch (err) {
    return res.status(500).json({
      error: `Could not send DM (make sure Direct Messages from server members are enabled): ${err.message}`,
    });
  }
});

router.post('/:guildId/goodbye/test', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const cfg = state.guilds[guild.id] || {};
  const draftGoodbye = { ...(cfg.goodbyeConfig || {}), ...(req.body?.goodbye || {}) };
  const targetChannelId = req.body?.channelId || draftGoodbye.channelId || cfg.goodbyeId;
  const targetChannel = guild.channels.cache.get(targetChannelId);

  if (!targetChannel || !targetChannel.isTextBased()) {
    return res.status(400).json({ error: 'Please select a valid Leave / Goodbye Channel first.' });
  }

  try {
    const avatarUrl = req.user.avatar
      ? req.user.avatar.startsWith('http')
        ? req.user.avatar
        : `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      : guild.iconURL() || undefined;
    const payload = buildGoodbyePayload({
      userId: req.user.id,
      username: req.user.global_name || req.user.username || 'Member',
      avatarUrl,
      guild,
      cfg: { ...cfg, goodbyeConfig: draftGoodbye },
    });
    await targetChannel.send(payload);
    return res.json({ success: true, message: `Test leave message sent to #${targetChannel.name}!` });
  } catch (err) {
    return res.status(500).json({ error: `Failed to send test leave message: ${err.message}` });
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
