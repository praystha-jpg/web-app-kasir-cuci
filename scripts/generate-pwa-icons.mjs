import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple CRC32 implementation
function makeCRCTable() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}
const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePNG(width, height, drawFn) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width(4), height(4), bitDepth(1), colorType(6=RGBA), comp(0), filter(0), interlace(0)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per channel
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineSize * height);

  for (let y = 0; y < height; y++) {
    const lineOffset = y * scanlineSize;
    rawData[lineOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = lineOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw brand icon
function drawBrandIcon(x, y, width, height, isMaskable = false) {
  const normX = x / width;
  const normY = y / height;
  const dx = normX - 0.5;
  const dy = normY - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: #2563eb to #0f172a
  const t = (normX + normY) * 0.5;
  let bgR = Math.round(37 * (1 - t) + 15 * t);
  let bgG = Math.round(99 * (1 - t) + 23 * t);
  let bgB = Math.round(235 * (1 - t) + 42 * t);
  let bgA = 255;

  if (!isMaskable) {
    // Rounded squircle mask for non-maskable icons
    const radius = 0.44;
    // Approximated squircle: (|x|^4 + |y|^4)
    const squircleDist = Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dy), 4);
    if (squircleDist > Math.pow(radius, 4)) {
      return [0, 0, 0, 0]; // Transparent outer
    }
  }

  // Car icon geometry scaled inside center
  const scale = isMaskable ? 0.65 : 0.8;
  const cx = (normX - 0.5) / scale + 0.5;
  const cy = (normY - 0.5) / scale + 0.5;

  // Car Body area
  // Wheels
  const wheelLeftDist = Math.sqrt(Math.pow(cx - 0.35, 2) + Math.pow(cy - 0.66, 2));
  const wheelRightDist = Math.sqrt(Math.pow(cx - 0.68, 2) + Math.pow(cy - 0.66, 2));

  if (wheelLeftDist < 0.11 || wheelRightDist < 0.11) {
    if (wheelLeftDist < 0.04 || wheelRightDist < 0.04) {
      return [255, 255, 255, 255]; // Hubcap center
    }
    if (wheelLeftDist < 0.07 || wheelRightDist < 0.07) {
      return [148, 163, 184, 255]; // Rim
    }
    return [15, 23, 42, 255]; // Tire
  }

  // Car cabin & base
  const inCarBase = cx >= 0.20 && cx <= 0.82 && cy >= 0.50 && cy <= 0.64;
  const inCarRoof = cx >= 0.32 && cx <= 0.70 && cy >= 0.35 && cy <= 0.50;
  const inCarWindowFront = cx >= 0.53 && cx <= 0.67 && cy >= 0.38 && cy <= 0.49;
  const inCarWindowBack = cx >= 0.35 && cx <= 0.49 && cy >= 0.38 && cy <= 0.49;

  if (inCarWindowFront || inCarWindowBack) {
    return [30, 58, 138, 255]; // Window deep blue
  }

  if (inCarRoof || inCarBase) {
    return [255, 255, 255, 255]; // Car white body
  }

  // Sparkles / Soap bubbles
  const bubble1 = Math.sqrt(Math.pow(cx - 0.32, 2) + Math.pow(cy - 0.25, 2));
  const bubble2 = Math.sqrt(Math.pow(cx - 0.68, 2) + Math.pow(cy - 0.22, 2));
  if (bubble1 < 0.05 || bubble2 < 0.04) {
    return [56, 189, 248, 240]; // Light cyan bubble
  }

  // Water arc below car
  if (cy >= 0.76 && cy <= 0.80 && cx >= 0.22 && cx <= 0.80) {
    return [56, 189, 248, 230];
  }

  return [bgR, bgG, bgB, bgA];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate standard icons
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(
  path.join(publicDir, 'pwa-192x192.png'),
  generatePNG(192, 192, (x, y, w, h) => drawBrandIcon(x, y, w, h, false))
);

console.log('Generating pwa-512x512.png...');
fs.writeFileSync(
  path.join(publicDir, 'pwa-512x512.png'),
  generatePNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, false))
);

console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(
  path.join(publicDir, 'pwa-maskable-512x512.png'),
  generatePNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, true))
);

console.log('Generating apple-touch-icon.png (180x180)...');
fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon.png'),
  generatePNG(180, 180, (x, y, w, h) => drawBrandIcon(x, y, w, h, false))
);

console.log('PWA icons successfully generated in /public!');
