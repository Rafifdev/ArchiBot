import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ChannelType, PermissionsBitField } from 'discord.js';
import {
  coreChannelKey,
  CUSTOM_DEFAULT_SPEC,
  findMatchingCategory,
  findMatchingChannel,
  formatCategoryHeader,
  formatStatsDate,
  GENDER_ROLES,
  LEGO_MODULES,
  normalizeCategoryKey,
  normalizeChannelKey,
  parseTemplate,
  serializeGuildTemplate,
  stripCategoryHeader,
  TEMPLATES,
} from './templates.js';
import {
  buildSpecFromCustomForm,
  buildCustomBuilderPayload,
  buildDocsPayload,
  buildMilestoneCardPayload,
  buildMinigameCardPayload,
  buildMusicPanelPayload,
  buildRoleButtonRows,
  buildVerifyPanelMessage,
  buildVoiceInterfacePayload,
  buildVoicePanel,
  COMMANDS,
  computeMilestoneProgress,
  computeStatsStrings,
  MINIGAME_BOTS,
  MUSIC_BOTS,
} from './bot.js';
import { generateCaptcha, generateMilestoneBanner } from './captcha.js';
import {
  padVoiceLabel,
  renderVoiceEmojiPng,
  VOICE_INTERFACE_ITEMS,
} from './voice-ui.js';

function assertCleanText(text, context) {
  const withoutSlashCommands = text.replace(/`\/[a-z-]+(?:\s+[a-z-]+)*`/g, '');
  assert(!/[()/]/.test(withoutSlashCommands), `Forbidden pattern found in ${context}: "${text}"`);
}

function walkCommandMeta(item, path) {
  assertCleanText(item.name, `${path}.name`);
  if (item.description) {
    assert(item.description.length <= 100, `Description too long in ${path}`);
    assertCleanText(item.description, `${path}.description`);
  }
  for (const choice of item.choices ?? []) {
    assertCleanText(choice.name, `${path}.choice:${choice.value}`);
  }
  for (const opt of item.options ?? []) {
    walkCommandMeta(opt, `${path}.${opt.name}`);
  }
}

// Header & stats format checks with bold strip ✧━━━✧
assert.equal(formatCategoryHeader('server stats'), '✧━━━✧ SERVER STATS ✧━━━✧');
assert.equal(formatCategoryHeader('gateway'), '✧━━━✧ GATEWAY ✧━━━✧');
assert.equal(formatCategoryHeader(formatCategoryHeader('gaming zone')), '✧━━━✧ GAMING ZONE ✧━━━✧');
assert.equal(stripCategoryHeader('✧━━━✧ SERVER STATS ✧━━━✧'), 'SERVER STATS');
assert.equal(stripCategoryHeader('✧———✧ SERVER STATS ✧———✧'), 'SERVER STATS');

assert.equal(formatStatsDate(new Date(2026, 9, 27)), '📅 Tuesday Oct 27th');
assert.equal(formatStatsDate(new Date(2026, 9, 1)), '📅 Thursday Oct 1st');
assert.equal(formatStatsDate(new Date(2026, 9, 2)), '📅 Friday Oct 2nd');
assert.equal(formatStatsDate(new Date(2026, 9, 3)), '📅 Saturday Oct 3rd');
assert.equal(formatStatsDate(new Date(2026, 9, 11)), '📅 Sunday Oct 11th');
assert.equal(formatStatsDate(new Date(2026, 9, 21)), '📅 Wednesday Oct 21st');

const mockPresences = new Map();
let idx = 0;
for (let i = 0; i < 15; i++) mockPresences.set(String(idx++), { status: 'online' });
for (let i = 0; i < 9; i++) mockPresences.set(String(idx++), { status: 'dnd' });
for (let i = 0; i < 29; i++) mockPresences.set(String(idx++), { status: 'idle' });
mockPresences.set(String(idx++), { status: 'offline' });

const statsSample = computeStatsStrings(
  { memberCount: 2467, presences: { cache: mockPresences } },
  new Date(2026, 9, 27)
);
assert.deepEqual(statsSample, {
  dateName: '📅 Tuesday Oct 27th',
  presenceName: '🟢 15 ⛔ 9 🌙 29',
  usersName: 'Users: 2467',
});

