import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { config, updateEnvFile } from '../config.js';
import { signUserToken, verifySession } from '../middleware/auth.js';
import { client, ensureBotReady } from '../botClient.js';

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

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    const userPayload = {
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: avatarUrl,
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
    let globalName = 'Bot Administrator';
    let avatar = null;

    if (!client.isReady()) {
      await ensureBotReady().catch(() => null);
    }

    if (client.isReady() && client.application) {
      const app = await client.application.fetch().catch(() => null);
      if (app?.owner) {
        let realOwner = null;
        if (app.owner.ownerUserId) {
          // Team owner
          realOwner = await client.users.fetch(app.owner.ownerUserId).catch(() => null);
        } else if (app.owner.id) {
          realOwner = await client.users.fetch(app.owner.id).catch(() => app.owner);
        }

        if (realOwner) {
          ownerId = realOwner.id;
          ownerName = realOwner.username;
          globalName = realOwner.globalName || realOwner.username;
          if (typeof realOwner.displayAvatarURL === 'function') {
            avatar = realOwner.displayAvatarURL({ extension: 'png', size: 128 });
          } else if (realOwner.avatar) {
            avatar = `https://cdn.discordapp.com/avatars/${realOwner.id}/${realOwner.avatar}.png`;
          }
        }
      }
    }

    const devUser = {
      id: ownerId,
      username: ownerName,
      global_name: globalName,
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

router.get('/me', verifySession, async (req, res) => {
  const user = { ...req.user };

  // Strip legacy "(Local Admin)" if present in active session cookie
  if (user.global_name && user.global_name.includes(' (Local Admin)')) {
    user.global_name = user.global_name.replace(' (Local Admin)', '').trim();
  }

  // Ensure live real user info from Discord
  if (!client.isReady()) {
    await ensureBotReady().catch(() => null);
  }

  if (client.isReady() && user.id && user.id !== '1') {
    try {
      const realDiscordUser =
        client.users.cache.get(user.id) || (await client.users.fetch(user.id).catch(() => null));
      if (realDiscordUser) {
        user.username = realDiscordUser.username;
        user.global_name = realDiscordUser.globalName || realDiscordUser.username;
        if (typeof realDiscordUser.displayAvatarURL === 'function') {
          user.avatar = realDiscordUser.displayAvatarURL({ extension: 'png', size: 128 });
        } else if (realDiscordUser.avatar) {
          user.avatar = `https://cdn.discordapp.com/avatars/${realDiscordUser.id}/${realDiscordUser.avatar}.png`;
        }
      }
    } catch {}
  }

  if (user.avatar && !user.avatar.startsWith('http://') && !user.avatar.startsWith('https://')) {
    user.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }
  res.json({ user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('archibot_token');
  res.json({ success: true });
});

router.get('/guilds', verifySession, async (req, res) => {
  const userId = req.user.id;
  const clientId = client.user?.id || config.DISCORD_CLIENT_ID;

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
      } else if (gRes.status === 401) {
        userTokens.delete(userId);
      }
    } catch (err) {
      console.warn('Failed to fetch guilds from Discord API:', err.message);
    }
  }

  // Fallback or Dev mode:
  // If Discord API didn't return guilds (e.g. dev login without OAuth or token expired)
  if (!discordGuilds.length) {
    if (req.user.isDev) {
      // Dev login mode: bot cache + uninvited demo server for local testing
      for (const g of client.guilds.cache.values()) {
        discordGuilds.push({
          id: g.id,
          name: g.name,
          icon: g.iconURL({ size: 128 }) || g.icon || null,
          owner: g.ownerId === userId || true,
          permissions: '8', // Administrator
        });
      }

      // Add uninvited server so local dev can test the "Invite" action
      discordGuilds.push({
        id: 'dev-demo-guild-uninvited',
        name: 'Community & Gaming Hub',
        icon: null,
        owner: true,
        permissions: '8',
      });
    } else {
      // Regular user fallback: check mutual guilds in bot client cache
      for (const g of client.guilds.cache.values()) {
        if (g.ownerId === userId) {
          discordGuilds.push({
            id: g.id,
            name: g.name,
            icon: g.iconURL({ size: 128 }) || g.icon || null,
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
            icon: g.iconURL({ size: 128 }) || g.icon || null,
            owner: false,
            permissions: m.permissions.bitfield.toString(),
          });
        }
      }
    }
  }

  // Filter ONLY guilds where user has permission to invite the bot:
  // Must be server owner, have Administrator (0x8), or Manage Server (0x20)
  const manageableGuilds = discordGuilds
    .filter((g) => {
      if (g.owner || g.isOwner) return true;
      if (!g.permissions && g.permissions !== 0) return false;
      try {
        const perms = BigInt(g.permissions);
        return (perms & 8n) === 8n || (perms & 32n) === 32n;
      } catch {
        return false;
      }
    })
    .map((g) => {
      const botGuild = client.guilds.cache.get(g.id);
      let iconUrl = null;
      if (g.icon) {
        iconUrl = g.icon.startsWith('http')
          ? g.icon
          : `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`;
      }
      if (!iconUrl && botGuild) {
        iconUrl = botGuild.iconURL({ size: 128 }) || null;
      }

      const botInGuild = Boolean(botGuild);

      return {
        id: g.id,
        name: g.name,
        icon: iconUrl,
        botInGuild,
        isOwner: Boolean(g.owner || g.isOwner),
        permissions: String(g.permissions || '0'),
        memberCount: botGuild ? botGuild.memberCount : null,
        channelsCount: botGuild ? botGuild.channels.cache.size : null,
        rolesCount: botGuild ? botGuild.roles.cache.size : null,
        inviteUrl: clientId
          ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${g.id}`
          : null,
      };
    });

  // Sort: Servers with bot already added first, then uninvited servers
  manageableGuilds.sort((a, b) => {
    if (a.botInGuild && !b.botInGuild) return -1;
    if (!a.botInGuild && b.botInGuild) return 1;
    if (a.isOwner && !b.isOwner) return -1;
    if (!a.isOwner && b.isOwner) return 1;
    return a.name.localeCompare(b.name);
  });

  userGuildsCache.set(cacheKey, { guilds: manageableGuilds, timestamp: Date.now() });
  return res.json({ guilds: manageableGuilds });
});

export default router;
