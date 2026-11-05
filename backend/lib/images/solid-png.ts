import { crc32, deflateSync } from 'node:zlib';

export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(Number(crc32(Buffer.concat([typeBuf, data]))) >>> 0, 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

/** 8-bit RGB PNG. No dependencies beyond Node's zlib. */
export function encodeRgbPng(width: number, height: number, rgb: Uint8Array): Uint8Array {
  if (rgb.length !== width * height * 3) {
    throw new Error('PNG buffer has the wrong size.');
  }
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    rgb.subarray(y * width * 3, (y + 1) * width * 3).forEach((byte, index) => {
      raw[row + 1 + index] = byte;
    });
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return new Uint8Array(png);
}

function paint(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number],
): Uint8Array {
  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixel(x, y);
      const index = (y * width + x) * 3;
      rgb[index] = r;
      rgb[index + 1] = g;
      rgb[index + 2] = b;
    }
  }
  return encodeRgbPng(width, height, rgb);
}

/** Small card used as a thumbnail or cover when the image model is not called. */
export function cardPng(palette: {
  background: string;
  ground: string;
  player: string;
}, wide: boolean): Uint8Array {
  const width = wide ? 320 : 160;
  const height = wide ? 180 : 160;
  const background = hexToRgb(palette.background);
  const ground = hexToRgb(palette.ground);
  const player = hexToRgb(palette.player);
  const groundY = Math.floor(height * 0.72);
  const cx = Math.floor(width * 0.38);
  const cy = Math.floor(height * 0.48);
  const radius = Math.floor(height * 0.16);
  return paint(width, height, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= radius * radius) return player;
    if (y >= groundY) return ground;
    return background;
  });
}
