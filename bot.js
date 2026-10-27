import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  OverwriteType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} from 'discord.js';
import {
  CUSTOM_DEFAULT_SPEC,
  findMatchingCategory,
  findMatchingChannel,
  formatCategoryHeader,
  formatStatsDate,
  GENDER_ROLES,
  LEGO_MODULES,
  parseTemplate,
  serializeGuildTemplate,
  TEMPLATES,
} from './templates.js';
import { generateCaptcha, generateMilestoneBanner } from './captcha.js';
import {
  padVoiceLabel,
  renderVoiceEmojiPng,
  VOICE_INTERFACE_ITEMS,
} from './voice-ui.js';

// ponytail: local state.json file, move to SQLite when multi-process sharding is needed
const STATE_FILE = new URL('./state.json', import.meta.url);
const rawState = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {};
const state = {
  hubs: rawState.hubs ?? {},
  temp: rawState.temp ?? {},
  waiting: rawState.waiting ?? {},
  backups: rawState.backups ?? {},
  guilds: rawState.guilds ?? {},
};

function saveState() {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function toSlug(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function getFixedChannelIds(guildId) {
  const cfg = state.guilds[guildId];
  if (!cfg) return new Set();
  return new Set(
    Object.entries(cfg)
      .filter(([k, v]) => typeof v === 'string' && k !== 'verifiedRoleId' && k !== 'memberRoleId')
      .map(([, v]) => v)
  );
}

const pendingSetups = new Map();
const customBuilderSessions = new Map();
const guildInvites = new Map();
const lastStatsSync = new Map();
const pendingStatsTimers = new Map();
const captchaSessions = new Map();
const verifyCooldowns = new Map();
const STATS_COOLDOWN_MS = 330_000;
const CAPTCHA_TTL_MS = 120_000;
const VERIFY_LOCKOUT_MS = 180_000;
const CONFIRMATION_TTL_MS = 300_000;
const CUSTOM_BUILDER_TTL_MS = 600_000;

const DANGEROUS_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
];

const ROOM_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.MoveMembers,
];

const STATS_ADMIN_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.MoveMembers,
];

const voiceEmojiMap = new Map();

async function syncVoiceApplicationEmojis(readyClient) {
  try {
    await readyClient.application.fetch();
    const existing = await readyClient.application.emojis.fetch();
    for (const item of VOICE_INTERFACE_ITEMS) {
      let em = existing.find((e) => e.name === item.emojiName);
      if (!em) {
        em = await readyClient.application.emojis
          .create({ attachment: renderVoiceEmojiPng(item.key), name: item.emojiName })
          .catch(() => null);
      }
      if (em) voiceEmojiMap.set(item.key, { id: em.id, name: em.name });
    }
  } catch (err) {
    console.warn('Voice emoji sync skipped:', err.message);
  }
}

export function buildVoicePanel() {
  const rows = [];
  for (let i = 0; i < VOICE_INTERFACE_ITEMS.length; i += 5) {
    const row = new ActionRowBuilder();
    for (const item of VOICE_INTERFACE_ITEMS.slice(i, i + 5)) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`vc:${item.key}`)
          .setLabel(padVoiceLabel(item.label))
          .setEmoji(voiceEmojiMap.get(item.key) ?? { name: item.fallback })
          .setStyle(ButtonStyle.Secondary)
      );
    }
    rows.push(row);
  }
  return rows;
}

export function buildVoiceInterfacePayload() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🎛️ Voice Room Controls')
    .setDescription(
      'Join any `➕ Create` voice channel to get your own temporary room, then click any button below to customize it or use `/voice` commands.'
    );

  return {
    embeds: [embed],
    components: buildVoicePanel(),
  };
}

