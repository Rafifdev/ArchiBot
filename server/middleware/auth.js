import jwt from 'jsonwebtoken';
import { PermissionFlagsBits } from 'discord.js';
import { config } from '../config.js';
import { client } from '../botClient.js';

export function signUserToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}

export function verifySession(req, res, next) {
  const token = req.cookies?.archibot_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

export async function verifyGuildAccess(req, res, next) {
  const guildId = req.params.guildId || req.body?.guildId || req.query?.guildId;
  if (!guildId) {
    return res.status(400).json({ error: 'Missing guildId parameter.' });
  }

  const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
  if (!guild) {
    return res.status(404).json({ error: 'ArchiBot is not in this server or the server does not exist.' });
  }

  req.guild = guild;

  // Local owner or dev login has full access
  if (req.user?.isDev || req.user?.isOwner) {
    return next();
  }

  // Bot Application Owner has full master access to all servers where ArchiBot is installed
  if (client.isReady() && client.application) {
    const appOwnerId = client.application.owner?.ownerUserId || client.application.owner?.id;
    if (appOwnerId && appOwnerId === req.user?.id) {
      if (req.user) req.user.isOwner = true;
      return next();
    }
  }

  // Guild owner always has access
  if (guild.ownerId === req.user.id) {
    return next();
  }

  // Check member permissions in the guild
  try {
    const member = guild.members.cache.get(req.user.id) || (await guild.members.fetch(req.user.id).catch(() => null));
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this server.' });
    }

    const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const hasManageGuild = member.permissions.has(PermissionFlagsBits.ManageGuild);

    if (!hasAdmin && !hasManageGuild) {
      return res.status(403).json({
        error: 'You need Administrator or Manage Server permissions to manage this server.',
      });
    }

    req.member = member;
    return next();
  } catch (err) {
    return res.status(500).json({ error: `Failed to verify server permissions: ${err.message}` });
  }
}
