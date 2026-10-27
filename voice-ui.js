import { encodePng } from './captcha.js';

export const VOICE_INTERFACE_ITEMS = [
  { key: 'rename', emojiName: 'tv_name', label: 'Name', fallback: '✏️' },
  { key: 'limit', emojiName: 'tv_limit', label: 'Limit', fallback: '👥' },
  { key: 'privacy', emojiName: 'tv_privacy', label: 'Privacy', fallback: '🛡️' },
  { key: 'waiting', emojiName: 'tv_waiting', label: 'Waiting', fallback: '🕒' },
  { key: 'chat', emojiName: 'tv_chat', label: 'Chat', fallback: '💬' },
  { key: 'trust', emojiName: 'tv_trust', label: 'Trust', fallback: '✅' },
  { key: 'untrust', emojiName: 'tv_untrust', label: 'Untrust', fallback: '➖' },
  { key: 'invite', emojiName: 'tv_invite', label: 'Invite', fallback: '📞' },
  { key: 'kick', emojiName: 'tv_kick', label: 'Kick', fallback: '📵' },
  { key: 'region', emojiName: 'tv_region', label: 'Region', fallback: '🌐' },
  { key: 'block', emojiName: 'tv_block', label: 'Block', fallback: '🚫' },
  { key: 'unblock', emojiName: 'tv_unblock', label: 'Unblock', fallback: '⭕' },
  { key: 'claim', emojiName: 'tv_claim', label: 'Claim', fallback: '👑' },
  { key: 'transfer', emojiName: 'tv_transfer', label: 'Transfer', fallback: '🔁' },
  { key: 'delete', emojiName: 'tv_delete', label: 'Delete', fallback: '🗑️' },
];

const CHAR_WIDTH = {
  I: 3.9,
  i: 3.5,
  l: 3.5,
  f: 4.8,
  t: 5.1,
  r: 5.2,
  s: 6.8,
  v: 7.1,
  c: 7.2,
  y: 7.2,
  k: 7.3,
  a: 7.6,
  e: 7.6,
  L: 7.8,
  g: 7.9,
  h: 7.9,
  n: 7.9,
  u: 7.9,
  o: 8.0,
  b: 8.1,
  d: 8.1,
  T: 8.4,
  P: 8.8,
  K: 9.0,
  B: 9.1,
  R: 9.1,
  C: 9.5,
  D: 9.8,
  U: 9.9,
  N: 10.1,
  m: 11.9,
  W: 13.2,
};

export function padVoiceLabel(text, targetPx = 55) {
  let width = 0;
  for (const ch of text) width += CHAR_WIDTH[ch] ?? 7.6;
  let rem = targetPx - width;
  if (rem < 4) return text;
  const brailleCount = Math.max(1, Math.floor(rem / 7.5));
  rem -= brailleCount * 7.5;
  const thinCount = rem > 1.2 ? Math.round(rem / 2.5) : 0;
  return text + '\u2009'.repeat(thinCount) + '\u2800'.repeat(brailleCount);
}

const SILVER = [196, 201, 206];
const DIM_SILVER = [145, 150, 158];
const GREEN = [67, 181, 129];
const RED = [240, 71, 71];
const GOLD = [250, 168, 26];