export function buildSpecFromCustomForm(session) {
  const parts = [];
  const hasItems =
    session.customTextChannels?.trim() ||
    session.customVoiceChannels?.trim() ||
    session.customReadonlyChannels?.trim() ||
    session.customAutovoiceChannels?.trim();

  if (!hasItems) return '';

  const cat = session.customCategoryName?.trim() || 'CUSTOM AREA';
  parts.push(`[${cat}]`);

  if (session.customReadonlyChannels?.trim()) {
    for (const raw of session.customReadonlyChannels.split(',').map((s) => s.trim()).filter(Boolean)) {
      const clean = raw.replace(/^readonly:\s*/i, '');
      const formatted = /^\p{Extended_Pictographic}/u.test(clean) ? clean : `📢・${clean}`;
      parts.push(`readonly: ${formatted}`);
    }
  }

  if (session.customTextChannels?.trim()) {
    for (const raw of session.customTextChannels.split(',').map((s) => s.trim()).filter(Boolean)) {
      const clean = raw.replace(/^(text:\s*)?#*/i, '');
      const formatted = /^\p{Extended_Pictographic}/u.test(clean) ? clean : `💬・${clean}`;
      parts.push(formatted);
    }
  }

  if (session.customVoiceChannels?.trim()) {
    for (const raw of session.customVoiceChannels.split(',').map((s) => s.trim()).filter(Boolean)) {
      const clean = raw.replace(/^voice:\s*/i, '');
      const formatted = /^\p{Extended_Pictographic}/u.test(clean) ? clean : `🔊 ${clean}`;
      parts.push(`voice: ${formatted}`);
    }
  }

  if (session.customAutovoiceChannels?.trim()) {
    for (const raw of session.customAutovoiceChannels.split(',').map((s) => s.trim()).filter(Boolean)) {
      const clean = raw.replace(/^(autovoice:|auto:|\+)\s*/i, '');
      const formatted = /^\p{Extended_Pictographic}/u.test(clean) ? clean : `➕ ${clean}`;
      parts.push(`autovoice: ${formatted}`);
    }
  }

  return parts.join('\n');
}

export function buildCustomBuilderPayload(session, sessionId) {
  const customLines = [];
  if (session.customCategoryName?.trim()) {
    customLines.push(`📁 Category: **${session.customCategoryName.trim()}**`);
  }
  if (session.customTextChannels?.trim()) {
    customLines.push(`💬 Text: ${session.customTextChannels.trim()}`);
  }
  if (session.customVoiceChannels?.trim()) {
    customLines.push(`🔊 Voice: ${session.customVoiceChannels.trim()}`);
  }
  if (session.customReadonlyChannels?.trim()) {
    customLines.push(`📢 Read-Only: ${session.customReadonlyChannels.trim()}`);
  }
  if (session.customAutovoiceChannels?.trim()) {
    customLines.push(`➕ Auto Voice: ${session.customAutovoiceChannels.trim()}`);
  }

  const customItemsDesc = customLines.length
    ? customLines.join('\n').slice(0, 1024)
    : 'None added yet';

  const selectedList = (session.selectedModules ?? [])
    .map((id) => {
      const mod = LEGO_MODULES.find((m) => m.id === id);
      return mod ? `✅ ${mod.label}` : null;
    })
    .filter(Boolean);

  const selectedDesc = selectedList.length
    ? selectedList.join('\n')
    : 'None selected yet';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🛠️ Custom Server Builder')
    .setDescription(
      'Click the checkbox buttons below to toggle modules on or off. SERVER STATS and GATEWAY will be created automatically at the top.'
    )
    .addFields(
      {
        name: '📦 Selected Modules',
        value: selectedDesc.slice(0, 1024),
      },
      {
        name: '➕ Custom Items',
        value: customItemsDesc,
        inline: true,
      },
      {
        name: '🔄 Setup Mode',
        value: session.replace ? 'Delete old channels and start fresh' : 'Add alongside current channels',
        inline: true,
      }
    );

  const rows = [];
  for (let i = 0; i < LEGO_MODULES.length; i += 3) {
    const row = new ActionRowBuilder();
    for (const mod of LEGO_MODULES.slice(i, i + 3)) {
      const isSelected = session.selectedModules?.includes(mod.id) ?? false;
      const label = isSelected
        ? `✅ ${mod.shortLabel || mod.label}`
        : `⬜ ${mod.shortLabel || mod.label}`;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`custom_lego_toggle:${sessionId}:${mod.id}`)
          .setLabel(label.slice(0, 80))
          .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary)
      );
    }
    rows.push(row);
  }

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`custom_lego_build:${sessionId}`)
      .setLabel('🚀 Build Server')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`custom_lego_add:${sessionId}`)
      .setLabel('➕ Add Custom Items')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`custom_lego_cancel:${sessionId}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );
  rows.push(actionRow);

  return {
    embeds: [embed],
    components: rows,
  };
}

async function sendFreshVoicePanel(ch) {
  const msgs = await ch.messages?.fetch({ limit: 10 }).catch(() => null);
  if (msgs) {
    for (const m of msgs.values()) {
      if (
        m.author?.id === client.user?.id &&
        m.components?.some((r) => r.components?.some((c) => c.customId === 'vc:rename'))
      ) {
        await m.delete().catch(() => {});
      }
    }
  }
  return ch.send(buildVoiceInterfacePayload());
}

const DOCS = {
  en: {
    title: '📖 Server Guide & Commands',
    description:
      'Everything you need to build a server layout, use personal voice rooms, and set up interactive member panels.',
    fields: [
      {
        name: '🏗️ Build or Clean Server — `/setup` & `/clear-channels`',
        value:
          'Every generated server automatically includes live `SERVER STATS`, `GATEWAY`, and `MUSIC AREA` sections, plus an `Admin` role with full stats access.\n• Pick General Hangout, Community Hub, Gaming, Study & Projects, or Custom Layout.\n• Add mode keeps your current channels safe.\n• Delete old channels mode wipes previous channels after you confirm.\n• Run `/clear-channels` anytime you want to wipe every channel clean.',
      },
      {
        name: '🛠️ How Custom Layout Works',
        value:
          'Choose Custom Layout in `/setup` and write one item per line:\n• `[Category Name]` creates a bold `✧━━━✧` category header.\n• `readonly: announcements` creates a read-only text channel.\n• `general-chat` creates a regular text channel.\n• `voice: Lounge` creates a permanent voice channel.\n• `stage: Event Stage` creates a podcast stage channel.\n• `adminvoice: Admin Event` creates a staff-only voice channel.\n• `autovoice: ➕ Create Voice` creates an automatic room generator.\n• Include `{server}` in any channel name to insert your server name automatically.',
      },
      {
        name: '🔊 Personal Voice Rooms — `/auto-voice` & `/voice`',
        value:
          'Click any `➕ Create` voice channel to instantly get your own temporary room. It closes automatically once everyone leaves.\n• Admins can run `/auto-voice` to place a new voice generator or `/voice interface` to post the 15-button **Voice Room Controls** panel anywhere.\n• Room owners can use the control buttons for Name, Limit, Privacy, Waiting, Chat, Trust, Untrust, Invite, Kick, Region, Block, Unblock, Claim, Transfer, and Delete, or run `/voice` commands.',
      },
      {
        name: '💾 Save & Reuse Layouts — `/backup`',
        value:
          'Turn your current server structure into a saved template.\n• `/backup save` saves your current categories, channels, and roles.\n• `/backup list` shows all saved layouts.\n• `/backup load` builds a server using a saved layout.\n• `/backup delete` deletes a saved layout.',
      },
      {
        name: '🛡️ Verification, Roles & Tickets — `/verify-panel`, `/role-panel` & `/ticket-panel`',
        value:
          '• Newcomers automatically receive the `Member` role, and `GATEWAY` includes `✅・verify` with distorted image CAPTCHA that unlocks main channels with the `Verified` role. Use `/verify-panel` for custom panels with optional minimum account age protection.\n• `📍・roles-pick` uses one-click toggle buttons for game or interest roles, and `/role-panel` supports both clickable buttons and dropdown menus.\n• `/ticket-panel` sends a button that opens a private support channel with moderators.',
      },
      {
        name: '🎉 Member Milestones — `/milestone`',
        value:
          'Celebrate server growth automatically with custom milestone banner cards, live countdowns on welcome cards, and optional reward roles.\n• `/milestone set` customizes milestone intervals, specific targets, channel, and reward role.\n• `/milestone status` shows current progress toward the next goal.\n• `/milestone test` sends a preview milestone celebration card.\n• `/milestone disable` turns off milestone celebrations.',
      },
    ],
  },
  id: {
    title: '📖 Panduan Lengkap Penggunaan Bot',
    description:
      'Semua panduan mudah untuk membangun server otomatis, memakai voice pribadi, serta memasang panel interaktif untuk member.',
    fields: [
      {
        name: '🏗️ Bangun & Bersihkan Server — `/setup` & `/clear-channels`',
        value:
          'Setiap server hasil generate otomatis memiliki kategori `SERVER STATS`, `GATEWAY`, serta `MUSIC AREA` lengkap dengan role `Admin`.\n• Pilih tema General Hangout, Community Hub, Gaming, Study & Projects, atau Custom Layout.\n• Pilihan Add akan menambah channel baru tanpa menyentuh channel lama.\n• Pilihan Delete old channels akan mereset channel lama setelah kamu menekan tombol konfirmasi.\n• Gunakan `/clear-channels` kapan saja untuk menghapus seluruh channel hingga bersih.',
      },
      {
        name: '🛠️ Cara Menulis Custom Layout',
        value:
          'Pilih Custom Layout pada `/setup`, lalu tulis satu baris untuk setiap item:\n• `[Nama Kategori]` membuat judul kategori tebal bergaya `✧━━━✧`.\n• `readonly: pengumuman` membuat text channel khusus baca.\n• `obrolan-umum` membuat text channel biasa.\n• `voice: Ruang Santai` membuat voice channel permanen.\n• `stage: Panggung Acara` membuat channel panggung podcast.\n• `adminvoice: Ruang Admin` membuat voice channel khusus staff dan admin.\n• `autovoice: ➕ Buat Voice` membuat pemicu voice otomatis.\n• Gunakan `{server}` pada nama channel untuk menyisipkan nama server secara otomatis.',
      },
      {
        name: '🔊 Voice Pribadi Otomatis — `/auto-voice` & `/voice`',
        value:
          'Klik channel `➕ Create` mana saja untuk langsung dibuatkan voice room sementara sesuai namamu. Channel tersebut otomatis tertutup saat semua orang keluar.\n• Admin bisa memakai `/auto-voice` untuk menambah pemicu baru atau `/voice interface` untuk mengirim panel **Voice Room Controls** berisi 15 tombol di channel mana pun.\n• Pemilik room bisa menekan tombol kontrol untuk Name, Limit, Privacy, Waiting, Chat, Trust, Untrust, Invite, Kick, Region, Block, Unblock, Claim, Transfer, dan Delete, atau memakai perintah `/voice`.',
      },
      {
        name: '💾 Simpan & Muat Susunan Server — `/backup`',
        value:
          'Simpan bentuk server kamu saat ini agar bisa dipakai lagi kapan saja.\n• `/backup save` menyimpan seluruh kategori, channel, dan role saat ini.\n• `/backup list` melihat daftar susunan server yang tersimpan.\n• `/backup load` membangun server dari susunan yang sudah disimpan.\n• `/backup delete` menghapus susunan yang tersimpan.',
      },
      {
        name: '🛡️ Verifikasi Captcha, Role & Tiket — `/verify-panel`, `/role-panel` & `/ticket-panel`',
        value:
          '• Member baru otomatis mendapat role `Member`, dan kategori `GATEWAY` dilengkapi channel `✅・verify` berisi gambar CAPTCHA anti-bot yang membuka seluruh isi server lewat role `Verified`. Gunakan `/verify-panel` untuk memasang panel tambahan beserta batas minimal umur akun Discord.\n• `📍・roles-pick` memakai tombol sekali klik untuk mengambil atau melepas role game, dan `/role-panel` mendukung tampilan tombol maupun dropdown.\n• `/ticket-panel` mengirim tombol pembuka ruang bantuan privat dengan moderator.',
      },
      {
        name: '🎉 Perayaan Milestone Member — `/milestone`',
        value:
          'Rayakan pertumbuhan jumlah member secara otomatis lengkap dengan kartu gambar milestone, hitung mundur otomatis di pesan sambutan, serta hadiah role khusus.\n• `/milestone set` mengatur kelipatan target, angka target khusus, channel pengumuman, dan role hadiah.\n• `/milestone status` melihat progres menuju target berikutnya.\n• `/milestone test` mengirim contoh kartu perayaan milestone.\n• `/milestone disable` mematikan pengumuman milestone otomatis.',
      },
    ],
  },
};

export function buildDocsPayload(lang = 'en') {
  const doc = DOCS[lang] ?? DOCS.en;
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(doc.title)
    .setDescription(doc.description)
    .addFields(doc.fields);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('docs:en')
      .setLabel('🇬🇧 English')
      .setStyle(lang === 'en' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(lang === 'en'),
    new ButtonBuilder()
      .setCustomId('docs:id')
      .setLabel('🇮🇩 Bahasa Indonesia')
      .setStyle(lang === 'id' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(lang === 'id')
  );

  return { embeds: [embed], components: [row] };
}

export const COMMANDS = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Read the complete guide and command list')
    .addStringOption((opt) =>
      opt
        .setName('language')
        .setDescription('Pick your preferred guide language')
        .addChoices(
          { name: '🇬🇧 English', value: 'en' },
          { name: '🇮🇩 Indonesian', value: 'id' }
        )
    ),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Build a complete server layout from a ready-made or custom template')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName('template')
        .setDescription('Pick the style of server you want to build')
        .setRequired(true)
        .addChoices(
          { name: '🏠 General Hangout', value: 'general' },
          { name: '🌐 Community Hub', value: 'community' },
          { name: '🎮 Gaming', value: 'games' },
          { name: '📚 Study & Projects', value: 'study' },
          { name: '🛠️ Custom Layout', value: 'custom' }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Choose whether to keep or replace your current channels')
        .addChoices(
          { name: '➕ Add alongside current channels', value: 'add' },
          { name: '🔄 Delete old channels and start fresh', value: 'replace' }
        )
    ),

  new SlashCommandBuilder()
    .setName('clear-channels')
    .setDescription('Delete all categories, text channels, and voice channels in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName('after')
        .setDescription('Choose whether to leave one empty channel for typing commands')
        .addChoices(
          { name: '🧹 Delete everything completely', value: 'empty' },
          { name: '💬 Keep one fresh general channel', value: 'keep' }
        )
    ),

  new SlashCommandBuilder()
    .setName('create-channel')
    .setDescription('Create a channel or category without opening server settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName('name')
        .setDescription('Name of the channel or category to create')
        .setMaxLength(100)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('type')
        .setDescription('Pick the channel or category type')
        .setRequired(true)
        .addChoices(
          { name: '💬 Regular Text Channel', value: 'text' },
          { name: '📢 Read-Only Announcement Channel', value: 'readonly' },
          { name: '🔊 Standard Voice Room', value: 'voice' },
          { name: '➕ Auto Voice Generator Hub', value: 'autovoice' },
          { name: '🎙️ Live Stage Channel', value: 'stage' },
          { name: '🛡️ Admin Only Voice Room', value: 'adminvoice' },
          { name: '📁 Category Divider', value: 'category' }
        )
    )
    .addChannelOption((opt) =>
      opt
        .setName('category')
        .setDescription('Pick a category to place this channel inside')
        .addChannelTypes(ChannelType.GuildCategory)
    ),

  new SlashCommandBuilder()
    .setName('auto-voice')
    .setDescription('Create a voice channel that automatically makes personal rooms when joined')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt.setName('name').setDescription('Custom name for this channel, default is ➕ Create Voice')
    )
    .addChannelOption((opt) =>
      opt
        .setName('category')
        .setDescription('Pick which category to place this voice channel inside')
        .addChannelTypes(ChannelType.GuildCategory)
    ),

  new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Control your personal temporary voice room or post the voice control panel')
    .addSubcommand((sub) =>
      sub.setName('interface').setDescription('Send the Voice Room Controls panel in this channel')
    )
    .addSubcommand((sub) => sub.setName('lock').setDescription('Close your voice room so nobody else can join'))
    .addSubcommand((sub) => sub.setName('unlock').setDescription('Open your voice room so anyone can join'))
    .addSubcommand((sub) =>
      sub
        .setName('limit')
        .setDescription('Set how many people can join your voice room')
        .addIntegerOption((opt) =>
          opt
            .setName('max_members')
            .setDescription('Enter 1 to 99 for a limit, or 0 for unlimited')
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('Change the name of your voice room')
        .addStringOption((opt) =>
          opt.setName('new_name').setDescription('Type the new name for your voice room').setMaxLength(90).setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('claim').setDescription('Become the room owner if the creator already left')
    )
    .addSubcommand((sub) =>
      sub.setName('delete').setDescription('Close and delete your temporary voice room immediately')
    ),

  new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Save this server layout or load a saved layout')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('save')
        .setDescription('Save this server layout so you can reuse it anytime')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Give this saved layout a name').setMaxLength(40).setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('See all your saved server layouts'))
    .addSubcommand((sub) =>
      sub
        .setName('load')
        .setDescription('Build this server using one of your saved layouts')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Pick a saved layout to load').setAutocomplete(true).setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('mode')
            .setDescription('Choose whether to keep or replace your current channels')
            .addChoices(
              { name: '➕ Add alongside current channels', value: 'add' },
              { name: '🔄 Delete old channels and start fresh', value: 'replace' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Remove a saved server layout')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Pick a saved layout to delete').setAutocomplete(true).setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName('milestone')
    .setDescription('Configure automatic member milestone celebration cards and goals')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Configure milestone interval, custom goals, channel, and reward role')
        .addIntegerOption((opt) =>
          opt
            .setName('every')
            .setDescription('Celebrate every N members, such as 50 or 100, use 0 for custom goals only')
            .setMinValue(0)
            .setMaxValue(100000)
        )
        .addStringOption((opt) =>
          opt
            .setName('goals')
            .setDescription('Specific member targets separated by commas, like 10, 25, 50, 250, 1000')
        )
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Channel for milestone cards, defaults to the welcome channel')
            .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption((opt) =>
          opt
            .setName('reward_role')
            .setDescription('Special role automatically awarded to the milestone member')
        )
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Check current member count, next milestone target, and active settings')
    )
    .addSubcommand((sub) =>
      sub.setName('test').setDescription('Send a sample milestone celebration card in this channel to preview it')
    )
    .addSubcommand((sub) =>
      sub.setName('disable').setDescription('Turn off automatic member milestone celebrations')
    ),

  new SlashCommandBuilder()
    .setName('verify-panel')
    .setDescription('Create an image CAPTCHA verification panel that grants a verified role')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((opt) =>
      opt.setName('role').setDescription('Role given after passing verification, default is Verified')
    )
    .addIntegerOption((opt) =>
      opt
        .setName('min_account_hours')
        .setDescription('Block newly created Discord accounts younger than these hours, 0 allows all')
        .setMinValue(0)
        .setMaxValue(720)
    )
    .addStringOption((opt) => opt.setName('title').setDescription('Custom heading shown on the verification card')),

  new SlashCommandBuilder()
    .setName('role-panel')
    .setDescription('Create clickable buttons or a dropdown menu where members pick roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName('roles')
        .setDescription('Role names separated by commas, like Valorant, Minecraft, Roblox')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('style')
        .setDescription('Choose clickable buttons or a dropdown menu')
        .addChoices(
          { name: '🔘 Clickable Buttons', value: 'buttons' },
          { name: '📋 Dropdown Menu', value: 'dropdown' }
        )
    )
    .addStringOption((opt) => opt.setName('title').setDescription('Custom heading shown above the role panel')),

  new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Create a button where members can open private support tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt.setName('title').setDescription('Custom heading shown above the ticket button'))
    .addStringOption((opt) => opt.setName('message').setDescription('Short message shown above the ticket button')),
].map((c) => c.toJSON());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildInvites,
  ],
});

client.on('error', (err) => {
  console.error('Discord client error:', err.message);
});

export function computeStatsStrings(guild, now = new Date()) {
  let online = 0;
  let dnd = 0;
  let idle = 0;

  for (const presence of guild.presences?.cache?.values() ?? []) {
    if (presence.status === 'online') online++;
    else if (presence.status === 'dnd') dnd++;
    else if (presence.status === 'idle') idle++;
  }

  return {
    dateName: formatStatsDate(now),
    presenceName: `🟢 ${online} ⛔ ${dnd} 🌙 ${idle}`,
    usersName: `Users: ${guild.memberCount ?? 0}`,
  };
}

async function renameChannelIfChanged(guild, channelId, nextName) {
  if (!channelId) return;
  const ch = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
  if (ch && ch.name !== nextName) {
    await ch.setName(nextName).catch(() => {});
  }
}

async function syncGuildStats(guild) {
  const cfg = state.guilds[guild.id];
  if (!cfg) return;
  lastStatsSync.set(guild.id, Date.now());

  const { dateName, presenceName, usersName } = computeStatsStrings(guild);
  await renameChannelIfChanged(guild, cfg.dateId, dateName);
  await renameChannelIfChanged(guild, cfg.presenceId, presenceName);
  await renameChannelIfChanged(guild, cfg.usersId, usersName);
}

function scheduleStatsSync(guild) {
  if (!state.guilds[guild.id] || pendingStatsTimers.has(guild.id)) return;
  const elapsed = Date.now() - (lastStatsSync.get(guild.id) ?? 0);
  const waitMs = Math.max(5_000, STATS_COOLDOWN_MS - elapsed);

  const timer = setTimeout(async () => {
    pendingStatsTimers.delete(guild.id);
    await syncGuildStats(guild);
  }, waitMs);
  timer.unref();
  pendingStatsTimers.set(guild.id, timer);
}

async function cacheGuildInvites(guild) {
  const me = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));
  if (!me?.permissions.has(PermissionFlagsBits.ManageGuild)) return;
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return;
  guildInvites.set(
    guild.id,
    new Map(invites.map((inv) => [inv.code, { uses: inv.uses ?? 0, inviterId: inv.inviter?.id ?? null }]))
  );
}

function getStaffRoles(guild) {
  return [...guild.roles.cache.values()]
    .filter(
      (r) =>
        !r.managed &&
        r.id !== guild.id &&
        (r.name.toLowerCase() === 'admin' ||
          r.name.toLowerCase() === 'moderator' ||
          r.permissions.has(PermissionFlagsBits.Administrator) ||
          r.permissions.has(PermissionFlagsBits.ManageGuild) ||
          r.permissions.has(PermissionFlagsBits.ManageMessages))
    )
    .slice(0, 20);
}

function buildReadOnlyOverwrites(guild, verifiedRoleId = null) {
  const everyoneDeny = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.CreatePrivateThreads,
  ];
  if (verifiedRoleId) everyoneDeny.unshift(PermissionFlagsBits.ViewChannel);

  const staffAllow = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
  ];

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      ...(verifiedRoleId ? {} : { allow: [PermissionFlagsBits.ViewChannel] }),
      deny: everyoneDeny,
    },
    {
      id: client.user.id,
      allow: staffAllow,
    },
    {
      id: guild.ownerId,
      type: OverwriteType.Member,
      allow: staffAllow,
    },
    ...getStaffRoles(guild)
      .filter((r) => r.id !== verifiedRoleId)
      .map((r) => ({
        id: r.id,
        allow: staffAllow,
      })),
  ];

  if (verifiedRoleId) {
    overwrites.push({
      id: verifiedRoleId,
      allow: [PermissionFlagsBits.ViewChannel],
    });
  }
  return overwrites;
}

function buildGatedCategoryOverwrites(guild, verifiedRoleId) {
  if (!verifiedRoleId) return [];
  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: verifiedRoleId,
      allow: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: client.user.id,
      allow: ROOM_PERMS,
    },
    {
      id: guild.ownerId,
      type: OverwriteType.Member,
      allow: [PermissionFlagsBits.ViewChannel],
    },
    ...getStaffRoles(guild)
      .filter((r) => r.id !== verifiedRoleId)
      .map((r) => ({
        id: r.id,
        allow: [PermissionFlagsBits.ViewChannel],
      })),
  ];
}

function buildAdminVoiceOverwrites(guild, verifiedRoleId) {
  const staffRoles = [...guild.roles.cache.values()]
    .filter(
      (r) =>
        !r.managed &&
        r.id !== guild.id &&
        (r.name.toLowerCase() === 'admin' ||
          r.name.toLowerCase() === 'moderator' ||
          r.permissions.has(PermissionFlagsBits.Administrator) ||
          r.permissions.has(PermissionFlagsBits.ManageGuild) ||
          r.permissions.has(PermissionFlagsBits.ManageMessages))
    )
    .slice(0, 20);

  const staffVoicePerms = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.Stream,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.MoveMembers,
  ];

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      ...(verifiedRoleId ? {} : { allow: [PermissionFlagsBits.ViewChannel] }),
      deny: verifiedRoleId
        ? [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages]
        : [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
    },
    {
      id: client.user.id,
      allow: ROOM_PERMS,
    },
    {
      id: guild.ownerId,
      type: OverwriteType.Member,
      allow: staffVoicePerms,
    },
    ...staffRoles.map((r) => ({
      id: r.id,
      allow: staffVoicePerms,
    })),
  ];

  if (verifiedRoleId) {
    overwrites.push({
      id: verifiedRoleId,
      allow: [PermissionFlagsBits.ViewChannel],
      deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
    });
  }
  return overwrites;
}

function buildStageOverwrites(guild, verifiedRoleId) {
  const staffRoles = [...guild.roles.cache.values()]
    .filter(
      (r) =>
        !r.managed &&
        r.id !== guild.id &&
        (r.name.toLowerCase() === 'admin' ||
          r.name.toLowerCase() === 'moderator' ||
          r.permissions.has(PermissionFlagsBits.Administrator) ||
          r.permissions.has(PermissionFlagsBits.ManageGuild) ||
          r.permissions.has(PermissionFlagsBits.ManageMessages))
    )
    .slice(0, 20);

  const stageModPerms = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.Stream,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.MuteMembers,
    PermissionFlagsBits.MoveMembers,
  ];

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      ...(verifiedRoleId
        ? { deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak] }
        : {
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.RequestToSpeak],
            deny: [PermissionFlagsBits.Speak],
          }),
    },
    {
      id: client.user.id,
      allow: stageModPerms,
    },
    {
      id: guild.ownerId,
      type: OverwriteType.Member,
      allow: stageModPerms,
    },
    ...staffRoles.map((r) => ({
      id: r.id,
      allow: stageModPerms,
    })),
  ];

  if (verifiedRoleId) {
    overwrites.push({
      id: verifiedRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.RequestToSpeak],
      deny: [PermissionFlagsBits.Speak],
    });
  }
  return overwrites;
}

export function buildRoleButtonRows(roleItems, prefix = 'role_btn') {
  const capped = roleItems.slice(0, 25);
  const rows = [];
  for (let i = 0; i < capped.length; i += 5) {
    const row = new ActionRowBuilder();
    for (const item of capped.slice(i, i + 5)) {
      const btn = new ButtonBuilder()
        .setCustomId(`${prefix}:${item.id}`)
        .setLabel(item.name.slice(0, 45))
        .setStyle(ButtonStyle.Secondary);
      if (item.emoji) btn.setEmoji(item.emoji);
      row.addComponents(btn);
    }
    rows.push(row);
  }
  return rows;
}

export const MINIGAME_BOTS = [
  {
    slug: 'owo-game',
    botId: '408785106942164992',
    name: 'OwO Bot',
    color: 0xff9ff3,
    summary: 'Hunt animals, build your zoo, battle pets, and collect cowoncy with friends.',
    starter: 'Type `owo help`, `owo hunt`, `owo battle`, or `owo zoo` to start playing.',
  },
  {
    slug: 'mudae-gacha',
    botId: '432610292342587392',
    name: 'Mudae',
    color: 0xff6b81,
    summary: 'Roll and claim thousands of anime and video game characters with your community.',
    starter: 'Type `$wa`, `$ha`, `$wg`, or `$help` to roll characters.',
  },
  {
    slug: 'karuta-cards',
    botId: '646937666251915264',
    name: 'Karuta',
    color: 0xfeca57,
    summary: 'Drop, grab, upgrade, and trade collectible character cards.',
    starter: 'Type `k!drop`, `k!collection`, or `k!help` to start collecting.',
  },
  {
    slug: 'dank-memer',
    botId: '270904126974590976',
    name: 'Dank Memer',
    color: 0x2ecc71,
    summary: 'Play fishing, farming, adventures, heists, and coin minigames.',
    starter: 'Use `/fish`, `/dig`, `/hunt`, or `/balance` to start earning coins.',
  },
  {
    slug: 'poketwo',
    botId: '716390085896962058',
    name: 'Poketwo',
    color: 0x54a0ff,
    summary: 'Catch wild Pokemon as people chat, trade with friends, and battle.',
    starter: 'Mention `@Pokétwo starter` or `@Pokétwo help` to pick your starter Pokemon.',
  },
];

const MINIGAME_CHANNEL_PERMS = {
  ViewChannel: true,
  SendMessages: true,
  EmbedLinks: true,
  AttachFiles: true,
  AddReactions: true,
  UseExternalEmojis: true,
  ReadMessageHistory: true,
};

export function buildMinigameCardPayload(mg, guildId, installed = false) {
  const statusLine = installed
    ? `🟢 **${mg.name}** is active in this server!\n${mg.starter}`
    : `⚡ **Admin Quick Setup:** Click the button below to invite **${mg.name}** directly to this server. Once added, its channel permissions here unlock automatically!\n\n🎮 **How to Play:** ${mg.starter}`;

  const embed = new EmbedBuilder()
    .setColor(mg.color)
    .setTitle(`🕹️ ${mg.name} Arena`)
    .setDescription(`${mg.summary}\n\n${statusLine}`);

  if (installed) return { embeds: [embed] };

  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${mg.botId}&permissions=414464724032&scope=bot%20applications.commands&guild_id=${guildId}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel(`➕ Invite ${mg.name}`).setStyle(ButtonStyle.Link).setURL(inviteUrl)
  );
  return { embeds: [embed], components: [row] };
}

export const MUSIC_BOTS = [
  {
    slug: 'jockie-music',
    botId: '411916947773587456',
    name: 'Jockie Music',
    summary: 'Play songs and playlists from Spotify, SoundCloud, Apple Music, and more across voice rooms.',
    starter: 'Join any voice room and type `m!play` or `/play` with a song title or Spotify link.',
  },
  {
    slug: 'lofi-radio',
    botId: '830530156048285716',
    name: 'Lofi Radio',
    summary: 'Nonstop chill lofi hip-hop radio inside the Lofi voice channel.',
    starter: 'Join the Lofi voice channel and run `/play` to start nonstop lofi beats.',
  },
];

const MUSIC_VOICE_PERMS = {
  ViewChannel: true,
  Connect: true,
  Speak: true,
  UseVAD: true,
  SendMessages: true,
};

export function buildMusicPanelPayload(guildId, installedIds = new Set(), lofiChannelId = null) {
  const lofiRef = lofiChannelId ? `<#${lofiChannelId}>` : '`🎧 Lofi Radio`';
  const botLines = MUSIC_BOTS.map((mb) => {
    const active = installedIds.has(mb.botId);
    const badge = active ? '🟢 Active' : '⚪ Not invited yet';
    return `• **${mb.name}** — ${badge}\n  ${mb.summary}\n  ${mb.starter}`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle('🎵 Music Request & Lofi Radio')
    .setDescription(
      `Drop your song commands and Spotify links here, or tune in to ${lofiRef} anytime for nonstop chill beats.\n\n${botLines}`
    );

  const missing = MUSIC_BOTS.filter((mb) => !installedIds.has(mb.botId));
  if (!missing.length) return { embeds: [embed] };

  const row = new ActionRowBuilder().addComponents(
    missing.map((mb) =>
      new ButtonBuilder()
        .setLabel(`➕ Invite ${mb.name}`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=${mb.botId}&permissions=36785152&scope=bot%20applications.commands&guild_id=${guildId}`
        )
    )
  );
  return { embeds: [embed], components: [row] };
}

function buildLofiVoiceOverwrites(guild, verifiedRoleId, installedBotIds = []) {
  const speakerAllow = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.UseVAD,
    PermissionFlagsBits.SendMessages,
  ];

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      ...(verifiedRoleId
        ? { deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak] }
        : {
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            deny: [PermissionFlagsBits.Speak],
          }),
    },
    { id: client.user.id, allow: ROOM_PERMS },
    { id: guild.ownerId, type: OverwriteType.Member, allow: speakerAllow },
    ...getStaffRoles(guild)
      .filter((r) => r.id !== verifiedRoleId)
      .map((r) => ({ id: r.id, allow: speakerAllow })),
    ...installedBotIds.map((botId) => ({ id: botId, type: OverwriteType.Member, allow: speakerAllow })),
  ];

  if (verifiedRoleId) {
    overwrites.push({
      id: verifiedRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
      deny: [PermissionFlagsBits.Speak],
    });
  }
  return overwrites;
}

export const DEFAULT_MILESTONE = {
  enabled: true,
  every: 50,
  goals: [10, 25],
  channelId: null,
  roleId: null,
  highestReached: 0,
};

export function computeMilestoneProgress(count, rawCfg = {}) {
  const every = rawCfg.every ?? DEFAULT_MILESTONE.every;
  const goals = Array.isArray(rawCfg.goals) ? rawCfg.goals : DEFAULT_MILESTONE.goals;
  const highestReached = rawCfg.highestReached ?? 0;

  const isGoal = goals.includes(count) || (every > 0 && count >= every && count % every === 0);
  const reachedNow = Boolean(rawCfg.enabled ?? true) && count > 0 && isGoal && count > highestReached;

  const candidates = goals.filter((g) => g > count);
  if (every > 0) candidates.push((Math.floor(count / every) + 1) * every);
  const next = candidates.length ? Math.min(...candidates) : null;
  const remaining = next !== null ? next - count : null;

  return { reachedNow, next, remaining };
}

export function buildMilestoneCardPayload({ count, next, remaining, userId, avatarUrl, rewardRoleId }) {
  const file = new AttachmentBuilder(generateMilestoneBanner(count), { name: 'milestone.png' });
  const rewardLine = rewardRoleId ? `\n🏅 Special reward unlocked: <@&${rewardRoleId}>` : '';
  const nextLine = next !== null ? `\n🎯 Next milestone: **${next}** members — **${remaining}** to go.` : '';

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('🎉 Community Milestone Reached!')
    .setDescription(
      `Congratulations <@${userId}>! You brought our community to **${count}** members!${rewardLine}${nextLine}`
    )
    .setImage('attachment://milestone.png');

  if (avatarUrl) embed.setThumbnail(avatarUrl);

  return { content: `🎉 <@${userId}>`, embeds: [embed], files: [file] };
}

export function buildVerifyPanelMessage(roleId, minHours = 0, title = '🛡️ Account Verification') {
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(title)
    .setDescription(
      'Welcome! To keep this community safe from automated spam bots, please verify your account.\n\n' +
        'Click **Verify Account** below, read the 5-character security image, and enter the code to unlock all channels.'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`verify:start:${roleId}:${minHours}`)
      .setLabel('✅ Verify Account')
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

function buildCaptchaCard(pngBuffer, attemptsLeft, notice = '') {
  const file = new AttachmentBuilder(pngBuffer, { name: 'captcha.png' });
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🛡️ Security Image Check')
    .setDescription(
      `Read the 5 characters in the image below, then click **Enter Code**.\nAttempts remaining: **${attemptsLeft}** — code expires in 2 minutes.`
    )
    .setImage('attachment://captcha.png');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('verify:answer').setLabel('⌨️ Enter Code').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('verify:refresh').setLabel('🔄 New Image').setStyle(ButtonStyle.Secondary)
  );

  return { content: notice, embeds: [embed], attachments: [], files: [file], components: [row] };
}

async function ensureVerifiedRole(guild) {
  await guild.roles.fetch();
  let role = guild.roles.cache.find((r) => !r.managed && r.name.toLowerCase() === 'verified');
  if (!role) {
    role = await guild.roles
      .create({
        name: 'Verified',
        colors: { primaryColor: 0x57f287 },
        permissions: [],
      })
      .catch(() => null);
  }
  return role;
}

async function ensureMemberRole(guild) {
  await guild.roles.fetch();
  let role = guild.roles.cache.find((r) => !r.managed && r.name.toLowerCase() === 'member');
  if (!role) {
    role = await guild.roles
      .create({
        name: 'Member',
        colors: { primaryColor: 0x2ecc71 },
        permissions: [],
      })
      .catch(() => null);
  }
  return role;
}

function buildStatsOverwrites(guild) {
  const adminRoles = [...guild.roles.cache.values()]
    .filter(
      (r) =>
        !r.managed &&
        r.id !== guild.id &&
        (r.name.toLowerCase() === 'admin' ||
          r.permissions.has(PermissionFlagsBits.Administrator) ||
          r.permissions.has(PermissionFlagsBits.ManageGuild))
    )
    .slice(0, 20);

  return [
    {
      id: guild.roles.everyone.id,
      allow: [PermissionFlagsBits.ViewChannel],
      deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
    },
    {
      id: client.user.id,
      allow: STATS_ADMIN_PERMS,
    },
    {
      id: guild.ownerId,
      type: OverwriteType.Member,
      allow: STATS_ADMIN_PERMS,
    },
    ...adminRoles.map((r) => ({
      id: r.id,
      allow: STATS_ADMIN_PERMS,
    })),
  ];
}

async function disableCommunityOnboarding(guild) {
  if (!guild.features.includes('COMMUNITY')) return;
  const ob = await guild.fetchOnboarding().catch(() => null);
  if (!ob?.enabled) return;
  await guild
    .editOnboarding({
      enabled: false,
      prompts: [...ob.prompts.values()].map((p) => ({
        id: p.id,
        title: p.title,
        singleSelect: p.singleSelect,
        required: p.required,
        inOnboarding: p.inOnboarding,
        type: p.type,
        options: [...p.options.values()].map((o) => ({
          id: o.id,
          channels: [...o.channels.keys()],
          roles: [...o.roles.keys()],
          title: o.title,
          description: o.description,
          emoji: o.emoji,
        })),
      })),
      defaultChannels: [...ob.defaultChannels.keys()],
      mode: ob.mode,
    })
    .catch(() => {});
}

async function rebindCommunitySystemChannels(guild, targetChannelId) {
  if (!guild.features.includes('COMMUNITY') || !targetChannelId) return;
  const targetCh = guild.channels.cache.get(targetChannelId);
  if (
    targetCh &&
    (targetCh.type === ChannelType.GuildText || targetCh.type === ChannelType.GuildAnnouncement)
  ) {
    const everyoneOw = targetCh.permissionOverwrites?.cache?.get(guild.roles.everyone.id);
    if (everyoneOw?.deny?.has(PermissionFlagsBits.ViewChannel)) {
      await targetCh.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: true }).catch(() => {});
    }
    await guild
      .edit({
        rulesChannel: targetCh.id,
        publicUpdatesChannel: targetCh.id,
        safetyAlertsChannel: null,
      })
      .catch(() => {});
  }
}

async function channelHasBotMessage(ch) {
  const msgs = await ch.messages?.fetch({ limit: 10 }).catch(() => null);
  return Boolean(msgs?.some((m) => m.author?.id === client.user.id));
}

async function ensureCategory(guild, rawName, overwrites, ctx, preferredId = null) {
  const formattedName = formatCategoryHeader(rawName);
  let cat = findMatchingCategory(guild.channels.cache.values(), rawName, {
    usedIds: ctx.usedIds,
    excludeIds: ctx.excludeIds,
    preferredId,
  });

  const pos = ctx.nextCategoryPos++;
  if (cat) {
    await cat
      .edit({
        name: formattedName,
        ...(overwrites ? { permissionOverwrites: overwrites } : {}),
      })
      .catch(() => {});
  } else {
    cat = await guild.channels.create({
      name: formattedName,
      type: ChannelType.GuildCategory,
      position: pos,
      permissionOverwrites: overwrites,
    });
  }

  ctx.usedIds.add(cat.id);
  ctx.categoryOrder.push({ channel: cat.id, position: pos });
  return cat;
}

async function ensureChannel(
  guild,
  { name, kind, channelType, parentId = null, overwrites, preferredId = null, customMatcher = null },
  ctx
) {
  let ch = customMatcher
    ? [...guild.channels.cache.values()].find(
        (c) =>
          c &&
          c.type === channelType &&
          !ctx.usedIds.has(c.id) &&
          !ctx.excludeIds.has(c.id) &&
          (c.id === preferredId || customMatcher(c))
      ) ?? null
    : findMatchingChannel(
        guild.channels.cache.values(),
        { name, kind, parentId, preferredId },
        { usedIds: ctx.usedIds, excludeIds: ctx.excludeIds }
      );

  const reused = Boolean(ch);
  const parentKey = parentId ?? '__root__';
  const nextPos = ctx.childCounters.get(parentKey) ?? 0;

  if (ch) {
    await ch
      .edit({
        name,
        parent: parentId,
        lockPermissions: !overwrites && Boolean(parentId),
        ...(overwrites ? { permissionOverwrites: overwrites } : {}),
      })
      .catch(() => {});
    if (ctx.replace && ch.isTextBased?.()) {
      await ch.bulkDelete(50, true).catch(() => {});
    }
  } else {
    ch = await guild.channels
      .create({
        name,
        type: channelType,
        parent: parentId,
        position: nextPos,
        permissionOverwrites: overwrites,
      })
      .catch(() => null);
  }

  if (ch) {
    ctx.childCounters.set(parentKey, nextPos + 1);
    ctx.usedIds.add(ch.id);
    ctx.channelOrder.push({
      channel: ch.id,
      position: nextPos,
      ...(parentId ? { parent: parentId, lockPermissions: !overwrites } : {}),
    });
  }

  return { channel: ch, reused };
}

async function createFixedSections(guild, verifiedRole, memberRole = null, roleDefs = [], ctx) {
  const existing = state.guilds[guild.id] ?? {};
  const nextCfg = {
    ...existing,
    verifiedRoleId: verifiedRole?.id ?? existing.verifiedRoleId ?? null,
    memberRoleId: memberRole?.id ?? existing.memberRoleId ?? null,
    milestone: existing.milestone ?? {
      ...DEFAULT_MILESTONE,
      highestReached: guild.memberCount ?? 0,
    },
  };

  const statsOverwrites = buildStatsOverwrites(guild);
  const { dateName, presenceName, usersName } = computeStatsStrings(guild);
  const statsCat = await ensureCategory(guild, 'SERVER STATS', statsOverwrites, ctx, existing.statsCategoryId);

  const { channel: dateCh } = await ensureChannel(
    guild,
    {
      name: dateName,
      kind: 'voice',
      channelType: ChannelType.GuildVoice,
      parentId: statsCat.id,
      overwrites: statsOverwrites,
      preferredId: existing.dateId,
      customMatcher: (c) => /^📅\s/u.test(c.name),
    },
    ctx
  );
  const { channel: presenceCh } = await ensureChannel(
    guild,
    {
      name: presenceName,
      kind: 'voice',
      channelType: ChannelType.GuildVoice,
      parentId: statsCat.id,
      overwrites: statsOverwrites,
      preferredId: existing.presenceId,
      customMatcher: (c) => /^🟢\s*\d+/u.test(c.name),
    },
    ctx
  );
  const { channel: usersCh } = await ensureChannel(
    guild,
    {
      name: usersName,
      kind: 'voice',
      channelType: ChannelType.GuildVoice,
      parentId: statsCat.id,
      overwrites: statsOverwrites,
      preferredId: existing.usersId,
      customMatcher: (c) => /^users:\s*\d+/i.test(c.name),
    },
    ctx
  );

  nextCfg.statsCategoryId = statsCat.id;
  if (dateCh) nextCfg.dateId = dateCh.id;
  if (presenceCh) nextCfg.presenceId = presenceCh.id;
  if (usersCh) nextCfg.usersId = usersCh.id;
  lastStatsSync.set(guild.id, Date.now());

  const publicRo = buildReadOnlyOverwrites(guild, null);
  const verifiedRo = buildReadOnlyOverwrites(guild, verifiedRole?.id ?? null);
  const gatewayCat = await ensureCategory(guild, 'GATEWAY', publicRo, ctx, existing.gatewayCategoryId);

  const { channel: welcomeCh } = await ensureChannel(
    guild,
    {
      name: '🛬・welcome',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: gatewayCat.id,
      overwrites: publicRo,
      preferredId: existing.welcomeId,
    },
    ctx
  );
  const { channel: rulesCh, reused: rulesReused } = await ensureChannel(
    guild,
    {
      name: '📜・rules',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: gatewayCat.id,
      overwrites: publicRo,
      preferredId: existing.rulesId ?? (ctx.replace ? guild.rulesChannelId : null),
    },
    ctx
  );
  const { channel: verifyCh, reused: verifyReused } = await ensureChannel(
    guild,
    {
      name: '✅・verify',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: gatewayCat.id,
      overwrites: publicRo,
      preferredId: existing.verifyId,
    },
    ctx
  );
  const { channel: rolesPickCh, reused: rolesPickReused } = await ensureChannel(
    guild,
    {
      name: '📍・roles-pick',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: gatewayCat.id,
      overwrites: verifiedRo,
      preferredId: existing.rolesPickId,
    },
    ctx
  );
  const { channel: boosterLogsCh } = await ensureChannel(
    guild,
    {
      name: '🚀・booster-logs',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: gatewayCat.id,
      overwrites: verifiedRo,
      preferredId: existing.boosterLogsId,
    },
    ctx
  );
  const { channel: inviteLogsCh } = await ensureChannel(
    guild,
    {
      name: '📥・invite-logs',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: gatewayCat.id,
      overwrites: verifiedRo,
      preferredId: existing.inviteLogsId,
    },
    ctx
  );
  const { channel: goodbyeCh } = await ensureChannel(
    guild,
    {
      name: '👋🏻・goodbye',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: gatewayCat.id,
      overwrites: publicRo,
      preferredId: existing.goodbyeId,
    },
    ctx
  );

  if (rulesCh) {
    await rebindCommunitySystemChannels(guild, rulesCh.id);
    if (!rulesReused || ctx.replace || !(await channelHasBotMessage(rulesCh))) {
      const rulesEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📜 Server Rules')
        .setDescription(
          'Welcome to our community! Please follow these guidelines to keep the server safe and enjoyable for everyone:\n\n' +
            '1. **Be Respectful** — Treat every member kindly. Harassment, hate speech, and personal attacks are not tolerated.\n' +
            '2. **Keep Chats Clean** — Avoid spamming, flooding messages, or sharing harmful links.\n' +
            '3. **Use Matching Channels** — Keep discussions, media, and bot commands in their dedicated channels.\n' +
            '4. **Safe Content Only** — NSFW, illegal, or unsafe material will be removed immediately.\n' +
            '5. **Follow Staff Guidance** — Respect instructions from Admins and Moderators at all times.'
        );
      await rulesCh.send({ embeds: [rulesEmbed] }).catch(() => {});
    }
  }

  if (verifiedRole && verifyCh && (!verifyReused || ctx.replace || !(await channelHasBotMessage(verifyCh)))) {
    await verifyCh.send(buildVerifyPanelMessage(verifiedRole.id, 0)).catch(() => {});
  }

  if (rolesPickCh) {
    const recentMsgs =
      rolesPickReused && !ctx.replace ? await rolesPickCh.messages?.fetch({ limit: 10 }).catch(() => null) : null;
    const hasGenderPanel = Boolean(
      recentMsgs?.some(
        (m) =>
          m.author?.id === client.user?.id &&
          m.components?.some((r) => r.components?.some((c) => c.customId?.startsWith('role_one:')))
      )
    );

    if (!rolesPickReused || ctx.replace || !hasGenderPanel) {
      if (recentMsgs) {
        for (const m of recentMsgs.values()) {
          if (m.author?.id === client.user?.id) await m.delete().catch(() => {});
        }
      }

      const me = await guild.members.fetchMe();
      const genderNames = new Set(GENDER_ROLES.map((g) => g.name.toLowerCase()));
      const genderPickable = [];
      for (const gDef of GENDER_ROLES) {
        const r = guild.roles.cache.find((role) => !role.managed && role.name.toLowerCase() === gDef.name.toLowerCase());
        if (r && !r.permissions.any(DANGEROUS_PERMS) && r.position < me.roles.highest.position) {
          genderPickable.push({ id: r.id, name: r.name, emoji: gDef.emoji });
        }
      }

      if (genderPickable.length) {
        await rolesPickCh
          .send({
            content:
              '### 👤 Choose Your Gender\nClick a button below to set your gender role. Choosing another option switches it automatically, or click the same button again to remove it.',
            components: buildRoleButtonRows(genderPickable, 'role_one'),
          })
          .catch(() => {});
      }

      const explicitDefs = roleDefs.filter(
        (d) =>
          !d.admin &&
          !d.mod &&
          !d.auto &&
          !d.gender &&
          !genderNames.has(d.name.toLowerCase()) &&
          !['verified', 'member'].includes(d.name.toLowerCase())
      );

      let pickable = [];
      if (explicitDefs.length) {
        for (const def of explicitDefs) {
          const r = guild.roles.cache.find((role) => !role.managed && role.name.toLowerCase() === def.name.toLowerCase());
          if (r && !r.permissions.any(DANGEROUS_PERMS) && r.position < me.roles.highest.position) {
            pickable.push({ id: r.id, name: r.name, emoji: def.emoji });
          }
        }
      } else {
        pickable = [...guild.roles.cache.values()]
          .filter(
            (r) =>
              !r.managed &&
              r.id !== guild.id &&
              r.id !== verifiedRole?.id &&
              r.id !== memberRole?.id &&
              !genderNames.has(r.name.toLowerCase()) &&
              !['verified', 'member'].includes(r.name.toLowerCase()) &&
              !r.permissions.any(DANGEROUS_PERMS) &&
              r.position < me.roles.highest.position
          )
          .slice(0, 25)
          .map((r) => ({ id: r.id, name: r.name }));
      }

      if (pickable.length) {
        await rolesPickCh
          .send({
            content:
              '### 🎮 Pick Your Roles\nClick any button below to add a role to your profile. Click the same button again anytime to remove it.',
            components: buildRoleButtonRows(pickable),
          })
          .catch(() => {});
      } else if (!genderPickable.length) {
        await rolesPickCh
          .send('🎭 Admins can add self-assignable role buttons here anytime with `/role-panel`.')
          .catch(() => {});
      }
    }
  }

  nextCfg.gatewayCategoryId = gatewayCat.id;
  if (inviteLogsCh) nextCfg.inviteLogsId = inviteLogsCh.id;
  if (welcomeCh) nextCfg.welcomeId = welcomeCh.id;
  if (rulesCh) nextCfg.rulesId = rulesCh.id;
  if (verifyCh) nextCfg.verifyId = verifyCh.id;
  if (boosterLogsCh) nextCfg.boosterLogsId = boosterLogsCh.id;
  if (rolesPickCh) nextCfg.rolesPickId = rolesPickCh.id;
  if (goodbyeCh) nextCfg.goodbyeId = goodbyeCh.id;

  state.guilds[guild.id] = nextCfg;
  saveState();
}

async function createMusicSection(guild, verifiedRole, ctx) {
  const existing = state.guilds[guild.id] ?? {};
  const gatedOverwrites = buildGatedCategoryOverwrites(guild, verifiedRole?.id);
  const musicCat = await ensureCategory(guild, 'MUSIC AREA', gatedOverwrites, ctx, existing.musicCategoryId);

  const installedIds = new Set();
  for (const mb of MUSIC_BOTS) {
    const m = guild.members.cache.get(mb.botId) ?? (await guild.members.fetch(mb.botId).catch(() => null));
    if (m) installedIds.add(mb.botId);
  }

  const { channel: discussCh, reused: discussReused } = await ensureChannel(
    guild,
    {
      name: '🎶・music-discussion',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: musicCat.id,
      preferredId: existing.musicDiscussionId,
    },
    ctx
  );

  const { channel: requestCh, reused: requestReused } = await ensureChannel(
    guild,
    {
      name: '🎵・music-request',
      kind: 'text',
      channelType: ChannelType.GuildText,
      parentId: musicCat.id,
      preferredId: existing.musicRequestId,
    },
    ctx
  );

  const { channel: lofiCh } = await ensureChannel(
    guild,
    {
      name: '🎧 Lofi Radio',
      kind: 'voice',
      channelType: ChannelType.GuildVoice,
      parentId: musicCat.id,
      overwrites: buildLofiVoiceOverwrites(guild, verifiedRole?.id, [...installedIds]),
      preferredId: existing.musicLofiId,
      customMatcher: (c) => /^🎧\s*lofi radio/i.test(c.name),
    },
    ctx
  );

  if (discussCh && (!discussReused || ctx.replace || !(await channelHasBotMessage(discussCh)))) {
    await discussCh
      .send('🎶 **Music Discussion** — Share your favorite songs, playlists, artists, and music recommendations here!')
      .catch(() => {});
  }

  if (requestCh) {
    for (const botId of installedIds) {
      await requestCh.permissionOverwrites.edit(botId, MINIGAME_CHANNEL_PERMS).catch(() => {});
    }
    const recentReqMsgs =
      requestReused && !ctx.replace ? await requestCh.messages?.fetch({ limit: 10 }).catch(() => null) : null;
    const stalePanel = recentReqMsgs?.find(
      (m) => m.author?.id === client.user?.id && m.embeds?.[0]?.description?.includes('FlaviBot')
    );
    if (stalePanel) await stalePanel.delete().catch(() => {});
    const hasMusicMsg = Boolean(recentReqMsgs?.some((m) => m.author?.id === client.user?.id && m.id !== stalePanel?.id));
    if (!requestReused || ctx.replace || Boolean(stalePanel) || !hasMusicMsg) {
      await requestCh.send(buildMusicPanelPayload(guild.id, installedIds, lofiCh?.id)).catch(() => {});
    }
  }

  const cfg = (state.guilds[guild.id] ??= {});
  cfg.musicCategoryId = musicCat.id;
  if (discussCh) cfg.musicDiscussionId = discussCh.id;
  if (requestCh) cfg.musicRequestId = requestCh.id;
  if (lofiCh) cfg.musicLofiId = lofiCh.id;
  saveState();
}

async function wipeGuildChannels(guild, keepChannelId = null) {
  await guild.channels.fetch();
  await disableCommunityOnboarding(guild);
  if (keepChannelId) {
    await rebindCommunitySystemChannels(guild, keepChannelId);
  }

  const channels = await guild.channels.fetch();
  const sorted = [...channels.values()]
    .filter((ch) => ch && ch.id !== keepChannelId)
    .sort((a, b) => Number(a.type === ChannelType.GuildCategory) - Number(b.type === ChannelType.GuildCategory));

  for (const ch of sorted) {
    delete state.hubs[ch.id];
    delete state.temp[ch.id];
    delete state.waiting[ch.id];
    await ch.delete('Clear server channels').catch(() => {});
  }
  for (const [mainId, waitId] of Object.entries(state.waiting)) {
    if (!guild.channels.cache.has(mainId) || !guild.channels.cache.has(waitId)) {
      delete state.waiting[mainId];
    }
  }
  delete state.guilds[guild.id];
  saveState();
}

async function executeClearChannels(guild, originChannelId, keepFreshGeneral) {
  if (keepFreshGeneral) {
    const fresh = await guild.channels.create({
      name: 'general',
      type: ChannelType.GuildText,
    });
    await wipeGuildChannels(guild, fresh.id);
    await fresh
      .send('🧹 **All old channels have been cleared!** Run `/setup` whenever you are ready to build a new server layout.')
      .catch(() => {});
    return;
  }

  if (guild.features.includes('COMMUNITY')) {
    await disableCommunityOnboarding(guild);
    await guild
      .edit({
        features: guild.features.filter((f) => f !== 'COMMUNITY'),
        rulesChannel: null,
        publicUpdatesChannel: null,
        safetyAlertsChannel: null,
      })
      .catch(() => {});
  }

  await wipeGuildChannels(guild, originChannelId);
  if (originChannelId) {
    delete state.hubs[originChannelId];
    delete state.temp[originChannelId];
    saveState();
    const oldOrigin = guild.channels.cache.get(originChannelId);
    if (oldOrigin) await oldOrigin.delete('Clear server channels finished').catch(() => {});
  }
}

async function executeSetup(guild, { userId, label, groups, roles, replace, isCustom, includeMusic }, originChannelId) {
  if (replace) {
    await wipeGuildChannels(guild, originChannelId);
  } else {
    await guild.channels.fetch();
    await disableCommunityOnboarding(guild);
  }

  await guild.roles.fetch();
  const roleDefs = [{ name: 'Admin', color: 0xe74c3c, admin: true }, ...GENDER_ROLES, ...(roles ?? [])];

  for (const roleDef of roleDefs) {
    const exists = guild.roles.cache.some((r) => r.name.toLowerCase() === roleDef.name.toLowerCase());
    if (!exists) {
      let perms = [];
      if (roleDef.admin) {
        perms = [PermissionFlagsBits.Administrator];
      } else if (roleDef.mod) {
        perms = [
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.KickMembers,
          PermissionFlagsBits.MuteMembers,
          PermissionFlagsBits.MoveMembers,
        ];
      }
      await guild.roles
        .create({
          name: roleDef.name,
          colors: { primaryColor: roleDef.color ?? 0x5865f2 },
          permissions: perms,
        })
        .catch(() => {});
    }
  }

  const excludeIds = new Set([...Object.keys(state.temp), ...Object.values(state.waiting)]);
  if (replace && originChannelId) excludeIds.add(originChannelId);

  const ctx = {
    replace: Boolean(replace),
    usedIds: new Set(),
    excludeIds,
    nextCategoryPos: 0,
    childCounters: new Map(),
    categoryOrder: [],
    channelOrder: [],
  };

  const memberRole = await ensureMemberRole(guild);
  const verifiedRole = await ensureVerifiedRole(guild);
  await createFixedSections(guild, verifiedRole, memberRole, roleDefs, ctx);

  const me = await guild.members.fetchMe();
  if (memberRole && memberRole.position < me.roles.highest.position) {
    for (const m of guild.members.cache.values()) {
      if (!m.user.bot && !m.roles.cache.has(memberRole.id)) {
        await m.roles.add(memberRole.id).catch(() => {});
      }
    }
  }
  if (verifiedRole && verifiedRole.position < me.roles.highest.position) {
    for (const targetId of new Set([guild.ownerId, userId].filter(Boolean))) {
      const m = guild.members.cache.get(targetId) ?? (await guild.members.fetch(targetId).catch(() => null));
      if (m && !m.user.bot && !m.roles.cache.has(verifiedRole.id)) {
        await m.roles.add(verifiedRole.id).catch(() => {});
      }
    }
  }

  let firstChatText = null;
  let fallbackText = null;
  const createdJtcNames = [];
  const gatedOverwrites = buildGatedCategoryOverwrites(guild, verifiedRole?.id);
  const shouldCreateMusic = !isCustom || Boolean(includeMusic);

  let musicInsertIdx = groups.length;
  while (
    musicInsertIdx > 0 &&
    (groups[musicInsertIdx - 1].channels.every((c) => c.type !== 'text') ||
      /^voice\b/i.test(groups[musicInsertIdx - 1].category ?? ''))
  ) {
    musicInsertIdx--;
  }

  for (let gi = 0; gi < groups.length; gi++) {
    if (gi === musicInsertIdx && shouldCreateMusic) {
      await createMusicSection(guild, verifiedRole, ctx);
    }
    const group = groups[gi];
    let parentId = null;
    if (group.category) {
      const cat = await ensureCategory(guild, group.category, gatedOverwrites, ctx);
      parentId = cat.id;
    }

    for (const item of group.channels) {
      const resolvedName = item.name.replace(/\{server\}/gi, guild.name).slice(0, 100);
      if (item.type === 'text') {
        const overwrites = item.readOnly
          ? buildReadOnlyOverwrites(guild, verifiedRole?.id)
          : parentId
            ? undefined
            : gatedOverwrites;
        const { channel: ch, reused } = await ensureChannel(
          guild,
          {
            name: resolvedName,
            kind: 'text',
            channelType: ChannelType.GuildText,
            parentId,
            overwrites,
          },
          ctx
        );
        if (!ch) continue;
        fallbackText ??= ch;
        if (!item.readOnly) firstChatText ??= ch;

        const lowerName = resolvedName.toLowerCase();
        const shouldSeed = !reused || ctx.replace || !(await channelHasBotMessage(ch));
        if (lowerName.includes('voice-settings')) {
          await sendFreshVoicePanel(ch).catch(() => {});
        } else if (lowerName.includes('voice-guide') && shouldSeed) {
          const guideEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('📜 How Personal Voice Rooms Work')
            .setDescription(
              '1. **Create Your Room** — Join `➕ Create Casual`, `➕ Create Competitive`, or `➕ Create Party` to instantly get your own temporary voice room.\n' +
                '2. **Room Setup** — Use **Name**, **Limit**, **Privacy**, **Waiting**, **Chat**, or **Region** in `🎤・voice-settings`.\n' +
                '3. **Member Access** — Use **Trust**, **Untrust**, **Invite**, **Kick**, **Block**, or **Unblock** to control who can join and speak.\n' +
                '4. **Ownership & Cleanup** — Use **Claim** if the creator left, **Transfer** to pass ownership, or **Delete** to close the room immediately.'
            );
          await ch.send({ embeds: [guideEmbed] }).catch(() => {});
        }

        const mg = MINIGAME_BOTS.find((b) => lowerName.includes(b.slug));
        if (mg) {
          const guildCfg = (state.guilds[guild.id] ??= {});
          guildCfg.minigameChannels ??= {};
          guildCfg.minigameChannels[mg.botId] = ch.id;
          const botMember =
            guild.members.cache.get(mg.botId) ?? (await guild.members.fetch(mg.botId).catch(() => null));
          if (botMember) {
            await ch.permissionOverwrites.edit(mg.botId, MINIGAME_CHANNEL_PERMS).catch(() => {});
          }
          if (shouldSeed) {
            await ch.send(buildMinigameCardPayload(mg, guild.id, Boolean(botMember))).catch(() => {});
          }
        }
      } else if (item.type === 'stage') {
        if (!guild.features.includes('COMMUNITY')) {
          const rulesTarget = state.guilds[guild.id]?.rulesId ?? null;
          if (rulesTarget) {
            await guild
              .edit({
                features: [...new Set([...guild.features, 'COMMUNITY'])],
                verificationLevel: Math.max(guild.verificationLevel ?? 0, 1),
                explicitContentFilter: 2,
                rulesChannel: rulesTarget,
                publicUpdatesChannel: rulesTarget,
              })
              .catch(() => {});
            await disableCommunityOnboarding(guild);
          }
        }

        const { channel: stageCh } = await ensureChannel(
          guild,
          {
            name: resolvedName,
            kind: 'stage',
            channelType: ChannelType.GuildStageVoice,
            parentId,
            overwrites: buildStageOverwrites(guild, verifiedRole?.id),
          },
          ctx
        );

        if (!stageCh) {
          await ensureChannel(
            guild,
            {
              name: resolvedName,
              kind: 'voice',
              channelType: ChannelType.GuildVoice,
              parentId,
              overwrites: buildAdminVoiceOverwrites(guild, verifiedRole?.id),
            },
            ctx
          );
        }
      } else {
        const voiceOverwrites =
          item.type === 'adminvoice'
            ? buildAdminVoiceOverwrites(guild, verifiedRole?.id)
            : parentId
              ? undefined
              : gatedOverwrites;
        const { channel: ch } = await ensureChannel(
          guild,
          {
            name: resolvedName,
            kind: 'voice',
            channelType: ChannelType.GuildVoice,
            parentId,
            overwrites: voiceOverwrites,
          },
          ctx
        );
        if (!ch) continue;
        if (item.type === 'jtc') {
          state.hubs[ch.id] = guild.id;
          createdJtcNames.push(ch.name);
        } else {
          delete state.hubs[ch.id];
          if (item.type === 'voice' && /\bafk\b/i.test(resolvedName)) {
            await guild.setAFKChannel(ch).catch(() => {});
          }
        }
      }
    }
  }

  if (musicInsertIdx === groups.length && shouldCreateMusic) {
    await createMusicSection(guild, verifiedRole, ctx);
  }

  if (ctx.categoryOrder.length) {
    await guild.channels.setPositions(ctx.categoryOrder).catch(() => {});
  }
  if (ctx.channelOrder.length) {
    await guild.channels.setPositions(ctx.channelOrder).catch(() => {});
  }

  saveState();
  await cacheGuildInvites(guild);

  const announceTarget = firstChatText ?? fallbackText;
  if (announceTarget) {
    const jtcList = createdJtcNames.map((n) => `\`${n}\``).join(', ');
    const jtcInfo = createdJtcNames.length
      ? `\n🔊 **Automatic Voice Rooms active in:** ${jtcList}\nClick that voice channel anytime to get your own room with easy control buttons.`
      : '';
    const communityTip = guild.features.includes('COMMUNITY')
      ? '\n💡 **Seeing Suggested or hidden channels?** Right-click the server icon at the top left and enable **Show All Channels**.'
      : '';
    await announceTarget
      .send(
        `✅ **Your server is ready with the ${label} layout!**\n📊 **Server Stats**, **Gateway**, **CAPTCHA Verification**, and **Music Area** are live automatically. Assign the **Admin** role to trusted admins for full access.${jtcInfo}${communityTip}\n📖 Type \`/help\` anytime to view the full guide.`
      )
      .catch(() => {});
  }

  if (replace && originChannelId && !ctx.usedIds.has(originChannelId)) {
    const oldOrigin = guild.channels.cache.get(originChannelId);
    if (oldOrigin) await oldOrigin.delete('Template reset finished').catch(() => {});
  }
}

async function promptOrRunSetup(interaction, job) {
  const me = await interaction.guild.members.fetchMe();
  if (!me.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles])) {
    const errorPayload = {
      content:
        '❌ Please give this bot the Manage Channels, Manage Roles, and Move Members permissions in Server Settings first.',
      flags: MessageFlags.Ephemeral,
    };
    return interaction.reply(errorPayload);
  }

  if (job.replace) {
    const id = randomUUID();
    pendingSetups.set(id, job);
    setTimeout(() => pendingSetups.delete(id), CONFIRMATION_TTL_MS).unref();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`confirm_setup:${id}`).setLabel('Yes, Delete Old and Build').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`cancel_setup:${id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    const payload = {
      content: `⚠️ **Are you sure?** This will delete all current channels in this server and replace them with the **${job.label}** layout.`,
      embeds: [],
      components: [row],
      flags: MessageFlags.Ephemeral,
    };
    return interaction.isButton() ? interaction.update(payload) : interaction.reply(payload);
  }

  if (interaction.isButton()) {
    await interaction.deferUpdate();
  } else {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }
  await executeSetup(interaction.guild, job, interaction.channelId);
  return interaction.editReply({
    content: `✅ Done! The **${job.label}** layout is ready, and any matching channels were moved into their proper positions.`,
    embeds: [],
    components: [],
  });
}

function getAudienceRoleId(guild) {
  const vId = state.guilds[guild.id]?.verifiedRoleId;
  return vId && guild.roles.cache.has(vId) ? vId : guild.roles.everyone.id;
}

async function applyVoicePrivacy(voiceCh, mode) {
  const guild = voiceCh.guild;
  const everyoneId = guild.roles.everyone.id;
  const audienceId = getAudienceRoleId(guild);
  const isGated = audienceId !== everyoneId;

  if (mode === 'open') {
    if (isGated) await voiceCh.permissionOverwrites.edit(everyoneId, { ViewChannel: false, Connect: null, Speak: null });
    await voiceCh.permissionOverwrites.edit(audienceId, { ViewChannel: true, Connect: true, Speak: true });
  } else if (mode === 'locked') {
    await voiceCh.permissionOverwrites.edit(everyoneId, { ...(isGated ? { ViewChannel: false } : {}), Connect: false });
    if (isGated) await voiceCh.permissionOverwrites.edit(audienceId, { ViewChannel: true, Connect: false });
  } else if (mode === 'invisible') {
    await voiceCh.permissionOverwrites.edit(everyoneId, { ViewChannel: false, Connect: false });
    if (isGated) await voiceCh.permissionOverwrites.edit(audienceId, { ViewChannel: false, Connect: false });
  } else if (mode === 'muted') {
    if (isGated) await voiceCh.permissionOverwrites.edit(everyoneId, { ViewChannel: false });
    await voiceCh.permissionOverwrites.edit(audienceId, { ViewChannel: true, Connect: true, Speak: false });
  }
}

async function cleanupVoiceRoom(mainChId) {
  const waitId = state.waiting[mainChId];
  delete state.waiting[mainChId];
  delete state.temp[mainChId];
  saveState();
  if (waitId) {
    const waitCh = client.channels.cache.get(waitId) ?? (await client.channels.fetch(waitId).catch(() => null));
    if (waitCh) await waitCh.delete('Paired temporary voice room closed').catch(() => {});
  }
}

const OWNER_OVERWRITES = {
  ViewChannel: true,
  Connect: true,
  Speak: true,
  SendMessages: true,
  ManageChannels: true,
  MoveMembers: true,
};

async function resolveManagedVoice(interaction, action, explicitChannelId) {
  const voiceCh = explicitChannelId
    ? interaction.guild.channels.cache.get(explicitChannelId)
    : state.temp[interaction.channelId]
      ? interaction.channel
      : interaction.member.voice.channel;

  const ownerId = voiceCh ? state.temp[voiceCh.id] : null;
  if (!voiceCh || !ownerId) {
    await interaction.reply({
      content: '❌ Join your personal voice room first before using voice controls.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  if (action === 'claim') {
    if (interaction.member.voice.channelId !== voiceCh.id) {
      await interaction.reply({
        content: '❌ Join that voice room first so you can claim ownership.',
        flags: MessageFlags.Ephemeral,
      });
      return null;
    }
    if (voiceCh.members.has(ownerId)) {
      await interaction.reply({
        content: `❌ <@${ownerId}> is still inside this voice room.`,
        flags: MessageFlags.Ephemeral,
      });
      return null;
    }
    state.temp[voiceCh.id] = interaction.user.id;
    saveState();
    await voiceCh.permissionOverwrites.edit(interaction.user.id, OWNER_OVERWRITES);
    const waitId = state.waiting[voiceCh.id];
    const waitCh = waitId ? interaction.guild.channels.cache.get(waitId) : null;
    if (waitCh) await waitCh.permissionOverwrites.edit(interaction.user.id, OWNER_OVERWRITES).catch(() => {});
    await interaction.reply({
      content: `👑 You are now the owner of <#${voiceCh.id}>!`,
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  const isAdmin = interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
  if (ownerId !== interaction.user.id && !isAdmin) {
    await interaction.reply({
      content: `❌ Only the room owner <@${ownerId}> can change these settings.`,
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  return voiceCh;
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🤖 Logged in as ${readyClient.user.tag}`);
  await syncVoiceApplicationEmojis(readyClient);

  for (const guild of readyClient.guilds.cache.values()) {
    await guild.commands.set(COMMANDS).catch((e) => console.error(`Failed to register commands in ${guild.name}:`, e.message));
    await cacheGuildInvites(guild);
    if (state.guilds[guild.id]) {
      await syncGuildStats(guild);
    }
  }

  let dirty = false;
  for (const chId of Object.keys(state.temp)) {
    const ch = await readyClient.channels.fetch(chId).catch(() => null);
    if (!ch || ch.members.size === 0) {
      if (ch) await ch.delete('Empty temporary voice cleanup').catch(() => {});
      const waitId = state.waiting[chId];
      if (waitId) {
        const waitCh = await readyClient.channels.fetch(waitId).catch(() => null);
        if (waitCh) await waitCh.delete('Paired waiting room cleanup').catch(() => {});
        delete state.waiting[chId];
      }
      delete state.temp[chId];
      dirty = true;
    }
  }
  for (const [mainId, waitId] of Object.entries(state.waiting)) {
    const waitCh = await readyClient.channels.fetch(waitId).catch(() => null);
    if (!state.temp[mainId] || !waitCh) {
      if (waitCh) await waitCh.delete('Orphan waiting room cleanup').catch(() => {});
      delete state.waiting[mainId];
      dirty = true;
    }
  }
  for (const chId of Object.keys(state.hubs)) {
    const ch = await readyClient.channels.fetch(chId).catch(() => null);
    if (!ch) {
      delete state.hubs[chId];
      dirty = true;
    }
  }
  if (dirty) saveState();

  setInterval(async () => {
    for (const guildId of Object.keys(state.guilds)) {
      const guild = readyClient.guilds.cache.get(guildId);
      if (guild) await syncGuildStats(guild);
    }
  }, 6 * 60_000).unref();

  console.log(`✅ Ready in ${readyClient.guilds.cache.size} servers.`);
});

client.on(Events.GuildCreate, async (guild) => {
  await guild.commands.set(COMMANDS).catch(() => {});
  await cacheGuildInvites(guild);
});

client.on(Events.InviteCreate, (invite) => {
  if (!invite.guild) return;
  let map = guildInvites.get(invite.guild.id);
  if (!map) {
    map = new Map();
    guildInvites.set(invite.guild.id, map);
  }
  map.set(invite.code, { uses: invite.uses ?? 0, inviterId: invite.inviter?.id ?? null });
});

client.on(Events.InviteDelete, (invite) => {
  if (!invite.guild) return;
  guildInvites.get(invite.guild.id)?.delete(invite.code);
});

client.on(Events.GuildMemberAdd, async (member) => {
  const cfg = state.guilds[member.guild.id];
  if (!cfg) return;
  scheduleStatsSync(member.guild);

  if (member.user.bot) {
    const mg = MINIGAME_BOTS.find((b) => b.botId === member.id);
    const mgChId = mg ? cfg.minigameChannels?.[member.id] : null;
    if (mg && mgChId) {
      if (cfg.verifiedRoleId && member.guild.roles.cache.has(cfg.verifiedRoleId)) {
        await member.roles.add(cfg.verifiedRoleId).catch(() => {});
      }
      const mgCh = member.guild.channels.cache.get(mgChId);
      if (mgCh) {
        await mgCh.permissionOverwrites.edit(member.id, MINIGAME_CHANNEL_PERMS).catch(() => {});
        await mgCh
          .send(`✅ **${mg.name}** is now connected and ready to play here! ${mg.starter}`)
          .catch(() => {});
      }
    }

    const mb = MUSIC_BOTS.find((b) => b.botId === member.id);
    if (mb) {
      if (cfg.verifiedRoleId && member.guild.roles.cache.has(cfg.verifiedRoleId)) {
        await member.roles.add(cfg.verifiedRoleId).catch(() => {});
      }
      const reqCh = cfg.musicRequestId ? member.guild.channels.cache.get(cfg.musicRequestId) : null;
      const lofiCh = cfg.musicLofiId ? member.guild.channels.cache.get(cfg.musicLofiId) : null;
      if (reqCh) await reqCh.permissionOverwrites.edit(member.id, MINIGAME_CHANNEL_PERMS).catch(() => {});
      if (lofiCh) await lofiCh.permissionOverwrites.edit(member.id, MUSIC_VOICE_PERMS).catch(() => {});
      if (reqCh) {
        await reqCh
          .send(`✅ **${mb.name}** is now connected and ready! ${mb.starter}`)
          .catch(() => {});
      }
    }
    return;
  }

  const autoMemberRole =
    (cfg.memberRoleId && member.guild.roles.cache.get(cfg.memberRoleId)) ||
    member.guild.roles.cache.find((r) => !r.managed && r.name.toLowerCase() === 'member');
  if (autoMemberRole && !autoMemberRole.permissions.any(DANGEROUS_PERMS)) {
    await member.roles.add(autoMemberRole.id).catch(() => {});
  }

  const msCfg = cfg.milestone ?? { ...DEFAULT_MILESTONE };
  const count = member.guild.memberCount;
  const { reachedNow, next, remaining } = computeMilestoneProgress(count, msCfg);

  if (cfg.welcomeId) {
    const welcomeCh = member.guild.channels.cache.get(cfg.welcomeId);
    if (welcomeCh) {
      const steps = [
        cfg.rulesId && member.guild.channels.cache.has(cfg.rulesId) ? `read <#${cfg.rulesId}>` : null,
        cfg.verifyId && member.guild.channels.cache.has(cfg.verifyId) ? `verify in <#${cfg.verifyId}>` : null,
        cfg.rolesPickId && member.guild.channels.cache.has(cfg.rolesPickId) ? `pick your roles in <#${cfg.rolesPickId}>` : null,
      ].filter(Boolean);
      const guideLine = steps.length ? ` Make sure to ${steps.join(', ')}.` : '';
      const progressLine =
        msCfg.enabled !== false && next !== null && !reachedNow
          ? ` — **${remaining}** more to reach **${next}** members`
          : '';
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(`🛬 Welcome to ${member.guild.name}!`)
        .setDescription(
          `Glad to have you with us, <@${member.id}>!${guideLine}\nYou are member **#${count}**${progressLine}.`
        )
        .setThumbnail(member.user.displayAvatarURL());
      await welcomeCh.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(() => {});
    }
  }

  if (reachedNow) {
    msCfg.highestReached = count;
    cfg.milestone = msCfg;
    saveState();

    let awardedRoleId = null;
    if (msCfg.roleId) {
      const me = member.guild.members.me ?? (await member.guild.members.fetchMe().catch(() => null));
      const role = member.guild.roles.cache.get(msCfg.roleId);
      if (
        me &&
        me.permissions.has(PermissionFlagsBits.ManageRoles) &&
        role &&
        !role.managed &&
        !role.permissions.any(DANGEROUS_PERMS) &&
        role.position < me.roles.highest.position
      ) {
        const ok = await member.roles
          .add(role.id)
          .then(() => true)
          .catch(() => false);
        if (ok) awardedRoleId = role.id;
      }
    }

    const targetChId = msCfg.channelId || cfg.welcomeId;
    const targetCh = targetChId ? member.guild.channels.cache.get(targetChId) : null;
    if (targetCh) {
      await targetCh
        .send(
          buildMilestoneCardPayload({
            count,
            next,
            remaining,
            userId: member.id,
            avatarUrl: member.user.displayAvatarURL(),
            rewardRoleId: awardedRoleId,
          })
        )
        .catch(() => {});
    }
  }

  if (cfg.inviteLogsId) {
    const inviteLogsCh = member.guild.channels.cache.get(cfg.inviteLogsId);
    if (inviteLogsCh) {
      const prevMap = guildInvites.get(member.guild.id) ?? new Map();
      const freshInvites = await member.guild.invites.fetch().catch(() => null);
      let usedInvite = null;
      if (freshInvites) {
        for (const inv of freshInvites.values()) {
          const prevUses = prevMap.get(inv.code)?.uses ?? 0;
          if ((inv.uses ?? 0) > prevUses) {
            usedInvite = inv;
            break;
          }
        }
        guildInvites.set(
          member.guild.id,
          new Map(freshInvites.map((inv) => [inv.code, { uses: inv.uses ?? 0, inviterId: inv.inviter?.id ?? null }]))
        );
      }

      let logMsg = `📥 <@${member.id}> joined the server.`;
      if (usedInvite && usedInvite.inviter) {
        logMsg = `📥 <@${member.id}> joined with invite \`${usedInvite.code}\` created by <@${usedInvite.inviter.id}> — **${usedInvite.uses}** total uses.`;
      } else if (usedInvite) {
        logMsg = `📥 <@${member.id}> joined with invite \`${usedInvite.code}\` — **${usedInvite.uses}** total uses.`;
      }
      await inviteLogsCh.send(logMsg).catch(() => {});
    }
  }
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (oldMember.premiumSince || !newMember.premiumSince) return;
  const cfg = state.guilds[newMember.guild.id];
  if (!cfg?.boosterLogsId) return;

  const boosterCh = newMember.guild.channels.cache.get(cfg.boosterLogsId);
  if (!boosterCh) return;

  const boosts = newMember.guild.premiumSubscriptionCount ?? 1;
  const embed = new EmbedBuilder()
    .setColor(0xf47fff)
    .setTitle('🚀 New Server Boost!')
    .setDescription(
      `Thank you <@${newMember.id}> for boosting **${newMember.guild.name}**! Our community now has **${boosts}** active boosts.`
    );
  await boosterCh.send({ content: `<@${newMember.id}>`, embeds: [embed] }).catch(() => {});
});

