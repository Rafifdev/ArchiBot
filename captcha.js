import { randomInt } from 'node:crypto';
import { deflateSync } from 'node:zlib';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const GLYPHS = {
  0: ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

const PALETTE = [
  [88, 101, 242],
  [87, 242, 135],
  [254, 231, 92],
  [235, 69, 158],
  [52, 152, 219],
  [26, 188, 156],
];

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function encodePng(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function generateCaptcha(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  const width = 320;
  const height = 110;
  const pixels = Buffer.alloc(width * height * 4);

  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = 255;
  }

  function fillCircle(cx, cy, radius, r, g, b) {
    const r2 = radius * radius;
    const minX = Math.floor(cx - radius);
    const maxX = Math.ceil(cx + radius);
    const minY = Math.floor(cy - radius);
    const maxY = Math.ceil(cy + radius);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) setPixel(x, y, r, g, b);
      }
    }
  }

  // Dark card background with subtle grid
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grid = x % 20 === 0 || y % 20 === 0;
      setPixel(x, y, grid ? 43 : 30, grid ? 45 : 31, grid ? 49 : 34);
    }
  }

  // Background noise dots
  for (let i = 0; i < 160; i++) {
    const [r, g, b] = PALETTE[randomInt(PALETTE.length)];
    fillCircle(randomInt(width), randomInt(height), 1.2, r >> 1, g >> 1, b >> 1);
  }

  // Distorted characters
  const scale = 7;
  const wavePhase = randomInt(100) / 15;
  for (let i = 0; i < code.length; i++) {
    const glyph = GLYPHS[code[i]];
    const [r, g, b] = PALETTE[randomInt(PALETTE.length)];
    const angle = (randomInt(-28, 29) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const centerX = 46 + i * 56 + randomInt(-4, 5);
    const centerY = 55 + randomInt(-8, 9);

    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] !== '1') continue;
        const lx = (gx - 2) * scale;
        const ly = (gy - 3) * scale;
        for (let sy = -2; sy <= 2; sy++) {
          for (let sx = -2; sx <= 2; sx++) {
            const px = lx + sx;
            const py = ly + sy;
            const rx = px * cos - py * sin;
            const ry = px * sin + py * cos;
            const warpX = Math.sin((ry + centerY) / 9 + wavePhase) * 3;
            fillCircle(centerX + rx + warpX, centerY + ry, 1.8, r, g, b);
          }
        }
      }
    }
  }

  // Curved interference lines
  for (let line = 0; line < 3; line++) {
    const [r, g, b] = PALETTE[randomInt(PALETTE.length)];
    const baseY = randomInt(25, height - 25);
    const amp = randomInt(8, 20);
    const freq = randomInt(18, 34);
    const phase = randomInt(100) / 10;
    for (let x = 8; x < width - 8; x++) {
      const y = baseY + Math.sin(x / freq + phase) * amp;
      fillCircle(x, y, 1.3, r, g, b);
    }
  }

  return { code, buffer: encodePng(width, height, pixels) };
}

export function generateMilestoneBanner(count) {
  const width = 560;
  const height = 150;
  const pixels = Buffer.alloc(width * height * 4);

  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = 255;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const border = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      const innerFrame =
        (x === 10 || x === width - 11 || y === 10 || y === height - 11) &&
        x >= 10 &&
        x <= width - 11 &&
        y >= 10 &&
        y <= height - 11;
      if (border) setPixel(x, y, 241, 196, 15);
      else if (innerFrame) setPixel(x, y, 120, 98, 20);
      else setPixel(x, y, 24, 25, 32);
    }
  }

  for (let i = 0; i < 90; i++) {
    const [r, g, b] = PALETTE[randomInt(PALETTE.length)];
    const cx = randomInt(16, width - 16);
    const cy = randomInt(16, height - 16);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) setPixel(cx + dx, cy + dy, r, g, b);
    }
  }

  function drawCenteredText(topY, text, scale, r, g, b, shadow = false) {
    const upper = String(text).toUpperCase();
    const totalW = [...upper].reduce((w, ch) => w + (ch === ' ' ? 4 : 6) * scale, 0) - scale;
    let curX = Math.floor((width - totalW) / 2);
    for (const ch of upper) {
      if (ch === ' ') {
        curX += 4 * scale;
        continue;
      }
      const glyph = GLYPHS[ch];
      if (glyph) {
        for (let gy = 0; gy < 7; gy++) {
          for (let gx = 0; gx < 5; gx++) {
            if (glyph[gy][gx] !== '1') continue;
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                if (shadow) setPixel(curX + gx * scale + sx + 2, topY + gy * scale + sy + 2, 130, 95, 10);
                setPixel(curX + gx * scale + sx, topY + gy * scale + sy, r, g, b);
              }
            }
          }
        }
      }
      curX += 6 * scale;
    }
  }

  const headline = `${count} MEMBERS`;
  const mainScale = headline.length > 13 ? 4 : 5;
  drawCenteredText(28, 'COMMUNITY MILESTONE', 2, 241, 196, 15, false);
  drawCenteredText(62, headline, mainScale, 255, 255, 255, true);

  for (let y = 118; y <= 120; y++) {
    for (let x = 200; x < 360; x++) setPixel(x, y, 241, 196, 15);
  }

  return encodePng(width, height, pixels);
}