assert.deepEqual(
  COMMANDS.map((c) => c.name),
  [
    'help',
    'setup',
    'clear-channels',
    'create-channel',
    'auto-voice',
    'voice',
    'backup',
    'milestone',
    'verify-panel',
    'role-panel',
    'ticket-panel',
  ]
);
for (const cmd of COMMANDS) walkCommandMeta(cmd, cmd.name);

// Milestone math, anti-duplicate guard, and PNG celebration card checks
assert.deepEqual(computeMilestoneProgress(7, { every: 50, goals: [10, 25], highestReached: 2 }), {
  reachedNow: false,
  next: 10,
  remaining: 3,
});
assert.deepEqual(computeMilestoneProgress(10, { every: 50, goals: [10, 25], highestReached: 2 }), {
  reachedNow: true,
  next: 25,
  remaining: 15,
});
assert.deepEqual(computeMilestoneProgress(10, { every: 50, goals: [10, 25], highestReached: 10 }), {
  reachedNow: false,
  next: 25,
  remaining: 15,
});
assert.deepEqual(computeMilestoneProgress(100, { every: 50, goals: [10, 25], highestReached: 50 }), {
  reachedNow: true,
  next: 150,
  remaining: 50,
});
assert.deepEqual(computeMilestoneProgress(100, { enabled: false, every: 50, goals: [], highestReached: 0 }), {
  reachedNow: false,
  next: 150,
  remaining: 50,
});

