import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_PATH = resolve(process.cwd(), '.env');

export const config = {
  get PORT() {
    return Number(process.env.PORT || 3001);
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET || 'archibot_jwt_dashboard_secret_2026_default';
  },
  get FRONTEND_URL() {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  },
  get DISCORD_TOKEN() {
    return process.env.DISCORD_TOKEN?.trim() || '';
  },
  get DISCORD_CLIENT_ID() {
    return process.env.DISCORD_CLIENT_ID?.trim() || '';
  },
  get DISCORD_CLIENT_SECRET() {
    return process.env.DISCORD_CLIENT_SECRET?.trim() || '';
  },
  get DISCORD_REDIRECT_URI() {
    return process.env.DISCORD_REDIRECT_URI?.trim() || 'http://localhost:5173/api/auth/callback';
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
