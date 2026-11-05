import { Router } from 'express';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { state, syncGuildStats } from '../botClient.js';

const router = Router();

router.use(verifySession);

router.get('/:guildId/overview', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const me = await guild.members.fetchMe().catch(() => null);

  const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
  const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
  const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
  const stageChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildStageVoice).size;

  let onlineCount = 0;
  let botCount = 0;
  let humanCount = 0;

  for (const m of guild.members.cache.values()) {
    if (m.user.bot) botCount++;
    else humanCount++;
    if (m.presence?.status && m.presence.status !== 'offline') onlineCount++;
  }

  const botPermissions = me
    ? {
        hasAdmin: me.permissions.has(PermissionFlagsBits.Administrator),
        manageChannels: me.permissions.has(PermissionFlagsBits.ManageChannels),
        manageRoles: me.permissions.has(PermissionFlagsBits.ManageRoles),
        moveMembers: me.permissions.has(PermissionFlagsBits.MoveMembers),
        kickMembers: me.permissions.has(PermissionFlagsBits.KickMembers),
        banMembers: me.permissions.has(PermissionFlagsBits.BanMembers),
        manageMessages: me.permissions.has(PermissionFlagsBits.ManageMessages),
        highestRolePosition: me.roles.highest.position,
        highestRoleName: me.roles.highest.name,
      }
    : null;

  const guildConfig = state.guilds[guild.id] || {};
  const activeHubs = Object.entries(state.hubs).filter(([, gId]) => gId === guild.id).length;
  const activeTempRooms = Object.keys(state.temp).filter((chId) => guild.channels.cache.has(chId)).length;

  res.json({
    guild: {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 256 }),
      banner: guild.bannerURL({ size: 1024 }),
      description: guild.description,
      ownerId: guild.ownerId,
      createdAt: guild.createdAt,
      memberCount: guild.memberCount,
      onlineCount,
      botCount,
      humanCount,
      premiumTier: guild.premiumTier,
      premiumSubscriptionCount: guild.premiumSubscriptionCount || 0,
      channelsCount: {
        total: guild.channels.cache.size,
        text: textChannels,
        voice: voiceChannels,
        categories,
        stage: stageChannels,
      },
      rolesCount: guild.roles.cache.size,
      botPermissions,
      config: guildConfig,
      voiceStats: {
        activeHubs,
        activeTempRooms,
      },
    },
  });
});

