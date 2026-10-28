import { Router } from 'express';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import {
  state,
  saveState,
  toSlug,
  getFixedChannelIds,
  executeSetup,
} from '../botClient.js';
import { serializeGuildTemplate, parseTemplate } from '../../templates.js';

const router = Router();
router.use(verifySession);

router.get('/:guildId/backups', verifyGuildAccess, (req, res) => {
  const backups = Object.entries(state.backups).map(([slug, b]) => {
    let channelCount = 0;
    try {
      const groups = parseTemplate(b.spec);
      channelCount = groups.reduce((acc, g) => acc + g.channels.length, 0);
    } catch {}

    return {
      slug,
      label: b.label,
      channelCount,
      rolesCount: b.roles?.length || 0,
      updatedAt: b.updatedAt,
      specPreview: b.spec?.slice(0, 500) || '',
      spec: b.spec,
      roles: b.roles,
    };
  });

  res.json({ backups });
});

router.post('/:guildId/backups', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { name } = req.body;

  const rawName = name?.trim() || `${guild.name} Snapshot`;
  const slug = toSlug(rawName) || `backup-${Date.now()}`;

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    const exported = serializeGuildTemplate({
      channels: guild.channels.cache.values(),
      roles: guild.roles.cache.values(),
      everyoneId: guild.roles.everyone.id,
      hubs: state.hubs,
      temp: {
        ...state.temp,
        ...Object.fromEntries(Object.values(state.waiting).map((id) => [id, 'waiting'])),
      },
      fixedIds: getFixedChannelIds(guild.id),
    });

    state.backups[slug] = {
      label: rawName,
      spec: exported.spec,
      roles: exported.roles,
      updatedAt: new Date().toISOString(),
    };
    saveState();

    return res.json({
      success: true,
      message: `Layout snapshot "${rawName}" saved successfully!`,
      backup: { slug, label: rawName, rolesCount: exported.roles.length },
    });
  } catch (err) {
    return res.status(500).json({ error: `Failed to create backup: ${err.message}` });
  }
});

router.post('/:guildId/backups/:slug/restore', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const slug = req.params.slug;
  const backup = state.backups[slug] || state.backups[toSlug(slug)];

  if (!backup) {
    return res.status(404).json({ error: 'Saved layout not found.' });
  }

  const { replace } = req.body;

  try {
    const groups = parseTemplate(backup.spec);
    await executeSetup(
      guild,
      {
        userId: req.user.id,
        label: backup.label,
        groups,
        roles: backup.roles,
        replace: Boolean(replace),
      },
      null
    );

    return res.json({
      success: true,
      message: `Layout "${backup.label}" restored successfully onto ${guild.name}!`,
    });
  } catch (err) {
    return res.status(500).json({ error: `Failed to restore layout: ${err.message}` });
  }
});

router.post('/:guildId/backups/import', verifyGuildAccess, (req, res) => {
  const { label, spec, roles } = req.body;
  if (!label?.trim() || !spec?.trim()) {
    return res.status(400).json({ error: 'Invalid backup data. "label" and "spec" are required.' });
  }

  const slug = toSlug(label) || `imported-${Date.now()}`;
  state.backups[slug] = {
    label: label.trim(),
    spec: spec.trim(),
    roles: Array.isArray(roles) ? roles : [],
    updatedAt: new Date().toISOString(),
  };
  saveState();

  return res.json({ success: true, message: `Backup "${label}" imported successfully!`, slug });
});

router.delete('/:guildId/backups/:slug', verifyGuildAccess, (req, res) => {
  const slug = req.params.slug;
  if (!state.backups[slug]) {
    return res.status(404).json({ error: 'Backup not found.' });
  }

  const label = state.backups[slug].label;
  delete state.backups[slug];
  saveState();

  return res.json({ success: true, message: `Backup "${label}" deleted.` });
});

export default router;