client.on(Events.GuildMemberRemove, async (member) => {
  const cfg = state.guilds[member.guild.id];
  if (!cfg) return;
  scheduleStatsSync(member.guild);

  if (cfg.goodbyeId) {
    const goodbyeCh = member.guild.channels.cache.get(cfg.goodbyeId);
    if (goodbyeCh) {
      const name = member.user?.username ?? member.displayName ?? 'A member';
      await goodbyeCh
        .send(`👋🏻 **${name}** left the server. We now have **${member.guild.memberCount}** members.`)
        .catch(() => {});
    }
  }
});

client.on(Events.ChannelDelete, (ch) => {
  let changed = false;
  if (state.hubs[ch.id] || state.temp[ch.id] || state.waiting[ch.id]) {
    const waitId = state.waiting[ch.id];
    delete state.hubs[ch.id];
    delete state.temp[ch.id];
    delete state.waiting[ch.id];
    changed = true;
    if (waitId) {
      ch.guild?.channels.cache.get(waitId)?.delete('Main voice deleted').catch(() => {});
    }
  }
  for (const [mainId, waitId] of Object.entries(state.waiting)) {
    if (waitId === ch.id) {
      delete state.waiting[mainId];
      changed = true;
    }
  }
  const cfg = ch.guildId ? state.guilds[ch.guildId] : null;
  if (cfg) {
    for (const [k, v] of Object.entries(cfg)) {
      if (v === ch.id) {
        delete cfg[k];
        changed = true;
      }
    }
    if (cfg.milestone?.channelId === ch.id) {
      cfg.milestone.channelId = null;
      changed = true;
    }
    if (cfg.minigameChannels) {
      for (const [botId, targetId] of Object.entries(cfg.minigameChannels)) {
        if (targetId === ch.id) {
          delete cfg.minigameChannels[botId];
          changed = true;
        }
      }
    }
  }
  if (changed) saveState();
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (oldState.channelId === newState.channelId) return;

  if (oldState.channelId && state.temp[oldState.channelId]) {
    const oldCh = oldState.channel ?? (await client.channels.fetch(oldState.channelId).catch(() => null));
    if (!oldCh || oldCh.members.size === 0) {
      await cleanupVoiceRoom(oldState.channelId);
      if (oldCh) await oldCh.delete('Empty temporary voice room').catch(() => {});
    }
  }

  if (newState.channelId && state.hubs[newState.channelId] && newState.member && !newState.member.user.bot) {
    const member = newState.member;
    const hub = newState.channel;
    if (!hub) return;

    const overwrites = hub.parent
      ? hub.parent.permissionOverwrites.cache
          .filter((o) => o.id !== member.id && o.id !== client.user.id)
          .map((o) => ({ id: o.id, allow: o.allow.bitfield, deny: o.deny.bitfield, type: o.type }))
      : [];

    overwrites.push({ id: client.user.id, allow: ROOM_PERMS }, { id: member.id, allow: ROOM_PERMS });

    let tempCh = null;
    try {
      tempCh = await newState.guild.channels.create({
        name: `🔊 ${member.displayName}`.slice(0, 100),
        type: ChannelType.GuildVoice,
        parent: hub.parentId ?? null,
        permissionOverwrites: overwrites,
      });

      state.temp[tempCh.id] = member.id;
      saveState();

      await member.voice.setChannel(tempCh);
    } catch (err) {
      console.error('Failed to create or move temporary voice:', err.message);
      if (tempCh && tempCh.members.size === 0) {
        await cleanupVoiceRoom(tempCh.id);
        await tempCh.delete('Member disconnected before move').catch(() => {});
      }
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isAutocomplete() && interaction.commandName === 'backup') {
      const q = interaction.options.getFocused().toLowerCase();
      const choices = Object.entries(state.backups)
        .filter(([slug, b]) => slug.includes(q) || b.label.toLowerCase().includes(q))
        .slice(0, 25)
        .map(([slug, b]) => ({ name: b.label, value: slug }));
      return interaction.respond(choices);
    }

    if (!interaction.inCachedGuild()) return;

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'help') {
        const lang = interaction.options.getString('language') || 'en';
        return interaction.reply({ ...buildDocsPayload(lang), flags: MessageFlags.Ephemeral });
      }

      if (interaction.commandName === 'setup') {
        const key = interaction.options.getString('template', true);
        const replace = interaction.options.getString('mode') === 'replace';

        if (key === 'custom') {
          const sessionId = randomUUID();
          const session = {
            guildId: interaction.guildId,
            userId: interaction.user.id,
            replace,
            selectedModules: [],
            customSpec: '',
            customRoles: '',
            createdAt: Date.now(),
          };
          customBuilderSessions.set(sessionId, session);
          setTimeout(() => customBuilderSessions.delete(sessionId), CUSTOM_BUILDER_TTL_MS).unref();

          const payload = buildCustomBuilderPayload(session, sessionId);
          return interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
        }

        const tpl = TEMPLATES[key];
        return promptOrRunSetup(interaction, {
          userId: interaction.user.id,
          label: tpl.label,
          groups: parseTemplate(tpl.spec),
          roles: tpl.roles,
          replace,
        });
      }

      if (interaction.commandName === 'clear-channels') {
        const me = await interaction.guild.members.fetchMe();
        if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({
            content: '❌ Please give this bot the Manage Channels permission in Server Settings first.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const keepFreshGeneral = interaction.options.getString('after') === 'keep';
        const id = randomUUID();
        pendingSetups.set(id, { userId: interaction.user.id, clearOnly: true, keepFreshGeneral });
        setTimeout(() => pendingSetups.delete(id), CONFIRMATION_TTL_MS).unref();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`confirm_setup:${id}`).setLabel('Yes, Delete All Channels').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`cancel_setup:${id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({
          content:
            '⚠️ **Are you sure?** This will permanently delete every category, text channel, and voice channel in this server.',
          components: [row],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.commandName === 'create-channel') {
        const me = await interaction.guild.members.fetchMe();
        if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({
            content: '❌ Please give this bot the Manage Channels permission in Server Settings first.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({
            content: '❌ You need Manage Channels permission to use this command.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const rawName = interaction.options.getString('name', true).trim();
        const type = interaction.options.getString('type', true);
        const category = interaction.options.getChannel('category');
        const parentId = type === 'category' ? null : category?.id ?? null;
        const cfg = state.guilds[interaction.guildId] ?? {};
        const verifiedRoleId = cfg.verifiedRoleId ?? null;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (type === 'category') {
          const formattedName = formatCategoryHeader(rawName);
          const cat = await interaction.guild.channels.create({
            name: formattedName,
            type: ChannelType.GuildCategory,
            permissionOverwrites: buildGatedCategoryOverwrites(interaction.guild, verifiedRoleId),
          });
          return interaction.editReply(`✅ Category **${cat.name}** created successfully!`);
        }

        const hasEmoji = /^\p{Extended_Pictographic}/u.test(rawName);

        if (type === 'text') {
          const formattedName = (hasEmoji ? rawName : `💬・${rawName}`).toLowerCase().replace(/\s+/g, '-').slice(0, 100);
          const overwrites = parentId ? undefined : buildGatedCategoryOverwrites(interaction.guild, verifiedRoleId);
          const ch = await interaction.guild.channels.create({
            name: formattedName,
            type: ChannelType.GuildText,
            parent: parentId,
            permissionOverwrites: overwrites,
          });
          return interaction.editReply(`✅ Text channel <#${ch.id}> created successfully!`);
        }

        if (type === 'readonly') {
          const formattedName = (hasEmoji ? rawName : `📢・${rawName}`).toLowerCase().replace(/\s+/g, '-').slice(0, 100);
          const ch = await interaction.guild.channels.create({
            name: formattedName,
            type: ChannelType.GuildText,
            parent: parentId,
            permissionOverwrites: buildReadOnlyOverwrites(interaction.guild, verifiedRoleId),
          });
          return interaction.editReply(`✅ Read-only channel <#${ch.id}> created successfully!`);
        }

        if (type === 'voice') {
          const formattedName = (hasEmoji ? rawName : `🔊 ${rawName}`).slice(0, 100);
          const overwrites = parentId ? undefined : buildGatedCategoryOverwrites(interaction.guild, verifiedRoleId);
          const ch = await interaction.guild.channels.create({
            name: formattedName,
            type: ChannelType.GuildVoice,
            parent: parentId,
            permissionOverwrites: overwrites,
          });
          return interaction.editReply(`✅ Voice channel <#${ch.id}> created successfully!`);
        }

        if (type === 'autovoice') {
          const formattedName = (hasEmoji ? rawName : `➕ ${rawName}`).slice(0, 100);
          const ch = await interaction.guild.channels.create({
            name: formattedName,
            type: ChannelType.GuildVoice,
            parent: parentId,
          });
          state.hubs[ch.id] = interaction.guildId;
          saveState();
          return interaction.editReply(`✅ Auto voice channel <#${ch.id}> created successfully! Members who join will get their own temporary voice room.`);
        }

        if (type === 'stage') {
          const formattedName = (hasEmoji ? rawName : `🎙️ ${rawName}`).slice(0, 100);
          let ch;
          try {
            ch = await interaction.guild.channels.create({
              name: formattedName,
              type: ChannelType.GuildStageVoice,
              parent: parentId,
              permissionOverwrites: buildStageOverwrites(interaction.guild, verifiedRoleId),
            });
          } catch {
            ch = await interaction.guild.channels.create({
              name: formattedName,
              type: ChannelType.GuildVoice,
              parent: parentId,
              permissionOverwrites: buildAdminVoiceOverwrites(interaction.guild, verifiedRoleId),
            });
          }
          return interaction.editReply(`✅ Stage channel <#${ch.id}> created successfully!`);
        }

        if (type === 'adminvoice') {
          const formattedName = (hasEmoji ? rawName : `🛡️ ${rawName}`).slice(0, 100);
          const ch = await interaction.guild.channels.create({
            name: formattedName,
            type: ChannelType.GuildVoice,
            parent: parentId,
            permissionOverwrites: buildAdminVoiceOverwrites(interaction.guild, verifiedRoleId),
          });
          return interaction.editReply(`✅ Admin voice channel <#${ch.id}> created successfully!`);
        }

        return interaction.editReply('❌ Invalid channel type specified.');
      }

      if (interaction.commandName === 'auto-voice') {
        const name = interaction.options.getString('name')?.trim() || '➕ Create Voice';
        const category = interaction.options.getChannel('category');
        const ch = await interaction.guild.channels.create({
          name: name.slice(0, 100),
          type: ChannelType.GuildVoice,
          parent: category?.id ?? interaction.channel?.parentId ?? null,
        });
        state.hubs[ch.id] = interaction.guildId;
        saveState();
        return interaction.reply({
          content: `✅ <#${ch.id}> is ready! Anyone who joins it will automatically get their own personal voice room.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.commandName === 'voice') {
        const sub = interaction.options.getSubcommand();
        if (sub === 'interface') {
          if (
            !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels) &&
            !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
          ) {
            return interaction.reply({
              content:
                '❌ Only Admins or staff with Manage Channels permission can post the Voice Room Controls panel.',
              flags: MessageFlags.Ephemeral,
            });
          }
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          await sendFreshVoicePanel(interaction.channel);
          return interaction.editReply('✅ Voice Room Controls panel sent in this channel!');
        }

        const voiceCh = await resolveManagedVoice(interaction, sub);
        if (!voiceCh) return;

        if (sub === 'lock') {
          await applyVoicePrivacy(voiceCh, 'locked');
          return interaction.reply({ content: '🔒 Your voice room is now locked.', flags: MessageFlags.Ephemeral });
        }
        if (sub === 'unlock') {
          await applyVoicePrivacy(voiceCh, 'open');
          return interaction.reply({ content: '🔓 Your voice room is now open to everyone.', flags: MessageFlags.Ephemeral });
        }
        if (sub === 'limit') {
          const count = interaction.options.getInteger('max_members', true);
          await voiceCh.setUserLimit(count);
          return interaction.reply({
            content: count === 0 ? '👥 Member limit removed.' : `👥 Room limit set to **${count}** members.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        if (sub === 'rename') {
          const name = interaction.options.getString('new_name', true).trim();
          await voiceCh.setName(`🔊 ${name}`.slice(0, 100));
          return interaction.reply({ content: `✏️ Room renamed to **🔊 ${name}**.`, flags: MessageFlags.Ephemeral });
        }
        if (sub === 'delete') {
          await cleanupVoiceRoom(voiceCh.id);
          await interaction.reply({
            content: '🗑️ Closing your temporary voice room...',
            flags: MessageFlags.Ephemeral,
          });
          await voiceCh.delete('Deleted by room owner').catch(() => {});
          return;
        }
      }

      if (interaction.commandName === 'backup') {
        const sub = interaction.options.getSubcommand();

        if (sub === 'save') {
          const rawName = interaction.options.getString('name', true).trim();
          const slug = toSlug(rawName);
          if (!slug) {
            return interaction.reply({
              content: '❌ Please use letters or numbers for the layout name.',
              flags: MessageFlags.Ephemeral,
            });
          }

          await interaction.guild.channels.fetch();
          await interaction.guild.roles.fetch();
          const exported = serializeGuildTemplate({
            channels: interaction.guild.channels.cache.values(),
            roles: interaction.guild.roles.cache.values(),
            everyoneId: interaction.guild.roles.everyone.id,
            hubs: state.hubs,
            temp: {
              ...state.temp,
              ...Object.fromEntries(Object.values(state.waiting).map((id) => [id, 'waiting'])),
            },
            fixedIds: getFixedChannelIds(interaction.guildId),
          });
          const groups = parseTemplate(exported.spec);
          const chCount = groups.reduce((acc, g) => acc + g.channels.length, 0);

          state.backups[slug] = {
            label: rawName,
            spec: exported.spec,
            roles: exported.roles,
            updatedAt: new Date().toISOString(),
          };
          saveState();

          const preview = exported.spec.length > 900 ? `${exported.spec.slice(0, 900)}\n...` : exported.spec;
          return interaction.reply({
            content: `✅ Layout **${rawName}** saved with ${chCount} channels and ${exported.roles.length} roles.\n\`\`\`\n${preview}\n\`\`\``,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (sub === 'list') {
          const entries = Object.values(state.backups);
          if (!entries.length) {
            return interaction.reply({
              content: '📭 You do not have any saved layouts yet. Use `/backup save` to save one first.',
              flags: MessageFlags.Ephemeral,
            });
          }
          const lines = entries.map((b) => {
            const count = parseTemplate(b.spec).reduce((acc, g) => acc + g.channels.length, 0);
            return `• **${b.label}** — ${count} channels, ${b.roles.length} roles`;
          });
          return interaction.reply({
            content: `📦 **Your Saved Server Layouts:**\n${lines.join('\n')}`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (sub === 'load') {
          const input = interaction.options.getString('name', true);
          const b = state.backups[input] ?? state.backups[toSlug(input)];
          if (!b) {
            return interaction.reply({
              content: `❌ Could not find a saved layout named **${input}**. Check \`/backup list\` to see available names.`,
              flags: MessageFlags.Ephemeral,
            });
          }
          const replace = interaction.options.getString('mode') === 'replace';
          return promptOrRunSetup(interaction, {
            userId: interaction.user.id,
            label: b.label,
            groups: parseTemplate(b.spec),
            roles: b.roles,
            replace,
          });
        }

        if (sub === 'delete') {
          const input = interaction.options.getString('name', true);
          const key = state.backups[input] ? input : toSlug(input);
          if (!state.backups[key]) {
            return interaction.reply({
              content: `❌ Could not find a saved layout named **${input}**.`,
              flags: MessageFlags.Ephemeral,
            });
          }
          const label = state.backups[key].label;
          delete state.backups[key];
          saveState();
          return interaction.reply({
            content: `🗑️ Saved layout **${label}** has been deleted.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      if (interaction.commandName === 'milestone') {
        const sub = interaction.options.getSubcommand();
        const cfg = (state.guilds[interaction.guildId] ??= {});
        const prev = cfg.milestone ?? {
          ...DEFAULT_MILESTONE,
          highestReached: interaction.guild.memberCount,
        };

        if (sub === 'set') {
          const optEvery = interaction.options.getInteger('every');
          const rawGoals = interaction.options.getString('goals');
          const optChannel = interaction.options.getChannel('channel');
          const optRole = interaction.options.getRole('reward_role');

          if (optRole) {
            const me = await interaction.guild.members.fetchMe();
            if (
              !me.permissions.has(PermissionFlagsBits.ManageRoles) ||
              optRole.managed ||
              optRole.id === interaction.guildId ||
              optRole.permissions.any(DANGEROUS_PERMS) ||
              optRole.position >= me.roles.highest.position
            ) {
              return interaction.reply({
                content:
                  '❌ That reward role cannot be assigned. Give this bot Manage Roles, move the bot role higher in Server Settings, and pick a non-admin role.',
                flags: MessageFlags.Ephemeral,
              });
            }
          }

          let parsedGoals = prev.goals;
          if (rawGoals !== null) {
            parsedGoals = [
              ...new Set(
                rawGoals
                  .split(',')
                  .map((s) => Number.parseInt(s.trim(), 10))
                  .filter((n) => Number.isInteger(n) && n > 0 && n <= 10_000_000)
              ),
            ].sort((a, b) => a - b);
          }

          const nextEvery = optEvery ?? prev.every;
          if (nextEvery === 0 && parsedGoals.length === 0) {
            return interaction.reply({
              content: '❌ Please set an interval greater than 0 or provide at least one milestone target in goals.',
              flags: MessageFlags.Ephemeral,
            });
          }

          const nextChannelId = optChannel?.id ?? prev.channelId ?? cfg.welcomeId ?? interaction.channelId;
          cfg.milestone = {
            enabled: true,
            every: nextEvery,
            goals: parsedGoals,
            channelId: nextChannelId,
            roleId: optRole ? optRole.id : prev.roleId,
            highestReached: Math.max(prev.highestReached ?? 0, interaction.guild.memberCount),
          };
          saveState();

          const { next, remaining } = computeMilestoneProgress(interaction.guild.memberCount, cfg.milestone);
          const everyText = nextEvery > 0 ? `every **${nextEvery}** members` : 'custom goals only';
          const goalsText = parsedGoals.length ? parsedGoals.join(', ') : 'none';
          const roleText = cfg.milestone.roleId ? `<@&${cfg.milestone.roleId}>` : 'none';
          const nextText = next !== null ? `**${next}** members — **${remaining}** to go` : 'none';

          return interaction.reply({
            content:
              `✅ **Member Milestones updated!**\n` +
              `• Channel: <#${nextChannelId}>\n` +
              `• Interval: ${everyText}\n` +
              `• Extra goals: ${goalsText}\n` +
              `• Reward role: ${roleText}\n` +
              `• Next milestone: ${nextText}`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (sub === 'status') {
          const count = interaction.guild.memberCount;
          const { next, remaining } = computeMilestoneProgress(count, prev);
          const chId = prev.channelId ?? cfg.welcomeId;
          const chText = chId ? `<#${chId}>` : 'Not set yet, run `/milestone set`';
          const everyText = prev.every > 0 ? `Every **${prev.every}** members` : 'Custom goals only';
          const goalsText = prev.goals?.length ? prev.goals.join(', ') : 'None';
          const roleText = prev.roleId ? `<@&${prev.roleId}>` : 'None';
          const nextText = next !== null ? `**${next}** members — **${remaining}** to go` : 'No upcoming goals';
          const statusLabel = prev.enabled !== false ? '🟢 Active' : '🔴 Disabled';

          return interaction.reply({
            content:
              `📊 **Member Milestone Status:** ${statusLabel}\n` +
              `• Current members: **${count}**\n` +
              `• Next milestone: ${nextText}\n` +
              `• Channel: ${chText}\n` +
              `• Interval: ${everyText}\n` +
              `• Extra goals: ${goalsText}\n` +
              `• Reward role: ${roleText}`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (sub === 'test') {
          const { next } = computeMilestoneProgress(interaction.guild.memberCount, prev);
          const sampleCount = next ?? Math.max(50, interaction.guild.memberCount);
          const afterSample = computeMilestoneProgress(sampleCount, { ...prev, highestReached: sampleCount });

          await interaction.channel.send(
            buildMilestoneCardPayload({
              count: sampleCount,
              next: afterSample.next,
              remaining: afterSample.remaining,
              userId: interaction.user.id,
              avatarUrl: interaction.user.displayAvatarURL(),
              rewardRoleId: prev.roleId,
            })
          );
          return interaction.reply({
            content: '✅ Sample milestone celebration card sent!',
            flags: MessageFlags.Ephemeral,
          });
        }

        if (sub === 'disable') {
          cfg.milestone = { ...prev, enabled: false };
          saveState();
          return interaction.reply({
            content: '🔕 Member milestone celebrations have been turned off. Run `/milestone set` anytime to turn them back on.',
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      if (interaction.commandName === 'verify-panel') {
        const me = await interaction.guild.members.fetchMe();
        if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({
            content: '❌ Please give this bot the Manage Roles permission in Server Settings first.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const optRole = interaction.options.getRole('role');
        const role = optRole ?? (await ensureVerifiedRole(interaction.guild));
        if (
          !role ||
          role.managed ||
          role.id === interaction.guildId ||
          role.permissions.any(DANGEROUS_PERMS) ||
          role.position >= me.roles.highest.position
        ) {
          return interaction.reply({
            content:
              '❌ That role cannot be used for verification. Move this bot role higher in Server Settings under Roles, and choose a non-admin role.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const minHours = interaction.options.getInteger('min_account_hours') ?? 0;
        const title = interaction.options.getString('title')?.trim() || '🛡️ Account Verification';
        await interaction.channel.send(buildVerifyPanelMessage(role.id, minHours, title));
        return interaction.reply({
          content: `✅ Verification panel sent! Verified members will receive <@&${role.id}>.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.commandName === 'role-panel') {
        const me = await interaction.guild.members.fetchMe();
        if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({
            content: '❌ Please give this bot the Manage Roles permission in Server Settings first.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const style = interaction.options.getString('style') || 'buttons';
        const title = interaction.options.getString('title')?.trim() || '🎮 Pick Your Roles';
        const rawList = interaction.options.getString('roles', true);
        const names = [...new Set(rawList.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 25);

        await interaction.guild.roles.fetch();
        const roleItems = [];
        const skipped = [];

        for (const name of names) {
          let role = interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
          if (!role) {
            role = await interaction.guild.roles
              .create({ name: name.slice(0, 100), colors: { primaryColor: 0x5865f2 } })
              .catch(() => null);
          }
          if (!role || role.managed || role.permissions.any(DANGEROUS_PERMS) || role.position >= me.roles.highest.position) {
            skipped.push(name);
            continue;
          }
          roleItems.push({ id: role.id, name: role.name.slice(0, 100) });
        }

        if (!roleItems.length) {
          return interaction.reply({
            content:
              '❌ None of those roles could be added. Move this bot role higher in Server Settings under Roles, and avoid moderator or admin roles.',
            flags: MessageFlags.Ephemeral,
          });
        }

        if (style === 'dropdown') {
          const menu = new StringSelectMenuBuilder()
            .setCustomId('self_role')
            .setPlaceholder('Click here to choose your roles...')
            .setMinValues(0)
            .setMaxValues(roleItems.length)
            .addOptions(roleItems.map((r) => ({ label: r.name, value: r.id })));

          await interaction.channel.send({
            content: `### ${title}\nPick the roles you want from the menu below. Uncheck a role anytime to remove it.`,
            components: [new ActionRowBuilder().addComponents(menu)],
          });
        } else {
          await interaction.channel.send({
            content: `### ${title}\nClick any button below to add a role to your profile. Click the same button again anytime to remove it.`,
            components: buildRoleButtonRows(roleItems),
          });
        }

        const note = skipped.length ? ` Skipped restricted roles: ${skipped.join(', ')}.` : '';
        return interaction.reply({ content: `✅ Role panel sent!${note}`, flags: MessageFlags.Ephemeral });
      }

      if (interaction.commandName === 'ticket-panel') {
        const title = interaction.options.getString('title')?.trim() || '📩 Need Help? Open a Ticket';
        const message =
          interaction.options.getString('message')?.trim() ||
          'Click the button below to start a private conversation with our staff team.';

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket:open').setLabel('📩 Open Support Ticket').setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ content: `### ${title}\n${message}`, components: [row] });
        return interaction.reply({ content: '✅ Support ticket panel sent!', flags: MessageFlags.Ephemeral });
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('custom_lego_modal:')) {
        const sessionId = interaction.customId.slice('custom_lego_modal:'.length);
        const session = customBuilderSessions.get(sessionId);
        if (!session || session.userId !== interaction.user.id) {
          return interaction.reply({
            content: '❌ This custom builder session expired. Please run `/setup` again.',
            flags: MessageFlags.Ephemeral,
          });
        }
        session.customCategoryName = interaction.fields.getTextInputValue('cat_name') ?? '';
        session.customTextChannels = interaction.fields.getTextInputValue('text_channels') ?? '';
        session.customVoiceChannels = interaction.fields.getTextInputValue('voice_channels') ?? '';

        const payload = buildCustomBuilderPayload(session, sessionId);
        return interaction.isFromMessage()
          ? interaction.update(payload)
          : interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('custom_tpl:')) {
        const replace = interaction.customId.endsWith(':replace');
        const spec = interaction.fields.getTextInputValue('spec');
        const rawRoles = interaction.fields.getTextInputValue('roles');
        const groups = parseTemplate(spec);
        const roles = rawRoles
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

        return promptOrRunSetup(interaction, {
          userId: interaction.user.id,
          label: 'Custom Layout',
          groups,
          roles,
          replace,
        });
      }

      if (interaction.customId === 'verify_modal') {
        const respond = (payload) =>
          interaction.isFromMessage()
            ? interaction.update(payload)
            : interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });

        const sessionKey = `${interaction.guildId}:${interaction.user.id}`;
        const session = captchaSessions.get(sessionKey);
        if (!session || Date.now() > session.expiresAt) {
          captchaSessions.delete(sessionKey);
          return respond({
            content: '⌛ Your verification code expired. Click **Verify Account** again to get a fresh image.',
            embeds: [],
            attachments: [],
            files: [],
            components: [],
          });
        }

        const typed = interaction.fields.getTextInputValue('code').trim().toUpperCase();
        if (typed !== session.code) {
          session.attemptsLeft -= 1;
          if (session.attemptsLeft <= 0) {
            captchaSessions.delete(sessionKey);
            const unlockAt = Date.now() + VERIFY_LOCKOUT_MS;
            verifyCooldowns.set(sessionKey, unlockAt);
            setTimeout(() => verifyCooldowns.delete(sessionKey), VERIFY_LOCKOUT_MS).unref();
            return respond({
              content: '🚫 Too many incorrect attempts. Please wait 3 minutes before trying again.',
              embeds: [],
              attachments: [],
              files: [],
              components: [],
            });
          }

          const next = generateCaptcha(5);
          session.code = next.code;
          session.expiresAt = Date.now() + CAPTCHA_TTL_MS;
          return respond(
            buildCaptchaCard(next.buffer, session.attemptsLeft, '❌ Incorrect code! Please try this new image:')
          );
        }

        captchaSessions.delete(sessionKey);
        verifyCooldowns.delete(sessionKey);

        const me = await interaction.guild.members.fetchMe();
        await interaction.guild.roles.fetch();
        const role = interaction.guild.roles.cache.get(session.roleId);
        if (!role || role.managed || role.permissions.any(DANGEROUS_PERMS) || role.position >= me.roles.highest.position) {
          return respond({
            content:
              '❌ Verification succeeded, but this bot cannot assign the role. Please ask an Admin to move the bot role higher in Server Settings.',
            embeds: [],
            attachments: [],
            files: [],
            components: [],
          });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        const rolesToGrant = [role.id];
        const mRole = interaction.guild.roles.cache.find(
          (r) =>
            !r.managed &&
            r.name.toLowerCase() === 'member' &&
            !r.permissions.any(DANGEROUS_PERMS) &&
            r.position < me.roles.highest.position
        );
        if (mRole && !member.roles.cache.has(mRole.id)) rolesToGrant.push(mRole.id);
        await member.roles.add(rolesToGrant);
        return respond({
          content: `✅ Verification complete! You now have the <@&${role.id}> role and full server access.`,
          embeds: [],
          attachments: [],
          files: [],
          components: [],
        });
      }

      if (interaction.customId.startsWith('vc_modal:')) {
        const [, kind, chId] = interaction.customId.split(':');
        const voiceCh = await resolveManagedVoice(interaction, kind, chId);
        if (!voiceCh) return;

        if (kind === 'limit') {
          const num = Number.parseInt(interaction.fields.getTextInputValue('count').trim(), 10);
          if (Number.isNaN(num) || num < 0 || num > 99) {
            return interaction.reply({
              content: '❌ Please enter a number from 0 to 99.',
              flags: MessageFlags.Ephemeral,
            });
          }
          await voiceCh.setUserLimit(num);
          return interaction.reply({
            content: num === 0 ? '👥 Member limit removed.' : `👥 Room limit set to **${num}** members.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (kind === 'rename') {
          const name = interaction.fields.getTextInputValue('name').trim();
          if (!name) return interaction.reply({ content: '❌ Please enter a room name.', flags: MessageFlags.Ephemeral });
          await voiceCh.setName(`🔊 ${name}`.slice(0, 100));
          return interaction.reply({ content: `✏️ Room renamed to **🔊 ${name}**.`, flags: MessageFlags.Ephemeral });
        }
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('custom_lego_select:')) {
        const sessionId = interaction.customId.slice('custom_lego_select:'.length);
        const session = customBuilderSessions.get(sessionId);
        if (!session || session.userId !== interaction.user.id) {
          return interaction.reply({
            content: '❌ This custom builder session expired. Please run `/setup` again.',
            flags: MessageFlags.Ephemeral,
          });
        }
        session.selectedModules = interaction.values;
        return interaction.update(buildCustomBuilderPayload(session, sessionId));
      }

      if (interaction.customId === 'self_role') {
        const panelRoleIds = interaction.component.options.map((o) => o.value);
        const chosen = new Set(interaction.values);
        const member = await interaction.guild.members.fetch(interaction.user.id);

        const toAdd = [];
        const toRemove = [];
        for (const id of panelRoleIds) {
          const role = interaction.guild.roles.cache.get(id);
          if (!role || role.managed || role.permissions.any(DANGEROUS_PERMS)) continue;
          if (chosen.has(id) && !member.roles.cache.has(id)) toAdd.push(id);
          if (!chosen.has(id) && member.roles.cache.has(id)) toRemove.push(id);
        }

        if (toAdd.length) await member.roles.add(toAdd);
        if (toRemove.length) await member.roles.remove(toRemove);

        return interaction.reply({
          content: `✅ Your roles have been updated! Added: **${toAdd.length}**, Removed: **${toRemove.length}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.customId.startsWith('vc_kick_select:')) {
        const chId = interaction.customId.split(':')[1];
        const voiceCh = await resolveManagedVoice(interaction, 'kick', chId);
        if (!voiceCh) return;

        const targetId = interaction.values[0];
        const target = voiceCh.members.get(targetId);
        if (!target) {
          return interaction.update({ content: '❌ That member already left the voice room.', components: [] });
        }
        await target.voice.disconnect('Removed by voice room owner');
        return interaction.update({ content: `👢 <@${targetId}> has been removed from your voice room.`, components: [] });
      }

      if (interaction.customId.startsWith('vc_privacy_select:')) {
        const chId = interaction.customId.split(':')[1];
        const voiceCh = await resolveManagedVoice(interaction, 'privacy', chId);
        if (!voiceCh) return;

        const mode = interaction.values[0];
        await applyVoicePrivacy(voiceCh, mode);
        const messages = {
          open: '🔓 Your voice room is now visible and open.',
          locked: '🔒 Your voice room is now locked. Only trusted members can join.',
          invisible: '👻 Your voice room is now hidden from everyone else.',
          muted: '🔇 Audience mute enabled. Regular members can listen while trusted members speak.',
        };
        return interaction.update({ content: messages[mode] ?? messages.open, components: [] });
      }

      if (interaction.customId.startsWith('vc_region_select:')) {
        const chId = interaction.customId.split(':')[1];
        const voiceCh = await resolveManagedVoice(interaction, 'region', chId);
        if (!voiceCh) return;

        const region = interaction.values[0];
        await voiceCh.setRTCRegion(region === 'auto' ? null : region);
        return interaction.update({
          content:
            region === 'auto'
              ? '🌐 Voice region set to **Automatic**.'
              : `🌐 Voice region changed to **${region}**.`,
          components: [],
        });
      }

      if (interaction.customId.startsWith('vc_transfer_select:')) {
        const chId = interaction.customId.split(':')[1];
        const voiceCh = await resolveManagedVoice(interaction, 'transfer', chId);
        if (!voiceCh) return;

        const targetId = interaction.values[0];
        const target = voiceCh.members.get(targetId);
        if (!target || target.user.bot) {
          return interaction.update({ content: '❌ That member already left the voice room.', components: [] });
        }
        state.temp[voiceCh.id] = targetId;
        saveState();
        await voiceCh.permissionOverwrites.edit(targetId, OWNER_OVERWRITES);
        const waitId = state.waiting[voiceCh.id];
        const waitCh = waitId ? interaction.guild.channels.cache.get(waitId) : null;
        if (waitCh) await waitCh.permissionOverwrites.edit(targetId, OWNER_OVERWRITES).catch(() => {});
        return interaction.update({
          content: `🔁 Transferred ownership of <#${voiceCh.id}> to <@${targetId}>!`,
          components: [],
        });
      }
    }

    if (interaction.isUserSelectMenu() && interaction.customId.startsWith('vc_user:')) {
      const [, mode, chId] = interaction.customId.split(':');
      const voiceCh = await resolveManagedVoice(interaction, mode, chId);
      if (!voiceCh) return;

      const targetId = interaction.values[0];
      if (targetId === interaction.user.id || targetId === client.user.id) {
        return interaction.update({ content: '❌ Please pick another server member.', components: [] });
      }
      const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
      if (!targetMember || targetMember.user.bot) {
        return interaction.update({ content: '❌ Please pick a human member from this server.', components: [] });
      }

      if (mode === 'trust') {
        await voiceCh.permissionOverwrites.edit(targetId, {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          SendMessages: true,
        });
        const waitId = state.waiting[voiceCh.id];
        if (waitId && targetMember.voice.channelId === waitId) {
          await targetMember.voice.setChannel(voiceCh).catch(() => {});
        }
        return interaction.update({
          content: `✅ <@${targetId}> is now trusted in <#${voiceCh.id}>.`,
          components: [],
        });
      }

      if (mode === 'untrust') {
        await voiceCh.permissionOverwrites.delete(targetId).catch(() => {});
        return interaction.update({
          content: `➖ Removed custom trust access for <@${targetId}> in <#${voiceCh.id}>.`,
          components: [],
        });
      }

      if (mode === 'invite') {
        await voiceCh.permissionOverwrites.edit(targetId, { ViewChannel: true, Connect: true });
        const inv = await voiceCh.createInvite({ maxAge: 3600, maxUses: 5 }).catch(() => null);
        const linkPart = inv ? `\nJoin directly: ${inv.url}` : '';
        const dmSent = await targetMember
          .send(
            `📞 **${interaction.user.username}** invited you to join <#${voiceCh.id}> in **${interaction.guild.name}**!${linkPart}`
          )
          .then(() => true)
          .catch(() => false);
        return interaction.update({
          content: dmSent
            ? `📞 Sent a direct invite to <@${targetId}> and unlocked <#${voiceCh.id}>.`
            : `✅ Granted <@${targetId}> access to <#${voiceCh.id}>. Their direct messages are closed, so ping them in chat!`,
          components: [],
        });
      }

      if (mode === 'block') {
        await voiceCh.permissionOverwrites.edit(targetId, {
          ViewChannel: false,
          Connect: false,
          Speak: false,
          SendMessages: false,
        });
        if (targetMember.voice.channelId === voiceCh.id) {
          await targetMember.voice.disconnect('Blocked by temporary voice owner').catch(() => {});
        }
        return interaction.update({
          content: `🚫 <@${targetId}> has been blocked from <#${voiceCh.id}>.`,
          components: [],
        });
      }

      if (mode === 'unblock') {
        await voiceCh.permissionOverwrites.delete(targetId).catch(() => {});
        return interaction.update({
          content: `⭕ <@${targetId}> has been unblocked in <#${voiceCh.id}>.`,
          components: [],
        });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('custom_lego_toggle:')) {
        const [, sessionId, modId] = interaction.customId.split(':');
        const session = customBuilderSessions.get(sessionId);
        if (!session || session.userId !== interaction.user.id) {
          return interaction.reply({
            content: '❌ This custom builder session expired. Please run `/setup` again.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const idx = session.selectedModules.indexOf(modId);
        if (idx >= 0) {
          session.selectedModules.splice(idx, 1);
        } else {
          session.selectedModules.push(modId);
        }

        return interaction.update(buildCustomBuilderPayload(session, sessionId));
      }

      if (interaction.customId.startsWith('custom_lego_cancel:')) {
        const sessionId = interaction.customId.slice('custom_lego_cancel:'.length);
        customBuilderSessions.delete(sessionId);
        return interaction.update({ content: '❌ Custom server setup cancelled.', embeds: [], components: [] });
      }

      if (interaction.customId.startsWith('custom_lego_add:')) {
        const sessionId = interaction.customId.slice('custom_lego_add:'.length);
        const session = customBuilderSessions.get(sessionId);
        if (!session || session.userId !== interaction.user.id) {
          return interaction.reply({
            content: '❌ This custom builder session expired. Please run `/setup` again.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`custom_lego_modal:${sessionId}`)
          .setTitle('Add Custom Channels');

        const catInput = new TextInputBuilder()
          .setCustomId('cat_name')
          .setLabel('Category Name')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. VIP ZONE')
          .setValue(session.customCategoryName || '')
          .setRequired(false);

        const textInput = new TextInputBuilder()
          .setCustomId('text_channels')
          .setLabel('Text Channels')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('chat, media, bot-commands')
          .setValue(session.customTextChannels || '')
          .setRequired(false);

        const voiceInput = new TextInputBuilder()
          .setCustomId('voice_channels')
          .setLabel('Voice Rooms')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Lounge 1, Lounge 2')
          .setValue(session.customVoiceChannels || '')
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(catInput),
          new ActionRowBuilder().addComponents(textInput),
          new ActionRowBuilder().addComponents(voiceInput)
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('custom_lego_build:')) {
        const sessionId = interaction.customId.slice('custom_lego_build:'.length);
        const session = customBuilderSessions.get(sessionId);
        if (!session || session.userId !== interaction.user.id) {
          return interaction.reply({
            content: '❌ This custom builder session expired. Please run `/setup` again.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const selectedMods = session.selectedModules ?? [];
        const customSpec = buildSpecFromCustomForm(session).trim();

        if (selectedMods.length === 0 && !customSpec) {
          return interaction.reply({
            content: '❌ Please select at least one module or add custom items before building.',
            flags: MessageFlags.Ephemeral,
          });
        }

        let combinedSpec = '';
        let includeMusic = false;
        for (const modId of selectedMods) {
          if (modId === 'music') {
            includeMusic = true;
            continue;
          }
          const mod = LEGO_MODULES.find((m) => m.id === modId);
          if (mod) {
            combinedSpec += `[${mod.category}]\n${mod.spec}\n`;
          }
        }
        if (customSpec) {
          combinedSpec += `\n${customSpec}\n`;
        }

        let groups = [];
        if (combinedSpec.trim()) {
          try {
            groups = parseTemplate(combinedSpec);
          } catch (err) {
            return interaction.reply({
              content: `❌ Could not parse custom template: ${err.message}`,
              flags: MessageFlags.Ephemeral,
            });
          }
        }

        const rawRoles = (session.customRoles ?? '').trim();
        const roles = rawRoles
          ? rawRoles
              .split(',')
              .map((r) => r.trim())
              .filter(Boolean)
              .slice(0, 15)
              .map((name) => ({
                name: name.slice(0, 100),
                color: 0x5865f2,
                admin: /^admin$/i.test(name),
                mod: /mod/i.test(name),
              }))
          : [];

        customBuilderSessions.delete(sessionId);

        return promptOrRunSetup(interaction, {
          userId: interaction.user.id,
          label: 'Custom Layout',
          groups,
          roles,
          replace: session.replace,
          isCustom: true,
          includeMusic,
        });
      }

      if (interaction.customId.startsWith('docs:')) {
        const lang = interaction.customId.slice(5);
        return interaction.update(buildDocsPayload(lang));
      }

      if (interaction.customId.startsWith('role_btn:') || interaction.customId.startsWith('role_one:')) {
        const isExclusive = interaction.customId.startsWith('role_one:');
        const roleId = interaction.customId.slice(9);
        const me = await interaction.guild.members.fetchMe();
        if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({
            content: '❌ Please ask an Admin to give this bot the Manage Roles permission first.',
            flags: MessageFlags.Ephemeral,
          });
        }

        await interaction.guild.roles.fetch();
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role || role.managed || role.permissions.any(DANGEROUS_PERMS) || role.position >= me.roles.highest.position) {
          return interaction.reply({
            content: '❌ That role is unavailable or placed above this bot role in Server Settings.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role.id);
          return interaction.reply({
            content: `🗑️ Removed the <@&${role.id}> role from your profile.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (isExclusive) {
          const siblingIds = interaction.message.components
            .flatMap((r) => r.components ?? [])
            .filter((c) => c.customId?.startsWith('role_one:') && c.customId !== interaction.customId)
            .map((c) => c.customId.slice(9))
            .filter((id) => {
              const sr = interaction.guild.roles.cache.get(id);
              return (
                sr &&
                !sr.managed &&
                !sr.permissions.any(DANGEROUS_PERMS) &&
                sr.position < me.roles.highest.position &&
                member.roles.cache.has(id)
              );
            });
          if (siblingIds.length) await member.roles.remove(siblingIds);
        }

        await member.roles.add(role.id);
        return interaction.reply({
          content: `✅ Added the <@&${role.id}> role to your profile!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.customId.startsWith('verify:')) {
        const parts = interaction.customId.split(':');
        const sub = parts[1];
        const sessionKey = `${interaction.guildId}:${interaction.user.id}`;

        if (sub === 'start') {
          const roleId = parts[2];
          const minHours = Number.parseInt(parts[3] ?? '0', 10) || 0;

          const me = await interaction.guild.members.fetchMe();
          if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
              content: '❌ Please ask an Admin to give this bot the Manage Roles permission first.',
              flags: MessageFlags.Ephemeral,
            });
          }

          await interaction.guild.roles.fetch();
          const role = interaction.guild.roles.cache.get(roleId);
          if (!role || role.managed || role.permissions.any(DANGEROUS_PERMS) || role.position >= me.roles.highest.position) {
            return interaction.reply({
              content: '❌ Verification role is missing or above this bot role in Server Settings.',
              flags: MessageFlags.Ephemeral,
            });
          }

          const member = await interaction.guild.members.fetch(interaction.user.id);
          if (member.roles.cache.has(role.id)) {
            return interaction.reply({
              content: `✅ You are already verified with the <@&${role.id}> role!`,
              flags: MessageFlags.Ephemeral,
            });
          }

          if (minHours > 0) {
            const ageHours = (Date.now() - interaction.user.createdTimestamp) / 3_600_000;
            if (ageHours < minHours) {
              return interaction.reply({
                content: `⛔ Your Discord account must be at least **${minHours}** hours old to verify in this server.`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }

          const lockedUntil = verifyCooldowns.get(sessionKey);
          if (lockedUntil && Date.now() < lockedUntil) {
            const waitSec = Math.ceil((lockedUntil - Date.now()) / 1000);
            return interaction.reply({
              content: `⏳ Too many failed attempts. Please wait **${waitSec}** seconds before trying again.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          const { code, buffer } = generateCaptcha(5);
          const expiresAt = Date.now() + CAPTCHA_TTL_MS;
          captchaSessions.set(sessionKey, { code, roleId: role.id, attemptsLeft: 3, expiresAt });
          setTimeout(() => {
            if (captchaSessions.get(sessionKey)?.expiresAt === expiresAt) {
              captchaSessions.delete(sessionKey);
            }
          }, CAPTCHA_TTL_MS).unref();

          return interaction.reply({ ...buildCaptchaCard(buffer, 3), flags: MessageFlags.Ephemeral });
        }

        if (sub === 'refresh') {
          const session = captchaSessions.get(sessionKey);
          if (!session || Date.now() > session.expiresAt) {
            captchaSessions.delete(sessionKey);
            return interaction.update({
              content: '⌛ Your verification session expired. Click **Verify Account** again to start.',
              embeds: [],
              attachments: [],
              files: [],
              components: [],
            });
          }

          const { code, buffer } = generateCaptcha(5);
          session.code = code;
          session.expiresAt = Date.now() + CAPTCHA_TTL_MS;
          return interaction.update(buildCaptchaCard(buffer, session.attemptsLeft));
        }

        if (sub === 'answer') {
          const session = captchaSessions.get(sessionKey);
          if (!session || Date.now() > session.expiresAt) {
            captchaSessions.delete(sessionKey);
            return interaction.update({
              content: '⌛ Your verification session expired. Click **Verify Account** again to start.',
              embeds: [],
              attachments: [],
              files: [],
              components: [],
            });
          }

          const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Account Verification');
          const input = new TextInputBuilder()
            .setCustomId('code')
            .setLabel('Type the 5 characters from the image')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('AB3K9')
            .setMinLength(5)
            .setMaxLength(5)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
      }

      if (interaction.customId.startsWith('vc:')) {
        const action = interaction.customId.slice(3);
        const voiceCh = await resolveManagedVoice(interaction, action);
        if (!voiceCh) return;

        if (action === 'lock') {
          await applyVoicePrivacy(voiceCh, 'locked');
          return interaction.reply({ content: '🔒 Your voice room is now locked.', flags: MessageFlags.Ephemeral });
        }
        if (action === 'unlock') {
          await applyVoicePrivacy(voiceCh, 'open');
          return interaction.reply({ content: '🔓 Your voice room is now open to everyone.', flags: MessageFlags.Ephemeral });
        }
        if (action === 'limit') {
          const modal = new ModalBuilder().setCustomId(`vc_modal:limit:${voiceCh.id}`).setTitle('Set Room Member Limit');
          const input = new TextInputBuilder()
            .setCustomId('count')
            .setLabel('Enter 1 to 99, or 0 for no member limit')
            .setStyle(TextInputStyle.Short)
            .setValue(String(voiceCh.userLimit || 0))
            .setMaxLength(2)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
        if (action === 'rename') {
          const modal = new ModalBuilder().setCustomId(`vc_modal:rename:${voiceCh.id}`).setTitle('Rename Your Voice Room');
          const input = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Type a new name for your voice room')
            .setStyle(TextInputStyle.Short)
            .setValue(voiceCh.name.replace(/^🔊\s*/, ''))
            .setMaxLength(90)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
        if (action === 'privacy') {
          const select = new StringSelectMenuBuilder()
            .setCustomId(`vc_privacy_select:${voiceCh.id}`)
            .setPlaceholder('Choose a privacy mode for your voice room...')
            .addOptions(
              { label: '🔓 Open Room', description: 'Visible and open for members to join', value: 'open' },
              { label: '🔒 Locked Room', description: 'Visible in the channel list, only trusted members join', value: 'locked' },
              { label: '👻 Invisible Room', description: 'Hidden from everyone except trusted members', value: 'invisible' },
              { label: '🔇 Muted Audience', description: 'Members can join to listen while trusted members speak', value: 'muted' }
            );
          return interaction.reply({
            content: '🛡️ Select how you want to set your room privacy:',
            components: [new ActionRowBuilder().addComponents(select)],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'waiting') {
          const existingWaitId = state.waiting[voiceCh.id];
          const existingWaitCh = existingWaitId ? interaction.guild.channels.cache.get(existingWaitId) : null;
          if (existingWaitCh) {
            delete state.waiting[voiceCh.id];
            saveState();
            await existingWaitCh.delete('Waiting room closed by owner').catch(() => {});
            await applyVoicePrivacy(voiceCh, 'open');
            return interaction.reply({
              content: '🕒 Waiting room closed and your main voice room is open again.',
              flags: MessageFlags.Ephemeral,
            });
          }

          await applyVoicePrivacy(voiceCh, 'locked');
          const everyoneId = interaction.guild.roles.everyone.id;
          const audienceId = getAudienceRoleId(interaction.guild);
          const isGated = audienceId !== everyoneId;
          const waitOverwrites = [
            {
              id: everyoneId,
              ...(isGated
                ? { deny: [PermissionFlagsBits.ViewChannel] }
                : { allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }),
            },
            ...(isGated ? [{ id: audienceId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }] : []),
            { id: client.user.id, allow: ROOM_PERMS },
            { id: interaction.user.id, allow: ROOM_PERMS },
          ];
          const waitCh = await interaction.guild.channels.create({
            name: `⌛ Waiting・${interaction.member.displayName}`.slice(0, 100),
            type: ChannelType.GuildVoice,
            parent: voiceCh.parentId ?? null,
            permissionOverwrites: waitOverwrites,
          });
          state.waiting[voiceCh.id] = waitCh.id;
          saveState();
          return interaction.reply({
            content: `🕒 Waiting room <#${waitCh.id}> is now active! Your main room is locked — use **Trust** to move waiting members inside.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'chat') {
          const audienceId = getAudienceRoleId(interaction.guild);
          const current = voiceCh.permissionOverwrites.cache.get(audienceId);
          const isChatLocked = Boolean(current?.deny.has(PermissionFlagsBits.SendMessages));
          await voiceCh.permissionOverwrites.edit(audienceId, { SendMessages: isChatLocked ? null : false });
          return interaction.reply({
            content: isChatLocked
              ? '💬 Voice text chat is now open for members.'
              : '🔇 Voice text chat is now locked for regular members.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (['trust', 'untrust', 'invite', 'block', 'unblock'].includes(action)) {
          const prompts = {
            trust: {
              placeholder: 'Pick a member to trust in your room...',
              text: '✅ Choose a member to grant full access to your voice room:',
            },
            untrust: {
              placeholder: 'Pick a member to remove custom trust from...',
              text: '➖ Choose a member to remove their custom access:',
            },
            invite: {
              placeholder: 'Pick a member to invite to your room...',
              text: '📞 Choose a member to send a direct voice invite to:',
            },
            block: {
              placeholder: 'Pick a member to block from your room...',
              text: '🚫 Choose a member to block and disconnect from your voice room:',
            },
            unblock: {
              placeholder: 'Pick a blocked member to unblock...',
              text: '⭕ Choose a member to lift their block on your voice room:',
            },
          };
          const cfg = prompts[action];
          const picker = new UserSelectMenuBuilder()
            .setCustomId(`vc_user:${action}:${voiceCh.id}`)
            .setPlaceholder(cfg.placeholder);
          return interaction.reply({
            content: cfg.text,
            components: [new ActionRowBuilder().addComponents(picker)],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'kick') {
          const targets = [...voiceCh.members.values()].filter((m) => m.id !== interaction.user.id && !m.user.bot);
          if (!targets.length) {
            return interaction.reply({
              content: 'ℹ️ Nobody else is in your voice room right now.',
              flags: MessageFlags.Ephemeral,
            });
          }
          const select = new StringSelectMenuBuilder()
            .setCustomId(`vc_kick_select:${voiceCh.id}`)
            .setPlaceholder('Choose who to remove from your room...')
            .addOptions(targets.slice(0, 25).map((m) => ({ label: m.displayName.slice(0, 100), value: m.id })));
          return interaction.reply({
            content: '👢 Pick a member to remove from your voice room:',
            components: [new ActionRowBuilder().addComponents(select)],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'region') {
          const select = new StringSelectMenuBuilder()
            .setCustomId(`vc_region_select:${voiceCh.id}`)
            .setPlaceholder('Choose a voice server region...')
            .addOptions(
              { label: '🌐 Automatic', description: 'Let Discord pick the lowest latency region', value: 'auto' },
              { label: '🇸🇬 Singapore', description: 'Best latency for Indonesia and Southeast Asia', value: 'singapore' },
              { label: '🇯🇵 Japan', description: 'East Asia voice server', value: 'japan' },
              { label: '🇭🇰 Hong Kong', description: 'Hong Kong voice server', value: 'hongkong' },
              { label: '🇦🇺 Sydney', description: 'Australia and Oceania voice server', value: 'sydney' },
              { label: '🇮🇳 India', description: 'South Asia voice server', value: 'india' },
              { label: '🇪🇺 Europe', description: 'Western Europe voice server', value: 'rotterdam' },
              { label: '🇺🇸 US West', description: 'North America West Coast voice server', value: 'us-west' }
            );
          return interaction.reply({
            content: '🌐 Choose a voice server region for your room:',
            components: [new ActionRowBuilder().addComponents(select)],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'transfer') {
          const targets = [...voiceCh.members.values()].filter((m) => m.id !== interaction.user.id && !m.user.bot);
          if (!targets.length) {
            return interaction.reply({
              content: 'ℹ️ Nobody else is inside your voice room to receive ownership.',
              flags: MessageFlags.Ephemeral,
            });
          }
          const select = new StringSelectMenuBuilder()
            .setCustomId(`vc_transfer_select:${voiceCh.id}`)
            .setPlaceholder('Choose the new owner of this room...')
            .addOptions(targets.slice(0, 25).map((m) => ({ label: m.displayName.slice(0, 100), value: m.id })));
          return interaction.reply({
            content: '🔁 Pick a member inside your room to transfer ownership to:',
            components: [new ActionRowBuilder().addComponents(select)],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'delete') {
          await cleanupVoiceRoom(voiceCh.id);
          await interaction.reply({
            content: '🗑️ Closing your temporary voice room...',
            flags: MessageFlags.Ephemeral,
          });
          await voiceCh.delete('Deleted by room owner').catch(() => {});
          return;
        }
      }

      if (interaction.customId === 'ticket:open') {
        await interaction.guild.channels.fetch();
        const marker = `ticket:${interaction.user.id}`;
        const existing = interaction.guild.channels.cache.find((c) => c?.topic === marker);
        if (existing) {
          return interaction.reply({
            content: `❌ You already have an active ticket in <#${existing.id}>.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const modRoles = interaction.guild.roles.cache.filter(
          (r) => !r.managed && r.id !== interaction.guildId && r.permissions.has(PermissionFlagsBits.ManageMessages)
        );
        const overwrites = [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
            ],
          },
          ...modRoles.map((r) => ({
            id: r.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          })),
        ];

        const safeName = interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'user';
        const ticketCh = await interaction.guild.channels.create({
          name: `ticket-${safeName}`,
          type: ChannelType.GuildText,
          parent: interaction.channel?.parentId ?? null,
          topic: marker,
          permissionOverwrites: overwrites,
        });

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket:close').setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger)
        );
        await ticketCh.send({
          content: `👋 Hi <@${interaction.user.id}>! Write your question or report here and a staff member will reply soon.`,
          components: [closeRow],
        });

        return interaction.reply({
          content: `✅ Your support ticket is open in <#${ticketCh.id}>.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.customId === 'ticket:close') {
        const topic = interaction.channel?.topic ?? '';
        if (!topic.startsWith('ticket:')) return;

        const isOwner = topic === `ticket:${interaction.user.id}`;
        const isMod = interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages);
        if (!isOwner && !isMod) {
          return interaction.reply({
            content: '❌ Only the ticket creator or a moderator can close this ticket.',
            flags: MessageFlags.Ephemeral,
          });
        }

        await interaction.update({ content: `🔒 Ticket closed by <@${interaction.user.id}>. Closing channel...`, components: [] });
        setTimeout(() => interaction.channel?.delete('Ticket closed').catch(() => {}), 3000).unref();
        return;
      }

      const [action, id] = interaction.customId.split(':');
      if (action !== 'confirm_setup' && action !== 'cancel_setup') return;

      await interaction.deferUpdate().catch(() => {});

      const job = pendingSetups.get(id);
      if (!job) {
        return interaction
          .editReply({ content: '⌛ This confirmation expired. Please run the command again.', components: [] })
          .catch(() => {});
      }
      if (job.userId !== interaction.user.id) return;

      pendingSetups.delete(id);
      if (action === 'cancel_setup') {
        return interaction.editReply({ content: '✅ Cancelled. Nothing was changed.', components: [] }).catch(() => {});
      }

      if (job.clearOnly) {
        await interaction.editReply({ content: '⏳ Deleting all channels in this server...', components: [] }).catch(() => {});
        await executeClearChannels(interaction.guild, interaction.channelId, job.keepFreshGeneral);
        return;
      }

      await interaction
        .editReply({ content: `⏳ Clearing old channels and building the **${job.label}** layout...`, components: [] })
        .catch(() => {});
      await executeSetup(interaction.guild, job, interaction.channelId);
    }
  } catch (err) {
    if (err?.code === 10062) return;
    console.error('Interaction error:', err);
    const msg = { content: `❌ Something went wrong: ${err.message}`, flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(msg).catch(() => {});
    } else if (interaction.isRepliable()) {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const token = process.env.DISCORD_TOKEN?.trim();
  if (!token || token === 'paste_your_discord_bot_token_here' || token === 'isi_token_bot_discord_kamu_disini') {
    console.error('❌ DISCORD_TOKEN is missing. Add your bot token to the .env file first.');
    process.exit(1);
  }
  client.login(token).catch((err) => {
    if (err?.code === 'DisallowedIntents' || /disallowed intents/i.test(String(err?.message))) {
      console.error(
        '❌ Privileged Intents are disabled! Open Discord Developer Portal under Bot and Privileged Gateway Intents, turn ON Presence Intent and Server Members Intent, click Save Changes, then run npm start again.'
      );
    } else {
      console.error('❌ Login failed:', err.message);
    }
    process.exit(1);
  });
}
