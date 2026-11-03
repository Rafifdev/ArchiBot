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
      const isVoice = ch.isVoiceBased?.() || ch.type === 2 || ch.type === 13;
      const isLocked = isVoice
        ? Boolean(everyoneOverwrite?.deny?.has(PermissionFlagsBits.Connect))
        : Boolean(everyoneOverwrite?.deny?.has(PermissionFlagsBits.SendMessages));

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

const pendingChannelLocks = new Set();

router.post('/:guildId/channels/:channelId/lock', verifyGuildAccess, async (req, res) => {
  const channelId = req.params.channelId;

  // Prevent concurrent duplicate lock executions for the exact same channel
  if (pendingChannelLocks.has(channelId)) {
    return res.status(429).json({ error: 'Operasi lock sedang berjalan untuk channel ini. Harap tunggu.' });
  }

  const channel = req.guild.channels.cache.get(channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found.' });
  }

  pendingChannelLocks.add(channelId);

  const everyoneRole = req.guild.roles.everyone;
  const current = channel.permissionOverwrites.cache.get(everyoneRole.id);
  const guildCfg = state.guilds?.[req.guild.id] || {};
  const memberRoleIds = [guildCfg.memberRoleId, guildCfg.verifiedRoleId].filter(Boolean);

  // If explicit target state `locked: boolean` was supplied by client, use it; otherwise toggle
  const desiredLocked = typeof req.body?.locked === 'boolean' ? req.body.locked : undefined;

  try {
    const isVoice = channel.isVoiceBased?.() || channel.type === 2 || channel.type === 13;

    if (isVoice) {
      const isLocked = Boolean(current?.deny?.has(PermissionFlagsBits.Connect));
      const nextLocked = desiredLocked !== undefined ? desiredLocked : !isLocked;

      // Idempotency: if already in desired state, return success immediately
      if (desiredLocked !== undefined && isLocked === desiredLocked) {
        return res.json({
          success: true,
          locked: nextLocked,
          message: nextLocked ? `Voice channel #${channel.name} sudah terkunci.` : `Voice channel #${channel.name} sudah terbuka.`,
        });
      }

      await channel.permissionOverwrites.edit(everyoneRole.id, {
        Connect: nextLocked ? false : null,
        SendMessages: nextLocked ? false : null,
      });

      for (const roleId of memberRoleIds) {
        if (channel.permissionOverwrites.cache.has(roleId)) {
          await channel.permissionOverwrites.edit(roleId, {
            Connect: nextLocked ? false : null,
            SendMessages: nextLocked ? false : null,
          }).catch(() => {});
        }
      }

      return res.json({
        success: true,
        locked: nextLocked,
        message: nextLocked ? `Voice channel #${channel.name} berhasil dikunci.` : `Voice channel #${channel.name} berhasil dibuka.`,
      });
    }

    const isLocked = Boolean(current?.deny?.has(PermissionFlagsBits.SendMessages));
    const nextLocked = desiredLocked !== undefined ? desiredLocked : !isLocked;

    // Idempotency: if already in desired state, return success immediately
    if (desiredLocked !== undefined && isLocked === desiredLocked) {
      return res.json({
        success: true,
        locked: nextLocked,
        message: nextLocked ? `Channel #${channel.name} sudah terkunci.` : `Channel #${channel.name} sudah terbuka.`,
      });
    }

    await channel.permissionOverwrites.edit(everyoneRole.id, {
      SendMessages: nextLocked ? false : null,
      SendMessagesInThreads: nextLocked ? false : null,
      CreatePublicThreads: nextLocked ? false : null,
      CreatePrivateThreads: nextLocked ? false : null,
      AddReactions: nextLocked ? false : null,
    });

    for (const roleId of memberRoleIds) {
      const roleOw = channel.permissionOverwrites.cache.get(roleId);
      if (roleOw) {
        await channel.permissionOverwrites.edit(roleId, {
          SendMessages: nextLocked ? false : null,
          SendMessagesInThreads: nextLocked ? false : null,
          CreatePublicThreads: nextLocked ? false : null,
          CreatePrivateThreads: nextLocked ? false : null,
          AddReactions: nextLocked ? false : null,
        }).catch(() => {});
      }
    }

    return res.json({
      success: true,
      locked: nextLocked,
      message: nextLocked ? `Channel #${channel.name} berhasil dikunci.` : `Channel #${channel.name} berhasil dibuka.`,
    });
  } catch (err) {
    console.error('Channel lock toggle error:', err);
    return res.status(500).json({ error: `Gagal mengubah status lock: ${err.message}` });
  } finally {
    pendingChannelLocks.delete(channelId);
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

router.put('/:guildId/channels/positions', verifyGuildAccess, async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Array of channel updates is required.' });
  }

  const guild = req.guild;

  // Discord REST API restriction: "Only one channel can have a parent_id modified at a time"
  // Filter out `parent` from items where parentId is unchanged compared to current Discord state.
  let parentChangeCount = 0;
  const validUpdates = updates
    .filter((u) => u && u.id && guild.channels.cache.has(u.id))
    .map((u) => {
      const existingChannel = guild.channels.cache.get(u.id);
      const existingParent = existingChannel?.parentId || null;
      const requestedParent = u.parentId !== undefined ? (u.parentId || null) : undefined;
      const isParentModified = requestedParent !== undefined && requestedParent !== existingParent;

      const item = {
        channel: u.id,
        position: typeof u.position === 'number' ? u.position : undefined,
      };

      // Only pass `parent` and `lockPermissions` if parent actually changed and we haven't already assigned one
      if (isParentModified && parentChangeCount === 0) {
        item.parent = requestedParent;
        item.lockPermissions = Boolean(u.lockPermissions);
        parentChangeCount++;
      }

      return item;
    });

  if (validUpdates.length === 0) {
    return res.status(400).json({ error: 'No valid channels found in updates array.' });
  }

  try {
    await guild.channels.setPositions(validUpdates);
    return res.json({ success: true, message: 'Channel positions updated successfully.' });
  } catch (err) {
    console.error('Failed to set channel positions:', err);
    return res.status(500).json({ error: `Failed to update positions: ${err.message}` });
  }
});

export default router;
