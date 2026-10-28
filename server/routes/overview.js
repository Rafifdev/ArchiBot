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

export default router;
