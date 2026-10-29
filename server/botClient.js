import {
  client,
  state,
  saveState,
  toSlug,
  getFixedChannelIds,
  syncGuildStats,
  scheduleStatsSync,
  cacheGuildInvites,
  ensureVerifiedRole,
  ensureMemberRole,
  executeClearChannels,
  executeSetup,
  applyVoicePrivacy,
  cleanupVoiceRoom,
  sendFreshVoicePanel,
  buildCaptchaCard,
  ensureCategory,
  ensureChannel,
  DANGEROUS_PERMS,
  COMMANDS,
  MINIGAME_BOTS,
  MUSIC_BOTS,
} from '../bot.js';
import { TEMPLATES, LEGO_MODULES, GENDER_ROLES } from '../templates.js';
import { config } from './config.js';

let loginPromise = null;

export async function ensureBotReady() {
  if (client.isReady()) return client;

  if (!loginPromise) {
    const token = config.DISCORD_TOKEN;
    if (!token || token === 'paste_your_discord_bot_token_here') {
      console.warn('⚠️ Warning: DISCORD_TOKEN is missing. Bot client cannot connect until token is provided.');
      return client;
    }
    loginPromise = new Promise((resolve, reject) => {
      if (client.isReady()) {
        resolve(client);
        return;
      }
      const onReady = () => resolve(client);
      client.once('clientReady', onReady);
      client.once('ready', onReady);
      client.login(token).catch((err) => {
        loginPromise = null;
        console.error('❌ Bot login failed:', err.message);
        reject(err);
      });
    });
  }

  await loginPromise;
  return client;
}

export {
  client,
  state,
  saveState,
  toSlug,
  getFixedChannelIds,
  syncGuildStats,
  scheduleStatsSync,
  cacheGuildInvites,
  ensureVerifiedRole,
  ensureMemberRole,
  executeClearChannels,
  executeSetup,
  applyVoicePrivacy,
  cleanupVoiceRoom,
  sendFreshVoicePanel,
  buildCaptchaCard,
  ensureCategory,
  ensureChannel,
  DANGEROUS_PERMS,
  COMMANDS,
  TEMPLATES,
  LEGO_MODULES,
  GENDER_ROLES,
  MINIGAME_BOTS,
  MUSIC_BOTS,
};
