import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';
import { ensureBotReady } from './botClient.js';

import authRoutes from './routes/auth.js';
import overviewRoutes from './routes/overview.js';
import channelsRoutes from './routes/channels.js';
import rolesRoutes from './routes/roles.js';
import membersRoutes from './routes/members.js';
import architectRoutes from './routes/architect.js';
import voiceRoutes from './routes/voice.js';
import embedsRoutes from './routes/embeds.js';
import backupsRoutes from './routes/backups.js';
import settingsRoutes from './routes/settings.js';

const app = express();

// Handle BigInt serialization for Discord.js bitfields
app.set('json replacer', (_key, value) => (typeof value === 'bigint' ? value.toString() : value));

// Middleware
app.use(
  cors({
    origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/guilds', overviewRoutes);
app.use('/api/guilds', channelsRoutes);
app.use('/api/guilds', rolesRoutes);
app.use('/api/guilds', membersRoutes);
app.use('/api/guilds', architectRoutes);
app.use('/api/guilds', voiceRoutes);
app.use('/api/guilds', embedsRoutes);
app.use('/api/guilds', backupsRoutes);
app.use('/api/guilds', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: config.PORT,
  });
});

// Serve frontend build if exists in production
const dashboardDistPath = resolve(process.cwd(), 'dashboard', 'dist');
if (existsSync(dashboardDistPath)) {
  app.use(express.static(dashboardDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(resolve(dashboardDistPath, 'index.html'));
  });
}

// Start bot and server
async function start() {
  console.log('🤖 Initializing ArchiBot client connection...');
  try {
    await ensureBotReady();
  } catch (err) {
    console.warn(`⚠️ Discord Client initialization notice: ${err.message}`);
  }

  app.listen(config.PORT, () => {
    console.log(`🌐 ArchiBot API & Web Dashboard is live at http://localhost:${config.PORT}`);
    console.log(`📡 Frontend dev proxy configured for http://localhost:5173`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
