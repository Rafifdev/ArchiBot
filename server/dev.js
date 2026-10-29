import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dashboardDir = path.join(rootDir, 'dashboard');
const viteBin = path.join(dashboardDir, 'node_modules', 'vite', 'bin', 'vite.js');

// Start Backend + Bot
import('./index.js');

// Start Vite Dev Server directly via Node (works seamlessly across both Windows and WSL)
const viteProc = spawn(process.execPath, [viteBin], {
  cwd: dashboardDir,
  stdio: 'inherit',
});

viteProc.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`ℹ️ Vite dev server exited with code ${code}. Dashboard remains available at http://localhost:3001`);
  }
});

process.on('exit', () => {
  try { viteProc.kill(); } catch {}
});
process.on('SIGINT', () => {
  try { viteProc.kill(); } catch {}
  process.exit(0);
});
process.on('SIGTERM', () => {
  try { viteProc.kill(); } catch {}
  process.exit(0);
});
