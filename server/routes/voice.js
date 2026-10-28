import { Router } from 'express';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { state, saveState, applyVoicePrivacy, cleanupVoiceRoom } from '../botClient.js';

const router = Router();
router.use(verifySession);

router.get('/:guildId/voice', verifyGuildAccess, (req, res) => {
  const guild = req.guild;

  // Find all auto-voice generator hubs in this guild
  const hubs = Object.entries(state.hubs)
    .filter(([, gId]) => gId === guild.id)
    .map(([chId]) => {
      const ch = guild.channels.cache.get(chId);
      return {
        id: chId,
        name: ch?.name || 'Unknown Channel',
        exists: Boolean(ch),
        parentId: ch?.parentId || null,
      };
    });

  // Find all currently active temporary voice rooms in this guild
  const tempRooms = Object.entries(state.temp)
    .filter(([chId]) => guild.channels.cache.has(chId))
    .map(([chId, ownerId]) => {
      const ch = guild.channels.cache.get(chId);
      const ownerMember = guild.members.cache.get(ownerId);
      const everyoneOverwrite = ch.permissionOverwrites.cache.get(guild.roles.everyone.id);
      const isLocked = Boolean(everyoneOverwrite?.deny?.has(PermissionFlagsBits.Connect));

      return {
        id: ch.id,
        name: ch.name,
        ownerId,
        ownerName: ownerMember?.user?.username || 'Left Server',
        ownerAvatar: ownerMember?.user?.displayAvatarURL() || null,
        userLimit: ch.userLimit || 0,
        bitrate: ch.bitrate || 64000,
        memberCount: ch.members?.size || 0,
        members: [...(ch.members?.values() || [])].map((m) => ({
          id: m.id,
          username: m.user.username,
          avatar: m.user.displayAvatarURL(),
        })),
        isLocked,
        waitingRoomId: state.waiting[ch.id] || null,
      };
    });

  res.json({ hubs, tempRooms });
});

router.post('/:guildId/voice/hubs', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { name, parentId } = req.body;

  try {
    const formattedName = name?.trim() ? name.trim() : '➕ Create Voice';
    const ch = await guild.channels.create({
      name: formattedName.slice(0, 100),
      type: ChannelType.GuildVoice,
      parent: parentId || null,
    });

    state.hubs[ch.id] = guild.id;
    saveState();

    return res.json({ success: true, hub: { id: ch.id, name: ch.name } });
  } catch (err) {
    return res.status(500).json({ error: `Failed to create auto-voice hub: ${err.message}` });
  }
});

router.delete('/:guildId/voice/hubs/:channelId', verifyGuildAccess, async (req, res) => {
  const chId = req.params.channelId;
  delete state.hubs[chId];
  saveState();

  const ch = req.guild.channels.cache.get(chId);
  if (ch && req.body?.deleteChannel) {
    await ch.delete('Auto-voice hub deleted').catch(() => {});
  }

  return res.json({ success: true, message: 'Auto-voice hub removed.' });
});

router.patch('/:guildId/voice/rooms/:channelId', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const ch = guild.channels.cache.get(req.params.channelId);

  if (!ch || !ch.isVoiceBased()) {
    return res.status(404).json({ error: 'Temporary voice room not found.' });
  }

  const { name, userLimit, privacy, disconnectMemberId } = req.body;

  try {
    if (name !== undefined) {
      await ch.setName(`🔊 ${name}`.slice(0, 100));
    }
    if (userLimit !== undefined) {
      await ch.setUserLimit(Number(userLimit) || 0);
    }
    if (privacy) {
      await applyVoicePrivacy(ch, privacy);
    }
    if (disconnectMemberId) {
      const targetMember = guild.members.cache.get(disconnectMemberId);
      if (targetMember && targetMember.voice.channelId === ch.id) {
        await targetMember.voice.disconnect('Disconnected via ArchiBot Web Dashboard');
      }
    }

    return res.json({ success: true, message: 'Temporary voice room updated.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to update voice room: ${err.message}` });
  }
});

router.delete('/:guildId/voice/rooms/:channelId', verifyGuildAccess, async (req, res) => {
  const ch = req.guild.channels.cache.get(req.params.channelId);
  const chId = req.params.channelId;

  try {
    await cleanupVoiceRoom(chId);
    if (ch) {
      await ch.delete('Force closed via ArchiBot Web Dashboard').catch(() => {});
    }
    return res.json({ success: true, message: 'Temporary voice room closed.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to close voice room: ${err.message}` });
  }
});

export default router;
