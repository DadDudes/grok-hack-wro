/**
 * Renders each template from a sample spec and screenshots it with headless Chrome.
 * Usage: node --experimental-strip-types --import ./scripts/register-alias.mjs scripts/screenshot-templates.ts
 */
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { emptyAssets, fallbackGameSpec } from '../lib/game-spec/fallback.ts';
import { renderPlayHtml } from '../lib/play/render-html.ts';

const outDir = process.env.SCREENSHOT_DIR ?? '/tmp/edubot-screenshots';
const samples = [
  {
    name: 'runner',
    parentPrompt: 'naucz mojego syna nazw części ciała po angielsku',
    childPrompt: 'chcę grę w której skacze się po górach!',
  },
  {
    name: 'collect',
    parentPrompt: 'naucz kolorów po angielsku',
    childPrompt: 'chcę zbierać gwiazdki',
  },
  {
    name: 'quiz',
    parentPrompt: 'nazwy zwierząt po angielsku',
    childPrompt: 'chcę quiz',
  },
] as const;

const pages = new Map<string, string>();
for (const [index, sample] of samples.entries()) {
  const spec = fallbackGameSpec({
    gameId: `550e8400-e29b-41d4-a716-44665544000${index + 1}`,
    parentPrompt: sample.parentPrompt,
    childPrompt: sample.childPrompt,
    childAge: 8,
    language: 'pl',
  });
  pages.set(`/${sample.name}.html`, renderPlayHtml({ ...spec, assets: emptyAssets() }));
}

const server = http.createServer((request, response) => {
  const url = request.url?.split('?')[0] ?? '/';
  if (url === '/phaser/runtime.js') {
    response.setHeader('content-type', 'text/javascript; charset=utf-8');
    createReadStream(path.join(import.meta.dirname, '../public/phaser/runtime.js')).pipe(response);
    return;
  }
  const html = pages.get(url);
  if (!html) {
    response.statusCode = 404;
    response.end('not found');
    return;
  }
  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.end(html);
});

await mkdir(outDir, { recursive: true });
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No port');
const port = address.port;

function chromeShot(name: string): Promise<void> {
  const file = path.join(outDir, `${name}.png`);
  const url = `http://127.0.0.1:${port}/${name}.html`;
  return new Promise((resolve, reject) => {
    const child = spawn(
      'google-chrome',
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        `--user-data-dir=/tmp/chrome-edubot-${name}`,
        '--window-size=1280,800',
        `--screenshot=${file}`,
        '--virtual-time-budget=12000',
        url,
      ],
      { stdio: 'inherit' },
    );
    const timer = setTimeout(() => child.kill('SIGKILL'), 20_000);
    child.on('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

for (const sample of samples) {
  await chromeShot(sample.name);
  const file = path.join(outDir, `${sample.name}.png`);
  const info = await stat(file);
  console.log(`${sample.name}\t${info.size}\t${file}`);
  if (info.size < 5000) throw new Error(`${sample.name} screenshot looks empty`);
}

server.close();