function makeSurface(width, height) {
  const pixels = Buffer.alloc(width * height * 4);

  function blend(x, y, color, alpha = 1) {
    if (x < 0 || x >= width || y < 0 || y >= height || alpha <= 0) return;
    const a = alpha > 1 ? 1 : alpha;
    const idx = (y * width + x) * 4;
    const dstA = pixels[idx + 3] / 255;
    const outA = a + dstA * (1 - a);
    if (outA <= 0) return;
    pixels[idx] = Math.round((color[0] * a + pixels[idx] * dstA * (1 - a)) / outA);
    pixels[idx + 1] = Math.round((color[1] * a + pixels[idx + 1] * dstA * (1 - a)) / outA);
    pixels[idx + 2] = Math.round((color[2] * a + pixels[idx + 2] * dstA * (1 - a)) / outA);
    pixels[idx + 3] = Math.round(outA * 255);
  }

  function erase(x, y, alpha = 1) {
    if (x < 0 || x >= width || y < 0 || y >= height || alpha <= 0) return;
    const idx = (y * width + x) * 4;
    pixels[idx + 3] = Math.round(pixels[idx + 3] * (1 - Math.min(1, alpha)));
  }

  function disc(cx, cy, radius, color, cut = false) {
    const minX = Math.floor(cx - radius - 1);
    const maxX = Math.ceil(cx + radius + 1);
    const minY = Math.floor(cy - radius - 1);
    const maxY = Math.ceil(cy + radius + 1);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cov = radius + 0.5 - Math.hypot(x - cx, y - cy);
        if (cov > 0) {
          if (cut) erase(x, y, cov);
          else blend(x, y, color, cov);
        }
      }
    }
  }

  function ring(cx, cy, radius, thickness, color) {
    const half = thickness / 2;
    const outer = radius + half + 1;
    const minX = Math.floor(cx - outer);
    const maxX = Math.ceil(cx + outer);
    const minY = Math.floor(cy - outer);
    const maxY = Math.ceil(cy + outer);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cov = half + 0.5 - Math.abs(Math.hypot(x - cx, y - cy) - radius);
        if (cov > 0) blend(x, y, color, cov);
      }
    }
  }

  function seg(x1, y1, x2, y2, thickness, color, cut = false) {
    const half = thickness / 2;
    const minX = Math.floor(Math.min(x1, x2) - half - 1);
    const maxX = Math.ceil(Math.max(x1, x2) + half + 1);
    const minY = Math.floor(Math.min(y1, y2) - half - 1);
    const maxY = Math.ceil(Math.max(y1, y2) + half + 1);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
        const cov = half + 0.5 - Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
        if (cov > 0) {
          if (cut) erase(x, y, cov);
          else blend(x, y, color, cov);
        }
      }
    }
  }

  function rrect(rx, ry, rw, rh, rad, color) {
    const r = Math.min(rad, rw / 2, rh / 2);
    const minX = Math.floor(rx - 1);
    const maxX = Math.ceil(rx + rw + 1);
    const minY = Math.floor(ry - 1);
    const maxY = Math.ceil(ry + rh + 1);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const qx = Math.max(rx + r - x, 0, x - (rx + rw - r));
        const qy = Math.max(ry + r - y, 0, y - (ry + rh - r));
        const cov = r + 0.5 - Math.hypot(qx, qy);
        if (cov > 0) blend(x, y, color, cov);
      }
    }
  }

  return { pixels, disc, ring, seg, rrect };
}

