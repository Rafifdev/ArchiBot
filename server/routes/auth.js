import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { config, updateEnvFile } from '../config.js';
import { signUserToken, verifySession } from '../middleware/auth.js';
import { client, ensureBotReady } from '../botClient.js';

const router = Router();
const userTokens = new Map();

const TOKENS_PATH = resolve(process.cwd(), 'server', 'data', 'tokens.json');
const GUILDS_PATH = resolve(process.cwd(), 'server', 'data', 'user_guilds.json');

function getStoredToken(userId) {
  if (userTokens.has(userId)) return userTokens.get(userId);
  if (existsSync(TOKENS_PATH)) {
    try {
      const data = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
      if (data[userId]?.accessToken) {
        userTokens.set(userId, data[userId].accessToken);
        return data[userId].accessToken;
      }
    } catch {}
  }
  return null;
}

function saveStoredToken(userId, accessToken) {
  userTokens.set(userId, accessToken);
  try {
    mkdirSync(dirname(TOKENS_PATH), { recursive: true });
    let data = {};
    if (existsSync(TOKENS_PATH)) {
      try {
        data = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
      } catch {}
    }
    data[userId] = { accessToken, updatedAt: Date.now() };
    writeFileSync(TOKENS_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save token to file:', err.message);
  }
}

function getSavedUserGuilds(userId) {
  if (existsSync(GUILDS_PATH)) {
    try {
      const data = JSON.parse(readFileSync(GUILDS_PATH, 'utf8'));
      return data[userId] || null;
    } catch {}
  }
  return null;
}

function saveUserGuilds(userId, guilds) {
  try {
    mkdirSync(dirname(GUILDS_PATH), { recursive: true });
    let data = {};
    if (existsSync(GUILDS_PATH)) {
      try {
        data = JSON.parse(readFileSync(GUILDS_PATH, 'utf8'));
      } catch {}
    }
    data[userId] = guilds;
    writeFileSync(GUILDS_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save user guilds to file:', err.message);
  }
}

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

    // Persist token for guild fetching across restarts
    saveStoredToken(discordUser.id, accessToken);

    // Eagerly fetch and persist user guilds from Discord API
    try {
      const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (guildsRes.ok) {
        const discordGuilds = await guildsRes.json();
        saveUserGuilds(discordUser.id, discordGuilds);
      }
    } catch (gErr) {
      console.warn('Initial guild fetch warning:', gErr.message);
    }

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
      : null;

    const userPayload = {
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: avatarUrl,
      discriminator: discordUser.discriminator,
      isOwner: false,
      accessToken,
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
            avatar = `https://cdn.discordapp.com/avatars/${realOwner.id}/${realOwner.avatar}.png?size=128`;
          }
        }
      }
    }

    const storedToken = getStoredToken(ownerId);

    const devUser = {
      id: ownerId,
      username: ownerName,
      global_name: globalName,
      avatar,
      discriminator: '0',
      isOwner: true,
      isDev: true,
      ...(storedToken ? { accessToken: storedToken } : {}),
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
          user.avatar = `https://cdn.discordapp.com/avatars/${realDiscordUser.id}/${realDiscordUser.avatar}.png?size=128`;
        }
      }
    } catch {}
  }

  if (user.avatar && !user.avatar.startsWith('http://') && !user.avatar.startsWith('https://')) {
    user.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
  res.json({ user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('archibot_token');
  res.json({ success: true });
});

router.get('/guilds', verifySession, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const userId = req.user.id;
  const clientId = client.user?.id || config.DISCORD_CLIENT_ID;

  if (!client.isReady()) {
    await ensureBotReady().catch(() => null);
  }

  const accessToken = req.user.accessToken || userTokens.get(userId) || getStoredToken(userId);
  let discordGuilds = [];

  // 1. Fetch live user guilds from Discord OAuth API if accessToken is available
  if (accessToken) {
    try {
      const gRes = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (gRes.ok) {
        discordGuilds = await gRes.json();
        saveUserGuilds(userId, discordGuilds);
      } else if (gRes.status === 401) {
        userTokens.delete(userId);
      }
    } catch (err) {
      console.warn('Failed to fetch guilds from Discord API:', err.message);
    }
  }

  // 2. If Discord API was not reachable or token absent, check persisted user guilds
  if (!discordGuilds.length) {
    const saved = getSavedUserGuilds(userId);
    if (Array.isArray(saved) && saved.length > 0) {
      discordGuilds = saved;
    }
  }

  // 3. Fallback: Check mutual guilds in bot client
  // Strictly ONLY include servers where user has genuine ownership or Administrator (0x8) / Manage Server (0x20)
  if (!discordGuilds.length && (client.isReady() || client.user)) {
    try {
      const fetchedGuilds = await client.guilds.fetch();
      for (const [gid, oauthGuild] of fetchedGuilds) {
        const g = await oauthGuild.fetch().catch(() => null);
        if (!g) continue;
        if (g.ownerId === userId) {
          discordGuilds.push({
            id: g.id,
            name: g.name,
            icon: g.iconURL({ size: 128 }) || g.icon || null,
            owner: true,
            permissions: '8', // Administrator
          });
          continue;
        }
        try {
          const m = g.members.cache.get(userId) || (await g.members.fetch(userId).catch(() => null));
          if (m && (m.permissions.has(8n) || m.permissions.has(32n))) {
            discordGuilds.push({
              id: g.id,
              name: g.name,
              icon: g.iconURL({ size: 128 }) || g.icon || null,
              owner: false,
              permissions: m.permissions.bitfield.toString(),
            });
          }
        } catch {}
      }
    } catch (fetchErr) {
      console.warn('Failed to fetch bot client guilds:', fetchErr.message);
    }
  }

  // Filter valid Discord guilds:
  // 1. If bot is already in this guild, include it (Active server)
  // 2. If bot is not in guild, user must be server owner OR have Administrator (0x8) OR have Manage Server (0x20)
  const manageableGuilds = discordGuilds
    .filter((g) => {
      if (!g || !g.id || !/^\d{17,20}$/.test(String(g.id))) return false;
      if (
        g.id === 'dev-demo-guild-uninvited' ||
        String(g.id).includes('demo') ||
        (g.name && String(g.name).toLowerCase().includes('community & gaming'))
      ) {
        return false;
      }

      // If bot is already present in this server, always include it for management
      if (client.guilds.cache.has(g.id)) return true;

      // Otherwise, only include if user has permissions to add/invite the bot
      if (g.owner === true || g.isOwner === true) return true;
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
          : `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`;
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
        isOwner: Boolean(g.owner || g.isOwner || (botGuild && botGuild.ownerId === userId)),
        permissions: String(g.permissions || '0'),
        memberCount: botGuild ? botGuild.memberCount : null,
        channelsCount: botGuild ? botGuild.channels.cache.size : null,
        rolesCount: botGuild ? botGuild.roles.cache.size : null,
        inviteUrl: clientId
          ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${g.id}`
          : null,
      };
    });

  // Sort: Servers with bot already added first, then uninvited servers, then alphabetical
  manageableGuilds.sort((a, b) => {
    if (a.botInGuild && !b.botInGuild) return -1;
    if (!a.botInGuild && b.botInGuild) return 1;
    if (a.isOwner && !b.isOwner) return -1;
    if (!a.isOwner && b.isOwner) return 1;
    return a.name.localeCompare(b.name);
  });

  return res.json({
    guilds: manageableGuilds,
    hasOAuth: Boolean(accessToken),
    botInviteUrl: clientId
      ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`
      : null,
  });
});

export default router;