router.post('/:guildId/sync-stats', verifyGuildAccess, async (req, res) => {
  try {
    await syncGuildStats(req.guild);
    return res.json({ success: true, message: 'Server stats channels synchronized successfully!' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to sync server stats: ${err.message}` });
  }
});

router.get('/:guildId/analytics', verifyGuildAccess, async (req, res) => {
  try {
    const guild = req.guild;
    const rawPeriod = parseInt(String(req.query.period || '7'), 10);
    const periodDays = [7, 14, 30].includes(rawPeriod) ? rawPeriod : 7;

    const guildConfig = state.guilds[guild.id] || {};

    // Channels breakdown
    const allChannels = Array.from(guild.channels.cache.values());
    const textChannels = allChannels.filter((c) => c.type === ChannelType.GuildText).length;
    const voiceChannels = allChannels.filter((c) => c.type === ChannelType.GuildVoice).length;
    const categories = allChannels.filter((c) => c.type === ChannelType.GuildCategory).length;
    const stageChannels = allChannels.filter((c) => c.type === ChannelType.GuildStageVoice).length;
    const announcementChannels = allChannels.filter((c) => c.type === ChannelType.GuildAnnouncement).length;
    const forumChannels = allChannels.filter((c) => c.type === ChannelType.GuildForum).length;

    // Members breakdown
    let onlineCount = 0;
    let botCount = 0;
    let humanCount = 0;
    let verifiedMembers = 0;
    const verifiedRoleId = guildConfig.verifiedRoleId || null;

    for (const m of guild.members.cache.values()) {
      if (m.user.bot) {
        botCount++;
      } else {
        humanCount++;
        if (verifiedRoleId && m.roles.cache.has(verifiedRoleId)) {
          verifiedMembers++;
        }
      }
      if (m.presence?.status && m.presence.status !== 'offline') {
        onlineCount++;
      }
    }

    // Build daily timeline buckets for the selected period (7d / 14d / 30d)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const periodStartMs = startOfToday - (periodDays - 1) * dayMs;

    const dailyBuckets = [];
    for (let i = 0; i < periodDays; i++) {
      const bucketStart = periodStartMs + i * dayMs;
      const bucketEnd = bucketStart + dayMs;
      const d = new Date(bucketStart);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let joins = 0;
      let verifiedJoins = 0;
      for (const m of guild.members.cache.values()) {
        if (!m.user.bot && m.joinedTimestamp && m.joinedTimestamp >= bucketStart && m.joinedTimestamp < bucketEnd) {
          joins++;
          if (verifiedRoleId && m.roles.cache.has(verifiedRoleId)) {
            verifiedJoins++;
          }
        }
      }

      let channelsCreated = 0;
      for (const ch of allChannels) {
        if (ch.createdTimestamp && ch.createdTimestamp >= bucketStart && ch.createdTimestamp < bucketEnd) {
          channelsCreated++;
        }
      }

      let rolesCreated = 0;
      for (const r of guild.roles.cache.values()) {
        if (r.createdTimestamp && r.createdTimestamp >= bucketStart && r.createdTimestamp < bucketEnd) {
          rolesCreated++;
        }
      }

      dailyBuckets.push({
        date: d.toISOString().slice(0, 10),
        label,
        joins,
        verifiedJoins,
        channelsCreated,
        rolesCreated,
      });
    }

    const joinsInPeriod = dailyBuckets.reduce((acc, b) => acc + b.joins, 0);
    const verifiedInPeriod = dailyBuckets.reduce((acc, b) => acc + b.verifiedJoins, 0);
    const channelsCreatedInPeriod = dailyBuckets.reduce((acc, b) => acc + b.channelsCreated, 0);
    const rolesCreatedInPeriod = dailyBuckets.reduce((acc, b) => acc + b.rolesCreated, 0);

    // 1. Verification Analytics
    const verifiedRoleObj = verifiedRoleId ? guild.roles.cache.get(verifiedRoleId) : null;
    const rulesChannelObj = guildConfig.rulesId ? guild.channels.cache.get(guildConfig.rulesId) : null;
    const unverifiedMembers = verifiedRoleId ? Math.max(0, humanCount - verifiedMembers) : humanCount;
    const verificationRate =
      verifiedRoleId && humanCount > 0 ? Math.round((verifiedMembers / humanCount) * 100) : null;
    const antiInviteEnabled = Boolean(guildConfig.automod?.antiInvite ?? guildConfig.antiInvite);
    const antiSpamEnabled = Boolean(guildConfig.automod?.antiSpam ?? guildConfig.antiSpam);

    // 3. Welcomer & Leave Analytics
    const welcomeCfg = guildConfig.welcomeConfig || guildConfig.welcome || {};
    const goodbyeCfg = guildConfig.goodbyeConfig || guildConfig.goodbye || {};
    const welcomeChannelId = welcomeCfg.channelId || guildConfig.welcomeId || null;
    const goodbyeChannelId = goodbyeCfg.channelId || guildConfig.goodbyeId || null;
    const welcomeChannelObj = welcomeChannelId ? guild.channels.cache.get(welcomeChannelId) : null;
    const goodbyeChannelObj = goodbyeChannelId ? guild.channels.cache.get(goodbyeChannelId) : null;
    const welcomeEnabled = Boolean(welcomeCfg.enabled ?? welcomeChannelId);
    const goodbyeEnabled = Boolean(goodbyeCfg.enabled ?? goodbyeChannelId);
    const autoRolesList = Array.isArray(welcomeCfg.autoRoleIds)
      ? welcomeCfg.autoRoleIds
      : Array.isArray(welcomeCfg.roleIds)
      ? welcomeCfg.roleIds
      : guildConfig.memberRoleId
      ? [guildConfig.memberRoleId]
      : [];

    // 4. Dynamic Voice Hubs Analytics
    const guildHubIds = Object.entries(state.hubs || {})
      .filter(([, gId]) => gId === guild.id)
      .map(([chId]) => chId);

    const activeHubsList = guildHubIds
      .map((chId) => {
        const ch = guild.channels.cache.get(chId);
        if (!ch) return null;
        const parent = ch.parentId ? guild.channels.cache.get(ch.parentId) : null;
        return {
          id: ch.id,
          name: ch.name,
          categoryName: parent ? parent.name : 'Uncategorized',
          connectedCount: ch.members ? ch.members.size : 0,
        };
      })
      .filter(Boolean);

    const activeTempRoomsList = Object.entries(state.temp || {})
      .filter(([chId]) => guild.channels.cache.has(chId))
      .map(([chId, ownerId]) => {
        const ch = guild.channels.cache.get(chId);
        return {
          id: chId,
          name: ch?.name || 'Temp Voice',
          ownerId,
          connectedCount: ch?.members ? ch.members.size : 0,
          hasWaitingRoom: Boolean(state.waiting?.[chId]),
        };
      });

    let totalVoiceConnected = 0;
    for (const ch of allChannels) {
      if (
        (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice) &&
        ch.members
      ) {
        totalVoiceConnected += ch.members.size;
      }
    }

    // 5. Roles & Structure Analytics
    const allRoles = Array.from(guild.roles.cache.values()).filter((r) => r.id !== guild.id);
    const hoistedRoles = allRoles.filter((r) => r.hoist).length;
    const managedRoles = allRoles.filter((r) => r.managed).length;
    const customRoles = allRoles.filter((r) => !r.managed).length;
    const coloredRoles = allRoles.filter((r) => r.color && r.color !== 0).length;

    // 6. Milestones & Backups Analytics
    const backupsList = Object.entries(state.backups || {}).map(([slug, b]) => {
      const specLines = String(b.spec || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const categoriesCount = specLines.filter((l) => l.startsWith('===') || l.endsWith(':')).length || 1;
      const channelsCount = specLines.filter((l) => !l.startsWith('===') && !l.endsWith(':')).length;
      return {
        slug,
        label: b.label || slug,
        createdAt: b.updatedAt || b.createdAt || null,
        categoriesCount,
        channelsCount,
        rolesCount: Array.isArray(b.roles) ? b.roles.length : 0,
      };
    });

    const rawGoals = Array.isArray(guildConfig.milestone?.goals)
      ? guildConfig.milestone.goals
      : Array.isArray(guildConfig.milestoneTargets)
      ? guildConfig.milestoneTargets
      : [10, 25, 50, 100, 250, 500];
    const milestoneTargets = [...new Set([...rawGoals, 50, 100, 250, 500])].sort((a, b) => a - b);
    const nextMilestone = milestoneTargets.find((t) => t > guild.memberCount) || null;
    const reachedMilestones = milestoneTargets.filter((t) => t <= guild.memberCount);
    const msChannelId = guildConfig.milestone?.channelId || guildConfig.milestoneChannelId || guildConfig.welcomeId || null;
    const milestoneChannelObj = msChannelId ? guild.channels.cache.get(msChannelId) : null;
    const lastMilestoneReached =
      guildConfig.milestone?.highestReached ||
      guildConfig.lastMilestoneReached ||
      (reachedMilestones.length > 0 ? reachedMilestones[reachedMilestones.length - 1] : 0);

    return res.json({
      periodDays,
      dailyBuckets,
      summary: {
        memberCount: guild.memberCount,
        humanCount,
        botCount,
        onlineCount,
        boostCount: guild.premiumSubscriptionCount || 0,
        boostTier: guild.premiumTier || 0,
      },
      verification: {
        configured: Boolean(verifiedRoleId),
        verifiedRoleId,
        verifiedRoleName: verifiedRoleObj?.name || null,
        rulesChannelId: guildConfig.rulesId || null,
        rulesChannelName: rulesChannelObj?.name || null,
        verifiedMembers,
        unverifiedMembers,
        verificationRate,
        verifiedInPeriod,
        antiInvite: antiInviteEnabled,
        antiSpam: antiSpamEnabled,
      },
      welcomer: {
        welcomeEnabled,
        welcomeChannelName: welcomeChannelObj?.name || null,
        cardEnabled: Boolean(welcomeCfg.cardEnabled ?? true),
        dmEnabled: Boolean(welcomeCfg.dmEnabled),
        autoRolesCount: autoRolesList.length,
        goodbyeEnabled,
        goodbyeChannelName: goodbyeChannelObj?.name || null,
        joinsInPeriod,
      },
      voice: {
        hubsCount: activeHubsList.length,
        tempRoomsCount: activeTempRoomsList.length,
        totalVoiceChannels: voiceChannels,
        stageChannels,
        totalVoiceConnected,
        hubs: activeHubsList,
        tempRooms: activeTempRoomsList,
      },
      structure: {
        totalChannels: allChannels.length,
        textChannels,
        voiceChannels,
        categories,
        stageChannels,
        announcementChannels,
        forumChannels,
        totalRoles: allRoles.length,
        hoistedRoles,
        managedRoles,
        customRoles,
        coloredRoles,
        channelsCreatedInPeriod,
        rolesCreatedInPeriod,
      },
      backupsAndMilestones: {
        backupsCount: backupsList.length,
        backups: backupsList,
        milestoneTargets,
        reachedCount: reachedMilestones.length,
        nextMilestone,
        lastMilestoneReached,
        milestoneChannelName: milestoneChannelObj?.name || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch analytics: ${err.message}` });
  }
});

export default router;