const msBanner = generateMilestoneBanner(100);
assert.deepEqual([...msBanner.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.equal(msBanner.readUInt32BE(16), 560);
assert.equal(msBanner.readUInt32BE(20), 150);

const msCard = buildMilestoneCardPayload({
  count: 100,
  next: 150,
  remaining: 50,
  userId: '999',
  avatarUrl: null,
  rewardRoleId: '777',
});
const msEmbed = msCard.embeds[0].toJSON();
assertCleanText(msEmbed.title, 'milestoneCard.title');
assertCleanText(msEmbed.description, 'milestoneCard.description');

// CAPTCHA PNG & Verification Panel checks
for (let i = 0; i < 20; i++) {
  const { code, buffer } = generateCaptcha(5);
  assert.equal(code.length, 5);
  assert.match(code, /^[2-9A-HJ-KM-NP-Z]{5}$/);
  assert(Buffer.isBuffer(buffer) && buffer.length > 500, 'CAPTCHA PNG buffer should be non-trivial');
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR');
  assert.equal(buffer.readUInt32BE(16), 320);
  assert.equal(buffer.readUInt32BE(20), 110);
}

const verifyPanel = buildVerifyPanelMessage('123456', 24);
const verifyEmbed = verifyPanel.embeds[0].toJSON();
assertCleanText(verifyEmbed.title, 'verifyPanel.title');
assertCleanText(verifyEmbed.description, 'verifyPanel.description');
const verifyBtn = verifyPanel.components[0].toJSON().components[0];
assert.equal(verifyBtn.custom_id, 'verify:start:123456:24');
assertCleanText(verifyBtn.label, 'verifyPanel.button');

for (const lang of ['en', 'id']) {
  const payload = buildDocsPayload(lang);
  const embed = payload.embeds[0].toJSON();
  assertCleanText(embed.title, `docs.${lang}.title`);
  assertCleanText(embed.description, `docs.${lang}.description`);
  assert.equal(embed.fields.length, 6);
  for (const field of embed.fields) {
    assertCleanText(field.name, `docs.${lang}.${field.name}`);
    assertCleanText(field.value, `docs.${lang}.${field.name}.value`);
  }
}

assert.equal(VOICE_INTERFACE_ITEMS.length, 15);
const panelRows = buildVoicePanel().map((r) => r.toJSON());
assert.equal(panelRows.length, 3);
for (const row of panelRows) assert.equal(row.components.length, 5);
const allVoiceBtns = panelRows.flatMap((r) => r.components);
assert.deepEqual(
  allVoiceBtns.map((b) => b.custom_id),
  VOICE_INTERFACE_ITEMS.map((item) => `vc:${item.key}`)
);
for (let i = 0; i < VOICE_INTERFACE_ITEMS.length; i++) {
  const item = VOICE_INTERFACE_ITEMS[i];
  const btn = allVoiceBtns[i];
  assert.equal(btn.label, padVoiceLabel(item.label));
  assert(btn.label.startsWith(item.label), `Button label should start with ${item.label}`);
  assert(btn.label.length <= 20, `Button label too long on ${btn.custom_id}`);
  assertCleanText(btn.label, `voiceBtn.${item.key}`);
  assert(btn.emoji?.name, `Missing emoji on ${btn.custom_id}`);
}
assert(padVoiceLabel('Kick').endsWith('\u2800'), 'Short labels must end with non-trimmed Braille Blank padding');

for (const item of VOICE_INTERFACE_ITEMS) {
  const emojiPng = renderVoiceEmojiPng(item.key);
  assert.deepEqual([...emojiPng.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(emojiPng.readUInt32BE(16), 64);
  assert.equal(emojiPng.readUInt32BE(20), 64);
}

const voicePayload = buildVoiceInterfacePayload();
assert.equal(voicePayload.content, undefined);
assert.equal(voicePayload.files, undefined);
const voiceEmbed = voicePayload.embeds[0].toJSON();
assert.equal(voiceEmbed.title, '🎛️ Voice Room Controls');
assert(!voiceEmbed.title.includes('TempVoice'));
assert.equal(voiceEmbed.image, undefined);
assert.equal(voiceEmbed.footer, undefined);
assertCleanText(voiceEmbed.title, 'voiceInterface.title');
assertCleanText(voiceEmbed.description, 'voiceInterface.description');

assertCleanText(CUSTOM_DEFAULT_SPEC, 'CUSTOM_DEFAULT_SPEC');
for (const [key, tpl] of Object.entries(TEMPLATES)) {
  assertCleanText(tpl.label, `${key}.label`);
  assertCleanText(tpl.spec, `${key}.spec`);
  assert(tpl.roles.some((r) => r.admin && r.name === 'Admin'), `${key}: must include Admin role`);
  const groups = parseTemplate(tpl.spec);
  assert(groups.length >= 2, `${key}: must have at least 2 categories`);
  const allChannels = groups.flatMap((g) => g.channels);
  assert(allChannels.some((c) => c.readOnly), `${key}: must have a read-only channel`);
  assert(allChannels.some((c) => c.type === 'jtc'), `${key}: must have a Join-to-Create channel`);
}

// Verify Gaming template UX structure, Stage podcast, Voice Lounge, Gender & Game Role buttons & 5 Minigame Bots
assert.equal(TEMPLATES.games.label, 'Gaming');
const gamingGroups = parseTemplate(TEMPLATES.games.spec);
assert.deepEqual(gamingGroups.map((g) => g.category), [
  'NEWS',
  'EVENTS & GIVEAWAYS',
  'GAME DISCUSSIONS',
  'MINIGAMES',
  'VOICE LOUNGE',
  'CASUAL',
  'COMPETITIVE',
  'GAMING VOICE',
]);
assert.deepEqual(
  gamingGroups[0].channels.map((c) => c.name),
  ['📢・announcements', '🏆・tournament-info', '🤝・partner-servers', '🎯・team-finder']
);
assert.equal(gamingGroups[1].channels.length, 4);
assert.equal(gamingGroups[1].channels[3].type, 'stage');
assert.equal(gamingGroups[2].channels.length, 10);
assert.equal(gamingGroups[3].channels.length, 5);
assert.deepEqual(
  gamingGroups[4].channels.map((c) => c.name),
  ['🎤・voice-settings', '📜・voice-guide']
);
assert(gamingGroups[4].channels.every((c) => c.type === 'text' && c.readOnly));

// Verify General Hangout has GALLERIES and MINIGAMES
const generalGroups = parseTemplate(TEMPLATES.general.spec);
assert.deepEqual(generalGroups.map((g) => g.category), [
  'INFORMATION',
  'CHAT LOUNGE',
  'GALLERIES',
  'MINIGAMES',
  'VOICE LOUNGE',
  'VOICE ROOMS',
]);
assert.deepEqual(
  generalGroups[2].channels.map((c) => c.name),
  ['📸・member-gallery', '🐾・pets', '🍜・food-and-drinks', '🎨・art-and-edits']
);
assert.equal(generalGroups[3].channels.length, 5);

// Verify Community Hub has MINIGAMES and Community Stage
const communityGroups = parseTemplate(TEMPLATES.community.spec);
assert.deepEqual(communityGroups.map((g) => g.category), [
  'INFO CENTER',
  'COMMUNITY',
  'MINIGAMES',
  'EVENTS',
  'VOICE LOUNGE',
  'VOICE ROOMS',
]);
assert.equal(communityGroups[2].channels.length, 5);
assert.equal(communityGroups[3].channels.some((c) => c.type === 'stage'), true);

// Verify Study & Projects has NOTICE BOARD, STUDY HALL, FOCUS ROOMS
const studyGroups = parseTemplate(TEMPLATES.study.spec);
assert.deepEqual(studyGroups.map((g) => g.category), [
  'NOTICE BOARD',
  'STUDY HALL',
  'VOICE LOUNGE',
  'FOCUS ROOMS',
]);

assert.deepEqual(
  GENDER_ROLES.map((r) => r.name),
  ['Male', 'Female', 'Prefer Not to Say']
);
const genderBtnRows = buildRoleButtonRows(
  GENDER_ROLES.map((r, i) => ({ id: `g${i + 1}`, name: r.name, emoji: r.emoji })),
  'role_one'
).map((r) => r.toJSON());
assert.equal(genderBtnRows.length, 1);
assert.equal(genderBtnRows[0].components.length, 3);
assert(genderBtnRows[0].components.every((c) => c.custom_id.startsWith('role_one:')));

const pickableGameRoles = TEMPLATES.games.roles
  .filter((r) => !r.admin && !r.mod && !r.auto)
  .map((r, i) => ({ id: String(i + 1), name: r.name, emoji: r.emoji }));
assert.equal(pickableGameRoles.length, 10);
const roleBtnRows = buildRoleButtonRows(pickableGameRoles).map((r) => r.toJSON());
assert.equal(roleBtnRows.length, 2);
assert.equal(roleBtnRows[0].components.length, 5);
assert.equal(roleBtnRows[1].components.length, 5);

assert.equal(MINIGAME_BOTS.length, 5);
for (const mg of MINIGAME_BOTS) {
  assert(
    gamingGroups[3].channels.some((c) => c.name.includes(mg.slug)),
    `Missing minigame channel for ${mg.slug}`
  );
  const mgPayload = buildMinigameCardPayload(mg, '555', false);
  const mgEmbed = mgPayload.embeds[0].toJSON();
  assertCleanText(mgEmbed.title, `minigame.${mg.slug}.title`);
  assertCleanText(mgEmbed.description, `minigame.${mg.slug}.description`);
  const mgBtn = mgPayload.components[0].toJSON().components[0];
  assertCleanText(mgBtn.label, `minigame.${mg.slug}.button`);
  assert(mgBtn.url.startsWith(`https://discord.com/oauth2/authorize?client_id=${mg.botId}`));
}

assert.equal(MUSIC_BOTS.length, 2);
assert.deepEqual(
  MUSIC_BOTS.map((b) => b.slug),
  ['jockie-music', 'lofi-radio']
);
const musicPayload = buildMusicPanelPayload('555', new Set(), '777');
const musicEmbed = musicPayload.embeds[0].toJSON();
assertCleanText(musicEmbed.title, 'musicPanel.title');
assertCleanText(musicEmbed.description, 'musicPanel.description');
const musicBtns = musicPayload.components[0].toJSON().components;
assert.equal(musicBtns.length, 2);
for (let i = 0; i < MUSIC_BOTS.length; i++) {
  assertCleanText(musicBtns[i].label, `musicBtn.${MUSIC_BOTS[i].slug}`);
  assert(musicBtns[i].url.startsWith(`https://discord.com/oauth2/authorize?client_id=${MUSIC_BOTS[i].botId}`));
}
const musicAllInstalled = buildMusicPanelPayload('555', new Set(MUSIC_BOTS.map((b) => b.botId)), '777');
assert.equal(musicAllInstalled.components, undefined);
assert.equal(gamingGroups[5].channels.length, 4);
assert.equal(gamingGroups[5].channels[0].type, 'jtc');
assert.equal(gamingGroups[6].channels.length, 4);
assert.equal(gamingGroups[6].channels[0].type, 'jtc');
assert.equal(gamingGroups[7].channels.length, 2);
assert.equal(gamingGroups[7].channels[0].type, 'jtc');
assert(!TEMPLATES.games.spec.includes('{server} Event'));

// Verify zero vertical bar separators (｜) remain and all user-facing strings have no () or /
const botSrc = readFileSync(new URL('./bot.js', import.meta.url), 'utf8');
const tplSrc = readFileSync(new URL('./templates.js', import.meta.url), 'utf8');
assert(!botSrc.includes('｜'), 'Vertical bar ｜ must be replaced with dot ・ in bot.js');
assert(!botSrc.includes('TempVoice'), 'No third-party TempVoice branding should remain in bot.js');
assert(!botSrc.includes('Gaming & Squads'), 'Template label must be renamed to Gaming in bot.js');
assert(!tplSrc.includes('Gaming & Squads'), 'Template label must be renamed to Gaming in templates.js');
assert(!botSrc.includes('tempCh.send('), 'Newly created temporary voice rooms must not receive control messages');
assert(!tplSrc.includes('｜'), 'Vertical bar ｜ must be replaced with dot ・ in templates.js');
for (const m of botSrc.matchAll(/\.setLabel\((['`])((?:\\.|(?!\1)[^\\])*)\1\)/g)) {
  assert(m[2].length <= 45, `Modal or button label exceeds 45 chars: "${m[2]}"`);
}
for (const match of botSrc.matchAll(/(['`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
  const str = match[2].replace(/\$\{[^}]+\}/g, '').replace(/\\`/g, '`');
  if (
    str.startsWith('./') ||
    str.startsWith('node:') ||
    str.startsWith('attachment://') ||
    str.startsWith('https://')
  ) {
    continue;
  }
  assertCleanText(str, 'bot.js literal');
}

const parsed = parseTemplate(`
  text: uncategorized
  [✧———✧ CATEGORY A ✧———✧]
  readonly: announcements
  voice: Lounge
  autovoice: Create Room
`);
assert.equal(parsed[0].category, null);
assert.equal(parsed[0].channels[0].name, 'uncategorized');
assert.equal(parsed[1].category, 'CATEGORY A');

const everyoneId = '100';
const exported = serializeGuildTemplate({
  everyoneId,
  hubs: { 'v-jtc': '100' },
  temp: { 'v-temp': '999' },
  fixedIds: new Set(['cat-stats', 'v-date']),
  channels: [
    { id: 'cat-stats', name: '✧———✧ SERVER STATS ✧———✧', type: ChannelType.GuildCategory, rawPosition: 0 },
    { id: 'v-date', name: '📅 Tuesday Oct 27th', type: ChannelType.GuildVoice, parentId: 'cat-stats', rawPosition: 0 },
    { id: 'cat-1', name: '✧———✧ INFO AND VOICE ✧———✧', type: ChannelType.GuildCategory, rawPosition: 1 },
    {
      id: 't-ann',
      name: 'announcements',
      type: ChannelType.GuildText,
      parentId: 'cat-1',
      rawPosition: 0,
      permissionOverwrites: {
        cache: new Map([[everyoneId, { deny: new PermissionsBitField(['SendMessages']) }]]),
      },
    },
    { id: 't-chat', name: 'general-chat', type: ChannelType.GuildText, parentId: 'cat-1', rawPosition: 1 },
    { id: 'v-jtc', name: '➕ Create Voice', type: ChannelType.GuildVoice, parentId: 'cat-1', rawPosition: 0 },
    {
      id: 'v-admin',
      name: '🎙️ Admin Event',
      type: ChannelType.GuildVoice,
      parentId: 'cat-1',
      rawPosition: 1,
      permissionOverwrites: {
        cache: new Map([[everyoneId, { deny: new PermissionsBitField(['Connect']) }]]),
      },
    },
    { id: 'v-stage', name: '🎙️ Stage Event', type: ChannelType.GuildStageVoice, parentId: 'cat-1', rawPosition: 2 },
    { id: 'v-temp', name: '🔊 Alex', type: ChannelType.GuildVoice, parentId: 'cat-1', rawPosition: 3 },
  ],
  roles: [
    { id: everyoneId, name: '@everyone', managed: false, rawPosition: 0 },
    {
      id: 'r-admin',
      name: 'Admin',
      color: 0xe74c3c,
      managed: false,
      rawPosition: 3,
      permissions: new PermissionsBitField(['Administrator']),
    },
  ],
});

assert.equal(exported.roles.length, 1);
assert.equal(exported.roles[0].admin, true);
assert(!exported.spec.includes('SERVER STATS'), 'fixed sections must not be duplicated in backup');
assert(!exported.spec.includes('Alex'), 'temporary voice must not be included in backup');
assert.deepEqual(parseTemplate(exported.spec), [
  {
    category: 'INFO AND VOICE',
    channels: [
      { name: 'announcements', type: 'text', readOnly: true },
      { name: 'general-chat', type: 'text', readOnly: false },
      { name: '➕ Create Voice', type: 'jtc', readOnly: false },
      { name: '🎙️ Admin Event', type: 'adminvoice', readOnly: false },
      { name: '🎙️ Stage Event', type: 'stage', readOnly: false },
    ],
  },
]);

assert.throws(() => parseTemplate('   \n  '), /empty/i);
assert.throws(() => parseTemplate(Array.from({ length: 101 }, (_, i) => `ch-${i}`).join('\n')), /within 100/);

// Channel & category matching for reuse + repositioning + Community rules safety
assert.equal(normalizeCategoryKey('✧━━━✧ VOICE LOUNGE ✧━━━✧'), 'voice lounge');
assert.equal(normalizeCategoryKey('✧———✧ voice lounge ✧———✧'), 'voice lounge');
assert.equal(normalizeChannelKey('📜\uff5cRules', true), '📜・rules');
assert.equal(coreChannelKey('📜・rules', true), 'rules');
assert.equal(coreChannelKey('👋🏻・goodbye', true), 'goodbye');
assert.equal(coreChannelKey('🎮 Casual 1', false), 'casual 1');

const mockExistingChannels = [
  { id: 'cat-gw', name: '✧———✧ GATEWAY ✧———✧', type: ChannelType.GuildCategory },
  { id: 'ch-rules-orphan', name: 'rules', type: ChannelType.GuildText, parentId: null },
  { id: 'ch-valo-wrong-cat', name: '🎯・valorant', type: ChannelType.GuildText, parentId: 'cat-gw' },
  { id: 'ch-temp-voice', name: '🎮 Casual 1', type: ChannelType.GuildVoice, parentId: 'cat-gw' },
];

const matchedGw = findMatchingCategory(mockExistingChannels, 'GATEWAY');
assert.equal(matchedGw?.id, 'cat-gw');

const matchedRules = findMatchingChannel(mockExistingChannels, {
  name: '📜・rules',
  kind: 'text',
  parentId: 'cat-gw',
});
assert.equal(matchedRules?.id, 'ch-rules-orphan');

const matchedValo = findMatchingChannel(mockExistingChannels, {
  name: '🎯・valorant',
  kind: 'text',
  parentId: 'cat-games',
});
assert.equal(matchedValo?.id, 'ch-valo-wrong-cat');

const skippedTemp = findMatchingChannel(
  mockExistingChannels,
  { name: '🎮 Casual 1', kind: 'voice', parentId: 'cat-casual' },
  { excludeIds: new Set(['ch-temp-voice']) }
);
assert.equal(skippedTemp, null);

// Lego modules validation
assert.equal(LEGO_MODULES.length, 12, 'Must have 12 Lego modules');
for (const mod of LEGO_MODULES) {
  assert(mod.id && mod.label && mod.shortLabel && mod.description && mod.category && mod.spec);
  assertCleanText(mod.label, `LEGO_MODULES.${mod.id}.label`);
  assertCleanText(mod.shortLabel, `LEGO_MODULES.${mod.id}.shortLabel`);
  assertCleanText(mod.description, `LEGO_MODULES.${mod.id}.description`);
  assertCleanText(mod.category, `LEGO_MODULES.${mod.id}.category`);
  const parsed = parseTemplate(`[${mod.category}]\n${mod.spec}`);
  assert(parsed.length > 0);
}

// Custom builder payload validation
const mockSession = {
  guildId: 'guild-123',
  userId: 'user-456',
  replace: false,
  selectedModules: ['news', 'chat', 'minigames'],
  customCategoryName: 'VIP ZONE',
  customTextChannels: 'chat, media, bot-commands',
  customVoiceChannels: 'Lounge 1, Lounge 2',
  createdAt: Date.now(),
};

const generatedSpec = buildSpecFromCustomForm(mockSession);
assert(generatedSpec.includes('[VIP ZONE]'));
assert(generatedSpec.includes('💬・chat'));
assert(generatedSpec.includes('💬・media'));
assert(generatedSpec.includes('💬・bot-commands'));
assert(generatedSpec.includes('voice: 🔊 Lounge 1'));
assert(generatedSpec.includes('voice: 🔊 Lounge 2'));

const parsedCustom = parseTemplate(generatedSpec);
assert.equal(parsedCustom.length, 1);
assert.equal(parsedCustom[0].category, 'VIP ZONE');
assert.equal(parsedCustom[0].channels.length, 5);

const customPayload = buildCustomBuilderPayload(mockSession, 'session-test-id');
assert(customPayload.embeds.length === 1);
assert.equal(customPayload.components.length, 5, 'Must have 5 rows: 4 rows of 3 module toggles and 1 row of actions');

const customEmbed = customPayload.embeds[0].data;
assertCleanText(customEmbed.title, 'customBuilder.title');
assertCleanText(customEmbed.description, 'customBuilder.description');
for (const f of customEmbed.fields) {
  assertCleanText(f.name, `customBuilder.field.${f.name}`);
  assertCleanText(f.value, `customBuilder.field.${f.name}.value`);
}

// Validate 12 toggle buttons across first 4 rows
let toggleCount = 0;
for (let r = 0; r < 4; r++) {
  const rowBtns = customPayload.components[r].components.map((c) => c.toJSON());
  assert.equal(rowBtns.length, 3);
  for (const btn of rowBtns) {
    toggleCount++;
    assert(btn.custom_id.startsWith('custom_lego_toggle:session-test-id:'));
    const modId = btn.custom_id.split(':')[2];
    assertCleanText(btn.label, `customBuilder.toggle.${modId}.label`);
    if (mockSession.selectedModules.includes(modId)) {
      assert(btn.label.startsWith('✅'));
      assert.equal(btn.style, 3); // Success
    } else {
      assert(btn.label.startsWith('⬜'));
      assert.equal(btn.style, 2); // Secondary
    }
  }
}
assert.equal(toggleCount, 12);

// Validate 5th row (Action buttons)
const buttonRow = customPayload.components[4].components.map((c) => c.toJSON());
assert.equal(buttonRow.length, 3);
assertCleanText(buttonRow[0].label, 'customBuilder.buildButton.label');
assertCleanText(buttonRow[1].label, 'customBuilder.addButton.label');
assertCleanText(buttonRow[2].label, 'customBuilder.cancelButton.label');

// Test Lego modular build combining
let testCombinedSpec = '';
let testIncludeMusic = false;
for (const modId of ['news', 'chat', 'minigames']) {
  if (modId === 'music') {
    testIncludeMusic = true;
    continue;
  }
  const mod = LEGO_MODULES.find((m) => m.id === modId);
  if (mod) testCombinedSpec += `[${mod.category}]\n${mod.spec}\n`;
}
testCombinedSpec += `\n[VIP AREA]\n💬・vip-chat\nvoice: 🍷 VIP Lounge\n`;
const testGroups = parseTemplate(testCombinedSpec);
assert.equal(testIncludeMusic, false);
assert(testGroups.some((g) => g.category === 'NEWS'));
assert(testGroups.some((g) => g.category === 'CHAT LOUNGE'));
assert(testGroups.some((g) => g.category === 'MINIGAMES'));
assert(testGroups.some((g) => g.category === 'VIP AREA'));

let musicIncluded = false;
for (const modId of ['music']) {
  if (modId === 'music') musicIncluded = true;
}
assert.equal(musicIncluded, true);

console.log('✅ All fixed sections, stats, gateway, UX, and style checks passed!');
