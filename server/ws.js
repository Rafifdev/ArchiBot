import { WebSocketServer, WebSocket } from 'ws';
import { client } from './botClient.js';

let wss = null;
const guildSubscribers = new Map(); // guildId -> Set<WebSocket>

function formatChannel(ch) {
  if (!ch) return null;
  return {
    id: ch.id,
    name: ch.name,
    type: ch.type,
    parentId: ch.parentId,
    position: ch.position,
    rawPosition: ch.rawPosition,
    topic: ch.topic || null,
    rateLimitPerUser: ch.rateLimitPerUser || 0,
    nsfw: Boolean(ch.nsfw),
    bitrate: ch.bitrate || null,
    userLimit: ch.userLimit || 0,
  };
}

export function broadcastToGuild(guildId, payload) {
  if (!wss || !guildId) return;
  const subscribers = guildSubscribers.get(String(guildId));
  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);
  for (const ws of subscribers) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        console.warn('Failed to send WS message to client:', err.message);
      }
    }
  }
}

export function broadcastAll(payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch {}
    }
  }
}

let botEventsAttached = false;

function attachDiscordEvents() {
  if (botEventsAttached) return;
  botEventsAttached = true;

  // Real-time Channel Events
  client.on('channelCreate', (channel) => {
    if (!channel?.guildId) return;
    broadcastToGuild(channel.guildId, {
      event: 'CHANNEL_CREATE',
      guildId: channel.guildId,
      channel: formatChannel(channel),
      timestamp: Date.now(),
    });
  });

  client.on('channelUpdate', (_oldChannel, newChannel) => {
    if (!newChannel?.guildId) return;
    broadcastToGuild(newChannel.guildId, {
      event: 'CHANNEL_UPDATE',
      guildId: newChannel.guildId,
      channel: formatChannel(newChannel),
      timestamp: Date.now(),
    });
  });

  client.on('channelDelete', (channel) => {
    if (!channel?.guildId) return;
    broadcastToGuild(channel.guildId, {
      event: 'CHANNEL_DELETE',
      guildId: channel.guildId,
      channelId: channel.id,
      timestamp: Date.now(),
    });
  });

  // Real-time Role Events
  client.on('roleCreate', (role) => {
    if (!role?.guild?.id) return;
    broadcastToGuild(role.guild.id, {
      event: 'ROLE_CREATE',
      guildId: role.guild.id,
      roleId: role.id,
      timestamp: Date.now(),
    });
  });

  client.on('roleUpdate', (_oldRole, newRole) => {
    if (!newRole?.guild?.id) return;
    broadcastToGuild(newRole.guild.id, {
      event: 'ROLE_UPDATE',
      guildId: newRole.guild.id,
      roleId: newRole.id,
      timestamp: Date.now(),
    });
  });

  client.on('roleDelete', (role) => {
    if (!role?.guild?.id) return;
    broadcastToGuild(role.guild.id, {
      event: 'ROLE_DELETE',
      guildId: role.guild.id,
      roleId: role.id,
      timestamp: Date.now(),
    });
  });

  // Real-time Member Count Events
  client.on('guildMemberAdd', (member) => {
    if (!member?.guild?.id) return;
    broadcastToGuild(member.guild.id, {
      event: 'MEMBER_JOIN',
      guildId: member.guild.id,
      memberCount: member.guild.memberCount,
      timestamp: Date.now(),
    });
  });

  client.on('guildMemberRemove', (member) => {
    if (!member?.guild?.id) return;
    broadcastToGuild(member.guild.id, {
      event: 'MEMBER_LEAVE',
      guildId: member.guild.id,
      memberCount: member.guild.memberCount,
      timestamp: Date.now(),
    });
  });

  // Real-time Guild Membership Events (Bot added/removed from a server)
  client.on('guildCreate', (guild) => {
    broadcastAll({
      event: 'GUILD_CREATE',
      guildId: guild.id,
      guildName: guild.name,
      timestamp: Date.now(),
    });
  });

  client.on('guildDelete', (guild) => {
    broadcastAll({
      event: 'GUILD_DELETE',
      guildId: guild.id,
      guildName: guild.name,
      timestamp: Date.now(),
    });
  });
}

export function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.subscribedGuilds = new Set();

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'subscribe' && data.guildId) {
          const gid = String(data.guildId);
          ws.subscribedGuilds.add(gid);
          if (!guildSubscribers.has(gid)) {
            guildSubscribers.set(gid, new Set());
          }
          guildSubscribers.get(gid).add(ws);
          ws.send(JSON.stringify({ type: 'subscribed', guildId: gid }));
        } else if (data.type === 'unsubscribe' && data.guildId) {
          const gid = String(data.guildId);
          ws.subscribedGuilds.delete(gid);
          if (guildSubscribers.has(gid)) {
            guildSubscribers.get(gid).delete(ws);
            if (guildSubscribers.get(gid).size === 0) {
              guildSubscribers.delete(gid);
            }
          }
          ws.send(JSON.stringify({ type: 'unsubscribed', guildId: gid }));
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.warn('Invalid WS message payload:', err.message);
      }
    });

    ws.on('close', () => {
      for (const gid of ws.subscribedGuilds) {
        if (guildSubscribers.has(gid)) {
          guildSubscribers.get(gid).delete(ws);
          if (guildSubscribers.get(gid).size === 0) {
            guildSubscribers.delete(gid);
          }
        }
      }
    });
  });

  // Keep-alive heartbeat every 30s
  const interval = setInterval(() => {
    if (!wss) return;
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30_000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  attachDiscordEvents();
  console.log('📡 Realtime WebSocket Gateway server initialized on /ws');
  return wss;
}
