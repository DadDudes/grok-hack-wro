import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = readFileSync(path.join(root, 'public/phaser/runtime.js'));

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(Number(crc32(Buffer.concat([typeBuf, data]))) >>> 0, 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function encodePng(width, height, paint) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y, width, height);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const images = {
  '/img/character.png': encodePng(1024, 1400, (x, y, w, h) => {
    const dx = x - w * 0.5;
    const dy = y - h * 0.42;
    if (dx * dx + dy * dy < 180 * 180) return [40, 90, 200];
    if (Math.abs(x - w * 0.5) < 90 && y > h * 0.48 && y < h * 0.82) return [30, 70, 160];
    return [255, 255, 255];
  }),
  '/img/item.png': encodePng(1024, 1024, (x, y, w, h) => {
    const dx = x - w * 0.5;
    const dy = y - h * 0.48;
    if ((dx * dx) / (200 * 200) + (dy * dy) / (260 * 260) < 1) return [80, 190, 120];
    return [255, 255, 255];
  }),
  '/img/background.png': encodePng(1280, 720, (x, y, w, h) => {
    if (y > h * 0.72) return [90, 140, 80];
    return [120, 190, 230];
  }),
};

function tasks(prefix) {
  return [1, 2, 3].map((n) => ({
    id: `${prefix}-${n}`,
    prompt: `${prefix} question ${n}`,
    answer: `${prefix}-yes-${n}`,
    distractors: [`${prefix}-no-a-${n}`, `${prefix}-no-b-${n}`],
    explanation: 'Try the other one.',
    difficulty: 1,
  }));
}

function spec(template, prefix) {
  return {
    version: 1,
    gameId: '550e8400-e29b-41d4-a716-446655440000',
    template,
    language: 'pl',
    ageBand: 'mid',
    title: prefix,
    instructions: 'Use keys or buttons.',
    theme: {
      name: prefix,
      characterName: 'Mila',
      palette: {
        background: '#8ecae6',
        ground: '#588157',
        player: '#f4d35e',
        item: '#e76f51',
        accent: '#1d3557',
        text: '#1d3557',
      },
    },
    assets: {
      characterUrl: '/img/character.png',
      backgroundUrl: '/img/background.png',
      itemUrl: '/img/item.png',
      thumbnailUrl: null,
      coverUrl: null,
    },
    tasks: tasks(prefix),
    texts: {
      score: 'Punkty',
      correct: 'Dobrze!',
      wrong: 'Nie.',
      winTitle: 'Koniec',
      winBody: 'Gotowe.',
      playAgain: 'Jeszcze raz',
      jump: 'Skok',
      left: 'Lewo',
      right: 'Prawo',
    },
    rules: { goal: 3 },
    resultsUrl: '',
    source: 'fallback',
    agents: { pedagog: 'test', designer: 'test', grafik: 'test' },
    extensions: { teammate: { enabled: false }, analyst: { enabled: false } },
  };
}

function page(template, prefix) {
  const json = JSON.stringify(spec(template, prefix)).replaceAll('<', '\\u003c');
  return `<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${prefix}</title>
<style>html,body{margin:0;height:100%;background:#111}body{overflow:hidden}#game{width:100%;height:100%}</style>
</head><body><div id="game"></div>
<script id="game-spec" type="application/json">${json}</script>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>
<script src="/phaser/runtime.js"></script></body></html>`;
}

const pages = {
  '/collect.html': page('collect', 'Collect'),
  '/runner.html': page('runner', 'Runner'),
  '/quiz.html': page('quiz', 'Quiz'),
};

const server = createServer((request, response) => {
  const url = request.url?.split('?')[0] ?? '/';
  if (url === '/phaser/runtime.js') {
    response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    response.end(runtime);
    return;
  }
  if (images[url]) {
    response.writeHead(200, { 'content-type': 'image/png', 'content-disposition': 'inline' });
    response.end(images[url]);
    return;
  }
  if (pages[url]) {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(pages[url]);
    return;
  }
  response.writeHead(404);
  response.end('no');
});

server.listen(3011, '127.0.0.1', () => {
  console.log('ready http://127.0.0.1:3011');
});
