# 🤖 ArchiBot — All-in-One Discord Server Architect

> Effortlessly architect, build, and manage production-ready Discord community servers with zero manual channel setup.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Discord.js Version](https://img.shields.io/badge/discord.js-v14.18.0-blue.svg)](https://discord.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Highlights

ArchiBot turns empty Discord servers into fully configured, beautifully organized communities in seconds. Whether you need a competitive gaming hub, a study lounge, or a custom layout built with modular Lego blocks, ArchiBot handles categories, permissions, voice hubs, bots, stats, and verification automatically.

- 🚀 **1-Click Server Templates** — General Hangout, Community Hub, Gaming Zone, Study & Tech, or Custom Layout.
- 🧱 **Lego Modular Custom Builder** — Build servers by toggling 12 preset Lego feature modules on/off directly from interactive Discord buttons, plus add custom channels with a 3-field form.
- ⚡ **`/create-channel` Command** — Create beautifully styled text channels, read-only announcements, voice rooms, stage channels, or category dividers on the fly without opening Discord Server Settings.
- 📊 **Real-Time Server Stats** — Auto-updating channels at the top showing current Date, Online/DND/Idle member status, and Total Members.
- 🛡️ **Anti-Raid Verification** — Self-contained image CAPTCHA panel with automatic Verified role assignment.
- 🎛️ **Join-to-Create Voice Rooms** — Dynamic voice room generator with a complete button interface (Rename, Limit, Lock, Unlock, Kick, Trust, Transfer, Bitrate, Region).
- 🎵 **Music & Minigame Bot Hubs** — Interactive Spotify and Jockie Music panel, plus pre-configured bot channels for OwO, Mudae, Karuta, Dank Memer, and Poketwo.
- 🏆 **Member Milestone Celebrations** — Automatic milestone progress tracker with generated celebration cards.
- 💾 **Server Layout Backup & Restore** — Snapshot your server channel structure and restore it anytime.

---

## 📋 Slash Commands

| Command | Permission | Description |
|---|---|---|
| `/setup` | Administrator | Build the server with a template (`general`, `community`, `games`, `study`, or `custom`) |
| `/create-channel` | Administrator | Create channels or category dividers without opening server settings |
| `/clear-channels` | Administrator | Delete all categories and channels in the server |
| `/auto-voice` | Administrator | Create a dedicated Join-to-Create voice generator hub |
| `/voice interface` | Staff / Admin | Post the Voice Room Controls panel |
| `/voice lock / unlock` | Member in VC | Lock or open your personal temporary voice room |
| `/voice limit` | Member in VC | Set maximum member limit for your room |
| `/voice rename` | Member in VC | Rename your personal voice room |
| `/voice claim` | Member in VC | Claim ownership if the room owner leaves |
| `/voice delete` | Member in VC | Immediately close your voice room |
| `/backup save` | Administrator | Save current server layout with a custom name |
| `/backup list` | Administrator | List all saved server backups |
| `/backup load` | Administrator | Load a saved server layout |
| `/backup delete` | Administrator | Remove a saved server layout |
| `/milestone set` | Administrator | Configure member milestone celebration intervals and goal targets |
| `/milestone check` | Administrator | View current milestone progress and next target |
| `/verify-panel` | Administrator | Post the image CAPTCHA verification panel |
| `/role-panel` | Administrator | Post self-assignable role buttons |
| `/ticket-panel` | Administrator | Post a private support ticket panel |
| `/help` | Everyone | View the interactive server guide and command documentation |

---

## 🧱 Lego Custom Server Builder

When running `/setup template: custom`, ArchiBot displays an interactive checklist of 12 Lego feature modules:

- 📢 **News and Info** — Announcements, tournament info, partner servers, team finder
- 🎪 **Events and Giveaways** — Community events, giveaways, event chat, stage podcast
- 💬 **Chat Lounge and Memes** — General chat, memes, bot commands
- 📸 **Member Galleries** — Photos, pets, food & drinks, art & edits
- 🎮 **Game Discussions** — Valorant, CS, Dota 2, Minecraft, Roblox, Genshin, MLBB, Free Fire, PUBG Mobile, Honor of Kings
- 🕹️ **Minigames Bot** — Dedicated channels for OwO, Mudae, Karuta, Dank Memer, Poketwo
- 📚 **Study and Tech** — Study resources, homework help, code & tech, progress share
- 🎵 **Music Area** — Music discussion, Spotify/Jockie Music request panel, Lofi Radio voice
- 🎮 **Casual Voice** — Voice settings, voice guide, auto voice generator, Casual rooms 1-3
- 🏆 **Competitive Voice** — Auto voice generator and ranked competitive rooms 1-3
- 🛋️ **Hangout Voice** — Voice settings, auto voice generator, Lounge rooms, Movie Night, AFK
- 🔇 **Study Focus Voice** — Auto study generator, Silent Study, Screen Share Study, AFK

Need custom channels? Click **`[ ➕ Add Custom Items ]`** to open a clean 3-field modal (Category Name, Text Channels, Voice Rooms) with zero syntax required.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20.0.0 or higher ([Download Node.js](https://nodejs.org/))
- A **Discord Bot Token** from the [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Discord Developer Portal Setup
1. Create a **New Application** and navigate to the **Bot** tab.
2. Under **Privileged Gateway Intents**, enable:
   - ✅ **Server Members Intent**
   - ✅ **Presence Intent**
3. Under **Bot Permissions**, grant **Administrator** (or *Manage Channels*, *Manage Roles*, *Move Members*, *Manage Messages*, *Connect*, *Speak*).
4. Generate the invite link under **OAuth2 > URL Generator** with `bot` and `applications.commands` scopes.
5. Invite the bot to your server.

### 3. Installation

Clone the repository:
```bash
git clone https://github.com/Rafifdev/ArchiBot.git
cd ArchiBot
```

Install dependencies:
```bash
npm install
```

Configure environment:
Copy `.env.example` to `.env` and paste your bot token:
```env
DISCORD_TOKEN=your_bot_token_here
```

### 4. Run the Bot
```bash
npm start
```

Run test suite:
```bash
npm test
```

---

## 🛡️ Security & Permissions

ArchiBot follows strict permission hygiene:
- Fixed `@everyone` permission overwrites prevent unverified accounts from speaking in read-only announcement channels.
- Verified accounts get access to standard community chats and voice rooms upon solving CAPTCHA.
- Dangerous administrative permissions (`Administrator`, `ManageGuild`, `BanMembers`) are excluded from self-assignable role panels.
- Temporary voice channels are isolated with ownership overrides, preventing griefing or unauthorized muting.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
