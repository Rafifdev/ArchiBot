import { Router } from 'express';
import { PermissionFlagsBits } from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import { state, saveState } from '../botClient.js';

const router = Router();
router.use(verifySession);

router.get('/:guildId/roles', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  await guild.roles.fetch().catch(() => {});
  const me = await guild.members.fetchMe().catch(() => null);

  const roles = [...guild.roles.cache.values()]
    .sort((a, b) => b.position - a.position)
    .map((r) => {
      const isHigherOrEqual = me ? r.position >= me.roles.highest.position : true;
      const isEditable = !r.managed && r.id !== guild.id && !isHigherOrEqual;

      return {
        id: r.id,
        name: r.name,
        color: r.hexColor,
        colorNumber: r.color,
        hoist: r.hoist,
        position: r.position,
        mentionable: r.mentionable,
        managed: r.managed,
        isEveryone: r.id === guild.id,
        memberCount: r.members.size,
        editable: isEditable,
        permissions: r.permissions.toArray(),
        bitfield: r.permissions.bitfield.toString(),
      };
    });

  const cfg = state.guilds[guild.id] || {};

  res.json({
    roles,
    autoRoles: {
      memberRoleId: cfg.memberRoleId || null,
      verifiedRoleId: cfg.verifiedRoleId || null,
    },
  });
});

router.post('/:guildId/roles', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { name, color, hoist, mentionable, permissions } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Role name is required.' });
  }

  try {
    const role = await guild.roles.create({
      name: name.trim().slice(0, 100),
      color: color || '#5865f2',
      hoist: Boolean(hoist),
      mentionable: Boolean(mentionable),
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    return res.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        color: role.hexColor,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions.toArray(),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: `Failed to create role: ${err.message}` });
  }
});

router.patch('/:guildId/roles/:roleId', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  let role = guild.roles.cache.get(req.params.roleId);
  if (!role) {
    role = await guild.roles.fetch(req.params.roleId).catch(() => null);
  }
  if (!role) {
    return res.status(404).json({ error: 'Role not found.' });
  }

  // Handle @everyone separately: Discord only allows modifying permissions on @everyone
  if (role.id === guild.id) {
    const { permissions } = req.body;
    try {
      if (permissions !== undefined && Array.isArray(permissions)) {
        await role.setPermissions(permissions);
      }
      return res.json({ success: true, message: 'Server default (@everyone) permissions updated successfully.' });
    } catch (err) {
      console.error('Failed to update @everyone role:', err);
      return res.status(500).json({ error: `Failed to update @everyone: ${err.message}` });
    }
  }

  const me = await guild.members.fetchMe().catch(() => null);
  if (me && role.position >= me.roles.highest.position) {
    return res.status(403).json({
      error: 'Cannot edit this role because its position is equal to or higher than the bot highest role in Discord.',
    });
  }

  const { name, color, hoist, mentionable, permissions } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = String(name).trim().slice(0, 100);
  if (color !== undefined) updates.color = color;
  if (hoist !== undefined) updates.hoist = Boolean(hoist);
  if (mentionable !== undefined) updates.mentionable = Boolean(mentionable);
  if (permissions !== undefined && Array.isArray(permissions)) {
    updates.permissions = permissions;
  }

  try {
    await role.edit(updates);
    return res.json({ success: true, message: 'Role updated successfully.' });
  } catch (err) {
    console.error('Failed to update role:', err);
    return res.status(500).json({ error: `Failed to update role: ${err.message}` });
  }
});

router.delete('/:guildId/roles/:roleId', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  let role = guild.roles.cache.get(req.params.roleId);
  if (!role) {
    role = await guild.roles.fetch(req.params.roleId).catch(() => null);
  }
  if (!role) {
    return res.status(404).json({ error: 'Role not found.' });
  }

  if (role.id === guild.id) {
    return res.status(400).json({ error: 'Cannot delete the server default (@everyone) role.' });
  }

  if (role.managed) {
    return res.status(400).json({ error: 'Cannot delete an integration-managed role.' });
  }

  const me = await guild.members.fetchMe().catch(() => null);
  if (me && role.position >= me.roles.highest.position) {
    return res.status(403).json({
      error: 'Cannot delete this role because its position is equal to or higher than the bot highest role in Discord.',
    });
  }

  try {
    await role.delete('Deleted via ArchiBot Web Dashboard');
    return res.json({ success: true, message: 'Role deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete role:', err);
    return res.status(500).json({ error: `Failed to delete role: ${err.message}` });
  }
});

router.patch('/:guildId/auto-roles', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { memberRoleId, verifiedRoleId } = req.body;

  const cfg = (state.guilds[guild.id] ??= {});
  if (memberRoleId !== undefined) cfg.memberRoleId = memberRoleId || null;
  if (verifiedRoleId !== undefined) cfg.verifiedRoleId = verifiedRoleId || null;
  saveState();

  return res.json({ success: true, message: 'Auto-roles updated successfully.', autoRoles: cfg });
});

export default router;
