import { Router } from 'express';
import { EmbedBuilder } from 'discord.js';
import { verifySession, verifyGuildAccess } from '../middleware/auth.js';

const router = Router();
router.use(verifySession);

router.post('/:guildId/embeds/send', verifyGuildAccess, async (req, res) => {
  const guild = req.guild;
  const { channelId, content, embed } = req.body;

  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isTextBased()) {
    return res.status(400).json({ error: 'Please choose a valid text channel.' });
  }

  const payload = {};
  if (content?.trim()) {
    payload.content = content.trim();
  }

  if (embed && (embed.title || embed.description || embed.fields?.length)) {
    const builder = new EmbedBuilder();

    if (embed.title?.trim()) builder.setTitle(embed.title.trim().slice(0, 256));
    if (embed.description?.trim()) builder.setDescription(embed.description.trim().slice(0, 4096));
    if (embed.url?.trim()) builder.setURL(embed.url.trim());

    if (embed.color) {
      try {
        const hex = embed.color.startsWith('#') ? embed.color.slice(1) : embed.color;
        builder.setColor(Number.parseInt(hex, 16) || 0x5865f2);
      } catch {
        builder.setColor(0x5865f2);
      }
    } else {
      builder.setColor(0x5865f2);
    }

    if (embed.authorName?.trim()) {
      builder.setAuthor({
        name: embed.authorName.trim().slice(0, 256),
        iconURL: embed.authorIcon?.trim() || undefined,
        url: embed.authorUrl?.trim() || undefined,
      });
    }

    if (embed.thumbnailUrl?.trim()) builder.setThumbnail(embed.thumbnailUrl.trim());
    if (embed.imageUrl?.trim()) builder.setImage(embed.imageUrl.trim());

    if (embed.footerText?.trim()) {
      builder.setFooter({
        text: embed.footerText.trim().slice(0, 2048),
        iconURL: embed.footerIcon?.trim() || undefined,
      });
    }

    if (embed.timestamp) {
      builder.setTimestamp();
    }

    if (Array.isArray(embed.fields)) {
      const validFields = embed.fields
        .filter((f) => f.name?.trim() && f.value?.trim())
        .slice(0, 25)
        .map((f) => ({
          name: f.name.trim().slice(0, 256),
          value: f.value.trim().slice(0, 1024),
          inline: Boolean(f.inline),
        }));
      if (validFields.length) builder.addFields(validFields);
    }

    payload.embeds = [builder];
  }

  if (!payload.content && !payload.embeds?.length) {
    return res.status(400).json({ error: 'Please provide either text content or an embed to send.' });
  }

  try {
    const sent = await channel.send(payload);
    return res.json({ success: true, messageId: sent.id, message: 'Message sent successfully to Discord!' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to send message: ${err.message}` });
  }
});

export default router;
