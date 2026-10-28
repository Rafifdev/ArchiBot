import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { config, updateEnvFile } from '../config.js';
import { signUserToken, verifySession } from '../middleware/auth.js';
import { client } from '../botClient.js';

const router = Router();
const userGuildsCache = new Map();
const userTokens = new Map();
const GUILD_CACHE_TTL = 60_000; // 60 seconds

router.get('/status', (req, res) => {
  const clientId = client.user?.id || config.DISCORD_CLIENT_ID || null;
  const isConfigured = Boolean(config.DISCORD_CLIENT_SECRET && (clientId || client.user));

  res.json({
    configured: isConfigured,
    clientId,
    redirectUri: config.DISCORD_REDIRECT_URI,
    botReady: client.isReady(),
    botName: client.user?.username || 'ArchiBot',
    botTag: client.user?.tag || null,
    botAvatar: client.user?.displayAvatarURL() || null,
    inviteUrl: clientId
      ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`
      : null,
  });
});

router.post('/setup-oauth', (req, res) => {
  const { clientSecret, clientId, redirectUri } = req.body;
  if (!clientSecret?.trim()) {
    return res.status(400).json({ error: 'DISCORD_CLIENT_SECRET is required.' });
  }

  const updates = {
    DISCORD_CLIENT_SECRET: clientSecret.trim(),
  };

  if (clientId?.trim()) updates.DISCORD_CLIENT_ID = clientId.trim();
  if (redirectUri?.trim()) updates.DISCORD_REDIRECT_URI = redirectUri.trim();

  updateEnvFile(updates);
  return res.json({ success: true, message: 'OAuth configuration updated successfully.' });
});

router.get('/login', (req, res) => {
  const clientId = client.user?.id || config.DISCORD_CLIENT_ID;
  if (!clientId || !config.DISCORD_CLIENT_SECRET) {
    return res.redirect(`${config.FRONTEND_URL}/login?error=oauth_not_configured`);
  }

  const state = randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: config.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'consent',
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${config.FRONTEND_URL}/login?error=missing_code`);
  }

  const clientId = client.user?.id || config.DISCORD_CLIENT_ID;
  const clientSecret = config.DISCORD_CLIENT_SECRET;

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: config.DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('OAuth token exchange failed:', errBody);
      return res.redirect(`${config.FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      return res.redirect(`${config.FRONTEND_URL}/login?error=fetch_user_failed`);
    }

    const discordUser = await userRes.json();

    // Store token for guild fetching
    userTokens.set(discordUser.id, accessToken);

    const userPayload = {
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      discriminator: discordUser.discriminator,
      isOwner: false,
    };

    const jwtToken = signUserToken(userPayload);

    res.cookie('archibot_token', jwtToken, {
      httpOnly: true,
      secure: false, // allow localhost
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${config.FRONTEND_URL}/servers`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`${config.FRONTEND_URL}/login?error=server_error`);
  }
});

router.post('/dev-login', async (req, res) => {
  try {
    let ownerId = '1';
    let ownerName = 'Bot Administrator';
    let avatar = null;

    if (client.isReady() && client.application) {
      const app = await client.application.fetch().catch(() => null);
      if (app?.owner) {
        ownerId = app.owner.id;
        ownerName = app.owner.username || app.owner.name || 'Owner';
        avatar = app.owner.avatar || null;
      }
    }

    const devUser = {
      id: ownerId,
      username: ownerName,
      global_name: `${ownerName} (Local Admin)`,
      avatar,
      discriminator: '0',
      isOwner: true,
      isDev: true,
    };

    const token = signUserToken(devUser);

    res.cookie('archibot_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, user: devUser, token });
  } catch (err) {
    return res.status(500).json({ error: `Dev login failed: ${err.message}` });
  }
});

router.get('/me', verifySession, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('archibot_token');
  res.json({ success: true });
});

router.get('/guilds', verifySession, async (req, res) => {
  const userId = req.user.id;
  const clientId = client.user?.id || config.DISCORD_CLIENT_ID;

  // Local/Dev owner mode: list all servers the bot is in
  if (req.user.isDev || req.user.isOwner) {
    const guilds = [...client.guilds.cache.values()].map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 128 }),
      botInGuild: true,
      isOwner: g.ownerId === userId,
      permissions: '8', // Administrator
      memberCount: g.memberCount,
      channelsCount: g.channels.cache.size,
      rolesCount: g.roles.cache.size,
    }));
    return res.json({ guilds });
  }

  // Check cache first
  const cacheKey = `user_guilds_${userId}`;
  const forceRefresh = req.query.refresh === 'true';
  const cached = userGuildsCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < GUILD_CACHE_TTL) {
    return res.json({ guilds: cached.guilds });
  }

  const accessToken = userTokens.get(userId);
  let discordGuilds = [];

  if (accessToken) {
    try {
      const gRes = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (gRes.ok) {
        discordGuilds = await gRes.json();
      }
    } catch (err) {
      console.warn('Failed to fetch guilds from Discord API:', err.message);
    }
  }

  // Fallback: check mutual guilds in bot client cache
  if (!discordGuilds.length) {
    for (const g of client.guilds.cache.values()) {
      if (g.ownerId === userId) {
        discordGuilds.push({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: true,
          permissions: '8',
        });
        continue;
      }
      const m = g.members.cache.get(userId);
      if (m && (m.permissions.has(8n) || m.permissions.has(32n))) {
        discordGuilds.push({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: false,
          permissions: m.permissions.bitfield.toString(),
        });
      }
    }
  }

  // Filter guilds where user has Administrator (0x8) or Manage Server (0x20) or is Owner
  const manageableGuilds = discordGuilds
    .filter((g) => {
      if (g.owner) return true;
      const permBig = BigInt(g.permissions || '0');
      return (permBig & 8n) === 8n || (permBig & 32n) === 32n;
    })
    .map((g) => {
      const botGuild = client.guilds.cache.get(g.id);
      const iconUrl = g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
        : null;

      return {
        id: g.id,
        name: g.name,
        icon: iconUrl,
        botInGuild: Boolean(botGuild),
        isOwner: Boolean(g.owner),
        permissions: g.permissions,
        memberCount: botGuild ? botGuild.memberCount : null,
        channelsCount: botGuild ? botGuild.channels.cache.size : null,
        rolesCount: botGuild ? botGuild.roles.cache.size : null,
        inviteUrl: clientId
          ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${g.id}`
          : null,
      };
    });

  userGuildsCache.set(cacheKey, { guilds: manageableGuilds, timestamp: Date.now() });
  return res.json({ guilds: manageableGuilds });
});

export default router;
