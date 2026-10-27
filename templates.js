import { ChannelType, PermissionFlagsBits } from 'discord.js';

export function stripCategoryHeader(name) {
  return String(name ?? '')
    .replace(/^✧[—─━]+✧\s*/u, '')
    .replace(/\s*✧[—─━]+✧$/u, '')
    .trim();
}

export function formatCategoryHeader(name) {
  const clean = stripCategoryHeader(name);
  return `✧━━━✧ ${clean.toUpperCase()} ✧━━━✧`.slice(0, 100);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatStatsDate(date = new Date()) {
  const dayNum = date.getDate();
  const mod100 = dayNum % 100;
  let suffix = 'th';
  if (mod100 < 11 || mod100 > 13) {
    if (dayNum % 10 === 1) suffix = 'st';
    else if (dayNum % 10 === 2) suffix = 'nd';
    else if (dayNum % 10 === 3) suffix = 'rd';
  }
  return `📅 ${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${dayNum}${suffix}`;
}

export const CUSTOM_DEFAULT_SPEC = `[INFORMATION]
readonly: 📢・announcements
[CHAT LOUNGE]
💬・general-chat
📸・media-gallery
[VOICE LOUNGE]
readonly: 🎤・voice-settings
[VOICE ROOMS]
autovoice: ➕ Create Voice
voice: 🛋️ Lounge
voice: 💤 AFK`;

export const GENDER_ROLES = [
  { name: 'Male', emoji: '♂️', color: 0x3498db, gender: true },
  { name: 'Female', emoji: '♀️', color: 0xff6b81, gender: true },
  { name: 'Prefer Not to Say', emoji: '🔒', color: 0x95a5a6, gender: true },
];

export const LEGO_MODULES = [
  {
    id: 'news',
    shortLabel: 'News and Info',
    label: '📢 News and Info',
    description: 'Announcements, tournament info, partner servers, team finder',
    category: 'NEWS',
    spec: `readonly: 📢・announcements\nreadonly: 🏆・tournament-info\nreadonly: 🤝・partner-servers\n🎯・team-finder`,
  },
  {
    id: 'events',
    shortLabel: 'Events',
    label: '🎪 Events and Giveaways',
    description: 'Community events, giveaways, event chat, live Stage podcast',
    category: 'EVENTS & GIVEAWAYS',
    spec: `readonly: 🎪・events\nreadonly: 🎉・giveaways\n💬・event-giveaway-chat\nstage: 🎙️ Event & Giveaway`,
  },
  {
    id: 'chat',
    shortLabel: 'Chat Lounge',
    label: '💬 Chat Lounge and Memes',
    description: 'General chat, memes, bot commands',
    category: 'CHAT LOUNGE',
    spec: `💬・general-chat\n😂・memes\n🤖・bot-commands`,
  },
  {
    id: 'galleries',
    shortLabel: 'Galleries',
    label: '📸 Member Galleries',
    description: 'Photos, pets, food and drinks, art and edits',
    category: 'GALLERIES',
    spec: `📸・member-gallery\n🐾・pets\n🍜・food-and-drinks\n🎨・art-and-edits`,
  },
  {
    id: 'games',
    shortLabel: 'Game Lounge',
    label: '🎮 Game Discussions',
    description: '10 popular games like Valorant, CS, Dota, Roblox, MLBB, Free Fire',
    category: 'GAME DISCUSSIONS',
    spec: `🎯・valorant\n🔫・counter-strike\n⚔️・dota-2\n🧱・minecraft\n🎲・roblox\n🌌・genshin-impact\n🛡️・mobile-legends\n🔥・free-fire\n🪖・pubg-mobile\n👑・honor-of-kings`,
  },
  {
    id: 'minigames',
    shortLabel: 'Minigames',
    label: '🕹️ Minigames Bot',
    description: 'Interactive bot channels for OwO, Mudae, Karuta, Dank Memer, Poketwo',
    category: 'MINIGAMES',
    spec: `🐾・owo-game\n🌸・mudae-gacha\n🃏・karuta-cards\n🐸・dank-memer\n⚡・poketwo`,
  },
  {
    id: 'study',
    shortLabel: 'Study and Tech',
    label: '📚 Study and Tech',
    description: 'Study resources, homework help, code and tech, progress share',
    category: 'STUDY HALL',
    spec: `readonly: 📂・study-resources\n💬・general-chat\n❓・homework-help\n💻・code-and-tech\n🏆・progress-share`,
  },
  {
    id: 'music',
    shortLabel: 'Music Area',
    label: '🎵 Music Area',
    description: 'Music discussion, request with Spotify and Jockie Music, Lofi Radio voice',
    category: 'MUSIC AREA',
    spec: `🎶・music-discussion\n🎵・music-request\nvoice: 🎧 Lofi Radio`,
  },
  {
    id: 'voice_casual',
    shortLabel: 'Casual Voice',
    label: '🎮 Casual Voice',
    description: 'Voice room settings and guide, auto voice generator, Casual 1 to 3',
    category: 'CASUAL',
    spec: `readonly: 🎤・voice-settings\nreadonly: 📜・voice-guide\nautovoice: ➕ Create Casual\nvoice: 🎮 Casual 1\nvoice: 🎮 Casual 2\nvoice: 🎮 Casual 3`,
  },
  {
    id: 'voice_comp',
    shortLabel: 'Comp Voice',
    label: '🏆 Competitive Voice',
    description: 'Auto voice generator and competitive ranked rooms 1 to 3',
    category: 'COMPETITIVE',
    spec: `autovoice: ➕ Create Competitive\nvoice: 🏆 Competitive 1\nvoice: 🏆 Competitive 2\nvoice: 🏆 Competitive 3`,
  },
  {
    id: 'voice_hangout',
    shortLabel: 'Hangout Voice',
    label: '🛋️ Hangout Voice',
    description: 'Voice settings, auto voice generator, Lounge 1 and 2, Movie Night, AFK',
    category: 'VOICE ROOMS',
    spec: `readonly: 🎤・voice-settings\nreadonly: 📜・voice-guide\nautovoice: ➕ Create Voice\nvoice: 🛋️ Lounge 1\nvoice: 🛋️ Lounge 2\nvoice: 🍿 Movie Night\nvoice: 💤 AFK`,
  },
  {
    id: 'voice_study',
    shortLabel: 'Focus Voice',
    label: '🔇 Study Focus Voice',
    description: 'Auto study generator, Silent Study, Screen Share Study, AFK',
    category: 'FOCUS ROOMS',
    spec: `readonly: 🎤・voice-settings\nreadonly: 📜・voice-guide\nautovoice: ➕ Create Study Room\nvoice: 🔇 Silent Study\nvoice: 💻 Screen Share Study\nvoice: 💤 AFK`,
  },
];

export const TEMPLATES = {
  general: {
    label: 'General Hangout',
    roles: [
      { name: 'Admin', color: 0xe74c3c, admin: true },
      { name: 'Moderator', color: 0x3498db, mod: true },
      { name: 'Member', color: 0x2ecc71, auto: true },
      { name: 'Gamer', emoji: '🎮', color: 0x9b59b6 },
      { name: 'Movie Buff', emoji: '🍿', color: 0xe67e22 },
      { name: 'Foodie', emoji: '🍜', color: 0xf1c40f },
      { name: 'Pet Lover', emoji: '🐾', color: 0x1abc9c },
      { name: 'Artist', emoji: '🎨', color: 0xe91e63 },
    ],
    spec: `[INFORMATION]
readonly: 📢・announcements
readonly: 📜・rules
[CHAT LOUNGE]
💬・general-chat
😂・memes
🤖・bot-commands
[GALLERIES]
📸・member-gallery
🐾・pets
🍜・food-and-drinks
🎨・art-and-edits
[MINIGAMES]
🐾・owo-game
🌸・mudae-gacha
🃏・karuta-cards
🐸・dank-memer
⚡・poketwo
[VOICE LOUNGE]
readonly: 🎤・voice-settings
readonly: 📜・voice-guide
[VOICE ROOMS]
autovoice: ➕ Create Voice
voice: 🛋️ Lounge 1
voice: 🛋️ Lounge 2
voice: 🍿 Movie Night
voice: 💤 AFK`,
  },
  community: {
    label: 'Community Hub',
    roles: [
      { name: 'Admin', color: 0xe74c3c, admin: true },
      { name: 'Moderator', color: 0xe67e22, mod: true },
      { name: 'Member', color: 0x2ecc71, auto: true },
      { name: 'Content Creator', emoji: '🎬', color: 0x9b59b6 },
      { name: 'Streamer', emoji: '🔴', color: 0xe74c3c },
      { name: 'Artist', emoji: '🎨', color: 0xe91e63 },
      { name: 'Events Ping', emoji: '🔔', color: 0x1abc9c },
      { name: 'VIP', emoji: '⭐', color: 0xf1c40f },
    ],
    spec: `[INFO CENTER]
readonly: 📢・announcements
readonly: 🔴・stream-updates
readonly: 🤝・partner-servers
[COMMUNITY]
👋🏻・introductions
💬・general-chat
📸・community-gallery
🎨・creative-showcase
💡・suggestions
[MINIGAMES]
🐾・owo-game
🌸・mudae-gacha
🃏・karuta-cards
🐸・dank-memer
⚡・poketwo
[EVENTS]
readonly: 🎪・events
💬・event-chat
stage: 🎙️ Community Stage
[VOICE LOUNGE]
readonly: 🎤・voice-settings
readonly: 📜・voice-guide
[VOICE ROOMS]
autovoice: ➕ Create Voice
voice: ☕ Hangout Room
voice: 💤 AFK`,
  },
  games: {
    label: 'Gaming',
    roles: [
      { name: 'Admin', color: 0xe74c3c, admin: true },
      { name: 'Moderator', color: 0xe67e22, mod: true },
      { name: 'Member', color: 0x2ecc71, auto: true },
      { name: 'Valorant', emoji: '🎯', color: 0xff4655 },
      { name: 'Counter-Strike', emoji: '🔫', color: 0xf39c12 },
      { name: 'Dota 2', emoji: '⚔️', color: 0xc0392b },
      { name: 'Minecraft', emoji: '🧱', color: 0x2ecc71 },
      { name: 'Roblox', emoji: '🎲', color: 0xe74c3c },
      { name: 'Genshin Impact', emoji: '🌌', color: 0x9b59b6 },
      { name: 'Mobile Legends', emoji: '🛡️', color: 0x3498db },
      { name: 'Free Fire', emoji: '🔥', color: 0xe67e22 },
      { name: 'PUBG Mobile', emoji: '🪖', color: 0xf1c40f },
      { name: 'Honor of Kings', emoji: '👑', color: 0xd4af37 },
    ],
    spec: `[NEWS]
readonly: 📢・announcements
readonly: 🏆・tournament-info
readonly: 🤝・partner-servers
🎯・team-finder
[EVENTS & GIVEAWAYS]
readonly: 🎪・events
readonly: 🎉・giveaways
💬・event-giveaway-chat
stage: 🎙️ Event & Giveaway
[GAME DISCUSSIONS]
🎯・valorant
🔫・counter-strike
⚔️・dota-2
🧱・minecraft
🎲・roblox
🌌・genshin-impact
🛡️・mobile-legends
🔥・free-fire
🪖・pubg-mobile
👑・honor-of-kings
[MINIGAMES]
🐾・owo-game
🌸・mudae-gacha
🃏・karuta-cards
🐸・dank-memer
⚡・poketwo
[VOICE LOUNGE]
readonly: 🎤・voice-settings
readonly: 📜・voice-guide
[CASUAL]
autovoice: ➕ Create Casual
voice: 🎮 Casual 1
voice: 🎮 Casual 2
voice: 🎮 Casual 3
[COMPETITIVE]
autovoice: ➕ Create Competitive
voice: 🏆 Competitive 1
voice: 🏆 Competitive 2
voice: 🏆 Competitive 3
[GAMING VOICE]
autovoice: ➕ Create Party
voice: 💤 AFK`,
  },
  study: {
    label: 'Study & Projects',
    roles: [
      { name: 'Admin', color: 0xe74c3c, admin: true },
      { name: 'Mentor', color: 0x1abc9c, mod: true },
      { name: 'Member', color: 0x2ecc71, auto: true },
      { name: 'Coding and Tech', emoji: '💻', color: 0x3498db },
      { name: 'Design and UI', emoji: '🎨', color: 0xe91e63 },
      { name: 'Science and Math', emoji: '🔬', color: 0x9b59b6 },
      { name: 'Business', emoji: '📈', color: 0x2ecc71 },
      { name: 'Language Learning', emoji: '🌐', color: 0xf1c40f },
    ],
    spec: `[NOTICE BOARD]
readonly: 📢・announcements
readonly: 📂・study-resources
[STUDY HALL]
💬・general-chat
❓・homework-help
💻・code-and-tech
🏆・progress-share
[VOICE LOUNGE]
readonly: 🎤・voice-settings
readonly: 📜・voice-guide
[FOCUS ROOMS]
autovoice: ➕ Create Study Room
voice: 🔇 Silent Study
voice: 💻 Screen Share Study
voice: 💤 AFK`,
  },
};

export function parseTemplate(input, maxItems = 100) {
  const groups = [];
  let current = null;
  let total = 0;

  for (const raw of String(input ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const catMatch = line.match(/^\[(.+)]$/);
    if (catMatch) {
      const catName = stripCategoryHeader(catMatch[1]).slice(0, 80);
      if (!catName) continue;
      current = { category: catName, channels: [] };
      groups.push(current);
      total++;
      continue;
    }

    let ch;
    if (/^(\+|autovoice:|auto:|jtc:)/i.test(line)) {
      const name = line.replace(/^(\+|autovoice:|auto:|jtc:)\s*/i, '').trim().slice(0, 100);
      if (name) ch = { name, type: 'jtc', readOnly: false };
    } else if (/^stage:/i.test(line)) {
      const name = line.replace(/^stage:\s*/i, '').trim().slice(0, 100);
      if (name) ch = { name, type: 'stage', readOnly: false };
    } else if (/^adminvoice:/i.test(line)) {
      const name = line.replace(/^adminvoice:\s*/i, '').trim().slice(0, 100);
      if (name) ch = { name, type: 'adminvoice', readOnly: false };
    } else if (/^v(oice)?:/i.test(line)) {
      const name = line.replace(/^v(oice)?:\s*/i, '').trim().slice(0, 100);
      if (name) ch = { name, type: 'voice', readOnly: false };
    } else if (/^(!|readonly:)/i.test(line)) {
      const name = line.replace(/^(!|readonly:)\s*#?\s*/i, '').trim().slice(0, 100);
      if (name) ch = { name, type: 'text', readOnly: true };
    } else {
      const name = line.replace(/^(text:\s*)?#*\s*/i, '').trim().slice(0, 100);
      if (name) ch = { name, type: 'text', readOnly: false };
    }

    if (!ch) continue;
    if (!current) {
      current = { category: null, channels: [] };
      groups.push(current);
    }
    current.channels.push(ch);
    total++;
  }

  if (total === 0) throw new Error('Your template cannot be empty.');
  if (total > maxItems) throw new Error(`Please keep your template within ${maxItems} categories and channels.`);
  return groups;
}

export function serializeGuildTemplate({ channels, roles, everyoneId, hubs = {}, temp = {}, fixedIds = new Set() }) {
  const validChannels = [...channels].filter((c) => c && !temp[c.id] && !fixedIds.has(c.id));
  const isVoice = (c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice;
  const byOrder = (a, b) => Number(isVoice(a)) - Number(isVoice(b)) || (a.rawPosition ?? 0) - (b.rawPosition ?? 0);

  function formatChannel(ch) {
    if (ch.type === ChannelType.GuildStageVoice) return `stage: ${ch.name}`;
    if (isVoice(ch)) {
      if (hubs[ch.id]) return `autovoice: ${ch.name}`;
      const ow = ch.permissionOverwrites?.cache?.get(everyoneId);
      if (ow?.deny?.has(PermissionFlagsBits.Connect)) return `adminvoice: ${ch.name}`;
      return `voice: ${ch.name}`;
    }
    if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement) {
      const ow = ch.permissionOverwrites?.cache?.get(everyoneId);
      const readOnly = Boolean(ow?.deny?.has(PermissionFlagsBits.SendMessages));
      return readOnly ? `readonly: ${ch.name}` : ch.name;
    }
    return null;
  }

  const lines = [];
  const uncategorized = validChannels
    .filter((c) => !c.parentId && c.type !== ChannelType.GuildCategory)
    .sort(byOrder);
  for (const ch of uncategorized) {
    const line = formatChannel(ch);
    if (line) lines.push(line);
  }

  const categories = validChannels
    .filter((c) => c.type === ChannelType.GuildCategory)
    .sort((a, b) => (a.rawPosition ?? 0) - (b.rawPosition ?? 0));

  for (const cat of categories) {
    lines.push(`[${stripCategoryHeader(cat.name)}]`);
    const children = validChannels.filter((c) => c.parentId === cat.id).sort(byOrder);
    for (const ch of children) {
      const line = formatChannel(ch);
      if (line) lines.push(line);
    }
  }

  const exportedRoles = [...roles]
    .filter((r) => r && !r.managed && r.id !== everyoneId)
    .sort((a, b) => (b.rawPosition ?? 0) - (a.rawPosition ?? 0))
    .slice(0, 30)
    .map((r) => ({
      name: r.name,
      color: r.color || 0x5865f2,
      admin: Boolean(r.permissions?.has(PermissionFlagsBits.Administrator)),
      mod: Boolean(
        r.permissions?.has(PermissionFlagsBits.ManageMessages) &&
          !r.permissions?.has(PermissionFlagsBits.Administrator)
      ),
    }));

  return { spec: lines.slice(0, 100).join('\n'), roles: exportedRoles };
}

export function normalizeCategoryKey(name) {
  return stripCategoryHeader(name).toLowerCase().replace(/\s+/g, ' ').trim();
}

export function normalizeChannelKey(name, isText = true) {
  const clean = String(name ?? '')
    .toLowerCase()
    .replace(/[\uff5c|]/g, '・')
    .trim();
  return isText ? clean.replace(/\s+/g, '-') : clean.replace(/\s+/g, ' ');
}

export function coreChannelKey(name, isText = true) {
  const stripped = String(name ?? '')
    .replace(/[\uff5c|]/g, '・')
    .replace(/^[^\p{L}\p{N}]+/gu, '')
    .trim();
  return normalizeChannelKey(stripped, isText);
}

export function findMatchingCategory(
  channels,
  targetName,
  { usedIds = new Set(), excludeIds = new Set(), preferredId = null } = {}
) {
  const list = [...channels];
  if (preferredId && !usedIds.has(preferredId) && !excludeIds.has(preferredId)) {
    const byId = list.find((c) => c && c.id === preferredId && c.type === ChannelType.GuildCategory);
    if (byId) return byId;
  }
  const key = normalizeCategoryKey(targetName);
  return (
    list.find(
      (c) =>
        c &&
        c.type === ChannelType.GuildCategory &&
        !usedIds.has(c.id) &&
        !excludeIds.has(c.id) &&
        normalizeCategoryKey(c.name) === key
    ) ?? null
  );
}

export function findMatchingChannel(
  channels,
  { name, kind, parentId = null, preferredId = null },
  { usedIds = new Set(), excludeIds = new Set() } = {}
) {
  const isText = kind === 'text';
  const matchesType = (c) => {
    if (!c) return false;
    if (kind === 'text') return c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement;
    if (kind === 'stage') return c.type === ChannelType.GuildStageVoice;
    return c.type === ChannelType.GuildVoice;
  };

  const candidates = [...channels].filter((c) => matchesType(c) && !usedIds.has(c.id) && !excludeIds.has(c.id));
  if (preferredId) {
    const byId = candidates.find((c) => c.id === preferredId);
    if (byId) return byId;
  }

  const exactKey = normalizeChannelKey(name, isText);
  const exactMatches = candidates.filter((c) => normalizeChannelKey(c.name, isText) === exactKey);
  if (exactMatches.length) {
    return exactMatches.find((c) => c.parentId === parentId) ?? exactMatches[0];
  }

  const coreKey = coreChannelKey(name, isText);
  if (coreKey.length >= 3) {
    const coreMatches = candidates.filter((c) => coreChannelKey(c.name, isText) === coreKey);
    if (coreMatches.length) {
      return coreMatches.find((c) => c.parentId === parentId) ?? coreMatches[0];
    }
  }

  return null;
}
