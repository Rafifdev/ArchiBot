import { Router } from 'express';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { state, saveState } from '../botClient.js';

const router = Router();
router.use(verifySession);

function getChannelTypeName(type) {
  switch (type) {
    case ChannelType.GuildText:
      return 'text';
    case ChannelType.GuildVoice:
      return 'voice';
    case ChannelType.GuildCategory:
      return 'category';
    case ChannelType.GuildAnnouncement:
      return 'announcement';
    case ChannelType.GuildStageVoice:
      return 'stage';
    case ChannelType.GuildForum:
      return 'forum';
    default:
      return 'other';
  }
}

router.get('/:guildId/channels', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  await guild.channels.fetch().catch(() => {});

  const channelsList = [...guild.channels.cache.values()]
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .map((ch) => {
      const everyoneOverwrite = ch.permissionOverwrites.cache.get(guild.roles.everyone.id);
      const isLocked =
        everyoneOverwrite?.deny?.has(PermissionFlagsBits.SendMessages) ||
        everyoneOverwrite?.deny?.has(PermissionFlagsBits.Connect);

      return {
        id: ch.id,
        name: ch.name,
        type: ch.type,
        typeName: getChannelTypeName(ch.type),
        parentId: ch.parentId,
        position: ch.position,
        rawPosition: ch.rawPosition,
        topic: ch.topic || null,
        rateLimitPerUser: ch.rateLimitPerUser || 0,
        nsfw: Boolean(ch.nsfw),
        bitrate: ch.bitrate || null,
        userLimit: ch.userLimit || 0,
        isAutoVoiceHub: Boolean(state.hubs[ch.id]),
        isTempRoom: Boolean(state.temp[ch.id]),
        isLocked: Boolean(isLocked),
        overwritesCount: ch.permissionOverwrites.cache.size,
      };
    });

  res.json({ channels: channelsList });
});

router.post('/:guildId/channels', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { name, type, parentId, topic, rateLimitPerUser, nsfw, userLimit } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Channel name is required.' });
  }

  let discordType = ChannelType.GuildText;
  const isAutoVoice = type === 'autovoice';
  const isReadOnly = type === 'readonly';

  if (type === 'voice' || isAutoVoice) {
    discordType = ChannelType.GuildVoice;
  } else if (type === 'category') {
    discordType = ChannelType.GuildCategory;
  } else if (type === 'announcement') {
    discordType = ChannelType.GuildAnnouncement;
  } else if (type === 'stage') {
    discordType = ChannelType.GuildStageVoice;
  }

  try {
    const options = {
      name: name.trim().slice(0, 100),
      type: discordType,
      parent: parentId || null,
      topic: topic?.slice(0, 1024) || undefined,
      rateLimitPerUser: Number(rateLimitPerUser) || 0,
      nsfw: Boolean(nsfw),
    };

    if (discordType === ChannelType.GuildVoice && userLimit) {
      options.userLimit = Number(userLimit) || 0;
    }

    if (isReadOnly) {
      options.permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.SendMessages],
        },
      ];
    }

    const created = await guild.channels.create(options);

    if (isAutoVoice) {
      state.hubs[created.id] = guild.id;
      saveState();
    }

    return res.json({
      success: true,
      channel: {
        id: created.id,
        name: created.name,
        type: created.type,
        typeName: getChannelTypeName(created.type),
        parentId: created.parentId,
        isAutoVoiceHub: isAutoVoice,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: `Failed to create channel: ${err.message}` });
  }
});

router.patch('/:guildId/channels/:channelId', verifyGuildAccess, async (req, res) => {
  const channel = req.guild.channels.cache.get(req.params.channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found.' });
  }

  const { name, topic, rateLimitPerUser, nsfw, parentId, bitrate, userLimit } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = String(name).trim().slice(0, 100);
  if (topic !== undefined) updates.topic = String(topic || '').slice(0, 1024);
  if (rateLimitPerUser !== undefined) updates.rateLimitPerUser = Number(rateLimitPerUser) || 0;
  if (nsfw !== undefined) updates.nsfw = Boolean(nsfw);
  if (parentId !== undefined) updates.parent = parentId || null;
  if (bitrate !== undefined && channel.isVoiceBased?.()) updates.bitrate = Number(bitrate);
  if (userLimit !== undefined && channel.isVoiceBased?.()) updates.userLimit = Number(userLimit);

  try {
    await channel.edit(updates);
    return res.json({ success: true, message: 'Channel updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to update channel: ${err.message}` });
  }
});

router.post('/:guildId/channels/:channelId/lock', verifyGuildAccess, async (req, res) => {
  const channel = req.guild.channels.cache.get(req.params.channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found.' });
  }

  const everyoneRole = req.guild.roles.everyone;
  const current = channel.permissionOverwrites.cache.get(everyoneRole.id);

  try {
    if (channel.isVoiceBased?.()) {
      const isLocked = current?.deny?.has(PermissionFlagsBits.Connect);
      await channel.permissionOverwrites.edit(everyoneRole.id, {
        Connect: isLocked ? null : false,
      });
      return res.json({ success: true, locked: !isLocked });
    }

    const isLocked = current?.deny?.has(PermissionFlagsBits.SendMessages);
    await channel.permissionOverwrites.edit(everyoneRole.id, {
      SendMessages: isLocked ? null : false,
    });
    return res.json({ success: true, locked: !isLocked });
  } catch (err) {
    return res.status(500).json({ error: `Failed to toggle lock: ${err.message}` });
  }
});

router.post('/:guildId/channels/:channelId/sync', verifyGuildAccess, async (req, res) => {
  const channel = req.guild.channels.cache.get(req.params.channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found.' });
  }
  if (!channel.parent) {
    return res.status(400).json({ error: 'This channel is not in a category.' });
  }

  try {
    await channel.lockPermissions();
    return res.json({ success: true, message: 'Permissions synced with parent category.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to sync permissions: ${err.message}` });
  }
});

router.delete('/:guildId/channels/:channelId', verifyGuildAccess, async (req, res) => {
  const channel = req.guild.channels.cache.get(req.params.channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found.' });
  }

  const chId = channel.id;
  try {
    delete state.hubs[chId];
    delete state.temp[chId];
    delete state.waiting[chId];
    saveState();

    await channel.delete('Deleted via ArchiBot Web Dashboard');
    return res.json({ success: true, message: 'Channel deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to delete channel: ${err.message}` });
  }
});

export default router;
