import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_PATH = resolve(process.cwd(), '.env');

function getEnv(key, defaultVal = '') {
  if (process.env[key]?.trim()) return process.env[key].trim();
  if (existsSync(ENV_PATH)) {
    try {
      const content = readFileSync(ENV_PATH, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match && match[1]?.trim()) return match[1].trim();
    } catch {}
  }
  return defaultVal;
}

export const config = {
  get PORT() {
    return Number(getEnv('PORT', '3001'));
  },
  get JWT_SECRET() {
    return getEnv('JWT_SECRET', 'archibot_jwt_dashboard_secret_2026_default');
  },
  get FRONTEND_URL() {
    return getEnv('FRONTEND_URL', 'http://localhost:5173');
  },
  get DISCORD_TOKEN() {
    return getEnv('DISCORD_TOKEN');
  },
  get DISCORD_CLIENT_ID() {
    return getEnv('DISCORD_CLIENT_ID');
  },
  get DISCORD_CLIENT_SECRET() {
    return getEnv('DISCORD_CLIENT_SECRET');
  },
  get DISCORD_REDIRECT_URI() {
    return getEnv('DISCORD_REDIRECT_URI', 'http://localhost:5173/api/auth/callback');
  },
};

export function updateEnvFile(updates = {}) {
  let content = '';
  if (existsSync(ENV_PATH)) {
    content = readFileSync(ENV_PATH, 'utf8');
  }

  for (const [key, val] of Object.entries(updates)) {
    process.env[key] = String(val);
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${val}`);
    } else {
      content = content.trim() ? `${content.trim()}\n${key}=${val}\n` : `${key}=${val}\n`;
    }
  }

  writeFileSync(ENV_PATH, content, 'utf8');
  return true;
}