export function renderVoiceEmojiPng(key) {
  const surf = makeSurface(64, 64);

  function drawUser(cx, color) {
    surf.disc(cx, 21, 9.5, color);
    surf.rrect(cx - 16, 34, 32, 16, 8, color);
  }

  function drawPlusBadge(cx, cy, color) {
    surf.disc(cx, cy, 12, null, true);
    surf.disc(cx, cy, 10, color);
    surf.seg(cx, cy - 5, cx, cy + 5, 3.2, null, true);
    surf.seg(cx - 5, cy, cx + 5, cy, 3.2, null, true);
  }

  function drawBanBadge(cx, cy, color) {
    surf.disc(cx, cy, 11.5, null, true);
    surf.ring(cx, cy, 8.5, 3.5, color);
    surf.seg(cx - 5.5, cy + 5.5, cx + 5.5, cy - 5.5, 3.5, color);
  }

  function drawHandset() {
    surf.seg(16, 19, 23, 36, 6.5, SILVER);
    surf.seg(23, 36, 36, 45, 6.5, SILVER);
    surf.seg(36, 45, 47, 48, 6.5, SILVER);
    surf.disc(18, 17, 5.5, SILVER);
    surf.disc(47, 46, 5.5, SILVER);
  }

  function drawCrown() {
    surf.rrect(14, 35, 36, 13, 3, GOLD);
    surf.seg(14, 44, 11, 22, 5.5, GOLD);
    surf.seg(11, 22, 23, 35, 5.5, GOLD);
    surf.seg(23, 35, 32, 16, 5.5, GOLD);
    surf.seg(32, 16, 41, 35, 5.5, GOLD);
    surf.seg(41, 35, 53, 22, 5.5, GOLD);
    surf.seg(53, 22, 50, 44, 5.5, GOLD);
  }

  if (key === 'rename') {
    surf.seg(32, 10, 32, 54, 4.5, SILVER);
    surf.seg(14, 20, 24, 20, 4.2, SILVER);
    surf.seg(14, 20, 14, 44, 4.2, SILVER);
    surf.seg(14, 44, 24, 44, 4.2, SILVER);
    surf.seg(40, 20, 50, 20, 4.2, SILVER);
    surf.seg(50, 20, 50, 44, 4.2, SILVER);
    surf.seg(40, 44, 50, 44, 4.2, SILVER);
  } else if (key === 'limit') {
    surf.disc(43, 24, 7.5, DIM_SILVER);
    surf.rrect(31, 35, 24, 14, 7, DIM_SILVER);
    surf.disc(24, 22, 11, null, true);
    surf.disc(24, 22, 9, SILVER);
    surf.rrect(9, 34, 30, 16, 8, SILVER);
  } else if (key === 'privacy') {
    surf.seg(32, 10, 50, 17, 4.2, SILVER);
    surf.seg(50, 17, 47, 37, 4.2, SILVER);
    surf.seg(47, 37, 32, 54, 4.2, SILVER);
    surf.seg(32, 10, 14, 17, 4.2, SILVER);
    surf.seg(14, 17, 17, 37, 4.2, SILVER);
    surf.seg(17, 37, 32, 54, 4.2, SILVER);
    surf.disc(32, 29, 3.8, SILVER);
    surf.seg(32, 31, 32, 40, 3.5, SILVER);
  } else if (key === 'waiting') {
    surf.ring(32, 32, 20, 4.2, GOLD);
    surf.seg(32, 32, 32, 19, 4.2, GOLD);
    surf.seg(32, 32, 41, 39, 4.2, GOLD);
  } else if (key === 'chat') {
    surf.seg(21, 12, 17, 44, 4, SILVER);
    surf.seg(34, 12, 30, 44, 4, SILVER);
    surf.seg(12, 22, 40, 22, 4, SILVER);
    surf.seg(10, 34, 36, 34, 4, SILVER);
    surf.rrect(33, 33, 21, 16, 4, SILVER);
    surf.seg(40, 48, 37, 54, 4, SILVER);
  } else if (key === 'trust') {
    drawUser(27, SILVER);
    drawPlusBadge(45, 43, GREEN);
  } else if (key === 'untrust') {
    drawUser(27, SILVER);
    drawPlusBadge(45, 43, DIM_SILVER);
    surf.seg(15, 52, 47, 12, 7, null, true);
    surf.seg(15, 52, 47, 12, 4.2, SILVER);
  } else if (key === 'invite') {
    drawHandset();
    drawPlusBadge(42, 20, GREEN);
  } else if (key === 'kick') {
    drawHandset();
    drawBanBadge(42, 20, RED);
  } else if (key === 'region') {
    surf.ring(32, 32, 20, 4, SILVER);
    surf.seg(13, 32, 51, 32, 3.2, SILVER);
    surf.seg(32, 13, 32, 51, 3.2, SILVER);
    surf.seg(17, 22, 47, 22, 2.8, SILVER);
    surf.seg(17, 42, 47, 42, 2.8, SILVER);
  } else if (key === 'block') {
    drawUser(27, SILVER);
    drawBanBadge(45, 43, RED);
  } else if (key === 'unblock') {
    drawUser(27, SILVER);
    drawBanBadge(45, 43, RED);
    surf.seg(15, 52, 47, 12, 7, null, true);
    surf.seg(15, 52, 47, 12, 4.2, SILVER);
  } else if (key === 'claim') {
    drawCrown();
  } else if (key === 'transfer') {
    drawCrown();
    surf.seg(18, 52, 49, 15, 7.5, null, true);
    surf.seg(18, 52, 49, 15, 4.5, RED);
    surf.seg(37, 15, 49, 15, 4.2, RED);
    surf.seg(49, 15, 49, 27, 4.2, RED);
  } else if (key === 'delete') {
    surf.rrect(15, 15, 34, 5, 2.5, RED);
    surf.rrect(25, 10, 14, 5, 2, RED);
    surf.rrect(19, 23, 26, 30, 4, RED);
    surf.seg(26, 28, 26, 47, 2.8, null, true);
    surf.seg(32, 28, 32, 47, 2.8, null, true);
    surf.seg(38, 28, 38, 47, 2.8, null, true);
  }

  return encodePng(64, 64, surf.pixels);
}
