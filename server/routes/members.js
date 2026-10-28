import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { state, saveState } from '../botClient.js';

const router = Router();
router.use(verifySession);

router.get('/:guildId/members', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const q = String(req.query.q || '').trim().toLowerCase();
  const roleId = String(req.query.roleId || '');
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  try {
    if (guild.members.cache.size < guild.memberCount) {
      await guild.members.fetch({ limit: 200 }).catch(() => {});
    }

    const cfg = state.guilds[guild.id] || {};
    const warningsMap = cfg.warnings || {};

    let members = [...guild.members.cache.values()];

    if (roleId) {
      members = members.filter((m) => m.roles.cache.has(roleId));
    }

    if (q) {
      members = members.filter(
        (m) =>
          m.user.username.toLowerCase().includes(q) ||
          m.displayName.toLowerCase().includes(q) ||
          m.id.includes(q)
      );
    }

    const result = members.slice(0, limit).map((m) => {
      const isTimedOut = Boolean(
        m.communicationDisabledUntil && new Date(m.communicationDisabledUntil) > new Date()
      );
      return {
        id: m.id,
        username: m.user.username,
        discriminator: m.user.discriminator,
        globalName: m.user.globalName || m.user.username,
        displayName: m.displayName,
        avatar: m.user.displayAvatarURL(),
        bot: m.user.bot,
        joinedAt: m.joinedAt,
        roles: m.roles.cache.map((r) => ({ id: r.id, name: r.name, color: r.hexColor })),
        timedOut: isTimedOut,
        timeoutUntil: m.communicationDisabledUntil,
        manageable: m.manageable,
        moderatable: m.moderatable,
        isOwner: m.id === guild.ownerId,
        warningsCount: (warningsMap[m.id] || []).length,
      };
    });

    return res.json({ members: result, totalLoaded: members.length });
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch members: ${err.message}` });
  }
});

router.patch('/:guildId/members/:memberId', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const member = guild.members.cache.get(req.params.memberId) || (await guild.members.fetch(req.params.memberId).catch(() => null));

  if (!member) {
    return res.status(404).json({ error: 'Member not found.' });
  }

  const { nickname, addRoles, removeRoles } = req.body;
  const me = await guild.members.fetchMe();

  if (member.roles.highest.position >= me.roles.highest.position && member.id !== me.id) {
    return res.status(403).json({ error: 'Cannot modify a member whose role is equal to or higher than the bot role.' });
  }

  try {
    if (nickname !== undefined) {
      await member.setNickname(nickname ? String(nickname).slice(0, 32) : null);
    }

    if (Array.isArray(addRoles) && addRoles.length) {
      const validAdd = addRoles.filter((rId) => {
        const r = guild.roles.cache.get(rId);
        return r && r.position < me.roles.highest.position && !r.managed;
      });
      if (validAdd.length) await member.roles.add(validAdd);
    }

    if (Array.isArray(removeRoles) && removeRoles.length) {
      const validRemove = removeRoles.filter((rId) => {
        const r = guild.roles.cache.get(rId);
        return r && r.position < me.roles.highest.position && !r.managed;
      });
      if (validRemove.length) await member.roles.remove(validRemove);
    }

    return res.json({ success: true, message: 'Member updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to update member: ${err.message}` });
  }
});

router.post('/:guildId/members/:memberId/timeout', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const member = guild.members.cache.get(req.params.memberId) || (await guild.members.fetch(req.params.memberId).catch(() => null));

  if (!member) return res.status(404).json({ error: 'Member not found.' });
  if (!member.moderatable) return res.status(403).json({ error: 'This member cannot be timed out by the bot.' });

  const { durationSeconds, reason } = req.body;
  const timeMs = durationSeconds ? Number(durationSeconds) * 1000 : null;

  try {
    await member.timeout(timeMs, reason || 'Timed out via ArchiBot Web Dashboard');
    return res.json({
      success: true,
      message: durationSeconds ? `Member timed out for ${durationSeconds} seconds.` : 'Timeout removed.',
    });
  } catch (err) {
    return res.status(500).json({ error: `Failed to timeout member: ${err.message}` });
  }
});

router.post('/:guildId/members/:memberId/kick', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const member = guild.members.cache.get(req.params.memberId) || (await guild.members.fetch(req.params.memberId).catch(() => null));

  if (!member) return res.status(404).json({ error: 'Member not found.' });
  if (!member.kickable) return res.status(403).json({ error: 'This member cannot be kicked by the bot.' });

  const { reason } = req.body;
  try {
    await member.kick(reason || 'Kicked via ArchiBot Web Dashboard');
    return res.json({ success: true, message: `Successfully kicked ${member.user.tag}.` });
  } catch (err) {
    return res.status(500).json({ error: `Failed to kick member: ${err.message}` });
  }
});

router.post('/:guildId/members/:memberId/ban', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const memberId = req.params.memberId;
  const { deleteMessageDays, reason } = req.body;

  const seconds = (Number(deleteMessageDays) || 0) * 86400;

  try {
    await guild.bans.create(memberId, {
      deleteMessageSeconds: seconds,
      reason: reason || 'Banned via ArchiBot Web Dashboard',
    });
    return res.json({ success: true, message: 'Member successfully banned.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to ban member: ${err.message}` });
  }
});

router.get('/:guildId/bans', verifyGuildAccess, async (req, res) => {
  try {
    const bans = await req.guild.bans.fetch();
    const list = [...bans.values()].map((b) => ({
      userId: b.user.id,
      username: b.user.username,
      avatar: b.user.displayAvatarURL(),
      reason: b.reason || 'No reason provided',
    }));
    return res.json({ bans: list });
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch bans: ${err.message}` });
  }
});

router.delete('/:guildId/bans/:userId', verifyGuildAccess, async (req, res) => {
  try {
    await req.guild.bans.remove(req.params.userId, req.body?.reason || 'Unbanned via ArchiBot Web Dashboard');
    return res.json({ success: true, message: 'User unbanned successfully.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to unban user: ${err.message}` });
  }
});

router.get('/:guildId/members/:memberId/warnings', verifyGuildAccess, (req, res) => {
  const cfg = state.guilds[req.guild.id] || {};
  const warnings = cfg.warnings?.[req.params.memberId] || [];
  res.json({ warnings });
});

router.post('/:guildId/members/:memberId/warnings', verifyGuildAccess, (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) {
    return res.status(400).json({ error: 'Warning reason is required.' });
  }

  const guildId = req.guild.id;
  const memberId = req.params.memberId;

  const cfg = (state.guilds[guildId] ??= {});
  cfg.warnings ??= {};
  cfg.warnings[memberId] ??= [];

  const warning = {
    id: randomUUID(),
    reason: reason.trim(),
    moderatorId: req.user.id,
    moderatorTag: req.user.username,
    createdAt: new Date().toISOString(),
  };

  cfg.warnings[memberId].push(warning);
  saveState();

  res.json({ success: true, warning });
});

router.delete('/:guildId/members/:memberId/warnings/:warningId', verifyGuildAccess, (req, res) => {
  const guildId = req.guild.id;
  const memberId = req.params.memberId;
  const warningId = req.params.warningId;

  const cfg = state.guilds[guildId];
  if (!cfg?.warnings?.[memberId]) {
    return res.status(404).json({ error: 'Warning not found.' });
  }

  cfg.warnings[memberId] = cfg.warnings[memberId].filter((w) => w.id !== warningId);
  saveState();

  res.json({ success: true, message: 'Warning deleted.' });
});

export default router;
