import { Router } from 'express';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';
import {
  state,
  saveState,
  executeSetup,
  executeClearChannels,
  sendFreshVoicePanel,
  TEMPLATES,
  LEGO_MODULES,
  GENDER_ROLES,
} from '../botClient.js';
import { parseTemplate } from '../../templates.js';
import { buildRoleButtonRows, buildVerifyPanelMessage, buildMusicPanelPayload } from '../../bot.js';

const router = Router();
router.use(verifySession);

router.get('/:guildId/architect', verifyGuildAccess, (req, res) => {
  const guild = req.guild;

  const templatesList = Object.entries(TEMPLATES).map(([key, tpl]) => {
    const groups = parseTemplate(tpl.spec);
    const channelCount = groups.reduce((acc, g) => acc + g.channels.length, 0);
    return {
      key,
      name: tpl.name,
      description: tpl.description,
      channelCount,
      categoryCount: groups.length,
      rolesCount: tpl.roles?.length || 0,
      specPreview: tpl.spec,
    };
  });

  const openTickets = guild.channels.cache
    .filter((ch) => ch.topic && ch.topic.startsWith('ticket:'))
    .map((ch) => ({
      id: ch.id,
      name: ch.name,
      topic: ch.topic,
      ownerId: ch.topic.slice('ticket:'.length),
    }));

  res.json({
    templates: templatesList,
    legoModules: LEGO_MODULES,
    openTickets,
  });
});

router.post('/:guildId/architect/setup', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { templateKey, selectedModules, customSpec, customRoles, replace, includeMusic } = req.body;

  let groups = [];
  let roles = [];
  let label = 'Custom Layout';
  let isCustom = false;

  try {
    if (templateKey && TEMPLATES[templateKey]) {
      const tpl = TEMPLATES[templateKey];
      label = tpl.name;
      groups = parseTemplate(tpl.spec);
      roles = tpl.roles || [];
    } else {
      isCustom = true;
      let combinedSpec = '';
      const mods = Array.isArray(selectedModules) ? selectedModules : [];

      for (const modId of mods) {
        if (modId === 'music') continue;
        const mod = LEGO_MODULES.find((m) => m.id === modId);
        if (mod) combinedSpec += `[${mod.category}]\n${mod.spec}\n\n`;
      }

      if (customSpec?.trim()) {
        combinedSpec += `\n${customSpec.trim()}\n`;
      }

      if (!combinedSpec.trim()) {
        return res.status(400).json({ error: 'Please choose at least one Lego module or enter custom channel specs.' });
      }

      groups = parseTemplate(combinedSpec);

      if (customRoles) {
        roles = String(customRoles)
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
          .slice(0, 15)
          .map((name) => ({
            name: name.slice(0, 100),
            color: 0x5865f2,
            admin: /^admin$/i.test(name),
            mod: /mod/i.test(name),
          }));
      }
    }

    const job = {
      userId: req.user.id,
      label,
      groups,
      roles,
      replace: Boolean(replace),
      isCustom,
      includeMusic: Boolean(includeMusic || selectedModules?.includes('music')),
    };

    // Execute server architect layout asynchronously or wait
    await executeSetup(guild, job, null);

    return res.json({
      success: true,
      message: `Server layout "${label}" built successfully with ${groups.length} categories!`,
    });
  } catch (err) {
    return res.status(500).json({ error: `Setup execution failed: ${err.message}` });
  }
});

router.post('/:guildId/architect/clear', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { keepFreshGeneral } = req.body;

  try {
    await executeClearChannels(guild, null, Boolean(keepFreshGeneral));
    return res.json({ success: true, message: 'All old server channels cleared successfully.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to clear channels: ${err.message}` });
  }
});

router.post('/:guildId/architect/deploy-panel', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { channelId, type, roleId, title, message, rolesList, style } = req.body;

  const targetChannel = guild.channels.cache.get(channelId);
  if (!targetChannel || !targetChannel.isTextBased()) {
    return res.status(400).json({ error: 'Please select a valid text channel for the panel.' });
  }

  try {
    if (type === 'verify') {
      const cfg = state.guilds[guild.id] || {};
      const targetRoleId = roleId || cfg.verifiedRoleId;
      if (!targetRoleId) {
        return res.status(400).json({ error: 'Please specify or configure a Verified Role first.' });
      }
      const panelTitle = title?.trim() || '🛡️ Account Verification';
      await targetChannel.send(buildVerifyPanelMessage(targetRoleId, 0, panelTitle));
      return res.json({ success: true, message: 'Verification panel deployed!' });
    }

    if (type === 'voice') {
      await sendFreshVoicePanel(targetChannel);
      return res.json({ success: true, message: 'Voice Room Controls panel deployed!' });
    }

    if (type === 'ticket') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket:open').setLabel('📩 Open Support Ticket').setStyle(ButtonStyle.Primary)
      );
      await targetChannel.send({
        content: `### ${title?.trim() || '📩 Need Help? Open a Ticket'}\n${message?.trim() || 'Click the button below to start a private conversation with our staff team.'}`,
        components: [row],
      });
      return res.json({ success: true, message: 'Support ticket panel deployed!' });
    }

    if (type === 'roles') {
      const names = [...new Set((rolesList || '').split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 25);
      if (!names.length) {
        return res.status(400).json({ error: 'Please enter at least one role name.' });
      }

      await guild.roles.fetch();
      const me = await guild.members.fetchMe();
      const roleItems = [];

      for (const name of names) {
        let role = guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
        if (!role) {
          role = await guild.roles.create({ name: name.slice(0, 100), color: 0x5865f2 }).catch(() => null);
        }
        if (role && !role.managed && role.position < me.roles.highest.position) {
          roleItems.push({ id: role.id, name: role.name });
        }
      }

      if (!roleItems.length) {
        return res.status(400).json({ error: 'Could not create or assign the specified roles.' });
      }

      if (style === 'dropdown') {
        const menu = new StringSelectMenuBuilder()
          .setCustomId('self_role')
          .setPlaceholder('Click here to choose your roles...')
          .setMinValues(0)
          .setMaxValues(roleItems.length)
          .addOptions(roleItems.map((r) => ({ label: r.name, value: r.id })));

        await targetChannel.send({
          content: `### ${title?.trim() || '🎮 Pick Your Roles'}\nPick the roles you want from the menu below. Uncheck a role anytime to remove it.`,
          components: [new ActionRowBuilder().addComponents(menu)],
        });
      } else {
        await targetChannel.send({
          content: `### ${title?.trim() || '🎮 Pick Your Roles'}\nClick any button below to add a role to your profile. Click the same button again anytime to remove it.`,
          components: buildRoleButtonRows(roleItems),
        });
      }

      return res.json({ success: true, message: `Role panel with ${roleItems.length} roles deployed!` });
    }

    if (type === 'music') {
      const payload = buildMusicPanelPayload(guild.id, new Set(), null);
      await targetChannel.send(payload);
      return res.json({ success: true, message: 'Music bot panel deployed!' });
    }

    return res.status(400).json({ error: 'Invalid panel type.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to deploy panel: ${err.message}` });
  }
});

export default router;
